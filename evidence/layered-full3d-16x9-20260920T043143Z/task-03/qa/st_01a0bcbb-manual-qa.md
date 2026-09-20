# task3 gate-fix manual QA — st_01a0bcbb (수정 라운드, 20260920T043143Z)

- K3 구현 커밋: `141c6dd5e2d6a217424a4d32c736a3386b6b81dd` (검증기가 블롭 단위로 재결합)
- 표면: 단말 CLI 전부(node:test, 빌드 명령, pyosmium 오라클, 증거 검증기). 네트워크/브라우저/데스크톱 표면은 이 변경에 존재하지 않는다.
- 모든 판정은 커밋된 산출물 파일과의 재계산으로 확인했다(qa/verification.json: verified true, failures 0).

## 결과 요약 (커밋된 topology.json / coverage.json 기준)

- crosswalk **334/334**: 분류 rail 327 + canonical-alias 3 + monorail 2 + nonrail-misclassified 2 = 334, uncovered 0.
- **unresolvedRequiredEdges 0**: R=2951, resolvedIntoEdges=2951 (R−해소=0). 정의는 topology.unresolvedRequired.definition에 문서화.
- 엣지 436(그래프 435 대비 +1: 봉화산–신내가 방향 역할 지원으로 관찰됨), 비통행 기록 2573.
- 결정론: 재빌드 2회가 커밋된 산출물과 바이트 동일(build/determinism.txt).

## 연결 기록 산술 ( occurrence와 unique를 섞지 않는다 )

- connections(관계 내 인접 쌍 기록) 총 2573 = missing_stop_node 1040 + unknown_station 1527 + unnamed_stop 6. uniquePairs 866.
- stopOccurrences(역할 멤버 발생 수) 총 5767 = 해소 3180 + unknown_station 1493 + missing_stop_node 1090 + unnamed_stop 4. 역할별 stop 5632 / stop_entry_only 82 / stop_exit_only 53.
- 1057(이전 판)의 정체: 발생 수 기준 missing_stop_node였으며, 방향 역할 편입(135 = 82+53)과 정식 redirect로 이번 판에서는 1090 발생 / 쌍 기록 1040으로 재측정되었다. 두 카운트는 서로 다른 단위다.

## surfaceEvidence

| 시나리오 | 기준 | 표면 | 정확한 실행 | 판정 | 근거 |
|---|---|---|---|---|---|
| S1 334/334 crosswalk | 감사 1) | CLI | `node TOOL/tools/strategy-map/test-subway-topology.mjs` (통합 케이스) | pass — matched 334, uncovered [], 분류 합 334 | A4, A6, A7 |
| S2 문서화된 정규화/별칭 전략 | 감사 1), 데이터 감사 | 소스+데이터 | data/subway-alias-ledger.json(NFKC/공백/괄호 규칙, aliases 3, canonicalAliases 3, coordinateExactMatches 4, excluded 2) + normalizeName 테스트 | pass | A1, A2, A3 |
| S3 서울/서울역 비별칭 | 데이터 감사 | 통합 케이스 | 서울 stop(정확 이름, entry/exit 포함) 바인딩 단정 | pass — 서울은 exact-name, 서울역은 별도 카탈로그로 유지 | A4, A6 |
| S4 모노레일/비철도 분류 | 데이터 감사 | 통합 케이스 | 모노레일 stop n8598757059/n8598785500, 메트로호텔 n11464378955, 생태공원앞 n414683239; degree 0, lines 0 | pass | A4, A6 |
| S5 경복궁 정식 별칭 | 데이터 감사 | 단위+통합 | variant stop → canonical 경복궁 바인딩, 중복 엣지 없음 | pass | A4, A6 |
| S6 방향 역할(봉화산–신내) | 데이터 감사 | 단위+통합 | stop_entry_only/stop_exit_only 지원, 링크에 aRole/bRole 보존 | pass — 엣지 436에 링크 포함 | A4, A6 |
| S7 unresolvedRequiredEdges=0 정의 | 게이트 | 통합 케이스 | R−해소 산술 단정 | pass — R 2951 == 해소 2951 | A4, A7 |
| S8 G-O 정직 분류 | 게이트, 데이터 감사 | 통합 케이스 | graph_edges_without_observed_stop_evidence 6 = contracted_path 2 + canonical_variant_endpoint 4 (출처 날조 없음) | pass | A7 |
| S9 신규 후보 별도 기록 | 게이트 | 통합 케이스 | observed_topology_pairs_absent_from_graph 7쌍(그래프 미포함, 소스 유지) | pass | A7 |
| S10 floors 검증 | 감사 4) | 단위 | observed_levels 비null + source null → INVALID_OBSERVED_FLOORS 예외; null층 보존(실측 69) | pass | A4, A6 |
| S11 CLI 플래그 | 감사 5) | CLI | --bundle/--stations/--interiors/--dong-content/--out 수용, unknown/duplicate/valueless/미존재 경로 거절 | pass | A4 |
| S12 파서 경계 | 보안 감사 | CLI(테스트) | 26개 경계/악의 픽스처 테스트 | pass — 26/26 | A4, A5 |
| S13 결정론 | 게이트 | CLI ×2 | 빌드 2회 → cmp 바이트 동일 | pass | A8 |
| S14 오라클 대조 | 감사 7) | python/pyosmium | 독립 구현 측정값과 coverage/좌표 표본 대조 | pass — 19013/244/5632/82/53 일치, 좌표 표본 7개 1e-9 이내 | A9 |
| S15 증거 결합 | 감사 7) | 검증기 | verify-task03-evidence.mjs --commit K3 | pass — verified true, failures 0 | A10 |
| S16 품질 판정 actionable 0 | 감사 3) | 리뷰 | quality-review.md 항목별 확인 | pass | A11 |

## adversarialCases

| 시나리오 | 적대 클래스 | 기대 동작 | 판정 | 근거 |
|---|---|---|---|---|
| AD1 압축 폭탄(기본 한도/소형 한도) | 자원 | decompressed_too_large, 할당 전 거절 | pass | A5 |
| AD2 inflate 경계값(=한도) | 자원 | 성공 | pass | A5 |
| AD3 초과 BlobHeader/Blob/파일 | 자원 | blob_header_too_large / blob_too_large / file_too_large | pass | A5 |
| AD4 10바이트 초과 varint / uint64 넘침 | 파싱 안전 | varint_too_long / varint_overflow | pass | A5 |
| AD5 비안전 ID(2^60) | 파싱 안전 | unsafe_integer | pass | A5 |
| AD6 raw+zlib 동시 / 페이로드 없음 / raw_size 불일치 | 구조 | 전용 코드로 거절 | pass | A5 |
| AD7 dense ids/lats/lons·relation roles/memids/types·node keys/vals 불일치 | 구조 | field_length_mismatch | pass | A5 |
| AD8 keys_vals 종결자 누락/문자열 색인 초과 | 구조 | keys_vals_unterminated / string_index_out_of_range | pass | A5 |
| AD9 Data-before-Header / 중복 Header / Header 없음 | 상태 기계 | state_* 거절 | pass | A5 |
| AD10 필드번호 0 / wire type 6 / singular 중복 | 와이어 정책 | field_number_zero / wire_type_unsupported / duplicate_field | pass | A5 |
| AD11 중간 무지원 stop류(stop_position) | 위상 | 세그먼트 절단, A–C 엣지 없음, 2건 nontraversable | pass | A4 |
| AD12 fuzzy 최근접 시도(750m 초과 동명) | crosswalk | distance_mismatch, 미바인딩 | pass | A4 |
| AD13 모호한 정규화 키 | crosswalk | 좌표 유일 일치가 없으면 ambiguous_key 거절 | pass | A4 |
| AD14 장부 노드 부재/좌표 불일치 | 데이터 | 검증 예외(absent from PBF / not exact) | pass | A4 |
| AD15 시간값/절대경로 주입 | 결정론 | 바이트 동일 재빌드, 산출물 내 /Users/ 부재 | pass | A8, A10 |
| AD16 변조(333 카운트, stale 커밋, 출력 바이트) | 증거 | 검증기 자가검사가 전부 거절 | pass | A10 |
| AD17 네트워크/브라우저/데스크톱 클래스 | — | — | not_applicable — 오프라인 데이터 파이프라인으로 해당 표면이 없다 | — |

## artifactRefs

| id | 종류 | 설명 | 경로 (task-03/ 기준 상대) |
|---|---|---|---|
| A1 | 소스 | 경계화된 PBF 리더 | TOOL/tools/strategy-map/osm-pbf-reader.mjs (K3) |
| A2 | 소스 | crosswalk/조립 v2 | TOOL/tools/strategy-map/subway-topology.mjs (K3) |
| A3 | 데이터 | 별칭 장부 v2(aliases/canonicalAliases/coordinateExactMatches/excludedAliases) | TOOL/tools/strategy-map/data/subway-alias-ledger.json (K3) |
| A4 | 로그 | green: reader 26/26 + topology 26/26 | green/green-reader.log, green/green-topology.log |
| A5 | 로그 | RED(HEAD 동작 대비 행위 실패): reader 23 fail, topology 26 fail | red/red-reader-head-behavior.log, red/red-topology-head-behavior.log |
| A6 | 데이터 | canonical topology.json(334 처분, stops 1370, 엣지 436, 기하 96,999점) | topology.json |
| A7 | 데이터 | canonical coverage.json(카테고리/산술/분류) | coverage.json |
| A8 | 로그 | 빌드 2회 + 결정론 | build/run1, build/run2, build/determinism.txt, build/run1-stdout.json |
| A9 | 데이터 | pyosmium 독립 오라클 측정값 | qa/pyosmium-oracle.json |
| A10 | 스크립트+결과 | 증거 검증기와 실행 결과(verified true) | qa/verify-task03-evidence.mjs, qa/verification.json |
| A11 | 문서 | 품질 판정(actionable 0) | quality-review.md |
| A12 | 데이터 | 생성 산출물 매니페스트(18파일 sha256) | qa/output-manifest.json |
| A13 | 문서 | 테스트 목록 52건 | qa/test-inventory-reader.txt, qa/test-inventory-topology.txt |
| A14 | 문서 | 실행 명령 기록 | commands.txt |
| A15 | 문서 | 정리 기록 | cleanup.json |

## 비고

- 334 중 4(모노레일 2, nonrail 2)는 route-stop 증거가 없어 분류만 보고하며 엣지를 만들지 않는다. 3(canonical-alias)은 중복 실역으로 정식 id로 향한다. 이 7개 기록은 topologyClassification/disposition으로 명시된다.
- 관찰됐으나 그래프에 없는 7쌍은 observed_topology_pairs_absent_from_graph에 소스와 함께 기록되고 기존 그래프를 침묵히 수정하지 않는다.
- 오라클 주장은 "정확함"이 아니라 측정 대조로 서술한다: pyosmium와의 일치 항목은 qa/pyosmium-oracle.json의 수치 그대로다.
