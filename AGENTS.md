# PROJECT KNOWLEDGE BASE

**Generated:** 2026-09-05
**Commit:** cd0ddb5
**Branch:** main

## OVERVIEW
Character-centered grand-strategy SRPG set in post-collapse Seoul's subway network. Unity 6000.7.0a5 runs the game; repository-only Node/Python tooling validates architecture, documentation, asset provenance, and capture evidence.

## STRUCTURE
```text
seoul-kenshi/
|-- Concept.md, Intent.md, Design.md, ToDo.md, README.md, AGENTS.md, SERVICES.md  # root guidance keepers
|-- Game/                  # Unity project root + moved play/ POC; guidance in Game/AGENTS.md
|   |-- play/
|   |-- Assets/Janseon/    # Core, Foundation, runtime art
|   |-- Assets/Tests/      # EditMode & PlayMode validation
|   `-- ProjectSettings/
|-- GDD/                   # consolidated design & delivery docs (adr, proposals, system-design, design-store)
|   |-- adr/
|   |-- proposals/
|   |-- system-design/
|   `-- design-store/
|-- Wikis/                 # wiki corpus and wiki site
|   |-- game-logic/        # authoritative corpus, name-pools, regions
|   `-- site/              # VitePress build
|-- Design/                # visual moodboards, prototypes, moved portrait-demo
|   |-- ui-layout-moodboard/
|   |-- poc/
|   |-- poc-diegetic/
|   |-- poc-plan/
|   `-- portrait-demo/
|-- Research/              # canon reference and verification artifacts
|   |-- canon-reference/
|   `-- verification/
|-- Reference/             # asset BOMs and UX references
|   |-- assets/
|   `-- ui-ux-refs/
|-- Tool/                  # tooling, skills, submodules (character-forge, unity-remote), moved Unity docs
|   |-- skills/
|   |-- character-forge/
|   |-- unity-remote/
|   `-- docs/
`-- .omo/evidence/         # generated capture images and receipts (never edit)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Design entry and navigation | `Wikis/game-logic/Home.md`, `_Sidebar.md` | Separate design intent from implementation status |
| Architecture and rollout | `Wikis/game-logic/Unity-Architecture.md`, `GDD/system-design/Unity-System-Design.md`, `Wikis/game-logic/Unity-Architecture-Implementation-Plan.md` | Responsibilities, contracts, implementation sequence |
| Save and randomness contracts | `Wikis/game-logic/Save-and-Determinism.md` | Versioning, event records, separated RNG streams |
| Cast corpus | `Wikis/game-logic/Cast-Index.md`, `Wikis/game-logic/Cast-Relations.md`, `Wikis/game-logic/Cast-State-01.md` through `Wikis/game-logic/Cast-State-16.md` | Sixteen-state organization |
| Unity setup and scene flow | `Game/AGENTS.md` | Pinned editor, genre contract, engine entry points |
| Domain and runtime integration | `Game/Assets/Janseon/AGENTS.md` | Core/Foundation boundary and art import seams |
| Unity tests and captures | `Game/Assets/Tests/AGENTS.md` | Test-mode ownership and evidence receipts |
| Tooling and checks | `Tool/AGENTS.md` | Explicit gates beyond the package test command |
| Asset processing | `Wikis/game-logic/Asset-Pipeline.md`, `Tool/art/AGENTS.md` | Design contract versus executable promotion checks |
| Asset rights and reviews | `Reference/assets/bom/` | Source evidence, runtime-slot records, quality gates |
| Delivery and publishing | `GDD/adr/ADR-001-repository-delivery-policy.md` | Accepted authority over historical local-only clauses |
| Web hub deploy | `SERVICES.md`, `index.html`, `vercel.json` | User-facing URL is always `https://seoul-kenshi.vercel.app`. Vercel project is only `seoul-kenshi` (`prj_KOgAaJkJZ7j3CrUD1eAzYtiGV5mm`, scope `makcha1`). |

## CODE MAP
Digest-observed declarations/imports only; LSP and ast-grep were unavailable. Reference centrality is unmeasured, not zero.

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `CoreApi`, `PurposeRng` | API / RNG | `Game/Assets/Janseon/Core/DeterministicCore.cs` | Unmeasured | Deterministic domain entry and random streams |
| `RouteApi`, `CampaignApi`, `BattleApi`, `SettlementApi` | Domain APIs | `Game/Assets/Janseon/Core/` | Unmeasured | Route, campaign, battle and settlement domains |
| `ApplicationFlowCoordinator` | Coordinator | `Game/Assets/Janseon/Foundation/AppFlow/` | Unmeasured | Application screen flow |
| `PocCoreLoopController` | Controller | `Game/Assets/Janseon/Foundation/UI/` | Unmeasured | Proof-of-concept core-loop UI |
| `RuntimeSlotCatalog` | Catalog | `Game/Assets/Janseon/Foundation/Art/` | Unmeasured | Runtime asset slots |
| `buildWiki`, `assertSafeOutputRoot` | Functions | `Tool/wiki/` | Unmeasured | Wiki generation and output cleanup boundary |
| `auditRuntimeProvenance`, `evaluatePromotedAsset` | Functions | `Tool/art/` | Unmeasured | Source-bound asset eligibility checks |

## CONVENTIONS
- The Unity project root is `Game/`, not the repository root. Its editor pin is an alpha release, not a generic Unity LTS target.
- `Janseon.Core` is engine-free; Foundation integrates Core with Unity and VContainer.
- Repository documentation is authoritative; the remote Wiki is a generated, drift-checked derivative.
- Design pages use Korean prose, English hyphenated filenames, ordinary relative Markdown links, and GitHub image URLs with `?raw=true`; do not assume Obsidian wiki links.
- Tooling uses a separate private Node >=20 ESM package under `Tool/`; it is not game runtime code.

## ANTI-PATTERNS
- Do not label planned campaign or tactical features as shipped merely because design pages exist; even Home's implementation summary may lag code.
- No direct push to main, force-push, or shared-history rewrite. ADR-001 requires a dedicated branch and PR, with owner-only merging.
- Authorized origin: `https://github.com/islee23520/seoul-kenshi.git`; the unrelated shooter repository is not a delivery target. Remote Wiki publication needs separate owner authorization.
- Do not create a new Vercel project, alias, or `*.vercel.app` site for demos or worktree folders. Link and deploy only to existing `seoul-kenshi`. Nested static pages (for example `Design/portrait-demo/`) go on that hub as a subpath via the composite staging in `SERVICES.md`; never `vercel deploy` a nested folder as its own project.
- Candidate generation, provider eligibility, or showcase import does not authorize a runtime dependency.
- Guessed rights, synthetic review hashes, model/software licenses, and zero-cost receipts are not proof of asset-output rights or actual service terms. Source-rights research is not quality approval or a legal guarantee.
- Do not silently recover unsupported/corrupt saves: the documented save contract requires explicit errors.
- Do not substitute a backend when TRELLIS is unavailable; its designated execution host is separate from this macOS checkout.

## UNIQUE STYLES
- Exploration and combat share four-direction tile movement under a fixed orthographic isometric camera.
- The serialized genre contract binds camera angles 45/35.264, a 1.5-unit grid, and a 2.5-head silhouette.
- Enabled scene order is Bootstrap -> MainTitle -> Foundation; Bootstrap owns app DI and content screens use exclusive child scopes.
- Runtime art promotion crosses Node provenance checks and Unity import, with separate prepare and post-import commit stages.
- Capture evidence binds images to git HEAD and the dirty-source fingerprint; `.omo/` output is excluded from that fingerprint.

## COMMANDS
Run from the repository root. Set `UNITY_EDITOR` to the executable for Unity 6000.7.0a5.
```bash
npm ci --prefix Tool
npm --prefix Tool test
node Tool/policy/check-repo-delivery-policy.mjs
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" -runTests -testPlatform EditMode
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" -runTests -testPlatform PlayMode
"$UNITY_EDITOR" -batchmode -quit -projectPath "$PWD/Game" -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.BuildStandaloneOsxDevelopmentPlayer
```

## NOTES
- `npm --prefix Tool test` covers wiki generation and Unity architecture-document tests only; it is not the complete repository validation suite. Consult Tool guidance for explicit gates.
- Unity promotion/wiring requires batchmode and Node on PATH. The macOS development-player builder does not enable AllowDebugging.
- TRELLIS targets a Windows RTX 4080 direct-Python host; local `probeHost()` reports it unavailable.
- Capture validation requires ten state/resolution PNGs plus matching receipts; image dimensions alone do not establish valid evidence.
- The Wiki public-term gate checks visible rendered content, not raw Markdown alone; it is not a source-wide naming ban.
- This root guide synthesizes writer digests. Commands and build/test entry points were inspected by those writers, not executed as part of this documentation generation.
