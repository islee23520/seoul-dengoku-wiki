import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { readScopeCurrentSource } from './scope-current-source.mjs';
import { readSourceArchive } from '../cast-sqlite/source-archive.mjs';
import { CAST_BACKFILL_SOURCE_HASH } from '../cast-sqlite/cast-backfill-document.mjs';
import { CHARACTER_CONTRACT_SOURCE_HASH } from '../cast-sqlite/character-contract-document.mjs';
import { NAMING_LEDGER_SOURCE_HASH } from '../cast-sqlite/naming-ledger-document.mjs';
import { EDITORIAL_ENVELOPE_SOURCE_HASHES, INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY,
  initializeEditorialEnvelopeDocuments, openEditorialEnvelopeDocuments } from './editorial-envelope-documents.mjs';
import { OPENING_SAMPLE_SOURCE_HASHES, INTERNAL_OPENING_SAMPLE_CAPABILITY,
  initializeOpeningSampleDocuments, openOpeningSampleDocuments } from './opening-sample-documents.mjs';

test('editorial foundation sources retain full order through the integrated scope resolver', {
  skip: !process.env.SCOPE_EDITORIAL_DB,
}, () => {
  const sources = [
    ['lore/name-pools/cast-backfill-draft.json', CAST_BACKFILL_SOURCE_HASH],
    ['lore/editorial/Character-System-Contract.json', CHARACTER_CONTRACT_SOURCE_HASH],
    ...Object.entries(OPENING_SAMPLE_SOURCE_HASHES),
  ];
  if (process.env.SCOPE_EDITORIAL_REMAINDER === '1') sources.push(
    ['lore/editorial/Naming-Ledger.json', NAMING_LEDGER_SOURCE_HASH], ...Object.entries(EDITORIAL_ENVELOPE_SOURCE_HASHES));
  const bytes = new Map(sources.map(([path, hash]) => [path, path === 'lore/name-pools/cast-backfill-draft.json'
    ? readSourceArchive(path, hash) : fs.readFileSync(new URL('../../' + path, import.meta.url))]));
  const expected = new Map([...bytes].map(([path, value]) => [path, JSON.parse(value)]));
  const directory = fs.mkdtempSync(join(tmpdir(), 'scope-opening-sample-'));
  const privatePath = join(directory, 'opening.sqlite');
  const options = { capability: INTERNAL_OPENING_SAMPLE_CAPABILITY, scope: 'internal',
    expectedSourceHashes: OPENING_SAMPLE_SOURCE_HASHES };
  const saved = [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir, JSON.parse];
  let db, openingSample, editorialEnvelopes;
  try {
    initializeOpeningSampleDocuments(privatePath, { ...options, actor: 'scope-integration', reason: 'original sample preservation',
      sources: Object.fromEntries(Object.entries(OPENING_SAMPLE_SOURCE_HASHES).map(([path, hash]) =>
        [path, { bytes: bytes.get(path), expectedSourceHash: hash }])) });
    assert.equal(fs.statSync(privatePath).mode & 0o777, 0o600);
    openingSample = openOpeningSampleDocuments(privatePath, options);
    if (process.env.SCOPE_EDITORIAL_REMAINDER === '1') {
      const envelopePath = join(directory, 'envelopes.sqlite');
      const envelopeOptions = { capability: INTERNAL_EDITORIAL_ENVELOPE_CAPABILITY, scope: 'internal',
        expectedSourceHashes: EDITORIAL_ENVELOPE_SOURCE_HASHES };
      initializeEditorialEnvelopeDocuments(envelopePath, { ...envelopeOptions, actor: 'scope-integration', reason: 'internal proposal preservation',
        sources: Object.fromEntries(Object.entries(EDITORIAL_ENVELOPE_SOURCE_HASHES).map(([path, hash]) =>
          [path, { bytes: bytes.get(path), expectedSourceHash: hash }])) });
      assert.equal(fs.statSync(envelopePath).mode & 0o777, 0o600);
      editorialEnvelopes = openEditorialEnvelopeDocuments(envelopePath, envelopeOptions);
    }
    db = new DatabaseSync(process.env.SCOPE_EDITORIAL_DB, { readOnly: true });
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'opening_sample_documents_%'").get().n, 0);
    const deny = () => { throw new Error('scope editorial filesystem or parser fallback'); };
    fs.readFileSync = fs.readFile = fsp.readFile = fsp.readdir = JSON.parse = deny;
    syncBuiltinESMExports();
    for (const [logicalPath, expectedSha256] of sources) {
      const actual = readScopeCurrentSource({ db, openingSample, editorialEnvelopes, logicalPath, expectedSha256 });
      assert.deepEqual(actual, expected.get(logicalPath));
      assert.equal(JSON.stringify(actual), JSON.stringify(expected.get(logicalPath)));
      assert.throws(() => readScopeCurrentSource({ db, openingSample, editorialEnvelopes, logicalPath, expectedSha256: '0'.repeat(64) }),
        /E_SCOPE_DB_SOURCE_HASH|E_CAST_BACKFILL_DOCUMENT|E_CHARACTER_CONTRACT_DOCUMENT|E_NAMING_LEDGER_DOCUMENT/u);
    }
    if (editorialEnvelopes) for (const [logicalPath, expectedSha256] of Object.entries(EDITORIAL_ENVELOPE_SOURCE_HASHES)) {
      assert.throws(() => readScopeCurrentSource({ db, logicalPath, expectedSha256 }), /E_SCOPE_PRIVATE_SOUL_SOURCE_REQUIRED/u);
      assert.equal(db.prepare('SELECT count(*) AS n FROM source_file WHERE logical_path=?').get(logicalPath).n, 0);
    }
    const [logicalPath, expectedSha256] = Object.entries(OPENING_SAMPLE_SOURCE_HASHES)[0];
    assert.throws(() => readScopeCurrentSource({ db, logicalPath, expectedSha256 }), /E_SCOPE_PRIVATE_SOUL_SOURCE_REQUIRED/u);
  } finally {
    [fs.readFileSync, fs.readFile, fsp.readFile, fsp.readdir, JSON.parse] = saved;
    syncBuiltinESMExports();
    openingSample?.close();
    editorialEnvelopes?.close();
    db?.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
