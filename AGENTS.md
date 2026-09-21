# PROJECT KNOWLEDGE BASE

**Generated:** 2026-09-19
**Commit:** 903fd8a8
**Branch:** main

## OVERVIEW
Character-centered grand-strategy 4X RPG set in post-collapse Seoul's subway network. Product target combat (Intent decision 11, 2026-09-19) is Total War-style unit command with anime natural proportions. Current Unity remains an Oddland/card-combat POC and is not the new game. Unity 6000.7.0a5 runs the game; Node/Python tooling validates documentation, architecture, assets and captures, while Backend hosts a .NET 8 ASP.NET Core host-session coordinator.

## STRUCTURE
```text
seoul-kenshi/
|-- Concept.md, Intent.md, Design.md, ToDo.md, README.md, AGENTS.md, SERVICES.md  # root guidance keepers
|-- GAME/                  # Unity project root; contract in GAME/AGENTS.md
|   |-- play/              # staged copy of WEB/wiki-source/dist/play (web POC, /play/); edits belong upstream
|   |-- Assets/Janseon/    # Core (engine-free) + Data + Foundation; see Janseon/AGENTS.md
|   |-- Assets/Tests/      # EditMode & PlayMode validation
|   `-- ProjectSettings/
|-- GDD/                   # single game-design canon: rules/, references/, architecture/, art/, adr/, proposals/, system-design/
|-- LORE/                  # world atlas canon; AGENTS.md covers root projections
|   |-- bestiary/          # group-owned ecology/variant encyclopedia; 27 G pages, 422 entries
|   |-- characters/        # 1001-cast roster hubs, Cast-State ledgers, relation graph
|   |-- name-pools/        # machine-verified naming/values JSON datasets
|   |-- regions/           # 427-dong authored atlas content + pipeline contract
|   `-- places/, factions/, culture/, chronology/ + single-concept dirs (economy, overview, ailments, goods, offices, structures, technology, people-and-machines)
|-- GAME-REFERENCE/        # asset BOMs, UX refs, geography data, frozen POCs (router AGENTS.md)
|-- RESEARCH/              # citation-tiered canon reference + verification artifacts
|-- Reference/             # wiki diagram assets (assets/wiki); NOT the same as GAME-REFERENCE
|-- TOOL/                  # skills/, docs/, tools/ (repo npm package), unity-remote/ (only submodule)
|-- WEB/                   # official React wiki + VitePress staging/gates; never canon
|-- Backend/               # ASP.NET Core host-session coordinator (server/Coordinator) + tests
|-- SOCIAL-MEDIA/          # operator X/Threads serial; NOT a hub page (see SOCIAL-MEDIA/AGENTS.md)
|-- evidence/              # append-only test-evidence bundles (seoul-strategy-map-gdd/, pr-144/); new evidence = new dated dir
|-- store/                 # frozen design-store capture run-4343cc0-160339 (pinned @ 4343cc0, 2026-09-13); root planning docs are the LIVE copies
|-- Wikis/                 # legacy remnant (3 files); design-store seed remaps its old paths
`-- .omo/                  # untracked local state (whole directory ignored, 2026-09-19 owner directive); AGENTS.md is local-only
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Design entry and navigation | `GDD/Home.md`, `WEB/wiki-source/_Sidebar.md` | GDD is canon; sidebar is publication chrome |
| Target unit-command UI (docs) | `GDD/system-design/total-war-ui/`, `Design.md` §0 | Documentation templates only; not a runtime claim |
| Architecture and rollout | `GDD/architecture/Unity-Architecture.md`, `GDD/architecture/Unity-System-Design.md`, `GDD/architecture/Unity-Architecture-Implementation-Plan.md` | All design canon lives under GDD |
| Save and randomness contracts | `GDD/rules/Save-and-Determinism.md` | Versioning, event records, separated RNG streams |
| World canon edits | `LORE/AGENTS.md` | Only `World-Narrative-Atlas.md` and `Glossary.md` are hand-edited; other LORE root .md are generated projections |
| Terminology & Glossary | `LORE/Glossary.md`, `LORE/glossary.json` | Sole source of truth for public terminology and machine-readable dictionary |
| Cast corpus | `LORE/characters/AGENTS.md`, `LORE/characters/Cast-Index.md` | 16 Cast-State ledgers; edits gated by `verify-cast.mjs` |
| Naming/value datasets | `LORE/name-pools/AGENTS.md` | `values-cast.json` (schema v2) canon; `verify-hangnyeol` gate |
| Region atlas content | `LORE/regions/AGENTS.md` | 427-dong data and rebuild contract |
| Places / factions / culture canon | `LORE/places/AGENTS.md`, `LORE/factions/AGENTS.md`, `LORE/culture/AGENTS.md` | Station catalog feeds `RouteGraph.CreateSeoul()`; S01–S16 polities; values-axes semantics |
| Unity setup, builds, quality gateway | `GAME/AGENTS.md` | Pinned editor, batchmode; WebGL build via `FoundationProjectBuilder.BuildWebGlPlayer` |
| Runtime domain map | `GAME/Assets/Janseon/AGENTS.md` | Core/Data/Foundation incl. strategy-map core, `Foundation/Battle/`, `Foundation/Presentation/` |
| Unity tests and captures | `GAME/Assets/Tests/AGENTS.md` | Test-mode ownership and evidence receipts |
| Tooling and checks | `TOOL/AGENTS.md`, `TOOL/tools/AGENTS.md` | Child files: art, wiki, design-store, regions, strategy-map |
| Asset processing | `GDD/Asset-Pipeline.md`, `TOOL/tools/art/AGENTS.md` | Design contract versus executable promotion checks |
| Wiki/world-atlas pipeline | `TOOL/tools/wiki/AGENTS.md`, `WEB/wiki-source/AGENTS.md` | `mount.mjs` stages canon; `gate.mjs` scans rendered dist |
| Browser comparison reference | `GAME-REFERENCE/AGENTS.md`, `GAME-REFERENCE/poc/browser/AGENTS.md` | Frozen four-surface prototype, not the product runtime |
| Web POC runtime copy | `GAME/play/AGENTS.md` | Staged byte-copy of `WEB/wiki-source/dist/play`; `node --test model.test.mjs`; `world-data.js` generated, never hand-edit |
| Backend service | `Backend/AGENTS.md`, `Backend/server/Coordinator/` | REST + WebSocket on Kestrel :1219, in-process identity |
| Research citation policy | `RESEARCH/AGENTS.md` | Citation tiers, verification records, banned-term JSONs |
| Delivery and publishing | `GDD/adr/ADR-001-repository-delivery-policy.md` | Accepted authority over historical local-only clauses |
| Web hub deploy | `SERVICES.md`, `index.html` | `https://seoul-dengoku.linalab.io` self-hosted (docker nginx + cloudflared, Cloudflare Access); Vercel read-only pending removal; hub overlays: `GAME-REFERENCE/ui-layout-moodboard/`, `portrait-demo/`, `ui-ux-refs/` |
| Operator social serial | `SOCIAL-MEDIA/` | X English / Threads Korean. Not a hub path. |

## CODE MAP
Writer-digest LSP/ast-grep findings plus retained root symbols; C# LSP coverage was partial. Repo-wide reference centrality is unmeasured, not zero.

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `CoreApi`, `PurposeRng` | API / RNG | `GAME/Assets/Janseon/Core/DeterministicCore.cs` | Unmeasured | Deterministic domain entry and random streams |
| `RouteApi`, `CampaignApi`, `BattleApi`, `SettlementApi` | Domain APIs | `GAME/Assets/Janseon/Core/` | Unmeasured | Route, campaign, battle and settlement domains |
| `Grid`, `HeightmapDomain`, `StrategyMapCatalog`, `SeoulWorldGraphCatalog` | Core models | `GAME/Assets/Janseon/Core/` | Unmeasured | Strategy-map world model (newest code wave) |
| `ApplicationFlowCoordinator` | Coordinator | `GAME/Assets/Janseon/Foundation/AppFlow/` | Unmeasured | Application screen flow |
| `BattleSessionDriver`, `FoundationBattleView` | Driver / view | `GAME/Assets/Janseon/Foundation/Battle/` | Unmeasured | Battle session, uGUI host, viewport pointer input |
| `StrategyMapPresenter`, `HeightmapVoxelWorld` | Presenter | `GAME/Assets/Janseon/Foundation/Presentation/` | Unmeasured | Strategy-map screen, voxel heightmap world, landmark catalogs |
| `PocCoreLoopController` | Controller | `GAME/Assets/Janseon/Foundation/UI/` | Unmeasured | Proof-of-concept core-loop UI |
| `RuntimeSlotCatalog`, `UguiHudBuilder` | Catalog / builder | `GAME/Assets/Janseon/Foundation/` | Unmeasured | Runtime asset slots; uGUI screen construction |
| `FoundationProjectBuilder.BuildWebGlPlayer` | Build entry | `GAME/Assets/Janseon/Foundation/Editor/` | Unmeasured | Writes `GAME/Builds/WebGL`, success log `BUILD_WEBGL_OK` |
| `buildWiki`, `materialize-world-atlas`, `verify-cast`, `verify-hangnyeol` | Functions | `TOOL/tools/wiki/` | Unmeasured | Wiki build, atlas projection, cast/naming gates |
| `auditRuntimeProvenance`, `evaluatePromotedAsset` | Functions | `TOOL/tools/art/` | Unmeasured | Source-bound asset eligibility checks |
| `mda-store.mjs`, `seed-from-canon.mjs` | Store / seeder | `TOOL/tools/design-store/` | Unmeasured | MDA SQLite store; generated design-store pages |
| `createSquadBattleState` | Function | `GAME-REFERENCE/poc/browser/` | 5 (limited JS scope) | Shared browser battle model |
| `generate-core-isometric-diagrams.mjs` | Script | `TOOL/tools/wiki/` | Unmeasured | Renders isometric diagrams into `Reference/assets/wiki` |
| `RelayWebSocketConnection` | Connection | `Backend/server/Coordinator/` | Unmeasured | Raw WebSocket relay (header-or-query identity) |

## CONVENTIONS
- The Unity project root is `GAME/`, not the repository root. Its editor pin is an alpha release, not a generic Unity LTS target.
- `Janseon.Core` is engine-free; Foundation integrates Core with Unity and VContainer.
- Repository documentation is authoritative. Serve `WEB/wiki-source` locally (`npm run docs:dev`) and publish `https://seoul-dengoku.linalab.io` (self-hosted via Cloudflare Tunnel); the remote Wiki, VitePress publication and HTML mirrors are derivatives. Edits go in `GDD/` and `LORE/`, never in `WEB/wiki-source/{rules,world,design}` generated mirrors.
- Design pages use Korean prose, English hyphenated filenames, ordinary relative Markdown links, and GitHub image URLs with `?raw=true`; canonical page names use Title-Case-With-Hyphens.
- Repo automation is the private ESM package `TOOL/tools`; `TOOL/unity-remote` is the ONLY Git submodule (character-forge was removed). VitePress requires Node >=22 <27.
- `Reference/` (wiki diagram assets) and `GAME-REFERENCE/` (BOMs, UX refs, prototypes) both exist at root — do not merge or confuse them.
- Commits follow Korean conventional-commit style (`feat(tools): …`, `fix(map): …`).
- Canonical git paths are `TOOL/…` / `RESEARCH/…`; lowercase `Tool/`/`Research/` spellings (used in some schema docs) only resolve on case-insensitive checkouts.
- After any GDD/LORE canon edit, re-stage site mirrors with `WEB/wiki-source/scripts/mount.mjs` and run `gate.mjs` after `docs:build`; the design store rebuilds only via `seed-from-canon.mjs`.

## ANTI-PATTERNS
- Do not label planned campaign or tactical features as shipped merely because design pages exist; even Home's implementation summary may lag code.
- No direct push to main, force-push, or shared-history rewrite. ADR-001 requires a dedicated branch and PR, with owner-only merging.
- Authorized origin: `https://github.com/islee23520/seoul-kenshi.git`; the unrelated shooter repository is not a delivery target. Do not publish or maintain GitHub Wiki.
- Do not deploy to Vercel — the existing `seoul-kenshi` project is paused (2026-09-19 owner directive). All deployments go to the self-hosted hub at `seoul-dengoku.linalab.io` (see `SERVICES.md`); nested static pages ride that hub as subpaths, never as their own site. `GAME-REFERENCE/codex-ux-refs/` must never be hub-published (legacy `서울켄시` marker baked into its PNGs). `SOCIAL-MEDIA/` is operator serial only — never a hub subpath, never VitePress `ROOT_DOCS`.
- Candidate generation, provider eligibility, or showcase import does not authorize a runtime dependency.
- Guessed rights, synthetic review hashes, model/software licenses, and zero-cost receipts are not proof of asset-output rights or actual service terms.
- Do not silently recover unsupported/corrupt saves: the documented save contract requires explicit errors.
- Do not substitute a backend when TRELLIS is unavailable; its designated execution host is separate from this macOS checkout.
- Unity execution is batchmode-only in a background session, one Editor per `GAME` path: no GUI, Test Runner, manual Play or unicli. Author serialized assets with Unity APIs/SerializedObject, not hand-edited YAML.
- Do not invent undecided numbers or content, and do not treat design pages as shipped implementation. The layered full-3D/unit-command target is an active implementation authority for the approved plan, not a claim that it is already shipped. Oddland assets remain preserved and are not combatants for the new target; existing Unity/POC surfaces remain historical until the target is implemented and proven.

## 텍스트 정합성 우선과 웹 검증 범위

- 이 저장소의 텍스트 변경은 문서·규칙·파생물 사이의 논리 정합성을 최우선으로 검증한다.
- 웹사이트의 멀티 플랫폼 지원 기능(반응형·모바일, 브라우저·운영체제별 대응)은 구현하거나 테스트하지 않는다.
- 웹 문서 산출물은 대표 데스크톱 표면에서 내용, 핵심 상호작용과 가독성만 확인한다. 플랫폼별 지원을 완료 조건이나 증거로 삼지 않는다.
- 플랫폼별 구현·QA 때문에 정본 문구나 게임 규칙 개정을 늦추거나 범위를 넓히지 않는다.

- After the unanswered camera/pause questions timed out, the adopted design defaults are a 3D free-command camera (pan/orbit/zoom, no invented angles/FOV) and orders while paused inside this party-closed battle only. Do not treat those defaults as owner-explicit decisions. Do not pause the shared campaign world or other parties. Do not add slow/speed/queue. Top-down battle schematics are documentation blueprints, not rendered game captures.
- Do not turn region surface adjacency into movement edges, merge same-name facilities, or advance later narrative events to opening day. Geometry-only validation is intermediate.
- Do not author the deliberately unwritten LORE projections (M007, B017, B020): the `미저작` exclusion gate (`confirmed-integration-manifest.json`) rejects merges with `E_EXCLUDED_ID`.
- Do not hand-edit generated layers: LORE root projections (except `World-Narrative-Atlas.md`), `GDD/design-store/`, `WEB/wiki-source` mirrors, `store/` captures.
- Pre-review artifacts (`LORE/name-pools/roster-100.json` (CC BY 4.0, NVIDIA attribution duty), `cast-backfill-draft.*`) never enter cast canon without human review.
- On the remote Windows ComfyUI host, do not bypass PNGAL's loopback-only policy (`--listen`/netsh portproxy) or add watchdog/auto-restart machinery. Tailnet access uses `tailscale serve`, and service start/stop stays manual.

## UNIQUE STYLES
- The strategy screen is a 3D heightmap map of all Seoul with a perspective free-pan/zoom camera (Intent decision 10, 2026-09-18). Target combat is unit/formation command (decision 11, 2026-09-19). The current battle screen's left/right side-scroll is POC presentation. The target battle camera is a 3D free-command default adopted after the unanswered question timed out, not an owner-explicit decision.
- The serialized Unity genre contract still records `combatResolution: realtime-formation-card` as the current historical POC; it is not the target authority. The active target is full-3D unit command with separate heroes and soldiers, a surface plus real-subway layered strategy map, uGUI in 16:9, and Unity PlayerLoop/`FixedUpdate` timing using the project's `Time.fixedDeltaTime` without a fixed-rate lock. Target combat is not card economy or direct hero action. Isometric angles, four-direction grid, tile, and SD silhouette keys are retired (`GenreContractTests` enforces absence).
- Enabled scene order is Bootstrap -> MainTitle -> Foundation; Bootstrap owns app DI and content screens use exclusive child scopes.
- Runtime screens use uGUI builders/presenters; retained UXML/USS is not automatically the current surface. Data projects ScriptableObjects into validated Core catalogs and canonical fingerprints.
- Distinguish the 334-station movement graph, Area 1 three-station content catalog and 427-dong authored atlas. `GAME-REFERENCE/poc-diegetic/DIRECTION.md` is a candidate, not an approved UI mandate.
- Runtime art promotion crosses Node provenance checks and Unity import, with separate prepare and post-import commit stages.
- Capture evidence binds images to git HEAD and the dirty-source fingerprint; `.omo/` output is excluded from that fingerprint.
- LORE entity IDs are permanent, never renumbered: `K001–K412`, `S01–S16`, `HC/HP/XT`, `G01–G27`, `GxxEyy`, `Mxxx`, `Bxxx`; LORE root projections carry `원본 앵커` + `원본 해시` provenance headers.
- LORE prose contract: Korean 3rd-person 한다체 narrative / 합니다체 guidance, one cause-effect per paragraph; no real company names/logos/executives in fiction; synthetics are never omniscient, infinite-memory, or fully networked.

## REMOTE COMFYUI HOST
- Host: `desktop-bo514et` (`100.77.98.25`), SSH alias `windows`, non-admin `oliver` account.
- ComfyUI 0.28.0 lives at `E:\git\linalab\PNGAL\environment\ComfyUI-pngal-0.28.0` and must bind `127.0.0.1:8188`.
- Tailnet exposure is the persisted Tailscale TCP serve rule `tailscale serve --bg --tcp=8188 tcp://127.0.0.1:8188`; use `http://100.77.98.25:8188/` or `http://desktop-bo514et.tailaa2378.ts.net:8188/`.
- Start manually with `ssh windows 'cd /e/git/linalab/PNGAL && MSYS2_ARG_CONV_EXCL="*" PNGAL_START_NONINTERACTIVE=1 cmd.exe /d /c start.bat'`. If a stale startup state blocks it, run `stop.bat` before a fresh start; never stop a healthy instance.
- Saved workflows are opened from ComfyUI's workflow library, not origin-bound browser hash links. Current server-side workflows are `portrait-dualtarget-seethrough-node.json` and the superseded `portrait-civitai-target-reference-seethrough.json`.

## COMMANDS
Run from the repository root. Unity launch, test and capture commands belong to `GAME/AGENTS.md` and `TOOL/docs/Unity-Headless-Workflow.md`; WebGL builds run via `FoundationProjectBuilder.BuildWebGlPlayer` (menu `Janseon/Build WebGL Player`).
```bash
npm ci --prefix TOOL/tools
npm --prefix TOOL/tools test
node TOOL/tools/policy/check-repo-delivery-policy.mjs
npm --prefix WEB/wiki-source run docs:dev
npm --prefix WEB/wiki-source run docs:build
node WEB/wiki-source/scripts/mount.mjs
node WEB/wiki-source/scripts/gate.mjs
node TOOL/tools/design-store/seed-from-canon.mjs
dotnet test Backend/server/Coordinator.Tests -c Debug
dotnet run --project Backend/server/Coordinator/SeoulKenshi.Coordinator.csproj -c Debug --no-launch-profile
```

## NOTES
- `npm --prefix TOOL/tools test` runs policy name normalization + wiki build test + Unity architecture-doc test; architecture behavior, art, capture, atlas, regions and store have separate gates.
- Region atlas verify currently fails on every region: all 427 `canon_refs` in `LORE/regions/content/*.json` still point at pre-reorg `docs/game-logic/…` paths; rewrite to `LORE/…` to restore. `LORE/regions/README.md` command block and two of its links are stale the same way.
- Atlas rebuild needs the sibling bundle `../seoul-kenshi-data/seoul-geography-20260830` (outside the repo).
- Inbound stale links: `GDD/Online-User-Journey.md`, `GDD/Home.md` and `WEB/wiki-source/**` mirrors still link pre-reorg `../LORE/Sixteen-States.md` / `../LORE/Scenario-Timeline.md` (now `LORE/factions/`, `LORE/chronology/`). Markdown has no redirects — fix the outbound paths.
- Root `README.md` now names `https://seoul-dengoku.linalab.io/play/` as the public web POC and keeps the old Vercel URL as the pending-removal address. `.omo/README.md` still names Vercel as public docs (predates the 2026-09-18 hub switch).
- `TOOL/tools/design-store` `openSchema` DROPs all tables when `user_version < 3` — wipe, not migration.
- Backend is the ASP.NET Core coordinator on :1219 with no external stores (ADR-006).
- The macOS development-player builder does not enable AllowDebugging.
- TRELLIS targets a Windows RTX 4080 direct-Python host; local `probeHost()` reports it unavailable.
- Capture validation requires ten state/resolution PNGs plus matching receipts; image dimensions alone do not establish valid evidence.
- The Wiki public-term gate checks visible rendered content, not raw Markdown alone; it is not a source-wide naming ban.
- The whole `.omo/` directory is git-ignored since 2026-09-19 (owner directive: always untracked, previously tracked files removed from the index); `.omo/AGENTS.md` ships local-only.
- This root guide synthesizes writer digests and retained root guidance. Commands listed here were not executed as part of writing it.
