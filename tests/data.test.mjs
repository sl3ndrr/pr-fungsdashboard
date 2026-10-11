import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { EVENTS, PERIODS } from '../js/data.js';

test('all event IDs, dates, times, flags and periods match the unchanged main baseline', () => {
  const fingerprint = createHash('sha256').update(JSON.stringify({EVENTS,PERIODS})).digest('hex');
  assert.equal(fingerprint, '5e4ab18d17fbc1abe5ae39045fae01cb5e5d0abc8a1573027f1a1a8922e5046b');
});
