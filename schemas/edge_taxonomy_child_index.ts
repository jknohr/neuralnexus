
export const edgeTaxonomyChildIndexSchema = `
-- Specific index for Child nature if needed (redundant if nature_idx exists, but kept for pattern consistency or specific optimization)
DEFINE INDEX edge_taxonomy_child_idx ON TABLE edge_taxonomy COLUMNS type WHERE nature = 'child';
`;

export const edgeTaxonomyChildIndexData = `
-- Insert default Child Edges (nature: 'child')
INSERT INTO edge_taxonomy CONTENT [
    {
        type: "RELATIONAL",
        nature: "child",
        sourcetype: "PARENT_OF",
        destinationtype: "CHILD_OF",
        description: "Strict hierarchical parent-child relation.",
        color: "#6366f1"
    },
    {
        type: "RELATIONAL",
        nature: "child",
        sourcetype: "GOVERNS",
        destinationtype: "SUBSIDIARY_OF",
        description: "Organizational hierarchy (e.g. Org -> Org).",
        color: "#7c3aed"
    },
    {
        type: "RELATIONAL",
        nature: "child",
        sourcetype: "ENCOMPASSES",
        destinationtype: "PUBLISHED_IN",
        description: "Knowledge domain containment (e.g. Domain/Field -> Article/Paper).",
        color: "#0ea5e9"
    }
];
`;
