/* TechHat multipage document scanner. Files and pixels stay on this device. */
(function () {
  'use strict';
  function initDocumentScanner() {
  var root=document.querySelector('#img-pane-scan');
  if(!root||root.dataset.dsBound==='1'||!window.TechHatScanGeometry||!window.TechHatDocumentCore)return;
  root.dataset.dsBound='1';
  var G=window.TechHatScanGeometry,C=window.TechHatDocumentCore;
  var $=function(s){return root.querySelector(s);},$$=function(s){return Array.from(root.querySelectorAll(s));};
  var pages=[],activeId=null,nextId=1,renderToken=0,busy=false,compare=false;
  var source=null,sourcePage=null,sourceRot=null,nativeW=0,nativeH=0,zoom=1,pan={x:0,y:0},fitMode=true,space=false;
  var previewTimer=0,drag=null,stream=null,cameraFacing='environment',cameraToken=0;
  var worker=null,jobId=0,jobs=new Map(),eraserActive=false,eraserTool='brush',prevDrawTool='brush',eraserSize=24,eraserHardness=80,eraserOpacity=100,wandTolerance=28,eraserColor='#ffffff',eraserStroke=null,lastBrushPt=null,rectDrag=null,pZoom=1,pPan={x:0,y:0},pPanDrag=null;
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
  function selectPage(id){closeDrawers();if(id===activeId)return;activeId=id;compare=false;sourcePage=null;fitMode=true;pan={x:0,y:0};$('#dsCompare').setAttribute('aria-pressed','false');renderList();updateControls();drawSource();schedulePreview();}
  async function addFiles(files){
    if(busy)return;files=Array.from(files||[]);if(!files.length)return;
    if(pages.length+files.length>60){toast(tr('এক ডকুমেন্টে সর্বোচ্চ ৬০টি পেজ যোগ করুন।','Add up to 60 pages per document.'));return;}
    setBusy(true,tr('পেজ যোগ হচ্ছে…','Adding pages…'));var added=[],errors=[];
    try{files=await expandInputFiles(files);if(!files.length)return;if(pages.length+files.length>60){toast(tr('এক ডকুমেন্টে সর্বোচ্চ ৬০টি পেজ যোগ করুন।','Add up to 60 pages per document.'));return;}for(var i=0;i<files.length;i++){
      status(tr('পেজ ','Page ')+bn(i+1)+' / '+bn(files.length)+tr(' · সীমানা শনাক্ত হচ্ছে…',' · Detecting borders…'));await tick();var item;
      try{if(files[i].size>40*1024*1024)throw new Error(tr('ছবির সাইজ ৪০ MB-এর মধ্যে রাখুন','Keep image size under 40 MB'));item=await G.load(files[i]);if(item.width*item.height>60000000)throw new Error(tr('ছবিটি ৬০ মেগাপিক্সেলের মধ্যে রাখুন','Keep image under 60 megapixels'));
        var p={id:nextId++,item:item,rot:0,pts:C.fullQuad(),settings:settingsDefault(),erases:[],revision:0,undo:[],redo:[],thumb:null};var detected;try{detected=await detectPage(p);}catch(detErr){console.warn('Auto detect fallback:',detErr);detected={pts:C.fullQuad(),auto:false,confidence:0,rotation:0};}if(detected.rotation){p.rot=(p.rot+detected.rotation)%360;detected.pts=rotateQuad(detected.pts,detected.rotation);}p.autoPts=copy(detected.pts);if(!detected.flatbed)detected=applyLearnedCrop(p,detected);p.detectedPts=copy(detected.pts);p.pts=detected.pts;p.detected=detected.auto;p.confidence=detected.confidence;p.learnedApplied=!!detected.learned;pages.push(p);added.push(p);
        try{var thumb=await processPage(p,360,false);p.thumb=URL.createObjectURL(await canvasBlob(thumb,.75));}catch(thumbErr){console.warn('Thumbnail fallback:',thumbErr);}
      }catch(error){if(item&&!pages.some(function(v){return v.item===item;}))URL.revokeObjectURL(item.url);errors.push(files[i].name+': '+error.message);}
    }
    if(added.length){activeId=added[0].id;sourcePage=null;fitMode=true;pan={x:0,y:0};}renderList();showState();drawSource();schedulePreview();
    }finally{setBusy(false);}
    if(errors.length)toast(errors.join(' · '));else status(en()?bn(added.length)+(added.length===1?' page added. ':' pages added. ')+(added.some(function(p){return p.learnedApplied;})?'Applied learned crop preferences.':added.some(function(p){return !p.detected;})?'Adjust borders manually on some pages.':'Review the 4 corners if needed.'):bn(added.length)+'টি পেজ যোগ হয়েছে। '+(added.some(function(p){return p.learnedApplied;})?'আগের ক্রপ পছন্দ প্রয়োগ হয়েছে। ':added.some(function(p){return !p.detected;})?'কিছু পেজের সীমানা হাতে ঠিক করুন।':'চার কোণা দেখে প্রয়োজন হলে ঠিক করুন।'));
  }
  function updateControls(){
    var p=current(),has=!!p;
    $$('.ds-presets input,.ds-section:not(.ds-export-settings) input').forEach(function(el){el.disabled=busy||!has;});
    $$('[data-ds]').forEach(function(b){var action=b.dataset.ds;if(['detect','full','left','right','reset-crop','pdf','jpg','png','zip','print','apply-all','reset-color','compare','toggle-eraser','erase-borders'].includes(action))b.disabled=busy||!has;});if($('#dsCompare'))$('#dsCompare').disabled=busy||!has;$$('[data-ds-tool],[data-ds-adj-btn],[data-ds-reset-adj],[data-ds-adj-step]').forEach(function(b){b.disabled=busy||!has;});$$('[data-ds-reset-section]').forEach(function(b){if(b.dataset.dsResetSection!=='export')b.disabled=busy||!has;});if(!has&&$('#dsActiveSliderTray'))$('#dsActiveSliderTray').hidden=true;
    var learningButton=$('[data-ds="clear-learning"]');if(learningButton)learningButton.textContent=tr('শেখা উদাহরণ: ','Learned: ')+bn(cropExamples().length);
    $('[data-ds="undo"]').disabled=busy||!has||!p.undo.length;$('[data-ds="redo"]').disabled=busy||!has||!p.redo.length;
    var eraseUndo=$('[data-ds="undo-erase"]'),eraseClear=$('[data-ds="clear-erases"]');if(eraseUndo)eraseUndo.disabled=busy||!has||!(p&&p.erases&&p.erases.length);if(eraseClear)eraseClear.disabled=busy||!has||!(p&&p.erases&&p.erases.length);
    if(!p)return;
    $$('input[name=dsFilter]').forEach(function(el){el.checked=el.value===p.settings.filter;});$('#dsShadow').checked=p.settings.shadow;$('#dsText').checked=p.settings.text;$('#dsStraighten').checked=!!p.settings.straighten;$('#dsCleanSpots').checked=!!p.settings.cleanSpots;$('#dsCleanMargins').checked=!!p.settings.cleanMargins;$('#dsCleanMargins').disabled=busy||!p.settings.straighten;
    var defSt=settingsDefault();Object.keys(controls).forEach(function(key){var el=$('#'+controls[key]);if(!el)return;el.value=p.settings[key];$('#'+controls[key]+'Value').textContent=p.settings[key]+(key==='angle'?'°':key==='curve'?'':'%');var pod=$('[data-ds-adj-pod="'+key+'"]');if(pod)pod.dataset.modified=String(Number(p.settings[key])!==Number(defSt[key]));var mn=Number(el.min),mx=Number(el.max),pct=mx>mn?Math.max(0,Math.min(100,((Number(p.settings[key])-mn)/(mx-mn))*100)):0;var fill=$('[data-ds-adj-fill="'+key+'"]'),bar=$('[data-ds-adj-bar="'+key+'"]');if(fill)fill.style.width=pct+'%';if(bar)bar.style.width=pct+'%';});
    $('#dsPageName').textContent=tr('পেজ ','Page ')+bn(pages.indexOf(p)+1)+' / '+bn(pages.length);
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
    var st=copy(p.settings),ptsKey=p.pts.map(function(v){return v.x.toFixed(4)+','+v.y.toFixed(4);}).join('|'),wKey=p.id+'_'+p.rot+'_'+maxDim+'_'+(st.angle||0).toFixed(2)+'_'+ptsKey,warped,cachedHit=maxDim===1100&&processPage._wKey===wKey&&processPage._wData;if(cachedHit){warped=document.createElement('canvas');warped.width=processPage._wW;warped.height=processPage._wH;if(original)warped.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(processPage._wData),warped.width,warped.height),0,0);}else{var src=(maxDim===1100&&sourcePage===p.id&&sourceRot===p.rot&&source)?source:G.rotate(p.item.img,p.rot,maxDim+300,1);warped=G.warp(src,p.pts,1,maxDim,true);}
    if(original)return warped;
    if(!cachedHit&&Math.abs(st.angle)>.01){var rotated=document.createElement('canvas');rotated.width=warped.width;rotated.height=warped.height;var ctx=rotated.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,rotated.width,rotated.height);ctx.translate(rotated.width/2,rotated.height/2);ctx.rotate(st.angle*Math.PI/180);ctx.drawImage(warped,-warped.width/2,-warped.height/2);warped=rotated;}if(!cachedHit&&maxDim===1100){var wIm=warped.getContext('2d',{willReadFrequently:true}).getImageData(0,0,warped.width,warped.height);processPage._wKey=wKey;processPage._wW=warped.width;processPage._wH=warped.height;processPage._wData=new Uint8ClampedArray(wIm.data);}
    st.trim=p.settings.trim||0;st.bgColor=p.settings.bgColor||eraserColor||'#ffffff';st.erases=copy(p.erases||[]);
    var context=warped.getContext('2d',{willReadFrequently:true}),im=cachedHit?new ImageData(new Uint8ClampedArray(processPage._wData),warped.width,warped.height):context.getImageData(0,0,warped.width,warped.height),result=await workerJob('enhance',im,st);context.putImageData(new ImageData(result.data,warped.width,warped.height),0,0);warped._scanInfo=result.info;return warped;
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
  function schedulePreview(){clearTimeout(previewTimer);var token=++renderToken;if(current()&&!eraserStroke)setPreviewLoading(true);previewTimer=setTimeout(function(){renderPreview(token);},60);}
  async function renderPreview(token){
    var p=current();if(!p)return;var version=p.revision,id=p.id,isCompare=compare;
    try{if(!eraserStroke)setPreviewLoading(true);status(tr('প্রিভিউ তৈরি হচ্ছে…','Rendering preview…'));await new Promise(requestAnimationFrame);var out=await processPage(p,1100,isCompare);if(token!==renderToken||activeId!==id||p.revision!==version)return;var elapsed=performance.now()-previewLoadStart;if(elapsed<220)await new Promise(function(r){setTimeout(r,220-elapsed);});if(token!==renderToken||activeId!==id||p.revision!==version)return;var canvas=$('#dsPreview');canvas.width=out.width;canvas.height=out.height;canvas.getContext('2d').drawImage(out,0,0);setPreviewLoading(false);root.style.setProperty('--ds-ratio',out.width/out.height);$('#dsPreviewMeta').textContent=isCompare?tr('মূল ছবি','Original'):out.width+' × '+out.height+' px';status(tr('পেজ '+bn(pages.indexOf(p)+1)+' প্রস্তুত · পরিবর্তন স্বয়ংক্রিয়ভাবে প্রিভিউতে দেখা যায়','Page '+bn(pages.indexOf(p)+1)+' ready · Changes update automatically in preview'));
      if(!isCompare){setTimeout(async function(){if(token!==renderToken||!pages.includes(p))return;var thumb=document.createElement('canvas');var sc=Math.min(1,180/Math.max(out.width,out.height));thumb.width=Math.round(out.width*sc);thumb.height=Math.round(out.height*sc);thumb.getContext('2d').drawImage(out,0,0,thumb.width,thumb.height);var blob=await canvasBlob(thumb,.75);if(token!==renderToken||!pages.includes(p))return;var previous=p.thumb;p.thumb=URL.createObjectURL(blob);var image=$('.ds-page[data-page-id="'+p.id+'"] .ds-thumb img');if(image)image.src=p.thumb;if(previous)URL.revokeObjectURL(previous);},450);}
    }catch(error){if(token===renderToken){setPreviewLoading(false);toast(error.message||tr('প্রিভিউ তৈরি করা যায়নি','Could not render preview'));}}
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
  }
  function toggleAdjSlider(key){var tray=$('#dsActiveSliderTray');if(!tray)return;var pane=key?tray.querySelector('[data-ds-adj-pane="'+key+'"]'):null,isOpen=pane&&!pane.hidden&&!tray.hidden;$$('[data-ds-adj-pane]').forEach(function(el){el.hidden=true;});$$('[data-ds-adj-btn]').forEach(function(b){b.setAttribute('aria-expanded','false');});if(!key||isOpen){tray.hidden=true;return;}if(pane){pane.hidden=false;tray.hidden=false;var btn=$('[data-ds-adj-btn="'+key+'"]');if(btn)btn.setAttribute('aria-expanded','true');}}
  root.addEventListener('click',async function(e){var resetRetBtn=e.target.closest('[data-ds-reset-retouch]');if(resetRetBtn&&!busy){var rk=resetRetBtn.dataset.dsResetRetouch;if(rk==='size'){eraserSize=24;if($('#dsBrushSize'))$('#dsBrushSize').value='24';if($('#dsBrushSizeVal'))$('#dsBrushSizeVal').textContent='24px';updateEraserCursor();}else if(rk==='hardness'){eraserHardness=80;if($('#dsBrushHardness'))$('#dsBrushHardness').value='80';if($('#dsBrushHardnessVal'))$('#dsBrushHardnessVal').textContent='80%';updateEraserCursor();}else if(rk==='tolerance'){wandTolerance=28;if($('#dsWandTolerance'))$('#dsWandTolerance').value='28';if($('#dsWandToleranceVal'))$('#dsWandToleranceVal').textContent='28';}else if(rk==='opacity'){eraserOpacity=100;if($('#dsBrushOpacity'))$('#dsBrushOpacity').value='100';if($('#dsBrushOpacityVal'))$('#dsBrushOpacityVal').textContent='100%';updateEraserCursor();}syncRetouchFills();return;}var resetSecBtn=e.target.closest('[data-ds-reset-section]');if(resetSecBtn&&!busy&&!resetSecBtn.disabled){var sec=resetSecBtn.dataset.dsResetSection,cp=current();if(sec==='export'){if($('#dsFilename'))$('#dsFilename').value='TechHat-document';if($('#dsMargin'))$('#dsMargin').checked=true;if($('#dsPaper'))$('#dsPaper').value='a4';if($('#dsQuality'))$('#dsQuality').value='balanced';toast(tr('এক্সপোর্ট সেটিংস ডিফল্টে রিসেট হয়েছে','Export settings reset to default'));return;}if(!cp)return;remember(cp);var defS=settingsDefault();if(sec==='filter'){cp.settings.filter=defS.filter;changed(cp);toast(tr('ফিল্টার ম্যাজিক+ এ রিসেট হয়েছে','Filter reset to Magic+ AI'));}else if(sec==='smart'){cp.settings.shadow=defS.shadow;cp.settings.text=defS.text;cp.settings.straighten=defS.straighten;cp.settings.cleanSpots=defS.cleanSpots;cp.settings.cleanMargins=defS.cleanMargins;changed(cp);toast(tr('স্মার্ট ফিক্স সেটিংস ডিফল্টে রিসেট হয়েছে','Smart Fix options reset to default'));}else if(sec==='manual'){['brightness','contrast','sharpness','angle','curve','trim'].forEach(function(k){cp.settings[k]=defS[k];});changed(cp);toast(tr('সব ম্যানুয়াল এডজাস্টমেন্ট রিসেট হয়েছে','All manual adjustments reset'));}return;}var resetAdjBtn=e.target.closest('[data-ds-reset-adj]');if(resetAdjBtn&&!busy&&!resetAdjBtn.disabled){var ak=resetAdjBtn.dataset.dsResetAdj,ap=current();if(ap&&ak in controls){var dv=settingsDefault()[ak];if(Number(ap.settings[ak])!==Number(dv)){remember(ap);ap.settings[ak]=dv;changed(ap);}}return;}var stepBtn=e.target.closest('[data-ds-adj-step]');if(stepBtn&&!busy&&!stepBtn.disabled){var tk=stepBtn.dataset.dsAdjTarget,dir=Number(stepBtn.dataset.dsAdjStep)||0,inp=tk?$('#'+controls[tk]):null;if(inp&&current()){var stp=Number(inp.step)||1,mn=Number(inp.min),mx=Number(inp.max),nv=Math.max(mn,Math.min(mx,Number((Number(inp.value)+dir*stp).toFixed(2))));inp.value=String(nv);applySetting(tk,nv,true);}return;}var popBtn=e.target.closest('[data-ds-pop-btn]');if(popBtn&&!busy){var pk=popBtn.dataset.dsPopBtn,pp=$('[data-ds-pop-panel="'+pk+'"]'),wasOpen=pp&&!pp.hidden;closePopovers();if(pp&&!wasOpen){pp.hidden=false;popBtn.setAttribute('aria-expanded','true');}return;}if(!e.target.closest('[data-ds-pop-wrap]'))closePopovers();var adjBtn=e.target.closest('[data-ds-adj-btn]');if(adjBtn&&!busy&&!adjBtn.disabled){toggleAdjSlider(adjBtn.dataset.dsAdjBtn);return;}if(e.target.closest('[data-ds-adj-close]')){toggleAdjSlider(null);return;}var toolBtn=e.target.closest('[data-ds-tool]');if(toolBtn&&!busy&&!toolBtn.disabled){if(!eraserActive)setEraserMode(true);setEraserTool(toolBtn.dataset.dsTool);return;}var swatchBtn=e.target.closest('[data-ds-swatch]');if(swatchBtn&&!busy){setEraserColor(swatchBtn.dataset.dsSwatch,true);return;}var btn=e.target.closest('[data-ds]');if(!btn||btn.disabled)return;var action=btn.dataset.ds,p=current();
    if(action==='add'){$('#dsFiles').click();return;}if(action==='import-files'){($('#dsDocFiles')||$('#dsFiles')).click();return;}if(action==='paste'){pasteFromClipboard();return;}if(action==='theme'){document.querySelector('#themeToggle')?.click();return;}if(action==='camera'){openCamera();return;}if(action==='camera-close'){$('#dsCameraDialog').close();return;}if(action==='camera-switch'){cameraFacing=cameraFacing==='environment'?'user':'environment';openCamera();return;}
    if(action==='capture'){var video=$('#dsVideo');if(!video.videoWidth)return;var capture=document.createElement('canvas');capture.width=video.videoWidth;capture.height=video.videoHeight;capture.getContext('2d').drawImage(video,0,0);var photo=await canvasBlob(capture,.97);$('#dsCameraDialog').close();await addFiles([new File([photo],'camera-'+Date.now()+'.jpg',{type:'image/jpeg'})]);return;}
    if(action==='clear-learning'){try{localStorage.removeItem(learningKey);}catch(e){}updateControls();toast(tr('আপনার ব্যক্তিগত ক্রপ শেখার তথ্য মুছে ফেলা হয়েছে।','Your learned crop preferences have been cleared.'));return;}
    if(action==='reset'){if(pages.length)$('#dsResetDialog').showModal();return;}if(action==='pdf'||action==='jpg'||action==='png'||action==='zip'||action==='print'){exportPages(action);return;}
    if(action==='zoom-in'){setZoom(zoom*1.2);return;}if(action==='zoom-out'){setZoom(zoom/1.2);return;}if(action==='fit'){fit();return;}if(action==='actual'){setZoom(1);return;}
    if(action==='pzoom-in'){setPreviewZoom(pZoom*1.25);return;}if(action==='pzoom-out'){setPreviewZoom(pZoom/1.25);return;}if(action==='pzoom-fit'){setPreviewZoom(1);return;}
    if(action==='close-drawers'){closeDrawers();return;}
    if(action==='toggle-inspector'){var isInsp=root.dataset.drawer==='inspector';if(isInsp)closeDrawers();else{root.dataset.drawer='inspector';var bd1=$('#dsDrawerBackdrop');if(bd1)bd1.hidden=false;}return;}
    if(action==='toggle-sidebar'){if(window.matchMedia('(max-width: 1024px)').matches){var isPg=root.dataset.drawer==='pages';if(isPg)closeDrawers();else{root.dataset.drawer='pages';var bd2=$('#dsDrawerBackdrop');if(bd2)bd2.hidden=false;}}else{var col=root.dataset.sidebarCollapsed==='true';root.dataset.sidebarCollapsed=String(!col);var sbBtn=$('#dsSidebarToggleBtn');if(sbBtn)sbBtn.setAttribute('aria-pressed',String(col));setTimeout(function(){if(fitMode)fit();},200);}return;}
    if(action==='open-color-picker'){$('#dsEraserColor')?.click();return;}
    if(action==='auto-paper-color'){autoDetectPaperColor();return;}
    if(action==='toggle-eraser'){setEraserMode(!eraserActive);return;}
    if(action==='close-eraser'){setEraserMode(false);return;}
    if(action==='reset-retouch-params'){eraserSize=24;eraserHardness=80;wandTolerance=28;eraserOpacity=100;if($('#dsBrushSize'))$('#dsBrushSize').value='24';if($('#dsBrushSizeVal'))$('#dsBrushSizeVal').textContent='24px';if($('#dsBrushHardness'))$('#dsBrushHardness').value='80';if($('#dsBrushHardnessVal'))$('#dsBrushHardnessVal').textContent='80%';if($('#dsWandTolerance'))$('#dsWandTolerance').value='28';if($('#dsWandToleranceVal'))$('#dsWandToleranceVal').textContent='28';if($('#dsBrushOpacity'))$('#dsBrushOpacity').value='100';if($('#dsBrushOpacityVal'))$('#dsBrushOpacityVal').textContent='100%';syncRetouchFills();setEraserColor('#ffffff',false);toast(tr('রিটাচ টুল সেটিংস ডিফল্টে রিসেট হয়েছে','Retouch tool settings reset to default'));return;}
    if(!p||busy)return;if(action==='undo'){historyAction(false);return;}if(action==='redo'){historyAction(true);return;}
    if(action==='erase-borders'){remember(p);p.erases=p.erases||[];var bc=eraserColor||'#ffffff';p.erases.push({type:'rect',x0:0,y0:0,x1:1,y1:.022,color:bc},{type:'rect',x0:0,y0:.978,x1:1,y1:1,color:bc},{type:'rect',x0:0,y0:0,x1:.022,y1:1,color:bc},{type:'rect',x0:.978,y0:0,x1:1,y1:1,color:bc});changed(p);toast(tr('চারপাশের বর্ডারের বাড়তি ব্যাকগ্রাউন্ড পরিষ্কার করা হয়েছে','Outer border background cleaned'));return;}
    if(action==='undo-erase'){if(p.erases&&p.erases.length){remember(p);p.erases.pop();changed(p);}return;}
    if(action==='clear-erases'){if(p.erases&&p.erases.length){remember(p);p.erases=[];changed(p);toast(tr('এই পেজের সব দাগ মোছা রিসেট করা হয়েছে','All retouch edits on this page have been reset'));}return;}
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
    var inp=$('#dsEraserColor'),chip=$('#dsEraserColorChip'),code=$('#dsEraserHex'),dockSw=$('#dsDockSwatch');
    if(inp)inp.value=eraserColor;
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
  function setEraserTool(tool){
    eraserTool=tool||'brush';
    if(['brush','heal','wand','rect'].includes(eraserTool))prevDrawTool=eraserTool;
    var names=en()?{brush:'Brush Tool',heal:'Spot Healing',wand:'Magic Eraser',rect:'Rectangle Fill',picker:'Eyedropper',hand:'Hand Pan'}:{brush:'ব্রাশ টুল',heal:'স্পট হিলিং',wand:'ম্যাজিক ইরেজার',rect:'রেকট্যাঙ্গেল ফিল',picker:'কালার পিকার',hand:'হ্যান্ড প্যান'};
    var label=$('#dsPsActiveToolLabel b');if(label)label.textContent=names[eraserTool]||names.brush;
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
    if(eraserTool==='picker')status(tr('কালার পিকার চালু: ডকুমেন্টের যেকোনো জায়গার ব্যাকগ্রাউন্ডে ক্লিক করে রঙ নিন','Eyedropper active: Click anywhere on the document background to sample color'));
    else if(eraserTool==='heal')status(tr('স্পট হিলিং চালু: দাগের ওপর ঘষলে চারপাশের কাগজের রঙ মিলিয়ে দাগ মুছে যাবে','Spot Healing active: Paint over spots to blend with surrounding paper color'));
    else if(eraserTool==='wand')status(tr('ম্যাজিক ইরেজার চালু: যেকোনো ব্যাকগ্রাউন্ড বা দাগের ওপর ক্লিক করুন','Magic Eraser active: Click any background area or spot to flood-erase'));
    else if(eraserTool==='rect')status(tr('রেকট্যাঙ্গেল ফিল চালু: মাউস টেনে বক্স সিলেক্ট করে ব্যাকগ্রাউন্ড পরিষ্কার করুন','Rectangle Fill active: Drag a box to clean background areas'));
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
    var bar=$('#dsEraserBar'),dock=$('#dsPsDock'),stage=$('#dsPreviewStage'),wrap=$('#dsPreviewWrap'),cur=$('#dsEraserCursor'),loupe=$('#dsPickerLoupe');
    if(bar)bar.hidden=!eraserActive;
    if(dock)dock.hidden=!eraserActive;
    if(stage)stage.classList.toggle('pl-11',eraserActive);
    if(wrap){wrap.classList.toggle('is-eraser-active',eraserActive);wrap.dataset.tool=eraserTool;}
    if(!eraserActive){closePopovers();if(cur)cur.hidden=true;if(loupe)loupe.hidden=true;$$('[data-ds-tool]').forEach(function(b){b.classList.remove('is-active');b.setAttribute('aria-pressed','false');});setPreviewZoom(1);}
    $$('[data-ds="toggle-eraser"]').forEach(function(b){
      b.setAttribute('aria-pressed',String(eraserActive));
      b.classList.toggle('is-active',eraserActive);
    });
    if(eraserActive){
      closeDrawers();
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
    if(szInp)szInp.addEventListener('input',function(){eraserSize=Number(this.value)||24;$('#dsBrushSizeVal').textContent=eraserSize+'px';syncRetouchFills();updateEraserCursor();});
    if(hdInp)hdInp.addEventListener('input',function(){eraserHardness=Number(this.value);$('#dsBrushHardnessVal').textContent=eraserHardness+'%';syncRetouchFills();updateEraserCursor();});
    if(opInp)opInp.addEventListener('input',function(){eraserOpacity=Number(this.value)||100;$('#dsBrushOpacityVal').textContent=eraserOpacity+'%';syncRetouchFills();updateEraserCursor();});
    if(tolInp)tolInp.addEventListener('input',function(){wandTolerance=Number(this.value)||28;$('#dsWandToleranceVal').textContent=String(wandTolerance);syncRetouchFills();});
    syncRetouchFills();
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
      closePopovers();if(!eraserActive||busy||(e.button!==0&&e.button!==1))return;
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
        toast(tr('ব্যাকগ্রাউন্ড কালার পিক করা হয়েছে: ','Sampled background color: ')+picked.hex.toUpperCase());
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
        syncRetouchFills();
        updateEraserCursor();
      }
    });
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
    var names=en()?{brush:'Brush Tool',heal:'Spot Healing',wand:'Magic Eraser',rect:'Rectangle Fill',picker:'Eyedropper',hand:'Hand Pan'}:{brush:'ব্রাশ টুল',heal:'স্পট হিলিং',wand:'ম্যাজিক ইরেজার',rect:'রেকট্যাঙ্গেল ফিল',picker:'কালার পিকার',hand:'হ্যান্ড প্যান'};
    var label=$('#dsPsActiveToolLabel b');if(label)label.textContent=names[eraserTool]||names.brush;
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
        el.title=dict[k];el.dataset.dsTip=dict[k];
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
      if(k&&dict.tools&&dict.tools[k]){var tl=dict.tools[k]+(sc?' ('+sc+')':'');el.title=tl;el.dataset.dsTip=tl;}
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
    var tipEl=$('#dsHoverTooltip'),activeTipTarget=null;
    if(!tipEl)return;
    function hideTip(){tipEl.hidden=true;activeTipTarget=null;}
    function showTipFor(target){
      var label=getTipLabel(target);
      if(!label){hideTip();return;}
      activeTipTarget=target;
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
    root.addEventListener('pointerover',function(e){
      var t=e.target.closest('button,[title],[data-ds-tip],[data-i18n-title]');
      if(!t||!root.contains(t)){hideTip();return;}
      showTipFor(t);
    });
    root.addEventListener('pointerout',function(e){
      if(!activeTipTarget)return;
      var rel=e.relatedTarget;
      if(rel&&activeTipTarget.contains(rel))return;
      hideTip();
    });
    root.addEventListener('focusin',function(e){
      var t=e.target.closest('button,[title],[data-ds-tip],[data-i18n-title]');
      if(t&&root.contains(t))showTipFor(t);
    });
    root.addEventListener('focusout',hideTip);
    root.addEventListener('pointerdown',hideTip);
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
