import {expect} from 'playwright/test';

export async function openDashboard(page,{width=1280,theme='light',reduced=false,date='2026-10-01',extraEvents=[]}={}) {
  await page.setViewportSize({width,height:1000});
  await page.emulateMedia({colorScheme:theme==='dark'?'dark':'light',reducedMotion:reduced?'reduce':'no-preference'});
  // Use the same system font in base/head; external font availability is not deterministic.
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.route('https://fonts.gstatic.com/**',route=>route.abort());
  // Freeze Date without pausing animation frames or application timers.
  await page.clock.setFixedTime(new Date(`${date}T12:00:00+02:00`));
  await page.addInitScript(theme=>{
    localStorage.clear();localStorage.setItem('theme_pref',theme);
  },theme);
  if(extraEvents.length)await page.route('**/js/data.js',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+`\nEVENTS.push(...${JSON.stringify(extraEvents)});`});
  });
  await page.goto('/');
  await expect(page.locator('#card-p6')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>{
    const number=document.querySelector('.hero-number');
    return !number?.dataset.number || number.querySelector('.digit-mask');
  });
  await freeze(page);
}

export async function freeze(page,waveTime=0) {
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.evaluate(time=>{
    // Finish finite transitions; infinite phases are paused at an explicit time.
    for(const animation of document.getAnimations()){
      if(animation.effect.getComputedTiming().iterations!==Infinity)animation.finish();
      else {animation.pause();animation.currentTime=time;}
    }
  },waveTime);
}

