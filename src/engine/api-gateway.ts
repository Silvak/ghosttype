import type { ActiveApiConfig } from '../vault/index.js';
import type { PrivacyLevel, RewriteResult } from '../types/index.js';

const PRIVACY_REWRITE_PROMPT = `You are a privacy assistant inside a browser extension.
Rewrite the user's text to remove or generalize PII while preserving meaning and tone.

Rules:
- Replace personal names → generic alternatives ("someone", "a person", "they")
- Generalize locations → ("a European city", "my country", "somewhere nearby")
- Remove specific dates → keep rough timeframes ("recently", "a few years ago")
- Replace specific tools/tech → categories ("a JS framework", "a cloud provider")
- Do NOT add opinions or new information
- Output ONLY the rewritten text, no preface, no quotes

Privacy level: {level}
- soft: only direct identifiers (names, emails, phones)
- medium: also location, profession, specific tools
- strong: maximize anonymity, remove all potentially identifying context`;

const TIMEOUT_MS = 8_000;

function buildPrompt(level: PrivacyLevel): string {
  return PRIVACY_REWRITE_PROMPT.replace('{level}', level);
}

function withAbortTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function callOpenAI(cfg: ActiveApiConfig, text: string, level: PrivacyLevel): Promise<string> {
  const { signal, clear } = withAbortTimeout(TIMEOUT_MS);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.key}`,
      },
      body: JSON.stringify({
        model: cfg.model ?? 'gpt-4o-mini',
        messages: [
          { role: 'system', content: buildPrompt(level) },
          { role: 'user', content: text },
        ],
        max_tokens: Math.min(text.length * 3, 1024),
        temperature: 0.3,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content.trim();
  } finally {
    clear();
  }
}

async function callAnthropic(cfg: ActiveApiConfig, text: string, level: PrivacyLevel): Promise<string> {
  const { signal, clear } = withAbortTimeout(TIMEOUT_MS);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: cfg.model ?? 'claude-haiku-3-5',
        max_tokens: Math.min(text.length * 3, 1024),
        system: buildPrompt(level),
        messages: [{ role: 'user', content: text }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { content: { text: string }[] };
    return data.content[0].text.trim();
  } finally {
    clear();
  }
}

async function callGemini(cfg: ActiveApiConfig, text: string, level: PrivacyLevel): Promise<string> {
  const model = cfg.model ?? 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.key}`;
  const { signal, clear } = withAbortTimeout(TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildPrompt(level) }] },
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          maxOutputTokens: Math.min(text.length * 3, 1024),
          temperature: 0.3,
        },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
    };
    return data.candidates[0].content.parts[0].text.trim();
  } finally {
    clear();
  }
}

export async function rewrite(
  cfg: ActiveApiConfig,
  text: string,
  level: PrivacyLevel,
): Promise<RewriteResult> {
  try {
    let suggestion: string;
    if (cfg.provider === 'openai') suggestion = await callOpenAI(cfg, text, level);
    else if (cfg.provider === 'anthropic') suggestion = await callAnthropic(cfg, text, level);
    else suggestion = await callGemini(cfg, text, level);
    return { suggestion, source: 'api' };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { suggestion: null, reason: 'timeout' };
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GhostType api-gateway] error:', message);
    return { suggestion: null, reason: 'api-error' };
  }
}

export async function testConnection(cfg: ActiveApiConfig): Promise<{ ok: boolean; error?: string }> {
  const result = await rewrite(cfg, 'Hello, my name is John and I live in Paris.', 'soft');
  if (result.suggestion !== null) return { ok: true };
  return { ok: false, error: result.reason };
}
