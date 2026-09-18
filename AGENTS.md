# PROJECT KNOWLEDGE BASE

**Generated:** 2026-09-14
**Commit:** f0c36e5
**Branch:** main

## OVERVIEW
Character-centered grand-strategy SRPG set in post-collapse Seoul's subway network. Unity 6000.7.0a5 runs the game; Node/Python tooling validates documentation, architecture, assets and captures, while Backend hosts a .NET 8 CoreWCF service.

## STRUCTURE
```text
seoul-kenshi/
|-- Concept.md, Intent.md, Design.md, ToDo.md, README.md, AGENTS.md, SERVICES.md  # root guidance keepers
|-- GAME/                  # Unity project root + moved play/ POC; guidance in GAME/AGENTS.md
|   |-- play/
|   |-- Assets/Janseon/    # Core, Foundation, runtime art
|   |-- Assets/Tests/      # EditMode & PlayMode validation
|   `-- ProjectSettings/
|-- GDD/                   # studio design docs (adr, proposals, system-design, design-store) + published design pages
|   |-- adr/
|   |-- proposals/
|   |-- system-design/
|   `-- design-store/
|-- LORE/                  # world corpus: cast, regions, name-pools, hostile groups, story batches
|   |-- name-pools/
|   `-- regions/
|-- GAME-LOGIC/            # rules/systems corpus + VitePress site (publishing surface)
|   `-- site/              # design/world/rules staging + .vitepress + scripts
|-- GAME-REFERENCE/        # asset BOMs, UX references, moodboards, prototypes, geography data
|   |-- assets/
|   |-- ui-ux-refs/
|   |-- data/
|   `-- poc/, ui-layout-moodboard/, poc-plan/, poc-diegetic/, portrait-demo/, codex-ux-refs/
|-- RESEARCH/              # canon reference and verification artifacts
|   |-- canon-reference/
|   `-- verification/
|-- TOOL/                  # tooling, skills, submodules (character-forge, unity-remote), Unity docs
|   |-- skills/
|   |-- character-forge/
|   |-- unity-remote/      # git submodule
|   |-- docs/
|   `-- tools/             # repository Node package; distinct from tool submodules
|-- Backend/               # active CoreWCF service, tests and Docker infrastructure
`-- .omo/evidence/         # generated capture images and receipts (never edit)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Design entry and navigation | `GDD/Home.md`, `_Sidebar.md` | Separate design intent from implementation status |
| Architecture and rollout | `GAME-LOGIC/Unity-Architecture.md`, `GDD/system-design/Unity-System-Design.md`, `GAME-LOGIC/Unity-Architecture-Implementation-Plan.md` | Responsibilities, contracts, implementation sequence |
| Save and randomness contracts | `GAME-LOGIC/Save-and-Determinism.md` | Versioning, event records, separated RNG streams |
| Cast corpus | `LORE/characters/Cast-Index.md`, `LORE/characters/Cast-Relations.md`, `LORE/characters/Cast-State-01.md` through `LORE/characters/Cast-State-16.md` | Sixteen-state organization |
| Unity setup and quality gateway | `GAME/AGENTS.md` | Pinned editor, batchmode contract, work procedure, regressions and done-means |
| Domain and runtime integration | `GAME/Assets/Janseon/AGENTS.md` | Core/Foundation boundaries and art import seams |
| Unity tests and captures | `GAME/Assets/Tests/AGENTS.md` | Test-mode ownership and evidence receipts |
| Tooling and checks | `TOOL/AGENTS.md`, `TOOL/tools/AGENTS.md` | Repo scripts versus independent submodule packages; separate domain gates |
| Asset processing | `GDD/Asset-Pipeline.md`, `TOOL/tools/art/AGENTS.md` | Design contract versus executable promotion checks |
| Wiki rendering | `TOOL/tools/wiki/AGENTS.md`, `GAME-LOGIC/site/` | Safe public output; VitePress mounting/staging is separate from build |
| Browser comparison reference | `GAME-REFERENCE/poc/browser/AGENTS.md` | Frozen four-surface prototype, not the product runtime |
| Backend service | `Backend/AGENTS.md`, `Backend/server/GameServer/Program.cs` | Front/Auth/Hero/Lobby/Station/Social endpoints; HTTP 1219 |
| Asset rights and reviews | `GAME-REFERENCE/assets/bom/` | Source evidence, runtime-slot records, quality gates |
| Delivery and publishing | `GDD/adr/ADR-001-repository-delivery-policy.md` | Accepted authority over historical local-only clauses |
| Web hub deploy | `SERVICES.md`, `index.html`, `vercel.json` | User-facing URL is always `https://seoul-kenshi.vercel.app`. Vercel project is only `seoul-kenshi` (`prj_KOgAaJkJZ7j3CrUD1eAzYtiGV5mm`, scope `makcha1`). |

## CODE MAP
Digest LSP/ast-grep findings plus retained root symbol locations; C# LSP coverage was partial. Repo-wide reference centrality is unmeasured, not zero.

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `CoreApi`, `PurposeRng` | API / RNG | `GAME/Assets/Janseon/Core/DeterministicCore.cs` | Unmeasured | Deterministic domain entry and random streams |
| `RouteApi`, `CampaignApi`, `BattleApi`, `SettlementApi` | Domain APIs | `GAME/Assets/Janseon/Core/` | Unmeasured | Route, campaign, battle and settlement domains |
| `ApplicationFlowCoordinator` | Coordinator | `GAME/Assets/Janseon/Foundation/AppFlow/` | Unmeasured | Application screen flow |
| `PocCoreLoopController` | Controller | `GAME/Assets/Janseon/Foundation/UI/` | Unmeasured | Proof-of-concept core-loop UI |
| `RuntimeSlotCatalog` | Catalog | `GAME/Assets/Janseon/Foundation/Art/` | Unmeasured | Runtime asset slots |
| `buildWiki`, `assertSafeOutputRoot` | Functions | `TOOL/tools/wiki/` | Unmeasured | Wiki generation and output cleanup boundary |
| `auditRuntimeProvenance`, `evaluatePromotedAsset` | Functions | `TOOL/tools/art/` | Unmeasured | Source-bound asset eligibility checks |
| `UguiHudBuilder` | Builder | `GAME/Assets/Janseon/Foundation/` | Unmeasured | Current uGUI screen construction |
| `createSquadBattleState` | Function | `GAME-REFERENCE/poc/browser/` | 5 (limited JS scope) | Shared browser battle model |

## CONVENTIONS
- The Unity project root is `GAME/`, not the repository root. Its editor pin is an alpha release, not a generic Unity LTS target.
- `Janseon.Core` is engine-free; Foundation integrates Core with Unity and VContainer.
- Repository documentation is authoritative. Serve `GAME-LOGIC/site` locally (`npm run docs:dev`) and publish `https://seoul-kenshi.vercel.app`; the remote Wiki, VitePress publication and HTML mirrors are derivatives, not additional canon.
- Design pages use Korean prose, English hyphenated filenames, ordinary relative Markdown links, and GitHub image URLs with `?raw=true`; do not assume Obsidian wiki links. Canonical page names use Title-Case-With-Hyphens; new-page `_TEMPLATE.md` uses YAML title/summary/domain (design/world/rules), and existing Home has no frontmatter.
- Repo automation is the private ESM package `TOOL/tools`; `TOOL/character-forge` and `TOOL/unity-remote` are independently versioned Git submodules. VitePress requires Node >=22 <27. This package is not game runtime code.

## ANTI-PATTERNS
- Do not label planned campaign or tactical features as shipped merely because design pages exist; even Home's implementation summary may lag code.
- No direct push to main, force-push, or shared-history rewrite. ADR-001 requires a dedicated branch and PR, with owner-only merging.
- Authorized origin: `https://github.com/islee23520/seoul-kenshi.git`; the unrelated shooter repository is not a delivery target. Do not publish or maintain GitHub Wiki.
- Do not create a new Vercel project, alias, or `*.vercel.app` site for demos or worktree folders. Link and deploy only to existing `seoul-kenshi`. Nested static pages (for example `GAME-REFERENCE/portrait-demo/`) go on that hub as a subpath via the composite staging in `SERVICES.md`; never `vercel deploy` a nested folder as its own project.
- Candidate generation, provider eligibility, or showcase import does not authorize a runtime dependency.
- Guessed rights, synthetic review hashes, model/software licenses, and zero-cost receipts are not proof of asset-output rights or actual service terms. Source-rights research is not quality approval or a legal guarantee.
- Do not silently recover unsupported/corrupt saves: the documented save contract requires explicit errors.
- Do not substitute a backend when TRELLIS is unavailable; its designated execution host is separate from this macOS checkout.
- Unity execution is batchmode-only in a background session, one Editor per `GAME` path: no GUI, Test Runner, manual Play or unicli. Author serialized assets with Unity APIs/SerializedObject, not hand-edited YAML.
- Do not invent undecided numbers or content, and do not treat design pages as shipped implementation.
- Do not turn region surface adjacency into movement edges, merge same-name facilities, or advance later narrative events to opening day. Geometry-only validation is intermediate.

## UNIQUE STYLES
- The strategy screen is a 3D heightmap map of all Seoul; the battle screen is a left/right side-scroll view (Intent decision 10, 2026-09-18).
- The serialized genre contract keeps `combatResolution: realtime-formation-card`; isometric angles, four-direction grid, tile, and SD silhouette keys are retired.
- Enabled scene order is Bootstrap -> MainTitle -> Foundation; Bootstrap owns app DI and content screens use exclusive child scopes.
- Runtime screens use uGUI builders/presenters; retained UXML/USS is not automatically the current surface. Data projects ScriptableObjects into validated Core catalogs and canonical fingerprints.
- Distinguish the 334-station movement graph, Area 1 three-station content catalog and 427-dong authored atlas. `GAME-REFERENCE/poc-diegetic/DIRECTION.md` is a candidate, not an approved UI mandate.
- Runtime art promotion crosses Node provenance checks and Unity import, with separate prepare and post-import commit stages.
- Capture evidence binds images to git HEAD and the dirty-source fingerprint; `.omo/` output is excluded from that fingerprint.

## COMMANDS
Run from the repository root. Unity launch, test and capture commands belong to `GAME/AGENTS.md` and `TOOL/docs/Unity-Headless-Workflow.md` (pinned editor, background execution, serialized runs).
```bash
npm ci --prefix TOOL/tools
npm --prefix TOOL/tools test
node TOOL/tools/policy/check-repo-delivery-policy.mjs
npm --prefix GAME-LOGIC/site run docs:dev
npm --prefix GAME-LOGIC/site run docs:build
dotnet build Backend/server/SeoulKenshi.Server.sln -c Debug
dotnet test Backend/server/Tests/SeoulKenshi.Server.Tests.csproj -c Debug
dotnet run --project Backend/server/GameServer/GameServer.csproj -c Debug --no-launch-profile
(cd Backend/docker && docker compose up -d)
```

## NOTES
- `npm --prefix TOOL/tools test` covers wiki build and architecture-document tests only. Architecture behavior, art, capture, policy, atlas, regions and store have separate gates.
- The former `Game`→`GAME` migration defects (manifest `file:` ref, RuntimeSlot spawn paths) were fixed in the 2026-09-18 domain restructure; Unity validation still requires batchmode evidence.
- Backend Docker exposes MySQL 13306 and Redis 16379; Debug output is `Backend/bin/Local`. Historical template docs are not current service authority.
- Unity promotion/wiring requires batchmode and Node on PATH. The macOS development-player builder does not enable AllowDebugging.
- TRELLIS targets a Windows RTX 4080 direct-Python host; local `probeHost()` reports it unavailable.
- Capture validation requires ten state/resolution PNGs plus matching receipts; image dimensions alone do not establish valid evidence.
- The Wiki public-term gate checks visible rendered content, not raw Markdown alone; it is not a source-wide naming ban.
- This root guide synthesizes writer digests and retained root guidance. Commands listed here were not executed as part of writing it.
