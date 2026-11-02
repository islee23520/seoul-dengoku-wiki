const $ = selector => document.querySelector(selector);
const api = Object.freeze({ assets: './api/assets', jobs: './api/jobs', generate: './api/generate', health: './healthz', catalog: './catalog.json' });
const allowedFormats = new Set(['glb', 'gltf', 'fbx', 'blend']);

let assets = [];
let jobs = [];
let readOnly = false;
let rendering = false;

function messageFrom(error) {
  return error instanceof Error ? error.message : String(error);
}

async function getJSON(url) {
  const response = await fetch(url, { cache: 'no-store' });
  let body;
  try { body = await response.json(); }
  catch { throw new Error(`${url} 응답을 읽을 수 없습니다. (HTTP ${response.status})`); }
  if (!response.ok) throw new Error(body?.error?.message || `${url} 요청 실패 (HTTP ${response.status})`);
  return body;
}

function setError(error) {
  const banner = $('#error-banner');
  banner.textContent = messageFrom(error);
  banner.hidden = false;
}

function clearError() {
  $('#error-banner').textContent = '';
  $('#error-banner').hidden = true;
}

function setRendering(value) {
  rendering = value;
  $('#loading-layer').hidden = !value;
  $('#render-button').disabled = value || readOnly || assets.length === 0;
  $('#asset-select').disabled = value || readOnly || assets.length === 0;
  for (const input of document.querySelectorAll('#render-form input')) input.disabled = value || readOnly;
  if (value) {
    $('#receipt').hidden = true;
    $('#download-link').hidden = true;
    $('#portrait-preview').hidden = true;
    $('#preview-empty').hidden = false;
    $('#render-status').textContent = 'RENDERING';
    $('#render-status').dataset.status = 'RENDERING';
    $('#form-status').textContent = 'Blender가 선택한 3D 오브젝트를 렌더하고 있습니다.';
  }
}

function validateAsset(value) {
  if (!value || typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  const format = String(value.format || '').replace(/^\./, '').toLowerCase();
  return allowedFormats.has(format) ? { id: value.id, name: value.name, format } : null;
}

function validateJob(value) {
  if (!value || typeof value.id !== 'string' || !['PASS', 'FAIL'].includes(value.status)) return null;
  return {
    id: value.id,
    status: value.status,
    pngUrl: typeof value.pngUrl === 'string' ? value.pngUrl : '',
    sourceName: typeof value.sourceName === 'string' ? value.sourceName : '알 수 없는 오브젝트',
    width: Number(value.width) || 0,
    height: Number(value.height) || 0,
    error: typeof value.error === 'string' ? value.error : '',
  };
}

function renderAssets() {
  const select = $('#asset-select');
  const current = select.value;
  const options = [];
  if (!assets.length) options.push(new Option('등록된 모델 없음', ''));
  for (const asset of assets) options.push(new Option(`${asset.name}  ·  ${asset.format.toUpperCase()}`, asset.id));
  select.replaceChildren(...options);
  if (assets.some(asset => asset.id === current)) select.value = current;
  $('#asset-empty').hidden = assets.length > 0;
  $('#asset-meta').hidden = assets.length === 0;
  select.disabled = readOnly || rendering || assets.length === 0;
  $('#render-button').disabled = readOnly || rendering || assets.length === 0;
  updateAssetMeta();
}

function updateAssetMeta() {
  const asset = assets.find(candidate => candidate.id === $('#asset-select').value);
  if (asset) $('#asset-meta').textContent = `${asset.name} · ${asset.format.toUpperCase()} · 서버 등록 자산`;
}

function createHistoryCard(job, index) {
  const card = document.createElement('article');
  card.className = 'history-card';
  card.dataset.status = job.status;
  if (job.status === 'PASS' && job.pngUrl) {
    const link = document.createElement('a');
    link.href = job.pngUrl;
    link.setAttribute('aria-label', `${job.sourceName} 렌더 보기`);
    const image = document.createElement('img');
    image.src = job.pngUrl;
    image.alt = `${job.sourceName} 3D 렌더`;
    image.loading = index < 4 ? 'eager' : 'lazy';
    image.width = job.width || 512;
    image.height = job.height || 640;
    link.append(image);
    card.append(link);
  }
  const body = document.createElement('div'); body.className = 'history-card-body';
  const title = document.createElement('strong'); title.textContent = job.sourceName;
  const meta = document.createElement('span'); meta.textContent = `${job.status} · ${job.width || '—'} × ${job.height || '—'}`;
  body.append(title, meta);
  if (job.status === 'FAIL' && job.error) {
    const reason = document.createElement('span'); reason.className = 'history-error'; reason.textContent = job.error; body.append(reason);
  }
  card.append(body);
  return card;
}

function renderHistory() {
  const valid = jobs.map(validateJob).filter(Boolean);
  $('#history-count').textContent = String(valid.length);
  $('#history-empty').hidden = valid.length > 0;
  $('#history-grid').replaceChildren(...valid.map(createHistoryCard));
}

function showResult(job) {
  const valid = validateJob(job);
  if (!valid) throw new Error('렌더 응답 형식이 올바르지 않습니다.');
  jobs = [valid, ...jobs.filter(item => item.id !== valid.id)];
  renderHistory();
  $('#render-status').textContent = valid.status;
  $('#render-status').dataset.status = valid.status;
  $('#receipt-result').textContent = valid.status;
  $('#receipt-source').textContent = valid.sourceName;
  $('#receipt-size').textContent = `${valid.width} × ${valid.height} PNG`;
  $('#receipt').hidden = false;
  if (valid.status === 'PASS' && valid.pngUrl) {
    const image = $('#portrait-preview');
    image.src = valid.pngUrl;
    image.hidden = false;
    $('#preview-empty').hidden = true;
    const download = $('#download-link');
    download.href = valid.pngUrl;
    download.download = `${valid.sourceName.replace(/\.[^.]+$/, '') || 'portrait'}-${valid.width}x${valid.height}.png`;
    download.hidden = false;
    $('#form-status').textContent = readOnly
      ? '저장된 결과입니다. 새 렌더는 로컬 portrait-gen 서버에서만 실행할 수 있습니다.'
      : '실제 PNG 렌더가 완료되었습니다.';
  } else {
    $('#download-link').hidden = true;
    $('#form-status').textContent = valid.error || '렌더에 실패했습니다.';
  }
}

async function useStaticCatalog(apiError) {
  let catalog;
  try { catalog = await getJSON(api.catalog); }
  catch { throw apiError; }
  readOnly = true;
  assets = [];
  jobs = Array.isArray(catalog.jobs) ? catalog.jobs : [];
  document.body.dataset.mode = 'static';
  $('#mode-label').textContent = '저장 결과 보기 전용';
  $('#readonly-banner').hidden = false;
  $('#form-status').textContent = '로컬 서버에서만 새 3D 렌더를 실행할 수 있습니다.';
  renderAssets();
  renderHistory();
  const latest = jobs.map(validateJob).find(job => job?.status === 'PASS' && job.pngUrl);
  if (latest) showResult(latest);
}

async function initialize() {
  clearError();
  try {
    const [health, assetData, jobData] = await Promise.all([getJSON(api.health), getJSON(api.assets), getJSON(api.jobs)]);
    if (health?.ok !== true || health?.mode !== 'prebaked-3d') throw new Error('로컬 서버가 prebaked-3d 모드가 아닙니다.');
    readOnly = health.readOnly === true;
    assets = Array.isArray(assetData.assets) ? assetData.assets.map(validateAsset).filter(Boolean) : [];
    jobs = Array.isArray(jobData.jobs) ? jobData.jobs : [];
    document.body.dataset.mode = readOnly ? 'static' : 'live';
    $('#mode-label').textContent = readOnly ? '저장 결과 보기 전용' : 'LOCAL · PREBAKED 3D';
    $('#readonly-banner').hidden = !readOnly;
    $('#form-status').textContent = readOnly ? '이 서버는 읽기 전용입니다.' : assets.length ? '렌더 설정을 선택하세요.' : '렌더할 3D 자산을 등록하세요.';
    renderAssets();
    renderHistory();
    const latest = jobs.map(validateJob).find(job => job?.status === 'PASS' && job.pngUrl);
    if (latest) showResult(latest);
  } catch (error) {
    try { await useStaticCatalog(error); }
    catch (finalError) {
      document.body.dataset.mode = 'offline';
      $('#mode-label').textContent = '서버 연결 안 됨';
      assets = []; jobs = []; renderAssets(); renderHistory(); setError(finalError);
      $('#form-status').textContent = '로컬 portrait-gen 서버를 시작한 뒤 새로고침하세요.';
    }
  }
}

$('#asset-select').addEventListener('change', updateAssetMeta);
$('#yaw-input').addEventListener('input', event => { $('#yaw-output').textContent = `${event.currentTarget.value}°`; });
$('#portrait-preview').addEventListener('error', () => setError(new Error('결과 PNG를 표시할 수 없습니다. 파일 또는 서버 응답을 확인하세요.')));
$('#render-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (readOnly || rendering) return;
  clearError();
  if (!event.currentTarget.reportValidity()) return;
  const data = new FormData(event.currentTarget);
  const payload = {
    assetId: String(data.get('assetId') || ''),
    width: Number(data.get('width')),
    height: Number(data.get('height')),
    yaw: Number(data.get('yaw')),
    framing: String(data.get('framing')),
  };
  if (!assets.some(asset => asset.id === payload.assetId)) return setError(new Error('등록된 3D 모델을 선택하세요.'));
  setRendering(true);
  try {
    const response = await fetch(api.generate, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let body;
    try { body = await response.json(); }
    catch { throw new Error(`렌더 응답을 읽을 수 없습니다. (HTTP ${response.status})`); }
    if (!response.ok) throw new Error(body?.error?.message || `렌더 요청 실패 (HTTP ${response.status})`);
    showResult(body);
  } catch (error) {
    $('#render-status').textContent = 'FAIL';
    $('#render-status').dataset.status = 'FAIL';
    $('#form-status').textContent = '렌더에 실패했습니다.';
    setError(error);
  } finally { setRendering(false); }
});

void initialize();
