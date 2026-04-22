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
  const decisionPrompt = `Task: Choose the best tool for the question.
  
  QUESTION: "${query}"
  
  TOOLS:
  - search_documents: Use this for ANY question about uploaded files, PDFs, or documents.
  - wikipedia_search: Use this for general knowledge NOT in the files.
  - no_tool: For greetings or casual chat.
  
  Return ONLY the tool name.`;

  try {
    const { callGroq } = await import("../gemini");
    const decision = await callGroq(decisionPrompt);
    const toolOutput = decision.toLowerCase().trim();

    let context = "";
    let toolUsed = "None";

    // Enhanced matching logic
    if (toolOutput.includes("search_documents") || query.toLowerCase().includes("file") || query.toLowerCase().includes("document")) {
      context = await search_documents(query);
      toolUsed = "Document Search";
    } else if (toolOutput.includes("wikipedia_search")) {
      context = await wikipedia_search(query);
      toolUsed = "Wikipedia";
    }

    return { context, toolUsed };
  } catch (error) {
    console.error("Agent decision failed:", error);
    return { context: "", toolUsed: "Fallback (None)" };
  }
}
