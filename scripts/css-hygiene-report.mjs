import {readFileSync} from 'node:fs';
import {scanCSS,duplicates} from './css-duplicates.mjs';

const source=readFileSync(process.argv[2] || 'css/styles.css','utf8');
const rules=scanCSS(source),groups=duplicates(source);
let output='# CSS-Duplikate: generiertes Inventar\n\n';
output+='Reproduzierbar mit `node scripts/css-hygiene-report.mjs [styles.css]`. Nicht einchecken.\n\n';
output+=`${groups.length} wiederholte Einzelselektoren, ${groups.reduce((sum,g)=>sum+g.occurrences.length,0)} Fundstellen.\n\n`;
output+='Layer, Media, Supports, Container Queries und Starting Style sind getrennte Kontexte. Wiederholungen in unterschiedlichen Kontexten sind keine automatisch löschbaren Duplikate. Dieser Bericht beweist weder Spezifität noch Browsergleichheit.\n\n';
output+='| Selektor | Zeile / Kontext | Deklarationen | Hinweis |\n| --- | --- | --- | --- |\n';
for(const group of groups)for(const occurrence of group.occurrences){
  const context=JSON.stringify(occurrence.context);
  const rule=rules.find(r=>r.line===occurrence.line && r.selector===occurrence.rule && JSON.stringify(r.context)===context);
  const exactLater=rules.filter(r=>r.start>rule.start && JSON.stringify(r.context)===context && r.selectors.includes(group.selector));
  const repeated=rule.declarations.filter(d=>exactLater.some(r=>r.declarations.some(later=>later.property===d.property))).map(d=>d.property);
  const note=repeated.length?'Später im selben Kontext wiederholt: '+repeated.join(', ')+'; Shorthands/Spezifität manuell prüfen':'Ergänzung oder bedingter Override; Kontext beachten';
  output+=`| \`${group.selector}\` | ${rule.line} / \`${occurrence.context.join(' / ') || 'unlayered'}\` | ${rule.declarations.map(d=>d.property).join(', ')} | ${note} |\n`;
}
console.log(output);
