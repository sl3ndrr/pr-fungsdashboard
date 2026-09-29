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

let doneItems  = [];
let calVisible = false;

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
  render(false);
}

/* Visuelles Feedback beim Auswählen eines Punkts im Zeitstrahl. */
function selectTimelineEvent(dot, id) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    dot.classList.remove('ping');
    void dot.offsetWidth; // Reflow erzwingen
    dot.classList.add('ping');
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
  const cancelledBadge = ev.isCancelled ? '<div class="cal-popover-cancelled">Abgebrochen</div>' : '';

  let actionBtn = '';
  if (ev.type === 'Abgabe') {
    actionBtn = `<button class="cal-popover-btn" type="button">
      ${isDone ? 'Als offen markieren' : '✔ Als erledigt markieren'}
    </button>`;
  }

  pop.innerHTML = `
    <div class="cal-popover-head">
      <span class="badge ${typeClass(ev.type)}">${ev.type}</span>
      <button class="cal-popover-close" type="button">✕</button>
    </div>
    <div class="cal-popover-title">${escapeHtml(ev.title)}</div>
    <div class="cal-popover-meta">📅 ${formatDate(parseISOString(ev.date))} · ⏰ ${escapeHtml(ev.time)}</div>
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
  if (pop && pop.style.display === 'flex' && !pop.contains(e.target) && !e.target.closest('.cal-event-tag')) {
    closeCalMenu();
  }
});
window.addEventListener('scroll', closeCalMenu, true);

function buildTimeline(todayMid, animate) {
  const mainEvents = events.filter(e => !e.calOnly);
  const allTimes = mainEvents.map(e => midnight(parseISOString(e.date)).getTime());
  const periodTimes = periods.flatMap(p => [
    midnight(parseISOString(p.start)).getTime(),
    midnight(parseISOString(p.end)).getTime()
  ]);
  const timelineTimes = [...allTimes, ...periodTimes];
  let minT = Math.min(todayMid.getTime(), ...timelineTimes);
  let maxT = Math.max(todayMid.getTime(), ...timelineTimes);
  const range = (maxT - minT) || 1;
  const pad   = range * 0.04;
  minT -= pad; maxT += pad;
  const span = maxT - minT;
  const posOf = t => ((t - minT) / span) * 100;

  let periodsHtml = '';
  const placedRanges = []; // for simple row-stacking of labels that would otherwise overlap
  periods.forEach(p => {
    const pStartT = midnight(parseISOString(p.start)).getTime();
    const pEndT   = midnight(parseISOString(p.end)).getTime();
    if (pEndT <= minT || pStartT >= maxT) return;
    const pL = Math.max(0, posOf(pStartT));
    const pR = Math.min(100, posOf(pEndT));
    const pW = pR - pL;
    const midPct = (pL + pR) / 2;

    const row = placedRanges.some(r => midPct > r.l - 6 && midPct < r.r + 6) ? 1 : 0;
    placedRanges.push({ l: pL, r: pR });

    periodsHtml += `
      <div class="timeline-period-span" style="left:${pL}%;width:${pW}%;background:rgba(${p.rgb},0.1);border-color:rgba(${p.rgb},0.45)"></div>
      <div class="timeline-period-tick" style="left:${pL}%;background:rgba(${p.rgb},0.45)"></div>
      <div class="timeline-period-tick" style="left:${pR}%;background:rgba(${p.rgb},0.45)"></div>
      <div class="timeline-period-label" data-row="${row}" style="left:${midPct}%;transform:translateX(-50%);color:rgb(${p.rgb})">${escapeHtml(p.label)}</div>
    `;
  });

  let dots = '';
  mainEvents.forEach((e, i) => {
    const t   = midnight(parseISOString(e.date)).getTime();
    const pct = posOf(t);
    const enterCls = animate ? 'enter' : '';
    const delay    = animate ? `--delay:${(0.2 + i * 0.04).toFixed(3)}s;` : '';
    const cancelledCls = e.isCancelled ? 'cancelled' : '';
    const cancelledLabel = e.isCancelled ? ' (abgebrochen)' : '';
    dots += `<div class="timeline-dot ${typeClass(e.type)} ${cancelledCls} ${enterCls}"
                  style="left:${pct}%;${delay}"
                  tabindex="0" role="button"
                  aria-label="${escapeHtml(e.type)}: ${escapeHtml(e.title)} am ${formatDate(parseISOString(e.date))}${cancelledLabel}"
                  title="${escapeHtml(e.title)} – ${formatDate(parseISOString(e.date))}${cancelledLabel}">
             </div>`;
  });

  const todayPct = posOf(todayMid.getTime());
  dots += `<div class="timeline-today" style="left:${todayPct}%"></div>`;
  dots += `<div class="timeline-today-label" style="left:${todayPct}%">Heute</div>`;

  let months = '';
  let cursor = new Date(minT);
  cursor = dateInMonth(cursor.getFullYear(), cursor.getMonth(), 1);
  if (cursor.getTime() < minT) cursor.setMonth(cursor.getMonth() + 1);
  let guard = 0;
  while (cursor.getTime() <= maxT && guard < 24) {
    const pct   = posOf(cursor.getTime());
    const label = cursor.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
    months += `<div class="timeline-month" style="left:${pct}%">${label}</div>`;
    cursor.setMonth(cursor.getMonth() + 1);
    guard++;
  }

  const progressPct = Math.min(100, Math.max(0, todayPct));
  return {
    html: `<div class="timeline-track">
      <div class="timeline-progress" id="timeline-progress-bar" style="width:${animate ? 0 : progressPct}%"></div>
      ${periodsHtml}
      ${months}
      ${dots}
    </div>`,
    targetPct: progressPct,
    dotEvents: mainEvents
  };
}

function renderHero(item, todayMid) {
  const el = document.getElementById('hero');
  if (!item) {
    el.className = 'hero';
    el.innerHTML = `<div class="hero-empty">Keine offenen Termine mehr – geschafft! 🎉</div>`;
    return;
  }
  const d        = parseISOString(item.date);
  const diffDays = calendarDayDiff(d, todayMid);
  const urgent   = diffDays <= 7;
  el.className   = `hero ${urgent ? 'urgent' : ''}`;
  const daysLabel = diffDays === 0 ? 'Heute' : `in ${diffDays} Tag${diffDays !== 1 ? 'en' : ''}`;
  el.innerHTML = `
    <div class="hero-icon ${typeClass(item.type)}">${ICONS[item.type]}</div>
    <div class="hero-text">
      <div class="hero-label">Als Nächstes</div>
      <div class="hero-title">${escapeHtml(item.title)}</div>
      <div class="hero-meta">${formatDate(d)} · ${escapeHtml(item.time)}</div>
    </div>
    <div class="hero-days">${daysLabel}</div>
  `;
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
  renderCalendar();
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
    <span class="cal-period-indicator" style="color:rgb(${p.rgb});background:rgba(${p.rgb},0.1);border-color:rgba(${p.rgb},0.35)">
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

  let html = '';
  const tagEvents = [];
  ['Mo','Di','Mi','Do','Fr','Sa','So'].forEach(d => {
    html += `<div class="cal-day-header">${d}</div>`;
  });

  let cur = new Date(start);
  for (let i = 0; i < 42; i++) {
    const curMid = midnight(cur);
    const iso    = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;
    const inMonth = cur.getMonth() === calMonth;
    const isToday = curMid.getTime() === today.getTime();

    const dayPeriods = periodsOnDay(curMid, periods);
    const activePeriod = dayPeriods[0]; // first matching period wins visually if they ever overlap

    let cls = 'cal-day';
    if (!inMonth) cls += ' other-month';
    if (isToday)  cls += ' today';
    if (activePeriod) cls += ' period';

    let dayStyle = '';
    if (activePeriod) {
      const pStart = midnight(parseISOString(activePeriod.start));
      const pEnd   = midnight(parseISOString(activePeriod.end));
      let borderSide = '';
      if (curMid.getTime() === pStart.getTime()) borderSide = `border-left:3px solid rgb(${activePeriod.rgb});`;
      if (curMid.getTime() === pEnd.getTime())   borderSide += `border-right:3px solid rgb(${activePeriod.rgb});`;
      dayStyle = ` style="background:rgba(${activePeriod.rgb},0.12);border-color:rgba(${activePeriod.rgb},0.35);${borderSide}"`;
    }

    const dayEvts = byDate.get(iso) || [];

    const numHtml = isToday
      ? `<div class="cal-day-num"><span class="cal-day-num-inner">${cur.getDate()}</span></div>`
      : `<div class="cal-day-num">${cur.getDate()}</div>`;

    const tagsHtml = dayEvts.map(e => {
      tagEvents.push(e);
      const cancelledCls = e.isCancelled ? 'cancelled' : '';
      const cancelledLabel = e.isCancelled ? ' (abgebrochen)' : '';
      return `<span class="cal-event-tag ${typeClass(e.type)} ${cancelledCls}" title="${escapeHtml(e.title)} (${escapeHtml(e.time)})${cancelledLabel}">${escapeHtml(e.title)}<span class="cal-event-time">${escapeHtml(e.time)}</span></span>`;
    }).join('');

    html += `<div class="${cls}"${dayStyle}>${numHtml}${tagsHtml}</div>`;
    cur.setDate(cur.getDate() + 1);
  }

  document.getElementById('cal-grid').innerHTML = html;
  document.querySelectorAll('#cal-grid .cal-event-tag').forEach((tag, index) => {
    tag.addEventListener('click', (event) => {
      event.stopPropagation();
      openCalMenu(tag, tagEvents[index]);
    });
  });
}

function buildLegendPeriods() {
  const legend = document.getElementById('cal-legend');
  periods.forEach(p => {
    const item = document.createElement('div');
    item.className = 'cal-legend-item';
    item.innerHTML = `<span class="cal-legend-period-swatch" style="background:rgba(${p.rgb},0.15);border-color:rgba(${p.rgb},0.5)"></span>${escapeHtml(p.label)}-Zeitraum (${formatDate(parseISOString(p.start))} – ${formatDate(parseISOString(p.end))})`;
    legend.appendChild(item);
  });
}

function render(animate) {
  const today    = new Date();
  const todayMid = midnight(today);

  const mainEvents = events.filter(e => !e.calOnly);
  const sorted   = [...mainEvents].sort((a, b) => parseISOString(a.date) - parseISOString(b.date));

  const upcoming = sorted.filter(e => {
    const diff = calendarDayDiff(parseISOString(e.date), todayMid);
    return diff >= 0 && !e.isCancelled && !(e.type === 'Abgabe' && doneItems.includes(e.id));
  });
  renderHero(upcoming[0], todayMid);

  const tl = buildTimeline(todayMid, animate);
  const timelineContainer = document.getElementById('timeline-container');
  timelineContainer.innerHTML = tl.html;
  timelineContainer.querySelectorAll('.timeline-dot').forEach((dot, index) => {
    const item = tl.dotEvents[index];
    dot.addEventListener('click', () => selectTimelineEvent(dot, item.id));
    dot.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectTimelineEvent(dot, item.id);
      }
    });
  });
  if (animate) {
    const bar = document.getElementById('timeline-progress-bar');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (bar) bar.style.width = tl.targetPct + '%';
    }));
  }

  const abgaben     = mainEvents.filter(e => e.type === 'Abgabe');
  const abgabenDone = abgaben.filter(e => doneItems.includes(e.id)).length;
  const next7       = sorted.filter(e => {
    const diff = calendarDayDiff(parseISOString(e.date), todayMid);
    return diff >= 0 && diff <= 7 && !e.isCancelled;
  }).length;

  document.getElementById('stats-line').innerHTML =
    `<b>${mainEvents.filter(e => !e.isCancelled).length}</b> Termine · <b>${abgabenDone}/${abgaben.length}</b> Abgaben erledigt · <b>${next7}</b> in &le; 7 Tagen`;

  const listEl = document.getElementById('list');
  listEl.innerHTML = '';
  
  // Filter-Logik für die Liste
  const visibleEvents = sorted.filter(item => {
    const d = parseISOString(item.date);
    const diffDays = calendarDayDiff(d, todayMid);
    
    // Wenn showPast false ist und das Datum in der Vergangenheit liegt, ausblenden
    if (!showPast && diffDays < 0) return false;
    
    return true;
  });

  if (visibleEvents.length === 0) {
    listEl.innerHTML = `<div class="empty-state">Keine Termine in dieser Ansicht.</div>`;
    return;
  }

  visibleEvents.forEach((item, idx) => {
    const d        = parseISOString(item.date);
    const diffDays = calendarDayDiff(d, todayMid);
    const diffWeeks = (diffDays / 7).toFixed(1).replace('.', ',');
    const isAbgabe = item.type === 'Abgabe';
    const isDone   = isAbgabe && doneItems.includes(item.id);

    let countdownClass = '', countdownContent = '';
    if (item.isCancelled) {
      countdownClass   = 'cancelled-badge';
      countdownContent = `<span class="primary">Abgebrochen</span><span class="secondary">nicht angetreten</span>`;
    } else if (isDone) {
      countdownClass   = 'done-badge';
      countdownContent = `<span class="primary">Erledigt</span><span class="secondary">abgehakt</span>`;
    } else if (diffDays < 0) {
      countdownClass   = 'expired';
      countdownContent = `<span class="primary">Abgelaufen</span><span class="secondary">vor ${Math.abs(diffDays)} Tg.</span>`;
    } else if (diffDays === 0) {
      countdownClass   = 'urgent';
      countdownContent = `<span class="primary">Heute</span><span class="secondary">${escapeHtml(item.time)}</span>`;
    } else {
      if (diffDays <= 7) countdownClass = 'urgent';
      countdownContent = `<span class="primary">${diffDays} Tag${diffDays !== 1 ? 'e' : ''}</span><span class="secondary">${diffWeeks} Wo.</span>`;
    }

    const checkElement = isAbgabe
      ? `<input type="checkbox" ${isDone ? 'checked' : ''} aria-label="${escapeHtml(item.title)} erledigt">`
      : `<div class="dot-marker"></div>`;

    const card = document.createElement('div');
    card.className = `card ${isDone ? 'done' : ''} ${item.isCancelled ? 'cancelled' : ''} ${animate ? 'enter' : ''}`;
    card.id = `card-${item.id}`;
    card.setAttribute('role', 'listitem');
    if (animate) card.style.setProperty('--delay', (idx * 0.035) + 's');
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-left">
          <div class="checkbox-wrapper">${checkElement}</div>
          <div class="info">
            <span class="badge ${typeClass(item.type)}">${item.type}</span>
            <div class="title">${escapeHtml(item.title)}</div>
            <div class="meta">${formatDate(d)} · ${escapeHtml(item.time)}</div>
          </div>
        </div>
        <div class="countdown ${countdownClass}">${countdownContent}</div>
      </div>
    `;
    if (isAbgabe) {
      card.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleDone(item.id));
    }
    listEl.appendChild(card);
  });

  if (calVisible) renderCalendar();
}

document.getElementById('cal-toggle-btn').addEventListener('click', toggleCalendar);
document.getElementById('cal-prev').addEventListener('click', () => calNav(-1));
document.getElementById('cal-next').addEventListener('click', () => calNav(+1));

// Filter für vergangene Termine.
const togglePastBtn = document.getElementById('toggle-past-btn');
togglePastBtn.addEventListener('click', () => {
  showPast = !showPast;
  togglePastBtn.textContent = showPast ? "Vergangene ausblenden" : "Vergangene anzeigen";
  togglePastBtn.classList.toggle('active', showPast);
  render(false);
});

(async function init() {
  buildLegendPeriods();
  await initialiseDoneItems();
  render(true);
  setInterval(() => render(false), 60000);
})();
