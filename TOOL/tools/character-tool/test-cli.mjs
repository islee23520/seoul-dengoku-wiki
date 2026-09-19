import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

test('CLI entry point exists for installed command', () => {
  assert.ok(existsSync(cli), 'character-tool executable entry point is not implemented');
});

test('doctor explicitly rejects a missing configured Blender', () => {
  const result = run('--json', 'doctor', '--blender', '/not-installed/blender');
  assert.notEqual(result.status, 0);
  assert.equal(JSON.parse(result.stdout).error.code, 'BLENDER_NOT_FOUND');
});

test('unknown command returns structured usage error', () => {
  const result = run('--json', 'destroy-everything');
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).error.code, 'USAGE');
});

test('write commands reject omitted output before launching Blender', () => {
  const result = run('--json', 'align', '--input', '/not-installed/model.glb');
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).error.code, 'USAGE');
});

test('Unity destination traversal fails before creating any files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'character-cli-test-'));
  try {
    const result = run('--json', 'unity-import', '--input', join(dir, 'mesh.fbx'),
      '--project', dir, '--destination', 'Assets/Art/Staging/../../Resources/Injected');
    assert.equal(result.status, 2);
    assert.equal(JSON.parse(result.stdout).error.code, 'STAGING_PATH');
    assert.equal(existsSync(join(dir, 'Assets')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
