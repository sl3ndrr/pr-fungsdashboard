import {test,expect} from 'playwright/test';
import {openDashboard,freeze} from './helpers.mjs';

for(const width of [360,768,1280,1600])for(const theme of ['light','dark','system'])for(const reduced of [false,true]) {
  test(`${width}px ${theme} ${reduced?'reduced':'motion'}`,async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await openDashboard(page,{width,theme,reduced});
    await page.locator('#toggle-past-btn').click();await freeze(page);
    await expect(page.locator('#card-p4 .cancelled-chip')).toHaveText('Abgebrochen');
    await expect(page.locator('#card-p4 .countdown')).toHaveCount(0);
    await expect(page.locator('#hero .mini-progress')).toHaveAttribute('aria-valuetext','Tag 25 von 33, noch 8 Tage');
    await expect(page.locator('.timeline-date-label,.timeline-date-tick')).toHaveCount(0);
    const geometry=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth>innerWidth,
      labels:[...document.querySelectorAll('.timeline-period-label')].map(label=>{
        const box=label.getBoundingClientRect(),track=label.parentElement.getBoundingClientRect();
        return {transparent:getComputedStyle(label).backgroundColor==='rgba(0, 0, 0, 0)',inside:box.left>=track.left-1&&box.right<=track.right+1};
      }),
      reducedWave:getComputedStyle(document.querySelector('.mini-progress')).animationPlayState,
    }));
    expect(geometry.overflow).toBe(false);
    for(const label of geometry.labels){expect(label.transparent).toBe(true);expect(label.inside).toBe(true);}
    if(reduced)expect(geometry.reducedWave).toBe('paused');
    expect(errors).toEqual([]);
    await expect(page).toHaveScreenshot('dashboard.png',{fullPage:true});
  });
}

const extraEvents=[
  {id:'fx-today',type:'Termin',title:'Heute-Fixture',date:'2026-10-01',time:'12:00 Uhr'},
  {id:'fx-expired',type:'Termin',title:'Abgelaufen-Fixture',date:'2026-09-29',time:'12:00 Uhr'},
  {id:'fx-cancel',type:'Prüfung',title:'Grund-Fixture',date:'2026-10-04',time:'12:00 Uhr',isCancelled:true,cancelReason:'verschoben'},
];
for(const width of [360,768,1280,1600])for(const theme of ['light','dark']) {
  test(`status cards ${width}px ${theme}`,async({page})=>{
    await openDashboard(page,{width,theme,extraEvents});
    await page.locator('#toggle-past-btn').click();await freeze(page);
    await expect(page.locator('#card-fx-cancel .cancelled-chip')).toHaveText('verschoben');
    await expect(page.locator('#card-a1 .done-badge')).toBeVisible();
    await expect(page.locator('#card-fx-expired .expired')).toBeVisible();
    await expect(page.locator('#card-fx-today .today-chip')).toBeVisible();
    await expect(page.locator('#card-p6 .countdown-number')).toHaveAttribute('data-number','6');
    const sizes=await page.locator('.countdown:is(.done-badge,.expired)').evaluateAll(nodes=>nodes.map(node=>({
      minHeight:getComputedStyle(node).minHeight,height:node.getBoundingClientRect().height,
    })));
    for(const size of sizes){expect(size.minHeight).toBe('0px');expect(size.height).toBeLessThan(88);}
    await expect(page).toHaveScreenshot('status-cards.png',{fullPage:true});
  });
}

for(const [date,text,unit] of [['2026-10-06','1','Tag'],['2026-09-25','12','Tage'],['2026-10-07','Heute',null]]) {
  test(`hero countdown ${text}`,async({page})=>{
    await openDashboard(page,{width:360,date});
    if(unit)await expect(page.locator('.hero-number')).toHaveAttribute('data-number',text);
    else await expect(page.locator('.hero-number')).toHaveText(text);
    if(unit)await expect(page.locator('.hero-unit')).toHaveText(unit);
    else await expect(page.locator('.hero-unit')).toHaveCount(0);
    await expect(page.locator('#hero')).toHaveScreenshot(`count-${text}.png`);
  });
}

test('keyboard, touch, tooltip collisions and preserved manual scroll',async({page})=>{
  await openDashboard(page,{width:360});
  const scroller=page.locator('.timeline-scroll');
  const before=await page.evaluate(()=>({y:scrollY,left:document.querySelector('.timeline-scroll').scrollLeft}));
  expect(before.y).toBe(0);expect(before.left).toBeGreaterThan(0);
  const dot=page.locator('.timeline-dot[data-event-id="p4"]');
  await dot.focus();await freeze(page);
  await expect(dot).toHaveAccessibleName(/05\.10\.2026.*Abgebrochen/);
  await expect(dot.locator('.timeline-tooltip')).toBeVisible();
  const noOverlap=await dot.locator('.timeline-tooltip').evaluate(tip=>{
    const a=tip.getBoundingClientRect();
    return [...document.querySelectorAll('.timeline-period-label')].every(label=>{
      const b=label.getBoundingClientRect();return a.bottom<=b.top||a.top>=b.bottom||a.right<=b.left||a.left>=b.right;
    });
  });
  expect(noOverlap).toBe(true);
  await dot.press('Escape');await freeze(page);
  await expect(dot).toBeFocused();await expect(dot.locator('.timeline-tooltip')).toBeHidden();
  await page.locator('#hero .hero-next').first().press('Enter');
  await expect(page.locator('#card-p5')).toBeFocused();
  await page.evaluate(()=>{
    const scroller=document.querySelector('.timeline-scroll');
    scroller.dispatchEvent(new WheelEvent('wheel',{deltaX:-100,bubbles:true}));scroller.scrollLeft=0;
  });
  await page.locator('[data-filter="Prüfung"]').click();await freeze(page);
  await expect.poll(()=>scroller.evaluate(el=>el.scrollLeft)).toBe(0);
  await page.setViewportSize({width:768,height:1000});await freeze(page);
  await expect.poll(()=>scroller.evaluate(el=>el.scrollLeft)).toBe(0);
  await page.evaluate(()=>{
    const dot=document.querySelector('.timeline-dot[data-event-id="p4"]');
    dot.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',bubbles:true}));
    dot.dispatchEvent(new PointerEvent('click',{pointerType:'touch',detail:1,bubbles:true}));
  });
  await freeze(page);await expect(dot.locator('.timeline-tooltip')).toBeVisible();
  await expect(dot).toHaveAttribute('data-tooltip-open','true');
  await page.evaluate(()=>document.querySelector('.timeline-dot[data-event-id="p4"]').dispatchEvent(new PointerEvent('click',{pointerType:'touch',detail:1,bubbles:true})));
  await expect(page.locator('#card-p4')).toBeFocused();
});

test('system theme follows a dark OS preference',async({page})=>{
  await openDashboard(page,{theme:'system',width:360});
  await page.emulateMedia({colorScheme:'dark'});await freeze(page);
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  await expect(page.locator('[data-theme-value="system"]')).toHaveAttribute('aria-checked','true');
  await expect(page).toHaveScreenshot('system-dark.png',{fullPage:true});
});
