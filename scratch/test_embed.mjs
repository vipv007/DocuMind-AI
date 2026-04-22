import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyBdSZaG91aFLs8za2s1YT0BSl0FSg_maVM";
const genAI = new GoogleGenerativeAI(apiKey);

// Test with gemini-embedding-001
try {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent({ content: { role: "user", parts: [{ text: "Hello world" }] } });
  console.log("gemini-embedding-001 SUCCESS:", result.embedding.values.slice(0, 5));
} catch (e) {
  console.error("gemini-embedding-001 FAILED:", e.message);
}

// Test with text-embedding-004
try {
  const model2 = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result2 = await model2.embedContent({ content: { role: "user", parts: [{ text: "Hello world" }] } });
  console.log("text-embedding-004 SUCCESS:", result2.embedding.values.slice(0, 5));
} catch (e) {
  console.error("text-embedding-004 FAILED:", e.message);
}
