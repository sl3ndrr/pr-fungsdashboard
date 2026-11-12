import {expect} from 'playwright/test';
import {componentMeasurements,settleComponents} from './component-audit.mjs';

export {settleComponents as settle};

/** Measure the AP3 surfaces in the real browser, including composited token colors. */
export async function measureTimelineList(page) {
  const common=await componentMeasurements(page);
  const own=await page.evaluate(async()=>{
    const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
    const over=(front,back)=>front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3]));
    const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    const contrast=[...document.querySelectorAll('.timeline-month,.timeline-exam-phase span,.group-heading,.card .title')].map(el=>{
      const chain=[];for(let p=el;p;p=p.parentElement)chain.push(p);
      let bg=[255,255,255];for(const p of chain.reverse())bg=over(rgba(getComputedStyle(p).backgroundColor),bg);
      const a=lum(over(rgba(getComputedStyle(el).color),bg)),b=lum(bg);
      return {text:el.textContent,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    });
    const {store}=await import('/js/state.js');
    const {sortEvents,eventGroup,isEventPast,parseISOString,calendarDayDiff}=await import('/js/utils.js');
    const {timelineWindow,timelinePosition}=await import('/js/layout.js');
    const {today}=await import('/js/clock.js');
    const state=store.get(),day=today();
    const domain=timelineWindow(state.events,day,state.timelineMode,state.doneItems);
    const rail=document.querySelector('#timeline-container');
    const scaleErrors=[...document.querySelectorAll('.timeline-dot')].map(el=>{
      const point=box(el.querySelector('.timeline-point'));
      const expected=timelinePosition(calendarDayDiff(parseISOString(el.dataset.date),domain.origin),domain.minDay,domain.maxDay,rail.clientWidth);
      return Math.abs((point.left+point.right)/2-rail.getBoundingClientRect().left-expected);
    });
    const expected=sortEvents(state.events.filter(e=>!e.calOnly),day,state.doneItems)
      .filter(e=>(state.showPast||!isEventPast(e,day))&&(state.typeFilter==='all'||e.type===state.typeFilter));
    const cards=[...document.querySelectorAll('#list .card')].map(el=>({id:el.id,...box(el),
      labels:el.getAttribute('aria-labelledby').split(' ').map(id=>document.getElementById(id)?.textContent),
      group:eventGroup(state.events.find(e=>`card-${e.id}`===el.id),day,state.doneItems)}));
    const months=[...document.querySelectorAll('.timeline-month')].map(el=>({text:el.textContent,...box(el)}));
    const dots=[...document.querySelectorAll('.timeline-dot')].map(el=>({id:el.id,...box(el)}));
    const phase=document.querySelector('.timeline-exam-phase');
    const phaseGeometry=phase?{box:box(phase),label:box(phase.querySelector('span')),
      start:parseFloat(phase.style.getPropertyValue('--phase-start')),
      labelLeft:parseFloat(phase.style.getPropertyValue('--phase-label-left')),
      leaderWidth:parseFloat(phase.style.getPropertyValue('--phase-leader-width')),
      bandLeft:parseFloat(getComputedStyle(phase,'::before').left),
      name:phase.getAttribute('aria-label')}:null;
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
    return {contrast,cards,months,dots,phase:phaseGeometry,ids,scaleErrors,
      expected:expected.map(e=>`card-${e.id}`),headings:[...document.querySelectorAll('.group-heading')].map(el=>el.textContent),
      expectedGroups:expected.map(e=>eventGroup(e,day,state.doneItems)).filter((g,i,all)=>!i||g!==all[i-1])};
  });
  return {...common,...own};
}

export function assertTimelineList(g,messages=[]) {
  expect(messages).toEqual([]);
  expect(g.scrollWidth).toBeLessThanOrEqual(g.innerWidth);
  expect(g.targets.filter(r=>r.width<44||r.height<44)).toEqual([]);
  expect(g.overlaps).toEqual([]);
  expect(g.scaleErrors.every(error=>error<=.5)).toBe(true);
  expect(g.contrast.filter(r=>r.ratio<4.5)).toEqual([]);
  expect(new Set(g.ids).size).toBe(g.ids.length);
  expect(g.cards.map(c=>c.id)).toEqual(g.expected);
  expect(g.headings).toEqual(g.expectedGroups);
  for(const card of g.cards)expect(card.labels.every(Boolean)).toBe(true);
  for(let i=0;i<g.cards.length;i++) {
    const a=g.cards[i];
    for(const b of g.cards.slice(i+1)) {
      expect(b.top>a.top-.5).toBe(true);
      if(Math.abs(a.top-b.top)<.5) {
        expect(b.left).toBeGreaterThan(a.left);
        expect(b.group).toBe(a.group);
        expect(Math.abs(a.height-b.height)).toBeLessThan(.5);
      }
    }
  }
  for(let i=0;i<g.dots.length;i++)for(const b of g.dots.slice(i+1)) {
    const a=g.dots[i];
    expect(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top).toBe(false);
  }
  for(let i=1;i<g.months.length;i++) {
    expect(g.months[i].top).toBe(g.months[0].top);
    expect(g.months[i].left).toBeGreaterThanOrEqual(g.months[i-1].right);
  }
  if(g.phase) {
    expect(g.phase.name).toContain('Ende offen');
    expect(g.phase.label.left).toBeGreaterThanOrEqual(g.phase.box.left);
    expect(g.phase.label.right).toBeLessThanOrEqual(g.phase.box.right+.5);
    expect(Math.abs(g.phase.start-g.phase.bandLeft)).toBeLessThan(.001);
    expect(Math.abs(g.phase.labelLeft+g.phase.leaderWidth-g.phase.start)).toBeLessThan(.001);
  }
}
