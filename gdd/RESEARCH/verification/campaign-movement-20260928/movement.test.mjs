import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateMove, squadBudget, personalBudget, edgeCost, canInitiate, packetHash } from './movement.mjs';

const member = (id, role, basicMove, basicLift, load) => ({ id, role, basicMove, basicLift, load, health: 1000, fatigue: 1000 });
export function fixture(which = 'A', stance = 'normal', length = 4) {
  const squad = { id: which, node: 'S0', stance, spentU: 0, stopped: false, usedForcedMarchThisTurn: false,
    members: [member(`${which}_c`, 'commander', 6, which === 'A' ? 20 : 45, which === 'A' ? 15 : 40),
      ...Array.from({ length: which === 'A' ? 8 : 12 }, (_, i) => member(`${which}_${i}`, 'soldier', 5, 20, which === 'A' ? 30 : 50))] };
  const nodes = ['S0', 'S1', 'S2', 'U0', 'U1', 'U2'].map(id => ({ id, layer: id.startsWith('S') ? 'ground' : 'subway', domain: id.startsWith('S') ? 'surface' : 'underground', zoc: false }));
  const edges = ['road', 'road', 'transfer', 'underground', 'underground'].map((kind, i) => ({ id: `e${i}`, from: nodes[i].id, to: nodes[i + 1].id, kind, terrainPermille: 1000, surchargeU: 0, allowed: true, blocked: false }));
  return { squad, map: { version: 'fixture-v1', nodes, edges }, command: { id: `move_${which}`, squadId: which, kind: 'MOVE', path: edges.slice(0, length).map(edge => edge.id) } };
}
function unchanged(input, code) {
  const snapshot = structuredClone(input);
  assert.deepEqual(evaluateMove(input), { ok: false, code });
  assert.deepEqual(input, snapshot, 'rejection mutated input');
}

test('two squads: every walking member limits budget, including attached hero', () => {
  for (const [squad, expected] of [['A', [4000, 6000, 2000]], ['B', [3000, 4500, 1500]]]) {
    ['normal', 'forced', 'ambush'].forEach((stance, i) => assert.equal(squadBudget(fixture(squad, stance).squad), expected[i]));
  }
  const input = fixture('B');
  input.squad.members[1].health = 750;
  assert.equal(squadBudget(input.squad), 2250);
  input.squad.members[1].fatigue = 750;
  assert.equal(squadBudget(input.squad), 1687);
  input.squad.members.push(member('hero', 'hero', 1, 20, 0));
  assert.equal(squadBudget(input.squad), 1000);
});

test('roads, explicit transfer and underground have hand-calculated costs', () => {
  for (const [name, stance, length, node, cost, remaining] of [
    ['A', 'normal', 4, 'U1', 3750, 250], ['B', 'normal', 3, 'U0', 2750, 250],
    ['A', 'forced', 5, 'U2', 4750, 1250], ['B', 'forced', 4, 'U1', 3750, 750],
  ]) {
    const input = fixture(name, stance, length), before = structuredClone(input);
    const result = evaluateMove(input);
    assert.equal(result.ok, true); assert.equal(result.node, node); assert.equal(result.costU, cost); assert.equal(result.remainingU, remaining);
    assert.deepEqual(input, before);
  }
  unchanged(fixture('B'), 'INSUFFICIENT_BUDGET');
});

test('exact budget succeeds; one unit short rejects without prefix execution', () => {
  const input = fixture();
  input.map.edges[0].surchargeU = 250;
  assert.equal(evaluateMove(input).remainingU, 0);
  input.squad.spentU = 1;
  unchanged(input, 'INSUFFICIENT_BUDGET');
});

test('ZOC endpoint preserves accounting remainder; transit/start reject', () => {
  const input = fixture(); input.map.nodes[4].zoc = true;
  assert.equal(evaluateMove(input).stop, 'ZOC'); assert.equal(evaluateMove(input).remainingU, 250);
  input.command.path.push('e4'); input.squad.stance = 'forced';
  unchanged(input, 'ZOC_TRANSIT');
  input.map.nodes[0].zoc = true;
  unchanged(input, 'START_ZOC');
});

test('blockade, permission, layer and adjacency are illegal, with global check precedence', () => {
  const input = fixture(); input.map.edges[2].blocked = true;
  unchanged(input, 'BLOCKED');
  input.map.edges[3].allowed = false;
  unchanged(input, 'NO_PERMISSION');
  input.map.edges[2].kind = 'road';
  unchanged(input, 'LAYER_MISMATCH');
  input.command.path = ['e1'];
  unchanged(input, 'NOT_ADJACENT');
});

test('forced march restriction survives a stance change; stopped and camp cannot move', () => {
  const input = fixture('A', 'forced');
  const result = evaluateMove(input);
  const later = { ...input.squad, stance: 'normal', usedForcedMarchThisTurn: result.usedForcedMarchThisTurn };
  assert.equal(canInitiate(later, 'ATTACK'), false); assert.equal(canInitiate(later, 'INTERCEPT'), false);
  input.squad.stance = 'camp'; unchanged(input, 'STANCE_STOP');
  input.squad.stance = 'normal'; input.squad.stopped = true; unchanged(input, 'STANCE_STOP');
});

test('encumbrance exact boundaries, overload and immobile member', () => {
  for (const [load, expected] of [[20, 5000], [21, 4000], [40, 4000], [60, 3000], [120, 2000], [200, 1000]]) {
    assert.equal(personalBudget(member('test', 'soldier', 5, 20, load)), expected);
  }
  const input = fixture(); input.squad.members[1].load = 201; unchanged(input, 'OVER_CAPACITY');
  input.squad.members[1].load = 20; input.squad.members[1].health = 0; unchanged(input, 'INSUFFICIENT_BUDGET');
});

test('missing, negative, fractional, unsafe inputs and duplicate identities reject', () => {
  for (const value of [undefined, -1, 1.1, Number.MAX_SAFE_INTEGER + 1]) {
    const input = fixture(); input.squad.members[1].basicMove = value; unchanged(input, 'INTEGER_RANGE');
  }
  for (const field of ['nodes', 'edges']) {
    const input = fixture(); input.map[field].push(structuredClone(input.map[field][0])); unchanged(input, 'DUPLICATE_ID');
  }
  const input = fixture(); input.squad.members.push(structuredClone(input.squad.members[0])); unchanged(input, 'DUPLICATE_ID');
  assert.deepEqual(evaluateMove(null), { ok: false, code: 'MALFORMED' });
  assert.deepEqual(evaluateMove({}), { ok: false, code: 'MALFORMED' });
});

test('BigInt intermediates do not silently overflow; output overflow rejects', () => {
  // The intermediate product exceeds safe JS Number precision but the result is exact.
  assert.equal(personalBudget(member('large', 'hero', 1000000000, 20, 0)), 1000000000000);
  const input = fixture(); input.squad.members[0].basicMove = Number.MAX_SAFE_INTEGER; unchanged(input, 'OVERFLOW');
  input.squad.members[0].basicMove = 6; input.map.edges[0].surchargeU = Number.MAX_SAFE_INTEGER; unchanged(input, 'OVERFLOW');
  assert.equal(edgeCost({ kind: 'road', terrainPermille: 1001, surchargeU: 0 }), 751);
});

test('soldier cap and empty squads; budget does not hide missing inputs', () => {
  const input = fixture(); input.squad.members = []; unchanged(input, 'EMPTY_SQUAD');
  input.squad.members = Array.from({ length: 21 }, (_, i) => member(`m${i}`, 'soldier', 5, 20, 0)); unchanged(input, 'SOLDIER_LIMIT');
});

test('canonical hash ignores collection order but preserves path/cost meaning', () => {
  const a = fixture(), b = fixture('B', 'normal', 3);
  const packet = { turn: 1, worldTime: 1, previousHash: '0'.repeat(64), map: a.map, squads: [a.squad, b.squad], commands: [a.command, b.command] };
  const hash = packetHash(packet);
  assert.equal(hash.sha256, '7a57b38444e01e95b2f66403404153e10a99ef471e41ecbe59088d621d6327d9');
  const shuffled = structuredClone(packet);
  shuffled.squads.reverse().forEach(squad => squad.members.reverse()); shuffled.commands.reverse(); shuffled.map.nodes.reverse(); shuffled.map.edges.reverse();
  assert.deepEqual(packetHash(shuffled), hash);
  shuffled.map.edges[0].surchargeU = 1;
  assert.notEqual(packetHash(shuffled).sha256, hash.sha256);
  const reversed = structuredClone(packet); reversed.commands[0].path.reverse();
  assert.notEqual(packetHash(reversed).sha256, hash.sha256);
  const duplicate = structuredClone(packet); duplicate.commands.push(duplicate.commands[0]);
  assert.throws(() => packetHash(duplicate), /DUPLICATE_ID/);
  assert.equal(hash.sha256.length, 64);
});

test('replay identity excludes submission, host and translation metadata at every entity level', () => {
  const input = fixture();
  const packet = { turn: 1, worldTime: 1, previousHash: '0'.repeat(64), map: input.map, squads: [input.squad], commands: [input.command] };
  const baseline = packetHash(packet);
  const decorated = structuredClone(packet);
  const metadata = { submittedAt: '2026-09-28T13:00:00Z', hostOrder: 42, hostId: 'host-b', translations: { ko: '표시 이름', en: 'Display name' } };
  for (const entity of [decorated, decorated.map, ...decorated.map.nodes, ...decorated.map.edges,
    ...decorated.squads, ...decorated.squads.flatMap(squad => squad.members), ...decorated.commands]) Object.assign(entity, metadata);
  assert.deepEqual(evaluateMove({ map: decorated.map, squad: decorated.squads[0], command: decorated.commands[0] }), evaluateMove(input));
  assert.deepEqual(packetHash(decorated), baseline);
  assert.equal(packetHash(decorated).bytes.includes('submittedAt'), false);
  assert.equal(packetHash(decorated).bytes.includes('표시 이름'), false);
  decorated.squads[0].stance = 'forced';
  assert.notEqual(packetHash(decorated).sha256, baseline.sha256);
});
