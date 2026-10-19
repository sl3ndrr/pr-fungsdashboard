import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('function updateCalendarVisibility()'),source.indexOf('\nfunction toggleCalendar()'));

test('calendar starts closed for both mobile and desktop media matches',()=>{
  const initialState=source.slice(source.indexOf('let doneItems  = []'),source.indexOf('// Kalendergrenzen'));
  for(const matches of [false,true]) {
    const visible=new Function('matchMedia',initialState+';return calVisible;')(()=>({matches,addEventListener:()=>{}}));
    assert.equal(visible,false);
  }
});

test('closing the calendar removes controls and returns internal focus to the toggle',()=>{
  for(const focusInCalendar of [false,true])for(const open of [false,true]) {
    const calls=[];
    const section={contains:()=>focusInCalendar};
    const popover={contains:()=>false};
    const main={dataset:{}};
    const toggle={classList:{toggle:(name,value)=>calls.push(['active',value])},setAttribute:(name,value)=>calls.push([name,value]),focus:()=>calls.push(['focus'])};
    const deps={calVisible:open,document:{activeElement:{},getElementById:id=>({'calendar-section':section,'cal-popover':popover,'main-grid':main,'cal-toggle-btn':toggle})[id]},renderCalendar:()=>calls.push(['render']),closeCalMenu:()=>calls.push(['close']),setExpanded:(el,value)=>calls.push(['expanded',value])};
    new Function(...Object.keys(deps),fn+';updateCalendarVisibility()')(...Object.values(deps));
    assert.equal(main.dataset.calendarOpen,String(open));
    assert.ok(calls.some(([name,value])=>name==='expanded'&&value===open));
    assert.equal(calls.some(([name])=>name==='focus'),!open&&focusInCalendar);
    assert.equal(calls.some(([name])=>name==='render'),open);
  }
});
