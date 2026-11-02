import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fork, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once, EventEmitter } from 'node:events';
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ComfyMaintenanceController, assertPrivate, readControllerMapping, controlComfyMaintenance } from '../comfy-maintenance-controller.mjs';

const self = fileURLToPath(import.meta.url);
if (process.argv[2] === 'fixture') {
  let running = 1;
  const server = createServer((request, response) => {
    if (request.url === '/finish') { running = 0; process.send({ event: 'terminal' }); }
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ queue_running: running ? [[1, 'owned-job']] : [], queue_pending: [] }));
    if (request.url === '/shutdown') server.close(() => { process.send({ event: 'normal-shutdown' }); process.disconnect(); });
  });
  server.listen(0, '127.0.0.1', () => process.send({ event: 'ready', port: server.address().port }));
} else {
  const bounded = promise => {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('fixture timeout')), 15000); })]).finally(() => clearTimeout(timer));
  };
  class FixtureObserver extends EventEmitter {
    async start() {
      this.child = fork(self, ['fixture'], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
      const closed = once(this.child, 'close');
      this.closed = closed;
      const [ready] = await bounded(once(this.child, 'message'));
      this.port = ready.port; this.live = true;
      this.child.on('message', frame => { if (frame.event === 'normal-shutdown') this.normal = true; this.emit('change'); });
      this.child.once('exit', () => { this.live = false; this.emit('change'); });
    }
    async watch() { this.watched = true; }
    async snapshot() {
      let running = 0;
      if (this.live) {
        const response = await fetch(`http://127.0.0.1:${this.port}/queue`);
        running = (await response.json()).queue_running.length;
      }
      return { running, pending: 0, listeners: Number(this.live), processes: Number(this.live), gpuProcesses: 0, identities: [this.live], originals: [this.live] };
    }
    close() {}
    async cleanup() { if (this.child.connected) { this.child.kill(); } await this.closed; }
  }

  test('owned process naturally drains, cooperatively exits, restores once, and resumes admission last', async () => {
    const observer = new FixtureObserver();
    await observer.start();
    const calls = [];
    let admissionClosed = false;
    const mapping = { instances: [{ id: 'fixture', shutdown: 'stop', launcher: 'start' }], admission: { close: 'close', open: 'open', status: 'status' } };
    const controller = new ComfyMaintenanceController(mapping, observer, async op => {
      calls.push(op);
      if (op === 'close') admissionClosed = true;
      if (op === 'open') { assert.equal(observer.live, true); admissionClosed = false; }
      if (op === 'status') return JSON.stringify({ admissionClosed });
      if (op === 'stop') {
        assert.equal(observer.listenerCount('change') > 0, true);
        await fetch(`http://127.0.0.1:${observer.port}/shutdown`);
        await bounded(observer.closed);
        assert.equal(observer.normal, true);
      }
      if (op === 'start') await observer.start();
      return '';
    });
    try {
      await controller.request('watch'); assert.equal(observer.watched, true);
      await controller.request('closeAdmission');
      let drained = false;
      const draining = controller.request('drain').then(value => { drained = true; return value; });
      assert.equal(observer.listenerCount('change'), 2, 'natural drain subscribed before its snapshot');
      assert.equal(drained, false);
      await fetch(`http://127.0.0.1:${observer.port}/finish`);
      assert.equal((await bounded(draining)).state, 'idle');
      await controller.request('stop');
      assert.equal((await controller.request('snapshot')).processes, 0);
      const [one, two] = await Promise.all([controller.request('restore'), controller.request('restore')]);
      assert.deepEqual(one, two);
      assert.equal(one.admissionOpen, true);
      assert.deepEqual(calls, ['close', 'status', 'stop', 'start', 'open', 'status']);
    } finally { controller.close(); await observer.cleanup(); }
  });

  test('real process reappearance invalidates custody and cannot trigger a duplicate recovery', async () => {
    const observer = new FixtureObserver();
    await observer.start();
    const controller = new ComfyMaintenanceController({ instances: [] }, observer, async () => { throw new Error('must not launch'); });
    controller.state = 'stopped';
    const unsafe = once(controller, 'unsafe');
    try {
      observer.emit('change'); await bounded(unsafe);
      await assert.rejects(controller.request('snapshot'), /GPU_BOUNDARY_REAPPEARED/);
      await assert.rejects(controller.request('restore'), /RECOVERY_RECONCILIATION_REQUIRED/);
      await assert.rejects(controller.request('restore'), /RECOVERY_RECONCILIATION_REQUIRED/);
    } finally { await observer.cleanup(); }
  });

  async function privateAcl(path, broad = false) {
    if (process.platform !== 'win32') { await chmod(path, broad ? 0o644 : 0o600); return; }
    const literal = path.replaceAll("'", "''");
    const script = `$ErrorActionPreference='Stop'; $s=[Security.Principal.WindowsIdentity]::GetCurrent().User; $p='${literal}'; $a=Get-Acl -LiteralPath $p; $a.SetAccessRuleProtection($true,$false); foreach($r in @($a.Access)) { $a.RemoveAccessRuleSpecific($r) }; $a.SetOwner($s); $r=New-Object Security.AccessControl.FileSystemAccessRule($s,'FullControl','Allow'); $a.AddAccessRule($r); ${broad ? "$a.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule([Security.Principal.SecurityIdentifier]'S-1-1-0','Read','Allow')));" : ''} Set-Acl -LiteralPath $p -AclObject $a`;
    const child = spawn('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { stdio: ['ignore', 'ignore', 'inherit'] });
    assert.equal((await bounded(once(child, 'close')))[0], 0);
  }

  test('private config and receipt ACLs reject other readers; production mapping explicitly refuses acquisition', async () => {
    const root = await mkdtemp(join(tmpdir(), 'comfy-controller-'));
    const config = join(root, 'mapping.json');
    const receipt = join(root, 'receipt.json');
    try {
      if (process.platform === 'win32') await privateAcl(root); else await chmod(root, 0o700);
      await writeFile(config, JSON.stringify({ version: 1, instances: [{ id: 'pngal-8188', port: 8188, available: false, reason: 'normal shutdown authority unproven' }] }));
      await privateAcl(config);
      await assertPrivate(config);
      await assert.rejects(readControllerMapping(config), /INSTANCE_UNAVAILABLE:pngal-8188:normal shutdown authority unproven/);
      await privateAcl(config, true);
      await assert.rejects(readControllerMapping(config), /OWNER_ONLY_REQUIRED/);
      await writeFile(receipt, '{}'); await privateAcl(receipt, true);
      await assert.rejects(controlComfyMaintenance(receipt, 'release'), /OWNER_ONLY_REQUIRED/);
      await privateAcl(receipt); await assertPrivate(receipt);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
}
