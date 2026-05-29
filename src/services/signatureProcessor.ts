export interface ProcessOptions {
  threshold?: number;
  noiseRemoval?: boolean;
  smoothEdges?: boolean;
  adaptive?: boolean;
}

export function processSignatureImage(
  imageData: ImageData,
  options?: ProcessOptions
): ImageData {
  const { width, height, data } = imageData;
  const grayscale = new Uint8Array(width * height);
  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    grayscale[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  enhanceContrast(grayscale, width, height);

  const binary = new Uint8Array(totalPixels);

  if (options?.adaptive) {
    adaptiveThreshold(grayscale, binary, width, height);
  } else {
    const t = options?.threshold ?? otsuThreshold(grayscale);
    for (let i = 0; i < totalPixels; i++) {
      binary[i] = grayscale[i] < t ? 1 : 0;
    }
  }

  let cleaned = binary;
  if (options?.noiseRemoval !== false) {
    cleaned = removeNoise(binary, width, height);
  }

  let smoothed = cleaned;
  if (options?.smoothEdges !== false) {
    smoothed = smoothBinary(cleaned, width, height);
  }

  const result = new ImageData(width, height);
  for (let i = 0; i < totalPixels; i++) {
    const isInk = smoothed[i] === 1;
    result.data[i * 4] = 0;
    result.data[i * 4 + 1] = 0;
    result.data[i * 4 + 2] = 0;
    result.data[i * 4 + 3] = isInk ? 255 : 0;
  }

  return result;
}

function enhanceContrast(grayscale: Uint8Array, w: number, h: number) {
  let min = 255, max = 0;
  for (let i = 0; i < w * h; i++) {
    if (grayscale[i] < min) min = grayscale[i];
    if (grayscale[i] > max) max = grayscale[i];
  }
  const range = max - min;
  if (range < 10) return;
  for (let i = 0; i < w * h; i++) {
    grayscale[i] = Math.round(((grayscale[i] - min) / range) * 255);
  }
}

function adaptiveThreshold(src: Uint8Array, dst: Uint8Array, w: number, h: number) {
  const blockSize = Math.max(15, Math.round(Math.min(w, h) / 8));
  const c = 10;
  const half = Math.floor(blockSize / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, count = 0;
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            sum += src[py * w + px];
            count++;
          }
        }
      }
      const mean = sum / count;
      const idx = y * w + x;
      dst[idx] = src[idx] < (mean - c) ? 1 : 0;
    }
  }
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

function removeNoise(binary: Uint8Array, w: number, h: number): Uint8Array {
  const result = new Uint8Array(binary);
  const minSize = Math.max(3, Math.round(Math.min(w, h) * 0.002));

  const visited = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (binary[idx] === 0 || visited[idx]) continue;
      const component: number[] = [];
      const stack = [idx];
      visited[idx] = 1;
      while (stack.length) {
        const cur = stack.pop()!;
        component.push(cur);
        const cx = cur % w;
        const cy = Math.floor(cur / w);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = ny * w + nx;
              if (binary[nIdx] === 1 && !visited[nIdx]) {
                visited[nIdx] = 1;
                stack.push(nIdx);
              }
            }
          }
        }
      }
      if (component.length < minSize) {
        for (const ci of component) result[ci] = 0;
      }
    }
  }
  return result;
}

function smoothBinary(binary: Uint8Array, w: number, h: number): Uint8Array {
  const result = new Uint8Array(binary);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (binary[idx] === 1) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (binary[(y + dy) * w + (x + dx)] === 1) count++;
          }
        }
        if (count <= 2) result[idx] = 0;
      } else {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (binary[(y + dy) * w + (x + dx)] === 1) count++;
          }
        }
        if (count >= 5) result[idx] = 1;
      }
    }
  }
  return result;
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

export function cropToSignature(imageData: ImageData, padding = 8): ImageData {
  const bounds = findBounds(imageData);
  if (!bounds) return imageData;

  const { left, top, right, bottom } = bounds;
  const w = Math.min(right - left + padding * 2, imageData.width - left);
  const h = Math.min(bottom - top + padding * 2, imageData.height - top);
  const ox = Math.max(0, left - padding);
  const oy = Math.max(0, top - padding);

  const result = new ImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = ox + x;
      const sy = oy + y;
      if (sx < imageData.width && sy < imageData.height) {
        const srcIdx = (sy * imageData.width + sx) * 4;
        const dstIdx = (y * w + x) * 4;
        result.data[dstIdx] = imageData.data[srcIdx];
        result.data[dstIdx + 1] = imageData.data[srcIdx + 1];
        result.data[dstIdx + 2] = imageData.data[srcIdx + 2];
        result.data[dstIdx + 3] = imageData.data[srcIdx + 3];
      }
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

export async function processSignatureFile(
  file: File,
  options?: ProcessOptions
): Promise<{ blob: Blob; width: number; height: number }> {
  const imageData = await fileToImageData(file);
  const processed = processSignatureImage(imageData, options);
  const cropped = cropToSignature(processed);
  const blob = await imageDataToBlob(cropped);
  return { blob, width: cropped.width, height: cropped.height };
}
