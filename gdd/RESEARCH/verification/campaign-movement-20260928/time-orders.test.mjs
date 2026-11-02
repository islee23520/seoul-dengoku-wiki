import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advanceOrder, replaceOrder, reachableOnPath, costedPath, canInitiate, replayOrders } from './time-orders.mjs';

function edge(id, from, to, fromLayer, toLayer, kind, distanceD, workNumerator, workDenominator, entryWorkW) {
  return { id, from, to, fromLayer, toLayer, kind, distanceD, workNumerator, workDenominator, entryWorkW, transfer: kind === 'transfer', allowed: true, blocked: false, endZoc: false };
}
export function fixture(name = 'A') {
  return { id: name, controllerId: 'controller', revision: 0, orderId: 'initial', stance: 'normal', battleLocked: false,
    // Externally supplied synthetic squad rates, not derived character stats.
    denominator: 2, rates: name === 'A' ? { normal: 4, forced: 6, ambush: 2, garrison: 0, camp: 0 } : { normal: 3, forced: 5, ambush: 1, garrison: 0, camp: 0 },
    motion: { worldTimeU: 0, distanceU: 0, remainder: 0 },
    path: [edge('road', 'S0', 'S1', 'surface', 'surface', 'road', 8, 1, 2, 0),
      edge('entry', 'S1', 'U0', 'surface', 'subway', 'transfer', 2, 1, 1, 2),
      edge('tunnel', 'U0', 'U1', 'subway', 'subway', 'underground', 6, 2, 1, 0)] };
}
const replacement = squad => ({ id: 'replacement', actorId: squad.controllerId, atU: squad.motion.worldTimeU, expectedRevision: squad.revision,
  path: [...structuredClone(squad.path.slice(0, 2)), edge('branch', 'U0', 'U2', 'subway', 'subway', 'underground', 2, 2, 1, 0)] });

test('time/work dimensions: two hand examples, forced march and horizon nodes', () => {
  assert.deepEqual(costedPath(fixture().path).map(e => e.distanceU), [4, 4, 12]);
  for (const [name, stance, expected] of [['A', 'normal', 10], ['B', 'normal', 7], ['A', 'forced', 15], ['B', 'forced', 12]]) {
    const squad = { ...fixture(name), stance };
    assert.deepEqual(advanceOrder(squad, 5).motion, { worldTimeU: 5, distanceU: expected, remainder: name === 'B' ? 1 : 0 });
  }
  assert.deepEqual(reachableOnPath(fixture('A'), 5), ['S1', 'U0']);
  assert.deepEqual(reachableOnPath(fixture('B'), 5), ['S1']);
  assert.equal(advanceOrder(fixture('A'), 10).motion.distanceU, 20);
  assert.equal(advanceOrder(fixture('B'), 13).motion.distanceU, 19);
  assert.equal(advanceOrder(fixture('B'), 14).motion.distanceU, 20);
});

test('all five stances use explicit rates; action restrictions are separate', () => {
  for (const [stance, distance] of [['normal', 10], ['forced', 15], ['ambush', 5], ['garrison', 0], ['camp', 0]]) {
    assert.equal(advanceOrder({ ...fixture(), stance }, 5).motion.distanceU, distance);
  }
  assert.equal(canInitiate('forced', 'ATTACK'), false);
  assert.equal(canInitiate('forced', 'INTERCEPT'), false);
  assert.equal(canInitiate('forced', 'DEFEND'), true);
  assert.equal(canInitiate('camp', 'ATTACK'), false);
});

test('mid-edge replacement preserves exact fractional position and accepted revision', () => {
  const squad = advanceOrder(fixture('B'), 5), before = structuredClone(squad);
  const next = replaceOrder(squad, replacement(squad));
  assert.deepEqual(next.motion, { worldTimeU: 5, distanceU: 7, remainder: 1 });
  assert.equal(next.revision, 1);
  assert.deepEqual(advanceOrder(next, 3).motion, { worldTimeU: 8, distanceU: 12, remainder: 0 });
  assert.equal(advanceOrder(squad, 3).motion.distanceU, 12);
  assert.notEqual(next.path.at(-1).to, squad.path.at(-1).to);
  assert.deepEqual(squad, before);
});

test('blocked, unauthorized, invalid cost and revision failures never change state or old order', () => {
  const mutations = [
    [(_, c) => { c.path[2].blocked = true; }, /ACCESS_DENIED/],
    [(_, c) => { c.path[2].allowed = false; }, /ACCESS_DENIED/],
    [(_, c) => { c.actorId = 'other'; }, /UNAUTHORIZED/],
    [(_, c) => { c.path[2].workDenominator = 0; }, /INTEGER_RANGE/],
    [(_, c) => { c.path[2].entryWorkW = -1; }, /INTEGER_RANGE/],
    [(_, c) => { c.path[2].distanceD = Number.MAX_SAFE_INTEGER; }, /OVERFLOW/],
    [(_, c) => { c.path[1].distanceD = 3; }, /PROGRESS_REWRITE/],
    [(_, c) => { c.expectedRevision = 1; }, /STALE_ORDER/],
    [(_, c) => { c.atU = 4; }, /EVENT_TIME/],
    [(s) => { s.battleLocked = true; }, /BATTLE_LOCK/],
    [(s) => { s.stance = 'camp'; }, /STANCE_STOP/],
    [(s, c) => { s.controllerId = undefined; c.actorId = undefined; }, /UNAUTHORIZED/],
    [(s) => { s.rates.ambush = undefined; }, /INTEGER_RANGE/],
  ];
  for (const [mutate, error] of mutations) {
    const squad = advanceOrder(fixture('B'), 5), command = replacement(squad);
    mutate(squad, command); const before = structuredClone({ squad, command });
    assert.throws(() => replaceOrder(squad, command), error);
    assert.deepEqual({ squad, command }, before);
  }
});

test('ZOC endpoint stops, transit and new ordinary orders from ZOC reject', () => {
  const squad = fixture(); squad.path = squad.path.slice(0, 2); squad.path[1].endZoc = true;
  const arrived = advanceOrder(squad, 20);
  assert.deepEqual(arrived.motion, { worldTimeU: 20, distanceU: 8, remainder: 0 });
  assert.throws(() => replaceOrder(arrived, replacement(arrived)), /START_ZOC/);
  squad.path.push(fixture().path[2]);
  assert.throws(() => advanceOrder(squad, 1), /ZOC_TRANSIT/);
});

test('AI and player use the identical command path; replay is stable and cost-sensitive', () => {
  const initial = fixture('B');
  const atFive = advanceOrder(initial, 5);
  const events = [{ kind: 'advance', elapsedU: 5, worldActive: true }, { kind: 'replace', command: replacement(atFive) }, { kind: 'advance', elapsedU: 3, worldActive: true }];
  const a = replayOrders({ ...initial, controllerKind: 'human' }, events);
  const b = replayOrders({ ...initial, controllerKind: 'AI', hostOrder: 99 }, structuredClone(events));
  assert.equal(a.hash, b.hash); assert.deepEqual(a.squad.motion, b.squad.motion);
  assert.deepEqual(replayOrders(initial, events).receipts, a.receipts);
  const changed = structuredClone(events); changed[1].command.path[2].entryWorkW++;
  assert.notEqual(replayOrders(initial, changed).hash, a.hash);
  assert.equal(a.hash.length, 64);
});

test('cost ceil, event partition and pause/battle locking preserve exact state', () => {
  const squad = fixture('B'); squad.path[0].workDenominator = 3;
  assert.equal(costedPath(squad.path)[0].distanceU, 3);
  const whole = advanceOrder(squad, 7);
  assert.deepEqual(advanceOrder(advanceOrder(squad, 2), 5), whole);
  assert.deepEqual(advanceOrder(squad, 20, false).motion, squad.motion);
  assert.deepEqual(advanceOrder({ ...squad, battleLocked: true }, 20).motion, { ...squad.motion, worldTimeU: 20 });
});

test('nested display metadata cannot change paused replay or retained-prefix acceptance', () => {
  const initial = advanceOrder(fixture('B'), 5);
  const events = [{ kind: 'advance', elapsedU: 2, worldActive: false }, { kind: 'replace', command: replacement(initial) }];
  const baseline = replayOrders(initial, events);
  const decorated = structuredClone(initial), decoratedEvents = structuredClone(events);
  decorated.rates.label = 'translated';
  decorated.motion.hostOrder = 9;
  decorated.path.forEach(edge => { edge.translations = { ko: '도로' }; });
  decoratedEvents[1].command.path.forEach(edge => { edge.label = 'different display'; });
  const paused = replayOrders(decorated, decoratedEvents.slice(0, 1));
  assert.equal(paused.hash, replayOrders(initial, events.slice(0, 1)).hash);
  const replay = replayOrders(decorated, decoratedEvents);
  assert.equal(replay.hash, baseline.hash);
  assert.deepEqual(replay.receipts, baseline.receipts);
  for (const key of ['worldTimeU', 'distanceU', 'remainder']) assert.equal(replay.squad.motion[key], baseline.squad.motion[key]);
  assert.equal(replay.squad.revision, baseline.squad.revision);
  const costChange = structuredClone(decoratedEvents);
  costChange[1].command.path[2].entryWorkW++;
  assert.notEqual(replayOrders(decorated, costChange).hash, baseline.hash);
  const prefixChange = structuredClone(decoratedEvents);
  prefixChange[1].command.path[1].entryWorkW++;
  assert.throws(() => replayOrders(decorated, prefixChange), /PROGRESS_REWRITE/);
});
