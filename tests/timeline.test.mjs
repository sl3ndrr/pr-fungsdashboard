import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {timelineWindow,timelinePosition,timelineEventLayout,timelineLabelLayout} from '../js/layout.js';
import {EVENTS,PERIODS} from '../js/data.js';
import {parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,validateData,upcomingEvents} from '../js/utils.js';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const dateFn=source.slice(source.indexOf('const dateInMonth ='),source.indexOf('let { min: CAL_MIN_MONTH_INDEX'));
const timelineFn=source.slice(source.indexOf('function buildTimeline('),source.indexOf('\nfunction renderHero('));
const {events,periods}=validateData(EVENTS,PERIODS);
const doc={getElementById:()=>({clientWidth:600}),createElement:()=>({getContext:()=>({measureText:text=>({width:text.length*7})})})};
const generate=(fixture=events,bands=periods,today='2026-10-24',mode='upcoming',width=600)=>new Function('timelineWindow','timelinePosition','timelineEventLayout','timelineLabelLayout','events','periods','parseISOString','calendarDayDiff','cancelledStatus','escapeHtml','formatDate','typeClass','document','getComputedStyle','today','timelineMode','doneItems','upcomingEvents',dateFn+timelineFn+'\nreturn buildTimeline(today);')(
  timelineWindow,timelinePosition,timelineEventLayout,timelineLabelLayout,fixture,bands,parseISOString,calendarDayDiff,cancelledStatus,escapeHtml,formatDate,typeClass,
  {...doc,getElementById:()=>({clientWidth:width})},()=>({fontSize:'12px',fontFamily:'system-ui'}),parseISOString(today),mode,[],upcomingEvents);

const pointFixtures = ['2026-09-23','2026-09-24','2026-10-05','2026-10-07'].map((date,i)=>({id:`x${i}`,type:'Prüfung',title:'Langer Titel '.repeat(20),date,time:'10:00 Uhr'}));

test('window selection uses only main events, preserving cancellation and hideFromNext',()=>{
  const result=timelineWindow(events,parseISOString('2026-10-24'));
  assert.deepEqual(result.events.map(e=>e.id),['t2','p7']);
  assert.equal(result.axisStart,parseISOString('2026-07-06').getTime());
  assert.equal(result.axisEnd,parseISOString('2026-11-10').getTime());
  const extra={id:'calendar',date:'2028-01-01',calOnly:true};
  assert.deepEqual(timelineWindow([...events,extra],parseISOString('2026-10-24')),result);
  const cancelled=[{...pointFixtures[0],isCancelled:true},pointFixtures[1]];
  assert.equal(timelineWindow(cancelled,parseISOString('2026-10-02'),'semester').axisStart,parseISOString('2026-09-23').getTime());
});

test('0 events, 1 event, no upcoming events and before/after semester remain finite',()=>{
  assert.equal(timelineWindow([],parseISOString('2026-12-01')),null);
  assert.deepEqual(generate([],[]).dotEvents,[]);
  assert.doesNotMatch(generate([],[]).html,/timeline-track|timeline-dot/);
  for (const mode of ['upcoming','semester'])for(const day of ['2026-06-01','2026-11-30']) {
    const window=timelineWindow([pointFixtures[0]],parseISOString(day),mode);
    assert.ok(window.maxDay>window.minDay);
    assert.doesNotMatch(generate([pointFixtures[0]],[],day,mode).html,/NaN|Infinity/);
  }
});

test('all viewport widths 320–2300 fit every upcoming point, especially p7',()=>{
  for (let width=320;width<=2300;width++) {
    const window=timelineWindow(events,parseISOString('2026-10-24'));
    const targets=window.events.map(e=>(calendarDayDiff(parseISOString(e.date),window.origin)-window.minDay)/(window.maxDay-window.minDay));
    const xs=targets.map(target=>timelinePosition(target,0,1,width));
    assert.ok(xs.every(x=>x>=22&&x<=width-22));
    assert.equal(window.events.at(-1).id,'p7');
  }
});

test('dense labels and hit rectangles never intersect; only edge labels are clamped',()=>{
  for(const width of [200,256,280,320,360,390,600,820,1024,1280,1600,2300]) {
    const window=timelineWindow(events,parseISOString('2026-10-02'),'semester');
    const points=window.events.map(e=>({x:timelinePosition(calendarDayDiff(parseISOString(e.date),window.origin),window.minDay,window.maxDay,width),variants:[{title:'Full',width:140},{title:'Date',width:44}]}));
    const layout=timelineEventLayout(points,width);
    layout.forEach((p,i)=>{
      assert.ok(p.left>=0 && p.left+p.width<=width+1e-8);
      assert.ok(Math.abs(p.center-points[i].x)<1e-8 || p.left===0 || Math.abs(p.left+p.width-width)<1e-8);
      layout.slice(i+1).forEach(q=>assert.ok(p.lane!==q.lane || p.left+p.width+8<=q.left+1e-8 || q.left+q.width+8<=p.left+1e-8));
    });
  }
});

test('equal dates retain input order and x; neighbours 23/24 Sept and 5/7 Oct get lanes',()=>{
  const fixture=[...pointFixtures,{...pointFixtures[0],id:'last'}];
  const window=timelineWindow(fixture,parseISOString('2026-10-02'),'semester');
  assert.deepEqual(window.events.map(e=>e.id),['x0','last','x1','x2','x3']);
  const xs=window.events.map(e=>timelinePosition(calendarDayDiff(parseISOString(e.date),window.origin),window.minDay,window.maxDay,256));
  const layout=timelineEventLayout(xs.map(x=>({x,variants:[{width:44}]})),256);
  assert.equal(xs[0],xs[1]);assert.notEqual(layout[0].lane,layout[1].lane);
  assert.notEqual(layout[0].lane,layout[2].lane);
  assert.notEqual(layout[3].lane,layout[4].lane);
});

test('calendar days remain linear across both DST changes',()=>{
  for(const days of [['2026-03-28','2026-03-29','2026-03-30'],['2026-10-24','2026-10-25','2026-10-26']]) {
    const start=parseISOString(days[0]);
    const xs=days.map(day=>timelinePosition(calendarDayDiff(parseISOString(day),start),-2,4,600));
    assert.ok(Math.abs(xs[1]-xs[0]-(xs[2]-xs[1]))<1e-8);
    assert.equal(calendarDayDiff(parseISOString(days[2]),start),2);
  }
});

test('all visible events have a direct label and complete accessible status; next skips t2',()=>{
  const {html,dotEvents}=generate();
  assert.equal(dotEvents.length,2);
  assert.equal((html.match(/class="timeline-event-label"/g)||[]).length,2);
  assert.match(html,/id="timeline-event-p7"[^>]*class="timeline-dot pruefung   next"/);
  assert.match(html,/aria-label="Prüfung: Programmierpraktikum, 10.11.2026, 10:00 Uhr, Offen"/);
  const cancelled=generate([{...pointFixtures[0],isCancelled:true,cancelReason:'<b>entfällt</b>'}],[],'2026-09-01');
  assert.match(cancelled.html,/Abgebrochen: &lt;b&gt;entfällt&lt;\/b&gt;/);
  assert.doesNotMatch(cancelled.html,/<b>/);
});

test('partially visible periods are clipped to the window and retain complete labels',()=>{
  const normal=generate();
  assert.equal((normal.html.match(/class="timeline-period-span"/g)||[]).length,1);
  assert.match(normal.html,/in Wiesbaden/);
  const outside={id:'outside',label:'Outside',start:'2028-01-01',end:'2028-02-01',rgb:'1,2,3'};
  assert.equal(generate(events,[...periods,outside]).html,normal.html);
});

test('month labels carry a four-digit year only first or when the year changes',()=>{
  const html=generate(events,periods,'2026-10-24').html;
  assert.match(html,/>Okt 2026<\/span>/);assert.match(html,/>Nov<\/span>/);
  assert.doesNotMatch(html,/>Okt\. 26</);
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
