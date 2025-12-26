
export const nodeArchtypeChildIndexSchema = `
-- Specific index for Child nature
DEFINE INDEX node_archtype_child_idx ON TABLE node_archtype COLUMNS type WHERE nature = 'child';
`;

export const nodeArchtypeChildIndexData = `
-- Insert default Child Nodes (nature: 'child')
INSERT INTO node_archtype CONTENT [
    {
        type: "topic",
        nature: "child",
        description: "Topic or sub-topic.",
        color: "#334155",
        defaultEdge: "CHILD_OF",
        allowedChildNodes: ["topic", "repo"],
        allowedSubNodes: ["article", "paper", "taxonomy", "conceptualframework", "concept", "mentalmodel", "principle", "law", "controversy", "misconception", "methodology", "epistemicfoundation", "analyticaltechnique", "bestpractice", "pitfall", "discovery", "technology", "source"],
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    },
    {
        type: "domain",
        nature: "child",
        description: "Broad knowledge territory or industry.",
        color: "#4f46e5",
        defaultEdge: "CHILD_OF",    
        allowedChildNodes: ["branch", "topic", "organization_entity", "field"],
        allowedSubNodes: ["article", "paper", "taxonomy", "conceptualframework", "concept", "mentalmodel", "principle", "law", "controversy", "misconception", "methodology", "epistemicfoundation", "analyticaltechnique", "bestpractice", "pitfall", "discovery", "technology"],
        flow_z: "neutral",
        flow_x: "free",
        flow_y: "positive"
    },
    {
        type: "field",
        nature: "child",
        description: "Specific area of study within a domain.",
        color: "#0ea5e9",
        defaultEdge: "CHILD_OF",    
        allowedChildNodes: ["field_speciality"],
        allowedSubNodes: ["taxonomy", "conceptualframework", "concept", "mentalmodel", "principle", "law", "controversy", "misconception", "methodology", "epistemicfoundation", "analyticaltechnique", "bestpractice", "pitfall", "discovery", "technology"],
        flow_z: "neutral",
        flow_x: "free",
        flow_y: "positive"
    },
    {
        type: "field_speciality",
        nature: "child",
        description: "Specialized niche within a field.",
        color: "#06b6d4",
        defaultEdge: "CHILD_OF",    
        allowedChildNodes: ["domain", "topic", "organization_entity"],
        allowedSubNodes: ["article", "paper", "taxonomy", "conceptualframework", "concept", "mentalmodel", "principle", "law", "controversy", "misconception", "methodology", "epistemicfoundation", "analyticaltechnique", "bestpractice", "pitfall", "discovery", "technology"],
        flow_z: "neutral",
        flow_x: "free",
        flow_y: "positive"
    },
    {
        type: "branch",
        nature: "child",
        description: "Divergent path or sub-division.",
        color: "#f59e0b",
        defaultEdge: "CHILD_OF",
        allowedChildNodes: ["topic", "organization_entity"],
        allowedSubNodes: ["article", "paper", "taxonomy", "conceptualframework", "concept", "mentalmodel", "principle", "law", "controversy", "misconception", "methodology", "epistemicfoundation", "analyticaltechnique", "bestpractice", "pitfall", "discovery", "technology"],
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    },
    {
        type: "organization_entity",
        nature: "child",
        description: "Company, Institution, or Group.",
        color: "#7c3aed",
        defaultEdge: "CHILD_OF",
        allowedChildNodes: ["organization_entity"],
        allowedSubNodes: ["Local_Laws", "Charter", "Bylaws", "Regulations", "Policies", "Procedures", "Manuals", "Guidelines", "Standards", "Codes", "Conventions", "Protocols", "Rules"],
        flow_z: "neutral",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "repo",
        nature: "child",
        description: "Repository or codebase container.",
        color: "#334155",
        defaultEdge: "CHILD_OF",
        allowedChildNodes: [],
        allowedSubNodes: ["folder", "file", "documentation", "article", "paper"],
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    },
    {
        type: "article",
        nature: "child",
        description: "Detailed written content and structural container.",
        color: "#38bdf8",
        defaultEdge: "CHILD_OF",
        allowedChildNodes: ["topic", "concept"], // Upgraded to allow children
        allowedSubNodes: ["source", "file"],
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    },
    {
        type: "paper",
        nature: "child",
        description: "Academic or technical paper.",
        color: "#94a3b8",
        defaultEdge: "CHILD_OF",
        allowedChildNodes: ["topic", "concept"],
        allowedSubNodes: ["taxonomy", "conceptualframework", "concept", "mentalmodel", "principle", "law", "controversy", "misconception", "methodology", "epistemicfoundation", "analyticaltechnique", "bestpractice", "pitfall", "discovery", "technology", "source"],
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    }
];
`;
