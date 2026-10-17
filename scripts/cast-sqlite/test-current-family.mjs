import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { FAMILY_TABLE_COLUMNS, mapFamilyDomains } from './current-family.mjs';
import { parseDocument } from './sources.mjs';

const FAMILY_SOURCES = Object.freeze([
  'cast-birthdays',
  'cast-birth-cohorts',
  'cast-family-trees',
  'cast-family-parent-status',
  'cast-family-role-decisions',
  'cast-household-relations',
  'diaspora-family-lineages',
  'household-humanoid-policy',
]);

async function corpus() {
  const root = resolve(import.meta.dirname, '..', '..');
  const registry = JSON.parse(await readFile(resolve(root, 'lore/name-pools/person-id-registry.json'), 'utf8'));
  const files = await Promise.all(FAMILY_SOURCES.map(async (name, index) => {
    const logical_path = `lore/name-pools/${name}.json`;
    const raw_bytes = await readFile(resolve(root, logical_path));
    const parsed = parseDocument(raw_bytes.toString('utf8'));
    return {
      source_id: index + 1,
      logical_path,
      document: parsed.document,
      records: parsed.records,
      sha256: createHash('sha256').update(raw_bytes).digest('hex'),
      byte_length: raw_bytes.length,
      raw_bytes,
    };
  }));
  return {
    bundle: { files },
    identity: { people: registry.persons.map(({ id, name }) => ({ person_id: id, name })) },
  };
}

function database(input) {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE person(person_id TEXT PRIMARY KEY) STRICT;
    CREATE TABLE source_file(source_id INTEGER PRIMARY KEY,logical_path TEXT NOT NULL) STRICT;
    CREATE TABLE source_record(source_id INTEGER NOT NULL,json_pointer TEXT NOT NULL,PRIMARY KEY(source_id,json_pointer),FOREIGN KEY(source_id) REFERENCES source_file(source_id)) STRICT;
  `);
  const insertPerson = db.prepare('INSERT INTO person(person_id) VALUES (?)');
  for (const person of input.identity.people) insertPerson.run(person.person_id);
  const insertFile = db.prepare('INSERT INTO source_file(source_id,logical_path) VALUES (?,?)');
  const insertRecord = db.prepare('INSERT INTO source_record(source_id,json_pointer) VALUES (?,?)');
  db.exec('BEGIN');
  for (const file of input.bundle.files) {
    insertFile.run(file.source_id, file.logical_path);
    for (const record of file.records) insertRecord.run(file.source_id, record.json_pointer);
  }
  db.exec('COMMIT');
  return db;
}

function insertRows(db, tables) {
  db.exec('BEGIN');
  for (const [table, columns] of Object.entries(FAMILY_TABLE_COLUMNS)) {
    const statement = db.prepare(`INSERT INTO ${table}(${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
    for (const row of tables[table]) statement.run(...columns.map((column) => row[column]));
  }
  db.exec('COMMIT');
}

test('actual family corpus maps source/status-faithful normalized rows into STRICT SQLite', async (t) => {
  // Given: the current family, household, diaspora, and policy source corpus.
  const input = await corpus();
  const before = structuredClone({
    bundle: { files: input.bundle.files.map(({ source_id, logical_path, document }) => ({ source_id, logical_path, document })) },
    identity: input.identity,
  });

  // When: the family domains are normalized and inserted through their published column contract.
  const tables = mapFamilyDomains(input);
  const db = database(input);
  db.exec(await readFile(resolve(import.meta.dirname, 'current-family.sql'), 'utf8'));
  insertRows(db, tables);

  // Then: anonymous family nodes remain distinct from cast persons and authored states remain queryable.
  assert.deepEqual(Object.keys(tables), Object.keys(FAMILY_TABLE_COLUMNS));
  assert.equal(tables.family_birthday.length, input.identity.people.length);
  assert.equal(tables.household_person.length, input.identity.people.length);
  const household = input.bundle.files.find((file) => file.logical_path.endsWith('/cast-household-relations.json')).document;
  const role = input.bundle.files.find((file) => file.logical_path.endsWith('/cast-family-role-decisions.json')).document;
  const policy = input.bundle.files.find((file) => file.logical_path.endsWith('/household-humanoid-policy.json')).document;
  assert.equal(tables.family_role_decision.length, Object.values(role).filter(Array.isArray).reduce((count, rows) => count + rows.length, 0));
  assert.equal(tables.household_court_retainer_source.length, household.people.reduce((count, person) => count + (person.court?.retainers ?? []).reduce((sum, retainer) => sum + retainer.sourceRefs.length, 0) + (person.directRetainer?.sourceRefs.length ?? 0), 0));
  assert.equal(tables.household_humanoid_context_source.length, household.existingHumanoidContext.reduce((count, row) => count + row.sourceRefs.length, 0));
  assert.equal(tables.household_policy_political_position.length, Object.keys(policy.politicalPositions).length);
  assert.equal(tables.household_policy_source.length, policy.sourceRefs.length);
  const k001 = household.people.find((person) => person.personId === 'K001');
  assert.deepEqual({ ...db.prepare('SELECT normalized_social_contact,family_parent,faith_unresolved,background_contact_authoring FROM household_person WHERE person_id=?').get('K001') }, {
    normalized_social_contact: Number(k001.deficits.normalizedSocialContact),
    family_parent: Number(k001.deficits.familyParent),
    faith_unresolved: Number(k001.deficits.faithUnresolved),
    background_contact_authoring: k001.deficits.backgroundContactAuthoring,
  });
  assert.equal(db.prepare("SELECT text_value FROM family_source_metadata WHERE field_name='ageAsOf'").get().text_value, '2126-12-31');
  assert.equal(db.prepare("SELECT text_value FROM family_role_decision_fact WHERE decision_group='approvedExternalMaternalAncestors' AND ordinal=0 AND field_path='/proposedAfter/name'").get().text_value, role.approvedExternalMaternalAncestors[0].proposedAfter.name);
  assert.equal(db.prepare("SELECT text_value FROM family_role_decision_fact WHERE decision_group='maternalCorrections' AND ordinal=0 AND field_path='/afterMother/name'").get().text_value, role.maternalCorrections[0].afterMother.name);
  assert.equal(db.prepare("SELECT position FROM household_policy_political_position WHERE entity_key='S02'").get().position, policy.politicalPositions.S02);
  assert.ok(tables.family_node.some((row) => row.person_id === null));
  assert.ok(tables.household_link.some((row) => row.status === 'source-projection'));
  assert.equal(db.prepare("SELECT status FROM household_manifest WHERE manifest_id='cast-household-relations'").get().status, 'draft');
  assert.equal(db.prepare("SELECT count(*) AS count FROM household_link WHERE recipient_kind='family-node'").get().count > 0, true);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.deepEqual({
    bundle: { files: input.bundle.files.map(({ source_id, logical_path, document }) => ({ source_id, logical_path, document })) },
    identity: input.identity,
  }, before);
  db.close();
  t.diagnostic(JSON.stringify(Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, rows.length]))));
});

test('mapping rejects an unrecognized household recipient kind before SQLite insertion', async () => {
  // Given: a complete current corpus with a malformed household relation.
  const input = await corpus();
  const household = input.bundle.files.find((file) => file.logical_path.endsWith('/cast-household-relations.json')).document;
  household.people[0].knownLinks[0].recipientKind = 'unrecognized-kind';

  // When/Then: the parser rejects the value at its input boundary.
  assert.throws(() => mapFamilyDomains(input), { code: 'E_FAMILY_HOUSEHOLD_RECIPIENT_KIND' });
});

test('mapping rejects a non-boolean household deficit before SQLite insertion', async () => {
  const input = await corpus();
  const household = input.bundle.files.find((file) => file.logical_path.endsWith('/cast-household-relations.json')).document;
  household.people[0].deficits.faithUnresolved = 'false';
  assert.throws(() => mapFamilyDomains(input), { code: 'E_FAMILY_BOOLEAN' });
});

test('mapping stops if future private-retainer rows would be silently omitted', async () => {
  const input = await corpus();
  const household = input.bundle.files.find((file) => file.logical_path.endsWith('/cast-household-relations.json')).document;
  household.people[0].household.newPrivateRetainers.push({ id: 'future-retainer' });
  assert.throws(() => mapFamilyDomains(input), { code: 'E_FAMILY_NEW_RETAINER_UNMAPPED' });
});

test('family SQL rejects a source pointer that is absent from the raw-source record index', async () => {
  // Given: the smallest valid referenced person and raw source envelope.
  const db = new DatabaseSync(':memory:');
  db.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE person(person_id TEXT PRIMARY KEY) STRICT;
    CREATE TABLE source_file(source_id INTEGER PRIMARY KEY,logical_path TEXT NOT NULL) STRICT;
    CREATE TABLE source_record(source_id INTEGER NOT NULL,json_pointer TEXT NOT NULL,PRIMARY KEY(source_id,json_pointer),FOREIGN KEY(source_id) REFERENCES source_file(source_id)) STRICT;
    INSERT INTO person VALUES ('K001');
    INSERT INTO source_file VALUES (1,'fixture.json');
    INSERT INTO source_record VALUES (1,'');
  `);
  db.exec(await readFile(resolve(import.meta.dirname, 'current-family.sql'), 'utf8'));

  // When/Then: a normalized row cannot claim a raw JSON pointer that was never indexed.
  assert.throws(
    () => db.prepare('INSERT INTO family_birthday VALUES (?,?,?,?,?)').run('K001', '2069-06-17', 'owner-authored', 1, '/missing'),
    /FOREIGN KEY/,
  );
  db.close();
});
