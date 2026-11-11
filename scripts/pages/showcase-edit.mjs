#!/usr/bin/env node
// W5-27: deterministic showcase text patch (text only; audio files untouched).
// Applies docs/showcase-rules.json to the showcase text sources.
//   node scripts/pages/showcase-edit.mjs           apply (writes files + apply log)
//   node scripts/pages/showcase-edit.mjs --check   verify originals only, change nothing
//
// Contract:
//   - every rule's `from` must appear exactly `expect` times in its file, else exit 1 (fail loudly);
//   - bytes outside matched `from` occurrences are never touched;
//   - `to: "delete"` removes the occurrence entirely;
//   - per-file byte delta must equal the sum of rule deltas;
//   - apply log is written to docs/drafts/reports/w5-27-apply-log.json.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const RULES = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/showcase-rules.json'), 'utf8')).rules;
const LOG = path.join(REPO, 'docs/drafts/reports/w5-27-apply-log.json');
const CHECK = process.argv.includes('--check');

const head = (() => {
  try { return execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return null; }
})();

const errors = [];
const results = [];
const fileBytesBefore = new Map();
const fileBytesAfter = new Map();

// 1) verify every original exists exactly `expect` times
for (const r of RULES) {
  const fp = path.join(REPO, r.file);
  if (!fs.existsSync(fp)) { errors.push(`${r.id}: file missing: ${r.file}`); continue; }
  if (!fileBytesBefore.has(r.file)) fileBytesBefore.set(r.file, Buffer.byteLength(fs.readFileSync(fp, 'utf8')));
  const text = fs.readFileSync(fp, 'utf8');
  const count = text.split(r.from).length - 1;
  if (count !== r.expect) {
    errors.push(`${r.id}: expected ${r.expect} occurrence(s) of original in ${r.file}, found ${count}`);
    continue;
  }
  results.push({ id: r.id, file: r.file, class: r.class, pattern: r.pattern, unit_id: r.unit_id ?? null, expect: r.expect, found: count, delta: r.to === 'delete' ? -Buffer.byteLength(r.from, 'utf8') : Buffer.byteLength(r.to, 'utf8') - Buffer.byteLength(r.from, 'utf8'), voiced: !!r.voiced });
}

if (errors.length) {
  console.error(`E_RULE_ORIGINAL_MISMATCH: ${errors.length} rule(s) failed verification:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
if (CHECK) {
  console.log(`OK: ${results.length} rule(s) verified against originals (check mode, nothing written)`);
  process.exit(0);
}

// 2) apply rules per file (replace every matched occurrence; nothing else changes)
for (const file of [...new Set(results.map((r) => r.file))]) {
  const fp = path.join(REPO, file);
  let text = fs.readFileSync(fp, 'utf8');
  for (const r of RULES.filter((x) => x.file === file)) {
    const repl = r.to === 'delete' ? '' : r.to;
    text = text.split(r.from).join(repl);
  }
  fs.writeFileSync(fp, text);
  fileBytesAfter.set(file, Buffer.byteLength(text));
}

// 3) post-conditions
for (const r of RULES) {
  const text = fs.readFileSync(path.join(REPO, r.file), 'utf8');
  const repl = r.to === 'delete' ? '' : r.to;
  const remaining = text.split(r.from).length - 1;
  // a replacement that itself contains the original (e.g. a wrapping edit) legitimately leaves copies
  const allowed = repl.includes(r.from) ? r.expect * (repl.split(r.from).length - 1) : 0;
  if (remaining !== allowed) errors.push(`${r.id}: unexpected original count after apply (${remaining}, allowed ${allowed})`);
}
const perFileDelta = {};
for (const file of fileBytesAfter.keys()) {
  const ruleDelta = RULES.filter((x) => x.file === file).reduce((a, r) => a + (r.to === 'delete' ? -Buffer.byteLength(r.from) : Buffer.byteLength(r.to) - Buffer.byteLength(r.from)) * r.expect, 0);
  const realDelta = fileBytesAfter.get(file) - fileBytesBefore.get(file);
  perFileDelta[file] = { rule_delta_bytes: ruleDelta, actual_delta_bytes: realDelta, match: ruleDelta === realDelta };
  if (ruleDelta !== realDelta) errors.push(`${file}: byte delta ${realDelta} != rule delta ${ruleDelta}`);
}
if (errors.length) {
  console.error(`E_POSTCONDITION: ${errors.length} failure(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

// 4) audio mapping: voiced rules -> registered bundled clips -> mp3 file names
const narrationSrc = fs.readFileSync(path.join(REPO, 'artifacts/seoul-showcase/src/data/narration.ts'), 'utf8');
const bundledIds = new Set([...narrationSrc.matchAll(/"(v[0-9][^"]*)"/g)].map((m) => m[1]));
const audioMap = [];
const seenIds = new Set();
for (const r of results.filter((x) => x.voiced)) {
  const id = r.unit_id;
  if (seenIds.has(id) || !bundledIds.has(id)) continue;
  seenIds.add(id);
  audioMap.push({ line_id: id, rule_ids: RULES.filter((x) => x.unit_id === id && x.voiced).map((x) => x.id), files: [`${id}.ko.mp3`, `${id}.en.mp3`] });
}

// 5) write apply log
fs.mkdirSync(path.dirname(LOG), { recursive: true });
fs.writeFileSync(LOG, JSON.stringify({
  ran_at: new Date().toISOString(),
  head,
  mode: 'apply',
  rules_total: results.length,
  rules_applied: results.reduce((a, r) => a + r.expect, 0),
  voiced_rule_ids: results.filter((r) => r.voiced).map((r) => r.id),
  audio_files_whose_narration_no_longer_matches_text: audioMap,
  per_file_delta: perFileDelta,
  results,
}, null, 1));

console.log(`OK: applied ${results.length} rule(s), ${results.reduce((a, r) => a + r.expect, 0)} occurrence(s) across ${fileBytesAfter.size} file(s)`);
console.log(`voiced lines patched: ${audioMap.length} line id(s), ${audioMap.length * 2} mp3 file(s) listed in ${path.relative(REPO, LOG)}`);
