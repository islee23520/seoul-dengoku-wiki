// W5-28 step 5 사전 조사 3 — w4 stateIdMapping·handoff 매핑 샘플·사이트 렌더 필드 (재실행 가능)
import fs from 'node:fs';

const w4 = JSON.parse(fs.readFileSync('docs/w4-rules.json', 'utf8'));
console.log('stateIdMapping:', JSON.stringify(w4.stateIdMapping, null, 0).slice(0, 1200));

const H = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-25-handoff-090.json', 'utf8'));
const items = H.items;
const sid = items.find((x) => x.rule === 'state-id-mapping');
console.log('\nstate-id-mapping sample:', JSON.stringify({ person: sid.person, column: sid.column, path: sid.path, old: sid.old, new: sid.new, reason: sid.reason }, null, 0).slice(0, 500));
const snm = items.find((x) => x.rule === 'state-name-mapping');
console.log('state-name-mapping sample:', JSON.stringify({ person: snm.person, column: snm.column, path: snm.path, old: snm.old, new: snm.new }, null, 0).slice(0, 400));
const b6e = items.filter((x) => x.rule === 'bible6-exception');
console.log('bible6-exception persons:', [...new Set(b6e.map((x) => x.person))].join(','));
console.log('bible6-exception sample:', JSON.stringify(b6e[0], null, 0).slice(0, 400));
const b6s = items.filter((x) => x.rule === 'bible6-stale-role');
console.log('bible6-stale-role:', b6s.map((x) => `${x.person}:${x.column}:${x.path}`).join(' | '));
const sx = items.filter((x) => x.rule === 'sixteen-framing');
console.log('sixteen-framing:', sx.map((x) => `${x.person}:${x.column}:${x.path}:${(x.old ?? '').slice(0, 60)}`).join(' | '));
// pending 후보 인물의 org-name-map 항목 수
const PENDING = ['person-0001','person-0029','person-0116','person-0220','person-0246','person-0272','person-0323','person-0349','person-0399','person-0457','person-1005','person-1008','person-0145','person-0086','person-0088','person-0089','person-0094','person-0095','person-0096','person-0104','person-0105','person-0108'];
for (const pid of PENDING) {
  const n = items.filter((x) => x.person === pid && x.rule === 'org-name-map' && x.action === 'replace').length;
  const other = items.filter((x) => x.person === pid && x.rule !== 'org-name-map' && x.action === 'replace').length;
  console.log(`pending ${pid}: org-name-map replace=${n} other-rule replace=${other}`);
}
