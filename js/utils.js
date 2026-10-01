/** Wiederverwendbare Datum- und Darstellungshilfen. */
export function parseISOString(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(0);
  date.setFullYear(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
    ? date : null;
}
export function midnight(d) {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return day;
}
export function calendarDayDiff(a, b) {
  const utcDay = date => {
    const utc = new Date(0);
    utc.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    utc.setUTCHours(0, 0, 0, 0);
    return utc.getTime();
  };
  const utcA = utcDay(a);
  const utcB = utcDay(b);
  return Math.round((utcA - utcB) / 86400000);
}
export function typeClass(t) {
  return t === 'Prüfung' ? 'pruefung' : t === 'Abgabe' ? 'abgabe' : t === 'Termin' ? 'termin' : '';
}
export function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function formatDate(d) {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
export function periodsOnDay(dayMid, periods) {
  return periods.filter(p => {
    const s = midnight(parseISOString(p.start));
    const e = midnight(parseISOString(p.end));
    return dayMid >= s && dayMid <= e;
  });
}

/** Ungültige Einträge einzeln auslassen; nur geprüfte Werte erreichen das Rendering. */
export function validateData(rawEvents, rawPeriods) {
  const events = [];
  const periods = [];
  const ids = new Set();
  const present = value => typeof value === 'string' && value.trim().length > 0;
  const boolean = value => value === undefined || typeof value === 'boolean';
  const report = (kind, index, reason) =>
    console.warn(`Semester-Roadmap: ${kind}[${index}] übersprungen: ${reason}`);

  if (!Array.isArray(rawEvents)) {
    console.warn('Semester-Roadmap: EVENTS muss ein Array sein.');
  } else rawEvents.forEach((event, index) => {
    let reason;
    if (!event || typeof event !== 'object' || Array.isArray(event)) reason = 'kein Objekt';
    else if (!present(event.id)) reason = 'ID fehlt';
    else if (ids.has(event.id)) reason = 'ID doppelt';
    else if (!['Prüfung', 'Abgabe', 'Termin'].includes(event.type)) reason = 'Typ unbekannt';
    else if (!present(event.title)) reason = 'Titel fehlt';
    else if (!present(event.time)) reason = 'Zeitangabe fehlt';
    else if (!parseISOString(event.date)) reason = 'Datum ungültig';
    else if (!boolean(event.isCancelled) || !boolean(event.calOnly) || !boolean(event.isDone))
      reason = 'Statusfeld muss Boolean sein';

    if (reason) report('EVENTS', index, reason);
    else {
      ids.add(event.id);
      events.push(event);
    }
  });

  if (!Array.isArray(rawPeriods)) {
    console.warn('Semester-Roadmap: PERIODS muss ein Array sein.');
  } else rawPeriods.forEach((period, index) => {
    let reason;
    let rgb;
    if (!period || typeof period !== 'object' || Array.isArray(period)) reason = 'kein Objekt';
    else if (!present(period.id)) reason = 'ID fehlt';
    else if (ids.has(period.id)) reason = 'ID doppelt';
    else if (!present(period.label)) reason = 'Bezeichnung fehlt';
    else if (!parseISOString(period.start) || !parseISOString(period.end)) reason = 'Zeitraumdatum ungültig';
    else if (parseISOString(period.start) > parseISOString(period.end)) reason = 'Ende vor Beginn';
    else {
      const match = typeof period.rgb === 'string' &&
        /^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/.exec(period.rgb);
      if (!match || match.slice(1).some(channel => Number(channel) > 255))
        reason = 'RGB-Farbe ungültig';
      else rgb = match.slice(1).map(Number).join(', ');
    }

    if (reason) report('PERIODS', index, reason);
    else {
      ids.add(period.id);
      periods.push({ ...period, rgb });
    }
  });

  return { events, periods };
}


/** Optional cancellation text; absent/invalid values keep the neutral status. */
export function cancelledStatus(event) {
  return typeof event.cancelReason === 'string' && event.cancelReason.trim()
    ? event.cancelReason.trim() : 'Abgebrochen';
}
