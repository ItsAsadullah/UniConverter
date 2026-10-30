/* Independent, deterministic document detection and enhancement. Also used in the scan worker. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TechHatDocumentCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function cross(a,b,c) { return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x); }
  function area(p) { var s=0; for(var i=0;i<p.length;i++){var q=p[(i+1)%p.length];s+=p[i].x*q.y-q.x*p[i].y;}return Math.abs(s)/2; }
  function full() { return [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]; }
  function hull(points) {
    points.sort(function(a,b){return a.x-b.x||a.y-b.y;});
    var a=[],b=[];
    for(var i=0;i<points.length;i++){while(a.length>1&&cross(a[a.length-2],a[a.length-1],points[i])<=0)a.pop();a.push(points[i]);}
    for(i=points.length-1;i>=0;i--){while(b.length>1&&cross(b[b.length-2],b[b.length-1],points[i])<=0)b.pop();b.push(points[i]);}
    a.pop();b.pop();return a.concat(b);
  }
  function quadFromHull(p) {
    p=p.slice();
    while(p.length>4){var idx=0,best=Infinity;for(var i=0;i<p.length;i++){var v=Math.abs(cross(p[(i+p.length-1)%p.length],p[i],p[(i+1)%p.length]));if(v<best){best=v;idx=i;}}p.splice(idx,1);}
    if(p.length!==4)return null;
    var start=0;for(var j=1;j<4;j++)if(p[j].x+p[j].y<p[start].x+p[start].y)start=j;
    return p.slice(start).concat(p.slice(0,start));
  }
  function validQuad(p) {
    if(!p||p.length!==4||p.some(function(v){return !Number.isFinite(v.x)||!Number.isFinite(v.y)||v.x<-.15||v.x>1.15||v.y<-.15||v.y>1.15;}))return false;
    var sign=0;for(var i=0;i<4;i++){var c=cross(p[i],p[(i+1)%4],p[(i+2)%4]);if(Math.abs(c)<.00005)return false;if(sign&&Math.sign(c)!==sign)return false;sign=Math.sign(c);}
    return area(p)>.008;
  }
  function plausiblePhotoQuad(q,w,h){
    if(!validQuad(q))return false;
    var P=q.map(function(p){return {x:p.x*w,y:p.y*h};});
    var topW=Math.hypot(P[1].x-P[0].x,P[1].y-P[0].y),bottomW=Math.hypot(P[2].x-P[3].x,P[2].y-P[3].y);
    var rightH=Math.hypot(P[2].x-P[1].x,P[2].y-P[1].y),leftH=Math.hypot(P[3].x-P[0].x,P[3].y-P[0].y);
    if(Math.min(topW,bottomW,rightH,leftH)<Math.min(w,h)*.08)return false;
    if(Math.max(topW/Math.max(1,bottomW),bottomW/Math.max(1,topW))>2.35)return false;
    if(Math.max(leftH/Math.max(1,rightH),rightH/Math.max(1,leftH))>2.35)return false;
    var aspect=(topW+bottomW)/Math.max(1,rightH+leftH);
    if(!Number.isFinite(aspect)||aspect<.12||aspect>6.5)return false;
    for(var i=0;i<4;i++){
      var a=P[(i+3)%4],b=P[i],c=P[(i+1)%4];
      var ux=a.x-b.x,uy=a.y-b.y,vx=c.x-b.x,vy=c.y-b.y;
      var cos=(ux*vx+uy*vy)/Math.max(1e-6,Math.hypot(ux,uy)*Math.hypot(vx,vy));
      if(Math.abs(cos)>.72)return false;
    }
    return true;
  }
  function smallPlanes(data,w,h,aw,ah){
    var g=new Float32Array(aw*ah),p=new Float32Array(aw*ah);
    for(var y=0;y<ah;y++)for(var x=0;x<aw;x++){
      var sx=Math.min(w-1,Math.floor((x+.5)*w/aw)),sy=Math.min(h-1,Math.floor((y+.5)*h/ah)),sl=0,sc=0;
      for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){
        var si=(clamp(sy+dy,0,h-1)*w+clamp(sx+dx,0,w-1))*4,a=data[si+3]/255;
        var r=data[si]*a+255*(1-a),gr=data[si+1]*a+255*(1-a),b=data[si+2]*a+255*(1-a);
        sl+=r*.299+gr*.587+b*.114;sc+=Math.max(r,gr,b)-Math.min(r,gr,b);
      }
      g[y*aw+x]=sl/9;p[y*aw+x]=(sl-.65*sc)/9;
    }
    return {luma:g,paper:p};
  }
  function lumaPlane(data,w,h){var g=new Float32Array(w*h);for(var i=0;i<w*h;i++){var a=data[i*4+3]/255;g[i]=(data[i*4]*.299+data[i*4+1]*.587+data[i*4+2]*.114)*a+255*(1-a);}return g;}
  function sampleBil(g,w,h,x,y){
    if(x<0)x=0;else if(x>w-1.001)x=w-1.001;if(y<0)y=0;else if(y>h-1.001)y=h-1.001;
    var ix=x|0,iy=y|0,fx=x-ix,fy=y-iy,i=iy*w+ix;
    return (g[i]*(1-fx)+g[i+1]*fx)*(1-fy)+(g[i+w]*(1-fx)+g[i+w+1]*fx)*fy;
  }
  // Evaluate how strongly the 4 sides of q sit on a true outer paper-to-background step
  // (and reject interior ink lines where far-outside returns to bright paper!).
  function quadScore(g,w,h,q){
    if(!validQuad(q)||!plausiblePhotoQuad(q,w,h))return 0;
    var P=q.map(function(p){return {x:p.x*(w-1),y:p.y*(h-1)};});
    var cx=(P[0].x+P[1].x+P[2].x+P[3].x)/4,cy=(P[0].y+P[1].y+P[2].y+P[3].y)/4;
    var off=Math.max(2,Math.min(w,h)*.008),far=Math.max(6,Math.min(w,h)*.026),raw=[],signSum=0,N=40;
    for(var s=0;s<4;s++){
      var a=P[s],b=P[(s+1)%4],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
      if((cx-(a.x+b.x)/2)*nx+(cy-(a.y+b.y)/2)*ny<0){nx=-nx;ny=-ny;}
      var vals=[],border=0;
      for(var k=0;k<N;k++){
        var t=.08+.84*k/(N-1),x=a.x+dx*t,y=a.y+dy*t,ox=x-nx*off,oy=y-ny*off;
        if(ox<0||oy<0||ox>w-1||oy>h-1){border++;continue;}
        var vIn=sampleBil(g,w,h,x+nx*off,y+ny*off),vOut=sampleBil(g,w,h,ox,oy);
        var fox=x-nx*far,foy=y-ny*far;
        var vFar=(fox>=0&&foy>=0&&fox<=w-1&&foy<=h-1)?sampleBil(g,w,h,fox,foy):vOut;
        // If vOut is a thin dark line and vFar returns to bright paper, do not count it as a page boundary!
        var v=(vFar>vOut+20&&vFar>135&&Math.abs(vIn-vFar)<32)?0:(vIn-Math.max(vOut,vFar*.6+vOut*.4));
        vals.push(v);signSum+=v;
      }
      raw.push({vals:vals,border:border/N});
    }
    var sign=signSum>=0?1:-1,sups=raw.map(function(r){
      var good=0,q1=0,q2=0,n=r.vals.length,half=n>>1;
      r.vals.forEach(function(v,idx){if(v*sign>8){good++;if(idx<half)q1++;else q2++;}});
      if(!n)return .35;
      var endMin=half?Math.min(q1/half,q2/(n-half)):good/n;
      return ((.55*(good/n)+.45*endMin)*(1-r.border))+r.border*.35;
    });
    var mean=(sups[0]+sups[1]+sups[2]+sups[3])/4,min=Math.min(sups[0],sups[1],sups[2],sups[3]);
    return (.52*mean+.48*min)*(.86+.14*Math.min(1,area(q)/.45));
  }
  // Multi-hypothesis RANSAC outer-edge detector using both luma and chroma-penalized paper score.
  function detectSheetEdges(luma,paperScore,w,h) {
    paperScore=paperScore||luma;
    function scanSide(side){
      var horizontal=side==='top'||side==='bottom',length=horizontal?w:h,depth=horizontal?h:w;
      var forward=side==='top'||side==='left',r=Math.max(3,Math.round(depth*.012));
      var far=Math.max(r+4,Math.round(depth*.035)),maxScan=Math.round(depth*.42);
      var candidates=[],borderHits=[],darkStart=[],darkEnd=[];
      for(var t=Math.round(length*.08);t<Math.round(length*.92);t+=2){
        function atL(d){d=clamp(d,0,depth-1);return horizontal?luma[d*w+t]:luma[t*w+d];}
        function atP(d){d=clamp(d,0,depth-1);return horizontal?paperScore[d*w+t]:paperScore[t*w+d];}
        var bP=0,bL=0;
        for(var bs=1;bs<=3;bs++){var bd=forward?bs:depth-1-bs;if(atP(bd)>bP)bP=atP(bd);if(atL(bd)>bL)bL=atL(bd);}
        var hasBrighterSheet=false;
        for(var ss=r+2;ss<maxScan;ss+=2){var pp=forward?ss:(depth-1-ss),ppOut=forward?pp-r:pp+r,ppIn=forward?pp+r:pp-r,ppFarOut=forward?pp-r*2-3:pp+r*2+3;if(atP(ppIn)-atP(ppOut)>=18&&atP(ppIn)-atP(ppFarOut)>=18&&atP(ppIn)-bP>=18){hasBrighterSheet=true;break;}}
        var borderIsPaper=(bL>185&&bP>175)||(!hasBrighterSheet&&((bL>150&&bP>140)||(bL>82&&bP>76&&bL-bP<12)));
        if(borderIsPaper)borderHits.push(t);
        var rayPeaks=[],maxPBefore=bP,maxLBefore=bL;
        for(var s=r+1;s<maxScan;s++){
          var pPrev=forward?(s-r-1):(depth-1-(s-r-1));if(atP(pPrev)>maxPBefore)maxPBefore=atP(pPrev);if(atL(pPrev)>maxLBefore)maxLBefore=atL(pPrev);
          var p=forward?s:(depth-1-s);
          var pOut=forward?p-r:p+r,pIn=forward?p+r:p-r;
          var pOut1=forward?p-2:p+2,pIn1=forward?p+2:p-2;
          var pFarOut=forward?p-r*2-3:p+r*2+3,pFarIn=forward?p+far:p-far;
          var stepP=atP(pIn)-atP(pOut),stepL=atL(pIn)-atL(pOut),rawStep=Math.max(stepP,stepL);
          var grad1=Math.max(atP(pIn1)-atP(pOut1),atL(pIn1)-atL(pOut1));
          var darkBg=atL(pOut)<68&&atP(pOut)<64&&rawStep>=20;
          if(rawStep<12||grad1<Math.max(6,rawStep*.35)||atL(pIn)<(darkBg?68:105)||atP(pIn)<(darkBg?62:95))continue;
          if(atL(pFarIn)<(darkBg?68:100)||atP(pFarIn)<(darkBg?62:90))continue;
          var maxOutL=atL(pFarOut),maxOutP=atP(pFarOut);
          for(var fo=r+2;fo<=r*2+4;fo+=2){var pf=forward?p-fo:p+fo;if(atL(pf)>maxOutL)maxOutL=atL(pf);if(atP(pf)>maxOutP)maxOutP=atP(pf);}
          if(maxOutL>atL(pOut)+16&&maxOutP>92&&atP(pIn)-maxOutP<26)continue;
          if(maxPBefore>130&&atP(pIn)-maxPBefore<20&&!(borderIsPaper&&atP(pIn)-atP(pFarOut)>=6&&s<maxScan*.35))continue;
          if(borderIsPaper&&atP(pIn)-atP(pFarOut)<5)continue;
          var outWeight=Math.pow(1-s/(maxScan*1.15),1.35)*(borderIsPaper?.28:1);
          rayPeaks.push({t:t,v:p,step:Math.min(90,rawStep)*outWeight,rawStep:rawStep+grad1*.5,s:s,darkBg:darkBg,outL:atL(pOut),outChroma:atL(pOut)-atP(pOut)});
        }
        var kept=[];
        for(var i=0;i<rayPeaks.length;i++){
          var pk=rayPeaks[i],isLocalMax=true;
          for(var j=0;j<rayPeaks.length;j++){
            if(i!==j&&Math.abs(rayPeaks[j].v-pk.v)<=r*2&&rayPeaks[j].step>pk.step){isLocalMax=false;break;}
          }
          if(isLocalMax)kept.push(pk);
        }
        kept.sort(function(a,b){return a.s-b.s;});
        if(kept.length){
          candidates.push(kept[0]);
          if(!borderIsPaper&&bL<90&&kept[0].s<=depth*.09){
            if(t<length*.36)darkStart.push(kept[0].v);
            else if(t>length*.64)darkEnd.push(kept[0].v);
          }
          var bestRest=null;
          for(var k=1;k<kept.length;k++){
            if(kept[0].darkBg&&kept[k].outL>72&&kept[k].outChroma<12)continue;
            if(!borderIsPaper&&atP(forward?kept[0].v+r:kept[0].v-r)>95&&atP(forward?kept[k].v+r:kept[k].v-r)-atP(forward?kept[0].v+r:kept[0].v-r)<28)continue;
            if(kept[k].s-kept[0].s>r*2.5&&(!bestRest||kept[k].step>bestRest.step))bestRest=kept[k];
          }
          if(bestRest)candidates.push(bestRest);
        }
      }
      var totalRays=Math.ceil((Math.round(length*.92)-Math.round(length*.08))/2);
      var isBorderSide=borderHits.length>=totalRays*.72;
      var lines=[],pool=candidates.slice();
      for(var pass=0;pass<4&&pool.length>=10;pass++){
        var bestLine=null,bestScore=-1,n=pool.length;
        for(var ii=0;ii<n;ii++){
          for(var jj=ii+3;jj<n;jj+=2){
            var a=pool[ii],b=pool[jj];
            if(Math.abs(b.t-a.t)<length*.16)continue;
            var slope=(b.v-a.v)/(b.t-a.t);
            if(Math.abs(slope)>.42)continue;
            var offset=a.v-slope*a.t,score=0,count=0,minT=length,maxT=0;
            for(var kk=0;kk<n;kk++){
              var c=pool[kk],err=Math.abs(c.v-(offset+slope*c.t));
              if(err<3.0){score+=c.step*(1-err/4.2);count++;if(c.t<minT)minT=c.t;if(c.t>maxT)maxT=c.t;}
            }
            var span=(maxT-minT)/length,totalScore=score*(.35+.65*Math.min(1,span/.65));
            if(count>=10&&totalScore>bestScore){bestScore=totalScore;bestLine={slope:slope,offset:offset,count:count,span:span,score:totalScore,border:false};}
          }
        }
        if(!bestLine)break;
        var sx=0,sy=0,sxx=0,sxy=0,sw=0,nextPool=[];
        for(var m=0;m<pool.length;m++){
          var cm=pool[m],er=Math.abs(cm.v-(bestLine.offset+bestLine.slope*cm.t));
          if(er<3.2){var wt=cm.step;sx+=cm.t*wt;sy+=cm.v*wt;sxx+=cm.t*cm.t*wt;sxy+=cm.t*cm.v*wt;sw+=wt;}
          else nextPool.push(cm);
        }
        var den=sw*sxx-sx*sx;
        if(Math.abs(den)>1e-3){bestLine.slope=(sw*sxy-sx*sy)/den;bestLine.offset=(sy-bestLine.slope*sx)/sw;}
        lines.push(bestLine);pool=nextPool;
      }
      if(isBorderSide){
        var defV=forward?2:depth-3,v0=defV,v1=defV;
        if(darkStart.length>=4){darkStart.sort(function(x,y){return x-y;});v0=darkStart[(darkStart.length*.6)|0]+(forward?1:-1);}
        if(darkEnd.length>=4){darkEnd.sort(function(x,y){return x-y;});v1=darkEnd[(darkEnd.length*.6)|0]+(forward?1:-1);}
        var bSlope=(v1-v0)/Math.max(1,length-1);
        lines.unshift({slope:bSlope,offset:v0,count:borderHits.length,span:borderHits.length/Math.max(1,totalRays),score:borderHits.length*52,border:true});
      }
      return lines;
    }
    var tops=scanSide('top'),bottoms=scanSide('bottom'),lefts=scanSide('left'),rights=scanSide('right');
    if(!tops.length||!bottoms.length||!lefts.length||!rights.length)return null;
    function intersectHV(hLine,vLine){
      var det=1-hLine.slope*vLine.slope;if(Math.abs(det)<1e-6)return null;
      var x=(vLine.offset+vLine.slope*hLine.offset)/det,y=hLine.offset+hLine.slope*x;
      return {x:x/(w-1),y:y/(h-1)};
    }
    var bestQuad=null,bestComboScore=-1;
    for(var ti=0;ti<tops.length;ti++)for(var bi=0;bi<bottoms.length;bi++){
      var t0=tops[ti],b0=bottoms[bi];
      var t={slope:t0.slope,offset:t0.offset,score:t0.score,border:t0.border};
      var b={slope:b0.slope,offset:b0.offset,score:b0.score,border:b0.border};
      if(b.border&&!t.border&&Math.abs(t.slope)>.02){b.slope=t.slope;b.offset=(h-3)-Math.min(0,b.slope*(w-1));}
      else if(t.border&&!b.border&&Math.abs(b.slope)>.02){t.slope=b.slope;t.offset=2-Math.max(0,t.slope*(w-1));}
      var hDiff=(t.border||b.border)?0:Math.abs(t.slope-b.slope);
      if(hDiff>.20)continue;
      for(var li=0;li<lefts.length;li++)for(var ri=0;ri<rights.length;ri++){
        var l0=lefts[li],r0=rights[ri];
        var l={slope:l0.slope,offset:l0.offset,score:l0.score,border:l0.border};
        var r={slope:r0.slope,offset:r0.offset,score:r0.score,border:r0.border};
        if(r.border&&!l.border&&Math.abs(l.slope)>.02&&((!t.border&&Math.abs(t.slope)>.015&&Math.sign(l.slope)===-Math.sign(t.slope))||(!b.border&&Math.abs(b.slope)>.015&&Math.sign(l.slope)===-Math.sign(b.slope)))){r.slope=l.slope;r.offset=(w-3)-Math.min(0,r.slope*(h-1));}
        else if(l.border&&!r.border&&Math.abs(r.slope)>.02&&((!t.border&&Math.abs(t.slope)>.015&&Math.sign(r.slope)===-Math.sign(t.slope))||(!b.border&&Math.abs(b.slope)>.015&&Math.sign(r.slope)===-Math.sign(b.slope)))){l.slope=r.slope;l.offset=2-Math.max(0,l.slope*(h-1));}
        var vDiff=(l.border||r.border)?0:Math.abs(l.slope-r.slope);
        if(vDiff>.20)continue;
        var c0=intersectHV(t,l),c1=intersectHV(t,r),c2=intersectHV(b,r),c3=intersectHV(b,l);
        if(!c0||!c1||!c2||!c3)continue;
        var q=[c0,c1,c2,c3];
        if(q.some(function(p){return p.x<-.14||p.x>1.14||p.y<-.14||p.y>1.14;}))continue;
        var cq=q.map(function(p){return {x:clamp(p.x,-.14,1.14),y:clamp(p.y,-.14,1.14)};});
        if(!validQuad(cq)||area(cq)<.12||!plausiblePhotoQuad(cq,w,h))continue;
        var paraPenalty=(1-hDiff*1.1)*(1-vDiff*1.1);
        var relScore=t.score/Math.max(1,tops[0].score)+b.score/Math.max(1,bottoms[0].score)+l.score/Math.max(1,lefts[0].score)+r.score/Math.max(1,rights[0].score);
        var comboScore=relScore*paraPenalty;
        if(comboScore>bestComboScore){bestComboScore=comboScore;bestQuad=cq;}
      }
    }
    return bestQuad;
  }
  function fitLine(pts){
    var use=pts,line=null;
    for(var it=0;it<3;it++){
      var mx=0,my=0;use.forEach(function(p){mx+=p.x;my+=p.y;});mx/=use.length;my/=use.length;
      var sxx=0,sxy=0,syy=0;use.forEach(function(p){var dx=p.x-mx,dy=p.y-my;sxx+=dx*dx;sxy+=dx*dy;syy+=dy*dy;});
      var ang=.5*Math.atan2(2*sxy,sxx-syy);line={x:mx,y:my,dx:Math.cos(ang),dy:Math.sin(ang)};
      var res=pts.map(function(p){return Math.abs((p.x-line.x)*line.dy-(p.y-line.y)*line.dx);});
      var sorted=res.slice().sort(function(a,b){return a-b;}),lim=sorted[(sorted.length/2)|0]*2.5+.75;
      var next=pts.filter(function(p,i){return res[i]<=lim;});
      if(next.length<6)break;use=next;
    }
    return line;
  }
  function intersect(l1,l2){
    var det=l1.dx*l2.dy-l1.dy*l2.dx;if(Math.abs(det)<1e-6)return null;
    var t=((l2.x-l1.x)*l2.dy-(l2.y-l1.y)*l2.dx)/det;return {x:l1.x+l1.dx*t,y:l1.y+l1.dy*t};
  }
  // Sub-pixel edge refinement along each side that does not already lie on the photo boundary.
  function refineQuad(data,w,h,q){
    var g=lumaPlane(data,w,h),P=q.map(function(p){return {x:p.x*(w-1),y:p.y*(h-1)};});
    var cx=(P[0].x+P[1].x+P[2].x+P[3].x)/4,cy=(P[0].y+P[1].y+P[2].y+P[3].y)/4;
    var R=Math.max(3,Math.round(Math.min(w,h)*.007)),lines=[],origLines=[],inset=Math.min(1.2,Math.min(w,h)*.0018);
    for(var s=0;s<4;s++){
      var a=P[s],b=P[(s+1)%4],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
      origLines.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,dx:dx/L,dy:dy/L});
      // Do not refine a side that lies right along the camera frame border
      if((a.x<4&&b.x<4)||(a.y<4&&b.y<4)||(a.x>w-5&&b.x>w-5)||(a.y>h-5&&b.y>h-5)){lines.push(null);continue;}
      if((cx-(a.x+b.x)/2)*nx+(cy-(a.y+b.y)/2)*ny<0){nx=-nx;ny=-ny;}
      var N=Math.max(24,Math.round(L/5)),sgn=0,k,t,bx,by;
      for(k=0;k<N;k++){t=.08+.84*k/(N-1);bx=a.x+dx*t;by=a.y+dy*t;sgn+=sampleBil(g,w,h,bx+nx*R,by+ny*R)-sampleBil(g,w,h,bx-nx*R,by-ny*R);}
      var sign=sgn>=0?1:-1,pts=[],nudge=sign>0?inset:0;
      for(k=0;k<N;k++){
        t=.08+.84*k/(N-1);bx=a.x+dx*t;by=a.y+dy*t;var best=0,bo=null;
        for(var o=-R;o<=R;o+=.5){
          var px=bx+nx*o,py=by+ny*o;if(px<2||py<2||px>w-3||py>h-3)continue;
          var vIn=sampleBil(g,w,h,px+nx*1.8,py+ny*1.8),vOut=sampleBil(g,w,h,px-nx*1.8,py-ny*1.8);
          var vFarOut=sampleBil(g,w,h,px-nx*6.5,py-ny*6.5);
          if(sign>0&&vFarOut>vOut+16&&vFarOut>130)continue;
          var c=(vIn-vOut)*sign*(1-Math.abs(o)/(R*2.4));
          if(c>best){best=c;bo=o;}
        }
        if(bo!==null&&best>12)pts.push({x:bx+nx*(bo+nudge),y:by+ny*(bo+nudge)});
      }
      var fitted=pts.length>=N*.55?fitLine(pts):null;
      if(fitted){
        var origDx=dx/L,origDy=dy/L,dot=Math.abs(fitted.dx*origDx+fitted.dy*origDy);
        if(dot<.998)fitted=null; // reject if angle changes by >3.5 deg
      }
      lines.push(fitted);
    }
    var out=[],moved=false;
    for(var ci=0;ci<4;ci++){
      var l1=lines[(ci+3)%4],l2=lines[ci],p=P[ci];
      if(l1||l2){var ip=intersect(l1||origLines[(ci+3)%4],l2||origLines[ci]);if(ip&&Math.hypot(ip.x-p.x,ip.y-p.y)<R*1.6){p=ip;moved=true;}}
      out.push({x:clamp(p.x/(w-1),-.14,1.14),y:clamp(p.y/(h-1),-.14,1.14)});
    }
    return moved&&validQuad(out)?out:null;
  }
  // Detect a physical sub-document (e.g., passport, ID card, slip) placed on a bright featureless flatbed scanner lid.
  function detectFlatbedObject(data,w,h,aw,ah){
    if(aw<24||ah<24)return null;
    var L=new Float32Array(aw*ah),GX=new Float32Array(aw*ah),GY=new Float32Array(aw*ah),G=new Float32Array(aw*ah),x,y;
    for(y=0;y<ah;y++){
      var sy=Math.min(h-1,Math.floor((y+.5)*h/ah));
      for(x=0;x<aw;x++){
        var sx=Math.min(w-1,Math.floor((x+.5)*w/aw)),si=(sy*w+sx)*4,a=data[si+3]/255;
        L[y*aw+x]=(data[si]*.299+data[si+1]*.587+data[si+2]*.114)*a+255*(1-a);
      }
    }
    for(y=1;y<ah-1;y++)for(x=1;x<aw-1;x++){
      var idx=y*aw+x;GX[idx]=Math.abs(L[idx+1]-L[idx-1]);GY[idx]=Math.abs(L[idx+aw]-L[idx-aw]);G[idx]=GX[idx]+GY[idx];
    }
    var bx=Math.max(3,Math.round(aw*.035)),by=Math.max(3,Math.round(ah*.035));
    var rowAct=new Float32Array(ah),colAct=new Float32Array(aw);
    var quietBrightRows=0,totalRows=ah-2*by;
    for(y=by;y<ah-by;y++){
      var act=0,sumL=0,n=aw-2*bx;
      for(x=bx;x<aw-bx;x++){var i=y*aw+x;if(G[i]>6.0)act++;sumL+=L[i];}
      rowAct[y]=act/n;if(rowAct[y]<.04&&sumL/n>170)quietBrightRows++;
    }
    var quietBrightCols=0,totalCols=aw-2*bx;
    for(x=bx;x<aw-bx;x++){
      var actC=0,sumLC=0,nC=ah-2*by;
      for(y=by;y<ah-by;y++){var ic=y*aw+x;if(G[ic]>6.0)actC++;sumLC+=L[ic];}
      colAct[x]=actC/nC;if(colAct[x]<.04&&sumLC/nC>170)quietBrightCols++;
    }
    if(quietBrightRows<totalRows*.22&&quietBrightCols<totalCols*.22)return null;
    var y0=by,y1=ah-1-by,x0=bx,x1=aw-1-bx;
    if(quietBrightRows>=quietBrightCols){
      while(y0<ah-by&&rowAct[y0]<.12)y0++;
      while(y1>y0&&rowAct[y1]<.12)y1--;
      if(y1-y0<ah*.18)return null;
      for(x=bx;x<aw-bx;x++){var a1=0;for(y=y0;y<=y1;y++)if(G[y*aw+x]>6.0)a1++;colAct[x]=a1/Math.max(1,y1-y0+1);}
      while(x0<aw-bx&&colAct[x0]<.12)x0++;
      while(x1>x0&&colAct[x1]<.12)x1--;
    }else{
      while(x0<aw-bx&&colAct[x0]<.12)x0++;
      while(x1>x0&&colAct[x1]<.12)x1--;
      if(x1-x0<aw*.18)return null;
      for(y=by;y<ah-by;y++){var a2=0;for(x=x0;x<=x1;x++)if(G[y*aw+x]>6.0)a2++;rowAct[y]=a2/Math.max(1,x1-x0+1);}
      while(y0<ah-by&&rowAct[y0]<.12)y0++;
      while(y1>y0&&rowAct[y1]<.12)y1--;
    }
    if(x1-x0<aw*.22||y1-y0<ah*.22||(x1-x0)*(y1-y0)>aw*ah*.78)return null;
    if(Math.max(y0/ah,(ah-1-y1)/ah,x0/aw,(aw-1-x1)/aw)<.22)return null;
    var filledRows=0,filledCols=0;
    for(y=y0;y<=y1;y++)if(rowAct[y]>=.08)filledRows++;
    for(x=x0;x<=x1;x++)if(colAct[x]>=.08)filledCols++;
    if(filledRows<(y1-y0+1)*.60||filledCols<(x1-x0+1)*.60)return null;
    var shadowSides=0;
    function fitEdge(side){
      var horiz=side==='top'||side==='bottom',fwd=side==='top'||side==='left',stepDir=fwd?1:-1;
      var tStart=Math.round((horiz?x0:y0)+(horiz?(x1-x0):(y1-y0))*.08);
      var tEnd=Math.round((horiz?x0:y0)+(horiz?(x1-x0):(y1-y0))*.92);
      var nominal=side==='top'?y0:side==='bottom'?y1:side==='left'?x0:x1,depth=horiz?ah:aw;
      var pts=[],shadowHits=0,totalRays=0;
      for(var t=tStart;t<=tEnd;t+=2){
        totalRays++;
        function atL(p){p=clamp(p,0,depth-1);return horiz?L[p*aw+t]:L[t*aw+p];}
        function atGN(p){p=clamp(p,0,depth-1);return horiz?GY[p*aw+t]:GX[t*aw+p];}
        function atG(p){p=clamp(p,0,depth-1);return horiz?G[p*aw+t]:G[t*aw+p];}
        var firstAct=nominal;
        for(var k=-4;k<=8;k++){var p0=clamp(nominal+k*stepDir,3,depth-4);if(atG(p0)>5.5){firstAct=p0;break;}}
        var bedL=(atL(firstAct-3*stepDir)+atL(firstAct-5*stepDir))*.5,minL=255,minK=0,maxInL=0;
        for(k=-1;k<=3;k++){var l=atL(firstAct+k*stepDir);if(l<minL){minL=l;minK=k;}}
        for(k=minK+1;k<=minK+6;k++){var li=atL(firstAct+k*stepDir);if(li>maxInL)maxInL=li;}
        var bestP=firstAct,bestW=10;
        if(bedL-minL>6&&maxInL-minL>10){
          shadowHits++;
          if(bedL-minL>10&&maxInL-minL>16){
            var troughP=firstAct+minK*stepDir,maxJump=0,edgeP=troughP+2*stepDir;
            for(k=0;k<=5;k++){
              var pk=troughP+k*stepDir,jump=atL(pk+stepDir)-atL(pk-stepDir),bonus=atL(pk+stepDir)>204?1.25:1;
              if(jump*bonus>maxJump){maxJump=jump*bonus;edgeP=pk+stepDir*.5;}
            }
            bestP=edgeP;bestW=Math.max(10,maxJump);
          }
        }else{bestP=firstAct;bestW=Math.max(8,atGN(firstAct));}
        pts.push({t:t,v:bestP,w:bestW});
      }
      if(pts.length<8)return null;
      if(shadowHits>=totalRays*.30)shadowSides++;
      pts.sort(function(a,b){return a.v-b.v;});
      var medV=pts[pts.length>>1].v,inliers=pts.filter(function(p){return Math.abs(p.v-medV)<=2.5;});
      if(inliers.length<totalRays*.45)return null;
      var sx=0,sy=0,sxx=0,sxy=0,sw=0;
      for(var m=0;m<inliers.length;m++){var im=inliers[m];sx+=im.t*im.w;sy+=im.v*im.w;sxx+=im.t*im.t*im.w;sxy+=im.t*im.v*im.w;sw+=im.w;}
      var den=sw*sxx-sx*sx,slope=Math.abs(den)>1e-3?(sw*sxy-sx*sy)/den:0;
      if(Math.abs(slope)<.018)slope=0;
      return {slope:slope,offset:(sy-slope*sx)/sw,med:medV};
    }
    var top=fitEdge('top'),bottom=fitEdge('bottom'),left=fitEdge('left'),right=fitEdge('right');
    if(!top||!bottom||!left||!right||shadowSides<2)return null;
    if(Math.abs(top.slope)<.012&&Math.abs(bottom.slope)<.042){bottom.slope=0;bottom.offset=bottom.med;}
    else if(Math.abs(bottom.slope)<.012&&Math.abs(top.slope)<.042){top.slope=0;top.offset=top.med;}
    if(Math.abs(left.slope)<.012&&Math.abs(right.slope)<.042){right.slope=0;right.offset=right.med;}
    else if(Math.abs(right.slope)<.012&&Math.abs(left.slope)<.042){left.slope=0;left.offset=left.med;}
    function intersectHV(hL,vL){
      var det=1-hL.slope*vL.slope;if(Math.abs(det)<1e-6)return null;
      var x=(vL.offset+vL.slope*hL.offset)/det,y=hL.offset+hL.slope*x;
      return {x:clamp(x/(aw-1),0,1),y:clamp(y/(ah-1),0,1)};
    }
    var q=[intersectHV(top,left),intersectHV(top,right),intersectHV(bottom,right),intersectHV(bottom,left)];
    return q.every(Boolean)&&validQuad(q)&&plausiblePhotoQuad(q,aw,ah)?q:null;
  }
  function evalTextStats(L,cw,ch){
    var mx=Math.round(cw*.08),my=Math.round(ch*.06),hChar=new Float32Array(cw*ch),vChar=new Float32Array(cw*ch),topText=0,botText=0,x,y;
    for(y=my;y<ch-my;y++)for(x=mx;x<cw-mx;x++){
      var idx=y*cw+x,bg=0;
      for(var dy=-4;dy<=4;dy+=4)for(var dx=-4;dx<=4;dx+=4){var v=L[(y+dy)*cw+(x+dx)];if(v>bg)bg=v;}
      if(bg-L[idx]<20)continue;
      var gx=Math.abs(L[idx+1]-L[idx-1]),gy=Math.abs(L[idx+cw]-L[idx-cw]);
      if(y-6>=0&&y+6<ch&&!(bg-L[(y-6)*cw+x]>18&&bg-L[(y+6)*cw+x]>18)&&gx>14&&gx>gy*1.15){
        hChar[idx]=gx;if(y<ch*.35)topText+=gx;else if(y>ch*.65)botText+=gx;
      }
      if(x-6>=0&&x+6<cw&&!(bg-L[y*cw+(x-6)]>18&&bg-L[y*cw+(x+6)]>18)&&gy>14&&gy>gx*1.15)vChar[idx]=gy;
    }
    var hText=0,vText=0;
    for(y=my+6;y<ch-my-6;y+=2)for(x=mx+6;x<cw-mx-6;x+=2){
      var h0=0,hU=0,hD=0,hAct=0,v0=0,vL=0,vR=0,vAct=0;
      for(var k=-8;k<=8;k++){
        var hc=hChar[y*cw+x+k];h0+=hc;if(hc>0)hAct++;
        hU+=hChar[(y-5)*cw+x+k];hD+=hChar[(y+5)*cw+x+k];
        var vc=vChar[(y+k)*cw+x];v0+=vc;if(vc>0)vAct++;
        vL+=vChar[(y+k)*cw+x-5];vR+=vChar[(y+k)*cw+x+5];
      }
      if(hAct>=4)hText+=Math.max(0,h0-.55*(hU+hD));
      if(vAct>=4)vText+=Math.max(0,v0-.55*(vL+vR));
    }
    var rowSegs=[],starts=new Float32Array(cw),ends=new Float32Array(cw);
    for(y=0;y<ch;y++)rowSegs.push([]);
    for(y=my+5;y<ch-my-5;y++){
      x=mx;
      while(x<cw-mx){
        var s0=0,sU=0,sD=0;
        for(var kk=-4;kk<=4;kk++){s0+=hChar[y*cw+x+kk];sU+=hChar[(y-5)*cw+x+kk];sD+=hChar[(y+5)*cw+x+kk];}
        if(s0>65&&s0>(sU+sD)*.55){
          var xStart=x;
          while(x<cw-mx){var c0=0;for(var c=-4;c<=4;c++)c0+=hChar[y*cw+x+c];if(c0<=45)break;x++;}
          if(x-xStart>=18){rowSegs[y].push([xStart,x-1]);starts[xStart]++;ends[x-1]++;}
        }else x++;
      }
    }
    var leftPairs=0,rightPairs=0;
    for(y=my+5;y<ch-my-18;y++){
      var segsA=rowSegs[y];
      for(var ai=0;ai<segsA.length;ai++){
        var a0=segsA[ai][0],a1=segsA[ai][1];
        for(var d=5;d<=16;d++){
          var segsB=rowSegs[y+d];
          for(var bi=0;bi<segsB.length;bi++){
            var b0=segsB[bi][0],b1=segsB[bi][1];
            if(Math.min(a1,b1)-Math.max(a0,b0)<10)continue;
            var dLeft=Math.abs(a0-b0),dRight=Math.abs(a1-b1);
            if(dLeft<=3&&dRight>=6)leftPairs++;
            if(dRight<=3&&dLeft>=6)rightPairs++;
          }
        }
      }
    }
    var startAlign=0,endAlign=0;
    for(x=mx;x<cw-mx;x++){
      var sa=starts[x-1]*.5+starts[x]+starts[x+1]*.5,ea=ends[x-1]*.5+ends[x]+ends[x+1]*.5;
      if(sa>=2.5)startAlign+=sa*sa;if(ea>=2.5)endAlign+=ea*ea;
    }
    return {hText:hText,vText:vText,leftPairs:leftPairs,rightPairs:rightPairs,startAlign:startAlign,endAlign:endAlign,topText:topText,botText:botText};
  }
  function detectOrientation(data,w,h,pts){
    var xs=pts.map(function(p){return clamp(p.x,0,1);}),ys=pts.map(function(p){return clamp(p.y,0,1);});
    var x0=Math.round(Math.min.apply(null,xs)*w),x1=Math.round(Math.max.apply(null,xs)*w);
    var y0=Math.round(Math.min.apply(null,ys)*h),y1=Math.round(Math.max.apply(null,ys)*h);
    var rw=x1-x0,rh=y1-y0;if(rw<48||rh<48)return 0;
    var sc=Math.min(1,420/Math.max(rw,rh)),cw=Math.max(24,Math.round(rw*sc)),ch=Math.max(24,Math.round(rh*sc));
    var L0=new Float32Array(cw*ch);
    for(var y=0;y<ch;y++){
      var sy=clamp(Math.round(y0+(y/(ch-1))*(rh-1)),0,h-1);
      for(var x=0;x<cw;x++){
        var sx=clamp(Math.round(x0+(x/(cw-1))*(rw-1)),0,w-1),i=(sy*w+sx)*4,a=data[i+3]/255;
        L0[y*cw+x]=(data[i]*.299+data[i+1]*.587+data[i+2]*.114)*a+255*(1-a);
      }
    }
    var s0=evalTextStats(L0,cw,ch);
    if(s0.hText+s0.vText<45000)return 0;
    if(s0.vText>s0.hText*1.25){
      var cw90=ch,ch90=cw,L90=new Float32Array(cw90*ch90);
      for(var ry=0;ry<ch90;ry++)for(var rx=0;rx<cw90;rx++)L90[ry*cw90+rx]=L0[(ch-1-rx)*cw+ry];
      var s90=evalTextStats(L90,cw90,ch90);
      var pairRatio=(s90.leftPairs+4)/(s90.rightPairs+4),colRatio=(s90.startAlign+20)/(s90.endAlign+20);
      return (pairRatio*.7+colRatio*.3)>=1.0?90:270;
    }
    if(s0.rightPairs>s0.leftPairs*1.55&&s0.rightPairs>=38&&s0.endAlign>s0.startAlign*1.15&&s0.botText>s0.topText*1.12)return 180;
    return 0;
  }
  function detectRegion(data,w,h) {
    var scale=Math.min(1,420/Math.max(w,h)),aw=Math.max(8,Math.round(w*scale)),ah=Math.max(8,Math.round(h*scale));
    var planes=smallPlanes(data,w,h,aw,ah),gray=planes.luma,paper=planes.paper,hist=new Uint32Array(256);
    for(var i=0;i<aw*ah;i++)hist[clamp(Math.round(paper[i]),0,255)]++;
    function percentile(fr){var s=0;for(var v=0;v<256;v++){s+=hist[v];if(s>=aw*ah*fr)return v;}return 255;}
    var low=percentile(.12),high=percentile(.90);
    if(percentile(.99)-percentile(.01)<12)return {pts:full(),auto:false,confidence:0};
    var flatbedQuad=detectFlatbedObject(data,w,h,aw,ah);
    if(flatbedQuad&&validQuad(flatbedQuad))return {pts:flatbedQuad,auto:true,confidence:.90,flatbed:true};
    if(high-low<22)return {pts:full(),auto:false,confidence:0};
    var sheetQuad=detectSheetEdges(gray,paper,aw,ah);
    var thresholds=[.28,.42,.55,.66,.76].map(function(t){return low+(high-low)*t;});
    var best=null,bestScore=0,queue=new Int32Array(aw*ah);
    thresholds.forEach(function(t){
      var visited=new Uint8Array(aw*ah);
      for(var s=0;s<paper.length;s++){
        if(visited[s]||paper[s]<t)continue;
        var head=0,tail=1;queue[0]=s;visited[s]=1;
        var boundary=[],touch=0;
        while(head<tail){var at=queue[head++],cx=at%aw,cy=(at/aw)|0,edge=false;
          if(cx<2||cy<2||cx>aw-3||cy>ah-3)touch++;
          var neighbors=[cx>0?at-1:-1,cx<aw-1?at+1:-1,cy>0?at-aw:-1,cy<ah-1?at+aw:-1];
          for(var k=0;k<4;k++){var ni=neighbors[k];if(ni<0||paper[ni]<t){edge=true;continue;}if(!visited[ni]){visited[ni]=1;queue[tail++]=ni;}}
          if(edge)boundary.push({x:cx,y:cy});
        }
        if(tail<aw*ah*.10||boundary.length<12)continue;
        var ch=hull(boundary),q=quadFromHull(ch);if(!q)continue;
        var ar=area(q),frac=ar/(aw*ah),coverage=tail/Math.max(1,ar);
        if(frac<.14||coverage<.55)continue;
        var norm=q.map(function(v){return {x:clamp(v.x/(aw-1),0,1),y:clamp(v.y/(ah-1),0,1)};});
        if(!validQuad(norm))continue;
        var borderCorners=q.filter(function(p){return p.x<3||p.y<3||p.x>aw-4||p.y>ah-4;}).length;
        var edgeSup=quadScore(paper,aw,ah,norm);
        var score=frac*Math.min(1,coverage)*Math.min(1,ar/Math.max(1,area(ch)))*(.25+.75*edgeSup)*(borderCorners>=3?.12:1);
        if(score>bestScore){bestScore=score;best=norm;}
      }
    });
    if(sheetQuad&&validQuad(sheetQuad)){
      if(!best||quadScore(paper,aw,ah,sheetQuad)>=quadScore(paper,aw,ah,best)-.04||area(sheetQuad)>area(best)*1.15||best.some(function(p){return p.x<.015||p.x>.985||p.y<.015||p.y>.985;})){
        return {pts:sheetQuad,auto:true,confidence:.88};
      }
    }
    if(best&&!plausiblePhotoQuad(best,aw,ah))best=null;
    if(best&&best.some(function(p){return p.x>.985||p.y>.985||p.x<.015||p.y<.015;})){
      var edgeCorners=best.map(function(p,i){return (p.x>.985||p.y>.985||p.x<.015||p.y<.015)?i:-1;}).filter(function(i){return i>=0;});
      if(edgeCorners.length===1){
        var missing=edgeCorners[0],prev=best[(missing+3)%4],next=best[(missing+1)%4],opposite=best[(missing+2)%4];
        best[missing]={x:clamp(prev.x+next.x-opposite.x,0,1),y:clamp(prev.y+next.y-opposite.y,0,1)};
        if(validQuad(best)&&plausiblePhotoQuad(best,aw,ah))return {pts:best,auto:true,confidence:.56};
      }
      return {pts:full(),auto:false,confidence:0};
    }
    if(!best||bestScore<.10){
      var total=aw*ah,white=0,dark=0;
      for(var gv=0;gv<256;gv++){if(gv>210)white+=hist[gv];if(gv<130)dark+=hist[gv];}
      function brightEdge(side){
        var horizontal=side==='top'||side==='bottom',length=horizontal?aw:ah,band=Math.max(1,Math.round(Math.min(aw,ah)*.012)),bright=0,count=0;
        for(var t=Math.round(length*.08);t<Math.round(length*.92);t+=3)for(var k=0;k<band;k++){
          var pos=side==='top'?k:side==='bottom'?ah-1-k:side==='left'?k:aw-1-k;
          var at=horizontal?pos*aw+t:t*aw+pos;count++;if(gray[at]>200)bright++;
        }
        return bright/Math.max(1,count)>.78;
      }
      var brightSides=['top','right','bottom','left'].filter(brightEdge).length;
      var likelyFullScan=white/total>.68&&dark/total>.02&&dark/total<.2&&brightSides>=3&&w/h>.32&&w/h<2.6;
      if(likelyFullScan)return {pts:full(),auto:true,confidence:.42};
      return {pts:full(),auto:false,confidence:0};
    }
    return {pts:best,auto:true,confidence:Math.min(.98,bestScore+.3)};
  }
  function detect(data,w,h) {
    var res=detectRegion(data,w,h);
    try{
      if(res.auto&&!res.flatbed){
        var refined=refineQuad(data,w,h,res.pts);
        if(refined)res.pts=refined;
        var p=res.pts;
        if(Math.abs((p[1].y-p[0].y)-(p[2].y-p[3].y))>.025&&(Math.min(p[0].y,p[1].y)<.015||Math.max(p[2].y,p[3].y)>.985)){
          var lm=lineModel(data,w,h);
          if(lm.top&&lm.bottom&&(lm.left||lm.right)){
            var x0=clamp(Math.round(p[0].x*(lm.width-1)),0,lm.width-1),x1=clamp(Math.round(p[1].x*(lm.width-1)),0,lm.width-1);
            var ty0=lm.top.positions[x0]/lm.height,ty1=lm.top.positions[x1]/lm.height;
            if(ty0>Math.min(p[0].y,p[1].y)+.012&&ty1>Math.min(p[0].y,p[1].y)+.012&&(p[0].y>ty0-.005||p[1].y>ty1-.005)&&Math.abs((p[1].y-p[0].y)-(ty1-ty0))>.022){
              p[0].y=clamp(ty0-.018,.004,.996);p[1].y=clamp(ty1-.018,.004,.996);
            }
            var bx0=clamp(Math.round(p[3].x*(lm.width-1)),0,lm.width-1),bx1=clamp(Math.round(p[2].x*(lm.width-1)),0,lm.width-1);
            var by0=lm.bottom.positions[bx0]/lm.height,by1=lm.bottom.positions[bx1]/lm.height;
            if(by0<Math.max(p[2].y,p[3].y)-.012&&by1<Math.max(p[2].y,p[3].y)-.012&&(p[3].y<by0+.005||p[2].y<by1+.005)&&Math.abs((p[2].y-p[3].y)-(by1-by0))>.022){
              p[3].y=clamp(by0+.018,.004,.996);p[2].y=clamp(by1+.018,.004,.996);
            }
          }
        }
      }
      var rot=detectOrientation(data,w,h,res.pts);
      if(rot)res.rotation=rot;
    }catch(e){}
    return res;
  }
  function extremaPass(src,w,h,radius,isMax,vertical) {
    var dst=new Float32Array(src.length),length=vertical?h:w,lines=vertical?w:h;
    var q=new Int32Array(length);
    for(var line=0;line<lines;line++){
      var head=0,tail=0,next=0;
      function at(t){return vertical?t*w+line:line*w+t;}
      for(var pos=0;pos<length;pos++){
        var end=Math.min(length-1,pos+radius);
        while(next<=end){var val=src[at(next)];while(tail>head&&(isMax?src[at(q[tail-1])]<=val:src[at(q[tail-1])]>=val))tail--;q[tail++]=next++;}
        while(tail>head&&q[head]<pos-radius)head++;
        dst[at(pos)]=src[at(q[head])];
      }
    }return dst;
  }
  function closePaper(src,w,h,radius){
    var a=extremaPass(src,w,h,radius,true,false);
    a=extremaPass(a,w,h,radius,true,true);
    a=extremaPass(a,w,h,radius,false,false);
    return extremaPass(a,w,h,radius,false,true);
  }
  function blurBox(src,w,h,r){
    var temp=new Float32Array(src.length),dst=new Float32Array(src.length);
    for(var y=0;y<h;y++){var sum=0,left=0,right=-1;for(var x=0;x<w;x++){while(right<Math.min(w-1,x+r))sum+=src[y*w+(++right)];while(left<Math.max(0,x-r))sum-=src[y*w+(left++)];temp[y*w+x]=sum/(right-left+1);}}
    for(x=0;x<w;x++){sum=0;left=0;right=-1;for(y=0;y<h;y++){while(right<Math.min(h-1,y+r))sum+=temp[(++right)*w+x];while(left<Math.max(0,y-r))sum-=temp[(left++)*w+x];dst[y*w+x]=sum/(right-left+1);}}
    return dst;
  }
  function blurXY(src,w,h,rx,ry){
    var temp=new Float32Array(src.length),dst=new Float32Array(src.length),x,y,sum,left,right;
    for(y=0;y<h;y++){sum=0;left=0;right=-1;for(x=0;x<w;x++){while(right<Math.min(w-1,x+rx))sum+=src[y*w+(++right)];while(left<Math.max(0,x-rx))sum-=src[y*w+(left++)];temp[y*w+x]=sum/(right-left+1);}}
    for(x=0;x<w;x++){sum=0;left=0;right=-1;for(y=0;y<h;y++){while(right<Math.min(h-1,y+ry))sum+=temp[(++right)*w+x];while(left<Math.max(0,y-ry))sum-=temp[(left++)*w+x];dst[y*w+x]=sum/(right-left+1);}}
    return dst;
  }
  function solveLinear(A,b,n){
    for(var c=0;c<n;c++){
      var piv=c;for(var r=c+1;r<n;r++)if(Math.abs(A[r*n+c])>Math.abs(A[piv*n+c]))piv=r;
      if(Math.abs(A[piv*n+c])<1e-12)return null;
      if(piv!==c){for(var k=0;k<n;k++){var tmp=A[c*n+k];A[c*n+k]=A[piv*n+k];A[piv*n+k]=tmp;}var tb=b[c];b[c]=b[piv];b[piv]=tb;}
      for(r=c+1;r<n;r++){var f=A[r*n+c]/A[c*n+c];if(!f)continue;for(k=c;k<n;k++)A[r*n+k]-=f*A[c*n+k];b[r]-=f*b[c];}
    }
    var x=new Float64Array(n);for(c=n-1;c>=0;c--){var s=b[c];for(k=c+1;k<n;k++)s-=A[c*n+k]*x[k];x[c]=s/A[c*n+c];}
    return x;
  }
  function magicEnhance(data,w,h,opt){
    var n=w*h,out=new Uint8ClampedArray(data.length),gray=new Float32Array(n);
    var radius=Math.max(5,Math.round(Math.min(w,h)*.027));
    var channels=[],shadow=opt.shadow!==false;
    for(var c=0;c<3;c++){
      var input=new Float32Array(n);
      for(var i=0;i<n;i++){var alpha=data[i*4+3]/255;input[i]=data[i*4+c]*alpha+255*(1-alpha);}
      var paper=shadow?blurBox(closePaper(input,w,h,radius),w,h,Math.max(1,Math.round(radius*.18))):null;
      var normalized=new Float32Array(n);
      for(i=0;i<n;i++)normalized[i]=shadow?clamp(input[i]*255/Math.max(38,paper[i]),0,255):input[i];
      channels.push(normalized);
    }
    var brightness=(opt.brightness||100)/100,contrast=(opt.contrast||100)/100;
    var strong=opt.filter==='magic_plus',normL=new Float32Array(n);
    for(i=0;i<n;i++)normL[i]=channels[0][i]*.299+channels[1][i]*.587+channels[2][i]*.114;
    for(i=0;i<n;i++){
      var r=channels[0][i],g=channels[1][i],b=channels[2][i];
      var l=r*.299+g*.587+b*.114,chroma=Math.max(r,g,b)-Math.min(r,g,b);
      var whitePoint=strong?(opt.text===false?226:205):248,blackPoint=strong?48:0;
      var x=i%w,y=(i/w)|0,ridge=0;
      if(opt.text&&x>3&&x<w-4&&y>3&&y<h-4){
        ridge=Math.max(0,Math.max(Math.min(normL[i-2],normL[i+2]),Math.min(normL[i-3],normL[i+3]))-l,Math.max(Math.min(normL[i-w*2],normL[i+w*2]),Math.min(normL[i-w*3],normL[i+w*3]))-l);
      }
      var inkL=l-Math.min(56,ridge*(strong?1.95:.6));
      var ink=255*Math.pow(clamp((inkL-blackPoint)/(whitePoint-blackPoint),0,1),strong?1.35:1);
      var rawR=data[i*4],rawG=data[i*4+1],rawB=data[i*4+2];
      var coloredInk=rawB>Math.min(rawR,rawG)+5||rawR>rawG+18||(rawG>rawR+15&&(l<205||chroma>22));
      var colorWeight=clamp((chroma-3)/14,0,1)*(coloredInk?1:0);
      if(colorWeight){var colorL=strong?clamp(255*Math.pow(clamp(l/255,0,1),1.08),0,248):l;ink=ink*(1-colorWeight)+colorL*colorWeight;}
      ink=clamp((ink*brightness-128)*contrast+128,0,255);gray[i]=ink;
      var saturation=1+colorWeight*(strong?2.1:0);
      out[i*4]=ink+(r-l)*saturation*colorWeight;
      out[i*4+1]=ink+(g-l)*saturation*colorWeight;
      out[i*4+2]=ink+(b-l)*saturation*colorWeight;
      out[i*4+3]=255;
    }
    var amount=(opt.sharpness||0)/100*.8;
    if(amount){var smooth=blurBox(gray,w,h,1);for(i=0;i<n;i++){var detail=clamp((gray[i]-smooth[i])*amount,-20,20);for(c=0;c<3;c++)out[i*4+c]+=detail;}}
    if((strong&&opt.cleanSpots!==false)||opt.cleanSpots===true)removeIsolatedSpots(out,w,h);
    return out;
  }
  function removeIsolatedSpots(data,w,h){
    var seen=new Uint8Array(w*h),queue=new Int32Array(w*h),scale=Math.min(w,h)/900;
    var maxSize=Math.max(1,Math.round(2*scale*scale)),gap=Math.max(6,Math.round(6*scale));
    function dark(i){return data[i*4]*.299+data[i*4+1]*.587+data[i*4+2]*.114<165;}
    for(var s=0;s<w*h;s++){
      if(seen[s]||!dark(s))continue;
      var head=0,tail=1;queue[0]=s;seen[s]=1;var x0=w,y0=h,x1=0,y1=0;
      while(head<tail){var at=queue[head++],x=at%w,y=(at/w)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
        for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;var xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;var k=yy*w+xx;if(!seen[k]&&dark(k)){seen[k]=1;queue[tail++]=k;}}
      }
      if(tail>maxSize)continue;
      var nearInk=false;
      for(y=Math.max(0,y0-gap);y<=Math.min(h-1,y1+gap)&&!nearInk;y++)for(x=Math.max(0,x0-gap);x<=Math.min(w-1,x1+gap);x++){
        if(x>=x0&&x<=x1&&y>=y0&&y<=y1)continue;
        var probe=(y*w+x)*4;if(data[probe]*.299+data[probe+1]*.587+data[probe+2]*.114<242){nearInk=true;break;}
      }
      if(!nearInk)for(var j=0;j<tail;j++){var idx=queue[j]*4;data[idx]=data[idx+1]=data[idx+2]=255;}
    }
  }
  // Track continuous horizontal and vertical printed rules across 28 strips (supports tilted/curved borders, headers, tables, and Rx margin lines).
  function findRules(gray,w,h,vertical,start,end){
    var length=vertical?h:w,depth=vertical?w:h,bins=28,begin=Math.round(length*.06),finish=Math.round(length*.94);
    var step=(finish-begin)/bins,minD=Math.max(4,Math.round(depth*(start||.022))),maxD=Math.min(depth-5,Math.round(depth*(end||.978)));
    if(maxD-minD<6)return [];
    var cells=[];
    for(var bin=0;bin<bins;bin++){
      var line=new Float32Array(depth),from=Math.round(begin+bin*step),to=Math.round(begin+(bin+1)*step),count=Math.max(1,to-from);
      for(var d=minD;d<=maxD;d++){
        var score=0,hits=0;
        for(var t=from;t<to;t++){
          var dark=255;
          for(var k=-1;k<=1;k++){var dd=clamp(d+k,0,depth-1),v=gray[vertical?t*w+dd:dd*w+t];if(v<dark)dark=v;}
          var b1=Math.max(gray[vertical?t*w+Math.max(0,d-4):Math.max(0,d-4)*w+t],gray[vertical?t*w+Math.max(0,d-8):Math.max(0,d-8)*w+t]);
          var b2=Math.max(gray[vertical?t*w+Math.min(depth-1,d+4):Math.min(depth-1,d+4)*w+t],gray[vertical?t*w+Math.min(depth-1,d+8):Math.min(depth-1,d+8)*w+t]);
          var bgMax=Math.max(b1,b2),bgMin=Math.min(b1,b2),edge=(bgMin-dark>=Math.max(4,(bgMax-dark)*.25))?Math.max(0,bgMax-dark):0;score+=edge*(bgMax>40?180/Math.max(90,bgMax):1);if(edge>Math.max(6,Math.min(14,bgMax*.065))&&dark<bgMax*.935)hits++;
        }
        var hitFrac=hits/count;
        line[d]=(score/count)*(hitFrac>=.62?1:hitFrac>=.42?.55:.08);
      }
      cells.push(line);
    }
    var seedBins=[3,7,11,14,17,20,24],candidates=[],maxStep=3;
    seedBins.forEach(function(sb){
      var col=cells[sb];
      for(var d=minD+1;d<maxD;d++)if(col[d]>14&&col[d]>=col[d-1]&&col[d]>=col[d+1])candidates.push({sb:sb,d:d,val:col[d]});
    });
    candidates.sort(function(a,b){return b.val-a.val;});
    var found=[],minSep=Math.max(8,Math.round(depth*.018));
    candidates.forEach(function(cand){
      if(found.some(function(r){return Math.abs(r.cleanPath[cand.sb]-cand.d)<minSep;}))return;
      var path=new Int32Array(bins);path[cand.sb]=cand.d;
      for(var b=cand.sb+1;b<bins;b++){
        var prev=path[b-1],bestD=prev,bestS=-Infinity;
        for(var dd=Math.max(minD,prev-maxStep);dd<=Math.min(maxD,prev+maxStep);dd++){
          var s=cells[b][dd]-Math.abs(dd-prev)*2.8;if(s>bestS){bestS=s;bestD=dd;}
        }
        path[b]=bestD;
      }
      for(b=cand.sb-1;b>=0;b--){
        prev=path[b+1];bestD=prev;bestS=-Infinity;
        for(dd=Math.max(minD,prev-maxStep);dd<=Math.min(maxD,prev+maxStep);dd++){
          s=cells[b][dd]-Math.abs(dd-prev)*2.8;if(s>bestS){bestS=s;bestD=dd;}
        }
        path[b]=bestD;
      }
      var support=0,strength=0,validBins=[],binScores=new Float32Array(bins);
      for(b=0;b<bins;b++){var v=cells[b][path[b]];binScores[b]=v;if(v>10){support++;validBins.push(b);}strength+=v;}
      if(support<Math.round(bins*.68))return;
      if(validBins[validBins.length-1]-validBins[0]<Math.round(bins*.75))return;
      // Reject tracks that jump across a gap onto a different line/text label
      for(var vi=1;vi<validBins.length;vi++){
        if(Math.abs(path[validBins[vi]]-path[validBins[vi-1]])>Math.max(3,(validBins[vi]-validBins[vi-1])*2))return;
      }
      var cleanPath=new Float32Array(bins);
      for(b=0;b<bins;b++){
        if(cells[b][path[b]]>10){cleanPath[b]=path[b];continue;}
        var leftB=-1,rightB=-1;
        for(var k=b-1;k>=0;k--)if(cells[k][path[k]]>10){leftB=k;break;}
        for(k=b+1;k<bins;k++)if(cells[k][path[k]]>10){rightB=k;break;}
        if(leftB>=0&&rightB>=0)cleanPath[b]=path[leftB]+(path[rightB]-path[leftB])*(b-leftB)/(rightB-leftB);
        else if(leftB>=0)cleanPath[b]=path[leftB];
        else cleanPath[b]=path[rightB];
      }
      var roughness=0;for(b=1;b<bins-1;b++)roughness+=Math.abs(cleanPath[b-1]-2*cleanPath[b]+cleanPath[b+1]);
      if(roughness/bins>1.45)return;
      // Fit a smooth weighted quadratic curve to eliminate local wiggles from merged cells, text labels, and guilloche waves
      var u=new Float64Array(bins),mid=(bins-1)/2,baseW=new Float64Array(bins),maxScore=0;
      for(b=0;b<bins;b++){u[b]=(b-mid)/mid;if(binScores[b]>maxScore)maxScore=binScores[b];}
      for(b=0;b<bins;b++)baseW[b]=binScores[b]>Math.max(10,maxScore*.22)?Math.min(60,binScores[b]):0;
      function secMed(b0,b1){
        var arr=[];
        for(var bb=b0;bb<=b1;bb++)if(baseW[bb]>0)arr.push({v:cleanPath[bb],u:u[bb],w:baseW[bb]});
        if(!arr.length)for(bb=b0;bb<=b1;bb++)arr.push({v:cleanPath[bb],u:u[bb],w:1});
        arr.sort(function(x,y){return x.v-y.v;});
        var tot=0;arr.forEach(function(x){tot+=x.w;});
        var acc=0,pick=arr[arr.length>>1];
        for(var ai=0;ai<arr.length;ai++){acc+=arr[ai].w;if(acc>=tot*.5){pick=arr[ai];break;}}
        return {v:pick.v,u:pick.u,w:pick.w};
      }
      var pL=secMed(1,8),pM=secMed(9,18),pR=secMed(19,26),dLM=pM.v-pL.v,dMR=pR.v-pM.v;
      if(Math.abs(dLM)<=1.6&&Math.abs(dMR)>Math.max(1.4,Math.abs(dLM)*2)){
        pR.v=pM.v+dLM;
        for(b=18;b<bins;b++)if(Math.abs(cleanPath[b]-(pM.v+dLM*(b-13.5)/9))>1.4)baseW[b]=0;
      }else if(Math.abs(dMR)<=1.6&&Math.abs(dLM)>Math.max(1.4,Math.abs(dMR)*2)){
        pL.v=pM.v-dMR;
        for(b=0;b<=9;b++)if(Math.abs(cleanPath[b]-(pM.v+dMR*(b-13.5)/9))>1.4)baseW[b]=0;
      }
      var a0=pM.v,a1=(pR.v-pL.v)/(2*.65),a2=((pR.v+pL.v)/2-pM.v)/(.65*.65),rw=new Float64Array(bins);
      for(var it=0;it<5;it++){
        for(b=0;b<bins;b++){var pr=a0+a1*u[b]+a2*u[b]*u[b],er=Math.abs(cleanPath[b]-pr);rw[b]=baseW[b]/Math.pow(1+(er/1.4)*(er/1.4),2);}
        var s0=0,s1=0,s2=0,s3=0,s4=0,y0=0,y1=0,y2=0;
        for(b=0;b<bins;b++){var wb=rw[b];if(wb<=0)continue;var ub=u[b],u2=ub*ub,yb=cleanPath[b];s0+=wb;s1+=wb*ub;s2+=wb*u2;s3+=wb*u2*ub;s4+=wb*u2*u2;y0+=wb*yb;y1+=wb*ub*yb;y2+=wb*u2*yb;}
        if(s0<=1e-6)break;
        s2+=s0*1e-5;s4+=s0*2e-4;
        var solQ=solveLinear(new Float64Array([s0,s1,s2,s1,s2,s3,s2,s3,s4]),new Float64Array([y0,y1,y2]),3);
        if(!solQ)break;
        a0=solQ[0];a1=solQ[1];a2=solQ[2];
      }
      var outliers=0,errSum=0,errCnt=0,fitted=new Float32Array(bins);
      for(b=0;b<bins;b++){
        fitted[b]=a0+a1*u[b]+a2*u[b]*u[b];
        if(binScores[b]>10){var e=Math.abs(cleanPath[b]-fitted[b]);errSum+=e;errCnt++;if(e>2.2)outliers++;}
      }
      if(outliers>=5||errSum/Math.max(1,errCnt)>1.35)return;
      var smoothed=new Float32Array(bins);
      for(b=0;b<bins;b++){
        var rawP=(cleanPath[Math.max(0,b-1)]+2*cleanPath[b]+cleanPath[Math.min(bins-1,b+1)])/4;
        var trustRaw=(binScores[b]>=maxScore*.45&&Math.abs(rawP-fitted[b])<=1.5)?.15:0;
        smoothed[b]=fitted[b]*(1-trustRaw)+rawP*trustRaw;
      }
      var positions=new Float32Array(length);
      for(var t=0;t<length;t++){
        var f=(t-begin)/step-.5,ix=Math.floor(f),blend=f-ix;
        var lo=clamp(ix,0,bins-1),hi=clamp(ix+1,0,bins-1);
        positions[t]=smoothed[lo]*(1-blend)+smoothed[hi]*blend;
      }
      // Continuity and 4-quarter support check along the smoothed curve for both horizontal and vertical rules
      var contrasts=new Float32Array(finish-begin),boths=new Float32Array(finish-begin),nears=new Float32Array(finish-begin),bgs=new Float32Array(finish-begin);
      for(var tt=begin;tt<finish;tt++){
        var cd=Math.round(positions[tt]),dk=255,idx=tt-begin;
        for(var kk=-1;kk<=1;kk++){var ddk=clamp(cd+kk,0,depth-1),vv=gray[vertical?tt*w+ddk:ddk*w+tt];if(vv<dk)dk=vv;}
        var b1=gray[vertical?tt*w+Math.max(0,cd-5):Math.max(0,cd-5)*w+tt],b2=gray[vertical?tt*w+Math.min(depth-1,cd+5):Math.min(depth-1,cd+5)*w+tt];
        var b1n=gray[vertical?tt*w+Math.max(0,cd-2):Math.max(0,cd-2)*w+tt],b2n=gray[vertical?tt*w+Math.min(depth-1,cd+2):Math.min(depth-1,cd+2)*w+tt];
        var bgMax=Math.max(b1,b2),bgMin=Math.min(b1,b2);
        bgs[idx]=bgMax;contrasts[idx]=bgMax-dk;boths[idx]=bgMin-dk;nears[idx]=Math.max(b1n,b2n)-dk;
      }
      var sortedC=Array.from(contrasts).sort(function(a,b){return a-b;}),refContrast=sortedC[(sortedC.length*.75)|0]||0;
      var gaps=0,gapRun=0,whiteGaps=0,whiteGapRun=0,strongPixels=0,total=finish-begin,qStrong=[0,0,0,0],qCount=[0,0,0,0],sumNear2=0,sumContrast=0;
      for(tt=begin;tt<finish;tt++){
        idx=tt-begin;bgMax=bgs[idx];var contrast=contrasts[idx],bothContrast=boths[idx],near2=nears[idx];
        var q=Math.min(3,Math.floor(idx*4/total));qCount[q]++;
        if(contrast<Math.max(7,bgMax*.065,refContrast*.28)){whiteGapRun++;if(whiteGapRun===5)whiteGaps++;}else whiteGapRun=0;
        if(contrast>=Math.max(12,bgMax*.085,refContrast*.38)&&bothContrast>=Math.max(6,contrast*.22)){
          strongPixels++;qStrong[q]++;gapRun=0;sumNear2+=near2;sumContrast+=contrast;
        }else{gapRun++;if(gapRun===4)gaps++;}
      }
      if(a0>depth*.08&&a0<depth*.92&&whiteGaps>=(vertical?6:4))return;
      var goodQuarters=0;for(var qi=0;qi<4;qi++)if(qStrong[qi]/Math.max(1,qCount[qi])>=.44)goodQuarters++;
      if(strongPixels/total<.58||gaps>16||goodQuarters<3)return;
      if(a0>depth*.08&&a0<depth*.92&&sumNear2<sumContrast*.55)return;
      var sorted=Array.from(smoothed).sort(function(a,b){return a-b;}),target=sorted[(sorted.length/2)|0],minBinSep=Math.max(6,Math.round(minSep*.55));
      if(found.some(function(r){if(Math.abs(r.target-target)<minSep)return true;for(var bb=0;bb<bins;bb++)if(Math.abs(r.cleanPath[bb]-smoothed[bb])<minBinSep)return true;return false;}))return;
      found.push({positions:positions,target:target,cleanPath:smoothed,quality:strength/bins,tilt:a1,bow:a2});
    });
    found.sort(function(a,b){return a.target-b.target;});
    return found;
  }
  function sampleLine(line,t){var i=clamp(t,0,line.positions.length-1),a=i|0,f=i-a;return line.positions[a]*(1-f)+line.positions[Math.min(line.positions.length-1,a+1)]*f;}
  function lineModel(data,w,h){
    var scale=Math.min(1,760/Math.max(w,h)),aw=Math.max(16,Math.round(w*scale)),ah=Math.max(16,Math.round(h*scale));
    var gray=new Float32Array(aw*ah);
    for(var y=0;y<ah;y++){
      var y0=Math.floor(y*h/ah),y1=Math.max(y0+1,Math.ceil((y+1)*h/ah));
      for(var x=0;x<aw;x++){
        var x0=Math.floor(x*w/aw),x1=Math.max(x0+1,Math.ceil((x+1)*w/aw)),minL=255;
        for(var yy=y0;yy<y1;yy++)for(var xx=x0;xx<x1;xx++){var i=(yy*w+xx)*4,l=data[i]*.299+data[i+1]*.587+data[i+2]*.114;if(l<minL)minL=l;}
        gray[y*aw+x]=minL;
      }
    }
    var hRules=findRules(gray,aw,ah,false,.006,.994),vRules=findRules(gray,aw,ah,true,.006,.994);
    var minSepH=Math.max(8,Math.round(ah*.018)),minSepV=Math.max(8,Math.round(aw*.018));
    if(!hRules.length||hRules[0].target>ah*.075){
      var topM=findRules(gray,aw,ah,false,.004,.075);
      if(topM.length&&(!hRules.length||Math.abs(hRules[0].target-topM[0].target)>=minSepH))hRules.unshift(topM[0]);
    }
    if(!hRules.length||hRules[hRules.length-1].target<ah*.925){
      var botM=findRules(gray,aw,ah,false,.925,.996);
      if(botM.length&&(!hRules.length||Math.abs(hRules[hRules.length-1].target-botM[botM.length-1].target)>=minSepH))hRules.push(botM[botM.length-1]);
    }
    if(!vRules.length||vRules[0].target>aw*.085){
      var leftM=findRules(gray,aw,ah,true,.004,.085);
      if(leftM.length&&(!vRules.length||Math.abs(vRules[0].target-leftM[0].target)>=minSepV))vRules.unshift(leftM[0]);
    }
    if(!vRules.length||vRules[vRules.length-1].target<aw*.915){
      var rightM=findRules(gray,aw,ah,true,.915,.996);
      if(rightM.length&&(!vRules.length||Math.abs(vRules[vRules.length-1].target-rightM[rightM.length-1].target)>=minSepV))vRules.push(rightM[rightM.length-1]);
    }
    // Smooth displacement profiles across closely-spaced adjacent rules (e.g. table rows) so neighboring rows never shear against each other
    function smoothRuleGroup(rules,depth){
      if(rules.length<2)return;
      var band=depth*.14,len=rules[0].positions.length,newPos=rules.map(function(r){return new Float32Array(len);});
      for(var i=0;i<rules.length;i++){
        var ri=rules[i],wts=[],idxs=[];
        for(var j=0;j<rules.length;j++){
          var dz=(ri.target-rules[j].target)/band,w=Math.exp(-dz*dz)*Math.max(10,rules[j].quality||20);
          if(w>1e-3){wts.push(w);idxs.push(j);}
        }
        for(var t=0;t<len;t++){
          var sumD=0,sumW=0;
          for(var k=0;k<idxs.length;k++){var rj=rules[idxs[k]],wt=wts[k];sumD+=(rj.positions[t]-rj.target)*wt;sumW+=wt;}
          newPos[i][t]=ri.target+sumD/Math.max(1e-6,sumW);
        }
      }
      for(i=0;i<rules.length;i++)rules[i].positions=newPos[i];
    }
    smoothRuleGroup(hRules,ah);
    smoothRuleGroup(vRules,aw);
    var top=hRules.length&&hRules[0].target<ah*.21?hRules[0]:null;
    var bottom=hRules.length>=2&&hRules[hRules.length-1].target>ah*.78?hRules[hRules.length-1]:null;
    var left=vRules.length&&vRules[0].target<aw*.16?vRules[0]:null;
    var right=vRules.length>=2&&vRules[vRules.length-1].target>aw*.84?vRules[vRules.length-1]:null;
    var horizontal=!!(top&&bottom&&bottom.target-top.target>ah*.6);
    var vertical=!!(left&&right&&right.target-left.target>aw*.68);
    return {width:aw,height:ah,top:horizontal?top:null,bottom:horizontal?bottom:null,left:vertical?left:null,right:vertical?right:null,hRules:hRules,vRules:vRules};
  }
  function straighten(data,w,h,cleanMargins,rawData){
    var model=lineModel(rawData||data,w,h),hRules=model.hRules||[],vRules=model.vRules||[];
    if(!hRules.length&&!vRules.length)return {data:data,info:{straightened:false,marginCleaned:false,rules:0,hTargets:[]}};
    var hTargets=hRules.map(function(r){return r.target/model.height;});
    var horizontal=!!model.top,vertical=!!model.left;
    var marginFrame=horizontal&&vertical&&model.top.target<model.height*.12&&model.bottom.target>model.height*.89&&model.left.target<model.width*.10&&model.right.target>model.width*.90;
    cleanMargins=!!(cleanMargins&&marginFrame);
    function ruleRange(r){var mn=Infinity,mx=-Infinity;for(var i=0;i<r.positions.length;i++){var v=r.positions[i];if(v<mn)mn=v;if(v>mx)mx=v;}return mx-mn;}
    var hRanges=hRules.map(ruleRange).sort(function(a,b){return a-b;}),vRanges=vRules.map(ruleRange).sort(function(a,b){return a-b;});
    var maxHRange=hRanges.length?hRanges[hRanges.length-1]:0,medHRange=hRanges.length?hRanges[hRanges.length>>1]:0;
    var maxVRange=vRanges.length?vRanges[vRanges.length-1]:0,medVRange=vRanges.length?vRanges[vRanges.length>>1]:0,maxVBow=0;
    vRules.forEach(function(r){if(Math.abs(r.bow||0)>maxVBow)maxVBow=Math.abs(r.bow||0);});
    var hActive=hRules.length>0&&maxHRange>=2.6&&(hRules.length<4||medHRange>=2.2);
    var vActive=vRules.length>0&&maxVRange>=2.6&&(vRules.length<3||medVRange>=2.2)&&(hActive||hRules.length<4||maxVRange>=4.5||maxVBow>=2.2);
    var medHSlope=0,medVSlope=0;
    if(hRules.length>=2){
      var hs=hRules.map(function(r){return (r.positions[model.width-1]-r.positions[0])/Math.max(1,model.width-1);}).sort(function(a,b){return a-b;});
      medHSlope=hs[(hs.length/2)|0];
    }
    if(vRules.length>=1){
      var vs=vRules.map(function(r){return (r.positions[model.height-1]-r.positions[0])/Math.max(1,model.height-1);}).sort(function(a,b){return a-b;});
      medVSlope=vs[(vs.length/2)|0];
    }
    if(!hActive&&!vRoutesActive(vActive,vRules,hActive,medHSlope)&&!cleanMargins){
      return {data:data,info:{straightened:false,marginCleaned:false,rules:0,hTargets:hTargets}};
    }
    function vRoutesActive(vAct,vR,hAct,mHS){return vAct||(!vR.length&&hAct&&Math.abs(mHS)>.008);}
    var dst=new Uint8ClampedArray(data.length),sx=w/model.width,sy=h/model.height;
    function shiftH(coord,orth,fullLen){
      if(!hActive)return vActive&&!hRules.length&&Math.abs(medVSlope)>.008?-medVSlope*(orth-model.width*.5):0;
      if(coord<=hRules[0].target)return sampleLine(hRules[0],orth)-hRules[0].target;
      var last=hRules[hRules.length-1];
      if(coord>=last.target)return sampleLine(last,orth)-last.target;
      for(var k=0;k<hRules.length-1;k++){
        var a=hRules[k],b=hRules[k+1];
        if(coord>=a.target&&coord<=b.target){
          var t=(coord-a.target)/Math.max(1e-4,b.target-a.target);
          return (sampleLine(a,orth)-a.target)*(1-t)+(sampleLine(b,orth)-b.target)*t;
        }
      }
      return 0;
    }
    function shiftV(coord,orth,fullLen){
      if(!vActive)return hActive&&!vRules.length&&Math.abs(medHSlope)>.008?-medHSlope*(orth-model.height*.5):0;
      if(coord<=vRules[0].target)return sampleLine(vRules[0],orth)-vRules[0].target;
      var last=vRules[vRules.length-1];
      if(coord>=last.target)return sampleLine(last,orth)-last.target;
      for(var k=0;k<vRules.length-1;k++){
        var a=vRules[k],b=vRules[k+1];
        if(coord>=a.target&&coord<=b.target){
          var t=(coord-a.target)/Math.max(1e-4,b.target-a.target);
          return (sampleLine(a,orth)-a.target)*(1-t)+(sampleLine(b,orth)-b.target)*t;
        }
      }
      return 0;
    }
    for(var y=0;y<h;y++)for(var x=0;x<w;x++){
      var ax=x/sx,ay=y/sy;
      var sourceX=x+shiftV(ax,ay,model.width)*sx;
      var sourceY=y+shiftH(ay,sourceX/sx,model.height)*sy;
      var outside=sourceX<0||sourceY<0||sourceX>w-1||sourceY>h-1;
      var margin=cleanMargins&&horizontal&&vertical&&(ax<model.left.target-1.5||ax>model.right.target+1.5||ay<model.top.target-1.5||ay>model.bottom.target+1.5);
      var at=(y*w+x)*4;
      if(outside||margin){dst[at]=dst[at+1]=dst[at+2]=dst[at+3]=255;continue;}
      var ix=sourceX|0,iy=sourceY|0,fx=sourceX-ix,fy=sourceY-iy;
      for(var c=0;c<3;c++)dst[at+c]=(data[(iy*w+ix)*4+c]*(1-fx)+data[(iy*w+Math.min(w-1,ix+1))*4+c]*fx)*(1-fy)+(data[(Math.min(h-1,iy+1)*w+ix)*4+c]*(1-fx)+data[(Math.min(h-1,iy+1)*w+Math.min(w-1,ix+1))*4+c]*fx)*fy;
      dst[at+3]=255;
    }
    var activeRules=(hActive?hRules.length:0)+(vActive?vRules.length:0);
    return {data:dst,info:{straightened:activeRules>0,marginCleaned:!!(cleanMargins&&horizontal&&vertical),rules:activeRules,hTargets:hTargets}};
  }
  function textLineDewarp(data,w,h,pinnedHTargets){
    var none={data:data,info:{straightened:false,marginCleaned:false,rules:0}};
    if(w<64||h<64)return none;
    // If straighten already locked >=3 horizontal rules across the page (top, middle, bottom), no text-line polynomial warp is needed.
    if(pinnedHTargets&&pinnedHTargets.length>=3&&pinnedHTargets[pinnedHTargets.length-1]-pinnedHTargets[0]>.55)return none;
    var scale=Math.min(1,900/Math.max(w,h)),aw=Math.max(48,Math.round(w*scale)),ah=Math.max(48,Math.round(h*scale));
    var ink=new Float32Array(aw*ah),x,y,i;
    for(y=0;y<ah;y++){
      var y0=Math.floor(y*h/ah),y1=Math.max(y0+1,Math.floor((y+1)*h/ah)),ys=y1-y0>2?2:1;
      for(x=0;x<aw;x++){
        var x0=Math.floor(x*w/aw),x1=Math.max(x0+1,Math.floor((x+1)*w/aw)),xs=x1-x0>2?2:1,s=0,n=0;
        for(var yy=y0;yy<y1;yy+=ys)for(var xx=x0;xx<x1;xx+=xs){i=(yy*w+xx)*4;s+=data[i]*.299+data[i+1]*.587+data[i+2]*.114;n++;}
        ink[y*aw+x]=Math.max(0,235-s/n);
      }
    }
    var rx=Math.max(5,Math.round(aw*.022)),ry=Math.max(1,Math.round(ah*.004));
    var S=blurXY(blurXY(ink,aw,ah,rx,ry),aw,ah,rx,ry);
    var M=36,xMin=Math.round(aw*.04),xMax=Math.round(aw*.96),stepX=(xMax-xMin)/(M-1),cols=[],valleyR=Math.max(4,Math.round(ah*.012));
    for(var c=0;c<M;c++){
      var cx=Math.round(xMin+c*stepX),peaks=[];
      for(y=valleyR;y<ah-valleyR;y++){
        var v=S[y*aw+cx];
        if(v<6||v<S[(y-1)*aw+cx]||v<S[(y+1)*aw+cx])continue;
        if(v===S[(y-1)*aw+cx]&&v===S[(y+1)*aw+cx])continue;
        var isMax=true;for(var dy=-3;dy<=3;dy++)if(dy&&S[(y+dy)*aw+cx]>v){isMax=false;break;}
        if(!isMax)continue;
        var vLo=v,vHi=v;for(dy=1;dy<=valleyR;dy++){vLo=Math.min(vLo,S[(y-dy)*aw+cx]);vHi=Math.min(vHi,S[(y+dy)*aw+cx]);}
        var prom=v-.5*(vLo+vHi);if(prom<4)continue;
        var vm=S[(y-1)*aw+cx],vp=S[(y+1)*aw+cx],den=vm-2*v+vp;
        var subY=y+(Math.abs(den)>1e-4?clamp(.5*(vm-vp)/den,-.5,.5):0);
        peaks.push({c:c,x:cx,y:subY,w:prom,next:-1,prev:-1});
      }
      cols.push(peaks);
    }
    var maxDy=Math.max(2.5,stepX*.36);
    for(c=0;c<M-1;c++){
      var A=cols[c],B=cols[c+1];
      for(i=0;i<A.length;i++){
        var bestJ=-1,bestD=maxDy;
        for(var j=0;j<B.length;j++){var d=Math.abs(B[j].y-A[i].y);if(d<bestD){bestD=d;bestJ=j;}}
        if(bestJ>=0){
          var revI=-1,revD=maxDy;
          for(var ii=0;ii<A.length;ii++){var d2=Math.abs(B[bestJ].y-A[ii].y);if(d2<revD){revD=d2;revI=ii;}}
          if(revI===i){A[i].next=bestJ;B[bestJ].prev=i;}
        }
      }
    }
    var chains=[],samples=[],ws=[];
    for(c=0;c<M;c++){
      var P=cols[c];
      for(i=0;i<P.length;i++){
        if(P[i].prev!==-1||P[i].next===-1)continue;
        var ch=[],cc=c,idx=i;
        while(idx!==-1){ch.push(cols[cc][idx]);idx=cols[cc][idx].next;cc++;}
        if(ch.length<5)continue;
        var rough=0;for(var k=1;k<ch.length-1;k++)rough+=Math.abs(ch[k-1].y-2*ch[k].y+ch[k+1].y);
        if(rough/(ch.length-2)>1.1)continue;
        chains.push(ch);
        for(k=0;k<ch.length;k++){
          var k0=Math.max(0,k-2),k1=Math.min(ch.length-1,k+2);
          var slope=(ch[k1].y-ch[k0].y)/Math.max(1,ch[k1].x-ch[k0].x);
          if(Math.abs(slope)>.36)continue;
          var wt=ch[k].w*Math.min(2,ch.length/8);
          samples.push({X:(ch[k].x-aw/2)/(aw/2),Y:(ch[k].y-ah/2)/(ah/2),s:slope,w:wt});ws.push(wt);
        }
      }
    }
    if(samples.length<18||chains.length<2)return none;
    var zeroCount=0,absSlopes=new Float64Array(samples.length);
    for(var si0=0;si0<samples.length;si0++){var as=Math.abs(samples[si0].s);absSlopes[si0]=as;if(as<.015)zeroCount++;}
    absSlopes.sort();
    // Skip text-line dewarp if the majority of text lines on the page are already flat and horizontal
    if(zeroCount/samples.length>.62||absSlopes[absSlopes.length>>1]<.012)return none;
    // If straighten already straightened a header rule (pinnedHTargets.length >= 1), require strong coherent printed text chains (not messy handwriting)
    if(pinnedHTargets&&pinnedHTargets.length>=1){
      var avgLen=chains.reduce(function(acc,ch){return acc+ch.length;},0)/chains.length;
      if(avgLen<9.5)return none;
    }
    ws.sort(function(a,b){return a-b;});var capW=ws[(ws.length/2)|0]*4;
    var minX=9,maxX=-9,minY=9,maxY=-9;
    samples.forEach(function(p){p.w=Math.min(p.w,capW)/capW;minX=Math.min(minX,p.X);maxX=Math.max(maxX,p.X);minY=Math.min(minY,p.Y);maxY=Math.max(maxY,p.Y);});
    if(maxX-minX<.75)return none;
    var degX=3,degY=(maxY-minY>.5&&chains.length>=4)?2:1,terms=[];
    for(var di=0;di<=degX;di++)for(var dj=0;dj<=degY;dj++)terms.push([di,dj]);
    var T=terms.length,coef=null,phi=new Float64Array(T);
    function basis(X,Y,out){for(var k=0;k<T;k++)out[k]=Math.pow(X,terms[k][0])*Math.pow(Y,terms[k][1]);}
    var rw=samples.map(function(p){return p.w;}),sigma=0;
    for(var it=0;it<6;it++){
      var Mat=new Float64Array(T*T),rhs=new Float64Array(T),sumW=0;
      for(var si=0;si<samples.length;si++){var p=samples[si],wv=rw[si];if(wv<=0)continue;basis(p.X,p.Y,phi);sumW+=wv;
        for(var r=0;r<T;r++){rhs[r]+=wv*phi[r]*p.s;for(var c2=0;c2<T;c2++)Mat[r*T+c2]+=wv*phi[r]*phi[c2];}}
      for(r=0;r<T;r++){var o=terms[r][0]+terms[r][1];Mat[r*T+r]+=sumW*1.5e-4*o*o+1e-9;}
      var sol=solveLinear(Mat,rhs,T);if(!sol)return none;coef=sol;
      var resid=samples.map(function(p){basis(p.X,p.Y,phi);var v=0;for(var k=0;k<T;k++)v+=coef[k]*phi[k];return p.s-v;});
      var absr=resid.map(Math.abs).sort(function(a,b){return a-b;});sigma=Math.max(.004,1.4826*absr[(absr.length/2)|0]);
      rw=samples.map(function(p,k){var z=resid[k]/(2.2*sigma);return p.w/(1+z*z);});
    }
    if(pinnedHTargets&&pinnedHTargets.length>=1&&sigma>.018)return none;
    function slopeAt(px,py){
      var X=clamp((px-aw/2)/(aw/2),-1.05,1.05),Y=clamp((py-ah/2)/(ah/2),-1.05,1.05);
      var v=0;for(var k=0;k<T;k++)v+=coef[k]*Math.pow(X,terms[k][0])*Math.pow(Y,terms[k][1]);
      return clamp(v,-.36,.36);
    }
    var G=4,gxc=Math.ceil(aw/G)+2,gyc=Math.ceil(ah/G)+2,Ys=new Float32Array(gxc*gyc),xcI=Math.round(aw/2/G),maxDev=0;
    for(var gy=0;gy<gyc;gy++){
      var base=gy*gxc,yy0=gy*G,pin=1;
      if(pinnedHTargets&&pinnedHTargets.length){
        var yNorm=yy0/ah;
        pinnedHTargets.forEach(function(rt){pin=Math.min(pin,clamp((Math.abs(yNorm-rt)-.04)/.10,0,1));});
      }
      Ys[base+xcI]=yy0;
      for(var gx=xcI+1;gx<gxc;gx++){var xk=(gx-1)*G,yk=Ys[base+gx-1],s1=slopeAt(xk,yk)*pin;Ys[base+gx]=yk+slopeAt(xk+G/2,yk+s1*G/2)*pin*G;}
      for(gx=xcI-1;gx>=0;gx--){xk=(gx+1)*G;yk=Ys[base+gx+1];s1=slopeAt(xk,yk)*pin;Ys[base+gx]=yk-slopeAt(xk-G/2,yk-s1*G/2)*pin*G;}
      if(yy0>ah*.04&&yy0<ah*.96)for(gx=0;gx*G<=aw;gx++)maxDev=Math.max(maxDev,Math.abs(Ys[base+gx]-yy0));
    }
    if(maxDev<.65)return none;
    var dst=new Uint8ClampedArray(data.length),fxs=aw/w/G,fys=ah/h/G,hy=h/ah,tiltX=(!pinnedHTargets||!pinnedHTargets.length)&&Math.abs(coef[0])>.01?coef[0]:0;
    for(y=0;y<h;y++){
      var gyf=y*fys,g0=Math.min(gyc-2,gyf|0),ty=gyf-g0,r0=g0*gxc,r1=r0+gxc,dxShift=-tiltX*(y-h*.5);
      for(x=0;x<w;x++){
        var sx=x+dxShift,gxf=clamp(sx,0,w-1)*fxs,c0=Math.min(gxc-2,gxf|0),tx=gxf-c0;
        var ya=(Ys[r0+c0]*(1-tx)+Ys[r0+c0+1]*tx)*(1-ty)+(Ys[r1+c0]*(1-tx)+Ys[r1+c0+1]*tx)*ty;
        var sy=ya*hy,at=(y*w+x)*4;
        if(sx<0||sx>w-1||sy<0||sy>h-1){dst[at]=dst[at+1]=dst[at+2]=dst[at+3]=255;continue;}
        var ix0=sx|0,fx=sx-ix0,ix1=Math.min(w-1,ix0+1),iy0=sy|0,fy=sy-iy0,iy1=Math.min(h-1,iy0+1);
        for(var chI=0;chI<3;chI++)dst[at+chI]=(data[(iy0*w+ix0)*4+chI]*(1-fx)+data[(iy0*w+ix1)*4+chI]*fx)*(1-fy)+(data[(iy1*w+ix0)*4+chI]*(1-fx)+data[(iy1*w+ix1)*4+chI]*fx)*fy;
        dst[at+3]=255;
      }
    }
    return {data:dst,info:{straightened:true,marginCleaned:false,rules:chains.length,textLines:true,maxShift:Math.round(maxDev*hy*10)/10}};
  }
  function whitenBorderArtifacts(data,w,h){
    var band=Math.min(5,Math.max(2,Math.round(Math.min(w,h)*.006))),cBand=Math.min(18,Math.max(6,Math.round(Math.min(w,h)*.022))),seen=new Uint8Array(w*h),queue=new Int32Array(w*h),out=new Uint8ClampedArray(data);
    function luma(i){var at=i*4;return data[at]*.299+data[at+1]*.587+data[at+2]*.114;}
    function chroma(i){var at=i*4;return Math.max(data[at],data[at+1],data[at+2])-Math.min(data[at],data[at+1],data[at+2]);}
    function refPaper(x,y){
      var rx=clamp(x,band+2,Math.max(band+2,w-1-band-2)),ry=clamp(y,band+2,Math.max(band+2,h-1-band-2));
      return luma(ry*w+rx);
    }
    function dark(i){
      var x=i%w,y=(i/w)|0,L=luma(i),C=chroma(i),P=L-C*1.1,ref=refPaper(x,y);
      var inBand=x<band||x>=w-band||y<band||y>=h-band;
      var inCBand=x<cBand||x>=w-cBand||y<cBand||y>=h-cBand;
      return (inBand&&L<145&&L<ref-35)||(inCBand&&P<95&&(C>28||L<ref-55));
    }
    function clear(seed){if(seen[seed]||!dark(seed))return;var head=0,tail=1;queue[0]=seed;seen[seed]=1;
      while(head<tail){var at=queue[head++],x=at%w,y=(at/w)|0;var ns=[x?at-1:-1,x<w-1?at+1:-1,y?at-w:-1,y<h-1?at+w:-1];
        for(var k=0;k<4;k++){var ni=ns[k];if(ni<0||seen[ni]||!dark(ni))continue;seen[ni]=1;queue[tail++]=ni;}
      }
      if(tail>=Math.max(4,Math.round(band*.7)))for(var j=0;j<tail;j++){var idx=queue[j]*4;out[idx]=out[idx+1]=out[idx+2]=255;out[idx+3]=255;}
    }
    for(var x=0;x<w;x++){clear(x);clear((h-1)*w+x);}for(var y=0;y<h;y++){clear(y*w);clear(y*w+w-1);}
    return out;
  }
  function cleanBorders(data,w,h){
    if(w<24||h<24)return data;
    var band=Math.min(18,Math.max(3,Math.round(Math.min(w,h)*.015))),out=new Uint8ClampedArray(data),x,y,d,t,side;
    function L(i){var a=i*4;return out[a]*.299+out[a+1]*.587+out[a+2]*.114;}
    var hist=new Uint32Array(256),cnt=0;
    for(y=band;y<h-band;y+=4)for(x=band;x<w-band;x+=4){hist[L(y*w+x)|0]++;cnt++;}
    var acc=0,paper=255;for(var v=255;v>=0;v--){acc+=hist[v];if(acc>=cnt*.3){paper=v;break;}}
    var darkT=Math.min(210,paper-34);if(darkT<60)return data;
    function idx(side,d,t){return side===0?d*w+t:side===1?(h-1-d)*w+t:side===2?t*w+d:t*w+(w-1-d);}
    for(side=0;side<4;side++){
      var n=side<2?w:h,deep=-1;
      for(d=0;d<band;d++){
        var dark=0,tot=0;
        for(t=Math.round(n*.02);t<n-Math.round(n*.02);t+=2){tot++;if(L(idx(side,d,t))<darkT+18)dark++;}
        var frac=dark/Math.max(1,tot);
        if(frac>.24)deep=d;
        else if(d>=1&&frac<.08)break;
      }
      if(deep>=0){
        var from=Math.min(band+2,deep+2);
        for(d=0;d<from;d++)for(t=0;t<n;t++){var s4=idx(side,from,t)*4,d4=idx(side,d,t)*4;out[d4]=out[s4];out[d4+1]=out[s4+1];out[d4+2]=out[s4+2];out[d4+3]=255;}
      }
    }
    var seen=new Uint8Array(w*h),queue=new Int32Array(w*h),fill=Math.max(paper,240);
    function isDark(i){return L(i)<darkT;}
    function clear(seed){
      if(seen[seed]||!isDark(seed))return;var head=0,tail=1;queue[0]=seed;seen[seed]=1;
      while(head<tail){var at=queue[head++],cx=at%w,cy=(at/w)|0,ns=[cx?at-1:-1,cx<w-1?at+1:-1,cy?at-w:-1,cy<h-1?at+w:-1];
        for(var k=0;k<4;k++){var ni=ns[k];if(ni<0||seen[ni]||!isDark(ni))continue;var nx=ni%w,ny=(ni/w)|0;if(nx>=band&&nx<w-band&&ny>=band&&ny<h-band)continue;seen[ni]=1;queue[tail++]=ni;}}
      if(tail>=2)for(var j=0;j<tail;j++){var q4=queue[j]*4;out[q4]=out[q4+1]=out[q4+2]=fill;out[q4+3]=255;}
    }
    for(x=0;x<w;x++){clear(x);clear((h-1)*w+x);}for(y=0;y<h;y++){clear(y*w);clear(y*w+w-1);}
    return out;
  }
  function parseRgb(c){
    if(Array.isArray(c)&&c.length>=3)return [Math.max(0,Math.min(255,c[0]|0)),Math.max(0,Math.min(255,c[1]|0)),Math.max(0,Math.min(255,c[2]|0))];
    if(typeof c==='string'){
      var m=c.trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
      if(m){
        var h=m[1];
        if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
        var v=parseInt(h,16);
        return [(v>>16)&255,(v>>8)&255,v&255];
      }
    }
    return [255,255,255];
  }
  function applyTrim(data,w,h,trimPct,bgColor){
    if(!trimPct||trimPct<=0)return;
    var rgb=parseRgb(bgColor),cr=rgb[0],cg=rgb[1],cb=rgb[2];
    var tX=Math.max(1,Math.round(w*(trimPct/100))),tY=Math.max(1,Math.round(h*(trimPct/100)));
    for(var y=0;y<h;y++)for(var x=0;x<w;x++){
      if(x<tX||x>=w-tX||y<tY||y>=h-tY){
        var at=(y*w+x)*4;data[at]=cr;data[at+1]=cg;data[at+2]=cb;
      }
    }
  }
  function applyErases(data,w,h,erases){
    if(!erases||!erases.length)return;
    for(var i=0;i<erases.length;i++){
      var item=erases[i];
      if(!item)continue;
      var rgb=parseRgb(item.color),cr=rgb[0],cg=rgb[1],cb=rgb[2];
      var op=item.opacity!==undefined?Math.max(.05,Math.min(1,Number(item.opacity))):1;
      if((item.type==='stroke'||item.type==='heal')&&item.pts&&item.pts.length){
        var r=Math.max(1,Math.round((item.size||.014)*Math.min(w,h)));
        var hard=item.hardness!==undefined?Math.max(0,Math.min(1,Number(item.hardness))):(item.type==='heal'?.45:.85);
        var rInner=r*Math.min(.99,hard),rSpan=Math.max(.001,r-rInner),rSq=r*r,rInnerSq=rInner*rInner;
        var minPx=w-1,maxPx=0,minPy=h-1,maxPy=0;
        for(var pi=0;pi<item.pts.length;pi++){
          var ptx=Math.round(item.pts[pi].x*w),pty=Math.round(item.pts[pi].y*h);
          if(ptx<minPx)minPx=ptx;if(ptx>maxPx)maxPx=ptx;
          if(pty<minPy)minPy=pty;if(pty>maxPy)maxPy=pty;
        }
        var bx0=Math.max(0,minPx-r-1),bx1=Math.min(w-1,maxPx+r+1);
        var by0=Math.max(0,minPy-r-1),by1=Math.min(h-1,maxPy+r+1);
        var bw=bx1-bx0+1,bh=by1-by0+1;
        if(bw<=0||bh<=0)continue;
        var mask=new Uint8Array(bw*bh);
        function stampMask(cx,cy){
          var sx0=Math.max(bx0,cx-r),sx1=Math.min(bx1,cx+r);
          var sy0=Math.max(by0,cy-r),sy1=Math.min(by1,cy+r);
          for(var y=sy0;y<=sy1;y++){
            var dy=y-cy,dySq=dy*dy,rowOff=(y-by0)*bw-bx0;
            for(var x=sx0;x<=sx1;x++){
              var dx=x-cx,dSq=dx*dx+dySq;
              if(dSq>rSq)continue;
              var wt=255;
              if(dSq>rInnerSq){
                var t=(Math.sqrt(dSq)-rInner)/rSpan;
                wt=Math.round(127.5*(1+Math.cos(Math.PI*t)));
              }
              var mIdx=rowOff+x;
              if(wt>mask[mIdx])mask[mIdx]=wt;
            }
          }
        }
        for(var pIdx=0;pIdx<item.pts.length;pIdx++){
          var pt=item.pts[pIdx],cx=Math.round(pt.x*w),cy=Math.round(pt.y*h);
          if(pIdx>0){
            var prev=item.pts[pIdx-1],px=Math.round(prev.x*w),py=Math.round(prev.y*h);
            var dist=Math.hypot(cx-px,cy-py),steps=Math.max(1,Math.ceil(dist/Math.max(1,r*.3)));
            for(var s=0;s<=steps;s++){
              stampMask(Math.round(px+(cx-px)*(s/steps)),Math.round(py+(cy-py)*(s/steps)));
            }
          }else{stampMask(cx,cy);}
        }
        if(item.type==='heal'){
          var pad=Math.max(3,Math.min(14,Math.round(r*.55)));
          var hx0=Math.max(0,bx0-pad),hx1=Math.min(w-1,bx1+pad);
          var hy0=Math.max(0,by0-pad),hy1=Math.min(h-1,by1+pad);
          var samples=[],stepS=Math.max(1,Math.round(Math.max(bw,bh)/28));
          for(var sy=hy0;sy<=hy1;sy+=stepS){
            for(var sx=hx0;sx<=hx1;sx+=stepS){
              var inBox=sx>=bx0&&sx<=bx1&&sy>=by0&&sy<=by1;
              if(inBox&&mask[(sy-by0)*bw+(sx-bx0)]>12)continue;
              var sa=(sy*w+sx)*4,sr=data[sa],sg=data[sa+1],sb=data[sa+2];
              var lum=sr*.299+sg*.587+sb*.114;
              samples.push({x:sx,y:sy,r:sr,g:sg,b:sb,l:lum});
            }
          }
          if(samples.length>4){
            var sortedL=samples.map(function(v){return v.l;}).sort(function(a,b){return a-b;});
            var lCut=sortedL[Math.floor(sortedL.length*.45)];
            var clean=samples.filter(function(v){return v.l>=lCut;});
            if(clean.length>=3)samples=clean;
          }
          if(samples.length>36){
            var stride=samples.length/36,picked=[];
            for(var si=0;si<36;si++)picked.push(samples[Math.floor(si*stride)]);
            samples=picked;
          }
          for(var my=by0;my<=by1;my++){
            for(var mx=bx0;mx<=bx1;mx++){
              var mw=mask[(my-by0)*bw+(mx-bx0)];
              if(!mw)continue;
              var hr=cr,hg=cg,hb=cb;
              if(samples.length){
                var sumW=0,sumR=0,sumG=0,sumB=0;
                for(var k=0;k<samples.length;k++){
                  var sp=samples[k],dd=(mx-sp.x)*(mx-sp.x)+(my-sp.y)*(my-sp.y)+4;
                  var ww=1/(dd*dd);
                  sumW+=ww;sumR+=sp.r*ww;sumG+=sp.g*ww;sumB+=sp.b*ww;
                }
                hr=sumR/sumW;hg=sumG/sumW;hb=sumB/sumW;
              }
              var aH=(mw/255)*op,atH=(my*w+mx)*4;
              data[atH]=Math.round(data[atH]*(1-aH)+hr*aH);
              data[atH+1]=Math.round(data[atH+1]*(1-aH)+hg*aH);
              data[atH+2]=Math.round(data[atH+2]*(1-aH)+hb*aH);
            }
          }
        }else{
          for(var my2=by0;my2<=by1;my2++){
            for(var mx2=bx0;mx2<=bx1;mx2++){
              var mw2=mask[(my2-by0)*bw+(mx2-bx0)];
              if(!mw2)continue;
              var aS=(mw2/255)*op,atS=(my2*w+mx2)*4;
              data[atS]=Math.round(data[atS]*(1-aS)+cr*aS);
              data[atS+1]=Math.round(data[atS+1]*(1-aS)+cg*aS);
              data[atS+2]=Math.round(data[atS+2]*(1-aS)+cb*aS);
            }
          }
        }
      }else if(item.type==='rect'){
        var rx0=Math.max(0,Math.min(w-1,Math.round(Math.min(item.x0,item.x1)*w)));
        var rx1=Math.max(0,Math.min(w-1,Math.round(Math.max(item.x0,item.x1)*w)));
        var ry0=Math.max(0,Math.min(h-1,Math.round(Math.min(item.y0,item.y1)*h)));
        var ry1=Math.max(0,Math.min(h-1,Math.round(Math.max(item.y0,item.y1)*h)));
        for(var yy=ry0;yy<=ry1;yy++)for(var xx=rx0;xx<=rx1;xx++){
          var at=(yy*w+xx)*4;
          data[at]=Math.round(data[at]*(1-op)+cr*op);
          data[at+1]=Math.round(data[at+1]*(1-op)+cg*op);
          data[at+2]=Math.round(data[at+2]*(1-op)+cb*op);
        }
      }else if(item.type==='wand'){
        var wx=Math.max(0,Math.min(w-1,Math.round((item.x||0)*(w-1))));
        var wy=Math.max(0,Math.min(h-1,Math.round((item.y||0)*(h-1))));
        var sr0=0,sg0=0,sb0=0,scnt=0;
        for(var dyW=-1;dyW<=1;dyW++)for(var dxW=-1;dxW<=1;dxW++){
          var nxW=Math.max(0,Math.min(w-1,wx+dxW)),nyW=Math.max(0,Math.min(h-1,wy+dyW)),wa=(nyW*w+nxW)*4;
          sr0+=data[wa];sg0+=data[wa+1];sb0+=data[wa+2];scnt++;
        }
        sr0/=scnt;sg0/=scnt;sb0/=scnt;
        var tol=Math.max(2,Math.min(120,Number(item.tolerance)||28))*1.55;
        var tolSq=tol*tol*3,fringeSq=(tol+10)*(tol+10)*3;
        var vis=new Uint8Array(w*h),q=new Int32Array(w*h),qHead=0,qTail=0;
        var startIdx=wy*w+wx;
        vis[startIdx]=2;q[qTail++]=startIdx;
        var dirs=[-1,1,-w,w];
        while(qHead<qTail){
          var cur=q[qHead++],cxW=cur%w,cyW=(cur/w)|0;
          for(var di=0;di<4;di++){
            var nb=cur+dirs[di];
            if(di===0&&cxW===0)continue;
            if(di===1&&cxW===w-1)continue;
            if(di===2&&cyW===0)continue;
            if(di===3&&cyW===h-1)continue;
            if(vis[nb])continue;
            var na=nb*4,dr=data[na]-sr0,dg=data[na+1]-sg0,db=data[na+2]-sb0;
            var dSqW=dr*dr+dg*dg+db*db;
            if(dSqW<=tolSq){vis[nb]=2;q[qTail++]=nb;}
            else if(dSqW<=fringeSq){vis[nb]=1;}
          }
        }
        for(var vi=0;vi<w*h;vi++){
          if(!vis[vi])continue;
          var aW=vis[vi]===2?op:op*.45,va=vi*4;
          data[va]=Math.round(data[va]*(1-aW)+cr*aW);
          data[va+1]=Math.round(data[va+1]*(1-aW)+cg*aW);
          data[va+2]=Math.round(data[va+2]*(1-aW)+cb*aW);
        }
      }
    }
  }
  function process(data,w,h,opt){
    opt=opt||{};
    var enhanced=enhance(data,w,h,opt),result;
    if(opt.filter!=='original')enhanced=cleanBorders(enhanced,w,h);
    if(opt.straighten){
      var ruled=straighten(enhanced,w,h,!!opt.cleanMargins,data);
      var texted=textLineDewarp(ruled.data,w,h,ruled.info.hTargets);
      result=texted.info.straightened?{data:texted.data,info:{straightened:true,marginCleaned:ruled.info.marginCleaned,rules:ruled.info.rules+texted.info.rules,textLines:true,maxShift:texted.info.maxShift}}:ruled;
    }else result={data:enhanced,info:{straightened:false,marginCleaned:false,rules:0}};
    result.data=curve(result.data,w,h,opt.curve);
    if(opt.filter!=='original')result.data=cleanBorders(result.data,w,h);
    if(opt.trim>0)applyTrim(result.data,w,h,opt.trim,opt.bgColor);
    if(opt.erases&&opt.erases.length)applyErases(result.data,w,h,opt.erases);
    return result;
  }
  function enhance(data,w,h,opt) {
    data=whitenBorderArtifacts(data,w,h);
    if(opt && (opt.filter === "magic_plus" || opt.filter === "shadow" || ((opt.filter === "auto" || opt.filter === "color") && opt.shadow))) return magicEnhance(data,w,h,opt);
    opt=opt||{};var n=w*h,mode=opt.filter||'auto',out=new Uint8ClampedArray(data.length);
    var shadow=!!opt.shadow, text=!!opt.text,grayMode=mode==='gray'||mode==='bw';
    var brightness=(opt.brightness||100)/100,contrast=(opt.contrast||100)/100;
    var lum=new Float32Array(n), alpha=new Float32Array(n);
    for(var i=0;i<n;i++){var a=data[i*4+3]/255;alpha[i]=a;lum[i]=(data[i*4]*.299+data[i*4+1]*.587+data[i*4+2]*.114)*a+255*(1-a);}
    var cell=Math.max(12,Math.round(Math.min(w,h)/18)),gw=Math.ceil(w/cell),gh=Math.ceil(h/cell),grid=new Float32Array(gw*gh);
    if(shadow){for(var gy=0;gy<gh;gy++)for(var gx=0;gx<gw;gx++){
      var hist=new Uint32Array(256),count=0;
      for(var yy=gy*cell;yy<Math.min(h,(gy+1)*cell);yy+=2)for(var xx=gx*cell;xx<Math.min(w,(gx+1)*cell);xx+=2){hist[Math.round(lum[yy*w+xx])]++;count++;}
      var total=0,v=0;for(;v<255;v++){total+=hist[v];if(total>=count*.9)break;}grid[gy*gw+gx]=Math.max(55,v);
    }
    var sm=new Float32Array(grid.length);for(gy=0;gy<gh;gy++)for(gx=0;gx<gw;gx++){var sum=0,weight=0;for(var ky=-1;ky<=1;ky++)for(var kx=-1;kx<=1;kx++){var wt=kx===0&&ky===0?4:1;sum+=grid[clamp(gy+ky,0,gh-1)*gw+clamp(gx+kx,0,gw-1)]*wt;weight+=wt;}sm[gy*gw+gx]=sum/weight;}grid=sm;}
    var normalized=new Float32Array(n);
    for(var y=0;y<h;y++)for(var x=0;x<w;x++){
      i=y*w+x;var val=lum[i],gain=1;
      if(shadow){var fx=clamp(x/cell-.5,0,gw-1),fy=clamp(y/cell-.5,0,gh-1),x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0;
        var bg=(grid[y0*gw+x0]*(1-tx)+grid[y0*gw+Math.min(gw-1,x0+1)]*tx)*(1-ty)+(grid[Math.min(gh-1,y0+1)*gw+x0]*(1-tx)+grid[Math.min(gh-1,y0+1)*gw+Math.min(gw-1,x0+1)]*tx)*ty;
        gain=clamp(248/Math.max(55,bg),.85,3.2);var strength=mode==='color'?.65:mode==='auto'?.88:1;gain=1+(gain-1)*strength;
      }
      val=clamp((val*gain*brightness-128)*contrast+128,0,255);normalized[i]=val;
      var idx=i*4;
      if(grayMode){out[idx]=out[idx+1]=out[idx+2]=val;}
      else {var factor=lum[i]>1?val/lum[i]:1;for(var c=0;c<3;c++){var source=data[idx+c]*alpha[i]+255*(1-alpha[i]);out[idx+c]=source*factor;}}
      out[idx+3]=255;
    }
    if(mode==='bw'){
      var stride=w+1,integ=new Float64Array((w+1)*(h+1)),squares=new Float64Array(integ.length);
      for(y=1;y<=h;y++){var row=0,rowSq=0;for(x=1;x<=w;x++){var lv=normalized[(y-1)*w+x-1];row+=lv;rowSq+=lv*lv;integ[y*stride+x]=integ[(y-1)*stride+x]+row;squares[y*stride+x]=squares[(y-1)*stride+x]+rowSq;}}
      var radius=Math.max(8,Math.round(Math.min(w,h)/70));
      for(y=0;y<h;y++)for(x=0;x<w;x++){var l=Math.max(0,x-radius),r=Math.min(w,x+radius+1),t=Math.max(0,y-radius),b=Math.min(h,y+radius+1),count=(r-l)*(b-t);
        var mean=(integ[b*stride+r]-integ[t*stride+r]-integ[b*stride+l]+integ[t*stride+l])/count;
        var variance=(squares[b*stride+r]-squares[t*stride+r]-squares[b*stride+l]+squares[t*stride+l])/count-mean*mean;
        var threshold=mean*(1+.18*(Math.sqrt(Math.max(0,variance))/128-1));var vv=normalized[y*w+x]<threshold?0:255;var di=(y*w+x)*4;out[di]=out[di+1]=out[di+2]=vv;
      }
    }else{
      var amount=(opt.sharpness||0)/100*1.2+(text?.35:0);
      if(amount){var base=out.slice();for(y=1;y<h-1;y++)for(x=1;x<w-1;x++){i=y*w+x;var blur=(normalized[i]*4+normalized[i-1]+normalized[i+1]+normalized[i-w]+normalized[i+w])/8;var detail=(normalized[i]-blur)*amount;if(Math.abs(detail)<1)continue;for(c=0;c<3;c++)out[i*4+c]=base[i*4+c]+detail;}}
    }
    return out;
  }
  function curve(data,w,h,amount) {
    if(!amount)return data;
    var out=new Uint8ClampedArray(data.length),k=clamp(amount,-50,50)/50*.12;
    for(var y=0;y<h;y++)for(var x=0;x<w;x++){
      var u=x/Math.max(1,w-1),v=y/Math.max(1,h-1),sy=clamp((v+k*Math.sin(Math.PI*u)*Math.sin(Math.PI*v))*Math.max(1,h-1),0,h-1),y0=sy|0,f=sy-y0;
      for(var c=0;c<4;c++)out[(y*w+x)*4+c]=data[(y0*w+x)*4+c]*(1-f)+data[(Math.min(h-1,y0+1)*w+x)*4+c]*f;
    }return out;
  }
  return { detect:detect, enhance:enhance, process:process, straighten:straighten, textLineDewarp:textLineDewarp, cleanBorders:cleanBorders, lineModel:lineModel, curve:curve, validQuad:validQuad, area:area, fullQuad:full };
});
