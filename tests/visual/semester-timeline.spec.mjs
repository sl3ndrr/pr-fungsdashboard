import {test,expect} from 'playwright/test';
import {openDashboard,freeze} from './helpers.mjs';

for (const width of [360,432,768,1280]) {
  test(`complete timeline labels after centering, scrolling and resizing at ${width}px`,async({page})=>{
    await openDashboard(page,{width,theme:'dark',date:'2026-10-22'});
    const assertLabels = async()=>{
      const geometry=await page.evaluate(()=>{
        const scroller=document.querySelector('.timeline-scroll').getBoundingClientRect();
        const labels=[...document.querySelectorAll('.timeline-period-label:not([hidden]),.timeline-month:not([hidden]) .timeline-month-label')].map(el=>{
          const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
        });
        return {labels,left:scroller.left,right:scroller.right,overflow:document.documentElement.scrollWidth>innerWidth};
      });
      expect(geometry.overflow).toBe(false);
      for(const label of geometry.labels) {
        expect(label.left).toBeGreaterThanOrEqual(geometry.left-1);
        expect(label.right).toBeLessThanOrEqual(geometry.right+1);
        for(const other of geometry.labels) {
          if(label===other)continue;
          const intersects=label.left<other.right-1 && label.right>other.left+1 && label.top<other.bottom-1 && label.bottom>other.top+1;
          expect(intersects).toBe(false);
        }
      }
    };
    await assertLabels();
    for (const end of ['start','end']) {
      await page.locator('.timeline-scroll').evaluate((el,end)=>{
        el.dispatchEvent(new WheelEvent('wheel',{deltaX:end==='start'?-100:100}));
        el.scrollLeft=end==='start'?0:el.scrollWidth;
      },end);
      await freeze(page);
      await assertLabels();
    }
    await page.setViewportSize({width:width===360?768:360,height:1000});
    await freeze(page);
    await assertLabels();
    await expect(page.locator('#hero')).toContainText('Programmierpraktikum');
    await expect(page.locator('#hero')).not.toContainText('Beginn Wintersemester');
    await expect(page.locator('.timeline-dot[data-event-id="t2"]')).toHaveCount(1);
  });
}

test('winter loads empty on 01.12.2026 and the semester boundary never becomes the next card',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await openDashboard(page,{width:360,date:'2026-12-01'});
  await expect(page.locator('#semester-label')).toHaveText('Wintersemester 2026/2027');
  await expect(page.locator('#hero')).toContainText('Keine offenen Termine');
  await expect(page.locator('.timeline-empty')).toBeVisible();
  await expect(page.locator('.timeline-track,#list .card')).toHaveCount(0);
  await expect(page.locator('.scroll-hint')).toBeHidden();
  await page.locator('#cal-toggle-btn').click();await freeze(page);
  await expect(page.locator('#cal-month-label')).toContainText('Dezember 2026');
  expect(errors).toEqual([]);
});

test('an open tab switches at local midnight and clears summer filters, calendar selection and legends',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await openDashboard(page,{width:432,date:'2026-11-30'});
  await page.clock.setFixedTime(new Date('2026-11-30T23:59:59+01:00'));
  await expect(page.locator('#semester-label')).toHaveText('Sommersemester 2026');
  await page.locator('#toggle-past-btn').click();await freeze(page);
  await page.locator('[data-filter="Abgabe"]').click();await freeze(page);
  await page.locator('#cal-toggle-btn').click();await freeze(page);
  await page.clock.setFixedTime(new Date('2026-12-01T00:00:00+01:00'));
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  await freeze(page);
  await expect(page.locator('#semester-label')).toHaveText('Wintersemester 2026/2027');
  await expect(page.locator('[data-filter="all"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#toggle-past-btn')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#list .card,.timeline-dot,.cal-legend-period-swatch')).toHaveCount(0);
  await expect(page.locator('#cal-month-label')).toContainText('Dezember 2026');
  expect(errors).toEqual([]);
});

test('later winter entries drive next card, timeline and calendar independently of summer',async({page})=>{
  await page.route('**/js/data.js',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+`\nSEMESTERS[1].events.push({id:'ws26-p1',type:'Prüfung',title:'Winterprüfung',date:'2027-01-15',time:'10:00 Uhr'});`});
  });
  await openDashboard(page,{width:1280,date:'2026-12-01'});
  await expect(page.locator('#hero .hero-title')).toHaveText('Winterprüfung');
  await expect(page.locator('.timeline-dot')).toHaveCount(1);
  await expect(page.locator('#card-ws26-p1')).toBeVisible();
  await expect(page.locator('#card-p7')).toHaveCount(0);
  await page.locator('#cal-toggle-btn').click();await freeze(page);
  await expect(page.locator('#cal-month-label')).toContainText('Januar 2027');
  await expect(page.locator('.cal-event-tag[data-event-id="ws26-p1"]')).toBeVisible();
});


async function assertTimelineBoundary(page){
  const result=await page.evaluate(()=>{
    const track=document.querySelector('.timeline-track');
    const marker=track.querySelector('.timeline-today').getBoundingClientRect();
    const progress=track.querySelector('.timeline-progress').getBoundingClientRect();
    const scroller=document.querySelector('.timeline-scroll').getBoundingClientRect();
    return {today:marker.left+marker.width/2,progress:progress.right,viewport:[scroller.left,scroller.right],points:[...track.querySelectorAll('.timeline-dot')].map(dot=>{
      const box=dot.getBoundingClientRect();return {x:box.left+box.width/2,past:dot.classList.contains('past'),label:dot.getAttribute('aria-label')};
    })};
  });
  expect(Math.abs(result.progress-result.today)).toBeLessThan(1);
  for(const point of result.points){
    if(point.past)expect(point.x,point.label).toBeLessThan(result.today);
    else expect(point.x,point.label).toBeGreaterThanOrEqual(result.today-.5);
  }
  return result;
}

for(const reduced of [false,true])test(`22 October boundary survives load, rotation and a hidden first layout (reduced=${reduced})`,async({page})=>{
  await openDashboard(page,{width:390,theme:'dark',date:'2026-10-22',reduced});
  await page.setViewportSize({width:390,height:844});await freeze(page);
  const initial=await assertTimelineBoundary(page);
  expect(initial.today).toBeGreaterThanOrEqual(initial.viewport[0]);
  expect(initial.today).toBeLessThanOrEqual(initial.viewport[1]);
  for(const width of [844,390,280,1000]){
    await page.setViewportSize({width,height:844});await freeze(page);
    await assertTimelineBoundary(page);
  }
  await page.locator('.timeline-card').evaluate(el=>el.style.display='none');await freeze(page);
  await page.locator('.timeline-card').evaluate(el=>el.style.display='');await freeze(page);
  await assertTimelineBoundary(page);
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await freeze(page);
  await assertTimelineBoundary(page);
});

test('same-day events align with today and retain separate hit areas',async({page})=>{
  await openDashboard(page,{width:390,date:'2026-10-26',extraEvents:[{id:'same-day',type:'Abgabe',title:'Am selben Tag',date:'2026-10-26',time:'12:00 Uhr'}]});
  const coords=await page.locator('.timeline-dot[data-event-id="t2"],.timeline-dot[data-event-id="same-day"],.timeline-today').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}}));
  expect(Math.abs(coords[0].x-coords[1].x)).toBeLessThan(.5);
  expect(Math.abs(coords[0].y-coords[1].y)).toBeGreaterThanOrEqual(32);
  expect(Math.abs(coords[0].x-coords[2].x)).toBeLessThan(.5);
});
