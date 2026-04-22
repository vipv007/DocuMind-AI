import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

export async function POST(req: NextRequest) {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME;
    const apiKey = process.env.PINECONE_API_KEY;

    if (!indexName || !apiKey) {
      return NextResponse.json({ error: "Pinecone configuration missing" }, { status: 500 });
    }

    console.log("🧹 Clearing Pinecone index:", indexName);
    const pc = new Pinecone({ apiKey });
    const index = pc.Index(indexName);

    // Delete all vectors in the index
    await index.deleteAll();

    console.log("✅ Pinecone index cleared");
    return NextResponse.json({ success: true, message: "Knowledge base cleared successfully" });

  } catch (error: any) {
    console.error("Clear API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to clear knowledge base" }, { status: 500 });
  }
}
