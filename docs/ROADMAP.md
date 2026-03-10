# Roadmap — GhostType

Roadmap organized into three progressive phases. Each phase builds on the previous one and produces a functional, demonstrable artifact.

---

## Overall Status


| Phase   | Name                      | Status    | Goal                                           |
| ------- | ------------------------- | --------- | ---------------------------------------------- |
| Phase 1 | Proof of Concept          | ⬜ Pending | Basic functional extension with text detection |
| Phase 2 | Local Inference           | ⬜ Pending | Real Ghost Score with local ONNX model         |
| Phase 3 | UI/UX + Advanced Features | ⬜ Pending | Complete, polished product                     |


---

## Phase 1 — Proof of Concept

**Goal:** Demonstrate that the extension can inject itself into real pages, detect text, and flag predefined entities. No ML, no models. DOM + rule-based logic only.

**Success criteria:** The extension loads in Chrome, detects when the user types on Reddit/Twitter, and highlights words from a predefined list with a visible underline.

### Setup & Scaffold

- Initialize project with WXT `0.20.18` + React `19.2.4` + TypeScript `5.9.3`
- Configure Tailwind CSS `4.2.1` via `@tailwindcss/vite` in `wxt.config.ts`
- Configure `tsconfig.json` with `isolatedModules: true` and target `ES2022`
- Create `.gitignore` with `.output/`, `.wxt/`, `node_modules/`, `.env`
- Verify that `pnpm dev` starts the project without errors
- Verify that the extension loads in `chrome://extensions` from `.output/chrome-mv3/`
- Add extension icons (16x16, 48x48, 128x128) in `public/icons/`
- Configure Vitest `4.0.18` with `mergeConfig` from `wxt.config.ts`

### The Infiltrator — Base Content Script

- Implement `defineContentScript()` in `src/entrypoints/content.ts`
- Detect `<textarea>` and `contenteditable` elements in the DOM with `MutationObserver`
- Apply 300ms debounce on text changes
- Extract plain text from detected elements
- Send text to background via `browser.runtime.sendMessage`
- Receive response from background and apply highlights in the DOM
- Support the following target domains: `reddit.com`, `twitter.com`, `x.com`, `news.ycombinator.com`

### Leak Detector — Static Rules (v0)

- Define base types in `src/types/index.ts`: `LeakEntity`, `LeakCategory`, `GhostScore`
- Implement `src/modules/leakDetector.ts` with regex/dictionary detection
- Create initial list of leak patterns:
  - City and country names
  - Professions and academic titles
  - Common pet names
  - Specific technologies and frameworks
  - Temporal expressions ("yesterday", "last week", "back in 2019")
  - Regional dialects and idioms (initial list in Spanish and English)
- Implement visual highlighting in the DOM with injected CSS (no Tailwind in content script)
- Add basic tooltip on hover over a highlighted entity
- Write unit tests for the `leakDetector` module with Vitest

### Background Service Worker — Base

- Implement `defineBackground()` in `src/entrypoints/background.ts`
- Configure `browser.runtime.onMessage` listener to receive text from the content script
- Implement basic response (no ML): return list of entities detected by rules
- Add error handling and local logging

### Popup UI — Minimal Version

- Create React app in `src/entrypoints/popup/`
- Show extension status (active/inactive)
- Toggle to enable/disable GhostType on the current tab
- Show count of entities detected in the current session

### The Vault — Initialization

- Implement Dexie schema in `src/vault/schema.ts`
- Create tables: `profiles`, `samples`, `settings`
- Implement basic CRUD API in `src/vault/index.ts`
- Persist user configuration (active/inactive toggle)

---

## Phase 2 — Local Inference

**Goal:** Replace static rules with a real ONNX model running on WebGPU. Implement the Ghost Score with real stylometric analysis based on embeddings.

**Success criteria:** The Ghost Score displays a real value (0–100) calculated by comparing the current text against the user's stylistic profile stored in IndexedDB. Inference latency is < 200ms.

### The Engine — Transformers.js Integration

- Install and configure `@huggingface/transformers@3.8.1` in the background
- Configure `env.backends.onnx.wasm.wasmPaths` with `chrome.runtime.getURL('transformers/')`
- Declare WASM/ONNX files as `web_accessible_resources` in `wxt.config.ts`
- Implement `src/engine/index.ts` with function `getEmbedding(text: string): Promise<Float32Array>`
- Implement `src/engine/models.ts` with model configuration:
  - Primary model: `Xenova/all-MiniLM-L6-v2` (stylistic embeddings, ~23MB)
  - NER model: `Xenova/bert-base-NER` (entity detection, ~64MB)
- Implement lazy model loading (only when first needed)
- Implement automatic fallback: WebGPU → WASM if no GPU support
- Measure and log inference latency in development
- Write unit tests for `engine/index.ts` with mock data

### Ghost Score — Real Calculation

- Implement `src/modules/ghostScore.ts` with function `calculateGhostScore(embedding, profile)`
- Implement cosine similarity between current embedding and base profile
- Implement stylistic perplexity calculation (profile variance)
- Normalize score to range 0–100 (100 = maximum anonymity)
- Define thresholds: Green (80-100), Yellow (50-79), Red (0-49)
- Integrate score into the background → content script flow
- Write unit tests for score calculation

### The Vault — Stylistic Profile

- Implement `updateProfile(embedding: Float32Array)` in `src/vault/index.ts`
- Implement accumulation logic: keep the last N embeddings (N configurable, default 50)
- Implement `getBaseProfile(): Float32Array` (profile centroid)
- Implement periodic cleanup of old samples
- Implement profile export/import (for user backup)

### Leak Detector — NER Upgrade

- Integrate `Xenova/bert-base-NER` model into the Leak Detector
- Replace regex detection with NER token classification
- Detect entity combinations that form a fingerprint:
  - `PER + LOC` (person + location)
  - `ORG + DATE` (organization + date)
  - `LOC + MISC` (location + specific miscellaneous)
- Assign risk level to each detected combination
- Update highlights UI with risk levels (color by severity)

### Ghost Score Ring — DOM UI

- Implement `GhostScoreRing` component as pure SVG (no React, for the content script)
- Inject the ring near the detected textarea without breaking the page layout
- Animate color transition: green → yellow → red based on score
- Implement positioning relative to textarea (follow scroll and resize)
- Handle ring cleanup on tab change or navigation

### Side Panel UI — Initial Version

- Create React app in `src/entrypoints/sidepanel/`
- Show current Ghost Score with large ring
- Show list of detected entities with risk level
- Show session score history (mini chart)
- Add "Clear profile" button to reset the vault

---

## Phase 3 — UI/UX + Advanced Features

**Goal:** Complete, visually polished product with advanced features: Adversarial Rewriting and Temporal Masking. Ready to publish on the Chrome Web Store.

**Success criteria:** A user can write text, see their Ghost Score in real time, receive rewriting suggestions that improve the score, and be warned about dangerous temporal patterns.

### Visual Design — Design System

- Define color palette in `global.css` with Tailwind v4 `@theme`:
  - Ghost Green: `oklch(0.7 0.15 150)` (high anonymity)
  - Warning Amber: `oklch(0.75 0.15 80)` (medium risk)
  - Danger Red: `oklch(0.65 0.2 25)` (identifiable)
  - Background Dark: `oklch(0.12 0.01 240)` (main UI)
- Define base typography (monospace font for data, sans-serif for UI)
- Create base components in `src/components/ui/`:
  - `GhostScoreRing` (React, for popup/sidepanel)
  - `LeakBadge` (entity label with risk level)
  - `ScoreHistory` (mini history chart)
  - `Toggle` (activation switch)
  - `Button` (button with variants)
- Implement dark mode as default (privacy extension = dark UI)

### Popup UI — Full Redesign

- Redesign popup with the defined design system
- Show prominent Ghost Score with animated ring
- Show top 3 highest-risk detected entities
- Add quick access to the side panel
- Add engine status indicator (loading model / ready / error)
- Entrance animations with CSS transitions

### Side Panel UI — Full Redesign

- Redesign side panel with the defined design system
- "Ghost Score" section: large ring + session history
- "Leak Radar" section: full entity list with risk explanation
- "Adversarial Rewriting" section: rewriting suggestions panel
- "Settings" section: sensitivity settings, active domains, vault management
- Tab navigation between sections

### Adversarial Rewriting — The "Cloak"

- Research and select SLM (Small Language Model) for rewriting:
  - Candidate: `onnx-community/Qwen3-0.6B-ONNX` (~300MB, device: webgpu)
  - Lightweight alternative: fine-tuned paraphrase model (~100MB)
- Implement `src/modules/adversarialRewriter.ts`
- **Neutralization Mode**: remove idioms, linguistic tics, excessive punctuation
- **Regional Camouflage Mode**: rewrite mimicking a different dialect than detected
- **Education Level Mode**: adjust vocabulary to a different level than the user's usual
- Show 2-3 rewriting alternatives in the side panel
- Implement "apply suggestion" that replaces text in the original textarea
- Show projected Ghost Score for each suggestion before applying it
- Add "Auto-improve" button that applies the best suggestion

### Temporal Masking

- Implement `src/modules/temporalMasker.ts`
- Record user activity timestamps in The Vault (time only, no date)
- Detect consistent time patterns (e.g., always active between 14:00-16:00 UTC-4)
- Infer probable timezone from the pattern
- Show warning if pattern is too consistent (> 80% of sessions in same time range)
- If the platform supports post scheduling, show alternative time suggestion
- Implement "temporal noise": suggest waiting N random minutes before posting

### Onboarding & Education

- Create onboarding flow (first time the extension is installed)
- Explain what stylometry is with visual examples
- Guide the user to "calibrate" their base profile (write 5-10 sample texts)
- Create educational tooltips on each feature explaining the specific risk
- Add "Why does this matter?" section in the side panel

### Quality & Publishing

- Increase test coverage to > 80% on critical modules (`ghostScore`, `leakDetector`, `engine`)
- Implement integration tests for the full flow (content → background → engine)
- Audit manifest permissions (principle of least privilege)
- Review manifest Content Security Policy
- Optimize bundle size (Transformers.js tree-shaking)
- Create Chrome Web Store assets (screenshots, description, icons)
- Write privacy policy (zero-telemetry, no external data)
- Publish on Chrome Web Store
- Publish on Firefox Add-ons (`pnpm zip:firefox`)

---

## Backlog — Future Features

Ideas for later versions, outside the MVP scope:

- **Anonymous Collaborative Mode**: share anonymized style profiles to improve models locally (federated learning).
- **More platform support**: Discord, Telegram Web, GitHub Issues, phpBB forums.
- **Document analysis**: support for Google Docs and Notion.
- **Local API**: expose the analysis engine as a local API (localhost) for integrations with other editors.
- **Multi-identity profile**: manage multiple "personas" with different stylistic profiles.
- **Export report**: generate a PDF with the risk analysis of a given text.

