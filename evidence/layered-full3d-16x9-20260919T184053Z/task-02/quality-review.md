# Task 02 exact-binding 품질 리뷰

판정: **actionable finding 0**

## 소스 앵커

| 경로 | SHA-256 | 순수 LOC | 토큰 앵커 |
|---|---|---:|---|
| `GAME/Assets/Janseon/Core/PlaceId.cs` | `8b82d0dcfb74f56efcd6c3bdb937b63ca4fdc6bbe868dfa9a012b03222096d9d` | 220 | `IsValid`, `EnsureValid`, `Enum.IsDefined` |
| `GAME/Assets/Tests/EditMode/PlaceIdentityTests.cs` | `4557ab4accf594aee3e5bcc6be37f99dfefca78cd021ee13784812e42d49f3cb` | 189 | `DefaultPlaceIdCannotEnterCatalog`, `DefaultPlaceIdReportsInvalid`, `UndefinedPlaceKindIsRejected` |
| `TOOL/tools/strategy-map/build-task02-source-fingerprint.mjs` | `97790949a148f455fd0baab499503d48371caeea9e53b454b687b11b67523262` | 56 | `rev-parse --verify`, `git show`, `implementation_tree` |
| `TOOL/tools/strategy-map/build-task02-green-receipt.mjs` | `62452b42cbd40fcf409b50948151fa6a554d299b9cdf67952b36c28815e29636` | 43 | `requiredGreenCases`, `xml_sha256` |
| `TOOL/tools/strategy-map/verify-task02-evidence.mjs` | `dfa247821709cdfa940b40b03a20a0de9e3b71a73cfe7c638a9ba001073add16` | 113 | `exactKeys`, `manifest frozen source paths mismatch`, `green XML hash mismatch` |
| `TOOL/tools/strategy-map/test-task02-evidence.mjs` | `218d4b630b6b1c520c5fea662290cf684a0fcaec640eed896bbbe49eee4f7415` | 79 | `stale pre-fix commit`, `valid nonancestor`, `consistent source hash tamper` |

## 검토

- `(PlaceKind)-1`과 `int.MaxValue`는 생성자에서 거부된다.
- `default(PlaceId)`는 `IsValid=false`이며 `PlaceDefinition` 생성 경계에서 `EnsureValid`로 거부되어 카탈로그 상태에 들어가지 않는다. equality/hash 자체는 기존 value-type 기본 동작을 유지한다.
- `(Kind, StableId)` equality/hash/order 계약은 동일하다. metadata는 identity에 들어가지 않는다.
- 동일 정의 중복은 idempotent이고 충돌 정의는 write 전 typed exception으로 atomic하게 거부된다.
- manifest는 worktree를 읽지 않는다. 정확한 구현 commit을 `rev-parse --verify <sha>^{commit}`으로 해소하고 각 frozen path를 `git show <sha>:<path>` argument vector로 읽는다.
- manifest는 commit tree SHA를 기록한다. manual·manifest·green receipt는 모두 구현 커밋 K가 같아야 한다.
- strict schema는 extra/missing/wrong type/unknown nested key/duplicate path를 fail-closed로 거부한다.
- 테스트는 runtime 관측값과 독립 Git blob 해시를 대조한다. 구현 문구를 pin하거나 생산 알고리즘을 복제하는 tautology가 없다.
- broad catch, shell interpolation, compatibility shim, dead abstraction, task3 topology 구현은 없다.

`PlaceId.cs`는 220 LOC 경고 구간이지만 책임은 장소 identity·metadata·최소 definition catalog 한 묶음이다. 250 LOC 결함 기준 미만이며 현재 분리는 단일 소비자 계약을 흩뜨리는 추가 추상화가 된다.
