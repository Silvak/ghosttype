import { db } from './schema';
import type { StyleProfile, TextSample } from '@/types';

const MAX_SAMPLES = 50;

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const record = await db.settings.where('key').equals(key).first();
  return record ? (record.value as T) : defaultValue;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

export async function addSample(embedding: number[], hash: string): Promise<void> {
  const existing = await db.samples.where('hash').equals(hash).first();
  if (existing) return;

  await db.samples.add({
    hash,
    embedding,
    timestamp: new Date(),
  });

  const count = await db.samples.count();
  if (count > MAX_SAMPLES) {
    const oldest = await db.samples.orderBy('timestamp').first();
    if (oldest?.id) {
      await db.samples.delete(oldest.id);
    }
  }
}

export async function getBaseProfile(): Promise<number[] | null> {
  const samples = await db.samples.toArray();
  if (samples.length === 0) return null;

  const dim = samples[0].embedding.length;
  const centroid = new Array<number>(dim).fill(0);

  for (const sample of samples) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += sample.embedding[i] / samples.length;
    }
  }

  return centroid;
}

export async function clearVault(): Promise<void> {
  await db.transaction('rw', db.profiles, db.samples, async () => {
    await db.profiles.clear();
    await db.samples.clear();
  });
}

export async function exportProfile(): Promise<StyleProfile[]> {
  return db.profiles.toArray();
}

export { db };
