const COMMIT = "de04a116bdf388cf9ecb9b9a0ad2ec79a025a139";
const RAW_ROOT =
  `https://raw.githubusercontent.com/islee23520/pilgrimage/${COMMIT}` +
  "/public/textures/characters/population/v23";

export const PILGRIMAGE_SOURCE = Object.freeze({
  repository: "https://github.com/islee23520/pilgrimage",
  commit: COMMIT,
  licenseStatus: "not-declared",
  localReviewOnly: true,
  shadowWalk: `${RAW_ROOT}/shadow-walk.png`,
  shadowIdle: `${RAW_ROOT}/shadow-idle.png`,
});

export const ROLE_AVATAR_ASSETS = Object.freeze({
  guard: Object.freeze({
    calling: "knight",
    walk: `${RAW_ROOT}/knight-walk.png`,
    idle: `${RAW_ROOT}/knight-idle.png`,
  }),
  assault: Object.freeze({
    calling: "peasant",
    walk: `${RAW_ROOT}/peasant-walk.png`,
    idle: `${RAW_ROOT}/peasant-idle.png`,
  }),
  archer: Object.freeze({
    calling: "friar",
    walk: `${RAW_ROOT}/friar-walk.png`,
    idle: `${RAW_ROOT}/friar-idle.png`,
  }),
});

export const DIRECTIONS = Object.freeze([
  "S",
  "SW",
  "W",
  "NW",
  "N",
  "NE",
  "E",
  "SE",
]);

export const ATLAS = Object.freeze({
  cellSize: 64,
  profileCount: 6,
  directionCount: 8,
  rows: 48,
  walkColumns: 20,
  idleColumns: 1,
  anchor: Object.freeze([32, 48.5]),
});

export const COMMANDER_WORLD_SIZE = 1.14;

export function commanderPresentation({
  squad,
  leader,
  index = 0,
}) {
  const ally = squad.side === "ally";

  return {
    id: `${squad.id}-commander`,
    squadId: squad.id,
    side: squad.side,
    role: squad.role,
    profile: index % ATLAS.profileCount,
    position: { ...squad.center },
    headingDeg: squad.headingDeg,
    visible: squad.aliveCount > 0,
    worldSize: COMMANDER_WORLD_SIZE,
    presentationOnly: true,
    name: ally
      ? leader?.name ?? squad.name.replace(/ 분대$/, "")
      : squad.name,
    banner: ally ? "아군 지휘" : "적군 지휘",
  };
}

export function normalizedAnchor() {
  return [
    ATLAS.anchor[0] / ATLAS.cellSize,
    1 - ATLAS.anchor[1] / ATLAS.cellSize,
  ];
}

export function validateAtlasDimensions(dimensions, clip) {
  const columns =
    clip === "walk"
      ? ATLAS.walkColumns
      : clip === "idle"
        ? ATLAS.idleColumns
        : 0;
  return (
    columns > 0 &&
    dimensions?.width === columns * ATLAS.cellSize &&
    dimensions?.height === ATLAS.rows * ATLAS.cellSize
  );
}

export function spriteRow(heading, cameraYaw) {
  const directionAngle = (Math.PI * 2) / ATLAS.directionCount;
  return (
    (Math.round((cameraYaw - heading) / directionAngle) %
      ATLAS.directionCount) +
    ATLAS.directionCount
  ) % ATLAS.directionCount;
}

export function spriteFrame(
  seconds,
  fps,
  moving = true,
  columns = ATLAS.walkColumns,
) {
  if (!moving) {
    return 0;
  }
  return (
    (Math.floor(seconds * fps) % columns) +
    columns
  ) % columns;
}

export function atlasCell({
  clip,
  profile,
  direction,
  frame,
}) {
  const columns =
    clip === "walk" ? ATLAS.walkColumns : ATLAS.idleColumns;
  const safeProfile =
    ((Math.floor(profile) % ATLAS.profileCount) + ATLAS.profileCount) %
    ATLAS.profileCount;
  const safeDirection =
    ((Math.floor(direction) % ATLAS.directionCount) +
      ATLAS.directionCount) %
    ATLAS.directionCount;
  const safeFrame =
    ((Math.floor(frame) % columns) + columns) % columns;
  const row = safeProfile * ATLAS.directionCount + safeDirection;

  return {
    columns,
    rows: ATLAS.rows,
    row,
    frame: safeFrame,
    repeat: [1 / columns, 1 / ATLAS.rows],
    offset: [
      safeFrame / columns,
      (ATLAS.rows - 1 - row) / ATLAS.rows,
    ],
    mirrored: false,
  };
}

export function avatarLayers({
  role,
  clip,
  profile,
  direction,
  frame,
}) {
  const assets = ROLE_AVATAR_ASSETS[role];
  if (!assets) {
    throw new RangeError(`알 수 없는 아바타 역할: ${role}`);
  }

  const cell = atlasCell({
    clip,
    profile,
    direction,
    frame,
  });
  const center = normalizedAnchor();

  return [
    {
      kind: "shadow",
      url:
        clip === "walk"
          ? PILGRIMAGE_SOURCE.shadowWalk
          : PILGRIMAGE_SOURCE.shadowIdle,
      renderOrder: 0,
      cell,
      center,
      filter: "nearest",
      generateMipmaps: false,
    },
    {
      kind: "body",
      url: clip === "walk" ? assets.walk : assets.idle,
      renderOrder: 1,
      cell,
      center,
      filter: "nearest",
      generateMipmaps: false,
    },
  ];
}

export function resolveAvatarClip({ moving, attacking }) {
  if (moving) {
    return {
      clip: "walk",
      unsupportedAction: attacking ? "attack" : null,
    };
  }
  return {
    clip: "idle",
    unsupportedAction: attacking ? "attack" : null,
  };
}
