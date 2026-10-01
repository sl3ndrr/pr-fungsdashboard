import {test,expect} from 'playwright/test';
import {openDashboard,freeze} from './helpers.mjs';

for(const width of [360,768,1280,1600])for(const theme of ['light','dark']) {
  test(`shared phase ${width}px ${theme}`,async({page})=>{
    await openDashboard(page,{theme,width});
    for(const percentage of [0,3,50,76,97,100])for(const time of [0,600,1300]) {
      // Set values on actual rendered bars, without copying component markup.
      await page.locator('.mini-progress').evaluateAll((bars,value)=>{
        for(const bar of bars){
          bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow',String(value));
          bar.setAttribute('aria-valuetext',`${value} %`);
          bar.dataset.flat=String(value<=0||value>=100);
          bar.style.setProperty('--wave-amplitude',String(Math.min(1,Math.min(value/100,1-value/100)*4)));
          bar.querySelector('span').style.clipPath=`inset(0 ${100-value}% 0 0)`;
        }
      },percentage);
      await page.locator('.timeline-progress').evaluate((bar,value)=>{
        bar.style.width=`${value}%`;
      },percentage);
      await freeze(page,time);
      const states=await page.locator('.mini-progress').evaluateAll(bars=>bars.map(bar=>{
        const fill=bar.querySelector('span'),trackStyle=getComputedStyle(bar,'::before'),fillStyle=getComputedStyle(fill,'::before');
        return {track:trackStyle.transform,fill:fillStyle.transform,trackMask:trackStyle.maskSize,fillMask:fillStyle.maskSize,scale:getComputedStyle(fill).transform};
      }));
      for(const state of states){
        expect(state.track).toBe(state.fill);expect(state.trackMask).toBe(state.fillMask);
        expect(state.fillMask).toBe('24px 12px');expect(state.scale).toBe('none');
      }
      const rail=await page.locator('.timeline-progress').evaluate(bar=>({
        value:bar.style.width,transform:getComputedStyle(bar).transform,
      }));
      expect(rail.value).toBe(`${percentage}%`);expect(rail.transform).toBe('none');
      // Keep explicitly paused wave phases; other screenshots disable animations.
      await expect(page.locator('#hero .mini-progress')).toHaveScreenshot(`hero-${percentage}-${time}ms.png`,{animations:'allow'});
      await expect(page.locator('#stats-line .mini-progress')).toHaveScreenshot(`stats-${percentage}-${time}ms.png`,{animations:'allow'});
      // Capture the enclosing rail, so 0% produces a valid screenshot.
      await expect(page.locator('.timeline-track')).toHaveScreenshot(`timeline-${percentage}-${time}ms.png`,{animations:'allow'});
    }
  });
}
