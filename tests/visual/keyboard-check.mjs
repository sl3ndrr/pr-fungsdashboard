/** Supplemental complete tab cycle, focus visibility and live theme checks. */
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {serve} from './http-server.mjs';
const args=process.argv.slice(2),record=args.includes('--record');
const baseline=resolve(args.includes('--baseline')?args[args.indexOf('--baseline')+1]:'test-results/keyboard/baseline.json');
const out=resolve(args.includes('--out')?args[args.indexOf('--out')+1]:'test-results/keyboard/current');
await mkdir(out,{recursive:true});
const url=process.env.DASHBOARD_URL||'http://127.0.0.1:8013';
const server=serve(resolve(args.includes('--root')?args[args.indexOf('--root')+1]:'.'),Number(new URL(url).port)),browser=await chromium.launch(),results=[];
const settle=async page=>{
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
};
try {
 for(const width of [320,375,600,840,1200,1600,2300])for(const theme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce',locale:'de-DE',timezoneId:'Europe/Berlin'});
  const page=await context.newPage(),messages=[];
  page.on('pageerror',e=>messages.push(e.message));
  page.on('console',m=>{if(['warning','error'].includes(m.type()))messages.push(m.text());});
  await page.addInitScript(theme=>localStorage.setItem('theme_pref',theme),theme);
  await page.goto(url+'/?heute=2027-02-18');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await page.locator('#toggle-past-btn').click();await page.locator('[data-window="semester"]').click();await settle(page);
  const contrast=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
   const context=canvas.getContext('2d',{willReadFrequently:true});
   const rgba=color=>{context.clearRect(0,0,1,1);context.fillStyle=color;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
   const over=(front,back)=>front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3]));
   const lum=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
   return [...document.querySelectorAll('.hero-label,.hero-title,.hero-unit,.hero-meta span,.hero-next-title,.hero-next-date,.stat-label,.stat-note,.title-text,.sitting-date,.sitting-time,.sitting-open strong,.sitting-open span,.passed-toggle span,.timeline-event-label,.timeline-month,.timeline-today-label,.segmented-filter button')].filter(el=>el.getBoundingClientRect().height&&el.textContent.trim()).map(el=>{
    const chain=[];for(let node=el;node;node=node.parentElement)chain.push(node);
    let background=[255,255,255];for(const node of chain.reverse())background=over(rgba(getComputedStyle(node).backgroundColor),background);
    if(el.matches('.segmented-filter button[aria-pressed="true"],.segmented-filter button[aria-checked="true"]'))background=over(rgba(getComputedStyle(el.parentElement.querySelector('.filter-indicator')).backgroundColor),background);
    const style=getComputedStyle(el),foreground=over(rgba(style.color),background),a=lum(foreground),b=lum(background);
    const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),size=parseFloat(style.fontSize),bold=parseFloat(style.fontWeight)>=700;
    return {text:el.textContent.trim(),ratio,required:size>=24||(size>=18.66&&bold)?3:4.5};
   });
  });
  for(const item of contrast)assert.ok(item.ratio>=item.required,`${width} ${theme}: contrast ${item.text}: ${item.ratio}`);
  await page.evaluate(()=>{document.activeElement.blur();scrollTo(0,0);});
  const expected=await page.evaluate(()=>[...document.querySelectorAll('button,a[href],input,[tabindex]')].filter(el=>el.tabIndex>=0&&el.getBoundingClientRect().height>0).length);
  const cycle=[];
  for(let i=0;i<100;i++) {
   await page.keyboard.press('Tab');
   const focus=await page.evaluate(()=>{
    const el=document.activeElement,s=getComputedStyle(el);
    return {key:el.id||el.getAttribute('aria-label')||el.dataset.filter,tag:el.tagName,visible:el.matches(':focus-visible'),outline:parseFloat(s.outlineWidth),style:s.outlineStyle};
   });
   if(focus.tag==='BODY')continue;
   if(cycle.length&&focus.key===cycle[0].key)break;
   assert.equal(focus.visible,true,`${width} ${theme}: focus-visible ${focus.key}`);
   assert.ok(focus.outline>=2&&focus.style!=='none',`${width} ${theme}: focus ring ${focus.key}`);
   assert.ok(!cycle.some(item=>item.key===focus.key),`duplicate focus ${focus.key}`);
   cycle.push(focus);
  }
  assert.equal(cycle.length,expected,`${width} ${theme}: all tab stops visited`);
  // Saved explicit themes override the opposite system setting; system follows live changes.
  await page.emulateMedia({colorScheme:theme==='light'?'dark':'light'});
  assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).colorScheme),theme);
  await page.locator(`[data-theme-value="${theme}"]`).focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[data-theme-value="system"]').getAttribute('aria-checked'),'true');
  for(const system of ['light','dark']) {
   await page.emulateMedia({colorScheme:system});await settle(page);
   assert.equal(await page.locator('html').getAttribute('data-theme'),null);
   await page.waitForFunction(expected=>getComputedStyle(document.body).backgroundColor===expected,system==='light'?'rgb(247, 249, 255)':'rgb(16, 20, 27)');
  }
  await settle(page);await page.screenshot({path:resolve(out,`${width}-${theme}.png`),fullPage:true});
  assert.deepEqual(messages,[]);
  results.push({width,theme,expected,cycle,contrast,messages});await context.close();
 }
 if(record)await writeFile(baseline,JSON.stringify(results,null,2)+'\n',{flag:'wx'});
 else assert.deepEqual(JSON.parse(JSON.stringify(results)),JSON.parse(await readFile(baseline,'utf8')));
 await writeFile(resolve(out,'summary.json'),JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify({cases:results.length,tabStops:results.reduce((n,r)=>n+r.cycle.length,0),visibleFocus:true}));
} finally {await browser.close();server.close();}
