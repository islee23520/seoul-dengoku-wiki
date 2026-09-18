import { createHash } from 'node:crypto';
import { chmodSync, constants, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { getGateAuditReport } from './gate-evaluations.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function localPath(repo, path) {
  if (typeof path !== 'string' || isAbsolute(path) || path.includes('\\') || path.split('/').some(part => part === '..')) throw new Error(`unsafe workspace path: ${path}`);
  const target = resolve(repo, path);
  let current = repo;
  for (const part of relative(repo, target).split('/')) {
    current = resolve(current, part);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error(`workspace symlink forbidden: ${path}`);
  }
  return target;
}

export function materializeWorkingSet({ db, repoRoot }) {
  const repo = resolve(repoRoot);
  const rows = db.prepare(`SELECT c.*, r.stored_path FROM v_curated_passed_assets c
    LEFT JOIN raw_objects r ON r.sha256=c.sha256
    WHERE c.asset_class='image' ORDER BY c.sex,c.slot,c.best_path`).all();
  const audit = getGateAuditReport({ db });
  const assets = [];
  let copied = 0;
  let cached = 0;
  for (const row of rows) {
    if (!row.stored_path) throw new Error(`raw object not ingested: ${row.sha256}`);
    const props = Object.fromEntries(db.prepare("SELECT key,value_json FROM properties WHERE sha256=? AND key LIKE 'curated.%'").all(row.sha256).map(p => [p.key.slice(8), JSON.parse(p.value_json)]));
    const role = String(props.role ?? row.slot ?? 'unclassified').replace(/[^a-z0-9_-]/gi, '_');
    const extension = extname(row.best_path).toLowerCase();
    const relativeOutput = `Design/potrait-generator/work/selected/${row.sex ?? 'unknown'}/${role}/${row.sha256}${extension}`;
    const raw = localPath(repo, row.stored_path);
    const work = localPath(repo, relativeOutput);
    if (digest(readFileSync(raw)) !== row.sha256) throw new Error(`raw object changed: ${row.sha256}`);
    if (existsSync(work)) {
      if (digest(readFileSync(work)) !== row.sha256) throw new Error(`work copy changed; refusing overwrite: ${relativeOutput}`);
      cached += 1;
    } else {
      mkdirSync(dirname(work), { recursive: true });
      copyFileSync(raw, work, constants.COPYFILE_EXCL);
      chmodSync(work, 0o644);
      copied += 1;
    }
    const scope = audit.entries.find(entry => entry.sex === row.sex && entry.slot === (row.slot ?? role)
      && entry.history.some(claim => claim.subject_path === row.best_path && claim.subject_sha256 === row.sha256));
    assets.push({ source_path: row.best_path, sha256: row.sha256, raw_path: row.stored_path, work_path: relativeOutput,
      sex: row.sex, slot: row.slot, role, gate_scope: props.gate_scope ?? 'unspecified',
      gates: Object.fromEntries(['gate1','gate2','gate3'].map(gate => [gate, scope?.gates[gate].status ?? 'NOT_VERIFIED'])),
      production_approved: scope?.eligible === true });
  }
  const manifest = { version: 1, copied, cached, assets };
  const output = localPath(repo, 'Design/potrait-generator/work/selected/manifest.json');
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
