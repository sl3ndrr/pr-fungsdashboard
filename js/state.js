import {now} from './clock.js';
import {SEMESTERS, STORAGE_KEY} from './data.js';
import {semesterForDate, validateData} from './utils.js';
import {loadDoneItems, saveDoneItems} from './storage.js';
import {semesterIdFromSearch, isSemesterComplete} from './semesters.js';

/** One explicit snapshot and one render notification per state transaction. */
export function createState(semesters, current, {loadItems, saveItems, key, search = ''} = {}) {
  const selectedSemesterId = semesterIdFromSearch(semesters, search);
  const semester = semesters.find(item => item.id === selectedSemesterId) || semesterForDate(semesters, current);
  const data = validateData(semester.events, semester.periods);
  const archive = isSemesterComplete(data.events, current);
  let state = Object.freeze({semester, ...data, selectedSemesterId, archive,
    doneItems: [], showPast: archive, typeFilter: 'all', timelineMode: archive ? 'semester' : 'upcoming'});
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
    selectSemester(id, date) {
      const semester = semesters.find(item => item.id === id);
      if (!semester) return;
      if (id === state.semester.id) return update({selectedSemesterId:id});
      const data = validateData(semester.events, semester.periods);
      const archive = isSemesterComplete(data.events, date);
      return update({semester, ...data, selectedSemesterId:id, archive,
        showPast:archive, typeFilter:'all', timelineMode:archive ? 'semester' : 'upcoming'});
    },
    // Called at the beginning of an existing render: never recursively render.
    prepareSemester(date) {
      const semester = semesters.find(item => item.id === state.selectedSemesterId) || semesterForDate(semesters, date);
      const changed = semester.id !== state.semester.id;
      const data = changed ? validateData(semester.events, semester.periods) : {events:state.events, periods:state.periods};
      const archive = isSemesterComplete(data.events, date);
      if (!changed && archive === state.archive) return false;
      state = Object.freeze({...state, semester, ...data, archive,
        showPast:archive, typeFilter:'all', timelineMode:archive ? 'semester' : state.timelineMode});
      return true;
    },
    saved: () => pendingSave,
  };
}

export const store = createState(SEMESTERS, now(), {
  loadItems: loadDoneItems, saveItems: saveDoneItems, key: STORAGE_KEY,
  search: typeof location === 'undefined' ? '' : location.search,
});
