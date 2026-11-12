import {test,expect} from 'playwright/test';
import {settle,measureTimelineList,assertTimelineList} from './timeline-list-audit.mjs';

const sizes=[[320,640],[375,812],[600,900],[840,900],[1200,900],[1600,1000],[2300,1200]];
const days=['2026-11-11','2026-12-15','2026-12-18','2027-02-16','2027-02-17','2027-02-18','2027-03-01','2027-04-08'];

async function open(page,{width,height,theme='light',scheme='light',motion='reduce',day='2026-11-11'}) {
  const messages=[];
  page.on('console',m=>{if(['warning','error'].includes(m.type()))messages.push(m.text());});
  page.on('pageerror',e=>messages.push(e.message));
  await page.setViewportSize({width,height});
  await page.emulateMedia({colorScheme:scheme,reducedMotion:motion});
  await page.addInitScript(theme=>localStorage.setItem('theme_pref',theme),theme);
  await page.goto(`/?heute=${day}`);
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await settle(page);
  return messages;
}

async function checkpoint(page,messages,testInfo,name,{screenshot=true}={}) {
  const g=await measureTimelineList(page);assertTimelineList(g,messages);
  await testInfo.attach(`${name}.json`,{body:JSON.stringify(g,null,2),contentType:'application/json'});
  if(screenshot)await testInfo.attach(name,{body:await page.screenshot({fullPage:true,animations:'disabled'}),contentType:'image/png'});
  return g;
}

for(const [width,height] of sizes)for(const day of days)for(const theme of ['light','dark'])for(const motion of ['reduce','no-preference']) {
  test(`AP3 matrix ${width} ${day} ${theme} ${motion}`,async({page},testInfo)=>{
    const messages=await open(page,{width,height,day,theme,scheme:theme==='light'?'dark':'light',motion});
    await checkpoint(page,messages,testInfo,'upcoming');
    await page.locator('[data-window="semester"]').click();await settle(page);
    await checkpoint(page,messages,testInfo,'semester');
  });
}

for(const [width,height] of sizes)for(const scheme of ['light','dark'])for(const day of days) {
  test(`AP3 system ${width} ${day} ${scheme}`,async({page},testInfo)=>{
    const messages=await open(page,{width,height,day,theme:'system',scheme});
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await checkpoint(page,messages,testInfo,'system',{screenshot:day===days[0]});
    await page.emulateMedia({colorScheme:scheme==='light'?'dark':'light'});await settle(page);
    await checkpoint(page,messages,testInfo,'system-changed',{screenshot:false});
  });
}

for(const [width,height] of sizes.filter(([w])=>[600,840,1200,1600].includes(w)))for(const theme of ['light','dark']) {
  test(`AP3 synthetic groups ${width} ${theme}`,async({page},testInfo)=>{
    const messages=await open(page,{width,height,theme});
    await page.evaluate(async()=>{
      const {store}=await import('/js/state.js');
      const events=Array.from({length:13},(_,i)=>({id:`synthetic-${i}`,type:i%3===0?'Abgabe':'Prüfung',
        title:i%4===0?'Sehr langer synthetischer Prüfungstitel mit mehreren Zeilen':'Synthetischer Termin '+i,
        date:`2027-${String(1+Math.floor(i/5)).padStart(2,'0')}-${String(1+i%5).padStart(2,'0')}`,time:'Uhrzeit offen'}));
      await store.update({events});
    });await settle(page);
    const g=await checkpoint(page,messages,testInfo,'synthetic');
    expect(g.headings).toEqual(['Januar 2027','Februar 2027','März 2027']);
    expect(await page.locator('#list').evaluate(el=>Number(getComputedStyle(el).getPropertyValue('--list-columns')))).toBe([600,840,1200,1600].indexOf(width)+1);
  });
}

for(const [width,height] of sizes)for(const theme of ['light','dark']) {
  test(`AP3 interactions ${width} ${theme}`,async({page},testInfo)=>{
    const messages=await open(page,{width,height,theme,day:'2027-02-18'});
    for(const type of ['Prüfung','Abgabe','Termin','all']) {
      await page.locator(`[data-filter="${type}"]`).click();await settle(page);
      await checkpoint(page,messages,testInfo,`filter-${type}`,{screenshot:false});
    }
    await page.locator('#toggle-past-btn').click();await settle(page);
    await checkpoint(page,messages,testInfo,'past',{screenshot:false});
    const passed=page.locator('#card-ws26-info3 input');
    await passed.focus();await passed.press('Space');await settle(page);
    await expect(passed).toBeFocused();await expect(passed).toBeChecked();
    await page.reload();await settle(page);await expect(passed).toBeChecked();
    await checkpoint(page,messages,testInfo,'passed-reloaded',{screenshot:false});
    await passed.uncheck();await settle(page);
    const dot=page.locator('.timeline-dot').first();
    await dot.scrollIntoViewIfNeeded();await settle(page);
    await dot.hover();await settle(page);await expect(page.locator('#timeline-tooltip')).toHaveAttribute('data-open','true');
    await page.mouse.move(0,0);await dot.focus();await settle(page);
    await expect(page.locator('#timeline-tooltip')).toHaveAttribute('data-open','true');
    await dot.press('Escape');await expect(page.locator('#timeline-tooltip')).toHaveAttribute('data-open','false');
    const eventId=await dot.getAttribute('data-event-id');await dot.press('Enter');await settle(page);
    await expect(page.locator(`#card-${eventId}`)).toBeFocused();
    expect(await page.locator(`#card-${eventId}`).evaluate(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;})).toBe(true);
    const next=page.locator('.hero-next').first();const nextId=await next.getAttribute('data-event-id');await next.click();await settle(page);
    await expect(page.locator(`#card-${nextId}`)).toBeFocused();
    await page.locator('[data-theme-value="light"]').click();await settle(page);
    await page.locator('[data-theme-value="light"]').focus();await page.keyboard.press('ArrowRight');await settle(page);
    await expect(page.locator('[data-theme-value="system"]')).toBeFocused();
    await page.keyboard.press('ArrowRight');await settle(page);await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
    await page.keyboard.press('ArrowRight');await settle(page);await expect(page.locator('html')).toHaveAttribute('data-theme','light');
    await checkpoint(page,messages,testInfo,'navigation',{screenshot:false});
    // A full keyboard cycle: every native tab stop must display a visible focus ring.
    await page.evaluate(()=>document.activeElement.blur());
    const seen=new Set();
    for(let i=0;i<80;i++) {
      await page.keyboard.press('Tab');
      const focus=await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return {key:e.id||e.getAttribute('aria-label')||e.textContent,body:e===document.body,visible:e.matches(':focus-visible'),outline:parseFloat(s.outlineWidth),style:s.outlineStyle};});
      if(focus.body)continue;
      if(seen.has(focus.key))break;
      seen.add(focus.key);expect(focus.visible).toBe(true);expect(focus.outline).toBeGreaterThanOrEqual(2);expect(focus.style).not.toBe('none');
    }
    expect(seen.size).toBeGreaterThan(10);
    await testInfo.attach('keyboard.json',{body:JSON.stringify({tabStops:seen.size}),contentType:'application/json'});
    await page.goto('/?heute=2026-11-11');await settle(page);
    const assignment=page.locator('#card-ws26-asp-portfolio input');
    await assignment.focus();await assignment.press('Space');await settle(page);await expect(assignment).toBeFocused();
    await page.reload();await settle(page);await expect(assignment).toBeChecked();
    await checkpoint(page,messages,testInfo,'assignment-reloaded');
    await assignment.uncheck();await settle(page);
    await page.emulateMedia({reducedMotion:'no-preference'});await page.emulateMedia({reducedMotion:'reduce'});
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion','true');
  });
}
