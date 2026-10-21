import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { profileRosterFailures } from '../character-profile.mjs';
import { validateSoulAssignments } from '../validate-soul-assignments.mjs';
import { openDocumentStore } from './store.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { initializeSoulAssignments, initializeSoulAssignmentEdits, replaceSoulAssignment, openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } from './soul-assignment.mjs';
import { openReadOnly } from '../cast-sqlite/db.mjs';
import { readAtlasIdentity } from '../cast-sqlite/atlas-identity.mjs';

const repo = new URL('../../',import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const options = {capability:INTERNAL_SOUL_CAPABILITY,expectedSha256:SOUL_ASSIGNMENT_SOURCE_SHA256};
const soulDatabase = process.env.WIKI_SOUL_ASSIGNMENT_DB
  ?? fileURLToPath(new URL('.omo/private/seoul-migration/sqlite-authority-20261021/soul-assignments.sqlite',repo));
const currentSouls = openSoulAssignments(soulDatabase,options);
let original, approvedBytes;
try {
  original = currentSouls.readDocument();
  // Import fixtures retain sealed bytes; current expectations use typed rows only.
  const archive = new DatabaseSync(soulDatabase,{readOnly:true});
  try { approvedBytes = Buffer.from(archive.prepare('SELECT raw_bytes FROM soul_archive WHERE singleton=1').get().raw_bytes); }
  finally { archive.close(); }
} finally { currentSouls.close(); }
const identity = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? fileURLToPath(new URL('data/canonical/wiki-cast.sqlite',repo)));
let registry;
try { registry = readAtlasIdentity(identity).registry; } finally { identity.close(); }
const init = {...options,approvedBytes,actor:'soul-snapshot-test',reason:'explicit private typed snapshot'};
function fixture(t) {
  const dir=fs.mkdtempSync(join(tmpdir(),'soul-assignment-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  return join(dir,'private.sqlite');
}

test('private edits preserve imported approval and prior typed revisions while stale and invalid changes roll back', t => {
  const path = fixture(t);
  initializeSoulAssignments(path, init);
  initializeSoulAssignmentEdits(path, { ...options, actor: 'editor', reason: 'Enable private authoring' });
  const replacement = structuredClone(original.assignments[0]);
  replacement.status = 'draft';
  delete replacement.approvalRef;
  const edit = { ...options, personId: replacement.personId, expectedRevision: 0,
    actor: 'editor', reason: 'Private draft revision', assignment: replacement };
  assert.equal(replaceSoulAssignment(path, edit).revision_id, 1);
  const current = openSoulAssignments(path, options);
  const approved = openSoulAssignments(path, { ...options, view: 'approved' });
  try {
    assert.deepEqual(approved.readDocument(), original);
    assert.deepEqual(current.readDocument({ revision: 0 }), original);
    assert.equal(current.readRevision().revision_id, 1);
    assert.equal(current.readDocument().status, 'draft');
    assert.deepEqual(current.readAssignmentMap().get(replacement.personId), replacement);
    assert.throws(() => replaceSoulAssignment(path, edit), { code: 'E_SOUL_CONFLICT' });
    const bytes = fs.readFileSync(path);
    assert.throws(() => replaceSoulAssignment(path, { ...edit, expectedRevision: 1,
      assignment: { ...replacement, unknownField: 'invalid' } }), { code: 'E_SOUL_UNKNOWN_FIELD' });
    assert.deepEqual(fs.readFileSync(path), bytes);
    assert.throws(() => replaceSoulAssignment(path, { ...edit, expectedRevision: 1,
      assignment: { ...replacement, approvalRef: 'not-approved' } }), { code: 'E_SOUL_APPROVAL' });
    assert.equal(replaceSoulAssignment(path, { ...edit, expectedRevision: 1, reason: 'Second private draft' }).revision_id, 2);
    assert.equal(current.readRevision(1).revision_id, 1);
    assert.equal(current.readRevision().revision_id, 2);
    assert.deepEqual(approved.readDocument(), original);
  } finally { current.close(); approved.close(); }
  const archive = new DatabaseSync(path, { readOnly: true });
  try { assert.deepEqual(Buffer.from(archive.prepare('SELECT raw_bytes FROM soul_archive').get().raw_bytes), approvedBytes); }
  finally { archive.close(); }
});

test('complete actual document round-trips in exact JSON order from typed rows after reopen without JSON parsing or source reads',t=>{
  const path=fixture(t);
  assert.equal(sha(approvedBytes),SOUL_ASSIGNMENT_SOURCE_SHA256);
  assert.equal(original.assignments.length,1022);
  initializeSoulAssignments(path,init);
  assert.equal(fs.statSync(path).mode&0o777,0o600);
  const store=openSoulAssignments(path,options);
  assert.deepEqual(store.readDocument(),original);
  store.close();
  const read=fs.readFileSync,list=fs.readdirSync,parse=JSON.parse;
  let reopened;
  try {
    fs.readFileSync=()=>{throw new Error('source reads forbidden');};
    fs.readdirSync=()=>{throw new Error('source scans forbidden');};
    syncBuiltinESMExports();
    JSON.parse=()=>{throw new Error('JSON parsing forbidden');};
    reopened=openSoulAssignments(path,options);
    assert.deepEqual(reopened.readDocument(),original);
    assert.equal(JSON.stringify(reopened.readDocument()),JSON.stringify(original));
    const map=reopened.readAssignmentMap();
    assert.deepEqual([...map.values()],original.assignments);
    assert.deepEqual(validateSoulAssignments(reopened.readDocument(),registry,{complete:true}),[]);
    // The full document API is directly consumable by the existing roster validator.
    const roster=original.assignments.map(a=>({personId:a.personId,name:a.name,souls:a.souls}));
    const failures=profileRosterFailures(roster,registry,reopened.readDocument());
    assert.ok(failures.every(f=>!/^E_PROFILE_(IDENTITY|SOUL|MISSING|DUPLICATE)/.test(f)));
  } finally {
    reopened?.close();fs.readFileSync=read;fs.readdirSync=list;syncBuiltinESMExports();JSON.parse=parse;
  }
  const db=new DatabaseSync(path);
  assert.equal(db.prepare('PRAGMA application_id').get().application_id,0x57534f55);
  const revision=db.prepare('SELECT * FROM soul_revision').get();
  assert.equal(revision.actor,init.actor);assert.equal(revision.reason,init.reason);
  assert.equal(revision.assignment_count,1022);
  const archive=db.prepare('SELECT * FROM soul_archive').get();
  assert.deepEqual(Buffer.from(archive.raw_bytes),approvedBytes);
  assert.equal(archive.sha256,sha(approvedBytes));
  assert.throws(()=>db.exec("UPDATE soul_archive SET raw_bytes=x'00'"),/immutable soul evidence/);
  assert.throws(()=>db.exec('DELETE FROM soul_archive'),/immutable soul evidence/);
  // Archived JSON is evidence, not the operational reader's fallback authority.
  db.exec('DROP TRIGGER soul_archive_no_delete; DELETE FROM soul_archive');db.close();
  const typed=openSoulAssignments(path,options);
  assert.deepEqual(typed.readDocument(),original);typed.close();
  assert.throws(()=>openDocumentStore(path),{code:'E_SCHEMA'});
  assert.throws(()=>openEvidenceStore(path,{capability:INTERNAL_EVIDENCE_CAPABILITY}),{code:'E_SCHEMA'});
});

test('private capability, hash, audit, exclusive initialization and mode boundaries fail closed',t=>{
  const path=fixture(t);
  for(const patch of [{capability:undefined},{capability:Symbol('internal Soul-Assignments')},{scope:'public'}]) {
    assert.throws(()=>initializeSoulAssignments(path,{...init,...patch}),{code:'E_PRIVATE'});
    assert.throws(()=>openSoulAssignments(path,{...options,...patch}),{code:'E_PRIVATE'});
  }
  for(const patch of [{actor:''},{reason:''}]) assert.throws(()=>initializeSoulAssignments(path,{...init,...patch}),{code:'E_SOUL_AUDIT'});
  assert.throws(()=>initializeSoulAssignments(path,{...init,approvedBytes:undefined}),{code:'E_SOUL_BYTES'});
  assert.throws(()=>initializeSoulAssignments(path,{...init,expectedSha256:'0'.repeat(64)}),{code:'E_SOUL_HASH'});
  assert.equal(fs.existsSync(path),false);
  initializeSoulAssignments(path,init);
  assert.throws(()=>initializeSoulAssignments(path,init),{code:'EEXIST'});
  assert.throws(()=>openSoulAssignments(path,{...options,expectedSha256:'0'.repeat(64)}),{code:'E_SOUL_HASH'});
  assert.throws(()=>openSoulAssignments(path,{capability:INTERNAL_SOUL_CAPABILITY}),{code:'E_SOUL_HASH'});
  fs.chmodSync(path,0o644);
  assert.throws(()=>openSoulAssignments(path,options),{code:'E_PRIVATE_MODE'});
});

test('unknown fields at every actual domain and invalid late values atomically roll back',t=>{
  const path=fixture(t);
  const changes=[
    d=>{d.extra='unknown';},d=>{d.coverage.extra='unknown';},
    d=>{d.assignments.at(-1).extra='unknown';},d=>{d.assignments.at(-1).souls[0].extra='unknown';},
    d=>{d.assignments.at(-1).evidence[0].extra='unknown';},
    d=>{d.assignments.find(a=>a.historicalComparison).historicalComparison.extra='unknown';},
    d=>{d.assignments.find(a=>a.historicalComparisons).historicalComparisons[0].extra='unknown';},
    d=>{d.assignments.find(a=>typeof a.historicalSources?.[0]==='object').historicalSources[0].extra='unknown';},
  ];
  for(const change of changes) {
    const changed=structuredClone(original);change(changed);
    const bytes=Buffer.from(JSON.stringify(changed));
    assert.throws(()=>initializeSoulAssignments(path,{...init,approvedBytes:bytes,expectedSha256:sha(bytes)}),{code:'E_SOUL_UNKNOWN_FIELD'});
    assert.equal(fs.existsSync(path),false);
    assert.equal(fs.existsSync(path+'-journal'),false);
  }
  for(const change of [d=>{d.assignments.at(-1).souls[0].id=3;},d=>{d.assignments.at(-1).counterEvidence=[false];},d=>{d.assignments.pop();}]) {
    const changed=structuredClone(original);change(changed);
    const bytes=Buffer.from(JSON.stringify(changed));
    assert.throws(()=>initializeSoulAssignments(path,{...init,approvedBytes:bytes,expectedSha256:sha(bytes)}),{code:'E_SOUL_SHAPE'});
    assert.equal(fs.existsSync(path),false);
  }
});

test('missing trailing rows, missing objects, changed order, values, and orphan rows fail integrity checks',t=>{
  const mutations=[
    'DELETE FROM soul_evidence WHERE row_key=(SELECT row_key FROM soul_evidence ORDER BY row_key DESC LIMIT 1)',
    "DELETE FROM soul_coverage WHERE row_key='document/coverage'",
    "UPDATE soul_soul SET name='changed' WHERE row_key='document/assignments/0/souls/0'",
    "UPDATE soul_assignment SET field_order='name|personId|status|souls|evidence' WHERE row_key='document/assignments/0'",
    "DELETE FROM soul_identity WHERE person_id=(SELECT person_id FROM soul_identity LIMIT 1)",
    "INSERT INTO soul_counter_item VALUES ('orphan','orphan',0,'value','orphan')",
  ];
  for(const mutation of mutations) {
    const path=fixture(t);initializeSoulAssignments(path,init);
    const db=new DatabaseSync(path);
    db.exec(mutation);db.close();
    const reader=openSoulAssignments(path,options);
    assert.throws(()=>reader.readDocument(),{code:'E_SOUL_INTEGRITY'});reader.close();
  }
});
