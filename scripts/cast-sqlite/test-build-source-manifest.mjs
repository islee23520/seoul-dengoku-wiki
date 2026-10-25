import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { BUILD_SOURCE_MANIFEST_HASH, initializeBuildSourceManifest, readBuildSourceManifest } from './build-source-manifest.mjs';
import { readScopeCurrentSource } from '../document-store/scope-current-source.mjs';

const sourceBytes = readFileSync(new URL('../../snapshots/build-inputs/source-manifest.json',import.meta.url));
const original = JSON.parse(sourceBytes);
const options = {sourceBytes,expectedSourceHash:BUILD_SOURCE_MANIFEST_HASH,actor:'test',reason:'exact source manifest preservation'};

test('integrated scope resolver reads the manifest from the real authority without JSON parsing', {
  skip: !process.env.SCOPE_MANIFEST_DB,
}, () => {
  const db = new DatabaseSync(process.env.SCOPE_MANIFEST_DB, { readOnly:true });
  const parse = JSON.parse;
  const selection = { db, logicalPath:'snapshots/build-inputs/source-manifest.json', expectedSha256:BUILD_SOURCE_MANIFEST_HASH };
  try {
    JSON.parse = () => { throw Error('runtime parsing forbidden'); };
    assert.equal(JSON.stringify(readScopeCurrentSource(selection)),JSON.stringify(original));
    assert.throws(()=>readScopeCurrentSource({...selection,expectedSha256:'0'.repeat(64)}),/E_BUILD_SOURCE_MANIFEST/u);
  } finally { JSON.parse=parse; db.close(); }
});

test('entire build manifest reconstructs from named columns with parsing blocked', () => {
  const db = new DatabaseSync(':memory:');
  const parse = JSON.parse;
  try {
    assert.deepEqual(initializeBuildSourceManifest(db,options),{producers:3,files:3});
    JSON.parse = () => { throw Error('runtime parsing forbidden'); };
    assert.equal(JSON.stringify(readBuildSourceManifest(db,options)),JSON.stringify(original));
    assert.throws(()=>readBuildSourceManifest(db,{expectedSourceHash:'0'.repeat(64)}),/E_BUILD_SOURCE_MANIFEST/u);
  } finally { JSON.parse=parse;db.close(); }
});

test('each manifest domain rejects missing, changed and extra rows', () => {
  const db = new DatabaseSync(':memory:');
  try {
    initializeBuildSourceManifest(db,options);
    for (const sql of [
      'DELETE FROM build_source_manifest',
      "UPDATE build_source_manifest SET generator_version='changed'",
      'DELETE FROM build_source_manifest_producer WHERE ordinal=2',
      "UPDATE build_source_manifest_producer SET revision='changed' WHERE ordinal=0",
      "INSERT INTO build_source_manifest_producer VALUES (3,'extra','repo','revision','path')",
      'DELETE FROM build_source_manifest_file WHERE ordinal=2',
      "UPDATE build_source_manifest_file SET sha256='changed' WHERE ordinal=0",
      "INSERT INTO build_source_manifest_file VALUES (3,'extra','changed')",
    ]) {
      db.exec('BEGIN');
      try { db.exec(sql);assert.throws(()=>readBuildSourceManifest(db,options),/E_BUILD_SOURCE_MANIFEST/u); }
      finally { db.exec('ROLLBACK'); }
    }
  } finally { db.close(); }
});

test('invalid source creates no schema and initializer preserves caller transactions', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.throws(()=>initializeBuildSourceManifest(db,{...options,sourceBytes:Buffer.from('{}')}),/E_BUILD_SOURCE_MANIFEST/u);
    assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n,0);
    db.exec('BEGIN');
    assert.throws(()=>initializeBuildSourceManifest(db,options),/E_BUILD_SOURCE_MANIFEST/u);
    assert.equal(db.isTransaction,true);
    db.exec('ROLLBACK');
  } finally { db.close(); }
});
