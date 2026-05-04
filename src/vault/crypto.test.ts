import { describe, it, expect, beforeAll, vi } from 'vitest';

// Mock chrome.runtime.id before importing the module
beforeAll(() => {
  (globalThis as unknown as Record<string, unknown>).chrome = {
    runtime: { id: 'test-extension-id-12345' },
  };
});

// Import after mock is in place
const { encryptKey, decryptKey } = await import('./crypto.js');

describe('crypto — encryptKey / decryptKey', () => {
  it('decryptKey returns the original plaintext', async () => {
    const plain = 'sk-test-api-key-abc123';
    const { ciphertext, iv } = await encryptKey(plain);
    const recovered = await decryptKey(ciphertext, iv);
    expect(recovered).toBe(plain);
  });

  it('produces different ciphertext on each call (random IV)', async () => {
    const plain = 'same-key';
    const first = await encryptKey(plain);
    const second = await encryptKey(plain);
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it('ciphertext and iv are base64 strings', async () => {
    const { ciphertext, iv } = await encryptKey('hello');
    expect(() => atob(ciphertext)).not.toThrow();
    expect(() => atob(iv)).not.toThrow();
  });

  it('iv is 12 bytes (16 base64 chars)', async () => {
    const { iv } = await encryptKey('test');
    const decoded = atob(iv);
    expect(decoded.length).toBe(12);
  });

  it('throws on tampered ciphertext', async () => {
    const { ciphertext, iv } = await encryptKey('secret');
    const tampered = ciphertext.slice(0, -2) + 'AA';
    await expect(decryptKey(tampered, iv)).rejects.toThrow();
  });
});
