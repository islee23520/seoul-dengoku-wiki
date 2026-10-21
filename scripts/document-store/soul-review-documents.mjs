import { createHash } from 'node:crypto';
import { closeSync, openSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// Internal read-only snapshot of the Soul-Duplicate-Review document.
// Initialization seals caller-supplied bytes; readers query named typed rows only.
// The archive is immutable evidence, never a runtime reconstruction authority.
export const INTERNAL_REVIEW_CAPABILITY = Symbol('internal soul-review documents');

// Fixed pins of the admitted source bytes and the ordered JSON document.
// Neither digest is derived from the working tree or from a database receipt.
export const SOUL_REVIEW_SOURCE_HASHES = Object.freeze({
  'lore/editorial/Soul-Duplicate-Review.json': '0cb0b702acf78f86bb0e1d662014e10f699aaa904dd6eb123f3d082da422abc0',
});
export const SOUL_REVIEW_DOCUMENT_HASHES = Object.freeze({
  'lore/editorial/Soul-Duplicate-Review.json': 'af514c495fd940d38def1a2ed8246a6a67f40c1586eb95b2da5ad4499579aac5',
});

const APPLICATION_ID = 0x57535256;
const SOURCE_PATHS = Object.freeze(Object.keys(SOUL_REVIEW_SOURCE_HASHES));
const ADMITTED_BYTE_LENGTH = 129188;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const quote = name => '"' + name + '"';
const table = domain => 'soul_review_documents_' + domain;
const scalar = type => type === 'text' || type === 'integer' || type === 'boolean';
const schemaSql = readFileSync(new URL('./soul-review-documents.sql', import.meta.url), 'utf8');

// Every admitted field is named. Array entries name their item domain.
// Optional fields stay absent until present. Counter evidence is a string or a
// string list. The two actual historicalComparison shapes are separate domains.
const definitions = {
  document: {
    schema: 'text',
    status: 'text',
    visibility: 'text',
    assignmentLedger: 'text',
    candidateLedger: 'text',
    reviewedOn: 'text',
    policy: 'text',
    coverage: 'coverage',
    method: ['text_item'],
    before: 'pool_metrics',
    after: 'pool_metrics',
    histogram: ['histogram_entry'],
    changes: ['change'],
    unusedCandidateReview: ['unused_review'],
    retainedDuplicates: ['retained_duplicate'],
    limits: ['text_item'],
    sourceFingerprints: ['fingerprint'],
    candidateLedgerSha256: 'text',
    highFrequencyReview: ['frequency_review'],
    judgmentBoundary: 'judgment',
    originalEvidence: 'original_evidence',
    baselineAssignments: ['baseline_assignment'],
    lockedAssignmentSnapshot: ['locked_assignment'],
    currentSourceComparison: 'source_comparison',
    verification: 'verification',
  },
  coverage: {
    people: 'integer',
    soulSlots: 'integer',
    candidates: 'integer',
    initiallyUnusedCandidates: 'integer',
    ownerConfirmedImmutable: 'integer',
    weakEvidenceAssignmentsRetained: 'integer',
    rangeReviews: ['range_review'],
  },
  range_review: {
    range: 'text',
    people: 'integer',
    status: 'text',
    sourceQuotes: 'integer',
    recommendedReplacements: 'integer',
    weakEvidenceRows: 'integer',
    sourceQuoteVerification: 'text',
  },
  pool_metrics: {
    candidatePool: 'integer',
    usedCandidates: 'integer',
    unusedCandidates: 'integer',
    soulSlots: 'integer',
    repeatedSlotsBeyondFirst: 'integer',
    sameCandidatePairs: 'integer',
    maximumFrequency: 'integer',
  },
  histogram_entry: { candidateId: 'text', before: 'integer', after: 'integer' },
  change: {
    personId: 'text',
    name: 'text',
    statusBefore: 'text',
    statusAfter: 'text',
    beforeSouls: ['soul'],
    afterSouls: ['soul'],
    evidence: ['evidence'],
    whyEqualOrBetter: 'text',
    counterEvidence: 'counter',
    candidateComparison: 'candidate_comparison',
    decision: 'text',
  },
  soul: { id: 'text', name: 'text', period: 'text', sourceKind: 'text', interpretation: 'text' },
  evidence: { path: 'text', anchor: 'text', quote: 'text' },
  candidate_comparison: {
    id: 'text',
    name: 'text',
    period: 'text',
    sourceKind: 'text',
    lockedExisting: 'boolean',
    researchStatus: 'text',
    sources: ['source_record'],
    careerSummary: 'text',
    narrativeFit: 'text',
    roleTags: ['text_item'],
    limitations: ['text_item'],
  },
  source_record: { url: 'text', sourceType: 'text', accessMethod: 'text', accessedOn: 'text' },
  unused_review: {
    group: 'text',
    candidateIds: ['text_item'],
    decision: 'text',
    reason: 'text',
    comparedPersonIds: ['text_item'],
  },
  retained_duplicate: {
    candidateId: 'text',
    before: 'integer',
    weakRows: ['text_item'],
    specificRows: ['text_item'],
    reason: 'text',
    after: 'integer',
  },
  fingerprint: { path: 'text', contentHash: 'text', hashEncoding: 'text' },
  frequency_review: {
    candidateId: 'text',
    before: 'integer',
    after: 'integer',
    weakEvidenceRows: 'integer',
    reason: 'text',
  },
  judgment: {
    independentRangeReview: 'text',
    finalEditorialDecision: 'text',
    notConsensusApproval: 'boolean',
    reasonForNotRequiringWholeBiography: 'text',
  },
  original_evidence: {
    assignmentLedgerSha256: 'text',
    verifiedQuotes: 'integer',
    verification: 'text',
    concurrentSourceEdits: 'text',
    changedSourceNodes: ['changed_node'],
  },
  changed_node: { personId: 'text', path: 'text', anchor: 'text', originalKoreanText: 'text', quote: 'text' },
  baseline_assignment: {
    personId: 'text',
    name: 'text',
    status: 'text',
    souls: ['soul'],
    evidence: ['evidence'],
    narrativeRationale: 'text',
    counterEvidence: 'counter',
    evidenceStrength: 'text',
    duplicateRationale: 'text',
    historicalComparison: 'union:ledger_comparison|path_comparison',
    historicalSources: ['source_record'],
  },
  ledger_comparison: {
    candidateLedger: 'text',
    sources: ['source_record'],
    careerSummary: 'text',
    interpretationOnly: 'boolean',
    primarySourcesVerified: 'boolean',
    limitations: ['text_item'],
  },
  path_comparison: {
    path: 'text',
    candidateId: 'text',
    careerSummary: 'text',
    interpretiveScope: 'text',
    sources: ['source_record'],
    limitations: ['text_item'],
  },
  locked_assignment: {
    personId: 'text',
    name: 'text',
    souls: ['soul'],
    approvalRef: 'text',
    status: 'text',
    assignmentSha256: 'text',
  },
  source_comparison: {
    checkedOn: 'text',
    changedQuoteCount: 'integer',
    changes: ['text_item'],
    meaning: 'text',
  },
  verification: {
    structuralAudit: 'structural_audit',
    baselineAllEvidenceQuotes: 'quote_audit',
    weakEvidenceAssignmentsUnchanged: 'integer',
    approvalStatusUnchanged: 'boolean',
    assignmentDiagnostics: 'text',
    assignmentDiffCheckExitCode: 'integer',
    completeValidator: 'validator_run',
  },
  structural_audit: {
    passed: 'boolean',
    identities: 'integer',
    candidateSlots: 'integer',
    immutableLocks: 'integer',
    untouchedAssignments: 'integer',
    changedOriginalQuotes: 'integer',
    histogramMatches: 'boolean',
  },
  quote_audit: { count: 'integer', failures: 'integer' },
  validator_run: { command: 'text', exitCode: 'integer', output: 'text' },
  text_item: 'text',
};

const required = {
  document: ['schema', 'status', 'visibility', 'assignmentLedger', 'candidateLedger', 'reviewedOn', 'policy', 'coverage', 'method', 'before', 'after', 'histogram', 'changes', 'unusedCandidateReview', 'retainedDuplicates', 'limits', 'sourceFingerprints', 'candidateLedgerSha256', 'highFrequencyReview', 'judgmentBoundary', 'originalEvidence', 'baselineAssignments', 'lockedAssignmentSnapshot', 'currentSourceComparison', 'verification'],
  coverage: ['people', 'soulSlots', 'candidates', 'initiallyUnusedCandidates', 'ownerConfirmedImmutable', 'weakEvidenceAssignmentsRetained', 'rangeReviews'],
  range_review: ['range', 'people', 'status', 'recommendedReplacements'],
  pool_metrics: ['candidatePool', 'usedCandidates', 'unusedCandidates', 'soulSlots', 'repeatedSlotsBeyondFirst', 'sameCandidatePairs', 'maximumFrequency'],
  histogram_entry: ['candidateId', 'before', 'after'],
  change: ['personId', 'name', 'statusBefore', 'statusAfter', 'beforeSouls', 'afterSouls', 'evidence', 'whyEqualOrBetter', 'counterEvidence', 'candidateComparison', 'decision'],
  soul: ['id', 'name', 'period', 'sourceKind'],
  evidence: ['path', 'anchor', 'quote'],
  candidate_comparison: ['id', 'name', 'period', 'sourceKind', 'lockedExisting', 'researchStatus', 'sources', 'careerSummary', 'narrativeFit', 'roleTags', 'limitations'],
  source_record: ['url', 'sourceType', 'accessMethod', 'accessedOn'],
  unused_review: ['group', 'candidateIds', 'decision', 'reason', 'comparedPersonIds'],
  retained_duplicate: ['candidateId', 'before', 'weakRows', 'specificRows', 'reason', 'after'],
  fingerprint: ['path', 'contentHash', 'hashEncoding'],
  frequency_review: ['candidateId', 'before', 'after', 'weakEvidenceRows', 'reason'],
  judgment: ['independentRangeReview', 'finalEditorialDecision', 'notConsensusApproval', 'reasonForNotRequiringWholeBiography'],
  original_evidence: ['assignmentLedgerSha256', 'verifiedQuotes', 'verification', 'concurrentSourceEdits', 'changedSourceNodes'],
  changed_node: ['personId', 'path', 'anchor', 'originalKoreanText', 'quote'],
  baseline_assignment: ['personId', 'name', 'status', 'souls', 'evidence', 'narrativeRationale', 'counterEvidence', 'evidenceStrength', 'duplicateRationale'],
  ledger_comparison: ['candidateLedger', 'sources', 'careerSummary', 'interpretationOnly', 'primarySourcesVerified', 'limitations'],
  path_comparison: ['path', 'candidateId', 'careerSummary', 'interpretiveScope', 'sources', 'limitations'],
  locked_assignment: ['personId', 'name', 'souls', 'approvalRef', 'status', 'assignmentSha256'],
  source_comparison: ['checkedOn', 'changedQuoteCount', 'changes', 'meaning'],
  verification: ['structuralAudit', 'baselineAllEvidenceQuotes', 'weakEvidenceAssignmentsUnchanged', 'approvalStatusUnchanged', 'assignmentDiagnostics', 'assignmentDiffCheckExitCode', 'completeValidator'],
  structural_audit: ['passed', 'identities', 'candidateSlots', 'immutableLocks', 'untouchedAssignments', 'changedOriginalQuotes', 'histogramMatches'],
  quote_audit: ['count', 'failures'],
  validator_run: ['command', 'exitCode', 'output'],
};

const admittedOrders = {
  range_review: [
    ['range', 'people', 'status', 'sourceQuotes', 'recommendedReplacements'],
    ['range', 'people', 'status', 'weakEvidenceRows', 'recommendedReplacements', 'sourceQuoteVerification'],
  ],
  baseline_assignment: [
    ['personId', 'name', 'status', 'souls', 'evidence', 'narrativeRationale', 'counterEvidence', 'evidenceStrength', 'duplicateRationale', 'historicalComparison'],
    ['personId', 'name', 'status', 'souls', 'evidence', 'narrativeRationale', 'historicalComparison', 'counterEvidence', 'evidenceStrength', 'duplicateRationale'],
    ['personId', 'name', 'status', 'souls', 'evidence', 'historicalSources', 'narrativeRationale', 'counterEvidence', 'evidenceStrength', 'duplicateRationale'],
  ],
};

function valueOk(type, value) {
  if (type === 'text') return typeof value === 'string';
  if (type === 'boolean') return typeof value === 'boolean';
  return Number.isSafeInteger(value);
}

function authorize({ capability, scope = 'internal' } = {}) {
  if (capability !== INTERNAL_REVIEW_CAPABILITY || scope !== 'internal') fail('E_PRIVATE');
}

function comparisonDomain(value) {
  if (Object.hasOwn(value, 'candidateLedger')) return 'ledger_comparison';
  if (Object.hasOwn(value, 'path')) return 'path_comparison';
  return null;
}

function writeDomain(db, domain, key, parent, ordinal, value) {
  const def = definitions[domain];
  if (typeof def === 'string') {
    if (typeof value !== 'string') fail('E_REVIEW_SHAPE');
    db.prepare('INSERT INTO ' + table(domain) + ' VALUES (?,?,?,?,?)').run(key, parent, ordinal, 'value', value);
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('E_REVIEW_SHAPE');
  const keys = Object.keys(value);
  if (keys.some(name => !Object.hasOwn(def, name))) fail('E_REVIEW_UNKNOWN_FIELD');
  const needed = required[domain] ?? [];
  if (needed.some(name => !Object.hasOwn(value, name))) fail('E_REVIEW_SHAPE');
  const orders = admittedOrders[domain];
  if (orders) {
    if (!orders.some(order => keys.join('|') === order.join('|'))) fail('E_REVIEW_SHAPE');
  } else {
    const admitted = [...needed, ...keys.filter(name => !needed.includes(name))];
    if (keys.join('|') !== admitted.join('|')) fail('E_REVIEW_SHAPE');
  }
  let unionDomain = null;
  for (const field of keys) {
    const type = def[field];
    const child = value[field];
    if (scalar(type) && !valueOk(type, child)) fail('E_REVIEW_SHAPE');
    if (type === 'counter' && typeof child !== 'string' && !(Array.isArray(child) && child.every(item => typeof item === 'string'))) fail('E_REVIEW_SHAPE');
    if (typeof type === 'string' && type.startsWith('union:')) {
      if (!child || typeof child !== 'object' || Array.isArray(child)) fail('E_REVIEW_SHAPE');
      unionDomain = comparisonDomain(child);
      if (!unionDomain) fail('E_REVIEW_SHAPE');
    }
  }
  const names = Object.entries(def).filter(([, type]) => scalar(type) || type === 'counter').map(([name]) => name);
  const columns = ['row_key', 'parent_key', 'ordinal', 'field_order', ...names];
  const stored = [key, parent, ordinal, keys.join('|'), ...names.map(name => {
    if (!Object.hasOwn(value, name) || Array.isArray(value[name])) return null;
    return def[name] === 'boolean' ? Number(value[name]) : value[name];
  })];
  if (domain === 'change' || domain === 'baseline_assignment') {
    columns.push('counter_kind');
    stored.push(Array.isArray(value.counterEvidence) ? 'array' : 'text');
  }
  db.prepare('INSERT INTO ' + table(domain) + ' (' + columns.map(quote).join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')').run(...stored);
  for (const field of keys) {
    const type = def[field];
    const child = value[field];
    const childKey = key + '/' + field;
    if (Array.isArray(type)) {
      if (!Array.isArray(child)) fail('E_REVIEW_SHAPE');
      child.forEach((item, index) => writeDomain(db, type[0], childKey + '/' + index, childKey, index, item));
    } else if (typeof type === 'string' && type.startsWith('union:')) {
      writeDomain(db, unionDomain, childKey, key, 0, child);
    } else if (type === 'counter' && Array.isArray(child)) {
      child.forEach((item, index) => writeDomain(db, 'text_item', childKey + '/' + index, childKey, index, item));
    } else if (!scalar(type) && type !== 'counter') writeDomain(db, type, childKey, childKey, 0, child);
  }
}

function readDocument(db, logicalPath, documentOrdinal) {
  const visited = new Map();
  function domainValue(domain, key, parent, ordinal) {
    const row = db.prepare('SELECT * FROM ' + table(domain) + ' WHERE row_key=?').get(key);
    if (!row || row.parent_key !== parent || row.ordinal !== ordinal) fail('E_REVIEW_INTEGRITY');
    const seen = visited.get(domain) ?? new Set();
    if (seen.has(key)) fail('E_REVIEW_INTEGRITY');
    seen.add(key);
    visited.set(domain, seen);
    const def = definitions[domain];
    if (typeof def === 'string') {
      if (row.field_order !== 'value' || typeof row.value !== 'string') fail('E_REVIEW_INTEGRITY');
      return row.value;
    }
    const result = {};
    const fields = row.field_order === '' ? [] : row.field_order.split('|');
    if (fields.some((field, index) => !field || !Object.hasOwn(def, field) || fields.indexOf(field) !== index)) fail('E_REVIEW_INTEGRITY');
    for (const field of fields) {
      const type = def[field];
      const childKey = key + '/' + field;
      if (Array.isArray(type)) result[field] = readList(type[0], childKey);
      else if (typeof type === 'string' && type.startsWith('union:')) result[field] = readUnion(childKey, key);
      else if (type === 'counter' && row.counter_kind === 'array') result[field] = readList('text_item', childKey);
      else if (scalar(type) || type === 'counter') result[field] = storedScalar(type, row[field]);
      else result[field] = domainValue(type, childKey, childKey, 0);
    }
    return result;
  }
  function storedScalar(type, stored) {
    if (type === 'boolean') {
      if (stored !== 0 && stored !== 1) fail('E_REVIEW_INTEGRITY');
      return Boolean(stored);
    }
    if ((type === 'text' || type === 'counter') && typeof stored !== 'string') fail('E_REVIEW_INTEGRITY');
    if (type === 'integer' && !Number.isSafeInteger(stored)) fail('E_REVIEW_INTEGRITY');
    return stored;
  }
  function readUnion(childKey, parentKey) {
    const ledger = db.prepare('SELECT row_key FROM ' + table('ledger_comparison') + ' WHERE row_key=?').get(childKey);
    const path = db.prepare('SELECT row_key FROM ' + table('path_comparison') + ' WHERE row_key=?').get(childKey);
    if (Boolean(ledger) === Boolean(path)) fail('E_REVIEW_INTEGRITY');
    return domainValue(ledger ? 'ledger_comparison' : 'path_comparison', childKey, parentKey, 0);
  }
  function readList(domain, parentKey) {
    const rows = db.prepare('SELECT row_key,ordinal FROM ' + table(domain) + ' WHERE parent_key=? ORDER BY ordinal').all(parentKey);
    return rows.map((row, index) => {
      if (row.ordinal !== index || row.row_key !== parentKey + '/' + index) fail('E_REVIEW_INTEGRITY');
      return domainValue(domain, row.row_key, parentKey, index);
    });
  }
  const document = domainValue('document', logicalPath, 'root', documentOrdinal);
  const like = logicalPath.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_') + '/%';
  for (const domain of Object.keys(definitions)) {
    const actual = db.prepare('SELECT count(*) AS n FROM ' + table(domain) + " WHERE row_key=? OR row_key LIKE ? ESCAPE '\\'").get(logicalPath, like).n;
    if (actual !== (visited.get(domain)?.size ?? 0)) fail('E_REVIEW_INTEGRITY');
  }
  return document;
}

function pinsMatch(expectedSourceHashes) {
  if (!expectedSourceHashes || typeof expectedSourceHashes !== 'object' || Array.isArray(expectedSourceHashes)) return false;
  const keys = Object.keys(expectedSourceHashes);
  return keys.length === SOURCE_PATHS.length
    && SOURCE_PATHS.every(path => expectedSourceHashes[path] === SOUL_REVIEW_SOURCE_HASHES[path])
    && keys.every(path => Object.hasOwn(SOUL_REVIEW_SOURCE_HASHES, path));
}

/** Explicit in-memory initialization of a new private file.
 * sources maps each exact logical path to its supplied bytes and the digest
 * the caller expects. No directory scan, path dereference, migration, update,
 * partial import, or public export is provided.
 */
export function initializeSoulReviewDocuments(absoluteNewPath, options = {}) {
  authorize(options);
  const { sources, actor, reason } = options;
  if (options.scope !== undefined && options.scope !== 'internal') fail('E_PRIVATE');
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('E_REVIEW_AUDIT');
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) fail('E_REVIEW_PINS');
  const supplied = Object.keys(sources);
  if (supplied.length !== SOURCE_PATHS.length || supplied.some(key => !SOURCE_PATHS.includes(key)) || SOURCE_PATHS.some(key => !Object.hasOwn(sources, key))) fail('E_REVIEW_PINS');
  const prepared = SOURCE_PATHS.map(logicalPath => {
    const input = sources[logicalPath];
    if (!input || typeof input !== 'object' || Array.isArray(input) || !(input.bytes instanceof Uint8Array)) fail('E_REVIEW_BYTES');
    const bytes = Buffer.from(input.bytes);
    const digest = sha(bytes);
    if (typeof input.expectedSourceHash !== 'string' || digest !== input.expectedSourceHash) fail('E_REVIEW_PINS');
    return { logicalPath, bytes, digest };
  });
  closeSync(openSync(absoluteNewPath, 'wx', 0o600));
  let db;
  try {
    db = new DatabaseSync(absoluteNewPath, { enableForeignKeyConstraints: true });
    db.exec('BEGIN IMMEDIATE');
    db.exec(schemaSql);
    db.exec('PRAGMA application_id=' + APPLICATION_ID + '; PRAGMA user_version=1');
    db.prepare('INSERT INTO soul_review_documents_import VALUES (1,?,?,?)').run(actor, reason, new Date().toISOString());
    prepared.forEach(({ logicalPath, bytes, digest }, ordinal) => {
      let document;
      try { document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
      catch { fail('E_REVIEW_SHAPE'); }
      if (document.schema !== 'seoul-soul-duplicate-review.v1' || document.visibility !== 'editorial-only' || document.status !== 'editorial-review-complete-with-unresolved-limits') fail('E_REVIEW_SHAPE');
      writeDomain(db, 'document', logicalPath, 'root', ordinal, document);
      const documentHash = sha(JSON.stringify(document));
      const readBack = readDocument(db, logicalPath, ordinal);
      if (documentHash !== SOUL_REVIEW_DOCUMENT_HASHES[logicalPath] || sha(JSON.stringify(readBack)) !== SOUL_REVIEW_DOCUMENT_HASHES[logicalPath] || JSON.stringify(readBack) !== JSON.stringify(document)) fail('E_REVIEW_INTEGRITY');
      if (digest !== SOUL_REVIEW_SOURCE_HASHES[logicalPath] || bytes.length !== ADMITTED_BYTE_LENGTH) fail('E_REVIEW_PINS');
      db.prepare('INSERT INTO soul_review_documents_source VALUES (?,?,?,?,?)').run(logicalPath, ordinal, bytes.length, digest, SOUL_REVIEW_DOCUMENT_HASHES[logicalPath]);
      db.prepare('INSERT INTO soul_review_documents_archive VALUES (?,?,?)').run(logicalPath, digest, bytes);
    });
    db.exec('COMMIT');
    db.close();
  } catch (error) {
    if (db?.isOpen) { if (db.isTransaction) db.exec('ROLLBACK'); db.close(); }
    unlinkSync(absoluteNewPath);
    throw error;
  }
}

/** Read-only reopen. expectedSourceHashes must repeat the fixed pin.
 * After this returns, document reconstruction uses SELECT on typed rows only.
 */
export function openSoulReviewDocuments(absolutePath, options = {}) {
  authorize(options);
  if (!pinsMatch(options.expectedSourceHashes)) fail('E_REVIEW_PINS');
  if ((statSync(absolutePath).mode & 0o777) !== 0o600) fail('E_PRIVATE_MODE');
  const db = new DatabaseSync(absolutePath, { readOnly: true, enableForeignKeyConstraints: true });
  try {
    if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID || db.prepare('PRAGMA user_version').get().user_version !== 1) fail('E_SCHEMA');
    const sources = db.prepare('SELECT * FROM soul_review_documents_source ORDER BY ordinal').all();
    if (sources.some(row => SOURCE_PATHS.includes(row.logical_path) && row.source_sha256 !== options.expectedSourceHashes[row.logical_path])) fail('E_REVIEW_PINS');
    db.exec('PRAGMA query_only=ON');
    if (Array.isArray(options.observeSql)) {
      const prepare = db.prepare.bind(db);
      db.prepare = sql => { options.observeSql.push(sql); return prepare(sql); };
    }
  } catch (error) {
    db.close();
    throw error;
  }
  function readDocuments() {
    db.exec('BEGIN');
    try {
      const sources = db.prepare('SELECT * FROM soul_review_documents_source ORDER BY ordinal').all();
      if (sources.length !== SOURCE_PATHS.length || sources.some((row, index) => row.ordinal !== index || row.logical_path !== SOURCE_PATHS[index] || row.byte_length !== ADMITTED_BYTE_LENGTH || row.source_sha256 !== SOUL_REVIEW_SOURCE_HASHES[row.logical_path] || row.document_sha256 !== SOUL_REVIEW_DOCUMENT_HASHES[row.logical_path])) fail('E_REVIEW_INTEGRITY');
      const documents = new Map();
      for (const source of sources) {
        const document = readDocument(db, source.logical_path, source.ordinal);
        const reconstructed = sha(JSON.stringify(document));
        if (reconstructed !== SOUL_REVIEW_DOCUMENT_HASHES[source.logical_path] || reconstructed !== source.document_sha256) fail('E_REVIEW_INTEGRITY');
        documents.set(source.logical_path, document);
      }
      if (documents.size !== SOURCE_PATHS.length) fail('E_REVIEW_INTEGRITY');
      db.exec('COMMIT');
      return documents;
    } catch (error) {
      if (db.isTransaction) db.exec('ROLLBACK');
      throw error;
    }
  }
  return Object.freeze({ close: () => db.close(), readDocuments });
}
