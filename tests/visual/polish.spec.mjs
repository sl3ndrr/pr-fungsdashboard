import {test,expect} from 'playwright/test';
import {openDashboard,freeze} from './helpers.mjs';

for(const width of [360,768,1280,1600])for(const theme of ['light','dark'])for(const reduced of [false,true]) {
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

    if(width>=880)return;
    const card=page.locator('.timeline-card'),scroller=page.locator('.timeline-scroll');
    const closedHeight=await card.evaluate(el=>el.getBoundingClientRect().height);
    const geometry=await page.evaluate(()=>{
      const rail=document.querySelector('.timeline-track').getBoundingClientRect();
      const title=document.querySelector('.timeline-title').getBoundingClientRect();
      return {gap:rail.top-title.bottom,overflow:document.documentElement.scrollWidth>innerWidth,
        labels:[...document.querySelectorAll('.timeline-period-label')].map(label=>{
          const range=document.createRange();range.selectNodeContents(label);
          const box=label.getBoundingClientRect();
          return {lines:range.getClientRects().length,left:box.left-rail.left,right:box.right-rail.right};
        })};
    });
    expect(geometry.gap).toBeLessThanOrEqual(110);
    expect(geometry.overflow).toBe(false);
    for(const label of geometry.labels){expect(label.lines).toBe(1);expect(label.left).toBeGreaterThanOrEqual(-1);expect(label.right).toBeLessThanOrEqual(1);}
    await expect(card).toHaveScreenshot(`compact-timeline-${snapshot}.png`);

    const railOffset=await scroller.evaluate(el=>el.querySelector('.timeline-track').getBoundingClientRect().top-el.getBoundingClientRect().top);
    const dot=page.locator('.timeline-dot[data-event-id="p4"]');
    await dot.focus();await freeze(page);
    const tip=dot.locator('.timeline-tooltip');await expect(tip).toBeVisible();
    const details=await tip.evaluate(el=>{
      const box=el.getBoundingClientRect(),scroller=el.closest('.timeline-scroll').getBoundingClientRect();
      const track=el.closest('.timeline-track').getBoundingClientRect();
      return {top:box.top,bottom:box.bottom,limit:scroller.bottom,railOffset:track.top-scroller.top,
        monthBottom:Math.max(...[...document.querySelectorAll('.timeline-month')].map(month=>month.getBoundingClientRect().bottom))};
    });
    expect(details.top).toBeGreaterThan(details.monthBottom);
    expect(details.bottom).toBeLessThanOrEqual(details.limit);
    expect(details.railOffset).toBeCloseTo(railOffset,0);
    await expect(card).toHaveScreenshot(`compact-timeline-tooltip-${snapshot}.png`);
    await dot.press('Escape');await freeze(page);
    await expect(dot).toBeFocused();await expect(tip).toBeHidden();
    await expect.poll(()=>card.evaluate(el=>el.getBoundingClientRect().height)).toBeLessThanOrEqual(closedHeight+1);
  });
}
