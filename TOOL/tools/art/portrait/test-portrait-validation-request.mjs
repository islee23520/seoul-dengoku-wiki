import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  ValidationRequestError,
  computeRequestId,
  createRequest,
  dispatchRequest,
  listRequests,
  readRequest,
  selectHerdrTarget,
} from './portrait-validation-request.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'portrait-request-'));
  const artifact = Buffer.from('review artifact\n');
  writeFileSync(join(root, 'artifact.txt'), artifact);
  return {
    root,
    queue: join(root, '.omo', 'queue'),
    input: {
      version: 1,
      created_by_tool: 'portrait-validation-test',
      repo_cwd: root,
      gate_id: 'portrait-gateway-3',
      severity: 'blocker',
      status: 'pending',
      candidate_ids: ['female-hair-03', 'female-headgear-02'],
      blockers: [{ code: 'seam_gap', message: 'Inspect the registered hair/headgear seam.' }],
      reproduction_command: 'node TOOL/tools/art/portrait/verify-portrait-review.mjs --record review.json --repo-root "$PWD"',
      artifact_bindings: [{ path: 'artifact.txt', sha256: sha256(artifact) }],
      expected_outcome: 'Return a reviewer finding without changing the gate verdict.',
    },
  };
}
function code(expected) {
  return (error) => error instanceof ValidationRequestError && error.code === expected;
}
function agent(overrides = {}) {
  return { agent: 'omo', display_agent: 'omo', agent_status: 'idle', cwd: '/repo', pane_id: 'w1:p1', ...overrides };
}
async function made() { const f = fixture(); const result = createRequest(f.input, { queue: f.queue }); return { ...f, id: result.request.request_id }; }

test('request id is deterministic over immutable normalized content', () => {
  const { input } = fixture();
  const first = computeRequestId(input);
  const reordered = { expected_outcome: input.expected_outcome, ...input };
  assert.equal(computeRequestId(reordered), first);
  assert.match(first, /^[0-9a-f]{64}$/);
});

test('create atomically persists a complete queue record and duplicate create is idempotent', () => {
  const { input, queue } = fixture();
  const first = createRequest(input, { queue });
  const second = createRequest(input, { queue });
  assert.equal(first.created, true); assert.equal(second.created, false);
  assert.deepEqual(second.request, first.request);
  first.request.delivery_attempts.push({ attempted_at: '1970-01-01T00:00:00.000Z', adapter: 'herdr', target: null, wait: false, outcome: 'pending', reason: 'dry_run' });
  writeFileSync(first.path, `${JSON.stringify(first.request, null, 2)}\n`);
  const third = createRequest(input, { queue });
  assert.equal(third.created, false); assert.equal(third.request.delivery_attempts.length, 1);
  assert.equal(lstatSync(first.path).isFile(), true);
  assert.deepEqual(readdirSync(queue), [`${first.request.request_id}.json`]);
  assert.deepEqual(JSON.parse(readFileSync(first.path)), first.request);
});

test('stored immutable hash drift is refused without overwrite', () => {
  const { input, queue } = fixture();
  const { path, request } = createRequest(input, { queue });
  const drifted = { ...request, gate_id: 'portrait-gateway-4' };
  writeFileSync(path, `${JSON.stringify(drifted)}\n`);
  assert.throws(() => readRequest(request.request_id, { queue }), code('hash_drift'));
  assert.throws(() => createRequest(input, { queue }), code('hash_drift'));
  assert.equal(JSON.parse(readFileSync(path)).gate_id, 'portrait-gateway-4');
});

test('artifact traversal and escaping symlinks are refused', () => {
  const { root, input, queue } = fixture();
  assert.throws(() => createRequest({ ...input, artifact_bindings: [{ path: '../outside', sha256: '0'.repeat(64) }] }, { queue }), code('unsafe_path'));
  const outside = join(tmpdir(), `portrait-request-outside-${process.pid}`); writeFileSync(outside, 'outside');
  symlinkSync(outside, join(root, 'escape'));
  assert.throws(() => createRequest({ ...input, artifact_bindings: [{ path: 'escape', sha256: sha256('outside') }] }, { queue }), code('unsafe_path'));
  const queueLink = join(root, 'linked-queue'); symlinkSync(tmpdir(), queueLink);
  assert.throws(() => createRequest(input, { queue: queueLink }), code('unsafe_path'));
});

test('Herdr auto discovery leaves zero or multiple matches pending and selects exactly one', () => {
  assert.deepEqual(selectHerdrTarget([], { repoCwd: '/repo' }), { reason: 'no_idle_omo_agent_for_repo' });
  assert.deepEqual(selectHerdrTarget([agent(), agent({ pane_id: 'w1:p2' })], { repoCwd: '/repo' }), { reason: 'multiple_idle_omo_agents_for_repo' });
  assert.deepEqual(selectHerdrTarget([agent(), agent({ pane_id: 'w1:p2', agent_status: 'working' }), agent({ pane_id: 'w1:p3', cwd: '/other' })], { repoCwd: '/repo' }), { target: 'w1:p1' });
});

test('Herdr explicit target accepts pane id or a unique live name', () => {
  const agents = [agent({ pane_id: 'w1:p4', display_agent: 'reviewer' }), agent({ pane_id: 'w1:p5', display_agent: 'other' })];
  assert.deepEqual(selectHerdrTarget(agents, { target: 'w1:p4', repoCwd: '/none' }), { target: 'w1:p4' });
  assert.deepEqual(selectHerdrTarget(agents, { target: 'reviewer', repoCwd: '/none' }), { target: 'w1:p4' });
  assert.deepEqual(selectHerdrTarget([agent(), agent({ pane_id: 'w1:p2' })], { target: 'omo' }), { reason: 'explicit_target_ambiguous' });
});

test('Herdr zero/multiple discovery records a pending attempt without prompting', async () => {
  for (const agents of [[], [agent({ cwd: null }), agent({ pane_id: 'w1:p2', cwd: null })]]) {
    const f = await made(); let calls = 0;
    const result = await dispatchRequest(f.id, { queue: f.queue, adapter: 'herdr' }, { runProcess: async (command, args) => { calls += 1; assert.deepEqual([command, ...args], ['herdr', 'agent', 'list']); return { stdout: JSON.stringify({ result: { agents } }), stderr: '', code: 0 }; }, now: () => 0 });
    assert.equal(result.delivered, false); assert.equal(calls, 1);
    const stored = readRequest(f.id, { queue: f.queue });
    assert.equal(stored.status, 'pending'); assert.equal(stored.delivery_attempts[0].outcome, 'pending');
  }
});

test('Herdr exact-one and explicit target use public prompt CLI arguments', async () => {
  for (const target of [undefined, 'reviewer']) {
    const f = await made(); const calls = [];
    const repoCwd = readRequest(f.id, { queue: f.queue }).repo_cwd;
    const agents = [agent({ cwd: repoCwd, pane_id: 'w2:p9', display_agent: 'reviewer', agent: target ? 'reviewer' : 'omo' })];
    const result = await dispatchRequest(f.id, { queue: f.queue, adapter: 'herdr', target, wait: true, timeout: 1200 }, { runProcess: async (command, args) => { calls.push([command, ...args]); return calls.length === 1 ? { stdout: JSON.stringify({ result: { agents } }), stderr: '', code: 0 } : { stdout: '{"accepted":true}', stderr: '', code: 0 }; }, now: () => 0 });
    assert.equal(result.delivered, true);
    assert.deepEqual(calls[0], ['herdr', 'agent', 'list']);
    assert.equal(calls[1][0], 'herdr'); assert.deepEqual(calls[1].slice(1, 4), ['agent', 'prompt', 'w2:p9']);
    assert.deepEqual(calls[1].slice(-3), ['--wait', '--timeout', '1200']);
    assert.equal(readRequest(f.id, { queue: f.queue }).status, 'delivered');
  }
});

test('Herdr prompt failure and timeout append an error attempt and preserve request', async () => {
  for (const reason of ['adapter_error', 'timeout']) {
    const f = await made(); let calls = 0;
    const repoCwd = readRequest(f.id, { queue: f.queue }).repo_cwd;
    await assert.rejects(dispatchRequest(f.id, { queue: f.queue, adapter: 'herdr' }, { runProcess: async () => { calls += 1; if (calls === 1) return { stdout: JSON.stringify({ result: { agents: [agent({ cwd: repoCwd })] } }), stderr: '', code: 0 }; throw new ValidationRequestError(reason, reason); }, now: () => 0 }), code(reason));
    const stored = readRequest(f.id, { queue: f.queue });
    assert.equal(stored.status, 'pending'); assert.equal(stored.delivery_attempts[0].outcome, 'error'); assert.equal(stored.delivery_attempts[0].reason, reason);
  }
});

async function socketServer(socketPath, reply) {
  const server = net.createServer((client) => {
    let input = ''; client.setEncoding('utf8'); client.on('data', (chunk) => { input += chunk; if (input.includes('\n')) { const request = JSON.parse(input.slice(0, input.indexOf('\n'))); client.end(`${JSON.stringify(reply(request))}\n`); } });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(socketPath, resolve); });
  return server;
}

test('OMO JSONL acknowledgement mismatch is refused and queue survives', async () => {
  const f = await made(); const socket = join(f.root, 'agent.sock');
  const server = await socketServer(socket, () => ({ type: 'portrait_validation_ack', version: 1, request_id: '0'.repeat(64), status: 'delivered' }));
  try { await assert.rejects(dispatchRequest(f.id, { queue: f.queue, adapter: 'omo-socket', socket, timeout: 1000 }, { now: () => 0 }), code('ack_mismatch')); }
  finally { await new Promise((resolve) => server.close(resolve)); }
  const stored = readRequest(f.id, { queue: f.queue }); assert.equal(stored.status, 'pending'); assert.equal(stored.delivery_attempts[0].outcome, 'error');
});

test('valid OMO JSONL acknowledgement updates only request status and acknowledgement', async () => {
  const f = await made(); const socket = join(f.root, 'agent.sock');
  const server = await socketServer(socket, (message) => {
    assert.equal(message.type, 'portrait_validation_request'); assert.equal(message.request_id, f.id); assert.equal(message.request.gate_id, f.input.gate_id);
    return { type: 'portrait_validation_ack', version: 1, request_id: f.id, status: 'needs-work', acknowledged_by: 'review-agent', message: 'Seam remains open.', gate_status: 'PASS' };
  });
  try { assert.equal((await dispatchRequest(f.id, { queue: f.queue, adapter: 'omo-socket', socket, timeout: 1000 }, { now: () => 0 })).delivered, true); }
  finally { await new Promise((resolve) => server.close(resolve)); }
  const stored = readRequest(f.id, { queue: f.queue });
  assert.equal(stored.status, 'needs-work'); assert.equal(stored.acknowledgements[0].message, 'Seam remains open.'); assert.equal('gate_status' in stored, false);
  assert.equal(stored.gate_id, f.input.gate_id); assert.equal(listRequests({ queue: f.queue }).length, 1); assert.equal(existsSync(join(f.queue, `${f.id}.json`)), true);
});

test('OMO adapter is inactive without an explicitly supplied socket', async () => {
  const f = await made();
  const prior = process.env.OMO_AGENT_SOCKET; delete process.env.OMO_AGENT_SOCKET;
  try { await assert.rejects(dispatchRequest(f.id, { queue: f.queue, adapter: 'omo-socket' }, { now: () => 0 }), code('socket_not_configured')); }
  finally { if (prior !== undefined) process.env.OMO_AGENT_SOCKET = prior; }
  assert.equal(readRequest(f.id, { queue: f.queue }).status, 'pending');
});
