import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EventEmitter, once } from 'node:events';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, chmod, rm, access } from 'node:fs/promises';
import { createServer } from 'node:net';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { FORCED_MODE, OPERATOR_SID, AUTHORIZATION, readForcedApproval } from '../forced-stop-approval.mjs';
import { ComfyMaintenanceController, readControllerMapping } from '../comfy-maintenance-controller.mjs';
import { acquireMaintenance, controlMaintenance } from '../gpu-maintenance.mjs';

const self = fileURLToPath(import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const bounded = promise => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('fixture timeout')), 15000); })])
    .finally(() => clearTimeout(timer));
};
async function privateAcl(path, directory = false) {
  if (process.platform !== 'win32') return chmod(path, directory ? 0o700 : 0o600);
  const script = `$ErrorActionPreference='Stop'; $s=[Security.Principal.WindowsIdentity]::GetCurrent().User; $p='${path.replaceAll("'", "''")}'; $a=Get-Acl -LiteralPath $p; $a.SetAccessRuleProtection($true,$false); foreach($r in @($a.Access)) { $a.RemoveAccessRuleSpecific($r) }; $a.SetOwner($s); $a.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($s,'FullControl','Allow'))); Set-Acl -LiteralPath $p -AclObject $a`;
  const child = spawn('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')]);
  assert.equal((await bounded(once(child, 'close')))[0], 0);
}
async function put(path, value) { await writeFile(path, JSON.stringify(value)); await privateAcl(path); }
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'forced-maintenance-'));
  await privateAcl(root, true);
  const approvalFile = join(root, 'approval.json');
  const approval = { schema: 'local-ai-forced-stop-approval/v1', mode: FORCED_MODE, windowId: 'fixture-window',
    authorizationRecordId: AUTHORIZATION, authorizationRecord: 74, operatorSid: OPERATOR_SID,
    forcedStopAcknowledged: true, manualRestoreAcknowledged: true, pids: [12345],
    createdAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() };
  await put(approvalFile, approval);
  return { root, approvalFile, approval };
}

if (process.argv[2] === '--fixture-controller') {
  const root = process.argv[3];
  const mapping = await readControllerMapping(join(root, 'mapping.json'));
  class Observer extends EventEmitter {
    live = true;
    async watch() {}
    async snapshot() {
      const restored = await access(join(root, 'restored')).then(() => true, () => false);
      return { running: 0, pending: 0, listeners: Number(this.live), processes: Number(this.live), gpuProcesses: 0,
        originals: [this.live], identities: [this.live], listener8188: restored };
    }
    close() {}
  }
  const observer = new Observer();
  let admissionClosed = false;
  const controller = new ComfyMaintenanceController(mapping, observer, async spec => {
    const op = spec.argv[0];
    if (op === 'close') admissionClosed = true;
    if (op === 'open') { assert.equal(await access(join(root, 'restored')).then(() => true, () => false), true); admissionClosed = false; }
    if (op === 'status') return JSON.stringify({ admissionClosed });
    await writeFile(join(root, 'admission.json'), JSON.stringify({ admissionClosed }));
    return '';
  }, async pid => { assert.equal(pid, 12345); observer.live = false; observer.emit('change'); });
  const lines = createInterface({ input: process.stdin });
  let chain = Promise.resolve();
  lines.on('line', line => { chain = chain.then(async () => {
    const { id, op, confirmationPath } = JSON.parse(line);
    try { process.stdout.write(`${JSON.stringify({ id, result: await controller.request(op, confirmationPath) })}\n`); }
    catch (error) { process.stdout.write(`${JSON.stringify({ id, error: error.code })}\n`); }
  }); });
  lines.on('close', () => { void chain.then(() => controller.close()); });
} else {
  test('forced approval rejects missing, expired, wrong SID, wrong ledger and missing acknowledgements', async () => {
    const fixture = await setup();
    try {
      await assert.rejects(readForcedApproval(undefined), /FORCED_APPROVAL_REQUIRED/);
      await assert.rejects(readForcedApproval(join(fixture.root, 'missing.json')), { code: 'ENOENT' });
      for (const change of [{ expiresAt: '2000-01-01T00:00:00Z' }, { operatorSid: 'wrong' },
        { authorizationRecordId: 'wrong' }, { authorizationRecord: 73 }, { schema: 'wrong' },
        { forcedStopAcknowledged: false }, { manualRestoreAcknowledged: false }, { pids: ['*'] }]) {
        await put(fixture.approvalFile, { ...fixture.approval, ...change });
        await assert.rejects(readForcedApproval(fixture.approvalFile));
      }
      await put(fixture.approvalFile, fixture.approval);
      assert.equal((await readForcedApproval(fixture.approvalFile)).windowId, 'fixture-window');
    } finally { await rm(fixture.root, { recursive: true, force: true }); }
  });

  test('forced mode records exact PID stages, retains OS lock and admission until explicit listener-backed confirmation', async () => {
    const fixture = await setup();
    let lease;
    try {
      const spec = { executable: process.execPath, sha256: hash(await readFile(process.execPath)), cwd: dirname(self),
        argv: [], pins: [{ path: self, sha256: hash(await readFile(self)) }] };
      const mappingPath = join(fixture.root, 'mapping.json');
      const mapping = { version: 1, mode: FORCED_MODE, approvalFile: fixture.approvalFile,
        instances: [{ id: 'owned', port: 8188, available: true, evidence: 'fixture',
          identity: { pid: 12345, created: 'fixture', commandLine: 'fixture', executable: process.execPath } }],
        admission: { evidence: 'fixture', close: { ...spec, argv: ['close'] },
          open: { ...spec, argv: ['open'] }, status: { ...spec, argv: ['status'] } } };
      await put(mappingPath, mapping);
      assert.equal((await readControllerMapping(mappingPath)).forcedApproval.pids[0], 12345);
      await put(mappingPath, { ...mapping, mode: undefined, approvalFile: undefined, forcedApproval: fixture.approval });
      await assert.rejects(readControllerMapping(mappingPath), /INVALID_MAPPING/);
      await put(mappingPath, { ...mapping, instances: [{ ...mapping.instances[0], identity: { ...mapping.instances[0].identity, pid: 456 } }] });
      await assert.rejects(readControllerMapping(mappingPath), /FORCED_PID_MISMATCH/);
      await put(mappingPath, mapping);
      const reservation = createServer();
      await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
      const leasePort = reservation.address().port;
      await new Promise(resolve => reservation.close(resolve));
      const configPath = join(fixture.root, 'config.json');
      const receiptPath = join(fixture.root, 'receipt.json');
      await put(configPath, { version: 1, mode: FORCED_MODE, approvalFile: fixture.approvalFile, leasePort,
        approval: { id: 'fixture', instances: ['owned'], directSubmissionsPaused: true, autoLaunchersPaused: true, restoreConfirmed: false },
        controller: { ...spec, argv: [self, '--fixture-controller', fixture.root] } });
      lease = await acquireMaintenance({ configPath, receiptPath });
      await privateAcl(receiptPath);
      assert.equal((await lease.assertOwnership()).snapshot.listeners, 0);
      let receipt = JSON.parse(await readFile(receiptPath));
      assert.deepEqual(receipt.stages.map(item => item.stage), ['FORCED_STOP_BEGIN', 'FORCED_PID_STOPPED', 'FORCED_ABSENCE_CONFIRMED']);
      assert.deepEqual(receipt.approval.pids, [12345]);
      assert.deepEqual(await lease.release(), { state: 'MANUAL_RESTORE_REQUIRED', admissionClosed: true });
      receipt = JSON.parse(await readFile(receiptPath));
      assert.equal(receipt.state, 'MANUAL_RESTORE_REQUIRED');
      assert.equal(JSON.parse(await readFile(join(fixture.root, 'admission.json'))).admissionClosed, true);
      await assert.rejects(lease.assertOwnership(), /GPU_MAINTENANCE_REQUIRED/);
      await assert.rejects(acquireMaintenance({ configPath, receiptPath: join(fixture.root, 'second.json') }), { code: 'EADDRINUSE' });
      const confirmationPath = join(fixture.root, 'confirmation.json');
      const confirmation = { schema: 'local-ai-manual-restore-confirmation/v1', windowId: fixture.approval.windowId,
        approvalSha256: receipt.approval.sha256, operatorSid: OPERATOR_SID, manuallyRestored: true, createdAt: new Date().toISOString() };
      await put(confirmationPath, { ...confirmation, windowId: 'foreign' });
      await assert.rejects(controlMaintenance(receiptPath, 'restore-confirmed', confirmationPath), /INVALID_RESTORE_CONFIRMATION/);
      await put(confirmationPath, confirmation);
      await assert.rejects(controlMaintenance(receiptPath, 'restore-confirmed', confirmationPath), /CONTROLLER_REJECTED/);
      assert.equal(JSON.parse(await readFile(join(fixture.root, 'admission.json'))).admissionClosed, true);
      await writeFile(join(fixture.root, 'restored'), 'present');
      const released = bounded(once(lease.events, 'released'));
      assert.deepEqual(await controlMaintenance(receiptPath, 'restore-confirmed', confirmationPath), { state: 'released' });
      await released;
      assert.equal(JSON.parse(await readFile(join(fixture.root, 'admission.json'))).admissionClosed, false);
      assert.equal(JSON.parse(await readFile(receiptPath)).state, 'released');
      lease = undefined;
    } finally {
      if (lease) {
        await lease.release();
        await writeFile(join(fixture.root, 'restored'), 'present');
        const receipt = JSON.parse(await readFile(join(fixture.root, 'receipt.json')));
        const path = join(fixture.root, 'cleanup.json');
        await put(path, { schema: 'local-ai-manual-restore-confirmation/v1', windowId: fixture.approval.windowId,
          approvalSha256: receipt.approval.sha256, operatorSid: OPERATOR_SID, manuallyRestored: true, createdAt: new Date().toISOString() });
        await lease.restoreConfirmed(path);
      }
      await rm(fixture.root, { recursive: true, force: true });
    }
  });
}
