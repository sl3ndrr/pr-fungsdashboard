import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {timelineGeometry,timelineDatePosition} from '../js/layout.js';
import {EVENTS,PERIODS} from '../js/data.js';
import {parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,validateData} from '../js/utils.js';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const dateFn=source.slice(source.indexOf('const dateInMonth ='),source.indexOf('let { min: CAL_MIN_MONTH_INDEX'));
const timelineFn=source.slice(source.indexOf('function buildTimeline('),source.indexOf('\nfunction renderHero('));
const {events,periods}=validateData(EVENTS,PERIODS);
const build=new Function('timelineGeometry','timelineDatePosition','events','periods','parseISOString','calendarDayDiff','cancelledStatus','escapeHtml','formatDate','typeClass','document','today','animate',dateFn+timelineFn+'\nreturn buildTimeline(today,animate);');
const generate=(...args)=>build(args[0],timelineDatePosition,...args.slice(1));
const doc={getElementById:()=>({clientWidth:600})};
const timeline=today=>generate(timelineGeometry,events,periods,parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,doc,today,false);
test('axis ends at the corrected 10.11. exam; calendar-only events and periods never extend it',()=>{
  const result=timeline(parseISOString('2026-09-30'));
  assert.match(result.html,new RegExp(`data-axis-start="${parseISOString('2026-07-06').getTime()}"`));
  assert.match(result.html,new RegExp(`data-axis-end="${parseISOString('2026-11-10').getTime()}"`));
  const extended=generate(timelineGeometry,[...events,{id:'outside',type:'Termin',title:'Calendar only',date:'2027-01-01',time:'Ganztägig',calOnly:true}],[...periods,{id:'outside-period',label:'Outside',start:'2027-01-01',end:'2027-02-01',rgb:'1, 2, 3'}],parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,doc,parseISOString('2026-09-30'),false);
  assert.equal(extended.html,result.html);
  assert.equal(result.dotEvents.length,11);assert.ok(result.dotEvents.every(event=>!event.calOnly));
});
test('all event points keep horizontal ordering and >=32px collision spacing',()=>{
  const {html,dotEvents}=timeline(parseISOString('2026-09-30'));
  const xs=[...html.matchAll(/style="left:([\d.]+)px;--delay:[^"]+" data-event-id/g)].map(match=>Number(match[1]));
  assert.equal(xs.length,dotEvents.length);for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]>=32-1e-8);
  assert.deepEqual(dotEvents.filter(event=>event.date==='2026-10-26').map(event=>event.id),['t2']);
  const css=readFileSync(new URL('../css/styles.css',import.meta.url),'utf8');assert.match(css,/\.timeline-dot \{ position: absolute; top: -7px; width: 20px; height: 20px;/);
});
test('today progress clamps at the axis boundaries and calendar day math handles DST',()=>{
  assert.equal(timeline(parseISOString('2026-06-01')).targetPct,0);assert.equal(timeline(parseISOString('2026-11-11')).targetPct,100);
  assert.equal(calendarDayDiff(parseISOString('2026-10-26'),parseISOString('2026-10-24')),2);
});

test('today stays between past and future points on narrow rails through the final exam',()=>{
  for(const clientWidth of [280,416,600,1000])for(const iso of ['2026-09-30','2026-10-19','2026-10-25','2026-10-27','2026-11-01','2026-11-09']) {
    const result=generate(timelineGeometry,events,periods,parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,{getElementById:()=>({clientWidth})},parseISOString(iso),false);
    const width=Number(result.html.match(/style="width:([\d.]+)px"/)[1]);
    const today=result.targetPct/100*width;
    const points=[...result.html.matchAll(/style="left:([\d.]+)px;--delay:[^"]+" data-event-id="([^"]+)"/g)];
    for(const [,x,id] of points) {
      const event=events.find(e=>e.id===id);
      if(event.date<iso)assert.ok(Number(x)<today,`${id} must precede ${iso} at ${clientWidth}px`);
      if(event.date>iso)assert.ok(Number(x)>today,`${id} must follow ${iso} at ${clientWidth}px`);
    }
    if(iso==='2026-11-01') {
      const month=Number(result.html.match(/class="timeline-month" data-center="([\d.]+)"[^>]*><span class="timeline-month-label">Nov/)[1]);
      assert.equal(result.targetPct,month);
    }
  }
});

test('an empty semester has no fabricated axis, today marker or event points',()=>{
  const result=generate(timelineGeometry,[],[],parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,doc,parseISOString('2026-12-01'),false);
  assert.match(result.html,/Noch keine Termine für dieses Semester/);
  assert.doesNotMatch(result.html,/timeline-track|timeline-today|timeline-dot/);
  assert.deepEqual(result.dotEvents,[]);
  const enterFn=source.slice(source.indexOf('function enterTimeline()'),source.indexOf('\nconst statisticValues'));
  assert.doesNotThrow(()=>new Function('document','motion',enterFn+';enterTimeline();')({querySelectorAll:()=>[],querySelector:()=>null},()=>{}));
});

test('calendar-day coordinates keep equal spacing across the autumn clock change',()=>{
  const fixture=['2026-10-23','2026-10-27'].map((date,i)=>({id:`dst${i}`,type:'Prüfung',title:'DST',date,time:'10:00 Uhr'}));
  const position=iso=>generate(timelineGeometry,fixture,[],parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,doc,parseISOString(iso),false).targetPct;
  assert.ok(Math.abs((position('2026-10-25')-position('2026-10-24'))-(position('2026-10-26')-position('2026-10-25')))<1e-8);
});


test('cancelled tooltips and accessible names show neutral status or safely escaped reason',()=>{
  for(const [reason,expected] of [[undefined,'Abgebrochen'],['verschoben','Abgebrochen: verschoben'],['<b>entfällt</b>','Abgebrochen: &lt;b&gt;entfällt&lt;/b&gt;']]){
    const item={id:'cancel-fixture',type:'Prüfung',title:'Test',date:'2026-10-05',time:'10:00 Uhr',isCancelled:true,...(reason===undefined?{}:{cancelReason:reason})};
    const result=generate(timelineGeometry,[item],[],parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,doc,parseISOString('2026-10-01'),false);
    assert.ok(result.html.includes(expected));
    assert.match(result.html,/aria-label="Prüfung: Test, 05\.10\.2026, 10:00 Uhr, Abgebrochen/);
    assert.doesNotMatch(result.html,/<b>|Abgebrochen: Abgebrochen/);
  }
});

