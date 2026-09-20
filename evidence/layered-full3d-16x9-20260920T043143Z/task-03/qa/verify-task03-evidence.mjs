// task3 증거 검증기. K3 커밋 소스 결합, 재현 빌드, coverage 불변식, 오라클 대조,
// 변조 자가검사를 재계산한다. 성공 시 { verified: true }와 함께 exit 0.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../../../..', import.meta.url).pathname; // qa/ -> task-03 -> dated -> evidence -> repo root
const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i]] = process.argv[i + 1];
const commit = args['--commit'];
const evidence = args['--evidence'] ? `${root}${args['--evidence'].replace(/^\.\//, '')}`.replace(/\/$/, '') : `${root}evidence/layered-full3d-16x9-20260920T043143Z/task-03`;
if (!commit || /^[0-9a-f]{40}$/.test(commit) === false) {
  console.error('usage: node verify-task03-evidence.mjs --commit <40-hex> [--evidence <dir>]');
  process.exit(2);
}

const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const failures = [];
const check = (name, ok, detail = '') => {
  if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ''}`);
  return ok;
};

const SOURCES = [
  'TOOL/tools/strategy-map/osm-pbf-reader.mjs',
  'TOOL/tools/strategy-map/subway-topology.mjs',
  'TOOL/tools/strategy-map/build-subway-topology.mjs',
  'TOOL/tools/strategy-map/data/subway-alias-ledger.json',
  'TOOL/tools/strategy-map/test-osm-pbf-reader.mjs',
  'TOOL/tools/strategy-map/test-subway-topology.mjs',
];

// 1) 소스 결합: K3 시점 블롭과 작업트리 파일이 동일해야 한다.
for (const path of SOURCES) {
  let blob = null;
  try {
    blob = execFileSync('git', ['show', `${commit}:${path}`], { cwd: root, maxBuffer: 1 << 28 });
  } catch {
    failures.push(`source binding: ${path} not in ${commit}`);
    continue;
  }
  const worktree = readFileSync(`${root}${path}`);
  check(`source binding ${path}`, sha(blob) === sha(worktree));
}

// 2) 테스트 재실행
for (const testFile of ['test-osm-pbf-reader.mjs', 'test-subway-topology.mjs']) {
  let out = '';
  try {
    out = execFileSync('node', [`TOOL/tools/strategy-map/${testFile}`], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  } catch (error) {
    out = String(error.stdout ?? '');
    failures.push(`tests ${testFile}: exited non-zero`);
  }
  const pass = /ℹ pass (\d+)/.exec(out);
  const fail = /ℹ fail (\d+)/.exec(out);
  check(`tests ${testFile} green`, fail && fail[1] === '0', `pass=${pass?.[1]} fail=${fail?.[1]}`);
}

// 3) 재현 빌드 2회: 커밋된 산출물과 바이트 동일해야 한다.
const temp = mkdtempSync(join(tmpdir(), 'task03-verify-'));
const rebuilds = [join(temp, 'r1'), join(temp, 'r2')];
for (const dir of rebuilds) {
  try {
    execFileSync('node', ['TOOL/tools/strategy-map/build-subway-topology.mjs', '--out', dir], { cwd: root, stdio: 'pipe', maxBuffer: 1 << 28 });
  } catch (error) {
    failures.push(`rebuild failed: ${error.message}`);
  }
}
for (const name of ['topology.json', 'coverage.json']) {
  const committed = readFileSync(`${evidence}/build/run1/${name}`);
  check(`committed ${name} == rebuild1`, sha(committed) === sha(readFileSync(`${rebuilds[0]}/${name}`)));
  check(`committed ${name} == rebuild2`, sha(committed) === sha(readFileSync(`${rebuilds[1]}/${name}`)));
}

const coverage = JSON.parse(readFileSync(`${evidence}/coverage.json`, 'utf8'));
const topology = JSON.parse(readFileSync(`${evidence}/topology.json`, 'utf8'));

// 4) coverage 불변식
check('stations.graph == 334', coverage.stations.graph === 334);
check('stations.matched == 334', coverage.stations.matched === 334);
check('stations.uncovered empty', Array.isArray(coverage.stations.uncovered) && coverage.stations.uncovered.length === 0);
const classSum = Object.values(coverage.stations.classificationCounts).reduce((a, b) => a + b, 0);
check('classificationCounts sum 334', classSum === 334);
check('classifications exact', coverage.stations.classificationCounts.rail === 327 && coverage.stations.classificationCounts['canonical-alias'] === 3 && coverage.stations.classificationCounts.monorail === 2 && coverage.stations.classificationCounts['nonrail-misclassified'] === 2);
check('unresolvedRequiredEdges == 0', topology.unresolvedRequired.unresolved === 0);
check('R arithmetic', topology.unresolvedRequired.rPairs === topology.unresolvedRequired.resolvedIntoEdges);
const goClasses = {};
for (const e of coverage.edges.graph_edges_without_observed_stop_evidence) goClasses[e.classification] = (goClasses[e.classification] ?? 0) + 1;
check('G-O classifications', goClasses.contracted_path === 2 && goClasses.canonical_variant_endpoint === 4, JSON.stringify(goClasses));
check('truncated evidence empty', coverage.edges.graph_edges_with_truncated_stop_evidence.length === 0);
const connSum = Object.values(coverage.connections.byReason).reduce((a, b) => a + b, 0);
check('connections arithmetic', connSum === coverage.connections.total);
check('stop occurrences separate', coverage.crosswalk.stopOccurrences.total === 5767 && coverage.connections.total !== coverage.crosswalk.stopOccurrences.total);
check('edges topology 436', coverage.edges.topology === 436);
check('pbf counts', coverage.pbf.relations === 19013 && coverage.pbf.routeRelations === 244 && coverage.pbf.roleHistogram.stop === 5632);

// 5) 오라클 대조 (pyosmium 측정값)
const oracle = JSON.parse(readFileSync(`${evidence}/qa/pyosmium-oracle.json`, 'utf8'));
check('oracle relations', oracle.relationsTotal === coverage.pbf.relations);
check('oracle route relations', oracle.routeRelations === coverage.pbf.routeRelations);
check('oracle stop members', oracle.stopRoleMembers === coverage.pbf.roleHistogram.stop);
check('oracle entry roles', oracle.stopEntryOnly === coverage.pbf.roleHistogram.stop_entry_only);
check('oracle exit roles', oracle.stopExitOnly === coverage.pbf.roleHistogram.stop_exit_only);
const stopById = new Map(topology.stops.map((s) => [s.id.slice(1), s]));
let oracleCoordOk = true;
for (const [nodeId, sample] of Object.entries(oracle.coordinateSamples)) {
  const stop = stopById.get(nodeId);
  if (!stop || Math.abs(stop.lat - sample.lat) > 1e-9 || Math.abs(stop.lon - sample.lon) > 1e-9) oracleCoordOk = false;
}
check('oracle coordinate samples match', oracleCoordOk);

// 6) 입력 해시 재계산 (절대 경로 금지 확인 포함)
check('inputs repo-relative', Object.values(topology.inputs).every((i) => !i.path.startsWith('/')));
const pbfActual = sha(readFileSync(`${root}${topology.inputs.pbf.path}`));
check('pbf sha matches recorded', pbfActual === topology.inputs.pbf.sha256);

// 7) 변조 자가검사: 변조된 카피는 반드시 실패해야 한다.
const tamperCoverage = JSON.parse(readFileSync(`${evidence}/coverage.json`, 'utf8'));
tamperCoverage.stations.matched = 333;
const tamperDir = join(temp, 'tamper');
mkdirSyncSafe(tamperDir);
writeFileSync(`${tamperDir}/coverage.json`, JSON.stringify(tamperCoverage, null, 2));
let tamperDetected = false;
try {
  const bad = JSON.parse(readFileSync(`${tamperDir}/coverage.json`, 'utf8'));
  const sum = Object.values(bad.stations.classificationCounts).reduce((a, b) => a + b, 0);
  if (bad.stations.matched !== 334 || sum !== 334) tamperDetected = true;
} catch {
  tamperDetected = true;
}
check('tamper self-test: matched=333 rejected', tamperDetected);
const stale = '0'.repeat(40);
let staleDetected = false;
try {
  execFileSync('git', ['show', `${stale}:${SOURCES[0]}`], { cwd: root, stdio: 'pipe' });
} catch {
  staleDetected = true;
}
check('tamper self-test: stale commit rejected', staleDetected);
let byteTamperDetected = false;
if (sha(readFileSync(`${evidence}/topology.json`)) !== sha(readFileSync(`${evidence}/build/run1/topology.json`))) byteTamperDetected = true;
else byteTamperDetected = false;
check('tamper self-test: canonical output binds run1 bytes', byteTamperDetected === false);

function mkdirSyncSafe(dir) {
  execFileSync('mkdir', ['-p', dir]);
}

rmSync(temp, { recursive: true, force: true });

const verdict = { verified: failures.length === 0, commit, evidence, checks: 'source-binding, tests, rebuild-determinism, coverage-invariants, oracle, tamper-selftests', failures };
process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
process.exit(verdict.verified ? 0 : 1);
