import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyFile, readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { applySchema, openWritableNew, openReadOnly, withTransaction } from './db.mjs';
import { mapIdentityDomains } from './identity-values.mjs';
import { mapProfiles, mapRelations } from './profiles-relations.mjs';
import { mapGurps } from './gurps-evidence.mjs';
import { parseDocument, loadSourceBundle, resolveTrustedSourcePath, sha256 } from './sources.mjs';
import { buildCastDatabase, mapReferenceAnchorIssues, summarizeCurrentSourceAlignment } from './build.mjs';
import { verifyCastDatabase } from './verify.mjs';
import { queryPerson, querySource, queryIssues } from './query.mjs';
import * as fixtures from './fixtures.mjs';
const pool = name => `lore/name-pools/${name}.json`;
const render = (document, locale) => document.content.map(node => node.text?.[locale] ?? '').join('\n');

test('build receipt counts a future Seoul-evidenced holding instead of silently reporting zero', () => {
  const alignment = summarizeCurrentSourceAlignment({
    index_issue: [], identity_gender_policy: [],
    context_holding: [
      { current_validity: 'current_seoul_evidenced' },
      { current_validity: 'superseded_outside_seoul' },
      { current_validity: 'unresolved' },
    ],
  });
  assert.deepEqual(alignment, {
    index_warnings: 0, gender_policy_drift: 0,
    holding_superseded: 1, holding_unresolved: 1, holding_current: 1,
  });
});

test('unresolved reference anchors become deterministic source-linked quality issues', () => {
  const unresolved = {
    source_id: 7, json_pointer: '/content/0/sourceRef', ordinal: 0,
    reference_logical_path: 'lore/chronology/Century-Annals.json', reference_anchor: '/content/629',
    anchor_verification: 'json-pointer-unresolved',
  };
  const references = [unresolved, { ...unresolved, ordinal: 1, anchor_verification: 'json-pointer-verified' }];
  const issues = mapReferenceAnchorIssues(references);
  assert.equal(issues.length, 1);
  assert.deepEqual(issues, [{
    issue_id: `reference-anchor-${sha256(['7', '/content/0/sourceRef', '0'].join('\0'))}`,
    dataset: 'reference', code: 'E_REFERENCE_ANCHOR', severity: 'error', person_id: null,
    source_id: 7, json_pointer: '/content/0/sourceRef',
    message: 'Unresolved JSON pointer anchor: lore/chronology/Century-Annals.json#/content/629',
    observed_value: JSON.stringify({ reference_logical_path: unresolved.reference_logical_path, reference_anchor: unresolved.reference_anchor }),
  }]);
});

// Given independent IDs and publication order, when mapped, then both authorities survive.
test('minimal corpus preserves distinct K IDs, null text, empty text and range boundaries', () => {
  const { bundle } = fixtures.makeCorpus();
  const rows = mapIdentityDomains(bundle);
  assert.deepEqual(rows.people.map(row => [row.person_id, row.public_route]), [['K088', '/people/person-0001'], ['K003', '/people/person-0002']]);
  assert.deepEqual(rows.personValues.slice(0, 2).map(row => row.value), [-100, 100]);
  assert.deepEqual(rows.personDesires.filter(row => row.person_id === 'K088' && row.value_kind === 'text').map(row => row.text_value), [null, '']);
});

const invalidIdentity = [
  ['duplicate K', 'E_PERSON_DUPLICATE_ID', docs => { docs[pool('person-id-registry')].persons[1].id = 'K088'; }],
  ['duplicate exact name', 'E_PERSON_DUPLICATE_NAME', docs => { docs[pool('person-id-registry')].persons[1].name = '가람'; }],
  ['duplicate alias', 'E_PERSON_DUPLICATE_ALIAS', docs => { docs[pool('person-id-registry')].persons[1].aliases = ['첫 이름']; }],
  ...['values-cast', 'gender-cast', 'cast-hangnyeol', 'gurps-cast'].map((name, index) => [`${name} orphan`, ['E_VALUES_ORPHAN', 'E_GENDER_ORPHAN', 'E_LINEAGE_ORPHAN', 'E_GURPS_ORPHAN'][index], docs => { docs[pool(name)].people[0].name = '등록 밖'; }]),
  ['whitespace name repair', 'E_GENDER_ORPHAN', docs => { docs[pool('gender-cast')].people[0].name += ' '; }],
  ['nonboolean minors', 'E_MINORS_TYPE', docs => { docs[pool('values-cast')].people[0].minors = 1; }],
  ['value below boundary', 'E_VALUE_RANGE', docs => { docs[pool('values-cast')].people[0].values['축0'] = -101; }],
  ['value above boundary', 'E_VALUE_RANGE', docs => { docs[pool('values-cast')].people[0].values['축0'] = 101; }],
  ['fractional value', 'E_VALUE_RANGE', docs => { docs[pool('values-cast')].people[0].values['축0'] = 0.5; }],
  ['missing qualitative axis', 'E_DESIRE_AXES', docs => { delete docs[pool('values-cast')].people[0].desire['지향']; }],
  ['null numeric desire', 'E_DESIRE_RANGE', docs => { docs[pool('values-cast')].people[0].desire['욕망0'] = null; }],
];
for (const [name, code, mutate] of invalidIdentity) test(`rejects ${name} without name-join repair`, () => {
  const { bundle } = fixtures.makeCorpus(mutate);
  const before = JSON.stringify(bundle);
  assert.throws(() => mapIdentityDomains(bundle), { code });
  assert.equal(JSON.stringify(bundle), before);
});

for (const [label, text, code] of [['malformed', '{"x":', 'E_SOURCE_JSON'], ['duplicate key', '{"x":1,"x":2}', 'E_SOURCE_JSON'], ['unsafe integer', '{"x":9007199254740993}', 'E_SOURCE_NUMBER_PRECISION']]) {
  test(`rejects ${label} raw JSON`, () => assert.throws(() => parseDocument(text), { code }));
}

test('profile orphan is rejected without losing the valid cards', () => {
  const { bundle } = fixtures.makeCorpus(docs => { docs['lore/characters/Cast-State-01.json'].content[0].text.ko = '인물 등록 밖'; });
  assert.throws(() => mapProfiles({ bundle, identity: mapIdentityDomains(bundle), renderLoreMarkdown: render }), { code: 'E_PROFILE_ORPHAN' });
});
test('relation endpoint orphan is rejected while empty grounds remain valid', () => {
  const valid = fixtures.makeCorpus();
  assert.equal(mapRelations({ bundle: valid.bundle, identity: mapIdentityDomains(valid.bundle) }).relations[0].grounds_ko, '');
  const { bundle } = fixtures.makeCorpus(docs => { docs['lore/characters/Cast-Relations.json'].content[0].rows[0][2].ko = '등록 밖'; });
  assert.throws(() => mapRelations({ bundle, identity: mapIdentityDomains(bundle) }), { code: 'E_RELATION_ENDPOINT_ORPHAN' });
});
test('GURPS direct API rejects an orphan K even when its name is registered', () => {
  const good = fixtures.makeCorpus();
  const { bundle } = fixtures.makeCorpus(docs => { docs[pool('gurps-cast')].people[0].id = 'K999'; });
  assert.throws(() => mapGurps({ bundle, identity: mapIdentityDomains(good.bundle) }), { code: 'E_GURPS_PERSON_ORPHAN' });
});

test('duplicate route causes real transaction rollback without partial rows or sidecars', async t => {
  const root = await fixtures.sandbox(t);
  const path = join(root, 'rollback.sqlite');
  const db = openWritableNew(path);
  try {
    applySchema(db);
    const before = sha256(await readFile(path));
    assert.throws(() => withTransaction(db, () => {
      const insert = db.prepare('INSERT INTO person(person_id,name,publication_ordinal,public_key,public_route,values_source_ordinal,minors) VALUES(?,?,?,?,?,?,?)');
      insert.run('K001', '가람', 1, 'person-0001', '/people/person-0001', 0, 0);
      insert.run('K002', '누리', 2, 'person-0002', '/people/person-0001', 1, 0);
    }), error => error.errcode === 2067);
    assert.equal(db.prepare('SELECT count(*) AS n FROM person').get().n, 0);
    assert.equal(db.isTransaction, false);
    assert.equal(sha256(await readFile(path)), before);
  } finally { db.close(); }
  assert.deepEqual(await readdir(root), ['rollback.sqlite']);
});

test('existing output is byte-preserved before attempting an invalid source', async t => {
  const root = await fixtures.sandbox(t);
  const outputPath = join(root, 'existing.sqlite');
  await writeFile(outputPath, Buffer.from('existing\0bytes'));
  const hash = sha256(await readFile(outputPath));
  await assert.rejects(buildCastDatabase({ sourceRoot: join(root, 'missing'), outputPath }), { code: 'E_OUTPUT_EXISTS' });
  assert.equal(sha256(await readFile(outputPath)), hash);
  assert.deepEqual(await readdir(root), ['existing.sqlite']);
});

test('partial schema and truncated DB fail verification without changing either file', async t => {
  const root = await fixtures.sandbox(t);
  const partial = join(root, 'partial.sqlite');
  const db = openWritableNew(partial);
  applySchema(db);
  db.exec('DROP TABLE quality_issue');
  db.close();
  const broken = join(root, 'truncated.sqlite');
  await writeFile(broken, (await readFile(partial)).subarray(0, 100));
  for (const [dbPath, code] of [[partial, 'E_SCHEMA_MISMATCH'], [broken, 'E_DB_INTEGRITY']]) {
    const hash = sha256(await readFile(dbPath));
    await assert.rejects(verifyCastDatabase({ dbPath }), { code });
    assert.equal(sha256(await readFile(dbPath)), hash);
  }
  assert.deepEqual((await readdir(root)).sort(), ['partial.sqlite', 'truncated.sqlite']);
});

test('actual source snapshot exercises build, read-only query and freshness defenses', { skip: process.env.CAST_SQLITE_SOURCE_ROOT ? false : 'CAST_SQLITE_SOURCE_ROOT is required for actual-corpus integration' }, async t => {
  const f = await fixtures.snapshotActualCorpus(t);
  const sourceBefore = await fixtures.sourceDigests(f.sourceRoot);
  const receipt = await buildCastDatabase(f);
  assert.equal(receipt.status, 'PASS_WITH_SOURCE_ISSUES');
  assert.equal(receipt.official_issue_count, 138);
  const baseline = { hash: sha256(await readFile(f.outputPath)), mtime: (await stat(f.outputPath)).mtimeMs };
  await t.test('runtime queries bind hostile parameters and preserve artifact/source bytes', async () => {
    assert.equal(queryPerson({ dbPath: f.outputPath, id: 'K088' }).person.public_route, '/people/person-0089');
    for (const id of ["K088' OR 1=1--", "K088'; DROP TABLE person;--"]) assert.throws(() => queryPerson({ dbPath: f.outputPath, id }), { code: 'E_PERSON_NOT_FOUND' });
    assert.throws(() => querySource({ dbPath: f.outputPath, path: "x' OR 1=1--" }), { code: 'E_SOURCE_NOT_FOUND' });
    assert.deepEqual(queryIssues({ dbPath: f.outputPath, dataset: "gurps' OR 1=1--" }).importer, []);
    const db = openReadOnly(f.outputPath);
    try { assert.throws(() => db.exec('DELETE FROM person')); } finally { db.close(); }
    assert.equal(sha256(await readFile(f.outputPath)), baseline.hash);
    assert.equal((await stat(f.outputPath)).mtimeMs, baseline.mtime);
    assert.deepEqual(await fixtures.sourceDigests(f.sourceRoot), sourceBefore);
  });
  await t.test('full verification and null-source offline mode make distinct completeness claims', async () => {
    const full = await verifyCastDatabase({ dbPath: f.outputPath, sourceRoot: f.sourceRoot });
    assert.equal(full.complete_verification, true);
    assert.equal((await verifyCastDatabase({ dbPath: f.outputPath, sourceRoot: null })).complete_verification, false);
  });
  await t.test('same-count normalized tampering is rejected', async () => {
    const damaged = join(f.root, 'tampered.sqlite');
    await copyFile(f.outputPath, damaged);
    const db = new DatabaseSync(damaged);
    db.exec("UPDATE person_value SET value=CASE WHEN value=100 THEN 99 ELSE value+1 END WHERE rowid=(SELECT rowid FROM person_value LIMIT 1)");
    db.close();
    await assert.rejects(verifyCastDatabase({ dbPath: damaged }), { code: 'E_SOURCE_FIDELITY' });
  });
  await t.test('unknown evidence paths and same-count stale source bytes fail closed', async () => {
    await assert.rejects(resolveTrustedSourcePath(f.sourceRoot, '../outside'), { code: 'E_SOURCE_OUTSIDE_ROOT' });
    const path = join(f.sourceRoot, 'WORLD_BUILDING_GUIDE.md');
    const original = await readFile(path);
    try {
      await writeFile(path, Buffer.concat([original, Buffer.from('\nchanged while row count stays identical\n')]));
      await assert.rejects(verifyCastDatabase({ dbPath: f.outputPath, sourceRoot: f.sourceRoot }), { code: 'E_SOURCE_STALE' });
    } finally { await writeFile(path, original); }
    const gurpsPath = join(f.sourceRoot, pool('gurps-cast'));
    const bytes = await readFile(gurpsPath);
    try {
      const doc = JSON.parse(bytes);
      doc.people[0].role.evidence.push({ path: 'unlisted.json', quote: 'x' });
      await writeFile(join(f.sourceRoot, 'unlisted.json'), '{}');
      await writeFile(gurpsPath, JSON.stringify(doc));
      await assert.rejects(loadSourceBundle({ sourceRoot: f.sourceRoot, runOfficialChecks: false }), { code: 'E_SOURCE_MANIFEST' });
    } finally { await writeFile(gurpsPath, bytes); }
  });
  await t.test('receipt no-clobber and output-inside-source are rejected', async () => {
    const receiptPath = join(f.root, 'receipt.json');
    await writeFile(receiptPath, 'sentinel');
    await assert.rejects(verifyCastDatabase({ dbPath: f.outputPath, receiptPath }), { code: 'E_RECEIPT_EXISTS' });
    assert.equal(await readFile(receiptPath, 'utf8'), 'sentinel');
    await assert.rejects(buildCastDatabase({ sourceRoot: f.sourceRoot, outputPath: join(f.sourceRoot, 'illegal.sqlite') }), { code: 'E_OUTPUT_SOURCE_ROOT' });
    assert.equal(sha256(await readFile(f.outputPath)), baseline.hash);
  });
  assert.deepEqual(await fixtures.sourceDigests(f.sourceRoot), sourceBefore);
  assert.deepEqual((await readdir(f.root)).sort(), ['WIKI', 'artifact.sqlite', 'receipt.json', 'tampered.sqlite']);
  assert.deepEqual(await fixtures.sourceDigests(process.env.CAST_SQLITE_SOURCE_ROOT), f.originalDigests);
});
