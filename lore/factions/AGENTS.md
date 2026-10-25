# lore/factions — 정치 주체와 연결 원천

## OVERVIEW
안정 정치 ID, 지도자·가문·회랑 서사를 관리하며 지리 작위와 구분한다.

## WHERE TO LOOK
아래 `.json` 이름은 SQLite 논리 ID 또는 과거 provenance이며 물리 입력 파일이 아니다. 공개·비공개 정본 구분과 편집 절차는 루트 `lore/AUTHORING-JSON.md`와 `WORLD_BUILDING_GUIDE.md`를 따른다.
| 작업 | 위치 |
|---|---|
| S01–S16 정치 명부 | `Sixteen-States.json` |
| 가문·기업계 기원 | `Chaebol-Houses-and-Century-Factions.json` |
| 공동체·회랑 | `Diaspora-Corridors.json` |
| Atlas 연결 투영 | `External-Theaters.json` |
| 조직 가치·정책 수치 | `../name-pools/values-orgs.json` |
| 관직·호칭 | `../offices/Offices-and-Ranks.json` |
| 현재 봉속·궁정·보유권 | `../relations/relations.json`, `../relations/personal-holdings.json` |

## CONVENTIONS
- 도메인별 과거 자료와 현재 head·승인 상태를 대조하며, 삭제된 JSON 원천을 다시 만들지 않는다.
- S01–S16은 기존 정치 ID다. 현재 세 정치 세력·중립 지도 및 지리 왕국의 개수와 같다고 간주하지 않는다.
- `../relations/validate.mjs`는 국가 ID·등급·명부 관계를 교차 검증한다.
- 대한민국정부·규격맹·종교 연합의 중심 권역은 각 구성원의 주거지나 전역 독점 소유를 뜻하지 않는다.
- 가문 승계는 자격·분할·보관의 원문과 승인 기록을 따른다.
- 회랑은 생활권·관계 망이며 자동으로 추가 국가가 되지 않는다.
- 기존 지도자·왕격·정치 ID를 공간 규모만으로 강등하거나 합치지 않는다.
- `External-Theaters.json`의 변경은 Atlas 원천으로 돌아가 처리한다.

## ANTI-PATTERNS
- 옛 외부 전역 파일명과 XT ID를 서울 밖 현재 활동 공간의 근거로 쓰지 않는다.
- 서울 밖 사건·통신을 소문이나 미확인 보고로 바꾸어 공개에 남기지 않는다.
- 지리 parent를 정치 주군으로, 중심 권역을 개별 작위 수여로 자동 변환하지 않는다.
- 회랑·징집 잔존 조직을 새 독립국으로 승격하지 않는다.
- 성별·이름만으로 병역을 부여하지 않는다. 붕괴 뒤 입대와 붕괴 전 복무를 구분한다.
- 원문에서 미정인 병력·탄약 수를 고정하지 않는다.
- 국가별 인물을 한 민족으로 단순화하지 않는다.
- 옛 ‘모든 국가의 동일 호칭 사다리’ 문장을 현재 작위 계약보다 우선하지 않는다.

## COMMANDS
루트 `npm run test:states`, `npm run test:region-routes`, `npm run test:lore-links`로 관련 표면을 확인한다.
