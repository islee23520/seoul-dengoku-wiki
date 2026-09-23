# 열린 결정 목록

기준 커밋: `origin/main` `e1895238` (PR #213 머지 `93854514` 이후 WEB 서브모듈 분리). 이 페이지는 새 설계를 만들지 않는다. 이미 정본에 적힌 미잠금·미이관만 네 칸으로 다시 묶는다.

세션 포인터 `01a0bd33-a52f-7896-a7b5-eb87a89237dd`는 이 기기 Codex·OMO 트랜스크립트에 없다. 아래 출처는 `origin/main` 파일과 인터뷰 장부다.

구현 주장이 아니다. Unity 요소 이름·바인딩·데이터 식별자를 여기서 만들지 않는다. 값이 없으면 `미정`으로 두고 흔한 게임 수치를 채우지 않는다. 규칙은 [데이터 카탈로그](/design/Data-Catalog-and-Schema), [한국어 용어](/design/Korean-Terminology-and-Naming)와 같다.

## 칸 구분

| 칸 | 뜻 |
|---|---|
| 소유자 미확인 | 질문이 열렸거나 시간 초과로 기본안만 있다. 소유자가 직접 고른 값이 아니다 |
| 설계 제안 | 규칙 문서가 구조만 제안했고 사용자 확인·데이터 사전 등록 전이다 |
| 정본 미이관 | 인터뷰에서 확정됐으나 이 `origin/main` 팁에는 아직 없다 |
| 수치 금지 | 잠그지 말라고 이미 적힌 항목. 이 목록이 숫자를 만들지 않는다 |

닫힌 것: 캠페인 POV·권한 전이는 PR #213으로 `GDD/system-design/campaign-pov-authority/`에 들어왔다. 그 도식은 구현 UI가 아니다. 수치·클래스 이름·임시 분대장 권한은 그 도식이 새로 정하지 않는다.

## 소유자 미확인

| ID | 항목 | 현재 상태 | 정본 |
|---|---|---|---|
| OD-CAM | 전투 카메라 | 질문 시간 초과 뒤 채택한 3D 자유 지휘 기본안(팬·오빗·줌). 각도·시야각 수치는 없다. 소유자 직접 결정이 아니다 | [Intent.md](/design/Intent) 결정 11, [Design.md](/design/Design) |
| OD-PAUSE | 전투 일시정지 | 그 파티의 닫힌 전투만 멈추고 정지 중 미리보기·확정을 받는다. 공유 캠페인과 다른 파티는 흐른다. 감속·배속·명령 큐는 없다. 소유자 직접 결정이 아니다 | [Intent.md](/design/Intent) 결정 11, [Design.md](/design/Design), [실시간 부대 지휘 전투](/rules/Realtime-Formation-Card-Battle) |

같은 문장은 [홈](/design/Home), [설계 요구](/design/Design-Requirements), [이 게임이 뭔지](/design/Game-Thesis), [개발 로드맵](/design/Development-Roadmap), [ToDo.md](/design/ToDo)에도 반복된다. 기본안을 소유자 확정으로 올리지 않는다.

## 설계 제안

출처는 [영웅 분대와 동시 전략 턴](/rules/Hero-Squads-and-Simultaneous-Turns) 결정 상태표의 `설계 제안` 행이다. 위키 인물 설명에 제안 클래스를 자동 배정하지 않는다.

| ID | 항목 | 현재 상태 |
|---|---|---|
| OD-CLASS | 여섯 클래스 이름과 분류 규칙 | 전열수호, 돌파선도, 전장조율, 회복지원, 경로공작, 원정중추는 데이터 구조 검토용 제안이다. 영웅마다 주 전투 클래스 하나를 둘지 역할 태그만 조합할지도 최종 데이터 설계에서 확인한다 |
| OD-TEMPLEAD | 임시 분대장의 세부 권한 | 지휘관 상실 시 병졸 중 한 명을 선출한다. 정식 영웅 지휘관과 같은 클래스·캠페인 역할을 자동으로 받지 않는다는 점만 잠겼다. 세부 권한은 미정이다 |
| OD-MOVE | 이동력·태세·통제권 수치 | 턴마다 유한한 이동력을 둔다. 수치는 그 문서가 잠그지 않는다 |
| OD-TURNTIME | 동시 턴 제한 시간 | 최대 10인 동시 계획·미응답 AI 대행은 확정이다. 제한 시간 길이는 제안으로 남는다 |
| OD-STANCE | 주둔·야영 태세 | 통상 행군·강행군·매복은 표에 있다. 주둔과 야영은 `(제안)`이다 |

## 정본 미이관

소유자가 고른 계약이다. 이 팁의 `GDD/adr/`에는 ADR-001…007만 있다. ADR-008은 없다. 미결정으로 다시 열지 않는다.

| ID | 묶음 | 상태 | 다음 표면 |
|---|---|---|---|
| OD-SESS | 로컬 우선 Steam 세션·월드 생명주기 | 인터뷰에서 호스트 세션, 복구 열쇠, 계보 키, fork-allowed 체크포인트, Steamless LAN, DRM 실패 시 멀티플레이 차단 등을 확정했다. 문서 초안은 열린 PR #212 `docs/local-first-steam-sessions`에 있다 | [PR #212](https://github.com/islee23520/seoul-dengoku/pull/212). 머지 전 ADR-008을 이 목록이 대체하지 않는다 |
| OD-PRESET | 착생 시작 프리셋 재해석 | 인터뷰에서 정체성 유지, 결핍·압박만 재해석, 점유 동료 제외, 원정 재동의, 분쟁 자산 봉인 운송 등 17항을 확정했다. [시작 프리셋](/world/Starting-Presets)은 아직 예전 설계 제안·수치 목표다 | 정본 이관 PR. 이 페이지가 프리셋 숫자를 고치지 않는다 |
| OD-POV | 캠페인 POV·권한 UX | 인터뷰 6항은 PR #213으로 청사진이 들어왔다. 남은 것은 영웅 분대 문서의 설계 제안(OD-CLASS, OD-TEMPLEAD)이지 POV 자체 미결이 아니다 | [캠페인 POV와 권한](system-design/campaign-pov-authority/README.md) |

## 수치 금지

아래는 정본이 만들지 말라고 잠근 값이다. 기본값을 추정하지 않는다.

| ID | 항목 | 잠금 문장 | 정본 |
|---|---|---|---|
| OD-ARMYCAP | 전체 분대 수·영웅 수·군단 상한 | 병졸 한 분대 최대 20명만 잠겼다. 나머지 상한은 미정이다 | [Intent.md](/design/Intent) 결정 11, [Design.md](/design/Design), [설계 요구](/design/Design-Requirements), [실시간 부대 지휘 전투](/rules/Realtime-Formation-Card-Battle) |
| OD-SQUADMIN | 분대 최소 인원 | 이 문서가 정하지 않는다 | [실시간 부대 지휘 전투](/rules/Realtime-Formation-Card-Battle) |
| OD-FOV | 카메라 각도·시야각 | 새로 잠그지 않는다 | [Intent.md](/design/Intent), [Design.md](/design/Design) |
| OD-CARDNUM | 사기 임계 | 결정 3 미결 수치는 결정 11이 새 목표에서 만들지 말라고 주석했다 | [Intent.md](/design/Intent) 결정 3 대체 주석 |
| OD-CAPTURE | 새 포획 확률·정원 | 결정 11이 만들지 않는다 | [Intent.md](/design/Intent) 결정 11 |

온라인 세션 상한 10은 동시 참여 플레이어 수다. 영웅 수·분대 수·팩션 수 상한이 아니다.

## 닫힌 인접 항목

- 제품 목표 전투는 토탈워식 부대 지휘다. 영웅 직접 조작은 목표에 포함하지 않는다 (결정 11).
- 플레이어는 국가가 아니라 지금 조종하는 살아 있는 한 인물이다. 캠페인 시점은 그 인물의 위치와 알려진 정보에 묶인다 (PR #213).
- 병졸 분대 최대 20명, 이동 분대에 영웅 지휘관, 본체 위치 하나, 최대 10인 동시 턴은 사용자 확정이다.
- 로컬 QA 서버는 만들지 않는다. 검토는 원격 빌드를 따른다.

## 다음 질문 순서

플레이 타임라인 앞쪽이 먼저다. 한 번에 하나만 고른다.

1. OD-CAM / OD-PAUSE — 기본안을 소유자 확정으로 올릴지, 다른 카메라·정지 규칙을 쓸지
2. OD-SESS — PR #212 머지 여부. 이 목록이 ADR 본문을 대신 쓰지 않는다
3. OD-PRESET — 확정 17항을 `Starting-Presets.md`와 여정 문서에 옮길지
4. OD-CLASS / OD-TEMPLEAD / OD-MOVE / OD-TURNTIME / OD-STANCE — 영웅 분대 제안 잠금
5. OD-ARMYCAP — 군단·분대·영웅 상한을 둘지, 계속 미정으로 둘지

새 전투 수치·Unity 이름은 이 순서의 밖이다.
