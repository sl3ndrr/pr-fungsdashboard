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
    else if (event.short !== undefined && !present(event.short)) reason = 'Kurzname ungültig';
    else if (event.earliest !== undefined && !parseISOString(event.earliest)) reason = 'Frühestes Datum ungültig';
    else if ('sittings' in event) {
      if (!Array.isArray(event.sittings)) reason = 'Termine müssen ein Array sein';
      else if ('date' in event || 'time' in event) reason = 'date/time und sittings schließen sich aus';
      else if (!event.sittings.length && event.type !== 'Prüfung') reason = 'Leere Termine nur bei Prüfung';
      else {
        const keys = new Set();
        for (const sitting of event.sittings) {
          if (!sitting || !['A', 'B'].includes(sitting.key)) { reason = 'Terminschlüssel ungültig'; break; }
          if (keys.has(sitting.key)) { reason = 'Terminschlüssel doppelt'; break; }
          if (!parseISOString(sitting.date) || !present(sitting.time)) { reason = 'Termindatum oder Zeit ungültig'; break; }
          keys.add(sitting.key);
        }
        const a = event.sittings.find(sitting => sitting?.key === 'A');
        const b = event.sittings.find(sitting => sitting?.key === 'B');
        if (!reason && a && b && b.date < a.date) reason = 'B liegt vor A';
      }
    } else if (!present(event.time)) reason = 'Zeitangabe fehlt';
    else if (!parseISOString(event.date)) reason = 'Datum ungültig';
    if (!reason && event && (!boolean(event.isCancelled) || !boolean(event.calOnly) || !boolean(event.isDone) || !boolean(event.hideFromNext)))
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

/** Inclusive period progress: the final day never produces a negative remainder. */
export function remainingDaysText(day, total) {
  const remaining = Math.max(0, total - day);
  return remaining === 0 ? 'letzter Tag' : `noch ${remaining} ${remaining === 1 ? 'Tag' : 'Tage'}`;
}

const followupDateFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short', day: '2-digit', month: '2-digit',
});
export function formatFollowupDate(date) {
  return followupDateFormatter.format(date);
}

/** Am lokalen Tagesbeginn umschalten, auch wenn das Dashboard geöffnet bleibt. */
export function semesterForDate(semesters, date) {
  return semesters.reduce((active, semester) => {
    const start = parseISOString(semester.activeFrom);
    return start && start <= midnight(date) && (!active.activeFrom || start > parseISOString(active.activeFrom))
      ? semester : active;
  }, semesters[0]);
}

/** Legacy date/time remains a single unlettered sitting; input is never mutated. */
export function sittingsOf(event) {
  if (event.eventId) return [{ key: event.sittingKey || '', date: event.date, time: event.time }];
  return Array.isArray(event.sittings)
    ? [...event.sittings].sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key))
    : event.date ? [{ key: '', date: event.date, time: event.time }] : [];
}
export function isEventDone(event, doneItems = []) {
  return ['Abgabe', 'Prüfung'].includes(event.type) && doneItems.includes(event.eventId || event.id);
}
export function nextSitting(event, today, doneItems = []) {
  if (event.isCancelled || isEventDone(event, doneItems)) return null;
  return sittingsOf(event).find(sitting => parseISOString(sitting.date) >= today) || null;
}
export function sortDateOf(event, today, doneItems = []) {
  return nextSitting(event, today, doneItems)?.date || sittingsOf(event).at(-1)?.date || null;
}
export function isEventPast(event, today) {
  const last = sittingsOf(event).at(-1);
  return !!last && parseISOString(last.date) < today;
}
export function sortEvents(events, today, doneItems = []) {
  return [...events].sort((a, b) => {
    const left = sortDateOf(a, today, doneItems), right = sortDateOf(b, today, doneItems);
    return left && right ? left.localeCompare(right) : left ? -1 : right ? 1 : 0;
  });
}
export function eventGroup(event, today, doneItems = []) {
  const date = sortDateOf(event, today, doneItems);
  if (!date) return 'Termin noch offen';
  if (isEventPast(event, today)) return 'Vergangen';
  return parseISOString(date).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}
/** Stable occurrence IDs address the sitting; eventId always addresses its card. */
export function occurrencesOf(events) {
  return events.filter(event => !event.calOnly).flatMap(event => event.eventId ? [event] : sittingsOf(event).map(sitting => ({
    ...event, ...sitting, id: sitting.key ? `${event.id}-${sitting.key}` : event.id,
    eventId: event.id, sittingKey: sitting.key,
  }))).sort((a, b) => a.date.localeCompare(b.date));
}
export function upcomingEvents(events, todayMid, doneItems = []) {
  return occurrencesOf(events).filter(event => !event.hideFromNext && !event.isCancelled &&
    !isEventDone(event, doneItems) && parseISOString(event.date) >= todayMid);
}
export function eventStatistics(events, today, doneItems = []) {
  const main = events.filter(event => !event.calOnly && !event.isCancelled);
  const assignments = main.filter(event => event.type === 'Abgabe');
  const next7 = occurrencesOf(main).filter(event => !isEventDone(event, doneItems) &&
    calendarDayDiff(parseISOString(event.date), today) >= 0 && calendarDayDiff(parseISOString(event.date), today) <= 7).length;
  return { total: main.length, undated: main.filter(event => event.type === 'Prüfung' && !isEventDone(event, doneItems) && !sittingsOf(event).length).length,
    assignments: assignments.length, assignmentsDone: assignments.filter(event => isEventDone(event, doneItems)).length, next7 };
}
/** Undo stays available after marking an exam passed, including after B. */
export function canMarkPassed(event, today, doneItems = []) {
  if (event.type !== 'Prüfung' || event.isCancelled) return false;
  const a = sittingsOf(event).find(sitting => sitting.key === 'A');
  const b = sittingsOf(event).find(sitting => sitting.key === 'B');
  return !!a && !!b && parseISOString(a.date) < today &&
    (parseISOString(b.date) >= today || isEventDone(event, doneItems));
}
