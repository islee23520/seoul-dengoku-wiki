import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getGateAuditReport } from './gate-evaluations.mjs';

function rows(db, view) {
  const order = view === 'v_duplicate_bytes' ? 'path_count DESC, sha256' : 'sex, slot, logical_id, best_path';
  return db.prepare(`SELECT * FROM ${view} ORDER BY ${order}`).all();
}

function write(path, assets) {
  writeFileSync(path, `${JSON.stringify({ version: 1, assets }, null, 2)}\n`);
}

export function exportViews({ db, outputRoot }) {
  mkdirSync(outputRoot, { recursive: true });
  const definitions = {
    raw: 'v_raw_assets', work: 'v_work_assets', review: 'v_review_assets',
    passed: 'v_passed_assets', curatedPassed: 'v_curated_passed_assets', failed: 'v_failed_assets', duplicates: 'v_duplicate_bytes',
  };
  const counts = {};
  for (const [name, view] of Object.entries(definitions)) {
    const assets = rows(db, view);
    counts[name] = assets.length;
    write(join(outputRoot, `${name}-assets.json`), assets);
  }
  const gateReport = getGateAuditReport({ db });
  writeFileSync(join(outputRoot, 'gate-status.json'), `${JSON.stringify(gateReport, null, 2)}\n`);
  const rawInstalled = db.prepare("SELECT name FROM sqlite_master WHERE name='raw_asset_proof'").get();
  if (rawInstalled) {
    const objects = db.prepare('SELECT * FROM raw_objects ORDER BY sha256').all();
    write(join(outputRoot, 'raw-objects.json'), objects);
    counts.rawObjects = objects.length;
  }
  writeFileSync(join(outputRoot, 'summary.json'), `${JSON.stringify({ version: 1, counts }, null, 2)}\n`);
  return counts;
}
