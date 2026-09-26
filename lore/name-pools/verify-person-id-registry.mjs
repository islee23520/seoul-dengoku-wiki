// person-id-registry.json 발급 계약 테스트 (node --test)
//
// 대상: issue-person-id-ids.mjs가 아니라 issue-person-ids.mjs — K423–K1010 발급 레지스트리.
// 계약의 모든 규칙은 issue-person-ids.mjs의 validateRegistry가 계산하고,
// 이 파일은 (a) 커밋된 레지스트리가 승인각 재생성과 바이트 단위로 같은지,
// (b) 개수·유일성·발급 순서·aliases 불변식을, (c) 변이가 규칙에 걸리는지(RED-provable) 검사한다.
// 승인각 해시가 어긋나는 환경에서는 로드 단계에서 즉시 실패한다 (fail closed).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  SCHEMA,
  APPROVED,
  FROZEN,
  sha256Hex,
  kId,
  assertApprovedHashes,
  loadApprovedContext,
  buildRegistry,
  serializeRegistry,
  validateRegistry,
} from "./issue-person-ids.mjs";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.join(HERE, "person-id-registry.json");

assert.ok(existsSync(REGISTRY_PATH), "person-id-registry.json이 있어야 한다 (먼저 --write로 생성한다)");

// 승인각 해시가 어긋나면 loadApprovedContext가 던진다 → 테스트 수집 자체가 실패한다 (fail closed).
const ctx = loadApprovedContext();
const committedBytes = readFileSync(REGISTRY_PATH, "utf8");
const committed = JSON.parse(committedBytes);

test("(a) 승인각 입력에서 재생성한 레지스트리가 커밋된 파일과 바이트 단위로 같다", () => {
  assert.equal(serializeRegistry(buildRegistry(ctx)), committedBytes);
});

test("(a) 두 번 연속 재생성도 바이트 단위로 같다 (멱등)", () => {
  const first = serializeRegistry(buildRegistry(ctx));
  const second = serializeRegistry(buildRegistry(ctx));
  assert.equal(first, second);
  assert.equal(sha256Hex(Buffer.from(first, "utf8")), sha256Hex(Buffer.from(committedBytes, "utf8")));
});

test("커밋된 레지스트리가 모든 불변식을 통과한다", () => {
  assert.deepEqual(validateRegistry(committed, ctx), []);
});

test("(b) 개수 불변식 422 + 594 = 1016", () => {
  assert.equal(committed.existingKCount, 422);
  assert.equal(committed.issuedCount, 594);
  assert.equal(committed.totalPeople, 1016);
  assert.equal(committed.persons.length, 1016);
  assert.equal(committed.existingKCount + committed.issuedCount, committed.totalPeople);
  assert.equal(committed.persons.length - 422, 594);
});

test("(c) id가 K001..K1016 연속·오름차순이고 전부 유일하다", () => {
  const ids = committed.persons.map((p) => p.id);
  assert.equal(new Set(ids).size, 1016);
  ids.forEach((id, i) => assert.equal(id, kId(i + 1)));
  assert.equal(ids[0], "K001");
  assert.equal(ids[421], "K422");
  assert.equal(ids[422], "K423");
  assert.equal(ids[1009], "K1010");
  assert.equal(ids[1015], "K1016");
});

test("(d) K001–K422은 후보 파일 existingK 스냅숏 그대로다 (재배치 0)", () => {
  const snapshot = ctx.candidatesJson.existingK;
  assert.equal(snapshot.length, 422);
  committed.persons.slice(0, 422).forEach((p, i) => {
    assert.equal(p.id, snapshot[i].id);
    assert.equal(p.name, snapshot[i].name);
  });
});

test("(e) K423+ 발급 순서가 후보 ordinal 순서와 같다 (1→K423 … 594→K1016)", () => {
  const candidates = ctx.candidatesJson.candidates;
  assert.equal(candidates.length, 594);
  candidates.forEach((c, i) => {
    const p = committed.persons[422 + i];
    assert.equal(p.id, kId(423 + i), `ordinal ${c.ordinal}`);
    assert.equal(p.name, c.name, `ordinal ${c.ordinal}`);
    assert.equal(c.ordinal, i + 1);
  });
  assert.deepEqual(committed.persons[422], { id: "K423", name: "오경재" });
});

test("(f) 안정 비-K ID 보유 후보의 aliases에 기존 ID가 정확히 들어 있다", () => {
  assert.ok(ctx.aliasMap.size >= 1, "무소속 안정 ID 원장이 비어 있으면 안 된다");
  for (const [name, id] of ctx.aliasMap) {
    const hits = committed.persons.filter((p) => p.name === name);
    assert.equal(hits.length, 1, `${name}은(는) 정확히 한 행이어야 한다`);
    assert.deepEqual(hits[0].aliases, [id], `${name} aliases`);
  }
  // aliases는 안정 비-K ID 보유자에게만 존재한다.
  const withAliases = committed.persons.filter((p) => p.aliases);
  assert.equal(withAliases.length, ctx.aliasMap.size);
  // owner 승인 예시: 조재표 unaffiliated-jaepyo-jo, 이연 iyen
  const jaepyo = committed.persons.find((p) => p.name === "조재표");
  assert.deepEqual(jaepyo.aliases, ["unaffiliated-jaepyo-jo"]);
  const iyen = committed.persons.find((p) => p.name === "이연");
  assert.deepEqual(iyen.aliases, ["iyen"]);
});

test("(g) approvalRef가 최종 파일 owner 승인각을 그대로 새긴다", () => {
  assert.deepEqual(committed.approvalRef, APPROVED);
  assert.equal(committed.approvalRef.approvedBy, "owner");
  assert.equal(committed.approvalRef.approvedAt, "2026-09-26");
  assert.equal(committed.approvalRef.ownerRef, "2026-09-26 회랑 6명 수치·성별·K1011–K1016 및 최종 두 입력 해시 승인");
  assert.equal(committed.approvalRef.inputSha256, sha256Hex(ctx.valuesBytes));
  assert.equal(committed.approvalRef.candidatesSha256, sha256Hex(ctx.candidatesBytes));
  assert.equal(committed.schema, SCHEMA);
});

// fail closed: 승인각 해시 관문 — 입력이 하나라도 어긋나면 발급이 닫힌다.

test("fail closed — values-cast.json 해시가 승인각과 다르면 거부한다", () => {
  const tampered = Buffer.concat([ctx.valuesBytes, Buffer.from("\n", "utf8")]);
  const problems = assertApprovedHashes({ valuesBytes: tampered, candidatesBytes: ctx.candidatesBytes });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /values-cast\.json 해시\([0-9a-f]{64}\)가 승인각\([0-9a-f]{64}\)과 다르다/);
});

test("fail closed — 승인된 title 밖의 수정은 거부한다", () => {
  const values = JSON.parse(ctx.valuesBytes.toString("utf8"));
  values.people[0].state = "S99";
  const tampered = Buffer.from(JSON.stringify(values, null, 2) + "\n");
  assert.equal(assertApprovedHashes({ valuesBytes: tampered, candidatesBytes: ctx.candidatesBytes }).length, 1);
  values.people[0].state = "S01";
  values.people[0].title = "급수총재";
  const revertedTitle = Buffer.from(JSON.stringify(values, null, 2) + "\n");
  assert.equal(assertApprovedHashes({ valuesBytes: revertedTitle, candidatesBytes: ctx.candidatesBytes }).length, 1);
});

test("fail closed — person-id-candidates.json 해시가 승인각과 다르면 거부한다", () => {
  const tampered = Buffer.concat([ctx.candidatesBytes, Buffer.from(" ", "utf8")]);
  const problems = assertApprovedHashes({ valuesBytes: ctx.valuesBytes, candidatesBytes: tampered });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /person-id-candidates\.json 해시\(/);
});

test("fail closed — 승인각 검증 규칙이 없으면 위 변이 테스트 자체가 실패한다 (RED-provable)", () => {
  const tamperedCtx = { valuesBytes: Buffer.from("x"), candidatesBytes: Buffer.from("y") };
  assert.notEqual(assertApprovedHashes(tamperedCtx).length, 0);
  assert.notEqual(validateRegistry(committed, tamperedCtx).length, 0);
});

// 파괴 검사(mutations): 규칙이 살아 있으면 변이를 잡아내고, 규칙이 없으면 이 테스트가 실패한다.

test("변이 1 — 발급 두 행을 맞바꾸면 위반이 잡힌다", () => {
  const mutated = structuredClone(committed);
  const a = 422 + 10;
  const b = 422 + 200;
  const tmp = mutated.persons[a].name;
  mutated.persons[a].name = mutated.persons[b].name;
  mutated.persons[b].name = tmp;
  const violations = validateRegistry(mutated, ctx);
  assert.notEqual(violations.length, 0);
});

test("변이 2 — 기존 K422을 재사용하면 위반이 잡힌다", () => {
  const mutated = structuredClone(committed);
  mutated.persons[422].id = "K422";
  const violations = validateRegistry(mutated, ctx);
  assert.notEqual(violations.length, 0);
  assert.ok(violations.some((x) => x.includes("중복") || x.includes("K423이 아니다")));
});

test("변이 3 — 후보 한 명을 빼면 위반이 잡힌다", () => {
  const mutated = structuredClone(committed);
  mutated.persons.splice(422, 1);
  const violations = validateRegistry(mutated, ctx);
  assert.notEqual(violations.length, 0);
  assert.ok(violations.some((x) => x.includes("1010") || x.includes("누락")));
});

test("변이 4 — 조재표의 alias를 지우면 위반이 잡힌다", () => {
  const mutated = structuredClone(committed);
  delete mutated.persons.find((p) => p.name === "조재표").aliases;
  assert.notEqual(validateRegistry(mutated, ctx).length, 0);
});

test("변이 5 — approvalRef 해시를 위조하면 위반이 잡힌다", () => {
  const mutated = structuredClone(committed);
  mutated.approvalRef.candidatesSha256 = "0".repeat(64);
  const violations = validateRegistry(mutated, ctx);
  assert.notEqual(violations.length, 0);
  assert.ok(violations.some((x) => x.includes("approvalRef")));
});
