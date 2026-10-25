# 복합 컴포넌트 작업 지침

## OVERVIEW
지도·가계도·제보 선택의 복합 UI 영역이다. 점수 9: 파일 수 3, 코드 비율 2, 심볼 밀도 2, export 수 2로 독립 도메인에 해당한다.

## WHERE TO LOOK
| 작업 | 위치 | 핵심 경계 |
|---|---|---|
| 영토 지도·지형 | `OpeningTerritoryMap.tsx`, `.css` | 지도 표시와 선택 통합 |
| 작위 공개 투영 | `geographicTitleMap.mjs`, `.d.mts` | staging에서 공개 허용 필드만 선택 |
| 지도 메시지 | `mapBridge.ts`, `useMapBridge.ts` | transport 수신·전송과 해제 |
| 좌표 선택 | `mapCoordinateSelection.ts`, `segmentPointerSelection.ts` | 좌표와 화면 선택 대상 대응 |
| 역 표시·별칭 | `stationPresentation.ts`, `railStationCorrections.ts` | 실제 ID와 통합 표시 ID 구분 |
| 지형 캐시 | `terrainTileCache.ts` | 타일 로드 경계 |
| 가계도 | `FamilyTree.tsx`, `FamilyTreeSelection.tsx`, `FamilyTree.css` | 가계 node와 선택 상태 |
| 보유 상세 선택 | `HoldingSelectionPanel.tsx` | 지도·인물 보유 연결 |
| 제보 표면·작성 | `FeedbackSurface.tsx`, `FeedbackComposer.tsx` | 렌더 텍스트 바인딩 뒤 선택·제출 |
| 전체 레이아웃 | `Layout.tsx`, `Sidebar.tsx` | 위키 프레임과 탐색 |

## CONVENTIONS
- 지도 transport는 `MapTransport.send/subscribe`로 주입하고 unsubscribe 및 dispose 수명을 유지한다.
- `janseon-wiki-map.v1` 지형 메시지는 `EPSG:5179`, manifest 해시, source 해시와 타일 범위를 검증한다.
- 역의 member ID와 alias는 표시용 station ID로 정규화한다. 선택 이벤트에 임의 ID를 통과시키지 않는다.
- 작위 표시 rank는 county·duchy·kingdom·empire다. 남작령 슬롯은 county 상세 데이터로 다룬다.
- `geographicTitleMap.mjs`의 런타임 export를 바꾸면 대응 `.d.mts` 선언도 대조한다.
- 지도와 가계도 전용 CSS는 각각의 컴포넌트 옆에 있다.

## ANTI-PATTERNS
- staging 객체를 spread하여 지도 payload에 싣지 않는다. 비공개 증거와 역사 권리는 공개 allowlist 밖이다.
- 지도에 없는 ID를 유효 선택으로 전달하거나 역 alias를 새 역처럼 중복 표시하지 않는다.
- 지형 메시지의 schema·projection·해시 검사를 UI 편의 때문에 우회하지 않는다.
- 제보의 화면 텍스트와 원천 span 대응을 DOM 문자열 추측으로 대체하지 않는다.

## 검증 연결
- 지도 변경은 루트 `npm run test:territory-map`과 관련 `scripts/test-*.mjs` 범위를 확인한다.
- 가계도·가문 데이터 연결은 `npm run test:families`, 인물 연결은 `npm run test:person-details`를 대조한다.
- 제보 원천 매핑 변경은 `npm run test:feedback-catalog`의 생성물 계약과 함께 확인한다.
