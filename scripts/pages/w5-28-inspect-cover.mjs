// W5-28 사전 조사 7 — 1017/1018/0998 handoff 항목 전수 (재실행 가능)
import fs from 'node:fs';
const H = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-25-handoff-090.json', 'utf8'));
for (const pid of ['person-1017', 'person-1018', 'person-0998']) {
  console.log(`===== ${pid} =====`);
  for (const it of H.items.filter((x) => x.person === pid)) {
    console.log(`${it.action.padEnd(15)} ${it.rule.padEnd(18)} ${it.column} ${it.path}`);
  }
}
