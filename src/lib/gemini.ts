import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// ============================================================
// GROQ LLM — Free, fast, no rate limit issues
// Uses direct fetch (no extra package needed)
// ============================================================

const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"];

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  for (const model of GROQ_MODELS) {
    try {
      console.log(`🔄 Trying Groq model: ${model}`);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`⚠️ Groq ${model} failed (${res.status}): ${errText.slice(0, 100)}`);
        continue;
      }

      const data = await res.json();
      console.log(`✅ Groq ${model} success`);
      return data.choices[0].message.content;
    } catch (err: any) {
      console.warn(`⚠️ Groq ${model} error: ${err.message}`);
      continue;
    }
  }
  throw new Error("All Groq models failed");
}

// Stream from Groq (SSE)
async function* streamGroq(prompt: string): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  for (const model of GROQ_MODELS) {
    try {
      console.log(`🔄 Trying Groq stream: ${model}`);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 4096,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`⚠️ Groq ${model} stream failed (${res.status}): ${errText.slice(0, 100)}`);
        continue;
      }

      console.log(`✅ Groq ${model} streaming...`);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") return;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) yield content;
            } catch {}
          }
        }
      }
      return; // Success — exit the model loop
    } catch (err: any) {
      console.warn(`⚠️ Groq ${model} stream error: ${err.message}`);
      continue;
    }
  }
  throw new Error("All Groq models failed to stream");
}

// ============================================================
// GEMINI LLM — Fallback only (has rate limits on free tier)
// ============================================================

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash"];

function getGeminiKey(): string | undefined {
  return process.env.GOOGLE_API_KEY;
}

// Default export for non-streaming uses (upload check, etc.)
export const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "gemini-2.0-flash-lite",
  temperature: 0.1,
});

// ============================================================
// SMART STREAM — Groq first (free), Gemini as fallback
// ============================================================

export async function streamWithFallback(_chain: any, input: string, context: string) {
  // Build the full prompt
  const prompt = `You are DocuMind AI, a helpful and precise document assistant. 
Your goal is to answer the user's question based ONLY on the provided context.

RULES:
1. Use the provided context to answer the question.
2. If the answer is not in the context, say "I'm sorry, I couldn't find that information in the uploaded documents."
3. ALWAYS answer in the same language as the user's question. If the user asks in Tamil, answer in Tamil.
4. Use clear formatting (bullet points, bold text) using Markdown to make the answer easy to read.
5. Be concise but accurate.

CONTEXT:
${context}

USER QUESTION:
${input}

ANSWER (in the same language):`;

  // ---- TRY GROQ FIRST (free, fast, no rate limits) ----
  if (process.env.GROQ_API_KEY) {
    try {
      console.log("🚀 Using Groq (free, no rate limits)...");
      return streamGroq(prompt);
    } catch (err: any) {
      console.warn("⚠️ Groq failed, falling back to Gemini:", err.message);
    }
  }

  // ---- FALLBACK TO GEMINI (may have rate limits) ----
  const key = getGeminiKey();
  if (key) {
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`🔄 Gemini fallback: ${model} with key ...${key.slice(-6)}`);
        const tempLLM = new ChatGoogleGenerativeAI({ apiKey: key, modelName: model, temperature: 0.1 });
        
        const { StringOutputParser } = await import("@langchain/core/output_parsers");
        const { PromptTemplate } = await import("@langchain/core/prompts");
        const { RunnableSequence } = await import("@langchain/core/runnables");

        const template = PromptTemplate.fromTemplate("{input}");
        const chain = RunnableSequence.from([template, tempLLM, new StringOutputParser()]);
        return chain.stream({ input: prompt });
      } catch (err: any) {
        const is429 = err.message?.includes("429") || err.message?.includes("quota");
        if (!is429) throw err;
        continue;
      }
    }
  }

  throw new Error("All providers exhausted. Please wait a few minutes and try again.");
}
