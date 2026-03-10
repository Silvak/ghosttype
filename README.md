# GhostType

> **Layer 0 for textual privacy.** A local-first browser extension that acts as a firewall between your thoughts and the network.

GhostType is not a grammar corrector. It is a stylometric anonymity tool: it decouples your identity from your prose, transforming your writing into a generic signal that is indecipherable to Authorship Search and Recognition Classifiers (ESRC).

---

## The Problem

Modern AI models can identify an author with **99% accuracy** by analyzing only their writing style: punctuation, sentence rhythm, vocabulary, and idioms. Every message you post on Reddit, Twitter, or any forum is a sample of your linguistic fingerprint.

GhostType solves this on the user's own hardware, without sending any data to any server.

---

## Core Objectives

### Stylometric Anonymity
Neutralize the unique writing patterns (punctuation, rhythm, vocabulary) that allow an AI to identify you with high precision.

### Data Sovereignty
Guarantee that all analysis runs 100% on the user's hardware (NVIDIA/WebGPU), fulfilling the **Zero-Telemetry** promise.

### Leak Awareness
Educate the user about which specific details in their message (entities, timestamps, slang) are destroying their anonymity.

---

## Core Features

### Ghost Score — Identity Traffic Light
A visual indicator injected into the page DOM, near the text input, that rates the "traceability" of the message in real time.

- Calculates **Stylistic Perplexity**: if the text is too predictable or too similar to your local base profile, the score drops.
- Visualization: a progress ring that shifts from green (Ghost) to red (Identifiable Human).

### Critical Entity Radar — Leak Detector
Detects combinations of data that, while not real names, function as a fingerprint.

- Recognizes patterns like "Profession + City + Pet" or "Technology + Years of experience + Dialect".
- Highlights these words with a special underline so the user can generalize them.

### Adversarial Rewriting — The "Cloak"
Uses a local language model (SLM) to propose alternative versions of your sentences.

- **Camouflage Mode**: rewrites the text mimicking a different geographic region or education level.
- **Neutralization**: removes idioms and linguistic tics (excessive use of ellipses, exclamation marks, etc.).

### Temporal Masking
Protection against tracking through posting time patterns.

- Detects if your posting pattern is too consistent (e.g., always at 3:00 PM from the same timezone).
- Suggests scheduling the post or warns about the risk of the temporal pattern.

---

## Tech Stack

| Technology | Package | Version | Role |
|---|---|---|---|
| WXT | `wxt` | 0.20.18 | Extension framework for Chrome/Firefox |
| WXT React Module | `@wxt-dev/module-react` | latest | React integration in WXT |
| React | `react` | 19.2.4 | Popup and side panel UI |
| React DOM | `react-dom` | 19.2.4 | DOM rendering |
| TypeScript | `typescript` | 5.9.3 | Static typing |
| Tailwind CSS | `tailwindcss` | 4.2.1 | Utility-first styles (CSS-first config) |
| Tailwind Vite Plugin | `@tailwindcss/vite` | 4.2.1 | Vite plugin for Tailwind v4 |
| Transformers.js | `@huggingface/transformers` | 3.8.1 | Local ML inference via WebGPU/WASM |
| Dexie.js | `dexie` | 4.3.0 | IndexedDB wrapper for local storage |
| Vitest | `vitest` | 4.0.18 | Testing framework |

> All versions are stable releases verified on npm (March 2026). No betas or release candidates are used.

---

## Architecture

GhostType follows a modular three-layer architecture:

- **The Infiltrator** (Content Script): injects logic into Reddit, Twitter, forums, etc. without breaking the user experience.
- **The Engine** (WebGPU + Transformers.js): runs model inference directly on the user's GPU, ensuring latency < 200ms.
- **The Vault** (IndexedDB via Dexie): stores previous style vectors for comparison, locally in the browser.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full technical detail.

---

## Installation & Development

### Requirements

- Node.js >= 22
- pnpm >= 9

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/ghosttype.git
cd ghosttype

# Install dependencies
pnpm install

# Start in development mode (with HMR)
pnpm dev
```

### Loading the Extension in Chrome

1. Run `pnpm dev` — WXT builds the extension into `.output/chrome-mv3/`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top right corner)
4. Click **Load unpacked** and select the `.output/chrome-mv3/` folder

### Available Scripts

```bash
pnpm dev          # Development with HMR
pnpm build        # Production build
pnpm zip          # Package for Chrome Web Store
pnpm zip:firefox  # Package for Firefox Add-ons
pnpm test         # Run tests with Vitest
```

---

## Roadmap

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full breakdown of development phases.

| Phase | Status | Description |
|---|---|---|
| Phase 1 — PoC | Pending | WXT scaffold, text detection, entity highlighting |
| Phase 2 — Local Inference | Pending | BERT-tiny integration, Ghost Score, stylistic profile |
| Phase 3 — UI/UX | Pending | React/Tailwind design, Adversarial Rewriting, Temporal Masking |

---

## Design Philosophy

- **Local-first**: no data leaves the user's device. Zero telemetry.
- **Zero-Telemetry**: no analytics, no remote logs, no silent model updates.
- **Modular**: each component (Engine, Vault, Infiltrator) can evolve independently.
- **Transparent**: the user always knows what is being analyzed and why.

---

## License

MIT — Copyright (c) 2026 Jesus Silva. See [`LICENSE`](LICENSE) for details.
