import { SuggestionWidget } from '../components/ui/SuggestionWidget.js';
import { debounce } from '../utils/debounce.js';
import type { PrivacyLevel, ScanResult } from '../types/index.js';

const LEVEL: PrivacyLevel = 'medium';
const DEBOUNCE_MS = 200;

type ScanResponse =
  | { ok: true; result: ScanResult }
  | { ok: false; error: string };

export default defineContentScript({
  matches: [
    '*://*.reddit.com/*',
    '*://*.twitter.com/*',
    '*://*.x.com/*',
    '*://news.ycombinator.com/*',
  ],
  runAt: 'document_idle',

  main() {
    const widget = new SuggestionWidget();
    widget.mount();

    const debouncedScan = debounce(async (text: string) => {
      if (!text.trim()) {
        widget.hide();
        return;
      }

      let response: ScanResponse;
      try {
        response = await chrome.runtime.sendMessage({ type: 'scan', text, level: LEVEL });
      } catch (err) {
        console.warn('[GhostType content] sendMessage failed:', err);
        return;
      }

      if (response.ok) {
        widget.update(response.result);
      } else if (response.error === 'disabled') {
        widget.hide();
      } else {
        console.warn('[GhostType content] scan error from background:', response.error);
      }
    }, DEBOUNCE_MS);

    function extractText(el: Element): string {
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        return el.value;
      }
      return (el as HTMLElement).innerText ?? '';
    }

    function findEditableInPath(path: EventTarget[]): Element | null {
      for (const el of path) {
        if (el instanceof HTMLTextAreaElement) return el;
        if (el instanceof HTMLInputElement && el.type !== 'password') return el;
        if (el instanceof HTMLElement && el.isContentEditable) return el;
      }
      return null;
    }

    /**
     * Single capture-phase listener on `document`. `input` events bubble through
     * open shadow roots, and `composedPath()` reveals the actual editable element
     * even when wrapped in Web Components (Reddit's <faceplate-textarea-input>,
     * <shreddit-composer>, Twitter's Lexical-based composer, etc.).
     */
    const handleInput = (e: Event): void => {
      const target = findEditableInPath(e.composedPath());
      if (target) {
        debouncedScan.call(extractText(target));
      }
    };

    document.addEventListener('input', handleInput, true);

    window.addEventListener('unload', () => {
      debouncedScan.cancel();
      document.removeEventListener('input', handleInput, true);
      widget.destroy();
    });
  },
});
