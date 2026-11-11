# W3+W4 46문서 030 직렬 적용 — 검증자 결함 3건 정정 보고서

갱신: 2026-11-11. 대상 브랜치 `feat/w34-applied`(적용 커밋 c57295fda·0db0608cf)에 대한 독립 검증의 3결함(A 영어 용어집 한글, B 신규 중복 id 3건, C DoneClaim 잔존 오기)을 같은 브랜치에서 정정한 기록이다. 정본은 `data/sql/030-wiki-documents.sql`이며 모든 변경은 초안 파일 수정 → `scripts/pages/rewrite-doc.mjs` 재적용 경로로 반영했다(docs/REWRITE-PIPELINE.md).

## (A) 영어 용어집 본문의 한글 — 해소

`check-site.mjs`의 exit 1 `'HANGUL on English page: wiki/Glossary/index.html'` 원인은 `Glossary.en.md`의 두 곳이었다.

- 인명 7건의 괄호 원어 표기: `Go Ye-jin (고예진)` 등 → 괄호 통째로 삭제(7행).
- 행정구 25행 표의 한국어 열(`| District | English | Faction |` + `마포구 …`) → 한국어 열 삭제, 기존 영문 열을 District로 승격(`| District | Faction |` 2열).

한국어 페이지 본문(`Glossary.ko.md`)은 불변(앵커 1건 제외, 아래 B). 검증: SITE_BASE=/ 재빌드 후 `node site/check-site.mjs` **exit 0** — `checked EN 1418 + KO 1418 + showcase 1 files (rows per locale 1412)`, 영어 페이지 한글 위반 0.

## (B) 신규 중복 HTML id 3건 — 해소

검증자 지적: 빌드 영어 페이지에서 명시 앵커 `<a id>`가 VitePress가 헤딩에 생성하는 id와 충돌 — wiki/Glossary `glossary`(h1 "Glossary"의 생성 id), wiki/Oral-Stories `the-2026-water-and-parts-exchange`·`the-2053-yeongdeungpo-water-agreement`(h2 영어 헤딩의 생성 id).

인바운드 링크 전수 조사(030의 59문서 × ko/en 본문 + `site/`·`src/` 코드 + 초안 전체):

| 조각 id | 인바운드 링크 |
|---|---|
| `#glossary` | 0건 |
| `#the-2026-water-and-parts-exchange` | 2건 — Food-Culture en, Structures en → `/wiki/Oral-Stories/#the-2026-water-and-parts-exchange` |
| `#the-2053-yeongdeungpo-water-agreement` | 1건 — Structures en → `/wiki/Oral-Stories/#the-2053-yeongdeungpo-water-agreement` |

결정(건별): 세 id 모두 **영어 페이지 헤딩이 같은 id를 이미 생성하므로 명시 앵커는 영어 페이지에서 중복**이고, 한국어 페이지는 헤딩이 한글이라(생성 id가 NFD·underscore 형태) 충돌이 없다. 인바운드 링크 전부가 영어 페이지를 가리키므로 헤딩 id로 그대로 해결된다. 따라서 rewrite-doc의 앵커 집합 동일(exit 4) 불변식을 지키기 위해 **두 언어 초안에서 동시에 해당 명시 앵커 3건을 삭제**했다(헤딩 텍스트·수준 변경은 불필요). 한국어 명시 앵커(`2026년-물과-부품-거래`, `2053년-영등포-급수-협약` 등)는 Food-Culture·Structures의 한글 fragment 링크 목적지라 그대로 보존했다.

결과: Glossary 명시 앵커 8→7, Oral-Stories 7→5(양 언어 동일 집합, 도구 통과). 실측(빌드 HTML 전체 2,838페이지):

- 중복 (페이지, id) 쌍: 기준(W2) 빌드 5건 = 수정 빌드 5건, **신규 0건**(`Century-Annals 2125년-시청역-노동자들` en·ko, `Sindorim-Junction-Cargo-Gate` schedule·sources, `World-Unbinding` faith 는 기준 빌드부터 있던 기존 중복).
- fragment 해결: fragment 링크 31,927 / 해결 31,861 / 미해결 66 — 정정 적용 빌드와 완전 동일(기계 대조 newOnly 0, baseOnly 0). 이번 수정으로 새로 깨지거나 새로 해소한 링크는 없다(66은 기존 형태 불일치 30 + 목적지 누락 36).

## (C) DoneClaim 잔존 오기 — 정정

이전 DoneClaim의 `task_literals`가 `"십육국": 0, "Sixteen-States(visible)": 0`으로 보고했으나 이는 잔존 스캔 하네스 결함으로 측정 자체가 불가능했던 값이다: `w34-leftover.mjs`의 패턴 빌더가 extras 항목이 이미 컴파일로 제공하는 `re` 필드를 무시하고 `pattern` 문자열만 읽어, extras를 절대 매칭하지 않는 `/<never>/`로 컴파일했다. 빌더를 `p.re ?? new RegExp(p.pattern …)`로 수선하고(결과 파일 경로도 인자화, 저장소 사본 `docs/drafts/reports/w34-leftover.mjs`) 수정 빌드 전체 페이지 가시 텍스트를 재실측했다:

- **십육국(visible) = 3페이지 4히트** — `ko/wiki/people/person-1019`(개인 야망 "십육국 모두에 같은 판의 사본" 2히트), `ko/gdd/design/home`, `ko/gdd/design/online-user-journey`.
- **Sixteen-States(visible) = 2페이지 2히트** — 양 언어 `gdd/system-design/singleplayer-design-sp-1-0-0`("WIKI Sixteen-States, Offices-and-Ranks…" 세계관 근거 문구).
- 참고 실측(같은 스크립트): `sixteen states` 대소문자 무시 가시 텍스트 10히트(gdd 영어 6·한글 2, person-1019 영어 1, World-Narrative-Atlas 영어 1 — 마지막은 알려진 미패치 문서).

이 잔존은 전부 이번 적용 범위 밖(people·GDD 본문 = 다른 작업 소관, World-Narrative-Atlas = 미패치)이며, "visible 십육국 0 / Sixteen-States 0"이었던 종전 기술은 잘못된 것이다.

## 초안 model 라인 기록

손편집은 cpa/glm-5.3(이 작업 실행 모델, task json `effective_model`)의 새 기여이므로 4개 초안의 model 줄 끝에 `; EN fix by cpa/glm-5.3`(영어초안) / `; KO fix by cpa/glm-5.3`(한글초안)를 추가했다(기존 다중 라운드 기록과 같은 형식, 예: Era-Arms-and-Tech-Level.en.md).

## 재적용 절차와 검증 수치

초안 4파일(Glossary·Oral-Stories ko/en)만 수정한 뒤 이전 작업과 동일한 순서로 재적용했다(작업 디렉터리 wt-w34-apply):

| 검증 | 명령(요약) | 종료 코드 | 결과 |
|---|---|---|---|
| 초안 적용 run1 | `node scripts/pages/rewrite-doc.mjs --drafts docs/drafts --only <이전과 동일한 44 slug>` | 0 | 44문서 반영, 030 = 3,602,428B. Glossary ko 3209→3186B(99%) en 3155→2731B(87%), Oral-Stories ko 3676→3576B(97%) en 3722→3622B(97%), 앵커·제목 불변식 통과 |
| 초안 적용 run2 | `… --only Faith-Culture-Schism,Regional-Physical-AI-Arcs --allow-shrink` | 0 | 2문서 반영(100% 무변경 재기록), 3,602,428B |
| 직렬화 무손실 | `node scripts/pages/rewrite-doc.mjs --roundtrip` | 0 | 3,602,428B 바이트 동일 |
| 독립 SQLite diff | 000+020+030 적재, 정정 전(0db0608cf) 대비 전 열 비교 | 0 | 59=59행, 변경 2 slug — Glossary·Oral-Stories의 body_md·body_ko_md 4셀만(한국어 셀 변화는 앵커 삭제 행만). title/title_ko/category/sort 불변, 나머지 57문서 불변 |
| 금지어 | `node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json --scope <46 slug> --json …` | 0 | 금지 0 / 필수 0 / 면제 0 / 건너뜀 0(46문서 92페이지) |
| 사이트 빌드(수정본) | `SITE_BASE=/ node site/build.mjs`(SITE_OUT=Temp, node argv로 실행 — MSYS 경로 변환 회피) | 0 | wiki 59 / gdd 129 / factions 4 / states 16 / people 1022 + showcase |
| 사이트 빌드(기준 W2 030) | 같은 설정, 030 임시 교체 후 복원 | 0 | 복원 바이트 검증 RESTORED_OK |
| check-site | `SITE_OUT=… node site/check-site.mjs` | 0 | EN 1418 + KO 1418 + showcase 1(페이지 수 기준 로캘당 1412) |
| 중복 id 실측 | 빌드 HTML 전 페이지 (페이지,id) 다발 대조 | 0 | 신규 중복 0(위 B) |
| fragment 실측 | 빌드 href fragment vs 빌드 id 정확 일치 | 0 | 31,927/31,861 해결/66 미해결, 이전 빌드와 동일(위 B) |
| 잔존 리터럴 실측 | `node docs/drafts/reports/w34-leftover.mjs <빌드> docs/canon-terms.json <json>` | 0 | 위 (C) 수치 |

빌드·검증 영수증: `<tmp>/w34-refix-*.{log,exit,json}`.

## 반영

- `fix(pages): 용어집 영어 본문의 한글과 중복 id를 바로잡는다` — 초안 4파일 + `data/sql/030-wiki-documents.sql`.
- `docs(pages): w34 적용 검증 정정 보고서와 잔존 스캔 스크립트를 보존한다` — 이 보고서 + `w34-leftover.mjs` 사본.
