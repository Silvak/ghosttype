import { MODEL_CATALOG } from './models.js';
import { downloadViaOffscreen, sendToOffscreen } from './offscreen-bridge.js';
import {
  getActiveModelId,
  setActiveModel,
  clearActiveModel,
  addModelCache,
  removeModelCache,
  getModelCache,
  getAllModelCache,
} from '../vault/index.js';
import type { ModelEntry, ModelCacheEntry, ModelListEntry, ModelStatus } from '../types/index.js';

export type ProgressCallback = (modelId: string, progress: number) => void;

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
    await downloadViaOffscreen(id, model.repo, model.dtype, (loaded, total) => {
      const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
      downloadingProgress.set(id, pct);
      onProgress?.(id, pct);
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
  const model = MODEL_CATALOG.find(m => m.id === id);
  if (model) {
    try {
      await sendToOffscreen({ type: 'offscreen:remove', modelId: id, repo: model.repo });
    } catch {
      // Offscreen may not exist yet; eviction from memory is best-effort.
    }
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
