import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (message) => { throw new TypeError(message); };
const exact = (value, keys, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} object required`);
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) fail(`${label} keys mismatch`);
};
const git = (root, args, encoding = 'utf8') => execFileSync('git', ['-C', root, ...args], { encoding, stdio: ['ignore', 'pipe', 'ignore'] });
const requestKeys = ['schema_version','implementation_commit','implementation_tree','run_nonce','detached_worktree_path','project_path','unity_binary','unity_version','frozen_source_paths'];
const observationKeys = ['schema_version','observation_id','observed_at_utc','observer_pid','request_commit','head','tree','tracked_status','worktree_path','worktree_realpath','project_path','project_realpath','registered_path','registered_head','registered_detached'];
const executionKeys = ['schema_version','request_commit','begin_context_sha256','end_context_sha256','place_identity_xml_sha256','place_identity_log_sha256','manual_sha256','route_xml_sha256','route_log_sha256'];
const cleanupKeys = ['schema_version','detached_worktree_path','unity_processes_remaining','open_file_lines_remaining','path_exists_after_removal','registration_exists_after_removal'];

export const verifyTask02Evidence = (root, requestCommit, requestPath, beginPath, endPath, executionPath, cleanupPath, manualPath, xmlPath, logPath, routeXmlPath, routeLogPath) => {
  const request = JSON.parse(git(root, ['show', `${requestCommit}:${requestPath}`]));
  const beginBytes = readFileSync(beginPath); const endBytes = readFileSync(endPath);
  const begin = JSON.parse(beginBytes); const end = JSON.parse(endBytes);
  const execution = JSON.parse(readFileSync(executionPath)); const cleanup = JSON.parse(readFileSync(cleanupPath));
  const manualBytes = readFileSync(manualPath); const manual = JSON.parse(manualBytes);
  const xml = readFileSync(xmlPath); const log = readFileSync(logPath); const routeXml = readFileSync(routeXmlPath); const routeLog = readFileSync(routeLogPath);
  exact(request, requestKeys, 'request'); exact(begin, observationKeys, 'begin'); exact(end, observationKeys, 'end'); exact(execution, executionKeys, 'execution'); exact(cleanup, cleanupKeys, 'cleanup');
  if (request.schema_version !== 'task02-run-request.v1' || execution.schema_version !== 'task02-execution-context.v2') fail('schema mismatch');
  if (git(root, ['rev-parse','--verify',`${requestCommit}^{commit}`]).trim() !== requestCommit) fail('request commit invalid');
  try { git(root, ['merge-base','--is-ancestor',requestCommit,'HEAD']); } catch { fail('request commit not ancestor'); }
  if (execution.request_commit !== requestCommit || begin.request_commit !== requestCommit || end.request_commit !== requestCommit) fail('request commit mismatch');
  if (begin.observation_id === end.observation_id || begin.observer_pid === end.observer_pid || begin.observed_at_utc === end.observed_at_utc) fail('begin/end not independent');
  for (const observation of [begin,end]) {
    if (observation.head !== request.implementation_commit || observation.tree !== request.implementation_tree || observation.tracked_status !== '') fail('observation git state mismatch');
    if (observation.worktree_path !== request.detached_worktree_path || observation.registered_path !== request.detached_worktree_path || observation.registered_head !== request.implementation_commit || observation.registered_detached !== true) fail('worktree registration mismatch');
    if (observation.worktree_realpath !== request.detached_worktree_path || observation.project_path !== request.project_path || observation.project_realpath !== request.project_path) fail('realpath mismatch');
  }
  if (execution.begin_context_sha256 !== hash(beginBytes) || execution.end_context_sha256 !== hash(endBytes)) fail('context hash mismatch');
  const artifacts = [[xml,execution.place_identity_xml_sha256],[log,execution.place_identity_log_sha256],[manualBytes,execution.manual_sha256],[routeXml,execution.route_xml_sha256],[routeLog,execution.route_log_sha256]];
  if (artifacts.some(([bytes,digest]) => hash(bytes) !== digest)) fail('artifact hash mismatch');
  const runtimeFiles = request.frozen_source_paths.map((path) => ({ path, sha256: hash(git(root,['show',`${request.implementation_commit}:${path}`],null)) }));
  if (JSON.stringify(runtimeFiles) !== JSON.stringify(manual.runtime_source_files)) fail('runtime files mismatch');
  const manifest = hash(runtimeFiles.map(({path,sha256}) => `${path}\0${sha256}\n`).join(''));
  if (manual.run_nonce !== request.run_nonce || manual.runtime_source_manifest_sha256 !== manifest) fail('manual authority mismatch');
  const binding = `TASK02_RUN_BINDING ${request.run_nonce} ${manifest}`;
  if (!xml.toString().includes(binding) || !log.toString().includes(binding)) fail('binding missing');
  if (!xml.toString().includes('total="10" passed="10" failed="0"') || !routeXml.toString().includes('total="6" passed="6" failed="0"')) fail('test result mismatch');
  if (cleanup.detached_worktree_path !== request.detached_worktree_path || cleanup.unity_processes_remaining !== 0 || cleanup.open_file_lines_remaining !== 0 || cleanup.path_exists_after_removal || cleanup.registration_exists_after_removal) fail('cleanup mismatch');
  return { schema_version:'task02-committed-request-provenance.v1', request_commit:requestCommit, implementation_commit:request.implementation_commit, run_nonce:request.run_nonce, runtime_source_manifest_sha256:manifest, verified:true };
};

const args = process.argv.slice(2);
if (import.meta.url === `file://${process.argv[1]}`) process.stdout.write(`${JSON.stringify(verifyTask02Evidence(...args),null,2)}\n`);
