import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { observeRun } from './task02-run-observation.mjs';

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const [repoRoot, requestCommit, requestPath, beginPath, xml, log, manual, routeXml, routeLog, endPath, executionPath] = process.argv.slice(2);
const request = JSON.parse(execFileSync('git', ['-C', repoRoot, 'show', `${requestCommit}:${requestPath}`], { encoding: 'utf8' }));
const begin = JSON.parse(readFileSync(beginPath, 'utf8'));
const end = { schema_version: 'task02-end-context.v1', ...observeRun(repoRoot, request, requestCommit) };
if (end.head !== request.implementation_commit || end.tree !== request.implementation_tree || end.tracked_status !== '') throw new TypeError('end observation differs from committed request');
if (begin.observation_id === end.observation_id || begin.observer_pid === end.observer_pid || begin.observed_at_utc === end.observed_at_utc) throw new TypeError('begin and end observations are not independent');
writeFileSync(endPath, `${JSON.stringify(end, null, 2)}\n`);
writeFileSync(executionPath, `${JSON.stringify({
  schema_version: 'task02-execution-context.v2', request_commit: requestCommit,
  begin_context_sha256: sha256(beginPath), end_context_sha256: sha256(endPath),
  place_identity_xml_sha256: sha256(xml), place_identity_log_sha256: sha256(log),
  manual_sha256: sha256(manual), route_xml_sha256: sha256(routeXml), route_log_sha256: sha256(routeLog),
}, null, 2)}\n`);
