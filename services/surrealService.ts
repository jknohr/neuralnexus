
import { Surreal } from 'surrealdb';
import { GraphData, GraphNode, GraphEdge, NodeSchema, EdgeSchema } from '../types';

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

const DEFAULT_NODE_SCHEMA: NodeSchema[] = [
  { type: 'category', nature: 'child', description: 'Structural blocks defining knowledge domains.', color: '#6366f1', defaultEdge: 'CHILD_OF', allowedEdges: ['CHILD_OF', 'RELATED_TO'], flow_z: 'neutral', flow_x: 'free', flow_y: 'positive' },
  { type: 'article', nature: 'sub', description: 'Detailed knowledge carriers with rich content.', color: '#38bdf8', defaultEdge: 'CHILD_OF', allowedEdges: ['CHILD_OF', 'REFERENCES', 'DEPENDS_ON'], flow_z: 'positive', flow_x: 'free', flow_y: 'negative' },
  { type: 'concept', nature: 'sub', description: 'Abstract theories or semantic bridges.', color: '#a78bfa', defaultEdge: 'RELATED_TO', allowedEdges: ['RELATED_TO', 'REFERENCES'], flow_z: 'negative', flow_x: 'free', flow_y: 'free' },
  { type: 'entity', nature: 'sub', description: 'Specific individuals, locations, or items.', color: '#fb7185', defaultEdge: 'REFERENCES', allowedEdges: ['REFERENCES'], flow_z: 'neutral', flow_x: 'positive', flow_y: 'free' }
];

const DEFAULT_EDGE_SCHEMA: EdgeSchema[] = [
  { type: 'CHILD_OF', description: 'Strict hierarchical parent-child relation.', color: '#6366f1', label: 'Parent-Child', behavior: 'child' },
  { type: 'REFERENCES', description: 'Associative citation or mention.', color: '#10b981', label: 'Referential', behavior: 'link' },
  { type: 'RELATED_TO', description: 'Horizontal semantic relationship.', color: '#f59e0b', label: 'Associative', behavior: 'link' },
  { type: 'DEPENDS_ON', description: 'Functional prerequisite requirement.', color: '#ef4444', label: 'Prerequisite', behavior: 'link' }
];

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

      // Bootstrap core structures one by one to avoid halting on existing field errors
      const definitions = [
        "DEFINE TABLE IF NOT EXISTS project SCHEMAFULL;",
        "DEFINE FIELD IF NOT EXISTS name ON TABLE project TYPE string;",
        "DEFINE FIELD IF NOT EXISTS created_at ON TABLE project TYPE datetime DEFAULT time::now();",
        "DEFINE TABLE IF NOT EXISTS node_schema SCHEMAFULL;",
        "DEFINE TABLE IF NOT EXISTS edge_schema SCHEMAFULL;"
      ];

      for (const query of definitions) {
        try {
          await this.db.query(query);
        } catch (e) {
          // Quietly ignore "already exists" errors during bootstrap
        }
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
      // Updated query to use specific idiom selection for name to avoid parse errors in some SDK versions
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

    // 1. Register in Global Index
    await this.db.use({ namespace: ROOT_NS, database: ORG_DB });
    await this.db.query('CREATE project SET name = $name, created_at = time::now();', { name: sanitizedName });

    // 2. Initialize the Project Database and create Foundational Node
    await this.db.use({ namespace: ROOT_NS, database: sanitizedName });

    await this.db.create('node', {
      id: `node:root`,
      title: name,
      summary: `The central nexus of the ${name} knowledge project.`,
      content: `# ${name}\n\nWelcome to your new knowledge project. Begin expanding by right-clicking nodes or using the expand tools.`,
      type: 'category',
      val: 24,
      color: '#6366f1',
      x: 0, y: 0, z: 0
    });

    this.currentProjectDB = sanitizedName;
    return sanitizedName;
  }

  async fetchGraphData(projectName: string): Promise<GraphData> {
    if (!this.connected || !projectName) return { nodes: [], links: [], nodeSchema: DEFAULT_NODE_SCHEMA, edgeSchema: DEFAULT_EDGE_SCHEMA };

    try {
      await this.db.use({ namespace: ROOT_NS, database: ORG_DB });
      const schemaResponses: any = await this.db.query(`
            SELECT * FROM node_schema;
            SELECT * FROM edge_schema;
        `);

      const nodeSchema = schemaResponses[0]?.result || [];
      const edgeSchema = schemaResponses[1]?.result || [];

      this.currentProjectDB = projectName;
      await this.db.use({ namespace: ROOT_NS, database: projectName });

      const dataResponses: any = await this.db.query(`
            SELECT * FROM node;
            SELECT * FROM edge;
        `);

      const nodes = dataResponses[0]?.result || [];
      const linksRaw = dataResponses[1]?.result || [];

      return {
        nodes,
        links: linksRaw.map((l: any) => ({
          ...l,
          source: typeof l.source === 'string' ? l.source : (l.source?.id || l.source),
          target: typeof l.target === 'string' ? l.target : (l.target?.id || l.target)
        })),
        nodeSchema: nodeSchema.length ? nodeSchema : DEFAULT_NODE_SCHEMA,
        edgeSchema: edgeSchema.length ? edgeSchema : DEFAULT_EDGE_SCHEMA
      };
    } catch (e) {
      console.error("Nexus: Failed to fetch graph data:", e);
      return { nodes: [], links: [], nodeSchema: DEFAULT_NODE_SCHEMA, edgeSchema: DEFAULT_EDGE_SCHEMA };
    }
  }

  async createNode(node: any): Promise<void> {
    await this.db.use({ namespace: ROOT_NS, database: this.currentProjectDB });
    await this.db.create('node', node as any);
  }

  async relate(source: string, target: string, table: string): Promise<void> {
    await this.db.use({ namespace: ROOT_NS, database: this.currentProjectDB });
    await this.db.query(`
      RELATE ${source}->edge->${target} 
      SET table = $table, strength = 1.0;
    `, { table });
  }

  async deleteNode(id: string): Promise<void> {
    await this.db.use({ namespace: ROOT_NS, database: this.currentProjectDB });
    await this.db.delete(id);
  }

  async updateSchema(nodeSchema: NodeSchema[], edgeSchema: EdgeSchema[]): Promise<void> {
    await this.db.use({ namespace: ROOT_NS, database: ORG_DB });
    await this.db.query('DELETE node_schema; DELETE edge_schema;');
    for (const ns of nodeSchema) await this.db.create('node_schema', ns as any);
    for (const es of edgeSchema) await this.db.create('edge_schema', es as any);
    await this.db.use({ namespace: ROOT_NS, database: this.currentProjectDB });
  }

  isConnected() { return this.connected; }
}

export const surrealService = new SurrealService();
