import {isEventPast, isEventDone, midnight} from './utils.js';

/** Invalid/missing IDs leave the date-based automatic selection in control. */
export function semesterIdFromSearch(semesters, search) {
  const id = new URLSearchParams(search).get('semester');
  return semesters.some(semester => semester.id === id) ? id : null;
}

/** Undated events remain open. Completion marks never imply an end date. */
export function isSemesterComplete(events, today) {
  const main = events.filter(event => !event.calOnly);
  return main.length > 0 && main.every(event => isEventPast(event, midnight(today)));
}

/** Counts events, not occurrences; cancellation is reported independently. */
export function archiveSummary(events, doneItems = []) {
  const main = events.filter(event => !event.calOnly);
  const exams = main.filter(event => event.type === 'Prüfung');
  const assignments = main.filter(event => event.type === 'Abgabe' && !event.isCancelled);
  return {
    exams: exams.length,
    examsPassed: exams.filter(event => !event.isCancelled && isEventDone(event, doneItems)).length,
    assignments: assignments.length,
    assignmentsDone: assignments.filter(event => isEventDone(event, doneItems)).length,
    cancelled: main.filter(event => event.isCancelled).length,
  };
}
