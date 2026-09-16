# 방향 결정 기록 (Intent)

상태: 2026-09-06 소유자 결정 두 건 확정, 2026-09-07 결정 3·4 추가, 2026-09-14 결정 1·5·6 갱신. 구현 금지 — 이 문서와 계약·게이트웨이·계획·이슈·로드맵만 이번 단계에서 산출한다.

이 문서는 소유자 결정을 기록하고, 뒤이은 계약 개정과 품질 게이트웨이 잠금의 근거가 된다.

## 결정 9 — 공식 게임명: 서울:전국 (2026-09-16)

- 2026-09-16 소유자 지시로 공식 사용자 노출 게임명을 **《서울:전국》**으로 확정한다.
- 제품 콘셉트, 세계관, 게임 규칙과 현재 구현 범위는 바꾸지 않는다.
- GitHub 저장소명, 로컬 디렉터리명, Vercel 프로젝트·주소, 패키지명과 번들 식별자 같은 기술 식별자는 기존 자동화와 배포 경로를 위해 유지한다.
- 실행 이슈: #127

## 결정 3 — 목표 형태: 4X + RPG, 전투는 실시간 진형·카드 전투 (2026-09-07)

- 2026-09-07 소유자 지시: 이 게임은 "**4X with RPG**"이며, 전투는 턴제 SRPG가 아니라 "**real time battle with formation and card based**"로 만든다. 목표 형태의 기준 레퍼런스는 **Songs of Silence**(Chimera Entertainment, 2024 — 지도 턴 4X + 실시간 자동 전투 + 영웅 카드)다.
- 같은 날 한국어 웹 SRPG 라벨렌 전기를 역설계해 턴제 쪽 마지막 정밀 참조로 두었다. 거기서 가져오는 것은 턴 구조가 아니라 사기·항복 3조건·지휘조·인연 등급·병참 준비안·예고된 증원 같은 전투 바깥 계약이다.
- 유지하는 계약: 1.5m 4방향 타일 격자, 캐릭터 실루엣 계약, 동일 seed + 명령 기록 결정론, 부상 이행, 포획·영입 관계 게이트. 시야·카메라는 결정 5. 바뀝는 것은 전투 안에서 플레이어가 하는 일뿐이다 — 유닛 단위 턴 명령 대신 전투 전 진형 편집, 전투 중 카드(일시정지 가능, 덱 구축·랜덤 드로우 없음), 후퇴·항복 판단.
- 개정한 문서: [실시간 진형·카드 전투](Wikis/game-logic/Realtime-Formation-Card-Battle.md)(옛 `SRPG-Combat.md`를 이름 변경), [이 게임이 뭔지](Wikis/game-logic/Game-Thesis.md), [레퍼런스 게임 조사](Wikis/game-logic/Game-References.md), [개발 로드맵](Wikis/game-logic/Development-Roadmap.md), 새 레퍼런스 페이지 [Songs of Silence](Wikis/game-logic/Ref-Songs-of-Silence.md)·[라벨렌 전기](Wikis/game-logic/Ref-Ravelen-Chronicles.md), [Concept.md](Concept.md), [ToDo.md](ToDo.md) 비목표. 도표 계약 테스트(`Tool/wiki/test-core-isometric-diagrams.mjs`)의 고정 문장도 같은 변경에서 갱신했다.
- 현재 모듈(`Unity POC 통합 코어 루프`)은 바뀌지 않는다. POC의 동일 격자 턴제 규칙(ToDo 8)은 이 결정이 구현되기 전까지의 과도 상태이며, **다음 모듈은 실시간 진형·카드 전투 코어**로 지정한다(로드맵 6번). 이 단계에서는 구현하지 않는다.
- 미결 사항(다음 모듈 계획에서 잠근다): 틱 간격, 카드 재충전 규칙, 사기 임계 수치, 전투 판정 수치를 라벨렌식 9스탯으로 둠지 Songs of Silence식 소수 수치+특성으로 압축할지, 자동 해결 허용 범위.

## 결정 4 — 오드랜드 그래픽·SFX·VFX 전량 반입, Spine은 POC 에셋으로 (2026-09-07)

- 2026-09-07 소유자 지시: 실시간 진형·카드 전투는 미리 렌더된 다이아몬드 아이소 타일을 요구하지 않으므로, 소유자 자작 프로젝트 오드랜드의 FBX·3D 에셋을 게임 영역에 전량 반입해 우리 카메라·격자 안에서 쓴다. 이어 "fully copy those game graphic assets and sfx vfx into this project"로 범위를 그래픽·SFX·VFX 전부로 확정했다.
- Spine 에셋은 POC 사람 표현으로 쓴다.
- 권리: 오드랜드 그래픽 에셋은 소유자 소유·전면 자유 사용 선언(2026-09-07). spine-unity 런타임은 Esoteric Software 런타임 라이선스 대상이며 소유자 Spine 에디터 라이선스가 전제다.
- 실행: `Tool/art/import-oddland-donor.mjs`가 `/Volumes/gameWorkspace/game-refs/oddland-unity`에서 `Game/Assets/Quarantine/Oddland/`로 결정론적 복사하고 `Reference/assets/bom/donor/`에 매니페스트·SHA-256 목록을 남긴다. 페이로드는 LFS 할당량 문제로 gitignore, 매니페스트만 추적. 게이트 7(BOM fail-closed)과 거리 표시 규칙은 그대로다 — 기증은 승격이 아니며 런타임 슬롯 연결은 여전히 `look.owner_verdict: accepted`를 요구한다.
- 상세: [에셋이 들어오는 길](Wikis/game-logic/Asset-Pipeline.md) 「기증 에셋: 오드랜드 패이로드」.

## 결정 1 — 사람 캐릭터: 오드랜드 Spine POC (2026-09-14)

- POC 사람 표현은 오드랜드 Spine이다. Spine 에셋은 POC 사람 표현으로 쓴다.
- 실루엣은 2.5등신, 동·서·남·북 네 방향. 정본은 [이 게임이 뭔지](Wikis/game-logic/Game-Thesis.md).
- 실행 이슈: #58

## 결정 2 — UI 프레임워크: UI Toolkit 폐기, uGUI로 고정

- 2026-09-06 소유자 결정: UI Toolkit을 쓰지 않는다. UI는 **uGUI(Canvas)** 로 만든다. 텍스트 스택은 uGUI 표준인 TextMeshPro(TMP)를 따른다.
- [Design.md](Design.md) 를 개정해 프레임워크 계약을 uGUI로 잠갔다(해상도·색 토큰·간격·타이포·레이아웃·안정 요소 이름·캡처 게이트는 기존 값 유지).
- 기존 UI Toolkit 구현(UXML/USS/UIDocument 기반 MainTitle·Foundation 화면과 그 테스트)은 이 계약 위반 상태가 되며, 전용 마이그레이션 이슈로 치환한다. 구현은 이번 단계에서 하지 않는다.
- 마이그레이션 이슈: #59

## 결정 5 — 시야·카메라 2.5D, 전투는 Songs of Silence (2026-09-14)

- 시야와 카메라는 용사주식회사 채널의 2.5D 전투 화면을 따른다.
- 레퍼런스 채널: https://www.youtube.com/@hero_inc-l6u
- 전투 메커닉 영상: https://www.youtube.com/watch?v=FXmBd6mgVVg
- 2.5D 화면 영상: https://www.youtube.com/watch?v=wOgbtZMhaxg
- 전투 형태는 Songs of Silence와 같은 실시간 진형·카드 전투다.

## 결정 6 — 화면 목표는 poc-complete 열 면 (2026-09-14)

- 화면 목표는 `.omo/design/poc-complete.html` 의 열 면이다.
- 소유자 판단: 이 HTML이 가려는 UI에 가장 가깝다.
- 열 면: 시작 프리셋, 캐릭터 생성, 세계 인물 모집, 거점 허브, 캐릭터 대화, 전략 노선도, 역간 여행, 조우, 전투, 정산.
- 색인 이슈: #101. 보고서: `/Reference/ui-ux-refs/`.

## 품질 게이트웨이 잠금 (두 작업 공통)

아래 게이트는 계획·이슈·구현 어느 단계에서도 완화되지 않는다. 이 잠금은 소유자 결정이다.

1. Unity `6000.7.0a5` `-batchmode` 전용. GUI Editor·CuaDriver·uLoop·unicli 금지.
2. 사용자 활성 화면과 분리된 전용 worktree 단일 주인. main의 dirty/staged 보존.
3. 행동 변경은 RED-first. 테스트 skip/xfail 추가 금지.
4. 증거 = NUnit XML + PNG/hash + cleanup receipt.
5. `node Tool/architecture/check-unity-architecture.mjs` 종료 0 — 게이트 기대값과 코드를 같은 변경 안에서 함께 갱신한다.
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

## 결정 7 — 캠페인 함의: 후세 서울의 지역·신앙 분열 (2026-09-13, 확정)

- 2026-09-13 소유자가 레퍼런스 위키 본문 대조로 확정했다(비공개 SoT, STATUS CONFIRMED).
- 레퍼런스 **고유 문법**(바닐라와 구분): 후세 지역 정체성, 신종교·문화 상호작용과 잔해 기술·침공/이벤트, **잔해 신앙화** — 구세계 상징 신격화·화폐/소비 의례 신화·기계·공장 숭배 — 종파 분열 매트릭스. 서울 매핑은 이 고유 항목만 쓴다.
- 붕괴 이후 서울은 **후세 서울**이다. 캠페인이 그리는 질서는 단일 국가 복구가 아니라 **지역과 신앙이 갈라진 노선 사회**다.
- 이 결정은 **캠페인 함의만**이다. 전투는 아이소 사각·4방향·이동 후 행동을 유지하고 레퍼런스 게임 UI 이식은 금지다. 초상 파이프·전술 베이크·Unity HUD를 바꾸지 않는다.
- 아트: 비주얼은 후세 서울의 잔해 신앙화·지방 정체성만. 레퍼런스 초상 프레임·문장·복식 복제 금지. 포트레잉은 우리 **2D 슬롯 합성** 유지. 아이소 캐릭터에 중세 갑옷 평균값 금지. 키아트·포트레잇 초안 보류는 해제되며 소재는 서울 매핑만.
- 마케팅: 대외 문구는 《잔선》 세계만.

## 결정 8 — UI 애니메 풍 초상은 제3 표면 (2026-09-12)

- 2026-09-12 소유자 락: UI의 **애니메 풍 초상**은 전술 Tool/character-forge 베이크(결정 5)와도, 남쪽 idle 셀 크롭과도 구별되는 **제3 표면**이다. 세 표면의 파이프를 섞지 않는다.
- (a) 전술 표면 — Tool/character-forge에서 굽는 아이소 캐릭터 시트(2.5등신·4방향). 결정 1의 실루엣·눈 강조는 여기 남고, 몸구조는 결정 5를 따른다.
- (b) 남쪽 idle 크롭 — 전술 시트 남쪽 idle 셀을 UI Image에 붙이는 기존 경로. 과도·폐기 대상이며, 이 결정의 UI 초상 파이프가 아니다. 해당 문장은 날짜 개정으로 남기고 침묵 덮어쓰지 않는다.
- (c) UI 제3 표면 — 눈·머리·얼굴·옷처럼 교체 가능한 **원본 2D 플레이트**를 정해진 슬롯 순서로 **오프라인 합성**한다. Unity는 합성 PNG/아틀라스만 받는다. 런타임 레이어 스택·키아트 한 장 등록·전술 메시/8방향 시트를 초상으로 쓰는 것은 이 표면이 아니다.
- 전술과 공유하는 것은 정체성 토큰(머리색·의상 팔레트·성별·피부)뿐이다. 등신·카메라·4방향을 UI 초상에 요구하지 않는다.
- 결정 5의 이미지 생성 금지를 UI에서 우회하지 않는다. 이 표면의 스틸은 원본 2D 플레이트와 오프라인 합성이다. OpenAI 이미지 생성, TRELLIS, sprite-gen을 플레이트 제작·보정·실패 대체로 쓰지 않으며, 결정 5에 이미지젠 예외를 만들지 않는다.
