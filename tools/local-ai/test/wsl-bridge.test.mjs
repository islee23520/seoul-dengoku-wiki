import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { watch } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { acquireMaintenance } from '../gpu-maintenance.mjs';
import { runOwned } from '../worker-broker-owner.mjs';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const wsl = 'C:/Windows/System32/wsl.exe';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const linux = path => `/mnt/${path[0].toLowerCase()}${path.slice(2).replaceAll('\\', '/')}`;
const windows = path => `\\\\wsl.localhost\\Ubuntu${path.replaceAll('/', '\\')}`;

async function command(args) {
  const child = spawn(wsl, ['-d', 'Ubuntu', '-u', 'oliver', '--exec', ...args], {
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  const result = await new Promise((done, reject) => {
    let stdout = '', stderr = '';
    child.stdout.on('data', bytes => { stdout += bytes; });
    child.stderr.on('data', bytes => { stderr += bytes; });
    child.once('error', reject);
    child.once('close', code => done({ code, stdout, stderr }));
  });
  assert.equal(result.code, 0, result.stderr);
  return result.stdout;
}

async function cpuPython() {
  const python = process.env.LOCAL_AI_WSL_TEST_PYTHON;
  assert.ok(python && python.startsWith('/home/oliver/.local/share/local-ai/uniforge3d/') &&
    !python.split('/').includes('..'), 'LOCAL_AI_WSL_TEST_PYTHON must name a prepared private Linux Python');
  // Explicit dependency preflight precedes all fixture files. Never installs.
  await command([python, '-I', '-c', 'import os,sys,numpy,pydantic,PIL; from pathlib import Path; assert os.getuid()==1000; assert sys.prefix!=sys.base_prefix; assert Path(sys.executable).resolve()==Path(sys.executable); assert sys.version_info>=(3,10); assert int(pydantic.__version__.split(".")[0])==2']);
  return python;
}

async function fixture() {
  const python = await cpuPython();
  let root, linuxRoot, lease;
  const close = async () => {
    // release rejects busy custody; any failure preserves all remaining evidence.
    if (lease) await lease.release();
    if (linuxRoot) await rm(windows(linuxRoot), {recursive: true});
    if (root) await rm(root, {recursive: true});
  };
  try {
    root = await mkdtemp(join(tmpdir(), 'wsl-bridge-'));
    const owned = `task20-${randomUUID()}`;
    const candidate = `/home/oliver/.local/share/local-ai/uniforge3d/data/${owned}`;
    // Record ownership only after exclusive creation; never remove a collision.
    await mkdir(windows(candidate));
    linuxRoot = candidate;
    const prepared = JSON.parse(await command([python, '-I', `${linux(repository)}/tools/local-ai/test/wsl-prepare.py`, linux(repository), owned, linux(root)]));
    const worker = {
      Transport: 'linux-joined-v1', Executable: wsl, Sha256: hash(await readFile(wsl)),
      Arguments: ['-d', 'Ubuntu', '-u', 'oliver', '--exec', python, '-I', `${prepared.root}/wsl-supervisor.py`, `${prepared.root}/wsl-collector.py`, `${prepared.root}/config.json`],
      Pins: await Promise.all([python, ...['wsl-supervisor.py', 'wsl-collector.py', 'wsl_contract.py', 'config.json'].map(name => `${prepared.root}/${name}`)].map(async path => ({Path: windows(path), Sha256: hash(await readFile(windows(path)))}))),
    };
    const server = createServer();
    let port;
    try {
      await new Promise((done, reject) => {server.once('error', reject); server.listen(0, '127.0.0.1', done);});
      port = server.address().port;
    } finally { if (server.listening) await new Promise(done => server.close(done)); }
    const controller = join(repository, 'tools/local-ai/test/gpu-maintenance.test.mjs');
    const configPath = join(root, 'maintenance.json');
    await writeFile(configPath, JSON.stringify({ version: 1, leasePort: port,
      approval: {id: owned, instances: ['owned-fixture'], directSubmissionsPaused: true, autoLaunchersPaused: true, restoreConfirmed: true},
      controller: {executable: process.execPath, sha256: hash(await readFile(process.execPath)), argv: [controller, '--fixture-controller'], cwd: dirname(controller), pins: [{path: controller, sha256: hash(await readFile(controller))}]},
    }));
    lease = await acquireMaintenance({configPath, receiptPath: join(root, 'lease.json')});
    return {root, prepared, worker, lease, python, close};
  } catch (error) {
    if (error instanceof Error && 'recovery' in error) {
      // acquireMaintenance retained uncertain restoration custody. Never retry
      // release or remove its config/receipt; reconciliation owns these resources.
      console.error('FIXTURE_CUSTODY_RETAINED', {root, linuxRoot});
      throw error;
    }
    await close();
    throw error;
  }
}

test('Windows owner recovers a real CPU-validated WSL GLB under its retained lease', {timeout: 60000}, async () => {
  // Given a private pinned Linux fixture and the real lease controller fixture.
  const f = await fixture();
  const request = {version: 1, op: 'run', requestId: randomUUID(), tool: 'uniforge3d', assetId: 'fixture', seed: 1, prompt: ''};
  try {
    // When the owner invokes the Linux supervisor through the fixed distro/user.
    const code = await runOwned(f.lease, f.worker, request);
    // Then real validation binds the recovered Windows bytes and request.
    assert.equal(code, 0);
    const receipt = JSON.parse(await readFile(join(f.root, request.requestId, 'receipt.json')));
    const bytes = await readFile(join(f.root, request.requestId, 'artifacts', `${request.requestId}-0`));
    assert.equal(hash(bytes), receipt.artifacts[0].sha256);
    assert.equal(bytes.length, receipt.artifacts[0].bytes);
    assert.equal(receipt.request.requestId, request.requestId);
    assert.equal(receipt.runtimeId, 'task20-cpu-fixture');
    const joined = JSON.parse(await readFile(windows(`${f.prepared.root}/${request.requestId}.joined.json`)));
    console.log(JSON.stringify({event: 'cpu-recovery', requestId: request.requestId, linuxRoot: f.prepared.root, windowsRoot: f.root, joined, pins: f.worker.Pins, receipt}));
  } finally { await f.close(); }
});

test('cancellation reaps a setsid Linux descendant before the real lease callback settles', {timeout: 60000}, async () => {
  // Given subscriptions installed before dispatch and an escaping grandchild.
  const f = await fixture();
  const request = {version: 1, op: 'run', requestId: randomUUID(), tool: 'uniforge3d', assetId: 'fixture', seed: 9, prompt: ''};
  const cancellation = new AbortController();
  const ready = new Promise((done, reject) => {
    const timer = setTimeout(() => { watcher.close(); reject(new Error('READY_TIMEOUT')); }, 20000);
    const watcher = watch(f.root, (_event, name) => {
      if (name === `${request.requestId}.ready`) {clearTimeout(timer); watcher.close(); done();}
    });
  });
  try {
    const pending = runOwned(f.lease, f.worker, request, cancellation.signal);
    const outcome = pending.then(() => 'success', error => error.code);
    await ready;
    const tree = JSON.parse(await readFile(join(f.root, `${request.requestId}.ready`)));
    assert.equal(f.lease.status().busy, true);
    // When cancellation is delivered, no Windows taskkill or WSL termination runs.
    cancellation.abort();
    assert.equal(await outcome, 'WORKER_INTERRUPTED');
    // Then the callback settles only after waitpid reports ECHILD, not transport exit.
    assert.equal(f.lease.status().busy, false);
    const joined = JSON.parse(await readFile(windows(`${f.prepared.root}/${request.requestId}.joined.json`)));
    assert.ok(joined.reaped.includes(tree.parent));
    assert.ok(joined.reaped.includes(tree.descendant));
    await command([f.python, '-I', '-c', `from pathlib import Path; assert not Path('/proc/${tree.parent}').exists(); assert not Path('/proc/${tree.descendant}').exists()`]);
    console.log(JSON.stringify({event: 'cancel-joined', requestId: request.requestId, tree, joined, leaseBusy: f.lease.status().busy}));
  } finally { cancellation.abort(); await f.close(); }
});

test('transport exit without Linux join never settles the custody callback', {timeout: 15000}, async () => {
  // Given a disposable transport with no Linux processes or real GPU authority.
  const module = new URL('../worker-broker-owner.mjs', import.meta.url).href;
  const code = `import {runJoinedWorker} from ${JSON.stringify(module)};
    let settled=false;
    runJoinedWorker({Executable:process.execPath,Arguments:['-e','process.exit(0)']},{requestId:'owned'},[]).then(()=>settled=true,()=>settled=true);
    process.on('beforeExit',()=>{if(settled)process.exitCode=1;else process.stdout.write('CUSTODY_PENDING\\n')});`;
  // When the transport exits zero but sends no join acknowledgement.
  const child = spawn(process.execPath, ['--input-type=module', '-e', code]);
  let stdout = '', stderr = '';
  child.stdout.on('data', bytes => {stdout += bytes;});
  child.stderr.on('data', bytes => {stderr += bytes;});
  const exit = await new Promise((done, reject) => {child.once('error', reject); child.once('close', done);});
  // Then ambiguity is explicit and neither resolve nor reject released custody.
  assert.equal(exit, 0);
  assert.equal(stdout, 'CUSTODY_PENDING\n');
  assert.match(stderr, /WORKER_TREE_EXIT_UNCONFIRMED/);
});

test('supervisor refuses pre-start EOF and oversized or invalid frames without forking', {timeout: 30000}, async () => {
  // Given a real collector whose only action would record an actual fork/exec.
  const python = await cpuPython();
  const root = await mkdtemp(join(tmpdir(), 'wsl-ingress-'));
  try {
    const collector = join(root, 'sentinel.py'), marker = join(root, 'forked');
    await writeFile(collector, 'from pathlib import Path; import sys\nPath(sys.argv[1]).touch()\n');
    const request = JSON.stringify({version: 1, op: 'run', requestId: randomUUID(), tool: 'uniforge3d', assetId: 'fixture', seed: 1, prompt: ''});
    for (const input of ['', request, '{invalid}\n', `${request}${' '.repeat(65537)}\n`]) {
      // When a single rejected input is delivered, with exit subscribed before EOF.
      const child = spawn(wsl, ['-d', 'Ubuntu', '-u', 'oliver', '--exec', python, '-I',
        `${linux(repository)}/tools/local-ai/wsl-supervisor.py`, linux(collector), linux(marker)],
        {stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, signal: AbortSignal.timeout(10000)});
      let stdout = '';
      child.stdout.on('data', bytes => {stdout += bytes;});
      child.stderr.resume();
      child.stdin.on('error', error => {if (error.code !== 'EPIPE') throw error;});
      const exited = new Promise((done, reject) => {child.once('error', reject); child.once('close', done);});
      child.stdin.end(input);
      await exited;
      // Then no collector ran and no false join acknowledgement was emitted.
      await assert.rejects(stat(marker), {code: 'ENOENT'});
      assert.equal(stdout, '');
    }
  } finally { await rm(root, {recursive: true}); }
});
