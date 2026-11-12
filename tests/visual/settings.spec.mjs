import {test,expect} from 'playwright/test';
import {componentMeasurements,settleComponents as settle} from './component-audit.mjs';

const sizes=[[320,640],[375,812],[600,900],[840,900],[1200,900],[1600,1000],[2300,1200]];
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
async function open(page,{width=375,height=812,theme='light',motion='reduce'}={}) {
  await page.setViewportSize({width,height});
  await page.emulateMedia({colorScheme:theme==='light'?'dark':'light',reducedMotion:motion});
  await page.addInitScript(theme=>{try{localStorage.setItem('theme_pref',theme);}catch{}},theme);
  await page.goto('/?heute=2026-11-11');
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await settle(page);
}
async function menu(page) {
  await page.locator('#settings-button').click();
  await expect(page.getByRole('dialog',{name:'Einstellungen',exact:true})).toBeVisible();
  await expect(page.locator('#semester-select')).toBeFocused();
  await expect(page.locator('#settings-button')).toHaveAttribute('aria-expanded','true');
}
async function evidence(page,info,name,{screenshot=true}={}) {
  await settle(page);
  const common=await componentMeasurements(page);
  const own=await page.evaluate(()=>{
    const visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const rgba=c=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=c;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
    const over=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
    const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const contrast=[...document.querySelectorAll('#settings-dialog h2,#settings-dialog label,#settings-dialog select,#settings-dialog p,#settings-button,#settings-close')].filter(visible).map(el=>{
      let bg=[255,255,255];const chain=[];for(let p=el;p;p=p.parentElement)chain.push(p);
      for(const p of chain.reverse())bg=over(rgba(getComputedStyle(p).backgroundColor),bg);
      const a=lum(over(rgba(getComputedStyle(el).color),bg)),b=lum(bg);
      return {selector:el.id||el.className,text:el.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    });
    const dialog=document.getElementById('settings-dialog'),r=dialog.getBoundingClientRect();
    const button=document.getElementById('settings-button').getBoundingClientRect(),theme=document.getElementById('theme-switch').getBoundingClientRect();
    return {contrast,dialog:dialog.open?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,scrollWidth:dialog.scrollWidth,clientWidth:dialog.clientWidth}:null,
      adjacent:button.left>=theme.right&&Math.abs(button.top+button.height/2-theme.top-theme.height/2)<1,
      active:document.activeElement.id};
  });
  expect(common.scrollWidth).toBeLessThanOrEqual(common.innerWidth);
  expect(common.targets.filter(t=>t.width<44||t.height<44)).toEqual([]);expect(common.overlaps).toEqual([]);
  expect(own.adjacent).toBe(true);expect(messages.get(page)).toEqual([]);
  for(const c of own.contrast)expect(c.ratio,c.selector).toBeGreaterThanOrEqual(4.5);
  if(own.dialog) {
    expect(own.dialog.left).toBeGreaterThanOrEqual(0);expect(own.dialog.right).toBeLessThanOrEqual(common.innerWidth);
    expect(own.dialog.scrollWidth).toBeLessThanOrEqual(own.dialog.clientWidth);
  }
  await info.attach(name+'.json',{body:JSON.stringify({...common,...own}),contentType:'application/json'});
  if(screenshot)await info.attach(name,{body:await page.screenshot({fullPage:!own.dialog,animations:'disabled'}),contentType:'image/png'});
}
async function exportsHidden(page) {
  await expect(page.locator('.export-all-control')).toBeHidden();
  expect(await page.locator('.card-export').evaluateAll(items=>items.every(el=>el.getBoundingClientRect().width===0))).toBe(true);
  await expect(page.getByRole('button',{name:/exportieren/i})).toHaveCount(0);
}

for(const [width,height] of sizes)for(const theme of ['light','dark'])for(const motion of ['reduce','no-preference']) {
  test(`settings matrix ${width} ${theme} ${motion}`,async({page},info)=>{
    await open(page,{width,height,theme,motion});
    await expect(page.locator('#settings-dialog')).toBeHidden();
    await expect(page.locator('.page-header select')).toHaveCount(0);
    await expect(page.locator('#semester-select,#calendar-export-toggle')).toHaveCount(2);
    await expect(page.locator('#semester-select')).toBeHidden();await expect(page.locator('#calendar-export-toggle')).toBeHidden();
    await expect(page.locator('#export-all')).toBeVisible();await expect(page.locator('.card-export')).toHaveCount(5);
    await evidence(page,info,'closed');
    await page.locator('#settings-button').focus();await page.keyboard.press('Enter');
    await expect(page.locator('#semester-select')).toBeFocused();
    expect(await page.locator('#semester-select option').allTextContents()).toEqual(['Sommersemester 2026','Wintersemester 2026/2027']);
    const stops=[];
    for(let i=0;i<6;i++) {
      await page.keyboard.press('Tab');
      const focus=await page.evaluate(()=>{const el=document.activeElement,s=getComputedStyle(el);return {id:el.id,inside:!!el.closest('#settings-dialog'),visible:el.matches(':focus-visible'),outline:parseFloat(s.outlineWidth)};});
      expect(focus.inside).toBe(true);expect(focus.visible).toBe(true);expect(focus.outline).toBeGreaterThanOrEqual(2);stops.push(focus.id);
    }
    expect(new Set(stops)).toEqual(new Set(['settings-close','semester-select','calendar-export-toggle']));
    await page.locator('#settings-close').focus();await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#calendar-export-toggle')).toBeFocused();
    await info.attach('keyboard.json',{body:JSON.stringify({tabStops:stops.length}),contentType:'application/json'});
    await evidence(page,info,'open');
    const toggle=page.locator('#calendar-export-toggle');await toggle.focus();await toggle.press('Space');
    await expect(toggle).not.toBeChecked();await expect(toggle).toBeFocused();await exportsHidden(page);
    await page.keyboard.press('Escape');await expect(page.locator('#settings-dialog')).toBeHidden();
    await expect(page.locator('#settings-button')).toBeFocused();await expect(page.locator('#settings-button')).toHaveAttribute('aria-expanded','false');
    await page.locator('[data-filter="Prüfung"]').click();await settle(page);await exportsHidden(page);
    await page.locator('[data-filter="all"]').click();await settle(page);await exportsHidden(page);
    await page.reload();await settle(page);await exportsHidden(page);
    await evidence(page,info,'hidden-reloaded');
    await menu(page);await expect(toggle).not.toBeChecked();await toggle.check();
    await page.locator('#settings-close').click();await expect(page.locator('#settings-button')).toBeFocused();
    await expect(page.locator('#export-all')).toBeVisible();await expect(page.locator('.card-export').first()).toBeVisible();
    await evidence(page,info,'restored',{screenshot:false});
    await menu(page);await page.mouse.click(1,1);await expect(page.locator('#settings-dialog')).toBeHidden();
    await expect(page.locator('#settings-button')).toBeFocused();
    await menu(page);await toggle.uncheck();
    await page.locator('#semester-select').selectOption('ss-2026');await settle(page);
    await expect(page.locator('#semester-select')).toBeFocused();await expect(page.locator('#semester-label')).toHaveText('Sommersemester 2026');
    expect(new URL(page.url()).searchParams.get('semester')).toBe('ss-2026');
    await page.locator('#settings-close').click();await page.reload();await settle(page);await exportsHidden(page);
    await expect(page.locator('#hero')).toContainText('Semester abgeschlossen');await expect(page.locator('#settings-dialog')).toBeHidden();
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('done_items_v1')))).toEqual(['a1','a2']);
    await evidence(page,info,'archive-reloaded',{screenshot:false});
  });
}

for(const [width,height] of sizes)test(`settings system ${width}`,async({page},info)=>{
  await open(page,{width,height,theme:'system'});await menu(page);
  await page.emulateMedia({colorScheme:'dark'});await evidence(page,info,'system-dark');
  const dark=await page.locator('#settings-dialog').evaluate(el=>getComputedStyle(el).backgroundColor);
  await page.emulateMedia({colorScheme:'light'});await evidence(page,info,'system-light');
  expect(await page.locator('#settings-dialog').evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe(dark);
  await page.keyboard.press('Escape');await expect(page.locator('#settings-button')).toBeFocused();
});

for(const theme of ['light','dark'])test(`settings blocked storage ${theme}`,async({page},info)=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}}));
  await open(page,{theme});await menu(page);
  await expect(page.locator('#calendar-export-toggle')).toBeChecked();
  await page.locator('#calendar-export-toggle').uncheck();await page.locator('#settings-close').click();await exportsHidden(page);
  await evidence(page,info,'blocked-storage');
});

for(const theme of ['light','dark'])test(`settings fresh context defaults ${theme}`,async({page,browser})=>{
  await open(page,{theme});await menu(page);await page.locator('#calendar-export-toggle').uncheck();
  const context=await browser.newContext({colorScheme:theme,locale:'de-DE',timezoneId:'Europe/Berlin'});
  try {
    const fresh=await context.newPage(),errors=[];
    fresh.on('pageerror',e=>errors.push(e.message));
    fresh.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
    await fresh.goto(page.url());await fresh.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    await expect(fresh.locator('#export-all')).toBeVisible();await expect(fresh.locator('html')).toHaveAttribute('data-calendar-export-visible','true');
    expect(errors).toEqual([]);
  } finally {await context.close();}
});

test('settings saved visibility applies while the app module is delayed',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('calendar_export_visible_v1','false'));
  let release;const gate=new Promise(resolve=>release=resolve);
  await page.route('**/js/app.js',async route=>{await gate;await route.continue();});
  try {
    await page.goto('/?heute=2026-11-11',{waitUntil:'commit'});
    await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.endsWith('/css/styles.css')));
    await expect(page.locator('html')).toHaveAttribute('data-calendar-export-visible','false');
    await expect(page.locator('.export-all-control')).toBeHidden();
  } finally {release();}
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await exportsHidden(page);
});

for(const theme of ['light','dark'])test(`settings export stays hidden during fallback animation ${theme}`,async({page})=>{
  await open(page,{theme,motion:'no-preference'});await menu(page);
  await page.locator('#calendar-export-toggle').uncheck();await page.locator('#settings-close').click();await settle(page);
  const result=await page.evaluate(async()=>{
    document.startViewTransition=undefined;
    const {store}=await import('/js/state.js');
    await store.update({typeFilter:'Prüfung'},{type:'filter'});
    return {ghosts:document.querySelectorAll('.motion-exit.card').length,
      visibleExports:[...document.querySelectorAll('.motion-exit .card-export')].filter(el=>el.getBoundingClientRect().width>0).map(el=>el.getAttribute('aria-label'))};
  });
  expect(result.ghosts).toBeGreaterThan(0);expect(result.visibleExports).toEqual([]);
});

for(const theme of ['light','dark'])test(`settings 200 percent text ${theme}`,async({page},info)=>{
  await open(page,{width:320,height:640,theme});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');await menu(page);await settle(page);
  const geometry=await page.locator('#settings-dialog').evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(320);
  await page.keyboard.press('Escape');await expect(page.locator('#settings-button')).toBeFocused();
  await info.attach('zoom.json',{body:JSON.stringify(geometry),contentType:'application/json'});
});

test.describe('settings touch',()=>{
  test.use({hasTouch:true,isMobile:true});
  for(const theme of ['light','dark'])test(`export visibility ${theme}`,async({page},info)=>{
    await open(page,{theme});await page.locator('#settings-button').tap();
    await expect(page.locator('#semester-select')).toBeVisible();await page.locator('#calendar-export-toggle').tap();
    await page.locator('#settings-close').tap();await exportsHidden(page);
    await page.reload();await settle(page);await exportsHidden(page);await evidence(page,info,'touch-hidden');
  });
});
