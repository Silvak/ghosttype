export interface ModelConfig {
  id: string;
  name: string;
  task: string;
  device: 'webgpu' | 'wasm' | 'auto';
  sizeMb: number;
}

export const MODELS = {
  embedding: {
    id: 'Xenova/all-MiniLM-L6-v2',
    name: 'MiniLM-L6-v2',
    task: 'feature-extraction',
    device: 'webgpu',
    sizeMb: 23,
  },
  ner: {
    id: 'Xenova/bert-base-NER',
    name: 'BERT NER',
    task: 'token-classification',
    device: 'webgpu',
    sizeMb: 64,
  },
} as const satisfies Record<string, ModelConfig>;
