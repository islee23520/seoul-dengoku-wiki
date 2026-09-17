#!/usr/bin/env node
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

import { openAssetDatabase } from './database.mjs';
import { scanEvidence } from './scanner.mjs';
import { exportViews } from './views.mjs';
import { materializeRawAssets, verifyRawAssets } from './raw-store.mjs';
import { getGateAuditReport, seedGateEvaluationsFromConfig } from './gate-evaluations.mjs';
import { materializeWorkingSet } from './working-set.mjs';
import { recordFoundationGates } from './record-foundation-gates.mjs';
import { indexSlotReviews } from './slot-review-index.mjs';

function value(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index < 0 ? fallback : process.argv[index + 1];
}

const repoRoot = resolve(value('--repo', new URL('../../..', import.meta.url).pathname));
const dbPath = resolve(repoRoot, value('--db', 'Design/potrait-generator/data/assets.sqlite'));
const db = openAssetDatabase(dbPath);
const command = process.argv[2] ?? 'stats';
const HELP = `potrait-generator asset catalog

Commands:
  scan [--evidence PATH] [--views PATH]
  stats
  views
  query --status PASS|REJECTED|PENDING|SUPERSEDED|UNREVIEWED [--curated] [--sex female|male] [--slot SLOT] [--role ROLE]
  history --path PATH | --sha SHA256
  duplicates
  ingest-raw
  verify-raw
  seed-gates
  gates [--sex female|male] [--slot SLOT] [--source PATH]
  prepare-work
  record-foundations
  index-slot-reviews
  slot-reviews [--sex female|male] [--slot SLOT]
  cache-get --key KEY
  cache-put --key KEY --producer TOOL --inputs JSON [--output-sha SHA256]
`;

try {
  if (command === '--help' || command === '-h' || command === 'help') console.log(HELP);
  else if (command === 'scan') {
    const work = resolve(repoRoot, 'Design/potrait-generator/work');
    const result = await scanEvidence({ db, repoRoot, evidenceRoot: resolve(repoRoot, value('--evidence', '.omo/evidence')), additionalRoots: existsSync(work) ? [work] : [] });
    const counts = exportViews({ db, outputRoot: resolve(repoRoot, value('--views', 'Design/potrait-generator/views')) });
    console.log(JSON.stringify({ ...result, views: counts }, null, 2));
  } else if (command === 'views') {
    console.log(JSON.stringify(exportViews({ db, outputRoot: resolve(repoRoot, value('--views', 'Design/potrait-generator/views')) }), null, 2));
  } else if (command === 'query') {
    const status = value('--status', 'PASS');
    const sex = value('--sex');
    const slot = value('--slot');
    const role = value('--role');
    const clauses = ['decision = ?']; const args = [status];
    if (!process.argv.includes('--all-types')) clauses.push("asset_class = 'image' AND stage IN ('raw','work')");
    if (sex) { clauses.push('sex = ?'); args.push(sex); }
    if (slot) { clauses.push('slot = ?'); args.push(slot); }
    if (role) { clauses.push("EXISTS (SELECT 1 FROM properties p WHERE p.sha256 = asset_state.sha256 AND p.key = 'curated.role' AND json_extract(p.value_json, '$') = ?)"); args.push(role); }
    const view = process.argv.includes('--curated') ? 'v_curated_passed_assets' : 'asset_state';
    console.log(JSON.stringify({ assets: db.prepare(`SELECT * FROM ${view} AS asset_state WHERE ${clauses.join(' AND ')} ORDER BY best_path`).all(...args) }, null, 2));
  } else if (command === 'ingest-raw') {
    console.log(JSON.stringify(await materializeRawAssets({ db, repoRoot }), null, 2));
  } else if (command === 'verify-raw') {
    const report = await verifyRawAssets({ db, repoRoot });
    console.log(JSON.stringify(report, null, 2));
    if (report.missing || report.corrupt || report.sourceMissing || report.sourceMismatch) process.exitCode = 1;
  } else if (command === 'seed-gates') {
    console.log(JSON.stringify(await seedGateEvaluationsFromConfig({ db, repoRoot }), null, 2));
  } else if (command === 'gates') {
    console.log(JSON.stringify(getGateAuditReport({ db, sex: value('--sex'), slot: value('--slot'), sourcePath: value('--source') }), null, 2));
  } else if (command === 'prepare-work') {
    console.log(JSON.stringify(materializeWorkingSet({ db, repoRoot }), null, 2));
  } else if (command === 'record-foundations') {
    console.log(JSON.stringify(await recordFoundationGates({ db, repoRoot }), null, 2));
  } else if (command === 'index-slot-reviews') {
    console.log(JSON.stringify(await indexSlotReviews({ db, repoRoot }), null, 2));
  } else if (command === 'slot-reviews') {
    const clauses=[];const args=[];
    if (value('--sex')) { clauses.push('sex=?');args.push(value('--sex')); }
    if (value('--slot')) { clauses.push('slot=?');args.push(value('--slot')); }
    const installed=db.prepare("SELECT name FROM sqlite_master WHERE name='slot_review_observations'").get();
    const rows=installed?db.prepare(`SELECT * FROM slot_review_observations ${clauses.length?'WHERE '+clauses.join(' AND '):''} ORDER BY sex,slot,id`).all(...args):[];
    console.log(JSON.stringify({evaluations:rows.map(row=>({...row,details:JSON.parse(row.details_json),details_json:undefined}))},null,2));
  } else if (command === 'duplicates') {
    console.log(JSON.stringify({ groups: db.prepare('SELECT * FROM v_duplicate_bytes ORDER BY path_count DESC, sha256').all() }, null, 2));
  } else if (command === 'history') {
    const path = value('--path');
    const sha = value('--sha');
    if (!path && !sha) throw new Error('history requires --path or --sha');
    const asset = path ? db.prepare('SELECT * FROM asset_state WHERE best_path = ?').get(path)
      : db.prepare('SELECT * FROM asset_state WHERE sha256 = ? ORDER BY best_path').all(sha);
    const digest = sha ?? asset?.sha256;
    const claims = db.prepare('SELECT * FROM evaluation_observations WHERE target_path = ? OR target_sha256 = ? ORDER BY id').all(path ?? null, digest);
    const sameBytes = digest ? db.prepare('SELECT path,stage,lifecycle,sex,slot FROM asset_paths WHERE sha256 = ? ORDER BY path').all(digest) : [];
    console.log(JSON.stringify({ asset, claims, sameBytes }, null, 2));
  } else if (command === 'cache-get') {
    const key = value('--key');
    if (!key) throw new Error('cache-get requires --key');
    console.log(JSON.stringify(db.prepare('SELECT * FROM derived_cache WHERE cache_key = ?').get(key) ?? null, null, 2));
  } else if (command === 'cache-put') {
    const key = value('--key'); const producer = value('--producer'); const inputs = value('--inputs');
    if (!key || !producer || !inputs) throw new Error('cache-put requires --key --producer --inputs');
    const parsed = JSON.parse(inputs);
    const inputsJson = JSON.stringify(parsed);
    db.prepare(`INSERT INTO derived_cache(cache_key,producer,inputs_json,output_sha256,status,updated_at)
      VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(cache_key) DO UPDATE SET producer=excluded.producer,inputs_json=excluded.inputs_json,output_sha256=excluded.output_sha256,status=excluded.status,updated_at=CURRENT_TIMESTAMP`)
      .run(key, producer, inputsJson, value('--output-sha'), value('--cache-status', 'READY'));
    console.log(JSON.stringify(db.prepare('SELECT * FROM derived_cache WHERE cache_key = ?').get(key), null, 2));
  } else if (command === 'stats') {
    console.log(JSON.stringify({
      paths: db.prepare('SELECT COUNT(*) AS count FROM asset_paths').get().count,
      blobs: db.prepare('SELECT COUNT(*) AS count FROM content_objects').get().count,
      evaluations: db.prepare('SELECT COUNT(*) AS count FROM evaluation_observations').get().count,
      cache: db.prepare('SELECT COUNT(*) AS count FROM file_cache').get().count,
    }, null, 2));
  } else throw new Error(`unknown command: ${command}`);
} finally {
  db.close();
}
