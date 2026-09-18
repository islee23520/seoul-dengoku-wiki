# 《서울:전국》 Design.md — POC UI 시각 계약

상태: 2026-09-06 개정 — UI 프레임워크를 uGUI로 고정(소유자 결정, [Intent](/design/Intent) 참조). 구현·캡처·검수는 이 문서를 기준으로 한다.
대상 해상도: `1280×720`, `1920×1080` (16:9). uGUI(Canvas) 전용. 텍스트는 TextMeshPro(TMP).

---

## 1. 시각 테제 (Visual Thesis)

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
- 전투: 게임뷰는 좌우 사이드스크롤 전장을 채운다(결정 10). HUD는 그 위 오버레이(상단 미터, 하단 카드 독 높이 214, 카드 132×180). 중앙 5×5 셀 HUD·칸 클릭 SRPG 보드가 아니다. 시간은 30Hz 실시간 진형·카드.
- 정산: 중앙 카드 520 폭.

### 3.2 1920×1080

- 안전 여백: 40px.
- 동일 비율 스케일. 레일 96px. 전투 게임뷰는 승강장 스케일만 키우고 셀 보드를 그리지 않는다.
- 가로 확장은 여백·카드 max-width로 흡수하고 본문 줄길이는 68자에 가깝게 유지.

### 3.3 공통

- 루트는 `flex-grow: 1`, 전체 화면. 스크롤은 조우 카드 목록·전투 로그만.
- 모달은 쓰지 않는다. 조우/정산은 같은 gameplay document 내 패널 전환.

### 3.4 HUD 영역 문법 (진형과 전투가 같은 뼈대)

진형(배치 명령)과 전투(카드 독)는 다른 화면이 아니다. **슬롯은 고정**하고 **내용만 교체**한다. 근거: interfaceingame.com의 실시간 전술 HUD — Clash Royale(하단 4카드), StarCraft II / Company of Heroes 2(하단 커맨드 그리드), Desperados III(계획·실행이 같은 하단 능력 바), Northgard / Stellaris(우측은 인스펙터이지 주 동사가 아님).

| 영역 | 고정 역할 | 진형에서 | 전투에서 |
|---|---|---|---|
| 중앙 | 게임뷰. 전장 승강장이 카메라를 채움 | 같은 전장. 적은 참고 실루엣 | 같은 전장. 분대 교전 |
| 상단 | 미터·일시정지 | 사기/HP 자리 + 일시정지(비활성 가능) | HP·사기·증원·일시정지 |
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
| 정산·복귀 | `settlement-panel`, `settlement-outcome`, `return-action` | settlement receipt fields |

`edit-formation`은 `formation-edit` 패널을 연다. `formation-edit-confirm`은 보류 진형을 확정 배치하고, `formation-edit-cancel`은 패널을 닫는다. facing 네 버튼(`formation-edit-facing-n/e/s/w`)은 보류 진형의 방향을 지정한다.

스냅샷은 동일 seed/state에 대해 요소 이름 집합·current 표시·그리드 점유가 결정론적이어야 한다.

### 5.3 코어 루프 액션 (Todo 12)

- Start → Foundation lease.
- 출정 → 역 이동 → 조우 → 해결 → 교섭/우회/전투 → 정산 → 복귀는 scoped `PocCoreLoopController`가 Core API로 처리한다.
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
- 전투 입력은 전투 전 진형 교대, 카드 사용, 일시정지/재개로 제한한다. 개별 유닛 직접 이동과 턴/AP 입력은 현재 계약이 아니다.
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

## 11. 안정 요소 이름 (기계 계약)

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

위 이름은 현재 Unity에서 사용 중인 계약이며 개명하지 않는다. #101의 12면과
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
| 전투 | `battle-dock`, `battle-hud`, `battle-play-pause`, 기존 카드·사기 이름 | 핵심 조작은 기존 이름으로 충족 |
| 정산 | `settlement-panel`, `settlement-outcome`, `return-action` | `settlement-world-change-list` |

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
