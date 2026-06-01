import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const worker = await createWorker('por', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress || 0);
      }
    },
  });

  try {
    const imageData = await fileToBase64(file);
    const { data } = await worker.recognize(imageData);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
