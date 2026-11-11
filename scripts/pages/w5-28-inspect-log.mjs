// W5-28 사전 조사 6 — handoff 원시 항목 필드명·aux apply-log 구조 (재실행 가능)
import fs from 'node:fs';
const H = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-25-handoff-090.json', 'utf8'));
const sr = H.items.filter((x) => x.rule === 'bible6-stale-role');
console.log('stale-role item keys:', Object.keys(sr[0]).join(','));
console.log('sample raw:', JSON.stringify(sr[0]).slice(0, 700));
console.log('1017 stale-role paths:', sr.filter((x) => x.person === 'person-1017').map((x) => `${x.column}:${x.path}`).join(' | '));
console.log('1018 stale-role paths:', sr.filter((x) => x.person === 'person-1018').map((x) => `${x.column}:${x.path}`).join(' | '));
console.log('1022 stale-role paths:', sr.filter((x) => x.person === 'person-1022').map((x) => `${x.column}:${x.path}`).join(' | '));
// bible6-exception 0086/0088/1003/0057 경로·열
for (const pid of ['person-0086', 'person-0088', 'person-1003', 'person-0057', 'person-0998', 'person-1017', 'person-1018']) {
  const es = H.items.filter((x) => x.rule === 'bible6-exception' && x.person === pid);
  console.log(`b6e ${pid}:`, es.map((x) => `${x.column}:${x.path}`).join(' | '));
}
// aux apply-log 구조
const L = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-25-apply-log.json', 'utf8'));
console.log('\napply-log top keys:', Object.keys(L).join(','));
for (const k of Object.keys(L)) {
  const v = L[k];
  if (Array.isArray(v)) console.log(`  ${k}: array(${v.length}) sample=${JSON.stringify(v[0]).slice(0, 200)}`);
  else if (typeof v === 'object' && v) console.log(`  ${k}: object(${Object.keys(v).length}) keys=${Object.keys(v).slice(0, 6).join(',')}`);
}
// 1017 json fields 키 전체
import { parseInsertLine } from './ck3-stats.mjs';
function splitStatements(text) {
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return { lines: text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0) };
}
const rows = splitStatements(fs.readFileSync('data/sql/090-person-details.sql', 'utf8')).lines.filter((l) => l.startsWith('INSERT INTO person_detail')).map((l) => parseInsertLine(l, 'person_detail', ['person_id', 'clan_id', 'json', 'json_ko']));
const j = JSON.parse(rows.find((r) => r.person_id === 'person-1017').json);
console.log('\n1017 json fields keys:', Object.keys(j.fields).join(' | '));
console.log('1017 fields:', JSON.stringify(j.fields, null, 0).slice(0, 500));
