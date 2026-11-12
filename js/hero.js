import {store} from './state.js';
import {ICONS} from './data.js';
import {sittingDate, sittingAccessibleName} from './cards.js';
import {selectTimelineEvent} from './timeline.js';
import {parseISOString, calendarDayDiff, periodsOnDay, typeClass, escapeHtml, formatDate, formatFollowupDate, remainingDaysText} from './utils.js';
import {syncHTML, listenOnce, fadeChange} from './motion.js';
import {archiveSummary} from './semesters.js';

export function renderHero(upcoming, todayMid, animate) {
  const hero=document.getElementById('hero'),key=store.get().archive ? 'archive-' + store.get().semester.id : upcoming[0]?.id||'empty';
  if(hero.dataset.eventId && hero.dataset.eventId!==key && !animate)fadeChange(hero,()=>buildHero(upcoming,todayMid,animate));
  else buildHero(upcoming,todayMid,animate);
  hero.dataset.eventId=key;
}
function buildHero(upcoming, todayMid, animate) {
  const {periods, archive, events, doneItems} = store.get();
  const el = document.getElementById('hero');
  if (archive) {
    const summary = archiveSummary(events, doneItems);
    el.className = 'hero';
    syncHTML(el, `<h2 class="hero-label">Semester abgeschlossen</h2>
      <h3 class="archive-title">Dein Semesterrückblick</h3>
      <dl class="archive-summary">
        <div><dt>Prüfungen</dt><dd>${summary.exams}<span>davon ${summary.examsPassed} als bestanden markiert</span></dd></div>
        <div><dt>Abgaben erledigt</dt><dd>${summary.assignmentsDone} von ${summary.assignments}</dd></div>
        <div><dt>Abgebrochene Einträge</dt><dd>${summary.cancelled}</dd></div>
      </dl>`);
    return;
  }
  const item = upcoming[0];
  if (!item) {
    el.className = `hero `;
    syncHTML(el, `<div class="hero-label">Als Nächstes</div><div class="hero-empty">${ICONS.check}<span>Keine datierten Termine offen</span></div>`);
    return;
  }
  const d = parseISOString(item.date);
  const diffDays = calendarDayDiff(d, todayMid);
  el.className = `hero ${diffDays <= 7 ? 'urgent' : ''} ${diffDays <= 3 ? 'imminent' : ''} `;
  const count = diffDays === 0 ? 'Heute' : diffDays;
  const activePeriods = periodsOnDay(todayMid, periods);
  const otherSitting = item.sittings?.find(sitting => sitting.key !== item.sittingKey);
  syncHTML(el, `
    <h2 class="hero-label">Als Nächstes</h2>
    <div class="hero-main">
      <div class="hero-countdown"><span class="hero-number ${diffDays === 0 ? 'word' : ''}">${count}</span>${diffDays > 0 ? `<span class="hero-unit">${diffDays === 1 ? 'Tag' : 'Tage'}</span>` : ''}<span class="hero-weekday">${escapeHtml(d.toLocaleDateString('de-DE', {weekday:'long'}))}</span></div>
      <div class="hero-text">
        <span class="badge ${typeClass(item.type)}">${ICONS[item.type]}${escapeHtml(item.type)}${item.sittingKey ? ' · ' + item.sittingKey + '-Termin' : ''}</span>
        <h3 class="hero-title">${escapeHtml(item.title)}</h3>
        <div class="hero-meta"><span>${ICONS.calendar}${d ? escapeHtml(formatDate(d)) : 'Termin noch offen'}</span><span>${ICONS.clock}${escapeHtml(item.time)}</span></div>
      </div>
    </div>
    ${otherSitting ? `<div class="hero-other" data-key="hero-other-${item.id}">${otherSitting.key}-Termin · ${sittingDate(parseISOString(otherSitting.date))} · ${parseISOString(otherSitting.date) < todayMid ? 'vorbei' : 'in ' + calendarDayDiff(parseISOString(otherSitting.date), todayMid) + ' Tagen'}</div>` : ''}
    ${upcoming.length > 1 ? `<div class="hero-after"><h3 class="hero-label">Danach</h3>${upcoming.slice(1, 3).map(e => {
      const days = calendarDayDiff(parseISOString(e.date), todayMid);
      return `<button class="hero-next" type="button" data-key="next-${escapeHtml(e.id)}" data-event-id="${escapeHtml(e.eventId || e.id)}" data-occurrence-id="${escapeHtml(e.id)}" aria-label="${escapeHtml(e.title + ", " + sittingAccessibleName({key:e.sittingKey || '',date:e.date,time:e.time}, days === 0 ? 'Heute' : `in ${days} Tagen`))}">
        <span class="type-icon ${typeClass(e.type)}" data-key="next-icon-${escapeHtml(e.id)}" aria-hidden="true">${e.sittingKey ? `<span class="sitting-letter" data-key="next-letter-${escapeHtml(e.id)}" aria-label="${e.sittingKey}-Termin">${e.sittingKey}</span>` : ICONS[e.type]}</span>
        <span class="hero-next-info"><span class="hero-next-title">${escapeHtml(e.title)}</span><span class="hero-next-date">${escapeHtml(formatFollowupDate(parseISOString(e.date)))}</span></span>
        <span class="hero-next-days">${days === 0 ? 'Heute' : days === 1 ? 'Morgen' : `in ${days} Tagen`}</span>
      </button>`;
    }).join('')}</div>` : ''}
    ${activePeriods.map(p => {
      const day = calendarDayDiff(todayMid, parseISOString(p.start)) + 1;
      const total = calendarDayDiff(parseISOString(p.end), parseISOString(p.start)) + 1;
      const progressText = `Tag ${day} von ${total}, ${remainingDaysText(day, total)}`;
      return `<div class="hero-period" style="--period-rgb:${p.rgb}"><span>${escapeHtml(p.label)} · ${progressText}</span><div class="mini-progress" role="progressbar" aria-label="${escapeHtml(p.label)}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${day}" aria-valuetext="${escapeHtml(progressText)}"><span style="clip-path:inset(0 ${100 - day / total * 100}% 0 0)"></span><i class="progress-marker" aria-hidden="true"></i></div></div>`;
    }).join('')}
  `);
  el.querySelectorAll('.hero-next').forEach(button => {
    listenOnce(button, 'click', () => selectTimelineEvent(null, button.dataset.eventId));
  });
}
