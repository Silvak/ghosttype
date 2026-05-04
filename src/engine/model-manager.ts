import { pipeline, env } from '@huggingface/transformers';
import { MODEL_CATALOG } from './models.js';
import {
  getActiveModelId,
  setActiveModel,
  clearActiveModel,
  addModelCache,
  removeModelCache,
  getModelCache,
  getAllModelCache,
} from '../vault/index.js';
import type { ModelEntry, ModelCacheEntry } from '../types/index.js';

export type ModelStatus = 'not-downloaded' | 'downloading' | 'downloaded' | 'active';

export interface ModelListEntry extends ModelEntry {
  status: ModelStatus;
  progress?: number;
}

export type ProgressCallback = (modelId: string, progress: number) => void;

// Track in-memory downloading state (progress can't be persisted)
const downloadingProgress = new Map<string, number>();

export async function list(): Promise<ModelListEntry[]> {
  const cached = await getAllModelCache();
  const cachedIds = new Set(cached.map(c => c.modelId));
  const activeId = await getActiveModelId();

  return MODEL_CATALOG.map(model => {
    let status: ModelStatus = 'not-downloaded';
    if (model.id === activeId) status = 'active';
    else if (cachedIds.has(model.id)) status = 'downloaded';
    else if (downloadingProgress.has(model.id)) status = 'downloading';

    return {
      ...model,
      status,
      progress: downloadingProgress.get(model.id),
    };
  });
}

export async function download(id: string, onProgress?: ProgressCallback): Promise<void> {
  const model = MODEL_CATALOG.find(m => m.id === id);
  if (!model) throw new Error(`Model "${id}" not found in catalog`);

  downloadingProgress.set(id, 0);
  onProgress?.(id, 0);

  try {
    // Trigger download by loading the pipeline; Transformers.js caches internally
    await pipeline('text2text-generation', model.repo, {
      dtype: model.dtype as 'q8',
      progress_callback: (info: { progress?: number }) => {
        if (typeof info.progress === 'number') {
          const pct = Math.round(info.progress);
          downloadingProgress.set(id, pct);
          onProgress?.(id, pct);
        }
      },
    });

    downloadingProgress.delete(id);
    await addModelCache(id, model.sizeMB);
    onProgress?.(id, 100);
  } catch (err) {
    downloadingProgress.delete(id);
    throw err;
  }
}

export async function remove(id: string): Promise<void> {
  // Clear Transformers.js cache for this model
  try {
    if (typeof caches !== 'undefined') {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        const model = MODEL_CATALOG.find(m => m.id === id);
        if (model) {
          for (const req of keys) {
            if (req.url.includes(model.repo)) {
              await cache.delete(req);
            }
          }
        }
      }
    }
  } catch {
    // Cache API may not be available; silently continue
  }

  await removeModelCache(id);

  const activeId = await getActiveModelId();
  if (activeId === id) {
    await clearActiveModel();
  }
}

export async function setActive(id: string): Promise<void> {
  const cached = await getModelCache(id);
  if (!cached) throw new Error(`Cannot activate model "${id}": not downloaded`);
  await setActiveModel(id);
}

export async function getActive(): Promise<ModelEntry | null> {
  const id = await getActiveModelId();
  if (!id) return null;
  return MODEL_CATALOG.find(m => m.id === id) ?? null;
}

export async function isDownloaded(id: string): Promise<boolean> {
  const cached = await getModelCache(id);
  return cached !== undefined;
}

export async function getCacheEntry(id: string): Promise<ModelCacheEntry | undefined> {
  return getModelCache(id);
}

// Configure WASM paths for MV3 — must be called before any inference
export function configureWasmPaths(): void {
  try {
    env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('transformers/');
  } catch {
    // Non-extension environment (tests); skip
  }
}
