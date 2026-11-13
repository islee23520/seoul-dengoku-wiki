# lore — 옛 저작 폴더 안내 (v3 이후)

《서울:전국》 세계관의 정본은 이 폴더에 있지 않다. 2026-11-13 v3 재작성 이후 세계관과 위키 내용은 아래에서 읽고 고친다.

| 무엇 | 어디 |
|---|---|
| 세계의 뼈대(세 정체, 25공작령, 연표, 금지 어휘, 인물 예외) | `docs/CANON-BIBLE.md` |
| 승인된 v3 설계(고정 사실, 01~10장, 한국어 원문과 영어 짝) | `docs/design/v3/` (`README.md`부터) |
| 공개 사이트가 읽는 데이터와 문서 본문(GitHub Pages 빌드 입력) | `data/sql/*.sql` |

- 문서 본문은 `scripts/pages/rewrite-doc.mjs`, 인물 데이터는 v3 적용 스크립트처럼 검토를 거친 스크립트로 `data/sql`을 고친다. 절차는 `docs/REWRITE-PIPELINE.md`를 따른다.
- 이 폴더의 `.json` 논리 경로 이름(예: `factions/Sixteen-States.json`)은 옛 PostgreSQL 이관 기록의 식별자일 뿐이다. 그런 파일은 디스크에 없고, 그 이름이 가리키던 옛 개념(S 번호 정치체 16개, 재벌·운영 가문, 서울 밖 영주 등)은 v3에서 폐기됐다(`docs/design/v3/01-core.md` 10절).
- v3와 어긋나는 옛 Markdown 로어 파일(인물 카드 계약, 등록 양식, 랜덤 로스터, 백필 초안, 항렬 계약, 명명 원장, 작성 규칙, 역 별칭 장부)은 과제 27에서 지웠다. 근거와 남긴 파일 목록은 `docs/drafts/reports/v3-legacy-disposition.md`에 있다.

## 이 폴더에 남은 것

| 파일 | 왜 남겼나 |
|---|---|
| `AGENTS.md`, `*/AGENTS.md` | 옛 도메인 지침. 각 파일 머리에 v3 권위 줄이 있다 |
| `AUTHORING-JSON.md` | 옛 PostgreSQL 작성 계약. 루트 `AGENTS.md`와 `scripts/cast-sqlite/AGENTS.md`가 가리킨다. 현재 저작 절차가 아니다 |
| `regions/README.md`, `regions/sources/observed-levels-join.md`, `regions/sources/*.csv` | 지리 출처(행정동 경계, 역 건축 공개 자료) 기록. 세계관 서술이 아니다 |
| `name-pools/*.mjs`, `relations/validate.mjs` | 옛 이관 도구. `relations/validate.mjs`는 옛 `scripts/check-contract.mjs`가 실행한다 |
