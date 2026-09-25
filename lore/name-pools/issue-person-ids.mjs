// person-id-registry.json 발급기·검증기 (owner 승인각 고정)
//
// 계약 (schema: wiki-person-id-registry.v1)
// - 이 발급은 2026-09-22 소유자 승인(세션 senpi:01a0c914)에 묶였고, 2026-09-25 소유자 Q1 답
//   「재생성 후 재승인」(decisions.json Q1)으로 state_name 재생성 뒤 입력 해시를 다시 승인했다.
//   입력 두 개의 SHA-256이 승인각과 하나라도 다르면 즉시 실패한다 (fail closed — 추측 발급 금지).
//     · lore/name-pools/values-cast.json 최종 파일 바이트 → APPROVED.inputSha256
//     · lore/name-pools/person-id-candidates.json → APPROVED.candidatesSha256
//   승인된 title 정정과 신규 3명은 최종 파일 해시에 포함한다.
// - K001–K422은 후보 파일의 existingK 스냅숏을 그대로 옮긴다 (재배치·이름 변경 금지).
// - K423–K1010은 후보 ordinal 순서 그대로 발급한다: ordinal 1 → K423 … ordinal 588 → K1010.
// - 무소속 카드에 안정 캐릭터 ID가 이미 있는 후보(조재표 unaffiliated-jaepyo-jo, 이연 iyen)도
//   K를 받고 기존 ID는 aliases가 된다 (owner 결정, 2026-09-22).
// - 재생성은 항상 바이트 단위로 같아야 한다 (멱등). --check는 커밋된 파일과의 바이트 비교다.
//
// 실행
// - 검사: node lore/name-pools/issue-person-ids.mjs --check   (인자 없으면 --check)
// - 생성: node lore/name-pools/issue-person-ids.mjs --write [--force]
//   (생성은 values-cast.json / person-id-candidates.json을 절대 고치지 않는다.)
//
// 파괴 검사(mutations)는 verify-person-id-registry.mjs가 담당한다 (RED-provable).

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const VALUES_PATH = path.join(REPO, "lore", "name-pools", "values-cast.json");
const CANDIDATES_PATH = path.join(REPO, "lore", "name-pools", "person-id-candidates.json");
const UNAFFILIATED_PATH = path.join(REPO, "lore", "characters", "Cast-Unaffiliated.md");
const REGISTRY_PATH = path.join(HERE, "person-id-registry.json");

export const SCHEMA = "wiki-person-id-registry.v1";
export const APPROVED = {
  approvedBy: "owner",
  approvedAt: "2026-09-25",
  ownerRef: "2026-09-25 민웅기·신종목·신준 텍스트·값 승인 (성인 지향 이성·결합 단혼)",
  inputSha256: "d2979fcecbe6c369d2d9a3730e5c2521e220ff7ee537ca962f8ab2a2389b893e",
  candidatesSha256: "6b72106b2cdcdd39c9cd0c2f23e8acd0108a3e2729583b2804b666392e774b6c",
};
export const FROZEN = { existingK: 422, issued: 588, total: 1010 };

export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function kId(n) {
  return `K${String(n).padStart(3, "0")}`;
}

// 승인각 해시 관문: 위반 목록을 돌려준다 (빈 배열 = 통과). 발급·검사 모두 이 문을 먼저 지난다.
export function assertApprovedHashes({ valuesBytes, candidatesBytes }) {
  const v = [];
  const vi = sha256Hex(valuesBytes);
  const ci = sha256Hex(candidatesBytes);
  if (vi !== APPROVED.inputSha256) {
    v.push(`values-cast.json 해시(${vi})가 승인각(${APPROVED.inputSha256})과 다르다`);
  }
  if (ci !== APPROVED.candidatesSha256) {
    v.push(`person-id-candidates.json 해시(${ci})가 승인각(${APPROVED.candidatesSha256})과 다르다`);
  }
  return v;
}

// 무소속 카드에서 안정 캐릭터 ID가 있는 인물만 name → characterId로 모은다.
export function loadStableNonKIds(text) {
  const map = new Map();
  for (const block of text.split(/^### /m).slice(1)) {
    const nameMatch = block.match(/^인물 (.+)$/m);
    const idMatch = block.match(/^- 캐릭터 ID: (\S+)/m);
    if (nameMatch && idMatch) map.set(nameMatch[1].trim(), idMatch[1]);
  }
  return map;
}

export function loadApprovedContext() {
  const valuesBytes = readFileSync(VALUES_PATH);
  const candidatesBytes = readFileSync(CANDIDATES_PATH);
  const problems = assertApprovedHashes({ valuesBytes, candidatesBytes });
  if (problems.length) throw new Error(problems.join("; "));
  return {
    valuesBytes,
    candidatesBytes,
    candidatesJson: JSON.parse(candidatesBytes.toString("utf8")),
    aliasMap: loadStableNonKIds(readFileSync(UNAFFILIATED_PATH, "utf8")),
  };
}

function personRow(id, name, aliasMap) {
  const alias = aliasMap.get(name);
  return alias ? { id, name, aliases: [alias] } : { id, name };
}

export function buildRegistry(ctx) {
  const existingK = ctx.candidatesJson.existingK;
  const candidates = ctx.candidatesJson.candidates;
  if (existingK.length !== FROZEN.existingK || candidates.length !== FROZEN.issued) {
    throw new Error(
      `동결 기준값 위반: existingK ${FROZEN.existingK}행 + 후보 ${FROZEN.issued}행이어야 한다 ` +
        `(실제 ${existingK.length}+${candidates.length})`,
    );
  }
  const persons = existingK.map((e) => personRow(e.id, e.name, ctx.aliasMap));
  candidates.forEach((c, i) => {
    persons.push(personRow(kId(FROZEN.existingK + i + 1), c.name, ctx.aliasMap));
  });
  return {
    schema: SCHEMA,
    approvalRef: { ...APPROVED },
    totalPeople: persons.length,
    existingKCount: FROZEN.existingK,
    issuedCount: FROZEN.issued,
    persons,
  };
}

export function serializeRegistry(registry) {
  return JSON.stringify(registry, null, 2) + "\n";
}

// 순수 검증: 위반 목록을 문자열 배열로 돌려준다 (빈 배열 = 통과).
export function validateRegistry(registry, ctx) {
  const v = [];
  v.push(...assertApprovedHashes(ctx));

  if (!registry || registry.schema !== SCHEMA) v.push(`schema가 ${SCHEMA}이 아니다`);
  const a = registry && registry.approvalRef ? registry.approvalRef : {};
  if (
    a.approvedBy !== APPROVED.approvedBy ||
    a.approvedAt !== APPROVED.approvedAt ||
    a.ownerRef !== APPROVED.ownerRef ||
    a.inputSha256 !== APPROVED.inputSha256 ||
    a.candidatesSha256 !== APPROVED.candidatesSha256
  ) {
    v.push(`approvalRef가 owner 승인각(${APPROVED.approvedBy}, ${APPROVED.approvedAt})과 다르다`);
  }

  const persons = registry ? registry.persons : null;
  if (!Array.isArray(persons)) {
    v.push("persons가 배열이 아니다");
    return v;
  }
  if (persons.length !== FROZEN.total) v.push(`persons 행 수(${persons.length})가 ${FROZEN.total}이 아니다`);
  if (registry.totalPeople !== persons.length) v.push(`totalPeople(${registry.totalPeople})이 persons 행 수와 다르다`);
  if (registry.existingKCount !== FROZEN.existingK) v.push(`existingKCount(${registry.existingKCount})이 ${FROZEN.existingK}이 아니다`);
  if (registry.issuedCount !== FROZEN.issued) v.push(`issuedCount(${registry.issuedCount})이 ${FROZEN.issued}이 아니다`);
  if (registry.totalPeople !== registry.existingKCount + registry.issuedCount) {
    v.push(`개수 불변식 위반: ${registry.existingKCount} + ${registry.issuedCount} ≠ ${registry.totalPeople}`);
  }

  // id는 전부 유일하고 K001..K1010 연속·오름차순이어야 한다 (기존 K 재사용 금지 포함).
  const ids = persons.map((p) => (p && p.id) || null);
  if (new Set(ids).size !== ids.length) v.push("id가 중복된다");
  ids.forEach((id, i) => {
    if (id !== kId(i + 1)) v.push(`persons ${i + 1}번째 id가 ${kId(i + 1)}이 아니다: ${id}`);
  });

  // K001–K422은 후보 파일 existingK 스냅숏 그대로 (재배치·이름 변경 금지).
  const snapshot = (ctx.candidatesJson && ctx.candidatesJson.existingK) || [];
  persons.slice(0, FROZEN.existingK).forEach((p, i) => {
    const e = snapshot[i];
    if (!e || !p || p.id !== e.id || p.name !== e.name) {
      v.push(`K001–K422 스냅숏 위반: ${i + 1}번째 행이 existingK와 다르다`);
    }
  });

  // K423–K1010은 후보 ordinal 순서 그대로 발급 (ordinal 1 → K423 … 588 → K1010).
  const candidates = (ctx.candidatesJson && ctx.candidatesJson.candidates) || [];
  const aliasMap = ctx.aliasMap || new Map();
  candidates.forEach((c, i) => {
    const p = persons[FROZEN.existingK + i];
    const want = kId(FROZEN.existingK + i + 1);
    if (!p) {
      v.push(`발급 행 누락: 후보 ${c.ordinal}번(${c.name}) → ${want}`);
      return;
    }
    if (p.id !== want) v.push(`후보 ${c.ordinal}번(${c.name})은(는) ${want}에 발급되어야 한다 (실제 ${p.id})`);
    if (p.name !== c.name) v.push(`${want} 이름(${p.name})이 후보 ${c.ordinal}번(${c.name})과 다르다`);
    const alias = aliasMap.get(c.name);
    const wantRow = alias ? { id: want, name: c.name, aliases: [alias] } : { id: want, name: c.name };
    if (JSON.stringify(p) !== JSON.stringify(wantRow)) {
      v.push(`${want} 행이 기대 행(id/name/aliases)과 다르다`);
    }
  });

  // 안정 비-K ID는 정확히 해당 인물의 aliases에 들어가야 한다 (누락·남용 금지).
  for (const [name, id] of aliasMap) {
    const hits = persons.filter((p) => p && p.name === name);
    if (hits.length === 1 && !(Array.isArray(hits[0].aliases) && hits[0].aliases.includes(id))) {
      v.push(`${name}의 aliases에 안정 캐릭터 ID(${id})가 없다`);
    }
  }
  for (const p of persons) {
    if (!p) continue;
    if (p.aliases !== undefined && (!Array.isArray(p.aliases) || p.aliases.length === 0)) {
      v.push(`${p.id}의 aliases가 빈 배열이다 (해당 없으면 키를 뺀다)`);
    }
    if (Array.isArray(p.aliases) && p.aliases.some((x) => /^K\d+$/.test(x))) {
      v.push(`${p.id}의 aliases에 K id가 섞여 있다`);
    }
  }

  try {
    if (serializeRegistry(JSON.parse(serializeRegistry(registry))) !== serializeRegistry(registry)) {
      v.push("직렬화가 결정적이지 않다 (재직렬화 결과가 다르다)");
    }
  } catch {
    v.push("레지스트리 직렬화에 실패한다");
  }
  return v;
}

// ---- CLI: --write [--force] 또는 --check(기본) ----

const invokedAsMain = Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsMain) {
  const args = process.argv.slice(2);
  const known = new Set(["--check", "--write", "--force"]);
  if (args.some((x) => !known.has(x))) {
    console.error("인수는 --check(기본) | --write [--force] 만 허용한다");
    process.exitCode = 2;
  } else {
    const WRITE = args.includes("--write");
    let ctx;
    try {
      ctx = loadApprovedContext();
    } catch (err) {
      console.error(`[fail closed] ${err.message}`);
      process.exitCode = 1;
    }
    if (ctx) {
      const fresh = serializeRegistry(buildRegistry(ctx));
      if (WRITE) {
        if (existsSync(REGISTRY_PATH) && readFileSync(REGISTRY_PATH, "utf8") === fresh) {
          console.log("person-id-registry.json이 이미 승인각 재생성과 바이트 단위로 같다");
        } else if (existsSync(REGISTRY_PATH) && !args.includes("--force")) {
          console.error("출력이 이미 있는 파일과 다르다. 확인 후 --force로 갱신한다.");
          process.exitCode = 1;
        } else {
          const existed = existsSync(REGISTRY_PATH);
          writeFileSync(REGISTRY_PATH, fresh);
          console.log(`person-id-registry.json을 ${existed ? "강제 갱신" : "생성"}했다 (sha256 ${sha256Hex(Buffer.from(fresh, "utf8"))})`);
        }
      } else if (!existsSync(REGISTRY_PATH)) {
        console.error("person-id-registry.json이 없다. 먼저 --write로 생성한다.");
        process.exitCode = 1;
      } else if (readFileSync(REGISTRY_PATH, "utf8") === fresh) {
        console.log(`person-id-registry.json이 승인각 재생성과 바이트 단위로 같다 (sha256 ${sha256Hex(Buffer.from(fresh, "utf8"))})`);
      } else {
        console.error("재생성 결과가 커밋된 person-id-registry.json과 다르다.");
        process.exitCode = 1;
      }
    }
  }
}
