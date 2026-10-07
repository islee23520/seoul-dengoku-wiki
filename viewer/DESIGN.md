# GDD 뷰어 디자인 계약 매핑

`/gdd/` 뷰어의 첫 디자인 문서다. 부모 저장소 공유 계약 `TOOL/docs/Shared-Web-UI-Design-Contract.md`(2026-09-27)에 이 뷰어를 맞추는 매핑이며, 현행 `viewer/src/styles.css`의 값을 계약 토큰·컴포넌트로 대응시킨다. 이 문서는 계약 기록일 뿐 코드와 정본 JSON을 바꾸지 않는다. 표에 나열한 값 차이는 공개 계획의 셸 적용 단계에서 일괄 마이그레이션한다.

## 1. 색 매핑 (현행 → 공유 토큰)

| 현행(styles.css) | 공유 토큰 | 값과 비고 |
|---|---|---|
| `:root` 글자 `#1d2735`, 바탕 `#f3f5f7` | `--sui-color-ink` / `--sui-color-canvas` | `#27313d` / `#f7f7f4`로 수렴 |
| `.gdd-sidebar` 면 `#182230` | `--sui-color-nav` | `#1a1f2e` (WIKI 문서 선반과 동일) |
| 내비 호버 면 `#263548` | `--sui-color-nav-hover` | `#2a3045` |
| 내비 링크 글자 `#b8c4d2` | `--sui-color-nav-ink` | 값 무변경, 9.27:1 |
| 브랜드 표식 `#75c7bb` | 사이트 유지 슬롯 | nav 위 8.12:1 |
| 위키 교차 링크 `#a7ded6`·경계 `#3c5d5b` | 사이트 유지 슬롯 | 10.73:1 |
| 킥커 `#258b7c` | `--sui-color-accent-strong` | `#217c70`. 틸 `#258b7c`는 paper 위 4.15:1라 글자에 쓰지 않고 경계·배지용으로만 남긴다 |
| h1 `#192534`, h2 `#233248` | `--sui-color-ink` | `#27313d` |
| 리드 `#5d6a78` | `--sui-color-ink-secondary` | `#697586`, paper 위 4.68:1 |
| 경계 `#dbe1e7`, 표 경계 `#d8dee5` | `--sui-color-line` | `#d9dee5` |
| 카드 hover 경계 `#4da99d` + 그림자 | 경계는 `--sui-color-accent-strong`, 그림자는 폐지 | borders-only 전환 |
| 표 머리 면 `#263649` | `--sui-color-table-head` | 값 유지, 흰 글자 12.31:1 |
| 인라인 코드 `#176f65`/`#edf5f3` | `--sui-color-code-ink`/`--sui-color-code-bg` | 값 유지 |
| 데이터 주석 면 `#eaf3f1`·왼쪽 바 `#258b7c` | `--sui-color-accent-soft` + 경계용 accent | `#217c70` 계열 |
| 경계 카드 왼쪽 바 `#2b9a8b` | 경계용 `--sui-color-accent` | 틸 |
| 통계 면 `#233248` | 사이트 유지 슬롯 | 통계 카드 전용 면 |

## 2. 타이포그래피 매핑

- Google Fonts `Noto Sans KR` import는 제거하고 공유 본문 스택 `"Pretendard","Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif`의 폴스루에 맡긴다. 어떤 표면도 웹폰트를 새로 가져오지 않는다(계약 §3). 이로써 WIKI와 같은 글꼴 체계가 된다.
- h1 34px → `2rem/1.25`, h2 21px → `1.45rem/1.35`. 산문 행간 1.78 → 1.75.
- 한국어 산문 규칙 `word-break: keep-all`, `overflow-wrap: anywhere`, `text-wrap: pretty`를 도입한다. 산문 읽기 폭은 78ch.

## 3. 레이아웃 매핑

- `body { min-width: 1180px }`는 삭제한다. 반응형 문서 셸(계약 §5)을 적용한다: 고정 내비 220px, 본문 최대 1200px, sticky 목차 최대 240px, 1024px 미만 목차 상단 이동, 768px 미만 내비 접이식, 375px 페이지 가로 스크롤 금지.
- 내비 폭 250px → 220px. 본문 여백 42/54px → 사다리 값 40/56px. 산문 영역 최대 1260px → 1200px.
- 카드 반경 5px → 4px. 카드 hover 그림자는 폐지하고 경계색 전환으로 대체한다.

## 4. 컴포넌트 매핑

| 현행 | 공유 컴포넌트 |
|---|---|
| `.gdd-shell` `.gdd-sidebar` `.gdd-brand` | `SiteShell`(브랜드·위키 교차 링크 슬롯) |
| `.gdd-sidebar nav`(카테고리 링크) | `CategoryTree`(문서 자식 확장 포함 — 현행은 카테고리만 노출) |
| `.gdd-kicker` `h1` `.gdd-hero` `.gdd-page-header` | `PageHeader` |
| `.gdd-section-heading` | `SectionHeading` |
| `.gdd-breadcrumbs` | `Breadcrumbs`(`aria-current`) |
| `.gdd-prose` | `ArticleBody` — `@seoul-dengoku/document-renderer`가 콘텐츠 노드를 소유 |
| `.gdd-prose table` `.gdd-table-wrap` | `TableViewport`로 통합(`role="region"`·`tabindex="0"`·`aria-sort`) |
| `.gdd-filters` | `QueryControl` |
| `.gdd-document-list` | `DocumentList` `DocumentListRow` |
| `.gdd-card-grid` `.gdd-card`(홈 카테고리 카드) | `DocumentList` 기반 카테고리 카드로 교체(홈의 카테고리별 문서 진입 노출은 공개 계획 과제) |
| `.gdd-boundary` `.gdd-stats` `.gdd-data-notes` | GDD 사이트 유지(경계 카드·통계·데이터 주석) |

## 5. 상태 · 스크롤 · 접근성

- 상태 어휘 `data-state="current|expanded|collapsed|loading|empty|error|not-found"`와 loading·empty·error·not-found용 `StateNotice`를 공유 계약 §6 그대로 적용한다.
- 스크롤 소유권(계약 §7): 세로 스크롤은 페이지 본문이, 가로 스크롤은 `TableViewport`만 소유한다. 모바일 접이식 내비는 문서 흐름 안에 펼쳐진다.
- 접근성(계약 §8): WCAG 2.2 AA, 모든 상호작용 `focus-visible`, 색만으로 상태 구분 금지, H1 페이지당 1개.

## 6. 경계와 비공개

- 뷰어 라우트는 기존 여섯 그룹(`design`·`rules`·`architecture`·`references`·`decisions`·`art`)을 유지하고 `system-design`·`proposals`를 추가한다. 게시된 제안은 기존 제안 상태를 유지하며 설계 승인으로 간주하지 않는다.
- 콘텐츠 노드 렌더링은 `@seoul-dengoku/document-renderer`가 소유한다. 공유 UI 패키지는 셸·내비·목차·표 뷰포트만 담당한다.
- 내부 영어 ID는 사용자 표면에 노출하지 않는다(GDD 저장소 규칙). 카드·목록의 코드 표기는 `korean-terminology-and-naming.json`의 data-field 표시 규칙을 따른다.
- 이 문서는 마이그레이션 전 계약이며, §1–§3의 값 차이는 셸 적용 단계에서 한 번에 반영한다.
