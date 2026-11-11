import {store} from './state.js';
import {updateFilterIndicator} from './ui.js';

// Filter für vergangene Termine.
const togglePastBtn = document.getElementById('toggle-past-btn');
export function updatePastToggle() {
  const {showPast} = store.get();
  togglePastBtn.textContent = showPast ? 'Vergangene ausblenden' : 'Vergangene anzeigen';
  togglePastBtn.setAttribute('aria-pressed', String(showPast));
  updateFilterIndicator(togglePastBtn.closest('.segmented-filter'));
}
togglePastBtn.addEventListener('click', () => {
  store.update({showPast:!store.get().showPast}, {type:'filter'});
});

export function updateTypeFilter() {
  const {typeFilter} = store.get();
  document.querySelectorAll('#type-filter button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === typeFilter));
  });
  updateFilterIndicator();
}
document.querySelectorAll('#type-filter button').forEach(button => {
  button.addEventListener('click', () => {
    store.update({typeFilter:button.dataset.filter}, {type:'filter'});
  });
});

document.querySelectorAll('#timeline-window button').forEach(button => {
  button.addEventListener('click', () => {
    store.update({timelineMode:button.dataset.window});
  });
});
