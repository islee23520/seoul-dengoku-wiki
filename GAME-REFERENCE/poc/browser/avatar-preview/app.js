import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import {
  UNITS,
  assertFormation,
  createInitialState,
} from "../formation-editor/formation-model.js";
import {
  advanceBattleFrame,
  createSquadBattleState,
  issueAttackOrder,
  issueMoveOrder,
  resetBattle,
  selectSquad,
  setBattlePaused,
  startBattle,
} from "../battle-preview/battle-model.js";
import {
  ATLAS,
  COMMANDER_WORLD_SIZE,
  DIRECTIONS,
  PILGRIMAGE_SOURCE,
  ROLE_AVATAR_ASSETS,
  atlasCell,
  commanderPresentation,
  normalizedAnchor,
  resolveAvatarClip,
  spriteFrame,
  spriteRow,
  validateAtlasDimensions,
} from "./avatar-render-model.js";
import {
  MOBILITY_REGROUP_CARD,
  commanderCardOffering,
  createCommanderCardState,
  playSelectedCommanderCard,
  selectCommanderCard,
  syncCommanderCardState,
} from "./avatar-command-card-model.js";

const FORMATION_STORAGE_KEY = "janseon.review.formation.v1";
const DEFAULT_SEED = 2409;
const AVATAR_FPS = 18;
const AVATAR_WORLD_SIZE = 0.94;
const CAMERA_ZOOM_MIN = 0.72;
const CAMERA_ZOOM_MAX = 1.75;
const CAMERA_ZOOM_STEP = 0.1;

const leaderById = new Map(UNITS.map((unit) => [unit.id, unit]));
const allyButtons = new Map();
const avatarViews = [];
const commanderViews = [];
const pickableBodies = [];

const viewport = document.querySelector("#avatar-viewport");
const bootStatus = document.querySelector("#boot-status");
const stateChip = document.querySelector("#state-chip");
const battleStatus = document.querySelector("#battle-status");
const atlasStatus = document.querySelector("#atlas-status");
const startAction = document.querySelector("#start-action");
const pauseAction = document.querySelector("#pause-action");
const resetAction = document.querySelector("#reset-action");
const allyList = document.querySelector("#ally-squad-list");
const selectedRole = document.querySelector("#selected-role");
const selectedSource = document.querySelector("#selected-source");
const selectedTitle = document.querySelector("#selected-title");
const selectedClip = document.querySelector("#selected-clip");
const selectedDirection = document.querySelector("#selected-direction");
const selectedFrame = document.querySelector("#selected-frame");
const selectedProfile = document.querySelector("#selected-profile");
const selectedAlive = document.querySelector("#selected-alive");
const shadowToggle = document.querySelector("#shadow-toggle");
const scaleSelect = document.querySelector("#scale-select");
const zoomInAction = document.querySelector("#zoom-in-action");
const zoomOutAction = document.querySelector("#zoom-out-action");
const zoomResetAction = document.querySelector("#zoom-reset-action");
const zoomValue = document.querySelector("#zoom-value");
const notice = document.querySelector("#notice");
const cardOwner = document.querySelector("#card-owner");
const cardOwnerPortrait = document.querySelector("#card-owner-portrait");
const cardCancelAction = document.querySelector("#card-cancel-action");
const mobilityCardAction = document.querySelector(
  "#mobility-card-action",
);
const mobilityCardCooldown = document.querySelector(
  "#mobility-card-cooldown",
);
const mobilityCardFill = document.querySelector(
  "#mobility-card-fill",
);
const cardFeedback = document.querySelector(
  "#card-feedback",
);

function loadFormation() {
  const raw = sessionStorage.getItem(FORMATION_STORAGE_KEY);
  if (raw) {
    try {
      const formation = JSON.parse(raw);
      assertFormation(formation);
      return formation;
    } catch {
      // 승인 기본 진형으로 닫힌 복구를 한다.
    }
  }
  return createInitialState().pending;
}

let state = createSquadBattleState({
  formation: loadFormation(),
  seed: DEFAULT_SEED,
});
let cardState = createCommanderCardState(state);
let cardTargetSquadId = null;
let cardHoverGround = null;
let portraitOwnerId = null;
let cardFeedbackMessage =
  "카드를 선택한 뒤 아군 분대와 이동 방향을 차례로 지정합니다.";
let cardEffectAgeMs = null;
let hoveredSquadId = null;
let lastFrameTime = performance.now();
let animationSeconds = 0;
let avatarScale = 1;
let statusMessage =
  "6개 프로필과 8방향 row를 실제 atlas에서 선택합니다.";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b121b);
scene.fog = new THREE.Fog(0x0b121b, 18, 34);

const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 80);
const azimuth = THREE.MathUtils.degToRad(45);
const elevation = THREE.MathUtils.degToRad(35.264);
const radius = 18;
const horizontalRadius = Math.cos(elevation) * radius;
camera.position.set(
  Math.cos(azimuth) * horizontalRadius,
  Math.sin(elevation) * radius,
  Math.sin(azimuth) * horizontalRadius,
);
camera.lookAt(0, 0.45, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: "high-performance",
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.dataset.renderer = "webgl-avatar-atlas";
renderer.domElement.setAttribute(
  "aria-label",
  "Pilgrimage atlas 방식의 전투 병사 48명과 분대 지휘관 표현 12명이 있는 Three.js 분대 장면",
);
viewport.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xc7d7dd, 0x17110e, 1.45));

const keyLight = new THREE.DirectionalLight(0xdbe8ec, 1.9);
keyLight.position.set(4, 11, 6);
scene.add(keyLight);

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.9,
    metalness: options.metalness ?? 0.05,
  });
}

function box(size, position, color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    material(color),
  );
  mesh.position.set(...position);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function makeLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "rgba(8,13,20,.92)";
  context.fillRect(8, 16, 496, 96);
  context.strokeStyle = "#45546b";
  context.lineWidth = 4;
  context.strokeRect(8, 16, 496, 96);
  context.fillStyle = "#e6eaf0";
  context.font =
    '600 42px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 65);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.renderOrder = 20;
  return sprite;
}

function makeCommanderBanner(commander) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const sideColor =
    commander.side === "ally" ? "#39769c" : "#984b43";

  context.fillStyle = "rgba(8,13,20,.94)";
  context.fillRect(4, 4, 376, 120);
  context.strokeStyle = "#d6b139";
  context.lineWidth = 4;
  context.strokeRect(4, 4, 376, 120);
  context.fillStyle = sideColor;
  context.fillRect(4, 4, 376, 38);

  context.save();
  context.translate(27, 23);
  context.rotate(Math.PI / 4);
  context.fillStyle = "#f2d56c";
  context.fillRect(-8, -8, 16, 16);
  context.restore();

  context.fillStyle = "#f4f7fa";
  context.font =
    '700 21px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(commander.banner, 49, 23);

  context.font =
    '700 31px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  context.textAlign = "center";
  context.fillText(commander.name, 192, 82);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  const banner = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  banner.renderOrder = 12;
  banner.position.set(0, 1.12, 0);
  banner.scale.set(1.05, 0.35, 1);
  banner.userData.squadId = commander.squadId;
  return banner;
}

function buildPlatform() {
  box([12.5, 0.48, 11.7], [0, -0.27, 0], 0x30363a);
  for (let x = -5.25; x <= 5.25; x += 1.5) {
    box([0.025, 0.016, 11.2], [x, -0.01, 0], 0x444b4f);
  }
  for (let z = -5.25; z <= 5.25; z += 1.5) {
    box([12, 0.018, 0.025], [0, -0.005, z], 0x444b4f);
  }
  box([12, 0.04, 0.25], [0, 0.01, -5.18], 0xb49325);
  box([13.5, 0.18, 1.8], [0, -0.55, -6.1], 0x15191c);
  box([12.8, 3.7, 0.24], [0, 1.45, -6.85], 0x20282d);
  for (const x of [-4.7, 0, 4.7]) {
    box([0.34, 3.5, 0.34], [x, 1.5, -0.7], 0x4b5152);
  }
  box([1.45, 0.16, 0.48], [-4.05, 0.4, 3.4], 0x3b4448);
  box([1.45, 0.16, 0.48], [4.05, 0.4, 3.4], 0x3b4448);

  const sign = box([3.2, 0.72, 0.12], [2.15, 2.72, -1.55], 0x263d51);
  const label = makeLabel("영등포 동측 승강장");
  label.position.set(0, 0, 0.08);
  label.scale.set(2.7, 0.66, 1);
  sign.add(label);
}

buildPlatform();

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 11),
  new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0.04;
scene.add(ground);

const selectionRing = new THREE.Mesh(
  new THREE.RingGeometry(0.72, 0.8, 28),
  new THREE.MeshBasicMaterial({
    color: 0xd6b139,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  }),
);
selectionRing.rotation.x = -Math.PI / 2;
selectionRing.position.y = 0.055;
scene.add(selectionRing);

const cardEffectRing = new THREE.Mesh(
  new THREE.RingGeometry(0.88, 1.02, 32),
  new THREE.MeshBasicMaterial({
    color: 0x62b7e4,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
);
cardEffectRing.rotation.x = -Math.PI / 2;
cardEffectRing.position.y = 0.065;
cardEffectRing.visible = false;
scene.add(cardEffectRing);

const cardDirectionViews = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
].map((direction, index) => {
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(direction.x, 0, direction.z),
    new THREE.Vector3(),
    1.2,
    0x86bed0,
    0.35,
    0.22,
  );
  arrow.name = `card-direction-${index}`;
  arrow.visible = false;
  scene.add(arrow);
  return { direction, arrow };
});

const cardTargetViews = state.squads
  .filter((squad) => squad.side === "ally")
  .map((squad) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.7, 28),
      new THREE.MeshBasicMaterial({
        color: 0x86bed0,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    scene.add(ring);
    return { squadId: squad.id, ring };
  });

const sourceUrls = [
  ...Object.values(ROLE_AVATAR_ASSETS).flatMap((entry) => [
    entry.walk,
    entry.idle,
  ]),
  PILGRIMAGE_SOURCE.shadowWalk,
  PILGRIMAGE_SOURCE.shadowIdle,
];

const loader = new THREE.TextureLoader();
loader.setCrossOrigin("anonymous");

function loadTexture(url) {
  return loader.loadAsync(url).then((texture) => {
    const image = texture.image;
    const clip = url.includes("-walk.png") ? "walk" : "idle";
    if (
      !validateAtlasDimensions(
        { width: image.width, height: image.height },
        clip,
      )
    ) {
      throw new Error(
        `${clip} atlas 크기 불일치: ${image.width}×${image.height}`,
      );
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  });
}

const sourceTextures = new Map(
  await Promise.all(
    sourceUrls.map(async (url) => [url, await loadTexture(url)]),
  ),
);

function avatarTexture(url) {
  const texture = sourceTextures.get(url).clone();
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function createAvatar(squad, figure, profile, index) {
  const assets = ROLE_AVATAR_ASSETS[squad.role];
  const textures = {
    body: {
      walk: avatarTexture(assets.walk),
      idle: avatarTexture(assets.idle),
    },
    shadow: {
      walk: avatarTexture(PILGRIMAGE_SOURCE.shadowWalk),
      idle: avatarTexture(PILGRIMAGE_SOURCE.shadowIdle),
    },
  };

  const anchor = normalizedAnchor();
  const root = new THREE.Group();
  root.userData.avatarIndex = index;
  root.userData.squadId = squad.id;
  root.userData.figureId = figure.id;

  const shadowMaterial = new THREE.SpriteMaterial({
    map: textures.shadow.idle,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const shadow = new THREE.Sprite(shadowMaterial);
  shadow.center.set(...anchor);
  shadow.renderOrder = 0;
  root.add(shadow);

  const bodyMaterial = new THREE.SpriteMaterial({
    map: textures.body.idle,
    alphaTest: 0.5,
    transparent: false,
    toneMapped: false,
  });
  const body = new THREE.Sprite(bodyMaterial);
  body.center.set(...anchor);
  body.renderOrder = 1;
  body.userData.squadId = squad.id;
  root.add(body);
  pickableBodies.push(body);

  const view = {
    root,
    shadow,
    body,
    materials: { shadow: shadowMaterial, body: bodyMaterial },
    textures,
    profile,
    squadId: squad.id,
    figureId: figure.id,
    phase: (index % 20) / 20,
    lastTick: state.tick,
    lastX: figure.x,
    lastZ: figure.z,
    moving: false,
    telemetry: {
      clip: "idle",
      unsupportedAction: null,
      direction: 0,
      frame: 0,
      profile,
    },
  };

  scene.add(root);
  avatarViews.push(view);
}

function createCommander(squad, index) {
  const commander = commanderPresentation({
    squad,
    leader: leaderById.get(squad.leaderUnitId),
    index,
  });
  const assets = ROLE_AVATAR_ASSETS[commander.role];
  const textures = {
    body: {
      walk: avatarTexture(assets.walk),
      idle: avatarTexture(assets.idle),
    },
    shadow: {
      walk: avatarTexture(PILGRIMAGE_SOURCE.shadowWalk),
      idle: avatarTexture(PILGRIMAGE_SOURCE.shadowIdle),
    },
  };
  const anchor = normalizedAnchor();
  const root = new THREE.Group();
  root.userData.commanderId = commander.id;
  root.userData.squadId = commander.squadId;

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.36, 0.45, 4),
    new THREE.MeshBasicMaterial({
      color: commander.side === "ally" ? 0x55a5d1 : 0xcf6258,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.rotation.z = Math.PI / 4;
  marker.position.y = 0.014;
  marker.renderOrder = 2;
  root.add(marker);

  const shadowMaterial = new THREE.SpriteMaterial({
    map: textures.shadow.idle,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const shadow = new THREE.Sprite(shadowMaterial);
  shadow.center.set(...anchor);
  shadow.renderOrder = 3;
  root.add(shadow);

  const bodyMaterial = new THREE.SpriteMaterial({
    map: textures.body.idle,
    alphaTest: 0.5,
    transparent: false,
    toneMapped: false,
  });
  const body = new THREE.Sprite(bodyMaterial);
  body.center.set(...anchor);
  body.renderOrder = 4;
  body.userData.squadId = commander.squadId;
  body.userData.commanderId = commander.id;
  root.add(body);

  const banner = makeCommanderBanner(commander);
  root.add(banner);
  pickableBodies.push(body);

  scene.add(root);
  commanderViews.push({
    root,
    marker,
    shadow,
    body,
    banner,
    materials: {
      shadow: shadowMaterial,
      body: bodyMaterial,
    },
    textures,
    id: commander.id,
    squadId: commander.squadId,
    side: commander.side,
    name: commander.name,
    bannerText: commander.banner,
    profile: commander.profile,
    phase: ((index + 7) % 20) / 20,
    lastTick: state.tick,
    lastX: squad.center.x,
    lastZ: squad.center.z,
    moving: false,
    telemetry: {
      clip: "idle",
      unsupportedAction: null,
      direction: 0,
      frame: 0,
      profile: commander.profile,
    },
  });
}

let avatarIndex = 0;
for (const squad of state.squads) {
  for (const figure of squad.figures) {
    createAvatar(squad, figure, avatarIndex % ATLAS.profileCount, avatarIndex);
    avatarIndex += 1;
  }
}
state.squads.forEach(createCommander);

atlasStatus.textContent = "8 PNG · 병사 48 + 지휘관 12 준비";
bootStatus.classList.add("is-ready");

function selectedSquad() {
  return state.squads.find((squad) => {
    return squad.id === state.selectedSquadId;
  });
}

function syncCardOwner() {
  cardState = syncCommanderCardState(
    cardState,
    state,
  );
  cardTargetSquadId = null;
}

function selectAllySquad(squadId) {
  state = selectSquad(state, squadId);
  syncCardOwner();
  cardHoverGround = null;
  cardFeedbackMessage = "지휘관의 카드를 선택하세요.";
}

function cancelCardSelection() {
  cardState = { ...cardState, selectedCardId: null, feedback: null };
  cardTargetSquadId = null;
  cardHoverGround = null;
  cardFeedbackMessage = "카드 지정을 취소했습니다. 재사용 대기시간은 소모하지 않습니다.";
  syncUi();
}

cardCancelAction.addEventListener("click", cancelCardSelection);

function cardTargetRejection(target) {
  const preview = playSelectedCommanderCard(cardState, state, {
    targetSquadId: target.id,
    ground: target.center,
  });
  // A boundary rejection concerns direction, not the ally's eligibility.
  return preview.rejection === "card-destination-out-of-bounds"
    ? null
    : preview.rejection;
}

function syncCardTargetPreview() {
  const active = Boolean(cardState.selectedCardId) && state.status !== "stopped";
  for (const view of cardTargetViews) {
    const squad = state.squads.find((entry) => entry.id === view.squadId);
    view.ring.visible = active && !cardTargetRejection(squad);
    view.ring.position.set(squad.center.x, 0.075, squad.center.z);
    view.ring.material.color.setHex(
      squad.id === cardTargetSquadId ? 0xffe49b : 0x86bed0,
    );
  }
  const target = active
    ? state.squads.find((entry) => entry.id === cardTargetSquadId)
    : null;
  const hovered = target && cardHoverGround
    ? playSelectedCommanderCard(cardState, state, {
        targetSquadId: target.id,
        ground: cardHoverGround,
      })
    : null;
  for (const view of cardDirectionViews) {
    view.arrow.visible = Boolean(target);
    if (!target) continue;
    const preview = playSelectedCommanderCard(cardState, state, {
      targetSquadId: target.id,
      ground: {
        x: target.center.x + view.direction.x,
        z: target.center.z + view.direction.z,
      },
    });
    const highlighted = !preview.rejection && !hovered?.rejection &&
      hovered?.effect?.headingDeg === preview.effect.headingDeg;
    view.arrow.position.set(target.center.x, 0.14, target.center.z);
    view.arrow.setColor(
      preview.rejection ? 0xcf6258 : highlighted ? 0xffe49b : 0x86bed0,
    );
    view.arrow.setLength(highlighted ? 1.45 : 1.2, 0.35, 0.22);
  }
}

function cardRejectionMessage(rejection) {
  return {
    "battle-stopped":
      "종료된 전투에서는 카드를 사용할 수 없습니다.",
    "card-unavailable":
      "현재 지휘관이 사용할 수 없는 카드입니다.",
    "card-recharging":
      "기동 재집결이 아직 재충전 중입니다.",
    "card-invalid-target":
      "생존 아군 분대만 카드 대상으로 지정할 수 있습니다.",
    "card-out-of-radius":
      "대상이 지휘관의 3칸 지휘 범위 밖에 있습니다.",
    "card-invalid-destination":
      "유효한 이동 방향을 지정해야 합니다.",
    "card-destination-out-of-bounds":
      "전장 경계 밖으로 재집결할 수 없습니다.",
  }[rejection] ?? "카드 명령을 적용할 수 없습니다.";
}

function triggerCardEffect(squadId) {
  const squad = state.squads.find((candidate) => {
    return candidate.id === squadId;
  });
  cardEffectRing.position.x = squad.center.x;
  cardEffectRing.position.z = squad.center.z;
  cardEffectAgeMs = 0;
  cardEffectRing.visible = true;
}

function syncCardEffect(elapsed) {
  if (cardEffectAgeMs === null) {
    cardEffectRing.visible = false;
    return;
  }
  if (!state.paused) {
    cardEffectAgeMs += Math.min(elapsed, 100);
  }
  const progress = Math.min(
    1,
    cardEffectAgeMs / 900,
  );
  cardEffectRing.scale.setScalar(
    0.72 + progress * 0.58,
  );
  cardEffectRing.material.opacity =
    0.9 * (1 - progress);
  if (progress >= 1) {
    cardEffectAgeMs = null;
    cardEffectRing.visible = false;
  }
}

function configureTexture(texture, cell) {
  texture.repeat.set(...cell.repeat);
  texture.offset.set(...cell.offset);
  texture.needsUpdate = true;
}

function syncAvatars() {
  const cameraYaw = Math.atan2(
    camera.matrixWorld.elements[8],
    camera.matrixWorld.elements[10],
  );

  for (const view of avatarViews) {
    const squad = state.squads.find((candidate) => {
      return candidate.id === view.squadId;
    });
    const figure = squad.figures.find((candidate) => {
      return candidate.id === view.figureId;
    });

    if (!state.paused && state.tick !== view.lastTick) {
      view.moving =
        Math.hypot(figure.x - view.lastX, figure.z - view.lastZ) > 0.00001;
      view.lastTick = state.tick;
      view.lastX = figure.x;
      view.lastZ = figure.z;
    }
    const resolved = state.paused
      ? {
          clip: view.telemetry.clip,
          unsupportedAction: view.telemetry.unsupportedAction,
        }
      : resolveAvatarClip({
          moving: view.moving,
          attacking: squad.order.kind === "attack",
        });
    const direction = spriteRow(
      (squad.headingDeg * Math.PI) / 180,
      cameraYaw,
    );
    const columns =
      resolved.clip === "walk" ? ATLAS.walkColumns : ATLAS.idleColumns;
    const frame = spriteFrame(
      animationSeconds + view.phase,
      AVATAR_FPS,
      resolved.clip === "walk",
      columns,
    );
    const cell = atlasCell({
      clip: resolved.clip,
      profile: view.profile,
      direction,
      frame,
    });

    const bodyTexture = view.textures.body[resolved.clip];
    const shadowTexture = view.textures.shadow[resolved.clip];
    configureTexture(bodyTexture, cell);
    configureTexture(shadowTexture, cell);
    view.materials.body.map = bodyTexture;
    view.materials.shadow.map = shadowTexture;

    const scale = AVATAR_WORLD_SIZE * avatarScale;
    view.body.scale.set(scale, scale, 1);
    view.shadow.scale.set(scale, scale, 1);
    view.shadow.visible = shadowToggle.checked;
    view.root.position.set(figure.x, 0.045, figure.z);
    view.root.visible = figure.alive;
    view.telemetry = {
      clip: resolved.clip,
      unsupportedAction: resolved.unsupportedAction,
      direction,
      frame,
      profile: view.profile,
    };
  }

  for (const view of commanderViews) {
    const squad = state.squads.find((candidate) => {
      return candidate.id === view.squadId;
    });

    if (!state.paused && state.tick !== view.lastTick) {
      view.moving =
        Math.hypot(
          squad.center.x - view.lastX,
          squad.center.z - view.lastZ,
        ) > 0.00001;
      view.lastTick = state.tick;
      view.lastX = squad.center.x;
      view.lastZ = squad.center.z;
    }

    const resolved = state.paused
      ? {
          clip: view.telemetry.clip,
          unsupportedAction: view.telemetry.unsupportedAction,
        }
      : resolveAvatarClip({
          moving: view.moving,
          attacking: squad.order.kind === "attack",
        });
    const direction = spriteRow(
      (squad.headingDeg * Math.PI) / 180,
      cameraYaw,
    );
    const columns =
      resolved.clip === "walk" ? ATLAS.walkColumns : ATLAS.idleColumns;
    const frame = spriteFrame(
      animationSeconds + view.phase,
      AVATAR_FPS,
      resolved.clip === "walk",
      columns,
    );
    const cell = atlasCell({
      clip: resolved.clip,
      profile: view.profile,
      direction,
      frame,
    });
    const bodyTexture = view.textures.body[resolved.clip];
    const shadowTexture = view.textures.shadow[resolved.clip];

    configureTexture(bodyTexture, cell);
    configureTexture(shadowTexture, cell);
    view.materials.body.map = bodyTexture;
    view.materials.shadow.map = shadowTexture;

    const scale = COMMANDER_WORLD_SIZE * avatarScale;
    view.body.scale.set(scale, scale, 1);
    view.shadow.scale.set(scale, scale, 1);
    view.shadow.visible = shadowToggle.checked;
    view.banner.visible =
      squad.id === state.selectedSquadId ||
      squad.id === hoveredSquadId;
    view.root.position.set(
      squad.center.x,
      0.048,
      squad.center.z,
    );
    view.root.visible = squad.aliveCount > 0;
    view.telemetry = {
      clip: resolved.clip,
      unsupportedAction: resolved.unsupportedAction,
      direction,
      frame,
      profile: view.profile,
    };
  }
}

function buildSquadButtons() {
  for (const squad of state.squads.filter((entry) => entry.side === "ally")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "squad-button";
    button.dataset.squadId = squad.id;
    button.addEventListener("click", () => {
      selectAllySquad(squad.id);
      statusMessage = `${squad.name} 아바타를 선택했습니다.`;
      syncUi();
    });
    allyList.append(button);
    allyButtons.set(squad.id, button);
  }
}

buildSquadButtons();

function syncUi() {
  const selected = selectedSquad();
  const leader = leaderById.get(selected.leaderUnitId);
  const avatar = commanderViews.find((view) => {
    return view.squadId === selected.id;
  });
  const mapping = ROLE_AVATAR_ASSETS[selected.role];

  document.body.dataset.avatarState =
    state.status === "stopped"
      ? "stopped"
      : state.paused
        ? "paused"
        : state.status;
  const status =
    state.status === "ready"
      ? "출격 대기"
      : state.status === "stopped"
        ? "전투 정지"
        : state.paused
          ? "일시정지"
          : "아바타 교전";
  stateChip.textContent = status;
  battleStatus.textContent = status;
  startAction.disabled = state.status !== "ready";
  pauseAction.disabled = state.status !== "running";
  pauseAction.textContent = state.paused ? "전투 재개" : "일시정지";

  const cardOffering = commanderCardOffering(
    cardState,
    state,
  );
  const mobilityCard = cardOffering.find((card) => {
    return card.id === MOBILITY_REGROUP_CARD.id;
  });
  const cardLeader = leaderById.get(
    selected.leaderUnitId,
  );
  const recharge =
    mobilityCard?.rechargeTicksLeft ?? 0;
  const rechargeRatio =
    recharge / MOBILITY_REGROUP_CARD.rechargeTicks;

  cardOwner.textContent =
    `${cardLeader?.name ?? selected.name} 지휘`;
  if (portraitOwnerId !== selected.id) {
    const context = cardOwnerPortrait.getContext("2d");
    context.clearRect(0, 0, 64, 64);
    context.imageSmoothingEnabled = false;
    context.drawImage(
      sourceTextures.get(mapping.idle).image,
      0, avatar.profile * ATLAS.directionCount * ATLAS.cellSize,
      64, 64, 0, 0, 64, 64,
    );
    portraitOwnerId = selected.id;
  }
  cardCancelAction.hidden = !cardState.selectedCardId;
  mobilityCardAction.disabled =
    !mobilityCard || state.status === "stopped";
  mobilityCardAction.classList.toggle(
    "is-selected",
    cardState.selectedCardId ===
      MOBILITY_REGROUP_CARD.id,
  );
  mobilityCardAction.classList.toggle(
    "is-recharging",
    recharge > 0,
  );
  mobilityCardAction.setAttribute(
    "aria-pressed",
    String(cardState.selectedCardId === MOBILITY_REGROUP_CARD.id),
  );
  mobilityCardCooldown.textContent =
    recharge > 0
      ? `${Math.ceil(recharge / 30)}s`
      : "사용 가능";
  mobilityCardFill.style.height =
    `${Math.round(rechargeRatio * 100)}%`;
  cardFeedback.textContent = cardFeedbackMessage;

  for (const squad of state.squads.filter((entry) => entry.side === "ally")) {
    const button = allyButtons.get(squad.id);
    button.classList.toggle(
      "is-selected",
      squad.id === state.selectedSquadId,
    );
    button.disabled = squad.aliveCount === 0 || state.status === "stopped";
    const content = `
      <strong>${squad.name}</strong>
      <small>${squad.roleLabel} · ${squad.aliveCount}/4명 · ${ROLE_AVATAR_ASSETS[squad.role].calling}</small>
    `;
    if (button.innerHTML !== content) {
      button.innerHTML = content;
    }
  }

  selectionRing.position.set(
    selected.center.x,
    0.055,
    selected.center.z,
  );
  selectedRole.textContent = selected.roleLabel;
  selectedRole.className = `role-badge role-${selected.role}`;
  selectedSource.textContent =
    `${leader?.callSign ?? "분대"} · ${mapping.calling} POC 매핑`;
  selectedTitle.textContent = selected.name;
  selectedClip.textContent =
    avatar?.telemetry.unsupportedAction === "attack"
      ? `${avatar.telemetry.clip} · attack 미지원`
      : avatar?.telemetry.clip ?? "idle";
  selectedDirection.textContent =
    avatar ? `${DIRECTIONS[avatar.telemetry.direction]} · row ${avatar.telemetry.direction}` : "-";
  selectedFrame.textContent =
    avatar ? `${avatar.telemetry.frame + 1} / ${
      avatar.telemetry.clip === "walk" ? 20 : 1
    }` : "-";
  selectedProfile.textContent =
    avatar ? `${avatar.telemetry.profile + 1} / 6` : "-";
  selectedAlive.textContent = `${selected.aliveCount} / 4명`;
  notice.textContent =
    state.status === "stopped"
      ? "종단 상태입니다. 동일 seed 초기화만 가능합니다."
      : statusMessage;
}

startAction.addEventListener("click", () => {
  state = startBattle(state);
  lastFrameTime = performance.now();
  statusMessage = "보행 atlas가 이동 방향과 실제 이동 상태를 따릅니다.";
  syncUi();
});

pauseAction.addEventListener("click", () => {
  state = setBattlePaused(state, !state.paused);
  lastFrameTime = performance.now();
  statusMessage = state.paused
    ? "전투와 보행 frame이 함께 동결됐습니다."
    : "전투를 재개했습니다. 보행 frame도 다시 진행합니다.";
  syncUi();
});

resetAction.addEventListener("click", () => {
  state = resetBattle(state);
  cardState = createCommanderCardState(state);
  cardTargetSquadId = null;
  cardFeedbackMessage =
    "카드를 선택한 뒤 아군 분대와 이동 방향을 차례로 지정합니다.";
  cardHoverGround = null;
  cardEffectAgeMs = null;
  cardEffectRing.visible = false;
  animationSeconds = 0;
  lastFrameTime = performance.now();
  for (const view of avatarViews) {
    const squad = state.squads.find((candidate) => {
      return candidate.id === view.squadId;
    });
    const figure = squad.figures.find((candidate) => {
      return candidate.id === view.figureId;
    });
    view.lastTick = state.tick;
    view.lastX = figure.x;
    view.lastZ = figure.z;
    view.moving = false;
  }
  for (const view of commanderViews) {
    const squad = state.squads.find((candidate) => {
      return candidate.id === view.squadId;
    });
    view.lastTick = state.tick;
    view.lastX = squad.center.x;
    view.lastZ = squad.center.z;
    view.moving = false;
  }
  statusMessage =
    "동일 seed와 진형으로 전투 병사 48명과 지휘관 표현 12명을 초기화했습니다.";
  syncAvatars();
  syncUi();
  renderer.render(scene, camera);
});

shadowToggle.addEventListener("change", () => {
  statusMessage = shadowToggle.checked
    ? "공통 cast-shadow atlas layer를 표시합니다."
    : "검사용으로 shadow layer를 숨겼습니다.";
  syncUi();
});

scaleSelect.addEventListener("change", () => {
  avatarScale = Number(scaleSelect.value);
  statusMessage = `고정 foot anchor를 유지하며 아바타 크기를 ${Math.round(
    avatarScale * 100,
  )}%로 표시합니다.`;
});

function setCameraZoom(value) {
  camera.zoom = Math.max(
    CAMERA_ZOOM_MIN,
    Math.min(CAMERA_ZOOM_MAX, value),
  );
  camera.updateProjectionMatrix();
  zoomValue.textContent = `${Math.round(camera.zoom * 100)}%`;
  zoomInAction.disabled = camera.zoom >= CAMERA_ZOOM_MAX;
  zoomOutAction.disabled = camera.zoom <= CAMERA_ZOOM_MIN;
  hoveredSquadId = null;
  renderer.render(scene, camera);
}

zoomInAction.addEventListener("click", () => {
  setCameraZoom(camera.zoom + CAMERA_ZOOM_STEP);
});
zoomOutAction.addEventListener("click", () => {
  setCameraZoom(camera.zoom - CAMERA_ZOOM_STEP);
});
zoomResetAction.addEventListener("click", () => {
  setCameraZoom(1);
});
viewport.addEventListener("wheel", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.deltaY === 0) {
    return;
  }
  event.preventDefault();
  const unit = event.deltaMode === 1
    ? 16
    : event.deltaMode === 2
      ? viewport.clientHeight
      : 1;
  const delta = Math.max(-240, Math.min(240, event.deltaY * unit));
  setCameraZoom(camera.zoom * Math.exp(-delta * 0.0015));
}, { passive: false });

mobilityCardAction.addEventListener("click", () => {
  if (cardState.selectedCardId) {
    cancelCardSelection();
    return;
  }
  const selected = selectCommanderCard(
    cardState,
    state,
    MOBILITY_REGROUP_CARD.id,
  );
  if (selected.rejection) {
    cardFeedbackMessage =
      cardRejectionMessage(selected.rejection);
    statusMessage = cardFeedbackMessage;
    syncUi();
    return;
  }

  cardState = selected.cardState;
  cardTargetSquadId = null;
  cardHoverGround = null;
  cardFeedbackMessage =
    "대상 아군 지휘관 또는 분대원을 클릭하세요.";
  statusMessage =
    "기동 재집결 카드의 아군 대상을 지정합니다.";
  syncUi();
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  if (event.key === "Escape" && cardState.selectedCardId) {
    event.preventDefault();
    cancelCardSelection();
    return;
  }
  if (["+", "-", "0"].includes(event.key)) {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.target.isContentEditable ||
      event.target.closest(
        "input, textarea, select, button, a, [role='textbox'], [role='slider'], [role='spinbutton']",
      )
    ) {
      return;
    }
    event.preventDefault();
    setCameraZoom(
      event.key === "0"
        ? 1
        : camera.zoom + (event.key === "+" ? CAMERA_ZOOM_STEP : -CAMERA_ZOOM_STEP),
    );
    return;
  }
  const index = Number(event.key) - 1;
  const allies = state.squads.filter((squad) => squad.side === "ally");
  if (Number.isInteger(index) && index >= 0 && index < allies.length) {
    event.preventDefault();
    selectAllySquad(allies[index].id);
    syncUi();
  } else if (event.key === " ") {
    event.preventDefault();
    pauseAction.click();
  } else if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    resetAction.click();
  }
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pickPixels = new WeakMap();

function isVisibleBodyHit(hit) {
  const body = hit.object;
  if (!body.visible || !body.parent.visible) {
    return false;
  }

  const texture = body.material.map;
  const image = texture.image;
  let pixels = pickPixels.get(image);
  if (!pixels) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    pixels = context.getImageData(
      0, 0, image.width, image.height,
    );
    pickPixels.set(image, pixels);
  }

  const uv = hit.uv.clone();
  texture.transformUv(uv);
  const x = Math.min(image.width - 1, Math.floor(uv.x * image.width));
  const y = Math.min(image.height - 1, Math.floor(uv.y * image.height));
  return pixels.data[(y * image.width + x) * 4 + 3] / 255 >=
    body.material.alphaTest;
}

function setPointer(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

renderer.domElement.addEventListener("pointermove", (event) => {
  setPointer(event);
  const avatarHit = raycaster.intersectObjects(
    pickableBodies,
    false,
  ).find(isVisibleBodyHit);
  hoveredSquadId =
    avatarHit?.object.userData.squadId ?? null;
  cardHoverGround = raycaster.intersectObject(ground, false)[0]?.point ?? null;
});

renderer.domElement.addEventListener("pointerleave", () => {
  hoveredSquadId = null;
  cardHoverGround = null;
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  setPointer(event);

  const avatarHit = raycaster.intersectObjects(
    pickableBodies,
    false,
  ).find(isVisibleBodyHit);
  if (avatarHit) {
    const targetId = avatarHit.object.userData.squadId;
    const target = state.squads.find((squad) => squad.id === targetId);
    if (cardState.selectedCardId) {
      const rejection = cardTargetRejection(target);
      if (rejection) {
        cardFeedbackMessage = cardRejectionMessage(rejection);
      } else {
        cardTargetSquadId = targetId;
        cardHoverGround = null;
        cardFeedbackMessage =
          `${target.name} 지정 · 파란 화살표 방향의 지면을 클릭하세요. 빨강은 이동 불가 · Esc 취소`;
      }
      statusMessage = cardFeedbackMessage;
      syncUi();
      return;
    }
    if (target.side === "ally") {
      selectAllySquad(targetId);
      statusMessage = `${target.name}를 선택했습니다.`;
    } else {
      const selected = selectedSquad();
      state = issueAttackOrder(state, selected.id, targetId);
      statusMessage =
        `${selected.name}에 ${target.name} 공격을 지정했습니다. ` +
        "공격 전용 clip은 없어 정지 교전은 idle로 표시합니다.";
    }
    syncUi();
    return;
  }

  const hit = raycaster.intersectObject(ground, false)[0];
  const selected = selectedSquad();
  if (!hit || !selected) {
    return;
  }
  if (cardState.selectedCardId) {
    if (!cardTargetSquadId) {
      cardFeedbackMessage =
        "먼저 생존 아군 분대를 카드 대상으로 지정하세요.";
      statusMessage = cardFeedbackMessage;
      syncUi();
      return;
    }

    const played = playSelectedCommanderCard(
      cardState,
      state,
      {
        targetSquadId: cardTargetSquadId,
        ground: {
          x: hit.point.x,
          z: hit.point.z,
        },
      },
    );
    if (played.rejection) {
      cardFeedbackMessage =
        cardRejectionMessage(played.rejection);
      statusMessage = cardFeedbackMessage;
      syncUi();
      return;
    }

    state = played.battleState;
    cardState = played.cardState;
    triggerCardEffect(
      played.effect.targetSquadId,
    );
    cardFeedbackMessage =
      "기동 재집결 적용 · POC 즉시 재배치";
    statusMessage =
      "지휘관 카드로 분대를 한 칸 재집결했습니다.";
    cardTargetSquadId = null;
    syncAvatars();
    syncUi();
    renderer.render(scene, camera);
    return;
  }
  state = issueMoveOrder(state, selected.id, {
    x: hit.point.x,
    z: hit.point.z,
  });
  statusMessage = state.paused
    ? `${selected.name} 이동 명령을 정지 중 예약했습니다.`
    : `${selected.name} 이동 명령을 내렸습니다.`;
  syncUi();
});

function resizeScene() {
  const width = Math.max(1, viewport.clientWidth);
  const height = Math.max(1, viewport.clientHeight);
  const aspect = width / height;
  const viewHeight = 12.2;
  camera.left = (-viewHeight * aspect) / 2;
  camera.right = (viewHeight * aspect) / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

let resizePending = false;

function frame(now) {
  if (resizePending) {
    resizePending = false;
    resizeScene();
  }
  const elapsed = Math.max(0, now - lastFrameTime);
  lastFrameTime = now;

  if (state.status === "running" && !state.paused) {
    animationSeconds += Math.min(elapsed, 100) / 1000;
  }
  const next = advanceBattleFrame(state, elapsed);
  if (next !== state) {
    state = next;
  }
  cardState = syncCommanderCardState(
    cardState,
    state,
  );

  syncAvatars();
  syncCardEffect(elapsed);
  syncCardTargetPreview();
  syncUi();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

const resizeObserver = new ResizeObserver(() => {
  resizePending = true;
});
resizeObserver.observe(viewport);
resizeScene();
syncAvatars();
syncUi();

const context = renderer.getContext();
document.documentElement.dataset.webgl = context ? "ready" : "failed";
if (!context) {
  bootStatus.classList.remove("is-ready");
  bootStatus.classList.add("is-error");
  bootStatus.textContent = "WebGL 컨텍스트를 만들지 못했습니다.";
}

window.__AVATAR_POC__ = {
  getState: () => JSON.parse(JSON.stringify(state)),
  getAvatars: () =>
    avatarViews.map((view) => ({
      squadId: view.squadId,
      figureId: view.figureId,
      profile: view.profile,
      center: view.body.center.toArray(),
      bodyVisible: view.body.visible && view.root.visible,
      shadowVisible: view.shadow.visible && view.root.visible,
      telemetry: { ...view.telemetry },
      bodyMap: view.materials.body.map?.image?.src ?? "",
      shadowMap: view.materials.shadow.map?.image?.src ?? "",
      bodyRepeat: view.materials.body.map?.repeat.toArray() ?? [],
      bodyOffset: view.materials.body.map?.offset.toArray() ?? [],
    })),
  getCommanders: () =>
    commanderViews.map((view) => ({
      id: view.id,
      squadId: view.squadId,
      side: view.side,
      name: view.name,
      banner: view.bannerText,
      presentationOnly: true,
      position: view.root.position.toArray(),
      bodyScale: view.body.scale.toArray(),
      visible: view.root.visible,
      markerVisible: view.marker.visible && view.root.visible,
      bannerVisible: view.banner.visible && view.root.visible,
      telemetry: { ...view.telemetry },
      bodyMap: view.materials.body.map?.image?.src ?? "",
      bodyRepeat: view.materials.body.map?.repeat.toArray() ?? [],
      bodyOffset: view.materials.body.map?.offset.toArray() ?? [],
    })),
  getCommanderCards: () => ({
    state: structuredClone(cardState),
    offering: commanderCardOffering(
      cardState,
      state,
    ),
    targetSquadId: cardTargetSquadId,
    effectVisible: cardEffectRing.visible,
    effectPosition: cardEffectRing.position.toArray(),
    feedback: cardFeedbackMessage,
  }),
  renderer,
  scene,
  camera,
  threeRevision: THREE.REVISION,
  source: PILGRIMAGE_SOURCE,
  assetCount: sourceUrls.length,
};

requestAnimationFrame((now) => {
  lastFrameTime = now;
  requestAnimationFrame(frame);
});
