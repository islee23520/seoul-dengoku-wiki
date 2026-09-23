이 계획은 [Unity 시스템 설계 계약](/architecture/Unity-System-Design)을 코드로 옮기는 순서와 각 단계의 중단 조건을 정의합니다. 설계 계약과 계획이 Wiki에 먼저 합쳐지기 전에는 제품 코드를 변경하지 않습니다.

> 현재 부대 지휘 전투 개정은 문서 전용이며 이 계획에 새 런타임 작업을 추가하지 않습니다.

## 계약 요약

현재 증분은 `Foundation` 모듈 하나에 한정합니다. `Bootstrap.unity`가 App VContainer scope와 **FSM**을 소유하고, `Foundation.unity`는 명시적 child scope를 가진 화면이 됩니다. static **Singleton**과 service locator를 금지하며, 미래 **Repository**는 Unity-free inward contract로 둡니다. **저장과 결정성**, **실패와 취소**, 테스트 및 **품질 게이트**의 상세 규칙은 시스템 설계 계약을 따릅니다.

## 구현 순서

| 순서 | 작업 | 선행 조건 | 완료 증거 |
|---|---|---|---|
| 1 | Wiki 계약 고정 | 조사·설계 검증 PASS | Wiki 테스트 RED→GREEN 로그 |
| 2 | 루트 작업 계약 고정 | Wiki GREEN | `Concept.md`, `ToDo.md`, GitHub remote |
| 3 | FSM 테스트 작성 | 제품 코드 변경 전 | 올바른 missing type/behavior RED |
| 4 | VContainer와 최소 FSM 구현 | FSM RED | EditMode GREEN |
| 5 | Bootstrap/Foundation 조립 | FSM GREEN | compile, scope/build-order tests |
| 6 | 정적 품질 게이트 구현 | 구조 파일 존재 | mutation RED→cleanup→GREEN |
| 7 | 실제 PlayMode QA | compile/tests GREEN | screenshot과 허용·거부 전환 기록 |
| 8 | 전체 검증 | 모든 증분 완료 | Wiki, gate, Unity tests, 네 리뷰 PASS |

## 단계 1 — Wiki 계약

### RED

`node tools/wiki/test-build-wiki.mjs`

`Unity-System-Design.md`와 이 계획이 없거나 sidebar 연결과 필수 계약(FSM, VContainer, Singleton, Repository, 저장과 결정성, 실패와 취소, 품질 게이트)이 빠지면 실패해야 합니다.

### GREEN

두 문서를 만들고 `_Sidebar.md`와 `Home.md`에서 연결합니다. 빌드된 Wiki에서 링크와 필수 계약을 다시 읽습니다.

## 단계 2 — 작업 범위 게이트

제품 코드 변경 전에 루트 `Concept.md`와 `ToDo.md`를 만듭니다.

- Concept는 게임과 Unity 6000.7.0a5, VContainer 1.19.0, URP/Input System/Test Framework 기준을 설명합니다.
- ToDo의 current module은 Foundation architecture 하나뿐입니다.
- UI 화면 설계 변경이 아니므로 이 증분에서 새 `Design.md`는 만들지 않습니다.
- `git remote -v`에 GitHub remote가 있어야 합니다.

## 단계 3 — FSM RED

EditMode 테스트를 제품 코드보다 먼저 작성합니다.

| 사례 | 입력 | PASS 조건 |
|---|---|---|
| happy | `Booting + OpenFoundation` | `Transitioning`, load 1회 |
| readiness | load 완료, ready 미완료 | `Foundation` commit 없음 |
| success | `SceneLoadSucceeded` | `Foundation`, receipt 존재 |
| illegal | 허용되지 않은 상태/trigger | typed rejection, 호출 0회 |
| duplicate | 전환 중 두 번째 요청 | Busy, 추가 load 0회 |
| failure | load 또는 scope 실패 | staging dispose, Faulted |
| retry | `Faulted + Retry` | 새 transition ID, 성공 가능 |

RED는 missing type, missing member 또는 기대 동작 불일치여야 합니다. syntax error나 fixture 오류는 증거가 아닙니다.

## 단계 4 — 최소 GREEN

### FSM

- `ApplicationFlowState`
- `ApplicationFlowTrigger`
- typed `TransitionOutcome`
- pure transition table
- single-flight coordinator
- generation과 transition ID

첫 GREEN은 실제 scene API 없이 fake scene loader로 얻습니다. 상태 commit은 ready signal 이후에만 합니다.

### VContainer

Makcha에서 실제 확인한 `jp.hadashikick.vcontainer` `#1.19.0`만 추가합니다. Addressables, Entities, LitMotion 등 호출자가 없는 패키지는 추가하지 않습니다.

- `AppLifetimeScope`: FSM, scene catalog, scene loader 등록
- `FoundationLifetimeScope`: 화면 객체만 등록
- parent enqueue를 사용한 명시적 child 구성
- scope dispose와 cancellation의 소유권 테스트

## 단계 5 — 씬 조립

Editor builder가 다음 결과를 반복 가능하게 만듭니다.

1. `Bootstrap.unity`: App scope와 bootstrap root만 포함
2. Build Settings: Bootstrap 0, Foundation 1

Bootstrap 외 `DontDestroyOnLoad`를 금지합니다. 화면과 gameplay object는 Foundation unload와 함께 제거됩니다.

## 단계 6 — Repository·Singleton 경계 품질 게이트

현재 증분에는 campaign Repository 구현을 만들지 않습니다. 대신 검사 가능한 경계를 고정합니다.

- Repository/Core 대상 경로에서 UnityEngine과 VContainer import 금지
- runtime mutable static `Instance`, `Current`, collection 금지
- service locator와 runtime object search 금지
- scene load API는 adapter allowlist만 허용
- `DontDestroyOnLoad`는 Bootstrap allowlist만 허용

mutation proof:

1. 임시 runtime 파일에 금지된 `DontDestroyOnLoad` 또는 `Current`를 추가합니다.
2. `node tools/architecture/check-unity-architecture.mjs`가 규칙 이름과 파일을 출력하며 nonzero로 끝나야 합니다.
3. 임시 파일을 제거합니다.
4. 같은 명령이 exit 0이어야 합니다.
5. temp 파일과 프로세스가 남지 않았음을 cleanup receipt에 기록합니다.

## 단계 7 — 저장과 결정성·실패와 취소 계약 보존

Foundation 구현은 아직 저장하지 않지만 향후 경계를 침범하지 않아야 합니다.

- scene timing, frame count와 wall clock을 FSM 결과에 사용하지 않음
- 모든 transition 요청에 안정 ID와 typed result 사용
- cancellation을 failure와 구분
- late callback은 generation 검사
- child scope dispose가 token을 먼저 취소
- fire-and-forget과 fixed sleep/polling 금지

미래 Repository와 save adapter는 temp→검증→backup→원자 교체와 목적별 RNG stream 규칙을 따라야 합니다.

## 단계 8 — Unity 검증

파일 변경 후 실제 Unity Editor에서 다음을 실행합니다.

```text
unity run Game --editor-version 6000.7.0a5 -- -nographics -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.BuildFoundationScene -logFile -
unity test Game --editor-version 6000.7.0a5 --mode EditMode --report-format junit --output .omo/evidence/unity/editmode.xml --timeout 600
unity test Game --editor-version 6000.7.0a5 --mode PlayMode --report-format junit --output .omo/evidence/unity/playmode.xml --timeout 600
```

Play Mode에서 Bootstrap이 Foundation을 열고 App/child scope가 각각 하나인지 확인합니다. public flow API로 이미 Foundation인 상태의 요청이나 불법 trigger를 보내 typed rejection과 추가 load 0회를 관찰합니다.

## 시각 검증

실제 Unity Play Mode를 `-batchmode`로 실행하고 고정 카메라의 RenderTexture 또는 ScreenCapture 결과를 PNG와 JSON receipt로 기록합니다. 다음 네 축을 독립 검토하며 하나라도 명시적 PASS가 아니면 완료가 아닙니다.

- COMPOSITION
- SPRITE_FIDELITY
- TYPOGRAPHY
- PRODUCT_POLISH

batchmode PlayMode 캡처나 receipt가 없으면 정적 검증으로 대체하지 않고 미검증으로 기록합니다. 대화형 Editor와 uLoop는 사용하지 않습니다.

## 최종 품질 게이트

다음을 한 번씩 clean 상태에서 실행합니다.

1. `node tools/wiki/test-build-wiki.mjs`
2. `node tools/architecture/check-unity-architecture.mjs`
3. Unity compile
4. EditMode tests
5. PlayMode tests
6. 실제 Play Mode 허용·거부 시나리오
7. 네 시각 리뷰

모든 임시 mutation, Unity process, capture context와 temp file을 정리한 뒤에만 완료합니다.

## 완료 조건

- FSM이 유일한 scene transition 권한입니다.
- VContainer App/child scope 관계와 dispose가 검증됩니다.
- static Singleton/service locator가 품질 게이트에서 실패합니다.
- Repository 경계는 Unity-free 계약으로 보호됩니다.
- 저장과 결정성, 실패와 취소 규칙을 깨는 코드가 없습니다.
- Wiki, architecture gate, compile, EditMode, PlayMode와 실제 화면 검증이 모두 PASS합니다.
