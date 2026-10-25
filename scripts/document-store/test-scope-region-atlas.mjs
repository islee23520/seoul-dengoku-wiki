import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { REGION_ATLAS_SOURCE_HASH } from '../cast-sqlite/region-atlas-document.mjs';
import { readScopeCurrentSource } from './scope-current-source.mjs';

test('actual authority restores all original atlas assignment bytes through scope without source fallback', {
  skip: !process.env.SCOPE_REGION_ATLAS_DB,
}, () => {
  const logicalPath = 'snapshots/build-inputs/atlas-data.js';
  const expected = fs.readFileSync(new URL('../../' + logicalPath, import.meta.url), 'utf8');
  const db = new DatabaseSync(process.env.SCOPE_REGION_ATLAS_DB, { readOnly: true });
  const read = fs.readFileSync, parse = JSON.parse;
  try {
    fs.readFileSync = JSON.parse = () => { throw Error('atlas source fallback forbidden'); };
    syncBuiltinESMExports();
    assert.equal(readScopeCurrentSource({ db, logicalPath, expectedSha256: REGION_ATLAS_SOURCE_HASH }), expected);
    assert.throws(() => readScopeCurrentSource({ db, logicalPath, expectedSha256: '0'.repeat(64) }), /E_REGION_ATLAS_DOCUMENT/u);
  } finally { fs.readFileSync = read; JSON.parse = parse; syncBuiltinESMExports(); db.close(); }
});
