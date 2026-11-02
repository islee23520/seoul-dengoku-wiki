import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { EventEmitter, once } from 'node:events';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { acquireMaintenance, controlMaintenance, readMaintenanceConfig } from './gpu-maintenance.mjs';
import { FORCED_MODE, readForcedApproval, readRestoreConfirmation } from './forced-stop-approval.mjs';

const fail = code => Object.assign(new Error(code), { code });
const requireThat = (value, code) => { if (!value) throw fail(code); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const env = () => Object.fromEntries(['SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'HOME', 'USERPROFILE']
  .filter(key => process.env[key]).map(key => [key, process.env[key]]));

function run(executable, argv) {
  return new Promise((done, reject) => {
    const child = spawn(executable, argv, { shell: false, windowsHide: true, env: env(), stdio: ['ignore', 'pipe', 'pipe'] });
    let text = '';
    const timer = setTimeout(() => { child.kill(); reject(fail('OBSERVATION_TIMEOUT')); }, 10000);
    child.stdout.on('data', data => { text += data; if (text.length > 1048576) { child.kill(); reject(fail('OBSERVATION_BOUNDS')); } });
    child.once('error', reject);
    child.once('close', code => { clearTimeout(timer); code === 0 ? done(text.trim()) : reject(fail('OBSERVATION_FAILED')); });
  });
}

const powershell = 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
async function ps(script) {
  return run(powershell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')]);
}

// Checking the parent too prevents another user replacing a private file. No
// ACL is changed here; the owner must provision it before using the controller.
export async function assertPrivate(path) {
  requireThat(isAbsolute(path), 'PRIVATE_PATH_REQUIRED');
  for (const entry of [dirname(path), path]) {
    const stat = await lstat(entry);
    requireThat(!stat.isSymbolicLink() && resolve(await realpath(entry)).toLowerCase() === resolve(entry).toLowerCase(), 'PRIVATE_REPARSE_POINT');
    if (process.platform !== 'win32') {
      requireThat(stat.uid === process.getuid() && (stat.mode & 0o077) === 0, 'OWNER_ONLY_REQUIRED');
    } else {
      const literal = entry.replaceAll("'", "''");
      const result = JSON.parse(await ps(`$ErrorActionPreference='Stop'; $a=Get-Acl -LiteralPath '${literal}'; $s=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value; $o=$a.GetOwner([Security.Principal.SecurityIdentifier]).Value; $r=@($a.Access | Where-Object { $_.AccessControlType -eq 'Allow' } | ForEach-Object { $_.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value }); @{ owner=$o; current=$s; protected=$a.AreAccessRulesProtected; allowed=$r } | ConvertTo-Json -Compress`));
      requireThat(result.owner === result.current && (!stat.isDirectory() || result.protected === true) && result.allowed.length > 0
        && result.allowed.every(sid => sid === result.current || sid === 'S-1-5-18'), 'OWNER_ONLY_REQUIRED');
    }
  }
}

async function pin(spec) {
  requireThat(spec && isAbsolute(spec.executable) && isAbsolute(spec.cwd) && Array.isArray(spec.argv)
    && spec.argv.every(arg => typeof arg === 'string' && !arg.includes('\0'))
    && Array.isArray(spec.pins) && spec.pins.length > 0, 'INVALID_PINNED_COMMAND');
  requireThat(!/(?:^|[\\/])(?:cmd|powershell|pwsh|sh|bash|zsh)(?:\.exe)?$/i.test(spec.executable)
    && !/(?:^|[\\/])(?:taskkill|kill)(?:\.exe)?$/i.test(spec.executable)
    && !spec.argv.some(arg => ['-e', '--eval', '-c', '-Command', '-EncodedCommand'].includes(arg))
    && !spec.argv.some(arg => /start_comfyui\.ps1/i.test(arg)), 'SHELL_FORBIDDEN');
  for (const item of [{ path: spec.executable, sha256: spec.sha256 }, ...spec.pins]) {
    requireThat(isAbsolute(item.path) && /^[a-f0-9]{64}$/.test(item.sha256)
      && hash(await readFile(await realpath(item.path))) === item.sha256, 'PIN_MISMATCH');
  }
}

export async function readControllerMapping(path) {
  await assertPrivate(path);
  const mapping = JSON.parse(await readFile(path, 'utf8'));
  requireThat(mapping.forcedApproval === undefined, 'INVALID_MAPPING');
  requireThat(mapping.version === 1 && Array.isArray(mapping.instances) && mapping.instances.length > 0, 'INVALID_MAPPING');
  requireThat(new Set(mapping.instances.map(item => item.id)).size === mapping.instances.length, 'DUPLICATE_INSTANCE');
  if (mapping.mode !== undefined || mapping.approvalFile !== undefined) {
    requireThat(mapping.mode === FORCED_MODE, 'INVALID_MAINTENANCE_MODE');
    mapping.forcedApproval = await readForcedApproval(mapping.approvalFile);
    requireThat(JSON.stringify([...mapping.forcedApproval.pids].sort((a, b) => a - b))
      === JSON.stringify(mapping.instances.map(item => item.identity?.pid).sort((a, b) => a - b)), 'FORCED_PID_MISMATCH');
    requireThat(mapping.instances.some(item => item.port === 8188), 'RESTORE_PORT_REQUIRED');
  }
  for (const item of mapping.instances) {
    requireThat(typeof item.id === 'string' && Number.isInteger(item.port) && item.port > 0 && item.port < 65536, 'INVALID_INSTANCE');
    requireThat(item.available === true, `INSTANCE_UNAVAILABLE:${item.id}:${item.reason ?? 'normal shutdown authority unproven'}`);
    requireThat(item.identity && Number.isInteger(item.identity.pid) && item.identity.pid > 0
      && typeof item.identity.created === 'string' && typeof item.identity.commandLine === 'string'
      && isAbsolute(item.identity.executable) && typeof item.evidence === 'string' && item.evidence.length > 0, 'IDENTITY_REQUIRED');
    if (!mapping.forcedApproval) {
      await pin(item.launcher);
      await pin(item.shutdown);
    }
  }
  requireThat(mapping.admission && mapping.admission.evidence, 'ADMISSION_AUTHORITY_REQUIRED');
  if (mapping.admission.transport === "portal-http") {
    await validatePortalAdmission(mapping.admission);
  } else {
    await pin(mapping.admission.close);
    await pin(mapping.admission.open);
    await pin(mapping.admission.status);
  }
  return mapping;
}

async function validatePortalAdmission(admission) {
  requireThat(isAbsolute(admission.stateFile) && typeof admission.windowId === "string" && admission.windowId.length > 0
    && typeof admission.reason === "string" && admission.reason.length > 0, "INVALID_PORTAL_ADMISSION");
  const origin = new URL(admission.origin);
  requireThat(origin.origin === admission.origin && !origin.username && !origin.password
    && ((origin.protocol === "http:" && origin.hostname === "127.0.0.1") || origin.protocol === "https:"), "INVALID_PORTAL_ADMISSION");
  for (const op of ["close", "open", "status"]) {
    const endpoint = new URL(admission[op]);
    requireThat(endpoint.origin === origin.origin && !endpoint.username && !endpoint.password && !endpoint.search && !endpoint.hash
      && endpoint.pathname.endsWith(`/api/local-ai/admission/${op}`), "INVALID_PORTAL_ADMISSION");
  }
  requireThat(admission.auth?.kind === "portal-owner-session" && isAbsolute(admission.auth.file)
    && /^[a-f0-9]{64}$/.test(admission.auth.sha256), "PORTAL_OWNER_AUTH_REQUIRED");
  await assertPrivate(admission.auth.file);
  requireThat(hash(await readFile(admission.auth.file)) === admission.auth.sha256, "PIN_MISMATCH");
}

export async function portalAdmissionRequest(admission, op) {
  requireThat(["close", "open", "status"].includes(op), "INVALID_OPERATION");
  await validatePortalAdmission(admission);
  const auth = JSON.parse(await readFile(admission.auth.file, "utf8"));
  requireThat(typeof auth.cookie === "string" && auth.cookie.startsWith("portal_session=")
    && typeof auth.csrfToken === "string" && auth.csrfToken.length >= 32, "PORTAL_OWNER_AUTH_REQUIRED");
  const headers = { cookie: auth.cookie, origin: admission.origin, "x-csrf-token": auth.csrfToken, "content-type": "application/json" };
  if (new URL(admission.origin).protocol === "https:") {
    requireThat(typeof auth.accessAssertion === "string" && auth.accessAssertion.length > 0, "PORTAL_OWNER_AUTH_REQUIRED");
    headers["cf-access-jwt-assertion"] = auth.accessAssertion;
  }
  const response = await fetch(admission[op], { method: op === "status" ? "GET" : "POST", headers,
    ...(op === "status" ? {} : { body: JSON.stringify({ reason: admission.reason, windowId: admission.windowId }) }),
    redirect: "error", signal: AbortSignal.timeout(10000) });
  requireThat(response.ok, "PORTAL_ADMISSION_FAILED");
  const result = await response.json();
  requireThat(["open", "closed"].includes(result.admission) && result.windowId === admission.windowId, "ADMISSION_UNCONFIRMED");
  const state = JSON.parse(await readFile(admission.stateFile, "utf8"));
  requireThat(JSON.stringify(state) === JSON.stringify(result), "ADMISSION_STATE_FILE_MISMATCH");
  return result;
}

// Optional owner entry points around the unchanged task13 implementation. The
// receipt inherits only the reviewed private directory's owner/SYSTEM ACL.
export async function acquireComfyMaintenance({ mappingPath, configPath, receiptPath }) {
  const mapping = await readControllerMapping(mappingPath);
  await assertPrivate(configPath);
  const config = await readMaintenanceConfig(configPath);
  requireThat(config.forcedApproval?.sha256 === mapping.forcedApproval?.sha256, 'FORCED_APPROVAL_MISMATCH');
  requireThat(JSON.stringify([...config.approval.instances].sort()) === JSON.stringify(mapping.instances.map(item => item.id).sort()), 'APPROVAL_INSTANCE_MISMATCH');
  requireThat(config.controller.argv.length === 3 && config.controller.argv[0] === fileURLToPath(import.meta.url)
    && config.controller.argv[1] === '--mapping' && config.controller.argv[2] === mappingPath
    && config.controller.pins.some(item => item.path === mappingPath), 'CONTROLLER_MAPPING_PIN_REQUIRED');
  requireThat(resolve(dirname(receiptPath)) === resolve(dirname(mappingPath)), 'PRIVATE_RECEIPT_DIRECTORY_REQUIRED');
  const lease = await acquireMaintenance({ configPath, receiptPath });
  try { await assertPrivate(receiptPath); } catch (error) { await lease.release(); throw error; }
  return lease;
}

export async function controlComfyMaintenance(receiptPath, op) {
  await assertPrivate(receiptPath);
  return controlMaintenance(receiptPath, op);
}

async function command(spec) {
  await pin(spec);
  // cwd is part of the reviewed command, never supplied by a protocol frame.
  return new Promise((done, reject) => {
    const child = spawn(spec.executable, spec.argv, { cwd: spec.cwd, shell: false, windowsHide: true, env: env(), stdio: ['ignore', 'pipe', 'ignore'] });
    let output = '';
    const timer = setTimeout(() => reject(fail('COOPERATIVE_COMMAND_TIMEOUT')), 10000);
    child.stdout.on('data', bytes => { output += bytes; if (output.length > 16384) reject(fail('COMMAND_BOUNDS')); });
    child.once('error', reject);
    child.once('close', code => { clearTimeout(timer); code === 0 ? done(output.trim()) : reject(fail('COOPERATIVE_COMMAND_FAILED')); });
  });
}

// Fixed local observation code; mapping values never become PowerShell code.
export class WindowsObserver extends EventEmitter {
  async watch(instances) {
    requireThat(process.platform === 'win32', 'WINDOWS_OBSERVER_REQUIRED');
    this.instances = instances;
    // Observation helpers are CPU-only fixed binaries. Ignore their own trace
    // events to avoid a snapshot -> helper -> snapshot feedback loop.
    const script = `$ErrorActionPreference='Stop'; Register-CimIndicationEvent -Query 'SELECT * FROM Win32_ProcessStartTrace' -SourceIdentifier starts | Out-Null; Register-CimIndicationEvent -Query 'SELECT * FROM Win32_ProcessStopTrace' -SourceIdentifier stops | Out-Null; Register-CimIndicationEvent -Namespace root/StandardCimv2 -Query "SELECT * FROM __InstanceCreationEvent WITHIN 1 WHERE TargetInstance ISA 'MSFT_NetTCPConnection' AND TargetInstance.State = 2" -SourceIdentifier listeners | Out-Null; Write-Output 'READY'; while($true) { $e=Wait-Event; if($e.SourceEventArgs.NewEvent.ProcessName -notin @('powershell.exe','nvidia-smi.exe')) { Write-Output 'CHANGE' }; Remove-Event -EventIdentifier $e.EventIdentifier }`;
    this.child = spawn(powershell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'], env: env() });
    this.child.once('error', () => this.emit('unsafe'));
    const ready = new Promise((done, reject) => {
      this.child.once('error', reject);
      const lines = createInterface({ input: this.child.stdout });
      lines.on('line', line => { if (line === 'READY') done(); else if (line === 'CHANGE') this.emit('change'); });
      this.child.once('exit', () => { reject(fail('PROCESS_WATCH_LOST')); this.emit('unsafe'); });
    });
    await bounded(ready);
    this.sockets = [];
    for (const item of instances) {
      const ws = new WebSocket(`ws://127.0.0.1:${item.port}/ws?clientId=maintenance-controller`);
      const opened = new Promise((done, reject) => { ws.addEventListener('open', done, { once: true }); ws.addEventListener('error', () => reject(fail('COMFY_EVENTS_UNAVAILABLE')), { once: true }); });
      ws.addEventListener('message', () => this.emit('change'));
      ws.addEventListener('close', () => this.emit('change'));
      this.sockets.push(ws);
      await bounded(opened);
    }
  }
  async snapshot() {
    const state = JSON.parse(await ps(`$ErrorActionPreference='Stop'; @{ processes=@(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,ExecutablePath,CommandLine,@{n='created';e={$_.CreationDate.ToUniversalTime().ToString('o')}}); listeners=@(Get-NetTCPConnection -State Listen | Select-Object LocalPort,OwningProcess) } | ConvertTo-Json -Depth 4 -Compress`));
    const gpu = await run('C:/Windows/System32/nvidia-smi.exe', ['--query-compute-apps=pid', '--format=csv,noheader,nounits']);
    let running = 0, pending = 0, listeners = 0, processes = 0;
    const identities = [];
    for (const item of this.instances) {
      const matching = state.processes.filter(p => p.ExecutablePath?.toLowerCase() === item.identity.executable.toLowerCase()
        && p.CommandLine === item.identity.commandLine);
      // All descendants count, even after the original interpreter exits.
      const pids = new Set([item.identity.pid, ...matching.map(p => p.ProcessId)]);
      let previous;
      do { previous = pids.size; for (const p of state.processes) if (pids.has(p.ParentProcessId)) pids.add(p.ProcessId); } while (previous !== pids.size);
      processes += state.processes.filter(p => pids.has(p.ProcessId)).length;
      const ports = state.listeners.filter(p => p.LocalPort === item.port);
      listeners += ports.length;
      identities.push(matching.length === 1 && ports.length > 0 && ports.every(p => p.OwningProcess === matching[0].ProcessId));
      if (ports.length) {
        const response = await fetch(`http://127.0.0.1:${item.port}/queue`, { signal: AbortSignal.timeout(5000) });
        requireThat(response.ok, 'QUEUE_UNAVAILABLE');
        const queue = await response.json();
        requireThat(Array.isArray(queue.queue_running) && Array.isArray(queue.queue_pending), 'QUEUE_INVALID');
        running += queue.queue_running.length; pending += queue.queue_pending.length;
      }
    }
    return { running, pending, listeners, processes,
      ...(this.manualRestore ? { listener8188: state.listeners.some(p => p.LocalPort === 8188) } : {}),
      gpuProcesses: gpu ? gpu.split(/\r?\n/).length : 0, identities,
      originals: this.instances.map(item => state.processes.some(p => p.ProcessId === item.identity.pid && p.created === item.identity.created && p.CommandLine === item.identity.commandLine && p.ExecutablePath?.toLowerCase() === item.identity.executable.toLowerCase())) };
  }
  close() { for (const ws of this.sockets ?? []) ws.close(); this.child?.kill(); }
}

async function bounded(promise) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(fail('BOUNDARY_TIMEOUT')), 20000); })]); }
  finally { clearTimeout(timer); }
}

export class ComfyMaintenanceController extends EventEmitter {
  constructor(mapping, observer = new WindowsObserver(), invoke = command, forceStop = pid => run('C:/Windows/System32/taskkill.exe', ['/PID', String(pid), '/F'])) {
    super(); this.mapping = mapping; this.observer = observer; this.invoke = invoke;
    observer.manualRestore = Boolean(mapping.forcedApproval);
    this.forceStop = forceStop; this.stages = [];
    this.state = 'initial'; this.admissionClosed = false; this.watching = false; this.stopped = new Set();
    observer.on('unsafe', () => this.unsafe());
    observer.on('change', () => { if (this.state === 'stopped') void this.snapshot().catch(() => this.unsafe()); });
  }
  unsafe() { this.invalid = true; this.emit('unsafe'); }
  async snapshot() {
    const observed = await this.observer.snapshot();
    if (this.state === 'stopped' && (observed.listeners || observed.processes || observed.gpuProcesses)) this.unsafe();
    requireThat(!this.invalid, 'GPU_BOUNDARY_REAPPEARED');
    return { ...observed, state: this.state, admissionClosed: this.admissionClosed, watching: this.watching };
  }
  async until(check) {
    for (;;) {
      // Subscribe before querying: terminal events during /queue cannot be lost.
      const abort = new AbortController();
      const changed = once(this.observer, 'change', { signal: abort.signal });
      changed.catch(() => {});
      try { const state = await this.snapshot(); if (check(state)) return state; await bounded(changed); }
      finally { abort.abort(); }
    }
  }
  async admission(closed) {
    if (this.mapping.admission.transport === "portal-http") {
      await portalAdmissionRequest(this.mapping.admission, closed ? "close" : "open");
      const result = await portalAdmissionRequest(this.mapping.admission, "status");
      requireThat(result.admission === (closed ? "closed" : "open"), "ADMISSION_UNCONFIRMED");
      this.admissionClosed = closed;
      return;
    }
    await this.invoke(this.mapping.admission[closed ? 'close' : 'open']);
    const result = JSON.parse(await this.invoke(this.mapping.admission.status));
    requireThat(result.admissionClosed === closed, 'ADMISSION_UNCONFIRMED');
    this.admissionClosed = closed;
  }
  async request(op, confirmationPath) {
    if (op === 'watch') {
      requireThat(this.state === 'initial', 'INVALID_TRANSITION');
      await this.observer.watch(this.mapping.instances); this.watching = true;
      const state = await this.snapshot();
      requireThat(state.originals.every(Boolean), 'ORIGINAL_IDENTITY_MISMATCH');
      this.state = 'watching'; return { watching: true, ...(this.mapping.forcedApproval ? { approvalSha256: this.mapping.forcedApproval.sha256 } : {}) };
    }
    if (op === 'closeAdmission') {
      requireThat(this.state === 'watching', 'INVALID_TRANSITION');
      await this.admission(true); this.state = 'closed'; return { admissionClosed: true };
    }
    if (op === 'drain') {
      requireThat(this.state === 'closed', 'INVALID_TRANSITION');
      await this.until(s => s.running === 0 && s.pending === 0); this.state = 'idle'; return this.snapshot();
    }
    if (op === 'stop') {
      requireThat(this.state === 'idle', 'INVALID_TRANSITION');
      const state = await this.snapshot();
      requireThat(state.running === 0 && state.pending === 0 && state.originals.every(Boolean), 'STOP_BOUNDARY_CHANGED');
      if (this.mapping.forcedApproval) {
        const approval = await readForcedApproval(this.mapping.approvalFile);
        requireThat(approval.sha256 === this.mapping.forcedApproval.sha256, 'FORCED_APPROVAL_MISMATCH');
        this.stages.push({ stage: 'FORCED_STOP_BEGIN', pids: approval.pids, windowId: approval.windowId });
      }
      for (const item of this.mapping.instances) {
        // Record attempted cooperative termination before invoking it. Ambiguous
        // helper failure is reconciled, never blindly restarted on recovery.
        this.stopped.add(item.id);
        if (this.mapping.forcedApproval) {
          // No /T: descendants must be explicitly approved and mapped too.
          await this.forceStop(item.identity.pid);
          this.stages.push({ stage: 'FORCED_PID_STOPPED', pid: item.identity.pid });
        } else await this.invoke(item.shutdown);
      }
      await this.until(s => !s.listeners && !s.processes && !s.gpuProcesses);
      this.state = 'stopped';
      if (this.mapping.forcedApproval) this.stages.push({ stage: 'FORCED_ABSENCE_CONFIRMED' });
      return { ...await this.snapshot(), ...(this.mapping.forcedApproval ? { stages: this.stages } : {}) };
    }
    if (op === 'snapshot') return this.snapshot();
    if (op === 'restore-confirmed') {
      requireThat(this.mapping.forcedApproval && this.state === 'MANUAL_RESTORE_REQUIRED', 'INVALID_TRANSITION');
      await readRestoreConfirmation(confirmationPath, this.mapping.forcedApproval);
      requireThat((await this.observer.snapshot()).listener8188 === true, 'RESTORE_LISTENER_ABSENT');
      await this.admission(false); this.state = 'restored';
      return { state: 'restored', identityConfirmed: true, admissionOpen: true };
    }
    if (op === 'restore') {
      if (this.restoring) return this.restoring;
      this.restoring = this.restore(); return this.restoring;
    }
    throw fail('INVALID_OPERATION');
  }
  async restore() {
    if (this.mapping.forcedApproval) {
      requireThat(this.admissionClosed, 'ADMISSION_UNCONFIRMED');
      this.state = 'MANUAL_RESTORE_REQUIRED';
      return { state: this.state, admissionClosed: true, stages: this.stages };
    }
    // A failed restore remains failed: retrying cannot duplicate a launcher.
    requireThat(!this.invalid, 'RECOVERY_RECONCILIATION_REQUIRED');
    this.state = 'restoring';
    const before = await this.observer.snapshot();
    if (this.stopped.size) {
      requireThat(!before.listeners && !before.processes && !before.gpuProcesses, 'RECOVERY_RECONCILIATION_REQUIRED');
      for (const item of this.mapping.instances) if (this.stopped.has(item.id)) await this.invoke(item.launcher);
      // Keep admission closed until original executable/argv owns every port.
      this.invalid = false;
      await this.until(s => s.identities.every(Boolean));
    }
    await this.admission(false); this.state = 'restored';
    return { state: 'restored', identityConfirmed: true, admissionOpen: true };
  }
  close() { this.observer.close(); }
}

export async function main(argv = process.argv.slice(2)) {
  requireThat(argv.length === 2 && argv[0] === '--mapping' && isAbsolute(argv[1]), 'PRIVATE_MAPPING_REQUIRED');
  const controller = new ComfyMaintenanceController(await readControllerMapping(argv[1]));
  controller.on('unsafe', () => process.stdout.write('{"event":"unsafe"}\n'));
  const lines = createInterface({ input: process.stdin });
  let chain = Promise.resolve();
  lines.on('line', line => {
    chain = chain.then(async () => {
      let request;
      try {
        requireThat(Buffer.byteLength(line) <= 1024, 'PROTOCOL_BOUNDS');
        request = JSON.parse(line);
        requireThat((Object.keys(request).sort().join(',') === 'id,op'
          || (request.op === 'restore-confirmed' && Object.keys(request).sort().join(',') === 'confirmationPath,id,op'))
          && Number.isInteger(request.id), 'PROTOCOL_INVALID');
        process.stdout.write(`${JSON.stringify({ id: request.id, result: await controller.request(request.op, request.confirmationPath) })}\n`);
      } catch (error) { process.stderr.write(`${error.code ?? error.message}\n`); process.stdout.write(`${JSON.stringify({ id: request?.id, error: error.code ?? 'CONTROLLER_FAILED' })}\n`); }
    });
  });
  lines.on('close', () => { void chain.finally(() => controller.close()); });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(`${error.code ?? error.message}\n`); process.exitCode = 1; });
}
