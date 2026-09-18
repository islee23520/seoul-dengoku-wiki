import {
  UNITS,
  assertFormation,
} from "../formation-editor/formation-model.js";

export const TICKS_PER_SECOND = 30;
export const FIXED_STEP_MS = 1000 / TICKS_PER_SECOND;
export const MAX_STEPS_PER_FRAME = 4;
export const SQUAD_SIZE = 4;

const MOVE_DISTANCE_PER_TICK = 0.15;
const ATTACK_COOLDOWN_TICKS = 30;
const MAX_BATTLE_TICKS = 900;
const ARENA_LIMIT = 5.25;

const ROLE_STATS = Object.freeze({
  guard: Object.freeze({ hp: 30, power: 4, range: 1 }),
  assault: Object.freeze({ hp: 20, power: 6, range: 1 }),
  archer: Object.freeze({ hp: 14, power: 3, range: 3 }),
});

const SLOT_COORDS = Object.freeze({
  "front-left": Object.freeze({ x: -1.5, z: 2.25 }),
  "front-center": Object.freeze({ x: 0, z: 2.25 }),
  "front-right": Object.freeze({ x: 1.5, z: 2.25 }),
  "middle-left": Object.freeze({ x: -1.5, z: 3.75 }),
  "middle-center": Object.freeze({ x: 0, z: 3.75 }),
  "middle-right": Object.freeze({ x: 1.5, z: 3.75 }),
  "rear-left": Object.freeze({ x: -1.5, z: 5.25 }),
  "rear-center": Object.freeze({ x: 0, z: 5.25 }),
  "rear-right": Object.freeze({ x: 1.5, z: 5.25 }),
});

const ENEMY_SLOTS = Object.freeze([
  "front-left",
  "front-center",
  "front-right",
  "middle-left",
  "middle-center",
  "middle-right",
]);

const FIGURE_OFFSETS = Object.freeze([
  Object.freeze({ x: -0.33, z: -0.33 }),
  Object.freeze({ x: 0.33, z: -0.33 }),
  Object.freeze({ x: -0.33, z: 0.33 }),
  Object.freeze({ x: 0.33, z: 0.33 }),
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function round(value) {
  return Number(value.toFixed(6));
}

function clamp(value) {
  return Math.max(-ARENA_LIMIT, Math.min(ARENA_LIMIT, Number(value)));
}

function normalizeHeading(headingDeg) {
  const normalized = Number(headingDeg) % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function headingTo(from, to) {
  return normalizeHeading(
    Math.round(
      (Math.atan2(to.x - from.x, to.z - from.z) * 180) / Math.PI,
    ),
  );
}

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function findUnitSlot(formation, unitId) {
  return Object.entries(formation).find(([, placedUnitId]) => {
    return placedUnitId === unitId;
  })[0];
}

function syncFigures(squad) {
  const radians = (squad.headingDeg * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);

  for (const figure of squad.figures) {
    const offsetX =
      figure.localX * cosine + figure.localZ * sine;
    const offsetZ =
      -figure.localX * sine + figure.localZ * cosine;
    figure.x = round(squad.center.x + offsetX);
    figure.z = round(squad.center.z + offsetZ);
  }
}

function createFigures(squadId, center, stats) {
  return FIGURE_OFFSETS.map((offset, index) => ({
    id: `${squadId}-figure-${index + 1}`,
    localX: offset.x,
    localZ: offset.z,
    x: center.x + offset.x,
    z: center.z + offset.z,
    hp: stats.hp,
    maxHp: stats.hp,
    alive: true,
  }));
}

function createSquad(unit, slotId, side, index) {
  const stats = ROLE_STATS[unit.role];
  const slot = SLOT_COORDS[slotId];
  const center = {
    x: slot.x,
    z: side === "ally" ? slot.z : -slot.z,
  };
  const id = `${side}-squad-${index + 1}`;
  const squad = {
    id,
    leaderUnitId: unit.id,
    name:
      side === "ally"
        ? `${unit.name} 분대`
        : `적 ${unit.roleLabel} ${index + 1}`,
    role: unit.role,
    roleLabel: unit.roleLabel,
    side,
    center,
    startCenter: { ...center },
    headingDeg: side === "ally" ? 180 : 0,
    hp: stats.hp * SQUAD_SIZE,
    maxHp: stats.hp * SQUAD_SIZE,
    aliveCount: SQUAD_SIZE,
    power: stats.power,
    range: stats.range,
    cooldownTicks: 0,
    order: { kind: "hold" },
    figures: createFigures(id, center, stats),
  };
  syncFigures(squad);
  return squad;
}

function findSquad(state, squadId) {
  return state.squads.find((squad) => squad.id === squadId);
}

function findNearestEnemy(state, squad) {
  return state.squads
    .filter((candidate) => {
      return (
        candidate.side !== squad.side &&
        candidate.aliveCount > 0
      );
    })
    .sort((left, right) => {
      const distanceDifference =
        distance(squad.center, left.center) -
        distance(squad.center, right.center);
      return distanceDifference || left.id.localeCompare(right.id);
    })[0];
}

function moveToward(squad, target, keepOrder) {
  const remaining = distance(squad.center, target);
  squad.headingDeg = headingTo(squad.center, target);

  if (remaining <= MOVE_DISTANCE_PER_TICK) {
    squad.center.x = round(target.x);
    squad.center.z = round(target.z);
    if (!keepOrder) {
      squad.order = { kind: "hold" };
    }
    syncFigures(squad);
    return true;
  }

  const ratio = MOVE_DISTANCE_PER_TICK / remaining;
  squad.center.x = round(
    squad.center.x + (target.x - squad.center.x) * ratio,
  );
  squad.center.z = round(
    squad.center.z + (target.z - squad.center.z) * ratio,
  );
  syncFigures(squad);
  return false;
}

function applyDamage(squad, damage) {
  let remainingDamage = damage;

  for (const figure of squad.figures) {
    if (!figure.alive || remainingDamage <= 0) {
      continue;
    }

    const applied = Math.min(figure.hp, remainingDamage);
    figure.hp -= applied;
    remainingDamage -= applied;

    if (figure.hp <= 0) {
      figure.hp = 0;
      figure.alive = false;
    }
  }

  squad.hp = squad.figures.reduce(
    (total, figure) => total + figure.hp,
    0,
  );
  squad.aliveCount = squad.figures.filter(
    (figure) => figure.alive,
  ).length;

  if (squad.aliveCount === 0) {
    squad.order = { kind: "hold" };
  }
}

function updateOutcome(state) {
  const allyAlive = state.squads.some((squad) => {
    return squad.side === "ally" && squad.aliveCount > 0;
  });
  const enemyAlive = state.squads.some((squad) => {
    return squad.side === "enemy" && squad.aliveCount > 0;
  });

  if (!allyAlive || !enemyAlive) {
    state.status = "stopped";
    state.paused = false;
    state.accumulatorMs = 0;
    state.outcome =
      allyAlive && !enemyAlive
        ? "ally-victory"
        : enemyAlive && !allyAlive
          ? "enemy-victory"
          : "draw";
    return;
  }

  if (state.tick >= MAX_BATTLE_TICKS) {
    state.status = "stopped";
    state.paused = false;
    state.accumulatorMs = 0;
    state.outcome = "draw";
  }
}

function stepBattle(state) {
  if (
    state.status !== "running" ||
    state.paused ||
    state.outcome !== "ongoing"
  ) {
    return state;
  }

  const next = clone(state);
  const attackIntents = [];

  for (const squad of next.squads) {
    if (squad.aliveCount === 0) {
      continue;
    }

    if (squad.cooldownTicks > 0) {
      squad.cooldownTicks -= 1;
    }

    if (squad.order.kind === "face") {
      squad.headingDeg = normalizeHeading(squad.order.headingDeg);
      squad.order = { kind: "hold" };
      syncFigures(squad);
      continue;
    }

    if (squad.order.kind === "move") {
      moveToward(squad, squad.order.target, false);
      continue;
    }

    if (squad.order.kind !== "attack") {
      continue;
    }

    let target = findSquad(next, squad.order.targetSquadId);
    if (
      !target ||
      target.side === squad.side ||
      target.aliveCount === 0
    ) {
      target = findNearestEnemy(next, squad);
      if (!target) {
        continue;
      }
      squad.order.targetSquadId = target.id;
    }

    squad.headingDeg = headingTo(squad.center, target.center);
    const engagementDistance = squad.range * 0.8 + 0.65;

    if (distance(squad.center, target.center) > engagementDistance) {
      moveToward(squad, target.center, true);
      continue;
    }

    syncFigures(squad);
    if (squad.cooldownTicks === 0) {
      attackIntents.push({
        attackerId: squad.id,
        targetId: target.id,
        damage: squad.power * Math.max(1, squad.aliveCount),
      });
      squad.cooldownTicks = ATTACK_COOLDOWN_TICKS;
    }
  }

  for (const intent of attackIntents) {
    const attacker = findSquad(next, intent.attackerId);
    const target = findSquad(next, intent.targetId);
    if (!attacker || !target || target.aliveCount === 0) {
      continue;
    }

    applyDamage(target, intent.damage);
    next.events.push({
      kind: "attack",
      tick: next.tick,
      attackerId: attacker.id,
      targetId: target.id,
      damage: intent.damage,
      targetHp: target.hp,
      targetAliveCount: target.aliveCount,
    });
  }

  if (next.events.length > 80) {
    next.events = next.events.slice(-80);
  }

  next.tick += 1;
  updateOutcome(next);
  return next;
}

export function createSquadBattleState({ formation, seed = 2409 }) {
  assertFormation(formation);

  const allies = UNITS.map((unit, index) => {
    return createSquad(
      unit,
      findUnitSlot(formation, unit.id),
      "ally",
      index,
    );
  });
  const enemies = UNITS.map((unit, index) => {
    return createSquad(unit, ENEMY_SLOTS[index], "enemy", index);
  });

  return {
    seed,
    formation: { ...formation },
    status: "ready",
    paused: false,
    tick: 0,
    accumulatorMs: 0,
    outcome: "ongoing",
    selectedSquadId: allies[0].id,
    squads: [...allies, ...enemies],
    events: [],
  };
}

export function startBattle(state) {
  if (state.status !== "ready") {
    return state;
  }

  const next = clone(state);
  next.status = "running";
  next.paused = false;
  next.accumulatorMs = 0;

  for (let index = 0; index < 6; index += 1) {
    const ally = next.squads[index];
    const enemy = next.squads[index + 6];

    if (ally.order.kind === "hold") {
      ally.order = {
        kind: "attack",
        targetSquadId: enemy.id,
      };
    }
    if (enemy.order.kind === "hold") {
      enemy.order = {
        kind: "attack",
        targetSquadId: ally.id,
      };
    }
  }

  return next;
}

export function selectSquad(state, squadId) {
  const squad = findSquad(state, squadId);
  if (
    !squad ||
    squad.side !== "ally" ||
    squad.aliveCount === 0
  ) {
    return state;
  }

  return {
    ...state,
    selectedSquadId: squadId,
  };
}

export function issueMoveOrder(state, squadId, target) {
  const squad = findSquad(state, squadId);
  if (
    !squad ||
    squad.side !== "ally" ||
    squad.aliveCount === 0 ||
    state.status === "stopped" ||
    !Number.isFinite(target?.x) ||
    !Number.isFinite(target?.z)
  ) {
    return state;
  }

  const next = clone(state);
  const nextSquad = findSquad(next, squadId);
  const clampedTarget = {
    x: round(clamp(target.x)),
    z: round(clamp(target.z)),
  };
  nextSquad.order = {
    kind: "move",
    target: clampedTarget,
  };
  next.selectedSquadId = squadId;
  return next;
}

export function issueFacingOrder(state, squadId, headingDeg) {
  const squad = findSquad(state, squadId);
  if (
    !squad ||
    squad.side !== "ally" ||
    squad.aliveCount === 0 ||
    state.status === "stopped" ||
    !Number.isFinite(headingDeg)
  ) {
    return state;
  }

  const next = clone(state);
  findSquad(next, squadId).order = {
    kind: "face",
    headingDeg: normalizeHeading(headingDeg),
  };
  next.selectedSquadId = squadId;
  return next;
}

export function issueAttackOrder(state, squadId, targetSquadId) {
  const squad = findSquad(state, squadId);
  const target = findSquad(state, targetSquadId);
  if (
    !squad ||
    !target ||
    squad.side !== "ally" ||
    target.side !== "enemy" ||
    squad.aliveCount === 0 ||
    target.aliveCount === 0 ||
    state.status === "stopped"
  ) {
    return state;
  }

  const next = clone(state);
  findSquad(next, squadId).order = {
    kind: "attack",
    targetSquadId,
  };
  next.selectedSquadId = squadId;
  return next;
}

export function issueHoldOrder(state, squadId) {
  const squad = findSquad(state, squadId);
  if (
    !squad ||
    squad.side !== "ally" ||
    squad.aliveCount === 0 ||
    state.status === "stopped"
  ) {
    return state;
  }

  const next = clone(state);
  findSquad(next, squadId).order = { kind: "hold" };
  next.selectedSquadId = squadId;
  return next;
}

export function setBattlePaused(state, paused) {
  if (state.status !== "running") {
    return state;
  }

  return {
    ...state,
    paused: Boolean(paused),
    accumulatorMs: 0,
  };
}

export function advanceBattleTicks(state, tickCount) {
  let next = state;
  const count = Math.max(0, Math.floor(Number(tickCount) || 0));

  for (let index = 0; index < count; index += 1) {
    if (
      next.status !== "running" ||
      next.paused ||
      next.outcome !== "ongoing"
    ) {
      break;
    }
    next = stepBattle(next);
  }

  return next;
}

export function advanceBattleFrame(state, elapsedMs) {
  if (state.status !== "running" || state.paused) {
    return state;
  }

  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  const total = state.accumulatorMs + elapsed;
  const availableSteps = Math.floor(total / FIXED_STEP_MS);
  const stepCount = Math.min(
    MAX_STEPS_PER_FRAME,
    availableSteps,
  );
  const retainedAccumulator =
    availableSteps > MAX_STEPS_PER_FRAME
      ? 0
      : total - stepCount * FIXED_STEP_MS;

  let next = state;
  for (let step = 0; step < stepCount; step += 1) {
    next = stepBattle(next);
    if (next.status === "stopped") {
      break;
    }
  }

  if (next === state) {
    return retainedAccumulator === state.accumulatorMs
      ? state
      : { ...state, accumulatorMs: retainedAccumulator };
  }

  return {
    ...next,
    accumulatorMs:
      next.status === "running" ? retainedAccumulator : 0,
  };
}

export function resetBattle(state) {
  return createSquadBattleState({
    formation: state.formation,
    seed: state.seed,
  });
}

export function battleFingerprint(state) {
  return JSON.stringify(state);
}
