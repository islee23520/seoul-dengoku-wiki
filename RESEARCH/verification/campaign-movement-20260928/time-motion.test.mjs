import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advanceMotion } from './time-motion.mjs';

// Synthetic dimensions and rates only: not metres/seconds or product balance.
const sample = (numerator = 7, denominator = 3) => ({
  state: { worldTimeU: 0, distanceU: 0, remainder: 0 }, elapsedU: 5,
  speedNumerator: numerator, speedDenominator: denominator,
  worldActive: true, battleLocked: false,
  edges: [
    { id: 'road', from: 'S0', to: 'S1', fromLayer: 'surface', toLayer: 'surface', transfer: false, distanceU: 10, allowed: true, blocked: false, endZoc: false },
    { id: 'entry', from: 'S1', to: 'U0', fromLayer: 'surface', toLayer: 'subway', transfer: true, distanceU: 5, allowed: true, blocked: false, endZoc: false },
  ],
});

test('two synthetic squad rates cross explicit road/transfer distances', () => {
  assert.deepEqual(advanceMotion(sample()), { worldTimeU: 5, distanceU: 11, remainder: 2 });
  assert.deepEqual(advanceMotion(sample(5, 2)), { worldTimeU: 5, distanceU: 12, remainder: 1 });
});

test('elapsed partitions preserve exact carry, including arrival with no banked distance', () => {
  for (const [numerator, denominator] of [[7, 3], [5, 2]]) {
    for (const elapsedU of [0, 1, 5, 7, 20]) {
      const input = sample(numerator, denominator);
      const whole = advanceMotion({ ...input, elapsedU });
      for (let first = 0; first <= elapsedU; first++) {
        const state = advanceMotion({ ...input, elapsedU: first });
        assert.deepEqual(advanceMotion({ ...input, state, elapsedU: elapsedU - first }), whole);
      }
    }
  }
});

test('empty world pauses authoritative time; battle lock advances world but not squad', () => {
  const input = sample();
  assert.deepEqual(advanceMotion({ ...input, worldActive: false }), input.state);
  assert.deepEqual(advanceMotion({ ...input, battleLocked: true }), { ...input.state, worldTimeU: 5 });
  const locked = advanceMotion({ ...input, battleLocked: true });
  assert.equal(advanceMotion({ ...input, state: locked, elapsedU: 1 }).distanceU, 2, 'no paused-time catch-up');
});

test('invalid path/access/numbers reject without changing caller state', () => {
  for (const mutate of [
    input => { input.edges[1].blocked = true; }, input => { input.edges[1].allowed = false; },
    input => { input.edges[1].transfer = false; }, input => { input.edges[1].from = 'wrong'; },
    input => { input.edges[0].endZoc = true; }, input => { input.edges[1].id = 'road'; },
    input => { input.elapsedU = -1; }, input => { input.speedDenominator = 0; },
    input => { input.state.remainder = 3; }, input => { input.state.worldTimeU = Number.MAX_SAFE_INTEGER; },
  ]) {
    const input = sample(); mutate(input); const before = structuredClone(input);
    assert.throws(() => advanceMotion(input)); assert.deepEqual(input, before);
  }
});
