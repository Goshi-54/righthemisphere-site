(()=>{
 'use strict';
 const papers=[...document.querySelectorAll('.paper-chapter')];
 function setTheme(){const y=scrollY+innerHeight*.2;document.body.classList.toggle('paper-active',papers.some(p=>y>=p.offsetTop&&y<p.offsetTop+p.offsetHeight));}
 addEventListener('scroll',setTheme,{passive:true});addEventListener('resize',setTheme,{passive:true});setTheme();
 const seen=new WeakSet();
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting||seen.has(entry.target))continue;seen.add(entry.target);
   if(document.body.classList.contains('low-motion'))continue;
   const elements=[...entry.target.querySelectorAll('[data-count]')];let start;
   function draw(now){start??=now;const p=Math.min(1,(now-start)/950),e=1-Math.pow(1-p,3);
    for(const el of elements)el.textContent=Math.round(Number(el.dataset.count)*e).toLocaleString('ja-JP');
    if(p<1&&!document.body.classList.contains('low-motion'))requestAnimationFrame(draw);
    else for(const el of elements)el.textContent=Number(el.dataset.count).toLocaleString('ja-JP');
   }requestAnimationFrame(draw);
  }
 },{threshold:.35});
 document.querySelectorAll('.case-layout').forEach(p=>observer.observe(p));
 // All inquiry actions remain browser-local; no API connection or persistence.
 const form=document.getElementById('inquiry-form');
 form?.addEventListener('submit',event=>event.preventDefault());
})();
