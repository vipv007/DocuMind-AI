import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

async function resetIndex() {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME || 'documind-ai';
    console.log(`🗑️ Deleting old index: ${indexName}...`);
    try {
      await pc.deleteIndex(indexName);
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.log("Index might not exist, skipping delete...");
    }
    
    console.log(`🆕 Creating new index: ${indexName} with 768 dimensions...`);
    await pc.createIndex({
      name: indexName,
      dimension: 768, // Matched to Gemini model's output
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    console.log('✅ New index creation started!');
    console.log('⏳ Please wait a minute for the index to be ready before uploading documents.');
  } catch (e) {
    console.error('Error:', e.message);
  }
}


resetIndex();
