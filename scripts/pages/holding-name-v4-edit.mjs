#!/usr/bin/env node
// v4 후속 todo 2 D1 — 지도 '개인 영지' 표시 이름의 옛 공작령(Duchy/Ducal) 표기를 구(District)로 바꾼다.
// 대상: data/sql/123-map-holdings.sql 의 map_holding.name · name_ko · data.name.ko · data_ko.name.ko,
//       data/sql/090-person-details.sql 의 person_detail.json · json_ko 안 confirmedHoldings[*].name.
// id·참조 키(title:duchy-…, holding:opening-duchy-…)·인물 칭호·subordinateHoldings는 건드리지 않는다.
// 규칙은 표시 이름 전체 문자열의 정확 일치 치환이며, 규칙마다 파일별 기대 적중 수(expect)가 있다.
// 실제 적중 수가 기대와 다르면 실패한다. 규칙이 닿지 않는 INSERT 문은 한 바이트도 바꾸지 않는다.
//
// 사용법:
//   node scripts/pages/holding-name-v4-edit.mjs --emit-rules docs/holding-name-v4-rules.json   # 현 데이터에서 규칙표 생성
//   node scripts/pages/holding-name-v4-edit.mjs --rules docs/holding-name-v4-rules.json --report <out.json> [--dry-run]
// 종료 코드: 0 성공 · 2 인자 오류 · 3 roundtrip 불일치 · 4 규칙 적중 수 불일치 · 5 사후 검증 실패
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const EXIT = { OK: 0, USAGE: 2, ROUNDTRIP: 3, RULE: 4, POST: 5 };
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OLD = /공작령|Duchy|Ducal/;
const FILES = {
  '123': { file: 'data/sql/123-map-holdings.sql', table: 'map_holding', key: 'id', cols: ['id', 'sort', 'name', 'name_ko', 'holder_person_id', 'state_id', 'data', 'data_ko'] },
  '090': { file: 'data/sql/090-person-details.sql', table: 'person_detail', key: 'person_id', cols: ['person_id', 'clan_id', 'json', 'json_ko'] },
};
const fail = (code, msg) => { console.error(msg); process.exit(code); };

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i], v = argv[i + 1];
    if (['--rules', '--report', '--emit-rules'].includes(t)) { if (!v || v.startsWith('--')) fail(EXIT.USAGE, 'E_ARG: ' + t + ' 값이 없다'); a[t.slice(2)] = v; i++; }
    else if (t === '--dry-run') a.dryRun = true;
    else fail(EXIT.USAGE, 'E_ARG: 알 수 없는 인자: ' + t);
  }
  if (!a['emit-rules'] && !(a.rules && a.report)) fail(EXIT.USAGE, '사용법: --emit-rules <out.json> | --rules <rules.json> --report <out.json> [--dry-run]');
  return a;
}

const q = (v) => (v === null ? 'NULL' : typeof v === 'number' || typeof v === 'bigint' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'");
const serialize = (spec, row) => 'INSERT INTO ' + spec.table + ' (' + spec.cols.join(', ') + ') VALUES (' + spec.cols.map((c) => q(row[c])).join(', ') + ');';

function split(text) {
  const lines = text.split('\n');
  const end = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
  const first = lines.findIndex((l) => l.startsWith('INSERT INTO'));
  const body = lines.slice(first, end);
  if (body.some((l) => !l.startsWith('INSERT INTO'))) fail(EXIT.ROUNDTRIP, 'E_SPLIT: INSERT 문이 한 줄 단위가 아니다');
  return { header: lines.slice(0, first), stmts: body, trailingNewline: end !== lines.length };
}
function load(files) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec(fs.readFileSync(path.join(REPO, 'data/sql/000-schema.sql'), 'utf8'));
  for (const t of files) db.exec(t);
  return db;
}
const nameOf = (h) => (h.name && typeof h.name === 'object' ? h.name.ko : h.name);
function setName(h, from, to) {
  if (h.name && typeof h.name === 'object') { if (h.name.ko === from) { h.name.ko = to; return 1; } }
  else if (h.name === from) { h.name = to; return 1; }
  return 0;
}
// 행 하나에서 표시 이름 필드를 순회한다. visit(value) → 바꾼 값(또는 그대로)
function editRow(fk, row, fn) {
  if (fk === '123') {
    for (const c of ['name', 'name_ko']) row[c] = fn(row[c]);
    for (const c of ['data', 'data_ko']) {
      const j = JSON.parse(row[c]);
      const n = nameOf(j); const m = fn(n);
      if (m !== n) { setName(j, n, m); row[c] = JSON.stringify(j); }
    }
  } else {
    for (const c of ['json', 'json_ko']) {
      const j = JSON.parse(row[c]); let changed = false;
      for (const h of j.confirmedHoldings ?? []) { const n = nameOf(h); const m = fn(n); if (m !== n) { setName(h, n, m); changed = true; } }
      if (changed) row[c] = JSON.stringify(j);
    }
  }
}
// v4 표시 규칙: '… 공작령 직영지' → '… 직영지', 영어 Duchy/Ducal → District(이미 'District'가 붙은 'X District Duchy …'는 Duchy만 뺀다)
function v4Name(s) {
  if (s.includes('공작령')) return s.replace(/ 공작령 직영지$/, ' 직영지');
  if (/ District (Sluice Bureau )?Duchy /.test(s)) return s.replace(/ Duchy /, ' ');
  return s.replace(/\b(Duchy|Ducal)\b/, 'District');
}

const args = parseArgs(process.argv.slice(2));
const texts = Object.fromEntries(Object.entries(FILES).map(([k, s]) => [k, fs.readFileSync(path.join(REPO, s.file), 'utf8')]));
const db = load(Object.values(texts));
const rowsOf = (k) => db.prepare('SELECT ' + FILES[k].cols.join(', ') + ' FROM ' + FILES[k].table + ' ORDER BY rowid').all();
const rows = { '123': rowsOf('123'), '090': rowsOf('090') };

if (args['emit-rules']) {
  const counts = new Map();
  for (const k of Object.keys(FILES)) for (const r of rows[k]) editRow(k, { ...r }, (v) => {
    if (typeof v === 'string' && OLD.test(v)) { const e = counts.get(v) ?? { '123': 0, '090': 0 }; e[k]++; counts.set(v, e); }
    return v;
  });
  const rules = [...counts].map(([from, expect], i) => ({ id: 'hn-' + String(i + 1).padStart(3, '0'), from, to: v4Name(from), expect }));
  const bad = rules.filter((r) => OLD.test(r.to) || r.to === r.from);
  if (bad.length) fail(EXIT.RULE, 'E_RULE: v4 규칙이 옛 표기를 지우지 못했다: ' + JSON.stringify(bad));
  const out = path.resolve(REPO, args['emit-rules']);
  fs.writeFileSync(out, JSON.stringify({ purpose: 'v4 todo 2 D1: 개인 영지 표시 이름 공작령/Duchy/Ducal → 구/District', rules }, null, 1) + '\n', 'utf8');
  console.log('규칙 ' + rules.length + '개 → ' + args['emit-rules']);
  process.exit(EXIT.OK);
}

const rules = JSON.parse(fs.readFileSync(path.resolve(REPO, args.rules), 'utf8')).rules;
const byFrom = new Map(rules.map((r) => [r.from, r]));
if (byFrom.size !== rules.length) fail(EXIT.RULE, 'E_RULE: from 중복');
const hits = new Map(rules.map((r) => [r.id, { '123': 0, '090': 0 }]));
const report = { applied_at: new Date().toISOString(), rules_file: args.rules, dry_run: !!args.dryRun, files: {} };
const outTexts = {};

for (const [k, spec] of Object.entries(FILES)) {
  const { header, stmts, trailingNewline } = split(texts[k]);
  const own = stmts.map((s, i) => [s, i]).filter(([s]) => s.startsWith('INSERT INTO ' + spec.table + ' ('));
  if (own.length !== rows[k].length) fail(EXIT.ROUNDTRIP, 'E_ROWS: ' + spec.file + ' INSERT ' + own.length + ' ≠ 적재 행 ' + rows[k].length);
  // roundtrip: 대상 표의 모든 INSERT 문이 재직렬화와 바이트 일치해야 한다
  rows[k].forEach((r, n) => { if (serialize(spec, r) !== own[n][0]) fail(EXIT.ROUNDTRIP, 'E_ROUNDTRIP: ' + spec.file + ' ' + r[spec.key]); });
  const newStmts = stmts.slice();
  const touched = [];
  rows[k].forEach((r, n) => {
    const e = { ...r };
    editRow(k, e, (v) => { const rule = typeof v === 'string' ? byFrom.get(v) : undefined; if (!rule) return v; hits.get(rule.id)[k]++; return rule.to; });
    for (const c of spec.cols) if (!['name', 'name_ko', 'data', 'data_ko', 'json', 'json_ko'].includes(c) && e[c] !== r[c]) fail(EXIT.POST, 'E_POST: 키 열 변경 ' + c);
    const s = serialize(spec, e);
    if (s !== own[n][0]) { newStmts[own[n][1]] = s; touched.push(r[spec.key]); }
  });
  outTexts[k] = [...header, ...newStmts].join('\n') + (trailingNewline ? '\n' : '');
  const oldHits = (t) => (t.match(/공작령|Duchy|Ducal/g) ?? []).length;
  report.files[spec.file] = {
    insert_count: stmts.length, table_rows: rows[k].length, statements_touched: touched.length, touched,
    sha256_before: crypto.createHash('sha256').update(texts[k]).digest('hex'), sha256_after: crypto.createHash('sha256').update(outTexts[k]).digest('hex'),
    old_term_hits_before: oldHits(texts[k]), old_term_hits_after: oldHits(outTexts[k]),
  };
}
for (const r of rules) for (const k of Object.keys(FILES)) if (hits.get(r.id)[k] !== r.expect[k]) fail(EXIT.RULE, 'E_RULE_COUNT: ' + r.id + ' ' + JSON.stringify(r.from) + ' ' + FILES[k].file + ' 적중 ' + hits.get(r.id)[k] + ' ≠ 기대 ' + r.expect[k]);

// 사후 검증: 새 텍스트를 독립 적재해 행수·키·비대상 문장 불변·남은 표시 이름 옛 표기 0을 본다
const db2 = load(Object.values(outTexts));
for (const [k, spec] of Object.entries(FILES)) {
  const after = db2.prepare('SELECT ' + spec.cols.join(', ') + ' FROM ' + spec.table + ' ORDER BY rowid').all();
  if (after.length !== rows[k].length) fail(EXIT.POST, 'E_POST: 행수 ' + spec.file);
  after.forEach((a, n) => { if (a[spec.key] !== rows[k][n][spec.key]) fail(EXIT.POST, 'E_POST: 키 순서 ' + spec.file); editRow(k, { ...a }, (v) => { if (typeof v === 'string' && OLD.test(v)) fail(EXIT.POST, 'E_POST: 남은 옛 표시 이름 ' + v); return v; }); });
  const a = split(texts[k]).stmts, b = split(outTexts[k]).stmts;
  if (a.length !== b.length) fail(EXIT.POST, 'E_POST: 문장 수');
  const diff = a.filter((s, i) => s !== b[i]).length;
  if (diff !== report.files[spec.file].statements_touched) fail(EXIT.POST, 'E_POST: 바뀐 문장 수 불일치 ' + spec.file);
}
report.rule_hits = Object.fromEntries(hits);
if (!args.dryRun) {
  for (const [k, spec] of Object.entries(FILES)) fs.writeFileSync(path.join(REPO, spec.file), outTexts[k], 'utf8');
  fs.mkdirSync(path.dirname(path.resolve(REPO, args.report)), { recursive: true });
  fs.writeFileSync(path.resolve(REPO, args.report), JSON.stringify(report, null, 1) + '\n', 'utf8');
}
for (const [f, r] of Object.entries(report.files)) console.log(f + ': INSERT ' + r.insert_count + ' · 바뀐 문장 ' + r.statements_touched + ' · 옛 표기 ' + r.old_term_hits_before + ' → ' + r.old_term_hits_after);
console.log('규칙 ' + rules.length + '개 기대 적중 수 일치' + (args.dryRun ? ' (dry-run)' : ''));
