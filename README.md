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

브라우저에서 Unity Game View와 scene object를 확인하는 설치·실행 절차는 [`Unity Remote 안내`](docs/Unity-Remote.md)에 있습니다.

## 클론과 Git LFS

이미지·메시·오디오는 Git LFS로 저장합니다. 클론 전에 `git lfs install`을 한 뒤 받습니다. 이 저장소의 로컬 설정에 `filter.lfs.smudge --skip`을 두지 않습니다. 포인터만 받아진 작업 사본에서는 Unity·아트 검사를 하지 않습니다.

```bash
git lfs install
git clone https://github.com/islee23520/seoul-kenshi.git
cd seoul-kenshi
git lfs pull
git lfs checkout
node tools/check-lfs-hydration.mjs
```

## Unity 개발 도구

Unity Remote는 `tools/unity-remote` Git 서브모듈로 관리합니다. 브로커 준비, 프로젝트별 인증 토큰, CLI 및 batchmode Editor 연결은 [Unity Remote 개발 안내](docs/Unity-Remote-Development.md)를 따릅니다.

