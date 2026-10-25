import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { PERSON_IDENTITY_SOURCE_HASHES } from './person-identity-inputs.mjs';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { openReadOnly } from './db.mjs';
import { readPortraitFamilyInputs } from './portrait-family-input.mjs';

test('token family bases match authored family evidence without parsing generated code', () => {
  const db = openReadOnly(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname);
  try {
    const lineage = JSON.parse(readSourceArchive('lore/name-pools/cast-hangnyeol.json', PERSON_IDENTITY_SOURCE_HASHES.lineage));
    const publicKeys = new Map(db.prepare('SELECT name,public_key FROM person ORDER BY publication_ordinal').all().map(row => [row.name, row.public_key]));
    const expected = new Map(lineage.people.filter(person => person.namingConvention === 'non-korean-lineage')
      .map(person => [publicKeys.get(person.name), { basis: person.reason }]));
    assert.ok(expected.size > 0);
    const guarded = { prepare(sql) {
      assert.doesNotMatch(sql, /raw_bytes|source_record/iu);
      return db.prepare(sql);
    } };
    assert.deepEqual(readPortraitFamilyInputs(guarded), expected);
  } finally { db.close(); }
});

test('missing lineage rows and stale source pins cannot silently change token heritage', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.prepare('ATTACH DATABASE ? AS authority').run(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname);
    for (const table of ['person', 'person_lineage']) db.exec(`CREATE TABLE ${table} AS SELECT * FROM authority.${table}`);
    db.exec('CREATE TABLE source_file AS SELECT logical_path,sha256 FROM authority.source_file; DETACH DATABASE authority');
    assert.equal(readPortraitFamilyInputs(db).size, 62);
    db.exec('BEGIN');
    db.exec("DELETE FROM person_lineage WHERE person_id=(SELECT person_id FROM person_lineage WHERE naming_convention='non-korean-lineage' LIMIT 1)");
    assert.throws(() => readPortraitFamilyInputs(db), /E_PORTRAIT_FAMILY_INPUT/);
    db.exec('ROLLBACK');
    db.exec("UPDATE source_file SET sha256='stale' WHERE logical_path='lore/name-pools/cast-hangnyeol.json'");
    assert.throws(() => readPortraitFamilyInputs(db), /E_PORTRAIT_FAMILY_INPUT/);
  } finally { db.close(); }
});
