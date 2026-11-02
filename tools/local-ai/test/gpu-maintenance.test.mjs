import { createServer, createConnection } from 'node:net';
import { createServer as createHttpServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once, EventEmitter } from 'node:events';
import { createInterface } from 'node:readline';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { acquireMaintenance, controlMaintenance } from '../gpu-maintenance.mjs';

const self = fileURLToPath(import.meta.url);
const modulePath = fileURLToPath(new URL('../gpu-maintenance.mjs', import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const bounded = (promise) => Promise.race([promise, new Promise((_, reject) => {
  const timer = setTimeout(() => reject(new Error('fixture event timeout')), 15_000);
  timer.unref();
  promise.finally(() => clearTimeout(timer)).catch(() => {});
})]);

async function fixtureComfy() {
  let running = 1;
  const server = createHttpServer((request, response) => {
    if (request.url === '/prompt') {
      response.writeHead(200); response.end('dispatched');
      process.send({ event: 'dispatch', at: performance.timeOrigin + performance.now() });
    } else if (request.url === '/finish') {
      running = 0;
      response.end('terminal');
      process.send({ event: 'terminal', at: performance.timeOrigin + performance.now() });
    } else { response.end(JSON.stringify({ running })); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  process.send({ event: 'ready', port: server.address().port, pid: process.pid });
  process.on('message', (message) => {
    if (message === 'stop') server.close(() => { process.disconnect(); });
  });
}

async function fixtureController() {
  let child;
  let port;
  let stopped = false;
  let admissionClosed = false;
  let watching = false;
  let unexpected;
  const trigger = createHttpServer(async (_request, response) => {
    unexpected = createHttpServer((_req, res) => res.end('unexpected'));
    await new Promise((resolve) => unexpected.listen(0, '127.0.0.1', resolve));
    process.stdout.write(`${JSON.stringify({ event: 'unsafe' })}\n`);
    response.end('reappeared');
  });
  await new Promise((resolve) => trigger.listen(0, '127.0.0.1', resolve));
  const events = new EventEmitter();
  const markers = [];
  async function start() {
    child = spawn(process.execPath, [self, '--fixture-comfy'], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
    child.on('message', (message) => {
      markers.push(message);
      events.emit(message.event, message);
    });
    const [ready] = await bounded(once(events, 'ready'));
    port = ready.port;
    stopped = false;
  }
  await start();
  const respond = (id, result) => process.stdout.write(`${JSON.stringify({ id, result })}\n`);
  const idle = () => ({ state: stopped ? 'stopped' : 'idle', running: 0, pending: 0,
    admissionClosed, watching, listeners: stopped ? 0 : 1, processes: stopped ? 0 : 1, gpuProcesses: 0 });
  const lines = createInterface({ input: process.stdin });
  // Serialize lifecycle requests, including actual child exit before restore.
  let chain = Promise.resolve();
  lines.on('line', (line) => {
    chain = chain.then(async () => {
      const { id, op } = JSON.parse(line);
      if (op === 'watch') { watching = true; respond(id, { watching }); }
      else if (op === 'closeAdmission') { admissionClosed = true; respond(id, {}); }
      else if (op === 'drain') {
        assert.equal(watching, true);
        const terminal = bounded(once(events, 'terminal'));
        // A direct HTTP dispatch exists only before the natural terminal marker.
        await fetch(`http://127.0.0.1:${port}/prompt`, { method: 'POST' });
        await fetch(`http://127.0.0.1:${port}/finish`, { method: 'POST' });
        await terminal;
        respond(id, idle());
      } else if (op === 'stop') {
        const exited = bounded(once(child, 'exit'));
        child.send('stop');
        await exited;
        stopped = true;
        // A real connection refusal, not a counter, confirms the HTTP listener.
        await assert.rejects(fetch(`http://127.0.0.1:${port}/prompt`, { method: 'POST' }));
        markers.push({ event: 'stopped', at: performance.timeOrigin + performance.now() });
        respond(id, {});
      } else if (op === 'snapshot') {
        if (stopped) assert.throws(() => process.kill(child.pid, 0), /ESRCH/);
        respond(id, { ...idle(), markers, triggerPort: trigger.address().port });
      } else if (op === 'restore') {
        if (unexpected) await new Promise((resolve) => unexpected.close(resolve));
        if (stopped) await start();
        admissionClosed = false;
        const response = await fetch(`http://127.0.0.1:${port}/`);
        assert.equal(response.status, 200);
        respond(id, { state: 'restored', identityConfirmed: true, admissionOpen: true });
      } else process.stdout.write(`${JSON.stringify({ id, error: 'unknown' })}\n`);
    }).catch((error) => { console.error(error); process.exitCode = 1; });
  });
  lines.on('close', () => {
    void chain.then(async () => {
      await new Promise((resolve) => trigger.close(resolve));
      if (!stopped && child.connected) {
        const exited = bounded(once(child, 'exit'));
        child.send('stop'); await exited;
      }
    });
  });
}

async function unusedPort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'gpu-maintenance-'));
  const configPath = join(directory, 'private.json');
  const receiptPath = join(directory, 'receipt.json');
  const config = { version: 1, leasePort: await unusedPort(),
    approval: { id: 'owned-fixture-only', instances: ['owned-http-child'],
      directSubmissionsPaused: true, autoLaunchersPaused: true, restoreConfirmed: true },
    controller: { executable: process.execPath, sha256: hash(await readFile(process.execPath)),
      argv: [self, '--fixture-controller'], cwd: dirname(self),
      pins: [{ path: self, sha256: hash(await readFile(self)) }] } };
  await writeFile(configPath, JSON.stringify(config), { mode: 0o600 });
  return { directory, configPath, receiptPath, config };
}

async function cli(args, { firstLine = false } = {}) {
  const child = spawn(process.execPath, [modulePath, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = ''; let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const exit = bounded(once(child, 'exit')).then(([code]) => ({ invocation: [process.execPath, modulePath, ...args], stdout, stderr, exit: code }));
  if (firstLine) {
    const lines = createInterface({ input: child.stdout });
    const [line] = await bounded(once(lines, 'line'));
    return { child, exit, line: JSON.parse(line) };
  }
  return exit;
}

if (process.argv.includes('--fixture-worker')) {
  process.on('message', () => process.disconnect());
  process.send({ ready: true });
}
else if (process.argv.includes('--fixture-comfy')) await fixtureComfy();
else if (process.argv.includes('--fixture-controller')) await fixtureController();
else {
  test('OS owner lease gates sequential workers, drain/stop and authenticated restoration', async () => {
    const fixture = await setup();
    let lease;
    try {
      lease = await acquireMaintenance(fixture);
      assert.equal(lease.status().active, true);
      const boundary = await lease.assertOwnership();
      const direct = boundary.snapshot.markers.find((marker) => marker.event === 'dispatch');
      const terminal = boundary.snapshot.markers.find((marker) => marker.event === 'terminal');
      const stopped = boundary.snapshot.markers.find((marker) => marker.event === 'stopped');
      assert.ok(direct.at <= terminal.at && terminal.at <= stopped.at);
      await assert.rejects(acquireMaintenance({ ...fixture, receiptPath: join(fixture.directory, 'second.json') }), { code: 'EADDRINUSE' });
      // An unrelated OS bind also collides: this is not a receipt-file mutex.
      const contender = createServer();
      const collision = once(contender, 'error');
      contender.listen({ host: '127.0.0.1', port: fixture.config.leasePort, exclusive: true });
      assert.equal((await collision)[0].code, 'EADDRINUSE');
      const receipt = JSON.parse(await readFile(fixture.receiptPath));
      await writeFile(join(fixture.directory, 'foreign.json'), JSON.stringify({ ...receipt, token: '0'.repeat(64) }));
      await assert.rejects(controlMaintenance(join(fixture.directory, 'foreign.json'), 'release'), { code: 'NOT_LEASE_OWNER' });
      const intervals = [];
      let finish;
      const completed = new Promise((resolve) => { finish = resolve; });
      const entered = new EventEmitter();
      const subscribed = once(entered, 'spawn');
      const run = lease.runExclusive(async (signal) => {
        assert.equal(signal.aborted, false);
        const interval = { start: performance.timeOrigin + performance.now() };
        assert.ok(stopped.at <= interval.start);
        const worker = spawn(process.execPath, [self, '--fixture-worker'], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
        await bounded(once(worker, 'message'));
        intervals.push(interval); entered.emit('spawn');
        await completed;
        const exited = bounded(once(worker, 'exit'));
        worker.send('finish'); await exited;
        interval.end = performance.timeOrigin + performance.now();
      });
      await subscribed;
      await assert.rejects(lease.runExclusive(() => assert.fail('overlap')), { code: 'GPU_WORKER_BUSY' });
      assert.throws(() => lease.release(), { code: 'GPU_WORKER_BUSY' });
      finish(); await run;
      await lease.runExclusive(() => {
        intervals.push({ start: performance.timeOrigin + performance.now(), end: performance.timeOrigin + performance.now() });
      });
      assert.ok(intervals[0].end <= intervals[1].start);
      const dispatched = new EventEmitter();
      const started = once(dispatched, 'started');
      const revoked = lease.runExclusive(async (signal) => {
        const aborted = bounded(once(signal, 'abort'));
        dispatched.emit('started');
        await aborted;
        assert.equal(signal.aborted, true);
      });
      await started;
      await fetch(`http://127.0.0.1:${boundary.snapshot.triggerPort}/reappear`, { method: 'POST' });
      await revoked;
      await assert.rejects(lease.runExclusive(() => assert.fail('revoked spawn')), { code: 'GPU_MAINTENANCE_REQUIRED' });
      await lease.release();
      assert.equal(JSON.parse(await readFile(fixture.receiptPath)).state, 'released');
      await assert.rejects(lease.assertOwnership(), { code: 'GPU_MAINTENANCE_REQUIRED' });
    } finally {
      if (lease?.status().active) await lease.release();
      await rm(fixture.directory, { recursive: true, force: true });
    }
  });

  test('real foreground CLI acquisition/status/release and fixture cleanup evidence', async () => {
    const fixture = await setup();
    const evidence = [];
    let owner;
    try {
      owner = await cli(['acquire', '--config', fixture.configPath, '--receipt', fixture.receiptPath], { firstLine: true });
      assert.equal(owner.line.active, true);
      const status = await cli(['status', '--receipt', fixture.receiptPath]);
      evidence.push(status); assert.equal(status.exit, 0); assert.equal(JSON.parse(status.stdout).active, true);
      const release = await cli(['release', '--receipt', fixture.receiptPath]);
      evidence.push(release); assert.equal(release.exit, 0);
      evidence.push(await owner.exit); assert.equal(evidence.at(-1).exit, 0);
      const socket = createConnection({ host: '127.0.0.1', port: fixture.config.leasePort });
      const [error] = await bounded(once(socket, 'error'));
      assert.equal(error.code, 'ECONNREFUSED');
      const evidenceDirectory = process.env.GPU_MAINTENANCE_EVIDENCE;
      if (evidenceDirectory) await writeFile(join(evidenceDirectory, 'cli-evidence.json'), JSON.stringify({
        scope: 'owned fixture only; no production 8188/8189 access', evidence,
        cleanup: { ownerExited: true, leaseListenerAbsent: true, fixtureChildrenExitedBeforeOwner: true },
      }, null, 2) + '\n');
    } finally {
      if (owner && owner.child.exitCode === null) await controlMaintenance(fixture.receiptPath, 'release');
      await rm(fixture.directory, { recursive: true, force: true });
    }
  });
}
