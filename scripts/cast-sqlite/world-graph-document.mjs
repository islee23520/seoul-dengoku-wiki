import { createHash } from 'node:crypto';

// Typed preservation of snapshots/build-inputs/SeoulWorldGraph.json.
// Initialization records caller-supplied bytes. It does not approve, publish, or reinterpret them.
// Review, owner, and decision text stays stored evidence. It is not current authorization.
// Read reconstruction is SELECT-only: no file, archive, or JSON.parse access.

export const WORLD_GRAPH_SOURCE_HASH = '46985afccc2d3f2b5e4e3152254d30bc023d0688d63745a951a9be0f6ebf097d';
export const WORLD_GRAPH_DOCUMENT_HASH = '0af399f295580d8f768594100c0a430621f15db0eb3b30e4581a8c07aa465c29';
export const WORLD_GRAPH_SOURCE_BYTE_LENGTH = 217947;

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (code, detail) => { throw Object.assign(new Error(detail ? `${code}: ${detail}` : code), { code }); };
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const quote = (name) => `"${name}"`;

const ROOT_KEYS = ['schema', 'districts', 'stations', 'edges', 'aliases', 'source'];
const STATION_KEYS = ['id', 'nameKo', 'nameEn', 'district', 'lat', 'lon'];
const EDGE_KEYS = ['a', 'b'];
const SOURCE_KEYS = ['original', 'railAdjacency'];
const RAIL_KEYS = ['revision', 'officialSource', 'WikiCommit', 'scope', 'replacements', 'excluded', 'hubIdentities'];
const OFFICIAL_KEYS = ['url', 'retrievedAt', 'sha256', 'scope'];
const REPLACEMENT_KEYS = ['originalIndex', 'original', 'status', 'chain', 'officialCodes', 'lineId', 'source', 'physicalEvidenceBoundary'];
const EXCLUDED_REQUIRED = ['originalIndex', 'original', 'status', 'support'];
const EXCLUDED_OPTIONAL = ['reason', 'missing'];
const SUPPORT_KEYS = ['index', 'a', 'b', 'mappedA', 'mappedB', 'classification', 'officialAdjacentSupport', 'skippedStopEvidence', 'openingEdgeSupport', 'endpointClassification', 'noSurfaceAdjacencyInference', 'evidence_refs'];
const SKIPPED_KEYS = ['lineId', 'lineName', 'pathIndex', 'codes', 'stationIds', 'names', 'skippedStops'];
const EVIDENCE_REF_KEYS = ['path', 'selector'];
const HUB_KEYS = ['uid', 'officialCodes', 'permanentIds', 'lineIds', 'evidence', 'contract'];
const HUB_EVIDENCE_KEYS = ['lineId', 'lineName', 'code', 'uid', 'name', 'pathIndex', 'stationIndex'];

const CHILD_TABLES = Object.freeze([
  ['world_graph_document_district', 'district_count'],
  ['world_graph_document_station', 'station_count'],
  ['world_graph_document_edge', 'edge_count'],
  ['world_graph_document_alias', 'alias_count'],
  ['world_graph_document_replacement', 'replacement_count'],
  ['world_graph_document_excluded', 'excluded_count'],
  ['world_graph_document_hub', 'hub_count'],
]);

export const WORLD_GRAPH_TABLES = Object.freeze([
  'world_graph_document_import',
  'world_graph_document_root',
  'world_graph_document_district',
  'world_graph_document_station',
  'world_graph_document_edge',
  'world_graph_document_alias',
  'world_graph_document_replacement',
  'world_graph_document_replacement_chain',
  'world_graph_document_replacement_code',
  'world_graph_document_excluded',
  'world_graph_document_excluded_missing',
  'world_graph_document_excluded_adjacent',
  'world_graph_document_excluded_opening',
  'world_graph_document_excluded_endpoint',
  'world_graph_document_excluded_evidence_ref',
  'world_graph_document_excluded_skipped',
  'world_graph_document_excluded_skipped_code',
  'world_graph_document_excluded_skipped_station',
  'world_graph_document_excluded_skipped_name',
  'world_graph_document_hub',
  'world_graph_document_hub_official_code',
  'world_graph_document_hub_permanent_id',
  'world_graph_document_hub_line_id',
  'world_graph_document_hub_evidence',
]);

function sameKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key, index) => key === keys[index]);
}

function text(value) {
  return typeof value === 'string';
}

function integer(value) {
  return Number.isSafeInteger(value);
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function decimalText(value) {
  if (!finiteNumber(value)) fail('E_WORLD_GRAPH_SHAPE', 'decimal');
  const rendered = JSON.stringify(value);
  if (!/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/u.test(rendered)) fail('E_WORLD_GRAPH_SHAPE', 'decimal');
  return rendered;
}

function stringList(value, label) {
  if (!Array.isArray(value) || value.some((item) => !text(item))) fail('E_WORLD_GRAPH_SHAPE', label);
  return value;
}

function presence(owner, key) {
  if (!own(owner, key)) return ['missing', null];
  if (owner[key] === null) return ['null', null];
  if (!text(owner[key])) fail('E_WORLD_GRAPH_SHAPE', key);
  return ['value', owner[key]];
}

function officialSource(value, label) {
  if (!sameKeys(value, OFFICIAL_KEYS) || ![value.url, value.retrievedAt, value.sha256, value.scope].every(text)) {
    fail('E_WORLD_GRAPH_SHAPE', label);
  }
  return value;
}

function inspect(document) {
  if (!sameKeys(document, ROOT_KEYS)) fail('E_WORLD_GRAPH_SHAPE', 'root');
  if (!text(document.schema)) fail('E_WORLD_GRAPH_SHAPE', 'schema');
  stringList(document.districts, 'districts');
  if (!Array.isArray(document.stations)) fail('E_WORLD_GRAPH_SHAPE', 'stations');
  for (const station of document.stations) {
    if (!sameKeys(station, STATION_KEYS)) fail('E_WORLD_GRAPH_SHAPE', 'station');
    if (![station.id, station.nameKo, station.nameEn, station.district].every(text)) fail('E_WORLD_GRAPH_SHAPE', 'station text');
    if (!finiteNumber(station.lat) || !finiteNumber(station.lon)) fail('E_WORLD_GRAPH_SHAPE', 'station coordinate');
  }
  if (!Array.isArray(document.edges)) fail('E_WORLD_GRAPH_SHAPE', 'edges');
  for (const edge of document.edges) {
    if (!sameKeys(edge, EDGE_KEYS) || !text(edge.a) || !text(edge.b)) fail('E_WORLD_GRAPH_SHAPE', 'edge');
  }
  if (!document.aliases || typeof document.aliases !== 'object' || Array.isArray(document.aliases)) fail('E_WORLD_GRAPH_SHAPE', 'aliases');
  for (const value of Object.values(document.aliases)) {
    if (!text(value)) fail('E_WORLD_GRAPH_SHAPE', 'alias');
  }
  if (!sameKeys(document.source, SOURCE_KEYS) || !text(document.source.original)) fail('E_WORLD_GRAPH_SHAPE', 'source');
  const rail = document.source.railAdjacency;
  if (!sameKeys(rail, RAIL_KEYS)) fail('E_WORLD_GRAPH_SHAPE', 'railAdjacency');
  if (![rail.revision, rail.WikiCommit, rail.scope].every(text)) fail('E_WORLD_GRAPH_SHAPE', 'rail text');
  officialSource(rail.officialSource, 'officialSource');
  if (!Array.isArray(rail.replacements) || !Array.isArray(rail.excluded) || !Array.isArray(rail.hubIdentities)) {
    fail('E_WORLD_GRAPH_SHAPE', 'rail lists');
  }
  for (const replacement of rail.replacements) {
    if (!sameKeys(replacement, REPLACEMENT_KEYS)) fail('E_WORLD_GRAPH_SHAPE', 'replacement');
    if (!integer(replacement.originalIndex)) fail('E_WORLD_GRAPH_SHAPE', 'replacement index');
    if (!sameKeys(replacement.original, EDGE_KEYS) || !text(replacement.original.a) || !text(replacement.original.b)) fail('E_WORLD_GRAPH_SHAPE', 'replacement original');
    if (!text(replacement.status) || !text(replacement.lineId) || !text(replacement.physicalEvidenceBoundary)) fail('E_WORLD_GRAPH_SHAPE', 'replacement text');
    stringList(replacement.chain, 'replacement chain');
    stringList(replacement.officialCodes, 'replacement codes');
    officialSource(replacement.source, 'replacement source');
  }
  for (const excluded of rail.excluded) {
    if (!excluded || typeof excluded !== 'object' || Array.isArray(excluded)) fail('E_WORLD_GRAPH_SHAPE', 'excluded');
    const keys = Object.keys(excluded);
    const allowed = new Set([...EXCLUDED_REQUIRED, ...EXCLUDED_OPTIONAL]);
    if (EXCLUDED_REQUIRED.some((key) => !own(excluded, key)) || keys.some((key) => !allowed.has(key))) fail('E_WORLD_GRAPH_SHAPE', 'excluded keys');
    if (keys.indexOf('reason') >= 0 && keys.indexOf('missing') >= 0 && keys.indexOf('reason') > keys.indexOf('missing')) fail('E_WORLD_GRAPH_SHAPE', 'excluded order');
    if (!integer(excluded.originalIndex) || !text(excluded.status)) fail('E_WORLD_GRAPH_SHAPE', 'excluded scalar');
    if (!sameKeys(excluded.original, EDGE_KEYS) || !text(excluded.original.a) || !text(excluded.original.b)) fail('E_WORLD_GRAPH_SHAPE', 'excluded original');
    presence(excluded, 'reason');
    if (own(excluded, 'missing')) stringList(excluded.missing, 'excluded missing');
    if (own(excluded, 'reason') && own(excluded, 'missing')) fail('E_WORLD_GRAPH_SHAPE', 'excluded alternatives');
    const support = excluded.support;
    if (!sameKeys(support, SUPPORT_KEYS)) fail('E_WORLD_GRAPH_SHAPE', 'support');
    if (!integer(support.index) || ![support.a, support.b, support.mappedA, support.mappedB, support.classification].every(text)) fail('E_WORLD_GRAPH_SHAPE', 'support scalar');
    if (typeof support.noSurfaceAdjacencyInference !== 'boolean') fail('E_WORLD_GRAPH_SHAPE', 'support flag');
    for (const key of ['officialAdjacentSupport', 'openingEdgeSupport']) stringList(support[key], key);
    if (!Array.isArray(support.endpointClassification) || support.endpointClassification.some((item) => !text(item))) fail('E_WORLD_GRAPH_SHAPE', 'endpoint');
    if (!Array.isArray(support.evidence_refs)) fail('E_WORLD_GRAPH_SHAPE', 'evidence_refs');
    for (const ref of support.evidence_refs) {
      if (!sameKeys(ref, EVIDENCE_REF_KEYS) || !text(ref.path) || !text(ref.selector)) fail('E_WORLD_GRAPH_SHAPE', 'evidence ref');
    }
    if (!Array.isArray(support.skippedStopEvidence)) fail('E_WORLD_GRAPH_SHAPE', 'skipped');
    for (const skipped of support.skippedStopEvidence) {
      if (!sameKeys(skipped, SKIPPED_KEYS)) fail('E_WORLD_GRAPH_SHAPE', 'skipped keys');
      if (![skipped.lineId, skipped.lineName].every(text) || !integer(skipped.pathIndex) || !integer(skipped.skippedStops)) fail('E_WORLD_GRAPH_SHAPE', 'skipped scalar');
      stringList(skipped.codes, 'skipped codes');
      stringList(skipped.stationIds, 'skipped stations');
      stringList(skipped.names, 'skipped names');
    }
  }
  for (const hub of rail.hubIdentities) {
    if (!sameKeys(hub, HUB_KEYS) || !text(hub.uid) || !text(hub.contract)) fail('E_WORLD_GRAPH_SHAPE', 'hub');
    stringList(hub.officialCodes, 'hub codes');
    stringList(hub.permanentIds, 'hub permanent');
    stringList(hub.lineIds, 'hub lines');
    if (!Array.isArray(hub.evidence)) fail('E_WORLD_GRAPH_SHAPE', 'hub evidence');
    for (const evidence of hub.evidence) {
      if (!sameKeys(evidence, HUB_EVIDENCE_KEYS)) fail('E_WORLD_GRAPH_SHAPE', 'hub evidence keys');
      if (![evidence.lineId, evidence.lineName, evidence.code, evidence.uid, evidence.name].every(text)) fail('E_WORLD_GRAPH_SHAPE', 'hub evidence text');
      if (!integer(evidence.pathIndex) || !integer(evidence.stationIndex)) fail('E_WORLD_GRAPH_SHAPE', 'hub evidence index');
    }
  }
}

function insert(db, table, row) {
  const columns = Object.keys(row);
  db.prepare(`INSERT INTO ${table} (${columns.map(quote).join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...columns.map((column) => row[column]));
}

function writeDocument(db, document) {
  inspect(document);
  const rail = document.source.railAdjacency;
  const official = rail.officialSource;
  insert(db, 'world_graph_document_root', {
    singleton: 1,
    schema: document.schema,
    district_count: document.districts.length,
    station_count: document.stations.length,
    edge_count: document.edges.length,
    alias_count: Object.keys(document.aliases).length,
    source_original: document.source.original,
    rail_revision: rail.revision,
    rail_wiki_commit: rail.WikiCommit,
    rail_scope: rail.scope,
    rail_official_url: official.url,
    rail_official_retrieved_at: official.retrievedAt,
    rail_official_sha256: official.sha256,
    rail_official_scope: official.scope,
    replacement_count: rail.replacements.length,
    excluded_count: rail.excluded.length,
    hub_count: rail.hubIdentities.length,
  });
  document.districts.forEach((name, ordinal) => insert(db, 'world_graph_document_district', { ordinal, name }));
  document.stations.forEach((station, ordinal) => insert(db, 'world_graph_document_station', {
    ordinal,
    station_id: station.id,
    name_ko: station.nameKo,
    name_en: station.nameEn,
    district: station.district,
    lat: station.lat,
    lon: station.lon,
    lat_text: decimalText(station.lat),
    lon_text: decimalText(station.lon),
  }));
  document.edges.forEach((edge, ordinal) => insert(db, 'world_graph_document_edge', { ordinal, endpoint_a: edge.a, endpoint_b: edge.b }));
  Object.entries(document.aliases).forEach(([alias_key, alias_value], ordinal) => insert(db, 'world_graph_document_alias', { ordinal, alias_key, alias_value }));
  rail.replacements.forEach((replacement, ordinal) => {
    insert(db, 'world_graph_document_replacement', {
      ordinal,
      original_index: replacement.originalIndex,
      original_a: replacement.original.a,
      original_b: replacement.original.b,
      status: replacement.status,
      line_id: replacement.lineId,
      physical_evidence_boundary: replacement.physicalEvidenceBoundary,
      chain_count: replacement.chain.length,
      official_code_count: replacement.officialCodes.length,
      source_url: replacement.source.url,
      source_retrieved_at: replacement.source.retrievedAt,
      source_sha256: replacement.source.sha256,
      source_scope: replacement.source.scope,
    });
    replacement.chain.forEach((value, index) => insert(db, 'world_graph_document_replacement_chain', { replacement_ordinal: ordinal, ordinal: index, value }));
    replacement.officialCodes.forEach((value, index) => insert(db, 'world_graph_document_replacement_code', { replacement_ordinal: ordinal, ordinal: index, value }));
  });
  rail.excluded.forEach((excluded, ordinal) => {
    const [reason_presence, reason] = presence(excluded, 'reason');
    const support = excluded.support;
    insert(db, 'world_graph_document_excluded', {
      ordinal,
      original_index: excluded.originalIndex,
      original_a: excluded.original.a,
      original_b: excluded.original.b,
      status: excluded.status,
      reason_presence,
      reason,
      missing_presence: own(excluded, 'missing') ? 'present' : 'missing',
      missing_count: own(excluded, 'missing') ? excluded.missing.length : 0,
      support_index: support.index,
      support_a: support.a,
      support_b: support.b,
      support_mapped_a: support.mappedA,
      support_mapped_b: support.mappedB,
      support_classification: support.classification,
      support_no_surface_adjacency_inference: support.noSurfaceAdjacencyInference ? 1 : 0,
      adjacent_count: support.officialAdjacentSupport.length,
      skipped_count: support.skippedStopEvidence.length,
      opening_count: support.openingEdgeSupport.length,
      endpoint_count: support.endpointClassification.length,
      evidence_ref_count: support.evidence_refs.length,
    });
    if (own(excluded, 'missing')) {
      excluded.missing.forEach((value, index) => insert(db, 'world_graph_document_excluded_missing', { excluded_ordinal: ordinal, ordinal: index, value }));
    }
    support.officialAdjacentSupport.forEach((value, index) => insert(db, 'world_graph_document_excluded_adjacent', { excluded_ordinal: ordinal, ordinal: index, value }));
    support.openingEdgeSupport.forEach((value, index) => insert(db, 'world_graph_document_excluded_opening', { excluded_ordinal: ordinal, ordinal: index, value }));
    support.endpointClassification.forEach((value, index) => insert(db, 'world_graph_document_excluded_endpoint', { excluded_ordinal: ordinal, ordinal: index, value }));
    support.evidence_refs.forEach((ref, index) => insert(db, 'world_graph_document_excluded_evidence_ref', { excluded_ordinal: ordinal, ordinal: index, path: ref.path, selector: ref.selector }));
    support.skippedStopEvidence.forEach((skipped, skippedOrdinal) => {
      insert(db, 'world_graph_document_excluded_skipped', {
        excluded_ordinal: ordinal,
        ordinal: skippedOrdinal,
        line_id: skipped.lineId,
        line_name: skipped.lineName,
        path_index: skipped.pathIndex,
        skipped_stops: skipped.skippedStops,
        code_count: skipped.codes.length,
        station_id_count: skipped.stationIds.length,
        name_count: skipped.names.length,
      });
      skipped.codes.forEach((value, index) => insert(db, 'world_graph_document_excluded_skipped_code', { excluded_ordinal: ordinal, skipped_ordinal: skippedOrdinal, ordinal: index, value }));
      skipped.stationIds.forEach((value, index) => insert(db, 'world_graph_document_excluded_skipped_station', { excluded_ordinal: ordinal, skipped_ordinal: skippedOrdinal, ordinal: index, value }));
      skipped.names.forEach((value, index) => insert(db, 'world_graph_document_excluded_skipped_name', { excluded_ordinal: ordinal, skipped_ordinal: skippedOrdinal, ordinal: index, value }));
    });
  });
  rail.hubIdentities.forEach((hub, ordinal) => {
    insert(db, 'world_graph_document_hub', {
      ordinal,
      uid: hub.uid,
      contract: hub.contract,
      official_code_count: hub.officialCodes.length,
      permanent_id_count: hub.permanentIds.length,
      line_id_count: hub.lineIds.length,
      evidence_count: hub.evidence.length,
    });
    hub.officialCodes.forEach((value, index) => insert(db, 'world_graph_document_hub_official_code', { hub_ordinal: ordinal, ordinal: index, value }));
    hub.permanentIds.forEach((value, index) => insert(db, 'world_graph_document_hub_permanent_id', { hub_ordinal: ordinal, ordinal: index, value }));
    hub.lineIds.forEach((value, index) => insert(db, 'world_graph_document_hub_line_id', { hub_ordinal: ordinal, ordinal: index, value }));
    hub.evidence.forEach((evidence, index) => insert(db, 'world_graph_document_hub_evidence', {
      hub_ordinal: ordinal,
      ordinal: index,
      line_id: evidence.lineId,
      line_name: evidence.lineName,
      code: evidence.code,
      uid: evidence.uid,
      name: evidence.name,
      path_index: evidence.pathIndex,
      station_index: evidence.stationIndex,
    }));
  });
}

function ordered(db, sql, params, expected) {
  const rows = db.prepare(sql).all(...params);
  if (rows.length !== expected || rows.some((row, index) => row.ordinal !== index)) fail('E_WORLD_GRAPH_INTEGRITY', 'ordinal');
  return rows;
}

function grouped(rows, parentColumn, parentOrdinal, expected, label) {
  const matches = rows.filter((row) => row[parentColumn] === parentOrdinal);
  if (matches.length !== expected || matches.some((row, index) => row.ordinal !== index)) fail('E_WORLD_GRAPH_INTEGRITY', label);
  return matches;
}

function countOf(db, table) {
  return db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n;
}

function readDocument(db) {
  const rootRows = db.prepare('SELECT * FROM world_graph_document_root').all();
  if (rootRows.length !== 1 || rootRows[0].singleton !== 1) fail('E_WORLD_GRAPH_INTEGRITY', 'root');
  const root = rootRows[0];
  const imports = db.prepare('SELECT * FROM world_graph_document_import').all();
  if (imports.length !== 1 || imports[0].singleton !== 1) fail('E_WORLD_GRAPH_INTEGRITY', 'import');
  const receipt = imports[0];
  if (receipt.source_sha256 !== WORLD_GRAPH_SOURCE_HASH || receipt.byte_length !== WORLD_GRAPH_SOURCE_BYTE_LENGTH || receipt.document_sha256 !== WORLD_GRAPH_DOCUMENT_HASH) {
    fail('E_WORLD_GRAPH_INTEGRITY', 'pin');
  }
  for (const [table, countColumn] of CHILD_TABLES) {
    if (countOf(db, table) !== root[countColumn]) fail('E_WORLD_GRAPH_INTEGRITY', table);
  }
  const districts = ordered(db, 'SELECT ordinal, name FROM world_graph_document_district ORDER BY ordinal', [], root.district_count);
  const stations = ordered(db, 'SELECT * FROM world_graph_document_station ORDER BY ordinal', [], root.station_count);
  const edges = ordered(db, 'SELECT * FROM world_graph_document_edge ORDER BY ordinal', [], root.edge_count);
  const aliases = ordered(db, 'SELECT * FROM world_graph_document_alias ORDER BY ordinal', [], root.alias_count);
  const replacements = ordered(db, 'SELECT * FROM world_graph_document_replacement ORDER BY ordinal', [], root.replacement_count);
  const excluded = ordered(db, 'SELECT * FROM world_graph_document_excluded ORDER BY ordinal', [], root.excluded_count);
  const hubs = ordered(db, 'SELECT * FROM world_graph_document_hub ORDER BY ordinal', [], root.hub_count);
  const replacementChains = db.prepare('SELECT * FROM world_graph_document_replacement_chain ORDER BY replacement_ordinal, ordinal').all();
  const replacementCodes = db.prepare('SELECT * FROM world_graph_document_replacement_code ORDER BY replacement_ordinal, ordinal').all();
  const missing = db.prepare('SELECT * FROM world_graph_document_excluded_missing ORDER BY excluded_ordinal, ordinal').all();
  const adjacent = db.prepare('SELECT * FROM world_graph_document_excluded_adjacent ORDER BY excluded_ordinal, ordinal').all();
  const opening = db.prepare('SELECT * FROM world_graph_document_excluded_opening ORDER BY excluded_ordinal, ordinal').all();
  const endpoints = db.prepare('SELECT * FROM world_graph_document_excluded_endpoint ORDER BY excluded_ordinal, ordinal').all();
  const evidenceRefs = db.prepare('SELECT * FROM world_graph_document_excluded_evidence_ref ORDER BY excluded_ordinal, ordinal').all();
  const skipped = db.prepare('SELECT * FROM world_graph_document_excluded_skipped ORDER BY excluded_ordinal, ordinal').all();
  const skippedCodes = db.prepare('SELECT * FROM world_graph_document_excluded_skipped_code ORDER BY excluded_ordinal, skipped_ordinal, ordinal').all();
  const skippedStations = db.prepare('SELECT * FROM world_graph_document_excluded_skipped_station ORDER BY excluded_ordinal, skipped_ordinal, ordinal').all();
  const skippedNames = db.prepare('SELECT * FROM world_graph_document_excluded_skipped_name ORDER BY excluded_ordinal, skipped_ordinal, ordinal').all();
  const hubCodes = db.prepare('SELECT * FROM world_graph_document_hub_official_code ORDER BY hub_ordinal, ordinal').all();
  const hubPermanent = db.prepare('SELECT * FROM world_graph_document_hub_permanent_id ORDER BY hub_ordinal, ordinal').all();
  const hubLines = db.prepare('SELECT * FROM world_graph_document_hub_line_id ORDER BY hub_ordinal, ordinal').all();
  const hubEvidence = db.prepare('SELECT * FROM world_graph_document_hub_evidence ORDER BY hub_ordinal, ordinal').all();

  const document = {
    schema: root.schema,
    districts: districts.map((row) => row.name),
    stations: stations.map((row) => {
      const lat = row.lat;
      const lon = row.lon;
      if (JSON.stringify(lat) !== row.lat_text || JSON.stringify(lon) !== row.lon_text) fail('E_WORLD_GRAPH_INTEGRITY', 'coordinate');
      return { id: row.station_id, nameKo: row.name_ko, nameEn: row.name_en, district: row.district, lat, lon };
    }),
    edges: edges.map((row) => ({ a: row.endpoint_a, b: row.endpoint_b })),
    aliases: Object.fromEntries(aliases.map((row) => [row.alias_key, row.alias_value])),
    source: {
      original: root.source_original,
      railAdjacency: {
        revision: root.rail_revision,
        officialSource: {
          url: root.rail_official_url,
          retrievedAt: root.rail_official_retrieved_at,
          sha256: root.rail_official_sha256,
          scope: root.rail_official_scope,
        },
        WikiCommit: root.rail_wiki_commit,
        scope: root.rail_scope,
        replacements: replacements.map((row) => ({
          originalIndex: row.original_index,
          original: { a: row.original_a, b: row.original_b },
          status: row.status,
          chain: grouped(replacementChains, 'replacement_ordinal', row.ordinal, row.chain_count, 'chain').map((item) => item.value),
          officialCodes: grouped(replacementCodes, 'replacement_ordinal', row.ordinal, row.official_code_count, 'code').map((item) => item.value),
          lineId: row.line_id,
          source: {
            url: row.source_url,
            retrievedAt: row.source_retrieved_at,
            sha256: row.source_sha256,
            scope: row.source_scope,
          },
          physicalEvidenceBoundary: row.physical_evidence_boundary,
        })),
        excluded: excluded.map((row) => {
          const item = {
            originalIndex: row.original_index,
            original: { a: row.original_a, b: row.original_b },
            status: row.status,
          };
          if (row.reason_presence === 'value') item.reason = row.reason;
          else if (row.reason_presence === 'null') item.reason = null;
          else if (row.reason_presence !== 'missing' || row.reason !== null) fail('E_WORLD_GRAPH_INTEGRITY', 'reason');
          const missingRows = missing.filter((entry) => entry.excluded_ordinal === row.ordinal);
          if (missingRows.length !== row.missing_count || missingRows.some((entry, index) => entry.ordinal !== index)) fail('E_WORLD_GRAPH_INTEGRITY', 'missing');
          if (row.missing_presence === 'present') item.missing = missingRows.map((entry) => entry.value);
          else if (row.missing_presence !== 'missing' || missingRows.length !== 0) fail('E_WORLD_GRAPH_INTEGRITY', 'missing presence');
          const adjacentRows = grouped(adjacent, 'excluded_ordinal', row.ordinal, row.adjacent_count, 'adjacent');
          const openingRows = grouped(opening, 'excluded_ordinal', row.ordinal, row.opening_count, 'opening');
          const endpointRows = grouped(endpoints, 'excluded_ordinal', row.ordinal, row.endpoint_count, 'endpoint');
          const refRows = grouped(evidenceRefs, 'excluded_ordinal', row.ordinal, row.evidence_ref_count, 'evidence ref');
          const skippedRows = grouped(skipped, 'excluded_ordinal', row.ordinal, row.skipped_count, 'skipped');
          item.support = {
            index: row.support_index,
            a: row.support_a,
            b: row.support_b,
            mappedA: row.support_mapped_a,
            mappedB: row.support_mapped_b,
            classification: row.support_classification,
            officialAdjacentSupport: adjacentRows.map((entry) => entry.value),
            skippedStopEvidence: skippedRows.map((skippedRow) => ({
              lineId: skippedRow.line_id,
              lineName: skippedRow.line_name,
              pathIndex: skippedRow.path_index,
              codes: nested(skippedCodes, row.ordinal, skippedRow.ordinal, skippedRow.code_count),
              stationIds: nested(skippedStations, row.ordinal, skippedRow.ordinal, skippedRow.station_id_count),
              names: nested(skippedNames, row.ordinal, skippedRow.ordinal, skippedRow.name_count),
              skippedStops: skippedRow.skipped_stops,
            })),
            openingEdgeSupport: openingRows.map((entry) => entry.value),
            endpointClassification: endpointRows.map((entry) => entry.value),
            noSurfaceAdjacencyInference: row.support_no_surface_adjacency_inference === 1,
            evidence_refs: refRows.map((entry) => ({ path: entry.path, selector: entry.selector })),
          };
          if (![0, 1].includes(row.support_no_surface_adjacency_inference)) fail('E_WORLD_GRAPH_INTEGRITY', 'flag');
          return item;
        }),
        hubIdentities: hubs.map((row) => ({
          uid: row.uid,
          officialCodes: grouped(hubCodes, 'hub_ordinal', row.ordinal, row.official_code_count, 'hub code').map((entry) => entry.value),
          permanentIds: grouped(hubPermanent, 'hub_ordinal', row.ordinal, row.permanent_id_count, 'hub permanent').map((entry) => entry.value),
          lineIds: grouped(hubLines, 'hub_ordinal', row.ordinal, row.line_id_count, 'hub line').map((entry) => entry.value),
          evidence: grouped(hubEvidence, 'hub_ordinal', row.ordinal, row.evidence_count, 'hub evidence').map((entry) => ({
            lineId: entry.line_id,
            lineName: entry.line_name,
            code: entry.code,
            uid: entry.uid,
            name: entry.name,
            pathIndex: entry.path_index,
            stationIndex: entry.station_index,
          })),
          contract: row.contract,
        })),
      },
    },
  };
  const consumed = {
    world_graph_document_replacement_chain: replacements.reduce((sum, row) => sum + row.chain_count, 0),
    world_graph_document_replacement_code: replacements.reduce((sum, row) => sum + row.official_code_count, 0),
    world_graph_document_excluded_missing: excluded.reduce((sum, row) => sum + row.missing_count, 0),
    world_graph_document_excluded_adjacent: excluded.reduce((sum, row) => sum + row.adjacent_count, 0),
    world_graph_document_excluded_opening: excluded.reduce((sum, row) => sum + row.opening_count, 0),
    world_graph_document_excluded_endpoint: excluded.reduce((sum, row) => sum + row.endpoint_count, 0),
    world_graph_document_excluded_evidence_ref: excluded.reduce((sum, row) => sum + row.evidence_ref_count, 0),
    world_graph_document_excluded_skipped: excluded.reduce((sum, row) => sum + row.skipped_count, 0),
    world_graph_document_hub_official_code: hubs.reduce((sum, row) => sum + row.official_code_count, 0),
    world_graph_document_hub_permanent_id: hubs.reduce((sum, row) => sum + row.permanent_id_count, 0),
    world_graph_document_hub_line_id: hubs.reduce((sum, row) => sum + row.line_id_count, 0),
    world_graph_document_hub_evidence: hubs.reduce((sum, row) => sum + row.evidence_count, 0),
  };
  for (const [table, expected] of Object.entries(consumed)) {
    if (countOf(db, table) !== expected) fail('E_WORLD_GRAPH_INTEGRITY', table);
  }
  const skippedConsumed = skipped.reduce((sums, row) => {
    sums.code += row.code_count;
    sums.station += row.station_id_count;
    sums.name += row.name_count;
    return sums;
  }, { code: 0, station: 0, name: 0 });
  if (countOf(db, 'world_graph_document_excluded_skipped_code') !== skippedConsumed.code) fail('E_WORLD_GRAPH_INTEGRITY', 'skipped code');
  if (countOf(db, 'world_graph_document_excluded_skipped_station') !== skippedConsumed.station) fail('E_WORLD_GRAPH_INTEGRITY', 'skipped station');
  if (countOf(db, 'world_graph_document_excluded_skipped_name') !== skippedConsumed.name) fail('E_WORLD_GRAPH_INTEGRITY', 'skipped name');
  if (sha(JSON.stringify(document)) !== receipt.document_sha256) fail('E_WORLD_GRAPH_DIGEST', 'document');
  return document;
}

function nested(rows, excludedOrdinal, skippedOrdinal, expected) {
  const matches = rows.filter((row) => row.excluded_ordinal === excludedOrdinal && row.skipped_ordinal === skippedOrdinal);
  if (matches.length !== expected || matches.some((row, index) => row.ordinal !== index)) fail('E_WORLD_GRAPH_INTEGRITY', 'nested');
  return matches.map((row) => row.value);
}

function parseDocument(bytes) {
  let document;
  try {
    document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    if (error && error.code === 'E_WORLD_GRAPH_SHAPE') throw error;
    fail('E_WORLD_GRAPH_SHAPE', 'json');
  }
  inspect(document);
  return document;
}

function bytesOf(sourceBytes) {
  if (sourceBytes == null || !(sourceBytes instanceof Uint8Array)) fail('E_WORLD_GRAPH_BYTES');
  return Buffer.from(sourceBytes);
}

function optionsOf(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('E_WORLD_GRAPH_OPTIONS');
  return options;
}

/** Record one supplied source exactly. The caller owns the connection and transaction. */
export function initializeWorldGraphDocument(db, options) {
  const input = optionsOf(options);
  const { schemaSql, sourceBytes, expectedSourceHash, actor, reason } = input;
  if (typeof schemaSql !== 'string' || !schemaSql.includes('CREATE TABLE world_graph_document_root')) fail('E_WORLD_GRAPH_SCHEMA');
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('E_WORLD_GRAPH_AUDIT');
  if (typeof expectedSourceHash !== 'string' || !/^[a-f0-9]{64}$/u.test(expectedSourceHash)) fail('E_WORLD_GRAPH_PIN');
  const bytes = bytesOf(sourceBytes);
  if (sha(bytes) !== expectedSourceHash) fail('E_WORLD_GRAPH_PIN');
  const document = parseDocument(bytes);
  if (expectedSourceHash !== WORLD_GRAPH_SOURCE_HASH || bytes.length !== WORLD_GRAPH_SOURCE_BYTE_LENGTH || sha(JSON.stringify(document)) !== WORLD_GRAPH_DOCUMENT_HASH) fail('E_WORLD_GRAPH_PIN');
  const started = !db.isTransaction;
  if (started) db.exec('BEGIN IMMEDIATE');
  db.exec('SAVEPOINT world_graph_document_write');
  try {
    db.exec(schemaSql);
    insert(db, 'world_graph_document_import', {
      singleton: 1,
      actor,
      reason,
      source_sha256: WORLD_GRAPH_SOURCE_HASH,
      document_sha256: WORLD_GRAPH_DOCUMENT_HASH,
      byte_length: bytes.length,
    });
    writeDocument(db, document);
    const restored = readDocument(db);
    if (JSON.stringify(restored) !== JSON.stringify(document)) fail('E_WORLD_GRAPH_INTEGRITY', 'round trip');
    db.exec('RELEASE world_graph_document_write');
    if (started) db.exec('COMMIT');
    return restored;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK TO world_graph_document_write');
    if (db.isTransaction) db.exec('RELEASE world_graph_document_write');
    if (started && db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

/** SELECT-only reconstruction. Rejects a stored digest that no longer matches the typed rows. */
export function readWorldGraphDocument(db, options) {
  const input = optionsOf(options);
  if (input.expectedSourceHash !== WORLD_GRAPH_SOURCE_HASH) fail('E_WORLD_GRAPH_PIN');
  return readDocument(db);
}
