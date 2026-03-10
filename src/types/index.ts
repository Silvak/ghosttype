export type LeakCategory =
  | 'location'
  | 'profession'
  | 'temporal'
  | 'technology'
  | 'dialect'
  | 'personal';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface LeakEntity {
  text: string;
  category: LeakCategory;
  risk: RiskLevel;
  startIndex: number;
  endIndex: number;
  suggestion?: string;
}

export interface GhostScore {
  value: number;       // 0–100, donde 100 = máximo anonimato
  level: 'ghost' | 'warning' | 'exposed';
  leaks: LeakEntity[];
  timestamp: number;
}

export interface StyleProfile {
  id?: number;
  sessionId: string;
  embeddings: number[][];
  createdAt: Date;
  updatedAt: Date;
}

export interface TextSample {
  id?: number;
  hash: string;
  embedding: number[];
  timestamp: Date;
}

export interface EngineConfig {
  embeddingModelId: string;
  nerModelId: string;
  device: 'webgpu' | 'wasm' | 'auto';
  maxLatencyMs: number;
}

export interface GhostTypeMessage {
  type: 'ANALYZE_TEXT' | 'GET_SCORE' | 'CLEAR_PROFILE' | 'GET_STATUS';
  payload?: unknown;
}

export interface GhostTypeResponse {
  type: 'SCORE_RESULT' | 'STATUS' | 'ERROR';
  payload: GhostScore | { status: string } | { error: string };
}
