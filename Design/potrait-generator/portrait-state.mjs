import { compositeBrowserPixels } from './portrait-browser-composite.mjs';
import { loadPngPixels } from './portrait-browser-png.mjs';

// UI contract mirror. Tool's canonical schema remains authoritative and is tested for parity.
export const CANONICAL_SLOTS = Object.freeze([
  ['bg', '배경', false], ['clothes_back', '의상 뒤', false], ['headgear_back', '머리장식 뒤', false],
  ['hair_back', '뒷머리', true], ['beard_back', '수염 뒤', false], ['face_base', '얼굴 바탕', true],
  ['neck', '목', true], ['cheeks', '볼', true], ['chin', '턱', true], ['mouth', '입', true],
  ['nose', '코', true], ['eyes_white', '흰자', true], ['eyes_color', '검은자 · 홍채', true], ['eyes_shape', '눈매', true],
  ['ears', '귀', true], ['clothes', '의상', true], ['headgear_mid', '머리장식 중간', false],
  ['beard', '수염', false], ['hair', '헤어', false], ['clothes_front', '의상 앞', false],
  ['headgear', '머리장식 앞', false], ['acc_eye', '안경 · 눈 장식', false], ['frame', '프레임', false]
].map(([id, label, required], z) => Object.freeze({ id, z, label, required })));

function fail(message) { throw new Error(message); }
const own = (value, key) => Object.hasOwn(value, key);
const MODES = new Set(['selectable', 'fixed', 'companion', 'disabled']);
const REQUIRED_BUNDLES = Object.freeze({
  clothes: Object.freeze({ primary: 'clothes', members: Object.freeze(['clothes_back', 'clothes', 'clothes_front']) }),
  hair: Object.freeze({ primary: 'hair', members: Object.freeze(['hair_back', 'hair']) }),
  face_shape: Object.freeze({ primary: 'face_base', members: Object.freeze(['face_base', 'cheeks', 'chin']) }),
});
const bundleForMember = (manifest, slotId) => Object.values(manifest.logical_bundles ?? {})
  .find(bundle => bundle.members.includes(slotId)) ?? null;

// A companion layer belongs to one specific primary variant: a hood's neck folds (headgear_mid)
// exist only for the hood, a collar (clothes_back) only for its own garment. Without this link the
// single registered hood fold is drawn under every hat, which measurably occluded the entire mouth
// owner. Only required=false slots may be companion-bound, so an unmatched companion is legally
// null and composePortrait simply does not draw it.
const companionLink = (variant) => (variant && own(variant, 'companion_of') ? variant.companion_of : null);
const companionMatches = (variant, selections) => {
  const link = companionLink(variant);
  if (!link) return false;
  const targets = Array.isArray(link.variants) ? link.variants : [link.variant];
  return targets.includes(selections[link.slot]);
};

function validateLocalImage(path, location, manifest, sex, quality = null) {
  if (typeof path !== 'string' || !path.trim()) fail(`${location}: 이미지 path가 없습니다.`);
  const normalized = path.replaceAll('\\', '/');
  const evidencePreview = manifest.stage === 'stage23-preview'
    && quality === 'PREVIEW'
    && normalized.startsWith(`/.omo/evidence/portrait-stage23/pilot/${sex}/`);
  if (/^(?:[a-z]+:)?\/\//i.test(normalized) || (!evidencePreview && normalized.startsWith('/'))
    || normalized.split('/').includes('..') || /[?#\0]/.test(normalized)) {
    fail(`${location}: assets/v2 내부 상대 path가 필요합니다.`);
  }
}

export function resolveVariantRender(variant, selections) {
  return variant.render_overrides?.find(override => selections[override.when.slot] === override.when.variant) ?? variant;
}

function isCompanionBoundEntry(entry) {
  return entry?.mode === 'companion';
}

export function isCompanionBound(manifest, sex, slotId) {
  return isCompanionBoundEntry(manifest?.sexes?.[sex]?.slots?.[slotId]);
}

// A companion slot is derived, never freely chosen: its value is the variant whose link matches the
// current primary selection, or null when the chosen primary has no companion.
export function resolveCompanionSlots(manifest, selection) {
  const selections = { ...selection.selections };
  for (const { id } of CANONICAL_SLOTS) {
    const entry = manifest.sexes[selection.sex].slots[id];
    if (!isCompanionBoundEntry(entry)) continue;
    const match = entry.variants.find(v => companionMatches(v, selections));
    selections[id] = match?.id ?? null;
  }
  return { ...selection, selections };
}

export function validateManifest(manifest) {
  if (manifest?.version !== 1) fail('라이브러리 version은 1이어야 합니다.');
  const minimumContractRequired = manifest.minimum_contract_policy === 'required';
  if (manifest.stage !== undefined && typeof manifest.stage !== 'string') fail('라이브러리 stage는 문자열이어야 합니다.');
  if (manifest.canvas?.width !== 1145 || manifest.canvas?.height !== 1374) fail('캔버스는 1145 × 1374이어야 합니다.');
  if (!Array.isArray(manifest.slots) || manifest.slots.length !== CANONICAL_SLOTS.length) fail(`표준 슬롯 ${CANONICAL_SLOTS.length}개가 필요합니다.`);
  for (const slot of CANONICAL_SLOTS) {
    const matches = manifest.slots.filter(s => s?.id === slot.id);
    if (matches.length !== 1 || matches[0].z !== slot.z) fail(`슬롯 ID/z 오류: ${slot.id}`);
  }
  for (const [id, expected] of Object.entries(REQUIRED_BUNDLES)) {
    const actual = manifest.logical_bundles?.[id];
    if (!actual || actual.primary !== expected.primary || JSON.stringify(actual.members) !== JSON.stringify(expected.members)) {
      fail(`논리 bundle 오류: ${id}`);
    }
  }
  for (const sex of ['female', 'male']) {
    const entries = manifest.sexes?.[sex]?.slots;
    if (!entries || Object.keys(entries).length !== CANONICAL_SLOTS.length) fail(`${sex}: 슬롯 ${CANONICAL_SLOTS.length}개가 필요합니다.`);
    for (const { id } of CANONICAL_SLOTS) {
      const entry = entries[id];
      if (!entry || !MODES.has(entry.mode) || typeof entry.enabled !== 'boolean' || !Array.isArray(entry.variants)) fail(`${sex}/${id}: mode/enabled/variants 오류`);
      if (entry.enabled !== (entry.mode !== 'disabled')) fail(`${sex}/${id}: mode/enabled 불일치`);
      if (entry.mode === 'disabled' && entry.variants.length) fail(`${sex}/${id}: 비활성 슬롯은 비어 있어야 합니다.`);
      if (entry.mode === 'fixed' && entry.variants.length !== 1) fail(`${sex}/${id}: fixed 슬롯은 플레이트 1개가 필요합니다.`);
      if (entry.preview_optional === true && (manifest.stage !== 'stage23-preview' || !entry.enabled || entry.variants.length)) {
        fail(`${sex}/${id}: preview_optional은 stage23-preview의 빈 활성 슬롯에만 사용할 수 있습니다.`);
      }
      const ids = new Set();
      for (const variant of entry.variants) {
        if (!variant || typeof variant.id !== 'string' || !variant.id || ids.has(variant.id)) fail(`${sex}/${id}: 중복 또는 잘못된 variant ID`);
        if (!/^[0-9a-f]{64}$/.test(variant.sha256)) fail(`${sex}/${id}/${variant.id}: sha256이 필요합니다.`);
        if ((minimumContractRequired || variant.minimum_contract !== undefined) && (variant.minimum_contract?.status !== 'PASS' || typeof variant.minimum_contract.record !== 'string'
          || !/^[0-9a-f]{64}$/.test(variant.minimum_contract.record_sha256 ?? ''))) {
          fail(`${sex}/${id}/${variant.id}: 최소 계약 PASS가 필요합니다.`);
        }
        if (manifest.slot_validity_policy === 'gates-1-4') {
          const validity = variant.slot_validity;
          if (!validity || validity.policy !== 'gates-1-4' || !['verified', 'provisional'].includes(validity.status)) {
            fail(`${sex}/${id}/${variant.id}: 게이트 1~4 체인 slot_validity가 필요합니다.`);
          }
          if (validity?.status === 'verified' && ['gate1', 'gate2', 'gate3', 'gate4'].some(gate => validity.gates?.[gate] !== 'PASS')) {
            fail(`${sex}/${id}/${variant.id}: verified는 1~4차 모두 PASS여야 합니다.`);
          }
        }
        validateLocalImage(variant.path, `${sex}/${id}/${variant.id}`, manifest, sex, variant.sex === sex ? variant.quality : null);
        const conditions = new Set();
        for (const override of variant.render_overrides ?? []) {
          const location = `${sex}/${id}/${variant.id}/render_override`;
          const when = override?.when;
          if (!when || typeof when.slot !== 'string' || typeof when.variant !== 'string' || when.slot === id) {
            fail(`${location}: when slot/variant가 잘못되었습니다.`);
          }
          const target = entries[when.slot];
          if (!target?.enabled || !target.variants.some(candidate => candidate.id === when.variant)) {
            fail(`${location}: 조건 대상 variant가 없습니다.`);
          }
          const key = `${when.slot}\0${when.variant}`;
          if (conditions.has(key)) fail(`${location}: 조건이 중복되었습니다.`);
          conditions.add(key);
          validateLocalImage(override.path, location, manifest, sex);
          if (!/^[0-9a-f]{64}$/.test(override.sha256)) fail(`${location}: sha256이 필요합니다.`);
        }
        if (entry.mode === 'companion' && !own(variant, 'companion_of')) fail(`${sex}/${id}/${variant.id}: companion_of가 필요합니다.`);
        if (own(variant, 'companion_of')) {
          const link = variant.companion_of;
          const targets = Array.isArray(link?.variants) ? link.variants : [link?.variant];
          if (!link || typeof link.slot !== 'string' || targets.length === 0 || targets.some(targetId => typeof targetId !== 'string')) {
            fail(`${sex}/${id}/${variant.id}: companion_of에는 slot과 variant/variants가 필요합니다.`);
          }
          const self = CANONICAL_SLOTS.find(s => s.id === id);
          const bundle = bundleForMember(manifest, id);
          if (self?.required && bundle?.primary !== link.slot) {
            fail(`${sex}/${id}: 필수 슬롯은 같은 논리 bundle primary에만 묶을 수 있습니다.`);
          }
          if (entry.mode !== 'companion') fail(`${sex}/${id}: companion 슬롯만 companion_of를 사용할 수 있습니다.`);
          if (link.slot === id || !CANONICAL_SLOTS.some(s => s.id === link.slot)) {
            fail(`${sex}/${id}/${variant.id}: companion_of.slot이 잘못되었습니다.`);
          }
          const target = entries[link.slot];
          if (!target?.enabled || targets.some(targetId => !target.variants.some(v => v.id === targetId))) {
            fail(`${sex}/${id}/${variant.id}: companion_of 대상 variant가 없습니다.`);
          }
        }
        ids.add(variant.id);
      }
    }
    // Single level only: a companion may not point at another companion-bound slot, so resolution
    // is order-independent and cannot cycle.
    for (const { id } of CANONICAL_SLOTS) {
      const entry = entries[id];
      if (!isCompanionBoundEntry(entry)) continue;
      for (const variant of entry.variants) {
        if (isCompanionBoundEntry(entries[companionLink(variant).slot])) {
          fail(`${sex}/${id}/${variant.id}: companion은 다른 companion 슬롯을 참조할 수 없습니다.`);
        }
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
  return resolveCompanionSlots(manifest, { version: 1, sex, selections: Object.fromEntries(CANONICAL_SLOTS.map(({ id }) => {
    const entry = manifest.sexes[sex].slots[id];
    return [id, entry.mode === 'disabled' || entry.mode === 'companion' ? null : entry.variants[0]?.id ?? null];
  })) });
}

function validateSelection(manifest, selection) {
  if (selection?.version !== 1 || !['female', 'male'].includes(selection.sex)) fail('선택 데이터 version/sex 오류');
  if (!selection.selections || Object.keys(selection.selections).length !== manifest.slots.length) fail(`선택 데이터에 슬롯 ${manifest.slots.length}개가 필요합니다.`);
  for (const { id, required } of CANONICAL_SLOTS) {
    if (!own(selection.selections, id)) fail(`선택 슬롯 누락: ${id}`);
    const value = selection.selections[id], entry = manifest.sexes[selection.sex].slots[id];
    const previewOptional = manifest.stage === 'stage23-preview' && entry.preview_optional === true;
    if (entry.mode === 'fixed' && value !== null && value !== entry.variants[0]?.id) fail(`fixed 슬롯 불일치: ${id}/${value}`);
    if (value === null && (entry.mode === 'disabled' || entry.mode === 'companion' || entry.mode === 'fixed' || !required || previewOptional)) continue;
    if (!entry.enabled || !entry.variants.some(v => v.id === value)) fail(`사용할 수 없는 선택: ${id}/${value}`);
  }
  // A companion slot carrying anything other than its derived value is an incoherent combination -
  // exactly the defect where a previous outfit's collar survives a garment change.
  const derived = resolveCompanionSlots(manifest, selection).selections;
  for (const { id } of CANONICAL_SLOTS) {
    if (!isCompanionBoundEntry(manifest.sexes[selection.sex].slots[id])) continue;
    if (selection.selections[id] !== derived[id]) fail(`companion 슬롯 불일치: ${id}/${selection.selections[id]}`);
  }
  return selection;
}

export function missingRequiredSlots(manifest, selection) {
  return CANONICAL_SLOTS.filter(({ id, required }) => required
    && manifest.sexes[selection.sex].slots[id].mode === 'selectable'
    && !selection.selections[id]
    && !(manifest.stage === 'stage23-preview' && manifest.sexes[selection.sex].slots[id].preview_optional === true));
}

export function selectVariant(manifest, selection, slotId, variantId) {
  const entry = manifest.sexes[selection.sex].slots[slotId];
  if (!['selectable', 'fixed'].includes(entry?.mode)) fail(`선택할 수 없는 슬롯: ${slotId}`);
  if (entry.mode === 'fixed' && variantId !== null && variantId !== entry.variants[0]?.id) fail(`사용할 수 없는 선택: ${slotId}/${variantId}`);
  const next = resolveCompanionSlots(manifest, { ...selection, selections: { ...selection.selections, [slotId]: variantId } });
  return validateSelection(manifest, next);
}

export function randomizeSelection(manifest, selection, rng = Math.random) {
  const next = structuredClone(selection);
  for (const { id } of CANONICAL_SLOTS) {
    const entry = manifest.sexes[selection.sex].slots[id];
    if (entry.mode === 'selectable' && entry.variants.length) {
      const value = rng();
      if (!(value >= 0 && value < 1)) fail('난수는 0 이상 1 미만이어야 합니다.');
      next.selections[id] = entry.variants[Math.floor(value * entry.variants.length)].id;
    }
  }
  let resolved = resolveCompanionSlots(manifest, next);
  // Avoid duplicate consecutive generations without retry loops or fabricated options. A companion
  // slot is derived, so nudging one would be overwritten; pick a freely selectable slot instead.
  if (CANONICAL_SLOTS.every(({ id }) => resolved.selections[id] === selection.selections[id])) {
    const changeable = CANONICAL_SLOTS.find(({ id }) => manifest.sexes[selection.sex].slots[id].mode === 'selectable'
      && manifest.sexes[selection.sex].slots[id].variants.length > 1);
    if (changeable) {
      const variants = manifest.sexes[selection.sex].slots[changeable.id].variants;
      resolved.selections[changeable.id] = variants[(variants.findIndex(v => v.id === resolved.selections[changeable.id]) + 1) % variants.length].id;
      resolved = resolveCompanionSlots(manifest, resolved);
    }
  }
  return resolved;
}

export function canRandomizeSelection(manifest, selection) {
  return CANONICAL_SLOTS.some(({ id }) => manifest.sexes[selection.sex].slots[id].mode === 'selectable'
    && manifest.sexes[selection.sex].slots[id].variants.length > 1);
}

export function serializeSelection(manifest, selection) {
  validateSelection(manifest, selection);
  return JSON.stringify({
    version: 2,
    sex: selection.sex,
    selections: Object.fromEntries(CANONICAL_SLOTS
      .map(({ id }) => id)
      .filter(id => ['selectable', 'fixed'].includes(manifest.sexes[selection.sex].slots[id].mode))
      .map(id => [id, selection.selections[id]]))
  }, null, 2);
}

export function parseSelection(manifest, json) {
  const parsed = JSON.parse(json);
  if (parsed?.version !== 2 || !['female', 'male'].includes(parsed.sex) || !parsed.selections || Array.isArray(parsed.selections)) {
    fail('선택 데이터 version/sex 오류');
  }
  let selection = createSelection(manifest, parsed.sex);
  const allowed = new Set(CANONICAL_SLOTS.map(({ id }) => id)
    .filter(id => ['selectable', 'fixed'].includes(manifest.sexes[parsed.sex].slots[id].mode)));
  for (const id of Object.keys(parsed.selections)) if (!allowed.has(id)) fail(`파생 슬롯은 선택 JSON에 넣을 수 없습니다: ${id}`);
  for (const id of allowed) {
    if (!own(parsed.selections, id)) fail(`선택 슬롯 누락: ${id}`);
    selection = selectVariant(manifest, selection, id, parsed.selections[id]);
  }
  return validateSelection(manifest, selection);
}

export function logicalControlSlots(manifest, sex) {
  return CANONICAL_SLOTS.filter(({ id }) => ['selectable', 'fixed'].includes(manifest.sexes[sex].slots[id].mode));
}

export function logicalBundleForPrimary(manifest, slotId) {
  return Object.entries(manifest.logical_bundles ?? {}).find(([, bundle]) => bundle.primary === slotId)?.[0] ?? null;
}

export function addPortrait(history, selection, id) {
  return [...history, { id, selection: structuredClone(selection) }];
}

export const loadImage = loadPngPixels;

export async function composePortrait(canvas, manifest, selection, manifestURL, imageLoader = loadImage, mountedMembers = []) {
  validateSelection(manifest, selection);
  const mounted = new Map(mountedMembers.map(member => [member.slot, member]));
  const layers = [...manifest.slots].sort((a, b) => a.z - b.z)
    .filter(({ id }) => selection.selections[id] !== null || mounted.has(id));
  const images = await Promise.all(layers.map(async ({ id }) => {
    const mountedMember = mounted.get(id);
    if (mountedMember) {
      const image = await imageLoader(new URL(mountedMember.path, manifestURL).href);
      if (image.naturalWidth !== manifest.canvas.width || image.naturalHeight !== manifest.canvas.height) {
        fail(`${id}/mounted-candidate: 이미지 크기는 1145 × 1374이어야 합니다. (${image.naturalWidth} × ${image.naturalHeight})`);
      }
      return { image, blendMode: mountedMember.blend_mode ?? 'source-over' };
    }
    const variant = manifest.sexes[selection.sex].slots[id].variants.find(v => v.id === selection.selections[id]);
    const render = resolveVariantRender(variant, selection.selections);
    const image = await imageLoader(new URL(render.path, manifestURL).href);
    if (image.naturalWidth !== manifest.canvas.width || image.naturalHeight !== manifest.canvas.height) {
      fail(`${id}/${variant.id}: 이미지 크기는 1145 × 1374이어야 합니다. (${image.naturalWidth} × ${image.naturalHeight})`);
    }
    return { image, blendMode: render.blend_mode ?? variant.blend_mode ?? 'source-over' };
  }));
  canvas.width = manifest.canvas.width;
  canvas.height = manifest.canvas.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) fail('Canvas 2D를 사용할 수 없습니다.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (typeof document === 'undefined' || typeof ImageData === 'undefined') {
    for (const { image, blendMode } of images) {
      context.globalCompositeOperation = blendMode;
      context.drawImage(image, 0, 0);
    }
    context.globalCompositeOperation = 'source-over';
    return canvas;
  }
  const pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
  const decodeCanvas = document.createElement('canvas'); decodeCanvas.width = canvas.width; decodeCanvas.height = canvas.height;
  const decode = decodeCanvas.getContext('2d', { willReadFrequently: true });
  if (!decode) fail('레이어 decode Canvas 2D를 사용할 수 없습니다.');
  for (const { image, blendMode } of images) {
    if (image.pixels) compositeBrowserPixels(pixels, image.pixels, blendMode);
    else {
      decode.clearRect(0, 0, decodeCanvas.width, decodeCanvas.height); decode.drawImage(image, 0, 0);
      compositeBrowserPixels(pixels, decode.getImageData(0, 0, decodeCanvas.width, decodeCanvas.height).data, blendMode);
    }
  }
  context.putImageData(new ImageData(pixels, canvas.width, canvas.height), 0, 0);
  return canvas;
}

export function exportPNG(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG 내보내기에 실패했습니다.')), 'image/png');
  });
}
