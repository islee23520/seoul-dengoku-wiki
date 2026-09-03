# 현재 모듈

## Foundation 아키텍처

상태: 구현·검증 완료 (커밋/push는 요청 시)  
범위: 이 모듈 하나만 구현합니다. 완료·검증·push 전에는 두 번째 제품 모듈을 시작하지 않습니다.

### 계약

- [x] 현재 Unity 구조와 Makcha-Unity 스택 조사
- [x] FSM, VContainer, Singleton, Repository, 저장·결정성, 실패·취소 계약 작성
- [x] Wiki 구현 계획 작성과 문서 계약 RED→GREEN

### 구현

- [x] FSM EditMode 테스트 RED
- [x] VContainer `1.19.0` 고정
- [x] `Bootstrap.unity`와 App `LifetimeScope`
- [x] `Foundation.unity`와 명시적 child `LifetimeScope`
- [x] readiness 이후 commit하는 scene transition coordinator
- [x] 불법·중복·실패·재시도 typed 결과
- [x] 정적 아키텍처 품질 게이트와 mutation proof

### 검증

- [x] Unity AssetDatabase import와 compile
- [x] EditMode 테스트 GREEN
- [x] PlayMode 허용 전환과 거부 경로
- [x] 실제 Editor Play Mode screenshot
- [x] COMPOSITION 리뷰 PASS
- [x] SPRITE_FIDELITY 리뷰 PASS
- [x] TYPOGRAPHY 리뷰 PASS
- [x] PRODUCT_POLISH 리뷰 PASS
- [x] 전체 Wiki/Unity/architecture gate GREEN
- [x] 모든 임시 리소스 cleanup receipt

## 비목표

- 캠페인 시뮬레이션
- 세계 그래프
- 전술 전투
- 실제 Repository 또는 save adapter
- 호출자가 없는 Makcha 패키지 추가
- UI 비주얼 재설계

다음 모듈은 위 체크리스트가 모두 끝나고 현재 변경이 테스트·push된 뒤에만 선택합니다.
