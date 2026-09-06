> 공개용 역사적 보고서. 검증 SHA는 `6f07a94996a1f416cec1a44a3b3844dfb732900f`이며 게시 기준 `3a52612` 검증이 아니다. [패키지 범위](README.md)를 함께 읽는다.

# 게임 플레이 연속성 검증 결과

대상: `6f07a94996a1f416cec1a44a3b3844dfb732900f`

## 결론
단순 화면 연결만은 아니다. 세션 내부 캠페인/조우/전투/정산/다음 원정의 최소 상태 연결은 실행으로 확인됐다. 그러나 장기 파티 상태, 플레이어가 이해할 결과 표시, 전략적 성장까지 연결된 전체 게임으로 판정할 수는 없다.

## 증거별 경계
- `state/REPORT.md`, `state/probe-results.json`: 실제 배포 DLL의 public Core API와 순수 Foundation snapshot을 실행. 사전 기대값 기준 448 assertions, 최종 종료 0. Unity controller 실인스턴스/PlayMode 실행은 아님.
- `cua/REPORT.md`, `cua/action-log.md`: 동일 PID 913372/시작 시각에서 협상 정산 -> 귀환 -> 재출발 -> 우회 정산 -> 귀환을 실제 입력으로 관찰. 수치/캠페인 ID는 화면에 없어 UI에서 검증 불가.
- 리드는 controller 전체와 재출발/정산/전투 초기화 코드를 읽고, 협상 적용/다음 원정/우회 적용의 새 PNG를 직접 확인했다.
- CUA의 초기 시작/출발 일부는 입력 귀속이 불명확하여 제외했다. 실제 정산 ID는 프로브와 다르며, 관측 전 이력이 같다고 증명되지 않았다. 두 실행을 동일 trace로 합치거나 UI 수치를 추정하지 않는다.

## 연결 판정
| 연결 | 판정 | 근거 |
|---|---|---|
| UI 입력 -> 캠페인 명령 | 소스 연결 + 실제 UI 전이 확인 | PocCoreLoopController.cs:110-128,150-240,367-401; CUA action log |
| 캠페인 -> 전투 context -> 결과 -> 정산 | 정상 public API 경로 실행 확인 | state probe; controller wiring은 소스 추적 |
| 정산 -> 자원/평판 누적 -> 귀환/다음 출발 | Core 실행 확인, UI 수치 검증 불가 | 100/0 -> 95/3 -> 93/2 -> 103/7 -> 88/2, 다섯 번째 출발도 88/2 |
| 중복 정산 | Core 실행 확인 | 즉시/후속 원정에서 이전 결과 재시도, 상태/원장/수치 무변경 |
| 이전 LastSettledResult 재사용 위험 | 정상 다음 출발에서 방지됨 | CampaignDomain.cs:327 SettlementApplied=false; controller:294 guard |
| 부상/생존 인물 -> 다음 전투 | 미구현 | BattleDomain.cs:262-282 매 전투 고정 유닛/최대 HP 초기화; 생존 HP7 -> 다음 HP10 실행 관찰 |
| 전투 소요시간/거점 변화 -> 세계 | 부분 또는 미구현 | SettlementDomain.cs:418-424 tick 1 증가, POC control graph 변경 없음 |
| 자원/평판 -> 성장/선택 확장 | 제한적 | context/hash에 포함되지만 지출 가능 조건/장비/해금/파티 성장 시스템 없음 |
| 수동 전술 선택 | 제한적 | controller:249-282,437-553 첫 합법 명령 자동 선택; Design.md:191 POC 허용 |
| 재실행/디스크 저장 | 이번 모듈 명시적 비목표 | ToDo.md:40-43; 실제 재시작 검증 안 함 |

## 추가 API 결합 취약점
다른 campaign의 BattleContext attach와 협상 receiver에 다른 campaign의 우회 result 적용이 public API에서 허용되는 것을 재현했다. CampaignDomain.cs:217-267 / SettlementDomain.cs:369-397. 현재 controller는 자기 context/result를 생성하므로 실제 UI 오결합으로 재현된 것은 아니다. 다중 세션/외부 어댑터 연결 전 소유권 검증이 필요하다.

## 최종 완료 기준에 대한 판단
현재는 상태가 연결된 기술 POC이며 전체 플레이 품질/제품 완료는 아니다. 특히 상태 수치를 플레이어에게 보이지 않고, 전투 결과가 지속 파티/세계 변화로 충분히 이어지지 않는다. 이전 UI 흐름 PASS를 전체 게임 PASS로 사용할 수 없다. 전체 캠페인/저장은 현재 계약 밖이므로 회귀 버그가 아닌 향후 범위 결정 사항이다.

## 정리
CUA 소유 플레이어 종료, 기존 daemon/사용자 프로세스 보존 (`cua/cleanup.json`). 프로브는 종료 0, 소스/DLL 변경 없음 (`state/preservation-verification.json`). 생산 코드 수정/커밋/머지/외부 게시 없음. 이번 요청은 검증이므로 발견 사항을 보고하며 자동 수정하지 않았다.
