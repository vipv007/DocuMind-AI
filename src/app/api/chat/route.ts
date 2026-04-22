import { NextRequest, NextResponse } from "next/server";
import { getVectorStore } from "@/lib/rag/vectorStore";
import { streamWithFallback } from "@/lib/gemini";
import { formatDocumentsAsString } from "langchain/util/document";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    console.log("💬 Chat API Request started...");
    
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const vectorStore = await getVectorStore();
    
    // Step 1: Retrieve context
    console.log("🔍 Retrieving context for message:", message);
    const retriever = vectorStore.asRetriever(4);
    const sourcesDocs = await retriever.invoke(message);
    
    if (!sourcesDocs || sourcesDocs.length === 0) {
       console.log("⚠️ No relevant documents found in store.");
       return NextResponse.json({ 
         answer: "I couldn't find any information about that in your uploaded documents. Please make sure you've uploaded relevant files.",
         sources: []
       });
    }

    
    const sources = sourcesDocs.map((doc: any) => ({
      content: doc.pageContent,
      source: doc.metadata.source || "Unknown Document",
    }));

    const context = formatDocumentsAsString(sourcesDocs);

    // Step 2: Stream response — Groq first (free), Gemini fallback
    console.log("🤖 Starting LLM stream...");
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send sources immediately
          const initialData = JSON.stringify({ sources }) + "\n--SEP--\n";
          controller.enqueue(encoder.encode(initialData));

          // Stream the answer
          const chatStream = await streamWithFallback(null, message, context);
          
          for await (const chunk of chatStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          
          controller.close();
          console.log(`✅ Stream finished in ${Date.now() - startTime}ms`);
        } catch (err: any) {
          console.error("Stream Error:", err.message);
          const errorMsg = err.message?.includes("rate-limited") || err.message?.includes("429") || err.message?.includes("exhausted")
            ? "⚠️ All API providers are temporarily rate-limited. Please wait 1-2 minutes and try again."
            : `Error: ${err.message}`;
          controller.enqueue(encoder.encode(errorMsg));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Chat API General Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate answer" }, { status: 500 });
  }
}
