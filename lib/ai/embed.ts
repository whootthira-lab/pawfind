import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function createEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: 'user' },
    outputDimensionality: 768
  } as any);
  return result.embedding.values;
}

// Weighted average embedding จากหลายรูป
export function weightedAverageEmbedding(
  embeddings: { vector: number[], weight: number }[]
): number[] {
  const totalWeight = embeddings.reduce((s, e) => s + e.weight, 0);
  const dim = embeddings[0].vector.length;
  const result = new Array(dim).fill(0);

  for (const { vector, weight } of embeddings) {
    for (let i = 0; i < dim; i++) {
      result[i] += vector[i] * weight;
    }
  }
  return result.map(v => v / totalWeight);
}
