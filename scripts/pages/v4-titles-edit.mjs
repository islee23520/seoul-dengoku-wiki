#!/usr/bin/env node
// v4 직함 변환 — 인물·직함 표시 문자열을 v4 세력 사다리와 구(District) 기준 표기로 바꾼다.
// 대상: data/sql/050-wiki-people.sql (wiki_person 표시 열 title·position·rank, en/ko),
//       data/sql/090-person-details.sql (person_detail.json · json_ko 안 표시 문자열),
//       data/sql/123-map-holdings.sql (map_holding.data · data_ko 의 designation).
// 키(id, titleId, holding:…, title:duchy-…)와 등급 열거값(rank·formalTitleRank·territorialScale의 duchy/barony/kingdom)은 바꾸지 않는다.
// 보류 인물(rules.hold, 예: 남윤경 person-0374)의 행은 어떤 규칙도 건드리지 않는다.
// 규칙 종류:
//   exact — 표시 문자열 전체의 정확 일치 치환. roster는 (person, col), details는 (col, path[, person]) 범위에서만 찾는다.
//   sub   — 한 인물의 서술 필드(pathRe)에 들어 있는 부분 문자열 치환(옛 직함 반복 서술). exact를 모두 적용한 뒤 규칙 순서대로 적용한다.
// 각 규칙은 기대 적중 수(expect)가 있으며 실제와 다르면 실패한다. 규칙이 닿지 않는 INSERT 문은 한 바이트도 바꾸지 않는다.
//
// 사용법: node scripts/pages/v4-titles-edit.mjs --rules scripts/pages/v4-titles-rules.json --report <out.json> [--dry-run]
// 종료 코드: 0 성공 · 2 인자 오류 · 3 roundtrip 불일치 · 4 규칙 적중 수 불일치 · 5 사후 검증 실패
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const EXIT = { OK: 0, USAGE: 2, ROUNDTRIP: 3, RULE: 4, POST: 5 };
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FILES = {
  '050': { file: 'data/sql/050-wiki-people.sql', table: 'wiki_person', key: 'id', cols: ['id', 'sort', 'faction_id', 'name', 'name_ko', 'title', 'title_ko', 'position', 'position_ko', 'rank', 'rank_ko', 'tier', 'occupation', 'occupation_ko', 'gender', 'gender_ko', 'stage', 'stage_ko', 'state_id', 'state_name', 'state_name_ko'], edit: ['title', 'title_ko', 'position', 'position_ko', 'rank', 'rank_ko'] },
  '090': { file: 'data/sql/090-person-details.sql', table: 'person_detail', key: 'person_id', cols: ['person_id', 'clan_id', 'json', 'json_ko'], edit: ['json', 'json_ko'] },
  '123': { file: 'data/sql/123-map-holdings.sql', table: 'map_holding', key: 'id', cols: ['id', 'sort', 'name', 'name_ko', 'holder_person_id', 'state_id', 'data', 'data_ko'], edit: ['data', 'data_ko'] },
};
// JSON 안에서 키·등급 값으로 쓰는 필드. 규칙 path가 이 이름으로 끝나면 규칙표 자체가 잘못된 것이다.
// 단, 최상위 `.rank`(인물 품계 표시 문자열)는 표시 필드다. 중첩된 rank(openingTitles·politicalIdentities)만 등급 열거값이다.
const KEY_FIELDS = new Set(['id', 'titleId', 'parentTitleId', 'politicalParentTitleId', 'holderPersonId', 'directLiegePersonId', 'stateId', 'holdingId', 'geographicTitleId', 'rank', 'formalTitleRank', 'territorialScale']);
const isKeyPath = (p) => p !== '.rank' && KEY_FIELDS.has(p.split('.').pop().replace('[]', ''));
const OLD = /공작|공작령|백작|남작|영주|왕국|Duchy|Ducal|County|Barony|Lord|Kingdom/g;
const fail = (code, msg) => { console.error(msg); process.exit(code); };

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
const serialize = (spec, row) => 'INSERT INTO ' + spec.table + ' (' + spec.cols.join(', ') + ') VALUES (' + spec.cols.map((c) => q(row[c])).join(', ') + ');';
function split(text) {
  const lines = text.split('\n');
  const end = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
  const first = lines.findIndex((l) => l.startsWith('INSERT INTO'));
  const body = lines.slice(first, end);
  if (body.some((l) => !l.startsWith('INSERT INTO'))) fail(EXIT.ROUNDTRIP, 'E_SPLIT: INSERT 문이 한 줄 단위가 아니다');
  return { header: lines.slice(0, first), stmts: body, trailingNewline: end !== lines.length };
}
function load(texts) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec(fs.readFileSync(path.join(REPO, 'data/sql/000-schema.sql'), 'utf8'));
  for (const t of texts) db.exec(t);
  return db;
}
// JSON 잎(문자열)을 순회한다. 경로는 배열 첨자를 []로 접은 형태(.openingTitles[].name).
function walkLeaves(node, p, fn) {
  if (Array.isArray(node)) node.forEach((v, i) => { if (typeof v === 'string') { const n = fn(p + '[]', v); if (n !== v) node[i] = n; } else walkLeaves(v, p + '[]', fn); });
  else if (node && typeof node === 'object') for (const k of Object.keys(node)) { const v = node[k]; if (typeof v === 'string') { const n = fn(p + '.' + k, v); if (n !== v) node[k] = n; } else walkLeaves(v, p + '.' + k, fn); }
}
const oldCount = (s) => (s.match(OLD) ?? []).length;

const args = parseArgs(process.argv.slice(2));
const R = JSON.parse(fs.readFileSync(path.resolve(REPO, args.rules), 'utf8'));
const hold = new Set(R.hold ?? []);
const rules = R.rules;
if (new Set(rules.map((r) => r.id)).size !== rules.length) fail(EXIT.RULE, 'E_RULE: id 중복');
for (const r of rules) {
  if (r.type === 'exact' && r.path && isKeyPath(r.path)) fail(EXIT.RULE, 'E_RULE_KEY: 키·등급 필드를 겨냥한 규칙 ' + r.id);
  if (r.person && hold.has(r.person)) fail(EXIT.RULE, 'E_RULE_HOLD: 보류 인물 규칙 ' + r.id);
  if (r.from === r.to) fail(EXIT.RULE, 'E_RULE_NOOP: ' + r.id);
}
const exactIdx = new Map(); // key -> rule
const ek = (file, person, col, p, from) => [file, person ?? '*', col, p ?? '', from].join('\u0001');
for (const r of rules.filter((x) => x.type === 'exact')) {
  const k = ek(r.file, r.person, r.col, r.path, r.from);
  if (exactIdx.has(k)) fail(EXIT.RULE, 'E_RULE_DUP: ' + r.id + ' ' + exactIdx.get(k).id);
  exactIdx.set(k, r);
}
const subRules = rules.filter((x) => x.type === 'sub').map((r) => ({ ...r, re: new RegExp(r.pathRe) }));
const hits = new Map(rules.map((r) => [r.id, 0]));
const findExact = (file, person, col, p, v) => exactIdx.get(ek(file, person, col, p, v)) ?? exactIdx.get(ek(file, null, col, p, v));

const texts = Object.fromEntries(Object.entries(FILES).map(([k, s]) => [k, fs.readFileSync(path.join(REPO, s.file), 'utf8')]));
const db = load(Object.values(texts));
const rowsOf = (d, k) => d.prepare('SELECT ' + FILES[k].cols.join(', ') + ' FROM ' + FILES[k].table + ' ORDER BY rowid').all();
const rows = Object.fromEntries(Object.keys(FILES).map((k) => [k, rowsOf(db, k)]));
const report = { applied_at: new Date().toISOString(), rules_file: args.rules, rules: rules.length, hold: [...hold], dry_run: !!args.dryRun, files: {} };
const outTexts = {};
const changes = [];

function editRow(k, row) {
  const e = { ...row };
  const pid = k === '123' ? null : row[FILES[k].key];
  if (pid && hold.has(pid)) return e;
  if (k === '050') {
    for (const c of FILES[k].edit) { const r = findExact('050', pid, c, null, e[c]); if (r && r.person === pid) { hits.set(r.id, hits.get(r.id) + 1); changes.push([k, pid, c, '', e[c], r.to]); e[c] = r.to; } }
    return e;
  }
  for (const c of FILES[k].edit) {
    const j = JSON.parse(e[c]);
    walkLeaves(j, '', (p, v) => { const r = findExact(k, pid, c, p, v); if (!r) return v; hits.set(r.id, hits.get(r.id) + 1); changes.push([k, pid ?? row.id, c, p, v, r.to]); return r.to; });
    for (const r of subRules) if (r.file === k && r.person === pid && r.col === c) walkLeaves(j, '', (p, v) => {
      if (!r.re.test(p) || !v.includes(r.from)) return v;
      const n = v.split(r.from).length - 1; hits.set(r.id, hits.get(r.id) + n); changes.push([k, pid, c, p, r.from + ' ×' + n, r.to]); return v.split(r.from).join(r.to);
    });
    const s = JSON.stringify(j);
    if (s !== e[c]) e[c] = s;
  }
  return e;
}

for (const [k, spec] of Object.entries(FILES)) {
  const { header, stmts, trailingNewline } = split(texts[k]);
  const own = stmts.map((s, i) => [s, i]).filter(([s]) => s.startsWith('INSERT INTO ' + spec.table + ' ('));
  if (own.length !== rows[k].length) fail(EXIT.ROUNDTRIP, 'E_ROWS: ' + spec.file + ' INSERT ' + own.length + ' ≠ 적재 행 ' + rows[k].length);
  rows[k].forEach((r, n) => {
    if (serialize(spec, r) !== own[n][0]) fail(EXIT.ROUNDTRIP, 'E_ROUNDTRIP: ' + spec.file + ' ' + r[spec.key]);
    for (const c of spec.edit) if (k !== '050' && JSON.stringify(JSON.parse(r[c])) !== r[c]) fail(EXIT.ROUNDTRIP, 'E_JSON_ROUNDTRIP: ' + spec.file + ' ' + r[spec.key] + ' ' + c);
  });
  const newStmts = stmts.slice();
  const touched = [];
  rows[k].forEach((r, n) => {
    const e = editRow(k, r);
    for (const c of spec.cols) if (!spec.edit.includes(c) && e[c] !== r[c]) fail(EXIT.POST, 'E_POST: 비대상 열 변경 ' + c);
    const s = serialize(spec, e);
    if (s !== own[n][0]) { newStmts[own[n][1]] = s; touched.push(r[spec.key]); }
  });
  outTexts[k] = [...header, ...newStmts].join('\n') + (trailingNewline ? '\n' : '');
  report.files[spec.file] = {
    insert_count: stmts.length, table_rows: rows[k].length, statements_touched: touched.length, touched,
    sha256_before: crypto.createHash('sha256').update(texts[k]).digest('hex'), sha256_after: crypto.createHash('sha256').update(outTexts[k]).digest('hex'),
    old_term_hits_before: oldCount(texts[k]), old_term_hits_after: oldCount(outTexts[k]),
  };
}
const bad = rules.filter((r) => hits.get(r.id) !== r.expect);
if (bad.length) fail(EXIT.RULE, 'E_RULE_COUNT: ' + bad.length + '개 규칙 적중 불일치\n' + bad.slice(0, 20).map((r) => r.id + ' ' + JSON.stringify(r.from).slice(0, 80) + ' 적중 ' + hits.get(r.id) + ' ≠ 기대 ' + r.expect).join('\n'));

// 사후 검증: 독립 적재 → 행수·키 순서·문장 수·보류 행 불변·JSON 파싱·키 필드 불변
const db2 = load(Object.values(outTexts));
for (const [k, spec] of Object.entries(FILES)) {
  const after = rowsOf(db2, k);
  if (after.length !== rows[k].length) fail(EXIT.POST, 'E_POST: 행수 ' + spec.file);
  after.forEach((a, n) => {
    const b = rows[k][n];
    if (a[spec.key] !== b[spec.key]) fail(EXIT.POST, 'E_POST: 키 순서 ' + spec.file);
    if (k !== '123' && hold.has(a[spec.key]) && serialize(spec, a) !== serialize(spec, b)) fail(EXIT.POST, 'E_POST_HOLD: 보류 행 변경 ' + a[spec.key]);
    if (k !== '050') for (const c of spec.edit) {
      const keysOf = (o) => { const out = []; (function w(x, p) { if (Array.isArray(x)) x.forEach((v, i) => w(v, p + '[' + i + ']')); else if (x && typeof x === 'object') for (const kk of Object.keys(x)) { if (isKeyPath(p + '.' + kk) && typeof x[kk] !== 'object') out.push(p + '.' + kk + '=' + x[kk]); w(x[kk], p + '.' + kk); } })(o, ''); return out.join('\n'); };
      if (keysOf(JSON.parse(a[c])) !== keysOf(JSON.parse(b[c]))) fail(EXIT.POST, 'E_POST_KEYS: 키·등급 값 변경 ' + a[spec.key] + ' ' + c);
    }
  });
  const sa = split(texts[k]).stmts, sb = split(outTexts[k]).stmts;
  if (sa.length !== sb.length) fail(EXIT.POST, 'E_POST: 문장 수');
  if (sa.filter((s, i) => s !== sb[i]).length !== report.files[spec.file].statements_touched) fail(EXIT.POST, 'E_POST: 바뀐 문장 수 불일치 ' + spec.file);
}
report.rule_hits = Object.fromEntries(hits);
report.changes = changes.length;
if (!args.dryRun) {
  for (const [k, spec] of Object.entries(FILES)) fs.writeFileSync(path.join(REPO, spec.file), outTexts[k], 'utf8');
  const out = path.resolve(REPO, args.report);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 1) + '\n', 'utf8');
  fs.writeFileSync(out.replace(/\.json$/, '.changes.tsv'), ['file\tkey\tcol\tpath\tfrom\tto', ...changes.map((c) => c.map((x) => String(x).replace(/[\t\n]/g, ' ')).join('\t'))].join('\n') + '\n', 'utf8');
}
for (const [f, r] of Object.entries(report.files)) console.log(f + ': INSERT ' + r.insert_count + ' · 바뀐 문장 ' + r.statements_touched + ' · 옛 표기 ' + r.old_term_hits_before + ' → ' + r.old_term_hits_after);
console.log('규칙 ' + rules.length + '개 기대 적중 수 일치 · 변경 ' + changes.length + '건' + (args.dryRun ? ' (dry-run)' : ''));
