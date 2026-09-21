# Task 02 committed-request provenance 품질 리뷰

판정: **actionable finding 0**

- implementation-mirroring: Git·filesystem·Unity 관측값을 비교하며 verifier 구현을 테스트에 복제하지 않는다.
- tautological: 기대 권위는 사전 커밋 R이며 산출물이 자기 자신을 승인하지 않는다.
- deletion-only: 누락 키·관측·registration은 strict schema 실패다.
- excessive/useless: 정상 1건과 독립 공격면 11건만 검증한다.
- unnecessary extraction: begin/finalize/cleanup은 서로 다른 시점·프로세스 관측 때문에 분리됐다.
- unnecessary normalization: committed absolute path와 realpath의 exact equality만 허용한다.
- maintenance/scope drift: frozen task2 source 두 파일과 증거만 다룬다.
- broad catch/shim/dead: broad catch, 호환 shim, dead abstraction이 없다.

suffix path, 전체 artifact nonce rewrite, request commit, begin=end, before/after HEAD, registration, realpath, project path, artifact hash, extra key가 각각 독립적으로 거부됐다.

## 최종 parser 검토

- parser complexity: NUnit 전체 XML 범용 파서를 만들지 않고 정확한 target test-case/output 경계만 순차 탐색한다. 전역 broad regex나 backtracking 패턴이 없다.
- exact schemas: request, manual, begin, end, execution, cleanup 및 모든 nested source item은 required/allowed key 집합과 타입·schema version을 고정한다.
- XML: `ManualDataSurfaceRecordsIdentityAndConflict`의 단일 output만 읽는다. 기존 Unity의 Progress+NUnit 동일 emission 두 줄만 수렴시키며 세 번째·충돌·외부 marker·prefix/suffix junk를 거부한다.
- log: 줄 시작 exact marker 한 개만 허용하고 duplicate·conflict·substring을 거부한다.
- broad catch/swallow: verifier에는 오류를 무시하는 catch가 없다. Git ancestor 확인 실패만 명시적 검증 오류로 변환한다.
- test quality: artifact hash를 일관되게 재생성한 뒤 schema·parser 단계가 실제로 결함을 잡는지 검증한다. 구현 미러링·tautology·deletion-only·과잉 fixture가 없다.
