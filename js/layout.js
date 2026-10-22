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

/** One linear scale. Grow the rail to retain touch spacing; never move individual dates. */
export function timelineGeometry(targets, availableWidth, gap = 44, edge = 22) {
  const unique = [...new Set(targets)];
  const distances = unique.slice(1).map((value, i) => value - unique[i]).filter(value => value > 0);
  const width = Math.max(44, Math.ceil(availableWidth),
    distances.length ? gap / Math.min(...distances) : 0,
    unique[0] > 0 ? edge / unique[0] : 0,
    unique.at(-1) < 1 ? edge / (1 - unique.at(-1)) : 0);
  const xs = targets.map(fraction => fraction * width);
  const lanes = [];
  // Stable input order within a date, with disjoint 44px touch lanes.
  let first = 0;
  targets.forEach((value, i) => { if (!i || value !== targets[i - 1]) first = i; lanes[i] = i - first; });
  return { width, xs, lanes };
}

/** Map dates onto the fitted points, keeping intervening dates between their neighbours.
 * Equal-date groups use their centre; dates outside a group interpolate from its edges.
 */
export function timelineDatePosition(day, days, xs, minDay, maxDay, width) {
  if (day <= minDay) return 0;
  if (day >= maxDay) return width;
  let previousDay = minDay, previousX = 0;
  for (let i = 0; i < days.length; i++) {
    let last = i;
    while (last + 1 < days.length && days[last + 1] === days[i]) last++;
    if (day === days[i]) return (xs[i] + xs[last]) / 2;
    if (day < days[i]) {
      return previousX + (xs[i] - previousX) * (day - previousDay) / (days[i] - previousDay);
    }
    previousDay = days[i];
    previousX = xs[last];
    i = last;
  }
  return previousX + (width - previousX) * (day - previousDay) / (maxDay - previousDay);
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

