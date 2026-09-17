import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

export const GATE_REQUIREMENTS = Object.freeze({
  gate1: Object.freeze(['reconstruction']),
  gate2: Object.freeze(['part_ownership', 'hidden_surfaces', 'sex']),
  gate3: Object.freeze(['actual_combinations', 'browser_parity', 'visual_review']),
});

const GATES = Object.freeze(Object.keys(GATE_REQUIREMENTS));
const SHA256 = /^[0-9a-f]{64}$/;
const DECISIONS = new Set(['PASS', 'FAIL', 'PENDING']);
const SEEDED_SCOPE = Object.freeze({
  gate1_source: { gate: 'gate1', check: 'source_quality' },
  gate1_visible_ownership: { gate: 'gate1', check: 'visible_ownership' },
  legacy_pending: { gate: 'gate1', check: 'legacy_pending' },
});

function requireText(value, name) {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${name} is required`);
  return value;
}

function requireSha(value, name) {
  if (!SHA256.test(value ?? '')) throw new Error(`${name} must be a lowercase SHA-256`);
  return value;
}

function normalizeDecision(value) {
  const normalized = value === 'REJECTED' ? 'FAIL' : value;
  if (!DECISIONS.has(normalized)) throw new Error(`unsupported gate decision: ${value}`);
  return normalized;
}

function gateAndCheck(gate, check) {
  if (!GATES.includes(gate)) throw new Error(`unsupported gate: ${gate}`);
  requireText(check, 'check');
}

async function verifiedRepoPath(repoRoot, path, label) {
  requireText(path, `${label} path`);
  if (isAbsolute(path) || path.includes('\\')) throw new Error(`${label} path must be repository-relative: ${path}`);
  const parts = path.split('/');
  if (parts.some(part => part === '' || part === '.' || part === '..')) throw new Error(`${label} path must not escape the repository: ${path}`);
  const root = await realpath(repoRoot);
  let current = root;
  try {
    for (const part of parts) {
      current = resolve(current, part);
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new Error(`symbolic links are not allowed: ${path}`);
    }
  } catch (error) {
    throw new Error(`${label} path is not a regular repository file at ${path}: ${error.message}`);
  }
  const info = await lstat(current);
  if (!info.isFile()) throw new Error(`${label} path is not a regular repository file: ${path}`);
  return current;
}

async function verifiedDigest(repoRoot, path, expected, label) {
  requireSha(expected, `${label} SHA`);
  const absolutePath = await verifiedRepoPath(repoRoot, path, label);
  const bytes = await readFile(absolutePath);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error(`${label} SHA mismatch for ${path}: expected ${expected}, got ${actual}`);
  return bytes;
}

function verifyCatalogBinding(db, path, sha256, label) {
  const row = db.prepare('SELECT sha256 FROM asset_paths WHERE path = ?').get(path);
  if (!row) throw new Error(`${label} path is not registered in asset_paths: ${path}`);
  if (row.sha256 !== sha256) throw new Error(`${label} SHA does not match current asset_paths binding for ${path}`);
}

export function installGateEvaluationSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gate_evaluation_claims (
      id INTEGER PRIMARY KEY,
      subject_path TEXT NOT NULL,
      subject_sha256 TEXT NOT NULL REFERENCES content_objects(sha256),
      source_path TEXT NOT NULL,
      source_sha256 TEXT NOT NULL REFERENCES content_objects(sha256),
      receipt_path TEXT NOT NULL,
      receipt_sha256 TEXT NOT NULL REFERENCES content_objects(sha256),
      sex TEXT NOT NULL CHECK(sex IN ('female','male')),
      slot TEXT NOT NULL,
      gate TEXT NOT NULL CHECK(gate IN ('gate1','gate2','gate3')),
      check_name TEXT NOT NULL,
      decision TEXT NOT NULL CHECK(decision IN ('PASS','FAIL','PENDING')),
      scope TEXT NOT NULL,
      authority TEXT NOT NULL,
      summary TEXT NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(subject_path, subject_sha256, source_path, source_sha256, receipt_path, receipt_sha256, sex, slot, gate, check_name, decision, scope, authority)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS gate_claims_audit_scope
      ON gate_evaluation_claims(sex, slot, source_path, source_sha256, gate, check_name);
    CREATE INDEX IF NOT EXISTS gate_claims_subject
      ON gate_evaluation_claims(subject_path, subject_sha256);
    CREATE INDEX IF NOT EXISTS gate_claims_receipt
      ON gate_evaluation_claims(receipt_path, receipt_sha256);
  `);
  return db;
}

export async function registerGateEvaluation({
  db, repoRoot, subjectPath, subjectSha256, sourcePath, sourceSha256,
  receiptPath, receiptSha256, sex, slot, gate, check, decision,
  scope, authority = 'unknown', summary = '',
}) {
  installGateEvaluationSchema(db);
  gateAndCheck(gate, check);
  if (!['female', 'male'].includes(sex)) throw new Error(`unsupported sex: ${sex}`);
  requireText(slot, 'slot');
  requireText(scope, 'scope');
  requireText(authority, 'authority');
  const normalizedDecision = normalizeDecision(decision);

  await verifiedDigest(repoRoot, subjectPath, subjectSha256, 'subject');
  await verifiedDigest(repoRoot, sourcePath, sourceSha256, 'source');
  await verifiedDigest(repoRoot, receiptPath, receiptSha256, 'receipt');
  verifyCatalogBinding(db, subjectPath, subjectSha256, 'subject');
  verifyCatalogBinding(db, sourcePath, sourceSha256, 'source');
  verifyCatalogBinding(db, receiptPath, receiptSha256, 'receipt');

  const result = db.prepare(`INSERT OR IGNORE INTO gate_evaluation_claims(
    subject_path,subject_sha256,source_path,source_sha256,receipt_path,receipt_sha256,
    sex,slot,gate,check_name,decision,scope,authority,summary
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    subjectPath, subjectSha256, sourcePath, sourceSha256, receiptPath, receiptSha256,
    sex, slot, gate, check, normalizedDecision, scope, authority, String(summary),
  );
  return { id: Number(result.lastInsertRowid), inserted: result.changes === 1 };
}

function inferredSex(path) {
  const value = path.toLowerCase();
  if (/(?:^|[\/_-])female(?:[\/_-]|$)/.test(value)) return 'female';
  if (/(?:^|[\/_-])male(?:[\/_-]|$)/.test(value)) return 'male';
  return null;
}

function assetMetadata(db, decision) {
  const row = db.prepare('SELECT sex,slot FROM asset_paths WHERE path = ? AND sha256 = ?').get(decision.path, decision.sha256);
  if (!row) throw new Error(`configured asset is not bound to current path/SHA: ${decision.path}`);
  return {
    sex: row.sex ?? inferredSex(decision.path),
    slot: row.slot ?? decision.properties?.role ?? 'source',
  };
}

export async function seedGateEvaluationsFromConfig({ db, repoRoot, configPath = 'Design/potrait-generator/config/asset-decisions.json' }) {
  installGateEvaluationSchema(db);
  const absoluteConfig = await verifiedRepoPath(repoRoot, configPath, 'config');
  const config = JSON.parse(await readFile(absoluteConfig, 'utf8'));
  const decisions = config.decisions ?? [];
  const metadata = decisions.map(decision => ({ decision, ...assetMetadata(db, decision) }));
  const sources = new Map(metadata
    .filter(item => item.decision.properties?.gate_scope === 'gate1_source' && item.sex)
    .map(item => [item.sex, item.decision]));
  let registered = 0;
  let inserted = 0;

  for (const item of metadata) {
    const scope = item.decision.properties?.gate_scope;
    const mapping = SEEDED_SCOPE[scope];
    if (!mapping || !item.sex) continue;
    const source = sources.get(item.sex) ?? item.decision;
    const receipt = db.prepare('SELECT sha256 FROM asset_paths WHERE path = ?').get(item.decision.receipt);
    if (!receipt) throw new Error(`configured receipt is not registered: ${item.decision.receipt}`);
    const result = await registerGateEvaluation({
      db, repoRoot,
      subjectPath: item.decision.path, subjectSha256: item.decision.sha256,
      sourcePath: source.path, sourceSha256: source.sha256,
      receiptPath: item.decision.receipt, receiptSha256: receipt.sha256,
      sex: item.sex, slot: String(item.slot), gate: mapping.gate, check: mapping.check,
      decision: item.decision.decision, scope, authority: item.decision.authority ?? 'curator',
      summary: item.decision.summary ?? item.decision.raw_status ?? item.decision.decision,
    });
    registered += 1;
    if (result.inserted) inserted += 1;
  }
  return { registered, inserted };
}

function blocker(code, check, detail) {
  return { code, check, detail };
}

function intrinsicGateStatus(gate, activeClaims, staleSubjectClaims, staleReceiptClaims) {
  const blockers = [];
  for (const check of GATE_REQUIREMENTS[gate]) {
    const claims = activeClaims.filter(claim => claim.gate === gate && claim.check_name === check);
    const decisions = new Set(claims.map(claim => claim.decision));
    if (decisions.has('FAIL') && decisions.has('PASS')) blockers.push(blocker('CONFLICTING_CLAIMS', check, 'PASS and FAIL are both recorded for the current binding'));
    else if (decisions.has('FAIL')) blockers.push(blocker('FAILED_CHECK', check, 'a current FAIL claim exists'));
    else if (decisions.has('PENDING')) blockers.push(blocker('PENDING_CHECK', check, 'a current PENDING claim exists'));
    else if (!decisions.has('PASS')) {
      const staleReceipt = staleReceiptClaims.some(claim => claim.gate === gate && claim.check_name === check);
      const staleSubject = staleSubjectClaims.some(claim => claim.gate === gate && claim.check_name === check);
      const code = staleReceipt ? 'STALE_RECEIPT_HASH' : staleSubject ? 'STALE_SUBJECT_HASH' : 'MISSING_CHECK';
      const detail = staleReceipt ? 'evidence receipt bytes are changed or no longer present at the receipt path'
        : staleSubject ? 'evidence is bound to bytes no longer current at the subject path' : 'no current PASS claim exists';
      blockers.push(blocker(code, check, detail));
    }
  }
  if (blockers.some(item => ['CONFLICTING_CLAIMS', 'FAILED_CHECK'].includes(item.code))) return { status: 'FAIL', blockers };
  if (blockers.some(item => item.code === 'PENDING_CHECK')) return { status: 'PENDING', blockers };
  if (blockers.length) return { status: 'NOT_VERIFIED', blockers };
  return { status: 'PASS', blockers };
}

function claimRows(db, { sex, slot, sourcePath }) {
  const clauses = ['sex = ?', 'slot = ?', 'source_path = ?'];
  const args = [sex, slot, sourcePath];
  return db.prepare(`SELECT * FROM gate_evaluation_claims WHERE ${clauses.join(' AND ')} ORDER BY id`).all(...args);
}

export function getGateStatus({ db, sex, slot, sourcePath }) {
  installGateEvaluationSchema(db);
  if (!['female', 'male'].includes(sex)) throw new Error(`unsupported sex: ${sex}`);
  requireText(slot, 'slot'); requireText(sourcePath, 'sourcePath');
  const history = claimRows(db, { sex, slot, sourcePath });
  const currentSource = db.prepare('SELECT sha256 FROM asset_paths WHERE path = ?').get(sourcePath)?.sha256 ?? null;
  const currentBindings = new Map(db.prepare('SELECT path,sha256 FROM asset_paths').all().map(row => [row.path, row.sha256]));
  const sourceClaims = history.filter(claim => claim.source_sha256 === currentSource);
  const subjectClaims = sourceClaims.filter(claim => currentBindings.get(claim.subject_path) === claim.subject_sha256);
  const activeClaims = subjectClaims.filter(claim => currentBindings.get(claim.receipt_path) === claim.receipt_sha256);
  const staleSubjectClaims = sourceClaims.filter(claim => currentBindings.get(claim.subject_path) !== claim.subject_sha256);
  const staleReceiptClaims = subjectClaims.filter(claim => currentBindings.get(claim.receipt_path) !== claim.receipt_sha256);
  const staleSource = history.length > 0 && sourceClaims.length === 0;
  const gates = {};
  let predecessorPassed = true;

  for (const gate of GATES) {
    const intrinsic = intrinsicGateStatus(gate, activeClaims, staleSubjectClaims, staleReceiptClaims);
    if (staleSource) intrinsic.blockers.unshift(blocker('STALE_SOURCE_HASH', null, 'all evidence is bound to a previous source hash'));
    if (staleSource && intrinsic.status === 'PASS') intrinsic.status = 'NOT_VERIFIED';
    let status = intrinsic.status;
    const blockers = [...intrinsic.blockers];
    if (intrinsic.status === 'PASS' && !predecessorPassed) {
      status = 'BLOCKED';
      blockers.push(blocker('PREREQUISITE_NOT_PASS', GATES[GATES.indexOf(gate) - 1], 'the preceding gate must PASS first'));
    }
    gates[gate] = {
      status,
      intrinsic_status: intrinsic.status,
      required_checks: [...GATE_REQUIREMENTS[gate]],
      evidence: activeClaims.filter(claim => claim.gate === gate),
      blockers,
    };
    predecessorPassed = predecessorPassed && status === 'PASS';
  }

  return {
    sex, slot,
    source: { path: sourcePath, sha256: currentSource },
    eligible: GATES.every(gate => gates[gate].status === 'PASS'),
    gates,
    history,
  };
}

export function getGateAuditReport({ db, sex = null, slot = null, sourcePath = null } = {}) {
  installGateEvaluationSchema(db);
  const clauses = []; const args = [];
  if (sex) { clauses.push('sex = ?'); args.push(sex); }
  if (slot) { clauses.push('slot = ?'); args.push(slot); }
  if (sourcePath) { clauses.push('source_path = ?'); args.push(sourcePath); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const scopes = db.prepare(`SELECT DISTINCT sex,slot,source_path FROM gate_evaluation_claims ${where} ORDER BY sex,slot,source_path`).all(...args);
  return {
    generated_at: new Date().toISOString(),
    entries: scopes.map(scope => getGateStatus({ db, sex: scope.sex, slot: scope.slot, sourcePath: scope.source_path })),
  };
}
