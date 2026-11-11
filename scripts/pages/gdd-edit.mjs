#!/usr/bin/env node
// W5 row 26 — GDD 문서(080-gdd-documents.sql) 옛 정본 어휘 결정적 패치.
// docs/gdd-rules.json 의 규칙을 그대로 적용한다: 규칙의 원문 문자열이 문서에 정확히
// 1번 있어야 하고(0회·2회 이상이면 실패), 규칙이 닿지 않는 문장·문서는 한 바이트도
// 바꾸지 않는다. 적용 전에 129개 INSERT 문 전수 재직렬화 roundtrip 검사를 통과해야
// 한다(원본과 바이트 일치). 결과와 함께 적용 로그를 쓴다.
//
// 사용법: node scripts/pages/gdd-edit.mjs --sql-dir <repo-root> \
//           --rules docs/gdd-rules.json \
//           --report docs/drafts/reports/w5-26-apply-log.json [--dry-run]
// 종료 코드: 0 성공 · 2 인자 오류 · 3 roundtrip 불일치 · 4 규칙 미매칭 · 5 사후 검증 실패
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const EXIT = { OK: 0, USAGE: 2, ROUNDTRIP: 3, RULE: 4, POST: 5 };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');

function usage() {
  console.error('사용법: node scripts/pages/gdd-edit.mjs --sql-dir <repo-root> --rules docs/gdd-rules.json --report <out.json> [--dry-run]');
}
function parseArgs(argv) {
  const a = {};
  const val = (i, name) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) { console.error(`E_ARG: ${name} 값이 없다`); usage(); process.exit(EXIT.USAGE); }
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--sql-dir') { a.sqlDir = val(i, '--sql-dir'); i++; }
    else if (t === '--rules') { a.rules = val(i, '--rules'); i++; }
    else if (t === '--report') { a.report = val(i, '--report'); i++; }
    else if (t === '--dry-run') a.dryRun = true;
    else { console.error(`E_ARG: 알 수 없는 인자: ${t}`); usage(); process.exit(EXIT.USAGE); }
  }
  if (!a.sqlDir || !a.rules || !a.report) { usage(); process.exit(EXIT.USAGE); }
  return a;
}

const COLS = ['id', 'category_id', 'slug', 'title', 'title_ko', 'summary', 'summary_ko', 'status', 'sort', 'source_path', 'body_md', 'body_ko_md'];
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
function serializeStmt(row) {
  const v = COLS.map((c) => (c === 'sort' ? String(row[c]) : q(row[c])));
  return `INSERT INTO gdd_document (${COLS.join(', ')}) VALUES (${v.join(', ')});`;
}

// ---- 파일을 문장 슬라이스로 분해 -------------------------------------------
function splitStatements(text) {
  const lines = text.split('\n');
  const starts = [];
  lines.forEach((l, i) => { if (l.startsWith('INSERT INTO')) starts.push(i); });
  if (!starts.length) { console.error('E_SPLIT: INSERT 문이 없다'); process.exit(EXIT.ROUNDTRIP); }
  const header = lines.slice(0, starts[0]).join('\n');
  const end = lines.length && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
  const stmts = starts.map((st, i) => lines.slice(st, i + 1 < starts.length ? starts[i + 1] : end).join('\n'));
  return { header, stmts };
}
function loadRows(sqlDir) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec(fs.readFileSync(path.join(sqlDir, 'data/sql/000-schema.sql'), 'utf8'));
  db.exec(fs.readFileSync(path.join(sqlDir, 'data/sql/070-gdd-categories.sql'), 'utf8'));
  db.exec(fs.readFileSync(path.join(sqlDir, 'data/sql/080-gdd-documents.sql'), 'utf8'));
  db.exec('PRAGMA foreign_keys=ON');
  const rows = db.prepare(`SELECT ${COLS.join(', ')} FROM gdd_document ORDER BY rowid`).all();
  db.close();
  return rows;
}

// ---- 패턴 ------------------------------------------------------------------
// 변형 패턴: canon-terms sixteen-states-*가 조사 결합형·복수형을 놓치는 같은 클래스 표현.
// 16국은 뒤쪽 경계 없이(조사 의/이/을/은/과/에 등 결합 포함), 영어는 nation 복수형까지 잡는다.
const VARIANT_PATTERNS = [
  ['sixteen-states-ko~variant-16guk-any', '(?<![0-9A-Za-z가-힣])16국', ''],
  ['sixteen-states-ko~variant-16gaeguk', '16개국', ''],
  ['sixteen-states-ko~variant-16nara', '16 나라|나라 열여섯|16국가|국가 열여섯', ''],
  ['sixteen-states-en~variant-16countries', '\\b16 countries\\b', 'i'],
  ['sixteen-states-en~variant-16state', '\\b16[- ]states?\\b', 'i'],
  ['sixteen-states-en~variant-16nation', '\\b16[- ]nations?\\b', 'i'],
  ['sixteen-states-en~variant-sixteennations', '\\bsixteen nations?\\b', 'i'],
  ['sixteen-states-en~variant-sixteencountries', '\\bsixteen countries\\b', 'i'],
];
function loadPatterns(sqlDir) {
  const terms = JSON.parse(fs.readFileSync(path.join(sqlDir, 'docs/canon-terms.json'), 'utf8'));
  const inScope = ['church-ko', 'church-en', 'sixteen-states-ko', 'sixteen-states-en', 'slaughter-order-ko', 'slaughter-order-en', 'state-id-polity'];
  const pats = {};
  for (const t of terms.forbidden) {
    if (!inScope.includes(t.id)) continue;
    pats[t.id] = new RegExp(t.pattern, t.flags.includes('g') ? t.flags : t.flags + 'g');
  }
  for (const [id, p, flags] of VARIANT_PATTERNS) pats[id] = new RegExp(p, flags.includes('g') ? flags : flags + 'g');
  return pats;
}
function scanBodies(rows, pats) {
  const counts = {};
  const hits = [];
  for (const row of rows) {
    for (const [field, lang] of [['body_md', 'en'], ['body_ko_md', 'ko']]) {
      const body = row[field] ?? '';
      for (const [pid, re] of Object.entries(pats)) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(body))) {
          counts[pid] = (counts[pid] || 0) + 1;
          const qs = Math.max(0, m.index - 60);
          hits.push({ document: row.id, field, pattern: pid, match: m[0], quote: body.slice(qs, Math.min(body.length, qs + 100)) });
        }
      }
    }
  }
  return { counts, hits };
}

// ---- 본체 -------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2));
const sqlPath = path.join(args.sqlDir, 'data/sql/080-gdd-documents.sql');
const original = fs.readFileSync(sqlPath, 'utf8');
const rulesDoc = JSON.parse(fs.readFileSync(path.resolve(REPO, args.rules), 'utf8'));
const rules = rulesDoc.rules;
const pats = loadPatterns(args.sqlDir);

// 1) 문장 슬라이스 + 행 로드
const { header, stmts } = splitStatements(original);
const rows = loadRows(args.sqlDir);
if (rows.length !== 129) { console.error(`E_ROWS: gdd_document 행이 129이 아니다: ${rows.length}`); process.exit(EXIT.POST); }
if (stmts.length !== 129) { console.error(`E_SPLIT: INSERT 문이 129이 아니다: ${stmts.length}`); process.exit(EXIT.ROUNDTRIP); }
const stmtId = (s) => {
  const m = s.match(/^INSERT INTO gdd_document \([^)]*\) VALUES \('([^']+)',/);
  if (!m) { console.error('E_SPLIT: INSERT 첫 줄에서 id를 못 읽었다'); process.exit(EXIT.ROUNDTRIP); }
  return m[1];
};
const stmtIndexById = new Map(stmts.map((s, i) => [stmtId(s), i]));
const rowById = new Map(rows.map((r) => [r.id, r]));

// 2) roundtrip: 편집 전 전수 재직렬화가 원본과 바이트 일치해야 한다
if (header + '\n' + stmts.join('\n') + '\n' !== original) {
  console.error('E_ROUNDTRIP: 파일 전체(머리말·문장 결합·끝 개행) 재조립이 원본과 일치하지 않는다');
  process.exit(EXIT.ROUNDTRIP);
}
let rtBad = 0;
for (const r of rows) {
  const gen = serializeStmt(r);
  const orig = stmts[stmtIndexById.get(r.id)];
  if (gen !== orig) {
    rtBad++;
    if (rtBad <= 3) {
      console.error(`E_ROUNDTRIP: ${r.id} 재직렬화 불일치`);
      for (let k = 0; k < Math.max(gen.length, orig.length); k++) {
        if (gen[k] !== orig[k]) { console.error(`  첫 차이 @${k}: gen=${JSON.stringify(gen.slice(k, k + 60))} orig=${JSON.stringify(orig.slice(k, k + 60))}`); break; }
      }
    }
  }
}
if (rtBad) { console.error(`E_ROUNDTRIP: 불일치 문장 ${rtBad}건 — 결정적 재직렬화 불가, 중단한다`); process.exit(EXIT.ROUNDTRIP); }
console.log(`roundtrip ok: ${rows.length}/129 문장 재직렬화 바이트 일치`);

// 3) 규칙 적용
const before = new Map(rows.map((r) => [r.id, { body_md: r.body_md, body_ko_md: r.body_ko_md }]));
const applied = [];
const touched = new Set();
for (const rule of rules) {
  if (!rule.id || !Array.isArray(rule.documents) || !rule.field || typeof rule.from !== 'string') {
    console.error(`E_RULE: 규칙 형식 오류: ${JSON.stringify(rule).slice(0, 80)}`); process.exit(EXIT.RULE);
  }
  if (!['body_md', 'body_ko_md'].includes(rule.field)) { console.error(`E_RULE: ${rule.id} field 오류: ${rule.field}`); process.exit(EXIT.RULE); }
  const uses = [];
  for (const docId of rule.documents) {
    const row = rowById.get(docId);
    if (!row) { console.error(`E_RULE_MISSING: ${rule.id} 문서 없음: ${docId}`); process.exit(EXIT.RULE); }
    let n = 0, i = -1;
    while ((i = row[rule.field].indexOf(rule.from, i + 1)) >= 0) n++;
    if (n === 0) { console.error(`E_RULE_MISSING: ${rule.id} 원문 문자열이 ${docId}.${rule.field} 에 없다: ${JSON.stringify(rule.from.slice(0, 80))}`); process.exit(EXIT.RULE); }
    if (n > 1) { console.error(`E_RULE_AMBIGUOUS: ${rule.id} 원문 문자열이 ${docId}.${rule.field} 에 ${n}번 있다`); process.exit(EXIT.RULE); }
    if (rule.to === 'delete') {
      const lines = row[rule.field].split('\n');
      const li = lines.indexOf(rule.from);
      if (li < 0) { console.error(`E_RULE_DELETE: ${rule.id} delete 규칙의 원문이 ${docId}.${rule.field} 의 한 줄 전체가 아니다`); process.exit(EXIT.RULE); }
      lines.splice(li, 1);
      row[rule.field] = lines.join('\n');
    } else {
      row[rule.field] = row[rule.field].replace(rule.from, rule.to);
    }
    uses.push(docId);
    touched.add(docId);
  }
  applied.push({ id: rule.id, documents: uses, replacement: rule.to === 'delete' ? 'delete' : 'reword' });
}

// 4) 미참여 문서 불변 확인 + 문서별 통계
const perDoc = [];
for (const r of rows) {
  const b = before.get(r.id);
  const changed = r.body_md !== b.body_md || r.body_ko_md !== b.body_ko_md;
  if (changed && !touched.has(r.id)) { console.error(`E_POST: 규칙에 없는 문서가 바뀌었다: ${r.id}`); process.exit(EXIT.POST); }
  if (touched.has(r.id) && !changed) { console.error(`E_POST: 규칙에 있지만 본문이 바뀌지 않았다: ${r.id}`); process.exit(EXIT.POST); }
  perDoc.push({
    document: r.id, touched: touched.has(r.id),
    chars_before: (b.body_md?.length ?? 0) + (b.body_ko_md?.length ?? 0),
    chars_after: (r.body_md?.length ?? 0) + (r.body_ko_md?.length ?? 0),
    disk_bytes_before: Buffer.byteLength((b.body_md ?? '') + (b.body_ko_md ?? ''), 'utf8'),
    disk_bytes_after: Buffer.byteLength((r.body_md ?? '') + (r.body_ko_md ?? ''), 'utf8'),
  });
}

// 5) 새 파일 조립 + 사후 검증(독립 적재)
const newStmts = rows.map((r) => serializeStmt(r));
const newText = header + '\n' + newStmts.join('\n') + '\n';
if (!args.dryRun) {
  const tmp = sqlPath + '.w5-26.tmp';
  fs.writeFileSync(tmp, newText, 'utf8');
  const db2 = new DatabaseSync(':memory:');
  db2.exec('PRAGMA foreign_keys=OFF');
  db2.exec(fs.readFileSync(path.join(args.sqlDir, 'data/sql/000-schema.sql'), 'utf8'));
  db2.exec(fs.readFileSync(path.join(args.sqlDir, 'data/sql/070-gdd-categories.sql'), 'utf8'));
  db2.exec(fs.readFileSync(tmp, 'utf8'));
  db2.exec('PRAGMA foreign_keys=ON');
  const afterRows = db2.prepare(`SELECT ${COLS.join(', ')} FROM gdd_document ORDER BY rowid`).all();
  db2.close();
  if (afterRows.length !== 129) { console.error(`E_POST: 적용 후 행수 ${afterRows.length}`); process.exit(EXIT.POST); }
  for (const a of afterRows) {
    const o = rowById.get(a.id);
    if (!o) { console.error(`E_POST: 새 행 id 없음: ${a.id}`); process.exit(EXIT.POST); }
    for (const c of COLS) {
      if (c === 'body_md' || c === 'body_ko_md') continue;
      if (a[c] !== o[c]) { console.error(`E_POST: ${a.id}.${c} 열이 바뀌었다`); process.exit(EXIT.POST); }
    }
    if (!touched.has(a.id) && (a.body_md !== o.body_md || a.body_ko_md !== o.body_ko_md)) {
      console.error(`E_POST: ${a.id} 본문이 바뀌었다`); process.exit(EXIT.POST); }
  }
  fs.renameSync(tmp, sqlPath);
  console.log('사후 검증 ok: 129행 · 본문 외 열 불변 · 미참여 문서 본문 불변');
}

// 6) 패턴 스캔 before/after + 잔존 목록
const scanBefore = scanBodies(rows.map((r) => ({ ...r, body_md: before.get(r.id).body_md, body_ko_md: before.get(r.id).body_ko_md })), pats);
const scanAfter = scanBodies(rows, pats);
const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const report = {
  applied_at: new Date().toISOString(),
  sql_dir: args.sqlDir, rules_file: args.rules, dry_run: !!args.dryRun,
  row_count: rows.length,
  rules_total: rules.length,
  rules_applied_detail: applied,
  documents_touched: [...touched].sort(),
  file_sha256_before: sha256(original),
  file_sha256_after: sha256(newText),
  file_chars_before: original.length,
  file_chars_after: newText.length,
  file_disk_bytes_before: Buffer.byteLength(original, 'utf8'),
  file_disk_bytes_after: Buffer.byteLength(newText, 'utf8'),
  roundtrip_precheck: 'ok (129/129 INSERT 재직렬화 바이트 일치)',
  per_document: perDoc,
  pattern_scan: {
    before: scanBefore.counts,
    after: scanAfter.counts,
    residual_hits: scanAfter.hits,
  },
};
if (!args.dryRun) {
  fs.mkdirSync(path.dirname(path.resolve(REPO, args.report)), { recursive: true });
  fs.writeFileSync(path.resolve(REPO, args.report), JSON.stringify(report, null, 1) + '\n', 'utf8');
}
console.log(`규칙 ${applied.length}/${rules.length} 적용 · 문서 ${touched.size}건 · 패턴 적중 before=${Object.values(scanBefore.counts).reduce((a, b) => a + b, 0)} after=${Object.values(scanAfter.counts).reduce((a, b) => a + b, 0)}`);
for (const [pid, n] of Object.entries(scanBefore.counts)) console.log(`  ${pid}: ${n} -> ${scanAfter.counts[pid] ?? 0}`);
if (args.dryRun) console.log('(dry-run: 파일·로그 미기록)');
