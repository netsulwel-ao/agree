const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

function getStorageKey(userId: string): string {
  return `sig_key_${userId}`;
}

async function deriveKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId + salt),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function getOrCreateKey(userId: string): Promise<CryptoKey> {
  const stored = localStorage.getItem(getStorageKey(userId));
  if (stored) {
    const parsed = JSON.parse(stored);
    const salt = new Uint8Array(parsed.salt);
    const key = await deriveKey(userId, salt);
    return key;
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(userId, salt);
  localStorage.setItem(getStorageKey(userId), JSON.stringify({
    salt: Array.from(salt),
  }));
  return key;
}

export async function encryptSignature(
  data: string,
  userId: string
): Promise<string> {
  const key = await getOrCreateKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(data)
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptSignature(
  encryptedData: string,
  userId: string
): Promise<string> {
  const key = await getOrCreateKey(userId);
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(c => c.charCodeAt(0))
  );
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
}
