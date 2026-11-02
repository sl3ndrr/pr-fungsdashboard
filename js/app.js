import { tooltipPosition, timelineWindow, timelinePosition, timelineEventLayout, timelineLabelLayout, appointmentRows } from './layout.js';
import { batchUpdate, syncHTML, syncChildren, listenOnce, withTransition, transitionName, reducedMotion, motion, enterPage, fadeChange } from './motion.js';
import { SEMESTERS, ICONS, STORAGE_KEY } from "./data.js";
import {
  calendarDayDiff,
  cancelledStatus,
  escapeHtml,
  formatDate,
  formatFollowupDate,
  midnight,
  parseISOString,
  periodsOnDay,
  remainingDaysText,
  semesterForDate,
  typeClass,
  validateData,
  upcomingEvents,
} from "./utils.js";
import { loadDoneItems, saveDoneItems } from "./storage.js";

let semester = semesterForDate(SEMESTERS, new Date());
let { events, periods } = validateData(semester.events, semester.periods);

async function initialiseDoneItems() {
  const savedItems = await loadDoneItems(STORAGE_KEY);
  doneItems = Array.isArray(savedItems)
    ? savedItems
    : events.filter((event) => event.isDone).map((event) => event.id);

  if (savedItems === null) await saveCompletedItems();
}

let pendingSave = Promise.resolve();

async function saveCompletedItems() {
  const items = [...doneItems];
  pendingSave = pendingSave.then(() => saveDoneItems(STORAGE_KEY, items));
  await pendingSave;
}

const THEME_VALUES = ['light', 'system', 'dark'];
let requestedTheme='system';
const THEME_LABELS = {
  light: 'Helles Design',
  system: 'Folgt der Systemeinstellung',
  dark: 'Dunkles Design',
};

const themeSwitch = document.getElementById('theme-switch');
const themeOptions = [...themeSwitch.querySelectorAll('.theme-option')];
const themeStatus = document.getElementById('theme-switch-status');

function applyTheme(theme, { focus = false } = {}) {
  const selectedTheme = THEME_VALUES.includes(theme) ? theme : 'system';

  if (selectedTheme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }

  themeSwitch.dataset.value = selectedTheme;
  themeStatus.textContent = THEME_LABELS[selectedTheme];
  themeOptions.forEach((option) => {
    const isSelected = option.dataset.themeValue === selectedTheme;
    option.setAttribute('aria-checked', String(isSelected));
    option.tabIndex = isSelected ? 0 : -1;
  });

  try {
    localStorage.setItem('theme_pref', selectedTheme);
  } catch {
    // Das Farbschema bleibt auch ohne verfügbaren Speicher bedienbar.
  }

  updateFilterIndicator(themeSwitch);

  if (focus) {
    themeOptions.find((option) => option.dataset.themeValue === selectedTheme)?.focus();
  }
}

themeOptions.forEach((option) => {
  option.addEventListener('click', () => changeTheme(option.dataset.themeValue));
});

themeSwitch.addEventListener('keydown', (event) => {
  const currentIndex = Math.max(0, THEME_VALUES.indexOf(requestedTheme));
  let nextIndex;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = (currentIndex + 1) % THEME_VALUES.length;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = (currentIndex - 1 + THEME_VALUES.length) % THEME_VALUES.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = THEME_VALUES.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  changeTheme(THEME_VALUES[nextIndex], { focus: true });
});

function changeTheme(theme, options = {}) {
  const rect = themeOptions.find(option => option.getAttribute('aria-checked') === 'true').getBoundingClientRect();
  withTransition(() => {
    applyTheme(theme, options);
    const icon = themeOptions.find(option => option.dataset.themeValue === theme)?.querySelector('svg');
    motion(icon, [{rotate:'-15deg',scale:'.8'}, {rotate:'0deg',scale:'1'}], {speed:'fast'});
  }, {type:'theme', origin:{x:rect.left+rect.width/2,y:rect.top+rect.height/2}});
  requestedTheme=theme;
}
let savedTheme = 'system';
try {
  savedTheme = localStorage.getItem('theme_pref') || 'system';
} catch {
  // Bei gesperrtem Speicher mit der Systemeinstellung starten.
}
applyTheme(savedTheme);
requestedTheme=themeSwitch.dataset.value;

let showPast = false;
let typeFilter = 'all';

let doneItems  = [];

// Datumsgeometrie für die Monatsmarken im Zeitstrahl.
const dateInMonth = (year, month, day) => {
  const date = new Date(0);
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
};
function toggleDone(id) {
  return withTransition(() => {
    doneItems = doneItems.includes(id) ? doneItems.filter(x=>x!==id) : [...doneItems,id];
    saveCompletedItems(); renderPreservingState();
  }, {type:'done'});
}
let highlightTimer;
async function selectTimelineEvent(dot,id) {
  const item=events.find(e=>e.id===id);
  if(item && ((!showPast && calendarDayDiff(parseISOString(item.date),midnight(new Date()))<0) || (typeFilter!=='all' && typeFilter!==item.type))) {
    await withTransition(()=>{
      if(calendarDayDiff(parseISOString(item.date),midnight(new Date()))<0)showPast=true;
      if(typeFilter!=='all' && typeFilter!==item.type)typeFilter='all';
      updatePastToggle();updateTypeFilter();renderPreservingState();
    },{type:'filter'});
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

function buildTimeline(todayMid) {
  const domain = timelineWindow(events, todayMid, timelineMode);
  if (!domain) return { html: '<p class="timeline-empty">Noch keine Termine für dieses Semester</p>', dotEvents: [] };
  const { events: visible, origin, todayDay, minDay, maxDay, axisStart, axisEnd } = domain;
  const width = Math.max(44, document.getElementById('timeline-container').clientWidth);
  const pos = date => timelinePosition(calendarDayDiff(date, origin), minDay, maxDay, width);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const font = getComputedStyle(document.getElementById('timeline-container'));
  context.font = `800 ${font.fontSize} ${font.fontFamily}`;
  const measure = text => Math.ceil(context.measureText(text).width) + 8;
  const shortDate = event => parseISOString(event.date).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' });
  const shortName = event => event.title.replace(/^Beginn /, '').replace(/ \(bis [^)]+\)$/, '')
    .replace('Programmierpraktikum', 'Prog.-Praktikum').replace('Wintersemester 2026/27', 'Wintersemester');
  const layout = timelineEventLayout(visible.map(event => ({ x: pos(parseISOString(event.date)), variants: [
    { title: shortName(event), date: shortDate(event), width: Math.max(measure(shortName(event)), measure(shortDate(event))) },
    { title: '', date: shortDate(event), width: measure(shortDate(event)) },
  ] })), width);
  const above = Math.max(1, ...layout.map(item => -item.lane));
  const below = Math.max(0, ...layout.map(item => item.lane));
  const axisY = 24 + above * 52;
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
    const top = item.lane < 0 ? axisY - 52 * -item.lane : axisY + 36 + 52 * (item.lane - 1) + lowerShift;
    const pointY = top + 12;
    const status = event.isCancelled ? `Abgebrochen${cancelledStatus(event) === 'Abgebrochen' ? '' : ': ' + cancelledStatus(event)}`
      : doneItems.includes(event.id) ? 'Erledigt' : parseISOString(event.date) < todayMid ? 'Vergangen' : 'Offen';
    const description = `${event.type}: ${event.title}, ${formatDate(parseISOString(event.date))}, ${event.time}, ${status}`;
    return `<span class="timeline-stem" data-key="stem-${escapeHtml(event.id)}" aria-hidden="true" style="left:${x}px;top:${Math.min(axisY, pointY)}px;height:${Math.abs(axisY - pointY)}px"></span>
      <button id="timeline-event-${escapeHtml(event.id)}" type="button" class="timeline-dot ${typeClass(event.type)} ${event.isCancelled ? 'cancelled' : ''} ${parseISOString(event.date) < todayMid ? 'past' : ''} ${next?.id === event.id ? 'next' : ''}"
        style="left:${item.left}px;top:${top}px;width:${item.width}px;--point-x:${x - item.left}px" data-event-id="${escapeHtml(event.id)}" data-date="${event.date}" aria-label="${escapeHtml(description)}">
        <span class="timeline-point" aria-hidden="true"></span><span class="timeline-event-label">${item.title ? `<strong>${escapeHtml(item.title)}</strong>` : ''}<span>${escapeHtml(item.date)}</span></span>
      </button>`;
  }).join('');
  const monthTop = Math.max(axisY + 30, bandBottom, below ? axisY + 36 + below * 52 + lowerShift : 0) + 4;
  const start = new Date(origin); start.setDate(start.getDate() + minDay);
  let cursor = dateInMonth(start.getFullYear(), start.getMonth(), 1);
  const marks = [];
  let previousYear;
  while (calendarDayDiff(cursor, origin) <= maxDay && marks.length < 120) {
    const day = calendarDayDiff(cursor, origin);
    if (day >= minDay || !marks.length) {
      const title = cursor.toLocaleDateString('de-DE', {month:'short'}).replace(/\.$/, '') + (previousYear !== cursor.getFullYear() ? ` ${cursor.getFullYear()}` : '');
      marks.push({ anchor: Math.max(22, pos(cursor)), width: measure(title), title, tick: day >= minDay ? pos(cursor) : null });
      previousYear = cursor.getFullYear();
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const monthLayout = timelineLabelLayout(marks, 0, width, 8);
  const months = marks.map((mark, i) => `${mark.tick === null ? '' : `<span class="timeline-month-tick" aria-hidden="true" style="left:${mark.tick}px"></span>`}<span class="timeline-month" style="left:${monthLayout.labels[i].center}px;top:${monthTop + monthLayout.labels[i].row * 20}px">${escapeHtml(mark.title)}</span>`).join('');
  const todayX = Math.max(22, Math.min(width - 22, timelinePosition(todayDay, minDay, maxDay, width)));
  const pillX = Math.max(28, Math.min(width - 28, todayX));
  const height = monthTop + Math.max(1, monthLayout.rows) * 20;
  return { html: `<div class="timeline-track" data-axis-start="${axisStart}" data-axis-end="${axisEnd}" style="height:${height}px;--axis-y:${axisY}px">
    <div class="timeline-progress" style="top:${axisY}px;width:${Math.max(0,todayX - 22)}px"></div>
    <div class="timeline-today" style="left:${todayX}px;height:${axisY + 6}px" aria-hidden="true"></div>
    <span class="timeline-today-label" style="left:${pillX}px">Heute</span>${periodsHtml}${months}${dots}</div>`, dotEvents: visible };
}

function renderHero(upcoming, todayMid, animate) {
  const hero=document.getElementById('hero'),key=upcoming[0]?.id||'empty';
  if(hero.dataset.eventId && hero.dataset.eventId!==key && !animate)fadeChange(hero,()=>buildHero(upcoming,todayMid,animate));
  else buildHero(upcoming,todayMid,animate);
  hero.dataset.eventId=key;
}
function buildHero(upcoming, todayMid, animate) {
  const el = document.getElementById('hero');
  const item = upcoming[0];
  if (!item) {
    el.className = `hero `;
    syncHTML(el, `<div class="hero-label">Als Nächstes</div><div class="hero-empty">${ICONS.check}<span>Keine offenen Termine</span></div>`);
    return;
  }
  const d = parseISOString(item.date);
  const diffDays = calendarDayDiff(d, todayMid);
  el.className = `hero ${diffDays <= 7 ? 'urgent' : ''} ${diffDays <= 3 ? 'imminent' : ''} `;
  const count = diffDays === 0 ? 'Heute' : diffDays;
  const activePeriods = periodsOnDay(todayMid, periods);
  syncHTML(el, `
    <h2 class="hero-label">Als Nächstes</h2>
    <div class="hero-main">
      <div class="hero-countdown"><span class="hero-number ${diffDays === 0 ? 'word' : ''}">${count}</span>${diffDays > 0 ? `<span class="hero-unit">${diffDays === 1 ? 'Tag' : 'Tage'}</span>` : ''}</div>
      <div class="hero-text">
        <span class="badge ${typeClass(item.type)}">${ICONS[item.type]}${escapeHtml(item.type)}</span>
        <h3 class="hero-title">${escapeHtml(item.title)}</h3>
        <div class="hero-meta"><span>${ICONS.calendar}${escapeHtml(formatDate(d))}</span><span>${ICONS.clock}${escapeHtml(item.time)}</span></div>
      </div>
    </div>
    ${upcoming.length > 1 ? `<div class="hero-after"><h3 class="hero-label">Danach</h3>${upcoming.slice(1, 3).map(e => {
      const days = calendarDayDiff(parseISOString(e.date), todayMid);
      return `<button class="hero-next" type="button" data-event-id="${escapeHtml(e.id)}">
        <span class="type-icon ${typeClass(e.type)}">${ICONS[e.type]}</span>
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

function focusAfterRender() {
  const active = document.activeElement;
  const card = active.closest('#list .card');
  if (card && active.matches('input[type="checkbox"]')) {
    return () => document.getElementById(card.id)?.querySelector('input[type="checkbox"]');
  }

  if (card) return () => document.getElementById(card.id);

  const heroNext = active.closest('.hero-next');
  if (heroNext) {
    return () => [...document.querySelectorAll('.hero-next')].find(button => button.dataset.eventId === heroNext.dataset.eventId);
  }
  const dot = active.closest('#timeline-container .timeline-dot');
  if (dot) {
    return () => [...document.querySelectorAll('#timeline-container .timeline-dot')]
      .find(button => button.dataset.eventId === dot.dataset.eventId);
  }

  return null;
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
function closeTimelineTooltip() {
  clearTimeout(tooltipLeaveTimer);
  tooltipAnchor?.removeAttribute('aria-describedby');
  timelineTooltip.dataset.open = 'false';
  timelineTooltip.setAttribute('aria-hidden', 'true');
  tooltipAnchor = null;
}
function showTimelineTooltip(dot) {
  const item = events.find(e => e.id === dot.dataset.eventId);
  if (!item) return;
  closeTimelineTooltip();
  tooltipAnchor = dot;
  const status = item.isCancelled ? `Abgebrochen${cancelledStatus(item) === 'Abgebrochen' ? '' : ': ' + cancelledStatus(item)}`
    : doneItems.includes(item.id) ? 'Erledigt' : parseISOString(item.date) < midnight(new Date()) ? 'Vergangen' : 'Offen';
  syncHTML(timelineTooltip, `<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(formatDate(parseISOString(item.date)))} · ${escapeHtml(item.time)}</span><span>${escapeHtml(status)}</span>`);
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

let timelineMode = 'upcoming';
const timelineContainerElement = document.getElementById('timeline-container');
document.querySelectorAll('#timeline-window button').forEach(button => {
  button.addEventListener('click', () => {
    timelineMode = button.dataset.window;
    renderPreservingState();
  });
});

function renderPreservingState(animate = false) {
  const restoreFocus = focusAfterRender();
  const pageX = window.scrollX;
  const pageY = window.scrollY;

  batchUpdate(()=>render(animate));

  let focusFallback = false;
  if (restoreFocus) {
    const target = restoreFocus();
    if (target) target.focus({ preventScroll: true });
    else focusFallback = true;
  }
  if (window.scrollX !== pageX || window.scrollY !== pageY) window.scrollTo(pageX, pageY);
  if (focusFallback) document.getElementById('toggle-past-btn').focus({preventScroll:true});
}

const localDayKey = date => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
let renderedDay = null;
let dayTimer;

function render(animate) {
  const today    = new Date();
  const todayMid = midnight(today);
  const nextSemester = semesterForDate(SEMESTERS, todayMid);
  if (nextSemester.id !== semester.id) {
    semester = nextSemester;
    ({ events, periods } = validateData(semester.events, semester.periods));
    showPast = false;
    updatePastToggle();
    typeFilter = 'all';
    updateTypeFilter();
    closeTimelineTooltip();
  }
  document.getElementById('semester-label').textContent = semester.label;
  const tl = buildTimeline(todayMid);
  document.querySelectorAll('#timeline-window button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.window === timelineMode)));
  updateFilterIndicator(document.getElementById('timeline-window'));
  const types = [...new Set(tl.dotEvents.map(event => event.type))];
  syncHTML(document.getElementById('timeline-legend-items'), types.map(type => `<span class="timeline-legend-item"><span class="timeline-legend-shape ${typeClass(type)}" aria-hidden="true"></span>${escapeHtml(type)}</span>`).join('') + (tl.dotEvents.length ? '<span class="timeline-legend-item"><span class="timeline-legend-cancelled" aria-hidden="true"></span>Abgebrochen</span>' : ''));
  renderedDay = localDayKey(today);
  document.getElementById('today-date').textContent = today.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const mainEvents = events.filter(e => !e.calOnly);
  const sorted   = [...mainEvents].sort((a, b) => parseISOString(a.date) - parseISOString(b.date));

  const upcoming = upcomingEvents(mainEvents, todayMid, doneItems);
  renderHero(upcoming, todayMid, animate);

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


  const abgaben     = mainEvents.filter(e => e.type === 'Abgabe');
  const abgabenDone = abgaben.filter(e => doneItems.includes(e.id)).length;
  const next7       = sorted.filter(e => {
    const diff = calendarDayDiff(parseISOString(e.date), todayMid);
    return diff >= 0 && diff <= 7 && !e.isCancelled;
  }).length;

  syncHTML(document.getElementById('stats-line'),
    `<div class="stat-tile"><strong class="stat-value">${mainEvents.filter(e => !e.isCancelled).length}</strong><span class="stat-label">Termine</span></div>
     <div class="stat-tile"><span class="stat-label">Abgaben</span><strong class="stat-value">${abgabenDone}<span class="stat-total">/${abgaben.length}</span></strong><div class="mini-progress" role="progressbar" aria-label="Abgaben erledigt" aria-valuemin="0" aria-valuemax="${abgaben.length || 1}" aria-valuenow="${abgabenDone}"><span style="clip-path:inset(0 ${100 - (abgaben.length ? abgabenDone / abgaben.length : 0) * 100}% 0 0)"></span></div></div>
     <div class="stat-tile"><strong class="stat-value">${next7}</strong><span class="stat-label">${next7 === 1 ? 'Termin' : 'Termine'} in 7 Tagen</span></div>`);

  animateStatistics();

  const listTarget=document.getElementById('list');
  const listEl=document.createElement('div');
  
  // Filter-Logik für die Liste
  const visibleEvents = sorted.filter(item => {
    const d = parseISOString(item.date);
    const diffDays = calendarDayDiff(d, todayMid);
    
    // Wenn showPast false ist und das Datum in der Vergangenheit liegt, ausblenden
    if (!showPast && diffDays < 0) return false;
    
    return typeFilter === 'all' || item.type === typeFilter;
  });

  if (visibleEvents.length === 0) {
    listEl.innerHTML = `<div class="empty-state" data-key="empty" style="view-transition-name:empty-state" role="listitem">Keine ${typeFilter === 'all' ? 'Termine' : typeFilter === 'Prüfung' ? 'Prüfungen' : typeFilter === 'Abgabe' ? 'Abgaben' : 'Termine'} in dieser Ansicht.</div>`;
  }

  const weekStart = new Date(todayMid);
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
  const nextWeekEnd = new Date(weekEnd); nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
  const groupFor = item => {
    const date = parseISOString(item.date);
    if (date < todayMid) return 'Vergangen';
    if (date.getTime() === todayMid.getTime()) return 'Heute';
    if (date <= weekEnd) return 'Diese Woche';
    if (date <= nextWeekEnd) return 'Nächste Woche';
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  };
  // Future appointments lead; revealed history follows as its own group.
  const orderedEvents = [...visibleEvents.filter(e => parseISOString(e.date) >= todayMid),
    ...visibleEvents.filter(e => parseISOString(e.date) < todayMid)];
  const columns = Number(getComputedStyle(listTarget).getPropertyValue('--list-columns')) || 1;
  const itemGroups = new Map();
  const groupIds = new Map();
  const mixedIds = new Set();
  appointmentRows(orderedEvents, groupFor, columns).forEach(row => {
    if (row.showHeading) {
      const key = row.cards[0].id;
      const heading = document.createElement('div');
      heading.className = 'group-row-heading';
      heading.dataset.key = `heading-${key}`;
      heading.setAttribute('role', 'listitem');
      heading.innerHTML = `<h3 id="${transitionName(key, 'row-heading')}" class="group-heading" style="view-transition-name:${transitionName(key, 'heading')}">${row.groups.map(group => {
        const id = transitionName(`${key}:${group}`, 'group');
        groupIds.set(group, id);
        return `<span id="${id}">${escapeHtml(group)}</span>`;
      }).join('<span aria-hidden="true"> · </span>')}</h3>`;
      listEl.appendChild(heading);
    }
    row.cards.forEach(item => {
      const group = groupFor(item);
      if (row.groups.length > 1) mixedIds.add(item.id);
      // Metadata is assigned before the cards are appended to the same grid.
      itemGroups.set(item.id, { group, labelId: groupIds.get(group) });
    });
    row.cards.forEach(item => listEl.appendChild(buildCard(item)));
  });
  function buildCard(item) {
    const { group, labelId } = itemGroups.get(item.id);
    const idx = orderedEvents.indexOf(item);
    const d        = parseISOString(item.date);
    const diffDays = calendarDayDiff(d, todayMid);
    const diffWeeks = (diffDays / 7).toFixed(1).replace('.', ',');
    const isAbgabe = item.type === 'Abgabe';
    const isDone   = isAbgabe && doneItems.includes(item.id);

    let countdownClass = '', countdownContent = '';
    if (item.isCancelled) {
      // Cancellation is represented once in the meta row, without a countdown tile.
    } else if (isDone) {
      countdownClass   = 'done-badge';
      countdownContent = `<span class="primary">${ICONS.check}Erledigt</span><span class="secondary">abgehakt</span>`;
    } else if (diffDays < 0) {
      countdownClass   = 'expired';
      countdownContent = `<span class="primary">Abgelaufen</span><span class="secondary">vor ${Math.abs(diffDays)} Tg.</span>`;
    } else if (diffDays === 0) {
      countdownClass   = 'urgent today-chip';
      countdownContent = `<span class="primary">Heute</span><span class="secondary">${escapeHtml(item.time)}</span>`;
    } else {
      if (diffDays <= 3) countdownClass = 'urgent';
      countdownContent = `<span class="primary countdown-number">${diffDays}</span><span class="countdown-unit">Tag${diffDays !== 1 ? 'e' : ''}</span>${diffDays >= 14 ? `<span class="secondary">${diffWeeks} Wochen</span>` : ''}`;
    }

    const checkElement = isAbgabe
      ? `<label class="done-toggle"><input type="checkbox" ${isDone ? 'checked' : ''} aria-label="${escapeHtml(item.title)} erledigt"><svg class="check-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="visually-hidden">${isDone ? 'Erledigt' : 'Abhaken'}</span></label>`
      : '';

    const card = document.createElement('div');
    card.className = `card ${typeClass(item.type)} ${diffDays < 0 && !item.isCancelled ? 'past' : ''} ${isDone && !item.isCancelled ? 'done' : ''} ${item.isCancelled ? 'cancelled' : ''} `;
    card.id = `card-${item.id}`;
    card.tabIndex = -1;
    card.style.viewTransitionName=transitionName(item.id);
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-labelledby', `title-${item.id} ${labelId}`);
    if (animate) card.style.setProperty('--delay', Math.min(idx * 0.025, 0.15) + 's');
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-left">
          <div class="type-icon ${typeClass(item.type)}" role="img" aria-label="${escapeHtml(item.type)}">${ICONS[item.type]}</div>
          <div class="info">
            ${mixedIds.has(item.id) ? `<span class="card-group">${escapeHtml(group)}</span>` : ''}
            <h4 id="title-${escapeHtml(item.id)}" class="title"><span class="title-text">${escapeHtml(item.title)}</span></h4>
            <div class="meta"><span>${ICONS.calendar}${escapeHtml(formatDate(d))}</span><span>${ICONS.clock}${escapeHtml(item.time)}</span>${item.isCancelled ? `<span class="cancelled-chip">${escapeHtml(cancelledStatus(item))}</span>` : ''}</div>
          </div>
        </div>
        <div class="card-trailing">${checkElement}${item.isCancelled ? '' : `<div class="countdown ${countdownClass}">${countdownContent}</div>`}</div>
      </div>
    `;

    return card;
  }

  syncChildren(listTarget,listEl);
  listTarget.querySelectorAll('.done-toggle input').forEach(input=>listenOnce(input,'change',()=>toggleDone(input.closest('.card').id.slice(5))));
  enhanceProgress(animate);
  if(animate){enterPage();enterTimeline();}
}

function scheduleNextDay() {
  clearTimeout(dayTimer);
  const now = new Date();
  const nextMidnight = midnight(now);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  dayTimer = setTimeout(refreshCurrentDay, Math.max(1, nextMidnight.getTime() - now.getTime() + 25));
}

function refreshCurrentDay() {
  if (!document.hidden && localDayKey(new Date()) !== renderedDay) renderPreservingState();
  scheduleNextDay();
}

// Filter für vergangene Termine.
const togglePastBtn = document.getElementById('toggle-past-btn');
function updatePastToggle() {
  togglePastBtn.textContent = showPast ? 'Vergangene ausblenden' : 'Vergangene anzeigen';
  togglePastBtn.setAttribute('aria-pressed', String(showPast));
  updateFilterIndicator(togglePastBtn.closest('.segmented-filter'));
}
togglePastBtn.addEventListener('click', () => {
  withTransition(()=>{showPast=!showPast;updatePastToggle();renderPreservingState();},{type:'filter'});
});

function updateTypeFilter() {
  document.querySelectorAll('#type-filter button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === typeFilter));
  });
  updateFilterIndicator();
}
document.querySelectorAll('#type-filter button').forEach(button => {
  button.addEventListener('click', () => {
    withTransition(()=>{typeFilter=button.dataset.filter;updateTypeFilter();renderPreservingState();},{type:'filter'});
  });
});

(async function init() {
  await initialiseDoneItems();
  render(true);
  updateFilterIndicator();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshCurrentDay();
  });
  window.addEventListener('pageshow', refreshCurrentDay);
  document.fonts?.ready.then(() => renderPreservingState());
  let timelineWidth = timelineContainerElement.clientWidth;
  new ResizeObserver(() => {
    const width = timelineContainerElement.clientWidth;
    if (width !== timelineWidth) {
      timelineWidth = width;
      renderPreservingState();
    }
  }).observe(timelineContainerElement);
  const list = document.getElementById('list');
  let columns = getComputedStyle(list).getPropertyValue('--list-columns');
  new ResizeObserver(() => {
    const next = getComputedStyle(list).getPropertyValue('--list-columns');
    if (next !== columns) {
      columns = next;
      renderPreservingState();
    }
  }).observe(list);
  refreshCurrentDay();
})();


function updateFilterIndicator(group = document.getElementById('type-filter')) {
  let indicator=group.querySelector('.filter-indicator');
  if(!indicator){indicator=document.createElement('span');indicator.className='filter-indicator';indicator.setAttribute('aria-hidden','true');group.prepend(indicator);}
  const selected=group.querySelector('[aria-pressed="true"],[aria-checked="true"]');
  indicator.hidden = !selected;
  if (!selected) return;
  const x=selected.offsetLeft,width=selected.offsetWidth;
  if(reducedMotion.matches&&indicator.style.getPropertyValue('--indicator-x')!==`${x}px`)motion(indicator,[{opacity:0},{opacity:1}],{kind:'effects',speed:'fast'});
  indicator.style.setProperty('--indicator-x',`${x}px`);indicator.style.setProperty('--indicator-width',`${width}px`);
}
document.querySelectorAll('.segmented-filter').forEach(group => new ResizeObserver(() => updateFilterIndicator(group)).observe(group));
document.addEventListener('pointerdown',event=>{
  const button=event.target.closest('button:not(:disabled):not(.timeline-dot)');if(!button)return;
  const rect=button.getBoundingClientRect();button.style.setProperty('--x',`${event.clientX-rect.left}px`);button.style.setProperty('--y',`${event.clientY-rect.top}px`);
  const overlay=document.createElement('span');overlay.className='ripple-overlay motion-decoration';overlay.setAttribute('aria-hidden','true');
  const ripple=document.createElement('span');ripple.className='ripple-origin';overlay.append(ripple);button.append(overlay);
  overlay.style.setProperty('--x',`${event.clientX-rect.left}px`);overlay.style.setProperty('--y',`${event.clientY-rect.top}px`);
  overlay.style.setProperty('--ripple-size',`${Math.hypot(rect.width,rect.height)*2}px`);
  motion(ripple,[{scale:'0'},{scale:'1'}],{speed:'fast'});
  const fade=motion(ripple,[{opacity:.16},{opacity:0}],{kind:'effects',speed:'slow'});
  if(fade)fade.finished.catch(()=>{}).finally(()=>overlay.remove());else overlay.remove();
});
const progressValues=new WeakMap();
function enhanceProgress(animate) {
  document.querySelectorAll('.mini-progress').forEach(bar=>{
    const value=Number(bar.getAttribute('aria-valuenow'))/Number(bar.getAttribute('aria-valuemax')),fill=bar.querySelector('span');
    bar.dataset.flat=String(value<=0||value>=1);
    bar.style.setProperty('--wave-amplitude',String(Math.min(1,Math.max(0,Math.min(value,1-value)*4))));
    bar.style.setProperty('--progress-position',`${Math.max(0,Math.min(1,value))*100}%`);
    if(!animate&&reducedMotion.matches&&progressValues.get(bar)!==value)motion(fill,[{opacity:0},{opacity:1}],{kind:'effects',speed:'fast'});
    progressValues.set(bar,value);
    if(animate){
      motion(fill,[{clipPath:'inset(0 100% 0 0)'},{clipPath:fill.style.clipPath}],{speed:'slow'});
      const marker=bar.querySelector('.progress-marker');
      if(marker)motion(marker,[{transform:'translateX(2px)'},{transform:`translateX(clamp(2px, ${Math.max(0,Math.min(1,value))*100}%, calc(100% - 2px)))`}],{speed:'slow'});
    }
  });
}
function enterTimeline() {
  document.querySelectorAll('.timeline-dot').forEach((dot,index)=>{
    const delay=Math.min(index*20,400);motion(dot,[{scale:'0'},{scale:'1'}],{speed:'fast',delay});motion(dot,[{opacity:0},{opacity:1}],{kind:'effects',delay});
  });
  // Progress always ends at today's coordinate, also while the points enter.
  motion(document.querySelector('.timeline-today'),[{translate:'0 -16px',scale:'.8'},{translate:'0 0',scale:'1'}]);
  document.querySelectorAll('.timeline-period-span').forEach((band,index)=>motion(band,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{speed:'slow',delay:index*25}));
}


const statisticValues = new WeakMap();
function animateStatistics() {
  document.querySelectorAll('.stat-value').forEach(value => {
    const text = value.textContent;
    if (statisticValues.has(value) && statisticValues.get(value) !== text) {
      motion(value, [{scale:'1.15'}, {scale:'1'}], {speed:'fast'});
      motion(value, [{opacity:.6}, {opacity:1}], {kind:'effects',speed:'fast'});
    }
    statisticValues.set(value, text);
  });
}


