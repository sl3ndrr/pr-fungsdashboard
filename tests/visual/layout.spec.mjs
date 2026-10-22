import {test,expect} from 'playwright/test';
import {openDashboard,freeze} from './helpers.mjs';

for(const width of [360,768,1280,1600,2300])for(const theme of ['light','dark','system']) {
  test(`packed layout and overlay ${width}px ${theme}`,async({page})=>{
    await openDashboard(page,{width,theme});
    const geometry=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth>innerWidth,
      points:[...document.querySelectorAll('.timeline-dot')].map(dot=>{const r=dot.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,date:dot.dataset.date};}),
      columns:Number(getComputedStyle(document.querySelector('#list')).getPropertyValue('--list-columns')),
      cards:[...document.querySelectorAll('#list .card')].map(card=>({
        top:card.getBoundingClientRect().top,height:card.getBoundingClientRect().height,
        labelled:card.getAttribute('aria-labelledby').split(' ').every(id=>document.getElementById(id)),
        leftBorder:getComputedStyle(card).borderLeftWidth,
      })),
    }));
    expect(geometry.overflow).toBe(false);
    for(const card of geometry.cards){expect(card.labelled).toBe(true);expect(card.leftBorder).toBe('1px');}
    let dayScale;
    for(let i=1;i<geometry.points.length;i++){
      const previous=geometry.points[i-1],point=geometry.points[i];
      const days=(Date.parse(point.date)-Date.parse(previous.date))/86400000;
      expect(days).toBeGreaterThan(0);
      for(const other of geometry.points.slice(0,i))expect(Math.abs(point.x-other.x)>=43.9 || Math.abs(point.y-other.y)>=43.9).toBe(true);
      const scale=(point.x-previous.x)/days;
      if(dayScale!==undefined)expect(Math.abs(scale-dayScale)).toBeLessThan(.02);
      dayScale=scale;
    }
    if(width>=1280) {
      expect(geometry.cards.slice(0,Math.min(geometry.columns,geometry.cards.length)).every(card=>Math.abs(card.top-geometry.cards[0].top)<1)).toBe(true);
    }
    if(width>=1600) for(const card of geometry.cards)expect(card.height).toBeLessThanOrEqual(130);
    if(width===1600) {
      await page.setViewportSize({width,height:900});await freeze(page);
      expect(await page.locator('#list .card').first().evaluate(el=>el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(900);
    }
    const card=page.locator('.timeline-card');
    const height=await card.evaluate(el=>el.offsetHeight);
    for(const dot of [page.locator('.timeline-dot').first(),page.locator('.timeline-dot').last()]) {
      await dot.focus();await freeze(page);
      const tip=page.locator('#timeline-tooltip');
      await expect(tip).toBeVisible();
      const bounds=await tip.evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:innerWidth,h:innerHeight};});
      expect(bounds.left).toBeGreaterThanOrEqual(12);expect(bounds.right).toBeLessThanOrEqual(bounds.w-12);
      expect(bounds.top).toBeGreaterThanOrEqual(12);expect(bounds.bottom).toBeLessThanOrEqual(bounds.h-12);
      expect(await card.evaluate(el=>el.offsetHeight)).toBe(height);
      await dot.press('Escape');await freeze(page);await expect(tip).toBeHidden();await expect(dot).toBeFocused();
    }
  });
}

test('keyed cards and checkbox focus survive group/filter changes without spatial reduced motion',async({page})=>{
  await openDashboard(page,{width:1600,reduced:true});
  await page.locator('#toggle-past-btn').click();await freeze(page);
  await page.locator('#card-a1').evaluate(el=>window.cardBefore=el);
  await page.locator('#card-a1 input').focus();await page.locator('#card-a1 input').press('Space');await freeze(page);
  await expect(page.locator('#card-a1 input')).toBeFocused();
  expect(await page.locator('#card-a1').evaluate(el=>el===window.cardBefore)).toBe(true);
  await page.locator('[data-filter="Abgabe"]').click();await freeze(page);
  expect(await page.locator('#card-a1').evaluate(el=>el===window.cardBefore)).toBe(true);
  expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').every(a=>a.effect.getKeyframes().every(f=>!f.transform&&!f.scale&&!f.translate)))).toBe(true);
});

for(const width of [768,1280,1600,2300]) {
  test(`calendar sidebar, details and focus ${width}px`,async({page})=>{
    await openDashboard(page,{width});
    const calendar=page.locator('#calendar-section'),toggle=page.locator('#cal-toggle-btn');
    await expect(toggle).toHaveAttribute('aria-expanded','false');
    expect(await calendar.evaluate(el=>el.inert)).toBe(true);
    await toggle.click();
    await freeze(page);await expect(calendar).toBeVisible();
    const rects=await page.evaluate(()=>{
      const list=document.querySelector('.appointments').getBoundingClientRect(),cal=document.querySelector('#calendar-section').getBoundingClientRect();
      return {listLeft:list.left,listRight:list.right,listTop:list.top,calLeft:cal.left,calTop:cal.top,calWidth:cal.width,sticky:getComputedStyle(document.querySelector('#calendar-section')).position};
    });
    if(width>=1280){expect(rects.calLeft).toBeGreaterThan(rects.listRight);expect(rects.calWidth).toBeGreaterThanOrEqual(380);expect(rects.calWidth).toBeLessThanOrEqual(440);expect(rects.sticky).toBe('sticky');}
    else expect(rects.calTop).toBeLessThan(rects.listTop);
    const day=page.locator('.cal-day-select[data-date="2026-10-07"]');
    await day.click();await freeze(page);
    await page.locator('#cal-day-details .cal-day-event').click();await freeze(page);
    await expect(page.locator('#cal-popover')).toBeVisible();
    await page.locator('.cal-popover-close').press('Escape');await freeze(page);
    await expect(page.locator('#cal-day-details .cal-day-event')).toBeFocused();
    await page.locator('#card-p6').evaluate(el=>window.sidebarCardBefore=el);
    await toggle.click();await freeze(page);
    await expect(toggle).toHaveAttribute('aria-expanded','false');
    expect(await calendar.evaluate(el=>el.inert)).toBe(true);
    expect(await page.locator('#card-p6').evaluate(el=>el===window.sidebarCardBefore)).toBe(true);
    await toggle.click();await freeze(page);
    expect(await page.locator('#card-p6').evaluate(el=>el===window.sidebarCardBefore)).toBe(true);
  });
}

test('calendar visibility stays user-controlled across breakpoints',async({page})=>{
  await openDashboard(page,{width:768});
  const toggle=page.locator('#cal-toggle-btn');
  for(const width of [1600,360,1280]) {
    await page.setViewportSize({width,height:1000});await freeze(page);
    await expect(toggle).toHaveAttribute('aria-expanded','false');
  }
  await toggle.click();await freeze(page);
  await page.setViewportSize({width:768,height:1000});await freeze(page);
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await toggle.click();await freeze(page);
  await page.setViewportSize({width:1600,height:1000});await freeze(page);
  await expect(toggle).toHaveAttribute('aria-expanded','false');
});

for(const theme of ['light','dark']) {
  test(`saved ${theme} theme is present while the application module is delayed`,async({page})=>{
    await page.clock.setFixedTime(new Date('2026-10-01T12:00:00+02:00'));
    await page.emulateMedia({colorScheme:theme==='dark'?'light':'dark'});
    await page.addInitScript(value=>localStorage.setItem('theme_pref',value),theme);
    await page.route('https://fonts.googleapis.com/**',route=>route.abort());
    await page.route('https://fonts.gstatic.com/**',route=>route.abort());
    let release;
    const held=new Promise(resolve=>release=resolve);
    await page.route('**/js/app.js',async route=>{await held;await route.continue();});
    try {
      await page.goto('/',{waitUntil:'commit'});
      await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
      await page.waitForFunction(()=>[...document.styleSheets].some(sheet=>sheet.href?.endsWith('/css/styles.css')));
      expect(await page.locator('html').evaluate(el=>getComputedStyle(el).colorScheme)).toBe(theme);
    } finally {release();}
    await expect(page.locator('#card-p6')).toBeVisible();
    await freeze(page);
    for(const icon of await page.locator('.theme-option[aria-checked="false"] svg').all()) {
      expect(await icon.evaluate(el=>getComputedStyle(el).rotate)).toBe('0deg');
    }
  });
}

