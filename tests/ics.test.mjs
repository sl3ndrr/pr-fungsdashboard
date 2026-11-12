import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCalendar, exportableOccurrences, foldLine, parseTimeRange, escapeIcsText, filenameSlug} from '../js/ics.js';
import {parseISOString, validateData, sittingsOf} from '../js/utils.js';
import {sittingRowsHTML} from '../js/cards.js';
const event = {id:'exam', type:'Prüfung', title:'Info III', room:'Hörsaal 1, Gebäude A', sittings:[
  {key:'A', date:'2027-02-17', time:'10:00–14:00 Uhr'},
  {key:'B', date:'2027-04-07', time:'Uhrzeit offen', room:'Raum B'},
]};
const day = parseISOString('2026-11-11');
const options = {today:day, clock:() => new Date('2026-11-11T10:00:00Z')};
test('calendar matches golden file and uses balanced CRLF lines', () => {
  const actual = createCalendar([event], options);
  const expected = readFileSync(new URL('./fixtures/calendar.ics', import.meta.url), 'utf8').replace(/\r?\n/g, '\r\n');
  assert.equal(actual, expected);
  assert.doesNotMatch(actual, /(?<!\r)\n|\r(?!\n)/);
  assert.equal((actual.match(/BEGIN:VEVENT/g)||[]).length, (actual.match(/END:VEVENT/g)||[]).length);
  assert.ok(actual.split('\r\n').every(line => Buffer.byteLength(line) <= 75));
});
test('UTF-8 folding counts continuation space and keeps multibyte characters intact', () => {
  const source = 'SUMMARY:' + 'ä–ß'.repeat(40);
  const folded = foldLine(source);
  assert.ok(folded.split('\r\n').every(line => Buffer.byteLength(line) <= 75));
  assert.equal(folded.replace(/\r\n /g, ''), source);
  assert.ok(folded.includes('\r\n '));
  assert.equal(escapeIcsText('a\\b;c,d\nx'), 'a\\\\b\\;c\\,d\\nx');
});
test('time forms, unknown time and single times are represented without invented ends', () => {
  assert.deepEqual(parseTimeRange('10:00–14:00 Uhr'), {start:'100000',end:'140000'});
  assert.deepEqual(parseTimeRange('13:45-15:45 Uhr'), {start:'134500',end:'154500'});
  assert.deepEqual(parseTimeRange('12:00 Uhr'), {start:'120000',end:null});
  assert.deepEqual(parseTimeRange('23:59 Uhr'), {start:'235900',end:null});
  for (const value of ['Ganztägig','Uhrzeit offen','24:00 Uhr']) assert.equal(parseTimeRange(value), null);
  const single = createCalendar([{id:'x',type:'Termin',title:'X',date:'2026-12-31',time:'23:59 Uhr'}], options);
  assert.match(single, /DTSTART:20261231T235900/); assert.doesNotMatch(single, /DTEND/);
  const allDay = createCalendar([{id:'x',type:'Termin',title:'X',date:'2026-12-31',time:'Ganztägig'}], options);
  assert.match(allDay, /DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101/);
});
test('only dated, current, open and non-cancelled occurrences are exported', () => {
  const events = [event,{id:'open',type:'Prüfung',title:'Offen',sittings:[]},
    {id:'done',type:'Abgabe',title:'Abgabe',date:'2027-02-18',time:'12:00 Uhr'},
    {id:'cancel',type:'Termin',title:'Abbruch',date:'2027-02-18',time:'12:00 Uhr',isCancelled:true}];
  assert.deepEqual(exportableOccurrences(events,parseISOString('2027-02-18'),['done']).map(e=>e.id),['exam-B']);
  assert.equal(exportableOccurrences(events,parseISOString('2027-02-18'),['done','exam']).length,0);
  assert.equal(filenameSlug('Größe & Übung'),'groesse-uebung');
});
test('optional room is validated, inherited, overridden and escaped in accessible rows', () => {
  const warnings = []; const old = console.warn; console.warn = message => warnings.push(message);
  try {
    const invalid = [{...event,id:'bad-event',room:' '},{...event,id:'bad-sitting',sittings:[{...event.sittings[0],room:42}]}];
    assert.equal(validateData([event,...invalid],[]).events.length,1);
    assert.equal(warnings.length,2);
  } finally {console.warn=old;}
  assert.deepEqual(sittingsOf(event).map(s=>s.room),['Hörsaal 1, Gebäude A','Raum B']);
  const html = sittingRowsHTML({...event,room:'<Saal>'},day);
  assert.match(html,/Raum &lt;Saal&gt;/); assert.match(html,/Raum Raum B/);
});
