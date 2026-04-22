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
    const { llm } = await import("../gemini");
    const { StringOutputParser } = await import("@langchain/core/output_parsers");
    
    const decision = await llm.pipe(new StringOutputParser()).invoke(decisionPrompt);
    const toolOutput = decision.toLowerCase().trim();

    let context = "";
    let toolUsed = "None";

    // AGGRESSIVE OVERRIDE: If the user mentions PDF, File, Document or any common query keywords
    const lowerQuery = query.toLowerCase();
    const isDocQuery = 
      toolOutput.includes("search_documents") || 
      lowerQuery.includes("pdf") || 
      lowerQuery.includes("file") || 
      lowerQuery.includes("document") || 
      lowerQuery.includes("venkatesh") || // Handling specific filenames from history
      lowerQuery.includes("what") || 
      lowerQuery.includes("who") || 
      lowerQuery.includes("tell me") ||
      lowerQuery.includes("ena tha") || 
      lowerQuery.includes("iruku") ||
      lowerQuery.includes("pathi"); // "about" in Tamil

    if (isDocQuery) {
      context = await search_documents(query);
      toolUsed = "Document Search";
    } else if (toolOutput.includes("wikipedia_search")) {
      context = await wikipedia_search(query);
      toolUsed = "Wikipedia";
    }

    return { context, toolUsed };
  } catch (error) {
    // Default to document search on error instead of "None" to be safe
    console.error("Agent decision failed, defaulting to Document Search:", error);
    const context = await search_documents(query);
    return { context, toolUsed: "Document Search (Auto)" };
  }
}
