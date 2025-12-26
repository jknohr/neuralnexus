// ==========================================
// 1. FUNDAMENTAL UNIONS (Strict Type Safety)
// ==========================================

export type AxisPreference = 'positive' | 'negative' | 'neutral' | 'free';

export type NodeNature = 'child' | 'sub';

export type EdgeNature = 'child' | 'sub' | 'link';

// EdgeCategory is semantically redundant to Nature in the default schemas 
// ('RELATIONAL'===child, 'LINK'===link, 'DESCRIPTIVE'===sub), 
// but exists as the 'type' field in edge_taxonomy table. 
// We allow string for extensibility.
export type EdgeCategory =
  | 'RELATIONAL'
  | 'LINK'
  | 'DESCRIPTIVE'
  | (string & {});

// Loose Autocomplete Pattern: | (string & {}) allows any string but preserves intellisense for known values.

// Extracted from node_archtype_child_index & node_archtype_sub_index
export type NodeType =
  // Child Nodes
  | 'topic' | 'domain' | 'field' | 'field_speciality' | 'branch' | 'organization_entity' | 'repo'
  // Sub Nodes (Knowledge)
  | 'taxonomy' | 'conceptualframework' | 'concept' | 'mentalmodel' | 'principle' | 'law'
  | 'controversy' | 'misconception' | 'methodology' | 'epistemicfoundation' | 'analyticaltechnique'
  | 'bestpractice' | 'pitfall' | 'discovery' | 'technology' | 'source'
  | 'article' | 'paper'
  // Sub Nodes (Repo)
  | 'folder' | 'file' | 'documentation'
  // Sub Nodes (Organization)
  | 'Local_Laws' | 'Charter' | 'Bylaws' | 'Regulations' | 'Policies' | 'Procedures'
  | 'Manuals' | 'Guidelines' | 'Standards' | 'Codes' | 'Conventions' | 'Protocols' | 'Rules'
  // Local / Custom Types
  | (string & {});

// Extracted from edge_taxonomy indexes (sourcetype & destinationtype)
export type EdgeType =
  // Relational
  | 'PARENT_OF' | 'CHILD_OF' | 'HAS_PART' | 'PART_OF'
  // Link
  | 'REFERENCES' | 'REFERENCED_BY' | 'CITES' | 'CITED_BY' | 'RELATED_TO'
  | 'MENTIONS' | 'MENTIONED_BY' | 'CRITIQUES' | 'CRITIQUED_BY'
  | 'SUPPORTS' | 'SUPPORTED_BY' | 'CONTRADICTS' | 'CONTRADICTED_BY'
  | 'DEPENDS_ON' | 'REQUIRED_BY'
  // Descriptive
  | 'DEFINES' | 'DEFINED_BY' | 'DESCRIBES' | 'DESCRIBED_BY' | 'EXPLAINS' | 'EXPLAINED_BY'
  | 'CONTAINS' | 'CONTAINED_IN' | 'HAS_PROPERTY' | 'PROPERTY_OF'
  // Local / Custom Types
  | (string & {});


// ==========================================
// 2. SCHEMA DEFINITIONS (Database Tables)
// ==========================================

export interface NodeSchema {
  type: NodeType;
  nature: NodeNature;
  description: string;
  color: string;
  defaultEdge: EdgeType;
  allowedChildNodes: NodeType[];
  allowedSubNodes: NodeType[];
  flow_z: AxisPreference;
  flow_x: AxisPreference;
  flow_y: AxisPreference;
  embedding?: number[];
}

export interface EdgeSchema {
  type: EdgeCategory; // e.g., 'RELATIONAL'
  nature: EdgeNature;
  sourcetype: EdgeType;
  destinationtype: EdgeType;
  description: string;
  color: string;
}

// ==========================================
// 3. GRAPH DATA (Runtime Objects)
// ==========================================

export interface VectorData {
  embedding: number[];
  model: string;
}

export interface GraphNode {
  id: string; // e.g. "topic:my_topic"
  type: NodeType;
  title: string;
  summary: string;
  content: string;

  // Connectivity (Ids)
  parents?: string[];
  children?: string[];
  subnodes?: string[];

  // Visuals & Metrics
  color: string;
  val: number;

  // Spatial / Flow (from node table defaults or overrides)
  flow_x?: AxisPreference;
  flow_y?: AxisPreference;
  flow_z?: AxisPreference;
  x?: number;
  y?: number;
  z?: number;

  data?: Record<string, any>;
  metadata?: Record<string, any>;

  // Embeddings (Multi-Provider) - Aligned with node_schema.ts
  embedding_gemini?: number[];
  embedding_openai?: number[];
  embedding_anthropic?: number[];

  // Media Attachments
  media?: MediaItem[];
}

export interface MediaItem {
  id: string; // generated UUID
  type: 'image' | 'audio' | 'video' | 'document';
  url: string; // B2 Public URL
  name: string; // Original Filename
  mimeType: string;
  fileId?: string; // B2 File ID for deletion
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;

  type: EdgeType; // The specific relation e.g. CHILD_OF
  nature: EdgeNature;

  strength: number;
  weight: number;

  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
  nodeSchema: NodeSchema[];
  edgeSchema: EdgeSchema[];
}
