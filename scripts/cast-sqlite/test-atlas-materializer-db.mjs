import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { createHash } from 'node:crypto';
import { openReadOnly } from './db.mjs';
import { materializeWorldAtlas } from './atlas-materializer.mjs';
import { PROJECTION_PATHS, canonicalJson } from '../world-atlas-schema.mjs';
import { readEvidenceDocumentReference } from './evidence-document-reference.mjs';

test('actual integrated atlas checks typed envelopes with all source JSON reads blocked', {
  skip: !process.env.WIKI_DOCUMENT_DB,
}, async () => {
  const dbPath = process.env.WIKI_DOCUMENT_DB;
  const before = createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex');
  const db = openReadOnly(dbPath);
  const read = fsp.readFile, readSync = fs.readFileSync, list = fsp.readdir;
  const guard = { prepare(sql) {
    assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b/iu, 'only typed rows and source hash metadata are inputs');
    return db.prepare(sql);
  } };
  try {
    assert.equal(db.prepare('SELECT count(*) AS n FROM person').get().n, 1022);
    assert.equal(db.prepare('SELECT count(*) AS n FROM document_head').get().n, 99);
    fsp.readFile = async (path, ...args) => {
      assert.doesNotMatch(String(path), /\.json$/u, 'source JSON reads forbidden');
      return read(path, ...args);
    };
    fs.readFileSync = (path, ...args) => {
      assert.doesNotMatch(String(path), /\.json$/u, 'synchronous source JSON reads forbidden');
      return readSync(path, ...args);
    };
    fsp.readdir = () => { throw new Error('filesystem projection discovery forbidden'); };
    syncBuiltinESMExports();
    const options = { atlasPath: '/unreadable/World-Narrative-Atlas.json', outDir: '/unreadable', check: true };
    const source = db.prepare("SELECT sha256 FROM source_file WHERE logical_path='lore/World-Narrative-Atlas.json'").get();
    const expected = { atlasHash: source.sha256, projections: [...PROJECTION_PATHS] };
    assert.deepEqual(await materializeWorldAtlas({ ...options, db: guard }), expected);
    assert.deepEqual(await materializeWorldAtlas({ ...options, dbPath }), expected);
    // Root build callers can retain their options after importing the new entry.
    assert.deepEqual(await materializeWorldAtlas(options), expected);
    assert.deepEqual(await materializeWorldAtlas({ ...options, db: guard, projection: PROJECTION_PATHS[0] }), {
      atlasHash: source.sha256, projections: [PROJECTION_PATHS[0]],
    });
    const atlas = readEvidenceDocumentReference(guard, {
      logicalPath: 'lore/World-Narrative-Atlas.json', expectedSha256: source.sha256,
    }).document;
    assert.notEqual(createHash('sha256').update(canonicalJson(atlas)).digest('hex'), source.sha256,
      'atlasHash must retain original source-byte hash, not reserialized envelope hash');
    await assert.rejects(materializeWorldAtlas({ ...options, db: guard, check: false }), /E_ATLAS_DB_READ_ONLY/u);
    await assert.rejects(materializeWorldAtlas({ ...options, db: guard, projection: '../invalid.json' }), /E_PROJECTION_NAME/u);
    await assert.rejects(materializeWorldAtlas({ ...options, db: guard,
      expectedSourceHashes: { 'lore/World-Narrative-Atlas.json': '0'.repeat(64) },
    }), { code: 'E_REFERENCE_SOURCE_HASH' });
    await assert.rejects(materializeWorldAtlas({ ...options, db: guard,
      expectedSourceHashes: { [`lore/${PROJECTION_PATHS[0]}`]: '0'.repeat(64) },
    }), { code: 'E_REFERENCE_SOURCE_HASH' });

    // A different stored source-byte hash leaves typed atlas semantics intact but
    // must invalidate the projections' source.hash. No source archive is parsed.
    const changedSource = { prepare(sql) {
      const statement = guard.prepare(sql);
      return { all(...args) {
        return statement.all(...args).map(row => row.logical_path === 'lore/World-Narrative-Atlas.json'
          || (args[0] === 'lore/World-Narrative-Atlas.json' && Object.hasOwn(row, 'sha256'))
          ? { ...row, sha256: '0'.repeat(64) } : row);
      } };
    } };
    await assert.rejects(materializeWorldAtlas({ ...options, db: changedSource }),
      { message: `E_PROJECTION_STALE:${PROJECTION_PATHS[0]}` });
    const projectionId = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').get(`lore/${PROJECTION_PATHS[0]}`).source_id;
    const corruptProjection = { prepare(sql) {
      const statement = guard.prepare(sql);
      return { all(...args) {
        const rows = statement.all(...args);
        return sql.startsWith('SELECT * FROM text_document_locale ') && args[0] === projectionId
          ? rows.map(row => ({ ...row, title: `${row.title} changed` })) : rows;
      } };
    } };
    await assert.rejects(materializeWorldAtlas({ ...options, db: corruptProjection }), { code: 'E_REFERENCE_INTEGRITY' });
    const missingOrder = { prepare(sql) {
      const statement = guard.prepare(sql);
      return { all(...args) { return sql.startsWith('SELECT * FROM document_key_order ') ? [] : statement.all(...args); } };
    } };
    await assert.rejects(materializeWorldAtlas({ ...options, db: missingOrder }), /E_DOCUMENT_KEY_ORDER/u);
    const missingProjection = { prepare(sql) {
      const statement = guard.prepare(sql);
      return { all(...args) { return statement.all(...args).filter(row => row.logical_path !== `lore/${PROJECTION_PATHS[0]}`); } };
    } };
    await assert.rejects(materializeWorldAtlas({ ...options, db: missingProjection }),
      { message: `E_PROJECTION_MISSING:${PROJECTION_PATHS[0]}` });
    await assert.rejects(materializeWorldAtlas({ ...options, dbPath: `${dbPath}.missing` }), { code: 'E_DB_OPEN' });
  } finally {
    fsp.readFile = read; fs.readFileSync = readSync; fsp.readdir = list;
    syncBuiltinESMExports();
    db.close();
  }
  assert.equal(createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex'), before, 'database bytes unchanged');
});
