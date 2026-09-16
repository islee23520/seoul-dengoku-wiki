/**
 * Machine gate for the portrait review records described in QUALITY-GATE.md.
 *
 * The validator never awards quality. It decides whether a record is admissible
 * evidence, and whether the verdicts already written in it add up to acceptance.
 * Missing evidence becomes NOT_VERIFIED, never PASS, and nothing averages.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const contract = JSON.parse(readFileSync(new URL('./portrait-review-contract.json', import.meta.url), 'utf8'));

export const REFERENCE_SHA256 = contract.reference.sha256;
export const QUALITY_ROWS = contract.quality_rows;
export const CHECKPOINTS = contract.checkpoints;
export const NUMERIC_GATES = contract.numeric_gates;
export const VERDICTS = contract.verdicts;
export const VERDICT_NORMALIZATION = contract.verdict_normalization;

/**
 * Normalize a recorded verdict, including the qualified prose the Stage-2/3
 * quality ledger actually writes ("PASS limited garment-only", "FAIL DEFERRED").
 * Only a bare PASS is a pass; a qualified pass is not a pass of the whole row,
 * and deferring a failure does not clear it.
 *
 * @returns {{verdict: string, qualifier: string|null, raw: string}|null} null when unrecognized
 */
export function normalizeVerdict(raw) {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (value === '') return null;
  if (VERDICTS.includes(value)) return { verdict: value, qualifier: null, raw: value };
  const upper = value.toUpperCase();
  if (upper === 'NOT VERIFIED') return { verdict: 'NOT_VERIFIED', qualifier: null, raw: value };
  if (upper.startsWith('FAIL')) {
    return { verdict: 'FAIL', qualifier: value.slice(4).trim() || null, raw: value };
  }
  if (upper.startsWith('PASS')) {
    // A pass that needed a qualifier did not cover the row.
    return { verdict: 'NOT_VERIFIED', qualifier: value.slice(4).trim() || null, raw: value };
  }
  if (upper.startsWith('NOT VERIFIED')) {
    return { verdict: 'NOT_VERIFIED', qualifier: value.slice('NOT VERIFIED'.length).trim() || null, raw: value };
  }
  // Every other ledger token records something short of a verified pass.
  if (contract.verdict_normalization.observed_tokens.includes(value)) {
    return { verdict: 'NOT_VERIFIED', qualifier: value, raw: value };
  }
  return null;
}

const UTC_STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const CHARACTER_ID = /^K\d{3,4}$/;
const SHA256 = /^[0-9a-f]{64}$/;

const isSha256 = (value) => typeof value === 'string' && SHA256.test(value);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** True when `binding` names a repository file whose bytes still hash to the recorded digest. */
function fileBound(binding, repoRoot) {
  if (!binding || typeof binding.path !== 'string' || !isSha256(binding.sha256)) return false;
  const full = resolve(repoRoot, binding.path);
  if (!existsSync(full) || !statSync(full).isFile()) return false;
  return digest(readFileSync(full)) === binding.sha256;
}

/**
 * @param {object} record parsed review record
 * @param {{ repoRoot: string }} options
 * @returns {{ checkpoint: string|null, errors: object[], blocking: object[], rows: object[], accepted: boolean }}
 */
export function verifyPortraitReview(record, options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const errors = [];
  const blocking = [];
  const fail = (code, detail) => errors.push(detail ? { code, ...detail } : { code });

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { checkpoint: null, errors: [{ code: 'record_not_object' }], blocking: [], rows: [], accepted: false };
  }
  if (record.schema_version !== 1) fail('unsupported_schema_version', { value: record.schema_version ?? null });

  for (const field of contract.aggregate_fields_forbidden) {
    if (record[field] !== undefined) fail('aggregate_score_forbidden', { field });
  }

  const checkpoint = CHECKPOINTS.includes(record.checkpoint) ? record.checkpoint : null;
  if (!checkpoint) fail('unknown_checkpoint', { value: record.checkpoint ?? null });

  if (typeof record.reviewed_at !== 'string' || !UTC_STAMP.test(record.reviewed_at)) {
    fail('reviewed_at_not_utc', { value: record.reviewed_at ?? null });
  }

  const role = record.reviewer?.role;
  const reviewerMayPass = contract.reviewer_roles.may_pass.includes(role);
  if (typeof record.reviewer?.name !== 'string' || !record.reviewer.name.trim() || typeof role !== 'string') {
    fail('reviewer_unidentified');
  } else if (!reviewerMayPass && !contract.reviewer_roles.may_not_pass.includes(role)) {
    fail('unknown_reviewer_role', { value: role });
  }

  if (record.reference?.sha256 !== REFERENCE_SHA256) {
    fail('reference_not_frozen', { expected: REFERENCE_SHA256, value: record.reference?.sha256 ?? null });
  }

  const subject = record.subject ?? {};
  const expectedKind = checkpoint ? contract.checkpoint_subject_kind[checkpoint] : null;
  if (expectedKind && subject.kind !== expectedKind) {
    fail('checkpoint_kind_mismatch', { checkpoint, expected: expectedKind, value: subject.kind ?? null });
  }
  if (typeof subject.id !== 'string' || !subject.id.trim()) fail('subject_id_missing');
  if (subject.kind !== 'delivery' && subject.sex !== undefined
    && !['female', 'male'].includes(subject.sex)) fail('unknown_sex', { value: subject.sex });
  if (!fileBound(subject.candidate, repoRoot)) fail('candidate_unbound', { path: subject.candidate?.path ?? null });

  if (subject.kind === 'variant' || subject.kind === 'pilot') {
    const backdrops = record.inspection?.isolated_backdrops;
    const seen = new Set(Array.isArray(backdrops) ? backdrops : []);
    if (!contract.isolated_backdrops.every((backdrop) => seen.has(backdrop))) {
      fail('backdrops_incomplete', { expected: contract.isolated_backdrops, value: backdrops ?? null });
    }
  }
  if (checkpoint === 'GQ3') {
    const crosses = subject.crosses;
    if (!Array.isArray(crosses) || new Set(crosses).size < contract.minimum_crosses) {
      fail('crosses_incomplete', { minimum: contract.minimum_crosses, value: crosses ?? null });
    }
  }
  if (checkpoint === 'GQ4') {
    if (typeof subject.character_id !== 'string' || !CHARACTER_ID.test(subject.character_id)) {
      fail('character_id_required', { value: subject.character_id ?? null });
    }
    if (!fileBound(subject.export, repoRoot)) fail('export_unbound', { path: subject.export?.path ?? null });
  }

  const crops = new Map();
  for (const crop of record.inspection?.native_crops ?? []) {
    if (crop && typeof crop.path === 'string') crops.set(crop.path, crop);
  }
  if (crops.size === 0) fail('native_crops_missing');

  const rows = Array.isArray(record.rows) ? record.rows : [];
  const byId = new Map();
  for (const row of rows) {
    if (!row || typeof row.id !== 'string') continue;
    if (byId.has(row.id)) fail('rows_duplicated', { row: row.id });
    else byId.set(row.id, row);
  }
  const unexpected = [...byId.keys()].filter((id) => !QUALITY_ROWS.includes(id));
  if (unexpected.length) fail('rows_unexpected', { rows: unexpected });
  if (!QUALITY_ROWS.every((id) => byId.has(id))) {
    fail('rows_incomplete', { missing: QUALITY_ROWS.filter((id) => !byId.has(id)) });
  }

  const resolved = [];
  for (const id of QUALITY_ROWS) {
    const row = byId.get(id);
    if (!row) continue;
    const normalized = normalizeVerdict(row.verdict);
    if (!normalized) {
      fail('unknown_verdict', { row: id, value: row.verdict ?? null });
      continue;
    }
    if (normalized.verdict === 'N/A') {
      if (subject.kind === 'composite' || subject.kind === 'delivery') fail('na_on_composite', { row: id });
      else if (typeof row.reason !== 'string' || !row.reason.trim()) fail('na_without_reason', { row: id });
      resolved.push({ row: id, verdict: 'N/A' });
      continue;
    }
    if (normalized.verdict !== 'PASS') {
      // A qualified pass reads as PASS in prose but covers less than the row.
      const entry = { row: id, verdict: normalized.verdict };
      if (normalized.qualifier && /^pass/i.test(normalized.raw)) entry.reason = 'qualified_pass';
      if (normalized.raw !== normalized.verdict) entry.recorded = normalized.raw;
      blocking.push(entry);
      resolved.push({ ...entry });
      continue;
    }
    // A PASS survives only with a lead/owner reviewer and a bound native crop.
    const downgrade = (reason) => {
      blocking.push({ row: id, verdict: 'NOT_VERIFIED', downgraded_from: 'PASS', reason });
      resolved.push({ row: id, verdict: 'NOT_VERIFIED', downgraded_from: 'PASS', reason });
    };
    if (!reviewerMayPass) downgrade('reviewer_not_lead');
    else if (typeof row.crop !== 'string' || !row.crop.trim()) downgrade('crop_missing');
    else if (!crops.has(row.crop)) downgrade('crop_unbound');
    else if (!fileBound(crops.get(row.crop), repoRoot)) downgrade('crop_file_mismatch');
    else if (typeof row.observation !== 'string' || !row.observation.trim()) downgrade('observation_missing');
    else resolved.push({ row: id, verdict: 'PASS' });
  }

  const gates = record.numeric_gates;
  if (!gates || typeof gates !== 'object' || Array.isArray(gates)
    || !NUMERIC_GATES.every((gate) => gate in gates)) {
    fail('numeric_gates_incomplete', {
      missing: NUMERIC_GATES.filter((gate) => !gates || !(gate in gates)),
    });
  } else {
    for (const gate of NUMERIC_GATES) {
      const normalized = normalizeVerdict(gates[gate]);
      if (!normalized || normalized.verdict === 'N/A') fail('unknown_verdict', { gate, value: gates[gate] ?? null });
      else if (normalized.verdict !== 'PASS') blocking.push({ gate, verdict: normalized.verdict });
    }
  }

  return {
    checkpoint,
    errors,
    blocking,
    rows: resolved,
    accepted: errors.length === 0 && blocking.length === 0,
  };
}

/** Read a record from disk and verify it. `repoRoot` defaults to the record's own directory. */
export function verifyPortraitReviewFile(recordPath, options = {}) {
  const full = resolve(recordPath);
  const record = JSON.parse(readFileSync(full, 'utf8'));
  return { record: full, ...verifyPortraitReview(record, options) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const read = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  try {
    const recordPath = read('--record');
    if (!recordPath) throw new Error('usage: --record <path> [--repo-root <path>]');
    const report = verifyPortraitReviewFile(recordPath, { repoRoot: resolve(read('--repo-root') ?? process.cwd()) });
    console.log(JSON.stringify(report, null, 2));
    if (!report.accepted) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exitCode = 1;
  }
}
