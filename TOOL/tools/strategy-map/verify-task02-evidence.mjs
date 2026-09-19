import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (message) => { throw new TypeError(message); };
const exactKeys = (object, expected, label) => {
  if (object === null || typeof object !== 'object' || Array.isArray(object)) fail(`${label} must be object`);
  if (JSON.stringify(Object.keys(object).sort()) !== JSON.stringify([...expected].sort())) fail(`${label} keys mismatch`);
};
const hex = (value, size) => typeof value === 'string' && new RegExp(`^[0-9a-f]{${size}}$`).test(value);
const git = (repoRoot, args, encoding = 'utf8') => execFileSync('git', ['-C', repoRoot, ...args], {
  encoding, stdio: ['ignore', 'pipe', 'ignore'],
});

const sourcePaths = Object.freeze([
  'GAME/Assets/Janseon/Core/PlaceId.cs',
  'GAME/Assets/Tests/EditMode/PlaceIdentityTests.cs',
]);
const contextKeys = Object.freeze([
  'schema_version', 'implementation_commit', 'implementation_tree', 'project_path',
  'head_before', 'tree_before', 'tracked_status_before', 'head_after', 'tree_after',
  'tracked_status_after', 'unity_binary', 'unity_version', 'run_nonce',
  'place_identity_xml_sha256', 'place_identity_log_sha256', 'manual_sha256',
  'route_xml_sha256', 'route_log_sha256',
]);
const manualKeys = Object.freeze([
  'schema_version', 'behavior_contract_version', 'run_nonce', 'runtime_source_manifest_sha256',
  'runtime_source_files', 'canonical_id', 'unknown_observed_level', 'observed_level',
  'identity_equal', 'hash_equal', 'different_platform_id', 'different_platform_unequal',
  'conflict_error', 'catalog_fingerprint_before', 'catalog_fingerprint_after', 'catalog_unchanged',
]);

export const verifyTask02Provenance = (repoRoot, contextPath, manualPath, xmlPath, logPath, routeXmlPath, routeLogPath) => {
  const context = JSON.parse(readFileSync(contextPath, 'utf8'));
  const manualBytes = readFileSync(manualPath);
  const manual = JSON.parse(manualBytes.toString('utf8'));
  const xml = readFileSync(xmlPath);
  const log = readFileSync(logPath);
  const routeXml = readFileSync(routeXmlPath);
  const routeLog = readFileSync(routeLogPath);
  exactKeys(context, contextKeys, 'execution context');
  exactKeys(manual, manualKeys, 'manual');
  if (context.schema_version !== 'task02-execution-context.v1') fail('execution context schema mismatch');
  if (manual.schema_version !== 'task02-manual-place-id.v3') fail('manual schema mismatch');
  for (const key of ['implementation_commit', 'head_before', 'head_after']) if (!hex(context[key], 40)) fail(`${key} invalid`);
  for (const key of ['implementation_tree', 'tree_before', 'tree_after']) if (!hex(context[key], 40)) fail(`${key} invalid`);
  for (const key of ['place_identity_xml_sha256', 'place_identity_log_sha256', 'manual_sha256', 'route_xml_sha256', 'route_log_sha256']) if (!hex(context[key], 64)) fail(`${key} invalid`);
  if (!hex(context.run_nonce, 64) || context.run_nonce !== manual.run_nonce) fail('nonce mismatch');
  if (!context.project_path.endsWith('/task2-verify-K2/GAME')) fail('project path is not owned detached K2 path');
  if (context.head_before !== context.implementation_commit || context.head_after !== context.implementation_commit) fail('before/after HEAD mismatch');
  if (context.tree_before !== context.implementation_tree || context.tree_after !== context.implementation_tree) fail('before/after tree mismatch');
  if (context.tracked_status_before !== '' || context.tracked_status_after !== '') fail('detached tracked status dirty');
  const resolvedCommit = git(repoRoot, ['rev-parse', '--verify', `${context.implementation_commit}^{commit}`]).trim();
  const resolvedTree = git(repoRoot, ['rev-parse', '--verify', `${context.implementation_commit}^{tree}`]).trim();
  if (resolvedCommit !== context.implementation_commit || resolvedTree !== context.implementation_tree) fail('implementation commit/tree mismatch');
  try { git(repoRoot, ['merge-base', '--is-ancestor', context.implementation_commit, 'HEAD']); } catch { fail('implementation commit is not ancestor'); }
  const runtimeFiles = sourcePaths.map((path) => ({ path, sha256: sha256(git(repoRoot, ['show', `${context.implementation_commit}:${path}`], null)) }));
  if (JSON.stringify(runtimeFiles) !== JSON.stringify(manual.runtime_source_files)) fail('runtime source files differ from implementation commit blobs');
  const material = runtimeFiles.map(({ path, sha256: digest }) => `${path}\0${digest}\n`).join('');
  const runtimeManifest = sha256(material);
  if (manual.runtime_source_manifest_sha256 !== runtimeManifest) fail('runtime source manifest mismatch');
  const binding = `TASK02_RUN_BINDING ${context.run_nonce} ${runtimeManifest}`;
  if (!xml.toString('utf8').includes(binding) || !log.toString('utf8').includes(binding)) fail('runtime binding missing from XML or log');
  if (sha256(xml) !== context.place_identity_xml_sha256 || sha256(log) !== context.place_identity_log_sha256
      || sha256(manualBytes) !== context.manual_sha256 || sha256(routeXml) !== context.route_xml_sha256
      || sha256(routeLog) !== context.route_log_sha256) fail('artifact hash mismatch');
  if (!xml.toString('utf8').includes('total="10" passed="10" failed="0"') || !routeXml.toString('utf8').includes('total="6" passed="6" failed="0"')) fail('Unity result summary mismatch');
  return Object.freeze({ schema_version: 'task02-runtime-provenance.v1', implementation_commit: context.implementation_commit, implementation_tree: context.implementation_tree, run_nonce: context.run_nonce, runtime_source_manifest_sha256: runtimeManifest, verified: true });
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.length !== 7) throw new TypeError('usage: verify-task02-evidence.mjs <repo> <context> <manual> <xml> <log> <route-xml> <route-log>');
  process.stdout.write(`${JSON.stringify(verifyTask02Provenance(...args), null, 2)}\n`);
};
if (import.meta.url === `file://${process.argv[1]}`) main();
