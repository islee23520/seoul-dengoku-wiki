# GAME-REFERENCE KNOWLEDGE BASE

## OVERVIEW
Frozen reference material for art, UX, and Seoul geography; score 10 (626 files, 9 subdomains, BOM schema, browser POC exports) — distinct reference domain. Nothing here is Unity runtime code; promotion into `GAME/Assets/` crosses `TOOL/tools/art` provenance gates.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Asset provenance BOMs | `assets/bom/` | `schema_version`/`asset_id`/`unity_import_settings`/generation prompts/hashes per asset; `characters/`, `props/` (+ `props/reviews/station-props/` verdicts), `ui/`, `tiles/`, `fonts/`, `title/`, `runtime/`, `poc-ui-station-kit.bom.json` |
| Donor asset chain | `assets/bom/donor/` | Oddland catalog + donor-import JSON with sidecar SHA-256 |
| System diagrams | `assets/wiki/` | ~20 isometric SVGs (battle roundtrip, economy, subway layers, world atlas) + cover PNG + `portraits/` |
| UX reference imagery | `codex-ux-refs/` | Codex-thread copies under Git LFS; `README.md` records thread id, source commit, per-file SHA-256 |
| Seoul geography bundle | `data/seoul-geography-20260830/` | `acquire.py`/`build_manifest.py`/`manifest.json`/`licenses/`; OSM + PMTiles tiles |
| Frozen browser POC | `poc/browser/` | Own AGENTS.md; four review surfaces + `SHA256SUMS` baseline |
| Diegetic UI candidate | `poc-diegetic/` | `DIRECTION.md`, `LAYOUT-DESIGN.md`, `battle-hud/` anchor capture |
| Full-plan mockup | `poc-plan/index.html` | One large static HTML |
| Portrait layer composite | `portrait-demo/` | Static page; hub subpath per `SERVICES.md` |
| UI layout moodboard | `ui-layout-moodboard/` | `index.html`/`preview.html` + `screenshots/` QA captures; hub subpath |
| UX flow references | `ui-ux-refs/` | Screen-flow diagram + `poc-complete.html`; hub subpath |

## CONVENTIONS
- BOM JSONs carry reviewer/handoff fields (e.g. `todo13-art-lead`, `Todo 16 handoff`) and repeat the direction rule "Do not mirror equipment."
- PNGs in `codex-ux-refs/` ride Git LFS (`.gitattributes`); copies match the original thread outputs byte-for-byte.
- `_acquisition-*`, `*-monitor.out`, `*-pid`, `*-exit-code` files in `data/` are acquisition-session residue, not deliverables.

## ANTI-PATTERNS
- Do not edit frozen reference copies (`codex-ux-refs/`, `poc/browser/`): provenance is byte/SUMS-based; a change is a new, re-hashed capture.
- Do not register `codex-ux-refs/` imagery on the public hub; only the `SERVICES.md` overlays (`ui-layout-moodboard/`, `portrait-demo/`, `ui-ux-refs/`) stage there.
- Do not quote the legacy marker `서울켄시` baked into codex concept PNGs as public wiki text.
- Do not promote anything from here straight into runtime; reference BOMs and UX captures are not approved runtime art.

## COMMANDS
Browser POC test/serve commands live in `poc/browser/AGENTS.md`. Geography data rebuilds via `acquire.py`/`build_manifest.py` inside `data/seoul-geography-20260830/`; no other build surface exists in this tree.
