# 방향 결정 기록 (Intent)

상태: 2026-09-06 소유자 결정 두 건 확정, 2026-09-07 결정 3·4 추가. 구현 금지 — 이 문서와 계약·게이트웨이·계획·이슈·로드맵만 이번 단계에서 산출한다.

이 문서는 소유자 결정 네 건을 기록하고, 뒤이은 계약 개정과 품질 게이트웨이 잠금의 근거가 된다.

## 결정 3 — 목표 형태: 4X + RPG, 전투는 실시간 진형·카드 전투 (2026-09-07)

- 2026-09-07 소유자 지시: 이 게임은 "**4X with RPG**"이며, 전투는 턴제 SRPG가 아니라 "**real time battle with formation and card based**"로 만든다. 목표 형태의 기준 레퍼런스는 **Songs of Silence**(Chimera Entertainment, 2024 — 지도 턴 4X + 실시간 자동 전투 + 영웅 카드)다.
- 같은 날 한국어 웹 SRPG 라벨렌 전기를 역설계해 턴제 쪽 마지막 정밀 참조로 두었다. 거기서 가져오는 것은 턴 구조가 아니라 사기·항복 3조건·지휘조·인연 등급·병참 준비안·예고된 증원 같은 전투 바깥 계약이다.
- 유지하는 계약: 카메라 45/35.264 고정 직교 아이소, 1.5m 4방향 타일 격자, 캐릭터 실루엣 계약, 동일 seed + 명령 기록 결정론, 부상 이행, 포획·영입 관계 게이트. 바뀝는 것은 전투 안에서 플레이어가 하는 일뿐이다 — 유닛 단위 턴 명령 대신 전투 전 진형 편집, 전투 중 카드(일시정지 가능, 덱 구축·랜덤 드로우 없음), 후퇴·항복 판단.
- 개정한 문서: [실시간 진형·카드 전투](docs/game-logic/Realtime-Formation-Card-Battle.md)(옛 `SRPG-Combat.md`를 이름 변경), [이 게임이 뭔지](docs/game-logic/Game-Thesis.md), [레퍼런스 게임 조사](docs/game-logic/Game-References.md), [개발 로드맵](docs/game-logic/Development-Roadmap.md), 새 레퍼런스 페이지 [Songs of Silence](docs/game-logic/Ref-Songs-of-Silence.md)·[라벨렌 전기](docs/game-logic/Ref-Ravelen-Chronicles.md), [Concept.md](Concept.md), [ToDo.md](ToDo.md) 비목표. 도표 계약 테스트(`tools/wiki/test-core-isometric-diagrams.mjs`)의 고정 문장도 같은 변경에서 갱신했다.
- 현재 모듈(`Unity POC 통합 코어 루프`)은 바뀌지 않는다. POC의 동일 격자 턴제 규칙(ToDo 8)은 이 결정이 구현되기 전까지의 과도 상태이며, **다음 모듈은 실시간 진형·카드 전투 코어**로 지정한다(로드맵 6번). 이 단계에서는 구현하지 않는다.
- 미결 사항(다음 모듈 계획에서 잠근다): 틱 간격, 카드 재충전 규칙, 사기 임계 수치, 전투 판정 수치를 라벨렌식 9스탯으로 둠지 Songs of Silence식 소수 수치+특성으로 압축할지, 자동 해결 허용 범위.

## 결정 4 — 오드랜드 그래픽·SFX·VFX 전량 반입, Spine은 POC 에셋으로 (2026-09-07)

- 2026-09-07 소유자 지시: 실시간 진형·카드 전투는 미리 렌더된 다이아몬드 아이소 타일을 요구하지 않으므로, 소유자 자작 프로젝트 오드랜드의 FBX·3D 에셋을 게임 영역에 전량 반입해 우리 카메라·격자 안에서 쓴다. 이어 "fully copy those game graphic assets and sfx vfx into this project"로 범위를 그래픽·SFX·VFX 전부로 확정했다.
- Spine 에셋은 **POC 에셋**으로만 쓴다. 최종 플레이어 캐릭터 표현은 결정 1(TOS식 SD)과 아바타 재검토 권안 A′ 사이의 소유자 미결 사항으로 남는다.
- 권리: 오드랜드 그래픽 에셋은 소유자 소유·전면 자유 사용 선언(2026-09-07). spine-unity 런타임은 Esoteric Software 런타임 라이선스 대상이며 소유자 Spine 에디터 라이선스가 전제다.
- 실행: `tools/art/import-oddland-donor.mjs`가 `/Volumes/gameWorkspace/game-refs/oddland-unity`에서 `Game/Assets/Quarantine/Oddland/`로 결정론적 복사하고 `docs/assets/bom/donor/`에 매니페스트·SHA-256 목록을 남긴다. 페이로드는 LFS 할당량 문제로 gitignore, 매니페스트만 추적. 게이트 7(BOM fail-closed)과 거리 표시 규칙은 그대로다 — 기증은 승격이 아니며 런타임 슬롯 연결은 여전히 `look.owner_verdict: accepted`를 요구한다.
- 상세: [에셋이 들어오는 길](docs/game-logic/Asset-Pipeline.md) 「기증 에셋: 오드랜드 패이로드」.

## 결정 1 — 사람 캐릭터: 구현 placeholder 폐기, TOS식 SD로 재작업 (승인됨)

- 2026-09-06 소유자 육안: 기존 3역할 placeholder(탐사원·의무원·순찰대)는 사용 불가 판정. 각 BOM `look.owner_verdict: rejected`로 기록됐다.
- 같은 날 소유자가 재작업 방향을 승인했다: **트리 오브 세이비어식 SD** — 눈 강조 단순화 얼굴, 2.5등신, 무광 손그림 질감. 몸구조(3D 메시 + 도트 머리)는 2026-09-11 결정 5에서 폐기하고 character-forge 리그 베이크로 바꾼다.
- 스타일 목표 시트: `.omo/evidence/character-direction/tos-sd-direction-mockup.png` (런타임 에셋이 아니라 방향 참조용 목업이다).
- 수치 목표와 출처는 [캐릭터 미술 방향](docs/game-logic/Character-Art-Direction.md) 「스타일 레퍼런스」·「재작업 수치 목표」 절에 잠겨 있다.
- 재작업 이슈: #58

## 결정 2 — UI 프레임워크: UI Toolkit 폐기, uGUI로 고정

- 2026-09-06 소유자 결정: UI Toolkit을 쓰지 않는다. UI는 **uGUI(Canvas)** 로 만든다. 텍스트 스택은 uGUI 표준인 TextMeshPro(TMP)를 따른다.
- [Design.md](Design.md) 를 개정해 프레임워크 계약을 uGUI로 잠갔다(해상도·색 토큰·간격·타이포·레이아웃·안정 요소 이름·캡처 게이트는 기존 값 유지).
- 기존 UI Toolkit 구현(UXML/USS/UIDocument 기반 MainTitle·Foundation 화면과 그 테스트)은 이 계약 위반 상태가 되며, 전용 마이그레이션 이슈로 치환한다. 구현은 이번 단계에서 하지 않는다.
- 마이그레이션 이슈: #59

## 품질 게이트웨이 잠금 (두 작업 공통)

아래 게이트는 계획·이슈·구현 어느 단계에서도 완화되지 않는다. 이 잠금은 소유자 결정이다.

1. Unity `6000.7.0a5` `-batchmode` 전용. GUI Editor·CuaDriver·uLoop·unicli 금지.
2. 사용자 활성 화면과 분리된 전용 worktree 단일 주인. main의 dirty/staged 보존.
3. 행동 변경은 RED-first. 테스트 skip/xfail 추가 금지.
4. 증거 = NUnit XML + PNG/hash + cleanup receipt.
5. `node tools/architecture/check-unity-architecture.mjs` 종료 0 — 게이트 기대값과 코드를 같은 변경 안에서 함께 갱신한다.
6. 시각 산출은 4축(COMPOSITION / SPRITE_FIDELITY / TYPOGRAPHY / PRODUCT_POLISH) raw 판정 보존, FAIL 면제 금지.
7. 에셋 승격은 BOM fail-closed — `look` 필수, `look.owner_verdict: accepted` 없는 승격 금지.
8. 안정 요소 이름(`main-title-root` 등 Design.md 11절)은 프레임워크와 무관하게 유지한다.
9. 씬 직접 로드 금지 — Start는 `ApplicationFlowCoordinator.OpenFoundationAsync`만 호출.
10. 캡처 게이트 C1–C10(1280×720·1920×1080)과 동일 seed 결정론 재현 유지.

## 이번 단계 산출물 (구현 없음)

- 이 문서(Intent)
- Design.md 개정 (uGUI 계약 잠금)
- Development-Roadmap.md 갱신
- ToDo.md 증분 추가
- 마이그레이션·재작업 실행 계획: `.omo/plans/ui-ugui-and-character-rebuild.md`
- GitHub 이슈 등록: #59(uGUI 마이그레이션), #58(TOS식 SD 캐릭터 재작업) — 에픽 #13 하위 등록

## 결정 5 — 전술 캐릭터는 character-forge, TRELLIS·sprite-gen 폐기 (2026-09-11)

- 전술 캐릭터와 걸음은 submodule `character-forge`에서 굽는다. pilgrimage 중세 리그의 근미래 포크다.
- TRELLIS, sprite-gen, ComfyUI, NanoBanana, Grok Imagine, OpenAI 이미지 생성은 전술 캐릭터·프롭 생성에 쓰지 않는다.
- 3D 메시 바디 + 2D 도트 머리 하이브리드(결정 1의 몸구조)는 전술 시트에서 폐기한다. 실루엣·눈 강조·서울 의상 조사는 유지한다.
- 역사 프롭은 오드랜드 기증 경로를 탄다. TRELLIS로 새로 만들지 않는다.

