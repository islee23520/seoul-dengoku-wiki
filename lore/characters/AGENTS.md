# lore/characters — 인물 본문과 명부

## OVERVIEW
인물 카드·국가별 명부·관계 원문·공개 등록 계약을 관리한다.

## WHERE TO LOOK
아래 `.json` 이름은 SQLite 논리 ID 또는 과거 provenance이며 물리 입력 파일이 아니다. 공개·비공개 정본 구분과 편집 절차는 루트 `lore/AUTHORING-JSON.md`와 `WORLD_BUILDING_GUIDE.md`를 따른다.
| 작업 | 위치 |
|---|---|
| 인물 색인·게시 장부 | `Cast-Index.json`, `Cast-Index-S4.json` |
| 국가별 카드 | `Cast-State-01.json`부터 `Cast-State-16.json` |
| 핵심·무소속·회랑 인물 | `Core-Characters.json`, `Cast-Unaffiliated.json`, `Cast-Corridors-Index.json` |
| 관계 원문 | `Cast-Relations.json` |
| 카드 계약·빈 양식 | `Cast-Profile-Contract.md`, `Cast-Registration-Template.md` |
| 이름·생년월일·영구 ID | `Hangnyeol-and-Bon-gwan.json`, `../name-pools/` |
| 새 profile 계약 | `../editorial/Character-System-Contract.json` |

## CONVENTIONS
- 도메인별 과거 자료와 현재 head·승인 상태를 대조하며, 삭제된 JSON 원천을 다시 만들지 않는다.
- `### 인물 <이름>` 아래 계약 칸, 정치 칸, 생애·관직·훈련·일화·가문·관계·야망·공포·개입 산문을 둔다.
- 실제 훈련은 서사 근거가 있을 때만 기록한다. 카드 계약의 옛 GURPS 설명은 신규 profile 산식이 아니다.
- 칸 표시는 (원문 사실)·(창작 제안)·(자동 파생값)·(미확인)을 구분한다.
- 장부 숫자 부록은 본문이 아닌 metadata다. 가치관·욕망은 `../name-pools/values-cast.json`과 맞춘다.
- 생년월일의 논리 ID는 `../name-pools/cast-birthdays.json`, 만 나이 기준은 `2126-12-31`이다. 개막 월일을 임의 생성하지 않는다.
- 2026년 사건은 당시 살아 있던 선대와 연결하고 친생·입양·가계 연대를 대조한다.
- 음수는 이웃 카드와 같은 `−`(U+2212)를 사용한다.
- 무소속 카드의 `캐릭터 ID` 계약과 전 인물 영구 registry ID를 혼동하지 않는다. 기존 국가 카드에 표시 칸을 일괄 소급하지 않는다.

## ANTI-PATTERNS
- 옛 `docs/cast-*` 브랜치를 자동 병합하거나 ours/theirs로 일괄 선택하지 않는다.
- `roster-100.json`·`cast-backfill-draft.*` 후보를 사람의 검토 없이 정본 명부로 승격하지 않는다.
- 이름·로마자 표기만으로 언어를 확정하지 않는다. 상인·역장 직함으로 총기 접근을 자동 판정하지 않는다.
- 실존 유명인·원작 고유명을 새 인물명으로 가져오거나 국가를 단일 민족 명부로 만들지 않는다.
- 미성년 성적 서사를 작성하지 않는다. 브랜치에 본문이 있다는 이유로 게시 승인을 얻은 것으로 처리하지 않는다.

## COMMANDS
루트에서 `npm run test:people`, `npm run test:person-details`, `npm run test:person-id`를 실행한다.
옛 `TOOL/tools/wiki/verify-cast.mjs`는 이 작업트리의 현행 검증 경로가 아니다.
