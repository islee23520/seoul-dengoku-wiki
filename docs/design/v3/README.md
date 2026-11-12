# v3 세계 생태계 바이블 (World Ecosystem Bible v3)

상태: 작성 중. 계획 `.omo/plans/wiki-lore-rebuild-v3.md`.

소유자 목표(2026-11-12, 원문): "...must re think from very beggining all of eco system ecept the name of the poeple and the potirait face and the sex of it". 추가 답: "바이블 골격 유지, 나머지 재설계", 고정 "서울 실제 지리·역 이름, 인물 나이·가족 관계".

## 권위 순서

1. `docs/CANON-BIBLE.md`의 골격: 1절(승인된 세계 규칙), 2.1~2.5절(세 세력, 25공작령 배정, 병종과 지휘 원칙), 3절(연표 [승인] 행), 4절(금지 어휘, 늘릴 수만 있다), 9.4절 결정 기록.
2. 이 디렉터리의 v3 바이블 장(章).
3. 그 밖의 모든 위키 문서, 인물, 병종, GDD, 쇼케이스, 게임 설계 문서. 이것들은 v3 바이블에서 다시 쓴다. 기존 본문은 참고 자료일 뿐 근거가 아니다.

## 고정 사실 (바꾸지 않는다)

| 대상 | 범위 |
|---|---|
| 인물 정체 | `wiki_person` id, name, name_ko, gender, gender_ko. 인원 1,022명 그대로(추가·삭제 없음) |
| 나이·출생 | `person_detail` json/json_ko의 birthDate, birthday, age, ageAsOf, generation, characterId (기록된 511명). 기록이 없는 511명의 나이는 v3에서 새로 정하고 잠정 원장에 올린다 |
| 가족·씨족 | `person_detail.clan_id`와 `$.clan`, Kinship 관계의 from·type·to(근거 문장 `basis`는 재설계), `clan`의 id·성·본관·한자·분파 구성원, `clan_member`, `nonkorean_family` 구성원, `family_tree`의 모든 노드 id·personId·kind·이름·생몰일과 모든 간선 |
| 초상 얼굴 | `public/portrait-tokens/*.json`의 personId·name·`artProposal.face`·`slots.face`·이미지 sha256·identity(이름·성별·민족·나이), `public/portraits/*`, `artifacts/seoul-showcase/public/portraits/*`, `artifacts/seoul-showcase/public/history/portraits/*` 파일 바이트 |
| 서울 지리 | `map_region` 이름·구·경로·역 수·면적, `map_station` 이름·구·좌표·차수·노선, `map_edge`, `map_line`, `map_landmark` 위치, `map_title` 위계·실제 행정명·경로, `map_state` 좌표·수도·배타 구 수, `map_meta`의 width·height·projection·attribution·major_station_ids, `map_rail`, `map_underground` |

나머지(직함, 직위, 등급, 직업, 소속 세력 안의 자리, 거점, 약력, 능력치, 보유지, 가신 관계, 지도 영역의 통제·위계·요약·개막 상태 문구(`map_region` summary·polities·opening_state, `map_station` control, `map_edge` control), 표지 이름·역할·설명(`map_landmark`), `map_meta` epoch, `site_meta` tagline, 초상 토큰의 역할·복장·장비 문구, 가계도 노드의 timeline·status·affiliation·lineage·sourceRefs, 문서 본문과 제목, 병종, GDD, 쇼케이스)는 모두 재설계 대상이다.

## 검사

```bash
node scripts/pages/v3-fixed-facts.mjs --check   # 고정 사실이 스냅샷과 같으면 exit 0, 다르면 차이를 출력하고 exit 1
```

스냅샷 `fixed-facts.snapshot.json`은 기준 커밋(`feat/world-overhaul-v2` 536c1f286 + `task/w2v-17-showcase` 병합)에서 과제 1이 한 번만 썼다. 다시 쓰지 않는다(`--write`는 파일이 있으면 거부한다).

## 장 목록

| 파일 | 내용 | 과제 |
|---|---|---|
| `01-core.md` | 영원한 겨울의 세계 물리, 세 정체의 핵심, 칭호 사다리, 십 년 단위 연표, 폐기 개념 목록 | 2 |
| `02-ecology.md` | 적대 생태와 서울 밖 | 3 |
| `03-technology.md` | 기술, 사이버웨어, 무기, 결핍 경제 | 4 |
| `04-government.md` | 정부 사회 | 5 |
| `05-free-city.md` | 자유도시 사회 | 6 |
| `06-arc.md` | 아크 사회 | 7 |
| `07-people-and-war.md` | 인물 배치 규칙, 세력 간 생활, 병종 교리 | 8 |
| `08-document-map.md` | 63개 slug의 v3 주제와 제목 | 9 |

각 장은 한국어 원문(`.md`)과 영어 미러(`.en.md`)를 둔다. 지어낸 항목은 모두 `docs/drafts/reports/v3-provisional-ledger.md`에 올린다.
