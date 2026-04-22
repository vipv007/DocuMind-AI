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
  if (docs.length <= topK) return docs;

  // 1. Retrieve top 15 candidates
  const candidates = docs.slice(0, 15);

  // 2. Prepare the documents for ranking
  const documentsFormatted = candidates
    .map((doc, i) => `ID: ${i}\nCONTENT: ${doc.pageContent}`)
    .join("\n\n---\n\n");

  try {
    const { llm } = await import("../gemini");
    const { StringOutputParser } = await import("@langchain/core/output_parsers");
    
    const RERANK_PROMPT = `You are a Search Result Ranker. identify which documents are most relevant to: "${query}"

DOCUMENTS:
${documentsFormatted}

Return ONLY the top ${topK} IDs separated by commas.
Example: 2, 5, 1, 10`;

    const chain = PromptTemplate.fromTemplate(RERANK_PROMPT).pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({});

    const topIds = result
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id < candidates.length);

    const rerankedDocs = topIds.map((id) => candidates[id]);
    return rerankedDocs.length > 0 ? rerankedDocs.slice(0, topK) : docs.slice(0, topK);
  } catch (error) {
    console.error("Re-ranking failed:", error);
    return docs.slice(0, topK);
  }
};
