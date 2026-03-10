import type { EngineConfig } from '@/types';

export type { EngineConfig };

let isInitialized = false;

export async function initEngine(_config?: Partial<EngineConfig>): Promise<void> {
  if (isInitialized) return;
  // Stub — implementación real en Fase 2
  // Aquí se configurará env.backends.onnx.wasm.wasmPaths y se cargarán los modelos
  isInitialized = true;
}

export async function getEmbedding(_text: string): Promise<number[]> {
  // Stub — implementación real en Fase 2
  // Usará pipeline('feature-extraction', MODELS.embedding.id, { device: 'webgpu' })
  return [];
}

export async function detectEntities(
  _text: string
): Promise<Array<{ word: string; entity: string; score: number }>> {
  // Stub — implementación real en Fase 2
  // Usará pipeline('token-classification', MODELS.ner.id, { device: 'webgpu' })
  return [];
}

export function isReady(): boolean {
  return isInitialized;
}
