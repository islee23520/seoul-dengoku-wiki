import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { BACKENDS, backendPolicyError, STATUSES } from './catalog.mjs';

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

const OWNER_VERDICTS = new Set(['pending', 'accepted', 'rejected']);

function validateLook(look) {
  const errors = [];
  if (!isRecord(look)) {
    return [{ code: 'look_malformed', field: 'look' }];
  }
  for (const field of ['palette', 'materials', 'references', 'owner_verdict']) {
    if (!Object.hasOwn(look, field)) {
      errors.push({ code: 'missing_field', field: `look.${field}` });
    }
  }
  if (Object.hasOwn(look, 'palette') && !isRecord(look.palette)) {
    errors.push({ code: 'look_malformed', field: 'look.palette' });
  }
  if (Object.hasOwn(look, 'materials') && !isRecord(look.materials)) {
    errors.push({ code: 'look_malformed', field: 'look.materials' });
  }
  if (Object.hasOwn(look, 'references')) {
    if (!Array.isArray(look.references) || look.references.length === 0
      || !look.references.every((item) => isRecord(item)
        && typeof item.kind === 'string' && item.kind.trim().length > 0
        && typeof item.source === 'string' && item.source.trim().length > 0)) {
      errors.push({ code: 'look_malformed', field: 'look.references' });
    }
  }
  if (Object.hasOwn(look, 'owner_verdict') && !OWNER_VERDICTS.has(look.owner_verdict)) {
    errors.push({ code: 'unknown_owner_verdict', field: 'look.owner_verdict' });
  }
  return errors;
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
  if (BACKENDS.has(asset.generation_backend) && asset.status !== 'archived') {
    const code = backendPolicyError(asset);
    if (code) errors.push({ code, field: 'generation_backend' });
  }
  if (Object.hasOwn(asset, 'status') && !STATUSES.has(asset.status)) {
    errors.push({ code: 'unknown_status', field: 'status' });
  }
  if (Object.hasOwn(asset, 'look')) {
    errors.push(...validateLook(asset.look));
  }
  if (asset.status === 'reviewed' || asset.status === 'promoted') {
    if (asset.rights_status !== 'allowed') {
      errors.push({ code: 'rights_not_allowed', field: 'rights_status' });
    }
    if (!Array.isArray(asset.review_receipts) || asset.review_receipts.length === 0
      || !asset.review_receipts.every((receipt) => isRecord(receipt)
        && receipt.verdict === 'pass'
        && typeof receipt.reviewer === 'string' && receipt.reviewer.trim().length > 0
        && typeof receipt.receipt_hash === 'string' && /^[a-f0-9]{64}$/.test(receipt.receipt_hash)
        && typeof receipt.reviewed_at === 'string' && Number.isFinite(Date.parse(receipt.reviewed_at)))) {
      errors.push({ code: 'review_not_passed', field: 'review_receipts' });
    }
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
