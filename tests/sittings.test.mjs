import test from 'node:test';
import assert from 'node:assert/strict';
import {sittingsOf, nextSitting, isEventPast, sortDateOf, sortEvents, eventGroup, occurrencesOf, upcomingEvents, eventStatistics, validateData, parseISOString, canMarkPassed} from '../js/utils.js';
import {timelineWindow} from '../js/layout.js';
const exam = {id:'exam',type:'Prüfung',title:'Prüfung',sittings:[
  {key:'A',date:'2027-02-22',time:'10:00–12:00 Uhr'},
  {key:'B',date:'2027-04-01',time:'10:00–12:00 Uhr'},
]};
const day = parseISOString;
const open = {id:'open',type:'Prüfung',title:'Ohne Datum',sittings:[]};

test('A past and B open: card stays current, sorts and groups by B',()=>{
  const today=day('2027-02-23');
  assert.equal(nextSitting(exam,today).key,'B');
  assert.equal(isEventPast(exam,today),false);
  assert.equal(sortDateOf(exam,today),'2027-04-01');
  assert.equal(eventGroup(exam,today),'April 2027');
  assert.equal(canMarkPassed(exam,today),true);
  assert.deepEqual(upcomingEvents([exam],today).map(e=>e.id),['exam-B']);
});
test('both past: last date sorts the card and no countdown candidate remains',()=>{
  const today=day('2027-04-02');
  assert.equal(isEventPast(exam,today),true);
  assert.equal(nextSitting(exam,today),null);
  assert.equal(sortDateOf(exam,today),'2027-04-01');
  assert.equal(eventGroup(exam,today),'Vergangen');
  assert.deepEqual(upcomingEvents([exam],today),[]);
});
test('legacy single and one lettered sitting normalize without mutating data',()=>{
  const legacy={id:'legacy',type:'Termin',date:'2027-02-22',time:'Uhrzeit offen'};
  assert.deepEqual(sittingsOf(legacy),[{key:'',date:'2027-02-22',time:'Uhrzeit offen'}]);
  assert.equal(occurrencesOf([legacy])[0].id,'legacy');
  const single={...exam,sittings:[exam.sittings[0]]};
  assert.equal(occurrencesOf([single])[0].id,'exam-A');
  const reversed={...exam,sittings:[...exam.sittings].reverse()};
  assert.equal(sittingsOf(reversed)[0].key,'A');
  assert.equal(reversed.sittings[0].key,'B');
});
test('undated exams are current and stable after every dated card',()=>{
  const today=day('2027-02-23'),another={...open,id:'second'};
  assert.equal(nextSitting(open,today),null);
  assert.equal(isEventPast(open,today),false);
  assert.equal(eventGroup(open,today),'Termin noch offen');
  assert.deepEqual(sortEvents([open,exam,another],today).map(e=>e.id),['exam','open','second']);
  assert.deepEqual(occurrencesOf([open]),[]);
  assert.equal(timelineWindow([open],today),null);
});
test('today includes A, tomorrow promotes B, and B itself remains current all day',()=>{
  assert.equal(nextSitting(exam,day('2027-02-22')).key,'A');
  assert.equal(nextSitting(exam,day('2027-02-23')).key,'B');
  assert.equal(nextSitting(exam,day('2027-04-01')).key,'B');
  assert.equal(isEventPast(exam,day('2027-04-01')),false);
  assert.equal(canMarkPassed(exam,day('2027-02-22')),false);
});
test('hero/followups flatten both sittings in chronological order with card references',()=>{
  const other={id:'other',type:'Termin',date:'2027-03-01',time:'12:00 Uhr'};
  const result=upcomingEvents([exam,other,open],day('2027-02-01'));
  assert.deepEqual(result.map(e=>[e.id,e.eventId]),[['exam-A','exam'],['other','other'],['exam-B','exam']]);
  assert.equal(new Set(result.map(e=>e.id)).size,3);
});
test('passed exams and done assignments leave upcoming/timeline and seven-day count; undo stays available',()=>{
  const today=day('2027-03-31');
  assert.deepEqual(upcomingEvents([exam],today,['exam']),[]);
  assert.equal(timelineWindow([exam],today,'upcoming',['exam']),null);
  assert.equal(eventStatistics([exam],today,['exam']).next7,0);
  assert.equal(canMarkPassed(exam,day('2027-04-02'),['exam']),true);
  assert.equal(upcomingEvents([exam],today,[])[0].id,'exam-B');
});
test('statistics count each exam once, undated exams separately, and each occurrence within seven days',()=>{
  const close={...exam,sittings:[exam.sittings[0],{...exam.sittings[1],date:'2027-02-23'}]};
  const hidden={id:'boundary',type:'Termin',date:'2027-02-24',time:'offen',hideFromNext:true};
  assert.deepEqual(eventStatistics([close,open,hidden,{...close,id:'cancel',isCancelled:true},{...hidden,id:'private',calOnly:true}],day('2027-02-20')),
    {total:3,undated:1,assignments:0,assignmentsDone:0,next7:3});
});
test('invalid B-before-A, duplicate key, date, time and non-exam empty are individually skipped with warnings',()=>{
  const invalid=[
    {...exam,id:'order',sittings:[exam.sittings[0],{...exam.sittings[1],date:'2027-02-21'}]},
    {...exam,id:'duplicate',sittings:[exam.sittings[0],exam.sittings[0]]},
    {...exam,id:'date',sittings:[{key:'A',date:'2027-02-30',time:'10 Uhr'}]},
    {...exam,id:'time',sittings:[{...exam.sittings[0],time:' '}]},
    {...open,id:'empty',type:'Abgabe'},
    {...exam,id:'key',sittings:[{...exam.sittings[0],key:'C'}]},
    {...open,id:'status',isCancelled:'yes'},
    {...exam,id:'ambiguous',date:'2027-02-22',time:'10 Uhr'},
    {...open,id:'earliest',earliest:'2027-02-30'},
  ];
  const warnings=[],warn=console.warn;console.warn=text=>warnings.push(text);
  try {
    assert.deepEqual(validateData([...invalid,exam,open],[]).events,[exam,open]);
    assert.equal(warnings.length,invalid.length);
    assert.match(warnings[0],/B liegt vor A/);
  } finally {console.warn=warn;}
});
test('equal-date occurrences and equal undated groups retain source order',()=>{
  const clone={...exam,id:'clone'};
  assert.deepEqual(occurrencesOf([clone,exam]).map(e=>e.id),['clone-A','exam-A','clone-B','exam-B']);
});
test('cancelled history remains inspectable only in the semester timeline',()=>{
  const cancelled={...exam,isCancelled:true};
  assert.equal(timelineWindow([cancelled],day('2027-02-01')),null);
  assert.equal(timelineWindow([cancelled],day('2027-02-01'),'semester').events.length,2);
});
