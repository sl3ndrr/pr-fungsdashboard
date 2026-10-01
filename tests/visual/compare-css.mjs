import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {chromium,firefox,webkit} from 'playwright';
import {openDashboard,freeze} from './helpers.mjs';

const beforePath = process.argv[2];
if (!beforePath) throw Error('Usage: node tests/visual/compare-css.mjs <PR-B-styles.css> [output-directory]');
const output = resolve(process.argv[3] || 'tests/visual/test-results/css-equivalence');
const root = new URL('../../',import.meta.url);
const [before,after] = await Promise.all([readFile(beforePath,'utf8'),readFile(new URL('css/styles.css',root),'utf8')]);
const hash = value => createHash('sha256').update(value).digest('hex');
await mkdir(output,{recursive:true});
const report = {complete:false,before:hash(before),after:hash(after),states:0,images:0,differences:[],browsers:[]};
const extraEvents = [
  {id:'fx-today',type:'Termin',title:'Heute-Fixture',date:'2026-10-01',time:'12:00 Uhr'},
  {id:'fx-expired',type:'Termin',title:'Abgelaufen-Fixture',date:'2026-09-29',time:'12:00 Uhr'},
  {id:'fx-cancel',type:'Prüfung',title:'Grund-Fixture',date:'2026-10-04',time:'12:00 Uhr',isCancelled:true,cancelReason:'verschoben'},
];

async function styles(page) {
  return page.evaluate(() => [...document.querySelectorAll('*')].map((element,index) => ({
    index,tag:element.tagName,id:element.id,class:element.getAttribute('class'),
    styles:[null,'::before','::after','::marker'].map(pseudo => {
      const style = getComputedStyle(element,pseudo);
      return {pseudo,values:Object.fromEntries([...style].sort().map(property=>[property,style.getPropertyValue(property)]))};
    }),
  })));
}

async function compare(pages,label,images,waveTime=0) {
  for (const page of pages) await freeze(page,waveTime);
  const [a,b] = await Promise.all(pages.map(styles));
  report.states++;
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    const differences = [];
    for (let i=0;i<Math.max(a.length,b.length);i++) {
      if (!a[i] || !b[i]) { differences.push({index:i,before:a[i],after:b[i]}); continue; }
      for (const key of ['tag','id','class']) if(a[i][key]!==b[i][key]) differences.push({index:i,key,before:a[i][key],after:b[i][key]});
      for (let j=0;j<a[i].styles.length;j++) {
        const av=a[i].styles[j].values,bv=b[i].styles[j].values;
        for (const property of new Set([...Object.keys(av),...Object.keys(bv)])) if(av[property]!==bv[property]) {
          differences.push({index:i,id:a[i].id,pseudo:a[i].styles[j].pseudo,property,before:av[property],after:bv[property]});
        }
      }
    }
    await writeFile(resolve(output,`${label}-styles.json`),JSON.stringify(differences,null,2));
    report.differences.push({label,kind:'computed-style',count:differences.length});
  }
  for (const [name,selector] of images) {
    const buffers=[];
    for (const page of pages) {
      buffers.push(await (selector ? page.locator(selector).screenshot({animations:'allow'}) : page.screenshot({fullPage:true,animations:'allow'})));
    }
    report.images++;
    // Same pinned browser + same PNG encoder: byte identity is stricter than
    // Playwright's colour threshold and requires no extra image dependency.
    if (!buffers[0].equals(buffers[1])) {
      for (let i=0;i<2;i++) await writeFile(resolve(output,`${label}-${name}-${i?'after':'before'}.png`),buffers[i]);
      report.differences.push({label,name,kind:'screenshot',before:hash(buffers[0]),after:hash(buffers[1])});
    }
  }
}

async function pair(browser,options,run) {
  const contexts=[],pages=[];
  try {
    for (const css of [before,after]) {
      const context=await browser.newContext({baseURL:'http://127.0.0.1:8766',timezoneId:'Europe/Berlin',locale:'de-DE'});
      contexts.push(context);
      const page=await context.newPage();pages.push(page);
      await page.route('**/css/styles.css',route=>route.fulfill({status:200,contentType:'text/css',body:css}));
      await openDashboard(page,options);
    }
    await run(pages);
  } finally { for (const context of contexts) await context.close(); }
}

const server=spawn('python3',['-m','http.server','8766','--bind','127.0.0.1'],{cwd:root,stdio:['ignore','ignore','pipe']});
let serverError='';server.stderr.on('data',data=>serverError+=data);server.on('error',error=>serverError=error.message);
try {
  for(let attempt=0;attempt<100;attempt++) {
    if(server.exitCode!==null || serverError.includes('Address already in use')) throw Error(serverError);
    try { const response=await fetch('http://127.0.0.1:8766/index.html');if(response.ok)break; } catch {}
    if(attempt===99)throw Error('HTTP server did not start: '+serverError);
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  for (const [name,type] of Object.entries({chromium,firefox,webkit})) {
    const browser=await type.launch();
    try {
      for (const width of [360,768,1280,1600]) for (const theme of ['light','dark','system']) for (const reduced of [false,true]) {
        const label=`${name}-${width}-${theme}-${reduced?'reduced':'motion'}`;
        await pair(browser,{width,theme,reduced},async pages=>{
          for(const page of pages)await page.locator('#toggle-past-btn').click();
          await compare(pages,label,[['dashboard',null],['timeline','.timeline-card'],['hero','#hero'],['statistics','#stats-line']]);
        });
        if(theme==='system')await pair(browser,{width,theme,reduced},async pages=>{
          for(const page of pages)await page.emulateMedia({colorScheme:'dark'});
          await compare(pages,label+'-system-dark',[['dashboard',null]]);
        });
        if(theme==='system')continue;
        await pair(browser,{width,theme,reduced,extraEvents},async pages=>{
          for(const page of pages)await page.locator('#toggle-past-btn').click();
          await compare(pages,label+'-status',[['status',null],...['p4','a1','fx-expired','fx-today','p6'].map(id=>[id,`#card-${id}`])]);
        });
        await pair(browser,{width,theme,reduced},async pages=>{
          for(const percentage of [0,3,50,76,97,100])for(const time of [0,600,1300]) {
            for(const page of pages) {
              await page.locator('.mini-progress').evaluateAll((bars,value)=>{
                for(const bar of bars) {
                  bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow',String(value));bar.setAttribute('aria-valuetext',`${value} %`);
                  bar.dataset.flat=String(value<=0||value>=100);
                  bar.style.setProperty('--wave-amplitude',String(Math.min(1,Math.min(value/100,1-value/100)*4)));
                  bar.querySelector('span').style.clipPath=`inset(0 ${100-value}% 0 0)`;
                }
              },percentage);
              await page.locator('.timeline-progress').evaluate((bar,value)=>bar.style.width=`${value}%`,percentage);
              await freeze(page,time);
            }
            await comparePhase(pages,`${label}-wave-${percentage}-${time}`,time);
          }
        });
      }
      for(const date of ['2026-10-06','2026-09-25','2026-10-07'])for(const theme of ['light','dark'])for(const reduced of [false,true]) {
        await pair(browser,{width:360,date,theme,reduced},pages=>compare(pages,`${name}-${date}-${theme}-${reduced}`,[['hero','#hero']]));
      }
      await pair(browser,{width:360},async pages=>{
        for(const page of pages)await page.locator('.timeline-dot[data-event-id="p4"]').focus();
        await compare(pages,name+'-tooltip-focus',[['timeline','.timeline-card']]);
        for(const page of pages)await page.locator('.timeline-dot[data-event-id="p4"]').press('Escape');
        await compare(pages,name+'-tooltip-escape',[['timeline','.timeline-card']]);
        for(const page of pages)await page.locator('#hero .hero-next').first().press('Enter');
        await compare(pages,name+'-followup-focus',[['card','#card-p5']]);
        for(const page of pages) {
          await page.evaluate(()=>{const el=document.querySelector('.timeline-scroll');el.dispatchEvent(new WheelEvent('wheel',{deltaX:-100,bubbles:true}));el.scrollLeft=0;});
          await page.locator('[data-filter="Prüfung"]').click();
          await page.setViewportSize({width:768,height:1000});
        }
        await compare(pages,name+'-filter-resize',[['dashboard',null]]);
        for(const page of pages)await page.evaluate(()=>{const el=document.querySelector('.timeline-dot[data-event-id="p4"]');el.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',bubbles:true}));el.dispatchEvent(new PointerEvent('click',{pointerType:'touch',detail:1,bubbles:true}));});
        await compare(pages,name+'-touch-tooltip',[['timeline','.timeline-card']]);
        for(const page of pages)await page.evaluate(()=>document.querySelector('.timeline-dot[data-event-id="p4"]').dispatchEvent(new PointerEvent('click',{pointerType:'touch',detail:1,bubbles:true})));
        await compare(pages,name+'-touch-card',[['card','#card-p4']]);
      });
      report.browsers.push(name);
      console.log(`${name}: ${report.states} states, ${report.images} PNG pairs, ${report.differences.length} differences`);
    } finally { await browser.close(); }
  }
  report.complete=true;
  if(report.differences.length)process.exitCode=1;
} catch(error) { report.error=error.message;process.exitCode=1;console.error(error.message); }
finally {
  server.kill();
  await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
}

async function comparePhase(pages,label,time) {
  await compare(pages,label,[['hero','#hero .mini-progress'],['stats','#stats-line .mini-progress'],['timeline','.timeline-track']],time);
}
