// W5-28 — 적용 로그 요약 (재실행 가능)
import fs from 'node:fs';
const l = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-28-handoff-apply-log.json', 'utf8'));
console.log('counts', JSON.stringify(l.counts));
console.log('byRule', JSON.stringify(l.byRule));
console.log('added', l.addedItems.length, '| paren', JSON.stringify(l.paren));
console.log('rowsChanged', l.rowsChanged, '| nestedStateId', JSON.stringify(l.policy.nestedStateId.counts));
console.log('audit entries', l.namedAudit.length);
const c = {};
for (const a of l.namedAudit) c[a.classification] = (c[a.classification] ?? 0) + 1;
console.log('audit by class', JSON.stringify(c, null, 1));
console.log('should-be-fixed entries:', JSON.stringify(l.namedAudit.filter((a) => a.classification === 'should-be-fixed'), null, 0).slice(0, 1500));
