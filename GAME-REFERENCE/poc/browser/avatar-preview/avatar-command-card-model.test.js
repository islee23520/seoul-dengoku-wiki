import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialState,
} from "../formation-editor/formation-model.js";
import {
  advanceBattleTicks,
  createSquadBattleState,
  resetBattle,
  selectSquad,
  setBattlePaused,
  startBattle,
} from "../battle-preview/battle-model.js";
import {
  COMMANDER_CARD_RULES,
  MOBILITY_REGROUP_CARD,
  commanderCardFingerprint,
  commanderCardOffering,
  createCommanderCardState,
  playSelectedCommanderCard,
  selectCommanderCard,
  syncCommanderCardState,
} from "./avatar-command-card-model.js";

const formation = createInitialState().pending;

function createBattle() {
  return createSquadBattleState({
    formation,
    seed: 2409,
  });
}

function getSquad(state, squadId) {
  const squad = state.squads.find((candidate) => {
    return candidate.id === squadId;
  });
  assert.ok(squad, `분대를 찾을 수 없습니다: ${squadId}`);
  return squad;
}

function selectMobility(cardState, battleState) {
  const result = selectCommanderCard(
    cardState,
    battleState,
    "mobility-regroup",
  );

  assert.equal(result.rejection, null);
  return result.cardState;
}

function mobilityCommand({
  cardState,
  battleState,
  targetSquadId = battleState.selectedSquadId,
}) {
  const target = getSquad(
    battleState,
    targetSquadId,
  );

  return playSelectedCommanderCard(
    cardState,
    battleState,
    {
      targetSquadId,
      ground: {
        x: target.center.x + 10,
        z: target.center.z,
      },
    },
  );
}

test("Core CardRules의 기동 재집결 character card 파라미터를 제공한다", () => {
  assert.equal(COMMANDER_CARD_RULES.hasDeck, false);
  assert.equal(COMMANDER_CARD_RULES.hasDraw, false);
  assert.equal(COMMANDER_CARD_RULES.commandRadiusCells, 3);

  assert.deepEqual(
    {
      id: MOBILITY_REGROUP_CARD.id,
      kind: MOBILITY_REGROUP_CARD.kind,
      rechargeTicks:
        MOBILITY_REGROUP_CARD.rechargeTicks,
      effect: MOBILITY_REGROUP_CARD.effect,
      effectKey: MOBILITY_REGROUP_CARD.effectKey,
    },
    {
      id: "mobility-regroup",
      kind: "character",
      rechargeTicks: 600,
      effect: 1,
      effectKey: "cardinal_reposition",
    },
  );
  assert.equal(
    MOBILITY_REGROUP_CARD.exactCoreParity,
    false,
  );
});

test("현재 선택된 생존 아군 지휘관이 character card의 실제 owner가 된다", () => {
  const battle = createBattle();
  const owner = getSquad(
    battle,
    battle.selectedSquadId,
  );
  const cardState = createCommanderCardState(battle);
  const offering = commanderCardOffering(
    cardState,
    battle,
  );

  assert.equal(cardState.ownerSquadId, owner.id);
  assert.equal(offering.length, 1);
  assert.equal(
    offering[0].id,
    "mobility-regroup",
  );
  assert.equal(
    offering[0].ownerSquadId,
    owner.id,
  );
  assert.equal(offering[0].kind, "character");
  assert.equal(offering[0].rechargeTicksLeft, 0);

  const deadBattle = structuredClone(battle);
  const deadOwner = getSquad(
    deadBattle,
    deadBattle.selectedSquadId,
  );
  deadOwner.aliveCount = 0;
  deadOwner.hp = 0;

  assert.deepEqual(
    commanderCardOffering(cardState, deadBattle),
    [],
  );
});

test("기동 재집결은 유효한 생존 아군 target을 cardinal 한 칸 이동시키고 cooldown을 소비한다", () => {
  const battle = createBattle();
  const owner = getSquad(
    battle,
    battle.selectedSquadId,
  );
  const originalBattle = structuredClone(battle);
  const beforeOwner = structuredClone(owner);
  const cardState = selectMobility(
    createCommanderCardState(battle),
    battle,
  );
  const played = mobilityCommand({
    cardState,
    battleState: battle,
  });

  assert.equal(played.rejection, null);
  assert.deepEqual(played.effect, {
    kind: "cardinal-reposition",
    cardId: "mobility-regroup",
    ownerSquadId: owner.id,
    targetSquadId: owner.id,
    headingDeg: 90,
  });

  const moved = getSquad(
    played.battleState,
    owner.id,
  );
  assert.deepEqual(moved.center, {
    x:
      beforeOwner.center.x +
      COMMANDER_CARD_RULES.worldGridStep,
    z: beforeOwner.center.z,
  });
  assert.equal(moved.headingDeg, 90);

  for (
    let index = 0;
    index < moved.figures.length;
    index += 1
  ) {
    assert.equal(
      moved.figures[index].x,
      moved.center.x +
        beforeOwner.figures[index].localZ,
    );
    assert.equal(
      moved.figures[index].z,
      moved.center.z -
        beforeOwner.figures[index].localX,
    );
  }

  assert.equal(
    played.cardState.cards["mobility-regroup"]
      .rechargeTicksLeft,
    600,
  );
  assert.equal(
    played.cardState.cards["mobility-regroup"]
      .playCount,
    1,
  );
  assert.equal(played.cardState.selectedCardId, null);
  assert.equal(
    played.battleState.squads.reduce(
      (total, squad) => {
        return total + squad.figures.length;
      },
      0,
    ),
    48,
  );
  assert.deepEqual(
    battle,
    originalBattle,
    "카드 적용이 입력 battle state를 변이하면 안 됩니다.",
  );
});

test("적·사망·지휘 범위 밖 target은 카드와 battle state를 바꾸지 않고 거절한다", () => {
  const battle = createBattle();
  const owner = getSquad(
    battle,
    battle.selectedSquadId,
  );
  const enemy = battle.squads.find((squad) => {
    return squad.side === "enemy";
  });
  const selected = selectMobility(
    createCommanderCardState(battle),
    battle,
  );
  const beforeEnemy = commanderCardFingerprint(
    selected,
    battle,
  );
  const enemyPlay = mobilityCommand({
    cardState: selected,
    battleState: battle,
    targetSquadId: enemy.id,
  });

  assert.equal(
    enemyPlay.rejection,
    "card-invalid-target",
  );
  assert.equal(
    commanderCardFingerprint(
      enemyPlay.cardState,
      enemyPlay.battleState,
    ),
    beforeEnemy,
  );

  const deadBattle = structuredClone(battle);
  const deadTarget = getSquad(
    deadBattle,
    owner.id,
  );
  deadTarget.aliveCount = 0;
  deadTarget.hp = 0;
  for (const figure of deadTarget.figures) {
    figure.alive = false;
    figure.hp = 0;
  }
  const beforeDead = commanderCardFingerprint(
    selected,
    deadBattle,
  );
  const deadPlay = mobilityCommand({
    cardState: selected,
    battleState: deadBattle,
  });

  assert.equal(
    deadPlay.rejection,
    "card-invalid-target",
  );
  assert.equal(
    commanderCardFingerprint(
      deadPlay.cardState,
      deadPlay.battleState,
    ),
    beforeDead,
  );

  const distantBattle = structuredClone(battle);
  const distantOwner = getSquad(
    distantBattle,
    owner.id,
  );
  distantOwner.center = {
    x: -5.25,
    z: -5.25,
  };
  const distantTarget = distantBattle.squads.find(
    (squad) => {
      return (
        squad.side === "ally" &&
        squad.id !== distantOwner.id
      );
    },
  );
  distantTarget.center = {
    x: 5.25,
    z: 5.25,
  };
  const distantCards = selectMobility(
    createCommanderCardState(distantBattle),
    distantBattle,
  );
  const beforeDistant =
    commanderCardFingerprint(
      distantCards,
      distantBattle,
    );
  const distantPlay = mobilityCommand({
    cardState: distantCards,
    battleState: distantBattle,
    targetSquadId: distantTarget.id,
  });

  assert.equal(
    distantPlay.rejection,
    "card-out-of-radius",
  );
  assert.equal(
    commanderCardFingerprint(
      distantPlay.cardState,
      distantPlay.battleState,
    ),
    beforeDistant,
  );
});

test("recharge 중 재선택은 완전 무변이로 거절한다", () => {
  const battle = createBattle();
  const cardState = createCommanderCardState(battle);
  cardState.cards["mobility-regroup"]
    .rechargeTicksLeft = 12;
  const before = structuredClone(cardState);
  const result = selectCommanderCard(
    cardState,
    battle,
    "mobility-regroup",
  );

  assert.equal(
    result.rejection,
    "card-recharging",
  );
  assert.deepEqual(result.cardState, before);
});

test("stale 선택 상태도 direct play에서 recharge와 종단 전투를 우회하지 못한다", () => {
  const battle = createBattle();
  const selected = selectMobility(
    createCommanderCardState(battle),
    battle,
  );
  selected.cards["mobility-regroup"]
    .rechargeTicksLeft = 12;
  const beforeRecharge = commanderCardFingerprint(
    selected,
    battle,
  );
  const rechargeBypass = mobilityCommand({
    cardState: selected,
    battleState: battle,
  });

  assert.equal(
    rechargeBypass.rejection,
    "card-recharging",
  );
  assert.equal(
    commanderCardFingerprint(
      rechargeBypass.cardState,
      rechargeBypass.battleState,
    ),
    beforeRecharge,
  );

  let stoppedBattle = startBattle(createBattle());
  const stoppedCards = selectMobility(
    createCommanderCardState(stoppedBattle),
    stoppedBattle,
  );
  stoppedBattle = advanceBattleTicks(
    stoppedBattle,
    1800,
  );
  assert.equal(stoppedBattle.status, "stopped");
  const beforeStopped = commanderCardFingerprint(
    stoppedCards,
    stoppedBattle,
  );
  const stoppedPlay = mobilityCommand({
    cardState: stoppedCards,
    battleState: stoppedBattle,
  });

  assert.equal(
    stoppedPlay.rejection,
    "battle-stopped",
  );
  assert.equal(
    commanderCardFingerprint(
      stoppedPlay.cardState,
      stoppedPlay.battleState,
    ),
    beforeStopped,
  );
});

test("지휘관 선택을 바꿔도 owner별 cooldown이 이전되거나 우회되지 않는다", () => {
  let battle = createBattle();
  const firstOwnerId = battle.selectedSquadId;
  let cards = selectMobility(
    createCommanderCardState(battle),
    battle,
  );
  const firstPlay = mobilityCommand({
    cardState: cards,
    battleState: battle,
  });

  assert.equal(firstPlay.rejection, null);
  battle = firstPlay.battleState;
  cards = firstPlay.cardState;
  assert.equal(
    cards.cards["mobility-regroup"].rechargeTicksLeft,
    600,
  );

  const secondOwner = battle.squads.find((squad) => {
    return (
      squad.side === "ally" &&
      squad.id !== firstOwnerId
    );
  });
  battle = selectSquad(battle, secondOwner.id);
  cards = syncCommanderCardState(cards, battle);

  const secondOffering = commanderCardOffering(
    cards,
    battle,
  );
  assert.equal(cards.ownerSquadId, secondOwner.id);
  assert.equal(secondOffering.length, 1);
  assert.equal(
    secondOffering[0].rechargeTicksLeft,
    0,
    "다른 지휘관에게 첫 지휘관의 cooldown을 이전하면 안 됩니다.",
  );

  cards = selectMobility(cards, battle);
  const secondPlay = mobilityCommand({
    cardState: cards,
    battleState: battle,
  });
  assert.equal(secondPlay.rejection, null);

  battle = selectSquad(
    secondPlay.battleState,
    firstOwnerId,
  );
  cards = syncCommanderCardState(
    secondPlay.cardState,
    battle,
  );

  assert.equal(cards.ownerSquadId, firstOwnerId);
  assert.equal(
    commanderCardOffering(cards, battle)[0]
      .rechargeTicksLeft,
    600,
    "첫 지휘관으로 돌아왔을 때 기존 cooldown이 유지돼야 합니다.",
  );

  const beforeBypass = structuredClone(cards);
  const bypass = selectCommanderCard(
    cards,
    battle,
    "mobility-regroup",
  );
  assert.equal(bypass.rejection, "card-recharging");
  assert.deepEqual(bypass.cardState, beforeBypass);
});

test("tick 0 paused 카드 사용 뒤 같은 tick의 Reset도 owner별 cooldown을 초기화한다", () => {
  const pausedBattle = setBattlePaused(
    startBattle(createBattle()),
    true,
  );
  const selected = selectMobility(
    createCommanderCardState(pausedBattle),
    pausedBattle,
  );
  const played = mobilityCommand({
    cardState: selected,
    battleState: pausedBattle,
  });

  assert.equal(played.rejection, null);
  assert.equal(played.battleState.tick, 0);
  assert.equal(
    played.cardState.cards["mobility-regroup"]
      .rechargeTicksLeft,
    600,
  );

  const reset = resetBattle(played.battleState);
  assert.equal(reset.tick, 0);
  assert.equal(reset.status, "ready");

  const cleared = syncCommanderCardState(
    played.cardState,
    reset,
  );

  assert.equal(cleared.lastBattleTick, 0);
  assert.equal(cleared.lastBattleStatus, "ready");
  assert.equal(
    cleared.ownerSquadId,
    reset.selectedSquadId,
  );
  assert.equal(cleared.selectedCardId, null);
  assert.equal(
    cleared.cards["mobility-regroup"]
      .rechargeTicksLeft,
    0,
  );
  assert.ok(
    Object.values(cleared.cardsByOwner).every(
      (ownerCards) => {
        return (
          ownerCards["mobility-regroup"]
            .rechargeTicksLeft === 0
        );
      },
    ),
  );
});

test("pause 중 사용은 허용하되 cooldown은 동결되고 재개 tick만큼 감소하며 Reset이 지운다", () => {
  let battle = setBattlePaused(
    startBattle(createBattle()),
    true,
  );
  const owner = getSquad(
    battle,
    battle.selectedSquadId,
  );
  const selected = selectMobility(
    createCommanderCardState(battle),
    battle,
  );
  const played = mobilityCommand({
    cardState: selected,
    battleState: battle,
  });

  assert.equal(played.rejection, null);
  assert.equal(played.battleState.paused, true);
  assert.notDeepEqual(
    getSquad(
      played.battleState,
      owner.id,
    ).center,
    owner.center,
    "pause 중에도 사용자가 낸 카드 명령은 적용돼야 합니다.",
  );

  const frozenBattle = advanceBattleTicks(
    played.battleState,
    120,
  );
  const frozenCards = syncCommanderCardState(
    played.cardState,
    frozenBattle,
  );

  assert.equal(frozenBattle.tick, battle.tick);
  assert.equal(
    frozenCards.cards["mobility-regroup"]
      .rechargeTicksLeft,
    600,
  );

  battle = setBattlePaused(frozenBattle, false);
  battle = advanceBattleTicks(battle, 8);
  const resumedCards = syncCommanderCardState(
    frozenCards,
    battle,
  );

  assert.equal(
    resumedCards.cards["mobility-regroup"]
      .rechargeTicksLeft,
    592,
  );

  const reset = resetBattle(battle);
  const cleared = syncCommanderCardState(
    resumedCards,
    reset,
  );

  assert.equal(cleared.lastBattleTick, 0);
  assert.equal(cleared.selectedCardId, null);
  assert.equal(
    cleared.ownerSquadId,
    reset.selectedSquadId,
  );
  assert.equal(
    cleared.cards["mobility-regroup"]
      .rechargeTicksLeft,
    0,
  );
  assert.equal(
    reset.squads.reduce((total, squad) => {
      return total + squad.figures.length;
    }, 0),
    48,
  );
});
