import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { FAMILY_INPUT_SOURCE_HASHES } from './family-inputs.mjs';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { openReadOnly } from './db.mjs';
import { readPersonBirthdayInputs } from './person-inputs.mjs';
import { loadPersonDetailSources } from './person-detail-inputs.mjs';
import { validateCastBirthdays } from '../cast-birthdays.mjs';

const path = name => `lore/name-pools/${name}.json`;
const names = ['person-id-registry', 'cast-birthdays', 'cast-birth-cohorts'];
const bytes = names.map(name => readSourceArchive(path(name), FAMILY_INPUT_SOURCE_HASHES[path(name)]));
const [registry, birthdays, cohorts] = bytes.map(value => JSON.parse(value));
const expectedSourceHashes = Object.fromEntries(names.map((name, i) => [path(name), createHash('sha256').update(bytes[i]).digest('hex')]));
const expected = { birthdayRoster: registry.persons, birthdaysById: validateCastBirthdays(birthdays, registry.persons) };

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec('PRAGMA foreign_keys=OFF');
  // Exact typed DDL, with FK enforcement off only to omit unrelated fixture domains.
  const schemas = ['schema.sql', 'current-family.sql', 'current-identity-provenance.sql'].map(name => readFileSync(new URL(name, import.meta.url), 'utf8')).join('\n');
  for (const table of ['source_file', 'person', 'person_alias', 'identity_registry_provenance', 'family_source_metadata', 'family_birthday', 'family_birthday_source', 'family_birth_cohort', 'family_birth_cohort_assignment']) {
    const ddl = schemas.match(new RegExp(`CREATE TABLE ${table} \\([\\s\\S]*?\\) STRICT;`))?.[0];
    assert.ok(ddl, table);
    db.exec(ddl);
  }
  const insert = (table, row) => {
    const columns = Object.keys(row);
    db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...Object.values(row));
  };
  names.forEach((name, i) => insert('source_file', { source_id: i + 1, logical_path: path(name), media_type: 'application/json', sha256: expectedSourceHashes[path(name)], byte_length: 8, raw_bytes: Buffer.from('not JSON') }));
  registry.persons.forEach((p, i) => insert('person', { person_id: p.id, name: p.name, publication_ordinal: i + 1, public_key: `fixture-${i}`, public_route: `/fixture/${i}`, minors: 0, values_source_ordinal: i }));
  registry.persons.forEach(p => (p.aliases ?? []).forEach((alias, i) => insert('person_alias', { person_id: p.id, alias, alias_ordinal: i })));
  insert('identity_registry_provenance', { source_id: 1, schema_name: registry.schema, total_people: registry.totalPeople, existing_k_count: registry.existingKCount, issued_count: registry.issuedCount, approved_by: registry.approvalRef.approvedBy, approved_at: registry.approvalRef.approvedAt, owner_ref: registry.approvalRef.ownerRef, input_sha256: registry.approvalRef.inputSha256, candidates_sha256: registry.approvalRef.candidatesSha256, approval_scope: 'registry-source-event-only', json_pointer: '', approval_json_pointer: '/approvalRef' });
  insert('family_source_metadata', { source_id: 2, field_name: 'schemaVersion', value_kind: 'number', integer_value: birthdays.schemaVersion, json_pointer: '/schemaVersion' });
  insert('family_source_metadata', { source_id: 2, field_name: 'ageAsOf', value_kind: 'string', text_value: birthdays.ageAsOf, json_pointer: '/ageAsOf' });
  birthdays.people.forEach((p, i) => {
    insert('family_birthday', { person_id: p.id, birth_date: p.birthDate, source_status: p.sourceStatus, source_id: 2, json_pointer: `/people/${i}` });
    p.sourceRefs.forEach((ref, j) => insert('family_birthday_source', { person_id: p.id, ordinal: j, source_id: 2, json_pointer: `/people/${i}/sourceRefs/${j}`, source_ref: ref }));
  });
  cohorts.cohorts.forEach((c, i) => insert('family_birth_cohort', { cohort_id: c.id, start_year: c.startYear, end_year: c.endYear, source_id: 3, json_pointer: `/cohorts/${i}` }));
  cohorts.assignments.forEach((a, i) => insert('family_birth_cohort_assignment', { person_id: a.personId, cohort_id: a.cohort, baseline_birth_date: a.baselineBirthDate, source_id: 3, json_pointer: `/assignments/${i}` }));
  return db;
}
const typedOnly = db => ({ prepare(sql) {
  assert.doesNotMatch(sql, /\bsource_record\b|\braw_bytes\b|\bjson_(?:extract|tree|each)\b/iu);
  return db.prepare(sql);
} });

test('actual loader DB subset exactly matches canonical roster and birthday inputs for all 1022 IDs', async t => {
  const db = fixture(t);
  const actual = await loadPersonDetailSources({ db: typedOnly(db), inputSubset: 'registry-birthdays', expectedSourceHashes, repoRoot: '/does-not-exist' });
  assert.deepEqual(actual, expected);
  assert.equal(actual.birthdayRoster.length, 1022);
  assert.equal(actual.birthdaysById.size, 1022);
  assert.deepEqual(readPersonBirthdayInputs(typedOnly(db)), expected);
});

test('explicit DB mode rejects unsupported full bundle without consulting filesystem', async t => {
  const db = fixture(t);
  await assert.rejects(loadPersonDetailSources({ db, repoRoot: '/does-not-exist' }), { code: 'E_PERSON_INPUT_UNSUPPORTED' });
  await assert.rejects(loadPersonDetailSources({ db, inputSubset: 'other' }), { code: 'E_PERSON_INPUT_UNSUPPORTED' });
});

test('missing and stale source bindings fail closed', t => {
  const db = fixture(t);
  assert.throws(() => readPersonBirthdayInputs(db, { expectedSourceHashes: {} }), { code: 'E_PERSON_INPUT_STALE' });
  db.exec("DELETE FROM source_file WHERE logical_path='lore/name-pools/cast-birthdays.json'");
  assert.throws(() => readPersonBirthdayInputs(db), { code: 'E_PERSON_INPUT_MISSING' });
});

test('missing typed schema or metadata and incomplete roster fail closed', t => {
  const db = fixture(t);
  db.exec("DELETE FROM family_source_metadata WHERE field_name='ageAsOf'");
  assert.throws(() => readPersonBirthdayInputs(db), { code: 'E_PERSON_INPUT_SCHEMA_GAP' });
  db.exec('DROP TABLE family_source_metadata');
  assert.throws(() => readPersonBirthdayInputs(db), { code: 'E_PERSON_INPUT_SCHEMA_GAP' });
  db.exec("DELETE FROM person WHERE person_id='K001'");
  assert.throws(() => readPersonBirthdayInputs(db), { code: 'E_PERSON_INPUT_COVERAGE' });
});

test('birthday omissions, invalid dates, references and cohort violations reject', t => {
  const db = fixture(t);
  db.exec("UPDATE family_birthday SET birth_date='2126-02-30' WHERE person_id='K001'");
  assert.throws(() => readPersonBirthdayInputs(db), { code: 'E_BIRTH_DATE' });
  db.prepare("UPDATE family_birthday SET birth_date=? WHERE person_id='K001'").run(birthdays.people.find(p => p.id === 'K001').birthDate);
  db.exec("UPDATE family_birth_cohort_assignment SET cohort_id=999 WHERE person_id='K001'");
  assert.throws(() => readPersonBirthdayInputs(db), { code: 'E_PERSON_INPUT_COVERAGE' });
  db.prepare("UPDATE family_birth_cohort_assignment SET cohort_id=? WHERE person_id='K001'").run(cohorts.assignments.find(p => p.personId === 'K001').cohort);
  db.exec("UPDATE family_birthday SET birth_date='1900-01-01' WHERE person_id='K001'");
  assert.throws(() => readPersonBirthdayInputs(db), { code: 'E_BIRTH_COHORT_RANGE' });
  db.prepare("UPDATE family_birthday SET birth_date=? WHERE person_id='K001'").run(birthdays.people.find(p => p.id === 'K001').birthDate);
  db.exec("DELETE FROM family_birthday_source WHERE person_id='K001'");
  assert.throws(() => readPersonBirthdayInputs(db), { code: 'E_BIRTH_SOURCE_REFS' });
  db.exec("DELETE FROM family_birthday WHERE person_id='K001'");
  assert.throws(() => readPersonBirthdayInputs(db), { code: 'E_PERSON_INPUT_COVERAGE' });
});

if (process.env.PERSON_INPUT_DB) {
  test('active bootstrap DB exact parity and import-time filesystem isolation', async t => {
    const db = openReadOnly(process.env.PERSON_INPUT_DB);
    t.after(() => db.close());
    assert.deepEqual(await loadPersonDetailSources({ db: typedOnly(db), inputSubset: 'registry-birthdays', expectedSourceHashes }), expected);
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import fs from 'node:fs'; import fsp from 'node:fs/promises'; import {syncBuiltinESMExports} from 'node:module';
      import {openReadOnly} from ${JSON.stringify(new URL('./db.mjs', import.meta.url).href)};
      const db=openReadOnly(process.env.PERSON_INPUT_DB);
      const denied=()=>{throw new Error('filesystem source read forbidden')};
      const scriptRead=fs.readFileSync;
      fs.readFileSync=(p,...args)=>{if(!/\.(?:mjs|js|cjs)$/.test(String(p))) denied(); return scriptRead(p,...args)};
      fs.readFile=denied; fs.readdirSync=denied; fs.readdir=denied;
      fsp.readFile=denied; fsp.readdir=denied; syncBuiltinESMExports();
      const {loadPersonDetailSources}=await import(${JSON.stringify(new URL('./person-detail-inputs.mjs', import.meta.url).href)});
      const s=await loadPersonDetailSources({db,inputSubset:'registry-birthdays'});
      if(s.birthdayRoster.length!==1022 || s.birthdaysById.size!==1022) throw new Error('coverage');
      db.close(); console.log('DB_ONLY_1022');
    `], { encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /DB_ONLY_1022/);
  });
}
