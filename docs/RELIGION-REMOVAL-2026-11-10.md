# 종교 설정 삭제 기록 (2026-11-10)

소유자 결정: 명동 대주교 등 기존 종교 설정은 없애고 Arc로 대체한다. 방식은 "문서 본문만 삭제"로 정했다.

`data/sql/030-wiki-documents.sql`에서 다음 용어가 있는 줄을 지웠다. 제목 줄이 걸리면 그 아래 하위 절까지 지웠다. 줄을 새로 쓰거나 바꾸지 않았고 영어·한국어 본문 모두 같은 규칙이다.

- 한국어: 명동대교구, 명동 대교구, 명동성당, 명동역 구휼, 대주교, 대교구, 교황, 종교 연합, 종교연합, 성당
- 영어: Myeongdong Archdiocese/Cathedral, Archbishop, Archdiocese, Pope, Religious Union, Cathedral

문서별 삭제 줄 수:

- Century-Annals: ko -45 lines, en -40 lines
- Chaebol-Houses-and-Century-Factions: ko -1 lines, en -0 lines
- External-Theaters: ko -5 lines, en -5 lines
- Faith-Culture-Schism: ko -31 lines, en -29 lines
- Food-Culture: ko -1 lines, en -1 lines
- Hostile-Ecology-Index: ko -12 lines, en -12 lines
- Hostile-Group-G10: ko -13 lines, en -13 lines
- Hostile-Group-G15: ko -1 lines, en -1 lines
- Offices-and-Ranks: ko -9 lines, en -8 lines
- Operating-Houses: ko -6 lines, en -6 lines
- Scenario-Timeline: ko -4 lines, en -4 lines
- Sixteen-States: ko -19 lines, en -12 lines
- Values-and-Policy-Scales: ko -1 lines, en -1 lines
- World-Map-Construction: ko -1 lines, en -1 lines
- World-Unbinding: ko -1 lines, en -1 lines

## 남은 곳 (이번에는 건드리지 않음)

인물 직함·직무(`050`, `090`), 가계도(`110`), 지도 데이터(`120`), 국가 표(`040`), GDD 문서(`080`)에는 같은 설정이 남아 있다. 인물 61명이 교구 소속 직함(Archbishop, Deacon 등)을 갖는다. 이들은 소유자가 "문서 본문만"으로 범위를 한정해 두었으므로 별도 결정이 필요하다. 문서에서 삭제된 문장을 참조하는 문서 링크는 빌드 검사로 확인했고 끊긴 곳은 없다.

되돌리려면 이 PR을 되돌리면 된다. 원본은 PostgreSQL 정본에도 남아 있다.
