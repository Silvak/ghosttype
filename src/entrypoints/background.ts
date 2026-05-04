import { scan } from '../scanner/index.js';
import { getEnabled, getLevel } from '../vault/index.js';
import type { PrivacyLevel, ScanResult } from '../types/index.js';

type ScanRequest = { type: 'scan'; text: string; level?: PrivacyLevel };
type ScanResponse = { ok: true; result: ScanResult } | { ok: false; error: string };

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse: (r: ScanResponse) => void) => {
      if (!isValidRequest(message)) return false;

      void handleScan(message)
        .then(response => sendResponse(response))
        .catch(err => {
          const error = err instanceof Error ? err.message : 'Unknown error';
          console.error('[GhostType background] scan error:', error);
          sendResponse({ ok: false, error });
        });

      // Return true to keep the message channel open for the async sendResponse
      return true;
    },
  );
});

async function handleScan(message: ScanRequest): Promise<ScanResponse> {
  const enabled = await getEnabled();
  if (!enabled) {
    return { ok: false, error: 'disabled' };
  }

  // Vault is the source of truth for the active level
  const level = await getLevel();
  const result = scan(message.text, level);
  return { ok: true, result };
}

function isValidRequest(msg: unknown): msg is ScanRequest {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as ScanRequest).type === 'scan' &&
    typeof (msg as ScanRequest).text === 'string'
  );
}
