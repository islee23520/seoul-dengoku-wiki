import { createHash } from 'node:crypto';
import { readFile, stat, mkdir, writeFile, open, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { decodeCodexPng } from './codex-image.mjs';
import { encodeFinalPng } from './final-alpha-export.mjs';
import { composeDesignRequest, validateModificationSnapshot } from './compose-text-spec.mjs';
import { strictJSONParse } from './design-prompt.mjs';
import { loadPortraitPackage } from './portrait-package.mjs';
import { runGeneration } from './image-generate.mjs';
import { sparseAlpha } from './sparse-alpha.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const operations = ['local-alpha', 'uniform-placement', 'new-source', 'garment-edit'];

function validateScope(before, after, operation, region) {
  if (before.width !== after.width || before.height !== after.height || before.channels !== 4 || after.channels !== 4) throw new Error('modification must preserve RGBA canvas dimensions');
  let changed = 0;
  for (let i = 0; i < before.width * before.height; i++) {
    const x = i % before.width, y = Math.floor(i / before.width), inRegion = x >= region.x && y >= region.y && x < region.x + region.width && y < region.y + region.height;
    const a = before.pixels.subarray(i * 4, i * 4 + 4), b = after.pixels.subarray(i * 4, i * 4 + 4);
    if (!inRegion && !a.equals(b)) throw new Error('modification changed pixels outside requested region');
    if (!a.equals(b)) changed++;
    if (operation === 'local-alpha' && !a.subarray(0, 3).equals(b.subarray(0, 3))) throw new Error('local-alpha operation changed source RGB');
  }
  if (!changed) throw new Error('requested modification produced no pixel changes');
  return changed;
}

export async function modifyPortrait({ sourcePath, sourceSHA, activatedSlots, operation, region, alpha, sparseMask, transform, output, receipt, lookPath, technique, composition, packageRoot, manifestPath, expected, generationArgs = null, garmentContractPath, garmentContractSHA, connectionConfig }) {
  if (!operations.includes(operation)) throw new Error('operation must be local-alpha, uniform-placement, new-source, or garment-edit');
  if (!Array.isArray(activatedSlots) || !activatedSlots.length || new Set(activatedSlots).size !== activatedSlots.length) throw new Error('explicit activated slots required');
  if (operation === 'local-alpha' && !activatedSlots.some(slot => /(?:^|\.)alpha(?:$|\.)/.test(slot) || /^pixel-mask(?:\.|$)/.test(slot))) throw new Error('local-alpha requires activated alpha-mask slots');
  if (operation === 'uniform-placement' && !activatedSlots.some(slot => ['placement', 'uniform-placement'].includes(slot))) throw new Error('uniform-placement requires an activated placement slot');
  if (operation === 'new-source' && !activatedSlots.some(slot => /^appearance\.(?:face|hair|body|outfit|accessories)\./.test(slot))) throw new Error('new-source requires activated JSON appearance slots');
  if (operation === 'new-source' && (!lookPath || !technique || !composition)) throw new Error('new-source requires JSON look, technique and composition; mask repair is not source generation');
  if (operation === 'new-source' && composition?.fabricPresent !== false) throw new Error('new-source requires fabricPresent:false; present fabric must use repair or placement');
  const missingFabric = operation === 'garment-edit' && composition?.fabricationCase === 'missing-fabric';
  if (missingFabric && composition?.fabricPresent !== false) throw new Error('missing-fabric requires fabricPresent:false; provider calls: 0');
  if (operation !== 'new-source' && !missingFabric && composition?.fabricPresent !== true) throw new Error('repair and placement require fabricPresent:true');
  if (operation === 'garment-edit' && composition?.fabricationCase !== undefined && !['missing-fabric', 'existing-fabric'].includes(composition.fabricationCase)) throw new Error('invalid garment fabricationCase; provider calls: 0');
  const sourceBytes = await readFile(sourcePath);
  const actualSourceSHA = sha256(sourceBytes);
  if (actualSourceSHA !== sourceSHA) throw new Error('stale sourceSHA; provider calls: 0');
  const lookBytes = lookPath ? await readFile(lookPath) : Buffer.from('{}');
  const inputSnapshotSHA = sha256(lookBytes);
  const portraitPackage = await loadPortraitPackage({ root: packageRoot, manifestPath });
  const binding = validateModificationSnapshot({ sourceImageSha256: sourceSHA, packageVersion: portraitPackage.version, inputSnapshotSHA }, expected);
  if (sparseMask !== undefined) {
    if (operation !== 'local-alpha') throw new Error('sparse mask is only supported for local-alpha');
    return sparseAlpha({ sourcePath, sourceBytes, sourceSHA, sparseMask, alpha, region, output, receipt, binding, activatedSlots });
  }
  if (operation === 'garment-edit') {
    const fabricationCase = missingFabric ? 'missing-fabric' : 'existing-fabric';
    const slots = missingFabric ? ['appearance.outfit.upper'] : ['appearance.outfit.upper', 'appearance.outfit.neckline'];
    if (activatedSlots.length !== slots.length || slots.some(slot => !activatedSlots.includes(slot))) throw new Error('garment-edit requires case-specific activated garment slots; provider calls: 0');
    const contractBytes = await readFile(garmentContractPath);
    if (sha256(contractBytes) !== garmentContractSHA) throw new Error('stale garment contract SHA; provider calls: 0');
    const contract = strictJSONParse(contractBytes.toString('utf8'));
    if (contract.schema !== 'portrait-garment-edit.v1' || contract.maskSemantics !== 'binary-alpha-zero-editable.v1' || contract.approved !== true || contract.fabricPresent !== !missingFabric || (contract.fabricationCase ?? 'existing-fabric') !== fabricationCase || contract.sourceImageSha256 !== sourceSHA || contract.inputSnapshotSHA !== inputSnapshotSHA || contract.packageVersion !== portraitPackage.version || JSON.stringify(contract.activatedSlots) !== JSON.stringify(slots)) throw new Error('stale or unapproved garment contract; provider calls: 0');
    const originalLookBytes = await readFile(contract.originalLookPath);
    const maskBytes = await readFile(contract.maskPath);
    if (sha256(originalLookBytes) !== contract.originalLookSHA || sha256(maskBytes) !== contract.maskSHA) throw new Error('stale garment input or mask SHA; provider calls: 0');
    const originalLook = strictJSONParse(originalLookBytes.toString('utf8')), correctedLook = strictJSONParse(lookBytes.toString('utf8'));
    const protectedOriginal = structuredClone(originalLook), protectedCorrected = structuredClone(correctedLook);
    for (const value of [protectedOriginal, protectedCorrected]) {
      if (!value.slots?.outfit?.upper || !value.slots.outfit.neckline) throw new Error('garment-edit requires authored upper and neckline leaves');
      for (const slot of slots) delete value.slots.outfit[slot.split('.').at(-1)];
    }
    if (JSON.stringify(protectedOriginal) !== JSON.stringify(protectedCorrected)) throw new Error('garment-edit changed protected authored identity/face/hair/body/skin/props/frame; provider calls: 0');
    const source = decodeCodexPng(sourceBytes), mask = decodeCodexPng(maskBytes);
    if (source.channels !== 4 || mask.channels !== 4 || source.width !== mask.width || source.height !== mask.height) throw new Error('garment mask must match exact RGBA source canvas; provider calls: 0');
    if (source.width % 16 || source.height % 16 || ![[1024, 1536], [1152, 1344]].some(([w, h]) => source.width === w && source.height === h)) throw new Error('unsupported garment-edit same-canvas size; no resizing permitted; provider calls: 0');
    if (!Array.isArray(contract.approvedEditablePixels) || !contract.approvedEditablePixels.length || new Set(contract.approvedEditablePixels).size !== contract.approvedEditablePixels.length || contract.approvedEditablePixels.some(i => !Number.isInteger(i) || i < 0 || i >= source.width * source.height)) throw new Error('independently approved garment pixel region required; provider calls: 0');
    const approved = new Set(contract.approvedEditablePixels), editable = [];
    for (let i = 0; i < source.width * source.height; i++) {
      const a = mask.pixels[i * 4 + 3];
      if (a !== 0 && a !== 255) throw new Error('binary garment mask alpha required; provider calls: 0');
      if (a === 0) { if (!approved.has(i)) throw new Error('mask pixel outside approved garment region; provider calls: 0'); editable.push(i); }
    }
    if (!editable.length || editable.length === source.width * source.height) throw new Error('empty or all-editable garment mask rejected; provider calls: 0');
    if (!composition.references || !composition.designComposition || !generationArgs) throw new Error('garment-edit requires canonical package composition and reference arguments');
    const references = [{ index: 1, role: 'recipient-appearance-only', sha256: sourceSHA, sameOwnerRecipient: true, allowedProperties: ['face', 'body', 'hair', 'outfit', 'accessories'] }, ...composition.references.map(({ role, sha256, allowedProperties, guide }, i) => ({ index: i + 2, role, sha256, allowedProperties, ...(guide ? { guide } : {}) }))];
    const design = structuredClone(await composeDesignRequest({ lookBytes, references, composition: composition.designComposition, packageRoot, packageVersion: portraitPackage.version, modification: binding }));
    if (design.output.width !== source.width || design.output.height !== source.height) throw new Error('unsupported garment-edit canvas for canonical composition; provider calls: 0');
    design.garmentEdit = { operation, fabricPresent: !missingFabric, fabricationCase, contractSHA: garmentContractSHA, maskSHA: contract.maskSHA, originalLookSHA: contract.originalLookSHA, maskSemantics: contract.maskSemantics, activatedSlots: slots, instruction: 'Correct only activated garment leaves using their authored values. For missing-fabric, add the upper garment and preserve the neckline. Preserve all unactivated authored fields, identity, face, hair, body, skin, props and frame. Mask alpha zero is editable; alpha 255 is protected.' };
    const snapshotDir = output + '.garment-inputs', providerOutput = output + '.provider.png';
    const protectedPaths = [sourcePath, lookPath, contract.originalLookPath, contract.maskPath, garmentContractPath].map(path => resolve(path));
    const targets = [output, receipt, snapshotDir, providerOutput, providerOutput + '.receipt.json', providerOutput + '.request.json', providerOutput + '.native'];
    if (new Set(targets.map(path => resolve(path))).size !== targets.length || targets.some(path => protectedPaths.includes(resolve(path)))) throw new Error('garment-edit output paths must be distinct from immutable inputs');
    for (const path of targets) { try { await stat(path); throw new Error('output already exists: ' + path); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
    const handles = [], created = [];
    try {
      handles.push(await open(output, 'wx', 0o600)); created.push(output);
      handles.push(await open(receipt, 'wx', 0o600)); created.push(receipt);
      await mkdir(snapshotDir);
      for (const [name, bytes] of [['source.png', sourceBytes], ['mask.png', maskBytes], ['original-look.json', originalLookBytes], ['corrected-look.json', lookBytes], ['contract.json', contractBytes]]) await writeFile(snapshotDir + '/' + name, bytes, { flag: 'wx', mode: 0o600 });
      const unchanged = async (beforeProvider = true) => {
        for (const [path, bytes] of [[sourcePath, sourceBytes], [lookPath, lookBytes], [contract.originalLookPath, originalLookBytes], [contract.maskPath, maskBytes], [garmentContractPath, contractBytes]]) if (sha256(await readFile(path)) !== sha256(bytes)) throw new Error(beforeProvider ? 'stale garment input snapshot; provider calls: 0' : 'garment input changed after dispatch; derivative rejected');
      };
      await unchanged();
      const args = ['--image', sourcePath, ...generationArgs];
      args[args.indexOf('--reference-roles') + 1] = references.map(ref => ref.role).join(',');
      args[args.indexOf('--prompt') + 1] = JSON.stringify(design);
      args[args.indexOf('-o') + 1] = providerOutput;
      args.push('--size', source.width + 'x' + source.height);
      if (connectionConfig && !args.includes('--connection-config')) args.push('--connection-config', connectionConfig);
      await runGeneration(args, { garmentEdit: { sourceBytes, maskBytes, size: source.width + 'x' + source.height, contractSHA: garmentContractSHA, activatedSlots: slots, beforeDispatch: unchanged } });
      const rawBytes = await readFile(providerOutput + '.native/image-001.png'), raw = decodeCodexPng(rawBytes);
      if (raw.channels !== 4 || raw.width !== source.width || raw.height !== source.height) throw new Error('garment raw output must match exact RGBA source canvas');
      const pixels = Buffer.from(source.pixels); let changedInside = 0;
      for (const i of editable) { const start = i * 4; if (!raw.pixels.subarray(start, start + 4).equals(source.pixels.subarray(start, start + 4))) changedInside++; raw.pixels.copy(pixels, start, start, start + 4); }
      if (!changedInside) throw new Error('garment-edit produced no approved pixel changes');
      const derivativeBytes = encodeFinalPng({ ...source, pixels }), derivative = decodeCodexPng(derivativeBytes);
      for (let i = 0; i < source.width * source.height; i++) if (mask.pixels[i * 4 + 3] === 255 && !derivative.pixels.subarray(i * 4, i * 4 + 4).equals(source.pixels.subarray(i * 4, i * 4 + 4))) throw new Error('garment derivative changed protected pixels');
      await unchanged(false);
      const record = { schema: 'portrait-native-modification.v1', operation, fabricationCase, fabricPresent: !missingFabric, ...binding, activatedSlots: [...activatedSlots], contractSHA: garmentContractSHA, maskSemantics: contract.maskSemantics, snapshotDir, source: { path: resolve(sourcePath), sha256: sourceSHA }, mask: { sha256: contract.maskSHA }, originalLookSHA: contract.originalLookSHA, raw: { path: providerOutput + '.native/image-001.png', sha256: sha256(rawBytes) }, output: { path: resolve(output), sha256: sha256(derivativeBytes) }, canvas: [source.width, source.height], canvasEqual: true, changedInside, changedOutside: 0, reviewStatus: 'pending', publicationAuthorized: false, providerPreservationGuaranteed: false };
      await handles[0].writeFile(derivativeBytes); await handles[1].writeFile(JSON.stringify(record, null, 2) + '\n');
      return record;
    } catch (error) { await Promise.all(created.map(path => unlink(path))); throw error; }
    finally { await Promise.all(handles.map(handle => handle.close())); }
  }
  if (operation === 'new-source') {
    const references = composition?.references?.map(({ index, role, sha256, allowedProperties, guide, sameOwnerRecipient, priority, landmark }) => ({ index, role, sha256, ...(allowedProperties ? { allowedProperties } : {}), ...(guide ? { guide } : {}), ...(sameOwnerRecipient ? { sameOwnerRecipient } : {}), ...(priority !== undefined ? { priority } : {}), ...(landmark ? { landmark } : {}) }));
    const designComposition = composition?.designComposition;
    if (!Array.isArray(references) || !designComposition) throw new Error('new-source requires package-bound references and JSON composition');
    const designPrompt = await composeDesignRequest({ lookBytes, references, composition: designComposition, packageRoot, packageVersion: portraitPackage.version, modification: binding });
    if (!generationArgs) throw new Error('new-source requires the native portrait generation reference arguments');
    const args = [...generationArgs];
    const promptIndex = args.indexOf('--prompt');
    if (promptIndex < 0) throw new Error('native generation request lacks JSON prompt');
    strictJSONParse(args[promptIndex + 1]);
    const passedLook = strictJSONParse(lookBytes.toString('utf8'));
    for (const [slot, fields] of Object.entries(passedLook.slots ?? {})) for (const [field, value] of Object.entries(fields)) {
      if (!activatedSlots.includes(`appearance.${slot}.${field}`) && JSON.stringify(designPrompt.appearance[slot]?.[field]) !== JSON.stringify(value.value)) throw new Error(`new-source changed untouched slot appearance.${slot}.${field}`);
    }
    args[promptIndex + 1] = JSON.stringify(designPrompt);
    const generated = await runGeneration(args);
    return { operation, ...binding, path: generated.path, generated };
  }
  if (!region || ![region.x, region.y, region.width, region.height].every(Number.isInteger) || region.x < 0 || region.y < 0 || region.width < 1 || region.height < 1) throw new Error('explicit in-canvas modification region required');
  const decoded = decodeCodexPng(sourceBytes);
  if (decoded.channels !== 4 || region.x + region.width > decoded.width || region.y + region.height > decoded.height) throw new Error('source must be RGBA and region must fit canvas');
  const pixels = Buffer.from(decoded.pixels);
  let allowedRegion = region;
  if (operation === 'local-alpha') {
    if (!Number.isInteger(alpha) || alpha < 0 || alpha > 255) throw new Error('local-alpha requires an explicit alpha value');
    for (let y = region.y; y < region.y + region.height; y++) for (let x = region.x; x < region.x + region.width; x++) pixels[(y * decoded.width + x) * 4 + 3] = alpha;
  } else {
    if (!transform || !Number.isFinite(transform.scale) || transform.scale <= 0 || !Number.isInteger(transform.dx) || !Number.isInteger(transform.dy)) throw new Error('uniform-placement requires explicit uniform scale and integer translation');
    const { width, height } = decoded;
    const left = Math.max(0, Math.min(region.x, transform.dx));
    const top = Math.max(0, Math.min(region.y, transform.dy));
    const right = Math.min(width, Math.max(region.x + region.width, transform.dx + Math.ceil(region.width * transform.scale)));
    const bottom = Math.min(height, Math.max(region.y + region.height, transform.dy + Math.ceil(region.height * transform.scale)));
    allowedRegion = { x: left, y: top, width: right - left, height: bottom - top };
    for (let y = region.y; y < region.y + region.height; y++) for (let x = region.x; x < region.x + region.width; x++) pixels.fill(0, (y * width + x) * 4, (y * width + x) * 4 + 4);
    for (let y = allowedRegion.y; y < allowedRegion.y + allowedRegion.height; y++) for (let x = allowedRegion.x; x < allowedRegion.x + allowedRegion.width; x++) {
      const sx = Math.floor((x - transform.dx) / transform.scale) + region.x, sy = Math.floor((y - transform.dy) / transform.scale) + region.y;
      if (x >= transform.dx && y >= transform.dy && sx >= region.x && sy >= region.y && sx < region.x + region.width && sy < region.y + region.height) decoded.pixels.copy(pixels, (y * width + x) * 4, (sy * width + sx) * 4, (sy * width + sx) * 4 + 4);
    }
  }
  const changedPixels = validateScope(decoded, { ...decoded, pixels }, operation, allowedRegion);
  const outputBytes = encodeFinalPng({ ...decoded, pixels });
  const after = decodeCodexPng(outputBytes);
  validateScope(decoded, after, operation, allowedRegion);
  if (resolve(output) === resolve(sourcePath) || resolve(receipt) === resolve(sourcePath) || resolve(output) === resolve(receipt)) throw new Error('new output and receipt paths must be distinct from original');
  const record = { schema: 'portrait-native-modification.v1', ...binding, activatedSlots: [...activatedSlots], operation, source: { path: resolve(sourcePath), sha256: sourceSHA }, output: { path: resolve(output), sha256: sha256(outputBytes) }, changedPixels, requestedRegion: region, changedRegion: allowedRegion, reviewStatus: 'pending' };
  const handles = [], created = [];
  try {
    handles.push(await open(output, 'wx', 0o600)); created.push(output); handles.push(await open(receipt, 'wx', 0o600)); created.push(receipt);
    if (sha256(await readFile(sourcePath)) !== sourceSHA) throw new Error('source changed during modification');
    await handles[0].writeFile(outputBytes); await handles[1].writeFile(JSON.stringify(record, null, 2) + '\n');
  } catch (error) {
    const { unlink } = await import('node:fs/promises');
    await Promise.all(created.map(path => unlink(path).catch(() => {})));
    throw error;
  } finally { await Promise.all(handles.map(handle => handle.close())); }
  return record;
}

export { operations };
