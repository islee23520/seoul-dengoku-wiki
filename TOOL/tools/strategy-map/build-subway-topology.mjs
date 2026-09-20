// 지하철 토폴로지 생성 CLI (thin). 파싱은 osm-pbf-reader.mjs, 조립은 subway-topology.mjs.
// 계획 플래그: --bundle <지리 번호 디렉터리> --stations <세계그래프.json>. 알 수 없는
// 옵션은 거절하고, 값이 주어지면 기본값으로 조용히 대체하지 않는다.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTopology, loadLedger } from './subway-topology.mjs';

const repoRoot = () => resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha256File = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const sha256Dir = (path) => {
  const digest = createHash('sha256');
  for (const file of readdirSync(path).filter((f) => f.endsWith('.json')).sort()) digest.update(readFileSync(join(path, file)));
  return digest.digest('hex');
};

const KNOWN_FLAGS = new Set(['--bundle', '--stations', '--interiors', '--dong-content', '--out', '--distance-guard-m']);

export function main(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) throw new Error(`cli: unexpected positional argument ${token}`);
    if (!KNOWN_FLAGS.has(token)) throw new Error(`cli: unknown option ${token} (known: ${[...KNOWN_FLAGS].sort().join(' ')})`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`cli: option ${token} requires a value`);
    if (args[token] !== undefined) throw new Error(`cli: duplicate option ${token}`);
    args[token] = value;
    i += 1;
  }
  const root = repoRoot();
  const bundleDir = args['--bundle'] ? resolve(args['--bundle']) : join(root, 'GAME-REFERENCE', 'data', 'seoul-geography-20260830');
  const pbfPath = join(bundleDir, 'osm-current-bbbike', 'Seoul.osm.pbf');
  const graphPath = args['--stations'] ? resolve(args['--stations']) : join(root, 'GAME', 'Assets', 'Janseon', 'Data', 'Content', 'SeoulWorldGraph.json');
  const interiorsPath = args['--interiors'] ? resolve(args['--interiors']) : join(root, 'LORE', 'regions', 'station-interiors.json');
  const dongContentDir = args['--dong-content'] ? resolve(args['--dong-content']) : join(root, 'LORE', 'regions', 'content');
  const ledgerPath = join(root, 'TOOL', 'tools', 'strategy-map', 'data', 'subway-alias-ledger.json');
  const outDir = args['--out'] ? resolve(args['--out']) : join(root, 'evidence', `subway-topology-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`);
  const distanceGuardM = args['--distance-guard-m'] ? Number(args['--distance-guard-m']) : undefined;
  if (distanceGuardM !== undefined && (!Number.isFinite(distanceGuardM) || distanceGuardM <= 0)) throw new Error(`cli: invalid --distance-guard-m ${args['--distance-guard-m']}`);
  for (const [label, path, wantDir] of [
    ['--bundle', bundleDir, true],
    ['--stations', graphPath, false],
    ['--interiors', interiorsPath, false],
    ['--dong-content', dongContentDir, true],
  ]) {
    if (!existsSync(path)) throw new Error(`cli: ${label} path does not exist: ${path}`);
    const isDir = statSync(path).isDirectory();
    if (wantDir && !isDir) throw new Error(`cli: ${label} expects a directory: ${path}`);
    if (!wantDir && isDir) throw new Error(`cli: ${label} expects a file: ${path}`);
  }
  if (!existsSync(pbfPath)) throw new Error(`cli: bundle is missing ${relative(root, pbfPath)}`);

  const ledger = loadLedger(ledgerPath);
  const worldGraph = JSON.parse(readFileSync(graphPath, 'utf8'));
  const stationInteriors = JSON.parse(readFileSync(interiorsPath, 'utf8'));
  const { topology, coverage } = buildTopology({ pbfPath, worldGraph, stationInteriors, ledger, dongContentDir, ...(distanceGuardM !== undefined ? { distanceGuardM } : {}) });

  // 바이트 안정 출력에는 저장소 상대 경로만 넣는다(절대 경로 금지).
  const inputs = {
    pbf: { path: relative(root, pbfPath), bytes: statSync(pbfPath).size, sha256: sha256File(pbfPath) },
    worldGraph: { path: relative(root, graphPath), sha256: sha256File(graphPath) },
    stationInteriors: { path: relative(root, interiorsPath), sha256: sha256File(interiorsPath) },
    aliasLedger: { path: relative(root, ledgerPath), sha256: sha256File(ledgerPath) },
    dongContent: { path: relative(root, dongContentDir), sha256: sha256Dir(dongContentDir) },
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
    stopOccurrences: coverage.crosswalk.stopOccurrences.total,
    lines: coverage.lines.total,
    stations: coverage.stations.graph,
    matched: coverage.stations.matched,
    uncovered: coverage.stations.uncovered.length,
    classificationCounts: coverage.stations.classificationCounts,
    edges: coverage.edges.topology,
    unresolvedRequiredEdges: topology.unresolvedRequired.unresolved,
    graphEdgesWithoutObservedStopEvidence: coverage.edges.graph_edges_without_observed_stop_evidence.length,
    nontraversableConnectionRecords: coverage.connections.total,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
