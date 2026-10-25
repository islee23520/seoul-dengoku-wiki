import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { withTransaction } from './db.mjs';

export const SCOPE_CONTRACT_SOURCE_SHA256 = '383d14c96312dcfd849cb9906b3ff16f4c2bc4c9f8ee0b93816a6d2aad333fd8';
const fail = detail => { throw new Error(`E_SCOPE_CONTRACT: ${detail}`); };
const pointer = (path, key) => `${path}/${String(key).replaceAll('~', '~0').replaceAll('/', '~1')}`;
const fields = {
  root: ['schema', 'baselineSha256', 'boundarySource', 'entities', 'documents', 'dispositions', 'rail'],
  boundary: ['path', 'sha256', 'edition'],
  entity: ['id', 'kind', 'sourcePath', 'status', 'locationRefs', 'jurisdictionRefs', 'basis', 'batchId'],
  document: ['sourcePath', 'status', 'reviewReceipt', 'batchId', 'basis'],
  review: ['currentSha256', 'evidencePath', 'reviewedAt'],
  disposition: ['set', 'id', 'status', 'targetIds', 'batchId', 'basis'],
  rail: ['stationRefs', 'edgeRefs'],
};
function shape(value, keys) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).length !== keys.length
    || keys.some(k => !Object.hasOwn(value, k))) fail('unknown or missing fields');
}
function strings(value, keys, nullable = []) {
  for (const key of keys) if (typeof value[key] !== 'string' && !(nullable.includes(key) && value[key] === null)) fail(`text required: ${key}`);
}
function refs(value) {
  if (!Array.isArray(value) || value.some(v => typeof v !== 'string')) fail('reference array required');
}
function validate(raw) {
  shape(raw, fields.root); strings(raw, ['schema', 'baselineSha256']);
  shape(raw.boundarySource, fields.boundary); strings(raw.boundarySource, fields.boundary);
  for (const key of ['entities', 'documents', 'dispositions']) if (!Array.isArray(raw[key])) fail(`${key} array required`);
  for (const entity of raw.entities) {
    shape(entity, fields.entity); strings(entity, ['id', 'kind', 'sourcePath', 'status', 'basis', 'batchId'], ['batchId']);
    refs(entity.locationRefs); refs(entity.jurisdictionRefs);
  }
  for (const document of raw.documents) {
    shape(document, fields.document); strings(document, ['sourcePath', 'status', 'batchId', 'basis'], ['batchId']);
    if (document.reviewReceipt !== null) { shape(document.reviewReceipt, fields.review); strings(document.reviewReceipt, fields.review); }
  }
  for (const disposition of raw.dispositions) {
    shape(disposition, fields.disposition); strings(disposition, ['set', 'id', 'status', 'batchId', 'basis']); refs(disposition.targetIds);
  }
  shape(raw.rail, fields.rail); refs(raw.rail.stationRefs); refs(raw.rail.edgeRefs);
}
function insert(db, table, row) {
  const keys = Object.keys(row);
  db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(row));
}
function storeKeys(db, value, path = '') {
  if (Array.isArray(value)) value.forEach((entry, index) => storeKeys(db, entry, pointer(path, index)));
  else if (value !== null && typeof value === 'object') Object.keys(value).forEach((key, ordinal) => {
    insert(db, 'scope_contract_key_order', { object_pointer: path, ordinal, key });
    storeKeys(db, value[key], pointer(path, key));
  });
}

/** Explicit migration of fixed actual source bytes; caller opens a COPY of the authority. */
export function initializeScopeContractStore(db, command) {
  shape(command, ['sourceBytes', 'expectedSha256', 'actor', 'reason']);
  strings(command, ['expectedSha256', 'actor', 'reason']);
  if (!command.actor.trim() || !command.reason.trim()) fail('actor and reason required');
  if (!(command.sourceBytes instanceof Uint8Array) || command.expectedSha256 !== SCOPE_CONTRACT_SOURCE_SHA256
    || createHash('sha256').update(command.sourceBytes).digest('hex') !== SCOPE_CONTRACT_SOURCE_SHA256) fail('fixed source byte SHA mismatch');
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) fail('foreign keys required');
  const raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(command.sourceBytes));
  validate(raw);
  return withTransaction(db, () => {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name GLOB 'scope_contract_*'").get()) fail('already initialized or partial store');
    db.exec(readFileSync(new URL('./scope-contract-store.sql', import.meta.url), 'utf8'));
    insert(db, 'scope_contract_receipt', { singleton: 1, source_path: 'lore/editorial/Seoul-Scope-Contract.json',
      source_sha256: command.expectedSha256, actor: command.actor, reason: command.reason });
    insert(db, 'scope_contract_root', { singleton: 1, schema: raw.schema, baselineSha256: raw.baselineSha256 });
    insert(db, 'scope_contract_boundary', { singleton: 1, ...raw.boundarySource });
    raw.entities.forEach((entity, ordinal) => {
      const { locationRefs, jurisdictionRefs, ...scalars } = entity;
      insert(db, 'scope_contract_entity', { ordinal, ...scalars });
      for (const [table, values] of [['scope_contract_entity_location', locationRefs], ['scope_contract_entity_jurisdiction', jurisdictionRefs]])
        values.forEach((ref, ordinal) => insert(db, table, { entity_id: entity.id, ordinal, ref }));
    });
    raw.documents.forEach((document, ordinal) => {
      const { reviewReceipt, ...scalars } = document;
      insert(db, 'scope_contract_document', { ordinal, ...scalars, review_receipt_is_null: Number(reviewReceipt === null) });
      if (reviewReceipt !== null) insert(db, 'scope_contract_document_review', { sourcePath: document.sourcePath, ...reviewReceipt });
    });
    raw.dispositions.forEach((disposition, ordinal) => {
      const { set, targetIds, ...scalars } = disposition;
      insert(db, 'scope_contract_disposition', { ordinal, disposition_set: set, ...scalars });
      targetIds.forEach((target_id, ordinal) => insert(db, 'scope_contract_disposition_target', { disposition_set: set, disposition_id: disposition.id, ordinal, target_id }));
    });
    insert(db, 'scope_contract_rail', { singleton: 1 });
    for (const [table, values] of [['scope_contract_rail_station', raw.rail.stationRefs], ['scope_contract_rail_edge', raw.rail.edgeRefs]])
      values.forEach((ref, ordinal) => insert(db, table, { ordinal, rail_id: 1, ref }));
    storeKeys(db, raw);
    const stored = readScopeContract(db);
    if (!isDeepStrictEqual(stored, raw) || JSON.stringify(stored) !== JSON.stringify(raw)) fail('full precommit round trip mismatch');
    return { sourceSha256: command.expectedSha256, entities: stored.entities.length, documents: stored.documents.length,
      dispositions: stored.dispositions.length, editable: true };
  });
}

/** SELECT only. No source path resolution, filesystem reads, JSON parsing or archive fallback. */
export function readScopeContract(db) {
  const receipt = db.prepare('SELECT * FROM scope_contract_receipt WHERE singleton=1').get();
  if (!receipt || receipt.source_sha256 !== SCOPE_CONTRACT_SOURCE_SHA256) fail('migration receipt absent or unrecognized');
  const single = table => {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length !== 1 || rows[0].singleton !== 1) fail(`missing singleton: ${table}`);
    const { singleton, ...value } = rows[0]; return value;
  };
  const ordered = rows => {
    if (rows.some((row, index) => row.ordinal !== index)) fail('noncontiguous array order');
    return rows;
  };
  const all = table => ordered(db.prepare(`SELECT * FROM ${table} ORDER BY ordinal`).all());
  const locations = db.prepare('SELECT * FROM scope_contract_entity_location ORDER BY entity_id,ordinal').all();
  const jurisdictions = db.prepare('SELECT * FROM scope_contract_entity_jurisdiction ORDER BY entity_id,ordinal').all();
  const targets = db.prepare('SELECT * FROM scope_contract_disposition_target ORDER BY disposition_set,disposition_id,ordinal').all();
  const reviews = new Map(db.prepare('SELECT * FROM scope_contract_document_review').all().map(({ sourcePath, ...review }) => [sourcePath, review]));
  const raw = { ...single('scope_contract_root'), boundarySource: single('scope_contract_boundary'),
    entities: all('scope_contract_entity').map(({ ordinal, ...entity }) => ({ ...entity,
      locationRefs: ordered(locations.filter(r => r.entity_id === entity.id)).map(r => r.ref),
      jurisdictionRefs: ordered(jurisdictions.filter(r => r.entity_id === entity.id)).map(r => r.ref) })),
    documents: all('scope_contract_document').map(({ ordinal, review_receipt_is_null, ...document }) => {
      const review = reviews.get(document.sourcePath);
      if ((review_receipt_is_null === 1) !== (review === undefined)) fail('review null marker mismatch');
      return { ...document, reviewReceipt: review ?? null };
    }),
    dispositions: all('scope_contract_disposition').map(({ ordinal, disposition_set, ...disposition }) => ({ set: disposition_set, ...disposition,
      targetIds: ordered(targets.filter(r => r.disposition_set === disposition_set && r.disposition_id === disposition.id)).map(r => r.target_id) })),
    rail: { ...single('scope_contract_rail'), stationRefs: all('scope_contract_rail_station').map(r => r.ref), edgeRefs: all('scope_contract_rail_edge').map(r => r.ref) },
  };
  const groups = new Map();
  for (const row of db.prepare('SELECT * FROM scope_contract_key_order ORDER BY object_pointer,ordinal').all()) {
    if (!groups.has(row.object_pointer)) groups.set(row.object_pointer, []);
    groups.get(row.object_pointer).push(row);
  }
  const reorder = (value, path = '') => {
    if (Array.isArray(value)) return value.map((entry, index) => reorder(entry, pointer(path, index)));
    if (value === null || typeof value !== 'object') return value;
    const keys = groups.get(path);
    if (!keys || keys.length !== Object.keys(value).length || keys.some((r, index) => r.ordinal !== index || !Object.hasOwn(value, r.key))) fail(`key order mismatch: ${path}`);
    groups.delete(path);
    return Object.fromEntries(keys.map(({ key }) => [key, reorder(value[key], pointer(path, key))]));
  };
  const result = reorder(raw);
  if (groups.size) fail('orphan key order rows');
  validate(result);
  return result;
}
