import { mountAvatarViewer } from './avatar-viewer.mjs';

const status = document.querySelector('#viewer-status');
const list = document.querySelector('#element-list');
const count = document.querySelector('#element-count');
const filter = document.querySelector('#element-filter');
const filterStatus = document.querySelector('#filter-status');
let viewer;
let elements = [];
const cameraControls = [...document.querySelectorAll('.camera-actions button')];
const viewport = document.querySelector('#viewport');

start().catch(error => {
  status.textContent = 'Error';
  status.dataset.state = 'error';
  list.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  console.error(error);
});

async function start() {
  viewer = await mountAvatarViewer({ container: document.querySelector('#viewport'), contractUrl: '/avatar/female-underwear/avatar-contract.json' });
  elements = viewer.contract.elements.map(element => ({ ...element, visible: element.defaultVisible }));
  status.textContent = 'Ready';
  status.dataset.state = 'ready';
  viewport.disabled = false;
  for (const control of cameraControls) control.disabled = false;
  renderList();
}

filter.addEventListener('input', renderList);
document.querySelector('#show-all').addEventListener('click', () => setAll(true));
document.querySelector('#hide-all').addEventListener('click', () => setAll(false));
document.querySelector('#fit-avatar').addEventListener('click', () => viewer.fit());
document.querySelector('#orbit-left').addEventListener('click', () => viewer.orbit(Math.PI / 12));
document.querySelector('#orbit-right').addEventListener('click', () => viewer.orbit(-Math.PI / 12));
document.querySelector('#orbit-up').addEventListener('click', () => viewer.orbitVertical(Math.PI / 24));
document.querySelector('#orbit-down').addEventListener('click', () => viewer.orbitVertical(-Math.PI / 24));
document.querySelector('#zoom-in').addEventListener('click', () => viewer.zoom(0.82));
document.querySelector('#zoom-out').addEventListener('click', () => viewer.zoom(1.18));
viewport.addEventListener('keydown', event => {
  if (!viewer) return;
  if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    viewer.pan(event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0, event.key === 'ArrowDown' ? -1 : event.key === 'ArrowUp' ? 1 : 0);
    return;
  }
  const actions = {
    ArrowLeft: () => viewer.orbit(Math.PI / 24),
    ArrowRight: () => viewer.orbit(-Math.PI / 24),
    ArrowUp: () => viewer.orbitVertical(Math.PI / 48),
    ArrowDown: () => viewer.orbitVertical(-Math.PI / 48),
    '+': () => viewer.zoom(0.9),
    '=': () => viewer.zoom(0.9),
    '-': () => viewer.zoom(1.1),
    f: () => viewer.fit(),
    F: () => viewer.fit(),
  };
  const action = actions[event.key];
  if (!action) return;
  event.preventDefault();
  action();
});
window.addEventListener('pagehide', () => viewer?.dispose(), { once: true });

function setAll(visible) {
  for (const element of elements) {
    element.visible = visible;
    viewer.setVisible(element.objectName, visible);
  }
  renderList();
}

function renderList() {
  const query = filter.value.trim().toLowerCase();
  const filtered = elements.filter(element => `${element.objectName} ${element.id} ${element.category}`.toLowerCase().includes(query));
  const groups = Map.groupBy(filtered, element => element.category);
  list.replaceChildren(...[...groups].sort(([a], [b]) => a.localeCompare(b)).map(([category, group]) => {
    const section = document.createElement('section');
    section.className = 'element-group';
    section.innerHTML = `<h3>${escapeHtml(category)}</h3>`;
    for (const element of group) section.append(createRow(element));
    return section;
  }));
  if (!filtered.length) list.innerHTML = '<p class="empty-state">일치하는 요소가 없습니다</p>';
  filterStatus.textContent = `검색 결과 ${filtered.length}개`;
  count.textContent = `${elements.filter(element => element.visible).length} / ${elements.length} 표시`;
}

function createRow(element) {
  const label = document.createElement('label');
  label.className = 'element-row';
  label.innerHTML = `<span class="element-copy"><span class="element-name">${escapeHtml(element.objectName)}</span><span class="element-id">${escapeHtml(element.id)}</span></span>`;
  const input = document.createElement('input');
  input.className = 'element-toggle';
  input.type = 'checkbox';
  input.checked = element.visible;
  input.dataset.elementId = element.id;
  input.addEventListener('change', () => {
    element.visible = input.checked;
    viewer.setVisible(element.objectName, element.visible);
    count.textContent = `${elements.filter(item => item.visible).length} / ${elements.length} 표시`;
  });
  label.append(input);
  return label;
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
