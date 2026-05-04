const SALT = new TextEncoder().encode('gt-salt-v1');
const PBKDF2_ITERATIONS = 100_000;

async function getMasterKey(): Promise<CryptoKey> {
  const seed = chrome.runtime.id + '|ghosttype-v1';
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(seed),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export async function encryptKey(plain: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherbuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  return { ciphertext: toBase64(cipherbuf), iv: toBase64(iv) };
}

export async function decryptKey(ciphertext: string, iv: string): Promise<string> {
  const key = await getMasterKey();
  const plainbuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext),
  );
  return new TextDecoder().decode(plainbuf);
}
