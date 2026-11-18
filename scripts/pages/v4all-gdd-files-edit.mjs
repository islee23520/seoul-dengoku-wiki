#!/usr/bin/env node
// v4 convert-everything Lane A: literal rules for GDD repository files outside data/sql
// (gdd/canon/archify/generated/*.html, gdd/snapshots/**, gdd/GAME-REFERENCE/**, gdd/RESEARCH/**).
// Each rule replaces an exact substring with an exact hit count. After editing, any changed archify
// diagram gets its sha256 refreshed in gdd/canon/archify/generated/manifest.json (the viewer rejects
// a mismatch with E_ARCHIFY_HASH_MISMATCH), and every changed .json file must still parse.
//
//   node scripts/pages/v4all-gdd-files-edit.mjs --rules <rules.json> --report <out.json> [--dry-run]
//   rules: { rules: [{ id, file (repo-relative), from, to, expect, reason }] }
// Exit codes: 0 ok, 2 usage, 4 rule count mismatch, 5 post-check failure.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = path.join(REPO, 'gdd/canon/archify/generated/manifest.json');
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const t = process.argv[i];
  if (t === '--dry-run') args.dryRun = true;
  else if (t === '--rules' || t === '--report') args[t.slice(2)] = process.argv[++i];
  else { console.error(`E_ARG: ${t}`); process.exit(2); }
}
if (!args.rules || !args.report) { console.error('usage: --rules <file> --report <out.json> [--dry-run]'); process.exit(2); }

const rules = JSON.parse(fs.readFileSync(path.resolve(REPO, args.rules), 'utf8')).rules;
const texts = new Map(); const applied = []; let failed = 0;
for (const r of rules) {
  const file = path.join(REPO, r.file);
  const before = texts.get(file) ?? fs.readFileSync(file, 'utf8');
  const n = before.split(r.from).length - 1;
  if (n !== r.expect) { failed++; console.error(`E_RULE_COUNT: ${r.id} expected ${r.expect}, got ${n}`); }
  texts.set(file, before.split(r.from).join(r.to));
  applied.push({ id: r.id, file: r.file, hits: n });
}
for (const [file, text] of texts) if (file.endsWith('.json')) { try { JSON.parse(text); } catch { console.error(`E_POST: ${file} no longer parses`); process.exit(5); } }
let manifestText = fs.readFileSync(MANIFEST, 'utf8');
const manifest = JSON.parse(manifestText);
const manifestChanged = [];
for (const [file, text] of texts) {
  if (path.dirname(file) !== path.dirname(MANIFEST) || !file.endsWith('.html')) continue;
  const entry = manifest.diagrams.find((d) => d.file === path.basename(file));
  if (!entry) { console.error(`E_POST: ${file} not in archify manifest`); process.exit(5); }
  const sha = crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
  if (sha !== entry.sha256) { manifestChanged.push({ file: entry.file, before: entry.sha256, after: sha }); manifestText = manifestText.replace(`"sha256": "${entry.sha256}"`, `"sha256": "${sha}"`); }
}
const report = { rules: args.rules, dryRun: !!args.dryRun, hits: applied.reduce((a, r) => a + r.hits, 0), applied, manifestChanged };
fs.mkdirSync(path.dirname(path.resolve(args.report)), { recursive: true });
fs.writeFileSync(path.resolve(args.report), `${JSON.stringify(report, null, 2)}\n`);
if (failed) { console.error(`${failed} rule(s) failed; nothing written`); process.exit(4); }
if (!args.dryRun) { for (const [file, text] of texts) fs.writeFileSync(file, text); if (manifestChanged.length) fs.writeFileSync(MANIFEST, manifestText); }
console.log(`${args.dryRun ? 'dry-run' : 'applied'}: ${rules.length} rules, ${report.hits} hits, ${manifestChanged.length} manifest entries`);
