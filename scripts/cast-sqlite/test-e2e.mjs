import assert from 'node:assert/strict';
import { copyFile, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { buildCastDatabase, DEFAULT_SOURCE_ROOT } from './build.mjs';
import { verifyCastDatabase } from './verify.mjs';
import { sha256 } from './sources.mjs';

const count = (db, table) => db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n;
const readJson = async (logicalPath) => JSON.parse(await readFile(join(DEFAULT_SOURCE_ROOT, logicalPath), 'utf8'));

test('the complete wiki corpus builds and verifies as an independent read-only SQLite artifact', { timeout: 1_500_000 }, async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'wiki-cast-corpus-'));
  t.after(async () => {
    assert.ok(relative(resolve(tmpdir()), resolve(root)).startsWith('wiki-cast-corpus-'));
    await rm(root, { recursive: true, force: true });
  });
  const dbPath = join(root, 'wiki-cast.sqlite');
  const [registry, values, gender, birthdays, family, diaspora, holdings, gurps] = await Promise.all([
    readJson('lore/name-pools/person-id-registry.json'),
    readJson('lore/name-pools/values-cast.json'),
    readJson('lore/name-pools/gender-cast.json'),
    readJson('lore/name-pools/cast-birthdays.json'),
    readJson('lore/name-pools/cast-family-trees.json'),
    readJson('lore/name-pools/diaspora-family-lineages.json'),
    readJson('lore/relations/personal-holdings.json'),
    readJson('lore/name-pools/gurps-cast.json'),
  ]);
  const expectedPeople = registry.persons.length;
  assert.equal(registry.totalPeople, expectedPeople);
  assert.equal(values.people.length, expectedPeople);
  assert.equal(gender.people.length, expectedPeople);
  assert.equal(birthdays.people.length, expectedPeople);
  assert.equal(gurps.people.length, expectedPeople);
  const diasporaMembers = diaspora.lineages.flatMap((lineage) => lineage.members);
  const familyNodeIds = new Set(family.nodes.map((node) => node.id));
  const supplementalNodes = diasporaMembers.filter((member) => !familyNodeIds.has(member.key)).length;
  const supplementalEdges = diasporaMembers.reduce((total, member) => total + member.parentKeys.length, 0);

  const built = await buildCastDatabase({ sourceRoot: DEFAULT_SOURCE_ROOT, outputPath: dbPath });
  const originalSha256 = sha256(await readFile(dbPath));
  const originalMtimeMs = (await stat(dbPath)).mtimeMs;
  assert.equal(built.sha256, originalSha256);
  assert.equal(built.counts.person, expectedPeople);
  const secondPath = join(root, 'second.sqlite');
  const second = await buildCastDatabase({ sourceRoot: DEFAULT_SOURCE_ROOT, outputPath: secondPath });
  assert.equal(second.sha256, built.sha256);
  assert.equal(sha256(await readFile(secondPath)), originalSha256, 'same source snapshot must generate identical SQLite bytes');
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    assert.throws(() => db.exec('CREATE TABLE e2e_readonly_probe(value INTEGER) STRICT'), (error) => error.errcode === 8);
    for (const table of ['person', 'person_gender', 'person_lineage', 'gurps_profile', 'family_birthday', 'current_profile', 'health', 'narrative']) {
      assert.equal(count(db, table), expectedPeople, `${table} must cover every registered person`);
    }
    assert.equal(count(db, 'ability'), expectedPeople * 8);
    assert.equal(count(db, 'family_node'), family.nodes.length + supplementalNodes);
    assert.equal(count(db, 'family_edge'), family.edges.length + supplementalEdges);
    assert.equal(count(db, 'context_holding'), holdings.holdings.length);
    const holdingStates = Object.fromEntries(db.prepare('SELECT current_validity,count(*) AS n FROM context_holding GROUP BY current_validity').all()
      .map((row) => [row.current_validity, row.n]));
    assert.deepEqual(holdingStates, { superseded_outside_seoul: 5, unresolved: 20 });
    assert.equal(count(db, 'current_engine_source'), 9);
    assert.equal(db.prepare('SELECT count(*) AS n FROM person p JOIN gurps_profile g USING(person_id) WHERE p.public_route <> g.url').get().n, 0);
    assert.equal(db.prepare("SELECT count(*) AS n FROM context_holding WHERE current_validity='current_seoul_evidenced' AND polity_id<>'seoul'").get().n, 0);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name='current_profile' AND sql LIKE '%authored_status%'").get().n, 0);
    assert.equal(db.prepare("SELECT count(*) AS n FROM source_file WHERE logical_path LIKE 'lore/editorial/profile-batches/%'").get().n, 0);
    assert.ok(count(db, 'reference_source') > 0);
    assert.deepEqual(Object.fromEntries(db.prepare('SELECT anchor_verification,count(*) AS n FROM source_reference GROUP BY anchor_verification').all()
      .map((row) => [row.anchor_verification, row.n])), {
      'json-pointer-verified': 7793,
      'verified-path-only': 33955,
      'json-pointer-unresolved': 11,
    });
    assert.equal(db.prepare("SELECT count(*) AS n FROM quality_issue WHERE dataset='reference' AND code='E_REFERENCE_ANCHOR'").get().n, 11);
    assert.ok(count(db, 'index_person') > 0);
    assert.equal(count(db, 'historical_source_scope'), 3);
  } finally { db.close(); }

  const offline = await verifyCastDatabase({ dbPath });
  assert.equal(offline.complete_verification, false);
  assert.equal(offline.source_freshness, 'unchecked');
  assert.equal(offline.reference_closure, 'stored-hashes-only-with-unresolved-anchors');
  assert.equal(offline.source_reference_unresolved_count, 11);
  const receiptPath = join(root, 'verification.json');
  const full = await verifyCastDatabase({ dbPath, sourceRoot: DEFAULT_SOURCE_ROOT, receiptPath });
  assert.equal(full.artifact_integrity, 'ok');
  assert.equal(full.complete_verification, true);
  assert.equal(full.source_freshness, 'current');
  assert.equal(full.reference_closure, 'verified-with-unresolved-anchors');
  assert.equal(full.source_reference_unresolved_count, 11);
  assert.equal(full.current_import_integrity, 'ok');
  assert.equal(full.current_approval_readiness, 'unreviewed');
  assert.equal(full.source_quality, 'degraded');
  assert.equal(full.importer_issue_count, 442);
  assert.deepEqual({
    holding_current: full.current_source_alignment.holding_current,
    holding_superseded: full.current_source_alignment.holding_superseded,
    holding_unresolved: full.current_source_alignment.holding_unresolved,
  }, { holding_current: 0, holding_superseded: 5, holding_unresolved: 20 });
  assert.equal(full.official_check_scope, 'historical-gurps-only');
  assert.ok(['checked', 'not_checked'].includes(full.official_check_status));
  assert.equal(full.sha256, originalSha256);
  assert.equal(full.counts.person, expectedPeople);
  assert.deepEqual(JSON.parse(await readFile(receiptPath, 'utf8')), full);
  await assert.rejects(verifyCastDatabase({ dbPath, sourceRoot: DEFAULT_SOURCE_ROOT, receiptPath }), { code: 'E_RECEIPT_EXISTS' });
  await assert.rejects(verifyCastDatabase({ dbPath, sourceRoot: DEFAULT_SOURCE_ROOT, requireClean: true }), { code: 'E_SOURCE_QUALITY' });
  for (const [name, sql, code] of [
    ['raw', "UPDATE source_file SET raw_bytes=zeroblob(byte_length) WHERE logical_path='WORLD_BUILDING_GUIDE.md'", 'E_SOURCE_RAW'],
    ['identity', "UPDATE person_value SET value=CASE WHEN value=0 THEN 1 ELSE 0 END WHERE person_id=(SELECT person_id FROM person_value LIMIT 1) AND axis_name=(SELECT axis_name FROM person_value LIMIT 1)", 'E_SOURCE_FIDELITY'],
    ['reference-quality', "UPDATE quality_issue SET observed_value='tampered' WHERE issue_id=(SELECT issue_id FROM quality_issue WHERE dataset='reference' AND code='E_REFERENCE_ANCHOR' LIMIT 1)", 'E_SOURCE_FIDELITY'],
    ['schema', 'CREATE TABLE rogue(value TEXT) STRICT', 'E_SCHEMA_MISMATCH'],
  ]) {
    const copy = join(root, `${name}.sqlite`);
    await copyFile(dbPath, copy);
    const modified = new DatabaseSync(copy, { enableForeignKeyConstraints: false });
    try { modified.exec(sql); } finally { modified.close(); }
    await assert.rejects(verifyCastDatabase({ dbPath: copy }), { code });
  }
  assert.equal(sha256(await readFile(dbPath)), originalSha256, 'verification must not modify the artifact');
  assert.equal((await stat(dbPath)).mtimeMs, originalMtimeMs, 'read-only checks must preserve the artifact modification time');
});
