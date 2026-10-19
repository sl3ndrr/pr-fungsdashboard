import test from 'node:test';
import assert from 'node:assert/strict';
import { tooltipPosition, timelineGeometry, timelineDatePosition, appointmentRows } from '../js/layout.js';

test('tooltip prefers above, falls below, and clamps all viewport edges', () => {
  const size = {width:260,height:100}, viewport = {width:360,height:640};
  assert.deepEqual(tooltipPosition({left:150,width:20,top:200,bottom:240},size,viewport), {left:30,top:92,placement:'above'});
  assert.deepEqual(tooltipPosition({left:0,width:20,top:20,bottom:60},size,viewport), {left:12,top:68,placement:'below'});
  assert.equal(tooltipPosition({left:350,width:20,top:20,bottom:600},size,viewport).left,88);
  assert.equal(tooltipPosition({left:0,width:20,top:2,bottom:1000},size,viewport).top,528);
});

test('dense dates fit a desktop rail without growth; hit areas and order remain inside', () => {
  const dates = [.04,.05,.1,.8,.9,.95,.96,.96,.97,.97,1];
  for (const available of [400,600,1000,1800]) {
    const {width,xs} = timelineGeometry(dates,available);
    assert.equal(width,available);
    assert.ok(xs[0]>=22 && xs.at(-1)<=width-22);
    for(let i=1;i<xs.length;i++) assert.ok(xs[i]-xs[i-1]>=32-1e-8);
  }
  assert.equal(timelineGeometry(dates,280).width,364);
});

test('one plus two appointments share a row with explicit group labels and stable order', () => {
  const cards = [{id:'a',group:'Diese Woche'}, {id:'b',group:'Oktober'}, {id:'c',group:'Oktober'}];
  const rows = appointmentRows(cards,item=>item.group,3);
  assert.equal(rows.length,1);
  assert.deepEqual(rows[0].groups,['Diese Woche','Oktober']);
  assert.deepEqual(rows[0].cards,cards);
  assert.equal(rows[0].showHeading,true);
  for(const columns of [1,2,3,4]) {
    const packed = appointmentRows([...cards,...cards],item=>item.group,columns);
    assert.deepEqual(packed.flatMap(row=>row.cards),[...cards,...cards]);
    assert.ok(packed.slice(0,-1).every(row=>row.cards.length===columns));
  }
});

test('dates between crowded same-day groups stay outside both groups', () => {
  const position=day=>timelineDatePosition(day,[0,0,10,10],[22,54,86,118],-1,11,140);
  assert.equal(position(0),38);
  assert.equal(position(10),102);
  assert.ok(position(1)>54 && position(9)<86);
  assert.equal(position(-1),0);
  assert.equal(position(11),140);
  assert.equal(timelineDatePosition(5,[],[],0,10,100),50);
});
