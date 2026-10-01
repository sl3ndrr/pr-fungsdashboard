import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
test('determinate fill is clipped, never scaleX-scaled (hero and statistics)', () => {
  assert.doesNotMatch(app, /scaleX\(/);
  assert.match(app, /clip-path:inset\(0 \$\{100 - day/);
  assert.match(app, /clipPath:fill.style.clipPath/);
  assert.match(css, /@property --wave-shift[^}]*inherits: true/);
  assert.match(css, /\.mini-progress::before, \.mini-progress span::before[^}]*translateX\(var\(--wave-shift\)\)/);
  assert.doesNotMatch(css, /\.mini-progress span::before\s*\{\s*animation:/);
});
