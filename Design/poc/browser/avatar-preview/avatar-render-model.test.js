import test from "node:test";
import assert from "node:assert/strict";

import {
  UNITS,
  createInitialState,
} from "../formation-editor/formation-model.js";
import {
  createSquadBattleState,
} from "../battle-preview/battle-model.js";
import {
  ATLAS,
  COMMANDER_WORLD_SIZE,
  DIRECTIONS,
  PILGRIMAGE_SOURCE,
  ROLE_AVATAR_ASSETS,
  atlasCell,
  avatarLayers,
  commanderPresentation,
  normalizedAnchor,
  resolveAvatarClip,
  spriteFrame,
  spriteRow,
  validateAtlasDimensions,
} from "./avatar-render-model.js";

test("권위 fork SHA와 최소 8개 로컬 검토 asset을 고정한다", () => {
  assert.equal(
    PILGRIMAGE_SOURCE.commit,
    "de04a116bdf388cf9ecb9b9a0ad2ec79a025a139",
  );
  assert.equal(
    PILGRIMAGE_SOURCE.repository,
    "https://github.com/islee23520/pilgrimage",
  );
  assert.equal(PILGRIMAGE_SOURCE.licenseStatus, "not-declared");
  assert.equal(PILGRIMAGE_SOURCE.localReviewOnly, true);

  const bodyUrls = Object.values(ROLE_AVATAR_ASSETS).flatMap((asset) => {
    return [asset.walk, asset.idle];
  });
  const allUrls = [
    ...bodyUrls,
    PILGRIMAGE_SOURCE.shadowWalk,
    PILGRIMAGE_SOURCE.shadowIdle,
  ];

  assert.equal(allUrls.length, 8);
  assert.equal(new Set(allUrls).size, 8);
  assert.ok(
    allUrls.every((url) => {
      return url.includes(PILGRIMAGE_SOURCE.commit);
    }),
  );
});

test("v23 population atlas의 frame layout과 foot anchor를 해석한다", () => {
  assert.deepEqual(DIRECTIONS, [
    "S",
    "SW",
    "W",
    "NW",
    "N",
    "NE",
    "E",
    "SE",
  ]);
  assert.equal(ATLAS.cellSize, 64);
  assert.equal(ATLAS.profileCount, 6);
  assert.equal(ATLAS.directionCount, 8);
  assert.equal(ATLAS.rows, 48);
  assert.equal(ATLAS.walkColumns, 20);
  assert.equal(ATLAS.idleColumns, 1);
  assert.deepEqual(ATLAS.anchor, [32, 48.5]);
  assert.deepEqual(normalizedAnchor(), [0.5, 0.2421875]);

  assert.equal(
    validateAtlasDimensions(
      { width: 1280, height: 3072 },
      "walk",
    ),
    true,
  );
  assert.equal(
    validateAtlasDimensions(
      { width: 64, height: 3072 },
      "idle",
    ),
    true,
  );
  assert.equal(
    validateAtlasDimensions(
      { width: 256, height: 512 },
      "walk",
    ),
    false,
  );
});

test("world heading을 camera-relative 8방향 row로 변환하며 mirror하지 않는다", () => {
  const yaw = Math.PI / 4;

  assert.equal(spriteRow(yaw, yaw), 0);
  assert.equal(spriteRow(0, yaw), 1);
  assert.equal(spriteRow(-Math.PI / 4, yaw), 2);
  assert.equal(spriteRow(Math.PI, yaw), 5);
  assert.equal(spriteRow(4 * Math.PI, 0), 0);
  assert.equal(spriteRow(0, -Math.PI / 4), 7);
});

test("profile·direction·frame을 정확한 atlas repeat/offset으로 자른다", () => {
  assert.deepEqual(
    atlasCell({
      clip: "walk",
      profile: 2,
      direction: 6,
      frame: 7,
    }),
    {
      columns: 20,
      rows: 48,
      row: 22,
      frame: 7,
      repeat: [0.05, 1 / 48],
      offset: [0.35, 25 / 48],
      mirrored: false,
    },
  );

  assert.deepEqual(
    atlasCell({
      clip: "idle",
      profile: 5,
      direction: 7,
      frame: 9,
    }),
    {
      columns: 1,
      rows: 48,
      row: 47,
      frame: 0,
      repeat: [1, 1 / 48],
      offset: [0, 0],
      mirrored: false,
    },
  );
});

test("body와 shadow layer는 같은 cell·anchor를 공유하고 shadow가 먼저 렌더된다", () => {
  const layers = avatarLayers({
    role: "guard",
    clip: "walk",
    profile: 1,
    direction: 3,
    frame: 11,
  });

  assert.equal(layers.length, 2);
  assert.deepEqual(
    layers.map((layer) => layer.kind),
    ["shadow", "body"],
  );
  assert.deepEqual(
    layers.map((layer) => layer.renderOrder),
    [0, 1],
  );
  assert.deepEqual(layers[0].cell, layers[1].cell);
  assert.deepEqual(layers[0].center, normalizedAnchor());
  assert.deepEqual(layers[1].center, normalizedAnchor());
  assert.equal(layers[0].filter, "nearest");
  assert.equal(layers[1].filter, "nearest");
  assert.equal(layers[0].generateMipmaps, false);
  assert.equal(layers[1].generateMipmaps, false);
});

test("idle과 walk만 사용하고 공격 전용 clip은 지원한다고 가장하지 않는다", () => {
  assert.deepEqual(resolveAvatarClip({ moving: false, attacking: false }), {
    clip: "idle",
    unsupportedAction: null,
  });
  assert.deepEqual(resolveAvatarClip({ moving: true, attacking: false }), {
    clip: "walk",
    unsupportedAction: null,
  });
  assert.deepEqual(resolveAvatarClip({ moving: false, attacking: true }), {
    clip: "idle",
    unsupportedAction: "attack",
  });

  assert.equal(spriteFrame(0, 18, true), 0);
  assert.equal(spriteFrame(1.01 / 18, 18, true), 1);
  assert.equal(spriteFrame(20.01 / 18, 18, true), 0);
  assert.equal(spriteFrame(12, 18, false), 0);
});

test("각 분대 중심에 전투 모델 밖의 지휘관 표현 하나를 배치한다", () => {
  const state = createSquadBattleState({
    formation: createInitialState().pending,
    seed: 2409,
  });
  const leaderById = new Map(UNITS.map((unit) => [unit.id, unit]));
  const commanders = state.squads.map((squad, index) => {
    return commanderPresentation({
      squad,
      leader: leaderById.get(squad.leaderUnitId),
      index,
    });
  });

  assert.equal(state.squads.length, 12);
  assert.equal(
    state.squads.reduce((total, squad) => {
      return total + squad.figures.length;
    }, 0),
    48,
    "지휘관 표현이 4명 전투 분대의 combat figure 수를 늘리면 안 된다.",
  );
  assert.ok(
    state.squads.every((squad) => squad.figures.length === 4),
  );

  assert.equal(commanders.length, 12);
  assert.equal(
    new Set(commanders.map((commander) => commander.id)).size,
    12,
  );
  assert.ok(
    commanders.every((commander) => commander.presentationOnly),
    "지휘관은 HP·공격·사상자 계산에 참여하지 않는 표현이어야 한다.",
  );
  assert.ok(
    commanders.every((commander) => commander.worldSize > 0.94),
    "지휘관 실제 character sprite는 일반 병사보다 적당히 커야 한다.",
  );

  for (const [index, commander] of commanders.entries()) {
    const squad = state.squads[index];

    assert.equal(commander.squadId, squad.id);
    assert.deepEqual(commander.position, squad.center);
    assert.equal(commander.headingDeg, squad.headingDeg);
    assert.equal(commander.visible, squad.aliveCount > 0);
    assert.equal(commander.side, squad.side);
    assert.equal(commander.role, squad.role);
    assert.ok(
      commander.banner.length > 0,
      "각 지휘관은 식별 가능한 side banner를 가져야 한다.",
    );
  }
});

test("지휘관 표현은 현재 분대 중심·정면·생존 상태를 매번 다시 읽고 Reset 원점을 복원한다", () => {
  const initialState = createSquadBattleState({
    formation: createInitialState().pending,
    seed: 2409,
  });
  const initialSquad = initialState.squads[0];
  const leader = UNITS.find((unit) => {
    return unit.id === initialSquad.leaderUnitId;
  });
  const initial = commanderPresentation({
    squad: initialSquad,
    leader,
    index: 0,
  });
  const changedSquad = {
    ...initialSquad,
    center: {
      x: initialSquad.center.x + 1.25,
      z: initialSquad.center.z - 0.5,
    },
    headingDeg: 90,
    aliveCount: 0,
  };
  const changed = commanderPresentation({
    squad: changedSquad,
    leader,
    index: 0,
  });
  const resetState = createSquadBattleState({
    formation: createInitialState().pending,
    seed: 2409,
  });
  const reset = commanderPresentation({
    squad: resetState.squads[0],
    leader,
    index: 0,
  });

  assert.deepEqual(changed.position, changedSquad.center);
  assert.equal(changed.headingDeg, 90);
  assert.equal(changed.visible, false);
  assert.deepEqual(reset.position, initial.position);
  assert.equal(reset.headingDeg, initial.headingDeg);
  assert.equal(reset.visible, true);
});
