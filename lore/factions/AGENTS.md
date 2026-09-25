# LORE/factions — polity canon: the sixteen states and their edges

Earned its file: score ~8 (S01–S16 ids are verifier-enforced in region content; `Sixteen-States.md` is the target of all 427 canon_refs and self-declares 정본 in its InfoBox; org numbers keyed HC/HP/XT live in `../name-pools/values-orgs.json`); distinct domain — the political map over the geography data.

## OVERVIEW
The sixteen states S01–S16, their ruling houses and chaebol origins, plus overlays that are deliberately not states: diaspora corridors and external theaters. Diplomacy and conscription rules live in GDD `rules/Rules-FactionsWarfare`.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| The 16 states S01–S16 | `Sixteen-States.md` — InfoBox-declared 정본; 6 강국 (대한민국정부·수문국·규격맹·환적국·동방사·태욱그룹), 4 약국, 6 소국; forms 봉건·군정·신정·상업 |
| Houses / chaebol origins | `Chaebol-Houses-and-Century-Factions.md` — families lease infrastructure to states; chaebol-origin states are the hereditary exception (상호가 국호) |
| External theaters XT01–XT05 | `External-Theaters.md` — Seoul-side corridors only; read-only projection of World-Narrative-Atlas (edit via the atlas, parent contract) |
| Diaspora corridors | `Diaspora-Corridors.md` — life-belt overlay on the 16 states; new people still satisfy the cast card contract (`../characters/Cast-Profile-Contract.md`) |

## CONVENTIONS
- `polity_contexts` in `../regions/content/` must be S01–S16 (`verify_region_atlas.py` rejects anything else); corridors, remnants, and XT ids never qualify as polities.
- Leader titles come from each state's 2026 real-institution job titles (`../offices/Offices-and-Ranks.md`); the tier ladder is identical across the 16, only names differ — 봉건 wording like 남작 never appears in the ledgers.
- `External-Theaters.md` prose is a read-only projection of World-Narrative-Atlas — never hand-edit it; change the atlas and re-project (parent contract).
- From chaebol history only 승계 습관 crosses into canon (who qualifies, how it splits, who custodies); real conglomerate names/logos stay out except where 상호=국호 canon already fixes it.

## ANTI-PATTERNS
- Diaspora corridors never become a 17th state; conscription remnants are not 4 new independent states.
- Never write the 16 states as a one-ethnicity roster — the corridors exist because pre-collapse Seoul wasn't one (대림·가리봉·이태원·동대문·구로·용산 belts).
- Military service history is never inferred from gender or name; post-collapse enlistment also exists.
- Troop and ammunition numbers for the conscription remnants are deliberately undecided — don't fix them in canon pages.
- External theaters: never assert crimes of real current regimes or institutions; corridors are rumor/ledger fragments, not intelligence reports.
- Foreign-design borrowings (CK tiers, etc.) import structure only, never proper nouns.
