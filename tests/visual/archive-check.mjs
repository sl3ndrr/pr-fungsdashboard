/** AP5 evidence. Explicit recording writes only ignored local references. */
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {serve} from './http-server.mjs';
import {componentMeasurements,settleComponents} from './component-audit.mjs';

const require=createRequire(import.meta.url);
const {PNG}=require(resolve(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'));
// Same matcher and unchanged tolerance as playwright.config.mjs / the AP1 gate.
const comparePNG=require('playwright-core/lib/coreBundle').utils.getComparator('image/png');
const comparisonOptions={maxDiffPixels:0,threshold:0.1};
const args=process.argv.slice(2),value=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const recording=args.includes('--record'),smoke=args.includes('--smoke');
const out=resolve(value('--out','test-results/ap5/final'));
const baseline=resolve(value('--baseline','test-results/ap5/winter-baseline'));
await mkdir(out,{recursive:true});
if(recording)await mkdir(baseline,{recursive:true});
const server=serve(resolve(value('--root','.')),8016),url='http://127.0.0.1:8016';
const browser=await chromium.launch(),results=[];
const sizes=args.includes('--viewport')?[value('--viewport')]:smoke?['375x812','1200x900']:['320x640','375x812','600x900','840x900','1200x900','1600x1000','2300x1200'];
const days=args.includes('--heute')?[value('--heute')]:smoke?['2026-11-11']:['2026-11-11','2026-12-15','2026-12-18','2027-02-16','2027-02-17','2027-02-18','2027-03-01','2027-04-08'];
const themes=args.includes('--theme')?[value('--theme')]:['light','dark'];
function rawDiff(a,b) {
  a=PNG.sync.read(a);b=PNG.sync.read(b);
  assert.equal(a.width,b.width);assert.equal(a.height,b.height);
  let changed=0;for(let i=0;i<a.data.length;i+=4)if(a.data.subarray(i,i+4).compare(b.data.subarray(i,i+4)))changed++;
  return changed;
}
try {
  console.log('Chromium '+browser.version());
  for(const size of sizes)for(const day of days)for(const theme of themes) {
    const [width,height]=size.split('x').map(Number),stem=`${size}-${day}-${theme}`;
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,locale:'de-DE',timezoneId:'Europe/Berlin',colorScheme:theme==='light'?'dark':'light',reducedMotion:'reduce'});
    const page=await context.newPage(),messages=[];
    page.on('console',m=>{if(['warning','error'].includes(m.type()))messages.push(m.text());});
    page.on('pageerror',e=>messages.push(e.message));
    // Runs once per fresh document without clearing the shared completion snapshot on reload.
    await page.addInitScript(theme=>localStorage.setItem('theme_pref',theme),theme);
    await page.goto(`${url}/?heute=${day}`);
    await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    await settleComponents(page);
    const initial=await componentMeasurements(page);
    assert.deepEqual(messages,[]);assert.equal(initial.scrollWidth,initial.innerWidth);
    assert.deepEqual(initial.targets.filter(r=>r.width<44||r.height<44),[]);assert.deepEqual(initial.overlaps,[]);
    const directory=recording?baseline:out;
    const geometry=await page.locator('.top-grid').boundingBox();
    const rawPixels={};
    for(const [name,selector] of [['overview','.top-grid'],['appointments','.appointments']]) {
      const png=await page.locator(selector).screenshot({animations:'disabled'});
      await writeFile(resolve(directory,stem+'-'+name+'.png'),png,recording?{flag:'wx'}:{});
      if(!recording) {
        const reference=await readFile(resolve(baseline,stem+'-'+name+'.png'));
        rawPixels[name]=rawDiff(png,reference);
        assert.ok(!comparePNG(png,reference,comparisonOptions),stem+' '+name+' Playwright pixels');
      }
    }
    if(recording)await writeFile(resolve(baseline,stem+'.json'),JSON.stringify({geometry,initial,messages}),{flag:'wx'});
    else {
      const before=JSON.parse(await readFile(resolve(baseline,stem+'.json'),'utf8'));
      assert.deepEqual(geometry,before.geometry,stem+' overview position');
    }
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:resolve(directory,stem+'-page.png'),fullPage:true,animations:'disabled'});
    results.push({stem,messages,initial,rawPixels,pixelGate:recording?'recorded':'0 Playwright pixels',comparisonOptions});
    await context.close();
  }
} finally {
  await writeFile(resolve(out,'results.json'),JSON.stringify(results,null,2));
  await browser.close();server.close();
}
console.log(`${results.length} Winteransichten geprüft`);
