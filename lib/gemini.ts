import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini API Wrapper — Central helper for all Gemini calls
 * Uses Gemini 1.5/2.5 for speed (hackathon constraint)
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// Keep GEMINI_BASE for any direct REST implementations left
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface GeminiRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Call Gemini Flash with a text prompt using SDK
 */
export async function callGemini({ prompt, temperature = 0.7, maxTokens = 8192 }: GeminiRequest): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
  });
  return result.response.text();
}

/**
 * Call Gemini Vision (for image/PDF analysis) using SDK
 */
export async function callGeminiVision(base64Data: string, mimeType: string, prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType, data: base64Data } },
      ],
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });
  return result.response.text();
}

/**
 * Get text embeddings using Gemini Embedding API
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const url = `${GEMINI_BASE}/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text }] },
    }),
  });

  if (!res.ok) {
    throw new Error(`Embedding API error ${res.status}`);
  }

  const data = await res.json();
  return data.embedding?.values || [];
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((s, a) => s + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((s, b) => s + b * b, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}
