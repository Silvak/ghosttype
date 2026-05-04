import { describe, it, expect } from 'vitest';
import { friendlyDownloadError } from './friendlyDownloadError.js';

describe('friendlyDownloadError', () => {
  it('maps network errors to a Spanish hint', () => {
    expect(friendlyDownloadError('TypeError: Failed to fetch')).toContain('Hugging Face');
  });

  it('appends truncated detail for onnx/wasm errors', () => {
    const long =
      'Error: no available backend found. ERR: wasm onnxruntime-web failed to load ort-wasm-simd-threaded.wasm';
    const out = friendlyDownloadError(long);
    expect(out).toContain('ONNX/WASM');
    expect(out).toContain('Detalle:');
    expect(out).toContain('ort-wasm');
    expect(out).toMatch(/^El motor ONNX\/WASM/);
  });

  it('mentions offscreen when message references it', () => {
    expect(friendlyDownloadError('chrome.offscreen API not available')).toContain('116');
  });

  it('passes through short generic messages', () => {
    expect(friendlyDownloadError('Model not found')).toBe('Model not found');
  });
});
