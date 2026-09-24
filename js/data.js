/**
 * Zentrale Datenquelle für alle Termine und Zeiträume.
 * Neue Einträge werden ausschließlich in diesem Modul gepflegt.
 */
export const EVENTS = [
  { id: 'p0', type: 'Prüfung', title: 'Probeklausur Programmierpraktikum', date: '2026-07-06', time: '12:00 Uhr' },
  { id: 'p1', type: 'Prüfung', title: 'Programmierpraktikum',               date: '2026-07-16', time: '10:00 Uhr' },
  { id: 'p3', type: 'Prüfung', title: 'Sicherheit und Privatheit',          date: '2026-09-24', time: '14:00 Uhr' },
  { id: 't1', type: 'Termin',  title: 'Beginn ASP (bis 09.10.)',            date: '2026-09-07', time: 'Ganztägig'  },
  // isDone: true markiert eine Abgabe beim ersten Laden als erledigt.
  { id: 'a1', type: 'Abgabe',  title: 'Data Science',                       date: '2026-08-09', time: '23:59 Uhr', isDone: true },
  { id: 'a2', type: 'Abgabe',  title: 'KI-Methoden im akademischen Alltag', date: '2026-09-23', time: '23:59 Uhr', isDone: true },
  // isCancelled: true markiert einen Termin als abgebrochen.
  { id: 'p4', type: 'Prüfung', title: 'Theorie 2',                          date: '2026-10-05', time: '10:00 Uhr', isCancelled: true },
  { id: 'p6', type: 'Prüfung', title: 'ExPhy 2',                            date: '2026-10-07', time: '09:00 Uhr' },
  { id: 'p5', type: 'Prüfung', title: 'Info II',                            date: '2026-10-14', time: '10:00 Uhr' },
  { id: 'p7', type: 'Prüfung', title: 'Programmierpraktikum',               date: '2026-10-26', time: 'KW 44 (26.–30.10.)' },
  { id: 't2', type: 'Termin',  title: 'Beginn Wintersemester 2026/27',      date: '2026-10-26', time: 'Ganztägig'  },
  { id: 'g1', type: 'Termin',  title: 'Gitarrenunterricht',                 date: '2026-06-29', time: '13:45-15:45 Uhr', calOnly: true },
  { id: 'g2', type: 'Termin',  title: 'Gitarrenunterricht',                 date: '2026-08-17', time: '13:45-15:45 Uhr', calOnly: true },
  { id: 'g3', type: 'Termin',  title: 'Gitarrenunterricht',                 date: '2026-08-24', time: '13:45-15:45 Uhr', calOnly: true },
  { id: 'g4', type: 'Termin',  title: 'Gitarrenunterricht',                 date: '2026-08-31', time: '13:45-15:45 Uhr', calOnly: true },
  { id: 'g5', type: 'Termin',  title: 'Gitarrenunterricht',                 date: '2026-09-07', time: '13:45-15:45 Uhr', calOnly: true },
  { id: 'g6', type: 'Termin',  title: 'Gitarrenunterricht',                 date: '2026-09-14', time: '13:45-15:45 Uhr', calOnly: true },
  { id: 'g7', type: 'Termin',  title: 'Gitarrenunterricht',                 date: '2026-09-21', time: '13:45-15:45 Uhr', calOnly: true },
  { id: 'g8', type: 'Termin',  title: 'Gitarrenunterricht',                 date: '2026-09-28', time: '13:45-15:45 Uhr', calOnly: true },
  { id: 'g9', type: 'Termin',  title: 'Gitarrenunterricht',                 date: '2026-10-05', time: '13:45-15:45 Uhr', calOnly: true },
  { id: 'g10', type: 'Termin', title: 'Gitarrenunterricht',                 date: '2026-08-11', time: '15:30-16:30 Uhr', calOnly: true },
  { id: 'g11', type: 'Termin', title: 'Gitarrenunterricht',                 date: '2026-08-25', time: '15:30-16:30 Uhr', calOnly: true },
  { id: 'g12', type: 'Termin', title: 'Gitarrenunterricht',                 date: '2026-09-01', time: '15:30-16:30 Uhr', calOnly: true },
  { id: 'g13', type: 'Termin', title: 'Gitarrenunterricht',                 date: '2026-09-15', time: '15:30-16:30 Uhr', calOnly: true },
  { id: 'g14', type: 'Termin', title: 'Gitarrenunterricht',                 date: '2026-09-22', time: '15:30-16:30 Uhr', calOnly: true },
  { id: 'g15', type: 'Termin', title: 'Gitarrenunterricht',                 date: '2026-09-29', time: '15:30-16:30 Uhr', calOnly: true },
  { id: 'g16', type: 'Termin', title: 'Gitarrenunterricht',                 date: '2026-10-06', time: '15:30-16:30 Uhr', calOnly: true },
  { id: 'g17', type: 'Termin', title: 'Gitarrenunterricht',                 date: '2026-10-27', time: '15:30-16:30 Uhr', calOnly: true }
];

/** Zeiträume, die im Kalender und Zeitstrahl dargestellt werden. */
export const PERIODS = [
  { id: 'asp',        label: 'ASP',        start: '2026-09-07', end: '2026-10-09', rgb: '249, 115, 22' },
  { id: 'wiesbaden-1', label: 'in Wiesbaden', start: '2026-07-25', end: '2026-08-09', rgb: '139, 92, 246' },
  { id: 'wiesbaden-2', label: 'in Wiesbaden', start: '2026-10-15', end: '2026-10-25', rgb: '139, 92, 246' }
];

export const ICONS = { 'Prüfung': '📝', 'Abgabe': '📤', 'Termin': '📌' };
export const STORAGE_KEY = 'done_items_v1';
