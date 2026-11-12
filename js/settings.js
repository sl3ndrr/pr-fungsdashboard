import {closeTimelineTooltip} from './timeline.js';
import {loadCalendarExportVisibility, saveCalendarExportVisibility} from './settings-preferences.js';

export function initialiseSettings() {
  const button = document.getElementById('settings-button');
  const dialog = document.getElementById('settings-dialog');
  const exportToggle = document.getElementById('calendar-export-toggle');
  function applyExportVisibility(visible) {
    document.documentElement.dataset.calendarExportVisible = String(visible);
    exportToggle.checked = visible;
  }
  applyExportVisibility(loadCalendarExportVisibility());
  exportToggle.addEventListener('change', () => {
    applyExportVisibility(exportToggle.checked);
    saveCalendarExportVisibility(exportToggle.checked);
  });
  button.addEventListener('click', () => {
    closeTimelineTooltip();
    dialog.showModal();
    button.setAttribute('aria-expanded', 'true');
  });
  document.getElementById('settings-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    button.setAttribute('aria-expanded', 'false');
    button.focus({preventScroll:true});
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled)')]
      .filter(control => control.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();first.focus();
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}
