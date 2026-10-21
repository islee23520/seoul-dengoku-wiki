import assert from 'node:assert/strict';
import test from 'node:test';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { approvedDocuments } from '../catalog-admission.mjs';
import { openReadOnly } from './db.mjs';

test('DB admission discovery preserves exact filesystem candidates without reading lore files', {
  skip: !process.env.EVIDENCE_DOCUMENT_DB,
}, async () => {
  const root = new URL('../../lore', import.meta.url).pathname;
  const selectedDatabase = process.env.WIKI_DOCUMENT_DB;
  let expected;
  try {
    delete process.env.WIKI_DOCUMENT_DB;
    expected = await approvedDocuments(root);
  } finally {
    if (selectedDatabase !== undefined) process.env.WIKI_DOCUMENT_DB = selectedDatabase;
  }
  const db = openReadOnly(process.env.EVIDENCE_DOCUMENT_DB);
  const read = fsp.readFile, list = fsp.readdir, access = fsp.access;
  try {
    fsp.readFile = async (path, ...options) => {
      assert.ok(!String(path).includes('/lore/'), `source document read: ${path}`);
      return read(path, ...options);
    };
    fsp.readdir = () => { throw new Error('source discovery forbidden'); };
    fsp.access = () => { throw new Error('source existence checks forbidden'); };
    syncBuiltinESMExports();
    const actual = await approvedDocuments(root, { db });
    assert.deepEqual(actual, expected);
    assert.ok(actual.some(row => row.route === '/world/'));
    assert.ok(actual.some(row => row.route === '/world/Glossary'));
  } finally {
    fsp.readFile = read; fsp.readdir = list; fsp.access = access;
    syncBuiltinESMExports(); db.close();
  }
});

test('an explicitly missing admission DB never falls back to lore discovery', async () => {
  const list = fsp.readdir;
  try {
    fsp.readdir = () => { throw new Error('unexpected filesystem fallback'); };
    syncBuiltinESMExports();
    await assert.rejects(approvedDocuments(new URL('../../lore', import.meta.url).pathname,
      { dbPath: '/missing-admission-authority.sqlite' }), { code: 'E_DB_OPEN' });
  } finally {
    fsp.readdir = list;
    syncBuiltinESMExports();
  }
});
