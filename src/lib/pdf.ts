import { PDFParse } from 'pdf-parse';
import path from 'path';

/**
 * Extracts text from a PDF buffer directly without spawning a sub-process.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Fix for "pdf.worker.mjs" not found in Next.js/Node.js environment
    // We explicitly point to the worker file in node_modules using a file:// URL
    if (typeof window === 'undefined') {
      const absolutePath = path.resolve(process.cwd(), 'node_modules/pdf-parse/dist/worker/pdf.worker.mjs');
      const workerUrl = 'file:///' + absolutePath.replace(/\\/g, '/');
      PDFParse.setWorker(workerUrl);
    }


    // Usage for @mehmet-kozan/pdf-parse (pdf-parse 2.4.x)
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  } catch (error: any) {
    console.error("Error parsing PDF:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}
