# 랜덤 추가 로스터

[roster-100.json](https://github.com/islee23520/seoul-kenshi/blob/main/GDD/game-logic/name-pools/roster-100.json)은 인물 후보 100명을 담은 생성 실험 결과다. 완성 캐스트나 게임에 연결된 모집 명부가 아니다. 기존 [인물 총람](Cast-Index.md)의 422명을 대체하지 않는다. 2026-09-12 감사에서 파일 생성과 설정 검증이 섞여 보고된 점을 확인했으며, 이 문서는 그 상태를 바로잡는다.

## 생성에 사용한 자료

Windows 작업 호스트에서 [NVIDIA Nemotron-Personas-Korea](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea)를 샘플링했다. 다운로드한 첫 parquet 조각은 111,112행이며 전체 100만 행을 설치한 것은 아니다. 데이터 저장 위치는 `E:\git\huggingface\datasets\nvidia\Nemotron-Personas-Korea\train-00000.parquet`, 생성기는 저장소의 `tools/cast/generate_nemotron_roster.py`, 시드는 `90421`이다.

공개 스키마에는 성·이름을 분리한 열이 없지만 페르소나 문장에는 합성된 인명이 들어 있다. 따라서 “이름이 없는 데이터”로 처리할 수 없다. 생성기는 [성씨](https://github.com/islee23520/seoul-kenshi/blob/main/GDD/game-logic/name-pools/surnames.json)·[남성 이름](https://github.com/islee23520/seoul-kenshi/blob/main/GDD/game-logic/name-pools/given-male.json)·[여성 이름](https://github.com/islee23520/seoul-kenshi/blob/main/GDD/game-logic/name-pools/given-female.json)을 조합하면서 원래 페르소나의 인명을 함께 바꾸지 않았다.

데이터 라이선스는 CC BY 4.0이다. 후보를 재배포할 때는 NVIDIA와 데이터셋 주소, 사용 버전, 원본 행 UUID, 가공 내용을 남겨야 한다. 현재 JSON의 `source_uuid`만으로는 다운로드 조각의 리비전·해시와 모든 변환 내역까지 입증되지 않는다. 이름·성격·병역·출신을 실존 인물의 사실로 취급하지 않는다.

[일본 ESC 스페이스](https://huggingface.co/spaces/lucaonv/nemotron-personas-japan-esc)는 현대 페르소나 텍스트의 임베딩·군집 시각화다. 역사 인물 생성기가 아니다. [NGC 한국어 자원](https://catalog.ngc.nvidia.com/orgs/nvidia/teams/nemotron-personas/resources/nemotron-personas-dataset-ko_kr)은 별도 카탈로그이며, 이번 조사에서는 접근 가능한 내용이 제한돼 Hugging Face 배포본과 파일 단위로 동일하다고 검증하지 못했다.

## 현재 파일에서 확인한 상태

| 항목 | 2026-09-12 확인 결과 | 해석 |
|---|---|---|
| 인원·소속 | 100명, 16국, 한 국 최대 8명 | 한 세력 집중은 피했지만 분포의 적절성은 별도 검토 대상 |
| 생업 | 전령 17, 의무원 17, 기록관 17, 순찰대 16, 정비사 16, 물류상 15, 탐사원 2 | 직업 키워드·해시·상한을 적용한 결과이지 직능 조사 결과가 아님 |
| 국적·언어 | 한국 국적·한국어 100명 | 다문화 서울을 반영한 생성 결과가 아님 |
| 회랑 | 100명 모두 미배정 | [이주민 회랑](Diaspora-Corridors.md)의 시드 인물과 연결되지 않음 |
| 관계 | 100명 모두 “미배정. 랜덤 롤 후 배치” | 관계망 작성 미완 |
| 공포 | 100명이 같은 문장 사용 | 인물별 서사 미완 |
| 이름 일치 | 윤창민의 성격 설명이 “임병준 씨는…”으로 시작 | 재작명과 원문 변환이 불일치 |
| 병역 | 비현역 자료에서 이름·성별·연령 조건으로 추가 배정 | 복무 여부·병과·숙련을 입증하지 못함 |
| 항렬 | 7명 적용 | [본관과 항렬](Hangnyeol-and-Bon-gwan.md)에 적은 구현 한계를 가진 시험값 |

이 페이지 갱신은 JSON과 생성기 수정이 아니다. 위 결함이 해결됐다고 해석하지 않는다.

## 기존 인물 소급표와의 구분

별도 로컬 검토물 `cast-backfill-draft.json`과 `cast-backfill-draft.md`는 기존 총람 422명에 새 계약 칸을 제안한 표다. 추가 인물 422명이 아니다. 인물 본문이 있는 412명과 총람에만 있는 10명을 합쳐 만들었으며, 감사 시점에 확인 칸 작성은 0/422명이었다. 해당 검토물과 생성기는 이 문서 PR에 포함하지 않는다.

소급표의 출신·언어·병역도 원문 사실과 구별해야 한다. 성명 해시로 배정한 “동원 거부”나 “병 만기”는 인물의 과거를 조사한 결과가 아니다. 원문이 없으면 미확인으로 남기거나 별도의 창작 제안으로 검토한다.

## 후보 한 명 확인하기

아래 명령은 시드로 검토 대상을 하나 고른다. 캠페인 모집·저장 기능을 구현한 명령이 아니며, 선택한 항목도 승인 전 후보다.

```python
import json
import random
from pathlib import Path

people = json.loads(
    Path('docs/game-logic/name-pools/roster-100.json').read_text(encoding='utf-8')
)['people']
candidate = random.Random(90421).choice(people)
print(candidate['성명'], candidate['소속'], candidate['성격'])
```

## 정본에 올리기 전 확인

1. 새 이름과 설명 속 모든 자기 지칭이 일치하는지 읽는다.
2. 출신·국적·민족적 배경·언어·거주지를 서로 다른 칸으로 기록한다. 한국어 이름이나 현재 소속으로 국적을 추정하지 않는다.
3. 병역은 원문 근거와 창작 제안을 구분하고, 장비 보유·사용 숙련·탄약 접근을 각각 확인한다.
4. 인물마다 야망·공포·관계·촉발 사건을 채우고 [인물 카드 계약](Cast-Profile-Contract.md)으로 검토한다. 단순히 빈 문자열이 없다고 완료 처리하지 않는다.
5. 같은 입력의 재현성, 기존 인물과의 중복, 문장 속 이름 잔존, 다문화 구성, 관계 연결을 검증한 뒤 승인 상태를 기록한다.

검토 수가 쌓이기 전에는 “100명 생성”만 보고한다. “100명 설정 완료”나 “다인종 로스터 완성”으로 보고하지 않는다.
