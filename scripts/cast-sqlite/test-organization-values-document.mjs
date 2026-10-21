import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { ORGANIZATION_VALUES_SOURCE_HASH, initializeOrganizationValuesDocument, readOrganizationValuesDocument } from './organization-values-document.mjs';
import { openReadOnly } from './db.mjs';

const sourceBytes = (() => {
  const db = openReadOnly(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname);
  try { return Buffer.from(db.prepare('SELECT raw_bytes FROM source_file WHERE logical_path=?').get('lore/name-pools/values-orgs.json').raw_bytes); }
  finally { db.close(); }
})();
const schemaSql = readFileSync(new URL('./organization-values-document.sql',import.meta.url),'utf8');
const original = JSON.parse(sourceBytes);
const options = { schemaSql, sourceBytes, expectedSourceHash:ORGANIZATION_VALUES_SOURCE_HASH, actor:'test', reason:'bounded original proposal migration; no publication approval' };
const expectedCounts = { documents:1, axes:10, policies:9, organizations:37, states:118, values:370, policyValues:333 };
const tables = [
  ['organization_values_document',1,"source_sha256='"+'0'.repeat(64)+"'"],
  ['organization_values_axis',10,"name=name || 'changed'"],
  ['organization_values_policy_axis',9,"name=name || 'changed'"],
  ['organization_values_org',37,"name=name || 'changed'"],
  ['organization_values_state',118,"state=state || 'changed'"],
  ['organization_values_score',37,'authority=authority+1'],
  ['organization_values_policy',37,"war=war || 'changed'"],
];
const read = db => readOrganizationValuesDocument(db,{expectedSourceHash:ORGANIZATION_VALUES_SOURCE_HASH});
const hash = value => createHash('sha256').update(value).digest('hex');

test('original whole-document parity, fixed hashes, denominators and SELECT-only runtime', () => {
  const db = new DatabaseSync(':memory:',{enableForeignKeyConstraints:true});
  const parse = JSON.parse;
  try {
    assert.equal(hash(sourceBytes),ORGANIZATION_VALUES_SOURCE_HASH);
    assert.equal(hash(JSON.stringify(original)),'dfd077f83cbf73bc0e9c7ae9bfbdefaaef2f0e1711bb8ef100bca7daf7aebaa4');
    assert.deepEqual(initializeOrganizationValuesDocument(db,options),expectedCounts);
    for (const [table,n] of tables) assert.equal(db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n,n,table);
    const onlySelect = { prepare(sql) { assert.match(sql,/^SELECT /); return db.prepare(sql); } };
    db.exec('PRAGMA query_only=ON');
    JSON.parse = () => { throw Error('runtime JSON.parse forbidden'); };
    const actual = read(onlySelect);
    assert.deepEqual(actual,original);
    assert.equal(JSON.stringify(actual),JSON.stringify(original));
    assert.equal(actual.orgs.filter(o => Object.hasOwn(o,'class')).length,32);
    assert.equal(actual.orgs.filter(o => !Object.hasOwn(o,'class')).length,5);
    assert.deepEqual(db.prepare('PRAGMA integrity_check').all().map(r => r.integrity_check),['ok']);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  } finally { JSON.parse=parse; db.close(); }
});

test('all 249 rows reject deletion and changed content across all seven tables', () => {
  // Disable FK enforcement only for deliberate corruptions, so parent deletions reach the reader.
  const db = new DatabaseSync(':memory:',{enableForeignKeyConstraints:false});
  let missing=0, changed=0;
  try {
    initializeOrganizationValuesDocument(db,options);
    for (const [table,n,assignment] of tables) {
      const rows=db.prepare(`SELECT rowid AS rid FROM ${table}`).all();
      assert.equal(rows.length,n);
      for (const {rid} of rows) {
        for (const [sql,kind] of [[`DELETE FROM ${table} WHERE rowid=?`,'missing'],[`UPDATE ${table} SET ${assignment} WHERE rowid=?`,'changed']]) {
          db.exec('BEGIN');
          try {
            db.prepare(sql).run(rid);
            assert.throws(() => read(db),/E_ORGANIZATION_VALUES_DOCUMENT/,`${kind}: ${table} row ${rid}`);
            if (kind === 'missing') missing++; else changed++;
          } finally { db.exec('ROLLBACK'); }
        }
      }
    }
    assert.deepEqual({missing,changed},{missing:249,changed:249});
    assert.equal(JSON.stringify(read(db)),JSON.stringify(original));
  } finally { db.close(); }
});

test('extra orphan rows cannot hide outside the document hash', () => {
  const db = new DatabaseSync(':memory:',{enableForeignKeyConstraints:false});
  try {
    initializeOrganizationValuesDocument(db,options);
    for (const table of ['organization_values_state','organization_values_score','organization_values_policy']) {
      const row=db.prepare(`SELECT * FROM ${table} LIMIT 1`).get();
      row.org_id='unknown';
      db.exec('BEGIN');
      try {
        db.prepare(`INSERT INTO ${table} VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
        assert.throws(() => read(db),/E_ORGANIZATION_VALUES_DOCUMENT/);
      } finally { db.exec('ROLLBACK'); }
    }
  } finally { db.close(); }
});

test('unknown fields reject explicitly at every object level before source-hash adoption', () => {
  const mutations = [d => { d.unknown=true; },d => { d.orgs[0].unknown=true; },
    d => { d.orgs[0].values.unknown=1; },d => { d.orgs[0].policy.unknown='x'; }];
  for (const mutate of mutations) {
    const db = new DatabaseSync(':memory:');
    try {
      const doc=structuredClone(original); mutate(doc);
      assert.throws(() => initializeOrganizationValuesDocument(db,{...options,sourceBytes:Buffer.from(JSON.stringify(doc))}),/fields or key order/);
      assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n,0);
    } finally { db.close(); }
  }
});

test('wrong hashes, changed source bytes, changed key order and optional/null variants are not adopted', () => {
  const variants = [
    {...options,expectedSourceHash:'0'.repeat(64)},
    {...options,sourceBytes:Buffer.concat([sourceBytes,Buffer.from('\n')])},
    ...[
      d => { d.orgs[0].class=null; },
      d => { delete d.orgs[0].class; },
      d => { d.orgs.at(-1).class=null; },
      d => { d.orgs[0].states.reverse(); },
      d => { d.orgs[0].values=Object.fromEntries(Object.entries(d.orgs[0].values).reverse()); },
      d => { d.axes.reverse(); },
      d => { d.policies.reverse(); },
    ].map(mutate => { const d=structuredClone(original); mutate(d); return {...options,sourceBytes:Buffer.from(JSON.stringify(d))}; }),
  ];
  const db=new DatabaseSync(':memory:');
  try {
    for (const variant of variants) assert.throws(() => initializeOrganizationValuesDocument(db,variant),/E_ORGANIZATION_VALUES_DOCUMENT/);
    assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n,0);
    initializeOrganizationValuesDocument(db,options);
    assert.throws(() => readOrganizationValuesDocument(db,{expectedSourceHash:'0'.repeat(64)}),/E_ORGANIZATION_VALUES_DOCUMENT/);
    assert.throws(() => readOrganizationValuesDocument(db),/E_ORGANIZATION_VALUES_DOCUMENT/);
  } finally { db.close(); }
});

test('relational constraints, initialization preconditions and failed transaction rollback', () => {
  const db=new DatabaseSync(':memory:',{enableForeignKeyConstraints:true});
  try {
    for (const changes of [{actor:''},{reason:' '},{sourceBytes:'not bytes'},{schemaSql:''}]) {
      assert.throws(() => initializeOrganizationValuesDocument(db,{...options,...changes}),/E_ORGANIZATION_VALUES_DOCUMENT/);
    }
    assert.throws(() => initializeOrganizationValuesDocument(db,{...options,schemaSql:schemaSql+'; SELECT missing_column FROM organization_values_document;'}));
    assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n,0);
    db.exec('BEGIN');
    assert.throws(() => initializeOrganizationValuesDocument(db,options),/E_ORGANIZATION_VALUES_DOCUMENT/);
    db.exec('ROLLBACK');
    initializeOrganizationValuesDocument(db,options);
    assert.throws(() => db.exec("INSERT INTO organization_values_state VALUES ('unknown',0,'S01')"),/FOREIGN KEY/);
    assert.throws(() => db.exec("UPDATE organization_values_score SET authority='not numeric'"),/INTEGER/);
    assert.throws(() => db.exec('UPDATE organization_values_org SET class_present=0 WHERE class IS NOT NULL'),/CHECK/);
    assert.throws(() => initializeOrganizationValuesDocument(db,options),/already exists/);
    assert.equal(JSON.stringify(read(db)),JSON.stringify(original));
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  } finally { db.close(); }
});
