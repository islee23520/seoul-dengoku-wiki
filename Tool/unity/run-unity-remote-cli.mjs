#!/usr/bin/env node
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const unityToolsRoot = dirname(fileURLToPath(import.meta.url));
const toolsRoot = resolve(unityToolsRoot, '..');
const repoRoot = resolve(toolsRoot, '..');
const gameTokenPath = join(repoRoot, 'Game', '.unity-remote-token');
const upstreamCli = join(repoRoot, 'Tool', 'unity-remote', 'dist', 'cli', 'index.js');

const { runCli } = await import(upstreamCli);
// The repository command deliberately uses the project token file regardless of
// an unrelated shell-level token. Callers can still pass an explicit --token.
delete process.env.UNITY_REMOTE_TOKEN;
process.exitCode = await runCli([
  process.execPath,
  'unity-remote',
  '--token-file',
  gameTokenPath,
  ...process.argv.slice(2),
]);
