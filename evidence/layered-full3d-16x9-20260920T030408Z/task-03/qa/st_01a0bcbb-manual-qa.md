# task 3 manual QA — 출처에 결속한 지하철 토폴로지 생성기

- Executor session: st_01a0bcbb (omo-senpi-qa-executor, implementation assigned by caller)
- Worktree: `/Volumes/gameWorkspace/worktrees/seoul-kenshi/layered-full3d-16x9-wave1-clean` (branch `feat/layered-full3d-16x9-wave1-clean`)
- Deliverables: `TOOL/tools/strategy-map/build-subway-topology.mjs`, `TOOL/tools/strategy-map/test-subway-topology.mjs`, dated evidence dir `evidence/layered-full3d-16x9-20260920T030408Z/task-03/`, ordinary commit
- Surfaces: terminal CLI only (node test runner, node build command, python/pyosmium cross-check). HTTP/browser/desktop surfaces do not exist for this change; CLI transcripts are the faithful channel.
- Every verdict below was re-verified against the artifact files in this directory, not taken from prior logs.

## Result summary (from canonical `topology.json` / `coverage.json`, sha256 in `build/determinism.txt`)

- PBF inputs parsed directly (dependency-free protobuf/PBF reader, no invented data): relations 19013, route relations 244 (subway 161 / train 75 / light_rail 8), consecutive `role=stop` members 5632 — identical to an independent pyosmium scan (`qa/pyosmium-crosscheck.json`).
- Crosswalk to `SeoulWorldGraph.json` (schema v1, 334 stations): 327 matched, 7 honestly uncovered and listed; 69 null floors preserved verbatim; 434 traversable edges, 2498 nontraversable connections, 1 rejected self-adjacency (삼양).
- Determinism: two build runs byte-identical (sha256 e2eedb40… / 1365f90a…).
- Tests: 12/12 pass (node:test), exit 0.

## surfaceEvidence

| scenario id | criterion | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| S1 | task3 files exist: generator + tests | fs/CLI | `ls TOOL/tools/strategy-map/{build,test}-subway-topology.mjs` | pass | A1, A2 |
| S2 | TDD RED first | CLI (node:test) | `node TOOL/tools/strategy-map/test-subway-topology.mjs` with builder absent | pass — exit 1, `ERR_MODULE_NOT_FOUND` | A3 |
| S3 | test suite green after implementation | CLI (node:test) | `node TOOL/tools/strategy-map/test-subway-topology.mjs` | pass — exit 0, tests 12 / pass 12 / fail 0 / skipped 0 | A4 |
| S4 | actual PBF parse, no invented data (counts + sha) | CLI build | `node TOOL/tools/strategy-map/build-subway-topology.mjs --out <ev>/build/run1` | pass — relationsTotal 19013, routeRelations 244, stopMembers 5632, routeKinds {subway 161, train 75, light_rail 8}; input sha256 `eec1fcac44d0b7b1…` at 51,794,961 bytes recorded in coverage.inputs | A5, A7, A8 |
| S5 | parser agreement with independent osmium library | python/pyosmium | `python3` osmium.SimpleHandler scan over the same PBF | pass — identical counts (19013 / 244 / 5632 / 161-75-8 / identifiable 244 / withoutRef 29) | A9 |
| S6 | line identity network/ref/colour/name on every line record | CLI build output | inspect `topology.json` `lines[]` | pass — each of 244 lines carries relationId + route + network/ref/colour/name (null when absent) + identifiable flag; `coverage.lines.withoutRef` = 29 (names carry identity where ref is absent) | A6, A7 |
| S7 | output topology.json + coverage.json in dated task03 evidence with input hashes and route/stop counts | fs | `coverage.inputs.{pbf,worldGraph,stationInteriors}.sha256`, `coverage.pbf.*` | pass — hashes + byte sizes recorded; counts present | A6, A10 |
| S8 | deterministic repeat | CLI build ×2 | two runs into `build/run1` and `build/run2`, then `shasum -a 256` + `diff -q` | pass — byte-identical outputs | A11 |
| S9 | ordinary commit, scope task3 only | git | `git commit` (see commit hash in final report) | pass | A12 |

## adversarialCases

| scenario id | criterion | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| AD1 | malformed fixtures | corrupt input (garbage / truncated header / truncated blob) | fail loudly with `pbf:` error, non-zero exit, no partial output | pass — synthetic cases assert throws (`test: malformed PBF inputs fail loudly`); CLI-level run exits 1 with `Error: pbf: truncated blob header` | A4, A13 |
| AD2 | fabricated / dong adjacency rejected | adjacency without route-relation evidence (same-district pair, platform-only chain, bus route, multipolygon) | no edge is produced from any non-route or non-stop evidence | pass — `test: same-district proximity…`, `test: platform members and non-route relations never create edges` | A4 |
| AD3 | same-name IDs distinct → self-adjacency rejected | identity collision (consecutive stops resolving to one graph id) | stops stay distinct `n<osmid>` entries; no self-loop edge; recorded as `rejected.self_adjacency` | pass — synthetic test + real data hit: 삼양 via r7533582 rejected (`topology.rejected`) | A4, A6 |
| AD4 | traversable edge requires line/ref/source | unidentifiable line (route relation with neither ref nor name) | connection recorded nontraversable `unknown_line`, no edge | pass — `test: route relation without ref or name…`; edge assertions bind `lines[]` + `sources[]` on every traversable edge | A4 |
| AD5 | unknown connections nontraversable | unknown/missing/unmatched stop node (outside extract, outside Seoul, unnamed) | no fabricated edge; connection kept with reason `missing_stop_node` / `unknown_station` / `unnamed_stop` / `distance_mismatch` | pass — synthetic tests; real data: 1057 missing + 1462 unknown + 4 unnamed all nontraversable | A4, A6, A7 |
| AD6 | crosswalk refuses far-away namesakes | coordinate forgery / false crosswalk | name match beyond 750 m guard → `distance_mismatch`, no binding | pass — `test: name match beyond the distance limit is refused…` (guard exercised; real-data occurrence count 0 at 750 m) | A4 |
| AD7 | null floor preserved under adversarial coercion | data loss (null → 0/omitted) | `floors.observed_levels === null` kept verbatim with null source | pass — synthetic test + real data: 69 of 334 null floors intact in `topology.json` | A4, A6, A7 |
| AD8 | determinism under nondeterministic-output attack | hidden timestamps / unstable ordering in outputs | byte-identical reruns; no timestamps in JSON | pass — S8 byte-identical; builder writes no time values (checked source) | A11 |
| AD9 | prompt-injection / HTTP / browser / desktop classes | not triggered | — | not_applicable — this change is an offline data pipeline with no network, browser, or desktop surface; the only inputs are local files under the repo | — |

## artifactRefs

| id | kind | description | path (relative to worktree root) |
|---|---|---|---|
| A1 | source | topology generator (PBF parser + crosswalk + assembly + CLI) | `TOOL/tools/strategy-map/build-subway-topology.mjs` |
| A2 | test | node:test suite (12 tests: same-name distinct, line/ref/source, null floors, fabricated adjacency, unknown connections, alias, distance guard, exact334 integration, malformed PBF, determinism) | `TOOL/tools/strategy-map/test-subway-topology.mjs` |
| A3 | log | TDD RED capture with builder absent (exit 1, ERR_MODULE_NOT_FOUND) | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/red/red-module-missing.txt` |
| A3b | log | first RED run as it happened (test-file syntax error at line 111, fixed immediately; kept for honesty) | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/red/red-test.txt` |
| A4 | log | green test run: tests 12 / pass 12 / fail 0, exit 0 | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/green/green-test.txt` |
| A5 | log | build run 1 stdout summary (counts incl. relationsTotal 19013, stopMembers 5632, edges 434) | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/build/run1-stdout.json` |
| A6 | data | canonical topology output (334 stations with floors incl. 69 null, 244 lines with network/ref/colour/name, 434 edges with lines+sources, 2498 nontraversable connections, rejected self-adjacency) | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/topology.json` |
| A7 | data | canonical coverage output (input sha256s, route/stop counts, crosswalk reasons, uncovered 7, graph-vs-topology edge discrepancies) | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/coverage.json` |
| A8 | data | build run 1 outputs (raw) | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/build/run1/` |
| A9 | data | independent pyosmium cross-check (identical counts to node parser) | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/qa/pyosmium-crosscheck.json` |
| A10 | data | build run 2 outputs (raw) | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/build/run2/` |
| A11 | log | determinism proof: sha256 of run1 vs run2 + byte-identical verdict | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/build/determinism.txt` |
| A12 | git | ordinary commit of task3 files + this evidence dir; hash reported in the executor final message (`git log -1 --format='%H %s'`) | git HEAD after execution |
| A13 | log | malformed PBF at CLI level (exit 1, `pbf: truncated blob header`) | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/build/malformed-cli.txt` |
| A14 | log | all command invocations with exit codes | `evidence/layered-full3d-16x9-20260920T030408Z/task-03/commands.txt` |

## Notes for the orchestrator

- `coverage.json` records three honest discrepancies between OSM evidence and the (pre-existing, verified) `SeoulWorldGraph.json`: 3 graph edges without consecutive-stop evidence (`가산디지털단지-광명사거리`, `공덕-마곡나루`, `봉화산-신내`) and 2 topology pairs absent from the graph (`경복궁(정부서울청사)-독립문`, `경복궁(정부서울청사)-안국`), plus 7 uncovered stations (exact-name crosswalk miss). Nothing was fabricated to paper over them; they are listed for downstream owners.
- Parser correctness was proven against two independent implementations agreeing on every count, and node coordinates were verified equal to pyosmium to 7 decimal places (야당 stop node 4045716616: 37.7121076 / 126.7613347 in both).
- Out of scope and untouched: task1/task2/task31 files, push, PR, merge.
