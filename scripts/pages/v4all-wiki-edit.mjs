#!/usr/bin/env node
// v4 전면 전환(레인 B) — 위키 문서·인물·가계도의 옛 봉건 칭호 표기를 v4 어휘로 바꾼다.
// 대상 표(파일 코드 → 표):
//   030 data/sql/030-wiki-documents.sql  wiki_document.body_md · body_ko_md (Markdown 문자열)
//   090 data/sql/090-person-details.sql  person_detail.json · json_ko (JSON 문자열, 잎 단위)
//   110 data/sql/110-family-trees.sql    family_tree.json · json_ko (JSON 문자열, 잎 단위)
//   050 data/sql/050-wiki-people.sql     wiki_person 표시 열 title · position · rank (en/ko)
//   120 data/sql/120-map-core.sql        map_landmark.detail · detail_ko (같은 파일의 다른 표 문장은 그대로 둔다)
//   121 data/sql/120-map-core.sql        map_region.summary · summary_ko · opening_state · opening_state_ko
//   115 data/sql/115-retainer-graph.sql  retainer_graph.json · json_ko (JSON 문자열, 잎 단위)
// 규칙(rules[]): { id, file, col?, key?, pathRe?, from, to, re?, expect }
//   col    — 열 이름(문자열 또는 배열). 없으면 그 파일의 편집 열 전체.
//   key    — 행 키(slug·person_id·clan_id). 없으면 모든 행.
//   pathRe — JSON 잎 경로 정규식(배열 첨자는 []로 접는다, 예: ^\.sections\.Life$). JSON 열에만 쓴다.
//   re     — true면 from을 전역 정규식으로, 아니면 정확한 부분 문자열로 찾는다.
//   exact  — true면 값(JSON 잎 또는 열 값) 전체가 from과 같을 때만 바꾼다(직함·품계 같은 표시 값).
//   expect — 이 규칙이 바꾼 횟수. 실제와 다르면 실패한다(재현 가능한 적중 수).
// 규칙은 적힌 순서대로 잎마다 적용한다. 다음은 어떤 규칙도 건드리지 않는다:
//   키·열거값 잎(id, titleId, rank, stateId 등), 보류 인물(hold), 렌더에서만 숨기는 비공개 잎(privateFields).
// 규칙이 닿지 않은 INSERT 문은 한 바이트도 바꾸지 않는다. 문 수·행 수·JSON 파싱·비대상 열을 사후 검증한다.
//
// 사용법: node scripts/pages/v4all-wiki-edit.mjs --rules <rules.json> --report <out.json> [--dry-run]
// 종료 코드: 0 성공 · 2 인자 오류 · 3 roundtrip 불일치 · 4 규칙 적중 수 불일치 · 5 사후 검증 실패
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const EXIT = { OK: 0, USAGE: 2, ROUNDTRIP: 3, RULE: 4, POST: 5 };
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FILES = {
  '030': { file: 'data/sql/030-wiki-documents.sql', table: 'wiki_document', key: 'slug', cols: ['slug', 'title', 'title_ko', 'category_id', 'sort', 'body_md', 'body_ko_md'], edit: ['body_md', 'body_ko_md'], json: false },
  '090': { file: 'data/sql/090-person-details.sql', table: 'person_detail', key: 'person_id', cols: ['person_id', 'clan_id', 'json', 'json_ko'], edit: ['json', 'json_ko'], json: true },
  '110': { file: 'data/sql/110-family-trees.sql', table: 'family_tree', key: 'clan_id', cols: ['clan_id', 'json', 'json_ko'], edit: ['json', 'json_ko'], json: true },
  '050': { file: 'data/sql/050-wiki-people.sql', table: 'wiki_person', key: 'id', cols: ['id', 'sort', 'faction_id', 'name', 'name_ko', 'title', 'title_ko', 'position', 'position_ko', 'rank', 'rank_ko', 'tier', 'occupation', 'occupation_ko', 'gender', 'gender_ko', 'stage', 'stage_ko', 'state_id', 'state_name', 'state_name_ko'], edit: ['title', 'title_ko', 'position', 'position_ko', 'rank', 'rank_ko', 'occupation', 'occupation_ko'], json: false },
  '121': { file: 'data/sql/120-map-core.sql', table: 'map_region', key: 'id', cols: ['id', 'sort', 'name', 'name_ko', 'district', 'district_ko', 'path', 'status', 'polities', 'summary', 'summary_ko', 'opening_state', 'opening_state_ko', 'station_count', 'area_m2', 'density_2126'], edit: ['summary', 'summary_ko', 'opening_state', 'opening_state_ko'], json: false },
  '115': { file: 'data/sql/115-retainer-graph.sql', table: 'retainer_graph', key: 'id', cols: ['id', 'json', 'json_ko'], edit: ['json', 'json_ko'], json: true },
  '120': { file: 'data/sql/120-map-core.sql', table: 'map_landmark', key: 'id', cols: ['id', 'sort', 'name', 'name_ko', 'region_id', 'holder_id', 'role', 'role_ko', 'detail', 'detail_ko', 'x', 'y', 'fortification'], edit: ['detail', 'detail_ko'], json: false },
};
// JSON 안에서 키·열거값으로 쓰는 필드. 최상위 .rank(표시 문자열)만 예외로 편집할 수 있다.
const KEY_FIELDS = new Set(['id', 'titleId', 'parentTitleId', 'politicalParentTitleId', 'holderPersonId', 'directLiegePersonId', 'stateId', 'state', 'holdingId', 'geographicTitleId', 'rank', 'formalTitleRank', 'territorialScale', 'personId', 'clanId', 'characterId', 'relationKind', 'courtId', 'liegePersonId', 'ownerPersonId', 'fromPersonId', 'toPersonId']);
const isKeyPath = (p) => p !== '.rank' && KEY_FIELDS.has(p.split('.').pop().replace(/\[\]$/, ''));
// 옛 칭호 어휘(보고용 집계). 위키 범위 오탐(공작원, 은밀 공작, 영주역·공영주차장, 무작위)은 따로 센다.
const OLD = /봉신|봉토|봉건|봉작|종주|\b(?:[Vv]assal(?:s|age)?|[Ff]ief(?:dom)?s?|[Ll]ieges?|[Ss]uzerains?|[Ff]eudal)\b|공작령|공작위|공작|백작령|백작|남작령|남작|영주|왕국|국왕|군주|왕격|작위|\b(?:Dukes?|Duch(?:y|ies)|Ducal|County|Counties|Barony|Baronies|Barons?|Lords?|Kingdoms?|Kings?|Monarchs?|Monarchy|Sovereigns?|Peerage|Fiefs?)\b|\b(?:dukes?|duch(?:y|ies)|ducal|barony|baronies|lords?|kingdoms?|kings?|monarchs?|monarchy|sovereigns?|peerage|fiefs?)\b/g;
const FALSE_POS = /공작원|은밀 공작|공영주차장|\| 영주 \| Yeongju|무작위|Emma King|\bKing\b(?=', '킹')/g;
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
const loadDb = (text) => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec(fs.readFileSync(path.join(REPO, 'data/sql/000-schema.sql'), 'utf8'));
  db.exec(text);
  return db;
};
const rowsOf = (db, spec) => db.prepare('SELECT ' + spec.cols.join(', ') + ' FROM ' + spec.table + ' ORDER BY rowid').all();
// 원문에서 그 표의 INSERT 문을 순서대로 찾아 행마다 재직렬화 값과 바이트 단위로 대조한다.
// 같은 파일의 다른 표 문장은 위치만 건너뛰고 건드리지 않는다.
function locate(spec, text, rows) {
  const head = 'INSERT INTO ' + spec.table + ' (';
  const starts = [];
  for (let i = text.indexOf(head); i >= 0; i = text.indexOf(head, i + 1)) if (i === 0 || text[i - 1] === '\n') starts.push(i);
  if (starts.length !== rows.length) fail(EXIT.ROUNDTRIP, 'E_ROUNDTRIP: ' + spec.file + ' ' + spec.table + ' 문 ' + starts.length + ' ≠ 행 ' + rows.length);
  return rows.map((r, n) => {
    const s = serialize(spec, r);
    if (text.slice(starts[n], starts[n] + s.length) !== s) fail(EXIT.ROUNDTRIP, 'E_ROUNDTRIP: ' + spec.file + ' ' + r[spec.key]);
    return [starts[n], starts[n] + s.length];
  });
}
function walkLeaves(node, p, fn) {
  if (Array.isArray(node)) node.forEach((v, i) => { if (typeof v === 'string') node[i] = fn(p + '[]', v, `${p}.${i}`); else walkLeaves(v, p + '[]', fn); });
  else if (node && typeof node === 'object') for (const k of Object.keys(node)) { const v = node[k]; if (typeof v === 'string') node[k] = fn(p + '.' + k, v, p + '.' + k); else walkLeaves(v, p + '.' + k, fn); }
}
const countOf = (s, re) => (s.match(new RegExp(re.source, re.flags)) ?? []).length;

const args = parseArgs(process.argv.slice(2));
const R = JSON.parse(fs.readFileSync(path.resolve(REPO, args.rules), 'utf8'));
const hold = new Set(R.hold ?? []);
const rules = R.rules.map((r) => ({ ...r, cols: r.col ? [].concat(r.col) : null, pathRx: r.pathRe ? new RegExp(r.pathRe) : null, rx: r.re ? new RegExp(r.from, 'g') : null }));
if (new Set(rules.map((r) => r.id)).size !== rules.length) fail(EXIT.RULE, 'E_RULE: id 중복');
for (const r of rules) {
  if (!FILES[r.file]) fail(EXIT.RULE, 'E_RULE_FILE: ' + r.id);
  if (r.key && hold.has(r.key)) fail(EXIT.RULE, 'E_RULE_HOLD: 보류 인물 규칙 ' + r.id);
  if (r.from === r.to) fail(EXIT.RULE, 'E_RULE_NOOP: ' + r.id);
  if (r.pathRe && !FILES[r.file].json) fail(EXIT.RULE, 'E_RULE_PATH: 문자열 열에 pathRe ' + r.id);
  if (r.exact && r.re) fail(EXIT.RULE, 'E_RULE_MODE: exact와 re를 함께 쓸 수 없다 ' + r.id);
  if (!Number.isInteger(r.expect)) fail(EXIT.RULE, 'E_RULE_EXPECT: ' + r.id);
}
const hits = new Map(rules.map((r) => [r.id, 0]));
const report = { applied_at: new Date().toISOString(), rules_file: args.rules, rules: rules.length, hold: [...hold], dry_run: !!args.dryRun, files: {}, rule_hits: {} };
const changes = [];
const used = [...new Set(rules.map((r) => r.file))];

function applyRules(file, key, col, p, v) {
  let s = v;
  for (const r of rules) {
    if (r.file !== file || (r.key && r.key !== key) || (r.cols && !r.cols.includes(col)) || (r.pathRx && !r.pathRx.test(p))) continue;
    const n = r.exact ? (s === r.from ? 1 : 0) : r.rx ? countOf(s, r.rx) : s.split(r.from).length - 1;
    if (!n) continue;
    s = r.exact ? r.to : r.rx ? s.replace(r.rx, r.to) : s.split(r.from).join(r.to);
    hits.set(r.id, hits.get(r.id) + n);
    changes.push([file, key, col, p, r.id, n]);
  }
  return s;
}

const outTexts = {};
for (const file of used) {
  const spec = FILES[file];
  const prev = used.find((f) => f !== file && FILES[f].file === spec.file && outTexts[f] !== undefined);
  const text = prev ? outTexts[prev] : fs.readFileSync(path.join(REPO, spec.file), 'utf8');
  const rows = rowsOf(loadDb(text), spec);
  const spans = locate(spec, text, rows);
  const touched = [];
  let out = '', last = 0;
  rows.forEach((row, n) => {
    const key = row[spec.key];
    const e = { ...row };
    if (!hold.has(key)) for (const col of spec.edit) {
      if (!spec.json) { e[col] = applyRules(file, key, col, '', row[col]); continue; }
      if (JSON.stringify(JSON.parse(row[col])) !== row[col]) fail(EXIT.ROUNDTRIP, 'E_JSON_ROUNDTRIP: ' + spec.file + ' ' + key + ' ' + col);
      const j = JSON.parse(row[col]);
      const priv = new Set((Array.isArray(j.privateFields) ? j.privateFields : []).map((x) => '.' + x));
      walkLeaves(j, '', (p, v, exact) => (isKeyPath(p) || priv.has(exact) || [...priv].some((x) => exact.startsWith(x + '.')) ? v : applyRules(file, key, col, p, v)));
      const s = JSON.stringify(j);
      if (s !== row[col]) e[col] = s;
    }
    for (const c of spec.cols) if (!spec.edit.includes(c) && e[c] !== row[c]) fail(EXIT.POST, 'E_POST: 비대상 열 변경 ' + c);
    const s = serialize(spec, e);
    out += text.slice(last, spans[n][0]) + (s === text.slice(spans[n][0], spans[n][1]) ? text.slice(spans[n][0], spans[n][1]) : (touched.push(key), s));
    last = spans[n][1];
  });
  out += text.slice(last);
  outTexts[file] = out;
  // 사후 검증: 독립 적재 → 행수·키 순서·INSERT 문 수·JSON 파싱·보류 행 불변
  const after = rowsOf(loadDb(out), spec);
  if (after.length !== rows.length) fail(EXIT.POST, 'E_POST: 행수 ' + spec.file);
  after.forEach((r, i) => {
    if (r[spec.key] !== rows[i][spec.key]) fail(EXIT.POST, 'E_POST: 키 순서 ' + spec.file);
    if (spec.json) for (const c of spec.edit) JSON.parse(r[c]);
    if (hold.has(r[spec.key]) && serialize(spec, r) !== serialize(spec, rows[i])) fail(EXIT.POST, 'E_POST: 보류 행 변경 ' + r[spec.key]);
  });
  const inserts = (t) => (t.match(/^INSERT INTO /gm) ?? []).length;
  const ownOut = (out.match(new RegExp('^INSERT INTO ' + spec.table + ' \\(', 'gm')) ?? []).length;
  if (ownOut !== rows.length) fail(EXIT.POST, 'E_POST: ' + spec.table + ' 문 수 ' + spec.file);
  if (inserts(out) !== inserts(text)) fail(EXIT.POST, 'E_POST: INSERT 문 수 ' + spec.file);
  report.files[spec.file] = {
    insert_count: inserts(text), table_rows: rows.length, statements_touched: touched.length, touched,
    sha256_before: crypto.createHash('sha256').update(text).digest('hex'), sha256_after: crypto.createHash('sha256').update(out).digest('hex'),
    old_term_hits_before: countOf(text, OLD), old_term_hits_after: countOf(out, OLD),
    false_positive_hits_after: countOf(out, FALSE_POS),
  };
}
const bad = rules.filter((r) => hits.get(r.id) !== r.expect);
report.rule_hits = Object.fromEntries(rules.map((r) => [r.id, { expect: r.expect, actual: hits.get(r.id) }]));
report.total_replacements = [...hits.values()].reduce((a, b) => a + b, 0);
fs.mkdirSync(path.dirname(path.resolve(args.report)), { recursive: true });
fs.writeFileSync(path.resolve(args.report), JSON.stringify(report, null, 1));
fs.writeFileSync(path.resolve(args.report).replace(/\.json$/, '.changes.tsv'), changes.map((c) => c.join('\t')).join('\n') + '\n');
if (bad.length) fail(EXIT.RULE, 'E_RULE_COUNT: ' + bad.length + '개 규칙 적중 불일치\n' + bad.map((r) => r.id + ' ' + JSON.stringify(r.from).slice(0, 80) + ' 적중 ' + hits.get(r.id) + ' ≠ 기대 ' + r.expect).join('\n'));
// 같은 파일을 쓰는 표가 둘이면 마지막 표의 출력이 앞 표의 편집을 이미 담고 있다.
if (!args.dryRun) for (const file of used) if (used.slice(used.indexOf(file) + 1).every((f) => FILES[f].file !== FILES[file].file)) fs.writeFileSync(path.join(REPO, FILES[file].file), outTexts[file]);
console.log(`${args.dryRun ? 'dry-run' : 'applied'}: ${rules.length} rules, ${report.total_replacements} replacements; ` + Object.entries(report.files).map(([f, x]) => `${path.basename(f)} touched ${x.statements_touched}, old terms ${x.old_term_hits_before} -> ${x.old_term_hits_after}`).join('; '));
