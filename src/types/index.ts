export type PrivacyLevel = 'soft' | 'medium' | 'strong';

export type SignalCategory =
  | 'name'
  | 'email'
  | 'phone'
  | 'url'
  | 'location'
  | 'profession'
  | 'technology'
  | 'temporal'
  | 'dialect';

export type SignalSeverity = 'low' | 'medium' | 'high';

export interface Signal {
  category: SignalCategory;
  match: string;
  severity: SignalSeverity;
  /** Start offset in the original text */
  start: number;
  /** End offset in the original text */
  end: number;
}

export interface ScanResult {
  signals: Signal[];
  riskScore: number;
}

export type SettingKey = 'enabled' | 'level' | 'activeModelId' | 'activeApiProvider';

export interface AppSettings {
  key: SettingKey;
  value: unknown;
}

export interface ModelEntry {
  id: string;
  label: string;
  repo: string;
  dtype: string;
  sizeMB: number;
  latencyHint: {
    webgpu: string;
    wasm: string;
  };
  quality: 'basic' | 'medium' | 'high';
}

export interface ModelCacheEntry {
  modelId: string;
  cachedAt: number;
  sizeMB: number;
}

export interface ApiSettingsRow {
  provider: 'openai' | 'anthropic' | 'gemini';
  encryptedKey: string;
  iv: string;
  model?: string;
  enabled: boolean;
  updatedAt: number;
}

export type RewriteReason = 'no-engine-configured' | 'timeout' | 'api-error' | 'local-error';

export interface RewriteResult {
  suggestion: string | null;
  source?: 'api' | 'local';
  reason?: RewriteReason;
}
