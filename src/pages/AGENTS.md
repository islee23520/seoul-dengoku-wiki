# 라우트 화면 작업 지침

## OVERVIEW
기사·인물·가문·제보·도구 화면 영역이다. 점수 9: 파일 수 3, 코드 비율 2, 심볼 밀도 2, export 수 2로 독립 도메인에 해당한다.

## WHERE TO LOOK
| 작업 | 위치 | 데이터·연결 |
|---|---|---|
| 기사·locale 전환 | `ArticlePage.tsx`, `../documentApi.ts` | 생성 catalog metadata와 API 본문 blocks 구분 |
| 인물 목록·상세 | `PeoplePage.tsx`, `PersonDetailPage.tsx` | peopleCatalog와 개별 상세 요청 |
| 가문 목록·상세 | `FamiliesPage.tsx`, `FamilyDetailPage.tsx` | clanFamilyCatalog·가계도 |
| 관계 그래프 | `RelationsGraphPage.tsx` | 인물 관계 시각화 |
| 세력 | `StatesPage.tsx`, `StateDetailPage.tsx` | stateCatalog |
| 문서·분류 탐색 | `DocumentsPage.tsx`, `CategoriesPage.tsx` | 공개 카탈로그·분류 |
| 인물 초안 | `CharacterDraftPage.tsx`, `characterDraftExport.ts` | 편집과 내보내기 분리 |
| 인물 아트 | `CharacterArtToolPage.tsx`, `PortraitPromptPanel.tsx` | 프롬프트·토큰 API |
| 제보 내역 | `FeedbackPage.tsx` | 사용자 제보 화면 |
| 업데이트·라이선스 | `UpdatesPage.tsx`, `LicensePage.tsx` | 공개 이력·사용 조건 |

## CONVENTIONS
- 실제 라우트 등록과 lazy import는 `../App.tsx`에서 확인한다. 파일 존재만으로 노출 경로를 추정하지 않는다.
- `ArticlePage`는 `documentApi.ts`를 통해 `/wiki/api/documents/world/<slug>?locale=ko` 본문 blocks를 받아 렌더한다. 생성 catalog metadata는 문서 선택용이며, Mermaid는 필요한 기사에서만 지연 로드한다.
- 공개 기사는 한국어만 제공한다. 영문 라우트·언어 전환 UI·즉석 번역을 추가하지 않는다.
- 문서가 바뀔 때 이전 slug의 로드 실패나 비동기 결과가 새 기사 상태를 오염시키지 않게 한다.
- `PersonDetailPage`의 공개 역량·권리·보유와 봉인된 역사 sheet는 서로 다른 상태와 자료다.
- 제보 작성 UI는 문서 조회와 `FeedbackSurface` 바인딩이 준비된 뒤 노출한다.

## ANTI-PATTERNS
- 인물의 미확인·미발급 값을 0이나 승인 완료로 표시하지 않는다.
- 옛 GURPS sheet를 현재 characterProfile로 환산하거나 역사 보유를 현재 보유로 합치지 않는다.
- 기사 제목·앵커·표·제보 선택을 서로 다른 본문 복사본에서 계산하지 않는다.
- 아트 API의 권한 상태와 공개 초상화 존재를 동일한 허가로 간주하지 않는다.

## 검증 연결
- 인물·목록·기사 route·렌더링·분류 변경은 실제 화면과 문서 API 응답을 확인한다. 테스트 스위트는 제거되었으며 새 테스트 스크립트는 작성하지 않는다.
