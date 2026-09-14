import test from "node:test";
import assert from "node:assert/strict";

import { createInitialState } from "../formation-editor/formation-model.js";
import {
  FIXED_STEP_MS,
  SQUAD_SIZE,
  advanceBattleFrame,
  advanceBattleTicks,
  battleFingerprint,
  createSquadBattleState,
  issueAttackOrder,
  issueFacingOrder,
  issueHoldOrder,
  issueMoveOrder,
  resetBattle,
  selectSquad,
  setBattlePaused,
  startBattle,
} from "./battle-model.js";

const formation = createInitialState().pending;

function allySquads(state) {
  return state.squads.filter((squad) => squad.side === "ally");
}

function enemySquads(state) {
  return state.squads.filter((squad) => squad.side === "enemy");
}

function getSquad(state, squadId) {
  const squad = state.squads.find((candidate) => candidate.id === squadId);
  assert.ok(squad, `분대를 찾을 수 없습니다: ${squadId}`);
  return squad;
}

function shapeSignature(squad) {
  const distances = [];
  for (let left = 0; left < squad.figures.length; left += 1) {
    for (let right = left + 1; right < squad.figures.length; right += 1) {
      const dx = squad.figures[left].x - squad.figures[right].x;
      const dz = squad.figures[left].z - squad.figures[right].z;
      distances.push(Number((dx * dx + dz * dz).toFixed(6)));
    }
  }
  return distances.sort((a, b) => a - b);
}

test("초기 상태는 양측 6개 분대와 분대당 임시 병사 4명을 만든다", () => {
  const state = createSquadBattleState({ formation, seed: 2409 });

  assert.equal(state.status, "ready");
  assert.equal(allySquads(state).length, 6);
  assert.equal(enemySquads(state).length, 6);
  assert.equal(
    state.squads.reduce((total, squad) => total + squad.figures.length, 0),
    12 * SQUAD_SIZE,
  );
  assert.ok(state.squads.every((squad) => squad.figures.length === 4));
  assert.ok(state.squads.every((squad) => squad.aliveCount === 4));
  assert.equal(state.selectedSquadId, allySquads(state)[0].id);
  assert.equal("selectedFigureId" in state, false);
});

test("분대 이동은 대형 간격을 유지하며 목적지 방향으로 heading을 바꾼다", () => {
  const initial = createSquadBattleState({ formation, seed: 2409 });
  const squadId = allySquads(initial)[0].id;
  const before = getSquad(initial, squadId);
  const target = {
    x: before.center.x + 3,
    z: before.center.z,
  };

  const ordered = issueMoveOrder(
    selectSquad(startBattle(initial), squadId),
    squadId,
    target,
  );
  const advanced = advanceBattleTicks(ordered, 18);
  const after = getSquad(advanced, squadId);

  assert.equal(advanced.status, "running");
  assert.equal(advanced.tick, 18);
  assert.ok(after.center.x > before.center.x);
  assert.equal(after.center.z, before.center.z);
  assert.equal(after.headingDeg, 90);
  assert.deepEqual(shapeSignature(after), shapeSignature(before));
  assert.ok(
    after.figures.every((figure, index) => {
      const previous = before.figures[index];
      return figure.x !== previous.x || figure.z !== previous.z;
    }),
    "분대원 모두가 독립 이동이 아니라 같은 대형 중심을 따라 이동해야 한다.",
  );
});

test("일시정지 중 분대 명령은 예약되지만 틱·위치·HP는 동결된다", () => {
  const running = advanceBattleTicks(
    startBattle(createSquadBattleState({ formation, seed: 2409 })),
    12,
  );
  const squadId = allySquads(running)[1].id;
  const paused = setBattlePaused(running, true);
  const beforeOrder = getSquad(paused, squadId);
  const frozenCenter = { ...beforeOrder.center };
  const frozenHeading = beforeOrder.headingDeg;
  const frozenHp = beforeOrder.hp;
  const frozenFigures = beforeOrder.figures.map((figure) => ({
    x: figure.x,
    z: figure.z,
    hp: figure.hp,
    alive: figure.alive,
  }));
  const queued = issueMoveOrder(paused, squadId, { x: 3, z: 0 });
  const queuedSquad = getSquad(queued, squadId);
  const frozenFingerprint = battleFingerprint(queued);
  const frozen = advanceBattleFrame(queued, 1000);

  assert.equal(queued.paused, true);
  assert.equal(queuedSquad.order.kind, "move");
  assert.deepEqual(queuedSquad.center, frozenCenter);
  assert.equal(queuedSquad.headingDeg, frozenHeading);
  assert.equal(queuedSquad.hp, frozenHp);
  assert.deepEqual(
    queuedSquad.figures.map((figure) => ({
      x: figure.x,
      z: figure.z,
      hp: figure.hp,
      alive: figure.alive,
    })),
    frozenFigures,
    "일시정지 중 이동 명령은 다음 시뮬레이션 틱 전에 대형을 회전하거나 이동하면 안 된다.",
  );
  assert.equal(battleFingerprint(frozen), frozenFingerprint);

  const resumed = setBattlePaused(frozen, false);
  const oneStep = advanceBattleFrame(resumed, FIXED_STEP_MS + 1);

  assert.equal(oneStep.tick, running.tick + 1);
  assert.equal(getSquad(oneStep, squadId).order.kind, "move");
  assert.notDeepEqual(
    getSquad(oneStep, squadId).figures.map((figure) => ({
      x: figure.x,
      z: figure.z,
    })),
    frozenFigures.map((figure) => ({
      x: figure.x,
      z: figure.z,
    })),
    "재개 후 첫 시뮬레이션 틱부터 예약한 이동 명령을 실행해야 한다.",
  );
});

test("명시적 정면 명령도 예약 시 동결되고 재개 후 첫 틱에 대형 전체에 적용된다", () => {
  const running = advanceBattleTicks(
    startBattle(createSquadBattleState({ formation, seed: 2409 })),
    12,
  );
  const squadId = allySquads(running)[2].id;
  const paused = setBattlePaused(running, true);
  const beforeOrder = getSquad(paused, squadId);
  const frozenCenter = { ...beforeOrder.center };
  const frozenHeading = beforeOrder.headingDeg;
  const frozenHp = beforeOrder.hp;
  const frozenFigures = beforeOrder.figures.map((figure) => ({
    x: figure.x,
    z: figure.z,
    hp: figure.hp,
    alive: figure.alive,
  }));

  const queued = issueFacingOrder(paused, squadId, 90);
  const queuedSquad = getSquad(queued, squadId);

  assert.equal(queuedSquad.order.kind, "face");
  assert.equal(queuedSquad.order.headingDeg, 90);
  assert.deepEqual(queuedSquad.center, frozenCenter);
  assert.equal(queuedSquad.headingDeg, frozenHeading);
  assert.equal(queuedSquad.hp, frozenHp);
  assert.deepEqual(
    queuedSquad.figures.map((figure) => ({
      x: figure.x,
      z: figure.z,
      hp: figure.hp,
      alive: figure.alive,
    })),
    frozenFigures,
  );

  const frozen = advanceBattleFrame(queued, 1000);
  assert.equal(battleFingerprint(frozen), battleFingerprint(queued));

  const resumed = setBattlePaused(frozen, false);
  const oneStep = advanceBattleFrame(resumed, FIXED_STEP_MS + 1);
  const faced = getSquad(oneStep, squadId);

  assert.equal(oneStep.tick, running.tick + 1);
  assert.equal(faced.headingDeg, 90);
  assert.equal(faced.order.kind, "hold");
  assert.deepEqual(faced.center, frozenCenter);
  assert.notDeepEqual(
    faced.figures.map((figure) => ({
      x: figure.x,
      z: figure.z,
    })),
    frozenFigures.map((figure) => ({
      x: figure.x,
      z: figure.z,
    })),
    "재개 후 첫 틱에 네 병사의 로컬 오프셋이 새 정면으로 함께 회전해야 한다.",
  );
});

test("프레임 누산기는 최대 4틱만 처리하고 pause backlog를 재개 때 폭주시키지 않는다", () => {
  const started = startBattle(
    createSquadBattleState({ formation, seed: 2409 }),
  );
  const capped = advanceBattleFrame(started, 1000);
  const noBacklogBurst = advanceBattleFrame(capped, 0);

  assert.equal(capped.tick, 4);
  assert.equal(noBacklogBurst.tick, 4);

  const paused = setBattlePaused(capped, true);
  const frozen = advanceBattleFrame(paused, 5000);
  const resumed = setBattlePaused(frozen, false);
  const resumedFrame = advanceBattleFrame(resumed, FIXED_STEP_MS + 1);

  assert.equal(frozen.tick, 4);
  assert.equal(resumedFrame.tick, 5);
});

test("공격 명령은 지정한 적 분대 주변에서 교전하고 사상자·분대 HP를 갱신한다", () => {
  let state = startBattle(
    createSquadBattleState({ formation, seed: 2409 }),
  );
  const allies = allySquads(state);
  const enemies = enemySquads(state);
  const attackerId = allies.find((squad) => squad.role === "assault").id;
  const targetId = enemies.find((squad) => squad.role === "guard").id;

  for (const squad of allies) {
    state = issueHoldOrder(state, squad.id);
  }
  state = issueAttackOrder(state, attackerId, targetId);

  const attackerBefore = getSquad(state, attackerId);
  const targetBefore = getSquad(state, targetId);
  const heldBefore = allies
    .filter((squad) => squad.id !== attackerId)
    .map((squad) => ({
      id: squad.id,
      center: { ...getSquad(state, squad.id).center },
    }));

  const advanced = advanceBattleTicks(state, 240);
  const attackerAfter = getSquad(advanced, attackerId);
  const targetAfter = getSquad(advanced, targetId);

  assert.ok(
    targetAfter.hp < targetBefore.hp ||
      attackerAfter.hp < attackerBefore.hp,
    "공격 명령 뒤 교전 분대의 HP가 감소해야 한다.",
  );
  assert.ok(
    targetAfter.aliveCount < SQUAD_SIZE ||
      attackerAfter.aliveCount < SQUAD_SIZE,
    "교전 분대에 최소 한 명의 사상자가 발생해야 한다.",
  );
  assert.ok(
    advanced.events.some((event) => event.kind === "attack"),
    "공격 이벤트가 기록되어야 한다.",
  );

  for (const held of heldBefore) {
    assert.deepEqual(
      getSquad(advanced, held.id).center,
      held.center,
      "Hold 명령을 받은 다른 아군 분대가 한 목표로 몰려가면 안 된다.",
    );
  }
});

test("같은 seed·진형·분대 명령은 같은 종단 상태가 되고 Reset은 초기 상태를 복원한다", () => {
  function runBattle() {
    let state = startBattle(
      createSquadBattleState({ formation, seed: 2409 }),
    );
    const allies = allySquads(state);
    const enemies = enemySquads(state);

    for (let index = 0; index < allies.length; index += 1) {
      state = issueAttackOrder(
        state,
        allies[index].id,
        enemies[index].id,
      );
    }

    return advanceBattleTicks(state, 1800);
  }

  const firstTerminal = runBattle();
  const secondTerminal = runBattle();

  assert.equal(firstTerminal.status, "stopped");
  assert.notEqual(firstTerminal.outcome, "ongoing");
  assert.equal(
    battleFingerprint(firstTerminal),
    battleFingerprint(secondTerminal),
  );

  const reset = resetBattle(firstTerminal);
  const expected = createSquadBattleState({ formation, seed: 2409 });

  assert.notEqual(reset, firstTerminal);
  assert.deepEqual(reset, expected);
});
