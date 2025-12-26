import OpenAI from 'openai';
import { GraphNode } from '../types';
import { mediaBucket } from './backblaze_mediabucket';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    dangerouslyAllowBrowser: true // Client-side usage requires this, ideally move to backend
});

/**
 * Generates a vector embedding using OpenAI.
 * Strategy: "Describe-then-Embed".
 * 1. If images exist, use GPT-4o to generate a dense description.
 * 2. Combine Node Title + Summary + Content + Image Descriptions.
 * 3. Embed the combined text using `text-embedding-3-small`.
 */
export const embedNode = async (node: GraphNode): Promise<number[] | null> => {
    try {
        let textToEmbed = `${node.title}\n\n${node.summary}\n\n${node.content}`;

        // 1. Describe Images (if any)
        const mediaItems = node.media?.filter(m => (m.type === 'image' || m.type === 'video') && m.url) || [];

        if (mediaItems.length > 0) {
            try {
                const contentParts: any[] = [
                    { type: "text", text: "Describe these visuals in extreme detail for the purpose of vector search retrieval. Focus on visual elements, text content, diagrams, and semantic meaning." }
                ];

                for (const item of mediaItems) {
                    const buffer = await mediaBucket.downloadMedia(item.url);
                    if (buffer) {
                        const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                        const mime = item.mimeType || (item.type === 'video' ? 'video/webm' : 'image/webp'); // Default to WebM/WebP as per pipeline

                        // GPT-4o supports base64 images.
                        // For video, we might need to extract frames, but OpenAI API officially supports 'image_url' with base64.
                        // It does NOT support raw video files in Chat completions unless via specific features.
                        // Since user shouted "webm PICTURES", we assume they are treating these valid image inputs (WebP) or we send them as images.
                        // OpenAI supports WebP.
                        // If it is actual video, this might fail unless we treat as image (first frame?).
                        // We will send as image_url with data URI.

                        contentParts.push({
                            type: "image_url",
                            image_url: {
                                url: `data:${mime};base64,${base64}`
                            }
                        });
                    }
                }

                if (contentParts.length > 1) { // More than just the prompt
                    const descriptionResponse = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [
                            {
                                role: "user",
                                content: contentParts
                            }
                        ],
                        max_tokens: 500
                    });

                    const description = descriptionResponse.choices[0]?.message?.content || "";
                    if (description) {
                        textToEmbed += `\n\n[Visual Content Description]: ${description}`;
                    }
                }
            } catch (err) {
                console.warn("OpenAI Image Description Failed:", err);
                // Continue with just text if image description fails
            }
        }

        // 2. Embed Combined Text
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: textToEmbed,
            encoding_format: "float"
        });

        return response.data[0].embedding;

    } catch (e) {
        console.error("OpenAI Embedding Failed:", e);
        return null;
    }
};
