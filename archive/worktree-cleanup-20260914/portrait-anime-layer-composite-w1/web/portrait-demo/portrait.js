const canvas = document.querySelector('#cv');
const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
const status = document.querySelector('#status');
const controls = [...document.querySelectorAll('[data-group]')];
const step = document.querySelector('#step');
const flags = new Map();
const images = new Map();
let recipe;
let schema;
let selection;
let current = [];
let revision = 0;
let ready = false;

function fail(error) {
  ready = false;
  canvas.dataset.ready = 'false';
  status.textContent = `부품을 불러오지 못했습니다: ${error.message}`;
  status.classList.add('error');
  status.setAttribute('role', 'alert');
  document.querySelector('#download').disabled = true;
}

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url.pathname}`);
  return response.json();
}

function loadImage(url) {
  if (!images.has(url.href)) images.set(url.href, new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`이미지 누락: ${url.pathname}`));
    image.src = url.href;
  }));
  return images.get(url.href);
}

function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  const background = document.querySelector('#background').value;
  document.querySelector('#art').className = `art ${background}`;
  const visible = current.filter((a) => !a.empty && flags.get(a.id) && !(a.id === 'bg' && background !== 'source'));
  const count = Math.min(Number(step.value), visible.length);
  for (const asset of visible.slice(0, count)) context.drawImage(asset.image, 0, 0);
  document.querySelector('#step-count').textContent = `${count} / ${visible.length}`;
  const label = controls.map((control) => control.selectedOptions[0].textContent).join(' · ');
  document.querySelector('#caption').textContent = `${label} · ${canvas.width} × ${canvas.height}`;
  canvas.dataset.selection = JSON.stringify(selection);
  canvas.dataset.ready = 'true';
  canvas.dataset.revision = String(++revision);
  canvas.dispatchEvent(new CustomEvent('portrait-rendered', { detail: { selection, revision } }));
}

function buildRows() {
  const box = document.querySelector('#rows');
  box.replaceChildren();
  for (const slot of schema.slots.toSorted((a, b) => a.z - b.z)) {
    const asset = current.find((a) => a.id === slot.id);
    const label = document.createElement('label');
    label.className = `row${!asset || asset.empty ? ' disabled' : ''}`;
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.dataset.slot = slot.id;
    toggle.checked = !!asset && !asset.empty && flags.get(slot.id);
    toggle.disabled = !asset || asset.empty;
    toggle.addEventListener('change', () => { flags.set(slot.id, toggle.checked); render(); });
    const z = document.createElement('span'); z.textContent = String(slot.z);
    const name = document.createElement('span'); name.textContent = slot.id;
    const note = document.createElement('small'); note.textContent = !asset ? '미사용' : asset.empty ? '빈 슬롯' : '';
    label.append(toggle, z, name, note);box.append(label);
  }
}

function pick() {
  selection = Object.fromEntries(controls.map((control) => [control.dataset.group, control.value]));
  for (const [group, spec] of Object.entries(recipe.groups)) {
    if (!spec.variants.includes(selection[group])) throw new Error(`잘못된 선택: ${group}`);
  }
  current = recipe.assets.filter((a) => !a.group || a.variant === selection[a.group]).toSorted((a, b) => a.z - b.z);
  for (const slot of schema.slots) {
    const matches = current.filter((asset) => asset.id === slot.id);
    if (slot.required && matches.length === 0) throw new Error(`필수 부품 누락: ${slot.id}`);
    if (matches.length > 1) throw new Error(`중복된 부품: ${slot.id}`);
  }
  for (const [group, spec] of Object.entries(recipe.groups)) {
    if (spec.slots.some((id) => !current.some((a) => a.group === group && a.id === id))) throw new Error(`연결된 부품 누락: ${group}`);
  }
  step.max = String(current.filter((a) => !a.empty).length);
  step.value = step.max;
  buildRows();render();
}

async function start() {
  const requested = new URLSearchParams(location.search).get('recipe');
  const recipeUrl = new URL(requested || './assets/recipe.json', location.href);
  if (recipeUrl.origin !== location.origin) throw new Error('같은 사이트의 레시피만 사용할 수 있습니다.');
  recipe = await json(recipeUrl);
  schema = await json(new URL('./assets/slots.json', location.href));
  canvas.width = recipe.canvas.width;canvas.height = recipe.canvas.height;
  await Promise.all(recipe.assets.map(async (asset) => {
    asset.z = schema.slots.find((s) => s.id === asset.id)?.z;
    if (asset.z === undefined) throw new Error(`알 수 없는 슬롯: ${asset.id}`);
    if (!asset.empty) {
      asset.image = await loadImage(new URL(asset.path, recipeUrl));
      if (asset.image.width !== canvas.width || asset.image.height !== canvas.height) throw new Error(`부품 크기 불일치: ${asset.id}`);
    }
    flags.set(asset.id, true);
  }));
  document.querySelector('#reference').src = new URL(recipe.target.path, recipeUrl).href;
  controls.forEach((control) => { control.disabled = false;control.value = recipe.defaultSelection[control.dataset.group];control.addEventListener('change', () => { try { pick(); } catch (error) { fail(error); } }); });
  ready = true;pick();
  status.textContent = '연결된 부품을 불러왔습니다. 원본 배경의 기본 조합으로 타겟을 대조하세요.';
  document.querySelector('#reset').disabled = false;
  document.querySelector('#download').disabled = false;
}

step.addEventListener('input', () => { if (ready) render(); });
document.querySelector('#background').addEventListener('change', () => { if (ready) render(); });
document.querySelector('#compare').addEventListener('change', (event) => { document.querySelector('#reference-wrap').hidden = !event.target.checked; });
document.querySelector('#reset').addEventListener('click', () => { controls.forEach((control) => { control.value = recipe.defaultSelection[control.dataset.group]; });flags.forEach((_, key) => flags.set(key, true));document.querySelector('#background').value = 'source';pick(); });
document.querySelector('#download').addEventListener('click', () => { canvas.toBlob((blob) => { if (!blob) return;const url = URL.createObjectURL(blob);const link = document.createElement('a');link.href = url;link.download = `${selection.hair}-${selection.eyes}-${selection.outfit}.png`;link.click();setTimeout(() => URL.revokeObjectURL(url), 0); }); });
start().catch(fail);
