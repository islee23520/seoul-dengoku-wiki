import { createHash } from 'node:crypto';
import { closeSync, openSync, readFileSync, unlinkSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { assertPrivateFilePermissions } from './private-file-permissions.mjs';
import { abilityIds, profileFailures } from '../character-profile.mjs';
import { PROFILE_INPUT_SOURCE_HASHES } from '../cast-sqlite/profile-inputs.mjs';

// Internal read-only snapshot, not an authoring API or a public-reader adapter.
// Inventory of all nine actual batches: every admitted field is named below.
// Fixed domain descriptors compile to separate typed SQL tables, never JSON nodes.
export const INTERNAL_PROFILE_CAPABILITY = Symbol('internal editorial profiles');
export const EDITORIAL_PROFILE_SOURCE_HASHES = PROFILE_INPUT_SOURCE_HASHES;
const APP = 0x57455046;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const localized = { ko: 'text', en: 'text' };
const definitions = {
  batch: { schema:'text', status:'text', visibility:'text', lane:'text', batch:'text', approvalStatus:'text', ratingPolicy:'text', allocationPolicy:'text', count:'integer', profileCount:'integer', contractPath:'text', samplePath:'text', soulAssignmentPath:'text', sourcePaths:['batch_source_path'], sourceRefs:['batch_source_ref'], sourceCards:['batch_source_card'], limitations:['batch_limitation'], profiles:['profile'] },
  profile: { personId:'text', name:'text', status:'text', abilities:'abilities', skills:['skill'], traits:['trait'], narrative:'narrative', evidence:['profile_evidence'], souls:['soul'], health:'health', soulRevisionRef:'text', limitations:['profile_limitation'] },
  abilities: Object.fromEntries(abilityIds.map(id => [id,'ability_value'])),
  ability_value: {base:'integer',effective:'integer',basis:'text'},
  skill: {id:'text',name:'skill_name',rating:'real',basis:'text'},
  skill_name: localized,
  trait: {id:'text',name:'trait_name',description:'trait_description',behavior:'trait_behavior',stress:'trait_stress',relationship:'trait_relationship',effects:['effect'],basis:'text'},
  trait_name:localized, trait_description:localized, trait_behavior:localized, trait_stress:localized, trait_relationship:localized,
  effect: {ability:'text',delta:'integer'}, narrative:localized,
  profile_evidence: {path:'text',anchor:'text',quote:'text'},
  soul: {id:'text',name:'text',period:'text',sourceKind:'text',interpretation:'text'},
  health: {bodyParts:['body_part'],diseases:['disease'],status:'text'},
  body_part:{id:'text',severity:'null',function:'null'},
  // Actual snapshot has no issued diseases. Nonempty unknown disease shapes fail closed.
  disease: {},
  batch_source_path:'text',batch_source_ref:'text',batch_source_card:'text',batch_limitation:'text',profile_limitation:'text',
};
const scalar = type => ['text','integer','real','null'].includes(type);
const quote = name => '"' + name + '"';
const table = domain => 'editorial_' + domain;
const fields = domain => typeof definitions[domain] === 'string' ? ['value'] : Object.entries(definitions[domain]).filter(([,type])=>scalar(type)).map(([key])=>key);
const schema = readFileSync(new URL('./editorial-profile.sql',import.meta.url),'utf8');
const required = { batch:['schema','status','visibility','profiles'],profile:['personId','name','status','abilities','skills','traits','narrative','evidence','souls','health'],abilities:abilityIds,ability_value:['base','effective','basis'],skill:['id','name','rating','basis'],trait:['id','name','description','behavior','stress','relationship','effects','basis'],effect:['ability','delta'],soul:['id','name','period','sourceKind'],health:['bodyParts','diseases','status'],body_part:['id','severity','function'],profile_evidence:['path','anchor','quote'] };

function writeDomain(db, domain, key, parent, ordinal, value) {
  const def = definitions[domain];
  const names = fields(domain);
  if (typeof def === 'string') {
    if (typeof value !== 'string') fail('E_PROFILE_SHAPE');
    db.prepare('INSERT INTO '+table(domain)+' VALUES (?,?,?,?,?)').run(key,parent,ordinal,'value',value);
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('E_PROFILE_SHAPE');
  const keys = Object.keys(value);
  if (keys.some(k=>!Object.hasOwn(def,k))) fail('E_PROFILE_UNKNOWN_FIELD');
  if ((required[domain] ?? (def===localized ? ['ko','en']:[])).some(k=>!Object.hasOwn(value,k))) fail('E_PROFILE_SHAPE');
  for (const field of keys) {
    const type = def[field], v = value[field];
    if (scalar(type) && !(type==='null' ? v===null : type==='text' ? typeof v==='string' : typeof v==='number' && Number.isFinite(v) && (type!=='integer'||Number.isInteger(v)))) fail('E_PROFILE_SHAPE');
  }
  const columns=['row_key','parent_key','ordinal','field_order',...names];
  db.prepare('INSERT INTO '+table(domain)+' ('+columns.map(quote).join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')').run(key,parent,ordinal,keys.join('|'),...names.map(k=>value[k]??null));
  for (const field of keys) {
    const type=def[field], v=value[field], childKey=key+'/'+field;
    if (Array.isArray(type)) {
      if (!Array.isArray(v)) fail('E_PROFILE_SHAPE');
      if (type[0]==='disease' && v.length) fail('E_PROFILE_SHAPE');
      v.forEach((item,i)=>writeDomain(db,type[0],childKey+'/'+i,childKey,i,item));
    } else if (!scalar(type)) writeDomain(db,type,childKey,key,0,v);
  }
}

function readDomain(db,domain,key) {
  const def=definitions[domain], row=db.prepare('SELECT * FROM '+table(domain)+' WHERE row_key=?').get(key);
  if (!row) fail('E_PROFILE_INTEGRITY');
  if (typeof def==='string') return row.value;
  const result={};
  for (const field of row.field_order.split('|').filter(Boolean)) {
    const type=def[field], childKey=key+'/'+field;
    if (!type) fail('E_PROFILE_INTEGRITY');
    if (Array.isArray(type)) {
      const rows=db.prepare('SELECT row_key,ordinal FROM '+table(type[0])+' WHERE parent_key=? ORDER BY ordinal').all(childKey);
      result[field]=rows.map((r,i)=>{if(r.ordinal!==i||r.row_key!==childKey+'/'+i)fail('E_PROFILE_INTEGRITY');return readDomain(db,type[0],r.row_key);});
    } else result[field]=scalar(type)?row[field]:readDomain(db,type,childKey);
  }
  return result;
}

/** Explicit in-memory initialization. No directory scan, source-path dereference,
 * automatic migration, partial import, update, or public export is provided.
 * Exact input bytes are sealed as evidence; readers query typed domains only.
 */
export function initializeEditorialProfiles(path,{capability,scope='internal',batches,expectedSourceHashes,actor,reason}={}) {
  if(capability!==INTERNAL_PROFILE_CAPABILITY||scope!=='internal')fail('E_PRIVATE');
  if(typeof actor!=='string'||!actor.trim()||typeof reason!=='string'||!reason.trim())fail('E_PROFILE_AUDIT');
  if(!Array.isArray(batches)||batches.length!==9||!expectedSourceHashes||Object.keys(expectedSourceHashes).length!==9)fail('E_PROFILE_PINS');
  closeSync(openSync(path,'wx',0o600));
  let db;
  try {
    db=new DatabaseSync(path,{enableForeignKeyConstraints:true});
    db.exec('BEGIN IMMEDIATE'); db.exec(schema);
    db.exec('PRAGMA application_id='+APP+'; PRAGMA user_version=1');
    db.prepare('INSERT INTO editorial_import VALUES (1,?,?,?)').run(actor,reason,new Date().toISOString());
    const paths=Object.keys(PROFILE_INPUT_SOURCE_HASHES), seen=new Set();
    batches.forEach((input,i)=>{
      if(!paths.includes(input.logicalPath)||seen.has(input.logicalPath))fail('E_PROFILE_PINS');
      seen.add(input.logicalPath);
      if(!(input.bytes instanceof Uint8Array))fail('E_PROFILE_BYTES');
      const bytes=Buffer.from(input.bytes), digest=sha(bytes);
      if(digest!==expectedSourceHashes[input.logicalPath])fail('E_PROFILE_PINS');
      const batch=JSON.parse(bytes.toString('utf8'));
      if(batch.schema!=='seoul-character-profile-batch.v1'||batch.visibility!=='editorial-only')fail('E_PROFILE_SHAPE');
      writeDomain(db,'batch',String(i),'root',i,batch);
      db.prepare('INSERT INTO editorial_batch_source VALUES (?,?,?,?,?)').run(i,input.logicalPath,digest,sha(JSON.stringify(batch)),batch.profiles.length);
      db.prepare('INSERT INTO editorial_archive VALUES (?,?,?)').run(input.logicalPath,digest,bytes);
      for(const p of batch.profiles){
        if(profileFailures(p).length)fail('E_PROFILE_SHAPE');
        db.prepare('INSERT INTO editorial_identity VALUES (?)').run(p.personId);
      }
    });
    if(db.prepare('SELECT count(*) AS n FROM editorial_identity').get().n!==1022)fail('E_PROFILE_COVERAGE');
    db.exec('COMMIT'); db.close();
  } catch(error){if(db?.isOpen){if(db.isTransaction)db.exec('ROLLBACK');db.close();}unlinkSync(path);throw error;}
}

export function openEditorialProfiles(path,{capability,scope='internal',expectedSourceHashes}={}) {
  if(capability!==INTERNAL_PROFILE_CAPABILITY||scope!=='internal')fail('E_PRIVATE');
  assertPrivateFilePermissions(path);
  const db=new DatabaseSync(path,{readOnly:true,enableForeignKeyConstraints:true});
  try {
    if(db.prepare('PRAGMA application_id').get().application_id!==APP||db.prepare('PRAGMA user_version').get().user_version!==1)fail('E_SCHEMA');
    if(!expectedSourceHashes||Object.keys(expectedSourceHashes).length!==9)fail('E_PROFILE_PINS');
    const sources=db.prepare('SELECT * FROM editorial_batch_source ORDER BY ordinal').all();
    if(sources.length!==9||sources.some((s,i)=>s.ordinal!==i||!Object.hasOwn(PROFILE_INPUT_SOURCE_HASHES,s.logical_path)||s.sha256!==expectedSourceHashes[s.logical_path]))fail('E_PROFILE_PINS');
  }catch(error){db.close();throw error;}
  return Object.freeze({close:()=>db.close(),readBatches(){
    db.exec('BEGIN');
    try {
      const rows=db.prepare('SELECT * FROM editorial_batch_source ORDER BY ordinal').all();
      const batches=rows.map(row=>{
        const batch=readDomain(db,'batch',String(row.ordinal));
        if(sha(JSON.stringify(batch))!==row.snapshot_sha256||batch.profiles.length!==row.profile_count)fail('E_PROFILE_INTEGRITY');
        return {logicalPath:row.logical_path,batch};
      });
      db.exec('COMMIT');return batches;
    }catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}
  }});
}
