import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cancelledStatus,escapeHtml} from '../js/utils.js';
const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
test('cancellation without a reason is neutral; an optional reason is displayed safely',()=>{
  for(const event of [{},{cancelReason:''},{cancelReason:'  '},{cancelReason:null}])assert.equal(cancelledStatus(event),'Abgebrochen');
  assert.equal(cancelledStatus({cancelReason:' verschoben '}),'verschoben');
  assert.equal(escapeHtml(cancelledStatus({cancelReason:'<img onerror="x">'})),'&lt;img onerror=&quot;x&quot;&gt;');
  assert.match(app,/class="cancelled-chip">\$\{escapeHtml\(cancelledStatus\(item\)\)\}/);
  assert.doesNotMatch(app,/nicht angetreten|cancelled-badge/);
});
