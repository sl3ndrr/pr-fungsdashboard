/** Review captures only; never accepts or updates screenshot baselines. */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {openDashboard} from './helpers.mjs';
const label=process.argv[2];
if(!['before','after'].includes(label))throw Error('Usage: node capture.mjs before|after');
const dir=fileURLToPath(new URL(`./test-results/review-${label}/`,import.meta.url));
await mkdir(dir,{recursive:true});
const browser=await chromium.launch();
const measurements=[];
try {
  for(const width of [360,820,1280,2300])for(const theme of ['light','dark']) {
    const context=await browser.newContext({baseURL:process.env.DASHBOARD_URL||'http://127.0.0.1:8000',timezoneId:'Europe/Berlin',locale:'de-DE'});
    const page=await context.newPage();
    await openDashboard(page,{width,theme,date:'2026-10-24'});
    measurements.push({width,theme,...await page.evaluate(()=>({
      hero:document.getElementById('hero').getBoundingClientRect().height,
      timeline:document.querySelector('.timeline-card').getBoundingClientRect().height,
      railClient:document.getElementById('timeline-container').clientWidth,
      railScroll:document.getElementById('timeline-container').scrollWidth,
    }))});
    await page.screenshot({path:`${dir}${width}-${theme}.png`,fullPage:true});
    await context.close();
  }
  await writeFile(`${dir}measurements.json`,JSON.stringify(measurements,null,2)+'\n');
} finally {await browser.close();}
