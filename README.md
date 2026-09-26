# 서울켄시 Wiki 기여 안내

이 저장소는 서울켄시 세계관의 저작 원천과 생성된 Wiki 표면을 관리한다. 공개 본문을 고치기 전에 [세계관 편집 지침](WORLD_BUILDING_GUIDE.md)을 끝까지 읽고, 대상 영역의 `AGENTS.md`와 [로어 작성 규칙](lore/editorial/Writing-Rules.md)을 함께 확인한다.

## 편집 경로

- `lore/`의 JSON 또는 Markdown이 문서별 저작 원천이다. 대응 Markdown·JSON의 계약과 안정 ID·앵커를 보존한다.
- 생성 투영은 손으로 고치지 않는다. 원천을 수정한 뒤 Wiki의 렌더러·gate·링크 검사를 실행한다.
- 전용 브랜치에서 PR을 열고 `main` 병합은 소유자만 한다. 문서 변경은 자동 게시나 게임 구현을 뜻하지 않는다.
- 현재 지시, 원천 승인 상태, 게시 상태, 과거 조사·제안·감사를 서로 다른 상태로 기록한다.

## 무공·명명 문서

- [무공 정본](lore/culture/Martial-Paths.md)과 [저작 JSON](lore/culture/Martial-Paths.json)
- [명명 원장](lore/editorial/Naming-Ledger.json)
- [2026-09-26 명칭 감사 개정안](docs/editorial/2026-09-26/martial-name-audit-and-revision.md)
- [2026-09-26 감사 검증 기록](docs/editorial/2026-09-26/martial-name-audit-verification.md)
- [2026-09-26 Wiki 업데이트·발전 연구](docs/editorial/2026-09-26/mugong-wiki-update-and-development-study.md)

감사 문서는 역사적 기록이다. 신종목의 총검술 사용자 정정은 최신 사용자 지시로 기록된 적용 방향이며, 총림의 개방·타구봉법과 소림 전수 분리는 현재 원천 경계다. 그와 별개로 감사 문서의 제안·네 보류 항목·검증 공백은 자동 승인이나 게시 완료가 아니다. 2026-09-26 현재 브랜치의 병합·배포 상태는 각 문서의 적용 메모를 따른다.
