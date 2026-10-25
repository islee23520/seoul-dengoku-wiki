# lore/culture — 가치관·신앙·생활문화

## OVERVIEW
인물·조직의 가치 축, 종교 분화, 음식·복식과 구전 원천을 관리한다.

## WHERE TO LOOK
아래 `.json` 이름은 SQLite 논리 ID 또는 과거 provenance이며 물리 입력 파일이 아니다. 공개·비공개 정본 구분과 편집 절차는 루트 `lore/AUTHORING-JSON.md`와 `WORLD_BUILDING_GUIDE.md`를 따른다.
| 작업 | 위치 |
|---|---|
| 가치관·욕망·정책 정의 | `Values-and-Policy-Scales.json` |
| 실제 인물·조직 수치 | `../name-pools/values-cast.json`, `../name-pools/values-orgs.json` |
| 신앙·의례·분화 | `Faith-Culture-Schism.json` |
| 음식·급수·배급 | `Food-Culture.json` |
| 복식·몸단장 | `National-Dress-and-Grooming.json` |
| 대정전 구전 | `Oral-Stories.json` |
| 개막 시점·구전 제목 | `../chronology/Scenario-Timeline.json` |

## CONVENTIONS
- 도메인별 과거 자료와 현재 head·승인 상태를 대조하며, 삭제된 JSON 원천을 다시 만들지 않는다.
- 가치관 축은 `−100..100`이며 음수는 U+2212다. 0과 미확인을 구분한다.
- 가치관·욕망·정책의 축 개수는 정의 문서와 각 수치 schema를 대조한다. 과거 안내의 개수를 일괄 적용하지 않는다.
- 지도자가 바뀌면 조직의 헌장 수치를 재검토한다. 국가 성격을 영구 고정하지 않는다.
- 신앙의 변화는 정전의 밤·수문 개방·죽음 같은 사건과 연결한다. 총재 명령이나 구 점유만으로 기질이 바뀌지 않는다.
- 물을 먼저 확보하고 밥을 짓는 생활 순서를 보존한다.
- 배급 연결은 영등포 정수 당직·신정 기지 밥솔·암사 호위의 원문과 대조한다.

## ANTI-PATTERNS
- `Martial-Paths.json`과 삭제된 KO/EN 공개 기사를 재생성하지 않는다. 삭제 결정일은 2026-10-13이다.
- 옛 개방·소림 전수 보존, 아홉 분류, 기본·상승 쌍을 현행 문화 계약으로 복원하지 않는다.
- 환승계의 상호부조·쉼터·배급·기록 기능을 무협 전수와 같은 것으로 취급하지 않는다.
- 기존 종교 조직명을 근거로 새 종교 국가를 자동 생성하지 않는다. S08 중앙정보국을 추가 신정국으로 바꾸지 않는다.
- 현존 성직자·교단 로고·지역 노회 이름을 창작 분파에 추가하지 않는다.
- 다른 작품의 기제는 비교 자료이며 고유명·도상·이벤트 문구를 가져오지 않는다.
- 구전집에 새 사건을 만들거나 선대 창립자를 개막 인물과 동일인으로 합치지 않는다.
- 배급 창구에 2026년 상표를 부활시키지 않는다. 생활 습관과 상호는 다르다.

## COMMANDS
문화 원천 변경은 루트 `npm run test:lore-json`과 `npm run test:lore-links`로 확인한다.
