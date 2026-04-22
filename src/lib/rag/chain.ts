import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { llm } from "../gemini";
import { getVectorStore } from "./vectorStore";

const RAG_TEMPLATE = `You are DocuMind AI, a helpful and precise document assistant. 
Your goal is to answer the user's question based ONLY on the provided context.

RULES:
1. Use the provided context to answer the question.
2. If the answer is not in the context, say "I'm sorry, I couldn't find that information in the uploaded documents."
3. ALWAYS answer in the same language as the user's question. Specifically, if the user asks in Tamil, you MUST answer in Tamil.
4. Use clear formatting (bullet points, bold text) using Markdown to make the answer easy to read.
5. Be concise but accurate.

CONTEXT:
{context}

USER QUESTION:
{question}

ANSWER (in the same language):`;

const promptTemplate = PromptTemplate.fromTemplate(RAG_TEMPLATE);

export const createRAGChain = async () => {
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever(4);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough()
    },
    promptTemplate,
    llm,
    new StringOutputParser()
  ]);

  return chain;
};

export const retrieveContext = async (query: string) => {
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever(4);
  return retriever.invoke(query);
};
