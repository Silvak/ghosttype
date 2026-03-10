import type { GhostTypeMessage, GhostTypeResponse, GhostScore } from '@/types';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: GhostTypeMessage, _sender, sendResponse) => {
      if (message.type === 'ANALYZE_TEXT') {
        handleAnalyzeText(message.payload as string)
          .then((score) => {
            const response: GhostTypeResponse = {
              type: 'SCORE_RESULT',
              payload: score,
            };
            sendResponse(response);
          })
          .catch((error: unknown) => {
            const response: GhostTypeResponse = {
              type: 'ERROR',
              payload: { error: String(error) },
            };
            sendResponse(response);
          });

        // Retornar true indica que sendResponse se llamará de forma asíncrona
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
  // Stub — implementación real en Fase 2
  return {
    value: 50,
    level: 'warning',
    leaks: [],
    timestamp: Date.now(),
  };
}
