import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { evaluatePortraitAcceptance } from './acceptance-gate.mjs';

export async function requireBatchReview(terminal, reviewPath, proportionRequirement = null) {
  if (!terminal.result?.path || terminal.error || terminal.status === 'DISPATCHED_RESPONSE_UNKNOWN') throw new Error('batch held: failed or unknown response requires reconciliation');
  const image = await readFile(terminal.result.path);
  const imageSHA = createHash('sha256').update(image).digest('hex');
  let review;
  try { review = JSON.parse(await readFile(reviewPath, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') throw new Error('batch held: actual image review required before next request'); throw error; }
  if (review.characterId !== terminal.id || review.sha256 !== imageSHA || review.requestId !== terminal.requestId || review.actualImageViewed !== true || review.technicalVerdict !== 'pass') throw new Error('batch held: exact image-bound technical review must pass');
  if (!proportionRequirement?.profile || !proportionRequirement.measurementPath) throw new Error('batch held: required proportion profile and measurement artifact missing');
  const measurementBytes = await readFile(proportionRequirement.measurementPath);
  const acceptance = evaluatePortraitAcceptance({ characterId: terminal.id, requestId: terminal.requestId, imageBytes: image, review, profile: proportionRequirement.profile, measurementBytes });
  if (!acceptance.pass) throw new Error('batch held: integrated portrait acceptance must pass: ' + acceptance.failures.join(', '));
  return { characterId: terminal.id, imageSHA, reviewPath, technicalVerdict: 'pass', acceptance, proportions: acceptance.proportions, ownerApprovalImplied: false };
}
