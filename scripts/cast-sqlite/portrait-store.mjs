import { readFileSync, renameSync, unlinkSync } from 'node:fs';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { verifyPortraitRegistration, verifyPortraitReplacement } from '../apply-approved-portrait-selection.mjs';
import { createHash } from 'node:crypto';
import { withTransaction } from './db.mjs';
import { portraitSelectionFailures } from '../portrait-public-boundary.mjs';

const kinds = ['catalog', 'properties', 'selection'];
const slots = {
  face: ['description', 'faceShape', 'eyeColor', 'eyeShape', 'eyebrowShape', 'lipColor', 'mouthShape', 'noseShape', 'beardShape'],
  hair: ['description', 'shape', 'color', 'length'],
  body: ['build', 'weight', 'height', 'bustSize', 'skin'],
  outfit: ['headwear', 'upper', 'lower', 'footwear', 'marks', 'neckline'],
  accessories: ['description', 'shape', 'color', 'material', 'mounting'],
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const currentTables = ['portrait_person', 'portrait_catalog', 'portrait_properties', 'portrait_identity', 'portrait_identity_evidence', 'portrait_slot_group', 'portrait_slot_evidence', 'portrait_selection', 'portrait_document', 'portrait_key_order'];
function seal(db, table) {
  for (const op of ['INSERT', 'UPDATE', 'DELETE']) db.exec(`CREATE TRIGGER ${table}_sealed_${op} BEFORE ${op} ON ${table} BEGIN SELECT RAISE(ABORT,'E_PORTRAIT_READ_ONLY'); END`);
}
function snapshot(db, revision) {
  for (const table of currentTables) db.exec(`INSERT INTO ${table}_history SELECT ${revision}, * FROM ${table}`);
}
function shape(value, required, optional = []) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype
    || required.some(k => !Object.hasOwn(value, k))
    || Object.keys(value).some(k => ![...required, ...optional].includes(k))) fail('E_PORTRAIT_FIELDS', required.join(','));
}
function text(v, nullable = false) {
  if (!(typeof v === 'string' || (nullable && v === null))) fail('E_PORTRAIT_TYPE', 'text required');
}
function evidence(v, unit = false) {
  shape(v, ['value', 'status', 'source'], unit ? ['unit'] : []);
  text(v.value, true); text(v.status); text(v.source, true);
  if (Object.hasOwn(v, 'unit')) text(v.unit, true);
}
function identity(v) {
  shape(v, ['characterId', 'name', 'ethnicity', 'origin', 'gender', 'ageCategory']);
  for (const k of ['characterId', 'name', 'gender', 'ageCategory']) text(v[k]);
  evidence(v.ethnicity); evidence(v.origin);
}
function validate(docs) {
  const { catalog, properties, selection } = docs;
  shape(catalog, ['schemaVersion', 'status', 'styleSource', 'entries']);
  shape(properties, ['schemaVersion', 'status', 'entries']);
  shape(selection, ['schemaVersion', 'status', 'canonPromotion', 'final3dPortraitContractSatisfied', 'previousVerdictsPreserved', 'records']);
  for (const d of Object.values(docs)) {
    if (d.schemaVersion !== 1) fail('E_PORTRAIT_VERSION', 'schemaVersion');
    text(d.status);
  }
  text(catalog.styleSource);
  if (!Array.isArray(catalog.entries) || !Array.isArray(selection.records)) fail('E_PORTRAIT_TYPE', 'entries/records');
  shape(properties.entries, [], Object.keys(properties.entries ?? {}));
  const people = new Map(); const characters = new Set();
  for (const c of catalog.entries) {
    shape(c, ['personId', 'characterId', 'name', 'stateId', 'approval', 'imageSha256']);
    for (const k of ['personId', 'characterId', 'name', 'approval']) text(c[k]);
    text(c.stateId, true);
    if (!/^person-\d{4}$/.test(c.personId) || !/^K\d{3,4}$/.test(c.characterId)
      || !/^[a-f0-9]{64}$/.test(c.imageSha256) || people.has(c.personId) || characters.has(c.characterId)) fail('E_PORTRAIT_IDENTITY', 'catalog identity/hash');
    people.set(c.personId, c); characters.add(c.characterId);
  }
  if (people.size !== Object.keys(properties.entries).length) fail('E_PORTRAIT_IDENTITY', 'properties coverage');
  for (const [id, p] of Object.entries(properties.entries)) {
    if (!people.has(id)) fail('E_PORTRAIT_IDENTITY', id);
    shape(p, ['face', 'hair', 'upper'], ['identity', 'slots']);
    for (const k of ['face', 'hair', 'upper']) text(p[k]);
    if (Object.hasOwn(p, 'identity')) {
      identity(p.identity);
      if (p.identity.characterId !== people.get(id).characterId || p.identity.name !== people.get(id).name) fail('E_PORTRAIT_IDENTITY', id);
    }
    if (Object.hasOwn(p, 'slots')) {
      shape(p.slots, Object.keys(slots));
      for (const [slot, fields] of Object.entries(slots)) {
        shape(p.slots[slot], fields);
        for (const f of fields) evidence(p.slots[slot][f], slot === 'body' && ['weight', 'height'].includes(f));
      }
    }
  }
  if (portraitSelectionFailures(selection).length || selection.canonPromotion !== false
    || selection.final3dPortraitContractSatisfied !== false || typeof selection.previousVerdictsPreserved !== 'boolean') fail('E_PORTRAIT_SELECTION', 'public selection contract');
  const seen = new Set();
  for (const s of selection.records) {
    shape(s, ['personId', 'characterId', 'name', 'imageSha256', 'verdict', 'operation'], ['previousImageSha256']);
    const c = people.get(s.personId);
    if (!c || seen.has(s.personId) || s.characterId !== c.characterId || s.name !== c.name
      || s.imageSha256 !== c.imageSha256 || s.verdict !== 'pass'
      || !['preserve-existing', 'body-improvement', 'localized-alpha-edit', 'register-approved'].includes(s.operation)) fail('E_PORTRAIT_SELECTION', s.personId);
    if (s.operation !== 'register-approved' && !Object.hasOwn(s, 'previousImageSha256')) fail('E_PORTRAIT_SELECTION', 'previous image required');
    if (s.operation === 'preserve-existing' && s.previousImageSha256 !== s.imageSha256) fail('E_PORTRAIT_SELECTION', 'preserved image mismatch');
    seen.add(s.personId);
  }
}
function insert(db, table, row) {
  const keys = Object.keys(row);
  db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(row));
}
function keyOrder(db, kind, owner, object) {
  Object.keys(object).forEach((field, ordinal) => insert(db, 'portrait_key_order', { kind, owner, ordinal, field }));
}
function storeEvidence(db, table, owner, value) {
  insert(db, table, { ...owner, value: value.value, status: value.status, source: value.source,
    ...(table === 'portrait_slot_evidence' ? { hasUnit: Number(Object.hasOwn(value, 'unit')), unit: value.unit ?? null } : {}) });
}

/** One-time import from caller-owned memory. No paths or automatic source reads. */
export function initializePortraitStore(db, command) {
  shape(command, ['catalog', 'properties', 'selection']);
  const docs = {}; const sources = {};
  for (const kind of kinds) {
    const s = command[kind];
    shape(s, ['bytes', 'expectedSha256', 'actor', 'reason']);
    text(s.actor); text(s.reason);
    if (!s.actor.trim() || !s.reason.trim()) fail('E_PORTRAIT_PROVENANCE', kind);
    if (!(s.bytes instanceof Uint8Array) || hash(s.bytes) !== s.expectedSha256) fail('E_PORTRAIT_HASH', kind);
    sources[kind] = { ...s, bytes: Buffer.from(s.bytes) };
    docs[kind] = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(s.bytes));
  }
  validate(docs);
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) fail('E_PORTRAIT_DATABASE', 'foreign keys required');
  return withTransaction(db, () => {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='portrait_archive'").get()) fail('E_PORTRAIT_INITIALIZED', 'already initialized');
    db.exec(readFileSync(new URL('./portrait-store.sql', import.meta.url), 'utf8'));
    for (const kind of kinds) {
      const s = sources[kind]; const d = docs[kind];
      insert(db, 'portrait_archive', { kind, bytes: s.bytes, sha256: s.expectedSha256, actor: s.actor, reason: s.reason });
      insert(db, 'portrait_document', { kind, schemaVersion: d.schemaVersion, status: d.status,
        styleSource: d.styleSource ?? null, canonPromotion: kind === 'selection' ? Number(d.canonPromotion) : null,
        final3dPortraitContractSatisfied: kind === 'selection' ? Number(d.final3dPortraitContractSatisfied) : null,
        previousVerdictsPreserved: kind === 'selection' ? Number(d.previousVerdictsPreserved) : null,
        entryCount: kind === 'selection' ? d.records.length : kind === 'catalog' ? d.entries.length : Object.keys(d.entries).length,
        currentSha256: hash(JSON.stringify(d)) });
      keyOrder(db, kind, '', d);
    }
    const hasPerson = !!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='person'").get();
    if (hasPerson) db.exec('CREATE TABLE portrait_existing_person (personId TEXT PRIMARY KEY REFERENCES portrait_person(personId), existingPersonId TEXT NOT NULL UNIQUE REFERENCES person(person_id)) STRICT');
    docs.catalog.entries.forEach((c, ordinal) => {
      insert(db, 'portrait_person', { personId: c.personId, characterId: c.characterId, name: c.name });
      if (hasPerson) {
        const person = db.prepare('SELECT person_id,name FROM person WHERE public_key=?').get(c.personId);
        if (person) {
          if (person.name !== c.name) fail('E_PORTRAIT_IDENTITY', 'existing person mismatch');
          insert(db, 'portrait_existing_person', { personId: c.personId, existingPersonId: person.person_id });
        }
      }
      insert(db, 'portrait_catalog', { personId: c.personId, ordinal, stateId: c.stateId, approval: c.approval, imageSha256: c.imageSha256 });
      keyOrder(db, 'catalog', c.personId, c);
    });
    Object.entries(docs.properties.entries).forEach(([personId, p], ordinal) => {
      insert(db, 'portrait_properties', { personId, ordinal, face: p.face, hair: p.hair, upper: p.upper, hasIdentity: Number(Object.hasOwn(p, 'identity')), hasSlots: Number(Object.hasOwn(p, 'slots')) });
      keyOrder(db, 'properties', personId, p);
      if (p.identity) {
        const i = p.identity;
        insert(db, 'portrait_identity', { personId, characterId: i.characterId, name: i.name, gender: i.gender, ageCategory: i.ageCategory });
        keyOrder(db, 'properties', personId + '/identity', i);
        for (const field of ['ethnicity', 'origin']) {
          storeEvidence(db, 'portrait_identity_evidence', { personId, field }, i[field]);
          keyOrder(db, 'properties', personId + '/identity/' + field, i[field]);
        }
      }
      if (p.slots) Object.entries(p.slots).forEach(([slot, group], ordinal) => {
        insert(db, 'portrait_slot_group', { personId, slot, ordinal });
        Object.entries(group).forEach(([field, e], ordinal) => {
          storeEvidence(db, 'portrait_slot_evidence', { personId, slot, field, ordinal }, e);
          keyOrder(db, 'properties', personId + '/slots/' + slot + '/' + field, e);
        });
      });
    });
    docs.selection.records.forEach((s, ordinal) => {
      insert(db, 'portrait_selection', { personId: s.personId, ordinal, imageSha256: s.imageSha256,
        hasPrevious: Number(Object.hasOwn(s, 'previousImageSha256')), previousImageSha256: s.previousImageSha256 ?? null,
        verdict: s.verdict, operation: s.operation });
      keyOrder(db, 'selection', s.personId, s);
    });
    insert(db, 'portrait_seal', { singleton: 1, revision: 1 });
    insert(db, 'portrait_revision', { revision: 1, actor: sources.catalog.actor, reason: sources.catalog.reason });
    for (const table of currentTables) {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(c => `${c.name} ${c.type}`);
      db.exec(`CREATE TABLE ${table}_history (revision INTEGER NOT NULL REFERENCES portrait_revision(revision), ${columns.join(',')}) STRICT`);
    }
    snapshot(db, 1);
    for (const { name } of db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name GLOB 'portrait_*'").all()) {
      seal(db, name);
    }
    readPortraitDocuments(db);
    return { revision: 1, catalog: docs.catalog.entries.length, properties: Object.keys(docs.properties.entries).length, selection: docs.selection.records.length, readOnly: true };
  });
}

/** Reconstruct current documents exclusively from typed rows, never archive JSON. */
export function readPortraitDocuments(db) {
  if (db.prepare('SELECT count(*) AS n FROM portrait_seal WHERE singleton=1 AND revision>=1').get().n !== 1) fail('E_PORTRAIT_INCOMPLETE', 'seal');
  const order = (kind, owner, object) => {
    const keys = db.prepare('SELECT field FROM portrait_key_order WHERE kind=? AND owner=? ORDER BY ordinal').all(kind, owner).map(r => r.field);
    if (keys.length !== Object.keys(object).length || keys.some(k => !Object.hasOwn(object, k))) fail('E_PORTRAIT_INCOMPLETE', 'key order');
    return Object.fromEntries(keys.map(k => [k, object[k]]));
  };
  const ev = (owner, row, unit = false) => {
    if (!row) fail('E_PORTRAIT_INCOMPLETE', owner);
    return order('properties', owner, { value: row.value, status: row.status, source: row.source, ...(unit && row.hasUnit ? { unit: row.unit } : {}) });
  };
  const docs = {};
  for (const kind of kinds) {
    const d = db.prepare('SELECT * FROM portrait_document WHERE kind=?').get(kind);
    if (!d) fail('E_PORTRAIT_INCOMPLETE', kind);
    let body;
    if (kind === 'catalog') body = db.prepare('SELECT c.*,p.characterId,p.name FROM portrait_catalog c JOIN portrait_person p USING(personId) ORDER BY ordinal').all().map(c => order(kind, c.personId, {
      personId: c.personId, characterId: c.characterId, name: c.name, stateId: c.stateId, approval: c.approval, imageSha256: c.imageSha256,
    }));
    if (kind === 'properties') body = Object.fromEntries(db.prepare('SELECT * FROM portrait_properties ORDER BY ordinal').all().map(p => {
      const value = { face: p.face, hair: p.hair, upper: p.upper };
      if (p.hasIdentity) {
        const i = db.prepare('SELECT * FROM portrait_identity WHERE personId=?').get(p.personId);
        if (!i) fail('E_PORTRAIT_INCOMPLETE', 'identity');
        value.identity = order(kind, p.personId + '/identity', { characterId: i.characterId, name: i.name, gender: i.gender, ageCategory: i.ageCategory,
          ...Object.fromEntries(['ethnicity', 'origin'].map(field => [field, ev(p.personId + '/identity/' + field, db.prepare('SELECT * FROM portrait_identity_evidence WHERE personId=? AND field=?').get(p.personId, field))])) });
      }
      if (p.hasSlots) value.slots = Object.fromEntries(db.prepare('SELECT * FROM portrait_slot_group WHERE personId=? ORDER BY ordinal').all(p.personId).map(g => [g.slot,
        Object.fromEntries(db.prepare('SELECT * FROM portrait_slot_evidence WHERE personId=? AND slot=? ORDER BY ordinal').all(p.personId, g.slot).map(e => [e.field, ev(p.personId + '/slots/' + g.slot + '/' + e.field, e, true)]))]));
      return [p.personId, order(kind, p.personId, value)];
    }));
    if (kind === 'selection') body = db.prepare('SELECT s.*,p.characterId,p.name FROM portrait_selection s JOIN portrait_person p USING(personId) ORDER BY ordinal').all().map(s => order(kind, s.personId, {
      personId: s.personId, characterId: s.characterId, name: s.name, imageSha256: s.imageSha256,
      ...(s.hasPrevious ? { previousImageSha256: s.previousImageSha256 } : {}), verdict: s.verdict, operation: s.operation,
    }));
    const size = kind === 'properties' ? Object.keys(body).length : body.length;
    if (size !== d.entryCount) fail('E_PORTRAIT_INCOMPLETE', kind + ' count');
    docs[kind] = order(kind, '', { schemaVersion: d.schemaVersion, status: d.status,
      ...(kind === 'catalog' ? { styleSource: d.styleSource } : {}),
      ...(kind === 'selection' ? { canonPromotion: Boolean(d.canonPromotion), final3dPortraitContractSatisfied: Boolean(d.final3dPortraitContractSatisfied), previousVerdictsPreserved: Boolean(d.previousVerdictsPreserved), records: body } : { entries: body }) });
    if (hash(JSON.stringify(docs[kind])) !== d.currentSha256) fail('E_PORTRAIT_INCOMPLETE', kind + ' digest');
  }
  validate(docs);
  return docs;
}

export function readPortraitArchive(db, kind) {
  if (!kinds.includes(kind)) fail('E_PORTRAIT_FIELDS', 'archive kind');
  const row = db.prepare('SELECT * FROM portrait_archive WHERE kind=?').get(kind);
  if (!row || hash(row.bytes) !== row.sha256) fail('E_PORTRAIT_HASH', 'archive');
  return { ...row, bytes: Buffer.from(row.bytes) };
}

/** Reconstruct a committed typed revision, never its archived JSON bytes. */
export function readPortraitRevision(db, revision) {
  if (!Number.isSafeInteger(revision) || revision < 1
    || !db.prepare('SELECT 1 FROM portrait_revision WHERE revision=?').get(revision)) {
    fail('E_PORTRAIT_REVISION', 'unknown revision');
  }
  const snapshotDb = { prepare(sql) {
    if (sql.includes('FROM portrait_seal')) {
      return { get: () => ({ n: 1 }) };
    }
    let query = sql;
    for (const table of currentTables) {
      query = query.replace(new RegExp(`\\b${table}\\b`, 'gu'),
        `(SELECT * FROM ${table}_history WHERE revision=${revision})`);
    }
    return db.prepare(query);
  } };
  return readPortraitDocuments(snapshotDb);
}

/** Approval authority is the full producer verifier, never a caller boolean or plan. */
export async function appendAlreadyApprovedPortrait(db, command) {
  const revision = db.prepare('SELECT revision FROM portrait_seal WHERE singleton=1').get()?.revision;
  if (!command || command.expectedRevision !== revision) fail('E_PORTRAIT_REVISION', 'expected revision mismatch');
  if (!['registration', 'replacement'].includes(command.operation) || !command.sourceManifestPath || !command.wikiRoot) fail('E_PORTRAIT_APPROVAL_CAPABILITY', 'actual writer evidence required');
  text(command.actor); text(command.reason);
  if (!command.actor.trim() || !command.reason.trim()) fail('E_PORTRAIT_PROVENANCE', 'actor/reason');
  const before = readPortraitDocuments(db);
  const digests = Object.fromEntries(kinds.map(k => [k, hash(JSON.stringify(before[k]))]));
  const plan = await (command.operation === 'registration'
    ? verifyPortraitRegistration(command.sourceManifestPath, command.wikiRoot, before)
    : verifyPortraitReplacement(command.sourceManifestPath, command.wikiRoot, before, command.selection));
  validate(plan.documents);
  // A separate in-memory typed candidate reuses the complete import contract.
  const candidate = new DatabaseSync(':memory:'); candidate.exec('PRAGMA foreign_keys=ON');
  let stage;
  const changed = [];
  try {
    initializePortraitStore(candidate, Object.fromEntries(kinds.map(kind => {
      const bytes = Buffer.from(JSON.stringify(plan.documents[kind]));
      return [kind, { bytes, expectedSha256: hash(bytes), actor: command.actor, reason: command.reason }];
    })));
    stage = await mkdtemp(join(command.wikiRoot, '.portrait-stage-'));
    for (const [i, file] of plan.files.entries()) {
      file.target = join(command.wikiRoot, file.path);
      try { file.previous = await readFile(file.target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      file.staged = join(stage, String(i));
      await writeFile(file.staged, file.bytes, { flag: 'wx' });
    }
    withTransaction(db, () => {
      if (db.prepare('SELECT revision FROM portrait_seal WHERE singleton=1').get().revision !== revision) fail('E_PORTRAIT_REVISION', 'stale verified revision');
      const current = readPortraitDocuments(db);
      for (const k of kinds) if (hash(JSON.stringify(current[k])) !== digests[k]) fail('E_PORTRAIT_REVISION', k + ' changed');
      const mutable = [...currentTables, 'portrait_seal', 'portrait_revision', 'portrait_revision_evidence', ...currentTables.map(t => t + '_history')];
      const hasLinks = !!db.prepare("SELECT 1 FROM sqlite_schema WHERE name='portrait_existing_person'").get();
      if (hasLinks) mutable.push('portrait_existing_person');
      for (const table of mutable) for (const op of ['INSERT', 'UPDATE', 'DELETE']) db.exec(`DROP TRIGGER ${table}_sealed_${op}`);
      if (hasLinks) db.exec('DELETE FROM portrait_existing_person');
      for (const table of [...currentTables].reverse()) db.exec(`DELETE FROM ${table}`);
      for (const table of currentTables) for (const row of candidate.prepare(`SELECT * FROM ${table}`).all()) insert(db, table, row);
      if (hasLinks) for (const p of db.prepare('SELECT * FROM portrait_person').all()) {
        const person = db.prepare('SELECT person_id,name FROM person WHERE public_key=?').get(p.personId);
        if (person) {
          if (person.name !== p.name) fail('E_PORTRAIT_IDENTITY', 'existing person mismatch');
          insert(db, 'portrait_existing_person', { personId: p.personId, existingPersonId: person.person_id });
        }
      }
      insert(db, 'portrait_revision', { revision: revision + 1, actor: command.actor, reason: command.reason });
      for (const e of plan.evidence) insert(db, 'portrait_revision_evidence', { revision: revision + 1, kind: e.kind, bytes: e.bytes, sha256: hash(e.bytes) });
      snapshot(db, revision + 1);
      db.prepare('UPDATE portrait_seal SET revision=? WHERE singleton=1').run(revision + 1);
      readPortraitDocuments(db);
      for (const table of mutable) seal(db, table);
      // Files are preflighted and staged, but SQLite and filesystem are not globally atomic.
      for (const file of plan.files) {
        const now = (() => { try { return readFileSync(file.target); } catch (error) { if (error.code !== 'ENOENT') throw error; } })();
        if (file.previous === undefined ? now !== undefined : !now?.equals(file.previous)) fail('E_PORTRAIT_ASSET_CHANGED', file.path);
        renameSync(file.staged, file.target); changed.push(file);
      }
    });
    return plan.count;
  } catch (error) {
    for (const file of changed.reverse()) {
      if (!readFileSync(file.target).equals(file.bytes)) continue;
      if (file.previous) { await writeFile(file.staged, file.previous, { flag: 'wx' }); renameSync(file.staged, file.target); }
      else unlinkSync(file.target);
    }
    throw error;
  } finally {
    candidate.close();
    if (stage) await rm(stage, { recursive: true, force: true });
  }
}
