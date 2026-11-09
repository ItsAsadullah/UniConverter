---
last_mapped_commit: 95728e0384f6255246213a1e57dfda1d480ff996
last_mapped_at: 2026-11-09
---
# Technology Stack

**Analysis Date:** 2026-11-09

## Languages

**Primary:**
- JavaScript (ES5-style IIFEs plus some ES2017+ async/await, no transpile step): the client-side tool engines in `public/js/*.js`. They are served as-is, not bundled by Vite. Examples: `public/js/bijoy-engine.js`, `public/js/pdf-tools.js`, `public/js/document-scan-core.js`, `public/js/vector-trace-core.js`, `public/js/shell.js`
- Svelte 5 (runes-era components): the interactive UI in `src/components/*.svelte`, for example `src/components/PdfStudio.svelte`, `src/components/DocumentScanner.svelte`, `src/components/VectorStudio.svelte`
- Astro (`.astro`): pages and layout in `src/pages/**`, `src/layouts/ToolLayout.astro`, `src/components/CategoryLanding.astro`

**Secondary:**
- TypeScript (data modules only, with no root `tsconfig.json`): `src/data/tools.ts`, `src/data/menu.ts`, `src/data/lucide-icons.ts`
- CSS (Tailwind v4 plus a hand-written design system): `src/styles/studio-design.css`, `public/css/`
- SQL (SQLite dialect for Cloudflare D1): `cloudflare/schema.sql`
- Java/Gradle (Capacitor-generated Android shell): `android/`
- TypeScript/React 18 for the separate promo video sub-project: `promo-video/src/*.tsx`
- Python, for promo asset scripts only: `promo-video/scripts/*.py`

## Runtime

**Environment:**
- Browser runtime: the product runs entirely client-side. It is a static site plus a service worker (`public/sw.js`) and Web Workers (`public/js/document-scan-worker.js`, `public/js/vector-trace-worker.js`)
- Node.js `>=22.x`, declared in `package.json` `engines`. The local machine has v26.1.0. Node is used only for build/dev and tests.
- Android WebView via Capacitor 8 (`capacitor.config.json`, `webDir: "dist"`)
- Cloudflare Workers runtime for the optional sync backend (`cloudflare/worker.js`, `compatibility_date = "2025-01-01"`)

**Package Manager:**
- npm (11.x locally)
- Lockfiles: `package-lock.json` (root), `tests/package-lock.json`, `promo-video/package-lock.json`. All present.
- No `.nvmrc` / `.node-version` file

## Frameworks

**Core:**
- Astro `^7.4.2` (installed 7.4.2): static site generator, `output: 'static'`, `build.format: 'directory'`, `compressHTML: true` (`astro.config.mjs`)
- Svelte `^5.57.3` with `@astrojs/svelte` `^9.1.2`: island components mounted from Astro pages
- Tailwind CSS `^4.3.3` via `@tailwindcss/vite` `^4.3.3`, registered as a Vite plugin in `astro.config.mjs` (no `tailwind.config.*`, v4 CSS-first config)
- Capacitor `^8.6.0` (`@capacitor/core`, `@capacitor/android`): wraps `dist/` as an Android app with `appId: com.techhat.studio`

**Testing:**
- Plain Node scripts using `node:assert`, with no test framework. Files: `tests/engine.test.js`, `tests/office.test.js`, `tests/document-scan.test.cjs`, `tests/document-layers.test.cjs`, `tests/vector.test.cjs`, `tests/vector-export.test.cjs`
- Test-only deps live in `tests/package.json`: `jszip ^3.10.2`, `@xmldom/xmldom ^0.9.12` (DOM/XML shim for the office engine)

**Build/Dev:**
- Vite 8.3.5 (transitive via Astro)
- `@capacitor/cli` `^8.6.0` (devDependency)
- Android Gradle Plugin 8.13.0, Gradle 8.14.3 (`android/build.gradle`, `android/gradle/wrapper/gradle-wrapper.properties`)
- Remotion 4.0.529 + React 18 for `promo-video/` only. It is a separate package and not part of the app build.

## Key Dependencies

**Critical (npm, `package.json`):**
- `astro` 7.4.2: build pipeline and routing
- `svelte` 5.57.3: all interactive tool UIs
- `tailwindcss` / `@tailwindcss/vite` 4.3.3: styling
- `astro-icon` 1.2.0 + `@iconify-json/lucide` 1.2.147: Lucide icons at build time (`src/components/ui/Icon.svelte` and `src/data/lucide-icons.ts` also hold inline icon data)
- `@capacitor/core` / `@capacitor/android` 8.6.0: native Android packaging

**Vendored browser libraries (committed in `public/vendor/`, loaded with `<script is:inline>`, not from npm):**
- `public/vendor/jszip.min.js`: JSZip v3.10.1. DOCX/XLSX/PPTX read/write and ZIP export.
- `public/vendor/pdf-lib.min.js`: pdf-lib (Hopding). PDF creation, merge, split, edit.
- `public/vendor/pdf.min.js` + `public/vendor/pdf.worker.min.js`: Mozilla PDF.js v3.11.174. PDF rendering/text extraction.

**Runtime-fetched (CDN, not vendored):**
- Tesseract.js `@5`: OCR (`ben+eng`). It is loaded lazily by `ensureTesseract()` in `public/js/pdf-tools.js:2771`, from jsDelivr with an unpkg fallback.

**Fonts:**
- `public/SutonnyMJ-Regular.ttf`, `public/SutonnyMJ-Italic.ttf`: legacy Bijoy (ANSI) Bangla font, bundled for offline rendering
- Google Fonts (Inter, Noto Sans/Serif Bengali, Hind Siliguri, Anek Bangla, Tiro Bangla, Baloo Da 2, Galada, Atma, Mina) linked from `src/layouts/ToolLayout.astro:125`

**Infrastructure:**
- Cloudflare Wrangler. It is used through `npx wrangler` per the comments in `cloudflare/wrangler.toml` and is not listed as a dependency.

## Configuration

**Environment:**
- There are no `.env` files and no `import.meta.env` / `process.env` usage in app code
- Runtime user config is kept in `localStorage`, all with the `thbc-` prefix. Examples: `thbc-theme`, `thbc-lang`, `thbc-cache-ver`, `thbc-cloud-account`, `thbc-cloud-endpoint`, `thbc-inv-shop`, `thbc-pdf-vault`
- The cloud sync endpoint is entered by the user in the UI (`src/layouts/ToolLayout.astro:761`). It is never set at build time.

**Build:**
- `astro.config.mjs`: integrations (`icon()`, `svelte()`), Vite plugins (`tailwindcss()`, a custom dev-only `localCropDataset` middleware at `/__local/crop-dataset`), static output
- `capacitor.config.json`: `androidScheme: https`, `allowMixedContent: true`, `webContentsDebuggingEnabled: true`
- `vercel.json`: `framework: astro`, `buildCommand: npm run build`, `outputDirectory: dist`, `cleanUrls: true`
- `cloudflare/wrangler.toml`: Worker name `techhat-studio-vault`, D1 binding `DB`, R2 binding `BUCKET`
- `android/variables.gradle`: `minSdkVersion 24`, `compileSdkVersion 36`, `targetSdkVersion 36`
- `public/manifest.webmanifest`: PWA manifest (standalone, `file_handlers` for docx/xlsx/pptx/rtf/txt)
- `public/sw.js`: service worker cache version `VERSION = 'thbc-v76'`. Bump it together with the `?v=NN` query strings on `<script>` tags in `src/pages/**` and `localStorage` `thbc-cache-ver` in `src/layouts/ToolLayout.astro:92`.

**Scripts (`package.json`):**
```bash
npm run dev         # astro dev
npm run build       # astro build -> dist/
npm run preview     # astro preview
npm run cap:sync    # astro build && cap sync android
npm run apk:debug   # build + cap sync + android/gradlew.bat assembleDebug
npm test            # runs the six node test scripts in tests/ sequentially
```

## Platform Requirements

**Development:**
- Node.js >= 22, npm
- Run `npm install` inside `tests/` too, because the tests need `jszip` and `@xmldom/xmldom`
- For Android: JDK + Android SDK (API 36), with the path set in `android/local.properties`. Windows `gradlew.bat` is assumed by `apk:debug`.
- For the sync backend: a Cloudflare account + Wrangler CLI

**Production:**
- Static hosting on Vercel (`vercel.json`). Any static host serving `dist/` works.
- Android APK from Capacitor (`com.techhat.studio`, versionCode 1 / versionName "1.0")
- Optional: a Cloudflare Worker + D1 + R2 for document backup/sync (`cloudflare/`)

---

*Stack analysis: 2026-11-09*
