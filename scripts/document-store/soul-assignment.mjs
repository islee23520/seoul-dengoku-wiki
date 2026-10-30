import { createHash } from 'node:crypto';
import { closeSync, openSync, readFileSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { assertPrivateFilePermissions } from './private-file-permissions.mjs';
import { validateSoulAssignments } from '../validate-soul-assignments.mjs';

// Private authoring: imports retain approval evidence; edits only create drafts.
export const INTERNAL_SOUL_CAPABILITY = Symbol('internal Soul-Assignments');
const APPLICATION_ID = 0x57534f55;
const schema = readFileSync(new URL('./soul-assignment.sql', import.meta.url), 'utf8');
const editSchema = readFileSync(new URL('./soul-assignment-edit.sql', import.meta.url), 'utf8');
const definitions = {
  "document": {
    "schema": "text",
    "status": "text",
    "visibility": "text",
    "maximumSoulsPerPerson": "integer",
    "assignmentPolicy": "text",
    "candidatePeriods": [
      "candidate_period"
    ],
    "interpretationPolicy": "text",
    "sourceRegistry": "text",
    "coverage": "coverage",
    "assignments": [
      "assignment"
    ],
    "pending": "text"
  },
  "coverage": {
    "registeredPeople": "integer",
    "assignedPeople": "integer",
    "complete": "boolean"
  },
  "assignment": {
    "personId": "text",
    "name": "text",
    "status": "text",
    "souls": [
      "soul"
    ],
    "evidence": [
      "evidence"
    ],
    "narrativeRationale": "text",
    "counterEvidence": "counter",
    "evidenceStrength": "text",
    "historicalComparisons": [
      "comparison"
    ],
    "duplicateRationale": "text",
    "historicalComparison": "comparison",
    "historicalSources": [
      "historical_source"
    ],
    "approvalRef": "text"
  },
  "soul": {
    "id": "text",
    "name": "text",
    "period": "text",
    "sourceKind": "text",
    "interpretation": "text"
  },
  "evidence": {
    "path": "text",
    "anchor": "text",
    "quote": "text",
    "sourcePointer": "text",
    "sourceSelector": "text",
    "currentFactAuthority": "boolean"
  },
  "comparison": {
    "candidatePath": "text",
    "candidateId": "text",
    "sourceKind": "text",
    "careerSummary": "text",
    "interpretation": "text",
    "sources": [
      "historical_source"
    ],
    "limitations": [
      "comparison_limitation"
    ],
    "path": "text",
    "interpretiveScope": "text",
    "candidateLedger": "text",
    "interpretationOnly": "boolean",
    "primarySourcesVerified": "boolean",
    "anchor": "text",
    "narrativeFit": "text"
  },
  "historical_source": {
    "url": "text",
    "sourceType": "text",
    "accessMethod": "text",
    "accessedOn": "text"
  },
  "candidate_period": "text",
  "comparison_limitation": "text",
  "counter_item": "text"
};
const required = {
  document:['schema','status','visibility','maximumSoulsPerPerson','assignmentPolicy','candidatePeriods','interpretationPolicy','sourceRegistry','coverage','assignments','pending'],
  coverage:['registeredPeople','assignedPeople','complete'],
  assignment:['personId','name','status','souls','evidence'],
  soul:['id','name','period','sourceKind'], evidence:['path','quote'],
  historical_source:['url','accessedOn'],
};
const scalar = type => ['text','integer','boolean'].includes(type);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const table = domain => 'soul_' + domain;
const quote = name => '"' + name + '"';
function authorize({capability,scope='internal'}) {
  if (capability !== INTERNAL_SOUL_CAPABILITY || scope !== 'internal') fail('E_PRIVATE');
}
function writeDomain(db, domain, key, parent, ordinal, value, revisionId) {
  const def = definitions[domain];
  function insert(columns, values) {
    if (revisionId !== undefined) { columns.push('revision_id'); values.push(revisionId); }
    db.prepare('INSERT INTO '+table(domain)+' ('+columns.map(quote).join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')').run(...values);
  }
  if (domain==='historical_source' && typeof value==='string') {
    insert(['row_key','parent_key','ordinal','field_order','url','source_kind'],[key,parent,ordinal,'',value,'url']);
    return;
  }
  if (typeof def === 'string') {
    if (typeof value !== 'string') fail('E_SOUL_SHAPE');
    insert(['row_key','parent_key','ordinal','field_order','value'],[key,parent,ordinal,'value',value]);
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('E_SOUL_SHAPE');
  const keys = Object.keys(value);
  if (keys.some(k => !Object.hasOwn(def,k))) fail('E_SOUL_UNKNOWN_FIELD');
  if ((required[domain] ?? []).some(k => !Object.hasOwn(value,k))) fail('E_SOUL_SHAPE');
  for (const field of keys) {
    const type=def[field], v=value[field];
    if (scalar(type) && !(type==='text' ? typeof v==='string' : type==='boolean' ? typeof v==='boolean' : Number.isSafeInteger(v))) fail('E_SOUL_SHAPE');
    if (type==='counter' && typeof v!=='string' && !Array.isArray(v)) fail('E_SOUL_SHAPE');
  }
  const names=Object.entries(def).filter(([,t])=>scalar(t)||t==='counter').map(([k])=>k);
  const columns=['row_key','parent_key','ordinal','field_order',...names];
  const values=[key,parent,ordinal,keys.join('|'),...names.map(k=>{
    if (!Object.hasOwn(value,k) || Array.isArray(value[k])) return null;
    return def[k]==='boolean' ? Number(value[k]) : value[k];
  })];
  if (domain==='assignment') { columns.push('counter_kind'); values.push(!Object.hasOwn(value,'counterEvidence')?null:Array.isArray(value.counterEvidence)?'array':'text'); }
  if (domain==='historical_source') { columns.push('source_kind'); values.push('record'); }
  insert(columns,values);
  for (const field of keys) {
    const type=def[field], v=value[field], childKey=key+'/'+field;
    const items=Array.isArray(type)?type[0]:type==='counter'&&Array.isArray(v)?'counter_item':null;
    if (items) {
      if (!Array.isArray(v)) fail('E_SOUL_SHAPE');
      v.forEach((item,i)=>writeDomain(db,items,childKey+'/'+i,childKey,i,item,revisionId));
    } else if (!scalar(type) && type!=='counter') writeDomain(db,type,childKey,key,0,v,revisionId);
  }
}
function readDocument(db, revision) {
  const visited = new Map();
  function domainValue(domain,key,parent,ordinal) {
    const row=db.prepare('SELECT * FROM '+table(domain)+' WHERE row_key=?').get(key);
    if (!row || row.parent_key!==parent || row.ordinal!==ordinal
      || (revision.revision_id!==undefined && row.revision_id!==revision.revision_id)) fail('E_SOUL_INTEGRITY');
    const seen=visited.get(domain) ?? new Set();
    if (seen.has(key)) fail('E_SOUL_INTEGRITY');
    seen.add(key);visited.set(domain,seen);
    const def=definitions[domain];
    if (typeof def==='string') return row.value;
    if (domain==='historical_source' && row.source_kind==='url') return row.url;
    const result={};
    for(const field of row.field_order.split('|').filter(Boolean)) {
      if (!Object.hasOwn(def,field)||Object.hasOwn(result,field)) fail('E_SOUL_INTEGRITY');
      const type=def[field],childKey=key+'/'+field;
      const items=Array.isArray(type)?type[0]:type==='counter'&&row.counter_kind==='array'?'counter_item':null;
      if(items) {
        const rows=db.prepare('SELECT row_key,ordinal FROM '+table(items)+' WHERE parent_key=? ORDER BY ordinal').all(childKey);
        result[field]=rows.map((r,i)=>{if(r.row_key!==childKey+'/'+i||r.ordinal!==i)fail('E_SOUL_INTEGRITY');return domainValue(items,r.row_key,childKey,i);});
      } else if (scalar(type)||type==='counter') result[field]=type==='boolean'?Boolean(row[field]):row[field];
      else result[field]=domainValue(type,childKey,key,0);
    }
    return result;
  }
  const prefix=revision.revision_id>0?'revision/'+revision.revision_id+'/':'';
  const document=domainValue('document',prefix+'document',prefix+'root',0);
  for(const domain of Object.keys(definitions)) {
    const count=revision.revision_id===undefined
      ? db.prepare('SELECT count(*) AS n FROM '+table(domain)).get().n
      : db.prepare('SELECT count(*) AS n FROM '+table(domain)+' WHERE revision_id=?').get(revision.revision_id).n;
    if(count!==(visited.get(domain)?.size??0))fail('E_SOUL_INTEGRITY');
  }
  const identities=db.prepare('SELECT person_id FROM soul_identity ORDER BY person_id').all().map(r=>r.person_id);
  const actual=document.assignments.map(a=>a.personId).sort();
  if (sha(JSON.stringify(document))!==revision.snapshot_sha256 || document.assignments.length!==revision.assignment_count || JSON.stringify(identities)!==JSON.stringify(actual)) fail('E_SOUL_INTEGRITY');
  return document;
}

/** Caller supplies exact source bytes in memory.
 * No logical source path is opened; the archived bytes are immutable evidence only.
 * The imported revision remains immutable after the separate edit-schema migration.
 */
export function initializeSoulAssignments(path, options={}) {
  authorize(options);
  const {approvedBytes,actor,reason}=options;
  if(typeof actor!=='string'||!actor.trim()||typeof reason!=='string'||!reason.trim())fail('E_SOUL_AUDIT');
  if(!(approvedBytes instanceof Uint8Array))fail('E_SOUL_BYTES');
  const bytes=Buffer.from(approvedBytes);
  const sourceSha256=sha(bytes);
  closeSync(openSync(path,'wx',0o600));
  let db;
  try {
    db=new DatabaseSync(path,{enableForeignKeyConstraints:true});
    db.exec('BEGIN IMMEDIATE');db.exec(schema);
    db.exec('PRAGMA application_id='+APPLICATION_ID+'; PRAGMA user_version=1');
    const document=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    writeDomain(db,'document','document','root',0,document);
    if(document.schema!=='seoul-soul-assignments.v1'||document.visibility!=='editorial-only'||!Array.isArray(document.assignments))fail('E_SOUL_SHAPE');
    const registry={totalPeople:document.assignments.length,persons:document.assignments.map(a=>({id:a.personId,name:a.name}))};
    if(validateSoulAssignments(document,registry,{complete:true}).length)fail('E_SOUL_SHAPE');
    for(const a of document.assignments)db.prepare('INSERT INTO soul_identity VALUES (?)').run(a.personId);
    db.prepare('INSERT INTO soul_revision VALUES (1,?,?,?,?,?,?)').run(sourceSha256,sha(JSON.stringify(document)),document.assignments.length,actor,reason,new Date().toISOString());
    db.prepare('INSERT INTO soul_archive VALUES (1,?,?)').run(sourceSha256,bytes);
    readDocument(db,db.prepare('SELECT * FROM soul_revision').get());
    db.exec('COMMIT');db.close();
  } catch(error) {
    if(db?.isOpen){if(db.isTransaction)db.exec('ROLLBACK');db.close();}
    unlinkSync(path);throw error;
  }
}

function openDatabase(path, options, readOnly=true) {
  authorize(options);
  assertPrivateFilePermissions(path);
  const db=new DatabaseSync(path,{readOnly,enableForeignKeyConstraints:true});
  try {
    if(db.prepare('PRAGMA application_id').get().application_id!==APPLICATION_ID||![1,2].includes(db.prepare('PRAGMA user_version').get().user_version))fail('E_SCHEMA');
    const revision=db.prepare('SELECT * FROM soul_revision').all();
    if(revision.length!==1||revision[0].singleton!==1)fail('E_SOUL_REVISION');
    if(readOnly)db.exec('PRAGMA query_only=ON');
  }catch(error){db.close();throw error;}
  return db;
}

function audit({actor,reason}) {
  if(typeof actor!=='string'||!actor.trim()||typeof reason!=='string'||!reason.trim())fail('E_SOUL_AUDIT');
}

function revisionRecord(db, selection) {
  if(selection!==undefined&&(!Number.isSafeInteger(selection)||selection<0))fail('E_SOUL_REVISION');
  if(db.prepare('PRAGMA user_version').get().user_version===1) {
    if(selection!==undefined&&selection!==0)fail('E_SOUL_REVISION');
    return {...db.prepare('SELECT * FROM soul_revision WHERE singleton=1').get(),revision_id:0,parent_revision:null,status:'imported'};
  }
  const id=selection??db.prepare('SELECT revision_id FROM soul_head WHERE singleton=1').get()?.revision_id;
  const revision=db.prepare('SELECT * FROM soul_edit_revision WHERE revision_id=?').get(id??null);
  if(!revision)fail('E_SOUL_REVISION');
  return revision;
}

function readSnapshot(db, selection) {
  const revision=revisionRecord(db,selection);
  const legacy=db.prepare('PRAGMA user_version').get().user_version===1;
  const document=readDocument(db,legacy?{...revision,revision_id:undefined}:revision);
  return {revision,document};
}

/** Explicit writable migration. Reads never initialize or migrate a database. */
export function initializeSoulAssignmentEdits(path, options={}) {
  authorize(options);audit(options);
  const db=openDatabase(path,options,false);
  try {
    db.exec('BEGIN IMMEDIATE');
    if(db.prepare('PRAGMA user_version').get().user_version!==1)fail('E_SOUL_EDIT_SCHEMA_EXISTS');
    const original=readSnapshot(db,0);
    db.exec(editSchema);
    db.prepare('INSERT INTO soul_edit_revision VALUES (0,NULL,?,?,?,?,?,?,?,?)').run(
      original.revision.source_sha256,original.revision.snapshot_sha256,original.revision.assignment_count,
      'imported',original.revision.actor,original.revision.reason,original.revision.initialized_at,null);
    db.prepare('INSERT INTO soul_edit_initialization VALUES (1,?,?,?)').run(options.actor,options.reason,new Date().toISOString());
    for(const domain of Object.keys(definitions)) {
      const name=table(domain);
      db.exec('ALTER TABLE '+name+' ADD COLUMN revision_id INTEGER NOT NULL DEFAULT 0 CHECK(revision_id>=0)');
      db.exec('CREATE INDEX '+name+'_revision ON '+name+'(revision_id)');
      db.exec(`CREATE TRIGGER ${name}_no_update BEFORE UPDATE ON ${name} BEGIN SELECT RAISE(ABORT,'immutable soul revision'); END;
        CREATE TRIGGER ${name}_no_delete BEFORE DELETE ON ${name} BEGIN SELECT RAISE(ABORT,'immutable soul revision'); END;
        CREATE TRIGGER ${name}_revision_insert BEFORE INSERT ON ${name} BEGIN
          SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM soul_edit_revision WHERE revision_id=NEW.revision_id)
            OR NEW.revision_id<=COALESCE((SELECT revision_id FROM soul_head WHERE singleton=1),0)
            THEN RAISE(ABORT,'sealed soul revision') END;
        END;`);
    }
    db.exec('INSERT INTO soul_head VALUES (1,0); PRAGMA user_version=2');
    readSnapshot(db,0);
    db.exec('COMMIT');
    return original.revision;
  } catch(error) { if(db.isTransaction)db.exec('ROLLBACK');throw error; }
  finally { db.close(); }
}

/** Replace one existing person's typed assignment. This API cannot grant approval. */
export function replaceSoulAssignment(path, options={}) {
  authorize(options);audit(options);
  const {personId,expectedRevision,assignment}=options;
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)fail('E_SOUL_REVISION');
  if(typeof personId!=='string'||!personId.trim())fail('E_SOUL_IDENTITY');
  if(!assignment||typeof assignment!=='object'||Array.isArray(assignment))fail('E_SOUL_SHAPE');
  if(assignment.status!=='draft'||Object.hasOwn(assignment,'approvalRef'))fail('E_SOUL_APPROVAL');
  const db=openDatabase(path,options,false);
  try {
    db.exec('BEGIN IMMEDIATE');
    if(db.prepare('PRAGMA user_version').get().user_version!==2)fail('E_SOUL_EDIT_SCHEMA_REQUIRED');
    const current=readSnapshot(db);
    if(current.revision.revision_id!==expectedRevision)fail('E_SOUL_CONFLICT');
    const index=current.document.assignments.findIndex(a=>a.personId===personId);
    if(index<0||assignment.personId!==personId||assignment.name!==current.document.assignments[index].name)fail('E_SOUL_IDENTITY');
    const document=current.document;
    document.assignments[index]=assignment;
    document.status='draft';
    const persons=db.prepare('SELECT "personId" AS id,name FROM soul_assignment WHERE revision_id=0 ORDER BY ordinal').all();
    const registry={totalPeople:persons.length,persons};
    if(validateSoulAssignments(document,registry,{complete:true}).length)fail('E_SOUL_SHAPE');
    const id=expectedRevision+1;
    if(!Number.isSafeInteger(id))fail('E_SOUL_REVISION');
    db.prepare('INSERT INTO soul_edit_revision VALUES (?,?,?,?,?,?,?,?,?,?)').run(
      id,expectedRevision,current.revision.source_sha256,sha(JSON.stringify(document)),document.assignments.length,
      'draft',options.actor,options.reason,new Date().toISOString(),personId);
    writeDomain(db,'document','revision/'+id+'/document','revision/'+id+'/root',0,document,id);
    readSnapshot(db,id);
    const updated=db.prepare('UPDATE soul_head SET revision_id=? WHERE singleton=1 AND revision_id=?').run(id,expectedRevision);
    if(updated.changes!==1)fail('E_SOUL_CONFLICT');
    const revision=revisionRecord(db,id);
    db.exec('COMMIT');
    return revision;
  } catch(error) { if(db.isTransaction)db.exec('ROLLBACK');throw error; }
  finally { db.close(); }
}

/** Current head by default; view:'approved' explicitly pins the imported typed snapshot. */
export function openSoulAssignments(path, options={}) {
  const view=options.view??'current';
  authorize(options);
  if(!['current','approved'].includes(view))fail('E_SOUL_VIEW');
  const db=openDatabase(path,options);
  function read({revision}={}) {
    if(view==='approved'&&revision!==undefined&&revision!==0)fail('E_SOUL_REVISION');
    db.exec('BEGIN');
    try {const snapshot=readSnapshot(db,view==='approved'?0:revision);db.exec('COMMIT');return snapshot;}
    catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}
  }
  return Object.freeze({close:()=>db.close(),readSnapshot:read,
    readRevision:revision=>read({revision}).revision,
    readDocument:selection=>read(selection).document,
    readAssignmentMap:()=>new Map(read().document.assignments.map(a=>[a.personId,a]))});
}

/** Read the imported approved snapshot on a caller-owned PostgreSQL transaction.
 * PostgreSQL must not silently substitute the editable draft head. */
export async function openSoulAssignmentsAsync(tx, options = {}) {
 authorize(options);
 const view = options.view ?? 'approved';
 if (view !== 'approved') fail('E_SOUL_VIEW');
 if (!tx?.isTransaction || typeof tx.all !== 'function') fail('E_PRIVATE');
 const revisions = await tx.all('SELECT * FROM wiki_private.soul_revision');
 if (revisions.length !== 1 || revisions[0].singleton !== 1) fail('E_SOUL_REVISION');
 const columns = await tx.all("SELECT column_name FROM information_schema.columns WHERE table_schema='wiki_private' AND table_name='soul_document' AND column_name='revision_id'");
 const migrated = columns.length === 1;
 let revision;
 if (migrated) {
  const imported = await tx.all('SELECT * FROM wiki_private.soul_edit_revision WHERE revision_id=0');
  if (imported.length !== 1 || imported[0].status !== 'imported') fail('E_SOUL_REVISION');
  revision = imported[0];
 } else revision = { ...revisions[0], revision_id: 0, parent_revision: null, status: 'imported' };
 const domains = new Map();
 for (const domain of Object.keys(definitions)) {
  const rows = await tx.all('SELECT * FROM wiki_private.' + table(domain) + (migrated ? ' WHERE revision_id=0' : '') + ' ORDER BY ordinal');
  const byKey = new Map(), byParent = new Map();
  for (const row of rows) {
   byKey.set(row.row_key, row);
   const siblings = byParent.get(row.parent_key) ?? [];
   siblings.push(row); byParent.set(row.parent_key, siblings);
  }
  domains.set(table(domain), { byKey, byParent, count: rows.length });
 }
 const identities = await tx.all('SELECT person_id FROM wiki_private.soul_identity ORDER BY person_id COLLATE "C"');
 const sheet = {
  prepare(sql) {
   if (sql === 'SELECT person_id FROM soul_identity ORDER BY person_id') return { all: () => identities };
   const match = /^SELECT (\*|row_key,ordinal|count\(\*\) AS n) FROM (soul_[a-z_]+)(?: WHERE (row_key|parent_key|revision_id)=\?(?: ORDER BY ordinal)?)?$/.exec(sql);
   if (!match || !domains.has(match[2])) fail('E_SOUL_INTEGRITY');
   const { byKey, byParent, count } = domains.get(match[2]);
   return { get: key => match[1] === 'count(*) AS n' ? { n: count } : byKey.get(key), all: key => byParent.get(key) ?? [] };
  }
 };
 function read({ revision: selection } = {}) {
  if (selection !== undefined && selection !== 0) fail('E_SOUL_REVISION');
  const document = readDocument(sheet, migrated ? revision : { ...revision, revision_id: undefined });
  return { revision, document };
 }
 return Object.freeze({
  async readSnapshot(selection) { return read(selection); },
  async readRevision(selection) { return read({ revision: selection }).revision; },
  async readDocument(selection) { return read(selection).document; },
  async readAssignmentMap() { return new Map(read().document.assignments.map(a => [a.personId, a])); }
 });
}
