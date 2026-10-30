importScripts('/js/document-scan-core.js?v=23');
self.onmessage = function (event) {
  var m = event.data;
  try {
    var pixels = new Uint8ClampedArray(m.buffer);
    if (m.kind === 'detect') {
      self.postMessage({ id:m.id, result:TechHatDocumentCore.detect(pixels,m.width,m.height) });
    } else {
      var result=TechHatDocumentCore.process(pixels,m.width,m.height,m.options);
      self.postMessage({id:m.id,buffer:result.data.buffer,info:result.info},[result.data.buffer]);
    }
  } catch (error) { self.postMessage({ id:m.id,error:error.message }); }
};
