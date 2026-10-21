import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { loadPersonDetailSources as loadLegacy } from '../person-detail-inputs.mjs';
import { loadPersonDetailSources, loadMigratedPersonInputs } from './person-detail-inputs.mjs';
import { openReadOnly } from './db.mjs';

test('all migrated person source domains match one legacy snapshot on one readonly DB connection', {
  skip: !process.env.COMPLETE_PERSON_INPUT_DB,
}, async () => {
  const repoRoot = new URL('../..', import.meta.url).pathname;
  const expected = await loadLegacy({ repoRoot });
  const db = openReadOnly(process.env.COMPLETE_PERSON_INPUT_DB);
  const originals = [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir, JSON.parse];
  const deny = () => { throw new Error('E_PERSON_BUNDLE_SOURCE_FORBIDDEN'); };
  try {
    fs.readFileSync = fs.readFile = fsp.readFile = fsp.readdir = JSON.parse = deny;
    syncBuiltinESMExports();
    db.exec('BEGIN');
    const bundle = await loadMigratedPersonInputs({ db, repoRoot });
    for (const [key, value] of Object.entries(bundle)) {
      assert.deepEqual(value, expected[key], `bundle:${key}`);
      const ordered = item => JSON.stringify(item instanceof Map ? [...item] : item);
      assert.equal(ordered(value), ordered(expected[key]), `bundle:${key}:order`);
    }
    for (const inputSubset of ['core', 'cards', 'contacts', 'identity', 'atlas', 'court', 'holdings',
      'offices', 'allocation', 'interiors', 'preserved-sheets', 'permissions', 'issued-sheets']) {
      const result = await loadPersonDetailSources({ db, inputSubset, repoRoot, preserveFamilySourceOrder: true });
      if (inputSubset === 'issued-sheets') result.issuedSheets = result.issuedSheets.people;
      for (const [key, value] of Object.entries(result)) {
        assert.deepEqual(value, expected[key], `${inputSubset}:${key}`);
        const serialized = item => JSON.stringify(item instanceof Map ? [...item] : item);
        if (serialized(value) !== serialized(expected[key])) {
          const firstOrderDifference = (left, right, path = '') => {
            if (!left || typeof left !== 'object') return null;
            if (JSON.stringify(Object.keys(left)) !== JSON.stringify(Object.keys(right))) {
              return { path, actual: Object.keys(left), expected: Object.keys(right) };
            }
            for (const field of Object.keys(left)) {
              const found = firstOrderDifference(left[field], right[field], `${path}/${field}`);
              if (found) return found;
            }
            return null;
          };
          assert.fail(JSON.stringify({ inputSubset, key, difference: firstOrderDifference(value, expected[key]) }));
        }
        assert.equal(serialized(value), serialized(expected[key]), `${inputSubset}:${key}:order`);
      }
    }
    db.exec('COMMIT');
  } finally {
    [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir, JSON.parse] = originals;
    syncBuiltinESMExports();
    db.close();
  }
});
