import {store} from './state.js';
import {now, simulatedDay} from './clock.js';
import {midnight, sortEvents, upcomingEvents} from './utils.js';
import {batchUpdate, enterPage} from './motion.js';
import {buildTimeline, renderTimelineLegend, renderTimeline, closeTimelineTooltip, enterTimeline} from './timeline.js';
import {renderHero} from './hero.js';
import {renderList} from './list.js';
import {renderStatistics} from './stats.js';
import {updatePastToggle, updateTypeFilter} from './filters.js';
import {enhanceProgress, focusAfterRender} from './ui.js';

export function renderPreservingState(animate = false) {
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
export function render(animate) {
  const current = now();
  const todayMid = midnight(current);
  if (store.prepareSemester(todayMid)) {
    updatePastToggle();
    updateTypeFilter();
    closeTimelineTooltip();
  }
  const {semester, events, doneItems} = store.get();
  document.getElementById('semester-label').textContent = semester.label;
  const tl = buildTimeline(todayMid);
  renderTimelineLegend(tl);
  renderedDay = localDayKey(current);
  document.getElementById('today-date').textContent = current.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const mainEvents = events.filter(e => !e.calOnly);
  const sorted = sortEvents(mainEvents, todayMid, doneItems);

  const upcoming = upcomingEvents(mainEvents, todayMid, doneItems);
  renderHero(upcoming, todayMid, animate);

  renderTimeline(tl);



  renderStatistics(mainEvents, todayMid, doneItems);


  renderList(sorted, todayMid);
  enhanceProgress(animate);
  if(animate){enterPage();enterTimeline();}
}

function scheduleNextDay() {
  clearTimeout(dayTimer);
  if (simulatedDay()) return;
  const current = now();
  const nextMidnight = midnight(current);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  dayTimer = setTimeout(refreshCurrentDay, Math.max(1, nextMidnight.getTime() - current.getTime() + 25));
}

export function refreshCurrentDay() {
  if (!document.hidden && localDayKey(now()) !== renderedDay) renderPreservingState();
  scheduleNextDay();
}
