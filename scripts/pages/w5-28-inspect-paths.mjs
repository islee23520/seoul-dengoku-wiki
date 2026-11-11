// W5-28 사전 조사 10 — handoff 경로 형태 전수 (재실행 가능)
import fs from 'node:fs';
const H = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-25-handoff-090.json', 'utf8'));
const shapes = new Set();
for (const it of H.items) {
  const p = it.path.replace(/\[\d+\]/g, '[]');
  shapes.add(p);
}
console.log([...shapes].sort().join('\n'));
