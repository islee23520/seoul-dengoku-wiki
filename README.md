# 서울:전국

**붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4X + RPG. 제품 목표 전투는 토탈워식 부대 지휘이고, 인물은 애니메이션풍 정비율입니다. 현 Unity는 실시간 진형·카드 POC이며, 그 구현을 목표로 쓰지 않습니다.**

이 저장소는 Unity 6.7 기반 프로젝트와 게임 로직 문서의 원본을 관리합니다.

작업을 시작하려면 [CONTRIBUTING.md](CONTRIBUTING.md)에서 도메인을 고릅니다. 이슈 규칙과 라벨은 [CONTRIBUTING.md](CONTRIBUTING.md)입니다. 인물을 넣을 때는 [인물 등록 템플릿](LORE/characters/Cast-Registration-Template.md)을 씁니다.

## 현재 상태

2026-09-19 기준입니다. 제품 목표는 [Intent.md](Intent.md) 결정 11의 부대 지휘입니다. 새 전투는 문서 계약이며 구현됐다고 쓰지 않습니다. Unity 런타임은 계속 `Unity POC 통합 코어 루프`입니다. 코어와 PlayMode 검증까지이며, 생성 아트 연결과 최종 수용 게이트는 열려 있습니다. 목표 카메라는 질문 시간 초과 뒤 채택한 3D 자유 지휘 기본안이고, 닫힌 전투에서만 일시정지 중 명령을 허용합니다. 둘 다 소유자가 직접 고른 결정이 아닙니다.

브라우저에서 코어 루프를 직접 돌리는 웹 POC는 [`GAME/play/`](GAME/play/)입니다. 거점 → 427동 목적지 → 조우(협상·우회·전투) → 진형 → 실시간 카드 전투 → 정산 한 번 → 귀환. 이 루프의 귀환은 POC 화면입니다. 공개 주소는 `https://seoul-dengoku.linalab.io/play/`이고, 구 주소 `https://seoul-kenshi.vercel.app/play/`는 전환 검증 후 제거합니다. 이동 비용은 직선 거리 웹 규칙이고 Unity 코어 전체가 아닙니다. PR [#90](https://github.com/islee23520/seoul-kenshi/pull/90)으로 main에 들어왔습니다.

서울 지역 총람은 [`LORE/regions/`](LORE/regions/README.md)와 [`GDD/system-design/regions/`](GDD/system-design/regions/)입니다. 선택 경계는 2026-07-01 행정동 25구·427동입니다. OSM 스냅샷은 2026-09-04T23:00:00Z입니다. 역 334는 이동 그래프이지 서울 면적의 증명이 아닙니다. 부대 지휘 설계 템플릿은 [`GDD/system-design/total-war-ui/`](GDD/system-design/total-war-ui/)이며 게시 경로는 `/total-war-ui/`입니다.

들어온 구현:

- Unity `6000.7.0a5`. 고정 직교 아이소메트릭 장르 계약은 결정 10으로 폐기됐고, 현 POC 전투는 실시간 진형·카드다
- Foundation: `Bootstrap.unity` App scope/FSM, 배타적 `MainTitle`/`Foundation` 화면, VContainer `1.19.0`
- POC 코어 루프: 영등포–신도림–구로 세 역, 교섭·우회·전투·정산·복귀. batchmode PlayMode에서 동일 seed 재현과 중복 정산 거부
- 전투 Core: 30Hz 실시간 진형·카드 규칙 `rtfc-owner-cards-v2` ([#77](https://github.com/islee23520/seoul-kenshi/issues/77)). POC이며 결정 11 목표가 아니다
- 화면: uGUI(Canvas)+TMP ([#59](https://github.com/islee23520/seoul-kenshi/issues/59)). 제품 경로에 UI Toolkit 없음
- Area 1 데이터 코어(ScriptableObject + VContainer) ([#75](https://github.com/islee23520/seoul-kenshi/issues/75))
- 진형 편집 PlayMode 경로 ([#76](https://github.com/islee23520/seoul-kenshi/issues/76))
- 웹 코어 루프 POC: `GAME/play/` (2026-09-14, [#90](https://github.com/islee23520/seoul-kenshi/pull/90))
- 서울 지역 총람: 행정동 427동 저작·검증 파이프라인 `TOOL/tools/regions/` (2026-09-13). Unity 내부 공간 아님

남은 열린 이슈:

| 이슈 | 지금 상태 |
|---|---|
| [#8](https://github.com/islee23520/seoul-kenshi/issues/8) 타이틀 시각 수용 | 코드는 들어갔고 소유자 육안 승인 대기 |
| [#23](https://github.com/islee23520/seoul-kenshi/issues/23) UI kit·아이콘·타일 | 기술 검사는 됐고 화면 승인은 남음 |
| [#58](https://github.com/islee23520/seoul-kenshi/issues/58) TOS식 SD 캐릭터 | 결정 10으로 취소. 목표 미술은 애니메이션풍 정비율, POC는 오드랜드 as-is |
| [#26](https://github.com/islee23520/seoul-kenshi/issues/26) 승격 에셋만 슬롯 연결 | #8·#23·#58·#78에 막힘 |
| [#27](https://github.com/islee23520/seoul-kenshi/issues/27) 최종 수용 게이트 | #26 이후 |
| [#78](https://github.com/islee23520/seoul-kenshi/issues/78) 오드랜드 연결 금지 | 소유자 육안 승인 0건 |
| [#41](https://github.com/islee23520/seoul-kenshi/issues/41) 서사 디렉션 합의 | 제안만, 구현 아님 |
| [#13](https://github.com/islee23520/seoul-kenshi/issues/13) 에픽 | 위 잔여가 닫힌 뒤에만 닫힘 |

생성 아트 슬롯은 아직 런타임 화면에 연결되지 않았습니다. 16국 캠페인, 저장, 외교, 공성은 이 모듈 밖입니다.

## 문서

게임 설계 원본은 [`GDD/Home.md`](GDD/Home.md)와 [`GAME-LOGIC/`](GAME-LOGIC/)에 있습니다. 세계관은 [`LORE/`](LORE/README.md)입니다. 로컬에서는 `npm run docs:dev`로 VitePress를 띄우고, 공개 표면은 [https://seoul-dengoku.linalab.io](https://seoul-dengoku.linalab.io)입니다. GitHub Wiki는 유지하지 않습니다.

이슈를 열거나 작업을 추적할 때는 [`CONTRIBUTING.md`](CONTRIBUTING.md)를 따릅니다. 웹에서는 YAML 이슈 폼만 열고, 빈 이슈는 쓰지 않습니다.

브라우저에서 Unity Game View와 scene object를 확인하는 설치·실행 절차는 [`Unity Remote 안내`](TOOL/docs/Unity-Remote.md)에 있습니다.

## 클론과 Git LFS

이미지·메시·오디오는 Git LFS로 저장합니다. 클론 전에 `git lfs install`을 한 뒤 받습니다. 이 저장소의 로컬 설정에 `filter.lfs.smudge --skip`을 두지 않습니다. 포인터만 받아진 작업 사본에서는 Unity·아트 검사를 하지 않습니다.

```bash
git lfs install
git clone https://github.com/islee23520/seoul-kenshi.git
cd seoul-kenshi
git lfs pull
git lfs checkout
node TOOL/tools/check-lfs-hydration.mjs
```

## Unity 개발 도구

Unity Remote는 `TOOL/unity-remote` Git 서브모듈로 관리합니다. 브로커 준비, 프로젝트별 인증 토큰, CLI 및 batchmode Editor 연결은 [Unity Remote 개발 안내](TOOL/docs/Unity-Remote-Development.md)를 따릅니다.

