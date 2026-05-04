import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock vault dependencies
vi.mock('../vault/index.js', () => ({
  getActiveModelId: vi.fn(),
  setActiveModel: vi.fn(),
  clearActiveModel: vi.fn(),
  addModelCache: vi.fn(),
  removeModelCache: vi.fn(),
  getModelCache: vi.fn(),
  getAllModelCache: vi.fn(),
}));

// Mock Transformers.js
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(),
  env: { backends: { onnx: { wasm: { wasmPaths: '' } } } },
}));

// Mock chrome for configureWasmPaths
(globalThis as unknown as Record<string, unknown>).chrome = {
  runtime: { getURL: (path: string) => `chrome-extension://test/${path}` },
};

import { list, setActive, isDownloaded } from './model-manager.js';
import {
  getActiveModelId,
  setActiveModel,
  getAllModelCache,
  getModelCache,
} from '../vault/index.js';

const mockedGetActiveModelId = vi.mocked(getActiveModelId);
const mockedSetActiveModel = vi.mocked(setActiveModel);
const mockedGetAllModelCache = vi.mocked(getAllModelCache);
const mockedGetModelCache = vi.mocked(getModelCache);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('model-manager — list()', () => {
  it('returns all catalog entries with not-downloaded status when nothing cached', async () => {
    mockedGetAllModelCache.mockResolvedValue([]);
    mockedGetActiveModelId.mockResolvedValue(null);

    const entries = await list();

    expect(entries).toHaveLength(3);
    expect(entries.every(e => e.status === 'not-downloaded')).toBe(true);
  });

  it('marks downloaded models correctly', async () => {
    mockedGetAllModelCache.mockResolvedValue([
      { modelId: 't5-small-q8', cachedAt: Date.now(), sizeMB: 30 },
    ]);
    mockedGetActiveModelId.mockResolvedValue(null);

    const entries = await list();
    const t5 = entries.find(e => e.id === 't5-small-q8')!;

    expect(t5.status).toBe('downloaded');
  });

  it('marks active model correctly', async () => {
    mockedGetAllModelCache.mockResolvedValue([
      { modelId: 'lamini-77m-q8', cachedAt: Date.now(), sizeMB: 80 },
    ]);
    mockedGetActiveModelId.mockResolvedValue('lamini-77m-q8');

    const entries = await list();
    const lamini = entries.find(e => e.id === 'lamini-77m-q8')!;

    expect(lamini.status).toBe('active');
  });
});

describe('model-manager — setActive()', () => {
  it('calls setActiveModel when model is cached', async () => {
    mockedGetModelCache.mockResolvedValue({
      modelId: 'flan-t5-base-q8',
      cachedAt: Date.now(),
      sizeMB: 120,
    });

    await setActive('flan-t5-base-q8');

    expect(mockedSetActiveModel).toHaveBeenCalledWith('flan-t5-base-q8');
  });

  it('throws when model is not downloaded', async () => {
    mockedGetModelCache.mockResolvedValue(undefined);

    await expect(setActive('flan-t5-base-q8')).rejects.toThrow('not downloaded');
  });
});

describe('model-manager — isDownloaded()', () => {
  it('returns true when model is in cache', async () => {
    mockedGetModelCache.mockResolvedValue({
      modelId: 't5-small-q8',
      cachedAt: Date.now(),
      sizeMB: 30,
    });

    expect(await isDownloaded('t5-small-q8')).toBe(true);
  });

  it('returns false when model is not in cache', async () => {
    mockedGetModelCache.mockResolvedValue(undefined);

    expect(await isDownloaded('t5-small-q8')).toBe(false);
  });
});
