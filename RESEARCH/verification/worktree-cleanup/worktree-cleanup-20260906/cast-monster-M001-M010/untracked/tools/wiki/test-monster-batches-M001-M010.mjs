import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  EXPECTED_BATCHES,
  verifyBatchText,
  verifyMonsterBatches,
} from "./verify-monster-batches-M001-M010.mjs";

const SECTION_NAMES = [
  "역할·신체",
  "기원",
  "서식",
  "필요·경제",
  "생애·정비",
  "행동·위계",
  "단계적 위협",
  "전투·대응",
  "협상·도덕 선택",
  "시나리오 연결",
];

function fixtureBatch(batchId) {
  const entries = EXPECTED_BATCHES[batchId].map((entryId, index) => {
    const groupId = entryId.slice(0, 3);
    const sections = SECTION_NAMES.map((section) => {
      const body = section === "시나리오 연결"
        ? `${groupId}-SC1에서 개체 ${entryId}의 선택 결과를 기록한다.`
        : `${entryId}의 ${section} 계약을 개체별 표식 ${index + 1}로 구체화한다.`;
      return `### ${section}\n\n${body}`;
    }).join("\n\n");
    return `## 개체 ${entryId} · 시험개체-${batchId}-${index + 1}\n\n${sections}`;
  }).join("\n\n");
  return `# 몬스터 배치 ${batchId}\n\n> 오너 작성 배치 원본 · Atlas 통합 대기\n\n${entries}\n`;
}

test("현재 worktree의 M001-M010 문서 계약이 모두 통과한다", async () => {
  const report = await verifyMonsterBatches("docs/game-logic");
  assert.equal(report.status, "PASS", JSON.stringify(report, null, 2));
  assert.equal(report.batchCount, 10);
  assert.equal(report.entryCount, 100);
});

test("필수 의미 절이 빠진 개체를 거부한다", () => {
  const text = fixtureBatch("M001").replace("### 필요·경제", "### 누락된-필요-경제");
  const report = verifyBatchText("M001", text);
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("필수 절 누락 '필요·경제'")));
});

test("manifest의 ID 순서와 다른 배치를 거부한다", () => {
  const text = fixtureBatch("M001")
    .replace("G01E01", "TEMP-ID")
    .replaceAll("G01E02", "G01E01")
    .replaceAll("TEMP-ID", "G01E02");
  const report = verifyBatchText("M001", text);
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("ID 순서 불일치")));
});

test("열 개의 완전한 fixture 배치를 승인한다", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "monster-M001-M010-"));
  try {
    for (const batchId of Object.keys(EXPECTED_BATCHES)) {
      await writeFile(path.join(root, `Monster-Batch-${batchId}.md`), fixtureBatch(batchId));
    }
    const report = await verifyMonsterBatches(root);
    assert.equal(report.status, "PASS", JSON.stringify(report, null, 2));
    assert.equal(report.entryCount, 100);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
