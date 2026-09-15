// UI contract mirror. Tool's canonical schema remains authoritative and is tested for parity.
export const CANONICAL_SLOTS = Object.freeze([
  ['bg', '배경', false], ['clothes_back', '의상 뒤', false], ['headgear_back', '머리장식 뒤', false],
  ['hair_back', '뒷머리', true], ['beard_back', '수염 뒤', false], ['face_base', '얼굴 바탕', true],
  ['neck', '목', true], ['cheeks', '볼', true], ['chin', '턱', true], ['mouth', '입', true],
  ['nose', '코', true], ['eyes_shape', '눈 모양', true], ['eyes_color', '눈동자', true],
  ['ears', '귀', true], ['clothes', '의상', true], ['headgear_mid', '머리장식 중간', false],
  ['beard', '수염', false], ['hair', '앞머리', true], ['clothes_front', '의상 앞', false],
  ['headgear', '머리장식 앞', false], ['acc_eye', '안경 · 눈 장식', false], ['frame', '프레임', false]
].map(([id, label, required], z) => Object.freeze({ id, z, label, required })));

function fail(message) { throw new Error(message); }
const own = (value, key) => Object.hasOwn(value, key);

export function validateManifest(manifest) {
  if (manifest?.version !== 1) fail('라이브러리 version은 1이어야 합니다.');
  if (manifest.canvas?.width !== 1145 || manifest.canvas?.height !== 1374) fail('캔버스는 1145 × 1374이어야 합니다.');
  if (!Array.isArray(manifest.slots) || manifest.slots.length !== 22) fail('표준 슬롯 22개가 필요합니다.');
  for (const slot of CANONICAL_SLOTS) {
    const matches = manifest.slots.filter(s => s?.id === slot.id);
    if (matches.length !== 1 || matches[0].z !== slot.z) fail(`슬롯 ID/z 오류: ${slot.id}`);
  }
  for (const sex of ['female', 'male']) {
    const entries = manifest.sexes?.[sex]?.slots;
    if (!entries || Object.keys(entries).length !== 22) fail(`${sex}: 슬롯 22개가 필요합니다.`);
    for (const { id } of CANONICAL_SLOTS) {
      const entry = entries[id];
      if (!entry || typeof entry.enabled !== 'boolean' || !Array.isArray(entry.variants)) fail(`${sex}/${id}: enabled/variants 오류`);
      const mustDisable = sex === 'female' && ['beard', 'beard_back'].includes(id);
      if (entry.enabled === mustDisable) fail(`${sex}/${id}: 성별 적용 오류`);
      if (!entry.enabled && entry.variants.length) fail(`${sex}/${id}: 비활성 슬롯은 비어 있어야 합니다.`);
      const ids = new Set();
      for (const variant of entry.variants) {
        if (!variant || typeof variant.id !== 'string' || !variant.id || ids.has(variant.id)) fail(`${sex}/${id}: 중복 또는 잘못된 variant ID`);
        if (typeof variant.path !== 'string' || !variant.path.trim()) fail(`${sex}/${id}/${variant.id}: 이미지 path가 없습니다.`);
        ids.add(variant.id);
      }
    }
  }
  return manifest;
}

export async function loadManifest(url, fetcher = fetch) {
  try {
    const response = await fetcher(url, { cache: 'no-store' });
    if (!response.ok) fail(`HTTP ${response.status}`);
    return validateManifest(await response.json());
  } catch (error) {
    throw new Error(`라이브러리를 불러오지 못했습니다: ${error.message}`, { cause: error });
  }
}

export function createSelection(manifest, sex = 'female') {
  if (!['female', 'male'].includes(sex)) fail(`알 수 없는 성별: ${sex}`);
  return { version: 1, sex, selections: Object.fromEntries(CANONICAL_SLOTS.map(({ id }) => {
    const entry = manifest.sexes[sex].slots[id];
    return [id, entry.enabled ? entry.variants[0]?.id ?? null : null];
  })) };
}

function validateSelection(manifest, selection) {
  if (selection?.version !== 1 || !['female', 'male'].includes(selection.sex)) fail('선택 데이터 version/sex 오류');
  if (!selection.selections || Object.keys(selection.selections).length !== 22) fail('선택 데이터에 슬롯 22개가 필요합니다.');
  for (const { id, required } of CANONICAL_SLOTS) {
    if (!own(selection.selections, id)) fail(`선택 슬롯 누락: ${id}`);
    const value = selection.selections[id], entry = manifest.sexes[selection.sex].slots[id];
    if (value === null && (!entry.enabled || !required || !entry.variants.length)) continue;
    if (!entry.enabled || !entry.variants.some(v => v.id === value)) fail(`사용할 수 없는 선택: ${id}/${value}`);
  }
  return selection;
}

export function selectVariant(manifest, selection, slotId, variantId) {
  const next = { ...selection, selections: { ...selection.selections, [slotId]: variantId } };
  return validateSelection(manifest, next);
}

export function randomizeSelection(manifest, selection, rng = Math.random) {
  const next = createSelection(manifest, selection.sex);
  for (const { id } of CANONICAL_SLOTS) {
    const entry = manifest.sexes[selection.sex].slots[id];
    if (entry.enabled && entry.variants.length) {
      const value = rng();
      if (!(value >= 0 && value < 1)) fail('난수는 0 이상 1 미만이어야 합니다.');
      next.selections[id] = entry.variants[Math.floor(value * entry.variants.length)].id;
    }
  }
  // Avoid duplicate consecutive generations without retry loops or fabricated options.
  if (CANONICAL_SLOTS.every(({ id }) => next.selections[id] === selection.selections[id])) {
    const changeable = CANONICAL_SLOTS.find(({ id }) => manifest.sexes[selection.sex].slots[id].variants.length > 1);
    if (changeable) {
      const variants = manifest.sexes[selection.sex].slots[changeable.id].variants;
      next.selections[changeable.id] = variants[(variants.findIndex(v => v.id === next.selections[changeable.id]) + 1) % variants.length].id;
    }
  }
  return next;
}

export function serializeSelection(manifest, selection) {
  validateSelection(manifest, selection);
  return JSON.stringify({ version: 1, sex: selection.sex, selections: Object.fromEntries(CANONICAL_SLOTS.map(({ id }) => [id, selection.selections[id]])) }, null, 2);
}

export function parseSelection(manifest, json) {
  return validateSelection(manifest, JSON.parse(json));
}

export function addPortrait(history, selection, id) {
  return [...history, { id, selection: structuredClone(selection) }];
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`이미지를 불러오지 못했습니다: ${url}`));
    image.src = url;
  });
}

export async function composePortrait(canvas, manifest, selection, manifestURL, imageLoader = loadImage) {
  validateSelection(manifest, selection);
  const layers = [...manifest.slots].sort((a, b) => a.z - b.z).filter(({ id }) => selection.selections[id] !== null);
  const images = await Promise.all(layers.map(async ({ id }) => {
    const variant = manifest.sexes[selection.sex].slots[id].variants.find(v => v.id === selection.selections[id]);
    const image = await imageLoader(new URL(variant.path, manifestURL).href);
    if (image.naturalWidth !== manifest.canvas.width || image.naturalHeight !== manifest.canvas.height) {
      fail(`${id}/${variant.id}: 이미지 크기는 1145 × 1374이어야 합니다. (${image.naturalWidth} × ${image.naturalHeight})`);
    }
    return image;
  }));
  canvas.width = manifest.canvas.width;
  canvas.height = manifest.canvas.height;
  const context = canvas.getContext('2d');
  if (!context) fail('Canvas 2D를 사용할 수 없습니다.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  for (const image of images) context.drawImage(image, 0, 0);
  return canvas;
}

export function exportPNG(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG 내보내기에 실패했습니다.')), 'image/png');
  });
}
