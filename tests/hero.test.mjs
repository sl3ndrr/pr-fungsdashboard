import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sittingDate, sittingAccessibleName} from '../js/cards.js';
import * as utils from '../js/utils.js';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('function buildHero('),source.indexOf('\nfunction focusAfterRender'));
function hero(day,total){
  let html;
  const element={querySelectorAll:()=>[]};
  const deps={...utils,sittingDate,sittingAccessibleName,periods:[{id:'test',label:'Test',start:'2026-10-01',end:`2026-10-${String(total).padStart(2,'0')}`,rgb:'249, 115, 22'}],document:{getElementById:()=>element},ICONS:{calendar:'',clock:'',Prüfung:''},syncHTML:(el,value)=>{html=value},listenOnce:()=>{}};
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

test('hero badge, other sitting and followups retain occurrence-specific card references',()=>{
  let html;
  const exam={id:'ab',type:'Prüfung',title:'Rechenmethoden',sittings:[{key:'A',date:'2027-02-22',time:'10:00–12:00 Uhr'},{key:'B',date:'2027-04-01',time:'10:00–12:00 Uhr'}]};
  const upcoming=utils.upcomingEvents([exam],utils.parseISOString('2026-11-02'));
  const deps={...utils,sittingDate,sittingAccessibleName,periods:[],document:{getElementById:()=>({querySelectorAll:()=>[]})},ICONS:{calendar:'',clock:'',Prüfung:''},syncHTML:(_,value)=>html=value,listenOnce:()=>{}};
  new Function(...Object.keys(deps),'upcoming','today',fn+';buildHero(upcoming,today,false)')(...Object.values(deps),upcoming,utils.parseISOString('2026-11-02'));
  assert.match(html,/Prüfung · A-Termin/);
  assert.match(html,/B-Termin · Do\., 01.04.2027 · in 150 Tagen/);
  assert.match(html,/data-key="next-ab-B" data-event-id="ab" data-occurrence-id="ab-B"/);
});

test('hero empty state makes clear that only dated occurrences are exhausted',()=>{
  let html;
  const deps={...utils,document:{getElementById:()=>({})},ICONS:{check:''},syncHTML:(_,value)=>html=value};
  new Function(...Object.keys(deps),fn+';buildHero([],parseISOString("2027-04-08"),false)')(...Object.values(deps));
  assert.match(html,/Keine datierten Termine offen/);
  assert.doesNotMatch(html,/hero-number/);
});
