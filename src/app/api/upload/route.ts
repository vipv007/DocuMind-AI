import { NextRequest, NextResponse } from "next/server";
import { splitText } from "@/lib/rag/chunker";
import { addDocumentsToStore } from "@/lib/rag/vectorStore";



export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    if (file.name.endsWith(".pdf")) {
      const { extractTextFromPDF } = await import("@/lib/pdf");
      extractedText = await extractTextFromPDF(buffer);
    } else if (file.name.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Unsupported file type. Use PDF or TXT." }, { status: 400 });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "No text could be extracted from the file." }, { status: 400 });
    }

    // Process using RAG chunker
    const docs = await splitText(extractedText, { source: file.name });
    
    // Add to vector store
    await addDocumentsToStore(docs);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${file.name}`,
      chunksProcessed: docs.length
    });

  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process file" }, { status: 500 });
  }
}
