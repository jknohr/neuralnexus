
export const edgeSchema = `
-- In SurrealDB, edges are tables with 'TYPE RELATION'. 
-- Since we have dynamic edge types (CHILD_OF, RELATED_TO, etc.), 
-- we typically apply these field definitions to specific edge tables dynamically or use a generic 'graph_edge' if designing that way.
-- However, assuming a generated approach where we apply this schema to all edge tables:

-- 1. Define the Edge Table as a Relation
DEFINE TABLE edge TYPE RELATION SCHEMAFULL;

-- 'in' (source) and 'out' (destination) are built-in for RELATION tables.
-- 'id' is built-in (UUID).

DEFINE FIELD type           ON TABLE edge TYPE string; -- The Edge Taxonomy Type (e.g., 'CHILD_OF')
DEFINE FIELD nature         ON TABLE edge TYPE string; -- 'child', 'sub', 'link'
DEFINE FIELD sourcetype     ON TABLE edge TYPE string; -- Direction from source perspective (e.g., 'PARENT_OF')
DEFINE FIELD destinationtype ON TABLE edge TYPE string; -- Direction from target perspective (e.g., 'CHILD_OF')

-- 2. Template / Flexible Data
-- Stores custom attributes for this specific edge instance
DEFINE FIELD data           ON TABLE edge TYPE object FLEXIBLE;

-- 3. Metrics
DEFINE FIELD strength       ON TABLE edge TYPE float DEFAULT 1.0;
DEFINE FIELD weight         ON TABLE edge TYPE float DEFAULT 1.0;

-- 4. Metadata
DEFINE FIELD metadata       ON TABLE edge TYPE object;
DEFINE FIELD created_at     ON TABLE edge TYPE datetime DEFAULT time::now();

-- Note: In strict SurrealQL, you apply these via 'DEFINE FIELD ... ON TABLE CHILD_OF', etc.
-- This string serves as the template schema for any edge table created.
`;
