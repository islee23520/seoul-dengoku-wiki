#!/usr/bin/env node
// W5-28 step 3 검증 — 통합 브랜치에서 결정적으로 재구축한 030이 검증된 w5-24 체인의 030과
// 행 단위로 일치하는지 대조한다(독립 검증자가 base에서 재실행할 수 있게 스크립트로만 판정).
//
// 판정 규칙(브리프 step 3):
//   (1) 초안이 있는 모든 slug(반입 목록 기준): 내 행 == w5-24 행 (7열 전부 바이트 비교)
//   (2) 그 외 모든 slug: 내 행 == 725 base 행
//   (3) 파일 머리말: base가 예전 머리말(export-sql 안내)이면 재구축 후 정본 안내 + 빈 줄로 바뀐다(예외 처리).
//
// 사용법:
//   node scripts/pages/w5-28-verify-030.mjs --theirs <path-to-w5-24-030> [--base <path-to-725-030>] [--mine <path>]
//     --theirs 필수, --base 기본은 origin/feat/pages-w0-landing에서 내보낸 파일, --mine 기본은 저장소 data/sql.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { loadDatabase, DOC_FILE } from './rewrite-doc.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');

function parseArgs(argv) {
  const a = { mine: path.join(REPO, 'data/sql') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--mine') a.mine = path.resolve(argv[++i]);
    else if (argv[i] === '--theirs') a.theirs = path.resolve(argv[++i]);
    else if (argv[i] === '--base') a.base = path.resolve(argv[++i]);
    else { console.error(`E_ARG: ${argv[i]}`); process.exit(1); }
  }
  if (!a.theirs || !a.base) {
    console.error('사용법: node scripts/pages/w5-28-verify-030.mjs --theirs <w5-24 sql-dir> --base <725 sql-dir> [--mine <sql-dir>]');
    process.exit(1);
  }
  return a;
}

// sql-dir에서 030(과 의존 스키마·카테고리)을 메모리 DB에 적재해 slug→행(7열) 맵을 만든다.
function rowsOf(sqlDir) {
  let db;
  try { db = loadDatabase(sqlDir); } catch (e) { console.error(`E_LOAD ${sqlDir}: ${e.message}`); process.exit(2); }
  const rows = new Map(db.prepare('SELECT slug, title, title_ko, category_id, sort, body_md, body_ko_md FROM wiki_document').all().map((r) => [r.slug, r]));
  db.close();
  return rows;
}

const COLS = ['slug', 'title', 'title_ko', 'category_id', 'sort', 'body_md', 'body_ko_md'];

const args = parseArgs(process.argv.slice(2));
const mine = rowsOf(args.mine);
const theirs = rowsOf(args.theirs);
const base = rowsOf(args.base);

const slugs = [...new Set([...mine.keys(), ...theirs.keys(), ...base.keys()])].sort();
if (mine.size !== theirs.size || mine.size !== base.size) {
  console.error(`E_ROW_COUNT: mine ${mine.size} / theirs ${theirs.size} / base ${base.size}`);
  process.exit(3);
}

// 초안 목록 = docs/drafts의 <slug>.ko.md (repo 기준)
const draftsDir = path.join(REPO, 'docs/drafts');
const draftSlugs = fs.existsSync(draftsDir)
  ? new Set(fs.readdirSync(draftsDir).map((n) => /^(.+)\.ko\.md$/.exec(n)?.[1]).filter(Boolean))
  : new Set();

let patchedMatch = 0, otherMatch = 0, fail = 0;
const diffs = [];
for (const s of slugs) {
  const m = mine.get(s), t = theirs.get(s), b = base.get(s);
  const diffCols = (x, y) => COLS.filter((c) => String(x[c]) !== String(y[c]));
  if (draftSlugs.has(s)) {
    const d = diffCols(m, t);
    if (d.length === 0) patchedMatch++;
    else { fail++; diffs.push(`PATCHED-DIFF ${s}: cols ${d.join(',')} (mine vs w5-24)`); }
  } else {
    const d = diffCols(m, b);
    if (d.length === 0) otherMatch++;
    else { fail++; diffs.push(`OTHER-DIFF ${s}: cols ${d.join(',')} (mine vs 725-base)`); }
  }
}
for (const d of diffs.slice(0, 40)) console.error(d);
console.log(`030 행 대조: patched 일치 ${patchedMatch}/${draftSlugs.size}, 그 외 일치 ${otherMatch}/${slugs.length - draftSlugs.size}, 불일치 ${fail}`);
console.log(`(총 ${slugs.length}행; 초안 ${draftSlugs.size}종)`);

// 머리말 검사: theirs는 정본 안내 머리말, base가 예전 머리말이면 mine도 정본 안내여야 한다.
const head = (p) => fs.readFileSync(path.join(p, DOC_FILE), 'utf8').split('\n').slice(0, 2);
const mh = head(args.mine), th = head(args.theirs), bh = head(args.base);
const NEWL2 = '-- Source of truth: edit via scripts/pages/rewrite-doc.mjs (data/sql is canonical; the archived export-sql.mjs is not a sync path).';
let headerOk = true;
if (mh[1] !== NEWL2) { headerOk = false; console.error(`E_HEADER: mine 머리말 둘째 줄이 정본 안내가 아니다: ${mh[1]}`); }
if (th[1] !== NEWL2) { headerOk = false; console.error(`E_HEADER: theirs 머리말 둘째 줄이 예상과 다르다: ${th[1]}`); }
console.log(`머리말: mine[1]=정본안내=${mh[1] === NEWL2}, theirs[1]=정본안내=${th[1] === NEWL2}, base[1]=${JSON.stringify(bh[1].slice(0, 40))}…`);

process.exit(fail === 0 && headerOk ? 0 : 4);
