import { createHash } from 'node:crypto';
import { closeSync, openSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { validateSoulAssignments } from '../validate-soul-assignments.mjs';

// Internal snapshot only: initialization records supplied approval evidence, never grants approval.
export const INTERNAL_SOUL_CAPABILITY = Symbol('internal Soul-Assignments');
export const SOUL_ASSIGNMENT_SOURCE_SHA256 = '695638585da68178204cfb94c77f87653207d7f28e82c948015500fc5a70c002';
const APPLICATION_ID = 0x57534f55;
const schema = readFileSync(new URL('./soul-assignment.sql', import.meta.url), 'utf8');
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
function writeDomain(db, domain, key, parent, ordinal, value) {
  const def = definitions[domain];
  if (domain==='historical_source' && typeof value==='string') {
    db.prepare('INSERT INTO soul_historical_source (row_key,parent_key,ordinal,field_order,url,source_kind) VALUES (?,?,?,?,?,?)').run(key,parent,ordinal,'',value,'url');
    return;
  }
  if (typeof def === 'string') {
    if (typeof value !== 'string') fail('E_SOUL_SHAPE');
    db.prepare('INSERT INTO '+table(domain)+' VALUES (?,?,?,?,?)').run(key,parent,ordinal,'value',value);
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
  db.prepare('INSERT INTO '+table(domain)+' ('+columns.map(quote).join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')').run(...values);
  for (const field of keys) {
    const type=def[field], v=value[field], childKey=key+'/'+field;
    const items=Array.isArray(type)?type[0]:type==='counter'&&Array.isArray(v)?'counter_item':null;
    if (items) {
      if (!Array.isArray(v)) fail('E_SOUL_SHAPE');
      v.forEach((item,i)=>writeDomain(db,items,childKey+'/'+i,childKey,i,item));
    } else if (!scalar(type) && type!=='counter') writeDomain(db,type,childKey,key,0,v);
  }
}
function readDocument(db, revision) {
  const visited = new Map();
  function domainValue(domain,key,parent,ordinal) {
    const row=db.prepare('SELECT * FROM '+table(domain)+' WHERE row_key=?').get(key);
    if (!row || row.parent_key!==parent || row.ordinal!==ordinal) fail('E_SOUL_INTEGRITY');
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
  const document=domainValue('document','document','root',0);
  for(const domain of Object.keys(definitions)) if(db.prepare('SELECT count(*) AS n FROM '+table(domain)).get().n!==(visited.get(domain)?.size??0))fail('E_SOUL_INTEGRITY');
  const identities=db.prepare('SELECT person_id FROM soul_identity ORDER BY person_id').all().map(r=>r.person_id);
  const actual=document.assignments.map(a=>a.personId).sort();
  if (sha(JSON.stringify(document))!==revision.snapshot_sha256 || document.assignments.length!==revision.assignment_count || JSON.stringify(identities)!==JSON.stringify(actual)) fail('E_SOUL_INTEGRITY');
  return document;
}

/** Caller supplies exact approved bytes and their expected digest in memory.
 * No logical source path is opened; the archived bytes are immutable evidence only.
 * The one imported revision is a read-only snapshot, not an authoring authority.
 */
export function initializeSoulAssignments(path, options={}) {
  authorize(options);
  const {approvedBytes,expectedSha256,actor,reason}=options;
  if(typeof actor!=='string'||!actor.trim()||typeof reason!=='string'||!reason.trim())fail('E_SOUL_AUDIT');
  if(!(approvedBytes instanceof Uint8Array))fail('E_SOUL_BYTES');
  const bytes=Buffer.from(approvedBytes);
  if(typeof expectedSha256!=='string'||!/[a-f0-9]{64}/.test(expectedSha256)||sha(bytes)!==expectedSha256)fail('E_SOUL_HASH');
  closeSync(openSync(path,'wx',0o600));
  let db;
  try {
    db=new DatabaseSync(path,{enableForeignKeyConstraints:true});
    db.exec('BEGIN IMMEDIATE');db.exec(schema);
    db.exec('PRAGMA application_id='+APPLICATION_ID+'; PRAGMA user_version=1');
    const document=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    writeDomain(db,'document','document','root',0,document);
    if(document.schema!=='seoul-soul-assignments.v1'||document.visibility!=='editorial-only'||document.assignments.length!==1022)fail('E_SOUL_SHAPE');
    const registry={totalPeople:1022,persons:document.assignments.map(a=>({id:a.personId,name:a.name}))};
    if(validateSoulAssignments(document,registry,{complete:true}).length)fail('E_SOUL_SHAPE');
    for(const a of document.assignments)db.prepare('INSERT INTO soul_identity VALUES (?)').run(a.personId);
    db.prepare('INSERT INTO soul_revision VALUES (1,?,?,?,?,?,?)').run(expectedSha256,sha(JSON.stringify(document)),document.assignments.length,actor,reason,new Date().toISOString());
    db.prepare('INSERT INTO soul_archive VALUES (1,?,?)').run(expectedSha256,bytes);
    readDocument(db,db.prepare('SELECT * FROM soul_revision').get());
    db.exec('COMMIT');db.close();
  } catch(error) {
    if(db?.isOpen){if(db.isTransaction)db.exec('ROLLBACK');db.close();}
    unlinkSync(path);throw error;
  }
}

export function openSoulAssignments(path, options={}) {
  authorize(options);
  if((statSync(path).mode&0o777)!==0o600)fail('E_PRIVATE_MODE');
  const db=new DatabaseSync(path,{readOnly:true,enableForeignKeyConstraints:true});
  try {
    if(db.prepare('PRAGMA application_id').get().application_id!==APPLICATION_ID||db.prepare('PRAGMA user_version').get().user_version!==1)fail('E_SCHEMA');
    const revision=db.prepare('SELECT * FROM soul_revision').all();
    if(revision.length!==1||revision[0].singleton!==1||revision[0].source_sha256!==options.expectedSha256)fail('E_SOUL_HASH');
    db.exec('PRAGMA query_only=ON');
  }catch(error){db.close();throw error;}
  function read() {
    db.exec('BEGIN');
    try {const document=readDocument(db,db.prepare('SELECT * FROM soul_revision WHERE singleton=1').get());db.exec('COMMIT');return document;}
    catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}
  }
  return Object.freeze({close:()=>db.close(),readDocument:read,readAssignmentMap:()=>new Map(read().assignments.map(a=>[a.personId,a]))});
}
