import { EVENTS, ICONS, PERIODS, STORAGE_KEY } from "./data.js";
import {
  calendarDayDiff,
  escapeHtml,
  formatDate,
  midnight,
  parseISOString,
  periodsOnDay,
  typeClass,
  validateData,
} from "./utils.js";
import { loadDoneItems, saveDoneItems } from "./storage.js";

const { events, periods } = validateData(EVENTS, PERIODS);

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

  if (focus) {
    themeOptions.find((option) => option.dataset.themeValue === selectedTheme)?.focus();
  }
}

themeOptions.forEach((option) => {
  option.addEventListener('click', () => applyTheme(option.dataset.themeValue));
});

themeSwitch.addEventListener('keydown', (event) => {
  const currentIndex = Math.max(0, THEME_VALUES.indexOf(themeSwitch.dataset.value));
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
  applyTheme(THEME_VALUES[nextIndex], { focus: true });
});

let savedTheme = 'system';
try {
  savedTheme = localStorage.getItem('theme_pref') || 'system';
} catch {
  // Bei gesperrtem Speicher mit der Systemeinstellung starten.
}
applyTheme(savedTheme);

let showPast = false;
let typeFilter = 'all';

let doneItems  = [];
let calVisible = false;
let selectedCalDate = null;

// Kalendergrenzen automatisch aus Terminen und Zeiträumen ableiten.
const calendarDateValues = [
  ...events.map(e => e.date),
  ...periods.flatMap(p => [p.start, p.end])
];
if (!calendarDateValues.length) {
  const today = new Date();
  calendarDateValues.push(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  );
}
const calMinIso = calendarDateValues.reduce((a, b) => a < b ? a : b);
const calMaxIso = calendarDateValues.reduce((a, b) => a > b ? a : b);
const [calMinYear, calMinMonth1] = calMinIso.split('-').map(Number);
const [calMaxYear, calMaxMonth1] = calMaxIso.split('-').map(Number);
const monthIndex = (year, month) => year * 12 + month;
const dateInMonth = (year, month, day) => {
  const date = new Date(0);
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
};
const CAL_MIN_MONTH_INDEX = monthIndex(calMinYear, calMinMonth1 - 1);
const CAL_MAX_MONTH_INDEX = monthIndex(calMaxYear, calMaxMonth1 - 1);

const currentDate = new Date();
const initialCalMonthIndex = Math.min(
  CAL_MAX_MONTH_INDEX,
  Math.max(CAL_MIN_MONTH_INDEX, monthIndex(currentDate.getFullYear(), currentDate.getMonth()))
);
let calYear  = Math.floor(initialCalMonthIndex / 12);
let calMonth = initialCalMonthIndex % 12;

function toggleDone(id) {
  doneItems = doneItems.includes(id) ? doneItems.filter(x => x !== id) : [...doneItems, id];
  saveCompletedItems();
  renderPreservingState();
}

/* Visuelles Feedback beim Auswählen eines Punkts im Zeitstrahl. */
function selectTimelineEvent(dot, id) {
  const item = events.find(e => e.id === id);
  if (item && !showPast && calendarDayDiff(parseISOString(item.date), midnight(new Date())) < 0) {
    showPast = true;
    updatePastToggle();
    renderPreservingState();
    dot = [...document.querySelectorAll('.timeline-dot')].find(button => button.dataset.eventId === id);
  }

  if (item && typeFilter !== 'all' && typeFilter !== item.type) {
    typeFilter = 'all';
    updateTypeFilter();
    renderPreservingState();
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (dot && !reduceMotion) {
    dot.classList.add('ping');
    setTimeout(() => dot?.classList.remove('ping'), 350);
  }

  const card = document.getElementById(`card-${id}`);
  if (card) {
    card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    if (!reduceMotion) {
      card.classList.remove('pulse-highlight');
      void card.offsetWidth;
      card.classList.add('pulse-highlight');
    }
  }
}

function openCalMenu(anchor, ev) {
  const pop = document.getElementById('cal-popover');
  const isDone = ev.type === 'Abgabe' && doneItems.includes(ev.id);
  const cancelledBadge = ev.isCancelled ? `<div class="cal-popover-cancelled">${ICONS.cancelled}Abgebrochen</div>` : '';

  let actionBtn = '';
  if (ev.type === 'Abgabe') {
    actionBtn = `<button class="cal-popover-btn" type="button">
      ${isDone ? 'Als offen markieren' : ICONS.check + ' Als erledigt markieren'}
    </button>`;
  }

  pop.innerHTML = `
    <div class="cal-popover-head">
      <span class="badge ${ev.calOnly ? 'cal-only' : typeClass(ev.type)}">${ICONS[ev.type]}${ev.calOnly ? 'Nur im Kalender' : escapeHtml(ev.type)}</span>
      <button class="cal-popover-close" type="button" aria-label="Termindetails schließen">${ICONS.close}</button>
    </div>
    <div class="cal-popover-title">${escapeHtml(ev.title)}</div>
    <div class="cal-popover-meta">${ICONS.calendar} ${formatDate(parseISOString(ev.date))} · ${ICONS.clock} ${escapeHtml(ev.time)}</div>
    ${cancelledBadge}
    ${actionBtn}
  `;
  pop.querySelector('.cal-popover-close').addEventListener('click', closeCalMenu);
  pop.querySelector('.cal-popover-btn')?.addEventListener('click', () => {
    toggleDone(ev.id);
    closeCalMenu();
  });

  pop.style.display = 'flex';

  const tRect = anchor.getBoundingClientRect();
  const pRect = pop.getBoundingClientRect();
  let top = tRect.bottom + 6;
  let left = tRect.left;

  if (left + pRect.width > window.innerWidth - 12) left = window.innerWidth - pRect.width - 12;
  if (top + pRect.height > window.innerHeight - 12) top = tRect.top - pRect.height - 6;

  pop.style.top  = `${Math.max(10, top)}px`;
  pop.style.left = `${Math.max(10, left)}px`;
}

function closeCalMenu() {
  const p = document.getElementById('cal-popover');
  if (p) p.style.display = 'none';
}

document.addEventListener('click', (e) => {
  const pop = document.getElementById('cal-popover');
  if (pop && pop.style.display === 'flex' && !pop.contains(e.target) && !e.target.closest('.cal-event-tag, .cal-day-event')) {
    closeCalMenu();
  }
});
window.addEventListener('scroll', closeCalMenu, true);

function buildTimeline(todayMid, animate) {
  const mainEvents = events.filter(e => !e.calOnly)
    .sort((a, b) => parseISOString(a.date) - parseISOString(b.date));
  const times = mainEvents.map(e => parseISOString(e.date).getTime());
  const examTimes = mainEvents.filter(e => e.type === 'Prüfung').map(e => parseISOString(e.date).getTime());
  let axisStart = examTimes.length ? Math.min(...examTimes) : times.length ? Math.min(...times) : todayMid.getTime();
  let axisEnd = examTimes.length ? Math.max(...examTimes) : times.length ? Math.max(...times) : axisStart;
  if (times.some(t => t < axisStart || t > axisEnd)) {
    console.warn('Semester-Roadmap: Termin außerhalb der Prüfungsachse; Achse erweitert.');
    axisStart = Math.min(axisStart, ...times);
    axisEnd = Math.max(axisEnd, ...times);
  }
  const range = axisEnd - axisStart || 86400000;
  const minT = axisStart - range * 0.04;
  const maxT = axisEnd + range * 0.04;
  const posOf = t => (t - minT) / (maxT - minT) * 100;

  // Least-squares isotonic regression of x[i] - i * gap. Each merged
  // collision group is spread symmetrically about its true centroid.
  const spread = targets => {
    const blocks = [];
    targets.forEach((x, i) => {
      blocks.push({ start: i, end: i, sum: x - i * 32, count: 1 });
      while (blocks.length > 1) {
        const a = blocks[blocks.length - 2], b = blocks[blocks.length - 1];
        if (a.sum / a.count <= b.sum / b.count) break;
        blocks.splice(-2, 2, { start: a.start, end: b.end, sum: a.sum + b.sum, count: a.count + b.count });
      }
    });
    const result = [];
    blocks.forEach(b => {
      for (let i = b.start; i <= b.end; i++) result[i] = b.sum / b.count + i * 32;
    });
    return result;
  };
  let trackWidth = Math.max(600, (mainEvents.length + 1) * 32,
    document.getElementById('timeline-container').clientWidth - 16);
  let dotXs, trueXs;
  // Grow the scrollable rail until symmetric groups also fit at the edges.
  for (let attempt = 0; attempt < 30; attempt++) {
    trueXs = times.map(t => posOf(t) * trackWidth / 100);
    dotXs = spread(trueXs);
    if (!dotXs.length || (dotXs[0] >= 16 && dotXs.at(-1) <= trackWidth - 16)) break;
    trackWidth = Math.ceil(trackWidth * 1.25);
  }

  let periodsHtml = '';
  const placedRanges = [];
  periods.forEach(p => {
    const start = parseISOString(p.start).getTime(), end = parseISOString(p.end).getTime();
    if (end < axisStart || start > axisEnd) return;
    const left = posOf(Math.max(axisStart, start)), right = posOf(Math.min(axisEnd, end));
    const mid = (left + right) / 2;
    const row = placedRanges.some(r => mid > r.l - 6 && mid < r.r + 6) ? 1 : 0;
    placedRanges.push({ l: left, r: right });
    periodsHtml += `<div class="timeline-period-span" style="left:${left}%;width:${right - left}%;--period-rgb:${p.rgb}"></div>
      <div class="timeline-period-label" data-row="${row}" style="left:${mid}%;--period-rgb:${p.rgb}">${escapeHtml(p.label)}</div>`;
  });
  const dateGroups = new Map();
  let dots = '';
  mainEvents.forEach((e, i) => {
    if (!dateGroups.has(e.date)) dateGroups.set(e.date, []);
    dateGroups.get(e.date).push(dotXs[i]);
    const past = times[i] < todayMid.getTime();
    const description = `${e.type}: ${e.title}, ${formatDate(parseISOString(e.date))}, ${e.time}${e.isCancelled ? ', abgebrochen' : ''}`;
    dots += `<button type="button" class="timeline-dot ${typeClass(e.type)} ${e.isCancelled ? 'cancelled' : ''} ${past ? 'past' : ''} ${animate ? 'enter' : ''}"
      style="left:${dotXs[i]}px;--delay:${i * 0.02}s" data-event-id="${escapeHtml(e.id)}" aria-label="${escapeHtml(description)}" aria-describedby="timeline-tip-${escapeHtml(e.id)}">
      <span class="timeline-tooltip" id="timeline-tip-${escapeHtml(e.id)}" role="tooltip"><strong>${escapeHtml(e.title)}</strong><span>${escapeHtml(formatDate(parseISOString(e.date)))} · ${escapeHtml(e.time)}</span>${e.isCancelled ? '<span>Abgebrochen</span>' : ''}</span>
    </button>`;
    if (Math.abs(dotXs[i] - trueXs[i]) > 6) dots += `<span class="timeline-date-tick" style="left:${trueXs[i]}px" aria-hidden="true"></span>`;
  });
  dateGroups.forEach((xs, date) => {
    if (xs.length < 2) return;
    dots += `<span class="timeline-date-label" style="left:${xs.reduce((a,b) => a+b,0) / xs.length}px" aria-hidden="true">${escapeHtml(formatDate(parseISOString(date)).slice(0, 6))}</span>`;
  });
  const todayPct = todayMid.getTime() < axisStart ? 0 : todayMid.getTime() > axisEnd ? 100 : posOf(todayMid.getTime());
  dots += `<div class="timeline-today" style="left:${todayPct}%" aria-hidden="true"></div><div class="timeline-today-label" style="left:${todayPct}%">Heute</div>`;
  let months = '';
  let cursor = new Date(minT);
  cursor = dateInMonth(cursor.getFullYear(), cursor.getMonth(), 1);
  if (cursor.getTime() < minT) cursor.setMonth(cursor.getMonth() + 1);
  let guard = 0;
  while (cursor.getTime() <= maxT && guard++ < 120) {
    months += `<span class="timeline-month" style="left:${posOf(cursor.getTime())}%">${escapeHtml(cursor.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }))}</span>`;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return {
    html: `<div class="timeline-track" data-axis-start="${axisStart}" data-axis-end="${axisEnd}" style="width:${trackWidth}px">
      <div class="timeline-progress" id="timeline-progress-bar" style="width:${todayPct}%"></div>${periodsHtml}${months}${dots}</div>`,
    targetPct: todayPct, dotEvents: mainEvents
  };
}

function renderHero(upcoming, todayMid) {
  const el = document.getElementById('hero');
  const item = upcoming[0];
  if (!item) {
    el.className = 'hero';
    el.innerHTML = `<div class="hero-label">Als Nächstes</div><div class="hero-empty">${ICONS.check}<span>Keine offenen Termine</span></div>`;
    return;
  }
  const d = parseISOString(item.date);
  const diffDays = calendarDayDiff(d, todayMid);
  el.className = `hero ${diffDays <= 7 ? 'urgent' : ''} ${diffDays <= 3 ? 'imminent' : ''}`;
  const count = diffDays === 0 ? 'Heute' : diffDays === 1 ? 'Morgen' : diffDays;
  const activePeriods = periodsOnDay(todayMid, periods);
  el.innerHTML = `
    <h2 class="hero-label">Als Nächstes</h2>
    <div class="hero-main">
      <div class="hero-countdown"><span class="hero-number ${diffDays < 2 ? 'word' : ''}">${count}</span>${diffDays > 1 ? '<span class="hero-unit">Tage</span>' : ''}</div>
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
        <span class="hero-next-info"><span class="hero-next-title">${escapeHtml(e.title)}</span><span class="hero-next-date">${escapeHtml(formatDate(parseISOString(e.date)))}</span></span>
        <span class="hero-next-days">${days === 0 ? 'Heute' : days === 1 ? 'Morgen' : `in ${days} Tagen`}</span>
      </button>`;
    }).join('')}</div>` : ''}
    ${activePeriods.map(p => {
      const day = calendarDayDiff(todayMid, parseISOString(p.start)) + 1;
      const total = calendarDayDiff(parseISOString(p.end), parseISOString(p.start)) + 1;
      return `<div class="hero-period" style="--period-rgb:${p.rgb}"><span>${escapeHtml(p.label)} · Tag ${day} von ${total}</span><div class="mini-progress" role="progressbar" aria-label="${escapeHtml(p.label)}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${day}"><span style="width:${day / total * 100}%"></span></div></div>`;
    }).join('')}
  `;
  el.querySelectorAll('.hero-next').forEach(button => {
    button.addEventListener('click', () => selectTimelineEvent(null, button.dataset.eventId));
  });
}

const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni',
                     'Juli','August','September','Oktober','November','Dezember'];

function toggleCalendar() {
  calVisible = !calVisible;
  document.getElementById('calendar-section').hidden = !calVisible;
  const toggleBtn = document.getElementById('cal-toggle-btn');
  toggleBtn.classList.toggle('active', calVisible);
  toggleBtn.setAttribute('aria-expanded', String(calVisible));
  if (calVisible) renderCalendar();
}

function calNav(delta) {
  let nextMonth = calMonth + delta;
  let nextYear = calYear;
  if (nextMonth > 11) { nextMonth = 0; nextYear++; }
  if (nextMonth < 0)  { nextMonth = 11; nextYear--; }

  const nextMonthIndex = monthIndex(nextYear, nextMonth);
  if (nextMonthIndex < CAL_MIN_MONTH_INDEX || nextMonthIndex > CAL_MAX_MONTH_INDEX) return;

  calMonth = nextMonth;
  calYear = nextYear;
  selectedCalDate = null;
  closeCalMenu();
  renderCalendar();
}

function renderSelectedCalDay(byDate) {
  const panel = document.getElementById('cal-day-details');
  panel.hidden = !selectedCalDate;
  if (!selectedCalDate) {
    panel.innerHTML = '';
    return;
  }

  const selectedDate = parseISOString(selectedCalDate);
  const dayEvents = byDate.get(selectedCalDate) || [];
  const dayPeriods = periodsOnDay(midnight(selectedDate), periods);
  const periodHtml = dayPeriods.map(p => `
    <span class="cal-day-period" style="--period-rgb:${p.rgb}">
      ${escapeHtml(p.label)}
    </span>`).join('');

  panel.innerHTML = `
    <div class="cal-day-details-head">
      <h4 id="cal-day-details-title">Termine am ${formatDate(selectedDate)}</h4>
      <button class="cal-day-details-close" type="button" aria-label="Tagesübersicht schließen">${ICONS.close}</button>
    </div>
    ${periodHtml ? `<div class="cal-day-periods" aria-label="Zeiträume an diesem Tag">${periodHtml}</div>` : ''}
    ${dayEvents.length ? `<div class="cal-day-events">
      ${dayEvents.map(e => {
        const isDone = e.type === 'Abgabe' && doneItems.includes(e.id);
        const status = e.isCancelled ? 'Abgebrochen' : isDone ? 'Erledigt' : e.type === 'Abgabe' ? 'Offen' : '';
        return `<button class="cal-day-event ${e.calOnly ? 'cal-only' : typeClass(e.type)} ${e.isCancelled ? 'cancelled' : ''}" type="button"
          aria-label="${escapeHtml(e.type)}: ${escapeHtml(e.title)}, ${escapeHtml(e.time)}${status ? ', ' + status : ''}. Termindetails öffnen">
          <span class="cal-day-event-main">
            <span class="cal-day-event-type">${ICONS[e.type]}${e.calOnly ? 'Nur im Kalender' : escapeHtml(e.type)}</span>
            <span class="cal-day-event-title">${escapeHtml(e.title)}</span>
          </span>
          <span class="cal-day-event-meta">
            <span>${ICONS.clock}${escapeHtml(e.time)}</span>
            ${status ? `<span class="cal-day-event-status ${isDone && !e.isCancelled ? 'done' : ''}">${status}</span>` : ''}
          </span>
        </button>`;
      }).join('')}
    </div>` : '<p class="cal-day-empty">Keine Termine an diesem Tag.</p>'}
  `;

  panel.querySelector('.cal-day-details-close').addEventListener('click', () => {
    selectedCalDate = null;
    closeCalMenu();
    renderCalendar();
  });
  panel.querySelectorAll('.cal-day-event').forEach((button, index) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openCalMenu(button, dayEvents[index]);
    });
  });
}

function renderCalendar() {
  const today = midnight(new Date());

  document.getElementById('cal-month-label').textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;

  const currentMonthIndex = monthIndex(calYear, calMonth);
  const isMinDate = currentMonthIndex <= CAL_MIN_MONTH_INDEX;
  const isMaxDate = currentMonthIndex >= CAL_MAX_MONTH_INDEX;

  document.getElementById('cal-prev').disabled = isMinDate;
  document.getElementById('cal-next').disabled = isMaxDate;

  const monthStart = dateInMonth(calYear, calMonth, 1);
  const monthEnd   = dateInMonth(calYear, calMonth + 1, 0);
  const overlappingPeriods = periods.filter(p => {
    const s = midnight(parseISOString(p.start));
    const e = midnight(parseISOString(p.end));
    return monthEnd >= s && monthStart <= e;
  });
  document.getElementById('cal-period-indicators').innerHTML = overlappingPeriods.map(p => `
    <span class="cal-period-indicator" style="--period-rgb:${p.rgb}">
      <span class="cal-period-dot-sm" style="background:rgb(${p.rgb})"></span>${escapeHtml(p.label)}
    </span>`).join('');

  const byDate = new Map();
  events.forEach(e => {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e);
  });

  const first = dateInMonth(calYear, calMonth, 1);
  let start = new Date(first);
  let dow = start.getDay();
  if (dow === 0) dow = 7;
  start.setDate(start.getDate() - (dow - 1));

  let html = '<div class="cal-week cal-week-head" role="row">' + ['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => `<div class="cal-day-header" role="columnheader">${d}</div>`).join('') + '</div>';
  const tagEvents = [];
  for (let week = 0; week < 6; week++) {
    const weekStart = new Date(start); weekStart.setDate(weekStart.getDate() + week * 7);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
    const weekPeriods = periods.filter(p => parseISOString(p.end) >= weekStart && parseISOString(p.start) <= weekEnd);
    html += `<div class="cal-week" role="row" style="--period-rows:${weekPeriods.length}">`;
    for (let weekday = 0; weekday < 7; weekday++) {
      const cur = new Date(weekStart); cur.setDate(cur.getDate() + weekday);
      const iso = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;
      const inMonth = cur.getMonth() === calMonth;
      const isToday = cur.getTime() === today.getTime();
      const dayEvts = byDate.get(iso) || [];
      const count = dayEvts.length;
      const countLabel = `${count} ${count === 1 ? 'Termin' : 'Termine'}`;
      const numHtml = `<span class="cal-day-num"><span class="cal-day-num-inner">${cur.getDate()}</span></span>`;
      const mobileDots = dayEvts.slice(0,3).map(e => `<span class="cal-mobile-dot ${e.calOnly ? 'cal-only' : typeClass(e.type)}" aria-hidden="true"></span>`).join('');
      const dayButton = `<button class="cal-day-select" type="button" data-date="${iso}" aria-label="${escapeHtml(formatDate(cur))}: ${countLabel} anzeigen" aria-controls="cal-day-details" aria-expanded="${selectedCalDate === iso}">${numHtml}<span class="cal-day-dots" aria-hidden="true">${mobileDots}</span></button>`;
      const tagsHtml = dayEvts.slice(0,3).map(e => {
        tagEvents.push(e);
        return `<button type="button" class="cal-event-tag ${e.calOnly ? 'cal-only' : typeClass(e.type)} ${e.isCancelled ? 'cancelled' : ''}" aria-label="${escapeHtml(e.title)}, ${escapeHtml(e.time)}${e.isCancelled ? ', abgebrochen' : ''}. Termindetails öffnen">${escapeHtml(e.title)}<span class="cal-event-time">${escapeHtml(e.time)}</span></button>`;
      }).join('');
      html += `<div class="cal-day ${inMonth ? '' : 'other-month'} ${weekday >= 5 ? 'weekend' : ''} ${isToday ? 'today' : ''} ${selectedCalDate === iso ? 'selected' : ''}" role="gridcell">
        ${dayButton}<span class="cal-band-space" aria-hidden="true"></span>${tagsHtml}${count > 3 ? `<button class="cal-more" type="button" data-date="${iso}" aria-label="Alle ${count} Termine am ${escapeHtml(formatDate(cur))} anzeigen" aria-controls="cal-day-details">+${count - 3}</button>` : ''}</div>`;
    }
    weekPeriods.forEach((p, row) => {
      const left = Math.max(0, calendarDayDiff(parseISOString(p.start), weekStart));
      const right = Math.min(6, calendarDayDiff(parseISOString(p.end), weekStart));
      html += `<div class="cal-period-band ${left > 0 ? 'starts' : ''} ${right < 6 ? 'ends' : ''}" style="--period-rgb:${p.rgb};left:calc(${left} * 100% / 7 + 2px);width:calc(${right-left+1} * 100% / 7 - 4px);top:calc(48px + ${row} * 22px)"><span>${escapeHtml(p.label)}</span></div>`;
    });
    html += '</div>';
  }

  document.getElementById('cal-grid').innerHTML = html;
  document.querySelectorAll('#cal-grid .cal-day-select[data-date], #cal-grid .cal-more[data-date]').forEach(button => {
    button.addEventListener('click', () => {
      selectedCalDate = selectedCalDate === button.dataset.date ? null : button.dataset.date;
      closeCalMenu();
      renderCalendar();
      document.querySelector(`#cal-grid .cal-day-select[data-date="${button.dataset.date}"]`)?.focus({ preventScroll: true });
    });
  });
  document.querySelectorAll('#cal-grid .cal-event-tag').forEach((tag, index) => {
    tag.addEventListener('click', (event) => {
      event.stopPropagation();
      openCalMenu(tag, tagEvents[index]);
    });
  });
  renderSelectedCalDay(byDate);
}

function buildLegendPeriods() {
  const legend = document.getElementById('cal-legend');
  const timelineLegend = document.getElementById('timeline-legend');
  timelineLegend.innerHTML = ['Prüfung', 'Abgabe', 'Termin'].map(type => `<span class="cal-legend-item"><span class="cal-legend-dot ${typeClass(type)}" aria-hidden="true"></span>${escapeHtml(type)}</span>`).join('') + periods.filter((p, i, all) => all.findIndex(other => other.label === p.label) === i).map(p => `<span class="cal-legend-item"><span class="period-swatch" style="--period-rgb:${p.rgb}" aria-hidden="true"></span>${escapeHtml(p.label)}</span>`).join('');
  periods.forEach(p => {
    const item = document.createElement('div');
    item.className = 'cal-legend-item';
    item.innerHTML = `<span class="cal-legend-period-swatch" style="background:rgb(${p.rgb})"></span>${escapeHtml(p.label)}-Zeitraum (${formatDate(parseISOString(p.start))} – ${formatDate(parseISOString(p.end))})`;
    legend.appendChild(item);
  });
}

function focusAfterRender() {
  const active = document.activeElement;
  const card = active.closest('#list .card');
  if (card && active.matches('input[type="checkbox"]')) {
    return () => document.getElementById(card.id)?.querySelector('input[type="checkbox"]');
  }

  const dot = active.closest('#timeline-container .timeline-dot');
  if (dot) {
    return () => [...document.querySelectorAll('#timeline-container .timeline-dot')]
      .find(button => button.dataset.eventId === dot.dataset.eventId);
  }

  const day = active.closest('#cal-grid .cal-day-select[data-date]');
  if (day) {
    return () => [...document.querySelectorAll('#cal-grid .cal-day-select[data-date], #cal-grid .cal-more[data-date]')]
      .find(button => button.dataset.date === day.dataset.date);
  }

  if (active.closest('#cal-day-details')) {
    const index = [...document.querySelectorAll('#cal-day-details button')].indexOf(active);
    return () => document.querySelectorAll('#cal-day-details button')[index];
  }

  return null;
}

function centerTimelineToday() {
  const scroller = document.querySelector('.timeline-scroll');
  const track = document.querySelector('.timeline-track');
  const today = document.querySelector('.timeline-today');
  if (!track || !today) return;
  const x = track.offsetLeft + today.offsetLeft;
  scroller.scrollLeft = Math.max(0, Math.min(scroller.scrollWidth - scroller.clientWidth, x - scroller.clientWidth / 2));
}

function renderPreservingState() {
  const restoreFocus = focusAfterRender();
  const pageX = window.scrollX;
  const pageY = window.scrollY;
  const timelineScroll = document.querySelector('.timeline-scroll');
  const timelineLeft = timelineScroll.scrollLeft;
  const calendarScroll = document.querySelector('.cal-scroll');
  const calendarLeft = calendarScroll.scrollLeft;

  render(false);

  let focusFallback = false;
  if (restoreFocus) {
    const target = restoreFocus();
    if (target) target.focus({ preventScroll: true });
    else focusFallback = true;
  }
  if (timelineScroll.scrollLeft !== timelineLeft) timelineScroll.scrollLeft = timelineLeft;
  if (calendarScroll.scrollLeft !== calendarLeft) calendarScroll.scrollLeft = calendarLeft;
  if (window.scrollX !== pageX || window.scrollY !== pageY) window.scrollTo(pageX, pageY);
  if (focusFallback) document.getElementById('toggle-past-btn').focus();
}

const localDayKey = date => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
let renderedDay = null;
let dayTimer;

function render(animate) {
  const today    = new Date();
  const todayMid = midnight(today);
  renderedDay = localDayKey(today);
  document.getElementById('today-date').textContent = today.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const mainEvents = events.filter(e => !e.calOnly);
  const sorted   = [...mainEvents].sort((a, b) => parseISOString(a.date) - parseISOString(b.date));

  const upcoming = sorted.filter(e => {
    const diff = calendarDayDiff(parseISOString(e.date), todayMid);
    return diff >= 0 && !e.isCancelled && !(e.type === 'Abgabe' && doneItems.includes(e.id));
  });
  renderHero(upcoming, todayMid);

  const tl = buildTimeline(todayMid, animate);
  const timelineContainer = document.getElementById('timeline-container');
  timelineContainer.innerHTML = tl.html;
  timelineContainer.querySelectorAll('.timeline-dot').forEach((dot, index) => {
    const item = tl.dotEvents[index];
    dot.addEventListener('click', () => selectTimelineEvent(dot, item.id));

  });
  if (animate) centerTimelineToday();

  const abgaben     = mainEvents.filter(e => e.type === 'Abgabe');
  const abgabenDone = abgaben.filter(e => doneItems.includes(e.id)).length;
  const next7       = sorted.filter(e => {
    const diff = calendarDayDiff(parseISOString(e.date), todayMid);
    return diff >= 0 && diff <= 7 && !e.isCancelled;
  }).length;

  document.getElementById('stats-line').innerHTML =
    `<div class="stat-tile"><span class="stat-label">Termine</span><strong class="stat-value">${mainEvents.filter(e => !e.isCancelled).length}</strong><span class="stat-note">ohne abgebrochene</span></div>
     <div class="stat-tile"><span class="stat-label">Abgaben erledigt</span><strong class="stat-value">${abgabenDone}<span class="stat-total"> / ${abgaben.length}</span></strong><div class="mini-progress" role="progressbar" aria-label="Abgaben erledigt" aria-valuemin="0" aria-valuemax="${abgaben.length || 1}" aria-valuenow="${abgabenDone}"><span style="width:${abgaben.length ? abgabenDone / abgaben.length * 100 : 0}%"></span></div></div>
     <div class="stat-tile"><span class="stat-label">In den nächsten 7 Tagen</span><strong class="stat-value">${next7}</strong><span class="stat-note">heute eingeschlossen</span></div>`;

  const listEl = document.getElementById('list');
  listEl.innerHTML = '';
  
  // Filter-Logik für die Liste
  const visibleEvents = sorted.filter(item => {
    const d = parseISOString(item.date);
    const diffDays = calendarDayDiff(d, todayMid);
    
    // Wenn showPast false ist und das Datum in der Vergangenheit liegt, ausblenden
    if (!showPast && diffDays < 0) return false;
    
    return typeFilter === 'all' || item.type === typeFilter;
  });

  if (visibleEvents.length === 0) {
    listEl.innerHTML = `<div class="empty-state">Keine ${typeFilter === 'all' ? 'Termine' : typeFilter === 'Prüfung' ? 'Prüfungen' : typeFilter === 'Abgabe' ? 'Abgaben' : 'Termine'} in dieser Ansicht.</div>`;
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
  let currentGroup = null;
  let groupList;
  orderedEvents.forEach((item, idx) => {
    const group = groupFor(item);
    if (group !== currentGroup) {
      currentGroup = group;
      const section = document.createElement('div');
      section.className = 'appointment-group';
      section.setAttribute('role', 'listitem');
      const headingId = `appointment-group-${idx}`;
      section.innerHTML = `<h3 id="${headingId}" class="group-heading">${escapeHtml(group)}</h3><div class="group-list" role="list" aria-labelledby="${headingId}"></div>`;
      groupList = section.querySelector('.group-list');
      listEl.appendChild(section);
    }
    const d        = parseISOString(item.date);
    const diffDays = calendarDayDiff(d, todayMid);
    const diffWeeks = (diffDays / 7).toFixed(1).replace('.', ',');
    const isAbgabe = item.type === 'Abgabe';
    const isDone   = isAbgabe && doneItems.includes(item.id);

    let countdownClass = '', countdownContent = '';
    if (item.isCancelled) {
      countdownClass   = 'cancelled-badge';
      countdownContent = `<span class="primary">${ICONS.cancelled}Abgebrochen</span><span class="secondary">nicht angetreten</span>`;
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
      countdownContent = `<span class="primary countdown-number">${diffDays}</span><span class="countdown-unit">Tag${diffDays !== 1 ? 'e' : ''}</span><span class="secondary">${diffWeeks} Wochen</span>`;
    }

    const checkElement = isAbgabe
      ? `<label class="done-toggle"><input type="checkbox" ${isDone ? 'checked' : ''} aria-label="${escapeHtml(item.title)} erledigt"><span>${isDone ? 'Erledigt' : 'Abhaken'}</span></label>`
      : '';

    const card = document.createElement('div');
    card.className = `card ${typeClass(item.type)} ${diffDays < 0 ? 'past' : ''} ${isDone ? 'done' : ''} ${item.isCancelled ? 'cancelled' : ''} ${animate ? 'enter' : ''}`;
    card.id = `card-${item.id}`;
    card.setAttribute('role', 'listitem');
    if (animate) card.style.setProperty('--delay', (idx * 0.035) + 's');
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-left">
          <div class="type-icon ${typeClass(item.type)}">${ICONS[item.type]}</div>
          <div class="info">
            <span class="badge ${typeClass(item.type)}">${escapeHtml(item.type)}</span>
            <h4 class="title">${escapeHtml(item.title)}</h4>
            <div class="meta"><span>${ICONS.calendar}${escapeHtml(formatDate(d))}</span><span>${ICONS.clock}${escapeHtml(item.time)}</span></div>
          </div>
        </div>
        <div class="countdown ${countdownClass}">${countdownContent}</div>
      </div>
      ${checkElement}
    `;
    if (isAbgabe) {
      card.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleDone(item.id));
    }
    groupList.appendChild(card);
  });

  if (calVisible) renderCalendar();
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

document.getElementById('cal-toggle-btn').innerHTML = ICONS.calendar + ' Kalender';
document.getElementById('cal-prev').innerHTML = ICONS.left;
document.getElementById('cal-next').innerHTML = ICONS.right;

document.getElementById('cal-toggle-btn').addEventListener('click', toggleCalendar);
document.getElementById('cal-prev').addEventListener('click', () => calNav(-1));
document.getElementById('cal-next').addEventListener('click', () => calNav(+1));

// Filter für vergangene Termine.
const togglePastBtn = document.getElementById('toggle-past-btn');
function updatePastToggle() {
  togglePastBtn.textContent = showPast ? 'Vergangene ausblenden' : 'Vergangene anzeigen';
  togglePastBtn.classList.toggle('active', showPast);
  togglePastBtn.setAttribute('aria-pressed', String(showPast));
}
togglePastBtn.addEventListener('click', () => {
  showPast = !showPast;
  updatePastToggle();
  renderPreservingState();
});

function updateTypeFilter() {
  document.querySelectorAll('#type-filter button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === typeFilter));
  });
}
document.querySelectorAll('#type-filter button').forEach(button => {
  button.addEventListener('click', () => {
    typeFilter = button.dataset.filter;
    updateTypeFilter();
    renderPreservingState();
  });
});

(async function init() {
  buildLegendPeriods();
  await initialiseDoneItems();
  render(true);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshCurrentDay();
  });
  window.addEventListener('pageshow', refreshCurrentDay);
  let timelineWidth = document.getElementById('timeline-container').clientWidth;
  window.addEventListener('resize', () => {
    const width = document.getElementById('timeline-container').clientWidth;
    if (width !== timelineWidth) {
      timelineWidth = width;
      renderPreservingState();
      centerTimelineToday();
    }
  });
  refreshCurrentDay();
})();

