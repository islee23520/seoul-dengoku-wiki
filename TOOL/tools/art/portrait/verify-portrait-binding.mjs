/**
 * Machine gate for character-bound portraits.
 *
 * A binding document joins three things the owner asked to keep together: a
 * registered person from the world atlas, one reproducible slot selection out of
 * the Design library, and the exported composite that selection produces. The
 * atlas records no sex, so every binding declares it explicitly.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractAtlasJson } from '../../wiki/world-atlas-parse.mjs';
import { verifyPortraitReview } from './verify-portrait-review.mjs';

const slotSchema = JSON.parse(readFileSync(new URL('./portrait-layer-slots.json', import.meta.url), 'utf8'));

export const ATLAS_PATH = 'Wikis/game-logic/World-Narrative-Atlas.md';
export const SEXES = ['female', 'male'];
// Delivery requires a nonempty selectable slot. The builder publishes every unique candidate that
// passed the minimum contract; curation-only rejected/superseded/unreviewed records never enter it.
export const REQUIRED_VARIANTS_PER_SLOT = 1;

const SHA256 = /^[0-9a-f]{64}$/;
const isSha256 = (value) => typeof value === 'string' && SHA256.test(value);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

function boundBytes(binding, repoRoot) {
  if (!binding || typeof binding.path !== 'string' || !isSha256(binding.sha256)) return null;
  const full = resolve(repoRoot, binding.path);
  if (!existsSync(full) || !statSync(full).isFile()) return null;
  const bytes = readFileSync(full);
  return digest(bytes) === binding.sha256 ? bytes : null;
}

/** Every human id registered in the world atlas, e.g. K001..K1006. */
export function loadCharacterRegistry(repoRoot, atlasPath = ATLAS_PATH) {
  const full = resolve(repoRoot, atlasPath);
  if (!existsSync(full)) throw new Error(`atlas not found: ${atlasPath}`);
  const parsed = extractAtlasJson(readFileSync(full, 'utf8'));
  if (!parsed.ok) throw new Error(`atlas unreadable: ${parsed.error}`);
  const ids = new Set();
  for (const human of parsed.value.humans ?? []) {
    if (human && typeof human.id === 'string') ids.add(human.id);
  }
  return ids;
}

/**
 * @param {object} document parsed binding document
 * @param {{ repoRoot: string, registry?: Set<string> }} options
 * @returns {{ errors: object[], bindings: object[], ok: boolean }}
 */
export function verifyPortraitBinding(document, options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const errors = [];
  const fail = (code, detail) => errors.push(detail ? { code, ...detail } : { code });

  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    return { errors: [{ code: 'document_not_object' }], bindings: [], ok: false };
  }
  if (document.schema_version !== 1) fail('unsupported_schema_version', { value: document.schema_version ?? null });

  let registry;
  try {
    registry = options.registry ?? loadCharacterRegistry(repoRoot);
  } catch (error) {
    fail('registry_unreadable', { detail: error.message });
    registry = new Set();
  }

  let library = null;
  const libraryBytes = boundBytes(document.library, repoRoot);
  if (!libraryBytes) fail('library_unbound', { path: document.library?.path ?? null });
  else {
    try { library = JSON.parse(libraryBytes.toString('utf8')); } catch (error) {
      fail('library_unparsable', { detail: error.message });
    }
  }

  const rows = Array.isArray(document.bindings) ? document.bindings : [];
  if (!Array.isArray(document.bindings)) fail('bindings_not_array');

  const seenCharacters = new Set();
  const selectionKeys = new Map();
  const exportHashes = new Map();
  const results = [];

  for (const row of rows) {
    const before = errors.length;
    const characterId = row?.character_id;
    if (typeof characterId !== 'string') { fail('character_id_missing'); continue; }
    if (seenCharacters.has(characterId)) fail('duplicate_character', { character_id: characterId });
    seenCharacters.add(characterId);
    if (!registry.has(characterId)) fail('unknown_character', { character_id: characterId });

    const sex = row.sex;
    if (!SEXES.includes(sex)) fail('unknown_sex', { character_id: characterId, value: sex ?? null });

    const selection = row.selection;
    const record = library && SEXES.includes(sex) ? library.sexes?.[sex]?.slots : null;
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      fail('selection_missing', { character_id: characterId });
    } else if (record) {
      const missing = [];
      for (const slot of slotSchema.slots) {
        const entry = record[slot.id];
        const mode = entry?.mode;
        const chosen = selection[slot.id];
        if (mode === 'disabled') {
          if (chosen !== undefined) fail('disabled_slot_bound', { character_id: characterId, slot: slot.id });
          continue;
        }
        if (mode === 'selectable' && Array.isArray(entry.variants) && entry.variants.length < REQUIRED_VARIANTS_PER_SLOT) {
          fail('variant_count_short', {
            character_id: characterId, slot: slot.id,
            expected: REQUIRED_VARIANTS_PER_SLOT, value: entry.variants.length,
          });
        }
        if (mode === 'fixed') {
          if (chosen !== undefined && chosen !== null && chosen !== entry.variants?.[0]?.id) {
            fail('fixed_slot_override', { character_id: characterId, slot: slot.id, variant: chosen });
          }
          if (slot.required && chosen === undefined) missing.push(slot.id);
          continue;
        }
        if (mode === 'companion') {
          if (chosen !== undefined) fail('derived_slot_bound', { character_id: characterId, slot: slot.id, mode });
          continue;
        }
        if (mode !== 'selectable') {
          fail('slot_mode_invalid', { character_id: characterId, slot: slot.id, value: mode ?? null });
          continue;
        }
        if (chosen === undefined) {
          if (slot.required) missing.push(slot.id);
          continue;
        }
        if (!entry.variants?.some((variant) => variant?.id === chosen)) {
          fail('unknown_variant', { character_id: characterId, slot: slot.id, variant: chosen });
        }
        // Delivery binds only fully gate-validated slot components. A provisional component
        // remains preview/curation-only until the 1→4 chain completes.
        if (library?.slot_validity_policy === 'gates-1-4') {
          const chosenVariant = entry.variants?.find((variant) => variant?.id === chosen);
          if (chosenVariant && chosenVariant.slot_validity?.status !== 'verified') {
            fail('slot_not_validated', {
              character_id: characterId, slot: slot.id, variant: chosen,
              validity: chosenVariant.slot_validity?.status ?? null,
            });
          }
        }
      }
      if (missing.length) fail('selection_incomplete', { character_id: characterId, slots: missing });
      for (const slotId of Object.keys(selection)) {
        if (!slotSchema.slots.some((slot) => slot.id === slotId)) {
          fail('unknown_slot', { character_id: characterId, slot: slotId });
        }
      }
    }

    // Same selection must render the same bytes; different selections must not collide.
    const exportHash = row.export?.sha256 ?? null;
    if (!boundBytes(row.export, repoRoot)) fail('export_unbound', { character_id: characterId, path: row.export?.path ?? null });
    if (selection && typeof selection === 'object' && isSha256(exportHash)) {
      const key = JSON.stringify([sex, Object.entries(selection).sort()]);
      const previousHash = selectionKeys.get(key);
      if (previousHash && previousHash !== exportHash) {
        fail('nondeterministic_export', { character_id: characterId, expected: previousHash, value: exportHash });
      } else selectionKeys.set(key, exportHash);
      const previousKey = exportHashes.get(exportHash);
      if (previousKey && previousKey !== key) {
        fail('export_collision', { character_id: characterId, sha256: exportHash });
      } else exportHashes.set(exportHash, key);
    }

    if (row.review !== undefined) {
      const reviewBytes = boundBytes(row.review, repoRoot);
      if (!reviewBytes) fail('review_unbound', { character_id: characterId, path: row.review?.path ?? null });
      else {
        let accepted = false;
        try {
          const review = JSON.parse(reviewBytes.toString('utf8'));
          const report = verifyPortraitReview(review, { repoRoot });
          accepted = report.accepted && report.checkpoint === 'GQ4'
            && review.subject?.character_id === characterId;
        } catch { accepted = false; }
        if (!accepted) fail('review_not_accepted', { character_id: characterId });
      }
    }

    results.push({ character_id: characterId, sex: sex ?? null, ok: errors.length === before });
  }

  return { errors, bindings: results, ok: errors.length === 0 };
}

export function verifyPortraitBindingFile(documentPath, options = {}) {
  const full = resolve(documentPath);
  const document = JSON.parse(readFileSync(full, 'utf8'));
  return { document: full, ...verifyPortraitBinding(document, options) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const read = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  try {
    const documentPath = read('--bindings');
    if (!documentPath) throw new Error('usage: --bindings <path> [--repo-root <path>]');
    const report = verifyPortraitBindingFile(documentPath, { repoRoot: resolve(read('--repo-root') ?? process.cwd()) });
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exitCode = 1;
  }
}
