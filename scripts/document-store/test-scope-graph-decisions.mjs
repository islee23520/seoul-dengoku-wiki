import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { WORLD_GRAPH_SOURCE_HASH } from '../cast-sqlite/world-graph-document.mjs';
import { EDITORIAL_DECISION_SOURCE_HASHES } from '../cast-sqlite/editorial-decision-documents.mjs';
import { readScopeCurrentSource } from './scope-current-source.mjs';

test('actual scope graph and decision sources reconstruct completely without filesystem or JSON parser fallback', {
  skip: !process.env.SCOPE_GRAPH_DECISIONS_DB,
}, () => {
  const sources = [['snapshots/build-inputs/SeoulWorldGraph.json', WORLD_GRAPH_SOURCE_HASH],
    ...Object.entries(EDITORIAL_DECISION_SOURCE_HASHES)];
  const expected = new Map(sources.map(([path]) => [path, JSON.parse(fs.readFileSync(new URL('../../' + path, import.meta.url)))]));
  const db = new DatabaseSync(process.env.SCOPE_GRAPH_DECISIONS_DB, { readOnly: true });
  const saved = [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir, JSON.parse];
  try {
    const deny = () => { throw Error('scope graph source fallback forbidden'); };
    fs.readFileSync = fs.readFile = fsp.readFile = fsp.readdir = JSON.parse = deny;
    syncBuiltinESMExports();
    for (const [logicalPath, expectedSha256] of sources) {
      const actual = readScopeCurrentSource({ db, logicalPath, expectedSha256 });
      assert.deepEqual(actual, expected.get(logicalPath));
      assert.equal(JSON.stringify(actual), JSON.stringify(expected.get(logicalPath)));
      assert.throws(() => readScopeCurrentSource({ db, logicalPath, expectedSha256: '0'.repeat(64) }),
        /E_WORLD_GRAPH_PIN|E_EDITORIAL_DECISION_DOCUMENT/u);
    }
  } finally {
    [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir, JSON.parse] = saved;
    syncBuiltinESMExports(); db.close();
  }
});
