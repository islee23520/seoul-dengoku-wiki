# task3 gate-fix 품질 판정 (quality review)

- 대상 커밋: K3b = 12ba7383bcd9a6f2dae93fbe29edb2700832ffd8 (구현) + 본 증거 커밋
- 검증 근거: qa/verification.json (verified true, failures 0), green 테스트 58/58 (reader 32 + topology 26), 재현빌드 바이트 동일
- 판정일 기준 스코프: TOOL/tools/strategy-map의 task3 파일 6개 + 본 증거 디렉터리

## 프로그래밍 품질

- 모듈 경계: 파서(osm-pbf-reader.mjs) / 조립+crosswalk(subway-topology.mjs) / thin CLI(builder)로 분리. CLI는 플래그 해석과 입출력만 담당하고 정책은 조립 모듈에 있다. 503줄 모놀리스는 더 이상 남아 있지 않다.
- 명명·주석: 주석은 사실 서술(필드 번호, 상한 근거, zigzag 규칙)이고 감상문/미래 계획 문구가 없다. 한함수 책임 단일, 분기 깊이 3 이하.
- 결정론: 산출물에 시간값·절대경로 없음(topology.inputs는 저장소 상대 경로). 정렬은 전부 코드유닛 비교 기반이고 localeCompare를 쓰지 않는다. 재빌드 2회가 커밋된 산출물과 sha256까지 동일함을 검증기가 재계산했다.
- 오류 처리: 파서는 PbfLimitError(code 포함, 'pbf: ' 접두사)만 던지고, 조립은 INVALID_OBSERVED_FLOORS 등 데이터 오류를 명시 메시지로 던진다. 조용한 기본값 대체 없음(--bundle 등 플래그는 검증 후 사용).

## AI-slop 제거 확인

- 장식 파일헤더·자기예찬 주석·빈 추상화 레이어 없음. 호출자 1곳뿐인 헬퍼는 인라인 수준으로 유지됨.
- 미사용 export/변수 점검: reader의 내보내기는 테스트와 CLI가 실제 소비하는 것만 남았다(이전 판의 사용하지 않는 rawSize/coordin 헬퍼 제거 완료).
- 매직넘버는 DEFAULT_LIMITS와 osmformat.proto 필드 주석으로 근거를 남긴다.
- 반복 코드: RED 재현용 어댑터는 증거 절차 전용이고 제품 코드에 섞이지 않았다.

## 테스트 품질

- 총 58개(osm-pbf-reader 32 + subway-topology 26), 전부 node:test. 실행 1회 통과, sleep/폴링/시간 의존 0.
- 요구 패턴 충족: same-name 2, missing-source 2, unknown-floor 1(+실데이터 69 null 보존 통합 1). 각 패턴이 실제 사례(실측 픽스처/실 PBF)를 선택한다.
- RED는 행위 단정이다: HEAD 965ab671 동작에 대한 실패 23+26건(모듈 미존재/문법 오류 아님). red/*head-behavior.log 참조.
- 통합 단정은 검증된 실입수에 고정: 334/334, 분류 {rail 327, canonical-alias 3, monorail 2, nonrail-misclassified 2}, R=2951=해소, connections 2573(1040+1527+6), stop 발생 5767 별도 집계.

## 자원 경계

- 상한 전부 문서화: 파일 128MiB, BlobHeader 64KiB, Blob 32MiB, 해제 블록 64MiB, packed 16M 원소, 문자열표 1M 항/64MiB, 그룹 4096, ID/델타 안전 정수.
- inflateSync maxOutputLength + raw_size 실측 일치 + 해제 후 상한 재검사(3중). raw/zlib 동시 존재 거절.
- 실측: 서울 스냅샷(51,794,961바이트, 최대 블록 376,436/815,360바이트)은 전 상한 이하에서 정상 파싱되고, 악의 픽스처(폭탄, 초과 헤더, 10바이트 초과 varint, 비안전 ID, 배열 불일치, 문자열 색인 초과)는 전부 거절된다(테스트 26건).

## 남은 과제(지연 아님, 스코프 박스)

- task4 이후 과제(신분당선 등 노선 확장, 427동 건물 앵커 확충)는 이번 스코프가 아니며, 본 판정에서 actionable 항목은 0건이다.
