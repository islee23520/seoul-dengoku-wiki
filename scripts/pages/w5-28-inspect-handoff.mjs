// W5-28 step 5 사전 조사 — handoff JSON 구조·규칙 집계·샘플 (재실행 가능)
import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync('docs/drafts/reports/w5-25-handoff-090.json', 'utf8'));
console.log('type:', Array.isArray(j) ? 'array' : 'object', Array.isArray(j) ? j.length : Object.keys(j).join(','));
const items = Array.isArray(j) ? j : (j.items ?? []);
if (!Array.isArray(j)) console.log('top-level sample:', JSON.stringify(j, null, 1).slice(0, 600));
const rules = {}, actions = {};
for (const it of items) { rules[it.rule] = (rules[it.rule] ?? 0) + 1; actions[it.action] = (actions[it.action] ?? 0) + 1; }
console.log('rules:', JSON.stringify(rules));
console.log('actions:', JSON.stringify(actions));
console.log('sample replace item:', JSON.stringify(items.find((x) => x.action === 'replace'), null, 1));
console.log('sample owner-decision item:', JSON.stringify(items.find((x) => x.action === 'owner-decision'), null, 1).slice(0, 500));
// 경로 형태 조사: $.state 외 필드 경로 집계
const paths = {};
for (const it of items) { const p = it.path ?? ''; const key = p.replace(/\[\d+\]/g, '[]').split('.').slice(0, 3).join('.'); paths[key] = (paths[key] ?? 0) + 1; }
const top = Object.entries(paths).sort((a, b) => b[1] - a[1]).slice(0, 30);
console.log('path prefixes:', top.map(([k, v]) => `${k}=${v}`).join(' | '));
// stateId 중첩 경로 (B.2 대상)
const nested = items.filter((x) => /stateId/i.test(x.path ?? '') || /\[\d+\]\.stateId/.test(x.path ?? ''));
console.log('items with stateId in path:', nested.length);
