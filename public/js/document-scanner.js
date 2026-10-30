/* TechHat multipage document scanner. Files and pixels stay on this device. */
(function () {
  'use strict';
  var root=document.querySelector('#img-pane-scan');
  if(!root||!window.TechHatScanGeometry||!window.TechHatDocumentCore)return;
  var G=window.TechHatScanGeometry,C=window.TechHatDocumentCore;
  var $=function(s){return root.querySelector(s);},$$=function(s){return Array.from(root.querySelectorAll(s));};
  var pages=[],activeId=null,nextId=1,renderToken=0,busy=false,compare=false;
  var source=null,sourcePage=null,sourceRot=null,nativeW=0,nativeH=0,zoom=1,pan={x:0,y:0},fitMode=true,space=false;
  var previewTimer=0,drag=null,stream=null,cameraFacing='environment',cameraToken=0;
  var worker=null,jobId=0,jobs=new Map(),eraserActive=false,eraserTool='brush',prevDrawTool='brush',eraserSize=24,eraserHardness=80,eraserOpacity=100,wandTolerance=28,eraserColor='#ffffff',eraserStroke=null,lastBrushPt=null,rectDrag=null,pZoom=1,pPan={x:0,y:0},pPanDrag=null;
  var learningKey='techhat-scan-crop-learning-v1',learningTimer=0;
  var controls={brightness:'dsBrightness',contrast:'dsContrast',sharpness:'dsSharpness',angle:'dsAngle',curve:'dsCurve',trim:'dsTrim'};
  var settingsDefault=function(){return {filter:'magic_plus',shadow:true,text:true,straighten:true,cleanSpots:true,cleanMargins:true,brightness:100,contrast:100,sharpness:25,angle:0,curve:0,trim:0};};
  function bn(n){return String(n).replace(/\d/g,function(v){return '০১২৩৪৫৬৭৮৯'[v];});}
  function status(text){$('#dsStatus').textContent=text;}
  function toast(text){status(text);if(window.TechHatToast)window.TechHatToast(text);}
  function current(){return pages.find(function(p){return p.id===activeId;});}
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function rotateQuad(pts,deg){var out=copy(pts),steps=(((deg%360)+360)%360)/90;for(var s=0;s<steps;s++){var r=out.map(function(pt){return {x:1-pt.y,y:pt.x};});out=[r[3],r[0],r[1],r[2]];}return out;}
  function cropExamples(){try{var v=JSON.parse(localStorage.getItem(learningKey)||'[]');return Array.isArray(v)?v.filter(function(x){return x&&Array.isArray(x.feature)&&x.feature.length===5&&Array.isArray(x.delta)&&x.delta.length===4&&x.delta.every(function(d){return d&&Number.isFinite(d.x)&&Number.isFinite(d.y)&&Math.abs(d.x)<.14&&Math.abs(d.y)<.14;});}):[];}catch(e){return [];}}
  async function saveCropDataset(p){if(!p||!p.item.file||!['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname))return;var split=$('#dsDatasetSplit').value,annotation={split:split,fileName:p.item.name,width:p.item.width,height:p.item.height,rotation:p.rot,autoDetected:!!p.detected,confidence:Number(p.confidence)||0,autoPts:p.autoPts,correctedPts:p.pts};try{var response=await fetch('/__local/crop-dataset',{method:'POST',headers:{'content-type':p.item.file.type,'x-crop-annotation':encodeURIComponent(JSON.stringify(annotation))},body:p.item.file});var result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'ডেটাসেট সেভ হয়নি');p.datasetSaved=true;status((split==='training'?'Training':'Testing')+' নমুনা লোকাল ডেটাসেটে সেভ হয়েছে।');}catch(error){console.warn('Local crop dataset save failed:',error);}}
  function cropFeature(p,pts){var xs=pts.map(function(v){return v.x;}),ys=pts.map(function(v){return v.y;}),x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys),sw=p.rot%180!==0?p.item.height:p.item.width,sh=p.rot%180!==0?p.item.width:p.item.height;return [Math.log(Math.max(.01,sw/sh)),(x0+x1)/2,(y0+y1)/2,x1-x0,y1-y0];}
  function applyLearnedCrop(p,det){var examples=cropExamples();if(!examples.length||!det.pts)return det;var feature=cropFeature(p,det.pts),near=examples.map(function(ex){var scales=[.45,.28,.28,.28,.28],sum=0;for(var i=0;i<5;i++)sum+=Math.pow((feature[i]-(Number(ex.feature[i])||0))/scales[i],2);return {ex:ex,d:Math.sqrt(sum/5)};}).filter(function(x){return x.d<.34;}).sort(function(a,b){return a.d-b.d;}).slice(0,5);if(!near.length)return det;var learned=copy(det.pts),weight=0;near.forEach(function(item){var w=1/(.025+item.d*item.d);weight+=w;item.ex.delta.forEach(function(d,i){if(learned[i]){learned[i].x+=d.x*w;learned[i].y+=d.y*w;}});});var strength=near[0].d<.01?1:.72;learned.forEach(function(v,i){v.x=det.pts[i].x+(v.x-det.pts[i].x)/weight*strength;v.y=det.pts[i].y+(v.y-det.pts[i].y)/weight*strength;});if(C.validQuad(learned)){det.pts=learned;det.learned=true;}return det;}
  function saveCropLearning(p){if(!p||!p.autoPts||!p.pts)return;var delta=p.pts.map(function(v,i){return {x:v.x-p.autoPts[i].x,y:v.y-p.autoPts[i].y};});if(Math.max.apply(null,delta.map(function(d){return Math.max(Math.abs(d.x),Math.abs(d.y));}))<.004)return;var examples=cropExamples(),feature=cropFeature(p,p.autoPts),same=examples.findIndex(function(ex){return Math.sqrt(ex.feature.reduce(function(s,v,i){var scale=[.45,.28,.28,.28,.28][i];return s+Math.pow((v-feature[i])/scale,2);},0)/5)<.035;});var item={feature:feature,delta:delta};if(same>=0)examples[same]=item;else examples.push(item);if(examples.length>60)examples=examples.slice(-60);try{localStorage.setItem(learningKey,JSON.stringify(examples));}catch(e){};saveCropDataset(p);}
  function queueCropLearning(p){clearTimeout(learningTimer);learningTimer=setTimeout(function(){saveCropLearning(p);},900);}
  function tick(){return new Promise(function(resolve){requestAnimationFrame(function(){setTimeout(resolve,0);});});}
  function release(p){if(p.item.url)URL.revokeObjectURL(p.item.url);if(p.thumb)URL.revokeObjectURL(p.thumb);p.item.img.src='';}
  function snapshot(p){return {pts:copy(p.pts),rot:p.rot,settings:copy(p.settings),erases:copy(p.erases||[])};}
  function remember(p){if(!p)return;var snap=snapshot(p);if(p.undo.length&&JSON.stringify(p.undo[p.undo.length-1])===JSON.stringify(snap))return;p.undo.push(snap);if(p.undo.length>35)p.undo.shift();p.redo=[];}
  function changed(p){p.revision++;compare=false;$('#dsCompare').setAttribute('aria-pressed','false');updateControls();schedulePreview();}
  function historyAction(redo){var p=current();if(!p)return;var from=redo?p.redo:p.undo,to=redo?p.undo:p.redo;if(!from.length)return;to.push(snapshot(p));var st=from.pop();p.pts=st.pts;p.rot=st.rot;p.settings=st.settings;p.erases=copy(st.erases||[]);p.revision++;sourcePage=null;updateControls();drawSource();schedulePreview();}
  function setBusy(value,text){busy=value;root.setAttribute('aria-busy',String(value));$$('button,input,select').forEach(function(el){if(value){el.dataset.dsWasDisabled=el.disabled?'1':'0';el.disabled=true;}else if('dsWasDisabled' in el.dataset){el.disabled=el.dataset.dsWasDisabled==='1';delete el.dataset.dsWasDisabled;}});if(text)status(text);if(!value){renderList();updateControls();}}
  function workerJob(kind,image,options){
    var backup=new Uint8ClampedArray(image.data),w=image.width,h=image.height;function runMain(){return kind==='detect'?C.detect(backup,w,h):C.process(backup,w,h,options);}if(!worker){try{worker=new Worker('/js/document-scan-worker.js?v=23');worker.onmessage=function(e){var job=jobs.get(e.data.id);if(!job)return;jobs.delete(e.data.id);if(e.data.error){try{job.resolve(job.fallback());}catch(err){job.reject(new Error(e.data.error));}}else job.resolve(e.data.result||{data:new Uint8ClampedArray(e.data.buffer),info:e.data.info});};worker.onerror=function(ev){if(ev&&ev.preventDefault)ev.preventDefault();var pending=Array.from(jobs.values());jobs.clear();try{worker.terminate();}catch(e){}worker=null;pending.forEach(function(j){try{j.resolve(j.fallback());}catch(err){j.reject(err);}});};}catch(e){worker=null;}}
    if(!worker)return Promise.resolve(kind==='detect'?C.detect(image.data,image.width,image.height):C.process(image.data,image.width,image.height,options));
    return new Promise(function(resolve,reject){var id=++jobId;jobs.set(id,{resolve:resolve,reject:reject,fallback:runMain});try{worker.postMessage({id:id,kind:kind,width:w,height:h,buffer:image.data.buffer,options:options},[image.data.buffer]);}catch(e){jobs.delete(id);worker=null;try{resolve(runMain());}catch(err){reject(err);}}});
  }
  async function detectPage(p){var c=G.rotate(p.item.img,p.rot,700,1),im=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height);return workerJob('detect',im);}
  function canvasBlob(c,q){return new Promise(function(resolve,reject){c.toBlob(function(b){if(b)resolve(b);else reject(new Error('ছবি তৈরি করা যায়নি'));},'image/jpeg',q||.92);});}
  function download(blob,name){var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},30000);}
  function filename(){return ($('#dsFilename').value.trim()||'TechHat-document').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-');}
  function icon(name){var ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');var p=document.createElementNS(ns,'path');p.setAttribute('d',name==='up'?'m6 14 6-6 6 6':name==='down'?'m6 10 6 6 6-6':'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7');s.appendChild(p);return s;}
  function renderList(){
    var list=$('#dsPageList');list.replaceChildren();$('#dsCount').textContent=bn(pages.length);$('#dsExportCount').textContent=bn(pages.length)+' পেজ';
    pages.forEach(function(p,index){
      var card=document.createElement('div');card.className='ds-page'+(p.id===activeId?' is-active':'');card.draggable=!busy;card.dataset.pageId=p.id;
      var select=document.createElement('button');select.type='button';select.className='ds-page-select';select.setAttribute('aria-label','পেজ '+bn(index+1)+' নির্বাচন করুন');select.setAttribute('aria-pressed',String(p.id===activeId));
      var thumb=document.createElement('span');thumb.className='ds-thumb';var image=document.createElement('img');image.src=p.thumb||p.item.url;image.alt='পেজ '+bn(index+1);image.draggable=false;thumb.appendChild(image);
      var label=document.createElement('span');label.className='ds-page-label';var b=document.createElement('b');b.textContent='পেজ '+bn(index+1);var small=document.createElement('small');small.textContent=p.item.name;label.append(b,small);select.append(thumb,label);select.addEventListener('click',function(){if(!busy)selectPage(p.id);});card.appendChild(select);
      var actions=document.createElement('div');actions.className='ds-page-actions';
      ['up','down','delete'].forEach(function(action){var btn=document.createElement('button');btn.type='button';btn.title=action==='up'?'আগে নিন':action==='down'?'পরে নিন':'এই পেজ সরান';btn.setAttribute('aria-label','পেজ '+bn(index+1)+' '+btn.title);btn.appendChild(icon(action));btn.disabled=busy||(action==='up'&&index===0)||(action==='down'&&index===pages.length-1);btn.addEventListener('click',function(){if(busy)return;if(action==='delete'){renderToken++;pages=pages.filter(function(v){return v!==p;});release(p);if(activeId===p.id){activeId=pages[Math.min(index,pages.length-1)]?.id||null;sourcePage=null;}renderList();showState();drawSource();schedulePreview();}else movePage(index,index+(action==='up'?-1:1));});actions.appendChild(btn);});card.appendChild(actions);
      card.addEventListener('dragstart',function(e){if(busy){e.preventDefault();return;}e.dataTransfer.setData('application/x-techhat-scan-page',String(p.id));e.dataTransfer.effectAllowed='move';card.classList.add('is-dragging');});card.addEventListener('dragend',function(){card.classList.remove('is-dragging');});card.addEventListener('dragover',function(e){if(Array.from(e.dataTransfer.types).includes('application/x-techhat-scan-page')){e.preventDefault();e.dataTransfer.dropEffect='move';}});card.addEventListener('drop',function(e){var id=Number(e.dataTransfer.getData('application/x-techhat-scan-page'));if(!id||busy)return;e.preventDefault();e.stopPropagation();movePage(pages.findIndex(function(v){return v.id===id;}),index);});list.appendChild(card);
    });
  }
  function movePage(from,to){if(from<0||to<0||to>=pages.length||from===to)return;pages.splice(to,0,pages.splice(from,1)[0]);renderList();updateControls();status('পেজের ক্রম আপডেট হয়েছে');}
  function showState(){var has=pages.length>0;root.dataset.hasPages=String(has);$('#dsEmpty').hidden=has;$('#dsWorkspace').hidden=!has;updateControls();}
  function selectPage(id){if(id===activeId)return;activeId=id;compare=false;sourcePage=null;fitMode=true;pan={x:0,y:0};$('#dsCompare').setAttribute('aria-pressed','false');renderList();updateControls();drawSource();schedulePreview();}
  async function addFiles(files){
    if(busy)return;files=Array.from(files||[]);if(!files.length)return;
    if(pages.length+files.length>60){toast('এক ডকুমেন্টে সর্বোচ্চ ৬০টি পেজ যোগ করুন।');return;}
    setBusy(true,'পেজ যোগ হচ্ছে…');var added=[],errors=[];
    try{for(var i=0;i<files.length;i++){
      status('পেজ '+bn(i+1)+' / '+bn(files.length)+' · সীমানা শনাক্ত হচ্ছে…');await tick();var item;
      try{if(files[i].size>40*1024*1024)throw new Error('ছবির সাইজ ৪০ MB-এর মধ্যে রাখুন');item=await G.load(files[i]);if(item.width*item.height>60000000)throw new Error('ছবিটি ৬০ মেগাপিক্সেলের মধ্যে রাখুন');
        var p={id:nextId++,item:item,rot:0,pts:C.fullQuad(),settings:settingsDefault(),erases:[],revision:0,undo:[],redo:[],thumb:null};var detected;try{detected=await detectPage(p);}catch(detErr){console.warn('Auto detect fallback:',detErr);detected={pts:C.fullQuad(),auto:false,confidence:0,rotation:0};}if(detected.rotation){p.rot=(p.rot+detected.rotation)%360;detected.pts=rotateQuad(detected.pts,detected.rotation);}p.autoPts=copy(detected.pts);if(!detected.flatbed)detected=applyLearnedCrop(p,detected);p.detectedPts=copy(detected.pts);p.pts=detected.pts;p.detected=detected.auto;p.confidence=detected.confidence;p.learnedApplied=!!detected.learned;pages.push(p);added.push(p);
        try{var thumb=await processPage(p,360,false);p.thumb=URL.createObjectURL(await canvasBlob(thumb,.75));}catch(thumbErr){console.warn('Thumbnail fallback:',thumbErr);}
      }catch(error){if(item&&!pages.some(function(v){return v.item===item;}))URL.revokeObjectURL(item.url);errors.push(files[i].name+': '+error.message);}
    }
    if(added.length){activeId=added[0].id;sourcePage=null;fitMode=true;pan={x:0,y:0};}renderList();showState();drawSource();schedulePreview();
    }finally{setBusy(false);}
    if(errors.length)toast(errors.join(' · '));else status(bn(added.length)+'টি পেজ যোগ হয়েছে। '+(added.some(function(p){return p.learnedApplied;})?'আগের ক্রপ পছন্দ প্রয়োগ হয়েছে। ':added.some(function(p){return !p.detected;})?'কিছু পেজের সীমানা হাতে ঠিক করুন।':'চার কোণা দেখে প্রয়োজন হলে ঠিক করুন।'));
  }
  function updateControls(){
    var p=current(),has=!!p;
    $$('.ds-presets input,.ds-section:not(.ds-export-settings) input').forEach(function(el){el.disabled=busy||!has;});
    $$('[data-ds]').forEach(function(b){var action=b.dataset.ds;if(['detect','full','left','right','pdf','jpg','zip','apply-all','reset-color','compare','toggle-eraser','erase-borders'].includes(action))b.disabled=busy||!has;});
    var learningButton=$('[data-ds="clear-learning"]');if(learningButton)learningButton.textContent='শেখা উদাহরণ: '+bn(cropExamples().length);
    $('[data-ds="undo"]').disabled=busy||!has||!p.undo.length;$('[data-ds="redo"]').disabled=busy||!has||!p.redo.length;
    var eraseUndo=$('[data-ds="undo-erase"]'),eraseClear=$('[data-ds="clear-erases"]');if(eraseUndo)eraseUndo.disabled=busy||!has||!(p&&p.erases&&p.erases.length);if(eraseClear)eraseClear.disabled=busy||!has||!(p&&p.erases&&p.erases.length);
    if(!p)return;
    $$('input[name=dsFilter]').forEach(function(el){el.checked=el.value===p.settings.filter;});$('#dsShadow').checked=p.settings.shadow;$('#dsText').checked=p.settings.text;$('#dsStraighten').checked=!!p.settings.straighten;$('#dsCleanSpots').checked=!!p.settings.cleanSpots;$('#dsCleanMargins').checked=!!p.settings.cleanMargins;$('#dsCleanMargins').disabled=busy||!p.settings.straighten;
    Object.keys(controls).forEach(function(key){var el=$('#'+controls[key]);el.value=p.settings[key];$('#'+controls[key]+'Value').textContent=p.settings[key]+(key==='angle'?'°':key==='curve'?'':'%');});
    $('#dsPageName').textContent='পেজ '+bn(pages.indexOf(p)+1)+' / '+bn(pages.length);
  }
  function drawSource(){
    var p=current();if(!p)return;
    if(sourcePage!==p.id||sourceRot!==p.rot){source=G.rotate(p.item.img,p.rot,1500,1);sourcePage=p.id;sourceRot=p.rot;var sw=p.rot%180!==0;nativeW=sw?p.item.height:p.item.width;nativeH=sw?p.item.width:p.item.height;var canvas=$('#dsSource');canvas.width=source.width;canvas.height=source.height;canvas.getContext('2d').drawImage(source,0,0);$('#dsQuad').setAttribute('viewBox','0 0 '+source.width+' '+source.height);$('#dsPlane').style.width=nativeW+'px';$('#dsPlane').style.height=nativeH+'px';}
    if(fitMode)fit();else syncPlane();drawQuad();
  }
  function syncPlane(){if(!current())return;$('#dsPlane').style.transform='translate('+(pan.x-nativeW*zoom/2)+'px,'+(pan.y-nativeH*zoom/2)+'px) scale('+zoom+')';$('#dsZoom').textContent=Math.round(zoom*100)+'%';$$('[data-ds-corner]').forEach(function(b){b.style.width=24/zoom+'px';b.style.height=24/zoom+'px';b.style.borderWidth=4/zoom+'px';});$$('[data-ds-edge]').forEach(function(b){b.style.width=28/zoom+'px';b.style.height=9/zoom+'px';b.style.borderWidth=2.5/zoom+'px';});}
  function fit(){if(!current()||!nativeW)return;var r=$('#dsViewport').getBoundingClientRect();if(!r.width||!r.height)return;zoom=Math.max(.01,Math.min((r.width-60)/nativeW,(r.height-60)/nativeH));pan={x:0,y:0};fitMode=true;syncPlane();}
  function setZoom(z,anchor){var old=zoom;zoom=Math.max(.01,Math.min(8,z));var at=anchor||{x:0,y:0};pan.x=at.x-(at.x-pan.x)*zoom/old;pan.y=at.y-(at.y-pan.y)*zoom/old;fitMode=false;syncPlane();}
  function drawQuad(){var p=current();if(!p||!source)return;var coords=p.pts.map(function(v){return {x:Math.max(0,Math.min(1,v.x))*source.width,y:Math.max(0,Math.min(1,v.y))*source.height};});var points=coords.map(function(v){return v.x+','+v.y;}).join(' ');$('#dsHole').setAttribute('points',points);$('#dsOutline').setAttribute('points',points);$$('[data-ds-corner]').forEach(function(b,i){b.style.left=Math.max(.5,Math.min(99.5,p.pts[i].x*100))+'%';b.style.top=Math.max(.5,Math.min(99.5,p.pts[i].y*100))+'%';b.style.cursor=i%2===0?'nwse-resize':'nesw-resize';});$$('[data-ds-edge]').forEach(function(b,i){var n=(i+1)%4,mx=(p.pts[i].x+p.pts[n].x)*50,my=(p.pts[i].y+p.pts[n].y)*50,deg=Math.atan2(coords[n].y-coords[i].y,coords[n].x-coords[i].x)*180/Math.PI;b.style.left=Math.max(.5,Math.min(99.5,mx))+'%';b.style.top=Math.max(.5,Math.min(99.5,my))+'%';b.style.setProperty('--edge-deg',deg.toFixed(1)+'deg');b.style.cursor=i%2===0?'ns-resize':'ew-resize';});
    $$('[data-ds-line]').forEach(function(line,i){var t=i%2===0?1/3:2/3,a,b;if(i<2){a={x:coords[0].x+(coords[3].x-coords[0].x)*t,y:coords[0].y+(coords[3].y-coords[0].y)*t};b={x:coords[1].x+(coords[2].x-coords[1].x)*t,y:coords[1].y+(coords[2].y-coords[1].y)*t};}else{a={x:coords[0].x+(coords[1].x-coords[0].x)*t,y:coords[0].y+(coords[1].y-coords[0].y)*t};b={x:coords[3].x+(coords[2].x-coords[3].x)*t,y:coords[3].y+(coords[2].y-coords[3].y)*t};}line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);});
  }
  async function processPage(p,maxDim,original){
    var st=copy(p.settings),src=G.rotate(p.item.img,p.rot,maxDim+300,1),warped=G.warp(src,p.pts,1,maxDim,true);
    if(original)return warped;
    if(Math.abs(st.angle)>.01){var rotated=document.createElement('canvas');rotated.width=warped.width;rotated.height=warped.height;var ctx=rotated.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,rotated.width,rotated.height);ctx.translate(rotated.width/2,rotated.height/2);ctx.rotate(st.angle*Math.PI/180);ctx.drawImage(warped,-warped.width/2,-warped.height/2);warped=rotated;}
    st.trim=p.settings.trim||0;st.bgColor=p.settings.bgColor||eraserColor||'#ffffff';st.erases=copy(p.erases||[]);
    var context=warped.getContext('2d',{willReadFrequently:true}),im=context.getImageData(0,0,warped.width,warped.height),result=await workerJob('enhance',im,st);context.putImageData(new ImageData(result.data,warped.width,warped.height),0,0);warped._scanInfo=result.info;return warped;
  }
  function schedulePreview(){clearTimeout(previewTimer);var token=++renderToken;previewTimer=setTimeout(function(){renderPreview(token);},70);}
  async function renderPreview(token){
    var p=current();if(!p)return;var version=p.revision,id=p.id,isCompare=compare;
    try{status('প্রিভিউ তৈরি হচ্ছে…');var out=await processPage(p,1100,isCompare);if(token!==renderToken||activeId!==id||p.revision!==version)return;var canvas=$('#dsPreview');canvas.width=out.width;canvas.height=out.height;canvas.getContext('2d').drawImage(out,0,0);root.style.setProperty('--ds-ratio',out.width/out.height);$('#dsPreviewMeta').textContent=isCompare?'মূল ছবি · ক্রপ করা':out.width+' × '+out.height+' px'+(out._scanInfo?.straightened?' · লাইন সোজা করা হয়েছে':' · প্রিভিউ');status('পেজ '+bn(pages.indexOf(p)+1)+' প্রস্তুত · পরিবর্তন স্বয়ংক্রিয়ভাবে প্রিভিউতে দেখা যায়');
      if(!isCompare){var thumb=document.createElement('canvas');var sc=Math.min(1,180/Math.max(out.width,out.height));thumb.width=Math.round(out.width*sc);thumb.height=Math.round(out.height*sc);thumb.getContext('2d').drawImage(out,0,0,thumb.width,thumb.height);var blob=await canvasBlob(thumb,.75);if(token!==renderToken||!pages.includes(p))return;var previous=p.thumb;p.thumb=URL.createObjectURL(blob);var image=$('.ds-page[data-page-id="'+p.id+'"] .ds-thumb img');if(image)image.src=p.thumb;if(previous)URL.revokeObjectURL(previous);}
    }catch(error){if(token===renderToken)toast(error.message||'প্রিভিউ তৈরি করা যায়নি');}
  }
  function applySetting(key,value,checkpoint){var p=current();if(!p||busy)return;if(checkpoint)remember(p);p.settings[key]=value;changed(p);}
  function view(value){root.dataset.view=value;$$('[data-ds-view]').forEach(function(btn){btn.setAttribute('aria-pressed',String(btn.dataset.dsView===value));});requestAnimationFrame(function(){if(fitMode)fit();});}
  function stopCamera(){cameraToken++;if(stream)stream.getTracks().forEach(function(t){t.stop();});stream=null;$('#dsVideo').srcObject=null;}
  async function openCamera(){
    if(busy)return;if(!navigator.mediaDevices?.getUserMedia){$('#dsCameraFallback').click();return;}
    var dialog=$('#dsCameraDialog');if(!dialog.open)dialog.showModal();stopCamera();var token=cameraToken;
    try{var newStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:cameraFacing},width:{ideal:1920},height:{ideal:2560}},audio:false});if(token!==cameraToken||!dialog.open){newStream.getTracks().forEach(function(t){t.stop();});return;}stream=newStream;$('#dsVideo').srcObject=stream;await $('#dsVideo').play();}catch(error){if(token!==cameraToken)return;dialog.close();toast('ক্যামেরা খোলা যায়নি। ক্যামেরার অনুমতি দিন অথবা ছবি যোগ করুন।');}
  }
  function loadPdf(){if(window.PDFLib)return Promise.resolve(window.PDFLib);if(loadPdf.promise)return loadPdf.promise;loadPdf.promise=new Promise(function(resolve,reject){var script=document.createElement('script');script.src='/vendor/pdf-lib.min.js';script.onload=function(){resolve(window.PDFLib);};script.onerror=function(){loadPdf.promise=null;script.remove();reject(new Error('PDF লাইব্রেরি লোড করা যায়নি'));};document.head.appendChild(script);});return loadPdf.promise;}
  async function exportPages(kind){
    if(busy||!pages.length)return;renderToken++;clearTimeout(previewTimer);var list=kind==='jpg'?[current()]:pages.slice();var name=filename(),paper=$('#dsPaper').value,margin=$('#dsMargin').checked;var quality=$('#dsQuality').value,maxDim=quality==='high'?3000:quality==='small'?1400:2200;
    setBusy(true,'এক্সপোর্ট প্রস্তুত হচ্ছে…');
    try{var pdf,zip;if(kind==='pdf'){var lib=await loadPdf();pdf=await lib.PDFDocument.create();pdf.setProducer('TechHat Document Scanner');pdf.setTitle(name);}if(kind==='zip'){if(!window.JSZip)throw new Error('ZIP লাইব্রেরি লোড হয়নি');zip=new window.JSZip();}
      for(var i=0;i<list.length;i++){status('এক্সপোর্ট · পেজ '+bn(i+1)+' / '+bn(list.length));await tick();var canvas=await processPage(list[i],maxDim,false),blob=await canvasBlob(canvas,quality==='small'?.8:.94);
        if(kind==='jpg'){download(blob,name+'-page-'+(pages.indexOf(list[i])+1)+'.jpg');}
        else if(kind==='zip'){zip.file(name+'-page-'+String(i+1).padStart(3,'0')+'.jpg',blob);}
        else{var image=await pdf.embedJpg(await blob.arrayBuffer()),ratio=canvas.width/canvas.height;var pw,ph;
          if(paper==='original'){pw=canvas.width*72/200;ph=canvas.height*72/200;}else{pw=paper==='letter'?612:595.28;ph=paper==='letter'?792:841.89;if(ratio>1){var tmp=pw;pw=ph;ph=tmp;}}
          var page=pdf.addPage([pw,ph]),m=margin?18:0,scale=Math.min((pw-m*2)/image.width,(ph-m*2)/image.height),dw=image.width*scale,dh=image.height*scale;page.drawImage(image,{x:(pw-dw)/2,y:(ph-dh)/2,width:dw,height:dh});
        }
        // Do not retain full-resolution canvases across a multipage export.
        canvas.width=canvas.height=1;
      }
      if(pdf)download(new Blob([await pdf.save()],{type:'application/pdf'}),name+'.pdf');if(zip)download(await zip.generateAsync({type:'blob',compression:'STORE'}),name+'.zip');status(bn(list.length)+'টি পেজ এক্সপোর্ট হয়েছে');
    }catch(error){toast(error.message||'এক্সপোর্ট করা যায়নি');}finally{setBusy(false);schedulePreview();}
  }
  // Actions use the same per-page geometry and settings for preview and export.
  root.addEventListener('click',async function(e){var toolBtn=e.target.closest('[data-ds-tool]');if(toolBtn&&!busy){setEraserTool(toolBtn.dataset.dsTool);return;}var swatchBtn=e.target.closest('[data-ds-swatch]');if(swatchBtn&&!busy){setEraserColor(swatchBtn.dataset.dsSwatch,true);return;}var btn=e.target.closest('[data-ds]');if(!btn||btn.disabled)return;var action=btn.dataset.ds,p=current();
    if(action==='add'){$('#dsFiles').click();return;}if(action==='theme'){document.querySelector('#themeToggle')?.click();return;}if(action==='camera'){openCamera();return;}if(action==='camera-close'){$('#dsCameraDialog').close();return;}if(action==='camera-switch'){cameraFacing=cameraFacing==='environment'?'user':'environment';openCamera();return;}
    if(action==='capture'){var video=$('#dsVideo');if(!video.videoWidth)return;var capture=document.createElement('canvas');capture.width=video.videoWidth;capture.height=video.videoHeight;capture.getContext('2d').drawImage(video,0,0);var photo=await canvasBlob(capture,.97);$('#dsCameraDialog').close();await addFiles([new File([photo],'camera-'+Date.now()+'.jpg',{type:'image/jpeg'})]);return;}
    if(action==='clear-learning'){try{localStorage.removeItem(learningKey);}catch(e){}updateControls();toast('আপনার ব্যক্তিগত ক্রপ শেখার তথ্য মুছে ফেলা হয়েছে।');return;}
    if(action==='reset'){if(pages.length)$('#dsResetDialog').showModal();return;}if(action==='pdf'||action==='jpg'||action==='zip'){exportPages(action);return;}
    if(action==='zoom-in'){setZoom(zoom*1.2);return;}if(action==='zoom-out'){setZoom(zoom/1.2);return;}if(action==='fit'){fit();return;}if(action==='actual'){setZoom(1);return;}
    if(action==='pzoom-in'){setPreviewZoom(pZoom*1.25);return;}if(action==='pzoom-out'){setPreviewZoom(pZoom/1.25);return;}if(action==='pzoom-fit'){setPreviewZoom(1);return;}
    if(action==='open-color-picker'){$('#dsEraserColor')?.click();return;}
    if(action==='auto-paper-color'){autoDetectPaperColor();return;}
    if(action==='toggle-eraser'){setEraserMode(!eraserActive);return;}
    if(action==='close-eraser'){setEraserMode(false);return;}
    if(!p||busy)return;if(action==='undo'){historyAction(false);return;}if(action==='redo'){historyAction(true);return;}
    if(action==='erase-borders'){remember(p);p.erases=p.erases||[];var bc=eraserColor||'#ffffff';p.erases.push({type:'rect',x0:0,y0:0,x1:1,y1:.022,color:bc},{type:'rect',x0:0,y0:.978,x1:1,y1:1,color:bc},{type:'rect',x0:0,y0:0,x1:.022,y1:1,color:bc},{type:'rect',x0:.978,y0:0,x1:1,y1:1,color:bc});changed(p);toast('চারপাশের বর্ডারের বাড়তি ব্যাকগ্রাউন্ড পরিষ্কার করা হয়েছে');return;}
    if(action==='undo-erase'){if(p.erases&&p.erases.length){remember(p);p.erases.pop();changed(p);}return;}
    if(action==='clear-erases'){if(p.erases&&p.erases.length){remember(p);p.erases=[];changed(p);toast('এই পেজের সব দাগ মোছা রিসেট করা হয়েছে');}return;}
    if(action==='detect'){setBusy(true,'পেজের সীমানা শনাক্ত হচ্ছে…');try{remember(p);var det=await detectPage(p);if(det.rotation){p.rot=(p.rot+det.rotation)%360;det.pts=rotateQuad(det.pts,det.rotation);sourcePage=null;fitMode=true;}p.autoPts=copy(det.pts);if(!det.flatbed)det=applyLearnedCrop(p,det);p.detectedPts=copy(det.pts);p.pts=det.pts;p.learnedApplied=!!det.learned;p.detected=det.auto;p.confidence=det.confidence;p.revision++;drawSource();schedulePreview();toast(det.learned?'আপনার আগের ক্রপ পছন্দ মিলিয়ে সীমানা ঠিক করা হয়েছে।':det.auto?'পেজের সীমানা শনাক্ত হয়েছে। চার কোণা দেখে নিন।':'স্পষ্ট সীমানা পাওয়া যায়নি। পুরো ছবি রাখা হয়েছে; চার কোণা টেনে ঠিক করুন।');}catch(error){toast(error.message);}finally{setBusy(false);}return;}
    if(action==='apply-all'){
      setBusy(true,'সব পেজের ফিল্টার আপডেট হচ্ছে…');
      try { for(var ai=0;ai<pages.length;ai++) { var page=pages[ai];if(page===p)continue;remember(page);var savedAngle=page.settings.angle,savedCurve=page.settings.curve;page.settings=copy(p.settings);page.settings.angle=savedAngle;page.settings.curve=savedCurve;page.revision++;
        var thumbCanvas=await processPage(page,360,false),thumbBlob=await canvasBlob(thumbCanvas,.75);if(page.thumb)URL.revokeObjectURL(page.thumb);page.thumb=URL.createObjectURL(thumbBlob);await tick();
      } toast('সব পেজে ফিল্টার ও আলো সেটিংস প্রয়োগ হয়েছে'); } catch(error){toast(error.message);}finally{setBusy(false);}return;
    }
    remember(p);
    if(action==='full'){p.pts=C.fullQuad();saveCropLearning(p);}
    if(action==='left'||action==='right'){// Rotate the existing crop together with the image.
      var clockwise=action==='right';p.rot=(p.rot+(clockwise?90:270))%360;function rotatePts(pts){var rotated=pts.map(function(pt){return clockwise?{x:1-pt.y,y:pt.x}:{x:pt.y,y:1-pt.x};});return clockwise?[rotated[3],rotated[0],rotated[1],rotated[2]]:[rotated[1],rotated[2],rotated[3],rotated[0]];}p.pts=rotatePts(p.pts);if(p.detectedPts)p.detectedPts=rotatePts(p.detectedPts);if(p.autoPts)p.autoPts=rotatePts(p.autoPts);sourcePage=null;fitMode=true;
    }
    if(action==='reset-color')p.settings=settingsDefault();changed(p);drawSource();
  });
  $('#dsFiles').addEventListener('change',function(e){addFiles(e.target.files);e.target.value='';});$('#dsCameraFallback').addEventListener('change',function(e){addFiles(e.target.files);e.target.value='';});
  $('#dsCompare').addEventListener('click',function(){compare=!compare;$('#dsCompare').setAttribute('aria-pressed',String(compare));schedulePreview();});
  $$('[data-ds-jump]').forEach(function(btn){btn.addEventListener('click',function(){var target=$(btn.dataset.dsJump);if(target)target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});});
  $$('[data-ds-view]').forEach(function(btn){btn.addEventListener('click',function(){view(btn.dataset.dsView);});});
  $$('input[name=dsFilter]').forEach(function(el){el.addEventListener('change',function(){var p=current();if(!p||busy)return;remember(p);p.settings.filter=el.value;p.settings.shadow=el.value!=='original';p.settings.text=el.value!=='original'&&el.value!=='color';p.settings.sharpness=el.value==='original'?0:25;p.settings.straighten=el.value!=='original';p.settings.cleanSpots=el.value==='magic_plus';p.settings.cleanMargins=el.value==='magic_plus';changed(p);});});
  ['Straighten','CleanSpots','CleanMargins'].forEach(function(key){$('#ds'+key).addEventListener('change',function(e){var p=current();if(!p||busy)return;remember(p);var prop=key[0].toLowerCase()+key.slice(1);p.settings[prop]=e.target.checked;if(prop==='straighten'&&!e.target.checked)p.settings.cleanMargins=false;changed(p);});});
  ['Shadow','Text'].forEach(function(key){$('#ds'+key).addEventListener('change',function(e){applySetting(key.toLowerCase(),e.target.checked,true);});});
  Object.keys(controls).forEach(function(key){var el=$('#'+controls[key]);var checkpoint=false;function start(){if(current()&&!checkpoint){remember(current());checkpoint=true;}}el.addEventListener('pointerdown',start);el.addEventListener('keydown',start);el.addEventListener('input',function(){start();applySetting(key,Number(el.value),false);});el.addEventListener('change',function(){checkpoint=false;});el.addEventListener('blur',function(){checkpoint=false;});});
  $('#dsResetDialog').addEventListener('close',function(){if(this.returnValue!=='reset')return;renderToken++;clearTimeout(previewTimer);pages.forEach(release);pages=[];activeId=null;source=null;sourcePage=null;$('#dsPreview').width=$('#dsPreview').height=1;renderList();showState();status('নতুন ডকুমেন্টের ছবি যোগ করুন');});
  $('#dsCameraDialog').addEventListener('close',stopCamera);
  root.addEventListener('dragover',function(e){if(e.dataTransfer?.types.includes('Files')){e.preventDefault();root.classList.add('is-over');}});root.addEventListener('dragleave',function(e){if(!root.contains(e.relatedTarget))root.classList.remove('is-over');});root.addEventListener('drop',function(e){root.classList.remove('is-over');if(e.dataTransfer?.files.length){e.preventDefault();addFiles(e.dataTransfer.files);}});
  var vp=$('#dsViewport');
  vp.addEventListener('pointerdown',function(e){if(busy||!current()||(e.button!==0&&e.button!==1))return;var corner=e.target.closest('[data-ds-corner]'),edge=e.target.closest('[data-ds-edge]');var isPan=space||e.button===1;if(!corner&&!edge&&!isPan)return;e.preventDefault();if(isPan){drag={type:'pan',x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};vp.classList.add('is-panning');}else if(corner){remember(current());drag={type:'corner',index:Number(corner.dataset.dsCorner),el:corner};corner.classList.add('is-active');}else{var rect=$('#dsPlane').getBoundingClientRect(),p=current();remember(p);drag={type:'edge',index:Number(edge.dataset.dsEdge),el:edge,sx:(e.clientX-rect.left)/rect.width,sy:(e.clientY-rect.top)/rect.height,origPts:copy(p.pts)};edge.classList.add('is-active');}vp.setPointerCapture(e.pointerId);});
  vp.addEventListener('pointermove',function(e){if(!drag)return;if(drag.type==='pan'){pan.x=drag.px+e.clientX-drag.x;pan.y=drag.py+e.clientY-drag.y;fitMode=false;syncPlane();return;}var rect=$('#dsPlane').getBoundingClientRect(),p=current(),next=copy(p.pts);if(drag.type==='edge'){var dx=(e.clientX-rect.left)/rect.width-drag.sx,dy=(e.clientY-rect.top)/rect.height-drag.sy,i1=drag.index,i2=(i1+1)%4;next[i1]={x:Math.max(0,Math.min(1,drag.origPts[i1].x+dx)),y:Math.max(0,Math.min(1,drag.origPts[i1].y+dy))};next[i2]={x:Math.max(0,Math.min(1,drag.origPts[i2].x+dx)),y:Math.max(0,Math.min(1,drag.origPts[i2].y+dy))};}else{next[drag.index]={x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))};}if(C.validQuad(next)){p.pts=next;p.revision++;drawQuad();schedulePreview();}});
  function endDrag(){if(!drag)return;var finished=drag;drag=null;if(finished.el)finished.el.classList.remove('is-active');if(finished.type==='corner'||finished.type==='edge')saveCropLearning(current());vp.classList.remove('is-panning');updateControls();schedulePreview();}vp.addEventListener('pointerup',endDrag);vp.addEventListener('pointercancel',endDrag);vp.addEventListener('lostpointercapture',endDrag);
  vp.addEventListener('wheel',function(e){if(!(e.altKey||e.ctrlKey)||!current())return;e.preventDefault();var r=vp.getBoundingClientRect();setZoom(zoom*Math.exp(-e.deltaY*.002),{x:e.clientX-r.left-r.width/2,y:e.clientY-r.top-r.height/2});},{passive:false});
  $$('[data-ds-corner],[data-ds-edge]').forEach(function(btn){btn.addEventListener('keydown',function(e){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||busy)return;e.preventDefault();e.stopPropagation();var p=current();if(!p)return;var pts=copy(p.pts),step=e.shiftKey?.01:.002,dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;if('dsEdge' in btn.dataset){var i1=Number(btn.dataset.dsEdge),i2=(i1+1)%4;pts[i1].x=Math.max(0,Math.min(1,pts[i1].x+dx));pts[i1].y=Math.max(0,Math.min(1,pts[i1].y+dy));pts[i2].x=Math.max(0,Math.min(1,pts[i2].x+dx));pts[i2].y=Math.max(0,Math.min(1,pts[i2].y+dy));}else{var idx=Number(btn.dataset.dsCorner);pts[idx].x=Math.max(0,Math.min(1,pts[idx].x+dx));pts[idx].y=Math.max(0,Math.min(1,pts[idx].y+dy));}if(C.validQuad(pts)){remember(p);p.pts=pts;p.revision++;queueCropLearning(p);drawQuad();updateControls();schedulePreview();}});});
  document.addEventListener('keydown',function(e){if(root.hidden||busy||e.target.closest('input,textarea,select,[contenteditable=true]')||root.querySelector('dialog[open]'))return;
    if(e.code==='Space'&&current()){e.preventDefault();space=true;vp.classList.add('is-hand');return;}
    if(e.ctrlKey||e.metaKey){if(['+','=','-','0','1'].includes(e.key)){e.preventDefault();if(e.key==='0')fit();else if(e.key==='1')setZoom(1);else setZoom(zoom*(e.key==='-'?1/1.2:1.2));}if(e.key.toLowerCase()==='z'){e.preventDefault();historyAction(e.shiftKey);}if(e.key.toLowerCase()==='y'){e.preventDefault();historyAction(true);}}
  });document.addEventListener('keyup',function(e){if(e.code==='Space'){space=false;vp.classList.remove('is-hand');}});window.addEventListener('blur',function(){space=false;drag=null;vp.classList.remove('is-hand','is-panning');});
  new ResizeObserver(function(){if(!root.hidden&&fitMode)fit();}).observe(vp);
  new MutationObserver(function(){if(root.hidden){stopCamera();if($('#dsCameraDialog').open)$('#dsCameraDialog').close();}else{requestAnimationFrame(function(){drawSource();});}}).observe(root,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('pagehide',function(){stopCamera();if(worker)worker.terminate();});
  function rgbToHex(r,g,b){
    return '#'+[r,g,b].map(function(v){return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');}).join('');
  }
  function sampleCanvasColor(canvas,nx,ny,rad){
    if(!canvas||!canvas.width||!canvas.height)return {r:255,g:255,b:255,hex:'#ffffff'};
    var ctx=canvas.getContext('2d',{willReadFrequently:true});
    var cx=Math.max(0,Math.min(canvas.width-1,Math.round(nx*(canvas.width-1))));
    var cy=Math.max(0,Math.min(canvas.height-1,Math.round(ny*(canvas.height-1))));
    var x0=Math.max(0,cx-rad),y0=Math.max(0,cy-rad),x1=Math.min(canvas.width-1,cx+rad),y1=Math.min(canvas.height-1,cy+rad);
    var im=ctx.getImageData(x0,y0,x1-x0+1,y1-y0+1).data;
    var sr=0,sg=0,sb=0,cnt=im.length/4;
    for(var i=0;i<im.length;i+=4){sr+=im[i];sg+=im[i+1];sb+=im[i+2];}
    sr=Math.round(sr/cnt);sg=Math.round(sg/cnt);sb=Math.round(sb/cnt);
    return {r:sr,g:sg,b:sb,hex:rgbToHex(sr,sg,sb)};
  }
  function setEraserColor(hex,announce){
    if(!hex)return;
    eraserColor=hex.toLowerCase();
    var p=current();if(p)p.settings.bgColor=eraserColor;
    var inp=$('#dsEraserColor'),chip=$('#dsEraserColorChip'),code=$('#dsEraserHex'),dockSw=$('#dsDockSwatch');
    if(inp)inp.value=eraserColor;
    if(chip)chip.style.background=eraserColor;
    if(code)code.textContent=eraserColor.toUpperCase();
    if(dockSw)dockSw.style.background=eraserColor;
    $$('[data-ds-swatch]').forEach(function(b){b.classList.toggle('is-active',b.dataset.dsSwatch?.toLowerCase()===eraserColor);});
    updateEraserCursor();
    if(announce)status('ব্যাকগ্রাউন্ড কালার নির্বাচিত: '+eraserColor.toUpperCase());
  }
  function autoDetectPaperColor(){
    var canvas=$('#dsPreview');
    if(!canvas||canvas.width<8)return;
    var ctx=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height;
    var im=ctx.getImageData(0,0,w,h).data,rs=[],gs=[],bs=[],stepX=Math.max(1,Math.floor(w/22)),stepY=Math.max(1,Math.floor(h/22));
    for(var y=stepY;y<h-stepY;y+=stepY)for(var x=stepX;x<w-stepX;x+=stepX){
      var a=(y*w+x)*4,r=im[a],g=im[a+1],b=im[a+2],lum=r*.299+g*.587+b*.114;
      if(lum>=145){rs.push(r);gs.push(g);bs.push(b);}
    }
    if(rs.length<5){setEraserColor('#ffffff',true);return;}
    rs.sort(function(a,b){return a-b;});gs.sort(function(a,b){return a-b;});bs.sort(function(a,b){return a-b;});
    var mid=Math.floor(rs.length*.65);
    var hex=rgbToHex(rs[mid],gs[mid],bs[mid]);
    setEraserColor(hex,true);
    toast('ডকুমেন্টের পেপার কালার শনাক্ত হয়েছে: '+hex.toUpperCase());
  }
  function setEraserTool(tool){
    eraserTool=tool||'brush';
    if(['brush','heal','wand','rect'].includes(eraserTool))prevDrawTool=eraserTool;
    var names={brush:'ব্রাশ টুল',heal:'স্পট হিলিং',wand:'ম্যাজিক ইরেজার',rect:'রেকট্যাঙ্গেল ফিল',picker:'কালার পিকার',hand:'হ্যান্ড প্যান'};
    var label=$('#dsPsActiveToolLabel b');if(label)label.textContent=names[eraserTool]||'ব্রাশ টুল';
    $$('[data-ds-tool]').forEach(function(b){
      var on=b.dataset.dsTool===eraserTool;
      b.classList.toggle('is-active',on);
      b.setAttribute('aria-pressed',String(on));
    });
    var bOpts=$('#dsPsBrushOpts'),wOpts=$('#dsPsWandOpts'),wrap=$('#dsPreviewWrap');
    if(bOpts)bOpts.hidden=!(eraserTool==='brush'||eraserTool==='heal');
    if(wOpts)wOpts.hidden=eraserTool!=='wand';
    if(wrap)wrap.dataset.tool=eraserTool;
    updateEraserCursor();
    if(eraserTool==='picker')status('কালার পিকার চালু: ডকুমেন্টের যেকোনো জায়গার ব্যাকগ্রাউন্ডে ক্লিক করে রঙ নিন');
    else if(eraserTool==='heal')status('স্পট হিলিং চালু: দাগের ওপর ঘষলে চারপাশের কাগজের রঙ মিলিয়ে দাগ মুছে যাবে');
    else if(eraserTool==='wand')status('ম্যাজিক ইরেজার চালু: যেকোনো ব্যাকগ্রাউন্ড বা দাগের ওপর ক্লিক করুন');
    else if(eraserTool==='rect')status('রেকট্যাঙ্গেল ফিল চালু: মাউস টেনে বক্স সিলেক্ট করে ব্যাকগ্রাউন্ড পরিষ্কার করুন');
  }
  function syncPreviewPlane(){
    var wrap=$('#dsPreviewWrap'),lbl=$('#dsPreviewZoomLabel');
    if(wrap)wrap.style.transform=pZoom===1&&!pPan.x&&!pPan.y?'':'translate('+pPan.x+'px,'+pPan.y+'px) scale('+pZoom+')';
    if(lbl)lbl.textContent=Math.round(pZoom*100)+'%';
    updateEraserCursor();
  }
  function setPreviewZoom(z){
    pZoom=Math.max(.5,Math.min(5,z));
    if(Math.abs(pZoom-1)<.04){pZoom=1;pPan={x:0,y:0};}
    syncPreviewPlane();
  }
  function setEraserMode(active){
    eraserActive=!!active;
    var bar=$('#dsEraserBar'),dock=$('#dsPsDock'),wrap=$('#dsPreviewWrap'),cur=$('#dsEraserCursor'),loupe=$('#dsPickerLoupe');
    if(bar)bar.hidden=!eraserActive;
    if(dock)dock.hidden=!eraserActive;
    if(wrap){wrap.classList.toggle('is-eraser-active',eraserActive);wrap.dataset.tool=eraserTool;}
    if(!eraserActive){if(cur)cur.hidden=true;if(loupe)loupe.hidden=true;setPreviewZoom(1);}
    $$('[data-ds="toggle-eraser"]').forEach(function(b){
      b.setAttribute('aria-pressed',String(eraserActive));
      b.classList.toggle('is-active',eraserActive);
    });
    if(eraserActive){
      setEraserTool(eraserTool||'brush');
      if(root.dataset.view==='crop')view('split');
    }
  }
  function updateEraserCursor(){
    var cur=$('#dsEraserCursor'),wrap=$('#dsPreviewWrap'),loupe=$('#dsPickerLoupe');
    if(!cur||!wrap)return;
    var showCircle=eraserActive&&(eraserTool==='brush'||eraserTool==='heal');
    if(!showCircle){cur.hidden=true;}
    if(loupe&&eraserTool!=='picker')loupe.hidden=true;
    var minDim=Math.max(60,Math.min(wrap.clientWidth||300,wrap.clientHeight||300));
    var pxSize=Math.max(4,(eraserSize/1000)*minDim);
    cur.style.width=pxSize+'px';
    cur.style.height=pxSize+'px';
    cur.style.setProperty('--cursor-hard',Math.max(10,eraserHardness)+'%');
    cur.style.setProperty('--cursor-bg',eraserTool==='heal'?'rgba(16,185,129,.28)':eraserColor);
  }
  function installEraser(){
    var stage=$('#dsPreviewStage'),wrap=$('#dsPreviewWrap'),canvas=$('#dsPreview'),cur=$('#dsEraserCursor'),loupe=$('#dsPickerLoupe'),loupeSw=$('#dsPickerLoupeSwatch'),loupeHex=$('#dsPickerLoupeHex'),rectBox=$('#dsRectSelection');
    if(!wrap||!canvas)return;
    var colorInp=$('#dsEraserColor'),szInp=$('#dsBrushSize'),hdInp=$('#dsBrushHardness'),opInp=$('#dsBrushOpacity'),tolInp=$('#dsWandTolerance');
    if(colorInp)colorInp.addEventListener('input',function(){setEraserColor(this.value,true);});
    if(szInp)szInp.addEventListener('input',function(){eraserSize=Number(this.value)||24;$('#dsBrushSizeVal').textContent=eraserSize+'px';updateEraserCursor();});
    if(hdInp)hdInp.addEventListener('input',function(){eraserHardness=Number(this.value);$('#dsBrushHardnessVal').textContent=eraserHardness+'%';updateEraserCursor();});
    if(opInp)opInp.addEventListener('input',function(){eraserOpacity=Number(this.value)||100;$('#dsBrushOpacityVal').textContent=eraserOpacity+'%';updateEraserCursor();});
    if(tolInp)tolInp.addEventListener('input',function(){wandTolerance=Number(this.value)||28;$('#dsWandToleranceVal').textContent=String(wandTolerance);});
    function getRel(e){
      var r=canvas.getBoundingClientRect();
      var nx=(e.clientX-r.left)/Math.max(1,r.width),ny=(e.clientY-r.top)/Math.max(1,r.height);
      return {x:Math.max(0,Math.min(1,nx)),y:Math.max(0,Math.min(1,ny)),r:r};
    }
    function paintSegmentOnCanvas(pt0,pt1,radRel){
      var ctx=canvas.getContext('2d');
      ctx.save();
      ctx.globalAlpha=eraserOpacity/100;
      var col=eraserTool==='heal'?sampleCanvasColor(canvas,pt1.x,pt1.y,Math.max(4,Math.round(radRel*canvas.width*1.3))).hex:eraserColor;
      ctx.strokeStyle=col;ctx.fillStyle=col;
      var rad=Math.max(1,radRel*Math.min(canvas.width,canvas.height));
      ctx.lineWidth=rad*2;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.beginPath();
      ctx.moveTo(pt0.x*canvas.width,pt0.y*canvas.height);
      ctx.lineTo(pt1.x*canvas.width,pt1.y*canvas.height);
      ctx.stroke();
      ctx.restore();
    }
    wrap.addEventListener('pointerenter',function(){if(eraserActive)updateEraserCursor();});
    wrap.addEventListener('pointerleave',function(){if(cur&&!eraserStroke)cur.hidden=true;if(loupe)loupe.hidden=true;});
    wrap.addEventListener('pointermove',function(e){
      if(pPanDrag){
        pPan.x=pPanDrag.px+(e.clientX-pPanDrag.x);
        pPan.y=pPanDrag.py+(e.clientY-pPanDrag.y);
        syncPreviewPlane();
        return;
      }
      if(!eraserActive)return;
      var pos=getRel(e);
      var isPick=eraserTool==='picker'||e.altKey;
      if(isPick&&!eraserStroke&&!rectDrag){
        if(cur)cur.hidden=true;
        if(loupe){
          var sc=sampleCanvasColor(canvas,pos.x,pos.y,2);
          loupe.hidden=false;
          loupe.style.left=(pos.x*100)+'%';
          loupe.style.top=(pos.y*100)+'%';
          if(loupeSw)loupeSw.style.background=sc.hex;
          if(loupeHex)loupeHex.textContent=sc.hex.toUpperCase();
        }
      }else{
        if(loupe)loupe.hidden=true;
        if(cur&&(eraserTool==='brush'||eraserTool==='heal')){
          updateEraserCursor();
          cur.hidden=false;
          cur.style.left=(pos.x*100)+'%';
          cur.style.top=(pos.y*100)+'%';
        }
      }
      if(rectDrag&&rectBox){
        rectDrag.x1=pos.x;rectDrag.y1=pos.y;
        var lx=Math.min(rectDrag.x0,rectDrag.x1)*100,ly=Math.min(rectDrag.y0,rectDrag.y1)*100;
        var lw=Math.abs(rectDrag.x1-rectDrag.x0)*100,lh=Math.abs(rectDrag.y1-rectDrag.y0)*100;
        rectBox.style.left=lx+'%';rectBox.style.top=ly+'%';
        rectBox.style.width=lw+'%';rectBox.style.height=lh+'%';
        return;
      }
      if(!eraserStroke)return;
      var p=current();if(!p)return;
      var prev=eraserStroke.pts[eraserStroke.pts.length-1];
      eraserStroke.pts.push({x:pos.x,y:pos.y});
      lastBrushPt={x:pos.x,y:pos.y};
      paintSegmentOnCanvas(prev,{x:pos.x,y:pos.y},eraserStroke.size);
    });
    wrap.addEventListener('pointerdown',function(e){
      if(!eraserActive||busy||(e.button!==0&&e.button!==1))return;
      var p=current();if(!p)return;
      if(space||eraserTool==='hand'||e.button===1){
        e.preventDefault();
        pPanDrag={x:e.clientX,y:e.clientY,px:pPan.x,py:pPan.y};
        wrap.classList.add('is-panning');
        wrap.setPointerCapture(e.pointerId);
        return;
      }
      var pos=getRel(e);
      if(e.clientX<pos.r.left||e.clientX>pos.r.right||e.clientY<pos.r.top||e.clientY>pos.r.bottom)return;
      e.preventDefault();
      if(eraserTool==='picker'||e.altKey){
        var picked=sampleCanvasColor(canvas,pos.x,pos.y,2);
        setEraserColor(picked.hex,true);
        toast('ব্যাকগ্রাউন্ড কালার পিক করা হয়েছে: '+picked.hex.toUpperCase());
        if(eraserTool==='picker')setEraserTool(prevDrawTool||'brush');
        return;
      }
      if(eraserTool==='wand'){
        remember(p);
        p.erases=p.erases||[];
        p.erases.push({type:'wand',x:pos.x,y:pos.y,tolerance:wandTolerance,color:eraserColor,opacity:eraserOpacity/100});
        changed(p);
        return;
      }
      if(eraserTool==='rect'){
        rectDrag={x0:pos.x,y0:pos.y,x1:pos.x,y1:pos.y};
        if(rectBox){
          rectBox.hidden=false;
          rectBox.style.left=(pos.x*100)+'%';rectBox.style.top=(pos.y*100)+'%';
          rectBox.style.width='0%';rectBox.style.height='0%';
        }
        wrap.setPointerCapture(e.pointerId);
        return;
      }
      remember(p);
      var relSize=(eraserSize/2)/1000;
      var pts=(e.shiftKey&&lastBrushPt)?[lastBrushPt,{x:pos.x,y:pos.y}]:[{x:pos.x,y:pos.y}];
      eraserStroke={type:eraserTool==='heal'?'heal':'stroke',size:relSize,hardness:eraserHardness/100,opacity:eraserOpacity/100,color:eraserColor,pts:pts};
      p.erases=p.erases||[];
      p.erases.push(eraserStroke);
      paintSegmentOnCanvas(pts[0],pts[pts.length-1],relSize);
      lastBrushPt={x:pos.x,y:pos.y};
      wrap.setPointerCapture(e.pointerId);
    });
    function finishStroke(){
      if(pPanDrag){pPanDrag=null;wrap.classList.remove('is-panning');return;}
      if(rectDrag){
        var rd=rectDrag;rectDrag=null;
        if(rectBox)rectBox.hidden=true;
        var pR=current();
        if(pR&&(Math.abs(rd.x1-rd.x0)>.003||Math.abs(rd.y1-rd.y0)>.003)){
          remember(pR);
          pR.erases=pR.erases||[];
          pR.erases.push({type:'rect',x0:rd.x0,y0:rd.y0,x1:rd.x1,y1:rd.y1,color:eraserColor,opacity:eraserOpacity/100});
          changed(pR);
        }
        return;
      }
      if(!eraserStroke)return;
      eraserStroke=null;
      var p=current();
      if(p){
        p.revision++;
        updateControls();
        schedulePreview();
      }
    }
    wrap.addEventListener('pointerup',finishStroke);
    wrap.addEventListener('pointercancel',finishStroke);
    if(stage){
      stage.addEventListener('wheel',function(e){
        if(!current()||(!eraserActive&&!e.ctrlKey&&!e.altKey))return;
        e.preventDefault();
        setPreviewZoom(pZoom*Math.exp(-e.deltaY*.002));
      },{passive:false});
    }
    document.addEventListener('keydown',function(e){
      if(!eraserActive||root.hidden||busy||e.target.closest('input,textarea,select,[contenteditable=true]')||root.querySelector('dialog[open]'))return;
      if(e.ctrlKey||e.metaKey||e.altKey)return;
      var k=e.key.toLowerCase();
      if(k==='b'||k==='e'){e.preventDefault();setEraserTool('brush');}
      else if(k==='j'){e.preventDefault();setEraserTool('heal');}
      else if(k==='w'){e.preventDefault();setEraserTool('wand');}
      else if(k==='m'){e.preventDefault();setEraserTool('rect');}
      else if(k==='i'){e.preventDefault();setEraserTool('picker');}
      else if(k==='h'){e.preventDefault();setEraserTool('hand');}
      else if(e.key==='['||e.key===']'){
        e.preventDefault();
        var step=eraserSize>24?4:2;
        eraserSize=Math.max(2,Math.min(120,eraserSize+(e.key===']'?step:-step)));
        if(szInp)szInp.value=String(eraserSize);
        var szOut=$('#dsBrushSizeVal');if(szOut)szOut.textContent=eraserSize+'px';
        updateEraserCursor();
      }
    });
  }
  installEraser();
  renderList();showState();
})();
