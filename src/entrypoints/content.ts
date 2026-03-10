import type { GhostTypeMessage, GhostTypeResponse, GhostScore, LeakEntity } from '@/types';

// ─── CSS injected once into the page ────────────────────────────────────────

const STYLES = `
.gt-ring-wrapper {
  position: absolute;
  z-index: 2147483647;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.gt-ring-wrapper.gt-interactive {
  pointer-events: auto;
}
.gt-ring {
  width: 48px;
  height: 48px;
  cursor: default;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
  transition: transform 0.15s ease;
}
.gt-ring:hover {
  transform: scale(1.1);
}
.gt-ring-bg {
  fill: none;
  stroke: rgba(255,255,255,0.08);
  stroke-width: 4;
}
.gt-ring-arc {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s ease, stroke 0.4s ease;
}
.gt-ring-label {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  fill: #fff;
  dominant-baseline: middle;
  text-anchor: middle;
}
.gt-leaks {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 220px;
}
.gt-badge {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  padding: 3px 7px;
  border-radius: 4px;
  background: rgba(10,10,15,0.92);
  border-left: 3px solid;
  color: #e5e7eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: auto;
  cursor: default;
  line-height: 1.4;
}
.gt-badge-word {
  font-weight: 700;
}
.gt-badge-cat {
  opacity: 0.55;
  margin-left: 4px;
  font-size: 9px;
  text-transform: uppercase;
}
`;

function injectStyles(): void {
  if (document.getElementById('gt-styles')) return;
  const style = document.createElement('style');
  style.id = 'gt-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);
}

// ─── Score ring colors ───────────────────────────────────────────────────────

const LEVEL_COLOR: Record<GhostScore['level'], string> = {
  ghost: '#4ade80',    // green-400
  warning: '#facc15',  // yellow-400
  exposed: '#f87171',  // red-400
};

const RISK_COLOR: Record<string, string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
};

// ─── Per-element state ───────────────────────────────────────────────────────

interface ElementState {
  wrapper: HTMLDivElement;
  arc: SVGCircleElement;
  label: SVGTextElement;
  leaksContainer: HTMLDivElement;
}

const elementStates = new WeakMap<HTMLElement, ElementState>();

// ─── Widget creation ─────────────────────────────────────────────────────────

function getOrCreateWidget(el: HTMLElement): ElementState {
  const existing = elementStates.get(el);
  if (existing) return existing;

  const wrapper = document.createElement('div');
  wrapper.className = 'gt-ring-wrapper gt-interactive';

  // SVG ring
  const R = 18;
  const CIRC = 2 * Math.PI * R;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.classList.add('gt-ring');

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bg.setAttribute('cx', '24');
  bg.setAttribute('cy', '24');
  bg.setAttribute('r', String(R));
  bg.classList.add('gt-ring-bg');

  const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  arc.setAttribute('cx', '24');
  arc.setAttribute('cy', '24');
  arc.setAttribute('r', String(R));
  arc.setAttribute('stroke-dasharray', String(CIRC));
  arc.setAttribute('stroke-dashoffset', String(CIRC));
  arc.setAttribute('transform', 'rotate(-90 24 24)');
  arc.classList.add('gt-ring-arc');

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', '24');
  label.setAttribute('y', '24');
  label.classList.add('gt-ring-label');
  label.textContent = '--';

  svg.appendChild(bg);
  svg.appendChild(arc);
  svg.appendChild(label);

  // Leaks container
  const leaksContainer = document.createElement('div');
  leaksContainer.className = 'gt-leaks';

  wrapper.appendChild(svg);
  wrapper.appendChild(leaksContainer);
  document.body.appendChild(wrapper);

  const state: ElementState = { wrapper, arc, label, leaksContainer };
  elementStates.set(el, state);
  return state;
}

// ─── Widget positioning ──────────────────────────────────────────────────────

function positionWidget(el: HTMLElement, wrapper: HTMLDivElement): void {
  const rect = el.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  wrapper.style.top = `${rect.bottom + scrollY - 54}px`;
  wrapper.style.left = `${rect.right + scrollX - 54}px`;
}

// ─── Widget update ───────────────────────────────────────────────────────────

function updateWidget(el: HTMLElement, score: GhostScore): void {
  const state = getOrCreateWidget(el);
  const { wrapper, arc, label, leaksContainer } = state;

  positionWidget(el, wrapper);

  // Update ring arc
  const R = 18;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - score.value / 100);
  arc.setAttribute('stroke-dashoffset', String(offset));
  arc.setAttribute('stroke', LEVEL_COLOR[score.level]);

  // Update label
  label.textContent = String(score.value);
  label.setAttribute('fill', LEVEL_COLOR[score.level]);

  // Update leak badges
  leaksContainer.innerHTML = '';
  const shown = score.leaks.slice(0, 5);
  for (const leak of shown) {
    const badge = document.createElement('div');
    badge.className = 'gt-badge';
    badge.style.borderColor = RISK_COLOR[leak.risk] ?? '#facc15';
    badge.title = leak.suggestion ?? '';

    const word = document.createElement('span');
    word.className = 'gt-badge-word';
    word.textContent = `"${leak.text}"`;

    const cat = document.createElement('span');
    cat.className = 'gt-badge-cat';
    cat.textContent = leak.category;

    badge.appendChild(word);
    badge.appendChild(cat);
    leaksContainer.appendChild(badge);
  }

  if (score.leaks.length > 5) {
    const more = document.createElement('div');
    more.className = 'gt-badge';
    more.style.borderColor = '#6b7280';
    more.textContent = `+${score.leaks.length - 5} more leaks`;
    leaksContainer.appendChild(more);
  }
}

// ─── Active element tracking ─────────────────────────────────────────────────

let activeElement: HTMLElement | null = null;

// ─── Main content script ─────────────────────────────────────────────────────

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('[GhostType] Content script loaded on:', window.location.hostname);
    injectStyles();
    observeTextInputs();

    // Reposition widget on scroll/resize
    window.addEventListener('scroll', repositionActive, { passive: true });
    window.addEventListener('resize', repositionActive, { passive: true });
  },
});

function repositionActive(): void {
  if (!activeElement) return;
  const state = elementStates.get(activeElement);
  if (state) positionWidget(activeElement, state.wrapper);
}

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

const INPUT_SELECTOR = [
  'textarea',
  'input[type="text"]',
  'input[type="search"]',
  'input[type="email"]',
  'input[type="url"]',
  'input:not([type])',
  '[contenteditable="true"]',
  '[contenteditable=""]',
].join(', ');

function attachListenersToInputs(): void {
  const inputs = document.querySelectorAll<HTMLElement>(INPUT_SELECTOR);

  if (inputs.length > 0) {
    console.log('[GhostType] Found inputs:', inputs.length, Array.from(inputs).map(el => el.tagName + (el.id ? '#' + el.id : '')).join(', '));
  }

  inputs.forEach((el) => {
    if (listenedElements.has(el)) return;
    listenedElements.add(el);

    el.addEventListener('focus', () => {
      activeElement = el;
    });

    el.addEventListener('blur', () => {
      // Small delay so click on badge doesn't hide widget
      setTimeout(() => {
        if (activeElement === el) activeElement = null;
      }, 200);
    });

    el.addEventListener('input', () => {
      activeElement = el;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const text = extractText(el);
        console.log('[GhostType] Input event, text length:', text.trim().length);
        if (text.trim().length > 10) {
          analyzeText(text, el);
        }
      }, 300);
    });
  });
}

function extractText(el: HTMLElement): string {
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    return (el as HTMLInputElement | HTMLTextAreaElement).value;
  }
  return el.innerText ?? el.textContent ?? '';
}

async function analyzeText(text: string, el: HTMLElement): Promise<void> {
  const isActive = await getIsActive();
  if (!isActive) {
    console.log('[GhostType] Extension is disabled, skipping analysis');
    return;
  }

  console.log('[GhostType] Sending ANALYZE_TEXT to background:', text.substring(0, 50) + (text.length > 50 ? '…' : ''));

  const message: GhostTypeMessage = {
    type: 'ANALYZE_TEXT',
    payload: text,
  };

  try {
    const response = (await browser.runtime.sendMessage(message)) as GhostTypeResponse;
    console.log('[GhostType] Response from background:', response.type);

    if (response.type === 'SCORE_RESULT') {
      const score = response.payload as GhostScore;
      console.log('[GhostType] Updating widget with score:', score.value, score.level);
      updateWidget(el, score);
    }
  } catch (e) {
    console.error('[GhostType] sendMessage error:', e);
  }
}

async function getIsActive(): Promise<boolean> {
  try {
    const result = await browser.storage.local.get('isActive');
    return result.isActive !== false; // default true
  } catch {
    return true;
  }
}
