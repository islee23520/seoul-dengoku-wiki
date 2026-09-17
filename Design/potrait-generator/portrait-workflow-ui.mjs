import { activePortraitProfile, serializeWorkflowPacket, toolAvailability, validatePortraitWorkflow, workflowCapabilities } from '../../Tool/art/portrait/portrait-gateway.mjs';

const GATES = [
  ['gateway1', '1차', '분할 · 재합성', '원본 해시, PSD 분리, 알파와 source-over 재합성을 검증합니다.'],
  ['gateway2', '2차', '부품 · 숨은 면', '개별 슬롯의 숨은 면, 성별 소유권, 재질과 원본 배율 품질을 검증합니다.'],
  ['gateway3', '3차', '조합 · 교환', '실제 포트레잇 조합에서 앵커·가림·seam·출력을 검증합니다.'],
  ['gateway4', '4차', '큐레이션 · 개선', '만들어진 모든 후보를 노출하고 채택·보류·반려 피드백과 검증 그래프 evidence를 기록합니다.']
];

const STATUS_LABELS = Object.freeze({ PASS: 'PASS', FAIL: 'FAIL', IN_PROGRESS: '진행 중', NOT_VERIFIED: '미검증', BLOCKED: '잠김' });
const $ = selector => document.querySelector(selector);

function downloadJSON(value, filename) {
  const url = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

function renderSources(workflow) {
  const select = $('#workflow-profile');
  select.replaceChildren(...Object.entries(workflow.profiles).map(([id, profile]) => new Option(`${profile.label} · ${profile.mode === 'preservation' ? '보존' : '변형'}`, id)));
  select.value = workflow.active_profile;
  select.disabled = Object.keys(workflow.profiles).length < 2;
}

function renderGates(workflow) {
  const profile = activePortraitProfile(workflow);
  const fragment = document.createDocumentFragment();
  for (const [id, number, title, detail] of GATES) {
    const gate = profile.gates[id];
    const card = document.createElement('article'); card.className = 'gateway-card'; card.dataset.status = gate.status;
    const heading = document.createElement('div'); heading.className = 'gateway-heading';
    const titleNode = document.createElement('h3'); titleNode.textContent = `${number} · ${title}`;
    const state = document.createElement('span'); state.className = 'gateway-status'; state.textContent = STATUS_LABELS[gate.status];
    heading.append(titleNode, state);
    const copy = document.createElement('p'); copy.textContent = detail;
    const evidence = document.createElement('p'); evidence.className = 'gateway-evidence';
    evidence.textContent = gate.evidence.length ? `증거 ${gate.evidence.length}개 연결` : '연결된 PASS 증거 없음';
    card.append(heading, copy, evidence); fragment.append(card);
  }
  $('#gateway-rail').replaceChildren(fragment);
}

function renderTools(workflow) {
  const fragment = document.createDocumentFragment();
  for (const tool of toolAvailability(workflow)) {
    const card = document.createElement('article'); card.className = 'tool-card'; card.dataset.tool = tool.id; card.dataset.available = tool.available;
    const title = document.createElement('h3'); title.textContent = tool.label;
    const state = document.createElement('span'); state.className = 'tool-state'; state.textContent = tool.available ? '사용 가능' : `${tool.unlock_after}차 PASS 후`;
    card.append(title, state); fragment.append(card);
  }
  $('#tool-lanes').replaceChildren(fragment);
}

export function createPortraitWorkflowUI(workflow, getSelection) {
  let current = validatePortraitWorkflow(structuredClone(workflow));
  const render = () => {
    renderSources(current); renderGates(current); renderTools(current);
    const caps = workflowCapabilities(current);
    const gate1 = activePortraitProfile(current).gates.gateway1.status;
    $('#workflow-summary').textContent = caps.export
      ? '1·2·3·4차 통과 · 제품 내보내기 가능'
      : caps.combinationAccepted ? '1·2·3차 통과 · 4차 큐레이션 필요'
      : caps.combinations ? '1·2차 통과 · 3차 조합 검증과 4차 큐레이션 가능'
        : caps.rig ? '1차 통과 · 2차 부품 검증 필요'
          : gate1 === 'FAIL' ? '1차 FAIL · 분할 재작업 필요' : '1차 진행 중 · 분할 재합성 완료 전 잠김';
    document.dispatchEvent(new CustomEvent('portrait:workflow', { detail: { workflow: current, capabilities: caps } }));
  };
  const profile = $('#workflow-profile');
  const packet = $('#export-workflow');
  const changeProfile = event => {
    current = validatePortraitWorkflow({ ...current, active_profile: event.target.value }); render();
  };
  const exportPacket = () => downloadJSON(serializeWorkflowPacket(current, getSelection()), `janseon-${current.active_profile}-workflow.json`);
  profile.addEventListener('change', changeProfile);
  packet.addEventListener('click', exportPacket);
  render();
  return Object.freeze({
    get workflow() { return current; },
    get capabilities() { return workflowCapabilities(current); },
    destroy() { profile.removeEventListener('change', changeProfile); packet.removeEventListener('click', exportPacket); }
  });
}
