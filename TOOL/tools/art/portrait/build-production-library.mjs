#!/usr/bin/env node
/**
 * Idempotently integrate accepted Stage-2 portrait evidence into the demo library.
 *
 * This script performs no provider calls. Evidence candidates and the accepted male
 * Gate-1 plates are copied byte-for-byte. Only bg/frame plates are authored here.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodePng, encodePng } from './portrait-layer-composite.mjs';
import { deriveMultiplyPlate } from './build-multiply-details.mjs';
import { buildLibrary, slotMode, TOOL_ID } from './portrait-tool.mjs';

const REPO = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const ASSET_ROOT = join(REPO, 'GAME-REFERENCE/potray-generator/assets/v2');
const PLATE_ROOT = join(ASSET_ROOT, 'plates');
const MANIFEST = join(ASSET_ROOT, 'library.json');
const SLOT_SCHEMA = JSON.parse(readFileSync(join(REPO, 'TOOL/tools/art/portrait/portrait-layer-slots.json'), 'utf8'));
const V2_REPAIR_ROOT = join(REPO, '.omo/evidence/portrait-stage23/g2-art-repair-v2');
const V2_FACE_ACCEPTANCE = join(V2_REPAIR_ROOT, 'acceptance.json');
const V2_ACCESSORY_ROOT = join(V2_REPAIR_ROOT, 'accessories');
const V2_ACCESSORY_ACCEPTANCE = join(V2_ACCESSORY_ROOT, 'acceptance.json');
const V2_INTEGRATION_ACCEPTANCE = join(V2_REPAIR_ROOT, 'integration/acceptance-binding.json');
const V3_REPAIR_ROOT = join(REPO, '.omo/evidence/portrait-stage23/g2-final-repair-v3');
const V3_INTEGRATION_ACCEPTANCE = join(V3_REPAIR_ROOT, 'integration/acceptance-binding.json');
const ACCEPTED_EVIDENCE_REGISTRY = join(REPO, 'TOOL/tools/art/portrait/accepted-evidence-registry.json');
const WIDTH = 1145;
const HEIGHT = 1374;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fileSha = (path) => sha256(readFileSync(path));
const repoPath = (path) => relative(REPO, path).split('\\').join('/');
const scriptPath = fileURLToPath(import.meta.url);
const scriptSha = fileSha(scriptPath);
const multiplyBuilderPath = fileURLToPath(new URL('./build-multiply-details.mjs', import.meta.url));
const multiplyBuilderSha = fileSha(multiplyBuilderPath);

function putCopy(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  if (!existsSync(destination) || fileSha(destination) !== fileSha(source)) copyFileSync(source, destination);
  if (fileSha(destination) !== fileSha(source)) throw new Error(`byte-exact copy failed: ${repoPath(source)}`);
}

function minimumContract(variant) {
  const identity = variant.source_identity ?? {};
  const record = identity.acceptance_record ?? identity.producer_acceptance_record
    ?? identity.ownership_index ?? identity.plate ?? identity.source_plate ?? identity.generating_script;
  const recordSha = identity.acceptance_record_sha256 ?? identity.producer_acceptance_record_sha256
    ?? identity.ownership_index_sha256 ?? identity.sha256 ?? identity.source_plate_sha256 ?? identity.generating_script_sha256;
  if (typeof record !== 'string' || !/^[0-9a-f]{64}$/.test(recordSha ?? '')) {
    throw new Error(`minimum contract binding missing: ${variant.sex}/${variant.id}`);
  }
  return { status: 'PASS', contract: variant.source?.startsWith('derived-') ? 'deterministic-derived-v1' : 'hash-bound-source-v1', record, record_sha256: recordSha };
}

function acceptanceRecord(packageDir) {
  for (const name of ['acceptance.json', 'STATUS.md', 'STATUS.txt', 'approval-record.json', 'final-summary.json', 'verification-receipt.json']) {
    const path = join(packageDir, name);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    if (/LEAD_ACCEPTED/.test(text)) return path;
  }
  return null;
}

// packageRoot overrides the default Gate2 foundation tree, for accepted evidence that lives in a
// different lineage (the Stage-1-lineage female hair repair). sourceKind keeps provenance honest.
function evidenceVariant({ sex, slot, id, label, packageName, candidate, packageRoot = null, sourceKind = 'accepted-gate2-evidence', companionOf = null }) {
  const packageDir = packageRoot
    ? join(REPO, packageRoot)
    : join(REPO, `.omo/evidence/portrait-stage23/gate2-${sex}-foundation-source/gate2-authoring`, packageName);
  const record = acceptanceRecord(packageDir);
  if (!record) return null;
  const source = join(packageDir, candidate);
  if (!existsSync(source)) throw new Error(`accepted package candidate missing: ${repoPath(source)}`);
  const destination = join(PLATE_ROOT, sex, slot, `${id}.png`);
  putCopy(source, destination);
  return {
    id,
    label,
    path: repoPath(destination).slice('GAME-REFERENCE/potray-generator/assets/v2/'.length),
    sha256: fileSha(destination),
    empty: false,
    source: sourceKind,
    source_identity: {
      evidence_package: repoPath(packageDir),
      acceptance_record: repoPath(record),
      acceptance_record_sha256: fileSha(record),
      candidate: repoPath(source),
      candidate_sha256: fileSha(source),
    },
    quality: 'LEAD_ACCEPTED_SAMPLE',
    sex,
    // A companion layer belongs to one primary variant. Without this link the single registered
    // hood fold was drawn under every hat and measurably occluded the whole mouth owner.
    ...(companionOf ? { companion_of: companionOf } : {}),
  };
}

function existingVariant(sex, slot, id, { source = 'accepted-stage1-plate', sourceIdentity = null } = {}) {
  const path = join(PLATE_ROOT, sex, slot, `${id}.png`);
  if (!existsSync(path)) return null;
  const decoded = decodePng(readFileSync(path));
  let empty = true;
  for (let i = 3; i < decoded.pixels.length; i += 4) {
    if (decoded.pixels[i] !== 0) { empty = false; break; }
  }
  return {
    id,
    label: `${sex} ${slot} base`,
    path: repoPath(path).slice('GAME-REFERENCE/potray-generator/assets/v2/'.length),
    sha256: fileSha(path),
    empty,
    source,
    source_identity: sourceIdentity ?? { plate: repoPath(path), sha256: fileSha(path) },
    quality: 'ACCEPTED_FOUNDATION',
    sex,
  };
}

function acceptedRegisteredPlate({ sex, slot, id, label, recordPath, expectedSha }) {
  const path = join(PLATE_ROOT, sex, slot, `${id}.png`);
  const record = join(REPO, recordPath);
  if (!existsSync(path) || fileSha(path) !== expectedSha) throw new Error(`registered plate hash mismatch: ${id}`);
  if (!existsSync(record) || !/LEAD_ACCEPTED/.test(readFileSync(record, 'utf8'))) {
    throw new Error(`registered plate acceptance missing: ${id}`);
  }
  return {
    id,
    label,
    path: repoPath(path).slice('GAME-REFERENCE/potray-generator/assets/v2/'.length),
    sha256: fileSha(path),
    empty: false,
    source: 'accepted-male-hair-registration',
    source_identity: {
      evidence_package: '.omo/evidence/portrait-stage23/male-hair-registration',
      acceptance_record: repoPath(record),
      acceptance_record_sha256: fileSha(record),
      candidate: repoPath(path),
      candidate_sha256: fileSha(path),
    },
    quality: 'LEAD_ACCEPTED_SAMPLE',
    sex,
  };
}

function applyAcceptedEvidenceRegistry() {
  const registry = JSON.parse(readFileSync(ACCEPTED_EVIDENCE_REGISTRY, 'utf8'));
  if (registry.version !== 1 || !Array.isArray(registry.entries)) throw new Error('accepted evidence registry schema error');
  for (const entry of registry.entries) {
    if (!['female', 'male'].includes(entry.sex) || !slotsFor(entry.sex)[entry.slot]) {
      throw new Error(`accepted evidence registry slot error: ${entry.sex}/${entry.slot}`);
    }
    const record = join(REPO, entry.acceptance_record);
    if (!existsSync(record) || fileSha(record) !== entry.acceptance_record_sha256) {
      throw new Error(`accepted evidence registry acceptance drift: ${entry.sex}/${entry.slot}`);
    }
    const pattern = new RegExp(entry.required_status_pattern);
    if (!pattern.test(readFileSync(record, 'utf8'))) {
      throw new Error(`accepted evidence registry status missing: ${entry.sex}/${entry.slot}`);
    }
    if (slotMode(entry.sex, entry.slot) !== entry.mode) {
      throw new Error(`accepted evidence registry mode mismatch: ${entry.sex}/${entry.slot}`);
    }
    let overrideRecord = null;
    if (entry.render_override_acceptance) {
      overrideRecord = join(REPO, entry.render_override_acceptance.record);
      if (!existsSync(overrideRecord) || fileSha(overrideRecord) !== entry.render_override_acceptance.sha256) {
        throw new Error(`accepted evidence registry render override acceptance drift: ${entry.sex}/${entry.slot}`);
      }
      if (!new RegExp(entry.render_override_acceptance.required_status_pattern).test(readFileSync(overrideRecord, 'utf8'))) {
        throw new Error(`accepted evidence registry render override status missing: ${entry.sex}/${entry.slot}`);
      }
    }
    const overrideAcceptanceFor = (override) => {
      // A later repair package may supersede one conditional override. Per-override acceptance
      // records override the entry-level package binding for exactly that candidate.
      if (override.acceptance_record) {
        const record = join(REPO, override.acceptance_record);
        if (!existsSync(record) || fileSha(record) !== override.acceptance_record_sha256) {
          throw new Error(`accepted evidence registry per-override acceptance drift: ${override.candidate}`);
        }
        if (!new RegExp(override.required_status_pattern ?? 'PASS').test(readFileSync(record, 'utf8'))) {
          throw new Error(`accepted evidence registry per-override status missing: ${override.candidate}`);
        }
        return record;
      }
      if (!overrideRecord) throw new Error(`render override acceptance missing: ${override.candidate}`);
      return overrideRecord;
    };
    const variants = entry.variants.map((variant) => {
      const variantAcceptanceFor = () => {
        // A later repair package may supersede a single variant. A per-variant acceptance
        // record overrides the entry-level package binding for exactly that candidate.
        if (variant.acceptance_record) {
          const perVariantRecord = join(REPO, variant.acceptance_record);
          if (!existsSync(perVariantRecord) || fileSha(perVariantRecord) !== variant.acceptance_record_sha256) {
            throw new Error(`accepted evidence registry per-variant acceptance drift: ${variant.id}`);
          }
          if (!new RegExp(variant.required_status_pattern ?? 'PASS').test(readFileSync(perVariantRecord, 'utf8'))) {
            throw new Error(`accepted evidence registry per-variant status missing: ${variant.id}`);
          }
          return perVariantRecord;
        }
        return record;
      };
      const boundVariantRecord = variantAcceptanceFor();
      const candidate = join(REPO, variant.candidate);
      if (!existsSync(candidate) || fileSha(candidate) !== variant.candidate_sha256) {
        throw new Error(`accepted evidence registry candidate drift: ${variant.id}`);
      }
      const destination = join(PLATE_ROOT, entry.sex, entry.slot, `${variant.id}.png`);
      putCopy(candidate, destination);
      const renderOverrides = (variant.render_overrides ?? []).map((override) => {
        const boundRecord = overrideAcceptanceFor(override);
        const target = slotsFor(entry.sex)[override.when?.slot];
        if (!target?.variants.some((candidate) => candidate.id === override.when?.variant)) {
          throw new Error(`render override target missing: ${variant.id}/${override.when?.slot}/${override.when?.variant}`);
        }
        const overrideCandidate = join(REPO, override.candidate);
        if (!existsSync(overrideCandidate) || fileSha(overrideCandidate) !== override.candidate_sha256) {
          throw new Error(`accepted evidence registry render override drift: ${variant.id}/${override.when.variant}`);
        }
        const destination = join(PLATE_ROOT, entry.sex, `${entry.slot}_overrides`, `${variant.id}__${override.when.variant}.png`);
        putCopy(overrideCandidate, destination);
        return {
          when: override.when,
          path: repoPath(destination).slice('GAME-REFERENCE/potray-generator/assets/v2/'.length),
          sha256: override.candidate_sha256,
          source: 'accepted-evidence-render-override',
          source_identity: {
            evidence_package: repoPath(dirname(boundRecord)),
            acceptance_record: repoPath(boundRecord),
            acceptance_record_sha256: fileSha(boundRecord),
            candidate: override.candidate,
            candidate_sha256: override.candidate_sha256,
          },
          quality: 'LEAD_ACCEPTED_COMBINATION_OVERRIDE',
        };
      });
      return {
        id: variant.id,
        label: variant.label,
        path: repoPath(destination).slice('GAME-REFERENCE/potray-generator/assets/v2/'.length),
        sha256: variant.candidate_sha256,
        empty: variant.empty === true,
        source: 'accepted-evidence-registry',
        source_identity: {
          evidence_package: repoPath(dirname(boundVariantRecord)),
          acceptance_record: repoPath(boundVariantRecord),
          acceptance_record_sha256: fileSha(boundVariantRecord),
          candidate: variant.candidate,
          candidate_sha256: variant.candidate_sha256,
        },
        quality: 'LEAD_ACCEPTED_SAMPLE',
        sex: entry.sex,
        ...(renderOverrides.length ? { render_overrides: renderOverrides } : {}),
        ...(variant.companion_of ? { companion_of: variant.companion_of } : {}),
      };
    });
    if (entry.mode === 'selectable' && entry.replace_slot && variants.length === 0) throw new Error(`accepted evidence registry selectable slot is empty: ${entry.sex}/${entry.slot}`);
    const target = slotsFor(entry.sex)[entry.slot];
    if (entry.replace_slot) target.variants = variants;
    else {
      const replacements = new Map(variants.map((variant) => [variant.id, variant]));
      target.variants = target.variants.map((current) => replacements.get(current.id) ?? current);
      for (const variant of variants) if (!target.variants.some((current) => current.id === variant.id)) target.variants.push(variant);
    }
    if (entry.mode === 'selectable' && target.variants.length === 0) throw new Error(`accepted evidence registry merged selectable slot is empty: ${entry.sex}/${entry.slot}`);
  }
}

function authorBackdrop(sex, index) {
  const palettes = sex === 'female'
    ? [[49, 64, 76], [57, 71, 83], [43, 58, 72]]
    : [[44, 59, 72], [52, 67, 80], [38, 54, 68]];
  const base = palettes[index - 1];
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y += 1) {
    const lift = Math.round(14 * (1 - y / (HEIGHT - 1)));
    for (let x = 0; x < WIDTH; x += 1) {
      const i = (y * WIDTH + x) * 4;
      let delta = -Math.round(7 * Math.abs(x - WIDTH / 2) / (WIDTH / 2));
      if (index === 2) {
        // Asymmetric architectural side panel with two vertical reveals.
        const panel = x > WIDTH * 0.68;
        delta += panel ? 18 : -3;
        if (Math.abs(x - WIDTH * 0.68) < 7 || Math.abs(x - WIDTH * 0.86) < 4) delta -= 24;
        if (panel && y > HEIGHT * 0.18 && y < HEIGHT * 0.23) delta += 12;
      } else if (index === 3) {
        // Bounded diagonal light composition, materially different from the centered vignette.
        const diagonal = x + y * 0.58;
        const band = Math.abs(diagonal - WIDTH * 0.92);
        delta += band < 145 ? Math.round(22 * (1 - band / 145)) : -5;
        const radial = Math.hypot(x - WIDTH * 0.22, y - HEIGHT * 0.27);
        if (radial < 230) delta += Math.round(9 * (1 - radial / 230));
      }
      pixels[i] = Math.max(0, Math.min(255, base[0] + lift + delta));
      pixels[i + 1] = Math.max(0, Math.min(255, base[1] + lift + delta));
      pixels[i + 2] = Math.max(0, Math.min(255, base[2] + lift + delta));
      pixels[i + 3] = 255;
    }
  }
  return encodePng(WIDTH, HEIGHT, pixels);
}

function authorFrame(sex, index) {
  const colors = sex === 'female'
    ? [[183, 147, 92], [112, 137, 151], [79, 91, 103]]
    : [[161, 132, 84], [99, 127, 145], [70, 83, 96]];
  const color = colors[index - 1];
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      let edge = false;
      if (index === 1) {
        const inset = 18; const thickness = 8;
        edge = x >= inset && x < WIDTH - inset && y >= inset && y < HEIGHT - inset
          && (x < inset + thickness || x >= WIDTH - inset - thickness || y < inset + thickness || y >= HEIGHT - inset - thickness);
      } else if (index === 2) {
        // Two concentric lines separated by a fully transparent gap.
        const line = (inset, thickness) => x >= inset && x < WIDTH - inset && y >= inset && y < HEIGHT - inset
          && (x < inset + thickness || x >= WIDTH - inset - thickness || y < inset + thickness || y >= HEIGHT - inset - thickness);
        edge = line(24, 5) || line(41, 4);
      } else {
        // Eight disconnected corner-bracket segments; no continuous rectangular topology.
        const inset = 34; const length = 150; const thickness = 10;
        const left = x >= inset && x < inset + thickness;
        const right = x >= WIDTH - inset - thickness && x < WIDTH - inset;
        const top = y >= inset && y < inset + thickness;
        const bottom = y >= HEIGHT - inset - thickness && y < HEIGHT - inset;
        const nearLeft = x >= inset && x < inset + length;
        const nearRight = x >= WIDTH - inset - length && x < WIDTH - inset;
        const nearTop = y >= inset && y < inset + length;
        const nearBottom = y >= HEIGHT - inset - length && y < HEIGHT - inset;
        edge = (top || bottom) && (nearLeft || nearRight) || (left || right) && (nearTop || nearBottom);
      }
      if (!edge) continue;
      const i = (y * WIDTH + x) * 4;
      pixels[i] = color[0]; pixels[i + 1] = color[1]; pixels[i + 2] = color[2]; pixels[i + 3] = 230;
    }
  }
  return encodePng(WIDTH, HEIGHT, pixels);
}

function authoredVariant(sex, slot, index, bytes) {
  const id = `${slot}-authored-${String(index).padStart(2, '0')}`;
  const path = join(PLATE_ROOT, sex, slot, `${id}.png`);
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path) || !readFileSync(path).equals(bytes)) writeFileSync(path, bytes);
  return {
    id,
    label: `${sex} ${slot} deterministic ${index}`,
    path: repoPath(path).slice('GAME-REFERENCE/potray-generator/assets/v2/'.length),
    sha256: fileSha(path),
    empty: false,
    source: 'authored-deterministic',
    source_identity: { generating_script: repoPath(scriptPath), generating_script_sha256: scriptSha, recipe: `${slot}-${sex}-${index}` },
    quality: 'DETERMINISTIC_NON_ANATOMICAL',
    sex,
  };
}

function acceptedV2Variant({ sex, slot, id, label, packageRelative, acceptanceRelative, candidateRelative, expectedSha }) {
  const packageDir = join(REPO, packageRelative);
  const producerRecord = join(packageDir, acceptanceRelative);
  const candidate = join(packageDir, candidateRelative);
  if (!existsSync(producerRecord)) throw new Error(`accepted-v2 producer record missing: ${repoPath(producerRecord)}`);
  if (!existsSync(V2_INTEGRATION_ACCEPTANCE)) throw new Error(`accepted-v2 integration record missing: ${repoPath(V2_INTEGRATION_ACCEPTANCE)}`);
  if (!existsSync(candidate)) throw new Error(`accepted-v2 candidate missing: ${repoPath(candidate)}`);
  if (fileSha(candidate) !== expectedSha) throw new Error(`accepted-v2 candidate hash mismatch: ${repoPath(candidate)}`);
  const destination = join(PLATE_ROOT, sex, slot, `${id}.png`);
  putCopy(candidate, destination);
  return {
    id,
    label,
    path: repoPath(destination).slice('GAME-REFERENCE/potray-generator/assets/v2/'.length),
    sha256: fileSha(destination),
    empty: false,
    source: 'accepted-gate2-evidence',
    source_identity: {
      evidence_package: repoPath(packageDir),
      acceptance_record: repoPath(V2_INTEGRATION_ACCEPTANCE),
      acceptance_record_sha256: fileSha(V2_INTEGRATION_ACCEPTANCE),
      producer_acceptance_record: repoPath(producerRecord),
      producer_acceptance_record_sha256: fileSha(producerRecord),
      candidate: repoPath(candidate),
      candidate_sha256: fileSha(candidate),
    },
    quality: 'INDEPENDENTLY_ACCEPTED_REPAIR_V2',
    sex,
  };
}

const v3Acceptance = JSON.parse(readFileSync(V3_INTEGRATION_ACCEPTANCE, 'utf8'));
if (v3Acceptance.status !== 'LEAD_ACCEPTED_G2_FINAL_REPAIR_V3') {
  throw new Error('final repair v3 integration acceptance is not LEAD_ACCEPTED');
}
for (const record of Object.values(v3Acceptance.producer_acceptance_records ?? {})) {
  const path = join(REPO, record.path);
  if (!existsSync(path) || fileSha(path) !== record.sha256) {
    throw new Error(`final repair v3 producer acceptance drifted: ${record.path}`);
  }
}

function acceptedV3Variant({ sex, slot, id, label, companionOf = null }) {
  const accepted = v3Acceptance.accepted?.[id];
  if (!accepted) throw new Error(`final repair v3 candidate is not accepted: ${id}`);
  const candidate = join(REPO, accepted.candidate);
  if (!existsSync(candidate) || fileSha(candidate) !== accepted.sha256) {
    throw new Error(`final repair v3 candidate hash mismatch: ${id}`);
  }
  const destination = join(PLATE_ROOT, sex, slot, `${id}.png`);
  putCopy(candidate, destination);
  return {
    id,
    label,
    path: repoPath(destination).slice('GAME-REFERENCE/potray-generator/assets/v2/'.length),
    sha256: fileSha(destination),
    empty: accepted.empty === true,
    source: 'accepted-final-repair-v3-evidence',
    source_identity: {
      evidence_package: repoPath(V3_REPAIR_ROOT),
      acceptance_record: repoPath(V3_INTEGRATION_ACCEPTANCE),
      acceptance_record_sha256: fileSha(V3_INTEGRATION_ACCEPTANCE),
      candidate: repoPath(candidate),
      candidate_sha256: fileSha(candidate),
    },
    quality: 'LEAD_ACCEPTED_G2_FINAL_REPAIR_V3',
    sex,
    ...(companionOf ? { companion_of: companionOf } : {}),
  };
}

function exportMaleFoundation() {
  const sourceDir = join(REPO, '.omo/evidence/portrait-stage23/gate2-male-foundation-source/gate1-split-v2/final/slots');
  const owner = join(REPO, '.omo/evidence/portrait-stage23/gate2-male-foundation-source/gate1-split-v2/final/ownership-index.png');
  const reconstruction = join(REPO, '.omo/evidence/portrait-stage23/gate2-male-foundation-source/gate1-split-v2/final/reconstruction.png');
  if (fileSha(owner) !== '5938fe2a28e217ab707af34408a00b8b6741d6fdf405cd5aacdf15a854ac6a29') throw new Error('male ownership authority hash mismatch');
  if (fileSha(reconstruction) !== '5f4e574f9f47820c21e00a45a4b4090a0d77f4142c70ea780df6b5dd46896367') throw new Error('male reconstruction authority hash mismatch');
  const recutV3 = join(REPO, '.omo/evidence/eye-target-vision-20260917/feature-recut-v3/repaired-isolates');
  for (const slot of SLOT_SCHEMA.slots) {
    const source = slot.id === 'eyes_white'
      ? join(recutV3, 'male', 'eyes_white-01.png')
      : join(sourceDir, `${slot.id}.png`);
    putCopy(source, join(PLATE_ROOT, 'male', slot.id, `${slot.id}-base.png`));
  }
  putCopy(join(recutV3, 'female', 'eyes_white-01.png'), join(PLATE_ROOT, 'female', 'eyes_white', 'eyes_white-base.png'));
  return { sourceDir, owner, reconstruction };
}

const maleFoundation = exportMaleFoundation();
const generated = buildLibrary({ repoRoot: REPO, plateRoot: repoPath(PLATE_ROOT), manifestDir: repoPath(ASSET_ROOT), stage: 'stage23-production-integration' });
const slotsFor = (sex) => generated.sexes[sex].slots;
for (const sex of ['female', 'male']) {
  for (const slot of SLOT_SCHEMA.slots) {
    const mode = slotMode(sex, slot.id);
    slotsFor(sex)[slot.id] = mode === 'disabled'
      ? { mode, enabled: false, variants: [], reason: `slot disabled for ${sex}` }
      : { mode, enabled: true, variants: [] };
  }
  slotsFor(sex).bg.variants = [1, 2, 3].map((i) => authoredVariant(sex, 'bg', i, authorBackdrop(sex, i)));
  slotsFor(sex).frame.variants = [1, 2, 3].map((i) => authoredVariant(sex, 'frame', i, authorFrame(sex, i)));
}

// Honest Stage-1 female inventory: retain only unique/genuine base plates.
const femaleBase = {
  clothes_back: ['clothes_back-o0'], hair_back: ['hair_back-h0'], face_base: ['face_base-base'],
  neck: ['neck-base'], cheeks: ['cheeks-base'], chin: ['chin-base'], mouth: ['mouth-base'], nose: ['nose-base'],
  eyes_shape: ['eyes_shape-e0', 'eyes_shape-e1'], eyes_color: ['eyes_color-e0', 'eyes_color-e1'], ears: ['ears-base'],
  eyes_white: ['eyes_white-base'],
  clothes: ['clothes-o0'], hair: ['hair-h0', 'hair-h1'], clothes_front: ['clothes_front-o0'],
  headgear_back: ['headgear_back-base'], headgear_mid: ['headgear_mid-base'], headgear: ['headgear-base'], acc_eye: ['acc_eye-base'],
};
for (const [slot, ids] of Object.entries(femaleBase)) slotsFor('female')[slot].variants = ids.map((id) => existingVariant('female', slot, id)).filter(Boolean);

// Physical z-layers are members of one logical selection. A collar/front plate or rear hair is
// never selected independently; it follows the primary clothes/hair identity for this camera.
slotsFor('female').clothes_back.variants[0].companion_of = { slot: 'clothes', variant: 'female-clothes-01' };
slotsFor('female').clothes_front.variants[0].companion_of = { slot: 'clothes', variants: ['female-clothes-01', 'female-clothes-02'] };
slotsFor('female').hair_back.variants[0].companion_of = { slot: 'hair', variants: ['hair-h0', 'hair-h1'] };
const femaleHairH2 = evidenceVariant({
  sex: 'female', slot: 'hair', id: 'female-hair-03', label: 'Female hair 03 chin-length blunt bob',
  candidate: 'plates/hair-h2.png', packageRoot: '.omo/evidence/portrait-stage23/stage1-female-hair-variants',
  sourceKind: 'accepted-stage1-female-hair-evidence',
});
if (!femaleHairH2) throw new Error('accepted female hair h2 evidence missing');
slotsFor('female').hair.variants.push(femaleHairH2);

// Every accepted male foundation plate is copied; nonempty/current bases are registered where no accepted triplet replaces them.
for (const slot of SLOT_SCHEMA.slots) {
  if (['bg', 'frame'].includes(slot.id) || slotsFor('male')[slot.id].mode === 'disabled') continue;
  const foundationSource = slot.id === 'eyes_white'
    ? join(REPO, '.omo/evidence/eye-target-vision-20260917/feature-recut-v3/repaired-isolates/male/eyes_white-01.png')
    : join(maleFoundation.sourceDir, `${slot.id}.png`);
  const base = existingVariant('male', slot.id, `${slot.id}-base`, {
    source: 'accepted-gate1-foundation',
    sourceIdentity: {
      source_plate: repoPath(foundationSource),
      source_plate_sha256: fileSha(foundationSource),
      ownership_index: repoPath(maleFoundation.owner),
      ownership_index_sha256: fileSha(maleFoundation.owner),
      reconstruction: repoPath(maleFoundation.reconstruction),
      reconstruction_sha256: fileSha(maleFoundation.reconstruction),
    },
  });
  slotsFor('male')[slot.id].variants = base ? [base] : [];
}

const maleHairAcceptance = '.omo/evidence/portrait-stage23/male-hair-registration/acceptance.json';
slotsFor('male').hair.variants = [
  ['male-hair-01', 'Male hair 01 short textured spikes', 'e31cd3f810513bb7f1c4c1bbac7f39f2ccb09fec784c42ec6fcf04f64b2a6786'],
  ['male-hair-02', 'Male hair 02 short side part', '768f26ea1b1c0290bbd1d3205cd6e3916641535662d1f9802511e7deefdf0b69'],
  ['male-hair-03', 'Male hair 03 close buzz cut', '3632e38b12b7551a5e3c82dc33139c23dc9510fa4e170a976b1cece8d50db1eb'],
].map(([id, label, expectedSha]) => acceptedRegisteredPlate({
  sex: 'male', slot: 'hair', id, label, recordPath: maleHairAcceptance, expectedSha,
}));

const accepted = {
  male: {
    mouth: [
      ['male-mouth-01', 'Male mouth 01', 'mouth-variant-current01', 'candidate/mouth-variant-current01.png'],
      ['male-mouth-02', 'Male mouth 02', 'mouth-variants-0203', 'variant02/candidate/mouth-variant02.png'],
      ['male-mouth-03', 'Male mouth 03', 'mouth-variants-0203', 'variant03/candidate/mouth-variant03.png'],
    ],
    nose: [
      ['male-nose-01', 'Male nose 01', 'nose-variant-current01', 'candidate/nose-variant-current01.png'],
      ['male-nose-02', 'Male nose 02', 'nose-variants-0203', 'variant02/candidate/nose-variant02.png'],
      ['male-nose-03', 'Male nose 03', 'nose-variants-0203', 'variant03/candidate/nose-variant03.png'],
    ],
    eyes_shape: [
      ['male-eyes-shape-01', 'Male eye shape 01', 'eyes-variant-current01', 'candidate/eyes_shape.png'],
      ['male-eyes-shape-02', 'Male eye shape 02', 'eyes-variants-0203', 'variant02/plates/z11-eyes_shape.png'],
      ['male-eyes-shape-03', 'Male eye shape 03', 'eyes-variants-0203', 'variant03/plates/z11-eyes_shape.png'],
    ],
    eyes_color: [
      ['male-eyes-color-01', 'Male eye color 01', 'eyes-variant-current01', 'candidate/eyes_color.png'],
      ['male-eyes-color-02', 'Male eye color 02', 'eyes-variants-0203', 'variant02/plates/z12-eyes_color.png'],
      ['male-eyes-color-03', 'Male eye color 03', 'eyes-variants-0203', 'variant03/plates/z12-eyes_color.png'],
    ],
    clothes: [
      ['male-clothes-01', 'Male garment 01', 'outfit-variant01', 'candidate/clothes.png'],
      ['male-clothes-02', 'Male garment 02', 'outfit-variant02', 'candidate/clothes.png'],
      ['male-clothes-03', 'Male garment 03', 'outfit-variant03', 'candidate/clothes.png'],
    ],

    // Beard reached 1 genuine variant, not 3: variants 02/03 were honestly rejected at 393 px
    // and 35 px outside the v3 ceiling. beard_back stays unauthored and unregistered.
    beard: [
      ['male-beard-01', 'Male beard 01 jawline', 'beard-unmasked-art-envelope/attempt-jawline-regrade-v3', 'candidate/beard.png'],
    ],
  },
  female: {
    mouth: [
      ['female-mouth-01', 'Female mouth 01', 'mouth-variant-current01', 'candidate/mouth.png'],
      // 02/03 come from the contour-safe retry; the first -0203 attempt is sealed as rejected and never registered.
      ['female-mouth-02', 'Female mouth 02', 'mouth-variants-0203-retry', 'variant02/candidate/mouth.png'],
      ['female-mouth-03', 'Female mouth 03', 'mouth-variants-0203-retry', 'variant03/candidate/mouth.png'],
    ],
    nose: [
      ['female-nose-01', 'Female nose 01', 'nose-variant-current01', 'candidate/nose-variant-current01.png'],
      ['female-nose-02', 'Female nose 02', 'nose-variants-0203-retry', 'variant02/candidate.png'],
      ['female-nose-03', 'Female nose 03', 'nose-variants-0203-retry', 'variant03/candidate.png'],
    ],
    eyes_shape: [
      ['female-eyes-shape-01', 'Female eye shape 01', 'eyes-variant-current01', 'candidate/eyes_shape.png'],
      ['female-eyes-shape-02', 'Female eye shape 02', 'eyes-variants-0203', 'variant02/candidate/eyes_shape.png'],
      ['female-eyes-shape-03', 'Female eye shape 03', 'eyes-variants-0203', 'variant03/candidate/eyes_shape.png'],
    ],
    eyes_color: [
      ['female-eyes-color-01', 'Female eye color 01', 'eyes-variant-current01', 'candidate/eyes_color.png'],
      ['female-eyes-color-02', 'Female eye color 02', 'eyes-variants-0203', 'variant02/candidate/eyes_color.png'],
      ['female-eyes-color-03', 'Female eye color 03', 'eyes-variants-0203', 'variant03/candidate/eyes_color.png'],
    ],
    clothes: [
      ['female-clothes-01', 'Female garment 01', 'outfit-variant-current01', 'candidate/clothes.png'],
      ['female-clothes-02', 'Female garment 02', 'outfit-variants-0203', 'variant02/candidate/clothes.png'],
      ['female-clothes-03', 'Female garment 03', 'outfit-variants-0203', 'variant03/candidate/clothes.png'],
    ],
  },
};
for (const [sex, bySlot] of Object.entries(accepted)) {
  for (const [slot, rows] of Object.entries(bySlot)) {
    const variants = rows.map(([id, label, packageName, candidate]) => evidenceVariant({ sex, slot, id, label, packageName, candidate })).filter(Boolean);
    if (variants.length) {
      // Accepted evidence replaces the registered base when it completes the target triplet, and
      // also whenever the existing registration is only empty plates: an empty plate is not a
      // variant, and audit-library.py rejects zero alpha support with EMPTY_SUPPORT.
      const existing = slotsFor(sex)[slot].variants;
      const onlyEmpty = existing.length > 0 && existing.every((variant) => variant.empty === true);
      if (variants.length === 3 || onlyEmpty || existing.length === 0) slotsFor(sex)[slot].variants = variants;
      else slotsFor(sex)[slot].variants.push(...variants);
    }
  }
}


// Accessory slots come from dedicated per-sex packages outside the Gate2 foundation tree. Every
// registered accessory plate before this point decoded with zero alpha support, so these replace
// rather than extend. headgear_mid/headgear_back receive only the hood set, the one design that
// genuinely occupies them; those two slots stay honestly short of 3 rather than padded.
const accessories = {
  female: {
    root: '.omo/evidence/portrait-stage23/female-accessory-slots',
    rows: [
      ['headgear', 'female-headgear-01', 'Female headgear 01 flat cap', 'hg01/plates/headgear-hg01.png'],
      ['headgear', 'female-headgear-02', 'Female headgear 02 knit beanie', 'hg02/plates/headgear-hg02.png'],
      ['headgear', 'female-headgear-03', 'Female headgear 03 hood rim', 'hg03/plates/headgear-hg03.png'],
      ['headgear_mid', 'female-headgear-mid-03', 'Female headgear mid 03 gathered cowl', 'hg03/plates/headgear_mid-hg03.png', { slot: 'headgear', variant: 'female-headgear-03' }],
      ['headgear_back', 'female-headgear-back-03', 'Female headgear back 03 rear hood', 'hg03/plates/headgear_back-hg03.png', { slot: 'headgear', variant: 'female-headgear-03' }],
      ['acc_eye', 'female-acc-eye-01', 'Female eyewear 01 spectacles', 'ae01/plates/acc_eye-ae01.png'],
      ['acc_eye', 'female-acc-eye-02', 'Female eyewear 02 goggles', 'ae02/plates/acc_eye-ae02.png'],
      ['acc_eye', 'female-acc-eye-03', 'Female eyewear 03 eye patch', 'ae03/plates/acc_eye-ae03.png'],
    ],
  },
  male: {
    root: '.omo/evidence/portrait-stage23/male-accessory-slots',
    rows: [
      ['headgear', 'male-headgear-01', 'Male headgear 01 work cap', 'hg01/candidate/headgear.png'],
      ['headgear', 'male-headgear-02', 'Male headgear 02 watch cap', 'hg02/candidate/headgear.png'],
      ['headgear', 'male-headgear-03', 'Male headgear 03 hood front', 'hg03/candidate/headgear.png'],
      ['headgear_mid', 'male-headgear-mid-03', 'Male headgear mid 03 hood folds', 'hg03/candidate/headgear_mid.png', { slot: 'headgear', variant: 'male-headgear-03' }],
      ['headgear_back', 'male-headgear-back-03', 'Male headgear back 03 rear hood', 'hg03/candidate/headgear_back.png', { slot: 'headgear', variant: 'male-headgear-03' }],
      ['acc_eye', 'male-acc-eye-01', 'Male eyewear 01 spectacles', 'ae01/candidate/acc_eye.png'],
      ['acc_eye', 'male-acc-eye-02', 'Male eyewear 02 goggles', 'ae02/candidate/acc_eye.png'],
      ['acc_eye', 'male-acc-eye-03', 'Male eyewear 03 eye patch', 'ae03/candidate/acc_eye.png'],
    ],
  },
};
// Garment companion layers: the collar rising behind the neck (z1) and any element crossing
// forward over the hair (z18), authored to match the already-accepted garments. clothes_front
// stays honestly short where a design has no genuine forward element rather than being padded.
const garmentCompanions = {
  male: {
    root: '.omo/evidence/portrait-stage23/male-garment-companions',
    rows: [
      ['clothes_back', 'male-clothes-back-01', 'Male collar 01 charcoal stand', 'cmp01/candidate/clothes_back.png', { slot: 'clothes', variant: 'male-clothes-01' }],
      ['clothes_back', 'male-clothes-back-02', 'Male collar 02 olive band', 'cmp02/candidate/clothes_back.png', { slot: 'clothes', variant: 'male-clothes-02' }],
      ['clothes_back', 'male-clothes-back-03', 'Male collar 03 rust canvas', 'cmp03/candidate/clothes_back.png', { slot: 'clothes', variant: 'male-clothes-03' }],
      ['clothes_front', 'male-clothes-front-03', 'Male front 03 rust strap', 'cmp03/candidate/clothes_front.png', { slot: 'clothes', variant: 'male-clothes-03' }],
    ],
  },
};
// face_base variants carry the byte-exact current z5 alpha (female 414,803 px, male 337,178 px),
// so the separately registered mouth/nose/eyes/ears owners stay aligned. These extend the
// existing accepted base plate rather than replacing it: base + 02 + 03 = 3.
const faceBaseVariants = {
  female: {
    root: '.omo/evidence/portrait-stage23/female-face-base-variants',
    rows: [
      ['face_base', 'female-face-base-02', 'Female skin 02 weathered', 'variant02/candidate-face_base-z5.png'],
      ['face_base', 'female-face-base-03', 'Female skin 03 pale drawn', 'variant03/candidate-face_base-z5.png'],
    ],
  },
  male: {
    root: '.omo/evidence/portrait-stage23/male-face-base-variants',
    rows: [
      ['face_base', 'male-face-base-02', 'Male skin 02 weathered', 'variant02/candidate/face-base-variant02.png'],
      ['face_base', 'male-face-base-03', 'Male skin 03 gaunt ashen', 'variant03/candidate/face-base-variant03.png'],
    ],
  },
};
const externalPackages = [
  ...Object.entries(accessories).map(([sex, spec]) => ({ sex, spec, sourceKind: 'accepted-accessory-evidence' })),
  ...Object.entries(garmentCompanions).map(([sex, spec]) => ({ sex, spec, sourceKind: 'accepted-companion-evidence' })),
  ...Object.entries(faceBaseVariants).map(([sex, spec]) => ({ sex, spec, sourceKind: 'accepted-face-base-evidence' })),
];
for (const { sex, spec, sourceKind } of externalPackages) {
  const bySlot = new Map();
  for (const [slot, id, label, candidate, companionOf = null] of spec.rows) {
    const variant = evidenceVariant({
      sex, slot, id, label, candidate,
      packageRoot: spec.root,
      sourceKind,
      companionOf,
    });
    if (!variant) continue;
    if (!bySlot.has(slot)) bySlot.set(slot, []);
    bySlot.get(slot).push(variant);
  }
  // Same merge rule as the Gate2 block: replace when the new set completes the triplet or the
  // existing registration is only empty plates, otherwise extend the accepted base plate.
  for (const [slot, variants] of bySlot) {
    const existing = slotsFor(sex)[slot].variants;
    const onlyEmpty = existing.length > 0 && existing.every((variant) => variant.empty === true);
    if (variants.length === 3 || onlyEmpty || existing.length === 0) slotsFor(sex)[slot].variants = variants;
    else slotsFor(sex)[slot].variants.push(...variants);
  }
}

// Publish only the 30 face candidates listed by the independent v2 acceptance record.
const faceRepairRoot = repoPath(V2_REPAIR_ROOT);
const faceAcceptancePath = V2_FACE_ACCEPTANCE;
const faceAcceptance = JSON.parse(readFileSync(faceAcceptancePath, 'utf8'));
if (faceAcceptance.status !== 'PASS' || faceAcceptance.candidateCount !== 30) {
  throw new Error('g2 art repair v2 face acceptance is not independently PASS');
}
for (const sex of ['female', 'male']) {
  for (const slot of ['face_base', 'mouth', 'nose', 'eyes_shape', 'eyes_color']) {
    slotsFor(sex)[slot].variants = [1, 2, 3].map((index) => {
      const acceptedCandidate = faceAcceptance.candidates.find((candidate) =>
        candidate.sex === sex && candidate.slot === slot && candidate.variant === index);
      if (!acceptedCandidate || acceptedCandidate.semanticOwnership !== 'PASS') {
        throw new Error(`unaccepted g2 art repair v2 face candidate: ${sex}/${slot}/${index}`);
      }
      const id = `${sex}-${slot.replace('_', '-')}-${String(index).padStart(2, '0')}`;
      return acceptedV2Variant({
        sex,
        slot,
        id,
        label: `${sex} ${slot.replace('_', ' ')} independently accepted v2 ${String(index).padStart(2, '0')}`,
        packageRelative: faceRepairRoot,
        acceptanceRelative: 'acceptance.json',
        candidateRelative: acceptedCandidate.path,
        expectedSha: acceptedCandidate.sha256,
      });
    });
  }
}

// The accessory producer independently accepted exactly eight replacements: all six headgear
// plates and acc_eye-03 for each sex. acc_eye-01/02 already pass and must remain byte-identical.
const accessoryV2Root = repoPath(V2_ACCESSORY_ROOT);
const accessoryAcceptancePath = V2_ACCESSORY_ACCEPTANCE;
const accessoryAcceptance = JSON.parse(readFileSync(accessoryAcceptancePath, 'utf8'));
if (accessoryAcceptance.status !== 'PASS2_EIGHT_REPLACEMENT_CANDIDATES_ACCEPTED'
  || accessoryAcceptance.candidate_count_accepted !== 8
  || accessoryAcceptance.no_extra_candidates !== true) {
  throw new Error('g2 art repair v2 accessory acceptance is not independently PASS');
}
for (const sex of ['female', 'male']) {
  const sexLabel = sex === 'female' ? 'Female' : 'Male';
  const headgearLabels = ['flat cap', 'knit beanie', 'hood rim'];
  slotsFor(sex).headgear.variants = [1, 2, 3].map((index) => {
    const id = `${sex}-headgear-${String(index).padStart(2, '0')}`;
    const acceptedCandidate = accessoryAcceptance.candidates[id];
    if (!acceptedCandidate) throw new Error(`unaccepted g2 art repair v2 accessory candidate: ${id}`);
    return acceptedV2Variant({
      sex,
      slot: 'headgear',
      id,
      label: `${sexLabel} headgear ${String(index).padStart(2, '0')} ${headgearLabels[index - 1]}`,
      packageRelative: accessoryV2Root,
      acceptanceRelative: 'acceptance.json',
      candidateRelative: acceptedCandidate.candidate,
      expectedSha: acceptedCandidate.sha256,
    });
  });
  const preservedAcceptance = accessoryAcceptance.preserved_acc_eye_01_02;
  const preserved = [1, 2].map((index) => {
    const id = `${sex}-acc-eye-${String(index).padStart(2, '0')}`;
    const accepted = preservedAcceptance[id];
    if (!accepted) throw new Error(`preserved acc_eye acceptance missing: ${id}`);
    return acceptedV2Variant({
      sex,
      slot: 'acc_eye',
      id,
      label: `${sexLabel} eyewear ${String(index).padStart(2, '0')} ${index === 1 ? 'spectacles' : 'goggles'}`,
      packageRelative: accessoryV2Root,
      acceptanceRelative: 'acceptance.json',
      candidateRelative: accepted.path,
      expectedSha: accepted.sha256,
    });
  });
  const accEyeId = `${sex}-acc-eye-03`;
  const acceptedAccEye = accessoryAcceptance.candidates[accEyeId];
  slotsFor(sex).acc_eye.variants = [...preserved, acceptedV2Variant({
    sex,
    slot: 'acc_eye',
    id: accEyeId,
    label: `${sexLabel} eyewear 03 eye patch`,
    packageRelative: accessoryV2Root,
    acceptanceRelative: 'acceptance.json',
    candidateRelative: acceptedAccEye.candidate,
    expectedSha: acceptedAccEye.sha256,
  })];
  for (const slot of SLOT_SCHEMA.slots) {
    const entry = slotsFor(sex)[slot.id];
    if (entry.mode === 'fixed' && entry.variants.length > 1) entry.variants = entry.variants.slice(0, 1);
  }
}

// Final repair v3 supersedes the older registrations only for candidates explicitly listed by
// the normalized integration acceptance. Broad male acc_eye-01/02 rejects are never copied.
slotsFor('female').face_base.variants = [1, 2, 3].map((index) => acceptedV3Variant({
  sex: 'female', slot: 'face_base', id: `female-face-base-${String(index).padStart(2, '0')}`,
  label: `Female face base ${String(index).padStart(2, '0')} accepted final repair v3`,
}));
for (const sex of ['female', 'male']) {
  const sexLabel = sex === 'female' ? 'Female' : 'Male';
  slotsFor(sex).headgear.variants = [1, 2, 3].map((index) => acceptedV3Variant({
    sex, slot: 'headgear', id: `${sex}-headgear-${String(index).padStart(2, '0')}`,
    label: `${sexLabel} headgear ${String(index).padStart(2, '0')} accepted final repair v3`,
  }));
}
slotsFor('female').acc_eye.variants = [1, 2, 3].map((index) => acceptedV3Variant({
  sex: 'female', slot: 'acc_eye', id: `female-acc-eye-${String(index).padStart(2, '0')}`,
  label: `Female eyewear ${String(index).padStart(2, '0')} accepted final repair v3`,
}));
slotsFor('male').acc_eye.variants = [1, 2, 3].map((index) => acceptedV3Variant({
  sex: 'male', slot: 'acc_eye', id: `male-acc-eye-${String(index).padStart(2, '0')}`,
  label: `Male eyewear ${String(index).padStart(2, '0')} accepted final repair v3`,
}));
slotsFor('male').headgear_mid.variants[0] = acceptedV3Variant({
  sex: 'male', slot: 'headgear_mid', id: 'male-headgear-mid-03',
  label: 'Male headgear mid 03 accepted clean hood fold',
  companionOf: { slot: 'headgear', variant: 'male-headgear-03' },
});
slotsFor('male').clothes.variants[2] = acceptedV3Variant({
  sex: 'male', slot: 'clothes', id: 'male-clothes-03', label: 'Male garment 03 torso preserved final repair v3',
});
slotsFor('male').clothes_back.variants[2] = acceptedV3Variant({
  sex: 'male', slot: 'clothes_back', id: 'male-clothes-back-03', label: 'Male garment 03 accepted empty back plate',
  companionOf: { slot: 'clothes', variant: 'male-clothes-03' },
});
slotsFor('male').clothes_front.variants[0] = acceptedV3Variant({
  sex: 'male', slot: 'clothes_front', id: 'male-clothes-front-03', label: 'Male garment 03 accepted empty front plate',
  companionOf: { slot: 'clothes', variant: 'male-clothes-03' },
});

// The registry is the final publication seam. An accepted evidence package is included only when
// its acceptance record hash, status token, candidate hashes, slot mode and exact count all bind.
// This keeps newly approved slots from being silently omitted without scanning rejected evidence.
applyAcceptedEvidenceRegistry();

// Fresh target-fidelity review rejects face/eye families 02 and 03. Keep their evidence and
// physical plates for regression analysis, but never publish them as active selectable assets.
for (const sex of ['female', 'male']) for (const slot of ['face_base', 'mouth', 'nose', 'eyes_white', 'eyes_color', 'eyes_shape']) {
  slotsFor(sex)[slot].variants = slotsFor(sex)[slot].variants.filter((variant) => variant.id.endsWith('-01'));
}

// Publish hue-free, straight-alpha detail plates. The accepted colored candidates remain at their
// evidence paths and in curation lineage; only the production render plate is derived. Cheeks/chin
// are intentionally empty in the accepted foundations, so one empty companion safely serves all
// face bases without fabricating detail or support.
for (const sex of ['female', 'male']) {
  // face_base, mouth, nose, eyes_shape and eyes_color are one visible source-over family.
  // Converting mouth/nose/eyes to multiply introduced angular dark shading and doubled lines.
  for (const slot of ['cheeks', 'chin']) {
    const existing = slotsFor(sex)[slot].variants[0];
    const destination = join(PLATE_ROOT, sex, slot, `${sex}-${slot}-detail.png`);
    const sourcePath = join(ASSET_ROOT, existing.path);
    const result = deriveMultiplyPlate({ sourcePath, outputPath: destination, faceBasePath: join(ASSET_ROOT, slotsFor(sex).face_base.variants[0].path) });
    slotsFor(sex)[slot].variants = [{
      id: `${sex}-${slot}-detail`, label: `${sex} ${slot} intentionally empty multiply detail`,
      path: repoPath(destination).slice('GAME-REFERENCE/potray-generator/assets/v2/'.length), sha256: result.output_sha256,
      blend_mode: 'multiply', empty: true, intentionally_empty: true,
      companion_of: { slot: 'face_base', variants: slotsFor(sex).face_base.variants.map((variant) => variant.id) },
      source: 'derived-multiply-detail', sex,
      source_identity: {
        source_candidate: repoPath(sourcePath), source_candidate_sha256: fileSha(sourcePath),
        generating_script: repoPath(multiplyBuilderPath), generating_script_sha256: multiplyBuilderSha,
        lineage: existing.source_identity,
      },
      quality: existing.quality,
    }];
  }
}

for (const sex of ['female', 'male']) for (const entry of Object.values(slotsFor(sex))) for (const variant of entry.variants) {
  variant.minimum_contract = minimumContract(variant);
  for (const override of variant.render_overrides ?? []) override.minimum_contract = minimumContract({ ...override, sex });
}

// Slot components become valid only when the complete 1→4 gate chain is PASS. The quality
// pipeline writes workflow-status.json receipts; the builder binds them per variant so that
// validity is machine-derived, never hand-declared. Until gate 3/4 close, every component
// stays honestly provisional and delivery stays locked.
const PIPELINE_STATUS = join(REPO, '.omo/evidence/portrait-stage23/quality-pipeline-current/workflow-status.json');
const gateChain = (() => {
  if (!existsSync(PIPELINE_STATUS)) return { gates: null, receipt: null };
  const bytes = readFileSync(PIPELINE_STATUS);
  const status = JSON.parse(bytes);
  if (status?.version !== 1 || !status.gates) throw new Error('quality pipeline workflow-status schema error');
  return { gates: status.gates, receipt: { path: repoPath(PIPELINE_STATUS), sha256: sha256(bytes) } };
})();
const GATE_KEYS = ['gate1', 'gate2', 'gate3', 'gate4'];
const allGatesPassed = gateChain.gates && GATE_KEYS.every(key => gateChain.gates[key] === 'PASS');
const slotValidity = () => ({
  status: allGatesPassed ? 'verified' : 'provisional',
  policy: 'gates-1-4',
  gates: gateChain.gates,
  workflow_status_receipt: gateChain.receipt,
  ...(allGatesPassed ? {} : { reason: 'gate_chain_incomplete' }),
});
for (const sex of ['female', 'male']) for (const entry of Object.values(slotsFor(sex))) for (const variant of entry.variants) {
  variant.slot_validity = slotValidity();
  for (const override of variant.render_overrides ?? []) override.slot_validity = slotValidity();
}

const original = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const manifest = {
  ...generated,
  built_by: TOOL_ID,
  minimum_contract_policy: 'required',
  slot_validity_policy: 'gates-1-4',
  quality_acceptance: 'NOT VERIFIED',
  quality_note: 'Hash-bound accepted evidence, logical bundles, multiply facial-detail derivatives, and conditional render members are integrated deterministically. Rejected, superseded, and unreviewed candidates remain visible in the Gate 4 curation catalog but are not production-selectable. Whole-library visual acceptance remains NOT VERIFIED until user curation is bound.',
  provenance: {
    ...original.provenance,
    kind: 'accepted-gate1-foundations-plus-hash-bound-g2-final-repair-v3',
    target_sha256: 'c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9',
    art_approval: false,
    owner_variant_target: 'all-minimum-contract-pass-candidates',
    owner_decision_date: '2026-09-16',
    original_contract_target: 10,
    original_contract_record: '.omo/evidence/portrait-stage23/gate2-aggregate-preflight/aggregate-preflight.json',
    limitation: 'Production selection is limited to the latest hash-bound accepted registry and bundle contracts. Rejected, superseded, ambiguous, and unreviewed candidates are retained only in the Gate 4 curation catalog until user feedback and validation evidence authorize a later integration.',
    repair_v3_integration_acceptance: repoPath(V3_INTEGRATION_ACCEPTANCE),
    repair_v3_integration_acceptance_sha256: fileSha(V3_INTEGRATION_ACCEPTANCE),
    repair_v3_accepted_candidates: Object.keys(v3Acceptance.accepted),
    repair_v3_excluded_candidates: Object.keys(v3Acceptance.excluded),
    accepted_evidence_registry: repoPath(ACCEPTED_EVIDENCE_REGISTRY),
    accepted_evidence_registry_sha256: fileSha(ACCEPTED_EVIDENCE_REGISTRY),
    repair_v2_face_acceptance: repoPath(faceAcceptancePath),
    repair_v2_face_acceptance_sha256: fileSha(faceAcceptancePath),
    repair_v2_accessory_acceptance: repoPath(accessoryAcceptancePath),
    repair_v2_accessory_acceptance_sha256: fileSha(accessoryAcceptancePath),
    integration_acceptance_binding: repoPath(V2_INTEGRATION_ACCEPTANCE),
    integration_acceptance_binding_sha256: fileSha(V2_INTEGRATION_ACCEPTANCE),
    integration_script: repoPath(scriptPath),
    integration_script_sha256: scriptSha,
    male_foundation_source_sha256: '2aea293dbf8b2aced6ec17dc6d81daf4b040942a2179dbc2e42d0e2b2873fc04',
    female_foundation_source_sha256: '341e2d99d91f6a40bfc6c6e2a2123b35cac5c1e1e56b1043d5491a7310c9c13c',
  },
};
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ manifest: repoPath(MANIFEST), sha256: fileSha(MANIFEST), script_sha256: scriptSha }, null, 2));
