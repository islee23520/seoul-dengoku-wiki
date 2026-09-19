(() => {
  "use strict";

  const unitData = {
    leader: { name: "영웅 지휘 인물", order: "중앙 지휘" },
    guard: { name: "선로 경비조", order: "차단선 유지" },
    scout: { name: "측선 정찰조", order: "좌측 엄폐 이동" },
    relief: { name: "구호 작업조", order: "후열 대기" }
  };

  const outcomeData = {
    victory: {
      label: "승리 · 통행로 확보",
      explanation: "목표를 달성하고 지휘 통제를 유지했다. 생존자 신병 처리는 전투 종료 유형과 별도다.",
      friendly: "부상 2 · 전사 0 (예시)",
      custody: "구금 없음"
    },
    defeat: {
      label: "패배 · 목표 미달성",
      explanation: "목표를 달성하지 못하고 세션이 종료됐다. 패배 자체가 전원 포획이나 전멸을 뜻하지 않는다.",
      friendly: "부상 3 · 실종 1 (예시)",
      custody: "확인 대기 1명 (예시)"
    },
    withdrawal: {
      label: "질서 철수 · 지휘 통제 유지",
      explanation: "합법 퇴로를 따라 명령으로 전장을 이탈했다. 결속 붕괴에 의한 패주와 구분한다.",
      friendly: "부상 1 · 전사 0 (예시)",
      custody: "구금 없음"
    },
    rout: {
      label: "패주 · 결속 붕괴",
      explanation: "지휘와 대형을 잃고 비자발적으로 이탈했다. 철수 명령의 결과가 아니며 신병 처리는 별도다.",
      friendly: "부상 4 · 실종 2 (예시)",
      custody: "미확인 · 자동 포획 아님"
    },
    surrender: {
      label: "수락된 항복 · 교전 종료",
      explanation: "아군이 제안하고 적이 수락해 교전이 끝났다. 항복은 퇴로 개방을 요구하지 않으며 전원 포획을 자동 확정하지 않는다.",
      friendly: "부상 2 · 전사 0 (예시)",
      custody: "대표 1명 구금 협의 (예시)"
    }
  };

  const state = {
    screen: "campaign",
    selectedUnit: null,
    commandMode: null,
    preview: null,
    paused: false,
    pendingOrders: [],
    acceptedSequence: 0,
    routeBlocked: false,
    routeBeforeDialog: false,
    outcome: "victory",
    resultApplied: false,
    receipt: null,
    resultId: "BTW-SW03-EXAMPLE-01"
  };

  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const one = (selector, root = document) => root.querySelector(selector);

  function showScreen(name) {
    state.screen = name;
    all("[data-screen-panel]").forEach((panel) => {
      const active = panel.dataset.screenPanel === name;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    all("nav [data-screen]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.screen === name));
    });
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function unitOrderLabel(unitId) {
    return one(`[data-unit-order="${unitId}"]`);
  }

  function renderSelection() {
    all("[data-unit]").forEach((button) => button.classList.toggle("is-selected", button.dataset.unit === state.selectedUnit));
    all("[data-field-unit]").forEach((button) => button.classList.toggle("is-selected", button.dataset.fieldUnit === state.selectedUnit));
    all("[data-command]").forEach((button) => { button.disabled = !state.selectedUnit; });

    const name = one("#selected-unit-name");
    const order = one("#selected-unit-order");
    if (!state.selectedUnit) {
      name.textContent = "선택된 부대 없음";
      order.textContent = "부대를 선택하면 현재 지시와 교체할 명령을 검토할 수 있다.";
    } else {
      name.textContent = unitData[state.selectedUnit].name;
      order.textContent = `현재 지시: ${unitData[state.selectedUnit].order}`;
    }
  }

  function resetPreview(copy = "이동 또는 공격을 고른 뒤 유효한 도식 대상에서 미리보기를 만든다.") {
    state.commandMode = null;
    state.preview = null;
    one("#battlefield").classList.remove("preview-move", "preview-attack");
    one("#preview-line").hidden = true;
    all("[data-command]").forEach((button) => button.classList.remove("is-active"));
    one("#preview-title").textContent = "명령 대기";
    one("#preview-copy").textContent = copy;
    one("#order-confirm").disabled = true;
    one("#order-cancel").disabled = true;
  }

  function selectUnit(unitId) {
    if (!unitData[unitId]) return;
    state.selectedUnit = unitId;
    resetPreview();
    renderSelection();
  }

  function clearSelection() {
    state.selectedUnit = null;
    resetPreview("선택을 해제했다. 기존 부대 지시는 바뀌지 않았고 새 기록도 남지 않았다.");
    renderSelection();
  }

  function beginCommand(command) {
    if (!state.selectedUnit) return;
    if (command === "hold") {
      acceptDirectOrder("현 위치 정지");
      return;
    }
    state.commandMode = command;
    state.preview = null;
    all("[data-command]").forEach((button) => button.classList.toggle("is-active", button.dataset.command === command));
    one("#battlefield").classList.toggle("preview-move", command === "move");
    one("#battlefield").classList.toggle("preview-attack", command === "attack");
    one("#preview-line").hidden = true;
    one("#order-cancel").disabled = false;
    one("#order-confirm").disabled = true;
    one("#preview-title").textContent = command === "move" ? "이동 목적지 선택" : command === "attack" ? "공격 대상 선택" : "방향 조절 미리보기";
    one("#preview-copy").textContent = command === "move"
      ? "밝게 표시된 유효 이동 지점을 선택한다."
      : command === "attack"
        ? "밝게 표시된 적 부대를 선택한다."
        : "예시 전열을 북동향으로 돌린다. 확인 전에는 현재 지시를 유지한다.";
    if (command === "face") setPreview("북동향 전열 정렬", "방향 조절");
  }

  function setPreview(target, verb) {
    if (!state.commandMode || !state.selectedUnit) return;
    state.preview = { target, order: `${verb}: ${target}` };
    one("#preview-line").hidden = false;
    one("#preview-title").textContent = `${verb} 미리보기`;
    one("#preview-copy").textContent = `${unitData[state.selectedUnit].name} → ${target}. 확인하면 현재 지시를 교체한다.`;
    one("#order-confirm").disabled = false;
    one("#order-cancel").disabled = false;
  }

  function appendHistory(text) {
    const item = document.createElement("li");
    item.textContent = text;
    one("#command-history").append(item);
  }

  function renderPauseState() {
    one("#battle-pause").setAttribute("aria-pressed", String(state.paused));
    one("#battle-pause-label").textContent = state.paused ? "재개" : "일시정지";
    one("#battlefield").classList.toggle("is-paused", state.paused);
    one("#simulation-state").textContent = state.paused
      ? `이 파티 전투 정지 · 재개 대기 ${state.pendingOrders.length}건`
      : "시뮬레이션 진행 중";
    const latest = state.pendingOrders.at(-1);
    one("#pending-orders").textContent = latest
      ? `재개 대기 ${state.pendingOrders.length}건 · 마지막 입력: ${unitData[latest.unitId].name} / ${latest.order}`
      : "재개 대기 명령 없음";
  }

  function acceptOrder(unitId, order) {
    const unit = unitData[unitId];
    unit.order = order;
    unitOrderLabel(unitId).textContent = `현재: ${order}`;
    state.acceptedSequence += 1;
    appendHistory(`#${state.acceptedSequence} ${unit.name} · ${order}`);
  }

  function submitOrder(order) {
    if (!state.selectedUnit) return;
    if (state.paused) {
      state.pendingOrders.push({ unitId: state.selectedUnit, order });
      resetPreview("일시정지 중 입력을 확정했다. 재개 뒤 다음 시뮬레이션 단계에서 입력 순서대로 현재 지시를 교체한다.");
      renderSelection();
      renderPauseState();
      return;
    }
    acceptOrder(state.selectedUnit, order);
    resetPreview("명령이 수락되어 현재 지시를 교체했다.");
    renderSelection();
  }

  function resumeBattle() {
    state.paused = false;
    const pending = state.pendingOrders.splice(0);
    pending.forEach(({ unitId, order }) => acceptOrder(unitId, order));
    renderPauseState();
    renderSelection();
    if (pending.length > 0) {
      one("#preview-copy").textContent = `재개 · 다음 시뮬레이션 단계에서 ${pending.length}건을 입력 순서대로 수락했다. 같은 부대의 뒤 명령이 앞 지시를 교체한다.`;
    }
  }

  function togglePause() {
    if (state.paused) {
      resumeBattle();
      return;
    }
    state.paused = true;
    renderPauseState();
    one("#preview-copy").textContent = "이 파티의 닫힌 전투만 일시정지했다. 캠페인 세계와 다른 파티는 멈추지 않으며 부대 명령은 계속 입력할 수 있다.";
  }

  function acceptDirectOrder(order) {
    if (!state.selectedUnit) return;
    submitOrder(order);
  }

  function confirmPreview() {
    if (!state.preview || !state.selectedUnit) return;
    submitOrder(state.preview.order);
  }

  function cancelPreview() {
    if (!state.commandMode) return;
    resetPreview("미리보기를 취소했다. 기존 지시는 유지되며 수락 기록도 추가되지 않았다.");
    renderSelection();
  }

  function renderWithdrawal() {
    const withdrawalInput = one('input[name="exit-choice"][value="withdrawal"]');
    const withdrawalLabel = withdrawalInput.closest("label");
    withdrawalInput.disabled = state.routeBlocked;
    withdrawalLabel.classList.toggle("is-disabled", state.routeBlocked);
    one("#withdrawal-availability").textContent = state.routeBlocked ? "봉쇄됨 · LegalFallback 실패로 선택 불가" : "남측 측선으로 통제된 철수";
    one("#route-toggle").textContent = state.routeBlocked ? "퇴로 개방 예시로 전환" : "퇴로 봉쇄 예시로 전환";
    one("#route-toggle").setAttribute("aria-pressed", String(state.routeBlocked));
    one("#route-state").textContent = state.routeBlocked ? "봉쇄 · 질서 철수 불가" : "남측 개방";
    if (state.routeBlocked && withdrawalInput.checked) one('input[name="exit-choice"][value="surrender"]').checked = true;
    one("#withdraw-confirm").disabled = false;
  }

  function openWithdrawal() {
    state.routeBeforeDialog = state.routeBlocked;
    renderWithdrawal();
    one("#withdraw-dialog").hidden = false;
    one("#withdraw-cancel").focus();
  }

  function closeWithdrawal(commit = false) {
    if (commit !== true) {
      state.routeBlocked = state.routeBeforeDialog;
      renderWithdrawal();
    }
    one("#withdraw-dialog").hidden = true;
    one("#withdraw-open").focus();
  }

  function confirmWithdrawal() {
    const selected = one('input[name="exit-choice"]:checked');
    if (!selected || selected.disabled) return;
    if (!state.receipt) {
      state.outcome = selected.value === "surrender" ? "surrender" : "withdrawal";
      state.resultId = "BTW-SW03-EXAMPLE-01";
      state.pendingOrders.length = 0;
      state.paused = false;
      resetPreview();
      renderPauseState();
    }
    closeWithdrawal(!state.receipt);
    renderResult();
    showScreen("result");
    if (state.receipt) one("#apply-note").textContent = `${state.resultId} 기존 영수증을 다시 표시한다. 새 결과나 세계 변경은 없다.`;
  }

  function renderResult() {
    const outcome = state.receipt || outcomeData[state.outcome];
    one("#result-title").textContent = state.outcome === "encounter" ? "조우 결과를 확인하고 원정을 잇는다" : "전투 결과를 확인하고 원정을 잇는다";
    one(".taxonomy").hidden = state.outcome === "encounter";
    one("#outcome-label").textContent = outcome.label;
    one("#outcome-explanation").textContent = outcome.explanation;
    one("#friendly-fact").textContent = outcome.friendly;
    one("#custody-fact").textContent = outcome.custody;
    one("#result-id").textContent = state.resultId;
    all("[data-outcome]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.outcome === state.outcome);
      button.disabled = Boolean(state.receipt);
    });
    renderResultApplication();
  }

  function renderResultApplication() {
    const apply = one("#result-apply");
    const status = one("#result-status");
    apply.disabled = state.resultApplied;
    apply.textContent = state.resultApplied ? "반영 완료 · 같은 ResultId 재적용 없음" : "결과를 캠페인에 한 번 반영";
    status.textContent = state.resultApplied ? "반영 완료" : "검사 가능";
    one("#apply-note").textContent = state.resultApplied
      ? `${state.resultId} 영수증 생성 · 위치, 물자, 부상 사실을 한 번 반영했다.`
      : "아직 반영하지 않음 · 같은 ResultId의 중복 적용은 세계를 다시 바꾸지 않는다.";
    one("#continue-expedition").disabled = !state.resultApplied;
    all(".campaign-outcomes button").forEach((button) => { button.disabled = !state.resultApplied; });
    if (!state.resultApplied) one("#choice-feedback").textContent = "결과 반영 뒤 선택할 수 있다.";
  }

  function applyResult() {
    if (state.receipt) return;
    state.receipt = Object.freeze({ ...outcomeData[state.outcome] });
    state.resultApplied = true;
    renderResult();
    one("#choice-feedback").textContent = "반영 완료. 원정 계속이 주요 선택이며 다섯 결말도 선택 가능하다.";
  }

  all("nav [data-screen]").forEach((button) => button.addEventListener("click", () => showScreen(button.dataset.screen)));
  all("[data-nav]").forEach((button) => button.addEventListener("click", () => showScreen(button.dataset.nav)));
  const memberDetail = document.createElement("p");
  memberDetail.className = "boundary-note";
  memberDetail.id = "member-detail";
  memberDetail.setAttribute("aria-live", "polite");
  one(".member-list .art-note").before(memberDetail);
  all(".member").forEach((button) => button.addEventListener("click", () => {
    all(".member").forEach((member) => {
      member.classList.toggle("is-active", member === button);
      member.setAttribute("aria-pressed", String(member === button));
    });
    memberDetail.textContent = `${one("b", button).textContent} · ${one("small", button).textContent} · 상태 ${one("em", button).textContent}. 선택한 인물의 역할을 편성과 함께 검토한다.`;
  }));
  all(".station").forEach((button) => button.addEventListener("click", () => {
    all(".station").forEach((station) => station.setAttribute("aria-pressed", String(station === button)));
    one(".travel-card h2").textContent = `${one("span", button).textContent} 경로 검토`;
    one(".travel-card .brief p").textContent = `${one("small", button).textContent}. 현재 위치는 그대로 두고 선택한 행선의 통행 조건을 검토한다.`;
  }));
  all(".response-card:not([data-nav])").forEach((button, index) => button.addEventListener("click", () => {
    if (!state.receipt) {
      const action = one("b", button).textContent;
      state.outcome = "encounter";
      outcomeData.encounter = {
        label: `${action} · 조우 해결 예시`,
        explanation: `${action}의 현장 결과를 확인한다. 전투를 거치지 않았으며 결과 반영 뒤 원정을 계속할 수 있다.`,
        friendly: "교전 없음 · 새 전투 사상자 없음",
        custody: "구금 없음"
      };
      state.resultId = `ENC-SW03-EXAMPLE-${index + 1}`;
    }
    renderResult();
    showScreen("result");
  }));
  const deployDetail = document.createElement("p");
  deployDetail.id = "deployment-selection";
  deployDetail.className = "boundary-note";
  deployDetail.setAttribute("aria-live", "polite");
  deployDetail.textContent = "배치 도식에서 부대를 선택한다.";
  one(".deploy-inspector .formation-list").after(deployDetail);
  all(".deployment-field .unit-token").forEach((button) => button.addEventListener("click", () => {
    all(".deployment-field .unit-token").forEach((unit) => {
      unit.classList.toggle("is-selected", unit === button);
      unit.setAttribute("aria-pressed", String(unit === button));
    });
    deployDetail.textContent = `${button.getAttribute("aria-label")} 선택 · 아래 전열/후열 버튼으로 배치를 조정한다.`;
  }));
  for (const [label, bottom] of [["선택 부대 전열 배치", "38%"], ["선택 부대 후열 배치", "14%"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      const selected = one(".deployment-field .unit-token.is-selected");
      if (!selected) { deployDetail.textContent = "먼저 배치 도식에서 부대를 선택한다."; return; }
      selected.style.top = "auto";
      selected.style.bottom = bottom;
      deployDetail.textContent = `${selected.getAttribute("aria-label")} · ${label.includes("전열") ? "전열" : "후열"}로 조정됨. 확정 전에는 전투 명령을 발행하지 않는다.`;
    });
    deployDetail.after(button);
  }
  all("[data-unit]").forEach((button) => button.addEventListener("click", () => selectUnit(button.dataset.unit)));
  all("[data-field-unit]").forEach((button) => button.addEventListener("click", () => selectUnit(button.dataset.fieldUnit)));
  all("[data-command]").forEach((button) => button.addEventListener("click", () => beginCommand(button.dataset.command)));
  all("[data-destination]").forEach((button) => button.addEventListener("click", () => {
    if (state.commandMode === "move") setPreview(button.dataset.destination, "이동");
  }));
  all("[data-target]").forEach((button) => button.addEventListener("click", () => {
    if (state.commandMode === "attack") setPreview(button.getAttribute("aria-label").split(",")[0], "공격");
  }));
  all("[data-outcome]").forEach((button) => button.addEventListener("click", () => {
    if (state.resultApplied) return;
    state.outcome = button.dataset.outcome;
    renderResult();
  }));

  one("#selection-clear").addEventListener("click", clearSelection);
  one("#battle-pause").addEventListener("click", togglePause);
  one("#order-confirm").addEventListener("click", confirmPreview);
  one("#order-cancel").addEventListener("click", cancelPreview);
  one("#withdraw-open").addEventListener("click", openWithdrawal);
  one("#withdraw-cancel").addEventListener("click", closeWithdrawal);
  one("#withdraw-confirm").addEventListener("click", confirmWithdrawal);
  one("#route-toggle").addEventListener("click", () => { state.routeBlocked = !state.routeBlocked; renderWithdrawal(); });
  one("#result-apply").addEventListener("click", applyResult);
  one("#continue-expedition").addEventListener("click", () => {
    if (!state.resultApplied) return;
    one("#choice-feedback").textContent = "원정 계속 선택 · 현재 위치에서 다음 구간을 검토한다.";
    showScreen("campaign");
  });
  all(".campaign-outcomes button").forEach((button) => button.addEventListener("click", () => {
    if (!state.resultApplied) return;
    one("#choice-feedback").textContent = `${button.childNodes[0].textContent.trim()} 선택 예시 · 캠페인 결말 처리 화면으로 이어진다.`;
  }));
  one("#withdraw-dialog").addEventListener("click", (event) => {
    if (event.target === one("#withdraw-dialog")) closeWithdrawal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !one("#withdraw-dialog").hidden) closeWithdrawal();
  });

  renderSelection();
  renderPauseState();
  renderResult();
  showScreen("campaign");
})();
