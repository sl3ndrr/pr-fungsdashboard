/** Dependency-free springs, keyed DOM updates and shared layout transitions. */
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
const animations = new Set();
const channels = new WeakMap();
const bound = new WeakMap();
const countRuns = new WeakMap();
let transition, pendingUpdate;
let transaction = false;
let updateRects;
export function batchUpdate(update) {
  const previous=updateRects;
  updateRects=new WeakMap([...document.querySelectorAll('.hero,.countdown,#cal-grid,#cal-month-label,#cal-day-details')].map(el=>[el,el.getBoundingClientRect()]));
  try{return update();}finally{updateRects=previous;}
}
const token = name => getComputedStyle(root).getPropertyValue(name).trim();

export function motion(element, frames, {kind='spatial',speed='',delay=0,duration,channel=kind}={}) {
  if (!element?.animate) return;
  const effects = reducedMotion.matches || kind === 'effects';
  if (reducedMotion.matches) {
    frames = frames.map(frame => Object.fromEntries(Object.entries(frame).filter(([key])=>['opacity','offset'].includes(key))));
    if (!frames.some(frame=>'opacity' in frame)) return;
    delay = 0;
  }
  const active = channels.get(element) || new Map();
  const prior = active.get(channel);
  if (prior) {
    // Sample before cancellation so a rapid retarget starts at the visible value.
    const style = getComputedStyle(element);
    const first = {...frames[0]};
    for (const property of Object.keys(first)) if (property !== 'offset' && style[property]) first[property] = style[property];
    frames = [first,...frames.slice(1)];
    prior.cancel();
  }
  let easing = token(`--spring-${effects?'effects':'spatial'}${speed==='fast'&&!effects?'-fast':''}`);
  if (!CSS.supports('transition-timing-function',easing)) easing = effects?'cubic-bezier(.2,0,0,1)':'cubic-bezier(.34,1.45,.64,1)';
  const suffix = speed?`-${speed}`:'';
  const ms = reducedMotion.matches?140:duration??parseFloat(token(`--dur-${effects?'effects':'spatial'}${suffix}`));
  const animation = element.animate(frames,{duration:ms,easing,delay,fill:'backwards'});
  active.set(channel,animation); channels.set(element,active); animations.add(animation);
  animation.finished.catch(()=>{}).finally(()=>{animations.delete(animation);if(active.get(channel)===animation)active.delete(channel);});
  return animation;
}

export function transitionName(id,prefix='event') {
  return `${prefix}-${Array.from(id,c=>c.codePointAt(0).toString(16)).join('-')}`;
}
const itemSelector = '#list .card, #list .group-heading, #list .empty-state';
function snapshots() {
  return [...document.querySelectorAll(itemSelector)].map(el=>({el,key:el.id||el.dataset.key,rect:el.getBoundingClientRect(),clone:el.cloneNode(true)}));
}
function makeGhost(clone,rect) {
  clone.classList.add('motion-exit');clone.removeAttribute('id');clone.setAttribute('aria-hidden','true');clone.inert=true;
  clone.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
  clone.querySelectorAll('*').forEach(node=>node.style.viewTransitionName='none');
  Object.assign(clone.style,{position:'fixed',left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,margin:0,pointerEvents:'none',zIndex:30,viewTransitionName:'none'});
  return clone;
}
function removeAfterFade(el,animation) {
  if(animation) animation.finished.catch(()=>{}).finally(()=>el.remove());else el.remove();
}
function fallbackList(before) {
  const after=[...document.querySelectorAll(itemSelector)].map(el=>({el,key:el.id||el.dataset.key,rect:el.getBoundingClientRect()}));
  const old=new Map(before.map(item=>[item.key,item]));
  const keys=new Set(after.map(item=>item.key));
  after.forEach(({el,key,rect},index)=>{
    const prior=old.get(key);
    if(prior) {
      const x=prior.rect.left-rect.left,y=prior.rect.top-rect.top;
      if(x||y) motion(el,[{transform:`translate(${x}px,${y}px)`},{transform:'none'}]);
    } else {
      const delay=Math.min(index*25,250);
      motion(el,[{transform:'translateY(16px) scale(.96)'},{transform:'none'}],{delay});
      motion(el,[{opacity:0},{opacity:1}],{kind:'effects',delay});
    }
  });
  before.filter(item=>!keys.has(item.key)).forEach(({clone,rect})=>{
    document.body.appendChild(makeGhost(clone,rect));
    motion(clone,[{scale:'1'},{scale:'.96'}],{speed:'fast'});
    removeAfterFade(clone,motion(clone,[{opacity:1},{opacity:0}],{kind:'effects'}));
  });
}
export function withTransition(update,{type='state',origin}={}) {
  pendingUpdate?.();transition?.skipTransition();
  const native=!!document.startViewTransition&&!reducedMotion.matches;
  let applied=false;
  const apply=()=>{
    if(applied)return;applied=true;
    transaction=native&&['filter','month-forward','month-back','theme'].includes(type);
    try {update();} finally {transaction=false;if(pendingUpdate===apply)pendingUpdate=null;}
  };
  if(!native) {
    delete root.dataset.transition;
    const before=snapshots();
    // Layout reads above precede animation cancellation and DOM writes below.
    before.forEach(({el})=>channels.get(el)?.get('spatial')?.cancel());
    apply();fallbackList(before);return Promise.resolve();
  }
  root.dataset.transition=type;
  if(origin) {
    root.style.setProperty('--reveal-x',`${origin.x}px`);root.style.setProperty('--reveal-y',`${origin.y}px`);
    root.style.setProperty('--reveal-radius',`${Math.hypot(Math.max(origin.x,innerWidth-origin.x),Math.max(origin.y,innerHeight-origin.y))}px`);
  }
  pendingUpdate=apply;transition=document.startViewTransition(apply);
  const current=transition;current.ready.catch(()=>{});
  current.finished.catch(()=>{}).finally(()=>{if(transition===current){transition=null;delete root.dataset.transition;}});
  return current.updateCallbackDone;
}

const keyOf=node=>node.nodeType===1?node.id||node.dataset.key||(node.dataset.eventId?`${node.tagName}:${node.dataset.eventId}`:'')||(node.dataset.date?`${node.tagName}:${node.dataset.date}`:''):'';
const sameKind=(a,b)=>a.nodeType===b.nodeType&&(a.nodeType!==1||a.tagName===b.tagName);
function syncAttributes(live,fresh) {
    for(const attr of [...live.attributes])if(!fresh.hasAttribute(attr.name)&&!['data-number','data-render-text'].includes(attr.name))live.removeAttribute(attr.name);
    for(const attr of fresh.attributes)if(live.getAttribute(attr.name)!==attr.value)live.setAttribute(attr.name,attr.value);
    if(live.matches('input')){live.checked=fresh.checked;live.disabled=fresh.disabled;}
}
export function syncChildren(target,source) {
  const old=[...target.childNodes],keyed=new Map(old.filter(keyOf).map(node=>[keyOf(node),node])),used=new Set();
  [...source.childNodes].forEach((fresh,index)=>{
    const key=keyOf(fresh);
    let live=key?keyed.get(key):old.find(node=>!used.has(node)&&!keyOf(node)&&!node.classList?.contains('motion-decoration')&&sameKind(node,fresh));
    if(!live||!sameKind(live,fresh))live=fresh.cloneNode(true);
    used.add(live);
    if(target.childNodes[index]!==live)target.insertBefore(live,target.childNodes[index]||null);
    if(live.nodeType===3){if(live.textContent!==fresh.textContent)live.textContent=fresh.textContent;return;}
    if(live.nodeType!==1)return;
    const numeric=live.matches('.hero-number,.countdown-number')&&/^\d+$/.test(fresh.textContent);
    const oldText=live.dataset.number||live.dataset.renderText||live.textContent;
    if(live.matches('.countdown')&&oldText!==fresh.textContent) {
      fadeChange(live,()=>{syncAttributes(live,fresh);syncChildren(live,fresh);});
      live.dataset.renderText=fresh.textContent;return;
    }
    syncAttributes(live,fresh);
    if(numeric){if(live.dataset.number!==fresh.textContent)setNumber(live,fresh.textContent);}
    else if(live.matches('.hero-number,.countdown-number')) {delete live.dataset.number;countRuns.delete(live);syncChildren(live,fresh);}
    else syncChildren(live,fresh);
    if(live.matches('.countdown'))live.dataset.renderText=fresh.textContent;
  });
  old.filter(node=>!used.has(node)&&!node.classList?.contains('motion-decoration')).forEach(node=>node.remove());
}
export function syncHTML(target,html) {
  const template=document.createElement('template');template.innerHTML=html;syncChildren(target,template.content);
}
export function listenOnce(el,event,listener) {
  if(!el)return;const events=bound.get(el)||new Set();if(events.has(event))return;
  events.add(event);bound.set(el,events);el.addEventListener(event,listener);
}
function setNumber(el,value) {
  const changed=el.dataset.number!==value;
  countRuns.delete(el);el.dataset.number=value;
  let visual=el.querySelector('.number-visual'),label=el.querySelector('.number-label');
  if(!visual){el.replaceChildren();visual=document.createElement('span');visual.className='number-visual';visual.setAttribute('aria-hidden','true');label=document.createElement('span');label.className='visually-hidden number-label';el.append(visual,label);}
  label.textContent=value;
  const masks=[...visual.children];
  Array.from(value).forEach((digit,index)=>{
    let mask=masks[index];
    if(!mask){mask=document.createElement('span');mask.className='digit-mask';const reel=document.createElement('span');reel.className='digit-reel';for(let n=0;n<10;n++){const cell=document.createElement('span');cell.className='digit-cell';cell.textContent=n;reel.append(cell);}mask.append(reel);visual.append(mask);}
    mask.firstChild.style.setProperty('--digit',digit);
  });
  masks.slice(value.length).forEach(mask=>mask.remove());
  if(changed && reducedMotion.matches)motion(visual,[{opacity:0},{opacity:1}],{kind:'effects',speed:'fast'});
}
export function startCount(el) {
  if(!el||reducedMotion.matches||!/^\d+$/.test(el.dataset.number||el.textContent))return;
  const final=Number(el.dataset.number||el.textContent),run={};let start;
  countRuns.set(el,run);el.replaceChildren();
  const visual=document.createElement('span');visual.setAttribute('aria-hidden','true');visual.style.display='inline-block';visual.style.minWidth=`${String(final).length}ch`;
  const label=document.createElement('span');label.className='visually-hidden';label.textContent=String(final);el.append(visual,label);
  const step=now=>{
    if(countRuns.get(el)!==run||el.dataset.number!==String(final)||!el.isConnected)return;
    start??=now;const t=Math.min(1,(now-start)/600);visual.textContent=String(Math.round(final*(1-Math.exp(-7*t))/(1-Math.exp(-7))));
    if(t<1&&!reducedMotion.matches)requestAnimationFrame(step);else{el.replaceChildren();setNumber(el,String(final));}
  };requestAnimationFrame(step);
}
export function enterPage() {
  document.querySelectorAll('.hero,.timeline-card,.stat-tile,#list .card,#list .group-heading').forEach((el,index)=>{
    const delay=Math.min(index*25,250);motion(el,[{transform:'translateY(16px) scale(.96)'},{transform:'none'}],{delay});motion(el,[{opacity:0},{opacity:1}],{kind:'effects',delay});
  });startCount(document.querySelector('.hero-number'));
}
export function fadeChange(el,update,{direction=0,axis='x'}={}) {
  if(!el||!el.childNodes.length||transaction){update();return;}
  const rect=updateRects?.get(el)||el.getBoundingClientRect(),ghost=makeGhost(el.cloneNode(true),rect);
  update();document.body.appendChild(ghost);
  if(direction){motion(ghost,[{transform:'none'},{transform:`translate${axis.toUpperCase()}(${-direction*30}px)`}]);motion(el,[{transform:`translate${axis.toUpperCase()}(${direction*30}px)`},{transform:'none'}]);}
  else motion(el,[{scale:'.96'},{scale:'1'}]);
  removeAfterFade(ghost,motion(ghost,[{opacity:1},{opacity:0}],{kind:'effects',speed:'fast'}));
  motion(el,[{opacity:0},{opacity:1}],{kind:'effects',delay:70});
}
reducedMotion.addEventListener('change',()=>{
  root.dataset.reducedMotion=String(reducedMotion.matches);
  if(reducedMotion.matches){pendingUpdate?.();transition?.skipTransition();animations.forEach(animation=>animation.cancel());document.querySelectorAll('.motion-exit').forEach(el=>el.remove());}
});
root.dataset.reducedMotion=String(reducedMotion.matches);
