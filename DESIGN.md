# 서울:전국 공식 위키 디자인 시스템

## 현행 적용 범위 (2026-10-31)

문서·인물의 공개 표면은 한국어 전용이다. 저작 원천은 PostgreSQL `wiki`의 typed head이며 `lore/*.json`은 논리 식별자·출처 경로이지 복원할 파일 원천이 아니다. 색·레이아웃·컴포넌트의 가독성 계약은 아래를 사용하되, 설정과 공개 범위는 [WORLD_BUILDING_GUIDE.md](WORLD_BUILDING_GUIDE.md)를 우선한다. 무협 체계는 폐기됐으며 역사 발급 자료는 새 능력으로 자동 환산하지 않는다. 공개 profile에 비공개 Soul 근거를 노출하지 않는다.

서울은 유일한 현재 세계다. 현재 지도 설계는 행정동 남작령 슬롯 → 서울 국회의원 지역구 백작령 → 자치구 공작령 → 왕국 → 서울 제국의 다섯 계층을 따른다. 표시·선택의 최소 폴리곤은 백작령, 남작령은 상세 슬롯이며 지리 parent·정치 주군·개별 권리는 구분한다. 세 정치 세력을 지리 왕국 수로 치환하지 않는다. GTX 사업 자료·서울 밖 종점·한반도 프레임은 현재 세계의 위치·통행권·영토를 뜻하지 않으며 서울 밖 현행 지리를 공개 근거로 사용하지 않는다.

현재 `src/pages/ArticlePage.tsx`가 연결하는 지도는 `src/components/OpeningTerritoryMap.tsx`의 평면 SVG다. 지상·지하 및 정치·작위 보기, 선택 상세, 드래그·방향키 이동과 버튼 줌을 제공하며 휠·핀치 줌이나 3D 지형으로 설명하지 않는다. 현재 코드의 존재만으로 최신 영지 계층 전환·권리 개정·승인·운영 게시 완료를 주장하지 않는다.

아래 GTX 절과 §5의 16국·427동 지도, §9의 공유 UI 매핑 및 §10–§11의 날짜별 증분은 당시 설계·구현 맥락을 보존한다. 16국·대전·한반도 프레임·과거 개인 보유 배치는 현행 집필 계약이 아니다. 이 문서 정비는 지도 코드나 봉인 자료를 변경하지 않는다. §2–§8의 수치·접근성은 설계 요구이며 전체 화면 실측 합격 보고가 아니다.

## GTX 사업 연결 표시

> 과거 사업자료 시각화 설계 기록. 위 현행 적용 범위와 서울 유일 세계 계약을 우선한다.

세계 지도는 2026년 사업 자료의 GTX 연결을 기존 영토·일반 전철 구간과 구분해 표시한다. 사업별 펼침 목록에서 경로, 사업 단계, 자료 연도와 공식 출처를 읽는다. 발표 구상과 도시 단위 연장 종점은 실제 역 좌표로 바꾸지 않는다. 기존 역과의 지도 연결은 확정된 identity와 위치가 있는 경우에만 표현한다. 이 표시로 2126 점유·통행권을 부여하지 않는다. 기존 본문·표·details 및 링크 스타일과 wiki 토큰을 재사용한다.

## 1. 분위기와 정체성

공식 설정집을 오래 읽는 화면이다. 붕괴 이후 서울의 행정 장부와 지하철 노선도를 한 권의 디지털 백과사전처럼 보여 준다. 서명은 짙은 남청색 문서 선반과 적갈색 정본 표식이며, 장식보다 긴 한국어 산문과 표의 가독성을 우선한다.

## 2. 색

| 역할 | 토큰 | 값 | 용도 |
|---|---|---|---|
| 배경 | `--wiki-canvas` | `#f7f7f4` | 문서 바탕 |
| 본문 면 | `--wiki-paper` | `#ffffff` | 본문·표 |
| 내비게이션 | `--wiki-nav` | `#1a1f2e` | 고정 문서 선반 |
| 내비게이션 호버 | `--wiki-nav-hover` | `#2a3045` | 현재·호버 항목 |
| 본문 글자 | `--wiki-text` | `#27313d` | 제목·본문 |
| 보조 글자 | `--wiki-muted` | `#697586` | 메타·라벨 |
| 구분선 | `--wiki-line` | `#d9dee5` | 표·섹션 경계 |
| 강조 | `--wiki-accent` | `#b63c32` | 링크·정본 표식 |
| 강조 진함 | `--wiki-accent-dark` | `#8f2d27` | 호버·제목선 |
| 목차 면 | `--wiki-toc` | `#fbf4f1` | 문서 목차 |

새 색은 이 표에 역할을 추가한 뒤 사용한다. 강조색은 상호작용과 정본 상태에만 쓴다.

## 3. 타이포그래피

- 본문/UI: `Malgun Gothic`, `Apple SD Gothic Neo`, `Noto Sans KR`, sans-serif.
- H1 2rem/1.25, H2 1.45rem/1.35, H3 1.15rem/1.45, 본문 1rem/1.75, 보조 0.8rem/1.5.
- 본문 최대 읽기 폭은 78ch. 표는 내용 폭을 유지하고 자체 가로 스크롤을 소유한다.
- 한국어 본문은 `word-break: keep-all`, `overflow-wrap: anywhere`, `text-wrap: pretty`를 사용한다.

## 4. 간격과 레이아웃

- 기준 단위 4px. 주요 간격은 8/12/16/20/24/32/40px.
- 데스크톱은 220px 고정 내비게이션 + 유동 본문. 문서 스크롤은 페이지 본문이 소유한다.
- 본문 최대 폭 1200px. 문서 영역은 본문 + 최대 240px 목차의 sticky-aside 패턴이다.
- 1024px 미만에서는 목차가 본문 위로 이동한다. 768px 미만에서는 내비게이션이 접이식 상단 메뉴가 된다.
- 375px에서 기본 콘텐츠의 가로 스크롤은 금지하고, 표만 자체 스크롤을 허용한다.

## 5. 재사용 컴포넌트

### `Layout`
- 구조: skip link → `Sidebar` → `main#main-content`.
- 상태: 데스크톱 고정 사이드바, 모바일 접이식 메뉴.
- 접근성: 키보드 사용자가 본문으로 바로 이동한다.

### `Sidebar`
- 구조: 공식 위키 브랜드 + 도메인별 링크 묶음.
- 상태: default, hover, focus-visible, current.
- 레이아웃: 데스크톱 fixed-sidenav-shell, 모바일 disclosure grid.

### `ArticlePage`
- 구조: breadcrumbs → 문서 헤더/정본 배지 → Markdown 본문 + sticky 목차.
- 상태: loading, loaded, missing redirect.
- 콘텐츠: `world` 정본을 같은 React 셸에서 렌더한다. 게임설계·규칙 문서는 GDD 저장소의 `viewer/`가 `/gdd/`로 게시한다.

### `SortableTable`
- 구조: 가로 스크롤 래퍼 + 정렬 가능한 표.
- 상태: default, hover, sorted ascending/descending, focus-visible.

### `TerritoryMap3D`

> 과거 3D 지도 설계 기록이며 현재 ArticlePage 지도 구현의 설명이 아니다.

- 구조: Three.js WebGL canvas + 16국 HTML 국가명·깃발 overlay + 국가 필터 + 지역 상세.
- 시각: 지정 서울 3D 아틀라스 레퍼런스처럼 원근 미니어처 지형, 단순화한 동 경계 돌출, 따뜻한 주광과 차가운 림 조명을 쓴다. 실제 측량 디지털 트윈을 주장하지 않는다.
- 높이: 지배지는 경합지보다 높고 역 객체 수를 낮은 배율로 더한다. 가독성을 위해 높이를 과장했다는 설명을 화면에 남긴다.
- 상호작용: 왼쪽 드래그 오빗, 휠 줌, 오른쪽 드래그 팬. 지역 선택은 raycast, 키보드 접근은 16국 라벨·범례 버튼과 지역 선택표가 맡는다.
- 국기: 3:2, 2색, 무문자·무실존 로고. 색만으로 구분하지 않고 16개 기하 모티프와 국가명을 함께 노출한다.
- 성능: DPR 1.75 상한, 427개 동 geometry는 초기화 때만 만들고 resize observer·RAF·geometry/material/control/renderer를 unmount 때 모두 해제한다.

## 6. 동작과 모션

- 전환은 색·배경 150ms ease-out만 사용한다. 레이아웃 속성 애니메이션은 쓰지 않는다.
- `prefers-reduced-motion`에서는 모든 전환을 제거한다.
- 링크는 URL을 바꾸되 `world` 내부에서는 React 셸을 유지한다. `/gdd/` 링크는 GDD 뷰어로 이동한다.

## 7. 깊이와 면

전략은 `borders-only`다. 본문과 표는 얇은 구분선과 미세한 면 차이로만 층을 나눈다. 카드 그림자와 유리 효과는 사용하지 않는다.

## 8. 접근성 제약과 허용 부채

- WCAG 2.2 AA, 본문 대비 4.5:1 이상, 모든 상호작용에 `focus-visible` 표시.
- 문서 제목은 페이지당 H1 하나. 표는 가로 스크롤 가능하며 본문 전체를 밀지 않는다.
- 허용 부채 없음.

## 9. 공유 웹 UI 계약 매핑 (2026-09-27)

이 문서의 문서 가독성 체계(§2–§8)가 부모 저장소 공유 계약 `TOOL/docs/Shared-Web-UI-Design-Contract.md`의 기준선이 되었다. hub와 GDD 뷰어가 이 문서의 값과 컴포넌트 어휘로 수렴한다. 이 절은 매핑만 기록하고 §1–§8의 값을 바꾸지 않는다.

### 토큰 매핑

| 이 문서 | 공유 역할 토큰 | 값 |
|---|---|---|
| `--wiki-canvas` | `--sui-color-canvas` | `#f7f7f4` |
| `--wiki-paper` | `--sui-color-surface` | `#ffffff` |
| `--wiki-nav` | `--sui-color-nav` | `#1a1f2e` |
| `--wiki-nav-hover` | `--sui-color-nav-hover` | `#2a3045` |
| `--wiki-text` | `--sui-color-ink` | `#27313d` |
| `--wiki-muted` | `--sui-color-ink-secondary` / `--sui-color-ink-muted` | `#697586` (light는 두 역할이 같은 값; canvas 위 사용 제약은 계약 §2) |
| `--wiki-line` | `--sui-color-line` | `#d9dee5` |
| `--wiki-accent` | `--sui-color-accent` (site=wiki) | `#b63c32` |
| `--wiki-accent-dark` | `--sui-color-accent-strong`, light `--sui-color-focus` | `#8f2d27` |
| `--wiki-toc` | `--sui-color-accent-soft` (site=wiki) | `#fbf4f1` |

계약이 내비 글자값 `--sui-color-nav-ink #b8c4d2`·`--sui-color-nav-ink-strong #ffffff`를 새로 정의해 이 문서에 없던 내비 글자 역할을 채운다. 표 교대행 `--sui-color-surface-sunken #f2f3f5`(tailwind `table.alt`와 같은 값)도 계약 §2로 흡수된다.

### 컴포넌트 매핑

| 이 문서 | 공유 컴포넌트 |
|---|---|
| `Layout` | `SiteShell` (skip link·`main#main-content` 구조 유지) |
| `Sidebar` | `SiteShell` + `CategoryTree` (도메인 묶음은 트리 그룹으로; People·States·Map 특수 항목은 위키 로컬 유지) |
| `ArticlePage` 셸 | `PageHeader` + `Breadcrumbs` + `TableOfContents` + `ArticleBody`(document-renderer) |
| `SortableTable` | `TableViewport` 내부 표 |

`TerritoryMap3D`, `InfoBox`, `NavBox`, `StateFlag`, `TimelineOverview`, 인물 검색·국가 페이지 위젯은 위키 로컬 컴포넌트로 유지한다.

### tailwind 드리프트 정리

`tailwind.config.js`의 `accent #c0392b/#922b21`, `toc #fff5f5/#ffcdd2`, `sidebar.active #e53e3e`(nav 위 3.98:1)는 이 문서의 값과 어긋난다. 공유 마이그레이션에서 이 문서 §2의 값으로 수렴하며, 이 문서가 상위 기준이다.

### 경계

이 절은 당시 계약 매핑만 기록한다. 현재 PostgreSQL 정본·공개 자격·경로·앵커를 변경하지 않으며 공유 UI 마이그레이션 완료를 입증하지 않는다.

## 10. Confirmed personal holding map increment (2026-10-02)

> 2026-10-02 당시 증분 기록. 아래 승인·보유·선행 PR 언급은 당시 범위에 한하며 현재 서울 권리 재승인이나 현재 배포 관측을 대신하지 않는다.

Reference: authenticated campaign.html Region interaction. Retain its lower-left selection-card anatomy using existing wiki tokens, existing terrain/layers/pan/zoom and region hit handlers. The detail panel owns bounded scrolling. Personal holdings come exclusively from `confirmed-person-holdings.json` (`confirmed-person-holdings.v1`), published by the canon generator. Exact `adminRefs.id` values join existing region polygons; selecting any member selects its one parent holding and highlights all its member outlines without intercepting hits. The initial approved holding is Yangcheon’s eighteen dong, K002 holder and K001 direct liege. Display designation and territorial scale separately from optional formalTitleRank and collapsed public office information. Stable IDs resolve through current retainerGraph nodes/detailRoute and the issued registry/catalog, never numeric route derivation or state colors. PR406 emits owner-confirmed edges with `courtId: null`, `relationKind` and exact `ownerTerm`: K002/K017/K003 → K001 use direct-liege and 직속 주군; K058/K060/K061/K062 → K1005 use direct-vassal and 직속 가신. The map adapter preserves ownerTerm for those edges. The existing 46 non-null-court edges display 직속 봉사·궁정 관계 unless the producer explicitly supplies a separate qualified relation. No state-based feudal label, universal lack-of-land claim, private qualification status or null court link is inferred. Proposal GURPS territory assignments are excluded. This UI increment requires 845’s confirmed ledger/generator and PR406 producer integration before local generation; it creates no canon allocation itself. Applied desktop interaction and pixel verification remain pending.

## 11. 삼국과 중립 영지 (2026-10-09)

> 2026-10-09 당시 지도 설계 기록. 현재 공개 세계 범위는 서울뿐이며, 아래 대전·한반도 프레임은 현행 요구로 재사용하지 않는다.

정치 관할 색은 규격맹 #567b46, 대한민국정부 #426f99, 종교 연합 #b54b4b, 중립 #8a969b다. 색과 함께 이름을 표시한다. 국가 목록은 세 종주권과 중립 중앙정보부·대전으로 묶으며 기존 ArticlePage·SortableTable·NavBox를 재사용한다. OpeningTerritoryMap의 줌은 오버레이 +, -, 초기화 버튼만 바꾼다. 휠·트랙패드·핀치는 지도의 viewBox를 변경하지 않으며 드래그 이동과 서울·한반도 프레임 선택을 유지한다.

## 12. 독자 인물 profile (2026-10-12)

인물 본문의 정본 상세 뒤에 역량 표, 숙련 표, 특성 설명과 신체 상태를 표시한다. 기존 wiki-table-wrap·person-data-table·본문 제목·details를 재사용하고 새 색·간격·그림자를 추가하지 않는다. 역량은 기본값과 최종값을 별도 열로 비교한다. 숙련은 소수 첫째 자리로 표시한다. 특성은 행동·스트레스·관계와 수치 효과를 이름과 함께 읽는다. 신체는 부위별 손상·기능을 분리하며 미평가 상태를 정상으로 표시하지 않는다. 공개 profile에는 soul과 역사 비교를 표시하지 않는다. 표만 자체 가로 스크롤하며 모바일 본문을 밀지 않는다.
