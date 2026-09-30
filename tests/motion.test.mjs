/** Run: node --test tests/*.test.mjs. No packages or build step. */
import test from 'node:test';
import assert from 'node:assert/strict';
const listeners=new Map(),media={matches:false,addEventListener:(type,callback)=>listeners.set(type,callback)};
const root={dataset:{},style:{setProperty(){}}};
globalThis.matchMedia=()=>media;globalThis.document={documentElement:root,querySelectorAll:()=>[]};
globalThis.innerWidth=1280;globalThis.innerHeight=900;globalThis.CSS={supports:()=>true};
const tokens={'--spring-spatial-fast':'linear(0, 1.095, 1)','--spring-spatial':'linear(0, 1.015, 1)','--spring-effects':'linear(0, .5, 1)','--dur-spatial-fast':'350ms','--dur-spatial':'410ms','--dur-spatial-slow':'570ms','--dur-effects-fast':'140ms','--dur-effects':'210ms','--dur-effects-slow':'300ms'};
globalThis.getComputedStyle=()=>({getPropertyValue:name=>tokens[name]||''});
const {motion,withTransition,transitionName}=await import('../js/motion.js');
function element(){const calls=[];return {calls,animate(frames,options){const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;},finished:new Promise(()=>{})};calls.push(animation);return animation;}};}
test('paired spring times and separate Spatial / Effects channels',()=>{
  const el=element();motion(el,[{transform:'scale(.96)'},{transform:'scale(1)'}],{speed:'slow'});motion(el,[{opacity:0},{opacity:1}],{kind:'effects',speed:'fast'});
  assert.equal(el.calls[0].options.duration,570);assert.equal(el.calls[0].options.easing,tokens['--spring-spatial']);assert.equal(el.calls[1].options.duration,140);assert.equal(el.calls[1].options.easing,tokens['--spring-effects']);assert.equal(el.calls[0].cancelled,false);
});
test('interruption cancels only its own property channel and samples the visible value',()=>{
  const el=element(),spatial=motion(el,[{scale:0},{scale:1}]),fade=motion(el,[{opacity:0},{opacity:1}],{kind:'effects'});
  const original=getComputedStyle;globalThis.getComputedStyle=target=>target===el?{scale:'.75'}:original(target);
  const next=motion(el,[{scale:.5},{scale:1}]);assert.equal(next.frames[0].scale,'.75');assert.equal(spatial.cancelled,true);assert.equal(fade.cancelled,false);globalThis.getComputedStyle=original;
});
test('live Reduced Motion cancels active work and retains a <=150ms fade',()=>{
  const el=element(),active=motion(el,[{scale:0},{scale:1}]);media.matches=true;listeners.get('change')();assert.equal(active.cancelled,true);
  motion(el,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{delay:250,speed:'slow'});
  const fade=el.calls.at(-1);assert.equal(fade.options.duration,140);assert.equal(fade.options.delay,0);assert.deepEqual(fade.frames,[{opacity:0},{opacity:1}]);
  const count=el.calls.length;motion(el,[{scale:0},{scale:1}]);assert.equal(el.calls.length,count);media.matches=false;listeners.get('change')();
});
test('rapid snapshot updates run once each, in order, with a direct API fallback',async()=>{
  const callbacks=[],records=[];
  document.startViewTransition=callback=>{callbacks.push(callback);return {skipTransition(){records.push('skip');},ready:Promise.resolve(),finished:new Promise(()=>{}),updateCallbackDone:Promise.resolve()};};
  withTransition(()=>records.push('first'),{type:'filter'});withTransition(()=>records.push('second'),{type:'filter'});assert.deepEqual(records,['first','skip']);callbacks[0]();callbacks[1]();assert.deepEqual(records,['first','skip','second']);
  delete document.startViewTransition;await withTransition(()=>records.push('fallback'));assert.equal(records.at(-1),'fallback');
});
test('linear() fallback and collision-free CSS identifiers for event IDs',()=>{
  CSS.supports=()=>false;const el=element();motion(el,[{opacity:0},{opacity:1}],{kind:'effects'});assert.equal(el.calls[0].options.easing,'cubic-bezier(.2,0,0,1)');CSS.supports=()=>true;
  const names=['p1','a b','a-b','A','a','💫','a";x'].map(id=>transitionName(id));assert.equal(new Set(names).size,names.length);names.forEach(name=>assert.match(name,/^[a-z][a-z0-9-]+$/));
});
