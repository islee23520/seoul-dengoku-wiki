import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { fixture, bytes, trait } from './fixture.mjs';
import { sha, prepareCompleteReplacement as prepareNative, completeSourceReplacement as completeNative, validateReplacementPadding as validateNative } from '../lib/index.mjs';
import { encodeFinalPng } from '../lib/2d/final-alpha-export.mjs';
import { parse, clothingPolicySchema } from '../lib/2d/design-prompt.mjs';
import { readableGenerationTransport, visualInstruction, validateVisualSnapshot } from '../lib/2d/image-generate.mjs';
import { prepareCompactPrompt } from '../lib/compact-prompt.mjs';
import { createProportionProfile } from '../lib/proportion-profile.mjs';
const trusts = new Map();
const prepareCompleteReplacement = input => prepareNative(input, trusts.get(input.sourcePath));
const completeSourceReplacement = input => completeNative(input, trusts.get(input.sourcePath));
const validateReplacementPadding = (png,policy,proof) => {
  const registry = { schema:'complete-source-trusted-registry.v1',approvalId:'synthetic-operator',entries:[],semanticEvidence:proof ? [{imageSHA:sha(png),policySHA:sha(bytes(policy)),assessorEvidenceSHA:proof.sha256,criterionScope:'bottom-garment-contact'}] : [] };
  const registryBytes=bytes(registry);
  return validateNative(png,policy,proof,sha(bytes(policy)),{registryBytes,registrySHA:sha(registryBytes)});
};
const metricNames=['chinY','crownY','headLeft','headRight','leftPupilX','leftPupilY','rightPupilX','rightPupilY','eyeY','topGap','headCenterX','headCenterY'];

test('compact preparation preserves rendering values and original audit while never dispatching', async () => {
  const f = await setup();
  try {
    const prepared = await prepareCompleteReplacement(f.input);
    const compact = prepareCompactPrompt(prepared.design);
    assert.deepEqual(compact.originalDesign, prepared.design);
    assert.deepEqual(compact.rendering.appearance, prepared.design.appearance);
    for (const metric of metricNames) {
      assert.deepEqual(compact.rendering.composition.positions[metric].inner, prepared.design.composition.positionMetrics[metric].inner);
      assert.deepEqual(compact.rendering.composition.positions[metric].outerObservation, prepared.design.composition.positionMetrics[metric].outer);
    }
    assert.deepEqual(compact.referenceHashes, prepared.design.references.map(reference => reference.sourceHash));
    assert.deepEqual(compact.rendering.boundary, prepared.design.completeSource.boundaryPolicy.boundary);
    assert.deepEqual(compact.rendering.bottomContact, prepared.design.completeSource.boundaryPolicy.bottomContact);
    assert.equal(compact.providerCalls, 0); assert.equal(compact.dispatched, false);
    const observation = { imageSHA:'a'.repeat(64),measurementEvidenceSHA:'b'.repeat(64),actualImageMeasured:true,canvas:[1024,1536],bodyType:'synthetic-medium',landmarks:{crown:[500,360],chin:[500,960],headLeft:[200,600],headRight:[800,600],faceTop:[500,500],faceLeft:[350,700],faceRight:[750,700],leftPupil:[520,690],rightPupil:[660,710],leftShoulder:[200,1050],rightShoulder:[800,1050],torsoLeft:[250,1300],torsoRight:[750,1300]} };
    const proportionProfile = createProportionProfile({commonReference:observation,bodyReference:observation,bodyType:observation.bodyType,tolerance:{pixels:2,ratio:0.01,evidenceSHA:'c'.repeat(64)}});
    const profiled = prepareCompactPrompt({...prepared.design,proportionProfile});
    assert.deepEqual(profiled.rendering.proportionProfile,proportionProfile);
    assert.notEqual(profiled.renderingSHA,compact.renderingSHA);
    assert.notEqual(profiled.textSHA,compact.textSHA);
    assert.deepEqual(profiled.rendering.composition.positions,compact.rendering.composition.positions);
    const tampered = structuredClone(proportionProfile);tampered.targets.headWidth+=10;
    assert.throws(()=>prepareCompactPrompt({...prepared.design,proportionProfile:tampered}),/hash mismatch/);
    const changed = structuredClone(prepared.design); changed.appearance.hair.color = 'blue';
    changed.completeSource.readableProjection.text += 'changed';
    assert.throws(() => prepareCompactPrompt(changed));
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('readable-first replacement reaches local HTTP wire with exact source JSON and images', async () => {
  const f = await setup();
  let uploaded, transmitted;
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const form = await new Request('http://localhost' + req.url, { method: 'POST', headers: req.headers, body: Buffer.concat(chunks) }).formData();
    transmitted = form.get('prompt');
    uploaded = await Promise.all(form.getAll('image[]').map(async blob => Buffer.from(await blob.arrayBuffer())));
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ data: [{ b64_json: f.png.toString('base64') }] }));
  });
  const listening = once(server, 'listening');
  server.listen(0, '127.0.0.1');
  await listening;
  try {
    await writeFile(f.input.connectionConfig, bytes({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: `http://127.0.0.1:${server.address().port}/v1`, allowUnauthenticated: true }));
    const prepared = await prepareCompleteReplacement(f.input);
    await completeSourceReplacement({ ...f.input, readableFirst: true });
    assert.equal(transmitted, readableGenerationTransport(prepared.design));
    assert.deepEqual(uploaded, [f.style, f.frame, f.face]);
    const receipt = JSON.parse(await readFile(f.input.output + '.receipt.json', 'utf8'));
    assert.equal(receipt.request.visualSnapshot.provenance, 'source-bound-readable-first');
    validateVisualSnapshot(receipt.request);
  } finally {
    const closed = once(server, 'close'); server.close(); await closed;
    await rm(f.dir, { recursive: true, force: true });
  }
});

test('compact complete replacement sends only bound rendering text and retains original JSON locally', async () => {
  const f = await setup();
  const observation = { imageSHA:'a'.repeat(64),measurementEvidenceSHA:'b'.repeat(64),actualImageMeasured:true,canvas:[1024,1536],bodyType:'synthetic-medium',landmarks:{crown:[500,360],chin:[500,960],headLeft:[200,600],headRight:[800,600],faceTop:[500,500],faceLeft:[350,700],faceRight:[750,700],leftPupil:[520,690],rightPupil:[660,710],leftShoulder:[200,1050],rightShoulder:[800,1050],torsoLeft:[250,1300],torsoRight:[750,1300]} };
  f.input.proportionProfile = createProportionProfile({commonReference:observation,bodyReference:observation,bodyType:observation.bodyType,tolerance:{pixels:2,ratio:0.01,evidenceSHA:'c'.repeat(64)}});
  let transmitted;
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const form = await new Request('http://localhost' + req.url, { method: 'POST', headers: req.headers, body: Buffer.concat(chunks) }).formData();
    transmitted = form.get('prompt');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ data: [{ b64_json: f.png.toString('base64'), revised_prompt: transmitted }] }));
  });
  const listening = once(server, 'listening'); server.listen(0, '127.0.0.1'); await listening;
  try {
    await writeFile(f.input.connectionConfig, bytes({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: `http://127.0.0.1:${server.address().port}/v1`, allowUnauthenticated: true }));
    const prepared = await prepareCompleteReplacement(f.input);
    const compact = prepareCompactPrompt(prepared.design);
    await completeSourceReplacement({ ...f.input, compactFirst: true });
    assert.equal(transmitted, compact.text);
    assert.deepEqual(compact.rendering.proportionProfile,f.input.proportionProfile);
    const receipt = JSON.parse(await readFile(f.input.output + '.receipt.json', 'utf8'));
    assert.deepEqual(JSON.parse(receipt.request.prompt), prepared.design);
    assert.deepEqual(JSON.parse(receipt.request.prompt).proportionProfile,f.input.proportionProfile);
    assert.equal(receipt.request.compactTransport.textSHA, compact.textSHA);
    validateVisualSnapshot(receipt.request);
    const altered = structuredClone(receipt.request); altered.compactTransport.text += 'changed';
    assert.throws(() => validateVisualSnapshot(altered), /source binding mismatch/);
  } finally {
    const closed = once(server, 'close'); server.close(); await closed;
    await rm(f.dir, { recursive: true, force: true });
  }
});

test('readable-first transport preserves validated JSON and rejects modified prefix', async () => {
  const f = await setup();
  try {
    const prepared = await prepareCompleteReplacement(f.input);
    const transport = readableGenerationTransport(prepared.design);
    const marker = '\r\n\r\nCHARACTER_ART_BOUND_JSON_V1\r\n';
    assert.deepEqual(JSON.parse(transport.split(marker)[1]), prepared.design);
    assert.equal(visualInstruction(transport), transport);
    assert.throws(() => visualInstruction('changed' + transport), /binding mismatch/);
    const source = visualInstruction(JSON.stringify(prepared.design));
    const request = {
      prompt: transport, references: prepared.descriptors,
      sourceSnapshot: { prompt: JSON.stringify(prepared.design), promptSha256: sha(JSON.stringify(prepared.design)), recipientContext: null },
      visualSnapshot: { sourceVisualPrompt: source, sourceVisualPromptSha256: sha(source), transmittedPrompt: transport, transmittedPromptSha256: sha(transport), provenance: 'source-bound-readable-first' },
    };
    validateVisualSnapshot(request);
    const altered = structuredClone(request);
    altered.prompt = 'changed' + transport;
    altered.visualSnapshot.transmittedPrompt = altered.prompt;
    altered.visualSnapshot.transmittedPromptSha256 = sha(altered.prompt);
    assert.throws(() => validateVisualSnapshot(altered), /binding mismatch/);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'replacement-'));
  const pixels = Buffer.alloc(1024 * 1536 * 4); pixels.set([30, 40, 50, 255], (500 * 1024 + 500) * 4);
  const png = encodeFinalPng({ width: 1024, height: 1536, pixels });
  const f = fixture(); f.look.faceMode = { kind: 'template', variantId: 'synthetic-03' };
  f.look.faceSelection = { gender: 'female', ancestry: 'east-asian', source: 'synthetic:/selection', skinTone: f.look.slots.body.skin };
  const originalLookBytes = bytes(f.look); f.look.slots.outfit.upper = trait('Blue jacket with complete rounded shoulders and sleeves');
  const lookBytes = bytes(f.look);
  const face = Buffer.from('synthetic-selected-face-bytes'), style = Buffer.from('synthetic-technique-bytes'), frame = Buffer.from('synthetic-frame-bytes');
  const catalog = { schemaVersion: 1, variants: Array.from({ length: 24 }, (_, index) => ({ id: 'synthetic-' + String(index).padStart(2, '0'), gender: 'female', ancestry: 'east-asian', source: 'synthetic:/catalog', face: { description: trait('Selected compact face') }, referenceImageSha256: sha(face), referenceImagePath: 'face.png' })) };
  const data = [['source.png', png], ['face.png', face], ['style.png', style], ['frame.png', frame], ['catalog.json', bytes(catalog)], ['overlay.png', Buffer.from('synthetic overlay')], ['rule.json', bytes({ schemaVersion: 1 })], ['alpha.json', bytes({ schemaVersion: 1 })]];
  for (const [name, value] of data) await writeFile(join(dir, name), value);
  const role = { 'face.png': 'face-catalog-entry', 'style.png': 'style-technique', 'frame.png': 'composition-guide', 'catalog.json': 'face-catalog-entry', 'overlay.png': 'overlay-template', 'rule.json': 'canvas-rule', 'alpha.json': 'transparency-edge-rule' };
  const manifest = bytes({ id: 'seoul-dengoku-portrait-package', version: 1, assets: data.filter(([name]) => role[name]).map(([name, value]) => ({ path: name, role: role[name], sha256: sha(value), provenance: 'synthetic', rights: 'synthetic', rolescope: 'synthetic' })) });
  await writeFile(join(dir, 'portrait-package.json'), manifest);
  const connectionConfig = join(dir, 'connection.json');
  await writeFile(connectionConfig, bytes({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: 'http://127.0.0.1:1/v1', allowUnauthenticated: true }));
  const references = [{ index: 1, role: 'drawing-technique-only', sha256: sha(style) }, { index: 2, role: 'framing-only', sha256: sha(frame), guide: { ...f.references[1].guide, sourceHash: sha(frame) } }];
  const input = { lookBytes, originalLookBytes, sourcePath: join(dir, 'source.png'), sourceSHA: sha(png), expected: { sourceSHA: sha(png), inputSnapshotSHA: sha(lookBytes), originalLookSHA: sha(originalLookBytes), packageVersion: 1, packageSHA: sha(manifest) }, activatedSlots: ['appearance.outfit.upper'], packageRoot: dir, catalogPath: join(dir, 'catalog.json'), references, composition: f.composition, padding: { left: 1, right: 1, top: 1, bottom: 0 }, identityReferencePolicy: 'authored-only', output: join(dir, 'candidate.png'), connectionConfig };
  const policy = policyFixture(1024, 1536);
  const metric={sampleCount:16,meanMidpoint:'4',meanInterval:['3','5'],inner:['3','5'],outer:['2','6'],measurementStatus:'AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS',exactPixelCertification:false,passAuthority:true,positionReferenceAuthority:true,passAuthorityScope:'POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME'};
  const raw={schema:'latest-approved16-second-observer-fixed-rules.v2',ruleVersion:policy.referenceVersion,sourceManifestSHA256:'c'.repeat(64),observationsSHA256:'d'.repeat(64),sourceSetAuthority:'OWNER_RATIFIED_EXACT16',measurementProofStatus:metric.measurementStatus,framePassAuthority:false,canvas:[1024,1536],formulas:{},metrics:Object.fromEntries(metricNames.map(k=>[k,metric])),rows:Array.from({length:16},(_,i)=>({id:'synthetic-'+i,positionIntervals:Object.fromEntries(metricNames.map(k=>[k,['3','5']]))})),sourceCutPolicy:'Cuts remain failures',positionReferenceAuthority:true,positionMeasurementGaps:[],authorityScope:{},cutAuthority:'FAIL',backgroundAuthority:'UNVERIFIED'};
  const rawBytes=bytes(raw), decision=Buffer.from('synthetic operator decision'), concurrence=Buffer.from('synthetic concurrence');
  const rule={schemaVersion:2,referenceVersion:policy.referenceVersion,adapterSchema:'complete-source-position-rule-adapter.v1',rawReference:{path:'synthetic-raw',sha256:sha(rawBytes),ruleVersion:policy.referenceVersion,sourceManifestSHA256:raw.sourceManifestSHA256,observationsSHA256:raw.observationsSHA256},concurrence:{path:'synthetic-concurrence',sha256:sha(concurrence)},position:{unit:'px',sourceCoordinateSystem:'top-left-x-right-y-down',authorityScope:metric.passAuthorityScope,measurementProofStatus:metric.measurementStatus,positionReferenceAuthority:true,metrics:raw.metrics}};
  const ruleBytes = bytes(rule);
  policy.positionBounds.ruleSHA = sha(ruleBytes);
  const authority={schema:'owner-authored-boundary-authority.v1',authorship:'synthetic operator',ownerDecisionRecord:{path:'synthetic-decision',sha256:sha(decision),pointer:'/source'},approved:{status:'authored',scope:'complete-source-boundary',source:'synthetic:/user-policy',...Object.fromEntries(['unit','canvas','referenceVersion','positionBounds','boundary','bottomContact'].map(key=>[key,policy[key]]))},criteriaSourcePolicy:{leftRight:'natural',numericMargin:null,garmentBottom:'connected',backgroundResidue:'separate'},alphaNumericalAuthority:{source:{path:'synthetic-alpha',sha256:'e'.repeat(64),pointer:'/alpha'},background:0,foregroundCoreMinimum:250,minimumCoreFraction:0.9,foregroundDenominator:'nonzero-alpha-pixels',antialiasedFringe:'permitted',alpha255Required:false,rejectedRawOutput:'preserve'},authorization:{requestedPortraitCorrectionAndNecessaryRegeneration:true,originalsApprovedHashesHistoryPreserved:true,inputPolicyOnly:true,outputAcceptance:false,publication:false,paidCallInThisUnit:false}};
  const authorityBytes = bytes(authority);
  policy.authority.documentSHA = sha(authorityBytes);
  delete input.padding;
  input.clothingPolicy={schema:'avatar-clothing-policy.v1',...Object.fromEntries(['eraBaseline','tier','tierLayerPreference','surfaceExposure','winterProtection'].map(k=>[k,{value:null,status:'unknown',source:null}]))};
  Object.assign(input, { boundaryPolicyBytes: bytes(policy), boundaryPolicySHA: sha(bytes(policy)), ruleBytes, ruleSHA: sha(ruleBytes), authorityBytes, authoritySHA: sha(authorityBytes) });
  input.composition={frameContractVersion:'position-reference.v2',cameraContractId:'synthetic-position',mode:'portrait',coordinatedHeadTorso:true,viewerRight:true,gazeCamera:true,fullHeadShoulderConstraints:true,referenceVersion:raw.ruleVersion,referenceSHA:sha(rawBytes),ruleSHA:sha(ruleBytes),unit:'px',positionMetrics:raw.metrics,wholeFramePassAuthority:false,measuredFrameGuide:{sourceHash:sha(frame),metadataSHA:'f'.repeat(64),landmarkBinding:'a'.repeat(64),canvas:[1024,1536]}};
  references[1].guide={...references[1].guide,metadataSHA:'f'.repeat(64),landmarkBinding:'a'.repeat(64)};
  references[1].allowedProperties=['pose'];
  input.composition.referencePrecedence='Latest approved position-reference.v2 exact rational metrics exclusively own numeric head size, crown, eye, chin and framing positions. The mannequin reference supplies coordinated orientation and body pose only; its image and diagnostic metadata supply no numeric positions or framing authority.';
  const entry={characterId:f.look.characterId,lookId:f.look.lookId,policySHA:input.boundaryPolicySHA,ruleSHA:input.ruleSHA,authoritySHA:input.authoritySHA,ownerDecisionSHA:sha(decision),rawReferenceSHA:sha(rawBytes),referenceVersion:raw.ruleVersion,criterionScopes:['position','natural-cut','bottom-garment-contact','background'],authorityContent:authority,ruleContent:rule};
  const registry={schema:'complete-source-trusted-registry.v1',approvalId:'synthetic-operator',entries:[entry],semanticEvidence:[]};
  const registryBytes=bytes(registry), files=new Map([['synthetic-raw',rawBytes],['synthetic-decision',decision],['synthetic-concurrence',concurrence]]);
  trusts.set(input.sourcePath,{registryBytes,registrySHA:sha(registryBytes),readEvidence:async path=>files.get(path)});
  return { dir, input, png, pixels, face, style, frame, f };
}

function policyFixture(width, height) {
  return { schema: 'portrait-complete-source-boundary.v1', unit: 'px', canvas: { width, height }, referenceVersion: 'synthetic-v2', provenance: 'synthetic authored user rule', authority: { documentSHA: 'a'.repeat(64), pointer: '/approved' }, positionBounds: { ruleSHA: 'b'.repeat(64), pointer: '/position', scope: 'position-v2' }, boundary: { mode: 'authored-numeric-bands', padding: { left: 1, right: 1, top: 1, bottom: 0 }, evidenceRequired: true }, bottomContact: { required: true, row: height - 1, subject: 'connected-torso-garment' } };
}

test('complete replacement actual wire has selected template bytes, separate roles and stable look bindings; no paid calls', async () => {
  const f = await setup(), nativeFetch = globalThis.fetch; let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++; assert.equal(String(url), 'http://127.0.0.1:1/v1/images/edits');
    const form = await new Request(url, options).formData();
    assert.equal(form.has('mask'), false);
    const uploads = await Promise.all(form.getAll('image[]').map(async blob => Buffer.from(await blob.arrayBuffer())));
    assert.deepEqual(uploads, [f.style, f.frame, f.face]);
    const prompt = JSON.parse(form.get('prompt'));
    assert.deepEqual(prompt.references.map(ref => ref.role), ['drawing-technique-only', 'framing-only', 'face-base-only']);
    assert.equal(prompt.references[2].sourceHash, sha(f.face));
    assert.equal(prompt.appearance.face.description, f.f.look.slots.face.description.value);
    assert.equal(prompt.appearance.hair.description, f.f.look.slots.hair.description.value);
    assert.equal(prompt.appearance.body.skin, f.f.look.slots.body.skin.value);
    assert.equal(prompt.appearance.outfit.upper, f.f.look.slots.outfit.upper.value);
    assert.equal(prompt.appearance.outfit.neckline, f.f.look.slots.outfit.neckline.value);
    assert.equal(prompt.inputSnapshotSHA, sha(f.input.lookBytes));
    assert.equal(prompt.completeSource.boundaryPolicySHA, f.input.boundaryPolicySHA);
    assert.equal(prompt.completeSource.boundaryPolicy.positionBounds.ruleSHA, f.input.ruleSHA);
    assert.equal(prompt.completeSource.boundaryPolicy.authority.documentSHA, f.input.authoritySHA);
    assert.equal(prompt.completeSource.boundaryPolicy.bottomContact.required, true);
    assert.deepEqual(prompt.references[1].allowedProperties,['pose']);
    assert.deepEqual(prompt.composition.positionMetrics,f.input.composition.positionMetrics);
    assert.match(prompt.composition.referencePrecedence,/exclusively own numeric/);
    const readable=prompt.completeSource.readableProjection;
    assert(prompt.completeSource.instruction.endsWith('\n'+readable.text));
    const scope=JSON.parse(readable.projectionJSON);
    assert.equal(readable.textSHA,sha(Buffer.from(readable.text)));
    assert.equal(readable.projectionJSONSHA,sha(Buffer.from(readable.projectionJSON)));
    for(const row of scope.rows){assert.deepEqual(row.inner,prompt.composition.positionMetrics[row.metric].inner);assert.deepEqual(row.outer,prompt.composition.positionMetrics[row.metric].outer);assert(readable.text.includes(`Place ${row.metric} within ${row.inner[0]} to ${row.inner[1]} pixels`));}
    assert.equal(scope.coordinates.normalizedX,'x/1024');assert.equal(scope.coordinates.normalizedY,'y/1536');assert(readable.text.includes(prompt.appearance.outfit.upper));
    assert.equal(prompt.packageVersion, 1); assert.equal(prompt.modification, undefined);
    return Response.json({ data: [{ b64_json: f.png.toString('base64') }] });
  };
  try {
    assert.deepEqual((await prepareCompleteReplacement(f.input)).binding, f.input.expected);
    const result = await completeSourceReplacement(f.input); assert.equal(calls, 1); assert.equal(result.status, 'candidate-unreviewed');
    assert.deepEqual(await readFile(f.input.output), f.png);
    assert.deepEqual(await readFile(f.input.output + '.native/image-001.png'), f.png);
    const receipt = JSON.parse(await readFile(f.input.output + '.replacement.json'));
    assert.equal(receipt.lineage.sourceSHA, sha(f.png)); assert.equal(receipt.exactOutsidePixelPreservation, false); assert.equal(receipt.identityMatch, 'UNVERIFIED');
    await assert.rejects(completeSourceReplacement(f.input), /exists/); assert.equal(calls, 1);
  } finally { globalThis.fetch = nativeFetch; await rm(f.dir, { recursive: true, force: true }); }
});

test('current owner contract rejects previous recipient image input even though native transport supports its role', async () => {
  const f = await setup();
  try {
    await assert.rejects(prepareCompleteReplacement({ ...f.input, identityReferencePolicy: 'same-owner-recipient-permitted' }), /excludes prior portraits/);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('stale keys units identity version UNIQUE and source aliases fail before provider', async () => {
  const f = await setup();
  try {
    for (const input of [
      { ...f.input, identityReferencePolicy: null },
      { ...f.input, lookBytes: Buffer.from('{"schemaVersion":2,"schemaVersion":2}') },
      { ...f.input, expected: { ...f.input.expected, packageVersion: 2 } },
      { ...f.input, sourceSHA: 'a'.repeat(64) },
      { ...f.input, output: f.input.sourcePath },
      { ...f.input, activatedSlots: ['appearance.outfit.upper', 'appearance.outfit.upper'] },
    ]) await assert.rejects(prepareCompleteReplacement(input));
    for (const mutate of [look => { look.identity.name = 'Other'; }, look => { look.slots.body.height.unit = null; }, look => { look.uniqueFaceRequired = true; }, look => { look.slots.hair.color = trait('red'); }]) {
      const look = JSON.parse(f.input.lookBytes); mutate(look);
      await assert.rejects(prepareCompleteReplacement({ ...f.input, lookBytes: bytes(look) }));
    }
    const original = JSON.parse(f.input.originalLookBytes), corrected = JSON.parse(f.input.lookBytes);
    original.faceMode = corrected.faceMode = { kind: 'unique', variantId: null };
    const originalLookBytes = bytes(original), lookBytes = bytes(corrected);
    const unique = await prepareCompleteReplacement({ ...f.input, originalLookBytes, lookBytes, expected: { ...f.input.expected, originalLookSHA: sha(originalLookBytes), inputSnapshotSHA: sha(lookBytes) } });
    assert.equal(unique.design.face.kind, 'unique'); assert.equal(unique.uploads.length, 2);
    await writeFile(join(f.dir, 'portrait-package.json'), '{"version":1,"version":1}');
    await assert.rejects(prepareCompleteReplacement(f.input), /Duplicate/);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('padding failure preserves raw whole canvas and cannot claim natural silhouette acceptance', async () => {
  const f = await setup(), nativeFetch = globalThis.fetch;
  f.pixels.set([90, 90, 90, 255], (1000 * 1024) * 4);
  const clipped = encodeFinalPng({ width: 1024, height: 1536, pixels: f.pixels });
  globalThis.fetch = async () => Response.json({ data: [{ b64_json: clipped.toString('base64') }] });
  try {
    assert.throws(() => validateReplacementPadding(clipped, JSON.parse(f.input.boundaryPolicyBytes)), /padding/);
    await assert.rejects(completeSourceReplacement(f.input), /padding/);
    assert.deepEqual(await readFile(f.input.output + '.native/image-001.png'), clipped);
    const preservation = JSON.parse(await readFile(f.input.output + '.native/preservation.json'));
    assert.equal(preservation.outputs[0].outputValidationStatus, 'rejected');
    await assert.rejects(readFile(f.input.output), /ENOENT/);
  } finally { globalThis.fetch = nativeFetch; await rm(f.dir, { recursive: true, force: true }); }
});

test('unratified numeric boundary request rejects before HTTP', async () => {
  const f = await setup();
  try { await assert.rejects(prepareCompleteReplacement({ ...f.input, boundaryPolicyBytes: undefined, padding: { left: 1, right: 1, top: 1, bottom: 0 } }), /boundary policy/); }
  finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('alpha dot is not connected garment bottom-contact proof', () => {
  const pixels = Buffer.alloc(8 * 8 * 4); pixels.set([20, 30, 40, 255], (3 * 8 + 3) * 4); pixels.set([20, 30, 40, 255], (7 * 8 + 3) * 4);
  const png = encodeFinalPng({ width: 8, height: 8, pixels });
  const result = validateReplacementPadding(png, policyFixture(8, 8));
  assert.equal(result.bottomContact?.status, 'UNVERIFIED');
  assert.equal(result.bottomContact?.blocked, true);
});

test('semantic-identified component contacts bottom, floating garment and disconnected dot fail; alpha alone stays blocked', () => {
  const policy = policyFixture(8, 8);
  for (const kind of ['connected', 'floating', 'dot']) {
    const pixels = Buffer.alloc(8 * 8 * 4);
    for (let y = 2; y <= (kind === 'connected' ? 7 : 5); y++) pixels.set([40, 50, 60, 255], (y * 8 + 3) * 4);
    if (kind === 'dot') pixels.set([40, 50, 60, 255], (7 * 8 + 3) * 4);
    const png = encodeFinalPng({ width: 8, height: 8, pixels });
    const proofBytes = bytes({ imageSHA: sha(png), policySHA: sha(bytes(policy)), subject: 'connected-torso-garment', status: 'authored', source: 'synthetic:/semantic-observer', seed: [3, 2] });
    const result = validateReplacementPadding(png, policy, { bytes: proofBytes, sha256: sha(proofBytes) });
    assert.throws(() => validateReplacementPadding(png, policy, { bytes: proofBytes, sha256: 'c'.repeat(64) }), /stale/);
    const staleProof = JSON.parse(proofBytes); staleProof.imageSHA = 'd'.repeat(64); const staleBytes = bytes(staleProof);
    assert.throws(() => validateReplacementPadding(png, policy, { bytes: staleBytes, sha256: sha(staleBytes) }), /candidate-bound/);
    assert.equal(result.bottomContact.status, kind === 'connected' ? 'PASS' : 'FAIL');
    assert.equal(result.bottomContact.componentConnected, kind === 'connected');
    assert.equal(result.blocked, true); assert.equal(result.cutContact, 'UNVERIFIED');
    assert.equal(validateReplacementPadding(png, policy).bottomContact.status, 'UNVERIFIED');
  }
});

test('boundary authority hashes modes numbers and bottom conflict reject before provider', async () => {
  const f = await setup();
  try {
    for (const mutate of [p => { p.boundary.padding.bottom = 1; }, p => { p.unit = 'cm'; }, p => { p.canvas.width = 2; }, p => { p.boundary.padding.left = -1; }, p => { p.boundary.padding.left = 0.5; }, p => { p.boundary.padding.top = 1536; }, p => { p.referenceVersion = 'stale'; }, p => { p.authority.pointer = '/missing'; }]) {
      const policy = JSON.parse(f.input.boundaryPolicyBytes); mutate(policy); const boundaryPolicyBytes = bytes(policy);
      await assert.rejects(prepareCompleteReplacement({ ...f.input, boundaryPolicyBytes, boundaryPolicySHA: sha(boundaryPolicyBytes) }));
    }
    await assert.rejects(prepareCompleteReplacement({ ...f.input, boundaryPolicySHA: 'c'.repeat(64) }));
    await assert.rejects(prepareCompleteReplacement({ ...f.input, authoritySHA: 'd'.repeat(64) }));
    for (const number of [NaN, Infinity, -1, 1.5, 8]) { const p = policyFixture(8, 8); p.boundary.padding.left = number; assert.throws(() => validateReplacementPadding(f.png, p)); }
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('observable no-cut policy carries no invented numeric margin or cut PASS', async () => {
  const f = await setup();
  try {
    const policy = JSON.parse(f.input.boundaryPolicyBytes);
    policy.boundary = { mode: 'observable-no-cut', padding: null, evidenceRequired: true };
    const authority = JSON.parse(f.input.authorityBytes); authority.approved.boundary = policy.boundary;
    const authorityBytes = bytes(authority); policy.authority.documentSHA = sha(authorityBytes);
    const boundaryPolicyBytes = bytes(policy);
    const oldTrust=trusts.get(f.input.sourcePath), registry=JSON.parse(oldTrust.registryBytes);
    registry.entries[0].policySHA=sha(boundaryPolicyBytes); registry.entries[0].authoritySHA=sha(authorityBytes); registry.entries[0].authorityContent=authority;
    const registryBytes=bytes(registry); trusts.set(f.input.sourcePath,{...oldTrust,registryBytes,registrySHA:sha(registryBytes)});
    const prepared = await prepareCompleteReplacement({ ...f.input, boundaryPolicyBytes, boundaryPolicySHA: sha(boundaryPolicyBytes), authorityBytes, authoritySHA: sha(authorityBytes) });
    const result = validateReplacementPadding(f.png, prepared.design.completeSource.boundaryPolicy);
    assert.equal(result.padding, null); assert.equal(result.backgroundBands, 'not-numerically-judged'); assert.equal(result.cutContact, 'UNVERIFIED'); assert.equal(result.blocked, true);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('forged authority rehashed with copied policy cannot replace operator registry approval',async()=>{
  const f=await setup();
  try {
    const authority=JSON.parse(f.input.authorityBytes); authority.approved.source='https://unrelated.invalid/not-proof';
    const authorityBytes=bytes(authority), policy=JSON.parse(f.input.boundaryPolicyBytes); policy.authority.documentSHA=sha(authorityBytes);
    const boundaryPolicyBytes=bytes(policy);
    await assert.rejects(prepareCompleteReplacement({...f.input,authorityBytes,authoritySHA:sha(authorityBytes),boundaryPolicyBytes,boundaryPolicySHA:sha(boundaryPolicyBytes)}),/external registry/);
    await assert.rejects(prepareNative(f.input),/externally pinned/);
    await assert.rejects(prepareNative({...f.input,registrySHA:sha(bytes({}))},trusts.get(f.input.sourcePath)),/separate/);
    const trust=trusts.get(f.input.sourcePath),registry=JSON.parse(trust.registryBytes);registry.entries[0].characterId='unrelated';const registryBytes=bytes(registry);
    await assert.rejects(prepareNative(f.input,{...trust,registryBytes,registrySHA:sha(registryBytes)}),/external registry/);
  }finally{await rm(f.dir,{recursive:true,force:true});}
});

test('closed operator-approved schemas reject extras wrong pointer and authority/version disagreement',async()=>{
  for(const mutate of [
    (r,a)=>{a.extra=true;},(r,a)=>{a.approved.extra=true;},(r,a)=>{a.approved.status='invented';},
    r=>{r.extra=true;},r=>{r.position.extra=true;},r=>{r.position.positionReferenceAuthority=false;},r=>{r.referenceVersion='stale';},r=>{r.position.metrics.eyeY.inner=['1','99'];},
  ]){
    const f=await setup();
    try{
      const rule=JSON.parse(f.input.ruleBytes),authority=JSON.parse(f.input.authorityBytes);mutate(rule,authority);
      const ruleBytes=bytes(rule),authorityBytes=bytes(authority),policy=JSON.parse(f.input.boundaryPolicyBytes);
      policy.positionBounds.ruleSHA=sha(ruleBytes);policy.authority.documentSHA=sha(authorityBytes);
      const boundaryPolicyBytes=bytes(policy),input={...f.input,ruleBytes,ruleSHA:sha(ruleBytes),authorityBytes,authoritySHA:sha(authorityBytes),boundaryPolicyBytes,boundaryPolicySHA:sha(boundaryPolicyBytes)};
      const trust=trusts.get(f.input.sourcePath),registry=JSON.parse(trust.registryBytes);Object.assign(registry.entries[0],{policySHA:input.boundaryPolicySHA,ruleSHA:input.ruleSHA,authoritySHA:input.authoritySHA,ruleContent:rule,authorityContent:authority});const registryBytes=bytes(registry);
      await assert.rejects(prepareNative(input,{...trust,registryBytes,registrySHA:sha(registryBytes)}));
    }finally{await rm(f.dir,{recursive:true,force:true});}
  }
});

test('semantic evidence must be independently pinned and closed, not self-authored PASS',()=>{
  const policy=policyFixture(8,8),pixels=Buffer.alloc(8*8*4);for(let y=2;y<8;y++)pixels.set([1,2,3,255],(y*8+3)*4);
  const png=encodeFinalPng({width:8,height:8,pixels}),proofBytes=bytes({imageSHA:sha(png),policySHA:sha(bytes(policy)),subject:'connected-torso-garment',status:'authored',source:'invented',seed:[3,2]});
  assert.throws(()=>validateNative(png,policy,{bytes:proofBytes,sha256:sha(proofBytes)}),/externally pinned/);
  const registryBytes=bytes({schema:'complete-source-trusted-registry.v1',approvalId:'operator',entries:[],semanticEvidence:[]});
  assert.throws(()=>validateNative(png,policy,{bytes:proofBytes,sha256:sha(proofBytes)},sha(bytes(policy)),{registryBytes,registrySHA:sha(registryBytes)}),/not externally pinned/);
  const extra=bytes({...JSON.parse(proofBytes),extra:true});assert.throws(()=>validateReplacementPadding(png,policy,{bytes:extra,sha256:sha(extra)}),/closed/);
});

test('stale legacy composition cannot masquerade as latest position reference',async()=>{
  const f=await setup();try{await assert.rejects(prepareCompleteReplacement({...f.input,composition:f.f.composition}),/stale generation composition/);await assert.rejects(prepareCompleteReplacement({...f.input,composition:{...f.input.composition,referenceSHA:'a'.repeat(64)}}),/stale generation composition/);}finally{await rm(f.dir,{recursive:true,force:true});}
});

test('position-v2 rejects mannequin frame authority before provider',async()=>{
  const f=await setup();try{
    const references=structuredClone(f.input.references);references[1].allowedProperties=['pose','frame'];
    await assert.rejects(prepareCompleteReplacement({...f.input,references}),/pose-only/);
  }finally{await rm(f.dir,{recursive:true,force:true});}
});

test('readable projection mutations and caller overrides reject before provider',async()=>{
  const f=await setup();try{
    const prepared=await prepareCompleteReplacement(f.input);
    for(const mutate of [m=>{m.completeSource.readableProjection.text=m.completeSource.readableProjection.text.replace('x right','x down');},m=>{m.completeSource.readableProjection.text+=' caller override';},m=>{m.completeSource.readableProjection.scopeVersion='v2';},m=>{m.completeSource.readableProjection.textSHA='a'.repeat(64);},m=>{m.composition.positionMetrics.eyeY.inner[0]='999';},m=>{m.appearance.outfit.upper='missing garment cue';},m=>{m.references[1].allowedProperties=['pose','frame'];}]){const model=structuredClone(prepared.design);mutate(model);assert.throws(()=>parse(model));}
    await assert.rejects(prepareCompleteReplacement({...f.input,projectedText:'caller override'}),/override/);
    const look=JSON.parse(f.input.lookBytes);look.slots.hair.color=trait('red');await assert.rejects(prepareCompleteReplacement({...f.input,lookBytes:bytes(look)}));
  }finally{await rm(f.dir,{recursive:true,force:true});}
});

test('explicit winter and tier clothing policy conflicts do not infer exposure or grant PASS',()=>{
  const sourced=value=>({value,status:'authored',source:{kind:'canonical-document',documentSHA:'a'.repeat(64),jsonPointer:'/owner',value}});
  const policy={schema:'avatar-clothing-policy.v1',eraBaseline:sourced('WWII-era'),tier:sourced('high'),tierLayerPreference:sourced('thin-light'),surfaceExposure:sourced('frequent'),winterProtection:sourced('warm-outer-layer')};
  assert.equal(clothingPolicySchema.parse(policy).winterProtection.value,'warm-outer-layer');
  assert.throws(()=>clothingPolicySchema.parse({...policy,winterProtection:sourced('not-required-by-exposure')}));
  const underground={...policy,surfaceExposure:sourced('underground'),winterProtection:sourced('not-required-by-exposure')};assert.equal(clothingPolicySchema.parse(underground).tierLayerPreference.value,'thin-light');
  const unknown={...policy,surfaceExposure:{value:null,status:'unknown',source:null},winterProtection:{value:null,status:'unknown',source:null}};assert.equal(clothingPolicySchema.parse(unknown).surfaceExposure.status,'unknown');
  assert.throws(()=>clothingPolicySchema.parse({...policy,surfaceExposure:{value:'frequent',status:'source-approved',source:null}}));
  const literalTier={...unknown,tier:sourced('품계: 주사'),tierLayerPreference:{value:null,status:'unknown',source:null}};
  assert.equal(clothingPolicySchema.parse(literalTier).tier.value,'품계: 주사');
});

test('pinned owner prose accepted without invented canonical field; forged hash rejected; unknown exposure not inferred',async()=>{
  const f=await setup();try{
    const event=bytes({id:'owner-era',message:{role:'user',content:[{type:'text',text:'Base clothing concept is WWII-era.'}]}});
    const source={kind:'owner-event',eventId:'owner-era',eventSHA:sha(event),textRange:[0,33],normalizedValue:'WWII-era',operatorPinnedEventRegistrySHA:null};
    const registryBytes=bytes({schema:'clothing-owner-event-registry.v1',entries:[{field:'eraBaseline',eventId:source.eventId,eventSHA:source.eventSHA,textRange:source.textRange,normalizedValue:source.normalizedValue}]});source.operatorPinnedEventRegistrySHA=sha(registryBytes);
    const trust={...trusts.get(f.input.sourcePath),clothingEventRegistry:{bytes:registryBytes,sha256:sha(registryBytes)},readOwnerEvent:async()=>event};
    const input={...f.input,clothingPolicy:{...f.input.clothingPolicy,eraBaseline:{value:'WWII-era',status:'authored',source}}};
    const p=await prepareNative(input,trust);assert.equal(p.design.completeSource.clothingPolicy.eraBaseline.value,'WWII-era');assert.equal(p.design.completeSource.clothingPolicy.surfaceExposure.value,null);
    await assert.rejects(prepareNative({...input,clothingPolicy:{...input.clothingPolicy,eraBaseline:{...input.clothingPolicy.eraBaseline,source:{...source,eventSHA:'a'.repeat(64)}}}},trust),/forged/);
    const without={...f.input};delete without.clothingPolicy;assert.equal((await prepareNative(without,trust)).design.completeSource.clothingPolicy.surfaceExposure.status,'unknown');
  }finally{await rm(f.dir,{recursive:true,force:true});}
});
