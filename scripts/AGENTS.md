# scripts 작업 지침

## OVERVIEW
공개 생성·승인 검사·인물 투영·GIS 전처리와 회귀 검사를 모은 Node ESM 도구 영역이다. 점수 12의 독립 파이프라인 도메인으로 지침을 둔다.

## WHERE TO LOOK
| 작업 | 위치 | 확인할 경계 |
| --- | --- | --- |
| 생성·빌드 진입점 | `generate-release.mjs` | 공개 승인, lock, stage, journal, 승격·복구 |
| 공개 카탈로그·인물 상세 | `generate-catalog.mjs`, `person-detail-inputs.mjs`, `person-detail-production.mjs` | 승인된 입력과 공개 필드 |
| 서울 범위·검토 승인 | `check-seoul-scope.mjs`, `seoul-scope.mjs`, `seoul-census.mjs` | 원천 해시, batch, receipt 인증 |
| 공개 편입 계약 | `catalog-admission.mjs`, `public-person-detail-admission.mjs` | draft와 publication 구별 |
| JSON 렌더·검사 | `lore-json-render.mjs`, `lore-json-validate.mjs`, `check-lore-links.mjs` | 원천 schema, anchor, 링크 |
| 지도·역·지형 | `physical_rail.py`, `bake-regional-terrain.py`, `station-catalog-geography.mjs` | 원천 지리와 공개 투영 구별 |
| 초상 | `generate-portrait-tokens.mjs`, `portrait-public-boundary.mjs` | 파생 token과 승인된 선택 구별 |
| 정규화 인물 DB | `cast-sqlite/` | 하위 지침과 README 우선 |
| 비공개 문서·증거 DB | `document-store/` | 내부 capability와 고정 identity |
| 보조 입력 | `fixtures/`, `data/`, `historical-inputs/` | 검사 fixture·행정 자료·보존 입력 구별 |

## CONVENTIONS
- `.mjs`와 명시적 상대 import를 쓴다. 기존 파일별 세미콜론·들여쓰기 스타일을 따른다.
- release는 `npm run generate`, 빌드는 `npm run build`로 시작한다.
- 생성 worker는 `generatorStage()`가 제공하는 stage에 기록한다. `WIKI_GENERATION_STAGE`와 token은 release가 공급한다.
- release lock은 협조하는 generate/build 명령만 보호한다. 실행 중 dev server와 직접 실행한 tsc/vite reader는 중지한다.
- `public/`, `src/generated/`, `src/generated-private/`의 변경은 stage·journal 계약을 함께 확인한다.
- 원천 해시·승인 receipt·현재성·공개 편입은 별도 판단이다. materialize 성공을 승인으로 취급하지 않는다.
- `historical-inputs/`의 보존 자료를 현재 서울 자료의 자동 대체재로 쓰지 않는다.
- 테스트는 같은 디렉터리의 `test-*.mjs`에 둔다. Vitest와 `node:test`가 혼재하므로 `package.json`의 실행기를 확인한다.
- Python GIS 도구는 각 파일의 실행·의존성 선언을 확인한다. release lock broker는 `python3`와 `fcntl.flock`을 사용한다.

## COMMANDS
저장소 루트에서 변경 영역에 해당하는 명령을 선택한다.
로어 schema 검사는 Python `jsonschema`가 필요하다. 생성물·dist·비공개 승인 원천을 읽는 검사는 해당 입력이 준비된 checkout에서 실행하며, 누락 오류를 검사 통과로 보고하지 않는다.
```bash
npm run generate
npm run build
npm run test:lore-json
npm run test:admission
npm run test:gate
npm run test:person-details
npm run test:territory-map
npm run check:artifacts
npm run test:parent
```

## ANTI-PATTERNS
- `generate-catalog.mjs` 같은 worker를 직접 실행해 live output을 갱신하거나 stage 인증을 우회하지 않는다.
- pending review를 임의 receipt나 hash 갱신으로 통과시키지 않는다. 승인 인증기의 실패 원인을 확인한다.
- `.generate-release-transaction`의 journal을 충돌 해결 대신 삭제하거나 제3자의 수정본을 덮어쓰지 않는다.
- 편집·영혼·증거 원천을 공개 catalog나 브라우저 payload에 섞지 않는다.
- 전체 `test-*.mjs`를 한 실행기로 가정하지 않는다. `npm test`는 `test:parent`의 전체 검사와 범위가 다르다.
