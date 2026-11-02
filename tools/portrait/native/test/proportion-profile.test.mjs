import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { encodeFinalPng } from '../lib/2d/final-alpha-export.mjs';
import { createProportionProfile, createProportionProfileFromArtifacts, measureProportions, verifyProportions, verifyProportionArtifacts, validateProportionProfile, validateSharedProportionProfiles } from '../lib/index.mjs';

function observation() {
  return { imageSHA:'a'.repeat(64),measurementEvidenceSHA:'b'.repeat(64),actualImageMeasured:true,canvas:[1024,1536],bodyType:'synthetic-medium',landmarks:{crown:[500,360],chin:[500,960],headLeft:[200,600],headRight:[800,600],faceTop:[500,500],faceLeft:[350,700],faceRight:[750,700],leftPupil:[520,690],rightPupil:[660,710],leftShoulder:[200,1050],rightShoulder:[800,1050],torsoLeft:[250,1300],torsoRight:[750,1300]} };
}
const profile = () => createProportionProfile({ commonReference:observation(),bodyReference:observation(),bodyType:'synthetic-medium',tolerance:{pixels:2,ratio:0.01,evidenceSHA:'c'.repeat(64)} });

test('batch shares common head and face targets and one reference per body type',()=>{
  const common=observation(),wide=observation();wide.landmarks.rightShoulder[0]+=50;
  const make=(bodyType,commonReference=common,bodyReference=wide)=>createProportionProfile({commonReference,bodyReference,bodyType,tolerance:{pixels:2,ratio:0.01,evidenceSHA:'c'.repeat(64)}});
  assert.deepEqual(validateSharedProportionProfiles([profile(),make('synthetic-wide')]).bodyTypes,['synthetic-medium','synthetic-wide']);
  assert.throws(()=>validateSharedProportionProfiles([profile(),make('synthetic-medium')]),/same body type/);
  const changed=observation();changed.landmarks.faceRight[0]+=10;
  assert.throws(()=>validateSharedProportionProfiles([profile(),make('synthetic-wide',changed)]),/one head and face/);
  assert.throws(()=>validateSharedProportionProfiles([]),/required/);
});

test('shared head/face scale stays fixed while body types have reference-bound ratios',()=>{
  const common=observation(),wide=observation();wide.imageSHA='d'.repeat(64);wide.landmarks.leftShoulder=[100,1050];wide.landmarks.rightShoulder=[900,1050];
  const second=createProportionProfile({commonReference:common,bodyReference:wide,bodyType:'synthetic-wide',tolerance:{pixels:2,ratio:0.01,evidenceSHA:'c'.repeat(64)}});
  assert.deepEqual(second.targets,profile().targets);assert.notEqual(second.ratios.shoulderToHead,profile().ratios.shoulderToHead);
  assert.equal(verifyProportions(profile(),observation()).pass,true);
});
test('larger head, changed face, displaced eyes and wrong torso proportion cannot pass',()=>{
  for(const change of [o=>o.landmarks.headRight[0]+=20,o=>o.landmarks.faceRight[0]+=20,o=>o.landmarks.leftPupil[1]+=20,o=>o.landmarks.torsoRight[0]+=50,o=>o.bodyType='different']){
    const o=observation();change(o);assert.equal(verifyProportions(profile(),o).pass,false);
  }
});
test('profile tampering and unmeasured or missing geometry reject rather than infer',()=>{
  const original=profile();
  const reorder=value=>Array.isArray(value)?value.map(reorder):value!==null&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,reorder(value[key])])):value;
  assert.equal(validateProportionProfile(reorder(original)).profileSHA,original.profileSHA);
  const p=profile();p.targets.headWidth+=10;assert.throws(()=>validateProportionProfile(p),/hash/);
  const o=observation();o.actualImageMeasured=false;assert.throws(()=>measureProportions(o),/actual/);
  delete o.landmarks.torsoLeft;o.actualImageMeasured=true;assert.throws(()=>measureProportions(o),/landmarks/);
});
test('torso ratios reject measurements taken at different cross-section levels',()=>{
  const o=observation();o.landmarks.torsoRight[1]-=1;
  assert.throws(()=>measureProportions(o),/same level/);
});
test('semantic measurement rejects face outside head and pupils outside face',()=>{
  for(const mutate of [o=>o.landmarks.faceTop[1]=300,o=>o.landmarks.faceLeft[0]=100,o=>o.landmarks.faceRight[0]=900]){
    const o=observation();mutate(o);assert.throws(()=>measureProportions(o),/inside the measured head/);
  }
  for(const mutate of [o=>o.landmarks.leftPupil[0]=300,o=>o.landmarks.rightPupil[1]=1000]){
    const o=observation();mutate(o);assert.throws(()=>measureProportions(o),/inside the measured face/);
  }
});
test('artifact verification binds actual image and measurement bytes rather than a supplied evidence digest',()=>{
  const imageBytes=encodeFinalPng({width:1024,height:1536,pixels:Buffer.alloc(1024*1536*4)}),o=observation();
  o.imageSHA=createHash('sha256').update(imageBytes).digest('hex');
  const measurementBytes=Buffer.from(JSON.stringify(o));
  const verdict=verifyProportionArtifacts(profile(),{imageBytes,measurementBytes});
  assert.equal(verdict.pass,true);
  assert.equal(verdict.measurementEvidenceSHA,createHash('sha256').update(measurementBytes).digest('hex'));
  assert.notEqual(verdict.measurementEvidenceSHA,o.measurementEvidenceSHA);
  assert.throws(()=>verifyProportionArtifacts(profile(),{imageBytes:Buffer.from('different image'),measurementBytes}),/image hash mismatch/);
  o.canvas=[1152,1344];
  assert.throws(()=>verifyProportionArtifacts(profile(),{imageBytes,measurementBytes:Buffer.from(JSON.stringify(o))}),/actual PNG/);
  o.canvas=[1024,1536];
  o.actualImageMeasured=false;
  assert.throws(()=>verifyProportionArtifacts(profile(),{imageBytes,measurementBytes:Buffer.from(JSON.stringify(o))}),/actual landmark/);
});
test('production profile construction binds both reference artifacts and the authored tolerance bytes',()=>{
  const imageBytes=encodeFinalPng({width:1024,height:1536,pixels:Buffer.alloc(1024*1536*4)});
  const common=observation(),body=observation();
  common.imageSHA=body.imageSHA=createHash('sha256').update(imageBytes).digest('hex');
  body.bodyType='synthetic-wide';body.landmarks.leftShoulder=[100,1050];body.landmarks.rightShoulder=[900,1050];
  const commonReference={imageBytes,measurementBytes:Buffer.from(JSON.stringify(common))};
  const bodyReference={imageBytes,measurementBytes:Buffer.from(JSON.stringify(body))};
  const toleranceBytes=Buffer.from(JSON.stringify({pixels:2,ratio:0.01}));
  const args={commonReference,bodyReference,bodyType:body.bodyType,toleranceBytes};
  const result=createProportionProfileFromArtifacts(args);
  assert.deepEqual(result.targets,profile().targets);
  assert.equal(result.ratios.shoulderToHead,800/600);
  assert.equal(result.commonMeasurementSHA,createHash('sha256').update(commonReference.measurementBytes).digest('hex'));
  assert.equal(result.bodyMeasurementSHA,createHash('sha256').update(bodyReference.measurementBytes).digest('hex'));
  assert.equal(result.tolerance.evidenceSHA,createHash('sha256').update(toleranceBytes).digest('hex'));
  assert.throws(()=>createProportionProfileFromArtifacts({...args,bodyType:'other'}),/authored body type/);
  assert.throws(()=>createProportionProfileFromArtifacts({...args,commonReference:{...commonReference,imageBytes:Buffer.from('different')}}),/image hash mismatch/);
  assert.throws(()=>createProportionProfileFromArtifacts({...args,bodyReference:{...bodyReference,imageBytes:Buffer.from('different')}}),/image hash mismatch/);
});
