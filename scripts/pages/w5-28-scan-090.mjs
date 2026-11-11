#!/usr/bin/env node
// W5-28 step 5 — 090 4부류 잔여 스캔 (owner-decision 항목 제외 보고).
// 부류: (1) 십육국 계열 표현 (2) 성직 어휘 (3) 산문 속 S0x (4) 옛 조직·국가명.
// 각 히트를 분류한다: pending-person-kept / owner-decision-item / record-schema / real-leftover.
// 사용법: node scripts/pages/w5-28-scan-090.mjs [--sql-dir data/sql] [--json out.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseInsertLine } from './ck3-stats.mjs';
import { PENDING_TITLE_PERSONS } from './handoff-090-apply.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const DETAIL_COLS = ['person_id', 'clan_id', 'json', 'json_ko'];

function splitStatements(text) {
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0);
}
const walkStrings = (obj, fn, p = '') => {
  if (Array.isArray(obj)) { obj.forEach((v, i) => walkStrings(v, fn, `${p}[${i}]`)); return; }
  if (obj && typeof obj === 'object') { for (const [k, v] of Object.entries(obj)) walkStrings(v, fn, p ? `${p}.${k}` : k); return; }
  if (typeof obj === 'string') fn(p, obj);
};

// owner-decision 항목이 겨냥한 경로(그 문장은 소유자 결정 대기로 남는다)
const H = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/drafts/reports/w5-25-handoff-090.json'), 'utf8'));
const odTargets = new Set(H.items.filter((x) => x.action === 'owner-decision').map((x) => `${x.person}|${x.column}|${x.path}`));

const CLASSES = [
  { id: 'sixteen', label: '십육국 계열 표현', re: /(십육국|십육 ?개국|16 ?개국|열여섯 (?:나라|국가|개국)|sixteen[- ]states?|Seoul Sixteen|16 states)/gi },
  { id: 'church', label: '성직 어휘', re: /(당회장|장로(?:회|들)?|목사|주교|대교구|교황|추기경|권사|집사|교회|성당|예배당?|\b(?:archbishops?|archdioces[ea]s?|popes?|priests?|deacons?|bishops?|pastors?|cardinals?|cathedrals?|church(?:es)?|moderators?)\b)/gi },
  { id: 's0x-prose', label: '산문 속 S0x', re: /\bS(?:0[1-9]|1[0-6])\b/g },
  { id: 'old-org', label: '옛 조직·국가명', re: /(수문국|규격맹|태욱그룹|성하그룹|안국총림|흰십자단|동방사|여의도출자연합회|아관사|Floodgate (?:Bureau|State)|Standards League|Taeuk (?:Group|Grupp)|Seongha Group|Anguk Grand Monastery|White Cross Corps|Eastern Command|Yeouido Investment Federation|Agwansa|Religious Alliance|Myeongbu Church|Floodgate House)/g },
];

const rows = splitStatements(fs.readFileSync(path.join(REPO, process.argv.includes('--sql-dir') ? process.argv[process.argv.indexOf('--sql-dir') + 1] : 'data/sql', '090-person-details.sql'), 'utf8'))
  .filter((l) => l.startsWith('INSERT INTO person_detail')).map((l) => parseInsertLine(l, 'person_detail', DETAIL_COLS));

const hits = [];
for (const r of rows) {
  for (const [col, raw] of [['json', r.json], ['json_ko', r.json_ko]]) {
    const doc = JSON.parse(raw);
    walkStrings(doc, (p, v) => {
      // id/기록 필드는 스캔 제외: state/stateId/stateName은 데이터 참조, detailRoute/characterId는 기록
      if (/(^|\.)(state|stateId|stateName|characterId|detailRoute|sourceRoute|sourceStatus)$/.test(p)) return;
      for (const c of CLASSES) {
        c.re.lastIndex = 0;
        const m = [...v.matchAll(c.re)];
        if (!m.length) continue;
        let klass = 'real-leftover';
        if (PENDING_TITLE_PERSONS.includes(r.person_id) && c.id === 'old-org') klass = 'pending-person-kept (Q 대기)';
        else if (odTargets.has(`${r.person_id}|${col}|$.${p}`)) klass = 'owner-decision-item (소유자 결정 대기)';
        else if (c.id === 's0x-prose') klass = 'record-schema (역사 참조)';
        else if (/^(Agwansa|아관사)$/.test(m.map((x) => x[0]).join(',')) || /^(아관사|Agwansa)/.test(v)) klass = 'real-building-name (정본 030 현존 시설명 — 지리 보존)';
        hits.push({ person: r.person_id, column: col, path: `$.${p}`, class: c.id, match: m.map((x) => x[0]).join(','), classification: klass, excerpt: v.slice(0, 100) });
      }
    });
  }
}
const byClass = {}; const byKlass = {};
for (const h of hits) { byClass[h.class] = (byClass[h.class] ?? 0) + 1; byKlass[h.classification] = (byKlass[h.classification] ?? 0) + 1; }
const realLeftover = hits.filter((h) => h.classification === 'real-leftover');
const summary = { total: hits.length, byClass, byClassification: byKlass, realLeftover: realLeftover.length };
console.log(JSON.stringify(summary, null, 1));
const ji = process.argv.indexOf('--json');
if (ji >= 0) { fs.mkdirSync(path.dirname(path.join(REPO, process.argv[ji + 1])), { recursive: true }); fs.writeFileSync(path.join(REPO, process.argv[ji + 1]), JSON.stringify({ summary, hits }, null, 1)); }
process.exit(realLeftover.length ? 1 : 0);
