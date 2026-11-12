import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {CALENDAR_EXPORT_KEY,loadCalendarExportVisibility,saveCalendarExportVisibility} from '../js/settings-preferences.js';

function storage(t, implementation) {
  const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{value:implementation,configurable:true});
  t.after(()=>{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;});
}

test('calendar export stays visible by default and only an explicit false hides it',t=>{
  let value=null;
  storage(t,{getItem:key=>{assert.equal(key,CALENDAR_EXPORT_KEY);return value;}});
  for(value of [null,'true','broken','0',''])assert.equal(loadCalendarExportVisibility(),true);
  value='false';assert.equal(loadCalendarExportVisibility(),false);
});

test('calendar export preference round-trips and can be enabled again',t=>{
  const values=new Map();
  storage(t,{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)});
  saveCalendarExportVisibility(false);assert.equal(loadCalendarExportVisibility(),false);
  saveCalendarExportVisibility(true);assert.equal(loadCalendarExportVisibility(),true);
  assert.deepEqual([...values],[[CALENDAR_EXPORT_KEY,'true']]);
});

test('blocked or full storage does not interrupt settings',t=>{
  storage(t,{getItem(){throw Error('blocked');},setItem(){throw Error('quota');}});
  assert.equal(loadCalendarExportVisibility(),true);
  assert.doesNotThrow(()=>saveCalendarExportVisibility(false));
});

test('saved export visibility is applied before CSS and app modules load',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.ok(html.indexOf(script)<html.indexOf('href="css/styles.css"'));
  for(const value of [null,'false','true','broken']) {
    const dataset={};
    runInNewContext(script,{document:{documentElement:{dataset}},localStorage:{getItem:key=>key===CALENDAR_EXPORT_KEY?value:null}});
    assert.equal(dataset.calendarExportVisible,String(value!=='false'));
  }
});
