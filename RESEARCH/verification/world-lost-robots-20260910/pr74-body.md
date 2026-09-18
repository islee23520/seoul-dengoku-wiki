## 요약
소유자 지시(2026 정세 실명 반영)에 따라 세계관 캐논에 세 층위를 추가하고 전 게이트를 녹색으로 유지합니다.

### ① 실존 대기업 실명 가문 22개 체계
- 기존 14개 운영가문을 실명으로 치환 (삼성전자, 현대자동차, LG생활건강, SK에너지, 쿠팡, 포스코, 한화에어로스페이스, 롯데쇼핑, CJ제일제당, CJ대한통운, 현대중공업, HD현대건설, 신한지주 / 북문지식원 유지)
- 신규 8개: 네이버(HC15), KT(HC16), LG에너지솔루션(HC17), HMM(HC18), 호텔신라(HC19), HYBE(HC20), 카카오(HC21), 테슬라코리아(HC22)
- 2026 정세 관계 6종 추가 (현대차-포스코 강판 경쟁, LG엔솔-테슬라코리아 전지 공급, 네이버-카카오 플랫폼 경쟁, CJ 계열 협력, HMM-현대중공업 발주, 호텔신라-롯데쇼핑 경쟁)
- **개명 이음새(rename seam)**: 원천 캐논은 실명 허용으로 바꾸고, 발행 전 기계 개명 도구 `tools/wiki/company-aliases.json`(실명→가명 31종)와 alias 커버리지 테스트를 추가 — "나중에 바꾸더라도" 1회 스왑으로 복귀 가능

### ② 한국사 모티브 인물 10명 (배치 B047)
- 조선·고려·근대 등 인물당 3개 시대 모티프 합성, 실존 인물 재현 금지 준수, 10개 국가에 배치
- humans 412→422, K-id 위치 기준 전역 재부여(337건 스윕), Cast-Index 동기화, 원점 쿼터 갱신

### ③ 로스트 테크 로봇 (곤충·공룡·고대해양)
- G25 등불개미군 / G26 화석포효군 / G27 심층삼엽군 (rogue-robot, 테슬라코리아 시험선 기원)
- 몬스터 배치 M040–M042 (48항목, 총 432), 신규 가이드 문서 `Lost-Technology-Lineage.md` + 사이드바 연결

## 검증 (전부 본 세션 실행·증거 보관)
- RED→GREEN: E_HOUSE_COUNT 24→32, E_K_MAP 412→422, E_GROUP_COUNT 24→27 / 항목 384→432, E_MISSING_ARC·E_DIAGRAM_COVERAGE G25–27
- 게이트 17종 전부 PASS: `npm --prefix tools test`, expansion 10스테이지, `test-world-atlas`(68+신규), `test-verify-cast`, `test-strategy-formulas`, 몬스터 게이트, `materialize --check`, LFS hydration, delivery policy
- 프로젝트 금지용어(Kenshi·Underrail·Gunner·clone·복제) 신규 콘텐츠 0건

## 유의사항
- 인물은 오너일가 **관계 구도만** 실물 반영 + 개인명 가명(별칭 원장에 후보 보관) — 실인물 실명 전환 요청 시 별도 스왑
- 원격 GitHub Wiki 발행은 기존 정책대로 별도 승인 (발행 전 alias 스왑 → 공개용어 게이트 통과 흐름)
