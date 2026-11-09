---
last_mapped_commit: 95728e0384f6255246213a1e57dfda1d480ff996
last_mapped_at: 2026-11-09
---
# Coding Conventions

**Analysis Date:** 2026-11-09

The codebase has two coding styles that follow different rules:

1. **Astro + Svelte 5 + TypeScript shell** (`src/`): markup, layout, tool catalogue data and Tailwind v4 styling.
2. **Vanilla ES5-style JavaScript engines and controllers** (`public/js/`): loaded as classic `<script is:inline>` tags. Bundlers and transpilers never touch them. This is where all conversion, PDF, image, scanner and vector logic lives.

Pick the style based on the folder you are editing. Do not mix them: no `import`, `let`/`const`-only syntax or TS inside `public/js/` engines that must run from `file://` and in Workers.

## Naming Patterns

**Files:**
- Svelte components use PascalCase: `src/components/BijoyWorkspace.svelte`, `src/components/DocumentScanner.svelte`, `src/components/ui/Icon.svelte`.
- Astro pages use kebab-case and map to the URL: `src/pages/bangla/bijoy-to-unicode.astro`, `src/pages/calendar/age-calculator.astro`. Dynamic sub-tools use `[tool].astro` (`src/pages/pdf/[tool].astro`, `src/pages/image/[tool].astro`).
- Layouts use PascalCase: `src/layouts/ToolLayout.astro`.
- Data modules are lowercase TS: `src/data/tools.ts`, `src/data/menu.ts`, `src/data/lucide-icons.ts`.
- Engines and controllers in `public/js/` are kebab-case: `bijoy-engine.js`, `document-scan-core.js`, `vector-trace-core.js`. Pure, DOM-free modules end in `-core.js`. Web Worker wrappers end in `-worker.js` (`document-scan-worker.js`, `vector-trace-worker.js`).
- Tests are `tests/<module>.test.js` (older suites) or `tests/<module>.test.cjs` (newer suites). Use `.test.cjs` for new suites.

**Functions:**
- camelCase everywhere: `bijoyToUnicode`, `unicodeToBijoySegments`, `detectPassportSixPts`, `applyGlobalLanguage`, `initBijoyApp`.
- Page controllers expose one `init*` function and also store it on `window` so the SPA shell can re-run it: `window.TechHatBijoyInit = initBijoyApp;` (`public/js/app.js`), `window.TechHatScannerInit = initDocumentScanner;` (`public/js/document-scanner.js`).
- DOM helpers are the one-letter aliases `$` / `$$`, defined locally in each IIFE:
  ```js
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  ```

**Variables:**
- Constants are UPPER_SNAKE: `HASANTA`, `ZWJ`, `CONSONANT_LIST` (`public/js/bijoy-engine.js`), `LANG_KEY`, `WORKSPACE_SELECTOR_I18N` (`public/js/shell.js`), `VERSION`, `ASSETS` (`public/sw.js`).
- Write Unicode code points as `\uXXXX` escapes and add a trailing comment showing the glyph: `var RRA = '\u09DC'; // ড়`.
- localStorage keys use the `thbc-` prefix: `thbc-settings`, `thbc-lang`, `thbc-scan-lang`, `thbc-theme`, `thbc-cache-ver`.
- CustomEvents use the `th:` prefix: `th:langchange` (`public/js/shell.js:176`).
- Globals use the `TechHat*` prefix (`TechHatDocumentCore`, `TechHatVectorTrace`, `TechHatToast`, `TechHatScanGeometry`). Two older exceptions exist: `BijoyEngine`, `OfficeConverter`, `TextFormats`.

**Types (TS in `src/`):**
- PascalCase interfaces and union types: `CategoryId`, `ToolColor`, `StudioToolItem`, `PdfSubToolMeta` (`src/data/tools.ts`).
- Bilingual fields come in pairs: Bangla is the bare name and English adds an `En` suffix: `title` / `titleEn`, `desc` / `descEn`, `badge` / `badgeEn`. Some `shell.js` route metadata uses `titleBn` / `titleEn` instead. Use the bare/`En` form in TS data.

## Code Style

**Formatting:**
- No formatter is configured. There is no `.prettierrc`, `.editorconfig` or `biome.json`.
- `src/` and the readable engines use 2-space indents, single quotes and semicolons.
- `public/js/document-scan-core.js`, `tests/document-scan.test.cjs` and `tests/document-layers.test.cjs` use a dense, minified-looking style: one-space indent, no spaces around operators, many statements per line. Keep the existing style when editing those files. Use the readable 2-space style for new files.
- Line endings are mixed (CRLF in `public/sw.js` and `document-scan*.cjs`, LF elsewhere). Keep whatever the file already uses.

**Linting:**
- No ESLint or TS lint is configured. There is also no root `tsconfig.json`, so Astro's defaults apply.
- All `public/js/` files start with `'use strict';` inside their IIFE or factory. Keep it.
- Engines stay ES5-compatible (`var`, `function`, no arrow functions) because they run as classic scripts, in Web Workers and in Node. `public/js/bijoy-engine.js` and `public/sw.js` follow this strictly.

## Import Organization

**Astro/Svelte (`src/`):**
1. Framework and layout imports (`import ToolLayout from '../../layouts/ToolLayout.astro';`)
2. Local components (`import Icon from './ui/Icon.svelte';`)
3. Data and types (`import { getToolIconPalette, type StudioTool } from '../data/tools';`)

Use relative paths. No path aliases are configured.

**Vanilla engines (`public/js/`):**
- These files never use `import`. Dependencies arrive as globals on `window`/`self`, loaded in order by `<script is:inline ... defer>` tags in the page's `scripts` slot:
  ```astro
  <Fragment slot="scripts">
    <script is:inline src="/vendor/jszip.min.js" defer></script>
    <script is:inline src="/js/bijoy-engine.js?v=70" defer></script>
    <script is:inline src="/js/office.js?v=70" defer></script>
    <script is:inline src="/js/formats.js?v=70" defer></script>
    <script is:inline src="/js/app.js?v=70" defer></script>
  </Fragment>
  ```
  (`src/pages/bangla/bijoy-to-unicode.astro`)
- Load dependencies before the scripts that use them: vendor → engine/core → controller.
- Controllers check for their globals and bail out if any is missing: `if(!root||root.dataset.dsBound==='1'||!window.TechHatScanGeometry||!window.TechHatDocumentCore)return;` (`public/js/document-scanner.js`).

## Module Design

**UMD factory (required for any testable engine):**
```js
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BijoyEngine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // ... pure logic ...
  return { bijoyToUnicode: bijoyToUnicode, unicodeToBijoy: unicodeToBijoy /* ... */ };
});
```
Used by `public/js/bijoy-engine.js`, `document-scan-core.js`, `vector-trace-core.js` and `vector-export.js`. `office.js` and `formats.js` use a variant that sets both `root.X` and `module.exports` and falls back to `globalThis`.

- End every UMD module with one explicit object literal that lists its public API. The tests import that object directly.
- Private helpers that tests need get a leading underscore: `_convertPieces` (`public/js/office.js`).
- Pure cores (`*-core.js`) never touch the DOM. They take `Uint8ClampedArray` RGBA buffers plus `w`, `h` and an options object, and return new buffers or `{ data, info }`. That keeps them usable from Node tests and Workers.

**Page controllers (not testable in Node):**
- Wrap each in an IIFE (`(function () { 'use strict'; ... })();`) and make it idempotent with a `data-*Bound` flag:
  ```js
  if (bijoyRootEl.dataset.bijoyBound === '1') { if (bijoyRootEl._syncRoute) bijoyRootEl._syncRoute(); return; }
  bijoyRootEl.dataset.bijoyBound = '1';
  ```
  (`public/js/app.js:10-14`)
- Auto-init at the bottom only when the root pane exists: `if ($('#img-pane-vector')) { init(); }` (`public/js/vector-tools.js`).

**Barrel files:** Not used.

## Svelte Components

- Use Svelte 5 runes only: `$props()`, `$derived`, `$effect`. The codebase contains no `export let` or `onMount`.
  ```svelte
  <script lang="ts">
    interface Props { active?: boolean; mode?: 'scan' | 'passport'; }
    let { active = false, mode = 'scan' }: Props = $props();
  </script>
  ```
  (`src/components/DocumentScanner.svelte`)
- Components are mostly static markup with stable `id`s and `data-*` hooks. The `public/js/` controllers bind behaviour at runtime (`#img-pane-scan`, `#tool-bijoy`, `data-tool-card`, `data-fav-btn`). When you rename an `id` or `data-*` attribute in a `.svelte` file, grep `public/js/` for the old name and update it there too.
- Icons use `src/components/ui/Icon.svelte` with Lucide names (`lucide:move`), backed by `@iconify-json/lucide` and the map in `src/data/lucide-icons.ts`.

## Bilingual UI (Bengali-first)

- Bangla is the default language: `<html lang="bn" data-lang="bn">` (`src/layouts/ToolLayout.astro:70`). The visible default text is always Bangla. `/image/scan` is the only route that defaults to English (`ToolLayout.astro:84`).
- Every translatable element carries both attributes, and its rendered text content is the Bangla value:
  ```svelte
  <h3 data-i18n-bn={tool.title} data-i18n-en={tool.titleEn}>{tool.title}</h3>
  <button title="পছন্দের তালিকায় রাখুন" aria-label="পছন্দের তালিকায় রাখুন"
          data-i18n-title-bn="পছন্দের তালিকায় রাখুন" data-i18n-title-en="Save to favorites">
  ```
  (`src/components/ToolCard.svelte`)
- Supported attribute pairs, applied by `applyGlobalLanguage()` in `public/js/shell.js:142-180`:
  - `data-i18n-bn` / `data-i18n-en` replace `textContent`. Do not put these on elements with child icons/SVG, because the swap would wipe the children. Wrap the text in a `<span>` and put the attributes on the span.
  - `data-i18n-placeholder-bn` / `-en` set `placeholder`.
  - `data-i18n-title-bn` / `-en` set `title` and `aria-label`.
- Elements without data attributes (legacy markup) get translated through the selector table `WORKSPACE_SELECTOR_I18N` in `public/js/shell.js:68`, with entries of the form `[selector, bnText, enText, bnTip, enTip]`. Prefer data attributes for new UI and only add table entries for markup you cannot annotate.
- Runtime strings in controllers branch on language: `isEn() ? 'English…' : 'বাংলা…'`. Format numbers with `fmtNum(n)`, which converts digits to `০-৯` in Bangla mode (`public/js/app.js:20-22`, `public/js/shell.js:64`).
- Listen for `th:langchange` on `window` to re-render dynamic text when the user switches language.
- The scanner Svelte UI keeps its strings in a dictionary module, `src/components/scanner/i18n.js` (`I18N.bn` / `I18N.en`, plus `fmtNum(n, lang)`). Put new scanner strings there in both languages.
- Write user-facing Bangla in standard Unicode Bangla. Keep product and technical terms (PDF, NID, Word, ZIP) in Latin script.

## Styling (Tailwind v4)

- Tailwind v4 runs through `@tailwindcss/vite` (`astro.config.mjs`). There is no `tailwind.config.*`. Tokens live in CSS under `@theme` in `src/styles/studio-design.css`.
- Use utility classes inline in markup. Use the custom `studio-*` tokens for dark surfaces: `bg-studio-sidebar`, `border-studio-border`, `text-studio-text`, `text-studio-muted`, `bg-studio-panel`, `bg-studio-surface`.
- Dark mode uses the custom variant `@custom-variant dark (&:is([data-theme="dark"], [data-theme="dark"] *));`. Write `dark:` utilities. Do not rely on `prefers-color-scheme` directly.
- BEM-ish `th-` hook classes sit alongside utilities for JS and CSS targeting: `th-tool-card`, `th-tool-card__title`, `th-tool-card__fav`. Add a `th-block__element` class when JS or the component CSS layer needs to target an element.
- Shared component styles go in `@layer components` in `src/styles/studio-design.css`. Legacy tool CSS lives in `public/css/`.

## Cache-Busting Convention (mandatory on every `public/` asset change)

Static JS is served from `public/` without hashing, so every change needs a manual version bump. When you edit a file in `public/js/`:

1. Bump that script's `?v=NN` query in every page that loads it. Find them with `grep -rn "<file>.js?v=" src/`. The current values are not uniform: most files are at `?v=70`, `shell.js?v=72` (`src/layouts/ToolLayout.astro:924`), `nid-scanner.js?v=71`, and `image-tools.js?v=76` / `vector-tools.js?v=76` (`src/pages/image/[tool].astro`).
2. Bump `VERSION = 'thbc-vNN'` in `public/sw.js:4` (currently `thbc-v76`) so the service worker drops the old `shell-`/`runtime-` caches on activate.
3. If you add a new `public/js/*.js` file, also add it to the `ASSETS` array in `public/sw.js` so it is available offline.
4. `ToolLayout.astro:90-92` has a separate hard reset (`thbc-cache-ver`, currently `'v57'`). It unregisters every service worker and clears every cache. Bump it only when a full client reset is needed.

## Error Handling

- **Storage and other "best-effort" browser APIs:** wrap in `try/catch` and silently fall back to a default:
  ```js
  get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  ```
  (`public/js/app.js:26-29`)
- **User-facing failures:** show a toast instead of throwing. `toast(msg, ms)` is local to `public/js/app.js:89`, and the global `window.TechHatToast` comes from `public/js/shell.js:46`. Messages are in Bangla by default, or bilingual through `isEn()`. Guard clauses use `return toast('…')`.
- **Pure cores:** do not throw on degenerate input. Return a safe "no-op" result instead. `core.detect()` returns `{pts: fullQuad(), auto: false, confidence: 0}` for uniform images, and `core.straighten()` returns the input buffer unchanged with `info.straightened === false`. Tests depend on this behaviour.
- **Dev server middleware** (`astro.config.mjs`): `throw new Error('…')` inside a single `try`, then map to a JSON `{ ok: false, error }` with status 400. Reject non-localhost requests with 403.
- `console.*` is rare: 1 in `app.js`, 3 in `document-scanner.js` and 1 in `vector-tools.js`. Do not add logging to shipped code. Report problems through toasts.

## Logging

**Framework:** None (plain `console`, used sparingly).

**Patterns:**
- Production UI reports status through toasts and inline status text, not through the console.
- Tests log to stdout (see `TESTING.md`).

## Comments

**When to Comment:**
- Start every `public/js/` file with a `/*! … */` (or `/* … */`) banner that names the module, its features or sub-tools, and the runtimes it supports (see `public/js/bijoy-engine.js:1-14`, `public/js/pdf-tools.js`).
- Split long controllers into sections with dashed comment rules: `/* ------------------------------------------------------------------ storage */` (`public/js/app.js`).
- Comment non-obvious Unicode/glyph logic inline, with the Bangla glyph shown.
- Explain the strategy behind service-worker caching rules in a comment (`// stale-while-revalidate: …`, `// page navigations: network first …` in `public/sw.js`).

**JSDoc/TSDoc:**
- Not used. Document type shapes in a banner comment instead, e.g. the path model at the top of `public/js/vector-export.js`.

## Function Design

**Size:** Controllers are very large single IIFEs (`public/js/nid-scanner.js` 5.4k lines, `pdf-tools.js` 3.9k). Put new algorithmic logic in a pure `*-core.js` UMD module that Node can test. Keep controllers to DOM wiring only.

**Parameters:** Core functions take `(data, w, h, opts)`, where `opts` is a plain object with defaults applied inside (`{filter:'magic_plus', shadow:true, text:true, sharpness:20}`). Geometry uses normalized `{x, y}` points in 0–1.

**Return Values:** Return new buffers or result objects (`{ data, info }`, `{ pts, auto, confidence }`, `{ paths, stats }`). Mutating functions are named for it (`applyErases(data, w, h, layers)` mutates `data` in place).

---

*Convention analysis: 2026-11-09*
