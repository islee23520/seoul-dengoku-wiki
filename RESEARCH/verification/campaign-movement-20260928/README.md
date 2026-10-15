# #296 이동 계산 검토 패킷

현재 방향은 [Intent 결정14, SHA5a989645](https://github.com/islee23520/seoul-dengoku/blob/5a98964518f0e7110e91ba37e7e9590135be21c1/Intent.md)와 [개정된 #296](https://github.com/islee23520/seoul-dengoku/issues/296)의 시간 기반 이동이다. movement.mjs, 초기 조사와 proposal-source.md의 턴 예산은 폐기된 방향의 역사 비교 자료다. 현재 제안은 GDD JSON의 시간 기반 절이다. 옛 턴 수치 승인을 현재 착수 조건으로 요구하지 않는다.

최신 보완은 [time-orders-proposal.md](time-orders-proposal.md), 실행 자료는 `time-orders.mjs`/`time-orders.test.mjs`다. 두 합성 분대의 도로·층 전환·지하 비용, 다섯 태세, 현재 간선 진척을 유지하는 목표 교체, 권한·봉쇄·통제권 거부, AI 동일 계약·재생 해시를 다룬다. W/T·D 단위와 비용/계수는 승인 전 후보이며 제품 기본값이 없다. 아래 구간 fixture의 명령 교체 미구현 한계는 그 파일에만 해당한다. 신규 fixture도 즉시 역방향 재탐색·동적 경로 변경·정확한 도착 이벤트·승인 레코드 검증을 제공하지 않는다.

저장소 루트 재현: `node --test RESEARCH/verification/campaign-movement-20260928/*.test.mjs` → **24/24** (현재 시간 기반12 + 역사 비교12). 추가 회귀는 중첩 표시 메타데이터가 재생 해시·현재 간선 교체에 영향을 주지 않고, 실제 비용 변경은 검출되는지 확인한다. 전체 경로 탐색·Core연결·수치 승인은 별개다. [검증 기록](time-orders-verification.md).

현재 연구 계산: `node --test time-motion.test.mjs`. 과거 모델까지 비교 검증: `node --test movement.test.mjs time-motion.test.mjs`. time-motion.mjs는 명시된 정수 속도 분자/분모, 거리, 경과 세계시간만 받으며 제품 기본값이 없다. 가상 A7/3·B5/2, 도로10·출입5는 시험용 수치다. 나머지를 보존해 경과시간 분할 불변성을 검사하며 빈 월드는 시간도 정지, 전투 잠금은 분대 진행만 정지한다. 시간 구간 중 속도·접근·전투 변경은 서버 이벤트 경계에서 나누어 입력해야 한다. 동적 충돌·명령 교체·분모 변경·정확한 도착 사건 시각은 미구현이다.

아래 기존 계산 설명과 해시는 모두 역사 비교용 movement.mjs에 한정한다. 시간 기반 제품 계약이 아니다.

상태: NEW DESIGN / 소유자 승인 대기 / 제품 연결 없음. Node 내장 모듈만 사용한다.

실행: 이 디렉터리에서 `node --test movement.test.mjs`. 문법 검사: `node --check movement.mjs`.

`movement.mjs`는 당일 단일 MOVE 사전검증과 계산을 위한 오프라인 연구 도구다. 모든 입력을 복사 없이 읽고 결과만 반환한다. 재전송 영수증, 태세 명령 상태 전이, 도달 범위 탐색, 다턴 예약, 동시 충돌 해결 및 승인 레코드 검증은 구현 범위 밖이다. 성공은 이 작은 계산 모델의 일관성만 뜻한다. Core 구현 준비나 #296 전체 완료가 아니다.

코드에 있는 숫자는 승인되지 않은 제안 v0.1이다. GURPS 규칙 구현이 아니며 HP/FP에서 상태를 추론하지 않는다. 테스트의 인물과 지도는 가상이다. 제품 로드 진입점은 제공하지 않는다. 정본이나 게임 기본값으로 복사하지 않는다.

GDD 제안의 초기 원천은 `proposal-source.md`다. 이 파일은 동결된 비정본 스냅샷이다. 한 번의 정규화 이후 편집 권한은 GDD 저장소의 `canon/locales/ko-KR/proposals/campaign-movement-296.json`에만 있으며 GAME 저장소에서는 `GDD/` 아래 같은 경로로 찾는다. source.sha256은 초기 스냅샷 바이트의 고정 provenance다. 향후 편집 때 스냅샷이나 source.sha256을 갱신하지 않는다. proposal 상태는 승인된 규칙을 뜻하지 않는다.

GAME 패키지 경로는 저장소 루트 기준 `RESEARCH/verification/campaign-movement-20260928/`다. 디렉터리 전체를 복사해도 위 Node 명령으로 독립 실행할 수 있다. 배포본의 `issue-296-research.md`는 최초 조사 당시의 상태 기록이며, 그 문서의 ‘validator 미구현’ 문장은 당시 상태다. 현재 실행 범위와 한계는 이 README와 테스트를 따른다. GDD PR에는 JSON/collection/render lock만 포함하며 이 연구 패킷의 게시 여부는 GAME 변경에서 별도로 확인한다.

연구 해시는 코드가 명시한 의미 필드만 직렬화한다. 명령·지도·노드·간선·분대·구성원에 붙은 제출시각, 호스트 정보, 번역문 등 추가 메타데이터는 제외한다. 비용·태세·경로 등 계산 입력은 포함한다. 새로운 게임 의미 필드를 추가하면 계산기와 해시 투영 및 회귀검사를 함께 수정해야 한다.

원문 제한: 2026-09-28 Warehouse23 공식 제품 HTML을 추가 조회했으나 다운로드 가능한 Lite PDF를 확보하지 못했다. 원전 판본·페이지 미검증 상태를 유지한다. 공개 캐릭터 시트의 짐 계수 확인은 Lite 본문 대조를 대체하지 않는다.
