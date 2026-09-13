// Pure web POC rules, not a port of Unity travel or combat simulation.
export const TICKS_PER_SECOND = 30;
const MAX_BATTLE_TICKS = 900;
const ATTACK_INTERVAL = 45;
const MOVE_INTERVAL = 6;
const MAX_ENERGY = 10;
const UNIT_IDS = ['guard', 'assault', 'ranger'];

export const CARDS = Object.freeze([
  Object.freeze({ id: 'guard-cover', ownerId: 'guard', title: '엄호 진형',
    description: '살아 있는 아군 모두에게 보호막 14. 중첩 없이 최대 14, 소모될 때까지 유지. 에너지 3 · 재사용 5초.',
    cost: 3, cooldownTicks: 150, kind: 'shield' }),
  Object.freeze({ id: 'assault-strike', ownerId: 'assault', title: '돌파 사격',
    description: '돌격수에게 가장 가까운 적 하나에 거리 제한 없이 피해 24. 에너지 3 · 재사용 6초.',
    cost: 3, cooldownTicks: 180, kind: 'strike' }),
  Object.freeze({ id: 'ranger-aid', ownerId: 'ranger', title: '응급 처치',
    description: '체력 비율이 가장 낮은 생존 아군 하나를 24 회복. 전투불능 대원은 거점에서 회복. 에너지 2 · 재사용 6초.',
    cost: 2, cooldownTicks: 180, kind: 'heal' }),
]);

function copy(state) {
  return structuredClone(state);
}

function requirePhase(state, ...phases) {
  if (!phases.includes(state.phase)) throw new Error('현재 단계에서는 이 행동을 할 수 없습니다.');
}

function validateRegion(region) {
  if (!region || ['id', 'name', 'district', 'theme'].some(key =>
    typeof region[key] !== 'string' || !region[key].trim()) ||
    !Number.isInteger(region.risk) || region.risk < 1 || region.risk > 3 ||
    !Array.isArray(region.centroid) || region.centroid.length !== 2 ||
    !region.centroid.every(Number.isFinite)) {
    throw new Error('목적지 이름, 구역, 위험도와 좌표를 확인해 주세요.');
  }
}

function validateFormation(squad) {
  if (!Array.isArray(squad) || squad.length !== 3 ||
    UNIT_IDS.some(id => squad.filter(unit => unit.id === id).length !== 1) ||
    squad.some(unit => !Number.isInteger(unit.slot) || unit.slot < 0 || unit.slot > 8) ||
    new Set(squad.map(unit => unit.slot)).size !== 3) {
    throw new Error('분대원 세 명을 서로 다른 0~8번 진형 칸에 배치해 주세요.');
  }
}

function log(state, text, kind = 'info') {
  const id = (state.log.at(-1)?.id ?? 0) + 1;
  state.log.push({ id, text, kind });
  state.log = state.log.slice(-60);
}

function event(battle, kind, text, extra = {}) {
  battle.events.push({ tick: battle.tick, kind, text, ...extra });
  battle.events = battle.events.slice(-80);
}

export function createGame(seed = 24601) {
  if (!Number.isSafeInteger(seed)) throw new Error('시드는 유한한 안전 정수여야 합니다.');
  return {
    seed, rng: seed >>> 0, phase: 'home', supplies: 40, reputation: 0,
    expeditions: 0, day: 1,
    home: { id: 'home', name: '영등포 거점', district: '영등포구',
      centroid: [947796.9408499994, 1947315.2481500213] },
    destination: null,
    squad: [
      { id: 'guard', name: '백온', role: '방패수', hp: 110, maxHp: 110, power: 7, range: 1, slot: 1 },
      { id: 'assault', name: '문가람', role: '돌격수', hp: 85, maxHp: 85, power: 11, range: 1, slot: 2 },
      { id: 'ranger', name: '오해린', role: '정찰·의무병', hp: 75, maxHp: 75, power: 7, range: 3, slot: 7 },
    ],
    battle: null, result: null,
    log: [{ id: 1, text: '영등포 거점에서 원정을 준비합니다.', kind: 'info' }],
    lastDelta: null, completedResults: [],
  };
}

export function selectDestination(state, region) {
  requirePhase(state, 'home', 'planning');
  validateRegion(region);
  const next = copy(state);
  // Do not bring geometry, ledgers or display metadata into the campaign state.
  const { id, name, district, centroid, risk, theme } = region;
  next.destination = { id, name, district, centroid: [...centroid], risk, theme };
  return next;
}

export function departureCost(state, region = state.destination) {
  validateRegion(region);
  const km = Math.hypot(region.centroid[0] - state.home.centroid[0],
    region.centroid[1] - state.home.centroid[1]) / 1000;
  const cost = 2 + Math.ceil(km / 5) + region.risk;
  if (!Number.isSafeInteger(cost)) throw new Error('원정 거리가 계산 가능한 범위를 벗어났습니다.');
  return cost;
}

export function beginPlanning(state) {
  requirePhase(state, 'home');
  const next = copy(state);
  next.phase = 'planning';
  log(next, '목적지와 보급 비용을 확인한 뒤 출발하세요.');
  return next;
}

export function depart(state) {
  requirePhase(state, 'planning');
  const cost = departureCost(state);
  validateFormation(state.squad);
  if (state.supplies < cost) throw new Error(`출발에 보급 ${cost}개가 필요합니다. 거점에서 재정비해 주세요.`);
  if (!state.squad.some(unit => unit.hp > 0)) throw new Error('출전 가능한 대원이 없습니다. 거점에서 회복해 주세요.');
  const next = copy(state);
  next.phase = 'encounter';
  next.supplies -= cost;
  next.expeditions += 1;
  next.day += 1;
  next.battle = null;
  next.result = null;
  next.lastDelta = null;
  log(next, `${next.destination.name} 도착. 출발 보급 ${cost}개를 사용했습니다.`);
  return next;
}

export function negotiationChance(state) {
  validateRegion(state.destination);
  return Math.min(0.9, Math.max(0.15,
    0.8 - state.destination.risk * 0.15 + state.reputation * 0.025));
}

function finish(state, kind) {
  const risk = state.destination.risk;
  const outcomes = {
    negotiated: ['협상 성립', '현지 순찰대와 물자를 교환하고 신뢰를 얻었습니다.', 8 + 2 * risk, 2],
    bypass: ['안전 우회', '추가 보급을 사용해 교전을 피했습니다.', -2, 0],
    victory: ['교전 승리', '보급 거점을 확보했습니다. 대원의 부상은 다음 원정에도 남습니다.', 12 + 4 * risk, 3 * risk],
    defeat: ['분대 구조', '거점 구조대가 대원을 회수했습니다. 복귀 후 재정비할 수 있습니다.', -6, -2],
    retreat: ['작전 중단', '현재 부상을 안고 철수했습니다. 복귀 후 재정비할 수 있습니다.', -4, -1],
  };
  const [title, description, suppliesDelta, reputationDelta] = outcomes[kind];
  state.phase = 'result';
  state.result = { id: `sortie-${state.expeditions}`, kind, title, description,
    suppliesDelta: suppliesDelta < 0 ? 0 - Math.min(state.supplies, -suppliesDelta) : suppliesDelta,
    reputationDelta, applied: false };
  if (state.battle) {
    state.battle.paused = false;
    for (const unit of state.squad) {
      unit.hp = state.battle.allies.find(ally => ally.id === unit.id).hp;
    }
  }
  log(state, title, ['victory', 'negotiated'].includes(kind) ? 'good' : kind === 'bypass' ? 'info' : 'bad');
}

export function negotiate(state) {
  requirePhase(state, 'encounter');
  const chance = negotiationChance(state);
  const next = copy(state);
  next.rng = (Math.imul(next.rng, 1664525) + 1013904223) >>> 0;
  if (next.rng / 4294967296 < chance) {
    finish(next, 'negotiated');
  } else {
    // A failed attempt commits to deployment: there is no repeat-roll button.
    next.phase = 'deployment';
    log(next, '협상이 결렬되었습니다. 진형을 정하고 교전하거나 후퇴하세요.', 'bad');
  }
  return next;
}

export function bypass(state) {
  requirePhase(state, 'encounter');
  const next = copy(state);
  next.day += 1;
  finish(next, 'bypass');
  return next;
}

export function prepareBattle(state) {
  requirePhase(state, 'encounter');
  const next = copy(state);
  next.phase = 'deployment';
  log(next, '진형을 배치하세요. 앞줄은 적과 가깝고 뒷줄은 보호받기 쉽습니다.');
  return next;
}

export function setFormation(state, unitId, slot) {
  requirePhase(state, 'deployment');
  validateFormation(state.squad);
  if (!UNIT_IDS.includes(unitId) || !Number.isInteger(slot) || slot < 0 || slot > 8) {
    throw new Error('대원과 0~8번 진형 칸을 확인해 주세요.');
  }
  const next = copy(state);
  const unit = next.squad.find(member => member.id === unitId);
  const occupant = next.squad.find(member => member.slot === slot);
  if (occupant) occupant.slot = unit.slot;
  unit.slot = slot;
  return next;
}

export function startBattle(state) {
  requirePhase(state, 'deployment');
  validateFormation(state.squad);
  validateRegion(state.destination);
  if (!state.squad.some(unit => unit.hp > 0)) throw new Error('출전 가능한 대원이 없습니다. 후퇴 후 회복해 주세요.');
  const next = copy(state);
  const risk = next.destination.risk;
  next.phase = 'battle';
  next.battle = {
    tick: 0, paused: false, energy: 6,
    allies: next.squad.map(({ slot, ...unit }) => ({ ...unit, side: 'ally',
      x: 3 - Math.floor(slot / 3), y: 2 + slot % 3, attackAt: 0, shield: 0 })),
    enemies: Array.from({ length: risk + 2 }, (_, index) => ({
      id: `enemy-${index + 1}`, name: `순찰대 ${index + 1}`,
      side: 'enemy', role: index === 2 ? '사수' : '경비병',
      hp: 70 + risk * 15, maxHp: 70 + risk * 15,
      power: 4 + risk * 2, range: index === 2 ? 3 : 1,
      x: 9 + Math.floor(index / 3), y: 2 + index % 3, attackAt: 0, shield: 0,
    })),
    cooldowns: Object.fromEntries(CARDS.map(card => [card.id, 0])), events: [],
  };
  event(next.battle, 'info', '교전 시작. 에너지는 매초 1 회복됩니다.');
  log(next, '교전 시작. 소유 대원이 살아 있어야 카드를 사용할 수 있습니다.');
  return next;
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function compareId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function nearest(unit, opponents) {
  return opponents.filter(other => other.hp > 0).sort((a, b) =>
    distance(unit, a) - distance(unit, b) || compareId(a, b))[0];
}

// Breadth-first cardinal routing to an unoccupied firing cell. Stable neighbor
// order and unit order make congestion and tie-breaking replayable.
function move(unit, target, units) {
  const occupied = new Set(units.filter(other => other.hp > 0 && other !== unit)
    .map(other => other.y * 12 + other.x));
  const queue = [{ x: unit.x, y: unit.y, first: null }];
  const visited = new Set([unit.y * 12 + unit.x]);
  for (let index = 0; index < queue.length; index += 1) {
    const cell = queue[index];
    if (cell.first && distance(cell, target) <= unit.range) {
      unit.x = cell.first.x;
      unit.y = cell.first.y;
      return;
    }
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const x = cell.x + dx;
      const y = cell.y + dy;
      const key = y * 12 + x;
      if (x < 0 || x >= 12 || y < 0 || y >= 8 || occupied.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push({ x, y, first: cell.first ?? { x, y } });
    }
  }
}

function damage(target, amount) {
  const absorbed = Math.min(target.shield ?? 0, amount);
  target.shield = (target.shield ?? 0) - absorbed;
  const applied = Math.min(target.hp, amount - absorbed);
  target.hp -= applied;
  return applied;
}

function checkOutcome(state) {
  if (!state.battle.allies.some(unit => unit.hp > 0)) finish(state, 'defeat');
  else if (!state.battle.enemies.some(unit => unit.hp > 0)) finish(state, 'victory');
  else if (state.battle.tick >= MAX_BATTLE_TICKS) finish(state, 'defeat');
}

function tick(state) {
  const battle = state.battle;
  battle.tick += 1;
  if (battle.tick % TICKS_PER_SECOND === 0) battle.energy = Math.min(MAX_ENERGY, battle.energy + 1);
  const units = [...battle.allies, ...battle.enemies];
  const attacks = [];
  for (const unit of units) {
    if (unit.hp <= 0) continue;
    const target = nearest(unit, unit.side === 'ally' ? battle.enemies : battle.allies);
    if (!target) continue;
    if (distance(unit, target) > unit.range && battle.tick % MOVE_INTERVAL === 0) {
      const fromX = unit.x;
      const fromY = unit.y;
      move(unit, target, units);
      if (unit.x !== fromX || unit.y !== fromY) {
        event(battle, 'move', `${unit.name}: 이동 완료`,
          { unitId: unit.id, fromX, fromY, x: unit.x, y: unit.y });
        // Cell movement completes now; this actor may act from the next tick.
        continue;
      }
    }
    if (distance(unit, target) <= unit.range && battle.tick >= unit.attackAt) {
      attacks.push({ unit, target, amount: unit.power });
      unit.attackAt = battle.tick + ATTACK_INTERVAL;
    }
  }
  // All living actors commit before damage; a same-tick casualty still strikes.
  for (const { unit, target, amount } of attacks) {
    const applied = damage(target, amount);
    event(battle, 'attack', `${unit.name} → ${target.name}: 피해 ${applied}`,
      { attackerId: unit.id, targetId: target.id, damage: applied, targetHp: target.hp });
  }
  checkOutcome(state);
}

export function stepGame(state, ticks = 1) {
  requirePhase(state, 'battle');
  if (!Number.isSafeInteger(ticks) || ticks < 0) throw new Error('진행 틱은 0 이상의 안전 정수여야 합니다.');
  const next = copy(state);
  if (next.battle.paused) return next;
  for (let count = 0; count < ticks && next.phase === 'battle'; count += 1) tick(next);
  return next;
}

export function togglePause(state) {
  requirePhase(state, 'battle');
  const next = copy(state);
  next.battle.paused = !next.battle.paused;
  return next;
}

export function playCard(state, cardId) {
  requirePhase(state, 'battle');
  const card = CARDS.find(candidate => candidate.id === cardId);
  if (!card) throw new Error('알 수 없는 전술 카드입니다.');
  if (state.battle.paused) throw new Error('일시정지를 해제한 뒤 카드를 사용해 주세요.');
  const owner = state.battle.allies.find(unit => unit.id === card.ownerId);
  if (owner.hp <= 0) throw new Error('카드 소유 대원이 전투불능입니다.');
  if (state.battle.events.some(entry => entry.kind === 'move' &&
    entry.tick === state.battle.tick && entry.unitId === owner.id)) {
    throw new Error('이동을 마친 다음 틱부터 카드를 사용할 수 있습니다.');
  }
  if (state.battle.tick < state.battle.cooldowns[card.id]) throw new Error('카드 재사용 대기 시간이 남았습니다.');
  if (state.battle.energy < card.cost) throw new Error('카드를 사용할 에너지가 부족합니다.');
  const next = copy(state);
  const battle = next.battle;
  battle.energy -= card.cost;
  battle.cooldowns[card.id] = battle.tick + card.cooldownTicks;
  if (card.kind === 'shield') {
    for (const unit of battle.allies) if (unit.hp > 0) unit.shield = Math.max(unit.shield, 14);
  } else if (card.kind === 'strike') {
    const target = nearest(owner, battle.enemies);
    const applied = damage(target, 24);
    event(battle, 'damage', `${target.name}: 돌파 사격 피해 ${applied}`,
      { attackerId: owner.id, targetId: target.id, damage: applied, targetHp: target.hp });
  } else {
    const target = battle.allies.filter(unit => unit.hp > 0).sort((a, b) =>
      a.hp / a.maxHp - b.hp / b.maxHp || compareId(a, b))[0];
    target.hp = Math.min(target.maxHp, target.hp + 24);
  }
  event(battle, 'card', `${owner.name}: ${card.title}`, { cardId: card.id, ownerId: owner.id });
  checkOutcome(next);
  return next;
}

export function retreat(state) {
  requirePhase(state, 'encounter', 'deployment', 'battle');
  const next = copy(state);
  finish(next, 'retreat');
  return next;
}

export function settle(state) {
  requirePhase(state, 'result');
  if (state.result.applied || state.completedResults.includes(state.result.id)) {
    throw new Error('이미 정산한 원정 결과입니다.');
  }
  const next = copy(state);
  next.supplies += next.result.suppliesDelta;
  next.reputation += next.result.reputationDelta;
  next.lastDelta = { supplies: next.result.suppliesDelta, reputation: next.result.reputationDelta };
  next.result.applied = true;
  next.completedResults.push(next.result.id);
  next.phase = 'settled';
  log(next, `정산 완료: 보급 ${next.lastDelta.supplies >= 0 ? '+' : ''}${next.lastDelta.supplies}, 평판 ${next.lastDelta.reputation >= 0 ? '+' : ''}${next.lastDelta.reputation}.`);
  return next;
}

export function returnHome(state) {
  // Planning cancellation is free; an unresolved sortie cannot skip settlement.
  requirePhase(state, 'planning', 'settled');
  const next = copy(state);
  next.phase = 'home';
  next.destination = null;
  next.battle = null;
  next.result = null;
  log(next, '영등포 거점으로 복귀했습니다. 부상을 확인하고 다음 원정을 준비하세요.');
  return next;
}

export function rest(state) {
  requirePhase(state, 'home');
  const next = copy(state);
  if (next.supplies < 20) {
    // Explicit relief rule prevents a defeat/empty-supplies dead end. Two days
    // of depot work replenish to 20; this is not a silent reset or free sortie.
    next.supplies = 20;
    next.day += 2;
    log(next, '이틀간 거점 작업과 치료를 마쳤습니다. 긴급 보급을 20개까지 충원했습니다.', 'good');
  } else {
    next.supplies -= 4;
    next.day += 1;
    log(next, '보급 4개와 하루를 사용해 분대 전원을 치료했습니다.', 'good');
  }
  for (const unit of next.squad) unit.hp = unit.maxHp;
  return next;
}
