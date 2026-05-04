import Dexie, { type Table } from 'dexie';
import type { AppSettings, ModelCacheEntry, ApiSettingsRow } from '../types/index.js';

export class GhostVault extends Dexie {
  settings!: Table<AppSettings, string>;
  modelCache!: Table<ModelCacheEntry, string>;
  apiSettings!: Table<ApiSettingsRow, string>;

  constructor() {
    super('ghosttype-vault');
    this.version(1).stores({
      settings: '&key',
    });
    this.version(2).stores({
      settings: '&key',
      modelCache: '&modelId, cachedAt',
      apiSettings: '&provider',
    });
  }
}

export const db = new GhostVault();
