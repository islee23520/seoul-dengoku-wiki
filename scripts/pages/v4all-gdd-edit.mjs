#!/usr/bin/env node
// v4 convert-everything Lane A: rewrites old feudal titles in data/sql/080-gdd-documents.sql
// into v4 vocabulary (docs/CANON-BIBLE.md 2.6), driven by a rule table with exact hit counts.
//
//   node scripts/pages/v4all-gdd-edit.mjs --rules scripts/pages/v4all-gdd-rules-b1.json --report <out.json> [--dry-run]
//
// Rule shape: { id, docs: [docId...], fields: [column...], kind: "literal"|"ko-noun", from, to, expect, reason }
//   literal  replaces every exact occurrence of `from` with `to`.
//   ko-noun  treats `from` as a RegExp source for a Korean noun and replaces it with `to`, fixing the
//            following particle when the final consonant changes (가/이, 는/은, 를/을, 와/과, 로/으로 ...).
//   expect   is the exact total hit count over docs x fields; any other count aborts (exit 4).
// Rules apply in file order. Untouched INSERT statements stay byte-identical; the INSERT count must stay 129.
// Exit codes: 0 ok, 2 usage, 3 roundtrip mismatch, 4 rule count mismatch, 5 post-check failure.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SQL = path.join(REPO, 'data/sql/080-gdd-documents.sql');
const COLS = ['id', 'category_id', 'slug', 'title', 'title_ko', 'summary', 'summary_ko', 'status', 'sort', 'source_path', 'body_md', 'body_ko_md'];
const TEXT_FIELDS = new Set(['title', 'title_ko', 'summary', 'summary_ko', 'body_md', 'body_ko_md']);

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const t = process.argv[i];
  if (t === '--dry-run') args.dryRun = true;
  else if (t === '--rules' || t === '--report') args[t.slice(2)] = process.argv[++i];
  else { console.error(`E_ARG: ${t}`); process.exit(2); }
}
if (!args.rules || !args.report) { console.error('usage: --rules <file> --report <out.json> [--dry-run]'); process.exit(2); }

// ---- Korean particle fix ---------------------------------------------------
const hasBatchim = (ch) => { const c = ch.charCodeAt(0) - 0xac00; return c >= 0 && c < 11172 && c % 28 !== 0; };
const rieulBatchim = (ch) => { const c = ch.charCodeAt(0) - 0xac00; return c >= 0 && c < 11172 && c % 28 === 8; };
const PAIRS = [['가', '이'], ['는', '은'], ['를', '을'], ['와', '과'], ['로', '으로'], ['라는', '이라는'], ['라고', '이라고'], ['라', '이라'], ['랑', '이랑'], ['나', '이나'], ['며', '이며'], ['여', '이여'], ['야', '이야'], ['다', '이다']];
const HANGUL = /[\uac00-\ud7a3]/;
export function fixParticle(word, rest) {
  const last = word[word.length - 1];
  const cons = hasBatchim(last);
  for (const [v, c] of PAIRS) {
    for (const [from, toV, toC] of [[v, v, c], [c, v, c]]) {
      if (!rest.startsWith(from)) continue;
      const after = rest[from.length] ?? '';
      if ((from === '다' || from === '이다' || from === '라' || from === '이라') && HANGUL.test(after)) continue;
      let want = cons ? toC : toV;
      if (toV === '로' && rieulBatchim(last)) want = '로';
      return [want, from.length];
    }
  }
  return ['', 0];
}

function applyRule(text, rule) {
  if (rule.kind === 'literal') {
    const n = text.split(rule.from).length - 1;
    return [n ? text.split(rule.from).join(rule.to) : text, n];
  }
  if (rule.kind === 'ko-noun') {
    const re = new RegExp(rule.from, 'g');
    let n = 0; let out = ''; let last = 0; let m;
    while ((m = re.exec(text))) {
      n++;
      const rest = text.slice(m.index + m[0].length);
      const [part, len] = fixParticle(rule.to, rest);
      out += text.slice(last, m.index) + rule.to + part;
      last = m.index + m[0].length + len;
      re.lastIndex = last;
    }
    return [n ? out + text.slice(last) : text, n];
  }
  throw new Error(`E_RULE_KIND: ${rule.id}`);
}

// ---- SQL slicing + roundtrip ------------------------------------------------
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const serialize = (row) => `INSERT INTO gdd_document (${COLS.join(', ')}) VALUES (${COLS.map((c) => (c === 'sort' ? String(row[c]) : q(row[c]))).join(', ')});`;
function loadRows(file) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec(fs.readFileSync(path.join(REPO, 'data/sql/000-schema.sql'), 'utf8'));
  db.exec(fs.readFileSync(file, 'utf8'));
  const rows = db.prepare(`SELECT ${COLS.join(', ')} FROM gdd_document ORDER BY rowid`).all();
  db.close();
  return rows;
}
const original = fs.readFileSync(SQL, 'utf8');
const lines = original.split('\n');
const starts = lines.flatMap((l, i) => (l.startsWith('INSERT INTO') ? [i] : []));
const header = lines.slice(0, starts[0]).join('\n');
const end = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
const stmts = starts.map((s, i) => lines.slice(s, i + 1 < starts.length ? starts[i + 1] : end).join('\n'));
const rows = loadRows(SQL);
if (rows.length !== 129 || stmts.length !== 129) { console.error(`E_ROWS: ${rows.length} rows, ${stmts.length} statements`); process.exit(5); }
if (`${header}\n${stmts.join('\n')}\n` !== original) { console.error('E_ROUNDTRIP: file reassembly differs'); process.exit(3); }
rows.forEach((r, i) => { if (serialize(r) !== stmts[i]) { console.error(`E_ROUNDTRIP: ${r.id}`); process.exit(3); } });
const byId = new Map(rows.map((r) => [r.id, r]));

// ---- apply --------------------------------------------------------------------
const rulesDoc = JSON.parse(fs.readFileSync(path.resolve(REPO, args.rules), 'utf8'));
const before = new Map(rows.map((r) => [r.id, { ...r }]));
const applied = [];
let failed = 0;
for (const rule of rulesDoc.rules) {
  let total = 0; const perDoc = {};
  for (const id of rule.docs) {
    const row = byId.get(id);
    if (!row) { console.error(`E_RULE_DOC: ${rule.id}: ${id}`); process.exit(4); }
    for (const f of rule.fields) {
      if (!TEXT_FIELDS.has(f)) { console.error(`E_RULE_FIELD: ${rule.id}: ${f}`); process.exit(4); }
      const [next, n] = applyRule(row[f], rule);
      row[f] = next; total += n;
      if (n) perDoc[`${id}.${f}`] = n;
    }
  }
  if (total !== rule.expect) { failed++; console.error(`E_RULE_COUNT: ${rule.id} expected ${rule.expect}, got ${total}`); }
  applied.push({ id: rule.id, hits: total, perDoc });
}
const touched = rows.filter((r) => [...TEXT_FIELDS].some((f) => r[f] !== before.get(r.id)[f])).map((r) => r.id);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const newText = `${header}\n${rows.map(serialize).join('\n')}\n`;
const report = { rules: args.rules, dryRun: !!args.dryRun, ruleCount: rulesDoc.rules.length, hits: applied.reduce((a, r) => a + r.hits, 0), touched, applied, sha256Before: sha(original), sha256After: sha(newText) };
fs.mkdirSync(path.dirname(path.resolve(args.report)), { recursive: true });
fs.writeFileSync(path.resolve(args.report), `${JSON.stringify(report, null, 2)}\n`);
if (failed) { console.error(`${failed} rule(s) failed; nothing written`); process.exit(4); }
if (!args.dryRun) {
  const tmp = `${SQL}.v4all.tmp`;
  fs.writeFileSync(tmp, newText);
  const after = loadRows(tmp);
  if (after.length !== 129) { fs.rmSync(tmp); console.error('E_POST: row count'); process.exit(5); }
  for (const a of after) {
    const r = byId.get(a.id);
    for (const c of COLS) if (a[c] !== r[c]) { fs.rmSync(tmp); console.error(`E_POST: ${a.id}.${c}`); process.exit(5); }
    for (const c of COLS) if (!TEXT_FIELDS.has(c) && a[c] !== before.get(a.id)[c]) { fs.rmSync(tmp); console.error(`E_POST: key column ${a.id}.${c}`); process.exit(5); }
  }
  fs.renameSync(tmp, SQL);
}
console.log(`${args.dryRun ? 'dry-run' : 'applied'}: ${report.ruleCount} rules, ${report.hits} hits, ${touched.length} docs`);
