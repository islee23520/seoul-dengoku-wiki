#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { strictJSONParse } from '../design-prompt.mjs';
import { decodeCodexPng } from '../codex-image.mjs';
import { maskedEdit } from './masked-edit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const hash = value => createHash('sha256').update(value).digest('hex');
export const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
const digest = value => hash(canonical(value));
const json = async path => strictJSONParse((await readFile(path)).toString('utf8'));
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };
const hashShape = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const exact = (a, b) => canonical(a) === canonical(b);
const fields = (value, allowed) => requireThat(value && !Array.isArray(value) && typeof value === 'object' && Object.keys(value).every(key => allowed.includes(key)), 'unknown or invalid fields');
const absolute = path => requireThat(typeof path === 'string' && isAbsolute(path), 'absolute path required');
export async function checked(ref) {
  fields(ref, ['path', 'sha256']); absolute(ref.path);
  requireThat(hashShape(ref.sha256), 'SHA-256 required');
  const bytes = await readFile(ref.path);
  requireThat(hash(bytes) === ref.sha256, 'file hash mismatch: ' + ref.path);
  return bytes;
}
async function publish(path, data) {
  absolute(path); await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
}
function configCheck(config) {
  requireThat(config.schema === 'paperdoll-config.v1', 'config schema mismatch');
  requireThat(config.canvas && ['width', 'height'].every(key => Number.isInteger(config.canvas[key]) && config.canvas[key] > 0), 'invalid canvas');
  requireThat(exact(config.roles,['hairBack','body','head','clothing','hairFront','deadHead','headlessBody']), 'seven ordered roles required');
  requireThat(config.subjects?.length === 3 && new Set(config.subjects.map(s => s.name)).size === 3, 'three explicit subjects required');
}
export async function geometryCheck(config, {draft=false}={}) {
  requireThat(config.geometry, 'measured geometry/masks contract pending; no preparation or dispatch');
  const geometry = strictJSONParse((await checked(config.geometry)).toString('utf8'));
  requireThat(geometry.schema === 'paperdoll-geometry.v1' && (geometry.status === 'approved' || draft && ['draft','APPROVED_EDIT_REGION_LAYOUT'].includes(geometry.status)) && geometry.coordinateSystem === 'pixels-top-left-x-right-y-down' && exact(geometry.canvas,config.canvas), 'unapproved or invalid measured geometry contract');
  if(!draft) {
    requireThat(geometry.approval?.verdict === 'pass' && typeof geometry.approval.reviewer === 'string' && geometry.approval.reviewer.trim(), 'external geometry approval required');
    await checked(geometry.approval.evidence);
  }
  requireThat(typeof geometry.measurementEvidence === 'string' && geometry.measurementEvidence.trim(), 'measurement evidence required');
  await checked(geometry.reference);
  if(geometry.referenceMeasurements) {
    const reference = strictJSONParse((await checked(geometry.referenceMeasurements)).toString('utf8'));
    requireThat(reference.status === 'MEASURED_REFERENCE_GEOMETRY' && exact(reference.measurements.liveHeadTrim,[50,68]) && exact(reference.measurements.body03and04Trim,[82,58]), 'BB numeric reference binding mismatch');
    requireThat(config.canvas.width*142 === config.canvas.height*104, 'canvas must uniformly scale measured 104:142 plane');
  }
  if(geometry.master) {
    const master=decodeCodexPng(await checked(geometry.master));
    requireThat(master.width === config.canvas.width && master.height === config.canvas.height && master.channels === 4, 'registered master canvas mismatch');
  } else requireThat(draft && geometry.lifecycle === 'schematic', 'registered master required outside schematic draft');
  requireThat(Number.isFinite(geometry.masterScale) && geometry.masterScale > 0, 'one uniform master scale required');
  const orderedParts=draft ? config.roles.filter(role=>geometry.parts?.some(part=>part.role===role)) : config.roles;
  requireThat(geometry.parts?.length === orderedParts.length && orderedParts.length>0 && exact(geometry.occlusionOrder,orderedParts), 'explicit part geometry/occlusion required');
  const point = value => Array.isArray(value) && value.length === 2 && value.every(Number.isFinite);
  for(const [index,part] of geometry.parts.entries()) {
    requireThat(part.role === orderedParts[index] && Array.isArray(part.cropRect) && part.cropRect.length === 4 && part.cropRect.every(Number.isFinite) && part.cropRect[0] >= 0 && part.cropRect[1] >= 0 && part.cropRect[2] > 0 && part.cropRect[3] > 0 && part.cropRect[0]+part.cropRect[2] <= config.canvas.width && part.cropRect[1]+part.cropRect[3] <= config.canvas.height, 'invalid measured crop');
    requireThat(point(part.logicalSize) && part.logicalSize.every(v=>v>0) && point(part.pivot) && point(part.sourceAnchor) && point(part.targetAnchor) && ['owns','not-owned'].includes(part.neckSeamOwnership), 'logical size/pivot/anchors/seam ownership required');
    requireThat(Array.isArray(part.transform) && part.transform.length === 6 && part.transform.every(Number.isFinite) && typeof part.transformProvenance === 'string' && part.transformProvenance.trim(), 'measured per-part affine transform provenance required');
    const [a,b,c,d,tx,ty] = part.transform;
    requireThat(a === d && a>0 && b === 0 && c === 0, 'anisotropic part scale rejected');
    if(geometry.transformGroups) {
      requireThat(geometry.proportionDesign?.version && geometry.proportionDesign?.stage==='target-master-mask-design' && geometry.proportionDesign?.neckSocketContinuity==='review-required', 'versioned target ratio design required');
      await checked(geometry.proportionDesign.evidence);
      requireThat(geometry.proportionDesign.method==='reference-constraint-solve', 'aesthetic scale selection withdrawn; explicit mathematical constraint solve required');
      const group=geometry.transformGroups.find(group=>group.id===part.transformGroup);
      requireThat(group && group.roles.includes(part.role) && exact(group.transform,part.transform) && typeof group.rationale==='string' && group.rationale.trim(), 'unbound semantic region transform');
      requireThat(part.targetAnchorBinding && typeof part.targetAnchorBinding==='string', 'target anchor binding required');
    } else requireThat(a === geometry.masterScale, 'independent part scale requires explicit versioned semantic region design');
    requireThat(exact(part.targetAnchor,[a*part.sourceAnchor[0]+tx,d*part.sourceAnchor[1]+ty]), 'anchor placement mismatch');
    requireThat(Array.isArray(part.occludes) && part.occludes.every(role=>config.roles.indexOf(role) >= 0 && config.roles.indexOf(role) < index), 'invalid occlusion dependency');
    const mask = decodeCodexPng(await checked(part.mask));
    requireThat(mask.channels === 4 && mask.width === config.canvas.width && mask.height === config.canvas.height && exact(occupiedBounds(mask),part.occupiedBounds), 'mask occupied bounds mismatch');
    const bounds=part.occupiedBounds;
    requireThat(bounds && bounds[0]>=part.cropRect[0] && bounds[1]>=part.cropRect[1] && bounds[0]+bounds[2]<=part.cropRect[0]+part.cropRect[2] && bounds[1]+bounds[3]<=part.cropRect[1]+part.cropRect[3], 'mask outside measured crop');
  }
  if(geometry.states) {
    requireThat(geometry.states.length>0, 'active states required');
    for(const state of geometry.states) {
      requireThat(state.roles?.length && new Set(state.roles).size===state.roles.length && state.roles.every(role=>config.roles.includes(role)), 'invalid simultaneously visible roles');
      const owners=geometry.parts.filter(p=>state.roles.includes(p.role) && p.neckSeamOwnership==='owns');
      requireThat(owners.length===1 && owners[0].role===state.neckOwner, 'one neck owner required per active state');
      const ownership=new Set();
      for(const role of state.roles) {
        const part=geometry.parts.find(p=>p.role===role);
        requireThat(part.sourcePixels, 'explicit source pixel ownership required per part');
        const record=strictJSONParse((await checked(part.sourcePixels)).toString('utf8'));
        requireThat(record.masterSha256===geometry.sourceMasterSha256 && Array.isArray(record.indices) && record.indices.every(i=>Number.isInteger(i)&&i>=0) && new Set(record.indices).size===record.indices.length, 'invalid source pixel ownership');
        for(const pixel of record.indices) {requireThat(!ownership.has(pixel), 'duplicate source pixels among simultaneously visible roles');ownership.add(pixel);}
      }
    }
  } else {
    requireThat(!geometry.referenceMeasurements, 'measured project geometry requires active states');
    requireThat(geometry.parts.filter(p=>p.neckSeamOwnership==='owns').length===1 && geometry.parts.find(p=>p.neckSeamOwnership==='owns').role===geometry.neckOwner, 'single neck owner required');
  }
  return geometry;
}
function occupiedBounds(image) {
  let left=image.width,top=image.height,right=-1,bottom=-1;
  for(let y=0;y<image.height;y++) for(let x=0;x<image.width;x++) if(image.pixels[(y*image.width+x)*4+3]>0) {left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  return right<0 ? null : [left,top,right-left+1,bottom-top+1];
}
export function pngBytes(width,height,pixels) {
  const chunk=(type,data)=>{const body=Buffer.concat([Buffer.from(type),data]); let crc=0xffffffff;for(const byte of body){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}const out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);body.copy(out,4);out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);return out;};
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  const rows=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++) pixels.copy(rows,y*(width*4+1)+1,y*width*4,(y+1)*width*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
export async function preview(configPath,outputPath,{draft=false,stateName}={}) {
  const config=await json(configPath); configCheck(config); const geometry=await geometryCheck(config,{draft});
  const master=geometry.master ? decodeCodexPng(await checked(geometry.master)) : null, pixels=Buffer.alloc(config.canvas.width*config.canvas.height*4);
  const state=geometry.states?.find(s=>s.name===stateName);
  requireThat(!geometry.states || state, 'explicit valid state required for preview');
  // All masks are already registered to the one master; no per-part fitting.
  for(const [index,part] of geometry.parts.entries()) {
    if(state && !state.roles.includes(part.role)) continue;
    const mask=decodeCodexPng(await checked(part.mask));
    for(let i=0;i<pixels.length;i+=4) if(mask.pixels[i+3]>0) {for(let c=0;c<3;c++) pixels[i+c]=master ? master.pixels[i+c] : (index*67+c*83+60)%256;pixels[i+3]=master ? Math.round(master.pixels[i+3]*mask.pixels[i+3]/255) : mask.pixels[i+3];}
  }
  const bytes=pngBytes(config.canvas.width,config.canvas.height,pixels);
  await mkdir(dirname(outputPath),{recursive:true});await writeFile(outputPath,bytes,{flag:'wx'});
  const receipt={schema:'paperdoll-mask-preview.v1',geometrySha256:config.geometry.sha256,masterSha256:geometry.master?.sha256 ?? null,state:stateName ?? null,output:{path:outputPath,sha256:hash(bytes)},parts:geometry.parts.map(p=>({role:p.role,occupiedBounds:p.occupiedBounds,cropRect:p.cropRect,pivot:p.pivot,targetAnchor:p.targetAnchor,mask:p.mask})),status:draft?'draft-schematic-not-dispatch-or-import-approval':'template-preview-not-artwork-review'};
  await publish(outputPath+'.json',receipt);return receipt;
}
async function inputCheck(input, config) {
  fields(input, ['schema', 'personId', 'characterId', 'name', 'adult', 'sameOwnerRecipient', 'source', 'registry', 'stage', 'parameters', 'output']);
  requireThat(input.schema === 'paperdoll-input.v1' && input.adult === true && input.sameOwnerRecipient === true, 'explicit adult and same-owner recipient assertions required');
  requireThat(/^person-[0-9]+$/.test(input.personId) && input.characterId === 'K' + input.personId.slice(7), 'source-ID mismatch');
  requireThat(config.subjects.some(subject => subject.name === input.name && subject.personId === input.personId && subject.characterId === input.characterId), 'subject identity not confirmed in config');
  fields(input.parameters, ['background']); requireThat(input.parameters.background === 'transparent', 'transparent background required');
  await checked(input.source);
  const registry = strictJSONParse((await checked(input.registry)).toString('utf8'));
  const matches = registry.entries?.filter(e => e.personId === input.personId);
  requireThat(matches?.length === 1 && matches[0].characterId === input.characterId && matches[0].name === input.name && matches[0].image?.sha256 === input.source.sha256, 'source registry identity/hash mismatch');
  requireThat(resolve(dirname(input.registry.path), matches[0].image.path) === input.source.path, 'source registry path mismatch');
  absolute(input.output); requireThat(input.output.endsWith('.png') && input.output !== input.source.path, 'new PNG output required');
}
export async function prepare(inputPath, configPath = resolve(here, 'config.json')) {
  const input = await json(inputPath), config = await json(configPath);
  configCheck(config); await geometryCheck(config); await inputCheck(input, config);
  const templateBytes = await readFile(resolve(here, 'templates.json')), template = strictJSONParse(templateBytes.toString('utf8'));
  requireThat(Object.hasOwn(template.stages, input.stage), 'unknown stage');
  const canvas = input.stage === 'living' ? config.requestCanvases.living : config.requestCanvases.single;
  const { width, height } = canvas;
  requireThat(width % 16 === 0 && height % 16 === 0 && width <= 3840 && height <= 3840 && width / height >= 1 / 3 && width / height <= 3 && width * height >= 655360 && width * height <= 8294400, 'canvas outside existing editor size contract');
  const prompt = [template.common, 'Measured registered geometry binding: ' + config.geometry.sha256 + '. Final transport canvas: ' + canonical(config.canvas) + '; native request canvas: ' + canonical(canvas) + '. Use the registered master and masks, not independently inferred scales. Geometry files remain operator inputs; this plan is not mask-capable backend execution proof.', template.stages[input.stage]].join('\n');
  const argv = ['--image', input.source.path, '--image', input.source.path, '--image', input.source.path, '--reference-roles', 'drawing-technique-only,framing-only,recipient-appearance-only', '--same-owner-recipient', 'true', '--expected-style-sha256', input.source.sha256, '--expected-identity-sha256', input.source.sha256, '--size', `${width}x${height}`, '--background', 'transparent', '--prompt', prompt, '-o', input.output];
  const body = {schema:'paperdoll-prepared.v1', status:'prepared-not-dispatched', input, config, templateVersion:template.version, templateSha256:hash(templateBytes), prompt, promptSha256:hash(prompt), parameters:{...input.parameters, size:`${width}x${height}`}, backend:resolve(here,'../image-generate.mjs'), argv};
  return {...body, bindingSha256:digest(body)};
}
export async function validatePlan(plan) {
  const {bindingSha256, ...body} = plan;
  requireThat(plan.schema === 'paperdoll-prepared.v1' && digest(body) === bindingSha256, 'prepared binding mismatch');
  configCheck(plan.config); await geometryCheck(plan.config); await inputCheck(plan.input, plan.config);
  const bytes = await readFile(resolve(here,'templates.json'));
  requireThat(hash(bytes) === plan.templateSha256 && hash(plan.prompt) === plan.promptSha256 && plan.templateVersion === strictJSONParse(bytes.toString('utf8')).version, 'stale template or prompt');
  // Rebuild from in-memory data without mutable temporary input files.
  const template = strictJSONParse(bytes.toString('utf8'));
  requireThat(Object.hasOwn(template.stages,plan.input.stage), 'unknown stage');
  const canvas = plan.input.stage === 'living' ? plan.config.requestCanvases.living : plan.config.requestCanvases.single;
  const prompt = [template.common, 'Measured registered geometry binding: ' + plan.config.geometry.sha256 + '. Final transport canvas: ' + canonical(plan.config.canvas) + '; native request canvas: ' + canonical(canvas) + '. Use the registered master and masks, not independently inferred scales. Geometry files remain operator inputs; this plan is not mask-capable backend execution proof.', template.stages[plan.input.stage]].join('\n');
  requireThat(prompt === plan.prompt && plan.backend === resolve(here,'../image-generate.mjs'), 'prepared execution mismatch');
  const size = `${canvas.width}x${canvas.height}`;
  const expected = ['--image',plan.input.source.path,'--image',plan.input.source.path,'--image',plan.input.source.path,'--reference-roles','drawing-technique-only,framing-only,recipient-appearance-only','--same-owner-recipient','true','--expected-style-sha256',plan.input.source.sha256,'--expected-identity-sha256',plan.input.source.sha256,'--size',size,'--background','transparent','--prompt',prompt,'-o',plan.input.output];
  requireThat(exact(plan.argv,expected) && exact(plan.parameters,{background:'transparent',size}), 'prepared arguments mismatch');
}
export async function dispatch(requestPath, options={}) {
  return maskedEdit(requestPath,options);
}
function reviewBinding(entry) {
  const {review, ...body} = entry; return digest(body);
}
export { reviewBinding };
export async function unityContract(ref) {
  const envelope=strictJSONParse((await checked(ref)).toString('utf8'));
  requireThat(envelope.integrity?.algorithm==='sha256' && envelope.integrity.scope==='UTF-8 JSON.stringify(contract,null,2) plus LF; insertion order as stored' && hash(JSON.stringify(envelope.contract,null,2)+'\n')===envelope.integrity.sha256,'Unity envelope payload integrity mismatch');
  const contract=envelope.contract;
  requireThat(contract?.contractVersion===4 && contract.receiptType==='Janseon.Data.Opening.PortraitPaperDollReceipt' && contract.subjects?.length===3 && exact(contract.orderedRoles,['hairBack','body','head','clothing','hairFront','deadHead','headlessBody']) && contract.receiptSchema?.movementStage && contract.receiptSchema.entries?.item,'Unity contract mismatch');
  return contract;
}
function movementCheck(movement,canvas) {
  fields(movement,['start','end','sampleOffset','cameraPosition','portraitSize','speed','orthographicSize']);
  const vector=(v,keys)=>v && exact(Object.keys(v).sort(),keys.slice().sort()) && keys.every(k=>Number.isFinite(v[k]));
  requireThat(['start','end','sampleOffset','cameraPosition'].every(k=>vector(movement[k],['x','y','z'])) && !exact(movement.start,movement.end),'explicit movement vectors and distinct endpoints required');
  requireThat(vector(movement.portraitSize,['x','y']) && movement.portraitSize.x>0 && movement.portraitSize.y>0 && movement.speed>0 && Number.isFinite(movement.speed) && movement.orthographicSize>0 && Number.isFinite(movement.orthographicSize),'explicit positive movement/framing values required');
  requireThat(Math.abs(movement.portraitSize.x/movement.portraitSize.y-canvas.width/canvas.height)<1e-12,'movement portraitSize must match derivative canvas aspect');
}
async function authoredBundleCheck(entry,config) {
  const binding=entry.authoredBundle; fields(binding,['manifest','artApproval','geometry']);
  const manifest= strictJSONParse((await checked(binding.manifest)).toString('utf8'));
  const approval= strictJSONParse((await checked(binding.artApproval)).toString('utf8'));
  const geometry= strictJSONParse((await checked(binding.geometry)).toString('utf8'));
  requireThat(manifest.schema==='paperdoll-art-delivery-candidate.v1' && manifest.personId===entry.personId && manifest.characterId===entry.characterId
    && exact(manifest.source,entry.source) && exact(manifest.canvas,[config.canvas.width,config.canvas.height]),'authored manifest identity/canvas mismatch');
  const sourceReview=approval.schema==='paperdoll-source-bound-poc-art-review.v1' && approval.verdict==='ROOT_APPROVED_EXACT_POC_ART_BUNDLE'
    && exact(approval.source,entry.source) && approval.scope?.sourceBoundPocArtwork===true;
  const bundleReview=approval.schema==='paperdoll-root-source-art-approval.v1' && approval.status==='ROOT_APPROVED_EXACT_POC_SOURCE_ART_BUNDLE'
    && approval.personId===entry.personId && approval.characterId===entry.characterId && approval.verified?.manifestHash===true;
  const exactRootReview=approval.status==='ROOT_APPROVED_EXACT_POC_ART_BUNDLE'
    && approval.personId===entry.personId && approval.characterId===entry.characterId
    && approval.verification?.manifestHashMatches===true && approval.verification?.allTextureHashes===7;
  requireThat((sourceReview || bundleReview || exactRootReview) && exact(approval.manifest,binding.manifest),'exact authored bundle art approval required');
  requireThat(geometry.schema==='paperdoll-registered-bundle-geometry.v1' && exact(geometry.manifest,binding.manifest)
    && exact(geometry.artApproval,binding.artApproval) && exact(geometry.canvas,config.canvas)
    && geometry.registration==='already-registered-common-plane' && geometry.parts?.length===7,'authored registered geometry mismatch');
  requireThat(manifest.provenance?.length>0,'actual multi-source authoring lineage required');
  for(const ref of manifest.provenance) await checked(ref);
  if(manifest.previousBundle) await checked(manifest.previousBundle);
  for(const role of config.roles) {
    const asset=manifest.roles?.[role]; requireThat(asset,'authored role missing');
    await checked({path:resolve(dirname(binding.manifest.path),asset.path),sha256:asset.sha256});
    if(asset.source) await checked({path:asset.source,sha256:asset.sourceSha256});
    const derivation=manifest.opacityPolicy?.derivations?.[role];
    if(derivation) {
      const inputs=geometry.derivationInputs?.[role];
      const source=inputs?.source ?? {path:derivation.source,sha256:derivation.sourceSha256};
      const mask=inputs?.mask ?? {path:resolve(dirname(binding.manifest.path),derivation.mask),sha256:derivation.maskSha256};
      requireThat(source.sha256===derivation.sourceSha256 && mask.sha256===derivation.maskSha256,'authored derivation input binding mismatch');
      await checked(source);await checked(mask);
    }
  }
  return {geometry,manifest};
}
export async function finalize(batchPath, outputPath, options={}) {
  return finalizeBatch(batchPath,outputPath,{checkOnly:options.checkOnly===true,entryOnly:false});
}
export async function checkEntry(batchPath) {
  return finalizeBatch(batchPath,batchPath+'.unused-unity.json',{checkOnly:true,entryOnly:true});
}
async function finalizeBatch(batchPath, outputPath, {checkOnly=false,entryOnly=false}={}) {
  const batch = await json(batchPath);
  fields(batch,['schema','config','entries','movementStage']);
  requireThat(batch.schema === 'paperdoll-batch.v1', 'batch schema mismatch');
  const config = strictJSONParse((await checked(batch.config)).toString('utf8')); configCheck(config);
  requireThat(config.unityContract, 'Unity seven-role v4 contract pending; no import handoff');
  const contract = await unityContract(config.unityContract);
  requireThat(exact(contract.orderedRoles,config.roles) && contract.subjects.every(subject=>config.subjects.some(s=>s.personId===subject.personId && s.characterId===subject.characterId && s.name===subject.name)), 'Unity subject/role contract mismatch');
  requireThat(entryOnly ? batch.entries?.length===1 : batch.entries?.length === 3 && new Set(batch.entries.map(e=>e.personId)).size === 3, entryOnly ? 'one entry required for validation only' : 'three distinct samples required');
  requireThat(batch.entries.every(entry=>entry.layers?.length===7 && entry.review),'seven ordered layers and final review required for every sample');
  movementCheck(batch.movementStage,config.canvas);
  const entries = [], allPaths = new Set();
  for (const entry of batch.entries) {
    fields(entry,['personId','characterId','name','source','registry','sourceSize','normalizationScale','normalizationOffset','layers','authoredBundle','composite','review']);
    requireThat(entry.layers?.length === config.roles.length, 'layers missing');
    const probe = {schema:'paperdoll-input.v1',personId:entry.personId,characterId:entry.characterId,name:entry.name,adult:true,sameOwnerRecipient:true,source:entry.source,registry:entry.registry,stage:'living',parameters:{background:'transparent'},output:outputPath+'.unused.png'};
    await inputCheck(probe,config);
    const original=decodeCodexPng(await checked(entry.source)),subject=contract.subjects.find(s=>s.personId===entry.personId);
    requireThat(subject?.characterId===entry.characterId && subject.sourceSha256===entry.source.sha256 && exact(subject.sourceSize,{x:original.width,y:original.height}) && exact(entry.sourceSize,subject.sourceSize),'original sourceSize/hash/identity mismatch');
    requireThat(entry.normalizationScale && exact(Object.keys(entry.normalizationScale).sort(),['x','y']) && Number.isFinite(entry.normalizationScale.x) && entry.normalizationScale.x>0 && entry.normalizationScale.x===entry.normalizationScale.y && entry.normalizationOffset && exact(Object.keys(entry.normalizationOffset).sort(),['x','y']) && ['x','y'].every(k=>Number.isFinite(entry.normalizationOffset[k])),'explicit uniform normalization and finite offset required');
    const authored=entry.authoredBundle ? await authoredBundleCheck(entry,config) : null;
    const geometry = authored ? authored.geometry : await geometryCheck(config);
    const geometrySha256=authored ? entry.authoredBundle.geometry.sha256 : config.geometry.sha256;
    requireThat(entry.composite?.status === 'checked' && entry.composite.geometrySha256 === geometrySha256 && typeof entry.composite.reviewer === 'string' && entry.composite.reviewer.trim(), 'actual geometry-bound composite check required');
    await checked(entry.composite.image); await checked(entry.composite.evidence);
    requireThat(entry.composite.layersSha256 === digest(entry.layers), 'stale composite check');
    const review = strictJSONParse((await checked(entry.review)).toString('utf8'));
    if(authored) {
      const authority=strictJSONParse((await checked(review.authority)).toString('utf8'));
      requireThat(authority.schema==='paperdoll-root-entry-authority.v1' && authority.verdict==='APPROVED_EXACT_POC_ENTRY_SETTINGS'
        && exact(authority.manifest,entry.authoredBundle.manifest) && exact(authority.artApproval,entry.authoredBundle.artApproval)
        && exact(authority.movementStage,batch.movementStage) && exact(authority.normalizationScale,entry.normalizationScale)
        && exact(authority.normalizationOffset,entry.normalizationOffset) && authority.personId===entry.personId
        && authority.sourceSha256===entry.source.sha256,'authored entry/settings authority mismatch');
    }
    requireThat(review.schema === 'paperdoll-review.v1' && review.verdict === 'pass' && review.scope==='APPROVED_FINAL_ART' && review.movementSha256===digest(batch.movementStage) && typeof review.reviewer === 'string' && review.reviewer.trim() && typeof review.evidence === 'string' && review.evidence.trim() && review.personId === entry.personId && review.characterId === entry.characterId && review.sourceSha256 === entry.source.sha256 && review.bindingSha256 === reviewBinding(entry), 'missing, wrong-identity or stale final art/movement review');
    const layers = [];
    for (const [index,layer] of entry.layers.entries()) {
      fields(layer,['role','path','sha256','prepared','native','processing']);
      requireThat(layer.role === config.roles[index] && !allPaths.has(layer.path) && layer.path !== entry.source.path, 'wrong role order or reused/original output'); allPaths.add(layer.path);
      const bytes = await checked({path:layer.path,sha256:layer.sha256}), png = decodeCodexPng(bytes);
      requireThat(png.width === config.canvas.width && png.height === config.canvas.height && png.channels === 4 && png.pixels.some((v,i)=>i%4===3 && v===0) && png.pixels.some((v,i)=>i%4===3 && (authored ? v>0 : v===255)), 'mixed dimensions, missing RGBA transparency or foreground');
      requireThat(exact(occupiedBounds(png),geometry.parts[index].occupiedBounds), 'export occupied bounds disagree with measured component');
      if(authored) {
        const asset=authored.manifest.roles[layer.role], part=geometry.parts[index];
        requireThat(Object.keys(layer).length===3 && layer.role===part.role && layer.sha256===asset.sha256
          && layer.path===resolve(dirname(entry.authoredBundle.manifest.path),asset.path)
          && part.sha256===layer.sha256 && part.path===layer.path && exact(part.transform,[1,0,0,1,0,0]),'authored layer/geometry binding mismatch');
        layers.push({role:layer.role,sha256:layer.sha256,sourcePath:layer.path}); continue;
      }
      const plan = strictJSONParse((await checked(layer.prepared)).toString('utf8')); await validatePlan(plan);
      requireThat(plan.input.personId === entry.personId && plan.input.characterId === entry.characterId && plan.input.source.sha256 === entry.source.sha256 && exact(plan.config,config), 'layer source-ID/config mismatch');
      const allowedStages = ['hairBack','head','clothing','hairFront'].includes(layer.role) ? ['living'] : layer.role === 'body' ? ['living','body-base'] : [layer.role];
      requireThat(allowedStages.includes(plan.input.stage), 'layer stage mismatch');
      const nativeBytes = await checked(layer.native), native = decodeCodexPng(nativeBytes);
      const preservationPath = resolve(plan.input.output+'.native','preservation.json');
      const preservation = await json(preservationPath);
      const expectedRoles = ['drawing-technique-only','framing-only','recipient-appearance-only'];
      requireThat(preservation.schema === 'native-output-preservation.v1' && preservation.outputs?.some(o=>o.path===layer.native.path && o.imageSha256===layer.native.sha256) && preservation.request?.sourceSnapshot?.prompt === plan.prompt && preservation.request?.size === plan.parameters.size && preservation.request?.references?.length === 3 && preservation.request.references.every((r,i)=>r.sha256===entry.source.sha256 && r.role===expectedRoles[i]), 'native request/source binding mismatch');
      requireThat(`${native.width}x${native.height}` === plan.parameters.size, 'native size mismatch');
      fields(layer.processing,['transforms','masks','geometrySha256','partTransform']);
      const part = geometry.parts[index];
      requireThat(layer.processing && Array.isArray(layer.processing.transforms) && Array.isArray(layer.processing.masks) && layer.processing.geometrySha256 === config.geometry.sha256 && exact(layer.processing.partTransform,part.transform) && layer.processing.masks.some(mask=>exact(mask,part.mask)), 'explicit geometry-bound transforms/component masks required');
      for(const mask of layer.processing.masks) await checked(mask);
      if (layer.native.sha256 !== layer.sha256) requireThat(layer.processing.transforms.length > 0, 'changed output needs processing record');
      requireThat(layer.processing.transforms.every(t=>typeof t === 'string' && t.trim()), 'invalid processing transform');
      layers.push({role:layer.role,sha256:layer.sha256,sourcePath:layer.path});
    }
    entries.push({personId:entry.personId,characterId:entry.characterId,sourceSha256:entry.source.sha256,reviewSha256:entry.review.sha256,sourceSize:entry.sourceSize,normalizationScale:entry.normalizationScale,normalizationOffset:entry.normalizationOffset,layers});
  }
  const receipt = {slot:contract.receiptSchema.slot.const,reviewVerdict:contract.receiptSchema.reviewVerdict.const,entries,movementStage:batch.movementStage};
  if(!checkOnly) await publish(outputPath,receipt); return receipt;
}
export async function main(args) {
  const [command,...values] = args;
  if(command==='prepare' && (values.length===2 || values.length===3)) {
    const [input,out,config] = values; const plan = await prepare(resolve(input),config ? resolve(config) : undefined);
    await publish(resolve(out),plan); return {status:plan.status,bindingSha256:plan.bindingSha256,prepared:resolve(out)};
  }
  if(command==='dispatch' && (values.length===1 || values.length===2&&values[1]==='--check')) return dispatch(resolve(values[0]),{checkOnly:values[1]==='--check'});
  if(command==='preview' && values.length===2) return preview(resolve(values[0]),resolve(values[1]));
  if(command==='draft-preview' && values.length===3) return preview(resolve(values[0]),resolve(values[1]),{draft:true,stateName:values[2]});
  if(command==='finalize' && values.length===2) return finalize(resolve(values[0]),resolve(values[1]));
  if(command==='check-entry' && values.length===1) {await checkEntry(resolve(values[0]));return {status:'entry-validated-not-published'};}
  if(command==='finalize' && values.length===3 && values[2]==='--check') {
    const receipt=await finalize(resolve(values[0]),resolve(values[1]),{checkOnly:true});
    return {status:'validated-not-published',entries:receipt.entries.length};
  }
  throw new Error('Usage: workflow.mjs prepare INPUT PREPARED [CONFIG] | preview CONFIG PNG | dispatch PREPARED | finalize BATCH UNITY_RECEIPT');
}
if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await main(process.argv.slice(2)))); }
  catch(error) { console.error(error.message); process.exitCode=2; }
}
