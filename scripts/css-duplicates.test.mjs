import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scanCSS,duplicates} from './css-duplicates.mjs';

test('duplicate inventory includes individual grouped selectors and conditional contexts',()=>{
  const css='.a, :is(.b,.c) { color: red; }\n@media (width < 500px) { .a { color: blue; } }\n@supports (color: light-dark(red,blue)) { .a { color: green; } }';
  const result=duplicates(css);
  assert.equal(result.length,1);assert.equal(result[0].selector,'.a');
  assert.deepEqual(result[0].occurrences.map(x=>x.context),[[],['@media (width < 500px)'],['@supports (color: light-dark(red,blue))']]);
});

test('strings, SVG punctuation, comments, descriptors and keyframes do not produce selectors',()=>{
  const css='/* .false { } */\n.a { mask: url("data:image/svg+xml,a;b{c}"); content: "}"; }\n@keyframes wave { to { opacity: 0; } }\n@property --wave { syntax: "<length>"; inherits: true; initial-value: 0px; }\n@starting-style { .a { opacity: 0; } }';
  const rules=scanCSS(css);
  assert.equal(rules.length,2);assert.deepEqual(rules[0].declarations.map(x=>x.property),['mask','content']);
  assert.deepEqual(rules[1].context,['@starting-style']);
});

test('equivalent attribute quote styles share one selector key',()=>{
  const result=duplicates(`[aria-pressed="true"] { color: red; } [aria-pressed='true'] { color: blue; }`);
  assert.equal(result.length,1);assert.equal(result[0].occurrences.length,2);
});
