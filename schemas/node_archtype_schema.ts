
export const nodeArchtypeSchema = `
DEFINE TABLE node_archtype SCHEMAFULL; -- Explicitly named 'node_archtype' to separate from 'node' content

DEFINE FIELD type ON TABLE node_archtype TYPE string;
-- Nature: 'child' (Structural/Container), 'sub' (Content/Descriptive)
DEFINE FIELD nature ON TABLE node_archtype TYPE string ASSERT $value INSIDE ['child', 'sub'];
DEFINE FIELD description ON TABLE node_archtype TYPE string;
DEFINE FIELD color ON TABLE node_archtype TYPE string;
DEFINE FIELD defaultEdge ON TABLE node_archtype TYPE string;

-- Connectivity Rules (Single Source of Truth)
DEFINE FIELD allowedChildNodes ON TABLE node_archtype TYPE array<string>;
DEFINE FIELD allowedSubNodes ON TABLE node_archtype TYPE array<string>;

-- Flow Logic
DEFINE FIELD flow_z ON TABLE node_archtype TYPE string ASSERT $value INSIDE ['positive', 'negative', 'neutral', 'free'];
DEFINE FIELD flow_x ON TABLE node_archtype TYPE string ASSERT $value INSIDE ['positive', 'negative', 'neutral', 'free'];
DEFINE FIELD flow_y ON TABLE node_archtype TYPE string ASSERT $value INSIDE ['positive', 'negative', 'neutral', 'free'];

-- Vector Embeddings
DEFINE FIELD embedding ON TABLE node_archtype TYPE array<float>;

-- Indexes
DEFINE INDEX type_idx ON TABLE node_archtype COLUMNS type UNIQUE;
DEFINE INDEX nature_idx ON TABLE node_archtype COLUMNS nature;
DEFINE INDEX idx_embedding ON node_archtype COLUMNS embedding SEARCH VECTOR;
`;
