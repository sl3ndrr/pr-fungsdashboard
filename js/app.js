import { batchUpdate, syncHTML, syncChildren, listenOnce, withTransition, transitionName, reducedMotion, motion, enterPage, fadeChange } from './motion.js';
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
  const thumb = themeSwitch.querySelector('.theme-switch-thumb');
  const rect = thumb.getBoundingClientRect();
  withTransition(() => applyTheme(theme, options), {type:'theme', origin:{x:rect.left+rect.width/2,y:rect.top+rect.height/2}});
  requestedTheme=theme;
  motion(thumb,[{scale:'1 1',borderRadius:'50%'},{scale:'1.28 .85',borderRadius:'16px',offset:.35},{scale:'1 1',borderRadius:'50%'}],{speed:'fast'});
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
  if(dot && !reducedMotion.matches) {
    const ring=document.createElement('span');ring.className='ping-ring motion-decoration';ring.setAttribute('aria-hidden','true');dot.append(ring);
    motion(ring,[{scale:'1'},{scale:'2.2'}],{speed:'fast'});
    motion(ring,[{opacity:.4},{opacity:0}],{kind:'effects',speed:'slow'})?.finished.catch(()=>{}).finally(()=>ring.remove());
  }
  const card=document.getElementById(`card-${id}`);
  if(card) {
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

function openCalMenu(anchor, ev) {
  const pop = document.getElementById('cal-popover');
  const alreadyOpen = pop.dataset.open === 'true';
  const isDone = ev.type === 'Abgabe' && doneItems.includes(ev.id);
  const cancelledBadge = ev.isCancelled ? `<div class="cal-popover-cancelled">${ICONS.cancelled}Abgebrochen</div>` : '';

  let actionBtn = '';
  if (ev.type === 'Abgabe') {
    actionBtn = `<button class="cal-popover-btn" type="button">
      ${isDone ? 'Als offen markieren' : ICONS.check + ' Als erledigt markieren'}
    </button>`;
  }

  const popoverHTML = `
    <div class="cal-popover-head">
      <span class="badge ${ev.calOnly ? 'cal-only' : typeClass(ev.type)}">${ICONS[ev.type]}${ev.calOnly ? 'Nur im Kalender' : escapeHtml(ev.type)}</span>
      <button class="cal-popover-close" type="button" aria-label="Termindetails schließen">${ICONS.close}</button>
    </div>
    <div class="cal-popover-title">${escapeHtml(ev.title)}</div>
    <div class="cal-popover-meta">${ICONS.calendar} ${escapeHtml(formatDate(parseISOString(ev.date)))} · ${ICONS.clock} ${escapeHtml(ev.time)}</div>
    ${cancelledBadge}
    ${actionBtn}
  `;
  if(alreadyOpen)fadeChange(pop,()=>syncHTML(pop,popoverHTML));else syncHTML(pop,popoverHTML);
  pop.dataset.eventId=ev.id;
  listenOnce(pop.querySelector('.cal-popover-close'), 'click', closeCalMenu);
  listenOnce(pop.querySelector('.cal-popover-btn'), 'click', () => {
    toggleDone(pop.dataset.eventId);
    closeCalMenu();
  });

  pop.dataset.open='true';pop.inert=false;pop.setAttribute('aria-hidden','false');popoverAnchor=anchor;

  const tRect = anchor.getBoundingClientRect();
  const pRect = pop.getBoundingClientRect();
  let top = tRect.bottom + 6;
  let left = tRect.left;

  if (left + pRect.width > window.innerWidth - 12) left = window.innerWidth - pRect.width - 12;
  if (top + pRect.height > window.innerHeight - 12) top = tRect.top - pRect.height - 6;

  pop.style.top  = `${Math.max(10, top)}px`;
  pop.style.left = `${Math.max(10, left)}px`;
  pop.style.transformOrigin=`${tRect.left+tRect.width/2-Math.max(10,left)}px ${tRect.top+tRect.height/2-Math.max(10,top)}px`;
  pop.querySelector('.cal-popover-close').focus({preventScroll:true});
}

let popoverAnchor;
function closeCalMenu() {
  const pop=document.getElementById('cal-popover'),restore=pop.contains(document.activeElement);
  pop.dataset.open='false';pop.inert=true;pop.setAttribute('aria-hidden','true');
  if(restore)popoverAnchor?.focus({preventScroll:true});
}

document.addEventListener('click', (e) => {
  const pop = document.getElementById('cal-popover');
  if (pop && pop.dataset.open === 'true' && !pop.contains(e.target) && !e.target.closest('.cal-event-tag, .cal-day-event')) {
    closeCalMenu();
  }
});
window.addEventListener('scroll', closeCalMenu, true);
document.addEventListener('keydown',event=>{if(event.key==='Escape' && document.getElementById('cal-popover').dataset.open==='true'){event.preventDefault();closeCalMenu();}});

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
    const description = `${e.type}: ${e.title}, ${escapeHtml(formatDate(parseISOString(e.date)))}, ${e.time}${e.isCancelled ? ', abgebrochen' : ''}`;
    dots += `<button type="button" class="timeline-dot ${typeClass(e.type)} ${e.isCancelled ? 'cancelled' : ''} ${past ? 'past' : ''} "
      style="left:${dotXs[i]}px;--delay:${Math.min(i * .02,.4)}s" data-event-id="${escapeHtml(e.id)}" aria-label="${escapeHtml(description)}" aria-describedby="timeline-tip-${escapeHtml(e.id)}">
      <span class="timeline-point" aria-hidden="true"></span><span class="timeline-tooltip" id="timeline-tip-${escapeHtml(e.id)}" role="tooltip"><strong>${escapeHtml(e.title)}</strong><span>${escapeHtml(formatDate(parseISOString(e.date)))} · ${escapeHtml(e.time)}</span>${e.isCancelled ? '<span>Abgebrochen</span>' : ''}</span>
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
  const count = diffDays === 0 ? 'Heute' : diffDays === 1 ? 'Morgen' : diffDays;
  const activePeriods = periodsOnDay(todayMid, periods);
  syncHTML(el, `
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
      return `<div class="hero-period" style="--period-rgb:${p.rgb}"><span>${escapeHtml(p.label)} · Tag ${day} von ${total}</span><div class="mini-progress" role="progressbar" aria-label="${escapeHtml(p.label)}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${day}"><span style="clip-path:inset(0 ${100 - day / total * 100}% 0 0)"></span></div></div>`;
    }).join('')}
  `);
  el.querySelectorAll('.hero-next').forEach(button => {
    listenOnce(button, 'click', () => selectTimelineEvent(null, button.dataset.eventId));
  });
}

const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni',
                     'Juli','August','September','Oktober','November','Dezember'];

function setExpanded(el,open) {
  el.dataset.open=String(open);el.inert=!open;el.setAttribute('aria-hidden',String(!open));
}
function toggleCalendar() {
  withTransition(()=>{
    calVisible=!calVisible;
    if(calVisible)renderCalendar(true);else closeCalMenu();
    setExpanded(document.getElementById('calendar-section'),calVisible);
    const button=document.getElementById('cal-toggle-btn');
    button.classList.toggle('active',calVisible);button.setAttribute('aria-expanded',String(calVisible));
  },{type:'calendar'});
}

function calNav(delta) {
  withTransition(()=>{
    let nextMonth=calMonth+delta,nextYear=calYear;
    if(nextMonth>11){nextMonth=0;nextYear++;}
    if(nextMonth<0){nextMonth=11;nextYear--;}
    const index=monthIndex(nextYear,nextMonth);
    if(index<CAL_MIN_MONTH_INDEX||index>CAL_MAX_MONTH_INDEX)return;
    calMonth=nextMonth;calYear=nextYear;selectedCalDate=null;closeCalMenu();
    fadeChange(document.getElementById('cal-grid'),()=>renderCalendar(true),{direction:delta});
    fadeChange(document.getElementById('cal-month-label'),()=>{},{direction:delta,axis:'y'});
  },{type:delta>0?'month-forward':'month-back'});
}

function renderSelectedCalDay(byDate) {
  const panel = document.getElementById('cal-day-details');
  const wasOpen=panel.dataset.open==='true';
  if(!selectedCalDate)delete panel.dataset.date;
  setExpanded(panel,!!selectedCalDate);
  if(!selectedCalDate)return;
  const changed=panel.dataset.date!==selectedCalDate;panel.dataset.date=selectedCalDate;

  const selectedDate = parseISOString(selectedCalDate);
  const dayEvents = byDate.get(selectedCalDate) || [];
  const dayPeriods = periodsOnDay(midnight(selectedDate), periods);
  const periodHtml = dayPeriods.map(p => `
    <span class="cal-day-period" style="--period-rgb:${p.rgb}">
      ${escapeHtml(p.label)}
    </span>`).join('');

  const detailsHTML = `<div class="details-inner"><div class="details-content">
    <div class="cal-day-details-head">
      <h4 id="cal-day-details-title">Termine am ${escapeHtml(formatDate(selectedDate))}</h4>
      <button class="cal-day-details-close" type="button" aria-label="Tagesübersicht schließen">${ICONS.close}</button>
    </div>
    ${periodHtml ? `<div class="cal-day-periods" aria-label="Zeiträume an diesem Tag">${periodHtml}</div>` : ''}
    ${dayEvents.length ? `<div class="cal-day-events">
      ${dayEvents.map(e => {
        const isDone = e.type === 'Abgabe' && doneItems.includes(e.id);
        const status = e.isCancelled ? 'Abgebrochen' : isDone ? 'Erledigt' : e.type === 'Abgabe' ? 'Offen' : '';
        return `<button data-event-id="${escapeHtml(e.id)}" class="cal-day-event ${e.calOnly ? 'cal-only' : typeClass(e.type)} ${e.isCancelled ? 'cancelled' : ''}" type="button"
          aria-label="${escapeHtml(e.type)}: ${escapeHtml(e.title)}, ${escapeHtml(e.time)}${status ? ', ' + status : ''}. Termindetails öffnen">
          <span class="cal-day-event-main">
            <span class="cal-day-event-type">${ICONS[e.type]}${e.calOnly ? 'Nur im Kalender' : escapeHtml(e.type)}</span>
            <span class="cal-day-event-title">${escapeHtml(e.title)}</span>
          </span>
          <span class="cal-day-event-meta">
            <span>${ICONS.clock}${escapeHtml(e.time)}</span>
            ${status ? `<span class="cal-day-event-status ${isDone && !e.isCancelled ? 'done' : ''}">${escapeHtml(status)}</span>` : ''}
          </span>
        </button>`;
      }).join('')}
    </div>` : '<p class="cal-day-empty">Keine Termine an diesem Tag.</p>'}
  </div></div>`;
  if(changed && wasOpen && panel.hasChildNodes())fadeChange(panel,()=>syncHTML(panel,detailsHTML));else syncHTML(panel,detailsHTML);

  listenOnce(panel.querySelector('.cal-day-details-close'), 'click', () => {
    const date=selectedCalDate;selectedCalDate=null;closeCalMenu();renderCalendar();
    document.querySelector(`#cal-grid .cal-day-select[data-date="${date}"]`)?.focus({preventScroll:true});
  });
  panel.querySelectorAll('.cal-day-event').forEach((button, index) => {
    if(changed){motion(button,[{translate:'0 8px'},{translate:'0 0'}],{delay:Math.min(index*25,250)});motion(button,[{opacity:0},{opacity:1}],{kind:'effects',delay:Math.min(index*25,250)});}
    listenOnce(button, 'click', (event) => {
      event.stopPropagation();
      openCalMenu(button, events.find(e=>e.id===button.dataset.eventId));
    });
  });
}

function renderCalendar(animate = false) {
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
  syncHTML(document.getElementById('cal-period-indicators'), overlappingPeriods.map(p => `
    <span class="cal-period-indicator" style="--period-rgb:${p.rgb}">
      <span class="cal-period-dot-sm" style="background:rgb(${p.rgb})"></span>${escapeHtml(p.label)}
    </span>`).join(''));

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
    html += `<div class="cal-week" role="row" data-key="week-${week}" style="--period-rows:${weekPeriods.length}">`;
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
        return `<button type="button" class="cal-event-tag ${e.calOnly ? 'cal-only' : typeClass(e.type)} ${e.isCancelled ? 'cancelled' : ''}" data-event-id="${escapeHtml(e.id)}" aria-label="${escapeHtml(e.title)}, ${escapeHtml(e.time)}${e.isCancelled ? ', abgebrochen' : ''}. Termindetails öffnen">${escapeHtml(e.title)}<span class="cal-event-time">${escapeHtml(e.time)}</span></button>`;
      }).join('');
      html += `<div class="cal-day ${inMonth ? '' : 'other-month'} ${weekday >= 5 ? 'weekend' : ''} ${isToday ? 'today' : ''} ${selectedCalDate === iso ? 'selected' : ''}" role="gridcell">
        ${dayButton}<span class="cal-band-space" aria-hidden="true"></span>${tagsHtml}${count > 3 ? `<button class="cal-more" type="button" data-date="${iso}" aria-label="Alle ${count} Termine am ${escapeHtml(formatDate(cur))} anzeigen" aria-controls="cal-day-details">+${count - 3}</button>` : ''}</div>`;
    }
    weekPeriods.forEach((p, row) => {
      const left = Math.max(0, calendarDayDiff(parseISOString(p.start), weekStart));
      const right = Math.min(6, calendarDayDiff(parseISOString(p.end), weekStart));
      html += `<div data-key="band-${week}-${p.id}" class="cal-period-band ${parseISOString(p.start) >= weekStart ? 'starts' : ''} ${parseISOString(p.end) <= weekEnd ? 'ends' : ''}" style="--period-rgb:${p.rgb};left:calc(${left} * 100% / 7 + 2px);width:calc(${right-left+1} * 100% / 7 - 4px);top:calc(48px + ${row} * 22px)"><span>${escapeHtml(p.label)}</span></div>`;
    });
    html += '</div>';
  }

  syncHTML(document.getElementById('cal-grid'),html);
  document.querySelectorAll('#cal-grid .cal-day-select[data-date], #cal-grid .cal-more[data-date]').forEach(button => {
    listenOnce(button, 'click', () => {
      selectedCalDate = selectedCalDate === button.dataset.date ? null : button.dataset.date;
      closeCalMenu();
      renderCalendar();
      document.querySelector(`#cal-grid .cal-day-select[data-date="${button.dataset.date}"]`)?.focus({ preventScroll: true });
    });
  });
  document.querySelectorAll('#cal-grid .cal-event-tag').forEach((tag, index) => {
    listenOnce(tag, 'click', (event) => {
      event.stopPropagation();
      openCalMenu(tag, events.find(e=>e.id===tag.dataset.eventId));
    });
  });
  renderSelectedCalDay(byDate);
  if(animate)document.querySelectorAll('.cal-period-band').forEach((band,index)=>motion(band,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{speed:'slow',delay:Math.min(index*25,250)}));
}

function buildLegendPeriods() {
  const legend = document.getElementById('cal-legend');
  const timelineLegend = document.getElementById('timeline-legend');
  timelineLegend.innerHTML = ['Prüfung', 'Abgabe', 'Termin'].map(type => `<span class="cal-legend-item"><span class="cal-legend-dot ${typeClass(type)}" aria-hidden="true"></span>${escapeHtml(type)}</span>`).join('') + periods.filter((p, i, all) => all.findIndex(other => other.label === p.label) === i).map(p => `<span class="cal-legend-item"><span class="period-swatch" style="--period-rgb:${p.rgb}" aria-hidden="true"></span>${escapeHtml(p.label)}</span>`).join('');
  periods.forEach(p => {
    const item = document.createElement('div');
    item.className = 'cal-legend-item';
    item.innerHTML = `<span class="cal-legend-period-swatch" style="background:rgb(${p.rgb})"></span>${escapeHtml(p.label)}-Zeitraum (${escapeHtml(formatDate(parseISOString(p.start)))} – ${escapeHtml(formatDate(parseISOString(p.end)))})`;
    legend.appendChild(item);
  });
}

function focusAfterRender() {
  const active = document.activeElement;
  const card = active.closest('#list .card');
  if (card && active.matches('input[type="checkbox"]')) {
    return () => document.getElementById(card.id)?.querySelector('input[type="checkbox"]');
  }

  const heroNext = active.closest('.hero-next');
  if (heroNext) {
    return () => [...document.querySelectorAll('.hero-next')].find(button => button.dataset.eventId === heroNext.dataset.eventId);
  }
  const dot = active.closest('#timeline-container .timeline-dot');
  if (dot) {
    return () => [...document.querySelectorAll('#timeline-container .timeline-dot')]
      .find(button => button.dataset.eventId === dot.dataset.eventId);
  }

  const calendarTag = active.closest('#cal-grid .cal-event-tag');
  if (calendarTag) {
    return () => [...document.querySelectorAll('#cal-grid .cal-event-tag')]
      .find(button => button.dataset.eventId === calendarTag.dataset.eventId);
  }
  const day = active.closest('#cal-grid .cal-day-select[data-date], #cal-grid .cal-more[data-date]');
  if (day) {
    const selector = day.matches('.cal-more') ? '.cal-more' : '.cal-day-select';
    return () => [...document.querySelectorAll(`#cal-grid ${selector}[data-date]`)]
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

function renderPreservingState(animate = false) {
  const restoreFocus = focusAfterRender();
  const pageX = window.scrollX;
  const pageY = window.scrollY;
  const timelineScroll = document.querySelector('.timeline-scroll');
  const timelineLeft = timelineScroll.scrollLeft;
  const calendarScroll = document.querySelector('.cal-scroll');
  const calendarLeft = calendarScroll.scrollLeft;

  batchUpdate(()=>render(animate));

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
  const tl=buildTimeline(todayMid,animate);
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
  renderHero(upcoming, todayMid, animate);

  const timelineContainer = document.getElementById('timeline-container');
  syncHTML(timelineContainer,tl.html);
  timelineContainer.querySelectorAll('.timeline-dot').forEach((dot, index) => {
    const item = tl.dotEvents[index];
    listenOnce(dot, 'click', () => selectTimelineEvent(dot, item.id));
    const positionTooltip = () => {
      const bounds = document.querySelector('.timeline-scroll').getBoundingClientRect();
      const rect = dot.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const center = Math.max(bounds.left + 114, Math.min(bounds.right - 114, x));
      dot.style.setProperty('--tooltip-shift', `${center - x}px`);
    };
    listenOnce(dot, 'pointerenter', positionTooltip);
    listenOnce(dot, 'focus', positionTooltip);

  });

  if (animate) centerTimelineToday();

  const abgaben     = mainEvents.filter(e => e.type === 'Abgabe');
  const abgabenDone = abgaben.filter(e => doneItems.includes(e.id)).length;
  const next7       = sorted.filter(e => {
    const diff = calendarDayDiff(parseISOString(e.date), todayMid);
    return diff >= 0 && diff <= 7 && !e.isCancelled;
  }).length;

  syncHTML(document.getElementById('stats-line'),
    `<div class="stat-tile"><span class="stat-label">Termine</span><strong class="stat-value">${mainEvents.filter(e => !e.isCancelled).length}</strong><span class="stat-note">ohne abgebrochene</span></div>
     <div class="stat-tile"><span class="stat-label">Abgaben erledigt</span><strong class="stat-value">${abgabenDone}<span class="stat-total"> / ${abgaben.length}</span></strong><div class="mini-progress" role="progressbar" aria-label="Abgaben erledigt" aria-valuemin="0" aria-valuemax="${abgaben.length || 1}" aria-valuenow="${abgabenDone}"><span style="clip-path:inset(0 ${100 - (abgaben.length ? abgabenDone / abgaben.length : 0) * 100}% 0 0)"></span></div></div>
     <div class="stat-tile"><span class="stat-label">In den nächsten 7 Tagen</span><strong class="stat-value">${next7}</strong><span class="stat-note">heute eingeschlossen</span></div>`);

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
  let currentGroup = null;
  let groupList;
  orderedEvents.forEach((item, idx) => {
    const group = groupFor(item);
    if (group !== currentGroup) {
      currentGroup = group;
      const section = document.createElement('div');
      section.className = 'appointment-group';
      section.dataset.key=group;
      section.setAttribute('role', 'listitem');
      const headingId=transitionName(group,'group');
      section.innerHTML = `<h3 id="${headingId}" class="group-heading" style="view-transition-name:${transitionName(group, 'heading')}">${escapeHtml(group)}</h3><div class="group-list" role="list" aria-labelledby="${headingId}"></div>`;
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
      ? `<label class="done-toggle"><input type="checkbox" ${isDone ? 'checked' : ''} aria-label="${escapeHtml(item.title)} erledigt"><svg class="check-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${isDone ? 'Erledigt' : 'Abhaken'}</span></label>`
      : '';

    const card = document.createElement('div');
    card.className = `card ${typeClass(item.type)} ${diffDays < 0 ? 'past' : ''} ${isDone ? 'done' : ''} ${item.isCancelled ? 'cancelled' : ''} `;
    card.id = `card-${item.id}`;
    card.style.viewTransitionName=transitionName(item.id);
    card.setAttribute('role', 'listitem');
    if (animate) card.style.setProperty('--delay', Math.min(idx * 0.025, 0.15) + 's');
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-left">
          <div class="type-icon ${typeClass(item.type)}">${ICONS[item.type]}</div>
          <div class="info">
            <span class="badge ${typeClass(item.type)}">${escapeHtml(item.type)}</span>
            <h4 class="title"><span class="title-text">${escapeHtml(item.title)}</span></h4>
            <div class="meta"><span>${ICONS.calendar}${escapeHtml(formatDate(d))}</span><span>${ICONS.clock}${escapeHtml(item.time)}</span></div>
          </div>
        </div>
        <div class="countdown ${countdownClass}">${countdownContent}</div>
      </div>
      ${checkElement}
    `;

    groupList.appendChild(card);
  });

  syncChildren(listTarget,listEl);
  listTarget.querySelectorAll('.done-toggle input').forEach(input=>listenOnce(input,'change',()=>toggleDone(input.closest('.card').id.slice(5))));
  if(calVisible)renderCalendar();
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
  if (!document.hidden && localDayKey(new Date()) !== renderedDay)withTransition(()=>renderPreservingState(true),{type:'day'});
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
  buildLegendPeriods();
  await initialiseDoneItems();
  render(true);
  updateFilterIndicator();
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


function updateFilterIndicator() {
  const group=document.getElementById('type-filter');
  let indicator=group.querySelector('.filter-indicator');
  if(!indicator){indicator=document.createElement('span');indicator.className='filter-indicator';indicator.setAttribute('aria-hidden','true');group.prepend(indicator);}
  const selected=group.querySelector('[aria-pressed="true"]'),x=selected.offsetLeft,width=selected.offsetWidth;
  if(reducedMotion.matches&&indicator.style.getPropertyValue('--indicator-x')!==`${x}px`)motion(indicator,[{opacity:0},{opacity:1}],{kind:'effects',speed:'fast'});
  indicator.style.setProperty('--indicator-x',`${x}px`);indicator.style.setProperty('--indicator-width',`${width}px`);
}
new ResizeObserver(updateFilterIndicator).observe(document.getElementById('type-filter'));
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
    if(!animate&&reducedMotion.matches&&progressValues.get(bar)!==value)motion(fill,[{opacity:0},{opacity:1}],{kind:'effects',speed:'fast'});
    progressValues.set(bar,value);
    if(animate)motion(fill,[{clipPath:'inset(0 100% 0 0)'},{clipPath:fill.style.clipPath}],{speed:'slow'});
  });
}
function enterTimeline() {
  document.querySelectorAll('.timeline-dot').forEach((dot,index)=>{
    const delay=Math.min(index*20,400);motion(dot,[{scale:'0'},{scale:'1'}],{speed:'fast',delay});motion(dot,[{opacity:0},{opacity:1}],{kind:'effects',delay});
  });
  const bar=document.querySelector('.timeline-progress');motion(bar,[{width:'0%'},{width:bar.style.width}],{speed:'slow'});
  motion(document.querySelector('.timeline-today'),[{translate:'0 -16px',scale:'.8'},{translate:'0 0',scale:'1'}]);
  document.querySelectorAll('.timeline-period-span').forEach((band,index)=>motion(band,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{speed:'slow',delay:index*25}));
}

