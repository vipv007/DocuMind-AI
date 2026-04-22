import { retrieveContext } from "./chain";

/**
 * Tool to search the uploaded documents (PDF/TXT).
 */
async function search_documents(query: string) {
  console.log("🛠️ Agent using tool: search_documents");
  const docs = await retrieveContext(query);
  return docs.map(d => d.pageContent).join("\n\n---\n\n");
}

/**
 * Tool to search Wikipedia for general knowledge.
 * Uses a free API (no key needed).
 */
async function wikipedia_search(query: string) {
  console.log("🛠️ Agent using tool: wikipedia_search");
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    if (data.query.search.length === 0) return "No results found on Wikipedia.";

    // Get the first result's snippet
    const snippet = data.query.search[0].snippet.replace(/<[^>]*>/g, '');
    return `Wikipedia Result for "${query}": ${snippet}...`;
  } catch (error) {
    console.error("Wikipedia search failed:", error);
    return "Failed to search Wikipedia.";
  }
}

/**
 * Agent Router: Decides which tool to use and executes it.
 */
export async function runAgenticWorkflow(query: string) {
  // Simple prompt to help AI decide the tool
  const decisionPrompt = `You are a Tool Router. Decide which tool to use to answer the user's question.
  
  QUESTION: "${query}"
  
  TOOLS:
  1. search_documents: Use this if the question is about specific documents, PDFs, or "uploaded" content.
  2. wikipedia_search: Use this if the question is about general knowledge, famous people, history, or current events NOT likely in the documents.
  3. no_tool: Use this if it's just a greeting (Hi/Hello) or doesn't need external info.
  
  Return ONLY the tool name. Nothing else.`;

  // We'll use Gemini for the decision (fast and accurate)
  const { llm } = await import("../gemini");
  const { StringOutputParser } = await import("@langchain/core/output_parsers");
  
  try {
    const decision = await llm.pipe(new StringOutputParser()).invoke(decisionPrompt);
    const tool = decision.toLowerCase().trim();

    let context = "";
    let toolUsed = "None";

    if (tool.includes("search_documents")) {
      context = await search_documents(query);
      toolUsed = "Document Search";
    } else if (tool.includes("wikipedia_search")) {
      context = await wikipedia_search(query);
      toolUsed = "Wikipedia";
    }

    return { context, toolUsed };
  } catch (error) {
    console.error("Agent decision failed:", error);
    return { context: "", toolUsed: "Fallback (None)" };
  }
}
