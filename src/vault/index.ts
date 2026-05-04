import { db } from './schema.js';
import type { PrivacyLevel, SettingKey } from '../types/index.js';

export { db };

const DEFAULTS = {
  enabled: true,
  level: 'medium' as PrivacyLevel,
  activeModelId: null as string | null,
  activeApiProvider: null as string | null,
} as const;

/**
 * Read a setting from The Vault. Returns the provided default if the key is
 * not present in storage.
 */
export async function getSetting<T>(key: SettingKey, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  if (row === undefined) return fallback;
  return row.value as T;
}

/** Persist a setting in The Vault, replacing any previous value. */
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
