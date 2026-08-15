import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let configured = false;

function ensureWorker() {
  if (!configured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    configured = true;
  }
}

export async function extractPdfText(file: File, maxPages = 30): Promise<string> {
  ensureWorker();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';
  for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return text.trim();
}
