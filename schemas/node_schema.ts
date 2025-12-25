
export const nodeSchema = `
-- 1. Define the Node Table
-- We use SCHEMALESS to allow flexibility, but define strict fields where necessary.
DEFINE TABLE node SCHEMALESS;

-- 2. Core Identity & Type
DEFINE FIELD type           ON TABLE node TYPE string; -- Links to node_schema.type (e.g., 'topic', 'repo')
DEFINE FIELD title          ON TABLE node TYPE string;
DEFINE FIELD summary        ON TABLE node TYPE string;
DEFINE FIELD content        ON TABLE node TYPE string;

-- 3. Connectivity (Arrays of UUIDs)
-- These maintain the graph structure explicitly on the node for fast lookups
DEFINE FIELD parents        ON TABLE node TYPE array<record<node>>;
DEFINE FIELD children       ON TABLE node TYPE array<record<node>>;
DEFINE FIELD subnodes       ON TABLE node TYPE array<record<node>>;

-- 4. Template / Flexible Data
-- This field stores the custom attributes defined by valid templates
DEFINE FIELD data           ON TABLE node TYPE object FLEXIBLE;

-- 5. Visuals & Metrics
DEFINE FIELD color          ON TABLE node TYPE string;
DEFINE FIELD val            ON TABLE node TYPE float DEFAULT 1.0;

-- 6. Spatial / Flow Data
DEFINE FIELD flow_x         ON TABLE node TYPE float DEFAULT 0.0;
DEFINE FIELD flow_y         ON TABLE node TYPE float DEFAULT 0.0;
DEFINE FIELD flow_z         ON TABLE node TYPE float DEFAULT 0.0;

-- 7. AI / Vector Data
DEFINE FIELD embedding      ON TABLE node TYPE array<float>;
DEFINE INDEX idx_embedding  ON TABLE node COLUMNS embedding SEARCH VECTOR;

-- 8. Metadata
DEFINE FIELD metadata       ON TABLE node TYPE object;
DEFINE FIELD created_at     ON TABLE node TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at     ON TABLE node TYPE datetime VALUE time::now();
`;
