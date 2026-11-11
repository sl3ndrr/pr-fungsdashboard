import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderScheduler} from '../js/scheduler.js';

test('resize, fonts and click invalidations share one frame and an awaitable render',async()=>{
  const frames=[],calls=[];
  const request=createRenderScheduler(options=>calls.push(options),callback=>frames.push(callback));
  const resize=request(),fonts=request(),click=request({type:'filter'});
  assert.equal(resize,fonts);assert.equal(fonts,click);assert.equal(frames.length,1);
  assert.deepEqual(calls,[]);frames.shift()();await click;
  assert.deepEqual(calls,[{animate:false,type:'filter'}]);
  const next=request();assert.notEqual(next,click);assert.equal(frames.length,1);
  frames.shift()();await next;assert.equal(calls.length,2);
});
test('initial animation intent survives later invalidations and the latest transition is retained',async()=>{
  const frames=[],calls=[];
  const request=createRenderScheduler(options=>calls.push(options),callback=>frames.push(callback));
  const pending=request({animate:true,type:'done'});request();request({type:'filter'});
  frames.shift()();await pending;
  assert.deepEqual(calls,[{animate:true,type:'filter'}]);
});
test('an invalidation during a render gets its own frame without losing either waiter',async()=>{
  const frames=[];let count=0,next;
  const request=createRenderScheduler(()=>{if(++count===1)next=request();},callback=>frames.push(callback));
  const first=request();frames.shift()();await first;
  assert.equal(count,1);assert.equal(frames.length,1);frames.shift()();await next;
  assert.equal(count,2);
});
test('render errors reject shared waiters and a following frame can recover',async()=>{
  const frames=[];let fail=true;
  const request=createRenderScheduler(()=>{if(fail)throw Error('render failed');return 42;},callback=>frames.push(callback));
  const first=request(),same=request();frames.shift()();
  await assert.rejects(first,/render failed/);assert.equal(first,same);
  fail=false;const recovered=request();frames.shift()();assert.equal(await recovered,42);
});
