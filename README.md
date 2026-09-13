# 잔선: 서울

**붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4X + RPG. 전투는 4방향 격자 위의 실시간 진형·카드 전투입니다.**

이 저장소는 Unity 6.7 기반 프로젝트와 게임 로직 문서의 원본을 관리합니다.

## 현재 상태

2026-09-14 기준입니다. 지금 모듈은 `Unity POC 통합 코어 루프`입니다. Unity 쪽은 코어와 PlayMode 검증까지이며, 생성 아트 연결과 최종 수용 게이트는 열려 있습니다.

브라우저에서 코어 루프를 직접 돌리는 웹 POC는 [`play/`](play/)입니다. 거점 → 427동 목적지 → 조우(협상·우회·전투) → 진형 → 실시간 카드 전투 → 정산 한 번 → 귀환. 주소는 `https://seoul-kenshi.vercel.app/play/`입니다. 이동 비용은 직선 거리 웹 규칙이고 Unity 코어 전체가 아닙니다. PR [#90](https://github.com/islee23520/seoul-kenshi/pull/90)으로 main에 들어왔습니다.

들어온 구현:

- Unity `6000.7.0a5`, 고정 직교 아이소메트릭 장르 계약
- Foundation: `Bootstrap.unity` App scope/FSM, 배타적 `MainTitle`/`Foundation` 화면, VContainer `1.19.0`
- POC 코어 루프: 영등포–신도림–구로 세 역, 교섭·우회·전투·정산·복귀. batchmode PlayMode에서 동일 seed 재현과 중복 정산 거부
- 전투 Core: 30Hz 실시간 진형·카드 규칙 `rtfc-owner-cards-v2` ([#77](https://github.com/islee23520/seoul-kenshi/issues/77))
- 화면: uGUI(Canvas)+TMP ([#59](https://github.com/islee23520/seoul-kenshi/issues/59)). 제품 경로에 UI Toolkit 없음
- Area 1 데이터 코어(ScriptableObject + VContainer) ([#75](https://github.com/islee23520/seoul-kenshi/issues/75))
- 진형 편집 PlayMode 경로 ([#76](https://github.com/islee23520/seoul-kenshi/issues/76))
- 웹 코어 루프 POC: `play/` (2026-09-14, [#90](https://github.com/islee23520/seoul-kenshi/pull/90))

남은 열린 이슈:

| 이슈 | 지금 상태 |
|---|---|
| [#8](https://github.com/islee23520/seoul-kenshi/issues/8) 타이틀 시각 수용 | 코드는 들어갔고 소유자 육안 승인 대기 |
| [#23](https://github.com/islee23520/seoul-kenshi/issues/23) UI kit·아이콘·타일 | 기술 검사는 됐고 화면 승인은 남음 |
| [#58](https://github.com/islee23520/seoul-kenshi/issues/58) TOS식 SD 캐릭터 | 기존 placeholder 폐기, 재작업 미착수 |
| [#26](https://github.com/islee23520/seoul-kenshi/issues/26) 승격 에셋만 슬롯 연결 | #8·#23·#58·#78에 막힘 |
| [#27](https://github.com/islee23520/seoul-kenshi/issues/27) 최종 수용 게이트 | #26 이후 |
| [#78](https://github.com/islee23520/seoul-kenshi/issues/78) 오드랜드 연결 금지 | 소유자 육안 승인 0건 |
| [#41](https://github.com/islee23520/seoul-kenshi/issues/41) 서사 디렉션 합의 | 제안만, 구현 아님 |
| [#13](https://github.com/islee23520/seoul-kenshi/issues/13) 에픽 | 위 잔여가 닫힌 뒤에만 닫힘 |

생성 아트 슬롯은 아직 런타임 화면에 연결되지 않았습니다. 16국 캠페인, 저장, 외교, 공성은 이 모듈 밖입니다.

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

