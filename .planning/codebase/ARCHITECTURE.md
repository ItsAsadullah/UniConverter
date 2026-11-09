---
last_mapped_commit: 95728e0384f6255246213a1e57dfda1d480ff996
last_mapped_at: 2026-11-09
---
<!-- refreshed: 2026-11-09 -->
# Architecture

**Analysis Date:** 2026-11-09

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                 BUILD TIME — Astro 7 static site generator (SSG)              │
│  `astro.config.mjs` (output: 'static', build.format: 'directory')             │
├────────────────────┬─────────────────────────┬───────────────────────────────┤
│   Route pages      │  Layout / chrome        │  Catalog data (single source) │
│  `src/pages/**`    │ `src/layouts/           │  `src/data/tools.ts`          │
│  (+ getStaticPaths │   ToolLayout.astro`     │  `src/data/lucide-icons.ts`   │
│   for pdf/image)   │                         │                               │
└─────────┬──────────┴───────────┬─────────────┴───────────────┬───────────────┘
          │ renders (SSR only,   │                             │
          ▼ NO client: hydration)▼                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Svelte 5 "markup components" → static HTML with stable DOM ids / data-attrs │
│  `src/components/*.svelte`  (BijoyWorkspace, PdfStudio, ImageStudio,          │
│   DocumentScanner, NidCardScanner, VectorStudio, CalendarTool, …)            │
└─────────┬────────────────────────────────────────────────────────────────────┘
          │ `dist/` (static HTML + `public/` copied verbatim)
          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                RUNTIME — browser / Capacitor Android WebView                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ App shell (every page): `public/js/shell.js`                                  │
│  SPA router (#workbench swap) · i18n bn/en · theme · search palette ·         │
│  favorites/recents · IndexedDB vault + optional Cloudflare sync · SW register │
├───────────────┬────────────────┬─────────────────┬───────────────────────────┤
│ UI controllers│ (DOM-binding IIFEs, expose window.TechHat* init APIs)         │
│ `app.js`      │ `pdf-tools.js` │ `image-tools.js`│ `tools.js`                │
│ (Bijoy)       │ `pdf-convert.js│ `nid-scanner.js`│ (calendar/age/date/       │
│               │                │ `vector-tools.js│  invoice)                 │
│               │                │ `document-      │                           │
│               │                │   scanner.js`   │                           │
├───────────────┴────────────────┴─────────────────┴───────────────────────────┤
│ Pure engines (UMD: window/self global + module.exports, Node-testable)        │
│ `bijoy-engine.js` · `office.js` · `formats.js` · `document-scan-core.js` ·    │
│ `vector-trace-core.js` · `vector-export.js`                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Web Workers: `document-scan-worker.js`, `vector-trace-worker.js`              │
│ Vendor: `public/vendor/{jszip,pdf-lib,pdf,pdf.worker}.min.js`                 │
└─────────┬────────────────────────────────────────────────────────────────────┘
          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Persistence: localStorage (thbc-* keys) · IndexedDB vault · SW Cache Storage │
│ Offline: `public/sw.js` · Optional remote: `cloudflare/worker.js` (D1 + R2)  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| ToolLayout | HTML document, SEO meta, pre-paint theme/lang/cache-bust script, desktop sidebar + mobile app bar/bottom tabs, `#workbench` and `#afterWorkbenchSlot` slots, global dialogs (search, vault, sync), loads `shell.js` | `src/layouts/ToolLayout.astro` |
| Tool catalog | Categories, all tools, PDF/Image sub-tools (slug → tabId), SEO titles, icon palettes, helper getters | `src/data/tools.ts` |
| Icon set | Inline Lucide SVG bodies keyed by name | `src/data/lucide-icons.ts`, `src/components/ui/Icon.svelte` |
| Category landing | Category hub pages (`/pdf`, `/image`, `/bangla`, …) | `src/components/CategoryLanding.astro`, `src/components/CategoryLandingView.svelte` |
| Home | Dashboard markup; personalized sections filled by shell | `src/components/HomeWorkspace.svelte` |
| Bijoy workspace markup | Text/file converter + voice typing UI (`#tool-bijoy`) | `src/components/BijoyWorkspace.svelte` |
| PDF Studio markup | All PDF panes (`#tool-pdf`, `#pdf-pane-*`) | `src/components/PdfStudio.svelte` |
| Image Studio markup | Image panes (`#tool-image`, `#img-pane-*`), embeds scanner/NID/vector sub-markup | `src/components/ImageStudio.svelte` |
| Scanner markup | Multipage document/passport scanner UI (`#img-pane-scan`, `ds*` ids) | `src/components/DocumentScanner.svelte`, `src/components/scanner/i18n.js` |
| NID markup | NID front/back A4 composer UI (`#img-pane-combine`) | `src/components/NidCardScanner.svelte` |
| Vector markup | Raster-to-vector editor UI (`#img-pane-vector`, `vs*` ids) | `src/components/VectorStudio.svelte` |
| App shell runtime | SPA navigation, prefetch, i18n, theme, search, favorites, vault, clipboard paste, SW registration | `public/js/shell.js` |
| Bijoy controller | Binds `#tool-bijoy`; text/file conversion, voice typing (Web Speech) | `public/js/app.js` |
| Bijoy engine | Pure Bijoy ⇄ Unicode conversion | `public/js/bijoy-engine.js` |
| Office/RTF/TXT engines | OOXML (DOCX/XLSX/PPTX) and RTF/TXT conversion | `public/js/office.js`, `public/js/formats.js` |
| PDF controller | Merge/split/compress/organize/convert/encrypt using pdf-lib + pdf.js | `public/js/pdf-tools.js`, `public/js/pdf-convert.js` |
| Image controller | Resize/compress/crop/convert/combine/colors, shared image utils + scan geometry | `public/js/image-tools.js` |
| NID scanner | NID detection, homography, A4 sheet/PDF export | `public/js/nid-scanner.js` |
| Document scanner | Multipage scan UI controller, layers/eraser, worker jobs | `public/js/document-scanner.js` |
| Scan core | Deterministic detection/enhancement (also inside worker) | `public/js/document-scan-core.js`, `public/js/document-scan-worker.js` |
| Vector studio | Retouch editor + tracing orchestration | `public/js/vector-tools.js` |
| Vector core/export | Bezier tracing; SVG/EPS/AI export | `public/js/vector-trace-core.js`, `public/js/vector-trace-worker.js`, `public/js/vector-export.js` |
| Date/business tools | Calendar (Bangla/Hijri), age, date diff, invoice | `public/js/tools.js` |
| Service worker | Precache shell, network-first nav/assets, SWR for Google Fonts | `public/sw.js` |
| Vault sync API | Optional Cloudflare Worker: `/api/docs` CRUD over D1 + R2 | `cloudflare/worker.js`, `cloudflare/schema.sql`, `cloudflare/wrangler.toml` |
| Dev-only crop dataset endpoint | Vite middleware `POST /__local/crop-dataset` writing to `local-data/crop-dataset/` (localhost only) | `astro.config.mjs` |

## Pattern Overview

**Overall:** Static-site-generated multi-page app ("MPA") upgraded to a client-side SPA by a vanilla-JS shell, with **server-rendered markup (Astro + Svelte) and imperative DOM controllers (classic `<script>` IIFEs in `public/js/`)** — an "islands-free progressive enhancement" architecture. All document/image processing is 100% client-side and offline-capable.

**Key Characteristics:**
- Svelte components are used as **templating only**: no `client:*` directive exists anywhere in `src/`, so Svelte runes (`$state`, `$effect`, `onMount`) never run in the browser. Behaviour lives in `public/js/*.js`, which binds to DOM ids/`data-*` attributes emitted by the components.
- Contract between markup and behaviour is **DOM ids + data attributes** (e.g. `#tool-bijoy[data-initial-tab]`, `#pdf-pane-merge`, `#img-pane-scan[data-scan-mode]`, `data-i18n-bn`/`data-i18n-en`).
- Engines are **pure UMD modules** attached to globals (`window.BijoyEngine`, `TechHatDocumentCore`, `TechHatVectorTrace`, `TechHatVectorExport`, `OfficeConverter`, `TextFormats`) and also `module.exports` for Node tests.
- Controllers expose **idempotent init APIs** on `window` (`TechHatBijoyInit`, `TechHatPDF.init/switchTab`, `TechHatImage.init/switchTab`, `TechHatNidScanner.init`, `TechHatScannerInit`, `TechHatTools.initPage`, `TechHatVector`) guarded by `dataset.*Bound === '1'` flags so the SPA shell can re-run them after DOM swaps.
- Heavy pixel work runs in **Web Workers** with transferable `ArrayBuffer`s and `{id, kind}` request/response messages.
- **Offline-first PWA** (`public/sw.js`, `public/manifest.webmanifest`) and **Capacitor Android** wrapper (`capacitor.config.json`, `webDir: dist`).
- **Bilingual (bn/en)** UI driven by `data-lang` on `<html>` and `data-i18n-*` attributes; a `th:langchange` CustomEvent broadcasts changes.

## Layers

**Routing / Pages (build time):**
- Purpose: Map URLs to a layout + one workspace component + the classic scripts that page needs.
- Location: `src/pages/`
- Contains: Thin `.astro` files; dynamic `src/pages/pdf/[tool].astro` and `src/pages/image/[tool].astro` use `getStaticPaths()` over `PDF_SUBTOOLS` / `IMAGE_SUBTOOLS`.
- Depends on: `src/layouts/ToolLayout.astro`, `src/components/*`, `src/data/tools.ts`
- Used by: Astro build → `dist/`

**Layout / Chrome (build time):**
- Purpose: Global document shell, navigation, dialogs, and slot regions swapped by the SPA router.
- Location: `src/layouts/ToolLayout.astro` (slots: default inside `<main id="workbench">` L285–L400, `after-workbench` in `#afterWorkbenchSlot` L405, `scripts` L925)
- Depends on: `src/data/tools.ts`, `src/components/ui/Icon.svelte`, `src/styles/studio-design.css`
- Used by: every page and `src/components/CategoryLanding.astro`

**Markup components (build time):**
- Purpose: Emit static HTML (Tailwind v4 utility classes) with ids the runtime controllers expect.
- Location: `src/components/`
- Depends on: `src/data/tools.ts`, `src/components/ui/Icon.svelte`
- Used by: pages, layout

**App shell runtime:**
- Purpose: Cross-page behaviour; SPA navigation; global state (lang, theme, favorites, recents, vault).
- Location: `public/js/shell.js` (loaded by layout as `/js/shell.js?v=72`)
- Depends on: DOM produced by `ToolLayout.astro`; controller globals for re-init
- Used by: all pages

**Tool controllers runtime:**
- Purpose: Wire UI events to engines; manage per-tool state in closure variables.
- Location: `public/js/app.js`, `pdf-tools.js`, `pdf-convert.js`, `image-tools.js`, `nid-scanner.js`, `document-scanner.js`, `vector-tools.js`, `tools.js`
- Depends on: engines, vendor libs, `window.TechHatToast`, `window.TechHatEnsureScript`
- Used by: pages via `<script is:inline defer>` in the `scripts` slot; shell's `runMountedToolInitializers()`

**Engines runtime:**
- Purpose: Deterministic, DOM-free algorithms.
- Location: `public/js/bijoy-engine.js`, `office.js`, `formats.js`, `document-scan-core.js`, `vector-trace-core.js`, `vector-export.js`
- Depends on: nothing (office/formats read `root.BijoyEngine` and `JSZip`)
- Used by: controllers, workers, `tests/*`

**Workers:**
- Location: `public/js/document-scan-worker.js`, `public/js/vector-trace-worker.js`
- Pattern: `importScripts(core)` then `self.onmessage` dispatch; errors returned as `{id, error}`.

**Edge / backend (optional):**
- Location: `cloudflare/worker.js` — not part of the static build; endpoint is user-configured in the vault sync dialog and stored in localStorage.

## Data Flow

### Primary Request Path (first load of a tool page)

1. Browser requests `/pdf/merge/` → static `dist/pdf/merge/index.html` built from `src/pages/pdf/[tool].astro` (`getStaticPaths` over `PDF_SUBTOOLS`).
2. Pre-paint inline script in `src/layouts/ToolLayout.astro` (L75–L112) sets `data-theme`, `data-lang`, and wipes caches/SW once when `thbc-cache-ver` ≠ `v57`.
3. Page-specific scripts from the `scripts` slot load deferred (e.g. `src/pages/pdf/[tool].astro`: `jszip`, `bijoy-engine.js`, `pdf-convert.js`, `pdf-tools.js`).
4. `public/js/shell.js` runs: hydrates nav state, favorites/recents, language (`applyGlobalLanguage`), registers `/sw.js` (skipped on localhost, `shell.js` L1530–L1538).
5. Controller self-initializes against its root (`#tool-pdf`) and reads `data-initial-tab` rendered by `PdfStudio.svelte`.

### SPA Navigation (subsequent clicks)

1. `shell.js` intercepts same-origin `<a>` clicks (L1480–L1494) → `navigateSPA()` (L1371).
2. Fast path `tryInPlaceStudioSwitch()` (L1300): if target pane already in DOM, `history.pushState` + `TechHatPDF.switchTab` / `TechHatImage.switchTab` / Bangla route re-config, no fetch.
3. Otherwise `fetchPageHtml()` (L1138, cached + hover/idle prefetched) → `DOMParser` → `ensureHeadStyles()`.
4. If `shell.js?v=` differs → full reload once (sessionStorage guard).
5. Replace `#workbench.innerHTML` and `#afterWorkbenchSlot.innerHTML` (L1435–L1441), re-apply language, favorites, filters.
6. Sequentially `ensureScriptLoaded()` each `script[src]` from the new page (L1456–L1463), then `runMountedToolInitializers()` (L1273) calls the matching `window.TechHat*` init.

### Document Scan Processing

1. User imports image/camera frame in `#img-pane-scan` (`DocumentScanner.svelte` markup).
2. `public/js/document-scanner.js` posts `{id, kind:'detect'|'detect-passport'|process, buffer, width, height, options}` to `document-scan-worker.js` (worker created ~L58; falls back to main-thread `TechHatDocumentCore` calls).
3. Worker runs `TechHatDocumentCore.detect/process` and returns quad points or a transferred RGBA buffer.
4. Controller renders to canvas, manages pages/layers, exports PDF via pdf-lib/JPG, optionally saves to IndexedDB vault (`shell.js` L1564+).

### Bijoy / Office Conversion

1. `public/js/app.js` binds `#tool-bijoy`; text input → `BijoyEngine` convert functions.
2. Files: DOCX/XLSX/PPTX → `OfficeConverter` (JSZip + DOMParser over OOXML); RTF/TXT → `TextFormats`; output Blob download.

### Raster-to-Vector

1. `public/js/vector-tools.js` lazy-loads `vector-trace-core.js` + `vector-export.js` (L340–L352) via `TechHatEnsureScript`.
2. Spawns `vector-trace-worker.js` (L359) → `TechHatVectorTrace.trace()`; result path model → `TechHatVectorExport` (SVG/EPS/AI).

**State Management:**
- Per-tool state: closure variables inside each controller IIFE (e.g. `pages`, `activeId`, `jobs` in `document-scanner.js`).
- Global UI state: `document.documentElement` attributes (`data-lang`, `data-theme`), `body[data-active-tool]`.
- Persistent: localStorage keys prefixed `thbc-` (`thbc-lang`, `thbc-theme`, `thbc-cache-ver`, favorites, recents, sync account/endpoint), `techhat-scan-crop-learning-v1`; IndexedDB document vault (`shell.js`); SW caches `shell-thbc-vNN` / `runtime-thbc-vNN`.
- Cross-module events: `th:langchange` CustomEvent on `window`.

## Key Abstractions

**UMD Engine Module:**
- Purpose: DOM-free algorithm usable in window, worker, and Node tests.
- Examples: `public/js/bijoy-engine.js`, `public/js/document-scan-core.js`, `public/js/vector-trace-core.js`, `public/js/vector-export.js`
- Pattern:
```js
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TechHatVectorTrace = api;
})(typeof self !== 'undefined' ? self : this, function () { 'use strict'; /* ... */ return api; });
```

**Idempotent Tool Controller:**
- Purpose: Bind behaviour to server-rendered markup; safe to call repeatedly after SPA swaps.
- Examples: `public/js/app.js` (`initBijoyApp`, exported as `window.TechHatBijoyInit`), `public/js/document-scanner.js` (`window.TechHatScannerInit`), `public/js/pdf-tools.js` (`window.TechHatPDF = { init, switchTab }`)
- Pattern:
```js
function initDocumentScanner() {
  var root = document.querySelector('#img-pane-scan');
  if (!root || root.dataset.dsBound === '1') return;
  root.dataset.dsBound = '1';
  /* bind events, closure state */
}
window.TechHatScannerInit = initDocumentScanner;
```

**Tool Catalog Entry:**
- Purpose: Single source for routes, titles (bn/en), SEO, icons, sub-tool tab ids.
- Examples: `CATEGORIES`, `ALL_TOOLS`, `PDF_SUBTOOLS`, `IMAGE_SUBTOOLS`, `TOOLS` in `src/data/tools.ts`
- Pattern: typed arrays (`StudioToolItem`, `PdfSubToolMeta { slug, tabId, seoTitle, seoDesc }`) consumed by layout, pages (`getStaticPaths`), and serialized to the client as `MOB_ROUTE_META` JSON (`ToolLayout.astro` L62–L67).

**Worker Job Protocol:**
- Purpose: Off-main-thread compute.
- Examples: `public/js/document-scan-worker.js`, `public/js/vector-trace-worker.js`
- Pattern: request `{id, kind?, buffer, width, height, options}` → response `{id, result}` | `{id, buffer, info}` (transferable) | `{id, error}`.

**Bilingual Text Node:**
- Purpose: Runtime language switch without re-render.
- Pattern: `<span data-i18n-bn="…" data-i18n-en="…">…</span>`; controllers use local `tr(bn, en)` + `isEn()` helpers reading `document.documentElement[data-lang]`.

## Entry Points

**Astro build:**
- Location: `astro.config.mjs`, `package.json` scripts (`dev`, `build`, `preview`)
- Triggers: `npm run build` (Vercel per `vercel.json`, Capacitor via `npm run cap:sync`)
- Responsibilities: Generate `dist/` static pages; Tailwind v4 via `@tailwindcss/vite`; dev crop-dataset middleware.

**Pages:**
- Location: `src/pages/index.astro` (home), `src/pages/{bangla,pdf,image,dates,business,utilities}/index.astro` (category hubs), `src/pages/pdf/[tool].astro`, `src/pages/image/[tool].astro`, `src/pages/bangla/*.astro`, `src/pages/calendar*.astro`, `src/pages/*-calculator.astro`, `src/pages/invoice.astro`, `src/pages/business/invoice-maker.astro`
- Triggers: HTTP navigation or shell SPA fetch.

**Runtime shell:**
- Location: `public/js/shell.js`
- Triggers: Every page load (`ToolLayout.astro` L924).

**Service worker:**
- Location: `public/sw.js` (`VERSION = 'thbc-v76'`)
- Triggers: Registered by `shell.js` L1536 and `app.js` L1186 on non-localhost HTTP(S).

**Android app:**
- Location: `capacitor.config.json` (`appId: com.techhat.studio`, `webDir: dist`), `android/`
- Triggers: `npm run cap:sync`, `npm run apk:debug`.

**Cloud sync API (optional, separate deploy):**
- Location: `cloudflare/worker.js` via `cloudflare/wrangler.toml`
- Triggers: `fetch` from `shell.js` L1715–L1924 when user configures endpoint.

**Tests:**
- Location: `tests/*.test.js|cjs`, run by `npm test`.

## Architectural Constraints

- **Threading:** Single-threaded UI; CPU-heavy scan/trace in dedicated Web Workers; pdf.js uses its own worker (`public/vendor/pdf.worker.min.js`, configured in `pdf-tools.js` ~L111).
- **Global state:** All runtime modules communicate through `window.*` globals (`BijoyEngine`, `OfficeConverter`, `TextFormats`, `TechHatToast`, `TechHatSetLang`, `TechHatNavigate`, `TechHatEnsureScript`, `TechHatOpenSearch`, `TechHatPDF`, `TechHatPDFConvert`, `TechHatImage`, `TechHatImageUtils`, `TechHatScanGeometry`, `TechHatNidScanner`, `TechHatScannerInit`, `TechHatScannerSetMode`, `TechHatVector`, `TechHatTools`, `TechHatVault`, `TechHatDocumentCore`, `TechHatVectorTrace`, `TechHatVectorExport`). Script load order matters (engines before controllers).
- **No hydration:** Svelte client logic does not execute; never put runtime behaviour in `.svelte` `<script>` blocks.
- **Circular imports:** None in `src/` (`menu.ts` → `tools.ts` one-way). Runtime coupling: `document-scanner.js` requires `TechHatScanGeometry` from `image-tools.js` and `TechHatDocumentCore`; `nid-scanner.js` optionally uses `TechHatImageUtils`.
- **Classic scripts only:** `public/js` files are non-module scripts (must run from `file://` and in workers); no bundling, no ES imports.
- **Cache-busting by hand:** query-string versions (`?v=70`, `?v=72`, `?v=76`, worker `?v=43`), SW `VERSION`, and layout `thbc-cache-ver` must be bumped manually.
- **DOM id contract:** Renaming an id in a `.svelte` file silently breaks the controller in `public/js` that queries it.
- **SPA swap scope:** Only `#workbench` and `#afterWorkbenchSlot` are replaced; anything outside (sidebar, dialogs) persists across navigation.

## Anti-Patterns

### Runtime logic inside Svelte components

**What happens:** `src/components/DocumentScanner.svelte` (~L180–L203) registers `th:langchange` listeners and calls `window.TechHatScannerInit()` from component lifecycle code, but no page uses a `client:*` directive.
**Why it's wrong:** The code never runs in the browser; it misleads maintainers into thinking Svelte owns behaviour.
**Do this instead:** Put behaviour in the matching controller (`public/js/document-scanner.js`) and listen for `th:langchange` there, as `public/js/shell.js` L176 dispatches it.

### Duplicated tiny helpers per file

**What happens:** `$`, `$$`, `isEn`, `tr`, `toBn`, `fmtSize` are re-declared in `shell.js`, `pdf-tools.js`, `image-tools.js`, `nid-scanner.js`, `vector-tools.js`, `document-scanner.js`.
**Why it's wrong:** Divergent behaviour (e.g. `document-scanner.js` reads `root.dataset.lang` instead of `<html data-lang>`).
**Do this instead:** Reuse globals already exposed (`window.TechHatImageUtils.fmtSize`, as `nid-scanner.js` does) or add shared helpers to `shell.js` on a `window.TechHat*` namespace.

### Version-string drift

**What happens:** `document-scan-worker.js` imports `document-scan-core.js?v=43` while pages load `?v=70`; SW is `thbc-v76`, layout cache key `v57`, shell `?v=72`.
**Why it's wrong:** Stale worker code can be served from cache while the main thread uses newer core.
**Do this instead:** Bump all references together when changing an engine; keep the `public/sw.js` `ASSETS` list in sync with new files.

### Duplicate routes

**What happens:** `src/pages/age-calculator.astro` and `src/pages/calendar/age-calculator.astro` (also date-calculator, invoice vs `business/invoice-maker`) are byte-identical.
**Why it's wrong:** Two places to edit; alias handling spread across `ToolLayout.astro` `ALIAS_ROUTE_TO_TOOL_ID` and `tools.ts` `aliases`.
**Do this instead:** Keep one canonical page and register extra paths in `aliases` in `src/data/tools.ts`.

## Error Handling

**Strategy:** Defensive, fail-soft UI; no global error reporter.

**Patterns:**
- `try { … } catch (e) {}` around storage, SW and feature detection (`ToolLayout.astro` L76–L111, `shell.js` storage access).
- User-visible failures via `window.TechHatToast(msg)` (`shell.js` L38–L46) or per-tool status lines (e.g. `#dsStatus`).
- Workers catch and reply `{id, error: message}`; controllers fall back to main-thread compute.
- SPA navigation failures fall back to full `location.href = targetPath` (`shell.js` L1417–L1471).
- Script loader resolves on error (`ensureScriptLoaded`, `shell.js` L1073) — missing scripts surface as missing globals, guarded by `if (window.X)` checks.

## Cross-Cutting Concerns

**Logging:** None structured; occasional `console` use only. No telemetry.
**Validation:** Client-side file-type checks in controllers; dev crop endpoint validates host/origin, quad points, MIME, and 40 MB limit (`astro.config.mjs`); Cloudflare worker requires `X-Sync-Account` header.
**Authentication:** None. Cloud sync identifies users by a free-text account id (`cloudflare/worker.js`); CORS `*`.
**i18n:** `data-i18n-bn`/`data-i18n-en` attributes + `applyGlobalLanguage()` in `shell.js` L142; scanner strings in `src/components/scanner/i18n.js`; Bangla digits via local `toBn()`.
**Theming:** `data-theme` on `<html>`, Tailwind `dark:` variants, custom tokens in `src/styles/studio-design.css`.
**Offline:** `public/sw.js` precache + network-first; SW intentionally unregistered on localhost.

---

*Architecture analysis: 2026-11-09*
