import {now} from './clock.js';
import {SEMESTERS, STORAGE_KEY} from './data.js';
import {semesterForDate, validateData} from './utils.js';
import {loadDoneItems, saveDoneItems} from './storage.js';

/** One explicit snapshot and one render notification per state transaction. */
export function createState(semesters, current, {loadItems, saveItems, key} = {}) {
  const semester = semesterForDate(semesters, current);
  let state = Object.freeze({semester, ...validateData(semester.events, semester.periods),
    doneItems: [], showPast: false, typeFilter: 'all', timelineMode: 'upcoming'});
  let render = () => {};
  let pendingSave = Promise.resolve();

  function update(patch, options) {
    if (!Object.keys(patch).some(key => state[key] !== patch[key])) return;
    state = Object.freeze({...state, ...patch});
    return render(options);
  }
  function saveCompletedItems() {
    const items = [...state.doneItems];
    pendingSave = pendingSave.then(() => saveItems(key, items));
    return pendingSave;
  }
  return {
    get: () => state,
    onRender(listener) { render = listener; },
    update,
    async initialiseDoneItems() {
      const savedItems = await loadItems(key);
      state = Object.freeze({...state, doneItems: Array.isArray(savedItems)
        ? savedItems : semesters.flatMap(semester => validateData(semester.events, semester.periods).events)
          .filter(event => event.isDone).map(event => event.id)});
      if (savedItems === null) await saveCompletedItems();
    },
    toggleDone(id) {
      const doneItems = state.doneItems.includes(id)
        ? state.doneItems.filter(item => item !== id) : [...state.doneItems, id];
      const rendered = update({doneItems}, {type:'done'});
      saveCompletedItems();
      return rendered;
    },
    // Called at the beginning of an existing render: never recursively render.
    prepareSemester(date) {
      const semester = semesterForDate(semesters, date);
      if (semester.id === state.semester.id) return false;
      state = Object.freeze({...state, semester, ...validateData(semester.events, semester.periods),
        showPast: false, typeFilter: 'all'});
      return true;
    },
    saved: () => pendingSave,
  };
}

export const store = createState(SEMESTERS, now(), {
  loadItems: loadDoneItems, saveItems: saveDoneItems, key: STORAGE_KEY,
});
