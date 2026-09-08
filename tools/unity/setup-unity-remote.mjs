#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const unityToolsRoot = dirname(fileURLToPath(import.meta.url));
const toolsRoot = resolve(unityToolsRoot, '..');
const repoRoot = resolve(toolsRoot, '..');
const upstreamRoot = join(toolsRoot, 'unity-remote');

function runChecked(command, args, cwd) {
  const env = { ...process.env };
  if (command === 'npm') {
    for (const key of Object.keys(env)) {
      if (key.toLowerCase() === 'npm_config_allow_scripts') delete env[key];
    }
    // npm 12 exports a caller's project-scoped allowScripts policy to child
    // npm commands, where npm rejects it before `ci` can read this package.
    // Clear only that inherited policy; preserve registry/auth configuration.
    env.NPM_CONFIG_ALLOW_SCRIPTS = '';
  }
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with status ${result.status}`);
  }
}

export function setupUnityRemote(run = runChecked) {
  run('git', ['submodule', 'update', '--init', '--', 'tools/unity-remote'], repoRoot);
  run('npm', ['ci'], upstreamRoot);
  run('npm', ['run', 'build'], upstreamRoot);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  setupUnityRemote();
}
