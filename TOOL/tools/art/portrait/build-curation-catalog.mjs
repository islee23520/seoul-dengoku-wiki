#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { decodePng } from './portrait-layer-composite.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO = resolve(HERE, '../../..');
const DEFAULT_OUTPUT = 'GAME-REFERENCE/potray-generator/assets/v2/curation-catalog.json';
const STATUS_ORDER = { accepted: 0, rejected: 1, superseded: 2, unreviewed: 3 };
const CANONICAL_SLOTS = new Set([
  'bg', 'clothes_back', 'headgear_back', 'hair_back', 'beard_back', 'face_base', 'neck',
  'cheeks', 'chin', 'mouth', 'nose', 'eyes_white', 'eyes_color', 'eyes_shape', 'ears', 'clothes',
  'headgear_mid', 'beard', 'hair', 'clothes_front', 'headgear', 'acc_eye', 'frame',
]);
const QA_PATH_PARTS = [
  '/crops/', '/contact/', '/contacts/', '/isolates/', '/masks/', '/verification/', '/review/',
  '/composites/', '/previews/', '/provider/', '/raw/', '/qa/', '/references/', '/screenshots/',
];
const QA_NAME_PARTS = ['on-gray', 'on-white', 'on-black', 'contact-sheet', 'triptych', 'reconstruction', 'diff', 'overlay', 'coverage'];
const VISUAL_REJECTION_RECEIPT = '.omo/evidence/eye-target-vision-20260917/family-02-03-rejection.json';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const posix = (path) => path.split(sep).join('/');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function repoRelative(repo, path) {
  return posix(relative(repo, path));
}

export function boundPath(repoRoot, relativePath, expectedSha256 = null) {
  if (typeof relativePath !== 'string' || !relativePath || relativePath.startsWith('/') || relativePath.includes('\0')) {
    throw new Error(`invalid repository path: ${relativePath}`);
  }
  const repo = realpathSync(resolve(repoRoot));
  const path = resolve(repo, relativePath);
  const rel = relative(repo, path);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) throw new Error(`path escapes repository: ${relativePath}`);
  let cursor = repo;
  for (const part of rel.split(sep).filter(Boolean)) {
    cursor = resolve(cursor, part);
    if (!existsSync(cursor)) throw new Error(`bound file missing: ${relativePath}`);
    if (lstatSync(cursor).isSymbolicLink()) throw new Error(`symlink forbidden: ${relativePath}`);
  }
  if (!statSync(path).isFile() || !((actual => actual === repo || actual.startsWith(`${repo}${sep}`))(realpathSync(path)))) throw new Error(`bound file missing: ${relativePath}`);
  const digest = sha256(readFileSync(path));
  if (expectedSha256 && digest !== expectedSha256) throw new Error(`hash drift: ${relativePath}`);
  return { path, digest };
}

function hasAlpha(path) {
  const decoded = decodePng(readFileSync(path));
  for (let index = 3; index < decoded.pixels.length; index += 4) if (decoded.pixels[index] !== 0) return true;
  return false;
}

function inspectCandidateImage(path) {
  try {
    return { alphaVisible: hasAlpha(path), browserDecodable: true, notes: [] };
  } catch (error) {
    return { alphaVisible: false, browserDecodable: false, notes: [`PNG decode unsupported: ${error.message}`] };
  }
}

function walkPngs(root) {
  const results = [];
  const visit = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      if (lstatSync(path).isSymbolicLink()) throw new Error(`symlink forbidden in candidate discovery: ${repoRelative(root, path)}`);
      if (statSync(path).isDirectory()) visit(path);
      else if (extname(name).toLowerCase() === '.png') results.push(path);
    }
  };
  visit(root);
  return results;
}

function logicalIdFromPath(path) {
  return path.slice(0, -4).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function productionIndex(manifest) {
  const byPath = new Map();
  const companions = new Map();
  const primaries = new Map();
  for (const [sex, sexEntry] of Object.entries(manifest.sexes)) {
    for (const [slot, slotEntry] of Object.entries(sexEntry.slots)) {
      for (const variant of slotEntry.variants) {
        const record = { sex, slot, variant };
        byPath.set(variant.path, record);
        primaries.set(`${sex}\0${slot}\0${variant.id}`, record);
        if (variant.companion_of) {
          const owners = variant.companion_of.variants ?? [variant.companion_of.variant];
          for (const owner of owners) {
            const key = `${sex}\0${variant.companion_of.slot}\0${owner}`;
            if (!companions.has(key)) companions.set(key, []);
            companions.get(key).push(record);
          }
        }
        for (const override of variant.render_overrides ?? []) byPath.set(override.path, { sex, slot: `${slot}_overrides`, variant, override });
      }
    }
  }
  return { byPath, companions, primaries };
}

function productionRecords(repo, manifest) {
  const assetRoot = join(repo, manifest.path_base);
  const plateRoot = join(assetRoot, 'plates');
  const index = productionIndex(manifest);
  const groups = new Map();
  const facts = walkPngs(plateRoot).map((path) => {
    const webPath = repoRelative(assetRoot, path);
    const segments = webPath.split('/');
    if (segments.length < 4 || segments[0] !== 'plates') throw new Error(`unexpected production plate path: ${webPath}`);
    const bytes = readFileSync(path);
    const digest = sha256(bytes);
    const bound = index.byPath.get(webPath);
    if (bound) {
      const expected = bound.override?.sha256 ?? bound.variant.sha256;
      if (digest !== expected) throw new Error(`production hash drift: ${webPath}`);
    }
    return { path, webPath, segments, sex: segments[1], slot: segments[2], digest, bound };
  });
  const replacementIdentity = new Map();
  for (const fact of facts) {
    if (!fact.bound || fact.bound.override) continue;
    replacementIdentity.set(`${fact.sex}\0${fact.slot}\0${fact.digest}`, fact.bound.variant.id);
  }
  for (const fact of facts) {
    const { path, webPath, segments, sex, slot, digest, bound } = fact;
    const baseReplacement = !bound && segments.at(-1) === `${slot}-base.png`
      ? replacementIdentity.get(`${sex}\0${slot}\0${digest}`)
      : null;
    const logicalIdentity = bound?.variant.id ?? baseReplacement ?? logicalIdFromPath(segments.at(-1));
    const key = `${sex}\0${slot}\0${digest}\0${logicalIdentity}`;
    let record = groups.get(key);
    if (!record) {
      const variant = bound?.variant;
      const isOverride = Boolean(bound?.override);
      record = {
        id: `production:${sex}:${slot}:${variant?.id ?? logicalIdFromPath(segments.at(-1))}:${digest.slice(0, 12)}`,
        kind: isOverride ? 'conditional-render-member' : 'production-plate',
        sex,
        slot,
        logical_id: variant?.id ?? logicalIdFromPath(segments.at(-1)),
        status: bound ? 'accepted' : 'unreviewed',
        status_source: bound
          ? (bound.override?.source_identity?.acceptance_record ?? variant.source_identity?.acceptance_record ?? variant.source_identity?.plate ?? manifest.provenance?.accepted_evidence_registry ?? 'GAME-REFERENCE/potray-generator/assets/v2/library.json')
          : 'production-inventory:no-explicit-status-binding',
        sha256: digest,
        source_paths: [],
        web_path: webPath,
        alpha_visible: hasAlpha(path),
        browser_decodable: true,
        blend_mode: bound?.override?.blend_mode ?? bound?.variant?.blend_mode ?? 'source-over',
        visible_card: hasAlpha(path) && !isOverride,
        metadata_only: !hasAlpha(path) || isOverride,
        render_members: [],
        artifact_class: 'candidate',
        contract_pass: Boolean(bound),
        baseline_role: bound ? 'current_production' : 'none',
        status_receipt: bound
          ? (bound.override?.source_identity?.acceptance_record ?? variant.source_identity?.acceptance_record ?? null)
          : null,
        acceptance_receipt: bound
          ? (bound.override?.source_identity?.acceptance_record ?? variant.source_identity?.acceptance_record ?? null)
          : null,
        receipt_resolution: bound ? 'exact_path' : 'none',
      };
      groups.set(key, record);
    }
    record.source_paths.push(repoRelative(repo, path));
  }

  const records = [...groups.values()];
  const byLogical = new Map(records.map((record) => [`${record.sex}\0${record.slot}\0${record.logical_id}`, record]));
  for (const [key, primary] of index.primaries) {
    const target = byLogical.get(key);
    if (!target) continue;
    const members = [target];
    for (const companion of index.companions.get(key) ?? []) {
      const member = byLogical.get(`${companion.sex}\0${companion.slot}\0${companion.variant.id}`);
      if (member) members.push(member);
    }
    for (const override of primary.variant.render_overrides ?? []) {
      const member = records.find((candidate) => candidate.source_paths.some((path) => path.endsWith(override.path)));
      if (member) members.push(member);
    }
    target.bundle = ['hair', 'clothes', 'headgear'].includes(primary.slot) ? primary.slot : primary.slot === 'face_base' ? 'face_shape' : undefined;
    target.render_members = [...new Set(members.map((member) => member.id))].sort();
  }
  for (const record of records) {
    record.source_paths.sort();
    if (!record.render_members.length) record.render_members = [record.id];
    if (record.bundle === undefined) delete record.bundle;
  }
  return { records, physicalCount: facts.length, deduplicatedCount: records.length };
}

function candidateRecord(repo, spec) {
  const { path, digest } = boundPath(repo, spec.path, spec.sha256);
  const image = inspectCandidateImage(path);
  return {
    id: `candidate:${spec.sex ?? 'unknown'}:${spec.slot ?? 'unknown'}:${spec.logical_id}:${digest.slice(0, 12)}`,
    kind: 'evidence-candidate',
    sex: spec.sex ?? null,
    slot: spec.slot ?? null,
    logical_id: spec.logical_id,
    status: spec.status,
    status_source: spec.status_source,
    sha256: digest,
    source_paths: [spec.path],
    web_path: null,
    alpha_visible: image.alphaVisible,
    browser_decodable: image.browserDecodable,
    blend_mode: spec.blend_mode ?? 'source-over',
    visible_card: image.alphaVisible && image.browserDecodable,
    metadata_only: !image.alphaVisible || !image.browserDecodable,
    render_members: [],
    artifact_class: 'candidate',
    contract_pass: spec.contract_pass === true,
    baseline_role: spec.baseline_role ?? (spec.contract_pass === true ? 'contract_pass_baseline' : 'none'),
    status_receipt: spec.status_receipt ?? spec.status_source ?? null,
    acceptance_receipt: spec.acceptance_receipt ?? (spec.contract_pass === true ? spec.status_source : null),
    receipt_resolution: spec.receipt_resolution ?? 'exact_path',
    notes: image.notes,
  };
}

function addCandidate(map, repo, spec) {
  const record = candidateRecord(repo, spec);
  const key = `${record.sex}\0${record.slot}\0${record.logical_id}\0${record.sha256}`;
  const existing = map.get(key);
  if (!existing) map.set(key, record);
  else {
    existing.source_paths = [...new Set([...existing.source_paths, ...record.source_paths])].sort();
    if (STATUS_ORDER[record.status] < STATUS_ORDER[existing.status]) {
      existing.status = record.status;
      existing.status_source = record.status_source;
    }
    existing.contract_pass ||= record.contract_pass;
    if (record.baseline_role === 'current_production' || (record.baseline_role === 'contract_pass_baseline' && existing.baseline_role === 'none')) {
      existing.baseline_role = record.baseline_role;
    }
    existing.status_receipt ??= record.status_receipt;
    existing.acceptance_receipt ??= record.acceptance_receipt;
  }
}

function v2FaceCandidates(repo, currentByLogical, candidates) {
  const recordPath = '.omo/evidence/portrait-stage23/g2-art-repair-v2/acceptance.json';
  const record = readJson(boundPath(repo, recordPath).path);
  if (record.status !== 'PASS' || record.candidateCount !== record.candidates.length) throw new Error('invalid v2 face acceptance record');
  for (const candidate of record.candidates) {
    const logicalId = `${candidate.sex}-${candidate.slot.replaceAll('_', '-')}-${String(candidate.variant).padStart(2, '0')}`;
    const current = currentByLogical.get(`${candidate.sex}\0${candidate.slot}\0${logicalId}`);
    addCandidate(candidates, repo, {
      sex: candidate.sex, slot: candidate.slot, logical_id: logicalId,
      path: `.omo/evidence/portrait-stage23/g2-art-repair-v2/${candidate.path}`,
      sha256: candidate.sha256,
      status: current?.sha256 === candidate.sha256 ? 'accepted' : 'superseded',
      status_source: recordPath,
      contract_pass: true,
      baseline_role: current?.sha256 === candidate.sha256 ? 'current_production' : 'contract_pass_baseline',
    });
  }
}

function v2AccessoryCandidates(repo, currentByLogical, candidates) {
  const recordPath = '.omo/evidence/portrait-stage23/g2-art-repair-v2/accessories/acceptance.json';
  const record = readJson(boundPath(repo, recordPath).path);
  if (record.status !== 'PASS2_EIGHT_REPLACEMENT_CANDIDATES_ACCEPTED') throw new Error('invalid v2 accessory acceptance record');
  const packageRoot = '.omo/evidence/portrait-stage23/g2-art-repair-v2/accessories';
  const specs = [];
  for (const [logicalId, candidate] of Object.entries(record.candidates)) {
    const sex = logicalId.startsWith('female-') ? 'female' : 'male';
    const slot = logicalId.includes('headgear') ? 'headgear' : 'acc_eye';
    specs.push({ logicalId, sex, slot, path: `${packageRoot}/${candidate.candidate}`, sha256: candidate.sha256 });
  }
  for (const [logicalId, candidate] of Object.entries(record.preserved_acc_eye_01_02)) {
    specs.push({ logicalId, sex: logicalId.startsWith('female-') ? 'female' : 'male', slot: 'acc_eye', path: `${packageRoot}/${candidate.path}`, sha256: candidate.sha256 });
  }
  for (const spec of specs) {
    const current = currentByLogical.get(`${spec.sex}\0${spec.slot}\0${spec.logicalId}`);
    addCandidate(candidates, repo, {
      sex: spec.sex, slot: spec.slot, logical_id: spec.logicalId, path: spec.path, sha256: spec.sha256,
      status: current?.sha256 === spec.sha256 ? 'accepted' : 'superseded', status_source: recordPath,
      contract_pass: true,
      baseline_role: current?.sha256 === spec.sha256 ? 'current_production' : 'contract_pass_baseline',
    });
  }
}

function v3Candidates(repo, currentByLogical, candidates) {
  const recordPath = '.omo/evidence/portrait-stage23/g2-final-repair-v3/integration/acceptance-binding.json';
  const record = readJson(boundPath(repo, recordPath).path);
  if (record.status !== 'LEAD_ACCEPTED_G2_FINAL_REPAIR_V3') throw new Error('invalid v3 acceptance binding');
  for (const [logicalId, candidate] of Object.entries(record.accepted)) {
    const sex = logicalId.startsWith('female-') ? 'female' : 'male';
    const slot = logicalId.replace(`${sex}-`, '').replace(/-\d\d$/, '').replaceAll('-', '_');
    const current = currentByLogical.get(`${sex}\0${slot}\0${logicalId}`);
    addCandidate(candidates, repo, { sex, slot, logical_id: logicalId, path: candidate.candidate, sha256: candidate.sha256, status: current?.sha256 === candidate.sha256 ? 'accepted' : 'superseded', status_source: recordPath, contract_pass: true, baseline_role: current?.sha256 === candidate.sha256 ? 'current_production' : 'contract_pass_baseline' });
  }
  for (const [logicalId, candidate] of Object.entries(record.excluded)) {
    const sex = logicalId.includes('female') ? 'female' : 'male';
    const slot = logicalId.includes('acc-eye') ? 'acc_eye' : logicalId.includes('headgear') ? 'headgear_mid' : logicalId.includes('clothes-back') ? 'clothes_back' : 'clothes_front';
    addCandidate(candidates, repo, { sex, slot, logical_id: logicalId, path: candidate.candidate, sha256: candidate.sha256, status: 'rejected', status_source: recordPath });
  }
}

function registeredAcceptedCandidates(repo, manifest, candidates) {
  for (const [sex, sexEntry] of Object.entries(manifest.sexes)) {
    for (const [slot, slotEntry] of Object.entries(sexEntry.slots)) {
      for (const variant of slotEntry.variants) {
        const identity = variant.source_identity ?? {};
        if (identity.candidate && identity.candidate_sha256) addCandidate(candidates, repo, {
          sex, slot, logical_id: variant.id, path: identity.candidate, sha256: identity.candidate_sha256,
          status: 'accepted', status_source: identity.acceptance_record ?? 'GAME-REFERENCE/potray-generator/assets/v2/library.json',
          contract_pass: true, baseline_role: 'current_production',
        });
        for (const override of variant.render_overrides ?? []) {
          const source = override.source_identity ?? {};
          if (source.candidate && source.candidate_sha256) addCandidate(candidates, repo, {
            sex, slot: `${slot}_overrides`, logical_id: `${variant.id}__${override.when.variant}`,
            path: source.candidate, sha256: source.candidate_sha256, status: 'accepted',
            status_source: source.acceptance_record ?? 'GAME-REFERENCE/potray-generator/assets/v2/library.json',
            contract_pass: true, baseline_role: 'current_production',
          });
        }
      }
    }
  }
}

function candidateIntent(path) {
  const normalized = posix(path);
  const lower = normalized.toLowerCase();
  const isFinalSlot = /\/final\/slots\/[^/]+\.png$/.test(lower);
  const marker = ['/candidate/', '/candidates/', '/final/slots/', '/plates/z', '/inputs/preserved', '/fallback-selected/']
    .some(part => lower.includes(part)) || basename(lower, '.png').includes('-candidate');
  if (!marker) return false;
  if (isFinalSlot) return true;
  if (QA_PATH_PARTS.some(part => lower.includes(part))) return false;
  return !QA_NAME_PARTS.some(part => basename(lower).includes(part));
}

function inferredSex(path) {
  const lower = posix(path).toLowerCase();
  if (/(?:^|[/_-])female(?:[/_.-]|$)/.test(lower)) return 'female';
  if (/(?:^|[/_-])male(?:[/_.-]|$)/.test(lower)) return 'male';
  return null;
}

function inferredSlot(path) {
  const normalized = posix(path).toLowerCase();
  const stem = basename(normalized, '.png').replaceAll('-', '_');
  if (CANONICAL_SLOTS.has(stem)) return stem;
  const parts = normalized.split('/').map(part => part.replaceAll('-', '_'));
  for (const slot of [...CANONICAL_SLOTS].sort((a, b) => b.length - a.length)) {
    if (parts.includes(slot) || stem.includes(slot)) return slot;
  }
  return null;
}

function primarySlot(slot) {
  if (['clothes_back', 'clothes_front'].includes(slot)) return 'clothes';
  if (slot === 'hair_back') return 'hair';
  if (['headgear_back', 'headgear_mid'].includes(slot)) return 'headgear';
  return slot;
}

function inferredLogicalId(path, sex, slot) {
  const lower = posix(path).toLowerCase();
  const stem = basename(lower, '.png').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (/^(?:female|male)-/.test(stem) && !CANONICAL_SLOTS.has(stem.replaceAll('-', '_'))) return stem;
  const variant = [...lower.matchAll(/variant[-_]?0*(\d+)/g)].at(-1)?.[1]
    ?? stem.match(/(?:^|-)0*(\d+)(?:-|$)/)?.[1]
    ?? null;
  const owner = primarySlot(slot ?? 'candidate').replaceAll('_', '-');
  return `${sex ?? 'unknown'}-${owner}${variant ? `-${String(Number(variant)).padStart(2, '0')}` : `-${stem}`}`;
}

function nearestReceipt(repo, candidatePath) {
  const stageRoot = resolve(repo, '.omo/evidence/portrait-stage23');
  const names = ['acceptance-binding.json', 'acceptance.json', 'FINAL-VERDICT.json', 'final-verdict.json', 'verdict.json', 'STATUS.md', 'status.json'];
  let directory = dirname(candidatePath);
  while (directory === stageRoot || directory.startsWith(`${stageRoot}${sep}`)) {
    for (const name of names) {
      const receipt = join(directory, name);
      if (existsSync(receipt) && statSync(receipt).isFile()) return repoRelative(repo, receipt);
    }
    if (directory === stageRoot) break;
    directory = dirname(directory);
  }
  return null;
}

export function discoverStage23CandidatePaths(repoRoot = DEFAULT_REPO) {
  const repo = realpathSync(resolve(repoRoot));
  const stageRoot = join(repo, '.omo/evidence/portrait-stage23');
  return walkPngs(stageRoot).filter(candidateIntent).map(path => repoRelative(repo, path)).sort();
}

function stage23InventoryCandidates(repo, candidates) {
  for (const relativePath of discoverStage23CandidatePaths(repo)) {
    const path = join(repo, relativePath);
    const digest = sha256(readFileSync(path));
    const sex = inferredSex(relativePath);
    const slot = inferredSlot(relativePath);
    const archived = /\/(?:archive|prior-|stale-|superseded-)/i.test(posix(relativePath));
    const rejected = /\/rejects?\//i.test(posix(relativePath));
    const receipt = nearestReceipt(repo, path);
    addCandidate(candidates, repo, {
      sex,
      slot,
      logical_id: inferredLogicalId(relativePath, sex, slot),
      path: relativePath,
      sha256: digest,
      status: rejected ? 'rejected' : archived ? 'superseded' : 'unreviewed',
      status_source: receipt ?? 'stage23-inventory:no-authoritative-receipt',
      status_receipt: receipt,
      receipt_resolution: receipt ? 'fallback' : 'none',
      contract_pass: false,
      baseline_role: 'none',
    });
  }
}

function assignEvidenceBundles(records) {
  const bundleFor = slot => ['clothes', 'clothes_back', 'clothes_front'].includes(slot) ? 'clothes'
    : ['hair', 'hair_back'].includes(slot) ? 'hair'
      : ['headgear', 'headgear_back', 'headgear_mid'].includes(slot) ? 'headgear'
        : ['face_base', 'cheeks', 'chin'].includes(slot) ? 'face_shape' : null;
  const groups = new Map();
  for (const record of records.filter(record => record.kind === 'evidence-candidate')) {
    const bundle = bundleFor(record.slot);
    if (!bundle) continue;
    record.bundle = bundle;
    const key = `${record.sex}\0${record.logical_id}\0${dirname(record.source_paths[0])}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  for (const group of groups.values()) {
    const ids = group.map(record => record.id).sort();
    for (const record of group) record.render_members = ids;
  }
  for (const record of records) if (!record.render_members.length) record.render_members = [record.id];
}

function applyFreshVisualRejections(repo, records) {
  const receipt = readJson(boundPath(repo, VISUAL_REJECTION_RECEIPT).path);
  if (receipt.status !== 'VISUAL_REJECTED' || !Array.isArray(receipt.rejected)) throw new Error('visual rejection receipt malformed');
  const rejected = new Set(receipt.rejected);
  for (const record of records) {
    const key = `${record.sex}/${record.slot}/${record.logical_id}`;
    if (!rejected.has(key)) continue;
    record.status = 'rejected';
    record.status_source = VISUAL_REJECTION_RECEIPT;
    record.status_receipt = VISUAL_REJECTION_RECEIPT;
    record.acceptance_receipt = null;
    record.receipt_resolution = 'exact_path';
    record.contract_pass = false;
    record.baseline_role = 'none';
  }
}

function inventoryCandidates(repo, candidates) {
  const recordPath = '.omo/evidence/portrait-stage23/provenance/current-candidate-audit.json';
  const record = readJson(boundPath(repo, recordPath).path);
  for (const candidate of record.selected_candidates_and_scaffolds) addCandidate(candidates, repo, {
    sex: candidate.sex, slot: candidate.slot, logical_id: candidate.id, path: candidate.path, sha256: candidate.sha256,
    status: 'unreviewed', status_source: recordPath,
  });
}

function ledgerCandidates(repo, candidates) {
  const recordPath = '.omo/evidence/portrait-stage23/quality-floor-review/ledger.json';
  const record = readJson(boundPath(repo, recordPath).path);
  const pathsByHash = new Map();
  for (const path of walkPngs(join(repo, '.omo/evidence/portrait-stage23/pilot'))) {
    const digest = sha256(readFileSync(path));
    if (!pathsByHash.has(digest)) pathsByHash.set(digest, repoRelative(repo, path));
  }
  for (const [sex, sexEntry] of Object.entries(record.sexes)) {
    for (const slotEntry of sexEntry.slots) {
      const rejected = /failing|rejected/.test(slotEntry.classification);
      for (const candidate of slotEntry.candidates ?? []) {
        const path = pathsByHash.get(candidate.sha256);
        if (!path) throw new Error(`ledger candidate missing for hash: ${candidate.sha256}`);
        addCandidate(candidates, repo, {
          sex, slot: slotEntry.slot, logical_id: candidate.id, path, sha256: candidate.sha256,
          status: rejected ? 'rejected' : 'unreviewed', status_source: recordPath,
        });
      }
      for (const lineage of slotEntry.lineages ?? []) {
        const path = pathsByHash.get(lineage.sha256);
        if (!path) throw new Error(`ledger lineage missing for hash: ${lineage.sha256}`);
        addCandidate(candidates, repo, {
          sex, slot: slotEntry.slot, logical_id: lineage.id, path, sha256: lineage.sha256,
          status: lineage.classification.includes('rejected') ? 'rejected' : 'unreviewed', status_source: recordPath,
        });
      }
    }
  }
}

function copyCandidates(repo, outputPath, records) {
  const outputDirectory = dirname(outputPath);
  const curationDirectory = join(outputDirectory, 'curation');
  rmSync(curationDirectory, { recursive: true, force: true });
  mkdirSync(curationDirectory, { recursive: true });
  for (const record of records) {
    if (record.kind !== 'evidence-candidate') continue;
    const source = boundPath(repo, record.source_paths[0], record.sha256).path;
    const name = `${record.sha256}.png`;
    const destination = join(curationDirectory, name);
    if (!existsSync(destination)) copyFileSync(source, destination);
    if (sha256(readFileSync(destination)) !== record.sha256) throw new Error(`curation copy hash drift: ${name}`);
    record.web_path = `curation/${name}`;
  }
}

export function buildCurationCatalog({ repoRoot = DEFAULT_REPO, output = DEFAULT_OUTPUT, write = true } = {}) {
  const repo = realpathSync(resolve(repoRoot));
  const manifestPath = 'GAME-REFERENCE/potray-generator/assets/v2/library.json';
  const manifestBinding = boundPath(repo, manifestPath);
  const manifest = readJson(manifestBinding.path);
  const production = productionRecords(repo, manifest);
  const currentByLogical = new Map(production.records.map((record) => [`${record.sex}\0${record.slot}\0${record.logical_id}`, record]));
  const candidates = new Map();
  registeredAcceptedCandidates(repo, manifest, candidates);
  v2FaceCandidates(repo, currentByLogical, candidates);
  v2AccessoryCandidates(repo, currentByLogical, candidates);
  v3Candidates(repo, currentByLogical, candidates);
  inventoryCandidates(repo, candidates);
  ledgerCandidates(repo, candidates);
  stage23InventoryCandidates(repo, candidates);

  const records = [...production.records, ...candidates.values()].sort((left, right) => left.id.localeCompare(right.id));
  assignEvidenceBundles(records);
  applyFreshVisualRejections(repo, records);
  const outputPath = resolve(repo, output);
  if (outputPath !== repo && !outputPath.startsWith(`${repo}${sep}`)) throw new Error(`output escapes repository: ${output}`);
  copyCandidates(repo, outputPath, records);
  const statuses = Object.fromEntries(['accepted', 'rejected', 'superseded', 'unreviewed'].map((status) => [status, records.filter((record) => record.status === status).length]));
  const catalog = {
    version: 1,
    built_by: 'TOOL/tools/art/portrait/build-curation-catalog.mjs',
    source_manifest: { path: manifestPath, sha256: manifestBinding.digest },
    discovery_receipts: [
      '.omo/evidence/portrait-stage23/provenance/current-candidate-audit.json',
      '.omo/evidence/portrait-stage23/quality-floor-review/ledger.json',
      '.omo/evidence/portrait-stage23/g2-art-repair-v2/acceptance.json',
      '.omo/evidence/portrait-stage23/g2-art-repair-v2/accessories/acceptance.json',
      '.omo/evidence/portrait-stage23/g2-final-repair-v3/integration/acceptance-binding.json',
    ],
    counts: {
      discovered_production_source_paths: production.physicalCount,
      physical_production_pngs: production.deduplicatedCount,
      evidence_candidate_records: candidates.size,
      total_records: records.length,
      statuses,
      visible_cards: records.filter((record) => record.visible_card).length,
      metadata_only: records.filter((record) => record.metadata_only).length,
      stage23_pngs: walkPngs(join(repo, '.omo/evidence/portrait-stage23')).length,
      stage23_candidate_paths: discoverStage23CandidatePaths(repo).length,
      contract_pass: records.filter((record) => record.contract_pass).length,
      baseline_roles: Object.fromEntries(['current_production', 'contract_pass_baseline', 'none']
        .map(role => [role, records.filter(record => record.baseline_role === role).length])),
    },
    records,
  };
  catalog.sha256 = sha256(Buffer.from(JSON.stringify(catalog)));
  if (write) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
  }
  return catalog;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--repo-root') options.repoRoot = argv[++index];
    else if (argv[index] === '--output') options.output = argv[++index];
    else throw new Error(`unknown argument: ${argv[index]}`);
  }
  return options;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const catalog = buildCurationCatalog(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(catalog.counts, null, 2));
}
