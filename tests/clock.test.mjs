import test from 'node:test';
import assert from 'node:assert/strict';
import {now,today,simulatedDay} from '../js/clock.js';
import {SEMESTERS} from '../js/data.js';
import {semesterForDate} from '../js/utils.js';

test('URL dates are validated and simulated at local noon', () => {
  for (const value of ['2027-02-30','nonsense','2027-3-28','']) {
    globalThis.location = {search: `?heute=${value}`};
    assert.equal(simulatedDay(),null);
  }
  globalThis.location = {search:'?heute=2027-03-28'};
  assert.equal(now().getHours(),12);
  assert.equal(today().getHours(),0);
  assert.equal(today().getDate(),28);
  delete globalThis.location;
});
test('simulated date selects the semester at the boundary', () => {
  for (const [date,id] of [['2026-11-10','ss-2026'],['2026-11-11','ws-2026-2027']]) {
    globalThis.location = {search:`?heute=${date}`};
    assert.equal(semesterForDate(SEMESTERS,now()).id,id);
  }
  delete globalThis.location;
});
