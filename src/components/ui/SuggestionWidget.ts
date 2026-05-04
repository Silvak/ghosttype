import type { ScanResult, Signal } from '../../types/index.js';

const WIDGET_ID = 'ghosttype-widget-host';

const STYLES = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    line-height: 1.4;
  }

  #widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    width: 280px;
    background: #1a1b1e;
    border: 1px solid #2e2f35;
    border-radius: 10px;
    padding: 12px 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    color: #e1e2e5;
    transition: opacity 0.15s ease;
  }

  #widget.hidden {
    opacity: 0;
    pointer-events: none;
  }

  #header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  #title {
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #9899a6;
  }

  #badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 12px;
  }

  #badge.green  { background: #0e2d1a; color: #4ade80; border: 1px solid #166534; }
  #badge.yellow { background: #2d2310; color: #fbbf24; border: 1px solid #854d0e; }
  #badge.red    { background: #2d0e0e; color: #f87171; border: 1px solid #7f1d1d; }

  #signals {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 6px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: 6px;
    background: #2a2b31;
    border: 1px solid #3a3b42;
    font-size: 11px;
    color: #c9cad4;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chip-cat {
    font-weight: 600;
    margin-right: 4px;
    color: #7c7d8e;
    text-transform: uppercase;
    font-size: 10px;
  }

  #no-signals {
    font-size: 12px;
    color: #555660;
    margin-top: 4px;
  }

  #rewriter-hint {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid #2e2f35;
    font-size: 11px;
    color: #555660;
    font-style: italic;
  }

  #close-btn {
    background: none;
    border: none;
    color: #555660;
    cursor: pointer;
    padding: 0 2px;
    font-size: 14px;
    line-height: 1;
  }
  #close-btn:hover { color: #9899a6; }
`;

export class SuggestionWidget {
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private badge: HTMLElement | null = null;
  private signalsContainer: HTMLElement | null = null;
  private noSignals: HTMLElement | null = null;
  private widgetEl: HTMLElement | null = null;

  mount(): void {
    if (document.getElementById(WIDGET_ID)) return;

    this.host = document.createElement('div');
    this.host.id = WIDGET_ID;
    document.documentElement.appendChild(this.host);

    this.shadow = this.host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = STYLES;
    this.shadow.appendChild(style);

    this.widgetEl = document.createElement('div');
    this.widgetEl.id = 'widget';
    this.widgetEl.classList.add('hidden');

    // Header
    const header = document.createElement('div');
    header.id = 'header';

    const title = document.createElement('span');
    title.id = 'title';
    title.textContent = 'GhostType';

    this.badge = document.createElement('span');
    this.badge.id = 'badge';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.addEventListener('click', () => this.hide());

    header.appendChild(title);
    header.appendChild(this.badge);
    header.appendChild(closeBtn);

    // Signals list
    this.signalsContainer = document.createElement('div');
    this.signalsContainer.id = 'signals';

    this.noSignals = document.createElement('p');
    this.noSignals.id = 'no-signals';
    this.noSignals.textContent = 'Sin señales detectadas';

    // Rewriter placeholder
    const hint = document.createElement('div');
    hint.id = 'rewriter-hint';
    hint.textContent = 'Rewriter no disponible (Fase 2)';

    this.widgetEl.appendChild(header);
    this.widgetEl.appendChild(this.signalsContainer);
    this.widgetEl.appendChild(this.noSignals);
    this.widgetEl.appendChild(hint);

    this.shadow.appendChild(this.widgetEl);
  }

  update(result: ScanResult): void {
    if (!this.widgetEl || !this.badge || !this.signalsContainer || !this.noSignals) return;

    // Show widget
    this.widgetEl.classList.remove('hidden');

    // Update badge
    const { riskScore } = result;
    this.badge.textContent = `Risk ${riskScore}`;
    this.badge.className = 'badge';
    if (riskScore < 30) {
      this.badge.className = 'green';
      this.badge.id = 'badge';
    } else if (riskScore <= 60) {
      this.badge.className = 'yellow';
      this.badge.id = 'badge';
    } else {
      this.badge.className = 'red';
      this.badge.id = 'badge';
    }

    // Update signals
    this.signalsContainer.innerHTML = '';
    if (result.signals.length === 0) {
      this.noSignals.style.display = 'block';
    } else {
      this.noSignals.style.display = 'none';
      for (const signal of result.signals) {
        this.signalsContainer.appendChild(this.buildChip(signal));
      }
    }
  }

  hide(): void {
    this.widgetEl?.classList.add('hidden');
  }

  destroy(): void {
    this.host?.remove();
    this.host = null;
    this.shadow = null;
    this.badge = null;
    this.signalsContainer = null;
    this.noSignals = null;
    this.widgetEl = null;
  }

  private buildChip(signal: Signal): HTMLElement {
    const chip = document.createElement('span');
    chip.className = 'chip';

    const cat = document.createElement('span');
    cat.className = 'chip-cat';
    cat.textContent = signal.category;

    const matchText = document.createTextNode(signal.match);

    chip.appendChild(cat);
    chip.appendChild(matchText);
    return chip;
  }
}
