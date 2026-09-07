# makcha-unity 어셋 재활용 실사 — Hunter02 캐릭터·승강장 프롭 (2026-09-07, 읽기 전용)

- 배경: 소유자 제안 — makcha-unity(막차)에서 쓰던 Hunter02 캐릭터와 승강장 프롭을 seoul-kenshi에 사용하는 방안.
- 본 문서는 조사 기록이지 반입 승인이 아니다. 반입은 마스터 플랜의 blank-environment extraction gate + seoul BOM 재등록을 통과해야 한다.

## 1. 실물 목록 (파일 나열 기반, 2026-09-07)

- 캐릭터: `MakchaEncore/Assets/Makcha/Art/Hunters/hunter_02/` — hunter_02-runtime.fbx, hunter_02-game-v1.glb(정식), `Handoff/Hunter02Motion-2026-08-26/approved-37bone/hunter_02-rigged-approved-37bone.glb`(리그 승인본), candidates/33-bone WIP GLB. 의상 blend 1(gym-outfit-character-base.blend).
- 적대: shadow 계열 5색 + 보스 5종(stage1~4, robson, ttukseom) — GLB 14개 중 대부분.
- 모션: Handoff 패키지 — Mixamo FBX 6종(female-idle/walk, 댄스 4), 리타깃·스킨웨이트·QA 스크립트, SHA256SUMS, UNITY_HANDOFF.md.
- 파이프라인: tools/Hunter02/(prepare_tripo_candidate.py — Lee Youngseob ARP 좌표 컨트랙트: Tripo +X front → Z-90 → -Y front, 1.7m 발 접지, Tripo 아머처 제거 강제), tripo_arp_orientation.py, tools/art/hunter02_pipeline.py(유료 호출 게이트 TRIPO_CREDITS_APPROVED).
- **승강장 프롭: 없음.** station/metro/train/platform 메시 0건. `PlatformBuildContractTests`는 배포 플랫폼(Android 주·WebGL 보조) 계약 테스트로 물리적 승강장과 무관. seoul에는 이미 자체 승강장 프롭 6종 승격 완료(ticket-gate·bench·cabinet·pillar·pump-crate·shutter — docs/assets/bom/props/).
- 모델 합계: fbx 7 · glb 14 · blend 1.

## 2. 출처·권리 (makcha 자체 기록 판독)

- Hunter02 파이프라인: 클립로xy 컨셉 T포즈 턴테이블 → Tripo image-to-multiview → Tripo multiview-to-mesh → Tripo biped 리그 → 리타깃. task_id·sha256이 provenance.json 1.0 체인으로 전부 기록됨(license 필드: "owner-authorized Tripo output").
- identity-lock.json: "adult compact **5.0 to 5.5 head proportion**" 불변 항목 명시, license "project-owned". 상태 design-locked-production-candidate.
- 리그: Auto-Rig Pro가 최종 권위(37본 승인). Tripo 자동 리그는 폐기 가능. 모션: Mixamo Y-Bot 리타깃("no hunter upload, no auto-rig") — Mixamo 클립 라이선스는 makcha 기록에 별도 표기 없음(UNVERIFIED — 채택 시 Adobe Mixamo 약관 공식 확인 필요).
- 모션 품질: UNITY_HANDOFF.md 명시 — 33본 WIP 후보는 idle만 PASS, walk/attack 4종 FAIL(발 부유·몸 티어링·리본 파편). "work-in-progress handoff, not an approved runtime replacement. Do not overwrite hunter_02-game-v1.glb."
- Tripo 출력 권리: makcha는 project-owned 취급. seoul 채택 시 Tripo 상업 약관 공식 확인을 BOM에 별도 등기(현재 UNVERIFIED).
- 주의 기록: makcha 파이프라인 자체에 TOS restricted-reference gate("Tree of Savior files stay outside the repository and outside every generator request") — Hunter02는 TOS 파일 미사용 오리지널.

## 3. 기술 적합성 (seoul 계약 대조)

| 항목 | Hunter02 | seoul 계약/방향 | 판정 |
|---|---|---|---|
| 등신 | 5.0~5.5 (identity-lock 불변) | 현재 잠금 2.5등신 SD / 검토 중 A′ 4.5~5.5 | **현재 계약 위반, A′ 채택 시 정합** — reuse는 아트 방향 결정의 하위 문제 |
| 스케일 | 1.7m, 발 Z=0 컨트랙트 | 타일 1.5u (인간 ≈ 1.13타일) | 정합 |
| 리그/애니 | ARP 37본 + Mixamo 리타깃 절차 | 4방향 이동+23클립 계약 | 절차 이식 가능, 클립 품질은 FAIL 상태(재작업 필요) |
| 스타일 | 애니 툰(짙은 청록 트윈테일 전술 아이돌) | 툰 렌더 방향(검토 중) | 렌더 정합, 단 캐릭터 자체는 makcha 제품 아이덴티티 |
| 포맷 | GLB/FBX | GLB/FBX + Blender 정합 | 정합 |
| 위키 게이트 | — | makcha 명칭 신규 산출물 사용 금지(플랜) | 반입 시 파일명·라벨에서 'hunter/makcha' 용어 처리 주의 |

## 4. 판정

- **승강장 프롭 재활용: 기각(실물 부재).** makcha에는 승강장 프롭이 없고, seoul은 이미 자체 프롭 6종을 BOM 승격으로 보유. 이 절반은 원래 성립하지 않았던 전제.
- **헌터 캐릭터 "그대로 캐스팅": 비추천.** Hunter02는 makcha의 제품 아이덴티티(전술 아이돌)이지 서울 주민이 아니다. 서울 캐스트의 최종 룩으로 쓰면 두 게임의 정체성이 겹친다.
- **헌터 파이프라인·리그 자산의 이식: 강력 권장.** (a) Tripo 다중뷰→ARP 37본→Mixamo 리타깃→1.7m 컨트랙트는 A′(4.5~5.5등신 툰 풀스케일형) 방향에서 TRELLIS 단독보다 검증된 인체 경로, (b) QA 도구(프레임별 GIF QA, SHA256SUMS, GLB 컨트랙트 테스트) 그대로 재사용 가능, (c) Hunter02 GLB는 서울 그리드 위 **애니메이션/전술 스터브 액터**(플레이서버)로 즉시 유용 — 캐스트 룩 확정 전 이동·전투 검증에 쓰고 버리는 용도.
- 선행 조건: 아트 방향 결정(A′ 등신 확정)이 선행돼야 현재 GenreContract(2.5등신) 위반 없이 런타임 반입 가능. 도구 이식은 blank-environment extraction gate(플랜 명시)로.

## 5. 도입 경로 (소유자 결정 후, 순서대로)

1. 소유자 결정: 용도 선택 — (a) 스터브 액터(권장), (b) 파이프라인·도구만 추출, (c) 캐릭터 룩 이관(비추천).
2. Extraction gate: 대상 파일(GLB 1~2 + Handoff 패키지 + tools/Hunter02 스크립트)을 SHA256SUMS·provenance.json 첨부로 seoul ArtSource에 복사 — makcha는 수정하지 않음.
3. BOM 재등록: seoul BOM 신규 클래스(source: cross-project-import, makcha provenance 체인 첨부, Mixamo/Tripo 라이선스 등기, owner_verdict: pending → 소유자 육안 승격).
4. 모션: idle만 이용하거나 walk/attack 재작업 후 QA 재통과.
5. 런타임 반입은 아트 방향 결정(GenreContract 개정) 이후로 순서 확정.

## 6. 2차 확인 (2026-09-07, 소유자 재요청 — find 전수 재고 포함)

- 전 모델 파일 전수 재고(ignored 포함 find): **glb 14 · fbx 7 · blend 2 — 전부 캐릭터·적·모션. 3D GLB 프롭 0건 재확정.** k-pop-diablo는 이미 존재하지 않음(핸드오프 문서의 원본 프로젝트).
- 소유자 기억의 실체 확인: `Art/Title/`에 **2D 레이어식 승강장 타이틀 아트 스위트**가 provenance 완비로 존재 — layer-platform.png(신설동역 간판·'나가는 곳 Way Out'·5인 아이돌 실루엣·민트 시그널, gpt-image-2, 2026-08-22, sha256 기록), layer-train.png('LAST' 막차), layer-viaduct-bg/fg, layer-sky, 합성본 title-world-still(남산타워·서울 스카이라인). 프롬프트·모델·해시가 kpop.gameplay-sprite.v1 스키마로 등재.
- 판정 갱신: 재활용 후보는 (1) Hunter02 파이프라인·리그(기존 판정 유지) + (2) **2D 지하철 타이틀 레이어 스위트** — seoul 타이틀 아트의 스타일 앵커/대체 후보. 단 주의: 플랫폼 레이어와 합성본에는 makcha 캐스트(아이돌 5인) 실루엣이 베이크돼 있어 그대로 이관하면 makcha 아이덴티티가 수입됨(캐릭터 제거·재구성 작업 필요), 실제 서울 역명(신설동·동묘앞·제기동)은 seoul의 가상 16국 세계관과 용도 구분 필요, 2D 타이틀 아트는 1.5u 그리드 3D 프롭의 대체물이 아님. seoul은 자체 GLB 프롭 6종과 자체 타이틀 아트(poc-title-art)를 이미 보유 — 용도는 '참조·리스타일 기반'이지 필수 대체가 아님.
- 이미지 육안 근거: layer-platform/train/title-world-still 4장 직접 확인(내부 분석, 커밋 안 함).

## 7. 오드랜드(oddland-unity) 데이터 실사 — 소유자 지정 (/Volumes/gameWorkspace/game-refs/oddland-unity)

### 정체
- 소유자 자신의 Unity 프로젝트(git origin: github.com/islee23520/oddland-unity), 외장 볼륨 게임 참조 영역에 위치. 1차 조사에서 빠졌던 이유: makcha 저장소 밖 외부 볼륨 + rg의 ignored 제한 — 소유자 정정이 맞았다.
- makcha는 이미 오드랜드를 정식 도너로 운영 중: `tools/art/assets/import_oddland_3d.py` 계약 "oddland-unity-to-bevy-glb-v1", 팩 9종(hub-lobby-v1, iso-tilekit-stage1-v1, enemy 6종, hub-stage1-v1), **sha256 고정 SourceAsset 57개**, ownership "owner-authorized-oddland". makcha에 존재하던 적·보스 GLB 10종이 전부 오드랜드 파생산이었다.

### 어셋 실물 (FBX 163, 카테고리 분포)
- platformmer 타일킷 5스테이지 96개(stage1 19 / stage2 18 / stage3 21 / stage4 20 / robson 18) — tile_3~14 탑·미드·바텀·엔드 구성의 아이소 타일 키트(makcha가 iso-tilekit-stage1 21타일을 계약 등재).
- arcade_stage 프롭 31(상자·기둥·미니게임 물건), loby 14(로비 플로어·월·BG·별), objects 12(파워업), stage1 환경 4(buildings·sky·daily_layout), fx 3, highlight 2.
- 렌더 감정(Blender Workbench): arcade 프롭=평면 보라 기둥 박스, 파워업=하트+플러스 로우폴리 — **단색 기하 + 알베도 별도 PSD**(loby.psd 등) 구조. 기능성 기하이지 완성 환경 미술은 아니다.
- 기술 주의: platformmer 일부가 **FBX 6100 구버전**(Blender 직접 임포트 불가 "Version 6100 unsupported") — makcha의 자체 컨버터가 이를 우회하는 정식 경로. Unity는 임포트 가능.
- 부수 발견: OneDrive graphic_sandbox/oddland_art_resource(원본 아트 리소스 추정), VS2015/2017 백업에 oddland 계열 저장소 다수 — 1차 소스 풀 추가 확인 가능.

### seoul 적합성 판정
- 권리: 최상 등급 — 소유자 과거 프로젝트 + makcha가 이미 소유권 인증 체인 구축. BOM source: cross-project-import(oddland donor) 등재만 하면 됨.
- 기하: **플랫포머 아이소 타일킷이 1.5u 그리드 환경 기하의 기증 후보**(makcha가 이미 'iso-tilekit'으로 부르는 아이소 저작물). 단 메시별 스케일 감사 필수(타일 1매가 1.5u인지 — 변환 경로에서 측정).
- 미술: 단색 로우폴리 — 최종 룩은 아니고 **기하/실루엣 기증자**. 채택 시 툰 방향 재질화(텍스처 리페인트 또는 MToon 단색 팔레트)가 전제.
- 경로: Blender 직접 대신 makcha 컨버터 계약 사용(FBX 6100 우회 + provenance 동반) → seoul ArtSource 반입 → BOM 등록 → 소유자 육안 게이트.
- 순서 제약: 여전히 아트 방향 결정(A′ 등신·툰 스택) 선행 — 현재 GenreContract(2.5등신) 하에서 런타임 반입은 계약 위반.

