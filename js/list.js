import {store} from './state.js';
import {ICONS} from './data.js';
import {sittingRowsHTML} from './cards.js';
import {appointmentRows} from './layout.js';
import {isEventPast, eventGroup, escapeHtml, typeClass, isEventDone, canMarkPassed, cancelledStatus} from './utils.js';
import {syncSittingRows, syncChildren, transitionName, listenOnce, withTransition} from './motion.js';

function toggleDone(id) {
  return withTransition(() => {
    store.toggleDone(id);
  }, {type:'done'});
}

export function renderList(sorted, todayMid, animate) {
  const {semester, doneItems, showPast, typeFilter} = store.get();
  const listTarget=document.getElementById('list');
  const listEl=document.createElement('div');
  
  // Filter-Logik für die Liste
  const visibleEvents = sorted.filter(item => {
    if (!showPast && isEventPast(item, todayMid)) return false;

    return typeFilter === 'all' || item.type === typeFilter;
  });

  if (visibleEvents.length === 0) {
    listEl.innerHTML = `<div class="empty-state" data-key="empty" style="view-transition-name:empty-state" role="listitem">Keine ${typeFilter === 'all' ? 'Termine' : typeFilter === 'Prüfung' ? 'Prüfungen' : typeFilter === 'Abgabe' ? 'Abgaben' : 'Termine'} in dieser Ansicht.</div>`;
  }

  const groupFor = item => eventGroup(item, todayMid, doneItems);
  const orderedEvents = visibleEvents;
  const columns = Number(getComputedStyle(listTarget).getPropertyValue('--list-columns')) || 1;
  const itemGroups = new Map();
  const groupIds = new Map();
  const mixedIds = new Set();
  appointmentRows(orderedEvents, groupFor, columns).forEach(row => {
    if (row.showHeading) {
      const key = row.cards[0].id;
      const heading = document.createElement('div');
      heading.className = 'group-row-heading';
      heading.dataset.key = `heading-${key}`;
      heading.setAttribute('role', 'listitem');
      heading.innerHTML = `<h3 id="${transitionName(key, 'row-heading')}" class="group-heading" style="view-transition-name:${transitionName(key, 'heading')}">${row.groups.map(group => {
        const id = transitionName(`${key}:${group}`, 'group');
        groupIds.set(group, id);
        return `<span id="${id}">${escapeHtml(group)}</span>`;
      }).join('<span aria-hidden="true"> · </span>')}</h3>`;
      listEl.appendChild(heading);
    }
    row.cards.forEach(item => {
      const group = groupFor(item);
      if (row.groups.length > 1) mixedIds.add(item.id);
      // Metadata is assigned before the cards are appended to the same grid.
      itemGroups.set(item.id, { group, labelId: groupIds.get(group) });
    });
    row.cards.forEach(item => listEl.appendChild(buildCard(item)));
  });
  function buildCard(item) {
    const { group, labelId } = itemGroups.get(item.id);
    const idx = orderedEvents.indexOf(item);
    const safeId = escapeHtml(item.id);
    const isAbgabe = item.type === 'Abgabe';
    const isDone = isEventDone(item, doneItems);
    const past = isEventPast(item, todayMid);

    const checkElement = isAbgabe
      ? `<label class="done-toggle"><input type="checkbox" ${isDone ? 'checked' : ''} aria-label="${escapeHtml(item.title)} erledigt"><svg class="check-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="visually-hidden">${isDone ? 'Erledigt' : 'Abhaken'}</span></label>`
      : '';

    const card = document.createElement('div');
    card.className = `card ${typeClass(item.type)} ${past && !item.isCancelled ? 'past' : ''} ${isDone && !item.isCancelled ? 'done' : ''} ${item.isCancelled ? 'cancelled' : ''} `;
    card.id = `card-${item.id}`;
    card.tabIndex = -1;
    card.style.viewTransitionName=transitionName(item.id);
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-labelledby', `title-${item.id} ${labelId}`);
    if (animate) card.style.setProperty('--delay', Math.min(idx * 0.025, 0.15) + 's');
    card.innerHTML = `
      <div class="card-header" data-key="${safeId}-header">
        <div class="type-icon ${typeClass(item.type)}" data-key="${safeId}-icon" role="img" aria-label="${escapeHtml(item.type)}">${ICONS[item.type]}</div>
        <div class="info" data-key="${safeId}-info">
          ${mixedIds.has(item.id) ? `<span class="card-group" data-key="${safeId}-group">${escapeHtml(group)}</span>` : ''}
          <h4 id="title-${escapeHtml(item.id)}" class="title"><span class="title-text" data-key="${safeId}-title-text">${escapeHtml(item.title)}</span></h4>
        </div>
        ${checkElement}
      </div>
      ${canMarkPassed(item, todayMid, doneItems) ? `<label class="done-toggle passed-toggle" data-key="${safeId}-passed"><input data-key="${safeId}-passed-input" type="checkbox" ${isDone ? 'checked' : ''} aria-label="${escapeHtml(item.title)}: Bestanden – B entfällt"><svg class="check-mark" data-key="${safeId}-passed-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span data-key="${safeId}-passed-text">Bestanden – B entfällt</span></label>` : ''}
      ${item.isCancelled ? `<div class="meta" data-key="${safeId}-status"><span class="cancelled-chip">${escapeHtml(cancelledStatus(item))}</span></div>` : ''}
      <div class="sitting-list" data-key="${safeId}-sittings">${sittingRowsHTML(item, todayMid, {doneItems, examsFrom:semester.examsFrom})}</div>
    `;

    return card;
  }

  syncSittingRows(() => syncChildren(listTarget,listEl));
  listTarget.querySelectorAll('.done-toggle input').forEach(input=>listenOnce(input,'change',()=>toggleDone(input.closest('.card').id.slice(5))));
}
