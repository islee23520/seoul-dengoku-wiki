import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  EXPECTED_BATCHES,
  REQUIRED_FIELDS,
  verifyBatchText,
  verifyMonsterBatches,
} from "./verify-monster-batches-M021-M030.mjs";

const VERIFIER = fileURLToPath(new URL("./verify-monster-batches-M021-M030.mjs", import.meta.url));

function roleForId(entryId) {
  const e = Number(entryId.slice(-2));
  switch (e) {
    case 1:
      return "군집의 통제자로, 시험 몸체다.";
    case 2:
    case 3:
    case 4:
      return "일반 생태형으로, 시험 몸체다.";
    case 5:
    case 6:
    case 7:
      return "직능 특수형으로, 시험 몸체다.";
    case 8:
      return "첫 번째 정예로, 시험 몸체다.";
    case 9:
      return "두 번째 정예로, 시험 몸체다.";
    case 10:
    case 11:
      return "환경 거점형으로, 시험 몸체다.";
    case 12:
      return "손상 단계형으로, 시험 몸체다.";
    case 13:
      return "노화 단계형으로, 시험 몸체다.";
    case 14:
      return "공존형으로, 시험 몸체다.";
    case 15:
      return "시나리오 보스로, 시험 몸체다.";
    case 16:
      return "지역 변종으로, 시험 몸체다.";
    default:
      throw new Error(entryId);
  }
}

function fieldValue(batchId, entryId, index, field) {
  const groupId = entryId.slice(0, 3);
  const uniq = `표식${batchId}n${index}c${REQUIRED_FIELDS.indexOf(field)}`;
  if (field === "역할·신체") return `${roleForId(entryId)} ${uniq}`;
  if (field === "상승") return `${uniq}에서 1단계 경고, 2단계 제한, 3단계 봉쇄를 한다.`;
  if (field === "시나리오 연결") return `${groupId}-SC1`;
  return `${uniq} ${field} 서술.`;
}

function renderEntry(batchId, entryId, index, fieldOverrides = {}) {
  const title = `시험개체-${batchId}-${entryId}`;
  const lines = REQUIRED_FIELDS.map((field) => {
    const value = Object.hasOwn(fieldOverrides, field)
      ? fieldOverrides[field]
      : fieldValue(batchId, entryId, index, field);
    return `- ${field}: ${value}`;
  });
  return `## ${entryId} · ${title}\n${lines.join("\n")}`;
}

function fixtureBatch(batchId, entryOverrides = {}) {
  const entries = EXPECTED_BATCHES[batchId].map((entryId, index) => {
    const override = entryOverrides[entryId] ?? {};
    if (override.raw) return override.raw;
    return renderEntry(batchId, entryId, index, override.fields);
  });
  return `# 몬스터 배치 ${batchId}\n\n${entries.join("\n\n")}\n`;
}

function runCli(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [VERIFIER, ...args], {
      cwd: path.resolve("."),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

test("live M021-M030 10/100 PASS", async () => {
  const report = await verifyMonsterBatches("docs/game-logic");
  assert.equal(report.status, "PASS", JSON.stringify(report, null, 2));
  assert.equal(report.batchCount, 10);
  assert.equal(report.entryCount, 100);
  assert.equal(report.batches.length, 10);
  for (const batch of report.batches) {
    assert.equal(batch.status, "PASS", JSON.stringify(batch, null, 2));
    assert.equal(batch.entryCount, 10);
  }
});

test("열 개의 완전한 fixture 배치를 승인한다", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "monster-M021-M030-ok-"));
  try {
    for (const batchId of Object.keys(EXPECTED_BATCHES)) {
      await writeFile(path.join(root, `Monster-Batch-${batchId}.md`), fixtureBatch(batchId));
    }
    const report = await verifyMonsterBatches(root);
    assert.equal(report.status, "PASS", JSON.stringify(report, null, 2));
    assert.equal(report.batchCount, 10);
    assert.equal(report.entryCount, 100);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("필수 항목이 빠진 개체를 거부한다", () => {
  const text = fixtureBatch("M021").replace(/^- 교섭·도덕 선택:.*\n/m, "");
  const report = verifyBatchText(text, "M021");
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("교섭·도덕 선택")));
});

test("manifest의 ID 순서와 다른 배치를 거부한다", () => {
  const text = fixtureBatch("M021")
    .replace("## G13E09 ·", "## TEMP ·")
    .replace("## G13E10 ·", "## G13E09 ·")
    .replace("## TEMP ·", "## G13E10 ·");
  const report = verifyBatchText(text, "M021");
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("ID 순서") || error.includes("ID")));
});

test("중복 ID를 거부한다", () => {
  const text = fixtureBatch("M021").replace("## G13E10 ·", "## G13E09 ·");
  const report = verifyBatchText(text, "M021");
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("ID") || error.includes("중복")));
});

test("중복 제목을 거부한다", () => {
  const text = fixtureBatch("M021").replace("시험개체-M021-G13E10", "시험개체-M021-G13E09");
  const report = verifyBatchText(text, "M021");
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("중복") && (error.includes("제목") || error.includes("이름"))));
});

test("정규화된 본문 완전 중복을 거부한다", () => {
  const donorFields = Object.fromEntries(
    REQUIRED_FIELDS.map((field) => [field, fieldValue("M021", "G13E10", 1, field)]),
  );
  const text = fixtureBatch("M021", {
    G13E11: { fields: donorFields },
  });
  const report = verifyBatchText(text, "M021");
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("본문") && error.includes("동일")));
});

test("근접 복제 본문을 거부한다", () => {
  const donorFields = Object.fromEntries(
    REQUIRED_FIELDS.map((field) => [field, fieldValue("M021", "G13E10", 1, field)]),
  );
  donorFields["역할·신체"] = fieldValue("M021", "G13E11", 2, "역할·신체");
  donorFields["기원"] = `${donorFields["기원"]} 복제흔적`;
  const text = fixtureBatch("M021", {
    G13E11: { fields: donorFields },
  });
  const report = verifyBatchText(text, "M021");
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("유사")));
});

test("E-suffix 역할 불일치를 거부한다", () => {
  const text = fixtureBatch("M021", {
    G13E09: { fields: { "역할·신체": "일반 생태형으로, 잘못된 역할이다. 표식M021n0c0" } },
  });
  const report = verifyBatchText(text, "M021");
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("역할")));
});

test("다른 그룹 시나리오 ID를 거부한다", () => {
  const text = fixtureBatch("M021", {
    G13E09: { fields: { "시나리오 연결": "G99-SC1" } },
  });
  const report = verifyBatchText(text, "M021");
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("시나리오")));
});

test("상승 단계 표기 누락을 거부한다", () => {
  const text = fixtureBatch("M021", {
    G13E09: { fields: { "상승": "표식M021n0c5에서 경고만 하고 단계를 생략한다." } },
  });
  const report = verifyBatchText(text, "M021");
  assert.equal(report.status, "FAIL");
  assert.ok(report.errors.some((error) => error.includes("1단계") || error.includes("2단계") || error.includes("3단계") || error.includes("상승")));
});

test("실재 기업 토큰은 원천 캐논에서 허용된다(개명 이음새)", () => {
  const text = fixtureBatch("M021", {
    G13E09: { fields: { "기원": "삼성전자 창고에서 깨어났다. 표식M021n0c1" } },
  });
  const report = verifyBatchText(text, "M021");
  assert.ok(
    !report.errors.some((error) => error.includes("삼성전자") || error.includes("실재 기업")),
    JSON.stringify(report.errors),
  );
});

test("범위 밖 Monster-Batch 파일을 거부한다", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "monster-M021-M030-oor-"));
  try {
    for (const batchId of Object.keys(EXPECTED_BATCHES)) {
      await writeFile(path.join(root, `Monster-Batch-${batchId}.md`), fixtureBatch(batchId));
    }
    await writeFile(path.join(root, "Monster-Batch-M999.md"), "# 몬스터 배치 M999\n");
    const report = await verifyMonsterBatches(root);
    assert.equal(report.status, "FAIL");
    assert.ok(JSON.stringify(report).includes("out-of-range") || JSON.stringify(report).includes("M999"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("잘못된 CLI 인자는 nonzero clean error", async () => {
  const missing = await runCli(["--json"]);
  assert.notEqual(missing.code, 0);
  assert.ok(missing.stderr.includes("--root"));

  const unknown = await runCli(["--root", "docs/game-logic", "--nope"]);
  assert.notEqual(unknown.code, 0);
  assert.ok(unknown.stderr.includes("unknown") || unknown.stderr.includes("--nope"));
});
