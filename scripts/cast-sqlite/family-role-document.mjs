import { createHash } from 'node:crypto';

export const FAMILY_ROLE_SOURCE_HASH = 'ca3cce2a0ace5457cfa2f77e07e7e190c6afe226910f9127c8820511053a23f1';
export const FAMILY_ROLE_DOCUMENT_HASH = '22b94620d297ad0e21d7a065b72f5900fc0dd3676f2f0340b5c61c909105f706';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_FAMILY_ROLE_DOCUMENT: '+detail),{code:'E_FAMILY_ROLE_DOCUMENT'}); };
// Bounded domain mappings: each field maps to its own named typed SQL column.
const groups = [
  {
    "group": "finalOwnerAuthoredRoles",
    "table": "family_role_final_owner_role",
    "fields": [
      "edgeId",
      "from",
      "to",
      "parentRole",
      "decisionKind",
      "selectionRef",
      "basis"
    ],
    "count": 385
  },
  {
    "group": "approvedExternalMaternalAncestors",
    "table": "family_role_external_maternal_ancestor",
    "fields": [
      "nodeId",
      "childId",
      "edgeId",
      "before.name",
      "before.lineage",
      "proposedAfter.name",
      "proposedAfter.surname",
      "proposedAfter.bongwan",
      "proposedAfter.clan",
      "givenName",
      "birthDate",
      "deathDate",
      "existingRole",
      "proposedRole",
      "sourceStatus",
      "nameCollision",
      "nameCollisionMeaning",
      "motherId"
    ],
    "count": 24
  },
  {
    "group": "approvedConfirmedFatherRoles",
    "table": "family_role_confirmed_father_role",
    "fields": [
      "from",
      "to"
    ],
    "count": 2
  },
  {
    "group": "ownerAuthoredRoleOnly",
    "table": "family_role_owner_role_only",
    "fields": [
      "edgeId",
      "from",
      "to",
      "parentRole",
      "basis"
    ],
    "count": 1353
  },
  {
    "group": "recursiveAncestorCorrections",
    "table": "family_role_recursive_ancestor_correction",
    "fields": [
      "edgeId",
      "from",
      "to",
      "before",
      "after",
      "category",
      "lineage.surname",
      "lineage.bongwan",
      "lineage.clan",
      "basis"
    ],
    "count": 2
  },
  {
    "group": "sourceBoundRoleCorrections",
    "table": "family_role_source_bound_correction",
    "fields": [
      "edgeId",
      "from",
      "to",
      "before",
      "after",
      "category",
      "basis"
    ],
    "count": 19
  },
  {
    "group": "maternalCorrections",
    "table": "family_role_maternal_correction",
    "fields": [
      "childId",
      "fatherId",
      "motherId",
      "beforeMother.name",
      "beforeMother.surname",
      "beforeMother.bongwan",
      "afterMother.name",
      "afterMother.surname",
      "afterMother.bongwan",
      "afterMother.clan",
      "fatherLine.surname",
      "fatherLine.bongwan",
      "fatherLine.clan",
      "basis"
    ],
    "count": 17
  },
  {
    "group": "derivedParentRoles",
    "table": "family_role_derived_parent_role",
    "fields": [
      "edgeId",
      "from",
      "to",
      "parentRole",
      "lineage.surname",
      "lineage.bongwan",
      "lineage.clan"
    ],
    "count": 3231
  }
];
const children = [
  {
    "group": "approvedExternalMaternalAncestors",
    "key": "sourceRefs",
    "table": "family_role_external_ancestor_source",
    "fields": [
      "path",
      "anchor"
    ],
    "count": 48
  },
  {
    "group": "approvedExternalMaternalAncestors",
    "key": "allNodeReferences",
    "table": "family_role_external_ancestor_node_reference",
    "fields": [
      "reference"
    ],
    "count": 31
  },
  {
    "group": "approvedExternalMaternalAncestors",
    "key": "timelinePointers",
    "table": "family_role_external_ancestor_timeline",
    "fields": [
      "pointer",
      "before",
      "proposedAfter"
    ],
    "count": 24
  },
  {
    "group": "recursiveAncestorCorrections",
    "key": "sourceRefs",
    "table": "family_role_recursive_ancestor_source",
    "fields": [
      "path",
      "anchor"
    ],
    "count": 6
  },
  {
    "group": "sourceBoundRoleCorrections",
    "key": "sourceRefs",
    "table": "family_role_source_bound_source",
    "fields": [
      "path",
      "anchor"
    ],
    "count": 39
  }
];
const contracts = {
  "finalOwnerAuthoredRoles": {
    "edgeId": "string",
    "from": "string",
    "to": "string",
    "parentRole": "string",
    "decisionKind": "string",
    "selectionRef": "string",
    "basis": "string"
  },
  "approvedExternalMaternalAncestors": {
    "nodeId": "string",
    "childId": "string",
    "edgeId": "string",
    "before": {
      "name": "string",
      "lineage": "null"
    },
    "proposedAfter": {
      "name": "string",
      "surname": "string",
      "bongwan": "string",
      "clan": "string"
    },
    "givenName": "string",
    "birthDate": "string",
    "deathDate": "null",
    "existingRole": "null|string",
    "proposedRole": "string",
    "sourceStatus": "string",
    "sourceRefs": [
      {
        "path": "string",
        "anchor?": "string"
      }
    ],
    "allNodeReferences": [
      "string"
    ],
    "timelinePointers": [
      {
        "pointer": "string",
        "before": "string",
        "proposedAfter": "string"
      }
    ],
    "nameCollision": "boolean",
    "nameCollisionMeaning": "string",
    "motherId": "string"
  },
  "approvedConfirmedFatherRoles": {
    "from": "string",
    "to": "string"
  },
  "ownerAuthoredRoleOnly": {
    "edgeId": "string",
    "from": "string",
    "to": "string",
    "parentRole": "string",
    "basis": "string"
  },
  "recursiveAncestorCorrections": {
    "edgeId": "string",
    "from": "string",
    "to": "string",
    "before": "null",
    "after": "string",
    "category": "string",
    "lineage": {
      "surname": "string",
      "bongwan": "string",
      "clan": "string"
    },
    "sourceRefs": [
      {
        "path": "string",
        "anchor": "string"
      }
    ],
    "basis": "string"
  },
  "sourceBoundRoleCorrections": {
    "edgeId": "string",
    "from": "string",
    "to": "string",
    "before": "null",
    "after": "string",
    "category": "string",
    "sourceRefs": [
      {
        "path": "string",
        "anchor": "string"
      }
    ],
    "basis?": "string"
  },
  "maternalCorrections": {
    "childId": "string",
    "fatherId": "string",
    "motherId": "string",
    "beforeMother": {
      "name": "string",
      "surname": "string",
      "bongwan": "null"
    },
    "afterMother": {
      "name": "string",
      "surname": "string",
      "bongwan": "string",
      "clan": "string"
    },
    "fatherLine": {
      "surname": "string",
      "bongwan": "string",
      "clan": "string"
    },
    "basis": "string"
  },
  "derivedParentRoles": {
    "edgeId": "string",
    "from": "string",
    "to": "string",
    "parentRole": "string",
    "lineage?": {
      "surname": "string",
      "bongwan": "string",
      "clan": "string"
    }
  }
};
const column = p => p.replaceAll('.','_').replace(/[A-Z]/gu,c=>'_'+c.toLowerCase());
const at = (v,p) => p.split('.').reduce((o,k)=>o?.[k],v);
const rootContract = {schemaVersion:'number',...Object.fromEntries(groups.map(g=>[g.group,[contracts[g.group]]])),authorization:'string',unresolved:[null]};

function validate(value, contract, path='') {
  if (typeof contract === 'string') {
    const kind = value === null ? 'null' : typeof value;
    if (!contract.split('|').includes(kind) || kind === 'number' && !Number.isSafeInteger(value)) fail('type: '+path);
  } else if (Array.isArray(contract)) {
    if (!Array.isArray(value) || contract[0] === null && value.length) fail('array: '+path);
    value.forEach((v,i)=>validate(v,contract[0],path+'/'+i));
  } else {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('object: '+path);
    const allowed = Object.keys(contract).map(k=>k.replace(/\?$/u,''));
    for (const k of Object.keys(value)) if (!allowed.includes(k)) fail('unknown field: '+path+'/'+k);
    for (const [k,c] of Object.entries(contract)) {
      const key = k.replace(/\?$/u,'');
      if (!Object.hasOwn(value,key)) { if (!k.endsWith('?')) fail('missing field: '+path+'/'+key); }
      else validate(value[key],c,path+'/'+key);
    }
  }
}

/** SELECT-only typed-domain reader. No source/archive reads or JSON parsing. */
export function readFamilyRoleDocument(db,{expectedSourceHash=FAMILY_ROLE_SOURCE_HASH}={}) {
  try {
    const receipts = db.prepare('SELECT * FROM family_role_document_import').all();
    const r = receipts[0];
    if (expectedSourceHash !== FAMILY_ROLE_SOURCE_HASH || receipts.length !== 1 || r.singleton !== 1
      || r.source_sha256 !== expectedSourceHash || r.document_sha256 !== FAMILY_ROLE_DOCUMENT_HASH
      || !r.actor?.trim() || !r.reason?.trim()) fail('source pin/receipt');
    const keys = new Map();
    for (const k of db.prepare('SELECT * FROM family_role_document_key ORDER BY object_path,ordinal').all()) {
      if (!keys.has(k.object_path)) keys.set(k.object_path,[]);
      const list=keys.get(k.object_path);
      if(k.ordinal !== list.length || list.includes(k.key)) fail('key order');
      list.push(k.key);
    }
    const fieldObject = (row,fields,path) => {
      const out={};
      for (const f of fields) {
        if(f==='nameCollision' && ![0,1].includes(row[column(f)]))fail('boolean domain');
        const parts=f.split('.'); let target=out, parent=path;
        let absent=false;
        for(let i=0;i<parts.length;i++) {
          const k=parts[i];
          if(!keys.get(parent)?.includes(k)){absent=true;break;}
          if(i===parts.length-1) target[k]=f==='nameCollision'?Boolean(row[column(f)]):row[column(f)];
          else {target[k]??={};target=target[k];parent+='/'+k;}
        }
        if(absent && row[column(f)] !== null) fail('unconsumed field: '+path+'/'+f);
      }
      return out;
    };
    const result={schemaVersion:r.schema_version,authorization:r.authorization,unresolved:[]};
    for (const g of groups) {
      const rows=db.prepare('SELECT * FROM '+g.table+' ORDER BY ordinal').all();
      if(rows.length!==g.count || rows.some((v,i)=>v.ordinal!==i)) fail(g.table+': coverage');
      result[g.group]=rows.map((row,i)=>fieldObject(row,g.fields,'/'+g.group+'/'+i));
    }
    for (const c of children) {
      const rows=db.prepare('SELECT * FROM '+c.table+' ORDER BY parent_ordinal,ordinal').all();
      if(rows.length!==c.count) fail(c.table+': coverage');
      result[c.group].forEach(row=>{row[c.key]=[];});
      for(const row of rows){
        const parent=result[c.group][row.parent_ordinal];
        if(!parent || row.ordinal!==parent[c.key].length) fail(c.table+': child order');
        parent[c.key].push(c.key==='allNodeReferences'?row.reference:fieldObject(row,c.fields,'/'+c.group+'/'+row.parent_ordinal+'/'+c.key+'/'+row.ordinal));
      }
    }
    const order=(v,path)=>{
      if(v===null || typeof v!=='object')return v;
      if(Array.isArray(v))return v.map((x,i)=>order(x,path+'/'+i));
      const list=keys.get(path);keys.delete(path);
      if(!list || list.length!==Object.keys(v).length)fail('object coverage: '+path);
      return Object.fromEntries(list.map(k=>{if(!Object.hasOwn(v,k))fail('unknown key: '+path+'/'+k);return [k,order(v[k],path+'/'+k)];}));
    };
    const document=order(result,'');
    validate(document,rootContract);
    if(keys.size || hash(JSON.stringify(document))!==FAMILY_ROLE_DOCUMENT_HASH)fail('ordered document hash');
    return document;
  } catch(error) {
    if(error.code==='E_FAMILY_ROLE_DOCUMENT')throw error;
    fail(error.message);
  }
}

/** One-shot explicit import of the pinned bytes. No existing tables are written. */
export function initializeFamilyRoleDocument(db,{schemaSql,sourceBytes,expectedSourceHash,actor,reason}={}) {
  if(!(sourceBytes instanceof Uint8Array))fail('source bytes');
  let document;
  try {document=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(sourceBytes));}
  catch(error){fail('source syntax: '+error.message);}
  validate(document,rootContract);
  if(expectedSourceHash!==FAMILY_ROLE_SOURCE_HASH || hash(sourceBytes)!==expectedSourceHash
    || hash(JSON.stringify(document))!==FAMILY_ROLE_DOCUMENT_HASH)fail('source bytes/hash');
  if(![actor,reason].every(v=>typeof v==='string'&&v.trim()))fail('actor/reason');
  if(typeof schemaSql!=='string'||!schemaSql.trim()||db.isTransaction)fail('explicit SQL/transaction');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    const key=db.prepare('INSERT INTO family_role_document_key VALUES (?,?,?)');
    const walk=(v,path)=>{
      if(v===null||typeof v!=='object')return;
      if(Array.isArray(v)){v.forEach((x,i)=>walk(x,path+'/'+i));return;}
      Object.entries(v).forEach(([k,x],i)=>{key.run(path,i,k);walk(x,path+'/'+k);});
    };
    walk(document,'');
    const scalar=v=>typeof v==='boolean'?Number(v):v??null;
    for(const g of groups){
      const insert=db.prepare('INSERT INTO '+g.table+' VALUES ('+Array(g.fields.length+1).fill('?').join(',')+')');
      document[g.group].forEach((r,i)=>insert.run(i,...g.fields.map(f=>scalar(at(r,f)))));
    }
    for(const c of children){
      const insert=db.prepare('INSERT INTO '+c.table+' VALUES ('+Array(c.fields.length+2).fill('?').join(',')+')');
      document[c.group].forEach((r,p)=>r[c.key].forEach((v,i)=>insert.run(p,i,...c.fields.map(f=>scalar(c.key==='allNodeReferences'?v:at(v,f))))));
    }
    db.prepare('INSERT INTO family_role_document_import VALUES (1,?,?,?,?,?,?)').run(expectedSourceHash,FAMILY_ROLE_DOCUMENT_HASH,document.schemaVersion,document.authorization,actor,reason);
    const actual=readFamilyRoleDocument(db,{expectedSourceHash});
    if(JSON.stringify(actual)!==JSON.stringify(document))fail('import parity');
    db.exec('COMMIT');return actual;
  } catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}
}
