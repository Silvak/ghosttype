import type { GhostTypeMessage, GhostTypeResponse, GhostScore } from '@/types';
import { detectLeaks } from '@/modules/leakDetector';
import { calculateGhostScore } from '@/modules/ghostScore';

export default defineBackground(() => {
  console.log('[GhostType] Background service worker started');

  browser.runtime.onMessage.addListener(
    (message: GhostTypeMessage, _sender, sendResponse) => {
      console.log('[GhostType] Message received:', message.type);

      if (message.type === 'ANALYZE_TEXT') {
        const text = message.payload as string;
        console.log('[GhostType] Analyzing text:', text.substring(0, 60) + (text.length > 60 ? '…' : ''));

        handleAnalyzeText(text)
          .then((score) => {
            console.log('[GhostType] Score result:', score.value, score.level, `(${score.leaks.length} leaks)`);
            const response: GhostTypeResponse = {
              type: 'SCORE_RESULT',
              payload: score,
            };
            sendResponse(response);
          })
          .catch((error: unknown) => {
            console.error('[GhostType] handleAnalyzeText error:', error);
            const response: GhostTypeResponse = {
              type: 'ERROR',
              payload: { error: String(error) },
            };
            sendResponse(response);
          });

        return true;
      }

      if (message.type === 'GET_STATUS') {
        const response: GhostTypeResponse = {
          type: 'STATUS',
          payload: { status: 'ready' },
        };
        sendResponse(response);
      }
    }
  );
});

async function handleAnalyzeText(text: string): Promise<GhostScore> {
  const leaks = detectLeaks(text);
  console.log('[GhostType] detectLeaks found:', leaks.length, leaks.map(l => `${l.text}[${l.category}/${l.risk}]`).join(', ') || 'none');

  // Phase 1: score based on leaks only (no embeddings yet)
  const score = calculateGhostScore([], null, leaks, text);

  // Persist last score so popup and sidepanel can read it
  await browser.storage.local.set({ lastScore: score });

  return score;
}
