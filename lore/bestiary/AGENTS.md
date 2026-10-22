# lore/bestiary — 생태·변이 생성 도감

## OVERVIEW
Atlas의 생태 레지스트리를 집단별 읽기 전용 JSON으로 나누는 생성 도메인이다.

## WHERE TO LOOK
| 작업 | 위치 |
|---|---|
| 목록·공통 설명 | `Hostile-Ecology-Index.json` |
| 집단별 생태·시나리오·개체 | `groups/Hostile-Group-Gxx.json` |
| 실제 수정 원천 | `../World-Narrative-Atlas.json` |
| 재생성 구현 | 루트 `scripts/materialize-world-atlas.mjs` |
| 투영 계약 검증 | 루트 `scripts/test-world-atlas.mjs` |

## CONVENTIONS
- 선정 점수 6: 파일 수 3 + 구조화 원천 비율 2 + 자체 schema 1. update mode에서 기존 생성 경계 안내를 유지한다.
- `G01–G26`은 집단, `GxxEyy`는 개체 식별자다.
- 집단 페이지에는 공통 생태, 변이 관계, 전장 분류, 시나리오와 해당 개체가 함께 있다.
- 공통종과 예외적 변이를 따로 설명한다.
- 기계 기종·고정 시설·군집 현상을 생물 종과 구분한다.
- 원천 수정 후 루트에서 아래 materializer를 실행한다.

## ANTI-PATTERNS
- 삭제된 G27·M042는 재사용하지 않는다. 삭제 결정일은 2026-09-28이다.
- M007의 예약 식별자 10개는 미집필 상태로 남긴다.
- Mxxx는 출처 배치 정보다. 별도 `Monster-Batch-*.md` 본문이나 배치 목록 페이지를 만들지 않는다.
- 보스 역할만으로 공통종 전체의 생물학적 지배자를 만들지 않는다.
- 동물·기계·시설·사건에 인간 20인 분대 상한을 자동 적용하지 않는다.
- 도감 편집을 근거로 영웅의 직접 행동 기술을 추가하지 않는다.

## COMMANDS
`node scripts/materialize-world-atlas.mjs --atlas lore/World-Narrative-Atlas.json --out lore`
`node scripts/materialize-world-atlas.mjs --atlas lore/World-Narrative-Atlas.json --out lore --check`
`npm run test:atlas`
