import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { previewPortrait } from '../index.mjs';
import { strictJSONParse, parse, replacementBoundarySchema, readablePositionProjection, clothingPolicySchema } from './design-prompt.mjs';
import { neutralRecord } from '../neutral-slots.mjs';
import { selectFace } from './face-selection.mjs';
import { loadPortraitPackage } from './portrait-package.mjs';
import { runGeneration } from './image-generate.mjs';
import { decodeCodexPng } from './codex-image.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const metrics = ['chinY','crownY','headLeft','headRight','leftPupilX','leftPupilY','rightPupilX','rightPupilY','eyeY','topGap','headCenterX','headCenterY'];
const SHA = /^[a-f0-9]{64}$/;
function closed(value, keys, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort())) throw new Error('closed ' + name + ' schema mismatch');
}
function trustedRegistry(trust) {
  if (!trust || !(trust.registryBytes instanceof Uint8Array) || !SHA.test(trust.registrySHA ?? '') || hash(trust.registryBytes) !== trust.registrySHA) throw new Error('externally pinned trust registry required; provider calls: 0');
  const registry = strictJSONParse(Buffer.from(trust.registryBytes).toString());
  if (registry.schema === 'private-k028-input-trust-registry.v1') {
    closed(registry, ['schema','scope','source','ownerDecision','pins','existingRuleVersion','criterionScopes','sourceSHA','outputAcceptance','semanticProofBeforeHTTP'], 'private registry');
    closed(registry.pins, ['sourcePolicy','rule','authority','positionReference','concurrence','alphaRule'], 'private pins');
    for (const pin of Object.values(registry.pins)) { closed(pin,['path','sha256'],'pin'); if (!SHA.test(pin.sha256)) throw new Error('invalid private pin'); }
    closed(registry.ownerDecision,['path','sha256','events'],'owner event pins');
    if (registry.scope !== 'COMPLETE_SOURCE_INPUT_NOT_OUTPUT_ACCEPTANCE' || registry.outputAcceptance !== false || registry.semanticProofBeforeHTTP !== false || !SHA.test(registry.sourceSHA)) throw new Error('private registry scope invalid');
    return registry;
  }
  closed(registry, ['schema','approvalId','entries','semanticEvidence'], 'registry');
  if (registry.schema !== 'complete-source-trusted-registry.v1' || typeof registry.approvalId !== 'string' || !registry.approvalId.trim() || !Array.isArray(registry.entries) || !Array.isArray(registry.semanticEvidence)) throw new Error('invalid trusted registry');
  for (const e of registry.entries) {
    closed(e, ['characterId','lookId','policySHA','ruleSHA','authoritySHA','ownerDecisionSHA','rawReferenceSHA','referenceVersion','criterionScopes','authorityContent','ruleContent'], 'registry entry');
    if (!['policySHA','ruleSHA','authoritySHA','ownerDecisionSHA','rawReferenceSHA'].every(k => SHA.test(e[k])) || !isDeepStrictEqual(e.criterionScopes, ['position','natural-cut','bottom-garment-contact','background'])) throw new Error('invalid registry scope/hash');
  }
  for (const e of registry.semanticEvidence) {
    closed(e, ['imageSHA','policySHA','assessorEvidenceSHA','criterionScope'], 'semantic registry entry');
    if (!['imageSHA','policySHA','assessorEvidenceSHA'].every(k => SHA.test(e[k])) || e.criterionScope !== 'bottom-garment-contact') throw new Error('invalid semantic registry scope');
  }
  return registry;
}
const instruction = 'Generate a COMPLETE new whole-canvas candidate, not a masked patch. Follow only the sourced boundary policy, preserve a natural uncut top and side silhouette, and bring the connected torso garment to the bottom contact row. Do not invent numeric margins from position bounds. No clipping, tiles or subject stretching. Authored appearance slots override every reference. Face references supply face only, technique supplies drawing technique only, and the mannequin supplies coordinated orientation and body pose only. Latest approved position-reference.v2 exact rational metrics exclusively own numeric head size, crown, eye, chin and framing positions; no mannequin numeric framing authority. Never copy donor hair or clothing. No exact outside-pixel preservation is promised.';

function pointer(document, path) {
  if (typeof path !== 'string' || !path.startsWith('/') || /~(?:[^01]|$)/.test(path)) throw new Error('invalid boundary source pointer');
  let value = document;
  for (const key of path.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    if (!value || !Object.hasOwn(value, key)) throw new Error('unresolved boundary source pointer');
    value = value[key];
  }
  return value;
}

function policyCanvas(policy, width, height) {
  const p = replacementBoundarySchema.parse(policy);
  const bands = p.boundary.padding;
  if (p.canvas.width !== width || p.canvas.height !== height || width <= 0 || height <= 0 || p.bottomContact.row !== height - 1) throw new Error('boundary policy canvas/contact mismatch');
  if (p.boundary.mode === 'authored-numeric-bands' ? !bands : bands !== null) throw new Error('boundary policy mode/padding mismatch');
  if (bands && (bands.bottom !== 0 || bands.left + bands.right >= width || bands.top >= height)) throw new Error('boundary padding conflicts with canvas or required garment bottom contact');
  return p;
}

async function sourcedPolicy(input, width, height, trust) {
  for (const [key, digest] of [['boundaryPolicyBytes', 'boundaryPolicySHA'], ['ruleBytes', 'ruleSHA'], ['authorityBytes', 'authoritySHA']]) {
    if (!(input[key] instanceof Uint8Array) || hash(input[key]) !== input[digest]) throw new Error('required immutable boundary policy/rule/authority bytes and SHA; provider calls: 0');
  }
  const policy = policyCanvas(strictJSONParse(Buffer.from(input.boundaryPolicyBytes).toString()), width, height);
  const registry = trustedRegistry(trust);
  const look = strictJSONParse(Buffer.from(input.lookBytes).toString());
  let entry;
  const privateInput = registry.schema === 'private-k028-input-trust-registry.v1';
  if (privateInput) {
    if (look.characterId !== 'K028' || input.sourceSHA !== registry.sourceSHA || typeof trust.readEvidence !== 'function') throw new Error('private registry recipient/source mismatch');
    const pinned = {};
    for (const [name,pin] of Object.entries(registry.pins)) { const b=await trust.readEvidence(pin.path); if(hash(b)!==pin.sha256)throw new Error('private registry pinned bytes mismatch: '+name); pinned[name]=strictJSONParse(Buffer.from(b).toString()); }
    const eventsBytes=await trust.readEvidence(registry.ownerDecision.path);
    if(hash(eventsBytes)!==registry.ownerDecision.sha256)throw new Error('owner events hash mismatch');
    const events=strictJSONParse(Buffer.from(eventsBytes).toString());
    if(events.schema!=='private-owner-decision-events.v1'||events.events.length!==registry.ownerDecision.events.length)throw new Error('owner events scope mismatch');
    for(const pin of registry.ownerDecision.events){closed(pin,['eventId','rawEventSHA','sourceTranscript'],'event pin');const event=events.events.find(e=>e.id===pin.eventId);if(!event||event.message?.role!=='user'||!event.timestamp||hash(Buffer.from(JSON.stringify(event)))!==pin.rawEventSHA)throw new Error('raw owner event proof mismatch');}
    entry={policySHA:registry.pins.sourcePolicy.sha256,ruleSHA:registry.pins.rule.sha256,authoritySHA:registry.pins.authority.sha256,rawReferenceSHA:registry.pins.positionReference.sha256,referenceVersion:registry.existingRuleVersion,ruleContent:pinned.rule,authorityContent:pinned.authority};
  } else entry = registry.entries.find(e => e.characterId === look.characterId && e.lookId === look.lookId && e.policySHA === input.boundaryPolicySHA);
  if (!entry || entry.policySHA !== input.boundaryPolicySHA || entry.ruleSHA !== input.ruleSHA || entry.authoritySHA !== input.authoritySHA || entry.referenceVersion !== policy.referenceVersion) throw new Error('authority not approved by external registry; provider calls: 0');
  const rule = strictJSONParse(Buffer.from(input.ruleBytes).toString());
  if (!isDeepStrictEqual(rule, entry.ruleContent)) throw new Error('rule differs from closed pinned registry content');
  closed(rule, privateInput ? ['schemaVersion','referenceVersion','adapterSchema','rawReference','concurrence','position','alphaRule','semanticBoundary'] : ['schemaVersion','referenceVersion','adapterSchema','rawReference','concurrence','position'], 'rule');
  closed(rule.rawReference, ['path','sha256','ruleVersion','sourceManifestSHA256','observationsSHA256'], 'raw reference binding');
  closed(rule.concurrence, ['path','sha256'], 'concurrence binding');
  if (rule.schemaVersion !== 2 || rule.referenceVersion !== policy.referenceVersion || policy.positionBounds.ruleSHA !== input.ruleSHA) throw new Error('boundary position-v2 rule binding mismatch; provider calls: 0');
  const position = pointer(rule, policy.positionBounds.pointer);
  closed(position, privateInput ? ['unit','sourceCoordinateSystem','authorityScope','measurementProofStatus','positionReferenceAuthority','metrics','acceptanceLimits'] : ['unit','sourceCoordinateSystem','authorityScope','measurementProofStatus','positionReferenceAuthority','metrics'], 'position');
  if(privateInput){closed(rule.alphaRule,['source','background','foregroundCoreMinimum','minimumCoreFraction','foregroundDenominator','antialiasedFringe','alpha255Required','rejectedRawOutput'],'rule alpha');closed(rule.alphaRule.source,['path','sha256','pointer'],'rule alpha source');closed(rule.semanticBoundary,['leftRight','numericMargin','garmentBottom','backgroundResidue'],'semantic boundary');if(rule.alphaRule.source.sha256!==registry.pins.alphaRule.sha256||rule.semanticBoundary.numericMargin!==null)throw new Error('rule alpha/boundary scope mismatch');}
  if (position.unit !== 'px' || position.sourceCoordinateSystem !== 'top-left-x-right-y-down' || position.authorityScope !== 'POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME' || position.measurementProofStatus !== 'AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS' || position.positionReferenceAuthority !== true || rule.adapterSchema !== 'complete-source-position-rule-adapter.v1' || typeof trust.readEvidence !== 'function') throw new Error('boundary position-v2 scope required; provider calls: 0');
  const rawBytes = await trust.readEvidence(rule.rawReference.path);
  if (hash(rawBytes) !== entry.rawReferenceSHA || rule.rawReference.sha256 !== entry.rawReferenceSHA) throw new Error('raw reference registry hash mismatch');
  const raw = strictJSONParse(Buffer.from(rawBytes).toString());
  closed(raw, ['schema','ruleVersion','sourceManifestSHA256','observationsSHA256','sourceSetAuthority','measurementProofStatus','framePassAuthority','canvas','formulas','metrics','rows','sourceCutPolicy','positionReferenceAuthority','positionMeasurementGaps','authorityScope','cutAuthority','backgroundAuthority'], 'raw position');
  if(privateInput){closed(raw.formulas,['meanMidpoint','meanInterval','inner','outer','eyeY','headCenterX','headCenterY'],'position formulas');closed(raw.authorityScope,['position','sourceCuts','background','frame'],'raw authority scopes');}
  if (raw.schema !== 'latest-approved16-second-observer-fixed-rules.v2' || raw.ruleVersion !== entry.referenceVersion || raw.positionReferenceAuthority !== true || raw.sourceSetAuthority !== 'OWNER_RATIFIED_EXACT16' || raw.measurementProofStatus !== position.measurementProofStatus || raw.framePassAuthority !== false || raw.cutAuthority !== 'FAIL' || raw.backgroundAuthority !== 'UNVERIFIED' || raw.positionMeasurementGaps.length || !isDeepStrictEqual(raw.canvas, [width,height]) || raw.sourceManifestSHA256 !== rule.rawReference.sourceManifestSHA256 || raw.observationsSHA256 !== rule.rawReference.observationsSHA256) throw new Error('raw position authority/version/source hash disagreement');
  closed(raw.metrics, metrics, 'required position metrics');
  for (const name of metrics) {
    const m = raw.metrics[name];
    closed(m, ['sampleCount','meanMidpoint','meanInterval','inner','outer','measurementStatus','exactPixelCertification','passAuthority','positionReferenceAuthority','passAuthorityScope'], 'position metric');
    if (m.sampleCount !== 16 || m.measurementStatus !== position.measurementProofStatus || m.positionReferenceAuthority !== true || m.passAuthority !== true || m.exactPixelCertification !== false || m.passAuthorityScope !== position.authorityScope || ![m.meanMidpoint,...m.meanInterval,...m.inner,...m.outer].every(v => typeof v === 'string' && /^-?\d+(?:\/[1-9]\d*)?$/.test(v))) throw new Error('invalid exact rational position metric');
  }
  if (!Array.isArray(raw.rows) || raw.rows.length !== 16 || new Set(raw.rows.map(r => r.id)).size !== 16) throw new Error('position source set must be exact16');
  for (const row of raw.rows) { closed(row, ['id','positionIntervals'], 'position row'); closed(row.positionIntervals, metrics, 'row metrics'); }
  for (const [name,m] of Object.entries(position.metrics)) if (!metrics.includes(name) || !isDeepStrictEqual(m, raw.metrics[name])) throw new Error('position adapter metrics disagree with raw reference');
  const authority = strictJSONParse(Buffer.from(input.authorityBytes).toString());
  if (privateInput) {
    closed(authority,['schema','scope','ownerDecision','sourceSHA','existingRuleVersion','reference','authorizedCriteria','outputEvidence'],'operator authority');
    closed(authority.ownerDecision,['path','sha256','eventIDs','externalTranscript'],'operator owner binding');
    closed(authority.reference,['path','sha256','criterionScope'],'operator reference');
    closed(authority.outputEvidence,['status','candidateSHA','semanticGarmentSeed','accepted'],'output evidence');
    const criteria=authority.authorizedCriteria;
    closed(criteria,['canvas','position','side','bottom','alpha','sourcePreservation','roleClothing','generation','publication'],'criterion scopes');
    const criterionKeys={canvas:['width','height','unit'],position:['metrics','sourceReferenceSHA','newTolerance'],side:['mode','padding','completeNaturalSilhouette','abruptCutsAllowed'],bottom:['row','subject','required'],alpha:['source','background','foregroundCoreMinimum','minimumCoreFraction','foregroundDenominator','antialiasedFringe','alpha255Required','rejectedRawOutput'],sourcePreservation:['originals','approvedHashes','history','newCandidateDistinctFile','completeSourceExactOriginalPixelEqualityClaim'],roleClothing:['explicitOccupationRequired','affiliationAloneInsufficient','protectedAuthoredSlots'],generation:['correctionAndNecessaryRegenerationAuthorized','rawPreservationBeforeQA','postGenerationSemanticProofRequired'],publication:['whole100GenuinePASSRequired','inputPolicyConveysWholePASS']};
    for(const [k,keys]of Object.entries(criterionKeys))closed(criteria[k],keys,'criterion '+k);
    closed(criteria.alpha.source,['path','sha256','pointer'],'alpha source');
    if (!isDeepStrictEqual(authority,entry.authorityContent)||!isDeepStrictEqual(criteria,registry.criterionScopes)||authority.schema!=='operator-owner-input-authority.v2'||authority.scope!=='K028_COMPLETE_SOURCE_INPUT_ONLY'||authority.sourceSHA!==input.sourceSHA||authority.existingRuleVersion!==raw.ruleVersion||authority.reference.sha256!==entry.rawReferenceSHA||authority.ownerDecision.sha256!==registry.ownerDecision.sha256||!isDeepStrictEqual(authority.ownerDecision.eventIDs,registry.ownerDecision.events.map(e=>e.eventId))||authority.outputEvidence.accepted!==false||authority.outputEvidence.candidateSHA!==null||authority.outputEvidence.semanticGarmentSeed!==null)throw new Error('operator authority fields/version disagreement');
    if(policy.authority.documentSHA!==input.authoritySHA||policy.authority.pointer!=='/authorizedCriteria'||!isDeepStrictEqual(criteria.canvas,{...policy.canvas,unit:policy.unit})||criteria.position.newTolerance!==false||criteria.position.sourceReferenceSHA!==entry.rawReferenceSHA||criteria.side.mode!==policy.boundary.mode||!isDeepStrictEqual(criteria.side.padding,policy.boundary.padding)||!isDeepStrictEqual(criteria.bottom,policy.bottomContact))throw new Error('operator policy/criterion scope mismatch');
    return {policy,raw,registrySHA:trust.registrySHA};
  }
  closed(authority, ['schema','authorship','ownerDecisionRecord','approved','criteriaSourcePolicy','alphaNumericalAuthority','authorization'], 'authority');
  closed(authority.ownerDecisionRecord, ['path','sha256','pointer'], 'owner decision binding');
  closed(authority.approved, ['status','scope','source','unit','canvas','referenceVersion','positionBounds','boundary','bottomContact'], 'approved authority');
  closed(authority.criteriaSourcePolicy, ['leftRight','numericMargin','garmentBottom','backgroundResidue'], 'criteria source policy');
  closed(authority.alphaNumericalAuthority, ['source','background','foregroundCoreMinimum','minimumCoreFraction','foregroundDenominator','antialiasedFringe','alpha255Required','rejectedRawOutput'], 'alpha authority');
  closed(authority.alphaNumericalAuthority.source, ['path','sha256','pointer'], 'alpha source');
  closed(authority.authorization, ['requestedPortraitCorrectionAndNecessaryRegeneration','originalsApprovedHashesHistoryPreserved','inputPolicyOnly','outputAcceptance','publication','paidCallInThisUnit'], 'authorization');
  if (authority.schema !== 'owner-authored-boundary-authority.v1' || authority.authorization.inputPolicyOnly !== true || authority.authorization.outputAcceptance !== false || authority.authorization.publication !== false || authority.authorization.paidCallInThisUnit !== false) throw new Error('authority status/scope invalid');
  if (!isDeepStrictEqual(authority, entry.authorityContent) || authority.ownerDecisionRecord?.sha256 !== entry.ownerDecisionSHA) throw new Error('authority not exact closed registry-approved content');
  if (hash(await trust.readEvidence(authority.ownerDecisionRecord.path)) !== entry.ownerDecisionSHA) throw new Error('owner decision bytes not registry pinned');
  if (hash(await trust.readEvidence(rule.concurrence.path)) !== rule.concurrence.sha256) throw new Error('concurrence bytes differ from registry rule');
  const approved = pointer(authority, policy.authority.pointer);
  if (policy.authority.documentSHA !== input.authoritySHA || !['authored', 'source-approved'].includes(approved?.status) || approved.scope !== 'complete-source-boundary' || typeof approved.source !== 'string' || !approved.source.trim()) throw new Error('sourced user boundary authority required; provider calls: 0');
  for (const key of ['unit', 'canvas', 'referenceVersion', 'positionBounds', 'boundary', 'bottomContact']) if (!isDeepStrictEqual(approved[key], policy[key])) throw new Error('boundary policy differs from sourced authority; provider calls: 0');
  return { policy, raw, registrySHA: trust.registrySHA };
}

export function validateReplacementPadding(bytes, policy, observation = null, policySHA = hash(Buffer.from(JSON.stringify(policy))), trust = null) {
  const image = decodeCodexPng(bytes);
  policy = policyCanvas(policy, image.width, image.height);
  const padding = policy.boundary.padding;
  if (image.channels !== 4) throw new Error('complete replacement requires RGBA');
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    if (padding && (x < padding.left || x >= image.width - padding.right || y < padding.top) && image.pixels[(y * image.width + x) * 4 + 3] !== 0) throw new Error('complete replacement silhouette crosses transparent padding; raw whole canvas retained');
  }
  let bottomContact = { status: 'UNVERIFIED', blocked: true, reason: 'candidate-bound semantic garment observation required', componentConnected: null };
  if (observation) {
    if (!(observation.bytes instanceof Uint8Array) || hash(observation.bytes) !== observation.sha256) throw new Error('stale garment observation bytes');
    const proof = strictJSONParse(Buffer.from(observation.bytes).toString());
    closed(proof, ['imageSHA','policySHA','subject','status','source','seed'], 'semantic proof');
    const registry = trustedRegistry(trust);
    if (!registry.semanticEvidence?.some(e => e.imageSHA === hash(bytes) && e.policySHA === policySHA && e.assessorEvidenceSHA === observation.sha256 && e.criterionScope === 'bottom-garment-contact')) throw new Error('semantic assessor evidence not externally pinned');
    if (proof.imageSHA !== hash(bytes) || proof.policySHA !== policySHA || proof.subject !== 'connected-torso-garment' || !['authored', 'source-approved'].includes(proof.status) || typeof proof.source !== 'string' || !proof.source.trim() || !Array.isArray(proof.seed) || proof.seed.length !== 2) throw new Error('invalid candidate-bound semantic garment proof');
    const [sx, sy] = proof.seed;
    if (![sx, sy].every(Number.isSafeInteger) || sx < 0 || sx >= image.width || sy < 0 || sy >= image.height - 1 || !image.pixels[(sy * image.width + sx) * 4 + 3]) throw new Error('semantic garment seed must be visible above bottom row');
    const seen = new Uint8Array(image.width * image.height), queue = [sy * image.width + sx]; seen[queue[0]] = 1;
    let contact = false;
    for (let at = 0; at < queue.length; at++) {
      const i = queue[at], x = i % image.width, y = Math.floor(i / image.width);
      if (y === image.height - 1) contact = true;
      for (const next of [x > 0 ? i - 1 : -1, x + 1 < image.width ? i + 1 : -1, y > 0 ? i - image.width : -1, y + 1 < image.height ? i + image.width : -1]) if (next >= 0 && !seen[next] && image.pixels[next * 4 + 3] > 0) { seen[next] = 1; queue.push(next); }
    }
    bottomContact = { status: contact ? 'PASS' : 'FAIL', blocked: !contact, componentConnected: contact, componentPixels: queue.length, imageSHA: proof.imageSHA, observationSHA: observation.sha256, scope: 'semantic-identified-garment-component-bottom-contact-only' };
  }
  return { padding, backgroundBands: padding ? 'validated-authorized-bands-only' : 'not-numerically-judged', bottomContact, blocked: true, naturalGarmentSilhouette: 'UNVERIFIED', cutContact: 'UNVERIFIED', subjectStretch: 'UNVERIFIED' };
}

export async function prepareCompleteReplacement(input, trust = null) {
  const clothingPolicy = clothingPolicySchema.parse(input.clothingPolicy ?? {schema:'avatar-clothing-policy.v1',...Object.fromEntries(['eraBaseline','tier','tierLayerPreference','surfaceExposure','winterProtection'].map(k=>[k,{value:null,status:'unknown',source:null}]))});
  for (const name of ['eraBaseline','tier','tierLayerPreference','surfaceExposure','winterProtection']) {
    const field=clothingPolicy[name];
    if(field.status==='unknown')continue;
    if(field.source.kind==='canonical-document'){
      if(typeof trust?.readClothingSource!=='function')throw new Error('immutable canonical clothing source reader required; provider calls: 0');
      const bytes=await trust.readClothingSource(field.source.documentSHA);
      if(!(bytes instanceof Uint8Array)||hash(bytes)!==field.source.documentSHA)throw new Error('clothing source SHA mismatch; provider calls: 0');
      const value=pointer(strictJSONParse(Buffer.from(bytes).toString()),field.source.jsonPointer);
      if(field.source.value!==field.value || value!==field.value && value?.value!==field.value)throw new Error('clothing field differs from canonical source; provider calls: 0');
    }else{
      const pin=trust?.clothingEventRegistry;
      if(!pin || !(pin.bytes instanceof Uint8Array) || hash(pin.bytes)!==pin.sha256 || pin.sha256!==field.source.operatorPinnedEventRegistrySHA || typeof trust.readOwnerEvent!=='function')throw new Error('operator-pinned owner event registry required; provider calls: 0');
      const registry=strictJSONParse(Buffer.from(pin.bytes).toString());
      closed(registry,['schema','entries'],'clothing event registry');
      if(registry.schema!=='clothing-owner-event-registry.v1'||!Array.isArray(registry.entries))throw new Error('invalid clothing event registry');
      for(const entry of registry.entries)closed(entry,['field','eventId','eventSHA','textRange','normalizedValue'],'clothing event approval');
      const entry=registry.entries.find(e=>e.field===name&&e.eventId===field.source.eventId&&e.eventSHA===field.source.eventSHA&&e.normalizedValue===field.value&&isDeepStrictEqual(e.textRange,field.source.textRange));
      const bytes=await trust.readOwnerEvent(field.source.eventId);
      if(!entry || !(bytes instanceof Uint8Array) || hash(bytes)!==field.source.eventSHA || field.source.normalizedValue!==field.value)throw new Error('forged owner event binding; provider calls: 0');
      const event=strictJSONParse(Buffer.from(bytes).toString());
      const text=event.message?.content?.filter(c=>c.type==='text').map(c=>c.text).join('\n');
      const [start,end]=field.source.textRange;
      if(event.id!==field.source.eventId||event.message?.role!=='user'||typeof text!=='string'||start>=end||end>text.length||!text.slice(start,end).trim())throw new Error('invalid owner prose text range; provider calls: 0');
    }
  }
  if (['readableProjection','projectedText','generationText','projectionJSON','textSHA','scopeHash'].some(k=>Object.hasOwn(input,k))) throw new Error('caller readable prose override rejected; provider calls: 0');
  if (Object.hasOwn(input, 'trustedRegistry') || Object.hasOwn(input, 'registryBytes') || Object.hasOwn(input, 'registrySHA')) throw new Error('trust configuration must be separate from candidate input');
  if (input.composition?.frameContractVersion !== 'position-reference.v2') throw new Error('stale generation composition/reference binding; provider calls: 0');
  const { lookBytes, originalLookBytes, sourcePath, sourceSHA, expected, activatedSlots, packageRoot, manifestPath = 'portrait-package.json', catalogPath, canonicalRoot = null, lineageEligibilityPath = null, lineageEligibilitySha256 = null, references, composition, padding, identityReferencePolicy, output } = input;
  if (!(lookBytes instanceof Uint8Array) || !(originalLookBytes instanceof Uint8Array)) throw new Error('exact original and corrected look bytes required; provider calls: 0');
  const snapshot = Buffer.from(lookBytes), original = Buffer.from(originalLookBytes);
  const look = strictJSONParse(snapshot.toString('utf8')), before = strictJSONParse(original.toString('utf8'));
  if (identityReferencePolicy !== 'authored-only') throw new Error('current owner contract excludes prior portraits; explicit named exception requires contract revision; provider calls: 0');
  if (!Array.isArray(activatedSlots) || !activatedSlots.length || new Set(activatedSlots).size !== activatedSlots.length) throw new Error('unique activated authored leaves required; provider calls: 0');
  const protectedBefore = structuredClone(before), protectedAfter = structuredClone(look);
  for (const slot of activatedSlots) {
    const match = /^appearance\.(face|hair|body|outfit|accessories)\.([a-zA-Z]+)$/.exec(slot);
    if (!match || !Object.hasOwn(before.slots?.[match[1]] ?? {}, match[2]) || !Object.hasOwn(look.slots?.[match[1]] ?? {}, match[2])) throw new Error('unknown activated appearance leaf; provider calls: 0');
    delete protectedBefore.slots[match[1]][match[2]]; delete protectedAfter.slots[match[1]][match[2]];
  }
  if (!isDeepStrictEqual(protectedBefore, protectedAfter)) throw new Error('replacement changed protected authored fields; provider calls: 0');
  if (look.characterId === 'K028' && !isDeepStrictEqual(before.slots.outfit.upper, look.slots.outfit.upper)) {
    const source = look.slots.outfit.upper.source;
    const split = typeof source === 'string' ? source.lastIndexOf('#') : -1;
    if (split < 0 || typeof trust?.readEvidence !== 'function') throw new Error('authored garment construction source required; provider calls: 0');
    const document = strictJSONParse(Buffer.from(await trust.readEvidence(source.slice(0,split))).toString());
    const costume = pointer(document, source.slice(split+1));
    if (costume.constructionCues !== look.slots.outfit.upper.value) throw new Error('missing or unapproved authored garment construction cue; provider calls: 0');
  }
  const sourceBytes = await readFile(sourcePath);
  const portraitPackage = await loadPortraitPackage({ root: packageRoot, manifestPath });
  const binding = { sourceSHA: hash(sourceBytes), inputSnapshotSHA: hash(snapshot), originalLookSHA: hash(original), packageVersion: portraitPackage.version, packageSHA: hash(await readFile(resolve(packageRoot, manifestPath))) };
  if (sourceSHA !== binding.sourceSHA || !isDeepStrictEqual(expected, binding)) throw new Error('stale complete replacement binding; provider calls: 0');
  // Validate complete authored input before catalog selection; never infer missing slots.
  previewPortrait({ lookBytes: snapshot, references, composition, packageVersion: binding.packageVersion });
  const record = neutralRecord(look);
  const selected = await selectFace(record, { required: true, catalogPath, canonicalRoot, lineageEligibilityPath, lineageEligibilitySha256 });
  if (!Array.isArray(references) || references.length !== 2 || references[0].role !== 'drawing-technique-only' || references[1].role !== 'framing-only') throw new Error('exact ordered package technique and framing references required; provider calls: 0');
  const uploads = [];
  const descriptors = [];
  const append = (bytes, role, extra = {}) => { uploads.push(Buffer.from(bytes)); descriptors.push({ index: descriptors.length + 1, role, sha256: hash(bytes), ...extra }); };
  for (const ref of references) {
    const role = ref.role === 'drawing-technique-only' ? 'style-technique' : 'composition-guide';
    const asset = portraitPackage.assets.find(asset => asset.role === role && asset.sha256 === ref.sha256 && /\.png$/i.test(asset.path));
    if (!asset) throw new Error('reference is not a verified package asset; provider calls: 0');
    const { index, role: referenceRole, sha256, ...extra } = ref;
    append(asset.bytes, referenceRole, extra);
  }
  if (selected.faceMode.kind === 'template') {
    const catalog = portraitPackage.assets.find(asset => asset.role === 'face-catalog-entry' && resolve(asset.filePath) === resolve(catalogPath));
    const face = portraitPackage.assets.find(asset => asset.role === 'face-catalog-entry' && asset.sha256 === selected.faceVariant.referenceImageSha256 && resolve(asset.filePath) === resolve(selected.faceVariant.referenceImagePath ?? ''));
    if (!catalog || !face) throw new Error('selected template must have actual package-bound face asset bytes; provider calls: 0');
    append(face.bytes, 'face-base-only');
  }
  // Selection verifies template eligibility and bytes; the immutable authored look
  // remains the appearance authority, including all explicit face overrides.
  const base = previewPortrait({ lookBytes: snapshot, references: descriptors, composition, packageVersion: binding.packageVersion });
  const { policy: boundaryPolicy, raw, registrySHA } = await sourcedPolicy(input, base.output.width, base.output.height, trust);
  if (padding !== undefined) throw new Error('free-standing padding lacks boundary policy authority; provider calls: 0');
  if (composition.frameContractVersion !== 'position-reference.v2' || composition.referenceSHA !== hash(await trust.readEvidence(strictJSONParse(Buffer.from(input.ruleBytes).toString()).rawReference.path)) || composition.referenceVersion !== raw.ruleVersion || composition.ruleSHA !== input.ruleSHA || !isDeepStrictEqual(composition.positionMetrics, raw.metrics)) throw new Error('stale generation composition/reference binding; provider calls: 0');
  const initial = { ...base, inputSnapshotSHA: binding.inputSnapshotSHA, completeSource: { operation: 'complete-source-replacement', instruction, boundaryPolicySHA: input.boundaryPolicySHA, boundaryPolicy, clothingPolicy } };
  const readableProjection = readablePositionProjection(initial);
  const design = parse({ ...initial, ...(input.proportionProfile ? { proportionProfile: input.proportionProfile } : {}), completeSource: { ...initial.completeSource, instruction: instruction + '\n' + readableProjection.text, readableProjection } });
  const protectedPaths = [sourcePath, catalogPath, ...portraitPackage.assets.map(asset => asset.filePath)].filter(Boolean).map(path => resolve(path));
  const outputPaths = [output, output + '.request.json', output + '.receipt.json', output + '.replacement.json', output + '.native', output + '.replacement-inputs'];
  if (outputPaths.some(path => protectedPaths.includes(resolve(path)))) throw new Error('output aliases source asset; provider calls: 0');
  for (const path of outputPaths) { try { await stat(path); throw new Error('output already exists: ' + path); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
  return { design, binding, uploads, descriptors, identityReferencePolicy, activatedSlots, output, boundaryPolicySHA: input.boundaryPolicySHA, ruleSHA: input.ruleSHA, authoritySHA: input.authoritySHA, registrySHA };
}

export async function completeSourceReplacement(input, trust = null) {
  const prepared = await prepareCompleteReplacement(input, trust);
  const { mkdir } = await import('node:fs/promises');
  const directory = input.output + '.replacement-inputs';
  await mkdir(directory);
  const paths = [];
  for (const [index, bytes] of prepared.uploads.entries()) {
    const path = resolve(directory, 'reference-' + (index + 1) + '.png');
    await writeFile(path, bytes, { flag: 'wx' }); paths.push(path);
  }
  const receipt = { schema: 'complete-source-replacement.v1', operation: 'complete-source-replacement', lineage: prepared.binding, boundaryPolicySHA: prepared.boundaryPolicySHA, ruleSHA: prepared.ruleSHA, authoritySHA: prepared.authoritySHA, bottomContact: 'UNVERIFIED', boundaryBlocked: true, identityReferencePolicy: prepared.identityReferencePolicy, references: prepared.descriptors, activatedSlots: prepared.activatedSlots, exactOutsidePixelPreservation: false, identityMatch: 'UNVERIFIED', naturalGarmentSilhouette: 'UNVERIFIED', subjectStretch: 'UNVERIFIED', status: 'candidate-unreviewed', publicationAuthorized: false };
  receipt.trustedRegistrySHA = prepared.registrySHA;
  receipt.readableProjection = prepared.design.completeSource.readableProjection;
  receipt.clothingPolicy = prepared.design.completeSource.clothingPolicy;
  receipt.clothingStatus = 'UNVERIFIED';
  await writeFile(input.output + '.replacement.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
  const result = await runGeneration(['--connection-config', input.connectionConfig, ...(input.readableFirst === true ? ['--readable-first'] : []), ...paths.flatMap(path => ['--image', path]), '--reference-roles', prepared.descriptors.map(ref => ref.role).join(','), '--prompt', JSON.stringify(prepared.design), '-o', input.output], {
    compactFirst: input.compactFirst === true,
    completeReplacement: { referenceBytes: prepared.uploads, beforeDispatch: async () => { if (hash(await readFile(input.sourcePath)) !== prepared.binding.sourceSHA) throw new Error('stale lineage source before dispatch; provider calls: 0'); parse(prepared.design); if (!isDeepStrictEqual(readablePositionProjection(prepared.design), prepared.design.completeSource.readableProjection)) throw new Error('altered readable projection before dispatch; provider calls: 0'); }, validateOutput: bytes => validateReplacementPadding(bytes, prepared.design.completeSource.boundaryPolicy) },
  });
  return { ...result, replacementReceipt: input.output + '.replacement.json', status: 'candidate-unreviewed' };
}
