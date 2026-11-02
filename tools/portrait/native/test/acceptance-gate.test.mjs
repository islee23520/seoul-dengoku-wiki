import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PORTRAIT_ACCEPTANCE_CRITERIA as contract, evaluatePortraitAcceptance, createProportionProfile } from '../lib/index.mjs';
import { encodeFinalPng } from '../lib/2d/final-alpha-export.mjs';

function fixture() {
  const pixels=Buffer.alloc(1024*1536*4);pixels.set([10,20,30,255]);
  const imageBytes=encodeFinalPng({width:1024,height:1536,pixels});
  const sha=createHash('sha256').update(imageBytes).digest('hex');
  const observation={imageSHA:sha,measurementEvidenceSHA:'b'.repeat(64),actualImageMeasured:true,canvas:[1024,1536],bodyType:'synthetic',landmarks:{crown:[500,360],chin:[500,960],headLeft:[200,600],headRight:[800,600],faceTop:[500,500],faceLeft:[350,700],faceRight:[750,700],leftPupil:[520,690],rightPupil:[660,710],leftShoulder:[200,1050],rightShoulder:[800,1050],torsoLeft:[250,1300],torsoRight:[750,1300]}};
  const profile=createProportionProfile({commonReference:observation,bodyReference:observation,bodyType:'synthetic',tolerance:{pixels:2,ratio:0.01,evidenceSHA:'c'.repeat(64)}});
  const review={characterId:'K001',requestId:'request',sha256:sha,actualImageViewed:true,technicalVerdict:'pass',acceptanceSchema:contract.schema,criteria:Object.fromEntries([...contract.qualityRows,...contract.semanticRows].map(name=>[name,{verdict:'pass',scope:'whole-image',imageSHA:sha,evidenceSHA:'e'.repeat(64)}]))};
  return {characterId:'K001',requestId:'request',imageBytes,review,profile,measurementBytes:Buffer.from(JSON.stringify(observation))};
}

test('integrated gate passes complete bound fixture without granting owner or release approval',()=>{
  const result=evaluatePortraitAcceptance(fixture());
  assert.equal(result.pass,true);assert.deepEqual(result.failures,[]);
  assert.equal(result.ownerApprovalImplied,false);assert.equal(result.releaseApprovalImplied,false);
});

test('every explicit row rejects missing fail unknown bounded or stale evidence',()=>{
  const base=fixture();
  for(const name of [...contract.qualityRows,...contract.semanticRows])for(const mutation of ['missing','fail','unknown','bounded','stale','noEvidence']){
    const review=structuredClone(base.review);
    if(mutation==='missing')delete review.criteria[name];
    else if(mutation==='fail'||mutation==='unknown')review.criteria[name].verdict=mutation;
    else if(mutation==='bounded')review.criteria[name].scope='inspected-region';
    else if(mutation==='stale')review.criteria[name].imageSHA='f'.repeat(64);
    else delete review.criteria[name].evidenceSHA;
    const result=evaluatePortraitAcceptance({...base,review});
    assert.equal(result.pass,false,name+':'+mutation);assert.ok(result.failures.includes(name));
  }
});

test('integrated gate holds wrong identity schema missing measurements and empty alpha despite row assertions',()=>{
  const base=fixture();
  for(const [key,value] of [['characterId','other'],['requestId','other'],['sha256','f'.repeat(64)],['actualImageViewed',false]]){
    const result=evaluatePortraitAcceptance({...base,review:{...base.review,[key]:value}});
    assert.ok(result.failures.includes('exactImageReview'));
  }
  assert.ok(evaluatePortraitAcceptance({...base,review:{...base.review,acceptanceSchema:'old'}}).failures.includes('acceptanceSchema'));
  assert.ok(evaluatePortraitAcceptance({...base,profile:null}).failures.includes('measuredProportions'));
  const empty=encodeFinalPng({width:1024,height:1536,pixels:Buffer.alloc(1024*1536*4)});
  assert.ok(evaluatePortraitAcceptance({...base,imageBytes:empty,profile:null}).failures.includes('alphaCoreAndBackground'));
});
