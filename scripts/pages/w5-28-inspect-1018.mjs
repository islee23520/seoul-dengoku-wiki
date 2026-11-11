// W5-28 사전 조사 8 — 1018 org-name-map new 값 확인 (재실행 가능)
import fs from 'node:fs';
const H = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-25-handoff-090.json', 'utf8'));
for (const it of H.items.filter((x) => x.person === 'person-1018' && x.rule === 'org-name-map')) {
  console.log(`== ${it.column} ${it.path} ==\nOLD: ${it.old}\nNEW: ${it.new}\n`);
}
