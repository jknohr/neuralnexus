
import { GoogleGenAI, Type } from "@google/genai";
// Removed non-existent EdgeTable import causing compilation error
import { GraphNode } from "../types";
import { mediaBucket } from "./backblaze_mediabucket";

// Initialize GoogleGenAI
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

/**
 * Generates a multimodal vector embedding using Gemini's `multimodal-embedding-001` model.
 * Consumes the Node's text content AND any attached images.
 */
export const getMultimodalEmbedding = async (node: GraphNode): Promise<number[] | null> => {
  try {
    const parts: any[] = [];

    // 1. Text Content
    if (node.content && node.content.trim()) {
      parts.push({ text: node.title + "\n" + node.summary + "\n" + node.content });
    }

    // 2. Image/Video Content (Fetch from B2)
    if (node.media && node.media.length > 0) {
      for (const item of node.media) {
        if (item.url && (item.type === 'image' || item.type === 'video')) {
          // Filter for supported formats if strictly needed, but Gemini is flexible.
          // User said "webm PICTURES" - usually means WebP images or WebM video.
          // We accept both.
          try {
            const buffer = await mediaBucket.downloadMedia(item.url);
            if (!buffer) continue;

            const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

            parts.push({
              inlineData: {
                mimeType: item.mimeType || (item.type === 'video' ? "video/webm" : "image/webp"),
                data: base64
              }
            });
          } catch (e) {
            console.warn(`Failed to fetch media for embedding: ${item.url}`, e);
          }
        }
      }
    }

    if (parts.length === 0) return null;

    const response = await ai.models.embedContent({
      model: 'multimodal-embedding-001',
      contents: [{ parts: parts }]
    });

    // SDK Response fix: The type definition might imply batch response structure or specific version difference.
    // We safely access embedding or embeddings.
    const respAny = response as any;
    const values = respAny.embedding?.values || respAny.embeddings?.[0]?.values;
    return values || null;
  } catch (e) {
    console.error("Gemini Multimodal Embedding Failed:", e);
    return null; // Fail gracefully
  }
};

// Stub for build compatibility
export const generateNodePackage = async (title: string, parentContext?: string): Promise<any> => {
  throw new Error("Generation features are currently disabled. Focus on Embedding Pipeline.");
};

// Legacy text-only shim (deprecated)
export const getVectorEmbedding = async (text: string): Promise<number[]> => {
  // Forward to multimodal handler with a dummy node wrapper
  const dummyNode: any = { content: text, title: '', summary: '', media: [] };
  const result = await getMultimodalEmbedding(dummyNode);
  return result || [];
};
