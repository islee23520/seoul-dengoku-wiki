export const CAMPAIGN_STORAGE_KEY = "janseon.review.campaign.v1";

export const ROSTER = Object.freeze([
  { id: "commander", name: "이주선", role: "지휘관", trait: "결단" },
  { id: "baekon", name: "백온", role: "선로 정비공", trait: "근면" },
  { id: "mungaram", name: "문가람", role: "침수구 잠수사", trait: "물익힘" },
  { id: "ohaerin", name: "오해린", role: "안내방 송출원", trait: "발견" },
]);

export const STAGES = Object.freeze([
  "title",
  "create",
  "hub",
  "dialogue",
  "route",
  "encounter",
  "settlement",
]);

function cloneRoster(name) {
  return ROSTER.map((member, index) => ({
    ...member,
    name: index === 0 ? name : member.name,
    hp: 10,
  }));
}

export function createCampaignState() {
  return {
    stage: "title",
    commanderName: "이주선",
    profile: "scout",
    supplies: 100,
    reputation: 0,
    day: 1,
    layer: "B1",
    roster: cloneRoster("이주선"),
    relationships: { "commander-baekon": 1 },
    selectedStation: null,
    settlement: null,
    missionCount: 0,
  };
}

export function assertCampaignState(state) {
  if (!STAGES.includes(state.stage)) {
    throw new Error(`알 수 없는 캠페인 단계: ${state.stage}`);
  }
  if (!Number.isFinite(state.supplies) || !Number.isFinite(state.day)) {
    throw new Error("캠페인 자원 값이 올바르지 않습니다.");
  }
  if (!Array.isArray(state.roster) || state.roster.length !== 4) {
    throw new Error("회수 캠페인의 시작 로스터는 4명이어야 합니다.");
  }
  return true;
}

export function beginCampaign(state, { name, profile }) {
  const commanderName = name.trim() || "이주선";
  const next = {
    ...state,
    stage: "hub",
    commanderName,
    profile,
    roster: cloneRoster(commanderName),
  };
  assertCampaignState(next);
  return next;
}

export function restAtHub(state) {
  if (state.stage !== "hub") return state;
  return {
    ...state,
    day: state.day + 1,
    roster: state.roster.map((member) => ({
      ...member,
      hp: Math.min(10, member.hp + 3),
    })),
  };
}

export function openDialogue(state) {
  if (state.stage !== "hub") return state;
  return { ...state, stage: "dialogue" };
}

export function finishDialogue(state, relationshipDelta) {
  if (state.stage !== "dialogue") return state;
  const key = "commander-baekon";
  return {
    ...state,
    stage: "hub",
    relationships: {
      ...state.relationships,
      [key]: Math.max(0, (state.relationships[key] ?? 0) + relationshipDelta),
    },
  };
}

export function acceptMission(state) {
  if (state.stage !== "hub") return state;
  return {
    ...state,
    stage: "route",
    missionCount: state.missionCount + 1,
    selectedStation: null,
    settlement: null,
  };
}

export function selectStation(state, stationId) {
  if (state.stage !== "route") return state;
  if (!new Set(["yeongdeungpo", "sindorim", "guro"]).has(stationId)) {
    throw new RangeError(`알 수 없는 역: ${stationId}`);
  }
  return { ...state, selectedStation: stationId };
}

export function travelToEncounter(state) {
  if (state.stage !== "route" || state.selectedStation !== "sindorim") {
    return state;
  }
  return {
    ...state,
    stage: "encounter",
    supplies: state.supplies - 2,
    day: state.day + 1,
    layer: "B2",
  };
}

export function resolveEncounter(state, outcome) {
  if (!new Set(["negotiate", "bypass", "reviewed"]).has(outcome)) {
    throw new RangeError(`알 수 없는 조우 결과: ${outcome}`);
  }
  const negotiationDiscount =
    (state.relationships["commander-baekon"] ?? 0) >= 2 ? 1 : 0;
  const base = {
    negotiate: {
      title: "협상 성립",
      summary: "관계 기반 협상으로 순찰대 통행권을 확보했습니다.",
      supplies: -5 + negotiationDiscount,
      reputation: 3,
      day: 0,
      routeStatus: "신도림 B2 제한 통행",
    },
    bypass: {
      title: "환기구 우회",
      summary: "전투를 피했지만 추가 보급과 하루를 소비했습니다.",
      supplies: -2,
      reputation: -1,
      day: 1,
      routeStatus: "신도림 B2 미확보",
    },
    reviewed: {
      title: "실시간 교전 검토 완료",
      summary: "승인 진형을 실시간 분대 전투 표면에 전달해 교전 루프를 검토했습니다.",
      supplies: 10,
      reputation: 5,
      day: 1,
      routeStatus: "신도림 B2 전투 검토 완료",
    },
  }[outcome];

  return {
    ...state,
    stage: "settlement",
    supplies: state.supplies + base.supplies,
    reputation: state.reputation + base.reputation,
    day: state.day + base.day,
    settlement: { outcome, ...base },
  };
}

export function returnToHub(state) {
  if (state.stage !== "settlement") return state;
  return {
    ...state,
    stage: "hub",
    layer: "B1",
    selectedStation: null,
  };
}
