import { createHash } from 'node:crypto';
import { closeSync, openSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// Private typed snapshot of the editorial soul-candidate ledger.
// Initialization records supplied bytes; it does not approve, publish, or reinterpret them.
export const INTERNAL_CANDIDATES_CAPABILITY = Symbol('internal Soul-Candidates');
export const SOUL_CANDIDATE_SOURCE_HASHES = Object.freeze({
  'lore/editorial/Soul-Candidates.json': '869ebc95f088f46fedf7db88a3f52b387b2883be3364cdd9b354b15eac6949d8',
});
const DOCUMENT_HASHES = Object.freeze({
  'lore/editorial/Soul-Candidates.json': '930210e8b4e1caabbff8d4d0dbd2c4ae21200dc01c660793e6fbb1ad6e292f93',
});
const APPLICATION_ID = 0x57534344;
const PATHS = Object.freeze(Object.keys(SOUL_CANDIDATE_SOURCE_HASHES));
const schema = readFileSync(new URL('./soul-candidate-documents.sql', import.meta.url), 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const quote = name => '"' + name + '"';

const DOCUMENT_KEYS = ['schema', 'status', 'visibility', 'candidatePeriods', 'interpretationPolicy', 'assignmentPolicy', 'research', 'candidates'];
const RESEARCH_KEYS = ['accessedOn', 'coverageByPeriod', 'totalCandidates', 'primarySourcesVerified', 'limitations'];
const COVERAGE_KEYS = ['japanese-sengoku', 'meiji-restoration', 'chinese-warlord-era', 'chinese-three-kingdoms', 'korean-three-kingdoms', 'korean-later-three-kingdoms', 'korean-war', 'world-war-ii'];
const CANDIDATE_KEYS = ['id', 'name', 'period', 'sourceKind', 'lockedExisting', 'researchStatus', 'sources', 'careerSummary', 'narrativeFit', 'roleTags', 'limitations'];
const CANDIDATE_KEYS_RELATED = ['id', 'name', 'period', 'sourceKind', 'lockedExisting', 'relatedPeriods', 'researchStatus', 'sources', 'careerSummary', 'narrativeFit', 'roleTags', 'limitations'];
const SOURCE_KEYS = ['url', 'sourceType', 'accessMethod', 'accessedOn'];

const sameKeys = (value, keys) => JSON.stringify(Object.keys(value)) === JSON.stringify(keys);
const text = value => typeof value === 'string';
const integer = value => Number.isSafeInteger(value);

function authorize({ capability, scope = 'internal' } = {}) {
  if (capability !== INTERNAL_CANDIDATES_CAPABILITY || scope !== 'internal') fail('E_PRIVATE');
}

function exactPins(expectedSourceHashes) {
  if (!expectedSourceHashes || typeof expectedSourceHashes !== 'object' || Array.isArray(expectedSourceHashes)) fail('E_CANDIDATE_PINS');
  const keys = Object.keys(expectedSourceHashes);
  if (keys.length !== PATHS.length || PATHS.some(path => !Object.hasOwn(expectedSourceHashes, path) || expectedSourceHashes[path] !== SOUL_CANDIDATE_SOURCE_HASHES[path])) fail('E_CANDIDATE_PINS');
}

function sourceSet(sources) {
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) fail('E_CANDIDATE_PINS');
  const keys = Object.keys(sources);
  if (keys.length !== PATHS.length || PATHS.some(path => !Object.hasOwn(sources, path))) fail('E_CANDIDATE_PINS');
}

function inspectDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document) || !sameKeys(document, DOCUMENT_KEYS)) fail('E_CANDIDATE_SHAPE');
  if (![document.schema, document.status, document.visibility, document.interpretationPolicy, document.assignmentPolicy].every(text)) fail('E_CANDIDATE_SHAPE');
  if (document.schema !== 'seoul-soul-candidates.v1' || document.visibility !== 'editorial-only') fail('E_CANDIDATE_SHAPE');
  if (!Array.isArray(document.candidatePeriods) || document.candidatePeriods.some(value => !text(value))) fail('E_CANDIDATE_SHAPE');
  if (!Array.isArray(document.candidates)) fail('E_CANDIDATE_SHAPE');
  const research = document.research;
  if (!research || typeof research !== 'object' || Array.isArray(research) || !sameKeys(research, RESEARCH_KEYS)) fail('E_CANDIDATE_SHAPE');
  if (!text(research.accessedOn) || !integer(research.totalCandidates) || typeof research.primarySourcesVerified !== 'boolean') fail('E_CANDIDATE_SHAPE');
  const coverage = research.coverageByPeriod;
  if (!coverage || typeof coverage !== 'object' || Array.isArray(coverage) || !sameKeys(coverage, COVERAGE_KEYS)) fail('E_CANDIDATE_SHAPE');
  if (COVERAGE_KEYS.some(key => !integer(coverage[key]))) fail('E_CANDIDATE_SHAPE');
  if (!Array.isArray(research.limitations) || research.limitations.some(value => !text(value))) fail('E_CANDIDATE_SHAPE');
  const seen = new Set();
  for (const candidate of document.candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) fail('E_CANDIDATE_SHAPE');
    const keys = Object.keys(candidate);
    const related = keys.includes('relatedPeriods');
    if (keys.some(key => !CANDIDATE_KEYS_RELATED.includes(key))) fail('E_CANDIDATE_UNKNOWN_FIELD');
    if (!(related ? sameKeys(candidate, CANDIDATE_KEYS_RELATED) : sameKeys(candidate, CANDIDATE_KEYS))) fail('E_CANDIDATE_SHAPE');
    if (![candidate.id, candidate.name, candidate.period, candidate.sourceKind, candidate.researchStatus, candidate.careerSummary, candidate.narrativeFit].every(text)) fail('E_CANDIDATE_SHAPE');
    if (typeof candidate.lockedExisting !== 'boolean' || seen.has(candidate.id)) fail('E_CANDIDATE_SHAPE');
    seen.add(candidate.id);
    if (!Array.isArray(candidate.sources) || !Array.isArray(candidate.roleTags) || !Array.isArray(candidate.limitations)) fail('E_CANDIDATE_SHAPE');
    if (related && (!Array.isArray(candidate.relatedPeriods) || candidate.relatedPeriods.some(value => !text(value)))) fail('E_CANDIDATE_SHAPE');
    for (const record of candidate.sources) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) fail('E_CANDIDATE_SHAPE');
      if (Object.keys(record).some(key => !SOURCE_KEYS.includes(key))) fail('E_CANDIDATE_UNKNOWN_FIELD');
      if (!sameKeys(record, SOURCE_KEYS) || !SOURCE_KEYS.every(key => text(record[key]))) fail('E_CANDIDATE_SHAPE');
    }
    if (candidate.roleTags.some(value => !text(value)) || candidate.limitations.some(value => !text(value))) fail('E_CANDIDATE_SHAPE');
  }
  if (document.candidates.length !== research.totalCandidates) fail('E_CANDIDATE_SHAPE');
}

function writeDocument(db, logicalPath, document) {
  inspectDocument(document);
  const research = document.research;
  const coverage = research.coverageByPeriod;
  db.prepare('INSERT INTO soul_candidate_documents_document (' + ['logical_path', 'field_order', 'schema', 'status', 'visibility', 'interpretation_policy', 'assignment_policy', 'candidate_period_count', 'candidate_count'].map(quote).join(',') + ') VALUES (?,?,?,?,?,?,?,?,?)')
    .run(logicalPath, DOCUMENT_KEYS.join('|'), document.schema, document.status, document.visibility, document.interpretationPolicy, document.assignmentPolicy, document.candidatePeriods.length, document.candidates.length);
  const period = db.prepare('INSERT INTO soul_candidate_documents_period (logical_path, ordinal, value) VALUES (?,?,?)');
  document.candidatePeriods.forEach((value, ordinal) => period.run(logicalPath, ordinal, value));
  db.prepare('INSERT INTO soul_candidate_documents_research (logical_path, field_order, accessed_on, total_candidates, primary_sources_verified, limitation_count) VALUES (?,?,?,?,?,?)')
    .run(logicalPath, RESEARCH_KEYS.join('|'), research.accessedOn, research.totalCandidates, Number(research.primarySourcesVerified), research.limitations.length);
  const coverageInsert = db.prepare('INSERT INTO soul_candidate_documents_coverage (logical_path, ordinal, period, candidate_count) VALUES (?,?,?,?)');
  COVERAGE_KEYS.forEach((key, ordinal) => coverageInsert.run(logicalPath, ordinal, key, coverage[key]));
  const researchLimitation = db.prepare('INSERT INTO soul_candidate_documents_research_limitation (logical_path, ordinal, value) VALUES (?,?,?)');
  research.limitations.forEach((value, ordinal) => researchLimitation.run(logicalPath, ordinal, value));
  const candidateInsert = db.prepare('INSERT INTO soul_candidate_documents_candidate (logical_path, ordinal, field_order, id, name, period, source_kind, locked_existing, related_periods_present, research_status, career_summary, narrative_fit, source_count, role_tag_count, limitation_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const relatedInsert = db.prepare('INSERT INTO soul_candidate_documents_related_period (logical_path, candidate_ordinal, ordinal, value) VALUES (?,?,?,?)');
  const sourceInsert = db.prepare('INSERT INTO soul_candidate_documents_source_record (logical_path, candidate_ordinal, ordinal, field_order, url, source_type, access_method, accessed_on) VALUES (?,?,?,?,?,?,?,?)');
  const roleInsert = db.prepare('INSERT INTO soul_candidate_documents_role_tag (logical_path, candidate_ordinal, ordinal, value) VALUES (?,?,?,?)');
  const limitationInsert = db.prepare('INSERT INTO soul_candidate_documents_limitation (logical_path, candidate_ordinal, ordinal, value) VALUES (?,?,?,?)');
  document.candidates.forEach((candidate, ordinal) => {
    const keys = Object.keys(candidate);
    const related = keys.includes('relatedPeriods');
    candidateInsert.run(logicalPath, ordinal, keys.join('|'), candidate.id, candidate.name, candidate.period, candidate.sourceKind, Number(candidate.lockedExisting), Number(related), candidate.researchStatus, candidate.careerSummary, candidate.narrativeFit, candidate.sources.length, candidate.roleTags.length, candidate.limitations.length);
    if (related) candidate.relatedPeriods.forEach((value, index) => relatedInsert.run(logicalPath, ordinal, index, value));
    candidate.sources.forEach((record, index) => sourceInsert.run(logicalPath, ordinal, index, SOURCE_KEYS.join('|'), record.url, record.sourceType, record.accessMethod, record.accessedOn));
    candidate.roleTags.forEach((value, index) => roleInsert.run(logicalPath, ordinal, index, value));
    candidate.limitations.forEach((value, index) => limitationInsert.run(logicalPath, ordinal, index, value));
  });
}

function ordered(db, sql, params, parent) {
  const rows = db.prepare(sql).all(...params);
  rows.forEach((row, index) => {
    if (row.ordinal !== index) fail('E_CANDIDATE_INTEGRITY');
  });
  if (rows.length !== parent) fail('E_CANDIDATE_INTEGRITY');
  return rows;
}

function readOne(db, logicalPath, receipt) {
  const document = db.prepare('SELECT * FROM soul_candidate_documents_document WHERE logical_path=?').get(logicalPath);
  const research = db.prepare('SELECT * FROM soul_candidate_documents_research WHERE logical_path=?').get(logicalPath);
  if (!document || !research || document.field_order !== DOCUMENT_KEYS.join('|') || research.field_order !== RESEARCH_KEYS.join('|')) fail('E_CANDIDATE_INTEGRITY');
  const periods = ordered(db, 'SELECT ordinal, value FROM soul_candidate_documents_period WHERE logical_path=? ORDER BY ordinal', [logicalPath], document.candidate_period_count);
  const coverage = ordered(db, 'SELECT ordinal, period, candidate_count FROM soul_candidate_documents_coverage WHERE logical_path=? ORDER BY ordinal', [logicalPath], COVERAGE_KEYS.length);
  if (coverage.some((row, index) => row.period !== COVERAGE_KEYS[index])) fail('E_CANDIDATE_INTEGRITY');
  const researchLimitations = ordered(db, 'SELECT ordinal, value FROM soul_candidate_documents_research_limitation WHERE logical_path=? ORDER BY ordinal', [logicalPath], research.limitation_count);
  const candidates = ordered(db, 'SELECT * FROM soul_candidate_documents_candidate WHERE logical_path=? ORDER BY ordinal', [logicalPath], document.candidate_count);
  const related = db.prepare('SELECT * FROM soul_candidate_documents_related_period WHERE logical_path=? ORDER BY candidate_ordinal, ordinal').all(logicalPath);
  const sources = db.prepare('SELECT * FROM soul_candidate_documents_source_record WHERE logical_path=? ORDER BY candidate_ordinal, ordinal').all(logicalPath);
  const roles = db.prepare('SELECT * FROM soul_candidate_documents_role_tag WHERE logical_path=? ORDER BY candidate_ordinal, ordinal').all(logicalPath);
  const limitations = db.prepare('SELECT * FROM soul_candidate_documents_limitation WHERE logical_path=? ORDER BY candidate_ordinal, ordinal').all(logicalPath);
  const take = (rows, ordinal, count, map) => {
    const owned = rows.filter(row => row.candidate_ordinal === ordinal);
    if (owned.length !== count || owned.some((row, index) => row.ordinal !== index)) fail('E_CANDIDATE_INTEGRITY');
    return owned.map(map);
  };
  const result = {
    schema: document.schema,
    status: document.status,
    visibility: document.visibility,
    candidatePeriods: periods.map(row => row.value),
    interpretationPolicy: document.interpretation_policy,
    assignmentPolicy: document.assignment_policy,
    research: {
      accessedOn: research.accessed_on,
      coverageByPeriod: Object.fromEntries(coverage.map(row => [row.period, row.candidate_count])),
      totalCandidates: research.total_candidates,
      primarySourcesVerified: Boolean(research.primary_sources_verified),
      limitations: researchLimitations.map(row => row.value),
    },
    candidates: candidates.map(row => {
      const keys = row.related_periods_present ? CANDIDATE_KEYS_RELATED : CANDIDATE_KEYS;
      if (row.field_order !== keys.join('|')) fail('E_CANDIDATE_INTEGRITY');
      const candidate = {
        id: row.id,
        name: row.name,
        period: row.period,
        sourceKind: row.source_kind,
        lockedExisting: Boolean(row.locked_existing),
      };
      const relatedCount = related.filter(item => item.candidate_ordinal === row.ordinal).length;
      if (row.related_periods_present) {
        const owned = related.filter(item => item.candidate_ordinal === row.ordinal);
        if (owned.length !== relatedCount || owned.some((item, index) => item.ordinal !== index)) fail('E_CANDIDATE_INTEGRITY');
        candidate.relatedPeriods = owned.map(item => item.value);
      } else if (relatedCount) fail('E_CANDIDATE_INTEGRITY');
      Object.assign(candidate, {
        researchStatus: row.research_status,
        sources: take(sources, row.ordinal, row.source_count, item => {
          if (item.field_order !== SOURCE_KEYS.join('|')) fail('E_CANDIDATE_INTEGRITY');
          return { url: item.url, sourceType: item.source_type, accessMethod: item.access_method, accessedOn: item.accessed_on };
        }),
        careerSummary: row.career_summary,
        narrativeFit: row.narrative_fit,
        roleTags: take(roles, row.ordinal, row.role_tag_count, item => item.value),
        limitations: take(limitations, row.ordinal, row.limitation_count, item => item.value),
      });
      if (!sameKeys(candidate, keys)) fail('E_CANDIDATE_INTEGRITY');
      return candidate;
    }),
  };
  const consumedRelated = candidates.reduce((sum, row) => sum + related.filter(item => item.candidate_ordinal === row.ordinal).length, 0);
  const consumedSources = candidates.reduce((sum, row) => sum + row.source_count, 0);
  const consumedRoles = candidates.reduce((sum, row) => sum + row.role_tag_count, 0);
  const consumedLimitations = candidates.reduce((sum, row) => sum + row.limitation_count, 0);
  if (consumedRelated !== related.length || consumedSources !== sources.length || consumedRoles !== roles.length || consumedLimitations !== limitations.length) fail('E_CANDIDATE_INTEGRITY');
  if (sha(JSON.stringify(result)) !== receipt.document_sha256 || sha(JSON.stringify(result)) !== DOCUMENT_HASHES[logicalPath]) fail('E_CANDIDATE_INTEGRITY');
  return result;
}

function readDocumentsFrom(db, expectedSourceHashes) {
  exactPins(expectedSourceHashes);
  const receipts = db.prepare('SELECT * FROM soul_candidate_documents_source ORDER BY logical_path').all();
  if (receipts.length !== PATHS.length || receipts.some(row => !PATHS.includes(row.logical_path) || row.source_sha256 !== SOUL_CANDIDATE_SOURCE_HASHES[row.logical_path] || row.document_sha256 !== DOCUMENT_HASHES[row.logical_path] || row.byte_length !== 192079)) fail('E_CANDIDATE_INTEGRITY');
  for (const table of ['soul_candidate_documents_document', 'soul_candidate_documents_period', 'soul_candidate_documents_research', 'soul_candidate_documents_coverage', 'soul_candidate_documents_research_limitation', 'soul_candidate_documents_candidate', 'soul_candidate_documents_related_period', 'soul_candidate_documents_source_record', 'soul_candidate_documents_role_tag', 'soul_candidate_documents_limitation']) {
    const foreign = db.prepare('SELECT count(*) AS n FROM ' + table + ' WHERE logical_path != ?').get(PATHS[0]).n;
    if (foreign) fail('E_CANDIDATE_INTEGRITY');
  }
  const documents = new Map();
  for (const path of PATHS) documents.set(path, readOne(db, path, receipts.find(row => row.logical_path === path)));
  const counts = {
    soul_candidate_documents_document: PATHS.length,
    soul_candidate_documents_research: PATHS.length,
  };
  for (const [table, expected] of Object.entries(counts)) {
    if (db.prepare('SELECT count(*) AS n FROM ' + table).get().n !== expected) fail('E_CANDIDATE_INTEGRITY');
  }
  return documents;
}

/** Caller supplies the exact logical path, bytes, and expected digest in memory.
 * The logical path is never opened. Archived bytes are immutable evidence only.
 */
export function initializeSoulCandidateDocuments(absoluteNewPath, options = {}) {
  authorize(options);
  const { sources, actor, reason } = options;
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('E_CANDIDATE_AUDIT');
  if (options.scope !== undefined && options.scope !== 'internal') fail('E_PRIVATE');
  if (options.expectedSourceHashes !== undefined) exactPins(options.expectedSourceHashes);
  sourceSet(sources);
  if (options.expectedSourceHashes !== undefined && PATHS.some(path => options.expectedSourceHashes[path] !== sources[path]?.expectedSourceHash)) fail('E_CANDIDATE_PINS');
  const parsed = new Map();
  for (const logicalPath of PATHS) {
    const input = sources[logicalPath];
    if (!input || input.bytes == null) fail('E_CANDIDATE_BYTES');
    if (!(input.bytes instanceof Uint8Array)) fail('E_CANDIDATE_BYTES');
    const bytes = Buffer.from(input.bytes);
    let document;
    try { document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { fail('E_CANDIDATE_SHAPE'); }
    if (typeof input.expectedSourceHash !== 'string' || !/^[a-f0-9]{64}$/.test(input.expectedSourceHash) || sha(bytes) !== input.expectedSourceHash) fail('E_CANDIDATE_PINS');
    parsed.set(logicalPath, { bytes, document });
  }
  closeSync(openSync(absoluteNewPath, 'wx', 0o600));
  let db;
  try {
    db = new DatabaseSync(absoluteNewPath, { enableForeignKeyConstraints: true });
    db.exec('BEGIN IMMEDIATE');
    db.exec(schema);
    db.exec('PRAGMA application_id=' + APPLICATION_ID + '; PRAGMA user_version=1');
    db.prepare('INSERT INTO soul_candidate_documents_import (singleton, actor, reason, initialized_at) VALUES (1,?,?,?)').run(actor, reason, new Date().toISOString());
    for (const logicalPath of PATHS) {
      const { bytes, document } = parsed.get(logicalPath);
      db.prepare('INSERT INTO soul_candidate_documents_source (logical_path, source_sha256, document_sha256, byte_length) VALUES (?,?,?,?)')
        .run(logicalPath, SOUL_CANDIDATE_SOURCE_HASHES[logicalPath], DOCUMENT_HASHES[logicalPath], bytes.length);
      db.prepare('INSERT INTO soul_candidate_documents_archive (logical_path, source_sha256, raw_bytes) VALUES (?,?,?)')
        .run(logicalPath, SOUL_CANDIDATE_SOURCE_HASHES[logicalPath], bytes);
      writeDocument(db, logicalPath, document);
      if (sha(bytes) !== SOUL_CANDIDATE_SOURCE_HASHES[logicalPath] || sha(JSON.stringify(document)) !== DOCUMENT_HASHES[logicalPath]) fail('E_CANDIDATE_SHAPE');
    }
    const documents = readDocumentsFrom(db, SOUL_CANDIDATE_SOURCE_HASHES);
    for (const logicalPath of PATHS) {
      if (JSON.stringify(documents.get(logicalPath)) !== JSON.stringify(parsed.get(logicalPath).document)) fail('E_CANDIDATE_INTEGRITY');
    }
    db.exec('COMMIT');
    db.close();
  } catch (error) {
    if (db?.isOpen) {
      if (db.isTransaction) db.exec('ROLLBACK');
      db.close();
    }
    unlinkSync(absoluteNewPath);
    throw error;
  }
}

/** Read-only reopen. SELECT reconstruction never opens the logical source or the archive. */
export function openSoulCandidateDocuments(absolutePath, options = {}) {
  authorize(options);
  if ((statSync(absolutePath).mode & 0o777) !== 0o600) fail('E_PRIVATE_MODE');
  const db = new DatabaseSync(absolutePath, { readOnly: true, enableForeignKeyConstraints: true });
  try {
    if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID || db.prepare('PRAGMA user_version').get().user_version !== 1) fail('E_SCHEMA');
    exactPins(options.expectedSourceHashes);
    const receipts = db.prepare('SELECT logical_path, source_sha256, document_sha256 FROM soul_candidate_documents_source').all();
    if (receipts.some(row => PATHS.includes(row.logical_path) && row.source_sha256 !== options.expectedSourceHashes[row.logical_path])) fail('E_CANDIDATE_PINS');
    db.exec('PRAGMA query_only=ON');
  } catch (error) {
    db.close();
    throw error;
  }
  return Object.freeze({
    close: () => db.close(),
    readDocuments() {
      db.exec('BEGIN');
      try {
        const documents = readDocumentsFrom(db, options.expectedSourceHashes);
        db.exec('COMMIT');
        return documents;
      } catch (error) {
        if (db.isTransaction) db.exec('ROLLBACK');
        throw error;
      }
    },
  });
}
