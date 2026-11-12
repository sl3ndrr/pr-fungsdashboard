import {occurrencesOf, isEventDone, midnight, parseISOString} from './utils.js';

/** Unknown or all-day times do not imply a clock time. */
export function parseTimeRange(text) {
  const m = /^(\d{1,2}):(\d{2})(?:\s*[–-]\s*(\d{1,2}):(\d{2}))?\s*Uhr$/u.exec(text.trim());
  if (!m || +m[1] > 23 || +m[2] > 59 || (m[3] && (+m[3] > 23 || +m[4] > 59))) return null;
  const time = (h, min) => h.padStart(2, '0') + min + '00';
  return {start: time(m[1], m[2]), end: m[3] ? time(m[3], m[4]) : null};
}
export function escapeIcsText(value) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
export function foldLine(line) {
  const encoder = new TextEncoder();
  const lines = []; let current = ''; let length = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (length + size > 75) { lines.push(current); current = ' '; length = 1; }
    current += character; length += size;
  }
  lines.push(current);
  return lines.join('\r\n');
}
export function exportableOccurrences(events, today, doneItems = []) {
  const day = midnight(today);
  return occurrencesOf(events).filter(event => !event.isCancelled && !isEventDone(event, doneItems) && parseISOString(event.date) >= day);
}
export function createCalendar(events, {today, doneItems = [], clock = () => new Date()} = {}) {
  const stamp = clock().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Semester-Roadmap//DE', 'CALSCALE:GREGORIAN'];
  for (const event of exportableOccurrences(events, today, doneItems)) {
    const date = event.date.replace(/-/g, '');
    const time = parseTimeRange(event.time);
    const summary = `${event.type}: ${event.title}${event.sittingKey ? ` (${event.sittingKey}-Termin)` : ''}`;
    lines.push('BEGIN:VEVENT', `UID:${escapeIcsText(event.id)}@pr-fungsdashboard`, `DTSTAMP:${stamp}`);
    if (time) {
      lines.push(`DTSTART:${date}T${time.start}`);
      if (time.end) lines.push(`DTEND:${date}T${time.end}`);
    } else {
      const next = parseISOString(event.date); next.setDate(next.getDate() + 1);
      const end = `${String(next.getFullYear()).padStart(4,'0')}${String(next.getMonth()+1).padStart(2,'0')}${String(next.getDate()).padStart(2,'0')}`;
      lines.push(`DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${end}`);
    }
    lines.push(`SUMMARY:${escapeIcsText(summary)}`, `CATEGORIES:${escapeIcsText(event.type)}`);
    if (event.room) lines.push(`LOCATION:${escapeIcsText(event.room)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
export function filenameSlug(value) {
  return value.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'termine';
}
