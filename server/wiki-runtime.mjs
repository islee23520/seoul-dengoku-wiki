import { spawn } from 'node:child_process';

// PID 1 owns both children: an unexpected exit fails the whole immutable release.
const children = new Set();
let stopping = false;
let shutdown;
function stop(code, signal = 'SIGTERM') {
  if (stopping) return shutdown;
  stopping = true;
  process.exitCode = code;
  const exits = [...children].map(child => new Promise(resolve => child.once('close', resolve)));
  const deadline = setTimeout(() => {
    for (const child of children) child.kill('SIGKILL');
  }, 5000);
  for (const child of children) child.kill(signal);
  shutdown = Promise.all(exits).finally(() => clearTimeout(deadline));
  return shutdown;
}
process.on('SIGTERM', () => { void stop(0); });
process.on('SIGINT', () => { void stop(0, 'SIGINT'); });
for (const [module, port] of [['wiki-document-api.mjs', '8788'], ['wiki-api.mjs', '8787']]) {
  if (stopping) break;
  const child = spawn(process.execPath, [new URL(module, import.meta.url).pathname], {
    env: { ...process.env, PORT: port }, stdio: 'inherit',
  });
  children.add(child);
  child.on('error', error => { console.error(error); void stop(1); });
  child.on('close', () => { children.delete(child); void stop(1); });
}
