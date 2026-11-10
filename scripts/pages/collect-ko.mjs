// Collects every Korean string that must be translated before it enters data/sql.
import fs from 'node:fs'; import path from 'node:path';
const HANGUL = /[\uAC00-\uD7A3]/;
export const hasHangul = (s) => typeof s === 'string' && HANGUL.test(s);
export function walkJson(dir){ const out=[]; (function w(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); e.isDirectory()?w(p):p.endsWith('.json')&&out.push(p);} })(dir); return out.sort(); }
export function gddStrings(doc, add){
  (function w(n){ if(Array.isArray(n)) return n.forEach(w); if(!n||typeof n!=='object') return;
    if(n.kind==='text') add(n.text); if(n.kind==='docLink') add(n.text);
    if(n.kind==='table'){ (n.header||[]).forEach(add); (n.rows||[]).forEach(r=>Array.isArray(r)&&r.forEach(add)); }
    if(n.kind==='blockQuote') (n.lines||[]).forEach(add); if(n.kind==='codeFence') add(n.text);
    Object.values(n).forEach(w); })(doc.blocks);
}
