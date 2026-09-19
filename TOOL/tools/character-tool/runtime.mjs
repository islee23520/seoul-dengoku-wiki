import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('.', import.meta.url));
export class CliError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export function candidates(platform, environment, home, pathEntries = []) {
  const names = platform === 'win32' ? ['blender.exe'] : ['blender', 'Blender'];
  const paths = pathEntries.flatMap(p => names.map(n => join(p, n)));
  if (platform === 'darwin') paths.push('/Applications/Blender.app/Contents/MacOS/Blender',
    join(home, 'Applications/Blender.app/Contents/MacOS/Blender'));
  if (platform === 'linux') paths.push('/usr/bin/blender', '/snap/bin/blender', '/opt/blender/blender');
  if (platform === 'win32') paths.push(join(environment.ProgramFiles || 'C:\\Program Files', 'Blender Foundation'));
  return paths;
}

export async function blenderPath(explicit) {
  const configured = explicit || process.env.BLENDER_PATH;
  const paths = configured ? [resolve(configured)] : candidates(process.platform, process.env, homedir(),
    (process.env.PATH || '').split(delimiter));
  for (const path of paths) {
    if (process.platform === 'win32' && path.endsWith('Blender Foundation')) {
      let versions;
      try { versions = await readdir(path); } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }
      paths.push(...versions.sort().reverse().map(v => join(path, v, 'blender.exe')));
      continue;
    }
    try { await access(path, constants.X_OK); return path; } catch (error) {
      if (!['ENOENT', 'EACCES', 'ENOTDIR'].includes(error.code)) throw error;
    }
  }
  throw new CliError('BLENDER_NOT_FOUND', `Blender executable not found${configured ? `: ${configured}` : ''}. Install Blender, or set BLENDER_PATH / --blender.`);
}

export function execute(binary, args, { env = process.env, timeout = 300_000 } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(binary, args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), timeout);
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      resolvePromise({ code, signal, stdout, stderr });
    });
  });
}

export async function worker(binary, request) {
  if (request.input) {
    try { await access(request.input); } catch (error) {
      if (error.code === 'ENOENT') throw new CliError('INPUT_MISSING', `Model does not exist: ${request.input}`);
      throw error;
    }
  }
  const directory = await mkdtemp(join(tmpdir(), 'character-tool-'));
  try {
    const input = join(directory, 'request.json'), output = join(directory, 'response.json');
    const guiBlend = request.gui && request.input?.toLowerCase().endsWith('.blend');
    await writeFile(input, JSON.stringify({ ...request, inputLoaded: Boolean(guiBlend) }));
    const startup = request.command === 'setup' ? [] : request.gui ? ['--factory-startup'] : ['--background', '--factory-startup'];
    const processResult = await execute(binary, [...startup, '--disable-autoexec',
      ...(guiBlend ? [request.input] : []),
      '--python-exit-code', '1', '--python', join(root, 'worker.py'), '--', input, output]);
    if (processResult.stdout) process.stderr.write(processResult.stdout);
    if (processResult.stderr) process.stderr.write(processResult.stderr);
    let response;
    try { response = JSON.parse(await readFile(output, 'utf8')); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      throw new CliError('BLENDER_FAILED', `Blender returned ${processResult.code ?? processResult.signal} without a response.`);
    }
    if (!response.ok) throw new CliError(response.error.code, response.error.message);
    if (processResult.code !== 0) throw new CliError('BLENDER_FAILED', `Blender exited ${processResult.code ?? processResult.signal}`);
    return response.data;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export function stagingPath(destination) {
  if (!destination || destination.includes('\\') || destination.split('/').some(p => !p || p === '..' || p === '.') ||
      !destination.startsWith('Assets/Art/Staging/')) {
    throw new CliError('STAGING_PATH', 'Destination must be a new folder below Assets/Art/Staging with no traversal.');
  }
  return destination;
}
