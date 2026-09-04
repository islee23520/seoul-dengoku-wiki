import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { INVALID_BACKENDS } from './catalog.mjs';
import { validateManifest } from './asset-manifest.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '../..');

export const REQUIRED_ASSET_IDS = Object.freeze([
  'poc-title-art',
  'poc-ui-concept',
  'poc-ui-kit',
  'poc-ui-panel-9slice',
  'poc-ui-button-normal',
  'poc-ui-button-hover',
  'poc-ui-button-pressed',
  'poc-ui-icons',
  'poc-tile-texture',
]);

export const BUTTON_IDS = Object.freeze([
  'poc-ui-button-normal',
  'poc-ui-button-hover',
  'poc-ui-button-pressed',
]);

const FAMILY = {
  'poc-title-art': 'Title',
  'poc-ui-concept': 'UI',
  'poc-ui-kit': 'UI',
  'poc-ui-panel-9slice': 'UI',
  'poc-ui-button-normal': 'UI',
  'poc-ui-button-hover': 'UI',
  'poc-ui-button-pressed': 'UI',
  'poc-ui-icons': 'UI',
  'poc-tile-texture': 'Tiles',
};

const BOM_FAMILY = {
  Title: 'title',
  UI: 'ui',
  Tiles: 'tiles',
};

export const TILE_VARIANT_FILES = Object.freeze([
  'poc-tile-floor.png',
  'poc-tile-wall.png',
  'poc-tile-platform.png',
]);

export const ICON_NAMES = Object.freeze([
  'talk',
  'detour',
  'battle',
  'heal',
  'party',
  'station',
  'crate',
  'alert',
]);

export function familyOf(assetId) {
  return FAMILY[assetId];
}

export function artSourceDir(assetId) {
  return join(repoRoot, 'Game', 'Assets', 'Janseon', 'ArtSource', familyOf(assetId), assetId);
}

export function promotedPng(assetId) {
  if (assetId === 'poc-tile-texture') {
    return join(repoRoot, 'Game', 'Assets', 'Janseon', 'Art', 'Tiles', 'poc-tile-floor.png');
  }
  if (assetId === 'poc-ui-icons') {
    return join(repoRoot, 'Game', 'Assets', 'Janseon', 'Art', 'UI', 'poc-ui-icons.png');
  }
  return join(repoRoot, 'Game', 'Assets', 'Janseon', 'Art', familyOf(assetId), `${assetId}.png`);
}

export function bomPath(assetId) {
  return join(repoRoot, 'docs', 'assets', 'bom', BOM_FAMILY[familyOf(assetId)], `${assetId}.json`);
}

export function kitBomPath() {
  return join(repoRoot, 'docs', 'assets', 'bom', 'poc-ui-station-kit.bom.json');
}

export function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

export function sha256Text(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function expectedSourceFiles(assetId) {
  const dir = artSourceDir(assetId);
  const files = [
    join(dir, 'prompt.txt'),
    join(dir, 'receipt.json'),
    join(dir, 'manifest.json'),
  ];
  if (assetId === 'poc-tile-texture') {
    for (const name of TILE_VARIANT_FILES) files.push(join(dir, name));
  } else if (assetId === 'poc-ui-icons') {
    files.push(join(dir, 'poc-ui-icons.png'));
    for (const name of ICON_NAMES) files.push(join(dir, `icon-${name}.png`));
  } else {
    files.push(join(dir, `${assetId}.png`));
  }
  return files;
}

export function collectMissingKitPaths() {
  const missing = [];
  for (const assetId of REQUIRED_ASSET_IDS) {
    for (const filePath of expectedSourceFiles(assetId)) {
      if (!existsSync(filePath)) missing.push(filePath.slice(repoRoot.length + 1));
    }
    const promoted = promotedPng(assetId);
    if (!existsSync(promoted)) missing.push(promoted.slice(repoRoot.length + 1));
    if (!existsSync(`${promoted}.meta`)) missing.push(`${promoted.slice(repoRoot.length + 1)}.meta`);
    if (!existsSync(bomPath(assetId))) missing.push(bomPath(assetId).slice(repoRoot.length + 1));
  }
  for (const name of TILE_VARIANT_FILES) {
    const art = join(repoRoot, 'Game', 'Assets', 'Janseon', 'Art', 'Tiles', name);
    if (!existsSync(art)) missing.push(art.slice(repoRoot.length + 1));
    if (!existsSync(`${art}.meta`)) missing.push(`${art.slice(repoRoot.length + 1)}.meta`);
  }
  if (!existsSync(kitBomPath())) missing.push(kitBomPath().slice(repoRoot.length + 1));
  return missing;
}

export function eligibleForIsoReview(document) {
  if (INVALID_BACKENDS.has(document.generation_backend)) return false;
  if (document.status === 'archived' || document.status === 'blocked') return false;
  if (document.status !== 'promoted' && document.status !== 'reviewed') return false;
  if (document.rights_status !== 'allowed') return false;
  return true;
}

export function validatePromotedBom(document, pngPath) {
  const result = validateManifest(document);
  const errors = [...result.errors];
  if (document.cost_mode !== 'subscription' && document.cost_mode !== 'none') {
    errors.push({ code: 'cost_mode_not_subscription', field: 'cost_mode' });
  }
  if (document.cost_cents !== 0) {
    errors.push({ code: 'cost_cents_nonzero', field: 'cost_cents' });
  }
  if (document.rights_status !== 'allowed') {
    errors.push({ code: 'rights_not_allowed', field: 'rights_status' });
  }
  if (document.status !== 'promoted') {
    errors.push({ code: 'status_not_promoted', field: 'status' });
  }
  if (!existsSync(pngPath)) {
    errors.push({ code: 'promoted_png_missing', field: 'output_hash' });
  } else {
    const digest = sha256File(pngPath);
    if (document.output_hash !== digest) {
      errors.push({ code: 'output_hash_mismatch', field: 'output_hash' });
    }
  }
  return { ok: errors.length === 0, errors };
}
