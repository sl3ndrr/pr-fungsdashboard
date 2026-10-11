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

/** Bounded isotonic regression: date order and 32px spacing, without growing a fitting rail. */
export function timelineGeometry(targets, availableWidth, gap = 32, edge = 22) {
  const width = Math.max(Math.floor(availableWidth), (targets.length - 1) * gap + edge * 2);
  const blocks = [];
  targets.forEach((fraction, i) => {
    blocks.push({ start: i, end: i, sum: fraction * width - i * gap, count: 1 });
    while (blocks.length > 1) {
      const a = blocks.at(-2), b = blocks.at(-1);
      if (a.sum / a.count <= b.sum / b.count) break;
      blocks.splice(-2, 2, { start: a.start, end: b.end, sum: a.sum + b.sum, count: a.count + b.count });
    }
  });
  const xs = [];
  const max = width - edge - Math.max(0, targets.length - 1) * gap;
  for (const block of blocks) {
    const base = Math.max(edge, Math.min(max, block.sum / block.count));
    for (let i = block.start; i <= block.end; i++) xs[i] = base + i * gap;
  }
  return { width, xs };
}
