import assert from 'node:assert/strict';
import { test } from 'node:test';
import { baseAttributes, personalMove, squadMove, campaignRates } from './source-calculation.mjs';
import { advanceOrder, costedPath, reachableOnPath, replaceOrder, replayOrders } from '../campaign-movement-20260928/time-orders.mjs';

const walker = (patch = {}) => ({ basicMove: 5, liftFifthLb: 100, loadFifthLb: 150,
  hp: 12, maxHp: 12, fp: 12, maxFp: 12, canWalk: true, ...patch });
const members = name => [walker({ basicMove: 6, liftFifthLb: name === 'A' ? 100 : 225,
  loadFifthLb: name === 'A' ? 75 : 200 }),
  ...Array.from({ length: name === 'A' ? 8 : 12 }, () => walker({ loadFifthLb: name === 'A' ? 150 : 250 }))];
const edge = (id, from, to, fromLayer, toLayer, kind, distanceD, workNumerator, workDenominator, entryWorkW = 0) =>
  ({ id, from, to, fromLayer, toLayer, kind, distanceD, workNumerator, workDenominator, entryWorkW,
    transfer: kind === 'transfer', allowed: true, blocked: false, endZoc: false });
const path = () => [
  edge('road', 'S0', 'S1', 'surface', 'surface', 'road', 1000, 800, 1),
  edge('entry', 'S1', 'U0', 'surface', 'subway', 'transfer', 50, 1000, 1, 100000),
  edge('tunnel', 'U0', 'U1', 'subway', 'subway', 'underground', 1000, 2000, 1),
];
const fixture = name => ({ id: name, controllerId: 'controller', revision: 0, orderId: 'initial',
  stance: 'normal', battleLocked: false, ...campaignRates(squadMove(members(name)), 8),
  motion: { worldTimeU: 0, distanceU: 0, remainder: 0 }, path: path() });

test('source BL rounding and fractional Basic Speed are not a campaign rate', () => {
  assert.deepEqual(baseAttributes({ st: 11, dx: 13, ht: 12 }),
    { liftFifthLb: 120, speedNumerator: 25, speedDenominator: 4, initialBasicMove: 6 });
  assert.equal(baseAttributes({ st: 7, dx: 10, ht: 10 }).liftFifthLb, 49);
  assert.equal(baseAttributes({ st: 8, dx: 10, ht: 10 }).liftFifthLb, 65);
  assert.equal(baseAttributes({ st: 15, dx: 12, ht: 12 }).liftFifthLb, 225);
  assert.throws(() => baseAttributes({ st: Number.MAX_SAFE_INTEGER, dx: 10, ht: 10 }), /OVERFLOW/);
});

test('each inclusive load threshold, next unit and source minimum', () => {
  const limits = [100, 200, 300, 600, 1000];
  limits.forEach((load, level) => {
    assert.deepEqual(personalMove(walker({ loadFifthLb: load })), { encumbrance: level, move: 5 - level });
    if (level < 4) assert.equal(personalMove(walker({ loadFifthLb: load + 1 })).encumbrance, level + 1);
  });
  assert.equal(personalMove(walker({ basicMove: 1, loadFifthLb: 1000 })).move, 1);
  assert.throws(() => personalMove(walker({ loadFifthLb: 1001 })), /OVER_CAPACITY/);
});

test('strict one-third boundary, source ceil and explicitly proposed operation order', () => {
  const b = walker({ loadFifthLb: 250, hp: 4, fp: 4 });
  assert.equal(personalMove(b).move, 3);
  assert.equal(personalMove({ ...b, hp: 3 }).move, 2);
  assert.equal(personalMove({ ...b, fp: 3 }).move, 2);
  assert.equal(personalMove({ ...b, hp: 3, fp: 3 }).move, 1);
  assert.equal(personalMove(walker({ loadFifthLb: 0, hp: 3, fp: 3 })).move, 2);
});

test('unsupported or incomplete states fail without dropping a squad member', () => {
  for (const patch of [{ hp: 0 }, { fp: 0 }, { hp: -1 }, { hp: 13 }, { maxFp: 0 },
    { canWalk: false }, { basicMove: undefined }, { liftFifthLb: 0 }, { loadFifthLb: 0.5 }]) {
    const squad = [walker(), walker(patch)], before = structuredClone(squad);
    assert.throws(() => squadMove(squad));
    assert.deepEqual(squad, before);
  }
  assert.throws(() => squadMove([]), /EMPTY_SQUAD/);
});

test('all participants constrain speed, all five stances have explicit rates', () => {
  assert.equal(squadMove(members('A')), 4);
  assert.equal(squadMove(members('B')), 3);
  assert.equal(squadMove([walker({ basicMove: 1 }), ...members('A')]), 1);
  assert.deepEqual(campaignRates(4, 8), { denominator: 5,
    rates: { normal: 11176, forced: 16764, ambush: 5588, garrison: 0, camp: 0 } });
  assert.deepEqual(campaignRates(3, 8).rates,
    { normal: 8382, forced: 12573, ambush: 4191, garrison: 0, camp: 0 });
  const slower = campaignRates(4, 12);
  assert.equal(slower.rates.normal * 10 * 3, 22352 * slower.denominator * 2);
  assert.throws(() => campaignRates(4, 0), /INTEGER_RANGE/);
  assert.throws(() => campaignRates(4, 25), /HOURS_RANGE/);
  assert.throws(() => campaignRates(Number.MAX_SAFE_INTEGER, 8), /OVERFLOW/);
});

test('metres to equivalent millimetres and two independently hand-calculated squads', () => {
  assert.deepEqual(costedPath(path()).map(e => e.distanceU), [800000, 150000, 2000000]);
  for (const [name, at300, at600, forced300, arrival] of
    [['A', 670560, 1341120, 1005840, 1320], ['B', 502920, 1005840, 754380, 1760]]) {
    const squad = fixture(name);
    assert.equal(advanceOrder(squad, 300).motion.distanceU, at300);
    assert.equal(advanceOrder(squad, 600).motion.distanceU, at600);
    assert.equal(advanceOrder({ ...squad, stance: 'forced' }, 300).motion.distanceU, forced300);
    assert.deepEqual(reachableOnPath(squad, 600), ['S1', 'U0']);
    assert.ok(advanceOrder(squad, arrival - 1).motion.distanceU < 2950000);
    assert.equal(advanceOrder(squad, arrival).motion.distanceU, 2950000);
    assert.deepEqual(advanceOrder(advanceOrder(squad, 37), 563).motion, advanceOrder(squad, 600).motion);
  }
});

test('source-derived progress retains fractional work at replacement; replay is stable', () => {
  const original = fixture('B');
  const progressed = advanceOrder(original, 1);
  const command = { id: 'replace', actorId: 'controller', atU: 1, expectedRevision: 0,
    path: [...original.path.slice(0, 1), edge('detour', 'S1', 'S2', 'surface', 'surface', 'road', 100, 1000, 1)] };
  const replaced = replaceOrder(progressed, command);
  assert.deepEqual(replaced.motion, { worldTimeU: 1, distanceU: 1676, remainder: 2 });
  assert.deepEqual(advanceOrder(replaced, 2).motion, { worldTimeU: 3, distanceU: 5029, remainder: 1 });
  assert.equal(replaced.path.at(-1).to, 'S2');
  assert.deepEqual(original, fixture('B'));
  // The source-derived fixture is accepted by the existing canonical event replay.
  const events = [{ kind: 'advance', elapsedU: 1, worldActive: true }, { kind: 'replace', command }];
  const replay = replayOrders(original, events);
  assert.deepEqual(replay.squad, replaced);
  assert.deepEqual(replay, replayOrders(structuredClone(original), structuredClone(events)));
  const changed = structuredClone(events);
  changed[1].command.path[1].distanceD += 1;
  assert.notEqual(replay.hash, replayOrders(original, changed).hash);
});

test('source-derived rates still obey whole-path refusal and ZOC stop', () => {
  const squad = fixture('A'), before = structuredClone(squad);
  for (const patch of [{ blocked: true }, { allowed: false }, { workDenominator: 0 }]) {
    const bad = structuredClone(squad);
    Object.assign(bad.path[2], patch);
    assert.throws(() => advanceOrder(bad, 300));
  }
  assert.deepEqual(squad, before);
  const stop = { ...squad, path: squad.path.slice(0, 2) };
  stop.path[1] = { ...stop.path[1], endZoc: true };
  assert.equal(advanceOrder(stop, 600).motion.distanceU, 950000);
});
