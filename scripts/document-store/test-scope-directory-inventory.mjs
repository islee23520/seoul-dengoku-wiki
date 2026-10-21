import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { resolve } from 'node:path';
import { initializeScopeDirectoryInventory, scopeDirectoryReader, SCOPE_SOURCE_DIRECTORIES } from './scope-directory-inventory.mjs';
import { discoverScopeDocuments } from '../check-seoul-scope.mjs';

const entries = [...SCOPE_SOURCE_DIRECTORIES.map(path => ({ path, kind: 'directory' })),
  { path: 'lore/editorial', kind: 'directory' },
  { path: 'lore/editorial/unapproved.json', kind: 'file' },
  { path: 'docs/reference.md', kind: 'file' }];

test('actual SQLite inventory discovers unapproved sources without consulting a contract or filesystem', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    const receipt = initializeScopeDirectoryInventory(db, entries);
    const readDirectory = scopeDirectoryReader(db, { root: '/no-filesystem', expectedSha256: receipt.sha256 });
    const found = [];
    await discoverScopeDocuments('/no-filesystem', found, readDirectory);
    assert.deepEqual(found, ['lore/editorial/unapproved.json', 'docs/reference.md']);
    await assert.rejects(readDirectory('/elsewhere', { withFileTypes: true }), /E_SCOPE_DIRECTORY_INVENTORY/u);
    await assert.rejects(readDirectory('/no-filesystem/lore', {}), /E_SCOPE_DIRECTORY_INVENTORY/u);
    assert.throws(() => scopeDirectoryReader(db, { root: '/no-filesystem' }), /E_SCOPE_DIRECTORY_INVENTORY/u);
    for (const operation of [
      "DELETE FROM scope_directory_inventory WHERE path='docs/reference.md'",
      "UPDATE scope_directory_inventory SET path='docs/changed.md' WHERE path='docs/reference.md'",
      "INSERT INTO scope_directory_inventory VALUES ('docs/new.md','file')",
      "UPDATE scope_directory_inventory_receipt SET sha256='" + '0'.repeat(64) + "'",
    ]) {
      db.exec('BEGIN');
      db.exec(operation);
      await assert.rejects(readDirectory('/no-filesystem/lore', { withFileTypes: true }), /E_SCOPE_DIRECTORY_INVENTORY/u);
      db.exec('ROLLBACK');
    }
  } finally { db.close(); }
});

test('invalid inventory paths and missing roots are rejected before creating tables', () => {
  for (const changed of [entries.slice(1), [...entries, entries[0]],
    [...entries, { path: '../escape', kind: 'file' }],
    [...entries, { path: 'docs/missing/child.md', kind: 'file' }]]) {
    const db = new DatabaseSync(':memory:');
    try {
      assert.throws(() => initializeScopeDirectoryInventory(db, changed), /E_SCOPE_DIRECTORY_INVENTORY/u);
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema").get().n, 0);
    } finally { db.close(); }
  }
});

test('actual bootstrapped directory inventory matches independent disk discovery with runtime disk access denied', {
  skip: !process.env.SCOPE_INVENTORY_DB,
}, async () => {
  const root = resolve(import.meta.dirname, '../..');
  const expected = [];
  await discoverScopeDocuments(root, expected);
  const receipt = JSON.parse(fs.readFileSync(process.env.SCOPE_INVENTORY_RECEIPT, 'utf8'));
  const db = new DatabaseSync(process.env.SCOPE_INVENTORY_DB, { readOnly: true });
  const saved = [fs.readFileSync, fs.readdirSync, fs.readdir, fsp.readdir, JSON.parse];
  try {
    const readDirectory = scopeDirectoryReader(db, { root, expectedSha256: receipt.directoryInventory.sha256 });
    const deny = () => { throw Error('runtime disk discovery forbidden'); };
    fs.readFileSync = fs.readdirSync = fs.readdir = fsp.readdir = JSON.parse = deny;
    syncBuiltinESMExports();
    const actual = [];
    await discoverScopeDocuments(root, actual, readDirectory);
    assert.deepEqual(actual.sort(), expected.sort());
    assert.equal(db.prepare('SELECT count(*) AS n FROM scope_directory_inventory').get().n, receipt.directoryInventory.entries);
  } finally {
    [fs.readFileSync, fs.readdirSync, fs.readdir, fsp.readdir, JSON.parse] = saved;
    syncBuiltinESMExports();
    db.close();
  }
});
