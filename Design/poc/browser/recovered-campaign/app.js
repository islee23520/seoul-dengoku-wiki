import {
  CAMPAIGN_STORAGE_KEY, acceptMission, assertCampaignState, beginCampaign,
  createCampaignState, finishDialogue, openDialogue, resolveEncounter,
  restAtHub, returnToHub, selectStation, travelToEncounter,
} from "./campaign-model.js";

const view = document.querySelector("#campaign-view");
const resources = {
  supplies: document.querySelector("#supplies"), reputation: document.querySelector("#reputation"),
  day: document.querySelector("#day"), layer: document.querySelector("#layer"),
};
const params = new URLSearchParams(window.location.search);

function loadState() {
  const raw = sessionStorage.getItem(CAMPAIGN_STORAGE_KEY);
  if (!raw) return createCampaignState();
  try { const parsed = JSON.parse(raw); assertCampaignState(parsed); return parsed; }
  catch { return createCampaignState(); }
}

let state = loadState();
if (params.get("result") === "reviewed" && state.stage !== "settlement") {
  const encounterState = state.stage === "encounter"
    ? state
    : {
        ...state,
        stage: "encounter",
        layer: "B2",
        missionCount: Math.max(1, state.missionCount),
      };
  state = resolveEncounter(encounterState, "reviewed");
  window.history.replaceState({}, "", window.location.pathname);
}

function saveState() { assertCampaignState(state); sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(state)); }
function setState(next) { state = next; saveState(); render(); view.focus({ preventScroll: true }); }
function railStage() { return ["title", "create", "hub", "dialogue"].includes(state.stage) ? "hub" : state.stage; }
function syncChrome() {
  resources.supplies.textContent = state.supplies; resources.reputation.textContent = state.reputation;
  resources.day.textContent = `${state.day}일`; resources.layer.textContent = state.layer;
  const order = ["hub", "route", "encounter", "formation", "battle", "settlement"];
  const current = order.indexOf(railStage());
  document.querySelectorAll("[data-rail]").forEach((item) => {
    const index = order.indexOf(item.dataset.rail);
    item.classList.toggle("is-current", index === current); item.classList.toggle("is-done", index < current);
  });
}

function titleScreen() { return `<section class="screen"><div class="hero"><div class="hero-content"><p class="kicker">RECOVERED WINDOWS HTML / INTEGRATED BROWSER POC</p><h1>잔선: 서울</h1><p class="lede">붕괴 이후 지하철망의 질서를 다시 세운다. 회수한 관리·대화·원정·조우·정산 흐름을 승인된 진형 편집과 실시간 분대 전투에 연결했습니다.</p><button class="button button-primary" data-action="create">회수 원정 시작</button><div class="source-badge"><b>선택 원본</b> fullgame-example-v3.html · Windows SHA 85c62fb6c284…</div></div></div></section>`; }
function createScreen() { return `<section class="screen panel-grid"><div class="panel world-panel"><div class="panel-header"><h1>지휘관 프로필</h1><span>CREATE / WINDOWS RECOVERY</span></div><div class="panel-body"><p class="copy">원본의 이름·성별·외형 생성 단계를 현재 POC에 맞춰 이름과 운용 프로필 선택으로 보존했습니다. 전투 카메라나 전투 규칙은 이 단계에서 바꾸지 않습니다.</p><div class="form-row"><label for="commander-name">이름</label><input id="commander-name" value="${state.commanderName}" maxlength="20" /></div><div class="form-row"><label>운용 프로필</label><div class="profiles">${[["scout","탐사","노선과 침수 상태를 먼저 읽습니다."],["signal","통신","관계와 협상 정보를 우선합니다."],["guard","경비","교전 준비와 진형 검토를 우선합니다."]].map(([id,title,copy])=>`<button class="profile ${state.profile===id?"is-selected":""}" data-profile="${id}"><strong>${title}</strong><small>${copy}</small></button>`).join("")}</div></div><div class="button-row"><button class="button button-primary" data-action="begin">원정 개시</button><button class="button button-quiet" data-action="title">뒤로</button></div></div></div><aside class="panel"><div class="panel-header"><h2>회수 적용 원칙</h2><span>SOURCE BOUNDARY</span></div><div class="panel-body comparison"><div><strong>적용</strong><span>생성, 4인 로스터, 허브, 관계 대화, 노선 이동, 비용 공개 조우, 정산 영수증.</span></div><div><strong>연결</strong><span>출격은 기존 6분대 진형 편집, 교전은 기존 30Hz 실시간 전투로 진행.</span></div><div><strong>제외</strong><span>회수 원본의 5×5 AP/턴 전투와 고정 1280×720 셸은 현재 계약과 충돌해 이식하지 않음.</span></div></div></aside></section>`; }
function rosterMarkup() { return state.roster.map((m)=>`<article class="member"><strong>${m.name}</strong><span>${m.role} · HP ${m.hp}/10</span><small>◈ ${m.trait}</small></article>`).join(""); }
function hubScreen() { const relation=state.relationships["commander-baekon"]??0; return `<section class="screen panel-grid"><div class="panel world-panel"><div class="panel-header"><h1>영등포 B1 · 거점 관리</h1><span>HUB / MISSION ${String(state.missionCount+1).padStart(2,"0")}</span></div><div class="panel-body"><p class="copy">Windows 원본의 인터미션을 현재 브라우저 POC의 시작 표면으로 복원했습니다. 메뉴 조작은 시간을 쓰지 않으며 휴식만 하루를 진행합니다.</p><div class="roster">${rosterMarkup()}</div><div class="mission"><h3>의뢰 · 신도림 보급선 확인</h3><p>B2 승강장 잔여 물자와 순찰대 통행 조건을 확인합니다. 이동 비용 보급 −2, 조우에서 협상·우회·실시간 교전을 선택합니다.</p></div><div class="button-row"><button class="button" data-action="rest">휴식 · +1일</button><button class="button" data-action="dialogue">캐릭터 대화</button><button class="button button-primary" data-action="mission">의뢰 수락</button></div></div></div><aside class="panel"><div class="panel-header"><h2>관계·원정 상태</h2><span>INTERMISSION</span></div><div class="panel-body"><p class="copy">${state.commanderName} ↔ 백온</p><p class="relation">${"●".repeat(relation)}${"○".repeat(Math.max(0,3-relation))}</p><div class="comparison"><div><strong>다음 연결</strong><span>의뢰 → 노선도 → 조우 → 승인 진형 → 실시간 전투 → 정산.</span></div></div><div class="button-row"><button class="button button-quiet" data-action="reset">새 캠페인</button></div></div></aside></section>`; }
function dialogueScreen() { return `<section class="screen panel-grid"><div class="panel world-panel"><div class="panel-header"><h1>거점 · 선로 정비 기록</h1><span>RELATION EVENT</span></div><div class="panel-body"><div class="dialogue-line"><strong>백온</strong> — “신도림 쪽 진동이 달라졌어. 침수만으로 나는 소리가 아니야.”</div><div class="dialogue-line" style="margin-top:9px;border-color:var(--signal)"><strong>${state.commanderName}</strong> — “원정 전에 기록을 맞춰 보자. 네 판단을 작전에 넣을게.”</div><div class="button-row"><button class="button button-primary" data-dialogue="1">정보를 공유한다 · 관계 +1</button><button class="button" data-dialogue="0">보고만 받는다</button></div></div></div><aside class="panel"><div class="panel-header"><h2>관계 효과</h2><span>RECOVERED</span></div><div class="panel-body"><p class="copy">원본의 관계 대화는 협상과 정산에 영향을 줍니다. 통합 POC에서는 관계 2 이상을 신도림 협상비용 −1로 명시합니다.</p></div></aside></section>`; }
function routeScreen() { const selected=state.selectedStation; return `<section class="screen panel-grid"><div class="panel world-panel"><div class="panel-header"><h1>수도권 1호선 잔존 노선</h1><span>ROUTE / FIXED MAP</span></div><div class="rail-map"><button class="station ${selected==="yeongdeungpo"?"is-selected":""}" data-station="yeongdeungpo" data-label="영등포 B1">B1</button><button class="station ${selected==="sindorim"?"is-selected":""}" data-station="sindorim" data-label="신도림 B2">B2</button><button class="station" data-station="guro" data-label="구로 · 잠김" disabled>×</button></div></div><aside class="panel"><div class="panel-header"><h2>${selected==="sindorim"?"신도림 B2 승강장":selected==="yeongdeungpo"?"영등포 · 현재 위치":"역을 선택하세요"}</h2><span>STATION</span></div><div class="panel-body"><p class="copy">${selected==="sindorim"?"B1 계단 → B2 · 반나절. 보급 −2. 순찰대 조우 가능성이 높고 전투 전 캠프 정보가 갱신됩니다.":selected==="yeongdeungpo"?"현재 거점입니다. 신도림 노드를 선택해야 원정을 진행할 수 있습니다.":"노선 위 역 노드를 선택해 비용과 조우 정보를 확인합니다."}</p><div class="button-row">${selected==="sindorim"?'<button class="button button-primary" data-action="travel">이동 확정 · 보급 −2</button>':""}<button class="button button-quiet" data-action="hub">거점 복귀</button></div></div></aside></section>`; }
function encounterScreen() { const relation=state.relationships["commander-baekon"]??0, negotiationCost=relation>=2?4:5; return `<section class="screen panel-grid"><div class="panel world-panel"><div class="panel-header"><h1>신도림 B2 · 승강장 입구 봉쇄</h1><span>ENCOUNTER / COSTS VISIBLE</span></div><div class="panel-body"><p class="copy">순찰대 3개 조가 동측 통로를 막았습니다. 원본과 같이 각 선택의 비용을 실행 전에 공개합니다.</p><div class="choice-list"><button class="choice" data-outcome="negotiate"><strong>① 통행료 협상</strong><span>보급 −${negotiationCost} · 평판 +3 · 관계 ${relation} 적용</span></button><button class="choice" data-outcome="bypass"><strong>② 환기구 우회</strong><span>보급 −2 · 평판 −1 · +1일 · 전투 없음</span></button><a class="choice danger" href="../formation-editor/?campaign=recovered"><strong>③ 실시간 교전 준비</strong><span>기존 승인 화면에서 6분대 진형을 편집·확정한 뒤 30Hz 실시간 전투로 진입</span></a></div></div></div><aside class="panel"><div class="panel-header"><h2>캠프 정보</h2><span>WORLD STATE</span></div><div class="panel-body"><p class="dialogue-line"><strong>백온</strong> — “새 장비야. 자치회 정규 순찰은 아니야.”</p><p class="copy">카메라 계약: 45° / 35.264° 고정 직교. 교전 화면에서 회전 UI를 추가하지 않습니다.</p></div></aside></section>`; }
function settlementScreen() { const result=state.settlement; return `<section class="screen panel-grid"><div class="panel world-panel"><div class="panel-header"><h1>신도림 B2 · 원정 정산</h1><span>SETTLEMENT</span></div><div class="panel-body"><h2>${result?.title??"원정 정산"}</h2><p class="copy">${result?.summary??"결과를 기록했습니다."}</p><div class="roster">${rosterMarkup()}</div><div class="button-row"><button class="button button-primary" data-action="return">영등포 복귀</button><a class="button" href="../battle-preview/?campaign=recovered">실시간 전투 다시 보기</a></div></div></div><aside class="panel receipt"><div class="panel-header"><h2>OP-${String(state.missionCount).padStart(2,"0")} 승차권 영수증</h2><span>1회 적용</span></div><div class="panel-body receipt-grid"><div><span>보급</span><strong>${state.supplies}</strong></div><div><span>평판</span><strong>${state.reputation}</strong></div><div><span>경과</span><strong>${state.day}일차</strong></div><div><span>노선</span><strong>${result?.routeStatus??"기록 없음"}</strong></div><div><span>다음</span><strong>거점 관리</strong></div></div></aside></section>`; }
function render() { syncChrome(); view.innerHTML={title:titleScreen,create:createScreen,hub:hubScreen,dialogue:dialogueScreen,route:routeScreen,encounter:encounterScreen,settlement:settlementScreen}[state.stage](); }

view.addEventListener("click", (event) => {
  const profile=event.target.closest("[data-profile]"); if(profile){state={...state,profile:profile.dataset.profile};render();return;}
  const station=event.target.closest("[data-station]"); if(station&&!station.disabled){setState(selectStation(state,station.dataset.station));return;}
  const dialogue=event.target.closest("[data-dialogue]"); if(dialogue){setState(finishDialogue(state,Number(dialogue.dataset.dialogue)));return;}
  const outcome=event.target.closest("[data-outcome]"); if(outcome){setState(resolveEncounter(state,outcome.dataset.outcome));return;}
  const action=event.target.closest("[data-action]")?.dataset.action; if(!action)return;
  if(action==="create")setState({...state,stage:"create"});
  if(action==="title")setState({...state,stage:"title"});
  if(action==="begin")setState(beginCampaign(state,{name:document.querySelector("#commander-name").value,profile:state.profile}));
  if(action==="rest")setState(restAtHub(state)); if(action==="dialogue")setState(openDialogue(state));
  if(action==="mission")setState(acceptMission(state)); if(action==="travel")setState(travelToEncounter(state));
  if(action==="hub")setState({...state,stage:"hub",selectedStation:null}); if(action==="return")setState(returnToHub(state));
  if(action==="reset"){sessionStorage.removeItem(CAMPAIGN_STORAGE_KEY);setState(createCampaignState());}
});

view.addEventListener("input", (event) => {
  if (event.target.id === "commander-name") {
    state = { ...state, commanderName: event.target.value };
  }
});

saveState(); render();
window.__RECOVERED_CAMPAIGN_POC__={getState:()=>JSON.parse(JSON.stringify(state)),source:"fullgame-example-v3.html",sourceSha256:"85c62fb6c284",combatContract:"realtime-squad-30hz",cameraAngles:{azimuth:45,elevation:35.264}};
