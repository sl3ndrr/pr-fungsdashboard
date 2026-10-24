import {calendarDayDiff, parseISOString} from './utils.js';

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
export function timelineWindow(events, today, mode = 'upcoming') {
  const main = events.filter(event => !event.calOnly)
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

/** Fit every point; collisions alternate above/below the axis, never widen it. */
export function timelineGeometry(targets, availableWidth, gap = 44) {
  const width = Math.max(44, availableWidth);
  const xs = targets.map(fraction => timelinePosition(fraction, 0, 1, width));
  const placed = timelineEventLayout(xs.map(x => ({x, variants: [{width: gap}]})), width, 0);
  return { width, xs, lanes: placed.map(point => point.lane) };
}

/** Measured label variants and their 44px targets share disjoint lane intervals.
 * Labels stay centred on their date, except for explicit edge clamping.
 * Rows alternate -1,+1,-2,+2; input order is never changed.
 */
export function timelineEventLayout(items, width, gap = 8) {
  const lanes = [];
  return items.map((item, index) => {
    const neighbours = items.filter((_, i) => i !== index).map(other => Math.abs(other.x - item.x));
    const budget = Math.max(44, Math.min(156, width, ...(neighbours.length ? neighbours : [width])) - gap);
    const variant = item.variants.find(value => value.width <= budget) ?? item.variants.at(-1);
    const size = Math.min(width, Math.max(44, variant.width));
    const center = Math.max(size / 2, Math.min(width - size / 2, item.x));
    const left = center - size / 2, right = center + size / 2;
    let row = lanes.findIndex(intervals => intervals.every(interval => left >= interval.right + gap || right + gap <= interval.left));
    if (row < 0) { row = lanes.length; lanes.push([]); }
    lanes[row].push({left, right});
    return { ...variant, width: size, center, left, lane: row % 2 ? (row + 1) / 2 : -(row / 2 + 1) };
  });
}

/** Keep complete labels in the visible rail; pack collisions into separate rows. */
export function timelineLabelLayout(labels, min, max, gap = 12) {
  const rows = [];
  const placed = new Map();
  [...labels].sort((a, b) => a.anchor - b.anchor).forEach(label => {
    const visible = (label.end ?? label.anchor) >= min && (label.start ?? label.anchor) <= max;
    if (!visible) { placed.set(label, { visible: false }); return; }
    const half = Math.min(label.width, max - min) / 2;
    const center = Math.max(min + half, Math.min(max - half, label.anchor));
    let row = rows.findIndex(end => center - half >= end + gap);
    if (row < 0) row = rows.length;
    rows[row] = center + half;
    placed.set(label, { visible: true, center, row });
  });
  return { labels: labels.map(label => placed.get(label)), rows: rows.length };
}

/** Pack chronological cards across group boundaries, without visual/DOM reordering. */
export function appointmentRows(items, groupFor, columns) {
  const count = Math.max(1, Math.min(4, Math.floor(columns) || 1));
  const rows = [];
  let previousGroup;
  for (let i = 0; i < items.length; i += count) {
    const cards = items.slice(i, i + count);
    const groups = [...new Set(cards.map(groupFor))];
    const showHeading = groups.length > 1 || groups[0] !== previousGroup;
    rows.push({ cards, groups, showHeading });
    previousGroup = groups.at(-1);
  }
  return rows;
}


