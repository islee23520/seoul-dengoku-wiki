import { createHash } from 'node:crypto';
import { closeSync, openSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// Internal read-only snapshot of the nine soul-batch documents.
// Initialization seals caller-supplied bytes; readers query named typed rows only.
// The archive is immutable evidence, never a runtime reconstruction authority.
export const INTERNAL_BATCHES_CAPABILITY = Symbol('internal soul-batch documents');

// Fixed pins of the admitted source bytes. Not derived from the working tree.
export const SOUL_BATCH_PATHS = Object.freeze([
  'lore/editorial/soul-batches/special.json',
  'lore/editorial/soul-batches/state-01-02.json',
  'lore/editorial/soul-batches/state-03-04.json',
  'lore/editorial/soul-batches/state-05-06.json',
  'lore/editorial/soul-batches/state-07-08.json',
  'lore/editorial/soul-batches/state-09-10.json',
  'lore/editorial/soul-batches/state-11-12.json',
  'lore/editorial/soul-batches/state-13-14.json',
  'lore/editorial/soul-batches/state-15-16.json',
]);

// Ordered-document SHA-256 of JSON.stringify(parsed document), one constant per
// admitted path. Independent of source.document_sha256 and of the working tree.

const APPLICATION_ID = 0x57534242;
const SOURCE_PATHS = Object.freeze(SOUL_BATCH_PATHS);
const ADMITTED_SCHEMAS = new Set([
  'seoul-soul-batch.v1',
  'seoul-soul-assignment-batch.v1',
  'seoul-soul-narrative-batch.v1',
]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const quote = name => '"' + name + '"';
const table = domain => 'soul_batch_documents_' + domain;
const scalar = type => type === 'text' || type === 'integer' || type === 'boolean';
const schemaSql = readFileSync(new URL('./soul-batch-documents.sql', import.meta.url), 'utf8');

// Every admitted field is named. Array entries name their item domain.
// 'union:a|b' is the one actual document field whose value is a list in one
// batch and an object in another. Optional fields stay absent until present.
const definitions = {
  document: {
    schema: 'text',
    visibility: 'text',
    status: 'text',
    batch: 'text',
    lane: 'text',
    sourcePaths: ['text_item'],
    sourceCards: ['text_item'],
    assignmentCount: 'integer',
    lockedAssignmentCount: 'integer',
    count: 'integer',
    interpretationPolicy: 'text',
    policy: 'text',
    exclusionPolicy: 'text',
    limitations: ['text_item'],
    exclusions: 'union:text_item|exclusions_object',
    excludedSources: ['text_item'],
    excludedPersonIds: ['text_item'],
    excluded: ['excluded_person'],
    excludedPeople: ['excluded_person'],
    excludedLanePersons: ['named_person'],
    duplicateSummary: ['duplicate_summary'],
    scope: 'scope',
    assignments: ['assignment'],
  },
  assignment: {
    personId: 'text',
    name: 'text',
    status: 'text',
    souls: ['soul'],
    approvalRef: 'text',
    evidence: ['evidence'],
    narrativeRationale: 'text',
    counterEvidence: 'counter',
    evidenceStrength: 'text',
    historicalComparisons: ['comparison'],
    historicalComparison: 'comparison',
    historicalSources: ['historical_source'],
    duplicateRationale: 'text',
    currentFactAuthority: 'boolean',
    canonicalAssignmentRef: 'text',
    supersededByApprovalRef: 'text',
  },
  soul: {
    id: 'text',
    name: 'text',
    period: 'text',
    sourceKind: 'text',
    interpretation: 'text',
  },
  evidence: {
    path: 'text',
    anchor: 'text',
    quote: 'text',
    sourcePointer: 'text',
    sourceSelector: 'text',
    currentFactAuthority: 'boolean',
  },
  comparison: {
    candidatePath: 'text',
    candidateId: 'text',
    sourceKind: 'text',
    careerSummary: 'text',
    interpretation: 'text',
    path: 'text',
    anchor: 'text',
    interpretiveScope: 'text',
    candidateLedger: 'text',
    interpretationOnly: 'boolean',
    primarySourcesVerified: 'boolean',
    narrativeFit: 'text',
    sources: ['historical_source'],
    limitations: ['text_item'],
  },
  historical_source: {
    url: 'text',
    sourceType: 'text',
    accessMethod: 'text',
    accessedOn: 'text',
  },
  scope: {
    sourcePaths: ['text_item'],
    sourceCardCount: 'integer',
    excludedNames: ['text_item'],
    excludePersonIds: ['text_item'],
    excludedSourcePaths: ['text_item'],
    expectedPeople: 'integer',
  },
  exclusions_object: {
    policy: 'text',
    excludedFromTheseCards: ['named_person'],
  },
  duplicate_summary: { id: 'text', name: 'text', count: 'integer' },
  excluded_person: { personId: 'text', name: 'text', reason: 'text' },
  named_person: { personId: 'text', name: 'text' },
  text_item: 'text',
};

const required = {
  document: ['schema', 'visibility', 'status', 'assignments'],
  assignment: ['personId', 'name', 'status', 'souls', 'evidence', 'narrativeRationale', 'counterEvidence', 'evidenceStrength', 'duplicateRationale'],
  soul: ['id', 'name', 'period', 'sourceKind'],
  evidence: ['path', 'anchor', 'quote'],
  historical_source: ['url', 'sourceType', 'accessMethod', 'accessedOn'],
  scope: ['sourcePaths', 'sourceCardCount', 'excludedNames', 'excludePersonIds', 'excludedSourcePaths', 'expectedPeople'],
  exclusions_object: ['policy', 'excludedFromTheseCards'],
  duplicate_summary: ['id', 'name', 'count'],
  excluded_person: ['personId', 'name', 'reason'],
  named_person: ['personId', 'name'],
};

const comparisonRequired = [
  ['candidatePath', 'candidateId', 'sourceKind', 'careerSummary', 'interpretation', 'sources', 'limitations'],
  ['path', 'candidateId', 'careerSummary', 'interpretiveScope', 'sources', 'limitations'],
  ['candidateLedger', 'sources', 'careerSummary', 'interpretationOnly', 'primarySourcesVerified', 'limitations'],
  ['candidatePath', 'candidateId', 'careerSummary', 'sources', 'interpretation', 'limitations'],
  ['path', 'anchor', 'careerSummary', 'narrativeFit', 'sources', 'limitations'],
];

function valueOk(type, value) {
  if (type === 'text') return typeof value === 'string';
  if (type === 'boolean') return typeof value === 'boolean';
  return Number.isSafeInteger(value);
}

function authorize({ capability, scope = 'internal' } = {}) {
  if (capability !== INTERNAL_BATCHES_CAPABILITY || scope !== 'internal') fail('E_PRIVATE');
}

function writeDomain(db, domain, key, parent, ordinal, value) {
  const def = definitions[domain];
  if (domain === 'historical_source' && typeof value === 'string') {
    db.prepare(
      'INSERT INTO soul_batch_documents_historical_source (row_key,parent_key,ordinal,field_order,url,source_kind) VALUES (?,?,?,?,?,?)',
    ).run(key, parent, ordinal, '', value, 'url');
    return;
  }
  if (typeof def === 'string') {
    if (typeof value !== 'string') fail('E_BATCH_SHAPE');
    db.prepare('INSERT INTO ' + table(domain) + ' VALUES (?,?,?,?,?)').run(key, parent, ordinal, 'value', value);
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('E_BATCH_SHAPE');
  const keys = Object.keys(value);
  if (keys.some(name => !Object.hasOwn(def, name))) fail('E_BATCH_UNKNOWN_FIELD');
  const needed = domain === 'comparison'
    ? comparisonRequired.find(group => group.every(name => Object.hasOwn(value, name)))
    : (required[domain] ?? []);
  if (!needed || needed.some(name => !Object.hasOwn(value, name))) fail('E_BATCH_SHAPE');
  if (domain === 'comparison' && keys.some(name => !needed.includes(name))) fail('E_BATCH_UNKNOWN_FIELD');
  let unionKind = null;
  for (const field of keys) {
    const type = def[field];
    const child = value[field];
    if (scalar(type) && !valueOk(type, child)) fail('E_BATCH_SHAPE');
    if (type === 'counter' && typeof child !== 'string' && !(Array.isArray(child) && child.every(item => typeof item === 'string'))) fail('E_BATCH_SHAPE');
    if (typeof type === 'string' && type.startsWith('union:')) {
      const [listDomain, objectDomain] = type.slice('union:'.length).split('|');
      if (Array.isArray(child)) unionKind = { field, kind: 'array', domain: listDomain };
      else if (child && typeof child === 'object') unionKind = { field, kind: 'object', domain: objectDomain };
      else fail('E_BATCH_SHAPE');
    }
  }
  const names = Object.entries(def).filter(([, type]) => scalar(type) || type === 'counter').map(([name]) => name);
  const columns = ['row_key', 'parent_key', 'ordinal', 'field_order', ...names];
  const stored = [key, parent, ordinal, keys.join('|'), ...names.map(name => {
    if (!Object.hasOwn(value, name) || Array.isArray(value[name])) return null;
    return def[name] === 'boolean' ? Number(value[name]) : value[name];
  })];
  if (domain === 'document') { columns.push('exclusions_kind'); stored.push(unionKind?.kind ?? null); }
  if (domain === 'assignment') { columns.push('counter_kind'); stored.push(Array.isArray(value.counterEvidence) ? 'array' : 'text'); }
  if (domain === 'historical_source') { columns.push('source_kind'); stored.push('record'); }
  db.prepare('INSERT INTO ' + table(domain) + ' (' + columns.map(quote).join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')').run(...stored);
  for (const field of keys) {
    const type = def[field];
    const child = value[field];
    const childKey = key + '/' + field;
    if (Array.isArray(type)) {
      if (!Array.isArray(child)) fail('E_BATCH_SHAPE');
      child.forEach((item, index) => writeDomain(db, type[0], childKey + '/' + index, childKey, index, item));
    } else if (typeof type === 'string' && type.startsWith('union:')) {
      if (unionKind.kind === 'array') {
        child.forEach((item, index) => writeDomain(db, unionKind.domain, childKey + '/' + index, childKey, index, item));
      } else writeDomain(db, unionKind.domain, childKey, key, 0, child);
    } else if (type === 'counter' && Array.isArray(child)) {
      child.forEach((item, index) => writeDomain(db, 'text_item', childKey + '/' + index, childKey, index, item));
    } else if (!scalar(type) && type !== 'counter') writeDomain(db, type, childKey, key, 0, child);
  }
}

function readDocument(db, logicalPath, documentOrdinal) {
  const visited = new Map();
  function domainValue(domain, key, parent, ordinal) {
    const row = db.prepare('SELECT * FROM ' + table(domain) + ' WHERE row_key=?').get(key);
    if (!row || row.parent_key !== parent || row.ordinal !== ordinal) fail('E_BATCH_INTEGRITY');
    const seen = visited.get(domain) ?? new Set();
    if (seen.has(key)) fail('E_BATCH_INTEGRITY');
    seen.add(key);
    visited.set(domain, seen);
    const def = definitions[domain];
    if (typeof def === 'string') {
      if (row.field_order !== 'value' || typeof row.value !== 'string') fail('E_BATCH_INTEGRITY');
      return row.value;
    }
    if (domain === 'historical_source' && row.source_kind === 'url') {
      if (row.field_order !== '' || typeof row.url !== 'string' || row.sourceType != null || row.accessMethod != null || row.accessedOn != null) fail('E_BATCH_INTEGRITY');
      return row.url;
    }
    if (domain === 'historical_source' && row.source_kind !== 'record') fail('E_BATCH_INTEGRITY');
    const result = {};
    const fields = row.field_order === '' ? [] : row.field_order.split('|');
    if (fields.some((field, index) => !field || !Object.hasOwn(def, field) || fields.indexOf(field) !== index)) fail('E_BATCH_INTEGRITY');
    for (const field of fields) {
      const type = def[field];
      const childKey = key + '/' + field;
      if (Array.isArray(type)) {
        result[field] = readList(type[0], childKey);
      } else if (typeof type === 'string' && type.startsWith('union:')) {
        const [listDomain, objectDomain] = type.slice('union:'.length).split('|');
        if (row.exclusions_kind === 'array') result[field] = readList(listDomain, childKey);
        else if (row.exclusions_kind === 'object') result[field] = domainValue(objectDomain, childKey, key, 0);
        else fail('E_BATCH_INTEGRITY');
      } else if (type === 'counter' && row.counter_kind === 'array') {
        result[field] = readList('text_item', childKey);
      } else if (scalar(type) || type === 'counter') {
        const stored = row[field];
        if (type === 'boolean') {
          if (stored !== 0 && stored !== 1) fail('E_BATCH_INTEGRITY');
          result[field] = Boolean(stored);
        } else if ((type === 'text' || type === 'counter') && typeof stored !== 'string') fail('E_BATCH_INTEGRITY');
        else if (type === 'integer' && !Number.isSafeInteger(stored)) fail('E_BATCH_INTEGRITY');
        else result[field] = stored;
      } else result[field] = domainValue(type, childKey, key, 0);
    }
    return result;
  }
  function readList(domain, parentKey) {
    const rows = db.prepare('SELECT row_key,ordinal FROM ' + table(domain) + ' WHERE parent_key=? ORDER BY ordinal').all(parentKey);
    return rows.map((row, index) => {
      if (row.ordinal !== index || row.row_key !== parentKey + '/' + index) fail('E_BATCH_INTEGRITY');
      return domainValue(domain, row.row_key, parentKey, index);
    });
  }
  const document = domainValue('document', logicalPath, 'root', documentOrdinal);
  for (const domain of Object.keys(definitions)) {
    const actual = db.prepare('SELECT count(*) AS n FROM ' + table(domain) + " WHERE row_key=? OR row_key LIKE ? ESCAPE '\\'").get(logicalPath, logicalPath.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_') + '/%').n;
    if (actual !== (visited.get(domain)?.size ?? 0)) fail('E_BATCH_INTEGRITY');
  }
  return document;
}

/** Explicit in-memory initialization of a new private file.
 * sources maps each exact logical path to its supplied bytes. No directory scan, path dereference, migration, update,
 * partial import, or public export is provided.
 */
export function initializeSoulBatchDocuments(path, options = {}) {
  authorize(options);
  const { sources, actor, reason } = options;
  if (options.scope !== undefined && options.scope !== 'internal') fail('E_PRIVATE');
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('E_BATCH_AUDIT');
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) fail('E_BATCH_SOURCES');
  const supplied = Object.keys(sources);
  if (supplied.length !== SOURCE_PATHS.length || supplied.some(key => !SOURCE_PATHS.includes(key)) || SOURCE_PATHS.some(key => !Object.hasOwn(sources, key))) fail('E_BATCH_SOURCES');
  const prepared = SOURCE_PATHS.map(logicalPath => {
    const input = sources[logicalPath];
    if (!input || typeof input !== 'object' || Array.isArray(input) || !(input.bytes instanceof Uint8Array)) fail('E_BATCH_BYTES');
    const bytes = Buffer.from(input.bytes);
    const digest = sha(bytes);
    return { logicalPath, bytes, digest };
  });
  closeSync(openSync(path, 'wx', 0o600));
  let db;
  try {
    db = new DatabaseSync(path, { enableForeignKeyConstraints: true });
    db.exec('BEGIN IMMEDIATE');
    db.exec(schemaSql);
    db.exec('PRAGMA application_id=' + APPLICATION_ID + '; PRAGMA user_version=1');
    db.prepare('INSERT INTO soul_batch_documents_import VALUES (1,?,?,?)').run(actor, reason, new Date().toISOString());
    prepared.forEach(({ logicalPath, bytes, digest }, ordinal) => {
      const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      if (!ADMITTED_SCHEMAS.has(document.schema) || document.visibility !== 'editorial-only' || document.status !== 'narrative-assigned' || !Array.isArray(document.assignments)) fail('E_BATCH_SHAPE');
      const counted = ['assignmentCount', 'lockedAssignmentCount', 'count'].find(field => Object.hasOwn(document, field));
      if (counted && document[counted] !== document.assignments.length) fail('E_BATCH_SHAPE');
      writeDomain(db, 'document', logicalPath, 'root', ordinal, document);
      const documentHash = sha(JSON.stringify(document));
      db.prepare('INSERT INTO soul_batch_documents_source VALUES (?,?,?,?,?,?)').run(logicalPath, ordinal, bytes.length, digest, documentHash, document.assignments.length);
      db.prepare('INSERT INTO soul_batch_documents_archive VALUES (?,?,?)').run(logicalPath, digest, bytes);
      const readBack = readDocument(db, logicalPath, ordinal);
      if (sha(JSON.stringify(readBack)) !== documentHash || readBack.assignments.length !== document.assignments.length) fail('E_BATCH_INTEGRITY');
    });
    db.exec('COMMIT');
    db.close();
  } catch (error) {
    if (db?.isOpen) { if (db.isTransaction) db.exec('ROLLBACK'); db.close(); }
    unlinkSync(path);
    throw error;
  }
}

/** Read-only reopen.
 * After this returns, document reconstruction uses SELECT on typed rows only.
 */
export function openSoulBatchDocuments(path, options = {}) {
  authorize(options);
  if ((statSync(path).mode & 0o777) !== 0o600) fail('E_PRIVATE_MODE');
  const db = new DatabaseSync(path, { readOnly: true, enableForeignKeyConstraints: true });
  try {
    if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID || db.prepare('PRAGMA user_version').get().user_version !== 1) fail('E_SCHEMA');
    const sources = db.prepare('SELECT * FROM soul_batch_documents_source ORDER BY ordinal').all();
    if (sources.length !== SOURCE_PATHS.length || sources.some((row, index) => row.ordinal !== index || row.logical_path !== SOURCE_PATHS[index])) fail('E_BATCH_SOURCES');
    db.exec('PRAGMA query_only=ON');
  } catch (error) {
    db.close();
    throw error;
  }
  function readDocuments() {
    db.exec('BEGIN');
    try {
      const sources = db.prepare('SELECT * FROM soul_batch_documents_source ORDER BY ordinal').all();
      if (sources.length !== SOURCE_PATHS.length) fail('E_BATCH_INTEGRITY');
      const documents = new Map();
      for (const source of sources) {
        const document = readDocument(db, source.logical_path, source.ordinal);
        const reconstructed = sha(JSON.stringify(document));
        if (reconstructed !== source.document_sha256 || document.assignments.length !== source.assignment_count) fail('E_BATCH_INTEGRITY');
        documents.set(source.logical_path, document);
      }
      if (documents.size !== SOURCE_PATHS.length) fail('E_BATCH_INTEGRITY');
      db.exec('COMMIT');
      return documents;
    } catch (error) {
      if (db.isTransaction) db.exec('ROLLBACK');
      throw error;
    }
  }
  return Object.freeze({ close: () => db.close(), readDocuments });
}
