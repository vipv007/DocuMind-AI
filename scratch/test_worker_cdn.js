
const { PDFParse } = require('pdf-parse');
async function test() {
    try {
        const workerUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs';
        console.log('Worker URL:', workerUrl);
        PDFParse.setWorker(workerUrl);
        const buffer = Buffer.from('%PDF-1.1\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 70 700 Td (Hello World) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000114 00000 n\n0000000216 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n310\n%%EOF');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        console.log('Result:', result.text);
    } catch (e) {
        console.error('Test failed:', e);
    }
}
test();
