import {test,expect} from 'playwright/test';
import {openDashboard,freeze} from './helpers.mjs';
const widths=[320,360,390,600,840,1200,1600,2300];
for(const width of widths)for(const theme of ['light','dark'])for(const date of ['2026-11-11','2027-02-23','2027-04-08']) {
  test(`A/B matrix ${width}px ${theme} ${date}`,async({page},testInfo)=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await openDashboard(page,{width,theme,date,reduced:true});
    await expect(page.locator('.sitting-open')).toHaveCount(5);
    await expect(page.locator('.sitting-open .countdown')).toHaveCount(0);
    await expect(page.locator('.sitting-open').first()).toContainText('Frühestens ab Mo., 15.02.2027');
    await expect(page.locator('.stat-note')).toHaveText('davon 5 ohne Datum');
    if(date==='2026-11-11') {
      await expect(page.locator('#list .card')).toHaveCount(10);
      await expect(page.locator('.timeline-dot')).toHaveCount(9);
      await expect(page.locator('#hero')).toHaveAttribute('data-event-id','ws26-asp-portfolio');
    }
    if(date==='2027-02-23') {
      await expect(page.locator('#card-ws26-rechenmethoden .sitting-primary')).toHaveAttribute('data-key','sitting-ws26-rechenmethoden-B');
      await expect(page.locator('#card-ws26-rechenmethoden .passed-toggle')).toBeVisible();
    }
    const geometry=await page.evaluate(()=>{
      const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
      const points=[...document.querySelectorAll('.timeline-dot')];
      const days=[...document.querySelectorAll('.hero-next-days')];
      return {overflow:document.documentElement.scrollWidth>innerWidth,
        timeline:box(document.querySelector('.timeline-card')),hero:box(document.querySelector('#hero')),
        points:points.map(el=>({id:el.dataset.occurrenceId,hit:box(el),label:box(el.querySelector('.timeline-event-label'))})),
        dayLines:days.map(el=>{const range=document.createRange();range.selectNodeContents(el);return range.getClientRects().length;}),
        columns:Number(getComputedStyle(document.querySelector('#list')).getPropertyValue('--list-columns')),
        ids:[...document.querySelectorAll('[id]')].map(el=>el.id),
        rows:[...document.querySelectorAll('.sitting-row')].map(el=>({height:el.offsetHeight,label:el.getAttribute('aria-label')}))};
    });
    expect(geometry.overflow).toBe(false);
    expect(new Set(geometry.ids).size).toBe(geometry.ids.length);
    expect(geometry.dayLines.every(lines=>lines===1)).toBe(true);
    expect(geometry.rows.every(row=>row.height>=48&&row.label)).toBe(true);
    for(let i=0;i<geometry.points.length;i++) {
      const a=geometry.points[i].hit;
      expect(a.width).toBeGreaterThanOrEqual(44);expect(a.height).toBeGreaterThanOrEqual(44);
      for(const other of geometry.points.slice(i+1)) {
        const b=other.hit;
        expect(a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5).toBe(false);
      }
    }
    expect(errors).toEqual([]);
    await testInfo.attach('ab-measurements.json',{body:JSON.stringify({width,theme,date,...geometry},null,2),contentType:'application/json'});
    await testInfo.attach('ab-dashboard',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  });
}

test('A/B row identity, promotion, passed state and focus survive day changes',async({page})=>{
  await openDashboard(page,{width:390,date:'2027-02-22',reduced:true});
  const card=page.locator('#card-ws26-rechenmethoden');
  await card.locator('[data-key="sitting-ws26-rechenmethoden-B"]').evaluate(el=>window.beforeB=el);
  await page.clock.setFixedTime(new Date('2027-02-23T00:00:01+01:00'));
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await freeze(page);
  const b=card.locator('[data-key="sitting-ws26-rechenmethoden-B"]');
  expect(await b.evaluate(el=>el===window.beforeB)).toBe(true);
  await expect(b).toHaveClass(/sitting-primary/);
  const passed=card.locator('.passed-toggle input');
  await passed.focus();await passed.press('Space');await freeze(page);
  await expect(passed).toBeFocused();await expect(passed).toBeChecked();
  await expect(card).toHaveClass(/done/);
  await expect(page.locator('.timeline-dot[data-event-id="ws26-rechenmethoden"]')).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('done_items_v1'))).toContain('ws26-rechenmethoden');
  await passed.press('Space');await freeze(page);
  await expect(page.locator('#timeline-event-ws26-rechenmethoden-B')).toBeVisible();
});

test('B navigation uses its own tooltip and focuses the event card',async({page})=>{
  await openDashboard(page,{width:360,date:'2027-02-24',reduced:true});
  const point=page.locator('#timeline-event-ws26-rechenmethoden-B');
  await point.focus();await freeze(page);
  await expect(page.locator('#timeline-tooltip')).toContainText('01.04.2027');
  await point.press('Enter');
  await expect(page.locator('#card-ws26-rechenmethoden')).toBeFocused();
});
