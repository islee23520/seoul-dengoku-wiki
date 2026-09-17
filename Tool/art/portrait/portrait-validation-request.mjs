#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';
import { closeSync, existsSync, linkSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const SCHEMA_VERSION = 1;
export const DEFAULT_QUEUE = '.omo/portrait-validation-requests';
const STATUSES = new Set(['pending', 'delivered', 'needs-work', 'resolved']);
const SEVERITIES = new Set(['info', 'warning', 'error', 'blocker']);
const SHA_RE = /^[0-9a-f]{64}$/;
const ID_RE = /^[0-9a-f]{64}$/;

export class ValidationRequestError extends Error {
  constructor(code, message) { super(message); this.name = 'ValidationRequestError'; this.code = code; }
}
function fail(code, message) { throw new ValidationRequestError(code, message); }
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function plainObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function string(value, field) { if (typeof value !== 'string' || value.length === 0) fail('invalid_request', `${field} must be a non-empty string`); return value; }
function stringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.length === 0)) fail('invalid_request', `${field} must be a non-empty string array`);
  if (new Set(value).size !== value.length) fail('invalid_request', `${field} must not contain duplicates`);
  return [...value];
}
function lexicalInside(root, path, label) {
  const rel = relative(root, path);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) fail('unsafe_path', `${label} escapes its root`);
}
function ensureDirectory(path) {
  const absolute = resolve(path);
  let ancestor = absolute;
  const missing = [];
  while (!existsSync(ancestor)) {
    const parent = dirname(ancestor);
    if (parent === ancestor) fail('unsafe_path', `cannot find an existing queue ancestor: ${absolute}`);
    missing.unshift(ancestor.slice(parent.length + (parent.endsWith(sep) ? 0 : 1)));
    ancestor = parent;
  }
  if (lstatSync(ancestor).isSymbolicLink()) fail('unsafe_path', `queue path is a symlink: ${ancestor}`);
  if (!lstatSync(ancestor).isDirectory()) fail('unsafe_path', `queue path is not a directory: ${ancestor}`);
  let current = realpathSync(ancestor);
  for (const component of missing) {
    current = join(current, component);
    mkdirSync(current);
  }
  return realpathSync(current);
}
function queueFile(queueRoot, id) {
  if (!ID_RE.test(id)) fail('invalid_request_id', 'request id must be a lowercase SHA-256');
  const root = ensureDirectory(queueRoot);
  const path = resolve(root, `${id}.json`);
  lexicalInside(root, path, 'request path');
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) fail('unsafe_path', 'request file must not be a symlink');
  return { root, path };
}
function atomicReplace(path, bytes) {
  const temp = join(dirname(path), `.${process.pid}-${randomBytes(8).toString('hex')}.tmp`);
  let fd;
  try {
    fd = openSync(temp, 'wx', 0o600);
    writeFileSync(fd, bytes);
    closeSync(fd); fd = undefined;
    renameSync(temp, path);
  } finally {
    if (fd !== undefined) closeSync(fd);
    rmSync(temp, { force: true });
  }
}
function atomicCreate(path, bytes) {
  const temp = join(dirname(path), `.${process.pid}-${randomBytes(8).toString('hex')}.tmp`);
  let fd;
  try {
    fd = openSync(temp, 'wx', 0o600);
    writeFileSync(fd, bytes);
    closeSync(fd); fd = undefined;
    try { linkSync(temp, path); } catch (error) { if (error.code !== 'EEXIST') throw error; return false; }
    return true;
  } finally {
    if (fd !== undefined) closeSync(fd);
    rmSync(temp, { force: true });
  }
}
function normalizeRepo(repoCwd) {
  const absolute = resolve(string(repoCwd, 'repo_cwd'));
  if (!existsSync(absolute) || !lstatSync(absolute).isDirectory()) fail('invalid_request', 'repo_cwd must be an existing directory');
  return realpathSync(absolute);
}
function validateArtifact(binding, repoCwd, verifyBytes) {
  if (!plainObject(binding)) fail('invalid_request', 'each artifact binding must be an object');
  const path = string(binding.path, 'artifact_bindings[].path');
  if (isAbsolute(path)) fail('unsafe_path', 'artifact path must be repository-relative');
  const expected = string(binding.sha256, 'artifact_bindings[].sha256');
  if (!SHA_RE.test(expected)) fail('invalid_request', 'artifact sha256 must be lowercase hexadecimal');
  const lexical = resolve(repoCwd, path);
  lexicalInside(repoCwd, lexical, 'artifact path');
  if (verifyBytes) {
    if (!existsSync(lexical)) fail('missing_artifact', `artifact does not exist: ${path}`);
    const actual = realpathSync(lexical);
    lexicalInside(realpathSync(repoCwd), actual, 'artifact symlink');
    if (sha256(readFileSync(actual)) !== expected) fail('artifact_hash_mismatch', `artifact hash mismatch: ${path}`);
  }
  return { path, sha256: expected };
}

export function immutablePayload(input, { verifyArtifacts = true } = {}) {
  if (!plainObject(input)) fail('invalid_request', 'request input must be an object');
  if (input.version !== undefined && input.version !== SCHEMA_VERSION) fail('invalid_request', `version must be ${SCHEMA_VERSION}`);
  const repoCwd = normalizeRepo(input.repo_cwd);
  const severity = string(input.severity, 'severity');
  if (!SEVERITIES.has(severity)) fail('invalid_request', `severity must be one of ${[...SEVERITIES].join(', ')}`);
  if (!Array.isArray(input.blockers) || input.blockers.length === 0) fail('invalid_request', 'blockers must be a non-empty array');
  const blockers = input.blockers.map((blocker) => {
    if (!plainObject(blocker)) fail('invalid_request', 'each blocker must be an object');
    return { code: string(blocker.code, 'blockers[].code'), message: string(blocker.message, 'blockers[].message') };
  });
  if (new Set(blockers.map(({ code }) => code)).size !== blockers.length) fail('invalid_request', 'blocker codes must be unique');
  if (!Array.isArray(input.artifact_bindings) || input.artifact_bindings.length === 0) fail('invalid_request', 'artifact_bindings must be a non-empty array');
  const artifactBindings = input.artifact_bindings.map((item) => validateArtifact(item, repoCwd, verifyArtifacts));
  if (new Set(artifactBindings.map(({ path }) => path)).size !== artifactBindings.length) fail('invalid_request', 'artifact paths must be unique');
  return {
    version: SCHEMA_VERSION,
    created_by_tool: string(input.created_by_tool, 'created_by_tool'),
    repo_cwd: repoCwd,
    gate_id: string(input.gate_id, 'gate_id'),
    severity,
    candidate_ids: stringArray(input.candidate_ids, 'candidate_ids'),
    blockers,
    reproduction_command: string(input.reproduction_command, 'reproduction_command'),
    artifact_bindings: artifactBindings,
    expected_outcome: string(input.expected_outcome, 'expected_outcome'),
  };
}
export function computeRequestId(input, options) { return sha256(stable(immutablePayload(input, options))); }
function requestFromInput(input) {
  if (input.status !== undefined && input.status !== 'pending') fail('invalid_request', 'new requests must have pending status');
  const immutable = immutablePayload(input);
  return { ...immutable, request_id: sha256(stable(immutable)), status: 'pending', delivery_attempts: [], acknowledgements: [] };
}
function verifyStoredRequest(request) {
  if (!plainObject(request) || !ID_RE.test(request.request_id || '')) fail('corrupt_request', 'stored request has an invalid request_id');
  const immutable = immutablePayload(request, { verifyArtifacts: false });
  if (sha256(stable(immutable)) !== request.request_id) fail('hash_drift', `request ${request.request_id} immutable content has drifted`);
  if (!STATUSES.has(request.status)) fail('corrupt_request', 'stored request has an invalid status');
  if (!Array.isArray(request.delivery_attempts) || !Array.isArray(request.acknowledgements)) fail('corrupt_request', 'stored request lacks delivery history');
  return request;
}
export function createRequest(input, { queue = DEFAULT_QUEUE } = {}) {
  const request = requestFromInput(input);
  const { path } = queueFile(queue, request.request_id);
  const bytes = `${JSON.stringify(request, null, 2)}\n`;
  if (!atomicCreate(path, bytes)) {
    const existing = readRequest(request.request_id, { queue });
    if (stable(immutablePayload(existing, { verifyArtifacts: false })) !== stable(immutablePayload(request, { verifyArtifacts: false }))) {
      fail('hash_drift', `request ${request.request_id} already exists with different immutable content`);
    }
    return { request: existing, created: false, path };
  }
  return { request, created: true, path };
}
export function readRequest(id, { queue = DEFAULT_QUEUE } = {}) {
  const { path } = queueFile(queue, id);
  if (!existsSync(path)) fail('not_found', `request not found: ${id}`);
  let request;
  try { request = JSON.parse(readFileSync(path, 'utf8')); } catch { fail('corrupt_request', `request is not valid JSON: ${id}`); }
  verifyStoredRequest(request);
  if (request.request_id !== id) fail('hash_drift', `request filename and request_id differ: ${id}`);
  return request;
}
export function listRequests({ queue = DEFAULT_QUEUE } = {}) {
  const root = ensureDirectory(queue);
  return readdirSync(root).filter((name) => name.endsWith('.json') && ID_RE.test(name.slice(0, -5))).sort().map((name) => readRequest(name.slice(0, -5), { queue: root }));
}
function saveRequest(request, queue) {
  verifyStoredRequest(request);
  const { path } = queueFile(queue, request.request_id);
  if (!existsSync(path)) fail('not_found', `request disappeared before update: ${request.request_id}`);
  const current = readRequest(request.request_id, { queue });
  if (stable(immutablePayload(current, { verifyArtifacts: false })) !== stable(immutablePayload(request, { verifyArtifacts: false }))) fail('hash_drift', 'immutable request content changed during update');
  atomicReplace(path, `${JSON.stringify(request, null, 2)}\n`);
}
function isoNow(now) { return new Date(now()).toISOString(); }
function commandText(request) {
  return `Portrait validation request ${request.request_id}\nGate: ${request.gate_id}\nSeverity: ${request.severity}\nCandidates: ${request.candidate_ids.join(', ')}\nBlockers:\n${request.blockers.map((item) => `- ${item.code}: ${item.message}`).join('\n')}\nReproduce: ${request.reproduction_command}\nExpected: ${request.expected_outcome}\nArtifacts:\n${request.artifact_bindings.map((item) => `- ${item.path} sha256=${item.sha256}`).join('\n')}\nReply with validation findings only; this request cannot alter the gate verdict.`;
}
export function parseHerdrAgents(output) {
  let parsed;
  try { parsed = JSON.parse(output); } catch { fail('herdr_schema', 'herdr agent list did not return JSON'); }
  const agents = parsed?.result?.agents ?? parsed?.agents;
  if (!Array.isArray(agents)) fail('herdr_schema', 'herdr agent list response lacks agents');
  return agents.map((agent) => {
    if (!plainObject(agent) || typeof agent.pane_id !== 'string' || typeof agent.agent_status !== 'string') fail('herdr_schema', 'herdr agent entry is invalid');
    return agent;
  });
}
function isOmo(agent) { return String(agent.agent || '').toLowerCase() === 'omo' || String(agent.display_agent || '').toLowerCase() === 'omo'; }
function isLive(agent) { return agent.agent_status !== 'unknown'; }
export function selectHerdrTarget(agents, { target, repoCwd } = {}) {
  if (target) {
    const pane = agents.filter((agent) => isLive(agent) && agent.pane_id === target);
    if (pane.length === 1) return { target: pane[0].pane_id };
    const named = agents.filter((agent) => isLive(agent) && (agent.agent === target || agent.display_agent === target));
    if (named.length === 1) return { target: named[0].pane_id };
    return { reason: named.length > 1 ? 'explicit_target_ambiguous' : 'explicit_target_not_found' };
  }
  const matches = agents.filter((agent) => isOmo(agent) && ['idle', 'done'].includes(agent.agent_status) && agent.cwd === repoCwd);
  if (matches.length !== 1) return { reason: matches.length === 0 ? 'no_idle_omo_agent_for_repo' : 'multiple_idle_omo_agents_for_repo' };
  return { target: matches[0].pane_id };
}
export function runProcess(command, args, { timeout = 30000 } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; child.kill('SIGTERM'); reject(new ValidationRequestError('timeout', `${command} timed out`)); } }, timeout);
    child.stdout.on('data', (chunk) => { stdout += chunk; }); child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => { if (!settled) { settled = true; clearTimeout(timer); reject(new ValidationRequestError('adapter_error', error.message)); } });
    child.on('close', (code) => { if (!settled) { settled = true; clearTimeout(timer); code === 0 ? resolvePromise({ stdout, stderr, code }) : reject(new ValidationRequestError('adapter_error', `${command} exited ${code}: ${stderr.trim() || stdout.trim()}`)); } });
  });
}
async function herdrDelivery(request, options, deps) {
  const listed = await deps.runProcess('herdr', ['agent', 'list'], { timeout: options.timeout });
  const selected = selectHerdrTarget(parseHerdrAgents(listed.stdout), { target: options.target, repoCwd: request.repo_cwd });
  if (!selected.target) return { delivered: false, reason: selected.reason };
  if (options.dryRun) return { delivered: false, reason: 'dry_run', target: selected.target };
  const args = ['agent', 'prompt', selected.target, commandText(request)];
  if (options.wait) args.push('--wait', '--timeout', String(options.timeout));
  const result = await deps.runProcess('herdr', args, { timeout: options.timeout + (options.wait ? 1000 : 0) });
  return { delivered: true, target: selected.target, acknowledgement: { adapter: 'herdr', target: selected.target, response: result.stdout.trim() || null } };
}
export function validateSocketAck(value, requestId) {
  if (!plainObject(value) || value.type !== 'portrait_validation_ack' || value.version !== SCHEMA_VERSION) fail('socket_schema', 'socket acknowledgement schema is invalid');
  if (value.request_id !== requestId) fail('ack_mismatch', 'socket acknowledgement request_id does not match');
  if (!['delivered', 'needs-work', 'resolved'].includes(value.status)) fail('socket_schema', 'socket acknowledgement status is invalid');
  if (value.message !== undefined && typeof value.message !== 'string') fail('socket_schema', 'socket acknowledgement message must be a string');
  if (value.acknowledged_by !== undefined && typeof value.acknowledged_by !== 'string') fail('socket_schema', 'socket acknowledged_by must be a string');
  return value;
}
export function socketExchange(socketPath, payload, { timeout = 30000 } = {}) {
  return new Promise((resolvePromise, reject) => {
    const socket = net.createConnection({ path: socketPath });
    let buffer = '', settled = false;
    const finish = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); socket.destroy(); error ? reject(error) : resolvePromise(value); };
    const timer = setTimeout(() => finish(new ValidationRequestError('timeout', 'OMO socket acknowledgement timed out')), timeout);
    socket.setEncoding('utf8');
    socket.on('connect', () => socket.write(`${JSON.stringify(payload)}\n`));
    socket.on('data', (chunk) => { buffer += chunk; const newline = buffer.indexOf('\n'); if (newline >= 0) { try { finish(null, JSON.parse(buffer.slice(0, newline))); } catch { finish(new ValidationRequestError('socket_schema', 'OMO socket returned invalid JSONL')); } } });
    socket.on('error', (error) => finish(new ValidationRequestError('adapter_error', error.message)));
    socket.on('end', () => { if (!settled) finish(new ValidationRequestError('socket_schema', 'OMO socket closed without a JSONL acknowledgement')); });
  });
}
async function socketDelivery(request, options, deps) {
  const socketPath = options.socket;
  if (!socketPath) fail('socket_not_configured', 'OMO socket requires --socket or OMO_AGENT_SOCKET');
  if (options.dryRun) return { delivered: false, reason: 'dry_run', target: socketPath };
  const raw = await deps.socketExchange(socketPath, { type: 'portrait_validation_request', version: SCHEMA_VERSION, request_id: request.request_id, request }, { timeout: options.timeout });
  const ack = validateSocketAck(raw, request.request_id);
  return { delivered: true, target: socketPath, status: ack.status, acknowledgement: { adapter: 'omo-socket', target: socketPath, acknowledged_by: ack.acknowledged_by ?? null, message: ack.message ?? null } };
}
export async function dispatchRequest(id, options = {}, dependencies = {}) {
  const queue = options.queue ?? DEFAULT_QUEUE;
  const now = dependencies.now ?? Date.now;
  const deps = { runProcess: dependencies.runProcess ?? runProcess, socketExchange: dependencies.socketExchange ?? socketExchange };
  const request = readRequest(id, { queue });
  const adapterRequested = options.adapter ?? 'auto';
  if (!['herdr', 'omo-socket', 'auto'].includes(adapterRequested)) fail('invalid_adapter', 'adapter must be herdr, omo-socket, or auto');
  const socket = options.socket ?? process.env.OMO_AGENT_SOCKET;
  const adapter = adapterRequested === 'auto' ? (socket ? 'omo-socket' : 'herdr') : adapterRequested;
  const attempt = { attempted_at: isoNow(now), adapter, target: options.target ?? (adapter === 'omo-socket' ? socket ?? null : null), wait: Boolean(options.wait), outcome: 'pending' };
  request.delivery_attempts.push(attempt);
  try {
    const result = adapter === 'herdr'
      ? await herdrDelivery(request, { ...options, timeout: options.timeout ?? 30000 }, deps)
      : await socketDelivery(request, { ...options, socket, timeout: options.timeout ?? 30000 }, deps);
    attempt.target = result.target ?? attempt.target;
    if (!result.delivered) { attempt.outcome = 'pending'; attempt.reason = result.reason; saveRequest(request, queue); return { request, delivered: false, reason: result.reason }; }
    attempt.outcome = 'delivered';
    request.status = result.status ?? 'delivered';
    if (result.acknowledgement) request.acknowledgements.push({ acknowledged_at: isoNow(now), request_id: request.request_id, status: request.status, ...result.acknowledgement });
    saveRequest(request, queue);
    return { request, delivered: true };
  } catch (error) {
    attempt.outcome = 'error'; attempt.reason = error.code ?? 'adapter_error'; attempt.message = error.message;
    saveRequest(request, queue);
    throw error;
  }
}

function parseArgs(args) {
  const positional = []; const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) { positional.push(arg); continue; }
    const key = arg.slice(2).replaceAll('-', '_');
    if (['wait', 'dry_run'].includes(key)) options[key] = true;
    else { if (i + 1 >= args.length) fail('usage', `missing value for ${arg}`); options[key] = args[++i]; }
  }
  if (options.timeout !== undefined) { options.timeout = Number(options.timeout); if (!Number.isInteger(options.timeout) || options.timeout <= 0) fail('usage', '--timeout must be a positive integer in milliseconds'); }
  return { positional, options };
}
function usage() {
  return 'usage:\n  portrait-validation-request.mjs create --input request.json [--queue DIR]\n  portrait-validation-request.mjs list [--queue DIR]\n  portrait-validation-request.mjs show ID [--queue DIR]\n  portrait-validation-request.mjs dispatch ID --adapter herdr|omo-socket|auto [--target pane-or-agent] [--socket PATH] [--wait] [--timeout MS] [--queue DIR] [--dry-run]\n';
}
export async function main(args = process.argv.slice(2)) {
  const command = args.shift(); const { positional, options } = parseArgs(args);
  if (command === 'create') {
    if (!options.input || positional.length) fail('usage', 'create requires --input request.json');
    const result = createRequest(JSON.parse(readFileSync(resolve(options.input), 'utf8')), { queue: options.queue });
    process.stdout.write(`${JSON.stringify({ created: result.created, path: result.path, request: result.request }, null, 2)}\n`); return;
  }
  if (command === 'list') { if (positional.length) fail('usage', 'list takes no id'); process.stdout.write(`${JSON.stringify(listRequests({ queue: options.queue }), null, 2)}\n`); return; }
  if (command === 'show') { if (positional.length !== 1) fail('usage', 'show requires one request id'); process.stdout.write(`${JSON.stringify(readRequest(positional[0], { queue: options.queue }), null, 2)}\n`); return; }
  if (command === 'dispatch') { if (positional.length !== 1) fail('usage', 'dispatch requires one request id'); const result = await dispatchRequest(positional[0], options); process.stdout.write(`${JSON.stringify(result, null, 2)}\n`); return; }
  fail('usage', usage());
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { process.stderr.write(`${error.code ? `${error.code}: ` : ''}${error.message}\n`); if (error.code === 'usage') process.stderr.write(usage()); process.exitCode = 1; });
}
