/** Static, hand-authored icons. Data strings must never be inserted into SVG. */
const svg = content => `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
export const ICONS = {
  'Prüfung': svg('<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M9 15l3-1 8-8-2-2-8 8-1 3Z"/><path d="M7 7h4M7 11h1M7 17h8"/>'),
  'Abgabe': svg('<path d="M12 16V3m-4 4 4-4 4 4M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>'),
  'Termin': svg('<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/><circle cx="12" cy="16" r="1"/>'),
  calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h2m6 0h2M7 18h2"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  check: svg('<path d="m5 12 4 4L19 6"/>'),
  close: svg('<path d="m6 6 12 12M6 18 18 6"/>'),
  left: svg('<path d="m15 6-6 6 6 6"/>'),
  right: svg('<path d="m9 6 6 6-6 6"/>'),
  cancelled: svg('<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>'),
};
