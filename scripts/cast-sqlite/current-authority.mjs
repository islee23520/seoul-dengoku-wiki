import { createHash } from 'node:crypto';
import { lstat } from 'node:fs/promises';
import { APPLICATION_ID, SCHEMA_VERSION, runIntegrityChecks } from './db.mjs';
import { readDocument } from './document-read.mjs';
import { EXCLUDED_SOURCE_PATHS } from './excluded-sources.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { readCiaCurrentRights } from './cia-current-rights.mjs';

const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const quote = (name) => `"${name.replaceAll('"', '""')}"`;
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const digest = (value) => createHash('sha256').update(canonical(value)).digest('hex');
const hasTable = (db, name) => Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name));

export async function assertNoAuthoritySidecars(path) {
  for (const suffix of ['-wal', '-shm', '-journal']) {
    try { await lstat(`${path}${suffix}`); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    fail('E_DB_SIDECAR', `${path}${suffix}`);
  }
}

/** Review typed current heads, never predecessor source_record/raw_bytes or import counts.
 * Stored admissions are consistency evidence, not a fresh authenticated owner review.
 * Domain-specific projections outside the envelope remain their readers' responsibility.
 */
export function reviewCurrentAuthority(db, { requireClean = false } = {}) {
  if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID
    || db.prepare('PRAGMA user_version').get().user_version !== SCHEMA_VERSION
    || db.prepare('PRAGMA query_only').get().query_only !== 1) fail('E_AUTHORITY_DATABASE', 'compatible read-only database required');
  const integrity = runIntegrityChecks(db);
  readCiaCurrentRights(db);
  const tables = db.prepare('PRAGMA table_list').all().filter((row) => row.schema === 'main' && !row.name.startsWith('sqlite_'));
  if (tables.some((row) => row.type !== 'table' || row.strict !== 1)) fail('E_AUTHORITY_SCHEMA', 'STRICT typed tables required');
  for (const table of ['document_authority', 'document_head', 'document_revision', 'document_revision_seal', 'text_document', 'source_file', 'excluded_source']) {
    if (!hasTable(db, table)) fail('E_AUTHORITY_SCHEMA', table);
  }
  const authorities = db.prepare('SELECT * FROM document_authority').all();
  if (authorities.length !== 1 || authorities[0].singleton !== 1 || ![1, 2].includes(authorities[0].version)
    || !Number.isSafeInteger(authorities[0].sequence) || authorities[0].sequence < 0) fail('E_AUTHORITY_SCHEMA', 'invalid document authority identity');
  const sequence = authorities[0].sequence;
  if (db.prepare(`SELECT 1 FROM document_revision r LEFT JOIN document_revision_seal z USING(revision_id)
    WHERE z.revision_id IS NULL OR r.sequence>? OR r.sequence<0 OR r.algorithm<>'typed-envelope-v1' LIMIT 1`).get(sequence)) {
    fail('E_AUTHORITY_REVISION', 'unsealed or invalid revision history');
  }
  const privatePaths = new Set([...EXCLUDED_SOURCE_PATHS, ...ENGINE_PRIVATE_SOURCE_PATHS,
    ...db.prepare('SELECT logical_path FROM excluded_source').all().map((row) => row.logical_path)]);
  if (hasTable(db, 'current_engine_source')) {
    for (const row of db.prepare('SELECT logical_path FROM current_engine_source').all()) privatePaths.add(row.logical_path);
  }
  for (const source of db.prepare('SELECT source_id,logical_path FROM source_file').all()) {
    if (privatePaths.has(source.logical_path) || source.logical_path.startsWith('.omo/private/')) {
      fail('E_AUTHORITY_PRIVACY', `private source archive in public database: ${source.logical_path}`);
    }
  }
  const identities = db.prepare(`SELECT d.source_id,d.document_id,d.domain,d.corpus_kind,h.revision_id,h.public_admission,
    r.semantic_sha256,r.sequence FROM text_document d LEFT JOIN document_head h USING(source_id)
    LEFT JOIN document_revision r ON r.source_id=h.source_id AND r.revision_id=h.revision_id ORDER BY d.source_id`).all();
  if (!identities.length) fail('E_AUTHORITY_HEAD', 'typed document authority is empty');
  for (const identity of identities) {
    if (!identity.revision_id || identity.public_admission !== 'unrecorded' || identity.sequence > sequence) {
      fail('E_AUTHORITY_HEAD', `missing or invalid typed head: ${identity.source_id}`);
    }
    const document = readDocument(db, { documentId: identity.document_id, domain: identity.domain,
      corpusKind: identity.corpus_kind, visibility: 'internal' });
    if (!document || document.readMetadata.source_id !== identity.source_id || digest(document) !== identity.semantic_sha256) {
      fail('E_AUTHORITY_HEAD', `typed document differs from sealed head: ${identity.source_id}`);
    }
  }
  let admissionCount = 0;
  let currentAdmissionCount = 0;
  if (hasTable(db, 'document_publication_admission')) {
    const admissions = db.prepare(`SELECT a.*,d.document_id,d.domain,d.corpus_kind,d.status,s.logical_path,s.sha256,
      r.semantic_sha256 AS revision_sha256,r.parent_revision,r.algorithm,h.revision_id AS current_revision
      FROM document_publication_admission a JOIN text_document d USING(source_id) JOIN source_file s USING(source_id)
      JOIN document_revision r USING(source_id,revision_id) LEFT JOIN document_head h USING(source_id)`).all();
    for (const admission of admissions) {
      if (admission.source_path !== admission.logical_path || admission.source_sha256 !== admission.sha256
        || admission.semantic_sha256 !== admission.revision_sha256 || admission.parent_revision !== null
        || admission.algorithm !== 'typed-envelope-v1' || admission.corpus_kind !== 'current'
        || admission.classification !== 'current-reviewed' || admission.reason !== 'approved-exact-review'
        || !/^[a-f0-9]{64}$/u.test(admission.receipt_sha256) || !admission.receipt_path.trim() || !admission.approval_ref.trim()) {
        fail('E_AUTHORITY_ADMISSION', `invalid stored admission: ${admission.source_id}`);
      }
      admissionCount += 1;
      if (admission.current_revision === admission.revision_id) {
        if (!readDocument(db, { documentId: admission.document_id, domain: admission.domain,
          corpusKind: admission.corpus_kind, visibility: 'public' })) fail('E_AUTHORITY_ADMISSION', `current admission is not readable: ${admission.source_id}`);
        currentAdmissionCount += 1;
      }
    }
  }
  const originalImportMetadata = hasTable(db, 'build_metadata')
    ? Object.fromEntries(db.prepare('SELECT key,value FROM build_metadata ORDER BY key').all().map((row) => [row.key, row.value])) : null;
  const historicalChecks = hasTable(db, 'source_check_run') ? db.prepare('SELECT * FROM source_check_run ORDER BY check_name').all() : [];
  const officialIssues = hasTable(db, 'source_check_issue') ? db.prepare('SELECT count(*) AS n FROM source_check_issue').get().n : 0;
  const importerIssues = hasTable(db, 'quality_issue') ? db.prepare('SELECT count(*) AS n FROM quality_issue').get().n : 0;
  const clean = historicalChecks.length > 0 && historicalChecks.every((row) => row.exit_code === 0 && row.issue_count === 0)
    && officialIssues === 0 && importerIssues === 0;
  if (requireClean && !clean) fail('E_SOURCE_QUALITY', 'original import quality gate failed or was not recorded; this is not current publication approval');
  return {
    status: 'PASS', mode: 'current-authority', artifact_integrity: 'ok', ...integrity,
    schema_version: SCHEMA_VERSION, authority_version: authorities[0].version, authority_sequence: sequence,
    typed_document_heads: identities.length, current_document_authority: 'verified', private_source_boundary: 'verified',
    current_approval_readiness: 'unreviewed', publication_approval: 'not-revalidated',
    stored_publication_admissions: admissionCount, stored_current_publication_admissions: currentAdmissionCount,
    original_import: { metadata: originalImportMetadata, historical_checks: historicalChecks,
      official_issue_count: officialIssues, importer_issue_count: importerIssues, quality: clean ? 'clean' : 'degraded-or-unverified' },
    counts: Object.fromEntries(tables.map((row) => [row.name, db.prepare(`SELECT count(*) AS n FROM ${quote(row.name)}`).get().n])),
    complete_verification: false, raw_bytes_verified: false,
    unchecked: ['authenticated-owner-review', 'domain-specific-projection-semantics', 'unsupported-data-completeness', 'original-import-replay'],
  };
}
