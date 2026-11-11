import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app = ['app.js','state.js','theme.js','hero.js','timeline.js','list.js','stats.js','filters.js','ui.js','render.js'].map(name=>readFileSync(new URL('../js/'+name,import.meta.url),'utf8')).join('\n');
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
