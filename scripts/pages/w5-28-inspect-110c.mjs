// W5-28 step 5b 사전 조사 3 — 임하준 관련 셀 전문·한영 대응 (재실행 가능)
import fs from 'node:fs';
import { parseInsertLine } from './ck3-stats.mjs';
function splitStatements(text) {
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0);
}
const trees = splitStatements(fs.readFileSync('data/sql/110-family-trees.sql', 'utf8')).filter((l) => l.startsWith('INSERT INTO family_tree')).map((l) => parseInsertLine(l, 'family_tree', ['clan_id', 'json', 'json_ko']));
for (const cid of ['bc15-bc00-c591', 'c784-c608-cc9c-6797', 'c784-c870-c591-6797']) {
  const t = trees.find((r) => r.clan_id === cid);
  const je = JSON.parse(t.json); const jk = JSON.parse(t.json_ko);
  console.log(`===== clan ${cid} =====`);
  je.nodes.forEach((n, i) => {
    const en = (n.timeline ?? []).map((x) => x.summary).join(' / ');
    const ko = (jk.nodes[i].timeline ?? []).map((x) => x.summary).join(' / ');
    if (en || ko) console.log(`[node ${i}] ${n.name}\n  EN: ${en}\n  KO: ${ko}\n`);
  });
}
