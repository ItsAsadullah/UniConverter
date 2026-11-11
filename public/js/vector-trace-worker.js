/* TechHat Vector Trace Worker — runs the tracing pipeline off the UI thread. */
importScripts('/js/vector-trace-core.js?v=76');

self.onmessage = function (event) {
  var m = event.data;
  try {
    var pixels = new Uint8ClampedArray(m.buffer);
    var result = TechHatVectorTrace.trace({ data: pixels, w: m.width, h: m.height }, m.options);
    self.postMessage({ id: m.id, result: result });
  } catch (error) {
    self.postMessage({ id: m.id, error: error && error.message ? error.message : String(error) });
  }
};
