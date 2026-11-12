export const CALENDAR_EXPORT_KEY = 'calendar_export_visible_v1';

/** Existing visits keep their export actions unless explicitly hidden. */
export function loadCalendarExportVisibility() {
  try { return localStorage.getItem(CALENDAR_EXPORT_KEY) !== 'false'; }
  catch { return true; }
}

export function saveCalendarExportVisibility(visible) {
  try { localStorage.setItem(CALENDAR_EXPORT_KEY, String(visible)); }
  catch { /* The current page remains usable when storage is unavailable. */ }
}
