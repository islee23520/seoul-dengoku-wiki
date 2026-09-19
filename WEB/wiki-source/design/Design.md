# 《서울:전국》 Design.md — 목표 UI 계약과 POC 시각 계약

상태: 2026-09-19 개정 — [Intent.md](/design/Intent) 결정 11. 제품 목표 UI는 토탈워식 부대 지휘다. 0절이 계약이고, 1절 이하는 현 Unity POC 시각 계약을 그대로 남긴다. uGUI 프레임워크 고정(2026-09-06) 자체는 유효하다.
목표 설계 해상도: 설계 템플릿 검수용 1440×900·1600×1000·1920×1080·390×844. POC 캡처는 `1280×720`, `1920×1080` (16:9). uGUI(Canvas) 전용. 텍스트는 TextMeshPro(TMP).

---

## 0. 목표 UI 계약 (2026-09-19, 결정 11)

이 절은 제품 목표 화면의 설계 계약이다. 현 Unity 요소 이름을 개명하지 않으며, 새 전투가 구현됐다고 쓰지 않는다. 실물 레이아웃은 `GDD/system-design/total-war-ui/`에 둔다.

지휘 대상은 전장에 참가한 부대다. 영웅 직접 조작을 만들지 않는다. 부대 목록은 카드 덱이 아니며, 자원 소비·드로우·재충전을 넣지 않는다. 선택한 부대에 새 명령을 내면 현재 지시를 교체한다. 미리보기를 취소하면 기존 지시를 유지한다. 확인된 지시만 수락 기록에 남긴다. 웨이포인트 연쇄, 명령 큐, 감속·배속은 이번 범위 밖이다.

이름 있는 영웅 캐릭터와 병졸 분대는 전장 단위가 다르다. 영웅은 병졸 수에 포함되지 않는 별도 지휘 인물이며, 병졸 한 분대는 20명 이하로 표시한다. 영웅 수, 전체 분대 수와 군단 상한은 정하지 않는다. UI는 영웅 초상·상태와 병졸 분대 인원·진형을 같은 숫자로 합치지 않는다.

필수 화면: 캠페인 노선·여행, 파티 편성, 조우 응답, 전장 배치, 부대 지휘, 철수·항복 확인, 결과 확인, 다음 행선. 조우 현장 거래는 `현장 거래`로 쓰고, 원정 결말 `교역`과 섞어 쓰지 않는다. 결과를 반영한 뒤 원정을 계속할 수 있다. 귀환·정착·정복·방랑·교역은 서로 다른 결말이다. 질서 있는 철수는 명령, 패주는 사기 붕괴, 항복은 자발이다. 막힌 퇴로만으로 항복 선택을 지우지 않는다. 포획은 인물 신병 결과이며 종료 상태와 같은 말로 쓰지 않는다.

목표 전장 카메라는 3D 자유 지휘다. 팬·오빗·줌으로 부대를 읽고, 각도·시야각 수치는 이 문서가 만들지 않는다. 상단 전장 도식은 문서용 청사진이며 실제 게임 렌더가 아니다. 이 카메라 기본안은 2026-09-19 질문 시간 초과 뒤 채택했으며, 소유자 직접 결정이 아니다. 좌우 사이드스크롤은 1절 이하 POC다.

목표 지휘 HUD는 실제 일시정지·재개 상태를 보여 준다. 정지는 그 파티의 닫힌 전투만 멈추며 공유 캠페인 월드와 다른 파티를 멈추지 않는다. 정지 중에도 부대 선택, 명령 미리보기, 취소, 확인을 할 수 있다. 확인된 지시는 결정론적 수락 순서에 남고, 재개 뒤 다음 시뮬레이션 단계에서 적용된다. 같은 부대에 다시 확정한 지시는 이전 지시를 교체한다. 비활성 자리표시로 일시정지를 그리지 않는다. 감속·배속은 없다. 이 시간 제어도 질문 시간 초과 뒤 채택한 기본안이다.

인물 표현은 애니메이션풍 정비율이다. SD나 반실사 초상을 목표로 쓰지 않는다. 오드랜드·카드 HUD·아이소 도표는 1절 이하 POC 기록이다.

---

## 1. POC 시각 테제 (Visual Thesis, 현 Unity 계약)

붕괴 이후 서울 지하철은 네온 사이버펑크가 아니라 **젖은 콘크리트, 꺼진 안내판, 비상 전원, 녹슨 선로, 손때 묻은 노선도**다.

- 빛: 차가운 비상등(청백) + 드문 신호 적황. 스펙큘러 하이라이트 최소화.
- 면: 무광 금속, 마모된 타일, 흐릿한 유리. 그라데이션은 1–2 stop만.
- 선: 노선도 문법 — 직교·45° 폴드, 역 원점, 구간 굵기. UI 구분선도 같은 두께 체계.
- 색 의미: 노선·상태·위험만 채도를 쓰고, 장식 네온·이모지·글리치 오버레이 금지.
- 톤: 조용한 긴장. “살아남기 위한 행정” 느낌. 과장된 호러·히어로 포스터 금지.

거부 목록: generic neon sci-fi, 이모지, 스크린샷 붙여넣기 페이크, `Button1`/`TODO` 프로그래머 placeholder, 가독 불가 장식 텍스트.

---

## 2. 디자인 토큰

### 2.1 색 (sRGB hex, uGUI 스타일 토큰)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg-void` | `#0B111C` | 전체 배경 |
| `--bg-panel` | `#141C2A` | 패널·카드 |
| `--bg-panel-raised` | `#1B2536` | 호버·선택 면 |
| `--bg-well` | `#0E1622` | 격자·입력 우물 |
| `--stroke-quiet` | `#2A3548` | 기본 테두리 |
| `--stroke-focus` | `#C9A227` | 포커스 링 (신호 황) |
| `--stroke-danger` | `#8B3A3A` | 위험·패배 |
| `--text-primary` | `#E6EAF0` | 본문·제목 |
| `--text-secondary` | `#9AA6B2` | 보조 라벨 |
| `--text-muted` | `#6B7684` | 비활성 |
| `--accent-line` | `#3D7EA6` | 노선·진행 (지하철 청) |
| `--accent-safe` | `#3F6B54` | 우회·안전 |
| `--accent-talk` | `#5B6B8A` | 교섭 |
| `--accent-fight` | `#8B4A3A` | 전투 |
| `--signal-live` | `#C9A227` | 현재 단계·활성 역 |
| `--grid-line` | `#243044` | 전투 격자 |
| `--ally-cell` | `#2A4A5C` | 아군 칸 |
| `--foe-cell` | `#5C2A2A` | 적 칸 |

### 2.2 간격·반경·선

| 토큰 | 720p | 1080p | 비고 |
|---|---|---|---|
| `--space-1` | 4 | 6 | 아이콘 갭 |
| `--space-2` | 8 | 12 | 컴포넌트 내부 |
| `--space-3` | 16 | 24 | 카드 패딩 |
| `--space-4` | 24 | 36 | 섹션 갭 |
| `--space-5` | 40 | 56 | 화면 여백 |
| `--radius-sm` | 2 | 3 | 칩 |
| `--radius-md` | 4 | 6 | 카드·버튼 |
| `--stroke-w` | 1 | 1–2 | 기본 테두리 |
| `--focus-w` | 2 | 3 | 포커스 링 |

### 2.3 타이포그래피 (한국어 우선)

| 역할 | 720p | 1080p | 두께 | 용도 |
|---|---|---|---|---|
| Display | 36 | 48 | Medium | 타이틀 로고 타이포 |
| Title | 24 | 32 | Medium | 화면 제목 |
| Section | 18 | 22 | Medium | 패널 헤더 |
| Body | 15 | 18 | Regular | 본문·카드 |
| Caption | 12 | 14 | Regular | 보조·메타 |
| MonoMeta | 12 | 14 | Regular | tick·hash·좌표 (숫자 폭 안정) |

규칙:

- 런타임 폰트: 플랫폼 기본 CJK 폴백(macOS Apple SD Gothic Neo / 시스템 산돌) — 커스텀 폰트 에셋은 Todo 13.
- CJK 줄바꿈: 단어 중간 강제 끊기 금지 대신 **어절 단위**, 조사 고아 1글자 허용. 카드 제목은 2줄 클램프.
- 자간: 본문 0, Display +2%. 영문 약어(SRPG, POC)는 본문 크기 유지.
- 색 대비: 본문 `text-primary` on `bg-panel` ≥ 4.5:1 목표. `text-muted`는 비활성에만.

---

## 3. 레이아웃 그리드

### 3.1 1280×720

- 안전 여백: 24px.
- 타이틀: 세로 중앙 스택 (로고 영역 280×120, 액션 열 320).
- 캠페인: 상단 스테이지 레일 64px, 좌 노선 360, 우 상세 860.
- 전투: 게임뷰는 좌우 사이드스크롤 전장을 채운다(결정 10, POC 화면). HUD는 그 위 오버레이(상단 미터, 하단 카드 독 높이 214, 카드 132×180). 중앙 5×5 셀 HUD·칸 클릭 SRPG 보드가 아니다. 시간은 30Hz 실시간 진형·카드. 결정 11 목표 HUD는 0절이며, 이 수치는 POC다.
- 정산: 중앙 카드 520 폭.

### 3.2 1920×1080

- 안전 여백: 40px.
- 동일 비율 스케일. 레일 96px. 전투 게임뷰는 승강장 스케일만 키우고 셀 보드를 그리지 않는다.
- 가로 확장은 여백·카드 max-width로 흡수하고 본문 줄길이는 68자에 가깝게 유지.

### 3.3 공통

- 루트는 `flex-grow: 1`, 전체 화면. 스크롤은 조우 카드 목록·전투 로그만.
- 모달은 쓰지 않는다. 조우/정산은 같은 gameplay document 내 패널 전환.

### 3.4 POC HUD 영역 문법 (진형과 전투가 같은 뼈대)

아래는 현 Unity POC HUD다. 결정 11 목표 화면은 0절과 `GDD/system-design/total-war-ui/`다. 진형(배치 명령)과 전투(카드 독)는 다른 화면이 아니다. **슬롯은 고정**하고 **내용만 교체**한다. 근거: interfaceingame.com의 실시간 전술 HUD — Clash Royale(하단 4카드), StarCraft II / Company of Heroes 2(하단 커맨드 그리드), Desperados III(계획·실행이 같은 하단 능력 바), Northgard / Stellaris(우측은 인스펙터이지 주 동사가 아님).

| 영역 | 고정 역할 | 진형에서 | 전투에서 |
|---|---|---|---|
| 중앙 | 게임뷰. 전장 승강장이 카메라를 채움 | 같은 전장. 적은 참고 실루엣 | 같은 전장. 분대 교전 |
| 상단 | 미터·일시정지 | 사기/HP 자리 + 일시정지(POC) | HP·사기·증원·일시정지(POC). 목표 일시정지는 0절 |
| 하단 | **주 동사 독** 높이 214 | 3×3 슬롯 + facing + 확정/취소 | 지휘관 카드 4장 132×180 |
| 하단 좌 | 선택 지휘관 초상 | 배치 중인 분대 | 카드 소유자 |
| 우측 | 인스펙터만. 주 동사 금지 | 선택 분대 상세(접을 수 있음) | 접거나 적 정보만 |
| 좌측 | 명단 축약 | 6분대 칩 | 초상만으로 축소 가능 |

하지 말 것: 진형 주 동사를 우측 370 레일에만 두기. 전투만 하단 독으로 바꾸기. 우측을 “커맨드 레일”이라고 부르기.

캠페인·거점·월드 맵은 이 전장 HUD가 아니다. 그 화면은 각자 다른 게임뷰를 쓰고, 상단 스테이지 칩만 공통이다.

---

## 4. 재사용 프리미티브와 상태

| 이름 | 요소 | 상태 |
|---|---|---|
| `jk-panel` | 면+stroke | default |
| `jk-button` | 버튼 | default / hover / focus / pressed / disabled |
| `jk-button--primary` | Start·확정 | 위 + accent-line 하단 2px |
| `jk-button--danger` | 전투 선택 | accent-fight stroke |
| `jk-chip` | 스테이지·역 | idle / current / done / locked |
| `jk-card` | 조우 선택 | idle / focus / selected |
| `jk-rail` | 가로 스테이지 레일 | — |
| `jk-route` | 세로/가로 역 연결 | node current/adjacent/dim |
| `jk-grid` | 논리 점유(디버그) | 플레이어 HUD가 아님. 전투 화면은 분대 실루엣 |
| `jk-meter` | HP/사기/재충전 | fill 0–100% 또는 Core tick 값 |
| `jk-meta` | tick·hash | mono |

포커스: 항상 `stroke-focus` 링. 키보드만으로 모든 1차 액션 도달.

---

## 5. 화면 계약

### 5.1 MainTitle (`main-title-root`)

- 필수 이름: `main-title-root`, `main-title-mark`, `main-title-start`.
- Start는 기존 공개 FSM `ApplicationFlowCoordinator.OpenFoundationAsync`만 호출. 씬 직접 로드 금지.
- 카피: 제품명 《서울:전국》, 한 줄 피치(짧은 보조). 테스트는 문구를 고정하지 않고 **요소 존재·액션·FSM**만 검증.
- 배경: void + 희미한 노선 폴드(uGUI 기하, 이미지 텍스처 의존 없음).

### 5.2 Gameplay document (`gameplay-root`) — Foundation lease

한 active lease당 **Canvas 하나**. 패널 활성 전환으로 단계 표현.

| 패널 | 이름 | 스냅샷 소스 |
|---|---|---|
| 스테이지 레일 | `stage-rail`, `stage-base-prep` … `stage-base-ready` | `CampaignStage` 6단 |
| 노선 | `route-rail`, `station-Yeongdeungpo`, `station-Sindorim`, `station-Guro` | `RouteGraph` + `CampaignState.Node` |
| 조우 선택 | `encounter-choices`, `choice-negotiate`, `choice-bypass`, `choice-combat` | `CampaignStage.Resolution` |
| 전투 | `battle-hud`, `battle-hp`, `battle-morale`, `battle-reinforcement-forecast`, `card-general-recharge`, `battle-card-guard-shieldwall`, `battle-card-encourage-morale`, `battle-card-pincer-focus`, `battle-card-mobility-regroup`, `battle-play-pause`, `battle-dock` | `BattleSimState` + `BattleSessionDriver.Paused`. 게임뷰는 승강장 위 분대(6v6, 분대당 병사 4+리더). `battle-grid`/`battle-cell`은 플레이어 HUD가 아니다. |
| 진형 편집 | `edit-formation`, `formation-edit`, `formation-edit-confirm`, `formation-edit-cancel`, `formation-edit-facing-n`, `formation-edit-facing-e`, `formation-edit-facing-s`, `formation-edit-facing-w` | 보류 진형(pending formation) 상태 |
| 정산 | `settlement-panel`, `settlement-outcome`, `return-action` | settlement receipt fields. POC 루프는 복귀를 보여 준다. 결정 11 목표에서는 결과 반영 뒤 원정 계속이 가능하다. |

`edit-formation`은 `formation-edit` 패널을 연다. `formation-edit-confirm`은 보류 진형을 확정 배치하고, `formation-edit-cancel`은 패널을 닫는다. facing 네 버튼(`formation-edit-facing-n/e/s/w`)은 보류 진형의 방향을 지정한다.

스냅샷은 동일 seed/state에 대해 요소 이름 집합·current 표시·그리드 점유가 결정론적이어야 한다.

### 5.3 POC 코어 루프 액션 (Todo 12)

- Start → Foundation lease.
- 출정 → 역 이동 → 조우 → 해결 → 교섭/우회/전투 → 정산 → 복귀는 scoped `PocCoreLoopController`가 Core API로 처리한다. 이 복귀는 POC 화면이다. 결정 11 목표는 결과 반영 뒤 원정 계속을 연다.
- 전투 중에는 노선 패널을 숨겨 HUD·5×5 격자·전투 기록의 가로 공간을 확보하고 정산 시 복원한다.

---

## 6. 키보드·접근성

| 순서 | MainTitle | Gameplay |
|---|---|---|
| 1 | `main-title-start` | `stage-rail` 내 current chip (표시만, 탭 스킵 가능) |
| 2 | — | 가시 역 노드 (current 우선) |
| 3 | — | 가시 조우 카드  Neg → Bypass → Combat |
| 4 | — | `formation-swap-front` → `edit-formation` → (`formation-edit` 패널 가시 시 `formation-edit-facing-n`→`-e`→`-s`→`-w` → `formation-edit-confirm`/`formation-edit-cancel`) → `battle-card-guard-shieldwall`/`battle-card-encourage-morale`/`battle-card-pincer-focus`/`battle-card-mobility-regroup` → `battle-play-pause` |
| 5 | — | `return-action` |

- Tab / Shift+Tab 순환. Enter·Space 활성화.
- 포커스 가능 요소만 `focusable`. 장식 라벨은 제외.
- 색만으로 상태 구분 금지: current chip은 하단 2px signal 바 + `aria` 대응 가능한 name 접미사 `-current` 클래스.

---

## 7. 모션

- 허용: 120–180ms ease-out 페이드/슬라이드(패널 전환), 포커스 링 즉시.
- 금지: 루프 네온 펄스, 카메라 흔들림, 전투 이펙트 파티클(Todo 13+).
- 결정론 캡처 중에는 모션 0 (uGUI 애니메이션 비활성 상태 `jk-motion-off`).

---

## 8. 에셋 규칙

- UI 기하·색은 2절 토큰. 래스터 필수 시에만 승격 텍스처, BOM fail-closed.
- 프로그래머 placeholder 텍스처·임시 이모지 폰트 금지.
- 프리팹·스타일 경로는 `Assets/Janseon/Foundation/UI/` 고정. 누락 시 lease readiness 실패.
- 씬 YAML 손편집 금지. Builder/`AssetDatabase`만.

---

## 9. 수용된 부채 (Accepted Debt)

- 커스텀 한글 폰트·아이콘 세트는 Todo 13.
- POC 전투 입력은 전투 전 진형 교대, 카드 사용, 일시정지/재개로 제한한다. 개별 유닛 직접 이동과 턴/AP 입력은 POC 계약이 아니다. 결정 11 목표는 부대 선택과 현재 지시 교체다. 목표 템플릿의 일시정지·재개는 닫힌 전투 안에서만 미리보기·확인을 허용하며, 이 동작은 질문 시간 초과 뒤 채택한 기본안이다.
- 역사 3D/캐릭터 메시는 Todo 14–16. 본 계약은 UI 평면만.
- PanelSettings는 단일 공유 에셋. 테마 런타임 스위치 없음.

---

## 10. 캡처 매트릭스

| ID | 화면 | 상태 | 해상도 | 파일 stem |
|---|---|---|---|---|
| C1 | MainTitle | idle focus Start | 1280×720 | `main-title-1280x720` |
| C2 | MainTitle | idle focus Start | 1920×1080 | `main-title-1920x1080` |
| C3 | Route+Stage | BasePrep @ Yeongdeungpo | 1280×720 | `campaign-route-stage-1280x720` |
| C4 | Route+Stage | 동일 | 1920×1080 | `campaign-route-stage-1920x1080` |
| C5 | Encounter | Resolution choices | 1280×720 | `encounter-choices-1280x720` |
| C6 | Encounter | 동일 | 1920×1080 | `encounter-choices-1920x1080` |
| C7 | Battle | Open grid HUD | 1280×720 | `battle-state-1280x720` |
| C8 | Battle | 동일 | 1920×1080 | `battle-state-1920x1080` |
| C9 | Settlement | applied + return | 1280×720 | `settlement-return-1280x720` |
| C10 | Settlement | 동일 | 1920×1080 | `settlement-return-1920x1080` |

각 receipt: Unity `6000.7.0a5`, seed/state/hash, 실행 시작 시 고정한 실제 HEAD와 source fingerprint, 해상도, stem. 실행 중 source/HEAD 변동과 불일치 receipt는 실패한다.

저장 위치는 `JANSEON_CAPTURE_DIR` 절대 경로로 분리한다. 미지정 시 기존 `.omo/evidence/unity-poc-core-loop/task-11-ui-toolkit/captures/`를 사용한다. 검증기는 `--head`와 `--source-fingerprint`로 의도한 소스 신원을 전달받아 PNG bytes와 receipt를 대조한다.

---

## 11. POC 안정 요소 이름 (기계 계약, 개명하지 않음)

```
main-title-root
main-title-mark
main-title-start
gameplay-root
stage-rail
stage-base-prep
stage-expedition
stage-encounter
stage-resolution
stage-settlement
stage-base-ready
route-rail
station-Yeongdeungpo
station-Sindorim
station-Guro
encounter-choices
choice-negotiate
choice-bypass
choice-combat
battle-hud
battle-grid
battle-cell-{x}-{y}   # x,y in 0..4
battle-hp
battle-morale
battle-reinforcement-forecast
card-general-recharge
battle-card-guard-shieldwall
battle-card-encourage-morale
battle-card-pincer-focus
battle-card-mobility-regroup
formation-swap-front
formation-selection
edit-formation
formation-edit
formation-edit-confirm
formation-edit-cancel
formation-edit-facing-n
formation-edit-facing-e
formation-edit-facing-s
formation-edit-facing-w
battle-play-pause
settlement-panel
settlement-outcome
return-action
```

위 이름은 현재 Unity에서 사용 중인 POC 계약이며 개명하지 않는다. 결정 11 목표
화면은 이 표를 런타임 식별자로 승격하지 않는다. #101의 12면과
사망·후계 보조 목업에서 새로 필요한 이름은 아래와 같다. **신규** 이름은 화면
설계 계약이지 현 Unity `UiElementNames`에 이미 구현되었다는 뜻이 아니다.
HTML 목업에서 먼저 같은 이름을 붙이고, Unity 구현 이슈에서 상수·바인딩·
EditMode·캡처 검사를 추가한다. 장식용 문구에는 기계 이름을 강제하지 않는다.

| 화면 | 기존 이름 재사용 | 신규 안정 요소 이름 |
|---|---|---|
| 캐릭터 생성·착생 | 없음 | `character-creation-panel`, `embodiment-random-action`, `embodiment-custom-action`, `character-origin-preview`, `character-confirm-action` |
| 시작 프리셋 | `main-title-preset-station-master`는 기존 타이틀 선택 요소로 유지 | `preset-selection-panel`, `preset-option-{presetId}`, `preset-effects-preview`, `preset-confirm-action` |
| 세계 인물 모집 | 없음 | `recruitment-panel`, `recruit-candidate-{personId}`, `recruit-offer-action`, `recruit-response-panel` |
| 거점 허브 | `gameplay-root`, `mission-console`, `hub-bulletin-panel`, `territory-panel` | `person-status-panel`, `current-place-label`, `situation-notice-panel` |
| 캐릭터 대화 | 없음 | `dialogue-panel`, `dialogue-speaker-portrait`, `dialogue-choices`, `dialogue-choice-{choiceId}`, `dialogue-trust-{sourcePersonId}-to-{targetPersonId}`, `dialogue-info-reliability-{claimId}` |
| 출격 인원 선택 | `deploy-panel`, `deploy-heading`, `deploy-toggle-{rosterIndex}`, `action-depart` | `deploy-capacity-label` |
| 전략 노선도 | `route-rail`, 기존 `station-*` | `strategic-route-panel`, `route-knowledge-{routeId}`, `route-forecast-{routeId}`, `route-selected-detail` |
| 역간 여행 | `travel-path`, `travel-cost`, `travel-forecast`, `travel-state` | `travel-panel`, `travel-confirm-action` |
| 조우 | `encounter-choices`, `choice-negotiate`, `choice-bypass`, `choice-combat` | `encounter-panel`, `encounter-context` |
| 전투 전 진형 편집 | `formation-edit`, `formation-edit-unit-{unitId}`, `formation-edit-slot-{slotId}`, `formation-edit-confirm`, `formation-edit-cancel` | 핵심 조작은 기존 이름으로 충족 |
| 전투 | `battle-dock`, `battle-hud`, `battle-play-pause`, 기존 카드·사기 이름 | POC 핵심 조작은 기존 이름으로 충족. 결정 11 목표 지휘 HUD는 이 이름을 개명하지 않고 별도 설계 템플릿에 둔다 |
| 정산 | `settlement-panel`, `settlement-outcome`, `return-action` | `settlement-world-change-list`. POC는 복귀를 보여 주고, 목표 화면은 결과 확인 뒤 원정 계속을 연다 |

| 보조 목업 | 신규 안정 요소 이름 |
|---|---|
| 생전 후계 지정 | `heir-designation-panel`, `heir-candidate-{personId}`, `heir-validity-indicator`, `heir-projected-titles`, `heir-projected-assets`, `heir-designate-action` |
| 유효 후계자의 사망 후 승계 | `death-outcome-panel`, `death-successor-portrait`, `death-title-result`, `death-asset-result`, `death-continue-action` |
| 유효 후계자 없는 게임오버 | `death-outcome-panel` 재사용, `death-game-over-reason`, `death-archive-action`, `death-new-world-action` |
| 계정 아카이브 | `account-archive-panel`, `archive-character-{personId}`, `archive-timeline`, `archive-close-action` |

`{presetId}`, `{personId}`, `{choiceId}`, `{routeId}`, `{claimId}`와
신뢰 표시의 `{sourcePersonId}`, `{targetPersonId}`는 해당 데이터의 안정 ID,
`{rosterIndex}`는 현재 로스터 인덱스다. 이름에 NPC/타 유저의 조종 여부를
넣지 않는다. 표시 상태는 요소 이름과 분리한다. `situation`은
`hidden|forecast|active`, `knowledge`는 `unknown|rumour|confirmed|inferred`,
`heir-validity`는 `unassigned|eligible-now|invalid-now`를 쓴다.
후계 최종 판정은 사망 순간에만 일어난다. 사망 결과는 `heir|game-over`,
작위별 결과는 `inherited|contested|vacant`로 별도 표시한다.

위 기존 이름과 #101 신규 이름이 해당 화면 계약의 단일 출처다. 문구 리터럴은 테스트하지 않는다.

## 12. 검수 소품의 현재 연결

Foundation의 여섯 역사 소품은 동일 화면 lease의 카메라가 RenderTexture로 렌더링하고 노선 패널에 표시한다. 프리뷰는 런타임 3D 모델·재질을 사용하며 정적 screenshot 대체물이 아니다. 카메라·프리뷰 RenderTexture는 Foundation unload 시 해제된다. 소품은 보존된 원본 hash, 실제 독립 검수 파일과 현재 import/runtime 증거로 BOM에 연결한다. 캐릭터·타이틀·아이콘·역사 텍스처의 미확인 서비스 경로와 검수는 별도 미완료 상태다.

---

## 13. 초상 제작실 Gate 4 큐레이션 도구

`TOOL/portrait-gen/`는 런타임 uGUI 화면이 아니라 제작·검수용 정적 웹 도구이자 SQLite 자산 작업공간이다. 기존 어두운 무광 제작실 문법을 유지하며, 만들어진 모든 컴포넌트 후보를 사용자가 직접 비교하고 AI 개선 입력으로 돌려보내는 Gate 4 표면을 제공한다.

### 13.1 논리 슬롯과 물리 레이어

- 사용자 선택은 `clothes`, `hair` 같은 논리 슬롯으로만 노출한다.
- `clothes_back / clothes / clothes_front`는 하나의 의상 variant set이다.
- `hair_back / hair`는 하나의 헤어 variant set이다.
- 물리 레이어는 기존 z와 source-over 순서를 유지하지만 별도 선택·랜덤·JSON 항목이 아니다.
- 현재 카메라에서 필요 없는 앞/뒤 member는 명시적 empty member로 허용한다.

### 13.2 Gate 4 상태

후보의 제작 상태와 사용자 큐레이션 결정을 분리한다.

| 축 | 값 | 의미 |
|---|---|---|
| 제작 상태 | `accepted / rejected / superseded / unreviewed` | evidence와 계보가 말하는 현재 상태 |
| 사용자 결정 | `adopt / hold / reject / pending` | 다음 product 통합·수리 작업에 주는 입력 |

반려·구버전 후보도 catalog에서 숨기지 않는다. 단, catalog 노출은 production 랜덤 조합 사용 권한을 의미하지 않는다.

### 13.3 웹 토큰

기존 `portrait.css`의 토큰을 제작실 웹 표면의 단일 출처로 쓴다.

- 배경·패널: `--bg`, `--panel`
- 선: `--line`
- 본문·보조: `--text`, `--muted`
- 현재·채택: `--accent`, `--ink`
- 반려·오류: `--error`
- 간격은 4px 배수의 기존 8/12/16/20/24/32/40 계열만 사용한다.
- 포커스는 기존 2px `--accent` outline을 유지한다.

### 13.4 재사용 프리미티브

| 이름 | 역할 | 상태 |
|---|---|---|
| `curation-toolbar` | 성별·bundle·제작 상태 필터와 진행 집계 | default / filtered |
| `candidate-grid` | overflow-safe 후보 카드 grid | populated / empty |
| `candidate-card` | 하나의 논리 후보와 physical member·계보 표시 | pending / adopt / hold / reject |
| `candidate-preview` | 투명 PNG checkerboard 미리보기 | visible / zero-alpha-metadata |
| `candidate-lineage` | accepted/rejected/superseded/unreviewed 상태 | 상태 텍스트 필수 |
| `feedback-controls` | 채택·보류·반려와 메모 입력 | default / focus / saved |
| `validation-node-list` | 요소 그래프 노드별 PASS/FAIL/PENDING | machine-only; 시각 승인 아님 |

### 13.5 레이아웃·스크롤 책임

- 페이지 document가 유일한 세로 스크롤 소유자다.
- 큐레이션 grid와 카드는 내부 세로 스크롤을 만들지 않는다.
- grid는 `repeat(auto-fit, minmax(min(18rem, 100%), 1fr))`로 좁은 컨테이너에서도 가로 overflow를 만들지 않는다.
- 긴 candidate path, SHA, 메모는 `overflow-wrap: anywhere`로 카드 폭 안에서 줄바꿈한다.
- 전 해상도 매트릭스는 별도 사용자 요청이 있을 때만 실행한다. 기본 품질 게이트는 실제 포트레잇 조합과 큐레이션 플로우다.

### 13.6 Gate 4 완료 조건

- catalog가 production plate와 명시적으로 분류된 evidence candidate를 누락 없이 포함한다.
- 모든 후보는 사용자 결정과 메모를 저장·복구·JSON export할 수 있다.
- 요소 그래프는 alpha, ownership, bundle, occlusion, seam/hole, palette/LUT preview, 실제 source-over 합성 결과를 노드별 evidence로 출력한다.
- 수치 GREEN은 시각 PASS가 아니다. 최종 `adopt / hold / reject`는 사용자 피드백 record가 결정한다.
- blocking 후보가 `pending`인 동안 Gate 4는 PASS할 수 없다.
- preview LUT·마스크·diagnostic PNG는 실제 product composite로 승격할 수 없다.
