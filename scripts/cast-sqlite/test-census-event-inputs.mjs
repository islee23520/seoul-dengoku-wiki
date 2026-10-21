import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { initializeCensusEventInputs, readCensusEventInputs, readCensusEventDocument, CENSUS_EVENT_SOURCE_SHA256 } from './census-event-inputs.mjs';
import { readScopeCurrentSource } from '../document-store/scope-current-source.mjs';
import { readPrivateSourceArchive } from '../document-store/private-source-archive.mjs';

test('all 191 immutable census identities preserve order and reject loss or source drift', () => {
  const bytes = readPrivateSourceArchive(new URL('../../', import.meta.url).pathname, 'lore/editorial/seoul-narrative-census-events.json', CENSUS_EVENT_SOURCE_SHA256);
  const original = JSON.parse(bytes);
  const expected = original.eventIds;
  const db = new DatabaseSync(':memory:');
  try {
    assert.throws(() => initializeCensusEventInputs(db, { bytes: Buffer.from('{}'), actor: 'test', reason: 'test' }), /E_CENSUS_EVENT_INPUT/u);
    assert.deepEqual(initializeCensusEventInputs(db, { bytes, actor: 'root-test', reason: 'exact archive migration' }), expected);
    const guarded = { prepare(sql) { assert.doesNotMatch(sql, /raw_bytes|source_record/u); return db.prepare(sql); } };
    assert.deepEqual(readCensusEventInputs(guarded), expected);
    const options = { expectedSourceHash: CENSUS_EVENT_SOURCE_SHA256 };
    assert.equal(JSON.stringify(readCensusEventDocument(guarded, options)), JSON.stringify(original));
    assert.throws(() => readCensusEventDocument(guarded, { expectedSourceHash: '0'.repeat(64) }), /E_CENSUS_EVENT_INPUT/u);
    assert.throws(() => readCensusEventDocument(guarded), /E_CENSUS_EVENT_INPUT/u);
    db.exec('BEGIN');
    db.exec("UPDATE census_event_import SET schema_name='other-schema'");
    assert.throws(() => readCensusEventInputs(db), /E_CENSUS_EVENT_INPUT/u);
    db.exec('ROLLBACK');
    const parse = JSON.parse;
    try {
      JSON.parse = () => { throw new Error('runtime JSON parsing forbidden'); };
      assert.deepEqual(readCensusEventInputs(guarded), expected);
      assert.deepEqual(readScopeCurrentSource({ db: guarded,
        logicalPath: 'lore/editorial/seoul-narrative-census-events.json',
        expectedSha256: CENSUS_EVENT_SOURCE_SHA256 }), original);
    } finally { JSON.parse = parse; }
    db.exec('BEGIN');
    db.exec("UPDATE census_event_identity SET event_id='E:invented' WHERE ordinal=0");
    assert.throws(() => readCensusEventInputs(db), /E_CENSUS_EVENT_INPUT/u);
    db.exec('ROLLBACK');
    db.exec('BEGIN');
    const changed = [...expected]; changed[0] = 'E:invented';
    db.exec("UPDATE census_event_identity SET event_id='E:invented' WHERE ordinal=0");
    db.prepare('UPDATE census_event_import SET event_ids_sha256=?').run(createHash('sha256').update(JSON.stringify(changed)).digest('hex'));
    assert.throws(() => readCensusEventInputs(db), /E_CENSUS_EVENT_INPUT/u);
    db.exec('ROLLBACK');
    db.exec('BEGIN');
    db.exec("UPDATE census_event_import SET description='changed'");
    assert.throws(() => readCensusEventDocument(db, options), /E_CENSUS_EVENT_INPUT/u);
    db.exec('ROLLBACK');
    db.exec('DELETE FROM census_event_identity WHERE ordinal=190');
    assert.throws(() => readCensusEventInputs(db), /E_CENSUS_EVENT_INPUT/u);
  } finally { db.close(); }
});
