import {store} from './state.js';
import {simulatedDay} from './clock.js';
import {initialiseTheme} from './theme.js';
import {initialiseUI, updateFilterIndicator} from './ui.js';
import {updatePastToggle, updateTypeFilter} from './filters.js';
import {render, renderPreservingState, refreshCurrentDay} from './render.js';

initialiseUI();
initialiseTheme();
const timelineContainerElement = document.getElementById('timeline-container');

(async function init() {
  await store.initialiseDoneItems();
  store.onRender(() => {updatePastToggle();updateTypeFilter();renderPreservingState();});
  render(true);
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
