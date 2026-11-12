import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../js/state.js';
import {SEMESTERS} from '../js/data.js';
import {now} from '../js/clock.js';

test('fresh storage on ?heute=2026-11-11 seeds summer completions while winter is active', async () => {
  const previous = globalThis.location;
  globalThis.location = {search:'?heute=2026-11-11'};
  try {
    const writes = [];
    const store = createState(SEMESTERS, now(), {
      loadItems:async()=>null, saveItems:async(key, items)=>writes.push(items),
    });
    await store.initialiseDoneItems();
    assert.equal(store.get().semester.id, 'ws-2026-2027');
    assert.deepEqual(store.get().doneItems, ['a1','a2']);
    assert.deepEqual(writes, [['a1','a2']]);
  } finally {
    if (previous === undefined) delete globalThis.location;
    else globalThis.location = previous;
  }
});

test('an existing empty or populated completion snapshot is never seeded again', async () => {
  for (const saved of [[], ['a2','ws26-asp-portfolio']]) {
    const writes = [];
    const store = createState(SEMESTERS, new Date(2026,10,11), {
      loadItems:async()=>saved, saveItems:async(key, items)=>writes.push(items),
    });
    await store.initialiseDoneItems();
    assert.deepEqual(store.get().doneItems, saved);
    assert.deepEqual(writes, []);
  }
});
