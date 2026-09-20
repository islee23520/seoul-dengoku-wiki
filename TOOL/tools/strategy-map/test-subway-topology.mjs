import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { assemble, parsePbf } from './build-subway-topology.mjs';

const root = new URL('../../..', import.meta.url).pathname;
const PBF_PATH = `${root}GAME-REFERENCE/data/seoul-geography-20260830/osm-current-bbbike/Seoul.osm.pbf`;
const GRAPH_PATH = `${root}GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json`;
const INTERIORS_PATH = `${root}LORE/regions/station-interiors.json`;
const PBF_SHA256 = 'eec1fcac44d0b7b1600c81437ba0a0ea56cd645d16f4eaf55a00786597e0e7e8';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

// --- synthetic fixtures -----------------------------------------------------

const gstation = (id, lat = 37.5, lon = 127.0, district = '중구') => ({ id, nameKo: id, nameEn: id, district, lat, lon });
const makeGraph = (stations, { edges = [], aliases = {} } = {}) => ({ schema: 'seoul-world-graph-v1', districts: ['중구'], stations, edges, aliases, source: 'test' });
const makeInteriors = (entries) => ({ schema: 'station-interior.v1', as_of: 'opening-day', count: entries.length, stations: entries });
const interior = (name, observed_levels) => ({ name, observed_levels, observed_levels_source: observed_levels ? 'src' : null });

const snode = (id, lat, lon, tags) => ({ id, lat, lon, tags });
const makePbf = (nodes, relations) => ({
  nodes: new Map(nodes.map((n) => [n.id, n])),
  relations,
  counts: { relations: relations.length, ways: 0, nodes: nodes.length, taggedNodes: nodes.length, denseNodes: nodes.length },
});

// --- unit: same-name IDs stay distinct --------------------------------------

test('same-name stops remain distinct topology nodes and never merge into a fabricated edge', () => {
  const graph = makeGraph([gstation('신당', 37.5156, 127.0194)]);
  const interiors = makeInteriors([interior('신당', { above: 1, below: 3 })]);
  const pbf = makePbf(
    [snode(101, 37.51561, 127.01941, { name: '신당', railway: 'station' }), snode(102, 37.51599, 127.01909, { 'name:ko': '신당', railway: 'station' })],
    [{ id: 900, tags: { type: 'route', route: 'subway', ref: '2' }, members: [{ type: 'node', ref: 101, role: 'stop' }, { type: 'node', ref: 102, role: 'stop' }] }],
  );
  const { topology } = assemble({ pbf, worldGraph: graph, stationInteriors: interiors });
  const station = topology.stations.find((s) => s.id === '신당');
  assert.ok(station, 'matched station present');
  assert.deepEqual([...station.osmStops].sort(), ['n101', 'n102'], 'two distinct OSM stops crosswalk to one graph id');
  assert.notEqual(station.osmStops[0], station.osmStops[1]);
  assert.equal(topology.edges.length, 0, 'consecutive same-graph-id stops must not produce an edge');
  assert.ok(topology.rejected.some((r) => r.kind === 'self_adjacency' && r.station === '신당'), 'self adjacency recorded as rejected, not fabricated');
});

// --- unit: traversable edge requires line identity + source -----------------

const edgePairGraph = () => makeGraph([gstation('동묘앞', 37.5739, 127.0188), gstation('신설동', 37.5753, 127.0207)]);
const edgePairNodes = () => [
  snode(201, 37.5739, 127.0188, { name: '동묘앞', railway: 'station' }),
  snode(202, 37.5753, 127.0207, { name: '신설동', railway: 'station' }),
];

test('route relation without ref or name yields only nontraversable connections', () => {
  const graph = edgePairGraph();
  const interiors = makeInteriors([interior('동묘앞', null), interior('신설동', { above: 0, below: 2 })]);
  const pbf = makePbf(edgePairNodes(), [
    { id: 901, tags: { type: 'route', route: 'subway' }, members: [{ type: 'node', ref: 201, role: 'stop' }, { type: 'node', ref: 202, role: 'stop' }] },
  ]);
  const { topology } = assemble({ pbf, worldGraph: graph, stationInteriors: interiors });
  assert.equal(topology.edges.length, 0, 'no traversable edge without line identity');
  assert.ok(topology.connections.some((c) => c.reason === 'unknown_line' && c.a.graphId === '동묘앞' && c.b.graphId === '신설동'));
  assert.ok(topology.connections.every((c) => c.sources[0] === 'r901'), 'nontraversable connection still records its source relation');
});

test('route relation with ref produces a traversable edge bound to ref and source', () => {
  const graph = edgePairGraph();
  const interiors = makeInteriors([interior('동묘앞', null), interior('신설동', null)]);
  const pbf = makePbf(edgePairNodes(), [
    { id: 902, tags: { type: 'route', route: 'train', ref: '수인·분당', colour: '#f5a200' }, members: [{ type: 'node', ref: 201, role: 'stop' }, { type: 'node', ref: 202, role: 'stop' }] },
  ]);
  const { topology } = assemble({ pbf, worldGraph: graph, stationInteriors: interiors });
  assert.equal(topology.edges.length, 1);
  const edge = topology.edges[0];
  assert.deepEqual([edge.a, edge.b].sort(), ['동묘앞', '신설동']);
  assert.deepEqual(edge.sources, ['r902']);
  assert.deepEqual(edge.lines, ['r902']);
  const line = topology.lines.find((l) => l.id === 'r902');
  assert.equal(line.ref, '수인·분당');
  assert.equal(line.colour, '#f5a200');
  assert.equal(line.identifiable, true);
});

// --- unit: null floor preserved ---------------------------------------------

test('null observed floors stay null and are never coerced', () => {
  const graph = makeGraph([gstation('구룡', 37.48693, 127.05946), gstation('대모산입구', 37.4823, 127.0687)]);
  const interiors = makeInteriors([interior('구룡', null), interior('대모산입구', { above: 1, below: 4 })]);
  const pbf = makePbf(
    [snode(301, 37.48693, 127.05946, { name: '구룡' }), snode(302, 37.4823, 127.0687, { name: '대모산입구' })],
    [{ id: 903, tags: { type: 'route', route: 'light_rail', ref: '수인·분당' }, members: [{ type: 'node', ref: 301, role: 'stop' }, { type: 'node', ref: 302, role: 'stop' }] }],
  );
  const { topology } = assemble({ pbf, worldGraph: graph, stationInteriors: interiors });
  const guryong = topology.stations.find((s) => s.id === '구룡');
  assert.ok('observed_levels' in guryong.floors, 'floors key present');
  assert.equal(guryong.floors.observed_levels, null, 'null preserved verbatim');
  assert.equal(guryong.floors.observed_levels_source, null);
  const daemosan = topology.stations.find((s) => s.id === '대모산입구');
  assert.deepEqual(daemosan.floors.observed_levels, { above: 1, below: 4 });
});

// --- unit: fabricated / dong adjacency rejected ------------------------------

test('same-district proximity without route evidence produces no edge', () => {
  const graph = makeGraph([gstation('동묘근처A동', 37.5739, 127.0188), gstation('동묘근처B동', 37.5740, 127.0189)]);
  const interiors = makeInteriors([interior('동묘근처A동', null), interior('동묘근처B동', null)]);
  const pbf = makePbf(
    [snode(401, 37.5739, 127.0188, { name: '동묘근처A동' })],
    [{ id: 904, tags: { type: 'route', route: 'subway', ref: '1' }, members: [{ type: 'node', ref: 401, role: 'stop' }] }],
  );
  const { topology } = assemble({ pbf, worldGraph: graph, stationInteriors: interiors });
  assert.equal(topology.edges.length, 0, 'no relation evidence, no edge');
  assert.equal(topology.connections.length, 0);
});

test('platform members and non-route relations never create edges', () => {
  const graph = edgePairGraph();
  const interiors = makeInteriors([interior('동묘앞', null), interior('신설동', null)]);
  const pbf = makePbf(edgePairNodes(), [
    { id: 905, tags: { type: 'route', route: 'subway', ref: '1' }, members: [{ type: 'node', ref: 201, role: 'platform' }, { type: 'node', ref: 202, role: 'stop' }] },
    { id: 906, tags: { type: 'route', route: 'bus', ref: '간선' }, members: [{ type: 'node', ref: 201, role: 'stop' }, { type: 'node', ref: 202, role: 'stop' }] },
    { id: 907, tags: { type: 'multipolygon' }, members: [{ type: 'way', ref: 1, role: 'outer' }] },
  ]);
  const { topology } = assemble({ pbf, worldGraph: graph, stationInteriors: interiors });
  assert.equal(topology.edges.length, 0, 'no stop chain, no edge; bus and multipolygon ignored');
  assert.ok(!topology.lines.some((l) => l.id === 'r906' || l.id === 'r907'));
});

// --- unit: unknown connections are nontraversable ----------------------------

test('unmatched or missing stop nodes yield nontraversable connections with reasons', () => {
  const graph = makeGraph([gstation('가오리', 37.6402, 127.0133)]);
  const interiors = makeInteriors([interior('가오리', null)]);
  const pbf = makePbf(
    [snode(501, 37.6402, 127.0133, { name: '가오리' }), snode(502, 37.6550, 127.0900, { name: '양평읍외부' })],
    [
      { id: 908, tags: { type: 'route', route: 'subway', ref: '4' }, members: [{ type: 'node', ref: 501, role: 'stop' }, { type: 'node', ref: 502, role: 'stop' }] },
      { id: 909, tags: { type: 'route', route: 'subway', ref: '4' }, members: [{ type: 'node', ref: 501, role: 'stop' }, { type: 'node', ref: 99999, role: 'stop' }] },
    ],
  );
  const { topology } = assemble({ pbf, worldGraph: graph, stationInteriors: interiors });
  assert.equal(topology.edges.length, 0);
  const reasons = topology.connections.map((c) => c.reason).sort();
  assert.deepEqual(reasons, ['missing_stop_node', 'unknown_station']);
  assert.ok(topology.connections.every((c) => c.traversable === false));
});

test('name match beyond the distance limit is refused, not crosswalked', () => {
  const graph = makeGraph([gstation('신당', 37.5156, 127.0194)]);
  const interiors = makeInteriors([interior('신당', null)]);
  const pbf = makePbf(
    [snode(701, 37.4620, 127.0194, { name: '신당' })],
    [{ id: 911, tags: { type: 'route', route: 'subway', ref: '2' }, members: [{ type: 'node', ref: 701, role: 'stop' }] }],
  );
  const { topology, coverage } = assemble({ pbf, worldGraph: graph, stationInteriors: interiors });
  assert.equal(topology.edges.length, 0);
  const station = topology.stations.find((s) => s.id === '신당');
  assert.deepEqual(station.osmStops, [], 'far-away namesake must not bind to the graph station');
  assert.equal(coverage.crosswalk.unmatchedByReason.distance_mismatch, 1);
});

// --- unit: aliases resolve; determinism --------------------------------------

test('alias resolves OSM name to canonical graph id deterministically', () => {
  const graph = makeGraph([gstation('Guro', 37.5007, 126.8824), gstation('Sindorim', 37.5132, 126.8827)], { aliases: { 구로: 'Guro', 신도림: 'Sindorim' } });
  const interiors = makeInteriors([interior('Guro', null), interior('Sindorim', null)]);
  const pbf = makePbf(
    [snode(601, 37.5007, 126.8824, { name: '구로' }), snode(602, 37.5132, 126.8827, { name: '신도림' })],
    [{ id: 910, tags: { type: 'route', route: 'train', ref: '1' }, members: [{ type: 'node', ref: 601, role: 'stop' }, { type: 'node', ref: 602, role: 'stop' }] }],
  );
  const first = assemble({ pbf, worldGraph: graph, stationInteriors: interiors });
  const second = assemble({ pbf, worldGraph: graph, stationInteriors: interiors });
  assert.equal(first.topology.edges.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)), 'assemble is deterministic');
  const guro = first.topology.stations.find((s) => s.id === 'Guro');
  assert.deepEqual(guro.osmStops, ['n601']);
});

// --- integration: exact334 crosswalk/coverage against the real inputs --------

let real;
const loadReal = () => {
  if (!real) real = { pbf: parsePbf(PBF_PATH), worldGraph: readJson(GRAPH_PATH), stationInteriors: readJson(INTERIORS_PATH) };
  return real;
};

test('parser reads the real Seoul PBF with manifest-grade counts and hash', () => {
  const { pbf } = loadReal();
  assert.equal(pbf.counts.relations, 19013);
  assert.equal(pbf.counts.routeRelations, 244);
  assert.equal(pbf.counts.stopMembers, 5632);
  const sha = createHash('sha256').update(readFileSync(PBF_PATH)).digest('hex');
  assert.equal(sha, PBF_SHA256);
});

test('crosswalk covers the exact 334-station graph and preserves 69 null floors', () => {
  const { pbf, worldGraph, stationInteriors } = loadReal();
  const { topology, coverage } = assemble({ pbf, worldGraph, stationInteriors });
  assert.equal(coverage.stations.graph, 334);
  assert.equal(coverage.stations.matched + coverage.stations.uncovered.length, 334);
  assert.equal(topology.stations.length, 334);
  const nullFloors = topology.stations.filter((s) => s.floors.observed_levels === null).length;
  assert.equal(nullFloors, 69, 'every null interior floor preserved');
  assert.equal(topology.edges.length > 0, true, 'real relations yield traversable edges');
  assert.ok(topology.edges.every((e) => e.sources.length > 0 && e.lines.length > 0), 'every traversable edge binds line and source');
});

// --- adversarial: malformed PBF inputs ---------------------------------------

test('malformed PBF inputs fail loudly', () => {
  const realBytes = readFileSync(PBF_PATH);
  assert.throws(() => parsePbf(Buffer.from('not a pbf at all')), Error, 'garbage rejected');
  assert.throws(() => parsePbf(realBytes.subarray(0, 7)), Error, 'truncated length prefix rejected');
  assert.throws(() => parsePbf(realBytes.subarray(0, 400)), Error, 'truncated blob rejected');
});
