import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { publicCharacterProfile } from '../character-profile.mjs';
import { openDocumentStore } from './store.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { initializeEditorialProfiles, openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES } from './editorial-profile.mjs';
import { readEditorialProfileInputs } from '../cast-sqlite/person-detail-inputs.mjs';
import { loadCharacterProfiles } from '../validate-character-profiles.mjs';
import { fileURLToPath } from 'node:url';
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } from './soul-assignment.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const repo = new URL('../../', import.meta.url);
const options = { capability:INTERNAL_PROFILE_CAPABILITY, expectedSourceHashes:EDITORIAL_PROFILE_SOURCE_HASHES };
const profileDatabase = process.env.WIKI_EDITORIAL_PROFILE_DB
  ?? fileURLToPath(new URL('.omo/private/seoul-migration/sqlite-authority-20261021/editorial-profiles.sqlite',repo));
const currentProfiles = openEditorialProfiles(profileDatabase,options);
let originals, batches;
try {
  originals = currentProfiles.readBatches();
  // Import fixtures retain sealed bytes; current expectations use typed rows only.
  const archive = new DatabaseSync(profileDatabase,{readOnly:true});
  try {
    batches = Object.keys(EDITORIAL_PROFILE_SOURCE_HASHES).map(logicalPath => ({ logicalPath,
      bytes:Buffer.from(archive.prepare('SELECT raw_bytes FROM editorial_archive WHERE logical_path=?').get(logicalPath).raw_bytes) }));
  } finally { archive.close(); }
} finally { currentProfiles.close(); }
const currentSouls = openSoulAssignments(process.env.WIKI_SOUL_ASSIGNMENT_DB
  ?? fileURLToPath(new URL('.omo/private/seoul-migration/sqlite-authority-20261021/soul-assignments.sqlite',repo)), {
  capability:INTERNAL_SOUL_CAPABILITY, expectedSha256:SOUL_ASSIGNMENT_SOURCE_SHA256,
});
let assignments;
try { assignments = currentSouls.readDocument(); } finally { currentSouls.close(); }
const init = { ...options, batches, actor:'profile-snapshot-test', reason:'explicit bounded nine-batch import' };
function fixture(t) {
  const dir=fs.mkdtempSync(join(tmpdir(),'editorial-profiles-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  return join(dir,'private.sqlite');
}

test('all nine actual batches and 1022 complete profiles round-trip from typed SQLite without JSON or source files',async t=>{
  const path=fixture(t);
  initializeEditorialProfiles(path,init);
  assert.equal(fs.statSync(path).mode&0o777,0o600);
  const store=openEditorialProfiles(path,options);
  assert.deepEqual(store.readBatches(),originals);
  store.close();
  const readFile=fs.readFileSync, readdir=fs.readdirSync, parse=JSON.parse;
  let reopened;
  try {
    fs.readFileSync=()=>{throw new Error('filesystem reader disabled');};
    fs.readdirSync=()=>{throw new Error('directory scanner disabled');};
    syncBuiltinESMExports();
    JSON.parse=()=>{throw new Error('JSON parse disabled');};
    reopened=openEditorialProfiles(path,options);
    assert.deepEqual(reopened.readBatches(),originals);
    assert.equal(JSON.stringify(reopened.readBatches()),JSON.stringify(originals));
  } finally {
    reopened?.close();fs.readFileSync=readFile;fs.readdirSync=readdir;syncBuiltinESMExports();JSON.parse=parse;
  }
  const db=new DatabaseSync(path);
  assert.equal(db.prepare('PRAGMA application_id').get().application_id,0x57455046);
  assert.equal(db.prepare('SELECT actor FROM editorial_import').get().actor,init.actor);
  assert.equal(db.prepare('SELECT reason FROM editorial_import').get().reason,init.reason);
  for(const input of batches) {
    const archive=db.prepare('SELECT raw_bytes,sha256 FROM editorial_archive WHERE logical_path=?').get(input.logicalPath);
    assert.deepEqual(Buffer.from(archive.raw_bytes),input.bytes);
    assert.equal(archive.sha256,sha(input.bytes));
  }
  assert.throws(()=>db.exec('UPDATE editorial_archive SET raw_bytes=x\'00\''),/immutable profile evidence/);
  assert.throws(()=>db.exec('DELETE FROM editorial_archive'),/immutable profile evidence/);
  // Removing every evidence byte does not become a fallback to JSON: typed rows remain authoritative.
  db.exec('DROP TRIGGER editorial_archive_no_delete; DELETE FROM editorial_archive');
  db.close();
  const typed=openEditorialProfiles(path,options);
  assert.deepEqual(typed.readBatches(),originals);typed.close();
  assert.deepEqual(await readEditorialProfileInputs(path),new Map(originals.flatMap(({batch})=>batch.profiles.map(profile=>[profile.personId,profile]))));
  const souls=new Map(assignments.assignments.map(a=>[a.personId,a.souls]));
  for(const {batch} of originals) for(const profile of batch.profiles) {
    assert.deepEqual(profile.souls,souls.get(profile.personId));
    const projected=publicCharacterProfile(profile);
    assert.deepEqual(Object.keys(projected),['abilities','skills','traits','narrative','health']);
    assert.ok(!JSON.stringify(projected).includes('"basis"'));
    assert.ok(!JSON.stringify(projected).includes('"souls"'));
    assert.ok(!JSON.stringify(projected).includes('"interpretation"'));
  }
  assert.throws(()=>openDocumentStore(path),{code:'E_SCHEMA'});
  assert.throws(()=>openEvidenceStore(path,{capability:INTERNAL_EVIDENCE_CAPABILITY}),{code:'E_SCHEMA'});
});

test('existing profile loader uses restricted DB without opening or listing profile batches',async t=>{
  const path=fixture(t);
  initializeEditorialProfiles(path,init);
  const previous=process.env.WIKI_EDITORIAL_PROFILE_DB;
  const originalRead=fsp.readFile,originalList=fsp.readdir;
  try {
    process.env.WIKI_EDITORIAL_PROFILE_DB=path;
    fsp.readFile=async (file,...args)=>{
      assert.ok(!String(file).includes('profile-batches'), 'profile JSON read is forbidden');
      return originalRead(file,...args);
    };
    fsp.readdir=async (file,...args)=>{
      assert.ok(!String(file).includes('profile-batches'), 'profile directory listing is forbidden');
      return originalList(file,...args);
    };
    syncBuiltinESMExports();
    const profiles=await loadCharacterProfiles(fileURLToPath(repo));
    assert.deepEqual(profiles,new Map(originals.flatMap(({batch})=>batch.profiles.map(profile=>[profile.personId,profile]))));
  } finally {
    if(previous===undefined)delete process.env.WIKI_EDITORIAL_PROFILE_DB;else process.env.WIKI_EDITORIAL_PROFILE_DB=previous;
    fsp.readFile=originalRead;fsp.readdir=originalList;syncBuiltinESMExports();
  }
});

test('explicit pins, private capabilities, unknown fields and atomic rollback fail closed',t=>{
  const path=fixture(t);
  assert.throws(()=>initializeEditorialProfiles(path,{...init,actor:''}),{code:'E_PROFILE_AUDIT'});
  assert.throws(()=>initializeEditorialProfiles(path,{...init,scope:'public'}),{code:'E_PRIVATE'});
  assert.throws(()=>initializeEditorialProfiles(path,{...init,capability:undefined}),{code:'E_PRIVATE'});
  const stale={...EDITORIAL_PROFILE_SOURCE_HASHES,[batches[8].logicalPath]:'0'.repeat(64)};
  assert.throws(()=>initializeEditorialProfiles(path,{...init,expectedSourceHashes:stale}),{code:'E_PROFILE_PINS'});
  assert.equal(fs.existsSync(path),false);
  for(const mutate of [b=>{b.unknown='reject';},b=>{b.profiles[0].unknown='reject';},b=>{b.profiles[0].souls[0].unknown='reject';},b=>{b.profiles[0].traits[0].name.unknown='reject';}]) {
    const changed=structuredClone(originals[8].batch);mutate(changed);
    const bytes=Buffer.from(JSON.stringify(changed));
    const inputs=batches.map((b,i)=>i===8?{...b,bytes}:b);
    const pins={...EDITORIAL_PROFILE_SOURCE_HASHES,[batches[8].logicalPath]:sha(bytes)};
    assert.throws(()=>initializeEditorialProfiles(path,{...init,batches:inputs,expectedSourceHashes:pins}),{code:'E_PROFILE_UNKNOWN_FIELD'});
    assert.equal(fs.existsSync(path),false);
  }
  initializeEditorialProfiles(path,init);
  assert.throws(()=>initializeEditorialProfiles(path,init),{code:'EEXIST'});
  assert.throws(()=>openEditorialProfiles(path,{...options,expectedSourceHashes:stale}),{code:'E_PROFILE_PINS'});
  assert.throws(()=>openEditorialProfiles(path,{...options,scope:'public'}),{code:'E_PRIVATE'});
  fs.chmodSync(path,0o644);
  assert.throws(()=>openEditorialProfiles(path,options),{code:'E_PRIVATE_MODE'});
  fs.chmodSync(path,0o600);
  const db=new DatabaseSync(path);
  db.exec("DELETE FROM editorial_soul WHERE row_key=(SELECT row_key FROM editorial_soul ORDER BY row_key DESC LIMIT 1)");db.close();
  const reader=openEditorialProfiles(path,options);
  assert.throws(()=>reader.readBatches(),{code:'E_PROFILE_INTEGRITY'});reader.close();
});
