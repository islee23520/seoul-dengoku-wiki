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

## 2단계: 나머지 데이터 전면 치환 (같은 날, 소유자 지시 "문제점 작업해서 병합해")

문서 본문 외에 남아 있던 인물·국가·GDD·가계도·지도·인물 상세의 옛 종교 설정을 표현 매핑으로 치환했다. 대상 파일: 030, 040, 050, 080, 090, 110, 120, 121, 123, 010, 020, 035, 060, 070, 100, 115, 122.

| 원래 표현 | 치환 |
| --- | --- |
| 명동대교구 / Myeongdong Archdiocese / 교구 / Diocese / Parish / parish | Arc / Arc / 교회 건물·조직 표현은 Arc |
| 종교 연합 / Religious Union | Arc |
| 명부교회, 정동노총 | Arc |
| 명동성당 / Myeongdong Cathedral / Cathedral | Arc 성소 / Arc sanctuary |
| 대주교 / Archbishop | 수석 신도 / Lead Believer |
| 교황 / Pope | 교주 / Hierophant |
| 부제, 사제, 사제단, (사제) 신부 / Deacon, Priest, priesthood | 신도, 신도단 / Believer, Congregation |

- 세 국가 표시이름: S04 명부교회 → "Arc (삼성)", S15 명동대교구 → "Arc (명동)", S16 정동노총 → "Arc (정동)". 본문 참조는 모두 "Arc" 하나로 통일했다.
- 인물 수는 1,022명 그대로다. 종교 직함은 신도 계열로 평준화했다.
- GDD 역학 문서의 "AI 신부"(신부 = bride)는 오치환이어서 원본대로 돌려놨다.
- 남은 "미사"는 비종교다: 미사용(未使用), 박미사랑(지명), 미사역(경기 미사시). 유지했다.
- 흰십자단(S13)은 소유자가 정부 진영에 넣었으므로 건드리지 않았다.
- 쇼케이스 앱(artifacts/seoul-showcase)은 미리 만들어진 산출물이라 이번 치환에서 제외했다. 옛 종교가 해설에 남을 수 있다.

검증: 빌드·검사 통과(영어·한국어 각 1,418쪽), 산출 HTML 전수에서 옛 종교 용어 0건.
