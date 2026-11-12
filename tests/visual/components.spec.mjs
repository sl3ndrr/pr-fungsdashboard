import {test,expect} from 'playwright/test';
import {settleComponents,componentMeasurements} from './component-audit.mjs';

const sizes=[[320,640],[375,812],[600,900],[840,900],[1200,900],[1600,1000],[2300,1200]];
const days=['2026-11-11','2026-12-15','2026-12-18','2027-02-16','2027-02-17','2027-02-18','2027-03-01','2027-04-08'];
const consoleMessages=new WeakMap();
test.beforeEach(async({page})=>{
  const messages=[];consoleMessages.set(page,messages);
  page.on('pageerror',e=>messages.push(e.message));
  page.on('console',m=>{if(['warning','error'].includes(m.type()))messages.push(m.text());});
});
test.afterEach(async({page},testInfo)=>{
  const messages=consoleMessages.get(page);
  await testInfo.attach('console.json',{body:JSON.stringify(messages),contentType:'application/json'});
  expect(messages).toEqual([]);
});
async function open(page,{width=375,height=812,day='2026-11-11',theme='light',reduce=true}={}) {
  await page.setViewportSize({width,height});
  await page.emulateMedia({colorScheme:theme,reducedMotion:reduce?'reduce':'no-preference'});
  await page.addInitScript(theme=>localStorage.setItem('theme_pref',theme),theme);
  await page.goto('/?heute='+day);
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await settleComponents(page);
}
async function evidence(page,testInfo,name='components') {
  const m=await componentMeasurements(page);
  await testInfo.attach(name+'.json',{body:JSON.stringify(m,null,2),contentType:'application/json'});
  await page.screenshot({path:testInfo.outputPath(name+'.png'),fullPage:true,animations:'disabled'});
  expect(m.scrollWidth).toBeLessThanOrEqual(m.innerWidth);
  expect(m.targets.filter(t=>t.width<44||t.height<44)).toEqual([]);
  expect(m.overlaps).toEqual([]);
  for(const c of m.contrast)expect(c.ratio,`${c.selector}: ${c.text}`).toBeGreaterThanOrEqual(c.required);
  return m;
}
for(const [width,height] of sizes)for(const theme of ['light','dark'])for(const reduce of [false,true])for(const day of days) {
  test(`AP2 matrix ${width} ${theme} ${reduce?'reduce':'motion'} ${day}`,async({page},testInfo)=>{
    await open(page,{width,height,theme,reduce,day});
    await evidence(page,testInfo);
    if(width>=840)expect(await page.locator('#hero').evaluate(el=>getComputedStyle(el).alignSelf)).toBe('start');
    await expect(page.getByRole('group',{name:'Einträge nach Typ filtern'})).toBeVisible();
    await expect(page.getByRole('button',{name:'Sonstiges',exact:true})).toBeVisible();
    await expect(page.locator('.sitting-legend')).toHaveText('A = 1. Termin · B = Wiederholung');
  });
}

for(const width of [320,375,840,1200,2300])for(const theme of ['light','dark'])test(`AP2 states and terminology ${width} ${theme}`,async({page},testInfo)=>{
  await open(page,{theme,width,height:900});
  const input=page.getByRole('checkbox',{name:'Abgabe ASP-Portfolio erledigt'});
  await expect(page.locator('#card-ws26-asp-portfolio .done-label')).toHaveText('Offen');
  expect(await page.locator('#card-ws26-asp-portfolio .card-header').evaluate(el=>el.children.length)).toBe(3);
  await input.check();await settleComponents(page);
  await expect(page.locator('[data-key="stats-assignments"]')).toHaveClass(/is-complete/);
  await expect(page.locator('#card-ws26-asp-portfolio .done-label')).toHaveText('Erledigt');
  await evidence(page,testInfo,'done');
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await expect(input).toBeChecked();
  await input.uncheck();await settleComponents(page);
  await expect(page.locator('[data-key="stats-assignments"]')).not.toHaveClass(/is-complete/);
  // Real summer assignments provide 0/2, 1/2 and 2/2 without altering production data.
  for(const doneItems of [[],['a1'],['a1','a2']]) {
    await page.evaluate(async doneItems=>{const {store}=await import('/js/state.js');const {EVENTS}=await import('/js/data.js');await store.update({events:EVENTS.filter(e=>e.type==='Abgabe'),doneItems,showPast:true});},doneItems);
    await settleComponents(page);
    const colour=await page.locator('[data-key="stats-assignments"] .mini-progress').evaluate(el=>{const s=getComputedStyle(el);return {actual:s.getPropertyValue('--progress-color').trim(),neutral:s.getPropertyValue('--text-muted').trim(),complete:s.getPropertyValue('--tertiary').trim()};});
    expect(colour.actual).toBe(doneItems.length===2?colour.complete:colour.neutral);
    await evidence(page,testInfo,'assignments-'+doneItems.length);
  }
  await page.evaluate(async()=>{const {store}=await import('/js/state.js');const {EVENTS}=await import('/js/data.js');await store.update({events:EVENTS.filter(e=>e.isCancelled),doneItems:[],showPast:true});});
  await settleComponents(page);await expect(page.locator('.card.cancelled')).toHaveCount(1);await evidence(page,testInfo,'cancelled');
  await page.evaluate(async()=>{const {store}=await import('/js/state.js');await store.update({events:[],typeFilter:'all'});});
  await expect(page.locator('.empty-state')).toHaveText('Keine Einträge in dieser Ansicht.');
  for(const [value,text] of [['Prüfung','Prüfungen'],['Abgabe','Abgaben'],['Termin','sonstigen Einträge']]){
    await page.locator(`[data-filter="${value}"]`).click();await expect(page.locator('.empty-state')).toHaveText(`Keine ${text} in dieser Ansicht.`);
  }
  await settleComponents(page);await evidence(page,testInfo,'empty');
});

for(const theme of ['light','dark'])test(`AP2 hero observation and navigation ${theme}`,async({page},testInfo)=>{
  let release;const fontGate=new Promise(resolve=>release=resolve);let fontRequests=0;
  await page.route('**/*.woff2',async route=>{fontRequests++;await fontGate;await route.continue();});
  await page.setViewportSize({width:840,height:900});
  await page.emulateMedia({colorScheme:theme});
  await page.goto('/?heute=2027-02-18',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await page.evaluate(()=>{window.heroChanges=[];new MutationObserver(records=>window.heroChanges.push(...records.map(r=>({type:r.type,target:r.target.nodeName})))).observe(document.querySelector('#hero'),{childList:true,characterData:true,subtree:true});});
  release();await settleComponents(page);
  expect(fontRequests).toBeGreaterThan(0);
  const fontChanges=await page.evaluate(()=>window.heroChanges.splice(0));
  await page.getByRole('button',{name:'Abgaben',exact:true}).click();await settleComponents(page);
  const filterChanges=await page.evaluate(()=>window.heroChanges.splice(0));
  await page.setViewportSize({width:1200,height:900});await settleComponents(page);
  const resizeChanges=await page.evaluate(()=>window.heroChanges.splice(0));
  await expect(page.locator('#hero')).not.toHaveAttribute('aria-live');
  await testInfo.attach('hero-observer.json',{body:JSON.stringify({fontRequests,fontChanges,filterChanges,resizeChanges,liveRegion:false},null,2),contentType:'application/json'});
  // Navigation resets the list-only filter and focuses the common event card.
  const next=page.locator('.hero-next').first(),eventId=await next.getAttribute('data-event-id');
  await next.click();await settleComponents(page);await expect(page.locator('#card-'+eventId)).toBeFocused();
  await expect(page.locator('[data-filter="all"]')).toHaveAttribute('aria-pressed','true');
  const point=page.locator('.timeline-dot').first();
  await point.scrollIntoViewIfNeeded();await page.waitForTimeout(350);await page.mouse.move(0,0);
  await point.hover();await expect(page.locator('#timeline-tooltip')).toHaveAttribute('data-open','true');
  await point.focus();await expect(page.locator('#timeline-tooltip')).toHaveAttribute('data-open','true');
  await page.keyboard.press('Escape');await expect(page.locator('#timeline-tooltip')).toHaveAttribute('data-open','false');
  const pointEvent=await point.getAttribute('data-event-id');await point.click();await settleComponents(page);await expect(page.locator('#card-'+pointEvent)).toBeFocused();
  const passed=page.locator('#card-ws26-info3 .passed-toggle input');await passed.check();await settleComponents(page);
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await expect(passed).toBeChecked();
  await passed.uncheck();await settleComponents(page);await expect(passed).not.toBeChecked();
  await page.locator('#toggle-past-btn').click();await settleComponents(page);
  await expect(page.locator('#card-ws26-asp-portfolio')).toBeVisible();
  await page.locator('[data-window="semester"]').click();await settleComponents(page);await expect(page.locator('[data-window="semester"]')).toHaveAttribute('aria-pressed','true');
  await evidence(page,testInfo,'navigation');
});
