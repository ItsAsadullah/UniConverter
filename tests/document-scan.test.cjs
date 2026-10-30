const assert = require('node:assert/strict');
const core = require('../public/js/document-scan-core.js');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('✓ ' + name); }
function image(w,h,pixel) { const data=new Uint8ClampedArray(w*h*4); for(let y=0;y<h;y++)for(let x=0;x<w;x++){let p=pixel(x,y);if(!Array.isArray(p))p=[p,p,p];data.set([...p,255],(y*w+x)*4);}return data; }
function inPoly(x,y,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){if((p[i].y>y)!==(p[j].y>y)&&x<(p[j].x-p[i].x)*(y-p[i].y)/(p[j].y-p[i].y)+p[i].x)yes=!yes;}return yes;}
for(const [name,w,h,q] of [
 ['portrait',240,300,[{x:45,y:30},{x:205,y:45},{x:190,y:275},{x:25,y:255}]],
 ['landscape',320,230,[{x:25,y:40},{x:290,y:25},{x:280,y:200},{x:40,y:210}]],
 ['receipt',180,360,[{x:65,y:20},{x:130,y:30},{x:125,y:335},{x:55,y:330}]],
])test('Detect '+name+' page without card aspect constraints',()=>{
 const data=image(w,h,(x,y)=>inPoly(x,y,q)?230:55);
 const got=core.detect(data,w,h);assert.equal(got.auto,true);
 got.pts.forEach((p,i)=>{assert.ok(Math.abs(p.x-q[i].x/w)<.04,JSON.stringify(got));assert.ok(Math.abs(p.y-q[i].y/h)<.04,JSON.stringify(got));});
});
test('Uniform page and low contrast never invent an interior crop',()=>{
 for(const value of [0,128,255])assert.deepEqual(core.detect(image(100,140,()=>value),100,140),{pts:core.fullQuad(),auto:false,confidence:0});
});
test('A single sheet corner hidden at the photo boundary is reconstructed from the other three',()=>{
 const w=360,h=400,q=[{x:42,y:38},{x:282,y:8},{x:263,y:354},{x:26,y:372}];
 const data=image(w,h,(x,y)=>inPoly(x,y,q)?225:45),got=core.detect(data,w,h);
 assert.equal(got.auto,true,JSON.stringify(got));
 got.pts.forEach((p,i)=>{assert.ok(Math.abs(p.x-q[i].x/w)<.045,JSON.stringify(got));assert.ok(Math.abs(p.y-q[i].y/h)<.045,JSON.stringify(got));});
});
test('Reject crossed or nearly collapsed quadrilaterals',()=>{
 assert.equal(core.validQuad([{x:0,y:0},{x:1,y:1},{x:1,y:0},{x:0,y:1}]),false);
 assert.equal(core.validQuad(core.fullQuad()),true);
});
test('Shadow correction flattens uneven paper and preserves dark text',()=>{
 const w=240,h=160,data=image(w,h,(x,y)=>{const paper=120+120*x/(w-1);return y>=70&&y<75&&x>20&&x<220?paper*.12:paper;});
 const out=core.enhance(data,w,h,{filter:'shadow',shadow:true,brightness:100,contrast:100,sharpness:0});
 const before=Math.abs(data[(30*w+210)*4]-data[(30*w+30)*4]);const after=Math.abs(out[(30*w+210)*4]-out[(30*w+30)*4]);
 assert.ok(after<before*.25,`${before} -> ${after}`);assert.ok(out[(72*w+120)*4]<60);assert.ok(out[(30*w+120)*4]>225);
});
test('Adaptive B/W retains fine dark lines in a shadow gradient',()=>{
 const w=220,h=120,data=image(w,h,(x,y)=>y===60&&x>15&&x<205?24:110+x*.6);
 const out=core.enhance(data,w,h,{filter:'bw',shadow:true,brightness:100,contrast:100});
 for(let x=20;x<200;x++){assert.equal(out[(60*w+x)*4],0);assert.equal(out[(30*w+x)*4],255);}
 assert.ok([...out].every(v=>v===0||v===255));
});
test('Original filter with zero tuning preserves interior opaque pixels',()=>{
 const data=image(64,45,(x,y)=>[x*3,y*5,60]);const out=core.enhance(data,64,45,{filter:'original',shadow:false,text:false,brightness:100,contrast:100,sharpness:0});
 assert.deepEqual(out.slice((20*64+20)*4,(20*64+20)*4+4),data.slice((20*64+20)*4,(20*64+20)*4+4));
});
test('Transparent background composites to white',()=>{
 const data=new Uint8ClampedArray(16*16*4);const out=core.enhance(data,16,16,{filter:'original'});assert.ok([...out].every(v=>v===255));
});
test('Curve correction keeps edges fixed and zero setting unchanged',()=>{
 const data=image(60,80,(x,y)=>y*3);assert.equal(core.curve(data,60,80,0),data);
 const out=core.curve(data,60,80,35);assert.equal(out[0],data[0]);assert.equal(out[(79*60+59)*4],data[(79*60+59)*4]);assert.notEqual(out[(40*60+30)*4],data[(40*60+30)*4]);
});
test('Magic+ removes checker texture and shadows without converting blue ink to B/W',()=>{
 const w=320,h=420;
 const data=image(w,h,(x,y)=>{
  const shade=.45+.5*x/w,texture=((x/25|0)+(y/25|0))%2?225:250;
  if(x>65&&x<90&&y>200&&y<240)return [45*shade,70*shade,155*shade];
  if(y>=100&&y<=103&&x>40&&x<280)return 25*shade;
  return texture*shade;
 });
 const out=core.enhance(data,w,h,{filter:'magic_plus',shadow:true,text:true,sharpness:20,cleanSpots:true});
 let white=0,count=0;for(let y=260;y<390;y++)for(let x=40;x<280;x++){count++;if(out[(y*w+x)*4]>245)white++;}
 assert.ok(white/count>.98,`White paper: ${white/count}`);
 const at=(220*w+76)*4;assert.ok(out[at+2]>90&&out[at+2]-out[at]>35,'blue seal must stay visibly colored');
 assert.ok(out[(101*w+150)*4]<60,'dark printed rule survives');
});
test('Magic+ retains faint narrow ink while removing isolated single-pixel dirt',()=>{
 const w=180,h=220,data=image(w,h,(x,y)=>x===90&&y>45&&y<180?220:255);
 data.set([0,0,0,255],(20*w+20)*4);
 // A punctuation dot close to a printed stroke must not be discarded.
 data.set([0,0,0,255],(185*w+90)*4);
 const out=core.enhance(data,w,h,{filter:'magic_plus',shadow:true,text:true,cleanSpots:true});
 assert.equal(out[(20*w+20)*4],255);assert.ok(out[(100*w+90)*4]<240);assert.equal(out[(185*w+90)*4],0);
});
function curvedFrame(){
 const w=320,h=460,data=image(w,h,()=>240);
 function ink(x,y){if(x>=0&&x<w&&y>=0&&y<h)data.set([25,25,25,255],(y*w+x)*4);}
 for(let x=23;x<=296;x++){let bend=Math.round(10*Math.sin(Math.PI*(x-23)/273));for(let k=-1;k<=1;k++){ink(x,34+bend+k);ink(x,423+bend+k);}}
 for(let y=34;y<=433;y++){let bend=Math.round(3*Math.sin(Math.PI*(y-34)/399));for(let k=-1;k<=1;k++){ink(23+bend+k,y);ink(296+bend+k,y);}}
 data.set([10,10,10,255],(6*w+6)*4); // dirt outside the printed frame
 for(let x=90;x<135;x++)ink(x,350); // content inside the frame
 return {w,h,data};
}
test('Automatic rule-based dewarp straightens bowed printed borders',()=>{
 const {w,h,data}=curvedFrame();const before=core.lineModel(data,w,h);assert.ok(before.top&&before.bottom);
 const result=core.straighten(data,w,h,false);assert.equal(result.info.straightened,true);
 const after=core.lineModel(result.data,w,h);
 function span(rule){return Math.max(...rule.positions)-Math.min(...rule.positions);}
 assert.ok(span(after.top)<span(before.top)*.5,`${span(before.top)} -> ${span(after.top)}`);
 assert.ok(span(after.bottom)<span(before.bottom)*.5);
});
test('Margin cleanup only clears outside a confident four-sided frame',()=>{
 const {w,h,data}=curvedFrame(),out=core.straighten(data,w,h,true);
 assert.equal(out.info.marginCleaned,true);assert.equal(out.data[(6*w+6)*4],255);
 let dark=0;for(let y=330;y<370;y++)for(let x=80;x<145;x++)if(out.data[(y*w+x)*4]<165)dark++;
 assert.ok(dark>20,'content inside the frame must remain');
});
test('Short text and blank pages do not trigger invented dewarp or margin erasure',()=>{
 const w=240,h=320,data=image(w,h,(x,y)=>x>75&&x<170&&y%30<2?60:245);
 const result=core.straighten(data,w,h,true);assert.equal(result.info.straightened,false);assert.equal(result.data,data);
});
test('An interior form table is not treated as an erasable page margin',()=>{
 const w=320,h=460,data=image(w,h,()=>245);
 function ink(x,y){data.set([20,20,20,255],(y*w+x)*4);}
 for(let x=45;x<275;x++)for(let k=0;k<2;k++){ink(x,75+k);ink(x,390+k);}
 for(let y=75;y<=391;y++)for(let k=0;k<2;k++){ink(45+k,y);ink(274+k,y);}
 for(let x=80;x<200;x++)ink(x,430);
 const out=core.straighten(data,w,h,true);
 assert.equal(out.info.marginCleaned,false);
 let dark=0;for(let y=420;y<440;y++)for(let x=70;x<210;x++)if(out.data[(y*w+x)*4]<100)dark++;
 assert.ok(dark>80,'signature below an interior table must remain');
});
test('Dark crop-edge artifacts become white without erasing interior text',()=>{
 const w=100,h=120,data=image(w,h,(x,y)=>x<4?25:255);
 for(let y=40;y<65;y++)data.set([10,10,10,255],(y*w+48)*4);
 const out=core.process(data,w,h,{filter:'original',shadow:false,text:false,sharpness:0,straighten:false,curve:0});
 assert.equal(out.data[(60*w+1)*4],255);assert.equal(out.data[(52*w+48)*4],10);
});
test('Text-line dewarp straightens bowed text lines on pages without border rules',()=>{
 const w=400,h=520,data=image(w,h,()=>242);
 function lineY(baseY,x){return Math.round(baseY+14*Math.sin(Math.PI*(x-40)/320));}
 for(const baseY of [70,115,160,205,250,295,340,385,430]){
  for(let x=40;x<360;x++){
   if((x%38)>32)continue; // word gaps
   const cy=lineY(baseY,x);
   for(let dy=-1;dy<=2;dy++)if(cy+dy>=0&&cy+dy<h)data.set([28,28,28,255],((cy+dy)*w+x)*4);
  }
 }
 function rowCenter(buf,baseY,x0,x1){
  let wy=0,wt=0;
  for(let y=baseY-24;y<=baseY+24;y++)for(let x=x0;x<x1;x++){const v=Math.max(0,220-buf[(y*w+x)*4]);wy+=y*v;wt+=v;}
  return wy/wt;
 }
 const beforeBow=Math.abs(rowCenter(data,250,175,225)-0.5*(rowCenter(data,250,45,85)+rowCenter(data,250,315,355)));
 const res=core.process(data,w,h,{filter:'magic_plus',shadow:true,text:true,sharpness:18,straighten:true,curve:0});
 assert.equal(res.info.straightened,true);
 const afterBow=Math.abs(rowCenter(res.data,250,175,225)-0.5*(rowCenter(res.data,250,45,85)+rowCenter(res.data,250,315,355)));
 assert.ok(afterBow<beforeBow*0.25,`Bow should be reduced by >75%: ${beforeBow.toFixed(2)} -> ${afterBow.toFixed(2)}`);
});
test('Magic+ on shadowed page never creates a dark inset border frame',()=>{
 const w=320,h=420,data=image(w,h,(x,y)=>{
  const shade=0.62+0.34*(x/w)*0.6+0.34*(y/h)*0.4;
  if(y>=180&&y<=183&&x>45&&x<275)return Math.round(25*shade);
  return Math.round(245*shade);
 });
 const out=core.process(data,w,h,{filter:'magic_plus',shadow:true,text:true,sharpness:22,cleanSpots:true,straighten:true}).data;
 for(let d=0;d<16;d++){
  for(let x=20;x<w-20;x++){
   assert.ok(out[(d*w+x)*4]>=245,`Top border dark pixel at d=${d}, x=${x}: ${out[(d*w+x)*4]}`);
   assert.ok(out[((h-1-d)*w+x)*4]>=245,`Bottom border dark pixel at d=${d}, x=${x}: ${out[((h-1-d)*w+x)*4]}`);
  }
  for(let y=20;y<h-20;y++){
   assert.ok(out[(y*w+d)*4]>=245,`Left border dark pixel at d=${d}, y=${y}: ${out[(y*w+d)*4]}`);
   assert.ok(out[(y*w+(w-1-d))*4]>=245,`Right border dark pixel at d=${d}, y=${y}: ${out[(y*w+(w-1-d))*4]}`);
  }
 }
});
test('Auto-crop on unevenly lit bright desk does not leak into sunlit desk corner',()=>{
 const w=360,h=460,q=[{x:48,y:40},{x:312,y:34},{x:324,y:418},{x:38,y:426}];
 const data=image(w,h,(x,y)=>{
  const sun=Math.max(0,1-Math.hypot(x/w,y/h)*1.15);
  if(inPoly(x,y,q))return Math.min(252,Math.round(212+36*sun));
  return Math.round(132+55*sun);
 });
 const got=core.detect(data,w,h);
 assert.equal(got.auto,true);
 got.pts.forEach((p,i)=>{
  assert.ok(Math.abs(p.x-q[i].x/w)<0.045,`corner ${i} x: ${p.x} vs ${q[i].x/w}`);
  assert.ok(Math.abs(p.y-q[i].y/h)<0.045,`corner ${i} y: ${p.y} vs ${q[i].y/h}`);
 });
});
test('Auto-crop ignores interior Rx column line, table dividers, and camera watermark',()=>{
 const w=360,h=480,q=[{x:42,y:66},{x:312,y:56},{x:324,y:424},{x:34,y:428}];
 const data=image(w,h,(x,y)=>{
  if(inPoly(x,y,q)){
   const shade=0.72+0.26*(x/w);
   if(Math.abs(y-115)<2||Math.abs(y-260)<2||Math.abs(x-115)<2)return Math.round(35*shade);
   return Math.round(232*shade);
  }
  if(y>448&&y<460&&((x>20&&x<95)||(x>265&&x<340)))return 225; // bottom camera watermark
  return [95,70,42];
 });
 const got=core.detect(data,w,h);
 assert.equal(got.auto,true);
 got.pts.forEach((p,i)=>{
  assert.ok(Math.abs(p.x-q[i].x/w)<0.045,`corner ${i} x: ${p.x} vs ${q[i].x/w}`);
  assert.ok(Math.abs(p.y-q[i].y/h)<0.045,`corner ${i} y: ${p.y} vs ${q[i].y/h}`);
 });
});
test('Multi-rule straighten aligns interior form table borders and single Rx column rule',()=>{
 const w=360,h=480,data=image(w,h,()=>242);
 function ink(x,y){if(x>=0&&x<w&&y>=0&&y<h)data.set([24,24,24,255],(y*w+x)*4);}
 for(let x=28;x<332;x++){
  const bow=Math.round(6*Math.sin(Math.PI*(x-28)/304));
  for(const by of [36,240,310,444])for(let k=0;k<2;k++)ink(x,by+bow+k);
 }
 for(let y=36;y<444;y++){
  const vbow=Math.round(5*Math.sin(Math.PI*(y-36)/408));
  for(let k=0;k<2;k++)ink(108+vbow+k,y);
 }
 const res=core.straighten(data,w,h,false);
 assert.equal(res.info.straightened,true);
 assert.ok(res.info.rules>=5,`Expected >=5 rules straightened, got ${res.info.rules}`);
});
test('Close-up framed certificate aligns top edge parallel to printed frame and trims corner background sliver',()=>{
 const w=360,h=480;
 const data=image(w,h,(x,y)=>{
  if(y<12||(y<120&&x>w-7))return [18,16,14]; // top edge + top-right dark sliver
  const shadow=x>w*0.5&&y<h*0.35?0.48:1;
  const onFrame=(y>=22&&y<=23&&x>=16&&x<=w-16)||(y>=h-14&&y<=h-13&&x>=16&&x<=w-16)||(x>=16&&x<=17&&y>=22&&y<=h-13)||(x>=w-17&&x<=w-16&&y>=22&&y<=h-13);
  if(onFrame)return Math.round(28*shadow);
  return Math.round(218*shadow);
 });
 const got=core.detect(data,w,h);
 assert.equal(got.auto,true);
 assert.ok(got.pts[1].x<0.99,`Top-right x should step inside dark sliver: ${got.pts[1].x}`);
 assert.ok(got.pts[3].y>0.97,`Bottom-left y should not cut bottom border: ${got.pts[3].y}`);
 assert.ok(Math.abs(got.pts[1].y-got.pts[0].y)<0.02,`Top edge should stay parallel to printed border: ${got.pts[0].y} vs ${got.pts[1].y}`);
});
test('Tilted registration card on red cloth with bottom-right corner slightly outside frame auto-detects cleanly',()=>{
 const w=360,h=480,q=[{x:29,y:9},{x:335,y:6},{x:392,y:450},{x:18,y:490}];
 const data=image(w,h,(x,y)=>{
  if(inPoly(x,y,q))return [212,214,210];
  return [165,38,32]; // red cloth background
 });
 const got=core.detect(data,w,h);
 assert.equal(got.auto,true);
 assert.ok(Math.abs(got.pts[0].x-29/w)<0.03,`Top-left x: ${got.pts[0].x}`);
 assert.ok(Math.abs(got.pts[1].x-335/w)<0.03,`Top-right x: ${got.pts[1].x}`);
 assert.ok(got.pts[2].x>1.0,`Bottom-right x preserves extrapolated corner outside right border: ${got.pts[2].x}`);
 assert.ok(got.pts[3].y>1.0,`Bottom-left y preserves extrapolated corner outside bottom border: ${got.pts[3].y}`);
});
test('Pre-cropped tilted document straightens in 2D and fills out-of-frame wedge with white',()=>{
 const w=320,h=420,data=image(w,h,()=>245);
 function ink(x,y){if(x>=0&&x<w&&y>=0&&y<h)data.set([20,20,20,255],(y*w+x)*4);}
 for(let x=24;x<w-24;x++){
  const tilt=Math.round(-0.07*(x-w/2));
  for(const by of [36,160,290])for(let k=0;k<2;k++)ink(x,by+tilt+k);
 }
 const res=core.straighten(data,w,h,false);
 assert.equal(res.info.straightened,true);
 // Bottom-left out-of-frame wedge (where sourceY > h-1 or sourceX < 0) should be pure white 255
 assert.equal(res.data[((h-2)*w+2)*4],255);
 assert.equal(res.data[((h-2)*w+2)*4+1],255);
 assert.equal(res.data[((h-2)*w+2)*4+2],255);
});
test('Already-straight transcript with wavy guilloche background and partial grade box is never warped',()=>{
 const w=380,h=500,data=image(w,h,(x,y)=>{
  // Curved concentric guilloche security background waves
  const wave=Math.sin(Math.hypot(x-190,y-180)*0.45);
  let v=wave>0.65?192:238;
  // Soft horizontal fold shadow at y=64
  if(Math.abs(y-64)<=3&&x<240)v-=28;
  return [v,Math.min(255,v+4),v];
 });
 function ink(x,y){if(x>=0&&x<w&&y>=0&&y<h)data.set([22,24,22,255],(y*w+x)*4);}
 // Small top-right Grade table (x=274..342, y=55..110)
 for(const gy of [55,68,82,96,110])for(let x=274;x<=342;x++)ink(x,gy);
 for(const gx of [274,296,320,342])for(let y=55;y<=110;y++)ink(gx,y);
 // Main Subjects table (x=34..342, y=265..410) with merged GPA columns on right (x=278..342)
 for(const ty of [265,280,305,330,355,380,410]){
  const xEnd=(ty===265||ty===280||ty===410)?342:278;
  for(let x=34;x<=xEnd;x++)for(let k=0;k<2;k++)ink(x,ty+k);
 }
 for(const tx of [34,56,195,235,278,310,342])for(let y=265;y<=410;y++)ink(tx,y);
 const on=core.process(data,w,h,{filter:'magic_plus',shadow:true,text:true,sharpness:18,straighten:true,cleanMargins:false});
 const off=core.process(data,w,h,{filter:'magic_plus',shadow:true,text:true,sharpness:18,straighten:false,cleanMargins:false});
 assert.equal(on.info.straightened,false);
 assert.deepEqual(on.data,off.data);
});
test('Flatbed passport scan on bright scanner bed auto-crops and detects 90/270 text orientation',()=>{
 const w=300,h=420;
 // Passport spread in upper half (x=24..264, y=34..210) on bright flatbed scanner lid (212) with outer bezel shadow
 const data=image(w,h,(x,y)=>{
  if(x<2||y<2||x>w-3||y>h-3)return 75;
  if(x>=24&&x<=264&&y>=34&&y<=210){
   // Contact shadow rim along top, left, right edges
   if(y<=36)return 65;
   if(x<=26||x>=262)return 165;
   if(y===210)return 192;
   // Subtle security texture inside passport
   return 208+(((x*3+y*5)%7)-3)*2;
  }
  return 212;
 });
 // Vertical text lines inside passport that become horizontal and left-aligned when rotated 270 deg clockwise:
 // In 270 deg (newX = y, newY = w-1-x), a horizontal line has constant x (newY) and varying y (newX), with constant start y!
 const cols=[65,77,89,101,113,125,137,170,182,194,206,218];
 const lengths=[110,85,125,75,100,120,80,115,90,130,78,105];
 for(let ci=0;ci<cols.length;ci++){
  const xCol=cols[ci],len=lengths[ci],yStart=50;
  for(let y=yStart;y<=yStart+len;y++){
   if((y%5)===0)continue; // character stroke spacing along vertical text line
   for(let dx=-1;dx<=1;dx++)data.set([28,28,28,255],(y*w+(xCol+dx))*4);
  }
 }
 const got=core.detect(data,w,h);
 assert.equal(got.auto,true);
 assert.equal(got.flatbed,true);
 assert.equal(got.rotation,270);
 assert.ok(Math.abs(got.pts[0].x-24/w)<0.035,`TL x: ${got.pts[0].x}`);
 assert.ok(Math.abs(got.pts[0].y-34/h)<0.035,`TL y: ${got.pts[0].y}`);
 assert.ok(Math.abs(got.pts[2].x-264/w)<0.035,`BR x: ${got.pts[2].x}`);
 assert.ok(Math.abs(got.pts[2].y-210/h)<0.035,`BR y: ${got.pts[2].y}`);
});
test('Margin trim slider whitens outer margins cleanly without touching center',()=>{
 const w=100,h=100;
 const data=image(w,h,()=>100);
 const res=core.process(data,w,h,{filter:'magic_plus',trim:3});
 // Check that border pixels at x=1, y=1 are pure white (255)
 const atBorder=(1*w+1)*4;
 assert.equal(res.data[atBorder],255);
 assert.equal(res.data[atBorder+1],255);
 assert.equal(res.data[atBorder+2],255);
});
test('Eraser tool whitens spots via brush strokes and border trim blocks',()=>{
 const w=100,h=100;
 const data=image(w,h,()=>50);
 const erases=[
  {type:'stroke',size:0.06,pts:[{x:0.5,y:0.5}]},
  {type:'rect',x0:0.1,y0:0.1,x1:0.2,y1:0.2}
 ];
 const res=core.process(data,w,h,{filter:'original',erases:erases});
 // Center at 50,50 must be white
 const atCenter=(50*w+50)*4;
 assert.equal(res.data[atCenter],255);
 assert.equal(res.data[atCenter+1],255);
 assert.equal(res.data[atCenter+2],255);
 // Rect at 15,15 must be white
 const atRect=(15*w+15)*4;
 assert.equal(res.data[atRect],255);
 assert.equal(res.data[atRect+1],255);
 assert.equal(res.data[atRect+2],255);
 // Far away at 80,80 should remain original (50)
 const atFar=(80*w+80)*4;
 assert.equal(res.data[atFar],50);
});
test('Photoshop retouch tools support custom background color, spot healing, and magic wand flood fill',()=>{
 const w=100,h=100;
 // Cream paper (240, 232, 210) with a dark spot at (30,30) and a dark patch at (70..80, 70..80)
 const data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  if(Math.hypot(x-30,y-30)<=4){data[i]=40;data[i+1]=40;data[i+2]=40;data[i+3]=255;}
  else if(x>=70&&x<=80&&y>=70&&y<=80){data[i]=80;data[i+1]=82;data[i+2]=85;data[i+3]=255;}
  else{data[i]=240;data[i+1]=232;data[i+2]=210;data[i+3]=255;}
 }
 const erases=[
  {type:'heal',size:0.06,hardness:0.5,opacity:1,pts:[{x:0.3,y:0.3}]},
  {type:'wand',x:0.75,y:0.75,tolerance:20,color:'#f0e8d2',opacity:1}
 ];
 const res=core.process(data,w,h,{filter:'original',erases:erases});
 // Spot at (30,30) should be healed to surrounding cream paper (~240, 232, 210)
 const atHealed=(30*w+30)*4;
 assert.ok(Math.abs(res.data[atHealed]-240)<=3,`Healed R: ${res.data[atHealed]}`);
 assert.ok(Math.abs(res.data[atHealed+1]-232)<=3,`Healed G: ${res.data[atHealed+1]}`);
 assert.ok(Math.abs(res.data[atHealed+2]-210)<=3,`Healed B: ${res.data[atHealed+2]}`);
 // Magic wand at (75,75) should replace the 70..80 patch with #f0e8d2 (240, 232, 210)
 const atWand=(75*w+75)*4;
 assert.equal(res.data[atWand],240);
 assert.equal(res.data[atWand+1],232);
 assert.equal(res.data[atWand+2],210);
});
console.log(`${passed} document scan tests passed`);
