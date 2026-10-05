# LORE/characters — named-cast canon for the 16 states

Earned its file: score ~9 (31 files, Cast-Index hub boundary, cross-repo reference centrality, own registration contract + machine gates); distinct domain — the 1001-person named cast, separate from the LORE atlas corpus.

## OVERVIEW
Korean-prose canon for every named character of post-collapse Seoul: roster indexes, 16 per-state card ledgers, the directed relation graph, naming rules, and the contract each new or edited card must satisfy.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Roster of the original 423 | `Cast-Index.json` (also the publication ledger; `관계 수` counts sender edges only) |
| The additional 578 (1010 total including core-only and unaffiliated cards) | `Cast-Index-S4.json` |
| One state's character cards | `Cast-State-01.json`–`Cast-State-16.json` |
| T0 core cast | `Core-Characters.json` (the T0 list is derived from its `## 인물 목록`; the 18 `주요` are locked in `../name-pools/values-cast.json`) |
| Directed relation edges | `Cast-Relations.json` (11 types: 친족·양자·사제·지휘·계약·빚·맹세·경쟁·원한·보호체류·배신) |
| People outside the 16 ledgers | `Cast-Corridors-Index.json` (bodies live on the corridor pages), `Cast-Unaffiliated.json` |
| Add or fix a named character | `Cast-Profile-Contract.md` (field meanings) + `Cast-Registration-Template.md` (blank card + issue flow) |
| Naming canon | `Hangnyeol-and-Bon-gwan.json` (data pools in `../name-pools/`) |
| Unvetted 100 candidates | `Random-Cast-Roster.md` + `../name-pools/roster-100.json` |
| Design mechanics | GDD `rules/Rules-FactionsWarfare`; `Characters-Factions-and-Professions.json` (생업 일곱) |

## CONVENTIONS
- Card grammar: `### 인물 <name>` — contract-cell bullets first (성명, 캐릭터 ID, 출신 공동체, 세대와 출생, …), then the political cells (성격·야망·공포·통치·관계·촉발), then prose sections `**생애.** **관직.** **무공.** **일화.** **가문.** **관계.** **야망.** **공포.** **개입.**`
- `::: details 부록 — 장부 숫자` stat blocks are metadata, explicitly "본문이 아니다"; their numbers must match `../name-pools/values-cast.json`.
- Every cell carries a marker — (원문 사실) / (창작 제안) / (자동 파생값) / (미확인) — four distinct states, not synonyms. Never fill an unverified cell with an arbitrary value; never merge with cells still empty.
- Birthdates are authored in `../name-pools/cast-birthdays.json`; preserve confirmed dates and permanent IDs. Display completed age as of `2126-12-31`, without inventing an opening month/day. Cross-check biographies, family timelines and explicit biological/adoptive relationships. Events in 2026 belong to the recorded contemporaneous forebear, not a descendant born later.
- Negative numbers use `−` (U+2212), matching neighbor cards; value/desire axes span −100..100.
- New character flow: GitHub issue (label `인물`, usually `quality:medium`) → duplicate-name check against `Cast-Index.json`, `Cast-Index-S4.json`, `Cast-Corridors-Index.json`, `../name-pools/values-cast.json` → template → review (see `../CONTRIBUTING.md`).
- `Cast-Unaffiliated.json` cards require a unique stable `캐릭터 ID` (also for external-source / same-name-risk newcomers); state-ledger cards never retrofit one.

## ANTI-PATTERNS
- Never machine-merge the old `docs/cast-*` branches into main (no auto merge, rerere, or ours/theirs batch).
- After any card edit run `node TOOL/tools/wiki/verify-cast.mjs --docs LORE`: R2 duplicate names, R15 캐릭터 ID uniqueness/presence on the unaffiliated page, banned historical names (조조, 유비, 관우, 장비, …).
- No real public figures' names, original-work proper nouns, or one-nation-one-ethnicity rosters. No sexual narratives involving minors.
- A Korean name or a Roman spelling proves nothing about the person's language; merchant/trader/역장 labels neither grant nor forbid firearm ownership.
- `roster-100.json` candidates and `../name-pools/cast-backfill-draft.*` are pre-review artifacts — never promote them into `Cast-State-*`/`Cast-Index*` without human review.
- A cast fragment existing on a branch never opens publication approval (ledger rules inside `Cast-Index.json`; baseline `1872919` items stay unpublished).
