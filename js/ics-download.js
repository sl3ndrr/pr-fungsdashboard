import {createCalendar} from './ics.js';
import {today} from './clock.js';
import {store} from './state.js';

export function downloadCalendar(events, filename) {
  const {doneItems} = store.get();
  const content = createCalendar(events, {today:today(), doneItems, clock:() => new Date()});
  const url = URL.createObjectURL(new Blob([content], {type:'text/calendar;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
