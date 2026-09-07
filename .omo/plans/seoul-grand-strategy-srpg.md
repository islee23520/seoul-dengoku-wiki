# seoul-grand-strategy-srpg - Work Plan

> **방향 개정 예고 (2026-09-07, Intent.md 결정 3)**: 소유자가 목표 형태를 **4X + RPG, 전투는 실시간 진형·카드 전투**(기준 레퍼런스 Songs of Silence)로 재규정했다. 이 계획의 "4방향 SRPG 전투"·턴제 전술 서술은 현재 POC 모듈까지의 과도 상태로 읽고, 다음 모듈(실시간 진형·카드 전투 코어) 계획에서 전투 절을 개정한다. 카메라·격자·결정론·저장 계약은 그대로다. 상세: `docs/game-logic/Realtime-Formation-Card-Battle.md`, `docs/game-logic/Development-Roadmap.md` 목표 형태 절.

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** 아포칼립스 이후 서울의 지하철망을 중심으로 인물·파티·세력의 장기 변화를 만들고, 결정적 충돌을 4방향 SRPG 전투로 해결하는 Unity 6.7 게임 기반과 첫 통합 캠페인 슬라이스를 얻게 됩니다. 실행 저장소는 현재 로컬 `seoul-kenshi` 하나로 고정하고, GitHub 저장소·remote·push·Wiki 게시에 관한 외부 쓰기는 이 계획에서 수행하지 않습니다.

**Why this approach:** 게임 규칙을 Unity와 분리해 결정론·저장·전투 정산을 먼저 증명하고, 지하철 세계의 진실 데이터와 플레이어가 보는 노선도를 분리해 복잡도를 통제합니다. 고위험 표현·AI 자산·Unity 알파 선택은 실제 비교와 반증 게이트를 통과한 뒤에만 생산 경로로 승격합니다.

**What it will NOT do:** 참고 작품의 인물·서사·미술·UI를 복제하지 않습니다. Makcha 프로젝트 전체나 제품 전용 코드·아트를 그대로 가져오지 않습니다. 모든 서울 인프라를 실제와 같은 디지털 트윈으로 만들거나 모든 NPC를 상시 풀 시뮬레이션하지 않습니다.

**Effort:** XL
**Risk:** High - Unity 6.7 채널 안정성, 장기 시뮬레이션, 전략↔전투 상태 왕복, 하이브리드 캐릭터 표현과 AI 자산 권리가 각각 독립적인 실패 가능성을 가집니다.
**Decisions I made for you:** Windows x64 Steam형 PC를 1차 배포 대상으로, macOS를 개발·스모크 대상으로 둡니다. 저장소는 현재 로컬 `seoul-kenshi` 하나만 사용하고 GitHub remote는 미설정 상태로 유지합니다. 대외 가칭은 저장소명과 분리합니다. 한국어가 원문이고 영어 현지화를 준비합니다. 저장소 문서가 유일한 원본이며 Wiki는 우선 로컬 생성·검증 산출물입니다. Unity는 실행 시점의 최신 허용 가능한 6.7 채널을 사용하고 알파만 가능하면 명시적 ADR로 위험을 수용합니다.

**대외 가칭 · 한 줄 피치:** **《잔선: 서울》 — 붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4방향 대전략 SRPG.**

Your next move: Momus가 이 전체 계획을 무조건 승인하기 전에는 Unity 프로젝트 생성, GitHub rename/remote/push, Wiki 쓰기, Makcha commit/push를 포함한 어떤 구현도 시작하지 않습니다. 승인 후에만 별도 `/ulw-execute` 세션에서 실행합니다. Full execution detail follows below.

---

> TL;DR (machine): XL/high-risk — keep the current local repository as the only repository and GitHub untouched; build a Unity 6.7 fixed-isometric deterministic campaign/battle project; prove map and hybrid-character UX; establish audited TRELLIS/ComfyUI production; ship one integrated Seoul subway campaign slice; generate and verify Wiki material locally. No execution before unconditional Momus approval.

## Scope
### Must have

- Validate, atomically commit, and push the existing five Hunter02/Tripo changes in `/Users/ilseoblee/workspace/makcha-unity` before using any of their patterns.
- Use only the existing local zero-commit repository at `/Users/ilseoblee/workspace/seoul-kenshi`; keep its root in place and do not create another repository/worktree or configure a remote under this plan.
- Treat the unused empty private shooter repository as entirely out of scope: do not inspect it for reuse, rename it, delete it, overwrite it, clone it, transfer it, bind it, set it as a remote, or use it as the project body.
- GitHub currently has no repository for this project. Do not create one now. Any future GitHub creation/binding/push/Wiki publication requires a separate owner-authorized plan after this plan.
- Use **《잔선: 서울》 — “붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4방향 대전략 SRPG.”** as the external provisional title/pitch until a later originality/title gate approves a replacement.
- New child folders, screenshot/capture filenames, build products and commit subjects must not contain the two private comparison titles or the retired shooter-project label. The pre-existing root repository name is the sole exception and must not propagate into newly named artifacts. README product copy, local Wiki output, store copy, marketing and shipped UI follow the same rule.
- Use the newest available Unity 6.7 editor channel; pin exact editor revision and package lock. If only alpha is available, record and test the exception.
- Build engine-free `Seoul.Core`, `Seoul.WorldGraph`, `Seoul.Battle`, and `Seoul.Sim` assemblies plus thin Unity `Data`, `Presentation`, and `App` layers.
- Model post-apocalyptic Seoul as a subway-centered layered graph with `measured | derived | fictional` provenance.
- Support an active full-fidelity bubble and aggregate off-screen simulation with deterministic replay, budgets, invariants, and a causal event ledger.
- Implement four-direction movement, route/layer transitions, encounters, and immutable strategy↔SRPG round trips with idempotent settlement.
- Compare runtime pixel-head+mesh-body against unified 3D pixel-face and unified directional-sprite alternatives before selecting production rendering.
- Establish pinned ComfyUI/TRELLIS, Blender, and Unity import stages with a fail-closed asset bill of materials.
- Keep original Korean game-logic documents in `docs/game-logic/` and generate a drift-checked local Wiki tree; remote Wiki publication is outside this plan.
- Deliver one integrated slice containing one subway line, three station archetypes, two factions, named characters, one expedition, one decisive SRPG battle, save/load, and consequence feedback.

### Genre lock — one camera and combat loop

- **Camera + combat loop:** fixed orthographic isometric CRPG at world yaw 45° and pitch 35.264°; exploration, interaction and SRPG combat all use the same cardinal tile grid and camera without switching to a free-camera squad sandbox, seamless open-world traversal grammar, separate real-time combat mode, orbit, rotation or perspective.
- **Silhouette:** every playable character is a 2.5-head-tall SD silhouette authored only for that fixed isometric view, with an oversized identity-bearing pixel head, compact mesh body, clear shoulder/weapon envelope and exactly four cardinal facings; realistic open-world proportions and unrestricted 360° silhouette readability are out.
- **Tile scale:** one logical tile is 1.5 m = 1.5 Unity units, one normal character occupies one tile, standard walkable corridors are at least two tiles wide, and exploration movement, interaction distance, SRPG range, props, doors, cover and board archetypes all use that same grid.

### External identity and reviewer locks

- External provisional title: **《잔선: 서울》**.
- External one-line pitch: **“붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4방향 대전략 SRPG.”**
- Store, README product copy, local Wiki titles, new child folders, screenshot/capture filenames, build names, branch/channel labels, commit subjects and marketing must not contain `Kenshi`, `Underrail`, or `Gunner`. The pre-existing repository root `seoul-kenshi` is the sole internal exception and must not propagate into new artifact names. Reference names remain only in private research documents excluded from generated/public material.
- **Art lock:** an art-direction reviewer must approve the exact camera, silhouette and tile-scale lines before any Unity visual prototype; later art experiments may compare rendering media but may not change this genre grammar without owner approval and a plan amendment.
- **Marketing lock:** a marketing reviewer must approve the external provisional title, one-line pitch, repository description, screenshot filenames and store-facing vocabulary; internal codenames/reference titles are automatic blockers.
- **Critic lock:** an adversarial reviewer must reject any design that adds a free-camera squad sandbox, seamless open-world traversal grammar, second combat mode, second tile scale or second silhouette standard to the fixed-isometric CRPG loop.
- **Momus lock:** unconditional Momus approval of this plan is a hard predecessor to every execution todo. Before that receipt exists, do not create a Unity project, rename or write GitHub repositories, configure remotes, commit/push Makcha, publish a Wiki, generate production assets, or spawn implementation agents.

### Must NOT have (guardrails, anti-slop, scope boundaries)

- Do not copy 日本三國 characters/polities/plot, Kenshi/TOS visual identity, Taiko historical content, or any reference title/trade dress into production names, prompts, art, UI, marketing, or Wiki.
- Do not copy the full Makcha project, `Makcha.*` assemblies, Hunter02 art, generated assets, WIP handoffs, GUID-bound scenes/settings, caches, secrets, builds, or product balance.
- Do not put UnityEngine references or static mutable state in Core/WorldGraph/Battle/Sim.
- Do not add Entities, Addressables, glTFast, VContainer, Cinemachine, LitMotion, or other packages before a named caller and acceptance test justify each dependency.
- Do not claim exact real station interiors, depots, tunnels, hazards, or dataset licenses without a verified official source. Use authored archetypes and mark provenance.
- Do not ship any AI-assisted asset whose BOM has a `blocked` or `unresolved` field.
- Do not let the Wiki become an editable source of truth or expose private reference/IP dossiers.
- Do not create any GitHub repository or remote under this plan.
- Do not inspect, rename, delete, overwrite, bind, transfer, unarchive, clone from or push to the unused private shooter repository.
- Do not create another codename. The pre-existing local repository name is an internal root exception; product-facing identity uses the external provisional title.
- Do not use the two private comparison titles or the retired shooter-project label in new child folders, screenshots/captures, commit subjects, branch/channel labels, builds, local Wiki output, store copy, marketing or shipped UI.
- Do not introduce a free-camera, perspective, third-person, top-down open-world, or second tile-scale mode. The fixed orthographic isometric grammar is singular.
- Do not begin any implementation or external write before the Momus approval receipt is recorded against the exact plan hash.
- Do not use destructive Git history/worktree commands; preserve unrelated user changes.
- Do not invent a calendar estimate before measured execution throughput exists.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for every gameplay, persistence, tooling, and publishing behavior. Unity Test Framework/NUnit for EditMode and PlayMode; pure C# deterministic harness tests for Core/WorldGraph/Battle/Sim; `pytest` for Python asset tools; Node tests for docs/Wiki scripts. Visual-only choices use preregistered capture comparisons rather than prose-pinning tests.
- RED evidence: every behavior todo first captures the named failing test/scenario before production work. Existing-correct Makcha changes use mutation proof if no natural RED remains.
- Surface evidence: `-batchmode` Unity Play Mode가 생성한 PNG/JSON receipt, built player smoke, local repository/remote-absence checks, local Wiki-tree hash comparison, and actual ComfyUI/Blender/Unity artifact lineage. Interactive Editor와 uLoop는 사용하지 않습니다.
- Evidence: `<attemptDir>/task-<N>-seoul-grand-strategy-srpg.*` where `attemptDir` is the current attempt from `omo-agent-toolkit ulw-loop status --json`; outside ulw-loop use `.omo/evidence/`.
- Full gates: exact Unity compile, EditMode, PlayMode, Windows build, macOS smoke build, Python/Node tests, repository/Wiki round trip, and manual use of the integrated campaign slice.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.

- **Pre-wave gate — review only:** Momus reviews the exact plan hash; art, marketing and critic locks are confirmed as binding. No implementation or external write occurs before unconditional approval.
- **Wave 0 — Preserve and lock foundations:** Todo 1 preserves the sibling repository; Todo 2 proves that the existing local repository remains the only repository and GitHub state stays untouched. Todos 3–4 establish local docs authority and the exact Unity baseline only after Momus approval.
- **Wave 1 — Engine-free contracts:** Todos 5–10. IDs/events, world graph, import/provenance, simulation budgets, actors/factions, and economy can split by assembly after Todos 2–4.
- **Wave 2 — Player loop and battle:** Todos 11–17. Presentation-map prototypes and hybrid rendering can run parallel; travel, battle contracts, board generation, tactics, and settlement follow their contract dependencies.
- **Wave 3 — Asset production and operations:** Todos 18–22. Persistence, BOM tooling, ComfyUI/TRELLIS environment, Blender/Unity promotion, originality, and Wiki publication use disjoint file scopes where noted.
- **Wave 4 — Integration:** Todos 23–25. Integrate one-line/three-station/two-faction content, run full platform/build/manual QA, and generate stable local Wiki pages only after all gates pass.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | — | 2, 20 | — |
| 2 | 1 | 3–25 | — |
| 3 | 2 | 4, 22, 25 | 4 |
| 4 | 2 | 5–17, 22–25 | 3 |
| 5 | 4 | 6–18, 23 | — |
| 6 | 5 | 7, 9, 11, 13, 16, 23 | 8 |
| 7 | 5, 6 | 11, 12, 23 | 8, 9, 10 |
| 8 | 5 | 9, 10, 11, 17, 23 | 7 |
| 9 | 5, 8 | 10, 11, 17, 23 | 7 |
| 10 | 5, 8, 9 | 11, 12, 17, 23 | 7 |
| 11 | 6–10 | 12, 23 | 18, 19 |
| 12 | 7, 9–11 | 23 | 18, 19 |
| 13 | 5–8 | 14–17, 23 | 11, 18, 19 |
| 14 | 6, 13 | 15, 16, 17, 23 | 11, 18, 19 |
| 15 | 7, 13, 14 | 16, 23 | 18, 19 |
| 16 | 5, 13–15 | 17, 23 | 18, 19 |
| 17 | 8–10, 13–16 | 18, 23 | 19, 20 |
| 18 | 5, 17 | 23, 25 | 19–22 |
| 19 | 3, 4 | 23 | 18, 20–22 |
| 20 | 1–4 | 21, 23 | 18, 19, 22 |
| 21 | 19, 20 | 23 | 18, 22 |
| 22 | 2, 3 | 25 | 18–21 |
| 23 | 6–21 | 24, 25 | — |
| 24 | 23 | 25 | — |
| 25 | 18, 22–24 | Final verification | — |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Preserve the current Makcha Hunter02/Tripo work
  What to do / Must NOT do: In `/Users/ilseoblee/workspace/makcha-unity`, re-read the two modified and three untracked files, extend/fix the existing Python tests only where necessary, capture RED by mutating or exposing the exact orientation/preparation regression, restore and capture GREEN, run all directly related tests, inspect the complete diff, then atomically commit and push `main`. Preserve every unrelated user change; do not reset, stash without need, or include unrelated files.
  Recommended task executor category: `unspecified-high` — shared dirty repository, test evidence, commit and push require careful source-control judgment.
  Parallelization: Wave 0, exclusive sibling-repo mutation | Blocked by: none | Blocks: 2, 20
  References: `/Users/ilseoblee/workspace/makcha-unity/docs/art/hunter02-compact-tripo-pipeline.md`; `/Users/ilseoblee/workspace/makcha-unity/tools/Hunter02/prepare_tripo_candidate.py`; `/Users/ilseoblee/workspace/makcha-unity/tools/Hunter02/tripo_arp_orientation.py`; matching two tests; `.omo/ulw-research/20260902-204022/wave-1-repo-wiki.md`; `wave-3-architecture-defense.md`.
  Acceptance criteria: `python3 -m unittest tools.Hunter02.test_prepare_tripo_candidate_contract tools.Hunter02.test_tripo_arp_orientation` (or the repository's exact discovered runner) exits 0; `git diff --check` clean; committed file set equals the five reviewed paths; `git status --short --branch` is clean/ahead 0 after push; `git rev-parse HEAD` equals `git rev-parse origin/main`.
  QA scenarios: happy — run the real candidate-preparation CLI on its smallest existing fixture and assert orientation/contract report values; failure — malformed/missing orientation metadata returns non-zero with a stable error and does not promote output. Evidence `<attemptDir>/task-1-seoul-grand-strategy-srpg.txt`.
  Commit: Y in `makcha-unity` | `fix(art): harden Tripo ARP orientation contract`

- [ ] 2. Lock the existing local repository and forbid GitHub operations
  What to do / Must NOT do: Only after the Momus receipt exists, verify that `/Users/ilseoblee/workspace/seoul-kenshi` is the current zero-commit repository and keep it in place as the sole repository/worktree. Write `docs/adr/ADR-001-repository-scope.md` with the exact local root, `github_remote: none`, the root-name exception, external-title separation and an explicit statement that the unused empty private shooter repository is not the project body. Do not perform any GitHub query or mutation, configure a remote, rename/move the root, add a worktree, create a repository, clone, delete, overwrite or push. Add a machine-readable policy rejecting `Kenshi`, `Underrail`, and `Gunner` in every new child folder, branch/channel, commit subject, screenshot/capture filename, build name and evidence basename.
  Recommended task executor category: `git` — local repository identity and fail-closed naming/remote guards with no network or external mutation.
  Parallelization: Wave 0 | Blocked by: 1 | Blocks: 3–25
  References: `.omo/ulw-research/20260902-204022/SYNTHESIS.md`; `wave-1-repo-wiki.md`; `wave-2-skeptic.md` C-SK-08; `/Users/ilseoblee/workspace/makcha-unity/.gitignore`; `.gitattributes` as patterns only.
  Acceptance criteria: `pwd` and `git rev-parse --show-toplevel` resolve to the existing root; `git rev-list --count --all` is 0 before the project's first local commit; `git remote -v` is empty before and after; no sibling worktree/repository is created; ADR contains only local scope and exclusions; naming-policy tests reject all forbidden tokens in new artifact categories while narrowly allowing the existing root exception.
  QA scenarios: happy — run local Git/worktree/naming-policy checks without a network command and verify no remote exists; failure — fixtures containing a forbidden token in a child folder, branch/channel, commit subject, screenshot, build or evidence filename fail while the root exception remains narrowly allowed. Evidence `<attemptDir>/task-2-repository-scope.txt`; no external cleanup is required.
  Commit: Y, local only | `docs(repo): lock local repository scope`

- [ ] 3. Establish repository-canonical docs and generated Wiki contract
  What to do / Must NOT do: Create `docs/game-logic/`, `docs/adr/`, `docs/research-private/`, `docs/wiki-map.yaml`, and Node scripts/tests for selecting pages, prepending source path+commit SHA banners, generating `_Sidebar.md`, normalizing Markdown, and comparing the generated tree with `<repo>.wiki.git`. Encode the genre lock, external title/pitch, banned-token list, and art/marketing/critic approval receipts as machine-readable frontmatter/config. Private research/reference matrices and every internal codename/reference title must be excluded. Direct Wiki edits are drift, never authoritative.
  Recommended task executor category: `unspecified-high` — canonical docs, local Wiki generation and drift behavior span scripts and workflow definitions.
  Parallelization: Wave 0 | Blocked by: 2 | Blocks: 4, 22, 25
  References: `.omo/ulw-research/20260902-204022/wave-2-skeptic.md` C-SK-09; `wave-3-architecture-defense.md` §5; `claim-graph.md` C-022.
  Acceptance criteria: Node tests prove inclusion/exclusion, stable ordering, SHA banner, deleted-page handling, normalized equality and manual-edit detection; generated/public output contains 《잔선: 서울》 and the approved pitch, contains no private comparison names/internal channel labels/retired shooter label/private research title; machine-readable genre lock equals the three approved camera/silhouette/tile lines; workflow syntax validation passes. Remote Wiki publishing remains disabled until ADR-001 records a separate owner-approved binding.
  QA scenarios: happy — generate two sample Wiki pages at a fixed commit and compare normalized hashes; failure — alter the cloned Wiki page manually and verify the checker exits non-zero naming the page. Evidence `<attemptDir>/task-3-seoul-grand-strategy-srpg.txt`; cleanup removes temporary Wiki clone.
  Commit: Y | `ci(docs): add generated Wiki mirror contract`

- [ ] 4. Pin the exact Unity 6.7 baseline in a clean project
  What to do / Must NOT do: Only after Momus approval and Todo 2's neutral local workspace migration, enumerate installed/current Unity 6.7 channels, choose the newest acceptable beta/final or use `6000.7.0a5` only under `docs/adr/ADR-002-unity-6-7-channel.md`; create a clean Unity project at `Game/`; initially include only URP, Input System, Test Framework, uGUI/TMP, Rider/IDE support, and Localization when the first text surface is introduced. Pin editor revision and lockfile. Set product/display naming from 《잔선: 서울》 and neutral `JanseonSeoul` identifiers. Do not copy Makcha ProjectSettings wholesale, use reference/internal/retired-project terms in product/build/screenshot names, add deferred packages, create another codename, or create any project before the Momus receipt.
  Recommended task executor category: `unspecified-high` with `unity` skill — engine creation, package resolution and build validation.
  Parallelization: Wave 0 | Blocked by: 2 | Blocks: 5–19, 22–25
  References: `wave-2-unity-alpha.md`; `wave-3-architecture-defense.md` §2; local Makcha `ProjectVersion.txt`, `manifest.json`, installed `metadata.hub.json` as evidence, not copy source.
  Acceptance criteria: exact editor opens project in batchmode with exit 0; package lock contains only approved dependencies; compile and an empty EditMode/PlayMode sentinel test pass; macOS development build and Windows x64 target build either pass with installed module or the missing module is installed and rerun; ADR records support status and rollback/upgrade rehearsal.
  QA scenarios: happy — launch the built empty player and observe a deterministic bootstrap screen/version string; failure — change a disposable manifest version to an incompatible value and verify restore/validation fails, then restore. Evidence `<attemptDir>/task-4-seoul-grand-strategy-srpg.*`; cleanup kills player and removes disposable build.
  Commit: Y | `build(unity): pin Unity 6.7 project baseline`

- [ ] 5. Create engine-free module boundaries and dependency guards
  What to do / Must NOT do: Add asmdefs and folders for `Seoul.Core`, `Seoul.WorldGraph`, `Seoul.Battle.Contracts`, `Seoul.Battle`, `Seoul.Sim`, `Seoul.Data`, `Seoul.Presentation`, `Seoul.App`, and matching EditMode/PlayMode tests. Set `noEngineReferences: true` on Core/WorldGraph/Battle.Contracts/Battle/Sim. Add a dependency audit test/script rejecting forbidden UnityEngine references, reverse Data dependencies, static mutable registries, and cycles.
  Recommended task executor category: `deep` — cross-module architecture and enforceable dependency constraints.
  Parallelization: Wave 1 | Blocked by: 4 | Blocks: 6–18, 23
  References: `wave-3-architecture-defense.md` modules/hard rules; Makcha asmdefs only as negative/structural reference; `wave-2-skeptic.md` C-SK-01/07.
  Acceptance criteria: Unity compilation and asmdef dependency tests pass; structural scan finds zero `UnityEngine` imports in engine-free trees and zero mutable static fields outside explicit constants; a deliberate forbidden reference mutation makes the guard test RED.
  QA scenarios: happy — minimal App composition root constructs an empty engine-free world; failure — a test-only forbidden Core→UnityEngine reference is detected before compile. Evidence `<attemptDir>/task-5-seoul-grand-strategy-srpg.txt`.
  Commit: Y | `feat(core): establish engine-free module boundaries`

- [ ] 6. Define branded IDs, commands, events, clocks, and causal ledger
  What to do / Must NOT do: Implement immutable typed IDs for campaign, actor, faction, party, node, edge, item, battle, result and cause; deterministic campaign/world clocks; typed commands; append-only domain events with cause ID, before/after digest, world tick and ruleset revision; stable serialization order and PCG stream partitioning. No raw strings or Unity instance IDs cross contracts.
  Recommended task executor category: `deep` — foundational deterministic contracts used by every domain.
  Parallelization: Wave 1 | Blocked by: 5 | Blocks: 7, 9, 11, 13, 16, 23
  References: `wave-3-strategy-contract.md`; `wave-3-architecture-defense.md` boundedness; `claim-graph.md` C-019/C-024.
  Acceptance criteria: failing-first tests cover invalid/empty IDs, stable round-trip, event ordering, stream isolation and same seed+commands→same ledger hash; 10,000 generated IDs do not collide; serialization snapshots are machine-consumed schemas, not prose.
  QA scenarios: happy — CLI/test driver replays a short command sequence twice and prints identical world/ledger hashes; failure — reorder or corrupt one event and verification returns non-zero with the first mismatched sequence/cause. Evidence `<attemptDir>/task-6-seoul-grand-strategy-srpg.txt`.
  Commit: Y | `feat(core): add deterministic identity and event contracts`

- [ ] 7. Implement the layered Seoul world graph with provenance
  What to do / Must NOT do: Define node archetypes for line, station, interchange, station layer, surface district, tunnel segment, vertical connector, depot-adjacent hub, river crossing, hazard and authored strategic site; edge types for adjacency, transfer, vertical transition, crossing, supply, control and blockade; attach `measured | derived | fictional`, source ID/date/license state/confidence to every datum. Keep truth graph separate from player knowledge and presentation projections.
  Recommended task executor category: `deep` — graph invariants, provenance and navigation contracts.
  Parallelization: Wave 1 | Blocked by: 5, 6 | Blocks: 11, 12, 23
  References: `wave-3-seoul-registry.md`; `SYNTHESIS.md` terrain section; `claim-graph.md` C-001/C-010/C-016/C-020.
  Acceptance criteria: tests reject missing endpoints, duplicate IDs, illegal layer transitions, unlabeled provenance and deletion of blocked edges; path queries distinguish truth, known/observed, and display projections; fixture contains one line, three station archetypes and surface/underground transitions.
  QA scenarios: happy — driver computes a legal route through station→transfer→surface and explains every edge/source; failure — a collapsed edge remains visible as blocked and makes the route unavailable rather than disappearing. Evidence `<attemptDir>/task-7-seoul-grand-strategy-srpg.json`.
  Commit: Y | `feat(world): model layered subway strategy graph`

- [ ] 8. Build the source registry and fail-closed map import pipeline
  What to do / Must NOT do: Create `data/sources/registry.yaml`, raw/cache/generated separation, schema validators, hashes and import tooling. Implement the verified `OA-12914` ridership adapter only after confirming current API schema and dataset-specific terms. Other geometry remains authored/derived fixtures until an exact source clears. Never infer real station interiors or generalize portal licensing.
  Recommended task executor category: `unspecified-high` — external data boundary, licenses, reproducibility and validators.
  Parallelization: Wave 1 | Blocked by: 5 | Blocks: 9–11, 17, 23
  References: `wave-3-seoul-registry.md`; `sources-ledger.md` S011–S015; `verification-economics.md`.
  Acceptance criteria: pytest/node tests capture RED for missing license/source hash/schema drift; one pinned sample imports deterministically to normalized JSON; unavailable network uses committed licensed fixture, not silent mock; generated data includes provenance and source checksum.
  QA scenarios: happy — exact import command produces the same normalized hash twice and a station activity table; failure — source schema/license metadata mismatch blocks promotion and leaves prior generated output untouched. Evidence `<attemptDir>/task-8-seoul-grand-strategy-srpg.*`.
  Commit: Y | `feat(data): add provenance-gated Seoul source registry`

- [ ] 9. Implement the bounded scheduler, budgets, and deterministic replay harness
  What to do / Must NOT do: Build active-bubble full simulation plus off-screen scheduled actor records and aggregate faction/settlement ledgers; implement per-action/hourly/daily/weekly/on-demand cadence; register initial assumed budgets (actors 400, factions 12, nodes 900, edges 2600, parties 64, top-K relationships 12) as configurable experiment values, not promises; add replay, invariant and profiling harnesses.
  Recommended task executor category: `ultrabrain` — deterministic multi-rate simulation and invariant design.
  Parallelization: Wave 1 | Blocked by: 5, 6, 8 | Blocks: 10–12, 17, 23
  References: `wave-3-architecture-defense.md` boundedness; `wave-3-strategy-contract.md` cadence/invariants; `wave-2-skeptic.md` C-SK-01.
  Acceptance criteria: 100 fixed seeds replay twice with identical final/ledger hashes; no orphan actor/item/party, negative resource, invalid owner or unexplained event; runtime, memory and save-size budgets are preregistered before run and result table records pass/fallback. A failure reduces fidelity/budgets rather than adding seed-specific exceptions.
  QA scenarios: happy — headless driver runs 100 seeds and outputs a stable CSV/JSON report; failure — inject one nondeterministic RNG call and verify replay pinpoints first divergent event. Evidence `<attemptDir>/task-9-seoul-grand-strategy-srpg.*`.
  Commit: Y | `feat(sim): add bounded deterministic campaign scheduler`

- [ ] 10. Implement actors, parties, relationships, offices, factions, and succession
  What to do / Must NOT do: Model named actors, sparse meaningful relationships, parties, professions, offices, factions and legitimacy sources; support blood, adoption, apprenticeship, organizational and appointed succession; implement promotion/demotion between active and aggregate records. Avoid all-pairs relationships and fixed good/evil factions.
  Recommended task executor category: `deep` — interconnected domain invariants and succession edge cases.
  Parallelization: Wave 1 | Blocked by: 5, 8, 9 | Blocks: 11, 12, 17, 23
  References: `SYNTHESIS.md` people/factions section; 日本三國 `wave-1-nippon-story.md`; Taiko `wave-1-reference-games.md`; `wave-3-strategy-contract.md` invariants.
  Acceptance criteria: TDD covers join/leave, leader death, capture, office vacancy, multiple succession claims, sparse relationship eviction, aggregate promotion/demotion and no invalid reciprocal references; every change emits cause-linked events.
  QA scenarios: happy — simulate an unknown courier rising through station office and faction leadership by missions/relations; failure — kill/capture the leader with an empty successor set and verify deterministic vacancy/party handling. Evidence `<attemptDir>/task-10-seoul-grand-strategy-srpg.json`.
  Commit: Y | `feat(sim): add character and faction progression`

- [ ] 11. Implement resources, logistics, professions, missions, diplomacy, and legitimacy
  What to do / Must NOT do: Add bounded strategic resource categories, settlement production/consumption, route logistics, shortages, repair/power access, missions/orders, profession progression, transit rights, market access, joint defense, prisoner exchange, information and succession diplomacy. Keep exact prices and balance in data, not rule code; no unbounded item economy for off-screen actors.
  Recommended task executor category: `deep` — cross-domain economy and diplomacy interactions.
  Parallelization: Wave 2 | Blocked by: 6–10 | Blocks: 12, 23
  References: `SYNTHESIS.md` campaign/economy sections; reference matrix for Kenshi/Stoneshard/CK3/Taiko; `wave-3-architecture-defense.md` fidelity contract.
  Acceptance criteria: tests prove conservation, production/consumption causes, route blockade shortages, mission completion/failure, profession advancement, treaty preconditions and legitimacy changes; off-screen ledgers stay aggregated; no negative resource.
  QA scenarios: happy — unblock a line through a repair mission and observe supply/legitimacy/travel consequences; failure — attempt a resource transfer across a blocked route without rights and receive a typed rejection with no state mutation. Evidence `<attemptDir>/task-11-seoul-grand-strategy-srpg.json`.
  Commit: Y | `feat(sim): connect logistics missions and faction politics`

- [ ] 12. Prototype and select the player-facing subway strategy map
  What to do / Must NOT do: Within the locked fixed-isometric game grammar, build two strategy-information prototypes over the same truth graph: simultaneous multi-layer schematic and progressive subway schematic with selected-station detail. These are map UI overlays, not alternative playable cameras. Preregister route/layer/transfer/blockade comprehension tasks and thresholds; run them through actual Unity UI at minimum 1280×720 and nominal 1920×1080, including color-blind/grayscale states. Select the winner and remove the rejected path. Art reviewer must confirm that neither prototype introduces a second world-camera, silhouette, or tile standard.
  Recommended task executor category: `visual-engineering` with `unity`, `frontend`, and `visual-qa` skills — UI interaction and visual legibility are primary.
  Parallelization: Wave 2 | Blocked by: 7, 9–11 | Blocks: 23
  References: `wave-2-skeptic.md` C-SK-02/G3; `wave-3-architecture-defense.md` VS-2; `SYNTHESIS.md` terrain; `design-spec.md` palette.
  Acceptance criteria: automated input scenarios locate party/objective, select a legal transfer+vertical route, explain a blockade cut and compare time/danger; selected prototype meets preregistered completion/time/confusion thresholds; CJK labels do not clip; rejected implementation is deleted.
  QA scenarios: real Unity Play Mode via a dedicated `-batchmode` background process, producing screenshots at both resolutions and color-blind simulation plus JSON receipts; failure — blocked edge/layer ambiguity scenario must visibly prevent invalid route and explain why. Evidence `<attemptDir>/task-12-seoul-grand-strategy-srpg/` including screenshots and action transcript.
  Commit: Y | `feat(map): select legible subway strategy presentation`

- [ ] 13. Implement four-direction travel, layer transitions, and deterministic encounters
  What to do / Must NOT do: Implement cardinal-only local movement, world-edge travel, action costs, fatigue/supply/injury/load modifiers, vertical connectors, route permissions, stealth/noise, time-of-day and deterministic encounter generation. Diagonal movement is rejected at input and rules layers. Encounters may resolve through negotiation, work, trade, avoidance or battle.
  Recommended task executor category: `deep` — movement/time/encounter contracts cross graph and simulation.
  Parallelization: Wave 2 | Blocked by: 5–8 | Blocks: 14–17, 23
  References: `wave-3-strategy-contract.md`; `SYNTHESIS.md` movement section; Stoneshard role in `wave-1-reference-games.md`.
  Acceptance criteria: TDD covers all four directions, diagonal rejection, layer transitions, blocked/collapsed routes, injured/overloaded cost, permission failure, same seed encounter replay, non-combat resolution and causal ledger entries.
  QA scenarios: happy — travel surface→station→tunnel→interchange with exact action/time/supply transcript; failure — attempt diagonal and blocked-edge movement, both fail without consuming state. Evidence `<attemptDir>/task-13-seoul-grand-strategy-srpg.*`.
  Commit: Y | `feat(travel): add cardinal expeditions and encounters`

- [ ] 14. Implement immutable BattleContext and BattleResult contracts
  What to do / Must NOT do: Implement the complete versioned fields in `wave-3-strategy-contract.md`, context hashing, ruleset/content revisions, closed-world validation, legal exits, reinforcement schedules, character/party/item snapshots, outcome/fate/control/loot/result events, and schema migration rejection. Battle must not query mutable campaign state after issue.
  Recommended task executor category: `ultrabrain` — strict cross-domain immutable schema and adversarial edge cases.
  Parallelization: Wave 2 | Blocked by: 6, 13 | Blocks: 15–17, 23
  References: `.omo/ulw-research/20260902-204022/wave-3-strategy-contract.md`; `claim-graph.md` C-002/C-021.
  Acceptance criteria: tests prove stable hashes/serialization, context cannot reference missing/reserved entities, battle cannot request undeclared reinforcement/exit, result matches context battle ID/schema/revision, and malformed/conflicting results fail before mutation.
  QA scenarios: happy — issue and round-trip a context containing wounds, morale, equipment, supplies, hazards, exits and reinforcement; failure — mutate context after issue or add undeclared loot and verify validation rejects it. Evidence `<attemptDir>/task-14-seoul-grand-strategy-srpg.json`.
  Commit: Y | `feat(battle): define immutable campaign battle boundary`

- [ ] 15. Generate tactical boards from station and route archetypes
  What to do / Must NOT do: Create deterministic board templates/composers for small station, interchange, terminal, tunnel, surface ruin, depot-adjacent and river-crossing encounters using strategy terrain tags, hazards, objective, entrances/exits and reinforcement lanes. Every board uses the locked 1.5 m/1.5 Unity-unit tile, two-tile standard corridor and fixed orthographic 45°/35.264° camera. Do not author one bespoke board per station, claim real layouts, or introduce a second board scale/camera grammar.
  Recommended task executor category: `unspecified-high` — procedural tactical layout with deterministic validation and Unity scene/data authoring.
  Parallelization: Wave 2 | Blocked by: 7, 13, 14 | Blocks: 16, 23
  References: `wave-3-seoul-registry.md` archetype policy; `SYNTHESIS.md`; `wave-2-skeptic.md` tactical-authoring risk.
  Acceptance criteria: tests enforce reachable objectives, legal deployment/exit zones, no isolated mandatory cells, cardinal pathing, hazard rules and same seed→same board hash; fixtures cover all seven archetypes.
  QA scenarios: happy — render contact sheets for all archetypes and run reachability report; failure — inject a sealed objective or invalid vertical transition and verify generation rejects/retries within bounded attempts. Evidence `<attemptDir>/task-15-seoul-grand-strategy-srpg/`.
  Commit: Y | `feat(battle): generate subway tactical archetypes`

- [ ] 16. Implement the minimum complete SRPG combat rules
  What to do / Must NOT do: Implement cardinal grid turns, initiative/AP, movement, melee/ranged/utility actions, cover/line-of-sight only where archetype tags justify them, hazards, morale, downed/injury/capture, objectives, retreat, reinforcement and deterministic battle event log. Keep rule core engine-free; Unity presents commands/events.
  Recommended task executor category: `deep` — tactical rules, determinism and state-machine correctness.
  Parallelization: Wave 2 | Blocked by: 5, 13–15 | Blocks: 17, 23
  References: reference SRPG findings in `wave-1-reference-games.md`; `wave-3-strategy-contract.md`; `wave-2-skeptic.md` C-SK-03.
  Acceptance criteria: TDD covers legal/illegal moves, LOS/cover, AP, injury/down/capture/death, objective outcomes, retreat, reinforcement, no softlocks, and same commands→same event/result hash; no timing sleeps.
  QA scenarios: happy — play a short tunnel engagement through Unity UI to victory and retreat variants; failure — malformed action and unreachable target are rejected without consuming AP. Evidence `<attemptDir>/task-16-seoul-grand-strategy-srpg/` including Play Mode screenshots/log.
  Commit: Y | `feat(combat): add deterministic SRPG encounter rules`

- [ ] 17. Implement idempotent battle settlement and strategic feedback
  What to do / Must NOT do: Validate and atomically apply ResultId once in invariant order: fate/capture, inventory/loot, party location, time, node/route control, reputation/relationship events. Store receipt/world hash; conflicting result for one battle is a hard recovery error. Initial version freezes campaign time during battle. Support pre-battle, mid-battle and post-settlement save boundaries.
  Recommended task executor category: `ultrabrain` — transactional semantics and state integrity.
  Parallelization: Wave 2 | Blocked by: 8–10, 13–16 | Blocks: 18, 23
  References: `wave-3-strategy-contract.md` settlement/time/edge cases; `claim-graph.md` C-002/C-021.
  Acceptance criteria: duplicate settlement returns identical receipt with zero changes; conflicting result fails; leader death, capture, all exits blocked, empty party, crash/retry and node-control changes preserve every invariant. Three strategy preparations change tactical context; result changes three named strategic options.
  QA scenarios: happy — complete strategy→battle→strategy with supply, route and ally preparation; failure — kill process between prepared transaction and commit, restart and safely settle exactly once. Evidence `<attemptDir>/task-17-seoul-grand-strategy-srpg.*`.
  Commit: Y | `feat(sim): settle battle consequences exactly once`

- [ ] 18. Add versioned campaign and mid-battle persistence
  What to do / Must NOT do: Define explicit save schemas for WorldState, command/event cursors, source/content revisions and optional battle checkpoint; use atomic temp-write+replace, checksums and migration dispatch. Never copy Makcha's line-ordered plaintext or silently load incompatible schema/content.
  Recommended task executor category: `deep` — durable schema, corruption recovery and deterministic replay.
  Parallelization: Wave 3 | Blocked by: 5, 17 | Blocks: 23, 25
  References: `wave-3-architecture-defense.md` save audit; `wave-3-strategy-contract.md` save points.
  Acceptance criteria: tests cover round-trip, stable hash, pre/mid/post-battle resume, corrupted/truncated file, unsupported schema, interrupted write, migration fixture and exact error types; save restore resumes to same final ledger/world hash.
  QA scenarios: happy — start expedition, save mid-battle, quit built player, reload and settle identically; failure — corrupt a copy and verify original backup remains loadable with a clear recovery message. Evidence `<attemptDir>/task-18-seoul-grand-strategy-srpg/`; cleanup deletes QA saves.
  Commit: Y | `feat(save): add versioned campaign checkpoints`

- [ ] 19. Compare and select the production character rendering path
  What to do / Must NOT do: After the art lock receipt, build one original 2.5-head-tall character in three rendering-media variants: runtime pixel-head+mesh-body, unified SD 3D mesh with nearest-filtered pixel face atlas, and unified four-direction sprite render. Every variant uses the exact fixed orthographic camera, four cardinal facings, one-tile footprint, shoulder/weapon envelope and 1.5 m tile scale; this task may choose rendering medium but may not reopen genre grammar. Use the same identity, animations, equipment and lighting. Preregister class-A defects and direction-read threshold before capture; run Unity in Play Mode and follow the mandatory four-reviewer Unity visual rule. Delete losing production code/assets after decision while retaining evidence.
  Recommended task executor category: `visual-engineering` with `unity`, `game-assets`, and `visual-qa` skills — real Unity visual comparison is decisive.
  Parallelization: Wave 3 | Blocked by: 3, 4 | Blocks: 23
  References: `SYNTHESIS.md` character section; `wave-2-skeptic.md` C-SK-04; `wave-1` hybrid research; project AGENTS Unity visual verification rule.
  Acceptance criteria: `-batchmode` Play Mode screenshots and JSON receipts cover four directions × idle/walk/attack/hit/death × bright/dark/colored light × occlusion × 1280×720/1920×1080; four independent `agy --print --model gemini-pro-agent` reviewers evaluate COMPOSITION/SPRITE_FIDELITY/TYPOGRAPHY/PRODUCT_POLISH; chosen path has zero class-A seam/depth/sorting/direction defects and beats/safely ties alternatives.
  QA scenarios: real Unity Play Mode only; failure — force non-integer zoom, mirrored asymmetric gear and foreground occlusion to expose artifacts. Evidence `<attemptDir>/task-19-seoul-grand-strategy-srpg/` with screenshots, action log and four reviews.
  Commit: Y | `feat(character): select verified SD rendering pipeline`

- [ ] 20. Implement the production asset BOM and fail-closed promotion tools
  What to do / Must NOT do: Re-derive or independently extract the useful Makcha `tools/art` patterns into `tools/pipeline/`; define JSON Schema for inputs, rights, source/model/node SHAs/licenses, environment/wheel hashes, workflow/prompt/seed, raw outputs, Blender operations, Unity settings, human review and status. Promotion copies only an approved content-addressed artifact and writes receipts. No hard-coded tokens or implicit licenses.
  Recommended task executor category: `unspecified-high` with `programming` skill — Python boundary tooling, schemas, security and provenance.
  Parallelization: Wave 3 | Blocked by: 1–4 | Blocks: 21, 23
  References: `wave-2-trellis-rights-comfy.md`; `wave-2-skeptic.md` C-SK-05; Makcha `tools/art/` only through blank-environment extraction gate.
  Acceptance criteria: pytest mutation proof for every required field; blocked/unresolved rights, changed hash, unknown node/model license or missing human review prevents promotion and leaves destination untouched; allowed manifest promotes once idempotently with receipt.
  QA scenarios: happy — promote a rights-cleared disposable cube asset end-to-end; failure — remove input rights or change raw hash and verify non-zero rejection. Evidence `<attemptDir>/task-20-seoul-grand-strategy-srpg.*`; cleanup removes disposable artifacts.
  Commit: Y | `feat(pipeline): enforce asset provenance bill of materials`

- [ ] 21. Pin and prove the ComfyUI/TRELLIS to Blender to Unity pipeline
  What to do / Must NOT do: On a suitable NVIDIA host, pin ComfyUI and built-in TRELLIS2 nodes first; use a community wrapper only if a named required capability is missing and after repo/SHA/license/wheel audit. Generate one original prop and one original SD body blockout, archive raw output, run deterministic Blender cleanup/scale/orientation/retopo/UV/material/LOD/collision scripts, import to Unity, build prefabs and pass BOM promotion. Do not claim byte-identical stochastic regeneration; preserve raw outputs.
  Recommended task executor category: `deep` with `asset-gen` and `unity` skills — external GPU stack, DCC and Unity integration.
  Parallelization: Wave 3 | Blocked by: 19, 20 | Blocks: 23
  References: `wave-2-trellis-rights-comfy.md`; `wave-1-asset-pipeline.md`; ComfyUI source S021; `visualbruno` only as optional S023.
  Acceptance criteria: clean environment lock records GPU/driver/CUDA/Python/Torch/ComfyUI/nodes/models; workflow runs and BOM links every file; Blender output has applied scale, valid normals/manifold policy, bounded triangles, UVs, material channels, LODs and colliders; Unity prefab renders and build succeeds; rights status allowed.
  QA scenarios: happy — regenerate pipeline configuration and import archived raw outputs into a clean Unity checkout; failure — unknown custom node/wheel or wrong scale/axis blocks promotion. Evidence `<attemptDir>/task-21-seoul-grand-strategy-srpg/`; cleanup stops ComfyUI and removes temporary environments/caches per receipt.
  Commit: Y | `feat(assets): prove audited 3D production pipeline`

- [ ] 22. Add exact-editor local checks and Wiki generation workflow
  What to do / Must NOT do: Add local workflow definitions/scripts for text/schema/tests, secret scan, LFS checks, docs/Wiki generation and exact Unity editor validation. The checks must not quietly use Makcha's 6000.5 editor when the project pins 6.7. Document how a future runner must match the exact editor, but do not bind, enable, dispatch or push any GitHub workflow/Wiki job under this plan.
  Recommended task executor category: `unspecified-high` — local automation, exact Unity validation and Wiki drift checks without remote operations.
  Parallelization: Wave 3 | Blocked by: 2, 3 | Blocks: 25
  References: `wave-3-architecture-defense.md` Unity/CI anti-example; `wave-1-repo-wiki.md`; `.github/workflows/verify-platforms.yml` in Makcha as a negative reference.
  Acceptance criteria: workflow lint and local action-equivalent pass; editor mismatch fails visibly; secret/LFS/docs drift fixtures fail; generated local Wiki tree contains only mapped pages with local SHA banners; `git remote -v` remains empty and no network workflow exists. Required future secret names may be documented but no value is copied from Makcha.
  QA scenarios: happy — local action-equivalent completes; failure — pin mismatch and a manually altered local Wiki mirror each produce a failed check naming remediation. Evidence `<attemptDir>/task-22-local-checks.*`; cleanup removes temporary local Wiki fixtures.
  Commit: Y | `ci(project): enforce local Unity and Wiki gates`

- [ ] 23. Build the first integrated subway campaign slice
  What to do / Must NOT do: Integrate one original fictional line, three station archetypes, surface/underground transitions, two factions with distinct legitimacy, at least six named actors/professions, one logistics mission, one relationship/office change, one 4-direction expedition, one non-combat encounter, one decisive SRPG battle, battle settlement, save/load, selected map UI, selected character rendering and two BOM-approved assets. No placeholder path may bypass final state contracts.
  Recommended task executor category: `ultrabrain` — cross-domain integration with strict acceptance gates.
  Parallelization: Wave 4 | Blocked by: 6–21 | Blocks: 24, 25
  References: all accepted research artifacts; especially `SYNTHESIS.md`, `wave-3-architecture-defense.md` VS-8, `wave-3-strategy-contract.md`.
  Acceptance criteria: all narrow tests pass; one seed+command script reproduces identical campaign and battle hashes; mission choices change route/supply/reinforcement; battle outcome changes injuries, relationships, legitimacy and node/route state; pre/mid/post save resumes identically; no invariant or BOM violation.
  QA scenarios: run the built player through new campaign→map→mission prep→4-way expedition→non-combat encounter→SRPG battle→settlement→save/reload. Bad path: insufficient transit rights and blocked route must be explained and state-preserving. Evidence `<attemptDir>/task-23-seoul-grand-strategy-srpg/` with logs and Unity Play Mode/built-player screenshots.
  Commit: Y | `feat(slice): integrate first subway campaign loop`

- [ ] 24. Complete the originality dossier and public-name gate
  What to do / Must NOT do: Write private adopt/transform/avoid matrices for narrative, mechanics, map, proportions, silhouette, palette, UI and marketing; confirm the art reviewer did not permit a second camera/silhouette/tile grammar; confirm the marketing reviewer approved 《잔선: 서울》, its one-line pitch, repository description and neutral capture/build filenames; have an adversarial critic explicitly attack any averaging of free-camera open-world sandbox and fixed-isometric CRPG conventions. Remove reference titles and `homage/exact` language from production prompts/docs/assets; run repository text/asset metadata scans, blind attribution warning review on final captures, GitHub/trademark search for the candidate external title, and professional-review handoff checklist before public exposure. Private research remains out of Wiki.
  Recommended task executor category: `unspecified-high` — cross-surface originality and publication gate.
  Parallelization: Wave 4 | Blocked by: 23 | Blocks: 25
  References: `wave-2-skeptic.md` C-SK-08; `wave-3-architecture-defense.md` §4; `wave-1-nippon-story.md` adopt/transform/avoid.
  Acceptance criteria: scan reports no private comparison name, internal channel label, retired shooter-project label or other reference-franchise token in post-migration folders, commit subjects, README product copy, repository description, Wiki, store copy, screenshot/build filenames, prompts/assets or shipped UI; every final element links to original lineage; art, marketing and critic reviews explicitly approve their locks; blind reviewers do not repeatedly identify one protected source as the obvious expression; any future repository binding/rename/overwrite/visibility decision is separately owner-approved. Professional review is required for commercial marketing, not replaced by the blind panel.
  QA scenarios: happy — scan and blind-review report clear representative map, character and battle captures; failure — inject a forbidden franchise token into a disposable Wiki source and verify publication gate fails. Evidence `<attemptDir>/task-24-seoul-grand-strategy-srpg.*`.
  Commit: Y | `docs(identity): lock original Seoul game direction`

- [ ] 25. Generate stable game-logic Wiki pages and capture release-quality proof
  What to do / Must NOT do: After all implementation gates pass, finalize repository-canonical Korean pages for game thesis, world layers/provenance, characters/factions, campaign loop, travel/encounters, battle boundary, tactical rules, save model, character rendering decision, asset BOM and architecture. Generate the Wiki mirror locally and run drift/link/image/deletion checks. Do not configure a remote, push or publish under this plan. Retain the verified local mirror for a separate future owner-authorized publication plan. Do not include private research/IP dossier, internal labels or unresolved claims.
  Recommended task executor category: `unspecified-high` with `writing`, `unity`, and `visual-qa` skills — documentation publication plus full real-surface evidence.
  Parallelization: Wave 4 final implementation task | Blocked by: 18, 22–24 | Blocks: Final verification
  References: `SYNTHESIS.md`; `design-spec.md`; Todo 3 Wiki contract; all ADRs and accepted implementation receipts.
  Acceptance criteria: canonical docs and locally generated Wiki normalized hashes match; every page has source path+local SHA; links/images resolve; manual local-mirror alteration is detected; `git remote -v` remains empty; complete test/build matrix passes with exact counts; built slice happy and failure paths pass; no live QA process/temp directory/port remains.
  QA scenarios: local docs — generate the Wiki tree, alter a disposable page, verify normalized comparison fails, regenerate and verify equality; Unity — run EditMode/PlayMode, Windows x64 build and macOS smoke, launch the actual player and execute Todo 23 flow plus bad route/input/load; capture screenshots/logs with neutral names and cleanup receipts. Evidence `<attemptDir>/task-25-local-wiki-and-release-qa/`.
  Commit: Y | `docs(wiki): generate verified game logic reference`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Goal and plan compliance audit
  Verify every Must have, Must NOT have, task receipt, ADR and G1–G8 gate against the final diff, repository/Wiki state and evidence ledger. First verify that the exact plan hash received unconditional Momus approval before Todo 1 began; reject any earlier Unity/GitHub/Makcha/Wiki implementation. Reject missing RED→GREEN, skipped tests, unsupported claims, absent cleanup or any changed requirement without approval. Recommended verifier category: `unspecified-high`.
- [ ] F2. Architecture, determinism, persistence, and security review
  Review dependency direction, engine-free purity, static state, replay, invariants, battle settlement, save corruption/migration, external data validation, asset promotion, secrets and GitHub workflow permissions. Run adversarial mutations rather than source-only approval. Recommended verifier category: `deep`.
- [ ] F3. Real Unity and local-repository manual QA
  In the actual Unity Editor Play Mode and built players, execute happy path, bad input/blocked route, mid-battle save/reload and consequence feedback; inspect screenshots under the four-reviewer Unity visual rule. Verify the existing local repository remains the sole worktree, `git remote -v` is empty, and the local Wiki tree matches canonical docs. Recommended verifier category: `unspecified-high` with `unity` and `visual-qa`.
- [ ] F4. Scope, originality, provenance, and documentation fidelity
  Confirm all requested reference lessons are transformed rather than copied; the single fixed-isometric exploration+SRPG loop, aligned 2.5-head four-facing silhouette and 1.5 m tile scale remain singular; 《잔선: 서울》 and its pitch are the only external identity; Seoul subway layering, 4-direction movement, grand strategy, party play, hybrid decision, Unity 6.7, Makcha preservation, TRELLIS/ComfyUI and locally generated Wiki output are present. Confirm only the existing local repository was used, no unused remote repository was touched and `git remote -v` is empty. Require independent art-direction, marketing and adversarial-critic approvals. Audit every production asset BOM and ensure private research/internal names are not published. Recommended verifier category: `unspecified-high`.

## Commit strategy

- Commit only after each todo's RED→GREEN, surface QA, diagnostics and cleanup are complete.
- No commit, push, rename, remote change, Wiki write or Unity project creation occurs before unconditional Momus approval of the exact plan hash.
- Todo 1 commits and pushes in `makcha-unity` only after Momus approval.
- Todo 2 uses only local Git state, keeps the existing repository root in place, records remote absence and naming exclusions, and makes one local documentation commit. It performs no GitHub query or mutation.
- Subsequent local commits use scoped Conventional Commit subjects that contain no private comparison names, internal channel labels or retired shooter-project labels.
- Never combine failed or unverified tasks into an omnibus commit. Never amend, force-push or rewrite history without explicit approval.
- Generated Wiki changes remain local verified artifacts; canonical document changes are committed only in the existing local repository.
- Plan footer for execution commits that implement this plan: `Plan: .omo/plans/seoul-grand-strategy-srpg.md`.

## Success criteria

1. Current Makcha Hunter02/Tripo changes are proven, atomically committed and present on `origin/main` with no unrelated files.
2. The existing local repository at `/Users/ilseoblee/workspace/seoul-kenshi` remains the only repository/worktree; no GitHub repository or remote is created, queried for reuse, renamed, deleted, overwritten, connected or pushed, and `git remote -v` remains empty through this plan.
3. Exact Unity 6.7 editor/package revision restores, compiles, passes EditMode/PlayMode, and builds Windows x64 plus macOS smoke; alpha risk is explicit if applicable.
4. Engine-free modules enforce dependency purity, deterministic replay and causal state changes; 100 seeds replay twice without divergence or invariant violation within preregistered budgets.
5. The subway-centered layered Seoul graph labels every datum measured/derived/fictional and the selected player map proves route/layer/transfer/blockade comprehension.
6. Four-direction travel, missions, professions, factions, logistics, diplomacy and encounters form a causal campaign loop.
7. Immutable BattleContext/Result, deterministic SRPG rules and ResultId settlement survive duplicate, crash, retreat, defeat, capture, death, reinforcement and disconnected-route tests.
8. Pre-, mid-, and post-battle saves recover to identical campaign/battle hashes and reject corruption/incompatible schemas safely.
9. The selected character rendering path wins real Unity capture comparison and passes four independent visual reviewers; losing production paths are removed.
10. ComfyUI/TRELLIS→Blender→Unity works from pinned configuration, and every shipped asset has an allowed complete BOM.
11. The integrated one-line/three-station/two-faction slice is personally playable through the actual built surface and exhibits bidirectional strategy↔SRPG consequences.
12. Repository Korean game-logic docs are canonical; a local SHA-bannered Wiki tree is generated and its drift test catches manual edits. Remote publication is a separate future plan.
13. Originality/publication gates find no copied characters, story, trade dress, reference-token production surfaces, or unreviewed commercial assets.
14. All tests, diagnostics, builds, final reviewers and cleanup receipts are green, with no skipped/xfail tests or live QA resources.
15. Genre lock remains exact: exploration, interaction and SRPG combat share one fixed orthographic isometric camera and cardinal grid at 45° yaw/35.264° pitch; no free-camera squad sandbox or second combat loop; 2.5-head-tall four-facing SD silhouette; 1.5 m = 1.5 Unity-unit tile and two-tile standard corridor.
16. External identity remains exact until owner-approved replacement: 《잔선: 서울》 plus its approved one-line pitch; internal/reference names are absent from store, README product copy, repository description, Wiki, screenshots, builds, marketing and shipped UI.
17. Art-direction, marketing and adversarial-critic lock receipts are recorded, and the plan's exact hash received unconditional Momus approval before any implementation or external write began.

## Amendment 2026-09-03: owner-authorized GitHub delivery supersedes local-only clauses

This amendment is appended only. No original plan text above is edited, reordered or deleted. The pre-amendment SHA-256 of this file is `37833346cdc8ace8a62408cb0bed2a5dcd205ff624840aad9b2c62db61b194f1`, and the original content remains in Git history at commit `1893a04`.

On 2026-09-02 the owner authorized creating the private GitHub repository `islee23520/seoul-kenshi`, binding it as `origin`, and pushing this repository (recorded in `.omo/evidence/foundation/execution-notepad.md`). On 2026-09-03 the owner approved the remediation plan `.omo/plans/fix-validate-commit-push.md` (Momus receipt `st_01a066c9`), which authorizes the dedicated branch `fix/verified-foundation-wiki-remediation`, one push of that branch, and one pull request.

Accordingly, every local-only delivery clause of this plan is superseded by `docs/adr/ADR-001-repository-delivery-policy.md`, which is now the single current delivery rule. The superseded clauses, each keyed by a clause ID:

| Clause ID | Plan location | Superseded local-only clause |
| --- | --- | --- |
| LOC-01 | "What you'll get" (TL;DR) | "GitHub 저장소·remote·push·Wiki 게시에 관한 외부 쓰기는 이 계획에서 수행하지 않습니다." |
| LOC-02 | TL;DR (machine) | "keep the current local repository as the only repository and GitHub untouched" |
| LOC-03 | "Decisions I made for you" | "GitHub remote는 미설정 상태로 유지합니다." |
| LOC-04 | Execution scope | "do not create another repository/worktree or configure a remote under this plan" |
| LOC-05 | Must have | "GitHub currently has no repository for this project. Do not create one now." |
| LOC-06 | Must have | "remote Wiki publication is outside this plan." |
| LOC-07 | Must NOT have | "Do not create any GitHub repository or remote under this plan." |
| LOC-08 | Surface evidence | "local repository/remote-absence checks" |
| LOC-09 | Wave 0 | "GitHub state stays untouched" |
| LOC-10 | Todo 2 / Todo 22 / Todo 25, Success criteria 2, Final verification F3/F4 | every "`git remote -v` remains empty" and "remote absence" expectation |
| LOC-11 | Todo 2 (docs authority ADR) | "`github_remote: none`" |
| LOC-12 | Success criteria 12 | "Remote publication is a separate future plan." |

Catch-all: any other clause in this plan that touches delivery, remotes, pushes or Wiki publication — whether or not listed above — is also superseded and defers to ADR-001 as the single current delivery rule. No delivery-related rule in this plan remains in force independently of ADR-001.

Everything not related to delivery stays in force, including the exclusion of the unused private shooter repository, the naming and identity locks, the reviewer locks, and the ban on destructive Git operations. Delivery limits (branch and pull request only, no direct push to `main`, no force-push, no agent merge, revert-based rollback) are defined by ADR-001, not by this amendment.
