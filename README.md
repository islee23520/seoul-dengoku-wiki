# 잔선: 서울

**붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4방향 대전략 SRPG.**

이 저장소는 Unity 6.7 기반 프로젝트와 게임 로직 문서의 원본을 관리합니다.

## 현재 상태

- Unity `6000.7.0a5` 프로젝트 생성
- 고정 직교 아이소메트릭 장르 계약과 EditMode 테스트 추가
- 상세 게임 로직 문서 및 Wiki 도판 작성
- Foundation 아키텍처(`Bootstrap.unity` App scope/FSM, `Foundation.unity` 화면 child scope, VContainer `1.19.0`) 구현·검증 완료
- 현재 모듈은 `Unity POC 통합 코어 루프`이며, 캠페인 코어 루프·전투·생성 에셋 구현은 이 모듈의 예정 범위입니다

## 문서

게임 설계 원본은 [`docs/game-logic/`](docs/game-logic/Home.md)에 있습니다. GitHub Wiki는 이 문서의 읽기 전용 미러로 게시합니다.

이슈를 열거나 작업을 추적할 때는 [`CONTRIBUTING.md`](CONTRIBUTING.md)를 따릅니다. 웹에서는 YAML 이슈 폼만 열고, 빈 이슈는 쓰지 않습니다.

