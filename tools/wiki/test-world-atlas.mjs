import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { materializeWorldAtlas } from './materialize-world-atlas.mjs';

const verifier = fileURLToPath(new URL('./verify-world-expansion.mjs', import.meta.url));
const materializer = fileURLToPath(new URL('./materialize-world-atlas.mjs', import.meta.url));
const repositoryRoot = resolve(dirname(verifier), '..', '..');
const liveDocs = join(repositoryRoot, 'docs', 'game-logic');
const atlasPath = join(liveDocs, 'World-Narrative-Atlas.md');
const fixtures = [];

after(async () => {
  for (const dir of fixtures) await rm(dir, { recursive: true, force: true });
});

function runVerifier(args) {
  const result = spawnSync(process.execPath, [verifier, ...args], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  return {
    code: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

test('Given current repository When houses stage Then atlas has 24 houses and Operating-Houses projection', () => {
  const result = runVerifier(['--docs', liveDocs, '--stage', 'houses', '--atlas', atlasPath]);
  assert.equal(result.code, 0, result.output);
});

test('Given a company mark in house prose When houses stage Then E_COMPANY_TOKEN', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-house-token-'));
  fixtures.push(dir);
  const docs = join(dir, 'docs', 'game-logic');
  const { cpSync, mkdirSync } = await import('node:fs');
  mkdirSync(docs, { recursive: true });
  mkdirSync(join(dir, '.omo', 'research-private'), { recursive: true });
  cpSync(liveDocs, docs, { recursive: true });
  cpSync(
    join(repositoryRoot, '.omo', 'research-private', 'nippon-sangoku-canon-bridge.md'),
    join(dir, '.omo', 'research-private', 'nippon-sangoku-canon-bridge.md'),
  );
  const atlas = join(docs, 'World-Narrative-Atlas.md');
  const text = await readFile(atlas, 'utf8');
  await writeFile(atlas, text.replace('야간 냉각 분배', '삼성전자 냉각 분배'));
  const result = runVerifier(['--docs', docs, '--stage', 'houses', '--atlas', atlas]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^E_COMPANY_TOKEN:/m);
});

test('Given two materializer --check runs When atlas is unchanged Then hashes match', () => {
  const first = spawnSync(process.execPath, [materializer, '--atlas', atlasPath, '--check'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  const second = spawnSync(process.execPath, [materializer, '--atlas', atlasPath, '--check'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);
});

test('Given a mutated projection When materializer --check Then nonzero', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-house-check-'));
  fixtures.push(dir);
  const result = await materializeWorldAtlas({ atlasPath, outDir: dir, check: false });
  const target = join(dir, 'Operating-Houses.md');
  const body = await readFile(target, 'utf8');
  await writeFile(target, `${body}\n손댐\n`);
  await assert.rejects(
    () => materializeWorldAtlas({ atlasPath, outDir: dir, check: true }),
    /stale Operating-Houses.md/,
  );
  assert.ok(result.hashes['Operating-Houses.md']);
});
