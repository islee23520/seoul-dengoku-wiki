#!/usr/bin/env node
/** Copy the immutable Stage-1 recipe plates into the deployable demo tree. */
import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildLibrary } from '../../Tool/art/portrait/portrait-tool.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const recipeFile = resolve(repoRoot, '.omo/evidence/portrait-authoring-v2/recipe.json');
const assetRoot = resolve(repoRoot, 'Design/portrait-demo/assets/v2');
const plateRoot = resolve(assetRoot, 'plates');
const manifestFile = resolve(assetRoot, 'library.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function fail(message) { throw new Error(message); }

export function stageRealStage1() {
  if (existsSync(manifestFile)) fail('library.json already exists; concurrent/existing state was not overwritten');

  const recipeBytes = readFileSync(recipeFile);
  const recipe = JSON.parse(recipeBytes);
  const applicable = recipe.assets.filter(asset => !['beard', 'beard_back'].includes(asset.id));
  const verified = applicable.map(asset => {
    const sourceFile = resolve(dirname(recipeFile), asset.path);
    const bytes = readFileSync(sourceFile);
    const sha256 = digest(bytes);
    if (sha256 !== asset.sha256) fail(`Stage-1 hash mismatch: ${asset.id}/${asset.variant ?? 'base'}`);
    return { asset, sourceFile, bytes, sha256 };
  });

  for (const { asset, sourceFile, bytes } of verified) {
    const variantId = `${asset.id}-${asset.variant ?? 'base'}`;
    const destination = resolve(plateRoot, 'female', asset.id, `${variantId}.png`);
    mkdirSync(dirname(destination), { recursive: true });
    if (existsSync(destination)) {
      if (digest(readFileSync(destination)) !== digest(bytes)) fail(`staged plate differs: ${destination}`);
    } else {
      copyFileSync(sourceFile, destination, constants.COPYFILE_EXCL);
    }
  }

  const library = buildLibrary({
    repoRoot,
    plateRoot: 'Design/portrait-demo/assets/v2/plates',
    manifestDir: 'Design/portrait-demo/assets/v2',
    stage: 'stage1-derived',
  });
  library.provenance = {
    kind: 'immutable-stage1-recipe-copy',
    recipe_sha256: digest(recipeBytes),
    target_sha256: recipe.target.sha256,
    art_approval: false,
  };

  const byIdentity = new Map(applicable.map(asset => [
    `${asset.id}-${asset.variant ?? 'base'}`,
    asset,
  ]));
  for (const [slotId, entry] of Object.entries(library.sexes.female.slots)) {
    for (const variant of entry.variants) {
      const asset = byIdentity.get(variant.id);
      if (!asset) fail(`staged variant has no recipe identity: ${slotId}/${variant.id}`);
      variant.empty = asset.empty === true;
      variant.source = asset.source;
      variant.source_identity = {
        recipe_asset_id: asset.id,
        recipe_variant: asset.variant ?? 'base',
        sha256: asset.sha256,
      };
    }
  }

  mkdirSync(assetRoot, { recursive: true });
  writeFileSync(manifestFile, `${JSON.stringify(library, null, 2)}\n`, { flag: 'wx' });
  return {
    wrote: 'Design/portrait-demo/assets/v2/library.json',
    stage: library.stage,
    recipe_sha256: library.provenance.recipe_sha256,
    target_sha256: library.provenance.target_sha256,
    copied_assets: verified.length,
    female_variants: Object.values(library.sexes.female.slots).reduce((sum, entry) => sum + entry.variants.length, 0),
    male_variants: 0,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(stageRealStage1(), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exitCode = 1;
  }
}
