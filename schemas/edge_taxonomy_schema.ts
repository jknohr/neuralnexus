
export const edgeTaxonomySchema = `
DEFINE TABLE edge_taxonomy SCHEMAFULL;

-- Nature distinguishes the category of edge: 'child' (Hierarchy), 'sub' (Description/Definition), 'link' (Association)
DEFINE FIELD nature ON TABLE edge_taxonomy TYPE string ASSERT $value INSIDE ['child', 'sub', 'link'];

DEFINE FIELD type ON TABLE edge_taxonomy TYPE string;
DEFINE FIELD sourcetype ON TABLE edge_taxonomy TYPE string;
DEFINE FIELD destinationtype ON TABLE edge_taxonomy TYPE string;
DEFINE FIELD description ON TABLE edge_taxonomy TYPE string;
DEFINE FIELD color ON TABLE edge_taxonomy TYPE string;

-- Indexes for performance
DEFINE INDEX type_idx ON TABLE edge_taxonomy COLUMNS type;
DEFINE INDEX nature_idx ON TABLE edge_taxonomy COLUMNS nature;
`;
