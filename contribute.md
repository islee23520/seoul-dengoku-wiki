# 기여를 시작하는 곳

이슈를 여는 규칙·라벨·게이트는 [CONTRIBUTING.md](CONTRIBUTING.md)다. 이 문서는 **어느 칸부터 손대는지**만 적는다.

빈 이슈는 쓰지 않는다. 웹이면 [작업 이슈 폼](.github/ISSUE_TEMPLATE/job.yml), `gh`면 CONTRIBUTING의 다섯 섹션(목적·비목표·정합성·품질 게이트웨이·완료 조건)을 본문에 넣는다. 구현은 전용 브랜치와 PR이다. main에 직접 넣지 않는다.

제품 범위는 [Concept.md](Concept.md), 지금 모듈은 [ToDo.md](ToDo.md)다. 그 모듈 게이트가 끝나기 전에 다음 모듈을 시작하지 않는다.

## 공통

1. 라벨을 고른다. 제목 앞은 주 카테고리 하나다.
2. 아래 표에서 정본 폴더를 연다. 생성 Wiki와 투영 페이지를 손으로 고치지 않는다.
3. 품질 등급은 하나다. 문서·정합은 `quality:medium`, 화면·런타임은 `quality:high`, 규칙 고정은 `quality:policy`.
4. 완료는 증거다. ACK만으로 닫지 않는다.

| 카테고리 | 정본 | 첫 파일 | 게이트 |
| --- | --- | --- | --- |
| 세계관 | `Wikis/game-logic/` | [Home.md](Wikis/game-logic/Home.md), [세계 서사 지도](Wikis/game-logic/World-Narrative-Atlas.md) | 위키 빌드, 금지 용어 |
| 설정 | `Wikis/game-logic/`, `GDD/` | 계약·도표 페이지, [Intent.md](Intent.md) | 위키 또는 문서 정합 |
| 인물 | `Wikis/game-logic/Cast-*` | [인물 등록 템플릿](Wikis/game-logic/Cast-Registration-Template.md) | `verify-cast.mjs` |
| 사건 | 타임라인 | [시나리오 타임라인](Wikis/game-logic/Scenario-Timeline.md) | 위키 빌드 |
| 이야기 | 서사 배치 | [세계 서사 지도](Wikis/game-logic/World-Narrative-Atlas.md) | 위키 빌드, 출처 충실 |
| 게임로직 | 규칙 문서 | [유니티 구조](Wikis/game-logic/Unity-Architecture.md) 옆의 규칙 페이지 | 위키 빌드 |
| 게임 구현 | `Game/Assets/Janseon/` | 해당 Core/Foundation 스크립트 | EditMode/PlayMode |
| 유니티 작업 | `Game/` | [Game/AGENTS.md](Game/AGENTS.md) | `6000.7.0a5` `-batchmode` |
| 버그 | 결함 위치 | 재현 로그 | 실패했던 명령 GREEN |
| 에픽 구현 | 하위 이슈 | 에픽 본문에 DAG | 하위 이슈 게이트 |
| poc | 현재 ToDo | [ToDo.md](ToDo.md) | 그 모듈의 수용 게이트 |
| 아트 파이프라인 | `Game/Assets/Janseon/Art/`, BOM | [에셋이 들어오는 길](Wikis/game-logic/Asset-Pipeline.md) | BOM fail-closed, 초상은 툴 준비 전 생성 금지 |
| 3d | 프롭·캐릭터 3D | TRELLIS는 옵션, Tripo는 명시 실행만 | 권리·승격 전 금지 |

위키 공개 본문에 `Kenshi`, `Underrail`, `Gunner`, `clone`, `복제`를 쓰지 않는다.

## 세계관

서울 십육국, 레이어, 역, 회랑처럼 **세계가 어떻게 생겼는지**를 고친다.

- 읽기: [Home.md](Wikis/game-logic/Home.md), [서울과 지하철 레이어](Wikis/game-logic/World-and-Subway-Layers.md), [서울 십육국](Wikis/game-logic/Sixteen-States.md)
- 쓰기: 해당 위키 페이지. 새 페이지는 [_TEMPLATE.md](Wikis/game-logic/_TEMPLATE.md)의 `domain: world`
- 하지 말 것: 구현 완료처럼 적기, 생성 Wiki 손편집

이슈 제목 예: `세계관: …`

## 설정

규칙·계약·정합 문서. 세계관 산문과 런타임 코드를 한 PR에 섞지 않는다.

- 읽기: [Intent.md](Intent.md), `GDD/adr/`, [가치관과 정책 척도](Wikis/game-logic/Values-and-Policy-Scales.md)
- 쓰기: 계약 문장과 도표. 라벨 `설정`
- 게이트: 문서 정합, 필요하면 위키 빌드

## 인물

이름 있는 인물, 관계, 프로필.

1. [인물 카드 계약](Wikis/game-logic/Cast-Profile-Contract.md)을 읽는다.
2. [인물 등록 템플릿](Wikis/game-logic/Cast-Registration-Template.md)을 복사한다.
3. 총람·JSON·관계 원장을 같은 변경에 맞춘다.
4. 초상 마크다운과 실물 사진은 넣지 않는다.

이슈 라벨 `인물`. 가치관 10칸과 욕망을 채운 뒤에만 PR.

## 사건

개막 전후 시간과 촉발.

- 정본: [시나리오 타임라인](Wikis/game-logic/Scenario-Timeline.md)
- 상대 연대는 붕괴 N년. 근거 없이 나이를 잠그지 않는다.

## 이야기

서사 배치와 백스토리. 인물 칸을 비운 채 이야기만 올리지 않는다.

- 원본: [세계 서사 지도](Wikis/game-logic/World-Narrative-Atlas.md)
- 투영 페이지(`Hostile-Group-*` 등)는 재생성 대상이다. 내용을 지도·영수증에 두고 페이지만 고치지 않는다.

## 게임로직

캠페인·전투·정산 **규칙 문서**. 코드가 아니다.

- 예: [출격하고 돌아오는 흐름](Wikis/game-logic/Campaign-Loop.md), [실시간 진형·카드 전투](Wikis/game-logic/Realtime-Formation-Card-Battle.md), [같은 선택이 같은 결과가 되나](Wikis/game-logic/Save-and-Determinism.md)
- 런타임 변경은 `게임 구현`으로 따로 연다.

## 게임 구현

규칙의 C# 런타임. Unity 프로젝트 루트는 `Game/`이다.

- 경계: `Janseon.Core`는 엔진 없음. Foundation이 Unity·VContainer와 잇는다.
- 읽기: [Game/Assets/Janseon/AGENTS.md](Game/Assets/Janseon/AGENTS.md)
- 게이트: 해당 EditMode 또는 PlayMode. 테스트를 지우거나 skip하지 않는다.

## 유니티 작업

씬, 에디터, 빌드, batchmode.

- 읽기: [Game/AGENTS.md](Game/AGENTS.md), [유니티 구조](Wikis/game-logic/Unity-Architecture.md)
- 실행: Unity `6000.7.0a5`, `-batchmode`, 전용 백그라운드. GUI 에디터로 검증하지 않는다.
- 안내: [Tool/docs/Unity-Headless-Workflow.md](Tool/docs/Unity-Headless-Workflow.md)

전역 Singleton으로 화면 상태를 두지 않는다. 새 화면은 기존 FSM·스코프를 따른다.

## 버그

재현, 기대, 실제, 증거를 이슈에 적는다. 라벨 `버그`. 고치는 파일의 도메인 게이트를 그대로 돌린다.

## 에픽 구현

하위 이슈만 묶는다. 에픽 하나에 구현 전부를 넣지 않는다. 하위가 닫히기 전에 에픽을 닫지 않는다.

## poc

현재 [ToDo.md](ToDo.md) 모듈만. 지금 이름은 Unity POC 통합 코어 루프다. 시각 수용·슬롯 연결이 남았다. 두 번째 제품 모듈을 여기서 시작하지 않는다.

웹에서 코어 루프를 보려면 `https://seoul-kenshi.vercel.app/play/`와 `Game/play/`다. 새 Vercel 프로젝트를 만들지 않는다.

## 아트 파이프라인

런타임 아트는 `Game/Assets/Janseon/Art/` 하나다.

- 읽기: [캐릭터 미술](Wikis/game-logic/Character-Art-Direction.md), [에셋이 들어오는 길](Wikis/game-logic/Asset-Pipeline.md)
- BOM `look.owner_verdict: accepted` 없이 승격하지 않는다.
- 인물 초상은 포트레잇 툴 워크스페이스가 준비되기 전에는 생성하지 않는다. 카드만 올린다.

## 3d

프롭·캐릭터 3D. TRELLIS는 옵션이고 지정 호스트에서만 돌린다. Tripo는 사용자가 명시한 실행만. REJECT를 자동 PASS로 뒤집지 않는다.

## 명령 빠른 표

저장소 루트에서.

```bash
# 위키
npm ci --prefix Tool/tools
node Tool/tools/wiki/verify-cast.mjs --docs Wikis/game-logic

# 아키텍처 문서
node Tool/tools/architecture/check-unity-architecture.mjs

# Unity (UNITY_EDITOR를 6000.7.0a5 실행 파일로)
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" -runTests -testPlatform EditMode
```

이슈를 연 다음, 위 표의 정본만 만지고, 게이트 출력을 이슈나 PR에 붙인다.
