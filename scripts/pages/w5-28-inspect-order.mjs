// W5-28 사전 조사 9 — 050 state_id 최종값·유지 인물 org-name 항목 경로 (재실행 가능)
import fs from 'node:fs';
import { parseInsertLine } from './ck3-stats.mjs';
function splitStatements(text) {
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return { lines: text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0) };
}
const PEOPLE_COLS = ['id', 'sort', 'faction_id', 'name', 'name_ko', 'title', 'title_ko', 'position', 'position_ko', 'rank', 'rank_ko', 'tier', 'occupation', 'occupation_ko', 'gender', 'gender_ko', 'stage', 'stage_ko', 'state_id', 'state_name', 'state_name_ko'];
const people = splitStatements(fs.readFileSync('data/sql/050-wiki-people.sql', 'utf8')).lines.filter((l) => l.startsWith('INSERT INTO wiki_person')).map((l) => parseInsertLine(l, 'wiki_person', PEOPLE_COLS));
const sv = {};
for (const p of people) sv[p.state_id] = (sv[p.state_id] ?? 0) + 1;
console.log('050 state_id distribution:', JSON.stringify(sv));
for (const id of ['person-1009', 'person-1017', 'person-1010', 'person-0195']) console.log(id, people.find((p) => p.id === id).state_id);
// 유지/승인 인물의 org-name-map이 title계 필드를 건드리나
const H = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-25-handoff-090.json', 'utf8'));
for (const pid of ['person-0195', 'person-0374', 'person-1009', 'person-1010', 'person-1022']) {
  const items = H.items.filter((x) => x.person === pid && x.rule === 'org-name-map' && /^\$\.(title|position|rank|occupation)(\.|$)/.test(x.path));
  console.log(`${pid} org-on-titleish:`, items.map((x) => `${x.column}:${x.path}`).join(' | ') || '(none)');
}
// handoff에서 (person,column,path) 중복 replace 확인
const seen = new Map(); let dup = 0;
for (const it of H.items.filter((x) => x.action === 'replace')) {
  const k = `${it.person}|${it.column}|${it.path}`;
  if (seen.has(k)) dup++;
  seen.set(k, true);
}
console.log('duplicate replace (person|column|path):', dup);
