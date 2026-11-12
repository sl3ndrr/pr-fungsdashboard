import {store} from './state.js';
import {today} from './clock.js';
import {sittingDate} from './cards.js';
import {tooltipPosition, timelineWindow, timelinePosition, timelineEventLayout, timelineLabelLayout} from './layout.js';
import {updateFilterIndicator} from './ui.js';
import {isEventPast, parseISOString, calendarDayDiff, upcomingEvents, cancelledStatus, isEventDone, formatDate, escapeHtml, typeClass, occurrencesOf} from './utils.js';
import {reducedMotion, motion, syncHTML, listenOnce} from './motion.js';

// Datumsgeometrie für die Monatsmarken im Zeitstrahl.
const dateInMonth = (year, month, day) => {
  const date = new Date(0);
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
};
let highlightTimer;
export async function selectTimelineEvent(dot,id) {
  const {events, showPast, typeFilter} = store.get();
  const item=events.find(e=>e.id===id);
  if(item && ((!showPast && isEventPast(item,today())) || (typeFilter!=='all' && typeFilter!==item.type))) {
    await store.update({showPast:isEventPast(item,today()) ? true : showPast, typeFilter:typeFilter!=='all' && typeFilter!==item.type ? 'all' : typeFilter}, {type:'filter'});
    dot=[...document.querySelectorAll('.timeline-dot')].find(button=>button.dataset.eventId===id);
  }
  const card=document.getElementById(`card-${id}`);
  if(dot && !reducedMotion.matches) {
    const ring=document.createElement('span');ring.className='ping-ring motion-decoration';ring.setAttribute('aria-hidden','true');dot.append(ring);
    motion(ring,[{scale:'1'},{scale:'2.2'}],{speed:'fast'});
    motion(ring,[{opacity:.4},{opacity:0}],{kind:'effects',speed:'slow'})?.finished.catch(()=>{}).finally(()=>ring.remove());
  }
  if(card) {
    card.focus({preventScroll:true});
    card.scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth',block:'center'});
    clearTimeout(highlightTimer);
    highlightTimer=setTimeout(()=>{
      if(!card.isConnected)return;
      const wash=document.createElement('span');wash.className='card-wash motion-decoration';wash.setAttribute('aria-hidden','true');card.append(wash);
      motion(card,[{scale:'1'},{scale:'1.025',offset:.35},{scale:'1'}]);
      motion(wash,[{opacity:0},{opacity:.16,offset:.3},{opacity:0}],{kind:'effects',speed:'slow'})?.finished.catch(()=>{}).finally(()=>wash.remove());
    },reducedMotion.matches?0:350);
  }
}

document.addEventListener('click', event => {
  if (!event.target.closest('.timeline-dot, #timeline-tooltip')) closeTimelineTooltip();
});

let measurementContext;
export function buildTimeline(todayMid) {
  const {events, periods, semester, timelineMode, doneItems} = store.get();
  const domain = timelineWindow(events, todayMid, timelineMode, doneItems);
  if (!domain) return { html: '<p class="timeline-empty">Noch keine Termine für dieses Semester</p>', dotEvents: [] };
  const { events: visible, origin, todayDay, minDay, maxDay, axisStart, axisEnd } = domain;
  const width = Math.max(44, document.getElementById('timeline-container').clientWidth);
  const pos = date => timelinePosition(calendarDayDiff(date, origin), minDay, maxDay, width);
  measurementContext ||= document.createElement('canvas').getContext('2d');
  const context = measurementContext;
  const font = getComputedStyle(document.getElementById('timeline-container'));
  context.font = `800 ${font.fontSize} ${font.fontFamily}`;
  const measure = text => Math.ceil(context.measureText(text).width) + 4;
  const shortDate = event => parseISOString(event.date).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' });
  const shortName = event => `${event.short || event.title}${event.sittingKey ? ' ' + event.sittingKey : ''}`;
  const layout = timelineEventLayout(visible.map(event => ({ x: pos(parseISOString(event.date)), variants: [
    { title: shortName(event), date: shortDate(event), width: Math.max(measure(shortName(event)), measure(shortDate(event))) },
    { title: '', date: shortDate(event), width: measure(shortDate(event)) },
  ] })), width, 4);
  const above = Math.max(1, ...layout.map(item => -item.lane));
  const below = Math.max(0, ...layout.map(item => item.lane));
  const axisY = 24 + above * 44;
  const next = upcomingEvents(visible, todayMid, doneItems)[0];
  const bandTop = axisY + 8;
  const bands = periods.map(period => {
    const start = calendarDayDiff(parseISOString(period.start), origin), end = calendarDayDiff(parseISOString(period.end), origin);
    if (end < minDay || start > maxDay) return null;
    const left = timelinePosition(Math.max(minDay, start), minDay, maxDay, width);
    const right = timelinePosition(Math.min(maxDay, end), minDay, maxDay, width);
    return { period, left, right, anchor: (left + right) / 2, width: Math.max(right - left, measure(period.label)) };
  }).filter(Boolean);
  const bandLayout = timelineLabelLayout(bands, 0, width, 8);
  const hasOutsideLabel = bands.some(band => measure(band.period.label) > band.right - band.left);
  const bandPitch = hasOutsideLabel ? 48 : 26;
  const periodsHtml = bands.map((band, i) => {
    const placed = bandLayout.labels[i], top = bandTop + placed.row * bandPitch;
    const inside = measure(band.period.label) <= band.right - band.left;
    // Short bands retain their full span; their label occupies its own adjacent row.
    return `<div class="timeline-period-span" data-key="period-${band.period.id}" role="img" aria-label="${escapeHtml(band.period.label)}, ${formatDate(parseISOString(band.period.start))} bis ${formatDate(parseISOString(band.period.end))}" style="left:${band.left}px;width:${Math.max(1, band.right - band.left)}px;top:${top}px;--period-rgb:${band.period.rgb}"></div>
      <span class="timeline-period-label" data-key="period-label-${band.period.id}" style="left:${placed.center}px;top:${inside ? top : top + 22}px">${escapeHtml(band.period.label)}</span>`;
  }).join('');
  // Reserve band/label space before lower event lanes, even for overlapping periods.
  const bandBottom = bandTop + bandLayout.rows * bandPitch;
  const lowerShift = Math.max(0, bandBottom - (axisY + 36));
  let dots = visible.map((event, i) => {
    const item = layout[i], x = pos(parseISOString(event.date));
    const top = item.lane < 0 ? axisY - 44 * -item.lane : axisY + 36 + 44 * (item.lane - 1) + lowerShift;
    const pointY = top + 12;
    const status = event.isCancelled ? `Abgebrochen${cancelledStatus(event) === 'Abgebrochen' ? '' : ': ' + cancelledStatus(event)}`
      : isEventDone(event, doneItems) ? 'Erledigt' : parseISOString(event.date) < todayMid ? 'Vergangen' : 'Offen';
    const description = `${event.type}${event.sittingKey ? ' · ' + event.sittingKey + '-Termin' : ''}: ${event.title}, ${formatDate(parseISOString(event.date))}, ${event.time}${event.room ? ', Raum ' + event.room : ''}, ${status}`;
    return `<span class="timeline-stem" data-key="stem-${escapeHtml(event.id)}" aria-hidden="true" style="left:${x}px;top:${Math.min(axisY, pointY)}px;height:${Math.abs(axisY - pointY)}px"></span>
      <button id="timeline-event-${escapeHtml(event.id)}" type="button" class="timeline-dot ${typeClass(event.type)} ${event.isCancelled ? 'cancelled' : ''} ${parseISOString(event.date) < todayMid ? 'past' : ''} ${next?.id === event.id ? 'next' : ''} ${event.sittingKey === 'B' ? 'sitting-b' : ''}"
        style="left:${item.left}px;top:${top}px;width:${item.width}px;--point-x:${x - item.left}px" data-event-id="${escapeHtml(event.eventId)}" data-occurrence-id="${escapeHtml(event.id)}" data-date="${event.date}" aria-label="${escapeHtml(description)}">
        <span class="timeline-point" aria-hidden="true"></span><span class="timeline-event-label">${item.title ? `<strong>${escapeHtml(item.title)}</strong>` : ''}<span>${escapeHtml(item.date)}</span></span>
      </button>`;
  }).join('');
  const monthTop = Math.max(axisY + 30, bandBottom, below ? axisY + 36 + below * 44 + lowerShift : 0) + 4;
  const start = new Date(origin); start.setDate(start.getDate() + minDay);
  let cursor = dateInMonth(start.getFullYear(), start.getMonth(), 1);
  const marks = [];
  let previousYear;
  while (calendarDayDiff(cursor, origin) <= maxDay && marks.length < 120) {
    const day = calendarDayDiff(cursor, origin);
    if (day >= minDay || !marks.length) {
      const title = cursor.toLocaleDateString('de-DE', {month:'short'}).replace(/\.$/, '') + (previousYear !== cursor.getFullYear() ? ` ${cursor.getFullYear()}` : '');
      marks.push({ anchor: Math.max(22, pos(cursor)), width: measure(title), title,
        priority: previousYear !== undefined && previousYear !== cursor.getFullYear() ? 2 : !marks.length ? 1 : 0,
        tick: day >= minDay ? pos(cursor) : null });
      previousYear = cursor.getFullYear();
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const monthLayout = timelineLabelLayout(marks, 0, width, 8, {singleRow:true});
  const months = marks.map((mark, i) => `${mark.tick === null ? '' : `<span class="timeline-month-tick" aria-hidden="true" style="left:${mark.tick}px"></span>`}${monthLayout.labels[i].visible ? `<span class="timeline-month" style="left:${monthLayout.labels[i].center}px;top:${monthTop}px">${escapeHtml(mark.title)}</span>` : ''}`).join('');
  const todayX = Math.max(22, Math.min(width - 22, timelinePosition(todayDay, minDay, maxDay, width)));
  const pillX = Math.max(28, Math.min(width - 28, todayX));
  const height = monthTop + Math.max(1, monthLayout.rows) * 20;
  const examStart = parseISOString(semester.examsFrom);
  const phaseLabel = examStart ? `Prüfungsphase ab ${examStart.toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit'})} · Ende offen` : '';
  const phaseStart = examStart ? Math.max(0, pos(examStart)) : 0;
  const phaseLabelLeft = Math.max(0, Math.min(phaseStart, width - measure(phaseLabel)));
  const examBand = examStart && calendarDayDiff(examStart, origin) <= maxDay
    ? `<div class="timeline-exam-phase" data-key="exam-phase-${semester.id}" role="img" aria-label="Prüfungsphase frühestens ab ${sittingDate(examStart)}, Ende offen" style="--phase-start:${phaseStart}px;--phase-label-left:${phaseLabelLeft}px;--phase-leader-width:${phaseStart - phaseLabelLeft}px"><span data-key="exam-phase-label-${semester.id}">${escapeHtml(phaseLabel)}</span></div>` : '';
  return { html: `<div class="timeline-track" data-axis-start="${axisStart}" data-axis-end="${axisEnd}" style="height:${height}px;--axis-y:${axisY}px">
    <div class="timeline-progress" style="top:${axisY}px;width:${Math.max(0,todayX - 22)}px"></div>
    <div class="timeline-today" style="left:${todayX}px;height:${axisY + 6}px" aria-hidden="true"></div>
    <span class="timeline-today-label" style="left:${pillX}px">Heute</span>${periodsHtml}${months}${dots}</div>${examBand}`, dotEvents: visible };
}

const timelineTooltip = document.getElementById('timeline-tooltip');
let tooltipAnchor = null;
let tooltipLeaveTimer;
function positionTimelineTooltip() {
  if (!tooltipAnchor?.isConnected || timelineTooltip.dataset.open !== 'true') return;
  const rect = tooltipAnchor.getBoundingClientRect();
  const track = tooltipAnchor.closest('.timeline-track');
  const labels = [...track.querySelectorAll('.timeline-period-label,.timeline-event-label,.timeline-month,.timeline-today-label')].map(el => el.getBoundingClientRect());
  const labelRects = labels;
  const bounds = { left: rect.left, width: rect.width,
    top: Math.min(rect.top, ...labelRects.map(r => r.top)),
    bottom: Math.max(rect.bottom, ...labelRects.map(r => r.bottom)) };
  const position = tooltipPosition(bounds, { width: timelineTooltip.offsetWidth, height: timelineTooltip.offsetHeight },
    { width: window.innerWidth, height: window.innerHeight });
  timelineTooltip.style.left = `${position.left}px`;
  timelineTooltip.style.top = `${position.top}px`;
  timelineTooltip.style.transformOrigin = `${rect.left + rect.width / 2 - position.left}px ${position.placement === 'above' ? 'bottom' : 'top'}`;
}
export function closeTimelineTooltip() {
  clearTimeout(tooltipLeaveTimer);
  tooltipAnchor?.removeAttribute('aria-describedby');
  timelineTooltip.dataset.open = 'false';
  timelineTooltip.setAttribute('aria-hidden', 'true');
  tooltipAnchor = null;
}
function showTimelineTooltip(dot) {
  const {events, doneItems} = store.get();
  const item = occurrencesOf(events).find(event => event.id === dot.dataset.occurrenceId);
  if (!item) return;
  closeTimelineTooltip();
  tooltipAnchor = dot;
  const status = item.isCancelled ? `Abgebrochen${cancelledStatus(item) === 'Abgebrochen' ? '' : ': ' + cancelledStatus(item)}`
    : isEventDone(item, doneItems) ? 'Erledigt' : parseISOString(item.date) < today() ? 'Vergangen' : 'Offen';
  syncHTML(timelineTooltip, `<strong>${escapeHtml(item.title)}${item.sittingKey ? ' · ' + item.sittingKey + '-Termin' : ''}</strong><span>${escapeHtml(formatDate(parseISOString(item.date)))} · ${escapeHtml(item.time + (item.room ? ' · Raum ' + item.room : ''))}</span><span>${escapeHtml(status)}</span>`);
  dot.setAttribute('aria-describedby', 'timeline-tooltip');
  timelineTooltip.dataset.open = 'true';
  timelineTooltip.setAttribute('aria-hidden', 'false');
  positionTimelineTooltip();
}
function leaveTimelineTooltip() {
  if (tooltipAnchor && document.activeElement !== tooltipAnchor) closeTimelineTooltip();
}
timelineTooltip.addEventListener('pointerenter', () => clearTimeout(tooltipLeaveTimer));
timelineTooltip.addEventListener('pointerleave', leaveTimelineTooltip);
window.addEventListener('scroll', closeTimelineTooltip, true);
window.addEventListener('resize', positionTimelineTooltip);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && tooltipAnchor) {
    event.preventDefault();
    closeTimelineTooltip();
  }
});

export function renderTimeline(tl) {
  const timelineContainer = document.getElementById('timeline-container');
  syncHTML(timelineContainer,tl.html);
  timelineContainer.querySelectorAll('.timeline-dot').forEach(dot => {
    listenOnce(dot, 'click', () => {
      closeTimelineTooltip();
      selectTimelineEvent(dot, dot.dataset.eventId);
    });
    listenOnce(dot, 'blur', () => { if (tooltipAnchor === dot) closeTimelineTooltip(); });
    listenOnce(dot, 'pointerenter', () => { if (matchMedia('(hover: hover)').matches) { clearTimeout(tooltipLeaveTimer); showTimelineTooltip(dot); } });
    listenOnce(dot, 'focus', () => { if (matchMedia('(hover: hover)').matches) showTimelineTooltip(dot); });
    listenOnce(dot, 'pointerleave', event => {
      if (event.relatedTarget !== timelineTooltip && !timelineTooltip.contains(event.relatedTarget)) tooltipLeaveTimer = setTimeout(leaveTimelineTooltip, 150);
    });
  });
  if (tooltipAnchor && !tooltipAnchor.isConnected) closeTimelineTooltip();
  else if (tooltipAnchor) {
    tooltipAnchor.setAttribute('aria-describedby', 'timeline-tooltip');
    positionTimelineTooltip();
  }
}

export function renderTimelineLegend(tl) {
  const {timelineMode} = store.get();
  document.querySelectorAll('#timeline-window button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.window === timelineMode)));
  updateFilterIndicator(document.getElementById('timeline-window'));
  const types = [...new Set(tl.dotEvents.map(event => event.type))];
  syncHTML(document.getElementById('timeline-legend-items'), types.map(type => `<span class="timeline-legend-item"><span class="timeline-legend-shape ${typeClass(type)}" aria-hidden="true"></span>${escapeHtml(type)}</span>`).join('') + (tl.dotEvents.some(event => event.isCancelled) ? '<span class="timeline-legend-item"><span class="timeline-legend-cancelled" aria-hidden="true"></span>Abgebrochen</span>' : ''));
}

export function enterTimeline() {
  document.querySelectorAll('.timeline-dot').forEach((dot,index)=>{
    const delay=Math.min(index*20,400);motion(dot,[{scale:'0'},{scale:'1'}],{speed:'fast',delay});motion(dot,[{opacity:0},{opacity:1}],{kind:'effects',delay});
  });
  // Progress always ends at today's coordinate, also while the points enter.
  motion(document.querySelector('.timeline-today'),[{translate:'0 -16px',scale:'.8'},{translate:'0 0',scale:'1'}]);
  document.querySelectorAll('.timeline-period-span').forEach((band,index)=>motion(band,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{speed:'slow',delay:index*25}));
}
