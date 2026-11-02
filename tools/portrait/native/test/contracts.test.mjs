import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture, modeFixture, bytes } from './fixture.mjs';
import { fullbodyTokens, partTokens, previewPortrait, sha, strictJSONParse, modeToken, project, generationFacing, validateProjection, fields, composeModificationRequest, resolveSourceAssets, parse } from '../lib/index.mjs';
const changed=(f,fn)=>{fn(f.modeSource);const modeBytes=bytes(f.modeSource);return {...f.input,modeBytes,modeSHA:sha(modeBytes)};};
test('portrait uses native model and exact source snapshot; 19 normalized fields bind unchanged generation model',()=>{
  const f=fixture(), p=project(f.normalized); assert.equal(p.generationModel.schema,'character-art-2d.v1'); assert.deepEqual(Object.keys(p.fields),fields); assert.equal(fields.length,19);
  for(const k of ['camera','scene','makeup','lighting','color_grading']) assert.deepEqual(p.fields[k],{status:'unknown',sources:[],value:null});
  assert.deepEqual(generationFacing(JSON.stringify(p),f.normalized),f.design);
  p.fields.camera.value='invented'; assert.throws(()=>validateProjection(JSON.stringify(p),f.normalized));
  assert.throws(()=>strictJSONParse('{"a":1,"\\u0061":2}'),/Duplicate/);
});
test('all mode projections preserve identity schema slots and missing coverage remains explicitly unknown',()=>{
  const f=fixture(); for(const mode of ['portrait','fullbody','3Dparts']) {const p=modeToken({lookBytes:f.lookBytes,inputSnapshotSHA:f.inputSnapshotSHA,mode});assert.deepEqual(p.shared,f.look);assert.equal(p.modeSpecific.coverage,null);assert.equal(p.hiddenAnatomyInferred,false);}
  assert.throws(()=>fullbodyTokens({lookBytes:f.lookBytes,inputSnapshotSHA:f.inputSnapshotSHA}),/authored/);
});
test('fullbody assembly uses authored canvas pose coverage and complete lower garment',()=>{
  const f=modeFixture('fullbody'), p=fullbodyTokens(f.input);assert.deepEqual(p.assembled.slots,f.look.slots);assert.equal(p.assembled.canvas.value.height,2048);assert.deepEqual(p.assembled.pose,f.modeSource.pose);
  assert.throws(()=>fullbodyTokens(changed(f,s=>delete s.coverage.value.footwear)),/footwear/);
});
test('3D part routing protects skin hair and face from garment transfer, stable IDs hashes attachments and units',()=>{
  const f=modeFixture('3Dparts'), a=partTokens(f.input),b=partTokens(f.input);assert.deepEqual(a,b);assert.equal(a.parts.length,7);assert.equal(a.meshGenerated,false);
  const upper=a.parts.find(p=>p.part==='upper'), body=a.parts.find(p=>p.part==='body'),hair=a.parts.find(p=>p.part==='hair');
  assert.deepEqual(Object.keys(upper.slots),['outfit']);assert.equal(upper.slots.outfit.upper.value,'Blue jacket');assert.equal(upper.slots.body,undefined);assert.equal(upper.slots.hair,undefined);
  assert.equal(body.slots.body.skin.value,'Warm brown');assert.equal(body.slots.body.height.unit,'cm');assert.equal(hair.slots.hair.description.value,'Short black hair');assert.equal(upper.parentId,body.partId);assert.equal(upper.attachment.unit,'cm');assert.equal(upper.geometry.status,'unknown');assert.equal(upper.slots.outfit.upper.documentSHA,f.input.inputSnapshotSHA);
  const old=upper.partId,oldHash=upper.tokenSHA; const changedToken=partTokens(changed(f,s=>s.pose.value.anchors.upper.position=[1,2,3]));const u=changedToken.parts.find(p=>p.part==='upper');assert.equal(u.partId,old);assert.notEqual(u.tokenSHA,oldHash);
});
test('3D rejects missing anchors unknown parts duplicate segmentation wrong units cycles and absent visibility',()=>{
  for(const mutate of [s=>delete s.pose.value.anchors.hair,s=>s.pose.value.unit='pixels',s=>s.parts.value.push('skin'),s=>s.parts.value.push('head'),s=>s.pose.value.anchors.body.parent='hair',s=>delete s.coverage.value.upper]) {const f=modeFixture('3Dparts');assert.throws(()=>partTokens(changed(f,mutate)));}
});
test('unit identity source and UNIQUE mutations rejected before provider',()=>{
  const f=fixture(); const run=look=>previewPortrait({lookBytes:bytes(look),references:f.references,composition:f.composition,packageVersion:1});
  let l=structuredClone(f.look);l.slots.body.height.unit=null;assert.throws(()=>run(l));l=structuredClone(f.look);l.identity.name='Other';assert.throws(()=>run(l));l=structuredClone(f.look);l.uniqueFaceRequired=true;l.faceMode={kind:'template',variantId:'synthetic'};assert.throws(()=>run(l));assert.throws(()=>modeToken({lookBytes:f.lookBytes,inputSnapshotSHA:'a'.repeat(64),mode:'portrait'}));
});
test('source assets are injectable and actual bytes hashes enforced',async()=>{
  const value=Buffer.from('external fixture');assert.deepEqual(await resolveSourceAssets([{index:1,sha256:sha(value)}],{read:async()=>value}),[value]);await assert.rejects(resolveSourceAssets([{index:1,sha256:'a'.repeat(64)}],{read:async()=>value}));
});
test('modify request changes only activated complete slots and rejects stale original',()=>{
  const f=fixture(), binding={sourceImageSha256:sha(Buffer.from('image')),packageVersion:1,inputSnapshotSHA:f.inputSnapshotSHA};
  const p=composeModificationRequest({original:f.look,originalBytes:f.lookBytes,changes:{outfit:f.look.slots.outfit},activatedSlots:['outfit'],...binding,expected:binding});assert.deepEqual(p.slots.hair,f.look.slots.hair);assert.throws(()=>composeModificationRequest({original:f.look,originalBytes:bytes({}),changes:{outfit:f.look.slots.outfit},activatedSlots:['outfit'],...binding,expected:binding}));
});
test('missing fabric schema keeps neckline protected and never rewrites fabricPresent true',()=>{
  const f=fixture(), base={operation:'garment-edit',fabricPresent:false,fabricationCase:'missing-fabric',contractSHA:'a'.repeat(64),maskSHA:'b'.repeat(64),originalLookSHA:'c'.repeat(64),maskSemantics:'binary-alpha-zero-editable.v1',activatedSlots:['appearance.outfit.upper'],instruction:'Correct only activated garment leaves using their authored values. For missing-fabric, add the upper garment and preserve the neckline. Preserve all unactivated authored fields, identity, face, hair, body, skin, props and frame. Mask alpha zero is editable; alpha 255 is protected.'};
  assert.equal(parse({...f.design,garmentEdit:base}).garmentEdit.fabricPresent,false);assert.throws(()=>parse({...f.design,garmentEdit:{...base,activatedSlots:['appearance.outfit.upper','appearance.outfit.neckline']}}));assert.throws(()=>parse({...f.design,garmentEdit:{...base,fabricPresent:true}}));
});
