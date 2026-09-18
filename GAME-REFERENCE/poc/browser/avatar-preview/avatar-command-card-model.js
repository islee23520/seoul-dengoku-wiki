export const COMMANDER_CARD_RULES = Object.freeze({
  hasDeck: false,
  hasDraw: false,
  commandRadiusCells: 3,
  worldGridStep: 1.5,
  arenaLimit: 5.25,
});

export const MOBILITY_REGROUP_CARD = Object.freeze({
  id: "mobility-regroup",
  kind: "character",
  rechargeTicks: 600,
  effect: 1,
  effectKey: "cardinal_reposition",
  exactCoreParity: false,
});

function clone(value) {
  return structuredClone(value);
}

function round(value) {
  return Number(value.toFixed(6));
}

function findSquad(battleState, squadId) {
  return battleState.squads.find((squad) => {
    return squad.id === squadId;
  });
}

function selectedCommander(battleState) {
  const squad = findSquad(
    battleState,
    battleState.selectedSquadId,
  );

  return (
    squad?.side === "ally" &&
    squad.aliveCount > 0
      ? squad
      : null
  );
}

function emptyCardLedger() {
  return {
    "mobility-regroup": {
      rechargeTicksLeft: 0,
      playCount: 0,
    },
  };
}

function createCardsByOwner(battleState) {
  return Object.fromEntries(
    battleState.squads
      .filter((squad) => squad.side === "ally")
      .map((squad) => [
        squad.id,
        emptyCardLedger(),
      ]),
  );
}

function commandDistanceCells(owner, target) {
  return (
    Math.abs(owner.center.x - target.center.x) +
    Math.abs(owner.center.z - target.center.z)
  ) / COMMANDER_CARD_RULES.worldGridStep;
}

function cardinalDirection(target, ground) {
  const deltaX = ground.x - target.center.x;
  const deltaZ = ground.z - target.center.z;

  if (Math.abs(deltaX) >= Math.abs(deltaZ)) {
    return deltaX >= 0
      ? { x: 1, z: 0, headingDeg: 90 }
      : { x: -1, z: 0, headingDeg: 270 };
  }

  return deltaZ >= 0
    ? { x: 0, z: 1, headingDeg: 0 }
    : { x: 0, z: -1, headingDeg: 180 };
}

function inArena(point) {
  return (
    Math.abs(point.x) <=
      COMMANDER_CARD_RULES.arenaLimit &&
    Math.abs(point.z) <=
      COMMANDER_CARD_RULES.arenaLimit
  );
}

function syncSquadFigures(squad) {
  const radians =
    (squad.headingDeg * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);

  for (const figure of squad.figures) {
    figure.x = round(
      squad.center.x +
        figure.localX * cosine +
        figure.localZ * sine,
    );
    figure.z = round(
      squad.center.z -
        figure.localX * sine +
        figure.localZ * cosine,
    );
  }
}

export function createCommanderCardState(battleState) {
  const cardsByOwner =
    createCardsByOwner(battleState);
  const ownerSquadId =
    selectedCommander(battleState)?.id ?? null;

  return {
    lastBattleTick: battleState.tick,
    lastBattleStatus: battleState.status,
    ownerSquadId,
    selectedCardId: null,
    cardsByOwner,
    cards: ownerSquadId
      ? cardsByOwner[ownerSquadId]
      : emptyCardLedger(),
    feedback: null,
  };
}

export function commanderCardOffering(
  cardState,
  battleState,
) {
  const owner = selectedCommander(battleState);

  if (
    !owner ||
    owner.id !== cardState.ownerSquadId
  ) {
    return [];
  }

  const ownerCards =
    cardState.cardsByOwner[owner.id];
  if (!ownerCards) {
    return [];
  }

  return [
    {
      ...MOBILITY_REGROUP_CARD,
      ownerSquadId: owner.id,
      rechargeTicksLeft:
        ownerCards["mobility-regroup"]
          .rechargeTicksLeft,
    },
  ];
}

export function selectCommanderCard(
  cardState,
  battleState,
  cardId,
) {
  const offered = commanderCardOffering(
    cardState,
    battleState,
  ).find((card) => card.id === cardId);

  if (!offered) {
    return {
      cardState,
      rejection: "card-unavailable",
    };
  }

  if (offered.rechargeTicksLeft > 0) {
    return {
      cardState,
      rejection: "card-recharging",
    };
  }

  return {
    cardState: {
      ...cardState,
      selectedCardId: cardId,
      feedback: null,
    },
    rejection: null,
  };
}

export function playSelectedCommanderCard(
  cardState,
  battleState,
  {
    targetSquadId,
    ground,
  },
) {
  if (battleState.status === "stopped") {
    return {
      cardState,
      battleState,
      rejection: "battle-stopped",
      effect: null,
    };
  }

  if (
    cardState.selectedCardId !==
    MOBILITY_REGROUP_CARD.id
  ) {
    return {
      cardState,
      battleState,
      rejection: "card-unavailable",
      effect: null,
    };
  }

  const target = findSquad(
    battleState,
    targetSquadId,
  );

  // Target validity is checked before owner availability so a selected
  // commander's own dead squad is reported as an invalid target rather
  // than obscured by the owner no longer being active.
  if (
    !target ||
    target.side !== "ally" ||
    target.aliveCount === 0
  ) {
    return {
      cardState,
      battleState,
      rejection: "card-invalid-target",
      effect: null,
    };
  }

  const owner = findSquad(
    battleState,
    cardState.ownerSquadId,
  );
  if (
    !owner ||
    owner.side !== "ally" ||
    owner.aliveCount === 0 ||
    battleState.selectedSquadId !== owner.id
  ) {
    return {
      cardState,
      battleState,
      rejection: "card-unavailable",
      effect: null,
    };
  }

  const ownerCards =
    cardState.cardsByOwner[owner.id];
  if (
    ownerCards["mobility-regroup"]
      .rechargeTicksLeft > 0
  ) {
    return {
      cardState,
      battleState,
      rejection: "card-recharging",
      effect: null,
    };
  }

  if (
    commandDistanceCells(owner, target) >
    COMMANDER_CARD_RULES.commandRadiusCells
  ) {
    return {
      cardState,
      battleState,
      rejection: "card-out-of-radius",
      effect: null,
    };
  }

  if (
    !Number.isFinite(ground?.x) ||
    !Number.isFinite(ground?.z)
  ) {
    return {
      cardState,
      battleState,
      rejection: "card-invalid-destination",
      effect: null,
    };
  }

  const direction = cardinalDirection(
    target,
    ground,
  );
  const destination = {
    x: round(
      target.center.x +
        direction.x *
          COMMANDER_CARD_RULES.worldGridStep,
    ),
    z: round(
      target.center.z +
        direction.z *
          COMMANDER_CARD_RULES.worldGridStep,
    ),
  };

  if (!inArena(destination)) {
    return {
      cardState,
      battleState,
      rejection: "card-destination-out-of-bounds",
      effect: null,
    };
  }

  const nextBattle = clone(battleState);
  const nextTarget = findSquad(
    nextBattle,
    targetSquadId,
  );
  nextTarget.center = destination;
  nextTarget.headingDeg = direction.headingDeg;
  syncSquadFigures(nextTarget);

  const nextCards = clone(cardState);
  const nextOwnerCards =
    nextCards.cardsByOwner[owner.id];
  nextOwnerCards["mobility-regroup"]
    .rechargeTicksLeft =
      MOBILITY_REGROUP_CARD.rechargeTicks;
  nextOwnerCards["mobility-regroup"].playCount += 1;
  nextCards.cards = nextOwnerCards;
  nextCards.selectedCardId = null;
  nextCards.feedback = {
    kind: "card-played",
    cardId: MOBILITY_REGROUP_CARD.id,
    ownerSquadId: owner.id,
    targetSquadId,
  };

  return {
    cardState: nextCards,
    battleState: nextBattle,
    rejection: null,
    effect: {
      kind: "cardinal-reposition",
      cardId: MOBILITY_REGROUP_CARD.id,
      ownerSquadId: owner.id,
      targetSquadId,
      headingDeg: direction.headingDeg,
    },
  };
}

export function syncCommanderCardState(
  cardState,
  battleState,
) {
  const resetTransition =
    battleState.status === "ready" &&
    cardState.lastBattleStatus !== "ready";

  if (
    battleState.tick < cardState.lastBattleTick ||
    resetTransition
  ) {
    return createCommanderCardState(battleState);
  }

  const next = clone(cardState);
  const elapsedTicks =
    battleState.tick - cardState.lastBattleTick;

  if (elapsedTicks > 0) {
    for (
      const ownerCards of
      Object.values(next.cardsByOwner)
    ) {
      const mobility =
        ownerCards["mobility-regroup"];
      mobility.rechargeTicksLeft = Math.max(
        0,
        mobility.rechargeTicksLeft -
          elapsedTicks,
      );
    }
  }

  const ownerSquadId =
    selectedCommander(battleState)?.id ?? null;
  if (ownerSquadId !== next.ownerSquadId) {
    next.selectedCardId = null;
    next.feedback = null;
  }

  next.lastBattleTick = battleState.tick;
  next.lastBattleStatus = battleState.status;
  next.ownerSquadId = ownerSquadId;
  next.cards = ownerSquadId
    ? next.cardsByOwner[ownerSquadId]
    : emptyCardLedger();
  return next;
}

export function commanderCardFingerprint(
  cardState,
  battleState,
) {
  return JSON.stringify({
    cardState,
    battleState,
  });
}
