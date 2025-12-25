
export type AxisPreference = 'positive' | 'negative' | 'neutral' | 'free';
export type EdgeBehavior = 'link' | 'child' | 'nested';
export type NodeNature = 'child' | 'sub';

export interface NodeSchema {
  type: string;
  description: string;
  color: string;
  defaultEdge: string;
  allowedEdges: string[];
  flow_z: AxisPreference;
  flow_x: AxisPreference;
  flow_y: AxisPreference;
  nature: NodeNature;
}

export interface EdgeSchema {
  type: string;
  description: string;
  color: string;
  label: string;
  behavior: EdgeBehavior;
}

export interface VectorData {
  embedding: number[];
  model: string;
}

export interface GraphNode {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: string;
  val: number;
  color: string;
  x?: number;
  y?: number;
  z?: number;
  vector?: VectorData;
  metadata?: Record<string, any>;
  childrenIds?: string[];
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  table: string;
  strength: number;
  metadata?: {
    context: string;
    timestamp: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
  nodeSchema: NodeSchema[];
  edgeSchema: EdgeSchema[];
}
