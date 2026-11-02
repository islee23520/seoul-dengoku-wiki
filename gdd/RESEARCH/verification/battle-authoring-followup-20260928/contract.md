# #281 후속 입력·소유권·거부·수용 계약

[문서] 2026-09-28 디렉터 [후속 평가](https://github.com/islee23520/seoul-dengoku/issues/281#issuecomment-5871838293)와 [이슈 본문](https://github.com/islee23520/seoul-dengoku/issues/281)을 다시 읽고 `d9c9f6488a31993930290b6f79bb4115bf483f83`의 실제 API와 대조했다. 재조회 원문은 [director-comment.json](director-comment.json), [issue-281.json](issue-281.json)에 보존한다. 조회 명령·시각은 [run-manifest.json](run-manifest.json)에 있다.

이번 수정은 **기존 POC Data 브리지의 후속 인계 문서와 재검증 증거**다. 새 Core DTO/API, 게임 규칙, 제품 수치, `.asset`, 호출부를 구현하지 않는다. 기존 복사·명시 오류·상처 HP 보존 경계와 과거 검증 기록을 보존한다. #281 전체 완료, PR #307의 병합 승인, Unity PASS를 뜻하지 않는다.

## 1. 승인 원천과 역할

- #298: 신종목(K1009)·강남구청 출발 방향은 디렉터 지시다. 병졸 명단/인원/장비/태세, 적, 전장·목표·퇴각의 구체 데이터 승인과는 구분한다. 테스트 fixture의 숫자와 ID는 제품 입력이 아니다.
- #299: 폐쇄 통신창고의 역·지역은 승인 대기다. 후보 역을 확정 노드로 투영하지 않는다. #298/#299 승인 근거 URL·승인 범위·정본 revision·실제 그래프 ID를 함께 확보한 뒤 해당 제품 `.asset`을 Unity API로 저작한다. 이 문서는 승인 요청을 대신하거나 후보를 고르지 않는다.
- Steven/#281: Data/Authoring, Data/Repositories와 관련 EditMode 입력 검증·복사·거부 경계. 현재 후속 작업 범위는 이 증거 디렉터리뿐이다.
- 소유자/#286: 새 개인 판정 Core 계약, 판정 표/수치, 자동·수동 공통 판정, 교전 전 지시·교전 시작부터 종료까지 부대 명령 잠금·전투 전체 후퇴.
- 소유자/#285: 실제 조우 선택, 승인 setup 선택·주입, `PocCoreLoopController` 인계, 캠페인 상태 채택과 전투 중 이동 잠금의 통합.
- 소유자/#287: 전투 후 부상·출혈·감염·포획·항복·도주의 인물별 정산과 정확히 한 번 반영.
- #278 환경 담당: LFS·서브모듈·pinned Editor·라이선스/모듈 선검증. 이 작업에서는 설치·hydration·Unity 실행을 하지 않았다.

[문서] #298/#299는 부모 작업공간 `research/2026-09-28/director-followup/sources/seoul-dengoku-{298,299}.json`의 2026-09-28T14:23:04Z / 14:23:06Z 수정본을 읽었다. 원문 해시는 [upstream-snapshots.json](upstream-snapshots.json)에 있다. 이 문서의 이후 사용자는 새로운 승인 기록 유무를 다시 확인한다.

### 14:47 UTC 재조회 — GDD #33의 추가 결정

[GDD #33](https://github.com/islee23520/seoul-dengoku-gdd/pull/33), head `97e504adf8411208e3b03d4e99b9e4af1a41b23a`의 실제 diff와 [14:42:46 소유자 댓글](https://github.com/islee23520/seoul-dengoku-gdd/pull/33#issuecomment-5872290524)을 대조했다. 해당 PR은 OPEN이다. 이전 결정13 설명 위에 추가된 판정 방향이며 main 통합이나 새 Core API 구현 증거는 아니다.

판정은 GURPS 4판 공격3d6·능동 방어·DR·피해 유형·충격·주요 부상·HP0 이하 의식/사망 판정, 진행·UI는 노랜드다. 도주는 의지 기반 공포 판정에 기분·지휘관 리더십을 보정한다. 교전을 시작한 부대는 종료까지 새 명령을 받지 않는다. 아래 계약은 이 방향을 전제로 하며 기존 power/morale/cooldown을 해당 규칙으로 개명하거나 대체하지 않는다. 원서 밖의 계수·보정 크기와 API는 임의 작성하지 않는다.

같은 소유자 커밋은 영웅 충성과 인물 신뢰 `T[A,B]`를 구분한다. 보상/위협은 충성·기분만 바꾸고 신뢰T·정통성을 직접 바꾸지 않는다. 기존 `morale`을 충성·기분·신뢰 모두에 재사용하지 않는다. 이 브리지는 그 필드나 명령을 아직 지원하지 않는다. 지속 상태가 전투 입력/정산에 연결되는 범위와 소유권은 #285/#286/#287의 계약을 따른다.

## 2. 입력별 소유권·투영·거부 표

`현재` 열만 현재 코드 사실이다. `후속` 열은 디렉터가 요구한 경계와 **Core 소유자 합의가 필요한 인계 요구**이며, 현재 검사기에서 강제되거나 새 타입이 존재한다는 뜻이 아니다. 모든 새 개인 필드는 현재 **미지원**이다. 누락을 기존 POC 필드·0·빈 문자열·전원 건강/평온 값으로 메우지 않는다.

| 입력 | 원천과 상태 소유권 | 현재 투영/검사 | 후속 계약과 명시 거부 조건 |
|---|---|---|---|
| setup ID·rules version·조우 선택 | 승인 시나리오가 setup ID/내용, #285가 조우→setup 선택, #286이 규칙 계약 소유 | 생성자는 고유 `stableId`·명시 `rulesVersion`을 요구. `Create`는 `context.RulesVersion`과 문자열 일치 검사 | 승인 기록·조우 매핑·지원 schema/version 중 하나라도 없으면 제품 등록/인계 보류. 문자열 일치만으로 결정 13 의미 동등성을 선언하지 않음 |
| 개인 ID·분대 ID·병졸 수 | #298 승인 명단; 캠페인이 현재 편성/참가 신원 소유; #281은 snapshot 투영 | `playerUnits/enemyUnits`→`RosterUnit`, 양쪽 `UnitId`/`SoldierId` 중복 거부. 기존 Core는 **한 편 전체 ≤20명 및 분대별 ≤20명** 검사 | 제품 기준은 **병졸 한 분대 ≤20명**. 별도 영웅은 이 인원에서 제외. 여러 분대의 편 전체 제한은 #286 확인 전 현 검사를 새 규칙으로 확정하지 않음. 누락/중복/미승인 병졸·과원 거부 |
| 이름 있는 영웅·지휘관·임시 분대장 | 승인 인물/역할은 #298; 전투 중 지휘관 이탈·대행 상태는 #286; 지속 신병은 #287 | `playerHero/enemyHero`는 별도 `HeroDefinition`으로 복사. 그러나 `playerCommanderId/enemyCommanderId`는 **병졸 roster 내 UnitId**를 요구. 임시 분대장 필드/선정 API 없음 | 영웅을 병졸로 복제해 지휘관 검사를 우회하지 않음. 임시 분대장은 이미 편성된 병졸 중 하나로 인원 중복 계산 금지. 어느 ID 공간이 지휘권을 참조하고 누가/언제 승계하는지는 #286 확정 필요. 지정 병졸 부재/중복/잘못된 역할은 후속 거부 사례 |
| 병사별 무기 | 승인 장비 정의·초기 지급은 #298; 현재 장착/소유 상태의 캠페인 원천과 변경 시점은 #285/#286 합의 필요 | 무기 참조/개인 장착 필드 **없음**. `power`, `rangeMinMm/rangeMaxMm`, `attackCooldownSeconds`는 POC 수치 | 승인 장비 참조와 개인 장착 snapshot을 새 Core가 받을 때만 투영. 무기 없음의 명시 표현과 누락은 구분하도록 합의. 미승인/알 수 없는 장비 참조·누락은 거부. `power→무기`, `range→무기 성능` fallback 금지 |
| 병사별 방어구 | 승인 정의·초기 지급은 #298; 현재 착용 상태 원천은 #285/#286 합의 필요 | 방어구 필드 **없음**. HP/반경/visual ID는 방어구가 아님 | 장비 정의와 착용자 ID·slot/중복 규칙은 소유자가 확정. 미지원 schema·미승인 참조·필수 입력 결손은 거부. HP나 외형에서 방어구 추론 금지 |
| 두 사람의 전투 기술 차이 | 개인 기술의 승인 원천/현재 상태를 #298/#285가 제공; 공격자·방어자 비교와 판정은 #286 | 개인 기술·상대 비교 필드 **없음** | 개인 기술 snapshot을 보존하고 상대 차이 계산은 Core가 수행할 계약을 요청. 기술 식별·단위·revision 미정이므로 임의 등급/CP 환산 금지. `power`·공격 간격을 기술로 개명하지 않음 |
| 개인 몸 상태·상처 HP | 현재 `BattleContext.StartHp/ParticipantMaxHp`는 캠페인 소유. 새 부상·출혈·감염·고통 등 지속 상태의 원천/수명은 #285/#287, 전투 변화는 #286 합의 | context에 있는 **병졸** ID/max HP를 대조하고 현재 HP를 복사. `hp/maxHp/initialStatus`만 지원. context에 없는 roster는 명시 저작 HP 유지. 별도 hero HP는 context에서 덮어쓰지 않음 | HP만으로 몸 상태가 완전하다고 표시하지 않음. 지속 상태는 정적 asset보다 현재 snapshot이 우선하도록 합의하되 새 데이터 형태는 미확정. 누락한 지속 인물을 건강 기본값으로 시작 금지. 영웅·병졸 전체 participant 포함 정책, 부상별 표현/범위는 #286/#287 답변 후 구현 |
| 개인 기분·의지/공포 판정 | 초기 승인 입력/지속 기분 상태 원천은 #298/#285; 전투 중 변화·도주 판단은 #286; 결과 지속은 #287 | 개인 기분·의지/공포 판정 **없음**. `morale` 및 `BattleRulesDefinition` 사기 수치는 POC | 개인 기분과 분대 사기를 별개로 전달할 계약 필요. GDD33은 도주를 의지 기반 공포 판정으로 정하고 기분·지휘관 리더십이 보정한다. 보정 크기·입력 타입·API는 미정. `morale→기분`, HP→고통 변환 금지. 필수 기분 결손/미지원 version은 거부 |
| 전장·목표·퇴각 | #298 승인 전장/목표/퇴각, #299 승인 위치 및 실제 그래프 ID; #285 매핑 소유 | 명시 3D 노드/segment→`NavPath`. 알 수 없는 spawn/segment/objective/retreat 노드 거부. retreat `[]`는 없음, `null`은 Data에서 거부 | 창고 미승인 노드나 예전 2D battlefield의 추정 3D 변환 금지. 전역 위치와 전장 내부 노드의 연결·목표 의미·퇴각 가능 조건은 승인된 계약으로 대조 |
| 결과와 캠페인 상태 | #286 전투 결과 산출, #287 지속 신병·원장 정산; #281은 입력과 결과의 ID 추적 계약만 소비 | Data repository는 campaign/ledger를 받지 않음. 새 신병 결과 schema와 결과 적용은 이 브리지에 없음 | 인물 ID가 입력→전투→정산까지 유지되어야 함. 누락/중복/알 수 없는 결과 ID·재전송 처리·원자적 반영은 #287 수용 조건으로 검증. 결과 누락을 생존/완치로 보정하지 않음 |

신종목이 총검술을 익혔다는 설정은 장비 보유·스승·등급·탄약·무기 성능의 승인이 아니다. 테스트용 `synthetic` 명단은 신종목이나 승인 병졸의 대체물이 아니다.

## 3. 현재 API 인계 순서와 실패 경계

[문서] 소스 기준: `Data/Authoring/BattleSetupDefinition.cs`, `Data/Repositories/BattleSetupRepository.cs`, `Core/CampaignDomain.cs`의 `BattleContext`/`Apply`/`AttachPendingBattle`, `Core/Battle/Sim/BattleSim.cs`, `Foundation/Battle/BattleSessionDriver.cs`.

1. 승인된 정의만 주입하여 `new BattleSetupRepository(IEnumerable<BattleSetupDefinition> definitions)`를 구성한다. `BattleSetupDefinitionAsset.definition`은 wrapper의 실제 필드다. 생성자 내부 **private static** `Project`가 정의를 POC template로 복사한다. `Project`를 외부 API처럼 호출하지 않는다. asset 경로 탐색·fallback catalog는 없다. 현재 제품 asset과 DI binding은 없다.
2. #285가 현재 상태에서 `CampaignApi.Apply(graph, state, ledger, command)`를 호출한다. `command.Kind = CampaignCommandKind.ChooseCombat`인 경우 성공 결과는 `BattleRequired`다. `ChooseCombat` 자체는 private 함수이므로 public API로 호출하지 않는다. `CampaignRejection`이면 다음 단계로 가지 않는다. 이 인계는 caller state/ledger를 변경하지 않는다.
3. 승인 매핑으로 고른 ID와 **동일한** `required.Context`를 사용해 `repository.Create(approvedSetupId, required.Context)`를 호출한다. version 대조 → fresh setup 복사 → 양쪽 ID·최대 HP 대조/현재 HP 적용 → `BattleSim.Open(setup)` 유효성 확인 → setup 반환 순서다. 내부 Open의 state는 반환되지 않는다.
4. 실제 사용할 state는 소유자 호출부에서 `var battle = BattleSim.Open(setup)`로 얻는다. repository 생성/Create 또는 이 Open에서 `ArgumentException`(그 하위 `ArgumentNullException` 포함)이 나면 명시 실패를 표시하고 **Attach·이벤트 추가·가짜 승리 없이** 기존 campaign/ledger를 유지한다. 준비된 state를 tick하지 않는다.
5. `CampaignApi.AttachPendingBattle(state, ledger, setup.Context, commandId)`를 호출한다. 반환값이 `CampaignRejection`이면 기존 state 유지, 준비한 battle 폐기. 성공 `CampaignState`만 채택한다. 성공 시 원래 state는 유지되지만 **공유 ledger에는 이벤트 1개가 추가**된다. Attach 실패 전후 hash/count를 검증하고, 같은 명령 재시도 의미는 소유자가 통합에서 확인한다.
6. 성공 상태 채택 이후 `BattleSessionDriver.Attach(battle, ledger)`로 활성 세션을 연결한다. 이 메서드는 Open을 대신하지 않는다. actual controller/driver의 연결 순서, 실패 rollback, 이벤트 도중 재진입·state 갱신 경쟁은 #285 책임이다. 현재 Data 브리지는 이를 연결하지 않는다.
7. #286의 새 Core 계약 공개 뒤 위 순서를 재대조한다. 새 규칙 자동·수동 동일성이나 #287 정확히 한 번 정산을 현재 POC Open 성공에서 추론하지 않는다.

현재 `AttachPendingBattle`는 stage/choice/pending 조건을 검사하지만 새 개인 snapshot freshness나 `state`와 `context`의 의미적 재대조를 제공하지 않는다. Create 이후 campaign이 바뀌었을 때 폐기/재작성할 경계도 #285/#286과 정해야 한다. Attach 때 Tick 불변은 결정 14의 시간 기반 이동 증명이 아니다. 기존 driver의 pause/queue 표면도 결정 13 완료로 취급하지 않는다.

### 거부 수용 증거

| 범위 | 현재 관찰 | 후속 수용 시 필요한 증거 |
|---|---|---|
| catalog·context 없음/중복 ID·버전 불일치 | repository 명시 argument error. [dotnet.log](dotnet.log)의 해당 check | 호출부 오류 표시, Attach 미호출, 캠페인 hash/원장 hash·count 불변 |
| 손상 노드·roster·지휘관·retreat·objective·HP·NaN/Infinity·enum | harness에서 26종 malformed case 및 각각 campaign/ledger 불변 통과 | 실제 Unity에서도 대상 케이스 실행 XML과 log. 기존 NUnit은 harness의 모든 26항과 동일한 집합이 아님 |
| 현재 HP와 독립 복사 | 상처 HP 7 보존, 입력/반환 객체 변경 뒤 새 Create 결과 동일 | 새 개인 상태·영웅까지 범위가 확장되면 원천 변경·이전 반환값 변경·반복 생성의 독립성 다시 검증 |
| 새 필드 없음·미승인 content | **현재 코드가 새 필드의 결손을 검출하는 것은 아님**; 새 schema 자체 없음 | 제품 authoring/통합을 막는 수용 경계. #286 schema 확정 후 필수값 누락/불명 ID/미지원 version의 실행 가능한 negative tests 추가 |
| 누락 setup 이후 다른 경로 | 가짜 승리·자동 fallback이 이 repository에 없음 | #285 실제 조우→오류 표시→원래 상태로 복귀를 검증. 임의 HP·사기·장비를 넣어 Open만 통과시키지 않음 |

## 4. 소유자에게 필요한 구체 계약 답변

다음은 구현 전 #286/#285/#287에 인계할 질문 목록이다. 답을 가정해 DTO나 default 값을 만들지 않았다.

1. **#286:** 새 입력 타입·namespace·공개 메서드/반환/거부 타입·version은 무엇인가? `BattleSetup`/`Open`을 교체하는가 확장하는가? 자동·수동이 호출하는 동일 판정 진입점과 결정론 입력은 무엇인가?
2. **#286 + #285:** 병졸/영웅/지휘관/임시 분대장의 ID 관계, 영웅의 context 포함과 HP/state 투영 정책은? 지휘관 이탈 때 대행자 선정·검증 시점은? 분대 ≤20을 편 전체 ≤20과 어떻게 분리할 것인가?
3. **#286 + #298:** 무기/방어구 없음과 필수 입력 결손의 표현, 개인 기술의 원천/단위, 장비·기술 참조 무결성, 승인된 판정 표 revision은? 상대 기술 차이는 어떤 입력 쌍과 규칙으로 계산하는가?
4. **#285/#286/#287:** 부상·출혈·감염·고통·기분 snapshot의 권위 있는 저장소, capture 시점, freshness token/hash 범위, 변경 가능한 전투 복사와 지속 상태의 소유자는? context에 없는 참가자를 현재처럼 authored default로 열어도 되는가, 완전 일치로 바꿔야 하는가?
5. **#285:** ChooseCombat→Create/Open→Attach 사이 새 이동/상태 변경을 어떻게 막거나 탐지하는가? 오류 표시는 무엇이고, 실패한 Open/Attach의 세션 disposal·ledger 원자성은 누가 보장하는가?
6. **#287:** 결과의 개인 ID·부상/출혈/감염·기절/포획/항복/도주 표현, exact-once key, 충돌/중복/누락 결과의 거부 규칙과 재시도 계약은? 전투 중 이동 잠금은 어느 성공 정산 시점에 풀리는가?

답변 수신 뒤 #281 담당자는 `Project`/`Create`/NUnit을 새 계약에 대조하여 별도 구현 커밋으로 검증한다. 승인 데이터는 같은 revision의 source→asset→snapshot 연결을 기록하고, 새 규칙 수치 승인을 문서 방향 승인과 혼동하지 않는다.

## 5. Unity 수용 인계 — 아직 실행하지 않은 명령

#278 전용 worktree에서 아래 선검증을 **순서대로**, 각 exit 0일 때만 진행한다. 이번 로컬 작업은 read-only 조회만 했으며 설치/복구 권한을 이 문서로 추가하지 않는다. 환경 담당이 먼저 복구한 후 실행할 재현 명령이다.

```sh
git rev-parse HEAD
git status --short
git submodule status --recursive
unity editors verify 6000.7.0a5 --format json
unity modules list 6000.7.0a5 --format json
node TOOL/tools/check-lfs-hydration.mjs
```

submodule 출력에서 `-`(미초기화), `+`(기록 commit 불일치), `U`가 있으면 원인을 해결하고 실제 local package 경로도 확인한다. CLI 실패/라이선스 미확인/필요 모듈 부재/LFS pointer 또는 scan error가 있으면 Unity 시작 금지. 확인한 pinned 실행 파일만 `UNITY_EDITOR`로 설정하고 같은 `GAME` 경로에 동시 Editor가 없음을 확인한다. 전용 background session에서 컴파일과 테스트를 순차 실행한다. 아래 `-runTests`에는 조기 종료를 막기 위해 `-quit`을 넣지 않는다.

```sh
mkdir -p .omo/evidence/battle-authoring-followup-unity
"$UNITY_EDITOR" -batchmode -nographics -quit -projectPath "$PWD/GAME" \
  -logFile "$PWD/.omo/evidence/battle-authoring-followup-unity/compile.log"
"$UNITY_EDITOR" -batchmode -nographics -projectPath "$PWD/GAME" \
  -runTests -testPlatform EditMode \
  -testFilter 'Janseon.Foundation.Tests.RealtimeBattleSimTests;Janseon.Tests.EditMode.CampaignLoopTests' \
  -testResults "$PWD/.omo/evidence/battle-authoring-followup-unity/editmode.xml" \
  -logFile "$PWD/.omo/evidence/battle-authoring-followup-unity/editmode.log"
```

각 process exit를 별도 보존한다. XML이 없거나 0건이면 실패다. NUnit3 결과의 실행 건수와 개별 case 실패/skip을 확인하며 기존 **추가 NUnit 18건(17+1)**이 실제로 포함되었는지 이름으로 대조한다. 전체 fixture filter의 건수는 18보다 클 수 있다. `passed > 0`만으로 의도한 18건 실행이나 신규 계약 coverage를 주장하지 않는다. 모든 오류 및 새 경고를 검토한다. source SHA·dirty source hashes·실행 명령·exit·XML/log를 묶는다.

| 인수 항목 | 담당/테스트 표면 | 통과 기준 | 현재 상태 |
|---|---|---|---|
| ScriptableObject import/직렬화·Data 컴파일 | #281, Unity EditMode | 승인 schema의 실제 왕복 직렬화와 import/컴파일 오류 없음 | 미실행; 실제 `.asset` 승인 대기 |
| 기존 Create/Open, 결손·손상 거부, 상처 HP, 반복 복사 | #281, 위 두 EditMode fixture | 의도한 케이스 XML 실행 >0·실패0, 거부 전후 campaign/ledger 불변 | .NET 부분 증거만 PASS; NUnit 미실행 |
| 승인 데이터의 실제 조우→Open→Attach | #285 + #281, 통합 EditMode/필요 PlayMode | 승인 setup ID와 context 신원/HP 보존, 오류 시 불변, 성공 후 세션 활성화 | controller 연결 미완료; 기존 필터만으로 충족 불가 |
| 새 개인 입력 경계 | #281/#286, 계약 확정 후 테스트 추가 | 무기·방어구·개인 기술·몸 상태·기분, 영웅/대행/인원 제한의 정상·누락·불일치 사례 | schema/API 미확정; 기존 테스트 없음 |
| 자동·수동 공통 판정·명령 잠금·전투 전체 후퇴 | #286 | 동일 판정 입력/seed/공격 상황에서 공통 판정 경로 증명; 두 진행 방식의 입력 차이를 결과 동일성으로 억지 고정하지 않음 | 이 브리지 범위 밖, 미검증 |
| 전투 중 분대 이동 잠금·신병 지속·정확히 한 번 정산 | #285/#287 | 전투 중 이동 거부, 인물별 결과 보존, 같은 결과 재전송에 추가 상태/원장 변화 없음, 성공 정산 후 잠금 해제 | 소유자 통합 미검증 |

새 Core/통합 fixture가 생기면 소유자가 그 실제 테스트 이름과 batch 명령을 추가한다. 존재하지 않는 테스트/API 이름을 지금 지정하지 않는다. 필요한 PlayMode/렌더 증거는 `-nographics` 없이 별도 실행한다. 이 문서와 62 console check는 UI·Unity·제품 승인 게이트를 대체하지 않는다.
