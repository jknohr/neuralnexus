
export const TABLE_METADATA = {
  CHILD_OF: { label: 'Parent-Child', description: 'Hierarchical link representing nesting.' },
  REFERENCES: { label: 'Referential', description: 'Citation or mention of another node.' },
  RELATED_TO: { label: 'Associative', description: 'General semantic relationship.' },
  DEPENDS_ON: { label: 'Prerequisite', description: 'Requirement relationship.' }
};

// Colors for different node types in the knowledge graph
export const NODE_COLORS: Record<string, string> = {
  category: '#818cf8',
  article: '#38bdf8',
  concept: '#a78bfa',
  entity: '#fb7185'
};

// Colors for different relationship types (EdgeTable)
export const EDGE_COLORS: Record<string, string> = {
  CHILD_OF: '#6366f1',
  REFERENCES: '#10b981',
  RELATED_TO: '#f59e0b',
  DEPENDS_ON: '#ef4444'
};
