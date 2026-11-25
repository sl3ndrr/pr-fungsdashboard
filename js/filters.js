import {store} from './state.js';
import {updateFilterIndicator} from './ui.js';

// Filter für vergangene Termine.
const pastCheckbox = document.getElementById('toggle-past-btn');
export function updatePastToggle() {
  pastCheckbox.checked = store.get().showPast;
}
pastCheckbox.addEventListener('change', () => {
  store.update({showPast:pastCheckbox.checked}, {type:'filter'});
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
