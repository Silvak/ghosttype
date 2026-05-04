# Roadmap — GhostType

Roadmap organizado en tres fases progresivas. Cada fase produce un artefacto funcional y demostrable.

---

## Estado General

| Fase | Nombre | Estado | Objetivo |
|---|---|---|---|
| Fase 1 | Detección y sugerencias básicas | En Progreso | Extensión funcional con detector por reglas y UI de sugerencias |
| Fase 2 | Reescritor híbrido (Local ONNX + API opcional) | Pendiente | Reescritura local con catálogo de modelos ONNX de descarga manual + ApiGateway opcional |
| Fase 3 | Pulido, calidad y publicación | Pendiente | Producto completo, controles finos y publicación en stores |

---

## Fase 1 — Detección y Sugerencias Básicas

**Objetivo:** Demostrar que la extensión se inyecta en páginas reales, detecta señales sensibles mientras el usuario escribe, y muestra sugerencias de corrección. Sin modelo de IA. Solo DOM + reglas.

**Criterio de éxito:** La extensión carga en Chrome, detecta señales en Reddit/Twitter/X, muestra un widget de riesgo junto al textarea, y el usuario puede configurar el nivel de privacidad desde el popup.

### Setup y scaffold

- Inicializar proyecto con WXT `0.20.18` + React `19.2.4` + TypeScript `5.9.3` _(hecho: `package.json` y `wxt.config.ts` configurados)_
- Configurar Tailwind CSS `4.2.1` via `@tailwindcss/vite` en `wxt.config.ts` _(hecho)_
- Configurar `tsconfig.json` con `isolatedModules: true` y target `ES2022` _(hecho)_
- Crear `.gitignore` con `.output/`, `.wxt/`, `node_modules/`, `.env` _(hecho)_
- Verificar que `pnpm dev` arranca sin errores
- Verificar que la extensión carga en `chrome://extensions`
- Añadir iconos de extensión (16x16, 48x48, 128x128) en `public/icons/`
- Configurar Vitest `4.0.18` para tests unitarios (`vitest.config.ts` extendiendo WXT)

### The Infiltrator — Content Script

- Implementar `defineContentScript()` en `src/entrypoints/content.ts`
- Detectar `<textarea>` y `contenteditable` con `MutationObserver`
- Aplicar debounce de **200ms** en cambios de texto
- Extraer texto plano del elemento activo
- Enviar texto al background via `browser.runtime.sendMessage({ text, level })`
- Recibir resultado del background y actualizar el widget en el DOM
- Soportar dominios: `reddit.com`, `twitter.com`, `x.com`, `news.ycombinator.com`
- Implementar Suggestion Widget con Shadow DOM (DOM vanilla, sin React)
  - Badge de riesgo (verde/amarillo/rojo) con `riskScore`
  - Chips de señales detectadas con tooltip explicativo
  - Sección de sugerencia reescrita (placeholder para Fase 2 si no hay engine)
  - CTA "Configurar engine" si The Rewriter devuelve `no-engine-configured`
  - Botón "Aplicar" que reemplaza el texto en el textarea
  - Botón "Ignorar" que descarta la sugerencia

### The Scanner — Detector por Reglas

- Crear `src/types/index.ts` con tipos finales: `Signal`, `ScanResult`, `PrivacyLevel`, `AppSettings`, `ModelEntry`, `ApiSettingsRow`, `RewriteResult`
- Crear `src/scanner/patterns.ts` con expresiones regulares reutilizables
- Crear `src/scanner/rules.ts`:
  - Compilar **todos los `RegExp` una sola vez** al importar el módulo (no en cada llamada)
  - Diccionarios de ciudades, países, tecnologías y nombres como `Set<string>` para lookup O(1)
  - Patrones iniciales:
    - Nombres propios (patrones heurísticos)
    - Ciudades y países (Set de diccionario)
    - Profesiones y títulos académicos
    - Tecnologías y frameworks específicos
    - Expresiones temporales concretas ("yesterday", "last week", "back in 2019")
    - Dialectos e idioms regionales (español e inglés)
  - Filtrado por nivel activo: `soft` activa ~30% de patrones, `medium` ~70%, `strong` 100%
- Crear `src/scanner/index.ts` con la API pública: `scan(text, level): ScanResult`
- Calcular `riskScore` (0–100) basado en número y severidad de señales
- Escribir tests unitarios para el Scanner con Vitest

### Background Service Worker

- Implementar `defineBackground()` en `src/entrypoints/background.ts`
- Configurar listener `browser.runtime.onMessage`
- Orquestar llamada al Scanner y devolver `ScanResult` al content script
- Invocar The Rewriter si el nivel lo requiere o el usuario lo solicita
- Propagar el nivel de privacidad activo en cada mensaje
- Gestión de errores y logging local (sin envío a servidor)

### The Vault — Configuración Básica

- Crear `src/vault/schema.ts` con tablas `settings`, `modelCache`, `apiSettings`
- Crear `src/vault/index.ts` con API CRUD: `getSetting`, `setSetting`, `getActiveApi`, `getActiveModelId`
- Persistir toggle on/off del usuario
- Persistir nivel de privacidad seleccionado (`soft` | `medium` | `strong`)

### Popup UI — Controles Principales

- Crear app React en `src/entrypoints/popup/`
- Toggle para activar/desactivar GhostType en la pestaña actual
- Selector de nivel de privacidad: **Suave / Medio / Fuerte** con descripción breve de cada nivel
- Badge con el número de señales detectadas en la sesión actual
- Indicador de engine activo (placeholder de Fase 2): "Sin engine configurado"

### Fase 1 — Pendientes Consolidados

- Vitest configurado (`vitest.config.ts`)
- Iconos en `public/icons/`
- Tipos finales en `src/types/index.ts`
- Scanner v2 con RegExp precompiladas + Set lookups + filtrado por nivel + `riskScore`
- Tests unitarios del Scanner
- Suggestion Widget con Shadow DOM
- Background SW con orquestación completa y gestión de errores
- Vault con schema y API básica
- Popup completo con selector de nivel e indicador de engine

---

## Fase 2 — Reescritor Híbrido (Local ONNX + API Externa Opcional)

**Objetivo:** Añadir The Rewriter: un dispatcher que permite al usuario usar un modelo ONNX local (descargado manualmente desde el popup) o una API externa (OpenAI, Anthropic, Gemini) para reescribir el texto detectado por el Scanner. El usuario controla explícitamente qué engine instala o configura.

**Criterio de éxito:** El usuario puede descargar un modelo desde el popup, escribir en Reddit/Twitter, pulsar "Reescribir" y recibir una sugerencia. O bien puede configurar una API key y recibir una sugerencia vía API. El widget muestra un CTA claro si no hay ningún engine configurado.

### Catálogo de modelos

- Crear `src/engine/models.ts` con `MODEL_CATALOG`:
  - `t5-small-q8`: `Xenova/t5-small` INT8, ~30MB, balance velocidad/calidad básica
  - `lamini-77m-q8`: `Xenova/LaMini-Flan-T5-77M` INT8, ~80MB, calidad media
  - `flan-t5-base-q8`: `Xenova/flan-t5-base` INT8, ~120MB, calidad alta
- Cada entrada incluye: `id`, `label`, `repo`, `dtype`, `sizeMB`, `latencyHint` (WebGPU / WASM), `quality`
- Las cifras de latencia son orientativas; se confirman con benchmarks en Fase 2

### Model Manager — descarga manual

- Crear `src/engine/model-manager.ts` con:
  - `list()`: devuelve catálogo con estado `downloaded | not-downloaded` por modelo
  - `download(id, onProgress)`: descarga el modelo vía Transformers.js y lo persiste en `modelCache`
  - `remove(id)`: borra el blob de IndexedDB y limpia la entrada
  - `setActive(id)`: solo permite activar modelos ya descargados; persiste `activeModelId` en settings
  - `getActive()`: devuelve el `ModelEntry` activo o `null`
  - `isDownloaded(id)`: consulta IndexedDB
- La descarga **nunca ocurre automáticamente**; siempre requiere acción explícita del usuario

### ApiGateway — proveedores externos

- Crear `src/engine/api-gateway.ts` con:
  - `PRIVACY_REWRITE_PROMPT` unificado (mismo texto para todos los proveedores, interpolando `{level}`)
  - Adapter para **OpenAI** (`gpt-4o-mini` por defecto)
  - Adapter para **Anthropic** (`claude-haiku-3-5` por defecto)
  - Adapter para **Google Gemini** (`gemini-2.0-flash` por defecto)
  - Función `rewrite(cfg, text, level): Promise<RewriteResult>`
  - Función `testConnection(cfg): Promise<{ ok: boolean; error?: string }>` para verificar la key desde el popup
  - Timeout de 8s en cada llamada; si se supera devuelve `{ suggestion: null, reason: 'timeout' }`

### Rewriter — dispatcher

- Crear `src/engine/rewriter.ts`:
  - `rewrite(text, signals, level)`: elige ApiGateway si hay API activa, si no modelo local activo, si ninguno devuelve `{ suggestion: null, reason: 'no-engine-configured' }`
  - Timeout duro de 8s aplicado a cualquier rama
  - `num_beams: 1` y `max_new_tokens` limitado a `Math.min(text.length * 2, 512)` para optimizar latencia local
  - Configurar `env.backends.onnx.wasm.wasmPaths` con `chrome.runtime.getURL('transformers/')`

### Encriptación de API keys

- Crear `src/vault/crypto.ts`:
  - `getMasterKey()`: deriva `CryptoKey` AES-GCM 256 bits con PBKDF2 sobre `chrome.runtime.id` + salt fijo, 100.000 iteraciones SHA-256
  - `encryptKey(plain): Promise<{ ciphertext: string; iv: string }>`: cifra con IV aleatorio
  - `decryptKey(ciphertext, iv): Promise<string>`: descifra in-memory
- Extender `src/vault/index.ts` con: `setApi(cfg)`, `getActiveApi()`, `clearApi(provider)`
- Las keys se descifran solo in-memory justo antes de la llamada a la API; nunca se escriben en claro

### The Vault — extensión del schema

- Añadir tabla `apiSettings: '&provider'` al schema Dexie
- Modelo de fila: `{ provider, encryptedKey, iv, model?, enabled, updatedAt }`
- Asegurarse de que `modelCache` almacena el blob completo y metadatos: `{ modelId, cachedAt, sizeMB }`

### Integración en el Background SW

- Invocar `rewriter.rewrite()` cuando:
  - Nivel `medium` o `strong` con ≥ 1 señal detectada
  - Nivel `soft` solo si el usuario pulsa el botón de reescritura en el widget
- Propagar el resultado (`suggestion` o `null + reason`) al content script
- Manejar `reason: 'no-engine-configured'` → el widget muestra el CTA

### Popup UI — Gestión de engine

- Crear `src/components/ui/ModelManager.tsx`:
  - Lista el catálogo con nombre, tamaño, calidad estimada y latencia orientativa
  - Estado por modelo: `No descargado` / `Descargando X%` / `Listo`
  - Botones: `Descargar` / `Eliminar` / `Activar` (solo si descargado)
  - Solo un modelo puede estar activo a la vez
- Crear `src/components/ui/ApiSettings.tsx`:
  - Toggle "Usar API externa para mayor calidad"
  - Radio: `OpenAI` / `Anthropic` / `Gemini`
  - Campo de API key enmascarado
  - Botón "Probar conexión" que llama a `testConnection()`
  - Indicador: `Conectado` / `Error: <mensaje>`
- Crear `src/components/ui/EngineStatus.tsx`:
  - Badge visible en el popup: `API: Gemini Flash` / `Local: t5-small (listo)` / `Sin engine configurado`
- Integrar los tres componentes en `src/entrypoints/popup/App.tsx`

### Tests y validación

- Tests unitarios para `rewriter.ts` con mocks de ApiGateway y model-manager
- Tests unitarios para `crypto.ts` (cifrar → descifrar → valor original)
- Benchmark de latencia por modelo y hardware (WebGPU vs WASM)
- Validar que el texto reescrito no introduce señales nuevas (pasar resultado por el Scanner)
- Probar en dominios objetivo: Reddit, Twitter/X, Hacker News

---

## Fase 3 — Pulido, Calidad y Publicación

**Objetivo:** Producto completo, visualmente pulido, con controles finos y listo para publicar en Chrome Web Store y Firefox Add-ons.

**Criterio de éxito:** Un usuario nuevo puede instalar la extensión, entender su propósito en el onboarding, escribir un mensaje con información sensible, configurar un engine (modelo o API), recibir una sugerencia privada y aplicarla con un clic.

### Sistema Visual — Design System

- Definir paleta de color en `global.css` con `@theme` de Tailwind v4:
  - Ghost Green: `oklch(0.7 0.15 150)` — sin riesgo / sugerencia aplicada
  - Warning Amber: `oklch(0.75 0.15 80)` — riesgo medio
  - Danger Red: `oklch(0.65 0.2 25)` — señales de alto riesgo
  - Background Dark: `oklch(0.12 0.01 240)` — UI principal
- Crear componentes base en `src/components/ui/`:
  - `LevelSelector` — selector Suave/Medio/Fuerte con descripción
  - `RiskBadge` — badge de nivel de riesgo con color
  - `SignalChip` — chip de señal detectada con tooltip
  - `Toggle` — interruptor de activación
- Modo oscuro como default

### Popup UI — Rediseño Completo

- Selector de nivel de privacidad prominente con explicación de cada nivel
- Indicador de señales detectadas en la sesión actual
- Sección de gestión de engine (Models + AI Provider) pulida con animaciones
- Enlace al side panel para detalles completos
- Animaciones de entrada con CSS transitions

### Side Panel — Panel Completo

- Crear app React en `src/entrypoints/sidepanel/`
- Sección "Señales detectadas": lista completa con categoría y explicación de riesgo
- Sección "Sugerencias": historial de reescrituras aplicadas en la sesión
- Sección "Configuración":
  - Nivel de privacidad activo
  - Dominios donde GhostType está activo
  - Gestión de modelos descargados (descargar, eliminar)
  - Gestión de API provider

### Calidad de Reescritura

- Evaluar y ajustar el `PRIVACY_REWRITE_PROMPT` para cada nivel de privacidad
- Implementar post-procesado del resultado: limpiar artefactos del modelo, asegurar coherencia
- Validar que las sugerencias no contienen las mismas señales del texto original (pasar por Scanner)
- Medir calidad subjetiva con textos de prueba representativos en español e inglés

### Onboarding

- Crear flujo de bienvenida en la primera instalación
- Explicar en 3 pasos qué hace GhostType y por qué importa
- Guiar al usuario a elegir su nivel de privacidad por defecto
- Guiar al usuario a descargar un modelo o configurar una API key
- Explicar la diferencia local (privado, más lento) vs API (envía texto al proveedor, más rápido)

### Soporte Multiplataforma

- Añadir dominios soportados: `discord.com`, `github.com`, `linkedin.com`
- Probar compatibilidad en Firefox (`pnpm zip:firefox`)
- Ajustar el Suggestion Widget para editores complejos (Notion, Google Docs)

### Calidad y Publicación

- Cobertura de tests > 80% en módulos críticos (`scanner`, `engine`, `vault`)
- Tests de integración del pipeline completo (content → background → scanner/rewriter)
- Auditar permisos del manifest (principio de mínimo privilegio)
- Revisar Content Security Policy del manifest
- Optimizar tamaño del bundle (tree-shaking de Transformers.js)
- Crear assets para Chrome Web Store (capturas, descripción, iconos)
- Redactar política de privacidad (zero telemetría por defecto; API externa es opt-in y responsabilidad del usuario)
- Publicar en Chrome Web Store
- Publicar en Firefox Add-ons

---

## Decisiones Cerradas

Decisiones de arquitectura ya resueltas que no se revisarán durante el desarrollo del MVP:

- **Sin perfiles estilométricos**: no se acumulan embeddings históricos del texto del usuario. El objetivo es eliminar señales en el texto activo, no medir distancia estilométrica.
- **Sin Ghost Score como métrica**: el `riskScore` del Scanner (0–100 por reglas) reemplaza cualquier métrica basada en embeddings.
- **Descarga manual de modelos**: el usuario elige y descarga explícitamente desde el popup. Nada se descarga en segundo plano sin su confirmación.
- **API externa opt-in**: requiere que el usuario configure proveedor + key. Sin esa configuración, todo el procesamiento es local.
- **Mismo system prompt para todas las APIs**: `PRIVACY_REWRITE_PROMPT` es idéntico para OpenAI, Anthropic y Gemini; solo cambia el adapter HTTP.
- **Encriptación de keys = ofuscación pragmática**: AES-GCM con PBKDF2 sobre `chrome.runtime.id`. Evita exposición trivial en IndexedDB; no protege contra acceso al perfil del navegador.
- **Reglas solo en Scanner (detección)**: el Rewriter nunca hace sustitución por templates. Si no hay engine, devuelve `null` y muestra CTA.
- **Budget de latencia inicial**: 8s como tope duro para cualquier inferencia (local o API). Se refinará en Fase 2 con benchmarks reales y ajustes de `max_new_tokens` / `num_beams`.

---

## Backlog — Ideas Futuras

Ideas para versiones posteriores, fuera del alcance del MVP:

- **Más dominios**: Telegram Web, phpBB, foros comunitarios.
- **Análisis de documentos**: soporte para Google Docs y Notion.
- **API local**: exponer el motor de análisis como API local (localhost) para integraciones con otros editores.
- **Multi-perfil**: gestionar múltiples "modos" de privacidad con configuraciones distintas por dominio.
- **Reporte exportable**: generar un PDF con el análisis de riesgo de un texto dado.
- **Benchmark automático de hardware**: detectar capacidades WebGPU del dispositivo y recomendar el modelo más adecuado del catálogo.
- **Actualización incremental de modelo**: actualizar solo las capas del modelo modificadas en nuevas versiones.
- **Más proveedores de API**: Mistral, Cohere, modelos locales vía LM Studio / Ollama.
