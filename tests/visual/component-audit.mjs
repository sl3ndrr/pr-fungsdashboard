/** AP2 browser evidence: real geometry and composited text contrast, no baselines. */
export async function settleComponents(page) {
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(650);
  await page.evaluate(()=>{for(const a of document.getAnimations())if(a.effect.getComputedTiming().iterations!==Infinity)a.finish();});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

export async function componentMeasurements(page) {
  return page.evaluate(()=>{
    const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const visible=el=>{const r=box(el),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
    const over=(front,back)=>front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3]));
    const luminance=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const selectors='.hero-label,.hero-title,.hero-weekday,.hero-unit,.hero-meta span,.hero-next-title,.hero-next-date,.hero-next-days,.hero-next .sitting-letter,.stat-label,.stat-value,.stat-total,.stat-note,.done-label,.sitting-legend,[data-filter="Termin"],.empty-state,.cancelled-chip,.sitting-open strong,.sitting-open span,.passed-toggle > span';
    const contrast=[...document.querySelectorAll(selectors)].filter(el=>visible(el)&&el.textContent.trim()).map(el=>{
      const chain=[];for(let p=el;p;p=p.parentElement)chain.push(p);
      let background=[255,255,255];for(const p of chain.reverse())background=over(rgba(getComputedStyle(p).backgroundColor),background);
      // The visible label is positioned over its sibling checkbox surface.
      if(el.matches('.done-label'))background=over(rgba(getComputedStyle(el.parentElement.querySelector('input')).backgroundColor),background);
      if(el.matches('[data-filter][aria-pressed="true"]'))background=over(rgba(getComputedStyle(el.parentElement.querySelector('.filter-indicator')).backgroundColor),background);
      const style=getComputedStyle(el),foreground=over(rgba(style.color),background),a=luminance(foreground),b=luminance(background);
      return {text:el.textContent.trim(),selector:el.className||el.tagName,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),required:parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&parseFloat(style.fontWeight)>=700)?3:4.5};
    });
    const targets=[...document.querySelectorAll('button,a[href],input,select,textarea,[role="button"]')].filter(visible).map(el=>({name:el.id||el.getAttribute('aria-label')||el.textContent.trim(),...box(el)}));
    const labels=[...document.querySelectorAll('.timeline-event-label,.timeline-period-label,.timeline-month,.timeline-today-label')].filter(visible);
    const overlaps=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=box(labels[i]),b=box(labels[j]);if(a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5)overlaps.push([labels[i].textContent,labels[j].textContent]);}
    return {innerWidth,scrollWidth:document.documentElement.scrollWidth,targets,overlaps,contrast,hero:box(document.querySelector('#hero')),side:box(document.querySelector('.overview-side'))};
  });
}
