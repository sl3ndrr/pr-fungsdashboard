import test from 'node:test';
import assert from 'node:assert/strict';
import {remainingDaysText} from '../js/utils.js';
test('period remainder handles plural, singular, last day and overshoot',()=>{
  assert.equal(remainingDaysText(25,33),'noch 8 Tage');
  assert.equal(remainingDaysText(32,33),'noch 1 Tag');
  assert.equal(remainingDaysText(33,33),'letzter Tag');
  assert.equal(remainingDaysText(34,33),'letzter Tag');
});

import {formatFollowupDate,parseISOString} from '../js/utils.js';
test('follow-up date includes German weekday without ISO UTC date drift',()=>{
  assert.equal(formatFollowupDate(parseISOString('2026-10-14')),'Mi., 14.10.');
  assert.equal(formatFollowupDate(parseISOString('2026-10-26')),'Mo., 26.10.');
});
