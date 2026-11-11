import {midnight, parseISOString} from './utils.js';

/** The URL override is read on demand so invalid input always falls back to the clock. */
export function simulatedDay() {
  if (typeof location === 'undefined') return null;
  return parseISOString(new URLSearchParams(location.search).get('heute'));
}
export function now() {
  const day = simulatedDay();
  if (!day) return new Date();
  day.setHours(12, 0, 0, 0);
  return day;
}
export function today() { return midnight(now()); }
