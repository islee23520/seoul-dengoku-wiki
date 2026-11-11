#!/usr/bin/env node
// W5-28 step 8d — 통합 브랜치 data/sql vs origin/main 독립 대조(node:sqlite).
// 표별 행 수, 파일별 변경 행 수·변경 열을 JSON으로 남긴다(docs/drafts/reports/w5-28-sql-diff.json).
// 사용법: node scripts/pages/w5-28-compare-sql.mjs [--base-ref origin/main] [--json <path>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');

function loadSqlDir(files) {
  const db = new DatabaseSync(':memory:');
  for (const [name, text] of files) { try { db.exec(text); } catch (e) { throw new Error(`E_SQL ${name}: ${e.message}`); } }
  return db;
}
function snapshot(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name);
  const out = {};
  for (const t of tables) {
    const cols = db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
    const rows = db.prepare(`SELECT * FROM ${t}`).all();
    const pk = db.prepare(`PRAGMA table_info(${t})`).all().filter((c) => c.pk).map((c) => c.name);
    out[t] = { cols, pk: pk.length ? pk : ['rowid'], rows };
  }
  return out;
}

const baseRef = process.argv.includes('--base-ref') ? process.argv[process.argv.indexOf('--base-ref') + 1] : 'origin/main';
const baseFiles = execFileSync('git', ['-C', REPO, 'ls-tree', '-r', '--name-only', baseRef, 'data/sql/'], { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.sql'))
  .map((f) => [path.basename(f), execFileSync('git', ['-C', REPO, 'show', `${baseRef}:${f}`], { encoding: 'utf8', maxBuffer: 1 << 26 })]);
const headFiles = fs.readdirSync(path.join(REPO, 'data/sql')).filter((f) => f.endsWith('.sql')).sort()
  .map((f) => [f, fs.readFileSync(path.join(REPO, 'data/sql', f), 'utf8')]);

const baseNameSet = new Set(baseFiles.map(([n]) => n));
const headNameSet = new Set(headFiles.map(([n]) => n));
const fileDelta = {
  added: [...headNameSet].filter((n) => !baseNameSet.has(n)),
  removed: [...baseNameSet].filter((n) => !headNameSet.has(n)),
};

const A = snapshot(loadSqlDir(baseFiles));
const B = snapshot(loadSqlDir(headFiles));
const rowCounts = {};
const tableDiff = {};
for (const t of new Set([...Object.keys(A), ...Object.keys(B)])) {
  const a = A[t], b = B[t];
  rowCounts[t] = { base: a ? a.rows.length : 0, head: b ? b.rows.length : 0 };
  if (!a || !b) { tableDiff[t] = { missing: a ? 'base-only' : 'head-only' }; continue; }
  const key = (r) => a.pk.map((c) => String(r[c])).join('|');
  const aBy = new Map(a.rows.map((r) => [key(r), r]));
  const bBy = new Map(b.rows.map((r) => [key(r), r]));
  const changed = []; const added = []; const removed = [];
  const commonCols = a.cols.filter((c) => b.cols.includes(c));
  for (const [k, r] of bBy) {
    const o = aBy.get(k);
    if (!o) { added.push(k); continue; }
    const diffCols = commonCols.filter((c) => String(o[c]) !== String(r[c]));
    if (diffCols.length) changed.push({ key: k, cols: diffCols });
  }
  for (const k of aBy.keys()) if (!bBy.has(k)) removed.push(k);
  if (changed.length || added.length || removed.length || a.cols.join(',') !== b.cols.join(',')) {
    tableDiff[t] = { changedRows: changed.length, addedRows: added.length, removedRows: removed.length, colDelta: a.cols.join(',') === b.cols.join(',') ? null : { base: a.cols, head: b.cols }, changedColumnsHistogram: Object.entries(changed.reduce((m, c) => { for (const x of c.cols) m[x] = (m[x] ?? 0) + 1; return m; }, {})).sort((x, y) => y[1] - x[1]).slice(0, 12), changedSample: changed.slice(0, 5) };
  }
}
const report = { baseRef, fileDelta, rowCounts, tableDiff };
const ji = process.argv.indexOf('--json');
const out = ji >= 0 ? path.join(REPO, process.argv[ji + 1]) : path.join(REPO, 'docs/drafts/reports/w5-28-sql-diff.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ fileDelta, rowCounts: Object.fromEntries(Object.entries(rowCounts).map(([t, c]) => [t, `${c.base}->${c.head}${c.base === c.head ? '' : ' Δ'}`])) }, null, 1));
