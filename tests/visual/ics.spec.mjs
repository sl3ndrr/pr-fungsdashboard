import {test, expect} from 'playwright/test';
import {readFile} from 'node:fs/promises';

test('ICS downloads honor occurrence state, filenames and sitting room', async ({page}) => {
  await page.route('**/js/data.js', async route => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace("title: 'Info III', short: 'Info III'", "title: 'Info III', room: 'Hörsaal 1', short: 'Info III'")
      .replace("{ key: 'B', date: '2027-04-07', time: '10:00–14:00 Uhr' }", "{ key: 'B', date: '2027-04-07', time: '10:00–14:00 Uhr', room: 'B 12' }");
    await route.fulfill({response, body});
  });
  await page.goto('/?heute=2027-02-18');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const card = page.locator('#card-ws26-info3');
  await expect(card.getByRole('group').last()).toHaveAttribute('aria-label', /Raum B 12/);
  const [single] = await Promise.all([
    page.waitForEvent('download'),
    card.getByRole('button', {name:'Info III in Kalender exportieren (.ics)'}).click(),
  ]);
  expect(single.suggestedFilename()).toBe('info-iii.ics');
  const content = await readFile(await single.path(), 'utf8');
  expect(content).toContain('UID:ws26-info3-B@pr-fungsdashboard');
  expect(content).not.toContain('UID:ws26-info3-A@pr-fungsdashboard');
  expect(content).toContain('LOCATION:B 12');
  const [all] = await Promise.all([page.waitForEvent('download'), page.locator('#export-all').click()]);
  expect(all.suggestedFilename()).toBe('semester-roadmap-ws-2026-2027.ics');
  expect(await readFile(await all.path(), 'utf8')).toContain('LOCATION:B 12');
  await card.getByRole('checkbox', {name:/Bestanden/}).check();
  await expect(card.locator('.card-export')).toHaveCount(0);
  await page.reload();
  await expect(card.getByRole('checkbox', {name:/Bestanden/})).toBeChecked();
});

test('room text keeps compact and primary row heights at all column widths', async ({page}) => {
  for (const width of [320, 840, 1200, 1600]) {
    await page.setViewportSize({width, height:900});
    await page.goto('/?heute=2027-02-18');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => document.fonts.ready);
    const rows = page.locator('#card-ws26-info3 .sitting-row');
    const before = await rows.evaluateAll(items => items.map(item => item.getBoundingClientRect().height));
    await page.route('**/js/data.js', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace("title: 'Info III', short: 'Info III'", "title: 'Info III', room: 'Hörsaal 1', short: 'Info III'");
      await route.fulfill({response, body});
    });
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => document.fonts.ready);
    expect(await rows.evaluateAll(items => items.map(item => item.getBoundingClientRect().height))).toEqual(before);
    await expect(rows.first()).toContainText('10:00–14:00 Uhr · Raum Hörsaal 1');
    await page.unroute('**/js/data.js');
  }
});
