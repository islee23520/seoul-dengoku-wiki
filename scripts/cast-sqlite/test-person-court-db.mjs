import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { loadDataset } from '../../lore/relations/validate.mjs';
import { openReadOnly } from './db.mjs';
import { loadPersonDetailSources } from './person-detail-inputs.mjs';

test('complete court bundle matches legacy with every runtime source read and JSON parser denied', {
  skip: !process.env.PERSON_COURT_DB,
}, async () => {
  const expected = loadDataset();
  const db = openReadOnly(process.env.PERSON_COURT_DB);
  const saved = [fs.readFileSync, fs.readFile, fs.readdirSync, fs.readdir, fsp.readFile, fsp.readdir, JSON.parse];
  const deny = () => { throw new Error('E_COURT_SOURCE_READ_FORBIDDEN'); };
  try {
    fs.readFileSync = fs.readFile = fs.readdirSync = fs.readdir = fsp.readFile = fsp.readdir = JSON.parse = deny;
    syncBuiltinESMExports();
    const guarded = { prepare(sql) {
      assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b|\bjson_(?:extract|tree|each)\b/iu);
      return db.prepare(sql);
    } };
    const result = await loadPersonDetailSources({ db: guarded, inputSubset: 'court',
      repoRoot: new URL('../..', import.meta.url).pathname });
    assert.deepEqual(result.courtDataset, expected);
    assert.equal(JSON.stringify(result.courtDataset), JSON.stringify(expected));
    assert.deepEqual([...result.issuedById], expected.people.map(person => [person.id, person]));
    assert.deepEqual([...result.issuedIdByName], expected.people.map(person => [person.name, person.id]));
    assert.equal(result.issuedById.size, 1022);
    assert.equal(result.courtDataset.config.courts.length, 14);
    for (const table of ['census_event_identity', 'context_court', 'atlas_identity_values_metadata']) {
      const incomplete = { prepare(sql) {
        const statement = guarded.prepare(sql);
        if (new RegExp(`FROM ${table}\\b`, 'u').test(sql)) {
          return { all: (...args) => statement.all(...args).slice(0, -1) };
        }
        return statement;
      } };
      await assert.rejects(loadPersonDetailSources({ db: incomplete, inputSubset: 'court',
        repoRoot: new URL('../..', import.meta.url).pathname }));
    }
    const missingEvents = { prepare(sql) {
      if (/FROM census_event_/u.test(sql)) throw new Error('no such table: census_event_identity');
      return guarded.prepare(sql);
    } };
    await assert.rejects(loadPersonDetailSources({ db: missingEvents, inputSubset: 'court',
      repoRoot: new URL('../..', import.meta.url).pathname }), /no such table: census_event_identity/u);
  } finally {
    [fs.readFileSync, fs.readFile, fs.readdirSync, fs.readdir, fsp.readFile, fsp.readdir, JSON.parse] = saved;
    syncBuiltinESMExports();
    db.close();
  }
});
