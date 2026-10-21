import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSourceArchive } from './source-archive.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const serialize = versions => JSON.stringify(versions.map(v => ({...v, people:[...v.people]})));
if (process.argv[2] === '--reader-denied') {
  const db = new DatabaseSync(process.argv[3], {readOnly:true});
  const readerModule = 'data:text/javascript;base64,' + fs.readFileSync(new URL('./preserved-sheet-inputs.mjs',import.meta.url)).toString('base64');
  const denied = () => { throw new Error('filesystem/JSON.parse denied'); };
  for (const key of ['readFileSync','readSync','openSync','existsSync','statSync','readdirSync','readFile','open','accessSync']) fs[key] = denied;
  syncBuiltinESMExports();
  JSON.parse = denied;
  const {loadPreservedSheetInputs} = await import(readerModule);
  const result = loadPreservedSheetInputs({prepare(sql) { assert.match(sql,/^SELECT /); return db.prepare(sql); }});
  assert.equal(hash(serialize(result)),process.argv[4]);
  assert.deepEqual(result.map(v => v.people.size),[1022,1022]);
  db.close();
  console.log('PASS fresh reader: FS and JSON.parse denied; SELECT-only full parity');
} else {
  const {initializePreservedSheetInputs,loadPreservedSheetInputs} = await import('./preserved-sheet-inputs.mjs');
  const {loadPersonDetailSources} = await import('./person-detail-inputs.mjs');
  const {loadPreservedPersonSheets} = await import('../preserved-person-sheet.mjs');
  const authority = '/tmp/seoul-document-authority-20261020/bootstrap-feudal-inputs-20261020.sqlite';
  const originalHash = hash(fs.readFileSync(authority));
  const baselineBytes = readSourceArchive('scripts/issued-preservation-baseline.json', 'cb2339a544090a471a876642abe2b09166bd3195860db33f672b6a2443b73623');
  const baseline = JSON.parse(baselineBytes);
  const documents = Object.keys(baseline.revisions).map(revision => ({revision,bytes:fs.readFileSync(new URL('../../vendor/issued-history/' + revision + '.json',import.meta.url))}));
  const archiveHashes = documents.map(d => hash(d.bytes));
  const sourceBytes = new Map(Object.keys(baseline.sourceHashes).map(path => [path,fs.readFileSync(new URL('../../vendor/issued-history/corpus/' + path,import.meta.url))]));
  const schemaSql = fs.readFileSync(new URL('./preserved-sheet-inputs.sql',import.meta.url),'utf8');
  const options = {schemaSql,documents,baselineBytes,sourceBytes,actor:'preserved-sheet-inputs test',reason:'full historical private parity'};
  const directory = fs.mkdtempSync(join(tmpdir(),'preserved-sheet-inputs-'));
  const dbPath = join(directory,'copy.sqlite');
  fs.copyFileSync(authority,dbPath);
  const db = new DatabaseSync(dbPath);
  try {
    for (const invalid of [
      {...options,actor:''}, {...options,reason:''},
      {...options,baselineBytes:Buffer.concat([baselineBytes,Buffer.from(' ')])},
      {...options,documents:[documents[0]]},
      {...options,documents:documents.map((d,i) => i ? d : {...d,bytes:Buffer.concat([d.bytes,Buffer.from(' ')])})},
      {...options,documents:documents.map((d,i) => ({...d,bytes:documents[1-i].bytes}))},
      {...options,sourceBytes:new Map([...sourceBytes].map(([p,b],i) => [p,i ? b : Buffer.from('wrong')]))},
    ]) {
      assert.throws(() => initializePreservedSheetInputs(db,invalid),/E_PRESERVED_SHEET/);
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'preserved_sheet_%'").get().n,0);
    }
    const brokenSql = schemaSql + "CREATE TRIGGER reject_preserved_skill BEFORE INSERT ON preserved_sheet_skill BEGIN SELECT RAISE(ABORT,'forced import rollback'); END;";
    assert.throws(() => initializePreservedSheetInputs(db,{...options,schemaSql:brokenSql}),/forced import rollback/);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'preserved_sheet_%'").get().n,0);
    const paritySql = schemaSql + "CREATE TRIGGER corrupt_preserved_cp AFTER INSERT ON preserved_sheet_cp BEGIN UPDATE preserved_sheet_cp SET total=total+1 WHERE revision=NEW.revision AND person_id=NEW.person_id; END;";
    assert.throws(() => initializePreservedSheetInputs(db,{...options,schemaSql:paritySql}),/full record or numeric seal mismatch/);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'preserved_sheet_%'").get().n,0);
    const legacy = loadPreservedPersonSheets();
    const imported = initializePreservedSheetInputs(db,options);
    assert.deepEqual(imported,legacy);
    assert.deepEqual(await loadPersonDetailSources({ db, inputSubset: 'preserved-sheets' }), { preservedSheets: legacy });
    assert.equal(serialize(imported),serialize(legacy));
    assert.deepEqual(imported.map(v => v.people.size),[1022,1022]);
    assert.deepEqual(loadPreservedSheetInputs(db),legacy);
    assert.equal(db.prepare('SELECT count(*) AS n FROM preserved_sheet_source').get().n,sourceBytes.size);
    assert.throws(() => initializePreservedSheetInputs(db,options),/already exists/);
    assert.equal(serialize(loadPreservedSheetInputs(db)),serialize(legacy));
    console.log('PASS full legacy Map deepEqual and serialized equality: 2 revisions x 1022 records');
    // Deliberately emulate externally corrupted artifacts, including broken FKs.
    db.exec('PRAGMA foreign_keys=OFF');
    const corruptions = [
      "DELETE FROM preserved_sheet_skill_evidence WHERE (revision,person_id,slot) IN (SELECT revision,person_id,slot FROM preserved_sheet_skill_evidence ORDER BY revision,person_id,slot DESC LIMIT 1)",
      "DELETE FROM preserved_sheet_person WHERE person_id='K1022'",
      "DELETE FROM preserved_sheet_revision WHERE ordinal=1",
      "UPDATE preserved_sheet_attribute SET value=value+1 WHERE person_id='K001' AND slot='/attributes/ST'",
      "UPDATE preserved_sheet_skill_evidence SET quote='mutated' WHERE person_id='K1022'",
      "UPDATE preserved_sheet_unit SET size=size+1 WHERE size IS NOT NULL",
      "UPDATE preserved_sheet_source SET sha256='wrong' WHERE source_path='WORLD_BUILDING_GUIDE.md'",
      "UPDATE preserved_sheet_revision SET ledger_sha256='wrong' WHERE ordinal=0",
      "UPDATE preserved_sheet_revision SET resolution='mutated' WHERE ordinal=0",
      "UPDATE preserved_sheet_person SET key_order='id' WHERE person_id='K1022'",
    ];
    for (const sql of corruptions) {
      db.exec('SAVEPOINT mutation');
      try { db.exec(sql); assert.throws(() => loadPreservedSheetInputs(db),/E_PRESERVED_SHEET/); }
      finally { db.exec('ROLLBACK TO mutation; RELEASE mutation'); }
    }
    console.log('PASS missing terminal rows, denominators, private mutations, provenance and rule pins reject');
    const expectedHash = hash(serialize(legacy));
    db.close();
    await new Promise((resolve,reject) => {
      const child = spawn(process.execPath,[fileURLToPath(import.meta.url),'--reader-denied',dbPath,expectedHash],{stdio:'inherit'});
      child.once('error',reject); child.once('exit',code => code === 0 ? resolve() : reject(new Error('denied reader exit ' + code)));
    });
    assert.equal(hash(fs.readFileSync(authority)),originalHash);
    for (const [i,d] of documents.entries()) assert.equal(hash(fs.readFileSync(new URL('../../vendor/issued-history/' + d.revision + '.json',import.meta.url))),archiveHashes[i]);
    console.log('PASS wrong bytes/pins, actor/reason, transactional rollback; original authority and source archives unchanged');
  } finally {
    if (db.isOpen) db.close();
    fs.rmSync(directory,{recursive:true,force:true});
  }
}
