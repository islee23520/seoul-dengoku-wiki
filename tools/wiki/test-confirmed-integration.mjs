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
  mergeMonsterContent,
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
  assert.equal(keys.diagramCount, 3);
  assert.deepEqual(keys.dossierGroups.slice(0, 6), manifest.groups['G01-G06']);
  assert.deepEqual(keys.dossierGroups, [
    ...manifest.groups['G01-G06'],
    ...manifest.groups['G13-G18'],
  ]);
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

test('Given live partial candidate When monster pages exist without atlas contents Then worldbuilding stays incomplete', async () => {
  const manifest = await loadManifest();
  const { atlas, presentMonsterIds } = await verifyLiveDocs({
    repoRoot: repositoryRoot,
    manifest,
  });
  assert.equal(manifest.incomplete, true);
  const keys = baselineKeys(atlas);
  assert.deepEqual(keys.monsterContents, []);
  assert.ok(presentMonsterIds.includes('M001'));
  assert.equal(presentMonsterIds.includes('M003'), false);
  assert.equal(atlas.monster_contents?.M001, undefined);
});

test('Given an unapproved SHA When merging a monster fragment Then E_UNAPPROVED_SHA', async () => {
  const manifest = await loadManifest();
  const target = { monster_contents: {} };
  assert.throws(
    () => mergeMonsterContent(target, {
      batchId: 'M001',
      sha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      sourceAtlas: { monster_contents: { M001: { entries: [] } } },
      manifest,
    }),
    (err) => err.code === 'E_UNAPPROVED_SHA',
  );
  assert.deepEqual(target.monster_contents, {});
});

test('Given excluded M003 When monster merge is attempted Then E_EXCLUDED_ID', async () => {
  const manifest = await loadManifest();
  const target = { monster_contents: {} };
  assert.throws(
    () => mergeMonsterContent(target, {
      batchId: 'M003',
      sha: manifest.approved.M001,
      sourceAtlas: { monster_contents: { M003: { entries: [] } } },
      manifest,
    }),
    (err) => err.code === 'E_EXCLUDED_ID',
  );
});

test('Given two different payloads for the same monster ID When merged Then E_DUPLICATE_ID', async () => {
  const manifest = await loadManifest();
  const sha = manifest.approved.M001;
  const first = { entries: [{ id: 'G01E01', display_name: 'one', group_id: 'G01', role_class: 'alpha', prose: 'a' }] };
  const second = { entries: [{ id: 'G01E01', display_name: 'two', group_id: 'G01', role_class: 'alpha', prose: 'b' }] };
  const target = { monster_contents: { M001: first } };
  assert.throws(
    () => mergeMonsterContent(target, {
      batchId: 'M001',
      sha,
      sourceAtlas: { monster_contents: { M001: second } },
      manifest,
    }),
    (err) => err.code === 'E_DUPLICATE_ID',
  );
  assert.deepEqual(target.monster_contents.M001, first);
});

test('Given overlapping entry IDs from two approved monster batches When merged Then E_DUPLICATE_ID', async () => {
  const manifest = await loadManifest();
  const target = {
    monster_contents: {
      M002: { entries: [{ id: 'G01E01', display_name: 'kept', group_id: 'G01', role_class: 'alpha', prose: 'kept' }] },
    },
  };
  assert.throws(
    () => mergeMonsterContent(target, {
      batchId: 'M001',
      sha: manifest.approved.M001,
      sourceAtlas: {
        monster_contents: {
          M001: { entries: [{ id: 'G01E01', display_name: 'dup', group_id: 'G01', role_class: 'alpha', prose: 'dup' }] },
        },
      },
      manifest,
    }),
    (err) => err.code === 'E_DUPLICATE_ID',
  );
  assert.deepEqual(Object.keys(target.monster_contents), ['M002']);
});

test('Given missing monster_contents When merging an approved batch Then E_MISSING_FRAGMENT', async () => {
  const manifest = await loadManifest();
  const target = { monster_contents: {} };
  assert.throws(
    () => mergeMonsterContent(target, {
      batchId: 'M001',
      sha: manifest.approved.M001,
      sourceAtlas: { monster_contents: {} },
      manifest,
    }),
    (err) => err.code === 'E_MISSING_FRAGMENT',
  );
});

test('Given approved M001 payload When merged Then M001 lands and other sources stay', async () => {
  const manifest = await loadManifest();
  const sha = manifest.approved.M001;
  const incoming = {
    entries: [{ id: 'G01E01', display_name: 'alpha', group_id: 'G01', role_class: 'alpha', prose: 'body' }],
  };
  const kept = {
    entries: [{ id: 'G01E11', display_name: 'kept', group_id: 'G01', role_class: 'common', prose: 'other' }],
  };
  const target = { monster_contents: { M002: kept }, story_contents: { B001: { actors: [] } } };
  mergeMonsterContent(target, {
    batchId: 'M001',
    sha,
    sourceAtlas: { monster_contents: { M001: incoming } },
    manifest,
  });
  assert.deepEqual(target.monster_contents.M001, incoming);
  assert.deepEqual(target.monster_contents.M002, kept);
  assert.deepEqual(Object.keys(target.story_contents), ['B001']);
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

test('Given independently specified repaired sources When live atlas is compared Then selected units match and others stay', async () => {
  const manifest = await loadManifest();
  const live = extractAtlasJson(await (await import('node:fs/promises')).readFile(atlasPath, 'utf8'));
  assert.equal(live.ok, true, live.error);
  const atlas = live.value;
  const base = gitAtlas('6ef55553ec8e5ed06ff8061a69947ce347eae85a');
  const b009 = gitAtlas(manifest.approved.B009);
  const b013 = gitAtlas(manifest.approved.B013);
  const b015 = gitAtlas(manifest.approved.B015);
  const groups = gitAtlas(manifest.approved['G13-G18']);
  assert.deepEqual(atlas.story_contents.B009, b009.story_contents.B009);
  assert.deepEqual(atlas.story_contents.B013, b013.story_contents.B013);
  assert.deepEqual(atlas.story_contents.B015, b015.story_contents.B015);
  for (const id of manifest.groups['G13-G18']) {
    assert.deepEqual(
      atlas.hostile_groups.find((group) => group.id === id),
      groups.hostile_groups.find((group) => group.id === id),
      id,
    );
  }
  assert.equal(atlas.humans.length, 412);
  assert.deepEqual(atlas.humans, base.humans);
  for (const id of Object.keys(atlas.story_contents)) {
    if (id === 'B009' || id === 'B013' || id === 'B015') continue;
    assert.deepEqual(atlas.story_contents[id], base.story_contents[id], id);
  }
  for (const group of atlas.hostile_groups) {
    if (manifest.groups['G13-G18'].includes(group.id)) continue;
    assert.deepEqual(group, base.hostile_groups.find((row) => row.id === group.id), group.id);
  }
  assert.equal(manifest.incomplete, true);
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
