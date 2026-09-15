# POC QA 증거 공개 - 2026-09-05

## 결론과 검증 대상

**세션 내부 상태가 연결된 기술 POC이며 전체 게임 완료는 아니다.** 실제 UI의 전투/협상/우회 정산과 귀환 흐름은 관찰됐고, 실제 보존 DLL의 public API 및 순수 UI snapshot 소비자는 **448 assertions / 종료 0**을 기록했다. 아트 완성도와 전투/정산 정보 명확성은 FAIL이다. 생산 코드 수정은 없었다.

- **검증 SHA:** `6f07a94996a1f416cec1a44a3b3844dfb732900f`.
- **게시 기준:** `3a526124ca4667e9162a8e315c0a41fb52f15707` (`3a52612`). 이 기준이나 현재 main을 검증한 결과가 아니다.
- 원본 실행/캡처는 UTC 2026-09-05, 공개 정리와 소비자 재확인은 2026-09-06이다. 재확인도 보존된 이전 DLL에 한정하며 역사적 JSON을 덮어쓰지 않는다.
- Unity 6000.7.0a5 / Windows64 보존 빌드. 당시 194개 출력 해시 불일치 0을 기록했다. 실제 Development 옵션 비트는 미확인이다. 빌드 영수증 전체와 바이너리는 로컬 보존이므로 패키지만으로 전체 빌드 provenance를 독립 재검증할 수 없다.

## 읽는 순서

1. [연속성 종합 판정](REPORT.md), [상태 연결 상세 행렬/API 경계](state/REPORT.md).
2. [실제 UI QA](live-ui/REPORT.md), [입력 기록](live-ui/action-log.md), [독립 시각 검토](live-ui/independent-visual-review.md), [독립 기능 검토](live-ui/independent-functional-review.md).
3. [연속 두 원정 CUA](cua/REPORT.md), [CUA 입력 기록](cua/action-log.md).
4. [역사적 구조화 결과](state/probe-results.json), [사전 기대값](state/expected-before-probe.md), [원본 대응/해시](publication-provenance.json), [공개 준비 검증](VALIDATION.md).

## 증거의 경계

- UI: 13 필수 상태 x 2 해상도 = 26개 셀과 분기 보강 8개. 해상도별 독립 전체 재플레이가 아닌 live resize이다. 수치 보상, 저장, 성능, WebGL 검증이 아니다.
- 연속 CUA: 협상 적용 -> 귀환 -> 재출발 -> 우회 적용 -> 귀환을 같은 프로세스에서 관찰했다. 초기 Start/출발 입력 귀속은 불명확하다. 화면에 캠페인 ID, 자원/평판/파티 수치가 없어 숨은 상태 증명이 아니다.
- DLL 소비자: 동일 ledger/book에서 네 원정과 다섯 번째 출발, 자원/평판 `100/0 -> 95/3 -> 93/2 -> 103/7 -> 88/2`, 중복 정산 무변경과 결정론 재실행을 검사했다. Unity controller 인스턴스/PlayMode/실제 클릭/프로세스 재시작 테스트는 아니다.

CUA 협상/우회 ID는 `result-27c2f047751fa155` / `result-cfa4fb80954e47f0`이고 프로브는 `result-22598d95f05d6605` / `result-b35c5a9d4d290ba6`이다. 관측 전 이력이 같다고 입증되지 않았다. **두 실행을 동일 trace로 합치거나 ID에서 자원 수치를 추정하지 않는다.** 동일 PID나 고정 캠페인 ID만으로 동일 내부 객체를 입증하지도 못한다.

타이틀/인물/아이콘/환경 슬롯은 art-blocked 상태다. 전투의 활성 유닛/턴 식별, 정산의 승패/보상/비용 표시가 부족하고 신도림 미리보기 마커 잘림과 단계 강조 불일치가 관찰됐다. 계산 오류로 단정하지 않는다. 생존 HP 7은 다음 전투에서 HP 10으로 초기화된다. 지속 파티/부상/성장, 전투 시간 전달과 세계 변화가 충분하지 않다. 전체 캠페인/디스크 저장은 당시 모듈의 명시적 비목표이지 이번에 발견한 회귀가 아니다.

외부 캠페인의 BattleContext 부착과 협상 receiver에 외부 우회 result 적용이 public API에서 허용됐다. 현재 controller는 자기 상태로 payload를 생성하므로 실제 UI 오결합 재현은 아니다. `BOUNDARY` 출력은 특성 관찰이며 448 검사의 추가 보안 보장으로 읽지 않는다. D3D12 info-queue 및 GetFrameStatistics CPU timing fallback 경고도 남아 있다. UI 프로세스 종료는 확인됐지만 종료 코드 0은 기록되지 않았다.

## 공개 범위와 제외 이유

[UI 목록](live-ui/canonical-manifest.md), [34개 해시/치수/시점/행동](live-ui/canonical-manifest.json), [CUA 11개 해시/치수](cua/focused-manifest.json)를 제공한다. **PNG는 로컬 보존, 미동봉**이다. `localArtifact`는 원본 저장소 기준 로컬 식별자이지 다운로드 경로나 링크가 아니며 `bundled: false`다. 패키지만으로 이미지 재열람/시각 재심사는 불가능하다. `inspected`와 PASS는 당시 기록이지 새 시각 검토가 아니다.

[행렬](live-ui/matrix.json)의 `independentReview: Lead pending`은 검토 전 원본 값이며 이후 완료된 독립 검토를 함께 읽는다. [빌드 해시 검사](live-ui/hash-verification.json), [UI 종료](live-ui/cleanup.json), [CUA 종료](cua/cleanup.json), [소스/DLL 보존](state/preservation-verification.json)은 당시 영수증이다.

절대 기계/개인 경로는 저장소 상대 식별자 또는 `<tested-checkout>`으로 바꾸고 사용자명을 제거했다. 보고서의 미동봉 파일명은 원본 로컬 자료를 가리킨다. 원본은 수정하지 않았다. 임시 PNG는 커밋 금지 정책 때문에 제외했다. 개인 데스크톱 캡처, 원시 입력/명령/인증 출력, 프로세스/세션 덤프, 비공개 메모는 공개 가치/개인정보 경계 때문에 제외했다. DLL/EXE/캐시/복사한 생산 C#도 제외했다. 중복 텍스트 실행 로그와 빈 성공 compile.log는 구조화 결과/종료 영수증으로 대체했다. 첫 컴파일의 CS0012 누락 참조와 수정 경위는 상세 보고서에 남겼다.

## QA 소비자 재현

[StateProbe.cs](state/StateProbe.cs)는 QA 전용 public API 소비자다. [사전 JSON](state/expected-ids.json)과 [입력 TXT](state/expected-ids.txt) 값은 보존했다. 현재 main에서 새 DLL을 만들어 대체하지 않는다.

Git Bash/Bash 4+, `sha256sum`, 호환 Mono/CSC, 당시 보존 Managed 폴더와 의존 DLL이 필요하다. 검증 당시 Unity 번들 Mono/CSC를 사용했다. [고정 해시](state/managed-assemblies.sha256)는 Core/Foundation과 netstandard를 검사한다. 첫 두 해시는 당시 기록과 일치하고 netstandard는 공개 준비 시 보존 파일에서 추가 기록했다. 바이너리 미동봉으로 clone만으로는 실행 불가다.

실제 로컬 경로로 `UNITY_EDITOR_DATA`, `RETAINED_PLAYER`, `TEMP`를 지정한 뒤 저장소 루트에서 실행한다. `OUT` 부모는 존재해야 하고 `OUT` 자체는 새 디렉터리이며 **게시 worktree 밖**이어야 한다.

```bash
export MONO="${UNITY_EDITOR_DATA}/MonoBleedingEdge/bin/mono.exe"
export CSC="${UNITY_EDITOR_DATA}/MonoBleedingEdge/lib/mono/4.5/csc.exe"
export MANAGED="${RETAINED_PLAYER}/Janseon_Data/Managed"
export OUT="${TEMP}/poc-qa-historical-replay"
bash docs/verification/poc-qa-2026-09-05/state/run-probe.sh
```

[Runner](state/run-probe.sh)는 실패를 pipefail로 전달하고 기존 OUT을 덮어쓰지 않는다. EXE/compile.log/probe-results.log는 외부 OUT에만 쓴다. 성공 표식은 `PROBE_PASS|assertions=448|domainIntegration=true|pureSnapshot=true|liveUI=false|unityTestsRun=false`, 종료 0이다. 한 호출 안에서 같은 시나리오를 두 번 검사하며 sleep/polling은 없다. 새 로컬 로그의 실제 DLL 경로를 공개 파일에 그대로 복사하면 안 된다.

## 검증 SHA 고정 소스 참조

상세 보고서의 줄 번호와 아래 링크는 모두 검증 당시 SHA 기준이다.

- [CampaignDomain: context 부착/다음 출발](https://github.com/islee23520/seoul-kenshi/blob/6f07a94996a1f416cec1a44a3b3844dfb732900f/Game/Assets/Janseon/Core/CampaignDomain.cs#L217-L336)
- [SettlementDomain: exact-once/수신자 검증](https://github.com/islee23520/seoul-kenshi/blob/6f07a94996a1f416cec1a44a3b3844dfb732900f/Game/Assets/Janseon/Core/SettlementDomain.cs#L278-L471)
- [BattleDomain: 매 전투 새 유닛](https://github.com/islee23520/seoul-kenshi/blob/6f07a94996a1f416cec1a44a3b3844dfb732900f/Game/Assets/Janseon/Core/BattleDomain.cs#L234-L312)
- [Controller: 전투/정산/귀환](https://github.com/islee23520/seoul-kenshi/blob/6f07a94996a1f416cec1a44a3b3844dfb732900f/Game/Assets/Janseon/Foundation/UI/PocCoreLoopController.cs#L211-L401)
- [Snapshot: 정산/활성 유닛 표시](https://github.com/islee23520/seoul-kenshi/blob/6f07a94996a1f416cec1a44a3b3844dfb732900f/Game/Assets/Janseon/Foundation/UI/GameplayUiSnapshot.cs#L164-L299)
- [당시 비목표](https://github.com/islee23520/seoul-kenshi/blob/6f07a94996a1f416cec1a44a3b3844dfb732900f/ToDo.md#L40-L43), [POC 전술 입력 허용 범위](https://github.com/islee23520/seoul-kenshi/blob/6f07a94996a1f416cec1a44a3b3844dfb732900f/Design.md#L188-L191).
