import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
test('determinate fill is clipped, never scaleX-scaled (hero and statistics)', () => {
  assert.doesNotMatch(app, /scaleX\(/);
  assert.match(app, /clip-path:inset\(0 \$\{100 - day/);
  assert.match(app, /clipPath:fill.style.clipPath/);
  assert.doesNotMatch(css, /@property --wave-shift|var\(--wave-shift\)/);
  assert.match(css, /\.mini-progress::before, \.mini-progress span::before[^}]*animation: wave-phase 2\.5s linear infinite/);
  assert.match(css, /@keyframes wave-phase[^}]*translateX\(0\)[\s\S]*?translateX\(-24px\)/);
  assert.match(css, /\.mini-progress\[data-flat='true'\]::before, \.mini-progress\[data-flat='true'\] span::before[^}]*animation-play-state: paused/);
});
