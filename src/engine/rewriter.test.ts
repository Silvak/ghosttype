import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock vault and model-manager before importing rewriter
vi.mock('../vault/index.js', () => ({
  getActiveApi: vi.fn(),
  getActiveModelId: vi.fn(),
}));

vi.mock('./model-manager.bg.js', () => ({
  isDownloaded: vi.fn(),
}));

vi.mock('./api-gateway.js', () => ({
  rewrite: vi.fn(),
}));

vi.mock('./offscreen-bridge.js', () => ({
  sendToOffscreen: vi.fn(),
}));

// Mock chrome global for module-level try/catch in rewriter.ts
(globalThis as unknown as Record<string, unknown>).chrome = {
  runtime: { getURL: (path: string) => `chrome-extension://test/${path}` },
};

// Mock @huggingface/transformers env
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(),
  env: { backends: { onnx: { wasm: { wasmPaths: '' } } } },
}));

import { rewrite } from './rewriter.js';
import { getActiveApi, getActiveModelId } from '../vault/index.js';
import { isDownloaded } from './model-manager.bg.js';
import * as apiGateway from './api-gateway.js';
import { sendToOffscreen } from './offscreen-bridge.js';

const mockedGetActiveApi = vi.mocked(getActiveApi);
const mockedGetActiveModelId = vi.mocked(getActiveModelId);
const mockedIsDownloaded = vi.mocked(isDownloaded);
const mockedApiRewrite = vi.mocked(apiGateway.rewrite);
const mockedSendToOffscreen = vi.mocked(sendToOffscreen);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('rewriter — no engine configured', () => {
  it('returns no-engine-configured when no api and no model', async () => {
    mockedGetActiveApi.mockResolvedValue(null);
    mockedGetActiveModelId.mockResolvedValue(null);

    const result = await rewrite('Hello world', [], 'medium');

    expect(result.suggestion).toBeNull();
    expect(result.reason).toBe('no-engine-configured');
  });

  it('returns no-engine-configured when model id exists but not downloaded', async () => {
    mockedGetActiveApi.mockResolvedValue(null);
    mockedGetActiveModelId.mockResolvedValue('t5-small-q8');
    mockedIsDownloaded.mockResolvedValue(false);

    const result = await rewrite('Some text', [], 'soft');

    expect(result.suggestion).toBeNull();
    expect(result.reason).toBe('no-engine-configured');
  });
});

describe('rewriter — API path', () => {
  it('calls apiGateway.rewrite when API is configured', async () => {
    const cfg = { provider: 'openai' as const, key: 'sk-test', model: 'gpt-4o-mini' };
    mockedGetActiveApi.mockResolvedValue(cfg);
    mockedApiRewrite.mockResolvedValue({ suggestion: 'rewritten text', source: 'api' });

    const result = await rewrite('Original text', [], 'medium');

    expect(mockedApiRewrite).toHaveBeenCalledWith(cfg, 'Original text', 'medium');
    expect(result.suggestion).toBe('rewritten text');
    expect(result.source).toBe('api');
  });

  it('returns api-error when apiGateway returns null suggestion', async () => {
    const cfg = { provider: 'gemini' as const, key: 'AIza-test' };
    mockedGetActiveApi.mockResolvedValue(cfg);
    mockedApiRewrite.mockResolvedValue({ suggestion: null, reason: 'api-error' });

    const result = await rewrite('Some text', [], 'strong');

    expect(result.suggestion).toBeNull();
    expect(result.reason).toBe('api-error');
  });
});

describe('rewriter — local model + redaction', () => {
  it('redacts known signals in model output', async () => {
    mockedGetActiveApi.mockResolvedValue(null);
    mockedGetActiveModelId.mockResolvedValue('t5-small-q8');
    mockedIsDownloaded.mockResolvedValue(true);
    mockedSendToOffscreen.mockResolvedValue({
      ok: true,
      suggestion: 'Hola, escríbeme a silca@gmail.com',
    });

    const signals = [
      { category: 'email' as const, match: 'silca@gmail.com', severity: 'high' as const, start: 0, end: 15 },
    ];

    const result = await rewrite('Hola silca@gmail.com', signals, 'soft');

    expect(mockedSendToOffscreen).toHaveBeenCalled();
    expect(result.suggestion).not.toContain('silca@gmail.com');
    expect(result.suggestion).toContain('[correo]');
    expect(result.source).toBe('local');
  });
});

describe('rewriter — API takes priority over local model', () => {
  it('uses API even when a local model is also downloaded', async () => {
    const cfg = { provider: 'anthropic' as const, key: 'sk-ant-test' };
    mockedGetActiveApi.mockResolvedValue(cfg);
    mockedGetActiveModelId.mockResolvedValue('t5-small-q8');
    mockedIsDownloaded.mockResolvedValue(true);
    mockedApiRewrite.mockResolvedValue({ suggestion: 'api result', source: 'api' });

    const result = await rewrite('Text', [], 'medium');

    expect(mockedApiRewrite).toHaveBeenCalled();
    expect(result.source).toBe('api');
  });
});
