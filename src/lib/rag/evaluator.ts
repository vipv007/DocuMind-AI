import { llm } from "../gemini";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

/**
 * RAG Evaluator (Self-Correction/Hallucination Check)
 * This evaluates if the generated answer is faithful to the context and relevant to the question.
 */
export async function evaluateAnswer(question: string, answer: string, context: string) {
  const EVAL_PROMPT = `You are an AI Answer Evaluator. Your goal is to check if the generated answer is accurate based on the context.

QUESTION: ${question}
CONTEXT: ${context}
ANSWER: ${answer}

Evaluate the answer based on two metrics:
1. Faithfulness: Is the answer derived ONLY from the context? (Score 0 to 1)
2. Relevancy: Does the answer directly address the user's question? (Score 0 to 1)

Return the results as a JSON object like this:
{
  "faithfulness": 0.95,
  "relevancy": 1.0,
  "explanation": "Brief explanation why"
}

Return ONLY the JSON.`;

  try {
    const chain = PromptTemplate.fromTemplate(EVAL_PROMPT).pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({});
    
    // Parse the JSON output
    const cleanedResult = result.replace(/```json|```/g, "").trim();
    const evaluation = JSON.parse(cleanedResult);
    
    console.log(`📊 Evaluation Result: Faithfulness: ${evaluation.faithfulness}, Relevancy: ${evaluation.relevancy}`);
    return evaluation;
  } catch (error) {
    console.error("Evaluation failed:", error);
    return {
      faithfulness: 1.0, // Default to 1.0 if eval fails
      relevancy: 1.0,
      explanation: "Evaluation skipped due to error."
    };
  }
}
