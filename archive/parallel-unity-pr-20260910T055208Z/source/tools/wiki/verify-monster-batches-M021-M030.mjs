import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import confirmedManifest from "./confirmed-integration-manifest.json" with { type: "json" };

export const EXPECTED_BATCHES = Object.freeze({
  M021: ["G13E09", "G13E10", "G13E11", "G13E12", "G13E13", "G13E14", "G13E15", "G13E16", "G14E01", "G14E02"],
  M022: ["G14E03", "G14E04", "G14E05", "G14E06", "G14E07", "G14E08", "G14E09", "G14E10", "G14E11", "G14E12"],
  M023: ["G14E13", "G14E14", "G14E15", "G14E16", "G15E01", "G15E02", "G15E03", "G15E04", "G15E05", "G15E06"],
  M024: ["G15E07", "G15E08", "G15E09", "G15E10", "G15E11", "G15E12", "G15E13", "G15E14", "G15E15", "G15E16"],
  M025: ["G16E01", "G16E02", "G16E03", "G16E04", "G16E05", "G16E06", "G16E07", "G16E08", "G16E09", "G16E10"],
  M026: ["G16E11", "G16E12", "G16E13", "G16E14", "G16E15", "G16E16", "G17E01", "G17E02", "G17E03", "G17E04"],
  M027: ["G17E05", "G17E06", "G17E07", "G17E08", "G17E09", "G17E10", "G17E11", "G17E12", "G17E13", "G17E14"],
  M028: ["G17E15", "G17E16", "G18E01", "G18E02", "G18E03", "G18E04", "G18E05", "G18E06", "G18E07", "G18E08"],
  M029: ["G18E09", "G18E10", "G18E11", "G18E12", "G18E13", "G18E14", "G18E15", "G18E16", "G19E01", "G19E02"],
  M030: ["G19E03", "G19E04", "G19E05", "G19E06", "G19E07", "G19E08", "G19E09", "G19E10", "G19E11", "G19E12"],
});

export const REQUIRED_FIELDS = Object.freeze([
  "역할·신체",
  "기원",
  "서식·필요",
  "생애·정비",
  "행동·위계",
  "상승",
  "교전·대응",
  "교섭·도덕 선택",
  "시나리오 연결",
]);

export const NEAR_SIMILARITY_THRESHOLD = 0.8;

const ENTRY_HEADER = /^## (G\d{2}E\d{2}) · (.+)$/;

const FORBIDDEN_PROJECT_TOKENS = Object.freeze([
  "Kenshi",
  "Unity",
  "ChatGPT",
  "OpenAI",
  "lorem ipsum",
  "TODO",
  "FIXME",
]);

const FORBIDDEN_REAL_COMPANY_TOKENS = Object.freeze([
  "삼성전자",
  "현대자동차",
  "LG전자",
  "SK텔레콤",
  "네이버",
  "카카오",
]);

const ROLE_PATTERN_BY_E = Object.freeze({
  1: /통제자/,
  2: /일반 생태/,
  3: /일반 생태/,
  4: /일반 생태/,
  5: /직능/,
  6: /직능/,
  7: /직능/,
  8: /첫 번째 정예/,
  9: /두 번째 정예/,
  10: /환경 거점/,
  11: /환경 거점/,
  12: /손상|성장|노화/,
  13: /손상|성장|노화/,
  14: /공존/,
  15: /보스/,
  16: /지역 변종/,
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(text) {
  return text.normalize("NFC").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

function normalizeBody(fieldText) {
  return fieldText
    .normalize("NFC")
    .replace(/G\d{2}E\d{2}/g, "<ID>")
    .replace(/G\d{2}-SC\d+/g, "<SC>")
    .replace(/\s+/g, " ")
    .trim();
}

// Atlas projections carry the entry fields in one of three shapes:
//   `- 라벨: 본문`, `- **라벨:** 본문`, or `### 라벨` followed by a paragraph.
// Projection metadata lines (그룹/역할군/연결) are not entry fields.
const FIELD_LINE = /^(?:- \*\*([^*:]+):\*\*|- ([^:*]+):|### ([^\n]+))(.*)$/gm;

function parseFields(body) {
  const fields = new Map();
  const ordered = [];
  const matches = [...body.matchAll(FIELD_LINE)];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const label = (match[1] ?? match[2] ?? match[3]).trim();
    if (!REQUIRED_FIELDS.includes(label)) continue;
    let value = (match[4] ?? "").trim();
    if (match[3] !== undefined) {
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? body.length;
      value = body.slice(start, end).trim();
    }
    ordered.push(label);
    if (!fields.has(label)) fields.set(label, value);
  }
  return { fields, ordered };
}

export function verifyBatchText(text, batchId) {
  const errors = [];
  const expectedIds = EXPECTED_BATCHES[batchId];
  if (!expectedIds) {
    return { batch: batchId, status: "FAIL", entryCount: 0, errors: [`지원하지 않는 배치: ${batchId}`] };
  }

  const source = String(text ?? "").replace(/\r\n/g, "\n");
  const firstLine = source.split("\n")[0] ?? "";
  if (firstLine !== `# 몬스터 배치 ${batchId}`) {
    errors.push(`제목이 '# 몬스터 배치 ${batchId}'가 아니다`);
  }

  for (const token of FORBIDDEN_PROJECT_TOKENS) {
    if (source.includes(token)) errors.push(`금지 토큰: ${token}`);
  }
  for (const token of FORBIDDEN_REAL_COMPANY_TOKENS) {
    if (source.includes(token)) errors.push(`실재 기업 토큰 금지: ${token}`);
  }

  const lines = source.split("\n");
  const headings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(ENTRY_HEADER);
    if (match) headings.push({ id: match[1], title: match[2].trim(), line: index });
  }

  const actualIds = headings.map((heading) => heading.id);
  if (headings.length !== 10) {
    errors.push(`항목 수 불일치: expected=10 actual=${headings.length}`);
  }
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    errors.push(`ID 순서 불일치: expected=${expectedIds.join(",")} actual=${actualIds.join(",")}`);
  }

  const titles = new Map();
  const normalizedBodies = [];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const start = heading.line + 1;
    const end = headings[index + 1]?.line ?? lines.length;
    const body = lines.slice(start, end).join("\n");
    const { fields, ordered } = parseFields(body);
    const entryId = heading.id;
    const groupId = entryId.slice(0, 3);
    const eNumber = Number(entryId.slice(-2));

    if (titles.has(heading.title)) {
      errors.push(`${entryId}: 중복 제목 '${heading.title}'`);
    }
    titles.set(heading.title, entryId);

    for (const label of REQUIRED_FIELDS) {
      if (!fields.has(label)) errors.push(`${entryId}: 필수 항목 누락 '${label}'`);
      else if (!fields.get(label)) errors.push(`${entryId}: 빈 항목 '${label}'`);
    }
    if (ordered.join("\0") !== REQUIRED_FIELDS.join("\0")) {
      const missing = REQUIRED_FIELDS.filter((label) => !ordered.includes(label));
      if (missing.length === 0) errors.push(`${entryId}: 항목 순서 불일치`);
    }

    const role = fields.get("역할·신체") ?? "";
    const rolePattern = ROLE_PATTERN_BY_E[eNumber];
    if (rolePattern && !rolePattern.test(role)) {
      errors.push(`${entryId}: 역할 순서 불일치 (E-suffix E${String(eNumber).padStart(2, "0")})`);
    }

    const escalation = fields.get("상승") ?? "";
    for (const stage of ["1단계", "2단계", "3단계"]) {
      if (!escalation.includes(stage)) {
        errors.push(`${entryId}: 상승에 ${stage}가 없다`);
      }
    }

    const scenario = fields.get("시나리오 연결") ?? "";
    const scenarioIds = [...scenario.matchAll(/G(\d{2})-SC(\d+)/g)];
    if (scenarioIds.length === 0) {
      errors.push(`${entryId}: 같은 그룹 시나리오 ID가 없다`);
    } else {
      for (const match of scenarioIds) {
        const foundGroup = `G${match[1]}`;
        if (foundGroup !== groupId) {
          errors.push(`${entryId}: 시나리오 그룹 불일치 ${match[0]}`);
        }
      }
      if (!scenarioIds.some((match) => `G${match[1]}` === groupId)) {
        errors.push(`${entryId}: 같은 그룹 시나리오 ID가 없다`);
      }
    }

    const fieldText = REQUIRED_FIELDS.map((label) => fields.get(label) ?? "").join("\n");
    normalizedBodies.push({
      id: entryId,
      normalized: normalizeBody(fieldText),
    });
  }

  const seen = new Map();
  for (const entry of normalizedBodies) {
    const previous = seen.get(entry.normalized);
    if (previous) errors.push(`${entry.id}: 다른 개체와 본문이 동일하다 (${previous})`);
    else seen.set(entry.normalized, entry.id);
  }

  for (let i = 0; i < normalizedBodies.length; i += 1) {
    for (let j = i + 1; j < normalizedBodies.length; j += 1) {
      const left = normalizedBodies[i];
      const right = normalizedBodies[j];
      if (left.normalized === right.normalized) continue;
      const score = jaccard(tokenize(left.normalized), tokenize(right.normalized));
      if (score >= NEAR_SIMILARITY_THRESHOLD) {
        errors.push(`${right.id}: 본문이 ${left.id}와 과도하게 유사하다`);
      }
    }
  }

  return {
    batch: batchId,
    status: errors.length === 0 ? "PASS" : "FAIL",
    entryCount: headings.length,
    errors,
  };
}

export async function verifyMonsterBatches(root, options = {}) {
  const extraErrors = [];
  const targetBatches = options.batch ? [options.batch] : Object.keys(EXPECTED_BATCHES);
  const batches = [];

  for (const batchId of targetBatches) {
    if (!EXPECTED_BATCHES[batchId]) {
      batches.push({
        batch: batchId,
        status: "FAIL",
        entryCount: 0,
        errors: [`지원하지 않는 배치: ${batchId}`],
      });
      continue;
    }
    const filePath = path.join(root, `Monster-Batch-${batchId}.md`);
    try {
      const text = await readFile(filePath, "utf8");
      batches.push(verifyBatchText(text, batchId));
    } catch (error) {
      batches.push({
        batch: batchId,
        status: "FAIL",
        entryCount: 0,
        errors: [`파일 읽기 실패: ${filePath}: ${error.code ?? error.message}`],
      });
    }
  }

  if (!options.batch) {
    try {
      const names = await readdir(root);
      for (const name of names) {
        const match = name.match(/^Monster-Batch-(M\d{3})\.md$/);
        if (match && !EXPECTED_BATCHES[match[1]] && !confirmedManifest.monsters.includes(match[1])) {
          extraErrors.push(`out-of-range file: ${name}`);
        }
      }
    } catch (error) {
      extraErrors.push(`root를 읽을 수 없다: ${error.code ?? error.message}`);
    }
  }

  const entryCount = batches.reduce((sum, batch) => sum + batch.entryCount, 0);
  const status = batches.every((batch) => batch.status === "PASS") && extraErrors.length === 0
    ? "PASS"
    : "FAIL";
  return {
    status,
    batchCount: batches.length,
    entryCount,
    batches,
    errors: extraErrors,
  };
}

function parseCliArgs(argv) {
  const parsed = { json: false, root: null, batch: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      parsed.json = true;
      continue;
    }
    if (arg === "--root") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) return { ok: false, error: "missing --root value" };
      parsed.root = value;
      index += 1;
      continue;
    }
    if (arg === "--batch") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) return { ok: false, error: "missing --batch value" };
      parsed.batch = value;
      index += 1;
      continue;
    }
    return { ok: false, error: `unknown argument: ${arg}` };
  }
  if (!parsed.root) return { ok: false, error: "missing required --root" };
  return { ok: true, ...parsed };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const parsed = parseCliArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(parsed.error);
    process.exit(1);
  }
  const report = await verifyMonsterBatches(parsed.root, { batch: parsed.batch });
  if (parsed.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const batch of report.batches) {
      console.log(`${batch.batch}: ${batch.status} (${batch.entryCount} entries)`);
      for (const error of batch.errors) console.error(`  - ${error}`);
    }
    for (const error of report.errors) console.error(`  - ${error}`);
  }
  process.exit(report.status === "PASS" ? 0 : 1);
}
