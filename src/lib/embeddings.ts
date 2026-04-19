import OpenAI from "openai";

export async function generateEmbedding(text: string, openaiApiKey: string): Promise<number[]> {
  if (!openaiApiKey) {
    throw new Error("OpenAI API Key is required to generate embeddings for memory.");
  }

  const openai = new OpenAI({ apiKey: openaiApiKey, baseURL: `${window.location.origin}/api/proxy/openai`, dangerouslyAllowBrowser: true });
  
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  return response.data[0].embedding;
}
