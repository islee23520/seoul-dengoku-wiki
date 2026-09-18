import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractAtlasJson } from './world-atlas-parse.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const defaultManifestPath = join(here, 'confirmed-integration-manifest.json');
const defaultRepoRoot = resolve(here, '..', '..', '..');
const defaultAtlasRel = join('LORE', 'World-Narrative-Atlas.md');

export function IntegrationError(code, detail) {
  const err = new Error(`${code}: ${detail}`);
  err.code = code;
  err.detail = detail;
  return err;
}

export async function loadManifest(path = defaultManifestPath) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export function assertApprovedSource(manifest, fragmentId, sha) {
  if ((manifest.excluded?.social ?? []).includes(fragmentId)) {
    throw IntegrationError('E_EXCLUDED_ID', fragmentId);
  }
  if ((manifest.excluded?.groups ?? []).includes(fragmentId)) {
    throw IntegrationError('E_EXCLUDED_ID', fragmentId);
  }
  if ((manifest.excluded?.monsters ?? []).includes(fragmentId)) {
    throw IntegrationError('E_EXCLUDED_ID', fragmentId);
  }
  const expected = manifest.approved?.[fragmentId];
  if (!expected) throw IntegrationError('E_UNAPPROVED_SHA', `${fragmentId} not in allowlist`);
  if (sha !== expected) {
    throw IntegrationError('E_UNAPPROVED_SHA', `${fragmentId} sha=${sha} expected=${expected}`);
  }
}

export function gitShow(repoRoot, sha, relPath) {
  const result = spawnSync('git', ['show', `${sha}:${relPath}`], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw IntegrationError(
      'E_GIT_SHOW',
      `${sha}:${relPath} ${result.stderr || result.error || `exit ${result.status}`}`,
    );
  }
  return result.stdout;
}

export function atlasFromMarkdown(markdown) {
  const parsed = extractAtlasJson(markdown);
  if (!parsed.ok) throw IntegrationError('E_ATLAS_SCHEMA', parsed.error);
  return parsed.value;
}

export function replaceAtlasJson(markdown, atlas) {
  if (!/```json\s*[\s\S]*?```/.test(markdown)) {
    throw IntegrationError('E_ATLAS_SCHEMA', 'missing json fence');
  }
  return markdown.replace(/```json\s*[\s\S]*?```/, `\`\`\`json\n${JSON.stringify(atlas, null, 2)}\n\`\`\``);
}

export function actorIdsFromStoryContent(content) {
  return (content?.actors ?? []).map((actor) => actor.id).filter(Boolean);
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function mergeStoryContent(targetAtlas, { batchId, sha, sourceAtlas, manifest }) {
  assertApprovedSource(manifest, batchId, sha);
  if ((manifest.excluded?.social ?? []).includes(batchId)) {
    throw IntegrationError('E_EXCLUDED_ID', batchId);
  }
  const incoming = sourceAtlas?.story_contents?.[batchId];
  if (!incoming) throw IntegrationError('E_MISSING_FRAGMENT', `${batchId} story_contents missing at ${sha}`);
  targetAtlas.story_contents ??= {};
  const existing = targetAtlas.story_contents[batchId];
  if (existing && !deepEqual(existing, incoming)) {
    throw IntegrationError('E_DUPLICATE_ID', `${batchId} conflicting story_contents`);
  }
  const owned = new Map();
  for (const [id, content] of Object.entries(targetAtlas.story_contents)) {
    if (id === batchId) continue;
    for (const actorId of actorIdsFromStoryContent(content)) {
      owned.set(actorId, id);
    }
  }
  for (const actorId of actorIdsFromStoryContent(incoming)) {
    const owner = owned.get(actorId);
    if (owner) throw IntegrationError('E_DUPLICATE_ID', `actor ${actorId} in ${owner} and ${batchId}`);
  }
  targetAtlas.story_contents[batchId] = incoming;
  return targetAtlas;
}

export function mergeGroupRecords(targetAtlas, { fragmentId, groupIds, sha, sourceAtlas, manifest }) {
  assertApprovedSource(manifest, fragmentId, sha);
  const sourceGroups = new Map((sourceAtlas?.hostile_groups ?? []).map((group) => [group.id, group]));
  targetAtlas.hostile_groups ??= [];
  for (const groupId of groupIds) {
    if ((manifest.excluded?.groups ?? []).includes(groupId)) {
      throw IntegrationError('E_EXCLUDED_ID', groupId);
    }
    const incoming = sourceGroups.get(groupId);
    if (!incoming) throw IntegrationError('E_MISSING_FRAGMENT', `${groupId} missing at ${sha}`);
    const index = targetAtlas.hostile_groups.findIndex((group) => group.id === groupId);
    if (index === -1) throw IntegrationError('E_MISSING_FRAGMENT', `${groupId} missing in target atlas`);
    const existing = targetAtlas.hostile_groups[index];
    if (existing && existing.owner_fragment && existing.owner_fragment !== fragmentId && !deepEqual(existing, incoming)) {
      throw IntegrationError('E_DUPLICATE_ID', `${groupId} conflicting hostile_groups`);
    }
    targetAtlas.hostile_groups[index] = incoming;
  }
  return targetAtlas;
}

export function entryIdsFromMonsterContent(content) {
  return (content?.entries ?? []).map((entry) => entry.id).filter(Boolean);
}

export function mergeMonsterContent(targetAtlas, { batchId, sha, sourceAtlas, manifest }) {
  assertApprovedSource(manifest, batchId, sha);
  if ((manifest.excluded?.monsters ?? []).includes(batchId)) {
    throw IntegrationError('E_EXCLUDED_ID', batchId);
  }
  const incoming = sourceAtlas?.monster_contents?.[batchId];
  if (!incoming) throw IntegrationError('E_MISSING_FRAGMENT', `${batchId} monster_contents missing at ${sha}`);
  targetAtlas.monster_contents ??= {};
  const existing = targetAtlas.monster_contents[batchId];
  if (existing && !deepEqual(existing, incoming)) {
    throw IntegrationError('E_DUPLICATE_ID', `${batchId} conflicting monster_contents`);
  }
  const owned = new Map();
  for (const [id, content] of Object.entries(targetAtlas.monster_contents)) {
    if (id === batchId) continue;
    for (const entryId of entryIdsFromMonsterContent(content)) {
      owned.set(entryId, id);
    }
  }
  for (const entryId of entryIdsFromMonsterContent(incoming)) {
    const owner = owned.get(entryId);
    if (owner) throw IntegrationError('E_DUPLICATE_ID', `entry ${entryId} in ${owner} and ${batchId}`);
  }
  targetAtlas.monster_contents[batchId] = incoming;
  return targetAtlas;
}

export function mergeDiagrams(targetAtlas, { sha, sourceAtlas, manifest }) {
  assertApprovedSource(manifest, 'ISO', sha);
  const incoming = sourceAtlas?.diagrams;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    throw IntegrationError('E_MISSING_FRAGMENT', `ISO diagrams missing at ${sha}`);
  }
  if (targetAtlas.diagrams && !deepEqual(targetAtlas.diagrams, incoming)) {
    throw IntegrationError('E_DUPLICATE_ID', 'diagrams conflicting');
  }
  targetAtlas.diagrams = incoming;
  return targetAtlas;
}

export function baselineKeys(atlas) {
  return {
    top: Object.keys(atlas),
    storyContents: Object.keys(atlas.story_contents ?? {}),
    monsterContents: Object.keys(atlas.monster_contents ?? {}),
    diagramCount: Array.isArray(atlas.diagrams) ? atlas.diagrams.length : 0,
    groupIds: (atlas.hostile_groups ?? []).map((group) => group.id),
    dossierGroups: (atlas.hostile_groups ?? []).filter((group) => group.dossier_prose).map((group) => group.id),
  };
}

export function verifyLiveAtlas(atlas, manifest, opts = {}) {
  const violations = [];
  const fail = (code, detail) => violations.push({ code, detail });
  const socialPresent = Object.keys(atlas.story_contents ?? {});
  const allowedSocial = new Set(manifest.social);
  const excludedSocial = new Set(manifest.excluded.social);
  for (const id of socialPresent) {
    if (excludedSocial.has(id)) fail('E_EXCLUDED_ID', id);
    if (!allowedSocial.has(id)) fail('E_UNAPPROVED_SHA', `story_contents ${id}`);
  }
  const groupById = new Map((atlas.hostile_groups ?? []).map((group) => [group.id, group]));
  for (const id of manifest.excluded.groups) {
    const group = groupById.get(id);
    if (group?.dossier_prose) fail('E_EXCLUDED_ID', `${id} dossier_prose`);
    if (Array.isArray(group?.scenario_outlines) && group.scenario_outlines.length) {
      fail('E_EXCLUDED_ID', `${id} scenario_outlines`);
    }
  }
  const allowedGroups = new Set(Object.values(manifest.groups).flat());
  for (const id of allowedGroups) {
    if (!groupById.has(id)) fail('E_MISSING_FRAGMENT', id);
  }
  if (opts.requireSocial) {
    for (const id of manifest.social) {
      if (!socialPresent.includes(id)) fail('E_MISSING_FRAGMENT', id);
    }
  }
  if (opts.requireGroups) {
    for (const id of manifest.groups['G01-G06']) {
      if (!groupById.get(id)?.dossier_prose) fail('E_MISSING_FRAGMENT', `${id} dossier_prose`);
    }
    for (const id of manifest.groups['G07-G12']) {
      if ((groupById.get(id)?.scenario_outlines ?? []).length !== 3) {
        fail('E_MISSING_FRAGMENT', `${id} scenario_outlines`);
      }
    }
    for (const id of manifest.groups['G13-G18']) {
      const prose = String(groupById.get(id)?.prose ?? '');
      if (prose.length < 300) fail('E_MISSING_FRAGMENT', `${id} differentiated prose`);
    }
    if (!Array.isArray(atlas.diagrams) || atlas.diagrams.length !== 3) {
      fail('E_MISSING_FRAGMENT', 'ISO diagrams');
    }
  }
  if (opts.requireBaselineOnly) {
    const keys = Object.keys(atlas);
    if (keys.join(',') !== manifest.baselineAtlasKeys.join(',')) {
      fail('E_BASELINE_KEYS', keys.join(','));
    }
    if (socialPresent.join(',') !== manifest.baselineStoryContentKeys.join(',')) {
      fail('E_BASELINE_KEYS', `story_contents=${socialPresent.join(',')}`);
    }
  }
  return violations;
}

export async function verifyLiveDocs(opts = {}) {
  const repoRoot = opts.repoRoot ?? defaultRepoRoot;
  const manifest = opts.manifest ?? await loadManifest(opts.manifestPath);
  const atlasPath = opts.atlasPath ?? join(repoRoot, defaultAtlasRel);
  const markdown = await readFile(atlasPath, 'utf8');
  const atlas = atlasFromMarkdown(markdown);
  const docs = opts.docs ?? join(repoRoot, 'LORE');
  const violations = verifyLiveAtlas(atlas, manifest, opts);
  const { readdir } = await import('node:fs/promises');
  let names = [];
  try {
    names = await readdir(docs);
  } catch (err) {
    if (!err || err.code !== 'ENOENT') throw err;
  }
  const monsterPages = names.filter((name) => /^Monster-Batch-M\d{3}\.md$/.test(name));
  const presentMonsterIds = monsterPages.map((name) => name.slice('Monster-Batch-'.length, -'.md'.length));
  for (const id of presentMonsterIds) {
    if ((manifest.excluded.monsters ?? []).includes(id)) violations.push({ code: 'E_EXCLUDED_ID', detail: id });
  }
  if (opts.requireMonsters) {
    for (const id of manifest.monsters) {
      if (!presentMonsterIds.includes(id)) violations.push({ code: 'E_MISSING_FRAGMENT', detail: id });
    }
  }
  return { atlas, manifest, violations, presentMonsterIds };
}

function printViolations(violations) {
  for (const item of violations) console.error(`${item.code}: ${item.detail}`);
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = { requireSocial: false, requireGroups: false, requireMonsters: false, requireBaselineOnly: false };
  for (const flag of argv) {
    if (flag === '--require-social') opts.requireSocial = true;
    else if (flag === '--require-groups') opts.requireGroups = true;
    else if (flag === '--require-monsters') opts.requireMonsters = true;
    else if (flag === '--baseline') opts.requireBaselineOnly = true;
    else throw new Error(`unknown argument: ${flag}`);
  }
  const { violations } = await verifyLiveDocs(opts);
  printViolations(violations);
  process.exitCode = violations.length === 0 ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
