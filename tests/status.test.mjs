import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cancelledStatus,escapeHtml} from '../js/utils.js';
const app=['app.js','state.js','theme.js','hero.js','timeline.js','list.js','stats.js','filters.js','ui.js','render.js'].map(name=>readFileSync(new URL('../js/'+name,import.meta.url),'utf8')).join('\n');
test('cancellation without a reason is neutral; an optional reason is displayed safely',()=>{
  for(const event of [{},{cancelReason:''},{cancelReason:'  '},{cancelReason:null}])assert.equal(cancelledStatus(event),'Abgebrochen');
  assert.equal(cancelledStatus({cancelReason:' verschoben '}),'verschoben');
  assert.equal(escapeHtml(cancelledStatus({cancelReason:'<img onerror="x">'})),'&lt;img onerror=&quot;x&quot;&gt;');
  assert.match(app,/class="cancelled-chip">\$\{escapeHtml\(cancelledStatus\(item\)\)\}/);
  assert.doesNotMatch(app,/nicht angetreten|cancelled-badge/);
});
