import { createHash } from 'node:crypto';
import { closeSync, openSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// Internal read-only snapshot of the nine soul-batch documents.
// Initialization seals caller-supplied bytes; readers query named typed rows only.
// The archive is immutable evidence, never a runtime reconstruction authority.
export const INTERNAL_BATCHES_CAPABILITY = Symbol('internal soul-batch documents');

// Fixed pins of the admitted source bytes. Not derived from the working tree.
export const SOUL_BATCH_SOURCE_HASHES = Object.freeze({
  'lore/editorial/soul-batches/special.json': 'fbc2e159a78dd1ab781601de20a29313cd1d26adf588ba0d1d7d1af7093efddc',
  'lore/editorial/soul-batches/state-01-02.json': 'd03a13218d0b995cd7fb4ea3de3098e19aa07e0bd63e2b22c61a6062ec0d9f49',
  'lore/editorial/soul-batches/state-03-04.json': '0bb06a9b7a6be4da5645c90598dfdee943c85f311485f0ebe3ae122ab95e8d54',
  'lore/editorial/soul-batches/state-05-06.json': 'e66cbcd04c28d4c484ff17bb5c26110cf1306a643ad4b436e4681fe08f47e4c8',
  'lore/editorial/soul-batches/state-07-08.json': '3857e103497b9a16aa67075ebc35ab4d568b27c0d3b5de02638e144c0bc1b232',
  'lore/editorial/soul-batches/state-09-10.json': '80d9d0276eee1d5dff824fede7701f29538f4170a5ff06e60ba4a5f446a3af99',
  'lore/editorial/soul-batches/state-11-12.json': 'a84260b4296eac8825ef880c88e79c304c538cc39e517d0f932022a57902ec76',
  'lore/editorial/soul-batches/state-13-14.json': 'f3126e9b63fda0d283b0d68af9de5cba2bcbf5fc17ae5f1d5cab14f21ab03543',
  'lore/editorial/soul-batches/state-15-16.json': 'f68a7a5853951eab5fbfb4cbaa9b0abe7068366f45a79f5c46cbdad08490e6ee',
});

// Ordered-document SHA-256 of JSON.stringify(parsed document), one constant per
// admitted path. Independent of source.document_sha256 and of the working tree.
export const SOUL_BATCH_DOCUMENT_HASHES = Object.freeze({
  'lore/editorial/soul-batches/special.json': '761e8a4d005d06f335ba309ec683921c916eab93423a3679edf8eecfb2635b0f',
  'lore/editorial/soul-batches/state-01-02.json': 'd8bd64579edd4701953b897a1f8377efffb696cef7e52055685d3bcf596a6061',
  'lore/editorial/soul-batches/state-03-04.json': 'd98cc0f72f38c1c3e5573737e6df8f787db6a5001600744b703a693e22f24dd5',
  'lore/editorial/soul-batches/state-05-06.json': '6f3df29ac9388d7f6738c69fb2445a6a576dc3eb510fc1282abe854eaacbbdf1',
  'lore/editorial/soul-batches/state-07-08.json': 'e37321a9e8dbc88610ee1aad519c2ed92cb2b939f8378a078e7a3a21f6ede96a',
  'lore/editorial/soul-batches/state-09-10.json': '6bc54a0c756161b261874d78a3e8f9444e53a2d1b44606f1a62ccc98272e559d',
  'lore/editorial/soul-batches/state-11-12.json': 'e2ad98c9b606fbd872d5bf6b50d3eb4763c6d28ac010019312b64a81c7d1a13c',
  'lore/editorial/soul-batches/state-13-14.json': '98371b7008ebfd32af621b4fc11de023451dbda3dd0d2ec3082dfad7890ff361',
  'lore/editorial/soul-batches/state-15-16.json': 'b012423686a1335f77863f2030ee435b90a7005845a9e287ed1d5e56710aeb80',
});

const APPLICATION_ID = 0x57534242;
const SOURCE_PATHS = Object.freeze(Object.keys(SOUL_BATCH_SOURCE_HASHES));
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

function pinsMatch(expectedSourceHashes) {
  if (!expectedSourceHashes || typeof expectedSourceHashes !== 'object' || Array.isArray(expectedSourceHashes)) return false;
  const keys = Object.keys(expectedSourceHashes);
  return keys.length === SOURCE_PATHS.length
    && SOURCE_PATHS.every(path => expectedSourceHashes[path] === SOUL_BATCH_SOURCE_HASHES[path])
    && keys.every(path => Object.hasOwn(SOUL_BATCH_SOURCE_HASHES, path));
}

/** Explicit in-memory initialization of a new private file.
 * sources maps each exact logical path to its supplied bytes and the digest
 * the caller expects. No directory scan, path dereference, migration, update,
 * partial import, or public export is provided.
 */
export function initializeSoulBatchDocuments(path, options = {}) {
  authorize(options);
  const { sources, actor, reason } = options;
  if (options.scope !== undefined && options.scope !== 'internal') fail('E_PRIVATE');
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('E_BATCH_AUDIT');
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) fail('E_BATCH_PINS');
  const declared = options.expectedSourceHashes ?? SOUL_BATCH_SOURCE_HASHES;
  if (!declared || typeof declared !== 'object' || Array.isArray(declared) || Object.keys(declared).length !== SOURCE_PATHS.length || SOURCE_PATHS.some(path => typeof declared[path] !== 'string')) fail('E_BATCH_PINS');
  const supplied = Object.keys(sources);
  if (supplied.length !== SOURCE_PATHS.length || supplied.some(key => !SOURCE_PATHS.includes(key)) || SOURCE_PATHS.some(key => !Object.hasOwn(sources, key))) fail('E_BATCH_PINS');
  const prepared = SOURCE_PATHS.map(logicalPath => {
    const input = sources[logicalPath];
    if (!input || typeof input !== 'object' || Array.isArray(input) || !(input.bytes instanceof Uint8Array)) fail('E_BATCH_BYTES');
    const bytes = Buffer.from(input.bytes);
    const digest = sha(bytes);
    if (typeof input.expectedSourceHash !== 'string' || digest !== input.expectedSourceHash || digest !== declared[logicalPath]) fail('E_BATCH_PINS');
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
      if (documentHash !== SOUL_BATCH_DOCUMENT_HASHES[logicalPath]) fail('E_BATCH_INTEGRITY');
      db.prepare('INSERT INTO soul_batch_documents_source VALUES (?,?,?,?,?,?)').run(logicalPath, ordinal, bytes.length, digest, documentHash, document.assignments.length);
      db.prepare('INSERT INTO soul_batch_documents_archive VALUES (?,?,?)').run(logicalPath, digest, bytes);
      const readBack = readDocument(db, logicalPath, ordinal);
      if (sha(JSON.stringify(readBack)) !== SOUL_BATCH_DOCUMENT_HASHES[logicalPath] || readBack.assignments.length !== document.assignments.length) fail('E_BATCH_INTEGRITY');
    });
    if (prepared.some(item => item.digest !== SOUL_BATCH_SOURCE_HASHES[item.logicalPath])) fail('E_BATCH_PINS');
    if (db.prepare('SELECT count(*) AS n FROM soul_batch_documents_assignment').get().n !== 1022) fail('E_BATCH_COVERAGE');
    db.exec('COMMIT');
    db.close();
  } catch (error) {
    if (db?.isOpen) { if (db.isTransaction) db.exec('ROLLBACK'); db.close(); }
    unlinkSync(path);
    throw error;
  }
}

/** Read-only reopen. expectedSourceHashes must repeat the fixed nine pins.
 * After this returns, document reconstruction uses SELECT on typed rows only.
 */
export function openSoulBatchDocuments(path, options = {}) {
  authorize(options);
  if (!pinsMatch(options.expectedSourceHashes)) fail('E_BATCH_PINS');
  if ((statSync(path).mode & 0o777) !== 0o600) fail('E_PRIVATE_MODE');
  const db = new DatabaseSync(path, { readOnly: true, enableForeignKeyConstraints: true });
  try {
    if (db.prepare('PRAGMA application_id').get().application_id !== APPLICATION_ID || db.prepare('PRAGMA user_version').get().user_version !== 1) fail('E_SCHEMA');
    const sources = db.prepare('SELECT * FROM soul_batch_documents_source ORDER BY ordinal').all();
    if (sources.length !== SOURCE_PATHS.length || sources.some((row, index) => row.ordinal !== index || row.logical_path !== SOURCE_PATHS[index] || row.source_sha256 !== SOUL_BATCH_SOURCE_HASHES[row.logical_path] || row.source_sha256 !== options.expectedSourceHashes[row.logical_path])) fail('E_BATCH_PINS');
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
        if (source.document_sha256 !== SOUL_BATCH_DOCUMENT_HASHES[source.logical_path] || reconstructed !== SOUL_BATCH_DOCUMENT_HASHES[source.logical_path] || document.assignments.length !== source.assignment_count) fail('E_BATCH_INTEGRITY');
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
