import { GraphNode } from '../types';
import { mediaBucket } from './backblaze_mediabucket';

/**
 * Service for "Anthropic" tasks, utilizing Voyage AI for embeddings as recommended.
 * Note: No official Voyage AI JS SDK exists, so we use direct HTTP calls.
 */

const VOYAGE_API_KEY = import.meta.env.VITE_VOYAGE_API_KEY || '';
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/multimodalembeddings'; // Check exact endpoint for multimodal

export const embedNode = async (node: GraphNode): Promise<number[] | null> => {
    if (!VOYAGE_API_KEY) {
        console.error("Missing VITE_VOYAGE_API_KEY");
        return null;
    }

    try {
        // Voyage Multimodal Input Structure: Object with 'content' and 'type' (text/image)
        const multimodalInput: any[] = [];

        // 1. Add Text
        const fullText = `${node.title}\n${node.summary}\n${node.content}`;
        if (fullText.trim()) {
            multimodalInput.push({ type: "text", content: fullText });
        }

        // 2. Add Images
        if (node.media && node.media.length > 0) {
            for (const item of node.media) {
                if (item.url && (item.type === 'image' || item.type === 'video')) {
                    try {
                        const buffer = await mediaBucket.downloadMedia(item.url);
                        if (!buffer) continue;

                        const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

                        multimodalInput.push({
                            type: "image",
                            content: base64,
                            mime_type: item.mimeType || "image/webp" // Defaulting to WebP as per our MediaPipeline
                        });
                    } catch (e) {
                        console.warn(`Failed to process image for Voyage: ${item.url}`);
                    }
                }
            }
        }

        if (multimodalInput.length === 0) return null;

        // Perform HTTP Request
        const response = await fetch(VOYAGE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VOYAGE_API_KEY}`
            },
            body: JSON.stringify({
                inputs: [multimodalInput], // Batch of 1 complex input (which is itself a list of parts)
                model: "voyage-multimodal-3",
                input_type: "document"
            })
        });

        if (!response.ok) {
            const err = await response.text();
            // Fallback to text-only if multimodal fails or model not accessable
            console.warn(`Voyage Multimodal Failed (${response.status}): ${err}. Creating text-only fallback.`);
            return await embedTextOnly(fullText);
        }

        const data = await response.json();
        return data.data?.[0]?.embedding || null;

    } catch (e) {
        console.error("Voyage AI Embedding Failed:", e);
        return null;
    }
};

const embedTextOnly = async (text: string): Promise<number[] | null> => {
    try {
        const response = await fetch('https://api.voyageai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VOYAGE_API_KEY}`
            },
            body: JSON.stringify({
                input: [text],
                model: "voyage-3-large"
            })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.data?.[0]?.embedding || null;
    } catch (e) {
        console.error("Voyage Text Backup Failed:", e);
        return null;
    }
}
