export function processSignatureImage(
  imageData: ImageData,
  threshold?: number
): ImageData {
  const { width, height, data } = imageData;
  const grayscale = new Uint8Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    grayscale[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  const t = threshold ?? otsuThreshold(grayscale);
  const result = new ImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    const isInk = grayscale[i] < t;
    result.data[i * 4] = 0;
    result.data[i * 4 + 1] = 0;
    result.data[i * 4 + 2] = 0;
    result.data[i * 4 + 3] = isInk ? 255 : 0;
  }

  return result;
}

function otsuThreshold(grayscale: Uint8Array): number {
  const histogram = new Uint32Array(256);
  for (const v of grayscale) histogram[v]++;

  const total = grayscale.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0, wB = 0, maxVariance = 0, threshold = 0;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += i * histogram[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);
    if (variance > maxVariance) { maxVariance = variance; threshold = i; }
  }

  return threshold;
}

function findBounds(imageData: ImageData): { left: number; top: number; right: number; bottom: number } | null {
  const { width, height, data } = imageData;
  let left = width, top = height, right = 0, bottom = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x + 1);
        bottom = Math.max(bottom, y + 1);
        found = true;
      }
    }
  }

  return found ? { left, top, right, bottom } : null;
}

export function cropToSignature(imageData: ImageData): ImageData {
  const bounds = findBounds(imageData);
  if (!bounds) return imageData;

  const { left, top, right, bottom } = bounds;
  const w = right - left;
  const h = bottom - top;
  const result = new ImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((top + y) * imageData.width + (left + x)) * 4;
      const dstIdx = (y * w + x) * 4;
      result.data[dstIdx] = imageData.data[srcIdx];
      result.data[dstIdx + 1] = imageData.data[srcIdx + 1];
      result.data[dstIdx + 2] = imageData.data[srcIdx + 2];
      result.data[dstIdx + 3] = imageData.data[srcIdx + 3];
    }
  }

  return result;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function fileToImageData(file: File): Promise<ImageData> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);

  const canvas = document.createElement('canvas');
  const maxDim = 1200;
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

export function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
}

export async function processSignatureFile(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const imageData = await fileToImageData(file);
  const processed = processSignatureImage(imageData);
  const cropped = cropToSignature(processed);
  const blob = await imageDataToBlob(cropped);
  return { blob, width: cropped.width, height: cropped.height };
}
