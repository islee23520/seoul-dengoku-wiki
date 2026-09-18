# 서울 전역 전략맵 — 실행 증거 (feat/strategy-map-gdd)

계획 `.omo/plans/seoul-strategy-map-gdd.md` 실행 증거 번들. 소유자 지시(2026-09-18)로
저장소 루트 `evidence/` 에 직접 추적한다.

| 파일 | 내용 |
|---|---|
| `strategy-map-unity-1280x720.png` | Unity 배치모드 실렌더 — 9청크 3×3 지형, 원근 카메라, 청크별 색 |
| `strategy-map-unity-1920x1080.png` | 위와 동일, 1920×1080 |
| `strategy-map-1280x720-histogram.txt` | 엔진 투영 좌표·렌더러 bounds 덤프(캡처 진단) |
| `unity-editmode-genre-red.xml` | GenreContract 신규 계약 테스트 RED(3계약 실패) |
| `unity-editmode-genre-green.xml` | GREEN — 신규 통과, 잔여 5실패는 브랜치 이전 기준선과 동일 |
| `unity-editmode-map-red.xml` | 전략맵 카탈로그·프레젠터 스텁 RED(8실패) |
| `unity-editmode-map-green.xml` | GREEN |
| `unity-playmode-strategy.xml` | PlayMode — 9청크 적재·원경 팬/줌 검증 통과 |
| `final-editmode.xml` / `final-playmode.xml` | 최종 전체 회귀(실패 전건 기존 결함과 동일) |
| `bake-test.txt` | 베이크 결정론·수면 클램프·결측 타일 거부 등 7/7 통과 |
| `seoul-identity.txt` | 서울 정체성 수치검증 — 한강 25구 내 횡단, 북한산 815m(126.978/37.659), 관악산 619m(126.964/37.445) |

원본 로그·스크립트는 워크트리 `GAME/.omo/evidence/` 와 `TOOL/tools/strategy-map/` 참조.
