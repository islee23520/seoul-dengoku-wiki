import { createHash } from 'node:crypto';

export const RAIL_SOURCE_HASHES = Object.freeze({
  "lore/places/rail-station-corrections.json": "d6b997fc4ee6849dce192afc0c3bc5e85725bfbd7d2573d6d7a936b0479d2d64",
  "lore/places/rail-station-identities.json": "80246952f3385e90da2df610cdceda19433f7dcb60d8f5653e6dbe4d0a609c9c",
  "lore/places/regional-station-bindings.json": "8c6347ee1e4dd63d59b8176b03183ddd55bd6f119913ccffa86ba264153f4d5f",
  "lore/places/regular-line-adjacency.json": "6b9e1bec6987875ed5f5e6b2df508d3716208628f1749b03f5b80cf1a2af9b7a",
  "lore/places/station-control-overrides.json": "31e6782338a6d3d03ac4e62a800cf5b0d878785c5f8050ee556975d4456e8915",
  "lore/places/connected-rail-stations.json": "c0f1e2fb5b24dfc0e64469c64c268dfd5a2ab3af4dc9c46925509fc4df68fd0d",
  "lore/places/gtx-project-connections.json": "4964f7f22eac9cf718d816f606ac133f857c074e76fc1e364764b6c5fe307594"
});
export const RAIL_DOCUMENT_HASHES = Object.freeze({
  "lore/places/rail-station-corrections.json": "8a49af94c1488e517df3d277640f895f762c23f503fdb589559bec126472315a",
  "lore/places/station-control-overrides.json": "c237a653af5e8206584e471660c0bbdd8d719218ec98294fb3fb81aff883f48d",
  "lore/places/gtx-project-connections.json": "bd9570eb9e8412512f96b03450a5335f783278732b67db3b1d02380c88334208",
  "lore/places/rail-station-identities.json": "2941acaceff58accd70f316c034b9baed609447e5ce13212d6b1677e487f0bb2",
  "lore/places/regional-station-bindings.json": "4b7514e1c2ede120949a29525189ca4aa7c47befed458b39ea94e515d1721f6f",
  "lore/places/regular-line-adjacency.json": "b7b096e3672bced5ddeffd04c987cf596b1c82ab4a1f9dcf5e2932bcd6234ca2",
  "lore/places/connected-rail-stations.json": "738c5b46beca6bf981a550e6f93becec370cde237590dbe5c02a056b18e34386"
});
const roots = {
  "lore/places/rail-station-corrections.json": "corrections_document",
  "lore/places/rail-station-identities.json": "identities_document",
  "lore/places/regional-station-bindings.json": "bindings_document",
  "lore/places/regular-line-adjacency.json": "adjacency_document",
  "lore/places/station-control-overrides.json": "control_document",
  "lore/places/connected-rail-stations.json": "connected_document",
  "lore/places/gtx-project-connections.json": "gtx_document"
};
// Domain values live only in named typed columns. Key rows carry presence/null/order, never values.
const domains = {
  "corrections_document": {
    "fields": {
      "schema": "text",
      "officialSource": "text"
    },
    "children": {
      "corrections": [
        "correction"
      ]
    },
    "required": [
      "schema",
      "officialSource",
      "corrections"
    ]
  },
  "correction": {
    "fields": {
      "name": "text",
      "stationCode": "text",
      "removedNamesakeCode": "text",
      "identitySource": "text",
      "east": "integer",
      "north": "integer"
    },
    "children": {
      "lineIds": [
        "correction_line"
      ]
    },
    "required": [
      "name",
      "east",
      "north",
      "stationCode",
      "lineIds"
    ]
  },
  "correction_line": {
    "fields": {
      "line_id": "text"
    },
    "children": {},
    "scalar": "line_id"
  },
  "identities_document": {
    "fields": {
      "schema": "text",
      "sourceUrl": "text",
      "sourceSha256": "text"
    },
    "children": {
      "groups": [
        "identity_group"
      ]
    },
    "required": [
      "schema",
      "sourceUrl",
      "sourceSha256",
      "groups"
    ]
  },
  "identity_group": {
    "fields": {
      "name": "text",
      "uid": "text"
    },
    "children": {
      "members": [
        "identity_member"
      ],
      "lineIds": [
        "identity_line"
      ]
    },
    "required": [
      "name",
      "uid",
      "members",
      "lineIds"
    ]
  },
  "identity_member": {
    "fields": {
      "east": "integer",
      "north": "integer"
    },
    "children": {},
    "required": [
      "east",
      "north"
    ]
  },
  "identity_line": {
    "fields": {
      "line_id": "text"
    },
    "children": {},
    "scalar": "line_id"
  },
  "bindings_document": {
    "fields": {
      "schema": "text",
      "sourceUrl": "text",
      "sourceSha256": "text"
    },
    "children": {
      "bindings": [
        "binding"
      ],
      "unresolved": [
        "unresolved"
      ]
    },
    "required": [
      "schema",
      "sourceUrl",
      "sourceSha256",
      "bindings",
      "unresolved"
    ]
  },
  "binding": {
    "fields": {
      "stationCode": "text",
      "interchangeUid": "text",
      "officialName": "text",
      "lineId": "text",
      "observedName": "text",
      "identitySource": "text",
      "identityBasis": "text",
      "coordinateSource": "text",
      "osmId": "text",
      "sharedWikidata": "text",
      "coordinateCheckUrl": "text",
      "east": "integer",
      "north": "integer"
    },
    "children": {},
    "required": [
      "stationCode",
      "interchangeUid",
      "officialName",
      "lineId",
      "observedName",
      "east",
      "north"
    ]
  },
  "unresolved": {
    "fields": {},
    "children": {},
    "empty": true
  },
  "adjacency_document": {
    "fields": {
      "schema": "text"
    },
    "children": {
      "source": "adjacency_source",
      "stationIdsByCode": "station_codes",
      "lines": [
        "regular_line"
      ]
    },
    "required": [
      "schema",
      "source",
      "stationIdsByCode",
      "lines"
    ]
  },
  "adjacency_source": {
    "fields": {
      "url": "text",
      "retrievedAt": "text",
      "sha256": "text",
      "scope": "text"
    },
    "children": {},
    "required": [
      "url",
      "retrievedAt",
      "sha256",
      "scope"
    ]
  },
  "station_codes": {
    "fields": {},
    "children": {},
    "map": true
  },
  "station_code": {
    "fields": {
      "station_code": "text",
      "station_id": "text"
    },
    "children": {}
  },
  "regular_line": {
    "fields": {
      "id": "text",
      "name": "text"
    },
    "children": {
      "paths": [
        "regular_path"
      ]
    },
    "required": [
      "id",
      "name",
      "paths"
    ]
  },
  "regular_path": {
    "fields": {},
    "children": {},
    "array": "regular_stop"
  },
  "regular_stop": {
    "fields": {
      "code": "text",
      "uid": "text",
      "name": "text"
    },
    "children": {},
    "required": [
      "code",
      "uid",
      "name"
    ]
  },
  "control_document": {
    "fields": {
      "schema": "text",
      "baseline": "text",
      "description": "text"
    },
    "children": {
      "overrides": [
        "control_override"
      ],
      "passageDecisions": [
        "passage_decision"
      ],
      "retiredPassageDecisions": [
        "retired_passage_decision"
      ]
    },
    "required": [
      "schema",
      "baseline",
      "description",
      "overrides",
      "passageDecisions",
      "retiredPassageDecisions"
    ]
  },
  "control_override": {
    "fields": {
      "id": "text",
      "stationId": "text",
      "status": "text",
      "primary": "text",
      "decision": "text",
      "regionalAuthority": "text",
      "stationManager": "text"
    },
    "children": {
      "polityIds": [
        "control_polity"
      ]
    },
    "required": [
      "id",
      "stationId",
      "status",
      "polityIds",
      "primary"
    ]
  },
  "control_polity": {
    "fields": {
      "polity_id": "text"
    },
    "children": {},
    "scalar": "polity_id"
  },
  "passage_decision": {
    "fields": {
      "segmentId": "text",
      "passage2126": "text",
      "decision": "text"
    },
    "children": {},
    "required": [
      "segmentId",
      "passage2126",
      "decision"
    ]
  },
  "retired_passage_decision": {
    "fields": {
      "segmentId": "text",
      "passage2126": "text",
      "decision": "text",
      "retirement": "text"
    },
    "children": {},
    "required": [
      "segmentId",
      "passage2126",
      "decision",
      "retirement"
    ]
  },
  "connected_document": {
    "fields": {
      "schema": "text"
    },
    "children": {
      "source": "connected_source",
      "stations": [
        "connected_station"
      ]
    },
    "required": [
      "schema",
      "source",
      "stations"
    ]
  },
  "connected_source": {
    "fields": {
      "url": "text",
      "sha256": "text",
      "license": "text",
      "scope": "text"
    },
    "children": {},
    "required": [
      "url",
      "sha256",
      "license",
      "scope"
    ]
  },
  "connected_station": {
    "fields": {
      "osmId": "text",
      "nameKo": "text",
      "nameEn": "text",
      "mode": "text",
      "lat": "number",
      "lon": "number"
    },
    "children": {},
    "required": [
      "osmId",
      "nameKo",
      "nameEn",
      "lat",
      "lon",
      "mode"
    ]
  },
  "gtx_document": {
    "fields": {
      "schema": "text",
      "asOf": "text"
    },
    "children": {
      "projects": [
        "gtx_project"
      ]
    },
    "required": [
      "schema",
      "asOf",
      "projects"
    ]
  },
  "gtx_project": {
    "fields": {
      "id": "text",
      "status": "text",
      "sourceUrl": "text",
      "routeSourceUrl": "text",
      "statusAsOf": "text",
      "endpointKind": "text",
      "geometryKind": "text",
      "diagramUrl": "text",
      "statusSourceUrl": "text",
      "sourceUpdatedAt": "text",
      "sourceYear": "integer",
      "stationLocationsFinal": "boolean",
      "surveyedTrackGeometry": "boolean",
      "opening2126Control": "null",
      "opening2126Passage": "null"
    },
    "children": {
      "paths": [
        "gtx_path"
      ],
      "pendingStations": [
        "gtx_pending_station"
      ]
    },
    "required": [
      "id",
      "status",
      "sourceUrl",
      "paths",
      "geometryKind",
      "surveyedTrackGeometry",
      "opening2126Control",
      "opening2126Passage"
    ]
  },
  "gtx_path": {
    "fields": {},
    "children": {},
    "array": "gtx_station"
  },
  "gtx_station": {
    "fields": {
      "station_name": "text"
    },
    "children": {},
    "scalar": "station_name"
  },
  "gtx_pending_station": {
    "fields": {
      "station_name": "text"
    },
    "children": {},
    "scalar": "station_name"
  }
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_RAIL_SOURCE_DOCUMENT: ' + detail), { code: 'E_RAIL_SOURCE_DOCUMENT' }); };
const table = domain => 'rail_source_' + domain;
const object = v => v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
const childPath = (path,key) => path + '/' + String(key).replaceAll('~','~0').replaceAll('/','~1');
function validate(value, domain) {
  const s = domains[domain];
  if (s.empty) fail(domain + ': pinned empty list cannot contain records');
  if (s.scalar) { if (typeof value !== 'string') fail(domain + ': text'); return; }
  if (s.array) { if (!Array.isArray(value)) fail(domain + ': array'); value.forEach(v => validate(v,s.array)); return; }
  if (!object(value)) fail(domain + ': object');
  if (s.map) { for (const [code,id] of Object.entries(value)) if (!/^[0-9A-Za-z]+$/.test(code) || typeof id !== 'string') fail('station code mapping'); return; }
  const allowed = [...Object.keys(s.fields),...Object.keys(s.children)];
  if (Object.keys(value).some(k => !allowed.includes(k)) || s.required.some(k => !Object.hasOwn(value,k))) fail(domain + ': unknown/missing field');
  for (const [k,v] of Object.entries(value)) {
    if (Object.hasOwn(s.fields,k)) {
      const t = s.fields[k];
      if (!(t === 'null' ? v === null : t === 'text' ? typeof v === 'string' : t === 'boolean' ? typeof v === 'boolean' : t === 'integer' ? Number.isSafeInteger(v) : typeof v === 'number' && Number.isFinite(v))) fail(domain + '.' + k + ': type');
    } else {
      const c = s.children[k];
      if (Array.isArray(c)) { if (!Array.isArray(v)) fail(domain + '.' + k + ': list'); v.forEach(x => validate(x,c[0])); }
      else validate(v,c);
    }
  }
}
function insert(db,name,row) {
  const columns = Object.keys(row);
  db.prepare('INSERT INTO ' + name + ' (' + columns.map(k => '"' + k + '"').join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')').run(...Object.values(row));
}

export function initializeRailSourceDocuments(db, { schemaSql, sources, actor, reason } = {}) {
  if (!object(sources) || Object.keys(sources).length !== 7 || Object.keys(sources).some(p => !Object.hasOwn(roots,p))) fail('exact seven source paths required');
  if (typeof schemaSql !== 'string' || !schemaSql.trim() || ![actor,reason].every(v => typeof v === 'string' && v.trim())) fail('schema/actor/reason');
  if (db.isTransaction) fail('active transaction');
  const documents = {};
  for (const p of Object.keys(roots)) {
    const source = sources[p];
    if (!object(source) || Object.keys(source).length !== 2 || !(source.bytes instanceof Uint8Array) || source.expectedSourceHash !== RAIL_SOURCE_HASHES[p]) fail(p + ': source contract/hash');
    const value = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(source.bytes));
    validate(value,roots[p]);
    if (hash(source.bytes) !== RAIL_SOURCE_HASHES[p] || hash(JSON.stringify(value)) !== RAIL_DOCUMENT_HASHES[p]) fail(p + ': fixed bytes/document hash');
    documents[p] = value;
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    for (const p of Object.keys(roots)) {
      insert(db,'rail_source_import',{logical_path:p,source_sha256:RAIL_SOURCE_HASHES[p],document_sha256:RAIL_DOCUMENT_HASHES[p],actor,reason});
      const put = (value,domain,path,parent,ordinal) => {
        const s = domains[domain], row = {logical_path:p,object_path:path,parent_path:parent,ordinal};
        for (const [k,t] of Object.entries(s.fields)) row[k] = s.scalar ? value : value[k] === undefined ? null : t === 'boolean' ? Number(value[k]) : value[k];
        insert(db,table(domain),row);
        if (s.scalar) return;
        if (s.array) { value.forEach((v,i) => put(v,s.array,childPath(path,i),path,i)); return; }
        if (s.map) {
          Object.entries(value).forEach(([code,id],i) => insert(db,table('station_code'),{logical_path:p,object_path:childPath(path,code),parent_path:path,ordinal:i,station_code:code,station_id:id})); return;
        }
        Object.entries(value).forEach(([key,v],i) => insert(db,'rail_source_key',{logical_path:p,object_path:path,ordinal:i,key,is_null:Number(v === null)}));
        for (const [k,c] of Object.entries(s.children)) {
          if (!Object.hasOwn(value,k)) continue;
          const cp = childPath(path,k);
          if (Array.isArray(c)) value[k].forEach((v,i) => put(v,c[0],childPath(cp,i),cp,i));
          else put(value[k],c,cp,path,0);
        }
      };
      put(documents[p],roots[p],'','',0);
      if (JSON.stringify(readRailSourceDocument(db,{logicalPath:p,expectedSourceHash:RAIL_SOURCE_HASHES[p]})) !== JSON.stringify(documents[p])) fail('transaction parity');
    }
    db.exec('COMMIT');
    return documents;
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

/** Runtime authority: SELECT-only typed reconstruction; no FS, JSON.parse, or archive. */
export function readRailSourceDocument(db, { logicalPath, expectedSourceHash } = {}) {
  try {
    if (!Object.hasOwn(roots,logicalPath) || expectedSourceHash !== RAIL_SOURCE_HASHES[logicalPath]) fail('explicit fixed path/hash required');
    const rows = name => db.prepare('SELECT * FROM ' + name + ' WHERE logical_path=? ORDER BY object_path,ordinal').all(logicalPath);
    const receipts = db.prepare('SELECT * FROM rail_source_import WHERE logical_path=?').all(logicalPath), r = receipts[0];
    if (receipts.length !== 1 || r.source_sha256 !== expectedSourceHash || r.document_sha256 !== RAIL_DOCUMENT_HASHES[logicalPath] || !r.actor.trim() || !r.reason.trim()) fail('receipt');
    const remaining = Object.fromEntries(Object.keys(domains).map(n => [n,new Map(rows(table(n)).map(r => [r.object_path,r]))]));
    const keys = new Map();
    for (const r of rows('rail_source_key')) { if (!keys.has(r.object_path)) keys.set(r.object_path,[]); keys.get(r.object_path).push(r); }
    const list = (domain,parent) => [...remaining[domain].values()].filter(r => r.parent_path === parent).sort((a,b) => a.ordinal-b.ordinal);
    const get = (domain,path,parent,ordinal) => {
      const s = domains[domain], row = remaining[domain].get(path);
      if (!row || row.parent_path !== parent || row.ordinal !== ordinal) fail(domain + ': missing/order/parent');
      remaining[domain].delete(path);
      if (s.scalar) return row[s.scalar];
      if (s.array) return list(s.array,path).map((_,i) => get(s.array,childPath(path,i),path,i));
      if (s.map) return Object.fromEntries(list('station_code',path).map((r,i) => {
        if (r.ordinal !== i || r.object_path !== childPath(path,r.station_code)) fail('station code order/path');
        remaining.station_code.delete(r.object_path); return [r.station_code,r.station_id];
      }));
      const group = keys.get(path);
      if (!group) fail(domain + ': missing keys');
      keys.delete(path); group.sort((a,b) => a.ordinal-b.ordinal);
      const value = {};
      for (const [i,k] of group.entries()) {
        if (k.ordinal !== i || ![0,1].includes(k.is_null) || Object.hasOwn(value,k.key)) fail(domain + ': key order/null');
        if (Object.hasOwn(s.fields,k.key)) {
          const v = row[k.key], t = s.fields[k.key];
          if (Number(v === null) !== k.is_null || (t === 'boolean' && ![0,1].includes(v))) fail(domain + ': scalar null/type');
          value[k.key] = t === 'boolean' ? Boolean(v) : v;
        } else if (Object.hasOwn(s.children,k.key)) {
          if (k.is_null) fail(domain + ': unexpected null child');
          const c = s.children[k.key], cp = childPath(path,k.key);
          value[k.key] = Array.isArray(c) ? list(c[0],cp).map((_,j) => get(c[0],childPath(cp,j),cp,j)) : get(c,cp,path,0);
        } else fail(domain + ': unknown field');
      }
      for (const k of Object.keys(s.fields)) if (!Object.hasOwn(value,k) && row[k] !== null) fail(domain + ': absent field value');
      return value;
    };
    const result = get(roots[logicalPath],'','',0);
    if (keys.size || Object.values(remaining).some(m => m.size)) fail('unconsumed rows');
    validate(result,roots[logicalPath]);
    if (hash(JSON.stringify(result)) !== RAIL_DOCUMENT_HASHES[logicalPath]) fail('ordered complete document hash');
    return result;
  } catch (error) { if (error.code === 'E_RAIL_SOURCE_DOCUMENT') throw error; fail(error.message); }
}
