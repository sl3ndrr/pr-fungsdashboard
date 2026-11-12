import {createRenderScheduler} from './scheduler.js';
import {downloadCalendar} from './ics-download.js';
import {filenameSlug} from './ics.js';
import {withTransition} from './motion.js';
import {store} from './state.js';
import {simulatedDay} from './clock.js';
import {initialiseTheme} from './theme.js';
import {initialiseUI, updateFilterIndicator} from './ui.js';
import {updatePastToggle, updateTypeFilter} from './filters.js';
import {renderPreservingState, refreshCurrentDay} from './render.js';
import {initialiseSemesterControl} from './semester-control.js';

document.getElementById('export-all').addEventListener('click', () => {
  const {events, semester} = store.get();
  downloadCalendar(events, `semester-roadmap-${filenameSlug(semester.id)}.ics`);
});
initialiseUI();
initialiseTheme();
initialiseSemesterControl();
const requestRender = createRenderScheduler(({animate, type}) => {
  const update = () => {updatePastToggle();updateTypeFilter();renderPreservingState(animate);};
  return type ? withTransition(update, {type}) : update();
});
const timelineContainerElement = document.getElementById('timeline-container');

(async function init() {
  await store.initialiseDoneItems();
  store.onRender(requestRender);
  document.fonts?.ready.then(() => requestRender());
  await requestRender({animate:true});
  updateFilterIndicator();
  const simulated = simulatedDay();
  if (simulated) {
    const notice = document.getElementById('simulation-notice');
    notice.hidden = false;
    notice.querySelector('span').textContent = 'Simulierter Tag: ' + simulated.toLocaleDateString('de-DE', {weekday:'short', day:'2-digit', month:'2-digit', year:'numeric'});
    notice.querySelector('button').addEventListener('click', () => {
      const url = new URL(location.href);
      url.searchParams.delete('heute');
      location.assign(url.href);
    });
  }
  document.documentElement.dataset.ready = 'true';
  document.getElementById('startup-error').hidden = true;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshCurrentDay();
  });
  window.addEventListener('pageshow', refreshCurrentDay);
  let timelineWidth = timelineContainerElement.clientWidth;
  new ResizeObserver(() => {
    const width = timelineContainerElement.clientWidth;
    if (width !== timelineWidth) {
      timelineWidth = width;
      requestRender();
    }
  }).observe(timelineContainerElement);
  const list = document.getElementById('list');
  let columns = getComputedStyle(list).getPropertyValue('--list-columns');
  new ResizeObserver(() => {
    const next = getComputedStyle(list).getPropertyValue('--list-columns');
    if (next !== columns) {
      columns = next;
      requestRender();
    }
  }).observe(list);
  refreshCurrentDay();
})();
