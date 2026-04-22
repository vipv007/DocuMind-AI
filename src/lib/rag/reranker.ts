import { Document } from "@langchain/core/documents";
import { llm } from "../gemini";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const RERANK_PROMPT = `You are a Search Result Ranker. Your goal is to identify which documents are most relevant to the user's question.

USER QUESTION: {question}

DOCUMENTS:
{documents}

INSTRUCTIONS:
1. Rate each document based on how well it can answer the question.
2. Return only the IDs of the top {topK} most relevant documents, separated by commas.
3. Do not explain anything. Just the IDs.

EXAMPLE OUTPUT: 2, 5, 1, 10`;

const rerankTemplate = PromptTemplate.fromTemplate(RERANK_PROMPT);

/**
 * Re-ranks a list of documents based on their relevance to the query.
 * Uses Gemini to score and select the best chunks.
 */
export const rerankDocuments = async (
  query: string,
  docs: Document[],
  topK: number = 4
): Promise<Document[]> => {
  // If we have very few docs, don't bother re-ranking
  if (docs.length <= topK) return docs;

  // 1. Limit candidates to 10 for speed
  const candidates = docs.slice(0, 10);

  // 2. Prepare the documents
  const documentsFormatted = candidates
    .map((doc, i) => `[${i}] ${doc.pageContent.slice(0, 500)}`) // Use snippets for speed
    .join("\n");

  try {
    const { callGroq } = await import("../gemini");
    const prompt = `Which 4 document IDs are most relevant to: "${query}"?
    
    DOCS:
    ${documentsFormatted}
    
    Return ONLY IDs like: 0, 2, 5, 1`;

    const result = await callGroq(prompt);
    const topIds = result
      .split(",")
      .map((id) => parseInt(id.trim().replace(/[\[\]]/g, "")))
      .filter((id) => !isNaN(id) && id < candidates.length);

    const rerankedDocs = topIds.map((id) => candidates[id]);
    return rerankedDocs.length > 0 ? rerankedDocs.slice(0, topK) : docs.slice(0, topK);
  } catch (error) {
    return docs.slice(0, topK);
  }
};
