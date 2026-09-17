import { loadManifest, createSelection, selectVariant, randomizeSelection, serializeSelection, parseSelection, addPortrait, composePortrait, exportPNG, missingRequiredSlots, canRandomizeSelection, logicalControlSlots, logicalBundleForPrimary } from './portrait-state.mjs?v=20260917-stage23b';
import { validatePortraitWorkflow } from '../../Tool/art/portrait/portrait-gateway.mjs';
import { createPortraitWorkflowUI } from './portrait-workflow-ui.mjs';
import { attachValidationReceipt, createCurationFeedback, curationProgress, mountedCandidateMembers, serializeCurationPacket, updateCurationFeedback, validateCurationCatalog } from './portrait-curation.mjs?v=20260917-stage23b';
import { drawAttachmentRig, validateAttachmentRigs } from './portrait-rig-overlay.mjs';

const manifestURL = new URL('./assets/v2/library.json', import.meta.url).href;
const workflowURL = new URL('./assets/v2/workflow.json', import.meta.url).href;
const curationURL = new URL('./assets/v2/curation-catalog.json', import.meta.url).href;
const rigsURL = new URL('../../Tool/art/portrait/portrait-attachment-rigs.json', import.meta.url).href;
const validationURL = new URL('./assets/v2/validation-index.json', import.meta.url).href;
const storageKey = 'janseon.portrait-studio.selections.v2';
const curationStorageKey = 'janseon.portrait-studio.curation.v1';
const $ = selector => document.querySelector(selector);
const canvas = $('#portrait-canvas');
let manifest, selection, workflowUI, history = [], revision = 0, ready = false;
let curationCatalog, curationFeedback;
let attachmentRigs;
let validationIndex;
let mountedCandidateId = null;
let curationVisibleLimit = 48;
const thumbnails = new Map();
const lineageLabels = Object.freeze({ accepted: '승인', rejected: '반려', superseded: '구버전', unreviewed: '미검수' });
const decisionLabels = Object.freeze({ pending: '미결', adopt: '채택', hold: '보류', reject: '반려' });

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
    ? '4차 큐레이션 게이트 통과 · 보관, 선택 JSON, PNG 내보내기가 열렸습니다.'
    : caps?.combinations
      ? '조합과 큐레이션은 가능하지만 3차 조합·4차 큐레이션 PASS 전 보관·내보내기는 잠깁니다.'
      : '2차 PASS 전 조합·큐레이션을 잠그고, 4차 PASS 전 보관·선택 JSON·PNG 내보내기를 잠급니다.';
  $('#sex').disabled = !caps?.combinations;
  for (const input of document.querySelectorAll('[data-slot]')) input.disabled ||= !caps?.combinations;
}
function renderControls() {
  if (!manifest) { $('#slot-controls').replaceChildren(); return; }
  const fragment = document.createDocumentFragment();
  for (const { id, label, z, required } of logicalControlSlots(manifest, $('#sex').value)) {
    const entry = manifest?.sexes[$('#sex').value].slots[id];
    const disabled = !entry?.enabled || !entry.variants.length;
    const derived = entry?.mode === 'companion';
    const fixed = entry?.mode === 'fixed';
    const row = document.createElement('div'); row.className = 'slot-control'; row.dataset.disabled = disabled;
    const title = document.createElement('label'); title.htmlFor = `slot-${id}`; title.className = 'slot-label';
    const name = document.createElement('span');
    const number = document.createElement('span'); number.className = 'slot-number'; number.textContent = String(z + 1).padStart(2, '0');
    name.append(number, label);
    const count = document.createElement('span'); count.className = 'slot-count';
    const bundleId = logicalBundleForPrimary(manifest, id); const bundle = bundleId ? manifest.logical_bundles[bundleId] : null;
    const provisional = manifest.slot_validity_policy === 'gates-1-4' && entry?.variants?.some(v => v.slot_validity?.status !== 'verified');
    count.textContent = fixed ? (bundle ? (provisional ? '세트 · 고정 · 임시' : '세트 · 고정') : '고정') : bundle ? `세트 · ${entry?.variants.length ?? 0}종${provisional ? ' · 임시' : ''}` : `${entry?.variants.length ?? 0}종${provisional ? ' · 임시' : ''}`;
    title.append(name, count);
    const input = document.createElement('select'); input.id = `slot-${id}`; input.dataset.slot = id;
    input.disabled = !['selectable', 'fixed'].includes(entry?.mode);
    if (disabled) input.add(new Option('변형 없음', ''));
    else if (fixed) {
      const current = entry.variants[0];
      input.add(new Option('없음 · 투명', ''));
      input.add(new Option(`${current.label ?? current.id} · 고정`, current.id));
      input.value = selection.selections[id] ?? '';
    } else {
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
  const entries = Object.values(manifest.sexes[selection.sex].slots).filter(entry => entry.mode === 'selectable');
  const incomplete = entries.filter(entry => entry.variants.length < 3);
  if (manifest.stage === 'stage1-derived') {
    $('#library-notice').textContent = `Stage1 실물 플레이트 파생 미리보기 · Stage2/3 품질 승인본이 아닙니다. 적용 슬롯 ${entries.length}개 중 ${incomplete.length}개가 3종 미만이며 빈 레이어와 시험용 색상 변형을 포함합니다.`;
    return;
  }
  if (!workflowUI?.capabilities.combinations) {
    $('#library-notice').textContent = `읽기 전용 미리보기 · 적용 슬롯 ${entries.length}개 중 ${incomplete.length}개가 3종 미만입니다. 2차 부품 게이트 PASS 전 슬롯 편집은 잠깁니다.`;
    return;
  }
  $('#library-notice').textContent = incomplete.length
    ? `라이브러리 사용 가능 · 적용 슬롯 ${entries.length}개 중 ${incomplete.length}개는 실패 후보 제거로 3종 미만입니다. 제공된 통과 변형만 편집할 수 있으며 에셋 품질 검수는 별도입니다.`
    : `적용 슬롯 ${entries.length}개 · 각 슬롯에 3종이 등록되어 있습니다. 이 수치는 이미지 품질 검수 완료를 의미하지 않습니다.`;
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
    const mountedMembers = mountedCandidateId ? mountedCandidateMembers(curationCatalog, mountedCandidateId) : [];
    await composePortrait(staging, manifest, currentSelection, manifestURL, undefined, mountedMembers);
    if (currentRevision !== revision) return false;
    canvas.width = staging.width; canvas.height = staging.height;
    const context = canvas.getContext('2d'); context.globalCompositeOperation = 'source-over'; context.drawImage(staging, 0, 0);
    $('#empty-preview').hidden = true;
    $('#preview-state').textContent = currentSelection.sex === 'female' ? '여성 · 합성 완료' : '남성 · 합성 완료';
    $('#status').textContent = mountedCandidateId
      ? '큐레이션 후보를 현재 초상에 임시 장착했습니다. production 선택은 변경되지 않습니다.'
      : '선택한 레이어를 원본 크기로 합성했습니다.';
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
  try { localStorage.setItem(storageKey, JSON.stringify({ version: 2, portraits: history })); }
  catch (error) { showError(new Error(`브라우저에 보관하지 못했습니다. 선택 정보를 JSON으로 내보내 주세요: ${error.message}`)); }
}
function savePortrait() {
  if (!workflowUI?.capabilities.export) throw new Error('1·2·3·4차 게이트 PASS 전 현재 조합 보관은 금지됩니다.');
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

function persistCuration() {
  try { localStorage.setItem(curationStorageKey, JSON.stringify(curationFeedback)); }
  catch (error) { showError(new Error(`큐레이션 피드백을 보관하지 못했습니다: ${error.message}`)); }
}

function restoreCuration() {
  curationFeedback = createCurationFeedback(curationCatalog);
  try {
    const stored = JSON.parse(localStorage.getItem(curationStorageKey) ?? 'null');
    if (stored?.version === 1 && stored.catalog_sha256 === curationFeedback.catalog_sha256) {
      for (const [id, value] of Object.entries(stored.decisions ?? {})) {
        if (curationCatalog.records.some(candidate => candidate.visible_card && candidate.id === id)) {
          curationFeedback = updateCurationFeedback(curationCatalog, curationFeedback, id, value.decision, value.note);
        }
      }
      curationFeedback.validation_receipts = Array.isArray(stored.validation_receipts) ? stored.validation_receipts : [];
    }
  } catch (error) { showError(new Error(`큐레이션 피드백을 읽지 못했습니다: ${error.message}`)); }
}

function renderCurationFilters() {
  const slots = [...new Set(curationCatalog.records.map(candidate => candidate.bundle ?? (candidate.slot === 'face_base' || ['cheeks', 'chin'].includes(candidate.slot) ? 'face_shape' : candidate.slot) ?? 'scaffold'))].sort();
  const select = $('#curation-slot');
  const current = select.value;
  select.replaceChildren(new Option('전체', 'all'), ...slots.map(slot => new Option(slot, slot)));
  select.value = slots.includes(current) ? current : 'all';
}

function renderCuration() {
  if (!curationCatalog || !curationFeedback) return;
  const filters = {
    sex: $('#curation-sex').value, slot: $('#curation-slot').value,
    status: $('#curation-status').value, decision: $('#curation-decision').value,
    baseline: $('#curation-baseline').value,
  };
  const visible = curationCatalog.records.filter(candidate => {
    const feedback = curationFeedback.decisions[candidate.id] ?? { decision: 'pending' };
    const logicalSlot = candidate.bundle ?? (candidate.slot === 'face_base' || ['cheeks', 'chin'].includes(candidate.slot) ? 'face_shape' : candidate.slot) ?? 'scaffold';
    return (filters.sex === 'all' || candidate.sex === filters.sex)
      && (filters.slot === 'all' || logicalSlot === filters.slot)
      && (filters.status === 'all' || candidate.status === filters.status)
      && (filters.baseline === 'all'
        || filters.baseline === 'contract_pass' && candidate.contract_pass === true && ['accepted', 'superseded'].includes(candidate.status)
        || candidate.baseline_role === filters.baseline)
      && (filters.decision === 'all' || feedback.decision === filters.decision);
  });
  const progress = curationProgress(curationCatalog, curationFeedback);
  $('#curation-count').textContent = `${Math.min(visible.length, curationVisibleLimit)} / ${visible.length} / ${curationCatalog.counts.total_records}`;
  $('#curation-progress').textContent = `미결 ${progress.pending} · 채택 ${progress.adopt} · 보류 ${progress.hold} · 반려 ${progress.reject}`;
  $('#curation-empty').hidden = visible.length > 0;
  $('#export-curation').disabled = !workflowUI?.capabilities.curation;
  const fragment = document.createDocumentFragment();
  for (const candidate of visible.slice(0, curationVisibleLimit)) {
    const feedback = curationFeedback.decisions[candidate.id] ?? { decision: 'pending', note: '' };
    const card = document.createElement('article'); card.className = 'candidate-card'; card.dataset.status = candidate.status; card.dataset.decision = feedback.decision;
    const heading = document.createElement('div'); heading.className = 'candidate-heading';
    const title = document.createElement('h3'); title.textContent = candidate.logical_id ?? candidate.id;
    const state = document.createElement('span'); state.className = 'candidate-lineage'; state.textContent = lineageLabels[candidate.status];
    heading.append(title, state);
    const logicalSlot = candidate.bundle ?? (candidate.slot === 'face_base' || ['cheeks', 'chin'].includes(candidate.slot) ? 'face_shape' : candidate.slot) ?? 'scaffold';
    const memberIds = candidate.render_members?.length ? candidate.render_members : [candidate.id];
    const members = memberIds.map(id => curationCatalog.records.find(record => record.id === id)).filter(Boolean);
    const baselineLabel = candidate.baseline_role === 'current_production' ? '현재 production'
      : candidate.baseline_role === 'contract_pass_baseline' ? '계약 PASS 기준군' : '계약 미통과';
    const sexLabel = candidate.sex === 'female' ? '여성' : candidate.sex === 'male' ? '남성' : '미분류';
    const meta = document.createElement('p'); meta.className = 'candidate-meta'; meta.textContent = `${sexLabel} · ${logicalSlot} · 물리 레이어 ${members.length}개 · ${baselineLabel} · 사용자 결정 ${decisionLabels[feedback.decision]}`;
    const previews = document.createElement('div'); previews.className = 'candidate-previews';
    for (const member of members) {
      const figure = document.createElement('figure'); figure.className = 'candidate-preview';
      if (member.alpha_visible === false) {
        const empty = document.createElement('div'); empty.className = 'candidate-empty-member'; empty.textContent = '투명 member'; figure.append(empty);
      } else {
        const image = document.createElement('img'); image.src = new URL(member.web_path, manifestURL).href; image.alt = `${candidate.logical_id ?? candidate.id} · ${member.slot}`; image.loading = 'lazy'; image.width = 1145; image.height = 1374; figure.append(image);
      }
      const caption = document.createElement('figcaption'); caption.textContent = member.slot; figure.append(caption); previews.append(figure);
    }
    const zoom = document.createElement('button'); zoom.type = 'button'; zoom.className = 'candidate-zoom'; zoom.textContent = '원본 크기로 보기';
    zoom.setAttribute('aria-label', `${candidate.logical_id ?? candidate.id} · ${lineageLabels[candidate.status]} · ${candidate.id} 원본 크기로 보기`);
    zoom.addEventListener('click', () => {
      $('#candidate-dialog-title').textContent = `${candidate.logical_id ?? candidate.id} · ${lineageLabels[candidate.status]} · ${candidate.id}`;
      const detail = document.createDocumentFragment();
      for (const member of members) {
        const figure = document.createElement('figure');
        if (member.alpha_visible !== false && member.web_path) { const image = document.createElement('img'); image.src = new URL(member.web_path, manifestURL).href; image.alt = `${candidate.logical_id ?? candidate.id} · ${member.slot} 원본`; image.width = 1145; image.height = 1374; figure.append(image); }
        const caption = document.createElement('figcaption'); caption.textContent = `${member.slot} · ${member.sha256}`; figure.append(caption); detail.append(figure);
      }
      $('#candidate-dialog-members').replaceChildren(detail); $('#candidate-dialog').showModal();
    });
    const mount = document.createElement('button'); mount.type = 'button'; mount.className = 'candidate-mount';
    const mounted = mountedCandidateId === candidate.id;
    mount.textContent = mounted ? '장착 해제' : '현재 초상에 장착해서 보기';
    mount.setAttribute('aria-pressed', String(mounted));
    mount.disabled = candidate.sex !== selection.sex || !candidate.visible_card || !candidate.browser_decodable || candidate.status === 'rejected';
    mount.addEventListener('click', () => {
      try {
        mountedCandidateId = mountedCandidateId === candidate.id ? null : candidate.id;
        renderCuration(); void renderPortrait();
      } catch (error) { showError(error); }
    });
    const path = document.createElement('p'); path.className = 'candidate-path'; path.textContent = candidate.source_paths.join(' · ');
    const decisions = document.createElement('div'); decisions.className = 'feedback-controls';
    for (const [value, label] of [['adopt', '채택'], ['hold', '보류'], ['reject', '반려']]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.dataset.decision = value;
      button.setAttribute('aria-pressed', feedback.decision === value ? 'true' : 'false'); button.setAttribute('aria-label', `${candidate.logical_id ?? candidate.id} ${label}`);
      button.disabled = !workflowUI?.capabilities.curation;
      button.addEventListener('click', () => {
        curationFeedback = updateCurationFeedback(curationCatalog, curationFeedback, candidate.id, value, textarea.value);
        persistCuration(); renderCuration();
      });
      decisions.append(button);
    }
    const textarea = document.createElement('textarea'); textarea.rows = 3; textarea.value = feedback.note; textarea.placeholder = '부족한 점, 유지할 점, 다음 개선 요청'; textarea.disabled = !workflowUI?.capabilities.curation; textarea.setAttribute('aria-label', `${candidate.logical_id ?? candidate.id} 피드백 메모`);
    textarea.addEventListener('input', () => {
      const current = curationFeedback.decisions[candidate.id] ?? { decision: 'pending' };
      curationFeedback = updateCurationFeedback(curationCatalog, curationFeedback, candidate.id, current.decision, textarea.value);
      persistCuration();
    });
    const saved = document.createElement('span'); saved.className = 'feedback-saved'; saved.textContent = feedback.note ? '메모 저장됨' : '메모 미입력';
    textarea.addEventListener('input', () => { saved.textContent = '메모 저장됨'; });
    card.append(heading, meta, previews, mount, zoom, path, decisions, textarea, saved); fragment.append(card);
  }
  $('#candidate-grid').replaceChildren(fragment);
  $('#curation-more').hidden = visible.length <= curationVisibleLimit;
}

function renderAttachmentGuide() {
  if (!attachmentRigs || !selection) return;
  try {
    const rig = drawAttachmentRig($('#attachment-overlay'), attachmentRigs, selection, $('#attachment-guide').value);
    $('#guide-status').textContent = rig ? `${rig.id} · seam ${rig.seam_band_width_px}px · export 제외` : '제작 가이드 꺼짐 · export 제외';
    const node = rig ? validationIndex?.receipts.flatMap(receipt => receipt.nodes ?? [])
      .find(candidate => candidate.type === 'attachment_boundary_check' && candidate.id.startsWith(rig.kind)) : null;
    const metrics = node?.metrics;
    $('#boundary-contact').textContent = metrics ? metrics.contact_pixels.toLocaleString() : '—';
    $('#boundary-missing').textContent = metrics ? metrics.missing_contact_pixels.toLocaleString() : '—';
    $('#boundary-outside').textContent = metrics ? metrics.outside_allowance_pixels.toLocaleString() : '—';
    $('#boundary-gaps').textContent = metrics ? `${metrics.seam_gap_components} · max ${metrics.max_gap_width}px` : '—';
  } catch (error) { showError(error); }
}

function renderValidationIndex() {
  if (!validationIndex) return;
  const fragment = document.createDocumentFragment();
  for (const receipt of validationIndex.receipts) {
    const card = document.createElement('article'); card.className = 'validation-receipt'; card.dataset.status = receipt.status;
    const title = document.createElement('h4'); title.textContent = receipt.path.split('/').at(-2) ?? receipt.path;
    const state = document.createElement('span'); state.textContent = `${receipt.status} · visual ${receipt.visual_approval}`;
    const checks = document.createElement('ul'); checks.className = 'validation-node-list';
    for (const node of receipt.nodes ?? []) {
      const item = document.createElement('li'); item.dataset.status = node.status; item.textContent = `${node.id} · ${node.status}`; checks.append(item);
    }
    const artifacts = document.createElement('div'); artifacts.className = 'validation-artifacts';
    for (const artifact of receipt.artifacts) { const image = document.createElement('img'); image.src = new URL(artifact.web_path, validationURL).href; image.alt = `${artifact.node_id} ${artifact.value_type}`; image.loading = 'lazy'; image.width = 1145; image.height = 1374; artifacts.append(image); }
    card.append(title, state, checks, artifacts); fragment.append(card);
  }
  $('#validation-receipts').replaceChildren(fragment);
  const pending = validationIndex.receipts.filter(receipt => receipt.status !== 'PASS').length;
  $('#validation-summary').textContent = pending ? `${pending}개 PENDING` : 'machine PASS · 사용자 판정 필요';
}
function readHistory() {
  try {
    const json = localStorage.getItem(storageKey);
    if (!json) return;
    const stored = JSON.parse(json);
    if (stored.version !== 2 || !Array.isArray(stored.portraits)) throw new Error('보관함 형식 오류');
    const ids = new Set();
    history = stored.portraits.map(portrait => {
      if (typeof portrait.id !== 'string' || !portrait.id || ids.has(portrait.id)) throw new Error('보관함 ID 오류');
      ids.add(portrait.id);
      return { id: portrait.id, selection: parseSelection(manifest, serializeSelection(manifest, portrait.selection)) };
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
    const [loaded, workflowResponse, curationResponse, rigsResponse, validationResponse] = await Promise.all([loadManifest(manifestURL), fetch(workflowURL, { cache: 'no-store' }), fetch(curationURL, { cache: 'no-store' }), fetch(rigsURL, { cache: 'no-store' }), fetch(validationURL, { cache: 'no-store' })]);
    if (!workflowResponse.ok) throw new Error(`workflow HTTP ${workflowResponse.status}`);
    if (!curationResponse.ok) throw new Error(`curation HTTP ${curationResponse.status}`);
    if (!rigsResponse.ok) throw new Error(`attachment rigs HTTP ${rigsResponse.status}`);
    if (!validationResponse.ok) throw new Error(`validation index HTTP ${validationResponse.status}`);
    const workflow = validatePortraitWorkflow(await workflowResponse.json());
    if (currentRevision !== revision) return;
    manifest = loaded; selection = createSelection(manifest, $('#sex').value);
    curationCatalog = validateCurationCatalog(await curationResponse.json()); restoreCuration(); renderCurationFilters();
    attachmentRigs = validateAttachmentRigs(await rigsResponse.json());
    validationIndex = await validationResponse.json();
    for (const receipt of validationIndex.receipts) curationFeedback = attachValidationReceipt(curationFeedback, { path: receipt.path, sha256: receipt.sha256 });
    workflowUI?.destroy();
    workflowUI = createPortraitWorkflowUI(workflow, () => selection ? structuredClone(selection) : null);
    renderControls(); renderCuration(); renderValidationIndex(); await renderPortrait(); renderAttachmentGuide(); readHistory();
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
  mountedCandidateId = null;
  if (manifest) selection = createSelection(manifest, $('#sex').value);
  renderControls(); if (manifest) void renderPortrait().then(renderAttachmentGuide);
});
document.addEventListener('portrait:workflow', () => { renderControls(); renderHistory(); renderCuration(); updateNotice(); setReady(canvas.dataset.state === 'ready'); }, { passive: true });
$('#randomize').addEventListener('click', () => {
  if (!workflowUI?.capabilities.combinations) return showError(new Error('2차 게이트 PASS 전 랜덤 조합은 금지됩니다.'));
  selection = randomizeSelection(manifest, selection); renderControls(); void renderPortrait({ record: workflowUI.capabilities.export }).then(renderAttachmentGuide);
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
$('#attachment-guide').addEventListener('change', renderAttachmentGuide);
$('#close-candidate-dialog').addEventListener('click', () => $('#candidate-dialog').close());
for (const id of ['curation-sex', 'curation-slot', 'curation-status', 'curation-baseline', 'curation-decision']) $(`#${id}`).addEventListener('change', () => { curationVisibleLimit = 48; renderCuration(); });
$('#curation-more').addEventListener('click', () => { curationVisibleLimit += 48; renderCuration(); });
$('#export-curation').addEventListener('click', async () => {
  if (!workflowUI?.capabilities.curation || !curationCatalog) return;
  await download(new Blob([await serializeCurationPacket(curationCatalog, curationFeedback, selection)], { type: 'application/json' }), 'janseon-portrait-gateway4-curation.json');
});
renderControls(); void initialize();
