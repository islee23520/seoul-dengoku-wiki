const GATE_IDS = Object.freeze(['gateway1', 'gateway2', 'gateway3']);
const STATUSES = Object.freeze(['PASS', 'FAIL', 'IN_PROGRESS', 'NOT_VERIFIED', 'BLOCKED']);
const MODES = Object.freeze(['preservation', 'variation']);
const SHA256 = /^[0-9a-f]{64}$/;

function fail(message) { throw new Error(message); }

function validateEvidence(evidence, label) {
  if (!Array.isArray(evidence)) fail(`${label}: evidence 배열이 필요합니다.`);
  for (const item of evidence) {
    if (typeof item?.path !== 'string' || !item.path.trim() || !SHA256.test(item.sha256 ?? '')) {
      fail(`${label}: evidence path/SHA-256 오류`);
    }
  }
}

export function validatePortraitWorkflow(workflow) {
  if (workflow?.version !== 1) fail('portrait workflow version은 1이어야 합니다.');
  if (!workflow.profiles || typeof workflow.profiles !== 'object') fail('portrait workflow profiles가 필요합니다.');
  if (!Object.hasOwn(workflow.profiles, workflow.active_profile)) fail('active portrait profile이 없습니다.');
  for (const [profileId, profile] of Object.entries(workflow.profiles)) {
    if (typeof profile.label !== 'string' || !profile.label.trim() || !MODES.includes(profile.mode)) {
      fail(`${profileId}: label/mode 오류`);
    }
    if (typeof profile.source?.path !== 'string' || !profile.source.path.trim() || !SHA256.test(profile.source.sha256 ?? '')) {
      fail(`${profileId}: source path/SHA-256 오류`);
    }
    const keys = Object.keys(profile.gates ?? {});
    if (keys.length !== 3 || GATE_IDS.some(id => !keys.includes(id))) fail(`${profileId}: 1·2·3차 게이트가 모두 필요합니다.`);
    const states = GATE_IDS.map((id, index) => {
      const gate = profile.gates[id];
      if (!STATUSES.includes(gate?.status)) fail(`${profileId}/${index + 1}차: 상태 오류`);
      validateEvidence(gate.evidence, `${profileId}/${index + 1}차`);
      if (gate.status === 'PASS' && gate.evidence.length === 0) fail(`${profileId}/${index + 1}차: PASS에는 증거가 필요합니다.`);
      return gate.status;
    });
    if (states[1] === 'PASS' && states[0] !== 'PASS') fail(`${profileId}: 1차 PASS 전 2차 PASS는 순서 위반입니다.`);
    if (states[2] === 'PASS' && (states[0] !== 'PASS' || states[1] !== 'PASS')) fail(`${profileId}: 1·2차 PASS 전 3차 PASS는 순서 위반입니다.`);
  }
  if (!Array.isArray(workflow.tools) || workflow.tools.length === 0) fail('portrait workflow tools가 필요합니다.');
  const toolIds = new Set();
  for (const tool of workflow.tools) {
    if (typeof tool?.id !== 'string' || !tool.id || toolIds.has(tool.id)) fail('portrait workflow tool ID 오류');
    if (!Number.isInteger(tool.unlock_after) || tool.unlock_after < 0 || tool.unlock_after > 3) fail(`${tool.id}: unlock_after 오류`);
    toolIds.add(tool.id);
  }
  return workflow;
}

export function activePortraitProfile(workflow) {
  const valid = validatePortraitWorkflow(workflow);
  return valid.profiles[valid.active_profile];
}

export function workflowCapabilities(workflow) {
  const profile = activePortraitProfile(workflow);
  const passed = GATE_IDS.map(id => profile.gates[id].status === 'PASS');
  return Object.freeze({
    source: true,
    split: true,
    rig: passed[0],
    combinations: passed[0] && passed[1],
    export: passed[0] && passed[1] && passed[2],
    binding: passed[0] && passed[1] && passed[2],
    runtime: passed[0] && passed[1] && passed[2]
  });
}

export function toolAvailability(workflow) {
  const valid = validatePortraitWorkflow(workflow);
  const capabilities = workflowCapabilities(valid);
  const passedCount = capabilities.export ? 3 : capabilities.combinations ? 2 : capabilities.rig ? 1 : 0;
  return valid.tools.map(tool => Object.freeze({ ...tool, available: passedCount >= tool.unlock_after }));
}

export function requirePortraitCapability(workflow, capability) {
  const capabilities = workflowCapabilities(workflow);
  if (capabilities[capability] !== true) {
    const requirement = capability === 'rig' ? '1차' : capability === 'combinations' ? '1·2차' : '1·2·3차';
    fail(`${requirement} 게이트 PASS 전 ${capability} 작업은 금지됩니다.`);
  }
  return true;
}

export function serializeWorkflowPacket(workflow, selection) {
  const valid = validatePortraitWorkflow(workflow);
  return JSON.stringify({
    version: 1,
    active_profile: valid.active_profile,
    profile: activePortraitProfile(valid),
    capabilities: workflowCapabilities(valid),
    tools: toolAvailability(valid),
    selection
  }, null, 2);
}

export const PORTRAIT_GATE_IDS = GATE_IDS;
export const PORTRAIT_GATE_STATUSES = STATUSES;
