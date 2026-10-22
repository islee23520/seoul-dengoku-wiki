# lore — 세계 설정 원천

## OVERVIEW
Atlas의 기계 레지스트리와 도메인별 JSON 저작 원천을 관리한다.

## STRUCTURE
- `characters/`・`name-pools/`: 인물 본문·영구 ID·명명·가계·수치 원장.
- `factions/`・`relations/`: 정치 주체와 인물·주종·사건 연결.
- `places/`・`regions/`: 지도·역·행정구역·영지 원천.
- `culture/`・`chronology/`: 생활문화·연대·개막 조건.
- `bestiary/`: Atlas에서 생성하는 생태·변이 도감.
- `editorial/`: 비공개 계약·승인·soul·재배치·본문 검토.

## WHERE TO LOOK
| 작업 | 원천 |
|---|---|
| Atlas와 투영 | `World-Narrative-Atlas.json`, `Operating-Houses.json`, `Synthetic-Actors.json` |
| 서사·관계 투영 | `Regional-Physical-AI-Arcs.json`, `World-Relation-Ledger.json`, `World-Expansion-Index.json` |
| 저작 형식 | `AUTHORING-JSON.md`, `authoring*.schema.json`, 각 도메인 schema |
| 목차·용어 | `README.md`, `glossary.json` |
| 현재 인물·서울 계약 | `editorial/Character-System-Contract.json`, `editorial/Seoul-Scope-Contract.json` |

## CONVENTIONS
- 선정 점수 10: 파일 수 3 + 하위 디렉터리 2 + 구조화 원천 비율 2 + 자체 schema 1 + LSP 심볼 밀도 2. JSON은 이 저장소의 저작 코드로 계산한다.
- Atlas 투영은 원천과 `original_anchor`·`original_hash`를 연결한다. 도메인 원천과 생성 뷰의 소유권을 구분한다.
- 본문은 한국어 한다체, 안내는 합니다체다. 구조 키는 영어이며 `연결` 필드는 교차 참조에 사용한다.
- 문서 JSON의 Markdown 본문은 빌드 때 렌더한다. 원천과 동명인 공개 Markdown 사본은 `E_MARKDOWN_TWIN` 대상이다. 계약·README 같은 관리 Markdown과 구분한다.
- 현재 인물 수를 옛 K001–K412나 1001명 설명에서 추정하지 말고 `name-pools/person-id-registry.json`을 확인한다.

## ANTI-PATTERNS
- Atlas 투영을 직접 수정하지 않는다. `scripts/materialize-world-atlas.mjs`와 `scripts/world-atlas-render.mjs`가 생성 경계다.
- 실존 기업의 로고·제품·현직 임원을 창작 범죄의 소재로 추가하지 않는다.
- 합성체에 전지성·무한 에너지·완전한 장기 기억·전체망 접근·담당 구역 밖 시설 제어를 부여하지 않는다.
- `editorial/`의 역사 모티브와 비공개 검토 자료를 공개 원천으로 복사하지 않는다.

## COMMANDS
루트에서 `npm run test:lore-json`, `npm run test:lore-render`, `npm run test:lore-links`, `npm run test:atlas`를 변경 범위에 맞춰 실행한다.
`npm run generate`와 `npm run build`는 게시용 데이터를 생성한다. 생성 성공은 설정 승인과 별개다.
