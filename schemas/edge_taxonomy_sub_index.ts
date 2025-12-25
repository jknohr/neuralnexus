
export const edgeTaxonomySubIndexSchema = `
-- Specific index for Sub nature
DEFINE INDEX edge_taxonomy_sub_idx ON TABLE edge_taxonomy COLUMNS type WHERE nature = 'sub';
`;

export const edgeTaxonomySubIndexData = `
-- Insert default Sub Edges (nature: 'sub')
INSERT INTO edge_taxonomy CONTENT [
    {
        type: "DESCRIPTIVE",
        nature: "sub",
        sourcetype: "DEFINES",
        destinationtype: "DEFINED_BY",
        description: "Establishes a definition.",
        color: "#c084fc"
    },
    {
        type: "DESCRIPTIVE",
        nature: "sub",
        sourcetype: "DESCRIBES",
        destinationtype: "DESCRIBED_BY",
        description: "Provides description or context.",
        color: "#d8b4fe"
    },
    {
        type: "DESCRIPTIVE",
        nature: "sub",
        sourcetype: "EXPLAINS",
        destinationtype: "EXPLAINED_BY",
        description: "Elaborates on logic or reasoning.",
        color: "#e879f9"
    },
    {
        type: "DESCRIPTIVE",
        nature: "sub",
        sourcetype: "CONTAINS",
        destinationtype: "CONTAINED_IN",
        description: "Structural containment.",
        color: "#a78bfa"
    },
    {
        type: "DESCRIPTIVE",
        nature: "sub",
        sourcetype: "HAS_PROPERTY",
        destinationtype: "PROPERTY_OF",
        description: "Attribute or property association.",
        color: "#f472b6"
    }
];
`;
