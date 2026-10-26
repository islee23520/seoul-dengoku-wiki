# ToDo

규칙: 한 번에 하나의 모듈. 현재 모듈만 진행하고, 로컬 검증 → commit/push → PR 순서로만 완료한다.

## 현재 모듈: InkOS 어댑터 혼합 구조 지원 (feat/inkos-adapter-mixed-structure-20261027)
- [x] 브랜치 생성(`test/inkos-adapter-regression-20261026` 위에 스택 — PR #627 의존 명시)
- [x] `export.mjs`: 문단 전용 거부 → 비문단 노드 skip + 대상 앵커 문단 요구 유지
- [x] `inkos-adapter-fixture.mjs`: `mixedStructure` 옵션(heading+list 노드, 기본값 불변)
- [x] 신규 시험 `test-inkos-adapter-mixed-structure.mjs`(발췌·체인·비문단 보존·비문단 대상 거부)
- [x] 픽스처 들여쓰기 정리
- [x] README §4·§6·§9 갱신(혼합 구조 발췌 서술)
- [x] 로컬 검증: 7종 직렬 실행 전부 통과(108/108)
- [x] 정본 실운영(E 본완료): `개요-p1` export → 실제 provider(cliproxy) → collect → prepare-draft → 정본 DB 해시 무변경 → `real-provider-run.md` 폐쇄
- [x] commit(한국어 conventional) → push → PR(#627 스택 명시)

## 대기 중 (소유자)
- PR #623/#627/#628 병합 → 병합 후 D 레인(`test-inkos.mjs` master 스모크 복원)
