/**
 * TechHat Photo Card Studio — Binary Image Metadata Test Suite
 * 
 * Verifies pure client-side binary PNG (tEXt/iTXt with IEEE 802.3 CRC32)
 * and JPEG (APP1 EXIF TIFF IFD0 and APP1 XMP RDF packet) metadata injection
 * with authentic TechHat attribution and strictly zero AI markers.
 * 
 * Run: node tests/photo-card-metadata.test.cjs
 */

const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const injector = require('../public/js/photo-card-metadata.js');

let passed = 0;
const tests = [];

function test(name, fn) {
  tests.push([name, fn]);
}

// --- In-Memory Valid Minimal Image Fixture Generators ---

/**
 * Creates a valid 1x1 RGBA PNG buffer (70 bytes).
 */
function createMinimalPng() {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR (13 bytes payload)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0); // width = 1
  ihdrData.writeUInt32BE(1, 4); // height = 1
  ihdrData[8] = 8;  // bit depth = 8
  ihdrData[9] = 6;  // color type = RGBA
  ihdrData[10] = 0; // compression = 0
  ihdrData[11] = 0; // filter = 0
  ihdrData[12] = 0; // interlace = 0
  const ihdrCrc = zlib.crc32(Buffer.concat([Buffer.from('IHDR', 'ascii'), ihdrData])) >>> 0;
  const ihdrChunk = Buffer.alloc(25);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4, 4, 'ascii');
  ihdrData.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(ihdrCrc, 21);

  // IDAT (deflated 1x1 scanline: filter 0 + RGBA 4 bytes)
  const rawScanline = Buffer.from([0x00, 0x00, 0x99, 0xFF, 0xFF]);
  const idatData = zlib.deflateSync(rawScanline);
  const idatCrc = zlib.crc32(Buffer.concat([Buffer.from('IDAT', 'ascii'), idatData])) >>> 0;
  const idatChunk = Buffer.alloc(12 + idatData.length);
  idatChunk.writeUInt32BE(idatData.length, 0);
  idatChunk.write('IDAT', 4, 4, 'ascii');
  idatData.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(idatCrc, 8 + idatData.length);

  // IEND (0 bytes payload)
  const iendCrc = zlib.crc32(Buffer.from('IEND', 'ascii')) >>> 0;
  const iendChunk = Buffer.alloc(12);
  iendChunk.writeUInt32BE(0, 0);
  iendChunk.write('IEND', 4, 4, 'ascii');
  iendChunk.writeUInt32BE(iendCrc, 8);

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Creates a valid minimal 1x1 JPEG buffer (134 bytes).
 */
function createMinimalJpeg() {
  const b64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  return Buffer.from(b64, 'base64');
}

// ======================================================================
// Group 1: Minimal Valid PNG Generation & Chunk Injection (6 tests)
// ======================================================================

test('Minimal 1x1 PNG generator creates standard 8-byte signature and valid IHDR/IDAT/IEND', () => {
  const png = createMinimalPng();
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const parsed = injector.parsePngMetadata(png);
  assert.ok(parsed.chunks.length >= 3, 'Must have at least IHDR, IDAT, IEND');
  assert.equal(parsed.chunks[0].type, 'IHDR');
  assert.equal(parsed.chunks[0].len, 13);
  const types = parsed.chunks.map(c => c.type);
  assert.ok(types.includes('IDAT'));
  assert.ok(types.includes('IEND'));
});

test('PNG metadata injection preserves 8-byte signature and keeps IHDR at offset 8', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png', { title: 'টেস্ট' });
  assert.equal(injected.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(injected.subarray(12, 16).toString('ascii'), 'IHDR');
  assert.equal(injected.readUInt32BE(8), 13);
});

test('PNG metadata injection places tEXt and iTXt chunks immediately after IHDR (before IDAT)', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png', { title: 'টেস্ট' });
  const parsed = injector.parsePngMetadata(injected);
  assert.equal(parsed.chunks[0].type, 'IHDR');
  // Chunks immediately after IHDR should be tEXt or iTXt
  assert.ok(parsed.chunks[1].type === 'tEXt' || parsed.chunks[1].type === 'iTXt');
  const firstIdatIdx = parsed.chunks.findIndex(c => c.type === 'IDAT');
  assert.ok(firstIdatIdx > 1, 'Metadata chunks must be placed before IDAT');
  for (let i = 1; i < firstIdatIdx; i++) {
    assert.ok(parsed.chunks[i].type === 'tEXt' || parsed.chunks[i].type === 'iTXt');
  }
});

test('PNG metadata injection preserves original IDAT and IEND chunk payload and relative order', async () => {
  const orig = createMinimalPng();
  const origParsed = injector.parsePngMetadata(orig);
  const origIdatChunk = orig.subarray(origParsed.chunks[1].offset, origParsed.chunks[1].offset + 12 + origParsed.chunks[1].len);

  const injected = await injector.embedTechHatMetadata(orig, 'image/png', { title: 'টেস্ট' });
  const injParsed = injector.parsePngMetadata(injected);

  const injIdat = injParsed.chunks.find(c => c.type === 'IDAT');
  const injIend = injParsed.chunks.find(c => c.type === 'IEND');
  assert.ok(injIdat && injIend, 'Both IDAT and IEND must exist');
  assert.ok(injIdat.offset < injIend.offset, 'IDAT must precede IEND');

  const injIdatChunk = injected.subarray(injIdat.offset, injIdat.offset + 12 + injIdat.len);
  assert.deepEqual(injIdatChunk, origIdatChunk, 'IDAT payload must be preserved byte-for-byte');
});

test('PNG metadata injection handles Buffer, Uint8Array, and Blob inputs transparently', async () => {
  const origBuf = createMinimalPng();

  // Test 1: Buffer input
  const resBuf = await injector.embedTechHatMetadata(origBuf, 'image/png');
  assert.ok(Buffer.isBuffer(resBuf) || resBuf instanceof Uint8Array);
  assert.equal(resBuf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');

  // Test 2: Uint8Array input
  const u8 = new Uint8Array(origBuf.buffer, origBuf.byteOffset, origBuf.byteLength);
  const resU8 = await injector.embedTechHatMetadata(u8, 'image/png');
  assert.ok(resU8 instanceof Uint8Array);
  assert.equal(Buffer.from(resU8.buffer, resU8.byteOffset, 8).toString('hex'), '89504e470d0a1a0a');

  // Test 3: Blob input (global in Node 22+)
  if (typeof Blob !== 'undefined') {
    const blob = new Blob([origBuf], { type: 'image/png' });
    const resBlob = await injector.embedTechHatMetadata(blob, 'image/png');
    assert.ok(resBlob instanceof Blob);
    assert.equal(resBlob.type, 'image/png');
    const ab = await resBlob.arrayBuffer();
    assert.equal(Buffer.from(ab, 0, 8).toString('hex'), '89504e470d0a1a0a');
  }
});

test('Re-injecting metadata updates existing chunks without duplicating or leaking stale chunks', async () => {
  const orig = createMinimalPng();
  const v1 = await injector.embedTechHatMetadata(orig, 'image/png', {
    title: 'প্রথম শিরোনাম',
    author: 'TechHat First Author'
  });
  const parsed1 = injector.parsePngMetadata(v1);
  assert.equal(parsed1.tags.Title, 'প্রথম শিরোনাম');
  assert.equal(parsed1.tags.Author, 'TechHat First Author');
  const count1 = parsed1.chunks.length;

  const v2 = await injector.embedTechHatMetadata(v1, 'image/png', {
    title: 'দ্বিতীয় আপডেট শিরোনাম',
    author: 'TechHat Second Author'
  });
  const parsed2 = injector.parsePngMetadata(v2);
  assert.equal(parsed2.tags.Title, 'দ্বিতীয় আপডেট শিরোনাম');
  assert.equal(parsed2.tags.Author, 'TechHat Second Author');
  assert.equal(parsed2.chunks.length, count1, 'Re-injecting should not leak or duplicate chunks');
});

// ======================================================================
// Group 2: PNG tEXt and iTXt Chunk Parsing & Keyword Extraction (5 tests)
// ======================================================================

test('PNG output contains standard ASCII tEXt chunks: Software, Source, URL, Author', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png');
  const parsed = injector.parsePngMetadata(injected);
  assert.ok(parsed.tags.Software && parsed.tags.Software.includes('TechHat Photo Card Studio'));
  assert.ok(parsed.tags.Source && parsed.tags.Source.includes('techhat.com.bd'));
  assert.ok(parsed.tags.URL && parsed.tags.URL.includes('tools.techhat.com.bd'));
  assert.ok(parsed.tags.Author && parsed.tags.Author.includes('TechHat'));
});

test('PNG output contains standard iTXt chunks: Title, Description, Copyright', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png', {
    title: 'ফটোকার্ড ব্যানার',
    description: 'টেকহ্যাট ব্যানার বিবরণ',
    copyright: 'কপিরাইট ২০২৬'
  });
  const parsed = injector.parsePngMetadata(injected);
  assert.equal(parsed.tags.Title, 'ফটোকার্ড ব্যানার');
  assert.equal(parsed.tags.Description, 'টেকহ্যাট ব্যানার বিবরণ');
  assert.equal(parsed.tags.Copyright, 'কপিরাইট ২০২৬');
});

test('PNG chunk keywords comply with PNG spec: length between 1 and 79 Latin-1 characters', () => {
  // Valid keyword check
  const validChunk = injector.createPngTextChunk('Author', 'TechHat');
  assert.ok(validChunk.length > 12);

  // Keyword too long (>79)
  const longKw = 'A'.repeat(80);
  assert.throws(() => {
    injector.createPngTextChunk(longKw, 'val');
  }, /between 1 and 79/);

  // Keyword empty
  assert.throws(() => {
    injector.createPngTextChunk('', 'val');
  }, /between 1 and 79/);

  // Keyword with null byte
  assert.throws(() => {
    injector.createPngTextChunk('Auth\0or', 'val');
  }, /null/);
});

test('PNG tEXt chunk payload format strictly adheres to keyword + null byte (0x00) + text', () => {
  const chunk = injector.createPngTextChunk('Source', 'https://techhat.com.bd');
  const len = chunk.readUInt32BE(0);
  assert.equal(chunk.subarray(4, 8).toString('ascii'), 'tEXt');
  const payload = chunk.subarray(8, 8 + len);
  const nullIdx = payload.indexOf(0x00);
  assert.ok(nullIdx > 0, 'Null separator must exist');
  assert.equal(payload.subarray(0, nullIdx).toString('latin1'), 'Source');
  assert.equal(payload.subarray(nullIdx + 1).toString('latin1'), 'https://techhat.com.bd');
});

test('All metadata chunks appear strictly before the first IDAT image data chunk', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png');
  const parsed = injector.parsePngMetadata(injected);
  const firstIdat = parsed.chunks.findIndex(c => c.type === 'IDAT');
  assert.ok(firstIdat > 0, 'IDAT must be found');

  parsed.chunks.forEach((c, idx) => {
    if (c.type === 'tEXt' || c.type === 'iTXt') {
      assert.ok(idx < firstIdat, `Metadata chunk ${c.type} at index ${idx} must precede IDAT at ${firstIdat}`);
    }
  });
});

// ======================================================================
// Group 3: UTF-8 International Text Integrity for Bengali Text (iTXt) (6 tests)
// ======================================================================

test('Bengali Unicode headline in iTXt Title preserves exact characters and conjuncts (যুক্তবর্ণ)', async () => {
  const orig = createMinimalPng();
  const headline = 'শুভ নববর্ষ - টেকহ্যাট ফটোকার্ড ও আন্তর্জাতিক মাতৃভাষা দিবস (যুক্তবর্ণ: ক্ষ, জ্ঞ, ষ্ণ, ঙ্ক)';
  const injected = await injector.embedTechHatMetadata(orig, 'image/png', { title: headline });
  const parsed = injector.parsePngMetadata(injected);
  assert.equal(parsed.tags.Title, headline);
});

test('Bengali multi-line description survives in iTXt chunk without byte truncation or newline loss', async () => {
  const orig = createMinimalPng();
  const desc = 'টেকহ্যাট ফটোকার্ড স্টুডিও\nলাইন ২: ডিজিটাল ব্যানার ও ফটোকার্ড জেনারেটর\nলাইন ৩: সর্বস্বত্ব সংরক্ষিত ২০২৬';
  const injected = await injector.embedTechHatMetadata(orig, 'image/png', { description: desc });
  const parsed = injector.parsePngMetadata(injected);
  assert.equal(parsed.tags.Description, desc);
  assert.ok(parsed.tags.Description.includes('\nলাইন ২:'));
});

test('Bengali copyright notice with symbol (©) and Bengali digits (২০২৬) preserves exact codepoints', async () => {
  const orig = createMinimalPng();
  const copyNotice = 'কপিরাইট © ২০২৬ টেকহ্যাট (techhat.com.bd)। সকল অধিকার সংরক্ষিত।';
  const injected = await injector.embedTechHatMetadata(orig, 'image/png', { copyright: copyNotice });
  const parsed = injector.parsePngMetadata(injected);
  assert.equal(parsed.tags.Copyright, copyNotice);
  assert.ok(parsed.tags.Copyright.includes('©'));
  assert.ok(parsed.tags.Copyright.includes('২০২৬'));
  assert.ok(parsed.tags.Copyright.includes('।'));
});

test('iTXt language tag is set to "bn" or "bn-BD" for Bengali content', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png', { title: 'বাংলা শিরোনাম' });
  const parsed = injector.parsePngMetadata(injected);
  assert.ok(parsed.tags['Title:lang'] === 'bn' || parsed.tags['Title:lang'] === 'bn-BD');
});

test('iTXt uncompressed flag is 0 and compression method is 0 for plain UTF-8 streams', () => {
  const chunk = injector.createPngItxtChunk('Title', 'বাংলা লেখা', 'bn');
  const len = chunk.readUInt32BE(0);
  assert.equal(chunk.subarray(4, 8).toString('ascii'), 'iTXt');
  const payload = chunk.subarray(8, 8 + len);
  const null1 = payload.indexOf(0x00);
  assert.ok(null1 > 0);
  assert.equal(payload[null1 + 1], 0x00, 'compression flag must be 0 (uncompressed)');
  assert.equal(payload[null1 + 2], 0x00, 'compression method must be 0');
});

test('iTXt handles complex Bengali text with zero-width characters (ZWNJ / ZWJ) without corruption', async () => {
  const orig = createMinimalPng();
  const textWithZw = 'বাংলাদেশ\u200Cর স্বাধীনতা ও র\u200D্যালী';
  const injected = await injector.embedTechHatMetadata(orig, 'image/png', { title: textWithZw });
  const parsed = injector.parsePngMetadata(injected);
  assert.equal(parsed.tags.Title, textWithZw);
  assert.ok(parsed.tags.Title.includes('\u200C'));
  assert.ok(parsed.tags.Title.includes('\u200D'));
});

// ======================================================================
// Group 4: CRC32 Checksum Verification for All Injected Chunks (5 tests)
// ======================================================================

test('All injected tEXt chunks have valid CRC32 matching zlib.crc32 over chunk type and data', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png');
  const parsed = injector.parsePngMetadata(injected);
  for (const c of parsed.chunks) {
    if (c.type === 'tEXt') {
      const chunkBytes = injected.subarray(c.offset + 4, c.offset + 8 + c.len);
      const expectedCrc = zlib.crc32(chunkBytes) >>> 0;
      assert.equal(c.crc, expectedCrc, `tEXt chunk CRC mismatch for offset ${c.offset}`);
    }
  }
});

test('All injected iTXt chunks have valid CRC32 matching zlib.crc32 over chunk type and data', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png');
  const parsed = injector.parsePngMetadata(injected);
  for (const c of parsed.chunks) {
    if (c.type === 'iTXt') {
      const chunkBytes = injected.subarray(c.offset + 4, c.offset + 8 + c.len);
      const expectedCrc = zlib.crc32(chunkBytes) >>> 0;
      assert.equal(c.crc, expectedCrc, `iTXt chunk CRC mismatch for offset ${c.offset}`);
    }
  }
});

test('Pre-existing IHDR, IDAT, and IEND CRC32 values remain untouched and valid', async () => {
  const orig = createMinimalPng();
  const origParsed = injector.parsePngMetadata(orig);
  const injected = await injector.embedTechHatMetadata(orig, 'image/png');
  const injParsed = injector.parsePngMetadata(injected);

  const origIhdr = origParsed.chunks.find(c => c.type === 'IHDR');
  const injIhdr = injParsed.chunks.find(c => c.type === 'IHDR');
  assert.equal(injIhdr.crc, origIhdr.crc);

  const origIdat = origParsed.chunks.find(c => c.type === 'IDAT');
  const injIdat = injParsed.chunks.find(c => c.type === 'IDAT');
  assert.equal(injIdat.crc, origIdat.crc);

  const origIend = origParsed.chunks.find(c => c.type === 'IEND');
  const injIend = injParsed.chunks.find(c => c.type === 'IEND');
  assert.equal(injIend.crc, origIend.crc);
});

test('CRC32 calculation handles chunks of length 0, 1, and >1024 bytes without unsigned sign flips', () => {
  // Length 0
  const empty = Buffer.alloc(0);
  assert.equal(injector.calculateCrc32(empty), 0);
  assert.ok(injector.calculateCrc32(empty) >= 0);

  // Length 1
  const b1 = Buffer.from('A');
  const expected1 = zlib.crc32(b1) >>> 0;
  assert.equal(injector.calculateCrc32(b1), expected1);
  assert.ok(injector.calculateCrc32(b1) >= 0);

  // Length 2048
  const b2048 = Buffer.alloc(2048);
  for (let i = 0; i < 2048; i++) b2048[i] = (i * 37) & 0xFF;
  const expected2048 = zlib.crc32(b2048) >>> 0;
  assert.equal(injector.calculateCrc32(b2048), expected2048);
  assert.ok(injector.calculateCrc32(b2048) >= 0);
});

test('Test parser CRC validator correctly detects and flags bit-flipped chunk payloads', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png');
  const corrupt = Buffer.from(injected);
  // Locate first tEXt chunk and flip a bit in its payload
  const parsed = injector.parsePngMetadata(injected);
  const textChunk = parsed.chunks.find(c => c.type === 'tEXt');
  assert.ok(textChunk);
  corrupt[textChunk.offset + 9] ^= 0xFF; // corrupt one payload byte

  assert.throws(() => {
    injector.parsePngMetadata(corrupt);
  }, /CRC32 mismatch/);
});

// ======================================================================
// Group 5: JPEG APP1 XMP RDF Packet Extraction & Schema Conformance (6 tests)
// ======================================================================

test('JPEG output contains APP1 marker (0xFFE1) with Adobe XMP namespace identifier', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  assert.ok(parsed.xmpPayload, 'XMP payload must exist');
  assert.ok(parsed.xmpString, 'XMP string must exist');
});

test('JPEG XMP packet is enclosed by standard <?xpacket begin=... id="W5M0MpCehiHzreSzNTczkc9d"?>', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  assert.ok(parsed.xmpString.startsWith('<?xpacket begin='));
  assert.ok(parsed.xmpString.includes('id="W5M0MpCehiHzreSzNTczkc9d"?'));
  assert.ok(parsed.xmpString.includes('<?xpacket end="w"?>'));
});

test('JPEG XMP contains well-formed x:xmpmeta and rdf:RDF wrappers', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  assert.ok(parsed.xmpString.includes('<x:xmpmeta xmlns:x="adobe:ns:meta/"'));
  assert.ok(parsed.xmpString.includes('<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"'));
  assert.ok(parsed.xmpString.includes('</rdf:RDF>'));
  assert.ok(parsed.xmpString.includes('</x:xmpmeta>'));
});

test('JPEG XMP Dublin Core schema contains dc:title, dc:creator, dc:description, dc:rights', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg', {
    title: 'ফটোকার্ড',
    author: 'TechHat (techhat.com.bd)',
    description: 'TechHat Studio Description',
    copyright: 'Copyright 2026 TechHat'
  });
  const parsed = injector.parseJpegMetadata(injected);
  assert.ok(parsed.xmpString.includes('<dc:title>'));
  assert.ok(parsed.xmpString.includes('<dc:creator>'));
  assert.ok(parsed.xmpString.includes('<dc:description>'));
  assert.ok(parsed.xmpString.includes('<dc:rights>'));
  assert.ok(parsed.xmpString.includes('TechHat (techhat.com.bd)'));
});

test('JPEG XMP Photoshop and Basic schemas contain xmp:CreatorTool and Source URL', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  assert.ok(parsed.xmpString.includes('<xmp:CreatorTool>'));
  assert.ok(parsed.xmpString.includes('TechHat Photo Card Studio'));
  assert.ok(parsed.xmpString.includes('<photoshop:Source>'));
  assert.ok(parsed.xmpString.includes('techhat.com.bd'));
});

test('JPEG XMP preserves Bengali UTF-8 text with proper XML entity escaping', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg', {
    title: 'টেকহ্যাট & ব্যানার <স্পেশাল>',
    description: 'বিবরণ ও "উদ্ধৃতি"'
  });
  const parsed = injector.parseJpegMetadata(injected);
  assert.ok(parsed.xmpString.includes('টেকহ্যাট &amp; ব্যানার &lt;স্পেশাল&gt;'));
  assert.ok(parsed.xmpString.includes('বিবরণ ও &quot;উদ্ধৃতি&quot;'));
});

// ======================================================================
// Group 6: JPEG APP1 EXIF TIFF IFD0 Parsing & Tag Extraction (7 tests)
// ======================================================================

test('JPEG output contains APP1 marker (0xFFE1) with Exif\\0\\0 header', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  assert.ok(parsed.exifPayload, 'EXIF payload must exist');
  assert.ok(parsed.exifPayload.length >= 8);
});

test('TIFF header contains valid byte order (II or MM) and magic number 42 (0x002A)', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  const exifBuf = Buffer.from(parsed.exifPayload);
  assert.equal(exifBuf.subarray(0, 2).toString('ascii'), 'MM', 'Big-Endian byte order');
  assert.equal(exifBuf.readUInt16BE(2), 42, 'TIFF magic number 42');
  assert.equal(exifBuf.readUInt32BE(4), 8, 'IFD0 offset = 8');
});

test('EXIF IFD0 contains ImageDescription tag (0x010E) containing photo card description', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg', {
    description: 'TechHat Photo Card Studio Export'
  });
  const parsed = injector.parseJpegMetadata(injected);
  const tags = injector.parseExifTags(parsed.exifPayload);
  assert.ok(tags['0x010E']);
  assert.ok(tags['0x010E'].includes('TechHat Photo Card'));
});

test('EXIF IFD0 contains Software tag (0x0131) set to "TechHat Photo Card Studio 2.0"', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  const tags = injector.parseExifTags(parsed.exifPayload);
  assert.equal(tags['0x0131'], 'TechHat Photo Card Studio 2.0');
});

test('EXIF IFD0 contains Artist tag (0x013B) attributing TechHat Studio', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  const tags = injector.parseExifTags(parsed.exifPayload);
  assert.ok(tags['0x013B']);
  assert.ok(tags['0x013B'].includes('TechHat Studio'));
});

test('EXIF IFD0 contains Copyright tag (0x8298) attributing TechHat (techhat.com.bd)', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  const tags = injector.parseExifTags(parsed.exifPayload);
  assert.ok(tags['0x8298']);
  assert.ok(tags['0x8298'].includes('TechHat (techhat.com.bd)'));
});

test('EXIF IFD0 contains DateTime tag (0x0132) formatted as YYYY:MM:DD HH:MM:SS', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  const tags = injector.parseExifTags(parsed.exifPayload);
  assert.ok(tags['0x0132'], 'DateTime tag must exist');
  assert.match(tags['0x0132'], /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/);
});

// ======================================================================
// Group 7: Negative Tests & AI Marker Absence Assertion (6 tests)
// ======================================================================

test('Injected PNG contains zero C2PA metadata chunks, boxes, or manifest references', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png');
  const raw = injected.toString('latin1').toLowerCase();
  assert.ok(!raw.includes('c2pa'), 'PNG must not contain c2pa');
  const ai = injector.findAiMarkers(injected);
  assert.equal(ai.length, 0);
});

test('Injected JPEG contains zero C2PA APP11 markers (0xFFEB) or JUMBF boxes', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  for (const seg of parsed.segments) {
    assert.notEqual(seg.marker, 0xEB, 'APP11 (C2PA) marker must not exist');
  }
  const raw = injected.toString('latin1').toLowerCase();
  assert.ok(!raw.includes('jumbf'), 'JPEG must not contain jumbf');
});

test('Injected PNG and JPEG contain zero Google SynthID watermarks or markers', async () => {
  const origPng = createMinimalPng();
  const origJpg = createMinimalJpeg();
  const injPng = await injector.embedTechHatMetadata(origPng, 'image/png');
  const injJpg = await injector.embedTechHatMetadata(origJpg, 'image/jpeg');
  assert.ok(!injPng.toString('latin1').toLowerCase().includes('synthid'));
  assert.ok(!injJpg.toString('latin1').toLowerCase().includes('synthid'));
});

test('Injected XMP contains zero synthetic media DigitalSourceType URIs (compositeSynthetic)', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg');
  const parsed = injector.parseJpegMetadata(injected);
  assert.ok(!parsed.xmpString.includes('compositeSynthetic'));
  assert.ok(!parsed.xmpString.includes('trainedAlgorithmicMedia'));
  assert.ok(!parsed.xmpString.includes('DigitalSourceType'));
});

test('Injected metadata drops or sanitizes user-supplied AI flags (e.g. ai_generated: true)', async () => {
  const orig = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(orig, 'image/png', {
    ai_generated: true,
    is_ai: true,
    c2pa: 'injected_manifest',
    title: 'Safe Card Title with ai_generated keyword'
  });
  const detected = injector.findAiMarkers(injected);
  assert.equal(detected.length, 0, 'No AI markers allowed');
  const raw = injected.toString('latin1').toLowerCase();
  assert.ok(!raw.includes('ai_generated'));
  assert.ok(!raw.includes('c2pa'));
});

test('CreatorTool and Software metadata strings contain no AI generator signatures (DALL-E, Midjourney)', async () => {
  const orig = createMinimalJpeg();
  const injected = await injector.embedTechHatMetadata(orig, 'image/jpeg', {
    software: 'DALL-E 3 and Midjourney model generator',
    author: 'Midjourney Artist'
  });
  const detected = injector.findAiMarkers(injected);
  assert.equal(detected.length, 0);
  const raw = injected.toString('latin1').toLowerCase();
  assert.ok(!raw.includes('dall-e'));
  assert.ok(!raw.includes('midjourney'));
});

// ======================================================================
// Group 8: Corrupt / Truncated Image Error Handling (7 tests)
// ======================================================================

test('Throws or rejects gracefully when given an empty buffer or zero-length blob', async () => {
  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(Buffer.alloc(0), 'image/png');
  }, /empty or zero-length/);

  if (typeof Blob !== 'undefined') {
    await assert.rejects(async () => {
      await injector.embedTechHatMetadata(new Blob([]), 'image/png');
    }, /empty or zero-length/);
  }
});

test('Throws or rejects gracefully when given a truncated PNG buffer (< 8 bytes)', async () => {
  const truncated = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(truncated, 'image/png');
  }, /buffer too small/);
});

test('Throws or rejects gracefully when given a corrupt PNG buffer with truncated IHDR', async () => {
  const badIhdr = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(badIhdr, 'image/png');
  }, /truncated IHDR/);
});

test('Throws or rejects gracefully when given a non-PNG file with image/png MIME', async () => {
  const fakePng = Buffer.from('NOT_A_PNG_FILE_CONTENT_HERE_123456');
  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(fakePng, 'image/png');
  }, /Invalid PNG signature/);
});

test('Throws or rejects gracefully when given a truncated JPEG buffer (< 2 bytes or missing SOI)', async () => {
  const truncated = Buffer.from([0xFF]);
  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(truncated, 'image/jpeg');
  }, /buffer too small/);

  const noSoi = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(noSoi, 'image/jpeg');
  }, /missing SOI/);
});

test('Throws or rejects gracefully when given an unsupported MIME type (e.g. image/webp)', async () => {
  const png = createMinimalPng();
  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(png, 'image/webp');
  }, /Unsupported MIME type/);
});

test('Gracefully applies default TechHat metadata when metadata argument is null or empty', async () => {
  const png = createMinimalPng();
  const injected = await injector.embedTechHatMetadata(png, 'image/png', null);
  const parsed = injector.parsePngMetadata(injected);
  assert.ok(parsed.tags.Title);
  assert.ok(parsed.tags.Author);
  assert.ok(parsed.tags.Description);
  assert.ok(parsed.tags.Software);
  assert.ok(parsed.tags.Source.includes('techhat.com.bd'));
});

// ======================================================================
// Group 9: Bengali Author in iTXt & Backwards-Compatibility (2 tests)
// ======================================================================

test('Bengali author in iTXt preserves exact Unicode codepoints without Latin-1 mojibake', async () => {
  const orig = createMinimalPng();
  const bengaliAuthor = 'মোঃ আরিফুল ইসলাম (TechHat Author)';
  const injected = await injector.embedTechHatMetadata(orig, 'image/png', {
    author: bengaliAuthor
  });
  const parsed = injector.parsePngMetadata(injected);
  assert.equal(parsed.tags.Author, bengaliAuthor, 'Bengali author must match verbatim');
  assert.ok(parsed.tags.Author.includes('মোঃ আরিফুল ইসলাম'));

  // Verify that Author is stored in an iTXt chunk, not truncated tEXt
  const authorItxtChunk = parsed.chunks.find(c => {
    if (c.type !== 'iTXt') return false;
    const chunkData = injected.subarray(c.offset + 8, c.offset + 8 + c.len);
    const nullIdx = chunkData.indexOf(0x00);
    return nullIdx > 0 && chunkData.subarray(0, nullIdx).toString('latin1') === 'Author';
  });
  assert.ok(authorItxtChunk, 'Author chunk must be stored as iTXt chunk');
});

test('Backwards-compatibility: legacy Latin-1 tEXt Author chunk parses correctly and updates to iTXt cleanly on re-injection', async () => {
  // Construct minimal PNG with a legacy Latin-1 tEXt chunk for Author
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0);
  ihdrData.writeUInt32BE(1, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  const ihdrCrc = zlib.crc32(Buffer.concat([Buffer.from('IHDR', 'ascii'), ihdrData])) >>> 0;
  const ihdrChunk = Buffer.alloc(25);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4, 4, 'ascii');
  ihdrData.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(ihdrCrc, 21);

  // Legacy tEXt chunk: Author\0Legacy Latin Author
  const legacyTextPayload = Buffer.concat([
    Buffer.from('Author', 'latin1'),
    Buffer.from([0x00]),
    Buffer.from('Legacy Latin Author', 'latin1')
  ]);
  const legacyCrc = zlib.crc32(Buffer.concat([Buffer.from('tEXt', 'ascii'), legacyTextPayload])) >>> 0;
  const legacyChunk = Buffer.alloc(12 + legacyTextPayload.length);
  legacyChunk.writeUInt32BE(legacyTextPayload.length, 0);
  legacyChunk.write('tEXt', 4, 4, 'ascii');
  legacyTextPayload.copy(legacyChunk, 8);
  legacyChunk.writeUInt32BE(legacyCrc, 8 + legacyTextPayload.length);

  // IDAT & IEND
  const rawScanline = Buffer.from([0x00, 0x00, 0x99, 0xFF, 0xFF]);
  const idatData = zlib.deflateSync(rawScanline);
  const idatCrc = zlib.crc32(Buffer.concat([Buffer.from('IDAT', 'ascii'), idatData])) >>> 0;
  const idatChunk = Buffer.alloc(12 + idatData.length);
  idatChunk.writeUInt32BE(idatData.length, 0);
  idatChunk.write('IDAT', 4, 4, 'ascii');
  idatData.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(idatCrc, 8 + idatData.length);

  const iendCrc = zlib.crc32(Buffer.from('IEND', 'ascii')) >>> 0;
  const iendChunk = Buffer.alloc(12);
  iendChunk.writeUInt32BE(0, 0);
  iendChunk.write('IEND', 4, 4, 'ascii');
  iendChunk.writeUInt32BE(iendCrc, 8);

  const legacyPng = Buffer.concat([sig, ihdrChunk, legacyChunk, idatChunk, iendChunk]);

  // Step 1: Parser backwards-compatibility — parses legacy tEXt Author
  const parsedLegacy = injector.parsePngMetadata(legacyPng);
  assert.equal(parsedLegacy.tags.Author, 'Legacy Latin Author');

  // Step 2: Re-injection strips legacy tEXt Author and replaces with new Bengali author
  const reInjected = await injector.embedTechHatMetadata(legacyPng, 'image/png', {
    author: 'নতুন বাংলা লেখক'
  });
  const parsedUpdated = injector.parsePngMetadata(reInjected);
  assert.equal(parsedUpdated.tags.Author, 'নতুন বাংলা লেখক');

  // Verify only 1 Author chunk exists in output (no duplication / ghost chunk)
  let authorChunkCount = 0;
  for (const c of parsedUpdated.chunks) {
    if (c.type === 'tEXt' || c.type === 'iTXt') {
      const chunkData = reInjected.subarray(c.offset + 8, c.offset + 8 + c.len);
      const nullIdx = chunkData.indexOf(0x00);
      if (nullIdx > 0 && chunkData.subarray(0, nullIdx).toString('latin1').toLowerCase() === 'author') {
        authorChunkCount++;
      }
    }
  }
  assert.equal(authorChunkCount, 1, 'Exactly one Author chunk must exist after update');
});

// ======================================================================
// Group 10: Negative AI Sanitization Completeness (3 tests)
// ======================================================================

test('Injected metadata sanitizes compositeSynthetic and composite-synthetic in PNG and JPEG', async () => {
  const origPng = createMinimalPng();
  const origJpg = createMinimalJpeg();

  const adversarialMeta = {
    title: 'Card with compositeSynthetic tag',
    description: 'Generated with composite synthetic and composite-synthetic pipeline',
    author: 'compositeSynthetic artist'
  };

  const injPng = await injector.embedTechHatMetadata(origPng, 'image/png', adversarialMeta);
  const injJpg = await injector.embedTechHatMetadata(origJpg, 'image/jpeg', adversarialMeta);

  // Assert findAiMarkers returns 0 detected markers
  const pngMarkers = injector.findAiMarkers(injPng);
  assert.equal(pngMarkers.length, 0, `PNG contains unscrubbed AI markers: ${pngMarkers.join(', ')}`);
  const jpgMarkers = injector.findAiMarkers(injJpg);
  assert.equal(jpgMarkers.length, 0, `JPEG contains unscrubbed AI markers: ${jpgMarkers.join(', ')}`);

  // Assert raw byte strings do not contain forbidden token
  assert.ok(!injPng.toString('latin1').toLowerCase().includes('compositesynthetic'));
  assert.ok(!injJpg.toString('latin1').toLowerCase().includes('compositesynthetic'));
});

test('Injected metadata sanitizes createAgent and create-agent in PNG and JPEG', async () => {
  const origPng = createMinimalPng();
  const origJpg = createMinimalJpeg();

  const adversarialMeta = {
    title: 'Card created by createAgent',
    description: 'Automated create agent and create-agent bot',
    author: 'createAgent'
  };

  const injPng = await injector.embedTechHatMetadata(origPng, 'image/png', adversarialMeta);
  const injJpg = await injector.embedTechHatMetadata(origJpg, 'image/jpeg', adversarialMeta);

  const pngMarkers = injector.findAiMarkers(injPng);
  assert.equal(pngMarkers.length, 0, `PNG contains unscrubbed AI markers: ${pngMarkers.join(', ')}`);
  const jpgMarkers = injector.findAiMarkers(injJpg);
  assert.equal(jpgMarkers.length, 0, `JPEG contains unscrubbed AI markers: ${jpgMarkers.join(', ')}`);

  assert.ok(!injPng.toString('latin1').toLowerCase().includes('createagent'));
  assert.ok(!injJpg.toString('latin1').toLowerCase().includes('createagent'));
});

test('Comprehensive multi-marker adversarial payload sanitizes all 9 forbidden AI tokens simultaneously', async () => {
  const origPng = createMinimalPng();
  const origJpg = createMinimalJpeg();

  const hostileText = 'c2pa synthid ai_generated ai-generated createagent dall-e midjourney stable diffusion compositesynthetic';
  const hostileMeta = {
    title: hostileText,
    description: hostileText,
    author: hostileText,
    copyright: hostileText,
    software: hostileText
  };

  const injPng = await injector.embedTechHatMetadata(origPng, 'image/png', hostileMeta);
  const injJpg = await injector.embedTechHatMetadata(origJpg, 'image/jpeg', hostileMeta);

  const pngMarkers = injector.findAiMarkers(injPng);
  assert.equal(pngMarkers.length, 0, `PNG detected markers: ${pngMarkers.join(', ')}`);
  const jpgMarkers = injector.findAiMarkers(injJpg);
  assert.equal(jpgMarkers.length, 0, `JPEG detected markers: ${jpgMarkers.join(', ')}`);
});

// ======================================================================
// Group 11: Malformed Stream Rejection & Guard Handling (4 tests)
// ======================================================================

test('Throws or rejects gracefully when given a PNG with duplicate/multiple IHDR chunks', async () => {
  const validPng = createMinimalPng();
  const ihdrChunk = validPng.subarray(8, 33);
  const dualIhdrPng = Buffer.concat([
    validPng.subarray(0, 33),
    ihdrChunk,
    validPng.subarray(33)
  ]);

  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(dualIhdrPng, 'image/png');
  }, /multiple IHDR|duplicate IHDR/i);

  assert.throws(() => {
    injector.parsePngMetadata(dualIhdrPng);
  }, /multiple IHDR|duplicate IHDR/i);
});

test('Throws or rejects gracefully when given a PNG missing the terminating IEND chunk', async () => {
  const validPng = createMinimalPng();
  const noIendPng = validPng.subarray(0, validPng.length - 12);

  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(noIendPng, 'image/png');
  }, /missing IEND/i);

  assert.throws(() => {
    injector.parsePngMetadata(noIendPng);
  }, /missing IEND/i);
});

test('Throws or rejects gracefully when given a PNG with dangling trailing bytes at EOF', async () => {
  const validPng = createMinimalPng();
  const danglingPng6 = Buffer.concat([validPng, Buffer.from([0x00, 0x00, 0x00, 0x05, 0x74, 0x45])]);

  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(danglingPng6, 'image/png');
  }, /trailing.*data|truncated.*EOF|extra.*data|unexpected.*EOF/i);

  assert.throws(() => {
    injector.parsePngMetadata(danglingPng6);
  }, /trailing.*data|truncated.*EOF|extra.*data|unexpected.*EOF/i);

  // Also test with single trailing byte
  const danglingPng1 = Buffer.concat([validPng, Buffer.from([0x00])]);
  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(danglingPng1, 'image/png');
  }, /trailing.*data|truncated.*EOF|extra.*data|unexpected.*EOF/i);
});

test('Throws or rejects gracefully when JPEG EXIF metadata payload exceeds 65535 bytes', async () => {
  const validJpg = createMinimalJpeg();
  const oversizedText = 'A'.repeat(70000);

  await assert.rejects(async () => {
    await injector.embedTechHatMetadata(validJpg, 'image/jpeg', {
      description: oversizedText
    });
  }, /exceeds maximum JPEG segment length/i);
});

// ======================================================================
// Group 12: Multi-Page PDF Binary Export & Metadata (Defect #7 Regression)
// ======================================================================

test('buildMultiPagePdf generates valid multi-page PDF 1.4 with DCTDecode JPEG streams, TechHat attribution, Bangla UTF-16BE Title, and zero AI markers', () => {
  assert.equal(typeof injector.buildMultiPagePdf, 'function', 'buildMultiPagePdf must be exported');

  const jpgPage = createMinimalJpeg();
  const pdfU8 = injector.buildMultiPagePdf(
    [
      { jpegBytes: jpgPage, width: 1080, height: 1080 },
      { jpegBytes: jpgPage, width: 1080, height: 1350 },
      { jpegBytes: jpgPage, width: 1200, height: 630 }
    ],
    {
      title: 'জরুরি ব্রেকিং ফটোকার্ড ২০২৬',
      author: 'TechHat Tools (techhat.com.bd)',
      description: 'Created with TechHat Photo Card Studio (https://tools.techhat.com.bd/image/photo-card)',
      copyright: 'TechHat © 2026 (২০২৬). All rights reserved.',
      software: 'TechHat Photo Card Studio 2.0',
      source: 'https://tools.techhat.com.bd/image/photo-card?template=breaking-news',
      url: 'https://techhat.com.bd'
    }
  );

  assert.ok(pdfU8 instanceof Uint8Array, 'buildMultiPagePdf must return Uint8Array');
  const pdfBuf = Buffer.from(pdfU8);
  const latin = pdfBuf.toString('latin1');
  const utf8 = pdfBuf.toString('utf8');

  // 1. Header & EOF markers
  assert.ok(latin.startsWith('%PDF-1.4\n'), 'PDF must start with %PDF-1.4 header');
  assert.ok(latin.endsWith('%%EOF\n'), 'PDF must terminate with %%EOF');

  // 2. Multi-page catalog & 3 distinct page objects + DCTDecode image XObjects
  assert.ok(latin.includes('/Type /Pages /Count 3'), 'Pages tree must declare /Count 3');
  const dctMatches = latin.match(/\/Filter \/DCTDecode/g) || [];
  assert.equal(dctMatches.length, 3, 'Each of the 3 pages must embed a /DCTDecode JPEG XObject');

  // 3. TechHat attribution in both XMP packet and PDF /Info dictionary
  assert.ok(utf8.includes('techhat.com.bd'), 'PDF must contain techhat.com.bd attribution');
  assert.ok(utf8.includes('tools.techhat.com.bd/image/photo-card'), 'PDF must contain Studio deep-link attribution');
  assert.ok(utf8.includes('জরুরি ব্রেকিং ফটোকার্ড ২০২৬'), 'XMP stream must preserve Bangla UTF-8 title');
  assert.ok(/\/Title <FEFF[0-9A-F]+>/.test(latin), 'PDF /Info /Title must encode non-ASCII Bangla text as UTF-16BE BOM hex string');

  // 4. Valid xref table byte offsets
  const xrefIdx = latin.indexOf('\nxref\n');
  assert.ok(xrefIdx > 0, 'PDF must contain xref table');
  const xrefBody = latin.slice(xrefIdx + 6, latin.indexOf('trailer', xrefIdx));
  const xrefLines = xrefBody.replace(/^\n+|\n+$/g, '').split('\n').slice(1);
  assert.ok(xrefLines.length >= 10, 'xref table must list root, pages, 3*(page+content+img), xmp, info');
  for (let i = 1; i < xrefLines.length; i++) {
    assert.equal(xrefLines[i].length, 19, `xref line must have 19 visible chars (+ LF = 20 bytes): "${xrefLines[i]}"`);
    const offset = parseInt(xrefLines[i].slice(0, 10), 10);
    assert.equal(latin.slice(offset, offset + `${i} 0 obj`.length), `${i} 0 obj`, `xref offset for object ${i} must match exact byte position`);
  }

  // 5. Strictly ZERO AI markers
  const aiHits = injector.findAiMarkers(pdfU8);
  assert.equal(aiHits.length, 0, `PDF must contain zero AI markers, found: ${aiHits.join(', ')}`);
});

test('buildMultiPagePdf scrubs adversarial AI tokens from metadata and rejects empty page list', () => {
  const jpgPage = createMinimalJpeg();
  const pdfU8 = injector.buildMultiPagePdf([jpgPage], {
    title: 'Card c2pa synthid ai_generated midjourney dall-e compositeSynthetic createAgent',
    description: 'trainedAlgorithmicMedia stable diffusion'
  });
  assert.equal(injector.findAiMarkers(pdfU8).length, 0, 'All AI markers must be scrubbed from PDF XMP and Info dictionary');

  assert.throws(() => injector.buildMultiPagePdf([]), /at least one page/i);
});

// ======================================================================
// Execution Runner
// ======================================================================

(async () => {
  console.log('Running photo card metadata tests...');
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
      console.log('✓ ' + name);
    } catch (e) {
      console.error('✗ ' + name + '\n  ' + ((e && e.stack) || e));
      process.exitCode = 1;
    }
  }
  console.log(passed + ' photo card metadata tests passed' + (process.exitCode ? ' (with failures)' : ''));
})();
