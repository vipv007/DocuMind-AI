import { Pinecone } from "@pinecone-database/pinecone";
import path from "path";


async function checkPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  if (!apiKey || !indexName) {
    console.error("Missing config");
    return;
  }

  const pc = new Pinecone({ apiKey });
  const index = pc.Index(indexName);

  console.log(`Checking index: ${indexName}`);
  
  // dummy query to get some records
  const queryResponse = await index.query({
    vector: Array(768).fill(0), // gemini-embedding-001 is 768 dims
    topK: 5,
    includeMetadata: true
  });

  console.log("Found vectors:", queryResponse.matches.length);
  queryResponse.matches.forEach((match, i) => {
    console.log(`\n--- Match ${i+1} ---`);
    console.log("ID:", match.id);
    console.log("Metadata keys:", Object.keys(match.metadata || {}));
    console.log("Text content preview:", (match.metadata?.text)?.slice(0, 50));
  });
}

checkPinecone().catch(console.error);
