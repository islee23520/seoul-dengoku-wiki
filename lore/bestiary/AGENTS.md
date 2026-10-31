# lore/bestiary — 생태·변이 생성 도감

## OVERVIEW
Atlas의 생태 레지스트리를 집단별 읽기 전용 JSON으로 나누는 생성 도메인이다.

## WHERE TO LOOK
아래 `.json` 이름은 PostgreSQL 정본의 논리 ID 또는 과거 provenance이며 물리 입력 파일이 아니다. 공개·비공개 정본 구분과 편집 절차는 루트 `lore/AUTHORING-JSON.md`와 `WORLD_BUILDING_GUIDE.md`를 따른다.
| 작업 | 위치 |
|---|---|
| 목록·공통 설명 | `Hostile-Ecology-Index.json` |
| 집단별 생태·시나리오·개체 | `groups/Hostile-Group-Gxx.json` |
| 실제 수정 원천 | `../World-Narrative-Atlas.json` |
| 과거 투영 구현 | 루트 `scripts/materialize-world-atlas.mjs` — SQLite/파일 기반 도구, PG 저작용 아님 |
| PG 투영 확인 | `scripts/generate-catalog.mjs`의 PG 읽기 전용 atlas 검사 경로 |

## CONVENTIONS
- 도메인별 과거 자료와 현재 head·승인 상태를 대조하며, 삭제된 JSON 원천을 다시 만들지 않는다.
- `G01–G26`은 집단, `GxxEyy`는 개체 식별자다.
- 집단 페이지에는 공통 생태, 변이 관계, 전장 분류, 시나리오와 해당 개체가 함께 있다.
- 공통종과 예외적 변이를 따로 설명한다.
- 기계 기종·고정 시설·군집 현상을 생물 종과 구분한다.
- Atlas 정본 편집과 의존 투영 갱신은 지원되는 PG 도메인 편집 계약을 확인한다. 범용 typed CLI는 모든 Atlas 쓰기를 지원하지 않는다. 지원이 없는 변경은 전용 구현·소유자 작업이 필요하며 SQLite나 물리 JSON 쓰기로 우회하지 않는다.

## ANTI-PATTERNS
- 삭제된 G27·M042는 재사용하지 않는다. 삭제 결정일은 2026-09-28이다.
- M007의 예약 식별자 10개는 미집필 상태로 남긴다.
- Mxxx는 출처 배치 정보다. 별도 `Monster-Batch-*.md` 본문이나 배치 목록 페이지를 만들지 않는다.
- 보스 역할만으로 공통종 전체의 생물학적 지배자를 만들지 않는다.
- 동물·기계·시설·사건에 인간 20인 분대 상한을 자동 적용하지 않는다.
- 도감 편집을 근거로 영웅의 직접 행동 기술을 추가하지 않는다.

## COMMANDS
PG 현재 head를 조회하고 정식 생성 경로의 읽기 전용 투영 대조 결과를 확인한다. `scripts/materialize-world-atlas.mjs`의 `--check`는 외부 SQLite 이관 진단일 뿐 PG 검증이 아니며, `--check` 없는 실행은 물리 파일을 쓰므로 현행 저작 절차에 사용하지 않는다.
