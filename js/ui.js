import {reducedMotion, motion} from './motion.js';

export function updateFilterIndicator(group = document.getElementById('type-filter')) {
  let indicator=group.querySelector('.filter-indicator');
  if(!indicator){indicator=document.createElement('span');indicator.className='filter-indicator';indicator.setAttribute('aria-hidden','true');group.prepend(indicator);}
  const selected=group.querySelector('[aria-pressed="true"],[aria-checked="true"]');
  indicator.hidden = !selected;
  if (!selected) return;
  const x=selected.offsetLeft,width=selected.offsetWidth;
  if(reducedMotion.matches&&indicator.style.getPropertyValue('--indicator-x')!==`${x}px`)motion(indicator,[{opacity:0},{opacity:1}],{kind:'effects',speed:'fast'});
  indicator.style.setProperty('--indicator-x',`${x}px`);indicator.style.setProperty('--indicator-width',`${width}px`);
}
export function initialiseUI() {
document.querySelectorAll('.segmented-filter').forEach(group => new ResizeObserver(() => updateFilterIndicator(group)).observe(group));
document.addEventListener('pointerdown',event=>{
  const button=event.target.closest('button:not(:disabled):not(.timeline-dot)');if(!button)return;
  const rect=button.getBoundingClientRect();button.style.setProperty('--x',`${event.clientX-rect.left}px`);button.style.setProperty('--y',`${event.clientY-rect.top}px`);
  const overlay=document.createElement('span');overlay.className='ripple-overlay motion-decoration';overlay.setAttribute('aria-hidden','true');
  const ripple=document.createElement('span');ripple.className='ripple-origin';overlay.append(ripple);button.append(overlay);
  overlay.style.setProperty('--x',`${event.clientX-rect.left}px`);overlay.style.setProperty('--y',`${event.clientY-rect.top}px`);
  overlay.style.setProperty('--ripple-size',`${Math.hypot(rect.width,rect.height)*2}px`);
  motion(ripple,[{scale:'0'},{scale:'1'}],{speed:'fast'});
  const fade=motion(ripple,[{opacity:.16},{opacity:0}],{kind:'effects',speed:'slow'});
  if(fade)fade.finished.catch(()=>{}).finally(()=>overlay.remove());else overlay.remove();
});
}
const progressValues=new WeakMap();
export function enhanceProgress(animate) {
  document.querySelectorAll('.mini-progress').forEach(bar=>{
    const value=Number(bar.getAttribute('aria-valuenow'))/Number(bar.getAttribute('aria-valuemax')),fill=bar.querySelector('span');
    bar.dataset.flat=String(value<=0||value>=1);
    bar.style.setProperty('--wave-amplitude',String(Math.min(1,Math.max(0,Math.min(value,1-value)*4))));
    bar.style.setProperty('--progress-position',`${Math.max(0,Math.min(1,value))*100}%`);
    if(!animate&&reducedMotion.matches&&progressValues.get(bar)!==value)motion(fill,[{opacity:0},{opacity:1}],{kind:'effects',speed:'fast'});
    progressValues.set(bar,value);
    if(animate){
      motion(fill,[{clipPath:'inset(0 100% 0 0)'},{clipPath:fill.style.clipPath}],{speed:'slow'});
      const marker=bar.querySelector('.progress-marker');
      if(marker)motion(marker,[{transform:'translateX(2px)'},{transform:`translateX(clamp(2px, ${Math.max(0,Math.min(1,value))*100}%, calc(100% - 2px)))`}],{speed:'slow'});
    }
  });
}

export function focusAfterRender() {
  const active = document.activeElement;
  const card = active.closest('#list .card');
  if (card && active.matches('input[type="checkbox"]')) {
    return () => document.getElementById(card.id)?.querySelector('input[type="checkbox"]');
  }

  if (card) return () => document.getElementById(card.id);

  const heroNext = active.closest('.hero-next');
  if (heroNext) {
    return () => [...document.querySelectorAll('.hero-next')].find(button => button.dataset.occurrenceId === heroNext.dataset.occurrenceId);
  }
  const dot = active.closest('#timeline-container .timeline-dot');
  if (dot) {
    return () => [...document.querySelectorAll('#timeline-container .timeline-dot')]
      .find(button => button.dataset.occurrenceId === dot.dataset.occurrenceId);
  }

  return null;
}
