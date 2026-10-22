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
const build=new Function('timelineGeometry','timelineDatePosition','events','periods','parseISOString','calendarDayDiff','cancelledStatus','escapeHtml','formatDate','typeClass','document','today','animate','expanded',dateFn+timelineFn+'\nreturn buildTimeline(today,animate,{expanded:expanded ?? true});');
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
test('event points keep chronological x positions and disjoint 44px touch areas',()=>{
  const {html,dotEvents}=timeline(parseISOString('2026-09-30'));
  const points=[...html.matchAll(/style="left:([\d.]+)px;--delay:([^"]+)" data-event-id/g)].map(([,x,style])=>({x:Number(x),y:Number(style.match(/top:([\d.-]+)px/)?.[1]??-7)}));
  assert.equal(points.length,dotEvents.length);
  for(let i=0;i<points.length;i++)for(let j=0;j<i;j++) {
    assert.ok(points[i].x>=points[j].x);
    assert.ok(Math.abs(points[i].x-points[j].x)>=44-1e-8 || Math.abs(points[i].y-points[j].y)>=44);
  }
  assert.deepEqual(dotEvents.filter(event=>event.date==='2026-10-26').map(event=>event.id),['t2']);
  const css=readFileSync(new URL('../css/styles.css',import.meta.url),'utf8');assert.match(css,/\.timeline-dot \{ position: absolute; top: -7px; width: 20px; height: 20px;/);
});
test('today remains inside the padded axis before and after the events; day math handles DST',()=>{
  for(const iso of ['2026-06-01','2026-11-11']){
    const pct=timeline(parseISOString(iso)).targetPct;assert.ok(pct>0&&pct<100);
  }
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



test('every calendar day keeps its boundary at every integer width from 280 to 1000',()=>{
  const axisStart=parseISOString('2026-07-06');
  const days=[...events.filter(e=>!e.calOnly)].sort((a,b)=>a.date.localeCompare(b.date)).map(e=>calendarDayDiff(parseISOString(e.date),axisStart));
  const range=days.at(-1), min=-range*.04,max=range*1.04;
  const first=calendarDayDiff(parseISOString('2026-06-01'),axisStart);
  const last=calendarDayDiff(parseISOString('2026-11-12'),axisStart);
  for(let width=280;width<=1000;width++){
    const fitted=timelineGeometry(days.map(day=>(day-min)/(max-min)),width);
    for(let day=first;day<=last;day++){
      const today=timelineDatePosition(day,days,fitted.xs,min,max,fitted.width);
      fitted.xs.forEach((x,i)=>assert.equal(Math.sign(x-today),Math.sign(days[i]-day),`width=${width}, day=${day}, event=${i}`));
    }
    assert.ok(fitted.width<=width*4);
    for(let i=0;i<fitted.xs.length;i++)for(let j=0;j<i;j++) {
      assert.ok(fitted.xs[i]>=fitted.xs[j]);
      assert.ok(Math.abs(fitted.xs[i]-fitted.xs[j])>=44-1e-8 || Math.abs(fitted.lanes[i]-fitted.lanes[j])*44>=44);
    }
  }
});

for(const clientWidth of [342,390])test(`22.10.2026 rendered boundary at ${clientWidth}px`,()=>{
  const result=generate(timelineGeometry,events,periods,parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,{getElementById:()=>({clientWidth})},parseISOString('2026-10-22'),false);
  const width=Number(result.html.match(/style="width:([\d.]+)px"/)[1]);
  const today=result.targetPct*width/100;
  for(const [,x,id]of result.html.matchAll(/style="left:([\d.]+)px;--delay:[^"]+" data-event-id="([^"]+)"/g)){
    const event=events.find(e=>e.id===id);
    assert.equal(Math.sign(Number(x)-today),Math.sign(event.date.localeCompare('2026-10-22')));
  }
});

test('same-day events share the today coordinate and use separate touch lanes',()=>{
  const fitted=timelineGeometry([.2,.2,.8],342);
  assert.equal(fitted.xs[0],fitted.xs[1]);
  assert.ok(Math.abs(fitted.lanes[1]-fitted.lanes[0])*44>=32);
  assert.equal(timelineDatePosition(2,[2,2,8],fitted.xs,0,10,fitted.width),fitted.xs[0]);
});

test('today on every actual event day sits exactly on the event point',()=>{
  for(const e of events.filter(e=>!e.calOnly)){
    const result=timeline(parseISOString(e.date));
    const width=Number(result.html.match(/style="width:([\d.]+)px"/)[1]);
    const x=Number(result.html.match(new RegExp(`style="left:([\\d.]+)px;--delay:[^"]+" data-event-id="${e.id}"`))[1]);
    assert.ok(Math.abs(result.targetPct*width/100-x)<1e-8,e.id);
  }
});


test('the focused view hides only past events and keeps a linear scale with centered padding',()=>{
  for(const clientWidth of [280,342,390,600,1000])for(const iso of ['2026-06-01','2026-07-06','2026-10-22','2026-10-26','2026-11-10','2026-11-12']){
    const result=generate(timelineGeometry,events,periods,parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,{getElementById:()=>({clientWidth})},parseISOString(iso),false,false);
    assert.deepEqual(result.dotEvents.map(e=>e.id),events.filter(e=>!e.calOnly&&e.date>=iso).sort((a,b)=>a.date.localeCompare(b.date)).map(e=>e.id));
    const width=Number(result.html.match(/style="width:([\d.]+)px"/)[1]),today=result.targetPct*width/100;
    assert.ok(today>=(clientWidth-16)/2-1e-8);
    assert.ok(width-today>=(clientWidth-16)/2-1e-8);
    const points=[...result.html.matchAll(/style="left:([\d.]+)px;--delay:[^"]+" data-event-id="([^"]+)"/g)];
    let scale;
    for(const [,x,id]of points){
      const event=events.find(e=>e.id===id),days=calendarDayDiff(parseISOString(event.date),parseISOString(iso));
      if(!days)assert.ok(Math.abs(Number(x)-today)<1e-8);
      else {
        assert.ok(Number(x)>today);
        const nextScale=(Number(x)-today)/days;
        if(scale!==undefined)assert.ok(Math.abs(nextScale-scale)<1e-8);
        scale=nextScale;
      }
    }
  }
});

test('November mark and Wiesbaden endpoints use the same proportional date coordinates',()=>{
  const result=timeline(parseISOString('2026-10-22'));
  const width=Number(result.html.match(/style="width:([\d.]+)px"/)[1]);
  const point=id=>Number(result.html.match(new RegExp(`style="left:([\\d.]+)px;--delay:[^"]+" data-event-id="${id}"`))[1]);
  const month=Number(result.html.match(/class="timeline-month" data-center="([\d.]+)"[^>]*><span class="timeline-month-label">Nov/)[1])*width/100;
  const start=point('t2'),end=point('p7');
  assert.ok(month>start&&month<end);
  assert.ok(Math.abs((month-start)/(end-start)-6/15)<1e-8);
  const wiesbaden=[...result.html.matchAll(/timeline-period-label" data-center="[^"]+" data-start="([\d.]+)" data-end="([\d.]+)"[^>]*>in Wiesbaden/g)].at(-1);
  const today=result.targetPct*width/100,scale=(end-start)/15;
  assert.ok(Math.abs(Number(wiesbaden[1])*width/100-(today-7*scale))<1e-8);
  assert.ok(Math.abs(Number(wiesbaden[2])*width/100-(today+3*scale))<1e-8);
});

test('the seven-day statistic includes the event noun with correct singular and plural',()=>{
  const stats=source.slice(source.indexOf('  const abgaben     ='),source.indexOf('\n  animateStatistics();'));
  for(const count of [0,1,2]){
    let html;
    const fixture=Array.from({length:count},(_,i)=>({id:`stat${i}`,type:'Termin',date:'2026-10-26'}));
    new Function('mainEvents','sorted','doneItems','todayMid','calendarDayDiff','parseISOString','document','syncHTML',stats)(fixture,fixture,[],parseISOString('2026-10-22'),calendarDayDiff,parseISOString,doc,(_,value)=>{html=value});
    assert.match(html,new RegExp(`>${count}</strong><span class="stat-label">${count===1?'Termin':'Termine'} in 7 Tagen`));
  }
});

test('midnight scheduler uses local calendar days, refreshes on wake, and handles the 25-hour DST day',()=>{
  const scheduler=source.slice(source.indexOf('function scheduleNextDay()'),source.indexOf("document.getElementById('cal-toggle-btn').innerHTML"));
  let now=parseISOString('2026-10-25').getTime(),callback,delay,renders=0;
  class ClockDate extends Date{constructor(...args){super(...(args.length?args:[now]));}}
  const document={hidden:false};
  const create=new Function('Date','document','midnight','setTimeout','clearTimeout','onRender',`
    const localDayKey=date=>date.toLocaleDateString('de-DE');
    let dayTimer;
    let renderedDay=localDayKey(new Date());
    function renderPreservingState(){renderedDay=localDayKey(new Date());onRender();}
    ${scheduler}; return {refreshCurrentDay,scheduleNextDay};`);
  const api=create(ClockDate,document,d=>new ClockDate(d.getFullYear(),d.getMonth(),d.getDate()),(fn,ms)=>{callback=fn;delay=ms;return 1},()=>{},()=>renders++);
  api.scheduleNextDay();
  assert.equal(delay,25*60*60*1000+25);
  now=parseISOString('2026-10-26').getTime()+25;callback();assert.equal(renders,1);
  api.refreshCurrentDay();assert.equal(renders,1);
  document.hidden=true;now=parseISOString('2026-10-27').getTime();callback();assert.equal(renders,1);
  document.hidden=false;api.refreshCurrentDay();assert.equal(renders,2);
});


test('expanded semester stays within four usable widths on every day, with room to center today',()=>{
  for(const clientWidth of [280,342,390,600,1000])for(let day=parseISOString('2026-06-01');day<=parseISOString('2026-11-12');day.setDate(day.getDate()+1)){
    const result=generate(timelineGeometry,events,periods,parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,{getElementById:()=>({clientWidth})},day,false,true);
    const width=Number(result.html.match(/style="width:([\d.]+)px"/)[1]),today=result.targetPct*width/100;
    assert.ok(width<=4*(clientWidth-16));
    assert.ok(today>=(clientWidth-16)/2-1e-8);
    assert.ok(width-today>=(clientWidth-16)/2-1e-8);
    const points=[...result.html.matchAll(/style="left:([\d.]+)px;--delay:([^"]+)" data-event-id="([^"]+)"/g)];
    for(const [,x,,id]of points){
      const event=events.find(e=>e.id===id);
      const offset=calendarDayDiff(parseISOString(event.date),day);
      if(!offset)assert.ok(Math.abs(Number(x)-today)<1e-8);
      else assert.equal(Math.sign(Number(x)-today),Math.sign(offset));
    }
  }
});
