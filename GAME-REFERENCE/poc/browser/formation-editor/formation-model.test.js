import test from "node:test";
import assert from "node:assert/strict";

import {
  assertFormation,
  confirmFormation,
  createInitialState,
  editFormation,
  getUnitSlot,
  moveUnit,
  resetFormation,
} from "./formation-model.js";

test("빈 목적지 배치는 유닛을 중복하지 않고 기존 칸을 비운다", () => {
  const initial = createInitialState();
  const moved = moveUnit(initial, "ally-guard-1", "middle-left");

  assert.equal(getUnitSlot(moved.pending, "ally-guard-1"), "middle-left");
  assert.equal(initial.pending["front-left"], "ally-guard-1");
  assert.equal(moved.pending["front-left"], undefined);
  assert.equal(new Set(Object.values(moved.pending)).size, 6);
  assert.equal(assertFormation(moved.pending), true);
});

test("점유된 목적지로 배치하면 두 유닛이 정확히 자리를 바꾼다", () => {
  const initial = createInitialState();
  const swapped = moveUnit(initial, "ally-guard-1", "rear-right");

  assert.equal(swapped.pending["rear-right"], "ally-guard-1");
  assert.equal(swapped.pending["front-left"], "ally-archer-2");
  assert.equal(new Set(Object.values(swapped.pending)).size, 6);
  assert.equal(assertFormation(swapped.pending), true);
});

test("명시적 배치 확정은 편집을 잠그고 다시 편집할 때만 변경을 허용한다", () => {
  const arranged = moveUnit(
    createInitialState(),
    "ally-assault-2",
    "middle-left",
  );
  const confirmed = confirmFormation(arranged);

  assert.equal(confirmed.locked, true);
  assert.deepEqual(confirmed.confirmed, confirmed.pending);
  assert.equal(
    moveUnit(confirmed, "ally-guard-2", "rear-center"),
    confirmed,
  );

  const editing = editFormation(confirmed);
  assert.equal(editing.locked, false);

  const revised = moveUnit(editing, "ally-guard-2", "rear-center");
  assert.equal(getUnitSlot(revised.pending, "ally-guard-2"), "rear-center");

  const reset = resetFormation(revised);
  assert.equal(reset.locked, false);
  assert.equal(reset.confirmed, null);
  assert.deepEqual(reset.pending, createInitialState().pending);
});
