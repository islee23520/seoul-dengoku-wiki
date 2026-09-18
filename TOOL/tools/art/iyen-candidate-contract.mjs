#!/usr/bin/env node
// Iyen candidate-art contract: schema-valid pending BOM with a locked
// connected-infinity hair ornament and no runtime destination.
import { readFileSync } from 'node:fs';

import { validateManifest } from './asset-manifest.mjs';

export const PRIMARY_LAYER_ID = 'infinity_hair_ornament';
export const PRIMARY_SHAPE = 'connected_two_loop_infinity';
export const LEGACY_LAYER_IDS = new Set(['rose_disc_hair_ornament', 'disconnected_discs']);
export const REQUIRED_TARGET_RESOLUTIONS = ['portrait', 'sd_character'];
export const RUNTIME_DESTINATION_PREFIX = 'GAME/Assets/';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasRuntimeDestination(value) {
  if (typeof value === 'string') {
    return value.split('\\').join('/').startsWith(RUNTIME_DESTINATION_PREFIX);
  }
  if (Array.isArray(value)) return value.some(hasRuntimeDestination);
  if (isRecord(value)) return Object.values(value).some(hasRuntimeDestination);
  return false;
}

function validateIdentityLock(document, errors) {
  const lock = document.identity_lock;
  if (!isRecord(lock)) {
    errors.push({ code: 'iyen_identity_lock_missing', field: 'identity_lock' });
    return;
  }
  if (lock.primary_layer === undefined) {
    errors.push({ code: 'iyen_identity_lock_missing', field: 'identity_lock.primary_layer' });
  } else if (LEGACY_LAYER_IDS.has(lock.primary_layer)) {
    errors.push({ code: 'legacy_ornament_label', field: 'identity_lock.primary_layer' });
  } else if (lock.primary_layer !== PRIMARY_LAYER_ID) {
    errors.push({ code: 'infinity_ornament_not_primary', field: 'identity_lock.primary_layer' });
  }
  if (lock.shape !== PRIMARY_SHAPE || lock.connected !== true) {
    errors.push({ code: 'infinity_ornament_disconnected', field: 'identity_lock' });
  }
  if (typeof lock.tassel_layer !== 'string' || lock.tassel_layer.trim().length === 0
    || lock.tassel_layer === lock.primary_layer) {
    errors.push({ code: 'tassel_layer_invalid', field: 'identity_lock.tassel_layer' });
  }
  const targets = lock.target_resolutions;
  if (!isRecord(targets)) {
    errors.push({ code: 'target_resolution_missing', field: 'identity_lock.target_resolutions' });
  } else {
    for (const key of REQUIRED_TARGET_RESOLUTIONS) {
      const target = targets[key];
      if (!isRecord(target) || !Number.isInteger(target.width) || target.width < 1
        || !Number.isInteger(target.height) || target.height < 1) {
        errors.push({ code: 'target_resolution_missing', field: `identity_lock.target_resolutions.${key}` });
      }
    }
  }
}

/**
 * Validate an Iyen candidate manifest: base manifest rules first, then the
 * infinity-ornament identity lock, pending owner verdict, and the
 * no-runtime-destination boundary.
 * @returns {{ ok: boolean, errors: Array<{code: string, field?: string}> }}
 */
export function validateIyenCandidate(document) {
  const errors = [...validateManifest(document).errors];
  if (!isRecord(document)) {
    return { ok: false, errors: errors.length > 0 ? errors : [{ code: 'malformed_json' }] };
  }
  validateIdentityLock(document, errors);
  if (document.look?.owner_verdict !== 'pending') {
    errors.push({ code: 'owner_verdict_not_pending', field: 'look.owner_verdict' });
  }
  if (hasRuntimeDestination(document)) {
    errors.push({ code: 'runtime_destination_forbidden', field: 'document' });
  }
  return { ok: errors.length === 0, errors };
}

function main(argv) {
  const manifestIdx = argv.indexOf('--manifest');
  const path = manifestIdx >= 0 ? argv[manifestIdx + 1] : null;
  if (typeof path !== 'string') {
    process.stderr.write('usage: node iyen-candidate-contract.mjs --manifest <path>\n');
    process.exit(2);
  }
  let document;
  try {
    document = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ ok: false, errors: [{ code: 'malformed_json', detail: error.message }] }, null, 2)}\n`);
    process.exit(2);
  }
  const result = validateIyenCandidate(document);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.ok ? 0 : 2);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main(process.argv.slice(2));
}
