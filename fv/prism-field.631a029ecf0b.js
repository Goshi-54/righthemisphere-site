(()=>{
 'use strict';
 const stage=document.getElementById('particleStage'),canvas=document.getElementById('particleCanvas'),film=document.getElementById('footageCanvas'),filmCtx=film.getContext('2d');
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
 let width=innerWidth,height=innerHeight,ratio=1,time=0,last=0,lastDraw=0,frame=0,active=true,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,progress=0,pointer={x:0,y:0},view={x:0,y:0};
 let particles=null,quad=null,buffer=null,target=null,texture=null,count=0,drawCount=0;
 let paths=[],images=[],ready=[],pending=[],requested=new Set(),busy=0,currentFrame=0;
 const locations={};
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
 function program(v,f){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
 function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
 function populate(){
  const rand=random(931728);count=width<=760?2600:6000;const data=new Float32Array(count*4);
  for(let i=0;i<count;i++){data[i*4]=(rand()-.35)*46;data[i*4+1]=(rand()-.5)*22;data[i*4+2]=(rand()-.5)*26;data[i*4+3]=rand()}
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);stage.dataset.particleCount=String(count);
 }
 function resize(){
  width=innerWidth;height=innerHeight;ratio=Math.min(devicePixelRatio||1,width<=760?1.5:1.75);
  canvas.width=film.width=Math.round(width*ratio);canvas.height=film.height=Math.round(height*ratio);
  if(gl&&particles){populate();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)stage.dataset.rendererError='framebuffer';gl.bindFramebuffer(gl.FRAMEBUFFER,null)}
  schedule();
 }
 function load(i){if(i<0||i>=paths.length||requested.has(i))return;requested.add(i);pending.push(i);pump()}
 function pump(){while(pending.length&&busy<(width<=760?4:6)){const i=pending.shift(),image=new Image();busy++;image.onload=()=>{images[i]=image;ready[i]=true;busy--;pump();schedule()};image.onerror=()=>{busy--;stage.dataset.mediaFallback='true';pump()};image.src=paths[i]}}
 fetch('opening-journey.320c717dcda9.json').then(r=>{if(!r.ok)throw Error('Opening unavailable');return r.json()}).then(data=>{
  if(!Array.isArray(data.frames)||data.frames.length>400)throw Error('Invalid opening');
  paths=data.frames.filter(x=>typeof x==='string'&&(x.startsWith('intro-frames/')||x.startsWith('../media/production-'))&&!x.includes('://'));
  images=Array(paths.length);load(0);load(paths.length-1);for(let i=1;i<paths.length-1;i++)load(i);
 }).catch(()=>{stage.dataset.mediaFallback='true'});
 function norm(v){const n=Math.hypot(...v)||1;return v.map(x=>x/n)}
 function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
 function drawParticles(){
  if(!gl||!particles)return;
  // Waiting-space camera: no scroll-driven globe, flight or generated scenery.
  const camera=[reduced?0:view.x*.35,.25+(reduced?0:view.y*.25),8.5],forward=norm(camera),right=norm(cross([0,1,0],forward)),up=cross(forward,right);
  gl.viewport(0,0,canvas.width,canvas.height);gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.clearColor(.003677,.003677,.004391,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(particles);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(locations.data);gl.vertexAttribPointer(locations.data,4,gl.FLOAT,false,16,0);
  gl.uniform3fv(locations.camera,camera);gl.uniform3fv(locations.right,right);gl.uniform3fv(locations.up,up);gl.uniform3fv(locations.forward,forward);gl.uniform1f(locations.time,reduced?0:time);gl.uniform1f(locations.aspect,width/height);gl.uniform1f(locations.size,(width<=760?1:1.15)*ratio*height/720);gl.drawArrays(gl.POINTS,0,count);
  gl.disable(gl.BLEND);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.useProgram(quad);gl.bindBuffer(gl.ARRAY_BUFFER,quadBuffer);gl.enableVertexAttribArray(quadLocation);gl.vertexAttribPointer(quadLocation,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(quadTexture,0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
 }
 let quadBuffer,quadLocation,quadTexture;
 if(gl)try{
  particles=program(
   'attribute vec4 aData;uniform vec3 uCamera,uRight,uUp,uForward;uniform float uTime,uAspect,uSize;varying float vSeed,vDepth;void main(){vec3 p=aData.xyz;float seed=aData.w;p.x+=cos(uTime*(.12+seed*.2)+seed*33.)*.4;p.y+=sin(uTime*(.2+seed*.3)+seed*40.)*.5;vec3 q=p-uCamera;float d=-dot(q,uForward);vDepth=d;vSeed=seed;float f=2.050304;gl_Position=vec4(f*dot(q,uRight)/uAspect,f*dot(q,uUp),1.002002*d-.2002002,d);gl_PointSize=uSize*(.4+seed)*160./max(1.,d);}',
   'precision mediump float;varying float vSeed,vDepth;void main(){float r=length(gl_PointCoord-.5);float a=(1.-smoothstep(.05,.5,r))*(.08+vSeed*.16);a*=(1.-smoothstep(14.,46.,vDepth))*smoothstep(2.2,6.5,vDepth);gl_FragColor=vec4(vec3(.72,.73,.76)*a,1.);}'
  );
  for(const [key,name] of Object.entries({camera:'uCamera',right:'uRight',up:'uUp',forward:'uForward',time:'uTime',aspect:'uAspect',size:'uSize'}))locations[key]=gl.getUniformLocation(particles,name);locations.data=gl.getAttribLocation(particles,'aData');
  buffer=gl.createBuffer();target=gl.createFramebuffer();texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  quad=program('attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}','precision mediump float;uniform sampler2D uImage;varying vec2 vUv;void main(){vec3 c=texture2D(uImage,vUv).rgb;vec3 lo=c*12.92;vec3 hi=1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055;gl_FragColor=vec4(mix(lo,hi,step(vec3(.0031308),c)),1.);}');
  quadBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quadBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);quadLocation=gl.getAttribLocation(quad,'aPosition');quadTexture=gl.getUniformLocation(quad,'uImage');stage.dataset.renderer='webgl';
 }catch(e){stage.dataset.rendererError='initialization';console.warn('Particle renderer unavailable',e)}
 else stage.dataset.rendererError='webgl-unavailable';
 function drawFootage(){
  const blend=smooth(.035,.10,progress),fp=clamp((progress-.055)/.945),wanted=Math.round(fp*Math.max(0,paths.length-1));
  if(!paths.length||!blend){film.style.opacity=0;return}
  load(wanted);let i=wanted;while(i>=0&&!ready[i])i--;
  if(i<0){film.style.opacity=0;return}
  const image=images[i],scale=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight)*1.04,w=image.naturalWidth*scale,h=image.naturalHeight*scale,focus=width<=640?.5-.4*smooth(.84,1,progress):.5;
  filmCtx.setTransform(1,0,0,1,0,0);filmCtx.clearRect(0,0,film.width,film.height);filmCtx.drawImage(image,(film.width-w)*focus,(film.height-h)/2,w,h);film.style.opacity=blend;currentFrame=i;
  stage.dataset.renderedFrame=String(i);stage.dataset.footagePath=paths[i];
 }
 function render(now){
  frame=0;if(!active||document.hidden){last=0;return}if(!reduced&&now-lastDraw<33){schedule();return}
  const dt=last?Math.min((now-last)/1000,.1):0;last=now;lastDraw=now;if(!reduced)time+=dt;
  const k=reduced?1:1-Math.exp(-Math.max(.01,dt)/.12);view.x+=(pointer.x-view.x)*k;view.y+=(pointer.y-view.y)*k;
  if(progress<.105||!ready[0])drawParticles();drawFootage();
  stage.dataset.phase=progress<.035?'waiting-particles':progress<1?'existing-video':'arrival-hold';stage.dataset.progress=progress.toFixed(4);stage.dataset.fieldTime=time.toFixed(3);stage.dataset.paintCount=String(++drawCount);stage.dataset.pointerX=view.x.toFixed(3);
  if(!reduced)schedule();
 }
 function schedule(){if(!frame&&active&&!document.hidden)frame=requestAnimationFrame(render)}
 addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='sample-fv')return;active=Boolean(event.data.active);reduced=Boolean(event.data.reduced);const p=Number(event.data.progress);if(Number.isFinite(p))progress=clamp(p);const px=Number(event.data.pointer?.x),py=Number(event.data.pointer?.y);if(Number.isFinite(px)&&Number.isFinite(py))pointer={x:clamp(px,-1,1),y:clamp(py,-1,1)};if(!active){cancelAnimationFrame(frame);frame=0;last=0}else schedule()});
 addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0}else schedule()});resize();
})();
