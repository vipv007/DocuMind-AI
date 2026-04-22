import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: 'pcsk_XLhf6_EGKfaEPeUSbf7bqmjd4TS1sTceQhq85mU3MZnZQG8aufvway8ytzsvb4rvLhW4r'
});

async function checkIndex() {
  try {
    const indexes = await pc.listIndexes();
    const indexList = indexes.indexes || [];
    const exists = indexList.some(idx => idx.name === 'documind-ai');
    
    if (exists) {
      console.log('✅ Index "documind-ai" already exists!');
    } else {
      console.log('❌ Index "documind-ai" does not exist. Creating it now...');
      await pc.createIndex({
        name: 'documind-ai',
        dimension: 768,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      console.log('⏳ Index creation started. It might take a minute to be ready.');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkIndex();
