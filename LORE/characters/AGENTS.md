# LORE/characters — named-cast canon for the 16 states

Earned its file: score ~9 (31 files, Cast-Index hub boundary, cross-repo reference centrality, own registration contract + machine gates); distinct domain — the 1001-person named cast, separate from the LORE atlas corpus.

## OVERVIEW
Korean-prose canon for every named character of post-collapse Seoul: roster indexes, 16 per-state card ledgers, the directed relation graph, naming rules, and the contract each new or edited card must satisfy.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Roster of the original 423 | `Cast-Index.md` (also the publication ledger; `관계 수` counts sender edges only) |
| The additional 578 (1004 total including core-only and unaffiliated cards) | `Cast-Index-S4.md` |
| One state's character cards | `Cast-State-01.md`–`Cast-State-16.md` (1694–1804 lines each) |
| T0 core cast | `Core-Characters.md` (the T0 list is derived from its `## 인물 목록`; the 18 `주요` are locked in `../name-pools/values-cast.json`) |
| Directed relation edges | `Cast-Relations.md` (11 types: 친족·양자·사제·지휘·계약·빚·맹세·경쟁·원한·보호체류·배신) |
| People outside the 16 ledgers | `Cast-Corridors-Index.md` (bodies live on the corridor pages), `Cast-Unaffiliated.md` |
| Add or fix a named character | `Cast-Profile-Contract.md` (field meanings) + `Cast-Registration-Template.md` (blank card + issue flow) |
| Naming canon | `Hangnyeol-and-Bon-gwan.md`, `Heirs-Names-and-World-Ledger.md` (data pools in `../name-pools/`) |
| Unvetted 100 candidates | `Random-Cast-Roster.md` + `../name-pools/roster-100.json` |
| Design mechanics | `Ambitions-and-Relations.md` (people act, not states), `Vassal-Dynasty-Politics.md`, `Starting-Presets.md`, `Characters-Factions-and-Professions.md` (생업 일곱) |

## CONVENTIONS
- Card grammar: `### 인물 <name>` — contract-cell bullets first (성명, 캐릭터 ID, 출신 공동체, 세대와 출생, …), then the political cells (성격·야망·공포·통치·관계·촉발), then prose sections `**생애.** **관직.** **무공.** **일화.** **가문.** **관계.** **야망.** **공포.** **개입.**`
- `::: details 부록 — 장부 숫자` stat blocks are metadata, explicitly "본문이 아니다"; their numbers must match `../name-pools/values-cast.json`.
- Every cell carries a marker — (원문 사실) / (창작 제안) / (자동 파생값) / (미확인) — four distinct states, not synonyms. Never fill an unverified cell with an arbitrary value; never merge with cells still empty.
- No age fields anywhere. Opening day is 2126; locking a birth year requires calendar-vs-biography evidence. Never use founding-era dates like 붕괴 1년/2027 in biographies.
- Negative numbers use `−` (U+2212), matching neighbor cards; value/desire axes span −100..100.
- New character flow: GitHub issue (label `인물`, usually `quality:medium`) → duplicate-name check against `Cast-Index.md`, `Cast-Index-S4.md`, `Cast-Corridors-Index.md`, `../name-pools/values-cast.json` → template → review (see `../CONTRIBUTING.md`).
- `Cast-Unaffiliated.md` cards require a unique stable `캐릭터 ID` (also for external-source / same-name-risk newcomers); state-ledger cards never retrofit one.

## ANTI-PATTERNS
- Never machine-merge the old `docs/cast-*` branches into main (no auto merge, rerere, or ours/theirs batch).
- After any card edit run `node TOOL/tools/wiki/verify-cast.mjs --docs LORE`: R2 duplicate names, R15 캐릭터 ID uniqueness/presence on the unaffiliated page, banned historical names (조조, 유비, 관우, 장비, …).
- No real public figures' names, original-work proper nouns, or one-nation-one-ethnicity rosters. No sexual narratives involving minors.
- A Korean name or a Roman spelling proves nothing about the person's language; merchant/trader/역장 labels neither grant nor forbid firearm ownership.
- `roster-100.json` candidates and `../name-pools/cast-backfill-draft.*` are pre-review artifacts — never promote them into `Cast-State-*`/`Cast-Index*` without human review.
- A cast fragment existing on a branch never opens publication approval (ledger rules inside `Cast-Index.md`; baseline `1872919` items stay unpublished).
