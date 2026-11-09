---
last_mapped_commit: 95728e0384f6255246213a1e57dfda1d480ff996
last_mapped_at: 2026-11-09
---
# Codebase Concerns

**Analysis Date:** 2026-11-09

## Tech Debt

**Oversized vanilla JS engine files (god modules):**
- Issue: Core features live in single IIFE files of 2,000–5,800 lines with no module boundaries. Each one mixes UI wiring (DOM IDs, `innerHTML` templates, event binding), i18n strings, and image-processing algorithms.
- Files (real line counts / bytes):
  - `public/js/nid-scanner.js` — 5,797 lines / 257 KB
  - `public/js/pdf-tools.js` — 4,212 lines / 200 KB
  - `public/js/vector-tools.js` — 3,127 lines / 130 KB
  - `public/js/document-scan-core.js` — 3,092 lines / 183 KB
  - `public/js/document-scanner.js` — 2,890 lines / 245 KB
  - `public/js/vector-trace-core.js` — 2,046 lines / 88 KB
  - `public/js/shell.js` — 2,006 lines / 86 KB
  - `public/js/image-tools.js` — 1,741 lines / 72 KB
- Impact: Hard to review and change safely. Merge conflicts are frequent. Agents can't load a whole file into context. Nothing is tree-shaken, so every tool page downloads the full engine.
- Fix approach: Split each file along the seams that already exist: pure algorithm (`*-core.js`, already UMD-testable) vs. DOM controller vs. i18n strings. Move new code into ES modules under `src/lib/` bundled by Vite, and leave `public/js` as a thin legacy layer.

**Minified-style, dense hand-written source:**
- Issue: `public/js/document-scanner.js` has lines up to 4,458 characters long. Whole functions sit on one line (e.g. `saveCropDataset` at line 45, the worker pool at line 58). `public/js/document-scan-core.js` reaches 889 characters per line.
- Files: `public/js/document-scanner.js`, `public/js/document-scan-core.js`
- Impact: Diffs are unreadable, stack traces point at a column rather than a line, and grep/edit tools match huge lines.
- Fix approach: Run Prettier over `public/js/` in a dedicated formatting-only commit, then add a format check.

**Oversized Svelte components acting as static markup shells:**
- Issue: `src/components/DocumentScanner.svelte` (2,585 lines, 161 `id=` attributes) and `src/components/VectorStudio.svelte` (1,881 lines, 153 `id=` attributes) mostly render markup. The vanilla scripts (`public/js/document-scanner.js`, `public/js/vector-tools.js`) then query and mutate that markup by ID. Svelte reactivity isn't used for the tool state.
- Files: `src/components/DocumentScanner.svelte`, `src/components/VectorStudio.svelte`, `src/components/NidCardScanner.svelte` (1,182), `src/components/PdfStudio.svelte` (904)
- Impact: Two sources of truth. If you rename or remove an element ID in Svelte, the vanilla controller breaks silently at runtime (`$('#id')` returns null). No compiler or test catches this.
- Fix approach: Extract the dock/panel config arrays (e.g. `dockGroups` in `VectorStudio.svelte`) into `src/data/*.ts`. Split each studio into sub-components (`scanner/`, `vector/`). Long term, move state into Svelte stores and call the core engines directly.

**Monolithic layout file:**
- Issue: `src/layouts/ToolLayout.astro` is 928 lines / 56 KB. It holds the head, nav, mobile shell, cloud-sync settings UI (around line 761) and script tags.
- Files: `src/layouts/ToolLayout.astro`
- Fix approach: Extract `MobileShell.astro`, `CloudSyncPanel.astro` and `HeadMeta.astro` into `src/components/`.

**Manual cache-busting / version bumping (high-friction, error-prone):**
- Issue: Asset versions are hard-coded in at least four independent places, and they have already drifted apart:
  - SW cache name `var VERSION = 'thbc-v76'` in `public/sw.js:4`
  - `?v=` query strings on `<script is:inline>` tags: `src/layouts/ToolLayout.astro:924` (`shell.js?v=72`), `src/pages/image/[tool].astro:38-49` (`v=76`, `v=71`, `v=70`), `src/pages/pdf/[tool].astro:29-31`, `src/pages/bangla/*.astro`, `src/pages/calendar*.astro`, `src/pages/invoice.astro`, `src/pages/business/invoice-maker.astro` (`v=70`)
  - Runtime lazy-loads: `public/js/image-tools.js:207-231`, `public/js/vector-tools.js:352,359`
  - Worker imports: `public/js/vector-trace-worker.js:2` (`v=76`), `public/js/document-scan-worker.js:1` (`v=43`), `public/js/document-scanner.js:58` (`new Worker('/js/document-scan-worker.js?v=43')`)
- Impact: Forget one bump and users run stale code. The document-scan worker is pinned at `v=43` while the main thread loads `document-scan-core.js?v=70`. After a core change, worker and main-thread results can differ (stale worker core cached by the browser or SW).
- Fix approach: Move `public/js/*` into the Vite pipeline so filenames get content hashes, or generate a single `ASSET_VERSION` constant at build time (e.g. a tiny Astro integration that hashes `public/js` and rewrites `sw.js`). Import the constant everywhere instead of using literals.

**Duplicate service-worker registration:**
- Issue: `navigator.serviceWorker.register('/sw.js')` is called in both `public/js/shell.js:1536` and `public/js/app.js:1186`. Both calls swallow errors with an empty catch.
- Fix approach: Register once in `public/js/shell.js` only and log failures.

**Pervasive silent error swallowing:**
- Issue: There are about 60 empty `catch (e) {}` blocks across `public/js/*.js` and `src/components/*.svelte`. Examples: `public/js/shell.js:1698` (`getCloudConfig`), `public/js/shell.js:1723`, `public/js/shell.js:1746`, and worker fallbacks in `public/js/document-scanner.js:58`.
- Impact: Sync failures, storage quota errors and worker crashes are invisible to users and developers.
- Fix approach: Add a shared `reportError(scope, err)` helper (console + optional `window.TechHatToast`). Replace bare catches in sync, storage and worker paths first.

**Global-namespace coupling:**
- Issue: Modules talk through `window.*` globals: `TechHatVault`, `TechHatNavigate`, `TechHatEnsureScript`, `TechHatImage`, `TechHatPDF`, `TechHatVector`, `TechHatNidScanner`, `TechHatScannerInit`, `NID_DETECTION_PROFILES`, `_thBijoyLangListenerBound`, `_thPdfLangListenerBound`. These are defined in `public/js/shell.js`, `public/js/image-tools.js`, `public/js/nid-scanner.js` and others.
- Impact: Load order is critical. A missing or late script gives `undefined is not a function` with no type safety.
- Fix approach: When migrating to ES modules, export these APIs and import them explicitly.

## Known Bugs

**Worker/core version skew in the document scanner:**
- Symptoms: Auto-detect/process results from the Web Worker can differ from main-thread fallback results after `document-scan-core.js` changes.
- Files: `public/js/document-scan-worker.js:1`, `public/js/document-scanner.js:58`, `src/pages/image/[tool].astro:48`
- Trigger: Deploy a change to `public/js/document-scan-core.js` and bump only the page `?v=`. The worker still imports `?v=43`.
- Workaround: Hard reload or clear site data.

**Offline gaps despite the "offline-first" claim:**
- Symptoms: Opening a tool page offline that you never visited online returns the home shell or fails. Locally bundled Bangla fonts are missing offline.
- Files: `public/sw.js:8-39`
- Trigger: The `ASSETS` precache lists only `index.html` plus `public/js` and `public/vendor`. It doesn't include Astro routes (`/bangla/*`, `/pdf/*`, `/image/*`), hashed `/_astro/*` Svelte/CSS bundles, or `public/fonts/*.ttf` (Kalpurush, Nikosh, SolaimanLipi, etc.).
- Workaround: None. Pages only work offline after one online visit each.

**Service worker install is all-or-nothing:**
- Symptoms: The SW never installs and nothing is cached.
- Files: `public/sw.js:41-47`
- Trigger: `cache.addAll` rejects if any single entry fails, e.g. a renamed file still listed in `ASSETS`. `index.html` is also requested while `vercel.json` sets `cleanUrls: true`, which can redirect it.
- Workaround: Keep `ASSETS` in sync by hand. Fix by caching entries individually with `Promise.allSettled`, and by dropping `index.html` in favour of `./`.

**Cloud sync partial failures reported as success:**
- Symptoms: The status shows "All documents synced with Cloudflare R2!" even when uploads or downloads failed.
- Files: `public/js/shell.js:1702-1777`
- Trigger: `syncSingleDocToCloud` resolves `false` on error, and the pull `.catch` returns `null`. The final `.then` never checks those results. A failed remote list falls back to `{ docs: [] }`.
- Workaround: None.

**Missing icons render as empty boxes:**
- Files: `src/components/ui/Icon.svelte:11-12`, `src/data/lucide-icons.ts`
- Trigger: Any `name` that isn't in `LUCIDE_ICONS` renders an empty `<svg>` with no warning.
- Fix: In dev mode, `console.warn` on missing keys.

## Security Considerations

**Cloud sync API has no authentication (critical):**
- Risk: `cloudflare/worker.js` identifies the user only by an `X-Sync-Account` header or `?account=` query parameter, which is a free-text email or "Sync ID" (`public/js/shell.js:1696`). Anyone who knows or guesses an email can list (`GET /api/docs`), download (`GET /api/docs/:id/file`), overwrite (`POST`, `INSERT OR REPLACE`) or delete (`DELETE`) that user's scanned documents. These documents include NID cards and passports.
- Files: `cloudflare/worker.js:27-95`, `public/js/shell.js:1692-1777`, `public/js/shell.js:1924`
- Current mitigation: None. Account IDs are lowercased and trimmed only.
- Recommendations: Require a real credential: a per-device random secret (≥128-bit) stored client-side and hashed server-side, signed tokens, or Cloudflare Access. Never accept the identity in the query string. Rate-limit by IP.

**Wildcard CORS on the sync worker:**
- Risk: `'Access-Control-Allow-Origin': '*'` (`cloudflare/worker.js:8`) lets any website script read and write the API from a victim's browser, given an account ID.
- Recommendations: Restrict the allowed origin to the production domain and the Capacitor origin (`https://localhost`).

**Unbounded uploads and D1 metadata injection surface:**
- Risk: `POST /api/docs` has no size limit, MIME allow-list or per-account quota, which allows R2 cost abuse. `id` comes from the client and becomes part of the R2 key (`${account}/${id}`). The `thumb` data-URL is stored unbounded in D1. Parameterised queries prevent SQL injection.
- Files: `cloudflare/worker.js:47-73`, `cloudflare/schema.sql`
- Recommendations: Validate `id` against `^[A-Za-z0-9_-]{1,64}$`, cap file size and thumb length, and enforce a per-account quota.

**Sensitive identity documents synced in plaintext:**
- Risk: Scans from `public/js/nid-scanner.js` and the passport/document scanner are uploaded to R2 unencrypted.
- Files: `public/js/shell.js:1702-1724`
- Recommendations: Encrypt on the client (WebCrypto AES-GCM, key derived from a user passphrase) before upload.

**No Content-Security-Policy:**
- Risk: No CSP meta tag or headers exist (nothing in `vercel.json` or `src/layouts/ToolLayout.astro`). The app uses about 80 `innerHTML` assignments (`public/js/pdf-tools.js` 18, `public/js/app.js` 15, `public/js/shell.js` 13, `public/js/vector-tools.js` 13, `public/js/tools.js` 8, …) and `{@html}` in `src/components/ui/Icon.svelte:26`. Any one that interpolates a user filename or a synced `title` from the server can become stored XSS.
- Recommendations: Add a `headers` block to `vercel.json` with CSP (`script-src 'self'` plus the explicit CDNs), `X-Content-Type-Options` and `Referrer-Policy`. Audit `innerHTML` sites that render document titles from the vault (`renderSavedDocsVault` in `public/js/shell.js`) and use `textContent` instead.

**Runtime third-party script loading without integrity:**
- Risk: `public/js/pdf-tools.js:2774-2776` loads `tesseract.js@5` from `cdn.jsdelivr.net`, falling back to `unpkg.com`. The range is floating and there's no SRI. Fonts load from `fonts.googleapis.com` (`src/layouts/ToolLayout.astro:123-125`, `public/js/app.js:54`). This breaks the offline promise and is a supply-chain risk.
- Recommendations: Vendor tesseract into `public/vendor/` (as with `pdf.min.js`) or pin an exact version and add `integrity`.

**Android build ships debug-grade settings:**
- Risk: `capacitor.config.json` sets `"webContentsDebuggingEnabled": true` (anyone with USB access can inspect the WebView and vault data) and `"allowMixedContent": true`. `android/app/src/main/AndroidManifest.xml` has `android:allowBackup="true"`, so IndexedDB vault contents end up in device backups.
- Recommendations: Disable debugging and mixed content for release builds (per-flavour config), and set `allowBackup="false"` or add backup rules.

**Local dev dataset endpoint:**
- Risk: `/__local/crop-dataset` in `astro.config.mjs:9-78` writes uploaded images to `local-data/crop-dataset/`. It's guarded by Host/Origin localhost checks, a 40 MB cap and filename sanitisation, and it's dev-server only (`configureServer`). The risk is low, but the client call in `public/js/document-scanner.js:45` ships to production (it's a no-op off localhost).
- Current mitigation: `local-data/crop-dataset/` is gitignored (`.gitignore`).

**Secrets:**
- No `.env` files were detected. `cloudflare/wrangler.toml` holds the placeholder `database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"`. Keep real IDs out of git and inject them through `wrangler` environments.

## Performance Bottlenecks

**Heavy synchronous script payloads per tool page:**
- Problem: Image tool pages load several 100–250 KB non-module scripts (`public/js/image-tools.js`, `public/js/nid-scanner.js`, `public/js/document-scanner.js`, `public/js/document-scan-core.js`, `public/js/vector-tools.js`) with no minification, because `public/` bypasses Vite.
- Files: `src/pages/image/[tool].astro:38-49`
- Improvement path: Move them into the Vite build for minification and code splitting, and lazy-load per sub-tool (which `public/js/image-tools.js:207-231` already partly does).

**Large SW precache on first install:**
- Problem: The install step downloads every engine plus `public/vendor/pdf.worker.min.js` (1.09 MB), `pdf-lib.min.js` (525 KB), `pdf.min.js` (320 KB) and `jszip.min.js` (98 KB), about 3.5 MB in total, even for users who only open the Bijoy converter.
- Files: `public/sw.js:8-39`
- Improvement path: Precache only the shell. Cache tool engines at runtime on first use.

**Network-first strategy for all same-origin assets:**
- Problem: Every JS/CSS request goes to the network before the cache (`public/sw.js:104-115`), so slow or flaky mobile networks feel slow even when the asset is cached.
- Improvement path: Once filenames are content-hashed, switch to cache-first for hashed assets and stale-while-revalidate for others.

**Main-thread pixel processing fallbacks:**
- Problem: When a worker fails, document scan and vector trace run on the main thread (`runMain` in `public/js/document-scanner.js:58`, fallback in `public/js/vector-tools.js:352-359`). Large phone photos (12–50 MP) freeze the UI. `public/js/nid-scanner.js` and `public/js/image-tools.js` canvas operations run on the main thread by design.
- Improvement path: Downscale before detection, move NID detection into a worker, and use `OffscreenCanvas` where supported.

**Custom SPA navigation re-parses full HTML:**
- Problem: `fetchPageHtml` in `public/js/shell.js:1139-1166` fetches whole pages, runs `DOMParser` on them, and compares every `<style>` by full `textContent` against all existing styles (`public/js/shell.js:1116-1133`). That costs O(n²) string comparisons per navigation. `pageHtmlCache` grows without bound.
- Improvement path: Use Astro View Transitions (`<ClientRouter />`), or cap the cache and compare styles by hash.

## Fragile Areas

**Hand-rolled client-side router in `shell.js`:**
- Files: `public/js/shell.js:1059-1200` (`loadedScripts`, `ensureScriptLoaded`, `ensureHeadStyles`, `fetchPageHtml`, `inferCategoryFromPath`)
- Why fragile: It swaps DOM, re-injects styles (with special cases for Vite dev `data-vite-dev-id`), and dedupes scripts by stripping `?v=` (`public/js/shell.js:1065,1074`). A new script version is therefore never loaded during an SPA session. Route-to-category mapping is hard-coded (`inferCategoryFromPath`), so new routes need manual edits. Tool init functions must be idempotent, which is why guard globals like `_thPdfLangListenerBound` exist.
- Safe modification: Test full reload and in-app navigation, in both `astro dev` and `astro preview`. When adding a route, update `inferCategoryFromPath` and `ALIAS_PATHS`.
- Test coverage: None.

**Svelte markup ↔ vanilla controller ID contract:**
- Files: `src/components/VectorStudio.svelte` ↔ `public/js/vector-tools.js`, `src/components/DocumentScanner.svelte` ↔ `public/js/document-scanner.js`, `src/components/NidCardScanner.svelte` ↔ `public/js/nid-scanner.js`, `src/components/PdfStudio.svelte` ↔ `public/js/pdf-tools.js`
- Why fragile: More than 300 element IDs form an implicit API between the two layers.
- Safe modification: Grep for an ID in `public/js/` before renaming or removing it in a `.svelte` file.
- Test coverage: None.

**Detection heuristics (passport / NID / document corners):**
- Files: `public/js/document-scan-core.js` (`detect`, `detectPassportSixPts`), `public/js/nid-scanner.js` (`NID_DETECTION_PROFILES`)
- Why fragile: Tuned magic-number thresholds. The commit history shows repeated "fix/refine 6-point detection" iterations. A change for one photo style regresses others.
- Safe modification: Run `node tests/document-scan.test.cjs` and `node tests/document-layers.test.cjs`, and check against `local-data/crop-dataset/` (see `CROP_DATASET.md`).
- Test coverage: Partial. The photo-based cases in `tests/document-scan.test.cjs:575-600` skip silently when the local JPGs are missing, and they need `sharp`, which isn't a declared dependency.

**Service worker lifecycle:**
- Files: `public/sw.js`
- Why fragile: `skipWaiting()` + `clients.claim()` (`public/sw.js:45,54`) activate the new SW under already-open pages that still run old scripts. The `activate` step deletes old caches, so mixed-version pages can fail to load lazy chunks.
- Safe modification: Bump `VERSION` together with every `?v=`, and test an upgrade from the previous version with a tab left open.

## Scaling Limits

**Cloud vault listing:**
- Current capacity: `LIMIT 200` docs per account in `cloudflare/worker.js:41`, with no pagination.
- Limit: Documents beyond 200 are never pulled to new devices.
- Scaling path: Add cursor pagination (`created_at < ?`) to both the worker and `syncAllWithCloud`.

**Sync algorithm:**
- Current capacity: Upload and download requests all fire concurrently through `Promise.all` (`public/js/shell.js:1741-1770`), with no conflict resolution beyond "id exists locally".
- Limit: Hundreds of docs saturate mobile connections. Deletions don't propagate between devices, and edits never re-sync once `cloudSynced = true`.
- Scaling path: Add a concurrency-limited queue, tombstones for deletes, and `updatedAt`-based reconciliation.

**IndexedDB vault:**
- Current capacity: Blobs are stored whole in IndexedDB (`public/js/shell.js:1579`), subject to browser quota.
- Limit: Quota errors are swallowed by empty catches.
- Scaling path: Use `navigator.storage.estimate()` with a UI warning and call `navigator.storage.persist()`.

## Dependencies at Risk

**Vendored, unversioned libraries:**
- Risk: `public/vendor/pdf.min.js`, `public/vendor/pdf.worker.min.js`, `public/vendor/pdf-lib.min.js` and `public/vendor/jszip.min.js` aren't tracked in `package.json`, so their versions are unknown and there's no security-update path. `pdf-lib` is unmaintained upstream.
- Impact: Unpatched PDF.js CVEs (e.g. the 2024 font-handling arbitrary-JS issue in PDF.js < 4.2.67) for any user-opened PDF.
- Migration plan: Record the versions in a `public/vendor/VERSIONS.md`, or install them through npm and copy at build time. Upgrade PDF.js to ≥ 4.2.67 and confirm `isEvalSupported: false`.

**Floating CDN tesseract.js:**
- Risk: `tesseract.js@5` is a major-range import from jsDelivr/unpkg (`public/js/pdf-tools.js:2774-2776`).
- Migration plan: Pin and vendor it.

**Test-only dependencies in a nested package:**
- Risk: `tests/package.json` holds `@xmldom/xmldom` and `jszip` separately from the root `package.json`, so `npm test` from the root fails on a fresh clone unless `tests/` is installed too. `sharp` is used but never declared.
- Migration plan: Move test deps into the root `devDependencies`.

**Bleeding-edge framework majors:**
- Risk: `astro ^7.4.2`, `svelte ^5.57.3`, `@capacitor/* ^8.6.0` and `tailwindcss ^4.3.3` use caret ranges on fast-moving majors.
- Migration plan: Rely on the committed `package-lock.json`, and upgrade intentionally.

## Missing Critical Features

**Authentication for cloud vault:**
- Problem: There's no user identity beyond a typed email/ID (see Security).
- Blocks: Safely offering cloud backup publicly.

**CI pipeline:**
- Problem: There's no `.github/` directory and no CI config. `npm test` and `astro build` never run automatically.
- Blocks: Catching regressions in detection heuristics and version-bump mistakes before deploy.

**Lint / format / type-check tooling:**
- Problem: There's no ESLint, Prettier or `astro check` script in `package.json`. The `public/js` code is untyped ES5.
- Blocks: Enforcing conventions, and catching undefined globals and dead IDs.

**Build-time asset manifest:**
- Problem: Nothing generates the SW precache list or asset versions automatically.
- Blocks: Reliable offline behaviour and cache invalidation.

## Test Coverage Gaps

**Shell, router, vault and cloud sync:**
- What's not tested: SPA navigation, script dedupe, the IndexedDB vault, `syncAllWithCloud`, `syncSingleDocToCloud`
- Files: `public/js/shell.js`
- Risk: Data loss or false "synced" status goes unnoticed.
- Priority: High

**Cloudflare worker API:**
- What's not tested: All routes, account isolation, error paths
- Files: `cloudflare/worker.js`, `cloudflare/schema.sql`
- Risk: Cross-account access and broken uploads.
- Priority: High

**NID scanner, PDF tools, image tools:**
- What's not tested: All logic in the three largest files
- Files: `public/js/nid-scanner.js`, `public/js/pdf-tools.js`, `public/js/pdf-convert.js`, `public/js/image-tools.js`, `public/js/tools.js`
- Risk: Regressions in about 12,000 lines of untested code.
- Priority: High

**Vector studio UI controller:**
- What's not tested: `public/js/vector-tools.js` (tool dock, selection, brush/heal/clone operations). Only `vector-trace-core.js` and `vector-export.js` have tests (`tests/vector.test.cjs`, `tests/vector-export.test.cjs`).
- Risk: Editing tools break silently.
- Priority: Medium

**Service worker:**
- What's not tested: Install, upgrade and offline fallback
- Files: `public/sw.js`
- Risk: Users stuck on stale versions, or offline mode broken.
- Priority: Medium

**Svelte components / E2E:**
- What's not tested: Every component in `src/components/`. No Playwright or E2E suite exists.
- Risk: Markup/ID contract breaks and layout regressions.
- Priority: Medium

**Image-based detection fixtures:**
- What's not tested (reliably): The photo cases in `tests/document-scan.test.cjs:575-600` pass vacuously when the local JPGs or `sharp` are absent.
- Risk: A green test run that exercised nothing.
- Priority: Medium. Commit small fixture images and fail loudly when they're missing.

---

*Concerns audit: 2026-11-09*
