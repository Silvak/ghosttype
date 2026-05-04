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

export type ModelStatus = 'not-downloaded' | 'downloading' | 'downloaded' | 'active';

export interface ModelListEntry extends ModelEntry {
  status: ModelStatus;
  progress?: number;
}

/** Service worker ↔ options page — model lifecycle */
export type ModelManagerRequest =
  | { type: 'model:list' }
  | { type: 'model:download'; modelId: string }
  | { type: 'model:remove'; modelId: string }
  | { type: 'model:setActive'; modelId: string };

export type ModelManagerResponse =
  | { ok: true; models?: ModelListEntry[] }
  | { ok: false; error: string };

/** Broadcast from background during download (progress 0–100) */
export interface ModelProgressMessage {
  type: 'model:progress';
  modelId: string;
  progress: number;
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
  /** Provider or model error message for UI diagnostics */
  errorDetail?: string;
}

export type RuntimeMessage =
  | { type: 'scan'; text: string }
  | { type: 'rewrite'; text: string }
  | { type: 'apply'; text: string };

export interface RuntimeScanResponse {
  ok: true;
  result: ScanResult;
  suggestion?: string | null;
  reason?: RewriteReason;
  errorDetail?: string;
}

export interface RuntimeErrorResponse {
  ok: false;
  error: string;
}

export type RuntimeResponse = RuntimeScanResponse | RuntimeErrorResponse;
