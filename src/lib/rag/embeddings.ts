import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Get the best available API key for embeddings
function getEmbeddingKey(): string {
  return process.env.GOOGLE_API_KEY || "";
}

// Using Google's gemini-embedding-001 model (Natural 3072 dimensions)
export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: getEmbeddingKey(),
  modelName: "models/gemini-embedding-001",
});
