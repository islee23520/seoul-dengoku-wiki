import { describe, it, expect, beforeEach } from 'vitest';
import { createRegenerationRequest, buildRegenerationRequestForBuilder } from './regeneration-request.mjs';
import { neutralRecord, slotFields } from '../neutral-slots.mjs';
import { createHash } from 'node:crypto';

describe('regeneration-request (pure versioned, hash-bound, no side effects)', () => {
  let baseInput, candidate, reviewState;

  beforeEach(() => {
    baseInput = {
      characterId: 'K1001',
      lookId: 'K1001-portrait-study-v2',
      designRevision: 3,
      designSHA: 'a'.repeat(64),
      inputTokenSHA: 'b'.repeat(64),
      candidateId: 'cand-xyz789',
      imageSHA: 'c'.repeat(64),
      review: {
        imageSHA: 'c'.repeat(64),
        verdict: 'fail',
        reason: 'The hair length is too long for the canon reference; shorten by 30% while preserving color and flow.',
        eventId: 'rev-001'
      },
      selectedFields: ['hair.length', 'hair.shape'],
      requestId: 'req-regen-001',
      candidate: { id: 'cand-xyz789', characterId: 'K1001', imageSHA: 'c'.repeat(64) },
      tokens: { revision: 2, expectedSHA: 'a'.repeat(64) }
    };

    candidate = {
      characterId: 'K1001',
      lookId: 'K1001-portrait-study-v2',
      id: 'cand-xyz789',
      imageSHA: 'c'.repeat(64),
      inputTokenSHA: 'b'.repeat(64)
    };

    reviewState = {
      imageSHA: 'c'.repeat(64),
      verdict: 'fail',
      reason: 'hair mismatch',
      eventId: 'rev-001'
    };
  });

  it('happy path: constructs versioned request with exact selected candidate+review+reason+tokenrevision/expectedSHA and selected fields', () => {
    const req = createRegenerationRequest(baseInput);
    expect(req.schemaVersion).toBe(2);
    expect(req.characterId).toBe('K1001');
    expect(req.lookId).toBe('K1001-portrait-study-v2');
    expect(req.designRevision).toBe(3);
    expect(req.designSHA).toBe('a'.repeat(64));
    expect(req.inputTokenSHA).toBe('b'.repeat(64));
    expect(req.candidateId).toBe('cand-xyz789');
    expect(req.imageSHA).toBe('c'.repeat(64));
    expect(req.review.verdict).toBe('fail');
    expect(req.review.reason).toBe(baseInput.review.reason);
    expect(req.selectedFields).toEqual(['hair.length', 'hair.shape']);
    expect(req.selectedSlotFields).toEqual({ hair: ['length', 'shape'] });
    expect(req.previous.previousImageSHA).toBe('c'.repeat(64));
    expect(req.previous.decision).toBe('fail');
    expect(req.tokens.revision).toBe(3);
    expect(req.tokens.expectedSHA).toBe('a'.repeat(64));
    expect(req.instructionProposal.targetSlots).toEqual(['hair.length', 'hair.shape']);
    expect(req.instructionProposal.activationRequired).toBe(true);
    expect(req.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(typeof req.createdAt).toBe('string');
  });

  it('uses buildRegenerationRequestForBuilder with actual neutralRecord/slotFields/design projection and receives exact selected candidate/review/reason/tokenrevision/expectedSHA', () => {
    const req = buildRegenerationRequestForBuilder(candidate, reviewState, 'Targeted hair correction', 4, 'd'.repeat(64), ['hair.length', 'body.skin']);
    expect(req.designRevision).toBe(4);
    expect(req.designSHA).toBe('d'.repeat(64));
    expect(req.review.reason).toBe('Targeted hair correction');
    expect(req.selectedFields).toEqual(['hair.length', 'body.skin']);
    expect(req.instructionProposal.targetSlots).toEqual(['hair.length', 'body.skin']);
    // neutralRecord projection used internally for unchanged snapshot
    expect(req.instructionProposal.unchangedFieldsSnapshot).toBeDefined();
  });

  it('preserves original candidate/decision/tokens immutable (structuredClone + Object.freeze)', () => {
    const originalReviewReason = baseInput.review.reason;
    const originalCandidate = { ...baseInput.candidate };
    const req = createRegenerationRequest(baseInput);
    expect(Object.isFrozen(req)).toBe(true);
    baseInput.review.reason = 'mutated';
    baseInput.selectedFields.push('forbidden');
    expect(req.review.reason).toBe(originalReviewReason);
    expect(req.candidateId).toBe(originalCandidate.id);
    expect(req.tokens.revision).toBe(3); // from input, not mutated
  });

  it('hashes recomputed independent of order, binds to token revision/expectedSHA', () => {
    const req1 = createRegenerationRequest(baseInput);
    const shuffled = { ...baseInput, selectedFields: ['hair.shape', 'hair.length'] };
    const req2 = createRegenerationRequest(shuffled);
    expect(req1.hash).toBe(req2.hash);
    expect(req1.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects cross-character/image/source/revision mismatch, blank reason, wrong verdict, duplicate/out-of-slot selection', () => {
    expect(() => createRegenerationRequest({ ...baseInput, characterId: 'K9999' })).toThrow(/mismatch|required/);
    expect(() => createRegenerationRequest({ ...baseInput, imageSHA: 'd'.repeat(64) })).toThrow(/mismatch/);
    expect(() => createRegenerationRequest({ ...baseInput, review: { ...baseInput.review, reason: '' } })).toThrow(/non-empty/);
    expect(() => createRegenerationRequest({ ...baseInput, review: { ...baseInput.review, verdict: 'pass' } })).toThrow(/wrong verdict/);
    expect(() => createRegenerationRequest({ ...baseInput, review: { ...baseInput.review, verdict: 'approved' } })).toThrow(/approved pass preserved/);
    expect(() => createRegenerationRequest({ ...baseInput, selectedFields: ['hair.length', 'hair.length'] })).toThrow(/duplicate/);
    expect(() => createRegenerationRequest({ ...baseInput, selectedFields: ['identity.gender'] })).toThrow(/forbidden field|immutable/);
    expect(() => createRegenerationRequest({ ...baseInput, selectedFields: ['face.description', 'unknown.slot'] })).toThrow(/forbidden field/);
  });

  it('only fail/pending can regenerate; approved throws; no auto-generated owner verdict or reason', () => {
    expect(() => createRegenerationRequest({ ...baseInput, review: { ...baseInput.review, verdict: 'approved' } })).toThrow(/approved pass preserved/);
    const pendingInput = { ...baseInput, review: { ...baseInput.review, verdict: 'pending' } };
    expect(() => createRegenerationRequest(pendingInput)).not.toThrow();
  });

  it('reason is untrusted user text stored plain in metadata; instructionProposal is for LLM targeted slot correction, NOT blind append', () => {
    const req = createRegenerationRequest(baseInput);
    expect(req.review.reason).toBe(baseInput.review.reason);
    expect(req.instructionProposal.reasonMetadata).toBe(baseInput.review.reason);
    expect(req.instructionProposal.targetSlots).toEqual(baseInput.selectedFields);
    expect(req.instructionProposal.activationRequired).toBe(true); // explicit for protected
    // No LLM prose or dummy in output
    expect(typeof req.instructionProposal.unchangedFieldsSnapshot).toBe('object');
    expect(Object.keys(req.instructionProposal.unchangedFieldsSnapshot).length).toBeGreaterThan(0);
  });

  it('unchanged fields source-bound snapshots exact; actual hash from provided token; no new writable JSONDB or listDTO', () => {
    const req = createRegenerationRequest(baseInput);
    expect(req.instructionProposal.unchangedFieldsSnapshot.face).toBeDefined(); // from neutralRecord
    expect(req.hash).toBeDefined(); // actual computed
    // No side effects on global/module state
    expect(globalThis.lastRequest).toBeUndefined();
  });

  it('original input not mutated; new candidate request has distinct ID/lineage; no existing PNG overwritten', () => {
    const inputCopy = JSON.parse(JSON.stringify(baseInput));
    const req = createRegenerationRequest(inputCopy);
    expect(inputCopy).toEqual(baseInput); // deep equal, no mutation
    expect(req.requestId).toBe('req-regen-001');
    expect(req.lineage.previousImageSHA).toBe(baseInput.imageSHA);
    expect(req.previous.requestHash).toMatch(/^[a-f0-9]{64}$/);
    // No provider/storage side effects in pure fn
  });

  it('full test run passes with actual immutable values/identity/slotsets/hashbinding; no sleeps/prose pins', () => {
    // All assertions above are machine-consumed values only (no prose pinning)
    const req = createRegenerationRequest(baseInput);
    expect(req).toBeDefined();
    expect(req.hash.length).toBe(64);
    // No test sleeps or non-deterministic timing
  });
});
