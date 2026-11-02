import { createHash, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { createServer, createConnection } from 'node:net';
import { createInterface } from 'node:readline';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';
import { FORCED_MODE, readForcedApproval, readRestoreConfirmation } from './forced-stop-approval.mjs';

const fail = (code) => Object.assign(new Error(code), { code });
const required = (condition, code) => { if (!condition) throw fail(code); };
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const timeoutMs = 30_000;
const MAX_LINE = 16_384;

function keys(value, expected) {
  required(value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).every((key) => expected.includes(key)), 'INVALID_CONFIG');
}

// A private, reviewed controller is the only process lifecycle authority. Its
// executable and code inputs are pinned; no command arrives over broker/HTTP IPC.
export async function readMaintenanceConfig(path) {
  const bytes = await readFile(path);
  const config = JSON.parse(bytes);
  keys(config, ['version', 'leasePort', 'approval', 'controller', 'mode', 'approvalFile']);
  let forcedApproval;
  if (config.mode !== undefined || config.approvalFile !== undefined) {
    required(config.mode === FORCED_MODE, 'INVALID_MAINTENANCE_MODE');
    forcedApproval = await readForcedApproval(config.approvalFile);
  }
  required(config.version === 1 && Number.isInteger(config.leasePort)
    && config.leasePort >= 1024 && config.leasePort <= 65535
    && ![8188, 8189].includes(config.leasePort), 'INVALID_CONFIG');
  keys(config.approval, ['id', 'instances', 'directSubmissionsPaused', 'autoLaunchersPaused', 'restoreConfirmed']);
  required(typeof config.approval.id === 'string' && config.approval.id.length > 0
    && Array.isArray(config.approval.instances) && config.approval.instances.length > 0
    && config.approval.instances.every((id) => typeof id === 'string' && id.length > 0)
    && config.approval.directSubmissionsPaused === true
    && config.approval.autoLaunchersPaused === true
    && (forcedApproval ? forcedApproval.manualRestoreAcknowledged === true : config.approval.restoreConfirmed === true), 'OPERATOR_APPROVAL_REQUIRED');
  keys(config.controller, ['executable', 'sha256', 'argv', 'cwd', 'pins']);
  const spec = config.controller;
  required(isAbsolute(spec.executable) && isAbsolute(spec.cwd)
    && Array.isArray(spec.argv) && spec.argv.every((arg) => typeof arg === 'string' && !arg.includes('\0'))
    && Array.isArray(spec.pins) && spec.pins.length > 0, 'INVALID_CONFIG');
  // Shell interpreters and inline program text are not lifecycle specifications.
  required(!/(?:^|[\\/])(?:cmd|powershell|pwsh|sh|bash|zsh)(?:\.exe)?$/i.test(spec.executable)
    && !spec.argv.some((arg) => ['-e', '--eval', '-c', '-Command', '-EncodedCommand'].includes(arg)), 'SHELL_FORBIDDEN');
  for (const pin of [{ path: spec.executable, sha256: spec.sha256 }, ...spec.pins]) {
    keys(pin, ['path', 'sha256']);
    required(isAbsolute(pin.path) && /^[a-f0-9]{64}$/.test(pin.sha256)
      && digest(await readFile(await realpath(pin.path))) === pin.sha256, 'PIN_MISMATCH');
  }
  return { ...config, ...(forcedApproval ? { forcedApproval } : {}), configSha256: digest(bytes) };
}

function startController(spec, invalidate) {
  const child = spawn(spec.executable, spec.argv, {
    cwd: spec.cwd, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'inherit'],
    // Do not send ambient auth tokens or interpreter injection variables.
    env: Object.fromEntries(['SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'HOME', 'USERPROFILE'].filter((k) => process.env[k]).map((k) => [k, process.env[k]])),
  });
  let sequence = 0;
  const pending = new Map();
  const rejectAll = (error) => {
    invalidate(error);
    for (const { reject, timer } of pending.values()) { clearTimeout(timer); reject(error); }
    pending.clear();
  };
  const lines = createInterface({ input: child.stdout });
  lines.on('line', (line) => {
    try {
      required(Buffer.byteLength(line) <= MAX_LINE, 'CONTROLLER_PROTOCOL');
      const reply = JSON.parse(line);
      if (reply.event === 'unsafe') { rejectAll(fail('GPU_BOUNDARY_REAPPEARED')); return; }
      const entry = pending.get(reply.id);
      required(entry, 'CONTROLLER_PROTOCOL');
      pending.delete(reply.id);
      clearTimeout(entry.timer);
      if (reply.error) entry.reject(fail('CONTROLLER_REJECTED'));
      else entry.resolve(reply.result);
    } catch { rejectAll(fail('CONTROLLER_PROTOCOL')); }
  });
  child.on('error', () => rejectAll(fail('CONTROLLER_UNAVAILABLE')));
  child.on('exit', () => rejectAll(fail('CONTROLLER_EXITED')));
  child.stdin.on('error', () => rejectAll(fail('CONTROLLER_UNAVAILABLE')));
  return {
    request(op, confirmationPath) {
      return new Promise((resolveReply, reject) => {
        const id = ++sequence;
        const timer = setTimeout(() => {
          pending.delete(id);
          rejectAll(fail('CONTROLLER_TIMEOUT'));
          reject(fail('CONTROLLER_TIMEOUT'));
        }, timeoutMs);
        pending.set(id, { resolve: resolveReply, reject, timer });
        child.stdin.write(`${JSON.stringify({ id, op, ...(confirmationPath ? { confirmationPath } : {}) })}\n`);
      });
    },
    close() { child.stdin.end(); },
  };
}

async function bindLease(port, handler) {
  const server = createServer(handler);
  await new Promise((resolveBind, reject) => {
    server.once('error', reject);
    server.listen({ host: '127.0.0.1', port, exclusive: true }, resolveBind);
  });
  // A subsequent socket error invalidates the process-held authority.
  return server;
}

function serveControl(socket, token, release, status, restoreConfirmed) {
  socket.setTimeout(timeoutMs, () => socket.destroy());
  let bytes = '';
  socket.on('error', () => {});
  socket.on('data', (chunk) => {
    bytes += chunk;
    if (Buffer.byteLength(bytes) > MAX_LINE) { socket.destroy(); return; }
    if (!bytes.includes('\n')) return;
    socket.pause();
    void (async () => {
      try {
        const request = JSON.parse(bytes.slice(0, bytes.indexOf('\n')));
        required(request.token === token, 'NOT_LEASE_OWNER');
        required(['status', 'release', 'restore-confirmed'].includes(request.op), 'INVALID_OPERATION');
        const result = request.op === 'restore-confirmed' ? await restoreConfirmed(request.confirmationPath)
          : request.op === 'release' ? await release() : status();
        socket.end(`${JSON.stringify({ result })}\n`);
      } catch (error) { socket.end(`${JSON.stringify({ error: error.code ?? 'CONTROL_FAILED' })}\n`); }
    })();
  });
}

function checkSnapshot(snapshot, state) {
  required(snapshot?.admissionClosed === true && snapshot?.watching === true, 'BOUNDARY_UNCONFIRMED');
  required(snapshot.state === state && snapshot.running === 0 && snapshot.pending === 0, 'GPU_NOT_DRAINED');
  if (state === 'stopped') {
    required(snapshot.listeners === 0 && snapshot.processes === 0 && snapshot.gpuProcesses === 0, 'GPU_BOUNDARY_PRESENT');
  }
}

// The object, not a receipt boolean, is the in-process broker's authority.
export async function acquireMaintenance({ configPath, receiptPath }) {
  const config = await readMaintenanceConfig(configPath);
  try { await readFile(receiptPath); throw fail('RECEIPT_EXISTS'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const events = new EventEmitter();
  const token = randomBytes(32).toString('hex');
  let active = false;
  let busy = false;
  let invalid = null;
  let restoring = false;
  let releasePromise;
  let controller;
  let manualRestoreRequired = false;
  let forcedStages;
  const forcedReceipt = state => ({ version: 1, state, ownerPid: process.pid, host: '127.0.0.1',
    port: config.leasePort, token, configSha256: config.configSha256, mode: FORCED_MODE,
    approvalFile: config.approvalFile, approval: config.forcedApproval, stages: forcedStages });
  const invalidate = (error) => {
    if (restoring) return;
    invalid = error;
    active = false;
    events.emit('unsafe', error);
  };
  const status = () => ({ active: active && !invalid, busy, ownerPid: process.pid, configSha256: config.configSha256 });
  const server = await bindLease(config.leasePort,
    (socket) => serveControl(socket, token, () => lease.release(), status, path => lease.restoreConfirmed(path)));
  server.on('error', () => invalidate(fail('LEASE_LOST')));
  const lease = {
    events,
    status,
    async restoreConfirmed(confirmationPath) {
      required(config.forcedApproval && manualRestoreRequired && !busy, 'MANUAL_RESTORE_REQUIRED');
      await readRestoreConfirmation(confirmationPath, config.forcedApproval);
      const restored = await controller.request('restore-confirmed', confirmationPath);
      required(restored?.state === 'restored' && restored.admissionOpen === true, 'RESTORE_UNCONFIRMED');
      await writeFile(receiptPath, JSON.stringify({ ...forcedReceipt('released'), admissionOpen: true }) + '\n', { mode: 0o600 });
      controller.close(); server.close(); events.emit('released');
      return { state: 'released' };
    },
    async assertOwnership() {
      required(active && !invalid && server.listening && !restoring, 'GPU_MAINTENANCE_REQUIRED');
      const snapshot = await controller.request('snapshot');
      checkSnapshot(snapshot, 'stopped');
      required(active && !invalid && !restoring, 'GPU_MAINTENANCE_REQUIRED');
      return { ...status(), snapshot };
    },
    async runExclusive(dispatch) {
      required(typeof dispatch === 'function', 'INVALID_DISPATCH');
      required(!busy, 'GPU_WORKER_BUSY');
      busy = true;
      const abort = new AbortController();
      const onUnsafe = (error) => abort.abort(error);
      events.on('unsafe', onUnsafe);
      try {
        await lease.assertOwnership();
        required(active && !invalid && !restoring && !abort.signal.aborted, 'GPU_MAINTENANCE_REQUIRED');
        // No await between final ownership check and the broker spawn callback.
        return await dispatch(abort.signal);
      } finally { events.off('unsafe', onUnsafe); busy = false; }
    },
    release() {
      required(!busy, 'GPU_WORKER_BUSY');
      if (releasePromise) return releasePromise;
      active = false;
      restoring = true;
      releasePromise = (async () => {
        const restored = await controller.request('restore');
        if (config.forcedApproval) {
          required(restored?.state === 'MANUAL_RESTORE_REQUIRED' && restored.admissionClosed === true, 'RESTORE_UNCONFIRMED');
          forcedStages = restored.stages;
          manualRestoreRequired = true;
          await writeFile(receiptPath, JSON.stringify({ ...forcedReceipt('MANUAL_RESTORE_REQUIRED'), admissionClosed: true }) + '\n', { mode: 0o600 });
          // Retain the same OS lease and controller until explicit confirmation.
          return { state: 'MANUAL_RESTORE_REQUIRED', admissionClosed: true };
        }
        required(restored?.state === 'restored' && restored.identityConfirmed === true
          && restored.admissionOpen === true, 'RESTORE_UNCONFIRMED');
        await writeFile(receiptPath, JSON.stringify({ version: 1, state: 'released', configSha256: config.configSha256 }) + '\n', { mode: 0o600 });
        controller.close();
        // Do not await server.close: the authenticated release socket is still open.
        server.close();
        events.emit('released');
        return { state: 'released' };
      })().catch((error) => {
        // Keep the OS lease if restoration is unconfirmed. No stale auto-steal.
        restoring = false;
        releasePromise = undefined;
        invalid = error;
        throw error;
      });
      return releasePromise;
    },
  };
  controller = startController(config.controller, invalidate);
  let transitionStarted = false;
  try {
    // watch must install event subscriptions BEFORE it acknowledges, and before
    // admission close/drain can cause the relevant process/socket/job events.
    const watched = await controller.request('watch');
    if (config.forcedApproval) required(watched?.approvalSha256 === config.forcedApproval.sha256, 'FORCED_APPROVAL_MISMATCH');
    required(watched?.watching === true, 'BOUNDARY_UNCONFIRMED');
    transitionStarted = true;
    await controller.request('closeAdmission');
    checkSnapshot(await controller.request('drain'), 'idle');
    const stopped = await controller.request('stop');
    if (config.forcedApproval) forcedStages = stopped.stages;
    checkSnapshot(await controller.request('snapshot'), 'stopped');
    required(!invalid, 'GPU_MAINTENANCE_REQUIRED');
    active = true;
    await writeFile(receiptPath, JSON.stringify(config.forcedApproval ? forcedReceipt('active') : { version: 1, state: 'active', ownerPid: process.pid,
      host: '127.0.0.1', port: config.leasePort, token, configSha256: config.configSha256 }) + '\n', { flag: 'wx', mode: 0o600 });
    return lease;
  } catch (error) {
    active = false;
    if (transitionStarted) {
      try {
        await lease.release();
        if (config.forcedApproval) error.recovery = lease;
      }
      catch (restoreError) {
        // Preserve the owner and its lock for explicit operator recovery.
        error.recovery = lease;
        error.restoreError = restoreError.code;
        throw error;
      }
    } else { controller.close(); server.close(); }
    throw error;
  }
}

export async function controlMaintenance(receiptPath, op, confirmationPath) {
  required(['status', 'release', 'restore-confirmed'].includes(op), 'INVALID_OPERATION');
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
  if (op === 'restore-confirmed') {
    const { assertPrivate } = await import('./comfy-maintenance-controller.mjs');
    await assertPrivate(receiptPath);
    required(receipt.mode === FORCED_MODE && receipt.state === 'MANUAL_RESTORE_REQUIRED', 'MANUAL_RESTORE_REQUIRED');
    await readRestoreConfirmation(confirmationPath, receipt.approval);
  }
  required(receipt.version === 1 && (receipt.state === 'active'
    || (receipt.mode === FORCED_MODE && receipt.state === 'MANUAL_RESTORE_REQUIRED')) && receipt.host === '127.0.0.1'
    && Number.isInteger(receipt.port) && receipt.port >= 1024 && receipt.port <= 65535
    && /^[a-f0-9]{64}$/.test(receipt.token), 'GPU_MAINTENANCE_REQUIRED');
  return new Promise((resolveControl, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port: receipt.port });
    socket.setTimeout(timeoutMs, () => { socket.destroy(); reject(fail('CONTROL_TIMEOUT')); });
    socket.once('error', reject);
    socket.once('connect', () => socket.write(`${JSON.stringify({ op, token: receipt.token, ...(confirmationPath ? { confirmationPath } : {}) })}\n`));
    let bytes = '';
    socket.on('data', (chunk) => {
      bytes += chunk;
      if (Buffer.byteLength(bytes) > MAX_LINE) { socket.destroy(); reject(fail('CONTROL_PROTOCOL')); }
    });
    socket.once('end', () => {
      try {
        const reply = JSON.parse(bytes);
        if (reply.error) reject(fail(reply.error));
        else resolveControl(reply.result);
      } catch { reject(fail('CONTROL_PROTOCOL')); }
    });
  });
}

export async function main(argv = process.argv.slice(2)) {
  const [op, ...options] = argv;
  required(['acquire', 'release', 'status', 'restore-confirmed'].includes(op), 'INVALID_OPERATION');
  const args = new Map();
  for (let i = 0; i < options.length; i += 2) {
    required(['--config', '--receipt', '--operator-confirmation'].includes(options[i]) && options[i + 1]
      && !args.has(options[i]), 'INVALID_ARGUMENTS');
    args.set(options[i], options[i + 1]);
  }
  required(args.has('--receipt'), 'RECEIPT_REQUIRED');
  const receiptPath = resolve(args.get('--receipt'));
  required(op === 'restore-confirmed' ? args.has('--operator-confirmation') : !args.has('--operator-confirmation'), 'INVALID_ARGUMENTS');
  if (op !== 'acquire') {
    required(!args.has('--config'), 'INVALID_ARGUMENTS');
    console.log(JSON.stringify(await controlMaintenance(receiptPath, op,
      args.has('--operator-confirmation') ? resolve(args.get('--operator-confirmation')) : undefined)));
    return;
  }
  const configPath = args.get('--config') ?? process.env.LOCAL_AI_GPU_MAINTENANCE_CONFIG;
  required(configPath && isAbsolute(configPath), 'PRIVATE_CONFIG_REQUIRED');
  const lease = await acquireMaintenance({ configPath, receiptPath });
  console.log(JSON.stringify({ state: 'active', ...lease.status() }));
  // Foreground lifetime is the lease lifetime. Restore only after worker exit.
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    void lease.release().catch((error) => console.error(error.code));
  });
  await new Promise((resolveReleased) => lease.events.once('released', resolveReleased));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.code ?? error.message); process.exitCode = 1; });
}
