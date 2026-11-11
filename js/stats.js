import {eventStatistics} from './utils.js';
import {syncHTML, motion} from './motion.js';

export function renderStatistics(mainEvents, todayMid, doneItems) {
  const stats = eventStatistics(mainEvents, todayMid, doneItems);
  syncHTML(document.getElementById('stats-line'),
    `<div class="stat-tile" data-key="stats-total"><strong class="stat-value">${stats.total}</strong><span class="stat-label">Termine</span>${stats.undated ? `<span class="stat-note">davon ${stats.undated} ohne Datum</span>` : ''}</div>
     <div class="stat-tile" data-key="stats-assignments"><span class="stat-label">Abgaben</span><strong class="stat-value">${stats.assignmentsDone}<span class="stat-total">/${stats.assignments}</span></strong><div class="mini-progress" role="progressbar" aria-label="Abgaben erledigt" aria-valuemin="0" aria-valuemax="${stats.assignments || 1}" aria-valuenow="${stats.assignmentsDone}"><span style="clip-path:inset(0 ${100 - (stats.assignments ? stats.assignmentsDone / stats.assignments : 0) * 100}% 0 0)"></span></div></div>
     <div class="stat-tile" data-key="stats-next7"><strong class="stat-value">${stats.next7}</strong><span class="stat-label">${stats.next7 === 1 ? 'Termin' : 'Termine'} in 7 Tagen</span></div>`);

  animateStatistics();
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
