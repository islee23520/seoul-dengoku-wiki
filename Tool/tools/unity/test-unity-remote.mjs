import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const unityToolsRoot = dirname(fileURLToPath(import.meta.url));
const toolsRoot = resolve(unityToolsRoot, '..');
const repoRoot = resolve(toolsRoot, '..');
const gameRoot = join(repoRoot, 'Game');
const tokenPath = join(gameRoot, '.unity-remote-token');
const startCli = join(unityToolsRoot, 'start-unity-remote.mjs');
const remoteCli = join(unityToolsRoot, 'run-unity-remote-cli.mjs');

function collect(child) {
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  return {
    stdout: () => stdout,
    stderr: () => stderr,
  };
}

function waitForOutput(child, output, pattern) {
  return new Promise((resolveMatch, reject) => {
    const timeout = AbortSignal.timeout(20_000);
    const cleanup = () => {
      child.stdout.off('data', inspect);
      child.off('exit', onExit);
      timeout.removeEventListener('abort', onTimeout);
    };
    const inspect = () => {
      const match = pattern.exec(output.stdout());
      if (!match) return;
      cleanup();
      resolveMatch(match);
    };
    const onExit = (code, childSignal) => {
      cleanup();
      reject(new Error(`launcher exited before readiness (code=${code}, signal=${childSignal})\n${output.stderr()}`));
    };
    const onTimeout = () => {
      cleanup();
      reject(timeout.reason);
    };
    child.stdout.on('data', inspect);
    child.once('exit', onExit);
    timeout.addEventListener('abort', onTimeout, { once: true });
    inspect();
  });
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  }
  return new Promise((resolveExit, reject) => {
    const timeout = AbortSignal.timeout(20_000);
    const cleanup = () => {
      child.off('exit', onExit);
      child.off('error', onError);
      timeout.removeEventListener('abort', onTimeout);
    };
    const onExit = (code, childSignal) => {
      cleanup();
      resolveExit({ code, signal: childSignal });
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onTimeout = () => {
      cleanup();
      reject(timeout.reason);
    };
    child.once('exit', onExit);
    child.once('error', onError);
    timeout.addEventListener('abort', onTimeout, { once: true });
  });
}

async function runNode(script, args, options = {}) {
  const child = spawn(process.execPath, [script, ...args], {
    cwd: options.cwd,
    env: options.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = collect(child);
  const exit = await waitForExit(child);
  return { ...exit, stdout: output.stdout(), stderr: output.stderr() };
}

test('repository launcher serves built UI/auth and CLI resolves the Game token', { concurrency: false }, async (t) => {
  const unrelatedCwd = await mkdtemp(join(tmpdir(), 'janseon-unity-remote-cwd-'));
  const authToken = `launcher-test-${process.pid}`;
  let previousToken;
  let previousMode;
  try {
    previousToken = await readFile(tokenPath);
    previousMode = (await stat(tokenPath)).mode & 0o777;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  let server;
  t.after(async () => {
    if (server && server.exitCode === null && server.signalCode === null) {
      const exit = waitForExit(server);
      server.kill('SIGTERM');
      await exit;
    }
    if (previousToken === undefined) {
      await rm(tokenPath, { force: true });
    } else {
      await writeFile(tokenPath, previousToken);
      await chmod(tokenPath, previousMode);
    }
    await rm(unrelatedCwd, { recursive: true, force: true });
  });

  server = spawn(process.execPath, [startCli], {
    cwd: unrelatedCwd,
    env: {
      ...process.env,
      PORT: '0',
      UNITY_REMOTE_BIND: '127.0.0.1',
      UNITY_REMOTE_TOKEN: authToken,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const serverOutput = collect(server);
  const ready = await waitForOutput(server, serverOutput, /Unity Remote listening on:\s+http:\/\/127\.0\.0\.1:(\d+)/);
  const broker = `http://127.0.0.1:${ready[1]}`;

  assert.equal(await readFile(tokenPath, 'utf8'), authToken);
  assert.equal((await stat(tokenPath)).mode & 0o777, 0o600);

  const page = await fetch(`${broker}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /^text\/html/);
  const html = await page.text();
  const assetPaths = [...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)].map((match) => match[1]);
  assert.ok(assetPaths.length > 0, 'built index must reference at least one JS/CSS asset');
  const asset = await fetch(new URL(assetPaths[0], broker));
  assert.equal(asset.status, 200);
  assert.ok((await asset.arrayBuffer()).byteLength > 0);

  assert.equal((await fetch(`${broker}/api/project`)).status, 401);
  assert.equal((await fetch(`${broker}/api/project`, {
    headers: { authorization: 'Bearer wrong-token' },
  })).status, 401);

  const session = await fetch(`${broker}/api/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: authToken }),
  });
  assert.equal(session.status, 200);
  const cookie = session.headers.getSetCookie()[0].split(';', 1)[0];
  const sessionProjectResponse = await fetch(`${broker}/api/project`, { headers: { cookie } });
  assert.equal(sessionProjectResponse.status, 200);

  const cliResult = await runNode(remoteCli, ['project'], {
    cwd: unrelatedCwd,
    env: {
      ...process.env,
      UNITY_REMOTE_BROKER: broker,
      UNITY_REMOTE_TOKEN: 'unrelated-caller-token',
    },
  });
  assert.equal(cliResult.code, 0, cliResult.stderr);
  assert.equal(cliResult.signal, null);
  const project = JSON.parse(cliResult.stdout);
  assert.equal(project.project.source, 'demo', 'launcher smoke data is not evidence of a connected Unity Editor');
  assert.equal(project.project.connected, true);
  assert.equal(project.project.id, 'project-player');

  const stopped = waitForExit(server);
  server.kill('SIGTERM');
  assert.deepEqual(await stopped, { code: 0, signal: null });
});

test('token discovery reuses Game token and honors an explicit environment token', { concurrency: false }, async (t) => {
  const fixture = await mkdtemp(join(tmpdir(), 'janseon-unity-remote-token-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const fixtureToken = join(fixture, '.unity-remote-token');
  const { resolveAuthToken } = await import('./start-unity-remote.mjs');

  await writeFile(fixtureToken, 'retained-token\n');
  assert.equal(resolveAuthToken(fixtureToken, {}, () => 'generated-token'), 'retained-token');
  assert.equal(
    resolveAuthToken(fixtureToken, { UNITY_REMOTE_TOKEN: ' caller-token ' }, () => 'generated-token'),
    'caller-token',
  );
  await rm(fixtureToken);
  assert.equal(resolveAuthToken(fixtureToken, {}, () => 'generated-token'), 'generated-token');
});

test('setup is idempotent and never upgrades the pinned submodule remote', { concurrency: false }, async () => {
  const { setupUnityRemote } = await import('./setup-unity-remote.mjs');
  const calls = [];
  const run = (command, args, cwd) => calls.push({ command, args, cwd });
  setupUnityRemote(run);
  setupUnityRemote(run);
  const pass = [
    { command: 'git', args: ['submodule', 'update', '--init', '--', 'tools/unity-remote'], cwd: repoRoot },
    { command: 'npm', args: ['ci'], cwd: join(toolsRoot, 'unity-remote') },
    { command: 'npm', args: ['run', 'build'], cwd: join(toolsRoot, 'unity-remote') },
  ];
  assert.deepEqual(calls, [...pass, ...pass]);
});

test('tools package exposes the supported remote commands', { concurrency: false }, async () => {
  const manifest = JSON.parse(await readFile(join(toolsRoot, 'package.json'), 'utf8'));
  assert.deepEqual(
    Object.fromEntries(Object.entries(manifest.scripts).filter(([name]) => name.startsWith('remote:') || name === 'test:unity-remote')),
    {
      'remote:setup': 'node unity/setup-unity-remote.mjs',
      'remote:start': 'node unity/start-unity-remote.mjs',
      'remote:cli': 'node unity/run-unity-remote-cli.mjs',
      'test:unity-remote': 'node --test unity/test-unity-remote.mjs',
    },
  );
});
