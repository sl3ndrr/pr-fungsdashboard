import test from 'node:test';
import assert from 'node:assert/strict';
import {sittingRows, sittingRowsHTML, sittingAccessibleName} from '../js/cards.js';
import {parseISOString} from '../js/utils.js';
const exam={id:'fixture',type:'Prüfung',title:'Rechenmethoden',sittings:[
  {key:'A',date:'2027-02-22',time:'10:00–12:00 Uhr'},
  {key:'B',date:'2027-04-01',time:'10:00–12:00 Uhr'},
]};
const day=parseISOString;
test('one hierarchy decision promotes B after A while keeping sitting keys stable',()=>{
  assert.deepEqual(sittingRows(exam,day('2027-02-21')).map(r=>[r.key,r.primary]),[['A',true],['B',false]]);
  assert.deepEqual(sittingRows(exam,day('2027-02-23')).map(r=>[r.key,r.primary]),[['A',false],['B',true]]);
  const before=sittingRowsHTML(exam,day('2027-02-21')),after=sittingRowsHTML(exam,day('2027-02-23'));
  for(const key of ['sitting-fixture-A','sitting-fixture-B'])assert.ok(before.includes(`data-key="${key}"`)&&after.includes(`data-key="${key}"`));
  assert.match(after,/A-Termin · 22\.02\. · vorbei/);
  assert.match(after,/class="sitting-row sitting-primary[^>]*data-key="sitting-fixture-B"/);
});
test('undated card has earliest date, no numeric countdown, and supports event override',()=>{
  const open={...exam,sittings:[]};
  const html=sittingRowsHTML(open,day('2026-11-02'),{examsFrom:'2027-02-15'});
  assert.match(html,/Termin noch offen/);assert.match(html,/Frühestens ab Mo\., 15\.02\.2027/);
  assert.doesNotMatch(html,/countdown|Tage|Tag<|NaN/);
  assert.match(sittingRowsHTML({...open,earliest:'2027-02-16'},day('2026-11-02'),{examsFrom:'2027-02-15'}),/Frühestens ab Di\., 16\.02\.2027/);
});
test('today, past, done and cancelled sitting rows have distinct countdown states',()=>{
  assert.match(sittingRowsHTML(exam,day('2027-02-22')),/today-chip[\s\S]*Heute/);
  assert.match(sittingRowsHTML(exam,day('2027-04-02')),/vor 1 Tg\./);
  for(const [item,options,status] of [[exam,{doneItems:['fixture']},'Bestanden'],[{...exam,isCancelled:true},{},'Abgebrochen']]) {
    const html=sittingRowsHTML(item,day('2027-02-21'),options);
    assert.match(html,new RegExp(status));assert.doesNotMatch(html,/countdown-number/);
    if(item.isCancelled)assert.doesNotMatch(html,/class="countdown/);
  }
});
test('single sitting shares the same structure without a letter and escapes unknown time',()=>{
  const html=sittingRowsHTML({id:'legacy',type:'Abgabe',date:'2026-12-18',time:'<Uhrzeit offen>'},day('2026-11-02'));
  assert.match(html,/sitting-primary/);assert.match(html,/&lt;Uhrzeit offen&gt;/);
  assert.doesNotMatch(html,/sitting-letter/);
});
test('accessible row name contains complete weekday, spoken time and a single countdown',()=>{
  const text=sittingAccessibleName(exam.sittings[0],'in 112 Tagen');
  assert.equal(text,'A-Termin, Montag, 22. Februar 2027, 10 bis 12 Uhr, in 112 Tagen');
  const html=sittingRowsHTML(exam,day('2026-11-02'));
  assert.match(html,/role="group" aria-label="A-Termin, Montag, 22\. Februar 2027, 10 bis 12 Uhr, in 112 Tagen"/);
  assert.match(html,/class="sitting-visual"[^>]*aria-hidden="true"/);
});
