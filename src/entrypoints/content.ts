import type { GhostTypeMessage, GhostTypeResponse, GhostScore } from '@/types';

export default defineContentScript({
  matches: [
    '*://*.reddit.com/*',
    '*://*.twitter.com/*',
    '*://*.x.com/*',
    '*://news.ycombinator.com/*',
  ],
  main() {
    observeTextInputs();
  },
});

function observeTextInputs(): void {
  const observer = new MutationObserver(() => {
    attachListenersToInputs();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  attachListenersToInputs();
}

const listenedElements = new WeakSet<Element>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function attachListenersToInputs(): void {
  const inputs = document.querySelectorAll<HTMLElement>(
    'textarea, [contenteditable="true"], [contenteditable=""]'
  );

  inputs.forEach((el) => {
    if (listenedElements.has(el)) return;
    listenedElements.add(el);

    el.addEventListener('input', () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const text = extractText(el);
        if (text.trim().length > 10) {
          analyzeText(text);
        }
      }, 300);
    });
  });
}

function extractText(el: HTMLElement): string {
  if (el.tagName === 'TEXTAREA') {
    return (el as HTMLTextAreaElement).value;
  }
  return el.innerText ?? el.textContent ?? '';
}

async function analyzeText(text: string): Promise<void> {
  const message: GhostTypeMessage = {
    type: 'ANALYZE_TEXT',
    payload: text,
  };

  try {
    const response = (await browser.runtime.sendMessage(message)) as GhostTypeResponse;

    if (response.type === 'SCORE_RESULT') {
      const score = response.payload as GhostScore;
      updateGhostScoreUI(score);
    }
  } catch {
    // El background puede no estar disponible durante HMR en desarrollo
  }
}

function updateGhostScoreUI(_score: GhostScore): void {
  // Stub — implementación real en Fase 1 (UI del anillo)
}
