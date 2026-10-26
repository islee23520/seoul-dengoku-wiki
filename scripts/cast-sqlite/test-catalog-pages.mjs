import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { openReadOnly } from './db.mjs';
import { readCatalogPages, readCatalogGlossary } from './catalog-pages.mjs';
import { readSourceArchive } from './source-archive.mjs';

test('approved structural catalog successors require authenticated whole typed equality', {
  skip: !process.env.PUBLICATION_SUCCESSOR_DB || !process.env.PUBLICATION_NEW_BODY_ROOT,
}, () => {
  const db = openReadOnly(process.env.PUBLICATION_SUCCESSOR_DB);
  try {
    const pages = readCatalogPages(db);
    for (const slug of ['Cast-Relations', 'Offices-and-Ranks']) {
      assert.ok(pages.find(page => page.slug === slug)?.value.content.length);
    }
    const drift = { prepare(sql) {
      const statement = db.prepare(sql);
      if (sql.includes('SELECT * FROM text_document_slot WHERE')) return { all: (...args) =>
        statement.all(...args).map((row, i) => !i && row.source_id === 47 ? { ...row, text: 'unapproved' } : row) };
      return statement;
    } };
    assert.throws(() => readCatalogPages(drift), /E_REFERENCE_INTEGRITY|E_DOCUMENT_SCHEMA_GAP/u);
    const stale = { prepare(sql) {
      const statement = db.prepare(sql);
      if (sql.includes('JOIN document_revision_seal') && sql.includes('WHERE s.logical_path=?')) return {
        all: (...args) => statement.all(...args).map(row => ({ ...row, semantic_sha256: '0'.repeat(64) })) };
      return statement;
    } };
    assert.throws(() => readCatalogPages(stale), /E_REFERENCE_STALE/u);
    const previous = process.env.PUBLICATION_NEW_BODY_ROOT;
    try {
      process.env.PUBLICATION_NEW_BODY_ROOT = '/unapproved-structure';
      assert.throws(() => readCatalogPages(db), /ENOENT/u);
    } finally { process.env.PUBLICATION_NEW_BODY_ROOT = previous; }
  } finally { db.close(); }
});

test('actual generator pages reconstruct exactly from typed revisions, not source archives', {
  skip: !process.env.EVIDENCE_DOCUMENT_DB,
}, () => {
  const db = openReadOnly(process.env.EVIDENCE_DOCUMENT_DB);
  try {
    const guarded = { prepare(sql) {
      assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b/iu);
      return db.prepare(sql);
    } };
    const pages = readCatalogPages(guarded);
    const glossary = readCatalogGlossary(guarded);
    assert.deepEqual(glossary, JSON.parse(readSourceArchive('lore/glossary.json')));
    assert.ok(pages.length >= 60);
    assert.equal(new Set(pages.map(page => page.slug)).size, pages.length);
    for (const page of pages) {
      const source = JSON.parse(readSourceArchive(page.path));
      assert.deepEqual(page.value, source);
      assert.equal(JSON.stringify(page.value), JSON.stringify(source), 'historical receipt insertion order must survive typed reconstruction');
      assert.ok(!/^lore\/(?:name-pools|regions|editorial|sources)\//u.test(page.path));
    }
    const originalRead = fs.readFileSync;
    const originalParse = JSON.parse;
    let databaseOnly;
    try {
      fs.readFileSync = () => { throw new Error('E_SOURCE_FILE_READ'); };
      syncBuiltinESMExports();
      JSON.parse = () => { throw new Error('E_SOURCE_JSON_PARSE'); };
      databaseOnly = readCatalogPages(guarded);
      assert.deepEqual(readCatalogGlossary(guarded), glossary);
    } finally {
      fs.readFileSync = originalRead;
      syncBuiltinESMExports();
      JSON.parse = originalParse;
    }
    assert.deepEqual(databaseOnly, pages);
  } finally { db.close(); }
});

test('glossary build inputs reject missing route bindings and successor heads', {
  skip: !process.env.EVIDENCE_DOCUMENT_DB,
}, () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.prepare('ATTACH DATABASE ? AS authority').run(process.env.EVIDENCE_DOCUMENT_DB);
    for (const table of ['article_route', 'glossary_archive', 'glossary_head', 'glossary_revision',
      'glossary_revision_seal', 'glossary_term', 'glossary_locale', 'glossary_alias', 'glossary_context']) {
      db.exec(`CREATE TABLE ${table} AS SELECT * FROM authority.${table}`);
    }
    db.exec('DETACH DATABASE authority');
    assert.equal(readCatalogGlossary(db).length, 12);
    db.exec('BEGIN');
    db.exec("UPDATE article_route SET derivation_json=json_set(derivation_json,'$.sourceBindings[0].sha256','wrong') WHERE derivation='computed-glossary'");
    assert.throws(() => readCatalogGlossary(db), /E_GLOSSARY_DB_ADMISSION/u);
    db.exec('ROLLBACK; BEGIN');
    db.exec("UPDATE glossary_locale SET reader_definition='changed without review' WHERE rowid=(SELECT min(rowid) FROM glossary_locale)");
    assert.throws(() => readCatalogGlossary(db), /E_GLOSSARY_DB_ADMISSION/u);
    db.exec('ROLLBACK; BEGIN');
    db.exec("UPDATE glossary_revision SET parent_revision='previous' WHERE revision_id=(SELECT revision_id FROM glossary_head)");
    assert.throws(() => readCatalogGlossary(db), /E_GLOSSARY_DB_ADMISSION/u);
    db.exec('ROLLBACK');
    db.exec("DELETE FROM article_route WHERE derivation='computed-glossary'");
    assert.throws(() => readCatalogGlossary(db), /E_GLOSSARY_DB_ADMISSION/u);
  } finally { db.close(); }
});
