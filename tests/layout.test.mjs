import test from 'node:test';
import assert from 'node:assert/strict';
import { tooltipPosition, timelineEventLayout, timelinePosition, timelineLabelLayout, appointmentRows } from '../js/layout.js';

test('tooltip prefers above, falls below, and clamps all viewport edges', () => {
  const size = {width:260,height:100}, viewport = {width:360,height:640};
  assert.deepEqual(tooltipPosition({left:150,width:20,top:200,bottom:240},size,viewport), {left:30,top:92,placement:'above'});
  assert.deepEqual(tooltipPosition({left:0,width:20,top:20,bottom:60},size,viewport), {left:12,top:68,placement:'below'});
  assert.equal(tooltipPosition({left:350,width:20,top:20,bottom:600},size,viewport).left,88);
  assert.equal(tooltipPosition({left:0,width:20,top:2,bottom:1000},size,viewport).top,528);
});

test('dense dates fit one width and alternate disjoint 44px target lanes', () => {
  const dates = [0,.04,.05,.1,.8,.9,.95,.96,.96,.97,.97,1];
  for (const available of [200,280,400,600,1000,2300]) {
    const width=available, xs=dates.map(day=>timelinePosition(day,0,1,width));
    const lanes=timelineEventLayout(xs.map(x=>({x,variants:[{width:44}]})),width,0).map(item=>item.lane);
    xs.forEach((x,i)=>assert.equal(x,22+dates[i]*(width-44)));
    for(let i=0;i<xs.length;i++)for(let j=0;j<i;j++) {
      assert.ok(Math.abs(xs[i]-xs[j])>=44-1e-8 || lanes[i] !== lanes[j]);
    }
  }
  assert.deepEqual(timelineEventLayout([.5,.5,.5,.5].map(x=>({x:x*280,variants:[{width:44}]})),280).map(item=>item.lane),[-1,1,-2,2]);
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

test('every date uses the same linear map, including dates between same-day groups', () => {
  const position=day=>timelinePosition(day,0,10,144);
  assert.equal(position(0),22);
  assert.equal(position(10),122);
  for (let day=0;day<10;day++) assert.equal(position(day+1)-position(day),10);
});

test('crowded month labels stay whole and never overlap on the visible rail', () => {
  const labels = [0, 12, 84, 150, 235, 310].map(anchor => ({anchor, width: 62}));
  for (const [min,max] of [[0,280],[26,310],[100,380],[0,600]]) {
    const layout = timelineLabelLayout(labels,min,max);
    layout.labels.forEach((placed,i) => {
      if (!placed.visible) { assert.ok(labels[i].anchor < min || labels[i].anchor > max); return; }
      assert.ok(placed.center - 31 >= min && placed.center + 31 <= max);
      layout.labels.slice(i+1).forEach(other => {
        if (other.visible && other.row === placed.row) assert.ok(other.center - placed.center >= 74);
      });
    });
  }
  assert.ok(timelineLabelLayout(labels,0,280).rows > 1);
});

test('partially overlapping labels stay complete; fully outside labels are omitted', () => {
  const labels = [{anchor:20,start:0,end:40,width:100},{anchor:100,start:60,end:140,width:100}];
  const layout = timelineLabelLayout(labels,30,150);
  assert.deepEqual(layout.labels,[{visible:true,center:80,row:0},{visible:true,center:100,row:1}]);
  assert.equal(timelineLabelLayout(labels,45,165).labels[0].visible,false);
  assert.equal(timelineLabelLayout(labels,150,270).rows,0);
});


