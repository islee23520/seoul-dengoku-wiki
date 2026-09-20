// task3 지하철 토폴로지 테스트 v2 — crosswalk 334/334, 명시적 처분, 세그먼트 역할 규칙,
// coverage 카테고리 산술, floors 검증, 결정론. 통합 테스트는 검증된 실입수(실 PBF/그래프)에 고정된다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { assembleFromParsed, buildTopology, loadLedger, normalizeName, SUPPORTED_STOP_ROLES } from './subway-topology.mjs';
import { readRelations } from './osm-pbf-reader.mjs';

const root = new URL('../../..', import.meta.url).pathname;
const PBF_PATH = `${root}GAME-REFERENCE/data/seoul-geography-20260830/osm-current-bbbike/Seoul.osm.pbf`;
const GRAPH_PATH = `${root}GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json`;
const INTERIORS_PATH = `${root}LORE/regions/station-interiors.json`;
const LEDGER_PATH = `${root}TOOL/tools/strategy-map/data/subway-alias-ledger.json`;
const PBF_SHA256 = 'eec1fcac44d0b7b1600c81437ba0a0ea56cd645d16f4eaf55a00786597e0e7e8';

// --- synthetic fixtures -------------------------------------------------------

const gstation = (id, lat = 37.5, lon = 127.0, district = '중구') => ({ id, nameKo: id, nameEn: id, district, lat, lon });
const makeGraph = (stations, { edges = [], aliases = {} } = {}) => ({ schema: 'seoul-world-graph-v1', districts: ['중구'], stations, edges, aliases, source: 'test' });
const makeInteriors = (entries) => ({ schema: 'station-interior.v1', as_of: 'opening-day', count: entries.length, stations: entries });
const interior = (name, observed_levels, observed_levels_source = observed_levels ? 'src' : null) => ({ name, observed_levels, observed_levels_source });
const snode = (id, lat, lon, tags) => ({ id, lat, lon, tags });
const stopMember = (ref, role = 'stop') => ({ type: 'node', ref, role });
const makeRel = (id, tags, members) => ({ id, tags, members });
const makeEntities = (nodes) => {
  const taggedNodes = new Map();
  const nodeCoords = new Map();
  for (const n of nodes) {
    if (Object.keys(n.tags ?? {}).length > 0) taggedNodes.set(n.id, n);
    nodeCoords.set(n.id, { lat: n.lat, lon: n.lon });
  }
  return { taggedNodes, nodeCoords, ways: new Map(), counts: { relations: 0, ways: 0, nodes: nodes.length, taggedNodes: taggedNodes.size } };
};
const baseLedger = { schema: 'subway-alias-ledger-v2', aliases: [], canonicalAliases: [], coordinateExactMatches: [], excludedAliases: [], matchingOrder: [] };
const run = ({ nodes, relations, graph, interiors, ledger = baseLedger, dongContentDir }) =>
  assembleFromParsed({ routeRelations: relations, counts: { relations: relations.length, ways: 0, nodes: nodes.length, taggedNodes: nodes.length }, entities: makeEntities(nodes), worldGraph: graph, stationInteriors: interiors, ledger, dongContentDir });

// --- same-name: distinct stop nodes, self adjacency, canonical variants --------

test('same-name stops stay distinct stop nodes and never merge into a fabricated edge', () => {
  const graph = makeGraph([gstation('신당', 37.5156, 127.0194)]);
  const interiors = makeInteriors([interior('신당', null)]);
  const { topology } = run({
    nodes: [snode(101, 37.51561, 127.01941, { name: '신당', railway: 'stop' }), snode(102, 37.51599, 127.01909, { 'name:ko': '신당', railway: 'stop' })],
    relations: [makeRel(900, { type: 'route', route: 'subway', ref: '2' }, [stopMember(101), stopMember(102)])],
    graph, interiors,
  });
  assert.equal(topology.edges.length, 0, 'consecutive same-station stops must not fabricate an edge');
  assert.equal(topology.rejected.filter((r) => r.kind === 'self_adjacency').length, 1);
  const stops = topology.stops.map((s) => s.id).sort();
  assert.deepEqual(stops, ['n101', 'n102'], 'both OSM stop nodes remain distinct');
});

test('same-name duplicate catalog variant resolves to canonical without duplicate edges', () => {
  const graph = makeGraph([gstation('경복궁', 37.5757873, 126.973526), gstation('경복궁(정부서울청사)', 37.5757585, 126.9735668), gstation('독립문', 37.5745584, 126.9578361)], { edges: [{ a: '경복궁', b: '독립문' }] });
  const interiors = makeInteriors([interior('경복궁', null), interior('경복궁(정부서울청사)', null), interior('독립문', null)]);
  const ledger = { ...baseLedger, canonicalAliases: [{ fromCatalogId: '경복궁(정부서울청사)', toCatalogId: '경복궁', osmName: '경복궁(정부서울청사)', reason: 'duplicate', source: 'rel 443803' }] };
  const { topology, coverage } = run({
    nodes: [snode(201, 37.5757585, 126.9735668, { name: '경복궁(정부서울청사)' }), snode(202, 37.5745584, 126.9578361, { name: '독립문' })],
    relations: [makeRel(901, { type: 'route', route: 'subway', ref: '3' }, [stopMember(201), stopMember(202)])],
    graph, interiors, ledger,
  });
  assert.deepEqual(coverage.stations.classificationCounts, { rail: 2, 'canonical-alias': 1 });
  assert.equal(topology.edges.length, 1);
  assert.equal(topology.edges[0].a, '경복궁');
  assert.ok(!topology.edges.some((e) => e.a === '경복궁(정부서울청사)' || e.b === '경복궁(정부서울청사)'), 'no edge references the noncanonical variant');
  const variant = topology.stations.find((s) => s.id === '경복궁(정부서울청사)');
  assert.equal(variant.topologyClassification, 'canonical-alias');
  assert.equal(variant.disposition.canonical, '경복궁');
  const stop = topology.stops.find((s) => s.id === 'n201');
  assert.equal(stop.crosswalk.method, 'canonical_alias');
});

// --- line identity / traversability -------------------------------------------

const edgePairGraph = () => makeGraph([gstation('동묘앞', 37.5739, 127.0188), gstation('신설동', 37.5753, 127.0207)]);
const edgePairNodes = () => [snode(201, 37.5739, 127.0188, { name: '동묘앞' }), snode(202, 37.5753, 127.0207, { name: '신설동' })];

test('route relation without ref or name yields only nontraversable unknown_line connections', () => {
  const { topology } = run({
    nodes: edgePairNodes(),
    relations: [makeRel(901, { type: 'route', route: 'subway' }, [stopMember(201), stopMember(202)])],
    graph: edgePairGraph(),
    interiors: makeInteriors([interior('동묘앞', null), interior('신설동', null)]),
  });
  assert.equal(topology.edges.length, 0);
  assert.ok(topology.connections.some((c) => c.reason === 'unknown_line' && c.a.graphStation === '동묘앞' && c.b.graphStation === '신설동'));
  assert.ok(topology.connections.every((c) => c.sources[0] === 'r901'));
});

test('route relation with ref produces a traversable edge bound to links and sources', () => {
  const { topology } = run({
    nodes: edgePairNodes(),
    relations: [makeRel(902, { type: 'route', route: 'train', ref: '수인·분당', colour: '#f5a200' }, [stopMember(201), stopMember(202)])],
    graph: edgePairGraph(),
    interiors: makeInteriors([interior('동묘앞', null), interior('신설동', null)]),
  });
  assert.equal(topology.edges.length, 1);
  const edge = topology.edges[0];
  assert.deepEqual([edge.a, edge.b].sort(), ['동묘앞', '신설동']);
  assert.deepEqual(edge.sources, ['r902']);
  assert.equal(edge.links.length, 1);
  assert.deepEqual(edge.links[0].aRole, 'stop');
  assert.deepEqual(edge.links[0].bRole, 'stop');
});

test('unsupported stop-like member breaks the segment: A(stop) B(stop_entry_only) C(stop) has no A-C edge', () => {
  const nodes = [snode(301, 37.5739, 127.0188, { name: 'A역' }), snode(302, 37.5746, 127.0197, { name: 'B역' }), snode(303, 37.5753, 127.0207, { name: 'C역' })];
  const graph = makeGraph([gstation('A역', 37.5739, 127.0188), gstation('B역', 37.5746, 127.0197), gstation('C역', 37.5753, 127.0207)]);
  const interiors = makeInteriors([interior('A역', null), interior('B역', null), interior('C역', null)]);
  const { topology } = run({
    nodes,
    relations: [makeRel(903, { type: 'route', route: 'subway', ref: '1' }, [stopMember(301), stopMember(302, 'stop_position'), stopMember(303)])],
    graph, interiors,
  });
  assert.ok(!topology.edges.some((e) => pairHas(e, 'A역', 'C역')), 'no edge may skip the unsupported stop-like member');
  const reasons = topology.connections.filter((c) => c.reason === 'unsupported_stop_role');
  assert.equal(reasons.length, 2, 'A-B and B-C are recorded as nontraversable');
});

test('directional stop roles are supported and preserved on edge links', () => {
  const nodes = [snode(311, 37.6125508, 127.1040904, { name: '신내' }), snode(312, 37.6174165, 127.0910968, { name: '봉화산' })];
  const graph = makeGraph([gstation('신내', 37.6125508, 127.1040904), gstation('봉화산', 37.6174165, 127.0910968)]);
  const interiors = makeInteriors([interior('신내', null), interior('봉화산', null)]);
  const { topology } = run({
    nodes,
    relations: [makeRel(904, { type: 'route', route: 'subway', ref: '6' }, [stopMember(311, 'stop_entry_only'), stopMember(312)])],
    graph, interiors,
  });
  assert.equal(topology.edges.length, 1);
  const link = topology.edges[0].links[0];
  assert.equal(link.aRole, 'stop_entry_only');
  assert.equal(link.bRole, 'stop');
  assert.ok([...SUPPORTED_STOP_ROLES].includes(link.aRole));
});

// --- floors: unknown-floor / missing-source -------------------------------------

test('unknown-floor interiors keep observed_levels null and are never coerced', () => {
  const graph = makeGraph([gstation('구룡', 37.48693, 127.05946), gstation('대모산입구', 37.4823, 127.0687)]);
  const interiors = makeInteriors([interior('구룡', null), interior('대모산입구', { above: 1, below: 4 })]);
  const { topology } = run({
    nodes: [snode(401, 37.48693, 127.05946, { name: '구룡' }), snode(402, 37.4823, 127.0687, { name: '대모산입구' })],
    relations: [makeRel(905, { type: 'route', route: 'light_rail', ref: '수인·분당' }, [stopMember(401), stopMember(402)])],
    graph, interiors,
  });
  const guryong = topology.stations.find((s) => s.id === '구룡');
  assert.ok('observed_levels' in guryong.floors);
  assert.equal(guryong.floors.observed_levels, null);
  assert.equal(guryong.floorStatus, 'unknown');
  const daemo = topology.stations.find((s) => s.id === '대모산입구');
  assert.deepEqual(daemo.floors.observed_levels, { above: 1, below: 4 });
  assert.equal(daemo.floorStatus, 'observed');
});

test('missing-source observed floors throw an explicit error instead of passing silently', () => {
  const graph = makeGraph([gstation('가짜역', 37.5, 127.0)]);
  const interiors = makeInteriors([interior('가짜역', { above: 0, below: 999 }, null)]);
  assert.throws(() => run({ nodes: [], relations: [], graph, interiors }), /INVALID_OBSERVED_FLOORS/);
});

test('missing-source catalog records without interiors entries keep null floors with unknown status', () => {
  const graph = makeGraph([gstation('부재역', 37.5, 127.0)]);
  const interiors = makeInteriors([]);
  const { topology } = run({ nodes: [], relations: [], graph, interiors });
  const s = topology.stations.find((st) => st.id === '부재역');
  assert.equal(s.floors.observed_levels, null);
  assert.equal(s.floorStatus, 'unknown');
});

// --- fabricated adjacency / unknown connections ---------------------------------

test('same-district proximity without route evidence produces no edge', () => {
  const graph = makeGraph([gstation('동묘A동', 37.5739, 127.0188), gstation('동묘B동', 37.5740, 127.0189)]);
  const interiors = makeInteriors([interior('동묘A동', null), interior('동묘B동', null)]);
  const { topology } = run({
    nodes: [snode(501, 37.5739, 127.0188, { name: '동묘A동' })],
    relations: [makeRel(906, { type: 'route', route: 'subway', ref: '1' }, [stopMember(501)])],
    graph, interiors,
  });
  assert.equal(topology.edges.length, 0);
  assert.equal(topology.connections.length, 0);
});

test('platform members and non-route relations never create edges', () => {
  const { topology } = run({
    nodes: edgePairNodes(),
    relations: [
      makeRel(907, { type: 'route', route: 'subway', ref: '1' }, [stopMember(201, 'platform'), stopMember(202)]),
      makeRel(908, { type: 'route', route: 'bus', ref: '간선' }, [stopMember(201), stopMember(202)]),
      makeRel(909, { type: 'multipolygon' }, [{ type: 'way', ref: 1, role: 'outer' }]),
    ],
    graph: edgePairGraph(),
    interiors: makeInteriors([interior('동묘앞', null), interior('신설동', null)]),
  });
  assert.equal(topology.edges.length, 0);
  assert.ok(!topology.lines.some((l) => l.id === 'r908' || l.id === 'r909'));
});

test('unmatched or missing stop nodes yield nontraversable connections with reasons', () => {
  const graph = makeGraph([gstation('가오리', 37.6402, 127.0133)]);
  const interiors = makeInteriors([interior('가오리', null)]);
  const { topology } = run({
    nodes: [snode(601, 37.6402, 127.0133, { name: '가오리' }), snode(602, 37.655, 127.09, { name: '밖의역' })],
    relations: [
      makeRel(910, { type: 'route', route: 'subway', ref: '4' }, [stopMember(601), stopMember(602)]),
      makeRel(911, { type: 'route', route: 'subway', ref: '4' }, [stopMember(601), stopMember(99999)]),
    ],
    graph, interiors,
  });
  assert.equal(topology.edges.length, 0);
  const reasons = topology.connections.map((c) => c.reason).sort();
  assert.deepEqual(reasons, ['missing_stop_node', 'unknown_station']);
  assert.ok(topology.connections.every((c) => c.traversable === false));
});

test('name match beyond the distance guard is refused, not crosswalked by proximity', () => {
  const graph = makeGraph([gstation('신당', 37.5156, 127.0194)]);
  const interiors = makeInteriors([interior('신당', null)]);
  const { topology, coverage } = run({
    nodes: [snode(701, 37.462, 127.0194, { name: '신당' })],
    relations: [makeRel(912, { type: 'route', route: 'subway', ref: '2' }, [stopMember(701)])],
    graph, interiors,
  });
  assert.equal(topology.edges.length, 0);
  assert.deepEqual(topology.stations.find((s) => s.id === '신당').stops, []);
  assert.equal(coverage.crosswalk.stopOccurrences.byReason.distance_mismatch, 1);
});

test('ambiguous normalized keys reject unless a unique coordinate-exact candidate exists', () => {
  const graph = makeGraph([gstation('쌍둥이(甲)', 37.5, 127.0), gstation('쌍둥이 (甲)', 37.6, 127.1)]);
  const interiors = makeInteriors([interior('쌍둥이(甲)', null), interior('쌍둥이 (甲)', null)]);
  const exact = run({
    nodes: [snode(801, 37.5, 127.0, { name: '쌍둥이(甲)' })],
    relations: [makeRel(913, { type: 'route', route: 'subway', ref: '2' }, [stopMember(801)])],
    graph, interiors,
  });
  assert.equal(exact.topology.stations.find((s) => s.id === '쌍둥이(甲)').stops.length, 1, 'unique coordinate-exact candidate binds');
  const ambiguous = run({
    nodes: [snode(802, 37.55, 127.05, { name: '쌍둥이(甲)' })],
    relations: [makeRel(914, { type: 'route', route: 'subway', ref: '2' }, [stopMember(802)])],
    graph, interiors,
  });
  assert.equal(ambiguous.topology.edges.length, 0);
  assert.equal(ambiguous.coverage.crosswalk.stopOccurrences.byReason.ambiguous_key, 1, 'no unique coordinate match rejects the key');
});

test('alias resolves OSM name to canonical graph id deterministically', () => {
  const graph = makeGraph([gstation('Guro', 37.5007, 126.8824), gstation('Sindorim', 37.5132, 126.8827)], { aliases: { 구로: 'Guro', 신도림: 'Sindorim' } });
  const interiors = makeInteriors([interior('Guro', null), interior('Sindorim', null)]);
  const pbf = {
    nodes: [snode(901, 37.5007, 126.8824, { name: '구로' }), snode(902, 37.5132, 126.8827, { name: '신도림' })],
    relations: [makeRel(915, { type: 'route', route: 'train', ref: '1' }, [stopMember(901), stopMember(902)])],
  };
  const first = run({ nodes: pbf.nodes, relations: pbf.relations, graph, interiors });
  const second = run({ nodes: pbf.nodes, relations: pbf.relations, graph, interiors });
  assert.equal(first.topology.edges.length, 1);
  assert.equal(JSON.stringify(first), JSON.stringify(second), 'assembly is byte-stable');
  assert.equal(first.topology.stops.find((s) => s.id === 'n901').graphStation, 'Guro');
});

test('monorail and nonrail dispositions come only from validated ledger entries', () => {
  const graph = makeGraph([gstation('모노레일승강장', 37.5586955, 127.0214177), gstation('호텔앞', 37.5651052, 126.983621)]);
  const interiors = makeInteriors([interior('모노레일승강장', null), interior('호텔앞', null)]);
  const ledger = {
    ...baseLedger,
    coordinateExactMatches: [
      { catalogId: '모노레일승강장', osmNodeId: 5001, osmName: '모노레일승강장', classification: 'monorail', reason: 'monorail stop_position', source: 'node 5001' },
      { catalogId: '호텔앞', osmNodeId: 5002, osmName: '호텔앞', classification: 'nonrail-misclassified', reason: 'tourism=hotel', source: 'node 5002' },
    ],
  };
  const ok = run({
    nodes: [snode(5001, 37.5586955, 127.0214177, { name: '모노레일승강장', monorail: 'yes', railway: 'stop' }), snode(5002, 37.5651052, 126.983621, { name: '호텔앞' })],
    relations: [],
    graph, interiors, ledger,
  });
  assert.deepEqual(ok.coverage.stations.classificationCounts, { monorail: 1, 'nonrail-misclassified': 1 });
  assert.equal(ok.topology.edges.length, 0);
  assert.throws(() => run({ nodes: [], relations: [], graph, interiors, ledger: { ...ledger, coordinateExactMatches: [ledger.coordinateExactMatches[0]] } }), /absent from PBF/, 'ledger node must exist');
  assert.throws(() => run({ nodes: [snode(5001, 38.0, 127.0, { name: '모노레일승강장' })], relations: [], graph, interiors, ledger: { ...ledger, coordinateExactMatches: [ledger.coordinateExactMatches[0]] } }), /not exact/, 'ledger node coordinates must be exact');
});

// --- integration: exact334 + coverage arithmetic against the real inputs --------

let real;
const loadReal = () => {
  if (!real) {
    const ledger = loadLedger(LEDGER_PATH);
    real = buildTopology({
      pbfPath: PBF_PATH,
      worldGraph: JSON.parse(readFileSync(GRAPH_PATH, 'utf8')),
      stationInteriors: JSON.parse(readFileSync(INTERIORS_PATH, 'utf8')),
      ledger,
      dongContentDir: `${root}LORE/regions/content`,
    });
  }
  return real;
};

test('parser reads the real Seoul PBF with manifest-grade counts and hash', () => {
  const { coverage } = loadReal();
  assert.equal(coverage.pbf.relations, 19013);
  assert.equal(coverage.pbf.routeRelations, 244);
  assert.equal(coverage.pbf.roleHistogram.stop, 5632);
  assert.equal(coverage.pbf.roleHistogram.stop_entry_only, 82);
  assert.equal(coverage.pbf.roleHistogram.stop_exit_only, 53);
  const sha = createHash('sha256').update(readFileSync(PBF_PATH)).digest('hex');
  assert.equal(sha, PBF_SHA256);
});

test('crosswalk covers the exact 334 catalog records with explicit dispositions', () => {
  const { topology, coverage } = loadReal();
  assert.equal(coverage.stations.graph, 334);
  assert.equal(coverage.stations.matched, 334);
  assert.deepEqual(coverage.stations.uncovered, []);
  assert.deepEqual(coverage.stations.classificationCounts, { rail: 327, 'canonical-alias': 3, monorail: 2, 'nonrail-misclassified': 2 });
  const seoul = topology.stations.find((s) => s.id === '서울');
  assert.ok(seoul.stops.length > 0, '서울 binds via exact-name entry/exit stops');
  const variant = topology.stations.find((s) => s.id === '경복궁(정부서울청사)');
  assert.equal(variant.topologyClassification, 'canonical-alias');
  assert.equal(variant.disposition.canonical, '경복궁');
  const monorail = topology.stations.find((s) => s.id === '대현산배수지공원 모노레일 시점승강장');
  assert.deepEqual(monorail.stops, ['n8598757059']);
  assert.equal(monorail.degree, 0, 'monorail record carries no invented subway edge');
  for (const id of ['메트로호텔', '생태공원앞']) {
    const s = topology.stations.find((st) => st.id === id);
    assert.equal(s.topologyClassification, 'nonrail-misclassified');
    assert.equal(s.lines.length, 0);
  }
  const yongsan = topology.stations.find((s) => s.id === '총신대입구(이수)');
  assert.ok(yongsan.stops.includes('n6036160365'));
});

test('unresolved required edges are zero and honest categories are named', () => {
  const { topology, coverage } = loadReal();
  assert.equal(topology.unresolvedRequired.unresolved, 0);
  assert.equal(topology.unresolvedRequired.rPairs, topology.unresolvedRequired.resolvedIntoEdges);
  const go = coverage.edges.graph_edges_without_observed_stop_evidence;
  const byClassification = {};
  for (const e of go) byClassification[e.classification] = (byClassification[e.classification] ?? 0) + 1;
  assert.deepEqual(byClassification, { contracted_path: 2, canonical_variant_endpoint: 4 });
  assert.ok(coverage.edges.graph_edges_without_observed_stop_evidence.some((e) => e.a === '가산디지털단지' && e.b === '광명사거리' && e.classification === 'contracted_path'));
  assert.ok(coverage.edges.graph_edges_without_observed_stop_evidence.some((e) => e.a === '공덕' && e.b === '마곡나루' && e.classification === 'contracted_path'));
  assert.deepEqual(coverage.edges.unresolved_required_edges, []);
  assert.deepEqual(coverage.edges.graph_edges_with_truncated_stop_evidence, []);
  for (const pair of coverage.edges.observed_topology_pairs_absent_from_graph) {
    assert.ok(!pair.a.includes('정부서울청사') && !pair.b.includes('정부서울청사'), 'canonical redirect removes variant pairs');
  }
  assert.ok(coverage.edges.observed_topology_pairs_absent_from_graph.length > 0, 'new source-backed candidates are recorded separately');
  assert.equal(coverage.edges.topology, 436);
  const bonghwa = topology.edges.find((e) => pairHas(e, '봉화산', '신내'));
  assert.ok(bonghwa, '봉화산-신내 is observed via directional stop roles');
  assert.ok(bonghwa.links.some((l) => l.aRole === 'stop_entry_only' || l.bRole === 'stop_entry_only' || l.aRole === 'stop_exit_only' || l.bRole === 'stop_exit_only'));
});

test('null floors are preserved across the real 334 (69 unknown)', () => {
  const { topology } = loadReal();
  assert.equal(topology.stations.filter((s) => s.floors.observed_levels === null).length, 69);
});

test('connection records distinguish unique pairs from stop occurrences', () => {
  const { coverage } = loadReal();
  assert.equal(coverage.connections.total, 2573);
  const sum = Object.values(coverage.connections.byReason).reduce((a, b) => a + b, 0);
  assert.equal(sum, coverage.connections.total, 'byReason arithmetic sums to the connection total');
  assert.deepEqual(coverage.connections.byReason, { missing_stop_node: 1040, unknown_station: 1527, unnamed_stop: 6 });
  assert.ok(coverage.connections.uniquePairs <= coverage.connections.total);
  assert.equal(coverage.crosswalk.stopOccurrences.total, 5767);
  assert.equal(coverage.crosswalk.stopOccurrences.resolved, 3180);
  assert.deepEqual(coverage.crosswalk.stopOccurrences.byRole, { stop: 5632, stop_entry_only: 82, stop_exit_only: 53 });
  assert.equal(coverage.crosswalk.stopOccurrences.byReason.missing_stop_node, 1090);
});

test('byte-stable outputs carry repo-relative inputs only', () => {
  const { topology } = loadReal();
  for (const key of Object.keys(topology.inputs ?? {})) {
    const input = topology.inputs[key];
    assert.ok(!input.path.startsWith('/'), `input path must be repo-relative: ${input.path}`);
  }
  for (const line of topology.lines) {
    assert.ok(line.geometry.wayCount === line.geometry.ways.length);
    assert.ok(line.grade.status === 'observed' || line.grade.status === 'unknown');
  }
  const raw = JSON.stringify(topology);
  assert.ok(!raw.includes('/Users/'), 'no absolute user paths anywhere in topology');
});

test('every traversable edge binds lines, sources, and supported roles', () => {
  const { topology } = loadReal();
  assert.equal(topology.edges.length, 436);
  for (const edge of topology.edges) {
    assert.ok(edge.links.length > 0);
    assert.ok(edge.sources.length > 0);
    for (const link of edge.links) {
      assert.ok(SUPPORTED_STOP_ROLES.has(link.aRole));
      assert.ok(SUPPORTED_STOP_ROLES.has(link.bRole));
    }
  }
  assert.equal(topology.stops.length, 1370);
  assert.equal(topology.lines.length, 244);
  assert.equal(topology.lines.filter((l) => l.identifiable).length, 244);
  assert.equal(topology.lines.reduce((a, l) => a + l.geometry.pointCount, 0), 96999);
  assert.equal(topology.lines.reduce((a, l) => a + l.geometry.missingNodeCoords, 0), 0);
});

test('dong content crosswalk is bounded, sourced, and sparse', () => {
  const { coverage } = loadReal();
  assert.equal(coverage.dongContent.files, 25);
  assert.equal(coverage.dongContent.records, 427);
  assert.equal(coverage.dongContent.stationsWithDong, 2);
});

// --- CLI contract -----------------------------------------------------------------

test('CLI rejects unknown, duplicate, and valueless options', async () => {
  const { main } = await import('./build-subway-topology.mjs');
  assert.throws(() => main(['--bogus', 'x']), /unknown option --bogus/);
  assert.throws(() => main(['--out', '/tmp/a', '--out', '/tmp/b']), /duplicate option --out/);
  assert.throws(() => main(['--out']), /requires a value/);
  assert.throws(() => main(['--bundle', '/nonexistent-dir-xyz']), /path does not exist/);
});

test('normalizeName applies NFKC, whitespace collapse, and parenthesis spacing only', () => {
  assert.equal(normalizeName('총신대입구 (이수)'), '총신대입구(이수)');
  assert.equal(normalizeName('  A   B ( C ) D '), 'A B(C)D');
  assert.equal(normalizeName('ｄｏｎｇ ｉｌ'), 'dong il');
});

function pairHas(edge, a, b) {
  return (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a);
}
