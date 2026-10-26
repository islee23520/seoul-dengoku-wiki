# lore/bestiary — 생태·변이 생성 도감

## OVERVIEW
Atlas의 생태 레지스트리를 집단별 읽기 전용 JSON으로 나누는 생성 도메인이다.

## WHERE TO LOOK
아래 `.json` 이름은 SQLite 논리 ID 또는 과거 provenance이며 물리 입력 파일이 아니다. 공개·비공개 정본 구분과 편집 절차는 루트 `lore/AUTHORING-JSON.md`와 `WORLD_BUILDING_GUIDE.md`를 따른다.
| 작업 | 위치 |
|---|---|
| 목록·공통 설명 | `Hostile-Ecology-Index.json` |
| 집단별 생태·시나리오·개체 | `groups/Hostile-Group-Gxx.json` |
| 실제 수정 원천 | `../World-Narrative-Atlas.json` |
| 재생성 구현 | 루트 `scripts/materialize-world-atlas.mjs` |
| 투영 확인 | 루트 `scripts/materialize-world-atlas.mjs --check` |

## CONVENTIONS
- 도메인별 과거 자료와 현재 head·승인 상태를 대조하며, 삭제된 JSON 원천을 다시 만들지 않는다.
- `G01–G26`은 집단, `GxxEyy`는 개체 식별자다.
- 집단 페이지에는 공통 생태, 변이 관계, 전장 분류, 시나리오와 해당 개체가 함께 있다.
- 공통종과 예외적 변이를 따로 설명한다.
- 기계 기종·고정 시설·군집 현상을 생물 종과 구분한다.
- Atlas 정본 편집과 투영 갱신은 지원되는 typed 편집·생성 계약을 확인한다. 아래 materializer는 DB 투영의 읽기 전용 검사에만 쓴다.

## ANTI-PATTERNS
- 삭제된 G27·M042는 재사용하지 않는다. 삭제 결정일은 2026-09-28이다.
- M007의 예약 식별자 10개는 미집필 상태로 남긴다.
- Mxxx는 출처 배치 정보다. 별도 `Monster-Batch-*.md` 본문이나 배치 목록 페이지를 만들지 않는다.
- 보스 역할만으로 공통종 전체의 생물학적 지배자를 만들지 않는다.
- 동물·기계·시설·사건에 인간 20인 분대 상한을 자동 적용하지 않는다.
- 도감 편집을 근거로 영웅의 직접 행동 기술을 추가하지 않는다.

## COMMANDS
`node scripts/materialize-world-atlas.mjs --atlas lore/World-Narrative-Atlas.json --out lore --check`
