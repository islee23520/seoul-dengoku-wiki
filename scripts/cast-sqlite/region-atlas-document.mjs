import { createHash } from 'node:crypto';

// Historical bytes are preserved; this module grants no current map admission.
const PREFIX = 'window.SEOUL_REGION_ATLAS=';
const SUFFIX = ';\n';
const P = 'region_atlas_document_';
const specs = {
  "document": {
    "shapes": [
      [
        "schema",
        "as_of",
        "fictional_epoch",
        "source_selection",
        "districts",
        "coverage",
        "regions",
        "sites",
        "map_note",
        "attribution"
      ]
    ],
    "fields": {
      "schema": "string",
      "as_of": "string",
      "map_note": "string",
      "attribution": "string"
    },
    "children": {
      "fictional_epoch": {
        "kind": "object",
        "domain": "epoch"
      },
      "source_selection": {
        "kind": "object",
        "domain": "selection"
      },
      "districts": {
        "kind": "array",
        "domain": "district"
      },
      "coverage": {
        "kind": "object",
        "domain": "coverage"
      },
      "regions": {
        "kind": "array",
        "domain": "region"
      },
      "sites": {
        "kind": "array",
        "domain": "site"
      }
    }
  },
  "epoch": {
    "shapes": [
      [
        "absolute_date",
        "id",
        "label",
        "source"
      ]
    ],
    "fields": {
      "absolute_date": "null",
      "id": "string",
      "label": "string",
      "source": "string"
    },
    "children": {}
  },
  "selection": {
    "shapes": [
      [
        "as_of",
        "build_inputs",
        "comparison_boundary",
        "decision_kind",
        "fictional_epoch",
        "osm",
        "reason",
        "selected_boundary",
        "terrain"
      ]
    ],
    "fields": {
      "as_of": "string",
      "decision_kind": "string",
      "reason": "string"
    },
    "children": {
      "build_inputs": {
        "kind": "object",
        "domain": "build_inputs"
      },
      "comparison_boundary": {
        "kind": "object",
        "domain": "comparison_boundary"
      },
      "fictional_epoch": {
        "kind": "object",
        "domain": "selection_epoch"
      },
      "osm": {
        "kind": "object",
        "domain": "osm"
      },
      "selected_boundary": {
        "kind": "object",
        "domain": "selected_boundary"
      },
      "terrain": {
        "kind": "object",
        "domain": "selection_terrain"
      }
    }
  },
  "build_inputs": {
    "shapes": [
      [
        "boundary",
        "selection",
        "selection_sha256",
        "source_root"
      ]
    ],
    "fields": {
      "boundary": "string",
      "selection": "string",
      "selection_sha256": "string",
      "source_root": "string"
    },
    "children": {}
  },
  "comparison_boundary": {
    "shapes": [
      [
        "current_boundary",
        "effective_year",
        "path",
        "policy",
        "sha256",
        "source_id",
        "source_root"
      ]
    ],
    "fields": {
      "current_boundary": "boolean",
      "effective_year": "number",
      "path": "string",
      "policy": "string",
      "sha256": "string",
      "source_id": "string",
      "source_root": "string"
    },
    "children": {}
  },
  "selection_epoch": {
    "shapes": [
      [
        "absolute_date",
        "id",
        "label",
        "source"
      ]
    ],
    "fields": {
      "absolute_date": "null",
      "id": "string",
      "label": "string",
      "source": "string"
    },
    "children": {}
  },
  "osm": {
    "shapes": [
      [
        "acquired_at",
        "complete_official_roster",
        "modified_at",
        "path",
        "policy",
        "sha256",
        "snapshot_at",
        "snapshot_basis"
      ]
    ],
    "fields": {
      "acquired_at": "string",
      "complete_official_roster": "boolean",
      "modified_at": "string",
      "path": "string",
      "policy": "string",
      "sha256": "string",
      "snapshot_at": "string",
      "snapshot_basis": "string"
    },
    "children": {}
  },
  "selected_boundary": {
    "shapes": [
      [
        "attribution",
        "authority",
        "cleanup_policy",
        "coverage_tolerance_m2",
        "filter",
        "license",
        "measurement_crs",
        "overlap_excess_m2",
        "path",
        "precision_policy",
        "publication_commit_date",
        "retrieved_on",
        "selected_union_area_m2",
        "sha256",
        "source_crs",
        "source_districts",
        "source_effective_date",
        "source_id",
        "source_regions",
        "source_url"
      ]
    ],
    "fields": {
      "attribution": "string",
      "authority": "string",
      "cleanup_policy": "string",
      "coverage_tolerance_m2": "number",
      "filter": "string",
      "license": "string",
      "measurement_crs": "string",
      "overlap_excess_m2": "number",
      "path": "string",
      "precision_policy": "string",
      "publication_commit_date": "string",
      "retrieved_on": "string",
      "selected_union_area_m2": "number",
      "sha256": "string",
      "source_crs": "string",
      "source_districts": "number",
      "source_effective_date": "string",
      "source_id": "string",
      "source_regions": "number",
      "source_url": "string"
    },
    "children": {}
  },
  "selection_terrain": {
    "shapes": [
      [
        "observation_date",
        "observation_date_reason",
        "policy",
        "source_object_modified_month",
        "source_object_modified_precision"
      ]
    ],
    "fields": {
      "observation_date": "null",
      "observation_date_reason": "string",
      "policy": "string",
      "source_object_modified_month": "string",
      "source_object_modified_precision": "string"
    },
    "children": {}
  },
  "district": {
    "shapes": [
      [
        "id",
        "name",
        "region_ids"
      ]
    ],
    "fields": {
      "id": "string",
      "name": "string"
    },
    "children": {
      "region_ids": {
        "kind": "values",
        "domain": "district_region_ids"
      }
    }
  },
  "coverage": {
    "shapes": [
      [
        "region_count",
        "district_count",
        "selected_union_area_m2",
        "gap_m2",
        "overlap_m2",
        "candidate_status_counts",
        "regions_without_stations",
        "official_real_world_completeness"
      ]
    ],
    "fields": {
      "region_count": "number",
      "district_count": "number",
      "selected_union_area_m2": "number",
      "gap_m2": "number",
      "overlap_m2": "number",
      "regions_without_stations": "number",
      "official_real_world_completeness": "string"
    },
    "children": {
      "candidate_status_counts": {
        "kind": "object",
        "domain": "candidate_status"
      }
    }
  },
  "candidate_status": {
    "shapes": [
      [
        "assigned",
        "outside",
        "quarantine"
      ]
    ],
    "fields": {
      "assigned": "number",
      "outside": "number",
      "quarantine": "number"
    },
    "children": {}
  },
  "region": {
    "shapes": [
      [
        "id",
        "name",
        "district_id",
        "district_name",
        "area_m2",
        "profile",
        "content",
        "station_ids",
        "facility_ids",
        "shared_boundary_neighbors",
        "map_geometry"
      ]
    ],
    "fields": {
      "id": "string",
      "name": "string",
      "district_id": "string",
      "district_name": "string",
      "area_m2": "number"
    },
    "children": {
      "profile": {
        "kind": "object",
        "domain": "profile"
      },
      "content": {
        "kind": "object",
        "domain": "content"
      },
      "station_ids": {
        "kind": "values",
        "domain": "region_station_ids"
      },
      "facility_ids": {
        "kind": "values",
        "domain": "region_facility_ids"
      },
      "shared_boundary_neighbors": {
        "kind": "array",
        "domain": "neighbor"
      },
      "map_geometry": {
        "kind": "object",
        "domain": "polygon"
      }
    }
  },
  "profile": {
    "shapes": [
      [
        "anchor_scope",
        "anchors",
        "candidate_counts",
        "landuse",
        "terrain"
      ]
    ],
    "fields": {
      "anchor_scope": "string"
    },
    "children": {
      "anchors": {
        "kind": "array",
        "domain": "anchor"
      },
      "candidate_counts": {
        "kind": "object",
        "domain": "candidate_counts"
      },
      "landuse": {
        "kind": "array",
        "domain": "landuse"
      },
      "terrain": {
        "kind": "object",
        "domain": "terrain"
      }
    }
  },
  "anchor": {
    "shapes": [
      [
        "id",
        "kind",
        "name",
        "relation",
        "source_object_id",
        "source_ref",
        "tags"
      ]
    ],
    "fields": {
      "id": "string",
      "kind": "string",
      "name": "string",
      "relation": "string",
      "source_object_id": "string",
      "source_ref": "string"
    },
    "children": {
      "tags": {
        "kind": "tags",
        "domain": "anchor_tag"
      }
    }
  },
  "candidate_counts": {
    "shapes": [
      [
        "access",
        "all_candidates",
        "building_context",
        "facility",
        "landscape",
        "other_context",
        "road_context"
      ],
      [
        "access",
        "all_candidates",
        "building_context",
        "facility",
        "landscape",
        "other_context",
        "road_context",
        "subway_station"
      ],
      [
        "access",
        "all_candidates",
        "building_context",
        "facility",
        "landscape",
        "other_context",
        "rail_station",
        "road_context"
      ],
      [
        "access",
        "all_candidates",
        "building_context",
        "facility",
        "landscape",
        "other_context",
        "rail_station",
        "road_context",
        "subway_station"
      ]
    ],
    "fields": {
      "access": "number",
      "all_candidates": "number",
      "building_context": "number",
      "facility": "number",
      "landscape": "number",
      "other_context": "number",
      "road_context": "number",
      "subway_station": "number",
      "rail_station": "number"
    },
    "children": {}
  },
  "landuse": {
    "shapes": [
      [
        "object_count",
        "tag"
      ]
    ],
    "fields": {
      "object_count": "number",
      "tag": "string"
    },
    "children": {}
  },
  "terrain": {
    "shapes": [
      [
        "max_m",
        "mean_m",
        "method",
        "min_m",
        "observation_date",
        "relief_m",
        "sample_count",
        "source_object_modified_month",
        "source_refs"
      ]
    ],
    "fields": {
      "max_m": "number",
      "mean_m": "number",
      "method": "string",
      "min_m": "number",
      "observation_date": "null",
      "relief_m": "number",
      "sample_count": "number",
      "source_object_modified_month": "string"
    },
    "children": {
      "source_refs": {
        "kind": "values",
        "domain": "terrain_source_refs"
      }
    }
  },
  "content": {
    "shapes": [
      [
        "source_kind",
        "fictional_epoch",
        "title",
        "summary",
        "anchor_refs",
        "canon_refs",
        "polity_contexts",
        "inhabitants",
        "livelihood",
        "production",
        "shortages",
        "hazard",
        "opening_state",
        "connections",
        "action",
        "uncertainty",
        "buildings",
        "territory",
        "core_station"
      ],
      [
        "title",
        "summary",
        "anchor_refs",
        "canon_refs",
        "polity_contexts",
        "inhabitants",
        "livelihood",
        "production",
        "shortages",
        "hazard",
        "opening_state",
        "connections",
        "action",
        "uncertainty",
        "source_kind",
        "fictional_epoch",
        "buildings",
        "territory",
        "core_station"
      ],
      [
        "source_kind",
        "fictional_epoch",
        "canon_refs",
        "polity_contexts",
        "title",
        "summary",
        "anchor_refs",
        "inhabitants",
        "livelihood",
        "production",
        "shortages",
        "hazard",
        "opening_state",
        "connections",
        "action",
        "uncertainty",
        "buildings",
        "territory",
        "core_station"
      ]
    ],
    "fields": {
      "source_kind": "string",
      "fictional_epoch": "string",
      "title": "string",
      "summary": "string",
      "livelihood": "string",
      "opening_state": "string",
      "connections": "string",
      "uncertainty": "string",
      "core_station": "boolean"
    },
    "children": {
      "anchor_refs": {
        "kind": "values",
        "domain": "content_anchor_refs"
      },
      "canon_refs": {
        "kind": "values",
        "domain": "content_canon_refs"
      },
      "polity_contexts": {
        "kind": "values",
        "domain": "content_polity_contexts"
      },
      "inhabitants": {
        "kind": "values",
        "domain": "content_inhabitants"
      },
      "production": {
        "kind": "object",
        "domain": "production"
      },
      "shortages": {
        "kind": "values",
        "domain": "content_shortages"
      },
      "hazard": {
        "kind": "object",
        "domain": "hazard"
      },
      "action": {
        "kind": "object",
        "domain": "action"
      },
      "buildings": {
        "kind": "array",
        "domain": "building"
      },
      "territory": {
        "kind": "object",
        "domain": "territory"
      }
    }
  },
  "production": {
    "shapes": [
      [
        "outputs",
        "requires"
      ]
    ],
    "fields": {},
    "children": {
      "outputs": {
        "kind": "values",
        "domain": "production_outputs"
      },
      "requires": {
        "kind": "values",
        "domain": "production_requires"
      }
    }
  },
  "hazard": {
    "shapes": [
      [
        "kind",
        "description"
      ]
    ],
    "fields": {
      "kind": "string",
      "description": "string"
    },
    "children": {}
  },
  "action": {
    "shapes": [
      [
        "id",
        "label",
        "target_ref",
        "costs",
        "outcomes",
        "tradeoff"
      ]
    ],
    "fields": {
      "id": "string",
      "label": "string",
      "target_ref": "string",
      "tradeoff": "string"
    },
    "children": {
      "costs": {
        "kind": "array",
        "domain": "cost"
      },
      "outcomes": {
        "kind": "array",
        "domain": "outcome"
      }
    }
  },
  "cost": {
    "shapes": [
      [
        "resource",
        "amount",
        "unit"
      ]
    ],
    "fields": {
      "resource": "string",
      "amount": "number",
      "unit": "string"
    },
    "children": {}
  },
  "outcome": {
    "shapes": [
      [
        "kind",
        "effect"
      ]
    ],
    "fields": {
      "kind": "string",
      "effect": "string"
    },
    "children": {}
  },
  "building": {
    "shapes": [
      [
        "anchor_ref",
        "name",
        "observed_use",
        "river",
        "opening_use",
        "how",
        "role",
        "floors"
      ],
      [
        "anchor_ref",
        "name",
        "observed_use",
        "river",
        "opening_use",
        "how",
        "role",
        "floors",
        "observed_levels",
        "observed_levels_source"
      ]
    ],
    "fields": {
      "anchor_ref": "string",
      "name": "string",
      "observed_use": "string",
      "river": "string",
      "opening_use": "string",
      "how": "string",
      "role": "string",
      "observed_levels": "number",
      "observed_levels_source": "string"
    },
    "children": {
      "floors": {
        "kind": "array",
        "domain": "floor"
      }
    }
  },
  "floor": {
    "shapes": [
      [
        "level",
        "label",
        "state",
        "contents",
        "condition"
      ]
    ],
    "fields": {
      "level": "level",
      "label": "string",
      "state": "string",
      "contents": "string",
      "condition": "string"
    },
    "children": {}
  },
  "territory": {
    "shapes": [
      [
        "status",
        "holders"
      ]
    ],
    "fields": {
      "status": "string"
    },
    "children": {
      "holders": {
        "kind": "array",
        "domain": "holder"
      }
    }
  },
  "holder": {
    "shapes": [
      [
        "polity",
        "control"
      ]
    ],
    "fields": {
      "polity": "string",
      "control": "number"
    },
    "children": {}
  },
  "neighbor": {
    "shapes": [
      [
        "region_id",
        "shared_boundary_m",
        "travel_edge"
      ]
    ],
    "fields": {
      "region_id": "string",
      "shared_boundary_m": "number",
      "travel_edge": "boolean"
    },
    "children": {}
  },
  "polygon": {
    "shapes": [
      [
        "type",
        "coordinates"
      ]
    ],
    "fields": {
      "type": "string"
    },
    "children": {
      "coordinates": {
        "kind": "geometry",
        "domain": "ring"
      }
    }
  },
  "site": {
    "shapes": [
      [
        "id",
        "name",
        "named",
        "kinds",
        "tags",
        "region_ids",
        "primary_region_id"
      ]
    ],
    "fields": {
      "id": "string",
      "name": "string",
      "named": "boolean",
      "primary_region_id": "string"
    },
    "children": {
      "kinds": {
        "kind": "values",
        "domain": "site_kinds"
      },
      "tags": {
        "kind": "tags",
        "domain": "site_tag"
      },
      "region_ids": {
        "kind": "values",
        "domain": "site_region_ids"
      }
    }
  }
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw Object.assign(new Error('E_REGION_ATLAS_DOCUMENT: ' + message), {code:'E_REGION_ATLAS_DOCUMENT'}); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const decimal = value => typeof value === 'string' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value) && Number.isFinite(Number(value));
function shape(value, name) {
  const s = specs[name];
  if (!object(value)) fail(name + ': object');
  const keys = Object.keys(value);
  const index = s.shapes.findIndex(ks => ks.length === keys.length && ks.every((k,i) => k === keys[i]));
  if (index < 0) fail(name + ': unknown/missing/unordered fields');
  for (const [k,t] of Object.entries(s.fields)) {
    if (!Object.hasOwn(value,k)) continue;
    const v=value[k];
    if (t === 'null' ? v !== null : t === 'level' ? !['number','string'].includes(typeof v) : typeof v !== t) fail(name + '.' + k + ': type');
    if (typeof v === 'number' && !Number.isFinite(v)) fail(name + '.' + k + ': finite');
  }
  return index;
}
function tableNames() {
  const names = Object.keys(specs);
  for (const s of Object.values(specs)) for (const c of Object.values(s.children)) if (['values','tags'].includes(c.kind)) names.push(c.domain);
  return [...names,'ring','point'];
}
function options(input, keys) {
  if (!object(input) || Object.keys(input).length !== keys.length || keys.some(k=>!Object.hasOwn(input,k))) fail('explicit exact options');
}
/** One-shot import. JSON is parsed, never evaluated; numeric spellings go into named decimal columns. */
export function initializeRegionAtlasDocument(db, input = {}) {
  options(input,['schemaSql','sourceBytes','actor','reason']);
  const {schemaSql,sourceBytes,actor,reason}=input;
  if (![schemaSql,actor,reason].every(v=>typeof v==='string' && v.trim()) || !(sourceBytes instanceof Uint8Array)) fail('schema/bytes/provenance');
  if (db.isTransaction) fail('active transaction');
  const sourceHash = hash(sourceBytes);
  const source = new TextDecoder('utf-8',{fatal:true}).decode(sourceBytes);
  if (!source.startsWith(PREFIX) || !source.endsWith(SUFFIX)) fail('fixed assignment wrapper');
  const body=source.slice(PREFIX.length,-SUFFIX.length), data=JSON.parse(body);
  const objectHash = hash(JSON.stringify(data));
  // Lex only JSON string and number tokens; quoted digits never become numeric spellings.
  const numbers = [];
  for (const match of body.matchAll(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g)) if (match[0][0] !== '"') numbers.push(match[0]);
  let numberIndex=0;
  const spellings=new WeakMap();
  function visit(v) {
    if (!v || typeof v!=='object') return;
    const fields={};
    for (const [k,x] of Object.entries(v)) {
      if (typeof x==='number') {const spelling=numbers[numberIndex++];if(!decimal(spelling)||!Object.is(Number(spelling),x))fail('numeric token parity');fields[k]=spelling;}
      else visit(x);
    }
    spellings.set(v,fields);
  }
  visit(data);
  if(numberIndex!==numbers.length)fail('numeric token coverage');
  const statements=new Map(), ids=new Map();
  function insert(name,row) {
    const keys=Object.keys(row), key=name+':'+keys.join(',');
    let stmt=statements.get(key);
    if(!stmt){stmt=db.prepare('INSERT INTO '+P+name+' ('+keys.map(k=>'"'+k+'"').join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')');statements.set(key,stmt);}
    stmt.run(...Object.values(row));
  }
  function put(value,name,parent,ordinal) {
    const s=specs[name], rowId=(ids.get(name)??0)+1;ids.set(name,rowId);
    const row={row_id:rowId,parent_id:parent,ordinal,shape:shape(value,name)};
    for(const [k,t]of Object.entries(s.fields)) {
      const v=value[k];
      if(t==='level'){row[k+'_number']=typeof v==='number'?spellings.get(value)[k]:null;row[k+'_text']=typeof v==='string'?v:null;}
      else row[k]=v===undefined||v===null?null:t==='number'?spellings.get(value)[k]:t==='boolean'?Number(v):v;
    }
    insert(name,row);
    for(const [k,c]of Object.entries(s.children)) {
      const v=value[k];
      if(c.kind==='object')put(v,c.domain,rowId,0);
      else if(c.kind==='array'){if(!Array.isArray(v))fail(k+': array');v.forEach((x,i)=>put(x,c.domain,rowId,i));}
      else if(c.kind==='values'){if(!Array.isArray(v)||v.some(x=>typeof x!=='string'))fail(k+': text list');v.forEach((x,i)=>insert(c.domain,{parent_id:rowId,ordinal:i,value:x}));}
      else if(c.kind==='tags'){if(!object(v)||Object.values(v).some(x=>typeof x!=='string'))fail('OSM tags');Object.entries(v).forEach(([key,x],i)=>insert(c.domain,{parent_id:rowId,ordinal:i,key,value:x}));}
      else {
        if(value.type!=='Polygon'||!Array.isArray(v))fail('Polygon required');
        v.forEach((ring,i)=>{const ringId=(ids.get('ring')??0)+1;ids.set('ring',ringId);insert('ring',{row_id:ringId,parent_id:rowId,ordinal:i});
          if(!Array.isArray(ring))fail('ring');ring.forEach((point,j)=>{if(!Array.isArray(point)||point.length!==2||point.some(x=>typeof x!=='number'))fail('two-dimensional point');insert('point',{parent_id:ringId,ordinal:j,x_decimal:spellings.get(point)[0],y_decimal:spellings.get(point)[1]});});});
      }
    }
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    insert('receipt',{id:1,source_sha256:sourceHash,object_sha256:objectHash,actor,reason});
    put(data,'document',0,0);
    if(readRegionAtlasDocument(db)!==source)fail('transaction byte parity');
    db.exec('COMMIT');
    return Object.fromEntries(tableNames().map(n=>[n,db.prepare('SELECT count(*) AS n FROM '+P+n).get().n]));
  }catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}
}
function reconstruct(db,input) {
  if (input !== undefined && (!object(input) || Object.keys(input).length)) fail('explicit exact options');
  const receipts=db.prepare('SELECT * FROM '+P+'receipt').all(),r=receipts[0];
  if(receipts.length!==1||r.id!==1||!/^[0-9a-f]{64}$/.test(r.source_sha256??'')||!/^[0-9a-f]{64}$/.test(r.object_sha256??'')||typeof r.actor!=='string'||!r.actor.trim()||typeof r.reason!=='string'||!r.reason.trim())fail('receipt');
  const groups=new Map();
  for(const name of tableNames()) {
    const parents=new Map();
    for(const row of db.prepare('SELECT * FROM '+P+name+' ORDER BY parent_id,ordinal').all()) {
      let list=parents.get(row.parent_id);if(!list){list=[];parents.set(row.parent_id,list);}
      if(row.ordinal!==list.length)fail(name+': ordinal gap');list.push(row);
    }
    groups.set(name,parents);
  }
  const take=(name,parent)=>{const rows=groups.get(name).get(parent)??[];groups.get(name).delete(parent);return rows;};
  const ids = new Map();
  const identity = (name, row) => { const next = (ids.get(name) ?? 0) + 1; ids.set(name,next); if(row.row_id !== next) fail(name + ': row identity'); };
  function get(name,row) {
    identity(name,row);
    const s=specs[name],keys=s.shapes[row.shape];if(!keys)fail(name+': shape');
    const value={},parts=[];
    for(const [k,t]of Object.entries(s.fields))if(!keys.includes(k)&& (t==='level'?row[k+'_number']!==null||row[k+'_text']!==null:row[k]!==null))fail(name+': hidden field');
    for(const k of keys) {
      let v,text;
      if(Object.hasOwn(s.fields,k)) {
        const t=s.fields[k],raw=t==='level'?row[k+'_number']??row[k+'_text']:row[k];
        if(t==='level' && row[k+'_number']!==null && row[k+'_text']!==null) fail('ambiguous floor level');
        if(t==='number'||t==='level'&&row[k+'_number']!==null){if(!decimal(raw))fail(name+'.'+k+': decimal');v=Number(raw);text=raw;}
        else if(t==='boolean'){if(![0,1].includes(raw))fail('boolean');v=Boolean(raw);text=String(v);}
        else {v=raw;text=JSON.stringify(v);}
      }else {
        const c=s.children[k],rows=take(c.domain,row.row_id);
        if(c.kind==='object'){if(rows.length!==1)fail(c.domain+': singleton');({value:v,text}=get(c.domain,rows[0]));}
        else if(c.kind==='array'){const children=rows.map(x=>get(c.domain,x));v=children.map(x=>x.value);text='['+children.map(x=>x.text).join(',')+']';}
        else if(c.kind==='values'){v=rows.map(x=>x.value);if(v.some(x=>typeof x!=='string'))fail('text list');text=JSON.stringify(v);}
        else if(c.kind==='tags'){v={};for(const x of rows){if(typeof x.key!=='string'||typeof x.value!=='string'||Object.hasOwn(v,x.key))fail('tag');Object.defineProperty(v,x.key,{value:x.value,enumerable:true,configurable:true,writable:true});}text=JSON.stringify(v);}
        else {v=[];const rings=[];for(const ring of rows){identity('ring',ring);const points=take('point',ring.row_id),coords=[],texts=[];for(const p of points){if(!decimal(p.x_decimal)||!decimal(p.y_decimal))fail('point decimal');coords.push([Number(p.x_decimal),Number(p.y_decimal)]);texts.push('['+p.x_decimal+','+p.y_decimal+']');}v.push(coords);rings.push('['+texts.join(',')+']');}text='['+rings.join(',')+']';}
      }
      value[k]=v;parts.push(JSON.stringify(k)+':'+text);
    }
    shape(value,name);
    if(name==='polygon'&&value.type!=='Polygon')fail('geometry type');
    return {value,text:'{'+parts.join(',')+'}'};
  }
  const roots=take('document',0);if(roots.length!==1)fail('document root');
  const result=get('document',roots[0]);
  if([...groups.values()].some(g=>g.size))fail('extra/unconsumed rows');
  if(hash(JSON.stringify(result.value))!==r.object_sha256)fail('stored ordered object digest');
  const source=PREFIX+result.text+SUFFIX;
  if(hash(source)!==r.source_sha256)fail('stored complete byte digest');
  return {data:result.value,source};
}
/** SELECT-only, no filesystem or JSON parser; verifies stored rows against the stored receipt digests. */
export function readRegionAtlasDocument(db,input={}) { return reconstruct(db,input).source; }
export function readRegionAtlasData(db,input={}) { return reconstruct(db,input).data; }

/** Async PostgreSQL twin: materializes the same ordered typed rows from wiki.*
 * in the caller's transaction, then reuses every reconstruction and digest check. */
export async function readRegionAtlasDataAsync(tx, input = {}) {
 if (input !== undefined && (!object(input) || Object.keys(input).length)) fail('explicit exact options');
 const preloaded = new Map();
 const load = async (table, order = '') => {
  const sql = 'SELECT * FROM ' + table + order;
  preloaded.set(sql, await tx.all('SELECT * FROM wiki.' + table + order));
 };
 await load(P + 'receipt');
 for (const name of tableNames()) await load(P + name, ' ORDER BY parent_id,ordinal');
 const sheet = {
  prepare(sql) {
   return {
    all() {
     if (!preloaded.has(sql)) fail('async statement unmaterialized: ' + sql);
     return preloaded.get(sql);
    }
   };
  }
 };
 return readRegionAtlasData(sheet, input);
}
