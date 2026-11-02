# PR307 정식 수정 요청 후속 — 현재 경계와 미해결 Unity 검증

[문서] 대상은 [소유자 리뷰5341436047](https://github.com/islee23520/seoul-dengoku/pull/307#pullrequestreview-5341436047), 검토 head `0b9d82f1794ea18745add3bc8382590a6d72fffe`다. 2026-09-29에 원격 권위와 실제 코드를 다시 대조했다. **경계 문서 보강은 반영했지만 실제 Unity EditMode XML 요구는 미해결이다.** 이 후속 기록은 PR 승인·#281 완료·새 개인 판정 전투 구현을 뜻하지 않는다.

## 권위와 구현 버전

| 대상 | 조회한 고정 버전 | 의미 |
|---|---|---|
| GAME main | `09756517b1ac2e9b0e81e0be08e0cf1776a5bebd` | 실제 통합 기준. Intent 본문은 결정12까지이며 Core는 기존 POC |
| main의 GDD gitlink / GDD main | `95bfbf37fad9b40d0e731b670fa1543c6a28ebd6` | 현재 통합된 문서 포인터. GDD31/33 병합을 의미하지 않음 |
| [GAME306](https://github.com/islee23520/seoul-dengoku/pull/306) | `f732ab2fe8b36e0dc48add4f4bbb0f6e65d8b705` | OPEN 제안에 기록된 소유자 결정13·14. 그 GDD gitlink는 `83d33f1d8b4d11c60916b5b4dc9b91d62491335a`로 현행 main 포인터와 다름 |
| [GDD33](https://github.com/islee23520/seoul-dengoku-gdd/pull/33) | `97e504adf8411208e3b03d4e99b9e4af1a41b23a` | OPEN, GDD31을 base로 한 추가 방향. GURPS4 판정·노랜드 진행/UI, 교전 전체 명령 잠금 등. 현재 main의 구현 계약이 아님 |
| 이 PR의 C#/NUnit 입력 | `0b9d82f1794ea18745add3bc8382590a6d72fffe` | 기존 호환 브리지와 관련 NUnit. 이번 후속은 C#·제품 asset을 바꾸지 않음 |

소유자가 명시한 결정13·14와 GDD33 방향은 다음 구현의 기준으로 따른다. 아직 병합되지 않았다는 이유로 옛 목표로 되돌리지 않으며, 설계 방향 승인과 실제 Core API·수치·제품 데이터 승인을 구분한다. GAME306의 GDD 포인터에 대한 문서 보존 검사는 [PR308의 별도 도구 증거](https://github.com/islee23520/seoul-dengoku/pull/308)가 담당한다.

`git diff 0b9d82f 09756517 -- GAME/Assets/Janseon/Core GAME/Assets/Janseon/Foundation/UI/PocCoreLoopController.cs GAME/Packages GAME/ProjectSettings` 결과는 빈 diff다. 새 개인 판정 DTO/API가 최신 main에 생겼다고 가정할 근거는 없다. 원격 `BattleSim.Open`도 기존 formation/roster/hero/사기 상태를 구성함을 직접 확인했다.

## 폐기와 연결 경계

| 기존 표면 | 이번 처분 | 새 개인 판정으로 연결할 조건 |
|---|---|---|
| `BattleSetupDefinition.power/range*/morale/attackCooldownSeconds` | POC 호환 필드로 유지. 제품 목표 수치 권위로 사용하지 않음 | 승인된 무기·방어구·기술·몸 상태·기분 snapshot 및 #286의 명시 schema/version 수신. 기존 필드 개명·0/default 대입 금지 |
| `BattleSetupRepository.Project`와 `Create` | 기존 정의의 검증·복사·HP 대조·POC Open만 수행 | 새 Core의 입력·거부 타입·역할별 ID/인원 규칙을 받은 후 별도 투영을 구현하고 신규 negative tests로 검증 |
| 내부 `BattleSim.Open` 및 외부 Open→Attach | 기존 유효성 검사 성공은 기존 POC에 한정 | #285 실제 조우/controller가 승인된 setup과 최신 context를 주입하고 성공 상태만 채택. 실패 시 캠페인/ledger 불변을 실 Unity에서 관찰 |
| `rulesVersion` 문자열 일치 | 현재 문자열 검사 유지 | 의미 호환성·지원 schema/version은 #286 계약으로 별도 판정. 같은 문자열만으로 GURPS4 공통 판정을 보증하지 않음 |
| 한 편 전체≤20, roster 안의 지휘관 | 현재 POC 제약으로 명시 | 병졸 한 분대≤20·별도 영웅·임시 분대장과 ID 공간을 #286에서 확정. 영웅을 병졸로 복제해 현 검사를 우회하지 않음 |
| POC driver pause/queue, Attach Tick 불변 | 기존 표면·테스트의 역사적 범위 유지 | 결정14 시간 이동, 교전 시작부터 끝까지 명령 잠금, 전투 후퇴와 결과 정산까지 이동 잠금은 새 Core/controller 통합의 별도 수용 대상 |
| 신병 결과·정확히 한 번 정산 | 이 Data 브리지의 구현 범위 밖 | #287 개인 ID/부상·출혈·감염·포획·항복·도주 및 exact-once key 계약 수신 뒤 입력부터 결과까지 추적 |

위 표의 후속 거부 조건은 **현재 런타임에 새 검사기가 구현됐다는 뜻이 아니다.** 새 계약과 #298/#299의 승인된 분대·장비·위치가 오기 전에는 제품 asset과 호출부를 연결하지 않는다. 상세 입력 소유권은 [기존 계약](../battle-authoring-followup-20260928/contract.md)에 있으며, 이 문서가 조회 버전과 최신 실행 상태를 보완한다.

## 실제 실행 환경 결과

[문서] 이 호스트에서 `unity`/`Unity` CLI, 일반 Editor·Hub 설치 경로, Spotlight Editor/Hub 검색, Unity 관련 환경변수 이름을 확인했다. 확인한 경로에는 설치본이 없었고, 기본 라이선스 파일도 없었다. 이는 모든 설치 위치·라이선스 권리의 전수 감사가 아니다. 저장소 가이드의 `windows` SSH 별칭은 이 호스트에 구성되어 있지 않고, 소유자 기록의 `/Volumes/gameWorkspace`도 없다. GAME 저장소의 GitHub Actions 목록에는 Unity 실행 workflow가 없다.

공식 Unity release API는 `6000.7.0a5(a15235a53881)` ARM64 설치본을 제공한다. 버전 자체가 없어 차단된 것은 아니다. 기존에 인증·라이선스가 준비된 실행 환경을 확보하지 못했다. GitHub push 권한은 Unity 라이선스나 소유자 배포 서버 접근 권한을 제공하지 않는다.

| 확인 | 실제 결과 |
|---|---|
| 현재 소스 LFS 사전 검사 | exit1, filesScanned1062, pointers120, errors0 |
| 서브모듈 | GDD/document-renderer 초기화; unity-remote/WIKI 미초기화 |
| 통상 pinned Editor 경로 실행 시도 | shell exit127, executable 없음. **Editor는 시작되지 않음** |
| 실제 Unity compile/EditMode | **NOT RUN** |
| NUnit XML / Editor log | **생성되지 않음**. 별도 [launcher-probe.log](launcher-probe.log)는 shell 실패 기록 |
| 기존 .NET62·architecture | 과거 부분 증거 그대로. 이번 문서 수정으로 재실행하거나 Unity 증거로 승격하지 않음 |

실패한 최초 launcher probe에는 소스 확인 전 잘못 추정한 fixture 이름이 포함돼 있었다. 그 명령은 Editor가 없어 테스트 필터에 도달하지 않았다. 아래는 실제 소스에서 확인한 기존 두 fixture이며, 새로 실행됐다고 주장하지 않는다.

## 남은 실제 실행

라이선스가 활성화된 정확한 Editor와 깨끗한 전용 checkout에서 먼저 submodule·LFS 검사를 통과해야 한다. 컴파일 성공 뒤 아래 fixture를 batchmode로 실행한다. `UNITY_EDITOR`는 실제 확인한 executable 경로여야 한다.

```sh
"$UNITY_EDITOR" -batchmode -nographics -projectPath "$PWD/GAME" \
  -runTests -testPlatform EditMode \
  -testFilter 'Janseon.Foundation.Tests.RealtimeBattleSimTests;Janseon.Tests.EditMode.CampaignLoopTests' \
  -testResults "$PWD/.omo/evidence/battle-review-20260929/editmode.xml" \
  -logFile "$PWD/.omo/evidence/battle-review-20260929/editor.log"
```

18개 추가 NUnit 사례가 개별 이름으로 포함됐는지, 실행>0·실패0·skip0인지 XML과 exit code로 대조해야 한다. 기존 fixture 전체 건수가18이라는 뜻은 아니다. 이 실행은 기존 호환 브리지 검증이며, 승인 데이터의 실제 조우→Open→Attach 및 #286 새 개인 판정/자동·수동 공통 규칙 통합은 별도 증거가 필요하다.

**미해결:** 실제 Unity6000.7.0a5 XML와 Editor log, #298/#299 승인 입력, #285/#286/#287 새 계약·호출부 통합. PR307은 Draft를 유지하며 소유자 수정 요청이 모두 해소됐다고 표시하지 않는다. 이 후속에서 생성한 Unity/원격 프로세스는 없다.
