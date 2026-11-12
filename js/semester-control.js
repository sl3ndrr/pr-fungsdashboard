import {SEMESTERS} from './data.js';
import {now} from './clock.js';
import {store} from './state.js';
import {closeTimelineTooltip} from './timeline.js';

export function initialiseSemesterControl() {
  const select = document.getElementById('semester-select');
  for (const semester of SEMESTERS) select.add(new Option(semester.label, semester.id));
  select.addEventListener('change', async () => {
    if (!SEMESTERS.some(semester => semester.id === select.value)) return;
    const url = new URL(location.href);
    url.searchParams.set('semester', select.value);
    history.replaceState(history.state, '', url);
    closeTimelineTooltip();
    await store.selectSemester(select.value, now());
    select.focus({preventScroll:true});
  });
}

export function updateSemesterControl() {
  const {semester, archive} = store.get();
  document.getElementById('semester-label').textContent = semester.label;
  document.getElementById('semester-select').value = semester.id;
  document.getElementById('archive-notice').hidden = !archive;
}
