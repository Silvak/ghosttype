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

// Mock offscreen bridge so tests never hit real chrome APIs
vi.mock('./offscreen-bridge.js', () => ({
  downloadViaOffscreen: vi.fn(),
  sendToOffscreen: vi.fn(),
}));

import { list, setActive, isDownloaded, download } from './model-manager.bg.js';
import {
  getActiveModelId,
  setActiveModel,
  addModelCache,
  getAllModelCache,
  getModelCache,
} from '../vault/index.js';
import { downloadViaOffscreen } from './offscreen-bridge.js';

const mockedGetActiveModelId = vi.mocked(getActiveModelId);
const mockedSetActiveModel = vi.mocked(setActiveModel);
const mockedAddModelCache = vi.mocked(addModelCache);
const mockedGetAllModelCache = vi.mocked(getAllModelCache);
const mockedGetModelCache = vi.mocked(getModelCache);
const mockedDownloadViaOffscreen = vi.mocked(downloadViaOffscreen);

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

describe('model-manager — download()', () => {
  it('calls downloadViaOffscreen and persists cache entry on success', async () => {
    mockedDownloadViaOffscreen.mockResolvedValue(undefined);
    mockedAddModelCache.mockResolvedValue(undefined);

    const onProgress = vi.fn();
    await download('t5-small-q8', onProgress);

    expect(mockedDownloadViaOffscreen).toHaveBeenCalledWith(
      't5-small-q8',
      'Xenova/t5-small',
      'q8',
      expect.any(Function),
    );
    expect(mockedAddModelCache).toHaveBeenCalledWith('t5-small-q8', 30);
    expect(onProgress).toHaveBeenCalledWith('t5-small-q8', 100);
  });

  it('throws and cleans up on offscreen error', async () => {
    mockedDownloadViaOffscreen.mockRejectedValue(new Error('network error'));

    await expect(download('t5-small-q8')).rejects.toThrow('network error');
    expect(mockedAddModelCache).not.toHaveBeenCalled();
  });

  it('throws for unknown model id', async () => {
    await expect(download('unknown-model')).rejects.toThrow('not found in catalog');
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
