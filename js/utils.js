import { PERIODS } from "./data.js";

/** Wiederverwendbare Datum- und Darstellungshilfen. */
export function parseISOString(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
export function calendarDayDiff(a, b) {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / 86400000);
}
export function typeClass(t) { return t === 'Prüfung' ? 'pruefung' : t === 'Abgabe' ? 'abgabe' : 'termin'; }
export function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function formatDate(d) {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
export function periodsOnDay(dayMid) {
  return PERIODS.filter(p => {
    const s = midnight(parseISOString(p.start));
    const e = midnight(parseISOString(p.end));
    return dayMid >= s && dayMid <= e;
  });
}
