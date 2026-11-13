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
test('6-Point Passport validation accepts inward center-pinch and rejects crossed polygons',()=>{
 const pinched=[
  {x:0.08,y:0.10}, // 0: TL
  {x:0.50,y:0.18}, // 1: TM (pinched inward)
  {x:0.92,y:0.11}, // 2: TR
  {x:0.93,y:0.89}, // 3: BR
  {x:0.50,y:0.81}, // 4: BM (pinched inward)
  {x:0.07,y:0.90}  // 5: BL
 ];
 assert.equal(core.validQuad(pinched),true);
 const crossed=[
  {x:0.08,y:0.10},
  {x:0.85,y:0.85}, // crossed fold point
  {x:0.92,y:0.11},
  {x:0.93,y:0.89},
  {x:0.15,y:0.15},
  {x:0.07,y:0.90}
 ];
 assert.equal(core.validQuad(crossed),false);
});
test('6-Point Passport detector finds outer corners and pinched center fold points',()=>{
 const w=360,h=260;
 // Simulated open passport on dark desk where center fold (x=180) pinches inward from y=30..230 to y=48..212
 const data=image(w,h,(x,y)=>{
  if(x<32||x>328)return [35,38,44];
  const u=(x-32)/(328-32);
  const arch=Math.sin(Math.PI*u);
  const topY=30+18*arch;
  const botY=230-18*arch;
  if(y<topY||y>botY)return [35,38,44];
  // Dark binding crease at x=180
  if(Math.abs(x-180)<=2)return [95,95,100];
  return [232,230,224];
 });
 const det=core.detectPassportSixPts(data,w,h,{foldAxis:'vertical'});
 assert.equal(det.pts.length,6);
 assert.equal(det.foldAxis,'vertical');
 // Top-Middle (1) should dip lower (larger y) than average of TL (0) and TR (2)
 const topOuterY=0.5*(det.pts[0].y+det.pts[2].y);
 const botOuterY=0.5*(det.pts[5].y+det.pts[3].y);
 assert.ok(det.pts[1].y>topOuterY+0.02,`Expected TM (${det.pts[1].y.toFixed(3)}) > outer top (${topOuterY.toFixed(3)})`);
 assert.ok(det.pts[4].y<botOuterY-0.02,`Expected BM (${det.pts[4].y.toFixed(3)}) < outer bottom (${botOuterY.toFixed(3)})`);
});
test('6-Point piecewise homography & mesh warp un-pinches compressed passport spine to full height',()=>{
 const sw=300,sh=200;
 // Source image has a pinched passport: at x=150 (TM/BM), top border is at y=40 and bottom border is at y=160,
 // whereas at left (x=30) and right (x=270), top border is at y=20 and bottom border is at y=180.
 // We draw a bright red marker right inside the pinched top-middle (150, 44) and bottom-middle (150, 156).
 const normPts=[
  {x:30/sw,y:20/sh},   // 0: TL
  {x:150/sw,y:40/sh},  // 1: TM
  {x:270/sw,y:20/sh},  // 2: TR
  {x:270/sw,y:180/sh}, // 3: BR
  {x:150/sw,y:160/sh}, // 4: BM
  {x:30/sw,y:180/sh}   // 5: BL
 ];
 const src=image(sw,sh,(x,y)=>{
  if(Math.hypot(x-150,y-42)<=3)return [240,20,20];
  if(Math.hypot(x-150,y-158)<=3)return [20,20,240];
  return [235,235,235];
 });
 const dims=core.computeSixPointDims(sw,sh,normPts,1,400,true,'vertical');
 // Natural height must preserve outer edge height (160px), not collapse to pinched middle height (120px)
 assert.ok(dims.natH>=158,`Expected natH >= 158, got ${dims.natH}`);
 const out=core.warpSixPoints(src,sw,sh,normPts,dims.outW,dims.outH,'vertical');
 const midX=Math.round(dims.outW*dims.split);
 // Near the top of the rectified output at midX (y=3), the red marker at the pinched spine top must now be at the top edge!
 const topIdx=(3*dims.outW+midX)*4;
 assert.ok(out[topIdx]>200&&out[topIdx+1]<60,`Top middle should be rectified to top edge: R=${out[topIdx]}, G=${out[topIdx+1]}`);
 // Near the bottom of the rectified output at midX (y=outH-4), the blue marker at the pinched spine bottom must be at the bottom edge!
 const botIdx=((dims.outH-4)*dims.outW+midX)*4;
 assert.ok(out[botIdx+2]>200&&out[botIdx]<60,`Bottom middle should be rectified to bottom edge: B=${out[botIdx+2]}, R=${out[botIdx]}`);
});
test('Horizontal 6-Point Passport detector strips bottom watermark banner and preserves portrait skin tones in Magic+',()=>{
 const w=280,h=380;
 const data=image(w,h,(x,y)=>{
  // Bottom white phone watermark banner (y >= 336)
  if(y>=336)return [252,252,252];
  // Dark table background outside passport (x: 24..252, y: 28..330)
  if(x<24||x>252||y<28||y>330)return [32,36,44];
  // Horizontal fold crease at y=178
  if(Math.abs(y-178)<=2)return [105,108,112];
  // Portrait photo box in lower-left (x: 42..96, y: 215..285) with skin tone (150) and dark hair (65)
  if(x>=42&&x<=96&&y>=215&&y<=285){
   if(y<235)return [65,62,60];
   return [152,148,144];
  }
  // MRZ strokes near bottom (y: 300..318)
  if((y===304||y===314)&&x>=36&&x<=240&&(x%6)<3)return [28,28,30];
  return [218,216,210];
 });
 const det=core.detectPassportSixPts(data,w,h,{});
 assert.equal(det.foldAxis,'horizontal');
 assert.equal(det.rotation,0);
 assert.ok(det.pts[3].y<0.90,`Bottom-right y (${det.pts[3].y.toFixed(3)}) must exclude bottom watermark banner`);
 const enhanced=core.process(data,w,h,{filter:'magic_plus',shadow:true,text:false,cleanSpots:false,cleanMargins:false});
 const skinIdx=(255*w+68)*4;
 assert.ok(enhanced.data[skinIdx]<228,`Portrait skin tone must not bleach to pure white (got ${enhanced.data[skinIdx]})`);
});
test('6-Point Passport enforces 50/50 top-bottom page split, standard 125:176 aspect ratio, and out-of-bounds crop handles',()=>{
 const pts=[
  {x:-0.12,y:-0.08},
  {x:1.08,y:-0.05},
  {x:1.04,y:0.38},
  {x:1.15,y:1.12},
  {x:-0.15,y:1.10},
  {x:-0.08,y:0.36}
 ];
 pts.foldAxis='horizontal';
 assert.ok(core.validQuad(pts),'Out-of-bounds 6-point passport polygon within [-0.4, 1.4] must be valid');
 const dims=core.computeSixPointDims(600,800,pts,600,1000,true,'horizontal');
 assert.equal(dims.split,0.5,'Center fold must split top and bottom passport pages into exact 50/50 halves');
 assert.ok(Math.abs(dims.outH/dims.outW-1.408)<0.015,`Passport output aspect ratio (${(dims.outH/dims.outW).toFixed(3)}) must match standard 125:176 (1.408)`);
});
test('Horizontal 6-Point Passport fold detector locks onto spine crease instead of bold header text lines below fold',()=>{
 const w=280,h=380;
 const data=image(w,h,(x,y)=>{
  if(y>=338)return [250,250,250];
  const tY=Math.max(0,Math.min(1,(y-48)/(328-48)));
  const pinch=Math.exp(-Math.pow((y-176)/18,2))*6;
  const xL=Math.round(28-4*tY+pinch);
  const xR=Math.round(232+24*tY-pinch*1.4);
  if(x<xL||x>xR||y<48||y>328)return [28,32,38];
  // Continuous spine fold crease at y=176
  if(Math.abs(y-176)<=1)return [148,150,152];
  if(Math.abs(y-176)===2)return [182,184,186];
  // High-contrast dashed character strokes on header text rows below the fold (y=191..194 and y=202..205)
  if(y>=191&&y<=194&&x>=xL+28&&x<=xR-16&&(x%5)<3)return [42,44,48];
  if(y>=202&&y<=205&&x>=xL+14&&x<=xR-24&&(x%6)<4)return [35,38,42];
  return [222,220,215];
 });
 const det=core.detectPassportSixPts(data,w,h,{foldAxis:'horizontal'});
 const foldY=0.5*(det.pts[2].y+det.pts[5].y)*(h-1);
 assert.ok(Math.abs(foldY-176)<6,`Detected fold y (${foldY.toFixed(1)}px) must lock onto true crease at 176px instead of header text at 192..204px`);
});
test('Tilted horizontal 6-Point Passport refines lower-left and lower-right corners to full bio-data page edges',()=>{
 const w=280,h=380;
 const data=image(w,h,(x,y)=>{
  const nx=x/(w-1),ny=y/(h-1);
  // Tilted passport where top edge runs (0.09,0.22)->(0.73,0.13), fold runs (0.16,0.56)->(0.84,0.45), bottom runs (0.16,0.96)->(1.05,0.82)
  const yFold=0.56-0.16*(nx-0.16);
  const yTop=0.22-0.14*(nx-0.09);
  const yBot=0.96-0.16*(nx-0.16);
  const xLeft=ny<yFold?(0.09+0.21*(ny-0.22)):(0.16+0.01*(ny-0.56));
  const xRight=ny<yFold?(0.73+0.35*(ny-0.13)):(0.84+0.58*(ny-0.45));
  if(ny<yTop||ny>yBot+0.02||nx<xLeft||nx>xRight)return [34,36,40];
  if(Math.abs(ny-yFold)<0.006)return [145,148,150];
  // Inner portrait box on lower left that could pull initial BL inward
  if(ny>yFold+0.05&&ny<yFold+0.24&&nx>xLeft+0.05&&nx<xLeft+0.22)return [95,98,102];
  // MRZ lines near v=0.72..0.82 of lower page
  const vLow=(ny-yFold)/Math.max(0.05,yBot-yFold);
  if((Math.abs(vLow-0.74)<0.012||Math.abs(vLow-0.81)<0.012)&&nx>xLeft+0.03&&nx<xRight-0.03&&(x%5)<3)return [32,34,38];
  // Fanned underlying page stack seam near v=0.95..1.05
  if(vLow>0.94)return [135,120,118];
  return [216,218,220];
 });
 const det=core.detectPassportSixPts(data,w,h,[
  {x:0.09,y:0.22},{x:0.73,y:0.13},{x:0.99,y:0.85},{x:0.24,y:0.98}
 ]);
 assert.equal(det.foldAxis,'horizontal');
 assert.ok(det.pts[4].x<0.19,`Tilted BL.x (${det.pts[4].x.toFixed(3)}) must expand leftward to true paper edge (~0.16)`);
 assert.ok(det.pts[3].x>1.01,`Tilted BR.x (${det.pts[3].x.toFixed(3)}) must project rightward to true lower-right corner (>1.01)`);
});
test('Border cleanup whitens dark corner/edge artifacts to pure white instead of stretching interior pixels',()=>{
 const w=180,h=220;
 const data=image(w,h,(x,y)=>{
  // Dark corner wedge in top-right (x+y-w > -14) and dark 3px left border strip
  if((x>w-16&&y<16&&(x-(w-16))>y)||x<3)return [38,40,44];
  // Alternating vertical security pattern at x=12..18 that previously got stretched to x=0..11
  if(x>=12&&x<=18&&(y%4)<2)return [110,115,125];
  return [228,226,222];
 });
 const out=core.process(data,w,h,{filter:'magic_plus',shadow:true,text:true,straighten:false,cleanSpots:false,cleanMargins:false}).data;
 // Top-right corner must be whitened to 255
 const trCorner=(2*w+(w-2))*4;
 assert.equal(out[trCorner],255);
 assert.equal(out[trCorner+1],255);
 assert.equal(out[trCorner+2],255);
 // Left border (x=0..4) must be pure white (255), NOT a stretched copy of the alternating pattern at x=12..18
 for(let y=20;y<200;y++){
  const idx=(y*w+1)*4;
  assert.equal(out[idx],255,`Left border pixel at y=${y} must be pure white (255), got ${out[idx]}`);
 }
});
test('Tilted horizontal 6-Point Passport ignores floral clutter above TL and finger occlusion on bottom edge',()=>{
 const w=260,h=350;
 const data=image(w,h,(x,y)=>{
  const nx=x/(w-1),ny=y/(h-1);
  const yTop=0.128-0.088*((nx-0.05)/0.80);
  const yFold=0.525-0.050*((nx-0.10)/0.78);
  const yBot=0.952-0.012*((nx-0.12)/0.83);
  const xLeft=ny<yFold?(0.05+0.14*(ny-0.128)):(0.10+0.04*(ny-0.525));
  const xRight=ny<yFold?(0.85+0.06*(ny-0.040)):(0.88+0.15*(ny-0.475));
  if(nx>=0.18&&nx<=0.28&&ny>=0.925)return [28,22,20];
  if(ny<yTop){
   if(ny>yTop-0.025)return [75,45,35];
   if(nx<0.55&&ny>0.025)return [215,195,120];
   return [40,35,38];
  }
  if(ny>yBot||nx<xLeft||nx>xRight)return [35,32,36];
  if(Math.abs(ny-yFold)<0.006)return [110,112,115];
  return [195,196,192];
 });
 const det=core.detectPassportSixPts(data,w,h,[
  {x:0.05,y:0.026},{x:0.85,y:0.031},{x:0.906,y:0.947},{x:0.12,y:0.928}
 ]);
 assert.ok(Math.abs(det.pts[0].y-0.128)<0.022,`TL.y (${det.pts[0].y.toFixed(3)}) must drop below floral clutter onto true top-left corner (~0.128)`);
 assert.ok(det.pts[4].y>0.940,`BL.y (${det.pts[4].y.toFixed(3)}) must bypass finger occlusion to reach true bottom-left corner (~0.952)`);
 assert.ok(det.pts[3].x>0.935,`BR.x (${det.pts[3].x.toFixed(3)}) must expand rightward to true lower-right corner (~0.950)`);
});
test('Bright-tabletop tilted 6-Point Passport (#15) and dark-tabletop trapezoid (#5) lock corners cleanly across lanczos3 and browser linear kernels',()=>{
 const dir='C:/Users/Administrator/Desktop/test passport';
 const f15=require('path').join(dir,'photo_2026-11-04_23-24-45.jpg');
 if(require('fs').existsSync(f15)){
  for(const kernel of ['lanczos3','linear']){
   const raw=require('child_process').execFileSync(process.execPath,['-e',`
    const sharp=require('sharp');
    sharp(${JSON.stringify(f15)}).resize(700,700,{fit:'inside',kernel:${JSON.stringify(kernel)}}).ensureAlpha().raw().toBuffer({resolveWithObject:true}).then(({data,info})=>{
     const core=require('./public/js/document-scan-core.js');
     const det=core.detectPassportSixPts(new Uint8ClampedArray(data),info.width,info.height,{foldAxis:'horizontal'});
     process.stdout.write(JSON.stringify(det.pts));
    });
   `],{cwd:process.cwd()});
   const pts=JSON.parse(raw.toString());
   assert.ok(Math.abs(pts[5].x-0.126)<0.015,`[${kernel}] #15 LM.x (${pts[5].x.toFixed(3)}) must sit on left fold (~0.126)`);
   assert.ok(Math.abs(pts[4].x-0.168)<0.018&&Math.abs(pts[4].y-0.910)<0.018,`[${kernel}] #15 BL (${pts[4].x.toFixed(3)},${pts[4].y.toFixed(3)}) must avoid bottom-left thumb (~0.168,0.910)`);
   assert.ok(pts[3].x>0.975&&Math.abs(pts[3].y-0.866)<0.018,`[${kernel}] #15 BR (${pts[3].x.toFixed(3)},${pts[3].y.toFixed(3)}) must reach bottom-right corner (~0.985,0.866)`);
  }
 }
 const f5=require('path').join(dir,'photo_2026-11-04_23-24-25.jpg');
 if(require('fs').existsSync(f5)){
  for(const kernel of ['lanczos3','linear']){
   const raw=require('child_process').execFileSync(process.execPath,['-e',`
    const sharp=require('sharp');
    sharp(${JSON.stringify(f5)}).resize(700,700,{fit:'inside',kernel:${JSON.stringify(kernel)}}).ensureAlpha().raw().toBuffer({resolveWithObject:true}).then(({data,info})=>{
     const core=require('./public/js/document-scan-core.js');
     const det=core.detectPassportSixPts(new Uint8ClampedArray(data),info.width,info.height,{foldAxis:'horizontal'});
     process.stdout.write(JSON.stringify(det.pts));
    });
   `],{cwd:process.cwd()});
   const pts=JSON.parse(raw.toString());
   assert.ok(pts[0].x>0.080&&pts[0].x<0.105,`[${kernel}] #5 TL.x (${pts[0].x.toFixed(3)}) must preserve perforated passport number (~0.092)`);
   assert.ok(pts[5].x>0.082&&pts[5].x<0.105,`[${kernel}] #5 LM.x (${pts[5].x.toFixed(3)}) must sit on left fold without cutting portrait (~0.095)`);
   assert.ok(pts[4].x>0.015&&pts[4].x<0.035,`[${kernel}] #5 BL.x (${pts[4].x.toFixed(3)}) must reach lower-left MRZ margin (~0.022)`);
  }
 }
});
test('Passport Magic+ AI preserves portrait skin tones without scorching and never erodes jagged border corners',()=>{
 const w=180,h=220;
 const data=image(w,h,(x,y)=>{
  // Shaded top-left passport corner / perforation (x<12, y<18) that must NOT be magic-wand deleted to 255
  if(x<12&&y<18)return [152,148,140];
  // Portrait face box (x=25..75, y=120..180) with two adjacent skin tones (R-G=22 and R-G=15)
  if(x>=25&&x<=75&&y>=120&&y<=180){
   return x<50?[156,134,122]:[150,135,124];
  }
  return [210,210,206];
 });
 const out=core.process(data,w,h,{filter:'magic_plus',shadow:true,text:false,straighten:false,cleanSpots:false,cleanMargins:false,sharpness:25}).data;
 const cIdx=(4*w+4)*4;
 assert.ok(out[cIdx]<225,`Passport top-left corner must not be magic-wand erased to 255, got ${out[cIdx]}`);
 const s1=((150*w+38)*4),s2=((150*w+62)*4);
 assert.ok(out[s1]<215&&out[s2]<215,`Portrait skin tones must not be overexposed/scorched (${out[s1]}, ${out[s2]})`);
 const sat1=out[s1]-out[s1+1],sat2=out[s2]-out[s2+1];
 assert.ok(sat2>8&&Math.abs(sat1-sat2)<14,`Adjacent skin tones must keep smooth continuous warmth without gray/orange jump (${sat1} vs ${sat2})`);
});
test('image-tools.js, nid-scanner.js, and ToolLayout.astro upload icons, buttons, and ID card auto-detect work end-to-end',()=>{
 const fs=require('fs');
 const path=require('path');
 const layoutSrc=fs.readFileSync(path.join(__dirname,'../src/layouts/ToolLayout.astro'),'utf8');
 assert.ok(!layoutSrc.includes('[hidden], dialog:not([open]), .sr-only { display: none !important; }'),'ToolLayout.astro must not set display:none !important on .sr-only');
 assert.ok(layoutSrc.includes('.ds-empty-symbol svg'),'ToolLayout.astro must guarantee full hero sizing for .ds-empty-symbol svg');

 const nidSrc=fs.readFileSync(path.join(__dirname,'../public/js/nid-scanner.js'),'utf8');
 const imgSrc=fs.readFileSync(path.join(__dirname,'../public/js/image-tools.js'),'utf8');

 // Create lightweight DOM + 2D Canvas harness to run both scripts and test autoDetectCardQuad
 const makeCanvas=(w=300,h=200)=>{
  let cw=w,ch=h,buf=new Uint8ClampedArray(cw*ch*4);
  let tx=0,ty=0,rot=0,sx=1,sy=1;const stack=[];
  const c={
   get width(){return cw;},
   set width(v){cw=Math.max(1,v|0);buf=new Uint8ClampedArray(cw*ch*4);},
   get height(){return ch;},
   set height(v){ch=Math.max(1,v|0);buf=new Uint8ClampedArray(cw*ch*4);},
   _getBuf(){return buf;},
   _setPixels(arr){buf=new Uint8ClampedArray(arr);},
   getContext(){
    return {
     save(){stack.push([tx,ty,rot,sx,sy]);},
     restore(){const s=stack.pop();if(s){tx=s[0];ty=s[1];rot=s[2];sx=s[3];sy=s[4];}},
     translate(dx,dy){tx+=dx;ty+=dy;},
     scale(kx,ky){sx*=kx;sy*=ky;},
     rotate(r){rot+=r;},
     drawImage(src,dx=0,dy=0,dw,dh){
      if(src&&src._drawInto){src._drawInto(buf,cw,ch);return;}
      if(src&&src._getBuf){
       const sBuf=src._getBuf(),sw=src.width,sh=src.height;
       const wDst=dw||sw,hDst=dh||sh;
       const cosR=Math.cos(-rot),sinR=Math.sin(-rot);
       for(let y=0;y<ch;y++){
        for(let x=0;x<cw;x++){
         const rx=(x-tx),ry=(y-ty);
         const lx=(rx*cosR-ry*sinR)/sx-dx,ly=(rx*sinR+ry*cosR)/sy-dy;
         const u=Math.max(0,Math.min(sw-1,Math.round((lx/wDst)*sw)));
         const v=Math.max(0,Math.min(sh-1,Math.round((ly/hDst)*sh)));
         const si=(v*sw+u)*4,di=(y*cw+x)*4;
         buf[di]=sBuf[si];buf[di+1]=sBuf[si+1];buf[di+2]=sBuf[si+2];buf[di+3]=sBuf[si+3];
        }
       }
      }
     },
     getImageData(x=0,y=0,gw=cw,gh=ch){
      if(x===0&&y===0&&gw===cw&&gh===ch)return {data:new Uint8ClampedArray(buf),width:gw,height:gh};
      const sub=new Uint8ClampedArray(gw*gh*4);
      for(let r=0;r<gh;r++){
       const sy2=Math.max(0,Math.min(ch-1,y+r));
       for(let col=0;col<gw;col++){
        const sx2=Math.max(0,Math.min(cw-1,x+col));
        const si=(sy2*cw+sx2)*4,di=(r*gw+col)*4;
        sub[di]=buf[si];sub[di+1]=buf[si+1];sub[di+2]=buf[si+2];sub[di+3]=buf[si+3];
       }
      }
      return {data:sub,width:gw,height:gh};
     },
     createImageData(gw,gh){return {data:new Uint8ClampedArray(gw*gh*4),width:gw,height:gh};},
     putImageData(imgData){buf=new Uint8ClampedArray(imgData.data);}
    };
   }
  };
  return c;
 };
 const sandboxWin={
  document:{
   documentElement:{getAttribute:()=>'bn'},
   querySelector:()=>null,
   querySelectorAll:()=>[],
   createElement:(tag)=>tag==='canvas'?makeCanvas():{style:{},setAttribute(){},addEventListener(){},appendChild(){},remove(){}},
   addEventListener(){},
   body:{appendChild(){}}
  },
  window:null,
  location:{pathname:'/image/combine'},
  history:{replaceState(){},pushState(){}},
  navigator:{clipboard:{}},
  URL:{createObjectURL:()=>'blob:test',revokeObjectURL(){}},
  Image:function(){},
  Blob:function(){},
  ResizeObserver:function(){return {observe(){},disconnect(){}};},
  requestAnimationFrame:(fn)=>fn(),
  setTimeout:()=>1,
  clearTimeout(){},
  Math,Uint8Array,Uint8ClampedArray,Int16Array,Int32Array,Float32Array,Float64Array,Array,Object,String,Number,Boolean,RegExp,Promise,Error
 };
 sandboxWin.window=sandboxWin;
 sandboxWin.TechHatDocumentCore=core;
 const vm=require('vm');
 vm.runInNewContext(nidSrc,sandboxWin);
 vm.runInNewContext(imgSrc,sandboxWin);

 assert.ok(sandboxWin.TechHatImage&&typeof sandboxWin.TechHatImage.init==='function','TechHatImage must initialize without ReferenceError');
 assert.ok(sandboxWin.TechHatScanGeometry&&typeof sandboxWin.TechHatScanGeometry.rotate==='function'&&typeof sandboxWin.TechHatScanGeometry.warp==='function','TechHatScanGeometry must expose load, rotate, warp');
 assert.ok(sandboxWin.TechHatNidScanner&&typeof sandboxWin.TechHatNidScanner.autoDetectCardQuad==='function','TechHatNidScanner must expose autoDetectCardQuad');

 // Synthetic ID card on a white A4 flatbed scan (card occupies x=0.22..0.74, y=0.26..0.68)
 const synthImg={
  naturalWidth:340,naturalHeight:240,width:340,height:240,
  _drawInto(dst,cw,ch){
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     const inCard=nx>=0.22&&nx<=0.74&&ny>=0.26&&ny<=0.68;
     if(!inCard){
      dst[i]=248;dst[i+1]=249;dst[i+2]=250;dst[i+3]=255;
     }else{
      const onBorder=nx<0.235||nx>0.725||ny<0.28||ny>0.66;
      const inHeader=ny>=0.29&&ny<=0.36&&nx>=0.26&&nx<=0.70&&((x+y)%3===0);
      const inPhoto=nx>=0.25&&nx<=0.38&&ny>=0.38&&ny<=0.62;
      const inText=nx>=0.41&&nx<=0.70&&ny>=0.39&&ny<=0.63&&((y%4)<2)&&((x%3)<2);
      if(onBorder){dst[i]=40;dst[i+1]=55;dst[i+2]=75;}
      else if(inHeader){dst[i]=25;dst[i+1]=110;dst[i+2]=65;}
      else if(inPhoto){dst[i]=95;dst[i+1]=80;dst[i+2]=75;}
      else if(inText){dst[i]=30;dst[i+1]=35;dst[i+2]=42;}
      else{dst[i]=224;dst[i+1]=232;dst[i+2]=238;}
      dst[i+3]=255;
     }
    }
   }
  }
 };
 const det=sandboxWin.TechHatNidScanner.autoDetectCardQuad(synthImg,0,1,null,null,false);
 assert.ok(det&&det.auto&&det.pts&&det.pts.length===4,'autoDetectCardQuad must detect ID card on white A4 flatbed scan');
 assert.ok(Math.abs(det.pts[0].x-0.22)<0.06&&Math.abs(det.pts[0].y-0.26)<0.06,`Detected TL (${det.pts[0].x},${det.pts[0].y}) must lock near card TL (0.22,0.26)`);
 assert.ok(Math.abs(det.pts[2].x-0.74)<0.06&&Math.abs(det.pts[2].y-0.68)<0.06,`Detected BR (${det.pts[2].x},${det.pts[2].y}) must lock near card BR (0.74,0.68)`);

 // Verify Deliverable #3: maxSides = 2 enforced
 assert.equal(sandboxWin.TechHatNidScanner.maxSides,2,'NID scanner must enforce maxSides === 2');
 assert.ok(nidSrc.includes('var MAX_NID_SIDES = 2;')&&nidSrc.includes('syncNidAddLimitControls()'),'nid-scanner.js must define MAX_NID_SIDES = 2 and sync add-limit controls');

 // Verify Deliverable #2: studio-design.css sidebar thumbnails are full card aspect ratio, never squashed to h-8 (32px)
 const cssSrc=fs.readFileSync(path.join(__dirname,'../src/styles/studio-design.css'),'utf8');
 assert.ok(!/\.nid-card-tab\s*\{[^}]*\bh-8\b/.test(cssSrc),'studio-design.css must not squash .nid-card-tab to h-8 (32px)');
 assert.ok(cssSrc.includes('#img-pane-combine #nidCardTabs .nid-card-tab__thumb-wrap')&&cssSrc.includes('aspect-ratio: 1.586 / 1;'),'studio-design.css must enforce ID-card aspect ratio on sidebar thumbnails');

 // Verify Deliverable #4: Zoom loupe enabled by default and mounted inside #nidCanvasViewport
 const svelteSrc=fs.readFileSync(path.join(__dirname,'../src/components/NidCardScanner.svelte'),'utf8');
 assert.ok(!nidSrc.includes('if (!window._nidEnableLoupe)'),'nid-scanner.js must enable #nidCropLoupe by default during manual corner/edge crop');
 const vpPos=svelteSrc.indexOf('id="nidCanvasViewport"'),wrapClosePos=svelteSrc.indexOf('id="nidScanLaser"'),loupePos=svelteSrc.indexOf('id="nidCropLoupe"');
 assert.ok(vpPos>0&&loupePos>vpPos&&loupePos>wrapClosePos,'#nidCropLoupe must live inside #nidCanvasViewport outside #nidCropInteractiveWrap so it never clips');

 // Verify Deliverable #1: Perspective Smart NID Back card with specular white glare above PDF417 barcode + warm cream/red striped cloth
 const glareBackImg={
  naturalWidth:680,naturalHeight:510,width:680,height:510,
  _drawInto(dst,cw,ch){
   const q=[{x:cw*0.13,y:ch*0.26},{x:cw*0.79,y:ch*0.25},{x:cw*0.806,y:ch*0.818},{x:cw*0.12,y:ch*0.835}];
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     if(!inPoly(x,y,q)){
      // Smooth woven stripes on warm cream/beige cloth matching card luminance
      if(nx<0.50){dst[i]=168;dst[i+1]=30;dst[i+2]=28;}
      else{
       const stripe=Math.round(Math.sin(x*0.35)*7);
       dst[i]=206+stripe;dst[i+1]=185+stripe;dst[i+2]=168+stripe;
      }
      dst[i+3]=255;
     }else{
      // Top card rim has bright polycarbonate flash glare (244..250); barcode sits below rim (relY 0.045..0.135)
      const topEdgeY=0.26+(0.25-0.26)*((nx-0.13)/0.66);
      const rightEdgeX=0.79+(0.806-0.79)*((ny-0.25)/0.568);
      const relY=ny-topEdgeY;
      const onOuterShadow=relY<0.004||(rightEdgeX-nx)<0.004;
      const inBarcode=relY>=0.045&&relY<=0.135&&nx>=0.17&&nx<=0.755;
      const inGlareRim=relY<0.045||(rightEdgeX-nx)<0.035;
      const inAddr=relY>=0.17&&relY<=0.27&&nx>=0.16&&nx<=0.58&&((y%7)<2)&&((x%3)<2);
      const inMrz=relY>=0.38&&relY<=0.50&&nx>=0.16&&nx<=0.75&&((y%8)<3)&&((x%5)<3);
      if(onOuterShadow){
       dst[i]=155;dst[i+1]=148;dst[i+2]=142;
      }else if(inBarcode){
       const bar=((y%8)===0||(x%4)<2)?24:232;
       dst[i]=bar;dst[i+1]=bar+2;dst[i+2]=bar+2;
      }else if(inGlareRim){
       dst[i]=246;dst[i+1]=248;dst[i+2]=247;
      }else if(inAddr||inMrz){
       dst[i]=28;dst[i+1]=30;dst[i+2]=30;
      }else{
       dst[i]=202;dst[i+1]=210;dst[i+2]=207;
      }
      dst[i+3]=255;
     }
    }
   }
  }
 };
 const detBack=sandboxWin.TechHatNidScanner.autoDetectCardQuad(glareBackImg,0,1,null,null,true);
 assert.ok(detBack&&detBack.pts&&detBack.pts.length===4,'autoDetectCardQuad must detect perspective glared Smart NID Back card');
 assert.ok(detBack.pts[0].y<0.285&&detBack.pts[1].y<0.275,`Top edge (${detBack.pts[0].y}, ${detBack.pts[1].y}) must include white rim above barcode (<0.285), never snap to barcode (~0.302)`);
 assert.ok(Math.abs(detBack.pts[1].x-0.79)<0.035&&Math.abs(detBack.pts[2].x-0.806)<0.035,`Right edge (${detBack.pts[1].x}, ${detBack.pts[2].x}) must reject warm cream cloth and track perspective slope`);

 // Flatbed Smart NID Back on warm A4 scanner lid with bevel-lit bottom edge & 3-line MRZ
 const flatbedSmartBack={
  naturalWidth:744,naturalHeight:1024,width:744,height:1024,
  _drawInto(dst,cw,ch){
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     const inCard=nx>=0.321&&nx<=0.721&&ny>=0.082&&ny<=0.264;
     if(!inCard){
      if(nx>=0.321&&nx<=0.721&&ny>=0.079&&ny<0.082){
       dst[i]=150;dst[i+1]=145;dst[i+2]=142; // 2px top cast shadow
      }else{
       dst[i]=228;dst[i+1]=222;dst[i+2]=213; // warm flatbed lid (r-b = +15)
      }
      dst[i+3]=255;
     }else{
      const inBarcode=ny>=0.094&&ny<=0.125&&nx>=0.345&&nx<=0.698;
      const inGuilloche=ny>=0.132&&ny<=0.192;
      const inAddr=ny>=0.138&&ny<=0.178&&nx>=0.342&&nx<=0.56&&((y%5)<2)&&((x%3)<2);
      const inMrz=(Math.abs(ny-0.214)<0.004||Math.abs(ny-0.229)<0.004||Math.abs(ny-0.244)<0.004)&&nx>=0.345&&nx<=0.695&&((x%5)<3);
      if(inBarcode){
       const bar=((y%7)===0||(x%4)<2)?38:224;
       dst[i]=bar;dst[i+1]=bar;dst[i+2]=bar+2;
      }else if(inAddr||inMrz){
       dst[i]=55;dst[i+1]=52;dst[i+2]=54;
      }else if(inGuilloche){
       dst[i]=196;dst[i+1]=221;dst[i+2]=188;
      }else{
       dst[i]=224;dst[i+1]=221;dst[i+2]=219; // cool polycarbonate white rim (r-b = +5, same lum as lid!)
      }
      dst[i+3]=255;
     }
    }
   }
  }
 };
 const detFlatSmart=sandboxWin.TechHatNidScanner.autoDetectCardQuad(flatbedSmartBack,0,1,null,null,true);
 assert.ok(detFlatSmart&&detFlatSmart.pts&&detFlatSmart.pts.length===4,'autoDetectCardQuad must detect flatbed Smart NID Back');
 assert.ok(Math.abs(detFlatSmart.pts[0].y-0.082)<0.012&&Math.abs(detFlatSmart.pts[2].y-0.264)<0.012,`Flatbed Smart NID Back Y (${detFlatSmart.pts[0].y}, ${detFlatSmart.pts[2].y}) must lock onto (0.082, 0.264) and never cut MRZ (~0.244)`);
 assert.ok(Math.abs(detFlatSmart.pts[0].x-0.321)<0.015&&Math.abs(detFlatSmart.pts[1].x-0.721)<0.015,`Flatbed Smart NID Back X (${detFlatSmart.pts[0].x}, ${detFlatSmart.pts[1].x}) must lock onto (0.321, 0.721)`);

 // Flatbed Old Laminated Paper NID with 2px inner black printed border + 3.5mm white margin + asymmetric tan lamination pouch
 const flatbedOldLam={
  naturalWidth:744,naturalHeight:1024,width:744,height:1024,
  _drawInto(dst,cw,ch){
   const pX0=0.2823,pX1=0.6828,pY0=0.1270,pY1=0.3105;
   const lX0=pX0-0.020,lX1=pX1+0.038,lY0=pY0-0.014,lY1=pY1+0.016;
   const bX0=pX0+0.015,bX1=pX1-0.015,bY0=pY0+0.010,bY1=pY1-0.010;
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     let r=229,g=224,b=215;
     if(nx>=lX0&&nx<=lX1&&ny>=lY0&&ny<=lY1){r=205;g=199;b=198;}
     if(nx>=pX0&&nx<=pX1&&ny>=pY0&&ny<=pY1){
      r=212;g=214;b=226;
      const onFrame=((Math.abs(nx-bX0)<0.002||Math.abs(nx-bX1)<0.002)&&ny>=bY0&&ny<=bY1)||((Math.abs(ny-bY0)<0.002||Math.abs(ny-bY1)<0.002)&&nx>=bX0&&nx<=bX1);
      if(onFrame){r=42;g=42;b=48;}
      else if(nx>=bX0+0.01&&nx<=bX0+0.09&&ny>=bY0+0.04&&ny<=bY0+0.12){r=120;g=98;b=92;}
      else if(Math.hypot((nx-0.49)*cw,(ny-0.22)*ch)<cw*0.05){r=216;g=198;b=112;}
      else if(nx>=bX0+0.11&&nx<=bX1-0.04&&ny>=bY0+0.02&&ny<=bY1-0.02&&((y%9)<2)&&((x%4)<3)){r=48;g=48;b=55;}
     }
     dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=255;
    }
   }
  }
 };
 const detOldLam=sandboxWin.TechHatNidScanner.autoDetectCardQuad(flatbedOldLam,0,1,null,null,true);
 assert.ok(detOldLam&&detOldLam.pts&&detOldLam.pts.length===4,'autoDetectCardQuad must detect flatbed Old Laminated NID');
 assert.ok(Math.abs(detOldLam.pts[0].x-0.2823)<0.012&&Math.abs(detOldLam.pts[1].x-0.6828)<0.012,`Old Laminated NID X (${detOldLam.pts[0].x}, ${detOldLam.pts[1].x}) must lock onto white paper (0.2823, 0.6828), rejecting inner black frame (0.297, 0.668) and right pouch (0.721)`);
 assert.ok(Math.abs(detOldLam.pts[0].y-0.1270)<0.012&&Math.abs(detOldLam.pts[2].y-0.3105)<0.012,`Old Laminated NID Y (${detOldLam.pts[0].y}, ${detOldLam.pts[2].y}) must lock onto white paper (0.1270, 0.3105)`);

 // Asymmetric ultra-narrow (~3px) left white margin Old Laminated NID Back with 1px inner black frame + PDF417 barcode
 const narrowLeftOldLam={
  naturalWidth:416,naturalHeight:464,width:416,height:464,
  _drawInto(dst,cw,ch){
   const pX0=0.3317,pX1=0.8197,pY0=0.1379,pY1=0.4255;
   const lX0=pX0-0.024,lX1=pX1+0.031,lY0=pY0-0.019,lY1=pY1+0.021;
   const bX0=pX0+0.0082,bX1=pX1-0.019,bY0=pY0+0.014,bY1=pY1-0.014;
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     let r=229,g=224,b=215;
     if(nx>=lX0&&nx<=lX1&&ny>=lY0&&ny<=lY1){r=206;g=200;b=196;}
     if(nx>=pX0&&nx<=pX1&&ny>=pY0&&ny<=pY1){
      r=212;g=215;b=227;
      const onFrame=((Math.abs(nx-bX0)<0.0024||Math.abs(nx-bX1)<0.0024)&&ny>=bY0&&ny<=bY1)||((Math.abs(ny-bY0)<0.0024||Math.abs(ny-bY1)<0.0024)&&nx>=bX0&&nx<=bX1);
      if(onFrame){r=46;g=46;b=52;}
      else if(nx>=bX0+0.012&&nx<=bX1-0.012&&ny>=pY1-0.088&&ny<=bY1-0.012&&((x*7+y*3)%5<3)){r=54;g=54;b=60;}
      else if(nx>=bX0+0.015&&nx<=bX1-0.03&&ny>=bY0+0.02&&ny<=pY1-0.11&&((y%11)<2)&&((x%4)<3)){r=64;g=64;b=70;}
     }
     dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=255;
    }
   }
  }
 };
 const detNarrowOld=sandboxWin.TechHatNidScanner.autoDetectCardQuad(narrowLeftOldLam,0,1,null,null,true);
 assert.ok(detNarrowOld&&detNarrowOld.pts&&detNarrowOld.pts.length===4,'autoDetectCardQuad must detect narrow-margin Old Laminated NID Back');
 assert.ok(Math.abs(detNarrowOld.pts[0].x-0.3317)<0.011,`Narrow-margin Old NID left X (${detNarrowOld.pts[0].x}) must lock onto white paper (~0.3317), rejecting 1px inner black frame (~0.340) and outer pouch (~0.308)`);

 // Multi-object A4 scan: 2 side-by-side human passport photos above + 32%-wide Smart NID card below
 const multiObjectPhotosAndNid={
  naturalWidth:640,naturalHeight:880,width:640,height:880,
  _drawInto(dst,cw,ch){
   const cX0=0.325,cX1=0.645,cY0=0.315,cY1=0.458;
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     let r=218,g=219,b=222;
     // Left passport photo (blue backdrop + portrait)
     if(nx>=0.365&&nx<=0.495&&ny>=0.135&&ny<=0.278){
      r=22;g=92;b=178;
      if(Math.hypot((nx-0.43)*cw,(ny-0.20)*ch)<cw*0.038){r=165;g=128;b=108;}
      else if(ny>0.235&&Math.abs(nx-0.43)<0.055){r=48;g=68;b=88;}
     }
     // Right passport photo (white bordered portrait)
     if(nx>=0.525&&nx<=0.665&&ny>=0.125&&ny<=0.275){
      r=232;g=232;b=235;
      if(Math.abs(nx-0.525)<0.002||Math.abs(nx-0.665)<0.002||Math.abs(ny-0.125)<0.002||Math.abs(ny-0.275)<0.002){r=145;g=145;b=150;}
      else if(Math.hypot((nx-0.595)*cw,(ny-0.185)*ch)<cw*0.035){r=182;g=142;b=124;}
      else if(ny>0.228&&ny<0.268&&Math.abs(nx-0.595)<0.06){r=58;g=38;b=42;}
     }
     // Smart NID card below
     if(nx>=cX0&&nx<=cX1&&ny>=cY0&&ny<=cY1){
      r=184;g=202;b=198;
      if(ny<cY0+0.032){
       r=196;g=206;b=205;
       if(nx>=cX0+0.06&&nx<=cX1-0.06&&((y%5)<2)&&((x%3)<2)){r=58;g=64;b=68;}
      }else if(nx>=cX0+0.018&&nx<=cX0+0.095&&ny>=cY0+0.042&&ny<=cY1-0.024){
       r=126;g=128;b=134;
      }else if(Math.hypot((nx-0.505)*cw,(ny-0.392)*ch)<cw*0.036){
       r=198;g=176;b=186;
      }else if(nx>=cX1-0.075&&nx<=cX1-0.030&&ny>=0.380&&ny<=0.408){
       r=158;g=146;b=124;
      }else if(nx>=cX0+0.11&&nx<=cX0+0.24&&ny>=cY1-0.020&&ny<=cY1-0.011&&((x%3)<2)){
       r=48;g=52;b=58; // bold NID No digits near bottom margin
      }else if(nx>=cX0+0.11&&nx<=cX0+0.23&&ny>=cY0+0.045&&ny<=cY1-0.028&&((y%8)<2)&&((x%4)<3)){
       r=68;g=72;b=78;
      }
     }
     dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=255;
    }
   }
  }
 };
 const detMultiObj=sandboxWin.TechHatNidScanner.autoDetectCardQuad(multiObjectPhotosAndNid,0,1,null,null,true);
 assert.ok(detMultiObj&&detMultiObj.pts&&detMultiObj.pts.length===4,'autoDetectCardQuad must detect NID card on multi-object photo+NID scan');
 assert.ok(detMultiObj.pts[0].y>0.30&&Math.abs(detMultiObj.pts[0].y-0.315)<0.015,`Multi-object scan top Y (${detMultiObj.pts[0].y}) must ignore upper passport photos (0.125..0.278) and lock onto NID top (~0.315)`);
 assert.ok(Math.abs(detMultiObj.pts[2].y-0.458)<0.015,`Multi-object scan bottom Y (${detMultiObj.pts[2].y}) must include margin below NID No (~0.458)`);
 assert.ok(Math.abs(detMultiObj.pts[0].x-0.325)<0.015&&Math.abs(detMultiObj.pts[1].x-0.645)<0.015,`Multi-object scan X (${detMultiObj.pts[0].x}, ${detMultiObj.pts[1].x}) must lock onto (0.325, 0.645)`);

 // Smart NID inside clear rigid plastic badge holder with right lanyard clip slot
 const plasticBadgeHolderNid={
  naturalWidth:510,naturalHeight:680,width:510,height:680,
  _drawInto(dst,cw,ch){
   const hX0=0.025,hX1=0.962,hY0=0.252,hY1=0.676;
   const cX0=0.104,cX1=0.818,cY0=0.294,cY1=0.638;
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     let r=226,g=226,b=222;
     if(nx<0.11&&ny>0.22&&ny<0.72){r=148;g=146;b=142;} // left drop shadow
     if(nx>=hX0&&nx<=hX1&&ny>=hY0&&ny<=hY1){
      const onRim=Math.abs(nx-hX0)<0.010||Math.abs(nx-hX1)<0.010||Math.abs(ny-hY0)<0.010||Math.abs(ny-hY1)<0.010;
      r=onRim?118:166;g=onRim?116:164;b=onRim?108:154; // clear plastic holder rail + outer bevel + lanyard slot
      if(nx>0.865&&ny>0.41&&ny<0.50){r=112;g=96;b=74;} // lanyard clip
     }
     if(nx>=cX0&&nx<=cX1&&ny>=cY0&&ny<=cY1){
      const guil=Math.round(Math.sin(x*0.6+y*0.4)*6);
      r=198+guil;g=216+guil;b=206+guil; // inner Smart NID mint guilloche substrate
      if(Math.hypot((nx-(cX0+0.055))*cw,(ny-(cY0+0.045))*ch)<cw*0.028){r=208;g=58;b=52;} // red emblem
      else if(ny<cY0+0.065&&nx>=cX0+0.12&&nx<=cX1-0.12&&((y%7)<2)&&((x%5)<3)){r=102;g=112;b=108;} // header
      else if(nx>=cX0+0.02&&nx<=cX0+0.20&&ny>=cY0+0.09&&ny<=cY1-0.07){
       const pTex=((x*3+y*5)%7===0)?-18:0;
       r=106+pTex;g=108+pTex;b=108+pTex; // portrait
      }else if(nx>=cX1-0.19&&nx<=cX1-0.07&&ny>=0.45&&ny<=0.52){
       const cTex=(x%6===0||y%6===0)?-22:0;
       r=168+cTex;g=154+cTex;b=118+cTex; // gold IC chip with contact lines
      }else if(nx>=cX0+0.23&&nx<=cX0+0.60&&ny>=cY0+0.09&&ny<=cY1-0.03&&((y%11)<2)&&((x%5)<3)){
       r=104;g=112;b=108; // realistic anti-aliased text lines
      }
     }
     dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=255;
    }
   }
  }
 };
 const detHolder=sandboxWin.TechHatNidScanner.autoDetectCardQuad(plasticBadgeHolderNid,0,1,null,null,true);
 assert.ok(detHolder&&detHolder.pts&&detHolder.pts.length===4,'autoDetectCardQuad must detect Smart NID inside clear plastic badge holder');
 assert.ok(detHolder.pts[1].x<0.835&&Math.abs(detHolder.pts[1].x-0.818)<0.020,`Badge holder right X (${detHolder.pts[1].x}) must trim wide right lanyard slot (0.818..0.945) and lock onto inner card (~0.818)`);
 assert.ok(Math.abs(detHolder.pts[0].y-0.294)<0.018&&Math.abs(detHolder.pts[2].y-0.635)<0.018,`Badge holder Y (${detHolder.pts[0].y}, ${detHolder.pts[2].y}) must trim top/bottom plastic rails onto (0.294, 0.635)`);

 // Crisp 300-DPI Smart NID Front on A4 flatbed scan with bold black bottom Signature + NID No digits above faint cream card margin
 const crispBottomInkSmartA4={
  naturalWidth:668,naturalHeight:920,width:668,height:920,
  _drawInto(dst,cw,ch){
   const cX0=0.347,cX1=0.753,cY0=0.0978,cY1=0.2788;
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     let r=227,g=221,b=213; // warm cream-white flatbed scanner lid
     if(nx>=cX0&&nx<=cX1&&ny>=cY0&&ny<=cY1){
      const guil=Math.round(Math.sin(x*0.32)*2.5+Math.cos(y*0.29)*2.5);
      // Smart NID mint-green substrate blending smoothly into warm cream bottom margin
      const tCr=Math.max(0,Math.min(1,(ny-0.252)/0.018));
      r=Math.round(205*(1-tCr)+212*tCr)+guil;
      g=Math.round(215*(1-tCr)+205*tCr)+guil;
      b=Math.round(204*(1-tCr)+200*tCr)+guil;
      // Crisp top 1px border + header + red emblem + portrait + gold chip
      if(Math.abs(ny-cY0)<0.0018){r=75;g=82;b=78;}
      else if(Math.hypot((nx-(cX0+0.045))*cw,(ny-(cY0+0.032))*ch)<cw*0.022){r=210;g=56;b=48;}
      else if(ny>=cY0+0.012&&ny<=cY0+0.048&&nx>=cX0+0.10&&nx<=cX1-0.10&&((y%5)<2)&&((x%4)<3)){r=68;g=74;b=72;}
      else if(nx>=cX0+0.025&&nx<=cX0+0.19&&ny>=cY0+0.058&&ny<=0.245){
       const pTex=((x*3+y*5)%7===0)?-18:0;
       r=112+pTex;g=112+pTex;b=112+pTex;
      }else if(nx>=cX1-0.16&&nx<=cX1-0.05&&ny>=0.185&&ny<=0.218){
       r=166;g=152;b=116;
      }else if(nx>=cX0+0.22&&nx<=cX0+0.58&&ny>=cY0+0.062&&ny<=0.248&&((y%10)<2)&&((x%5)<3)){
       r=65;g=68;b=66;
      }
      // Collinear bold black cursive signature + NID No + 506 234 6597 at y=0.2575..0.2665 across 5 slices
      if(ny>=0.2575&&ny<=0.2665&&nx>=0.382&&nx<=0.642&&((x%5)<4)){
       r=24;g=24;b=24;
      }
     }
     dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=255;
    }
   }
  }
 };
 const detSmartA4=sandboxWin.TechHatNidScanner.autoDetectCardQuad(crispBottomInkSmartA4,0,1,null,null,true);
 assert.ok(detSmartA4&&detSmartA4.pts&&detSmartA4.pts.length===4,'autoDetectCardQuad must detect Smart NID Front on A4 scan');
 assert.ok(Math.abs(detSmartA4.pts[2].y-0.2788)<0.008&&Math.abs(detSmartA4.pts[3].y-0.2788)<0.008,`Smart NID A4 bottom Y (${detSmartA4.pts[3].y}, ${detSmartA4.pts[2].y}) must lock onto true card edge (~0.2788), never snapping to NID No digits (~0.258..0.267)`);

 // Old Laminated Paper NID Front on A4 flatbed scan: cool white paper with 1px black frame (ultra-narrow 2.5px right paper margin)
 // inside a wide (~16px) warm-yellowed clear lamination pouch on a cream scanner bed
 const wideYellowedPouchOldFrontA4={
  naturalWidth:668,naturalHeight:920,width:668,height:920,
  _drawInto(dst,cw,ch){
   const pX0=0.359,pX1=0.831,pY0=0.106,pY1=0.348; // outer lamination pouch
   const cX0=0.396,cX1=0.803,cY0=0.127,cY1=0.331; // inner cool-white paper card
   const fX0=0.414,fX1=0.799,fY0=0.139,fY1=0.315; // 1px printed black border (ultra-narrow 2.5px right margin!)
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     let r=229,g=222,b=212; // warm cream scanner bed
     if(nx>=pX0&&nx<=pX1&&ny>=pY0&&ny<=pY1){
      // Warm-aged clear lamination pouch + faint heat-seal outer rim
      const onPouchRim=(Math.abs(nx-pX0)<0.0025||Math.abs(nx-pX1)<0.0025||Math.abs(ny-pY0)<0.0022||Math.abs(ny-pY1)<0.0022);
      if(onPouchRim){r=198;g=189;b=175;}
      else{r=218;g=208;b=196;}
     }
     if(nx>=cX0&&nx<=cX1&&ny>=cY0&&ny<=cY1){
      // Paper cut-edge 1px bevel + cool optical-brightener white paper substrate
      const onCutEdge=(Math.abs(ny-cY0)<0.0014||Math.abs(ny-cY1)<0.0014||Math.abs(nx-cX0)<0.0018||Math.abs(nx-cX1)<0.0018);
      if(onCutEdge){r=190;g=184;b=183;}
      else{r=222;g=217;b=223;}
      // 1px black printed border frame + header divider
      const onBlackFrame=(
       ((Math.abs(nx-fX0)<0.0018||Math.abs(nx-fX1)<0.0018)&&ny>=fY0&&ny<=fY1)||
       ((Math.abs(ny-fY0)<0.0014||Math.abs(ny-fY1)<0.0014||Math.abs(ny-(fY0+0.052))<0.0014)&&nx>=fX0&&nx<=fX1)
      );
      if(onBlackFrame){r=118;g=114;b=118;}
      else if(Math.hypot((nx-0.618)*cw,(ny-0.242)*ch)<cw*0.072){r=216;g=198;b=118;} // yellow waterlily emblem
      else if(nx>=fX0+0.010&&nx<=fX0+0.095&&ny>=fY0+0.058&&ny<=fY1-0.040){r=132;g=102;b=92;} // portrait
      else if(nx>=fX0+0.115&&nx<=fX1-0.06&&ny>=fY0+0.012&&ny<=fY1-0.012&&((y%9)<2)&&((x%5)<3)){
       if(ny>fY1-0.032){r=195;g=62;b=68;}else{r=74;g=72;b=76;}
      }
     }
     dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=255;
    }
   }
  }
 };
 const detOldFrA4=sandboxWin.TechHatNidScanner.autoDetectCardQuad(wideYellowedPouchOldFrontA4,0,1,null,null,true);
 assert.ok(detOldFrA4&&detOldFrA4.pts&&detOldFrA4.pts.length===4,'autoDetectCardQuad must detect Old Laminated NID Front on A4 scan');
 assert.ok(Math.abs(detOldFrA4.pts[0].y-0.127)<0.009&&Math.abs(detOldFrA4.pts[1].y-0.127)<0.009,`Old NID Front top Y (${detOldFrA4.pts[0].y}, ${detOldFrA4.pts[1].y}) must lock onto white paper (~0.127), rejecting outer pouch (0.106) and 1px frame (0.139)`);
 assert.ok(Math.abs(detOldFrA4.pts[2].y-0.331)<0.009&&Math.abs(detOldFrA4.pts[3].y-0.331)<0.009,`Old NID Front bottom Y (${detOldFrA4.pts[3].y}, ${detOldFrA4.pts[2].y}) must lock onto white paper (~0.331), rejecting outer pouch (0.348) and 1px frame (0.315)`);
 assert.ok(Math.abs(detOldFrA4.pts[0].x-0.396)<0.010&&Math.abs(detOldFrA4.pts[1].x-0.803)<0.010,`Old NID Front X (${detOldFrA4.pts[0].x}, ${detOldFrA4.pts[1].x}) must lock onto white paper (~0.396..0.803), rejecting outer pouch (0.359..0.831)`);
});

(async () => {
 const fs=require('node:fs'),path=require('node:path');
 const nidSrc=fs.readFileSync(path.join(__dirname,'../public/js/nid-scanner.js'),'utf8');
 const makeEl=(id)=>{
  const attrs={'data-view':'preview'};
  const listeners={};
  return {
   id,hidden:false,value:'100',disabled:false,innerHTML:'',textContent:'',dataset:{},clientWidth:640,clientHeight:480,
   style:{setProperty(){}},
   classList:{toggle(){},add(){},remove(){},contains:()=>false},
   getAttribute:(k)=>attrs[k]||null,
   setAttribute:(k,v)=>{attrs[k]=String(v);},
   addEventListener(ev,fn){(listeners[ev]||(listeners[ev]=[])).push(fn);},
   click(){(listeners.click||[]).forEach((fn)=>fn({preventDefault(){},stopPropagation(){},currentTarget:this}));},
   appendChild(){},
   querySelector:()=>null,
   querySelectorAll:()=>[]
  };
 };
 const els={
  '#img-pane-combine':makeEl('img-pane-combine'),
  '#imgCombineDropzone':makeEl('imgCombineDropzone'),
  '#imgCombineStage':makeEl('imgCombineStage'),
  '#nidPreviewPanel':makeEl('nidPreviewPanel'),
  '#nidPaperLabel':makeEl('nidPaperLabel'),
  '#imgCombineOutMeta':makeEl('imgCombineOutMeta'),
  '#imgCombineSummary':makeEl('imgCombineSummary'),
  '#nidZoomFitBtn':makeEl('nidZoomFitBtn'),
  '#nidZoomOutBtn':makeEl('nidZoomOutBtn'),
  '#nidZoomInBtn':makeEl('nidZoomInBtn'),
  '#nidZoomPercent':makeEl('nidZoomPercent')
 };
 const makeMockCanvas=()=>{
  const c={width:160,height:100,_data:new Uint8ClampedArray(160*100*4)};
  c.toDataURL=()=>'data:image/jpeg;base64,AA==';
  c.toBlob=(cb)=>cb({size:1024});
  c.getContext=()=>new Proxy({
   measureText:()=>({width:10}),
   createLinearGradient:()=>({addColorStop(){}}),
   createRadialGradient:()=>({addColorStop(){}}),
   createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),
   getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h})
  },{get:(t,k)=>k in t?t[k]:()=>{}});
  return c;
 };
 els['#nidCropSourceCanvas']=makeMockCanvas();
 {
  const origGetCtx=els['#nidCropSourceCanvas'].getContext;
  els['#nidCropSourceCanvas']._sourceDrawCount=0;
  els['#nidCropSourceCanvas'].getContext=()=>{
   const base=origGetCtx();
   return new Proxy(base,{
    get:(t,k)=>k==='drawImage'
     ? (...args)=>{els['#nidCropSourceCanvas']._sourceDrawCount++;return t[k](...args);}
     : t[k]
   });
  };
 }
 els['#nidLivePreviewCanvas']=makeMockCanvas();
 const ratioPolyEl=makeEl('nidQuadPoly');
 els['#nidQuadPoly']=ratioPolyEl;
 els['#nidSnapRatioBtn']=makeEl('nidSnapRatioBtn');
 els['#nidSnapPortraitRatioBtn']=makeEl('nidSnapPortraitRatioBtn');
 const win={
  innerWidth:1280,
  addEventListener(){},
  removeEventListener(){},
  ResizeObserver:function(){return {observe(){},disconnect(){}};},
  document:{
   documentElement:{getAttribute:()=>'bn'},
   querySelector:(s)=>els[s]||(els[s]=makeEl(s)),
   querySelectorAll:()=>[],
   createElement:(t)=>t==='canvas'?makeMockCanvas():makeEl(t),
   addEventListener(){},
   body:{appendChild(){}}
  },
  TechHatScanGeometry:{
   load:(file)=>Promise.resolve({
    file,name:file.name,size:1000,type:'image/jpeg',width:320,height:200,url:'blob:'+file.name,
    img:{width:320,height:200,naturalWidth:320,naturalHeight:200}
   })
  },
  requestAnimationFrame:(fn)=>fn(),
  cancelAnimationFrame(){},
  setTimeout:()=>1,
  clearTimeout(){},
  URL:{createObjectURL:()=>'blob:x',revokeObjectURL(){}},
  Math,Uint8Array,Uint8ClampedArray,Int16Array,Int32Array,Float32Array,Float64Array,Array,Object,String,Number,Boolean,RegExp,Promise,Error
 };
 win.window=win;
 require('vm').runInNewContext(nidSrc,win);

 await win.TechHatNidScanner.addFiles([{name:'part1-front.jpg',type:'image/jpeg'}]);
 assert.equal(win.TechHatNidScanner.getCount(),1,'1st upload must add 1 side');
 assert.equal(win.TechHatNidScanner.getActiveIndex(),0,'1st upload must select index 0');

 // Simulate user switching to preview before uploading Part 2
 els['#img-pane-combine'].setAttribute('data-view','preview');
 await win.TechHatNidScanner.addFiles([{name:'part2-back.jpg',type:'image/jpeg'}]);
 assert.equal(win.TechHatNidScanner.getCount(),2,'2nd upload must add 2nd side');
 assert.equal(win.TechHatNidScanner.getActiveIndex(),1,'2nd upload must automatically switch activeNidIdx to 1 (2nd image)');
 assert.equal(els['#img-pane-combine'].getAttribute('data-view'),'split','2nd upload must restore split view so 2nd image shows in crop editor immediately');
 passed++;
 console.log('✓ NID Scanner sequential 2-part upload automatically selects the 2nd uploaded image and restores crop view');

 // Verify clicking Portrait / Landscape crop ratio buttons changes ONLY crop box ratio without rotating the page
 const polySpan=(ptsStr)=>{
  const pairs=String(ptsStr||'').trim().split(/\s+/).map((s)=>s.split(',').map(Number));
  if(pairs.length<4)return {w:0,h:0};
  const xs=pairs.map((p)=>p[0]),ys=pairs.map((p)=>p[1]);
  return {w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
 };
 const drawsBeforePortrait=els['#nidCropSourceCanvas']._sourceDrawCount;
 const srcWBefore=els['#nidCropSourceCanvas'].width,srcHBefore=els['#nidCropSourceCanvas'].height;
 els['#nidSnapPortraitRatioBtn'].click();
 assert.equal(els['#nidSnapPortraitRatioBtn'].getAttribute('aria-pressed'),'true','Clicking Portrait button must activate Portrait ratio state');
 assert.equal(els['#nidSnapRatioBtn'].getAttribute('aria-pressed'),'false','Clicking Portrait button must deactivate Landscape ratio state');
 assert.equal(els['#nidCropSourceCanvas']._sourceDrawCount,drawsBeforePortrait,'Clicking Portrait button must NOT redraw/rotate the source page canvas');
 assert.equal(els['#nidCropSourceCanvas'].width,srcWBefore,'Page canvas width must stay unchanged on Portrait click');
 assert.equal(els['#nidCropSourceCanvas'].height,srcHBefore,'Page canvas height must stay unchanged on Portrait click');
 const portSpan=polySpan(ratioPolyEl.getAttribute('points'));
 assert.ok(portSpan.h>portSpan.w&&Math.abs((portSpan.h/portSpan.w)-(85.6/53.98))<0.05,`Clicking Portrait must switch SVG crop box ratio to tall Portrait (h/w=${(portSpan.h/Math.max(1,portSpan.w)).toFixed(3)})`);

 els['#nidSnapRatioBtn'].click();
 assert.equal(els['#nidSnapRatioBtn'].getAttribute('aria-pressed'),'true','Clicking Landscape button must activate Landscape ratio state');
 assert.equal(els['#nidCropSourceCanvas']._sourceDrawCount,drawsBeforePortrait,'Clicking Landscape button must NOT redraw/rotate the source page canvas');
 const landSpan=polySpan(ratioPolyEl.getAttribute('points'));
 assert.ok(landSpan.w>landSpan.h&&Math.abs((landSpan.w/landSpan.h)-(85.6/53.98))<0.05,`Clicking Landscape must switch SVG crop box ratio back to wide Landscape (w/h=${(landSpan.w/Math.max(1,landSpan.h)).toFixed(3)})`);
 passed++;
 console.log('✓ Clicking Portrait / Landscape changes ONLY crop quad ratio without rotating the page');

 // Verify Portrait ID card detection keeps portrait orientation upright without rotating 90 deg sideways
 const portraitIdImg={
  naturalWidth:320,naturalHeight:440,width:320,height:440,
  _drawInto(dst,cw,ch){
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     const inCard=nx>=0.22&&nx<=0.76&&ny>=0.14&&ny<=0.72;
     let r=245,g=246,b=248;
     if(inCard){
      const onBorder=nx<0.235||nx>0.745||ny<0.155||ny>0.705;
      const inHeader=ny>=0.16&&ny<=0.23&&nx>=0.25&&nx<=0.73;
      const inAvatar=ny>=0.25&&ny<=0.43&&nx>=0.37&&nx<=0.61;
      const inRows=ny>=0.46&&ny<=0.68&&nx>=0.27&&nx<=0.71&&((y%5)<2)&&((x%3)<2);
      if(onBorder){r=42;g=58;b=78;}
      else if(inHeader){r=28;g=115;b=68;}
      else if(inAvatar){r=92;g=78;b=74;}
      else if(inRows){r=32;g=36;b=44;}
      else{r=228;g=234;b=240;}
     }
     dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=255;
    }
   }
  }
 };
 const makeRealCanvas=()=>{
  let cw=160,ch=100,buf=new Uint8ClampedArray(cw*ch*4);
  const ctx={
   fillStyle:'#fff',imageSmoothingEnabled:true,imageSmoothingQuality:'high',
   _drawCalls:[],
   fillRect(x,y,w,h){ctx._drawCalls.push({op:'fillRect',x,y,w,h});},
   save(){},restore(){},beginPath(){},clip(){},translate(){},rotate(){},scale(){},
   moveTo(){},lineTo(){},arcTo(){},quadraticCurveTo(){},rect(){},arc(){},closePath(){},stroke(){},strokeRect(){},setLineDash(){},
   drawImage(src,dx=0,dy=0,dw,dh){
    const wDst=Math.round(dw||src.width||cw),hDst=Math.round(dh||src.height||ch);
    ctx._drawCalls.push({op:'drawImage',x:dx,y:dy,w:wDst,h:hDst});
    if(src&&typeof src._drawInto==='function'){src._drawInto(buf,cw,ch);return;}
    if(src&&typeof src._getBuf==='function'){
     const sBuf=src._getBuf(),sw=src.width,sh=src.height;
     for(let y=0;y<hDst&&y<ch;y++){
      for(let x=0;x<wDst&&x<cw;x++){
       const u=Math.max(0,Math.min(sw-1,Math.floor((x/Math.max(1,wDst))*sw)));
       const v=Math.max(0,Math.min(sh-1,Math.floor((y/Math.max(1,hDst))*sh)));
       const si=(v*sw+u)*4,di=((Math.max(0,dy|0)+y)*cw+(Math.max(0,dx|0)+x))*4;
       if(di+3<buf.length){buf[di]=sBuf[si];buf[di+1]=sBuf[si+1];buf[di+2]=sBuf[si+2];buf[di+3]=sBuf[si+3];}
      }
     }
    }
   },
   getImageData(x=0,y=0,gw=cw,gh=ch){
    const sub=new Uint8ClampedArray(gw*gh*4);
    for(let r=0;r<gh;r++){
     const sy=Math.max(0,Math.min(ch-1,y+r));
     for(let col=0;col<gw;col++){
      const sx=Math.max(0,Math.min(cw-1,x+col));
      const si=(sy*cw+sx)*4,di=(r*gw+col)*4;
      sub[di]=buf[si];sub[di+1]=buf[si+1];sub[di+2]=buf[si+2];sub[di+3]=buf[si+3];
     }
    }
    return {data:sub,width:gw,height:gh};
   },
   createImageData:(gw,gh)=>({data:new Uint8ClampedArray(gw*gh*4),width:gw,height:gh}),
   putImageData(imgData){buf=new Uint8ClampedArray(imgData.data);}
  };
  const c={
   get width(){return cw;},set width(v){cw=Math.max(1,v|0);buf=new Uint8ClampedArray(cw*ch*4);},
   get height(){return ch;},set height(v){ch=Math.max(1,v|0);buf=new Uint8ClampedArray(cw*ch*4);},
   _getBuf:()=>buf,
   getContext:()=>ctx,
   toDataURL:()=>'data:image/jpeg;base64,AA==',
   toBlob:(cb)=>cb({size:1024})
  };
  return c;
 };
 const portWin={
  document:{documentElement:{getAttribute:()=>'bn'},querySelector:()=>null,querySelectorAll:()=>[],createElement:(t)=>t==='canvas'?makeRealCanvas():makeEl(t),addEventListener(){},body:{appendChild(){}}},
  Math,Uint8Array,Uint8ClampedArray,Int16Array,Int32Array,Float32Array,Float64Array,Array,Object,String,Number,Boolean,RegExp,Promise,Error
 };
 portWin.window=portWin;
 require('vm').runInNewContext(nidSrc,portWin);

 const detPortrait=portWin.TechHatNidScanner.autoDetectCardQuad(portraitIdImg,0,1,null,null,true,'portrait');
 assert.ok(detPortrait&&detPortrait.auto&&detPortrait.pts&&detPortrait.pts.length===4,'autoDetectCardQuad portrait mode must detect portrait ID card');
 assert.equal(detPortrait.rot,0,'Portrait ID detection must keep portrait orientation upright (rot === 0) without rotating sideways');
 const pW=(detPortrait.pts[1].x-detPortrait.pts[0].x)*portraitIdImg.width;
 const pH=(detPortrait.pts[3].y-detPortrait.pts[0].y)*portraitIdImg.height;
 assert.ok(pH>pW,`Portrait detected box must remain taller than wide (h=${pH.toFixed(1)}, w=${pW.toFixed(1)})`);
 assert.ok(Math.abs(detPortrait.pts[0].x-0.22)<0.06&&Math.abs(detPortrait.pts[1].x-0.76)<0.06,'Portrait detected X must align near card left/right');
 assert.ok(Math.abs(detPortrait.pts[0].y-0.14)<0.06&&Math.abs(detPortrait.pts[2].y-0.72)<0.06,'Portrait detected Y must align near card top/bottom');
 passed++;
 console.log('✓ Portrait ID card detection keeps upright 54×85.6 orientation without sideways rotation');

 // Verify fixed ISO CR80 aspect ratio is preserved in rendered card even when manual crop quad is stretched square
 const widePhoto={naturalWidth:320,naturalHeight:240,width:320,height:240,_drawInto(dst){dst.fill(230);}};
 const stretchedQuad=[{x:0.10,y:0.08},{x:0.82,y:0.08},{x:0.82,y:0.86},{x:0.10,y:0.86}];
 const landOut=portWin.TechHatNidScanner.renderProcessedCardCanvas({item:{img:widePhoto},rot:0,flipH:1,fineAngle:0,pts:stretchedQuad,cardOrient:'landscape'},'original',100,100,100,20,true,false,false);
 const landAspect=landOut.width/landOut.height;
 assert.ok(Math.abs(landAspect-(85.6/53.98))<0.025,`Stretched crop quad in Landscape must lock preview aspect to 85.6/53.98 (~1.586), got ${landAspect.toFixed(3)} (${landOut.width}x${landOut.height})`);
 const portOut=portWin.TechHatNidScanner.renderProcessedCardCanvas({item:{img:portraitIdImg},rot:0,flipH:1,fineAngle:0,pts:stretchedQuad,cardOrient:'portrait'},'original',100,100,100,20,true,false,false);
 const portAspect=portOut.width/portOut.height;
 assert.ok(Math.abs(portAspect-(53.98/85.6))<0.025,`Stretched crop quad in Portrait must lock preview aspect to 53.98/85.6 (~0.631), got ${portAspect.toFixed(3)} (${portOut.width}x${portOut.height})`);
 passed++;
 console.log('✓ Manual stretched crop quad preserves exact ISO CR80 aspect ratio in both Landscape and Portrait preview');

 // Verify Actual ID Size (506 => 85.6×54mm) & Portrait sheet layout & Card-Only printWidthMm
 const sheetCanvas=makeRealCanvas();
 const landCardMock=makeRealCanvas(); landCardMock.width=856; landCardMock.height=540;
 const a4Dims=portWin.TechHatNidScanner.composeCombineSheetCanvas(sheetCanvas,[landCardMock,landCardMock],{mode:'nid-a4',gap:36,bg:'#ffffff',alignMode:'top',copySets:1,roundCorner:true,showBorder:true,showCutMarks:false,cardWInput:506},2);
 const drawnLand=sheetCanvas.getContext('2d')._drawCalls.filter((d)=>d.op==='drawImage');
 assert.equal(a4Dims.fullW,2480,'A4 sheet width must be 2480px');
 assert.equal(a4Dims.printWidthMm,210,'A4 printWidthMm must be 210mm');
 assert.equal(drawnLand[0].w,1012,'Actual ID Size (506) on 300-DPI A4 must render card width 1012px (~85.69mm)');
 assert.equal(drawnLand[0].h,638,'Actual ID Size (506) on 300-DPI A4 must render card height 638px (~54.02mm)');

 const cardOnlySheet=makeRealCanvas();
 const vertDims=portWin.TechHatNidScanner.composeCombineSheetCanvas(cardOnlySheet,[landCardMock,landCardMock],{mode:'vertical',gap:36,bg:'#ffffff',alignMode:'top',copySets:1,roundCorner:true,showBorder:true,showCutMarks:false,cardWInput:506},2);
 assert.equal(vertDims.fullW,1012+36*4,'Vertical Actual ID Size sheet fullW must tightly wrap 1012px card + padding');
 assert.ok(Math.abs(vertDims.printWidthMm-(vertDims.fullW*210/2480))<0.1,'Vertical card-only printWidthMm must match physical 300-DPI mm width instead of 210mm');

 const portSheet=makeRealCanvas();
 const portCardMock=makeRealCanvas(); portCardMock.width=540; portCardMock.height=856;
 portWin.TechHatNidScanner.composeCombineSheetCanvas(portSheet,[portCardMock,portCardMock],{mode:'nid-a4',gap:36,bg:'#ffffff',alignMode:'top',copySets:1,roundCorner:true,showBorder:true,showCutMarks:false,cardWInput:506},2);
 const drawnPort=portSheet.getContext('2d')._drawCalls.filter((d)=>d.op==='drawImage');
 assert.equal(drawnPort[0].w,638,'Portrait Actual ID Size on 300-DPI A4 must render width 638px (~54.02mm)');
 assert.equal(drawnPort[0].h,1012,'Portrait Actual ID Size on 300-DPI A4 must render height 1012px (~85.69mm)');
 passed++;
 console.log('✓ Actual ID Size (85.6×54mm) & Portrait card sheet composition and printWidthMm verified');

 // Verify real Portrait ID Card with blue header banner + landscape photo frame is detected accurately
 const blueBannerPortraitOnDesk={
  naturalWidth:520,naturalHeight:420,width:520,height:420,
  _drawInto(dst,cw,ch){
   const cX0=0.35,cX1=0.61,cY0=0.14,cY1=0.66; // tall 54:85.6 portrait card (135px x 218px, h/w ~ 1.61) on cream flatbed/desk
   for(let y=0;y<ch;y++){
    for(let x=0;x<cw;x++){
     const nx=x/cw,ny=y/ch,i=(y*cw+x)*4;
     let r=230,g=225,b=216;
     if(nx>=cX0&&nx<=cX1&&ny>=cY0&&ny<=cY1){
      if(ny<=cY0+0.10){r=24;g=68;b=168;} // dark navy/royal-blue vertical ID top banner
      else if(nx>=cX0+0.06&&nx<=cX1-0.06&&ny>=cY0+0.13&&ny<=cY0+0.30){r=108;g=84;b=76;} // centered portrait photo
      else if(nx>=cX0+0.04&&nx<=cX1-0.04&&ny>=cY0+0.33&&ny<=cY1-0.08&&((y%7)<2)&&((x%4)<3)){r=34;g=38;b=44;} // bottom details/barcode
      else if(ny>=cY1-0.055){r=28;g=72;b=164;} // bottom accent bar
      else{r=234;g=238;b=242;}
     }
     dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=255;
    }
   }
  }
 };
 const detBluePort=portWin.TechHatNidScanner.autoDetectCardQuad(blueBannerPortraitOnDesk,0,1,null,null,false,'portrait');
 assert.ok(detBluePort&&!detBluePort.fallback&&detBluePort.pts&&detBluePort.pts.length===4,'Portrait mode must auto-detect vertical Portrait ID card with blue header banner without fallback');
 assert.equal(detBluePort.rot,0,'Portrait detection on wide photo must not rotate page');
 assert.ok(Math.abs(detBluePort.pts[0].x-0.35)<0.035&&Math.abs(detBluePort.pts[1].x-0.61)<0.035,`Blue-header Portrait ID X (${detBluePort.pts[0].x.toFixed(3)}..${detBluePort.pts[1].x.toFixed(3)}) must lock near (0.35..0.61)`);
 assert.ok(Math.abs(detBluePort.pts[0].y-0.14)<0.035&&Math.abs(detBluePort.pts[2].y-0.66)<0.035,`Blue-header Portrait ID Y (${detBluePort.pts[0].y.toFixed(3)}..${detBluePort.pts[2].y.toFixed(3)}) must include blue top header & bottom bar (0.14..0.66)`);

 // Verify interactive click on Portrait (#nidSnapPortraitRatioBtn) & Dropzone pre-select (#nidDropOrientPortrait) auto-detect Portrait ID card WITHOUT rotating page
 const pDomEls={
  '#img-pane-combine':makeEl('img-pane-combine'),
  '#imgCombineDropzone':makeEl('imgCombineDropzone'),
  '#imgCombineStage':makeEl('imgCombineStage'),
  '#nidPreviewPanel':makeEl('nidPreviewPanel'),
  '#nidPaperLabel':makeEl('nidPaperLabel'),
  '#imgCombineOutMeta':makeEl('imgCombineOutMeta'),
  '#imgCombineSummary':makeEl('imgCombineSummary'),
  '#nidZoomFitBtn':makeEl('nidZoomFitBtn'),
  '#nidZoomOutBtn':makeEl('nidZoomOutBtn'),
  '#nidZoomInBtn':makeEl('nidZoomInBtn'),
  '#nidZoomPercent':makeEl('nidZoomPercent'),
  '#nidQuadPoly':makeEl('nidQuadPoly'),
  '#nidSnapRatioBtn':makeEl('nidSnapRatioBtn'),
  '#nidSnapPortraitRatioBtn':makeEl('nidSnapPortraitRatioBtn'),
  '#nidDropOrientLandscape':makeEl('nidDropOrientLandscape'),
  '#nidDropOrientPortrait':makeEl('nidDropOrientPortrait'),
  '#imgCombineClearBtn':makeEl('imgCombineClearBtn')
 };
 pDomEls['#nidCropSourceCanvas']=makeRealCanvas();
 pDomEls['#nidLivePreviewCanvas']=makeRealCanvas();
 {
  const origGetCtx=pDomEls['#nidCropSourceCanvas'].getContext;
  pDomEls['#nidCropSourceCanvas']._sourceDrawCount=0;
  pDomEls['#nidCropSourceCanvas'].getContext=()=>{
   const c=origGetCtx();
   if(!c._wrapped){
    const origDraw=c.drawImage.bind(c);
    c.drawImage=(...args)=>{pDomEls['#nidCropSourceCanvas']._sourceDrawCount++;return origDraw(...args);};
    c._wrapped=true;
   }
   return c;
  };
 }
 const pDomWin={
  innerWidth:1280,
  addEventListener(){},
  removeEventListener(){},
  ResizeObserver:function(){return {observe(){},disconnect(){}};},
  document:{
   documentElement:{getAttribute:()=>'bn'},
   querySelector:(s)=>pDomEls[s]||(pDomEls[s]=makeEl(s)),
   querySelectorAll:()=>[],
   createElement:(t)=>t==='canvas'?makeRealCanvas():makeEl(t),
   addEventListener(){},
   body:{appendChild(){}}
  },
  TechHatScanGeometry:{load:(file)=>Promise.resolve({file,name:file.name,size:1000,type:'image/jpeg',width:blueBannerPortraitOnDesk.width,height:blueBannerPortraitOnDesk.height,url:'blob:'+file.name,img:blueBannerPortraitOnDesk})},
  requestAnimationFrame:(fn)=>fn(),
  cancelAnimationFrame(){},
  setTimeout:()=>1,
  clearTimeout(){},
  URL:{createObjectURL:()=>'blob:x',revokeObjectURL(){}},
  Math,Uint8Array,Uint8ClampedArray,Int16Array,Int32Array,Float32Array,Float64Array,Array,Object,String,Number,Boolean,RegExp,Promise,Error
 };
 pDomWin.window=pDomWin;
 require('vm').runInNewContext(nidSrc,pDomWin);
 // Test A: Pre-select Portrait on Dropzone -> upload automatically detects Portrait card
 pDomEls['#nidDropOrientPortrait'].click();
 assert.equal(pDomEls['#nidDropOrientPortrait'].getAttribute('aria-pressed'),'true','Dropzone Portrait button must activate Portrait state before upload');
 await pDomWin.TechHatNidScanner.addFiles([{name:'portrait-preselect.jpg',type:'image/jpeg'}]);
 const prePts=String(pDomEls['#nidQuadPoly'].getAttribute('points')||'').trim().split(/\s+/).map((s)=>s.split(',').map(Number));
 assert.equal(prePts.length,4,'Pre-selected Portrait upload must render 4 quad points');
 const preXs=prePts.map((p)=>p[0]),preYs=prePts.map((p)=>p[1]);
 const preW=Math.max(...preXs)-Math.min(...preXs),preH=Math.max(...preYs)-Math.min(...preYs);
 const cwSrc=pDomEls['#nidCropSourceCanvas'].width,chSrc=pDomEls['#nidCropSourceCanvas'].height;
 assert.ok(preH>preW&&Math.abs((Math.min(...preXs)/cwSrc)-0.35)<0.04&&Math.abs((Math.max(...preXs)/cwSrc)-0.61)<0.04,`Pre-selected Portrait upload must auto-detect portrait card X bounds (got ${(Math.min(...preXs)/cwSrc).toFixed(3)}..${(Math.max(...preXs)/cwSrc).toFixed(3)})`);
 assert.ok(Math.abs((Math.min(...preYs)/chSrc)-0.14)<0.04&&Math.abs((Math.max(...preYs)/chSrc)-0.66)<0.04,`Pre-selected Portrait upload must auto-detect portrait card Y bounds (got ${(Math.min(...preYs)/chSrc).toFixed(3)}..${(Math.max(...preYs)/chSrc).toFixed(3)})`);

 // Test B: Clear, switch back to Landscape, re-upload in Landscape first, then click #nidSnapPortraitRatioBtn -> detects Portrait card WITHOUT rotating page
 pDomEls['#imgCombineClearBtn'].click();
 assert.equal(pDomEls['#nidDropOrientLandscape'].getAttribute('aria-pressed'),'true','Clear button must reset Dropzone orientation to Landscape');
 pDomWin.TechHatNidScanner.setCardOrient('landscape');
 await pDomWin.TechHatNidScanner.addFiles([{name:'portrait-later.jpg',type:'image/jpeg'}]);
 const drawsBeforeSwitch=pDomEls['#nidCropSourceCanvas']._sourceDrawCount;
 pDomEls['#nidSnapPortraitRatioBtn'].click();
 assert.equal(pDomEls['#nidCropSourceCanvas']._sourceDrawCount,drawsBeforeSwitch,'Clicking #nidSnapPortraitRatioBtn must NOT redraw/rotate the page canvas');
 const clickPts=String(pDomEls['#nidQuadPoly'].getAttribute('points')||'').trim().split(/\s+/).map((s)=>s.split(',').map(Number));
 const clickXs=clickPts.map((p)=>p[0]),clickYs=clickPts.map((p)=>p[1]);
 assert.ok(Math.abs((Math.min(...clickXs)/cwSrc)-0.35)<0.04&&Math.abs((Math.max(...clickXs)/cwSrc)-0.61)<0.04,'Clicking #nidSnapPortraitRatioBtn must auto-detect Portrait ID card X edges on the loaded image');
 assert.ok(Math.abs((Math.min(...clickYs)/chSrc)-0.14)<0.04&&Math.abs((Math.max(...clickYs)/chSrc)-0.66)<0.04,'Clicking #nidSnapPortraitRatioBtn must auto-detect Portrait ID card Y edges on the loaded image');
 passed++;
 console.log('✓ Selecting Portrait ID card auto-detects Portrait card (both pre-upload & on toolbar click) without rotating page');

 // Verify Svelte UI structure for requested toolbar & sidebar & print preset layout changes
 const svelteSrc=fs.readFileSync(path.join(__dirname,'../src/components/NidCardScanner.svelte'),'utf8');
 assert.ok(!svelteSrc.includes('id="nidSnapEdgesBtn"')&&!svelteSrc.includes('id="nidMobSnapEdges"'),'Duplicate Snap Edges button must be removed');
 assert.ok(svelteSrc.includes('id="nidSnapRatioBtn"')&&svelteSrc.includes('id="nidSnapPortraitRatioBtn"'),'Landscape and Portrait ID ratio buttons must both exist in desktop toolbar');
 assert.ok(svelteSrc.includes('id="nidMobSnapRatio"')&&svelteSrc.includes('id="nidMobSnapPortrait"'),'Landscape and Portrait ID ratio pills must both exist on mobile');
 assert.ok(svelteSrc.includes('id="nidDropOrientLandscape"')&&svelteSrc.includes('id="nidDropOrientPortrait"'),'Dropzone pre-upload card orientation pills must exist');
 const pagesSidebarIdx=svelteSrc.indexOf('id="nidPagesSidebar"');
 const clearIdx=svelteSrc.indexOf('id="imgCombineClearBtn"');
 const rotLIdx=svelteSrc.indexOf('id="nidRotLBtn"');
 assert.ok(pagesSidebarIdx!==-1&&clearIdx>pagesSidebarIdx&&rotLIdx>clearIdx,'Clear & Start Over button (#imgCombineClearBtn) must be relocated inside the left sidebar before the top toolbar');
 const clearBtnEnd=svelteSrc.indexOf('</button>',clearIdx);
 const clearBtnSnippet=svelteSrc.slice(clearIdx,clearBtnEnd);
 assert.ok(clearBtnEnd>clearIdx&&!clearBtnSnippet.includes('sr-only')&&clearBtnSnippet.includes('সব মুছে নতুন শুরু'),'#imgCombineClearBtn must show visible label text');
 const previewTabIdx=svelteSrc.indexOf('data-nid-canvas-view="preview"');
 const undoIdx=svelteSrc.indexOf('id="nidUndoBtn"');
 const redoIdx=svelteSrc.indexOf('id="nidRedoBtn"');
 assert.ok(previewTabIdx!==-1&&undoIdx>previewTabIdx&&redoIdx>undoIdx,'Undo/Redo buttons must be placed at the far-right end of the toolbar');
 assert.ok(svelteSrc.includes('id="imgCombineCardW"')&&svelteSrc.includes('data-cardw="506"')&&svelteSrc.includes('id="nidSizePresets"')&&svelteSrc.includes('id="nidQuickPrintSizeBar"'),'Actual ID Size (85.6×54mm) print presets & CardW input must be present');
 passed++;
 console.log('✓ NidCardScanner.svelte toolbar, sidebar clear button, orientation buttons & print size presets verified');
 console.log(`${passed} document scan tests passed`);
})().catch((err)=>{console.error(err);process.exit(1);});
