import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs';
import path from 'path';

// Manual env parsing since dotenv might not be fully installed or configured standardly
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/PINECONE_API_KEY=(.+)/);
const indexMatch = envContent.match(/PINECONE_INDEX_NAME=(.+)/);

const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';
const indexName = indexMatch ? indexMatch[1].trim() : '';

const pc = new Pinecone({ apiKey });

async function clearIndex() {
  try {
     console.log(`🧹 Clearing all data from Pinecone Index: ${indexName} ...`);
     const index = pc.Index(indexName);
     
     // deleteAll() works for the default namespace
     await index.deleteAll();
     
     console.log('✅ Pinecone index cleared successfully! All old PDFs are gone.');
  } catch(e) {
     console.error('❌ Error clearing index:', e.message);
  }
}

clearIndex();
