import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildWorldIndex } from '../build-world-index.mjs';
import { loadApprovedOrganizationAliases } from '../approved-organization-aliases.mjs';
import { openReadOnly } from './db.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const dbPath = process.env.EVIDENCE_DOCUMENT_DB
  ?? '/tmp/seoul-document-authority-20261020/bootstrap-issued-sheets-20261020.sqlite';

test('world index has exact filesystem parity from the integrated DB with source reads blocked', async () => {
  const organizationAliases = await loadApprovedOrganizationAliases(root);
  const previousDbPath = process.env.WIKI_DOCUMENT_DB;
  const originalRead = fs.readFileSync;
  const originalParse = JSON.parse;
  const db = openReadOnly(dbPath);
  try {
    delete process.env.WIKI_DOCUMENT_DB;
    const expected = buildWorldIndex({ loreRoot: `${root}/lore`, organizationAliases });
    assert.equal(db.prepare('SELECT count(*) AS count FROM person').get().count, 1022);
    assert.equal(db.prepare('SELECT count(*) AS count FROM text_document').get().count, 99);
    const queries = [];
    const guarded = { prepare(sql) {
      assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b/iu);
      queries.push(sql);
      return db.prepare(sql);
    } };
    fs.readFileSync = () => { throw new Error('E_SOURCE_FILE_READ'); };
    syncBuiltinESMExports();
    JSON.parse = () => { throw new Error('E_SOURCE_JSON_PARSE'); };
    const options = { loreRoot: '/missing-lore', organizationAliases };
    assert.equal(buildWorldIndex({ ...options, db: guarded, dbPath: '/missing.sqlite' }), expected);
    assert.equal(db.isOpen, true, 'caller-owned DB remains open');
    assert.ok(queries.some(sql => sql.includes('document_key_order')));
    assert.equal(buildWorldIndex({ ...options, dbPath }), expected);
    process.env.WIKI_DOCUMENT_DB = dbPath;
    assert.equal(buildWorldIndex(options), expected, 'existing root caller selects DB through the environment');
    assert.match(expected, /\| \[중앙정보부\]\(Sixteen-States\.html\) \| [^|]+ \| [^|]+ \| 오해린 \|/u);

    for (const slug of ['Core-Characters', 'Sixteen-States', 'Scenario-Timeline']) {
      const missing = { prepare(sql) {
        const statement = guarded.prepare(sql);
        if (!sql.includes('FROM text_document d JOIN source_file s')) return statement;
        return { all(...bindings) {
          return statement.all(...bindings).filter(row => !row.logical_path.endsWith(`/${slug}.json`));
        } };
      } };
      assert.throws(() => buildWorldIndex({ ...options, db: missing }), new RegExp(`E_WORLD_INDEX_SOURCE:${slug}`, 'u'));
    }
    const missingOrder = { prepare(sql) {
      if (sql.includes('FROM document_key_order')) return { all: () => [] };
      return guarded.prepare(sql);
    } };
    assert.throws(() => buildWorldIndex({ ...options, db: missingOrder }), /E_DOCUMENT_KEY_ORDER/u);
    const unsupported = { prepare(sql) {
      if (sql.includes('FROM text_document_node')) return { all: () => [{ kind: 'unsupported', json_pointer: '/content/0' }] };
      return guarded.prepare(sql);
    } };
    assert.throws(() => buildWorldIndex({ ...options, db: unsupported }), /E_DOCUMENT_SCHEMA_GAP/u);
    assert.throws(() => buildWorldIndex({ ...options, dbPath: '/missing-world-index.sqlite' }), { code: 'E_DB_OPEN' });
  } finally {
    fs.readFileSync = originalRead;
    syncBuiltinESMExports();
    JSON.parse = originalParse;
    if (previousDbPath === undefined) delete process.env.WIKI_DOCUMENT_DB;
    else process.env.WIKI_DOCUMENT_DB = previousDbPath;
    db.close();
  }
});
