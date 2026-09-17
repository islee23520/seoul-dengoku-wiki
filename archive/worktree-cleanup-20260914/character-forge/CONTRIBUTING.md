# 기여와 이슈

추적 표면은 GitHub 이슈다. 새 작업은 이슈를 연 뒤에 전용 worktree에서 구현한다. 이슈 없이 main에 세계관·아트·런타임을 섞지 않는다.

웹에서 이슈를 열 때는 [이슈 폼](.github/ISSUE_TEMPLATE/job.yml)을 쓴다. 빈 이슈는 끈다. `gh issue create`와 에이전트는 이 문서의 같은 다섯 섹션을 본문에 그대로 넣는다.

## 목표

- 《잔선: 서울》의 남은 일을 카테고리 라벨과 품질 게이트가 있는 이슈로 남긴다.
- 이슈끼리는 모순과 순환 의존이 없어야 한다.
- 완료는 ACK가 아니라 증거다. Wiki는 빌드가 실패한 채 push하지 않고, Unity는 `6000.7.0a5` `-batchmode` 증거만 인정한다.
- 현재 제품 모듈은 `ToDo.md`의 하나뿐이다. 그 모듈의 게이트가 끝나기 전에 다음 모듈을 시작하지 않는다.

제품 범위와 기술 기준선은 [`Concept.md`](Concept.md), 지금 구현하는 모듈은 [`ToDo.md`](ToDo.md)다.

## 용어

| 말 | 뜻 |
|---|---|
| 게시 SoT | main의 `docs/game-logic/Cast-State-01.md`–`16.md`, `Cast-Index.md`, `Cast-Relations.md`, `Core-Characters.md`. 위키 원본이다. |
| GitHub Wiki | `docs/game-logic/`의 생성 미러. 손으로 고치지 않는다. 원본을 고치고 빌더로 다시 게시한다. |
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
| `세계관` | 십육국, 레이어, 적대 집단, 공개 위키 구조 |
| `설정` | 규칙, 계약, 문서 정합, 도표 |
| `인물` | 캐스트, 관계, 프로필 |
| `사건` | 타임라인, 촉발 사건 |
| `이야기` | 서사 배치, 백스토리 |
| `게임로직` | 캠페인·전투·정산 **규칙 문서** |
| `게임 구현` | 그 규칙의 **런타임 코드** |
| `유니티 작업` | 씬, 에디터, batchmode, 빌드 |
| `버그` | 결함, 결측, 드리프트 |
| `에픽 구현` | 하위 이슈를 묶는 에픽만 |
| `poc` | 현재 ToDo 모듈 범위 |
| `아트 파이프라인` | 2D/UI 생성, 검수, BOM |
| `3d` | 기증 프롭·3D. TRELLIS 금지 |

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
- TRELLIS와 sprite-gen은 쓰지 않는다. 전술 캐릭터는 character-forge다. REJECT를 자동 PASS로 뒤집지 않는다.
- 위키 본문에 `Kenshi`, `Underrail`, `Gunner`, `clone`, `복제`를 쓰지 않는다.

## 공통 품질 게이트

해당할 때만 이슈의 품질 게이트웨이 섹션에 붙인다.

Wiki:

```bash
node tools/wiki/test-build-wiki.mjs
node tools/wiki/verify-cast.mjs --docs docs/game-logic --stage all
node tools/wiki/build-wiki.mjs docs/game-logic docs/assets/wiki <tmp> "$(git rev-parse HEAD)"
```

빌드가 실패하면 공개 Wiki에 push하지 않는다. 게시 전에 마지막 정상 위키 커밋을 적는다.

Unity: [`docs/Unity-Headless-Workflow.md`](docs/Unity-Headless-Workflow.md). `6000.7.0a5` `-batchmode`, 전용 백그라운드 세션, GUI/`unicli`/uLoop/CuaDriver 금지. 증거는 NUnit XML과 PNG/해시와 cleanup 영수증이다.

아트: 권리·BOM fail-closed. 4축 raw 보존. 리드 승인 전 런타임 승격 금지. TRELLIS·ComfyUI·sprite-gen 설치를 이슈 범위에 넣지 않는다.

## 구현 위치

main의 기존 dirty/staged 파일은 보존한다. 구현은 전용 worktree 단일 주인에게 맡긴다. 커밋·push·PR은 사용자가 요청한 뒤에만 한다.
