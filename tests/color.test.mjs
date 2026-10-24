import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../css/styles.css',import.meta.url),'utf8');
const roles=new Map([...css.matchAll(/--([\w-]+): light-dark\((#[\da-f]+), (#[\da-f]+)\)/g)].map(match=>[match[1],[match[2],match[3]]]));
function rgb(hex){let s=hex.slice(1);if(s.length===3)s=[...s].map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255);}
function luminance(color){return color.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const mix=(a,b,weight)=>a.map((v,i)=>v*weight+b[i]*(1-weight));
const color=(name,mode)=>rgb(roles.get(name)[mode]);
test('M3 text/semantic role pairs reach WCAG AA in both palettes',()=>{
  const pairs=[['on-primary','primary'],['on-primary-container','primary-container'],['on-secondary-container','secondary-container'],['on-tertiary','tertiary'],['on-tertiary-container','tertiary-container'],['on-error-container','error-container'],['primary','primary-container'],['tertiary','tertiary-container'],['error','error-container']];
  for(const surface of ['surface','surface-container-lowest','surface-container-low','surface-container','surface-container-high'])pairs.push(['on-surface',surface],['on-surface-variant',surface]);
  for(const [ink,paper] of pairs)for(const mode of [0,1])assert.ok(contrast(color(ink,mode),color(paper,mode))>=4.5,`${ink}/${paper}, mode ${mode}`);
});
test('progress tracks and past timeline points retain at least 3:1 non-text contrast',()=>{
  for(const mode of [0,1]){
    for(const [ink,paper,fill,weight] of [['on-surface','surface-container','tertiary',.16],['on-primary-container','primary-container','on-primary-container',.2],['on-tertiary-container','tertiary-container','tertiary',.16]])assert.ok(contrast(color(fill,mode),mix(color(ink,mode),color(paper,mode),weight))>=3,`${fill} progress track, mode ${mode}`);
    for(const type of ['primary','error','tertiary'])assert.ok(contrast(mix(color(type,mode),color('surface-container-low',mode),.85),color('surface-container-low',mode))>=3,`${type} past dot, mode ${mode}`);
  }
});



test('period labels and neutral past points keep contrast in both timeline themes',()=>{
  for(const mode of [0,1]){
    const surface=color('surface-container-low',mode);
    for(const period of [[249,115,22],[139,92,246]]){
      const background=mix(period.map(v=>v/255),surface,.1);
      assert.ok(contrast(color('on-surface',mode),background)>=4.5);
    }
    assert.ok(contrast(color('outline',mode),surface)>=3);
  }
});


test('retained calendar boundaries and selected controls meet 3:1 in both themes',()=>{
  for(const mode of [0,1]) {
    for(const paper of ['surface-container-low','surface-container','surface-container-high']) {
      assert.ok(contrast(color('outline',mode),color(paper,mode))>=3,`outline/${paper}, mode ${mode}`);
    }
    assert.ok(contrast(color('primary',mode),color('secondary-container',mode))>=3);
    for(const type of ['primary','error','tertiary'])assert.ok(contrast(color(type,mode),color('surface-container-low',mode))>=3);
  }
});

test('tonal follow-up rows retain AA with the inherited hero ink',()=>{
  for(const mode of [0,1])for(const [ink,paper] of [['on-primary-container','primary-container'],['on-error-container','error-container']]) {
    assert.ok(contrast(color(ink,mode),mix(color(ink,mode),color(paper,mode),.08))>=4.5);
  }
});
