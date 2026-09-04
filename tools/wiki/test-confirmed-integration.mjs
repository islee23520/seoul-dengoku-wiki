import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { extractAtlasJson } from './world-atlas-parse.mjs';
import {
  assertApprovedSource,
  baselineKeys,
  loadManifest,
  mergeDiagrams,
  mergeGroupRecords,
  mergeStoryContent,
  verifyLiveDocs,
} from './verify-confirmed-integration.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, '..', '..');
const verifier = fileURLToPath(new URL('./verify-confirmed-integration.mjs', import.meta.url));
const atlasPath = join(repositoryRoot, 'docs', 'game-logic', 'World-Narrative-Atlas.md');

function runLive(args) {
  const result = spawnSync(process.execPath, [verifier, ...args], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  return {
    code: result.status,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
  };
}

function gitAtlas(sha) {
  const result = spawnSync('git', ['show', `${sha}:docs/game-logic/World-Narrative-Atlas.md`], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  const parsed = extractAtlasJson(result.stdout);
  assert.equal(parsed.ok, true, parsed.error);
  return parsed.value;
}

test('Given confirmed social records When live atlas is checked Then only approved story IDs exist', async () => {
  const manifest = await loadManifest();
  const { atlas, violations } = await verifyLiveDocs({
    repoRoot: repositoryRoot,
    manifest,
    requireSocial: true,
  });
  assert.equal(violations.length, 0, JSON.stringify(violations));
  const keys = baselineKeys(atlas);
  assert.deepEqual(keys.storyContents, manifest.social);
  assert.equal(keys.monsterContents.length, 0);
  assert.equal(keys.diagramCount, 3);
  assert.deepEqual(keys.dossierGroups, manifest.groups['G01-G06']);
  for (const id of manifest.excluded.social) {
    assert.equal(atlas.story_contents[id], undefined, id);
  }
});

test('Given current repository When B001 story-batch stage Then verifier exits 0', () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('./verify-world-expansion.mjs', import.meta.url)),
      '--docs',
      join(repositoryRoot, 'docs', 'game-logic'),
      '--stage',
      'story-batch',
      '--batch',
      'B001',
      '--atlas',
      atlasPath,
    ],
    { cwd: repositoryRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});

test('Given an unapproved SHA When merging a social fragment Then E_UNAPPROVED_SHA', async () => {
  const manifest = await loadManifest();
  const target = { story_contents: {} };
  assert.throws(
    () => assertApprovedSource(manifest, 'B002', '0'.repeat(40)),
    (err) => err.code === 'E_UNAPPROVED_SHA',
  );
  assert.throws(
    () => mergeStoryContent(target, {
      batchId: 'B002',
      sha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      sourceAtlas: { story_contents: { B002: { actors: [] } } },
      manifest,
    }),
    (err) => err.code === 'E_UNAPPROVED_SHA',
  );
});

test('Given excluded B017 When merge is attempted Then E_EXCLUDED_ID', async () => {
  const manifest = await loadManifest();
  assert.throws(
    () => assertApprovedSource(manifest, 'B017', '886ac82'),
    (err) => err.code === 'E_EXCLUDED_ID',
  );
});

test('Given two different payloads for the same story ID When merged Then E_DUPLICATE_ID', async () => {
  const manifest = await loadManifest();
  const sha = manifest.approved.B002;
  const first = { actors: [{ id: 'K247', sections: { a: 'one' } }] };
  const second = { actors: [{ id: 'K247', sections: { a: 'two' } }] };
  const target = { story_contents: { B002: first } };
  assert.throws(
    () => mergeStoryContent(target, {
      batchId: 'B002',
      sha,
      sourceAtlas: { story_contents: { B002: second } },
      manifest,
    }),
    (err) => err.code === 'E_DUPLICATE_ID',
  );
});

test('Given overlapping actor IDs from two approved batches When merged Then E_DUPLICATE_ID', async () => {
  const manifest = await loadManifest();
  const target = { story_contents: { B001: { actors: [{ id: 'K001' }] } } };
  assert.throws(
    () => mergeStoryContent(target, {
      batchId: 'B002',
      sha: manifest.approved.B002,
      sourceAtlas: { story_contents: { B002: { actors: [{ id: 'K001' }] } } },
      manifest,
    }),
    (err) => err.code === 'E_DUPLICATE_ID',
  );
});

test('Given approved B002 blob When merged into empty story_contents Then only B002 is copied', async () => {
  const manifest = await loadManifest();
  const sha = manifest.approved.B002;
  const sourceAtlas = gitAtlas(sha);
  const target = { story_contents: {} };
  mergeStoryContent(target, { batchId: 'B002', sha, sourceAtlas, manifest });
  assert.deepEqual(Object.keys(target.story_contents), ['B002']);
  assert.equal(target.story_contents.B002.actors.length, 10);
  assert.equal(sourceAtlas.story_contents.B001 !== undefined, true);
});

test('Given G19 When group merge is attempted Then E_EXCLUDED_ID', async () => {
  const manifest = await loadManifest();
  const sha = manifest.approved['G01-G06'];
  const target = { hostile_groups: [{ id: 'G19', prose: 'seed' }] };
  assert.throws(
    () => mergeGroupRecords(target, {
      fragmentId: 'G01-G06',
      groupIds: ['G19'],
      sha,
      sourceAtlas: gitAtlas(sha),
      manifest,
    }),
    (err) => err.code === 'E_EXCLUDED_ID',
  );
});

test('Given ISO blob When diagrams merge Then three diagram records land', async () => {
  const manifest = await loadManifest();
  const sha = manifest.approved.ISO;
  const target = {};
  mergeDiagrams(target, { sha, sourceAtlas: gitAtlas(sha), manifest });
  assert.equal(target.diagrams.length, 3);
});

test('Given confirmed social records When CLI --require-social Then exit 0', () => {
  const result = runLive(['--require-social']);
  assert.equal(result.code, 0, result.stderr);
});

test('Given confirmed G01-G18 and ISO When CLI --require-groups Then exit 0', () => {
  const result = runLive(['--require-social', '--require-groups']);
  assert.equal(result.code, 0, result.stderr);
});

test('Given confirmed monster pages When CLI --require-monsters Then exit 0', () => {
  const result = runLive(['--require-social', '--require-groups', '--require-monsters']);
  assert.equal(result.code, 0, result.stderr);
});

test('Given excluded B017 When story-batch stage Then E_STORY_CONTENT and worldbuilding stays incomplete', () => {
  const expansion = fileURLToPath(new URL('./verify-world-expansion.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [
    expansion,
    '--docs', join(repositoryRoot, 'docs', 'game-logic'),
    '--stage', 'story-batch',
    '--batch', 'B017',
    '--atlas', atlasPath,
  ], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^E_STORY_CONTENT: B017/m);
});

test('Given excluded M003 When monster-batch stage Then E_MONSTER_CONTENT', () => {
  const expansion = fileURLToPath(new URL('./verify-world-expansion.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [
    expansion,
    '--docs', join(repositoryRoot, 'docs', 'game-logic'),
    '--stage', 'monster-batch',
    '--batch', 'M003',
    '--atlas', atlasPath,
  ], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^E_MONSTER_CONTENT: M003/m);
});
