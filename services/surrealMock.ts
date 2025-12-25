
import { GraphData, GraphNode, GraphEdge, NodeSchema, EdgeSchema } from '../types';

const STORAGE_KEY = 'nexus_surreal_v9';

const DEFAULT_NODE_SCHEMA: NodeSchema[] = [
  { type: 'category', nature: 'child', description: 'Major structural blocks of the knowledge graph. Used to define broad domains.', color: '#6366f1', defaultEdge: 'CHILD_OF', allowedEdges: ['CHILD_OF', 'RELATED_TO'], zAxis: 'neutral', xAxis: 'free', yAxis: 'positive' },
  { type: 'article', nature: 'sub', description: 'Primary information carriers containing detailed text and references.', color: '#38bdf8', defaultEdge: 'CHILD_OF', allowedEdges: ['CHILD_OF', 'REFERENCES', 'DEPENDS_ON'], zAxis: 'positive', xAxis: 'free', yAxis: 'negative' },
  { type: 'concept', nature: 'sub', description: 'Abstract theories or bridging ideas that link different categories.', color: '#a78bfa', defaultEdge: 'RELATED_TO', allowedEdges: ['RELATED_TO', 'REFERENCES'], zAxis: 'negative', xAxis: 'free', yAxis: 'free' },
  { type: 'entity', nature: 'sub', description: 'Specific items, people, or places with distinct metadata attributes.', color: '#fb7185', defaultEdge: 'REFERENCES', allowedEdges: ['REFERENCES'], zAxis: 'neutral', xAxis: 'positive', yAxis: 'free' }
];

const DEFAULT_EDGE_SCHEMA: EdgeSchema[] = [
  { type: 'CHILD_OF', description: 'Hierarchical relationship defining ownership or containment.', color: '#6366f1', label: 'Parent-Child', behavior: 'child' },
  { type: 'REFERENCES', description: 'Weak association indicating a citation or simple mention.', color: '#10b981', label: 'Referential', behavior: 'link' },
  { type: 'RELATED_TO', description: 'Horizontal semantic link between nodes of similar importance.', color: '#f59e0b', label: 'Associative', behavior: 'link' },
  { type: 'DEPENDS_ON', description: 'Functional prerequisite indicating logical order.', color: '#ef4444', label: 'Prerequisite', behavior: 'link' }
];

const INITIAL_STATE: GraphData = {
  nodes: [
    { id: 'article:nexus', title: 'Nexus Prime', summary: 'The central node.', content: '# Nexus Prime\nRoot of the graph.', type: 'category', val: 20, color: '#6366f1', x: 0, y: 0, z: 0 }
  ],
  links: [],
  nodeSchema: DEFAULT_NODE_SCHEMA,
  edgeSchema: DEFAULT_EDGE_SCHEMA
};

class SurrealDBMock {
    private db: GraphData;

    constructor() {
        const saved = localStorage.getItem(STORAGE_KEY);
        this.db = saved ? JSON.parse(saved) : INITIAL_STATE;
    }

    private save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    }

    async getAll(): Promise<GraphData> {
        return JSON.parse(JSON.stringify(this.db));
    }

    async updateSchema(nodeSchema: NodeSchema[], edgeSchema: EdgeSchema[]) {
      this.db.nodeSchema = nodeSchema;
      this.db.edgeSchema = edgeSchema;
      this.save();
    }

    async createNode(node: GraphNode): Promise<GraphNode> {
        this.db.nodes.push(node);
        this.save();
        return node;
    }

    async relate(sourceId: string, targetId: string, table: string, context: string = ''): Promise<GraphEdge> {
        const edge: GraphEdge = {
            id: `rel:${table.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
            source: sourceId,
            target: targetId,
            table: table,
            strength: 1.5,
            metadata: { context, timestamp: new Date().toISOString() }
        };
        this.db.links.push(edge);
        this.save();
        return edge;
    }

    async deleteNode(id: string) {
        this.db.nodes = this.db.nodes.filter(n => n.id !== id);
        this.db.links = this.db.links.filter(l => {
          const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
          const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
          return s !== id && t !== id;
        });
        this.save();
    }
}

export const surreal = new SurrealDBMock();
