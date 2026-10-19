import {test,expect} from 'playwright/test';
import {openDashboard,freeze} from './helpers.mjs';

for (const width of [360,768,1280,1600,2300]) for (const theme of ['light','dark']) {
  test(`19 October timeline anchors ${width}px ${theme}`, async ({page}) => {
    await openDashboard(page,{width,theme,date:'2026-10-19'});
    const geometry = await page.evaluate(() => {
      const track = document.querySelector('.timeline-track');
      const rail = track.getBoundingClientRect();
      const today = document.querySelector('.timeline-today').getBoundingClientRect();
      return {
        width:rail.width, today:today.left + today.width / 2 - rail.left,
        dots:[...track.querySelectorAll('.timeline-dot')].map(dot => {
          const box = dot.getBoundingClientRect();
          return {id:dot.dataset.eventId,position:getComputedStyle(dot).position,
            x:box.left + box.width / 2 - rail.left,
            y:box.top + box.height / 2 - rail.top,
            target:parseFloat(dot.style.left),past:dot.classList.contains('past')};
        }),
      };
    });
    expect(geometry.dots).toHaveLength(11);
    for (const dot of geometry.dots) {
      expect(dot.position).toBe('absolute');
      expect(dot.x).toBeCloseTo(dot.target,1);
      expect(dot.y).toBeCloseTo(3,1);
      expect(dot.x).toBeGreaterThanOrEqual(22);
      expect(dot.x).toBeLessThanOrEqual(geometry.width - 22);
      if (dot.past) expect(dot.x).toBeLessThan(geometry.today);
      else expect(dot.x).toBeGreaterThan(geometry.today);
    }
  });
}

test('calendar starts closed and preserves the toggle choice across breakpoints', async ({page}) => {
  await openDashboard(page,{width:768,date:'2026-10-19'});
  const toggle = page.locator('#cal-toggle-btn');
  const calendar = page.locator('#calendar-section');
  for (const [step,open] of [false,true,false].entries()) {
    if (step > 0) {
      await toggle.click();
      await freeze(page);
    }
    for (const width of [1600,768,2300]) {
      await page.setViewportSize({width,height:1000});
      await freeze(page);
      await expect(toggle).toHaveAttribute('aria-expanded',String(open));
      await expect(calendar).toHaveAttribute('aria-hidden',String(!open));
      expect(await calendar.evaluate(el => el.inert)).toBe(!open);
    }
  }
});

for (const width of [768,1600]) {
  test(`corrected calendar entries ${width}px`, async ({page}) => {
    await openDashboard(page,{width,date:'2026-10-19'});
    await expect(page.locator('#card-p7 .meta')).toContainText('10.11.2026');
    await expect(page.locator('#card-p7 .meta')).toContainText('10:00 Uhr');
    await expect(page.locator('#card-g18')).toHaveCount(0);
    await page.locator('#cal-toggle-btn').click();
    await freeze(page);
    await page.locator('.cal-day-select[data-date="2026-10-26"]').click();
    await freeze(page);
    const details = page.locator('#cal-day-details');
    await expect(details.locator('[data-event-id="g18"]')).toContainText('13:45-15:45 Uhr');
    await expect(details.locator('[data-event-id="t2"]')).toHaveCount(1);
    await expect(details.locator('[data-event-id="p7"]')).toHaveCount(0);
    await details.locator('[data-event-id="g18"]').click();
    await freeze(page);
    await expect(page.locator('#cal-popover .cal-popover-meta')).toContainText('26.10.2026');
    await expect(page.locator('#cal-popover .cal-popover-meta')).toContainText('13:45-15:45 Uhr');
    await page.locator('.cal-popover-close').press('Escape');
    await page.locator('#cal-next').click();
    await freeze(page);
    await page.locator('.cal-day-select[data-date="2026-11-10"]').click();
    await freeze(page);
    await expect(details.locator('[data-event-id="p7"]')).toContainText('Programmierpraktikum');
    await expect(details.locator('[data-event-id="p7"]')).toContainText('10:00 Uhr');
  });
}
