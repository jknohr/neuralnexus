
export const projectSchema = `
DEFINE TABLE project SCHEMAFULL;

-- Core Identity
DEFINE FIELD name ON TABLE project TYPE string;
DEFINE FIELD database_name ON TABLE project TYPE string;
DEFINE FIELD description ON TABLE project TYPE string;

-- =========================================================
-- LOCAL SCHEMA OVERRIDES (Stored in System DB)
-- These MUST adhere to the strict specific structures of 
-- Node Archtypes and Edge Taxonomies defined in the system.
-- =========================================================
DEFINE FIELD local_definitions ON TABLE project TYPE object;

-- 1. LOCAL NODES (Must match table node_archtype structure)
DEFINE FIELD local_definitions.nodes ON TABLE project TYPE array<object>;

-- Identity & Nature
DEFINE FIELD local_definitions.nodes[*].type ON TABLE project TYPE string;
DEFINE FIELD local_definitions.nodes[*].nature ON TABLE project TYPE string ASSERT $value INSIDE ['child', 'sub'];
DEFINE FIELD local_definitions.nodes[*].description ON TABLE project TYPE string;
DEFINE FIELD local_definitions.nodes[*].color ON TABLE project TYPE string;
DEFINE FIELD local_definitions.nodes[*].defaultEdge ON TABLE project TYPE string;

-- Connectivity Rules
DEFINE FIELD local_definitions.nodes[*].allowedChildNodes ON TABLE project TYPE array<string>;
DEFINE FIELD local_definitions.nodes[*].allowedSubNodes ON TABLE project TYPE array<string>;

-- Flow Logic
DEFINE FIELD local_definitions.nodes[*].flow_z ON TABLE project TYPE string ASSERT $value INSIDE ['positive', 'negative', 'neutral', 'free'];
DEFINE FIELD local_definitions.nodes[*].flow_x ON TABLE project TYPE string ASSERT $value INSIDE ['positive', 'negative', 'neutral', 'free'];
DEFINE FIELD local_definitions.nodes[*].flow_y ON TABLE project TYPE string ASSERT $value INSIDE ['positive', 'negative', 'neutral', 'free'];

-- 2. LOCAL EDGES (Must match table edge_taxonomy structure)
DEFINE FIELD local_definitions.edges ON TABLE project TYPE array<object>;

-- Identity & Nature
DEFINE FIELD local_definitions.edges[*].type ON TABLE project TYPE string;
DEFINE FIELD local_definitions.edges[*].nature ON TABLE project TYPE string ASSERT $value INSIDE ['child', 'sub', 'link'];
DEFINE FIELD local_definitions.edges[*].sourcetype ON TABLE project TYPE string;
DEFINE FIELD local_definitions.edges[*].destinationtype ON TABLE project TYPE string;
DEFINE FIELD local_definitions.edges[*].description ON TABLE project TYPE string;
DEFINE FIELD local_definitions.edges[*].color ON TABLE project TYPE string;

-- 3. LOCAL TEMPLATES (Custom Fields)
-- Key is the node/edge type name, Value is the template object
DEFINE FIELD local_definitions.templates ON TABLE project TYPE object;

-- Metadata
DEFINE FIELD created_at ON TABLE project TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE project TYPE datetime VALUE time::now();

-- Indexes
DEFINE INDEX project_name_idx ON TABLE project COLUMNS name UNIQUE;
DEFINE INDEX project_database_name_idx ON TABLE project COLUMNS database_name UNIQUE;
`;
