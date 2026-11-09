---
last_mapped_commit: 95728e0384f6255246213a1e57dfda1d480ff996
last_mapped_at: 2026-11-09
---
# Testing Patterns

**Analysis Date:** 2026-11-09

## Test Framework

**Runner:**
- Plain Node.js (`node >=22.x`, per the `engines` field in `package.json`). Tests use no test framework (no Jest, Vitest, Mocha or `node:test`).
- Every suite is a standalone script that runs top to bottom, counts passes, prints a summary, and exits non-zero on failure (or throws on the first failing assertion).
- Config: none. The suite list is hard-coded in the root `package.json` `test` script.

**Assertion Library:**
- `node:assert/strict` for the newer `.cjs` suites (`tests/document-scan.test.cjs`, `tests/document-layers.test.cjs`, `tests/vector.test.cjs`, `tests/vector-export.test.cjs`).
- Hand-rolled `eq()` / `ok()` counters for the older `.js` suites (`tests/engine.test.js`, `tests/office.test.js`).

**Run Commands:**
```bash
npm test                                   # Run all 6 suites in sequence (&&-chained, stops at first failing suite)
node tests/engine.test.js                  # Bijoy engine only
node tests/vector.test.cjs                 # Any single suite
cd tests && npm install                    # One-time: installs jszip + @xmldom/xmldom for office.test.js
```
- No watch mode and no coverage tooling.
- Latest run on 2026-11-09 was all green: engine 319 passed, office 33 passed, 42 document-scan, 15 layer-engine, 23 vector-trace, 16 vector-export.

## Test File Organization

**Location:**
- Separate top-level `tests/` directory. Nothing is co-located.
- `tests/package.json` (`"type": "commonjs"`) is a separate npm package that holds test-only dependencies (`jszip`, `@xmldom/xmldom`). It has its own `tests/node_modules/`, which `.gitignore` ignores.

**Naming:**
- `tests/<module-under-test>.test.cjs`. Use `.cjs` for every new suite. The two `.test.js` files predate it, and `tests/package.json` sets CommonJS for them.

**Structure:**
```
tests/
├── package.json                 # test-only deps (jszip, @xmldom/xmldom)
├── engine.test.js               # public/js/bijoy-engine.js
├── office.test.js               # public/js/office.js + formats.js (DOCX/XLSX/PPTX/RTF/TXT)
├── document-scan.test.cjs       # public/js/document-scan-core.js — detect/enhance/dewarp/passport
├── document-layers.test.cjs     # public/js/document-scan-core.js — selection/layer/effects engine
├── vector.test.cjs              # public/js/vector-trace-core.js
└── vector-export.test.cjs       # public/js/vector-export.js (SVG/EPS/AI)
```

**Registering a new suite:** add it to the `&&` chain in the root `package.json`:
```json
"test": "node tests/engine.test.js && node tests/office.test.js && ... && node tests/<new>.test.cjs"
```
`npm test` does not run a suite that is missing from that chain.

## Test Structure

**Suite Organization (preferred pattern for new suites: `.cjs` + `node:assert/strict`):**
```js
/* Vector trace core tests — run: node tests/vector.test.cjs */
const assert = require('node:assert/strict');
const C = require('../public/js/vector-trace-core.js');

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('✓ ' + name); }

test('ring produces outer and hole subpaths', () => {
  const img = makeImage(120, 120, WHITE);
  fillCircle(img, 60, 60, 40, BLACK);
  fillCircle(img, 60, 60, 18, WHITE);
  const r = C.trace(img, { mode: 'mono', minArea: 5, tolerance: 1 });
  assert.equal(r.paths.length, 1);
  assert.equal(r.paths[0].subpaths.length, 2, 'outer + hole');
});

console.log(`${passed} vector trace tests passed`);
```
(`tests/vector.test.cjs`)

- `test(name, fn)` is redefined in each file. It is synchronous, and an assertion failure throws, which stops the process with a non-zero exit. That is how `npm test` detects failure.
- Write test names as full behavioural sentences describing the guarantee: `'Uniform page and low contrast never invent an interior crop'`, `'Margin cleanup only clears outside a confident four-sided frame'`.
- Print a summary at the end with the format `` `${passed} <suite> tests passed` ``.

**Legacy counter pattern (`tests/engine.test.js`, `tests/office.test.js`):**
```js
let pass = 0, fail = 0;
function eq(label, got, want) {
  if (got === want) { pass++; return; }
  fail++;
  const cps = s => [...s].slice(0, 40).map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ');
  // trims long strings to the first diff, prints got/want with code points
  console.log(`✗ ${label}\n   got : ${got}  [${cps(got)}]\n   want: ${want}  [${cps(want)}]`);
}
// ...
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
```
- This pattern keeps going after failures and reports every mismatch. That suits large tables of conversion cases. When you add Bijoy/Unicode cases, extend `tests/engine.test.js` rather than starting a new suite.
- The code-point dump (`[0995 09cd ...]`) is essential for debugging invisible Bangla differences (ZWJ/ZWNJ, hasanta order). Keep it for any string-conversion test.

**Patterns:**
- **Setup:** module-level helper functions build fixtures. There is no `beforeEach`.
- **Teardown:** none. Every test is pure and in-memory.
- **Assertions:** `assert.equal` / `assert.deepEqual` / `assert.notDeepEqual` / `assert.ok(cond, message)`. Always pass a diagnostic message (often `JSON.stringify(got)` or a `` `${before} -> ${after}` `` template) so failures are readable.

## Mocking

**Framework:** None. Instead of mocking, inject real implementations as Node globals.

**Patterns:**
```js
// tests/office.test.js — provide browser globals the UMD modules expect
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
global.DOMParser = DOMParser;
global.XMLSerializer = XMLSerializer;
global.JSZip = require('jszip');
global.BijoyEngine = require('../public/js/bijoy-engine.js');
const Office = require('../public/js/office.js');
const Formats = require('../public/js/formats.js');
```
- Assign globals before you `require` the module under test, because UMD factories read `root.*` when they load.

**What to Mock:**
- Browser-only globals that a module reads (`DOMParser`, `XMLSerializer`, `JSZip`, sibling engines such as `BijoyEngine`). Use real libraries, not stubs.

**What NOT to Mock:**
- The engines themselves. Tests always run the real `public/js/*.js` file through `require('../public/js/<file>.js')`.
- Pixel buffers. Generate real `Uint8ClampedArray` RGBA data synthetically (see Fixtures).

**What cannot be tested this way:** DOM controllers (`public/js/app.js`, `shell.js`, `pdf-tools.js`, `image-tools.js`, `nid-scanner.js`, `document-scanner.js`, `vector-tools.js`, `tools.js`, `pdf-convert.js`), Svelte components and Astro pages. They are IIFEs bound to `document` and export nothing. To test new logic, put it in a UMD `*-core.js` module first (see `CONVENTIONS.md` → Module Design).

## Fixtures and Factories

**Synthetic image factories (inline in each suite):**
```js
// tests/vector.test.cjs / tests/vector-export.test.cjs
function makeImage(w, h, fill) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) d.set(fill, i * 4);
  return { data: d, w, h };
}
function fillCircle(img, cx, cy, r, color) { /* sets pixels inside circle */ }
function fillRect(img, x0, y0, x1, y1, color) { /* sets pixels inside rect */ }
const WHITE = [255,255,255,255], BLACK = [0,0,0,255], RED = [220,30,30,255];
```
```js
// tests/document-scan.test.cjs — pixel-function factory + polygon test
function image(w,h,pixel){ const data=new Uint8ClampedArray(w*h*4); for(...){let p=pixel(x,y);if(!Array.isArray(p))p=[p,p,p];data.set([...p,255],(y*w+x)*4);} return data; }
function inPoly(x,y,p){ /* ray-cast point-in-polygon */ }
const data = image(w, h, (x,y) => inPoly(x,y,q) ? 230 : 55);   // bright page on dark table
```
- Shared fixtures sit at module scope when several tests reuse them (`monoImg`, `colorRes` in `tests/vector-export.test.cjs`). Fixture builders that return fresh data sit in a function (`curvedFrame()` in `tests/document-scan.test.cjs`).
- Office fixtures are inline OOXML strings that get zipped at runtime:
  ```js
  async function makeZip(files) { const z = new JSZip(); for (const [p, c] of Object.entries(files)) z.file(p, c); return z.generateAsync({ type: 'uint8array' }); }
  const docx = await makeZip({ 'word/document.xml': doc, 'word/styles.xml': styles, '[Content_Types].xml': '<Types/>' });
  ```
- Conversion fixtures are inline `[input, expected]` tables (`B2U` in `tests/engine.test.js`) plus a large Bangla word list for Unicode→Bijoy→Unicode round trips.

**Location:**
- Fixtures live inside the test files. There is no `fixtures/` folder.
- **Real-photo tests:** `tests/document-scan.test.cjs:573-609` reads JPGs from the absolute path `C:/Users/Administrator/Desktop/test passport`. It is wrapped in `fs.existsSync`, so it silently skips on other machines. It also shells out to `sharp` with `execFileSync`, and `sharp` is not a declared dependency. Do not copy this pattern. If a real-image regression is needed, commit a small sample under `tests/fixtures/` and declare any decoder dependency.
- The crop dataset in `local-data/crop-dataset/` (gitignored, filled by the dev middleware in `astro.config.mjs`) is for manual tuning, not automated tests.

## Coverage

**Requirements:** None enforced. There is no coverage tool and no CI configuration.

**View Coverage:**
```bash
node --experimental-test-coverage tests/vector.test.cjs   # ad hoc only; not wired up
```

**Covered:** `bijoy-engine.js`, `office.js`, `formats.js`, `document-scan-core.js`, `vector-trace-core.js`, `vector-export.js`.
**Not covered:** every DOM controller in `public/js/`, `public/sw.js`, `cloudflare/worker.js`, every Svelte/Astro file, `src/data/tools.ts`.

## Test Types

**Unit Tests:**
- Deterministic tests of pure functions on synthetic inputs. Image-processing assertions use tolerances (`Math.abs(p.x - q[i].x/w) < .04`) or relative thresholds (`after < before*.25`), never exact pixel hashes. Exact equality is used only for byte-level guarantees (B/W output contains only 0/255, "original" filter preserves interior pixels).

**Regression Tests:**
- Glyph and punctuation regressions in `tests/engine.test.js` are grouped under numbered comments (`// 1) শৃ and right-stem consonants …`). Add each new bug case under a numbered comment that describes the rule.

**Integration Tests:**
- `tests/office.test.js` runs a full DOCX/XLSX/PPTX zip → convert → re-read cycle with real JSZip and xmldom, then asserts on the output XML with regexes.

**Performance smoke check:**
- `tests/engine.test.js:122-126` converts the word list repeated 400 times and prints timings (`perf: N KB U→B Xms B→U Yms`). It is informational only and asserts nothing.

**E2E Tests:**
- Not used. No Playwright or Cypress setup exists for the app. Check UI changes manually with `npm run dev`.

## Common Patterns

**Async Testing:**
```js
// tests/office.test.js — wrap the whole suite in an async IIFE; the sync counter pattern still applies
(async () => {
  let r = await Office.convertOffice(docx, 'a.docx', opts('b2u'));
  let x = await readPart(r.data, 'word/document.xml');
  ok('docx b2u text run1', texts(x, 'w:t')[0] === 'আমি ', JSON.stringify(texts(x, 'w:t')));
  // ...
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
```
- The `test(name, fn)` helper in the `.cjs` suites is synchronous. For async code, use the async IIFE plus counter pattern above, or `await` inside an async IIFE and let a thrown assertion reject the promise. Note that an unhandled rejection only exits non-zero on Node ≥15.

**"Never invents" / safety-property testing:**
```js
test('Uniform page and low contrast never invent an interior crop',()=>{
  for(const value of [0,128,255])
    assert.deepEqual(core.detect(image(100,140,()=>value),100,140),{pts:core.fullQuad(),auto:false,confidence:0});
});
test('Short text and blank pages do not trigger invented dewarp or margin erasure',()=>{
  const result=core.straighten(data,w,h,true);
  assert.equal(result.info.straightened,false); assert.equal(result.data,data);   // same reference = untouched
});
```
- For every new heuristic, add one positive test (it fires on the target case) and one negative test (it leaves benign input untouched).

**Error / degenerate-input testing:**
```js
test('Reject crossed or nearly collapsed quadrilaterals',()=>{
  assert.equal(core.validQuad([{x:0,y:0},{x:1,y:1},{x:1,y:0},{x:0,y:1}]),false);
  assert.equal(core.validQuad(core.fullQuad()),true);
});
// output sanity in exports
assert.ok(!svg.includes('NaN') && !svg.includes('undefined'));   // tests/vector-export.test.cjs
```

**Immutability checks:**
```js
const original = buf.slice();
/* ... apply effects ... */
assert.deepEqual(buf, original);   // tests/document-layers.test.cjs — effects must not mutate input
```

---

*Testing analysis: 2026-11-09*
