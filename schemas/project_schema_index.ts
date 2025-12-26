
/**
 * # NEURAL NEXUS SCHEMA DEFINITIONS
 * 
 * Architecture:
 * - Namespace: 'neuralnexus' (Generic, Locked)
 * - Management Database: 'neuralindex' (Settings, Project Registry, Schema Index)
 * - Project Databases: One per project (Knowledge Graph Content & Structure)
 */

// ===========================================
// IMPORTS
// ===========================================
import { settingsSchema } from './settings_schema';
import { projectSchema } from './project_schema';
import { nodeArchtypeSchema } from './node_archtype_schema';
import { edgeTaxonomySchema } from './edge_taxonomy_schema';
import { nodeSchema } from './node_schema';
import { edgeSchema } from './edge_schema';

import { nodeArchtypeChildIndexSchema, nodeArchtypeChildIndexData } from './node_archtype_child_index';
import { nodeArchtypeSubIndexSchema, nodeArchtypeSubIndexData } from './node_archtype_sub_index';
import { edgeTaxonomyChildIndexSchema, edgeTaxonomyChildIndexData } from './edge_taxonomy_child_index';
import { edgeTaxonomySubIndexSchema, edgeTaxonomySubIndexData } from './edge_taxonomy_sub_index';
import { edgeTaxonomyLinkIndexSchema, edgeTaxonomyLinkIndexData } from './edge_taxonomy_link_index';

// Export individual modules for selective usage
export * from './edge_taxonomy_schema';
export * from './edge_schema';
export * from './node_archtype_schema';
export * from './node_schema';
export * from './node_archtype_child_index';
export * from './node_archtype_sub_index';
export * from './edge_taxonomy_child_index';
export * from './edge_taxonomy_link_index';
export * from './edge_taxonomy_sub_index';
export * from './project_schema';
export * from './settings_schema';

// ==================================================================================
// 1. NEURALINDEX SCHEMA (Management Database)
// ==================================================================================
// This schema is applied to the 'neuralindex' database.
// It manages the global application state and the index of all projects.
// It also acts as the central repository for Local Project Definitions 
// (stored in the 'project' table's 'local_definitions' field) for indexing purposes.
// ==================================================================================
export const NEURALINDEX_DB_SCHEMA = `
-- Global Settings (API Keys, UI Preferences)
${settingsSchema}

-- Project Registry (Index of Projects & Local Definition Storage)
${projectSchema}
`;


// ==================================================================================
// 2. PROJECT DATABASE SCHEMA (Knowledge Graph)
// ==================================================================================
// This schema is applied to EACH individual Project Database (e.g., database 'my_research').
// It establishes the Graph Structure (Archetypes/Taxonomies) and the Content Tables (Nodes/Edges).
// It also seeds the "Standard Library" of global types.
// ==================================================================================
export const PROJECT_DB_SCHEMA = `
-- A. Structure Tables (The 'Rules' of the Graph)
${nodeArchtypeSchema}            -- Defines 'TABLE node_archtype'
${edgeTaxonomySchema}            -- Defines 'TABLE edge_taxonomy'

-- B. Content Tables (The 'Data' of the Graph)
${nodeSchema}                    -- Defines 'TABLE node' (Standard Content Node)
${edgeSchema}                    -- Defines 'TABLE edge' (Blueprint for Edge Tables)

-- C. Indexes (Optimization)
${nodeArchtypeChildIndexSchema}
${nodeArchtypeSubIndexSchema}
${edgeTaxonomyChildIndexSchema}
${edgeTaxonomySubIndexSchema}
${edgeTaxonomyLinkIndexSchema}

-- D. Bootstrap Data (Seed Global Defaults)
${nodeArchtypeChildIndexData}    -- Inserts Standard Child Nodes
${nodeArchtypeSubIndexData}      -- Inserts Standard Sub Nodes
${edgeTaxonomyChildIndexData}    -- Inserts Standard Child Edges
${edgeTaxonomySubIndexData}      -- Inserts Standard Sub Edges
${edgeTaxonomyLinkIndexData}     -- Inserts Standard Link Edges
`;
