import Dexie, { type Table } from 'dexie';
import type { StyleProfile, TextSample } from '@/types';

interface Settings {
  id?: number;
  key: string;
  value: unknown;
}

class GhostVault extends Dexie {
  profiles!: Table<StyleProfile, number>;
  samples!: Table<TextSample, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super('ghosttype-vault');

    this.version(1).stores({
      profiles: '++id, sessionId, updatedAt',
      samples: '++id, hash, timestamp',
      settings: '++id, &key',
    });
  }
}

export const db = new GhostVault();
