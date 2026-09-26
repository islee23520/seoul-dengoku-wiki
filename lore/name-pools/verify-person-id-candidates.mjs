// person-id-candidates.json 동결·재생성·검증기 (node --test)
//
// 계약 (schema: wiki-person-id-candidates.v1)
// - 후보 명부는 lore/name-pools/values-cast.json의 people[] 배열 순서를 그대로 유지한다 (이름 정렬 금지).
// - 기존 신원 K001–K422은 lore/World-Narrative-Atlas.md의 "humans" 기계 등록부를 정본으로 읽는다.
//   (사회 서사 배치 원장 투영은 2026-09-24에 폐기되어 대조하지 않는다.)
// - inputSha256은 최종 values-cast.json 파일 바이트의 SHA-256이다.
//   baseCommit은 생성 시점 HEAD 40자리 커밋이다.
//   baseCommit은 증명 값이므로 재생성 검사는 커밋된 표의 baseCommit을 전달해 전체 바이트가 같음을 확인한다.
// - 후보는 ordinal 1..N만 받는다. 실제 K423+ 번호 발급은 이 표에서 하지 않는다.
//
// 실행
// - 검증: node --test lore/name-pools/verify-person-id-candidates.mjs
// - 생성: node lore/name-pools/verify-person-id-candidates.mjs --write [--force]
//   (생성은 values-cast.json을 절대 고치지 않는다. 출력이 이미 있는 파일과 다르면 --force가 필요하다.)
//
// 파괴 검사(mutations)는 RED-provable 이다: 검증 규칙이 없으면 아래 변이 테스트 자체가 실패한다.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const VALUES_PATH = path.join(REPO, "lore", "name-pools", "values-cast.json");
const ATLAS_PATH = path.join(REPO, "lore", "World-Narrative-Atlas.md");
const CHARS_DIR = path.join(REPO, "lore", "characters");
const CORRIDORS_PATH = path.join(CHARS_DIR, "Cast-Corridors-Index.md");
const CORE_PATH = path.join(CHARS_DIR, "Core-Characters.md");
const UNAFFILIATED_PATH = path.join(CHARS_DIR, "Cast-Unaffiliated.md");
const TABLE_PATH = path.join(HERE, "person-id-candidates.json");

export const SCHEMA = "wiki-person-id-candidates.v1";
export const FROZEN = { existingK: 422, candidates: 594, total: 1016 };

export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

// 정본 텍스트에서 "key": [ ... ] JSON 배열을 정확히 한 번 추출한다 (따옴표 안 괄호는 무시).
export function extractJsonArrayOnce(text, key) {
  const marker = `"${key}": [`;
  const first = text.indexOf(marker);
  if (first < 0) throw new Error(`"${key}" 등록부가 원문에 없다`);
  if (text.indexOf(marker, first + 1) >= 0) throw new Error(`"${key}" 등록부가 두 번 이상 나온다`);
  const start = text.indexOf("[", first);
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escaped) { escaped = false; continue; }
    if (c === "\\") { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === "[") depth++;
    if (c === "]") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error(`"${key}" 등록부의 배열이 닫히지 않는다`);
}

export function loadContext() {
  const valuesBytes = readFileSync(VALUES_PATH);
  const valuesJson = JSON.parse(valuesBytes.toString("utf8"));
  const atlasText = readFileSync(ATLAS_PATH, "utf8");
  const humans = JSON.parse(extractJsonArrayOnce(atlasText, "humans"));
  const coreText = readFileSync(CORE_PATH, "utf8");
  const coreNames = [...coreText.matchAll(/^## (.+)$/gm)]
    .map((m) => m[1].trim())
    .filter((n) => !n.startsWith("부록"));
  const castStateNames = [];
  for (let i = 1; i <= 16; i++) {
    const file = path.join(CHARS_DIR, `Cast-State-${String(i).padStart(2, "0")}.md`);
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/^### 인물 (.+)$/gm)) castStateNames.push(m[1].trim());
  }
  const unaffText = readFileSync(UNAFFILIATED_PATH, "utf8");
  const unaffiliated = [];
  for (const block of unaffText.split(/^### /m).slice(1)) {
    const nameMatch = block.match(/^인물 (.+)$/m);
    const idMatch = block.match(/^- 캐릭터 ID: (\S+)/m);
    if (nameMatch) {
      unaffiliated.push({ name: nameMatch[1].trim(), characterId: idMatch ? idMatch[1] : null });
    }
  }
  const corridorsText = readFileSync(CORRIDORS_PATH, "utf8");
  // The index displays ledger aliases; only these two identities are backed by corridor cards.
  const corridorAliases = new Map([
    ["린샤오메이 (임소매)", "린샤오메이"],
    ["팜반득 (범반득)", "팜반득"],
  ]);
  const corridorsNames = [...corridorsText.matchAll(/^\| ([^|]+) \|/gm)]
    .map((m) => corridorAliases.get(m[1].trim()) ?? m[1].trim())
    .filter((n) => n !== "이름" && !/^-+$/.test(n));
  return {
    valuesBytes,
    valuesJson,
    humans,
    ledger: { coreNames, castStateNames, unaffiliated, corridorsNames },
  };
}

export function buildTable(ctx, baseCommit) {
  const people = ctx.valuesJson.people;
  const peopleByName = new Map(people.map((p, i) => [p.name, i]));
  const atlasById = new Map(ctx.humans.map((h) => [h.id, h]));
  const notes = [];

  for (const h of ctx.humans) {
    if (!peopleByName.has(h.name)) {
      notes.push({ type: "k-name-not-in-values", name: h.name, detail: `기존 K(${h.id})가 values-cast.json people에 없다` });
    }
  }

  const kNames = new Set(ctx.humans.map((h) => h.name));
  const unaffByName = new Map(ctx.ledger.unaffiliated.map((u) => [u.name, u]));
  const existingK = ctx.humans.map((h) => ({ id: h.id, name: h.name }));
  const candidates = [];
  let ordinal = 0;
  for (const p of people) {
    if (kNames.has(p.name)) continue;
    ordinal++;
    candidates.push({
      ordinal,
      name: p.name,
      stage: p.stage,
      state: p.state,
      title: p.title,
      locked: p.locked === true,
    });
    const unaff = unaffByName.get(p.name);
    if (unaff && unaff.characterId && !/^K\d+$/u.test(unaff.characterId)) {
      notes.push({
        type: "existing-non-k-character-id",
        name: p.name,
        detail: `후보에 포함됐으나 무소속 카드에 안정 캐릭터 ID(${unaff.characterId})가 이미 있다 — K423+ 발급 전 중복 신원 여부를 사람이 확정해야 한다`,
      });
    }
    if (p.stage === "주요") {
      notes.push({
        type: "core-tier-without-k",
        name: p.name,
        detail: "주요 단계 잠금 인물인데 K 식별자가 없다",
      });
    } else if (p.stage === "S1" || p.stage === "S2" || p.stage === "S3") {
      notes.push({
        type: "state-tier-without-k",
        name: p.name,
        detail: `${p.stage} 단계 인물인데 K 식별자가 없다`,
      });
    }
  }
  for (const n of ctx.ledger.corridorsNames) {
    if (!peopleByName.has(n)) {
      notes.push({
        type: "ledger-person-not-in-values",
        name: n,
        detail: "회랑 인물 총람에 이름이 있으나 values-cast.json people에 없어 이 표의 대상 밖이다",
      });
    }
  }

  return {
    schema: SCHEMA,
    inputSha256: sha256Hex(ctx.valuesBytes),
    baseCommit,
    totalPeople: people.length,
    existingKCount: ctx.humans.length,
    candidateCount: candidates.length,
    existingK,
    candidates,
    NOTES: notes,
  };
}

export function serializeTable(table) {
  return JSON.stringify(table, null, 2) + "\n";
}

// 순수 검증: 위반 목록을 문자열로 돌려준다 (빈 배열 = 통과).
export function validateTable(table, ctx) {
  const v = [];
  const people = ctx.valuesJson.people;
  if (table.schema !== SCHEMA) v.push(`schema가 ${SCHEMA}이 아니다`);
  if (!/^[0-9a-f]{40}$/.test(table.baseCommit || "")) v.push("baseCommit이 40자리 16진수가 아니다");
  const actualSha = sha256Hex(ctx.valuesBytes);
  if (table.inputSha256 !== actualSha) v.push(`inputSha256(${table.inputSha256})이 실제 값(${actualSha})과 다르다`);
  if (table.totalPeople !== people.length) v.push(`totalPeople(${table.totalPeople})이 people 길이(${people.length})과 다르다`);
  if (table.existingKCount !== ctx.humans.length) v.push(`existingKCount(${table.existingKCount})이 등록부 길이(${ctx.humans.length})과 다르다`);
  if (table.candidateCount !== table.candidates.length) v.push(`candidateCount(${table.candidateCount})이 후보 행 수(${table.candidates.length})과 다르다`);
  if (table.totalPeople !== table.existingKCount + table.candidateCount) {
    v.push(`개수 불변식 위반: ${table.existingKCount} + ${table.candidateCount} ≠ ${table.totalPeople}`);
  }
  if (table.existingKCount !== FROZEN.existingK || table.candidateCount !== FROZEN.candidates || table.totalPeople !== FROZEN.total) {
    v.push(`동결 기준값 위반: ${FROZEN.existingK}+${FROZEN.candidates}=${FROZEN.total}이어야 한다 (실제 ${table.existingKCount}+${table.candidateCount}=${table.totalPeople})`);
  }
  const expectedK = ctx.humans.map((h) => ({ id: h.id, name: h.name }));
  if (JSON.stringify(table.existingK) !== JSON.stringify(expectedK)) {
    v.push("existingK 스냅숏이 아틀라스 humans 등록부와 다르다");
  }
  const kNames = new Set(ctx.humans.map((h) => h.name));
  const expectedNames = people.filter((p) => !kNames.has(p.name)).map((p) => p.name);
  const gotNames = table.candidates.map((c) => c.name);
  if (gotNames.length !== expectedNames.length || gotNames.some((n, i) => n !== expectedNames[i])) {
    v.push("후보 순서가 values-cast.json people[] 배열 순서와 다르다");
  }
  table.candidates.forEach((c, i) => {
    if (kNames.has(c.name)) v.push(`기존 K 인물(${c.name})이 후보 ${c.ordinal}번에 섞여 있다`);
    if (c.ordinal !== i + 1) v.push(`ordinal 불일치: 행 ${i + 1}번이 ordinal ${c.ordinal}`);
    const p = people.find((x) => x.name === c.name);
    if (!p) {
      v.push(`후보 ${c.ordinal}번(${c.name})이 people에 없다`);
    } else {
      if (c.stage !== p.stage || c.state !== p.state || c.title !== p.title || c.locked !== (p.locked === true)) {
        v.push(`후보 ${c.ordinal}번(${c.name})의 구분 필드가 values-cast 원본 행과 다르다`);
      }
    }
  });
  if (!Array.isArray(table.NOTES)) v.push("NOTES가 배열이 아니다");
  else {
    table.NOTES.forEach((n, i) => {
      if (!n || typeof n.type !== "string" || typeof n.name !== "string") v.push(`NOTES ${i + 1}번 행 형식이 잘못됐다`);
    });
  }
  if (serializeTable(JSON.parse(serializeTable(table))) !== serializeTable(table)) {
    v.push("직렬화가 결정적이지 않다 (재직렬화 결과가 다르다)");
  }
  return v;
}

// ---- 진입: --write면 생성 CLI만 돌고, 아니면 node:test 계약 검사를 등록한다 ----

const CLI_WRITE = process.argv.includes("--write");

if (!CLI_WRITE) {
  assert.ok(existsSync(TABLE_PATH), "person-id-candidates.json이 있어야 한다 (먼저 --write로 생성한다)");
  const ctx = loadContext();
  const committedBytes = readFileSync(TABLE_PATH, "utf8");
  const committed = JSON.parse(committedBytes);
  const regen1 = buildTable(ctx, committed.baseCommit);
  const regen2 = buildTable(ctx, committed.baseCommit);

  test("(a) values-cast.json에서 재생성한 표가 커밋된 표와 바이트 단위로 같다", () => {
    assert.equal(serializeTable(regen1), committedBytes);
  });

  test("(a) 두 번 연속 재생성도 바이트 단위로 같다", () => {
    assert.equal(serializeTable(regen1), serializeTable(regen2));
  });

  test("커밋된 표가 모든 불변식을 통과한다", () => {
    assert.deepEqual(validateTable(committed, ctx), []);
  });

  test("(b) 개수 불변식 422 + 594 = 1016", () => {
    assert.equal(committed.existingKCount, 422);
    assert.equal(committed.candidateCount, 594);
    assert.equal(committed.totalPeople, 1016);
    assert.equal(committed.existingKCount + committed.candidateCount, committed.totalPeople);
    assert.equal(committed.candidateCount, committed.totalPeople - committed.existingKCount);
  });

  test("(c) 기존 K 인물이 후보에 한 명도 없다", () => {
    const kNames = new Set(ctx.humans.map((h) => h.name));
    for (const c of committed.candidates) assert.equal(kNames.has(c.name), false, c.name);
  });

  test("(d) 후보 순서가 people[] 배열 순서와 같고 ordinal이 1..N이다", () => {
    const kNames = new Set(ctx.humans.map((h) => h.name));
    const expected = ctx.valuesJson.people.filter((p) => !kNames.has(p.name)).map((p) => p.name);
    assert.deepEqual(committed.candidates.map((c) => c.name), expected);
    assert.deepEqual(committed.candidates.map((c) => c.ordinal), committed.candidates.map((_, i) => i + 1));
  });

test("(e) inputSha256이 values-cast 최종 파일 해시와 같다", () => {
    assert.equal(committed.inputSha256, sha256Hex(ctx.valuesBytes));
  });

  // 파괴 검사(RED-provable): 규칙이 살아 있으면 변이를 잡아내고, 규칙이 없으면 이 테스트가 실패한다.

  test("변이 1 — 후보 두 행의 순서를 바꾸면 위반과 바이트 차이가 잡힌다", () => {
    const mutated = structuredClone(committed);
    const [a, b] = [mutated.candidates[10], mutated.candidates[11]];
    mutated.candidates[10] = b;
    mutated.candidates[11] = a;
    assert.notEqual(validateTable(mutated, ctx).length, 0);
    assert.notEqual(serializeTable(mutated), committedBytes);
  });

  test("변이 2 — ordinal을 중복시키면 위반이 잡힌다", () => {
    const mutated = structuredClone(committed);
    mutated.candidates[7].ordinal = mutated.candidates[8].ordinal;
    assert.notEqual(validateTable(mutated, ctx).length, 0);
  });

  test("변이 3 — 기존 K 인물을 후보에 끼워 넣으면 위반이 잡힌다", () => {
    const mutated = structuredClone(committed);
    mutated.candidates[3].name = ctx.humans[0].name;
    assert.notEqual(validateTable(mutated, ctx).length, 0);
  });

  test("변이 4 — inputSha256을 위조하면 위반이 잡힌다", () => {
    const mutated = structuredClone(committed);
    mutated.inputSha256 = "0".repeat(64);
    assert.notEqual(validateTable(mutated, ctx).length, 0);
  });
}

// ---- CLI: --write ----

if (CLI_WRITE) {
  const head = execFileSync("git", ["-C", REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const fresh = serializeTable(buildTable(loadContext(), head));
  if (existsSync(TABLE_PATH)) {
    const current = readFileSync(TABLE_PATH, "utf8");
    if (current === fresh) {
      console.log("person-id-candidates.json이 이미 최신이다");
    } else if (process.argv.includes("--force")) {
      writeFileSync(TABLE_PATH, fresh);
      console.log(`person-id-candidates.json을 강제 갱신했다 (sha256 ${sha256Hex(Buffer.from(fresh, "utf8"))})`);
    } else {
      console.error("출력이 이미 있는 파일과 다르다. 확인 후 --force로 갱신한다.");
      process.exitCode = 1;
    }
  } else {
    writeFileSync(TABLE_PATH, fresh);
    console.log(`person-id-candidates.json을 생성했다 (sha256 ${sha256Hex(Buffer.from(fresh, "utf8"))})`);
  }
}
