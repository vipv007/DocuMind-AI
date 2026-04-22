import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

export const getChunker = () => {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
};

export const splitText = async (text: string, metadata: Record<string, any> = {}): Promise<Document[]> => {
  const splitter = getChunker();
  return splitter.createDocuments([text], [metadata]);
};
