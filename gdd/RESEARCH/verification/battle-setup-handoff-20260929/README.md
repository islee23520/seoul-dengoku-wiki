# #281 BattleSetup 추가 18사례 실행 인계

2026-09-29 확인. PR [#307](https://github.com/islee23520/seoul-dengoku/pull/307)은 병합됐지만 추가 테스트의 Unity 실행 증거는 아직 없다. 이 문서는 입력 코드·검사 이름·실행 조건을 확정하는 인계이며 테스트 통과 기록이 아니다.

## 확인한 코드와 과거 결과의 범위

현재 GAME 기준 `ac98566ab41132747ae86a3b6825ea5ad2518aeb`에서 두 파일은 HEAD와 동일하다.

| 파일 | SHA-256 |
|---|---|
| `GAME/Assets/Tests/EditMode/RealtimeBattleSimTests.cs` | `46ac20e2360dc24a88b36bd4b1c736915be9d84452823e9e9d2aacdba41c1dec` |
| `GAME/Assets/Tests/EditMode/CampaignLoopTests.cs` | `f221684b724bccb87a6a1cf74179fd04edc4b68e30e6ed1cf63c611c27c98789` |

소유자의 기존 219/219 결과가 가리킨 `616c6f05`에는 아래 세 메서드가 없다. 그 결과를 새 18사례의 성공으로 재사용할 수 없다. 과거 두 파일의 해시는 각각 `14eb6e92874d43ca2a8598e52b1560dd0f79445b2b4bd6e002030dbdc2d52b5a`, `694320ead23c4be0854cfab53e1c65f16f56398a367ce6155d050a21d59e1069`다. 이는 테스트 실행이 아니라 소스 대조 결과다.

| fixture | 메서드 | 사례 |
|---|---|---|
| `Janseon.Foundation.Tests.RealtimeBattleSimTests` | `AuthoredSetup_OpensWithHandoffHpAndIsolatedCatalogSnapshots` | 정상 입력/복사 격리 1 |
| 같은 fixture | `AuthoredSetup_RejectsMalformedOrMissingData` | 아래 손상 입력 16 |
| `Janseon.Tests.EditMode.CampaignLoopTests` | `AuthoredBattleSetup_ValidatesBeforeCampaignAttachmentAndPreservesWoundedHp` | 연결 전 검증/부상 HP 보존 1 |

16개 매개변수: `missing`, `duplicate`, `rules`, `null-roster`, `null-participant`, `unknown-node`, `commander`, `retreat`, `objective`, `duplicate-unit`, `duplicate-soldier`, `hp-limit`, `hero-hp`, `nan-duration`, `infinite-cooldown`, `status`.

최신 [#281 인계 댓글](https://github.com/islee23520/seoul-dengoku/issues/281#issuecomment-5871838293)은 18사례 미실행을 명시한다. 이번 조회에서 #281 일반 댓글2개, PR307 일반 댓글0개였고 새로운 XML/Editor log는 확인되지 않았다. PR 병합과 과거 review 해제는 실행 증거가 아니다.

## 실행 호스트에서 재현

`GAME/ProjectSettings/ProjectVersion.txt`는 **Unity 6000.7.0a5 (a15235a53881)**를 요구한다. 이 로컬에는 해당 Editor·Hub·`unity` 명령·기존 `/Volumes/gameWorkspace`가 확인되지 않았다. `TOOL/unity-remote` 체크아웃도 비어 있다. 알려진 evidence gallery는 실행 큐가 아니고, localhost4173 broker는 이미 열린 Editor에 붙는 도구여서 실행 호스트를 대신하지 못한다.

실행 가능한 기존 호스트에서 검증 SHA를 체크아웃하고 LFS/submodule과 해당 Editor가 준비됐는지 확인한다. 아래 명령은 GAME **상위 저장소 루트** 기준이다. `UNITY_EDITOR`는 실제 설치된 실행 파일의 절대 경로로 설정한다.

```sh
git rev-parse HEAD
git status --short
git submodule status
git lfs status
mkdir -p .omo/evidence/battle-review-20260929
"$UNITY_EDITOR" -batchmode -nographics -projectPath "$PWD/GAME" \
  -runTests -testPlatform EditMode \
  -testFilter 'Janseon.Foundation.Tests.RealtimeBattleSimTests;Janseon.Tests.EditMode.CampaignLoopTests' \
  -testResults "$PWD/.omo/evidence/battle-review-20260929/editmode.xml" \
  -logFile "$PWD/.omo/evidence/battle-review-20260929/editor.log"
```

두 fixture 전체를 실행하므로 총 test count는 18보다 클 수 있다. **추가 18개 각각의 이름과 매개변수가 XML에 존재하며 실행됐는지** 확인한다. exit0만으로 통과라 하지 않는다. 실패0·skip0·inconclusive0, 위 18개 전부 Passed, compile/import 오류 없는 Editor log, 실행 SHA·dirty 소스 fingerprint·Editor 버전과 두 파일 해시를 함께 남긴다. 실행 중인 동일 프로젝트 Editor와 batchmode를 중복 실행하지 않는다.

## 후속 인수 조건

- 이 18사례는 합성 BattleSetup 계약 검증이다. 소유자가 승인한 신종목·병졸별 무기/방어구/기술/몸 상태/기분·지휘·상대 입력 없이 실제 시연 데이터를 확정하지 않는다.
- #298 개인 입력 승인과 #299 위치/출입 승인 이후의 Data 바인딩, 자동/수동 동일 판정, 캠페인→전투→정산 인수와 5상태×2해상도 증거는 별도로 필요하다.
- 이번 인계는 런타임·테스트 소스·submodule 포인터를 변경하지 않는다. 호스트 연결정보와 실제 XML·log는 미확보이며 Unity 통과·전체 #281 완료를 주장하지 않는다.
