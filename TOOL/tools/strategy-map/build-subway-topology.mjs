// 출처에 결속한 지하철 토폴로지 생성기 (task 3).
// OSM PBF를 직접 파싱해 route relation(subway/light_rail/tram/train)의 연속 role=stop 멤버로만
// 엣지를 만든다. 같은 이름의 서로 다른 정거장은 서로 다른 OSM 노드로 구별되며, 알 수 없는 연결은
// traversal 불가로 기록된다. 시간값을 넣지 않는다(재실행 시 바이트 동일).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

export const ROUTE_KINDS = new Set(['subway', 'light_rail', 'tram', 'train']);
const ROLE_STOP = 'stop';
const MEMBER_TYPES = ['node', 'way', 'relation'];

// --- minimal protobuf / OSM PBF reader --------------------------------------

function readVarint(buf, pos, end) {
  let value = 0;
  let mult = 1;
  for (let i = 0; i < 10; i += 1) {
    if (pos >= end) throw new Error('pbf: varint runs past end of buffer');
    const b = buf[pos];
    value += (b & 0x7f) * mult;
    pos += 1;
    if ((b & 0x80) === 0) return [value, pos];
    mult *= 128;
  }
  throw new Error('pbf: varint longer than 10 bytes');
}

const zigzag = (v) => (v % 2 === 0 ? v / 2 : -(v + 1) / 2);

// Walks length-delimited message fields; cb(fieldNumber, wireType, varint, payload).
function walkFields(buf, start, end, cb) {
  let pos = start;
  while (pos < end) {
    let tag;
    [tag, pos] = readVarint(buf, pos, end);
    const wireType = tag & 7;
    const field = (tag - wireType) / 8;
    if (wireType === 0) {
      let v;
      [v, pos] = readVarint(buf, pos, end);
      cb(field, 0, v, null);
    } else if (wireType === 2) {
      let len;
      [len, pos] = readVarint(buf, pos, end);
      if (pos + len > end) throw new Error('pbf: length-delimited field past end');
      cb(field, 2, len, buf.subarray(pos, pos + len));
      pos += len;
    } else if (wireType === 5) {
      if (pos + 4 > end) throw new Error('pbf: fixed32 past end');
      pos += 4;
    } else if (wireType === 1) {
      if (pos + 8 > end) throw new Error('pbf: fixed64 past end');
      pos += 8;
    } else {
      throw new Error(`pbf: unsupported wire type ${wireType}`);
    }
  }
}

function decodePacked(buf, start, end) {
  const out = [];
  let pos = start;
  while (pos < end) {
    let v;
    [v, pos] = readVarint(buf, pos, end);
    out.push(v);
  }
  return out;
}

function parseBlob(buf) {
  let raw = null;
  let zlib = null;
  walkFields(buf, 0, buf.length, (field, wireType, _v, payload) => {
    if (field === 1 && wireType === 2) raw = payload;
    else if (field === 3 && wireType === 2) zlib = payload;
  });
  if (raw !== null) return raw;
  if (zlib !== null) return inflateSync(zlib);
  throw new Error('pbf: blob has no raw or zlib payload (unsupported compression)');
}

function decodeTags(keys, vals, strings) {
  const tags = {};
  for (let i = 0; i < keys.length; i += 1) {
    const key = strings[keys[i]].toString('utf8');
    const value = strings[vals[i]].toString('utf8');
    tags[key] = value;
  }
  return tags;
}

function parsePrimitiveBlock(block) {
  let granularity = 100;
  let latOffset = 0;
  let lonOffset = 0;
  let strings = [];
  const groups = [];
  // osmformat.proto: stringtable=1, primitivegroup=2, granularity=17, lat_offset=19, lon_offset=20
  walkFields(block, 0, block.length, (field, wireType, _v, payload) => {
    if (field === 17 && wireType === 0) granularity = _v;
    else if (field === 19 && wireType === 0) latOffset = _v;
    else if (field === 20 && wireType === 0) lonOffset = _v;
    else if (field === 1 && wireType === 2) {
      strings = [];
      walkFields(payload, 0, payload.length, (f, wt, __, bytes) => {
        if (f === 1 && wt === 2) strings.push(bytes);
      });
    } else if (field === 2 && wireType === 2) groups.push(payload);
  });
  // 위도/경도 변환: zigzag·delta 복원된 누적값에 1e-9*(granularity*v+offset)를 적용한다.
  const latOf = (v) => 1e-9 * (granularity * v + latOffset);
  const lonOf = (v) => 1e-9 * (granularity * v + lonOffset);
  return { granularity, latOffset, lonOffset, strings, groups, latOf, lonOf };
}

const str = (bytes) => bytes.toString('utf8');

function parseDenseGroup(group, block, sink) {
  let idRange = null;
  let latRange = null;
  let lonRange = null;
  let kvRange = null;
  walkFields(group, 0, group.length, (field, wireType, _v, payload) => {
    if (wireType === 2 && (field === 1 || field === 8 || field === 9 || field === 10)) {
      if (field === 1) idRange = payload;
      else if (field === 8) latRange = payload;
      else if (field === 9) lonRange = payload;
      else kvRange = payload;
    }
  });
  if (!idRange) return;
  const ids = decodePacked(idRange, 0, idRange.length);
  const lats = latRange ? decodePacked(latRange, 0, latRange.length) : [];
  const lons = lonRange ? decodePacked(lonRange, 0, lonRange.length) : [];
  const kvs = kvRange ? decodePacked(kvRange, 0, kvRange.length) : [];
  let id = 0;
  let latAcc = 0;
  let lonAcc = 0;
  let kv = 0;
  for (let i = 0; i < ids.length; i += 1) {
    id += zigzag(ids[i]);
    latAcc += zigzag(lats[i] ?? 0);
    lonAcc += zigzag(lons[i] ?? 0);
    const tags = {};
    if (kv < kvs.length && kvs[kv] !== 0) {
      while (kv < kvs.length && kvs[kv] !== 0) {
        const key = str(block.strings[kvs[kv]]);
        const value = str(block.strings[kvs[kv + 1]]);
        tags[key] = value;
        kv += 2;
      }
    }
    kv += 1; // 0 terminator
    sink.node({ id, lat: block.latOf(latAcc), lon: block.lonOf(lonAcc), tags });
    sink.counts.nodes += 1;
    if (Object.keys(tags).length > 0) sink.counts.taggedNodes += 1;
  }
}

function parseGroup(group, block, sink) {
  walkFields(group, 0, group.length, (field, wireType, _v, payload) => {
    if (wireType !== 2) return;
    if (field === 2) {
      parseDenseGroup(payload, block, sink);
    } else if (field === 1) {
      // plain Node message
      let id = null;
      let lat = null;
      let lon = null;
      let keys = [];
      let vals = [];
      walkFields(payload, 0, payload.length, (f, wt, v, bytes) => {
        if (f === 1 && wt === 0) id = zigzag(v);
        else if (f === 8 && wt === 0) lat = zigzag(v);
        else if (f === 9 && wt === 0) lon = zigzag(v);
        else if (f === 2 && wt === 2) keys = decodePacked(bytes, 0, bytes.length);
        else if (f === 3 && wt === 2) vals = decodePacked(bytes, 0, bytes.length);
      });
      if (id === null) throw new Error('pbf: node without id');
      const tags = decodeTags(keys, vals, block.strings);
      sink.node({ id, lat: block.latOf(lat ?? 0), lon: block.lonOf(lon ?? 0), tags });
      sink.counts.nodes += 1;
      if (Object.keys(tags).length > 0) sink.counts.taggedNodes += 1;
    } else if (field === 3) {
      sink.counts.ways += 1;
    } else if (field === 4) {
      sink.counts.relations += 1;
      parseRelation(payload, block, sink);
    }
  });
}

function parseRelation(payload, block, sink) {
  let id = null;
  let keys = [];
  let vals = [];
  let roles = [];
  let memids = [];
  let types = [];
  walkFields(payload, 0, payload.length, (f, wt, v, bytes) => {
    // osmformat.proto: Relation.id는 int64(그대로), memids는 sint64(zigzag delta)
    if (f === 1 && wt === 0) id = v;
    else if (f === 2 && wt === 2) keys = decodePacked(bytes, 0, bytes.length);
    else if (f === 3 && wt === 2) vals = decodePacked(bytes, 0, bytes.length);
    else if (f === 8 && wt === 2) roles = decodePacked(bytes, 0, bytes.length);
    else if (f === 9 && wt === 2) memids = decodePacked(bytes, 0, bytes.length);
    else if (f === 10 && wt === 2) types = decodePacked(bytes, 0, bytes.length);
  });
  if (id === null) throw new Error('pbf: relation without id');
  const tags = decodeTags(keys, vals, block.strings);
  const isRoute = tags.type === 'route' && ROUTE_KINDS.has(tags.route);
  if (!isRoute) return;
  let ref = 0;
  const members = memids.map((delta, i) => {
    ref += zigzag(delta);
    return { type: MEMBER_TYPES[types[i]] ?? `member_type_${types[i]}`, ref, role: str(block.strings[roles[i]] ?? Buffer.alloc(0)) };
  });
  sink.counts.routeRelations += 1;
  sink.routeKindCounts.set(tags.route, (sink.routeKindCounts.get(tags.route) ?? 0) + 1);
  sink.relations.push({ id, tags, members });
}

export function parsePbf(input) {
  const buf = typeof input === 'string' ? readFileSync(input) : input;
  const sink = {
    nodes: new Map(),
    relations: [],
    counts: { relations: 0, ways: 0, nodes: 0, taggedNodes: 0, routeRelations: 0 },
    routeKindCounts: new Map(),
    node: (n) => {
      if (Object.keys(n.tags).length > 0) sink.nodes.set(n.id, { id: n.id, lat: n.lat, lon: n.lon, tags: n.tags });
    },
  };
  let pos = 0;
  let sawHeader = false;
  while (pos < buf.length) {
    if (pos + 4 > buf.length) throw new Error('pbf: truncated blob header length prefix');
    const headerLen = buf.readUInt32BE(pos);
    pos += 4;
    if (headerLen <= 0 || pos + headerLen > buf.length) throw new Error('pbf: truncated blob header');
    let type = null;
    let datasize = -1;
    walkFields(buf, pos, pos + headerLen, (field, wireType, v, payload) => {
      if (field === 1 && wireType === 2) type = payload.toString('utf8');
      else if (field === 3 && wireType === 0) datasize = v;
    });
    pos += headerLen;
    if (datasize < 0 || pos + datasize > buf.length) throw new Error('pbf: truncated blob body');
    const body = parseBlob(buf.subarray(pos, pos + datasize));
    pos += datasize;
    if (type !== 'OSMHeader' && type !== 'OSMData') throw new Error(`pbf: unexpected block type ${JSON.stringify(type)}`);
    if (type === 'OSMHeader') {
      sawHeader = true;
      const required = [];
      walkFields(body, 0, body.length, (field, wireType, _v, payload) => {
        if (field === 4 && wireType === 2) required.push(payload.toString('utf8'));
      });
      const supported = new Set(['OsmSchema-V0.5', 'OsmSchema-V0.6', 'DenseNodes']); // V0.6: 역할/키 생략 허용 — 파서는 빈 role을 처리한다
      const unknown = required.filter((f) => !supported.has(f));
      if (unknown.length > 0) throw new Error(`pbf: unsupported required features ${unknown.join(', ')}`);
    } else {
      const block = parsePrimitiveBlock(body);
      for (const group of block.groups) parseGroup(group, block, sink);
    }
  }
  if (!sawHeader) throw new Error('pbf: missing OSMHeader block');
  sink.counts.stopMembers = sink.relations.reduce(
    (acc, rel) => acc + rel.members.filter((m) => m.type === 'node' && m.role === ROLE_STOP).length,
    0,
  );
  sink.counts.nonNodeStopMembers = sink.relations.reduce(
    (acc, rel) => acc + rel.members.filter((m) => m.type !== 'node' && m.role === ROLE_STOP).length,
    0,
  );
  sink.counts.stopRoleVariants = sink.relations.reduce(
    (acc, rel) => acc + rel.members.filter((m) => m.role.startsWith(ROLE_STOP) && m.role !== ROLE_STOP).length,
    0,
  );
  return { nodes: sink.nodes, relations: sink.relations, counts: sink.counts, routeKinds: Object.fromEntries([...sink.routeKindCounts.entries()].sort()) };
}

// --- crosswalk + assembly ----------------------------------------------------

export function haversineM(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371008.8 * 2 * Math.asin(Math.sqrt(a));
}

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function assemble({ pbf, worldGraph, stationInteriors, distanceLimitM = 750 }) {
  if (worldGraph.schema !== 'seoul-world-graph-v1') throw new Error(`world graph schema mismatch: ${worldGraph.schema}`);
  if (stationInteriors.schema !== 'station-interior.v1') throw new Error(`station interiors schema mismatch: ${stationInteriors.schema}`);

  const stations = worldGraph.stations;
  const stationById = new Map(stations.map((s) => [s.id, s]));
  const nameToIds = new Map();
  for (const s of stations) {
    const list = nameToIds.get(s.nameKo) ?? [];
    list.push(s.id);
    nameToIds.set(s.nameKo, list);
  }
  const aliasToId = new Map(Object.entries(worldGraph.aliases ?? {}));
  const interiorsByName = new Map(stationInteriors.stations.map((s) => [s.name, s]));

  const stopOccurrence = { total: 0, resolved: 0, byReason: new Map(), unknownNames: new Map() };
  const osmStopsByStation = new Map(stations.map((s) => [s.id, new Set()]));
  const linesByStation = new Map(stations.map((s) => [s.id, new Set()]));

  const resolveStop = (ref) => {
    const node = pbf.nodes.get(ref);
    if (!node) return { osmRef: `n${ref}`, graphId: null, name: null, reason: 'missing_stop_node' };
    const name = node.tags['name:ko'] ?? node.tags['name'] ?? null;
    if (!name) return { osmRef: `n${ref}`, graphId: null, name: null, reason: 'unnamed_stop' };
    const candidates = (nameToIds.get(name) ?? []).concat(aliasToId.has(name) ? [aliasToId.get(name)] : []);
    if (candidates.length === 0) {
      stopOccurrence.unknownNames.set(name, (stopOccurrence.unknownNames.get(name) ?? 0) + 1);
      return { osmRef: `n${ref}`, graphId: null, name, reason: 'unknown_station' };
    }
    let best = null;
    for (const id of candidates) {
      const st = stationById.get(id);
      const d = haversineM(node.lat, node.lon, st.lat, st.lon);
      if (!best || d < best.d) best = { id, d };
    }
    if (best.d > distanceLimitM) return { osmRef: `n${ref}`, graphId: null, name, reason: 'distance_mismatch', distanceM: Math.round(best.d) };
    return { osmRef: `n${ref}`, graphId: best.id, name };
  };

  const lines = [];
  const edges = new Map();
  const connections = [];
  const rejected = [];

  const orderedRelations = [...pbf.relations].sort((a, b) => a.id - b.id);
  for (const rel of orderedRelations) {
    const tags = rel.tags;
    if (tags.type !== 'route' || !ROUTE_KINDS.has(tags.route)) continue;
    const line = {
      id: `r${rel.id}`,
      relationId: rel.id,
      route: tags.route,
      network: tags.network ?? null,
      ref: tags.ref ?? null,
      colour: tags.colour ?? null,
      name: tags.name ?? null,
      identifiable: Boolean(tags.ref || tags.name),
    };
    const chain = rel.members.filter((m) => m.type === 'node' && m.role === ROLE_STOP);
    line.stopCount = chain.length;
    lines.push(line);

    const resolved = chain.map((m) => {
      stopOccurrence.total += 1;
      const r = resolveStop(m.ref);
      if (r.graphId !== null) {
        stopOccurrence.resolved += 1;
        osmStopsByStation.get(r.graphId).add(r.osmRef);
        linesByStation.get(r.graphId).add(line.id);
      } else {
        stopOccurrence.byReason.set(r.reason, (stopOccurrence.byReason.get(r.reason) ?? 0) + 1);
      }
      return r;
    });

    for (let i = 0; i + 1 < resolved.length; i += 1) {
      const a = resolved[i];
      const b = resolved[i + 1];
      if (a.graphId !== null && b.graphId !== null) {
        if (a.graphId === b.graphId) {
          rejected.push({ kind: 'self_adjacency', station: a.graphId, line: line.id, sources: [line.id] });
          continue;
        }
        if (!line.identifiable) {
          connections.push({
            a: { graphId: a.graphId, name: a.name },
            b: { graphId: b.graphId, name: b.name },
            reason: 'unknown_line',
            traversable: false,
            sources: [line.id],
          });
          continue;
        }
        const key = pairKey(a.graphId, b.graphId);
        const entry = edges.get(key) ?? { a: a.graphId < b.graphId ? a.graphId : b.graphId, b: a.graphId < b.graphId ? b.graphId : a.graphId, lines: new Set(), sources: new Set() };
        entry.lines.add(line.id);
        entry.sources.add(line.id);
        edges.set(key, entry);
      } else {
        const bad = a.graphId === null ? a : b;
        const good = a.graphId === null ? b : a;
        const endpoint = (r) => (r.graphId !== null ? { graphId: r.graphId, name: r.name } : { osmRef: r.osmRef, name: r.name ?? null, graphId: null });
        connections.push({
          a: endpoint(a),
          b: endpoint(b),
          reason: bad.reason,
          traversable: false,
          distanceM: bad.distanceM ?? null,
          sources: [line.id],
          order: a.graphId === null ? 'a' : 'b',
          resolvedSide: good.graphId,
        });
      }
    }
  }

  const topologyEdges = [...edges.entries()]
    .map(([key, e]) => ({ key, a: e.a, b: e.b, lines: [...e.lines].sort(), sources: [...e.sources].sort() }))
    .sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0))
    .map(({ key, ...e }) => e);

  const neighbours = new Map(stations.map((s) => [s.id, new Set()]));
  for (const e of topologyEdges) {
    neighbours.get(e.a).add(e.b);
    neighbours.get(e.b).add(e.a);
  }

  const floorsMissing = [];
  const topologyStations = stations
    .map((s) => {
      const interior = interiorsByName.get(s.nameKo);
      if (!interior) floorsMissing.push(s.id);
      return {
        id: s.id,
        nameKo: s.nameKo,
        nameEn: s.nameEn,
        district: s.district,
        lat: s.lat,
        lon: s.lon,
        osmStops: [...(osmStopsByStation.get(s.id) ?? [])].sort(),
        lines: [...(linesByStation.get(s.id) ?? [])].sort(),
        degree: (neighbours.get(s.id) ?? new Set()).size,
        floors: { observed_levels: interior ? interior.observed_levels : null, observed_levels_source: interior ? interior.observed_levels_source : null },
      };
    })
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const topology = {
    schema: 'subway-topology-v1',
    source: 'OSM BBBike Seoul.osm.pbf route relations (subway/light_rail/tram/train) consecutive role=stop members; edges exist only where both stops crosswalk to distinct world-graph stations',
    lines: lines.sort((a, b) => a.relationId - b.relationId),
    stations: topologyStations,
    edges: topologyEdges,
    connections: connections.sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)).map(({ resolvedSide, order, ...c }) => c),
    rejected: rejected.sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)),
    unmatchedStops: [...stopOccurrence.unknownNames.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([name, count]) => ({ name, occurrences: count })),
  };

  const graphEdgeKeys = new Set(worldGraph.edges.map((e) => pairKey(e.a, e.b)));
  const topologyKeys = new Set(topologyEdges.map((e) => pairKey(e.a, e.b)));
  const covered = topologyStations.filter((s) => s.osmStops.length > 0);

  const coverage = {
    schema: 'subway-topology-coverage-v1',
    pbf: { ...pbf.counts, routeKinds: pbf.routeKinds ?? {} },
    graph: { schema: worldGraph.schema, stations: stations.length, edges: worldGraph.edges.length, districts: worldGraph.districts.length },
    stationInteriors: { schema: stationInteriors.schema, stations: stationInteriors.stations.length, nullFloors: stationInteriors.stations.filter((s) => s.observed_levels === null).length, floorsMissing },
    crosswalk: {
      distanceLimitM,
      stopsTotal: stopOccurrence.total,
      stopOccurrencesResolved: stopOccurrence.resolved,
      unmatchedByReason: Object.fromEntries([...stopOccurrence.byReason.entries()].sort()),
      unknownStopNames: topology.unmatchedStops.length,
    },
    stations: {
      graph: stations.length,
      matched: covered.length,
      coveredByEdges: topologyStations.filter((s) => s.degree > 0).length,
      uncovered: topologyStations.filter((s) => s.osmStops.length === 0).map((s) => s.id),
    },
    lines: {
      total: lines.length,
      identifiable: lines.filter((l) => l.identifiable).length,
      unidentifiable: lines.filter((l) => !l.identifiable).map((l) => l.id),
      withoutRef: lines.filter((l) => !l.ref).length,
    },
    edges: {
      topology: topologyEdges.length,
      graph: worldGraph.edges.length,
      graphEdgesWithoutEvidence: worldGraph.edges.filter((e) => !topologyKeys.has(pairKey(e.a, e.b))).sort((a, b) => (pairKey(a.a, a.b) < pairKey(b.a, b.b) ? -1 : 1)),
      topologyPairsNotInGraph: topologyEdges.filter((e) => !graphEdgeKeys.has(pairKey(e.a, e.b))).map((e) => ({ a: e.a, b: e.b })),
      rejectedSelfAdjacency: rejected.length,
      nontraversableConnections: connections.length,
    },
  };

  return { topology, coverage };
}

// --- CLI ---------------------------------------------------------------------

const sha256File = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const repoRoot = () => resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

export function main(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) args[argv[i]] = argv[i + 1];
  const root = repoRoot();
  const pbfPath = args['--pbf'] ? resolve(args['--pbf']) : join(root, 'GAME-REFERENCE/data/seoul-geography-20260830/osm-current-bbbike/Seoul.osm.pbf');
  const graphPath = args['--world-graph'] ? resolve(args['--world-graph']) : join(root, 'GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json');
  const interiorsPath = args['--interiors'] ? resolve(args['--interiors']) : join(root, 'LORE/regions/station-interiors.json');
  const outDir = args['--out'] ? resolve(args['--out']) : join(root, 'evidence', `subway-topology-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`);
  const distanceLimitM = args['--distance-limit-m'] ? Number(args['--distance-limit-m']) : 750;
  if (!Number.isFinite(distanceLimitM) || distanceLimitM <= 0) throw new Error(`invalid --distance-limit-m: ${args['--distance-limit-m']}`);
  for (const path of [pbfPath, graphPath, interiorsPath]) {
    if (!existsSync(path)) throw new Error(`missing input: ${path}`);
  }

  const pbf = parsePbf(pbfPath);
  const worldGraph = JSON.parse(readFileSync(graphPath, 'utf8'));
  const stationInteriors = JSON.parse(readFileSync(interiorsPath, 'utf8'));
  const { topology, coverage } = assemble({ pbf, worldGraph, stationInteriors, distanceLimitM });

  const inputs = {
    pbf: { path: pbfPath, bytes: statSync(pbfPath).size, sha256: sha256File(pbfPath) },
    worldGraph: { path: graphPath, sha256: sha256File(graphPath) },
    stationInteriors: { path: interiorsPath, sha256: sha256File(interiorsPath) },
  };
  topology.inputs = inputs;
  coverage.inputs = inputs;

  mkdirSync(outDir, { recursive: true });
  const topologyPath = join(outDir, 'topology.json');
  const coveragePath = join(outDir, 'coverage.json');
  writeFileSync(topologyPath, `${JSON.stringify(topology, null, 2)}\n`);
  writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
  const summary = {
    topology: topologyPath,
    coverage: coveragePath,
    relationsTotal: coverage.pbf.relations,
    routeRelations: coverage.pbf.routeRelations,
    stopMembers: coverage.pbf.stopMembers,
    lines: coverage.lines.total,
    stations: coverage.stations.graph,
    matched: coverage.stations.matched,
    uncovered: coverage.stations.uncovered.length,
    edges: coverage.edges.topology,
    nontraversableConnections: coverage.edges.nontraversableConnections,
    rejectedSelfAdjacency: coverage.edges.rejectedSelfAdjacency,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
