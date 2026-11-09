---
last_mapped_commit: 95728e0384f6255246213a1e57dfda1d480ff996
last_mapped_at: 2026-11-09
---
# Codebase Structure

**Analysis Date:** 2026-11-09

## Directory Layout

```
Bijoy Converter/                    # repo root (npm package "techhat-utility-hub")
├── astro.config.mjs                # Astro config: svelte + astro-icon + Tailwind v4; dev crop-dataset middleware
├── package.json                    # scripts: dev/build/preview/cap:sync/apk:debug/test
├── capacitor.config.json           # Capacitor Android wrapper (webDir: dist)
├── vercel.json                     # Vercel static deploy (dist, cleanUrls)
├── README.md                       # Bangla README (engine overview, tests)
├── CROP_DATASET.md                 # Crop-annotation dataset workflow docs
├── src/                            # Build-time source (Astro + Svelte, SSR only)
│   ├── pages/                      # File-based routes
│   │   ├── index.astro             # Home
│   │   ├── bangla/                 # Bijoy⇄Unicode, office converter, voice typing + hub
│   │   ├── pdf/                    # index.astro hub + [tool].astro (PDF_SUBTOOLS)
│   │   ├── image/                  # index.astro hub + [tool].astro (IMAGE_SUBTOOLS)
│   │   ├── calendar/               # alias routes: age-calculator, date-calculator
│   │   ├── business/               # hub + invoice-maker (alias)
│   │   ├── dates/ utilities/       # category hubs
│   │   └── calendar.astro, age-calculator.astro, date-calculator.astro, invoice.astro
│   ├── layouts/ToolLayout.astro    # The only layout: chrome, slots, dialogs, shell.js
│   ├── components/                 # Svelte markup components (no client hydration)
│   │   ├── ui/Icon.svelte          # Inline Lucide icon
│   │   └── scanner/i18n.js         # Scanner string table
│   ├── data/                       # Typed catalog & icon data
│   ├── icons/                      # Empty (.gitkeep) — astro-icon local dir
│   └── styles/studio-design.css    # Global Tailwind v4 theme + custom CSS
├── public/                         # Copied verbatim to dist/ — ALL runtime JS lives here
│   ├── js/                         # Classic-script engines, controllers, workers, shell
│   ├── vendor/                     # jszip, pdf-lib, pdf.js (+ worker) minified
│   ├── fonts/                      # Bangla TTFs (Kalpurush, Nikosh, SolaimanLipi, …)
│   ├── icons/                      # PWA icons 48/180/192/512
│   ├── SutonnyMJ-Regular.ttf, SutonnyMJ-Italic.ttf   # Bijoy fonts
│   ├── sw.js                       # Service worker
│   └── manifest.webmanifest        # PWA manifest
├── tests/                          # Node test scripts for engines (own package.json)
├── cloudflare/                     # Optional vault-sync Worker (D1 + R2), deployed separately
├── android/                        # Capacitor Android Gradle project
├── promo-video/                    # Separate Remotion promo-video project (own package.json)
├── local-data/crop-dataset/        # Dev-only crop annotations (gitignored)
├── .planning/codebase/             # GSD codebase maps
├── .agents/skills/, .taste-skill/  # Agent skills (gitignored)
├── dist/, .astro/, node_modules/   # Generated (gitignored)
```

## Directory Purposes

**`src/pages/`:**
- Purpose: One file per URL; each composes `ToolLayout` + one workspace component + a `scripts` slot listing required `public/js` files.
- Contains: `.astro` only.
- Key files: `src/pages/pdf/[tool].astro`, `src/pages/image/[tool].astro` (dynamic via `getStaticPaths`), `src/pages/bangla/bijoy-to-unicode.astro`, `src/pages/index.astro`

**`src/layouts/`:**
- Purpose: Global HTML shell.
- Key files: `src/layouts/ToolLayout.astro` (props: `toolId`, `title`, `description`, `activeCategory`, `activeBadgeText`; slots: default → `#workbench`, `after-workbench` → `#afterWorkbenchSlot`, `scripts`)

**`src/components/`:**
- Purpose: Static markup for each studio/tool, with stable ids the runtime JS binds to.
- Contains: PascalCase `.svelte` files; one `.astro` wrapper (`CategoryLanding.astro`).
- Key files: `BijoyWorkspace.svelte` (`#tool-bijoy`), `PdfStudio.svelte` (`#tool-pdf`, `#pdf-pane-*`), `ImageStudio.svelte` (`#tool-image`, `#img-pane-*`), `DocumentScanner.svelte` (`#img-pane-scan`), `NidCardScanner.svelte` (`#img-pane-combine`), `VectorStudio.svelte` (`#img-pane-vector`), `HomeWorkspace.svelte`, `CalendarTool.svelte`, `AgeTool.svelte`, `DateCalcTool.svelte`, `DateModals.svelte`, `InvoiceTool.svelte`, `ToolCard.svelte`, `CategoryLandingView.svelte`

**`src/data/`:**
- Purpose: Build-time data shared by layout/pages/components.
- Key files: `src/data/tools.ts` (`CATEGORIES`, `PDF_SUBTOOLS`, `IMAGE_SUBTOOLS`, `ALL_TOOLS`, `TOOLS`, `getToolMeta`, `getCategoryMeta`, `getToolsByCategory`, `getToolIconPalette`), `src/data/lucide-icons.ts` (`LUCIDE_ICONS`), `src/data/menu.ts` (menu tree derived from `tools.ts`; currently not imported anywhere)

**`public/js/`:**
- Purpose: All browser behaviour. Three kinds of file:
  - **Engines (UMD, pure):** `bijoy-engine.js`, `office.js`, `formats.js`, `document-scan-core.js`, `vector-trace-core.js`, `vector-export.js`
  - **Controllers (IIFE, DOM):** `shell.js`, `app.js`, `pdf-tools.js`, `pdf-convert.js`, `image-tools.js`, `nid-scanner.js`, `document-scanner.js`, `vector-tools.js`, `tools.js`
  - **Workers:** `document-scan-worker.js`, `vector-trace-worker.js`
- Key files: `public/js/shell.js` (SPA router + globals), `public/js/bijoy-engine.js`

**`public/vendor/`:**
- Purpose: Third-party browser libs loaded as classic scripts (no npm bundling).
- Key files: `jszip.min.js`, `pdf-lib.min.js`, `pdf.min.js`, `pdf.worker.min.js`

**`tests/`:**
- Purpose: Plain Node assertion scripts that `require('../public/js/<engine>.js')`.
- Key files: `engine.test.js`, `office.test.js` (uses `@xmldom/xmldom`, `jszip` from `tests/package.json`), `document-scan.test.cjs`, `document-layers.test.cjs`, `vector.test.cjs`, `vector-export.test.cjs`

**`cloudflare/`:**
- Purpose: Optional document-vault sync backend.
- Key files: `worker.js` (`/api/docs` routes), `schema.sql` (D1 `documents` table), `wrangler.toml`

**`android/`:**
- Purpose: Capacitor-generated Android project; web assets synced from `dist/` into `android/app/src/main/assets`.
- Key files: `android/app/src/main/AndroidManifest.xml`, `android/app/build.gradle`, `android/variables.gradle`

**`promo-video/`:**
- Purpose: Independent Remotion video project (TSX) for marketing; not part of the app build.
- Key files: `promo-video/src/TechHatPromo.tsx`, `promo-video/src/Root.tsx`, `promo-video/remotion.config.ts`

## Key File Locations

**Entry Points:**
- `src/pages/index.astro`: Home route
- `src/layouts/ToolLayout.astro`: Every page's document shell; loads `/js/shell.js?v=72`
- `public/js/shell.js`: Runtime entry on every page
- `public/sw.js`: Service worker
- `capacitor.config.json`: Android app entry config

**Configuration:**
- `astro.config.mjs`: Integrations, Vite plugins, static output
- `package.json`: Scripts, deps, `engines.node >=22.x`
- `vercel.json`: Hosting
- `capacitor.config.json`: Android
- `cloudflare/wrangler.toml`: Worker bindings
- `public/manifest.webmanifest`: PWA
- `src/styles/studio-design.css`: Tailwind v4 theme (`studio-*` color tokens)

**Core Logic:**
- `public/js/bijoy-engine.js`: Bijoy ⇄ Unicode
- `public/js/office.js`, `public/js/formats.js`: Office / RTF / TXT conversion
- `public/js/pdf-tools.js`, `public/js/pdf-convert.js`: PDF Studio
- `public/js/image-tools.js`: Image Studio + `TechHatScanGeometry`
- `public/js/document-scan-core.js`, `public/js/document-scanner.js`: Document/passport scanner
- `public/js/nid-scanner.js`: NID card A4 composer
- `public/js/vector-trace-core.js`, `public/js/vector-export.js`, `public/js/vector-tools.js`: Raster-to-vector
- `public/js/tools.js`: Calendar, age, date diff, invoice
- `src/data/tools.ts`: Route/tool catalog

**Testing:**
- `tests/*.test.js`, `tests/*.test.cjs`; run all with `npm test`

## Naming Conventions

**Files:**
- Svelte components: PascalCase + domain suffix (`PdfStudio.svelte`, `NidCardScanner.svelte`, `AgeTool.svelte`, `HomeWorkspace.svelte`)
- Astro pages: kebab-case matching the URL (`bijoy-to-unicode.astro`, `office-converter.astro`); dynamic routes `[tool].astro`
- Runtime JS: kebab-case, suffix by role — `*-engine.js` / `*-core.js` (pure), `*-tools.js` / `*-scanner.js` (controller), `*-worker.js` (worker), `*-export.js` (serializer)
- Tests: `<module>.test.js` (CommonJS w/o `.cjs` for older suites) or `<module>.test.cjs` (newer suites) — use `.test.cjs` for new tests
- Data: camelCase/kebab `.ts` (`tools.ts`, `lucide-icons.ts`)

**Directories:**
- Route folders = category ids from `CategoryId` in `src/data/tools.ts` (`bangla`, `pdf`, `image`, `dates`, `business`, `utilities`)
- Component sub-folders by feature (`components/scanner/`, `components/ui/`)

**Runtime globals & DOM:**
- Globals: `window.TechHat<Feature>` (e.g. `TechHatPDF`, `TechHatVector`); engines `BijoyEngine`, `OfficeConverter`, `TextFormats`
- Tool roots: `#tool-<toolId>`; panes `#pdf-pane-<tabId>`, `#img-pane-<tabId>`; element id prefixes per tool (`ds*` scanner, `vs*` vector)
- Storage keys: `thbc-*` in localStorage

## Where to Add New Code

**New PDF or Image sub-tool:**
- Catalog entry: add to `PDF_SUBTOOLS` / `IMAGE_SUBTOOLS` and `ALL_TOOLS` in `src/data/tools.ts` (route is generated by `src/pages/pdf/[tool].astro` / `src/pages/image/[tool].astro`)
- Markup: new pane `<section id="pdf-pane-<tabId>">` in `src/components/PdfStudio.svelte` (or `#img-pane-<tabId>` in `src/components/ImageStudio.svelte`; large panes get their own component like `VectorStudio.svelte`)
- Behaviour: extend `public/js/pdf-tools.js` / `public/js/image-tools.js`, or create `public/js/<feature>-tools.js` and add a conditional `<script is:inline src="/js/<feature>-tools.js?v=N" defer>` in the `[tool].astro` scripts slot
- SPA fast path: add the route to `PDF_MAP` / `IMG_MAP` in `tryInPlaceStudioSwitch()` (`public/js/shell.js` ~L1300) and, if needed, an init call in `runMountedToolInitializers()` (~L1273)
- Offline: append new files to `ASSETS` in `public/sw.js` and bump `VERSION`
- Tests: `tests/<feature>.test.cjs`, add to `npm test` in `package.json`

**New standalone tool / category page:**
- Page: `src/pages/<category>/<tool-slug>.astro` using `<ToolLayout toolId=… activeCategory=…>`
- Component: `src/components/<Name>Tool.svelte` (markup only, root `id="tool-<id>"`)
- Controller: `public/js/<name>.js` exposing an idempotent `window.TechHat<Name>.init`
- Catalog: `ALL_TOOLS` (+ `CATEGORIES` for a new category) in `src/data/tools.ts`

**New pure algorithm (engine):**
- Implementation: `public/js/<name>-core.js` using the UMD wrapper (see `public/js/vector-trace-core.js` L1–L6)
- Worker (if CPU heavy): `public/js/<name>-worker.js` with `importScripts('/js/<name>-core.js?v=N')`
- Tests: `tests/<name>.test.cjs` requiring `../public/js/<name>-core.js`

**Shared UI primitives:**
- Svelte: `src/components/ui/`
- Icons: add SVG body to `src/data/lucide-icons.ts`, render with `src/components/ui/Icon.svelte`

**Utilities:**
- Build-time helpers/data: `src/data/`
- Runtime cross-tool helpers: expose on a `window.TechHat*` namespace in `public/js/shell.js` (pattern: `window.TechHatToast`, `window.TechHatEnsureScript`)

**Styles:**
- Prefer Tailwind utilities in components; global tokens/overrides in `src/styles/studio-design.css`

## Special Directories

**`dist/`:**
- Purpose: Astro build output; Vercel `outputDirectory` and Capacitor `webDir`
- Generated: Yes
- Committed: No

**`.astro/`:**
- Purpose: Astro type/cache artifacts
- Generated: Yes
- Committed: No

**`public/`:**
- Purpose: Served as-is; hand-written runtime JS is source code here (not generated)
- Generated: No
- Committed: Yes

**`local-data/crop-dataset/`:**
- Purpose: Training/testing crop annotations written by the dev middleware in `astro.config.mjs`
- Generated: Yes (dev only)
- Committed: No

**`tests/node_modules/`:**
- Purpose: Test-only deps (`jszip`, `@xmldom/xmldom`)
- Generated: Yes (`cd tests && npm install`)
- Committed: No

**`android/app/build/`, `android/build/`:**
- Purpose: Gradle outputs
- Generated: Yes
- Committed: Per `android/.gitignore`

**`promo-video/`:**
- Purpose: Separate Remotion project with its own `node_modules/` and `out/`
- Generated: Partially (`out/`, `node_modules/`)
- Committed: Source yes

**`.agents/`, `.taste-skill/`:**
- Purpose: AI agent skills
- Generated: No
- Committed: No (gitignored)

---

*Structure analysis: 2026-11-09*
