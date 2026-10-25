# 프런트엔드 작업 지침

## OVERVIEW
React 위키의 진입점·라우팅·공개 데이터 연결 영역이다. 점수 9: 파일 수 3, 하위 디렉터리 2, 심볼 밀도 2, export 수 2로 독립 도메인에 해당한다.

## STRUCTURE
```text
src/
├── components/        # 지도·가계도·제보 표면
├── pages/             # 라우트별 화면
├── generated/         # 생성 카탈로그·공개 투영; 기사 본문 로딩은 문서 API
├── generated-private/ # 제보 서비스 전용 selectable-text 카탈로그
├── hooks/             # 제보 문서 조회 hook
└── data/              # 공개 가능한 UI 데이터
```

## WHERE TO LOOK
| 작업 | 위치 | 연결 지점 |
|---|---|---|
| 앱 시작·기본 경로 | `main.tsx`, `App.tsx` | BrowserRouter와 native anchor 가로채기 |
| 링크·옛 주소 | `wikiRouting.ts`, `wikiLinks.ts` | 내부 route와 브라우저 href 분리 |
| 기사 AST·제목 앵커 | `wikiDocument.ts` | 공유 document-renderer의 블록 계약 |
| 분류 연결 | `sharedCategories.ts` | 생성 분류와 링크 연결 |
| 문서 API | `documentApi.ts` | 응답 검증과 요청 취소 controller |
| 제보 선택·전송 | `feedback*.ts` | 바인딩·선택·조회·제출 계약 분리 |
| 초상화·사용 권한 | `portraitTokenApi.ts`, `personRightsPermissions.ts` | 공개 UI가 사용하는 API 및 상태 |

## CONVENTIONS
- Router basename은 `/wiki`다. Router 내부 경로와 native anchor의 `/wiki/...` href를 구분한다.
- 같은 origin의 `/gdd/`, `/play/` 등 hub 경로는 위키 basename을 붙이지 않는다.
- 기사 렌더링은 `@seoul-dengoku/document-renderer`, 공통 UI는 `@seoul-dengoku/shared-web-ui`를 사용한다.
- 기사 본문은 `documentApi.ts`가 문서 API에서 slug·locale별 blocks를 받아 페이지에 제공한다. 생성된 `wikiCatalog`·`wikiEnglishCatalog` metadata는 문서 선택·언어 전환에 쓰며 본문과 별개다.
- 생성 변경은 루트의 `npm run generate`; 빌드는 `npm run build`로 생성 절차까지 수행한다.
- 동작 검사는 `scripts/test-*.mjs`에 있다. 별도 `src/__tests__` 체계를 가정하지 않는다.

## ANTI-PATTERNS
- 생성 카탈로그와 기사 JSON을 원천처럼 직접 집필하지 않는다. 생성기·저작 원천을 수정한다.
- `generated-private/feedback-selectable-views.*.json`은 서비스 입력이다. 프런트엔드 import나 `public/` 복사로 노출하지 않는다.
- API의 `loading`, `not-found`, `error`와 데이터가 없는 정상 상태를 하나로 합치지 않는다.
- 취소되거나 이전 route에 속한 응답이 현재 화면을 덮어쓰게 하지 않는다.
