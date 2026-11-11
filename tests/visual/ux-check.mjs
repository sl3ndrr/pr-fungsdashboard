/** Browser audit: screenshots and measurements; never writes visual baselines. */
import {chromium} from 'playwright';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const args=process.argv.slice(2);
const value=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const all=args.includes('--all');
const sizes=all?['320x640','375x812','600x900','840x900','1200x900','1600x1000','2300x1200']:[value('--viewport','1200x900')];
const days=all?['2026-11-11','2026-12-15','2026-12-18','2027-02-16','2027-02-17','2027-02-18','2027-03-01','2027-04-08']:[value('--heute','2026-11-11')];
const themes=all?['light','dark']:[value('--theme','light')];
const motions=all?[false,true]:[args.includes('--reduced-motion')];
const selectors=args.flatMap((v,i)=>v==='--selector'?[args[i+1]]:[]);
const out=resolve(value('--out','test-results/ux'));
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
try {
 for(const size of sizes) for(const day of days) for(const theme of themes) for(const reduced of motions) {
  const match=/^(\d+)x(\d+)$/i.exec(size); if(!match || !['light','dark'].includes(theme)) throw Error('Ungültiger Viewport oder Theme');
  const context=await browser.newContext({viewport:{width:+match[1],height:+match[2]},locale:'de-DE',timezoneId:'Europe/Berlin',colorScheme:theme,reducedMotion:reduced?'reduce':'no-preference'});
  const page=await context.newPage(), messages=[];
  page.on('console',m=>{if(['warning','error'].includes(m.type()))messages.push({type:m.type(),text:m.text()});});
  page.on('pageerror',e=>messages.push({type:'pageerror',text:e.message}));
  await page.addInitScript(theme=>localStorage.setItem('theme_pref',theme),theme);
  await page.goto(`${process.env.DASHBOARD_URL||'http://127.0.0.1:8000'}/?heute=${encodeURIComponent(day)}`);
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
  const result=await page.evaluate(selectors=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
   const visible=e=>{const r=rect(e),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
   const name=e=>e.id?`#${CSS.escape(e.id)}`:e.tagName.toLowerCase()+(e.classList.length?'.'+[...e.classList].map(CSS.escape).join('.'):'');
   const targets=[...document.querySelectorAll('button,a[href],input,select,textarea,[role="button"]')].filter(visible).map(e=>({selector:name(e),...rect(e)})).filter(r=>r.width<44||r.height<44);
   const labels=[...document.querySelectorAll('.timeline-event-label,.timeline-period-label,.timeline-month,.timeline-today-label')].filter(visible);
   const overlaps=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=rect(labels[i]),b=rect(labels[j]);if(a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height)overlaps.push([name(labels[i]),name(labels[j])]);}
   const rgb=s=>{const m=s.match(/[\d.]+/g);return m?m.slice(0,3).map(Number):null;};
   const lum=c=>{const v=c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
   const contrast=selectors.flatMap(sel=>[...document.querySelectorAll(sel)].filter(visible).map(e=>{let p=e,bg;while(p){const c=getComputedStyle(p).backgroundColor;if(!c.endsWith(', 0)')&&c!=='transparent'){bg=rgb(c);break;}p=p.parentElement;}const fg=rgb(getComputedStyle(e).color);const a=fg&&lum(fg),b=bg&&lum(bg);return {selector:sel,foreground:fg,background:bg,ratio:a!=null&&b!=null?(Math.max(a,b)+.05)/(Math.min(a,b)+.05):null};}));
   return {innerWidth,scrollWidth:document.documentElement.scrollWidth,targets,overlaps,contrast};
  },selectors);
  const stem=`${size}-${day}-${theme}${reduced?'-reduced':''}`;
  await page.screenshot({path:`${out}/${stem}.png`,fullPage:true,animations:'disabled'});
  await writeFile(`${out}/${stem}.json`,JSON.stringify({size,day,theme,reduced,messages,...result},null,2)+'\n');
  await context.close();
 }
} finally {await browser.close();}
