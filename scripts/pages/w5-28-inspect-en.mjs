// W5-28 step 5 사전 조사 5 — 누락 영문 필드 전문·handoff 한글 대응 항목 (재실행 가능)
import fs from 'node:fs';
import { parseInsertLine } from './ck3-stats.mjs';
function splitStatements(text) {
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return { lines: text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0) };
}
const DETAIL_COLS = ['person_id', 'clan_id', 'json', 'json_ko'];
const rows = splitStatements(fs.readFileSync('data/sql/090-person-details.sql', 'utf8')).lines.filter((l) => l.startsWith('INSERT INTO person_detail')).map((l) => parseInsertLine(l, 'person_detail', DETAIL_COLS));
const rBy = new Map(rows.map((r) => [r.person_id, r]));
const get = (pid, col, path) => {
  const j = JSON.parse(rBy.get(pid)[col]);
  const parts = path.replace(/^\$\./, '').split(/[.[]/).map((s) => s.replace(/\]$/, ''));
  let cur = j;
  for (const p of parts) cur = cur[isNaN(p) ? p : Number(p)];
  return cur;
};
const show = (pid, col, path) => console.log(`--- ${pid} ${col} ${path} ---\n${JSON.stringify(get(pid, col, path))}\n`);
show('person-1017', 'json', '$.fields["Civil and Community Duties"]');
show('person-1017', 'json', '$.fields.Affiliation');
show('person-1018', 'json', '$.fields.Affiliation');
show('person-1018', 'json', '$.fields["Civil and Community Duties"]');
show('person-0998', 'json', '$.fields.Rank');
show('person-0998', 'json_ko', '$.fields.품계');
show('person-0998', 'json', '$.biography');
// handoff의 1017/1018 ko stale-role 항목의 정확한 old/new
const H = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-25-handoff-090.json', 'utf8'));
for (const it of H.items.filter((x) => x.rule === 'bible6-stale-role' && (x.person === 'person-1017' || x.person === 'person-1018'))) {
  console.log(`== ${it.person} ${it.column} ${it.path} ==\nOLD: ${JSON.stringify(it.old).slice(0, 600)}\nNEW: ${JSON.stringify(it.new).slice(0, 600)}\n`);
}
// 1017 json biography 전문 (영문 대응 필요)
show('person-1017', 'json', '$.biography');
