/* TechHat multipage document scanner. Files and pixels stay on this device. */
(function () {
  'use strict';
  function initDocumentScanner() {
  var root=document.querySelector('#img-pane-scan');
  if(!root||root.dataset.dsBound==='1'||!window.TechHatScanGeometry||!window.TechHatDocumentCore)return;
  root.dataset.dsBound='1';root.dataset.editing='false';
  var G=window.TechHatScanGeometry,C=window.TechHatDocumentCore;
  var $=function(s){return root.querySelector(s);},$$=function(s){return Array.from(root.querySelectorAll(s));};
  var pages=[],activeId=null,nextId=1,renderToken=0,busy=false,compare=false;
  var source=null,sourcePage=null,sourceRot=null,nativeW=0,nativeH=0,zoom=1,pan={x:0,y:0},fitMode=true,space=false;
  var previewTimer=0,drag=null,stream=null,cameraFacing='environment',cameraToken=0;
  var worker=null,jobId=0,jobs=new Map(),eraserActive=false,eraserTool='brush',prevDrawTool='brush',eraserSize=24,eraserHardness=80,eraserOpacity=100,eraserFlow=100,eraserMode='normal',healSample='below',wandTolerance=28,eraserColor='#ffffff',eraserStroke=null,lastBrushPt=null,rectDrag=null,pZoom=1,pPan={x:0,y:0},pPanDrag=null;
  var selCombineMode='new',selFeather=0,selAA=true,marqueeStyle='normal',marqueeW=1,marqueeH=1,autoSelectLayer=true,showTransformControls=true,layerSeq=1;
  var learningKey='techhat-scan-crop-learning-v1',learningTimer=0;
  var controls={brightness:'dsBrightness',contrast:'dsContrast',sharpness:'dsSharpness',angle:'dsAngle',curve:'dsCurve',trim:'dsTrim'};
  var settingsDefault=function(){return {filter:'magic_plus',shadow:true,text:true,straighten:true,cleanSpots:true,cleanMargins:true,brightness:100,contrast:100,sharpness:25,angle:0,curve:0,trim:0};};
  function en(){return root.dataset.lang==='en';}
  function tr(bnText,enText){return en()?enText:bnText;}
  function bn(n){return en()?String(n):String(n).replace(/\d/g,function(v){return '০১২৩৪৫৬৭৮৯'[v];});}
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
  function release(p){p.previewCache=null;p.enhanceCache=null;p.sourceCache=null;if(p.item.url)URL.revokeObjectURL(p.item.url);if(p.thumb)URL.revokeObjectURL(p.thumb);p.item.img.src='';}
  function snapshot(p){return {selection:selValid(p)?copy(retSel):null,pts:copy(p.pts),rot:p.rot,settings:copy(p.settings),erases:copy(p.erases||[]),activeLayerId:p.activeLayerId||'bg',bgLocked:p.bgLocked!==false};}
  function remember(p){if(!p)return;var snap=snapshot(p);if(p.undo.length&&JSON.stringify(p.undo[p.undo.length-1])===JSON.stringify(snap))return;p.undo.push(snap);if(p.undo.length>35)p.undo.shift();p.redo=[];}
  function changed(p){p.revision++;compare=false;$('#dsCompare').setAttribute('aria-pressed','false');updateControls();schedulePreview();}
  function historyAction(redo){var p=current();if(!p)return;var from=redo?p.redo:p.undo,to=redo?p.undo:p.redo;if(!from.length)return;to.push(snapshot(p));var st=from.pop();retSel=st.selection||null;renderSelection();p.pts=st.pts;p.rot=st.rot;p.settings=st.settings;p.erases=copy(st.erases||[]);p.activeLayerId=st.activeLayerId||'bg';p.bgLocked=st.bgLocked!==false;p.revision++;sourcePage=null;updateControls();drawSource();schedulePreview();}
  function setBusy(value,text){busy=value;root.setAttribute('aria-busy',String(value));$$('button,input,select').forEach(function(el){if(value){el.dataset.dsWasDisabled=el.disabled?'1':'0';el.disabled=true;}else if('dsWasDisabled' in el.dataset){el.disabled=el.dataset.dsWasDisabled==='1';delete el.dataset.dsWasDisabled;}});if(text)status(text);if(!value){renderList();updateControls();}}
  function workerJob(kind,image,options){
    var backup=new Uint8ClampedArray(image.data),w=image.width,h=image.height;function runMain(){return kind==='detect'?C.detect(backup,w,h):C.process(backup,w,h,options);}if(!worker){try{worker=new Worker('/js/document-scan-worker.js?v=31');worker.onmessage=function(e){var job=jobs.get(e.data.id);if(!job)return;jobs.delete(e.data.id);if(e.data.error){try{job.resolve(job.fallback());}catch(err){job.reject(new Error(e.data.error));}}else job.resolve(e.data.result||{data:new Uint8ClampedArray(e.data.buffer),info:e.data.info});};worker.onerror=function(ev){if(ev&&ev.preventDefault)ev.preventDefault();var pending=Array.from(jobs.values());jobs.clear();try{worker.terminate();}catch(e){}worker=null;pending.forEach(function(j){try{j.resolve(j.fallback());}catch(err){j.reject(err);}});};}catch(e){worker=null;}}
    if(!worker)return Promise.resolve(kind==='detect'?C.detect(image.data,image.width,image.height):C.process(image.data,image.width,image.height,options));
    return new Promise(function(resolve,reject){var id=++jobId;jobs.set(id,{resolve:resolve,reject:reject,fallback:runMain});try{worker.postMessage({id:id,kind:kind,width:w,height:h,buffer:image.data.buffer,options:options},[image.data.buffer]);}catch(e){jobs.delete(id);worker=null;try{resolve(runMain());}catch(err){reject(err);}}});
  }
  async function detectPage(p){var c=G.rotate(p.item.img,p.rot,700,1),im=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height);return workerJob('detect',im);}
  function canvasBlob(c,q,mime){return new Promise(function(resolve,reject){c.toBlob(function(b){if(b)resolve(b);else reject(new Error('ছবি তৈরি করা যায়নি'));},mime||'image/jpeg',q||.92);});}
  function download(blob,name){var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},30000);}
  function filename(){return ($('#dsFilename').value.trim()||'TechHat-document').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-');}
  function icon(name){var ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('class','w-3 h-3 stroke-[2] fill-none stroke-current shrink-0');var p=document.createElementNS(ns,'path');p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');p.setAttribute('d',name==='up'?'m6 14 6-6 6 6':name==='down'?'m6 10 6 6 6-6':'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7');s.appendChild(p);return s;}
  function renderList(){
    var list=$('#dsPageList');list.replaceChildren();$('#dsCount').textContent=bn(pages.length);$('#dsExportCount').textContent=bn(pages.length)+(en()?(pages.length===1?' page':' pages'):' পেজ');
    pages.forEach(function(p,index){
      var isAct=p.id===activeId;
      var card=document.createElement('div');
      card.className='ds-page grid grid-cols-[1fr_auto] items-center gap-1.5 p-1.5 rounded-lg border transition-colors '+(isAct?'is-active border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-2 ring-emerald-500/15':'border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/80 dark:hover:bg-studio-surface');
      card.draggable=!busy;card.dataset.pageId=p.id;
      var select=document.createElement('button');select.type='button';
      select.className='ds-page-select min-w-0 grid grid-cols-[44px_minmax(0,1fr)] items-center gap-2 p-0 border-0 bg-transparent text-left cursor-pointer';
      select.setAttribute('aria-label',tr('পেজ '+bn(index+1)+' নির্বাচন করুন','Select page '+bn(index+1)));select.setAttribute('aria-pressed',String(isAct));
      var thumb=document.createElement('span');thumb.className='ds-thumb w-11 h-14 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-studio-border grid place-items-center shrink-0';
      var image=document.createElement('img');image.src=p.thumb||p.item.url;image.alt=tr('পেজ ','Page ')+bn(index+1);image.draggable=false;image.className='w-full h-full object-cover block';thumb.appendChild(image);
      var label=document.createElement('span');label.className='ds-page-label min-w-0 grid gap-0.5';
      var b=document.createElement('b');b.className='text-[13px] font-bold text-slate-800 dark:text-studio-text truncate';b.textContent=tr('পেজ ','Page ')+bn(index+1);
      var small=document.createElement('small');small.className='text-[11.5px] text-slate-500 dark:text-studio-muted truncate';small.textContent=p.item.name;
      label.append(b,small);select.append(thumb,label);select.addEventListener('click',function(){if(!busy)selectPage(p.id);});card.appendChild(select);
      var actions=document.createElement('div');actions.className='ds-page-actions grid gap-1';
      ['up','down','delete'].forEach(function(action){
        var btn=document.createElement('button');btn.type='button';
        btn.className='inline-flex items-center justify-center w-6 h-6 p-0 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-slate-500 dark:text-studio-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed '+(action==='delete'?'hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10':'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-studio-surface');
        btn.title=action==='up'?tr('আগে নিন','Move up'):action==='down'?tr('পরে নিন','Move down'):tr('এই পেজ সরান','Remove page');btn.setAttribute('aria-label',tr('পেজ ','Page ')+bn(index+1)+' '+btn.title);btn.appendChild(icon(action));btn.disabled=busy||(action==='up'&&index===0)||(action==='down'&&index===pages.length-1);btn.addEventListener('click',function(){if(busy)return;if(action==='delete'){renderToken++;pages=pages.filter(function(v){return v!==p;});release(p);if(activeId===p.id){activeId=pages[Math.min(index,pages.length-1)]?.id||null;sourcePage=null;}renderList();showState();drawSource();schedulePreview();}else movePage(index,index+(action==='up'?-1:1));});actions.appendChild(btn);
      });card.appendChild(actions);
      card.addEventListener('dragstart',function(e){if(busy){e.preventDefault();return;}e.dataTransfer.setData('application/x-techhat-scan-page',String(p.id));e.dataTransfer.effectAllowed='move';card.classList.add('is-dragging');});card.addEventListener('dragend',function(){card.classList.remove('is-dragging');});card.addEventListener('dragover',function(e){if(Array.from(e.dataTransfer.types).includes('application/x-techhat-scan-page')){e.preventDefault();e.dataTransfer.dropEffect='move';}});card.addEventListener('drop',function(e){var id=Number(e.dataTransfer.getData('application/x-techhat-scan-page'));if(!id||busy)return;e.preventDefault();e.stopPropagation();movePage(pages.findIndex(function(v){return v.id===id;}),index);});list.appendChild(card);
    });
  }
  function movePage(from,to){if(from<0||to<0||to>=pages.length||from===to)return;pages.splice(to,0,pages.splice(from,1)[0]);renderList();updateControls();status(tr('পেজের ক্রম আপডেট হয়েছে','Page order updated'));}
  function showState(){var has=pages.length>0;root.dataset.hasPages=String(has);$('#dsEmpty').hidden=has;$('#dsWorkspace').hidden=!has;updateControls();if(has)requestAnimationFrame(function(){if(fitMode)fit();});}
  function closeDrawers(){delete root.dataset.drawer;var bd=$('#dsDrawerBackdrop');if(bd)bd.hidden=true;}
  function loadPdfJs(){if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);if(loadPdfJs.promise)return loadPdfJs.promise;loadPdfJs.promise=new Promise(function(resolve,reject){var s=document.createElement('script');s.src='/vendor/pdf.min.js';s.onload=function(){if(window.pdfjsLib){window.pdfjsLib.GlobalWorkerOptions.workerSrc='/vendor/pdf.worker.min.js';resolve(window.pdfjsLib);}else reject(new Error('PDF reader failed to initialize'));};s.onerror=function(){loadPdfJs.promise=null;s.remove();reject(new Error('Could not load PDF reader'));};document.head.appendChild(s);});return loadPdfJs.promise;}
  async function expandInputFiles(rawFiles){var out=[],list=Array.from(rawFiles||[]);for(var i=0;i<list.length;i++){var f=list[i];if(f&&(f.type==='application/pdf'||/\.pdf$/i.test(f.name||''))){status(tr('PDF ফাইল থেকে পেজ লোড হচ্ছে…','Extracting pages from PDF…'));var pdfjs=await loadPdfJs(),doc=await pdfjs.getDocument({data:await f.arrayBuffer()}).promise,base=(f.name||'document').replace(/\.pdf$/i,''),maxPages=Math.min(doc.numPages,Math.max(1,60-(pages.length+out.length)));for(var p=1;p<=maxPages;p++){status(tr('PDF পেজ ','PDF Page ')+bn(p)+' / '+bn(maxPages)+tr(' প্রস্তুত হচ্ছে…',' rendering…'));var page=await doc.getPage(p),vp=page.getViewport({scale:2.2}),c=document.createElement('canvas');c.width=Math.round(vp.width);c.height=Math.round(vp.height);var ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);await page.render({canvasContext:ctx,viewport:vp}).promise;var blob=await canvasBlob(c,.95,'image/jpeg');c.width=c.height=1;out.push(new File([blob],base+'-page-'+p+'.jpg',{type:'image/jpeg'}));}}else if(f)out.push(f);}return out;}
  async function pasteFromClipboard(){if(busy)return;if(!navigator.clipboard||!navigator.clipboard.read){toast(tr('কিবোর্ডে Ctrl+V চেপে ক্লিপবোর্ড থেকে ছবি পেস্ট করুন','Press Ctrl+V on your keyboard to paste an image from clipboard'));return;}try{var items=await navigator.clipboard.read(),pasted=[];for(var i=0;i<items.length;i++){var types=items[i].types||[],imgType=types.find(function(t){return t.indexOf('image/')===0;});if(imgType){var blob=await items[i].getType(imgType),ext=(imgType.split('/')[1]||'png').replace(/[^a-z0-9]/gi,'');pasted.push(new File([blob],'clipboard-'+Date.now()+'-'+(i+1)+'.'+ext,{type:imgType}));}}if(pasted.length)await addFiles(pasted);else toast(tr('ক্লিপবোর্ডে কোনো ছবি পাওয়া যায়নি। আগে ছবি কপি করে পেস্ট (Ctrl+V) করুন।','No image found in clipboard. Copy an image first or press Ctrl+V.'));}catch(err){toast(tr('কিবোর্ডে Ctrl+V চেপে ক্লিপবোর্ড থেকে ছবি পেস্ট করুন','Press Ctrl+V on your keyboard to paste from clipboard'));}}
  function selectPage(id){closeDrawers();if(id===activeId)return;if(txtEdit)commitTextEdit();activeId=id;restorePageCache(current());compare=false;sourcePage=null;fitMode=true;pan={x:0,y:0};$('#dsCompare').setAttribute('aria-pressed','false');renderList();updateControls();drawSource();schedulePreview();}
  async function addFiles(files){
    if(busy)return;files=Array.from(files||[]);if(!files.length)return;
    if(pages.length+files.length>60){toast(tr('এক ডকুমেন্টে সর্বোচ্চ ৬০টি পেজ যোগ করুন।','Add up to 60 pages per document.'));return;}
    setBusy(true,tr('পেজ যোগ হচ্ছে…','Adding pages…'));var added=[],errors=[];
    try{files=await expandInputFiles(files);if(!files.length)return;if(pages.length+files.length>60){toast(tr('এক ডকুমেন্টে সর্বোচ্চ ৬০টি পেজ যোগ করুন।','Add up to 60 pages per document.'));return;}for(var i=0;i<files.length;i++){
      status(tr('পেজ ','Page ')+bn(i+1)+' / '+bn(files.length)+tr(' · সীমানা শনাক্ত হচ্ছে…',' · Detecting borders…'));await tick();var item;
      try{if(files[i].size>40*1024*1024)throw new Error(tr('ছবির সাইজ ৪০ MB-এর মধ্যে রাখুন','Keep image size under 40 MB'));item=await G.load(files[i]);if(item.width*item.height>60000000)throw new Error(tr('ছবিটি ৬০ মেগাপিক্সেলের মধ্যে রাখুন','Keep image under 60 megapixels'));
        var p={id:nextId++,item:item,rot:0,pts:C.fullQuad(),settings:settingsDefault(),erases:[],revision:0,undo:[],redo:[],thumb:null};var detected;try{detected=await detectPage(p);}catch(detErr){console.warn('Auto detect fallback:',detErr);detected={pts:C.fullQuad(),auto:false,confidence:0,rotation:0};}if(detected.rotation){p.rot=(p.rot+detected.rotation)%360;detected.pts=rotateQuad(detected.pts,detected.rotation);}p.autoPts=copy(detected.pts);if(!detected.flatbed)detected=applyLearnedCrop(p,detected);p.detectedPts=copy(detected.pts);p.pts=detected.pts;p.detected=detected.auto;p.confidence=detected.confidence;p.learnedApplied=!!detected.learned;pages.push(p);added.push(p);
        try{var thumb=await processPage(p,1100,false);p.previewCache={revision:p.revision,canvas:thumb};p.enhanceCache={key:processPage._eKey,data:processPage._eData,info:processPage._eInfo,width:thumb.width,height:thumb.height};var small=document.createElement('canvas'),ratio=Math.min(1,180/Math.max(thumb.width,thumb.height));small.width=Math.round(thumb.width*ratio);small.height=Math.round(thumb.height*ratio);small.getContext('2d').drawImage(thumb,0,0,small.width,small.height);p.thumb=URL.createObjectURL(await canvasBlob(small,.75));}catch(thumbErr){console.warn('Thumbnail fallback:',thumbErr);}
      }catch(error){if(item&&!pages.some(function(v){return v.item===item;}))URL.revokeObjectURL(item.url);errors.push(files[i].name+': '+error.message);}
    }
    if(added.length){if(eraserActive)setEraserMode(false);view('split');activeId=added[0].id;restorePageCache(current());sourcePage=null;fitMode=true;pan={x:0,y:0};}renderList();showState();drawSource();schedulePreview();
    }finally{setBusy(false);}
    if(errors.length)toast(errors.join(' · '));else status(en()?bn(added.length)+(added.length===1?' page added. ':' pages added. ')+(added.some(function(p){return p.learnedApplied;})?'Applied learned crop preferences.':added.some(function(p){return !p.detected;})?'Adjust borders manually on some pages.':'Review the 4 corners if needed.'):bn(added.length)+'টি পেজ যোগ হয়েছে। '+(added.some(function(p){return p.learnedApplied;})?'আগের ক্রপ পছন্দ প্রয়োগ হয়েছে। ':added.some(function(p){return !p.detected;})?'কিছু পেজের সীমানা হাতে ঠিক করুন।':'চার কোণা দেখে প্রয়োজন হলে ঠিক করুন।'));
  }
  function updateControls(){
    var p=current(),has=!!p;
    $$('.ds-presets input,.ds-section:not(.ds-export-settings) input').forEach(function(el){el.disabled=busy||!has;});
    $$('[data-ds]').forEach(function(b){var action=b.dataset.ds;if(['detect','full','left','right','reset-crop','pdf','jpg','png','zip','print','apply-all','reset-color','compare','toggle-eraser','erase-borders'].includes(action))b.disabled=busy||!has;});if($('#dsCompare'))$('#dsCompare').disabled=busy||!has;$$('[data-ds-tool],[data-ds-adj-btn],[data-ds-reset-adj],[data-ds-adj-step],[data-ds-layer-act]').forEach(function(b){b.disabled=busy||!has;});$$('[data-ds-reset-section]').forEach(function(b){if(b.dataset.dsResetSection!=='export')b.disabled=busy||!has;});if(!has&&$('#dsActiveSliderTray'))$('#dsActiveSliderTray').hidden=true;
    var learningButton=$('[data-ds="clear-learning"]');if(learningButton)learningButton.textContent=tr('শেখা উদাহরণ: ','Learned: ')+bn(cropExamples().length);
    $('[data-ds="undo"]').disabled=busy||!has||!p.undo.length;$('[data-ds="redo"]').disabled=busy||!has||!p.redo.length;
    var eraseUndo=$('[data-ds="undo-erase"]'),eraseClear=$('[data-ds="clear-erases"]');if(eraseUndo)eraseUndo.disabled=busy||!has||!(p&&p.erases&&p.erases.length);if(eraseClear)eraseClear.disabled=busy||!has||!(p&&p.erases&&p.erases.length);
    if(!p){renderLayersList();renderTransformBox();return;}
    normalizePageLayers(p);
    $$('input[name=dsFilter]').forEach(function(el){el.checked=el.value===p.settings.filter;});$('#dsShadow').checked=p.settings.shadow;$('#dsText').checked=p.settings.text;$('#dsStraighten').checked=!!p.settings.straighten;$('#dsCleanSpots').checked=!!p.settings.cleanSpots;$('#dsCleanMargins').checked=!!p.settings.cleanMargins;$('#dsCleanMargins').disabled=busy||!p.settings.straighten;
    var defSt=settingsDefault();Object.keys(controls).forEach(function(key){var el=$('#'+controls[key]);if(!el)return;el.value=p.settings[key];$('#'+controls[key]+'Value').textContent=p.settings[key]+(key==='angle'?'°':key==='curve'?'':'%');var pod=$('[data-ds-adj-pod="'+key+'"]');if(pod)pod.dataset.modified=String(Number(p.settings[key])!==Number(defSt[key]));var mn=Number(el.min),mx=Number(el.max),pct=mx>mn?Math.max(0,Math.min(100,((Number(p.settings[key])-mn)/(mx-mn))*100)):0;var fill=$('[data-ds-adj-fill="'+key+'"]'),bar=$('[data-ds-adj-bar="'+key+'"]');if(fill)fill.style.width=pct+'%';if(bar)bar.style.width=pct+'%';});
    $('#dsPageName').textContent=tr('পেজ ','Page ')+bn(pages.indexOf(p)+1)+' / '+bn(pages.length);
    renderLayersList();renderTransformBox();
  }
  function drawSource(){
    var p=current();if(!p)return;
    if(sourcePage!==p.id||sourceRot!==p.rot){source=p.sourceCache&&p.sourceCache.rot===p.rot?p.sourceCache.canvas:G.rotate(p.item.img,p.rot,1500,1);p.sourceCache={rot:p.rot,canvas:source};sourcePage=p.id;sourceRot=p.rot;var sw=p.rot%180!==0;nativeW=sw?p.item.height:p.item.width;nativeH=sw?p.item.width:p.item.height;var canvas=$('#dsSource');canvas.width=source.width;canvas.height=source.height;canvas.getContext('2d').drawImage(source,0,0);$('#dsQuad').setAttribute('viewBox','0 0 '+source.width+' '+source.height);$('#dsPlane').style.width=nativeW+'px';$('#dsPlane').style.height=nativeH+'px';}
    if(fitMode)fit();else syncPlane();drawQuad();
  }
  function syncPlane(){if(!current())return;$('#dsPlane').style.transform='translate('+(pan.x-nativeW*zoom/2)+'px,'+(pan.y-nativeH*zoom/2)+'px) scale('+zoom+')';$('#dsZoom').textContent=Math.round(zoom*100)+'%';$$('[data-ds-corner]').forEach(function(b){b.style.width=24/zoom+'px';b.style.height=24/zoom+'px';b.style.borderWidth=4/zoom+'px';});$$('[data-ds-edge]').forEach(function(b){b.style.width=28/zoom+'px';b.style.height=9/zoom+'px';b.style.borderWidth=2.5/zoom+'px';});}
  function fit(){if(!current()||!nativeW)return;var r=$('#dsViewport').getBoundingClientRect();if(!r.width||!r.height)return;zoom=Math.max(.01,Math.min((r.width-60)/nativeW,(r.height-60)/nativeH));pan={x:0,y:0};fitMode=true;syncPlane();}
  function setZoom(z,anchor){var old=zoom;zoom=Math.max(.01,Math.min(8,z));var at=anchor||{x:0,y:0};pan.x=at.x-(at.x-pan.x)*zoom/old;pan.y=at.y-(at.y-pan.y)*zoom/old;fitMode=false;syncPlane();}
  function drawQuad(){var p=current();if(!p||!source)return;var coords=p.pts.map(function(v){return {x:Math.max(0,Math.min(1,v.x))*source.width,y:Math.max(0,Math.min(1,v.y))*source.height};});var points=coords.map(function(v){return v.x+','+v.y;}).join(' ');$('#dsHole').setAttribute('points',points);$('#dsOutline').setAttribute('points',points);$$('[data-ds-corner]').forEach(function(b,i){b.style.left=Math.max(.5,Math.min(99.5,p.pts[i].x*100))+'%';b.style.top=Math.max(.5,Math.min(99.5,p.pts[i].y*100))+'%';b.style.cursor=i%2===0?'nwse-resize':'nesw-resize';});$$('[data-ds-edge]').forEach(function(b,i){var n=(i+1)%4,mx=(p.pts[i].x+p.pts[n].x)*50,my=(p.pts[i].y+p.pts[n].y)*50,deg=Math.atan2(coords[n].y-coords[i].y,coords[n].x-coords[i].x)*180/Math.PI;b.style.left=Math.max(.5,Math.min(99.5,mx))+'%';b.style.top=Math.max(.5,Math.min(99.5,my))+'%';b.style.setProperty('--edge-deg',deg.toFixed(1)+'deg');b.style.cursor=i%2===0?'ns-resize':'ew-resize';});
    $$('[data-ds-line]').forEach(function(line,i){var t=i%2===0?1/3:2/3,a,b;if(i<2){a={x:coords[0].x+(coords[3].x-coords[0].x)*t,y:coords[0].y+(coords[3].y-coords[0].y)*t};b={x:coords[1].x+(coords[2].x-coords[1].x)*t,y:coords[1].y+(coords[2].y-coords[1].y)*t};}else{a={x:coords[0].x+(coords[1].x-coords[0].x)*t,y:coords[0].y+(coords[1].y-coords[0].y)*t};b={x:coords[3].x+(coords[2].x-coords[3].x)*t,y:coords[3].y+(coords[2].y-coords[3].y)*t};}line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);});
  }
  function getEnhanceKey(p,maxDim){var st=p.settings,ptsKey=p.pts.map(function(v){return v.x.toFixed(4)+','+v.y.toFixed(4);}).join('|'),wKey=p.id+'_'+p.rot+'_'+maxDim+'_'+(st.angle||0).toFixed(2)+'_'+ptsKey;return {wKey:wKey,eKey:wKey+'_'+st.filter+'_'+st.shadow+'_'+st.text+'_'+st.straighten+'_'+st.cleanSpots+'_'+st.cleanMargins+'_'+st.brightness+'_'+st.contrast+'_'+st.sharpness+'_'+(st.curve||0)};}
  function canInstantRender(p){return !!(p&&!compare&&processPage._eData&&processPage._eKey===getEnhanceKey(p,1100).eKey);}
  async function processPage(p,maxDim,original,skipText){
    var st=copy(p.settings),ptsKey=p.pts.map(function(v){return v.x.toFixed(4)+','+v.y.toFixed(4);}).join('|'),wKey=p.id+'_'+p.rot+'_'+maxDim+'_'+(st.angle||0).toFixed(2)+'_'+ptsKey,warped,cachedHit=maxDim===1100&&processPage._wKey===wKey&&processPage._wData;if(cachedHit){warped=document.createElement('canvas');warped.width=processPage._wW;warped.height=processPage._wH;if(original)warped.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(processPage._wData),warped.width,warped.height),0,0);}else{var src=(maxDim===1100&&sourcePage===p.id&&sourceRot===p.rot&&source)?source:G.rotate(p.item.img,p.rot,maxDim+300,1);warped=G.warp(src,p.pts,1,maxDim,true);}
    if(original)return warped;
    if(!cachedHit&&Math.abs(st.angle)>.01){var rotated=document.createElement('canvas');rotated.width=warped.width;rotated.height=warped.height;var ctx=rotated.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,rotated.width,rotated.height);ctx.translate(rotated.width/2,rotated.height/2);ctx.rotate(st.angle*Math.PI/180);ctx.drawImage(warped,-warped.width/2,-warped.height/2);warped=rotated;}if(!cachedHit&&maxDim===1100){var wIm=warped.getContext('2d',{willReadFrequently:true}).getImageData(0,0,warped.width,warped.height);processPage._wKey=wKey;processPage._wW=warped.width;processPage._wH=warped.height;processPage._wData=new Uint8ClampedArray(wIm.data);}
    st.trim=p.settings.trim||0;st.bgColor=p.settings.bgColor||eraserColor||'#ffffff';st.erases=copy(p.erases||[]);
    var eKey=getEnhanceKey(p,maxDim).eKey,context=warped.getContext('2d',{willReadFrequently:true}),erOpt=skipText?{skipSimpleText:true}:null;if(maxDim===1100&&processPage._eKey===eKey&&processPage._eData){var fastOut=new Uint8ClampedArray(processPage._eData);if(st.trim>0&&C.applyTrim)C.applyTrim(fastOut,warped.width,warped.height,st.trim,st.bgColor);if(st.erases&&st.erases.length&&C.applyErases)C.applyErases(fastOut,warped.width,warped.height,st.erases,erOpt);context.putImageData(new ImageData(fastOut,warped.width,warped.height),0,0);if(!skipText)drawTextLayers(context,warped.width,warped.height,st.erases);warped._scanInfo=processPage._eInfo;return warped;}var im=cachedHit?new ImageData(new Uint8ClampedArray(processPage._wData),warped.width,warped.height):context.getImageData(0,0,warped.width,warped.height),workerSt=Object.assign({},st,{trim:maxDim===1100?0:st.trim,erases:[]}),result=await workerJob('enhance',im,workerSt);if(maxDim===1100){processPage._eKey=eKey;processPage._eData=new Uint8ClampedArray(result.data);processPage._eInfo=result.info;if(st.trim>0&&C.applyTrim)C.applyTrim(result.data,warped.width,warped.height,st.trim,st.bgColor);if(st.erases&&st.erases.length&&C.applyErases)C.applyErases(result.data,warped.width,warped.height,st.erases,erOpt);}if(maxDim!==1100&&st.erases&&st.erases.length)C.applyErases(result.data,warped.width,warped.height,st.erases);context.putImageData(new ImageData(result.data,warped.width,warped.height),0,0);if(!skipText)drawTextLayers(context,warped.width,warped.height,st.erases);warped._scanInfo=result.info;return warped;
  }
  var previewLoadStart=0,previewDoneTimer=null,previewHideTimer=null;
  function setPreviewLoading(on){
    var loader=$('#dsPreviewLoader'),wrap=$('#dsPreviewWrap'),canvas=$('#dsPreview');
    if(!loader)return;
    clearTimeout(previewDoneTimer);
    clearTimeout(previewHideTimer);
    if(on){
      if(loader.hidden||loader.dataset.state!=='loading')previewLoadStart=performance.now();
      loader.dataset.state='loading';
      loader.hidden=false;
      if(wrap)wrap.classList.add('is-generating');
    }else{
      if(wrap)wrap.classList.remove('is-generating');
      if(canvas){
        canvas.classList.remove('is-revealing');
        void canvas.offsetWidth;
        canvas.classList.add('is-revealing');
      }
      if(loader.hidden)return;
      loader.dataset.state='done';
      previewDoneTimer=setTimeout(function(){
        loader.dataset.state='exiting';
        previewHideTimer=setTimeout(function(){
          loader.hidden=true;
          loader.dataset.state='loading';
        },260);
      },380);
    }
  }
  // Keep each page's enhanced pixels and final preview independent of the active tab.
  function restorePageCache(p){
    var cache=p&&p.enhanceCache;
    processPage._wKey=null;processPage._wData=null;
    if(cache&&cache.key===getEnhanceKey(p,1100).eKey){processPage._eKey=cache.key;processPage._eData=cache.data;processPage._eInfo=cache.info;processPage._wW=cache.width;processPage._wH=cache.height;}
    else{processPage._eKey=null;processPage._eData=null;}
  }
  function cachePagePreview(p){
    if(!p||compare||txtEdit||!canInstantRender(p))return;
    var c=$('#dsPreview'),cached=p.previewCache&&p.previewCache.canvas||document.createElement('canvas');
    cached.width=c.width;cached.height=c.height;cached.getContext('2d').drawImage(c,0,0);
    p.previewCache={revision:p.revision,canvas:cached};
    p.enhanceCache={key:processPage._eKey,data:processPage._eData,info:processPage._eInfo,width:c.width,height:c.height};
  }
  function showCachedPreview(p){
    var saved=p.previewCache;if(compare||!saved||saved.revision!==p.revision)return false;
    var c=$('#dsPreview');c.width=saved.canvas.width;c.height=saved.canvas.height;c.getContext('2d').drawImage(saved.canvas,0,0);
    var text=$('#dsTextLayer');text.width=c.width;text.height=c.height;
    clearTimeout(previewDoneTimer);clearTimeout(previewHideTimer);$('#dsPreviewLoader').hidden=true;$('#dsPreviewWrap').classList.remove('is-generating');
    root.style.setProperty('--ds-ratio',c.width/c.height);$('#dsPreviewMeta').textContent=c.width+' × '+c.height+' px';
    renderDomTextOverlay();renderSelection();renderLayersList();renderTransformBox();positionTextEditor();
    status(tr('পেজ '+bn(pages.indexOf(p)+1)+' প্রস্তুত','Page '+bn(pages.indexOf(p)+1)+' ready'));return true;
  }
  function schedulePreview(){clearTimeout(previewTimer);var token=++renderToken,p=current();if(p&&showCachedPreview(p))return;if(p&&canInstantRender(p)){renderPreview(token,true);return;}if(p&&!eraserStroke)setPreviewLoading(true);previewTimer=setTimeout(function(){renderPreview(token,false);},60);}
  async function renderPreview(token,instant){
    var p=current();if(!p)return;var version=p.revision,id=p.id,isCompare=compare;
    try{if(!instant&&!eraserStroke){setPreviewLoading(true);status(tr('প্রিভিউ তৈরি হচ্ছে…','Rendering preview…'));await new Promise(requestAnimationFrame);}var out=await processPage(p,1100,isCompare,true);if(token!==renderToken||activeId!==id||p.revision!==version)return;if(!instant){var elapsed=performance.now()-previewLoadStart;if(elapsed<220)await new Promise(function(r){setTimeout(r,220-elapsed);});if(token!==renderToken||activeId!==id||p.revision!==version)return;}var canvas=$('#dsPreview');canvas.width=out.width;canvas.height=out.height;canvas.getContext('2d').drawImage(out,0,0);renderTextOverlay();cachePagePreview(p);renderSelection();renderLayersList();renderTransformBox();positionTextEditor();if(!instant)setPreviewLoading(false);root.style.setProperty('--ds-ratio',out.width/out.height);$('#dsPreviewMeta').textContent=isCompare?tr('মূল ছবি','Original'):out.width+' × '+out.height+' px';status(tr('পেজ '+bn(pages.indexOf(p)+1)+' প্রস্তুত · পরিবর্তন স্বয়ংক্রিয়ভাবে প্রিভিউতে দেখা যায়','Page '+bn(pages.indexOf(p)+1)+' ready · Changes update automatically in preview'));
      if(!isCompare){setTimeout(async function(){if(token!==renderToken||!pages.includes(p))return;var thumb=document.createElement('canvas');var sc=Math.min(1,180/Math.max(out.width,out.height));thumb.width=Math.round(out.width*sc);thumb.height=Math.round(out.height*sc);var tctx=thumb.getContext('2d');tctx.drawImage(out,0,0,thumb.width,thumb.height);drawSimpleTextToCanvas(tctx,thumb.width,thumb.height,p.erases);var tLayer=$('#dsTextLayer');if(tLayer&&tLayer.width)tctx.drawImage(tLayer,0,0,thumb.width,thumb.height);var blob=await canvasBlob(thumb,.75);if(token!==renderToken||!pages.includes(p))return;var previous=p.thumb;p.thumb=URL.createObjectURL(blob);var image=$('.ds-page[data-page-id="'+p.id+'"] .ds-thumb img');if(image)image.src=p.thumb;if(previous)URL.revokeObjectURL(previous);renderLayersList();},450);}
    }catch(error){if(token===renderToken){setPreviewLoading(false);toast(error.message||tr('প্রিভিউ তৈরি করা যায়নি','Could not render preview'));}}
  }
  function applySetting(key,value,checkpoint){var p=current();if(!p||busy)return;if(checkpoint)remember(p);p.settings[key]=value;changed(p);}
  function view(value){if(value==='crop')value='split';if(eraserActive&&value!=='preview')setEraserMode(false);root.dataset.view=value;$$('[data-ds-view]').forEach(function(btn){btn.setAttribute('aria-pressed',String((btn.dataset.dsView==='crop'?'split':btn.dataset.dsView)===value));});requestAnimationFrame(function(){if(fitMode)fit();fitPreview();});}
  function stopCamera(){cameraToken++;if(stream)stream.getTracks().forEach(function(t){t.stop();});stream=null;$('#dsVideo').srcObject=null;}
  async function openCamera(){
    if(busy)return;if(!navigator.mediaDevices?.getUserMedia){$('#dsCameraFallback').click();return;}
    var dialog=$('#dsCameraDialog');if(!dialog.open)dialog.showModal();stopCamera();var token=cameraToken;
    try{var newStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:cameraFacing},width:{ideal:1920},height:{ideal:2560}},audio:false});if(token!==cameraToken||!dialog.open){newStream.getTracks().forEach(function(t){t.stop();});return;}stream=newStream;$('#dsVideo').srcObject=stream;await $('#dsVideo').play();}catch(error){if(token!==cameraToken)return;dialog.close();toast('ক্যামেরা খোলা যায়নি। ক্যামেরার অনুমতি দিন অথবা ছবি যোগ করুন।');}
  }
  function loadPdf(){if(window.PDFLib)return Promise.resolve(window.PDFLib);if(loadPdf.promise)return loadPdf.promise;loadPdf.promise=new Promise(function(resolve,reject){var script=document.createElement('script');script.src='/vendor/pdf-lib.min.js';script.onload=function(){resolve(window.PDFLib);};script.onerror=function(){loadPdf.promise=null;script.remove();reject(new Error('PDF লাইব্রেরি লোড করা যায়নি'));};document.head.appendChild(script);});return loadPdf.promise;}
  async function exportPages(kind){
    if(busy||!pages.length)return;renderToken++;clearTimeout(previewTimer);var list=(kind==='jpg'||kind==='png')?[current()]:pages.slice();var name=filename(),paper=$('#dsPaper').value,margin=$('#dsMargin').checked;var quality=$('#dsQuality').value,maxDim=quality==='high'?3000:quality==='small'?1400:2200;
    if(kind==='print'){
      setBusy(true,tr('প্রিন্ট প্রস্তুত হচ্ছে…','Preparing print…'));
      try{
        var urls=[];
        for(var pi=0;pi<list.length;pi++){
          status(tr('প্রিন্ট · পেজ ','Print · Page ')+bn(pi+1)+' / '+bn(list.length));
          await tick();
          var pc=await processPage(list[pi],2200,false),pb=await canvasBlob(pc,.92,'image/jpeg');
          urls.push(URL.createObjectURL(pb));
          pc.width=pc.height=1;
        }
        var iframe=document.createElement('iframe');
        iframe.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
        document.body.appendChild(iframe);
        var doc=iframe.contentWindow.document;
        var pad=margin?'12mm':'0';
        var pgSize=paper==='letter'?'letter':'A4';
        doc.open();
        doc.write('<!doctype html><html><head><title>'+name+'</title><style>@page{size:'+pgSize+';margin:'+pad+'}body{margin:0;background:#fff}img{display:block;width:100%;max-height:100vh;object-fit:contain;page-break-after:always}img:last-child{page-break-after:auto}</style></head><body>'+urls.map(function(u){return '<img src="'+u+'">';}).join('')+'</body></html>');
        doc.close();
        await new Promise(function(res){iframe.onload=res;setTimeout(res,450);});
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(function(){urls.forEach(function(u){URL.revokeObjectURL(u);});iframe.remove();},60000);
        status(tr('প্রিন্ট উইন্ডো খোলা হয়েছে','Print dialog opened'));
      }catch(err){toast(err.message||tr('প্রিন্ট করা যায়নি','Print failed'));}finally{setBusy(false);schedulePreview();}
      return;
    }
    setBusy(true,tr('এক্সপোর্ট প্রস্তুত হচ্ছে…','Preparing export…'));
    try{var pdf,zip;if(kind==='pdf'){var lib=await loadPdf();pdf=await lib.PDFDocument.create();pdf.setProducer('TechHat Document Scanner');pdf.setTitle(name);}if(kind==='zip'){if(!window.JSZip)throw new Error(tr('ZIP লাইব্রেরি লোড হয়নি','ZIP library not loaded'));zip=new window.JSZip();}
      for(var i=0;i<list.length;i++){status(tr('এক্সপোর্ট · পেজ ','Exporting · Page ')+bn(i+1)+' / '+bn(list.length));await tick();var canvas=await processPage(list[i],maxDim,false),blob=await canvasBlob(canvas,quality==='small'?.8:.94,kind==='png'?'image/png':'image/jpeg');
        if(kind==='jpg'){download(blob,name+'-page-'+(pages.indexOf(list[i])+1)+'.jpg');}else if(kind==='png'){download(blob,name+'-page-'+(pages.indexOf(list[i])+1)+'.png');}
        else if(kind==='zip'){zip.file(name+'-page-'+String(i+1).padStart(3,'0')+'.jpg',blob);}
        else{var image=await pdf.embedJpg(await blob.arrayBuffer()),ratio=canvas.width/canvas.height;var pw,ph;
          if(paper==='original'){pw=canvas.width*72/200;ph=canvas.height*72/200;}else{pw=paper==='letter'?612:595.28;ph=paper==='letter'?792:841.89;if(ratio>1){var tmp=pw;pw=ph;ph=tmp;}}
          var page=pdf.addPage([pw,ph]),m=margin?18:0,scale=Math.min((pw-m*2)/image.width,(ph-m*2)/image.height),dw=image.width*scale,dh=image.height*scale;page.drawImage(image,{x:(pw-dw)/2,y:(ph-dh)/2,width:dw,height:dh});
        }
        // Do not retain full-resolution canvases across a multipage export.
        canvas.width=canvas.height=1;
      }
      if(pdf)download(new Blob([await pdf.save()],{type:'application/pdf'}),name+'.pdf');if(zip)download(await zip.generateAsync({type:'blob',compression:'STORE'}),name+'.zip');status(en()?bn(list.length)+(list.length===1?' page exported':' pages exported'):bn(list.length)+'টি পেজ এক্সপোর্ট হয়েছে');
    }catch(error){toast(error.message||tr('এক্সপোর্ট করা যায়নি','Export failed'));}finally{setBusy(false);schedulePreview();}
  }
  // Actions use the same per-page geometry and settings for preview and export.
  function closePopovers(except){$$('[data-ds-pop-panel]').forEach(function(p){if(p.dataset.dsPopPanel!==except)p.hidden=true;});$$('[data-ds-pop-btn]').forEach(function(b){if(b.dataset.dsPopBtn!==except)b.setAttribute('aria-expanded','false');});}
  function syncRetouchFills(){
    if($('#dsBrushSizeFill'))$('#dsBrushSizeFill').style.width=Math.max(0,Math.min(100,((eraserSize-2)/(120-2))*100))+'%';
    if($('#dsBrushHardnessFill'))$('#dsBrushHardnessFill').style.width=Math.max(0,Math.min(100,eraserHardness))+'%';
    if($('#dsWandToleranceFill'))$('#dsWandToleranceFill').style.width=Math.max(0,Math.min(100,((wandTolerance-5)/(85-5))*100))+'%';
    if($('#dsBrushOpacityFill'))$('#dsBrushOpacityFill').style.width=Math.max(0,Math.min(100,((eraserOpacity-10)/(100-10))*100))+'%';
    if($('#dsBrushFlowFill'))$('#dsBrushFlowFill').style.width=Math.max(0,Math.min(100,((eraserFlow-1)/(100-1))*100))+'%';
  }
  function toggleAdjSlider(key){var tray=$('#dsActiveSliderTray');if(!tray)return;var pane=key?tray.querySelector('[data-ds-adj-pane="'+key+'"]'):null,isOpen=pane&&!pane.hidden&&!tray.hidden;$$('[data-ds-adj-pane]').forEach(function(el){el.hidden=true;});$$('[data-ds-adj-btn]').forEach(function(b){b.setAttribute('aria-expanded','false');});if(!key||isOpen){tray.hidden=true;return;}if(pane){pane.hidden=false;tray.hidden=false;var btn=$('[data-ds-adj-btn="'+key+'"]');if(btn)btn.setAttribute('aria-expanded','true');}}
  root.addEventListener('click',async function(e){
    var maskBtn=e.target.closest('[data-ds-layer-mask]');if(maskBtn){selectLayerById(maskBtn.dataset.dsLayerMask);editLayerMask(getActiveLayer(current()));return;}
    var styleBtn=e.target.closest('[data-ds-style-effect]');if(styleBtn){selectLayerById(styleBtn.dataset.dsStyleLayer);openEffects(styleBtn.dataset.dsStyleEffect);return;}
    var inspTab=e.target.closest('[data-ds-insp-tab]');
    if(inspTab){var tabId=inspTab.dataset.dsInspTab;$$('[data-ds-insp-tab]').forEach(function(b){var on=b.dataset.dsInspTab===tabId;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',String(on));});$$('[data-ds-insp-pane]').forEach(function(pn){pn.hidden=pn.dataset.dsInspPane!==tabId;});return;}
    var layerVisBtn=e.target.closest('[data-ds-layer-vis]');
    if(layerVisBtn&&!busy){toggleLayerVisibility(layerVisBtn.dataset.dsLayerVis);return;}
    var layerRowBtn=e.target.closest('[data-ds-layer-row]');
    if(layerRowBtn&&!busy){selectLayerById(layerRowBtn.dataset.dsLayerRow);return;}
    var layerActBtn=e.target.closest('[data-ds-layer-act]');
    if(layerActBtn&&!busy&&!layerActBtn.disabled){handleLayerAction(layerActBtn.dataset.dsLayerAct);return;}
    if(e.target.closest('#dsLayerLockBtn')&&!busy){toggleActiveLayerLock();return;}
    var resetRetBtn=e.target.closest('[data-ds-reset-retouch]');if(resetRetBtn&&!busy){var rk=resetRetBtn.dataset.dsResetRetouch;if(rk==='size'){eraserSize=24;if($('#dsBrushSize'))$('#dsBrushSize').value='24';if($('#dsBrushSizeVal'))$('#dsBrushSizeVal').textContent='24px';updateEraserCursor(true);}else if(rk==='hardness'){eraserHardness=80;if($('#dsBrushHardness'))$('#dsBrushHardness').value='80';if($('#dsBrushHardnessVal'))$('#dsBrushHardnessVal').textContent='80%';updateEraserCursor(true);}else if(rk==='tolerance'){wandTolerance=28;if($('#dsWandTolerance'))$('#dsWandTolerance').value='28';if($('#dsWandToleranceVal'))$('#dsWandToleranceVal').textContent='28';}else if(rk==='opacity'){eraserOpacity=100;if($('#dsBrushOpacity'))$('#dsBrushOpacity').value='100';if($('#dsBrushOpacityVal'))$('#dsBrushOpacityVal').textContent='100%';updateEraserCursor(true);}else if(rk==='flow'){eraserFlow=100;if($('#dsBrushFlow'))$('#dsBrushFlow').value='100';if($('#dsBrushFlowVal'))$('#dsBrushFlowVal').textContent='100%';}syncRetouchFills();return;}var resetSecBtn=e.target.closest('[data-ds-reset-section]');if(resetSecBtn&&!busy&&!resetSecBtn.disabled){var sec=resetSecBtn.dataset.dsResetSection,cp=current();if(sec==='export'){if($('#dsFilename'))$('#dsFilename').value='TechHat-document';if($('#dsMargin'))$('#dsMargin').checked=true;if($('#dsPaper'))$('#dsPaper').value='a4';if($('#dsQuality'))$('#dsQuality').value='balanced';toast(tr('এক্সপোর্ট সেটিংস ডিফল্টে রিসেট হয়েছে','Export settings reset to default'));return;}if(!cp)return;remember(cp);var defS=settingsDefault();if(sec==='filter'){cp.settings.filter=defS.filter;changed(cp);toast(tr('ফিল্টার ম্যাজিক+ এ রিসেট হয়েছে','Filter reset to Magic+ AI'));}else if(sec==='smart'){cp.settings.shadow=defS.shadow;cp.settings.text=defS.text;cp.settings.straighten=defS.straighten;cp.settings.cleanSpots=defS.cleanSpots;cp.settings.cleanMargins=defS.cleanMargins;changed(cp);toast(tr('স্মার্ট ফিক্স সেটিংস ডিফল্টে রিসেট হয়েছে','Smart Fix options reset to default'));}else if(sec==='manual'){['brightness','contrast','sharpness','angle','curve','trim'].forEach(function(k){cp.settings[k]=defS[k];});changed(cp);toast(tr('সব ম্যানুয়াল এডজাস্টমেন্ট রিসেট হয়েছে','All manual adjustments reset'));}return;}var resetAdjBtn=e.target.closest('[data-ds-reset-adj]');if(resetAdjBtn&&!busy&&!resetAdjBtn.disabled){var ak=resetAdjBtn.dataset.dsResetAdj,ap=current();if(ap&&ak in controls){var dv=settingsDefault()[ak];if(Number(ap.settings[ak])!==Number(dv)){remember(ap);ap.settings[ak]=dv;changed(ap);}}return;}var stepBtn=e.target.closest('[data-ds-adj-step]');if(stepBtn&&!busy&&!stepBtn.disabled){var tk=stepBtn.dataset.dsAdjTarget,dir=Number(stepBtn.dataset.dsAdjStep)||0,inp=tk?$('#'+controls[tk]):null;if(inp&&current()){var stp=Number(inp.step)||1,mn=Number(inp.min),mx=Number(inp.max),nv=Math.max(mn,Math.min(mx,Number((Number(inp.value)+dir*stp).toFixed(2))));inp.value=String(nv);applySetting(tk,nv,true);}return;}var popBtn=e.target.closest('[data-ds-pop-btn]');if(popBtn&&!busy){var pk=popBtn.dataset.dsPopBtn,pp=$('[data-ds-pop-panel="'+pk+'"]'),wasOpen=pp&&!pp.hidden;closePopovers();if(pp&&!wasOpen){pp.hidden=false;popBtn.setAttribute('aria-expanded','true');}return;}if(!e.target.closest('[data-ds-pop-wrap]'))closePopovers();var adjBtn=e.target.closest('[data-ds-adj-btn]');if(adjBtn&&!busy&&!adjBtn.disabled){toggleAdjSlider(adjBtn.dataset.dsAdjBtn);return;}if(e.target.closest('[data-ds-adj-close]')){toggleAdjSlider(null);return;}var toolBtn=e.target.closest('[data-ds-tool]');if(toolBtn&&!busy&&!toolBtn.disabled){if(!eraserActive)setEraserMode(true);setEraserTool(toolBtn.dataset.dsTool);return;}var swatchBtn=e.target.closest('[data-ds-swatch]');if(swatchBtn&&!busy){setEraserColor(swatchBtn.dataset.dsSwatch,true);return;}var btn=e.target.closest('[data-ds]');if(!btn||btn.disabled)return;var action=btn.dataset.ds,p=current();
    if(action==='add'){$('#dsFiles').click();return;}if(action==='import-files'){($('#dsDocFiles')||$('#dsFiles')).click();return;}if(action==='paste'){pasteFromClipboard();return;}if(action==='theme'){document.querySelector('#themeToggle')?.click();return;}if(action==='camera'){openCamera();return;}if(action==='camera-close'){$('#dsCameraDialog').close();return;}if(action==='camera-switch'){cameraFacing=cameraFacing==='environment'?'user':'environment';openCamera();return;}
    if(action==='capture'){var video=$('#dsVideo');if(!video.videoWidth)return;var capture=document.createElement('canvas');capture.width=video.videoWidth;capture.height=video.videoHeight;capture.getContext('2d').drawImage(video,0,0);var photo=await canvasBlob(capture,.97);$('#dsCameraDialog').close();await addFiles([new File([photo],'camera-'+Date.now()+'.jpg',{type:'image/jpeg'})]);return;}
    if(action==='clear-learning'){try{localStorage.removeItem(learningKey);}catch(e){}updateControls();toast(tr('আপনার ব্যক্তিগত ক্রপ শেখার তথ্য মুছে ফেলা হয়েছে।','Your learned crop preferences have been cleared.'));return;}
    if(action==='reset'){if(pages.length)$('#dsResetDialog').showModal();return;}if(action==='pdf'||action==='jpg'||action==='png'||action==='zip'||action==='print'){exportPages(action);return;}
    if(action==='zoom-in'){setZoom(zoom*1.2);return;}if(action==='zoom-out'){setZoom(zoom/1.2);return;}if(action==='fit'){fit();return;}if(action==='actual'){setZoom(1);return;}
    if(action==='pzoom-in'){setPreviewZoom(pZoom*1.25);return;}if(action==='pzoom-out'){setPreviewZoom(pZoom/1.25);return;}if(action==='pzoom-fit'){setPreviewZoom(1);return;}
    if(action==='close-drawers'){closeDrawers();return;}
    if(action==='toggle-inspector'){var isInsp=root.dataset.drawer==='inspector';if(isInsp)closeDrawers();else{root.dataset.drawer='inspector';var bd1=$('#dsDrawerBackdrop');if(bd1)bd1.hidden=false;}return;}
    if(action==='toggle-sidebar'){if(window.matchMedia('(max-width: 1024px)').matches){var isPg=root.dataset.drawer==='pages';if(isPg)closeDrawers();else{root.dataset.drawer='pages';var bd2=$('#dsDrawerBackdrop');if(bd2)bd2.hidden=false;}}else{var col=root.dataset.sidebarCollapsed==='true';root.dataset.sidebarCollapsed=String(!col);var sbBtn=$('#dsSidebarToggleBtn');if(sbBtn)sbBtn.setAttribute('aria-pressed',String(col));setTimeout(function(){if(fitMode)fit();},200);}return;}
    if(action==='open-color-picker'){($('#dsEraserColor')||$('#dsDockColor'))?.click();return;}
    if(action==='auto-paper-color'){autoDetectPaperColor();return;}
    if(action==='edit-page'){setEraserMode(true);return;}
    if(action==='finish-crop'){view('preview');return;}
    if(action==='toggle-eraser'){setEraserMode(!eraserActive);return;}
    if(action==='close-eraser'){setEraserMode(false);return;}
    if(action==='reset-retouch-params'){eraserSize=24;eraserHardness=80;wandTolerance=28;eraserOpacity=100;eraserFlow=100;eraserMode='normal';healSample='below';if($('#dsBrushSize'))$('#dsBrushSize').value='24';if($('#dsBrushSizeVal'))$('#dsBrushSizeVal').textContent='24px';if($('#dsBrushHardness'))$('#dsBrushHardness').value='80';if($('#dsBrushHardnessVal'))$('#dsBrushHardnessVal').textContent='80%';if($('#dsWandTolerance'))$('#dsWandTolerance').value='28';if($('#dsWandToleranceVal'))$('#dsWandToleranceVal').textContent='28';if($('#dsBrushOpacity'))$('#dsBrushOpacity').value='100';if($('#dsBrushOpacityVal'))$('#dsBrushOpacityVal').textContent='100%';if($('#dsBrushFlow'))$('#dsBrushFlow').value='100';if($('#dsBrushFlowVal'))$('#dsBrushFlowVal').textContent='100%';if($('#dsBrushMode'))$('#dsBrushMode').value='normal';if($('#dsHealSample'))$('#dsHealSample').value='below';syncRetouchFills();setEraserColor('#ffffff',false);toast(tr('রিটাচ টুল সেটিংস ডিফল্টে রিসেট হয়েছে','Retouch tool settings reset to default'));return;}
    if(!p||busy)return;if(action==='undo'){historyAction(false);return;}if(action==='redo'){historyAction(true);return;}
    if(action==='erase-borders'){remember(p);var bLayer=ensurePaintLayer(p);var bc=eraserColor||'#ffffff';bLayer.ops.push({type:'rect',x0:0,y0:0,x1:1,y1:.022,color:bc},{type:'rect',x0:0,y0:.978,x1:1,y1:1,color:bc},{type:'rect',x0:0,y0:0,x1:.022,y1:1,color:bc},{type:'rect',x0:.978,y0:0,x1:1,y1:1,color:bc});changed(p);toast(tr('চারপাশের বর্ডারের বাড়তি ব্যাকগ্রাউন্ড পরিষ্কার করা হয়েছে','Outer border background cleaned'));return;}
    if(action==='undo-erase'){if(p.erases&&p.erases.length){remember(p);normalizePageLayers(p);var topL=p.erases[p.erases.length-1];if(topL&&topL.type==='layer'&&topL.ops&&topL.ops.length>1)topL.ops.pop();else p.erases.pop();changed(p);}return;}
    if(action==='clear-erases'){if(p.erases&&p.erases.length){remember(p);p.erases=[];p.activeLayerId='bg';changed(p);toast(tr('এই পেজের সব দাগ মোছা রিসেট করা হয়েছে','All retouch edits on this page have been reset'));}return;}
    if(action==='detect'){setBusy(true,tr('পেজের সীমানা শনাক্ত হচ্ছে…','Detecting page borders…'));try{remember(p);var det=await detectPage(p);if(det.rotation){p.rot=(p.rot+det.rotation)%360;det.pts=rotateQuad(det.pts,det.rotation);sourcePage=null;fitMode=true;}p.autoPts=copy(det.pts);if(!det.flatbed)det=applyLearnedCrop(p,det);p.detectedPts=copy(det.pts);p.pts=det.pts;p.learnedApplied=!!det.learned;p.detected=det.auto;p.confidence=det.confidence;p.revision++;drawSource();schedulePreview();toast(det.learned?tr('আপনার আগের ক্রপ পছন্দ মিলিয়ে সীমানা ঠিক করা হয়েছে।','Borders adjusted using your learned crop preferences.'):det.auto?tr('পেজের সীমানা শনাক্ত হয়েছে। চার কোণা দেখে নিন।','Page borders detected. Check the 4 corners.'):tr('স্পষ্ট সীমানা পাওয়া যায়নি। পুরো ছবি রাখা হয়েছে; চার কোণা টেনে ঠিক করুন।','Clear borders not found. Full image kept; drag corners to adjust.'));}catch(error){toast(error.message);}finally{setBusy(false);}return;}
    if(action==='apply-all'){
      setBusy(true,tr('সব পেজের ফিল্টার আপডেট হচ্ছে…','Applying filter to all pages…'));
      try { for(var ai=0;ai<pages.length;ai++) { var page=pages[ai];if(page===p)continue;remember(page);var savedAngle=page.settings.angle,savedCurve=page.settings.curve;page.settings=copy(p.settings);page.settings.angle=savedAngle;page.settings.curve=savedCurve;page.revision++;
        var thumbCanvas=await processPage(page,360,false),thumbBlob=await canvasBlob(thumbCanvas,.75);if(page.thumb)URL.revokeObjectURL(page.thumb);page.thumb=URL.createObjectURL(thumbBlob);await tick();
      } toast(tr('সব পেজে ফিল্টার ও আলো সেটিংস প্রয়োগ হয়েছে','Filter and lighting settings applied to all pages')); } catch(error){toast(error.message);}finally{setBusy(false);}return;
    }
    remember(p);
    if(action==='full'){p.pts=C.fullQuad();saveCropLearning(p);}
    if(action==='left'||action==='right'){// Rotate the existing crop together with the image.
      var clockwise=action==='right';p.rot=(p.rot+(clockwise?90:270))%360;function rotatePts(pts){var rotated=pts.map(function(pt){return clockwise?{x:1-pt.y,y:pt.x}:{x:pt.y,y:1-pt.x};});return clockwise?[rotated[3],rotated[0],rotated[1],rotated[2]]:[rotated[1],rotated[2],rotated[3],rotated[0]];}p.pts=rotatePts(p.pts);if(p.detectedPts)p.detectedPts=rotatePts(p.detectedPts);if(p.autoPts)p.autoPts=rotatePts(p.autoPts);sourcePage=null;fitMode=true;
    }
    if(action==='reset-crop'){p.rot=0;p.pts=copy(p.detectedPts||p.autoPts||C.fullQuad());sourcePage=null;fitMode=true;changed(p);drawSource();toast(tr('ক্রপ ও রোটেশন ডিফল্টে রিসেট হয়েছে','Crop and rotation reset to default'));return;}
    if(action==='reset-color')p.settings=settingsDefault();changed(p);drawSource();
  });
  $('#dsFiles').addEventListener('change',function(e){addFiles(e.target.files);e.target.value='';});if($('#dsDocFiles'))$('#dsDocFiles').addEventListener('change',function(e){addFiles(e.target.files);e.target.value='';});$('#dsCameraFallback').addEventListener('change',function(e){addFiles(e.target.files);e.target.value='';});
  document.addEventListener('paste',function(e){if(root.hidden||busy||e.target.closest('input,textarea,select,[contenteditable=true]'))return;var dt=e.clipboardData;if(!dt)return;var pasted=[];if(dt.files&&dt.files.length){for(var fi=0;fi<dt.files.length;fi++)pasted.push(dt.files[fi]);}else if(dt.items&&dt.items.length){for(var ii=0;ii<dt.items.length;ii++){if(dt.items[ii].kind==='file'){var f=dt.items[ii].getAsFile();if(f)pasted.push(f);}}}if(pasted.length){e.preventDefault();e.stopPropagation();addFiles(pasted);}});
  $('#dsCompare').addEventListener('click',function(){compare=!compare;$('#dsCompare').setAttribute('aria-pressed',String(compare));schedulePreview();});
  $$('[data-ds-jump]').forEach(function(btn){btn.addEventListener('click',function(){var target=$(btn.dataset.dsJump);if(target)target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});});
  $$('[data-ds-view]').forEach(function(btn){btn.addEventListener('click',function(){view(btn.dataset.dsView);});});
  $$('input[name=dsFilter]').forEach(function(el){el.addEventListener('change',function(){var p=current();if(!p||busy)return;remember(p);p.settings.filter=el.value;p.settings.shadow=el.value!=='original';p.settings.text=el.value!=='original'&&el.value!=='color';p.settings.sharpness=el.value==='original'?0:25;p.settings.straighten=el.value!=='original';p.settings.cleanSpots=el.value==='magic_plus';p.settings.cleanMargins=el.value==='magic_plus';changed(p);});});
  ['Straighten','CleanSpots','CleanMargins'].forEach(function(key){$('#ds'+key).addEventListener('change',function(e){var p=current();if(!p||busy)return;remember(p);var prop=key[0].toLowerCase()+key.slice(1);p.settings[prop]=e.target.checked;if(prop==='straighten'&&!e.target.checked)p.settings.cleanMargins=false;changed(p);});});
  ['Shadow','Text'].forEach(function(key){$('#ds'+key).addEventListener('change',function(e){applySetting(key.toLowerCase(),e.target.checked,true);});});
  Object.keys(controls).forEach(function(key){var el=$('#'+controls[key]);var checkpoint=false;function start(){if(current()&&!checkpoint){remember(current());checkpoint=true;}}el.addEventListener('pointerdown',start);el.addEventListener('keydown',start);el.addEventListener('input',function(){start();applySetting(key,Number(el.value),false);});el.addEventListener('dblclick',function(){var dv=settingsDefault()[key];el.value=String(dv);applySetting(key,dv,true);});el.addEventListener('change',function(){checkpoint=false;});el.addEventListener('blur',function(){checkpoint=false;});});
  $('#dsResetDialog').addEventListener('close',function(){if(this.returnValue!=='reset')return;renderToken++;clearTimeout(previewTimer);pages.forEach(release);pages=[];activeId=null;source=null;sourcePage=null;$('#dsPreview').width=$('#dsPreview').height=1;renderList();showState();status(tr('নতুন ডকুমেন্টের ছবি যোগ করুন','Add new document images'));});
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
    var inp=$('#dsEraserColor'),dockInp=$('#dsDockColor'),chip=$('#dsEraserColorChip'),code=$('#dsEraserHex'),dockSw=$('#dsDockSwatch');
    if(inp)inp.value=eraserColor;
    if(dockInp)dockInp.value=eraserColor;
    if(chip)chip.style.background=eraserColor;
    if(code)code.textContent=eraserColor.toUpperCase();
    if(dockSw)dockSw.style.background=eraserColor;
    $$('[data-ds-swatch]').forEach(function(b){b.classList.toggle('is-active',b.dataset.dsSwatch?.toLowerCase()===eraserColor);});
    updateEraserCursor();
    if(announce)status(tr('ব্যাকগ্রাউন্ড কালার নির্বাচিত: ','Background color selected: ')+eraserColor.toUpperCase());
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
    toast(tr('ডকুমেন্টের পেপার কালার শনাক্ত হয়েছে: ','Detected document paper color: ')+hex.toUpperCase());
  }
  /* ===================== PHOTOSHOP-STYLE MINI RETOUCH STUDIO ===================== */
  var TOOL_META={
    move:{g:'move',n:'Move Tool',b:'মুভ টুল',k:'V'},
    'marquee-rect':{g:'marquee',n:'Rectangular Marquee Tool',b:'রেক্ট্যাঙ্গুলার মার্কি টুল',k:'M'},
    'marquee-ellipse':{g:'marquee',n:'Elliptical Marquee Tool',b:'ইলিপটিক্যাল মার্কি টুল',k:'M'},
    lasso:{g:'lasso',n:'Lasso Tool',b:'লেসো টুল',k:'L'},
    'lasso-poly':{g:'lasso',n:'Polygonal Lasso Tool',b:'পলিগোনাল লেসো টুল',k:'L'},
    picker:{g:'picker',n:'Eyedropper Tool',b:'আইড্রপার টুল',k:'I'},
    heal:{g:'heal',n:'Spot Healing Brush Tool',b:'স্পট হিলিং ব্রাশ টুল',k:'J'},
    brush:{g:'brush',n:'Brush Tool',b:'ব্রাশ টুল',k:'B'},
    clone:{g:'clone',n:'Clone Stamp Tool',b:'ক্লোন স্ট্যাম্প টুল',k:'S'},
    dodge:{g:'dodge',n:'Dodge Tool',b:'ডজ টুল',k:'O'},
    burn:{g:'dodge',n:'Burn Tool',b:'বার্ন টুল',k:'O'},
    text:{g:'text',n:'Horizontal Type Tool',b:'টেক্সট টুল',k:'T'},
    hand:{g:'hand',n:'Hand Tool',b:'হ্যান্ড টুল',k:'H'},
    zoom:{g:'zoom',n:'Zoom Tool',b:'জুম টুল',k:'Z'}
  };
  var TOOL_HINT={
    move:['মুভ টুল: সিলেকশন বা লেয়ার টেনে সরান বা ৮টি ট্রান্সফর্ম হ্যান্ডেল দিয়ে রিসাইজ করুন','Move Tool: Drag selection/layer or resize with 8 transform handles · Align buttons in top bar'],
    'marquee-rect':['রেক্ট্যাঙ্গুলার মার্কি: টেনে সিলেক্ট করুন · Shift = যোগ · Alt = বিয়োগ · Delete = রঙ দিয়ে ফিল','Rectangular Marquee: Drag to select · Shift = Add · Alt = Subtract · Delete = fill with color'],
    'marquee-ellipse':['ইলিপটিক্যাল মার্কি: টেনে গোল সিলেকশন · Shift = বৃত্ত · Delete = রঙ দিয়ে ফিল','Elliptical Marquee: Drag to select · Shift = circle · Delete = fill'],
    lasso:['লেসো: মাউস চেপে ফ্রিহ্যান্ড সিলেকশন আঁকুন · ফেদার দিয়ে প্রান্ত সফট করুন','Lasso Tool: Hold and draw a freehand selection · Use Feather for soft edges'],
    'lasso-poly':['পলিগোনাল লেসো: ক্লিক করে কোণা যোগ করুন · ডাবল-ক্লিক/Enter = শেষ · Esc = বাতিল','Polygonal Lasso: Click to add points · Double-click / Enter to close · Esc to cancel'],
    picker:['আইড্রপার: ক্লিক করে রঙ নিন','Eyedropper: Click to sample a color'],
    heal:['স্পট হিলিং: দাগের ওপর ব্রাশ করলে চারপাশের কাগজের সাথে মিশে যাবে','Spot Healing Brush: Paint over spots to blend them away'],
    brush:['ব্রাশ: নির্বাচিত রঙে আঁকুন · Alt+ক্লিক = রঙ নিন · [ ] = সাইজ · Shift+[ ] = হার্ডনেস','Brush: Paint with the selected color · Alt+Click samples · [ ] size · Shift+[ ] hardness'],
    clone:['ক্লোন স্ট্যাম্প: Alt+ক্লিক করে সোর্স ঠিক করুন, তারপর আঁকুন','Clone Stamp: Alt+Click to define the source, then paint'],
    dodge:['ডজ: ঘষে উজ্জ্বল করুন (Shadows / Midtones / Highlights)','Dodge Tool: Paint to lighten areas (Shadows / Midtones / Highlights)'],
    burn:['বার্ন: ঘষে গাঢ় করুন (Shadows / Midtones / Highlights)','Burn Tool: Paint to darken areas (Shadows / Midtones / Highlights)'],
    text:['টেক্সট: ক্লিক করে লিখুন · ফন্ট/সাইজ/কালার তাৎক্ষণিক পরিবর্তন হয় · Ctrl+Enter / Esc = কমিট','Type Tool: Click to type · Font/Size/Color update live · Ctrl+Enter or Esc to commit'],
    hand:['হ্যান্ড: টেনে প্যান করুন · ডাবল-ক্লিক = ফিট স্ক্রিন','Hand Tool: Drag to pan · Double-click to fit screen'],
    zoom:['জুম: ক্লিক = জুম ইন · Alt+ক্লিক = জুম আউট · ডানে-বামে টেনে স্ক্রাবি জুম','Zoom Tool: Click to zoom in · Alt+Click to zoom out · Drag left/right for scrubby zoom']
  };
  var PAINT_TOOLS=['brush','heal','clone','dodge','burn'],SEL_TOOLS=['marquee-rect','marquee-ellipse','lasso','lasso-poly'];
  var KEY_TOOLS={v:['move'],m:['marquee-rect','marquee-ellipse'],l:['lasso','lasso-poly'],i:['picker'],j:['heal'],b:['brush'],s:['clone'],o:['dodge','burn'],t:['text'],h:['hand'],z:['zoom']};
  var ZOOM_STEPS=[.2,.25,.33,.5,.67,1,1.5,2,3,4,5,6,8,12,16];
  var groupCur={},tempToolPrev=null,spaceHeld=false,altDown=false;
  var retSel=null,selDraft=null,polyDraft=null,selShift={x:0,y:0};
  var cloneSrc=null,cloneOffset=null,dodgeRange='midtones';
  var txt={font:'Arial',style:'Regular',size:28,align:'left',color:'#111111'},txtEdit=null,activeTextId=null;
  var toolDrag=null,measureCanvas=null,thumbTimer=0;
  var pointerInPreview=false,lastCursorRel={x:.5,y:.5},cursorHudTimer=0,livePaint=null;
  function isPaintTool(t){return PAINT_TOOLS.indexOf(t)>=0;}
  function toolName(t){var m=TOOL_META[t]||TOOL_META.brush;return en()?m.n:m.b;}
  function clamp01(v){return Math.max(0,Math.min(1,v));}
  function selValid(p){return !!(retSel&&p&&retSel.pid===p.id);}
  function selForOp(){
    var s=copy(retSel);delete s.pid;
    s.feather=selFeather||0;s.aa=selAA!==false;
    return s;
  }
  function offsetShape(sh,dx,dy){
    if(!sh)return;
    if(sh.kind==='selection'){offsetSel(sh.selection,dx,dy);return;}
    if(sh.kind==='poly'&&sh.pts)sh.pts.forEach(function(v){v.x+=dx;v.y+=dy;});
    else{sh.x0+=dx;sh.x1+=dx;sh.y0+=dy;sh.y1+=dy;}
  }
  function scaleSelection(s,from,to){
    function point(p){p.x=to.x0+(p.x-from.x0)*(to.x1-to.x0)/(from.x1-from.x0);p.y=to.y0+(p.y-from.y0)*(to.y1-to.y0)/(from.y1-from.y0);}
    function shape(sh){if(sh.kind==='selection'){scaleSelection(sh.selection,from,to);return;}if(sh.pts)sh.pts.forEach(point);else if(sh.x0!=null){var a={x:sh.x0,y:sh.y0},b={x:sh.x1,y:sh.y1};point(a);point(b);sh.x0=a.x;sh.y0=a.y;sh.x1=b.x;sh.y1=b.y;}}
    shape(s);if(s.shapes)s.shapes.forEach(shape);
  }
  function offsetSel(s,dx,dy){
    if(!s)return;
    offsetShape(s,dx,dy);
    if(Array.isArray(s.shapes))s.shapes.forEach(function(sh){offsetShape(sh,dx,dy);});
  }
  function pointInSingleShape(s,x,y){
    if(s.kind==='selection')return pointInSel(s.selection,x,y);
    if(s.kind==='rect')return x>=Math.min(s.x0,s.x1)&&x<=Math.max(s.x0,s.x1)&&y>=Math.min(s.y0,s.y1)&&y<=Math.max(s.y0,s.y1);
    if(s.kind==='ellipse'){var cx=(s.x0+s.x1)/2,cy=(s.y0+s.y1)/2,rx=Math.abs(s.x1-s.x0)/2||1e-6,ry=Math.abs(s.y1-s.y0)/2||1e-6;return ((x-cx)*(x-cx))/(rx*rx)+((y-cy)*(y-cy))/(ry*ry)<=1;}
    var inside=false;
    if(s.pts){for(var i=0,j=s.pts.length-1;i<s.pts.length;j=i++){var a=s.pts[i],b=s.pts[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/((b.y-a.y)||1e-9)+a.x)inside=!inside;}}
    return inside;
  }
  function pointInSel(s,x,y){
    var inside=false;
    if(Array.isArray(s.shapes)&&s.shapes.length){
      for(var i=0;i<s.shapes.length;i++){
        var sh=s.shapes[i],m=sh.mode||'new',hit=pointInSingleShape(sh,x,y);
        if(i===0||m==='new')inside=hit;
        else if(m==='add')inside=inside||hit;
        else if(m==='sub')inside=inside&&!hit;
        else if(m==='int')inside=inside&&hit;
      }
    }else{
      inside=pointInSingleShape(s,x,y);
    }
    return s.inv?!inside:inside;
  }
  function singleShapePath(s,dx,dy){
    dx=dx||0;dy=dy||0;var K=1000,d='';
    if(s.kind==='rect'){var x0=(Math.min(s.x0,s.x1)+dx)*K,x1=(Math.max(s.x0,s.x1)+dx)*K,y0=(Math.min(s.y0,s.y1)+dy)*K,y1=(Math.max(s.y0,s.y1)+dy)*K;d='M'+x0+' '+y0+'H'+x1+'V'+y1+'H'+x0+'Z';}
    else if(s.kind==='ellipse'){var cx=((s.x0+s.x1)/2+dx)*K,cy=((s.y0+s.y1)/2+dy)*K,rx=Math.abs(s.x1-s.x0)/2*K,ry=Math.abs(s.y1-s.y0)/2*K;if(rx>0&&ry>0)d='M'+(cx-rx)+' '+cy+'a'+rx+' '+ry+' 0 1 0 '+(2*rx)+' 0a'+rx+' '+ry+' 0 1 0 '+(-2*rx)+' 0Z';}
    else if(s.pts&&s.pts.length){d='M'+s.pts.map(function(v){return ((v.x+dx)*K).toFixed(1)+' '+((v.y+dy)*K).toFixed(1);}).join('L')+(s.open?'':'Z');}
    return d;
  }
  function selPath(s,dx,dy){
    var d='';
    if(Array.isArray(s.shapes)&&s.shapes.length){
      d=s.shapes.map(function(sh){return singleShapePath(sh,dx,dy);}).filter(Boolean).join(' ');
    }else{
      d=singleShapePath(s,dx,dy);
    }
    if(s.inv&&d)d='M0 0H1000V1000H0Z'+d;
    return d;
  }
  function combineSelectionShape(p,shape,mode){
    if(!p||!shape)return;
    mode=mode||'new';
    shape.mode=mode;
    if(!selValid(p)||mode==='new'){
      retSel=Object.assign({pid:p.id,feather:selFeather||0,aa:selAA!==false,shapes:[copy(shape)]},copy(shape));
    }else{
      if(retSel.inv){var inverted=copy(retSel);delete inverted.pid;retSel={pid:p.id,shapes:[{kind:'selection',selection:inverted,mode:'new'}]};}
      if(!Array.isArray(retSel.shapes)||!retSel.shapes.length){
        var baseSh=copy(retSel);delete baseSh.pid;delete baseSh.shapes;baseSh.mode='new';
        retSel.shapes=[baseSh];
      }
      retSel.shapes.push(copy(shape));
      retSel.feather=selFeather||0;
      retSel.aa=selAA!==false;
    }
  }
  function getSelBoundsPx(s,w,h){
    if(!s)return null;
    if(s.inv)return {x0:0,y0:0,x1:w,y1:h};
    if(s.shapes&&s.shapes.length>1){var mask=C.selectionMask(Object.assign({},s,{feather:0}),w,h),bx=w,by=h,ex=0,ey=0;for(var q=0;q<mask.length;q++)if(mask[q]){var x=q%w,y=Math.floor(q/w);bx=Math.min(bx,x);by=Math.min(by,y);ex=Math.max(ex,x+1);ey=Math.max(ey,y+1);}return ex>bx&&ey>by?{x0:bx,y0:by,x1:ex,y1:ey}:null;}
    var list=(Array.isArray(s.shapes)&&s.shapes.length)?s.shapes:[s];
    var x0=1,y0=1,x1=0,y1=0;
    list.forEach(function(sh){
      if(sh.kind==='poly'&&sh.pts){
        sh.pts.forEach(function(pt){if(pt.x<x0)x0=pt.x;if(pt.x>x1)x1=pt.x;if(pt.y<y0)y0=pt.y;if(pt.y>y1)y1=pt.y;});
      }else if(sh.x0!=null){
        x0=Math.min(x0,sh.x0,sh.x1);x1=Math.max(x1,sh.x0,sh.x1);
        y0=Math.min(y0,sh.y0,sh.y1);y1=Math.max(y1,sh.y0,sh.y1);
      }
    });
    if(x1<x0||y1<y0)return {x0:0,y0:0,x1:w,y1:h};
    return {x0:Math.round(clamp01(x0)*w),y0:Math.round(clamp01(y0)*h),x1:Math.round(clamp01(x1)*w),y1:Math.round(clamp01(y1)*h)};
  }
  function renderSelection(){
    var ov=$('#dsSelOverlay'),a=$('#dsSelPathA'),b=$('#dsSelPathB');if(!ov||!a||!b)return;
    var p=current(),d='';
    if(eraserActive&&p&&!compare){
      if(selDraft){
        if(selValid(p)&&selDraft.mode&&selDraft.mode!=='new')d=selPath(retSel)+' '+singleShapePath(selDraft);
        else d=singleShapePath(selDraft);
      }
      else if(selValid(p))d=selectionBoundary(retSel,selShift.x,selShift.y);
      if(polyDraft&&polyDraft.pts.length){
        var pts=polyDraft.pts.slice();if(polyDraft.hover)pts.push(polyDraft.hover);
        d+=' '+singleShapePath({kind:'poly',pts:pts,open:true});
      }
    }
    if(d)ov.removeAttribute('hidden');else ov.setAttribute('hidden','');a.setAttribute('d',d);b.setAttribute('d',d);
    renderTransformBox();
  }
  var SINGLE_ITALIC_FONTS=['Kalpurush','Nikosh','SolaimanLipi','Siyam Rupali','AdorshoLipi','BenSen Handwriting','Hind Siliguri','Noto Sans Bengali','Noto Serif Bengali','Anek Bangla','Baloo Da 2','Galada','Atma','Mina'];
  function convertFontTextEncoding(text,oldFont,newFont){
    if(!text||!window.BijoyEngine||oldFont===newFont)return text;
    var B=window.BijoyEngine,toBijoy=B.isBijoyFont(newFont),fromBijoy=B.isBijoyFont(oldFont);
    if(toBijoy&&!fromBijoy&&B.hasBengali(text))return B.unicodeToBijoy(text);
    if(!toBijoy&&(fromBijoy||(!B.hasBengali(text)&&B.detect(text)==='bijoy')))return B.bijoyToUnicode(text);
    return text;
  }
  function ensureFontLoaded(fontName,cb){
    if(!fontName||typeof document==='undefined'||!document.fonts||!document.fonts.load){if(cb)cb();return;}
    document.fonts.load('400 24px "'+fontName+'"').then(function(){if(cb)cb();},function(){if(cb)cb();});
  }
  function measureCtx(){if(!measureCanvas)measureCanvas=document.createElement('canvas');return measureCanvas.getContext('2d');}
  function txtFontCss(it,px){var st=it.style||'Regular';return (/Italic/.test(st)?'italic ':'normal ')+(/Bold/.test(st)?'700 ':'400 ')+px.toFixed(2)+'px "'+(it.font||'Arial')+'", "Noto Sans Bengali", sans-serif';}
  function txtPx(it,w,h){return Math.max(1,(Number(it.size)||24)*Math.max(w,h)/1100);}
  function applyDomTextStyle(el,it,px){
    var st=it.style||'Regular',isBold=/Bold/.test(st),isItalic=/Italic/.test(st),fn=it.font||'Arial';
    var needSkew=isItalic&&SINGLE_ITALIC_FONTS.indexOf(fn)>=0;
    el.style.font=txtFontCss(it,px);
    el.style.fontFamily='"'+fn+'", "Noto Sans Bengali", sans-serif';
    el.style.fontSize=px.toFixed(2)+'px';
    el.style.fontWeight=isBold?'700':'400';
    el.style.fontStyle=isItalic?'italic':'normal';
    el.style.fontSynthesis='weight style';
    el.style.webkitTextStroke=isBold?'0.026em currentColor':'0px';
    el.style.lineHeight=(px*1.2)+'px';
    el.style.color=it.color||'#111111';
    el.style.textAlign=it.align||'left';
    el.style.left=(it.x*100)+'%';
    el.style.top=(it.y*100)+'%';
    var tx=it.align==='center'?'translateX(-50%)':it.align==='right'?'translateX(-100%)':'';
    var sk=needSkew?' skewX(-11deg)':isItalic?' skewX(-4deg)':'';
    el.style.transform=(tx+sk).trim()||'none';
    el.style.transformOrigin='top left';
  }
  function drawTextLayers(){ /* Text is composited in stack order by the shared pixel engine. */ }
  function drawSimpleTextToCanvas(ctx,w,h,erases){
    if(!ctx||!erases||!erases.length)return;
    erases.forEach(function(it,idx){
      if(!it||it.type!=='text'||it.visible===false)return;
      if(C.isSimpleTextItem&&!C.isSimpleTextItem(it,erases,idx))return;
      var px=txtPx(it,w,h),st=it.style||'Regular',isBold=/Bold/.test(st),isItalic=/Italic/.test(st),fn=it.font||'Arial';
      var needSkew=isItalic&&SINGLE_ITALIC_FONTS.indexOf(fn)>=0;
      ctx.save();
      ctx.globalAlpha=it.opacity!=null?Math.max(0,Math.min(1,Number(it.opacity))):1;
      ctx.font=(isItalic?'italic ':'normal ')+(isBold?'700 ':'400 ')+px+'px "'+fn+'", "Noto Sans Bengali", sans-serif';
      ctx.fillStyle=it.color||'#111111';ctx.textAlign=it.align||'left';ctx.textBaseline='middle';
      String(it.text||'').split('\n').forEach(function(line,i){
        ctx.save();ctx.translate(it.x*w,it.y*h+(i+.5)*px*1.2);
        if(needSkew)ctx.transform(1,0,-.19,1,0,0);
        ctx.fillText(line,0,0);
        if(isBold){ctx.lineWidth=Math.max(.5,px*.028);ctx.strokeStyle=it.color||'#111111';ctx.lineJoin='round';ctx.strokeText(line,0,0);}
        ctx.restore();
      });
      ctx.restore();
    });
  }
  function textBounds(it,w,h){
    var mc=measureCtx(),px=txtPx(it,w,h),lh=px*1.2,lines=String(it.text||'').split('\n'),mw=0,st=it.style||'Regular';
    mc.font=txtFontCss(it,px);lines.forEach(function(l){mw=Math.max(mw,mc.measureText(l||' ').width);});
    if(/Bold/.test(st))mw+=px*.06;
    mw=Math.max(16,mw);
    var x0=it.x*w-(it.align==='center'?mw/2:it.align==='right'?mw:0);
    return {x0:x0,y0:it.y*h,x1:x0+mw,y1:it.y*h+Math.max(1,lines.length)*lh};
  }
  function hitText(p,rx,ry){
    var c=$('#dsPreview'),w=c.width,h=c.height,items=p.erases||[];
    for(var i=items.length-1;i>=0;i--){
      var it=items[i];if(!it||it.type!=='text'||it.visible===false||it.locked)continue;
      var b=textBounds(it,w,h),pad=6;
      if(rx*w>=b.x0-pad&&rx*w<=b.x1+pad&&ry*h>=b.y0-pad&&ry*h<=b.y1+pad)return it;
    }
    return null;
  }
  function renderDomTextOverlay(){
    var host=$('#dsTextDomOverlay'),c=$('#dsPreview'),p=current();
    if(!host)return;
    if(!p||compare||!c||!c.width){host.replaceChildren();return;}
    var sc=(c.clientWidth||c.width)/Math.max(1,c.width),items=p.erases||[],frag=document.createDocumentFragment();
    for(var i=0;i<items.length;i++){
      var it=items[i];
      if(!it||it.type!=='text'||it.visible===false)continue;
      if(txtEdit&&it.id===txtEdit.id)continue;
      if(C.isSimpleTextItem&&!C.isSimpleTextItem(it,items,i))continue;
      var div=document.createElement('div');
      div.className='ds-dom-text-item absolute m-0 p-0 border-0 whitespace-pre pointer-events-none select-none';
      div.dataset.layerId=it.id;
      var px=txtPx(it,c.width,c.height)*sc;
      applyDomTextStyle(div,it,px);
      div.style.opacity=String(it.opacity!=null?Math.max(0,Math.min(1,Number(it.opacity))):1);
      div.style.mixBlendMode=it.mode||'normal';
      div.textContent=it.text||'';
      frag.appendChild(div);
    }
    host.replaceChildren(frag);
  }
  function renderTextOverlay(){
    var layer=$('#dsTextLayer'),c=$('#dsPreview'),p=current();if(!layer||!c)return;
    if(layer.width!==c.width)layer.width=c.width;
    if(layer.height!==c.height)layer.height=c.height;
    var ctx=layer.getContext('2d');ctx.clearRect(0,0,layer.width,layer.height);
    if(!p||compare){renderDomTextOverlay();return;}
    var base=getBaseScanPixels(p,c.width,c.height);if(base){C.applyErases(base,c.width,c.height,(p.erases||[]).filter(function(it){return !txtEdit||it.id!==txtEdit.id;}),{skipSimpleText:true});c.getContext('2d').putImageData(new ImageData(base,c.width,c.height),0,0);cachePagePreview(p);}
    renderDomTextOverlay();
    renderTransformBox();
  }
  /* ===================== PHOTOSHOP LAYERS & TRANSFORM ENGINE ===================== */
  function nextLayerNum(p){
    var cnt=1;
    (p.erases||[]).forEach(function(it){if(it&&it.type==='layer')cnt++;});
    return cnt;
  }
  function normalizePageLayers(p){
    if(!p)return;
    p.erases=p.erases||[];
    var out=[],pending=null;
    for(var i=0;i<p.erases.length;i++){
      var it=p.erases[i];if(!it)continue;
      if(it.type==='layer'){
        pending=null;
        if(!it.id)it.id='layer-'+(++layerSeq);
        if(!it.name)it.name='Layer '+nextLayerNum({erases:out});
        if(it.visible===undefined)it.visible=true;
        it.locked=!!it.locked;
        it.mode=it.mode||'normal';
        it.opacity=it.opacity!=null?Number(it.opacity):1;
        it.ops=it.ops||[];
        out.push(it);
      }else if(it.type==='text'){
        pending=null;
        if(!it.id)it.id='t'+(++layerSeq);
        if(it.visible===undefined)it.visible=true;
        it.locked=!!it.locked;
        it.mode=it.mode||'normal';
        it.opacity=it.opacity!=null?Number(it.opacity):1;
        out.push(it);
      }else{
        if(!pending){
          pending={type:'layer',id:'layer-'+(++layerSeq),name:'Layer '+nextLayerNum({erases:out}),visible:true,locked:false,mode:'normal',opacity:1,ops:[]};
          out.push(pending);
        }
        pending.ops.push(it);
      }
    }
    p.erases=out;
    if(!p.activeLayerId||(p.activeLayerId!=='bg'&&!p.erases.some(function(x){return x.id===p.activeLayerId;}))){
      p.activeLayerId=p.erases.length?p.erases[p.erases.length-1].id:'bg';
    }
    var act=getActiveLayer(p);
    if(act&&act.type==='text')activeTextId=act.id;
    else if(activeTextId&&!p.erases.some(function(x){return x.type==='text'&&x.id===activeTextId;}))activeTextId=null;
  }
  function getActiveLayer(p){
    if(!p||!p.erases||!p.activeLayerId||p.activeLayerId==='bg')return null;
    return p.erases.find(function(x){return x&&x.id===p.activeLayerId;})||null;
  }
  function ensurePaintLayer(p){
    normalizePageLayers(p);
    var cur=getActiveLayer(p);
    if(cur&&cur.type==='layer'&&!cur.locked){cur.visible=true;return cur;}
    for(var i=p.erases.length-1;i>=0;i--){
      var l=p.erases[i];
      if(l&&l.type==='layer'&&!l.locked){
        if(p.activeLayerId==='bg'||!cur||cur.type==='text'){p.activeLayerId=l.id;l.visible=true;return l;}
      }
    }
    var nl={type:'layer',id:'layer-'+(++layerSeq),name:'Layer '+nextLayerNum(p),visible:true,locked:false,mode:'normal',opacity:1,ops:[]};
    p.erases.push(nl);
    p.activeLayerId=nl.id;
    return nl;
  }
  function getBaseScanPixels(p,w,h){
    if(processPage._eKey===getEnhanceKey(p,1100).eKey&&processPage._eData&&processPage._wW===w&&processPage._wH===h){
      var base=new Uint8ClampedArray(processPage._eData);
      var trim=p.settings.trim||0,bg=p.settings.bgColor||eraserColor||'#ffffff';
      if(trim>0&&C.applyTrim)C.applyTrim(base,w,h,trim,bg);
      return base;
    }
    return null;
  }
  function refreshCanvasFromLayers(p){
    if(!p)return;
    var c=$('#dsPreview');
    if(!c||!c.width||!canEditInPlace(p)){changed(p);return;}
    var w=c.width,h=c.height,base=getBaseScanPixels(p,w,h);
    if(!base){changed(p);return;}
    p.revision++;
    renderTextOverlay();renderLayersList();renderTransformBox();updateControls();refreshThumbSoon(p);
  }
  function selectLayerById(id){
    var p=current();if(!p)return;
    normalizePageLayers(p);
    p.activeLayerId=id||'bg';
    var act=getActiveLayer(p);
    if(act&&act.type==='text'){
      activeTextId=act.id;
      txt.font=act.font||txt.font;txt.style=act.style||txt.style;txt.size=Number(act.size)||txt.size;txt.align=act.align||txt.align;txt.color=act.color||txt.color;
      syncTextUI();
    }else{
      activeTextId=null;
    }
    renderLayersList();renderTransformBox();
  }
  function toggleLayerVisibility(id){
    var p=current();if(!p||id==='bg')return;
    normalizePageLayers(p);
    var l=p.erases.find(function(x){return x&&x.id===id;});
    if(!l)return;
    remember(p);
    l.visible=l.visible===false;
    refreshCanvasFromLayers(p);
  }
  function toggleActiveLayerLock(){
    var p=current();if(!p)return;
    var l=getActiveLayer(p);if(!l)return;
    remember(p);l.locked=!l.locked;
    renderLayersList();renderTransformBox();
  }
  function handleLayerAction(act){
    var p=current();if(!p)return;
    normalizePageLayers(p);
    if(act==='adjustment'){openAdjustmentMenu();return;}
    if(act==='effects'){openEffects();return;}
    if(act==='mask'){addLayerMask();return;}
    if((act==='dup'||act==='add')&&selValid(p)){selectionToLayer(false);return;}
    if(act==='dup'&&p.activeLayerId==='bg'){selectionToLayer(false,true);return;}
    if(act==='add'){
      remember(p);
      var nl={type:'layer',id:'layer-'+(++layerSeq),name:'Layer '+nextLayerNum(p),visible:true,locked:false,mode:'normal',opacity:1,ops:[]};
      p.erases.push(nl);p.activeLayerId=nl.id;activeTextId=null;
      p.revision++;cachePagePreview(p);renderLayersList();renderTransformBox();updateControls();
      status(tr('নতুন লেয়ার যোগ হয়েছে: ','Added new layer: ')+nl.name);
      return;
    }
    var cur=getActiveLayer(p);
    if(!cur){toast(tr('ব্যাকগ্রাউন্ড লেয়ার লক করা আছে — আগে একটি লেয়ার সিলেক্ট বা তৈরি করুন','Background layer is locked — select or create a layer first'));return;}
    var idx=p.erases.indexOf(cur);
    if(act==='dup'){
      remember(p);
      var cl=copy(cur);delete cl.backgroundEdit;
      cl.id=(cur.type==='text'?'t':'layer-')+(++layerSeq);
      cl.name=(cur.name||(cur.type==='text'?(cur.text||'Text'):'Layer'))+' copy';
      if(cl.type==='text'){cl.x=clamp01(cl.x+.02);cl.y=clamp01(cl.y+.02);}
      p.erases.splice(idx+1,0,cl);
      p.activeLayerId=cl.id;
      refreshCanvasFromLayers(p);
      return;
    }
    if(act==='merge'){
      if(cur.type!=='layer'){toast(tr('শুধু পিক্সেল লেয়ার নিচের লেয়ারে মার্জ করা যায়','Only pixel layers can be merged down'));return;}
      remember(p);
      var prevIdx=-1;
      for(var i=idx-1;i>=0;i--){if(p.erases[i]&&p.erases[i].type==='layer'){prevIdx=i;break;}}
      if(prevIdx>=0){
        var target=p.erases[prevIdx];
        target.ops=(target.ops||[]).concat(cur.ops||[]);
        p.erases.splice(idx,1);
        p.activeLayerId=target.id;
        refreshCanvasFromLayers(p);
        status(tr('লেয়ার নিচের লেয়ারের সাথে মার্জ হয়েছে','Merged layer down'));
      }else{
        toast(tr('নিচে কোনো পিক্সেল লেয়ার নেই','No pixel layer below to merge into'));
      }
      return;
    }
    if(act==='del'){
      if(cur.locked){toast(tr('লক করা লেয়ার ডিলিট করা যাবে না','Unlock the layer before deleting'));return;}
      remember(p);
      p.erases.splice(idx,1);
      p.activeLayerId=p.erases.length?p.erases[Math.max(0,idx-1)].id:'bg';
      refreshCanvasFromLayers(p);
      status(tr('লেয়ার মুছে ফেলা হয়েছে','Layer deleted'));
    }
  }
  $('#dsLayerList').addEventListener('dblclick',function(e){var row=e.target.closest('[data-ds-layer-row]');if(!row)return;selectLayerById(row.dataset.dsLayerRow);var l=getActiveLayer(current());if(l&&l.adjustment)editAdjustment(l.adjustment.kind,l);else if(l&&(l.type!=='text'||e.target.closest('.ds-layer-thumb')))openEffects();});
  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function layerThumbnails(p){
    var c=$('#dsPreview'),base=getBaseScanPixels(p,c.width,c.height);if(!base)return {};
    var key=p.revision+':'+processPage._eKey;if(p.layerThumbCache&&p.layerThumbCache.key===key)return p.layerThumbCache.images;
    var images={},large=document.createElement('canvas'),small=document.createElement('canvas');large.width=c.width;large.height=c.height;small.width=48;small.height=48;
    function url(data){large.getContext('2d').putImageData(new ImageData(data,c.width,c.height),0,0);var ctx=small.getContext('2d'),scale=Math.min(48/c.width,48/c.height);ctx.clearRect(0,0,48,48);ctx.drawImage(large,(48-c.width*scale)/2,(48-c.height*scale)/2,c.width*scale,c.height*scale);return small.toDataURL();}
    images.bg=url(base);
    (p.erases||[]).forEach(function(layer,index){var below=new Uint8ClampedArray(base);if(index)C.applyErases(below,c.width,c.height,p.erases.slice(0,index));var pixels=layer.adjustment?C.adjustPixels(below,c.width,c.height,layer.adjustment):C.renderLayerPixels(layer,base,c.width,c.height,below);images[layer.id]=url(pixels);
      if(layer.mask){var mask=C.selectionMask(layer.mask,c.width,c.height),data=new Uint8ClampedArray(base.length);for(var q=0;q<mask.length;q++){data[q*4]=data[q*4+1]=data[q*4+2]=mask[q];data[q*4+3]=255;}images[layer.id+'-mask']=url(data);}
    });p.layerThumbCache={key:key,images:images};return images;
  }
  function addLayerMask(){var p=current();if(!p)return;var l=getActiveLayer(p);if(l&&l.locked){toast(tr('আগে লেয়ার আনলক করুন','Unlock the layer first'));return;}if(l&&l.mask){editLayerMask(l);return;}remember(p);l=l||editableSelectionLayer(p);if(!l)return;l.mask=selValid(p)?selForOp():{kind:'rect',x0:0,y0:0,x1:1,y1:1};l.maskDisabled=false;refreshCanvasFromLayers(p);}
  function editLayerMask(l){var p=current();if(!p||l.locked)return;var before=copy(l.mask),wasDisabled=!!l.maskDisabled,v={feather:Number(l.mask.feather)||0,invert:!!l.mask.inv,enabled:!l.maskDisabled,selection:false,remove:false};
    function restore(){l.mask=copy(before);l.maskDisabled=wasDisabled;}
    function preview(v){l.mask=v.remove?null:copy(v.selection&&selValid(p)?selForOp():before);if(l.mask){l.mask.feather=v.feather;l.mask.inv=v.invert;}l.maskDisabled=!v.enabled;refreshCanvasFromLayers(p);}
    var fields=[['enabled','Enable mask','checkbox'],['invert','Invert mask','checkbox'],['feather','Feather (px)','number',0,100]];if(selValid(p))fields.push(['selection','Use current selection','checkbox']);fields.push(['remove','Remove mask','checkbox']);
    settingsDialog('Layer Mask',fields,v,preview,function(v){restore();remember(p);preview(v);},function(){restore();refreshCanvasFromLayers(p);});
  }
  function renderLayersList(){
    var listEl=$('#dsLayerList'),cntEl=$('#dsLayerCount'),bmSel=$('#dsLayerBlendMode'),opInp=$('#dsLayerOpacity'),opVal=$('#dsLayerOpacityVal'),opFill=$('#dsLayerOpacityFill'),lockBtn=$('#dsLayerLockBtn');
    if(!listEl)return;
    var p=current();
    if(!p){
      listEl.innerHTML='<div class="px-2 py-3 text-center text-[11px] text-slate-400">No document loaded</div>';
      if(cntEl)cntEl.textContent='0';
      return;
    }
    normalizePageLayers(p);
    var thumbs=layerThumbnails(p);
    var items=p.erases||[],actId=p.activeLayerId||'bg',actLayer=getActiveLayer(p);
    if(cntEl)cntEl.textContent=bn(items.length+1);
    if(bmSel){bmSel.disabled=!actLayer||!!actLayer.locked;bmSel.value=(actLayer&&actLayer.mode)||'normal';}
    var opPct=actLayer?Math.round((actLayer.opacity!=null?actLayer.opacity:1)*100):100;
    if(opInp){opInp.disabled=!actLayer||!!actLayer.locked;opInp.value=String(opPct);}
    if(opVal)opVal.textContent=opPct+'%';
    if(opFill)opFill.style.width=opPct+'%';
    if(lockBtn){
      lockBtn.disabled=!actLayer;
      var isL=!actLayer||!!actLayer.locked;
      lockBtn.setAttribute('aria-pressed',String(isL));
      lockBtn.classList.toggle('!bg-amber-500/20',!!(actLayer&&actLayer.locked));
      lockBtn.classList.toggle('!border-amber-500/50',!!(actLayer&&actLayer.locked));
    }
    var eyeSvg='<svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';
    var eyeOffSvg='<svg viewBox="0 0 24 24" class="w-3.5 h-3.5 opacity-45" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.447 10.447 0 0 1-1.449 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>';
    var lockSvg='<svg viewBox="0 0 24 24" class="w-3 h-3 text-amber-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    var html=[];
    for(var i=items.length-1;i>=0;i--){
      var it=items[i];if(!it)continue;
      var sel=actId===it.id,vis=it.visible!==false,isTxt=it.type==='text';
      var rawLine=isTxt?(String(it.text||'').split('\n')[0]||'Text Layer'):(it.name||('Layer '+(i+1)));
      var title=(isTxt&&window.BijoyEngine&&window.BijoyEngine.isBijoyFont(it.font)&&!window.BijoyEngine.hasBengali(rawLine))?window.BijoyEngine.bijoyToUnicode(rawLine):rawLine;
      var sub=it.adjustment?ADJUSTMENTS[it.adjustment.kind]:(it.effects&&Object.values(it.effects).some(function(e){return e.enabled!==false;})?'Layer effects · double-click to edit':null);
      sub=sub||(isTxt?(it.font||'Arial')+' · '+Math.round(Number(it.size)||24)+'pt':((it.ops?it.ops.length:0)+' stroke'+((it.ops&&it.ops.length===1)?'':'s')));
      var badge='<span class="ds-layer-thumb"><img src="'+(thumbs[it.id]||'')+'" alt="'+escapeHtml(title)+' thumbnail" /></span>';
      if(it.mask)badge+='<button type="button" class="ds-layer-thumb ds-mask-thumb'+(it.maskDisabled?' is-disabled':'')+'" data-ds-layer-mask="'+escapeHtml(it.id)+'" title="Edit layer mask" aria-label="Edit layer mask"><img src="'+(thumbs[it.id+'-mask']||'')+'" alt="Layer mask" /></button>';
      html.push(
        '<div class="flex items-center gap-1.5 px-1.5 py-1 rounded-md border transition-colors cursor-pointer select-none '+(sel?'border-emerald-500/60 bg-emerald-500/15 dark:bg-emerald-500/20 text-slate-900 dark:text-white':'border-transparent hover:bg-white/70 dark:hover:bg-studio-panel/70 text-slate-700 dark:text-slate-300')+'" data-ds-layer-row="'+escapeHtml(it.id)+'">'+
          '<button type="button" data-ds-layer-vis="'+escapeHtml(it.id)+'" class="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0 cursor-pointer" title="Toggle Layer Visibility">'+(vis?eyeSvg:eyeOffSvg)+'</button>'+
          badge+
          '<div class="min-w-0 flex-1 leading-tight">'+
            '<div class="text-[11.5px] font-bold truncate">'+escapeHtml(title)+'</div>'+
            '<div class="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">'+escapeHtml(sub)+' · '+Math.round((it.opacity!=null?it.opacity:1)*100)+'%</div>'+
          '</div>'+
          (it.locked?lockSvg:'')+
        '</div>'
      );
      var enabledEffects=Object.keys(it.effects||{}).filter(function(k){return it.effects[k].enabled!==false;});
      if(enabledEffects.length)html.push('<div class="ds-layer-effect-list">'+enabledEffects.map(function(k){return '<button type="button" data-ds-style-layer="'+escapeHtml(it.id)+'" data-ds-style-effect="'+escapeHtml(k)+'"><span aria-hidden="true">fx</span> '+escapeHtml(EFFECTS[k]||k)+'</button>';}).join('')+'</div>');
    }
    var bgSel=actId==='bg';
    var thumbImg=thumbs.bg?'<img src="'+escapeHtml(thumbs.bg)+'" alt="" class="w-full h-full object-cover" />':'';
    html.push(
      '<div class="flex items-center gap-1.5 px-1.5 py-1 rounded-md border transition-colors cursor-pointer select-none '+(bgSel?'border-emerald-500/60 bg-emerald-500/15 dark:bg-emerald-500/20 text-slate-900 dark:text-white':'border-transparent hover:bg-white/70 dark:hover:bg-studio-panel/70 text-slate-700 dark:text-slate-300')+'" data-ds-layer-row="bg">'+
        '<span class="w-5 h-5 inline-flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">'+eyeSvg+'</span>'+
        '<span class="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">'+thumbImg+'</span>'+
        '<div class="min-w-0 flex-1 leading-tight">'+
          '<div class="text-[11.5px] font-bold italic truncate">Background</div>'+
          '<div class="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">Scanned Document · 100%</div>'+
        '</div>'+
        lockSvg+
      '</div>'
    );
    listEl.innerHTML=html.join('');
  }
  function layerBounds(p,layer,w,h){
    if(!layer||!w||!h)return null;
    if(layer.type==='text')return textBounds(layer,w,h);
    if(layer.type!=='layer'||!layer.ops||!layer.ops.length)return null;
    var x0=w,y0=h,x1=0,y1=0,found=false;
    layer.ops.forEach(function(op){
      if(!op)return;
      if(op.type==='extract'&&!op.sel){x0=0;y0=0;x1=w;y1=h;found=true;}
      if((op.type==='stroke'||op.type==='heal'||op.type==='clone'||op.type==='dodge'||op.type==='burn')&&op.pts&&op.pts.length){
        var r=Math.max(2,Math.round((op.size||.012)*Math.min(w,h)));
        op.pts.forEach(function(pt){
          var px=pt.x*w,py=pt.y*h;
          if(px-r<x0)x0=px-r;if(px+r>x1)x1=px+r;
          if(py-r<y0)y0=py-r;if(py+r>y1)y1=py+r;
          found=true;
        });
      }else if(op.type==='rect'){
        x0=Math.min(x0,op.x0*w,op.x1*w);x1=Math.max(x1,op.x0*w,op.x1*w);
        y0=Math.min(y0,op.y0*h,op.y1*h);y1=Math.max(y1,op.y0*h,op.y1*h);found=true;
      }else if((op.type==='fillsel'||op.type==='extract'||op.type==='strokesel')&&op.sel){
        var sb=getSelBoundsPx(op.sel,w,h);
        if(sb){x0=Math.min(x0,sb.x0);x1=Math.max(x1,sb.x1);y0=Math.min(y0,sb.y0);y1=Math.max(y1,sb.y1);found=true;}
      }else if(op.type==='movesel'){
        var dx=(op.dx||0)*w,dy=(op.dy||0)*h;
        if(found){x0+=dx;x1+=dx;y0+=dy;y1+=dy;}
      }else if(op.type==='transform'&&op.dx0!=null){
        x0=Math.min(op.dx0,op.dx1)*w;x1=Math.max(op.dx0,op.dx1)*w;
        y0=Math.min(op.dy0,op.dy1)*h;y1=Math.max(op.dy0,op.dy1)*h;found=true;
      }
    });
    if(!found)return null;
    return {x0:Math.max(0,Math.round(x0)),y0:Math.max(0,Math.round(y0)),x1:Math.min(w,Math.round(x1)),y1:Math.min(h,Math.round(y1))};
  }
  function getActiveTransformTarget(p){
    var c=$('#dsPreview');if(!p||!c||!c.width)return null;
    var w=c.width,h=c.height;
    if(selValid(p)){
      var sb=getSelBoundsPx(retSel,w,h);
      if(sb&&(sb.x1-sb.x0)>=2&&(sb.y1-sb.y0)>=2)return {kind:'sel',bounds:{x0:sb.x0+selShift.x*w,y0:sb.y0+selShift.y*h,x1:sb.x1+selShift.x*w,y1:sb.y1+selShift.y*h}};
    }
    var act=getActiveLayer(p);
    if(act&&act.visible!==false){
      var lb=layerBounds(p,act,w,h);
      if(lb&&(lb.x1-lb.x0)>=2&&(lb.y1-lb.y0)>=2)return {kind:act.type,layer:act,bounds:lb};
    }
    return null;
  }
  function renderTransformBox(){
    var box=$('#dsTransformBox'),c=$('#dsPreview'),p=current();
    if(!box||!c||!c.width)return;
    if(!eraserActive||compare||txtEdit||!showTransformControls||eraserTool!=='move'||!p){box.hidden=true;return;}
    var tgt=getActiveTransformTarget(p);
    if(!tgt||!tgt.bounds){box.hidden=true;return;}
    var b=tgt.bounds,w=c.width,h=c.height;
    box.hidden=false;
    box.style.left=(b.x0/w*100)+'%';
    box.style.top=(b.y0/h*100)+'%';
    box.style.width=Math.max(.5,(b.x1-b.x0)/w*100)+'%';
    box.style.height=Math.max(.5,(b.y1-b.y0)/h*100)+'%';
  }
  function alignActiveTarget(dir){
    var p=current(),c=$('#dsPreview');if(!p||!c||!c.width)return;
    var w=c.width,h=c.height,act=getActiveLayer(p);
    var ref=(selValid(p)&&act)?getSelBoundsPx(retSel,w,h):{x0:0,y0:0,x1:w,y1:h};
    if(act&&act.type==='text'&&!act.locked){
      var tb=textBounds(act,w,h),tw=tb.x1-tb.x0,th=tb.y1-tb.y0,nx0=tb.x0,ny0=tb.y0;
      if(dir==='left')nx0=ref.x0;else if(dir==='center-x')nx0=(ref.x0+ref.x1-tw)/2;else if(dir==='right')nx0=ref.x1-tw;
      if(dir==='top')ny0=ref.y0;else if(dir==='center-y')ny0=(ref.y0+ref.y1-th)/2;else if(dir==='bottom')ny0=ref.y1-th;
      remember(p);
      act.x+=(nx0-tb.x0)/w;act.y+=(ny0-tb.y0)/h;
      p.revision++;renderTextOverlay();renderLayersList();renderTransformBox();updateControls();refreshThumbSoon(p);
      return;
    }
    if(act&&act.type==='layer'&&!act.locked){
      var lb=layerBounds(p,act,w,h);
      if(lb){
        var lw=lb.x1-lb.x0,lh=lb.y1-lb.y0,lx0=lb.x0,ly0=lb.y0;
        if(dir==='left')lx0=ref.x0;else if(dir==='center-x')lx0=(ref.x0+ref.x1-lw)/2;else if(dir==='right')lx0=ref.x1-lw;
        if(dir==='top')ly0=ref.y0;else if(dir==='center-y')ly0=(ref.y0+ref.y1-lh)/2;else if(dir==='bottom')ly0=ref.y1-lh;
        var dx=(lx0-lb.x0)/w,dy=(ly0-lb.y0)/h;
        if(Math.abs(dx)>1e-4||Math.abs(dy)>1e-4){
          remember(p);
          act.ops.push({type:'movesel',sel:{kind:'rect',x0:0,y0:0,x1:1,y1:1},dx:dx,dy:dy,clearBg:false});
          refreshCanvasFromLayers(p);
        }
        return;
      }
    }
    if(selValid(p)){
      var sb=getSelBoundsPx(retSel,w,h),sw=sb.x1-sb.x0,sh=sb.y1-sb.y0,sx0=sb.x0,sy0=sb.y0;
      if(dir==='left')sx0=0;else if(dir==='center-x')sx0=(w-sw)/2;else if(dir==='right')sx0=w-sw;
      if(dir==='top')sy0=0;else if(dir==='center-y')sy0=(h-sh)/2;else if(dir==='bottom')sy0=h-sh;
      nudgeSelection(Math.round(sx0-sb.x0),Math.round(sy0-sb.y0));
      return;
    }
    toast(tr('অ্যালাইন করার জন্য আগে একটি লেয়ার বা সিলেকশন নির্বাচন করুন','Select a layer or selection first to align'));
  }
  function refreshThumbSoon(p){
    clearTimeout(thumbTimer);
    thumbTimer=setTimeout(async function(){
      var c=$('#dsPreview');if(!p||!pages.includes(p)||!c.width||p.id!==activeId)return;
      try{
        var thumb=document.createElement('canvas'),sc=Math.min(1,180/Math.max(c.width,c.height));
        thumb.width=Math.round(c.width*sc);thumb.height=Math.round(c.height*sc);
        var tctx=thumb.getContext('2d');tctx.drawImage(c,0,0,thumb.width,thumb.height);
        drawSimpleTextToCanvas(tctx,thumb.width,thumb.height,p.erases);
        var tl=$('#dsTextLayer');if(tl&&tl.width)tctx.drawImage(tl,0,0,thumb.width,thumb.height);
        var blob=await canvasBlob(thumb,.75);if(!pages.includes(p))return;
        var previous=p.thumb;p.thumb=URL.createObjectURL(blob);
        var image=$('.ds-page[data-page-id="'+p.id+'"] .ds-thumb img');if(image)image.src=p.thumb;
        if(previous)URL.revokeObjectURL(previous);
        renderLayersList();
      }catch(_){}
    },700);
  }
  function canEditInPlace(p){return !!(p&&!compare&&canInstantRender(p));}
  function applyOpNow(p,op){
    remember(p);
    var targetLayer=ensurePaintLayer(p);
    targetLayer.ops.push(op);
    refreshCanvasFromLayers(p);
  }

  var selectionClipboard=null,selectionMenu=null;
  var ADJUSTMENTS={solid:'Solid Color',gradient:'Gradient',brightness:'Brightness / Contrast',levels:'Levels',curves:'Curves',exposure:'Exposure',vibrance:'Vibrance',hue:'Hue / Saturation',balance:'Color Balance',bw:'Black & White',photo:'Photo Filter',invert:'Invert',selective:'Selective Color',threshold:'Threshold'};
  var EFFECTS={bevel:'Bevel & Emboss',stroke:'Stroke',inner:'Inner Shadow',innerglow:'Inner Glow',satin:'Satin',color:'Color Overlay',gradient:'Gradient Overlay',pattern:'Pattern Overlay',outer:'Outer Glow',drop:'Drop Shadow'};
  function selectionBoundary(sel,dx,dy){
    if(!sel.shapes||sel.shapes.length<2&&sel.shapes[0].kind!=='selection')return selPath(sel,dx,dy);
    var c=$('#dsPreview'),w=Math.min(600,c.width),h=Math.max(1,Math.round(w*c.height/c.width)),mask=C.selectionMask(Object.assign({},sel,{feather:0}),w,h),parts=[];
    for(var y=0;y<h;y++)for(var x=0;x<w;x++){if(mask[y*w+x]<128)continue;var x0=x/w*1000+(dx||0)*1000,y0=y/h*1000+(dy||0)*1000,x1=x0+1000/w,y1=y0+1000/h;
      if(y===0||mask[(y-1)*w+x]<128)parts.push('M'+x0+' '+y0+'H'+x1);
      if(y===h-1||mask[(y+1)*w+x]<128)parts.push('M'+x0+' '+y1+'H'+x1);
      if(x===0||mask[y*w+x-1]<128)parts.push('M'+x0+' '+y0+'V'+y1);
      if(x===w-1||mask[y*w+x+1]<128)parts.push('M'+x1+' '+y0+'V'+y1);
    }return parts.join('');
  }
  function backgroundLayer(p){return (p.erases||[]).find(function(l){return l.backgroundEdit;})||null;}
  function editableSelectionLayer(p){
    var l=getActiveLayer(p);if(l&&l.locked){toast(tr('আগে লেয়ার আনলক করুন','Unlock the layer first'));return null;}
    if(l&&l.type==='text'){toast(tr('প্রথমে Layer Via Copy দিয়ে পিক্সেল লেয়ার তৈরি করুন','Use Layer Via Copy to create a pixel layer first'));return null;}
    if(l&&l.adjustment){toast(tr('পিক্সেল লেয়ার নির্বাচন করুন','Select a pixel layer'));return null;}
    if(!l){l=backgroundLayer(p);if(!l){l={type:'layer',id:'layer-'+(++layerSeq),name:'Background edits',backgroundEdit:true,visible:true,opacity:1,mode:'normal',ops:[{type:'extract'}]};p.erases.unshift(l);}p.activeLayerId=l.id;}
    return l;
  }
  function previewSelectionTransform(p,op,w,h){
    var base=getBaseScanPixels(p,w,h);if(!base)return null;var layers=copy(p.erases),l=layers.find(function(it){return it.id===p.activeLayerId;});
    if(!l){l=layers.find(function(it){return it.backgroundEdit;});if(!l){l={type:'layer',backgroundEdit:true,ops:[{type:'extract'}]};layers.unshift(l);}}
    if(l.type!=='layer'||l.adjustment||l.locked)return null;op.background=!!l.backgroundEdit;l.ops.push(op);C.applyErases(base,w,h,layers,{skipSimpleText:true});return base;
  }
  function applySelectionTransform(p,op){var l=editableSelectionLayer(p);if(!l)return;op.background=!!l.backgroundEdit;l.ops.push(op);}
  function selectionRecipe(p,whole){var src=getActiveLayer(p)||backgroundLayer(p);return {type:'extract',source:src?copy(src):null,sel:!whole&&selValid(p)?selForOp():null};}
  function clearSelected(p){var l=editableSelectionLayer(p);if(!l)return false;l.ops.push(l.backgroundEdit?{type:'fillsel',sel:selForOp(),color:eraserColor,opacity:1}:{type:'clear',sel:selForOp()});return true;}
  function insertPixelLayer(p,op,name){var l={type:'layer',id:'layer-'+(++layerSeq),name:name||'Layer '+nextLayerNum(p),visible:true,locked:false,opacity:1,mode:'normal',ops:[op]},idx=p.erases.findIndex(function(v){return v.id===p.activeLayerId;});p.erases.splice(idx+1,0,l);p.activeLayerId=l.id;activeTextId=null;return l;}
  function selectionToLayer(cut,whole){
    var p=current();if(!p||(!whole&&!selValid(p)))return;var src=getActiveLayer(p);if(src&&src.adjustment){toast(tr('পিক্সেল বা টেক্সট লেয়ার নির্বাচন করুন','Select a pixel or text layer'));return;}if(cut&&src&&(src.locked||src.adjustment||src.type==='text')){toast(tr('কাট করার জন্য আনলক করা পিক্সেল লেয়ার নির্বাচন করুন','Select an unlocked pixel layer to cut'));return;}
    var op=selectionRecipe(p,whole),c=$('#dsPreview'),base=getBaseScanPixels(p,c.width,c.height);if(!base)return;
    var pixels=new Uint8ClampedArray(base.length);C.applyLayerOp(pixels,base,c.width,c.height,op,base);if(!pixels.some(function(v,i){return i%4===3&&v;})){toast(tr('নির্বাচিত অংশে কোনো পিক্সেল নেই','The selected area has no pixels'));return;}
    remember(p);if(cut&&!clearSelected(p))return;insertPixelLayer(p,op,cut?'Layer via Cut':'Layer via Copy');refreshCanvasFromLayers(p);renderSelection();
  }
  function copySelection(cut){var p=current();if(!selValid(p))return;var src=getActiveLayer(p);if(src&&src.adjustment){toast(tr('পিক্সেল বা টেক্সট লেয়ার নির্বাচন করুন','Select a pixel or text layer'));return;}if(cut&&src&&(src.locked||src.type==='text'||src.adjustment))return;selectionClipboard={pid:p.id,op:selectionRecipe(p)};if(cut){remember(p);clearSelected(p);refreshCanvasFromLayers(p);}toast(tr('সিলেকশন কপি হয়েছে — Paste দিয়ে বসান','Selection copied — choose Paste to insert'));}
  function pasteSelection(){var p=current();if(!p||!selectionClipboard)return;if(selectionClipboard.pid!==p.id){toast(tr('যে পেজ থেকে কপি করেছেন সেই পেজে পেস্ট করুন','Paste on the page where this selection was copied'));return;}remember(p);insertPixelLayer(p,copy(selectionClipboard.op),'Pasted selection');refreshCanvasFromLayers(p);}
  function closeSelectionMenu(){if(selectionMenu){selectionMenu.remove();selectionMenu=null;}}
  function showMenu(items,x,y){
    closeSelectionMenu();var menu=document.createElement('div');menu.className='ds-edit-menu';menu.setAttribute('role','menu');
    items.forEach(function(item){var b=document.createElement('button');b.type='button';b.textContent=item[0];b.setAttribute('role','menuitem');b.disabled=!!item[2];b.onclick=function(){closeSelectionMenu();item[1]();};menu.appendChild(b);});root.appendChild(menu);selectionMenu=menu;
    var r=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(x,innerWidth-r.width-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-r.height-8))+'px';var first=menu.querySelector('button:not(:disabled)');if(first)first.focus();
    menu.onkeydown=function(e){var buttons=Array.from(menu.querySelectorAll('button:not(:disabled)')),idx=buttons.indexOf(document.activeElement);if(['Escape','ArrowDown','ArrowUp'].includes(e.key))e.stopPropagation();if(e.key==='Escape'){closeSelectionMenu();$('#dsPreviewWrap').focus();}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[(idx+(e.key==='ArrowDown'?1:buttons.length-1))%buttons.length].focus();}};
  }
  document.addEventListener('pointerdown',function(e){if(selectionMenu&&!selectionMenu.contains(e.target))closeSelectionMenu();});
  function showSelectionMenu(x,y){var p=current(),no=!selValid(p),l=getActiveLayer(p),locked=!!(l&&l.locked);showMenu([
    ['Deselect',deselect,no],['Select Inverse',invertSel,no],['Feather…',function(){selectionSettings(false);},no],['Select and Mask…',function(){selectionSettings(true);},no],
    ['Copy',function(){copySelection(false);},no],['Cut',function(){copySelection(true);},no||locked],['Paste',pasteSelection,!selectionClipboard],
    ['Layer Via Copy',function(){selectionToLayer(false);},no],['Layer Via Cut',function(){selectionToLayer(true);},no||locked],['New Layer',function(){var old=retSel;retSel=null;handleLayerAction('add');retSel=old;renderSelection();}],
    ['Free Transform',function(){setEraserTool('move');showTransformControls=true;$('#dsShowTransform').checked=true;renderTransformBox();},no&&!l],
    ['Fill…',function(){selectionPaint(false);},no||locked],['Stroke…',function(){selectionPaint(true);},no||locked]
  ],x,y);}
  function settingsDialog(title,fields,values,onPreview,onApply,onCancel){
    var dialog=document.createElement('dialog');dialog.className='ds-edit-dialog';var form=document.createElement('form');form.method='dialog';var heading=document.createElement('h2');heading.textContent=title;form.appendChild(heading);dialog.setAttribute('aria-label',title);
    fields.forEach(function(f){var label=document.createElement('label'),span=document.createElement('span');span.textContent=f[1];label.appendChild(span);var input=document.createElement(f[2]==='select'?'select':'input');input.name=f[0];
      if(f[2]==='select'){f[3].forEach(function(o){var opt=document.createElement('option');opt.value=Array.isArray(o)?o[0]:o;opt.textContent=Array.isArray(o)?o[1]:o;input.appendChild(opt);});}else{input.type=f[2]||'number';if(input.type==='number'){input.min=f[3];input.max=f[4];input.step=f[5]||1;}}
      if(input.type==='checkbox')input.checked=!!values[f[0]];else input.value=values[f[0]]==null?'':values[f[0]];
      input.oninput=function(){if(!input.checkValidity())return;values[f[0]]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;onPreview(values);};label.appendChild(input);form.appendChild(label);
    });var actions=document.createElement('div');actions.className='ds-edit-actions';var cancel=document.createElement('button');cancel.type='button';cancel.textContent=tr('বাতিল','Cancel');cancel.onclick=function(){finishDialog(false);};var apply=document.createElement('button');apply.type='submit';apply.textContent=tr('প্রয়োগ করুন','Apply');actions.append(cancel,apply);form.appendChild(actions);dialog.appendChild(form);root.appendChild(dialog);
    var settled=false;function finishDialog(apply){if(settled)return;settled=true;if(apply)onApply(values);else onCancel();dialog.close();dialog.remove();}form.onsubmit=function(e){e.preventDefault();if(form.reportValidity())finishDialog(true);};dialog.oncancel=function(e){e.preventDefault();finishDialog(false);};dialog.onclose=function(){finishDialog(false);};dialog.showModal();return dialog;
  }
  function selectionSettings(maskMode){
    var active=getActiveLayer(current());if(maskMode&&active&&active.locked){toast(tr('আগে লেয়ার আনলক করুন','Unlock the layer first'));return;}
    var before=copy(retSel),oldFeather=selFeather,values={feather:selFeather,invert:!!retSel.inv,mask:false},overlay=null;
    if(maskMode){overlay=document.createElement('canvas');overlay.className='ds-mask-preview';overlay.setAttribute('aria-hidden','true');$('#dsPreviewWrap').appendChild(overlay);}
    function preview(v){selFeather=v.feather;retSel.feather=v.feather;retSel.inv=v.invert;$('#dsSelFeather').value=v.feather;renderSelection();
      if(overlay){var c=$('#dsPreview');overlay.width=c.width;overlay.height=c.height;var ctx=overlay.getContext('2d'),im=ctx.createImageData(c.width,c.height),mask=C.selectionMask(selForOp(),c.width,c.height);for(var q=0;q<mask.length;q++){im.data[q*4]=255;im.data[q*4+3]=(255-mask[q])*.45;}ctx.putImageData(im,0,0);}}
    function cleanup(){if(overlay)overlay.remove();}
    settingsDialog(maskMode?'Select and Mask':'Feather Selection',maskMode?[['feather','Feather (px)','number',0,100],['invert','Invert selection','checkbox'],['mask','Output as layer mask','checkbox']]:[['feather','Feather (px)','number',0,100]],values,preview,function(v){
      if(v.mask){var p=current(),selected=copy(retSel);retSel=before;remember(p);retSel=selected;var l=getActiveLayer(p)||editableSelectionLayer(p);if(l&&!l.locked){l.mask=selForOp();refreshCanvasFromLayers(p);}}cleanup();
    },function(){retSel=before;selFeather=oldFeather;$('#dsSelFeather').value=oldFeather;renderSelection();cleanup();});preview(values);
  }
  function selectionPaint(stroke){var p=current(),values={color:eraserColor,width:2},before=copy(p.erases),active=p.activeLayerId;function preview(v){p.erases=copy(before);p.activeLayerId=active;var l=editableSelectionLayer(p);if(l)l.ops.push(stroke?{type:'strokesel',sel:selForOp(),color:v.color,width:v.width}:{type:'fillsel',sel:selForOp(),color:v.color,opacity:1});refreshCanvasFromLayers(p);}settingsDialog(stroke?'Stroke Selection':'Fill Selection',stroke?[['color','Color','color'],['width','Width (px)','number',1,100]]:[['color','Color','color']],values,preview,function(v){p.erases=copy(before);p.activeLayerId=active;remember(p);preview(v);},function(){p.erases=before;p.activeLayerId=active;refreshCanvasFromLayers(p);});preview(values);}
  function adjustmentFields(kind){var amount=['amount','Amount','number',-100,100];switch(kind){
    case 'solid':return [['color','Color','color']];case 'gradient':return [['color','Start color','color'],['color2','End color','color'],['angle','Angle (°)','number',0,360]];
    case 'brightness':return [['amount','Brightness','number',-100,100],['contrast','Contrast','number',-100,100]];
    case 'levels':return [['black','Input black','number',0,254],['white','Input white','number',1,255],['gamma','Midtone gamma','number',.1,10,.1]];
    case 'curves':return [['mid','Midpoint output (input 128)','number',0,255]];
    case 'exposure':return [['amount','Exposure (stops)','number',-10,10,.1],['offset','Offset','number',-1,1,.01],['gamma','Gamma','number',.1,10,.1]];
    case 'hue':return [['amount','Hue (°)','number',-180,180],['saturation','Saturation','number',-100,100]];
    case 'balance':return [['red','Cyan / Red','number',-100,100],['green','Magenta / Green','number',-100,100],['blue','Yellow / Blue','number',-100,100]];
    case 'photo':return [['color','Filter color','color'],['amount','Density (%)','number',0,100]];
    case 'threshold':return [['amount','Threshold','number',0,255]];
    case 'selective':return [['channel','Color range','select',['reds','greens','blues','neutrals']],['cyan','Cyan','number',-100,100],['magenta','Magenta','number',-100,100],['yellow','Yellow','number',-100,100],['black','Black','number',-100,100]];
    case 'bw':case 'invert':return [];default:return [amount];}}
  function openAdjustmentMenu(){var b=$('[data-ds-layer-act="adjustment"]'),r=b.getBoundingClientRect();showMenu(Object.keys(ADJUSTMENTS).map(function(k){return [ADJUSTMENTS[k],function(){editAdjustment(k);}];}),r.left,r.top);}
  function editAdjustment(kind,existing){var p=current();if(!p||existing&&existing.locked)return;var before=copy(p.erases),active=p.activeLayerId,values=existing?copy(existing.adjustment):{kind:kind,amount:kind==='threshold'?128:kind==='photo'?25:0,color:'#f4a460',color2:'#ffffff',angle:0,contrast:0,black:0,white:255,gamma:1,mid:128,offset:0,saturation:0,red:0,green:0,blue:0,cyan:0,magenta:0,yellow:0,channel:'reds'};
    var layer=existing||{type:'layer',id:'layer-'+(++layerSeq),name:ADJUSTMENTS[kind],visible:true,opacity:1,mode:'normal',ops:[],mask:selValid(p)?selForOp():null};var id=layer.id;
    function preview(v){p.erases=copy(before);if(!existing){var idx=p.erases.findIndex(function(l){return l.id===active;});p.erases.splice(idx+1,0,copy(layer));}var l=p.erases.find(function(l){return l.id===id;});l.adjustment=copy(v);p.activeLayerId=id;refreshCanvasFromLayers(p);}
    settingsDialog(ADJUSTMENTS[kind],adjustmentFields(kind),values,preview,function(v){p.erases=copy(before);p.activeLayerId=active;remember(p);preview(v);},function(){p.erases=before;p.activeLayerId=active;refreshCanvasFromLayers(p);});preview(values);
  }
  function openEffects(initialEffect){
    var p=current(),l=getActiveLayer(p);if(!l){toast(tr('এফেক্টসের জন্য আগে ব্যাকগ্রাউন্ড ডুপ্লিকেট করুন','Duplicate Background first to add effects'));return;}if(l.locked){toast(tr('আগে লেয়ার আনলক করুন','Unlock the layer first'));return;}
    var before=copy(l.effects||{}),originalMode=l.mode||'normal',originalOpacity=l.opacity==null?1:l.opacity;
    var modes=['normal','multiply','screen','overlay','darken','lighten','color','luminosity'];
    var fields=[['mode','Blend Mode','select',modes],['opacity','Opacity (%)','number',0,100]],values={mode:originalMode,opacity:Math.round(originalOpacity*100)},previewOn=true,sample=null;
    Object.keys(EFFECTS).forEach(function(k){var e=before[k]||{};
      var defaults={Color:['innerglow','outer'].includes(k)?'#ffffff':'#000000',Color2:'#ffffff',Size:6,Opacity:70,Angle:120,Distance:8,Spread:0,Depth:100,Soften:0,Direction:'up',Highlight:'#ffffff',Shadow:'#000000',Mode:'normal',Position:'outside'};
      values[k]=!!(before[k]&&e.enabled!==false);
      Object.keys(defaults).forEach(function(prop){var key=prop[0].toLowerCase()+prop.slice(1);values[k+prop]=e[key]==null?defaults[prop]:e[key];});
      fields.push([k,EFFECTS[k],'checkbox'],[k+'Mode','Blend Mode','select',modes]);
      if(k!=='bevel')fields.push([k+'Color','Color','color']);
      if(k==='gradient'||k==='pattern')fields.push([k+'Color2','Second Color','color']);
      if(k==='bevel')fields.push([k+'Depth','Depth (%)','number',1,1000],[k+'Direction','Direction','select',['up','down']],[k+'Highlight','Highlight Color','color'],[k+'Shadow','Shadow Color','color'],[k+'Soften','Soften (px)','number',0,50]);
      if(k==='stroke')fields.push([k+'Position','Position','select',['outside','inside','center']]);
      if(k!=='color'&&k!=='gradient')fields.push([k+'Size','Size (px)','number',1,100]);
      if(k==='drop'||k==='inner')fields.push([k+'Distance','Distance (px)','number',0,200]);
      if(k==='drop'||k==='outer')fields.push([k+'Spread','Spread (%)','number',0,100]);
      fields.push([k+'Opacity','Opacity (%)','number',0,100]);
      if(['bevel','inner','satin','gradient','drop'].includes(k))fields.push([k+'Angle','Angle (°)','number',0,360]);
    });
    function effects(v){var result={};Object.keys(EFFECTS).forEach(function(k){var e={enabled:v[k]};['Color','Color2','Size','Opacity','Angle','Distance','Spread','Depth','Soften','Direction','Highlight','Shadow','Mode','Position'].forEach(function(prop){e[prop[0].toLowerCase()+prop.slice(1)]=v[k+prop];});result[k]=e;});return result;}
    function restore(){l.effects=copy(before);l.mode=originalMode;l.opacity=originalOpacity;}
    function preview(v){if(previewOn){l.effects=effects(v);l.mode=v.mode;l.opacity=v.opacity/100;}else restore();refreshCanvasFromLayers(p);drawSample();}
    function drawSample(){if(!sample)return;var w=180,h=160,base=new Uint8ClampedArray(w*h*4);for(var y=0;y<h;y++)for(var x=0;x<w;x++){var i=(y*w+x)*4,v=(Math.floor(x/10)+Math.floor(y/10))%2?58:66;base[i]=base[i+1]=base[i+2]=v;base[i+3]=255;}
      var fx=effects(values);Object.keys(fx).forEach(function(k){['size','distance','soften'].forEach(function(prop){fx[k][prop]*=1100/w;});});C.applyErases(base,w,h,[{type:'layer',opacity:values.opacity/100,mode:values.mode,effects:previewOn?fx:{},ops:[{type:'fillsel',color:'#888888',opacity:1,sel:{kind:'rect',x0:.24,y0:.24,x1:.76,y1:.76}}]}]);sample.getContext('2d').putImageData(new ImageData(base,w,h),0,0);}
    var dialog=settingsDialog('Layer Style',fields,values,preview,function(v){restore();remember(p);l.effects=effects(v);l.mode=v.mode;l.opacity=v.opacity/100;refreshCanvasFromLayers(p);},function(){restore();refreshCanvasFromLayers(p);});
    dialog.classList.add('ds-layer-style');var form=dialog.querySelector('form'),heading=form.querySelector('h2'),actions=form.querySelector('.ds-edit-actions');
    var layout=document.createElement('div');layout.className='ds-style-layout';var nav=document.createElement('div');nav.className='ds-style-nav';nav.setAttribute('aria-label','Layer effects');var main=document.createElement('div');main.className='ds-style-settings';var side=document.createElement('div');side.className='ds-style-side';
    var labels=Array.from(form.children).filter(function(el){return el.tagName==='LABEL';}),panels={};
    function choose(k){Object.keys(panels).forEach(function(id){panels[id].hidden=id!==k;});nav.querySelectorAll('[data-effect-tab]').forEach(function(btn){btn.setAttribute('aria-pressed',String(btn.dataset.effectTab===k));});}
    ['blending'].concat(Object.keys(EFFECTS)).forEach(function(k){var panel=document.createElement('section');panel.className='ds-style-pane';var title=document.createElement('h3');title.textContent=k==='blending'?'Blending Options':EFFECTS[k];panel.appendChild(title);panels[k]=panel;main.appendChild(panel);
      var row=document.createElement('div');row.className='ds-style-choice';var toggle=null;
      if(k!=='blending'){var checkboxLabel=labels.find(function(label){return label.querySelector('[name="'+k+'"]');});toggle=checkboxLabel.querySelector('input');toggle.setAttribute('aria-label','Enable '+EFFECTS[k]);row.appendChild(toggle);checkboxLabel.remove();toggle.addEventListener('change',function(){choose(k);});}
      var btn=document.createElement('button');btn.type='button';btn.textContent=title.textContent;btn.dataset.effectTab=k;btn.onclick=function(){choose(k);if(toggle&&!toggle.checked){toggle.checked=true;toggle.dispatchEvent(new Event('input'));}};row.appendChild(btn);nav.appendChild(row);
      labels.forEach(function(label){var input=label.querySelector('input,select');if(!input)return;var name=input.name;if(k==='blending'?(name==='mode'||name==='opacity'):(name!==k&&name.startsWith(k)&&name[k.length]===name[k.length].toUpperCase()))panel.appendChild(label);});
    });
    // Paired sliders and numbers share one value and one preview update path.
    main.querySelectorAll('input[type="number"]').forEach(function(input){var control=document.createElement('span');control.className='ds-style-number';var slider=document.createElement('input');slider.type='range';slider.min=input.min;slider.max=input.max;slider.step=input.step;slider.value=input.value;slider.setAttribute('aria-label',input.parentElement.querySelector('span').textContent);input.parentElement.insertBefore(control,input);control.append(slider,input);slider.oninput=function(){input.value=slider.value;input.dispatchEvent(new Event('input'));};input.addEventListener('input',function(){slider.value=input.value;});});
    var ok=actions.querySelector('[type="submit"]');ok.textContent='OK';side.appendChild(actions);
    var previewLabel=document.createElement('label'),previewCheck=document.createElement('input');previewCheck.type='checkbox';previewCheck.checked=true;previewCheck.onchange=function(){previewOn=previewCheck.checked;preview(values);};previewLabel.append(previewCheck,document.createTextNode(' Preview'));side.appendChild(previewLabel);
    sample=document.createElement('canvas');sample.width=180;sample.height=160;sample.setAttribute('aria-label','Layer style preview');side.appendChild(sample);
    var reset=document.createElement('button');reset.type='button';reset.textContent='Clear Effects';reset.className='ds-style-reset';reset.onclick=function(){Object.keys(EFFECTS).forEach(function(k){values[k]=false;var input=nav.querySelector('[name="'+k+'"]');input.checked=false;});values.mode='normal';values.opacity=100;main.querySelector('[name="mode"]').value='normal';main.querySelector('[name="opacity"]').value=100;main.querySelector('input[type="range"]').value=100;preview(values);};side.appendChild(reset);
    layout.append(nav,main,side);form.appendChild(layout);choose(typeof initialEffect==='string'&&panels[initialEffect]?initialEffect:'blending');drawSample();ok.focus();
  }
  function selectAll(){var p=current();if(!p)return;retSel={pid:p.id,kind:'rect',x0:0,y0:0,x1:1,y1:1,feather:selFeather||0,aa:selAA!==false,shapes:[{kind:'rect',x0:0,y0:0,x1:1,y1:1,mode:'new'}]};polyDraft=null;renderSelection();}
  function deselect(){retSel=null;selDraft=null;polyDraft=null;renderSelection();}
  function invertSel(){var p=current();if(!selValid(p))return;retSel.inv=!retSel.inv;renderSelection();}
  function fillSelection(){
    var p=current();if(!selValid(p)){status(tr('আগে মার্কি বা লেসো দিয়ে সিলেক্ট করুন','Make a selection with Marquee or Lasso first'));return;}
    applyOpNow(p,{type:'fillsel',sel:selForOp(),color:eraserColor,opacity:eraserOpacity/100,mode:eraserMode});
    status(tr('সিলেকশন রঙ দিয়ে ফিল করা হয়েছে','Selection filled with color'));
  }
  function nudgeSelection(dxp,dyp){
    var p=current(),c=$('#dsPreview');if(!selValid(p)||!c.width)return;
    var dx=dxp/c.width,dy=dyp/c.height;
    remember(p);applySelectionTransform(p,{type:'movesel',sel:selForOp(),dx:dx,dy:dy,color:eraserColor});refreshCanvasFromLayers(p);
    offsetSel(retSel,dx,dy);renderSelection();
  }
  function closePoly(){
    var p=current();
    if(polyDraft&&p){
      var pts=polyDraft.pts.slice();
      if(pts.length>=4){var a=pts[pts.length-1],b=pts[pts.length-2],c=$('#dsPreview');if(Math.hypot((a.x-b.x)*c.width,(a.y-b.y)*c.height)<3)pts.pop();}
      if(pts.length>=3)combineSelectionShape(p,{kind:'poly',pts:pts},polyDraft.mode||selCombineMode||'new');
    }
    polyDraft=null;renderSelection();
  }
  function cancelPolyDraft(){if(polyDraft){polyDraft=null;renderSelection();}}
  function updateCloneInfo(){
    var el=$('#dsCloneSrcInfo'),p=current();if(!el)return;
    var ok=cloneSrc&&p&&cloneSrc.pid===p.id;
    el.textContent=ok?tr('✓ সোর্স সেট · Alt+ক্লিক = পরিবর্তন','✓ Source set · Alt+Click to change'):tr('Alt + ক্লিক করে সোর্স ঠিক করুন','Alt + Click to set source');
  }
  function placeCloneMark(pos){
    var m=$('#dsCloneSrcMark');if(!m||!cloneOffset)return;
    m.hidden=false;m.style.left=((pos.x+cloneOffset.x)*100)+'%';m.style.top=((pos.y+cloneOffset.y)*100)+'%';
  }
  function hideCloneMark(){var m=$('#dsCloneSrcMark');if(m)m.hidden=true;}
  /* ---------- Type Tool ---------- */
  var lastTxtSel={start:0,end:0};
  function saveTxtSelection(){
    var ed=$('#dsTextEditor');
    if(ed&&!ed.hidden&&typeof ed.selectionStart==='number'){
      lastTxtSel={start:ed.selectionStart,end:ed.selectionEnd};
    }
  }
  function restoreTxtSelection(keepActiveEl){
    var ed=$('#dsTextEditor');
    if(!txtEdit||!ed||ed.hidden)return;
    var act=document.activeElement;
    if(!keepActiveEl||act!==keepActiveEl){
      try{ed.focus({preventScroll:true});}catch(_){ed.focus();}
    }
    try{
      var len=(ed.value||'').length;
      var s=Math.max(0,Math.min(len,lastTxtSel.start||0));
      var e=Math.max(s,Math.min(len,lastTxtSel.end||0));
      ed.setSelectionRange(s,e);
    }catch(_){}
  }
  function lockStageScroll(){
    ['#dsPreviewStage','#dsPreviewCard','#dsMainStage','#dsPreviewWrap'].forEach(function(sel){
      var el=$(sel);if(el&&(el.scrollLeft||el.scrollTop)){el.scrollLeft=0;el.scrollTop=0;}
    });
  }
  function syncTextUI(){
    var f=$('#dsTxtFont'),s=$('#dsTxtStyle'),z=$('#dsTxtSize'),c=$('#dsTxtColor'),chip=$('#dsTxtColorChip');
    if(f){if(!Array.from(f.options).some(function(o){return o.value===txt.font;})){var o=document.createElement('option');o.value=o.textContent=txt.font;f.appendChild(o);}f.value=txt.font;}
    if(s)s.value=txt.style;if(z)z.value=String(txt.size);if(c)c.value=txt.color;if(chip)chip.style.background=txt.color;
    var boldBtn=$('#dsTxtBoldBtn'),italicBtn=$('#dsTxtItalicBtn'),isB=/Bold/.test(txt.style||''),isI=/Italic/.test(txt.style||'');
    if(boldBtn){boldBtn.setAttribute('aria-pressed',String(isB));boldBtn.classList.toggle('is-active',isB);}
    if(italicBtn){italicBtn.setAttribute('aria-pressed',String(isI));italicBtn.classList.toggle('is-active',isI);}
    $$('[data-ds-txt-align]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.dsTxtAlign===txt.align));});
  }
  function toggleTextStyleFlag(flag){
    saveTxtSelection();
    var curStyle=(txtEdit&&txtEdit.item&&txtEdit.item.style)||txt.style||'Regular';
    var hasBold=/Bold/.test(curStyle),hasItalic=/Italic/.test(curStyle);
    if(flag==='bold')hasBold=!hasBold;
    else if(flag==='italic')hasItalic=!hasItalic;
    var nextStyle=(hasBold&&hasItalic)?'Bold Italic':hasBold?'Bold':hasItalic?'Italic':'Regular';
    applyTextOption('style',nextStyle);
  }
  function styleTextEditor(){
    var ed=$('#dsTextEditor'),c=$('#dsPreview');if(!ed||!txtEdit||!c.width)return;
    var it=txtEdit.item,sc=(c.clientWidth||c.width)/Math.max(1,c.width),px=txtPx(it,c.width,c.height)*sc,lines=(ed.value||'').split('\n'),mc=measureCtx(),mw=0,st=it.style||'Regular';
    applyDomTextStyle(ed,it,px);
    mc.font=txtFontCss(it,px);lines.forEach(function(l){mw=Math.max(mw,mc.measureText(l||' ').width);});
    if(/Bold/.test(st))mw+=px*.06;
    ed.style.width=Math.ceil(mw+px*.8)+'px';ed.style.height=Math.ceil(lines.length*px*1.2+2)+'px';
    ed.scrollLeft=0;ed.scrollTop=0;
    lockStageScroll();
  }
  function positionTextEditor(){if(txtEdit)styleTextEditor();renderDomTextOverlay();}
  function setTxtEditActions(on){var a=$('#dsTxtEditActions');if(a)a.hidden=!on;}
  function startTextEdit(p,pos,existing){
    if(txtEdit)commitTextEdit();
    var ed=$('#dsTextEditor');if(!ed)return;
    var it=existing?copy(existing):{type:'text',id:'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),x:pos.x,y:pos.y,text:'',font:txt.font,style:txt.style,size:txt.size,align:txt.align,color:txt.color,visible:true,locked:false,mode:'normal',opacity:1};
    if(existing){txt.font=it.font||txt.font;txt.style=it.style||txt.style;txt.size=Number(it.size)||txt.size;txt.align=it.align||txt.align;txt.color=it.color||txt.color;syncTextUI();}
    txtEdit={id:it.id,item:it,pid:p.id};
    ed.value=it.text||'';ed.hidden=false;styleTextEditor();renderTextOverlay();setTxtEditActions(true);
    var n=ed.value.length;lastTxtSel={start:n,end:n};
    ensureFontLoaded(it.font,function(){if(txtEdit&&txtEdit.id===it.id)styleTextEditor();});
    setTimeout(function(){try{ed.focus({preventScroll:true});}catch(_){ed.focus();}ed.setSelectionRange(n,n);lockStageScroll();},0);
    status(tr('টাইপ করুন · Ctrl+Enter বা Esc = কমিট · ✕ = বাতিল','Type your text · Ctrl+Enter or Esc to commit · ✕ to cancel'));
  }
  function commitTextEdit(){
    if(!txtEdit)return;
    var te=txtEdit,ed=$('#dsTextEditor'),val=(ed?ed.value:'').replace(/\s+$/,'');
    txtEdit=null;if(ed){ed.hidden=true;ed.blur();}setTxtEditActions(false);
    lockStageScroll();
    var p=pages.find(function(x){return x.id===te.pid;});
    if(!p){renderTextOverlay();return;}
    normalizePageLayers(p);
    var idx=p.erases.findIndex(function(e){return e&&e.type==='text'&&e.id===te.id;});
    if(!val){if(idx>=0){remember(p);p.erases.splice(idx,1);p.revision++;}}
    else{
      var item=Object.assign({},te.item,{text:val,visible:te.item.visible!==false,mode:te.item.mode||'normal',opacity:te.item.opacity!=null?te.item.opacity:1});
      if(idx>=0){if(JSON.stringify(p.erases[idx])!==JSON.stringify(item)){remember(p);p.erases[idx]=item;p.revision++;}}
      else{remember(p);p.erases.push(item);p.revision++;}
      activeTextId=item.id;
      p.activeLayerId=item.id;
    }
    p.layerThumbCache=null;
    updateControls();renderTextOverlay();renderLayersList();renderTransformBox();refreshThumbSoon(p);
  }
  function cancelTextEdit(){
    if(!txtEdit)return;
    txtEdit=null;var ed=$('#dsTextEditor');if(ed){ed.hidden=true;ed.blur();}
    lockStageScroll();
    setTxtEditActions(false);renderTextOverlay();
  }
  function applyTextOption(key,val,keepFocusEl){
    var oldFont=txt.font;
    txt[key]=val;syncTextUI();
    if(txtEdit){
      var prevFont=txtEdit.item.font||oldFont;
      if(key==='font'&&prevFont!==val){
        var ed=$('#dsTextEditor');
        var curTxt=ed?ed.value:(txtEdit.item.text||'');
        var conv=convertFontTextEncoding(curTxt,prevFont,val);
        if(conv!==curTxt){
          var hadFullSel=lastTxtSel.start===0&&lastTxtSel.end===curTxt.length;
          if(ed)ed.value=conv;
          txtEdit.item.text=conv;
          if(hadFullSel||lastTxtSel.end>conv.length)lastTxtSel={start:hadFullSel?0:conv.length,end:conv.length};
        }
      }
      txtEdit.item[key]=val;styleTextEditor();
      restoreTxtSelection(keepFocusEl);
      if(key==='font')ensureFontLoaded(val,function(){if(txtEdit)styleTextEditor();});
      return;
    }
    var p=current();if(!p||!p.erases)return;
    normalizePageLayers(p);
    var target=null;
    if(activeTextId)target=p.erases.find(function(x){return x&&x.type==='text'&&x.id===activeTextId;});
    if(!target&&p.activeLayerId&&p.activeLayerId!=='bg'){
      var al=getActiveLayer(p);if(al&&al.type==='text')target=al;
    }
    if(!target){
      for(var i=p.erases.length-1;i>=0;i--){if(p.erases[i]&&p.erases[i].type==='text'){target=p.erases[i];break;}}
    }
    if(target&&!target.locked&&target[key]!==val){
      remember(p);
      if(key==='font')target.text=convertFontTextEncoding(target.text||'',target.font||'Arial',val);
      target[key]=val;
      activeTextId=target.id;p.activeLayerId=target.id;p.revision++;
      p.layerThumbCache=null;
      renderTextOverlay();renderLayersList();renderTransformBox();updateControls();refreshThumbSoon(p);
      if(key==='font')ensureFontLoaded(val,function(){p.layerThumbCache=null;renderTextOverlay();renderLayersList();renderTransformBox();refreshThumbSoon(p);});
    }
  }
  /* ---------- Tools / cursor / zoom ---------- */
  function closeFlyouts(){$$('[data-ds-flyout]').forEach(function(f){f.hidden=true;});}
  function openFlyout(g){closeFlyouts();var f=$('[data-ds-flyout="'+g+'"]');if(f)f.hidden=false;}
  function applyCursor(){
    var wrap=$('#dsPreviewWrap');if(!wrap)return;
    if(!eraserActive){wrap.style.cursor='';return;}
    var t=eraserTool,c='default';
    if(t==='hand')c=pPanDrag?'grabbing':'grab';
    else if(t==='zoom')c=altDown?'zoom-out':'zoom-in';
    else if(t==='text')c='text';
    else if(t==='move')c='move';
    else if(t==='picker'||SEL_TOOLS.indexOf(t)>=0)c='crosshair';
    else if(isPaintTool(t))c=(altDown&&t!=='dodge'&&t!=='burn')?'crosshair':'none';
    wrap.style.cursor=c;
  }
  function setEraserTool(tool){
    if(tool==='rect')tool='marquee-rect';
    if(!TOOL_META[tool])tool='brush';
    if(eraserTool==='text'&&tool!=='text'&&txtEdit)commitTextEdit();
    if(eraserTool==='lasso-poly'&&tool!=='lasso-poly')cancelPolyDraft();
    eraserTool=tool;
    if(isPaintTool(tool))prevDrawTool=tool;
    var meta=TOOL_META[tool];groupCur[meta.g]=tool;
    $$('[data-ds-group-btn]').forEach(function(b){
      var g=b.dataset.dsGroupBtn,curT=groupCur[g]||b.dataset.dsCur;
      b.dataset.dsCur=curT;
      var on=g===meta.g;
      b.setAttribute('aria-pressed',String(on));b.classList.toggle('is-active',on);
      b.querySelectorAll('[data-ds-icon-for]').forEach(function(ic){ic.hidden=ic.dataset.dsIconFor!==curT;});
      var cm=TOOL_META[curT];if(cm)b.dataset.dsTip=toolName(curT)+' ('+cm.k+')';
    });
    $$('[data-ds-fly-check]').forEach(function(c){var tm=TOOL_META[c.dataset.dsFlyCheck];c.style.visibility=tm&&groupCur[tm.g]===c.dataset.dsFlyCheck?'visible':'hidden';});
    closeFlyouts();
    var label=$('#dsPsActiveToolLabel b');if(label)label.textContent=toolName(tool);
    var iconHost=$('#dsPsActiveToolIcon'),src=$('[data-ds-group-btn="'+meta.g+'"] [data-ds-icon-for="'+tool+'"]');
    if(iconHost&&src)iconHost.innerHTML=src.innerHTML;
    $$('[data-ds-opts]').forEach(function(el){el.hidden=el.dataset.dsOpts.split(' ').indexOf(tool)<0;});
    var opl=$('#dsBrushOpacityLbl');if(opl)opl.textContent=(tool==='dodge'||tool==='burn')?tr('এক্সপোজার','Exposure'):tr('অপাসিটি','Opacity');
    var wrap=$('#dsPreviewWrap'),cur=$('#dsEraserCursor'),loupe=$('#dsPickerLoupe');
    if(wrap)wrap.dataset.tool=tool;
    if(cur&&!isPaintTool(tool))cur.hidden=true;
    if(loupe&&tool!=='picker')loupe.hidden=true;
    applyCursor();updateEraserCursor();updateCloneInfo();renderSelection();
    var hv=TOOL_HINT[tool];if(hv)status(en()?hv[1]:hv[0]);
  }
  function clampPan(){
    var wrap=$('#dsPreviewWrap'),st=$('#dsPreviewStage');if(!wrap||!st)return;
    var mx=Math.max(0,(wrap.offsetWidth*pZoom-st.clientWidth)/2)+60,my=Math.max(0,(wrap.offsetHeight*pZoom-st.clientHeight)/2)+60;
    pPan.x=Math.max(-mx,Math.min(mx,pPan.x));pPan.y=Math.max(-my,Math.min(my,pPan.y));
  }
  function syncPreviewPlane(){
    var wrap=$('#dsPreviewWrap'),lbl=$('#dsPreviewZoomLabel');
    clampPan();
    if(wrap)wrap.style.transform=(pZoom===1&&!pPan.x&&!pPan.y)?'':'translate('+pPan.x+'px,'+pPan.y+'px) scale('+pZoom+')';
    if(lbl)lbl.textContent=Math.round(pZoom*100)+'%';
    updateEraserCursor();positionTextEditor();
  }
  function fitPreview(){pZoom=1;pPan={x:0,y:0};syncPreviewPlane();}
  function setPreviewZoom(z,ax,ay){
    var wrap=$('#dsPreviewWrap'),st=$('#dsPreviewStage');
    if(ax==null||ay==null){
      if(Math.abs(z-1)<1e-6){fitPreview();return;}
      if(st){var sr=st.getBoundingClientRect();ax=sr.left+sr.width/2;ay=sr.top+sr.height/2;}
    }
    var nz=Math.max(.2,Math.min(16,z));
    if(wrap&&ax!=null){
      var r=wrap.getBoundingClientRect(),k=1-nz/pZoom;
      pPan.x+=(ax-(r.left+r.width/2))*k;pPan.y+=(ay-(r.top+r.height/2))*k;
    }
    pZoom=nz;syncPreviewPlane();
  }
  function stepZoom(dir,ax,ay){
    var nz=pZoom;
    if(dir>0){nz=ZOOM_STEPS.find(function(s){return s>pZoom+.001;})||16;}
    else{for(var i=ZOOM_STEPS.length-1;i>=0;i--){if(ZOOM_STEPS[i]<pZoom-.001){nz=ZOOM_STEPS[i];break;}}if(nz===pZoom)nz=.2;}
    setPreviewZoom(nz,ax,ay);
  }
  function actualPixels(){
    var c=$('#dsPreview'),st=$('#dsPreviewStage');if(!c||!c.clientWidth||!st)return;
    pPan={x:0,y:0};pZoom=1;syncPreviewPlane();
    var sr=st.getBoundingClientRect();setPreviewZoom((c.width/c.clientWidth)/(window.devicePixelRatio||1),sr.left+sr.width/2,sr.top+sr.height/2);
  }
  function setEraserMode(active){
    eraserActive=!!active;root.dataset.editing=String(eraserActive);
    var bar=$('#dsEraserBar'),dock=$('#dsPsDock'),stage=$('#dsPreviewStage'),wrap=$('#dsPreviewWrap'),cur=$('#dsEraserCursor'),loupe=$('#dsPickerLoupe');
    if(!eraserActive){commitTextEdit();cancelPolyDraft();closeFlyouts();hideCloneMark();if(tempToolPrev!==null){eraserTool=tempToolPrev;tempToolPrev=null;}}
    if(bar)bar.hidden=!eraserActive;
    if(dock)dock.hidden=!eraserActive;
    if(stage)stage.classList.toggle('pl-11',eraserActive);
    if(wrap){wrap.classList.toggle('is-eraser-active',eraserActive);wrap.dataset.tool=eraserTool;}
    if(!eraserActive){closePopovers();if(cur)cur.hidden=true;if(loupe)loupe.hidden=true;$$('[data-ds-group-btn]').forEach(function(b){b.classList.remove('is-active');b.setAttribute('aria-pressed','false');});fitPreview();}
    $$('[data-ds="toggle-eraser"]').forEach(function(b){
      b.setAttribute('aria-pressed',String(eraserActive));
      b.classList.toggle('is-active',eraserActive);
    });
    if(eraserActive){
      closeDrawers();
      setEraserTool(eraserTool||'brush');
      syncTextUI();
      view('preview');requestAnimationFrame(fitPreview);
    }
    if(!eraserActive){closeDrawers();view('preview');cachePagePreview(current());$$('[data-ds-insp-tab]').forEach(function(b){b.setAttribute('aria-selected',String(b.dataset.dsInspTab==='filters'));});$$('[data-ds-insp-pane]').forEach(function(p){p.hidden=p.dataset.dsInspPane!=='filters';});requestAnimationFrame(fitPreview);}
    applyCursor();renderSelection();
  }
  function renderBrushPreviewCanvas(hudMode){
    var pCanvas=$('#dsBrushPreviewCanvas');
    if(!pCanvas)return;
    var cacheKey=(hudMode?'1:':'0:')+eraserSize+':'+eraserHardness+':'+eraserOpacity+':'+eraserColor+':'+eraserTool;
    if(pCanvas._lastKey===cacheKey)return;
    pCanvas._lastKey=cacheKey;
    var cw=144,ch=144;
    if(pCanvas.width!==cw)pCanvas.width=cw;
    if(pCanvas.height!==ch)pCanvas.height=ch;
    var ctx=pCanvas.getContext('2d');
    ctx.clearRect(0,0,cw,ch);
    if(!hudMode&&eraserTool!=='brush')return;
    var im=ctx.createImageData(cw,ch),d=im.data;
    var R=cw/2,hard=Math.max(0,Math.min(1,eraserHardness/100));
    var rInner=R*Math.min(.98,hard),rSpan=Math.max(.001,R-rInner),rSq=R*R,rInnerSq=rInner*rInner;
    var op=Math.max(.05,Math.min(1,eraserOpacity/100));
    var rgb=hudMode?[248,105,105]:(C.parseRgb?C.parseRgb(eraserColor):[255,255,255]);
    var cr=rgb[0],cg=rgb[1],cb=rgb[2];
    for(var y=0;y<ch;y++){
      var dy=y+.5-R,dySq=dy*dy;
      for(var x=0;x<cw;x++){
        var dx=x+.5-R,dSq=dx*dx+dySq;
        if(dSq>rSq)continue;
        var wt=1;
        if(dSq>rInnerSq){var tt=(Math.sqrt(dSq)-rInner)/rSpan;wt=Math.pow(.5*(1+Math.cos(Math.PI*tt)),.78);}
        var idx=(y*cw+x)*4;
        d[idx]=cr;d[idx+1]=cg;d[idx+2]=cb;d[idx+3]=Math.round(wt*op*255);
      }
    }
    ctx.putImageData(im,0,0);
  }
  function updateEraserCursor(showHud){
    var cur=$('#dsEraserCursor'),wrap=$('#dsPreviewWrap'),canvas=$('#dsPreview');
    var dEl=$('#dsHudDiameter'),hEl=$('#dsHudHardness'),oEl=$('#dsHudOpacity');
    if(!cur||!wrap)return;
    var altPick=altDown&&(eraserTool==='brush'||eraserTool==='heal'||eraserTool==='clone');
    if(!eraserActive||!isPaintTool(eraserTool)||(altPick&&!showHud&&!eraserStroke)){cur.hidden=true;cur.dataset.hud='false';return;}
    var cw=(canvas&&canvas.clientWidth)||wrap.clientWidth||300;
    var ch=(canvas&&canvas.clientHeight)||wrap.clientHeight||300;
    var minDim=Math.max(60,Math.min(cw,ch));
    var pxSize=Math.max(4,(eraserSize/1000)*minDim);
    cur.style.width=pxSize+'px';
    cur.style.height=pxSize+'px';
    if(dEl)dEl.textContent=eraserSize+' px';
    if(hEl)hEl.textContent=eraserHardness+'%';
    if(oEl)oEl.textContent=eraserOpacity+'%';
    cur.dataset.hudFlip=(pointerInPreview&&lastCursorRel.x>.68)?'true':'false';
    if(showHud){
      clearTimeout(cursorHudTimer);
      if(!pointerInPreview){cur.style.left='50%';cur.style.top='50%';cur.dataset.hudFlip='false';}
      cur.hidden=false;
      cur.dataset.hud='true';
      renderBrushPreviewCanvas(true);
      cursorHudTimer=setTimeout(function(){
        cur.dataset.hud='false';
        renderBrushPreviewCanvas(false);
        if(!pointerInPreview&&!eraserStroke)cur.hidden=true;
      },1200);
    }else{
      renderBrushPreviewCanvas(cur.dataset.hud==='true');
    }
  }
  function installEraser(){
    var stage=$('#dsPreviewStage'),wrap=$('#dsPreviewWrap'),canvas=$('#dsPreview'),cur=$('#dsEraserCursor'),loupe=$('#dsPickerLoupe'),loupeSw=$('#dsPickerLoupeSwatch'),loupeHex=$('#dsPickerLoupeHex'),ed=$('#dsTextEditor');
    if(!wrap||!canvas)return;
    var colorInp=$('#dsEraserColor'),dockColorInp=$('#dsDockColor'),szInp=$('#dsBrushSize'),hdInp=$('#dsBrushHardness'),opInp=$('#dsBrushOpacity'),flInp=$('#dsBrushFlow'),tolInp=$('#dsWandTolerance');
    function setSize(v){eraserSize=Math.max(2,Math.min(120,Math.round(v)));if(szInp)szInp.value=String(eraserSize);var o=$('#dsBrushSizeVal');if(o)o.textContent=eraserSize+'px';syncRetouchFills();updateEraserCursor(true);}
    function setHardness(v){eraserHardness=Math.max(0,Math.min(100,Math.round(v)));if(hdInp)hdInp.value=String(eraserHardness);var o=$('#dsBrushHardnessVal');if(o)o.textContent=eraserHardness+'%';syncRetouchFills();updateEraserCursor(true);}
    function setOpacity(v){eraserOpacity=Math.max(10,Math.min(100,Math.round(v)));if(opInp)opInp.value=String(eraserOpacity);var o=$('#dsBrushOpacityVal');if(o)o.textContent=eraserOpacity+'%';syncRetouchFills();updateEraserCursor(true);}
    function setFlow(v){eraserFlow=Math.max(1,Math.min(100,Math.round(v)));if(flInp)flInp.value=String(eraserFlow);var o=$('#dsBrushFlowVal');if(o)o.textContent=eraserFlow+'%';syncRetouchFills();}
    if(colorInp)colorInp.addEventListener('input',function(){setEraserColor(this.value,true);if(isPaintTool(eraserTool))updateEraserCursor(true);});
    if(dockColorInp)dockColorInp.addEventListener('input',function(){setEraserColor(this.value,true);if(isPaintTool(eraserTool))updateEraserCursor(true);});
    if(szInp){szInp.addEventListener('pointerdown',function(){updateEraserCursor(true);});szInp.addEventListener('input',function(){setSize(Number(this.value)||24);});}
    if(hdInp){hdInp.addEventListener('pointerdown',function(){updateEraserCursor(true);});hdInp.addEventListener('input',function(){setHardness(Number(this.value));});}
    if(opInp){opInp.addEventListener('pointerdown',function(){updateEraserCursor(true);});opInp.addEventListener('input',function(){setOpacity(Number(this.value)||100);});}
    if(flInp){flInp.addEventListener('input',function(){setFlow(Number(this.value)||100);});}
    if(tolInp)tolInp.addEventListener('input',function(){wandTolerance=Number(this.value)||28;});
    syncRetouchFills();
    var modeSel=$('#dsBrushMode');if(modeSel)modeSel.addEventListener('change',function(){eraserMode=this.value||'normal';});
    var sampleSel=$('#dsHealSample');if(sampleSel)sampleSel.addEventListener('change',function(){healSample=this.value||'below';});
    var rangeSel=$('#dsDodgeRange');if(rangeSel)rangeSel.addEventListener('change',function(){dodgeRange=this.value;});
    var autoSelChk=$('#dsAutoSelect');if(autoSelChk)autoSelChk.addEventListener('change',function(){autoSelectLayer=!!this.checked;});
    var showTfChk=$('#dsShowTransform');if(showTfChk)showTfChk.addEventListener('change',function(){showTransformControls=!!this.checked;renderTransformBox();});
    var featherInp=$('#dsSelFeather');if(featherInp)featherInp.addEventListener('input',function(){selFeather=Math.max(0,Math.min(100,Number(this.value)||0));if(retSel)retSel.feather=selFeather;});
    var aaChk=$('#dsSelAA');if(aaChk)aaChk.addEventListener('change',function(){selAA=!!this.checked;if(retSel)retSel.aa=selAA;});
    var mStyleSel=$('#dsMarqueeStyle'),mWInp=$('#dsMarqueeW'),mHInp=$('#dsMarqueeH'),mSwapBtn=$('#dsMarqueeSwap');
    function syncMarqueeStyleUI(){
      var dis=marqueeStyle==='normal';
      if(mWInp){mWInp.disabled=dis;if(!mWInp.value)mWInp.value=marqueeStyle==='size'?'200':'1';}
      if(mHInp){mHInp.disabled=dis;if(!mHInp.value)mHInp.value=marqueeStyle==='size'?'200':'1';}
      if(mSwapBtn)mSwapBtn.disabled=dis;
      marqueeW=Math.max(1,Number(mWInp&&mWInp.value)||1);
      marqueeH=Math.max(1,Number(mHInp&&mHInp.value)||1);
    }
    if(mStyleSel)mStyleSel.addEventListener('change',function(){
      marqueeStyle=this.value||'normal';
      if(mWInp&&mHInp){
        if(marqueeStyle==='ratio'){mWInp.value='1';mHInp.value='1';}
        else if(marqueeStyle==='size'){mWInp.value='220';mHInp.value='160';}
      }
      syncMarqueeStyleUI();
    });
    if(mWInp)mWInp.addEventListener('input',function(){marqueeW=Math.max(1,Number(this.value)||1);});
    if(mHInp)mHInp.addEventListener('input',function(){marqueeH=Math.max(1,Number(this.value)||1);});
    if(mSwapBtn)mSwapBtn.addEventListener('click',function(){
      if(marqueeStyle==='normal')return;
      var tmp=marqueeW;marqueeW=marqueeH;marqueeH=tmp;
      if(mWInp)mWInp.value=String(marqueeW);
      if(mHInp)mHInp.value=String(marqueeH);
    });
    var lBmSel=$('#dsLayerBlendMode'),lOpInp=$('#dsLayerOpacity'),lList=$('#dsLayerList'),lOpCheck=false;
    if(lBmSel)lBmSel.addEventListener('change',function(){
      var p=current(),act=getActiveLayer(p);if(!p||!act||act.locked)return;
      remember(p);act.mode=this.value||'normal';refreshCanvasFromLayers(p);
    });
    if(lOpInp){
      lOpInp.addEventListener('pointerdown',function(){var p=current();if(p&&!lOpCheck){remember(p);lOpCheck=true;}});
      lOpInp.addEventListener('input',function(){
        var p=current(),act=getActiveLayer(p);if(!p||!act||act.locked)return;
        if(!lOpCheck){remember(p);lOpCheck=true;}
        act.opacity=Math.max(0,Math.min(1,(Number(this.value)||100)/100));
        refreshCanvasFromLayers(p);
      });
      lOpInp.addEventListener('change',function(){lOpCheck=false;});
      lOpInp.addEventListener('blur',function(){lOpCheck=false;});
    }
    if(lList)lList.addEventListener('dblclick',function(e){
      var row=e.target.closest('[data-ds-layer-row]');if(!row)return;
      var p=current();if(!p)return;
      selectLayerById(row.dataset.dsLayerRow);
      var act=getActiveLayer(p);
      if(act&&act.type==='text'&&!act.locked){
        if(!eraserActive)setEraserMode(true);
        setEraserTool('text');
        startTextEdit(p,{x:act.x,y:act.y},act);
      }
    });
    var fSel=$('#dsTxtFont'),sSel=$('#dsTxtStyle'),zInp=$('#dsTxtSize'),tcInp=$('#dsTxtColor');
    if(fSel){fSel.addEventListener('pointerdown',saveTxtSelection);fSel.addEventListener('change',function(){applyTextOption('font',this.value);});fSel.addEventListener('input',function(){applyTextOption('font',this.value);});}
    if(sSel){sSel.addEventListener('pointerdown',saveTxtSelection);sSel.addEventListener('change',function(){applyTextOption('style',this.value);});sSel.addEventListener('input',function(){applyTextOption('style',this.value);});}
    if(zInp){zInp.addEventListener('pointerdown',saveTxtSelection);zInp.addEventListener('input',function(){var v=Number(this.value);if(v>=4&&v<=400)applyTextOption('size',v,this);});zInp.addEventListener('change',function(){restoreTxtSelection();});}
    if(tcInp){tcInp.addEventListener('pointerdown',saveTxtSelection);tcInp.addEventListener('input',function(){applyTextOption('color',this.value);});}
    $$('[data-ds-txt-toggle],[data-ds-txt-align]').forEach(function(b){
      b.addEventListener('pointerdown',function(e){saveTxtSelection();e.preventDefault();});
      b.addEventListener('mousedown',function(e){saveTxtSelection();e.preventDefault();});
    });
    if(stage)stage.addEventListener('scroll',lockStageScroll);
    var pCard=$('#dsPreviewCard');if(pCard)pCard.addEventListener('scroll',lockStageScroll);
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(function(){positionTextEditor();}).observe(canvas);
    if(ed){
      ['select','keyup','mouseup','focus'].forEach(function(ev){ed.addEventListener(ev,saveTxtSelection);});
      ed.addEventListener('scroll',function(){ed.scrollLeft=0;ed.scrollTop=0;lockStageScroll();});
      ed.addEventListener('input',function(){saveTxtSelection();if(txtEdit){txtEdit.item.text=ed.value;styleTextEditor();}});
      ed.addEventListener('keydown',function(e){
        e.stopPropagation();
        var k=(e.key||'').toLowerCase();
        if((e.ctrlKey||e.metaKey)&&(k==='b'||k==='i')){
          e.preventDefault();
          toggleTextStyleFlag(k==='b'?'bold':'italic');
          return;
        }
        if(e.key==='Escape'){e.preventDefault();commitTextEdit();return;}
        if(e.key==='Enter'&&(e.ctrlKey||e.metaKey||e.location===3)){e.preventDefault();commitTextEdit();}
      });
      ed.addEventListener('pointerdown',function(e){e.stopPropagation();});
    }
    // Grouped tool buttons: click = select · right-click / long-press = flyout
    var lpTimer=0,lpFired=false;
    $$('[data-ds-group-btn]').forEach(function(b){
      b.addEventListener('pointerdown',function(e){if(e.button!==0)return;lpFired=false;clearTimeout(lpTimer);if(b.parentElement.querySelector('[data-ds-flyout]'))lpTimer=setTimeout(function(){lpFired=true;openFlyout(b.dataset.dsGroupBtn);},380);});
      b.addEventListener('pointerup',function(){clearTimeout(lpTimer);});
      b.addEventListener('pointerleave',function(){clearTimeout(lpTimer);});
      b.addEventListener('contextmenu',function(e){e.preventDefault();if(b.parentElement.querySelector('[data-ds-flyout]'))openFlyout(b.dataset.dsGroupBtn);});
      b.addEventListener('click',function(e){e.preventDefault();if(lpFired){lpFired=false;return;}if(busy)return;if(!eraserActive)setEraserMode(true);setEraserTool(b.dataset.dsCur);});
    });
    root.addEventListener('click',function(e){
      if(!e.target.closest('[data-ds-group]'))closeFlyouts();
      var alignBtn=e.target.closest('[data-ds-align]');
      if(alignBtn&&!busy){alignActiveTarget(alignBtn.dataset.dsAlign);return;}
      var smBtn=e.target.closest('[data-ds-sel-mode]');
      if(smBtn&&!busy){
        selCombineMode=smBtn.dataset.dsSelMode||'new';
        $$('[data-ds-sel-mode]').forEach(function(b){var on=b.dataset.dsSelMode===selCombineMode;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
        return;
      }
      var sb=e.target.closest('[data-ds-sel]');
      if(sb&&!busy){var a=sb.dataset.dsSel;if(a==='all')selectAll();else if(a==='none')deselect();else if(a==='invert')invertSel();else if(a==='fill')fillSelection();return;}
      var tgl=e.target.closest('[data-ds-txt-toggle]');if(tgl){toggleTextStyleFlag(tgl.dataset.dsTxtToggle);return;}
      var al=e.target.closest('[data-ds-txt-align]');if(al){applyTextOption('align',al.dataset.dsTxtAlign);return;}
      var tb=e.target.closest('[data-ds-txt]');if(tb){if(tb.dataset.dsTxt==='commit')commitTextEdit();else cancelTextEdit();return;}
      var zb=e.target.closest('[data-ds-pz]');
      if(zb){var z=zb.dataset.dsPz;if(z==='in')stepZoom(1);else if(z==='out')stepZoom(-1);else if(z==='100')actualPixels();else fitPreview();}
    });
    function relFromEvent(e){var r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/Math.max(1,r.width),y:(e.clientY-r.top)/Math.max(1,r.height),r:r};}
    function getRel(e){var q=relFromEvent(e);return {x:clamp01(q.x),y:clamp01(q.y),r:q.r};}
    function startLivePaint(p,item,targetLayer){
      var ctx=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height;
      if(!w||!h||!C.makePainter)return null;
      normalizePageLayers(p);
      var workIm=ctx.getImageData(0,0,w,h);
      var baseScan=getBaseScanPixels(p,w,h);
      if(!baseScan)baseScan=new Uint8ClampedArray(workIm.data);
      var lIdx=p.erases.indexOf(targetLayer);
      var belowData=new Uint8ClampedArray(baseScan);
      if(lIdx>0&&C.applyErases)C.applyErases(belowData,w,h,p.erases.slice(0,lIdx),{skipSimpleText:true});
      var layerBuf=new Uint8ClampedArray(w*h*4);
      var prevOps=targetLayer.ops.slice(0,-1);
      for(var i=0;i<prevOps.length;i++)C.applyLayerOp(layerBuf,belowData,w,h,prevOps[i],baseScan);
      var aboveLayers=lIdx>=0?p.erases.slice(lIdx+1).filter(function(x){return x&&x.type==='layer'&&x.visible!==false;}):[];
      return {
        ctx:ctx,w:w,h:h,work:workIm,belowData:belowData,layerBuf:layerBuf,layer:targetLayer,aboveLayers:aboveLayers,
        painter:C.makePainter(item,w,h,belowData,layerBuf,{x0:0,y0:0,w:w,h:h},false)
      };
    }
    function paintSegmentOnCanvas(pt0,pt1){
      if(!livePaint||!livePaint.painter)return;
      var lp=livePaint,rg=lp.painter.segment(pt0,pt1);
      if(!rg)return;
      lp.painter.render(rg);
      var bx0=rg.x0,by0=rg.y0,bx1=rg.x1,by1=rg.y1,w=lp.w;
      if(bx1<bx0||by1<by0)return;
      var lMode=lp.layer.mode||'normal',lOp=lp.layer.opacity!=null?Math.max(0,Math.min(1,Number(lp.layer.opacity))):1;
      var below=lp.belowData,lBuf=lp.layerBuf,out=lp.work.data,bOut=[0,0,0];
      for(var y=by0;y<=by1;y++){
        var ro=y*w;
        for(var x=bx0;x<=bx1;x++){
          var at=(ro+x)*4,la=(lBuf[at+3]/255)*lOp;
          if(la<=0){
            out[at]=below[at];out[at+1]=below[at+1];out[at+2]=below[at+2];out[at+3]=255;
          }else{
            C.blendRGB(lMode,below[at],below[at+1],below[at+2],lBuf[at],lBuf[at+1],lBuf[at+2],bOut);
            out[at]=Math.round(below[at]*(1-la)+bOut[0]*la);
            out[at+1]=Math.round(below[at+1]*(1-la)+bOut[1]*la);
            out[at+2]=Math.round(below[at+2]*(1-la)+bOut[2]*la);
            out[at+3]=255;
          }
        }
      }
      if(lp.aboveLayers&&lp.aboveLayers.length&&C.applyErases){
        C.applyErases(out,lp.w,lp.h,lp.aboveLayers,{skipSimpleText:true});
      }
      lp.ctx.putImageData(lp.work,0,0,bx0,by0,bx1-bx0+1,by1-by0+1);
      if(!lp.thumbTime||performance.now()-lp.thumbTime>150){lp.thumbTime=performance.now();var p=current();if(p){p.layerThumbCache=null;renderLayersList();}}
    }
    function prepareMove(p,layer){
      var ctx=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height,im=ctx.getImageData(0,0,w,h);
      if(layer&&layer.type==='layer'){
        normalizePageLayers(p);
        var baseScan=getBaseScanPixels(p,w,h)||new Uint8ClampedArray(im.data);
        var lIdx=p.erases.indexOf(layer);
        var belowData=new Uint8ClampedArray(baseScan);
        if(lIdx>0&&C.applyErases)C.applyErases(belowData,w,h,p.erases.slice(0,lIdx),{skipSimpleText:true});
        var layerBuf=new Uint8ClampedArray(w*h*4);
        layerBuf=C.renderLayerPixels(layer,baseScan,w,h,belowData);
        var lb=layerBounds(p,layer,w,h)||{x0:0,y0:0,x1:w,y1:h};
        return {ctx:ctx,w:w,h:h,isLayer:true,layer:layer,below:belowData,lBuf:layerBuf,work:im,b0:lb,dx:0,dy:0,raf:0};
      }
      var m=C.selectionMask(selForOp(),w,h),x0=w,y0=h,x1=-1,y1=-1;
      for(var y=0;y<h;y++){var ro=y*w;for(var x=0;x<w;x++){if(m[ro+x]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}}
      return {ctx:ctx,w:w,h:h,isLayer:false,base:new Uint8ClampedArray(im.data),work:im,mask:m,bx0:x0,by0:y0,bx1:x1,by1:y1,rgb:C.parseRgb(eraserColor),dx:0,dy:0,raf:0};
    }
    function renderPixMove(d){
      var w=d.w,h=d.h,wd=d.work.data,dxp=d.dx,dyp=d.dy,x,y;
      if(d.isLayer){
        var p=current(),base=getBaseScanPixels(p,w,h),layers=copy(p.erases),layer=layers.find(function(l){return l.id===d.layer.id;});
        if(base&&layer){layer.ops.push({type:'movesel',sel:{kind:'rect',x0:0,y0:0,x1:1,y1:1},dx:dxp/w,dy:dyp/h});C.applyErases(base,w,h,layers,{skipSimpleText:true});d.work.data.set(base);d.ctx.putImageData(d.work,0,0);}return;
      }
      var result=previewSelectionTransform(current(),{type:'movesel',sel:selForOp(),dx:dxp/w,dy:dyp/h,color:eraserColor},w,h);
      if(result){d.work.data.set(result);d.ctx.putImageData(d.work,0,0);}
    }
    function prepareTransformDrag(p,tgt){
      var ctx=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height,im=ctx.getImageData(0,0,w,h);
      if(tgt.kind==='layer'&&tgt.layer){
        normalizePageLayers(p);
        var baseScan=getBaseScanPixels(p,w,h)||new Uint8ClampedArray(im.data);
        var lIdx=p.erases.indexOf(tgt.layer);
        var belowData=new Uint8ClampedArray(baseScan);
        if(lIdx>0&&C.applyErases)C.applyErases(belowData,w,h,p.erases.slice(0,lIdx),{skipSimpleText:true});
        var layerBuf=new Uint8ClampedArray(w*h*4);
        layerBuf=C.renderLayerPixels(tgt.layer,baseScan,w,h,belowData);
        return {ctx:ctx,w:w,h:h,isLayer:true,layer:tgt.layer,below:belowData,lBuf:layerBuf,work:im};
      }
      return {ctx:ctx,w:w,h:h,isLayer:false,base:new Uint8ClampedArray(im.data),work:im};
    }
    function tgtSelection(d){return d.tgt&&d.tgt.kind==='sel'?selForOp():null;}
    function renderTransformDrag(d,nb){
      var tf=d.tfState,w=tf.w,h=tf.h,b0=d.b0;
      var op={sel:tgtSelection(d),sx0:b0.x0/w,sy0:b0.y0/h,sx1:b0.x1/w,sy1:b0.y1/h,dx0:nb.x0/w,dy0:nb.y0/h,dx1:nb.x1/w,dy1:nb.y1/h,clearSrc:true,bgColor:eraserColor};
      if(tf.isLayer){
        var p=current(),base=getBaseScanPixels(p,w,h),layers=copy(p.erases),layer=layers.find(function(l){return l.id===tf.layer.id;});
        if(base&&layer){op.type='transform';layer.ops.push(op);C.applyErases(base,w,h,layers,{skipSimpleText:true});tf.work.data.set(base);tf.ctx.putImageData(tf.work,0,0);}
      }else{
        op.type='transform';var transformed=previewSelectionTransform(current(),op,w,h);if(transformed)tf.work.data.set(transformed);
        tf.ctx.putImageData(tf.work,0,0);
      }
      var box=$('#dsTransformBox');
      if(box){
        box.hidden=false;
        box.style.left=(nb.x0/w*100)+'%';
        box.style.top=(nb.y0/h*100)+'%';
        box.style.width=Math.max(.5,(nb.x1-nb.x0)/w*100)+'%';
        box.style.height=Math.max(.5,(nb.y1-nb.y0)/h*100)+'%';
      }
    }
    function showHoverVisuals(pos){
      var t=eraserTool,pickHover=t==='picker'||(altDown&&(t==='brush'||t==='heal'));
      if(pickHover&&!eraserStroke){
        if(cur)cur.hidden=true;
        if(loupe){
          var sc=sampleCanvasColor(canvas,pos.x,pos.y,2);
          loupe.hidden=false;loupe.style.left=(pos.x*100)+'%';loupe.style.top=(pos.y*100)+'%';
          if(loupeSw)loupeSw.style.background=sc.hex;if(loupeHex)loupeHex.textContent=sc.hex.toUpperCase();
        }
        return;
      }
      if(loupe)loupe.hidden=true;
      if(cur&&isPaintTool(t)&&!(altDown&&t==='clone')){
        if(cur.dataset.hud==='true'||cur.hidden){cur.dataset.hud='false';updateEraserCursor(false);cur.hidden=false;}
        cur.style.left=(pos.x*100)+'%';cur.style.top=(pos.y*100)+'%';
      }else if(cur)cur.hidden=true;
    }
    function handleToolDragMove(e,pos){
      var d=toolDrag;
      if(d.kind==='zoom'){
        var zdx=e.clientX-d.x;if(Math.abs(zdx)>3)d.moved=true;
        if(d.moved){pZoom=d.z0;pPan={x:d.pan0.x,y:d.pan0.y};syncPreviewPlane();setPreviewZoom(d.z0*Math.exp(zdx*.01),d.x,d.y);}
        return;
      }
      if(d.kind==='marquee'){
        var x1=pos.x,y1=pos.y,ax=d.ax,ay=d.ay,w=canvas.width,h=canvas.height;
        if(marqueeStyle==='size'){
          var sw=Math.min(1,marqueeW/Math.max(1,w)),sh=Math.min(1,marqueeH/Math.max(1,h));
          selDraft.x0=clamp01(pos.x-sw/2);selDraft.y0=clamp01(pos.y-sh/2);
          selDraft.x1=clamp01(selDraft.x0+sw);selDraft.y1=clamp01(selDraft.y0+sh);
          d.moved=true;renderSelection();return;
        }
        if(marqueeStyle==='ratio'||e.shiftKey){
          var rw=marqueeStyle==='ratio'?marqueeW:1,rh=marqueeStyle==='ratio'?marqueeH:1;
          var qx=(x1-ax)*w,qy=(y1-ay)*h,absX=Math.abs(qx),absY=Math.abs(qy);
          if(absX*rh>absY*rw)absY=absX*(rh/rw);else absX=absY*(rw/rh);
          x1=ax+(qx<0?-1:1)*absX/w;y1=ay+(qy<0?-1:1)*absY/h;
        }
        selDraft.x0=ax;selDraft.y0=ay;
        selDraft.x1=x1;selDraft.y1=y1;d.moved=true;renderSelection();return;
      }
      if(d.kind==='lasso'){
        var last=selDraft.pts[selDraft.pts.length-1];
        if(Math.hypot((pos.x-last.x)*canvas.width,(pos.y-last.y)*canvas.height)>=1.5){selDraft.pts.push({x:pos.x,y:pos.y});renderSelection();}
        return;
      }
      var raw=relFromEvent(e);
      if(d.kind==='tf-text'){
        var wT=canvas.width,hT=canvas.height,pxT=pos.x*wT,pyT=pos.y*hT,b0=d.b0,nbT={x0:b0.x0,y0:b0.y0,x1:b0.x1,y1:b0.y1},hId=d.handle;
        if(hId.indexOf('w')>=0)nbT.x0=Math.min(nbT.x1-8,pxT);
        if(hId.indexOf('e')>=0)nbT.x1=Math.max(nbT.x0+8,pxT);
        if(hId.indexOf('n')>=0)nbT.y0=Math.min(nbT.y1-8,pyT);
        if(hId.indexOf('s')>=0)nbT.y1=Math.max(nbT.y0+8,pyT);
        var scaleT=Math.max(.2,Math.min(8,((nbT.y1-nbT.y0)/Math.max(1,b0.y1-b0.y0)+((nbT.x1-nbT.x0)/Math.max(1,b0.x1-b0.x0)))/2));
        if(hId==='n'||hId==='s')scaleT=(nbT.y1-nbT.y0)/Math.max(1,b0.y1-b0.y0);
        else if(hId==='e'||hId==='w')scaleT=(nbT.x1-nbT.x0)/Math.max(1,b0.x1-b0.x0);
        d.it.size=Math.max(4,Math.min(400,Math.round(d.size0*scaleT)));
        d.it.x=clamp01(nbT.x0/wT);d.it.y=clamp01(nbT.y0/hT);
        txt.size=d.it.size;syncTextUI();
        d.moved=true;
        if(C.isSimpleTextItem&&C.isSimpleTextItem(d.it,(current()||{}).erases)){renderDomTextOverlay();renderTransformBox();}
        else renderTextOverlay();
        return;
      }
      if(d.kind==='tf-pix'){
        var wP=canvas.width,hP=canvas.height,pxP=Math.round(pos.x*wP),pyP=Math.round(pos.y*hP),b0P=d.b0,nbP={x0:b0P.x0,y0:b0P.y0,x1:b0P.x1,y1:b0P.y1},hp=d.handle;
        if(hp.indexOf('w')>=0)nbP.x0=Math.max(0,Math.min(nbP.x1-4,pxP));
        if(hp.indexOf('e')>=0)nbP.x1=Math.min(wP,Math.max(nbP.x0+4,pxP));
        if(hp.indexOf('n')>=0)nbP.y0=Math.max(0,Math.min(nbP.y1-4,pyP));
        if(hp.indexOf('s')>=0)nbP.y1=Math.min(hP,Math.max(nbP.y0+4,pyP));
        d.nb=nbP;d.moved=true;renderTransformDrag(d,nbP);return;
      }
      if(d.kind==='selmove'){selShift={x:raw.x-d.start.x,y:raw.y-d.start.y};d.moved=true;renderSelection();return;}
      if(d.kind==='textmove'){
        d.it.x=d.ox+(raw.x-d.start.x);d.it.y=d.oy+(raw.y-d.start.y);d.moved=true;
        if(C.isSimpleTextItem&&C.isSimpleTextItem(d.it,(current()||{}).erases)){renderDomTextOverlay();renderTransformBox();}
        else renderTextOverlay();
        return;
      }
      if(d.kind==='pixmove'){
        var dxp=Math.round((raw.x-d.start.x)*d.mv.w),dyp=Math.round((raw.y-d.start.y)*d.mv.h);
        if(dxp===d.mv.dx&&dyp===d.mv.dy)return;
        d.mv.dx=dxp;d.mv.dy=dyp;
        if(!d.mv.isLayer){selShift={x:dxp/d.mv.w,y:dyp/d.mv.h};renderSelection();}
        else if(d.mv.b0){
          var box=$('#dsTransformBox');
          if(box&&showTransformControls){
            box.style.left=((d.mv.b0.x0+dxp)/d.mv.w*100)+'%';
            box.style.top=((d.mv.b0.y0+dyp)/d.mv.h*100)+'%';
          }
        }
        if(!d.mv.raf)d.mv.raf=requestAnimationFrame(function(){d.mv.raf=0;renderPixMove(d.mv);});
      }
    }
    wrap.addEventListener('pointerenter',function(){
      pointerInPreview=true;
      if(eraserActive&&cur){cur.dataset.hud='false';updateEraserCursor(false);}
    });
    wrap.addEventListener('pointerleave',function(){
      pointerInPreview=false;
      if(cur&&!eraserStroke&&cur.dataset.hud!=='true')cur.hidden=true;
      if(loupe)loupe.hidden=true;
    });
    wrap.addEventListener('pointermove',function(e){
      if(pPanDrag){pPan.x=pPanDrag.px+(e.clientX-pPanDrag.x);pPan.y=pPanDrag.py+(e.clientY-pPanDrag.y);syncPreviewPlane();return;}
      if(!eraserActive)return;
      var pos=getRel(e);
      lastCursorRel={x:pos.x,y:pos.y};
      if(toolDrag){handleToolDragMove(e,pos);return;}
      showHoverVisuals(pos);
      if(eraserTool==='lasso-poly'&&polyDraft){polyDraft.hover={x:pos.x,y:pos.y};renderSelection();}
      if(!eraserStroke)return;
      var evs=(e.getCoalescedEvents&&e.getCoalescedEvents())||[];if(!evs.length)evs=[e];
      for(var i=0;i<evs.length;i++){
        var q=getRel(evs[i]),prev=eraserStroke.pts[eraserStroke.pts.length-1];
        if(Math.hypot((q.x-prev.x)*canvas.width,(q.y-prev.y)*canvas.height)<.9)continue;
        eraserStroke.pts.push({x:q.x,y:q.y});
        paintSegmentOnCanvas(prev,{x:q.x,y:q.y});
      }
      lastBrushPt={x:pos.x,y:pos.y};
      if(eraserStroke.type==='clone')placeCloneMark(pos);
    });
    function resolveCombineMode(e){
      if(e.shiftKey&&e.altKey)return 'int';
      if(e.shiftKey)return 'add';
      if(e.altKey)return 'sub';
      return selCombineMode||'new';
    }
    wrap.addEventListener('pointerdown',function(e){
      closePopovers();closeFlyouts();
      if(!eraserActive||busy||(e.button!==0&&e.button!==1))return;
      if(e.target.closest&&e.target.closest('#dsTextEditor'))return;
      var p=current();if(!p)return;
      normalizePageLayers(p);
      var t=eraserTool;
      if(t==='hand'||e.button===1){
        e.preventDefault();pPanDrag={x:e.clientX,y:e.clientY,px:pPan.x,py:pPan.y};
        wrap.classList.add('is-panning');try{wrap.setPointerCapture(e.pointerId);}catch(_){}applyCursor();return;
      }
      if(t==='zoom'){
        e.preventDefault();toolDrag={kind:'zoom',x:e.clientX,y:e.clientY,z0:pZoom,pan0:{x:pPan.x,y:pPan.y},moved:false,out:e.altKey};
        try{wrap.setPointerCapture(e.pointerId);}catch(_){}return;
      }
      var raw=relFromEvent(e),inside=raw.x>=0&&raw.x<=1&&raw.y>=0&&raw.y<=1,pos=getRel(e);
      e.preventDefault();
      if(t==='text'){
        if(txtEdit){commitTextEdit();return;}
        if(!inside)return;
        if(compare){compare=false;$('#dsCompare').setAttribute('aria-pressed','false');schedulePreview();}
        startTextEdit(p,pos,hitText(p,pos.x,pos.y));return;
      }
      if(t==='move'){
        var moveLayer=getActiveLayer(p);if(moveLayer&&moveLayer.locked){toast(tr('আগে লেয়ার আনলক করুন','Unlock the layer first'));return;}
        var tfHandleEl=e.target.closest&&e.target.closest('[data-ds-tf-handle]');
        if(tfHandleEl){
          var tgt=getActiveTransformTarget(p);
          if(tgt&&tgt.bounds){
            if(tgt.kind==='text'&&tgt.layer&&!tgt.layer.locked){
              remember(p);
              toolDrag={kind:'tf-text',handle:tfHandleEl.dataset.dsTfHandle,it:tgt.layer,b0:copy(tgt.bounds),size0:Number(tgt.layer.size)||28,moved:false};
              try{wrap.setPointerCapture(e.pointerId);}catch(_){}return;
            }
            if(canEditInPlace(p)){
              toolDrag={kind:'tf-pix',handle:tfHandleEl.dataset.dsTfHandle,tgt:tgt,b0:copy(tgt.bounds),nb:copy(tgt.bounds),tfState:prepareTransformDrag(p,tgt),moved:false};
              try{wrap.setPointerCapture(e.pointerId);}catch(_){}return;
            }
          }
        }
        var th=hitText(p,pos.x,pos.y);
        if(th&&(autoSelectLayer||p.activeLayerId===th.id)){
          selectLayerById(th.id);remember(p);
          toolDrag={kind:'textmove',it:th,start:{x:raw.x,y:raw.y},ox:th.x,oy:th.y,moved:false};
          try{wrap.setPointerCapture(e.pointerId);}catch(_){}return;
        }
        if(selValid(p)){
          if(!canEditInPlace(p)){schedulePreview();return;}
          toolDrag={kind:'pixmove',start:{x:raw.x,y:raw.y},mv:prepareMove(p,null)};try{wrap.setPointerCapture(e.pointerId);}catch(_){}return;
        }
        if(autoSelectLayer){
          for(var li=p.erases.length-1;li>=0;li--){
            var cand=p.erases[li];
            if(!cand||cand.visible===false||cand.locked)continue;
            var cb=layerBounds(p,cand,canvas.width,canvas.height);
            if(cb&&pos.x*canvas.width>=cb.x0-6&&pos.x*canvas.width<=cb.x1+6&&pos.y*canvas.height>=cb.y0-6&&pos.y*canvas.height<=cb.y1+6){
              selectLayerById(cand.id);break;
            }
          }
        }
        var actL=getActiveLayer(p);
        if(actL&&actL.type==='text'&&!actL.locked){
          remember(p);toolDrag={kind:'textmove',it:actL,start:{x:raw.x,y:raw.y},ox:actL.x,oy:actL.y,moved:false};
          try{wrap.setPointerCapture(e.pointerId);}catch(_){}return;
        }
        if(actL&&actL.type==='layer'&&!actL.locked&&actL.ops&&actL.ops.length){
          if(!canEditInPlace(p)){schedulePreview();return;}
          toolDrag={kind:'pixmove',start:{x:raw.x,y:raw.y},mv:prepareMove(p,actL)};
          try{wrap.setPointerCapture(e.pointerId);}catch(_){}return;
        }
        status(tr('সরানোর জন্য আগে মার্কি/লেসো দিয়ে সিলেক্ট করুন অথবা লেয়ার/টেক্সটে ক্লিক করুন','Select with Marquee / Lasso or click a Layer / Text to move or transform'));return;
      }
      if(t==='marquee-rect'||t==='marquee-ellipse'){
        var cMode=resolveCombineMode(e);
        if(selValid(p)&&cMode==='new'&&pointInSel(retSel,pos.x,pos.y)){toolDrag={kind:'selmove',start:{x:raw.x,y:raw.y},moved:false};try{wrap.setPointerCapture(e.pointerId);}catch(_){}return;}
        selDraft={kind:t==='marquee-rect'?'rect':'ellipse',x0:pos.x,y0:pos.y,x1:pos.x,y1:pos.y,mode:cMode};
        if(marqueeStyle==='size'){
          var sw0=Math.min(1,marqueeW/Math.max(1,canvas.width)),sh0=Math.min(1,marqueeH/Math.max(1,canvas.height));
          selDraft.x0=clamp01(pos.x-sw0/2);selDraft.y0=clamp01(pos.y-sh0/2);
          selDraft.x1=clamp01(selDraft.x0+sw0);selDraft.y1=clamp01(selDraft.y0+sh0);
        }
        toolDrag={kind:'marquee',ax:pos.x,ay:pos.y,moved:marqueeStyle==='size',mode:cMode};try{wrap.setPointerCapture(e.pointerId);}catch(_){}renderSelection();return;
      }
      if(t==='lasso'){
        var lMode=resolveCombineMode(e);
        selDraft={kind:'poly',pts:[{x:pos.x,y:pos.y}],open:true,mode:lMode};toolDrag={kind:'lasso',mode:lMode};
        try{wrap.setPointerCapture(e.pointerId);}catch(_){}renderSelection();return;
      }
      if(t==='lasso-poly'){
        if(!polyDraft){polyDraft={pts:[{x:pos.x,y:pos.y}],hover:null,mode:resolveCombineMode(e)};renderSelection();return;}
        var f0=polyDraft.pts[0],lst=polyDraft.pts[polyDraft.pts.length-1];
        if(polyDraft.pts.length>=3&&Math.hypot((pos.x-f0.x)*raw.r.width,(pos.y-f0.y)*raw.r.height)<9){closePoly();return;}
        if(Math.hypot((pos.x-lst.x)*raw.r.width,(pos.y-lst.y)*raw.r.height)>2)polyDraft.pts.push({x:pos.x,y:pos.y});
        renderSelection();return;
      }
      if(t==='picker'||(e.altKey&&(t==='brush'||t==='heal'))){
        if(!inside)return;
        var picked=sampleCanvasColor(canvas,pos.x,pos.y,2);
        setEraserColor(picked.hex,true);
        if(txtEdit)applyTextOption('color',picked.hex);
        return;
      }
      if(t==='clone'&&e.altKey){
        if(!inside)return;
        cloneSrc={x:pos.x,y:pos.y,pid:p.id};cloneOffset=null;updateCloneInfo();
        toast(tr('ক্লোন সোর্স সেট হয়েছে — এবার যেখানে কপি করতে চান সেখানে আঁকুন','Clone source set — now paint where you want to copy it'));return;
      }
      if(!isPaintTool(t)||!inside)return;
      if(compare){compare=false;$('#dsCompare').setAttribute('aria-pressed','false');schedulePreview();return;}
      if(t==='clone'){
        if(!cloneSrc||cloneSrc.pid!==p.id){toast(tr('আগে Alt+ক্লিক করে ক্লোন সোর্স ঠিক করুন','Alt+Click first to define a clone source'));return;}
        if(!cloneOffset)cloneOffset={x:cloneSrc.x-pos.x,y:cloneSrc.y-pos.y};
      }
      remember(p);
      var targetLayer=ensurePaintLayer(p);
      var pts=(e.shiftKey&&lastBrushPt)?[lastBrushPt,{x:pos.x,y:pos.y}]:[{x:pos.x,y:pos.y}];
      var item={
        type:t==='brush'?'stroke':t,
        size:(eraserSize/2)/1000,
        hardness:eraserHardness/100,
        opacity:eraserOpacity/100,
        flow:eraserFlow/100,
        mode:eraserMode||'normal',
        sample:healSample||'below',
        color:eraserColor,
        pts:pts
      };
      if(t==='clone'){item.ox=cloneOffset.x;item.oy=cloneOffset.y;}
      if(t==='dodge'||t==='burn')item.range=dodgeRange;
      if(selValid(p))item.sel=selForOp();
      eraserStroke=item;
      targetLayer.ops.push(item);
      livePaint=startLivePaint(p,item,targetLayer);
      updateEraserCursor(false);
      paintSegmentOnCanvas(pts[0],pts[pts.length-1]);
      if(t==='clone')placeCloneMark(pos);
      lastBrushPt={x:pos.x,y:pos.y};
      try{wrap.setPointerCapture(e.pointerId);}catch(_){}
    });
    function finishPointer(e){
      if(e&&e.pointerId!=null){try{if(wrap.hasPointerCapture(e.pointerId))wrap.releasePointerCapture(e.pointerId);}catch(_){}}
      if(pPanDrag){pPanDrag=null;wrap.classList.remove('is-panning');applyCursor();return;}
      var p=current();
      if(toolDrag){
        var d=toolDrag;toolDrag=null;
        if(d.kind==='zoom'){if(!d.moved)stepZoom((d.out||(e&&e.altKey))?-1:1,d.x,d.y);return;}
        if(d.kind==='marquee'){
          var s=selDraft;selDraft=null;
          if(!p||!s||!d.moved||Math.abs(s.x1-s.x0)*canvas.width<2||Math.abs(s.y1-s.y0)*canvas.height<2){
            if((d.mode||'new')==='new')retSel=null;
          }else{
            combineSelectionShape(p,{kind:s.kind,x0:clamp01(Math.min(s.x0,s.x1)),y0:clamp01(Math.min(s.y0,s.y1)),x1:clamp01(Math.max(s.x0,s.x1)),y1:clamp01(Math.max(s.y0,s.y1))},d.mode||'new');
          }
          renderSelection();return;
        }
        if(d.kind==='lasso'){
          var s2=selDraft;selDraft=null;
          if(p&&s2&&s2.pts.length>=3)combineSelectionShape(p,{kind:'poly',pts:s2.pts},d.mode||'new');
          else if((d.mode||'new')==='new')retSel=null;
          renderSelection();return;
        }
        if(d.kind==='selmove'){if(d.moved&&retSel)offsetSel(retSel,selShift.x,selShift.y);selShift={x:0,y:0};renderSelection();return;}
        if(d.kind==='textmove'||d.kind==='tf-text'){if(!p)return;if(!d.moved){p.undo.pop();}else{p.revision++;updateControls();refreshThumbSoon(p);}renderTextOverlay();renderLayersList();renderTransformBox();return;}
        if(d.kind==='tf-pix'){
          if(p&&d.moved&&d.nb){
            var wTf=canvas.width,hTf=canvas.height,b0Tf=d.b0,nbTf=d.nb;
            remember(p);
            var tfOp={type:'transform',sx0:b0Tf.x0/wTf,sy0:b0Tf.y0/hTf,sx1:b0Tf.x1/wTf,sy1:b0Tf.y1/hTf,dx0:nbTf.x0/wTf,dy0:nbTf.y0/hTf,dx1:nbTf.x1/wTf,dy1:nbTf.y1/hTf,clearSrc:true,bgColor:eraserColor};
            if(d.tgt&&d.tgt.kind==='layer'&&d.tgt.layer)d.tgt.layer.ops.push(tfOp);else{tfOp.sel=selForOp();applySelectionTransform(p,tfOp);}
            if(d.tgt&&d.tgt.kind==='sel'&&retSel){
              scaleSelection(retSel,{x0:tfOp.sx0,y0:tfOp.sy0,x1:tfOp.sx1,y1:tfOp.sy1},{x0:tfOp.dx0,y0:tfOp.dy0,x1:tfOp.dx1,y1:tfOp.dy1});
            }
            refreshCanvasFromLayers(p);
          }
          renderSelection();return;
        }
        if(d.kind==='pixmove'){
          var mv=d.mv;if(mv.raf){cancelAnimationFrame(mv.raf);mv.raf=0;}
          selShift={x:0,y:0};
          if(p&&(mv.dx||mv.dy)){
            renderPixMove(mv);
            remember(p);
            if(mv.isLayer&&mv.layer){
              mv.layer.ops.push({type:'movesel',sel:{kind:'rect',x0:0,y0:0,x1:1,y1:1},dx:mv.dx/mv.w,dy:mv.dy/mv.h,clearBg:false});
            }else{
              applySelectionTransform(p,{type:'movesel',sel:selForOp(),dx:mv.dx/mv.w,dy:mv.dy/mv.h,color:eraserColor});
              offsetSel(retSel,mv.dx/mv.w,mv.dy/mv.h);
            }
            refreshCanvasFromLayers(p);
          }
          renderSelection();return;
        }
        return;
      }
      if(!eraserStroke)return;
      eraserStroke=null;livePaint=null;hideCloneMark();
      if(p){p.revision++;cachePagePreview(p);renderLayersList();renderTransformBox();updateControls();refreshThumbSoon(p);}
    }
    wrap.addEventListener('pointerup',finishPointer);
    wrap.addEventListener('pointercancel',finishPointer);
    window.addEventListener('pointerup',finishPointer);
    wrap.addEventListener('dblclick',function(e){
      if(!eraserActive)return;
      if(eraserTool==='hand'){fitPreview();return;}
      if(eraserTool==='zoom'){actualPixels();return;}
      if(eraserTool==='lasso-poly'&&polyDraft){e.preventDefault();closePoly();return;}
      if(eraserTool==='move'){
        var p=current();if(!p)return;
        var pos=getRel(e),th=hitText(p,pos.x,pos.y);
        if(th){e.preventDefault();setEraserTool('text');startTextEdit(p,pos,th);}
      }
    });
    wrap.addEventListener('contextmenu',function(e){if(eraserActive&&!compare){e.preventDefault();showSelectionMenu(e.clientX,e.clientY);}});
    if(stage){
      stage.addEventListener('wheel',function(e){
        if(!current()||(!eraserActive&&!e.ctrlKey&&!e.altKey))return;
        if(e.target.closest&&e.target.closest('#dsPsDock'))return;
        e.preventDefault();
        if(e.ctrlKey||e.altKey||e.metaKey||!eraserActive){
          var pinch=e.ctrlKey&&Math.abs(e.deltaY)<40&&!Number.isInteger(e.deltaY);
          setPreviewZoom(pZoom*Math.exp(-e.deltaY*(pinch?.01:.0022)),e.clientX,e.clientY);return;
        }
        var dx=e.shiftKey?(e.deltaY||e.deltaX):e.deltaX,dy=e.shiftKey?0:e.deltaY;
        pPan.x-=dx;pPan.y-=dy;syncPreviewPlane();
      },{passive:false});
    }
    function restoreTempTool(){if(tempToolPrev!==null){var back=tempToolPrev;tempToolPrev=null;setEraserTool(back);}}
    function setTempTool(t){if(tempToolPrev===null)tempToolPrev=eraserTool;if(eraserTool!==t)setEraserTool(t);}
    document.addEventListener('keydown',function(e){
      if(!eraserActive||root.hidden||busy||root.querySelector('dialog[open]'))return;
      if(e.target&&e.target.closest&&e.target.closest('input,textarea,select,[contenteditable=true]'))return;
      var k=(e.key||'').toLowerCase(),mod=e.ctrlKey||e.metaKey;
      if(e.key==='Alt'){e.preventDefault();if(!altDown){altDown=true;applyCursor();updateEraserCursor();}return;}
      if(e.code==='Space'){
        e.preventDefault();e.stopPropagation();spaceHeld=true;
        setTempTool((mod||e.altKey)?'zoom':'hand');return;
      }
      if(e.key==='Control'||e.key==='Meta'){if(spaceHeld&&tempToolPrev!==null)setEraserTool('zoom');return;}
      if(mod){
        if(k==='d'){e.preventDefault();e.stopPropagation();deselect();return;}
        if(k==='a'){e.preventDefault();e.stopPropagation();selectAll();return;}
        if(k==='i'&&e.shiftKey){e.preventDefault();e.stopPropagation();invertSel();return;}
        if(k==='j'){e.preventDefault();e.stopPropagation();if(selValid(current()))selectionToLayer(e.shiftKey);else handleLayerAction('dup');return;}
        if(k==='c'||k==='x'){if(selValid(current())){e.preventDefault();copySelection(k==='x');}return;}
        if(k==='v'&&selectionClipboard){e.preventDefault();pasteSelection();return;}
        if(k==='t'){e.preventDefault();setEraserTool('move');showTransformControls=true;renderTransformBox();return;}
        if(k==='e'){e.preventDefault();e.stopPropagation();handleLayerAction('merge');return;}
        if(k==='0'){e.preventDefault();e.stopPropagation();fitPreview();return;}
        if(k==='1'){e.preventDefault();e.stopPropagation();actualPixels();return;}
        if(k==='='||k==='+'){e.preventDefault();e.stopPropagation();stepZoom(1);return;}
        if(k==='-'||k==='_'){e.preventDefault();e.stopPropagation();stepZoom(-1);return;}
        return;
      }
      if(e.key==='Delete'||e.key==='Backspace'){
        e.preventDefault();e.stopPropagation();
        if(eraserTool==='lasso-poly'&&polyDraft&&e.key==='Backspace'){polyDraft.pts.pop();if(!polyDraft.pts.length)polyDraft=null;renderSelection();return;}
        var pd=current();
        if(selValid(pd)){fillSelection();return;}
        if(eraserTool==='move'&&pd&&pd.activeLayerId&&pd.activeLayerId!=='bg'){handleLayerAction('del');}
        return;
      }
      if(e.key==='Escape'){if(polyDraft){cancelPolyDraft();e.preventDefault();}else if(toolDrag&&toolDrag.kind==='marquee'){selDraft=null;toolDrag=null;renderSelection();}return;}
      if(e.key==='Enter'){if(polyDraft){e.preventDefault();closePoly();}return;}
      if(eraserTool==='move'&&e.key.indexOf('Arrow')===0){
        e.preventDefault();e.stopPropagation();
        var st=e.shiftKey?10:1,ax=e.key==='ArrowLeft'?-st:e.key==='ArrowRight'?st:0,ay=e.key==='ArrowUp'?-st:e.key==='ArrowDown'?st:0;
        var pm=current();
        if(selValid(pm)){nudgeSelection(ax,ay);return;}
        var actM=getActiveLayer(pm);
        if(actM&&!actM.locked){
          remember(pm);
          if(actM.type==='text'){actM.x+=ax/canvas.width;actM.y+=ay/canvas.height;pm.revision++;renderTextOverlay();renderLayersList();renderTransformBox();refreshThumbSoon(pm);}
          else if(actM.type==='layer'){actM.ops.push({type:'movesel',sel:{kind:'rect',x0:0,y0:0,x1:1,y1:1},dx:ax/canvas.width,dy:ay/canvas.height,clearBg:false});refreshCanvasFromLayers(pm);}
        }
        return;
      }
      if(e.code==='BracketLeft'||e.code==='BracketRight'){
        e.preventDefault();var up=e.code==='BracketRight';
        if(e.shiftKey)setHardness(eraserHardness+(up?25:-25));
        else{var step=eraserSize>=60?8:eraserSize>=24?4:eraserSize>=10?2:1;setSize(eraserSize+(up?step:-step));}
        return;
      }
      if(/^[0-9]$/.test(e.key)&&isPaintTool(eraserTool)&&!e.altKey){e.preventDefault();setOpacity(e.key==='0'?100:Number(e.key)*10);return;}
      var list=KEY_TOOLS[k];
      if(list&&!e.altKey){
        e.preventDefault();e.stopPropagation();
        var g=TOOL_META[list[0]].g,curT=groupCur[g]||list[0];
        if(e.shiftKey&&list.length>1)curT=list[(list.indexOf(curT)+1)%list.length];
        tempToolPrev=null;setEraserTool(curT);
      }
    },true);
    document.addEventListener('keyup',function(e){
      if(e.key==='Alt'){altDown=false;applyCursor();updateEraserCursor();if(eraserActive)e.preventDefault();}
      if(e.code==='Space'){spaceHeld=false;if(eraserActive)restoreTempTool();}
      if((e.key==='Control'||e.key==='Meta')&&spaceHeld&&tempToolPrev!==null&&eraserTool==='zoom')setEraserTool('hand');
    },true);
    window.addEventListener('blur',function(){altDown=false;spaceHeld=false;if(eraserActive){restoreTempTool();applyCursor();}});
  }
  var wheelSaveTimer=null,wheelRememberedPage=null;
  root.addEventListener('wheel',function(e){
    var pod=e.target.closest('[data-ds-adj-pod]');
    var inp=pod?pod.querySelector('input[type="range"]'):e.target.closest('input.ds-btn-slider');
    if(!inp){
      var retWrap=e.target.closest('#dsEraserBar .relative');
      if(retWrap)inp=retWrap.querySelector('input.ds-btn-slider');
    }
    if(!inp||inp.disabled||busy)return;
    e.preventDefault();
    e.stopPropagation();
    var dir=e.deltaY<0?1:(e.deltaY>0?-1:0);
    if(!dir)return;
    var step=Number(inp.step)||1;
    if(e.shiftKey)step*=5;
    else if(step===1&&(Number(inp.max)-Number(inp.min))>=80)step=2;
    var mn=Number(inp.min),mx=Number(inp.max),curVal=Number(inp.value);
    var nextVal=Math.max(mn,Math.min(mx,Number((curVal+dir*step).toFixed(2))));
    if(nextVal===curVal)return;
    if(pod){
      var p=current();
      if(!p)return;
      if(wheelRememberedPage!==p.id){
        remember(p);
        wheelRememberedPage=p.id;
      }
      clearTimeout(wheelSaveTimer);
      wheelSaveTimer=setTimeout(function(){wheelRememberedPage=null;},600);
      var key=pod.dataset.dsAdjPod;
      inp.value=String(nextVal);
      applySetting(key,nextVal,false);
    }else{
      inp.value=String(nextVal);
      inp.dispatchEvent(new Event('input',{bubbles:true}));
    }
  },{passive:false});
  root.addEventListener('ds:langchange',function(){
    renderList();updateControls();
    var label=$('#dsPsActiveToolLabel b');if(label)label.textContent=toolName(eraserTool);
    var opl=$('#dsBrushOpacityLbl');if(opl)opl.textContent=(eraserTool==='dodge'||eraserTool==='burn')?tr('এক্সপোজার','Exposure'):tr('অপাসিটি','Opacity');
    updateCloneInfo();
    var p=current();
    if(p)schedulePreview();
    else status(tr('শুরু করতে ডকুমেন্টের ছবি যোগ করুন','Add document images to begin scanning'));
  });
  var SCAN_I18N={
    bn:{
      brandTitle:'TechHat Studio',brandSub:'ডকুমেন্ট স্ক্যানার ও এডিটর',localBadge:'১০০% অফলাইন · আপনার ডিভাইসেই প্রসেস হয়',
      cameraBtn:'ক্যামেরা',cameraTip:'সরাসরি ক্যামেরা দিয়ে ডকুমেন্ট স্ক্যান করুন',addPageBtn:'পেজ যোগ',addPageTip:'নতুন পেজ বা ছবি যোগ করুন',newScanBtn:'নতুন',newScanTip:'সব পেজ সরিয়ে নতুন স্ক্যান শুরু করুন',
      navPages:'পেজগুলো',navCanvas:'ক্যানভাস',navInspector:'ইন্সপেক্টর ও এক্সপোর্ট',
      pagesTitle:'পেজগুলো',dragHint:'টেনে সাজান',addMoreBtn:'পেজ যোগ করুন',addMoreSub:'JPG, PNG, WebP · একসাথে ৬০টি পর্যন্ত পেজ',pageWord:'পেজ',moveUpTip:'আগে নিন',moveDownTip:'পরে নিন',deletePageTip:'এই পেজ সরান',closeDrawerTip:'বন্ধ করুন',
      sidebarToggleTip:'পেজ সাইডবার দেখান বা লুকান',autoDetectBtn:'অটো ডিটেক্ট',autoDetectTip:'স্বয়ংক্রিয়ভাবে ডকুমেন্টের চার কোণা শনাক্ত করুন',fullImageBtn:'পুরো ছবি',fullImageTip:'পুরো ছবি নির্বাচন করুন',rotateLeftBtn:'বামে',rotateLeftTip:'বামে ৯০° ঘোরান',rotateRightBtn:'ডানে',rotateRightTip:'ডানে ৯০° ঘোরান',retouchBtn:'দাগ ও ব্যাকগ্রাউন্ড মুছুন',retouchShortBtn:'রিটাচ স্টুডিও',retouchTip:'ফটোশপ-স্টাইল রিটাচ, স্পট হিলিং ও ব্যাকগ্রাউন্ড কালার পিকার',undoBtn:'পূর্বাবস্থা',undoTip:'আগের পরিবর্তন (Ctrl+Z)',redoBtn:'পুনরায়',redoTip:'পুনরায় (Ctrl+Y)',viewCrop:'ক্রপ',viewSplit:'পাশাপাশি',viewPreview:'প্রিভিউ',inspectorBtn:'ইন্সপেক্টর',
      emptyEyebrow:'TECHHAT DOCUMENT STUDIO',emptyTitle:'প্রফেশনাল ডকুমেন্ট স্ক্যানার ও এডিটর',emptyDesc:'ডকুমেন্ট, সার্টিফিকেট, রসিদ বা বইয়ের পাতার ছবি যোগ করুন। অটো ক্রপ, বাঁকা লাইন সোজা, শ্যাডো রিমুভ ও রিটাচ করে প্রিন্ট-রেডি PDF তৈরি করুন।',choosePhotosBtn:'ইমেজ ইমপোর্ট',openCameraBtn:'স্মার্ট স্ক্যান',smartScanBtn:'স্মার্ট স্ক্যান',importImagesBtn:'ইমেজ ইমপোর্ট',importFilesBtn:'ফাইল ইমপোর্ট',pasteBtn:'পেস্ট (Ctrl+V)',dropPasteHero:'এখানে ফাইল Drag & Drop বা Paste (Ctrl+V) করুন, অথবা ক্লিক করে আপলোড করুন',dropPasteHint:'এখানে ফাইল Drag & Drop বা Paste (Ctrl+V) করুন, অথবা ক্লিক করে আপলোড করুন',featAutoCrop:'স্মার্ট ৪-কোণা অটো ক্রপ',featDewarp:'অটো লাইন ডি-ওয়ার্প',featMagic:'ম্যাজিক+ শ্যাডো ও স্পট ক্লিনার',featPdf:'মাল্টিপেজ A4 PDF',
      cropCaption:'মূল ছবি ও পার্সপেক্টিভ ক্রপ',cropSubCaption:'চার কোণা বা চার পাশের হ্যান্ডেল টেনে সীমানা ঠিক করুন',previewCaption:'স্ক্যান প্রিভিউ',magicGenLbl:'ম্যাজিক প্রিভিউ তৈরি হচ্ছে…',previewDoneLbl:'✓ সম্পন্ন',
      corners:['উপরের বাম কোণা','উপরের ডান কোণা','নিচের ডান কোণা','নিচের বাম কোণা'],edges:['উপরের ধার','ডান ধার','নিচের ধার','বাম ধার'],
      tools:{brush:'ব্রাশ টুল',heal:'স্পট হিলিং',wand:'ম্যাজিক ইরেজার',rect:'বক্স ফিল',picker:'কালার পিকার',hand:'হ্যান্ড প্যান'},
      dockLabels:{brush:'ব্রাশ',heal:'হিলিং',wand:'ম্যাজিক',rect:'বক্স ফিল',picker:'পিকার',hand:'প্যান'},
      pickerBtn:'পিকার',autoPaperBtn:'অটো পেপার',sizeLbl:'সাইজ',hardnessLbl:'হার্ডনেস',toleranceLbl:'টলারেন্স',opacityLbl:'অপাসিটি',borderTrimBtn:'বর্ডার ট্রিম',resetAllRetouchBtn:'সব রিসেট',doneBtn:'✕ সম্পন্ন',eraserHint:'💡 B ব্রাশ · J স্পট হিলিং · W ম্যাজিক ইরেজার · M বক্স ফিল · I কালার পিকার (বা Alt+Click) · Shift ধরে সোজা লাইন · Ctrl+Wheel প্রিভিউ জুম',
      compareBtn:'মূল ছবি তুলনা',compareTip:'স্ক্যানের আগের ও পরের অবস্থা তুলনা করুন',shortcutsHint:'Ctrl ± জুম · Space প্যান',statusInitial:'শুরু করতে ডকুমেন্টের ছবি যোগ করুন',
      inspectorTitle:'ইন্সপেক্টর ও এনহ্যান্স',resetBtn:'সব রিসেট',resetCropBtn:'ক্রপ রিসেট',resetCropTip:'ক্রপ ও রোটেশন রিসেট করুন',resetFilterTip:'ফিল্টার রিসেট করুন (ম্যাজিক+)',resetSmartTip:'স্মার্ট ফিক্স রিসেট করুন',resetManualTip:'সব ম্যানুয়াল এডজাস্টমেন্ট রিসেট করুন',resetExportTip:'এক্সপোর্ট সেটিংস রিসেট করুন',resetToolTip:'ডিফল্ট মানে রিসেট করুন',resetRetouchParamsTip:'টুল সেটিংস রিসেট করুন',accFiltersTitle:'AI ও কালার ফিল্টার',accFiltersBadge:'প্রিসেট',
      presets:[
        {value:'magic_plus',title:'ম্যাজিক+',desc:'সাদা পেজ · স্পষ্ট লেখা'},
        {value:'auto',title:'অটো এনহ্যান্স',desc:'পরিষ্কার ও স্বাভাবিক'},
        {value:'original',title:'অরিজিনাল',desc:'মূল রঙ ও ছবি'},
        {value:'color',title:'কালার স্ক্যান',desc:'রঙিন ডকুমেন্ট'},
        {value:'shadow',title:'শ্যাডো ফিক্স',desc:'অসম আলো সংশোধন'},
        {value:'gray',title:'গ্রেস্কেল',desc:'নরম সাদাকালো'},
        {value:'bw',title:'সাদা-কালো',desc:'লেখা ও ফটোকপি'}
      ],
      accSmartTitle:'স্মার্ট ফিক্স ও ক্লিনআপ',accSmartBadge:'অটো',optShadow:'শ্যাডো রিমুভ',optText:'লেখা গাঢ় ও স্পষ্ট',optStraighten:'অটো লাইন সোজা',optCleanSpots:'ছিটেফোঁটা দাগ পরিষ্কার',optCleanMargins:'বর্ডার ফ্রেম সাদা',cleanMarginsHint:'চার পাশের বাইরের বর্ডার নিশ্চিত হলে তার বাইরের অংশ সাদা করে। সেখানে লেখা থাকলে বন্ধ রাখুন।',launchRetouchBtn:'রিটাচ ও কালার পিকার',
      accManualTitle:'ম্যানুয়াল এডজাস্টমেন্ট',accManualBadge:'লাইভ স্লাইডার',lblBrightness:'উজ্জ্বলতা',lblContrast:'কনট্রাস্ট',lblSharpness:'শার্পনেস',lblAngle:'সূক্ষ্ম কোণ',lblCurve:'বইয়ের বাঁক (Curve)',lblCurveHint:'বাঁকানো লাইনের জন্য হাতে সমন্বয় করুন',lblTrim:'বর্ডার ট্রিম (Trim)',lblTrimHint:'বাইরের বাড়তি ব্যাকগ্রাউন্ড স্লিম ট্রিম করে পরিষ্কার করুন',applyAllBtn:'সব পেজে প্রয়োগ',
      accExportTitle:'পেজ সেটআপ ও এক্সপোর্ট',accExportBadge:'A4 · 300 DPI',lblFilename:'ফাইলের নাম',lblPaperSize:'পেজ সাইজ',paperA4:'A4 (210 × 297 mm)',paperLetter:'Letter',paperOrig:'স্ক্যানের অনুপাত',lblQuality:'রেজোলিউশন',qualHigh:'হাই · 3000px',qualBalanced:'ব্যালান্সড · 2200px',qualSmall:'ছোট · 1400px',lblMargin:'প্রিন্ট মার্জিন',lblDatasetMode:'ডেটাসেট মোড',learnedPrefix:'শেখা উদাহরণ: ',
      downloadPdfBtn:'PDF ডাউনলোড',downloadJpgBtn:'JPG',downloadPngBtn:'PNG',downloadZipBtn:'সব ZIP',printBtn:'প্রিন্ট',printTip:'সরাসরি প্রিন্টার দিয়ে প্রিন্ট করুন (Ctrl+P)',
      camDialogTitle:'ডকুমেন্ট ক্যামেরা',camDialogHint:'পুরো পেজ ফ্রেমের মধ্যে রেখে ছবি তুলুন। পরে চার কোণা ঠিক করতে পারবেন।',camSwitchBtn:'ক্যামেরা বদলান',camCaptureBtn:'ছবি তুলুন ও যোগ করুন',resetDialogTitle:'নতুন ডকুমেন্ট শুরু করবেন?',resetDialogDesc:'বর্তমান পেজগুলো সরিয়ে দেওয়া হবে। প্রয়োজন হলে আগে PDF ডাউনলোড করুন।',cancelBtn:'ফিরে যান',confirmResetBtn:'নতুন শুরু করুন'
    },
    en:{
      brandTitle:'TechHat Studio',brandSub:'Document Scanner & Editor',localBadge:'100% Offline · Processed Locally on Device',
      cameraBtn:'Camera',cameraTip:'Scan document directly using camera',addPageBtn:'Add Pages',addPageTip:'Add new pages or images',newScanBtn:'New',newScanTip:'Clear all pages and start a new scan',
      navPages:'Pages',navCanvas:'Canvas',navInspector:'Inspector & Export',
      pagesTitle:'Pages',dragHint:'Drag to reorder',addMoreBtn:'Add Pages',addMoreSub:'JPG, PNG, WebP · Up to 60 pages',pageWord:'Page',moveUpTip:'Move Up',moveDownTip:'Move Down',deletePageTip:'Delete Page',closeDrawerTip:'Close panel',
      sidebarToggleTip:'Show or hide Pages sidebar',autoDetectBtn:'Auto Detect',autoDetectTip:'Automatically detect document corners & orientation',fullImageBtn:'Full Image',fullImageTip:'Select full image bounds',rotateLeftBtn:'Left',rotateLeftTip:'Rotate 90° Counter-Clockwise',rotateRightBtn:'Right',rotateRightTip:'Rotate 90° Clockwise',retouchBtn:'Spot & Background Retouch',retouchShortBtn:'Retouch Studio',retouchTip:'Photoshop-style Retouch, Spot Healing & Background Color Picker',undoBtn:'Undo',undoTip:'Undo last change (Ctrl+Z)',redoBtn:'Redo',redoTip:'Redo change (Ctrl+Y)',viewCrop:'Crop',viewSplit:'Split View',viewPreview:'Preview',inspectorBtn:'Inspector',
      emptyEyebrow:'TECHHAT DOCUMENT STUDIO',emptyTitle:'Professional Document Scanner & Retouch Studio',emptyDesc:'Drop document photos, certificates, receipts, or book pages. Auto-crop, straighten bowed lines, remove shadows, retouch spots, and export print-ready PDFs.',choosePhotosBtn:'Import Images',openCameraBtn:'Smart Scan',smartScanBtn:'Smart Scan',importImagesBtn:'Import Images',importFilesBtn:'Import Files',pasteBtn:'Paste (Ctrl+V)',dropPasteHero:'Drag and drop or paste (Ctrl+V) files here, or click to upload',dropPasteHint:'Drag and drop or paste (Ctrl+V) files here, or click to upload',featAutoCrop:'Smart 4-Corner Auto Crop',featDewarp:'Auto Line Dewarping',featMagic:'Magic+ Shadow & Spot Cleaner',featPdf:'Multipage A4 PDF Export',
      cropCaption:'Source & Perspective Crop',cropSubCaption:'Drag corner or edge handles to refine document bounds',previewCaption:'Enhanced Scan Preview',magicGenLbl:'Generating Magic Preview…',previewDoneLbl:'✓ Ready',
      corners:['Top-Left Corner','Top-Right Corner','Bottom-Right Corner','Bottom-Left Corner'],edges:['Top Edge','Right Edge','Bottom Edge','Left Edge'],
      tools:{brush:'Brush Tool',heal:'Spot Healing',wand:'Magic Eraser',rect:'Rectangle Fill',picker:'Color Picker',hand:'Hand Pan'},
      dockLabels:{brush:'Brush',heal:'Heal',wand:'Magic',rect:'Box Fill',picker:'Picker',hand:'Pan'},
      pickerBtn:'Picker',autoPaperBtn:'Auto Paper',sizeLbl:'Size',hardnessLbl:'Hardness',toleranceLbl:'Tolerance',opacityLbl:'Opacity',borderTrimBtn:'Border Trim',resetAllRetouchBtn:'Reset All',doneBtn:'✕ Done',eraserHint:'💡 B Brush · J Spot Heal · W Magic Eraser · M Box Fill · I Eyedropper (or Alt+Click) · Shift+Click straight line · Ctrl+Wheel zoom',
      compareBtn:'Compare Original',compareTip:'Compare Before / After enhancement',shortcutsHint:'Ctrl ± Zoom · Space Pan',statusInitial:'Add document images to begin scanning',
      inspectorTitle:'Inspector & Enhance',resetBtn:'Reset All',resetCropBtn:'Reset Crop',resetCropTip:'Reset Crop & Rotation to default',resetFilterTip:'Reset Filter (Magic+ AI)',resetSmartTip:'Reset Smart Fix options',resetManualTip:'Reset all Manual Adjustments',resetExportTip:'Reset Export Settings',resetToolTip:'Reset to default value',resetRetouchParamsTip:'Reset Retouch Tool Settings',accFiltersTitle:'AI & Scan Filters',accFiltersBadge:'Presets',
      presets:[
        {value:'magic_plus',title:'Magic+ AI',desc:'Pure White Page · Crisp Ink'},
        {value:'auto',title:'Auto Enhance',desc:'Clean & Natural'},
        {value:'original',title:'Original',desc:'True Color & Unfiltered'},
        {value:'color',title:'Color Scan',desc:'Vibrant Stamps & Seals'},
        {value:'shadow',title:'Shadow Fix',desc:'Flatten Uneven Lighting'},
        {value:'gray',title:'Grayscale',desc:'Smooth Monochrome'},
        {value:'bw',title:'B&W Text',desc:'High-Contrast Photocopy'}
      ],
      accSmartTitle:'Smart Fix & Cleanup',accSmartBadge:'Auto',optShadow:'Remove Shadows',optText:'Crisp Dark Text',optStraighten:'Auto Straighten',optCleanSpots:'Clean Specks',optCleanMargins:'Whiten Margins',cleanMarginsHint:'Clears outside a confident 4-sided border frame. Turn off if margin notes exist outside the border.',launchRetouchBtn:'Retouch & Color Picker',
      accManualTitle:'Manual Adjustments',accManualBadge:'Live Sliders',lblBrightness:'Brightness',lblContrast:'Contrast',lblSharpness:'Sharpness',lblAngle:'Fine Angle',lblCurve:'Book Curve',lblCurveHint:'Manually flatten curved book pages',lblTrim:'Border Trim',lblTrimHint:'Trim outer edges with background color',applyAllBtn:'Apply to All Pages',
      accExportTitle:'Page Setup & Export',accExportBadge:'A4 · 300 DPI',lblFilename:'File Name',lblPaperSize:'Page Size',paperA4:'A4 (210 × 297 mm)',paperLetter:'Letter',paperOrig:'Original Aspect',lblQuality:'Resolution',qualHigh:'High · 3000px',qualBalanced:'Balanced · 2200px',qualSmall:'Compact · 1400px',lblMargin:'Print Margins',lblDatasetMode:'Dataset Split',learnedPrefix:'Learned Samples: ',
      downloadPdfBtn:'Download PDF',downloadJpgBtn:'JPG',downloadPngBtn:'PNG',downloadZipBtn:'All ZIP',printBtn:'Print',printTip:'Print scanned document directly (Ctrl+P)',
      camDialogTitle:'Document Camera',camDialogHint:'Align the full page inside the guide frame. You can adjust corners afterward.',camSwitchBtn:'Switch Camera',camCaptureBtn:'Capture & Add Page',resetDialogTitle:'Start a New Document?',resetDialogDesc:'All current pages will be cleared. Download your PDF first if needed.',cancelBtn:'Cancel',confirmResetBtn:'Start New'
    }
  };
  function applyScannerLang(lang){
    var clean=(lang==='bn'||lang==='en')?lang:'en';
    var dict=SCAN_I18N[clean]||SCAN_I18N.en;
    root.dataset.lang=clean;
    $$('[data-i18n]').forEach(function(el){
      var k=el.getAttribute('data-i18n');
      if(k&&typeof dict[k]==='string')el.textContent=dict[k];
    });
    $$('[data-i18n-title]').forEach(function(el){
      var k=el.getAttribute('data-i18n-title');
      if(k&&typeof dict[k]==='string'){
        el.dataset.dsTip=dict[k];el.removeAttribute('title');
        if(el.hasAttribute('aria-label'))el.setAttribute('aria-label',dict[k]);
      }
    });
    $$('[data-i18n-dock]').forEach(function(el){
      var k=el.getAttribute('data-i18n-dock');
      if(k&&dict.dockLabels&&dict.dockLabels[k])el.textContent=dict.dockLabels[k];
    });
    $$('[data-ds-tool]').forEach(function(el){
      var k=el.getAttribute('data-ds-tool');
      var sc={brush:'B',heal:'J',wand:'W',rect:'M',picker:'I',hand:'H'}[k];
      if(k&&dict.tools&&dict.tools[k]){var tl=dict.tools[k]+(sc?' ('+sc+')':'');el.dataset.dsTip=tl;el.removeAttribute('title');}
    });
    if(Array.isArray(dict.presets)){
      dict.presets.forEach(function(p){
        var b=root.querySelector('[data-i18n-preset-title="'+p.value+'"]');
        var s=root.querySelector('[data-i18n-preset-desc="'+p.value+'"]');
        if(b)b.textContent=p.title;
        if(s)s.textContent=p.desc;
      });
    }
    if(Array.isArray(dict.corners)){
      $$('[data-ds-corner]').forEach(function(b,i){
        if(dict.corners[i]){b.title=dict.corners[i];b.setAttribute('aria-label',dict.corners[i]);}
      });
    }
    if(Array.isArray(dict.edges)){
      $$('[data-ds-edge]').forEach(function(b,i){
        if(dict.edges[i]){b.title=dict.edges[i];b.setAttribute('aria-label',dict.edges[i]);}
      });
    }
    root.dispatchEvent(new CustomEvent('ds:langchange',{detail:{lang:clean}}));
  }
  window.addEventListener('th:langchange',function(e){
    var l=e&&e.detail&&e.detail.lang;
    if(l==='en'||l==='bn')applyScannerLang(l);
  });
  function getTipLabel(el){
    if(!el)return '';
    if(el.hasAttribute('title')){var raw=el.getAttribute('title');if(raw)el.dataset.dsTip=raw;el.removeAttribute('title');}
    var tip=el.dataset.dsTip||'';
    var sr=el.querySelector(':scope > .sr-only');
    var srText=sr&&sr.textContent?sr.textContent.trim():'';
    if(srText){
      var scMatch=tip.match(/\(([^)]+)\)\s*$/);
      if(scMatch&&srText.indexOf(scMatch[0])===-1)return srText+' '+scMatch[0];
      return srText;
    }
    return tip;
  }
  function installHoverTooltip(){
    var tipEl=$('#dsHoverTooltip'),activeTipTarget=null,tipTimer=0,tipSuppressed=false;
    if(!tipEl)return;
    $$('[title]').forEach(function(el){
      var raw=el.getAttribute('title');
      if(raw)el.dataset.dsTip=raw;
      el.removeAttribute('title');
    });
    function hideTip(){clearTimeout(tipTimer);tipEl.hidden=true;}
    function showTipFor(target){
      if(!target||tipSuppressed||!document.body.contains(target)){hideTip();return;}
      var label=getTipLabel(target);
      if(!label){hideTip();return;}
      tipEl.textContent=label;
      tipEl.hidden=false;
      var r=target.getBoundingClientRect(),trRect=tipEl.getBoundingClientRect();
      var left=r.left+(r.width-trRect.width)/2;
      left=Math.max(8,Math.min(window.innerWidth-trRect.width-8,left));
      var top=r.bottom+7;
      if(top+trRect.height>window.innerHeight-8)top=Math.max(8,r.top-trRect.height-7);
      tipEl.style.left=Math.round(left)+'px';
      tipEl.style.top=Math.round(top)+'px';
    }
    function queueTip(target){
      clearTimeout(tipTimer);
      tipEl.hidden=true;
      if(!target||tipSuppressed)return;
      tipTimer=setTimeout(function(){
        if(activeTipTarget===target&&!tipSuppressed)showTipFor(target);
      },1500);
    }
    root.addEventListener('pointerover',function(e){
      var t=e.target.closest('button,[title],[data-ds-tip],[data-i18n-title]');
      if(!t||!root.contains(t)){activeTipTarget=null;hideTip();return;}
      if(t.hasAttribute('title')){var raw=t.getAttribute('title');if(raw)t.dataset.dsTip=raw;t.removeAttribute('title');}
      if(activeTipTarget!==t){
        activeTipTarget=t;
        tipSuppressed=false;
        queueTip(t);
      }
    });
    root.addEventListener('pointermove',function(e){
      if(!activeTipTarget||tipSuppressed)return;
      if(tipEl.hidden)queueTip(activeTipTarget);
    });
    root.addEventListener('pointerout',function(e){
      if(!activeTipTarget)return;
      var rel=e.relatedTarget;
      if(rel&&activeTipTarget.contains(rel))return;
      activeTipTarget=null;
      tipSuppressed=false;
      hideTip();
    });
    root.addEventListener('pointerdown',function(){tipSuppressed=true;hideTip();});
    root.addEventListener('input',function(){tipSuppressed=true;hideTip();},true);
    root.addEventListener('wheel',function(){tipSuppressed=true;hideTip();},{passive:true,capture:true});
    root.addEventListener('focusout',hideTip);
    window.addEventListener('scroll',hideTip,true);
  }
  installEraser();
  installHoverTooltip();
  try{
    var initLang=document.documentElement.getAttribute('data-lang')||localStorage.getItem('thbc-lang')||localStorage.getItem('thbc-scan-lang')||'en';
    applyScannerLang(initLang);
  }catch(e){applyScannerLang('en');}
  renderList();showState();
  }
  window.TechHatScannerInit = initDocumentScanner;
  initDocumentScanner();
})();