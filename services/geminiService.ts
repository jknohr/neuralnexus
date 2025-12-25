
import { GoogleGenAI, Type } from "@google/genai";
// Removed non-existent EdgeTable import causing compilation error
import { GraphNode } from "../types";

// Initialize GoogleGenAI using the exact pattern required by the SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNodePackage = async (title: string, parentContext?: string) => {
  const prompt = `Create a comprehensive knowledge node for "${title}". 
  Context: Part of a graph branching from ${parentContext || 'Root'}.
  Return detailed content in Markdown, a concise summary, and suggest related topics with specific relationship types.
  Relationship types available: CHILD_OF, REFERENCES, RELATED_TO, DEPENDS_ON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          content: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['category', 'article', 'concept', 'entity'] },
          suggestedLinks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                table: { type: Type.STRING, enum: ['CHILD_OF', 'REFERENCES', 'RELATED_TO', 'DEPENDS_ON'] },
                reason: { type: Type.STRING }
              },
              required: ['title', 'table']
            }
          }
        },
        required: ['summary', 'content', 'type', 'suggestedLinks']
      }
    }
  });

  // Extract text from GenerateContentResponse using the .text property as per guidelines
  const jsonStr = response.text;
  if (!jsonStr) {
    throw new Error("Gemini API returned an empty response");
  }
  return JSON.parse(jsonStr.trim());
};

/**
 * Simulates generating a vector embedding using Gemini's knowledge.
 * In a real SurrealDB environment, you'd use a dedicated embedding model.
 */
export const getVectorEmbedding = async (text: string): Promise<number[]> => {
    // Simulated vector dimension
    const size = 128;
    const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: size }, (_, i) => Math.sin(seed + i) * 0.5 + 0.5);
};
