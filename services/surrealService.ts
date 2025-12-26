
import { Surreal } from 'surrealdb';
import { GraphData, GraphNode, GraphEdge, NodeSchema, EdgeSchema } from '../types';
import { NEURALINDEX_DB_SCHEMA, PROJECT_DB_SCHEMA } from '../schemas/project_schema_index';

export interface SurrealConfig {
  mode: 'local' | 'cloud';
  url: string;
  user?: string;
  pass?: string;
  hostname?: string;
  instanceId?: string;
  authToken?: string;
  jwtConfig?: string;
  jwksEndpoint?: string;
}

// Architecture Alignment
const ROOT_NS = 'neuralnexus';
const ORG_DB = 'neuralindex'; // Global management database

class SurrealService {
  private db: Surreal;
  private connected: boolean = false;
  private currentProjectDB: string = '';

  constructor() {
    this.db = new Surreal();
  }

  async connect(config: SurrealConfig): Promise<boolean> {
    try {
      this.connected = false;

      let connectionUrl = '';
      if (config.mode === 'cloud') {
        const cleanHost = (config.hostname || '').replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/rpc$/, '');
        // Use wss for cloud, and ensure no trailing slashes interfere with handshake
        connectionUrl = `wss://${cleanHost}/rpc`;
      } else {
        connectionUrl = config.url || 'http://127.0.0.1:8000/rpc';
      }

      if (this.db) {
        try { await this.db.close(); } catch (e) { }
      }
      this.db = new Surreal();

      // Establish connection first
      await this.db.connect(connectionUrl);

      // Perform authentication
      if (config.mode === 'cloud' && config.authToken) {
        await this.db.authenticate(config.authToken);
      } else if (config.user && config.pass) {
        await this.db.signin({ user: config.user, pass: config.pass } as any);
      }

      // Select target scope
      await this.db.use({ namespace: ROOT_NS, database: ORG_DB });

      // Bootstrap NEURALINDEX (System DB)
      // We run the full schema definition. SurrealDB handles idempotency for definitions fairly well,
      // but to be safe/clean we might want to wrap in try/catch or assume it's okay.
      // The schema string contains many statements.
      try {
        await this.db.query(NEURALINDEX_DB_SCHEMA);
      } catch (e) {
        console.warn("Nexus: Warning during NeuralIndex bootstrap (might be existing definitions):", e);
      }

      this.connected = true;
      return true;
    } catch (e) {
      console.error('Nexus: Connection flow failed:', e);
      this.connected = false;
      throw e;
    }
  }

  async listProjects(): Promise<string[]> {
    if (!this.connected) return [];
    try {
      await this.db.use({ namespace: ROOT_NS, database: ORG_DB });
      const responses: any = await this.db.query('SELECT name FROM project ORDER BY created_at;');
      const projectRecords = responses[0]?.result || [];
      return projectRecords.map((p: any) => p.name);
    } catch (e) {
      console.error("Nexus: Failed to list projects:", e);
      return [];
    }
  }

  async createProject(name: string): Promise<string> {
    if (!this.connected) throw new Error("Not connected to SurrealDB");

    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // 1. Create Backblaze Bucket
    let bucketId = null;
    let bucketName = `neuralnexus-${sanitizedName}-${crypto.randomUUID().split('-')[0]}`.toLowerCase();

    try {
      const { mediaBucket } = await import('./backblaze_mediabucket');
      const bucketInfo = await mediaBucket.createBucket(bucketName);
      if (bucketInfo) {
        bucketId = bucketInfo.bucketId;
      } else {
        console.warn("Nexus: Failed to create B2 bucket, proceeding without storage.");
      }
    } catch (e) {
      console.error("Nexus: B2 Bucket creation error:", e);
    }

    // 2. Register in Global Index
    await this.db.use({ namespace: ROOT_NS, database: ORG_DB });
    await this.db.query('CREATE project SET name = $name, b2_bucket_id = $bid, b2_bucket_name = $bname, created_at = time::now();', {
      name: sanitizedName,
      bid: bucketId,
      bname: bucketName
    });

    // 2. Initialize the Project Database
    await this.db.use({ namespace: ROOT_NS, database: sanitizedName });

    // Apply Project Schema (Architecture & Content Tables)
    await this.db.query(PROJECT_DB_SCHEMA);

    // Create Root Node
    await this.db.create('node', {
      type: 'topic', // Using 'topic' as root usually fits well, or 'domain'
      title: name,
      summary: `The central nexus of the ${name} knowledge project.`,
      content: `# ${name}\n\nWelcome to your new knowledge project.`,
      val: 24,
      color: '#6366f1',
      // Coordinates can be left to default or flexible
      data: { root: true }
    } as any);

    this.currentProjectDB = sanitizedName;
    return sanitizedName;
  }

  async fetchGraphData(projectName: string): Promise<GraphData> {
    if (!this.connected || !projectName) return { nodes: [], links: [], nodeSchema: [], edgeSchema: [] };

    try {
      this.currentProjectDB = projectName;

      // 0. Load Project Config from Global Index (to get Bucket ID)
      await this.db.use({ namespace: ROOT_NS, database: ORG_DB });
      const projectQuery: any = await this.db.query('SELECT * FROM project WHERE name = $name', { name: projectName });
      const projectRecord = projectQuery[0]?.result[0];

      if (projectRecord && projectRecord.b2_bucket_id) {
        // Import mediaBucket only when needed to avoid circular div or just use global
        const { mediaBucket } = await import('./backblaze_mediabucket');
        mediaBucket.setBucket(projectRecord.b2_bucket_id);
      }

      // 1. Switch to Project DB
      await this.db.use({ namespace: ROOT_NS, database: projectName });

      // Fetch Schema (Architecture) and Content
      // Update table names: node_schema -> node_archtype, edge_schema -> edge_taxonomy
      const responses: any = await this.db.query(`
            SELECT * FROM node_archtype;
            SELECT * FROM edge_taxonomy;
            SELECT * FROM node;
            SELECT * FROM edge;
        `);

      const nodeSchemaRaw = responses[0]?.result || [];
      const edgeSchemaRaw = responses[1]?.result || [];
      const nodes = responses[2]?.result || [];
      const linksRaw = responses[3]?.result || [];

      // Map raw DB results to Types
      const nodeSchema: NodeSchema[] = nodeSchemaRaw;
      const edgeSchema: EdgeSchema[] = edgeSchemaRaw;

      // Process Links
      const links = linksRaw.map((l: any) => ({
        id: l.id,
        source: typeof l.in === 'string' ? l.in : (l.in?.id || l.in), // Surreal uses 'in'/'out' for edges
        target: typeof l.out === 'string' ? l.out : (l.out?.id || l.out),
        type: l.type,
        nature: l.nature,
        strength: l.strength || 1,
        weight: l.weight || 1,
        data: l.data,
        metadata: l.metadata
      }));

      // Process Nodes (ensure ID is string)
      const processedNodes = nodes.map((n: any) => ({
        ...n,
        id: n.id,
      }));

      return {
        nodes: processedNodes,
        links,
        nodeSchema,
        edgeSchema
      };
    } catch (e) {
      console.error("Nexus: Failed to fetch graph data:", e);
      return { nodes: [], links: [], nodeSchema: [], edgeSchema: [] };
    }
  }

  async createNode(node: any): Promise<void> {
    await this.db.use({ namespace: ROOT_NS, database: this.currentProjectDB });
    await this.db.create('node', node);
  }

  async relate(source: string, target: string, type: string, nature: string): Promise<void> {
    await this.db.use({ namespace: ROOT_NS, database: this.currentProjectDB });

    // RELATE logic per edge_schema.ts:
    // - 'type' is the edge taxonomy type (e.g., CHILD_OF, RELATED_TO)
    // - 'nature' is the category ('child', 'sub', 'link')
    // - 'sourcetype'/'destinationtype' store direction labels for bidirectional semantics

    try {
      // Look up the edge taxonomy to get direction labels
      const taxonomyQuery: any = await this.db.query(
        'SELECT sourcetype, destinationtype FROM edge_taxonomy WHERE sourcetype = $type OR destinationtype = $type LIMIT 1;',
        { type }
      );
      const taxonomy = taxonomyQuery[0]?.result?.[0];

      await this.db.query(`
        RELATE ${source}->edge->${target} 
        SET type = $type, 
            nature = $nature,
            sourcetype = $srctype,
            destinationtype = $dsttype,
            created_at = time::now();
      `, {
        type,
        nature,
        srctype: taxonomy?.sourcetype || type,
        dsttype: taxonomy?.destinationtype || type
      });
    } catch (e) {
      console.error("Nexus: Relationship Creation Failed", e);
      throw e;
    }
  }

  async deleteNode(id: string): Promise<void> {
    await this.db.use({ namespace: ROOT_NS, database: this.currentProjectDB });
    await this.db.delete(id);
  }

  async updateSchema(nodeSchema: NodeSchema[], edgeSchema: EdgeSchema[]): Promise<void> {
    if (!this.connected) return;
    try {
      this.currentProjectDB = this.currentProjectDB || 'neuralnexus_dev';
      await this.db.use({ namespace: ROOT_NS, database: this.currentProjectDB });

      // 1. Clear existing schema definitions
      // Note: In SurrealDB, DELETE table deletes all records in the table
      await this.db.delete('node_archtype');
      await this.db.delete('edge_taxonomy');

      // 2. Insert new definitions
      if (nodeSchema.length > 0) {
        await this.db.insert('node_archtype', nodeSchema as any);
      }
      if (edgeSchema.length > 0) {
        await this.db.insert('edge_taxonomy', edgeSchema as any);
      }
    } catch (e) {
      console.error("Nexus: Failed to update schema:", e);
      throw e;
    }
  }



  /**
   * Execute a raw SurrealQL query with optional variables.
   * Used for vector search and complex queries.
   */
  async query<T = any>(sql: string, vars?: Record<string, any>): Promise<T[]> {
    await this.db.use({ namespace: ROOT_NS, database: this.currentProjectDB });
    try {
      const result = await this.db.query(sql, vars);
      // SurrealDB query returns array of results per statement
      // We flatten and return first result set
      if (Array.isArray(result) && result.length > 0) {
        return result[0] as T[];
      }
      return [];
    } catch (e) {
      console.error('Nexus: Query failed:', e);
      throw e;
    }
  }

  isConnected() { return this.connected; }
  async updateNodeField(id: string, field: string, value: any): Promise<void> {
    await this.updateNodeFields(id, { [field]: value });
  }

  async updateNodeFields(id: string, fields: Partial<any>): Promise<void> {
    await this.db.use({ namespace: ROOT_NS, database: this.currentProjectDB });
    try {
      await this.db.merge(id, fields);
    } catch (e) {
      console.error(`Nexus: Failed to update node ${id}`, e);
      throw e;
    }
  }
}

export const surrealService = new SurrealService();
