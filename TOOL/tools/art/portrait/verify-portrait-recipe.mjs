import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compositePortraitLayers, decodePng } from './portrait-layer-composite.mjs';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const schema = JSON.parse(readFileSync(new URL('./portrait-layer-slots.json', import.meta.url), 'utf8'));

export function comparePortraitPixels(target, actual, mask = null) {
  if (target.width !== actual.width || target.height !== actual.height || target.pixels.length !== actual.pixels.length) {
    throw new Error('portrait dimensions differ');
  }
  let changedPixels = 0;
  let maxError = 0;
  for (let i = 0; i < target.pixels.length; i += 4) {
    if (mask && mask.pixels[i + 3] === 0) continue;
    let error = 0;
    for (let c = 0; c < 4; c += 1) error = Math.max(error, Math.abs(target.pixels[i + c] - actual.pixels[i + c]));
    if (error > 0) changedPixels += 1;
    maxError = Math.max(maxError, error);
  }
  return { changedPixels, maxError };
}

export function auditPartition(target, layers) {
  const counts = new Uint16Array(target.width * target.height);
  let wrongPixels = 0;
  for (const layer of layers) {
    if (layer.width !== target.width || layer.height !== target.height) throw new Error('partition dimensions differ');
    for (let i = 0; i < layer.pixels.length; i += 4) {
      if (layer.pixels[i + 3] === 0) continue;
      counts[i / 4] += 1;
      if (layer.pixels[i + 3] !== 255 || [0, 1, 2].some((c) => layer.pixels[i + c] !== target.pixels[i + c])) wrongPixels += 1;
    }
  }
  return {
    uncovered: counts.reduce((n, c) => n + Number(c === 0), 0),
    overlapping: counts.reduce((n, c) => n + Number(c > 1), 0),
    wrongPixels,
  };
}

export function auditGroupSwap(before, after, influence) {
  if (influence.width !== before.width || influence.height !== before.height) throw new Error('influence dimensions differ');
  const all = comparePortraitPixels(before, after);
  let outsideChanged = 0;
  let alphaChanged = 0;
  for (let i = 0; i < before.pixels.length; i += 4) {
    if (before.pixels[i + 3] !== after.pixels[i + 3]) alphaChanged += 1;
    if (influence.pixels[i + 3] === 0 && [0, 1, 2, 3].some((c) => before.pixels[i + c] !== after.pixels[i + c])) outsideChanged += 1;
  }
  return { ...all, outsideChanged, alphaChanged };
}

export function validateRecipe(recipe, root) {
  if (!recipe?.target?.path || !recipe.target.sha256) throw new Error('missing target binding');
  const targetPath = resolve(root, recipe.target.path);
  if (!existsSync(targetPath)) throw new Error('missing target image');
  const targetBytes = readFileSync(targetPath);
  if (digest(targetBytes) !== recipe.target.sha256) throw new Error('target hash mismatch');
  if (recipe.version !== 1 || !Number.isInteger(recipe.canvas?.width) || !Number.isInteger(recipe.canvas?.height)) throw new Error('invalid recipe canvas or version');
  if (targetBytes.readUInt32BE(16) !== recipe.canvas.width || targetBytes.readUInt32BE(20) !== recipe.canvas.height) throw new Error('target dimensions differ');
  if (!Array.isArray(recipe.assets)) throw new Error('missing assets');
  const assetKeys = new Set();
  const assets = recipe.assets.map((asset) => {
    if (!schema.slots.some((slot) => slot.id === asset.id)) throw new Error(`unknown slot ${asset.id}`);
    const key = `${asset.group || 'fixed'}:${asset.variant || 'base'}:${asset.id}`;
    if (assetKeys.has(key)) throw new Error(`duplicate asset ${key}`);
    assetKeys.add(key);
    if (asset.group && !recipe.groups?.[asset.group]?.variants.includes(asset.variant)) throw new Error(`unknown group variant ${key}`);
    const path = resolve(root, asset.path);
    if (!existsSync(path)) throw new Error(`missing asset ${asset.path}`);
    const bytes = readFileSync(path);
    if (digest(bytes) !== asset.sha256) throw new Error(`asset hash mismatch ${asset.path}`);
    const image = decodePng(bytes);
    if (image.width !== recipe.canvas.width || image.height !== recipe.canvas.height) throw new Error(`asset dimensions differ ${asset.id}`);
    let visible = 0;
    for (let i = 3; i < image.pixels.length; i += 4) visible += Number(image.pixels[i] !== 0);
    if (asset.empty && visible !== 0) throw new Error(`empty slot contains pixels ${asset.id}`);
    if (!asset.empty && asset.id !== 'bg' && visible === recipe.canvas.width * recipe.canvas.height) throw new Error(`full target backplate in ${asset.id}`);
    return { ...asset, resolvedPath: path, image, visible };
  });
  for (const [group, spec] of Object.entries(recipe.groups || {})) {
    for (const variant of spec.variants) {
      const pair = assets.filter((a) => a.group === group && a.variant === variant);
      if (pair.length !== spec.slots.length || spec.slots.some((id) => !pair.some((a) => a.id === id))) throw new Error(`incomplete pair ${group}:${variant}`);
    }
  }
  return { assets, targetPath };
}

export function composeRecipe(recipe, root, selection) {
  const checked = validateRecipe(recipe, root);
  for (const [group, spec] of Object.entries(recipe.groups)) {
    if (!spec.variants.includes(selection[group])) throw new Error(`invalid selection ${group}`);
  }
  const selected = checked.assets.filter((a) => !a.group || selection[a.group] === a.variant);
  const slots = Object.fromEntries(selected.map((a) => [a.id, a.resolvedPath]));
  return compositePortraitLayers({ schema, slots });
}

export function verifyPortraitRecipe(recipePath, mode) {
  const root = dirname(resolve(recipePath));
  const recipe = JSON.parse(readFileSync(recipePath, 'utf8'));
  const checked = validateRecipe(recipe, root);
  const image = (path) => decodePng(readFileSync(resolve(root, path)));
  const target = image(recipe.target.path);
  if (mode !== 'contract' && recipe.qa?.reference) {
    const reference = comparePortraitPixels(target, image(recipe.qa.reference));
    if (reference.changedPixels) throw new Error('QA reference differs from bound target');
  }
  switch (mode) {
    case 'contract': return { mode, assets: checked.assets.length, errors: [] };
    case 'partition': {
      const result = auditPartition(target, recipe.qa.partition.map(image));
      if (result.uncovered || result.overlapping || result.wrongPixels) throw new Error(`partition mismatch ${JSON.stringify(result)}`);
      return { mode, ...result, errors: [] };
    }
    case 'base': {
      const actual = composeRecipe(recipe, root, recipe.defaultSelection);
      const diff = comparePortraitPixels(target, actual);
      if (diff.changedPixels) throw new Error(`base target mismatch ${JSON.stringify(diff)}`);
      return { mode, ...diff, errors: [] };
    }
    case 'matrix': {
      const groups = Object.keys(recipe.groups);
      let selections = [{}];
      for (const group of groups) selections = selections.flatMap((s) => recipe.groups[group].variants.map((v) => ({ ...s, [group]: v })));
      const renders = selections.map((selection) => composeRecipe(recipe, root, selection));
      const rows = selections.map((selection, i) => ({ selection, sha256: digest(renders[i].png), width: renders[i].width, height: renders[i].height }));
      if (new Set(rows.map((r) => r.sha256)).size !== rows.length) throw new Error('matrix contains identical composites');
      const swaps = [];
      for (let a = 0; a < selections.length; a += 1) {
        for (let b = a + 1; b < selections.length; b += 1) {
          const changed = groups.filter((g) => selections[a][g] !== selections[b][g]);
          if (changed.length !== 1) continue;
          const group = changed[0];
          const diff = auditGroupSwap(renders[a], renders[b], image(recipe.qa.influence[group]));
          if (!diff.changedPixels || diff.outsideChanged) throw new Error(`group influence mismatch ${group} ${JSON.stringify(diff)}`);
          swaps.push({ from: selections[a], to: selections[b], group, ...diff });
        }
      }
      return { mode, combinations: rows, swaps, errors: [] };
    }
    default: throw new Error(`unsupported mode ${mode}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const path = args[args.indexOf('--recipe') + 1];
    const mode = args[args.indexOf('--mode') + 1];
    if (!args.includes('--recipe') || !args.includes('--mode') || !path || !mode) throw new Error('usage: --recipe <path> --mode contract|partition|base|matrix');
    console.log(JSON.stringify(verifyPortraitRecipe(path, mode), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exitCode = 1;
  }
}
