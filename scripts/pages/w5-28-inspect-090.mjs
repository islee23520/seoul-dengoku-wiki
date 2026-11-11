// W5-28 step 5 사전 조사 2 — 090 구조·stateId 중첩·S0x 산문 괄호 (재실행 가능)
import fs from 'node:fs';
import { parseInsertLine } from './ck3-stats.mjs';

function splitStatements(text) {
  if (!text.startsWith('--')) throw new Error('E_HEADER');
  const nl = text.indexOf('\n'); const nl2 = text.indexOf('\n', nl + 1);
  return { headerLines: [text.slice(0, nl), text.slice(nl + 1, nl2)], lines: text.slice(nl2 + 1).split('\n').filter((l) => l.length > 0) };
}

const text = fs.readFileSync('data/sql/090-person-details.sql', 'utf8');
const { headerLines, lines } = splitStatements(text);
const DETAIL_COLS = ['person_id', 'clan_id', 'json', 'json_ko'];
const rows = lines.filter((l) => l.startsWith('INSERT INTO person_detail')).map((l) => parseInsertLine(l, 'person_detail', DETAIL_COLS));
console.log('rows:', rows.length, '| header2:', headerLines[1].slice(0, 80));

// 상세 원본 511행(파생 아님)의 json 구조 키 조사
const orig = rows.filter((r) => { const j = JSON.parse(r.json); return j.sourceStatus !== 'ck3-table-derived'; });
console.log('non-derived rows:', orig.length);
const keysets = {};
for (const r of orig) { const j = JSON.parse(r.json); keysets[Object.keys(j).join(',')] = (keysets[Object.keys(j).join(',')] ?? 0) + 1; }
console.log('top-level keysets:', JSON.stringify(keysets, null, 0).slice(0, 400));

// 중첩 stateId 값 조사 (표시/논리 참조 vs 역사 id)
const stateIdFields = {};
for (const r of orig) {
  const j = JSON.parse(r.json);
  const walk = (obj, p) => {
    if (Array.isArray(obj)) { obj.forEach((v, i) => walk(v, `${p}[${i}]`)); return; }
    if (obj && typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        if (k === 'stateId' || /StateId$/.test(k)) {
          const norm = p.replace(/\[\d+\]/g, '[]') + '.' + k;
          stateIdFields[norm] = stateIdFields[norm] ?? { count: 0, values: new Set() };
          stateIdFields[norm].count++; stateIdFields[norm].values.add(String(v));
        }
        walk(v, p ? `${p}.${k}` : k);
      }
    }
  };
  walk(j, '');
}
for (const [k, v] of Object.entries(stateIdFields)) console.log('stateId field:', k, 'count=', v.count, 'values=', [...v.values].slice(0, 20).join(','));

// (S0x) 괄호 산문 — 열 전체 문자열 기준
let parenFields = 0, parenHits = 0;
const parenRe = /\((S(?:0[1-9]|1[0-6]))\)/g;
for (const r of orig) {
  for (const col of ['json', 'json_ko']) {
    const hits = [...r[col].matchAll(parenRe)];
    if (hits.length) { parenFields++; parenHits += hits.length; }
  }
}
console.log('(S0x) paren: fields=', parenFields, 'hits=', parenHits);

// $.state 값 분포 (원본 행)
const sv = {};
for (const r of orig) { const j = JSON.parse(r.json); const k = String(j.state); sv[k] = (sv[k] ?? 0) + 1; }
console.log('$.state values:', JSON.stringify(sv).slice(0, 400));
// 파생 행 511개의 state 값도 확인
const derived = rows.filter((r) => { const j = JSON.parse(r.json); return j.sourceStatus === 'ck3-table-derived'; });
const dv = {};
for (const r of derived) { const j = JSON.parse(r.json); const k = String(j.state); dv[k] = (dv[k] ?? 0) + 1; }
console.log('derived $.state values:', JSON.stringify(dv).slice(0, 400));

// w4-rules 매핑 키
const w4 = JSON.parse(fs.readFileSync('docs/w4-rules.json', 'utf8'));
console.log('w4-rules top keys:', Object.keys(w4).join(','));
for (const k of Object.keys(w4)) {
  const v = w4[k];
  if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).some((x) => /^S\d+$/.test(x))) {
    console.log('w4 mapping candidate:', k, JSON.stringify(v).slice(0, 300));
  }
}
