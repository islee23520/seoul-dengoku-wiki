#!/usr/bin/env node
// v4 convert-everything Lane A: literal rules for canon JSON text that data/sql/080 does not render
// (e.g. paragraph `lines` arrays the 080 exporter dropped). Edits the JSON string literals as raw text,
// requires the exact hit count per rule, then recomputes rendered.lock.json for changed documents with
// the vendored materializer renderer.
//
//   node scripts/pages/v4all-gdd-canon-edit.mjs --rules <rules.json> --report <out.json> [--dry-run]
//   rules: { rules: [{ id, file (relative to gdd/canon/locales/ko-KR), from, to, expect, reason }] }
// `from`/`to` are plain substrings of a JSON string value; they must not contain `"` or `\`.
// Exit codes: 0 ok, 2 usage, 4 rule count mismatch, 5 post-check failure.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CANON = path.join(REPO, 'gdd/canon');
const GD = path.join(CANON, 'locales/ko-KR');
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const t = process.argv[i];
  if (t === '--dry-run') args.dryRun = true;
  else if (t === '--rules' || t === '--report') args[t.slice(2)] = process.argv[++i];
  else { console.error(`E_ARG: ${t}`); process.exit(2); }
}
if (!args.rules || !args.report) { console.error('usage: --rules <file> --report <out.json> [--dry-run]'); process.exit(2); }

const rules = JSON.parse(fs.readFileSync(path.resolve(REPO, args.rules), 'utf8')).rules;
const texts = new Map();
const applied = []; let failed = 0;
for (const r of rules) {
  if (/["\\]/.test(r.from + r.to)) { console.error(`E_RULE: ${r.id}: quote or backslash`); process.exit(2); }
  const file = path.join(GD, r.file);
  const before = texts.get(file) ?? fs.readFileSync(file, 'utf8');
  const n = before.split(r.from).length - 1;
  if (n !== r.expect) { failed++; console.error(`E_RULE_COUNT: ${r.id} expected ${r.expect}, got ${n}`); }
  texts.set(file, before.split(r.from).join(r.to));
  applied.push({ id: r.id, file: r.file, hits: n });
}
const { renderDocument, renderTableRows } = await import(pathToFileURL(path.join(REPO, 'gdd/viewer/vendor/canon-tools/canon/render.mjs')).href);
const entries = fs.readdirSync(path.join(CANON, 'collections')).filter((n) => n.endsWith('.json')).flatMap((n) => JSON.parse(fs.readFileSync(path.join(CANON, 'collections', n), 'utf8')).documents ?? []);
const byIdPath = new Map(entries.map((e) => [e.id, e.source.path]));
const lockPath = path.join(CANON, 'rendered.lock.json');
let lockText = fs.readFileSync(lockPath, 'utf8');
const lock = JSON.parse(lockText);
const lockChanged = [];
for (const [file, text] of texts) {
  const doc = JSON.parse(text);
  const e = entries.find((x) => x.id === (doc.document?.id ?? doc.id));
  if (!e || doc.content) continue;
  const md = renderDocument(doc, (b) => renderTableRows(b.header, b.rows, b.dividers), (tid) => path.posix.relative(path.posix.dirname(e.source.path), byIdPath.get(tid)));
  const sha = crypto.createHash('sha256').update(Buffer.from(md)).digest('hex');
  const le = lock.find((x) => x.path === e.source.path);
  if (le && le.sha256 !== sha) { lockChanged.push({ path: le.path, before: le.sha256, after: sha }); lockText = lockText.replace(`"sha256": "${le.sha256}"`, `"sha256": "${sha}"`); }
}
const report = { rules: args.rules, dryRun: !!args.dryRun, hits: applied.reduce((a, r) => a + r.hits, 0), applied, lockChanged };
fs.mkdirSync(path.dirname(path.resolve(args.report)), { recursive: true });
fs.writeFileSync(path.resolve(args.report), `${JSON.stringify(report, null, 2)}\n`);
if (failed) { console.error(`${failed} rule(s) failed; nothing written`); process.exit(4); }
if (!args.dryRun) { for (const [file, text] of texts) fs.writeFileSync(file, text); fs.writeFileSync(lockPath, lockText); }
console.log(`${args.dryRun ? 'dry-run' : 'applied'}: ${rules.length} rules, ${report.hits} hits, ${lockChanged.length} lock entries`);
