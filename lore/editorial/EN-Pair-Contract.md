# EN 짝파일 계약

로어 문서는 한국어 `<이름>.md` 옆에 영어 정본 `<이름>.en.md`를 둔다. 두 파일 모두 frontmatter에 `tense`(past | present)와 `source_hash`(마지막 동기화 시점의 짝 파일 본문 sha256)를 가진다.

- 정본은 영어다(Writing-Rules 1항). 영어 시제는 연대기 화자의 과거형이 기본이다(4·5항).
- 한국어 번역의 `tense`는 영어 정본과 같아야 하며 `TOOL/tools/wiki/lore-tense-check.mjs`가 기계로 확인한다.
- 체커 기본 모드는 origin/main 대비 변경된 `WEB/lore/**` 파일과 완료 배치 원장만 짝을 강제한다(이관 창). `--strict`는 전수 검사하며 태스크 17에서 활성화한다.
- 마운트는 `*.en.md`를 스킵한다. 한국어 번역만 `wiki-source/world`로 나간다.
- 이관 완료 후 MongoDB가 본문 정본이 되면(Writing-Rules 3항) 이 계약의 `source_hash`는 DB 동기화 근거로 승계된다.

파일럿 짝: `overview/World-Unbinding.md` ↔ `overview/World-Unbinding.en.md`
