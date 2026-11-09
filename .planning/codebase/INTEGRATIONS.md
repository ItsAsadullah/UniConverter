---
last_mapped_commit: 95728e0384f6255246213a1e57dfda1d480ff996
last_mapped_at: 2026-11-09
---
# External Integrations

**Analysis Date:** 2026-11-09

The app is offline-first. All conversion, PDF, image, scan and vector processing runs in the browser (`public/js/*.js`). The only network integrations are the optional Cloudflare sync backend, the CDN-loaded OCR engine, and Google Fonts.

## APIs & External Services

**Cloud document sync (first-party, optional):**
- TechHat Vault: a Cloudflare Worker REST API (`cloudflare/worker.js`) for backing up documents from the local IndexedDB vault
  - Client: plain `fetch` + `FormData` in `public/js/shell.js` (`initDocumentVault()`, from ~line 1566; `syncSingleDocToCloud()` at ~line 1702; `syncAllWithCloud()` at ~line 1726)
  - Endpoint: entered by the user and stored in `localStorage['thbc-cloud-endpoint']` (UI placeholder `https://techhat-vault.your-subdomain.workers.dev` in `src/layouts/ToolLayout.astro:761`)
  - Auth: none. The client sends a free-text account ID in the `X-Sync-Account` header (falling back to the `?account=` query param), stored in `localStorage['thbc-cloud-account']`.
  - Routes (`cloudflare/worker.js`):
    - `GET /api/docs`: list up to 200 docs for the account from D1
    - `POST /api/docs`: multipart upload (`id, title, category, mime, size, createdAt, thumb, file`). The blob goes to R2 at key `${account}/${id}` and the metadata goes to D1 with `INSERT OR REPLACE`.
    - `GET /api/docs/:id/file`: stream the blob from R2
    - `DELETE /api/docs/:id`: remove from R2 and D1
  - CORS: `Access-Control-Allow-Origin: *`; allowed headers `Content-Type, X-Sync-Account`

**OCR:**
- Tesseract.js v5 (CDN): PDF/image OCR with the language `ben+eng`
  - Loader: `ensureTesseract()` in `public/js/pdf-tools.js:2771`. It tries `https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js` first, then `https://unpkg.com/tesseract.js@5/dist/tesseract.min.js`.
  - Usage: `Tesseract.recognize(canvas, lang || 'ben+eng', …)` at `public/js/pdf-tools.js:2829`. Tesseract downloads its worker, core and `traineddata` files from its default CDN at runtime.
  - Not cached by `public/sw.js` (cross-origin, non-font), so OCR needs network access
  - Auth: none

**Fonts:**
- Google Fonts: `fonts.googleapis.com` / `fonts.gstatic.com`
  - Stylesheet link in `src/layouts/ToolLayout.astro:123-125`; per-font dynamic loading in `public/js/app.js:54`
  - Cached stale-while-revalidate by `public/sw.js` (`isFontRequest()`, line 58)
  - The Bijoy fonts `SutonnyMJ-*.ttf` are self-hosted in `public/`

**Browser platform APIs (no external service):**
- Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for Bangla voice typing: `public/js/app.js:439`. In Chrome this routes audio to Google's speech service.
- Camera `navigator.mediaDevices.getUserMedia`: `public/js/document-scanner.js:430`, `public/js/nid-scanner.js:5169`, `public/js/vector-tools.js:2533`
- Web Share API (`navigator.share` with files): `public/js/shell.js:1950`, `public/js/vector-tools.js:2648`
- Web Workers: `public/js/document-scan-worker.js`, `public/js/vector-trace-worker.js`, and the PDF.js worker `public/vendor/pdf.worker.min.js`

## Data Storage

**Databases:**
- Cloudflare D1 (SQLite): database `techhat_vault_db`, binding `DB`
  - Schema: `cloudflare/schema.sql`. Single table `documents(id PK, account, title, category, mime, size, created_at, thumb, r2_key)` with index `idx_documents_account_created`.
  - Connection: the Worker binding is configured in `cloudflare/wrangler.toml`. `database_id` is a placeholder (`REPLACE_WITH_YOUR_D1_DATABASE_ID`) that must be filled in per deployment.
  - Client: the raw D1 prepared-statement API (`env.DB.prepare(...).bind(...)`), no ORM
- Browser IndexedDB: database `thbc_doc_vault` v1, store `docs` (keyPath `id`, index `createdAt`). It holds document blobs + thumbnails locally (`public/js/shell.js:1567-1591`).
- Browser `localStorage`: preferences and small datasets with keys prefixed `thbc-` (theme, language, invoice shop/logo, PDF vault map, cloud config)

**File Storage:**
- Cloudflare R2: bucket `techhat-vault-files`, binding `BUCKET`, object key `${account}/${id}` (`cloudflare/worker.js`)
- Local filesystem (dev only): the Vite middleware `/__local/crop-dataset` in `astro.config.mjs` writes scanner crop-correction samples to `local-data/crop-dataset/{training|testing}/{sha256}/`. Localhost only, gitignored. See `CROP_DATASET.md`.

**Caching:**
- Service worker Cache Storage (`public/sw.js`): `shell-thbc-v76` (precached app shell, vendor libs, engines, icons) + `runtime-thbc-v76`. Navigations and same-origin assets are network-first; fonts are stale-while-revalidate.
- No server-side cache

## Authentication & Identity

**Auth Provider:**
- None. There is no login, OAuth or token system.
  - The sync "account" is an unauthenticated, user-chosen identifier, lowercased and trimmed by the Worker. Anyone who knows or guesses an account ID can list, download and delete its documents.

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, analytics or telemetry SDKs)

**Logs:**
- Browser `console` only. The Worker does no explicit logging beyond the Cloudflare default request logs.

## CI/CD & Deployment

**Hosting:**
- Vercel static hosting (`vercel.json`: Astro framework, `npm run build`, `dist/`, `cleanUrls`)
- Android: a Capacitor APK built locally via `npm run apk:debug` (`android/`, `capacitor.config.json`). The README mentions a Play Store TWA route.
- Cloudflare Workers for the sync API, deployed manually with Wrangler (setup commands are in comments in `cloudflare/wrangler.toml`)
- The `.agents/skills/deploy-to-vercel` and `.agents/skills/vercel-cli-with-tokens` project skills cover Vercel deploys

**CI Pipeline:**
- None (no `.github/workflows`, no other CI config)

**Firebase / Google Services (Android, inactive):**
- `android/build.gradle` includes the `com.google.gms:google-services:4.4.4` classpath. `android/app/build.gradle` applies the plugin only if `google-services.json` exists, and that file is absent, so push notifications are disabled.
- Manifest permissions: `android.permission.INTERNET` only (`android/app/src/main/AndroidManifest.xml`)

## Environment Configuration

**Required env vars:**
- None for the web app or the build
- Cloudflare Worker: no secrets or env vars, only the `DB` and `BUCKET` bindings (`cloudflare/wrangler.toml`)
- Per-user runtime config is kept in `localStorage`: `thbc-cloud-endpoint`, `thbc-cloud-account`

**Secrets location:**
- None committed or required. `android/local.properties` exists and holds the local SDK path; it is machine-specific.

## Webhooks & Callbacks

**Incoming:**
- None. The Worker exposes only the REST routes listed above. The dev-only `POST /__local/crop-dataset` exists in the Astro dev server.

**Outgoing:**
- None. The client calls only the user-configured Worker endpoint, the Tesseract CDNs and Google Fonts.

## Sub-project: promo-video

- `promo-video/` is a separate Remotion 4.0.529 project (`promo-video/package.json`, `promo-video/remotion.config.ts`), with Python helper scripts in `promo-video/scripts/` (`process_voiceover.py`, `generate_sfx.py`, `create_sample_assets.py`)
- It has no runtime integration with the app

---

*Integration audit: 2026-11-09*
