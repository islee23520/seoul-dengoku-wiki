# 방향 결정 기록 (Intent)

상태: 2026-09-06 소유자 결정 확정. 구현 금지 — 이 문서와 계약·게이트웨이·계획·이슈·로드맵만 이번 단계에서 산출한다.

이 문서는 2026-09-06 소유자 결정 두 건을 기록하고, 뒤이은 계약 개정과 품질 게이트웨이 잠금의 근거가 된다.

## 결정 1 — 사람 캐릭터: 구현 placeholder 폐기, TOS식 SD로 재작업 (승인됨)

- 2026-09-06 소유자 육안: 기존 3역할 placeholder(탐사원·의무원·순찰대)는 사용 불가 판정. 각 BOM `look.owner_verdict: rejected`로 기록됐다.
- 같은 날 소유자가 재작업 방향을 승인했다: **트리 오브 세이비어식 SD** — 3D 메시 바디 + 2D 도트 머리 빌보드, 눈 강조 단순화 얼굴, 2.5등신 유지, 무광 손그림 질감.
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
