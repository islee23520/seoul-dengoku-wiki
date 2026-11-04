# sss.linalab.io 루트 홈페이지 재구성 제안 (초안)

상태: **제안 초안**. 소유자 승인 전이며 배포·설정 변경을 포함하지 않는다. 함께 두는 파일은 [`index.html`](index.html)(정적 프로토타입)과 [`steering-guide.md`](steering-guide.md)(작성 판정 규칙)이다.

## 1. 현재 상태 (2026-11-04 익명 HTTP 관측)

| 경로 | 관측 | 의미 |
|---|---|---|
| `https://sss.linalab.io/` | 302 → Cloudflare Access 로그인 | 루트는 익명 방문자에게 소개 화면을 주지 못한다 |
| `https://sss.linalab.io/wiki/` | 200, 제목 「서울:전국 — 공식 위키」 | 공개 위키 SPA |
| `https://sss.linalab.io/wiki/seoul-showcase/` | 200, 제목 「서울:전국 — Seoul Subway States」 | 독립 정적 쇼케이스 |
| `https://sss.linalab.io/gdd/` | 302 → Access 로그인 | GDD 뷰어는 접근 제한 |
| `https://sss.linalab.io/tools/` | 302 → Access 로그인 | 도구 포털은 접근 제한 |
| `https://seoul-dengoku.linalab.io/wiki/` | 308 → `sss.linalab.io/wiki/` | 옛 도메인은 위키로 영구 이동 |

저장소의 `deploy/nginx.conf`는 `/wiki`, `/wiki/seoul-showcase/`, `/gdd/`와 옛 지역 경로 리다이렉트를 명시하고, 나머지는 `location /`의 정적 `try_files`로 처리한다. GDD README는 루트를 별도 "root hub"로 부르며 `/wiki/`·`/avatar/`·루트 허브를 서로 교체하지 않도록 정한다. 즉 루트 화면은 위키 빌드 산출물이 아니라 호스트가 소유한 영역이고, 지금은 Access 정책이 그 앞을 막고 있다.

> 브리프의 "현재 루트가 위키 점유" 표현은 방문자 동선 기준으로 해석했다. 익명 방문자가 실제로 읽을 수 있는 첫 화면은 `/wiki/`뿐이고, 공유 링크도 위키로 모인다. 루트 응답 자체는 위 표처럼 로그인 리다이렉트다.

## 2. 목표 구조

```
/                        새 프로젝트 소개 홈페이지 (정적 1페이지, 이 초안)
/wiki/                   보존 — 공식 위키 SPA, 경로·리다이렉트 변경 없음
/wiki/seoul-showcase/    보존 — 쇼케이스 정적 앱, 정확 매칭 서빙 유지
/wiki/<기존 경로>         보존 — 모든 딥링크·옛 지역 리다이렉트 유지
/gdd/                    보존 — 접근 정책은 별도 결정
/tools/ 등 기타           보존 — 이 제안의 범위 밖
```

원칙:

1. **추가만 한다.** 루트에 정적 파일 하나(`/index.html` + 필요한 이미지)를 두는 것이 전부다. `/wiki/` 아래의 파일, nginx `location /wiki*` 블록, 쇼케이스 `location = /wiki/seoul-showcase/` 블록은 건드리지 않는다.
2. **루트는 위키 빌드에 넣지 않는다.** 위키 `vite build`(basename `/wiki`)와 `artifact-allowlist.json` 계약을 바꾸지 않도록, 홈페이지는 독립 정적 산출물로 둔다. GDD가 `site/gdd/`만 교체하는 방식과 같은 형태로 `site/` 루트의 `index.html`만 교체하는 별도 배포 단위를 권장한다.
3. **위키 링크는 절대 경로로 건다.** 홈페이지에서 `/wiki/...`로 가는 링크는 모두 기존 공개 URL을 그대로 쓴다.

## 3. 전환 절차 (승인 후 운영자 작업, 이 PR에서는 실행하지 않음)

| 단계 | 내용 | 되돌리기 |
|---|---|---|
| 0 | 소유자가 이 초안의 문구·구조를 승인한다 | — |
| 1 | `docs/homepage-proposal/index.html`을 루트용 정적 파일로 확정한다(이미지 확정, 초안 배너 제거) | 파일 미배포 |
| 2 | 호스트 `site/` 루트에 `index.html`을 배치한다. `/wiki/`·`/gdd/` 산출물은 그대로 둔다 | 이전 루트 파일 복원 |
| 3 | Cloudflare Access 정책에서 루트 정확 경로(`/`)만 공개로 연다. `/gdd/`·`/tools/`의 제한은 유지한다 | 정책 원복 |
| 4 | 검증: `/` 200 + 소개 제목, `/wiki/` 200, `/wiki/seoul-showcase/` 200, 옛 리다이렉트(`/regions`, `seoul-dengoku.linalab.io/wiki/`) 유지, 위키 live contract 검사 통과 | 2·3단계 원복 |

nginx는 이미 `location /`에서 `$uri/` 디렉터리 인덱스를 제공하므로 루트 파일 배치만으로 서빙이 가능하다고 본다. 이 판단은 설정 파일 읽기에 근거한 것이며 실제 호스트에서 확인하지 않았다(4단계에서 확인).

열린 결정(소유자 판단 필요):

- 루트 Access 공개 범위: 루트 1페이지만 공개(권장) / 현행 유지 후 내부 검토.
- 쇼케이스 대표 이미지: 쇼케이스 장면 캡처 중 하나를 고른다. 등장 초상은 위키 공개 초상이며 정본 승인 이미지가 아니므로 캡션에 그 상태를 적는다.
- 대표 어조 문구 채택 여부(4장 참조).

## 4. 섹션별 문구 근거

표식은 프로토타입과 같다. **게시 문서** = 공개 위키 문서(`/wiki/api/documents/world/<slug>?locale=ko`, 2026-11-04 조회)의 문장을 그대로 인용. **REPORTED** = 관측 수치이며 관측일과 출처를 함께 적는다. **제안** = 승인 전 문구.

### 4.1 히어로

| 문구 | 표식 | 근거 |
|---|---|---|
| 서울:전국 / Seoul Subway States | 고유명 | 저장소 README, 위키 제목 |
| "붕괴 이후 서울의 지하철역을 무대로 한 인물 중심의 대전략·TRPG 기반 CRPG 프로젝트" | 요약 | README "character-centered grand-strategy game set in the subway network of post-collapse Seoul", AGENTS.md "대전략·TRPG 기반 CRPG" |

### 4.2 프로젝트 소개

| 카드 | 표식 | 인용 원문 출처 |
|---|---|---|
| 대정전 | 게시 문서 | 「대정전」(`World-Unbinding`) 가. 사건의 명칭, 첫 문단 |
| 지하철역의 사람들 | 게시 문서 | 「대정전」 셋째 문단, 「사람과 기체」(`People-and-Machines`) 가. 첫 문장 |
| 서울 안의 세계 | 게시 문서 | 「대정전」 "현재 세계는 서울 안에서만 성립한다…" 문단. 세력 구도는 「서울 십육국」(`Sixteen-States`)으로 연결 |
| "절망적이지 않은 쇠퇴" | 제안 | 승인된 문서에 이 표현이 없다. 어조 후보로만 표기했다 |

인용하지 않은 것: 세력별 성향·수도역 같은 세부 설정은 소개 페이지에 옮기지 않고 「서울 십육국」으로 링크한다. 요약 과정에서 설정이 바뀌는 위험을 피하기 위해서다.

### 4.3 쇼케이스

| 문구 | 근거 |
|---|---|
| 링크 `https://sss.linalab.io/wiki/seoul-showcase/` | 브리프 지정, 2026-11-04 HTTP 200 관측 |
| "장면 전환과 한국어 내레이션" | `artifacts/seoul-showcase/` 의 `public/narration/*.ko.mp3`, 장면 데이터 |
| "등장 초상은 위키 공개 초상이며 정본 승인 이미지가 아니다" | 쇼케이스 `storyScript.ts`의 초상 캡션 "art-proposal 상태, 정본 승인 아님" |

### 4.4 플레이·기술 증거

| 문구 | 표식 | 근거 |
|---|---|---|
| 공개 문서 목록 61건 | REPORTED | `GET /wiki/api/documents?locale=ko` 응답 길이, 2026-11-04 |
| 인물 511명 | REPORTED | `GET /wiki/api/health` `people: 511`, 2026-11-04. `deploy/README.md` 운영 관측(2026-10-30)도 인물 511 |
| 관측 위치 332행, 지도 표시 역 307곳 | REPORTED | 「서울 역 카탈로그」(`Seoul-Station-Catalog`) 가. 표의 뼈대 |
| 지도 설명 두 문장 | 게시 문서 | 「세계 지도」(`World-and-Subway-Layers`) 첫 문단 |
| "PostgreSQL 정본에서 생성되어 공개 위키와 읽기 전용 API로 제공" | 저장소 사실 | AGENTS.md Project Overview |

쓰지 않은 수치: 334개 역, 51 요새, 1,022 캐릭터 등은 공개 게시 문서에서 확인되지 않았거나 내부 감사 기록에만 나온다. 공개 health의 인물 수(511)와도 다르다. 확정 문구로 쓰지 않았다. 필요하면 steering-guide의 REPORTED 규칙으로 출처·관측일을 붙여서만 쓴다.

### 4.5 기획 문서

공개 문서 목록(61건)에 실제로 있는 경로만 링크했다: 세계관 색인, 연표, 서울 십육국, 시나리오 타임라인, 용어 사전. GDD는 정본 소유자를 알리기 위해 링크하되 "현재 접근 제한"을 함께 적었다.

### 4.6 개발 상태

모든 행은 관측 가능한 상태(공개됨 / 접근 제한 / 진행 중 / 비공개)와 확인 방법으로만 적었다. "게시는 승인이나 게임 구현 완료를 뜻하지 않는다"는 `WORLD_BUILDING_GUIDE.md`와 `deploy/README.md`의 승인·배포 구분을 따른 것이다. 게임 빌드 행은 공개 플레이 빌드가 확인되지 않아 "비공개"로 두었다.

### 4.7 외부 링크

GitHub 저장소, 공식 위키, 쇼케이스. 저장소 설명에는 "정본은 비공개 메인 저장소에 있고 이 저장소는 게시 파생물"이라는 문구가 있어, 홈페이지에서는 "공식 위키 저장소"로만 소개했다.

## 5. 추가 색 역할 (DESIGN.md 반영 제안)

프로토타입은 DESIGN.md §2 토큰 외에 아래 색을 쓴다. 채택 시 DESIGN.md 색 표에 역할을 추가한다(이 PR은 DESIGN.md를 수정하지 않는다).

| 역할(제안) | 값 | 용도 |
|---|---|---|
| 내비게이션 위 보조 글자 | `#b9c0cc`, `#d5dae3`, `#e6e9ef` | 짙은 헤더·푸터 위 부제·링크 |
| 내비게이션 위 외곽선 | `#5b6478` | 보조 버튼 테두리 |
| REPORTED 배지 | `#4a5568` / `#eef1f5` / `#c4ccd8` | 관측 수치 표식 |
| 제안 배지 | `#7a5b12` / `#fdf6e3` / `#e3cf96` | 승인 전 문구 표식 |

## 6. 프로토타입 검증

- 1440×900, 390×844 뷰포트에서 실제 Chrome으로 렌더하고, 각 너비에서 `document.documentElement.scrollWidth ≤ innerWidth`와 섹션·카드 사각형 겹침 0건을 측정했다. 캡처는 PR 본문에 결과를 적는다.
- 프로토타입은 외부 글꼴·스크립트 없이 DESIGN.md 색 토큰만 쓴다. 표는 자체 가로 스크롤을 갖는다(DESIGN.md §4).
