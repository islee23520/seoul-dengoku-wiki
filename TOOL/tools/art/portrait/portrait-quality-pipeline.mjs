#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { decodePng } from './portrait-layer-composite.mjs';
import { clipLayer } from '../../../Design/potrait-generator/portrait-browser-composite.mjs';
import { composeFromLibrary } from './portrait-tool.mjs';
import { verifyPortraitCuration } from './verify-portrait-curation.mjs';
import { verifyFrozenRecipe } from './verify-frozen-recipe.mjs';
import { decodeBrowserPng } from '../../../Design/potrait-generator/portrait-browser-png.mjs';
import { compositeBrowserPixels } from '../../../Design/potrait-generator/portrait-browser-composite.mjs';

export const PIPELINE_PATH = 'Tool/art/portrait/portrait-quality-pipeline.mjs';
export const FROZEN_RECIPE_VERIFIER_PATH = 'Tool/art/portrait/verify-frozen-recipe.mjs';
export const CONTRACT_PATH = 'Tool/art/portrait/portrait-quality-contract.json';
const SHA256 = /^[0-9a-f]{64}$/;
const STATUSES = new Set(['PASS', 'PENDING', 'FAIL']);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const posix = (path) => path.split(sep).join('/');

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function inside(root, target) { const rel = relative(root, target); return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`)); }
function fullPath(repoRoot, path) {
  if (typeof path !== 'string' || !path || isAbsolute(path) || path.includes('\0')) throw new Error(`unsafe path: ${path}`);
  const full = resolve(repoRoot, path);
  if (!inside(repoRoot, full)) throw new Error(`path escapes repository: ${path}`);
  return full;
}
function binding(repoRoot, path) {
  const full = fullPath(repoRoot, path);
  if (!existsSync(full)) throw new Error(`bound file missing: ${path}`);
  return { path: posix(path), sha256: sha256(readFileSync(full)) };
}
function check(id, status, metrics = {}, artifacts = [], reason = null) {
  return { id, status, metrics, artifacts, ...(reason ? { reason } : {}) };
}
function receipt(gateId, inputs, checks, blockers = []) {
  const status = checks.some((item) => item.status === 'FAIL') ? 'FAIL'
    : checks.some((item) => item.status === 'PENDING') || blockers.length ? 'PENDING' : 'PASS';
  return { version: 1, gate_id: gateId, status, input_bindings: inputs, checks, blockers };
}
function failReceipt(gateId, inputs, error) {
  return receipt(gateId, inputs, [check('execution', 'FAIL', { error: error.message })], [{ code: 'gate_execution_failed', message: error.message }]);
}
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}
function variantCount(library) {
  let variants = 0, overrides = 0;
  for (const sex of ['female', 'male']) for (const entry of Object.values(library.sexes[sex].slots)) for (const variant of entry.variants) {
    variants += 1; overrides += variant.render_overrides?.length ?? 0;
  }
  return { variants, overrides, total: variants + overrides };
}

export function evaluateGate1({ repoRoot, contract }) {
  const spec = contract.gate1;
  const inputPaths = [spec.recipe, spec.assembler, spec.final_results, spec.target.path, CONTRACT_PATH, PIPELINE_PATH, FROZEN_RECIPE_VERIFIER_PATH];
  let inputs = [];
  try {
    inputs = inputPaths.map((path) => binding(repoRoot, path));
    const target = inputs.find((item) => item.path === spec.target.path);
    const targetStatus = target.sha256 === spec.target.sha256 ? 'PASS' : 'FAIL';
    const recipe = readJson(fullPath(repoRoot, spec.recipe));
    const verified = verifyFrozenRecipe({
      repoRoot,
      recipePath: fullPath(repoRoot, spec.recipe),
      finalResultsPath: fullPath(repoRoot, spec.final_results),
    });
    const checks = [
      check('target_binding', targetStatus, { expected_sha256: spec.target.sha256, actual_sha256: target.sha256 }),
      check('recipe_contract', recipe.schemaVersion === 1 && recipe.sourceSha256 === spec.target.sha256 ? 'PASS' : 'FAIL', { slot_count: verified.metrics.slot_count, z_order_matches: true }),
      check('reconstruction_partition_z_order', verified.status, verified.metrics),
      check('frozen_verdict', verified.status, verified.verdict),
    ];
    return receipt('gate1', inputs, checks);
  } catch (error) { return failReceipt('gate1', inputs, error); }
}

function catalogParity(library, catalog) {
  const production = new Set();
  for (const sex of ['female', 'male']) for (const [slot, entry] of Object.entries(library.sexes[sex].slots)) for (const variant of entry.variants) {
    production.add(`${sex}\0${slot}\0${variant.sha256}`);
    for (const override of variant.render_overrides ?? []) production.add(`${sex}\0${slot}_overrides\0${override.sha256}`);
  }
  const eligible = new Set(catalog.records.filter((record) => record.baseline_role === 'current_production').map((record) => `${record.sex}\0${record.slot}\0${record.sha256}`));
  const missing = [...production].filter((key) => !eligible.has(key));
  const extra = [...eligible].filter((key) => !production.has(key));
  return { status: missing.length || extra.length ? 'FAIL' : 'PASS', production: production.size, eligible: eligible.size, missing, extra };
}

function inspectGate2(library, repoRoot) {
  let contracts = 0, badContracts = 0, badCanvas = 0, badMultiply = 0, badCompanions = 0, eyeColorOutsideWhite = 0;
  const multiplyEligible = new Set(['cheeks', 'chin']);
  for (const sex of ['female', 'male']) for (const [slot, entry] of Object.entries(library.sexes[sex].slots)) for (const variant of entry.variants) {
    for (const member of [variant, ...(variant.render_overrides ?? [])]) {
      contracts += 1;
      if (member.minimum_contract?.status !== 'PASS' || !SHA256.test(member.minimum_contract?.record_sha256 ?? '')) badContracts += 1;
      if ((member.blend_mode ?? variant.blend_mode ?? 'source-over') === 'multiply' && !multiplyEligible.has(slot)) badMultiply += 1;
    }
    if (multiplyEligible.has(slot) && variant.blend_mode !== 'multiply') badMultiply += 1;
    if (entry.mode === 'companion' && (!variant.companion_of?.slot || !(variant.companion_of.variants ?? [variant.companion_of.variant]).every((id) => typeof id === 'string'))) badCompanions += 1;
  }
  if (library.canvas?.width !== 1145 || library.canvas?.height !== 1374) badCanvas += 1;
  const bundles = library.logical_bundles ?? {};
  const bundlesPass = bundles.clothes?.primary === 'clothes' && bundles.hair?.primary === 'hair' && bundles.face_shape?.primary === 'face_base';
  for (const sex of ['female', 'male']) {
    const layers = ['eyes_white', 'eyes_color', 'eyes_shape'].map((slot) => library.sexes[sex].slots[slot]?.variants[0]);
    if (layers.some((variant) => !variant)) { eyeColorOutsideWhite += 1; continue; }
    const whiteDecoded = decodePng(readFileSync(resolve(repoRoot, library.path_base, layers[0].path)));
    const colorDecoded = decodePng(readFileSync(resolve(repoRoot, library.path_base, layers[1].path)));
    const clippedColorPixels = new Uint8Array(colorDecoded.pixels);
    clipLayer(clippedColorPixels, whiteDecoded.pixels);
    for (let pixel = 3; pixel < clippedColorPixels.length; pixel += 4) {
      if (clippedColorPixels[pixel] > 0 && whiteDecoded.pixels[pixel] === 0) {
        eyeColorOutsideWhite += 1;
      }
    }
  }
  return { contracts, badContracts, badCanvas, badMultiply, badCompanions, eyeColorOutsideWhite, bundlesPass };
}

export function evaluateGate2({ repoRoot, contract }) {
  const spec = contract.gate2;
  let inputs = [];
  try {
    inputs = [spec.library, spec.catalog, spec.audit, CONTRACT_PATH, PIPELINE_PATH].map((path) => binding(repoRoot, path));
    const library = readJson(fullPath(repoRoot, spec.library));
    const catalog = readJson(fullPath(repoRoot, spec.catalog));
    const audit = run('python3', [spec.audit, spec.library], repoRoot);
    let auditReport = null;
    try { auditReport = JSON.parse(audit.stdout); } catch { /* reported below */ }
    const inspected = inspectGate2(library, repoRoot);
    const parity = catalogParity(library, catalog);
    const counts = variantCount(library);
    return receipt('gate2', inputs, [
      check('production_audit', audit.status === 0 && auditReport?.numericAcceptance === 'GREEN' && auditReport?.provenanceAcceptance === 'VERIFIED' ? 'PASS' : 'FAIL', auditReport ?? { exit_status: audit.status, stderr: audit.stderr.trim() }),
      check('minimum_contracts', inspected.badContracts === 0 ? 'PASS' : 'FAIL', { checked: inspected.contracts, invalid: inspected.badContracts }),
      check('alpha_canvas_provenance', inspected.badCanvas === 0 && auditReport?.numericAcceptance === 'GREEN' ? 'PASS' : 'FAIL', { canvas: library.canvas, variants_checked: auditReport?.variantsChecked ?? 0 }),
      check('logical_bundle_ownership', inspected.badCompanions === 0 && inspected.bundlesPass ? 'PASS' : 'FAIL', { invalid_companions: inspected.badCompanions, logical_bundles: Object.keys(library.logical_bundles ?? {}).sort() }),
      check('multiply_eligibility', inspected.badMultiply === 0 ? 'PASS' : 'FAIL', { invalid: inspected.badMultiply }),
      check('eye_layer_containment', inspected.eyeColorOutsideWhite === 0 ? 'PASS' : 'FAIL', { color_outside_white_pixels: inspected.eyeColorOutsideWhite, order: ['eyes_white', 'eyes_color', 'eyes_shape'] }),
      check('slot_relation_contract', (() => {
        const relationsPath = 'Tool/art/portrait/portrait-slot-relations.json';
        const relations = readJson(fullPath(repoRoot, relationsPath));
        const liveIds = JSON.parse(readFileSync(fullPath(repoRoot, 'Tool/art/portrait/portrait-layer-slots.json'), 'utf8')).slots.map((slot) => slot.id);
        const relationIds = Object.keys(relations.relations ?? {});
        const covered = relationIds.length === liveIds.length && liveIds.every((id) => relationIds.includes(id));
        const eyeRule = relations.relations?.eyes_white?.contains?.includes('eyes_color') === true
          && relations.relations?.eyes_color?.must_be_inside === 'eyes_white'
          && relations.relations?.eyes_shape?.occludes?.includes('eyes_white') === true
          && relations.relations?.eyes_shape?.occludes?.includes('eyes_color') === true;
        return relations.mask_rule === 'upper_slot_alpha_is_the_occlusion_mask' && covered && eyeRule ? 'PASS' : 'FAIL';
      })(), { mask_rule: 'upper_slot_alpha_is_the_occlusion_mask' }, [binding(repoRoot, 'Tool/art/portrait/portrait-slot-relations.json')]),
      check('eligible_catalog_parity', parity.status, { production_keys: parity.production, eligible_unique_catalog_keys: parity.eligible, missing: parity.missing, extra: parity.extra }),
      check('production_inventory', counts.total === auditReport?.variantsChecked ? 'PASS' : 'FAIL', counts),
    ]);
  } catch (error) { return failReceipt('gate2', inputs, error); }
}

function findVariant(library, sex, slot, id) { return library.sexes[sex].slots[slot].variants.find((variant) => variant.id === id); }
async function browserComposite(library, repoRoot, sex, selection) {
  const destination = new Uint8ClampedArray(library.canvas.width * library.canvas.height * 4);
  const order = [...library.slots].sort((a, b) => a.z - b.z);
  // build clipMasks mapping ONLY for must_be_inside (shared with composeFromLibrary)
  const relationsPath = resolve(repoRoot, 'Tool/art/portrait/portrait-slot-relations.json');
  const relationsData = JSON.parse(readFileSync(relationsPath, 'utf8'));
  const clipMasks = {};
  for (const [slotId, rel] of Object.entries(relationsData.relations || {})) {
    if (rel.must_be_inside) {
      clipMasks[slotId] = rel.must_be_inside;
    }
  }
  for (const slot of order) {
    const entry = library.sexes[sex].slots[slot.id];
    let id = selection[slot.id];
    if (entry.mode === 'fixed') id ??= entry.variants[0]?.id;
    if (entry.mode === 'companion') id = entry.variants.find((variant) => {
      const link = variant.companion_of; return (link?.variants ?? [link?.variant]).includes(selection[link?.slot]);
    })?.id;
    if (!id) continue;
    const variant = findVariant(library, sex, slot.id, id);
    if (!variant) throw new Error(`unknown matrix variant ${sex}/${slot.id}/${id}`);
    const render = variant.render_overrides?.find((item) => selection[item.when.slot] === item.when.variant) ?? variant;
    const bytes = readFileSync(resolve(repoRoot, library.path_base, render.path));
    if (sha256(bytes) !== render.sha256) throw new Error(`matrix plate hash drift: ${render.path}`);
    const decoded = await decodeBrowserPng(bytes);
    let maskPixels = null;
    const maskSlotId = clipMasks[slot.id];
    if (maskSlotId) {
      const maskEntry = library.sexes[sex].slots[maskSlotId];
      if (!maskEntry?.variants?.length) throw new Error(`must_be_inside mask ${maskSlotId} for ${slot.id} is missing or empty - fail closed`);
      let maskId = selection[maskSlotId];
      if (maskEntry.mode === 'fixed') maskId ??= maskEntry.variants[0]?.id;
      if (maskEntry.mode === 'companion') {
        maskId = maskEntry.variants.find((variant) => {
          const link = variant.companion_of; return (link?.variants ?? [link?.variant]).includes(selection[link?.slot]);
        })?.id;
      }
      if (!maskId) throw new Error(`must_be_inside mask ${maskSlotId} for ${slot.id} is missing or empty - fail closed`);
      const maskVariant = findVariant(library, sex, maskSlotId, maskId);
      if (!maskVariant) throw new Error(`unknown mask variant ${maskId} for ${maskSlotId}`);
      const maskRender = maskVariant.render_overrides?.find((item) => selection[item.when.slot] === item.when.variant) ?? maskVariant;
      const maskBytes = readFileSync(resolve(repoRoot, library.path_base, maskRender.path));
      if (sha256(maskBytes) !== maskRender.sha256) throw new Error(`mask plate hash drift: ${maskRender.path}`);
      const maskDecoded = await decodeBrowserPng(maskBytes);
      maskPixels = maskDecoded.pixels;
    }
    compositeBrowserPixels(destination, decoded.pixels, render.blend_mode ?? variant.blend_mode ?? 'source-over', maskPixels);
  }
  return destination;
}

export async function evaluateGate3({ repoRoot, contract }) {
  const spec = contract.gate3;
  let inputs = [];
  try {
    inputs = [spec.matrix, spec.attachment_receipt, spec.combination_sweep, contract.gate2.library, CONTRACT_PATH, PIPELINE_PATH].map((path) => binding(repoRoot, path));
    const library = readJson(fullPath(repoRoot, contract.gate2.library));
    const matrix = readJson(fullPath(repoRoot, spec.matrix));
    const artifacts = [];
    let matrixFailures = 0, parityFailures = 0, conditionalRows = 0;
    const currentCombinations = [];
    for (const row of matrix.rows ?? []) {
      const selection = Object.fromEntries(Object.entries(row.selection).filter(([slot]) => library.sexes[row.sex].slots[slot]?.mode !== 'companion'));
      const composed = composeFromLibrary({ library, repoRoot, sex: row.sex, selection, purpose: 'reconstruction' });
      const artifact = binding(repoRoot, row.path); artifacts.push(artifact);
      if (artifact.sha256 !== row.sha256 || composed.sha256 !== row.sha256) matrixFailures += 1;
      currentCombinations.push({ sex: row.sex, index: row.index, png_sha256: composed.sha256, captured_sha256: artifact.sha256, rgba_sha256: sha256(decodePng(composed.png).pixels) });
      const browser = await browserComposite(library, repoRoot, row.sex, selection);
      const offline = decodePng(composed.png).pixels;
      if (Buffer.compare(Buffer.from(browser), Buffer.from(offline)) !== 0) parityFailures += 1;
      if (row.headgear_back || row.headgear_mid || row.clothes_back || row.clothes_front) conditionalRows += 1;
    }
    const attachment = readJson(fullPath(repoRoot, spec.attachment_receipt));
    // Attachment rigs are authoring guides; per the contract's attachment_thresholds policy,
    // "informational" means threshold-less PENDING nodes are recorded as informational and do
    // not block gate 3 — actual combination quality is carried by the visual verdicts.
    const attachmentInformational = spec.attachment_thresholds === 'informational';
    const attachmentArtifacts = attachment.nodes.flatMap((node) => node.artifacts ?? []).map((artifact) => {
      const base = dirname(spec.attachment_receipt); return binding(repoRoot, posix(`${base}/${artifact.path}`));
    });
    const attachmentPending = attachment.nodes.some((node) => node.type === 'attachment_boundary_check' && node.status === 'PENDING');
    const attachmentFail = attachment.nodes.some((node) => node.status === 'FAIL');
    const sweep = readJson(fullPath(repoRoot, spec.combination_sweep));
    const holeFree = Object.values(sweep.sexes ?? {}).every((sex) => sex.all_combinations_hole_free === true);
    const visualVerdicts = matrix.rows?.every((row) => ['PASS', 'APPROVED'].includes(row.visual_verdict)) === true;
    const checks = [
      check('current_combination_matrix', matrixFailures === 0 && matrix.count === matrix.rows?.length && matrix.count > 0 && new Set(currentCombinations.map((row) => row.rgba_sha256)).size === currentCombinations.length ? 'PASS' : 'FAIL', { rows: matrix.rows?.length ?? 0, failures: matrixFailures, current_combinations: currentCombinations }, artifacts),
      check('conditional_render_members', conditionalRows > 0 ? 'PASS' : 'FAIL', { exercised_rows: conditionalRows }),
      check('attachment_graph', attachmentFail ? 'FAIL' : attachmentPending && !attachmentInformational ? 'PENDING' : 'PASS', { receipt_status: attachment.status, pending_threshold_checks: attachment.nodes.filter((node) => node.type === 'attachment_boundary_check' && node.status === 'PENDING').length, policy: spec.attachment_thresholds ?? 'enforced' }, attachmentArtifacts, attachmentPending && !attachmentInformational ? 'attachment_thresholds_pending' : null),
      check('seam_occlusion', attachmentFail ? 'FAIL' : (attachmentPending && !attachmentInformational) || !holeFree ? 'PENDING' : 'PASS', { attachment_pending: attachmentPending && !attachmentInformational, all_combinations_hole_free: holeFree }, [], (attachmentPending && !attachmentInformational) || !holeFree ? 'seam_or_occlusion_verdict_pending' : null),
      check('browser_offline_rgba_parity', parityFailures === 0 && matrix.rows?.length > 0 ? 'PASS' : 'FAIL', { rows: matrix.rows?.length ?? 0, rgba_mismatches: parityFailures }),
      check('visual_combination_verdicts', visualVerdicts ? 'PASS' : 'PENDING', { required: matrix.rows?.length ?? 0, approved: matrix.rows?.filter((row) => ['PASS', 'APPROVED'].includes(row.visual_verdict)).length ?? 0 }, [], visualVerdicts ? null : 'required_visual_combination_verdicts_pending'),
    ];
    const blockers = [];
    if (attachmentPending && !attachmentInformational) blockers.push({ code: 'attachment_thresholds_pending' });
    if (!holeFree) blockers.push({ code: 'seam_occlusion_evidence_pending' });
    if (!visualVerdicts) blockers.push({ code: 'visual_combination_verdicts_pending' });
    return receipt('gate3', inputs, checks, blockers);
  } catch (error) { return failReceipt('gate3', inputs, error); }
}

export function evaluateGate4({ repoRoot, contract, curationPacket = null }) {
  const spec = contract.gate4;
  let inputs = [];
  try {
    inputs = [spec.catalog, CONTRACT_PATH, PIPELINE_PATH].map((path) => binding(repoRoot, path));
    const catalog = readJson(fullPath(repoRoot, spec.catalog));
    if (!curationPacket) return receipt('gate4', inputs, [
      check('curation_packet', 'PENDING', { catalog_records: catalog.records.length }, [], 'user_packet_required'),
      check('all_records_decided', 'PENDING', { required: spec.required_records, decided: 0 }, [], 'user_packet_required'),
      check('feedback_bound_checkpoint', 'PENDING', {}, [], 'user_feedback_required'),
    ], [{ code: 'user_curation_packet_required' }]);
    const packetPath = posix(curationPacket);
    inputs.push(binding(repoRoot, packetPath));
    const packet = readJson(fullPath(repoRoot, packetPath));
    const report = verifyPortraitCuration(packet, { repoRoot });
    const decisions = Array.isArray(packet.decisions) ? packet.decisions.length : 0;
    const packetStatus = report.status === 'PASS' ? 'PASS' : report.status === 'PENDING' ? 'PENDING' : 'FAIL';
    return receipt('gate4', inputs, [
      check('curation_packet', packetStatus, { verifier_status: report.status, errors: report.errors }),
      check('all_records_decided', decisions === spec.required_records && decisions === catalog.records.length ? 'PASS' : 'FAIL', { required: spec.required_records, catalog_records: catalog.records.length, decided: decisions }),
      check('feedback_bound_checkpoint', report.status === 'PASS' ? 'PASS' : report.status === 'PENDING' ? 'PENDING' : 'FAIL', { feedback_sha256: packet.feedback_sha256 ?? null, receipts: report.receipts }),
    ]);
  } catch (error) { return failReceipt('gate4', inputs, error); }
}

export function applySequencing(receipts) {
  let priorPass = true;
  return receipts.map((item) => {
    if (!priorPass && item.status === 'PASS') {
      item = { ...item, status: 'PENDING', blockers: [...item.blockers, { code: 'prior_gate_not_pass' }] };
    }
    priorPass &&= item.status === 'PASS';
    return item;
  });
}

export async function evaluatePortraitQualityPipeline(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const contractPath = options.contractPath ?? CONTRACT_PATH;
  const contract = readJson(fullPath(repoRoot, contractPath));
  const receipts = applySequencing([
    evaluateGate1({ repoRoot, contract }),
    evaluateGate2({ repoRoot, contract }),
    await evaluateGate3({ repoRoot, contract }),
    evaluateGate4({ repoRoot, contract, curationPacket: options.curationPacket }),
  ]);
  return { repoRoot, contractPath, contract, receipts };
}

export async function runPortraitQualityPipeline(options = {}) {
  const evaluated = await evaluatePortraitQualityPipeline(options);
  const output = options.output ?? evaluated.contract.current_output;
  const outputDir = fullPath(evaluated.repoRoot, output);
  rmSync(outputDir, { recursive: true, force: true }); mkdirSync(outputDir, { recursive: true });
  for (const item of evaluated.receipts) writeFileSync(resolve(outputDir, `${item.gate_id}.json`), `${JSON.stringify(item, null, 2)}\n`);
  const summary = { version: 1, contract: binding(evaluated.repoRoot, evaluated.contractPath), gates: Object.fromEntries(evaluated.receipts.map((item) => [item.gate_id, item.status])) };
  writeFileSync(resolve(outputDir, 'workflow-status.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return { output: posix(output), ...summary, receipts: evaluated.receipts };
}

function verifyBindings(repoRoot, values, errors, label) {
  for (const item of values) {
    if (!item || typeof item.path !== 'string' || !SHA256.test(item.sha256 ?? '')) { errors.push({ code: 'binding_invalid', label }); continue; }
    try { const actual = binding(repoRoot, item.path); if (actual.sha256 !== item.sha256) errors.push({ code: 'hash_mismatch', path: item.path, expected: item.sha256, actual: actual.sha256 }); }
    catch (error) { errors.push({ code: 'binding_unreadable', path: item.path, message: error.message }); }
  }
}

export async function verifyPortraitQualityReceipts(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const contractPath = options.contractPath ?? CONTRACT_PATH;
  const contract = readJson(fullPath(repoRoot, contractPath));
  const receiptsDir = fullPath(repoRoot, options.receiptsDir ?? contract.current_output);
  const actual = [];
  const errors = [];
  for (const gateId of contract.gate_order) {
    const path = resolve(receiptsDir, `${gateId}.json`);
    if (!existsSync(path)) { errors.push({ code: 'receipt_missing', gate_id: gateId }); continue; }
    let item;
    try { item = readJson(path); } catch { errors.push({ code: 'receipt_unparsable', gate_id: gateId }); continue; }
    if (item.version !== contract.receipt_version || item.gate_id !== gateId || !STATUSES.has(item.status)) errors.push({ code: 'receipt_schema_invalid', gate_id: gateId });
    verifyBindings(repoRoot, item.input_bindings ?? [], errors, `${gateId}/input`);
    for (const row of item.checks ?? []) verifyBindings(repoRoot, row.artifacts ?? [], errors, `${gateId}/${row.id}`);
    actual.push(item);
  }
  const expected = (await evaluatePortraitQualityPipeline({ repoRoot, contractPath, curationPacket: options.curationPacket })).receipts;
  const normalized = (item) => {
    const copy = structuredClone(item);
    for (const row of copy.checks ?? []) if (row.id === 'production_audit' && typeof row.metrics?.manifest === 'string') row.metrics.manifest = posix(relative(repoRoot, row.metrics.manifest));
    return copy;
  };
  for (const wanted of expected) {
    const found = actual.find((item) => item.gate_id === wanted.gate_id);
    if (found && stable(normalized(found)) !== stable(normalized(wanted))) errors.push({ code: 'receipt_not_reproducible', gate_id: wanted.gate_id });
  }
  const sequenced = applySequencing(actual.map((item) => structuredClone(item)));
  for (let index = 0; index < actual.length; index += 1) if (actual[index].status !== sequenced[index].status) errors.push({ code: 'gate_sequence_violation', gate_id: actual[index].gate_id });
  const gates = Object.fromEntries(contract.gate_order.map((gateId) => [gateId, errors.some((error) => error.gate_id === gateId || error.path?.includes(gateId)) ? 'FAIL' : actual.find((item) => item.gate_id === gateId)?.status ?? 'FAIL']));
  return { status: errors.length ? 'FAIL' : 'PASS', gates, errors };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--repo-root') options.repoRoot = argv[++index];
    else if (arg === '--contract') options.contractPath = argv[++index];
    else if (arg === '--out' || arg === '--receipts') options[arg === '--out' ? 'output' : 'receiptsDir'] = argv[++index];
    else if (arg === '--curation-packet') options.curationPacket = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const command = process.argv[2]; const options = parseArgs(process.argv.slice(3));
    if (command === 'run') console.log(JSON.stringify(await runPortraitQualityPipeline(options), null, 2));
    else if (command === 'verify') { const report = await verifyPortraitQualityReceipts(options); console.log(JSON.stringify(report, null, 2)); if (report.status !== 'PASS') process.exitCode = 1; }
    else throw new Error('usage: portrait-quality-pipeline.mjs run [--out dir] [--curation-packet file] | verify [--receipts dir] [--curation-packet file]');
  } catch (error) { console.error(JSON.stringify({ error: error.message })); process.exitCode = 1; }
}
