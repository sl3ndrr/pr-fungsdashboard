import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../js/state.js';
import {SEMESTERS} from '../js/data.js';
import {parseISOString} from '../js/utils.js';

function fixture(saved=null) {
  const saves=[];
  const store=createState(SEMESTERS,parseISOString('2026-11-11'),{
    key:'test',loadItems:async()=>saved,saveItems:async(key,items)=>saves.push({key,items}),
  });
  return {store,saves};
}
test('state initialises explicit semester, filters and completion snapshot without rendering',async()=>{
  const {store,saves}=fixture();let renders=0;store.onRender(()=>renders++);
  await store.initialiseDoneItems();
  assert.equal(renders,0);
  assert.equal(store.get().semester.id,'ws-2026-2027');
  assert.equal(store.get().events.length,10);assert.deepEqual(store.get().periods,[]);
  assert.deepEqual(store.get().doneItems,[]);
  assert.equal(store.get().showPast,false);assert.equal(store.get().typeFilter,'all');
  assert.equal(store.get().timelineMode,'upcoming');assert.ok(Object.isFrozen(store.get()));
  assert.deepEqual(saves,[{key:'test',items:[]}]);
});
test('one combined transaction notifies once and an unchanged patch does not notify',()=>{
  const {store}=fixture();const snapshots=[];
  store.onRender(()=>{snapshots.push(store.get());return 'rendered';});
  const before=store.get();
  assert.equal(store.update({showPast:true,typeFilter:'Prüfung'}),'rendered');
  assert.equal(snapshots.length,1);assert.equal(before.showPast,false);
  assert.equal(snapshots[0].showPast,true);assert.equal(snapshots[0].typeFilter,'Prüfung');
  store.update({showPast:true,typeFilter:'Prüfung'});assert.equal(snapshots.length,1);
});
test('rapid done/undo saves are serial and retain each snapshot, with one render per change',async()=>{
  const {store,saves}=fixture(['other-semester']);await store.initialiseDoneItems();
  let renders=0;store.onRender(()=>renders++);
  store.toggleDone('ws26-asp-portfolio');store.toggleDone('ws26-asp-portfolio');
  await store.saved();
  assert.equal(renders,2);assert.deepEqual(store.get().doneItems,['other-semester']);
  assert.deepEqual(saves,[{key:'test',items:['other-semester','ws26-asp-portfolio']},{key:'test',items:['other-semester']}]);
});
test('semester preparation resets list filters within the current render and retains completion IDs',async()=>{
  const {store}=fixture(['saved']);await store.initialiseDoneItems();
  store.update({showPast:true,typeFilter:'Abgabe',timelineMode:'semester'});
  let renders=0;store.onRender(()=>renders++);
  assert.equal(store.prepareSemester(parseISOString('2026-10-01')),true);
  assert.equal(store.get().semester.id,'ss-2026');assert.equal(store.get().showPast,false);
  assert.equal(store.get().typeFilter,'all');assert.equal(store.get().timelineMode,'semester');
  assert.deepEqual(store.get().doneItems,['saved']);assert.equal(renders,0);
  assert.equal(store.prepareSemester(parseISOString('2026-10-02')),false);
});
test('a failed read preserves initial done data without writing over stored data',async()=>{
  const saves=[];
  const store=createState(SEMESTERS,parseISOString('2026-10-01'),{
    loadItems:async()=>undefined,saveItems:async(...args)=>saves.push(args),
  });
  await store.initialiseDoneItems();
  assert.deepEqual(store.get().doneItems,['a1','a2']);assert.deepEqual(saves,[]);
});
