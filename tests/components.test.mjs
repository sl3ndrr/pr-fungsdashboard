import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {eventStatistics,parseISOString} from '../js/utils.js';
const source=readFileSync(new URL('../js/stats.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('  const stats ='),source.indexOf('\n  animateStatistics();'));
function render(events,done){let html;new Function('mainEvents','todayMid','doneItems','eventStatistics','document','syncHTML',body)(events,parseISOString('2026-11-11'),done,eventStatistics,{getElementById:()=>({})},(_,value)=>html=value);return html;}
test('assignment tile is complete only when at least one assignment exists and all are done',()=>{
 const items=[{id:'one',type:'Abgabe',date:'2026-12-18',time:'offen'},{id:'two',type:'Abgabe',date:'2026-12-19',time:'offen'}];
 for(const [events,done,complete] of [[[],[],false],[items,[],false],[items,['one'],false],[items,['one','two'],true]]){
  const html=render(events,done);assert.equal(/class="stat-tile is-complete" data-key="stats-assignments"/.test(html),complete);assert.match(html,/>Einträge<\/span>/);
 }
});
