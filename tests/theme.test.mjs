import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];

test('saved theme is applied before styles load; system, invalid and blocked storage stay safe',()=>{
  assert.ok(html.indexOf('<script>')<html.indexOf('href="css/styles.css"'));
  for(const theme of ['light','dark','system','invalid',null]){
    const dataset={};
    runInNewContext(script,{document:{documentElement:{dataset}},localStorage:{getItem:()=>theme}});
    assert.equal(dataset.theme,['light','dark'].includes(theme)?theme:undefined);
  }
  assert.doesNotThrow(()=>runInNewContext(script,{document:{documentElement:{dataset:{}}},localStorage:{getItem(){throw Error('blocked');}}}));
  assert.match(html, /name="theme-color"[^>]*media="\(prefers-color-scheme: light\)"/);
  assert.match(html, /name="theme-color"[^>]*media="\(prefers-color-scheme: dark\)"/);
});
