import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENTS, PERIODS, SEMESTERS} from '../js/data.js';
import {semesterForDate, upcomingEvents, calendarRange, parseISOString, validateData} from '../js/utils.js';

test('summer stays active through November; winter starts on 01.12.2026 at local midnight', () => {
  for (const date of [new Date(2026,9,22),new Date(2026,9,26),new Date(2026,10,30,23,59,59)]) {
    assert.equal(semesterForDate(SEMESTERS,date).id,'ss-2026');
  }
  for (const date of [new Date(2026,11,1),new Date(2027,0,15)]) {
    const semester = semesterForDate(SEMESTERS,date);
    assert.equal(semester.id,'ws-2026-2027');
    assert.equal(semester.label,'Wintersemester 2026/2027');
    assert.deepEqual(semester.events,[]);
    assert.deepEqual(semester.periods,[]);
  }
  assert.equal(SEMESTERS[0].events,EVENTS);
  assert.equal(SEMESTERS[0].periods,PERIODS);
});

test('the semester transition is excluded from both next and follow-up cards only', () => {
  const day = parseISOString('2026-10-22');
  const upcoming = upcomingEvents(EVENTS,day,['a1','a2']);
  assert.deepEqual(upcoming.map(e=>e.id),['p7']);
  assert.ok(validateData(EVENTS,PERIODS).events.some(e=>e.id==='t2' && !e.calOnly));
  assert.equal(upcomingEvents(EVENTS,parseISOString('2026-11-11'),[]).length,0);
  const fixture = [
    {id:'done',type:'Abgabe',date:'2026-10-23'},
    {id:'cancelled',type:'Prüfung',date:'2026-10-23',isCancelled:true},
    {id:'past',type:'Prüfung',date:'2026-10-21'},
    {id:'today',type:'Prüfung',date:'2026-10-22'},
    {id:'future',type:'Termin',date:'2026-10-24'},
  ];
  assert.deepEqual(upcomingEvents(fixture,day,['done']).map(e=>e.id),['today','future']);
});

test('winter data can be filled independently and drives the calendar across the year boundary', () => {
  const winter = {...SEMESTERS[1],events:[{id:'ws26-p1',date:'2027-01-15'}],periods:[{start:'2026-12-02',end:'2027-02-04'}]};
  const selected = semesterForDate([SEMESTERS[0],winter],parseISOString('2026-12-01'));
  assert.deepEqual(calendarRange(selected.events,selected.periods,parseISOString('2026-12-01')),{min:2026*12+11,max:2027*12+1});
  assert.deepEqual(calendarRange([],[],parseISOString('2026-12-01')),{min:2026*12+11,max:2026*12+11});
  assert.equal(SEMESTERS[1].events.length,0);
});
