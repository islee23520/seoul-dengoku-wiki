import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { withTransaction } from './db.mjs';

const rootFields = 'schema status officialExtentStatus kingdomStatus mapMinimumRank';
const titleFields = 'titleId rank name sourcePointer feudalParentTitleId? feudalParentStatus';
const slotFields = 'slotId dongId name jurisdictionGuRef electoralDongId fragmentId? sourceEdition sourcePointer geometryVerified! status holderPersonId?';
const holdingFields = 'id sourcePath jsonPointer sourceSha256 recordSha256 scopeKind status';
const spatialFields = 'edition baseDate authority legalSurveyCertification! current2026Geometry! archiveSha256';
const successorFields = 'schema batchId previousSha256 beforeArchivePath partitionSha256 crossDistrictParentPolicy';
const editionFields = {
  electoral: 'id electionDate seoulCompositionMatchesCurrentAppendix!',
  currentLaw: 'id lawNumber# promulgatedDate effectiveDate appendixAmendedDate appendixFileSeq#',
  currentCorrespondence: 'id administrativeCandidateDate officialMembershipCheckedAt codeAndNameSourceRef geometryVerified!',
};
const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const tokens = fields => fields.split(' ').filter(Boolean);
const fieldName = field => field.replace(/[?!#]$/, '');
function shape(value, fields, children = [], optional = []) {
  const required = [...tokens(fields).map(fieldName), ...children];
  if (!value || Object.getPrototypeOf(value) !== Object.prototype
    || required.some(key => !Object.hasOwn(value, key))
    || Object.keys(value).some(key => ![...required, ...optional].includes(key))) fail('E_GEOGRAPHY_FIELDS', required.join(','));
  for (const token of tokens(fields)) {
    const v = value[fieldName(token)];
    const valid = token.endsWith('!') ? typeof v === 'boolean'
      : token.endsWith('#') ? Number.isSafeInteger(v)
        : token.endsWith('?') ? v === null || typeof v === 'string' : typeof v === 'string';
    if (!valid) fail('E_GEOGRAPHY_TYPE', token);
  }
}
function array(value, fn) {
  if (!Array.isArray(value)) fail('E_GEOGRAPHY_TYPE', 'array required');
  value.forEach(fn);
}
const stringArray = value => array(value, ref => { if (typeof ref !== 'string') fail('E_GEOGRAPHY_TYPE', 'reference must be text'); });
function validate(document) {
  shape(document, rootFields, ['evidence', 'editions', 'sourceRecords', 'mapTitleIds', 'titles', 'countySlots', 'spatialSource', 'currentCorrespondenceSlots', 'successor']);
  shape(document.evidence, '', ['membership', 'census', 'rights', 'spatial']);
  for (const e of Object.values(document.evidence)) shape(e, 'path sha256');
  shape(document.editions, '', Object.keys(editionFields));
  for (const [kind, fields] of Object.entries(editionFields)) {
    shape(document.editions[kind], fields, ['sourceRefs']); stringArray(document.editions[kind].sourceRefs);
  }
  array(document.sourceRecords, r => shape(r, 'id sha256 role'));
  stringArray(document.mapTitleIds);
  array(document.titles, t => {
    shape(t, titleFields, ['jurisdictionRefs', 'sourceRefs'], ['geographicParentException', 'countyTitleIds', 'holderPersonId']);
    stringArray(t.jurisdictionRefs); stringArray(t.sourceRefs);
    if (Object.hasOwn(t, 'geographicParentException') && typeof t.geographicParentException !== 'string') fail('E_GEOGRAPHY_TYPE', 'geographicParentException');
    if (Object.hasOwn(t, 'countyTitleIds')) stringArray(t.countyTitleIds);
    if (Object.hasOwn(t, 'holderPersonId') && t.holderPersonId !== null && typeof t.holderPersonId !== 'string') fail('E_GEOGRAPHY_TYPE', 'holderPersonId');
  });
  for (const [key, current] of [['countySlots', false], ['currentCorrespondenceSlots', true]]) array(document[key], c => {
    shape(c, 'countyTitleId', ['slots']);
    array(c.slots, s => {
      shape(s, slotFields, ['sourceRefs', 'geometryRefs', 'historicalHoldingRefs', 'holdingRefs', current ? 'candidateGeometryRefs' : 'currentCorrespondenceSlotIds']);
      for (const field of ['sourceRefs', 'geometryRefs', current ? 'candidateGeometryRefs' : 'currentCorrespondenceSlotIds']) stringArray(s[field]);
      array(s.historicalHoldingRefs, h => shape(h, holdingFields));
      array(s.holdingRefs, () => fail('E_GEOGRAPHY_RIGHTS', 'current holding reference shape not admitted'));
    });
  });
  shape(document.spatialSource, spatialFields, ['geometry']);
  shape(document.spatialSource.geometry, 'path sha256 crs features#');
  shape(document.successor, successorFields, ['proposal', 'approval', 'partition']);
  shape(document.successor.proposal, 'path sha256'); shape(document.successor.approval, 'path sha256');
  array(document.successor.partition, p => {
    shape(p, 'titleId proposalId name', ['jurisdictionRefs', 'countyTitleIds']); stringArray(p.jurisdictionRefs); stringArray(p.countyTitleIds);
  });
}
function insert(db, table, row) {
  const columns = Object.keys(row);
  db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...Object.values(row));
}
function pick(value, fields) {
  return Object.fromEntries(tokens(fields).map(token => {
    const key = fieldName(token); return [key, token.endsWith('!') ? Number(value[key]) : value[key]];
  }));
}
function refs(db, table, owner, values) {
  values.forEach((ref, ordinal) => insert(db, table, { ...owner, ordinal, ref }));
}

/** Explicit one-time import. This records supplied approval evidence, never grants approval. */
export function initializeGeographyStore(db, command) {
  shape(command, 'expectedSha256 actor reason', ['approvedBytes']);
  if (!command.actor.trim() || !command.reason.trim()) fail('E_GEOGRAPHY_PROVENANCE', 'actor and reason required');
  if (!(command.approvedBytes instanceof Uint8Array) || hash(command.approvedBytes) !== command.expectedSha256) fail('E_GEOGRAPHY_HASH', 'approved bytes mismatch');
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) fail('E_GEOGRAPHY_DATABASE', 'foreign keys required');
  const bytes = Buffer.from(command.approvedBytes);
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  validate(document);
  return withTransaction(db, () => {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='geography_archive'").get()) fail('E_GEOGRAPHY_INITIALIZED', 'one-time import already performed');
    db.exec(readFileSync(new URL('./geography-store.sql', import.meta.url), 'utf8'));
    insert(db, 'geography_archive', { singleton: 1, bytes, sha256: command.expectedSha256, actor: command.actor, reason: command.reason });
    insert(db, 'geography_metadata', { singleton: 1, ...pick(document, rootFields) });
    for (const [kind, e] of Object.entries(document.evidence)) insert(db, 'geography_evidence', { kind, ...e });
    for (const [kind, fields] of Object.entries(editionFields)) {
      insert(db, 'geography_edition', { kind, ...pick(document.editions[kind], fields) });
      refs(db, 'geography_edition_source', { kind }, document.editions[kind].sourceRefs);
    }
    document.sourceRecords.forEach((r, ordinal) => insert(db, 'geography_source_record', { ordinal, ...r }));
    document.titles.forEach((t, ordinal) => {
      insert(db, 'geography_title', {
        ordinal, ...pick(t, titleFields), geographicParentException: t.geographicParentException ?? null,
        hasCountyTitleIds: Number(Object.hasOwn(t, 'countyTitleIds')), hasHolderPersonId: Number(Object.hasOwn(t, 'holderPersonId')), holderPersonId: t.holderPersonId ?? null
      });
      refs(db, 'geography_title_jurisdiction', { titleId: t.titleId }, t.jurisdictionRefs);
      refs(db, 'geography_title_source', { titleId: t.titleId }, t.sourceRefs);
      refs(db, 'geography_title_county', { titleId: t.titleId }, t.countyTitleIds ?? []);
    });
    refs(db, 'geography_map_title', {}, document.mapTitleIds);
    for (const [edition, key] of [['dated', 'countySlots'], ['current', 'currentCorrespondenceSlots']]) document[key].forEach((c, ordinal) => {
      insert(db, 'geography_county', { edition, countyTitleId: c.countyTitleId, ordinal });
      c.slots.forEach((s, index) => {
        insert(db, 'geography_slot', { edition, countyTitleId: c.countyTitleId, ordinal: index, ...pick(s, slotFields) });
        const owner = { edition, slotId: s.slotId };
        refs(db, 'geography_slot_source', owner, s.sourceRefs); refs(db, 'geography_slot_geometry', owner, s.geometryRefs);
        if (edition === 'current') refs(db, 'geography_slot_candidate_geometry', owner, s.candidateGeometryRefs);
        else refs(db, 'geography_slot_correspondence', { ...owner, targetEdition: 'current' }, s.currentCorrespondenceSlotIds);
        s.historicalHoldingRefs.forEach((h, ordinal) => insert(db, 'geography_slot_historical_holding', { ...owner, ordinal, ...h }));
      });
    });
    insert(db, 'geography_spatial', { singleton: 1, ...pick(document.spatialSource, spatialFields) });
    insert(db, 'geography_spatial_geometry', { singleton: 1, ...document.spatialSource.geometry });
    insert(db, 'geography_successor', { singleton: 1, ...pick(document.successor, successorFields) });
    for (const kind of ['proposal', 'approval']) insert(db, 'geography_successor_pointer', { kind, ...document.successor[kind] });
    document.successor.partition.forEach((p, ordinal) => {
      insert(db, 'geography_partition', { ordinal, ...pick(p, 'titleId proposalId name') });
      refs(db, 'geography_partition_jurisdiction', { titleId: p.titleId }, p.jurisdictionRefs);
      refs(db, 'geography_partition_county', { titleId: p.titleId }, p.countyTitleIds);
    });
    insert(db, 'geography_seal', { singleton: 1 });
    for (const { name } of db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name GLOB 'geography_*'").all()) {
      for (const operation of ['INSERT', 'UPDATE', 'DELETE']) db.exec(`CREATE TRIGGER ${name}_immutable_${operation} BEFORE ${operation} ON ${name} BEGIN SELECT RAISE(ABORT,'immutable geography authority'); END`);
    }
    return {
      sourceSha256: command.expectedSha256, titles: document.titles.length,
      datedSlots: document.countySlots.reduce((n, c) => n + c.slots.length, 0),
      currentSlots: document.currentCorrespondenceSlots.reduce((n, c) => n + c.slots.length, 0), editable: false
    };
  });
}

/** Internal only. Reconstruct solely from relational rows, not archived bytes or files. */
export function readGeographyStore(db) {
  if (!db.prepare('SELECT 1 FROM geography_seal WHERE singleton=1').get()) fail('E_GEOGRAPHY_UNSEALED', 'sealed authority required');
  const one = table => db.prepare(`SELECT * FROM ${table} WHERE singleton=1`).get();
  const rows = (table, owner = {}) => {
    const keys = Object.keys(owner);
    return db.prepare(`SELECT * FROM ${table}${keys.length ? ` WHERE ${keys.map(k => `${k}=?`).join(' AND ')}` : ''} ORDER BY ordinal`).all(...Object.values(owner));
  };
  const references = (table, owner) => rows(table, owner).map(r => r.ref);
  const fields = (row, spec) => Object.fromEntries(tokens(spec).map(token => {
    const key = fieldName(token); return [key, token.endsWith('!') ? Boolean(row[key]) : row[key]];
  }));
  const document = fields(one('geography_metadata'), rootFields);
  document.evidence = Object.fromEntries(db.prepare('SELECT * FROM geography_evidence').all().map(e => [e.kind, fields(e, 'path sha256')]));
  document.editions = Object.fromEntries(Object.entries(editionFields).map(([kind, spec]) => [kind, {
    ...fields(db.prepare('SELECT * FROM geography_edition WHERE kind=?').get(kind), spec), sourceRefs: references('geography_edition_source', { kind }),
  }]));
  document.sourceRecords = rows('geography_source_record').map(r => fields(r, 'id sha256 role'));
  document.mapTitleIds = references('geography_map_title');
  document.titles = rows('geography_title').map(t => {
    const owner = { titleId: t.titleId };
    const result = { ...fields(t, titleFields), jurisdictionRefs: references('geography_title_jurisdiction', owner), sourceRefs: references('geography_title_source', owner) };
    if (t.geographicParentException !== null) result.geographicParentException = t.geographicParentException;
    if (t.hasCountyTitleIds) result.countyTitleIds = references('geography_title_county', owner);
    if (t.hasHolderPersonId) result.holderPersonId = t.holderPersonId;
    return result;
  });
  for (const [edition, key] of [['dated', 'countySlots'], ['current', 'currentCorrespondenceSlots']]) document[key] = rows('geography_county', { edition }).map(c => ({
    countyTitleId: c.countyTitleId,
    slots: rows('geography_slot', { edition, countyTitleId: c.countyTitleId }).map(s => {
      const owner = { edition, slotId: s.slotId };
      return {
        ...fields(s, slotFields), sourceRefs: references('geography_slot_source', owner), geometryRefs: references('geography_slot_geometry', owner),
        ...(edition === 'current' ? { candidateGeometryRefs: references('geography_slot_candidate_geometry', owner) }
          : { currentCorrespondenceSlotIds: references('geography_slot_correspondence', owner) }),
        historicalHoldingRefs: rows('geography_slot_historical_holding', owner).map(h => fields(h, holdingFields)),
        holdingRefs: references('geography_slot_holding', owner)
      };
    }),
  }));
  document.spatialSource = { ...fields(one('geography_spatial'), spatialFields), geometry: fields(one('geography_spatial_geometry'), 'path sha256 crs features#') };
  document.successor = fields(one('geography_successor'), successorFields);
  for (const kind of ['proposal', 'approval']) document.successor[kind] = fields(db.prepare('SELECT * FROM geography_successor_pointer WHERE kind=?').get(kind), 'path sha256');
  document.successor.partition = rows('geography_partition').map(p => ({
    ...fields(p, 'titleId proposalId name'),
    jurisdictionRefs: references('geography_partition_jurisdiction', { titleId: p.titleId }), countyTitleIds: references('geography_partition_county', { titleId: p.titleId })
  }));
  return document;
}

/** Async PostgreSQL twin; reconstructs the same relational authority through one transaction handle. */
export async function readGeographyStoreAsync(tx) {
  if (!await tx.get('SELECT 1 FROM wiki.geography_seal WHERE singleton=1')) fail('E_GEOGRAPHY_UNSEALED', 'sealed authority required');
  const one = table => tx.get(`SELECT * FROM wiki.${table} WHERE singleton=1`);
  const rows = (table, owner = {}) => {
    const keys = Object.keys(owner);
    return tx.all(`SELECT * FROM wiki.${table}${keys.length ? ` WHERE ${keys.map(k => `"${k}"=?`).join(' AND ')}` : ''} ORDER BY ordinal`, Object.values(owner));
  };
  const references = async (table, owner) => (await rows(table, owner)).map(r => r.ref);
  const fields = (row, spec) => Object.fromEntries(tokens(spec).map(token => {
    const key = fieldName(token); return [key, token.endsWith('!') ? Boolean(row[key]) : row[key]];
  }));
  const document = fields(await one('geography_metadata'), rootFields);
  document.evidence = Object.fromEntries((await tx.all('SELECT * FROM wiki.geography_evidence')).map(e => [e.kind, fields(e, 'path sha256')]));
  document.editions = {};
  for (const [kind, spec] of Object.entries(editionFields)) document.editions[kind] = {
    ...fields(await tx.get('SELECT * FROM wiki.geography_edition WHERE kind=?', [kind]), spec),
    sourceRefs: await references('geography_edition_source', { kind }),
  };
  document.sourceRecords = (await rows('geography_source_record')).map(r => fields(r, 'id sha256 role'));
  document.mapTitleIds = await references('geography_map_title');
  document.titles = [];
  for (const t of await rows('geography_title')) {
    const owner = { titleId: t.titleId };
    const result = {
      ...fields(t, titleFields), jurisdictionRefs: await references('geography_title_jurisdiction', owner),
      sourceRefs: await references('geography_title_source', owner)
    };
    if (t.geographicParentException !== null) result.geographicParentException = t.geographicParentException;
    if (t.hasCountyTitleIds) result.countyTitleIds = await references('geography_title_county', owner);
    if (t.hasHolderPersonId) result.holderPersonId = t.holderPersonId;
    document.titles.push(result);
  }
  for (const [edition, key] of [['dated', 'countySlots'], ['current', 'currentCorrespondenceSlots']]) {
    document[key] = [];
    for (const c of await rows('geography_county', { edition })) {
      const county = { countyTitleId: c.countyTitleId, slots: [] };
      for (const s of await rows('geography_slot', { edition, countyTitleId: c.countyTitleId })) {
        const owner = { edition, slotId: s.slotId };
        county.slots.push({
          ...fields(s, slotFields), sourceRefs: await references('geography_slot_source', owner),
          geometryRefs: await references('geography_slot_geometry', owner),
          ...(edition === 'current' ? { candidateGeometryRefs: await references('geography_slot_candidate_geometry', owner) }
            : { currentCorrespondenceSlotIds: await references('geography_slot_correspondence', owner) }),
          historicalHoldingRefs: (await rows('geography_slot_historical_holding', owner)).map(h => fields(h, holdingFields)),
          holdingRefs: await references('geography_slot_holding', owner)
        });
      }
      document[key].push(county);
    }
  }
  document.spatialSource = {
    ...fields(await one('geography_spatial'), spatialFields),
    geometry: fields(await one('geography_spatial_geometry'), 'path sha256 crs features#')
  };
  document.successor = fields(await one('geography_successor'), successorFields);
  for (const kind of ['proposal', 'approval']) document.successor[kind] = fields(
    await tx.get('SELECT * FROM wiki.geography_successor_pointer WHERE kind=?', [kind]), 'path sha256');
  document.successor.partition = [];
  for (const p of await rows('geography_partition')) document.successor.partition.push({
    ...fields(p, 'titleId proposalId name'),
    jurisdictionRefs: await references('geography_partition_jurisdiction', { titleId: p.titleId }),
    countyTitleIds: await references('geography_partition_county', { titleId: p.titleId })
  });
  return document;
}

/** There is deliberately no partial edit or approval API in the immutable unit. */
export function updateGeographyStore() {
  fail('E_GEOGRAPHY_READ_ONLY', 'name, topology, rights and approval edits are not supported');
}
