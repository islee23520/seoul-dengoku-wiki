# RESEARCH KNOWLEDGE BASE

## OVERVIEW
Reference-game mechanics encyclopedia plus verification gate records; score 8 — distinct domain (citation-tiered corpus with its own machine-consumed verification policy).

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Encyclopedia entry and template | `canon-reference/MASTER-PLAN.md` | 9-section per-game template; 20 game dossiers |
| Cross-game synthesis | `canon-reference/CROSS-GAME-SYNTHESIS.md` | Comparisons across the corpus |
| Per-game dossiers | `canon-reference/<game>.md` | kenshi, battle-brothers, crusader-kings-3, bannerlord, fire-emblem-fft, into-the-breach, farland-wog-triangle, nobunagas-ambition, unicorn-overlord, xcom-2, romance-of-three-kingdoms, songs-of-silence, taikou-risshiden, ravelen-chronicles, darkest-dungeon, open-source-games-mechanisms, Reference-Game-Mechanisms |
| Source ledger | `canon-reference/jaepyo-iyen-source-ledger.md` | Which claims trace to which sources |
| Verification policy | `verification/verification-policy-notes.md` | What may be pinned and what evidence keeps |
| Gate outputs | `verification/gate-outputs.txt`, `verification/final-verification-evidence.json` | Named gates with PASS lines |
| Term policy | `verification/banned-term-replacements.json`, `creative-name-normalization.json` | Machine-consumed old→new term maps |
| Archived verification runs | `verification/<topic>/` | hangnyeol, keyart-faiths-seoul, poc-qa-2026-09-05, portrait-anime-layer-composite, ulw-execute, worktree-cleanup, world-lost-robots-20260910 |
| Building datasets | `vworld_nsdi_3d_building_datasets.md` | VWorld/NSDI 3D building data notes |
| Formula-level sources | `canon-reference/open-source-games-mechanisms.md` | OpenXcom/OpenPanzer breakdowns; densest combat-math reference |

## CONVENTIONS
- Claims are tiered `[문서]` (source-verified) / `[추론]` (deduced) / `[미확인]` (unverified); each dossier states its version/date/source boundaries explicitly.
- Dossiers are Korean prose with numbered sections (`## 1. 개요` …) and version-comparison tables; several close with a `잔선 적용` (remnant application) section tying mechanics to this project.
- Verification pins only machine-consumed values (pixels, texture sizes, path segments, importer states, contract JSON fields); verdict records keep hash, verdict, baseline ID, repro command — nothing else.

## ANTI-PATTERNS
- Do not carry a mechanic, resource name (MP/TP/SOUL), or number from one game to another because names collide; each dossier's boundaries hold.
- Do not treat community wiki content as official implementation docs, and do not default missing values to common RPG numbers.
- Do not pin prose or Korean phrasing tokens in verification, and do not re-display rejected images or failed visual outputs.
- Do not edit archived verification runs; new evidence goes in a new dated directory.

## COMMANDS
None — a pure prose corpus; no build or test surface exists in this tree.
