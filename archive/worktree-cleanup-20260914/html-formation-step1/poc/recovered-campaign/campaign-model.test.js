import test from "node:test";
import assert from "node:assert/strict";

import {
  acceptMission,
  assertCampaignState,
  beginCampaign,
  createCampaignState,
  finishDialogue,
  openDialogue,
  resolveEncounter,
  returnToHub,
  selectStation,
  travelToEncounter,
} from "./campaign-model.js";

test("회수 캠페인은 생성·허브·대화 상태를 보존한다", () => {
  const started = beginCampaign(createCampaignState(), {
    name: "시험관",
    profile: "signal",
  });
  assert.equal(assertCampaignState(started), true);
  assert.equal(started.commanderName, "시험관");
  assert.equal(started.roster[0].name, "시험관");

  const talked = finishDialogue(openDialogue(started), 1);
  assert.equal(talked.stage, "hub");
  assert.equal(talked.relationships["commander-baekon"], 2);
});

test("신도림 이동은 자원과 층을 갱신하고 전투 검토 정산으로 이어진다", () => {
  const hub = beginCampaign(createCampaignState(), {
    name: "이주선",
    profile: "scout",
  });
  const route = acceptMission(hub);
  assert.equal(travelToEncounter(route), route);

  const encounter = travelToEncounter(selectStation(route, "sindorim"));
  assert.equal(encounter.stage, "encounter");
  assert.equal(encounter.supplies, 98);
  assert.equal(encounter.layer, "B2");

  const settled = resolveEncounter(encounter, "reviewed");
  assert.equal(settled.stage, "settlement");
  assert.equal(settled.supplies, 108);
  assert.equal(settled.reputation, 5);
  assert.match(settled.settlement.routeStatus, /전투 검토 완료/);

  const returned = returnToHub(settled);
  assert.equal(returned.stage, "hub");
  assert.equal(returned.layer, "B1");
});

test("협상과 우회는 Windows 소스의 공개 비용 분기를 유지한다", () => {
  const state = {
    ...createCampaignState(),
    stage: "encounter",
    supplies: 98,
    layer: "B2",
  };
  const negotiated = resolveEncounter(state, "negotiate");
  const discounted = resolveEncounter(
    {
      ...state,
      relationships: { "commander-baekon": 2 },
    },
    "negotiate",
  );
  const bypassed = resolveEncounter(state, "bypass");

  assert.equal(negotiated.supplies, 93);
  assert.equal(discounted.supplies, 94);
  assert.equal(negotiated.reputation, 3);
  assert.equal(bypassed.supplies, 96);
  assert.equal(bypassed.reputation, -1);
  assert.equal(bypassed.day, 2);
});
