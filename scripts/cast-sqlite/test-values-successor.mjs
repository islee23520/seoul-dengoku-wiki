import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { VALUES_SUCCESSOR, verifyValuesSuccessor, verifyValuesHistoricalProjection } from './values-successor.mjs';
import { readAtlasValuesDocument } from './atlas-identity.mjs';
import { scopeAuthenticationReader } from '../document-store/scope-authentication-reader.mjs';

const canonical = v => Array.isArray(v) ? v.map(canonical) : v !== null && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = v => hash(JSON.stringify(canonical(v)));
function fixture(t) {
  const db = new DatabaseSync(':memory:'); t.after(() => db.close());
  const axes = Array.from({ length: 10 }, (_, i) => 'value' + i);
  const desires = Array.from({ length: 7 }, (_, i) => 'desire' + i);
  const people = Array.from({ length: 1008 }, (_, i) => ({ name: 'Person ' + i, title: 'Role ' + i,
    stage: 'adult', state: 'S01', state_name: 'First', generation: 'first', source: 'authored', minors: false,
    values: Object.fromEntries(axes.map((axis, j) => [axis, i + j])),
    desire: Object.fromEntries(desires.map((axis, j) => [axis, j - i])), locked: false }));
  for (const [i, name, state, title] of [[34, '장우석', 'polity:daejeon', '수리규격 감사기록관'],
    [37, '허다온', 'polity:daejeon', '천왕기지 차륜 정비사'], [38, '구찬솔', 'polity:daejeon', '구로 공구시장 물류상'],
    [1002, '조재표', 'S00', '유명 낭인 지휘자'], [1007, '민웅기', 'polity:daejeon', '대전 군주']])
    Object.assign(people[i], { name, state, state_name: state === 'S00' ? '무소속' : '대전', title });
  const original = { schema: 'values.v1', note: 'representative complete roster', axes, desire_axes: desires, count: people.length, people };
  const current = structuredClone(original);
  for (const i of [34, 37, 38, 1002, 1007]) Object.assign(current.people[i], { state: 'S02', state_name: '규격맹' });
  // Representative successor titles, not claims about the production strings.
  current.people[1002].title = 'Approved returning commander'; current.people[1007].title = 'Approved personal king';
  const bytes = Buffer.from(JSON.stringify(original, null, 2) + '\n');
  const approvalBytes = readFileSync(new URL('../approved-seoul-faction-consolidation-20261022.json', import.meta.url));
  const pin = { ...VALUES_SUCCESSOR, sourceSha256: hash(bytes), bootstrapDigest: digest(original), semanticSha256: digest(current) };
  pin.parent = digest(['data-source-v1', pin.logicalPath, null, pin.bootstrapDigest, 'import', 'archived import baseline']);
  pin.revision = digest(['data-source-v1', pin.logicalPath, pin.parent, pin.semanticSha256, 'author', 'approved D1 D2']);
  db.exec('CREATE TABLE source_file(source_id INTEGER,logical_path TEXT,sha256 TEXT,raw_bytes BLOB); CREATE TABLE data_source_head(source_path TEXT,revision_id TEXT,archived_sha256 TEXT); CREATE TABLE data_source_current(source_path TEXT,revision_id TEXT,document_json TEXT); CREATE TABLE data_source_revision(revision_id TEXT,source_path TEXT,parent_revision TEXT,semantic_sha256 TEXT,actor TEXT,reason TEXT,sequence INTEGER,approval_ref TEXT); CREATE TABLE text_document(source_id INTEGER,corpus_kind TEXT);');
  db.prepare('INSERT INTO source_file VALUES(1,?,?,?)').run(pin.logicalPath, pin.sourceSha256, bytes);
  db.prepare('INSERT INTO data_source_head VALUES(?,?,?)').run(pin.logicalPath, pin.revision, pin.sourceSha256);
  db.prepare('INSERT INTO data_source_current VALUES(?,?,?)').run(pin.logicalPath, pin.revision, JSON.stringify(current));
  db.prepare('INSERT INTO data_source_revision VALUES(?,?,?,?,?,?,?,?)').run(pin.parent, pin.logicalPath, null, pin.bootstrapDigest, 'import', 'archived import baseline', 0, 'archived');
  db.prepare('INSERT INTO data_source_revision VALUES(?,?,?,?,?,?,?,?)').run(pin.revision, pin.logicalPath, pin.parent, pin.semanticSha256, 'author', 'approved D1 D2', 1, pin.approvalRef);
  db.exec('CREATE TABLE text_line_document(source_id INTEGER)');
  const add = (table, rows) => {
    const keys = Object.keys(rows[0]);
    db.exec('CREATE TABLE ' + table + '(' + keys.map(k => k + ' ' + (typeof rows[0][k] === 'number' ? 'INTEGER' : 'TEXT')).join(',') + ')');
    const insert = db.prepare('INSERT INTO ' + table + ' VALUES(' + keys.map(() => '?').join(',') + ')');
    for (const row of rows) insert.run(...keys.map(k => row[k]));
  };
  add('atlas_identity_seal', [{ singleton: 1 }]);
  add('atlas_identity_binding', ['values', 'registry', 'candidates', 'gurps'].map((kind, i) => ({ kind, source_id: i + 1, sha256: kind === 'values' ? pin.sourceSha256 : kind })));
  for (const [id, name] of [[2, 'registry'], [4, 'gurps']]) db.prepare('INSERT INTO source_file VALUES(?,?,?,?)').run(id, 'lore/name-pools/' + (name === 'registry' ? 'person-id-registry' : 'gurps-cast') + '.json', name, Buffer.from('{}'));
  add('identity_registry_provenance', [{ source_id: 2, total_people: people.length, schema_name: 'registry.v1', approved_by: 'owner', approved_at: 'date', owner_ref: 'approved', input_sha256: 'input', candidates_sha256: 'candidates', existing_k_count: 1, issued_count: people.length - 1 }]);
  add('person_alias', [{ person_id: 'K001', alias: 'Alias', alias_ordinal: 0 }]);
  add('atlas_identity_registry_person', people.map((_p, i) => ({ person_id: 'K' + String(i + 1).padStart(3, '0'), ordinal: i, has_aliases: i === 0 ? 1 : 0 })));
  add('atlas_identity_candidate_metadata', [{ singleton: 1, schema_name: 'candidates.v1', input_sha256: 'input', base_commit: 'base', total_people: people.length, existing_k_count: 1, candidate_count: 1, note_count: 1 }]);
  add('atlas_identity_existing_k', [{ ordinal: 0, id: 'K001', name: people[0].name }]);
  add('atlas_identity_candidate', [{ position: 0, ordinal: 0, name: 'Candidate', stage: 'adult', state: 'S01', title: 'Candidate role', locked: 0 }]);
  add('atlas_identity_note', [{ ordinal: 0, type: 'note', name: 'Candidate', detail: 'representative' }]);
  add('value_axis', axes.map((axis_name, axis_ordinal) => ({ axis_name, axis_ordinal })));
  add('desire_axis', desires.map((axis_name, axis_ordinal) => ({ axis_name, axis_ordinal, value_kind: 'integer' })));
  add('person', people.map((p, i) => ({ person_id: 'K' + String(i + 1).padStart(3, '0'), name: p.name, title: p.title,
    stage: p.stage, state_id: p.state, state_name: p.state_name, generation: p.generation, source_kind: p.source,
    minors: 0, locked: 0, values_source_ordinal: i, public_route: '/people/person-' + String(i + 1).padStart(4, '0') })));
  add('person_value', people.flatMap((p, i) => axes.map(axis_name => ({ person_id: 'K' + String(i + 1).padStart(3, '0'), axis_name, value: p.values[axis_name] }))));
  add('person_desire', people.flatMap((p, i) => desires.map(axis_name => ({ person_id: 'K' + String(i + 1).padStart(3, '0'), axis_name, value_kind: 'integer', integer_value: p.desire[axis_name], text_value: null }))));
  add('atlas_identity_route', people.map((_p, i) => ({ person_id: 'K' + String(i + 1).padStart(3, '0'), ordinal: i })));
  add('atlas_identity_values_metadata', [{ schema_name: original.schema, note: original.note, person_count: people.length }]);
  return { db, original, current, bytes, pin, approvalBytes };
}
const verify = f => verifyValuesSuccessor(f.db, { pin: f.pin, projection: f.current, approvalBytes: f.approvalBytes });
test('complete nonempty typed reconstruction and exact twelve-leaf successor verify without mutation', t => {
  const f = fixture(t), before = Buffer.from(f.bytes);
  assert.deepEqual(readAtlasValuesDocument(f.db), f.original);
  for (const i of [34, 37, 38, 1002, 1007]) {
    const p = f.current.people[i];
    f.db.prepare('UPDATE person SET state_id=?,state_name=?,title=? WHERE values_source_ordinal=?').run(p.state, p.state_name, p.title, i);
  }
  const projection = readAtlasValuesDocument(f.db);
  assert.deepEqual(projection, f.current);
  assert.deepEqual(verifyValuesSuccessor(f.db, { pin: f.pin, projection, approvalBytes: f.approvalBytes }), projection);
  verifyValuesHistoricalProjection(projection, f.original, f.pin);
  assert.deepEqual(f.bytes, before);
  assert.deepEqual(readAtlasValuesDocument(f.db), projection);
});
for (const [name, sql] of [
  ['missing archive', 'DELETE FROM source_file WHERE source_id=1'],
  ['wrong archive pin', "UPDATE source_file SET sha256='wrong' WHERE source_id=1"],
  ['wrong archive bytes', "UPDATE source_file SET raw_bytes=x'7b7d' WHERE source_id=1"],
  ['duplicate archive', 'INSERT INTO source_file SELECT * FROM source_file WHERE source_id=1'],
  ['missing head', 'DELETE FROM data_source_head'],
  ['duplicate head', 'INSERT INTO data_source_head SELECT * FROM data_source_head'],
  ['wrong head archive', "UPDATE data_source_head SET archived_sha256='wrong'"],
  ['wrong head revision', "UPDATE data_source_head SET revision_id='wrong'"],
  ['missing current', 'DELETE FROM data_source_current'],
  ['wrong current revision', "UPDATE data_source_current SET revision_id='wrong'"],
  ['wrong current body', "UPDATE data_source_current SET document_json='{}'"],
  ['missing revision', 'DELETE FROM data_source_revision WHERE sequence=1'],
  ['missing ancestor', 'DELETE FROM data_source_revision WHERE sequence=0'],
  ['cross-source ancestor', "UPDATE data_source_revision SET source_path='other' WHERE sequence=0"],
  ['wrong approval', "UPDATE data_source_revision SET approval_ref='other' WHERE sequence=1"],
  ['wrong semantic', "UPDATE data_source_revision SET semantic_sha256='other' WHERE sequence=1"],
  ['wrong parent', "UPDATE data_source_revision SET parent_revision='other' WHERE sequence=1"],
  ['wrong sequence', 'UPDATE data_source_revision SET sequence=2 WHERE sequence=1'],
  ['wrong reason', "UPDATE data_source_revision SET reason='other' WHERE sequence=1"],
  ['wrong baseline approval', "UPDATE data_source_revision SET approval_ref='other' WHERE sequence=0"],
]) test('rejects ' + name, t => {
  const f = fixture(t); f.db.exec(sql); assert.throws(() => verify(f), { code: 'E_VALUES_SUCCESSOR' });
});
for (const field of ['sourceSha256', 'bootstrapDigest', 'semanticSha256', 'revision', 'parent', 'sequence', 'approvalSha256'])
  test('independent ' + field + ' cannot be replaced by stored consistency', t => {
    const f = fixture(t); f.pin[field] = field === 'sequence' ? 2 : '0'.repeat(64);
    assert.throws(() => verify(f), { code: 'E_VALUES_SUCCESSOR' });
  });
test('changed decision bytes reject', t => {
  const f = fixture(t); f.approvalBytes = Buffer.from('{}'); assert.throws(() => verify(f), { code: 'E_VALUES_SUCCESSOR' });
});
for (const [name, change] of [
  ['score', f => { f.current.people[34].values.value0++; }],
  ['desire', f => { f.current.people[37].desire.desire0++; }],
  ['unrelated person', f => { f.current.people[0].title = 'extra'; }],
  ['name', f => { f.current.people[34].name = 'other'; }],
  ['wrong title', f => { f.current.people[1002].title = 'other'; }],
  ['unchanged required title', f => { f.current.people[1007].title = f.original.people[1007].title; }],
]) test('complete typed and historical comparisons reject extra ' + name, t => {
  const f = fixture(t); change(f);
  assert.throws(() => verify(f), { code: 'E_VALUES_SUCCESSOR' });
  assert.throws(() => verifyValuesHistoricalProjection(f.current, f.original, f.pin), { code: 'E_VALUES_SUCCESSOR' });
});
test('complete predecessor equality rejects extra edits even under a newly consistent semantic pin', t => {
  const f = fixture(t); f.current.people[0].values.value0++;
  f.pin.semanticSha256 = digest(f.current);
  assert.throws(() => verifyValuesHistoricalProjection(f.current, f.original, f.pin), { code: 'E_VALUES_SUCCESSOR' });
});
test('scope authentication preserves exact original import bytes and strict default rejection', async t => {
  const f = fixture(t); f.db.exec('DROP TABLE data_source_head');
  const path = f.pin.logicalPath, root = '/values-scope';
  const reader = scopeAuthenticationReader({ db: f.db, root,
    evidenceStore: { getEvidence(identity, pin) { assert.equal(identity, 'original'); assert.equal(pin, f.pin.sourceSha256); return f.bytes; } },
    bindings: new Map([[path, { identity: 'original', sha256: f.pin.sourceSha256 }]]),
    currentSourceHashes: new Map([[path, f.pin.sourceSha256]]) });
  assert.deepEqual(await reader(root + '/' + path), f.bytes);
  f.db.exec("UPDATE person SET title='drift' WHERE values_source_ordinal=0");
  await assert.rejects(reader(root + '/' + path), /E_SCOPE_AUTHENTICATION_TYPED_MISMATCH/u);
});
test('synthetic stored successor cannot replace the fixed production approval through the caller', async t => {
  const f = fixture(t), path = f.pin.logicalPath, root = '/values-scope';
  const reader = scopeAuthenticationReader({ db: f.db, root, evidenceStore: { getEvidence() { return f.bytes; } },
    bindings: new Map([[path, { identity: 'original', sha256: f.pin.sourceSha256 }]]),
    currentSourceHashes: new Map([[path, f.pin.sourceSha256]]) });
  await assert.rejects(reader(root + '/' + path), { code: 'E_VALUES_SUCCESSOR' });
});
