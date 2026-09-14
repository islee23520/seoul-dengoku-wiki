import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateManifest } from './asset-manifest.mjs';

export const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));

export const FACINGS = Object.freeze(['N', 'E', 'S', 'W']);
export const ACTIONS = Object.freeze(['idle', 'walk', 'attack', 'hit', 'down']);
export const FRAME_COUNTS = Object.freeze({
  idle: 4,
  walk: 6,
  attack: 6,
  hit: 3,
  down: 4,
});
export const CLIP_DURATION_BOUNDS = Object.freeze({
  idle: [0.25, 1.0],
  walk: [0.4, 0.8],
  attack: [0.3, 0.8],
  hit: [0.15, 0.4],
  down: [0.25, 0.8],
});
export const FRAME_SIZE = Object.freeze({ width: 96, height: 128 });
export const FPS = 12;
export const TILE_UNITY_UNITS = 1.5;
export const SILHOUETTE_HEADS = 2.5;
export const SILHOUETTE_HEAD_RATIO_TOLERANCE = 0.08;
export const FOOTPRINT_WIDTH_RATIO_MAX = 0.72;
export const FRAME_PIXELS_PER_UNIT = FRAME_SIZE.height / (SILHOUETTE_HEADS * 0.6);

export const POC_CHARACTERS = Object.freeze([
  Object.freeze({
    asset_id: 'poc-explorer',
    role: 'explorer_leader',
    display_name: '탐사원',
    dominant_hand: 'right',
    gear: Object.freeze({
      right_hand: 'prybar',
      left_hip: 'lantern',
      left_shoulder: 'radio_antenna',
    }),
    palette: Object.freeze({
      coat: '#2F6F73',
      accent: '#C45C32',
      pants: '#2B3038',
      skin: '#D4A574',
      hair: '#1A1A1A',
      gear_primary: '#F2C14E',
      gear_secondary: '#8A93A0',
    }),
  }),
  Object.freeze({
    asset_id: 'poc-medic',
    role: 'medic_companion',
    display_name: '의무원',
    dominant_hand: 'right',
    gear: Object.freeze({
      right_hand: 'splint_kit',
      left_hip: 'satchel',
      right_arm: 'red_cloth_knot',
    }),
    palette: Object.freeze({
      coat: '#6E8F6A',
      accent: '#E7D7B1',
      pants: '#4A5248',
      skin: '#C99572',
      hair: '#3B2A22',
      gear_primary: '#C43C3C',
      gear_secondary: '#8C6A48',
    }),
  }),
  Object.freeze({
    asset_id: 'poc-patrol',
    role: 'patrol_enemy',
    display_name: '순찰대',
    dominant_hand: 'right',
    gear: Object.freeze({
      right_hand: 'baton',
      left_chest: 'hazard_bar',
      left_helmet: 'visor_lamp',
    }),
    palette: Object.freeze({
      coat: '#2A2E33',
      accent: '#C6D64A',
      pants: '#1B1E22',
      skin: '#C4A484',
      hair: '#111111',
      gear_primary: '#C6D64A',
      gear_secondary: '#6E7780',
    }),
  }),
]);

export function artSourceRoot() {
  return join(REPO_ROOT, 'Game', 'Assets', 'Janseon', 'Art', 'Staging', 'Characters');
}

export function archiveSourceRoot() {
  return join(REPO_ROOT, 'Art', 'characters');
}

export function promotedArtRoot() {
  return join(REPO_ROOT, 'Game', 'Assets', 'Janseon', 'Art', 'Characters');
}

export function evidenceRoot() {
  return join(REPO_ROOT, '.omo', 'evidence', 'unity-poc-core-loop', 'task-15-characters');
}

export function bomPath() {
  return join(artSourceRoot(), 'poc-characters.bom.json');
}

export function docsBomRoot() {
  return join(REPO_ROOT, 'docs', 'assets', 'bom', 'characters');
}

export function docsBomPath(assetId) {
  return join(docsBomRoot(), `${assetId}.json`);
}

export function identitySheetPath(assetId) {
  return join(artSourceRoot(), assetId, 'identity', 'identity-sheet.png');
}

export function sideMapPath(assetId) {
  return join(artSourceRoot(), assetId, 'identity', 'side-map.json');
}

export function clipName(assetId, facing, action) {
  return `${assetId}_${facing}_${action}`;
}

export function frameFileName(assetId, facing, action, frame) {
  return `${clipName(assetId, facing, action)}_${String(frame).padStart(2, '0')}.png`;
}

export function frameSourcePath(assetId, facing, action, frame) {
  return join(artSourceRoot(), assetId, 'sprites', frameFileName(assetId, facing, action, frame));
}

export function framePromotedPath(assetId, facing, action, frame) {
  return join(promotedArtRoot(), assetId, 'Sprites', frameFileName(assetId, facing, action, frame));
}

export function prefabPath(assetId) {
  const pascal = assetId.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');
  return join(promotedArtRoot(), assetId, `${pascal}.prefab`);
}

export function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function sha256File(path) {
  return sha256Buffer(readFileSync(path));
}

export function expectedFrameList(assetId) {
  const frames = [];
  for (const facing of FACINGS) {
    for (const action of ACTIONS) {
      const count = FRAME_COUNTS[action];
      for (let frame = 0; frame < count; frame += 1) {
        frames.push({
          facing,
          action,
          frame,
          clip: clipName(assetId, facing, action),
          duration: count / FPS,
          source: frameSourcePath(assetId, facing, action, frame),
          promoted: framePromotedPath(assetId, facing, action, frame),
        });
      }
    }
  }
  return frames;
}

function characterById(assetId) {
  return POC_CHARACTERS.find((item) => item.asset_id === assetId);
}

function push(codes, code, detail) {
  codes.push({ code, detail });
}

function expectedLanternScreenSide(facing, slot) {
  // Character-left gear appears on the viewer's right when facing south.
  const leftSlots = new Set(['left_hip', 'left_shoulder', 'left_chest', 'left_helmet']);
  const rightSlots = new Set(['right_hand', 'right_arm']);
  const isLeft = leftSlots.has(slot);
  const isRight = rightSlots.has(slot);
  if (!isLeft && !isRight) return null;
  if (facing === 'S') return isLeft ? 'screen_right' : 'screen_left';
  if (facing === 'N') return isLeft ? 'screen_left' : 'screen_right';
  if (facing === 'E') return isLeft ? 'screen_left' : 'screen_right';
  if (facing === 'W') return isLeft ? 'screen_right' : 'screen_left';
  return null;
}

export function assertGearNotMirrored(sideMap, character) {
  const codes = [];
  if (!sideMap || typeof sideMap !== 'object') {
    return [{ code: 'missing_side_map', detail: character.asset_id }];
  }
  for (const [slot, item] of Object.entries(character.gear)) {
    for (const facing of FACINGS) {
      const facingMap = sideMap.facings?.[facing];
      if (!facingMap) {
        push(codes, 'missing_facing_side_map', `${character.asset_id}:${facing}`);
        continue;
      }
      const marker = facingMap[slot];
      if (!marker || marker.item !== item) {
        push(codes, 'gear_slot_mismatch', `${character.asset_id}:${facing}:${slot}`);
        continue;
      }
      const expected = expectedLanternScreenSide(facing, slot);
      if (expected && marker.screen_side !== expected) {
        push(codes, 'mirrored_asymmetric_gear', `${character.asset_id}:${facing}:${slot}:${marker.screen_side}`);
      }
      if (typeof marker.character_side !== 'string') {
        push(codes, 'missing_character_side', `${character.asset_id}:${facing}:${slot}`);
      } else if (slot.startsWith('left_') && marker.character_side !== 'left') {
        push(codes, 'mirrored_asymmetric_gear', `${character.asset_id}:${facing}:${slot}:character_side`);
      } else if (slot.startsWith('right_') && marker.character_side !== 'right') {
        push(codes, 'mirrored_asymmetric_gear', `${character.asset_id}:${facing}:${slot}:character_side`);
      }
    }
  }
  return codes;
}

export function clipDuration(action) {
  return FRAME_COUNTS[action] / FPS;
}

export function clipDurationInBounds(action, duration) {
  const [min, max] = CLIP_DURATION_BOUNDS[action];
  return duration >= min && duration <= max;
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function pngBytes(path) {
  return existsSync(path) ? readFileSync(path) : null;
}

function flipPngHorizontally(buffer) {
  if (!buffer) return null;
  return buffer;
}

export function framesAreHorizontalMirrors(eastPath, westPath) {
  if (!existsSync(eastPath) || !existsSync(westPath)) return false;
  const east = readFileSync(eastPath);
  const west = readFileSync(westPath);
  if (east.equals(west)) return true;
  return false;
}

export function validateCharacterPromotion(root = REPO_ROOT) {
  const codes = [];
  const sourceRoot = join(root, 'Game', 'Assets', 'Janseon', 'Art', 'Staging', 'Characters');
  const artRoot = join(root, 'Game', 'Assets', 'Janseon', 'Art', 'Characters');
  const bomFile = join(sourceRoot, 'poc-characters.bom.json');
  const docsBomDir = join(root, 'docs', 'assets', 'bom', 'characters');

  if (!existsSync(docsBomDir)) {
    push(codes, 'docs_bom_missing', docsBomDir);
  }
  if (!existsSync(bomFile)) {
    push(codes, 'bom_missing', bomFile);
  } else {
    const bom = readJsonIfExists(bomFile);
    const result = validateManifest(bom);
    if (!result.ok) {
      for (const error of result.errors) {
        push(codes, 'bom_invalid', `${error.code}:${error.field ?? ''}`);
      }
    } else {
      const ids = new Set((bom.assets ?? []).map((asset) => asset.asset_id));
      for (const character of POC_CHARACTERS) {
        if (!ids.has(character.asset_id)) {
          push(codes, 'bom_missing_character', character.asset_id);
        }
      }
      for (const asset of bom.assets ?? []) {
        if (asset.status !== 'promoted') push(codes, 'promotion_blocked', asset.asset_id);
        if (asset.rights_status !== 'allowed') push(codes, 'rights_not_allowed', asset.asset_id);
        if (asset.unity_import_settings?.filter_mode !== 'Point') {
          push(codes, 'filter_not_point', asset.asset_id);
        }
      }
    }
  }

  for (const character of POC_CHARACTERS) {
    const identity = join(sourceRoot, character.asset_id, 'identity', 'identity-sheet.png');
    const sideMapFile = join(sourceRoot, character.asset_id, 'identity', 'side-map.json');
    if (!existsSync(identity)) push(codes, 'missing_identity_sheet', identity);
    if (!existsSync(sideMapFile)) {
      push(codes, 'missing_side_map', sideMapFile);
    } else {
      const sideMap = readJsonIfExists(sideMapFile);
      codes.push(...assertGearNotMirrored(sideMap, character));
      if (sideMap?.silhouette_heads != null) {
        const delta = Math.abs(Number(sideMap.silhouette_heads) - SILHOUETTE_HEADS);
        if (delta > SILHOUETTE_HEAD_RATIO_TOLERANCE) {
          push(codes, 'silhouette_heads_out_of_tolerance', `${character.asset_id}:${sideMap.silhouette_heads}`);
        }
      }
      if (sideMap?.footprint_tiles != null && Number(sideMap.footprint_tiles) > 1.0 + 1e-6) {
        push(codes, 'footprint_exceeds_tile', `${character.asset_id}:${sideMap.footprint_tiles}`);
      }
    }

    if (!existsSync(join(artRoot, character.asset_id, `${pascalName(character.asset_id)}.prefab`))) {
      push(codes, 'missing_prefab', character.asset_id);
    }

    for (const frame of expectedFrameList(character.asset_id)) {
      const source = join(
        sourceRoot,
        character.asset_id,
        'sprites',
        frameFileName(character.asset_id, frame.facing, frame.action, frame.frame),
      );
      const promoted = join(
        artRoot,
        character.asset_id,
        'Sprites',
        frameFileName(character.asset_id, frame.facing, frame.action, frame.frame),
      );
      if (!existsSync(source)) push(codes, 'missing_frame', source);
      if (!existsSync(promoted)) push(codes, 'missing_promoted_frame', promoted);
      if (!clipDurationInBounds(frame.action, frame.duration)) {
        push(codes, 'clip_duration_out_of_bounds', frame.clip);
      }
    }

    const docsBom = join(docsBomDir, `${character.asset_id}.json`);
    if (!existsSync(docsBom)) {
      push(codes, 'docs_bom_missing', docsBom);
    } else {
      const docs = readJsonIfExists(docsBom);
      const docsResult = validateManifest(docs);
      if (!docsResult.ok) {
        for (const error of docsResult.errors) {
          push(codes, 'docs_bom_invalid', `${character.asset_id}:${error.code}:${error.field ?? ''}`);
        }
      }
    }

    const fallback = join(sourceRoot, character.asset_id, 'fallback-receipt.json');
    const meshPrefab = join(artRoot, character.asset_id, 'Mesh');
    if (existsSync(meshPrefab) && existsSync(fallback)) {
      push(codes, 'broken_mesh_retained', character.asset_id);
    }

    for (const action of ACTIONS) {
      const east = join(artRoot, character.asset_id, 'Sprites', frameFileName(character.asset_id, 'E', action, 0));
      const west = join(artRoot, character.asset_id, 'Sprites', frameFileName(character.asset_id, 'W', action, 0));
      if (existsSync(east) && existsSync(west) && readFileSync(east).equals(readFileSync(west))) {
        push(codes, 'ew_identical_frames', `${character.asset_id}:${action}`);
      }
    }
  }

  return { ok: codes.length === 0, codes };
}

function pascalName(assetId) {
  return assetId.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');
}

export function listPromotedPngs(assetId, root = REPO_ROOT) {
  const dir = join(root, 'Game', 'Assets', 'Janseon', 'Art', 'Characters', assetId, 'Sprites');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith('.png'));
}

export function makeMirrorFailFixture(character = POC_CHARACTERS[0]) {
  const facings = {};
  for (const facing of FACINGS) {
    const slots = {};
    for (const [slot, item] of Object.entries(character.gear)) {
      slots[slot] = {
        item,
        character_side: slot.startsWith('left_') ? 'right' : 'left',
        screen_side: 'screen_left',
        x_norm: 0.25,
      };
    }
    facings[facing] = slots;
  }
  return {
    asset_id: character.asset_id,
    silhouette_heads: SILHOUETTE_HEADS,
    footprint_tiles: 1,
    facings,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = validateCharacterPromotion();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.ok ? 0 : 2);
}
