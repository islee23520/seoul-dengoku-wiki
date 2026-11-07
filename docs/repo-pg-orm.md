# repo-pg-orm — DB 정본 · 공개 투영 · 데이터 migration 편집 계약

채택: 소유자 결정 2026-11-07 (G1·G2 승인). 구현은 단계적이며 각 단계의 완료 기준은
`.omo/plans/wiki-repo-pg-orm.md`(내부 계획)과 PR별 검증을 따른다. 이 문서는 **계약**을
기술하고, 세부 절차·테스트 명령은 구현 PR과 함께 갱신된다.

## 역할 모델

| 대상 | 역할 |
|---|---|
| PostgreSQL `seoul`@15433 (`wiki`·`wiki_private` 스키마) | **모든 기록의 정본.** 문서·개정·봉인·승인·운영 이력 전부 보존 |
| `db/seeds/` | 공개 컨텐츠의 결정적 투영(기존 계약 유지). 단, 아래 범위 표는 **repo 편집 원본** 역할을 추가로 가진다 |
| `renders/` (신규, P2에서 도입) | DB에서 렌더링된 **공개 출력 전체**의 추적 스냅샷. 호스트 checked 생성 → snapshot PR로만 갱신. 직접 편집 금지 |
| `db/migrations/` | 구조(DDL) 변경 + **범위 표의 데이터 변경(DML)**. 둘 다 drizzle journal로 적용 |
| `wiki_migrations.__drizzle_migrations` + git/PR 이력 | **데이터 계보.** repo-origin 데이터 변경의 적용 기록은 이 원장과 PR로 증명한다 |

## 데이터 migration 편집 경로 (G1 승인 범위)

편집 가능 표는 12개 비revision 관리형 상수·상태 표로 한정한다:
`state`, `state_label`, `clan_crest_motif`, `current_region_disposition`,
`current_right_retirement`, `retirement_prose`, `relation_type`,
`geography_county`, `geography_edition`, `geography_map_title`,
`geography_metadata`, `geography_title`.

- 허용 연산: **INSERT**, **non-PK UPDATE**(아래 두 표 제외). UPDATE는 baseline
  전 컬럼 대조(낙관적 잠금)를 싣는다.
- `current_region_disposition`, `current_right_retirement`은 DB 불변 가드 트리거
  (`schema-pg/guards.sql`) 때문에 **INSERT-only**.
- 금지: DELETE, PK 변경, 범위 밖 표(`text_*` 등 개정 관리형은 계속 typed CLI 전용).
  위반은 생성·적용 단계에서 모두 거부된다.
- 절차: `db/seeds` JSONL 편집 → `npm run seed:sync`(diff → `db/migrations/NNNN_data_*.sql`
  + journal 생성) → PR(변경 JSONL·재계산 manifest·SQL을 한 묶음으로 리뷰) → main
  merge → 호스트 wiki-migrate가 drizzle로 적용(원장 1행 증가) → refresh 서비스가
  seed·render 투영을 갱신한 projection PR → 배포 자격 회복.
- 사람이 운영 PG에 직접 쓰는 경로는 존재하지 않는다(기존 계약 유지).

## 공개 렌더 가시성 (G2 승인)

- `renders/`는 **admission oracle**(`scripts/public-admission.mjs`, P2)이 공개로
  인정하는 문서·산출만 담는다. oracle은 실제 공개 소비자의 판정
  (`catalog-publication.mjs`의 `publicationEligible`/`catalogSourceEligible` 및
  문서 API 규칙)을 위임하며, 과거 revision의 admission이 새 draft로 승계되지
  않음을 보장한다.
- seeds만으로는 전체 생성이 불가능하다(비공개 PG 입력 필요 — 검증됨). 그래서 생성은
  항상 호스트가 동일 DB snapshot에서 seed+render를 함께 만들고, CI는 `renders/`
  스냅샷만으로 시크릿 없이 정적 컴파일·검증한다.
- `wiki_private`과 미게시 내용은 어떤 투영에도 들어가지 않는다.

## 배포 신선도 결속

- wiki 배포 요청은 `projection: { seedManifestSha256, renderManifestSha256 }`을
  싣고, 승인·봉인·worker는 보호된 호스트 상태 파일(마지막 적용 투영 상태)과 대조해
  `current` 상태이고 해시가 일치할 때만 진행한다. 데이터 migration 적용 후 투영
  갱신 전(`applied-awaiting-projection`)에는 새 정적 배포가 거부된다.

## 승격 게이트 (변경 불가)

- G3: 호스트 활성화(exact-SHA migrate 러너·refresh 서비스·배포 target) — 소유자.
- G4: 첫 운영 데이터 적용(pre-apply dump 포함) — 소유자.
- 이 문서의 계약이 구현 전 단계에 있는 동안은 해당 기능이 "없음"으로 명시된다.
