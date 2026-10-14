(async()=>{
'use strict';
const $=id=>document.getElementById(id),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const p=clamp((v-a)/(b-a));return p*p*(3-2*p)};
const sectionNodes=[...document.querySelectorAll('section[data-chapter]')];
const chapterTitles=['ファーストビュー','コンセプト','動画広告','SNS運用','動画クリエイティブ制作代行','マーケティング支援','AIを活用した動画制作','動画表現','実績紹介','制作料金','お問い合わせ'];
const systemMotion=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
let width=innerWidth,height=innerHeight,small=width<=880,lowMotion=systemMotion.matches,isHidden=document.hidden;
let bounds=[],frame=0,last=0,time=0,active=-1,y=scrollY,phase='',pointer={x:0,y:0},surfaceTarget={x:0,y:0},surfaceCurrent={x:0,y:0};
let arrivalKey='',arrivalSince=0,settleTimer=0,settleFrame=0,pointerHeld=false,scrollDirection=1,observedY=scrollY;
let plan;try{const r=await fetch('journey-manifest.bb706626d732.json');if(!r.ok)throw Error('Journey unavailable');plan=await r.json();}catch(e){console.error(e);return;}
const safe=p=>typeof p==='string'&&/^(media|journey-media)\/[a-zA-Z0-9_./-]+$/.test(p)&&!p.includes('..');
if(plan.services?.length!==5||!safe(plan.roof.poster)||!safe(plan.roof.video)||!plan.descent.frames.every(safe))throw Error('Invalid journey settings');
const canvas=$('journeyCanvas'),ctx=canvas.getContext('2d'),images=new Map(),queue=[],queued=new Set();let busy=0;
function asset(path){if(images.has(path))return images.get(path);if(!safe(path))throw Error('Invalid media path');if(!queued.has(path)){queued.add(path);queue.push(path);pump();}return null;}
function pump(){while(queue.length&&busy<(small?4:6)){const path=queue.shift(),im=new Image();busy++;im.onload=()=>{images.set(path,im);busy--;pump();schedule();};im.onerror=()=>{busy--;canvas.dataset.mediaError=path;pump();};im.src=path;}}
asset(plan.roof.poster);plan.services.forEach(s=>['outside','close','boundary','inside'].forEach(k=>asset(s[k].image)));plan.descent.frames.forEach(asset);
const roofVideo=document.createElement('video');roofVideo.muted=true;roofVideo.playsInline=true;roofVideo.preload='metadata';roofVideo.src=plan.roof.video;roofVideo.poster=plan.roof.poster;roofVideo.setAttribute('aria-hidden','true');roofVideo.style.display='none';$('loops').append(roofVideo);
roofVideo.addEventListener('loadeddata',()=>{if(phase==='roof-hold'&&!lowMotion&&!isHidden)roofVideo.play().catch(()=>{});schedule();});roofVideo.addEventListener('timeupdate',()=>{if(roofVideo.currentTime>=plan.roof.endTime){roofVideo.pause();roofVideo.dataset.playback='hold';}});
roofVideo.addEventListener('ended',()=>roofVideo.dataset.playback='hold');
function stopVideos(){roofVideo.pause();}
function cancelSettle(){clearTimeout(settleTimer);cancelAnimationFrame(settleFrame);settleTimer=settleFrame=0;delete document.body.dataset.settling;}
function cancelPassageBridge(){}
function arrivedOpacity(key,now){if(arrivalKey!==key){arrivalKey=key;arrivalSince=now;}return lowMotion?1:smooth(0,420,now-arrivalSince);}
function setMotion(value){cancelSettle();lowMotion=value;document.documentElement.style.scrollBehavior=value?'auto':'smooth';document.body.classList.toggle('low-motion',value);$('motionToggle').textContent=value?'動きを戻す':'動きを弱める';$('motionToggle').setAttribute('aria-pressed',String(value));stopVideos();phase='';schedule();}
$('motionToggle').addEventListener('click',()=>setMotion(!lowMotion));systemMotion.addEventListener('change',e=>setMotion(e.matches));
function measure(){const t=plan.timing;const roof=$('rooftop');roof.style.height=height*(t.roofReadScreens+t.descentScreens)+'px';const span=t.outerScreens+t.entryScreens+t.innerScreens+t.exitScreens+t.transferScreens;plan.services.forEach(s=>{$(s.id).style.height=height*span+'px';$(s.id+'-inside').style.top=height*(t.outerScreens+t.entryScreens)+'px';});const track=$('worksTrack');$('works').style.height=small?'':height+Math.max(0,track.scrollWidth-width)+'px';bounds=sectionNodes.map(n=>({id:n.id,name:n.dataset.chapter,top:n.offsetTop,height:n.offsetHeight}));}
function frameRect(){if(!small||(bounds[1]&&y<bounds[1].top+bounds[1].height))return {x:0,y:0,w:width,h:height};return {x:0,y:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'))+12,w:width,h:width*9/16};}
function drawSource(source,quad,alpha=1){if(!source)return false;const sw=source.videoWidth||source.naturalWidth,sh=source.videoHeight||source.naturalHeight;if(!sw||!sh)return false;let sx=0,sy=0,cw=sw,ch=sh;if(Number.isInteger(quad)){cw=sw/2-5;ch=sh/2-5;sx=(quad%2)*sw/2+2.5;sy=Math.floor(quad/2)*sh/2+2.5;}
 const r=frameRect(),scale=Math.max(r.w/cw,r.h/ch),dw=cw*scale,dh=ch*scale;ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.globalAlpha=alpha;ctx.drawImage(source,sx,sy,cw,ch,r.x+(r.w-dw)*(small&&bounds[1]&&y<bounds[1].top+bounds[1].height?.1:.5),r.y+(r.h-dh)/2,dw,dh);ctx.restore();return true;}
function beginCanvas(){const dpr=canvas.width/width;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.fillStyle=small?'#0c0c0e':'#171b1c';ctx.fillRect(0,0,width,height);}
function still(m,alpha=1){return drawSource(asset(m.image),m.quad,alpha);}
function blend(a,b,p){still(a);still(b,smooth(0,1,p));}
function sequence(list,p){const q=clamp(p)*(list.length-1),n=Math.min(list.length-2,Math.floor(q));blend(list[n],list[n+1],q-n);}
function notice(_text){}
function panel(node,opacity,now){const el=node.querySelector('.scene');el.style.visibility=opacity>0?'visible':'hidden';el.style.opacity=String(opacity*arrivedOpacity(node.id,now));el.style.pointerEvents=opacity>.8?'auto':'none';el.dataset.arrived=String(opacity>0);}
function servicePhase(bound){const s=(y-bound.top)/height,t=plan.timing;const a=t.outerScreens,b=a+t.entryScreens,c=b+t.innerScreens,d=c+t.exitScreens;return s<a?{key:'outside',p:s/a}:s<b?{key:'entry',p:(s-a)/(b-a)}:s<c?{key:'inside',p:(s-b)/(c-b)}:s<d?{key:'exit',p:(s-c)/(d-c)}:{key:'transfer',p:(s-d)/t.transferScreens};}
function passageAt(position){const roof=bounds[1],t=plan.timing;if(position>=roof.top+t.roofReadScreens*height&&position<roof.top+roof.height)return {start:roof.top+t.roofReadScreens*height,end:roof.top+roof.height};for(let i=0;i<5;i++){const b=bounds[i+2],a=b.top+t.outerScreens*height,inside=a+t.entryScreens*height,exit=inside+t.innerScreens*height,end=b.top+b.height;if(position>a&&position<inside)return {start:a,end:inside};if(position>exit&&position<end)return {start:exit,end};}return null;}
function queueSettle(){clearTimeout(settleTimer);if(lowMotion||small||isHidden||pointerHeld||document.querySelector('dialog[open]'))return;settleTimer=setTimeout(()=>{const p=passageAt(scrollY);if(!p)return;const from=scrollY,q=(from-p.start)/(p.end-p.start),to=scrollDirection>0?(q>.12?p.end:p.start):(q<.88?p.start:p.end),distance=to-from;if(Math.abs(distance)<1)return;let start;document.body.dataset.settling=scrollDirection>0?'forward':'backward';const step=now=>{start??=now;const v=clamp((now-start)/650),e=v*v*(3-2*v);scrollTo({top:from+distance*e,behavior:'instant'});schedule();if(v<1)settleFrame=requestAnimationFrame(step);else{settleFrame=0;delete document.body.dataset.settling;}};settleFrame=requestAnimationFrame(step);},160);}
const chapterMenu=$('chapterMenu');sectionNodes.forEach((node,i)=>{const link=document.createElement('a');link.href='#'+node.id;const number=document.createElement('span');number.textContent=String(i).padStart(2,'0');const text=document.createElement('div');const title=document.createElement('b');title.textContent=chapterTitles[i];const name=document.createElement('small');name.textContent=node.dataset.chapter;text.append(title,name);link.append(number,text);chapterMenu.append(link)});
let priorFocus=null,priorOverflow='';
function openDialog(dialog){cancelSettle();cancelPassageBridge();priorFocus=document.activeElement;priorOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();dialog.querySelector('.close')?.focus()}
document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>{document.body.style.overflow=priorOverflow;priorFocus?.focus()});dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close()})});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));$('menuOpen').addEventListener('click',()=>openDialog($('menu')));chapterMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>$('menu').close()));
const works=[...document.querySelectorAll('[data-work]:not([hidden])')];$('worksTrack').addEventListener('focusin',event=>{const card=event.target.closest('[data-work]');if(!card||small||!card.matches(':focus-visible'))return;const index=works.indexOf(card),gap=parseFloat(getComputedStyle($('worksTrack')).gap)||0,distance=Math.max(0,$('worksTrack').scrollWidth-width);scrollTo({top:$('works').offsetTop+Math.min(distance,index*(card.offsetWidth+gap)),behavior:'instant'});schedule()});works.forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.video,v=$('workVideo');v.pause();v.hidden=!key;$('workImage').hidden=true;if(key){v.src='company-media/'+key+'.mp4';v.poster='company-media/'+key+'.jpg';v.load();}$('workTitle').textContent=button.querySelector('h3').textContent;$('workDescription').textContent=button.querySelector('p').textContent;$('workNote').textContent=button.dataset.note;$('workNote').hidden=!button.dataset.note;openDialog($('workDetail'));if(key)v.play().catch(()=>{});}));
$('workDetail').addEventListener('close',()=>{$('workVideo').pause();});
const demoWords={light:['ひと筋の光','分かれた色'],glass:['透ける面','曇る面'],air:['集まる気配','広がる気配']};document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>{const on=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(on));button.querySelector('.demo-state').textContent=demoWords[button.dataset.demo][Number(on)]}));
document.querySelectorAll('.surface').forEach(surface=>{surface.addEventListener('pointermove',event=>{if(small||lowMotion||!fine.matches)return;const r=surface.getBoundingClientRect();surfaceTarget={x:-(event.clientY-r.top-r.height/2)/r.height*4,y:(event.clientX-r.left-r.width/2)/r.width*4}});surface.addEventListener('pointerleave',()=>surfaceTarget={x:0,y:0})});

function updateScene(now){
 y=scrollY;document.body.dataset.visualScrollY=y.toFixed(2);if(!bounds.length)return;
 sectionNodes.filter(n=>n.classList.contains('film-chapter')).forEach(n=>{const p=n.querySelector('.scene');p.style.visibility='hidden';p.style.opacity=0;p.style.pointerEvents='none';});
 const roof=bounds[1],roofExit=roof.top+roof.height,filmEnd=bounds[6].top+bounds[6].height,arrival=roof.top-height*.32,intro=clamp(y/arrival);
 const introVisible=1-smooth(.015,.07,intro);$('introCopy').style.opacity=introVisible;$('introCopy').style.transform='translateY('+(-18*(1-introVisible))+'px)';document.querySelector('.intro-bottom').style.opacity=introVisible;
 const opening=$('firstView');opening.style.opacity=y<roof.top?'1':'0';opening.contentWindow?.postMessage({type:'sample-fv',active:y<=roof.top&&!isHidden,reduced:lowMotion,progress:intro,pointer},location.origin);
 $('prism').style.opacity=0;$('fallback').style.opacity=0;$('flash').style.opacity=0;$('dust').style.opacity=0;$('travel').style.opacity=0;
 let light=false,chapter=0;const reference=y+height*.25;bounds.forEach((b,i)=>{if(reference>=b.top)chapter=i;});
 canvas.style.opacity=y>=roof.top&&y<filmEnd?'1':'0';$('mediaDeck').style.opacity=y>=roof.top&&y<filmEnd?'1':'0';$('blackTide').style.transform=y>=filmEnd?'translateY(0%)':'translateY(110%)';notice('');
 if(y<roof.top){stopVideos();document.body.dataset.mediaState=intro<.035?'waiting-particles':intro<1?'existing-video':'arrival-hold';if(y>=arrival){chapter=1;panel($('rooftop'),1,now);light=true;}else arrivalKey='';phase='opening';}
 else if(y<roofExit){
  chapter=1;beginCanvas();const t=plan.timing,p=clamp((y-roof.top-t.roofReadScreens*height)/(t.descentScreens*height));
  if(p===0){if(phase!=='roof-hold'){if(roofVideo.readyState>0)roofVideo.currentTime=0;roofVideo.dataset.playback='playing';if(!lowMotion&&!isHidden)roofVideo.play().catch(()=>{});}if(lowMotion)roofVideo.pause();drawSource(roofVideo.readyState>1?roofVideo:asset(plan.roof.poster));panel($('rooftop'),1,now);phase='roof-hold';}
  else{stopVideos();arrivalKey='';const paths=plan.descent.frames,fp=Math.min(p/.84,1),cut=plan.descent.firstPartFraction,wanted=fp<cut?Math.round(fp/cut*60):61+Math.round((fp-cut)/(1-cut)*60);let found=wanted;while(found>0&&!images.has(paths[found]))found--;const im=images.get(paths[found]);drawSource(im||asset(plan.roof.poster));if(p>.84){still(plan.services[0].outside,smooth(.84,1,p));notice('接続映像準備中');}canvas.dataset.renderedFrame=String(found);phase='roof-descent';}
  light=true;document.body.dataset.mediaState=phase;document.body.dataset.mediaKind='existing-video';
 }
 else if(y<filmEnd){
  stopVideos();beginCanvas();let i=0;for(let j=0;j<5;j++)if(y>=bounds[j+2].top)i=j;chapter=i+2;const s=plan.services[i],state=servicePhase(bounds[i+2]);
  if(state.key==='outside'){still(s.outside);panel($(s.id),1,now);notice('構図サンプル ／ 動画準備中');}
  else if(state.key==='inside'){still(s.inside);notice('構図サンプル ／ '+s.innerLabel);}
  else{arrivalKey='';if(state.key==='entry'){sequence([s.outside,s.close,s.boundary,s.inside],state.p);notice('進入映像準備中');}
   else if(state.key==='exit'){blend(s.inside,s.outside,state.p);notice('退出映像準備中');}
   else if(i<4){blend(s.outside,plan.services[i+1].outside,state.p);notice('場所間の移動映像準備中');}
   else{still(s.outside);$('mediaDeck').style.opacity=1-smooth(.25,1,state.p);$('blackTide').style.transform='translateY('+(110*(1-smooth(.25,1,state.p)))+'%)';notice(state.p<.7?'退出映像準備中':'');}
  }
  phase=s.id+':'+state.key;document.body.dataset.mediaState=phase;document.body.dataset.mediaKind='still-preview';canvas.dataset.service=s.id;canvas.dataset.phase=state.key;canvas.dataset.progress=state.p.toFixed(3);light=state.key==='outside';
 }else{stopVideos();phase='dark';document.body.dataset.mediaState='dark';delete document.body.dataset.mediaKind;}
 if(chapter!==active){active=chapter;document.body.dataset.chapter=bounds[chapter].id;$('railNumber').textContent='CH.'+String(chapter).padStart(2,'0');$('railName').textContent=bounds[chapter].name;chapterMenu.querySelectorAll('a').forEach((link,i)=>{if(i===chapter)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});const id=chapter===0?'prologue':chapter<=6?'about':bounds[chapter].id;document.querySelectorAll('.top-nav a').forEach(link=>{if(link.hash==='#'+id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});}
 const b=bounds[chapter],progress=clamp((y-b.top)/b.height);$('railFill').style.height=(chapter+progress)/bounds.length*100+'%';$('header').classList.toggle('is-light',light);document.querySelector('.rail').classList.toggle('is-light',light);$('header').classList.toggle('scrolled',y>35);
 if(!small){const w=bounds.find(b=>b.id==='works'),track=$('worksTrack'),distance=Math.max(0,track.scrollWidth-width),x=clamp(y-w.top,0,distance);track.style.transform='translate3d('+(-x)+'px,0,0)';$('worksProgress').style.width=(distance?x/distance*100:0)+'%';}else $('worksTrack').style.transform='';
}
function resize(){cancelSettle();width=innerWidth;height=innerHeight;small=width<=880;const ratio=Math.min(devicePixelRatio||1,small?1.3:1.6);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);measure();phase='';schedule();}
function render(now){frame=0;if(isHidden)return;const dt=last?Math.min((now-last)/1000,.08):0;last=now;if(!lowMotion)time+=dt;updateScene(now);if(!small&&fine.matches&&!lowMotion){surfaceCurrent.x+=(surfaceTarget.x-surfaceCurrent.x)*.12;surfaceCurrent.y+=(surfaceTarget.y-surfaceCurrent.y)*.12;document.querySelectorAll('.surface').forEach(s=>s.style.transform='rotateX('+surfaceCurrent.x+'deg) rotateY('+surfaceCurrent.y+'deg)');}else document.querySelectorAll('.surface').forEach(s=>s.style.transform='none');if(!lowMotion)schedule();}
function schedule(){if(!frame&&!isHidden)frame=requestAnimationFrame(render);}
addEventListener('pointermove',e=>{pointer={x:(e.clientX/width-.5)*2,y:(e.clientY/height-.5)*2};schedule();},{passive:true});
addEventListener('scroll',()=>{if(Math.abs(scrollY-observedY)>.5)scrollDirection=scrollY>observedY?1:-1;observedY=scrollY;schedule();if(!settleFrame)queueSettle();},{passive:true});
addEventListener('resize',resize,{passive:true});for(const type of ['wheel','touchstart'])addEventListener(type,cancelSettle,{passive:true});
addEventListener('pointerdown',()=>{pointerHeld=true;cancelSettle();},{passive:true});for(const type of ['pointerup','pointercancel'])addEventListener(type,()=>{pointerHeld=false;},{passive:true});
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))cancelSettle();});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',cancelSettle));
new ResizeObserver(()=>{measure();schedule();}).observe($('contact'));
document.addEventListener('visibilitychange',()=>{isHidden=document.hidden;if(isHidden){cancelSettle();cancelAnimationFrame(frame);frame=0;stopVideos();}else{last=0;phase='';schedule();}});
setMotion(lowMotion);resize();
// Resolve deep links after the asynchronous settings load has established chapter heights.
requestAnimationFrame(()=>requestAnimationFrame(()=>{let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{}const target=id&&document.getElementById(id);if(target){cancelSettle();scrollTo({top:target.getBoundingClientRect().top+scrollY,behavior:'instant'});}schedule();}));
})();
