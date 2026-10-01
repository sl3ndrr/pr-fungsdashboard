import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as utils from '../js/utils.js';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('function buildHero('),source.indexOf('\nconst MONTH_NAMES'));
function hero(day,total){
  let html;
  const element={querySelectorAll:()=>[]};
  const deps={...utils,periods:[{id:'test',label:'Test',start:'2026-10-01',end:`2026-10-${String(total).padStart(2,'0')}`,rgb:'249, 115, 22'}],document:{getElementById:()=>element},ICONS:{calendar:'',clock:'',Prüfung:''},syncHTML:(el,value)=>{html=value},listenOnce:()=>{}};
  new Function(...Object.keys(deps),'upcoming','today',fn+'; buildHero(upcoming,today,false)')(...Object.values(deps),[{id:'fixture',type:'Prüfung',title:'Fixture',date:'2026-10-15',time:'10:00 Uhr'}],utils.parseISOString(`2026-10-${String(day).padStart(2,'0')}`));
  return html;
}
test('hero renders matching visible and accessible remaining-day text',()=>{
  for(const [day,total,text] of [[1,9,'noch 8 Tage'],[8,9,'noch 1 Tag'],[9,9,'letzter Tag']]){
    const html=hero(day,total);
    assert.ok(html.includes(`Tag ${day} von ${total}, ${text}</span>`));
    assert.ok(html.includes(`aria-valuetext="Tag ${day} von ${total}, ${text}"`));
    assert.ok(html.includes(`aria-valuenow="${day}"`));
  }
});
