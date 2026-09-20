import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (message) => { throw new TypeError(message); };
const object = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} object required`);
};
const exact = (value, keys, label) => {
  object(value, label);
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) fail(`${label} keys mismatch`);
};
const string = (value, label) => { if (typeof value !== 'string') fail(`${label} string required`); };
const boolean = (value, label) => { if (typeof value !== 'boolean') fail(`${label} boolean required`); };
const integer = (value, label) => { if (!Number.isInteger(value)) fail(`${label} integer required`); };
const hex = (value, size, label) => { if (typeof value !== 'string' || !new RegExp(`^[0-9a-f]{${size}}$`).test(value)) fail(`${label} invalid`); };
const git = (root, args, encoding = 'utf8') => execFileSync('git', ['-C', root, ...args], { encoding, stdio: ['ignore', 'pipe', 'ignore'] });

const SOURCE_PATHS = Object.freeze(['GAME/Assets/Janseon/Core/PlaceId.cs','GAME/Assets/Tests/EditMode/PlaceIdentityTests.cs']);
const REQUEST_KEYS = Object.freeze(['schema_version','implementation_commit','implementation_tree','run_nonce','detached_worktree_path','project_path','unity_binary','unity_version','frozen_source_paths']);
const OBSERVATION_KEYS = Object.freeze(['schema_version','observation_id','observed_at_utc','observer_pid','request_commit','head','tree','tracked_status','worktree_path','worktree_realpath','project_path','project_realpath','registered_path','registered_head','registered_detached']);
const EXECUTION_KEYS = Object.freeze(['schema_version','request_commit','begin_context_sha256','end_context_sha256','place_identity_xml_sha256','place_identity_log_sha256','manual_sha256','route_xml_sha256','route_log_sha256']);
const CLEANUP_KEYS = Object.freeze(['schema_version','detached_worktree_path','unity_processes_remaining','open_file_lines_remaining','path_exists_after_removal','registration_exists_after_removal']);
const MANUAL_KEYS = Object.freeze(['schema_version','behavior_contract_version','run_nonce','runtime_source_manifest_sha256','runtime_source_files','canonical_id','unknown_observed_level','observed_level','identity_equal','hash_equal','different_platform_id','different_platform_unequal','conflict_error','catalog_fingerprint_before','catalog_fingerprint_after','catalog_unchanged']);
const SOURCE_ITEM_KEYS = Object.freeze(['path','sha256']);
const BINDING_KEYS = Object.freeze(['nonce','runtime_source_manifest_sha256']);

export const validateRunRequest = (value) => {
  exact(value, REQUEST_KEYS, 'request');
  if (value.schema_version !== 'task02-run-request.v1') fail('request schema version mismatch');
  hex(value.implementation_commit,40,'request implementation commit'); hex(value.implementation_tree,40,'request implementation tree'); hex(value.run_nonce,64,'request nonce');
  for (const key of ['detached_worktree_path','project_path','unity_binary','unity_version']) string(value[key],`request ${key}`);
  if (!Array.isArray(value.frozen_source_paths) || JSON.stringify(value.frozen_source_paths) !== JSON.stringify(SOURCE_PATHS)) fail('request frozen source paths mismatch');
};
export const validateObservation = (value, phase) => {
  exact(value, OBSERVATION_KEYS, phase);
  if (value.schema_version !== `task02-${phase}-context.v1`) fail(`${phase} schema version mismatch`);
  for (const key of ['observation_id','observed_at_utc','request_commit','head','tree','tracked_status','worktree_path','worktree_realpath','project_path','project_realpath','registered_path','registered_head']) string(value[key],`${phase} ${key}`);
  integer(value.observer_pid,`${phase} observer_pid`); boolean(value.registered_detached,`${phase} registered_detached`);
  if (!Number.isFinite(Date.parse(value.observed_at_utc))) fail(`${phase} observed timestamp invalid`);
  for (const key of ['request_commit','head','registered_head']) hex(value[key],40,`${phase} ${key}`); hex(value.tree,40,`${phase} tree`);
};
export const validateExecution = (value) => {
  exact(value, EXECUTION_KEYS, 'execution');
  if (value.schema_version !== 'task02-execution-context.v2') fail('execution schema version mismatch');
  hex(value.request_commit,40,'execution request commit');
  for (const key of EXECUTION_KEYS.slice(2)) hex(value[key],64,`execution ${key}`);
};
export const validateCleanup = (value) => {
  exact(value, CLEANUP_KEYS, 'cleanup');
  if (value.schema_version !== 'task02-cleanup.v2') fail('cleanup schema version mismatch');
  string(value.detached_worktree_path,'cleanup path'); integer(value.unity_processes_remaining,'cleanup process count'); integer(value.open_file_lines_remaining,'cleanup open file count'); boolean(value.path_exists_after_removal,'cleanup path exists'); boolean(value.registration_exists_after_removal,'cleanup registration exists');
};
export const validateManual = (value) => {
  exact(value, MANUAL_KEYS, 'manual');
  if (value.schema_version !== 'task02-manual-place-id.v3' || value.behavior_contract_version !== 'place-identity.v2') fail('manual schema version mismatch');
  hex(value.run_nonce,64,'manual nonce'); hex(value.runtime_source_manifest_sha256,64,'manual manifest');
  if (!Array.isArray(value.runtime_source_files) || value.runtime_source_files.length !== SOURCE_PATHS.length) fail('manual source files invalid');
  value.runtime_source_files.forEach((item,index)=>{exact(item,SOURCE_ITEM_KEYS,`manual source ${index}`);string(item.path,`manual source ${index} path`);hex(item.sha256,64,`manual source ${index} hash`);});
  if (JSON.stringify(value.runtime_source_files.map(({path})=>path)) !== JSON.stringify(SOURCE_PATHS)) fail('manual source paths mismatch');
  for (const key of ['canonical_id','different_platform_id','conflict_error']) string(value[key],`manual ${key}`);
  if (value.unknown_observed_level !== null || value.observed_level !== 3) fail('manual observed levels mismatch');
  for (const key of ['identity_equal','hash_equal','different_platform_unequal','catalog_unchanged']) boolean(value[key],`manual ${key}`);
  hex(value.catalog_fingerprint_before,64,'manual before fingerprint'); hex(value.catalog_fingerprint_after,64,'manual after fingerprint');
};
export const validateBinding = (value) => { exact(value,BINDING_KEYS,'binding'); hex(value.nonce,64,'binding nonce'); hex(value.runtime_source_manifest_sha256,64,'binding manifest'); };

const decodeXml = (value) => value.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&amp;','&');
const markerLine = (line) => {
  const match = /^TASK02_RUN_BINDING ([0-9a-f]{64}) ([0-9a-f]{64})$/.exec(line);
  if (!match) fail('binding marker line malformed');
  const binding={nonce:match[1],runtime_source_manifest_sha256:match[2]};validateBinding(binding);return binding;
};
export const parseXmlBinding = (xmlText) => {
  const name='ManualDataSurfaceRecordsIdentityAndConflict';
  const starts=[];let cursor=0;const needle=`<test-case `;
  while((cursor=xmlText.indexOf(needle,cursor))>=0){const close=xmlText.indexOf('>',cursor);if(close<0)fail('XML test-case tag incomplete');const tag=xmlText.slice(cursor,close+1);if(tag.includes(`name="${name}"`))starts.push([cursor,close+1]);cursor=close+1;}
  if(starts.length!==1)fail('target NUnit test case count mismatch');
  const end=xmlText.indexOf('</test-case>',starts[0][1]);if(end<0)fail('target NUnit test case closing tag missing');const block=xmlText.slice(starts[0][1],end);
  const outputStart=block.indexOf('<output>');const outputEnd=block.indexOf('</output>');if(outputStart<0||outputEnd<0||block.indexOf('<output>',outputStart+1)>=0)fail('target NUnit output count mismatch');
  let output=block.slice(outputStart+8,outputEnd);if(output.startsWith('<![CDATA[')&&output.endsWith(']]>'))output=output.slice(9,-3);else output=decodeXml(output);
  const lines=output.replaceAll('\r\n','\n').split('\n').filter((line)=>line.startsWith('TASK02_RUN_BINDING'));
  // Immutable Unity evidence contains one Progress emission and one NUnit output emission.
  if(lines.length!==2||lines[0]!==lines[1])fail('target binding emission count or equality mismatch');
  const globalCount=xmlText.replaceAll('\r\n','\n').split('\n').filter((line)=>line.includes('TASK02_RUN_BINDING')).length;
  if(globalCount!==2)fail('binding marker exists outside target output');
  return markerLine(lines[0]);
};
export const parseLogBinding = (logText) => {
  const candidates=logText.replaceAll('\r\n','\n').split('\n').filter((line)=>line.startsWith('TASK02_RUN_BINDING'));
  if(candidates.length!==1)fail('log binding marker count mismatch');
  if (logText.split('\n').some((line)=>!line.startsWith('TASK02_RUN_BINDING')&&line.includes('TASK02_RUN_BINDING'))) fail('log binding substring found');
  return markerLine(candidates[0]);
};

export const verifyTask02Evidence = (root, requestCommit, requestPath, beginPath, endPath, executionPath, cleanupPath, manualPath, xmlPath, logPath, routeXmlPath, routeLogPath) => {
  const request=JSON.parse(git(root,['show',`${requestCommit}:${requestPath}`]));const beginBytes=readFileSync(beginPath);const endBytes=readFileSync(endPath);const begin=JSON.parse(beginBytes);const end=JSON.parse(endBytes);const execution=JSON.parse(readFileSync(executionPath));const cleanup=JSON.parse(readFileSync(cleanupPath));const manualBytes=readFileSync(manualPath);const manual=JSON.parse(manualBytes);const xml=readFileSync(xmlPath);const log=readFileSync(logPath);const routeXml=readFileSync(routeXmlPath);const routeLog=readFileSync(routeLogPath);
  validateRunRequest(request);validateObservation(begin,'begin');validateObservation(end,'end');validateExecution(execution);validateCleanup(cleanup);validateManual(manual);
  if(git(root,['rev-parse','--verify',`${requestCommit}^{commit}`]).trim()!==requestCommit)fail('request commit invalid');try{git(root,['merge-base','--is-ancestor',requestCommit,'HEAD']);}catch{fail('request commit not ancestor');}
  if(execution.request_commit!==requestCommit||begin.request_commit!==requestCommit||end.request_commit!==requestCommit)fail('request commit mismatch');if(begin.observation_id===end.observation_id||begin.observer_pid===end.observer_pid||begin.observed_at_utc===end.observed_at_utc)fail('begin/end not independent');
  for(const observation of [begin,end]){if(observation.head!==request.implementation_commit||observation.tree!==request.implementation_tree||observation.tracked_status!=='')fail('observation git state mismatch');if(observation.worktree_path!==request.detached_worktree_path||observation.registered_path!==request.detached_worktree_path||observation.registered_head!==request.implementation_commit||observation.registered_detached!==true)fail('worktree registration mismatch');if(observation.worktree_realpath!==request.detached_worktree_path||observation.project_path!==request.project_path||observation.project_realpath!==request.project_path)fail('realpath mismatch');}
  if(execution.begin_context_sha256!==hash(beginBytes)||execution.end_context_sha256!==hash(endBytes))fail('context hash mismatch');const artifacts=[[xml,execution.place_identity_xml_sha256],[log,execution.place_identity_log_sha256],[manualBytes,execution.manual_sha256],[routeXml,execution.route_xml_sha256],[routeLog,execution.route_log_sha256]];if(artifacts.some(([bytes,digest])=>hash(bytes)!==digest))fail('artifact hash mismatch');
  const runtimeFiles=request.frozen_source_paths.map((path)=>({path,sha256:hash(git(root,['show',`${request.implementation_commit}:${path}`],null))}));if(JSON.stringify(runtimeFiles)!==JSON.stringify(manual.runtime_source_files))fail('runtime files mismatch');const manifest=hash(runtimeFiles.map(({path,sha256})=>`${path}\0${sha256}\n`).join(''));const xmlBinding=parseXmlBinding(xml.toString('utf8'));const logBinding=parseLogBinding(log.toString('utf8'));
  if(JSON.stringify(xmlBinding)!==JSON.stringify(logBinding)||xmlBinding.nonce!==request.run_nonce||xmlBinding.runtime_source_manifest_sha256!==manifest||manual.run_nonce!==request.run_nonce||manual.runtime_source_manifest_sha256!==manifest)fail('binding authority mismatch');
  if(!xml.toString().includes('total="10" passed="10" failed="0"')||!routeXml.toString().includes('total="6" passed="6" failed="0"'))fail('test result mismatch');if(cleanup.detached_worktree_path!==request.detached_worktree_path||cleanup.unity_processes_remaining!==0||cleanup.open_file_lines_remaining!==0||cleanup.path_exists_after_removal||cleanup.registration_exists_after_removal)fail('cleanup mismatch');
  return{schema_version:'task02-committed-request-provenance.v1',request_commit:requestCommit,implementation_commit:request.implementation_commit,run_nonce:request.run_nonce,runtime_source_manifest_sha256:manifest,verified:true};
};
const args=process.argv.slice(2);if(import.meta.url===`file://${process.argv[1]}`)process.stdout.write(`${JSON.stringify(verifyTask02Evidence(...args),null,2)}\n`);
