
export const nodeArchtypeSubIndexSchema = `
-- Specific index for Sub nature
DEFINE INDEX node_archtype_sub_idx ON TABLE node_archtype COLUMNS type WHERE nature = 'sub';
`;

export const nodeArchtypeSubIndexData = `
-- Insert default Sub Nodes (nature: 'sub')
INSERT INTO node_archtype CONTENT [
    {
        type: "taxonomy",
        nature: "sub",
        description: "Classification scheme or hierarchy.",
        color: "#a78bfa",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "conceptualframework",
        nature: "sub",
        description: "Analytical tool or model.",
        color: "#c084fc",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: ["concept", "principle", "methodology"],
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "concept",
        nature: "sub",
        description: "Abstract idea or general notion.",
        color: "#d8b4fe",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: ["misconception", "controversy", "principle"],
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "mentalmodel",
        nature: "sub",
        description: "Explanation of thought process.",
        color: "#e879f9",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: ["concept", "pitfall"],
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "principle",
        nature: "sub",
        description: "Fundamental truth or proposition.",
        color: "#f472b6",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "law",
        nature: "sub",
        description: "System of rules or scientific law.",
        color: "#fb7185",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "controversy",
        nature: "sub",
        description: "Public disagreement or debate.",
        color: "#ef4444",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "misconception",
        nature: "sub",
        description: "Mistaken thought or idea.",
        color: "#f87171",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "methodology",
        nature: "sub",
        description: "System of methods in proper field.",
        color: "#fb923c",
        defaultEdge: "DEPENDS_ON",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "epistemicfoundation",
        nature: "sub",
        description: "Theory of knowledge validation.",
        color: "#fdba74",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "analyticaltechnique",
        nature: "sub",
        description: "Specific method of analysis.",
        color: "#fcd34d",
        defaultEdge: "DEPENDS_ON",
        allowedChildNodes: [],
        allowedSubNodes: ["technology"], -- Assuming tool maps to technology
        flow_z: "negative",
        flow_x: "free",
        flow_y: "free"
    },
    {
        type: "bestpractice",
        nature: "sub",
        description: "Commercial or professional standard.",
        color: "#84cc16",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: ["pitfall"],
        flow_z: "neutral",
        flow_x: "positive",
        flow_y: "free"
    },
    {
        type: "pitfall",
        nature: "sub",
        description: "Hidden danger or difficulty.",
        color: "#a3e635",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "neutral",
        flow_x: "positive",
        flow_y: "free"
    },
    {
        type: "discovery",
        nature: "sub",
        description: "Act of detecting something new.",
        color: "#22d3ee",
        defaultEdge: "RELATED_TO",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    },
    {
        type: "technology",
        nature: "sub",
        description: "Application of scientific knowledge.",
        color: "#0ea5e9",
        defaultEdge: "DEPENDS_ON",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    },
    {
        type: "source",
        nature: "sub",
        description: "Origin of information.",
        color: "#94a3b8",
        defaultEdge: "REFERENCES",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    },


    
    // Repo Subtypes
    {
        type: "folder",
        nature: "sub",
        description: "Directory or container.",
        color: "#475569",
        defaultEdge: "CHILD_OF",
        allowedChildNodes: [],
        allowedSubNodes: ["folder", "file"], -- Folders contain files and other folders
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    },
    {
        type: "file",
        nature: "sub",
        description: "Specific file.",
        color: "#64748b",
        defaultEdge: "CHILD_OF",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    },
    {
        type: "documentation",
        nature: "sub",
        description: "Explanatory docs.",
        color: "#94a3b8",
        defaultEdge: "CHILD_OF",
        allowedChildNodes: [],
        allowedSubNodes: [],
        flow_z: "positive",
        flow_x: "free",
        flow_y: "negative"
    },
    
    // Organization Subtypes
    { type: "Local_Laws", nature: "sub", description: "Local legal frameworks.", color: "#713f12", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Charter", nature: "sub", description: "Founding document.", color: "#854d0e", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Bylaws", nature: "sub", description: "Internal rules.", color: "#a16207", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Regulations", nature: "sub", description: "Regulatory requirements.", color: "#ca8a04", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Policies", nature: "sub", description: "Organizational policies.", color: "#d97706", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Procedures", nature: "sub", description: "Standard procedures.", color: "#ea580c", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Manuals", nature: "sub", description: "Instruction manuals.", color: "#c2410c", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Guidelines", nature: "sub", description: "General valid guidelines.", color: "#b45309", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Standards", nature: "sub", description: "Quality standards.", color: "#92400e", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Codes", nature: "sub", description: "Codes of conduct.", color: "#78350f", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Conventions", nature: "sub", description: "Agreed conventions.", color: "#451a03", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Protocols", nature: "sub", description: "Formal protocols.", color: "#7c2d12", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" },
    { type: "Rules", nature: "sub", description: "Specific rules.", color: "#9a3412", defaultEdge: "CHILD_OF", allowedChildNodes: [], allowedSubNodes: [], flow_z: "neutral", flow_x: "free", flow_y: "free" }
];
`;
