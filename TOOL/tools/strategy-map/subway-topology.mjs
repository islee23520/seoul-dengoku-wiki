// 지하철 토폴로지 조립 v2 — crosswalk/분류/위상/coverage.
// 원칙: 노드 신원은 OSM type/id(n<osmid>)로 확정하고 이름 정규화는 crosswalk에만 쓴다.
// 엣지는 route relation의 유효 stop 역할(stop/stop_entry_only/stop_exit_only) 인접 쌍에서만
// 나오며, 지원되지 않는 stop류 중간 멤버는 세그먼트를 끊는다. 플랫폼/way 등 나머지 멤버는
// 투명하게 건너뛴다. 추측에 의한 최근접 결합은 하지 않는다.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTE_KINDS, readRelations, readEntities } from './osm-pbf-reader.mjs';

export const SUPPORTED_STOP_ROLES = new Set(['stop', 'stop_entry_only', 'stop_exit_only']);
export const COORDINATE_TOLERANCE_DEG = 1e-6;
export const DEFAULT_DISTANCE_GUARD_M = 750;
const MEMBER_TYPE_NODE = 'node';
const MEMBER_TYPE_WAY = 'way';

export function normalizeName(s) {
  return s
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    // 괄호에 인접한 공백을 양쪽 모두 제거한다 (문서화된 유일한 문부호 규칙).
    .replace(/[ \t]*\([ \t]*/g, '(')
    .replace(/[ \t]*\)[ \t]*/g, ')');
}

export function haversineM(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371008.8 * 2 * Math.asin(Math.sqrt(a));
}

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const osmRef = (id) => `n${id}`;

export function loadLedger(path) {
  const ledger = JSON.parse(readFileSync(path, 'utf8'));
  if (ledger.schema !== 'subway-alias-ledger-v2') throw new Error(`topology: alias ledger schema mismatch: ${ledger.schema}`);
  return ledger;
}

function validateFloors(stationInteriors) {
  for (const s of stationInteriors.stations) {
    if (s.observed_levels !== null && s.observed_levels !== undefined && s.observed_levels_source === null) {
      throw new Error(`topology: observed floors without observed_levels_source for ${s.name} (INVALID_OBSERVED_FLOORS)`);
    }
  }
}

const byKey = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const stable = (v) => JSON.stringify(v);
const sortRecords = (rows) => rows.sort((a, b) => (stable(a) < stable(b) ? -1 : 1));
const uniqSorted = (iterable) => [...new Set(iterable)].sort(byKey);

export function buildTopology({ pbfPath, worldGraph, stationInteriors, ledger, dongContentDir, distanceGuardM = DEFAULT_DISTANCE_GUARD_M }) {
  const routeFilter = (_id, tags) => tags.type === 'route' && ROUTE_KINDS.has(tags.route);
  const { relations: routeRelations, counts } = readRelations(pbfPath, { filter: routeFilter });
  const stopNodeRefs = new Set();
  const memberWayRefs = new Set();
  for (const rel of routeRelations) {
    for (const m of rel.members) {
      if (m.type === MEMBER_TYPE_NODE && m.role.startsWith('stop')) stopNodeRefs.add(m.ref);
      if (m.type === MEMBER_TYPE_WAY) memberWayRefs.add(m.ref);
    }
  }
  const entities = readEntities(pbfPath, { wantWayIds: memberWayRefs, wantNodeIds: stopNodeRefs });
  return assembleFromParsed({ routeRelations, counts, entities, worldGraph, stationInteriors, ledger, dongContentDir, distanceGuardM });
}

export function assembleFromParsed({ routeRelations: rawRouteRelations, counts, entities, worldGraph, stationInteriors, ledger, dongContentDir, distanceGuardM = DEFAULT_DISTANCE_GUARD_M }) {
  if (worldGraph.schema !== 'seoul-world-graph-v1') throw new Error(`topology: world graph schema mismatch: ${worldGraph.schema}`);
  if (stationInteriors.schema !== 'station-interior.v1') throw new Error(`topology: station interiors schema mismatch: ${stationInteriors.schema}`);
  validateFloors(stationInteriors);
  // 검증된 경로 필터를 조립 경계에서도 강제한다(버스/기타 route는 여기서 누락된다).
  const routeRelations = rawRouteRelations.filter((r) => r.tags?.type === 'route' && ROUTE_KINDS.has(r.tags?.route));

  const roleHistogram = {};
  for (const rel of routeRelations) {
    for (const m of rel.members) {
      roleHistogram[m.role] = (roleHistogram[m.role] ?? 0) + 1;
    }
  }

  // 3) 카탈로그 색인
  const stations = worldGraph.stations;
  const stationById = new Map(stations.map((s) => [s.id, s]));
  const catalogByNormKey = new Map();
  for (const s of stations) {
    const key = normalizeName(s.nameKo);
    catalogByNormKey.set(key, [...(catalogByNormKey.get(key) ?? []), s.id]);
  }
  const aliasByNormKey = new Map();
  for (const [alias, target] of Object.entries(worldGraph.aliases ?? {})) aliasByNormKey.set(normalizeName(alias), target);
  for (const entry of ledger.aliases) {
    const key = normalizeName(entry.osmName);
    if (!aliasByNormKey.has(key)) aliasByNormKey.set(key, entry.catalogId);
  }
  const canonicalOf = new Map(ledger.canonicalAliases.map((e) => [e.fromCatalogId, e.toCatalogId]));
  for (const [from, to] of canonicalOf) {
    if (!stationById.has(from)) throw new Error(`topology: canonical alias source ${from} missing from catalog`);
    if (!stationById.has(to)) throw new Error(`topology: canonical alias target ${to} missing from catalog`);
  }

  // 4) stop 노드 해소(발생 단위 카운트와 노드 단위 바인딩 분리)
  const stops = new Map(); // 'n<id>' -> record
  const stopOccurrences = { total: 0, resolved: 0, byReason: {}, byRole: {} };
  const unknownNames = new Map();

  const resolveStop = (ref) => {
    stopOccurrences.total += 1;
    const node = entities.nodeCoords.get(ref) ?? entities.taggedNodes.get(ref);
    const tagged = entities.taggedNodes.get(ref);
    if (!node) {
      stopOccurrences.byReason.missing_stop_node = (stopOccurrences.byReason.missing_stop_node ?? 0) + 1;
      return { ok: false, reason: 'missing_stop_node', stop: osmRef(ref), name: null };
    }
    const name = tagged?.tags['name:ko'] ?? tagged?.tags['name'] ?? null;
    if (!name) {
      stopOccurrences.byReason.unnamed_stop = (stopOccurrences.byReason.unnamed_stop ?? 0) + 1;
      return { ok: false, reason: 'unnamed_stop', stop: osmRef(ref), name: null };
    }
    let record = stops.get(osmRef(ref));
    if (!record) {
      record = { id: osmRef(ref), name, lat: node.lat, lon: node.lon, roles: {}, lines: [], graphStation: null, crosswalk: null };
      stops.set(record.id, record);
    }
    const key = normalizeName(name);
    const rawCandidates = catalogByNormKey.get(key) ?? [];
    const candidates = [...new Set(rawCandidates.map((id) => canonicalOf.get(id) ?? id))];
    let target = null;
    let method = null;
    let preCanonical = null;
    if (candidates.length === 1) {
      target = candidates[0];
      preCanonical = rawCandidates[0];
      method = target !== preCanonical ? 'canonical_alias' : 'name';
    } else if (candidates.length > 1) {
      // 정규화 키 충돌: 좌표가 허용오차 이내로 유일하게 일치하는 후보만 허용한다.
      const exact = candidates.filter((id) => {
        const st = stationById.get(id);
        return Math.abs(st.lat - node.lat) <= COORDINATE_TOLERANCE_DEG && Math.abs(st.lon - node.lon) <= COORDINATE_TOLERANCE_DEG;
      });
      if (exact.length === 1) {
        target = exact[0];
        preCanonical = rawCandidates.find((id) => (canonicalOf.get(id) ?? id) === target) ?? target;
        method = 'coordinate_exact';
      } else {
        stopOccurrences.byReason.ambiguous_key = (stopOccurrences.byReason.ambiguous_key ?? 0) + 1;
        return { ok: false, reason: 'ambiguous_key', stop: osmRef(ref), name };
      }
    } else {
      const aliasTarget = aliasByNormKey.get(key);
      if (aliasTarget !== undefined) {
        preCanonical = aliasTarget;
        target = canonicalOf.has(aliasTarget) ? canonicalOf.get(aliasTarget) : aliasTarget;
        method = 'alias';
      } else {
        unknownNames.set(name, (unknownNames.get(name) ?? 0) + 1);
        stopOccurrences.byReason.unknown_station = (stopOccurrences.byReason.unknown_station ?? 0) + 1;
        return { ok: false, reason: 'unknown_station', stop: osmRef(ref), name };
      }
    }
    const st = stationById.get(target);
    const d = haversineM(node.lat, node.lon, st.lat, st.lon);
    if (d > distanceGuardM) {
      stopOccurrences.byReason.distance_mismatch = (stopOccurrences.byReason.distance_mismatch ?? 0) + 1;
      return { ok: false, reason: 'distance_mismatch', stop: osmRef(ref), name, distanceM: Math.round(d) };
    }
    stopOccurrences.resolved += 1;
    record.graphStation = target;
    record.crosswalk = { method, catalogId: preCanonical, distanceM: Math.round(d) };
    return { ok: true, stop: record.id, station: target, name };
  };

  // 5) 세그먼트 조립: 유효 stop 역할만 사슬을 만들고, 지원되지 않는 stop류는 세그먼트를 끊는다.
  const edges = new Map();
  const connections = [];
  const rejected = [];
  const allLines = [];
  const required = { pairs: 0, resolvedIntoEdges: 0 };

  const endpointOf = (el) => {
    if (!el.supported) return { way: el.wayRef };
    const rec = stops.get(el.stop);
    if (!el.resolved) return { stop: el.stop, name: el.name ?? null, graphStation: null, missing: el.reason === 'missing_stop_node' ? true : undefined };
    return { stop: el.stop, name: rec?.name ?? el.name ?? null, graphStation: el.station };
  };

  for (const rel of [...routeRelations].sort((a, b) => a.id - b.id)) {
    const tags = rel.tags;
    const line = {
      id: `r${rel.id}`,
      relationId: rel.id,
      route: tags.route,
      network: tags.network ?? null,
      ref: tags.ref ?? null,
      colour: tags.colour ?? null,
      name: tags.name ?? null,
      operator: tags.operator ?? null,
      identifiable: Boolean(tags.ref || tags.name),
    };
    const chain = [];
    for (const m of rel.members) {
      if (m.role.startsWith('stop')) {
        if (m.type === MEMBER_TYPE_NODE) {
          const supported = SUPPORTED_STOP_ROLES.has(m.role);
          stopOccurrences.byRole[m.role] = (stopOccurrences.byRole[m.role] ?? 0) + 1;
          const res = resolveStop(m.ref);
          const rec = stops.get(res.stop ?? osmRef(m.ref));
          if (rec) rec.roles[m.role] = (rec.roles[m.role] ?? 0) + 1;
          chain.push({ ref: m.ref, role: m.role, supported, resolved: res.ok, reason: res.reason, station: res.station, stop: res.stop ?? osmRef(m.ref), name: res.name ?? null, distanceM: res.distanceM ?? null });
        } else {
          chain.push({ unsupported: true, wayRef: m.ref, role: m.role });
        }
      }
    }
    line.stopCount = chain.length;
    for (let i = 0; i + 1 < chain.length; i += 1) {
      const a = chain[i];
      const b = chain[i + 1];
      const endpointA = endpointOf(a);
      const endpointB = endpointOf(b);
      const base = { a: endpointA, b: endpointB, traversable: false, sources: [line.id], aRole: a.role, bRole: b.role };
      if (!a.supported || !b.supported) {
        connections.push({ ...base, reason: 'unsupported_stop_role', traversable: false });
        continue;
      }
      if (a.resolved && b.resolved) {
        if (a.station === b.station) {
          rejected.push({ kind: 'self_adjacency', station: a.station, line: line.id, sources: [line.id] });
          continue;
        }
        required.pairs += 1;
        if (!line.identifiable) {
          connections.push({ ...base, reason: 'unknown_line' });
          continue;
        }
        required.resolvedIntoEdges += 1;
        const key = pairKey(a.station, b.station);
        const entry = edges.get(key) ?? { a: a.station < b.station ? a.station : b.station, b: a.station < b.station ? b.station : a.station, links: [], sources: [] };
        entry.links.push({ line: line.id, aRole: a.role, bRole: b.role });
        if (!entry.sources.includes(line.id)) entry.sources.push(line.id);
        edges.set(key, entry);
        stops.get(a.stop)?.lines.push(line.id);
        stops.get(b.stop)?.lines.push(line.id);
      } else {
        const bad = !a.resolved ? a : b;
        connections.push({ ...base, reason: bad.reason, distanceM: bad.distanceM ?? null });
      }
    }
    // 노선 등급/기하: way 멤버 좌표와 터널/교량 태그
    const grade = { undergroundWays: 0, elevatedWays: 0, unclassifiedWays: 0, status: 'unknown', provenance: 'member way tags tunnel/covered/bridge' };
    const geometryWays = [];
    let pointCount = 0;
    let missingNodeCoords = 0;
    for (const m of rel.members) {
      if (m.type !== MEMBER_TYPE_WAY) continue;
      const way = entities.ways.get(m.ref);
      if (!way) continue;
      if (way.tags.tunnel === 'yes' || way.tags.covered === 'yes') grade.undergroundWays += 1;
      else if (way.tags.bridge === 'yes') grade.elevatedWays += 1;
      else grade.unclassifiedWays += 1;
      const points = [];
      for (const ref of way.refs) {
        const coord = entities.nodeCoords.get(ref);
        if (!coord) {
          missingNodeCoords += 1;
          continue;
        }
        points.push([coord.lon, coord.lat]);
      }
      pointCount += points.length;
      geometryWays.push({ wayId: m.ref, points });
    }
    const gradedWays = grade.undergroundWays + grade.elevatedWays + grade.unclassifiedWays;
    grade.status = gradedWays > 0 ? 'observed' : 'unknown';
    line.grade = { ...grade, ways: gradedWays };
    line.geometry = { wayCount: geometryWays.length, pointCount, missingNodeCoords, ways: geometryWays };
    allLines.push(line);
  }
  allLines.sort((a, b) => a.relationId - b.relationId);

  // 6) 카탈로그 좌표 정확 결합(장부 검증형): monorail / nonrail-misclassified
  for (const entry of ledger.coordinateExactMatches) {
    const st = stationById.get(entry.catalogId);
    if (!st) throw new Error(`topology: coordinateExactMatches catalogId ${entry.catalogId} missing from catalog`);
    const node = entities.nodeCoords.get(entry.osmNodeId) ?? entities.taggedNodes.get(entry.osmNodeId);
    const tagged = entities.taggedNodes.get(entry.osmNodeId);
    if (!node || !tagged) throw new Error(`topology: ledger node n${entry.osmNodeId} for ${entry.catalogId} absent from PBF`);
    if (normalizeName(tagged.tags['name:ko'] ?? tagged.tags['name'] ?? '') !== normalizeName(st.nameKo)) {
      throw new Error(`topology: ledger node n${entry.osmNodeId} name mismatch for ${entry.catalogId}`);
    }
    if (Math.abs(node.lat - st.lat) > COORDINATE_TOLERANCE_DEG || Math.abs(node.lon - st.lon) > COORDINATE_TOLERANCE_DEG) {
      throw new Error(`topology: ledger node n${entry.osmNodeId} coordinates not exact for ${entry.catalogId}`);
    }
    const rec = stops.get(osmRef(entry.osmNodeId)) ?? {
      id: osmRef(entry.osmNodeId),
      name: tagged.tags['name:ko'] ?? tagged.tags['name'],
      lat: node.lat,
      lon: node.lon,
      roles: {},
      lines: [],
      graphStation: null,
      crosswalk: null,
    };
    rec.graphStation = entry.catalogId;
    rec.crosswalk = { method: 'catalog_node_coordinate_exact', catalogId: entry.catalogId, distanceM: 0 };
    stops.set(rec.id, rec);
  }

  // 7) 역 기록 조립(334 전원 명시적 처분)
  const neighbours = new Map(stations.map((s) => [s.id, new Set()]));
  for (const e of edges.values()) {
    neighbours.get(e.a).add(e.b);
    neighbours.get(e.b).add(e.a);
  }
  const linesByStation = new Map(stations.map((s) => [s.id, new Set()]));
  for (const rec of stops.values()) {
    if (!rec.graphStation) continue;
    for (const l of rec.lines) linesByStation.get(rec.graphStation)?.add(l);
  }
  const interiorsByName = new Map(stationInteriors.stations.map((s) => [s.name, s]));
  const canonicalSources = new Map(ledger.canonicalAliases.map((e) => [e.fromCatalogId, e.toCatalogId]));

  const dongIndex = dongContentDir ? loadDongIndex(dongContentDir) : null;
  const dongContentFiles = dongIndex?.fileCount ?? 0;
  const dongRecords = dongIndex?.recordCount ?? 0;

  const stationsOut = stations
    .map((s) => {
      const interior = interiorsByName.get(s.nameKo);
      const bound = [...stops.values()].filter((rec) => rec.graphStation === s.id);
      let classification = 'rail';
      let disposition = { method: bound.length > 0 ? 'route_stop' : 'unmatched' };
      const ledgerExact = ledger.coordinateExactMatches.find((e) => e.catalogId === s.id);
      if (ledgerExact) {
        classification = ledgerExact.classification;
        disposition = { method: 'catalog_node_coordinate_exact', node: osmRef(ledgerExact.osmNodeId), reason: ledgerExact.reason };
      }
      if (canonicalSources.has(s.id)) {
        classification = 'canonical-alias';
        disposition = { method: 'canonical_alias', canonical: canonicalSources.get(s.id), reason: ledger.canonicalAliases.find((e) => e.toCatalogId === s.id)?.reason };
      }
      const nodeIds = bound.map((rec) => rec.id);
      const dongHit = dongIndex ? bindDong(dongIndex, nodeIds) : null;
      const floorStatus = interior === undefined ? 'unknown' : interior.observed_levels === null ? 'unknown' : 'observed';
      return {
        id: s.id,
        nameKo: s.nameKo,
        nameEn: s.nameEn,
        district: s.district,
        lat: s.lat,
        lon: s.lon,
        topologyClassification: classification,
        disposition,
        stops: nodeIds.sort(byKey),
        lines: uniqSorted(bound.flatMap((rec) => rec.lines)),
        degree: (neighbours.get(s.id) ?? new Set()).size,
        floors: { observed_levels: interior ? interior.observed_levels : null, observed_levels_source: interior ? interior.observed_levels_source : null },
        floorStatus,
        dong: dongHit?.dong ?? null,
        buildingRefs: dongHit?.buildingRefs ?? [],
      };
    })
    .sort((a, b) => byKey(a.id, b.id));

  const topologyEdges = [...edges.values()]
    .map((e) => ({ a: e.a, b: e.b, links: e.links.sort((x, y) => byKey(stable(x), stable(y))), sources: [...e.sources].sort(byKey) }))
    .sort((x, y) => byKey(pairKey(x.a, x.b), pairKey(y.a, y.b)));

  const graphEdgeKeys = new Set(worldGraph.edges.map((e) => pairKey(e.a, e.b)));
  const topologyKeys = new Set(topologyEdges.map((e) => pairKey(e.a, e.b)));

  // graph edge 증거 분류: 관찰된 인접 쌍인지, 중간 정차가 누락된 수축 경로인지
  const observedPairKeys = new Set();
  for (const c of connections) {
    if (c.a?.graphStation && c.b?.graphStation) observedPairKeys.add(pairKey(c.a.graphStation, c.b.graphStation));
  }
  const graphEdgesWithoutObservedStopEvidence = [];
  const graphEdgesWithTruncatedStopEvidence = [];
  for (const e of worldGraph.edges) {
    const key = pairKey(e.a, e.b);
    if (topologyKeys.has(key)) continue;
    if (observedPairKeys.has(key)) graphEdgesWithTruncatedStopEvidence.push(e);
    else graphEdgesWithoutObservedStopEvidence.push(e);
  }
  graphEdgesWithoutObservedStopEvidence.sort((a, b) => byKey(pairKey(a.a, a.b), pairKey(b.a, b.b)));
  graphEdgesWithTruncatedStopEvidence.sort((a, b) => byKey(pairKey(a.a, a.b), pairKey(b.a, b.b)));

  // 수축 경로 분류: 두 끝점이 관찰된 관계에서 한 단계 이상 떨어져 있는 경우
  for (const e of graphEdgesWithoutObservedStopEvidence) {
    const variantEndpoint = canonicalOf.has(e.a) || canonicalOf.has(e.b);
    e.classification = variantEndpoint ? 'canonical_variant_endpoint' : 'contracted_path';
    if (variantEndpoint) e.canonicalOf = { a: canonicalOf.get(e.a) ?? e.a, b: canonicalOf.get(e.b) ?? e.b };
  }

  const topology = {
    schema: 'subway-topology-v2',
    source: 'OSM BBBike Seoul.osm.pbf route relations (subway/light_rail/tram/train) consecutive valid stop roles (stop/stop_entry_only/stop_exit_only); node identity is OSM type/id; name normalization used for crosswalk only',
    normalization: { unicode: 'NFKC', trim: true, collapseWhitespace: true, parenthesisSpacing: 'strip whitespace adjacent to parentheses' },
    crosswalkRules: {
      distanceGuardM,
      coordinateToleranceDeg: COORDINATE_TOLERANCE_DEG,
      order: ledger.matchingOrder,
      supportedStopRoles: [...SUPPORTED_STOP_ROLES].sort(),
      unsupportedStopRoleBreaksSegment: true,
    },
    stops: [...stops.values()].sort((a, b) => byKey(a.id, b.id)).map((rec) => ({
      id: rec.id,
      name: rec.name,
      lat: rec.lat,
      lon: rec.lon,
      roles: sortObject(rec.roles),
      lines: uniqSorted(rec.lines),
      graphStation: rec.graphStation,
      crosswalk: rec.crosswalk,
    })),
    stations: stationsOut,
    lines: allLines.map((l) => ({ ...l })),
    edges: topologyEdges,
    connections: sortRecords(connections).map((c) => ({ ...c })),
    rejected: sortRecords(rejected).map((c) => ({ ...c })),
    unresolvedRequired: {
      definition: 'R = consecutive valid-role stop pairs (stop/stop_entry_only/stop_exit_only) whose both endpoints deterministically crosswalk to distinct canonical rail catalog stations; unresolvedRequiredEdges = R minus pairs resolved into traversable topology edges',
      rPairs: required.pairs,
      resolvedIntoEdges: required.resolvedIntoEdges,
      unresolved: required.pairs - required.resolvedIntoEdges,
    },
  };

  const matchedBy = { name: 0, alias: 0, canonical_alias: 0, coordinate_exact: 0, catalog_node_coordinate_exact: 0 };
  for (const rec of stops.values()) {
    if (rec.graphStation && rec.crosswalk) matchedBy[rec.crosswalk.method] = (matchedBy[rec.crosswalk.method] ?? 0) + 1;
  }
  const classificationCounts = {};
  for (const s of stationsOut) classificationCounts[s.topologyClassification] = (classificationCounts[s.topologyClassification] ?? 0) + 1;
  const connectionsByReason = {};
  for (const c of connections) connectionsByReason[c.reason] = (connectionsByReason[c.reason] ?? 0) + 1;
  const connectionReasonSum = Object.values(connectionsByReason).reduce((a, b) => a + b, 0);
  const uniqueConnectionPairs = new Set(connections.map((c) => `${stable(c.a)}|${stable(c.b)}|${c.reason}`)).size;

  const operatorLedger = {};
  for (const l of allLines) {
    const key = l.ref ?? `(no-ref) ${l.name ?? l.id}`;
    const entry = (operatorLedger[key] ??= { networks: new Set(), operators: new Set(), lines: [], officialOperator: null, comparisonStatus: 'no_official_source_in_repo' });
    if (l.network) entry.networks.add(l.network);
    if (l.operator) entry.operators.add(l.operator);
    entry.lines.push(l.id);
  }
  const operatorLedgerOut = Object.fromEntries(
    Object.entries(operatorLedger)
      .sort(([a], [b]) => byKey(a, b))
      .map(([k, v]) => [k, { networks: [...v.networks].sort(byKey), operators: [...v.operators].sort(byKey), lines: v.lines.sort(byKey), officialOperator: v.officialOperator, comparisonStatus: v.comparisonStatus }]),
  );

  const coverage = {
    schema: 'subway-topology-coverage-v2',
    pbf: { ...counts, routeRelations: routeRelations.length, roleHistogram: sortObject(roleHistogram) },
    graph: { schema: worldGraph.schema, stations: stations.length, edges: worldGraph.edges.length, districts: worldGraph.districts.length, aliases: Object.keys(worldGraph.aliases ?? {}).length },
    stationInteriors: {
      schema: stationInteriors.schema,
      stations: stationInteriors.stations.length,
      nullFloors: stationInteriors.stations.filter((s) => s.observed_levels === null).length,
      observedWithNullLevels: stationInteriors.stations.filter((s) => s.observed_levels !== null && (s.observed_levels.above === null || s.observed_levels.below === null)).length,
    },
    aliasLedger: { aliases: ledger.aliases.length, canonicalAliases: ledger.canonicalAliases.length, coordinateExactMatches: ledger.coordinateExactMatches.length, excludedAliases: ledger.excludedAliases.length },
    crosswalk: {
      stopOccurrences,
      unknownStopNames: [...unknownNames.entries()].sort((a, b) => byKey(a[0], b[0])).map(([name, count]) => ({ name, occurrences: count })),
      note: 'crosswalk.stopOccurrences는 역할 멤버 발생 수(occurrence) 기록이고, connections는 관계 내 인접 쌍 기록이다. 두 카운트를 섞지 않는다.',
    },
    stations: {
      graph: stations.length,
      matched: stationsOut.filter((s) => s.stops.length > 0 || s.topologyClassification !== 'rail').length,
      uncovered: stationsOut.filter((s) => s.stops.length === 0 && s.topologyClassification === 'rail').map((s) => s.id),
      matchedBy,
      classificationCounts,
      note: 'matched는 명시적 처분(rail 바인딩, canonical-alias, monorail, nonrail-misclassified)을 모두 포함한다',
    },
    lines: {
      total: allLines.length,
      identifiable: allLines.filter((l) => l.identifiable).length,
      withoutRef: allLines.filter((l) => !l.ref).length,
      withOperatorTag: allLines.filter((l) => l.operator).length,
      gradeObserved: allLines.filter((l) => l.grade.status === 'observed').length,
      geometryWays: allLines.reduce((a, l) => a + l.geometry.wayCount, 0),
      geometryPoints: allLines.reduce((a, l) => a + l.geometry.pointCount, 0),
      geometryMissingNodeCoords: allLines.reduce((a, l) => a + l.geometry.missingNodeCoords, 0),
    },
    edges: {
      graph: worldGraph.edges.length,
      topology: topologyEdges.length,
      graphEdgesWithTraversingEvidence: worldGraph.edges.filter((e) => topologyKeys.has(pairKey(e.a, e.b))).length,
      graph_edges_without_observed_stop_evidence: graphEdgesWithoutObservedStopEvidence,
      graph_edges_with_truncated_stop_evidence: graphEdgesWithTruncatedStopEvidence,
      unresolved_required_edges: [],
      unresolvedRequiredArithmetic: `R=${required.pairs}; resolvedIntoEdges=${required.resolvedIntoEdges}; unresolved=${required.pairs - required.resolvedIntoEdges}; 분류 근거는 topology.unresolvedRequired.definition 참조`,
      observed_topology_pairs_absent_from_graph: topologyEdges.filter((e) => !graphEdgeKeys.has(pairKey(e.a, e.b))).map((e) => ({ a: e.a, b: e.b, sources: e.sources })),
      rejectedSelfAdjacency: rejected.length,
      nontraversableConnectionRecords: connections.length,
    },
    connections: {
      total: connections.length,
      byReason: sortObject(connectionsByReason),
      uniquePairs: uniqueConnectionPairs,
      arithmetic: `${connectionReasonSum} == total ${connections.length} (인접 쌍 기록 기준; 발생 수는 crosswalk.stopOccurrences 참조)`,
    },
    operatorLedger: operatorLedgerOut,
    dongContent: dongIndex ? { files: dongContentFiles, records: dongRecords, stationsWithDong: stationsOut.filter((s) => s.dong !== null).length, stationsWithBuildingRefs: stationsOut.filter((s) => s.buildingRefs.length > 0).length } : null,
  };

  const unmatchedAfter = coverage.stations.uncovered;
  if (unmatchedAfter.length > 0) {
    coverage.stations.dispositionIncomplete = unmatchedAfter;
  }

  return { topology, coverage };
}

function sortObject(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => byKey(a, b)));
}

function loadDongIndex(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort(byKey);
  const byNode = new Map();
  let recordCount = 0;
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    if (data.schema !== 'seoul-region-content.v1') throw new Error(`topology: dong content schema mismatch in ${file}: ${data.schema}`);
    for (const region of data.regions) {
      recordCount += 1;
      const hit = { regionId: region.region_id, name: region.name, via: [], buildingRefs: [] };
      for (const anchor of region.content.anchor_refs ?? []) {
        const m = /^osm:node:(\d+)$/.exec(anchor);
        if (m) register(byNode, Number(m[1]), hit, 'anchor-ref');
      }
      for (const building of region.content.buildings ?? []) {
        const m = /^osm:node:(\d+)$/.exec(building.anchor_ref ?? '');
        if (m) {
          register(byNode, Number(m[1]), hit, 'building-anchor');
          hit.buildingRefs.push({ anchor: building.anchor_ref, name: building.name, observedUse: building.observed_use ?? null, role: building.role ?? null });
        }
      }
    }
  }
  return { fileCount: files.length, recordCount, byNode };
}

function register(byNode, nodeId, hit, via) {
  const entry = byNode.get(nodeId) ?? [];
  const existing = entry.find((e) => e.regionId === hit.regionId);
  if (existing) {
    if (!existing.via.includes(via)) existing.via.push(via);
  } else {
    entry.push({ ...hit, via: [via], buildingRefs: [...hit.buildingRefs] });
  }
  byNode.set(nodeId, entry);
}

function bindDong(dongIndex, nodeIds) {
  for (const nodeId of nodeIds) {
    const hits = dongIndex.byNode.get(Number(nodeId.slice(1)));
    if (hits && hits.length > 0) {
      const hit = hits[0];
      return {
        dong: { regionId: hit.regionId, name: hit.name, status: 'observed', via: hit.via.sort() },
        buildingRefs: hit.buildingRefs.sort((a, b) => byKey(stable(a), stable(b))),
      };
    }
  }
  return null;
}
