import { CANONICAL_SLOTS, loadManifest, createSelection, selectVariant, randomizeSelection, serializeSelection, parseSelection, addPortrait, composePortrait, exportPNG, missingRequiredSlots, canRandomizeSelection } from './portrait-state.mjs';
import { validatePortraitWorkflow } from '../../Tool/art/portrait/portrait-gateway.mjs';
import { createPortraitWorkflowUI } from './portrait-workflow-ui.mjs';

const manifestURL = new URL('./assets/v2/library.json', import.meta.url).href;
const workflowURL = new URL('./assets/v2/workflow.json', import.meta.url).href;
const storageKey = 'janseon.portrait-studio.selections.v1';
const $ = selector => document.querySelector(selector);
const canvas = $('#portrait-canvas');
let manifest, selection, workflowUI, history = [], revision = 0, ready = false;
const thumbnails = new Map();

function showError(error) {
  $('#error').textContent = error.message;
  $('#error').hidden = false;
}
function clearError() { $('#error').hidden = true; $('#error').textContent = ''; }
function setReady(value) {
  ready = value;
  const caps = workflowUI?.capabilities;
  for (const id of ['export', 'save', 'export-selection']) $(`#${id}`).disabled = !value || !caps?.export;
  $('#randomize').disabled = !value || !caps?.combinations || !manifest || !selection || !canRandomizeSelection(manifest, selection);
  $('#controls-lock').textContent = caps?.combinations
    ? '2차 부품 게이트 통과 · 검증된 슬롯 조합만 편집합니다.'
    : '2차 부품 게이트 PASS 전 슬롯 편집과 랜덤 조합은 잠깁니다.';
  $('#action-lock').textContent = caps?.export
    ? '3차 조합 게이트 통과 · 보관, 선택 JSON, PNG 내보내기가 열렸습니다.'
    : caps?.combinations
      ? '조합 미리보기는 가능하지만 3차 조합 게이트 PASS 전 보관·내보내기는 잠깁니다.'
      : '2차 PASS 전 조합을 잠그고, 3차 PASS 전 보관·선택 JSON·PNG 내보내기를 잠급니다.';
  $('#sex').disabled = !caps?.combinations;
  for (const input of document.querySelectorAll('[data-slot]')) input.disabled ||= !caps?.combinations;
}
function renderControls() {
  const fragment = document.createDocumentFragment();
  for (const { id, label, z, required } of CANONICAL_SLOTS) {
    const entry = manifest?.sexes[$('#sex').value].slots[id];
    const disabledForSex = $('#sex').value === 'female' && ['beard', 'beard_back'].includes(id);
    const disabled = !entry?.enabled || !entry.variants.length;
    const row = document.createElement('div'); row.className = 'slot-control'; row.dataset.disabled = disabled;
    const title = document.createElement('label'); title.htmlFor = `slot-${id}`; title.className = 'slot-label';
    const name = document.createElement('span');
    const number = document.createElement('span'); number.className = 'slot-number'; number.textContent = String(z + 1).padStart(2, '0');
    name.append(number, label);
    const count = document.createElement('span'); count.className = 'slot-count';
    count.textContent = disabledForSex ? '미적용' : `${entry?.variants.length ?? 0}종`;
    title.append(name, count);
    const input = document.createElement('select'); input.id = `slot-${id}`; input.dataset.slot = id; input.disabled = disabled;
    if (disabled) input.add(new Option(disabledForSex ? '여성 미적용' : '변형 없음', ''));
    else {
      if (!required) input.add(new Option('없음 · 투명', ''));
      for (const variant of entry.variants) input.add(new Option(variant.label ?? variant.name ?? variant.id, variant.id));
      input.value = selection.selections[id] ?? '';
    }
    input.addEventListener('change', () => {
      try {
        if (!workflowUI?.capabilities.combinations) throw new Error('1·2차 게이트 PASS 전 슬롯 조합은 금지됩니다.');
        selection = selectVariant(manifest, selection, id, input.value || null); void renderPortrait();
      }
      catch (error) { showError(error); }
    });
    row.append(title, input); fragment.append(row);
  }
  $('#slot-controls').replaceChildren(fragment);
}

function updateNotice() {
  const entries = Object.values(manifest.sexes[selection.sex].slots).filter(entry => entry.enabled);
  const incomplete = entries.filter(entry => entry.variants.length < 10);
  if (manifest.stage === 'stage1-derived') {
    $('#library-notice').textContent = `Stage1 실물 플레이트 파생 미리보기 · Stage2/3 품질 승인본이 아닙니다. 적용 슬롯 ${entries.length}개 중 ${incomplete.length}개가 10종 미만이며 빈 레이어와 시험용 색상 변형을 포함합니다.`;
    return;
  }
  if (!workflowUI?.capabilities.combinations) {
    $('#library-notice').textContent = `읽기 전용 미리보기 · 적용 슬롯 ${entries.length}개 중 ${incomplete.length}개가 10종 미만입니다. 2차 부품 게이트 PASS 전 슬롯 편집은 잠깁니다.`;
    return;
  }
  $('#library-notice').textContent = incomplete.length
    ? `라이브러리 준비 중 · 적용 슬롯 ${entries.length}개 중 ${incomplete.length}개가 10종 미만입니다. 제공된 변형만 편집할 수 있습니다. 에셋 품질 검수는 별도입니다.`
    : `적용 슬롯 ${entries.length}개 · 각 슬롯에 10종 이상이 등록되어 있습니다. 이 수치는 이미지 품질 검수 완료를 의미하지 않습니다.`;
}

async function renderPortrait({ record = false } = {}) {
  const currentRevision = ++revision;
  const currentSelection = structuredClone(selection);
  clearError(); setReady(false);
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  $('#preview-state').textContent = '합성 중';
  $('#empty-preview').hidden = false;
  $('#empty-preview strong').textContent = '레이어를 불러오는 중';
  $('#status').textContent = '';
  canvas.dataset.state = 'loading';
  updateNotice();
  try {
    const missing = missingRequiredSlots(manifest, currentSelection);
    if (missing.length) throw new Error(`필수 부위가 없습니다: ${missing.map(s => s.label).join(', ')}. 라이브러리가 준비되면 다시 읽어 주세요.`);
    const staging = document.createElement('canvas');
    await composePortrait(staging, manifest, currentSelection, manifestURL);
    if (currentRevision !== revision) return false;
    canvas.width = staging.width; canvas.height = staging.height;
    const context = canvas.getContext('2d'); context.globalCompositeOperation = 'source-over'; context.drawImage(staging, 0, 0);
    $('#empty-preview').hidden = true;
    $('#preview-state').textContent = currentSelection.sex === 'female' ? '여성 · 합성 완료' : '남성 · 합성 완료';
    $('#status').textContent = '선택한 레이어를 원본 크기로 합성했습니다.';
    canvas.dataset.state = 'ready'; setReady(true);
    if (record) savePortrait();
    document.dispatchEvent(new CustomEvent('portrait:ready', { detail: currentSelection }));
    return true;
  } catch (error) {
    if (currentRevision !== revision) return false;
    setReady(false); showError(error);
    $('#preview-state').textContent = '합성 불가';
    $('#empty-preview strong').textContent = '초상을 합성할 수 없어요';
    canvas.dataset.state = 'error';
    document.dispatchEvent(new CustomEvent('portrait:error', { detail: error.message }));
    return false;
  }
}

function persistHistory() {
  try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, portraits: history })); }
  catch (error) { showError(new Error(`브라우저에 보관하지 못했습니다. 선택 정보를 JSON으로 내보내 주세요: ${error.message}`)); }
}
function savePortrait() {
  if (!workflowUI?.capabilities.export) throw new Error('1·2·3차 게이트 PASS 전 현재 조합 보관은 금지됩니다.');
  const id = crypto.randomUUID();
  history = addPortrait(history, selection, id);
  thumbnails.set(id, canvas.toDataURL('image/png'));
  persistHistory(); renderHistory();
  $('#status').textContent = `초상 ${history.length}개를 보관했습니다.`;
}
function renderHistory() {
  $('#history-count').textContent = history.length;
  $('#history-empty').hidden = history.length > 0;
  const fragment = document.createDocumentFragment();
  history.forEach((portrait, index) => {
    const card = document.createElement('article'); card.className = 'history-card';
    if (thumbnails.has(portrait.id)) {
      const image = document.createElement('img'); image.src = thumbnails.get(portrait.id); image.alt = `보관한 초상 ${index + 1}`; card.append(image);
    }
    const restore = document.createElement('button'); restore.textContent = `초상 ${String(index + 1).padStart(2, '0')} 불러오기`;
    const sexLabel = document.createElement('span'); sexLabel.textContent = portrait.selection.sex === 'female' ? '여성 · 선택 정보 보관됨' : '남성 · 선택 정보 보관됨'; restore.append(sexLabel);
    restore.addEventListener('click', () => {
      if (!workflowUI?.capabilities.combinations) return showError(new Error('1·2차 게이트 PASS 전 보관한 조합 복원은 금지됩니다.'));
      selection = structuredClone(portrait.selection); $('#sex').value = selection.sex; renderControls(); void renderPortrait();
    });
    restore.disabled = !manifest || !workflowUI?.capabilities.combinations;
    const remove = document.createElement('button'); remove.className = 'delete-portrait'; remove.textContent = '보관함에서 삭제';
    remove.addEventListener('click', () => { history = history.filter(item => item.id !== portrait.id); thumbnails.delete(portrait.id); persistHistory(); renderHistory(); });
    card.append(restore, remove); fragment.append(card);
  });
  $('#history').replaceChildren(fragment);
}
function readHistory() {
  try {
    const json = localStorage.getItem(storageKey);
    if (!json) return;
    const stored = JSON.parse(json);
    if (stored.version !== 1 || !Array.isArray(stored.portraits)) throw new Error('보관함 형식 오류');
    const ids = new Set();
    history = stored.portraits.map(portrait => {
      if (typeof portrait.id !== 'string' || !portrait.id || ids.has(portrait.id)) throw new Error('보관함 ID 오류');
      ids.add(portrait.id);
      return { id: portrait.id, selection: parseSelection(manifest, JSON.stringify(portrait.selection)) };
    });
    renderHistory();
  } catch (error) { showError(new Error(`보관한 선택 정보를 읽지 못했습니다: ${error.message}`)); }
}

async function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  // Keep the URL alive until the browser has consumed the download activation.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

async function initialize() {
  const currentRevision = ++revision;
  manifest = undefined; clearError(); setReady(false); renderControls();
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  $('#empty-preview').hidden = false;
  $('#empty-preview strong').textContent = '부위를 기다리고 있어요';
  $('#preview-state').textContent = '준비 중'; canvas.dataset.state = 'loading';
  $('#library-notice').textContent = '부위 라이브러리를 불러오는 중입니다.';
  try {
    const [loaded, workflowResponse] = await Promise.all([loadManifest(manifestURL), fetch(workflowURL, { cache: 'no-store' })]);
    if (!workflowResponse.ok) throw new Error(`workflow HTTP ${workflowResponse.status}`);
    const workflow = validatePortraitWorkflow(await workflowResponse.json());
    if (currentRevision !== revision) return;
    manifest = loaded; selection = createSelection(manifest, $('#sex').value);
    workflowUI?.destroy();
    workflowUI = createPortraitWorkflowUI(workflow, () => selection ? structuredClone(selection) : null);
    renderControls(); await renderPortrait(); readHistory();
  } catch (error) {
    if (currentRevision !== revision) return;
    showError(error); canvas.dataset.state = 'error';
    $('#preview-state').textContent = '라이브러리 없음';
    $('#library-notice').textContent = '아직 사용할 수 있는 라이브러리가 없습니다. 기준 이미지를 완성 초상으로 대신 표시하지 않습니다.';
    document.dispatchEvent(new CustomEvent('portrait:error', { detail: error.message }));
  }
}

$('#sex').addEventListener('change', () => {
  if (!workflowUI?.capabilities.combinations) return showError(new Error('1·2차 게이트 PASS 전 인물 유형 변경은 금지됩니다.'));
  if (manifest) selection = createSelection(manifest, $('#sex').value);
  renderControls(); if (manifest) void renderPortrait();
});
document.addEventListener('portrait:workflow', () => { renderControls(); renderHistory(); updateNotice(); setReady(canvas.dataset.state === 'ready'); }, { passive: true });
$('#randomize').addEventListener('click', () => {
  if (!workflowUI?.capabilities.combinations) return showError(new Error('2차 게이트 PASS 전 랜덤 조합은 금지됩니다.'));
  selection = randomizeSelection(manifest, selection); renderControls(); void renderPortrait({ record: workflowUI.capabilities.export });
});
$('#save').addEventListener('click', () => { if (ready) { try { savePortrait(); } catch (error) { showError(error); } } });
$('#export').addEventListener('click', async () => {
  if (!ready || !workflowUI?.capabilities.export) return;
  const sex = selection.sex;
  try { await download(await exportPNG(canvas), `janseon-${sex}-portrait.png`); $('#status').textContent = 'PNG 다운로드를 요청했습니다. 1145 × 1374 · 투명도 유지'; }
  catch (error) { showError(error); }
});
$('#export-selection').addEventListener('click', async () => {
  if (!ready || !workflowUI?.capabilities.export) return;
  try { await download(new Blob([serializeSelection(manifest, selection)], { type: 'application/json' }), `janseon-${selection.sex}-selection.json`); }
  catch (error) { showError(error); }
});
$('#retry').addEventListener('click', () => { void initialize(); });
renderControls(); void initialize();
