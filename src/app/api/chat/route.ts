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
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { getStandaloneQuestion, streamWithFallback } = await import("@/lib/gemini");
    
    // Step 1: Generate standalone question if history exists
    console.log("🧠 Generating standalone question for:", message);
    const standaloneQuestion = await getStandaloneQuestion(message, history);
    console.log("➡️ Standalone Question:", standaloneQuestion);

    // Step 2: Agentic Workflow (Decide tool + Retrieve)
    console.log("🤖 Agent deciding workflow for:", standaloneQuestion);
    const { runAgenticWorkflow } = await import("@/lib/rag/tools");
    const { context, toolUsed } = await runAgenticWorkflow(standaloneQuestion);
    
    console.log(`🛠️ Tool Selected: ${toolUsed}`);

    // Fallback if no context found but tool was used
    if (toolUsed !== "None" && !context) {
       console.log("⚠️ Tool returned no results.");
    }

    
    const sources = toolUsed === "Document Search" 
      ? [{ content: context, source: "Uploaded Documents" }]
      : toolUsed === "Wikipedia"
        ? [{ content: context, source: "Wikipedia" }]
        : [];

    // Step 3: Stream response
    console.log("🤖 Starting LLM stream...");
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send sources and tool info immediately
          const initialData = JSON.stringify({ sources, toolUsed }) + "\n--SEP--\n";
          controller.enqueue(encoder.encode(initialData));

          // Stream the answer
          const chatStream = await streamWithFallback(null, message, context, history);
          
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
