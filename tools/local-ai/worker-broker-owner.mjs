import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { isAbsolute } from 'node:path';
import { createReadStream } from 'node:fs';

const fail = code => Object.assign(new Error(code), { code });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function fileHash(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}

// Called inside task13's real retained lease. No await between callback entry
// and spawn. Pins are checked before entering runExclusive; admitted files must
// remain immutable, as required by the native activation installation contract.
export async function runOwned(lease, worker, request, cancellation = new AbortController().signal) {
  if (!isAbsolute(worker.Executable) || await fileHash(worker.Executable) !== worker.Sha256 ||
      !Array.isArray(worker.Arguments) || worker.Arguments.some(arg => typeof arg !== 'string')) throw fail('WORKER_PIN');
  for (const pin of worker.Pins ?? []) {
    if (await fileHash(pin.Path) !== pin.Sha256) throw fail('WORKER_PIN');
  }
  return lease.runExclusive(signal => {
    if(signal.aborted || cancellation.aborted) throw fail('WORKER_INTERRUPTED');
    if (worker.Transport === 'linux-joined-v1') {
      if (worker.Executable !== 'C:/Windows/System32/wsl.exe' ||
          worker.Arguments.slice(0, 5).join('|') !== '-d|Ubuntu|-u|oliver|--exec' ||
          worker.Arguments.length !== 10 || worker.Arguments[6] !== '-I' ||
          ![5, 7, 8, 9].every(index => worker.Arguments[index].startsWith('/home/oliver/.local/share/local-ai/uniforge3d/')) ||
          worker.Arguments.some(arg => arg.includes('/../') || arg.includes('\0'))) throw fail('WSL_OWNER_REQUIRED');
      for (const index of [5, 7, 8, 9]) {
        const path = `\\\\wsl.localhost\\Ubuntu${worker.Arguments[index].replaceAll('/', '\\')}`;
        if (!worker.Pins?.some(pin => pin.Path === path)) throw fail('WSL_CODE_PIN_REQUIRED');
      }
      const contract = worker.Arguments[7].slice(0, worker.Arguments[7].lastIndexOf('/') + 1) + 'wsl_contract.py';
      if (!worker.Pins.some(pin => pin.Path === `\\\\wsl.localhost\\Ubuntu${contract.replaceAll('/', '\\')}`)) throw fail('WSL_CODE_PIN_REQUIRED');
      return runJoinedWorker(worker, request, [signal, cancellation]);
    }
    if (worker.Transport !== undefined) throw fail('WORKER_TRANSPORT');
    const child = spawn(worker.Executable, worker.Arguments, {
      shell:false, windowsHide:true, stdio:['pipe','ignore','ignore'],
      env:Object.fromEntries(['SystemRoot','WINDIR','USERPROFILE','HOME','TEMP','TMP'].filter(key => process.env[key]).map(key => [key,process.env[key]])),
    });
    return new Promise((resolve,reject) => {
      let aborted = false;
      let treeExited = Promise.resolve();
      const kill = () => {
        if(aborted) return;
        aborted = true;
        // taskkill targets only this newly spawned owned tree; never Comfy.
        if (process.platform === 'win32' && child.pid) treeExited = new Promise((done,failed) => {
          const killer = spawn('C:/Windows/System32/taskkill.exe',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'});
          killer.once('error',failed);killer.once('exit',code => code === 0 ? done() : failed(fail('WORKER_TREE_EXIT_UNCONFIRMED')));
        });
        else child.kill('SIGKILL');
      };
      const timer = setTimeout(kill,30*60*1000);
      signal.addEventListener('abort',kill,{once:true});
      cancellation.addEventListener('abort',kill,{once:true});
      if (aborted) kill();
      child.once('error',error => {clearTimeout(timer);signal.removeEventListener('abort',kill);cancellation.removeEventListener('abort',kill);reject(error);});
      child.once('exit',async (code) => {
        clearTimeout(timer);signal.removeEventListener('abort',kill);cancellation.removeEventListener('abort',kill);
        try { await treeExited; } catch(error) { reject(error); return; }
        if (aborted || code === null) reject(fail('WORKER_INTERRUPTED')); else resolve(code);
      });
      child.stdin.on('error',() => kill());
      child.stdin.end(JSON.stringify(request));
    });
  });
}

// A transport exit is not a Linux join. Keep the runExclusive callback pending
// on ambiguity, so even the authenticated lease release endpoint remains busy.
export function runJoinedWorker(worker, request, signals) {
  const child = spawn(worker.Executable, worker.Arguments, {
    shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'],
    env: Object.fromEntries(['SystemRoot', 'WINDIR', 'USERPROFILE', 'HOME', 'TEMP', 'TMP']
      .filter(key => process.env[key]).map(key => [key, process.env[key]])),
  });
  return new Promise((resolve, reject) => {
    let bytes = '', joined, ambiguous = false, cancelled = false;
    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      child.stdin.write('{"op":"cancel"}\n');
    };
    const timer = setTimeout(cancel, 30 * 60 * 1000);
    for (const signal of signals) signal.addEventListener('abort', cancel, { once: true });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      if (ambiguous) return;
      bytes += chunk;
      if (Buffer.byteLength(bytes) > 4096) { ambiguous = true; cancel(); return; }
      let end;
      while ((end = bytes.indexOf('\n')) >= 0) {
        const line = bytes.slice(0, end); bytes = bytes.slice(end + 1);
        try {
          const frame = JSON.parse(line);
          if (joined || Object.keys(frame).sort().join(',') !== 'exitCode,op,reaped,requestId,supervisorPid' ||
              frame.op !== 'joined' || frame.requestId !== request.requestId ||
              !Number.isInteger(frame.exitCode) || !Number.isInteger(frame.supervisorPid) || frame.supervisorPid <= 0 ||
              !Array.isArray(frame.reaped) || frame.reaped.length < 1 ||
              !frame.reaped.every(pid => Number.isInteger(pid) && pid > 0)) throw fail('JOIN_PROTOCOL');
          joined = frame;
        } catch { ambiguous = true; cancel(); }
      }
    });
    child.stdin.on('error', () => { ambiguous = true; });
    child.once('error', () => { ambiguous = true; });
    child.once('close', code => {
      clearTimeout(timer);
      for (const signal of signals) signal.removeEventListener('abort', cancel);
      if (ambiguous || bytes || !joined || code !== 0) {
        process.stderr.write('WORKER_TREE_EXIT_UNCONFIRMED\n');
        // Deliberately no resolve/reject: releasing callback custody is unsafe.
        return;
      }
      child.stdin.end();
      if (cancelled) reject(fail('WORKER_INTERRUPTED'));
      else resolve(joined.exitCode);
    });
    child.stdin.write(`${JSON.stringify(request)}\n`);
    for (const signal of signals) if (signal.aborted) cancel();
  });
}

async function main() {
  const config = JSON.parse(await readFile(process.argv[2]));
  if (hash(await readFile(config.LeaseModule)) !== config.LeaseModuleSha256) throw fail('LEASE_MODULE_PIN');
  const cancellation = new AbortController();
  let bytes = '', requestResolve, requestReject;
  const requested = new Promise((resolve,reject) => {requestResolve=resolve;requestReject=reject;});
  let received=false;
  process.stdin.setEncoding('utf8');
  process.stdin.on('data',chunk => {
    bytes+=chunk;
    if(Buffer.byteLength(bytes)>65537) {requestReject(fail('FRAME_BOUNDS'));cancellation.abort();return;}
    let newline;
    while((newline=bytes.indexOf('\n'))>=0) {
      const line=bytes.slice(0,newline);bytes=bytes.slice(newline+1);
      try {
        const value=JSON.parse(line);
        if(!received) {received=true;requestResolve(value);}
        else if(value.op==='cancel' && Object.keys(value).length===1) cancellation.abort();
        else throw fail('OWNER_PROTOCOL');
      } catch(error) {requestReject(error);cancellation.abort();}
    }
  });
  process.stdin.on('end',() => {requestReject(fail('OWNER_DISCONNECTED'));cancellation.abort();});
  const request = await requested;
  if (request.op === 'admission' && Object.keys(request).length === 1) {
    // Configuration eligibility only: no active window is observed or acquired.
    // The run branch must still acquire and retain real maintenance custody.
    const { readMaintenanceConfig } = await import(pathToFileURL(config.LeaseModule).href);
    await readMaintenanceConfig(config.MaintenanceConfig);
    return 0;
  }
  const worker = config.Workers[`${request.tool}:${request.assetId}`];
  if (!worker) throw fail('WORKER_NOT_APPROVED');
  if (!Array.isArray(worker.Pins) || worker.Pins.length === 0) throw fail('WORKER_CODE_PINS_REQUIRED');
  const { acquireMaintenance } = await import(pathToFileURL(config.LeaseModule).href);
  if (!/^[a-f0-9-]{36}$/.test(request.requestId)) throw fail('REQUEST_UUID');
  const lease = await acquireMaintenance({configPath:config.MaintenanceConfig,receiptPath:`${config.ReceiptPath}.${request.requestId}`});
  try { const exit = await runOwned(lease,worker,request,cancellation.signal); await lease.release(); return exit; }
  catch(error) {
    if(error.code === 'WORKER_TREE_EXIT_UNCONFIRMED') {
      // Retain the owner and OS lease for explicit reconciliation, never restore
      // Comfy while an owned GPU descendant may remain.
      process.stderr.write('WORKER_TREE_EXIT_UNCONFIRMED\n');
      await new Promise(() => {});
    }
    await lease.release(); throw error;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify({exitCode:await main()})}\n`); }
  catch(error) { process.stderr.write(`${error.code ?? 'OWNER_BRIDGE_FAILED'}\n`);process.exitCode=1; }
  finally { process.stdin.destroy(); }
}
