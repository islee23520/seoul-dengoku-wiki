# 090 person_detail 핸드오프 요약 (W5-25 -> 통합 웨이브)

지시서 본체는 docs/drafts/reports/w5-25-handoff-090.json(항목별 person·column·JSON 경로(배열 인덱스 포함)·정확한 원문·정확한 교체문·규칙·사유·조치).

090은 본 과제에서 편집하지 않았다(CK3 스탯 브랜치 소관). 이 문서는 규칙·조치별 집계만 담는다(원문 텍스트는 JSON 참조).

총 항목 4954건 · 인물 509명 (기준: 기본 090 전수 재조사)

| 규칙 | 항목 |
|---|---|
| org-name-map | 2629 |
| state-id-mapping | 1016 |
| state-name-mapping | 952 |
| clergy-vocab | 299 |
| bible6-exception | 46 |
| bible6-stale-role | 9 |
| sixteen-framing | 3 |

| 조치 | 항목 |
|---|---|
| replace | 4643 |
| owner-decision | 311 |

| 컬럼 | 항목 |
|---|---|
| json | 2458 |
| json_ko | 2496 |

규칙: bible6-exception=바이블 §6 [승인] 직위의 050 확정값(title/position/rank), bible6-stale-role=§6 확정 직위와 어긋나는 옛 직역 산문(소유자 판단), state-id-mapping=확정 매핑 id($.state), state-name-mapping=050 표기명($.stateName), org-name-map=조직명->세력 표기명(조사·관사 교정 포함), clergy-vocab=§4 금지 성직 어휘(대체 문구 Q22·Q23·Q26 대기), sixteen-framing=십육국 프레임(재작성).
