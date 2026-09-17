import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from './portrait-layer-composite.mjs';

class PortraitSpriteGenError extends Error {}

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const pngDimensions = (bytes) => ({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
const pixels = (bytes) => {
  const image = decodePng(bytes);
  return Buffer.from(image.pixels.buffer, image.pixels.byteOffset, image.pixels.byteLength);
};
const slug = (value) => value.replaceAll(/[^a-z0-9]+/gi, '-').replaceAll(/^-|-$/g, '').toLowerCase();

function checkedPng(path, expectedDigest) {
  if (!existsSync(path)) throw new PortraitSpriteGenError(`missing portrait source: ${path}`);
  const bytes = readFileSync(path);
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new PortraitSpriteGenError(`portrait source is not a PNG: ${path}`);
  }
  if (expectedDigest && digest(bytes) !== expectedDigest) throw new PortraitSpriteGenError(`portrait source hash mismatch: ${path}`);
  return { bytes, ...pngDimensions(bytes) };
}

function sourcePath(root, relativePath) {
  return resolve(root, relativePath);
}

export function buildPortraitSpriteGenPlan(recipePath) {
  const resolvedRecipe = resolve(recipePath);
  const root = dirname(resolvedRecipe);
  const recipe = JSON.parse(readFileSync(resolvedRecipe, 'utf8'));
  if (!recipe.canvas?.width || !recipe.canvas?.height || !Array.isArray(recipe.assets) || !recipe.target?.path) {
    throw new PortraitSpriteGenError('invalid portrait recipe');
  }
  const basePath = sourcePath(root, recipe.target.path);
  const base = checkedPng(basePath, recipe.target.sha256);
  if (base.width !== recipe.canvas.width || base.height !== recipe.canvas.height) throw new PortraitSpriteGenError('portrait target dimensions differ from recipe');
  const defaults = recipe.defaultSelection || {};
  const assets = recipe.assets.map((asset, index) => {
    if (!asset?.id || !asset?.path || !asset?.sha256) throw new PortraitSpriteGenError(`invalid portrait asset at index ${index}`);
    const path = sourcePath(root, asset.path);
    const checked = checkedPng(path, asset.sha256);
    if (checked.width !== recipe.canvas.width || checked.height !== recipe.canvas.height) {
      throw new PortraitSpriteGenError(`portrait source dimensions differ: ${path}`);
    }
    return { asset, index, path, ...checked };
  });
  const baseline = new Map(assets.map((entry) => [`${entry.asset.group}:${entry.asset.variant}:${entry.asset.id}`, entry]));
  const rows = assets.map((entry) => {
    const group = entry.asset.group || 'fixed';
    const variant = entry.asset.variant || 'base';
    const name = `part-${String(entry.index + 1).padStart(2, '0')}-${slug(group)}-${slug(variant)}-${slug(entry.asset.id)}`;
    const basis = entry.asset.group && entry.asset.variant !== defaults[entry.asset.group]
      ? baseline.get(`${entry.asset.group}:${defaults[entry.asset.group]}:${entry.asset.id}`)
      : undefined;
    return {
      name,
      label: `${slug(group)}-${slug(variant)}-${slug(entry.asset.id)}`,
      source: entry.path,
      sha256: digest(entry.bytes),
      width: entry.width,
      height: entry.height,
      refs: basis ? [{ role: 'basis', source: basis.path, sha256: digest(basis.bytes) }] : [],
    };
  });
  if (new Set(rows.map((row) => row.name)).size !== rows.length) throw new PortraitSpriteGenError('portrait row names are not unique');
  return {
    recipe: resolvedRecipe,
    canvas: { width: recipe.canvas.width, height: recipe.canvas.height },
    base: { path: basePath, sha256: digest(base.bytes) },
    rows,
  };
}

export function stagePortraitSpriteGenPngs(plan, pngsDir) {
  const destination = resolve(pngsDir);
  if (existsSync(destination)) throw new PortraitSpriteGenError(`staging directory already exists: ${destination}`);
  mkdirSync(resolve(destination, '_base'), { recursive: true });
  const base = resolve(destination, '_base', 'target.png');
  copyFileSync(plan.base.path, base);
  const rows = plan.rows.map((row) => {
    const rowDir = resolve(destination, row.name);
    mkdirSync(rowDir, { recursive: true });
    const imported = resolve(rowDir, `1-${row.label}.png`);
    copyFileSync(row.source, imported);
    for (const ref of row.refs) {
      const refDir = resolve(rowDir, '_refs');
      mkdirSync(refDir, { recursive: true });
      copyFileSync(ref.source, resolve(refDir, `${ref.role}-${slug(row.label)}.png`));
    }
    return { ...row, imported, exported: resolve(row.name + '-' + row.label + '.png') };
  });
  const provenance = resolve(destination, 'curation-provenance.json');
  writeFileSync(provenance, `${JSON.stringify({
    version: 1,
    kind: 'portrait-imported-still-curation',
    workflow: 'imported-still-curation',
    rights: 'unknown',
    approved: false,
    imageGeneration: false,
    runtimePromotion: false,
    base: plan.base,
    rows: rows.map(({ name, label, source, sha256, width, height, refs }) => ({ name, label, source, sha256, width, height, refs })),
  }, null, 2)}\n`);
  return { base, rows, provenance };
}

function command(binary, args) {
  const result = spawnSync(binary, args, { encoding: 'utf8' });
  if (result.error) throw new PortraitSpriteGenError(`sprite-gen could not start: ${result.error.message}`);
  if (result.status !== 0) throw new PortraitSpriteGenError(`sprite-gen failed: ${result.stderr || result.stdout}`);
  return { binary, args, stdout: result.stdout, stderr: result.stderr };
}

export function verifyPortraitSpriteGenExport(plan, exportDir) {
  const rows = plan.rows.map((row) => {
    const sourceBytes = readFileSync(row.source);
    const exported = resolve(exportDir, `${row.name}-${row.label}.png`);
    if (!existsSync(exported)) throw new PortraitSpriteGenError(`missing curated export: ${exported}`);
    const exportBytes = readFileSync(exported);
    const sourcePixels = pixels(sourceBytes);
    const exportPixels = pixels(exportBytes);
    const identical = sourcePixels.equals(exportPixels);
    if (!identical) throw new PortraitSpriteGenError(`curated pixels differ: ${row.source}`);
    return {
      row: row.name,
      source: row.source,
      export: exported,
      width: row.width,
      height: row.height,
      sourceFileSha256: digest(sourceBytes),
      exportFileSha256: digest(exportBytes),
      sourcePixelSha256: digest(sourcePixels),
      exportPixelSha256: digest(exportPixels),
      pixelBytesIdentical: identical,
    };
  });
  return { rows, allPixelBytesIdentical: rows.every((row) => row.pixelBytesIdentical) };
}

export function curatePortraitSpriteGen({ recipePath, outDir, spriteGenBin }) {
  const plan = buildPortraitSpriteGenPlan(recipePath);
  const output = resolve(outDir);
  if (existsSync(output)) throw new PortraitSpriteGenError(`output directory already exists: ${output}`);
  if (!spriteGenBin) throw new PortraitSpriteGenError('missing --sprite-gen absolute path');
  mkdirSync(output, { recursive: true });
  const staged = stagePortraitSpriteGenPngs(plan, resolve(output, 'pngs'));
  const runDir = resolve(output, 'run');
  const exportDir = resolve(output, 'export');
  const commands = [
    command(spriteGenBin, ['unpack-atlas', '--pngs-dir', resolve(output, 'pngs'), '--out-dir', runDir]),
    command(spriteGenBin, ['export-pngs', '--run-dir', runDir, '--out-dir', exportDir]),
  ];
  const verification = verifyPortraitSpriteGenExport(plan, exportDir);
  const inputAfter = plan.rows.map((row) => ({ source: row.source, sha256: digest(readFileSync(row.source)) }));
  if (inputAfter.some((entry, index) => entry.sha256 !== plan.rows[index].sha256)) throw new PortraitSpriteGenError('portrait source mutated during curation');
  const result = {
    version: 1,
    workflow: 'imported-still-curation',
    rights: 'unknown',
    approved: false,
    inputMutation: 'none',
    plan: { recipe: plan.recipe, canvas: plan.canvas, base: plan.base, rows: plan.rows },
    staged,
    commands,
    verification,
    inputAfter,
  };
  writeFileSync(resolve(output, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

function cliArguments(args) {
  if (args.length !== 6 || args[0] !== '--recipe' || args[2] !== '--out-dir' || args[4] !== '--sprite-gen') {
    throw new PortraitSpriteGenError('usage: --recipe <recipe.json> --out-dir <new-dir> --sprite-gen <absolute-sprite-gen-path>');
  }
  return { recipePath: args[1], outDir: args[3], spriteGenBin: args[5] };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length === 3 && process.argv[2] === '--help') {
      console.log('usage: --recipe <recipe.json> --out-dir <new-dir> --sprite-gen <absolute-sprite-gen-path>');
      process.exitCode = 0;
    } else {
    console.log(JSON.stringify(curatePortraitSpriteGen(cliArguments(process.argv.slice(2))), null, 2));
    }
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exitCode = 1;
  }
}
