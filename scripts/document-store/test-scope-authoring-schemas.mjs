import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { AUTHORING_SCHEMA_SOURCE_HASHES } from '../cast-sqlite/authoring-schema-documents.mjs';
import { EDITORIAL_EXAMPLE_SOURCE_HASH } from '../cast-sqlite/editorial-example-document.mjs';
import { readScopeCurrentSource } from './scope-current-source.mjs';

test('actual authority reconstructs all 21 schemas and editorial example without source fallback', {
  skip: !process.env.SCOPE_AUTHORING_DB,
}, () => {
  const pins = { ...AUTHORING_SCHEMA_SOURCE_HASHES, 'lore/editorial/authoring.example.json': EDITORIAL_EXAMPLE_SOURCE_HASH };
  const archive = new DatabaseSync(new URL('../../.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite', import.meta.url), { readOnly: true });
  let expected;
  try {
    expected = new Map(Object.keys(pins).map(path => [path, JSON.parse(Object.hasOwn(AUTHORING_SCHEMA_SOURCE_HASHES, path)
      ? Buffer.from(archive.prepare('SELECT raw_bytes FROM evidence WHERE identity=? AND logical_path=? AND sha256=?')
        .get('scope-read:' + path, path, pins[path]).raw_bytes).toString('utf8')
      : fs.readFileSync(new URL('../../' + path, import.meta.url)))]));
  } finally { archive.close(); }
  const db = new DatabaseSync(process.env.SCOPE_AUTHORING_DB, { readOnly: true });
  const read = fs.readFileSync, parse = JSON.parse;
  try {
    fs.readFileSync = JSON.parse = () => { throw Error('authoring source fallback forbidden'); };
    syncBuiltinESMExports();
    for (const [logicalPath, expectedSha256] of Object.entries(pins)) {
      assert.equal(JSON.stringify(readScopeCurrentSource({ db, logicalPath, expectedSha256 })), JSON.stringify(expected.get(logicalPath)));
      assert.throws(() => readScopeCurrentSource({ db, logicalPath, expectedSha256: '0'.repeat(64) }),
        /E_AUTHORING_SCHEMA_DOCUMENT|E_EDITORIAL_EXAMPLE_DOCUMENT/u);
    }
  } finally { fs.readFileSync = read; JSON.parse = parse; syncBuiltinESMExports(); db.close(); }
});
