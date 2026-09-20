# Task 02 품질 리뷰

판정: **actionable finding 0**

검토 기준은 programming 규칙과 remove-ai-slops 관점의 테스트 품질·과잉 방어·불필요 추상화 점검이다. 아래 앵커는 현재 파일 내용 SHA-256과 고유 토큰을 함께 사용한다.

| 경로 | SHA-256 | 검토 앵커 |
|---|---|---|
| `GAME/Assets/Janseon/Core/PlaceId.cs` | `7f3406bf308887375a6644142b01a0bc398fe777bde8fca2c2c9d3eeaf4bc49b` | `Enum.IsDefined`, `PlaceDefinitionConflictException`, `FingerprintMaterial` |
| `GAME/Assets/Tests/EditMode/PlaceIdentityTests.cs` | `e29f37d5dd4b6f67c516e325878cc2bb93ef368345e4205ff0b7e3c38c41b355` | `UndefinedPlaceKindIsRejected`, `IdenticalDuplicateIsIdempotent`, `ManualDataSurfaceRecordsIdentityAndConflict` |
| `TOOL/tools/strategy-map/build-task02-source-fingerprint.mjs` | `a5f419d7827162bf1a4e52198a28fa7c7c9d46e0e60bb9259ba4fa37b9000883` | `requiredSourcePaths`, `cat-file`, `manifest_sha256` |
| `TOOL/tools/strategy-map/verify-task02-evidence.mjs` | `1d33046413653c2695b5760a84d473ac1f7205e3309f5627e87542a6175b6b0b` | `verifyTask02Evidence`, `manual source manifest mismatch` |
| `TOOL/tools/strategy-map/test-task02-evidence.mjs` | `0ca4d03796428dfa74ac5bc5bb694fef3c95697c541b5c7f30856e7e82fcf09c` | `rejects flipped boolean`, `rejects added source path`, `builder freezes` |

## 검토 결과

- 정의되지 않은 `PlaceKind`는 `PlaceId` 상태가 만들어지기 전에 생성 경계에서 거부된다.
- `Equals`, `GetHashCode`, `CompareTo`는 모두 `(Kind, StableId)` 순서와 ordinal 문자열 비교를 공유한다.
- `PlaceId`는 readonly struct이며 메타데이터는 외부 컬렉션을 보관하지 않는다. 문자열·nullable 값·`PlaceId?`만 소유하므로 copy 방어가 필요한 컬렉션 별칭이 없다.
- `PlaceMetadata`의 동등성은 Dong/Station/Line/Stop/Platform/Connector/TransferGroup/VerticalConnection/Grade/ObservedPlatformLevel/from/to 전 필드를 포함한다.
- 동일 정의 재등록은 count와 fingerprint를 바꾸지 않는 idempotent 동작이다. 충돌 정의는 dictionary write 전에 비교하고 typed exception을 내므로 atomicity가 유지된다.
- broad catch, compatibility shim, dead helper, 로깅 추가, UnityEngine 의존성은 없다.
- 테스트는 실제 반환·예외·count·fingerprint를 관찰한다. 생산 구현의 내부 알고리즘을 복제하거나 출력에서 기대값을 다시 계산하지 않는다.
- 삭제만으로 통과할 수 있는 부정 테스트, prose pin, tautological self-comparison, 무의미한 존재 확인은 없다.
- manual JSON의 boolean·null·fingerprint·예외명은 NUnit 실행 중 실제 계산값으로 작성된다. env는 검증된 구현 커밋과 manifest SHA 결속값만 전달한다.
- 증거 검증기는 고정된 두 소스 경로를 독립 재해시하고 commit object를 `git cat-file`로 확인한다. 경로 추가·삭제, boolean 변조, 잘못된/nonhex commit, manifest hash 변조를 모두 거부한다.

## 크기와 책임

`PlaceId.cs`는 200 LOC 경고 구간에 있으나 책임은 **장소 안정 신원과 그 정의 카탈로그** 한 가지다. 현재 작업에서 별도 파일로 나누면 단일 소비자인 작은 metadata/catalog 계약을 분산시키는 불필요 추상화가 된다. 다음 작업이 실제 topology caller나 두 번째 catalog 책임을 추가할 때 분리한다.

## 범위 판정

새 assembly, package, DB, topology, Route/Campaign 이행은 추가하지 않았다. task31 증거 경로와 문서는 건드리지 않았다.
