/**
 * Embedding Tracker Service
 * 
 * Tracks whether node embeddings are stale (content changed since last embed).
 * Uses content hash comparison to determine if re-embedding is needed.
 * Only triggers embedding for providers that have valid API keys and are enabled.
 */

import { surrealService } from './surrealService';
import { GraphNode } from '../types';
import * as gemini from './geminiService';
import * as openai from './openaiService';
import * as anthropic from './anthropicService';

// ============================================================================
// TYPES
// ============================================================================

export interface EmbeddingStatus {
    nodeId: string;
    contentHash: string;
    lastEmbedded: {
        gemini?: string;    // ISO timestamp
        openai?: string;
        anthropic?: string;
    };
    pendingProviders: ('gemini' | 'openai' | 'anthropic')[];
}

export interface ProviderConfig {
    gemini: { enabled: boolean; hasKey: boolean };
    openai: { enabled: boolean; hasKey: boolean };
    anthropic: { enabled: boolean; hasKey: boolean };
}

// ============================================================================
// HASH FUNCTION
// ============================================================================

/**
 * Creates a simple hash of node content for change detection.
 * Uses title + summary + content + media URLs.
 */
function hashNodeContent(node: GraphNode): string {
    const contentString = [
        node.title,
        node.summary,
        node.content,
        node.media?.map(m => m.url).join('|') || ''
    ].join('::');

    // Simple hash (djb2 algorithm)
    let hash = 5381;
    for (let i = 0; i < contentString.length; i++) {
        hash = ((hash << 5) + hash) + contentString.charCodeAt(i);
    }
    return hash.toString(16);
}

// ============================================================================
// PROVIDER DETECTION
// ============================================================================

/**
 * Detects which providers have valid API keys configured.
 */
export function detectProviderConfig(): ProviderConfig {
    return {
        gemini: {
            hasKey: !!(import.meta.env.VITE_GEMINI_API_KEY),
            enabled: localStorage.getItem('embed_gemini') !== 'false' // Default enabled if key exists
        },
        openai: {
            hasKey: !!(import.meta.env.VITE_OPENAI_API_KEY),
            enabled: localStorage.getItem('embed_openai') !== 'false'
        },
        anthropic: {
            hasKey: !!(import.meta.env.VITE_VOYAGE_API_KEY), // Voyage for Anthropic embedding
            enabled: localStorage.getItem('embed_anthropic') !== 'false'
        }
    };
}

/**
 * Sets provider embedding enabled status.
 */
export function setProviderEnabled(provider: 'gemini' | 'openai' | 'anthropic', enabled: boolean): void {
    localStorage.setItem(`embed_${provider}`, enabled ? 'true' : 'false');
}

/**
 * Gets list of active providers (has key + enabled).
 */
export function getActiveProviders(): ('gemini' | 'openai' | 'anthropic')[] {
    const config = detectProviderConfig();
    const active: ('gemini' | 'openai' | 'anthropic')[] = [];

    if (config.gemini.hasKey && config.gemini.enabled) active.push('gemini');
    if (config.openai.hasKey && config.openai.enabled) active.push('openai');
    if (config.anthropic.hasKey && config.anthropic.enabled) active.push('anthropic');

    return active;
}

// ============================================================================
// STALENESS CHECK
// ============================================================================

/**
 * Checks if a node needs re-embedding.
 * Returns list of providers that need to generate new embeddings.
 */
export function checkEmbeddingStatus(node: GraphNode): {
    isStale: boolean;
    staleProviders: ('gemini' | 'openai' | 'anthropic')[];
    currentHash: string;
} {
    const currentHash = hashNodeContent(node);
    const storedHash = node.metadata?.contentHash as string | undefined;

    // If hash matches, no providers are stale
    if (storedHash === currentHash) {
        return { isStale: false, staleProviders: [], currentHash };
    }

    // Content changed - determine which providers need update
    const activeProviders = getActiveProviders();
    const staleProviders: ('gemini' | 'openai' | 'anthropic')[] = [];

    for (const provider of activeProviders) {
        const embeddingField = provider === 'gemini' ? 'embedding_gemini'
            : provider === 'openai' ? 'embedding_openai'
                : 'embedding_anthropic'; // Aligned with node_schema.ts

        const hasEmbedding = node[embeddingField as keyof GraphNode];

        // If no embedding, or hash is different, it's stale
        if (!hasEmbedding || storedHash !== currentHash) {
            staleProviders.push(provider);
        }
    }

    return { isStale: staleProviders.length > 0, staleProviders, currentHash };
}

// ============================================================================
// EMBEDDING EXECUTION
// ============================================================================

/**
 * Generates embeddings for a node using all enabled providers.
 * Updates the node in DB with new embeddings and content hash.
 */
export async function embedNodeIfNeeded(node: GraphNode): Promise<{
    updated: boolean;
    providers: string[];
    errors: string[];
}> {
    const status = checkEmbeddingStatus(node);

    if (!status.isStale) {
        return { updated: false, providers: [], errors: [] };
    }

    const updates: Partial<GraphNode> = {};
    const successProviders: string[] = [];
    const errors: string[] = [];

    // Run providers in parallel
    const promises = status.staleProviders.map(async (provider) => {
        try {
            let embedding: number[] | null = null;

            switch (provider) {
                case 'gemini':
                    embedding = await gemini.getMultimodalEmbedding(node);
                    if (embedding) updates.embedding_gemini = embedding;
                    break;
                case 'openai':
                    embedding = await openai.embedNode(node);
                    if (embedding) updates.embedding_openai = embedding;
                    break;
                case 'anthropic':
                    embedding = await anthropic.embedNode(node);
                    if (embedding) updates.embedding_anthropic = embedding;
                    break;
            }

            if (embedding) {
                successProviders.push(provider);
            }
        } catch (e) {
            errors.push(`${provider}: ${(e as Error).message}`);
        }
    });

    await Promise.all(promises);

    // Update content hash in metadata
    if (successProviders.length > 0) {
        updates.metadata = {
            ...node.metadata,
            contentHash: status.currentHash,
            lastEmbedded: new Date().toISOString()
        };

        // Persist to database
        await surrealService.updateNodeFields(node.id, updates);
    }

    return { updated: successProviders.length > 0, providers: successProviders, errors };
}

/**
 * Batch embed multiple nodes.
 */
export async function embedNodesIfNeeded(nodes: GraphNode[]): Promise<{
    total: number;
    updated: number;
    errors: string[];
}> {
    const results = await Promise.all(nodes.map(n => embedNodeIfNeeded(n)));

    return {
        total: nodes.length,
        updated: results.filter(r => r.updated).length,
        errors: results.flatMap(r => r.errors)
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const embeddingTracker = {
    detectProviderConfig,
    setProviderEnabled,
    getActiveProviders,
    checkEmbeddingStatus,
    embedNodeIfNeeded,
    embedNodesIfNeeded,
    hashNodeContent
};
