import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EVENTS,PERIODS} from '../js/data.js';
import {parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,validateData} from '../js/utils.js';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const dateFn=source.slice(source.indexOf('const dateInMonth ='),source.indexOf('const CAL_MIN_MONTH_INDEX'));
const timelineFn=source.slice(source.indexOf('function buildTimeline('),source.indexOf('\nfunction renderHero('));
const {events,periods}=validateData(EVENTS,PERIODS);
const generate=new Function('events','periods','parseISOString','calendarDayDiff','cancelledStatus','escapeHtml','formatDate','typeClass','document','today','animate',dateFn+timelineFn+'\nreturn buildTimeline(today,animate);');
const doc={getElementById:()=>({clientWidth:600})};
const timeline=today=>generate(events,periods,parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,doc,today,false);
test('axis stays 06.07.–26.10.; calendar-only events and periods never extend it',()=>{
  const result=timeline(parseISOString('2026-09-30'));
  assert.match(result.html,new RegExp(`data-axis-start="${parseISOString('2026-07-06').getTime()}"`));
  assert.match(result.html,new RegExp(`data-axis-end="${parseISOString('2026-10-26').getTime()}"`));
  assert.equal(result.dotEvents.length,11);assert.ok(result.dotEvents.every(event=>!event.calOnly));
});
test('all event points keep horizontal ordering and >=32px collision spacing',()=>{
  const {html,dotEvents}=timeline(parseISOString('2026-09-30'));
  const xs=[...html.matchAll(/style="left:([\d.]+)px;--delay:[^"]+" data-event-id/g)].map(match=>Number(match[1]));
  assert.equal(xs.length,dotEvents.length);for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]>=32-1e-8);
  assert.deepEqual(dotEvents.filter(event=>event.date==='2026-10-26').map(event=>event.id),['p7','t2']);
  const css=readFileSync(new URL('../css/styles.css',import.meta.url),'utf8');assert.match(css,/\.timeline-dot \{ position: absolute; top: -7px; width: 20px; height: 20px;/);
});
test('today progress clamps at the axis boundaries and calendar day math handles DST',()=>{
  assert.equal(timeline(parseISOString('2026-06-01')).targetPct,0);assert.equal(timeline(parseISOString('2026-11-01')).targetPct,100);
  assert.equal(calendarDayDiff(parseISOString('2026-10-26'),parseISOString('2026-10-24')),2);
});


test('cancelled tooltips and accessible names show neutral status or safely escaped reason',()=>{
  for(const [reason,expected] of [[undefined,'Abgebrochen'],['verschoben','Abgebrochen: verschoben'],['<b>entfällt</b>','Abgebrochen: &lt;b&gt;entfällt&lt;/b&gt;']]){
    const item={id:'cancel-fixture',type:'Prüfung',title:'Test',date:'2026-10-05',time:'10:00 Uhr',isCancelled:true,...(reason===undefined?{}:{cancelReason:reason})};
    const result=generate([item],[],parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,doc,parseISOString('2026-10-01'),false);
    assert.ok(result.html.includes(expected));
    assert.match(result.html,/aria-label="Prüfung: Test, 05\.10\.2026, 10:00 Uhr, Abgebrochen/);
    assert.doesNotMatch(result.html,/<b>|Abgebrochen: Abgebrochen/);
  }
});
