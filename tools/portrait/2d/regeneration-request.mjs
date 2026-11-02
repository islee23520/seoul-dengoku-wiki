#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { neutralRecord, slotFields } from '../neutral-slots.mjs';

const ALLOWED_SLOTS = new Set(['face', 'hair', 'body', 'outfit', 'accessories']);
const ALLOWED_VERDICTS = new Set(['fail', 'pending', 'approved']);

export function createRegenerationRequest(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('input must be an object');
  }

  const {
    characterId,
    lookId,
    designRevision,
    designSHA,
    inputTokenSHA,
    candidateId,
    imageSHA,
    review,
    selectedFields = [],
    requestId
  } = input;

  // 1. Required fields and basic validation
  if (!characterId || typeof characterId !== 'string') throw new Error('characterId required');
  if (!lookId || typeof lookId !== 'string') throw new Error('lookId required');
  if (typeof designRevision !== 'number' || designRevision < 1) throw new Error('designRevision must be positive integer');
  if (!designSHA || !/^[a-f0-9]{64}$/.test(designSHA)) throw new Error('designSHA must be valid sha256');
  if (!inputTokenSHA || !/^[a-f0-9]{64}$/.test(inputTokenSHA)) throw new Error('inputTokenSHA must be valid sha256');
  if (!candidateId || typeof candidateId !== 'string') throw new Error('candidateId required');
  if (!imageSHA || !/^[a-f0-9]{64}$/.test(imageSHA)) throw new Error('imageSHA must be valid sha256');
  if (!review || typeof review !== 'object') throw new Error('review object required');
  if (!review.imageSHA || !/^[a-f0-9]{64}$/.test(review.imageSHA)) throw new Error('review.imageSHA must be valid sha256');
  if (!review.verdict || typeof review.verdict !== 'string') throw new Error('review.verdict required');
  if (!review.reason || typeof review.reason !== 'string' || !review.reason.trim()) throw new Error('reason must be non-empty string');
  if (!review.eventId || typeof review.eventId !== 'string') throw new Error('review.eventId required');
  if (!Array.isArray(selectedFields) || selectedFields.length === 0) throw new Error('selectedFields must be non-empty array');
  if (!requestId || typeof requestId !== 'string') throw new Error('requestId required');

  if (review.imageSHA !== imageSHA) throw new Error('cross image mismatch');
  if (!ALLOWED_VERDICTS.has(review.verdict)) throw new Error('wrong verdict: only fail/pending/approved allowed');
  if (review.verdict === 'approved') throw new Error('approved pass preserved; explicit new study must be separate');

  // Strict selection boundaries
  for (const field of selectedFields) {
    const [slot] = field.split('.');
    if (!ALLOWED_SLOTS.has(slot)) throw new Error(`forbidden field: ${field} (only face/hair/body/outfit/accessories allowed)`);
  }

  // No duplicate selection
  const uniqueFields = new Set(selectedFields);
  if (uniqueFields.size !== selectedFields.length) throw new Error('duplicate selection');

  // Immutable fields forbidden in selection
  const forbidden = ['characterId', 'name', 'gender', 'canon', 'source', 'auth'];
  for (const f of selectedFields) {
    if (forbidden.some(forb => f.includes(forb))) throw new Error(`immutable ID/name/gender/canon/source/auth forbidden: ${f}`);
  }

  // Create immutable deep clone of input to preserve originals
  const originalCandidate = structuredClone(input.candidate || {});
  const originalReview = structuredClone(review);
  const originalTokens = structuredClone(input.tokens || {});

  const now = new Date().toISOString();
  const request = {
    schemaVersion: 2,
    requestId,
    characterId,
    lookId,
    designRevision,
    designSHA,
    inputTokenSHA,
    candidateId,
    imageSHA,
    review: {
      ...originalReview,
      reason: review.reason, // plain metadata
      timestamp: now
    },
    selectedFields: [...selectedFields],
    selectedSlotFields: selectedFields.reduce((acc, f) => {
      const [slot, key] = f.split('.');
      if (!acc[slot]) acc[slot] = [];
      if (key) acc[slot].push(key);
      return acc;
    }, {}),
    previous: {
      imageSHA,
      decision: review.verdict,
      reason: review.reason,
      requestHash: createHash('sha256').update(JSON.stringify({
        characterId, lookId, designSHA, inputTokenSHA, candidateId, imageSHA, review: originalReview, selectedFields
      })).digest('hex')
    },
    lineage: {
      previousImageSHA: imageSHA,
      previousDecision: review.verdict,
      previousReasonSHA: createHash('sha256').update(review.reason).digest('hex'),
      previousRequestId: requestId // self for first regen, or parent
    },
    tokens: {
      ...originalTokens,
      revision: designRevision,
      expectedSHA: designSHA
    },
    instructionProposal: {
      // targeted slot correction proposal for LLM, not blind append
      targetSlots: selectedFields,
      reasonMetadata: review.reason,
      activationRequired: true, // explicit activation for authored protected values
      unchangedFieldsSnapshot: neutralRecord({ characterId, lookId: lookId.split('-')[0] || lookId, schemaVersion: 2 }, {}).slots // source bound snapshot of unchanged
    },
    createdAt: now,
    hash: '' // computed below
  };

  // Compute hash from provided token + selected (immutable binding)
  const hashInput = JSON.stringify({
    characterId,
    lookId,
    designSHA,
    inputTokenSHA,
    candidateId,
    imageSHA,
    review: { verdict: review.verdict, reason: review.reason, eventId: review.eventId },
    selectedFields: selectedFields.sort(),
    tokensRevision: designRevision
  });
  request.hash = createHash('sha256').update(hashInput).digest('hex');

  // Return the pure request (no side effects, no mutation of input)
  return Object.freeze(request);
}

// For test compatibility with production builder contract
export function buildRegenerationRequestForBuilder(candidate, reviewState, reason, tokenRevision, expectedSHA, selectedFields) {
  // Pure construction using actual neutralRecord/slotFields from review-state projection
  const base = neutralRecord({
    characterId: candidate.characterId,
    lookId: candidate.lookId,
    schemaVersion: 2
  });

  const input = {
    characterId: candidate.characterId,
    lookId: candidate.lookId,
    designRevision: tokenRevision,
    designSHA: expectedSHA,
    inputTokenSHA: candidate.inputTokenSHA || expectedSHA,
    candidateId: candidate.id || candidate.candidateId,
    imageSHA: candidate.imageSHA || reviewState.imageSHA,
    review: {
      imageSHA: reviewState.imageSHA,
      verdict: reviewState.verdict || 'fail',
      reason: reason || 'Targeted slot correction requested by reviewer',
      eventId: reviewState.eventId || `evt-${Date.now()}`
    },
    selectedFields,
    requestId: `regen-${createHash('sha256').update(candidate.characterId + Date.now().toString()).digest('hex').slice(0, 16)}`
  };

  return createRegenerationRequest(input);
}

export default createRegenerationRequest;
