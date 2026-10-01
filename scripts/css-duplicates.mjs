import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// Small dependency-free scanner for this flat stylesheet. Strings, comments,
// parentheses and brackets are tokenised so SVG data URLs and :is() stay intact.
export function scanCSS(source) {
  const normaliseSelector = selector => selector.replace(/(\[[\w-]+[~|^$*]?=)(['"])(.*?)\2([ iIsS]*\])/g,
    (_,prefix,quote,value,suffix)=>prefix+JSON.stringify(value)+suffix);
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, text => text.replace(/[^\n]/g, ' '));
  const rules = [];
  function delimiter(start, end, chars) {
    let quote = '', depth = 0;
    for (let i = start; i < end; i++) {
      const c = clean[i];
      if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
      if (c === '"' || c === "'") { quote = c; continue; }
      if (c === '(' || c === '[') depth++;
      else if (c === ')' || c === ']') depth--;
      else if (!depth && chars.includes(c)) return i;
    }
    return end;
  }
  function split(start, end, char) {
    const parts = [];
    while (start < end) {
      const stop = delimiter(start, end, char);
      parts.push([start, stop]); start = stop + 1;
    }
    return parts;
  }
  function walk(start, end, context) {
    while (start < end) {
      while (/\s/.test(clean[start] || '') && start < end) start++;
      const open = delimiter(start, end, '{;');
      if (open === end) break;
      if (clean[open] === ';') { start = open + 1; continue; }
      let close = open + 1, level = 1;
      while (level && close < end) {
        close = delimiter(close, end, '{}');
        if (close === end) throw Error('Unclosed CSS block');
        level += clean[close] === '{' ? 1 : -1;
        if (level) close++;
      }
      const prelude = clean.slice(start, open).trim();
      if (prelude.startsWith('@')) {
        // Keyframe offsets and @property descriptors are not selectors.
        if (!/^@(?:[\w-]*keyframes|property)\b/.test(prelude)) walk(open + 1, close, [...context, prelude]);
      } else {
        const declarations = split(open + 1, close, ';').flatMap(([a,b]) => {
          const colon = delimiter(a,b,':');
          if (colon === b) return [];
          const property = clean.slice(a,colon).trim();
          const value = clean.slice(colon + 1,b).trim();
          return [{property:property.startsWith('--') ? property : property.toLowerCase(), value,
            important:/!important\s*$/i.test(value), start:a, end:b + (clean[b] === ';' ? 1 : 0)}];
        });
        rules.push({selector:prelude, selectors:split(start,open,',').map(([a,b])=>normaliseSelector(clean.slice(a,b).trim())),
          context, line:source.slice(0,start).split('\n').length, start, end:close + 1, declarations});
      }
      start = close + 1;
    }
  }
  walk(0,clean.length,[]);
  return rules;
}

export function duplicates(source) {
  const groups = new Map();
  for (const rule of scanCSS(source)) for (const selector of rule.selectors) {
    if (!groups.has(selector)) groups.set(selector, []);
    groups.get(selector).push({line:rule.line, context:rule.context, rule:rule.selector,
      declarations:rule.declarations.map(({property,value,important})=>({property,value,important}))});
  }
  return [...groups].filter(([,occurrences])=>occurrences.length > 1)
    .map(([selector,occurrences])=>({selector,occurrences}));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(duplicates(readFileSync(process.argv[2] || 'css/styles.css','utf8')),null,2));
}
