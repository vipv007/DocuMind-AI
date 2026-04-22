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

  // 1. Prepare the documents with indices as IDs
  const documentsFormatted = docs
    .map((doc, i) => `ID: ${i}\nCONTENT: ${doc.pageContent}`)
    .join("\n\n---\n\n");

  try {
    // 2. Ask Gemini to rank them
    const chain = rerankTemplate.pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({
      question: query,
      documents: documentsFormatted,
      topK: topK,
    });

    // 3. Parse the IDs from the output (e.g., "2, 5, 1, 10")
    const topIds = result
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id < docs.length);

    // 4. Return the selected documents in order of relevance
    const rerankedDocs = topIds.map((id) => docs[id]);

    // Fallback: If AI fails to return proper IDs, return first K
    if (rerankedDocs.length === 0) return docs.slice(0, topK);

    console.log(`🎯 Re-ranked: Selected ${rerankedDocs.length} chunks out of ${docs.length}`);
    return rerankedDocs.slice(0, topK);
  } catch (error) {
    console.error("❌ Re-ranking failed:", error);
    return docs.slice(0, topK);
  }
};
