/** AP1 identity gate. Baselines are explicit, immutable inputs to compare mode. */
import {chromium,firefox} from 'playwright';
import {mkdir, readFile, writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import assert from 'node:assert/strict';
import {serve} from './http-server.mjs';
const require=createRequire(import.meta.url);
const {PNG}=require(resolve(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'));
const comparePNG=require('playwright-core/lib/coreBundle').utils.getComparator('image/png');
const comparisonOptions={maxDiffPixels:0,threshold:0.1};
const args=process.argv.slice(2),value=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const recording=args.includes('--record');
const baseline=resolve(value('--baseline','test-results/identity/baseline-controlled'));
const out=resolve(value('--out','test-results/identity/current'));
const url=process.env.DASHBOARD_URL||'http://127.0.0.1:8011';
const server=args.includes('--serve')?serve(resolve(value('--root','.')),Number(new URL(url).port)):null;
const sizes=['320x640','375x812','600x900','840x900','1200x900','1600x1000','2300x1200'];
const days=['2026-11-11','2026-12-15','2026-12-18','2027-02-16','2027-02-17','2027-02-18','2027-03-01','2027-04-08'];
const profiles=['light','dark','system-light','system-dark'];
const workers=Number(value('--workers','4'));
assert.ok(Number.isInteger(workers)&&workers>=1&&workers<=8,'workers must be between 1 and 8');
const cases=args.includes('--smoke')?[{size:value('--viewport','375x812'),day:value('--heute','2027-02-18'),profile:value('--theme','light')}]:sizes.flatMap(size=>days.flatMap(day=>profiles.map(profile=>({size,day,profile}))));
if(!args.includes('--smoke'))for(const profile of ['light','dark'])cases.push({size:'1200x900',day:'2026-10-01',profile});
await mkdir(out,{recursive:true});
if(recording)await mkdir(baseline,{recursive:true});
const browserName=value('--browser','firefox');
if(!['firefox','chromium'].includes(browserName))throw Error('Unsupported browser');
const browser=await ({firefox,chromium}[browserName]).launch();
const results=[];
const sourceRoot=resolve(value('--root','.')),source=[];
async function inventory(path) {
 for(const entry of await readdir(resolve(sourceRoot,path),{withFileTypes:true})) {
  const name=path+'/'+entry.name;
  if(entry.isDirectory())await inventory(name);
  else source.push([name,createHash('sha256').update(await readFile(resolve(sourceRoot,name))).digest('hex')]);
 }
}
for(const path of ['js','css','assets'])await inventory(path);
source.push(['index.html',createHash('sha256').update(await readFile(resolve(sourceRoot,'index.html'))).digest('hex')]);
source.sort(([a],[b])=>a.localeCompare(b,'en'));
// Bump the protocol when capture framing, normalisation or assertions change.
const manifest={protocol:'controlled-v1',browser:browser.version(),browserName,source};
const resumeLog=value('--resume-log',null),completed=new Map();
if(resumeLog) {
 assert.equal(recording,false,'cannot resume baseline recording');
 assert.deepEqual(manifest,JSON.parse(await readFile(resolve(out,'source.json'),'utf8')),'resume source/browser/protocol changed');
 for(const match of (await readFile(resolve(resumeLog),'utf8')).matchAll(/^\d+\/\d+ (.+): (\d+) checkpoints(?: \(revalidated\))?$/gm))completed.set(match[1],Number(match[2]));
} else await writeFile(resolve(out,'source.json'),JSON.stringify(manifest,null,2)+'\n');
const baselineNames=resumeLog?await readdir(baseline):[];
async function resume(stem) {
 const names=baselineNames.filter(name=>name.startsWith(stem+'-')&&name.endsWith('.json'));
 assert.equal(names.length,completed.get(stem),stem+': completed checkpoint count');
 const checks=[];
 for(const name of names) {
  const actual=JSON.parse(await readFile(resolve(out,name),'utf8')),expected=JSON.parse(await readFile(resolve(baseline,name),'utf8'));
  assert.deepEqual({...actual,scroll:null},{...expected,scroll:null},name+': resumed HTML/focus/geometry');
  assert.equal(actual.overflow,false);assert.deepEqual(actual.targets,[]);assert.deepEqual(actual.overlaps,[]);
  const pngName=name.replace(/\.json$/,'.png'),a=await readFile(resolve(out,pngName)),b=await readFile(resolve(baseline,pngName));
  assert.ok(!comparePNG(a,b,comparisonOptions),name+': resumed pixels');
  checks.push({state:name.slice(stem.length+1,-5),pixels:0,resumed:true});
 }
 results.push({stem,checks,messages:[],resumed:true});
 console.log(`${results.length}/${cases.length} ${stem}: ${checks.length} checkpoints (revalidated)`);
}
async function settle(page) {
 await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}
async function run({size,day,profile}) {
 const [width,height]=size.split('x').map(Number),theme=profile.startsWith('system')?'system':profile;
 const stem=`${size}-${day}-${profile}`;
 if(completed.has(stem))return resume(stem);
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,colorScheme:profile.endsWith('dark')?'dark':'light',reducedMotion:'reduce',locale:'de-DE',timezoneId:'Europe/Berlin'});
 const page=await context.newPage(),messages=[],checks=[];
 page.on('console',m=>{if(['warning','error'].includes(m.type()))messages.push(m.text());});
 page.on('pageerror',e=>messages.push(e.message));
 await page.addInitScript(theme=>{
  localStorage.setItem('theme_pref',theme);
  history.scrollRestoration='manual';
  window.__renders=0;window.__canvases=0;
  const create=document.createElement.bind(document);
  document.createElement=(tag,...rest)=>{if(tag==='canvas')window.__canvases++;return create(tag,...rest);};
 },theme);
 await page.route('**/js/*.js',async route=>{
  const response=await route.fetch({maxRetries:3});
  await route.fulfill({response,body:(await response.text()).replace('function render(animate) {','function render(animate) { window.__renders++;')});
 });
 async function capture(state) {
  await settle(page);
  if(state!=='tooltip-hover'&&state!=='tooltip-focus') {
   await page.mouse.move(0,0);
   await page.keyboard.press('Escape');
  }
  // Native focus scrolling can land one pixel apart on an unchanged page.
  // Frame each checkpoint at an explicit position before taking its screenshot.
  await page.evaluate(state=>{
   if(state.startsWith('tooltip'))return; // Scrolling closes the real tooltip.
   let element=null,top=0;
   if(state==='initial-bottom')top=document.documentElement.scrollHeight;
   else if(/^(done|undone|passed|unpassed|dot-navigation|next-navigation)/.test(state))element=document.activeElement.closest('.card')||document.querySelector('#list .card');
   else if(state==='semester')element=document.querySelector('#timeline-container');
   else if(state==='past'||state.startsWith('filter-'))element=document.querySelector('#list');
   if(element)top=Math.max(0,Math.round(element.getBoundingClientRect().top+scrollY-80));
   scrollTo({left:0,top,behavior:'instant'});
  },state);
  await settle(page);
  const data=await page.evaluate(()=>{
   const normalise=element=>{
    const clone=element.cloneNode(true);
    clone.querySelectorAll('.motion-decoration,.motion-exit').forEach(el=>el.remove());
    for(const el of [clone,...clone.querySelectorAll('*')]) {
     for(const name of ['--x','--y'])if(el.style.getPropertyValue(name))el.style.removeProperty(name);
     if(el.getAttribute('style')==='')el.removeAttribute('style');
     const attrs=[...el.attributes].map(a=>[a.name,a.value]).sort(([a],[b])=>a.localeCompare(b,'en'));
     attrs.forEach(([name])=>el.removeAttribute(name));attrs.forEach(([name,value])=>el.setAttribute(name,value));
    }
    return clone.outerHTML.replace(/\r\n/g,'\n');
   };
   const selectors=['#hero','#timeline-container','#timeline-legend-items','#stats-line','#list','#timeline-tooltip','#type-filter','#timeline-window','#toggle-past-btn','#theme-switch'];
   const html=Object.fromEntries(selectors.map(s=>[s,normalise(document.querySelector(s))]));
   const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
   const visible=el=>{const r=rect(el),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
   const targets=[...document.querySelectorAll('button,a[href],input,select,textarea,[role="button"]')].filter(visible).map(el=>({id:el.id||el.getAttribute('aria-label')||el.textContent,...rect(el)})).filter(r=>r.width<44||r.height<44);
   const labels=[...document.querySelectorAll('.timeline-event-label,.timeline-period-label,.timeline-month,.timeline-today-label')].filter(visible),overlaps=[];
   for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=rect(labels[i]),b=rect(labels[j]);if(a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height)overlaps.push([labels[i].textContent,labels[j].textContent]);}
   const active=document.activeElement;
   return {html,focus:active.id||active.getAttribute('aria-label')||[active.tagName,active.dataset.filter,active.dataset.key].filter(Boolean).join(':'),scroll:[scrollX,scrollY],overflow:document.documentElement.scrollWidth>innerWidth,targets,overlaps};
  });
  const name=`${stem}-${state}`;
  let pixels=0,rawPixels=0;
  const referenceBuffer=recording?null:await readFile(resolve(baseline,name+'.png'));
  const reference=referenceBuffer&&PNG.sync.read(referenceBuffer);
  // Use the same two-frame stabilisation as the existing toHaveScreenshot matcher.
  let png,attempts=0;
  for(;attempts<8;attempts++) {
  const shot=await page._expectScreenshot({fullPage:false,type:'png',animations:'disabled',caret:'hide',scale:'css',timeout:10_000,...comparisonOptions});
  assert.ok(!shot.errorMessage,`${name}: ${shot.errorMessage}`);
  png=shot.actual;
  assert.ok(png,`${name}: missing screenshot`);
  if(!recording) {
    const b=PNG.sync.read(png);
    assert.equal(reference.width,b.width,`${name}: image width`);assert.equal(reference.height,b.height,`${name}: image height`);
    rawPixels=0;
    for(let i=0;i<reference.data.length;i+=4)if(reference.data[i]!==b.data[i]||reference.data[i+1]!==b.data[i+1]||reference.data[i+2]!==b.data[i+2]||reference.data[i+3]!==b.data[i+3])rawPixels++;
    const difference=comparePNG(png,referenceBuffer,comparisonOptions);
    pixels=difference?Number(difference.errorMessage.match(/(\d+) pixels/)?.[1]||Infinity):0;
  }
  if(recording||pixels===0)break;
  await settle(page);
  }
  const target=recording?baseline:out;
  await writeFile(resolve(target,name+'.json'),JSON.stringify(data,null,2)+'\n',recording?{flag:'wx'}:{});
  await writeFile(resolve(target,name+'.png'),png,recording?{flag:'wx'}:{});
  if(!recording) {
   const expected=JSON.parse(await readFile(resolve(baseline,name+'.json'),'utf8'));
   for(const selector of Object.keys(data.html)) {
    if(data.html[selector]!==expected.html[selector]) {
     const at=[...data.html[selector]].findIndex((c,i)=>c!==expected.html[selector][i]);
     throw Error(`${name}: ${selector} differs at ${at}: ${JSON.stringify(data.html[selector].slice(at,at+120))} vs ${JSON.stringify(expected.html[selector].slice(at,at+120))}`);
    }
   }
   // Native focus/scroll anchoring varies by a fractional CSS pixel even on main.
   // Keep offsets as diagnostics; compare the complete viewport and exact focus.
   assert.deepEqual({...data,html:null,scroll:null},{...expected,html:null,scroll:null},`${name}: focus/geometry`);
   assert.equal(pixels,0,`${name}: changed pixels`);
  }
  assert.equal(data.overflow,false,`${name}: horizontal overflow`);
  assert.deepEqual(data.targets,[],`${name}: targets below 44px`);
  assert.deepEqual(data.overlaps,[],`${name}: overlapping timeline labels`);
  checks.push({state,pixels,rawPixels,attempts:attempts+1});
 }
 await page.goto(`${url}/?heute=${day}`);
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await capture('initial');
 const load=await page.evaluate(()=>({renders:__renders,canvases:__canvases}));
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
 await capture('initial-bottom');
 await page.evaluate(()=>scrollTo(0,0));
 // Crossing both rail-width and list-column breakpoints delivers two RO callbacks.
 await page.evaluate(()=>{__renders=0;__canvases=0;});
 await page.setViewportSize({width:width===1200?1600:1200,height});await settle(page);
 const resize=await page.evaluate(()=>({renders:__renders,canvases:__canvases}));
 await page.setViewportSize({width,height});await settle(page);
 if(theme==='system') {
  await page.locator('[data-theme-value="system"]').focus();
  await page.keyboard.press('ArrowRight');await capture('theme-keyboard');
 } else {
  await page.locator('#toggle-past-btn').click();await capture('past');
  const assignment=page.locator('#list .card.abgabe input').first();
  if(await assignment.count()) {
   const checked=!(await assignment.isChecked());
   await assignment.focus();await page.keyboard.press('Space');await capture('done');
   assert.equal(await assignment.isChecked(),checked);
   await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
   await settle(page);
   await page.evaluate(()=>scrollTo(0,0));
   await page.locator('#toggle-past-btn').click();await capture('done-reload');
   assert.equal(await assignment.isChecked(),checked);
   await assignment.focus();await page.keyboard.press('Space');await capture('undone');
  }
  const passed=page.locator('.passed-toggle input').first();
  if(await passed.count()) {
   await passed.focus();await page.keyboard.press('Space');await capture('passed');
   assert.equal(await passed.isChecked(),true);
   await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
   await settle(page);
   await page.evaluate(()=>scrollTo(0,0));
   await page.locator('#toggle-past-btn').click();await capture('passed-reload');
   assert.equal(await passed.isChecked(),true);
   await passed.focus();await page.keyboard.press('Space');await capture('unpassed');
  }
  for(const filter of ['Prüfung','Abgabe','Termin','all']) {
   await page.locator(`[data-filter="${filter}"]`).click();await capture('filter-'+filter);
  }
  await page.locator('[data-window="semester"]').click();await capture('semester');
  const dot=page.locator('.timeline-dot').first();
  if(await dot.count()) {
   await dot.hover();await capture('tooltip-hover');
   assert.equal(await page.locator('#timeline-tooltip').getAttribute('data-open'),'true');
   await dot.focus();await capture('tooltip-focus');
   assert.equal(await page.locator('#timeline-tooltip').getAttribute('data-open'),'true');
   await page.keyboard.press('Escape');await capture('tooltip-escape');
   await page.keyboard.press('Enter');await capture('dot-navigation');
   assert.match(await page.evaluate(()=>document.activeElement.id),/^card-/);
  }
  const next=page.locator('.hero-next').first();
  if(await next.count()) {await next.click();await capture('next-navigation');assert.match(await page.evaluate(()=>document.activeElement.id),/^card-/);}
  await page.locator('[data-theme-value="light"]').focus();
  await page.keyboard.press('ArrowRight');await capture('theme-keyboard');
 }
 assert.deepEqual(messages,[],`${stem}: console`);
 results.push({stem,load,resize,checks,messages});
 await context.close();
 console.log(`${results.length}/${cases.length} ${stem}: ${checks.length} checkpoints`);
}
try {
 let index=0;
 await Promise.all(Array.from({length:workers},async()=>{while(index<cases.length)await run(cases[index++]);}));
 assert.equal(results.length,cases.length,'all matrix cases completed');
 const summary={browserName,browser:browser.version(),platform:process.platform,workers,comparisonOptions,recording,cases:results.length,checkpoints:results.reduce((n,r)=>n+r.checks.length,0),results};
 await writeFile(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({cases:summary.cases,checkpoints:summary.checkpoints,...(recording?{recording:true}:{changedPixels:0})}));
} finally {await browser.close();server?.close();}
