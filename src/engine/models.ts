import type { ModelEntry } from '../types/index.js';

/**
 * Static catalog of ONNX models the user may download manually from the popup.
 * Latency hints are orientative and will be refined with real benchmarks in
 * Phase 2 (see docs/ROADMAP.md).
 */
export const MODEL_CATALOG: ModelEntry[] = [
  {
    id: 't5-small-q8',
    label: 'T5 Small (rápido)',
    repo: 'Xenova/t5-small',
    dtype: 'q8',
    sizeMB: 30,
    latencyHint: { webgpu: '< 800ms', wasm: '< 2s' },
    quality: 'basic',
  },
  {
    id: 'lamini-77m-q8',
    label: 'LaMini-Flan-T5 77M (balance)',
    repo: 'Xenova/LaMini-Flan-T5-77M',
    dtype: 'q8',
    sizeMB: 80,
    latencyHint: { webgpu: '< 1.5s', wasm: '< 4s' },
    quality: 'medium',
  },
  {
    id: 'flan-t5-base-q8',
    label: 'FLAN-T5 Base (calidad)',
    repo: 'Xenova/flan-t5-base',
    dtype: 'q8',
    sizeMB: 120,
    latencyHint: { webgpu: '< 3s', wasm: '< 8s' },
    quality: 'high',
  },
];

export function findModelById(id: string): ModelEntry | undefined {
  return MODEL_CATALOG.find(m => m.id === id);
}
