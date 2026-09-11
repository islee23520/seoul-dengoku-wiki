# 랜덤 추가 로스터

이름 있는 412명 총람을 지우지 않는다. 이 페이지는 **추가로 굴릴 수 있는 100명**이다. 한 세력에 몰지 않았고, 생업 일곱에 흩뿌렸다. 기계 정본은 [roster-100.json](name-pools/roster-100.json)이다.

생성은 Windows `desktop-bo514et`에서 돌렸다. Hugging Face 캐시는 `E:\git\huggingface`만 쓴다. parquet는 `E:\git\huggingface\datasets\nvidia\Nemotron-Personas-Korea\train-00000.parquet`. 생성기: `tools/cast/generate_nemotron_roster.py`. 시드 `90421`.

Nemotron 행에는 이름이 없다. 인구·직업·병역·페르소나 문장만 있다. 성명은 [성씨 풀](name-pools/surnames.json), [남성 이름](name-pools/given-male.json), [여성 이름](name-pools/given-female.json)에서 붙이고, 명문만 [본관과 항렬](/world/Hangnyeol-and-Bon-gwan)을 이름 앞글자에 덮어쓴다.

일본 ESC 스페이스와 NGC `ko_KR` 카탈로그는 **역사 인물 생성기가 아니다**. 전자는 현대 페르소나 클러스터 리포트, 후자는 로그인 벽이 있는 데이터셋 카드다.

## 한 명 굴리기

저장소 루트에서:

```bash
python3 - <<'PY'
import json, random
from pathlib import Path
roster = json.loads(Path('docs/game-logic/name-pools/roster-100.json').read_text())['people']
p = random.choice(roster)
print(p['성명'], p['생업'], p['소속'], p['징집 이력'], p.get('본관') or '-')
PY
```

결정론이 필요하면 캠페인 시드의 인물 스트림으로 `id`를 고른다. 같은 `source_uuid`를 두 번 쓰지 않는다.

## 분포 (시드 90421)

- 16국에 분산. 한 국 최대 8명.
- 생업: 전령 17, 의무원 17, 기록관 17, 순찰대 16, 정비사 16, 물류상 15, 탐사원 2.
- 항렬 적용 7명. 이주민 회랑 이름은 이 JSON에 넣지 않는다. 회랑 시드는 [이주민 회랑](/world/Diaspora-Corridors).

칸은 [인물 카드 계약](/world/Cast-Profile-Contract)을 따른다. `근위`·`돌격`·`궁수` 없음. 제식 소화기 모델명 없음.

다시 뽑을 때:

```text
python tools/cast/generate_nemotron_roster.py --parquet E:\git\huggingface\datasets\nvidia\Nemotron-Personas-Korea\train-00000.parquet --pools docs/game-logic/name-pools --existing docs/game-logic/name-pools/existing-names.json --out docs/game-logic/name-pools/roster-100.json --n 100 --seed 90421
```
