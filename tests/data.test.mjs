import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS, PERIODS } from '../js/data.js';
import { parseISOString, validateData } from '../js/utils.js';

test('schedule entries remain valid with unique IDs', () => {
  const { events, periods } = validateData(EVENTS, PERIODS);
  assert.equal(events.length, EVENTS.length);
  assert.equal(periods.length, PERIODS.length);
  assert.equal(new Set([...events, ...periods].map(entry => entry.id)).size, events.length + periods.length);
});

test('Programmierpraktikum exam is on 10 November at 10:00', () => {
  const exam = EVENTS.find(event => event.id === 'p7');
  assert.equal(exam.title, 'Programmierpraktikum');
  assert.equal(exam.type, 'Prüfung');
  assert.equal(exam.date, '2026-11-10');
  assert.equal(exam.time, '10:00 Uhr');
  assert.ok(!exam.calOnly && !exam.isCancelled);
});

test('26 October has the usual Monday guitar lesson, only in the calendar', () => {
  const lessons = EVENTS.filter(event => event.title === 'Gitarrenunterricht' && event.date === '2026-10-26');
  assert.equal(lessons.length, 1);
  assert.equal(parseISOString(lessons[0].date).getDay(), 1);
  assert.equal(lessons[0].time, '13:45-15:45 Uhr');
  assert.equal(lessons[0].calOnly, true);
  assert.equal(EVENTS.find(event => event.id === 'g17').date, '2026-10-27');
});
