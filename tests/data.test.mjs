import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { EVENTS, PERIODS } from '../js/data.js';

test('all other events and periods retain the previous baseline', () => {
  const originalEvents=EVENTS.filter(event=>event.id!=='g18').map(({hideFromNext,...event})=>event.id==='p7'?{...event,date:'2026-10-26',time:'KW 44 (26.–30.10.)'}:event);
  const fingerprint = createHash('sha256').update(JSON.stringify({EVENTS:originalEvents,PERIODS})).digest('hex');
  assert.equal(fingerprint, '5e4ab18d17fbc1abe5ae39045fae01cb5e5d0abc8a1573027f1a1a8922e5046b');
});

test('the corrected exam and Monday guitar lesson are present once with stable IDs', () => {
  assert.deepEqual(EVENTS.filter(event=>event.id==='p7'),[{id:'p7',type:'Prüfung',title:'Programmierpraktikum',date:'2026-11-10',time:'10:00 Uhr'}]);
  assert.deepEqual(EVENTS.filter(event=>event.title==='Gitarrenunterricht' && event.date==='2026-10-26'),[{id:'g18',type:'Termin',title:'Gitarrenunterricht',date:'2026-10-26',time:'13:45-15:45 Uhr',calOnly:true}]);
});
