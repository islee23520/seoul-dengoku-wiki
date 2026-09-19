# GAME-LOGIC KNOWLEDGE BASE

## OVERVIEW
Canonical hand-authored game-rules corpus — 30 Markdown files, ~8.9k lines: system contracts, 16 external-game reference encyclopedias + index, and wiki chrome. Score ~13: highest documentation centrality in the repo.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Expedition core loop | `Campaign-Loop.md` | Five outcomes: return/settle/conquer/wander/trade |
| Realtime battle contract | `Realtime-Formation-Card-Battle.md` | Formation-card rules, cooldowns, HP aggregation |
| Campaign tension/crisis math | `Campaign-Progression.md` | Weighted metrics, crisis probability, edge cases |
| Travel, encounters, sieges | `Travel-and-Encounters.md`, `Warfare-and-Sieges.md` | |
| Strategy-battle roundtrip | `Strategy-Battle-Roundtrip.md` | One battle ends in one ResultId |
| Save/determinism contract | `Save-and-Determinism.md` | Event ledger, per-purpose RNG streams, checksummed saves |
| Unity contract trio | `Unity-Architecture.md`, `Unity-System-Design.md`, `Unity-Architecture-Implementation-Plan.md` | All three live HERE — not under `GDD/system-design/` |
| Cross-game mechanism hub | `Ref-Mechanism-Index.md` | Maps every Ref-* to mechanisms, adoption status, open questions |
| One game's encyclopedia | `Ref-<Game>.md` (16) | FE/FFT, K-System, Bannerlord, CK3, XCOM 2, Nobunaga, ROTK, … |
| Art direction locks | `Character-Art-Direction.md` | Dated intent decisions; tactical-sheet crop marked transitional 2026-09-12 |
| Wiki chrome | `_Sidebar.md`, `_TEMPLATE.md` | Nav + page template; excluded from site staging |

## CONVENTIONS
- Ref-* files are append-only reference databases with fixed sections (개요/코어 루프/진행 구조/경제/캐릭터/전투) and a `> [!NOTE]` provenance header.
- Every claim is tagged: **[문서]** sourced fact, **[추론]** derived reasoning, **[미확인]** unverified. A tag above a table applies to the whole table; exceptions are marked per cell.
- Source IDs (`S-*`, `[REF:*]`) trace to investigation packets; adoption into the design is recorded as 잔선 채택 notes with reasons.
- Ref docs are sanitized derivatives of internal investigation docs — forbidden product terms are replaced for public release (e.g. `Ref-K-System.md` names no real product). Keep sanitization when editing.
- Edition/patch boundaries are part of each fact; author links relative to this directory (`../LORE/...`) — site mounting rewrites them.

## ANTI-PATTERNS
- Never carry numbers or rules across games or editions (FE phases ≠ FFT CT; per-edition Nobunaga/ROTK differ).
- Never fill [미확인] with speculation or generic RPG defaults; never treat community wikis as verified implementation.
- Do not edit the derivatives: `site/rules/*.md` mirrors and `GDD/design-store/canon/` renders regenerate from these files.

## NOTES
- Publication and render layers have their own guides: `site/AGENTS.md` (VitePress staging) and `GDD/design-store/AGENTS.md` (generated store).
