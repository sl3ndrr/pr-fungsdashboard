import test from 'node:test';
import assert from 'node:assert/strict';
import {remainingDaysText} from '../js/utils.js';
test('period remainder handles plural, singular, last day and overshoot',()=>{
  assert.equal(remainingDaysText(25,33),'noch 8 Tage');
  assert.equal(remainingDaysText(32,33),'noch 1 Tag');
  assert.equal(remainingDaysText(33,33),'letzter Tag');
  assert.equal(remainingDaysText(34,33),'letzter Tag');
});
