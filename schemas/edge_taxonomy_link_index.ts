
export const edgeTaxonomyLinkIndexSchema = `
-- Specific index for Link nature
DEFINE INDEX edge_taxonomy_link_idx ON TABLE edge_taxonomy COLUMNS type WHERE nature = 'link';
`;

export const edgeTaxonomyLinkIndexData = `
-- Insert default Link Edges (nature: 'link')
INSERT INTO edge_taxonomy CONTENT [
    {
        type: "LINK",
        nature: "link",
        sourcetype: "REFERENCES",
        destinationtype: "REFERENCED_BY",
        description: "Associative citation or mention.",
        color: "#10b981"
    },
    {
        type: "LINK",
        nature: "link",
        sourcetype: "CITES",
        destinationtype: "CITED_BY",
        description: "Academic or formal citation.",
        color: "#059669"
    },
    {
        type: "LINK",
        nature: "link",
        sourcetype: "RELATED_TO",
        destinationtype: "RELATED_TO",
        description: "Horizontal semantic relationship.",
        color: "#f59e0b"
    },
    {
        type: "LINK",
        nature: "link",
        sourcetype: "MENTIONS",
        destinationtype: "MENTIONED_BY",
        description: "Brief or casual reference.",
        color: "#34d399"
    },
    {
        type: "LINK",
        nature: "link",
        sourcetype: "CRITIQUES",
        destinationtype: "CRITIQUED_BY",
        description: "Critical analysis or counterpoint.",
        color: "#ef4444"
    },
    {
        type: "LINK",
        nature: "link",
        sourcetype: "SUPPORTS",
        destinationtype: "SUPPORTED_BY",
        description: "Supporting evidence or argument.",
        color: "#84cc16"
    },
    {
        type: "LINK",
        nature: "link",
        sourcetype: "CONTRADICTS",
        destinationtype: "CONTRADICTED_BY",
        description: "Direct opposition or conflict.",
        color: "#dc2626"
    },
    {
        type: "LINK",
        nature: "link",
        sourcetype: "DEPENDS_ON",
        destinationtype: "REQUIRED_BY",
        description: "Functional prerequisite requirement.",
        color: "#f97316"
    }
];
`;
