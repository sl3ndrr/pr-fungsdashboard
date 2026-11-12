import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../js/state.js';
import {SEMESTERS} from '../js/data.js';
import {now} from '../js/clock.js';
import {semesterIdFromSearch, isSemesterComplete, archiveSummary} from '../js/semesters.js';
import {parseISOString} from '../js/utils.js';
import {readFileSync} from 'node:fs';

test('fresh storage on ?heute=2026-11-11 seeds summer completions while winter is active', async () => {
  const previous = globalThis.location;
  globalThis.location = {search:'?heute=2026-11-11'};
  try {
    const writes = [];
    const store = createState(SEMESTERS, now(), {
      loadItems:async()=>null, saveItems:async(key, items)=>writes.push(items),
    });
    await store.initialiseDoneItems();
    assert.equal(store.get().semester.id, 'ws-2026-2027');
    assert.deepEqual(store.get().doneItems, ['a1','a2']);
    assert.deepEqual(writes, [['a1','a2']]);
  } finally {
    if (previous === undefined) delete globalThis.location;
    else globalThis.location = previous;
  }
});

test('an existing empty or populated completion snapshot is never seeded again', async () => {
  for (const saved of [[], ['a2','ws26-asp-portfolio']]) {
    const writes = [];
    const store = createState(SEMESTERS, new Date(2026,10,11), {
      loadItems:async()=>saved, saveItems:async(key, items)=>writes.push(items),
    });
    await store.initialiseDoneItems();
    assert.deepEqual(store.get().doneItems, saved);
    assert.deepEqual(writes, []);
  }
});

test('semester parameters accept only exact known IDs and coexist with the date override', () => {
  for (const semester of SEMESTERS) {
    assert.equal(semesterIdFromSearch(SEMESTERS, `?heute=2026-11-11&semester=${semester.id}`), semester.id);
  }
  for (const search of ['', '?semester=', '?semester=unknown', '?semester=SS-2026', '?semester=ss-2026%20']) {
    assert.equal(semesterIdFromSearch(SEMESTERS, search), null);
  }
});

test('archive begins after every non-calendar event, including B and cancellations, is past', () => {
  const summer = SEMESTERS[0].events;
  assert.equal(isSemesterComplete(summer, parseISOString('2026-11-10')), false);
  assert.equal(isSemesterComplete(summer, new Date(2026,10,10,23,59,59)), false);
  assert.equal(isSemesterComplete(summer, parseISOString('2026-11-11')), true);
  assert.equal(isSemesterComplete(SEMESTERS[1].events, parseISOString('2027-04-08')), false);
  assert.equal(isSemesterComplete([], parseISOString('2027-04-08')), false);
  const exam = {id:'ab',type:'Prüfung',sittings:[{key:'A',date:'2027-02-17'},{key:'B',date:'2027-04-07'}]};
  assert.equal(isSemesterComplete([exam], parseISOString('2027-02-18')), false);
  assert.equal(isSemesterComplete([exam], parseISOString('2027-04-07')), false);
  assert.equal(isSemesterComplete([exam], parseISOString('2027-04-08')), true);
  assert.equal(isSemesterComplete([...summer,{id:'calendar',calOnly:true,date:'2028-01-01'}], parseISOString('2026-11-11')), true);
  assert.equal(isSemesterComplete([...summer,{id:'cancelled',isCancelled:true,date:'2026-11-12'}], parseISOString('2026-11-11')), false);
});

test('archive summary uses actual event statuses without double-counting A/B or calendar entries', () => {
  assert.deepEqual(archiveSummary(SEMESTERS[0].events, ['a1','a2']), {
    exams:7, examsPassed:0, assignments:2, assignmentsDone:2, cancelled:1,
  });
  const events = [
    {id:'exam',type:'Prüfung',sittings:[{key:'A',date:'2026-10-01'},{key:'B',date:'2026-11-01'}]},
    {id:'cancelled',type:'Prüfung',isCancelled:true},
    {id:'cancelled-assignment',type:'Abgabe',isCancelled:true},
    {id:'assignment',type:'Abgabe'},
    {id:'private',type:'Prüfung',calOnly:true},
  ];
  assert.deepEqual(archiveSummary(events, events.map(e=>e.id)), {
    exams:2, examsPassed:1, assignments:1, assignmentsDone:1, cancelled:2,
  });
  assert.deepEqual(archiveSummary([]), {exams:0,examsPassed:0,assignments:0,assignmentsDone:0,cancelled:0});
});

test('URL selection overrides the automatic semester and remains pinned across midnight', () => {
  const day=parseISOString;
  const store=createState(SEMESTERS,day('2026-11-10'),{search:'?semester=ss-2026'});
  assert.equal(store.get().semester.id,'ss-2026');assert.equal(store.get().archive,false);
  assert.equal(store.prepareSemester(day('2026-11-11')),true);
  assert.equal(store.get().semester.id,'ss-2026');assert.equal(store.get().archive,true);
  assert.equal(store.get().showPast,true);assert.equal(store.get().timelineMode,'semester');
  store.update({showPast:false,timelineMode:'upcoming'});
  assert.equal(store.prepareSemester(day('2026-11-12')),false);
  assert.equal(store.get().showPast,false);assert.equal(store.get().timelineMode,'upcoming');
  const future=createState(SEMESTERS,day('2026-11-10'),{search:'?semester=ws-2026-2027'});
  assert.equal(future.get().semester.id,'ws-2026-2027');
  assert.equal(future.prepareSemester(day('2026-11-11')),false);
});

test('invalid selection uses the unchanged automatic midnight transition', () => {
  const store=createState(SEMESTERS,new Date(2026,10,10,23,59),{search:'?semester=invalid'});
  assert.equal(store.get().semester.id,'ss-2026');
  assert.equal(store.prepareSemester(new Date(2026,10,11)),true);
  assert.equal(store.get().semester.id,'ws-2026-2027');
  assert.equal(store.get().archive,false);assert.equal(store.get().showPast,false);
});

test('selection resets view defaults once, keeps global completion IDs and notifies once', async () => {
  const store=createState(SEMESTERS,parseISOString('2026-11-11'),{
    loadItems:async()=>['a2','ws26-info3'],saveItems:async()=>{},
  });
  await store.initialiseDoneItems();
  store.update({typeFilter:'Prüfung'});
  let renders=0;store.onRender(()=>renders++);
  store.selectSemester('ss-2026',parseISOString('2026-11-11'));
  assert.equal(renders,1);assert.equal(store.get().typeFilter,'all');
  assert.equal(store.get().showPast,true);assert.equal(store.get().timelineMode,'semester');
  assert.deepEqual(store.get().doneItems,['a2','ws26-info3']);
  const before=store.get();store.selectSemester('invalid',parseISOString('2026-11-11'));
  assert.equal(store.get(),before);assert.equal(renders,1);
  store.selectSemester('ws-2026-2027',parseISOString('2026-11-11'));
  assert.equal(renders,2);assert.equal(store.get().showPast,false);assert.equal(store.get().timelineMode,'upcoming');
  assert.equal(store.prepareSemester(parseISOString('2026-11-10')),false);
});

test('selecting the currently active semester pins it without resetting filters', () => {
  const store=createState(SEMESTERS,parseISOString('2026-11-10'));
  store.update({typeFilter:'Abgabe'});
  store.selectSemester('ss-2026',parseISOString('2026-11-10'));
  assert.equal(store.get().typeFilter,'Abgabe');
  store.prepareSemester(parseISOString('2026-11-11'));
  assert.equal(store.get().semester.id,'ss-2026');
});

test('archive hero displays actual totals and marked outcomes instead of an empty next-event state', () => {
  const source=readFileSync(new URL('../js/hero.js',import.meta.url),'utf8');
  const fn=source.slice(source.indexOf('function buildHero('));
  for (const doneItems of [['a1','a2'],['a2','p1']]) {
    let html;
    const deps={store:{get:()=>({archive:true,events:SEMESTERS[0].events,doneItems})},
      document:{getElementById:()=>({})},archiveSummary,syncHTML:(_,value)=>html=value};
    new Function(...Object.keys(deps),'today',fn+';buildHero([],today,false)')(...Object.values(deps),parseISOString('2026-11-11'));
    assert.match(html,/Semester abgeschlossen/);assert.match(html,/Prüfungen<\/dt><dd>7/);
    assert.match(html,new RegExp(`davon ${doneItems.includes('p1')?1:0} als bestanden markiert`));
    assert.match(html,new RegExp(`Abgaben erledigt<\/dt><dd>${doneItems.includes('a1')?2:1} von 2`));
    assert.match(html,/Abgebrochene Einträge<\/dt><dd>1/);
    assert.doesNotMatch(html,/Keine datierten Termine offen|Note|hero-number/);
  }
});
