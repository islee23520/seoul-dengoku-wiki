# 봉인된 과거 인물 입력

이 디렉터리는 현재 세계관 정본이나 공개 자산이 아닌 불변 보존 입력이다. 루트 JSON 두 파일은 파일명에 적힌 revision의 발급 원장 바이트를 보존한다. `corpus/`는 revision `5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4`의 인용 원천을 보존하며, 출처 해시와 원장 봉인은 DB의 보존 시트 메타데이터로 관리한다. 파일·봉인·역사 수치·당시 소속을 현행화한다는 이유로 바꾸지 않는다.

일반 PostgreSQL 생성은 typed 보존 시트 테이블을 읽고 저장된 revision·provenance·record·numeric 봉인을 검증한다. 이 디렉터리의 파일을 런타임 원천으로 읽거나 현재 인물을 `lore/` 파일에서 직접 읽는 경로가 아니다. 현재 공개 인물 상세는 역사 `personSheet`·`gurps` 필드를 노출하지 않는다. 과거 소속과 발급 수치는 비작동 역사 근거로 남으며 opposed-d10이나 현행 역량·숙련으로 자동 환산하지 않는다.

기존 Git 객체에서 바이트 그대로 다시 가져오는 명시적 유지보수 작업은 보존 시트 메타데이터가 든 외부 진단 SQLite를 지정하여 `WIKI_DOCUMENT_DB=/path/to/external-diagnostic.sqlite node scripts/import-issued-history.mjs`로 수행한다. importer는 해당 DB의 revision·출처 해시를 읽고 모든 Git 객체 payload의 해시를 확인한 후 보존 파일을 덮어쓴다. 일반 생성·운영 이관·봉인 재발급 명령이 아니므로 복구 범위와 승인을 먼저 확인한다. 봉인 갱신이나 새 역사 revision은 별도 승인이 필요하며 재생성으로 승인할 수 없다.

현행 저작 정본은 PostgreSQL `wiki`다. 외부 SQLite는 경로를 명시한 이관·대사 진단 전용이다. 무협 제거·서울 유일 세계·한국어 공개 전용 기준은 [루트 안내](../../README.md)와 [세계관·저작 지침](../../WORLD_BUILDING_GUIDE.md)을 따른다. 과거 원문의 무공·지리·영어·규칙 문구는 현행 명령이나 승인으로 재사용하지 않는다. 이 설명 변경은 봉인 corpus나 원장 바이트·해시를 수정하지 않는다.
