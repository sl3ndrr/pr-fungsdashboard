import {calendarDayDiff, parseISOString, occurrencesOf, isEventDone} from './utils.js';

/** Viewport-clamped overlay geometry; independent of the DOM for regression tests. */
export function tooltipPosition(anchor, size, viewport, margin = 12, gap = 8) {
  const width = Math.min(size.width, Math.max(0, viewport.width - margin * 2));
  const height = Math.min(size.height, Math.max(0, viewport.height - margin * 2));
  const above = anchor.top - height - gap;
  const below = anchor.bottom + gap;
  const placement = above >= margin ? 'above' : 'below';
  const top = Math.max(margin, Math.min(viewport.height - margin - height, placement === 'above' ? above : below));
  const left = Math.max(margin, Math.min(viewport.width - margin - width, anchor.left + anchor.width / 2 - width / 2));
  return { left, top, placement };
}

/** Calendar-day windows. calOnly/periods never determine the event domain. */
export function timelineWindow(events, today, mode = 'upcoming', doneItems = []) {
  const main = occurrencesOf(events).filter(event => mode === 'semester' || (!event.isCancelled && !isEventDone(event, doneItems)))
    .sort((a, b) => a.date.localeCompare(b.date)); // stable: equal dates retain EVENTS order
  if (!main.length) return null;
  const origin = parseISOString(main[0].date);
  const day = event => calendarDayDiff(parseISOString(event.date), origin);
  const todayDay = calendarDayDiff(today, origin);
  const visible = mode === 'semester' ? main : main.filter(event => day(event) >= todayDay);
  const first = mode === 'semester' ? 0 : todayDay;
  const last = mode === 'semester' ? day(main.at(-1)) : Math.max(todayDay + 3, ...visible.map(day));
  return { events: visible, origin, todayDay, minDay: first - 2, maxDay: last + 2,
    axisStart: origin.getTime(), axisEnd: parseISOString(main.at(-1).date).getTime() };
}

/** One strictly linear scale, with a 22px inset for complete 44px targets. */
export function timelinePosition(day, minDay, maxDay, width, edge = 22) {
  const inset = Math.min(edge, width / 2);
  return inset + (day - minDay) / Math.max(1, maxDay - minDay) * (width - inset * 2);
}

/** Reserve date targets first in the compact view, then give names the available
 * space in priority order. The enlarged view can add lanes for full labels.
 */
export function timelineEventLayout(items, width, gap = 8, {expanded = false} = {}) {
  const lanes = [];
  const bounds = (item, variant) => {
    const size = Math.min(width, Math.max(44, variant.width));
    const center = Math.max(size / 2, Math.min(width - size / 2, item.x));
    return {...variant, width: size, center, left: center - size / 2, right: center + size / 2};
  };
  const fits = (slot, lane, exclude) => lane.every(other =>
    other === exclude || slot.left >= other.right + gap || slot.right + gap <= other.left
  );
  const slots = items.map(item => {
    const variant = expanded ? item.variants[0] : item.variants.at(-1);
    const slot = bounds(item, variant);
    let row = lanes.findIndex(lane => fits(slot, lane));
    if (row < 0) {
      row = lanes.length;
      lanes.push([]);
    }
    lanes[row].push(slot);
    return {item, slot, row};
  });
  if (!expanded) {
    const priorityOrder = [...slots].sort((a, b) => (b.item.priority ?? 0) - (a.item.priority ?? 0));
    for (const {item, slot, row} of priorityOrder) {
      const variant = item.variants.find(value => value.width <= width && fits(bounds(item, value), lanes[row], slot));
      if (variant) Object.assign(slot, bounds(item, variant));
    }
  }
  return slots.map(({slot, row}) => ({...slot, lane: row % 2 ? (row + 1) / 2 : -(row / 2 + 1)}));
}

/** Keep complete labels in the rail. Optional thinning retains a single reading row;
 * higher-priority labels (year changes) win before chronological packing.
 * Period labels still use separate rows and are never thinned.
 */
export function timelineLabelLayout(labels, min, max, gap = 12, {singleRow = false} = {}) {
  const rows = [];
  const intervals = [];
  const placed = new Map();
  [...labels].sort((a, b) => (singleRow ? (b.priority || 0) - (a.priority || 0) : 0) || a.anchor - b.anchor).forEach(label => {
    const visible = (label.end ?? label.anchor) >= min && (label.start ?? label.anchor) <= max;
    if (!visible) { placed.set(label, { visible: false }); return; }
    const half = Math.min(label.width, max - min) / 2;
    const center = Math.max(min + half, Math.min(max - half, label.anchor));
    if (singleRow) {
      if (intervals.some(other => center - half < other.right + gap && center + half + gap > other.left)) {
        placed.set(label, {visible:false});
        return;
      }
      intervals.push({left:center - half, right:center + half});
      rows[0] = max;
      placed.set(label, {visible:true, center, row:0});
      return;
    }
    let row = rows.findIndex(end => center - half >= end + gap);
    if (row < 0) row = rows.length;
    rows[row] = center + half;
    placed.set(label, { visible: true, center, row });
  });
  return { labels: labels.map(label => placed.get(label)), rows: rows.length };
}

/** Keep chronological cards in one grid, ending a row at every group boundary.
 * A full-width heading starts the next group; no placeholder DOM cells are needed.
 */
export function appointmentRows(items, groupFor, columns) {
  const count = Math.max(1, Math.min(4, Math.floor(columns) || 1));
  const rows = [];
  for (const item of items) {
    const group = groupFor(item);
    const previous = rows.at(-1);
    const changed = !previous || previous.groups[0] !== group;
    if (changed || previous.cards.length === count) rows.push({cards:[item],groups:[group],showHeading:changed});
    else previous.cards.push(item);
  }
  return rows;
}


