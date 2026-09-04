import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { BACKENDS, INVALID_BACKENDS, STATUSES } from './catalog.mjs';

const schemaPath = fileURLToPath(new URL('./asset-manifest.schema.json', import.meta.url));

export function loadManifestSchema() {
  return JSON.parse(readFileSync(schemaPath, 'utf8'));
}

function requiredAssetFields(schema) {
  return schema.$defs.asset.required;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateAsset(asset, schema) {
  const errors = [];
  if (!isRecord(asset)) {
    return [{ code: 'malformed_json' }];
  }
  for (const field of requiredAssetFields(schema)) {
    if (!Object.hasOwn(asset, field)) {
      errors.push({ code: 'missing_field', field });
    }
  }
  if (Object.hasOwn(asset, 'generation_backend') && !BACKENDS.has(asset.generation_backend)) {
    errors.push({ code: 'unknown_backend', field: 'generation_backend' });
  }
  if (INVALID_BACKENDS.has(asset.generation_backend) && asset.status !== 'archived') {
    errors.push({ code: 'trellis_invalid', field: 'generation_backend' });
  }
  if (Object.hasOwn(asset, 'status') && !STATUSES.has(asset.status)) {
    errors.push({ code: 'unknown_status', field: 'status' });
  }
  if (asset.rights_status !== 'allowed' && asset.status === 'promoted') {
    errors.push({ code: 'rights_not_allowed', field: 'rights_status' });
  }
  return errors;
}

export function validateManifest(document) {
  const schema = loadManifestSchema();
  if (!isRecord(document)) {
    return { ok: false, errors: [{ code: 'malformed_json' }] };
  }
  if (Array.isArray(document.assets)) {
    const errors = [];
    if (!Object.hasOwn(document, 'schema_version')) {
      errors.push({ code: 'missing_field', field: 'schema_version' });
    }
    const seen = new Set();
    for (const asset of document.assets) {
      errors.push(...validateAsset(asset, schema));
      if (isRecord(asset) && typeof asset.asset_id === 'string') {
        if (seen.has(asset.asset_id)) {
          errors.push({ code: 'duplicate_asset_id', field: 'asset_id' });
        }
        seen.add(asset.asset_id);
      }
    }
    return { ok: errors.length === 0, errors };
  }
  const errors = validateAsset(document, schema);
  return { ok: errors.length === 0, errors };
}
