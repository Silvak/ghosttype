import { db } from './schema.js';
import { encryptKey, decryptKey } from './crypto.js';
import type { PrivacyLevel, SettingKey, ModelCacheEntry } from '../types/index.js';

export { db };

type ApiProvider = 'openai' | 'anthropic' | 'gemini';

export interface ActiveApiConfig {
  provider: ApiProvider;
  key: string;
  model?: string;
}

const DEFAULTS = {
  enabled: true,
  level: 'medium' as PrivacyLevel,
  activeModelId: null as string | null,
  activeApiProvider: null as string | null,
} as const;

export async function getSetting<T>(key: SettingKey, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  if (row === undefined) return fallback;
  return row.value as T;
}

export async function setSetting(key: SettingKey, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

export async function getEnabled(): Promise<boolean> {
  return getSetting<boolean>('enabled', DEFAULTS.enabled);
}

export async function setEnabled(value: boolean): Promise<void> {
  await setSetting('enabled', value);
}

export async function getLevel(): Promise<PrivacyLevel> {
  return getSetting<PrivacyLevel>('level', DEFAULTS.level);
}

export async function setLevel(value: PrivacyLevel): Promise<void> {
  await setSetting('level', value);
}

// --- Model helpers ---

export async function getActiveModelId(): Promise<string | null> {
  return getSetting<string | null>('activeModelId', DEFAULTS.activeModelId);
}

export async function setActiveModel(id: string): Promise<void> {
  await setSetting('activeModelId', id);
}

export async function clearActiveModel(): Promise<void> {
  await setSetting('activeModelId', null);
}

// --- API provider helpers ---

export async function getActiveProvider(): Promise<ApiProvider | null> {
  return getSetting<ApiProvider | null>('activeApiProvider', DEFAULTS.activeApiProvider);
}

export async function setActiveProvider(provider: ApiProvider): Promise<void> {
  await setSetting('activeApiProvider', provider);
}

export async function setApi(
  provider: ApiProvider,
  plainKey: string,
  model?: string,
): Promise<void> {
  const { ciphertext, iv } = await encryptKey(plainKey);
  await db.apiSettings.put({
    provider,
    encryptedKey: ciphertext,
    iv,
    model,
    enabled: true,
    updatedAt: Date.now(),
  });
  await setActiveProvider(provider);
}

export async function getActiveApi(): Promise<ActiveApiConfig | null> {
  const provider = await getActiveProvider();
  if (!provider) return null;

  const row = await db.apiSettings.get(provider);
  if (!row || !row.enabled) return null;

  const key = await decryptKey(row.encryptedKey, row.iv);
  return { provider, key, model: row.model };
}

export async function clearApi(provider: ApiProvider): Promise<void> {
  await db.apiSettings.delete(provider);
  const active = await getActiveProvider();
  if (active === provider) {
    await setSetting('activeApiProvider', null);
  }
}

// --- Model cache helpers ---

export async function addModelCache(modelId: string, sizeMB: number): Promise<void> {
  const entry: ModelCacheEntry = { modelId, cachedAt: Date.now(), sizeMB };
  await db.modelCache.put(entry);
}

export async function removeModelCache(modelId: string): Promise<void> {
  await db.modelCache.delete(modelId);
}

export async function getModelCache(modelId: string): Promise<ModelCacheEntry | undefined> {
  return db.modelCache.get(modelId);
}

export async function getAllModelCache(): Promise<ModelCacheEntry[]> {
  return db.modelCache.toArray();
}
