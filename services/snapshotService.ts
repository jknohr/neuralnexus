/**
 * Snapshot Service
 * 
 * Generates a structured context snapshot for LLM consumption.
 * Includes: Active Node, Viewport Nodes, Subnodes, Relationships, Semantic Neighbors.
 * Output: Heavy Markdown + XML tags for maximum clarity and instruction-following.
 */

import { surrealService } from './surrealService';
import { GraphNode, GraphEdge, GraphData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface RelatedNode {
    node: GraphNode;
    edgeType: string;
    direction: 'parent' | 'child' | 'subnode' | 'linked';
}

interface SemanticNeighbor {
    node: GraphNode;
    similarity: number;
}

interface ContextSnapshot {
    activeNode: GraphNode;
    directRelations: RelatedNode[];
    subnodes: GraphNode[];
    viewportNodes: GraphNode[];
    viewportSubnodes: GraphNode[]; // Subnodes of viewport nodes connected to active
    semanticNeighbors: SemanticNeighbor[];
    userQuery: string;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generates a complete context snapshot for LLM consumption.
 */
export async function generateSnapshot(
    activeNode: GraphNode,
    viewportNodes: GraphNode[],
    graphData: GraphData,
    userQuery: string,
    embeddingProvider: 'gemini' | 'openai' | 'anthropic' = 'gemini',
    kNeighbors: number = 5
): Promise<ContextSnapshot> {

    // 1. Get direct relations from edge table
    const directRelations = await getDirectRelations(activeNode.id, graphData.links);

    // 2. Get subnodes of active node
    const subnodes = getSubnodesOf(activeNode, graphData.nodes);

    // 3. Get subnodes of viewport nodes that are connected to active node
    const viewportSubnodes = getViewportSubnodesConnectedToActive(
        activeNode,
        viewportNodes,
        graphData.nodes,
        graphData.links
    );

    // 4. Get semantic neighbors using vector search
    const semanticNeighbors = await findSemanticNeighbors(
        activeNode,
        embeddingProvider,
        kNeighbors
    );

    return {
        activeNode,
        directRelations,
        subnodes,
        viewportNodes,
        viewportSubnodes,
        semanticNeighbors,
        userQuery
    };
}

/**
 * Formats the snapshot into a structured Markdown + XML document for LLM consumption.
 */
export function formatForLLM(snapshot: ContextSnapshot): string {
    const lines: string[] = [];

    // ========== HEADER ==========
    lines.push(`<context_snapshot>`);
    lines.push(`<!-- This document contains structured context for answering the user's query. -->`);
    lines.push(`<!-- Pay attention to hierarchy levels and relationship labels. -->`);
    lines.push(``);

    // ========== USER QUERY ==========
    lines.push(`# USER QUERY`);
    lines.push(`<user_query>`);
    lines.push(snapshot.userQuery);
    lines.push(`</user_query>`);
    lines.push(``);

    // ========== FOCUS NODE (ACTIVE) ==========
    lines.push(`# FOCUS NODE (Primary Context)`);
    lines.push(`<focus_node>`);
    lines.push(formatNodeBlock(snapshot.activeNode, 2));
    lines.push(`</focus_node>`);
    lines.push(``);

    // ========== SUBNODES OF FOCUS ==========
    if (snapshot.subnodes.length > 0) {
        lines.push(`## Subnodes of Focus (Clarifying Content)`);
        lines.push(`<subnodes_of_focus>`);
        lines.push(`<!-- These subnodes provide deeper context and definitions for the focus node. -->`);
        for (const sub of snapshot.subnodes) {
            lines.push(formatNodeBlock(sub, 3));
        }
        lines.push(`</subnodes_of_focus>`);
        lines.push(``);
    }

    // ========== DIRECT RELATIONSHIPS ==========
    if (snapshot.directRelations.length > 0) {
        lines.push(`# DIRECT RELATIONSHIPS`);
        lines.push(`<direct_relationships>`);

        // Group by direction
        const parents = snapshot.directRelations.filter(r => r.direction === 'parent');
        const children = snapshot.directRelations.filter(r => r.direction === 'child');
        const linked = snapshot.directRelations.filter(r => r.direction === 'linked');

        if (parents.length > 0) {
            lines.push(`## Parent Nodes (Hierarchical Context)`);
            lines.push(`<parent_nodes>`);
            for (const rel of parents) {
                lines.push(`<relationship type="${rel.edgeType}" direction="parent">`);
                lines.push(formatNodeBlock(rel.node, 3));
                lines.push(`</relationship>`);
            }
            lines.push(`</parent_nodes>`);
        }

        if (children.length > 0) {
            lines.push(`## Child Nodes (Hierarchical Descendants)`);
            lines.push(`<child_nodes>`);
            for (const rel of children) {
                lines.push(`<relationship type="${rel.edgeType}" direction="child">`);
                lines.push(formatNodeBlock(rel.node, 3));
                lines.push(`</relationship>`);
            }
            lines.push(`</child_nodes>`);
        }

        if (linked.length > 0) {
            lines.push(`## Linked Nodes (Associative)`);
            lines.push(`<linked_nodes>`);
            for (const rel of linked) {
                lines.push(`<relationship type="${rel.edgeType}" direction="linked">`);
                lines.push(formatNodeBlock(rel.node, 3));
                lines.push(`</relationship>`);
            }
            lines.push(`</linked_nodes>`);
        }

        lines.push(`</direct_relationships>`);
        lines.push(``);
    }

    // ========== VIEWPORT CONTEXT ==========
    if (snapshot.viewportNodes.length > 0) {
        lines.push(`# VIEWPORT CONTEXT (User's Current View)`);
        lines.push(`<viewport_nodes>`);
        lines.push(`<!-- These nodes are currently visible in the user's 3D graph view. -->`);
        for (const node of snapshot.viewportNodes) {
            lines.push(formatNodeSummary(node));
        }
        lines.push(`</viewport_nodes>`);
        lines.push(``);
    }

    // ========== VIEWPORT SUBNODES CONNECTED TO FOCUS ==========
    if (snapshot.viewportSubnodes.length > 0) {
        lines.push(`## Viewport Subnodes (Connected to Focus)`);
        lines.push(`<viewport_subnodes_connected>`);
        lines.push(`<!-- Subnodes of viewport nodes that have a relationship to the focus node. -->`);
        for (const sub of snapshot.viewportSubnodes) {
            lines.push(formatNodeBlock(sub, 3));
        }
        lines.push(`</viewport_subnodes_connected>`);
        lines.push(``);
    }

    // ========== SEMANTIC NEIGHBORS ==========
    if (snapshot.semanticNeighbors.length > 0) {
        lines.push(`# SEMANTIC NEIGHBORS (Embedding-Based Similarity)`);
        lines.push(`<semantic_neighbors>`);
        lines.push(`<!-- These nodes are semantically similar based on vector embeddings. -->`);
        for (const neighbor of snapshot.semanticNeighbors) {
            lines.push(`<neighbor similarity="${neighbor.similarity.toFixed(3)}">`);
            lines.push(formatNodeSummary(neighbor.node));
            lines.push(`</neighbor>`);
        }
        lines.push(`</semantic_neighbors>`);
        lines.push(``);
    }

    lines.push(`</context_snapshot>`);

    return lines.join('\n');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNodeBlock(node: GraphNode, headingLevel: number): string {
    const heading = '#'.repeat(headingLevel);
    const lines = [
        `${heading} [${node.type.toUpperCase()}] ${node.title}`,
        `<node id="${node.id}" type="${node.type}">`,
        `<summary>${node.summary || 'No summary available.'}</summary>`,
        `<content>`,
        node.content || 'No content available.',
        `</content>`,
        `</node>`
    ];
    return lines.join('\n');
}

function formatNodeSummary(node: GraphNode): string {
    return `- **[${node.type}]** ${node.title} (ID: ${node.id}): ${node.summary?.slice(0, 100) || 'No summary'}...`;
}

async function getDirectRelations(nodeId: string, links: GraphEdge[]): Promise<RelatedNode[]> {
    // Filter edges where the node is source or target
    const relations: RelatedNode[] = [];

    for (const edge of links) {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

        if (sourceId === nodeId) {
            // This node is the source, so target is child/linked
            const targetNode = typeof edge.target === 'string' ? null : edge.target;
            if (targetNode) {
                relations.push({
                    node: targetNode,
                    edgeType: edge.type,
                    direction: edge.nature === 'child' ? 'child' : 'linked'
                });
            }
        } else if (targetId === nodeId) {
            // This node is the target, so source is parent
            const sourceNode = typeof edge.source === 'string' ? null : edge.source;
            if (sourceNode) {
                relations.push({
                    node: sourceNode,
                    edgeType: edge.type,
                    direction: edge.nature === 'child' ? 'parent' : 'linked'
                });
            }
        }
    }

    return relations;
}

function getSubnodesOf(node: GraphNode, allNodes: GraphNode[]): GraphNode[] {
    if (!node.subnodes || node.subnodes.length === 0) return [];

    return allNodes.filter(n => node.subnodes?.includes(n.id));
}

function getViewportSubnodesConnectedToActive(
    activeNode: GraphNode,
    viewportNodes: GraphNode[],
    allNodes: GraphNode[],
    links: GraphEdge[]
): GraphNode[] {
    const result: GraphNode[] = [];
    const activeRelatedIds = new Set<string>();

    // Collect all node IDs directly related to active node
    for (const edge of links) {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

        if (sourceId === activeNode.id) activeRelatedIds.add(targetId);
        if (targetId === activeNode.id) activeRelatedIds.add(sourceId);
    }

    // For each viewport node, if it's related to active, include its subnodes
    for (const vNode of viewportNodes) {
        if (activeRelatedIds.has(vNode.id) && vNode.subnodes) {
            const subs = allNodes.filter(n => vNode.subnodes?.includes(n.id));
            result.push(...subs);
        }
    }

    return result;
}

async function findSemanticNeighbors(
    node: GraphNode,
    provider: 'gemini' | 'openai' | 'anthropic',
    k: number
): Promise<SemanticNeighbor[]> {
    // Select the appropriate embedding field
    const embeddingField = provider === 'gemini' ? 'embedding_gemini'
        : provider === 'openai' ? 'embedding_openai'
            : 'embedding_anthropic';

    const embedding = node[embeddingField as keyof GraphNode] as number[] | undefined;

    if (!embedding || embedding.length === 0) {
        console.warn(`Node ${node.id} has no ${embeddingField} embedding for semantic search.`);
        return [];
    }

    try {
        // SurrealDB KNN vector search using the MTREE index
        // Syntax: SELECT *, vector::similarity::cosine(field, $vec) AS similarity FROM table WHERE field <|K,D|> $vec
        const query = `
      SELECT *, vector::similarity::cosine(${embeddingField}, $embedding) AS similarity 
      FROM node 
      WHERE ${embeddingField} <|${k},${embedding.length}|> $embedding
      AND id != $nodeId
      ORDER BY similarity DESC
      LIMIT ${k};
    `;

        const results = await surrealService.query(query, {
            embedding,
            nodeId: node.id
        });

        if (results && Array.isArray(results) && results.length > 0) {
            return results.map((r: any) => ({
                node: r as GraphNode,
                similarity: r.similarity || 0
            }));
        }
    } catch (e) {
        console.error('Semantic neighbor search failed:', e);
    }

    return [];
}

// ============================================================================
// EXPORTS
// ============================================================================

export const snapshotService = {
    generateSnapshot,
    formatForLLM
};
