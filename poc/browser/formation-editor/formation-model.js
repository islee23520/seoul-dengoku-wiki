export const ROWS = Object.freeze(["front", "middle", "rear"]);
export const COLUMNS = Object.freeze(["left", "center", "right"]);
export const SLOT_IDS = Object.freeze(
  ROWS.flatMap((row) => COLUMNS.map((column) => `${row}-${column}`)),
);

export const UNITS = Object.freeze([
  {
    id: "ally-guard-1",
    name: "서윤",
    role: "guard",
    roleLabel: "근위",
    callSign: "방벽 01",
  },
  {
    id: "ally-guard-2",
    name: "민재",
    role: "guard",
    roleLabel: "근위",
    callSign: "방벽 02",
  },
  {
    id: "ally-assault-1",
    name: "하린",
    role: "assault",
    roleLabel: "돌격",
    callSign: "쇄도 01",
  },
  {
    id: "ally-assault-2",
    name: "도윤",
    role: "assault",
    roleLabel: "돌격",
    callSign: "쇄도 02",
  },
  {
    id: "ally-archer-1",
    name: "지우",
    role: "archer",
    roleLabel: "궁수",
    callSign: "조준 01",
  },
  {
    id: "ally-archer-2",
    name: "은호",
    role: "archer",
    roleLabel: "궁수",
    callSign: "조준 02",
  },
]);

const UNIT_IDS = new Set(UNITS.map((unit) => unit.id));
const SLOT_ID_SET = new Set(SLOT_IDS);

const INITIAL_PLACEMENTS = Object.freeze({
  "front-left": "ally-guard-1",
  "front-center": "ally-assault-1",
  "front-right": "ally-guard-2",
  "middle-center": "ally-assault-2",
  "rear-left": "ally-archer-1",
  "rear-right": "ally-archer-2",
});

export function assertFormation(placements) {
  const entries = Object.entries(placements);
  if (entries.length !== UNITS.length) {
    throw new Error(`배치 인원은 정확히 ${UNITS.length}명이어야 합니다.`);
  }

  for (const [slotId, unitId] of entries) {
    if (!SLOT_ID_SET.has(slotId)) {
      throw new Error(`알 수 없는 진형 슬롯: ${slotId}`);
    }
    if (!UNIT_IDS.has(unitId)) {
      throw new Error(`알 수 없는 유닛: ${unitId}`);
    }
  }

  const placedUnits = new Set(entries.map(([, unitId]) => unitId));
  if (placedUnits.size !== UNITS.length) {
    throw new Error("한 유닛을 둘 이상의 슬롯에 배치할 수 없습니다.");
  }

  for (const unitId of UNIT_IDS) {
    if (!placedUnits.has(unitId)) {
      throw new Error(`배치되지 않은 유닛: ${unitId}`);
    }
  }

  return true;
}

export function createInitialState() {
  const pending = { ...INITIAL_PLACEMENTS };
  assertFormation(pending);
  return {
    pending,
    confirmed: null,
    selectedUnitId: UNITS[0].id,
    selectedSlotId: getUnitSlot(pending, UNITS[0].id),
    locked: false,
  };
}

export function getUnitSlot(placements, unitId) {
  return (
    Object.entries(placements).find(([, placedUnitId]) => {
      return placedUnitId === unitId;
    })?.[0] ?? null
  );
}

export function selectUnit(state, unitId) {
  if (state.locked) {
    return state;
  }
  if (!UNIT_IDS.has(unitId)) {
    throw new RangeError(`알 수 없는 유닛: ${unitId}`);
  }

  return {
    ...state,
    selectedUnitId: unitId,
    selectedSlotId: getUnitSlot(state.pending, unitId),
  };
}

export function moveUnit(state, unitId, destinationSlotId) {
  if (state.locked) {
    return state;
  }
  if (!UNIT_IDS.has(unitId)) {
    throw new RangeError(`알 수 없는 유닛: ${unitId}`);
  }
  if (!SLOT_ID_SET.has(destinationSlotId)) {
    throw new RangeError(`알 수 없는 진형 슬롯: ${destinationSlotId}`);
  }

  const sourceSlotId = getUnitSlot(state.pending, unitId);
  if (!sourceSlotId) {
    throw new Error(`현재 진형에 없는 유닛: ${unitId}`);
  }

  if (sourceSlotId === destinationSlotId) {
    return {
      ...state,
      selectedUnitId: unitId,
      selectedSlotId: destinationSlotId,
    };
  }

  const nextPlacements = { ...state.pending };
  const displacedUnitId = nextPlacements[destinationSlotId];

  nextPlacements[destinationSlotId] = unitId;
  if (displacedUnitId) {
    nextPlacements[sourceSlotId] = displacedUnitId;
  } else {
    delete nextPlacements[sourceSlotId];
  }

  assertFormation(nextPlacements);

  return {
    ...state,
    pending: nextPlacements,
    selectedUnitId: unitId,
    selectedSlotId: destinationSlotId,
  };
}

export function confirmFormation(state) {
  if (state.locked) {
    return state;
  }
  assertFormation(state.pending);

  return {
    ...state,
    confirmed: { ...state.pending },
    locked: true,
  };
}

export function editFormation(state) {
  if (!state.locked) {
    return state;
  }
  return {
    ...state,
    locked: false,
  };
}

export function resetFormation() {
  return createInitialState();
}
