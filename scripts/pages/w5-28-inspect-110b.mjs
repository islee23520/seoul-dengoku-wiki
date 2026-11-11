// W5-28 step 5b 사전 조사 2 — c624 전 노드·'Council of Elders' 전수 (재실행 가능)
import fs from 'node:fs';
import { parseInsertLine } from './ck3-stats.mjs';
function splitStatements(text) {
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0);
}
const trees = splitStatements(fs.readFileSync('data/sql/110-family-trees.sql', 'utf8')).filter((l) => l.startsWith('INSERT INTO family_tree')).map((l) => parseInsertLine(l, 'family_tree', ['clan_id', 'json', 'json_ko']));
const t = trees.find((r) => r.clan_id === 'c624-d574-c8fc');
const je = JSON.parse(t.json), jk = JSON.parse(t.json_ko);
je.nodes.forEach((n, i) => {
  const ko = jk.nodes[i];
  const koSum = (ko.timeline ?? []).map((x) => x.summary).join(' / ');
  const enSum = (n.timeline ?? []).map((x) => x.summary).join(' / ');
  if (enSum || koSum) console.log(`[node ${i}] ${n.name} (${n.personId})\n  EN: ${enSum.slice(0, 400)}\n  KO: ${koSum.slice(0, 400)}\n`);
});
console.log('== Council of Elders / 총회 장로 in 110 ==');
let count = 0;
for (const row of trees) {
  for (const [col, raw] of [['json', row.json], ['json_ko', row.json_ko]]) {
    if (/Council of Elders|장로회|총회의 장로|elders/i.test(raw)) {
      const j = JSON.parse(raw);
      const walk = (o, p) => {
        if (Array.isArray(o)) { o.forEach((v, i) => walk(v, `${p}[${i}]`)); return; }
        if (o && typeof o === 'object') { for (const [k, v] of Object.entries(o)) walk(v, `${p}.${k}`); return; }
        if (typeof o === 'string' && /Council of Elders|총회|장로회/i.test(o)) { count++; console.log(`${row.clan_id} ${col} ${p}: ${o.slice(0, 160)}`); }
      };
      walk(j, '');
    }
  }
}
console.log('total cells mentioning:', count);
