import type { ScanResult, Signal, RewriteReason } from '../../types/index.js';

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
    width: 300px;
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

  .green  { background: #0e2d1a; color: #4ade80; border: 1px solid #166534; }
  .yellow { background: #2d2310; color: #fbbf24; border: 1px solid #854d0e; }
  .red    { background: #2d0e0e; color: #f87171; border: 1px solid #7f1d1d; }

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
    max-width: 260px;
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

  #divider {
    height: 1px;
    background: #2e2f35;
    margin: 10px 0;
  }

  #suggestion-section {
    display: none;
    flex-direction: column;
    gap: 8px;
  }

  #suggestion-section.visible {
    display: flex;
  }

  #suggestion-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #7c7d8e;
  }

  #suggestion-text {
    font-size: 12px;
    color: #c9cad4;
    background: #22232a;
    border: 1px solid #3a3b42;
    border-radius: 6px;
    padding: 7px 9px;
    line-height: 1.5;
    word-break: break-word;
    max-height: 90px;
    overflow-y: auto;
  }

  #actions {
    display: flex;
    gap: 6px;
  }

  .btn {
    flex: 1;
    padding: 5px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: opacity 0.1s;
  }
  .btn:hover { opacity: 0.85; }
  .btn:active { opacity: 0.7; }

  .btn-apply {
    background: #166534;
    border-color: #4ade80;
    color: #4ade80;
  }

  .btn-ignore {
    background: #2a2b31;
    border-color: #3a3b42;
    color: #9899a6;
  }

  .btn-rewrite {
    background: #1e3a5f;
    border-color: #3b82f6;
    color: #93c5fd;
  }

  #busy-indicator {
    display: none;
    font-size: 11px;
    color: #7c7d8e;
    font-style: italic;
    margin-top: 6px;
  }

  #busy-indicator.visible {
    display: block;
  }

  #no-engine-cta {
    display: none;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-top: 8px;
    padding: 7px 9px;
    background: #2a2b31;
    border: 1px solid #3a3b42;
    border-radius: 6px;
  }

  #no-engine-cta.visible {
    display: flex;
  }

  #cta-text {
    font-size: 11px;
    color: #9899a6;
  }

  #cta-btn {
    font-size: 11px;
    font-weight: 600;
    color: #93c5fd;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }
  #cta-btn:hover { color: #bfdbfe; }

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

export interface WidgetUpdatePayload {
  result: ScanResult;
  suggestion?: string | null;
  reason?: RewriteReason;
  errorDetail?: string;
  busy?: boolean;
}

export type WidgetCallback = 'apply' | 'ignore' | 'rewrite';

export class SuggestionWidget {
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private widgetEl: HTMLElement | null = null;
  private badge: HTMLElement | null = null;
  private signalsContainer: HTMLElement | null = null;
  private noSignals: HTMLElement | null = null;
  private suggestionSection: HTMLElement | null = null;
  private suggestionText: HTMLElement | null = null;
  private actionsEl: HTMLElement | null = null;
  private applyBtn: HTMLButtonElement | null = null;
  private ignoreBtn: HTMLButtonElement | null = null;
  private rewriteBtn: HTMLButtonElement | null = null;
  private busyIndicator: HTMLElement | null = null;
  private noEngineCta: HTMLElement | null = null;
  private currentSuggestion: string | null = null;
  private onCallback: ((cb: WidgetCallback, text?: string) => void) | null = null;

  setCallback(fn: (cb: WidgetCallback, text?: string) => void): void {
    this.onCallback = fn;
  }

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

    // Rewrite section
    const divider = document.createElement('div');
    divider.id = 'divider';

    this.suggestionSection = document.createElement('div');
    this.suggestionSection.id = 'suggestion-section';

    const suggestionLabel = document.createElement('span');
    suggestionLabel.id = 'suggestion-label';
    suggestionLabel.textContent = 'Sugerencia privada';

    this.suggestionText = document.createElement('div');
    this.suggestionText.id = 'suggestion-text';

    this.actionsEl = document.createElement('div');
    this.actionsEl.id = 'actions';

    this.applyBtn = document.createElement('button');
    this.applyBtn.className = 'btn btn-apply';
    this.applyBtn.textContent = 'Aplicar';
    this.applyBtn.addEventListener('click', () =>
      this.onCallback?.('apply', this.currentSuggestion ?? undefined),
    );

    this.ignoreBtn = document.createElement('button');
    this.ignoreBtn.className = 'btn btn-ignore';
    this.ignoreBtn.textContent = 'Ignorar';
    this.ignoreBtn.addEventListener('click', () => this.onCallback?.('ignore'));

    this.actionsEl.appendChild(this.applyBtn);
    this.actionsEl.appendChild(this.ignoreBtn);

    this.suggestionSection.appendChild(suggestionLabel);
    this.suggestionSection.appendChild(this.suggestionText);
    this.suggestionSection.appendChild(this.actionsEl);

    // Busy indicator
    this.busyIndicator = document.createElement('div');
    this.busyIndicator.id = 'busy-indicator';
    this.busyIndicator.textContent = 'Reescribiendo…';

    // No-engine CTA section
    this.noEngineCta = document.createElement('div');
    this.noEngineCta.id = 'no-engine-cta';

    const ctaText = document.createElement('span');
    ctaText.id = 'cta-text';
    ctaText.textContent = 'Configura un modelo o API para reescribir';

    const ctaBtn = document.createElement('button');
    ctaBtn.id = 'cta-btn';
    ctaBtn.textContent = 'Configurar';
    ctaBtn.addEventListener('click', () => {
      const url = chrome.runtime.getURL('options.html#models');
      void chrome.tabs.create({ url, active: true });
    });

    this.noEngineCta.appendChild(ctaText);
    this.noEngineCta.appendChild(ctaBtn);

    // Rewrite on-demand button (always shown when there are signals but no suggestion yet)
    this.rewriteBtn = document.createElement('button');
    this.rewriteBtn.className = 'btn btn-rewrite';
    this.rewriteBtn.textContent = 'Reescribir';
    this.rewriteBtn.addEventListener('click', () => this.onCallback?.('rewrite'));

    // Compose widget
    this.widgetEl.appendChild(header);
    this.widgetEl.appendChild(this.signalsContainer);
    this.widgetEl.appendChild(this.noSignals);
    this.widgetEl.appendChild(divider);
    this.widgetEl.appendChild(this.busyIndicator);
    this.widgetEl.appendChild(this.suggestionSection);
    this.widgetEl.appendChild(this.noEngineCta);
    this.widgetEl.appendChild(this.rewriteBtn);

    this.shadow.appendChild(this.widgetEl);
  }

  update(payload: WidgetUpdatePayload): void {
    if (
      !this.widgetEl ||
      !this.badge ||
      !this.signalsContainer ||
      !this.noSignals ||
      !this.suggestionSection ||
      !this.suggestionText ||
      !this.busyIndicator ||
      !this.noEngineCta ||
      !this.rewriteBtn
    )
      return;

    const { result, suggestion, reason, errorDetail, busy } = payload;

    this.widgetEl.classList.remove('hidden');

    // Badge
    const { riskScore } = result;
    this.badge.textContent = `Risk ${riskScore}`;
    this.badge.id = 'badge';
    this.badge.className =
      riskScore < 30 ? 'green' : riskScore <= 60 ? 'yellow' : 'red';

    // Signals
    this.signalsContainer.innerHTML = '';
    if (result.signals.length === 0) {
      this.noSignals.style.display = 'block';
    } else {
      this.noSignals.style.display = 'none';
      for (const signal of result.signals) {
        this.signalsContainer.appendChild(this.buildChip(signal));
      }
    }

    // Busy state
    if (busy) {
      this.busyIndicator.classList.add('visible');
      this.suggestionSection.classList.remove('visible');
      this.noEngineCta.classList.remove('visible');
      this.rewriteBtn.style.display = 'none';
      return;
    }
    this.busyIndicator.classList.remove('visible');

    // Suggestion
    if (suggestion) {
      this.currentSuggestion = suggestion;
      this.suggestionText.textContent = suggestion;
      this.suggestionSection.classList.add('visible');
      this.noEngineCta.classList.remove('visible');
      this.rewriteBtn.style.display = 'none';
    } else {
      this.currentSuggestion = null;
      this.suggestionSection.classList.remove('visible');

      if (reason === 'no-engine-configured') {
        this.noEngineCta.classList.add('visible');
        this.rewriteBtn.style.display = 'none';
      } else if (reason === 'api-error' || reason === 'timeout') {
        // Show error detail in the CTA area
        this.noEngineCta.classList.add('visible');
        const ctaTextEl = this.noEngineCta.querySelector('#cta-text');
        if (ctaTextEl) {
          const short = reason === 'timeout' ? 'Tiempo de espera agotado' : 'Error de API';
          ctaTextEl.textContent = errorDetail ? `${short}: ${errorDetail.slice(0, 80)}` : short;
        }
        this.rewriteBtn.style.display = 'none';
      } else if (result.signals.length > 0) {
        // Has signals but no auto-rewrite → show manual button
        this.noEngineCta.classList.remove('visible');
        this.rewriteBtn.style.display = '';
      } else {
        this.noEngineCta.classList.remove('visible');
        this.rewriteBtn.style.display = 'none';
      }
    }
  }

  clearSuggestion(): void {
    this.currentSuggestion = null;
    this.suggestionSection?.classList.remove('visible');
    if (this.rewriteBtn && this.signalsContainer && this.signalsContainer.children.length > 0) {
      this.rewriteBtn.style.display = '';
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
    this.suggestionSection = null;
    this.suggestionText = null;
    this.actionsEl = null;
    this.applyBtn = null;
    this.ignoreBtn = null;
    this.rewriteBtn = null;
    this.busyIndicator = null;
    this.noEngineCta = null;
    this.currentSuggestion = null;
    this.onCallback = null;
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
