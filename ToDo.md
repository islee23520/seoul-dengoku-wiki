# 현재 모듈

## 서울 전역 하이트맵 전략맵

상태: 개시. [Intent.md](Intent.md) 결정 10(2026-09-18)이 첫 Unity 제품 작업으로 지정했다.
범위: 이 모듈 하나만 구현합니다. OSM·지형 데이터로 서울 전역을 하이트맵 메시 전략맵으로 세우고, 문서 정본을 결정 10 계약으로 맞춘다.
기준선: Foundation 아키텍처, uGUI(#59), RTFC Core `rtfc-owner-cards-v2`(#77), Area 1 데이터 코어(#75), 진형 편집 PlayMode(#76). 이전 모듈의 잔여 시각 수용 항목은 아래 「주차 백로그」로 옮겼다.

### 구현 증분

- [ ] 1. 정본 문서에서 동서남북·아이소(45/35.264)·타일맵·2.5등신 문장을 결정 10 계약으로 교체한다
- [ ] 2. 공개 문서 탭을 게임설계·세계관 둘로 줄인다
- [ ] 3. `GenreContract.json`·C# 상수·계약 테스트를 사이드스크롤·전략맵 계약으로 교체한다 (RED-first)
- [ ] 4. 지리 번들(`GAME-REFERENCE/data/seoul-geography-20260830/`)을 오프라인 베이크해 z11 9청크 지형 메시·구 경계·수계 오버레이를 만든다
- [ ] 5. Foundation에 전략맵 화면을 올린다 — 청크 로드, 팬·줌, batchmode 캡처
- [ ] 6. 마운트·빌드·정책 게이트를 한 번에 통과한다

### 필수 게이트

- [ ] `node TOOL/tools/architecture/check-unity-architecture.mjs`가 `unity architecture gate passed`로 종료 0
- [ ] `node TOOL/tools/policy/check-repo-delivery-policy.mjs` 종료 0
- [ ] `git diff --check` 종료 0
- [ ] 행동 변경은 RED-first EditMode/PlayMode/Node 테스트
- [ ] 베이크 산출은 두 번 실행 SHA-256 동일(결정론) — 청크 9, nodata는 수면
- [ ] Unity `6000.7.0a5` batchmode PlayMode로 전략맵 화면 캡처(1280×720·1920×1080)
- [ ] 공개 금지어(`Kenshi`·`Underrail`·`Gunner`·`clone`·`복제`) 렌더 가시 0
- [ ] 임시 리소스 cleanup receipt

## 주차 백로그 (이전 모듈 잔여)

`Unity POC 통합 코어 루프`는 코어 구현·PlayMode 검증을 마쳤다(증분 1–12·18). 아래 미완료 항목은 전략맵 모듈 뒤에 주차한다.

- 주차 13. 타이틀·UI kit·아이콘·역사 텍스처를 생성·검수한다
- 주차 14. TRELLIS→Blender로 역사 프롭 키트를 생성·승격한다
- 주차 15. 캐릭터 생성·리그·애니메이션 — **오드랜드 원본 as-is로 대체됨(결정 10)**. 새 생성이 아니라 기증 어셋 연결로 수행한다
- 주차 16. 임시 비주얼을 제거하고 승격 에셋을 플레이 슬라이스에 연결한다
- 주차 17. Editor·시각·결정성·빌드 수용 게이트를 한 번에 통과한다
- 취소: #58(TOS식 SD 캐릭터 재작업) — 결정 10으로 폐기. 오드랜드 원본을 그대로 쓴다

## 비목표

- 전체 16국·412인 캠페인, 하루/주간 경제·외교·공성
- 파일 저장/불러오기, 시네마틱, 음성·음악
- 전략맵 외 신규 gameplay scene, Title+Foundation 동시 유지, 두 번째 scene-load 권한
- 전투 표현 재구현(사이드스크롤 화면 교체는 후속 모듈). Core 규칙 `rtfc-owner-cards-v2`는 유지
- 오드랜드 어셋 리타깃·리스킨·SD 등신 변환
- Addressables, Entities, Cinemachine, LitMotion, uLoop
- 무검수 생성 에셋, 공식 TRELLIS v1 외 임의 유료 3D 대체
- 지리 번들 원본 래스터(PBF·GeoTIFF)의 `GAME/Assets` 직접 반입

위 체크리스트가 모두 끝나고 현재 변경이 테스트된 뒤에만 다음 제품 모듈을 착수한다([개발 로드맵](GDD/Development-Roadmap.md), [Intent.md](Intent.md) 결정 10).
