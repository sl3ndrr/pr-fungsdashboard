import {test,expect} from 'playwright/test';
import {openDashboard,freeze} from './helpers.mjs';

const widths=[320,360,390,600,820,1024,1280,1600,2300];
const rect=r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height});
async function geometry(page) {
  return page.evaluate(()=>{
    const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const rail=document.querySelector('#timeline-container');
    return {client:rail.clientWidth,scroll:rail.scrollWidth,bounds:box(rail),
      card:box(document.querySelector('.timeline-card')),hero:box(document.querySelector('#hero')),
      points:[...rail.querySelectorAll('.timeline-dot')].map(el=>({id:el.dataset.eventId,hit:box(el),point:box(el.querySelector('.timeline-point')),label:box(el.querySelector('.timeline-event-label')),text:el.querySelector('.timeline-event-label').innerText})),
      labels:[...rail.querySelectorAll('.timeline-event-label,.timeline-period-label,.timeline-month,.timeline-today-label')].map(box),
      pill:box(rail.querySelector('.timeline-today-label')),line:box(rail.querySelector('.timeline-today')),
      layers:{pill:Number(getComputedStyle(rail.querySelector('.timeline-today-label')).zIndex),line:Number(getComputedStyle(rail.querySelector('.timeline-today')).zIndex)},
      overflow:document.documentElement.scrollWidth>innerWidth};
  });
}
function assertFit(g) {
  expect(g.overflow).toBe(false);expect(g.scroll).toBeLessThanOrEqual(g.client);
  for(const point of g.points) {
    expect(point.hit.width).toBeGreaterThanOrEqual(44);expect(point.hit.height).toBeGreaterThanOrEqual(44);
    expect(point.text.length).toBeGreaterThan(0);
    expect(point.hit.left).toBeGreaterThanOrEqual(g.bounds.left-.5);
    expect(point.hit.right).toBeLessThanOrEqual(g.bounds.right+.5);
    const offset=Math.abs((point.label.left+point.label.right-point.point.left-point.point.right)/2);
    if(point.label.left>g.bounds.left+.5 && point.label.right<g.bounds.right-.5)expect(offset).toBeLessThanOrEqual(8);
  }
  for(let i=0;i<g.labels.length;i++) {
    const a=g.labels[i];
    expect(a.left).toBeGreaterThanOrEqual(g.bounds.left-.5);expect(a.right).toBeLessThanOrEqual(g.bounds.right+.5);
    for(const b of g.labels.slice(i+1))expect(a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5).toBe(false);
  }
  for(let i=0;i<g.points.length;i++)for(const b of g.points.slice(i+1)) {
    const a=g.points[i].hit;
    expect(a.left<b.hit.right-.5&&a.right>b.hit.left+.5&&a.top<b.hit.bottom-.5&&a.bottom>b.hit.top+.5).toBe(false);
  }
  expect(g.layers.pill).toBeGreaterThan(g.layers.line);
  expect(g.pill.top).toBeLessThanOrEqual(g.line.top);
  expect(g.pill.left).toBeGreaterThanOrEqual(g.bounds.left);expect(g.pill.right).toBeLessThanOrEqual(g.bounds.right);
}

for(const width of widths)for(const theme of ['light','dark']) {
  test(`fit + measurements ${width}px ${theme}`,async({page},testInfo)=>{
    await openDashboard(page,{width,theme,date:'2026-10-24'});
    let g=await geometry(page);assertFit(g);expect(g.points.map(p=>p.id)).toEqual(['t2','p7']);
    await testInfo.attach('measurements.json',{body:JSON.stringify({width,theme,...g},null,2),contentType:'application/json'});
    if([360,820,1280,2300].includes(width))await page.screenshot({path:testInfo.outputPath(`after-${width}-${theme}.png`),fullPage:true});
    await openDashboard(page,{width,theme,date:'2026-10-02'});
    await page.locator('[data-window="semester"]').click();await freeze(page);
    g=await geometry(page);assertFit(g);expect(g.points).toHaveLength(11);
    expect(g.points.some(p=>p.id==='p4')).toBe(true);expect(g.points.every(p=>!p.id.startsWith('g'))).toBe(true);
  });
}

test('window and stable focused points survive resize and list rerenders',async({page})=>{
  await openDashboard(page,{width:390,date:'2026-10-02'});
  await page.locator('[data-window="semester"]').click();await freeze(page);
  const dot=page.locator('#timeline-event-p4');await dot.focus();
  await dot.evaluate(el=>window.savedTimelinePoint=el);
  await page.setViewportSize({width:820,height:1000});await freeze(page);
  await expect(dot).toBeFocused();expect(await dot.evaluate(el=>el===window.savedTimelinePoint)).toBe(true);
  await page.locator('[data-filter="Abgabe"]').click();await freeze(page);
  await expect(page.locator('[data-window="semester"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-window="upcoming"]').click();await freeze(page);
  await expect(page.locator('[data-window="upcoming"]')).toBeFocused();
});

test.describe('real touch activation',()=>{
  test.use({hasTouch:true,isMobile:true});
  for(const target of ['.timeline-point','.timeline-event-label'])test(`one tap on ${target} navigates and resets filter`,async({page})=>{
    await openDashboard(page,{width:390,date:'2026-10-24',reduced:true});
    await page.locator('[data-filter="Prüfung"]').click();await freeze(page);
    // Labels/points are descendants of one native button and share the same action.
    await page.locator(`#timeline-event-t2 ${target}`).tap();await freeze(page);
    await expect(page.locator('#card-t2')).toBeFocused();
    await expect(page.locator('[data-filter="all"]')).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#timeline-tooltip')).toBeHidden();
  });
});

test('same-day dates and very long titles retain labelled disjoint targets',async({page})=>{
  await openDashboard(page,{width:320,date:'2026-10-02',extraEvents:[
    {id:'same-day',type:'Prüfung',title:'Programmierpraktikum '.repeat(30),date:'2026-10-05',time:'12:00 Uhr'},
  ]});
  assertFit(await geometry(page));
  const points=await page.locator('#timeline-event-p4 .timeline-point,#timeline-event-same-day .timeline-point').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().x));
  expect(points[0]).toBeCloseTo(points[1],1);
});

test('empty winter, then a single winter event crossing year boundary',async({page})=>{
  await openDashboard(page,{width:360,date:'2026-12-01'});
  await expect(page.locator('#semester-label')).toHaveText('Wintersemester 2026/2027');
  await expect(page.locator('#hero')).toContainText('Keine offenen Termine');
  await expect(page.locator('.timeline-empty')).toBeVisible();
  await expect(page.locator('.timeline-track,#list .card')).toHaveCount(0);
  await page.route('**/js/data.js',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+`\nSEMESTERS[1].events.push({id:'winter',type:'Prüfung',title:'Winterprüfung',date:'2027-01-15',time:'10:00 Uhr'});`});
  });
  await page.reload();await freeze(page);await expect(page.locator('#timeline-event-winter')).toBeVisible();
  assertFit(await geometry(page));
  await expect(page.locator('.timeline-month')).toContainText(['Dez 2026','Jan 2027']);
});

test('day/semester change preserves page scroll, window selection, keyed nodes and live state',async({page})=>{
  await openDashboard(page,{width:390,date:'2026-10-14',reduced:true});
  await page.locator('[data-window="semester"]').click();await freeze(page);
  await page.locator('#timeline-event-p5').focus();
  const y=await page.evaluate(()=>scrollY);
  await page.clock.setFixedTime(new Date('2026-10-15T00:00:01+02:00'));
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await freeze(page);
  await expect(page.locator('#timeline-event-p5')).toHaveClass(/past/);
  await expect(page.locator('#timeline-event-p5')).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBe(y);
  await page.clock.setFixedTime(new Date('2026-12-01T00:00:01+01:00'));
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await freeze(page);
  await expect(page.locator('.timeline-empty')).toBeVisible();
  await expect(page.locator('[data-window="semester"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#toggle-past-btn')).toBeFocused();
});
