import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXPECTED_BATCHES = Object.freeze({
  M001: ["G01E01", "G01E02", "G01E03", "G01E04", "G01E05", "G01E06", "G01E07", "G01E08", "G01E09", "G01E10"],
  M002: ["G01E11", "G01E12", "G01E13", "G01E14", "G01E15", "G01E16", "G02E01", "G02E02", "G02E03", "G02E04"],
  M003: ["G02E05", "G02E06", "G02E07", "G02E08", "G02E09", "G02E10", "G02E11", "G02E12", "G02E13", "G02E14"],
  M004: ["G02E15", "G02E16", "G03E01", "G03E02", "G03E03", "G03E04", "G03E05", "G03E06", "G03E07", "G03E08"],
  M005: ["G03E09", "G03E10", "G03E11", "G03E12", "G03E13", "G03E14", "G03E15", "G03E16", "G04E01", "G04E02"],
  M006: ["G04E03", "G04E04", "G04E05", "G04E06", "G04E07", "G04E08", "G04E09", "G04E10", "G04E11", "G04E12"],
  M007: ["G04E13", "G04E14", "G04E15", "G04E16", "G05E01", "G05E02", "G05E03", "G05E04", "G05E05", "G05E06"],
  M008: ["G05E07", "G05E08", "G05E09", "G05E10", "G05E11", "G05E12", "G05E13", "G05E14", "G05E15", "G05E16"],
  M009: ["G06E01", "G06E02", "G06E03", "G06E04", "G06E05", "G06E06", "G06E07", "G06E08", "G06E09", "G06E10"],
  M010: ["G06E11", "G06E12", "G06E13", "G06E14", "G06E15", "G06E16", "G07E01", "G07E02", "G07E03", "G07E04"],
});

const REQUIRED_SECTIONS = Object.freeze([
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
]);

const FORBIDDEN_REAL_COMPANY_TOKENS = Object.freeze([
  "삼성전자",
  "현대자동차",
  "LG전자",
  "SK텔레콤",
  "네이버",
  "카카오",
]);

function entrySections(entryBody) {
  const sections = new Map();
  const matches = [...entryBody.matchAll(/^### (.+)$/gm)];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? entryBody.length;
    sections.set(match[1].trim(), entryBody.slice(start, end).trim());
  }
  return sections;
}

export function verifyBatchText(batchId, text) {
  const errors = [];
  const expectedIds = EXPECTED_BATCHES[batchId];
  if (!expectedIds) {
    return { batch: batchId, status: "FAIL", entryCount: 0, errors: [`지원하지 않는 배치: ${batchId}`] };
  }

  if (!text.startsWith(`# 몬스터 배치 ${batchId}\n`)) {
    errors.push(`제목이 '# 몬스터 배치 ${batchId}'가 아니다`);
  }
  if (!text.includes("오너 작성 배치 원본") || !text.includes("Atlas 통합 대기")) {
    errors.push("오너 작성 배치 원본 및 Atlas 통합 대기 표기가 없다");
  }

  for (const token of FORBIDDEN_REAL_COMPANY_TOKENS) {
    if (text.includes(token)) errors.push(`실재 기업 토큰 금지: ${token}`);
  }

  const headings = [...text.matchAll(/^## 개체 (G\d{2}E\d{2}) · (.+)$/gm)];
  const actualIds = headings.map((match) => match[1]);
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    errors.push(`ID 순서 불일치: expected=${expectedIds.join(",")} actual=${actualIds.join(",")}`);
  }

  const names = new Set();
  const normalizedEntries = new Set();
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const entryId = heading[1];
    const name = heading[2].trim();
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? text.length;
    const body = text.slice(start, end).trim();
    const sections = entrySections(body);

    if (names.has(name)) errors.push(`${entryId}: 중복 이름 '${name}'`);
    names.add(name);

    for (const section of REQUIRED_SECTIONS) {
      if (!sections.has(section)) errors.push(`${entryId}: 필수 절 누락 '${section}'`);
      else if (!sections.get(section)) errors.push(`${entryId}: 빈 절 '${section}'`);
    }

    const groupId = entryId.slice(0, 3);
    const scenarioBody = sections.get("시나리오 연결") ?? "";
    if (!new RegExp(`${groupId}-SC[123]`).test(scenarioBody)) {
      errors.push(`${entryId}: ${groupId} 시나리오 링크가 없다`);
    }

    const normalized = body.replace(/G\d{2}E\d{2}|G\d{2}-SC[123]/g, "<ID>").replace(/\s+/g, " ").trim();
    if (normalizedEntries.has(normalized)) errors.push(`${entryId}: 다른 개체와 본문이 동일하다`);
    normalizedEntries.add(normalized);
  }

  return {
    batch: batchId,
    status: errors.length === 0 ? "PASS" : "FAIL",
    entryCount: headings.length,
    errors,
  };
}

export async function verifyMonsterBatches(root) {
  const batches = [];
  for (const batchId of Object.keys(EXPECTED_BATCHES)) {
    const filePath = path.join(root, `Monster-Batch-${batchId}.md`);
    try {
      const text = await readFile(filePath, "utf8");
      batches.push(verifyBatchText(batchId, text));
    } catch (error) {
      batches.push({
        batch: batchId,
        status: "FAIL",
        entryCount: 0,
        errors: [`파일 읽기 실패: ${filePath}: ${error.code ?? error.message}`],
      });
    }
  }

  const entryCount = batches.reduce((sum, batch) => sum + batch.entryCount, 0);
  return {
    status: batches.every((batch) => batch.status === "PASS") ? "PASS" : "FAIL",
    batchCount: batches.length,
    entryCount,
    batches,
  };
}

function parseRoot(argv) {
  const rootIndex = argv.indexOf("--root");
  return rootIndex >= 0 ? argv[rootIndex + 1] : "docs/game-logic";
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const report = await verifyMonsterBatches(parseRoot(process.argv.slice(2)));
  if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else {
    for (const batch of report.batches) {
      console.log(`${batch.batch}: ${batch.status} (${batch.entryCount} entries)`);
      for (const error of batch.errors) console.error(`  - ${error}`);
    }
  }
  if (report.status !== "PASS") process.exitCode = 1;
}
