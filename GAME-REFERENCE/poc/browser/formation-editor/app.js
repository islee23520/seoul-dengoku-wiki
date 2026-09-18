import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import {
  COLUMNS,
  ROWS,
  SLOT_IDS,
  UNITS,
  confirmFormation,
  createInitialState,
  editFormation,
  getUnitSlot,
  moveUnit,
  resetFormation,
  selectUnit,
} from "./formation-model.js";

const GRID_SIZE = 1.5;
const FORMATION_STORAGE_KEY = "janseon.review.formation.v1";
const campaignMode = new URLSearchParams(window.location.search).get(
  "campaign",
) === "recovered";

const rowMeta = {
  front: { label: "전열", short: "전", z: 0.75 },
  middle: { label: "중열", short: "중", z: 2.25 },
  rear: { label: "후열", short: "후", z: 3.75 },
};

const columnMeta = {
  left: { label: "좌", x: -GRID_SIZE },
  center: { label: "중앙", x: 0 },
  right: { label: "우", x: GRID_SIZE },
};

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

const unitById = new Map(UNITS.map((unit) => [unit.id, unit]));
const unitButtons = new Map();
const slotButtons = new Map();
const unitGroups = new Map();
const slotMeshes = new Map();

const viewport = document.querySelector("#viewport");
const bootStatus = document.querySelector("#boot-status");
const unitList = document.querySelector("#unit-list");
const slotGrid = document.querySelector("#slot-grid");
const lockChip = document.querySelector("#lock-chip");
const selectedRole = document.querySelector("#selected-role");
const selectedCallsign = document.querySelector("#selected-callsign");
const selectedTitle = document.querySelector("#selected-title");
const selectedRow = document.querySelector("#selected-row");
const selectedColumn = document.querySelector("#selected-column");
const notice = document.querySelector("#notice");
const confirmAction = document.querySelector("#confirm-action");
const editAction = document.querySelector("#edit-action");
const resetAction = document.querySelector("#reset-action");
const continueAction = document.querySelector("#continue-action");

let state = createInitialState();
let statusMessage = "대원을 선택하고 슬롯을 누르면 배치됩니다.";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b121b);
scene.fog = new THREE.Fog(0x0b121b, 18, 33);

const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 80);
const azimuth = THREE.MathUtils.degToRad(45);
const elevation = THREE.MathUtils.degToRad(35.264);
const cameraRadius = 18;
const horizontalRadius = Math.cos(elevation) * cameraRadius;
camera.position.set(
  Math.cos(azimuth) * horizontalRadius,
  Math.sin(elevation) * cameraRadius,
  Math.sin(azimuth) * horizontalRadius,
);
camera.lookAt(0, 0.6, -0.25);

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
  "승강장 위 아군 3열 진형과 적 참고 실루엣을 보여 주는 Three.js 장면",
);
viewport.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xc7d7dd, 0x17110e, 1.55));

const keyLight = new THREE.DirectionalLight(0xdbe8ec, 2.2);
keyLight.position.set(4, 11, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1536, 1536);
keyLight.shadow.camera.left = -9;
keyLight.shadow.camera.right = 9;
keyLight.shadow.camera.top = 9;
keyLight.shadow.camera.bottom = -9;
scene.add(keyLight);

const signalLight = new THREE.PointLight(0xc9a227, 8, 8, 2);
signalLight.position.set(-4.8, 3.2, -1.8);
scene.add(signalLight);

function standardMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.86,
    metalness: options.metalness ?? 0.08,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });
}

function addBox({
  size,
  position,
  color,
  roughness,
  metalness,
  castShadow = true,
  receiveShadow = true,
}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    standardMaterial(color, { roughness, metalness }),
  );
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  scene.add(mesh);
  return mesh;
}

function makeTextSprite(text, accent = "#dbe4e8") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "rgba(8, 13, 20, 0.88)";
  context.fillRect(8, 16, 496, 96);
  context.strokeStyle = "rgba(69, 84, 107, 0.95)";
  context.lineWidth = 4;
  context.strokeRect(8, 16, 496, 96);
  context.fillStyle = accent;
  context.font =
    '600 43px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 65);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.75, 0.44, 1);
  return sprite;
}

function buildPlatform() {
  addBox({
    size: [12.5, 0.48, 10.3],
    position: [0, -0.27, 0.3],
    color: 0x30363a,
    roughness: 0.97,
  });

  for (let x = -5.25; x <= 5.25; x += 1.5) {
    addBox({
      size: [0.025, 0.016, 9.8],
      position: [x, -0.01, 0.3],
      color: 0x444b4f,
      castShadow: false,
    });
  }

  for (let z = -4.2; z <= 4.8; z += 1.5) {
    addBox({
      size: [12, 0.018, 0.025],
      position: [0, -0.005, z],
      color: 0x444b4f,
      castShadow: false,
    });
  }

  addBox({
    size: [12, 0.04, 0.25],
    position: [0, 0.01, -4.28],
    color: 0xb49325,
    castShadow: false,
  });

  addBox({
    size: [13.5, 0.18, 2.2],
    position: [0, -0.55, -5.45],
    color: 0x15191c,
    roughness: 1,
  });

  for (const z of [-5.05, -5.82]) {
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 13.2, 8),
      standardMaterial(0x737a7c, { roughness: 0.45, metalness: 0.75 }),
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, -0.35, z);
    rail.receiveShadow = true;
    scene.add(rail);
  }

  addBox({
    size: [12.8, 3.7, 0.24],
    position: [0, 1.45, -6.5],
    color: 0x20282d,
    roughness: 0.98,
  });

  for (const x of [-4.7, 0, 4.7]) {
    addBox({
      size: [0.34, 3.5, 0.34],
      position: [x, 1.5, -0.55],
      color: 0x4b5152,
      roughness: 0.95,
    });
    addBox({
      size: [0.43, 0.1, 0.43],
      position: [x, 3.23, -0.55],
      color: 0x252b2e,
    });
  }

  addBox({
    size: [4.2, 0.18, 0.18],
    position: [0, 3.25, -1.4],
    color: 0x22292e,
    metalness: 0.5,
  });

  const sign = addBox({
    size: [3.2, 0.72, 0.12],
    position: [2.15, 2.72, -1.4],
    color: 0x263d51,
    castShadow: false,
  });
  sign.add(makeTextSprite("영등포 동측 승강장", "#d9e7ec"));
  sign.children[0].position.set(0, 0, 0.08);
  sign.children[0].scale.set(2.7, 0.66, 1);
  sign.children[0].material.depthTest = false;
  sign.children[0].renderOrder = 2;

  for (const x of [-4.1, 4.1]) {
    addBox({
      size: [1.45, 0.16, 0.48],
      position: [x, 0.4, 2.8],
      color: 0x3b4448,
      roughness: 0.9,
    });
    addBox({
      size: [0.12, 0.42, 0.12],
      position: [x - 0.48, 0.16, 2.8],
      color: 0x242b2f,
      metalness: 0.35,
    });
    addBox({
      size: [0.12, 0.42, 0.12],
      position: [x + 0.48, 0.16, 2.8],
      color: 0x242b2f,
      metalness: 0.35,
    });
  }
}

function buildFormationSlots() {
  for (const slotId of SLOT_IDS) {
    const [row, column] = slotId.split("-");
    const geometry = new THREE.BoxGeometry(1.24, 0.055, 1.24);
    const material = standardMaterial(0x203444, {
      emissive: 0x18394d,
      emissiveIntensity: 0.22,
      transparent: true,
      opacity: 0.72,
    });
    const slot = new THREE.Mesh(geometry, material);
    slot.position.set(columnMeta[column].x, 0.035, rowMeta[row].z);
    slot.receiveShadow = true;
    slot.userData.slotId = slotId;
    scene.add(slot);
    slotMeshes.set(slotId, slot);

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x4b7890 }),
    );
    outline.position.copy(slot.position);
    outline.userData.slotId = slotId;
    scene.add(outline);
  }
}

function makeAlly(unit) {
  const group = new THREE.Group();
  const materials = [];

  const bodyMaterial = standardMaterial(roleColors[unit.role], {
    roughness: 0.88,
    emissive: roleDarkColors[unit.role],
    emissiveIntensity: 0.08,
  });
  const darkMaterial = standardMaterial(0x20272c, { roughness: 0.94 });
  const skinMaterial = standardMaterial(0xa88a72, { roughness: 0.98 });
  materials.push(bodyMaterial);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.72, 0.38),
    bodyMaterial,
  );
  body.position.y = 0.79;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 8, 6),
    skinMaterial,
  );
  head.position.y = 1.34;
  head.castShadow = true;
  group.add(head);

  for (const x of [-0.15, 0.15]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.44, 0.18),
      darkMaterial,
    );
    leg.position.set(x, 0.3, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  if (unit.role === "guard") {
    const shield = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.58, 0.08),
      standardMaterial(0x617681, { roughness: 0.72, metalness: 0.32 }),
    );
    shield.position.set(0, 0.78, -0.28);
    shield.castShadow = true;
    group.add(shield);
  } else if (unit.role === "assault") {
    const baton = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.72, 7),
      standardMaterial(0x8b623e, { roughness: 0.6 }),
    );
    baton.rotation.z = -0.42;
    baton.position.set(0.38, 0.82, -0.08);
    baton.castShadow = true;
    group.add(baton);
  } else {
    const bow = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.035, 5, 12, Math.PI),
      standardMaterial(0x7b6041, { roughness: 0.9 }),
    );
    bow.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    bow.position.set(0, 0.83, -0.3);
    bow.castShadow = true;
    group.add(bow);
  }

  const facingArrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.34, 5),
    standardMaterial(0xd6b139, {
      emissive: 0x6c5411,
      emissiveIntensity: 0.5,
    }),
  );
  facingArrow.rotation.x = -Math.PI / 2;
  facingArrow.position.set(0, 0.14, -0.5);
  group.add(facingArrow);

  const selectionRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.045, 6, 24),
    standardMaterial(0xd6b139, {
      emissive: 0x9a7414,
      emissiveIntensity: 0.85,
    }),
  );
  selectionRing.rotation.x = Math.PI / 2;
  selectionRing.position.y = 0.08;
  selectionRing.visible = false;
  group.add(selectionRing);

  const nameplate = makeTextSprite(`${unit.roleLabel} · ${unit.name}`);
  nameplate.position.y = 1.86;
  group.add(nameplate);

  group.userData = {
    unitId: unit.id,
    materials,
    selectionRing,
    nameplate,
  };
  scene.add(group);
  unitGroups.set(unit.id, group);
}

function buildEnemySilhouettes() {
  const enemyPositions = [
    [-2.25, -2.25],
    [0, -2.25],
    [2.25, -2.25],
    [-2.25, -3.55],
    [0, -3.55],
    [2.25, -3.55],
  ];

  enemyPositions.forEach(([x, z], index) => {
    const group = new THREE.Group();
    const shade = index % 2 === 0 ? 0x4b2728 : 0x382125;
    const material = standardMaterial(shade, {
      emissive: 0x311417,
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0.84,
    });

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.31, 0.86, 7),
      material,
    );
    body.position.y = 0.62;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 7, 5),
      material,
    );
    head.position.y = 1.2;
    head.castShadow = true;
    group.add(head);

    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.31, 0.38, 20),
      new THREE.MeshBasicMaterial({
        color: 0x9b5147,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = 0.025;
    group.add(marker);

    group.position.set(x, 0, z);
    scene.add(group);
  });
}

function buildControls() {
  UNITS.forEach((unit, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "unit-button";
    button.dataset.unitId = unit.id;
    button.innerHTML = `
      <span class="unit-index">${index + 1}</span>
      <span class="unit-copy">
        <strong>${unit.name} · ${unit.roleLabel}</strong>
        <small>${unit.callSign}</small>
      </span>
    `;
    button.addEventListener("click", () => {
      setState(
        selectUnit(state, unit.id),
        `${unit.name} ${unit.roleLabel} 대원을 선택했습니다.`,
      );
    });
    unitList.append(button);
    unitButtons.set(unit.id, button);
  });

  for (const row of ROWS) {
    const rowLabel = document.createElement("span");
    rowLabel.className = "row-label";
    rowLabel.textContent = rowMeta[row].short;
    slotGrid.append(rowLabel);

    for (const column of COLUMNS) {
      const slotId = `${row}-${column}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "slot-button";
      button.dataset.slotId = slotId;
      button.addEventListener("click", () => placeSelectedUnit(slotId));
      button.addEventListener("keydown", handleSlotKeyboard);
      slotGrid.append(button);
      slotButtons.set(slotId, button);
    }
  }
}

function handleSlotKeyboard(event) {
  const slotId = event.currentTarget.dataset.slotId;
  const currentIndex = SLOT_IDS.indexOf(slotId);
  let nextIndex = currentIndex;

  if (event.key === "ArrowLeft") {
    nextIndex = currentIndex % 3 === 0 ? currentIndex : currentIndex - 1;
  } else if (event.key === "ArrowRight") {
    nextIndex =
      currentIndex % 3 === 2 ? currentIndex : currentIndex + 1;
  } else if (event.key === "ArrowUp") {
    nextIndex = Math.max(0, currentIndex - 3);
  } else if (event.key === "ArrowDown") {
    nextIndex = Math.min(SLOT_IDS.length - 1, currentIndex + 3);
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    placeSelectedUnit(slotId);
    return;
  } else {
    return;
  }

  event.preventDefault();
  slotButtons.get(SLOT_IDS[nextIndex]).focus();
}

function setState(nextState, message) {
  state = nextState;
  statusMessage = message;
  syncView();
}

function placeSelectedUnit(slotId) {
  if (state.locked) {
    statusMessage = "확정된 배치입니다. 다시 편집을 눌러 잠금을 해제하세요.";
    syncView();
    return;
  }

  const selected = unitById.get(state.selectedUnitId);
  const destinationUnitId = state.pending[slotId];
  const destinationUnit = destinationUnitId
    ? unitById.get(destinationUnitId)
    : null;

  state = moveUnit(state, state.selectedUnitId, slotId);
  statusMessage = destinationUnit
    ? `${selected.name}${koreanConnector(selected.name)} ${destinationUnit.name}의 위치를 교환했습니다.`
    : `${selected.name}을 ${formatSlot(slotId)}에 배치했습니다.`;
  syncView();
}

function formatSlot(slotId) {
  const [row, column] = slotId.split("-");
  return `${rowMeta[row].label} · ${columnMeta[column].label}`;
}

function koreanConnector(name) {
  const lastCodePoint = name.codePointAt(name.length - 1);
  if (
    lastCodePoint >= 0xac00 &&
    lastCodePoint <= 0xd7a3 &&
    (lastCodePoint - 0xac00) % 28 !== 0
  ) {
    return "과";
  }
  return "와";
}

function syncView() {
  const selectedUnit = unitById.get(state.selectedUnitId);
  const selectedSlotId = getUnitSlot(state.pending, selectedUnit.id);
  const [selectedRowId, selectedColumnId] = selectedSlotId.split("-");

  document.body.dataset.locked = String(state.locked);
  lockChip.textContent = state.locked ? "배치 확정됨" : "편집 중";
  lockChip.classList.toggle("is-locked", state.locked);

  for (const unit of UNITS) {
    const button = unitButtons.get(unit.id);
    button.disabled = state.locked;
    button.classList.toggle("is-selected", unit.id === state.selectedUnitId);
    button.setAttribute(
      "aria-pressed",
      String(unit.id === state.selectedUnitId),
    );
  }

  for (const slotId of SLOT_IDS) {
    const occupantId = state.pending[slotId];
    const occupant = occupantId ? unitById.get(occupantId) : null;
    const button = slotButtons.get(slotId);
    button.disabled = state.locked;
    button.classList.toggle("is-empty", !occupant);
    button.classList.toggle("is-selected", slotId === state.selectedSlotId);
    button.innerHTML = occupant
      ? `<strong>${occupant.name}</strong><small>${occupant.roleLabel}</small>`
      : "<strong>빈 슬롯</strong><small>배치 가능</small>";
    button.setAttribute(
      "aria-label",
      `${formatSlot(slotId)}, ${
        occupant ? `${occupant.name} ${occupant.roleLabel}` : "빈 슬롯"
      }`,
    );

    const slotMesh = slotMeshes.get(slotId);
    const isSelected = slotId === state.selectedSlotId;
    slotMesh.material.color.setHex(
      state.locked ? 0x294436 : isSelected ? 0x6e5718 : 0x203444,
    );
    slotMesh.material.emissive.setHex(
      state.locked ? 0x294436 : isSelected ? 0x8b6b13 : 0x18394d,
    );
    slotMesh.material.emissiveIntensity = isSelected ? 0.6 : 0.22;
  }

  for (const unit of UNITS) {
    const slotId = getUnitSlot(state.pending, unit.id);
    const [row, column] = slotId.split("-");
    const group = unitGroups.get(unit.id);
    group.position.set(
      columnMeta[column].x,
      0.08,
      rowMeta[row].z,
    );

    const isSelected = unit.id === state.selectedUnitId;
    group.userData.selectionRing.visible = isSelected;
    group.userData.nameplate.visible = isSelected;
    for (const material of group.userData.materials) {
      material.emissiveIntensity = isSelected ? 0.42 : 0.08;
    }
  }

  selectedRole.textContent = selectedUnit.roleLabel;
  selectedRole.className = `role-badge role-${selectedUnit.role}`;
  selectedCallsign.textContent = selectedUnit.callSign;
  selectedTitle.textContent = selectedUnit.name;
  selectedRow.textContent = rowMeta[selectedRowId].label;
  selectedColumn.textContent = columnMeta[selectedColumnId].label;

  notice.textContent = state.locked
    ? campaignMode
      ? "배치가 확정되어 잠겼습니다. 실시간 교전으로 진행할 수 있습니다."
      : "배치가 확정되어 잠겼습니다. 이 POC는 다음 단계로 진행하지 않습니다."
    : statusMessage;
  notice.classList.toggle("is-confirmed", state.locked);

  confirmAction.disabled = state.locked;
  editAction.disabled = !state.locked;

  renderScene();
}

confirmAction.addEventListener("click", () => {
  const confirmed = confirmFormation(state);
  sessionStorage.setItem(
    FORMATION_STORAGE_KEY,
    JSON.stringify(confirmed.confirmed),
  );
  continueAction.hidden = !campaignMode;
  setState(
    confirmed,
    campaignMode
      ? "배치를 확정했습니다. 실시간 교전으로 진행할 수 있습니다."
      : "배치를 확정했습니다. 다음 단계는 시작되지 않습니다.",
  );
});

continueAction.addEventListener("click", () => {
  window.location.href = "../battle-preview/?campaign=recovered";
});

editAction.addEventListener("click", () => {
  continueAction.hidden = true;
  setState(
    editFormation(state),
    "확정 잠금을 해제했습니다. 현재 배치에서 다시 편집할 수 있습니다.",
  );
});

resetAction.addEventListener("click", () => {
  continueAction.hidden = true;
  setState(resetFormation(), "초기 6인 진형으로 되돌렸습니다.");
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const unitIndex = Number(event.key) - 1;
  if (
    Number.isInteger(unitIndex) &&
    unitIndex >= 0 &&
    unitIndex < UNITS.length
  ) {
    event.preventDefault();
    const unit = UNITS[unitIndex];
    if (!state.locked) {
      setState(
        selectUnit(state, unit.id),
        `${unit.name} ${unit.roleLabel} 대원을 선택했습니다.`,
      );
      unitButtons.get(unit.id).focus();
    }
    return;
  }

  if (event.key.toLowerCase() === "c" && !state.locked) {
    event.preventDefault();
    confirmAction.click();
  } else if (event.key.toLowerCase() === "e" && state.locked) {
    event.preventDefault();
    editAction.click();
  } else if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    resetAction.click();
  }
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener("pointerdown", (event) => {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster.intersectObjects(
    [...slotMeshes.values()],
    false,
  );
  const slotId = intersections[0]?.object.userData.slotId;
  if (slotId) {
    placeSelectedUnit(slotId);
    slotButtons.get(slotId).focus();
  }
});

function resizeScene() {
  const width = Math.max(1, viewport.clientWidth);
  const height = Math.max(1, viewport.clientHeight);
  const aspect = width / height;
  const viewHeight = 11.2;

  camera.left = (-viewHeight * aspect) / 2;
  camera.right = (viewHeight * aspect) / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  renderScene();
}

function renderScene() {
  renderer.render(scene, camera);
}

buildPlatform();
buildFormationSlots();
UNITS.forEach(makeAlly);
buildEnemySilhouettes();
buildControls();
syncView();

const resizeObserver = new ResizeObserver(resizeScene);
resizeObserver.observe(viewport);
resizeScene();

requestAnimationFrame(() => {
  renderScene();
  const context = renderer.getContext();
  document.documentElement.dataset.webgl = context ? "ready" : "failed";
  bootStatus.classList.add(context ? "is-ready" : "is-error");
  if (!context) {
    bootStatus.textContent = "WebGL 컨텍스트를 만들지 못했습니다.";
  }

  window.__FORMATION_POC__ = {
    getState: () => JSON.parse(JSON.stringify(state)),
    renderer,
    scene,
    camera,
    threeRevision: THREE.REVISION,
    gridSize: GRID_SIZE,
    cameraAngles: { azimuth: 45, elevation: 35.264 },
  };
});
