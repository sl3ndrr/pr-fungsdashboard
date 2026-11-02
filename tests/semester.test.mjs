import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENTS, PERIODS, SEMESTERS} from '../js/data.js';
import {semesterForDate, upcomingEvents, parseISOString, validateData} from '../js/utils.js';

test('summer ends after its last exam; winter starts on 11.11.2026 at local midnight', () => {
  for (const date of [new Date(2026,9,22),new Date(2026,9,26),new Date(2026,10,10,23,59,59)]) {
    assert.equal(semesterForDate(SEMESTERS,date).id,'ss-2026');
  }
  for (const date of [new Date(2026,10,11),new Date(2027,0,15)]) {
    const semester = semesterForDate(SEMESTERS,date);
    assert.equal(semester.id,'ws-2026-2027');
    assert.equal(semester.label,'Wintersemester 2026/2027');
    assert.equal(semester.events.length,10);
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

test('winter has nine exams, five undated and eight lettered occurrences plus portfolio', () => {
  const winter=SEMESTERS[1];
  const {events,periods}=validateData(winter.events,winter.periods);
  assert.equal(events.length,10);
  assert.equal(events.filter(e=>e.type==='Prüfung').length,9);
  assert.equal(events.filter(e=>e.sittings?.length===0).length,5);
  assert.equal(events.flatMap(e=>e.sittings||[]).length,8);
  assert.equal(winter.examsFrom,'2027-02-15');
  assert.equal(periods.length,0);
  assert.ok(events.every(e=>e.id.startsWith('ws26-')));
  assert.equal(events.find(e=>e.id==='ws26-asp-portfolio').time,'Uhrzeit offen');
  assert.equal(events.find(e=>e.id==='ws26-asp-portfolio').date,'2026-12-18');
  assert.equal(upcomingEvents(events,parseISOString('2026-11-11'),[]).length,9);
});
