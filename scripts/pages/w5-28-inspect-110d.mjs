// W5-28 step 5b 사전 조사 4 — aux 변경 110 셀 휴리스틱 스캔 (재실행 가능)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseInsertLine } from './ck3-stats.mjs';
import { execFileSync } from 'node:child_process';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function splitStatements(text) {
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0);
}
// aux가 변경한 셀 = w2-applied(사전 상태)와 현재의 경로 단위 비교
const parent110 = execFileSync('git', ['-C', REPO, 'show', 'origin/feat/w2-applied:data/sql/110-family-trees.sql'], { encoding: 'utf8', maxBuffer: 1 << 26 });
const parentTrees = new Map(splitStatements(parent110).filter((l) => l.startsWith('INSERT INTO family_tree')).map((l) => { const r = parseInsertLine(l, 'family_tree', ['clan_id', 'json', 'json_ko']); return [r.clan_id, r]; }));
const trees = splitStatements(fs.readFileSync(path.join(REPO, 'data/sql/110-family-trees.sql'), 'utf8')).filter((l) => l.startsWith('INSERT INTO family_tree')).map((l) => parseInsertLine(l, 'family_tree', ['clan_id', 'json', 'json_ko']));

const collectStrings = (o, p, out, col) => {
  if (Array.isArray(o)) { o.forEach((v, i) => collectStrings(v, `${p}[${i}]`, out, col)); return; }
  if (o && typeof o === 'object') { for (const [k, v] of Object.entries(o)) collectStrings(v, p ? `${p}.${k}` : k, out, col); return; }
  if (typeof o === 'string') out.push({ path: p, v: o, col });
};
let changedCells = 0;
const findings = [];
const H = {
  midCapEN: /[a-z], (?:In|The|He|She|It|They|When|After|Before|Unlike|On|At|By|For|With)\b/g,
  doubled: /\b([A-Za-z가-힣]+)[ \u00a0]+\1\b/gi,
  article: /\b(?:an (?:The Government|Free City)|a (?:Arc))/g,
  particle: /(?:정부|자유도시)(?:은|이|을|과)|아크(?:는|가|를|와)|자유도시(?:은|이|을|과)/g,
  hangulInEN: /[가-힣]/g,
};
for (const t of trees) {
  const par = parentTrees.get(t.clan_id);
  for (const col of ['json', 'json_ko']) {
    const cur = JSON.parse(t[col]);
    const old = par ? JSON.parse(par[col]) : null;
    const strs = []; collectStrings(cur, '', strs, col);
    const oldMap = new Map();
    if (old) { const arr = []; collectStrings(old, '', arr, col); for (const s of arr) oldMap.set(s.path, s.v); }
    for (const { path: p, v } of strs) {
      if (oldMap.get(p) === v) continue; // 같은 경로 같은 값 = 변경 아님
      changedCells++;
      if (H.midCapEN.test(v)) { H.midCapEN.lastIndex = 0; findings.push({ clan: t.clan_id, col, p, kind: 'midCapEN', v: v.slice(0, 160) }); } H.midCapEN.lastIndex = 0;
      const d = [...v.matchAll(H.doubled)]; if (d.length) findings.push({ clan: t.clan_id, col, p, kind: 'doubled', m: d.map((x) => x[0]).join('|'), v: v.slice(0, 120) });
      const a = [...v.matchAll(H.article)]; if (a.length) findings.push({ clan: t.clan_id, col, p, kind: 'article', m: a.map((x) => x[0]).join('|') });
      const pt = [...v.matchAll(H.particle)]; if (pt.length) findings.push({ clan: t.clan_id, col, p, kind: 'particle', m: pt.map((x) => x[0]).join('|'), v: v.slice(0, 120) });
      if (col === 'json' && /[가-힣]/.test(v)) findings.push({ clan: t.clan_id, col, p, kind: 'hangul-in-en', v: v.slice(0, 120) });
    }
  }
}
console.log('changed cells (approx):', changedCells, 'trees:', trees.length);
const byKind = {};
for (const f of findings) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
console.log('findings by kind:', JSON.stringify(byKind));
for (const f of findings.slice(0, 40)) console.log(JSON.stringify(f).slice(0, 260));
