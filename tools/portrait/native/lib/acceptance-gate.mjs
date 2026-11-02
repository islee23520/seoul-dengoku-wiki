import { createHash } from 'node:crypto';
import { decodeCodexPng } from './2d/codex-image.mjs';
import { verifyProportionArtifacts } from './proportion-profile.mjs';

export const PORTRAIT_ACCEPTANCE_CRITERIA = Object.freeze({
  schema: 'portrait-integrated-acceptance.v1',
  canvas: Object.freeze([1024, 1536]),
  qualityRows: Object.freeze(['Q01','Q02','Q03','Q04','Q05','Q06','Q07','Q08','Q09','Q10']),
  semanticRows: Object.freeze(['authoredIdentity','approvedPositionIntervals','opaqueInterior','naturalSilhouette','defringe']),
  minimumCoreFraction: 0.9,
  coreAlphaMinimum: 250,
});

export function evaluatePortraitAcceptance({ characterId, requestId, imageBytes, review, profile, measurementBytes }) {
  const imageSHA = createHash('sha256').update(imageBytes).digest('hex');
  const failures = [];
  const criteria = PORTRAIT_ACCEPTANCE_CRITERIA;
  if (!review || review.characterId !== characterId || review.requestId !== requestId || review.sha256 !== imageSHA || review.actualImageViewed !== true || review.technicalVerdict !== 'pass') failures.push('exactImageReview');
  if (review?.acceptanceSchema !== criteria.schema) failures.push('acceptanceSchema');
  const image = decodeCodexPng(Buffer.from(imageBytes));
  if (image.width !== 1024 || image.height !== 1536 || image.channels !== 4) failures.push('canvasRGBA');
  let foreground = 0, core = 0, transparent = 0, nonopaque = 0;
  if (image.channels === 4) for (let i = 3; i < image.pixels.length; i += 4) {
    const alpha = image.pixels[i];
    if (alpha === 0) { transparent++; continue; }
    foreground++;
    if (alpha >= criteria.coreAlphaMinimum) core++;
    if (alpha < 255) nonopaque++;
  }
  const coreFraction = foreground ? core / foreground : 0;
  if (!transparent || !foreground || coreFraction < criteria.minimumCoreFraction) failures.push('alphaCoreAndBackground');
  // Semantic criteria require whole-image, exact-image evidence. They are not inferred from alpha counts.
  for (const name of [...criteria.qualityRows, ...criteria.semanticRows]) {
    const row = review?.criteria?.[name];
    if (row?.verdict !== 'pass' || row.scope !== 'whole-image' || row.imageSHA !== imageSHA || !/^[a-f0-9]{64}$/.test(row.evidenceSHA ?? '')) failures.push(name);
  }
  let proportions = null;
  if (!profile || !measurementBytes) failures.push('measuredProportions');
  else {
    proportions = verifyProportionArtifacts(profile, { imageBytes, measurementBytes });
    if (!proportions.pass) failures.push(...proportions.failures.map(name => 'proportion:' + name));
  }
  return { schema: criteria.schema, characterId, requestId, imageSHA, pass: failures.length === 0, failures, coreFraction, nonopaqueForegroundPixels: nonopaque, strictOpaqueForegroundPass: foreground > 0 && nonopaque === 0, proportions, semanticVerification: 'image-bound reviewer assertions, not automated recognition', ownerApprovalImplied: false, releaseApprovalImplied: false };
}
