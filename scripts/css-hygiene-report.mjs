import {readFileSync} from 'node:fs';
import {scanCSS,duplicates} from './css-duplicates.mjs';

const source=readFileSync(process.argv[2] || 'css/styles.css','utf8');
const rules=scanCSS(source);
const targets=new Map([
  ['.page-header',400],['.hero-number',453],['.stats-container',409],['.card',265],
  ['.mini-progress',550],['.mini-progress span',551],['.countdown',483],
  ['.timeline-period-label',427],['.timeline-dot::before',567],['.cal-day-details',580],
]);

function winner(rule,declaration) {
  const matches=rule.selectors.map(selector=>{
    for(let i=rules.length-1;i>=0;i--) {
      const later=rules[i];
      if(later.start<=rule.start || later.context.length || !later.selectors.includes(selector))continue;
      const d=later.declarations.find(d=>d.property===declaration.property && (d.important || !declaration.important));
      if(d)return later.line;
    }
  });
  if(matches.every(Boolean))return [...new Set(matches)].join('/');
  if(declaration.property==='background' && ['.hero-period .mini-progress span','.stat-tile .mini-progress span'].includes(rule.selector))return '551 (!important)';
  if(declaration.property==='display' && rule.selector==='.timeline-dot:hover .timeline-tooltip, .timeline-dot:focus-visible .timeline-tooltip')return '573 (identisch flex)';
}

const reasons=new Map([
  ['.hero','Basis-Padding bleibt vor der mobilen Regel; Tonalfläche und Motion separat'],
  ['.card','Basis bleibt vor dem mobilen Padding; Typ-/Past-/Done-/Hover-Regeln haben höhere Spezifität'],
  ['.theme-switch-thumb','Border-Shorthand vor späterer border-color; gemeinsamer Control-Rand und Motion getrennt'],
  ['.theme-switch','gemeinsamer Control-Rand, Tonalfläche und Motion; Reihenfolge der Border-Shorthands bewahren'],
  ['.pill','gemeinsame Button-/Control-Regeln und mobile Overrides; Basis-Schrift und State-Layer getrennt'],
  ['.cal-day','Basis-Mindesthöhe/Padding vor mobiler Regel; Shape, Border und Motion separat'],
  ['.title','Font-/Background-Shorthands und späteres background-image; State-Regeln behalten ihre Spezifität'],
  ['.hero-number','font-Shorthand liefert Familie/Gewicht; spätere Größe/Variation übersteuern nur Teilwerte'],
  [':root','getrennte Token-Familien und Feature-/Motion-Fallbacks; keine neuen Token'],
  ['.countdown','gemeinsame tabular-nums-Regel und Effects/Spatial-Regel bleiben; Status ist spezifischer'],
  ['.timeline-tooltip','Position/Fläche, Spatial/Effects sowie Reduced Motion bleiben getrennt'],
  ['.timeline-legend-cancelled','Geometrie bleibt separat vom mit .timeline-point geteilten Status'],
]);
const groups=duplicates(source);
let output='# CSS-Duplikate: vollständiges Inventar aus PR B\n\n';
output+='Automatisch erzeugt mit `node scripts/css-hygiene-report.mjs <PR-B-styles.css>`.\n';
output+=`${groups.length} mehrfach vorkommende Einzelselektoren, ${groups.reduce((n,g)=>n+g.occurrences.length,0)} Fundstellen. Selektorlisten werden außerhalb von Klammern/Strings geteilt; Media, Supports und Starting Style werden mit Kontext erfasst. Keyframe-Offsets und Property-Deskriptoren sind keine Selektoren. Zeilen beziehen sich auf B.\n\n`;
output+='„Teilweise“ nennt jede entfernte Property samt späterem Gewinner. Restdeklarationen werden an den angegebenen Zielstellen zusammengeführt, soweit die dazwischenliegende Kaskade dies erlaubt. Verbleibende Basis-/Gruppenregeln sind bewusste Ergänzungen oder Überschreibungen; ihr Standort bleibt erhalten. Der Bericht ersetzt keinen Browservergleich.\n\n';
output+='| Selektor | Zeile / Kontext | Klassifikation und Aktion | Bewusst verbleibend / Grund |\n| --- | --- | --- | --- |\n';
const edited=new Map();
for(const group of groups)for(const occurrence of group.occurrences) {
  const rule=rules.find(r=>r.line===occurrence.line && r.selector===occurrence.rule && JSON.stringify(r.context)===JSON.stringify(occurrence.context));
  const removed=rule.context.length?[]:rule.declarations.flatMap(d=>{
    const line=winner(rule,d);return line?[`${d.property} → ${line}`]:[];
  });
  const retained=rule.declarations.filter(d=>!removed.some(x=>x.startsWith(d.property+' →'))).map(d=>d.property);
  const target=targets.get(rule.selector);
  const merged=!rule.context.length && target && rule.line<target && retained.length;
  let action;
  if(!retained.length)action='Vollständig überschrieben: löschen ('+removed.join(', ')+')';
  else if(removed.length)action='Teilweise überschrieben: löschen '+removed.join(', ')+(merged?`; Rest → ${target}`:'; Rest am Ort behalten');
  else if(merged)action=`Teilweise Ergänzung: zusammenführen → ${target}`;
  else action='Bewusste Ergänzung/Überschreibung: behalten';
  if(removed.length || merged) {
    if(!edited.has(group.selector))edited.set(group.selector,[]);
    edited.get(group.selector).push(`${rule.line}: ${removed.length?'entfernt '+removed.join(', '):''}${merged?(removed.length?'; ':'')+'zusammengeführt → '+target+' ('+retained.join(', ')+')':''}`);
  }
  const reason=rule.context.length?'bedingt: '+rule.context.join(' / '):reasons.get(group.selector)||'gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten';
  output+=`| \`${group.selector}\` | ${rule.line}${rule.context.length?' / `'+rule.context.join(' / ')+'`':''} | ${action} | ${retained.length?retained.join(', ')+'; '+reason:'—'} |\n`;
}
output+='\n## Änderungen pro Selektor\n\n| Selektor | Entfernt / zusammengeführt (B-Zeilen) |\n| --- | --- |\n';
for(const [selector,changes]of edited)output+=`| \`${selector}\` | ${changes.join('; ')} |\n`;
output+='\nZusätzlich gelöscht: `.timeline-date-label` (221) und `.timeline-date-tick` (222), seit Fix 4b ohne DOM-Knoten; `.stat-tile .mini-progress span` (429), Background von transparent `!important` (551) überschrieben. Diese Selektoren kommen nur einmal vor und erscheinen daher nicht in der Duplikattabelle.\n';
console.log(output);
