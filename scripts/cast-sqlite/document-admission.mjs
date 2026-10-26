import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadCategoryRegistry, registrationErrors } from '../category-registration.mjs';
import { withTransaction } from './db.mjs';
import { listDocuments, readDocument } from './document-read.mjs';
import { readDocumentRevision } from './document-edit.mjs';
import { EXCLUDED_SOURCE_PATHS } from './excluded-sources.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { readCatalogMetadataDocument, CATEGORY_REGISTRY_PATH } from './catalog-metadata.mjs';

const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
    : JSON.stringify(value);
const digest = (document) => createHash('sha256').update(canonical(document)).digest('hex');

const approvalPath = 'scripts/approved-public-articles-20261025.json';
const approvalSha256 = 'b7ec1c7f306b6aa3f2297d028d89628cb619781d412299a356e5be0060b5768e';
const exactDecisions = new WeakSet();
const fields = ['source_id', 'revision_id', 'source_path', 'source_sha256', 'semantic_sha256',
  'classification', 'reason', 'receipt_path', 'receipt_sha256', 'approval_ref'];

/** No caller path, hash, object or source-application receipt grants public authority. */
export function loadExactSuccessorApproval() {
  const bytes = readFileSync(new URL(`../../${approvalPath}`, import.meta.url));
  if (createHash('sha256').update(bytes).digest('hex') !== approvalSha256) {
    fail('E_DOCUMENT_ADMISSION_AUTHORITY', 'publication approval bytes differ');
  }
  const approval = JSON.parse(bytes);
  if (approval.kind !== 'owner-exact-public-article-admission' || approval.status !== 'approved-for-public-document-api'
    || !approval.session || !approval.questionCall || !approval.actualAnswer || !approval.documents?.length) {
    fail('E_DOCUMENT_ADMISSION_AUTHORITY', 'explicit owner public decision required');
  }
  const documents = approval.documents.map(row => Object.freeze({ ...row, locales: Object.freeze([...row.locales]) }));
  const decision = Object.freeze({ documents: Object.freeze(documents), receiptPath: approvalPath,
    receiptSha256: approvalSha256, approvalRef: `${approval.session}:${approval.questionCall}` });
  exactDecisions.add(decision);
  return decision;
}

const normalizeSql = sql => sql.trim().replace(/;$/u, '').replace(/\s+/gu, ' ');

/** Replace only the known initial-import insert gate; every other schema object is retained. */
function migrateAdmissionTrigger(db) {
  const sql = readFileSync(new URL('./document-admission.sql', import.meta.url), 'utf8');
  const table = sql.slice(sql.indexOf('CREATE TABLE'), sql.indexOf('CREATE TRIGGER')).trim();
  const triggers = sql.match(/CREATE TRIGGER[\s\S]*?END;/gu);
  const schema = name => db.prepare('SELECT sql FROM sqlite_schema WHERE name=?').get(name)?.sql;
  if (normalizeSql(schema('document_publication_admission') ?? '') !== normalizeSql(table)
    || triggers.slice(1).some(trigger => {
      const name = trigger.match(/^CREATE TRIGGER (\w+)/u)[1];
      return normalizeSql(schema(name) ?? '') !== normalizeSql(trigger);
    })) fail('E_DOCUMENT_ADMISSION_SCHEMA', 'unexpected admission table or immutable triggers');
  const expected = normalizeSql(triggers[0]);
  const actual = normalizeSql(schema('document_publication_admission_insert') ?? '');
  if (actual === expected) return false;
  // Historical databases used the same trigger with one additional parentless clause.
  const withoutParent = actual.replace(/ AND r\.parent_revision IS NULL/gu, '');
  if (withoutParent !== expected || withoutParent === actual) {
    fail('E_DOCUMENT_ADMISSION_SCHEMA', 'unexpected admission insert trigger');
  }
  db.exec('DROP TRIGGER document_publication_admission_insert');
  db.exec(triggers[0]);
  return true;
}

export function migrateExactSuccessorAdmission(db) {
  return withTransaction(db, () => migrateAdmissionTrigger(db));
}

/** The fixed approval grants publication, while sealed typed history authenticates its source. */
export async function recordExactSuccessorAdmissions(db, decision) {
  if (!exactDecisions.has(decision)) fail('E_DOCUMENT_ADMISSION_AUTHORITY', 'trusted exact decision required');
  return withTransaction(db, () => {
    migrateAdmissionTrigger(db);
    const registry = readCatalogMetadataDocument(db, CATEGORY_REGISTRY_PATH);
    const seen = new Set();
    return decision.documents.map(target => {
      if (seen.has(target.sourcePath) || target.corpusKind !== 'current'
        || canonical(target.locales) !== canonical(['ko', 'en'])) fail('E_DOCUMENT_ADMISSION_TARGET', target.sourcePath);
      seen.add(target.sourcePath);
      const identities = db.prepare(`SELECT d.*,s.logical_path,s.sha256 FROM text_document d
        JOIN source_file s USING(source_id) WHERE d.document_id=? AND d.domain=? AND d.corpus_kind=?`)
        .all(target.documentId, target.domain, target.corpusKind);
      const identity = identities[0];
      if (identities.length !== 1 || identity.logical_path !== target.sourcePath || identity.sha256 !== target.sourceSha256
        || !['draft', 'approved'].includes(identity.status) || target.sourcePath.startsWith('.omo/private/')
        || [...EXCLUDED_SOURCE_PATHS, ...ENGINE_PRIVATE_SOURCE_PATHS].includes(target.sourcePath)
        || db.prepare('SELECT 1 FROM excluded_source WHERE logical_path=?').get(target.sourcePath)
        || db.prepare("SELECT 1 FROM sqlite_schema WHERE name='current_engine_source'").get()
          && db.prepare('SELECT 1 FROM current_engine_source WHERE logical_path=?').get(target.sourcePath)) {
        fail('E_DOCUMENT_ADMISSION_TARGET', target.sourcePath);
      }
      const routes = db.prepare('SELECT * FROM article_route WHERE source_id=?').all(identity.source_id);
      const route = routes[0];
      const routeIdentity = route && JSON.parse(route.derivation_json);
      if (routes.length !== 1 || route.route !== target.route || route.source_path !== target.sourcePath
        || route.derivation !== 'typed-envelope' || routeIdentity.documentId !== target.documentId
        || routeIdentity.domain !== target.domain || routeIdentity.envelopeSlug !== identity.slug) {
        fail('E_DOCUMENT_ADMISSION_ROUTE', target.sourcePath);
      }
      const head = db.prepare(`SELECT r.* FROM document_head h JOIN document_revision r USING(source_id,revision_id)
        JOIN document_revision_seal z USING(revision_id) WHERE h.source_id=?`).get(identity.source_id);
      if (!head || head.revision_id !== target.revisionId || !head.parent_revision || head.parent_revision !== target.parentRevision
        || head.algorithm !== 'typed-envelope-v1' || head.semantic_sha256 !== target.semanticSha256) {
        fail('E_DOCUMENT_ADMISSION_SNAPSHOT', target.sourcePath);
      }
      const parent = db.prepare(`SELECT r.* FROM document_revision r JOIN document_revision_seal z USING(revision_id)
        WHERE r.revision_id=? AND r.source_id=?`).get(head.parent_revision, identity.source_id);
      const revisionId = r => digest([r.algorithm, r.source_id, r.parent_revision, r.semantic_sha256, r.actor, r.reason]);
      if (!parent || parent.algorithm !== 'typed-envelope-v1' || parent.sequence >= head.sequence
        || revisionId(head) !== head.revision_id || revisionId(parent) !== parent.revision_id) {
        fail('E_DOCUMENT_ADMISSION_SNAPSHOT', target.sourcePath);
      }
      const selector = { documentId: target.documentId, domain: target.domain, corpusKind: target.corpusKind, visibility: 'internal' };
      const document = readDocument(db, selector);
      if (digest(document) !== target.semanticSha256
        || digest(readDocumentRevision(db, { ...selector, revision: head.revision_id })) !== target.semanticSha256
        || digest(readDocumentRevision(db, { ...selector, revision: parent.revision_id })) !== parent.semantic_sha256
        || document.status !== 'approved' && registrationErrors(document, registry).length) {
        fail('E_DOCUMENT_ADMISSION_SNAPSHOT', target.sourcePath);
      }
      const record = [identity.source_id, head.revision_id, target.sourcePath, target.sourceSha256, target.semanticSha256,
        'current-reviewed', 'approved-exact-review', decision.receiptPath, decision.receiptSha256, decision.approvalRef];
      const existing = db.prepare('SELECT * FROM document_publication_admission WHERE source_id=? AND revision_id=?').get(record[0], record[1]);
      if (existing && fields.some((field, i) => existing[field] !== record[i])) fail('E_DOCUMENT_ADMISSION_CONFLICT', target.sourcePath);
      if (!existing) db.prepare('INSERT INTO document_publication_admission VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(...record, new Date().toISOString());
      return { sourceId: identity.source_id, revision: head.revision_id, result: existing ? 'idempotent' : 'inserted' };
    });
  });
}

/** Only the production closed-pin loader can mint review authority. No receipt bodies
 * are copied. Initial imports rely on the authority bootstrap's completeness attestation;
 * source_file SHA cannot authenticate a later typed edit, even when it has a new head. */
export async function recordPublicationReview(db, review) {
  const { isAuthenticatedPublicationReview } = await import('../seoul-census.mjs');
  if (!isAuthenticatedPublicationReview(review)) fail('E_PUBLICATION_REVIEW_AUTHORITY', 'authenticated review required');
  if (review.complete !== true || review.semanticReview !== 'reviewed') fail('E_PUBLICATION_REVIEW_PENDING', 'complete reviewed result required');
  const registry = await loadCategoryRegistry(new URL('../category-registry.json', import.meta.url));
  return withTransaction(db, () => {
    const candidates = listDocuments(db, { corpusKind: 'current', visibility: 'internal' });
    const records = [];
    for (const identity of candidates) {
      if (identity.excluded || identity.status === 'excluded') continue;
      const decisions = review.documents.filter((row) => row.sourcePath === identity.logical_path);
      if (decisions.length !== 1) fail('E_REVIEW_COVERAGE', identity.logical_path);
      const [decision] = decisions;
      if (decision.currentSha256 !== identity.sha256) fail('E_REVIEW_HASH', identity.logical_path);
      if (decision.eligible !== true || decision.classification !== 'current-reviewed'
        || decision.reason !== 'approved-exact-review' || !decision.receipt) continue;
      const document = readDocument(db, { documentId: identity.document_id, corpusKind: 'current', domain: identity.domain, visibility: 'internal' });
      if (document.status !== 'approved' && registrationErrors(document, registry).length) continue;
      const head = db.prepare(`SELECT r.* FROM document_head h JOIN document_revision r USING(source_id,revision_id)
        JOIN document_revision_seal z USING(revision_id) WHERE h.source_id=?`).get(identity.source_id);
      if (!head || head.parent_revision !== null || head.algorithm !== 'typed-envelope-v1'
        || head.semantic_sha256 !== digest(document)) fail('E_DOCUMENT_REVIEW_SNAPSHOT', identity.logical_path);
      records.push([identity.source_id, head.revision_id, identity.logical_path, identity.sha256, head.semantic_sha256,
        decision.classification, decision.reason, decision.receipt.path, decision.receipt.sha256, decision.receipt.approvalRef]);
    }
    if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE name='document_publication_admission'").get()) {
      db.exec(readFileSync(new URL('./document-admission.sql', import.meta.url), 'utf8'));
    }
    for (const record of records) {
      const existing = db.prepare('SELECT * FROM document_publication_admission WHERE source_id=? AND revision_id=?').get(record[0], record[1]);
      if (existing) {
        const fields = ['source_id', 'revision_id', 'source_path', 'source_sha256', 'semantic_sha256', 'classification', 'reason', 'receipt_path', 'receipt_sha256', 'approval_ref'];
        if (fields.some((field, i) => existing[field] !== record[i])) fail('E_DOCUMENT_ADMISSION_CONFLICT', record[2]);
      } else db.prepare('INSERT INTO document_publication_admission VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(...record, new Date().toISOString());
    }
    return records.map(([sourceId, revision]) => ({ sourceId, revision }));
  });
}
