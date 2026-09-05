# 현재 모듈

## Unity POC 통합 코어 루프

상태: 코어 구현·PlayMode 검증 완료, 생성 아트 통합과 최종 수용 게이트 미완료
범위: 이 모듈 하나만 구현합니다. 완료·검증 전에는 두 번째 제품 모듈을 시작하지 않습니다.
기준선: 이전 Foundation 아키텍처 모듈(Bootstrap App scope/FSM, Foundation 화면 child scope, VContainer `1.19.0`, 정적 아키텍처 게이트)은 완료된 기반이며 현재 활성 모듈이 아닙니다.

### 구현 증분

- [ ] 1. 병렬 작업 트리를 보존하고 현재 모듈을 Unity POC 통합 코어 루프로 선택한다
- [ ] 2. 2D/3D 생성 백엔드와 fail-closed 자산 BOM 계약을 확장한다
- [ ] 3. NanoBanana/Gemini, Grok Imagine, OpenAI ImageGen 경로를 유료 대체 없이 검증한다
- [ ] 4. 공식 Microsoft TRELLIS v1 호스트를 고정하고 수신 계약을 증명한다
- [x] 5. 결정론적 Core ID, tick, command, RNG stream, ledger hash를 만든다
- [x] 6. 영등포-신도림-구로 세 역 노선과 통행 규칙을 저작한다
- [x] 7. 여섯 단계 캠페인 루프와 교섭·우회 비전투 경로를 구현한다
- [x] 8. 불변 BattleContext와 동일 격자 결정론 SRPG 규칙을 구현한다
- [x] 9. 조우·전투 결과를 정확히 한 번만 정산한다
- [x] 10. MainTitle을 배타적 화면 lease로 추가하고 아키텍처 게이트를 갱신한다
- [x] 11. Design.md 시각 계약을 고정하고 실제 UI Toolkit 화면을 구현한다
- [x] 12. 아트 제작 전에 PlayMode에서 코어 루프 한 바퀴를 닫는다
- [ ] 13. 타이틀·UI kit·아이콘·역사 텍스처를 생성·검수한다
- [ ] 14. TRELLIS→Blender로 역사 프롭 키트를 생성·승격한다
- [ ] 15. 탐사원·의무원·순찰대 캐릭터를 생성·리그·애니메이션한다
- [ ] 16. 임시 비주얼을 제거하고 승격 에셋을 플레이 슬라이스에 연결한다
- [ ] 17. Editor·시각·결정성·빌드 수용 게이트를 한 번에 통과한다

### 필수 게이트

- [ ] `node tools/architecture/check-unity-architecture.mjs`가 `unity architecture gate passed`로 종료 0
- [ ] `git diff --check` 종료 0
- [ ] 행동 변경은 RED-first EditMode/PlayMode/Node 테스트
- [ ] 실제 Unity `6000.7.0a5` Editor Play Mode로 타이틀·교섭·우회·전투·정산 경로 검증
- [ ] UI visual QA dual-oracle과 COMPOSITION, SPRITE_FIDELITY, TYPOGRAPHY, PRODUCT_POLISH 독립 PASS
- [ ] 생성 에셋 BOM/rights fail-closed, 런타임에 프로그래머 placeholder 없음
- [ ] 동일 Unity revision macOS Development player smoke
- [ ] 임시 리소스 cleanup receipt

## 비목표

- 전체 16국·412인 캠페인, 하루/주간 경제·외교·공성
- 파일 저장/불러오기, 시네마틱, 음성·음악
- 네 번째 gameplay scene, Title+Foundation 동시 유지, 두 번째 scene-load 권한
- 카메라 회전·원근·대각 이동·실시간 전투
- Addressables, Entities, Cinemachine, LitMotion, TMP, uLoop
- 무검수 생성 에셋, 공식 TRELLIS v1 외 임의 유료 3D 대체

다음 모듈은 위 체크리스트가 모두 끝나고 현재 변경이 테스트된 뒤에만 선택합니다.
