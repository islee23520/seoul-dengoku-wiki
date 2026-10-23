#!/usr/bin/env node
/**
 * bench-korean-retrieval.mjs — 한국어 검색 재현율(recall@k) 벤치 (G1 게이트).
 *
 * 읽기 전용. data/canonical/wiki-cast.sqlite 를 node:sqlite readonly 로만 연다.
 * 의존성 추가 없음 (Node 22+ 내장 node:sqlite).
 *
 * 비교:
 *   baseline  — 정규화 문자열의 LIKE/부분문자열
 *   bigram    — NFKC + 조사 분리 + 한글 음절 bigram 토큰 교집합
 *
 * 통과 기준 (--help 참고):
 *   1. 한국어 질의 클래스(inflected, honorific, alias, plain)에서
 *      bigram recall@k 가 baseline 이상이고, 조사/별칭 클래스에서는 개선된다.
 *   2. 금지 사출(retired/withdrawn 문서가 top-k 에 등장)이 0 이다.
 *
 * --dry-run 은 내장 픽스처만 쓰고 시각을 찍지 않는다. 기대 문서 id 의
 * PASS/FAIL 은 수동 기준선이며, 게이트 판정은 recall 비교와 금지 사출만 본다.
 */

import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

const DEFAULT_DB = "data/canonical/wiki-cast.sqlite";
const DEFAULT_K = 5;

const HELP = `bench-korean-retrieval.mjs — 한국어 인명 검색 recall@k 벤치 (G1)

사용:
  node scripts/bench-korean-retrieval.mjs --dry-run
  node scripts/bench-korean-retrieval.mjs --db <sqlite> [--fixture <json>] [--k <n>]

옵션:
  --dry-run          내장 픽스처만 평가. 출력에 시각 없음. 성공 시 exit 0.
  --db <path>        읽기 전용으로 열 sqlite. 기본 ${DEFAULT_DB}
  --fixture <json>   질의 픽스처. 생략 시 내장 픽스처.
  --k <n>            recall@k 의 k. 기본 ${DEFAULT_K}
  --help             이 도움말

픽스처 형식:
  { "k": 5, "queries": [
      { "id", "class", "query", "relevant": ["K001"], "forbidden": false }
  ]}
  class: inflected | honorific | alias | plain | english | stable-id | forbidden
  relevant 가 비어 있으면 그 질의는 recall 분모에서 빠지고 manual 로 남긴다.
  forbidden: true 인 질의는 relevant 문서가 top-k 에 나오면 금지 사출이다.

통과 기준 (G1):
  1. 한국어 recall@k 개선
     inflected, honorific, alias, plain 각 클래스에서
     bigram recall@k >= baseline recall@k 이고,
     inflected 와 alias 중 기대 문서가 있는 클래스는 bigram 이 baseline 보다 크다.
  2. 금지 사출 0
     retired/withdrawn 로 표시된 문서가 어떤 방법의 top-k 에도 나오지 않는다.
     스키마에 해당 상태 열이 없으면 이 검사는 not-applicable 과 이유를 남긴다.
`;

/** 내장 픽스처. relevant 는 수동 기준선(실재 person_id). */
const EMBEDDED_FIXTURE = {
  k: DEFAULT_K,
  queries: [
    {
      id: "inflected-jaemok-eun",
      class: "inflected",
      query: "한재목은",
      relevant: ["K001"],
      note: "주격 조사",
    },
    {
      id: "inflected-seodam-i",
      class: "inflected",
      query: "이서담이",
      relevant: ["K002"],
      note: "주격 조사 (이)",
    },
    {
      id: "inflected-taeun-eul",
      class: "inflected",
      query: "김태운을",
      relevant: ["K003"],
      note: "목적격 조사",
    },
    {
      id: "honorific-gunju",
      class: "honorific",
      query: "한재목 군주님",
      relevant: ["K001"],
      note: "작위/직함 + 님",
    },
    {
      id: "honorific-daejang",
      class: "honorific",
      query: "김태운 대장",
      relevant: ["K003"],
      note: "직함 일부 (수문경비대장)",
    },
    {
      id: "alias-iyen",
      class: "alias",
      query: "iyen",
      relevant: ["K1004"],
      note: "person_alias.alias — 완전 일치는 양쪽 모두 맞는다.",
    },
    {
      id: "alias-jaepyo-fragment",
      class: "alias",
      query: "jaepyo jo",
      relevant: ["K1003"],
      note: "별칭을 공백으로 나눈 형태. baseline LIKE 는 실패하고 bigram 은 맞는다.",
    },
    {
      id: "plain-nuri",
      class: "plain",
      query: "박누리",
      relevant: ["K004"],
    },
    {
      id: "plain-hangyeol",
      class: "plain",
      query: "최한결",
      relevant: ["K005"],
    },
    {
      id: "english-han",
      class: "english",
      query: "Han Jaemok",
      relevant: ["K001"],
      note: "index_person.name_en",
    },
    {
      id: "english-token",
      class: "english",
      query: "Seodam",
      relevant: ["K002"],
    },
    {
      id: "stable-k001",
      class: "stable-id",
      query: "K001",
      relevant: ["K001"],
    },
    {
      id: "stable-k004",
      class: "stable-id",
      query: "K004",
      relevant: ["K004"],
    },
    {
      id: "forbidden-retired-name",
      class: "forbidden",
      query: "명우재는",
      relevant: ["K015"],
      forbidden: true,
      note: "person_disposition.status = retired-current. top-k 사출 금지.",
    },
  ],
};

const PARTICLES = [
  "으로서", "에게서", "한테서", "이라고", "이라고", "에서는", "으로는",
  "에게", "한테", "께서", "처럼", "보다", "부터", "까지", "마다", "조차", "밖에",
  "은", "는", "이", "가", "을", "를", "의", "와", "과", "도", "로", "에",
  "님",
];

function parseArgs(argv) {
  const args = {
    dryRun: false,
    help: false,
    db: DEFAULT_DB,
    fixture: null,
    k: DEFAULT_K,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--dry-run") args.dryRun = true;
    else if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--db") args.db = argv[++i];
    else if (token === "--fixture") args.fixture = argv[++i];
    else if (token === "--k") args.k = Number(argv[++i]);
    else throw new Error(`알 수 없는 인자: ${token}`);
  }
  if (!Number.isInteger(args.k) || args.k < 1) {
    throw new Error("--k 는 1 이상의 정수여야 합니다.");
  }
  if (args.db == null) throw new Error("--db 경로가 필요합니다.");
  return args;
}

function nfkc(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase();
}

/** 한글 음절을 초성/중성/종성으로 풀어 bigram 이 조사 차이를 흡수하게 한다. */
function decomposeHangul(text) {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const syllable = code - 0xac00;
      const choseong = Math.floor(syllable / 588);
      const jungseong = Math.floor((syllable % 588) / 28);
      const jongseong = syllable % 28;
      out += String.fromCodePoint(0x1100 + choseong);
      out += String.fromCodePoint(0x1161 + jungseong);
      if (jongseong > 0) out += String.fromCodePoint(0x11a7 + jongseong);
    } else {
      out += ch;
    }
  }
  return out;
}

function stripParticle(token) {
  for (const particle of PARTICLES) {
    if (token.length > particle.length + 1 && token.endsWith(particle)) {
      return token.slice(0, -particle.length);
    }
  }
  return token;
}

/**
 * NFKC 후 공백/기호로 나누고, 한국어 토큰은 조사를 뗀 뒤
 * 자모 bigram 과 원형 토큰을 함께 낸다.
 */
function tokenize(raw) {
  const normalized = nfkc(raw).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  if (!normalized) return [];
  const tokens = new Set();
  for (const word of normalized.split(/\s+/u)) {
    if (!word) continue;
    const stem = stripParticle(word);
    tokens.add(stem);
    const jamo = decomposeHangul(stem);
    if ([...jamo].length < 2) {
      tokens.add(jamo);
      continue;
    }
    const chars = [...jamo];
    for (let i = 0; i < chars.length - 1; i += 1) {
      tokens.add(chars[i] + chars[i + 1]);
    }
  }
  return [...tokens];
}

function recallAtK(rankedIds, relevant, k) {
  if (!relevant.length) return null;
  const top = new Set(rankedIds.slice(0, k));
  let hit = 0;
  for (const id of relevant) if (top.has(id)) hit += 1;
  return hit / relevant.length;
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round4(value) {
  if (value == null) return null;
  return Math.round(value * 10000) / 10000;
}

/**
 * 실제 스키마에 맞춰 검색 문서를 만든다.
 * person 이 문서 단위(person_id). 본문은 이름, 직함, 영문명, 별칭, 안정 id.
 * 금지 집합은 person_disposition.status 가 retired/withdrawn 을 포함할 때.
 */
function loadCorpus(db) {
  const tables = new Set(
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name),
  );
  if (!tables.has("person")) {
    throw new Error("person 테이블이 없습니다. 이 벤치는 wiki-cast 인명 코퍼스용입니다.");
  }

  const people = db.prepare(
    "SELECT person_id, name, title FROM person ORDER BY person_id",
  ).all();

  const englishById = new Map();
  if (tables.has("index_person")) {
    const cols = new Set(
      db.prepare("PRAGMA table_info(index_person)").all().map((col) => col.name),
    );
    if (cols.has("person_id") && cols.has("name_en")) {
      for (const row of db.prepare(
        "SELECT person_id, name_en FROM index_person WHERE person_id IS NOT NULL",
      ).all()) {
        if (row.name_en) englishById.set(row.person_id, row.name_en);
      }
    }
  }

  const aliasesById = new Map();
  if (tables.has("person_alias")) {
    for (const row of db.prepare("SELECT person_id, alias FROM person_alias").all()) {
      const list = aliasesById.get(row.person_id) ?? [];
      list.push(row.alias);
      aliasesById.set(row.person_id, list);
    }
  }

  const leak = inspectForbidden(db, tables);
  const documents = people.map((person) => {
    const fields = [
      person.person_id,
      person.name,
      person.title ?? "",
      englishById.get(person.person_id) ?? "",
      ...(aliasesById.get(person.person_id) ?? []),
    ];
    const surface = fields.filter(Boolean).join(" ");
    return {
      id: person.person_id,
      surface,
      normalized: nfkc(surface),
      tokens: new Set(tokenize(surface)),
      forbidden: leak.forbiddenIds.has(person.person_id),
    };
  });

  return { documents, leak };
}

function inspectForbidden(db, tables) {
  if (!tables.has("person_disposition")) {
    return {
      applicable: false,
      reason: "person_disposition 테이블이 없어 retired/withdrawn 상태를 판별할 수 없습니다.",
      column: null,
      forbiddenIds: new Set(),
    };
  }
  const cols = db.prepare("PRAGMA table_info(person_disposition)").all();
  const names = new Set(cols.map((col) => col.name));
  if (!names.has("person_id") || !names.has("status")) {
    return {
      applicable: false,
      reason: "person_disposition 에 person_id/status 열이 없습니다.",
      column: null,
      forbiddenIds: new Set(),
    };
  }
  const rows = db.prepare("SELECT person_id, status FROM person_disposition").all();
  const forbiddenIds = new Set();
  for (const row of rows) {
    const status = nfkc(row.status);
    if (status.includes("retired") || status.includes("withdrawn")) {
      forbiddenIds.add(row.person_id);
    }
  }
  return {
    applicable: true,
    reason: null,
    column: "person_disposition.status",
    predicate: "status 가 retired 또는 withdrawn 을 포함",
    forbiddenIds,
  };
}

function visibleDocuments(documents) {
  return documents.filter((doc) => !doc.forbidden);
}

function searchBaseline(documents, query, k) {
  const needle = nfkc(query).trim();
  if (!needle) return [];
  const scored = [];
  for (const doc of visibleDocuments(documents)) {
    if (!doc.normalized.includes(needle)) continue;
    const index = doc.normalized.indexOf(needle);
    scored.push({ id: doc.id, score: 1000 - index, forbidden: false });
  }
  scored.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return scored.slice(0, k);
}

function searchBigram(documents, query, k) {
  const needles = tokenize(query);
  if (!needles.length) return [];
  const scored = [];
  for (const doc of visibleDocuments(documents)) {
    let overlap = 0;
    for (const token of needles) if (doc.tokens.has(token)) overlap += 1;
    if (overlap === 0) continue;
    const coverage = overlap / needles.length;
    const density = overlap / Math.max(doc.tokens.size, 1);
    scored.push({
      id: doc.id,
      score: coverage * 1000 + density,
      forbidden: false,
    });
  }
  scored.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return scored.slice(0, k);
}

function evaluate(corpus, fixture, k) {
  const classes = new Map();
  const perQuery = [];
  let forbiddenHits = [];

  for (const query of fixture.queries) {
    const baseline = searchBaseline(corpus.documents, query.query, k);
    const bigram = searchBigram(corpus.documents, query.query, k);
    const relevant = query.relevant ?? [];
    const baselineRecall = recallAtK(baseline.map((hit) => hit.id), relevant, k);
    const bigramRecall = recallAtK(bigram.map((hit) => hit.id), relevant, k);
    const row = {
      id: query.id,
      class: query.class,
      query: query.query,
      relevant,
      manual: relevant.length ? "scored" : "unscored-manual-baseline",
      forbidden: Boolean(query.forbidden),
      baseline: {
        recall_at_k: round4(baselineRecall),
        top: baseline.map((hit) => hit.id),
      },
      bigram: {
        recall_at_k: round4(bigramRecall),
        top: bigram.map((hit) => hit.id),
      },
    };
    perQuery.push(row);

    if (relevant.length && !query.forbidden) {
      const bucket = classes.get(query.class) ?? { baseline: [], bigram: [] };
      bucket.baseline.push(baselineRecall);
      bucket.bigram.push(bigramRecall);
      classes.set(query.class, bucket);
    }

    for (const [via, method] of [["baseline", baseline], ["bigram", bigram]]) {
      for (const hit of method) {
        const leaked = hit.forbidden || (query.forbidden && relevant.includes(hit.id));
        if (leaked) {
          forbiddenHits.push({
            query_id: query.id,
            document_id: hit.id,
            via,
          });
        }
      }
    }
  }

  const byClass = {};
  const koreanClasses = ["inflected", "honorific", "alias", "plain"];
  let koreanImproved = true;
  let sawStrictGain = false;
  for (const [name, bucket] of [...classes.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1)) {
    const base = mean(bucket.baseline);
    const gram = mean(bucket.bigram);
    const delta = base == null || gram == null ? null : gram - base;
    byClass[name] = {
      n: bucket.baseline.length,
      baseline_recall_at_k: round4(base),
      bigram_recall_at_k: round4(gram),
      delta: round4(delta),
    };
    if (koreanClasses.includes(name)) {
      if (gram < base) koreanImproved = false;
      if (name === "inflected" || name === "alias") {
        if (gram > base) sawStrictGain = true;
      }
    }
  }

  if (![...classes.keys()].some((name) => name === "inflected" || name === "alias")) {
    sawStrictGain = false;
    koreanImproved = false;
  }

  const leak = corpus.leak.applicable
    ? {
        applicable: true,
        column: corpus.leak.column,
        predicate: corpus.leak.predicate,
        forbidden_documents: corpus.leak.forbiddenIds.size,
        leaks: forbiddenHits.length,
        leak_rows: forbiddenHits,
      }
    : {
        applicable: false,
        status: "not-applicable",
        reason: corpus.leak.reason,
        leaks: null,
      };

  const leakPass = corpus.leak.applicable ? forbiddenHits.length === 0 : true;
  const recallPass = koreanImproved && sawStrictGain;
  const pass = recallPass && leakPass;

  return {
    k,
    documents: corpus.documents.length,
    by_class: byClass,
    queries: perQuery,
    forbidden_leak: leak,
    gate: {
      korean_recall_improved: recallPass,
      forbidden_leaks_zero: corpus.leak.applicable ? forbiddenHits.length === 0 : "not-applicable",
      pass,
    },
  };
}

function loadFixture(args) {
  if (args.dryRun || !args.fixture) return structuredClone(EMBEDDED_FIXTURE);
  const parsed = JSON.parse(readFileSync(args.fixture, "utf8"));
  if (!Array.isArray(parsed.queries)) throw new Error("픽스처에 queries 배열이 없습니다.");
  return parsed;
}

function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }
  const fixture = loadFixture(args);
  const k = fixture.k && args.k === DEFAULT_K ? fixture.k : args.k;
  const db = new DatabaseSync(args.db, { readOnly: true });
  try {
    const corpus = loadCorpus(db);
    const report = evaluate(corpus, fixture, k);
    const payload = {
      tool: "bench-korean-retrieval",
      mode: args.dryRun ? "dry-run" : "measure",
      db: args.db,
      methods: ["baseline-like", "whitespace-bigram"],
      normalization: "NFKC + particle strip + hangul jamo bigram",
      ...report,
    };
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return payload.gate.pass ? 0 : 1;
  } finally {
    db.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`BENCH_KOREAN_RETRIEVAL_FAIL: ${error.message}\n`);
    process.exitCode = 1;
  }
}

export {
  EMBEDDED_FIXTURE,
  tokenize,
  decomposeHangul,
  stripParticle,
  recallAtK,
  loadCorpus,
  evaluate,
  main,
};
