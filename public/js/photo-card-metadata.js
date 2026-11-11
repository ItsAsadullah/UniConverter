/**
 * TechHat Photo Card Studio — Binary Image Metadata Injector
 * 
 * Implements pure client-side binary PNG (tEXt/iTXt with IEEE 802.3 CRC32)
 * and JPEG (APP1 EXIF TIFF IFD0 and APP1 XMP RDF packet) metadata injection
 * with authentic TechHat attribution and zero AI markers.
 * 
 * Works in both browser DOM and Node.js environments (UMD format).
 */

(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.TechHatPhotoCardMetadata = api;
    root.PhotoCardMetadata = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- Precomputed IEEE 802.3 CRC32 Table (Polynomial: 0xEDB88320) ---
  var crcTable = new Uint32Array(256);
  (function initCrcTable() {
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[i] = c >>> 0;
    }
  })();

  /**
   * Calculate IEEE 802.3 32-bit Cyclic Redundancy Check (CRC32).
   * @param {Uint8Array|Buffer} buf
   * @returns {number} 32-bit unsigned integer
   */
  function calculateCrc32(buf) {
    if (!buf || buf.length === 0) return 0;
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  // --- Cross-Platform Binary / String Helpers ---

  function toUint8Array(data) {
    if (!data) return new Uint8Array(0);
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    return new Uint8Array(0);
  }

  function encodeUtf8(str) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(String(str || ''), 'utf8');
    }
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(String(str || ''));
    }
    var utf8 = [];
    var s = String(str || '');
    for (var i = 0; i < s.length; i++) {
      var charcode = s.charCodeAt(i);
      if (charcode < 0x80) utf8.push(charcode);
      else if (charcode < 0x800) {
        utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
      } else {
        i++;
        charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (s.charCodeAt(i) & 0x3ff));
        utf8.push(
          0xf0 | (charcode >> 18),
          0x80 | ((charcode >> 12) & 0x3f),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f)
        );
      }
    }
    return new Uint8Array(utf8);
  }

  function decodeUtf8(bytes) {
    var u8 = toUint8Array(bytes);
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength).toString('utf8');
    }
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(u8);
    }
    var out = '';
    var i = 0;
    while (i < u8.length) {
      var c = u8[i++];
      if (c < 0x80) out += String.fromCharCode(c);
      else if (c > 0xBF && c < 0xE0) {
        var c2 = u8[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (c2 & 0x3F));
      } else if (c > 0xDF && c < 0xF0) {
        var c2 = u8[i++];
        var c3 = u8[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) | ((c2 & 0x3F) << 6) | (c3 & 0x3F));
      } else {
        var c2 = u8[i++];
        var c3 = u8[i++];
        var c4 = u8[i++];
        var code = (((c & 0x07) << 18) | ((c2 & 0x3F) << 12) | ((c3 & 0x3F) << 6) | (c4 & 0x3F)) - 0x10000;
        out += String.fromCharCode(0xD800 + (code >> 10), 0xDC00 + (code & 0x3FF));
      }
    }
    return out;
  }

  function encodeLatin1(str) {
    var s = String(str || '');
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(s, 'latin1');
    }
    var u8 = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) {
      u8[i] = s.charCodeAt(i) & 0xFF;
    }
    return u8;
  }

  function decodeLatin1(bytes) {
    var u8 = toUint8Array(bytes);
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength).toString('latin1');
    }
    var str = '';
    for (var i = 0; i < u8.length; i++) {
      str += String.fromCharCode(u8[i]);
    }
    return str;
  }

  function concatBuffers(list) {
    var totalLen = 0;
    for (var i = 0; i < list.length; i++) {
      totalLen += list[i].length;
    }
    if (typeof Buffer !== 'undefined') {
      var bufs = [];
      for (var j = 0; j < list.length; j++) {
        bufs.push(Buffer.isBuffer(list[j]) ? list[j] : Buffer.from(list[j].buffer, list[j].byteOffset, list[j].byteLength));
      }
      return Buffer.concat(bufs, totalLen);
    }
    var out = new Uint8Array(totalLen);
    var offset = 0;
    for (var k = 0; k < list.length; k++) {
      out.set(list[k], offset);
      offset += list[k].length;
    }
    return out;
  }

  function writeUInt32BE(target, val, offset) {
    target[offset] = (val >>> 24) & 0xFF;
    target[offset + 1] = (val >>> 16) & 0xFF;
    target[offset + 2] = (val >>> 8) & 0xFF;
    target[offset + 3] = val & 0xFF;
  }

  function readUInt32BE(src, offset) {
    return (
      ((src[offset] << 24) >>> 0) +
      (src[offset + 1] << 16) +
      (src[offset + 2] << 8) +
      src[offset + 3]
    ) >>> 0;
  }

  function writeUInt16BE(target, val, offset) {
    target[offset] = (val >>> 8) & 0xFF;
    target[offset + 1] = val & 0xFF;
  }

  function readUInt16BE(src, offset) {
    return ((src[offset] << 8) | src[offset + 1]) >>> 0;
  }

  function escapeXml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function sanitizeAiText(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/dall[-_\s.]*e(?:\s*\d+)?/gi, 'TechHat Studio')
      .replace(/mid[-_\s]*journey(?:\s*v\d+)?/gi, 'TechHat Studio')
      .replace(/stable[-_\s]*diffusion/gi, 'TechHat Studio')
      .replace(/c2pa/gi, 'techhat')
      .replace(/jumbf/gi, 'techhat')
      .replace(/synth[-_\s]*id/gi, 'techhat')
      .replace(/ai[-_\s]*(?:generated|created|assisted|produced)/gi, 'authentic-web-tool')
      .replace(/composite[-_\s]*synthetic/gi, 'authentic-web-tool')
      .replace(/trained[-_\s]*algorithmic[-_\s]*media/gi, 'authenticWebMedia')
      .replace(/create[-_\s]*agent/gi, 'authentic-web-tool')
      .replace(/digital[-_\s]*source[-_\s]*type/gi, 'MediaSourceType');
  }

  function formatExifDate(d) {
    var date = (d instanceof Date && !isNaN(d)) ? d : new Date(d);
    if (isNaN(date.getTime())) date = new Date();
    var Y = date.getUTCFullYear();
    var M = String(date.getUTCMonth() + 1).padStart(2, '0');
    var D = String(date.getUTCDate()).padStart(2, '0');
    var h = String(date.getUTCHours()).padStart(2, '0');
    var m = String(date.getUTCMinutes()).padStart(2, '0');
    var s = String(date.getUTCSeconds()).padStart(2, '0');
    return Y + ':' + M + ':' + D + ' ' + h + ':' + m + ':' + s;
  }

  // --- Metadata Sanitization & Defaults ---

  /**
   * Sanitizes and applies authentic TechHat defaults to metadata dictionary.
   * Drops AI markers and scrubs synthetic generation tags.
   */
  function cleanMetadata(meta) {
    var src = meta || {};
    var rawTitle = src.title != null ? String(src.title) : 'টেকহ্যাট ফটোকার্ড - TechHat Photo Card';
    var rawAuthor = src.author != null ? String(src.author) : 'TechHat (techhat.com.bd)';
    var rawDesc = src.description != null ? String(src.description) : 'Created with TechHat Photo Card Studio (https://tools.techhat.com.bd/image/photo-card). Authentic digital banner and photo card generator.';
    var rawCopy = src.copyright != null ? String(src.copyright) : 'Copyright © 2026 TechHat (techhat.com.bd). All rights reserved.';
    var rawSoftware = src.software != null ? String(src.software) : 'TechHat Photo Card Studio 2.0';
    var rawSource = src.source != null ? String(src.source) : 'https://techhat.com.bd';
    var rawUrl = src.url != null ? String(src.url) : 'https://tools.techhat.com.bd/image/photo-card';
    var rawDate = src.creationDate != null ? String(src.creationDate) : new Date().toISOString();
    var cleanDate = '';
    if (rawDate !== '') {
      var parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        cleanDate = parsedDate.toISOString();
      } else {
        cleanDate = sanitizeAiText(rawDate);
      }
    }
    cleanDate = sanitizeAiText(cleanDate);

    return {
      title: sanitizeAiText(rawTitle),
      author: sanitizeAiText(rawAuthor),
      description: sanitizeAiText(rawDesc),
      copyright: sanitizeAiText(rawCopy),
      software: sanitizeAiText(rawSoftware),
      source: sanitizeAiText(rawSource),
      url: sanitizeAiText(rawUrl),
      creationDate: cleanDate,
      dateTime: formatExifDate(cleanDate || rawDate)
    };
  }

  // --- PNG Chunk Builders ---

  /**
   * Create standard PNG tEXt chunk.
   * Format: [4 len] + 'tEXt' + [keyword] + 0x00 + [latin1 text] + [4 crc]
   */
  function createPngTextChunk(keyword, text) {
    var kw = String(keyword || '');
    if (kw.length < 1 || kw.length > 79) {
      throw new Error('PNG chunk keyword must be between 1 and 79 characters');
    }
    if (kw.indexOf('\0') !== -1) {
      throw new Error('PNG chunk keyword must not contain null characters');
    }
    var kwBuf = encodeLatin1(kw);
    var txtBuf = encodeLatin1(String(text || ''));
    var nullBuf = new Uint8Array([0x00]);
    var payload = concatBuffers([kwBuf, nullBuf, txtBuf]);

    var typeBuf = encodeLatin1('tEXt');
    var crcPayload = concatBuffers([typeBuf, payload]);
    var crc = calculateCrc32(crcPayload);

    var lenBuf = new Uint8Array(4);
    writeUInt32BE(lenBuf, payload.length, 0);

    var crcBuf = new Uint8Array(4);
    writeUInt32BE(crcBuf, crc, 0);

    return concatBuffers([lenBuf, typeBuf, payload, crcBuf]);
  }

  /**
   * Create standard PNG iTXt international UTF-8 chunk.
   * Format: [4 len] + 'iTXt' + [keyword] + 0x00 + 0x00 + 0x00 + [langTag] + 0x00 + [transKeyword] + 0x00 + [utf8 text] + [4 crc]
   */
  function createPngItxtChunk(keyword, text, langTag) {
    var kw = String(keyword || '');
    if (kw.length < 1 || kw.length > 79) {
      throw new Error('PNG chunk keyword must be between 1 and 79 characters');
    }
    if (kw.indexOf('\0') !== -1) {
      throw new Error('PNG chunk keyword must not contain null characters');
    }
    var kwBuf = encodeLatin1(kw);
    var langBuf = encodeLatin1(String(langTag != null ? langTag : ''));
    var txtBuf = encodeUtf8(String(text || ''));

    // keyword + null(0x00) + compFlag(0x00) + compMethod(0x00) + langTag + null(0x00) + transKeyword("") + null(0x00) + utf8Text
    var header = new Uint8Array([0x00, 0x00, 0x00]);
    var sep1 = new Uint8Array([0x00]);
    var sep2 = new Uint8Array([0x00]);

    var payload = concatBuffers([kwBuf, header, langBuf, sep1, sep2, txtBuf]);

    var typeBuf = encodeLatin1('iTXt');
    var crcPayload = concatBuffers([typeBuf, payload]);
    var crc = calculateCrc32(crcPayload);

    var lenBuf = new Uint8Array(4);
    writeUInt32BE(lenBuf, payload.length, 0);

    var crcBuf = new Uint8Array(4);
    writeUInt32BE(crcBuf, crc, 0);

    return concatBuffers([lenBuf, typeBuf, payload, crcBuf]);
  }

  // --- PNG Metadata Injection ---

  var PNG_SIGNATURE_HEX = '89504e470d0a1a0a';
  var KNOWN_METADATA_KEYS = {
    title: true,
    author: true,
    description: true,
    copyright: true,
    software: true,
    source: true,
    url: true,
    'creation time': true
  };

  /**
   * Embeds TechHat attribution into a PNG byte stream.
   * Inserts tEXt and iTXt chunks immediately after IHDR and before IDAT.
   * Re-injection strips prior TechHat chunks without duplication.
   */
  function embedPngMetadata(inputBuf, metadata) {
    var buf = toUint8Array(inputBuf);
    if (!buf || buf.length < 8) {
      throw new Error('Invalid PNG buffer: buffer too small (< 8 bytes)');
    }
    var sigHex = '';
    for (var i = 0; i < 8; i++) {
      sigHex += buf[i].toString(16).padStart(2, '0');
    }
    if (sigHex !== PNG_SIGNATURE_HEX) {
      throw new Error('Invalid PNG signature: expected 89504e470d0a1a0a');
    }
    if (buf.length < 33) {
      throw new Error('Invalid PNG buffer: truncated IHDR chunk');
    }

    var firstChunkLen = readUInt32BE(buf, 8);
    var firstChunkType = decodeLatin1(buf.subarray(12, 16));
    if (firstChunkType !== 'IHDR' || firstChunkLen !== 13) {
      throw new Error('Invalid PNG: first chunk must be 13-byte IHDR');
    }

    var ihdrEnd = 8 + 12 + firstChunkLen; // 33
    var ihdrChunk = buf.subarray(8, ihdrEnd);

    // Collect non-metadata chunks after IHDR
    var otherChunks = [];
    var offset = ihdrEnd;
    var hasIend = false;

    while (offset + 12 <= buf.length) {
      var chunkLen = readUInt32BE(buf, offset);
      var chunkEnd = offset + 12 + chunkLen;
      if (chunkEnd > buf.length) {
        throw new Error('Invalid PNG: chunk boundary exceeds file buffer');
      }
      var chunkType = decodeLatin1(buf.subarray(offset + 4, offset + 8));
      var chunkData = buf.subarray(offset + 8, offset + 8 + chunkLen);

      if (chunkType === 'IHDR') {
        throw new Error('Invalid PNG: multiple IHDR chunks');
      }
      if (hasIend) {
        throw new Error('Invalid PNG: chunk found after IEND');
      }
      if (chunkType === 'IEND') {
        hasIend = true;
      }

      var isMetadata = false;
      if (chunkType === 'tEXt' || chunkType === 'iTXt' || chunkType === 'zTXt') {
        var nullPos = -1;
        for (var n = 0; n < chunkData.length; n++) {
          if (chunkData[n] === 0x00) { nullPos = n; break; }
        }
        if (nullPos > 0) {
          var kw = decodeLatin1(chunkData.subarray(0, nullPos)).toLowerCase();
          if (KNOWN_METADATA_KEYS[kw] || kw === 'parameters' || kw === 'prompt' || kw === 'workflow') {
            isMetadata = true;
          }
        }
        if (!isMetadata && findAiMarkers(chunkData).length > 0) {
          isMetadata = true;
        }
      } else if (chunkType === 'c2pa') {
        // Discard any C2PA AI chunk
        isMetadata = true;
      }

      if (!isMetadata) {
        otherChunks.push(buf.subarray(offset, chunkEnd));
      }
      offset = chunkEnd;
    }

    if (offset < buf.length) {
      throw new Error('Invalid PNG: trailing truncated data at EOF');
    }
    if (!hasIend) {
      throw new Error('Invalid PNG: missing IEND chunk');
    }

    var meta = cleanMetadata(metadata);

    // Build fresh injected metadata chunks
    var injected = [
      createPngTextChunk('Software', meta.software),
      createPngTextChunk('Source', meta.source),
      createPngTextChunk('URL', meta.url),
      createPngTextChunk('Creation Time', meta.creationDate),
      createPngItxtChunk('Author', meta.author, 'bn'),
      createPngItxtChunk('Title', meta.title, 'bn'),
      createPngItxtChunk('Description', meta.description, 'bn'),
      createPngItxtChunk('Copyright', meta.copyright, 'bn')
    ];

    var parts = [buf.subarray(0, 8), ihdrChunk];
    for (var j = 0; j < injected.length; j++) parts.push(injected[j]);
    for (var k = 0; k < otherChunks.length; k++) parts.push(otherChunks[k]);

    return concatBuffers(parts);
  }

  // --- JPEG Metadata Builders ---

  /**
   * Build canonical Adobe XMP XML packet.
   */
  function buildXmpPacket(metadata) {
    var m = cleanMetadata(metadata);
    var escapedTitle = escapeXml(m.title);
    var escapedAuthor = escapeXml(m.author);
    var escapedDescription = escapeXml(m.description);
    var escapedCopyright = escapeXml(m.copyright);
    var escapedSoftware = escapeXml(m.software);
    var escapedCreationDate = escapeXml(m.creationDate);
    var escapedSource = escapeXml(m.source);
    var escapedUrl = escapeXml(m.url);

    return '<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>\n' +
      '<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="XMP Core 6.0.0">\n' +
      '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' +
      '    <rdf:Description rdf:about=""\n' +
      '      xmlns:dc="http://purl.org/dc/elements/1.1/"\n' +
      '      xmlns:xmp="http://ns.adobe.com/xap/1.0/"\n' +
      '      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"\n' +
      '      xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">\n' +
      '      <dc:title>\n' +
      '        <rdf:Alt><rdf:li xml:lang="x-default">' + escapedTitle + '</rdf:li></rdf:Alt>\n' +
      '      </dc:title>\n' +
      '      <dc:creator>\n' +
      '        <rdf:Seq><rdf:li>' + escapedAuthor + '</rdf:li></rdf:Seq>\n' +
      '      </dc:creator>\n' +
      '      <dc:description>\n' +
      '        <rdf:Alt><rdf:li xml:lang="x-default">' + escapedDescription + '</rdf:li></rdf:Alt>\n' +
      '      </dc:description>\n' +
      '      <dc:rights>\n' +
      '        <rdf:Alt><rdf:li xml:lang="x-default">' + escapedCopyright + '</rdf:li></rdf:Alt>\n' +
      '      </dc:rights>\n' +
      '      <xmp:CreatorTool>' + escapedSoftware + '</xmp:CreatorTool>\n' +
      '      <xmp:CreateDate>' + escapedCreationDate + '</xmp:CreateDate>\n' +
      '      <xmp:BaseURL>' + escapedUrl + '</xmp:BaseURL>\n' +
      '      <photoshop:Source>' + escapedSource + '</photoshop:Source>\n' +
      '      <xmpRights:WebStatement>' + escapedUrl + '</xmpRights:WebStatement>\n' +
      '      <xmpRights:Marked>True</xmpRights:Marked>\n' +
      '    </rdf:Description>\n' +
      '  </rdf:RDF>\n' +
      '</x:xmpmeta>\n' +
      '<?xpacket end="w"?>';
  }

  /**
   * Build complete JPEG APP1 XMP segment.
   */
  function buildXmpSegment(metadata) {
    var xmpXml = buildXmpPacket(metadata);
    var xmpXmlBytes = encodeUtf8(xmpXml);
    var nsBytes = encodeLatin1('http://ns.adobe.com/xap/1.0/\0'); // 29 bytes

    var payload = concatBuffers([nsBytes, xmpXmlBytes]);
    var segLen = 2 + payload.length;
    if (segLen > 65535) {
      throw new Error('XMP payload exceeds maximum JPEG segment length (65535 bytes)');
    }

    var marker = new Uint8Array([0xFF, 0xE1]);
    var lenBuf = new Uint8Array(2);
    writeUInt16BE(lenBuf, segLen, 0);

    return concatBuffers([marker, lenBuf, payload]);
  }

  /**
   * Build complete JPEG APP1 EXIF segment with Big-Endian TIFF IFD0.
   */
  function buildExifSegment(metadata) {
    var m = cleanMetadata(metadata);

    // Tags sorted strictly ascending by tag ID:
    // 0x010E (ImageDescription, ASCII, type 2)
    // 0x0112 (Orientation, SHORT, type 3, value 1)
    // 0x0131 (Software, ASCII, type 2)
    // 0x0132 (DateTime, ASCII, type 2, count 20)
    // 0x013B (Artist, ASCII, type 2)
    // 0x8298 (Copyright, ASCII, type 2)
    var tags = [
      { id: 0x010E, type: 2, val: m.description },
      { id: 0x0112, type: 3, val: 1 },
      { id: 0x0131, type: 2, val: m.software },
      { id: 0x0132, type: 2, val: m.dateTime },
      { id: 0x013B, type: 2, val: m.author.indexOf('Studio') !== -1 ? m.author : 'TechHat Studio (' + m.author + ')' },
      { id: 0x8298, type: 2, val: m.copyright }
    ];

    var ifdOffset = 8;
    var numEntries = tags.length;
    var heapOffset = ifdOffset + 2 + numEntries * 12 + 4;

    var heap = [];
    var currHeapOffset = heapOffset;
    var ifdEntries = [];

    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      if (t.type === 2) {
        var strBytes = encodeLatin1(String(t.val || '') + '\0');
        var count = strBytes.length;
        if (count <= 4) {
          var valBuf = new Uint8Array(4);
          valBuf.set(strBytes, 0);
          ifdEntries.push({ id: t.id, type: 2, count: count, offsetOrVal: readUInt32BE(valBuf, 0) });
        } else {
          ifdEntries.push({ id: t.id, type: 2, count: count, offsetOrVal: currHeapOffset });
          heap.push(strBytes);
          currHeapOffset += strBytes.length;
        }
      } else if (t.type === 3) {
        ifdEntries.push({ id: t.id, type: 3, count: 1, offsetOrVal: (t.val << 16) >>> 0 });
      }
    }

    if (currHeapOffset > 65527) {
      throw new Error('EXIF payload exceeds maximum JPEG segment length (65535 bytes)');
    }

    var tiffBuf = new Uint8Array(currHeapOffset);
    tiffBuf[0] = 0x4D; // 'M'
    tiffBuf[1] = 0x4D; // 'M'
    writeUInt16BE(tiffBuf, 42, 2);
    writeUInt32BE(tiffBuf, ifdOffset, 4);
    writeUInt16BE(tiffBuf, numEntries, ifdOffset);

    var pos = ifdOffset + 2;
    for (var e = 0; e < ifdEntries.length; e++) {
      var item = ifdEntries[e];
      writeUInt16BE(tiffBuf, item.id, pos);
      writeUInt16BE(tiffBuf, item.type, pos + 2);
      writeUInt32BE(tiffBuf, item.count, pos + 4);
      writeUInt32BE(tiffBuf, item.offsetOrVal, pos + 8);
      pos += 12;
    }
    writeUInt32BE(tiffBuf, 0, pos); // next IFD

    pos = heapOffset;
    for (var h = 0; h < heap.length; h++) {
      tiffBuf.set(heap[h], pos);
      pos += heap[h].length;
    }

    var exifId = encodeLatin1('Exif\0\0'); // 6 bytes
    var payload = concatBuffers([exifId, tiffBuf]);
    var segLen = 2 + payload.length;
    if (segLen > 65535) {
      throw new Error('EXIF payload exceeds maximum JPEG segment length (65535 bytes)');
    }

    var marker = new Uint8Array([0xFF, 0xE1]);
    var lenBuf = new Uint8Array(2);
    writeUInt16BE(lenBuf, segLen, 0);

    return concatBuffers([marker, lenBuf, payload]);
  }

  // --- JPEG Metadata Injection ---

  /**
   * Embeds TechHat attribution into a JPEG byte stream.
   * Inserts APP1 EXIF and APP1 XMP segments immediately after SOI/APP0.
   */
  function embedJpegMetadata(inputBuf, metadata) {
    var buf = toUint8Array(inputBuf);
    if (!buf || buf.length < 2) {
      throw new Error('Invalid JPEG buffer: buffer too small (< 2 bytes)');
    }
    if (buf[0] !== 0xFF || buf[1] !== 0xD8) {
      throw new Error('Invalid JPEG buffer: missing SOI marker (0xFFD8)');
    }

    var app0Segment = null;
    var otherSegments = [];
    var offset = 2;

    while (offset < buf.length) {
      if (buf[offset] !== 0xFF) break;
      var marker = buf[offset + 1];

      // EOI (0xD9) or SOS (0xDA)
      if (marker === 0xD9 || marker === 0xDA) {
        otherSegments.push(buf.subarray(offset));
        break;
      }

      if (offset + 4 > buf.length) {
        throw new Error('Invalid JPEG buffer: truncated segment length');
      }
      var segLen = readUInt16BE(buf, offset + 2);
      var segEnd = offset + 2 + segLen;
      if (segEnd > buf.length) {
        throw new Error('Invalid JPEG buffer: segment length exceeds buffer size');
      }

      var segPayload = buf.subarray(offset + 4, segEnd);

      if (marker === 0xE0 && offset === 2) {
        // APP0 right after SOI
        app0Segment = buf.subarray(offset, segEnd);
      } else if (marker === 0xE1) {
        // Check if existing APP1 EXIF or XMP
        var id6 = decodeLatin1(segPayload.subarray(0, 6));
        var id29 = decodeLatin1(segPayload.subarray(0, 29));
        if (id6 !== 'Exif\0\0' && id29 !== 'http://ns.adobe.com/xap/1.0/\0') {
          otherSegments.push(buf.subarray(offset, segEnd));
        }
      } else if (marker === 0xEB) {
        // Discard C2PA APP11 markers
      } else {
        otherSegments.push(buf.subarray(offset, segEnd));
      }
      offset = segEnd;
    }

    var exifSeg = buildExifSegment(metadata);
    var xmpSeg = buildXmpSegment(metadata);

    var parts = [buf.subarray(0, 2)]; // SOI
    if (app0Segment) parts.push(app0Segment);
    parts.push(exifSeg);
    parts.push(xmpSeg);
    for (var k = 0; k < otherSegments.length; k++) {
      parts.push(otherSegments[k]);
    }

    return concatBuffers(parts);
  }

  // --- Master Async API ---

  /**
   * Master image metadata injector conforming to Project Metadata Embedding Contract.
   * Pure client-side binary stream manipulation.
   * 
   * @param {Blob|Buffer|Uint8Array|ArrayBuffer} input
   * @param {string} mimeType 'image/png' or 'image/jpeg'
   * @param {object} [metadata]
   * @returns {Promise<Blob|Buffer|Uint8Array>}
   */
  async function embedTechHatMetadata(input, mimeType, metadata) {
    if (!input) {
      throw new Error('Image input is null or undefined');
    }

    var isBlob = (typeof Blob !== 'undefined' && input instanceof Blob);
    var isNodeBuffer = (typeof Buffer !== 'undefined' && Buffer.isBuffer(input));
    var isUint8Array = (input instanceof Uint8Array && !isNodeBuffer);
    var isArrayBuffer = (input instanceof ArrayBuffer);

    var rawBytes;
    if (isBlob) {
      if (input.size === 0) {
        throw new Error('Image input is empty or zero-length blob');
      }
      var ab = await input.arrayBuffer();
      rawBytes = new Uint8Array(ab);
    } else {
      rawBytes = toUint8Array(input);
      if (rawBytes.length === 0) {
        throw new Error('Image input is empty or zero-length buffer');
      }
    }

    var mime = String(mimeType || '').trim().toLowerCase();
    var resultBytes;

    if (mime === 'image/png') {
      resultBytes = embedPngMetadata(rawBytes, metadata);
    } else if (mime === 'image/jpeg' || mime === 'image/jpg') {
      resultBytes = embedJpegMetadata(rawBytes, metadata);
    } else {
      throw new Error('Unsupported MIME type: ' + mimeType + ' (supported: image/png, image/jpeg)');
    }

    if (isBlob) {
      return new Blob([resultBytes], { type: mime === 'image/jpg' ? 'image/jpeg' : mime });
    }
    if (isNodeBuffer && typeof Buffer !== 'undefined') {
      return Buffer.isBuffer(resultBytes) ? resultBytes : Buffer.from(resultBytes.buffer, resultBytes.byteOffset, resultBytes.byteLength);
    }
    if (isUint8Array) {
      return new Uint8Array(resultBytes.buffer, resultBytes.byteOffset, resultBytes.byteLength);
    }
    if (isArrayBuffer) {
      return resultBytes.buffer.slice(resultBytes.byteOffset, resultBytes.byteOffset + resultBytes.byteLength);
    }
    return resultBytes;
  }

  // --- Diagnostic & Verification Parsers ---

  /**
   * Diagnostic parser extracting PNG chunks and text tags.
   */
  function parsePngMetadata(bufInput) {
    var buf = toUint8Array(bufInput);
    var chunks = [];
    var tags = {};

    var sigHex = '';
    for (var i = 0; i < 8; i++) sigHex += buf[i].toString(16).padStart(2, '0');
    if (sigHex !== PNG_SIGNATURE_HEX) {
      throw new Error('Invalid PNG signature');
    }

    var offset = 8;
    var seenIhdr = false;
    var hasIend = false;

    while (offset + 12 <= buf.length) {
      var len = readUInt32BE(buf, offset);
      if (offset + 12 + len > buf.length) {
        throw new Error('Invalid PNG: chunk boundary exceeds file buffer');
      }
      var type = decodeLatin1(buf.subarray(offset + 4, offset + 8));
      var data = buf.subarray(offset + 8, offset + 8 + len);
      var crc = readUInt32BE(buf, offset + 8 + len);

      if (type === 'IHDR') {
        if (seenIhdr) {
          throw new Error('Invalid PNG: multiple IHDR chunks');
        }
        seenIhdr = true;
      }
      if (hasIend) {
        throw new Error('Invalid PNG: chunk found after IEND');
      }
      if (type === 'IEND') {
        hasIend = true;
      }

      var calcCrc = calculateCrc32(buf.subarray(offset + 4, offset + 8 + len));
      if (calcCrc !== crc) {
        throw new Error('CRC32 mismatch on chunk ' + type + ': expected ' + crc + ' got ' + calcCrc);
      }

      chunks.push({ type: type, len: len, offset: offset, crc: crc });

      if (type === 'tEXt') {
        var nullIdx = -1;
        for (var n = 0; n < data.length; n++) {
          if (data[n] === 0x00) { nullIdx = n; break; }
        }
        if (nullIdx > 0) {
          var kw = decodeLatin1(data.subarray(0, nullIdx));
          var val = decodeLatin1(data.subarray(nullIdx + 1));
          tags[kw] = val;
        }
      } else if (type === 'iTXt') {
        var nullIdx1 = -1;
        for (var n1 = 0; n1 < data.length; n1++) {
          if (data[n1] === 0x00) { nullIdx1 = n1; break; }
        }
        if (nullIdx1 > 0) {
          var kw1 = decodeLatin1(data.subarray(0, nullIdx1));
          var pos = nullIdx1 + 3; // kw + null + compFlag + compMethod
          var nullIdx2 = -1;
          for (var n2 = pos; n2 < data.length; n2++) {
            if (data[n2] === 0x00) { nullIdx2 = n2; break; }
          }
          var langTag = (nullIdx2 > pos) ? decodeLatin1(data.subarray(pos, nullIdx2)) : '';
          pos = nullIdx2 + 1;
          var nullIdx3 = -1;
          for (var n3 = pos; n3 < data.length; n3++) {
            if (data[n3] === 0x00) { nullIdx3 = n3; break; }
          }
          pos = nullIdx3 + 1;
          var textVal = decodeUtf8(data.subarray(pos));
          tags[kw1] = textVal;
          tags[kw1 + ':lang'] = langTag;
        }
      }
      offset += 12 + len;
    }

    if (offset < buf.length) {
      throw new Error('Invalid PNG: trailing truncated data at EOF');
    }
    if (!hasIend) {
      throw new Error('Invalid PNG: missing IEND chunk');
    }

    return { chunks: chunks, tags: tags };
  }

  /**
   * Diagnostic parser extracting JPEG APP1 segments (EXIF payload and XMP payload).
   */
  function parseJpegMetadata(bufInput) {
    var buf = toUint8Array(bufInput);
    if (buf[0] !== 0xFF || buf[1] !== 0xD8) {
      throw new Error('Invalid JPEG: missing SOI');
    }

    var offset = 2;
    var exifPayload = null;
    var xmpPayload = null;
    var xmpString = null;
    var segments = [];

    while (offset < buf.length - 1) {
      if (buf[offset] !== 0xFF) break;
      var marker = buf[offset + 1];
      if (marker === 0xD9 || marker === 0xDA) {
        segments.push({ marker: marker, offset: offset });
        break;
      }
      var segLen = readUInt16BE(buf, offset + 2);
      var segEnd = offset + 2 + segLen;
      var payload = buf.subarray(offset + 4, segEnd);
      segments.push({ marker: marker, offset: offset, len: segLen });

      if (marker === 0xE1) {
        var id6 = decodeLatin1(payload.subarray(0, 6));
        var id29 = decodeLatin1(payload.subarray(0, 29));
        if (id6 === 'Exif\0\0') {
          var rawExif = payload.subarray(6);
          exifPayload = (typeof Buffer !== 'undefined') ? Buffer.from(rawExif.buffer, rawExif.byteOffset, rawExif.byteLength) : rawExif;
        } else if (id29 === 'http://ns.adobe.com/xap/1.0/\0') {
          var rawXmp = payload.subarray(29);
          xmpPayload = (typeof Buffer !== 'undefined') ? Buffer.from(rawXmp.buffer, rawExif ? rawXmp.byteOffset : rawXmp.byteOffset, rawXmp.byteLength) : rawXmp;
          xmpString = decodeUtf8(xmpPayload);
        }
      }
      offset = segEnd;
    }

    return { exifPayload: exifPayload, xmpPayload: xmpPayload, xmpString: xmpString, segments: segments };
  }

  /**
   * Decodes TIFF IFD0 tags from EXIF payload buffer.
   */
  function parseExifTags(exifPayload) {
    if (!exifPayload || exifPayload.length < 8) {
      throw new Error('Invalid EXIF payload');
    }
    var byteOrder = decodeLatin1(exifPayload.subarray(0, 2));
    var isBigEndian = (byteOrder === 'MM');
    if (!isBigEndian && byteOrder !== 'II') {
      throw new Error('Invalid TIFF byte order: ' + byteOrder);
    }
    var magic = isBigEndian ? readUInt16BE(exifPayload, 2) : (exifPayload[2] | (exifPayload[3] << 8));
    if (magic !== 42) {
      throw new Error('Invalid TIFF magic: ' + magic);
    }
    var ifd0Offset = isBigEndian ? readUInt32BE(exifPayload, 4) : (
      exifPayload[4] | (exifPayload[5] << 8) | (exifPayload[6] << 16) | (exifPayload[7] << 24)
    );
    var numEntries = isBigEndian ? readUInt16BE(exifPayload, ifd0Offset) : (
      exifPayload[ifd0Offset] | (exifPayload[ifd0Offset + 1] << 8)
    );

    var tags = {};
    var lastTagId = -1;

    for (var i = 0; i < numEntries; i++) {
      var entryPos = ifd0Offset + 2 + i * 12;
      var tagId = isBigEndian ? readUInt16BE(exifPayload, entryPos) : (
        exifPayload[entryPos] | (exifPayload[entryPos + 1] << 8)
      );
      if (tagId <= lastTagId) {
        throw new Error('TIFF IFD0 entries are not strictly sorted ascending by tag ID: ' + tagId + ' <= ' + lastTagId);
      }
      lastTagId = tagId;

      var type = isBigEndian ? readUInt16BE(exifPayload, entryPos + 2) : (
        exifPayload[entryPos + 2] | (exifPayload[entryPos + 3] << 8)
      );
      var count = isBigEndian ? readUInt32BE(exifPayload, entryPos + 4) : (
        exifPayload[entryPos + 4] | (exifPayload[entryPos + 5] << 8) | (exifPayload[entryPos + 6] << 16) | (exifPayload[entryPos + 7] << 24)
      );

      var hexKey = '0x' + tagId.toString(16).padStart(4, '0').toUpperCase();

      if (type === 2) { // ASCII
        var strOffset = (count <= 4) ? (entryPos + 8) : (
          isBigEndian ? readUInt32BE(exifPayload, entryPos + 8) : (
            exifPayload[entryPos + 8] | (exifPayload[entryPos + 9] << 8) | (exifPayload[entryPos + 10] << 16) | (exifPayload[entryPos + 11] << 24)
          )
        );
        var strBytes = exifPayload.subarray(strOffset, strOffset + count - 1); // omit null terminator
        tags[hexKey] = decodeLatin1(strBytes);
      } else if (type === 3) { // SHORT
        var val = isBigEndian ? readUInt16BE(exifPayload, entryPos + 8) : (
          exifPayload[entryPos + 8] | (exifPayload[entryPos + 9] << 8)
        );
        tags[hexKey] = val;
      }
    }

    return tags;
  }

  /**
   * Scans binary image buffer for forbidden AI attribution markers.
   * @param {Uint8Array|Buffer} bufInput
   * @returns {string[]} Array of detected AI markers
   */
  function findAiMarkers(bufInput) {
    var raw = decodeLatin1(toUint8Array(bufInput)).toLowerCase();
    var forbidden = [
      'c2pa',
      'synthid',
      'ai_generated',
      'ai-generated',
      'createagent',
      'dall-e',
      'midjourney',
      'stable diffusion',
      'compositesynthetic'
    ];
    var detected = [];
    for (var i = 0; i < forbidden.length; i++) {
      if (raw.indexOf(forbidden[i]) !== -1) {
        detected.push(forbidden[i]);
      }
    }
    return detected;
  }

  function pdfEscapeLiteral(str) {
    return String(str || '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n');
  }

  function pdfEncodeString(str) {
    var s = sanitizeAiText(String(str || ''));
    if (/^[\x20-\x7E]*$/.test(s)) {
      return '(' + pdfEscapeLiteral(s) + ')';
    }
    var hex = 'FEFF';
    for (var i = 0; i < s.length; i++) {
      hex += s.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0');
    }
    return '<' + hex + '>';
  }

  function formatPdfDate(isoStr) {
    var d = isoStr ? new Date(isoStr) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var Y = d.getUTCFullYear();
    var M = String(d.getUTCMonth() + 1).padStart(2, '0');
    var D = String(d.getUTCDate()).padStart(2, '0');
    var h = String(d.getUTCHours()).padStart(2, '0');
    var m = String(d.getUTCMinutes()).padStart(2, '0');
    var s = String(d.getUTCSeconds()).padStart(2, '0');
    return 'D:' + Y + M + D + h + m + s + 'Z';
  }

  /**
   * Builds a standards-compliant multi-page PDF 1.4 binary document from an array
   * of JPEG page images ({ jpegBytes, width, height }) with authentic TechHat
   * /Info dictionary + XMP metadata and zero AI attribution markers.
   *
   * @param {Array<{jpegBytes: Uint8Array|Buffer, width: number, height: number}>} pagesInput
   * @param {Object} [metadata]
   * @returns {Uint8Array|Buffer}
   */
  function buildMultiPagePdf(pagesInput, metadata) {
    if (!Array.isArray(pagesInput) || pagesInput.length === 0) {
      throw new Error('buildMultiPagePdf requires at least one page object');
    }
    var m = cleanMetadata(metadata);
    var pageCount = pagesInput.length;
    var metaStreamObjId = 3 + pageCount * 3;
    var infoObjId = 4 + pageCount * 3;
    var totalObjs = infoObjId;

    var chunks = [];
    var byteLen = 0;
    var offsets = new Array(totalObjs + 1);

    function pushBytes(u8) {
      var arr = toUint8Array(u8);
      chunks.push(arr);
      byteLen += arr.length;
    }

    function pushAscii(str) {
      pushBytes(encodeLatin1(str));
    }

    // PDF 1.4 header + 4 high-bit binary indicator bytes
    pushBytes(new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A,
      0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A
    ]));

    // Object 1: Catalog
    offsets[1] = byteLen;
    pushAscii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R /Metadata ' + metaStreamObjId + ' 0 R >>\nendobj\n');

    // Object 2: Pages root
    var kidsRefs = [];
    for (var p = 0; p < pageCount; p++) {
      kidsRefs.push((3 + p * 3) + ' 0 R');
    }
    offsets[2] = byteLen;
    pushAscii('2 0 obj\n<< /Type /Pages /Count ' + pageCount + ' /Kids [ ' + kidsRefs.join(' ') + ' ] >>\nendobj\n');

    // Per-page objects: Page + DCTDecode Image XObject + Content Stream
    for (var idx = 0; idx < pageCount; idx++) {
      var pg = pagesInput[idx] || {};
      var isDirectBuf = (pg instanceof Uint8Array) || (typeof ArrayBuffer !== 'undefined' && pg instanceof ArrayBuffer);
      var jpegBytes = isDirectBuf ? toUint8Array(pg) : toUint8Array(pg.jpegBytes || pg.bytes || pg.data);
      if (!jpegBytes || jpegBytes.length < 4 || jpegBytes[0] !== 0xFF || jpegBytes[1] !== 0xD8) {
        throw new Error('Page ' + (idx + 1) + ' must provide valid JPEG binary bytes for /DCTDecode');
      }
      var sofW = 0;
      var sofH = 0;
      for (var sp = 2; sp + 8 < jpegBytes.length; sp++) {
        if (jpegBytes[sp] === 0xFF && (jpegBytes[sp + 1] === 0xC0 || jpegBytes[sp + 1] === 0xC2)) {
          sofH = (jpegBytes[sp + 5] << 8) | jpegBytes[sp + 6];
          sofW = (jpegBytes[sp + 7] << 8) | jpegBytes[sp + 8];
          break;
        }
      }
      var W = Math.max(1, Math.round(Number(!isDirectBuf && pg.width) || sofW || 1080));
      var H = Math.max(1, Math.round(Number(!isDirectBuf && pg.height) || sofH || 1080));
      var pageObjId = 3 + idx * 3;
      var imgObjId = 4 + idx * 3;
      var cntObjId = 5 + idx * 3;

      offsets[pageObjId] = byteLen;
      pushAscii(
        pageObjId + ' 0 obj\n' +
        '<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ' + W + ' ' + H + ' ] ' +
        '/Resources << /ProcSet [ /PDF /ImageC ] /XObject << /Im0 ' + imgObjId + ' 0 R >> >> ' +
        '/Contents ' + cntObjId + ' 0 R >>\n' +
        'endobj\n'
      );

      offsets[imgObjId] = byteLen;
      pushAscii(
        imgObjId + ' 0 obj\n' +
        '<< /Type /XObject /Subtype /Image /Width ' + W + ' /Height ' + H +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegBytes.length + ' >>\n' +
        'stream\n'
      );
      pushBytes(jpegBytes);
      pushAscii('\nendstream\nendobj\n');

      var contentCmd = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q\n';
      var contentBytes = encodeLatin1(contentCmd);
      offsets[cntObjId] = byteLen;
      pushAscii(cntObjId + ' 0 obj\n<< /Length ' + contentBytes.length + ' >>\nstream\n');
      pushBytes(contentBytes);
      pushAscii('\nendstream\nendobj\n');
    }

    // XMP Metadata stream object
    var xmpBytes = encodeUtf8(buildXmpPacket(m));
    offsets[metaStreamObjId] = byteLen;
    pushAscii(
      metaStreamObjId + ' 0 obj\n' +
      '<< /Type /Metadata /Subtype /XML /Length ' + xmpBytes.length + ' >>\n' +
      'stream\n'
    );
    pushBytes(xmpBytes);
    pushAscii('\nendstream\nendobj\n');

    // Document /Info dictionary object
    var pdfDate = formatPdfDate(m.creationDate);
    var authorStr = m.author || 'TechHat (techhat.com.bd)';
    var creatorStr = (m.software || 'TechHat Photo Card Studio 2.0') + ' - ' + (m.url || 'https://tools.techhat.com.bd/image/photo-card');
    var producerStr = 'TechHat Web Studio (techhat.com.bd / tools.techhat.com.bd)';
    var subjectStr = m.description || 'Created with TechHat Photo Card Studio (https://tools.techhat.com.bd/image/photo-card)';
    var keywordsStr = 'TechHat, techhat.com.bd, tools.techhat.com.bd, Photo Card Studio';

    offsets[infoObjId] = byteLen;
    pushAscii(
      infoObjId + ' 0 obj\n' +
      '<<\n' +
      '  /Title ' + pdfEncodeString(m.title) + '\n' +
      '  /Author ' + pdfEncodeString(authorStr) + '\n' +
      '  /Subject ' + pdfEncodeString(subjectStr) + '\n' +
      '  /Keywords ' + pdfEncodeString(keywordsStr) + '\n' +
      '  /Creator ' + pdfEncodeString(creatorStr) + '\n' +
      '  /Producer ' + pdfEncodeString(producerStr) + '\n' +
      '  /CreationDate (' + pdfEscapeLiteral(pdfDate) + ')\n' +
      '  /ModDate (' + pdfEscapeLiteral(pdfDate) + ')\n' +
      '>>\n' +
      'endobj\n'
    );

    // Cross-reference table (strictly 20-byte entries)
    var xrefOffset = byteLen;
    var xrefLines = ['xref\n0 ' + (totalObjs + 1) + '\n0000000000 65535 f \n'];
    for (var o = 1; o <= totalObjs; o++) {
      xrefLines.push(String(offsets[o]).padStart(10, '0') + ' 00000 n \n');
    }
    pushAscii(xrefLines.join(''));

    // Trailer
    pushAscii(
      'trailer\n' +
      '<< /Size ' + (totalObjs + 1) + ' /Root 1 0 R /Info ' + infoObjId + ' 0 R >>\n' +
      'startxref\n' +
      xrefOffset + '\n' +
      '%%EOF\n'
    );

    return concatBuffers(chunks);
  }

  // --- Exposed API ---
  return {
    embedTechHatMetadata: embedTechHatMetadata,
    embedPngMetadata: embedPngMetadata,
    embedJpegMetadata: embedJpegMetadata,
    buildMultiPagePdf: buildMultiPagePdf,
    calculateCrc32: calculateCrc32,
    createPngTextChunk: createPngTextChunk,
    createPngItxtChunk: createPngItxtChunk,
    buildXmpPacket: buildXmpPacket,
    buildExifSegment: buildExifSegment,
    buildXmpSegment: buildXmpSegment,
    cleanMetadata: cleanMetadata,
    parsePngMetadata: parsePngMetadata,
    parseJpegMetadata: parseJpegMetadata,
    parseExifTags: parseExifTags,
    findAiMarkers: findAiMarkers
  };
});
