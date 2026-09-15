#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const unityToolsRoot = dirname(fileURLToPath(import.meta.url));
const toolsRoot = resolve(unityToolsRoot, '..');
const repoRoot = resolve(toolsRoot, '..');
const gameRoot = join(repoRoot, 'Game');
const upstreamRoot = join(repoRoot, 'Tool', 'unity-remote');
const tokenPath = join(gameRoot, '.unity-remote-token');
const webRoot = join(upstreamRoot, 'dist', 'web');

export function resolveAuthToken(path = tokenPath, env = process.env, generate = () => randomBytes(32).toString('hex')) {
  const explicit = env.UNITY_REMOTE_TOKEN?.trim();
  if (explicit) return explicit;
  try {
    const retained = readFileSync(path, 'utf8').trim();
    if (retained) return retained;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return generate();
}

function persistToken(path, token) {
  const temporaryPath = `${path}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
  let descriptor;
  try {
    descriptor = openSync(temporaryPath, 'wx', 0o600);
    writeFileSync(descriptor, token, 'utf8');
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporaryPath, path);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    rmSync(temporaryPath, { force: true });
  }
}

export async function startUnityRemote(env = process.env) {
  if (!existsSync(join(upstreamRoot, 'dist', 'server', 'app.js')) || !existsSync(webRoot)) {
    throw new Error('Unity Remote is not built. Run `npm --prefix Tool run remote:setup` first.');
  }
  process.chdir(gameRoot);

  const [{ createApp }, { ConnectorHub }, hosts, { createDemoStore }] = await Promise.all([
    import(join(upstreamRoot, 'dist', 'server', 'app.js')),
    import(join(upstreamRoot, 'dist', 'server', 'connector.js')),
    import(join(upstreamRoot, 'dist', 'server', 'hosts.js')),
    import(join(upstreamRoot, 'dist', 'server', 'store.js')),
  ]);

  const configuredPort = Number.parseInt(env.PORT ?? '4173', 10);
  if (!Number.isInteger(configuredPort) || configuredPort < 0 || configuredPort > 65535) {
    throw new Error(`PORT must be an integer from 0 through 65535, received ${env.PORT}`);
  }
  const bindHost = hosts.resolveBindHost(env.UNITY_REMOTE_BIND);
  const authToken = resolveAuthToken(tokenPath, env);
  const bootstrapNonce = randomBytes(32).toString('hex');
  const sessionSecret = randomBytes(32).toString('hex');
  persistToken(tokenPath, authToken);

  const hub = new ConnectorHub();
  const app = createApp(createDemoStore(), {
    authToken,
    bootstrapNonce,
    sessionSecret,
    hub,
    webRoot,
  });

  await app.listen({ host: bindHost, port: configuredPort });
  const address = app.server.address();
  const port = typeof address === 'object' && address ? address.port : configuredPort;
  console.log(hosts.formatListenBanner({
    bindHost,
    port,
    tokenPath,
    bootstrapNonce,
    webBuilt: true,
  }));

  let closing;
  const close = () => {
    closing ??= app.close().then(() => {
      process.exitCode = 0;
    });
    return closing;
  };
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  return { app, close, port, tokenPath };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await startUnityRemote();
}
