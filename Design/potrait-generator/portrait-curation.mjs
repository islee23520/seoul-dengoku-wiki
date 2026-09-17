const DECISIONS = new Set(['pending', 'adopt', 'hold', 'reject']);
const STATUSES = new Set(['accepted', 'rejected', 'superseded', 'unreviewed']);

function fail(message) { throw new Error(message); }

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text); const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export function validateCurationCatalog(catalog) {
  if (catalog?.version !== 1 || !Array.isArray(catalog.records)) fail('큐레이션 catalog 형식 오류');
  if (!/^[0-9a-f]{64}$/.test(catalog.sha256 ?? '')) fail('큐레이션 catalog SHA 오류');
  const ids = new Set();
  for (const candidate of catalog.records) {
    if (!candidate || typeof candidate.id !== 'string' || !candidate.id || ids.has(candidate.id)) fail('큐레이션 candidate ID 오류');
    if (!(candidate.sex === null || ['female', 'male'].includes(candidate.sex)) || !(candidate.slot === null || typeof candidate.slot === 'string')) fail(`${candidate.id}: sex/slot 오류`);
    if (!STATUSES.has(candidate.status)) fail(`${candidate.id}: 제작 상태 오류`);
    if (!/^[0-9a-f]{64}$/.test(candidate.sha256 ?? '') || !Array.isArray(candidate.source_paths)) fail(`${candidate.id}: path/SHA 오류`);
    if (candidate.visible_card === true && (typeof candidate.web_path !== 'string' || !candidate.web_path)) fail(`${candidate.id}: visible card path 오류`);
    if (candidate.contract_pass !== undefined && typeof candidate.contract_pass !== 'boolean') fail(`${candidate.id}: contract_pass 오류`);
    if (candidate.baseline_role !== undefined && !['current_production', 'contract_pass_baseline', 'none'].includes(candidate.baseline_role)) fail(`${candidate.id}: baseline_role 오류`);
    ids.add(candidate.id);
  }
  return catalog;
}

export function mountedCandidateMembers(catalog, candidateId) {
  validateCurationCatalog(catalog);
  const candidate = catalog.records.find(record => record.id === candidateId);
  if (!candidate) fail(`알 수 없는 candidate: ${candidateId}`);
  if (candidate.status === 'rejected') fail(`반려 candidate는 장착할 수 없습니다: ${candidateId}`);
  const ids = candidate.render_members?.length ? candidate.render_members : [candidate.id];
  const members = ids.map(id => catalog.records.find(record => record.id === id)).filter(Boolean);
  if (!members.length || members.some(member => !member.browser_decodable || !member.web_path || !member.slot)) {
    fail(`장착할 수 없는 candidate: ${candidateId}`);
  }
  return members.map(member => ({ slot: member.slot, path: member.web_path, blend_mode: member.blend_mode ?? 'source-over' }));
}

const visibleCandidates = catalog => catalog.records;

export function createCurationFeedback(catalog) {
  validateCurationCatalog(catalog);
  return {
    version: 1,
    catalog_sha256: catalog.sha256 ?? null,
    decisions: Object.fromEntries(visibleCandidates(catalog).map(candidate => [candidate.id, { decision: 'pending', note: '' }])),
    validation_receipts: [],
  };
}

export function updateCurationFeedback(catalog, feedback, candidateId, decision, note = '') {
  validateCurationCatalog(catalog);
  if (!visibleCandidates(catalog).some(candidate => candidate.id === candidateId)) fail(`알 수 없는 candidate: ${candidateId}`);
  if (!DECISIONS.has(decision)) fail(`알 수 없는 결정: ${decision}`);
  if (typeof note !== 'string') fail('피드백 메모는 문자열이어야 합니다.');
  return { ...feedback, decisions: { ...feedback.decisions, [candidateId]: { decision, note: note.trim() } } };
}

export function attachValidationReceipt(feedback, receipt) {
  if (typeof receipt?.path !== 'string' || !/^[0-9a-f]{64}$/.test(receipt.sha256 ?? '')) fail('검증 그래프 receipt path/SHA 오류');
  return { ...feedback, validation_receipts: [...feedback.validation_receipts.filter(item => item.path !== receipt.path), receipt] };
}

export function curationProgress(catalog, feedback) {
  validateCurationCatalog(catalog);
  const rows = visibleCandidates(catalog).map(candidate => ({ candidate, ...(feedback.decisions[candidate.id] ?? { decision: 'pending', note: '' }) }));
  return Object.freeze({
    total: rows.length,
    pending: rows.filter(row => row.decision === 'pending').length,
    adopt: rows.filter(row => row.decision === 'adopt').length,
    hold: rows.filter(row => row.decision === 'hold').length,
    reject: rows.filter(row => row.decision === 'reject').length,
  });
}

export async function serializeCurationPacket(catalog, feedback, selection = null) {
  const progress = curationProgress(catalog, feedback);
  const decisions = visibleCandidates(catalog).map(candidate => ({
    candidate_id: candidate.id,
    sex: candidate.sex,
    logical_slot: candidate.bundle ?? candidate.slot ?? 'scaffold',
    production_status: candidate.status,
    contract_pass: candidate.contract_pass === true,
    baseline_role: candidate.baseline_role ?? 'none',
    ...feedback.decisions[candidate.id],
  }));
  const validationReceipts = feedback.validation_receipts;
  const feedbackSha256 = await sha256(stable({ catalog_sha256: feedback.catalog_sha256, decisions }));
  return JSON.stringify({
    schema: 'janseon.portrait-curation.v1',
    catalog: { path: 'Design/potrait-generator/assets/v2/curation-catalog.json', sha256: feedback.catalog_sha256 },
    progress,
    inventory: catalog.counts,
    decisions,
    validation_receipts: validationReceipts,
    feedback_sha256: feedbackSha256,
    selection,
    gateway4: {
      status: progress.pending === 0 && feedback.validation_receipts.length > 0 ? 'READY_FOR_VERIFICATION' : 'PENDING',
      visual_approval: 'USER_DECISION_REQUIRED',
    },
  }, null, 2);
}
