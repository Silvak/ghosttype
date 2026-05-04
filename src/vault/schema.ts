import Dexie, { type Table } from 'dexie';
import type { AppSettings } from '../types/index.js';

export class GhostVault extends Dexie {
  settings!: Table<AppSettings, string>;

  constructor() {
    super('ghosttype-vault');
    this.version(1).stores({
      settings: '&key',
    });
  }
}

export const db = new GhostVault();
