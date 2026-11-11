import test from 'node:test';
import assert from 'node:assert/strict';
import {loadDoneItems,saveDoneItems} from '../js/storage.js';

function storage(t,implementation) {
  const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{value:implementation,configurable:true});
  t.after(()=>{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;});
}
test('completion storage distinguishes missing, malformed and valid persisted data',async t=>{
  let value=null;storage(t,{getItem:key=>{assert.equal(key,'done');return value;}});
  assert.equal(await loadDoneItems('done'),null);
  value='["exam","portfolio"]';assert.deepEqual(await loadDoneItems('done'),['exam','portfolio']);
  for(const invalid of ['broken','{}','null','42']) {value=invalid;assert.deepEqual(await loadDoneItems('done'),[]);}
});
test('read failure remains distinct so initialisation cannot overwrite saved completions',async t=>{
  storage(t,{getItem(){throw Error('denied');}});
  assert.equal(await loadDoneItems('done'),undefined);
});
test('completion writes JSON through localStorage and remains usable when writes fail',async t=>{
  const writes=[];let blocked=false;
  storage(t,{setItem(key,value){if(blocked)throw Error('quota');writes.push({key,value});}});
  await saveDoneItems('done',['exam']);assert.deepEqual(writes,[{key:'done',value:'["exam"]'}]);
  blocked=true;await assert.doesNotReject(saveDoneItems('done',[]));
});
