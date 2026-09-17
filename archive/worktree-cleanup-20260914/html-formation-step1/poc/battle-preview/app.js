import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import {
  UNITS,
  assertFormation,
  createInitialState,
} from "../formation-editor/formation-model.js";
import {
  SQUAD_SIZE,
  advanceBattleFrame,
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

const FORMATION_STORAGE_KEY = "janseon.review.formation.v1";
const DEFAULT_SEED = 2409;

const roleColors = {
  guard: 0x4b8ca8,
  assault: 0xb06a45,
  archer: 0x718d59,
};

const roleDarkColors = {
  guard: 0x203f50,
  assault: 0x4d2d20,
  archer: 0x2f4225,
};

const orderLabels = {
  hold: "위치 사수",
  move: "이동",
  attack: "공격",
  face: "정면 변경",
};

const outcomeLabels = {
  ongoing: "교전 중",
  "ally-victory": "아군 승리 · 전투 정지",
  "enemy-victory": "아군 패배 · 전투 정지",
  draw: "교전 종료 · 전투 정지",
};

const leaderById = new Map(UNITS.map((unit) => [unit.id, unit]));
const squadViews = new Map();
const allyButtons = new Map();
const enemyButtons = new Map();
const pickableFigures = [];

const viewport = document.querySelector("#battle-viewport");
const bootStatus = document.querySelector("#boot-status");
const stateChip = document.querySelector("#state-chip");
const battleStatus = document.querySelector("#battle-status");
const battleClock = document.querySelector("#battle-clock");
const startAction = document.querySelector("#start-action");
const pauseAction = document.querySelector("#pause-action");
const resetAction = document.querySelector("#reset-action");
const holdAction = document.querySelector("#hold-action");
const allyList = document.querySelector("#ally-squad-list");
const enemyList = document.querySelector("#enemy-squad-list");
const allyCount = document.querySelector("#ally-count");
const enemyCount = document.querySelector("#enemy-count");
const selectedRole = document.querySelector("#selected-role");
const selectedLeader = document.querySelector("#selected-leader");
const selectedTitle = document.querySelector("#selected-title");
const selectedAlive = document.querySelector("#selected-alive");
const selectedHp = document.querySelector("#selected-hp");
const selectedOrder = document.querySelector("#selected-order");
const selectedFacing = document.querySelector("#selected-facing");
const selectedHpFill = document.querySelector("#selected-hp-fill");
const notice = document.querySelector("#notice");
const eventLog = document.querySelector("#event-log");
const formationSource = document.querySelector("#formation-source");
const campaignReturn = document.querySelector("#campaign-return");
const campaignMode = new URLSearchParams(window.location.search).get(
  "campaign",
) === "recovered";
campaignReturn.hidden = !campaignMode;

function loadFormation() {
  const params = new URLSearchParams(window.location.search);
  const queryValue = params.get("formation");
  const storedValue = sessionStorage.getItem(FORMATION_STORAGE_KEY);

  for (const candidate of [
    { raw: queryValue, source: "URL 직렬화 진형" },
    { raw: storedValue, source: "세션 저장 진형" },
  ]) {
    if (!candidate.raw) {
      continue;
    }
    try {
      const formation = JSON.parse(candidate.raw);
      assertFormation(formation);
      sessionStorage.setItem(
        FORMATION_STORAGE_KEY,
        JSON.stringify(formation),
      );
      return { formation, source: candidate.source };
    } catch {
      // 다음 검증 경계로 넘어간다.
    }
  }

  const formation = createInitialState().pending;
  sessionStorage.setItem(
    FORMATION_STORAGE_KEY,
    JSON.stringify(formation),
  );
  return { formation, source: "승인 기본 진형" };
}

const loadedFormation = loadFormation();
formationSource.textContent = loadedFormation.source;

let state = createSquadBattleState({
  formation: loadedFormation.formation,
  seed: DEFAULT_SEED,
});
let statusMessage =
  "분대를 선택한 뒤 지면을 누르면 대형을 유지하며 이동합니다.";
let lastFrameTime = performance.now();
let targetedEnemyId = null;

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
camera.lookAt(0, 0.5, 0);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
  });
} catch (error) {
  bootStatus.textContent = `WebGL 초기화 실패: ${error.message}`;
  bootStatus.classList.add("is-error");
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.dataset.renderer = "webgl";
renderer.domElement.setAttribute(
  "aria-label",
  "승강장에서 대형을 유지하며 싸우는 아군과 적 6개 분대를 보여 주는 Three.js 전투 장면",
);
viewport.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xc7d7dd, 0x17110e, 1.55));

const keyLight = new THREE.DirectionalLight(0xdbe8ec, 2.15);
keyLight.position.set(4, 11, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1536, 1536);
keyLight.shadow.camera.left = -9;
keyLight.shadow.camera.right = 9;
keyLight.shadow.camera.top = 9;
keyLight.shadow.camera.bottom = -9;
scene.add(keyLight);

const signalLight = new THREE.PointLight(0xc9a227, 7, 8, 2);
signalLight.position.set(-4.8, 3.2, -1.8);
scene.add(signalLight);

function standardMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.88,
    metalness: options.metalness ?? 0.06,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });
}

function addBox(size, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    standardMaterial(color, options),
  );
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  scene.add(mesh);
  return mesh;
}

function makeTextSprite(text, accent = "#dbe4e8") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "rgba(8, 13, 20, 0.9)";
  context.fillRect(8, 16, 496, 96);
  context.strokeStyle = "rgba(69, 84, 107, 0.95)";
  context.lineWidth = 4;
  context.strokeRect(8, 16, 496, 96);
  context.fillStyle = accent;
  context.font =
    '600 42px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 65);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.65, 0.41, 1);
  sprite.renderOrder = 4;
  return sprite;
}

function buildPlatform() {
  addBox([12.5, 0.48, 11.7], [0, -0.27, 0], 0x30363a, {
    roughness: 0.97,
  });

  for (let x = -5.25; x <= 5.25; x += 1.5) {
    addBox([0.025, 0.016, 11.2], [x, -0.01, 0], 0x444b4f, {
      castShadow: false,
    });
  }
  for (let z = -5.25; z <= 5.25; z += 1.5) {
    addBox([12, 0.018, 0.025], [0, -0.005, z], 0x444b4f, {
      castShadow: false,
    });
  }

  addBox([12, 0.04, 0.25], [0, 0.01, -5.18], 0xb49325, {
    castShadow: false,
  });
  addBox([13.5, 0.18, 1.8], [0, -0.55, -6.1], 0x15191c, {
    roughness: 1,
  });
  addBox([12.8, 3.7, 0.24], [0, 1.45, -6.85], 0x20282d, {
    roughness: 0.98,
  });

  for (const z of [-5.76, -6.38]) {
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 13.2, 8),
      standardMaterial(0x737a7c, {
        roughness: 0.45,
        metalness: 0.75,
      }),
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, -0.35, z);
    rail.receiveShadow = true;
    scene.add(rail);
  }

  for (const x of [-4.7, 0, 4.7]) {
    addBox([0.34, 3.5, 0.34], [x, 1.5, -0.7], 0x4b5152, {
      roughness: 0.95,
    });
  }

  addBox([1.45, 0.16, 0.48], [-4.05, 0.4, 3.4], 0x3b4448);
  addBox([1.45, 0.16, 0.48], [4.05, 0.4, 3.4], 0x3b4448);

  const sign = addBox(
    [3.2, 0.72, 0.12],
    [2.15, 2.72, -1.55],
    0x263d51,
    { castShadow: false },
  );
  const label = makeTextSprite("영등포 동측 승강장");
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

function makeFigure(squad, figureIndex) {
  const group = new THREE.Group();
  const ally = squad.side === "ally";
  const bodyColor = ally ? roleColors[squad.role] : 0x532d2e;
  const bodyMaterial = standardMaterial(bodyColor, {
    emissive: ally ? roleDarkColors[squad.role] : 0x311417,
    emissiveIntensity: 0.1,
  });
  const darkMaterial = standardMaterial(0x20272c);
  const skinMaterial = standardMaterial(
    ally ? 0xa88a72 : 0x5e3a38,
  );

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.42, 0.2),
    bodyMaterial,
  );
  body.position.y = 0.52;
  body.castShadow = true;
  body.userData.squadId = squad.id;
  group.add(body);
  pickableFigures.push(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 7, 5),
    skinMaterial,
  );
  head.position.y = 0.81;
  head.castShadow = true;
  head.userData.squadId = squad.id;
  group.add(head);
  pickableFigures.push(head);

  for (const x of [-0.07, 0.07]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.25, 0.08),
      darkMaterial,
    );
    leg.position.set(x, 0.19, 0);
    leg.castShadow = true;
    leg.userData.squadId = squad.id;
    group.add(leg);
    pickableFigures.push(leg);
  }

  group.userData.figureIndex = figureIndex;
  scene.add(group);
  return group;
}

function makeSquadView(squad) {
  const selection = new THREE.Mesh(
    new THREE.RingGeometry(0.69, 0.77, 28),
    new THREE.MeshBasicMaterial({
      color: squad.side === "ally" ? 0xd6b139 : 0x9b5147,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    }),
  );
  selection.rotation.x = -Math.PI / 2;
  selection.position.y = 0.055;
  selection.visible = false;
  scene.add(selection);

  const banner = makeTextSprite(
    `${squad.roleLabel} · ${squad.name}`,
    squad.side === "ally" ? "#dbe4e8" : "#e1aaa4",
  );
  banner.position.y = 1.18;
  banner.visible = false;
  scene.add(banner);

  const figures = squad.figures.map((_, index) => {
    return makeFigure(squad, index);
  });

  squadViews.set(squad.id, { selection, banner, figures });
}

state.squads.forEach(makeSquadView);

const previewGroup = new THREE.Group();
for (let index = 0; index < SQUAD_SIZE; index += 1) {
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.12, 0.16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xd6b139,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.07;
  previewGroup.add(marker);
}
previewGroup.visible = false;
scene.add(previewGroup);

function buildButtons() {
  for (const squad of state.squads) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.squadId = squad.id;

    if (squad.side === "ally") {
      button.className = "squad-button";
      button.addEventListener("click", () => {
        state = selectSquad(state, squad.id);
        statusMessage = `${squad.name}를 선택했습니다.`;
        syncView();
      });
      allyList.append(button);
      allyButtons.set(squad.id, button);
    } else {
      button.className = "enemy-button";
      button.addEventListener("click", () => {
        issueAttack(squad.id);
      });
      enemyList.append(button);
      enemyButtons.set(squad.id, button);
    }
  }
}

buildButtons();

function selectedSquad() {
  return state.squads.find((squad) => {
    return squad.id === state.selectedSquadId;
  });
}

function formatFacing(headingDeg) {
  const normalized = ((headingDeg % 360) + 360) % 360;
  if (normalized >= 315 || normalized < 45) {
    return "북";
  }
  if (normalized < 135) {
    return "동";
  }
  if (normalized < 225) {
    return "남";
  }
  return "서";
}

function issueAttack(targetSquadId) {
  const squad = selectedSquad();
  if (!squad) {
    return;
  }
  const next = issueAttackOrder(state, squad.id, targetSquadId);
  if (next === state) {
    return;
  }
  state = next;
  targetedEnemyId = targetSquadId;
  const target = state.squads.find(
    (candidate) => candidate.id === targetSquadId,
  );
  statusMessage = `${squad.name}에 ${target.name} 공격을 명령했습니다.`;
  syncView();
}

function orderFacing(headingDeg) {
  const squad = selectedSquad();
  if (!squad) {
    return;
  }
  state = issueFacingOrder(state, squad.id, headingDeg);
  statusMessage = `${squad.name} 정면 변경 명령을 예약했습니다.`;
  syncView();
}

function orderHold() {
  const squad = selectedSquad();
  if (!squad) {
    return;
  }
  state = issueHoldOrder(state, squad.id);
  statusMessage = `${squad.name}에 위치 사수를 명령했습니다.`;
  syncView();
}

document.querySelectorAll("[data-facing]").forEach((button) => {
  button.addEventListener("click", () => {
    orderFacing(Number(button.dataset.facing));
  });
});

holdAction.addEventListener("click", orderHold);

startAction.addEventListener("click", () => {
  const next = startBattle(state);
  if (next === state) {
    return;
  }
  state = next;
  lastFrameTime = performance.now();
  statusMessage = "교전이 시작됐습니다. 분대는 지정된 적을 향해 전진합니다.";
  syncView();
});

pauseAction.addEventListener("click", () => {
  if (state.status !== "running") {
    return;
  }
  state = setBattlePaused(state, !state.paused);
  lastFrameTime = performance.now();
  statusMessage = state.paused
    ? "전투가 일시정지됐습니다. 분대 명령은 계속 예약할 수 있습니다."
    : "전투를 재개했습니다. 정지 중 밀린 틱은 처리하지 않습니다.";
  syncView();
});

resetAction.addEventListener("click", () => {
  state = resetBattle(state);
  targetedEnemyId = null;
  lastFrameTime = performance.now();
  statusMessage = "같은 seed와 시작 진형으로 전투를 초기화했습니다.";
  syncView();
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const index = Number(event.key) - 1;
  const allies = state.squads.filter(
    (squad) => squad.side === "ally",
  );
  if (
    Number.isInteger(index) &&
    index >= 0 &&
    index < allies.length
  ) {
    event.preventDefault();
    state = selectSquad(state, allies[index].id);
    statusMessage = `${allies[index].name}를 선택했습니다.`;
    syncView();
  } else if (event.key === " ") {
    event.preventDefault();
    pauseAction.click();
  } else if (event.key.toLowerCase() === "h") {
    event.preventDefault();
    orderHold();
  } else if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    resetAction.click();
  }
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function setPointer(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

function updatePreview(point) {
  const squad = selectedSquad();
  if (!squad || state.status === "stopped") {
    previewGroup.visible = false;
    return;
  }

  const heading = Math.atan2(
    point.x - squad.center.x,
    point.z - squad.center.z,
  );
  const cosine = Math.cos(heading);
  const sine = Math.sin(heading);
  const offsets = [
    [-0.33, -0.33],
    [0.33, -0.33],
    [-0.33, 0.33],
    [0.33, 0.33],
  ];

  previewGroup.visible = true;
  offsets.forEach(([localX, localZ], index) => {
    previewGroup.children[index].position.set(
      point.x + localX * cosine + localZ * sine,
      0.07,
      point.z - localX * sine + localZ * cosine,
    );
  });
}

renderer.domElement.addEventListener("pointermove", (event) => {
  setPointer(event);
  const hit = raycaster.intersectObject(ground, false)[0];
  if (hit) {
    updatePreview(hit.point);
  }
});

renderer.domElement.addEventListener("pointerleave", () => {
  previewGroup.visible = false;
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  setPointer(event);

  const figureHit = raycaster.intersectObjects(
    pickableFigures,
    false,
  )[0];
  if (figureHit) {
    const squadId = figureHit.object.userData.squadId;
    const squad = state.squads.find(
      (candidate) => candidate.id === squadId,
    );
    if (squad?.side === "ally") {
      state = selectSquad(state, squadId);
      statusMessage = `${squad.name}를 선택했습니다.`;
      syncView();
    } else if (squad?.side === "enemy") {
      issueAttack(squadId);
    }
    return;
  }

  const groundHit = raycaster.intersectObject(ground, false)[0];
  const squad = selectedSquad();
  if (!groundHit || !squad) {
    return;
  }

  const next = issueMoveOrder(state, squad.id, {
    x: groundHit.point.x,
    z: groundHit.point.z,
  });
  if (next === state) {
    return;
  }

  state = next;
  targetedEnemyId = null;
  statusMessage = state.paused
    ? `${squad.name} 이동 명령을 정지 중 예약했습니다.`
    : `${squad.name} 이동 명령을 내렸습니다.`;
  syncView();
});

function syncScene() {
  const current = selectedSquad();
  const targetedId =
    current?.order.kind === "attack"
      ? current.order.targetSquadId
      : targetedEnemyId;

  for (const squad of state.squads) {
    const view = squadViews.get(squad.id);
    squad.figures.forEach((figure, index) => {
      const figureView = view.figures[index];
      figureView.position.set(figure.x, 0, figure.z);
      figureView.rotation.y =
        (-squad.headingDeg * Math.PI) / 180;
      figureView.visible = figure.alive;
    });

    view.selection.position.set(
      squad.center.x,
      0.055,
      squad.center.z,
    );
    view.selection.visible =
      squad.id === state.selectedSquadId ||
      squad.id === targetedId;

    view.banner.position.set(
      squad.center.x,
      1.22,
      squad.center.z,
    );
    view.banner.visible =
      squad.id === state.selectedSquadId ||
      squad.id === targetedId;
  }
}

function syncButtons() {
  const selected = selectedSquad();
  const selectedTarget =
    selected?.order.kind === "attack"
      ? selected.order.targetSquadId
      : targetedEnemyId;

  for (const squad of state.squads) {
    const button =
      squad.side === "ally"
        ? allyButtons.get(squad.id)
        : enemyButtons.get(squad.id);
    button.disabled =
      squad.aliveCount === 0 || state.status === "stopped";
    button.classList.toggle(
      "is-selected",
      squad.id === state.selectedSquadId,
    );
    button.classList.toggle(
      "is-targeted",
      squad.id === selectedTarget,
    );
    button.innerHTML = `
      <strong>${squad.name}</strong>
      <small>${squad.roleLabel} · ${squad.aliveCount}/${SQUAD_SIZE}명 · HP ${squad.hp}/${squad.maxHp}</small>
    `;
  }
}

function syncEventLog() {
  const events = state.events.slice(-3).reverse();
  eventLog.replaceChildren();

  if (events.length === 0) {
    const item = document.createElement("li");
    item.className = "is-empty";
    item.textContent = "아직 공격 판정이 없습니다.";
    eventLog.append(item);
    return;
  }

  for (const event of events) {
    const attacker = state.squads.find(
      (squad) => squad.id === event.attackerId,
    );
    const target = state.squads.find(
      (squad) => squad.id === event.targetId,
    );
    const item = document.createElement("li");
    item.textContent =
      `T${event.tick} · ${attacker?.name ?? event.attackerId} → ` +
      `${target?.name ?? event.targetId} · ${event.damage} 피해`;
    eventLog.append(item);
  }
}

function syncView() {
  const selected = selectedSquad();
  const aliveAllies = state.squads
    .filter((squad) => squad.side === "ally")
    .reduce((total, squad) => total + squad.aliveCount, 0);
  const aliveEnemies = state.squads
    .filter((squad) => squad.side === "enemy")
    .reduce((total, squad) => total + squad.aliveCount, 0);

  document.body.dataset.battleState =
    state.status === "stopped"
      ? "stopped"
      : state.paused
        ? "paused"
        : state.status;
  campaignReturn.hidden = !campaignMode || state.status === "ready";

  const statusLabel =
    state.status === "ready"
      ? "출격 대기"
      : state.status === "stopped"
        ? outcomeLabels[state.outcome]
        : state.paused
          ? "일시정지"
          : "실시간 교전";

  stateChip.textContent = statusLabel;
  battleStatus.textContent = statusLabel;
  battleClock.textContent =
    `TICK ${String(state.tick).padStart(4, "0")} · ` +
    `${(state.tick / 30).toFixed(1)}초`;

  allyCount.textContent = `6분대 · ${aliveAllies}/24명`;
  enemyCount.textContent = `6분대 · ${aliveEnemies}/24명`;

  startAction.disabled = state.status !== "ready";
  pauseAction.disabled = state.status !== "running";
  pauseAction.textContent = state.paused ? "전투 재개" : "일시정지";
  holdAction.disabled =
    !selected || selected.aliveCount === 0 || state.status === "stopped";
  document.querySelectorAll("[data-facing]").forEach((button) => {
    button.disabled =
      !selected || selected.aliveCount === 0 || state.status === "stopped";
  });

  if (selected) {
    const leader = leaderById.get(selected.leaderUnitId);
    selectedRole.textContent = selected.roleLabel;
    selectedRole.className = `role-badge role-${selected.role}`;
    selectedLeader.textContent =
      `${leader?.callSign ?? "임시 지휘"} · 대형 인원 4명`;
    selectedTitle.textContent = selected.name;
    selectedAlive.textContent = `${selected.aliveCount} / ${SQUAD_SIZE}명`;
    selectedHp.textContent = `${selected.hp} / ${selected.maxHp}`;
    selectedOrder.textContent =
      orderLabels[selected.order.kind] ?? selected.order.kind;
    selectedFacing.textContent =
      `${formatFacing(selected.headingDeg)} · ${selected.headingDeg}°`;
    selectedHpFill.style.width =
      `${(selected.hp / selected.maxHp) * 100}%`;
  }

  notice.textContent =
    state.status === "stopped"
      ? `${outcomeLabels[state.outcome]}. Reset만 가능합니다.`
      : statusMessage;
  notice.classList.toggle("is-confirmed", state.status === "stopped");

  syncButtons();
  syncEventLog();
  syncScene();
}

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

function frame(now) {
  const elapsed = Math.max(0, now - lastFrameTime);
  lastFrameTime = now;

  const next = advanceBattleFrame(state, elapsed);
  if (next !== state) {
    state = next;
    syncView();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

const resizeObserver = new ResizeObserver(resizeScene);
resizeObserver.observe(viewport);
resizeScene();
syncView();

requestAnimationFrame((now) => {
  lastFrameTime = now;
  const context = renderer.getContext();
  document.documentElement.dataset.webgl = context ? "ready" : "failed";
  bootStatus.classList.add(context ? "is-ready" : "is-error");
  if (!context) {
    bootStatus.textContent = "WebGL 컨텍스트를 만들지 못했습니다.";
  }

  window.__BATTLE_POC__ = {
    getState: () => JSON.parse(JSON.stringify(state)),
    renderer,
    scene,
    camera,
    threeRevision: THREE.REVISION,
    ticksPerSecond: 30,
    maxStepsPerFrame: 4,
    formationSource: loadedFormation.source,
  };

  requestAnimationFrame(frame);
});
