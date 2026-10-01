import {test,expect} from 'playwright/test';
import {openDashboard,freeze} from './helpers.mjs';

for(const theme of ['light','dark'])test(`shared phase at 400 percent ${theme}`,async({page})=>{
  await openDashboard(page,{theme,width:1280});
  await page.evaluate(()=>{
    // Reuse real hero/stat bars; the fixture only constrains the inspection width.
    document.querySelector('.top-grid').style.display='block';
    document.querySelector('#hero').style.width='240px';
    document.querySelector('#hero').style.zoom='4';
    document.querySelector('#hero .hero-main').style.display='none';
    document.querySelector('#hero .hero-after').style.display='none';
    const stats=document.querySelector('#stats-line');
    stats.style.display='block';stats.style.width='240px';stats.style.zoom='4';
  });
  for(const percentage of [0,3,50,25/33*100,97,100])for(const time of [0,600,1300]){
    await page.locator('.mini-progress').evaluateAll((bars,value)=>{
      for(const bar of bars){
        bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow',String(value));
        bar.dataset.flat=String(value<=0||value>=100);
        bar.style.setProperty('--wave-amplitude',String(Math.min(1,Math.min(value/100,1-value/100)*4)));
        bar.querySelector('span').style.clipPath=`inset(0 ${100-value}% 0 0)`;
      }
    },percentage);
    await freeze(page,time);
    const states=await page.locator('.mini-progress').evaluateAll(bars=>bars.map(bar=>{
      const fill=bar.querySelector('span'),trackStyle=getComputedStyle(bar,'::before'),fillStyle=getComputedStyle(fill,'::before');
      return {track:trackStyle.transform,fill:fillStyle.transform,trackMask:trackStyle.maskSize,fillMask:fillStyle.maskSize,scale:getComputedStyle(fill).transform};
    }));
    for(const state of states){expect(state.track).toBe(state.fill);expect(state.trackMask).toBe(state.fillMask);expect(state.fillMask).toBe('24px 12px');expect(state.scale).toBe('none');}
    const value=percentage===25/33*100?'25-of-33':String(percentage);
    await expect(page.locator('#hero .mini-progress')).toHaveScreenshot(`hero-${value}-${time}ms.png`);
    await expect(page.locator('#stats-line .mini-progress')).toHaveScreenshot(`stats-${value}-${time}ms.png`);
  }
});
