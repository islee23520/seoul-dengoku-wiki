// W5-28 — 0195/0057 org-map 정합 확인 (재실행 가능)
import fs from 'node:fs';
const H = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-25-handoff-090.json', 'utf8'));
for (const it of H.items.filter((x) => (x.person === 'person-0195' || x.person === 'person-0057') && x.rule === 'org-name-map')) {
  console.log(`== ${it.person} ${it.column} ${it.path} ==\nOLD: ${JSON.stringify(it.old).slice(0, 220)}\nNEW: ${JSON.stringify(it.new).slice(0, 220)}\n`);
}
