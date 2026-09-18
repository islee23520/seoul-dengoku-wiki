import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { extractAtlasJson } from './world-atlas-parse.mjs';
import {
  assertApprovedSource,
  baselineKeys,
  gitShow as gitShowAt,
  loadManifest,
  mergeDiagrams,
  mergeGroupRecords,
  mergeMonsterContent,
  mergeStoryContent,
  verifyLiveDocs,
} from './verify-confirmed-integration.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, '..', '..', '..');
const verifier = fileURLToPath(new URL('./verify-confirmed-integration.mjs', import.meta.url));
const atlasPath = join(repositoryRoot, 'LORE', 'World-Narrative-Atlas.md');

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

function gitShow(sha, relPath) {
  return gitShowAt(repositoryRoot, sha, relPath);
}

function actorIds(content) {
  return (content?.actors ?? []).map((actor) => actor.id);
}

// Approved source commits predate public-term cleanup and the creative naming
// decision. Normalize those recorded projection edits on both sides so every
// unrelated byte must still match.
const BANNED_TERM_EDITS = JSON.parse(
  readFileSync(join(repositoryRoot, 'Research', 'verification', 'banned-term-replacements.json'), 'utf8'),
);
const CREATIVE_NAME_LEDGER = JSON.parse(
  readFileSync(join(repositoryRoot, 'Research', 'verification', 'creative-name-normalization.json'), 'utf8'),
);
const APPROVED_PROJECTION_EDITS = [
  ...BANNED_TERM_EDITS,
  ...CREATIVE_NAME_LEDGER.replacements,
].filter((edit) => edit.old && edit.new).sort((a, b) => b.old.length - a.old.length);
const APPROVED_PATTERN_EDITS = CREATIVE_NAME_LEDGER.pattern_replacements
  .filter((edit) => edit.pattern && edit.new)
  .map((edit) => ({ ...edit, regex: new RegExp(edit.pattern, 'gu') }));

function normalizeApprovedProjectionEdits(value) {
  let text = JSON.stringify(value);
  for (const edit of APPROVED_PROJECTION_EDITS) {
    text = text.split(JSON.stringify(edit.old).slice(1, -1)).join(JSON.stringify(edit.new).slice(1, -1));
  }
  for (const edit of APPROVED_PATTERN_EDITS) {
    text = text.replace(edit.regex, edit.new);
  }
  return JSON.parse(text);
}

const ATLAS_GIT_PATHS = [
  'docs/game-logic/World-Narrative-Atlas.md',
  'Wikis/game-logic/World-Narrative-Atlas.md',
  'GDD/game-logic/World-Narrative-Atlas.md',
  'LORE/World-Narrative-Atlas.md',
];
const MONSTER_PAGE_PREFIXES = [
  'docs/game-logic',
  'Wikis/game-logic',
  'GDD/game-logic',
  'LORE',
];
// Last pre-7-domain atlas whose humans (422) and landed fragments equal live LORE.
// world-atlas-verify.mjs pins the same census: `humans.length !== 422` → E_K_MAP.
const HUMANS_CENSUS_SHA = '24dc6bceb330fa510b46c8bd08f1e369105f87a0';

function gitAtlas(sha) {
  const errors = [];
  for (const relPath of ATLAS_GIT_PATHS) {
    const result = spawnSync('git', ['show', `${sha}:${relPath}`], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
    if (result.status === 0) {
      const parsed = extractAtlasJson(result.stdout);
      assert.equal(parsed.ok, true, parsed.error);
      return parsed.value;
    }
    errors.push(result.stderr ?? `exit ${result.status}`);
  }
  assert.equal(0, 1, errors.join('\n'));
}

function gitShowMonsterPage(sha, batchId) {
  const errors = [];
  for (const prefix of MONSTER_PAGE_PREFIXES) {
    try {
      return gitShow(sha, `${prefix}/Monster-Batch-${batchId}.md`);
    } catch (err) {
      errors.push(err?.detail ?? err?.message ?? String(err));
    }
  }
  assert.equal(0, 1, errors.join('\n'));
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
    ...manifest.groups['G07-G12'],
    ...manifest.groups['G13-G18'],
    ...manifest.groups['G19-G24'],
    ...manifest.groups['G25-G27'],
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
      join(repositoryRoot, 'LORE'),
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

test('Given an excluded group id When group merge is attempted Then E_EXCLUDED_ID', async () => {
  const manifest = await loadManifest();
  const excluding = { ...manifest, excluded: { ...manifest.excluded, groups: ['G19'] } };
  const sha = manifest.approved['G19-G24'];
  const target = { hostile_groups: [{ id: 'G19', prose: 'seed' }] };
  assert.throws(
    () => mergeGroupRecords(target, {
      fragmentId: 'G19-G24',
      groupIds: ['G19'],
      sha,
      sourceAtlas: gitAtlas(sha),
      manifest: excluding,
    }),
    (err) => err.code === 'E_EXCLUDED_ID',
  );
  assert.equal(target.hostile_groups[0].prose, 'seed');
});

test('Given approved G19-G24 blob When merged over seed records Then dossier records land', async () => {
  const manifest = await loadManifest();
  const sha = manifest.approved['G19-G24'];
  const target = { hostile_groups: manifest.groups['G19-G24'].map((id) => ({ id, prose: 'seed' })) };
  mergeGroupRecords(target, {
    fragmentId: 'G19-G24',
    groupIds: manifest.groups['G19-G24'],
    sha,
    sourceAtlas: gitAtlas(sha),
    manifest,
  });
  for (const group of target.hostile_groups) {
    assert.ok(group.dossier_prose, group.id);
  }
});

test('Given live candidate When monster pages are atlas projections Then every page has a record and excluded batches stay absent', async () => {
  const manifest = await loadManifest();
  const { atlas, presentMonsterIds } = await verifyLiveDocs({
    repoRoot: repositoryRoot,
    manifest,
  });
  const keys = baselineKeys(atlas);
  assert.deepEqual(keys.monsterContents, manifest.monsters);
  assert.deepEqual([...presentMonsterIds].sort(), manifest.monsters);
  for (const id of manifest.excluded.monsters) {
    assert.equal(atlas.monster_contents[id], undefined, id);
    assert.equal(presentMonsterIds.includes(id), false, id);
  }
  assert.equal(
    manifest.incomplete,
    manifest.excluded.social.length + manifest.excluded.groups.length + manifest.excluded.monsters.length > 0,
  );
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

test('Given excluded M007 When monster merge is attempted Then E_EXCLUDED_ID', async () => {
  const manifest = await loadManifest();
  const target = { monster_contents: {} };
  assert.throws(
    () => mergeMonsterContent(target, {
      batchId: 'M007',
      sha: manifest.approved.M001,
      sourceAtlas: { monster_contents: { M007: { entries: [] } } },
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

test('Given approved source SHAs When live atlas is compared Then every landed record matches its source and humans stay', async () => {
  const manifest = await loadManifest();
  const live = extractAtlasJson(await (await import('node:fs/promises')).readFile(atlasPath, 'utf8'));
  assert.equal(live.ok, true, live.error);
  const atlas = live.value;
  // Live atlas is LORE/World-Narrative-Atlas.md. Census pin 422 matches
  // world-atlas-verify.mjs (`humans.length !== 422` → E_K_MAP). Historical
  // approved SHAs prove the fragment existed; git-show uses the path that SHA's
  // tree actually had (docs/game-logic before the restructure).
  const census = gitAtlas(HUMANS_CENSUS_SHA);
  assert.equal(atlas.humans.length, 422);
  assert.deepEqual(normalizeApprovedProjectionEdits(atlas.humans), normalizeApprovedProjectionEdits(census.humans));
  assert.deepEqual(Object.keys(atlas.story_contents), manifest.social);
  const sourceCache = new Map();
  const sourceAtlas = (sha) => {
    if (!sourceCache.has(sha)) sourceCache.set(sha, gitAtlas(sha));
    return sourceCache.get(sha);
  };
  for (const id of manifest.social) {
    const historical = sourceAtlas(manifest.approved[id]).story_contents[id];
    assert.ok(historical, `${id} missing at ${manifest.approved[id]}`);
    const expected = census.story_contents[id];
    assert.ok(expected, `${id} missing at census ${HUMANS_CENSUS_SHA}`);
    assert.deepEqual(
      actorIds(atlas.story_contents[id]),
      actorIds(expected),
      id,
    );
  }
  for (const [fragment, ids] of Object.entries(manifest.groups)) {
    const historical = sourceAtlas(manifest.approved[fragment]);
    for (const id of ids) {
      assert.ok(
        historical.hostile_groups.find((group) => group.id === id),
        `${id} missing at ${manifest.approved[fragment]}`,
      );
      assert.ok(
        atlas.hostile_groups.find((group) => group.id === id),
        `${id} missing in live atlas`,
      );
    }
  }
  for (const id of manifest.monsters) {
    const liveBatch = atlas.monster_contents[id];
    assert.ok(liveBatch, id);
    if (!manifest.approved[id]) continue;
    if (manifest.monsterSources[id] === 'canonical-branch-record') {
      assert.ok(sourceAtlas(manifest.approved[id]).monster_contents[id], `${id} missing at ${manifest.approved[id]}`);
    } else {
      gitShowMonsterPage(manifest.approved[id], id);
    }
  }
});

test('Given excluded B017 When story-batch stage Then E_STORY_CONTENT and worldbuilding stays incomplete', () => {
  const expansion = fileURLToPath(new URL('./verify-world-expansion.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [
    expansion,
    '--docs', join(repositoryRoot, 'LORE'),
    '--stage', 'story-batch',
    '--batch', 'B017',
    '--atlas', atlasPath,
  ], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^E_STORY_CONTENT: B017/m);
});

test('Given excluded M007 When monster-batch stage Then E_MONSTER_CONTENT', () => {
  const expansion = fileURLToPath(new URL('./verify-world-expansion.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [
    expansion,
    '--docs', join(repositoryRoot, 'LORE'),
    '--stage', 'monster-batch',
    '--batch', 'M007',
    '--atlas', atlasPath,
  ], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^E_MONSTER_CONTENT: M007/m);
});
