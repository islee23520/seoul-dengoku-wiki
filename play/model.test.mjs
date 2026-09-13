import test from 'node:test';
import assert from 'node:assert/strict';
import * as model from './model.mjs';

const {
  CARDS, TICKS_PER_SECOND, createGame, selectDestination, departureCost,
  beginPlanning, depart, negotiate, bypass, prepareBattle, setFormation,
  startBattle, stepGame, togglePause, playCard, retreat, settle, returnHome,
  rest, negotiationChance,
} = model;

function region(state, risk = 1) {
  return { id: 'test-region', name: '문래동', district: '영등포구',
    centroid: [state.home.centroid[0] + 2000, state.home.centroid[1]],
    risk, theme: '공방과 보급' };
}
function encounter(seed = 1, risk = 1, initial = createGame(seed)) {
  return depart(selectDestination(beginPlanning(initial), region(initial, risk)));
}
function battle(seed = 1, risk = 1, initial = createGame(seed)) {
  return startBattle(prepareBattle(encounter(seed, risk, initial)));
}
function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function rejectsUnchanged(state, action) {
  const before = JSON.stringify(state);
  assert.throws(() => action(freeze(state)), error =>
    error instanceof Error && /[가-힣]/u.test(error.message));
  assert.equal(JSON.stringify(state), before);
}
function fight(initial, useCards = true) {
  let state = initial;
  let cardsPlayed = 0;
  while (state.phase === 'battle' && state.battle.tick < 900) {
    if (useCards) {
      for (const card of CARDS) {
        if (state.phase !== 'battle') break;
        const owner = state.battle.allies.find(unit => unit.id === card.ownerId);
        if (owner.hp > 0 && state.battle.energy >= card.cost &&
            state.battle.tick >= state.battle.cooldowns[card.id] &&
            !state.battle.events.some(event => event.kind === 'move' &&
              event.tick === state.battle.tick && event.unitId === owner.id)) {
          state = playCard(state, card.id);
          cardsPlayed += 1;
        }
      }
    }
    if (state.phase === 'battle') state = stepGame(state);
  }
  assert.equal(state.phase, 'result');
  return { state, cardsPlayed };
}

// The first RED run uses a loadable API scaffold, so failure is a behavioral
// resource assertion rather than a missing import, export, or syntax error.
test('new campaign has the contracted resources and exact API', () => {
  const state = createGame();
  assert.equal(state.supplies, 40);
  assert.equal(state.phase, 'home');
  assert.equal(state.reputation, 0);
  assert.equal(state.expeditions, 0);
  assert.equal(state.day, 1);
  assert.equal(state.seed, 24601);
  assert.deepEqual(state.home.centroid, [947796.9408499994, 1947315.2481500213]);
  assert.equal(TICKS_PER_SECOND, 30);
  assert.deepEqual(Object.keys(model).sort(), [
    'CARDS', 'TICKS_PER_SECOND', 'beginPlanning', 'bypass', 'createGame',
    'depart', 'departureCost', 'negotiate', 'negotiationChance', 'playCard',
    'prepareBattle', 'rest', 'retreat', 'returnHome', 'selectDestination',
    'setFormation', 'settle', 'startBattle', 'stepGame', 'togglePause',
  ].sort());
  assert.deepEqual(Object.keys(state).sort(), [
    'seed', 'rng', 'phase', 'supplies', 'reputation', 'expeditions', 'day',
    'home', 'destination', 'squad', 'battle', 'result', 'log', 'lastDelta',
    'completedResults',
  ].sort());
  assert.deepEqual(state.squad.map(unit => unit.id), ['guard', 'assault', 'ranger']);
  assert.equal(state.squad.length, 3);
  assert.equal(state.battle, null);
  assert.equal(state.result, null);
  assert.equal(state.destination, null);
  assert.equal(state.lastDelta, null);
  assert.deepEqual(state.completedResults, []);
  assert.equal(CARDS.length, 3);
  for (const card of CARDS) {
    assert.deepEqual(Object.keys(card).sort(),
      ['id', 'ownerId', 'title', 'description', 'cost', 'cooldownTicks', 'kind'].sort());
    assert.ok(state.squad.some(unit => unit.id === card.ownerId));
    assert.ok(card.cost > 0 && Number.isInteger(card.cooldownTicks));
  }
});

test('two persistent complete loops: negotiation then actual battle with cards', () => {
  const initial = freeze(createGame(1));
  const planned = selectDestination(beginPlanning(initial), region(initial));
  const travelCost = departureCost(planned);
  const arrived = depart(freeze(planned));
  assert.equal(arrived.supplies, 40 - travelCost);
  assert.equal(arrived.expeditions, 1);
  const resolved = negotiate(freeze(arrived));
  assert.equal(resolved.phase, 'result');
  assert.equal(resolved.result.kind, 'negotiated');
  assert.equal(resolved.result.applied, false);
  assert.equal(resolved.supplies, arrived.supplies);
  assert.equal(resolved.reputation, arrived.reputation);
  assert.deepEqual(resolved.squad, initial.squad);
  const settled = settle(freeze(resolved));
  assert.equal(settled.phase, 'settled');
  assert.equal(settled.supplies, arrived.supplies + resolved.result.suppliesDelta);
  assert.equal(settled.reputation, resolved.result.reputationDelta);
  assert.equal(settled.result.applied, true);
  assert.deepEqual(settled.lastDelta, {
    supplies: resolved.result.suppliesDelta, reputation: resolved.result.reputationDelta,
  });
  const home = returnHome(freeze(settled));
  assert.equal(home.phase, 'home');
  assert.equal(home.supplies, settled.supplies);
  assert.equal(home.reputation, settled.reputation);
  assert.equal(home.destination, null);
  const deployed = prepareBattle(encounter(1, 1, home));
  const swapped = setFormation(freeze(deployed), 'guard', deployed.squad[1].slot);
  assert.equal(swapped.squad[1].slot, deployed.squad[0].slot);
  const started = startBattle(freeze(swapped));
  assert.equal(started.battle.tick, 0);
  assert.equal(started.phase, 'battle');
  assert.equal(started.battle.allies.length, 3);
  assert.equal(started.battle.enemies.length, 3);
  const { state: won, cardsPlayed } = fight(started);
  assert.equal(won.result.kind, 'victory');
  assert.ok(cardsPlayed >= 3);
  assert.ok(won.battle.tick >= 300 && won.battle.tick <= 900);
  assert.ok(won.battle.events.some(event => event.kind === 'attack'));
  assert.equal(won.supplies, started.supplies);
  assert.equal(won.reputation, started.reputation);
  for (const unit of won.squad) {
    assert.equal(unit.hp, won.battle.allies.find(ally => ally.id === unit.id).hp);
  }
  const homeAgain = returnHome(settle(won));
  assert.equal(homeAgain.phase, 'home');
  assert.equal(homeAgain.expeditions, 2);
  assert.equal(homeAgain.completedResults.length, 2);
  assert.notEqual(homeAgain.completedResults[0], homeAgain.completedResults[1]);
  assert.deepEqual(homeAgain.squad, won.squad);
  const nextBattle = battle(1, 1, homeAgain);
  assert.deepEqual(nextBattle.battle.allies.map(unit => unit.hp), won.squad.map(unit => unit.hp));
});

test('risk and reputation affect chance; failure commits to deployment without rerolls', () => {
  const low = encounter(1, 1);
  const high = encounter(1, 3);
  assert.ok(negotiationChance(low) > negotiationChance(high));
  assert.ok(negotiationChance({ ...high, reputation: 8 }) > negotiationChance(high));
  assert.ok(negotiationChance({ ...high, reputation: -1000 }) >= 0.15);
  assert.ok(negotiationChance({ ...low, reputation: 1000 }) <= 0.9);
  const fail = negotiate(encounter(1500, 3));
  assert.equal(fail.phase, 'deployment');
  assert.equal(fail.result, null);
  assert.notEqual(fail.rng, encounter(1500, 3).rng);
  rejectsUnchanged(fail, negotiate);
  assert.equal(startBattle(fail).phase, 'battle');
  const lowBattle = battle(1, 1);
  const highBattle = battle(1, 3);
  assert.equal(highBattle.battle.enemies.length, 5);
  assert.ok(highBattle.battle.enemies[0].hp > lowBattle.battle.enemies[0].hp);
  assert.ok(highBattle.battle.enemies[0].power > lowBattle.battle.enemies[0].power);
});

test('cost uses state home centroid; selection owns a lightweight copy', () => {
  const home = createGame();
  const near = region(home);
  const far = { ...near, centroid: [near.centroid[0] + 20000, near.centroid[1]] };
  assert.ok(departureCost(home, far) > departureCost(home, near));
  assert.ok(departureCost(home, { ...near, risk: 3 }) > departureCost(home, near));
  const movedHome = { ...home, home: { ...home.home, centroid: far.centroid } };
  assert.ok(departureCost(movedHome, far) < departureCost(home, far));
  const selected = selectDestination(home, near);
  near.centroid[0] += 1000;
  assert.notEqual(selected.destination.centroid[0], near.centroid[0]);
  assert.equal(beginPlanning(selected).destination.id, near.id);
});

test('illegal stages, malformed regions, insufficient supplies and exhausted squad reject immutably', () => {
  const home = createGame();
  for (const action of [depart, negotiate, bypass, prepareBattle, startBattle,
    stepGame, togglePause, retreat, settle, returnHome]) rejectsUnchanged(home, action);
  rejectsUnchanged(beginPlanning(home), depart);
  rejectsUnchanged(beginPlanning(home), beginPlanning);
  for (const invalid of [null, {}, { ...region(home), id: '' },
    { ...region(home), name: null }, { ...region(home), district: '' },
    { ...region(home), theme: null }, { ...region(home), risk: 0 },
    { ...region(home), risk: 1.5 }, { ...region(home), risk: 4 },
    { ...region(home), centroid: [NaN, 0] },
    { ...region(home), centroid: [0, Infinity] },
    { ...region(home), centroid: [1] }, { ...region(home), centroid: ['1', 2] }]) {
    rejectsUnchanged(home, state => selectDestination(state, invalid));
    rejectsUnchanged(home, state => departureCost(state, invalid));
  }
  const planned = selectDestination(beginPlanning(home), region(home));
  rejectsUnchanged({ ...planned, supplies: departureCost(planned) - 1 }, depart);
  const stranded = { ...planned, supplies: 0 };
  const cancelled = returnHome(freeze(stranded));
  assert.equal(cancelled.phase, 'home');
  assert.equal(cancelled.supplies, 0);
  assert.equal(cancelled.expeditions, stranded.expeditions);
  assert.equal(encounter(1, 1, rest(cancelled)).phase, 'encounter');
  rejectsUnchanged({ ...planned, squad: planned.squad.map(unit => ({ ...unit, hp: 0 })) }, depart);
  assert.equal(depart({ ...planned, supplies: departureCost(planned) }).supplies, 0);
  rejectsUnchanged(encounter(), state => selectDestination(state, region(home)));
  rejectsUnchanged(encounter(), rest);
  assert.throws(() => createGame(NaN), Error);
  assert.throws(() => createGame(1.5), Error);
});

test('formation validates slots, identities and duplicate placements before battle', () => {
  const deployed = prepareBattle(encounter());
  for (const slot of [-1, 9, 1.5, NaN, '2', null]) {
    rejectsUnchanged(deployed, state => setFormation(state, 'guard', slot));
  }
  rejectsUnchanged(deployed, state => setFormation(state, 'missing', 0));
  rejectsUnchanged(createGame(), state => setFormation(state, 'guard', 0));
  const duplicate = { ...deployed, squad: deployed.squad.map(unit => ({ ...unit, slot: 0 })) };
  rejectsUnchanged(duplicate, startBattle);
  const missing = { ...deployed, squad: deployed.squad.slice(1) };
  rejectsUnchanged(missing, startBattle);
  const unknown = { ...deployed, squad: deployed.squad.map((unit, i) =>
    i === 0 ? { ...unit, id: 'missing' } : unit) };
  rejectsUnchanged(unknown, startBattle);
  const emptySlot = [...Array(9).keys()].find(slot => !deployed.squad.some(unit => unit.slot === slot));
  const moved = setFormation(deployed, 'ranger', emptySlot);
  assert.equal(moved.squad.find(unit => unit.id === 'ranger').slot, emptySlot);
  assert.equal(new Set(moved.squad.map(unit => unit.slot)).size, 3);
});

test('30Hz cardinal ticks stay in bounds without stacking and paused state freezes completely', () => {
  let state = battle();
  for (let tick = 0; tick < 150; tick += 1) {
    const before = state;
    state = stepGame(freeze(before));
    assert.equal(state.battle.tick, before.battle.tick + 1);
    const units = [...state.battle.allies, ...state.battle.enemies];
    const oldUnits = [...before.battle.allies, ...before.battle.enemies];
    const occupied = new Set();
    for (const unit of units) {
      assert.ok(Number.isInteger(unit.x) && unit.x >= 0 && unit.x < 12);
      assert.ok(Number.isInteger(unit.y) && unit.y >= 0 && unit.y < 8);
      const old = oldUnits.find(previous => previous.id === unit.id);
      assert.ok(Math.abs(unit.x - old.x) + Math.abs(unit.y - old.y) <= 1);
      if (unit.hp > 0) {
        const cell = `${unit.x},${unit.y}`;
        assert.ok(!occupied.has(cell));
        occupied.add(cell);
      }
    }
  }
  const guarded = playCard(state, CARDS.find(card => card.ownerId === 'guard').id);
  const paused = togglePause(guarded);
  assert.equal(paused.battle.paused, true);
  assert.deepEqual(stepGame(freeze(paused), 300), paused);
  rejectsUnchanged(paused, current => playCard(current, CARDS[1].id));
  const resumed = stepGame(togglePause(paused));
  assert.equal(resumed.battle.tick, paused.battle.tick + 1);
  assert.deepEqual(stepGame(resumed, 0), resumed);
  for (const count of [-1, 0.5, NaN, Infinity, '30']) {
    rejectsUnchanged(resumed, current => stepGame(current, count));
  }
});

test('cards have useful effects and reject energy, cooldown, dead owner and unknown IDs', () => {
  const initial = battle();
  const guard = CARDS.find(card => card.ownerId === 'guard');
  const assault = CARDS.find(card => card.ownerId === 'assault');
  const ranger = CARDS.find(card => card.ownerId === 'ranger');
  const shielded = playCard(freeze(initial), guard.id);
  assert.equal(shielded.battle.energy, initial.battle.energy - guard.cost);
  assert.equal(shielded.battle.cooldowns[guard.id], initial.battle.tick + guard.cooldownTicks);
  assert.ok(shielded.battle.allies.every(unit => unit.shield > 0));
  rejectsUnchanged({ ...shielded, battle: { ...shielded.battle, energy: 10 } }, state => playCard(state, guard.id));
  rejectsUnchanged({ ...initial, battle: { ...initial.battle, energy: 0 } }, state => playCard(state, assault.id));
  for (const card of CARDS) {
    const dead = { ...initial, battle: { ...initial.battle,
      allies: initial.battle.allies.map(unit => unit.id === card.ownerId ? { ...unit, hp: 0 } : unit) } };
    rejectsUnchanged(dead, state => playCard(state, card.id));
  }
  rejectsUnchanged(initial, state => playCard(state, 'not-a-card'));
  const struck = playCard(initial, assault.id);
  assert.ok(struck.battle.enemies.reduce((sum, unit) => sum + unit.hp, 0) <
    initial.battle.enemies.reduce((sum, unit) => sum + unit.hp, 0));
  const wounded = { ...initial, battle: { ...initial.battle,
    allies: initial.battle.allies.map(unit => unit.id === 'guard' ? { ...unit, hp: unit.hp - 40 } : unit) } };
  const healed = playCard(wounded, ranger.id);
  assert.ok(healed.battle.allies[0].hp > wounded.battle.allies[0].hp);
  assert.ok(healed.battle.allies.every(unit => unit.hp <= unit.maxHp));
  const recharged = stepGame(shielded, guard.cooldownTicks);
  assert.equal(recharged.phase, 'battle');
  assert.ok(recharged.battle.energy > shielded.battle.energy);
  assert.doesNotThrow(() => playCard(recharged, guard.id));
  const unshieldedNext = stepGame(initial, 120);
  const shieldedNext = stepGame(shielded, 120);
  assert.ok(shieldedNext.battle.allies.reduce((sum, unit) => sum + unit.hp, 0) >
    unshieldedNext.battle.allies.reduce((sum, unit) => sum + unit.hp, 0));
});

test('same seed and commands replay exactly; batched ticks equal individual ticks', () => {
  function replay() {
    const home = returnHome(settle(negotiate(encounter(1))));
    return returnHome(settle(fight(battle(1, 2, home)).state));
  }
  assert.equal(JSON.stringify(replay()), JSON.stringify(replay()));
  const initial = battle(4321, 3);
  let stepped = initial;
  for (let tick = 0; tick < 180; tick += 1) stepped = stepGame(stepped);
  assert.deepEqual(stepGame(initial, 180), stepped);
  assert.equal(JSON.stringify(createGame(0)), JSON.stringify(createGame(0)));
  const frozen = freeze(createGame(7));
  const before = JSON.stringify(frozen);
  const planned = beginPlanning(frozen);
  assert.notEqual(planned, frozen);
  assert.equal(JSON.stringify(frozen), before);
});

test('settlement is exactly once, including stale result IDs, and bypass is affordable', () => {
  const arrived = encounter();
  const result = bypass(arrived);
  assert.equal(result.result.kind, 'bypass');
  assert.equal(result.supplies, arrived.supplies);
  const settled = settle(result);
  rejectsUnchanged(settled, settle);
  rejectsUnchanged({ ...settled, phase: 'result', result: { ...result.result, applied: false } }, settle);
  rejectsUnchanged(result, returnHome);
  rejectsUnchanged(returnHome(settled), returnHome);
  const empty = { ...arrived, supplies: 0 };
  const emptySettled = settle(bypass(empty));
  assert.equal(emptySettled.supplies, 0);
  assert.equal(emptySettled.lastDelta.supplies, 0);
  assert.equal(returnHome(emptySettled).phase, 'home');
});

test('retreat, genuine defeat and empty resources recover without resetting campaign', () => {
  const running = stepGame(battle(), 150);
  const retreated = retreat(togglePause(running));
  assert.equal(retreated.result.kind, 'retreat');
  assert.equal(retreated.supplies, running.supplies);
  assert.deepEqual(retreated.squad.map(unit => unit.hp), running.battle.allies.map(unit => unit.hp));
  const retreatHome = returnHome(settle(retreated));
  const exhausted = { ...createGame(99), supplies: 16,
    squad: createGame(99).squad.map(unit => ({ ...unit, hp: 1 })) };
  const doomed = battle(99, 3, exhausted);
  const lost = stepGame(doomed, 900);
  assert.equal(lost.result.kind, 'defeat');
  assert.ok(lost.battle.tick > 0 && lost.battle.tick <= 900);
  assert.ok(lost.squad.every(unit => unit.hp === 0));
  assert.equal(lost.supplies, doomed.supplies);
  const defeatedHome = returnHome(settle(lost));
  for (const home of [retreatHome, defeatedHome,
    { ...defeatedHome, supplies: 0 }, { ...defeatedHome, supplies: 19 }]) {
    const recovered = rest(freeze(home));
    assert.equal(recovered.phase, 'home');
    assert.equal(recovered.expeditions, home.expeditions);
    assert.deepEqual(recovered.completedResults, home.completedResults);
    assert.ok(recovered.day > home.day);
    assert.ok(recovered.squad.every(unit => unit.hp === unit.maxHp));
    assert.ok(recovered.supplies >= departureCost(recovered, region(recovered, 3)));
    assert.equal(encounter(99, 3, recovered).phase, 'encounter');
  }
});

test('movement completes before action: no same-tick attack or owner card after a cell move', () => {
  const initial = battle();
  const arranged = { ...initial, battle: { ...initial.battle, tick: 5,
    allies: initial.battle.allies.map(unit => ({ ...unit,
      x: unit.id === 'assault' ? 3 : 0,
      y: unit.id === 'ranger' ? 7 : unit.id === 'guard' ? 0 : 2,
    })),
    enemies: initial.battle.enemies.map((unit, index) => ({ ...unit,
      x: index === 0 ? 5 : 11, y: index === 0 ? 2 : index === 1 ? 0 : 7,
      attackAt: 100,
    })),
  } };
  const moved = stepGame(freeze(arranged));
  const assault = moved.battle.allies.find(unit => unit.id === 'assault');
  assert.deepEqual([assault.x, assault.y], [4, 2]);
  assert.equal(moved.battle.events.filter(event => event.kind === 'attack' &&
    event.tick === 6 && event.attackerId === assault.id).length, 0);
  assert.equal(assault.attackAt, 0);
  const card = CARDS.find(candidate => candidate.ownerId === 'assault');
  rejectsUnchanged(moved, state => playCard(state, card.id));
  const acted = stepGame(moved);
  assert.ok(acted.battle.events.some(event => event.kind === 'attack' &&
    event.tick === 7 && event.attackerId === assault.id));
  assert.doesNotThrow(() => playCard(acted, card.id));
});

test('battle hard cap produces a defeat rather than an instant or fabricated victory', () => {
  const running = battle(1, 3);
  const stalemate = { ...running, battle: { ...running.battle,
    allies: running.battle.allies.map(unit => ({ ...unit, power: 0 })),
    enemies: running.battle.enemies.map(unit => ({ ...unit, power: 0 })),
  } };
  const ended = stepGame(stalemate, 100000);
  assert.equal(ended.battle.tick, 900);
  assert.equal(ended.phase, 'result');
  assert.equal(ended.result.kind, 'defeat');
  assert.ok(ended.battle.enemies.some(unit => unit.hp > 0));
  rejectsUnchanged(ended, stepGame);
  rejectsUnchanged(ended, retreat);
});
