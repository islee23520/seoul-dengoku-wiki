import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { requireBatchReview } from '../lib/batch-review.mjs';
import { createProportionProfile } from '../lib/proportion-profile.mjs';
import { encodeFinalPng } from '../lib/2d/final-alpha-export.mjs';
import { PORTRAIT_ACCEPTANCE_CRITERIA } from '../lib/acceptance-gate.mjs';

test('batch advances only after exact current image and request technical review', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'portrait-review-'));
  try {
    const image = join(dir, 'candidate.png'), reviewPath = join(dir, 'review.json');
    const bytes = Buffer.from('fixture-image'); await writeFile(image, bytes);
    const terminal = { id: 'K103', requestId: 'request-a', result: { path: image } };
    await assert.rejects(requireBatchReview(terminal, reviewPath), /review required/);
    const review = { characterId: 'K103', requestId: 'request-a', sha256: createHash('sha256').update(bytes).digest('hex'), actualImageViewed: true, technicalVerdict: 'pass' };
    await writeFile(reviewPath, JSON.stringify(review));
    await assert.rejects(requireBatchReview(terminal, reviewPath), /proportion profile/);
    for (const changed of [{ technicalVerdict: 'fail' }, { actualImageViewed: false }, { requestId: 'request-b' }, { characterId: 'K104' }, { sha256: 'a'.repeat(64) }]) {
      await writeFile(reviewPath, JSON.stringify({ ...review, ...changed }));
      await assert.rejects(requireBatchReview(terminal, reviewPath), /must pass/);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('failed and unknown requests stay held even with a review path', async () => {
  await assert.rejects(requireBatchReview({ id: 'K105', status: 'DISPATCHED_RESPONSE_UNKNOWN' }, 'unused'), /reconciliation/);
  await assert.rejects(requireBatchReview({ id: 'K103', error: 'HTTP 503' }, 'unused'), /reconciliation/);
});

test('profile-bound batch holds missing or failed measurements despite passing artwork review', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'portrait-proportion-review-'));
  try {
    const image = join(dir, 'candidate.png'), reviewPath = join(dir, 'review.json'), measurementPath = join(dir, 'measurement.json');
    const pixels = Buffer.alloc(1024*1536*4); pixels.set([10,20,30,255]);
    const bytes = encodeFinalPng({ width:1024, height:1536, pixels });
    const observation = { imageSHA:createHash('sha256').update(bytes).digest('hex'), measurementEvidenceSHA:'b'.repeat(64), actualImageMeasured:true, canvas:[1024,1536], bodyType:'synthetic-medium', landmarks:{crown:[500,360],chin:[500,960],headLeft:[200,600],headRight:[800,600],faceTop:[500,500],faceLeft:[350,700],faceRight:[750,700],leftPupil:[520,690],rightPupil:[660,710],leftShoulder:[200,1050],rightShoulder:[800,1050],torsoLeft:[250,1300],torsoRight:[750,1300]} };
    const profile = createProportionProfile({ commonReference:observation, bodyReference:observation, bodyType:observation.bodyType, tolerance:{pixels:2,ratio:0.01,evidenceSHA:'c'.repeat(64)} });
    const terminal = { id:'K103', requestId:'request-a', result:{path:image} };
    await writeFile(image, bytes);
    const review = { characterId:terminal.id, requestId:terminal.requestId, sha256:observation.imageSHA, actualImageViewed:true, technicalVerdict:'pass' };
    await writeFile(reviewPath, JSON.stringify(review));
    await writeFile(measurementPath,JSON.stringify(observation));
    await assert.rejects(requireBatchReview(terminal,reviewPath,{profile,measurementPath}),/integrated portrait acceptance/);
    for (const naturalSilhouetteVerdict of ['fail','unverified']) {
      await writeFile(reviewPath, JSON.stringify({...review,naturalSilhouetteVerdict}));
      await assert.rejects(requireBatchReview(terminal,reviewPath,{profile,measurementPath}),/integrated portrait acceptance/);
    }
    const criteria = Object.fromEntries([...PORTRAIT_ACCEPTANCE_CRITERIA.qualityRows,...PORTRAIT_ACCEPTANCE_CRITERIA.semanticRows].map(name=>[name,{verdict:'pass',scope:'whole-image',imageSHA:observation.imageSHA,evidenceSHA:'e'.repeat(64)}]));
    await writeFile(reviewPath, JSON.stringify({...review,acceptanceSchema:PORTRAIT_ACCEPTANCE_CRITERIA.schema,criteria}));
    await assert.rejects(requireBatchReview(terminal,reviewPath,{profile}),/measurement artifact missing/);
    await writeFile(measurementPath,JSON.stringify(observation));
    const verdict = await requireBatchReview(terminal,reviewPath,{profile,measurementPath});
    assert.equal(verdict.proportions.pass,true);
    assert.equal(verdict.ownerApprovalImplied,false);
    observation.landmarks.faceRight[0]+=20;
    await writeFile(measurementPath,JSON.stringify(observation));
    await assert.rejects(requireBatchReview(terminal,reviewPath,{profile,measurementPath}),/faceWidth/);
    observation.imageSHA='d'.repeat(64);
    await writeFile(measurementPath,JSON.stringify(observation));
    await assert.rejects(requireBatchReview(terminal,reviewPath,{profile,measurementPath}),/image hash mismatch/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
