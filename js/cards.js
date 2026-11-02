import {ICONS} from './icons.js';
import {calendarDayDiff, escapeHtml, isEventDone, nextSitting, parseISOString, sittingsOf} from './utils.js';

export function sittingDate(date, full = false) {
  return date.toLocaleDateString('de-DE', {weekday:full?'long':'short',day:'2-digit',month:full?'long':'2-digit',year:'numeric'});
}
/** The only hierarchy decision: the next open sitting gets the large row, even B. */
export function sittingRows(event, today, doneItems = []) {
  const next = nextSitting(event, today, doneItems);
  return sittingsOf(event).map(sitting => ({...sitting,
    primary: !!next && next.key === sitting.key,
    days: calendarDayDiff(parseISOString(sitting.date), today),
  }));
}
export function sittingAccessibleName(sitting, state) {
  const time = sitting.time.replace(/(\d{1,2}):00/g, '$1').replace('–', ' bis ');
  return `${sitting.key ? sitting.key + '-Termin' : 'Termin'}, ${sittingDate(parseISOString(sitting.date), true)}, ${time}, ${state}`;
}
export function sittingRowsHTML(event, today, {doneItems = [], examsFrom} = {}) {
  const done = isEventDone(event, doneItems);
  const rows = sittingRows(event, today, doneItems);
  if (!rows.length) {
    const earliest = event.earliest || examsFrom;
    const key = `sitting-${escapeHtml(event.id)}-open`;
    return `<div class="sitting-row sitting-open" data-key="${key}" role="group" aria-label="${escapeHtml('Termin noch offen' + (earliest ? ', frühestens ab ' + sittingDate(parseISOString(earliest), true) : ''))}">
      <span data-key="${key}-icon" aria-hidden="true">${ICONS.calendar}</span><div data-key="${key}-text" aria-hidden="true"><strong data-key="${key}-title">Termin noch offen</strong>${earliest ? `<span data-key="${key}-earliest">Frühestens ab ${sittingDate(parseISOString(earliest))}</span>` : ''}</div></div>`;
  }
  return rows.map(sitting => {
    const {days, primary} = sitting;
    const key = `sitting-${escapeHtml(event.id)}-${sitting.key || 'single'}`;
    const compact = days < 0 && rows.some(row => row.primary);
    const status = event.isCancelled ? 'Abgebrochen' : done ? event.type === 'Prüfung' ? 'Bestanden' : 'Erledigt'
      : days < 0 ? `vor ${Math.abs(days)} Tagen, vorbei` : days === 0 ? 'Heute' : `in ${days} Tagen`;
    const state = event.isCancelled ? 'cancelled' : done ? 'done' : days < 0 ? 'expired' : days === 0 ? 'today-chip' : '';
    const countdown = event.isCancelled ? '' : done ? `<span class="primary" data-key="${key}-status">${ICONS.check}${event.type === 'Prüfung' ? 'Bestanden' : 'Erledigt'}</span>`
      : days < 0 ? `<span class="secondary" data-key="${key}-status">vor ${Math.abs(days)} Tg.</span>`
      : days === 0 ? `<span class="primary" data-key="${key}-today">Heute</span>`
      : `<span class="primary countdown-number" data-key="${key}-number">${days}</span><span class="countdown-unit" data-key="${key}-unit">${days === 1 ? 'Tag' : 'Tage'}</span>`;
    return `<div class="sitting-row ${primary ? 'sitting-primary' : 'sitting-secondary'} ${compact ? 'sitting-past-compact' : ''} ${state} ${!done && !event.isCancelled && days >= 0 && days <= 7 ? 'urgent' : ''} ${!done && !event.isCancelled && days >= 0 && days <= 3 ? 'imminent' : ''}" data-key="${key}" data-emphasis="${primary ? 'primary' : 'secondary'}" role="group" aria-label="${escapeHtml(sittingAccessibleName(sitting, status))}">
      <div class="sitting-visual" data-key="${key}-visual" aria-hidden="true">
        ${sitting.key ? `<span class="sitting-letter" data-key="${key}-letter" aria-label="${sitting.key}-Termin">${sitting.key}</span>` : `<span class="sitting-icon" data-key="${key}-icon">${ICONS.calendar}</span>`}
        <div class="sitting-info" data-key="${key}-info">${compact
          ? `<span data-key="${key}-date">${sitting.key}-Termin · ${parseISOString(sitting.date).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})} · vorbei</span>`
          : `<span class="sitting-date" data-key="${key}-date">${sittingDate(parseISOString(sitting.date))}</span><span class="sitting-time" data-key="${key}-time">${escapeHtml(sitting.time)}</span>`}</div>
        ${countdown && !compact ? `<div class="countdown ${state} ${done ? 'done-badge' : ''}" data-key="${key}-countdown">${countdown}</div>` : ''}
      </div></div>`;
  }).join('');
}
