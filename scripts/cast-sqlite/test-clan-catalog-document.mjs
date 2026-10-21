import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { CLAN_CATALOG_SOURCE_HASH, CLAN_CATALOG_DOCUMENT_HASH, initializeClanCatalogDocument, readClanCatalogDocument } from './clan-catalog-document.mjs';
import { readSourceArchive } from './source-archive.mjs';

const sourceBytes = readSourceArchive('lore/name-pools/clan-hangnyeol-tables.json', CLAN_CATALOG_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./clan-catalog-document.sql', import.meta.url), 'utf8');
const canonicalSchemaSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const canonicalDbPath = new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url);
const source = JSON.parse(sourceBytes);
const expectedSourceHash = CLAN_CATALOG_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact clan-catalog normalization without approval' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  clan_catalog_document_document: 1,
  clan_catalog_document_source: 106,
  clan_catalog_document_source_key: 836,
  clan_catalog_document_clan: 303,
  clan_catalog_document_clan_key: 2727,
  clan_catalog_document_clan_source: 168,
  clan_catalog_document_row: 127,
  clan_catalog_document_row_key: 508,
  clan_catalog_document_branch: 0,
  clan_catalog_document_branch_key: 0,
};
const canonicalSchemaTables = [
  'build_metadata', 'source_file', 'source_record', 'state', 'state_label', 'person', 'person_alias',
  'value_axis', 'person_value', 'desire_axis', 'person_desire', 'person_gender', 'clan', 'clan_source',
  'clan_hangnyeol_row', 'person_lineage', 'person_lineage_source_clan', 'lineage_node', 'lineage_parent',
  'lineage_founder_sesu', 'lineage_clan_assignment', 'profile', 'profile_node', 'profile_field', 'relation_type',
  'relation', 'gurps_profile', 'gurps_attribute', 'gurps_secondary', 'gurps_trait', 'gurps_trait_application_boundary',
  'gurps_skill', 'gurps_language', 'gurps_advantage', 'gurps_disadvantage', 'gurps_territory', 'gurps_unit',
  'gurps_unit_composition', 'gurps_wandering_force', 'gurps_wandering_facility', 'evidence', 'source_check_run',
  'source_check_issue', 'quality_issue',
];
const rejected = fn => assert.throws(fn, { code: 'E_CLAN_CATALOG_DOCUMENT' });
const read = db => readClanCatalogDocument(db, { expectedSourceHash });
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeClanCatalogDocument(db, options);
  return db;
}
function tableNames(db) {
  return db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
}

test('actual entire source preserves ordered serialization, all 4776 typed rows and exact nulls', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 235765);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), CLAN_CATALOG_DOCUMENT_HASH);
    assert.deepEqual(initializeClanCatalogDocument(db, options), {
      documents: 1, sources: 106, clans: 303, clanSources: 168, rows: 127, branches: 0, totalRows: 4776,
    });
    assert.deepEqual(read(db), source);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_source WHERE record_id_present = 0').get().n, 6);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_source WHERE live_check_ref_present = 0').get().n, 6);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_clan WHERE bongwan_hanja IS NULL AND bongwan_hanja_present = 1').get().n, 6);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_clan WHERE bongwan_hanja_present = 0').get().n, 9);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_clan WHERE surname_hanja_present = 1').get().n, 3);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_clan WHERE branch_present = 0').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_clan WHERE sources_present = 0').get().n, 135);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_clan WHERE rows_present = 0').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_clan WHERE show_branches = 0').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_clan WHERE hangnyeol_present = 1 AND hangnyeol IS NULL').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_clan WHERE source_present = 1').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_clan WHERE branches_present = 1').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_row WHERE hanja IS NULL').get().n, 127);
    assert.equal(db.prepare('SELECT count(*) AS n FROM clan_catalog_document_branch').get().n, 0);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM clan_catalog_document_document').all();
    assert.throws(() => initializeClanCatalogDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM clan_catalog_document_document').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

for (const table of Object.keys(counts)) for (const mode of ['missing', 'changed', 'extra']) {
  test(`${table}: ${mode} row is rejected`, () => {
    const db = fresh();
    try {
      db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
      const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
      const authoredEmpty = table === 'clan_catalog_document_branch' || table === 'clan_catalog_document_branch_key';
      if (authoredEmpty && (mode === 'missing' || mode === 'changed') && db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n === 0) {
        const parent = db.prepare('SELECT ordinal FROM clan_catalog_document_clan WHERE branches_present = 1').get().ordinal;
        db.exec(`INSERT INTO clan_catalog_document_branch VALUES (${parent}, 1, 'object')`);
        db.exec(`INSERT INTO clan_catalog_document_branch_key VALUES (${parent}, 1, 0, 'authored')`);
      }
      if (mode === 'missing') {
        db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT max(rowid) FROM ${table})`);
      }
      if (mode === 'changed') {
        const column = columns.find(name => !['document_id', 'ordinal', 'source_ordinal', 'clan_ordinal', 'row_ordinal', 'branch_ordinal'].includes(name));
        const declared = db.prepare(`PRAGMA table_info(${table})`).all().find(row => row.name === column);
        const replacement = declared.type === 'INTEGER' ? '1000' : `${column} || '-changed'`;
        db.exec(`UPDATE ${table} SET ${column}=${replacement} WHERE rowid=(SELECT max(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const probe = columns.map(name => {
          if (['document_id', 'ordinal', 'source_ordinal', 'clan_ordinal', 'row_ordinal', 'branch_ordinal'].includes(name)) return '1000000';
          if (name.endsWith('_present') || name === 'schema' || name === 'sesu' || name === 'show_branches') return '0';
          if (name === 'id' || name === 'key' || name === 'source_id') return `'extra-' || ${db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n ? name : "''"}`;
          return `''`;
        });
        if (db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n === 0) {
          db.exec(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${probe.map(value => value.includes('||') ? `'extra'` : value).join(',')})`);
        } else {
          const values = columns.map(name => {
            if (['document_id', 'ordinal', 'source_ordinal', 'clan_ordinal', 'row_ordinal', 'branch_ordinal'].includes(name)) return '1000000';
            if (name === 'id' || name === 'key' || name === 'source_id') return `${name} || '-extra'`;
            return name;
          });
          db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
        }
      }
      rejected(() => read(db));
    } finally { db.close(); }
  });
}

test('wrong hash, unknown field, missing field and reordered keys are rejected before writes', () => {
  const rowClan = source.clans.findIndex(clan => (clan.rows ?? []).length > 0);
  const targets = [
    [],
    ['sources', 0],
    ['clans', 0],
    ['clans', rowClan, 'rows', 0],
  ];
  for (const path of targets) for (const mode of ['unknown', 'missing', 'order']) {
    const changed = structuredClone(source);
    const target = path.reduce((value, key) => value[key], changed);
    if (mode === 'unknown') target.unexpected = 'not authored';
    if (mode === 'missing') delete target[Object.keys(target)[0]];
    if (mode === 'order') {
      const key = Object.keys(target)[0];
      const value = target[key];
      delete target[key];
      target[key] = value;
    }
    const db = new DatabaseSync(':memory:');
    try {
      rejected(() => initializeClanCatalogDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
    } finally { db.close(); }
  }
  for (const mutate of [
    document => { document.note += 'changed'; },
    document => { document.clans[rowClan].rows[0].sesu = String(document.clans[rowClan].rows[0].sesu); },
    document => { document.clans[rowClan].rows.push({ sesu: 99, hangnyeol: '가', hanja: null, position: 'first' }); },
    document => { document.sources.push({ ...document.sources[0], id: 'added-source' }); },
    document => { document.clans[rowClan].rows[0].hanja = '加'; },
    document => { document.clans.find(clan => typeof clan.show_branches === 'boolean').show_branches = 0; },
    document => { document.clans.find(clan => Object.hasOwn(clan, 'branches')).branches.push({ unexpected: true }); },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeClanCatalogDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readClanCatalogDocument(db));
    rejected(() => readClanCatalogDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    for (const overrides of [
      { expectedSourceHash: '0'.repeat(64) },
      { sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) },
      { actor: '' },
      { reason: ' ' },
      { schemaSql: '' },
      { sourceBytes: 'not bytes' },
    ]) rejected(() => initializeClanCatalogDocument(db, { ...options, ...overrides }));
    db.exec('BEGIN');
    rejected(() => initializeClanCatalogDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back all schema and rows', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_clan_catalog BEFORE INSERT ON clan_catalog_document_row BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_clan_catalog AFTER INSERT ON clan_catalog_document_row BEGIN UPDATE clan_catalog_document_document SET note='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeClanCatalogDocument(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(row => row.name), ['unrelated']);
      assert.equal(db.prepare('SELECT value FROM unrelated').get().value, 'retained');
    } finally { db.close(); }
  }
});

test('runtime is SELECT-only with filesystem, archive, fetch and JSON.parse access blocked', () => {
  const db = fresh();
  const restores = [];
  const blocked = () => { throw new Error('runtime source access forbidden'); };
  const replace = (object, key) => {
    const original = object[key];
    object[key] = blocked;
    restores.push(() => { object[key] = original; });
  };
  try {
    db.exec('PRAGMA query_only=ON');
    for (const key of ['readFileSync', 'readSync', 'openSync', 'createReadStream', 'readFile', 'open']) replace(fs, key);
    for (const key of ['readFile', 'open']) replace(fsp, key);
    replace(JSON, 'parse');
    replace(globalThis, 'fetch');
    const guarded = {
      prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /archive|source_file|json_/i);
        return db.prepare(sql);
      },
      exec: blocked,
    };
    assert.equal(JSON.stringify(read(guarded)), JSON.stringify(source));
  } finally {
    restores.reverse().forEach(restore => restore());
    db.close();
  }
});

test('canonical schema inventory and read-only database backup coexist with the catalog tables', () => {
  const schemaDb = new DatabaseSync(':memory:');
  const backup = new DatabaseSync(':memory:');
  const live = new DatabaseSync(canonicalDbPath, { readOnly: true });
  try {
    schemaDb.exec(canonicalSchemaSql);
    schemaDb.exec("INSERT INTO build_metadata VALUES ('canonical-sentinel', 'untouched')");
    schemaDb.exec("INSERT INTO clan (clan_id, surname, bongwan) VALUES ('canonical-clan', '신', '고령')");
    const schemaBefore = tableNames(schemaDb);
    assert.deepEqual(schemaBefore, [...canonicalSchemaTables].sort());
    assert.equal(schemaBefore.some(name => name.startsWith('clan_catalog_document_')), false);
    const clanBefore = schemaDb.prepare('SELECT * FROM clan ORDER BY clan_id').all();
    const metadataBefore = schemaDb.prepare('SELECT * FROM build_metadata ORDER BY key').all();
    initializeClanCatalogDocument(schemaDb, options);
    assert.deepEqual(schemaDb.prepare('SELECT * FROM clan ORDER BY clan_id').all(), clanBefore);
    assert.deepEqual(schemaDb.prepare('SELECT * FROM build_metadata ORDER BY key').all(), metadataBefore);
    assert.deepEqual(tableNames(schemaDb).filter(name => !name.startsWith('clan_catalog_document_')), schemaBefore);
    assert.deepEqual(tableNames(schemaDb).filter(name => name.startsWith('clan_catalog_document_')).sort(), Object.keys(counts).sort());
    assert.equal(JSON.stringify(read(schemaDb)), JSON.stringify(source));

    const liveNames = tableNames(live);
    assert.equal(liveNames.length, 311);
    assert.equal(liveNames.includes('clan'), true);
    assert.equal(liveNames.includes('clan_hangnyeol_row'), true);
    assert.equal(liveNames.some(name => name.startsWith('clan_catalog_document_')), false);
    const quoted = liveNames.map(name => `'${name.replaceAll("'", "''")}'`).join(',');
    backup.exec(`CREATE TABLE canonical_table_inventory (name TEXT PRIMARY KEY); INSERT INTO canonical_table_inventory (name) VALUES ${liveNames.map(name => `('${name.replaceAll("'", "''")}')`).join(',')}`);
    assert.equal(quoted.length > 0, true);
    const inventoryBefore = backup.prepare('SELECT name FROM canonical_table_inventory ORDER BY name').all().map(row => row.name);
    assert.deepEqual(inventoryBefore, liveNames);
    initializeClanCatalogDocument(backup, options);
    assert.deepEqual(backup.prepare('SELECT name FROM canonical_table_inventory ORDER BY name').all().map(row => row.name), inventoryBefore);
    assert.equal(backup.prepare('SELECT count(*) AS n FROM canonical_table_inventory').get().n, 311);
    assert.deepEqual(tableNames(backup).filter(name => name.startsWith('clan_catalog_document_')).sort(), Object.keys(counts).sort());
    assert.equal(JSON.stringify(read(backup)), JSON.stringify(source));
    assert.equal(schemaDb.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.equal(backup.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(schemaDb.prepare('PRAGMA foreign_key_check').all(), []);
    assert.deepEqual(backup.prepare('PRAGMA foreign_key_check').all(), []);
    assert.deepEqual(tableNames(live), liveNames);
  } finally {
    schemaDb.close();
    backup.close();
    live.close();
  }
});
