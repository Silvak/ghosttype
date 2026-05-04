import { SuggestionWidget } from '../components/ui/SuggestionWidget.js';
import { debounce } from '../utils/debounce.js';
import type { RuntimeResponse } from '../types/index.js';

const DEBOUNCE_MS = 200;

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

    // Track the last known editable element so we can apply rewrites to it
    let lastEditable: Element | null = null;

    // Keep a port open while rewriting to prevent the SW from hibernating in MV3
    let rewritePort: chrome.runtime.Port | null = null;

    function openKeepAlivePort(): void {
      if (rewritePort) return;
      try {
        rewritePort = chrome.runtime.connect({ name: 'rewrite-keepalive' });
        rewritePort.onDisconnect.addListener(() => {
          rewritePort = null;
        });
      } catch {
        rewritePort = null;
      }
    }

    function closeKeepAlivePort(): void {
      rewritePort?.disconnect();
      rewritePort = null;
    }

    function extractText(el: Element): string {
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        return el.value;
      }
      return (el as HTMLElement).innerText ?? '';
    }

    function applyRewrite(text: string): void {
      if (!lastEditable) return;
      if (
        lastEditable instanceof HTMLTextAreaElement ||
        lastEditable instanceof HTMLInputElement
      ) {
        const el = lastEditable as HTMLTextAreaElement | HTMLInputElement;
        el.focus();
        el.select();
        // Use execCommand so undo history is preserved where supported
        if (!document.execCommand('insertText', false, text)) {
          el.value = text;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        const el = lastEditable as HTMLElement;
        el.focus();
        const sel = window.getSelection();
        if (sel) {
          const range = document.createRange();
          range.selectNodeContents(el);
          sel.removeAllRanges();
          sel.addRange(range);
          if (!document.execCommand('insertText', false, text)) {
            el.textContent = text;
          }
          sel.removeAllRanges();
        } else {
          el.textContent = text;
        }
        el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      }
    }

    widget.setCallback(async (cb, suggestionText) => {
      if (cb === 'apply') {
        if (suggestionText) applyRewrite(suggestionText);
        widget.clearSuggestion();
      } else if (cb === 'ignore') {
        widget.clearSuggestion();
      } else if (cb === 'rewrite') {
        const text = lastEditable ? extractText(lastEditable) : '';
        if (!text.trim()) return;

        widget.update({ result: { signals: [], riskScore: 0 }, busy: true });
        openKeepAlivePort();

        let response: RuntimeResponse;
        try {
          response = await chrome.runtime.sendMessage({ type: 'rewrite', text });
        } catch (err) {
          console.warn('[GhostType content] rewrite sendMessage failed:', err);
          closeKeepAlivePort();
          return;
        }
        closeKeepAlivePort();

        if (response.ok) {
          widget.update({
            result: response.result,
            suggestion: response.suggestion,
            reason: response.reason,
            errorDetail: response.errorDetail,
          });
        }
      }
    });

    const debouncedScan = debounce(async (text: string) => {
      if (!text.trim()) {
        widget.hide();
        return;
      }

      let response: RuntimeResponse;
      try {
        response = await chrome.runtime.sendMessage({ type: 'scan', text });
      } catch (err) {
        console.warn('[GhostType content] sendMessage failed:', err);
        return;
      }

      if (response.ok) {
        widget.update({
          result: response.result,
          suggestion: response.suggestion,
          reason: response.reason,
          errorDetail: response.errorDetail,
        });
      } else if (response.error === 'disabled') {
        widget.hide();
      } else {
        console.warn('[GhostType content] scan error from background:', response.error);
      }
    }, DEBOUNCE_MS);

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
        lastEditable = target;
        debouncedScan.call(extractText(target));
      }
    };

    document.addEventListener('input', handleInput, true);

    window.addEventListener('unload', () => {
      debouncedScan.cancel();
      document.removeEventListener('input', handleInput, true);
      closeKeepAlivePort();
      widget.destroy();
    });
  },
});
