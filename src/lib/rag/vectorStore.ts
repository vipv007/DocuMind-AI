import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { embeddings } from "./embeddings";
import { Document } from "@langchain/core/documents";

let vectorStoreInstance: any = null;

export const getVectorStore = async () => {
  if (vectorStoreInstance) return vectorStoreInstance;

  const indexName = process.env.PINECONE_INDEX_NAME;
  const apiKey = process.env.PINECONE_API_KEY;

  if (indexName && apiKey) {
    try {
      console.log("🌲 Initializing Pinecone Store...");
      const { PineconeStore } = await import("@langchain/pinecone");
      const { Pinecone: PineconeClient } = await import("@pinecone-database/pinecone");
      
      const pc = new PineconeClient({ apiKey });
      const pineconeIndex = pc.Index(indexName);
      
      vectorStoreInstance = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        textKey: "text"
      });
      return vectorStoreInstance;
    } catch (error) {
      console.error("❌ Failed to initialize Pinecone, falling back to Memory:", error);
    }
  }

  console.log("🧠 Using Memory Vector Store (No Pinecone config)");
  vectorStoreInstance = new MemoryVectorStore(embeddings);
  return vectorStoreInstance;
};

/**
 * Check if the store has any documents (useful for UI state)
 * Since Pinecone doesn't have a simple 'isEmpty' check, 
 * we just check if it's initialized and configured.
 */
export const hasDocumentsStore = async () => {
  const store = await getVectorStore();
  // For Memory Store, we can check memory
  if (store instanceof MemoryVectorStore) {
    return (store as any).memoryVectors?.length > 0;
  }
  // For Pinecone, we assume it has docs if it's configured for now, 
  // or we could do a dummy search.
  return true; 
};


export const addDocumentsToStore = async (docs: Document[]) => {
  const indexName = process.env.PINECONE_INDEX_NAME;
  const apiKey = process.env.PINECONE_API_KEY;

  console.log(`📤 Metadata-Fix Upload: Processing ${docs.length} docs`);
  
  const validDocs = docs.filter(d => d.pageContent && d.pageContent.trim().length > 0);
  if (validDocs.length === 0) return;

  try {
    const records = [];
    for (let i = 0; i < validDocs.length; i++) {
        const doc = validDocs[i];
        const vector = await embeddings.embedQuery(doc.pageContent);
        
        // FLATTEN METADATA: Pinecone doesn't allow nested objects
        const flattenedMetadata: any = {};
        for (const [key, value] of Object.entries(doc.metadata)) {
            if (typeof value === 'object' && value !== null) {
                flattenedMetadata[key] = JSON.stringify(value); // Convert objects to strings
            } else {
                flattenedMetadata[key] = value;
            }
        }
        flattenedMetadata.text = doc.pageContent;

        records.push({
            id: `doc-${Date.now()}-${i}`,
            values: vector,
            metadata: flattenedMetadata
        });
    }

    const response = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
        headers: { "Api-Key": apiKey! }
    });
    const indexInfo = await response.json();
    const targetHost = indexInfo.host;

    const upsertRes = await fetch(`https://${targetHost}/vectors/upsert`, {
        method: 'POST',
        headers: {
            "Api-Key": apiKey!,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ vectors: records })
    });

    if (!upsertRes.ok) {
        const err = await upsertRes.text();
        throw new Error(`Pinecone API Error: ${err}`);
    }

    console.log("✅ Pinecone upload SUCCESSFUL (Metadata Flattened)");
    
    // Refresh the LangChain store instance
    const { PineconeStore } = await import("@langchain/pinecone");
    const { Pinecone: PineconeClient } = await import("@pinecone-database/pinecone");
    const pc = new PineconeClient({ apiKey: apiKey! });
    const pineconeIndex = pc.Index(indexName!);
    vectorStoreInstance = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        textKey: "text"
    });

  } catch (error: any) {
    console.error("❌ Fatal Vector Store Error:", error.message);
    throw error;
  }
};

export const searchDocuments = async (query: string, limit: number = 4) => {
  const store = await getVectorStore();
  return store.similaritySearch(query, limit);
};
