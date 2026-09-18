# 기여와 이슈

추적 표면은 GitHub 이슈다. 새 작업은 이슈를 연 뒤에 전용 worktree에서 구현한다. 이슈 없이 main에 세계관·아트·런타임을 섞지 않는다.

웹에서 이슈를 열 때는 [이슈 폼](.github/ISSUE_TEMPLATE/job.yml)을 쓴다. 빈 이슈는 끈다. `gh issue create`와 에이전트는 이 문서의 같은 다섯 섹션을 본문에 그대로 넣는다.

카테고리별로 어느 폴더를 열고 무엇을 먼저 하는지는 아래 「어디부터 손대는지」 절이다. 인물 산문은 [인물 등록 템플릿](LORE/Cast-Registration-Template.md)을 복사한다.

## 목표

- 《서울:전국》의 남은 일을 카테고리 라벨과 품질 게이트가 있는 이슈로 남긴다.
- 이슈끼리는 모순과 순환 의존이 없어야 한다.
- 완료는 ACK가 아니라 증거다. 문서 사이트는 게이트가 실패한 채 Vercel에 올리지 않고, Unity는 `6000.7.0a5` `-batchmode` 증거만 인정한다.
- 현재 제품 모듈은 `ToDo.md`의 하나뿐이다. 그 모듈의 게이트가 끝나기 전에 다음 모듈을 시작하지 않는다.

제품 범위와 기술 기준선은 [`Concept.md`](Concept.md), 지금 구현하는 모듈은 [`ToDo.md`](ToDo.md)다.

## 용어

| 말 | 뜻 |
|---|---|
| 게시 SoT | main의 `LORE/Cast-State-01.md`–`16.md`, `Cast-Index.md`, `Cast-Relations.md`, `Core-Characters.md`. 위키 원본이다. |
| 공개 문서 | VitePress `GAME-LOGIC/site/`. 로컬은 `npm run docs:dev`, 공개는 `https://seoul-kenshi.vercel.app`. GitHub Wiki는 쓰지 않는다. |
| 미게시·대기 | Cast-Index 보관 표의 상태. 파일 존재나 SHA가 게시 승인이 아니다. |
| 큐레이션 | 구세대 `docs/cast-*` 조각을 Cast-State SoT와 대조해 게시하거나 폐기하는 일. `git merge` 일괄 적용이 아니다. |
| 승격 | 권리·BOM·4축 검수와 리드 승인을 통과한 에셋만 런타임 경로에 넣는 일. |
| 품질 게이트웨이 | 이슈를 닫을 때 실행하는 명령과 합격 판정. 문구가 아니라 exit code·XML·해시·공개면 크기다. |
| worktree | 구현 전용 작업 사본. 주인은 하나다. `git worktree remove --force`는 `.omo` 증거까지 지운다. |
| Foundation | Bootstrap/FSM/VContainer 기준선. 완료된 기반이며 현재 모듈이 아니다. |
| POC | `ToDo.md`의 Unity POC 통합 코어 루프. 코어 코드 PASS만으로 모듈 완료가 아니다. 승격 에셋 연결이 남는다. |
| 4축 | COMPOSITION, SPRITE_FIDELITY, TYPOGRAPHY, PRODUCT_POLISH. raw 판정을 면제하지 않는다. |

`World-Narrative-Atlas.md`는 main에 없다. 게시 SoT를 이 이름으로 바꾸지 않는다.

## 이슈 본문 — 다섯 섹션 필수

모든 이슈 본문은 아래 제목을 헤더로 둔다. CLI·에이전트는 `## 목적`처럼 ATX 2단계, GitHub 이슈 폼은 필드 라벨을 `### 목적`으로 렌더한다. 검사기는 `##` 또는 `###` 다음의 제목 문자열만 본다.

```markdown
## 목적
## 비목표
## 정합성
## 품질 게이트웨이
## 완료 조건
```

| 섹션 | 쓸 내용 |
|---|---|
| 목적 | 닫혔을 때 관측 가능한 결과 한 덩어리. |
| 비목표 | 하지 않을 일. 이웃 이슈가 소유하는 파일·결정을 여기 적는다. |
| 정합성 | 어떤 이슈를 전제로 하는지, 무엇을 막는지, 게시 SoT·기존 이슈와 안 겹치는 이유. 순환 의존 금지. |
| 품질 게이트웨이 | 실행할 명령과 PASS/FAIL 판정. 아래 공통 게이트에서 해당 항만 고른다. |
| 완료 조건 | 체크 가능한 관측. “잘 되면”은 안 된다. |

CLI 예:

```bash
gh issue create --repo islee23520/seoul-kenshi \
  --title "카테고리: 한 줄 결과" \
  --label "세계관" --label "gateway" --label "quality:medium" \
  --body-file path/to/body.md
```

## 카테고리 라벨

하나만 고르지 않는다. 일이 걸치는 만큼 붙인다. 제목 앞은 주 카테고리 하나다.

| 라벨 | 쓸 때 |
|---|---|
| `세계관` | 세계·인물·지리·세력 설정 — 무엇이 존재하는가(등장인물·지역·연대기·경제·기술·문화) |
| `설정` | 규칙, 계약, 문서 정합, 도표 |
| `인물` | 캐스트, 관계, 프로필 |
| `사건` | 타임라인, 촉발 사건 |
| `이야기` | 서사 배치, 백스토리 |
| `게임로직` | 캠페인·전투·정산 규칙 — 시스템이 어떻게 작동하는가(프로세스·계약·결정론·벨런스·레퍼런스 분석) |
| `게임 구현` | 그 규칙의 **런타임 코드** |
| `유니티 작업` | 씬, 에디터, batchmode, 빌드 |
| `버그` | 결함, 결측, 드리프트 |
| `에픽 구현` | 하위 이슈를 묶는 에픽만 |
| `poc` | 현재 ToDo 모듈 범위 |
| `아트 파이프라인` | 2D/UI 생성, 검수, BOM |
| `3d` | 프롭·캐릭터 3D, TRELLIS 옵션 |

보조 라벨:

| 라벨 | 쓸 때 |
|---|---|
| `gateway` | 품질 게이트웨이 섹션이 있는 작업 이슈. 폼이 기본으로 붙인다. |
| `quality:high` | 시각·런타임·결측 복구. Unity/위키 공개면/4축 증거가 필요하다. |
| `quality:medium` | 문서·정합. 생성 Wiki 또는 checker GREEN이면 된다. |
| `quality:policy` | 병합 금지, 체크박스, 증거 보존. 구현보다 규칙을 고정한다. |
| `needs-curation` | 구세대 조각. 기계 병합으로 닫지 않는다. |

품질 등급은 **하나**만 붙인다.

## 정합성 규칙

- 구세대 `docs/cast-*` 브랜치를 main에 일괄 merge하는 이슈를 만들지 않는다. 큐레이션만 허용한다.
- 타이틀 COMPOSITION FAIL은 이슈 #8 단독이다. 같은 결함으로 이슈를 하나 더 열지 않는다.
- ToDo 16은 승격된 UI·캐릭터만 슬롯에 넣는다. #8·kit·캐릭터 승격 후보가 없으면 해당 슬롯을 채우지 않는다. 역사 소품 6종은 이미 연결됐다.
- ToDo 17은 ToDo 16 다음이다. Foundation/코어 테스트 GREEN만으로 닫지 않는다.
- G01–G06(파일 있음)과 G07–G24(기록 SHA에 파일 없음)를 한 이슈로 섞지 않는다.
- TRELLIS는 옵션이다. Tripo는 사용자 명시 실행만. REJECT를 자동 PASS로 뒤집지 않는다.
- 위키 본문에 `Kenshi`, `Underrail`, `Gunner`, `clone`, `복제`를 쓰지 않는다.

## 공통 품질 게이트

해당할 때만 이슈의 품질 게이트웨이 섹션에 붙인다.

Wiki:

```bash
node TOOL/tools/wiki/test-build-wiki.mjs
node TOOL/tools/wiki/verify-cast.mjs --docs LORE --stage all
node TOOL/tools/wiki/build-wiki.mjs LORE GAME-REFERENCE/assets/wiki <tmp> "$(git rev-parse HEAD)"
```

빌드가 실패하면 `https://seoul-kenshi.vercel.app`에 올리지 않는다. GitHub Wiki로 push하지 않는다.

Unity: [`TOOL/docs/Unity-Headless-Workflow.md`](TOOL/docs/Unity-Headless-Workflow.md). `6000.7.0a5` `-batchmode`, 전용 백그라운드 세션, GUI/`unicli`/uLoop/CuaDriver 금지. 증거는 NUnit XML과 PNG/해시와 cleanup 영수증이다.

아트: 권리·BOM fail-closed. 4축 raw 보존. 리드 승인 전 런타임 승격 금지. ComfyUI 신규 설치는 소유자 인터뷰 없이 이슈 범위에 넣지 않는다.

## 구현 위치

main의 기존 dirty/staged 파일은 보존한다. 구현은 전용 worktree 단일 주인에게 맡긴다. 커밋·push·PR은 사용자가 요청한 뒤에만 한다.

## 어디부터 손대는지

## 공통

1. 라벨을 고른다. 제목 앞은 주 카테고리 하나다.
2. 아래 표에서 정본 폴더를 연다. 생성 위키와 투영 페이지를 손으로 고치지 않는다.
3. 품질 등급은 하나다. 문서·정합은 `quality:medium`, 화면·런타임은 `quality:high`, 규칙 고정은 `quality:policy`.
4. 완료는 증거다. ACK만으로 닫지 않는다.

| 카테고리 | 정본 | 첫 파일 | 게이트 |
| --- | --- | --- | --- |
| 세계관 | `LORE/` — 세계에 존재하는 것: 인물·세력·지역·연대기·경제·기술·문화 | [Home.md](GDD/Home.md), [세계 서사 지도](LORE/World-Narrative-Atlas.md) | 위키 빌드, 금지 용어 |
| 설정 | `LORE/`, `GDD/` | 계약·도표 페이지, [Intent.md](Intent.md) | 위키 또는 문서 정합 |
| 인물 | `LORE/Cast-*` | [인물 등록 템플릿](LORE/Cast-Registration-Template.md) | `verify-cast.mjs` |
| 사건 | 타임라인 | [시나리오 타임라인](LORE/Scenario-Timeline.md) | 위키 빌드 |
| 이야기 | 서사 배치 | [세계 서사 지도](LORE/World-Narrative-Atlas.md) | 위키 빌드, 출처 충실 |
| 게임로직 | `GAME-LOGIC/` — 시스템이 작동하는 방식: 프로세스·계약·결정론·벨런스·레퍼런스 분석 | [유니티 구조](GAME-LOGIC/Unity-Architecture.md) 옆의 규칙 페이지 | 위키 빌드 |
| 게임 구현 | `GAME/Assets/Janseon/` | 해당 Core/Foundation 스크립트 | EditMode/PlayMode |
| 유니티 작업 | `Game/` | [GAME/AGENTS.md](GAME/AGENTS.md) | `6000.7.0a5` `-batchmode` |
| 버그 | 결함 위치 | 재현 로그 | 실패했던 명령 GREEN |
| 에픽 구현 | 하위 이슈 | 에픽 본문에 DAG | 하위 이슈 게이트 |
| poc | 현재 ToDo | [ToDo.md](ToDo.md) | 그 모듈의 수용 게이트 |
| 아트 파이프라인 | `GAME/Assets/Janseon/Art/`, BOM | [에셋이 들어오는 길](GDD/Asset-Pipeline.md) | BOM fail-closed, 초상은 툴 준비 전 생성 금지 |
| 3d | 프롭·캐릭터 3D | TRELLIS는 옵션, Tripo는 명시 실행만 | 권리·승격 전 금지 |

위키 공개 본문에 `Kenshi`, `Underrail`, `Gunner`, `clone`, `복제`를 쓰지 않는다.

## 세계관

서울 십육국, 레이어, 역, 회랑, 인물, 세력, 경제, 기술 — **세계에 무엇이 존재하는지**를 고친다. 규칙(어떻게 작동하는가)은 GAME-LOGIC 도메인이다.

- 읽기: [Home.md](GDD/Home.md), [서울과 지하철 레이어](LORE/World-and-Subway-Layers.md), [서울 십육국](LORE/Sixteen-States.md)
- 쓰기: 해당 위키 페이지. 새 페이지는 [_TEMPLATE.md](GDD/_TEMPLATE.md)의 `domain: world`
- 하지 말 것: 구현 완료처럼 적기, 생성 위키 손편집

이슈 제목 예: `세계관: …`

## 설정

규칙·계약·정합 문서. 세계관 산문과 런타임 코드를 한 PR에 섞지 않는다.

- 읽기: [Intent.md](Intent.md), `GDD/adr/`, [가치관과 정책 척도](LORE/Values-and-Policy-Scales.md)
- 쓰기: 계약 문장과 도표. 라벨 `설정`
- 게이트: 문서 정합, 필요하면 위키 빌드

## 인물

이름 있는 인물, 관계, 프로필.

1. [인물 카드 계약](LORE/Cast-Profile-Contract.md)을 읽는다.
2. [인물 등록 템플릿](LORE/Cast-Registration-Template.md)을 복사한다.
3. 총람·JSON·관계 원장을 같은 변경에 맞춘다.
4. 초상 마크다운과 실물 사진은 넣지 않는다.

이슈 라벨 `인물`. 가치관 10칸과 욕망을 채운 뒤에만 PR.

인물 카드와 관계를 Markdown으로 추가하거나 고치는 일은 텍스트 계약 검토가 기본이다. 카드 필수 칸, 출처 상태, 이름·ID 분리, 가치관·욕망 일치, 관계 방향과 관계 수, 링크, 개인정보 금지 항목을 확인하고 새 한국어 산문은 Patina로 읽는다. 렌더링에 영향을 주는 변경이면 실제 위키 화면도 확인한다.

문서 내용만 바꾼 PR에 테스트 파일이나 전용 검증기를 새로 만들지 않는다. 파서·스키마·JSON 형식·기존 검증 규칙처럼 기계가 소비하는 계약의 동작을 바꿀 때만 가장 가까운 기존 테스트를 좁게 보강한다. 이미 같은 조건을 검사하는 게이트가 있으면 그 결과를 재사용하며, 같은 문구를 여러 테스트에 고정하거나 캐스트 한 명을 위해 저장소 전체 테스트를 늘리지 않는다.

## 사건

개막 전후 시간과 촉발.

- 정본: [시나리오 타임라인](LORE/Scenario-Timeline.md)
- 상대 연대는 붕괴 N년. 근거 없이 나이를 잠그지 않는다.

## 이야기

서사 배치와 백스토리. 인물 칸을 비운 채 이야기만 올리지 않는다.

- 원본: [세계 서사 지도](LORE/World-Narrative-Atlas.md)
- 투영 페이지(`Hostile-Group-*` 등)는 재생성 대상이다. 내용을 지도·영수증에 두고 페이지만 고치지 않는다.

## 게임로직

캠페인·전투·정산 규칙 — **시스템이 어떻게 작동하는가**(프로세스·계약·결정론·벨런스·레퍼런스 분석). 코드가 아니라 세계의 사물이 아니라, 그 사이에서 일어나는 상호작용의 설계도다.

- 예: [출격하고 돌아오는 흐름](GAME-LOGIC/Campaign-Loop.md), [실시간 진형·카드 전투](GAME-LOGIC/Realtime-Formation-Card-Battle.md), [같은 선택이 같은 결과가 되나](GAME-LOGIC/Save-and-Determinism.md), [레퍼런스 분석](GAME-LOGIC/Ref-Mechanism-Index.md)
- LORE(무엇이 존재하는가)와 구분: GAME-LOGIC은 그 존재들이 게임 내에서 어떤 절차로 만나고 충돌하는지를 정의한다.
- 런타임 변경은 `게임 구현`으로 따로 연다.

## 게임 구현

규칙의 C# 런타임. Unity 프로젝트 루트는 `Game/`이다.

- 경계: `Janseon.Core`는 엔진에 의존하지 않는다. Foundation이 Unity·VContainer와 잇는다.
- 읽기: [GAME/Assets/Janseon/AGENTS.md](GAME/Assets/Janseon/AGENTS.md)
- 게이트: 해당 EditMode 또는 PlayMode. 테스트를 지우거나 skip하지 않는다.

## 유니티 작업

씬, 에디터, 빌드, batchmode.

- 읽기: [GAME/AGENTS.md](GAME/AGENTS.md), [유니티 구조](GAME-LOGIC/Unity-Architecture.md)
- 실행: Unity `6000.7.0a5`, `-batchmode`, 전용 백그라운드. GUI 에디터로 검증하지 않는다.
- 안내: [TOOL/docs/Unity-Headless-Workflow.md](TOOL/docs/Unity-Headless-Workflow.md)

전역 Singleton으로 화면 상태를 두지 않는다. 새 화면은 기존 FSM·스코프를 따른다.

## 버그

재현, 기대, 실제, 증거를 이슈에 적는다. 라벨 `버그`. 고치는 파일의 도메인 게이트를 그대로 돌린다.

## 에픽 구현

하위 이슈만 묶는다. 에픽 하나에 구현 전부를 넣지 않는다. 하위가 닫히기 전에 에픽을 닫지 않는다.

## poc

현재 [ToDo.md](ToDo.md) 모듈만. 지금 이름은 Unity POC 통합 코어 루프다. 시각 수용·슬롯 연결이 남았다. 두 번째 제품 모듈을 여기서 시작하지 않는다.

웹에서 코어 루프를 보려면 `https://seoul-kenshi.vercel.app/play/`와 `GAME/play/`다. 새 Vercel 프로젝트를 만들지 않는다.

## 아트 파이프라인

런타임 아트는 `GAME/Assets/Janseon/Art/` 하나다.

- 읽기: [캐릭터 미술](GAME-LOGIC/Character-Art-Direction.md), [에셋이 들어오는 길](GDD/Asset-Pipeline.md)
- BOM `look.owner_verdict: accepted` 없이 승격하지 않는다.
- 인물 초상은 포트레이트 툴 워크스페이스가 준비되기 전에는 생성하지 않는다. 카드만 올린다.

## 3d

프롭·캐릭터 3D. TRELLIS는 옵션이고 지정 호스트에서만 돌린다. Tripo는 사용자가 명시한 실행만. REJECT를 자동 PASS로 뒤집지 않는다.

## 명령 빠른 표

저장소 루트에서.

```bash
# 위키
npm ci --prefix TOOL/tools
node TOOL/tools/wiki/verify-cast.mjs --docs LORE

# 아키텍처 문서
node TOOL/tools/architecture/check-unity-architecture.mjs

# Unity (UNITY_EDITOR를 6000.7.0a5 실행 파일로)
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" -runTests -testPlatform EditMode
```

이슈를 연 다음, 위 표의 정본만 만지고, 게이트 출력을 이슈나 PR에 붙인다.
