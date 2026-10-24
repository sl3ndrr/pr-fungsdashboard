import {test,expect} from 'playwright/test';
import {openDashboard,freeze} from './helpers.mjs';

for(const width of [360,768,1280,1600,2300])for(const theme of ['light','dark'])for(const reduced of [false,true]) {
  test(`digit ink and compact timeline ${width}px ${theme} ${reduced?'reduced':'motion'}`,async({page})=>{
    const snapshot=`${width}-${theme}-${reduced?'reduced':'motion'}`;
    await openDashboard(page,{width,theme,reduced});
    const number=page.locator('#card-p5 .countdown-number');
    await expect(number).toHaveAttribute('data-number','13');
    const ink=await number.evaluate(el=>{
      const context=document.createElement('canvas').getContext('2d');
      return [...el.querySelectorAll('.digit-mask')].map((mask,index)=>{
        const digit=el.dataset.number[index],cell=mask.querySelectorAll('.digit-cell')[Number(digit)];
        const style=getComputedStyle(cell);
        context.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const glyph=context.measureText(digit);
        return {right:cell.getBoundingClientRect().left+glyph.actualBoundingBoxRight,edge:mask.getBoundingClientRect().right};
      });
    });
    for(const glyph of ink)expect(glyph.right).toBeLessThanOrEqual(glyph.edge);
    await expect(page.locator('#card-p5')).toHaveScreenshot(`countdown-13-${snapshot}.png`);

    const card=page.locator('.timeline-card');
    const before=await card.evaluate(el=>el.getBoundingClientRect().height);
    const dot=page.locator('#timeline-event-p4');await dot.focus();await freeze(page);
    await expect(page.locator('#timeline-tooltip')).toBeVisible();
    await dot.press('Escape');await freeze(page);
    await expect(dot).toBeFocused();await expect(page.locator('#timeline-tooltip')).toBeHidden();
    expect(await card.evaluate(el=>el.getBoundingClientRect().height)).toBe(before);
  });
}
