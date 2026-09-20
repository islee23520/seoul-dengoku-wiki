# Native gate 증분 자기 리뷰

범위: 검사 코어와 native extractor, 회귀 fixture. 모델·candidate 폴더는 이번 커밋에 포함하지 않는다.

- Tier HEAVY 유지: 새 독립 검사 계층, 실제 Blender와 schema 연결, 오검출/거짓승인 재현. Bare ulw이므로 ulw-plan reviewer gate는 발동하지 않았고 직접 diff/실행/증거를 검토했다.
- 테스트: evidence/gate-increment-tests.txt — 81 passed in 4.34s. 원인별 RED와 변이 후 복원 GREEN 로그는 UV/기하/교차 하위 폴더에 보존.
- 명시적 basedpyright 프로젝트 코어검사: evidence/gate-increment-types.txt — 0 errors, 0 warnings, 0 notes. IDE workspace가 다른 sys.path/NumPy 환경을 쓰는 diagnostics와 혼동하지 않는다. Blender probe 작업 스크립트 경고는 이 증분 승인의 대상이 아니며 typing todo에 남는다.
- 실제 표면: UV native 저장파일 남성 hardPASS/여성FAIL; 기하 native여성실제extract+manifest FAIL exit2; independent Blenderclean/crossing fixture 각각 PASS/FAIL. 이 값은 검사별 제한된 승인이다.
- 교차 판정 이력: global plane epsilon과 cross2D 단위 혼동을 실제 좌표 fixture로 교정했다. 이전 implementation-summary의 남성1716/구강386 등은 이전 버전의 역사적 수치이며 최신 전체 모델의 참값으로 재사용하지 않는다.
- 테스트 전용 topology bypass를 제거했다. dictionary/list 누락, missing source/count/UV layer, finite overflow, invalidnumericcriteria, 역할 도용/중복, incomplete symmetry와 O(n²)검사 문제를 RED→GREEN으로 교정했다.
- 원본 .blend와 1차 코드/증거는 불변. native extractor는 읽기전용, 출력은 round2 아래에 한정. 교차 수정 뒤 여성 raw 후보는221교차로 여전히반려; 생산6모델 승인0/6.
- 큰 native 추출 JSON(45/66/36MB 등)은 이 커밋에서 제외한다. 버전고정된 extractor와 source SHA, verdict, 재현 명령은 포함하며, 전체 원시 파일은 현재 worktree에 남는다. 커밋의 README가 영구 원시artifact를 포함한다고 주장하지 않는다.
- cleanup: fixture child Blender/pytest실행들은 종료됐다. 원본/사용자 GUI 미수정. 살아있는 모델링 child는 다른 task의 소유이며 본 증분 commit이 그 산물을 승인하지 않는다.

남은 조건: anatomical seam/UV품질/모든 재료역할/구강 수리/실제 눈 피팅 통합/여섯변형/holdout/FBX 및 GUI표면검증. native hardPASS만으로 생산승인을 반환하는 최종bundlegate는 아직 연결하지 않았다.
