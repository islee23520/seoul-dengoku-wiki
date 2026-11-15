#!/usr/bin/env node
// v4 후속 todo 18 — 비공개로 분류된 인물 서사가 공개 원천에 남은 자리를 공개용 문장으로 바꾼다.
// 규칙표에는 바꿀 원문이 들어 있으므로 저장소에 두지 않는다(.omo/private/ 아래에만 둔다).
// 규칙 종류:
//   sql  : data/sql/090-person-details.sql 의 person_detail 한 행(key)·한 열(col: json|json_ko) 안
//          JSON 경로(path)의 문자열 값이 from 과 정확히 같을 때 to 로 바꾼다.
//   text : 파일(file) 안의 정확한 부분 문자열 from 을 to 로 바꾼다(긴 규칙부터 적용).
// 규칙마다 기대 적중 수(expect)가 있고 실제와 다르면 실패한다. 규칙이 닿지 않는 INSERT 문은 한 바이트도 바꾸지 않는다.
//
// 사용법: node scripts/pages/private-narrative-redact.mjs --rules <rules.json> --report <out.json> [--dry-run]
// 종료 코드: 0 성공 · 2 인자 오류 · 3 roundtrip 불일치 · 4 규칙 적중 수 불일치 · 5 사후 검증 실패
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const EXIT = { OK: 0, USAGE: 2, ROUNDTRIP: 3, RULE: 4, POST: 5 };
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SPEC = { file: 'data/sql/090-person-details.sql', table: 'person_detail', key: 'person_id', cols: ['person_id', 'clan_id', 'json', 'json_ko'] };
const fail = (code, msg) => { console.error(msg); process.exit(code); };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i], v = argv[i + 1];
    if (['--rules', '--report'].includes(t)) { if (!v || v.startsWith('--')) fail(EXIT.USAGE, 'E_ARG: ' + t + ' 값이 없다'); a[t.slice(2)] = v; i++; }
    else if (t === '--dry-run') a.dryRun = true;
    else fail(EXIT.USAGE, 'E_ARG: 알 수 없는 인자: ' + t);
  }
  if (!(a.rules && a.report)) fail(EXIT.USAGE, '사용법: --rules <rules.json> --report <out.json> [--dry-run]');
  return a;
}

const q = (v) => (v === null ? 'NULL' : typeof v === 'number' || typeof v === 'bigint' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'");
const serialize = (row) => 'INSERT INTO ' + SPEC.table + ' (' + SPEC.cols.join(', ') + ') VALUES (' + SPEC.cols.map((c) => q(row[c])).join(', ') + ');';
function split(text) {
  const lines = text.split('\n');
  const end = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
  const first = lines.findIndex((l) => l.startsWith('INSERT INTO'));
  const body = lines.slice(first, end);
  if (body.some((l) => !l.startsWith('INSERT INTO'))) fail(EXIT.ROUNDTRIP, 'E_SPLIT: INSERT 문이 한 줄 단위가 아니다');
  return { header: lines.slice(0, first), stmts: body, trailingNewline: end !== lines.length };
}
function rowsOf(text) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec(fs.readFileSync(path.join(REPO, 'data/sql/000-schema.sql'), 'utf8'));
  db.exec(text);
  return db.prepare('SELECT ' + SPEC.cols.join(', ') + ' FROM ' + SPEC.table + ' ORDER BY rowid').all();
}
const count = (t, s) => t.split(s).length - 1;

const args = parseArgs(process.argv.slice(2));
const table = JSON.parse(fs.readFileSync(path.resolve(args.rules), 'utf8'));
const rules = table.rules;
const samples = table.samples ?? [];
if (new Set(rules.map((r) => r.id)).size !== rules.length) fail(EXIT.RULE, 'E_RULE: id 중복');
const sampleHits = (t) => samples.reduce((n, s) => n + count(t, s), 0);
const report = { applied_at: new Date().toISOString(), rules_file: path.basename(args.rules), dry_run: !!args.dryRun, rule_hits: {}, files: {} };
const out = {};

// sql 규칙
const sqlRules = rules.filter((r) => r.kind === 'sql');
if (sqlRules.some((r) => r.file !== SPEC.file || !['json', 'json_ko'].includes(r.col))) fail(EXIT.RULE, 'E_RULE: sql 규칙 대상은 090 json/json_ko 뿐이다');
if (sqlRules.length) {
  const text = fs.readFileSync(path.join(REPO, SPEC.file), 'utf8');
  const { header, stmts, trailingNewline } = split(text);
  const rows = rowsOf(text);
  if (stmts.length !== rows.length) fail(EXIT.ROUNDTRIP, 'E_ROWS: INSERT ' + stmts.length + ' ≠ 적재 행 ' + rows.length);
  rows.forEach((r, n) => { if (serialize(r) !== stmts[n]) fail(EXIT.ROUNDTRIP, 'E_ROUNDTRIP: ' + r.person_id); });
  const newStmts = stmts.slice();
  const touched = [];
  rows.forEach((r, n) => {
    const mine = sqlRules.filter((x) => x.key === r.person_id);
    if (!mine.length) return;
    const e = { ...r };
    for (const col of ['json', 'json_ko']) {
      const cr = mine.filter((x) => x.col === col);
      if (!cr.length) continue;
      if (JSON.stringify(JSON.parse(e[col])) !== e[col]) fail(EXIT.ROUNDTRIP, 'E_JSON_ROUNDTRIP: ' + r.person_id + ' ' + col);
      const j = JSON.parse(e[col]);
      for (const x of cr) {
        let o = j; for (const k of x.path.slice(0, -1)) o = o?.[k];
        const leaf = x.path[x.path.length - 1];
        const hit = o && o[leaf] === x.from ? 1 : 0;
        report.rule_hits[x.id] = hit;
        if (hit) o[leaf] = x.to;
      }
      e[col] = JSON.stringify(j);
    }
    const s = serialize(e);
    if (s !== stmts[n]) { newStmts[n] = s; touched.push(r.person_id); }
  });
  out[SPEC.file] = [...header, ...newStmts].join('\n') + (trailingNewline ? '\n' : '');
  // 사후 검증: 독립 재적재, 행수·키 순서, 바뀐 문장 수
  const after = rowsOf(out[SPEC.file]);
  if (after.length !== rows.length) fail(EXIT.POST, 'E_POST: 행수');
  after.forEach((a, n) => { if (a.person_id !== rows[n].person_id || a.clan_id !== rows[n].clan_id) fail(EXIT.POST, 'E_POST: 키 ' + a.person_id); });
  const b = split(out[SPEC.file]).stmts;
  if (b.length !== stmts.length) fail(EXIT.POST, 'E_POST: 문장 수');
  const diff = stmts.filter((s, i) => s !== b[i]).length;
  if (diff !== touched.length) fail(EXIT.POST, 'E_POST: 바뀐 문장 수 불일치');
  report.files[SPEC.file] = { insert_count_before: stmts.length, insert_count_after: b.length, statements_touched: touched.length, touched, sha256_before: sha(text), sha256_after: sha(out[SPEC.file]), sample_hits_before: sampleHits(text), sample_hits_after: sampleHits(out[SPEC.file]) };
}

// text 규칙
const textRules = rules.filter((r) => r.kind === 'text');
for (const file of [...new Set(textRules.map((r) => r.file))]) {
  const text = fs.readFileSync(path.join(REPO, file), 'utf8');
  let t = text;
  for (const x of textRules.filter((r) => r.file === file).sort((a, b) => b.from.length - a.from.length)) {
    report.rule_hits[x.id] = count(t, x.from);
    t = t.split(x.from).join(x.to);
  }
  if (file.endsWith('.json')) { try { JSON.parse(t); } catch (e) { fail(EXIT.POST, 'E_POST: JSON 깨짐 ' + file + ' ' + e.message); } }
  out[file] = t;
  report.files[file] = { sha256_before: sha(text), sha256_after: sha(t), sample_hits_before: sampleHits(text), sample_hits_after: sampleHits(t) };
}

for (const x of rules) if (report.rule_hits[x.id] !== x.expect) fail(EXIT.RULE, 'E_RULE_COUNT: ' + x.id + ' ' + x.file + ' 적중 ' + report.rule_hits[x.id] + ' ≠ 기대 ' + x.expect);
for (const [f, r] of Object.entries(report.files)) if (r.sample_hits_after !== 0) fail(EXIT.POST, 'E_POST: 표본 잔존 ' + f + ' ' + r.sample_hits_after);

if (!args.dryRun) {
  for (const [f, t] of Object.entries(out)) fs.writeFileSync(path.join(REPO, f), t, 'utf8');
  fs.mkdirSync(path.dirname(path.resolve(args.report)), { recursive: true });
  fs.writeFileSync(path.resolve(args.report), JSON.stringify(report, null, 1) + '\n', 'utf8');
}
for (const [f, r] of Object.entries(report.files)) console.log(f + ': 표본 ' + r.sample_hits_before + ' → ' + r.sample_hits_after + (r.statements_touched !== undefined ? ' · INSERT ' + r.insert_count_before + ' → ' + r.insert_count_after + ' · 바뀐 문장 ' + r.statements_touched : ''));
console.log('규칙 ' + rules.length + '개 기대 적중 수 일치' + (args.dryRun ? ' (dry-run)' : ''));
