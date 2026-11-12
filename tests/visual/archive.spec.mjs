import {test,expect} from 'playwright/test';
import {componentMeasurements,settleComponents as settle} from './component-audit.mjs';

const sizes=[[320,640],[375,812],[600,900],[840,900],[1200,900],[1600,1000],[2300,1200]];
const days=['2026-11-11','2026-12-15','2026-12-18','2027-02-16','2027-02-17','2027-02-18','2027-03-01','2027-04-08'];
const messages=new WeakMap();
test.beforeEach(async({page})=>{
  const entries=[];messages.set(page,entries);
  page.on('console',m=>{if(['warning','error'].includes(m.type()))entries.push(m.text());});
  page.on('pageerror',e=>entries.push(e.message));
});
test.afterEach(async({page},info)=>{
  await info.attach('console.json',{body:JSON.stringify(messages.get(page)),contentType:'application/json'});
  expect(messages.get(page)).toEqual([]);
});
async function open(page,{width=375,height=812,theme='light',motion='reduce',day='2026-11-11',semester='ss-2026'}={}) {
  await page.setViewportSize({width,height});
  await page.emulateMedia({colorScheme:theme==='light'?'dark':'light',reducedMotion:motion});
  await page.addInitScript(theme=>localStorage.setItem('theme_pref',theme),theme);
  await page.goto(`/?heute=${day}${semester?`&semester=${semester}`:''}`);
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await settle(page);
}
async function openSettings(page) {
  await page.locator('#settings-button').click();
  await expect(page.locator('#settings-dialog')).toBeVisible();
}
async function chooseSemester(page,id) {
  await openSettings(page);
  await page.locator('#semester-select').selectOption(id);await settle(page);
  await expect(page.locator('#semester-select')).toBeFocused();
  await page.locator('#settings-close').click();
  await expect(page.locator('#settings-button')).toBeFocused();
}
async function evidence(page,info,name,{screenshot=true}={}) {
  const common=await componentMeasurements(page);
  const own=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const rgba=c=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=c;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
    const over=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
    const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const contrast=[...document.querySelectorAll('#semester-label,.archive-title,.archive-summary dt,.archive-summary dd,.archive-summary dd span,.archive-notice:not([hidden]),[data-key^="archive-"] .stat-label,[data-key^="archive-"] .stat-value')].map(el=>{
      let bg=[255,255,255];const chain=[];for(let p=el;p;p=p.parentElement)chain.push(p);
      for(const p of chain.reverse())bg=over(rgba(getComputedStyle(p).backgroundColor),bg);
      const fg=over(rgba(getComputedStyle(el).color),bg),a=lum(fg),b=lum(bg);
      return {text:el.textContent,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    });
    const select=document.getElementById('semester-select'),box=select.getBoundingClientRect();
    // Modal controls may cover the inert background; compare their own interaction layer.
    const scope=select.closest('dialog')||document;
    const collisions=[...scope.querySelectorAll('button,input')].filter(el=>{
      const r=el.getBoundingClientRect();return r.width&&r.height&&r.left<box.right&&r.right>box.left&&r.top<box.bottom&&r.bottom>box.top;
    }).map(el=>el.id);
    return {contrast,collisions,select:{width:box.width,height:box.height,value:select.value},cards:[...document.querySelectorAll('#list .card')].map(el=>el.id)};
  });
  expect(common.scrollWidth).toBeLessThanOrEqual(common.innerWidth);
  expect(common.targets.filter(t=>t.width<44||t.height<44)).toEqual([]);expect(common.overlaps).toEqual([]);
  expect(own.collisions).toEqual([]);
  for(const c of own.contrast)expect(c.ratio,c.text).toBeGreaterThanOrEqual(4.5);
  for(const c of common.contrast)expect(c.ratio,c.text).toBeGreaterThanOrEqual(c.required);
  expect(messages.get(page)).toEqual([]);
  await info.attach(name+'.json',{body:JSON.stringify({...common,...own}),contentType:'application/json'});
  if(screenshot)await info.attach(name,{body:await page.screenshot({fullPage:true,animations:'disabled'}),contentType:'image/png'});
}
async function archive(page) {
  await expect(page.locator('#semester-select')).toHaveValue('ss-2026');
  await expect(page.locator('#hero')).toContainText('Semester abgeschlossen');
  await expect(page.locator('.archive-summary')).toContainText('davon 0 als bestanden markiert');
  await expect(page.locator('.archive-summary')).toContainText('2 von 2');
  await expect(page.locator('#list .card')).toHaveCount(11);
  await expect(page.locator('#card-a1 input')).toBeChecked();
  await expect(page.locator('#card-a2 input')).toBeChecked();
  await expect(page.locator('#archive-notice')).toBeVisible();
  await expect(page.locator('#toggle-past-btn')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-window="semester"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.timeline-today,.timeline-today-label')).toHaveCount(0);
  await expect(page.locator('#stats-line')).not.toContainText('in 7 Tagen');
}

for(const [width,height] of sizes)for(const theme of ['light','dark'])for(const day of days) {
  test(`AP5 archive ${width} ${theme} ${day}`,async({page},info)=>{
    await open(page,{width,height,theme,day});await archive(page);await evidence(page,info,'archive');
  });
}
for(const [width,height] of sizes)for(const theme of ['light','dark']) {
  test(`AP5 boundary ${width} ${theme}`,async({page},info)=>{
    await open(page,{width,height,theme,day:'2026-11-10',semester:''});
    await expect(page.locator('#semester-label')).toHaveText('Sommersemester 2026');
    await expect(page.locator('#hero')).toHaveAttribute('data-event-id','p7');
    await expect(page.locator('#archive-notice')).toBeHidden();await evidence(page,info,'last-summer-day');
    await page.goto('/?heute=2026-11-11');await settle(page);
    await expect(page.locator('#semester-label')).toHaveText('Wintersemester 2026/2027');
    await expect(page.locator('#hero')).toHaveAttribute('data-event-id','ws26-asp-portfolio');
    await expect(page.locator('#card-a1')).toHaveCount(0);await evidence(page,info,'automatic-winter');
    await page.goto('/?heute=2026-11-11&semester=invalid');await settle(page);
    await expect(page.locator('#semester-select')).toHaveValue('ws-2026-2027');
    await page.goto('/?heute=2026-11-10&semester=ws-2026-2027');await settle(page);
    await expect(page.locator('#semester-select')).toHaveValue('ws-2026-2027');
    await expect(page.locator('#hero')).toHaveAttribute('data-event-id','ws26-asp-portfolio');
    await evidence(page,info,'explicit-winter-before-boundary',{screenshot:false});
    await page.goto('/?heute=2026-11-10&semester=ss-2026');await settle(page);
    await expect(page.locator('#hero')).toHaveAttribute('data-event-id','p7');
  });

  test(`AP5 interactions ${width} ${theme}`,async({page,browser},info)=>{
    await open(page,{width,height,theme,semester:'',motion:'no-preference'});
    const historyLength=await page.evaluate(()=>{history.replaceState({ap5:true},'',location.href+'&extra=keep#top');return history.length;});
    await openSettings(page);
    const select=page.locator('#semester-select');await select.focus();await select.press('Home');await settle(page);
    await expect(select).toBeFocused();await expect(select).toHaveValue('ss-2026');await archive(page);
    expect(new URL(page.url()).searchParams.get('semester')).toBe('ss-2026');
    expect(new URL(page.url()).searchParams.get('heute')).toBe('2026-11-11');
    expect(new URL(page.url()).searchParams.get('extra')).toBe('keep');expect(new URL(page.url()).hash).toBe('#top');
    expect(await page.evaluate(()=>history.length)).toBe(historyLength);expect(await page.evaluate(()=>history.state)).toEqual({ap5:true});
    await evidence(page,info,'switched-motion');
    await page.locator('#settings-close').click();await expect(page.locator('#settings-button')).toBeFocused();
    const assignment=page.locator('#card-a1 input');await assignment.focus();await assignment.press('Space');await settle(page);
    await expect(assignment).toBeFocused();await expect(assignment).not.toBeChecked();
    await page.evaluate(async()=>{await (await import('/js/state.js')).store.saved();});
    await page.reload();await settle(page);await expect(assignment).not.toBeChecked();await expect(select).toHaveValue('ss-2026');
    await expect(page.locator('.archive-summary')).toContainText('1 von 2');
    for(const type of ['Prüfung','Abgabe','Termin','all']) {
      await page.locator(`[data-filter="${type}"]`).click();await settle(page);await evidence(page,info,'filter-'+type,{screenshot:false});
    }
    await page.locator('#toggle-past-btn').click();await settle(page);await expect(page.locator('#list .card')).toHaveCount(0);
    const dot=page.locator('#timeline-event-p4');await dot.scrollIntoViewIfNeeded();await settle(page);
    await dot.hover();await settle(page);await expect(page.locator('#timeline-tooltip')).toHaveAttribute('data-open','true');
    await page.mouse.move(0,0);await dot.focus();await settle(page);await expect(page.locator('#timeline-tooltip')).toHaveAttribute('data-open','true');
    await dot.press('Escape');await expect(dot).toBeFocused();await expect(page.locator('#timeline-tooltip')).toHaveAttribute('data-open','false');
    await dot.press('Enter');await settle(page);await expect(page.locator('#card-p4')).toBeFocused();
    expect(await page.locator('#card-p4').evaluate(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;})).toBe(true);
    await page.locator('[data-window="upcoming"]').click();await settle(page);await page.locator('[data-window="semester"]').click();await settle(page);
    await chooseSemester(page,'ws-2026-2027');
    await expect(page.locator('#archive-notice')).toBeHidden();
    const winterAssignment=page.locator('#card-ws26-asp-portfolio input');await winterAssignment.focus();await winterAssignment.press('Space');await settle(page);
    await page.reload();await settle(page);await expect(winterAssignment).toBeChecked();
    await page.goto('/?heute=2027-02-18&semester=ws-2026-2027');await settle(page);
    const passed=page.locator('#card-ws26-info3 input');await passed.check();await settle(page);await page.reload();await settle(page);await expect(passed).toBeChecked();
    await passed.uncheck();await settle(page);await expect(passed).not.toBeChecked();
    await page.locator('[data-filter="Abgabe"]').click();await settle(page);
    const next=page.locator('.hero-next').first(),nextId=await next.getAttribute('data-event-id');await next.click();await settle(page);
    await expect(page.locator('#card-'+nextId)).toBeFocused();await expect(page.locator('[data-filter="all"]')).toHaveAttribute('aria-pressed','true');
    await chooseSemester(page,'ss-2026');await expect(page.locator('#card-a1 input')).not.toBeChecked();
    await evidence(page,info,'shared-storage');
    const freshContext=await browser.newContext({viewport:{width,height},locale:'de-DE',timezoneId:'Europe/Berlin',colorScheme:theme,reducedMotion:'reduce'});
    const fresh=await freshContext.newPage(),freshMessages=[];
    fresh.on('console',m=>{if(['warning','error'].includes(m.type()))freshMessages.push(m.text());});
    fresh.on('pageerror',e=>freshMessages.push(e.message));
    await fresh.goto(new URL('/?heute=2026-11-11',page.url()).href);await settle(fresh);
    await expect(fresh.locator('#semester-select')).toHaveValue('ws-2026-2027');
    expect(await fresh.evaluate(()=>JSON.parse(localStorage.getItem('done_items_v1')))).toEqual(['a1','a2']);
    expect(freshMessages).toEqual([]);await freshContext.close();
    await page.emulateMedia({reducedMotion:'reduce'});await settle(page);
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion','true');
    await page.locator('[data-theme-value="light"]').click();await settle(page);
    await page.locator('[data-theme-value="light"]').focus();await page.keyboard.press('ArrowRight');await settle(page);
    await expect(page.locator('[data-theme-value="system"]')).toBeFocused();await page.keyboard.press('ArrowRight');await settle(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
    await page.evaluate(()=>{document.activeElement.blur();scrollTo(0,0);});
    const seen=new Set();
    for(let i=0;i<80;i++) {
      await page.keyboard.press('Tab');
      const focus=await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return {key:e.id||e.getAttribute('aria-label')||e.textContent,body:e===document.body,visible:e.matches(':focus-visible'),outline:parseFloat(s.outlineWidth),style:s.outlineStyle};});
      if(focus.body)continue;if(seen.has(focus.key))break;seen.add(focus.key);
      expect(focus.visible).toBe(true);expect(focus.outline).toBeGreaterThanOrEqual(2);expect(focus.style).not.toBe('none');
    }
    expect(seen.has('settings-button')).toBe(true);expect(seen.has('semester-select')).toBe(false);expect(seen.size).toBeGreaterThan(15);
    await info.attach('keyboard.json',{body:JSON.stringify({tabStops:seen.size}),contentType:'application/json'});
  });
}

test.describe('AP5 touch',()=>{
  test.use({hasTouch:true,isMobile:true});
  for(const theme of ['light','dark'])test(`native selection ${theme}`,async({page},info)=>{
    await open(page,{theme,semester:'ws-2026-2027'});
    await page.locator('#settings-button').tap();
    const select=page.locator('#semester-select');
    await select.tap();await page.keyboard.press('Home');await page.keyboard.press('Enter');await settle(page);
    await expect(select).toHaveValue('ss-2026');await expect(select).toBeFocused();
    await archive(page);await evidence(page,info,'touch-archive');
  });
});
for(const [width,height] of sizes)for(const semester of ['ss-2026','ws-2026-2027']) {
  test(`AP5 system ${width} ${semester}`,async({page},info)=>{
    await open(page,{width,height,theme:'system',semester});
    await page.emulateMedia({colorScheme:'dark'});await settle(page);await expect(page.locator('html')).not.toHaveAttribute('data-theme');await evidence(page,info,'system-dark');
    await page.emulateMedia({colorScheme:'light'});await settle(page);await evidence(page,info,'system-light');
  });
}
for(const semester of ['', 'ss-2026', 'ws-2026-2027']) {
  test(`AP5 midnight ${semester||'automatic'}`,async({page},info)=>{
    await page.clock.setFixedTime(new Date('2026-11-10T23:59:58+01:00'));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/'+(semester?'?semester='+semester:''));await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    await openSettings(page);
    await page.locator('#semester-select').focus();
    await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
    await page.clock.setFixedTime(new Date('2026-11-11T00:00:00+01:00'));
    await expect(page.locator('#today-date')).toContainText('11. November', {timeout:5000});await settle(page);
    await expect(page.locator('#semester-select')).toHaveValue(semester||'ws-2026-2027');
    await expect(page.locator('#semester-select')).toBeFocused();
    if(semester==='ss-2026')await archive(page);
    else await expect(page.locator('#hero')).toHaveAttribute('data-event-id','ws26-asp-portfolio');
    await evidence(page,info,'midnight');
  });
}
