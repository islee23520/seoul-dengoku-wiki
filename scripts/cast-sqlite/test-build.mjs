import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildCastDatabase, CANONICAL_CAST_DATABASE, DEFAULT_SOURCE_ROOT, isCanonicalCastOutput } from './build.mjs';

test('existing output wins over missing source and preserves exact bytes', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'cast-build-preflight-'));
  t.after(async () => {
    assert.ok(relative(resolve(tmpdir()), resolve(root)).startsWith('cast-build-preflight-'));
    await rm(root, { recursive: true, force: true });
  });
  const outputPath = join(root, 'existing.sqlite');
  const original = Buffer.from('existing bytes\0');
  await writeFile(outputPath, original);
  await assert.rejects(buildCastDatabase({ sourceRoot: join(root, 'missing'), outputPath }), { code: 'E_OUTPUT_EXISTS' });
  assert.deepEqual(await readFile(outputPath), original);
});

test('output in the read-only source tree is rejected before writing', async () => {
  await assert.rejects(buildCastDatabase({ sourceRoot: DEFAULT_SOURCE_ROOT,
    outputPath: join(DEFAULT_SOURCE_ROOT, 'forbidden-cast-test.sqlite') }), { code: 'E_OUTPUT_SOURCE_ROOT' });
});

test('the canonical identity is recognized but authoring output cannot overwrite it', async () => {
  assert.equal(isCanonicalCastOutput(DEFAULT_SOURCE_ROOT, join(DEFAULT_SOURCE_ROOT, CANONICAL_CAST_DATABASE)), true);
  assert.equal(isCanonicalCastOutput(DEFAULT_SOURCE_ROOT, join(DEFAULT_SOURCE_ROOT, 'forbidden-cast-test.sqlite')), false);
  await assert.rejects(buildCastDatabase({ outputPath: join(DEFAULT_SOURCE_ROOT, CANONICAL_CAST_DATABASE) }), { code: 'E_AUTHORITY_OUTPUT' });
});

test('runtime preflight rejects unsupported Node before source access', () => {
  const moduleUrl = new URL('./build.mjs', import.meta.url).href;
  const script = `Object.defineProperty(process.versions, 'node', { value: '22.0.0' });
    const { buildCastDatabase } = await import(${JSON.stringify(moduleUrl)});
    try { await buildCastDatabase({ sourceRoot: 'missing', outputPath: 'missing/out.sqlite' }); process.exitCode = 2; }
    catch (error) { if (error.code !== 'E_NODE_VERSION') throw error; console.log(error.code); }`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'E_NODE_VERSION');
});

test('default source root is the wiki repository containing the builder', () => {
  assert.equal(DEFAULT_SOURCE_ROOT, resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'));
});

test('build CLI rejects force, update, missing value and repeated options', () => {
  const path = fileURLToPath(new URL('./build.mjs', import.meta.url));
  for (const args of [['--force'], ['--update'], ['--source-root'], ['--require-clean', '--require-clean']]) {
    const result = spawnSync(process.execPath, [path, ...args], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stdout}`);
    assert.match(result.stderr, /E_BUILD_USAGE/);
  }
});
