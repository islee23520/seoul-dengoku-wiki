import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { PERSON_IDENTITY_SOURCE_HASHES } from './person-identity-inputs.mjs';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { openReadOnly } from './db.mjs';
import { readPortraitGenderInputs } from './portrait-gender-input.mjs';

test('portrait gender locks match all actual authored people without source archive queries', {
  skip: !process.env.PERSON_INPUT_DB,
}, () => {
  const db = openReadOnly(process.env.PERSON_INPUT_DB);
  try {
    const guarded = { prepare(sql) {
      assert.doesNotMatch(sql, /source_file|source_record|raw_bytes/iu);
      return db.prepare(sql);
    } };
    const expected = JSON.parse(readSourceArchive('lore/name-pools/gender-cast.json', PERSON_IDENTITY_SOURCE_HASHES.gender));
    const actual = readPortraitGenderInputs(guarded);
    assert.equal(actual.size, 1022);
    for (const row of expected.people) assert.deepEqual(actual.get(row.name), {
      gender: row.gender, user_locked: row.user_locked ?? false,
    });
  } finally { db.close(); }
});

test('missing people and invalid gender locks cannot produce token defaults', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE person(person_id TEXT,name TEXT,publication_ordinal INTEGER);
      CREATE TABLE person_gender(person_id TEXT,gender TEXT,user_locked INTEGER);`);
    const person = db.prepare('INSERT INTO person VALUES(?,?,?)');
    const gender = db.prepare('INSERT INTO person_gender VALUES(?,?,?)');
    db.exec('BEGIN');
    for (let i = 1; i <= 1022; i++) {
      person.run(`K${i}`, `name-${i}`, i);
      gender.run(`K${i}`, '여성', 0);
    }
    db.exec('COMMIT');
    assert.equal(readPortraitGenderInputs(db).size, 1022);
    db.exec("UPDATE person_gender SET user_locked=2 WHERE person_id='K1'");
    assert.throws(() => readPortraitGenderInputs(db), /E_PORTRAIT_GENDER_INPUT/);
    db.exec("UPDATE person_gender SET user_locked=0,gender='unknown' WHERE person_id='K1'");
    assert.throws(() => readPortraitGenderInputs(db), /E_PORTRAIT_GENDER_INPUT/);
    db.exec("DELETE FROM person_gender WHERE person_id='K1'");
    assert.throws(() => readPortraitGenderInputs(db), /E_PORTRAIT_GENDER_INPUT/);
  } finally { db.close(); }
});
