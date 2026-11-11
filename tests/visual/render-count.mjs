/** Render counts without screenshot or animation overrides. */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {serve} from './http-server.mjs';
const args=process.argv.slice(2),value=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const out=resolve(value('--out','test-results/render-count/current'));
await mkdir(out,{recursive:true});
const url=process.env.DASHBOARD_URL||'http://127.0.0.1:8016';
const server=serve(resolve(value('--root','.')),Number(new URL(url).port)),browser=await chromium.launch();
const cases=['320x640','375x812','600x900','840x900','1200x900','1600x1000','2300x1200'].flatMap(size=>['light','dark'].map(theme=>({size,theme}))),results=[];
const settle=async page=>{await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);};
try {
 let index=0;
 await Promise.all(Array.from({length:4},async()=>{while(index<cases.length){
  const {size,theme}=cases[index++],[width,height]=size.split('x').map(Number);
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce',locale:'de-DE',timezoneId:'Europe/Berlin'}),page=await context.newPage(),messages=[];
  page.on('pageerror',e=>messages.push(e.message));
  await page.addInitScript(theme=>{
   localStorage.setItem('theme_pref',theme);window.__counts={renders:0,canvases:0};window.__requests=[];
   const create=document.createElement.bind(document);
   document.createElement=(tag,...rest)=>{if(tag==='canvas')__counts.canvases++;return create(tag,...rest);};
  },theme);
  await page.route('**/js/*.js',async route=>{
   const response=await route.fetch();let body=await response.text();
   body=body.replace('function render(animate) {','function render(animate) { window.__counts.renders++;');
   body=body.replace('return function requestRender({animate = false, type} = {}) {','return function requestRender({animate = false, type} = {}) { window.__requests.push(new Error().stack);');
   await route.fulfill({response,body});
  });
  await page.goto(url+'/?heute=2027-02-18');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await settle(page);
  const load=await page.evaluate(()=>({...__counts,requests:__requests}));
  await page.evaluate(()=>{__counts={renders:0,canvases:0};__requests=[];});
  await page.setViewportSize({width:width===1200?1600:1200,height});await settle(page);
  const resize=await page.evaluate(()=>({...__counts,requests:__requests}));
  if(messages.length)throw Error(messages.join('\n'));
  results.push({size,theme,load,resize,messages});await context.close();
 }}));
 results.sort((a,b)=>a.size.localeCompare(b.size)||a.theme.localeCompare(b.theme));
 await writeFile(resolve(out,'summary.json'),JSON.stringify({browser:browser.version(),results},null,2)+'\n');
 console.log(JSON.stringify(results.map(({size,theme,load,resize})=>({size,theme,load:{renders:load.renders,canvases:load.canvases},resize:{renders:resize.renders,canvases:resize.canvases}})),null,2));
} finally {await browser.close();server.close();}
