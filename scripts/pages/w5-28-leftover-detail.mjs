// W5-28 — real-leftover 48건 상세 (재실행 가능)
import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-28-scan-090.json', 'utf8'));
const rl = s.hits.filter((h) => h.classification === 'real-leftover');
const byPerson = {};
for (const h of rl) { (byPerson[h.person] ??= []).push(`${h.class}:${h.column}:${h.path} :: ${h.match} :: ${h.excerpt.slice(0, 70)}`); }
for (const [p, xs] of Object.entries(byPerson)) { console.log(`== ${p} (${xs.length}) ==`); for (const x of xs) console.log('  ' + x); }
