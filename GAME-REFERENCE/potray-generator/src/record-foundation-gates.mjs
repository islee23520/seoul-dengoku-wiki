import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { registerGateEvaluation } from './gate-evaluations.mjs';
import { ORIGINAL_GATE1_SLOTS } from './verify-foundations.mjs';

export function foundationClaims(report, receiptPath, receiptSha256) {
  if (report.overall_verdict !== 'VERIFIED_EXACT_PARTITIONS' || report.foundations?.length !== 2) throw new Error('foundation report is not verified');
  if (new Set(report.foundations.map(f=>f.sex)).size !== 2 || report.foundations.some(f=>!['female','male'].includes(f.sex))) throw new Error('foundation sex pair is not verified');
  return report.foundations.flatMap(foundation => {
    const { source, partition, reconstruction } = foundation;
    const zeroChecks = ['gap_pixels','overlap_pixels','partial_alpha_pixels','alpha_zero_rgb_violations','owned_rgba_mismatch_pixels','hash_drift_files'];
    if (foundation.baseline_verdict !== 'VERIFIED_EXACT_PARTITION' || !partition.verified
      || zeroChecks.some(key => partition[key] !== 0) || reconstruction.changed_pixels !== 0
      || source.actual_sha256 !== source.expected_sha256 || foundation.failures.length) throw new Error(`${foundation.sex} partition is not verified`);
    if (partition.slots.length !== ORIGINAL_GATE1_SLOTS.length || partition.slots.some((slot,index)=>slot.id!==ORIGINAL_GATE1_SLOTS[index] || slot.sha256!==slot.expected_sha256)) throw new Error(`${foundation.sex} slot set is not verified`);
    const shared = { receiptPath, receiptSha256, sourcePath: source.path, sourceSha256: source.actual_sha256,
      sex: foundation.sex, gate: 'gate1', check: 'reconstruction', decision: 'PASS',
      scope: 'frozen_foundation_exact_reconstruction', authority: 'verifier',
      summary: 'Existing source-visible partition reconstructs its own source exactly; no hidden-support or combination credit.' };
    return [{ ...shared, slot: 'foundation_body', subjectPath: source.path, subjectSha256: source.actual_sha256 },
      ...partition.slots.map(slot => ({ ...shared, slot: slot.id, subjectPath: slot.path ?? null, subjectSha256: slot.sha256 }))];
  });
}

export async function recordFoundationGates({ db, repoRoot }) {
  const receiptPath = 'Design/potrait-generator/work/foundation-baseline/receipt.json';
  const bytes = readFileSync(resolve(repoRoot, receiptPath));
  const report = JSON.parse(bytes);
  const configBytes = readFileSync(resolve(repoRoot, 'Design/potrait-generator/config/asset-decisions.json'));
  if (report.inputs?.config?.sha256 !== createHash('sha256').update(configBytes).digest('hex')) throw new Error('foundation verification config has changed; rerun verification');
  for (const foundation of report.foundations) for (const receipt of Object.values(foundation.evidence_receipts)) {
    const current = db.prepare('SELECT sha256 FROM asset_paths WHERE path=?').get(receipt.path);
    if (current?.sha256 !== receipt.actual_sha256) throw new Error(`foundation authority receipt changed: ${receipt.path}`);
  }
  const claims = foundationClaims(report, receiptPath, createHash('sha256').update(bytes).digest('hex'));
  const config = JSON.parse(configBytes);
  const faceSources = new Map();
  for (const binding of config.decisions.filter(row => row.properties?.role === 'face_base' && row.properties?.gate_scope === 'gate1_visible_ownership')) {
    const row = db.prepare('SELECT path,sha256,sex FROM asset_paths WHERE path=? AND sha256=?').get(binding.path, binding.sha256);
    if (!row || !report.foundations.some(f => f.sex === row.sex && f.partition.slots.find(s=>s.id==='face_base')?.sha256 === row.sha256)) throw new Error('configured foundation slot drift');
    if (faceSources.has(row.sex)) throw new Error(`ambiguous configured face source: ${row.sex}`);
    faceSources.set(row.sex, row.path);
  }
  let inserted = 0;
  for (const claim of claims) {
    if (!claim.subjectPath) {
      const facePath = faceSources.get(claim.sex);
      if (!facePath) throw new Error(`foundation slot source missing: ${claim.sex}`);
      claim.subjectPath = facePath.replace(/face_base\.png$/, `${claim.slot}.png`);
    }
    const result = await registerGateEvaluation({ db, repoRoot, ...claim });
    if (result.inserted) inserted += 1;
  }
  return { verifiedSubjects: claims.length, inserted, scope: 'gate1_reconstruction_only' };
}
