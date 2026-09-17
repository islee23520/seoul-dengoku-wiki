#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CURATION_SCHEMA = 'janseon.portrait-curation.v1';
export const CATALOG_PATH = 'Design/potrait-generator/assets/v2/curation-catalog.json';

const SHA256 = /^[0-9a-f]{64}$/;
const DECISIONS = new Set(['adopt', 'hold', 'reject']);
const RECEIPT_STATUSES = new Set(['PASS', 'PENDING']);
const CHECKPOINT_STATUSES = new Set(['APPROVED', 'PENDING']);

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const isSha256 = (value) => typeof value === 'string' && SHA256.test(value);

function canonicalCatalogSha(catalog) {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) return null;
  const copy = { ...catalog };
  delete copy.sha256;
  return digest(Buffer.from(JSON.stringify(copy)));
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function inside(root, target) {
  const rel = relative(root, target);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
}

/** Resolve a relative file without permitting traversal or symlinks at any path component. */
function confinedFile(base, requested, { repoRoot = base } = {}) {
  if (typeof requested !== 'string' || requested.length === 0 || requested.includes('\0') || isAbsolute(requested)) {
    return { error: 'unsafe_path' };
  }
  const target = resolve(base, requested);
  if (!inside(base, target) || !inside(repoRoot, target)) return { error: 'unsafe_path' };

  let cursor = base;
  const rel = relative(base, target);
  for (const part of rel.split(sep).filter(Boolean)) {
    cursor = resolve(cursor, part);
    if (!existsSync(cursor)) return { error: 'missing_file' };
    if (lstatSync(cursor).isSymbolicLink()) return { error: 'symlink_forbidden' };
  }
  if (!existsSync(target) || !statSync(target).isFile()) return { error: 'missing_file' };
  if (!inside(realpathSync(repoRoot), realpathSync(target))) return { error: 'unsafe_path' };
  return { path: target, bytes: readFileSync(target) };
}

function bindingError(binding, base, repoRoot) {
  if (!binding || typeof binding.path !== 'string' || !isSha256(binding.sha256)) {
    return { code: 'binding_invalid', path: binding?.path ?? null };
  }
  const file = confinedFile(base, binding.path, { repoRoot });
  if (file.error) return { code: file.error, path: binding.path };
  const actual = digest(file.bytes);
  if (actual !== binding.sha256) return { code: 'hash_mismatch', path: binding.path, expected: binding.sha256, actual };
  return { file, actual };
}

function validateCatalog(catalog, errors) {
  if (!catalog || catalog.version !== 1 || !Array.isArray(catalog.records)) {
    errors.push({ code: 'catalog_invalid' });
    return null;
  }
  const actual = canonicalCatalogSha(catalog);
  if (!isSha256(catalog.sha256) || actual !== catalog.sha256) {
    errors.push({ code: 'catalog_self_hash_mismatch', expected: catalog.sha256 ?? null, actual });
  }
  const records = new Map();
  for (const record of catalog.records) {
    if (!record || typeof record.id !== 'string' || !record.id) {
      errors.push({ code: 'catalog_record_invalid' });
      continue;
    }
    if (records.has(record.id)) errors.push({ code: 'catalog_duplicate_record', candidate_id: record.id });
    else records.set(record.id, record);
  }
  return records;
}

function validateDecisions(packet, records, errors) {
  const rows = Array.isArray(packet.decisions) ? packet.decisions : [];
  if (!Array.isArray(packet.decisions)) errors.push({ code: 'decisions_not_array' });
  const seen = new Set();
  for (const row of rows) {
    const id = row?.candidate_id;
    if (typeof id !== 'string' || !id) {
      errors.push({ code: 'decision_candidate_missing' });
      continue;
    }
    if (seen.has(id)) errors.push({ code: 'duplicate_decision', candidate_id: id });
    seen.add(id);
    const record = records?.get(id);
    if (!record) errors.push({ code: 'unknown_decision', candidate_id: id });
    if (!DECISIONS.has(row.decision)) {
      errors.push({ code: row.decision === 'pending' ? 'pending_decision' : 'unknown_decision_value', candidate_id: id, value: row.decision ?? null });
    }
    if (['hold', 'reject'].includes(row.decision) && (typeof row.note !== 'string' || row.note.trim() === '')) {
      errors.push({ code: 'decision_note_required', candidate_id: id, decision: row.decision });
    }
  }
  if (records) {
    for (const record of records.values()) {
      if (!seen.has(record.id)) {
        errors.push({ code: 'missing_decision', candidate_id: record.id });
      }
    }
  }
}

function validateReceipt(receipt, binding, receiptPath, repoRoot, feedbackSha256, errors) {
  const label = binding.path;
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    errors.push({ code: 'receipt_invalid', path: label });
    return { pending: false };
  }
  if (receipt.schema_version !== 1) errors.push({ code: 'receipt_schema_invalid', path: label, value: receipt.schema_version ?? null });
  if (receipt.status === 'FAIL') errors.push({ code: 'receipt_failed', path: label });
  else if (!RECEIPT_STATUSES.has(receipt.status)) errors.push({ code: 'receipt_status_invalid', path: label, value: receipt.status ?? null });

  const nodes = Array.isArray(receipt.nodes) ? receipt.nodes : [];
  if (!Array.isArray(receipt.nodes)) errors.push({ code: 'receipt_nodes_invalid', path: label });
  let checkpointPending = false;
  let checkpointCount = 0;
  const receiptDir = dirname(receiptPath);
  for (const node of nodes) {
    if (node?.type === 'emit_artifact' && (!Array.isArray(node.artifacts) || node.artifacts.length === 0)) {
      errors.push({ code: 'emitted_artifact_missing', path: label, node_id: node?.id ?? null });
    }
    if (node?.artifacts !== undefined && !Array.isArray(node.artifacts)) {
      errors.push({ code: 'artifacts_not_array', path: label, node_id: node?.id ?? null });
    }
    for (const artifact of Array.isArray(node?.artifacts) ? node.artifacts : []) {
      const result = bindingError(artifact, receiptDir, repoRoot);
      if (result.code) errors.push({ ...result, code: `artifact_${result.code}`, receipt: label, node_id: node?.id ?? null });
    }
    if (node?.status === 'FAIL') errors.push({ code: 'receipt_node_failed', path: label, node_id: node?.id ?? null });
    if (node?.type !== 'curation_checkpoint') continue;
    checkpointCount += 1;
    if (node.status === 'PENDING') checkpointPending = true;
    else if (node.status === 'FAIL' || node.status === 'REJECTED') {
      errors.push({ code: 'curation_checkpoint_rejected', path: label, node_id: node?.id ?? null, value: node.status });
    } else if (!CHECKPOINT_STATUSES.has(node.status)) {
      errors.push({ code: 'curation_checkpoint_status_invalid', path: label, node_id: node?.id ?? null, value: node.status ?? null });
    } else if (!isSha256(node.metrics?.feedback_sha256) || node.metrics.feedback_sha256 !== feedbackSha256 || typeof node.metrics?.reviewer !== 'string' || node.metrics.reviewer.trim() === '') {
      errors.push({ code: 'curation_checkpoint_feedback_unbound', path: label, node_id: node?.id ?? null });
    }
  }
  if (checkpointCount === 0) errors.push({ code: 'curation_checkpoint_required', path: label });
  return { pending: receipt.status === 'PENDING' || checkpointPending, checkpointCount };
}

/**
 * Verify a Gate 4 curation packet against the repository catalog and graph receipts.
 * The packet's gateway4 and visual_approval claims are intentionally ignored.
 */
export function verifyPortraitCuration(packet, options = {}) {
  const requestedRoot = resolve(options.repoRoot ?? process.cwd());
  const errors = [];
  let repoRoot;
  try { repoRoot = realpathSync(requestedRoot); } catch {
    return { status: 'FAIL', ok: false, errors: [{ code: 'repo_root_unreadable', path: requestedRoot }], receipts: [] };
  }
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
    return { status: 'FAIL', ok: false, errors: [{ code: 'packet_not_object' }], receipts: [] };
  }
  if (packet.schema !== CURATION_SCHEMA) errors.push({ code: 'packet_schema_invalid', value: packet.schema ?? null });
  if (packet.catalog?.path !== CATALOG_PATH) {
    errors.push({ code: 'catalog_path_mismatch', expected: CATALOG_PATH, value: packet.catalog?.path ?? null });
  }

  const catalogFile = confinedFile(repoRoot, CATALOG_PATH, { repoRoot });
  let catalog = null;
  let records = null;
  if (catalogFile.error) errors.push({ code: `catalog_${catalogFile.error}`, path: CATALOG_PATH });
  else {
    try { catalog = JSON.parse(catalogFile.bytes.toString('utf8')); }
    catch { errors.push({ code: 'catalog_unparsable', path: CATALOG_PATH }); }
    if (catalog) {
      records = validateCatalog(catalog, errors);
      if (!isSha256(packet.catalog?.sha256) || packet.catalog.sha256 !== catalog.sha256) {
        errors.push({ code: 'stale_catalog', expected: catalog.sha256 ?? null, value: packet.catalog?.sha256 ?? null });
      }
    }
  }

  validateDecisions(packet, records, errors);

  const expectedFeedbackSha = digest(Buffer.from(stable({
    catalog_sha256: packet.catalog?.sha256 ?? null,
    decisions: Array.isArray(packet.decisions) ? packet.decisions : [],
  })));
  if (!isSha256(packet.feedback_sha256) || packet.feedback_sha256 !== expectedFeedbackSha) {
    errors.push({ code: 'feedback_sha_mismatch', expected: expectedFeedbackSha, value: packet.feedback_sha256 ?? null });
  }

  const receiptBindings = Array.isArray(packet.validation_receipts) ? packet.validation_receipts : [];
  if (!Array.isArray(packet.validation_receipts)) errors.push({ code: 'validation_receipts_not_array' });
  if (receiptBindings.length === 0) errors.push({ code: 'validation_receipt_required' });
  const receiptPaths = new Set();
  const receipts = [];
  let pending = false;
  for (const binding of receiptBindings) {
    if (typeof binding?.path === 'string' && receiptPaths.has(binding.path)) {
      errors.push({ code: 'duplicate_validation_receipt', path: binding.path });
      continue;
    }
    if (typeof binding?.path === 'string') receiptPaths.add(binding.path);
    const bound = bindingError(binding, repoRoot, repoRoot);
    if (bound.code) {
      errors.push({ ...bound, code: `receipt_${bound.code}` });
      continue;
    }
    let receipt;
    try { receipt = JSON.parse(bound.file.bytes.toString('utf8')); }
    catch {
      errors.push({ code: 'receipt_unparsable', path: binding.path });
      continue;
    }
    const result = validateReceipt(receipt, binding, bound.file.path, repoRoot, expectedFeedbackSha, errors);
    pending ||= result.pending;
    receipts.push({ path: binding.path, status: receipt.status ?? null, pending: result.pending });
  }

  const status = errors.length > 0 ? 'FAIL' : pending ? 'PENDING' : 'PASS';
  return { status, ok: status === 'PASS', errors, receipts };
}

export function verifyPortraitCurationFile(packetPath, options = {}) {
  const full = resolve(packetPath);
  const packet = JSON.parse(readFileSync(full, 'utf8'));
  return { packet: full, ...verifyPortraitCuration(packet, options) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const value = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
  try {
    const packetPath = value('--packet');
    if (!packetPath) throw new Error('usage: --packet <path> [--repo-root <path>]');
    const report = verifyPortraitCurationFile(packetPath, { repoRoot: resolve(value('--repo-root') ?? process.cwd()) });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.status !== 'PASS') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
    process.exitCode = 1;
  }
}
