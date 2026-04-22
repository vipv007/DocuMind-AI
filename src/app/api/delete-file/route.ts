import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();
    const indexName = process.env.PINECONE_INDEX_NAME;
    const apiKey = process.env.PINECONE_API_KEY;

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    if (!indexName || !apiKey) {
      return NextResponse.json({ error: "Pinecone configuration missing" }, { status: 500 });
    }

    console.log(`🗑️ Deleting file vectors from Pinecone: ${filename}`);
    const pc = new Pinecone({ apiKey });
    const index = pc.Index(indexName);

    // Delete vectors where metadata 'source' matches filename
    // Note: Pinecone delete uses a filter for metadata
    await index.deleteMany({
        filter: {
            source: { "$eq": filename }
        }
    });

    console.log(`✅ Deleted vectors for ${filename}`);
    return NextResponse.json({ success: true, message: `Vectors for ${filename} deleted successfully` });

  } catch (error: any) {
    console.error("Delete File API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete file vectors" }, { status: 500 });
  }
}
