# 《잔선: 서울》

![붕괴 이후 지하철 거점의 콘셉트](https://github.com/islee23520/seoul-kenshi/blob/main/docs/assets/wiki/janseon-seoul-cover.png?raw=true)

> **붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4방향 대전략 SRPG.**

《잔선: 서울》은 아포칼립스 이후 서울의 지하철망을 영토, 물류, 생존, 정통성의 골격으로 삼는 인물 중심 대전략 RPG입니다. 플레이어는 무명 인물과 소규모 파티로 출발해 역과 노선을 오가며 생업, 관계, 직위와 세력 내 영향력을 쌓습니다. 탐색, 상호작용과 전투는 하나의 고정 직교 아이소메트릭 카메라와 4방향 타일 격자를 공유합니다.

## 문서 안내

| 문서 | 설명 |
|---|---|
| [게임 명제](Game-Thesis.md) | 게임이 제공할 경험과 설계 경계 |
| [서울과 지하철 레이어](World-and-Subway-Layers.md) | 다층 세계 그래프와 데이터 출처 |
| [캠페인 루프](Campaign-Loop.md) | 준비, 원정, 조우, 전투, 정산 |
| [인물·세력·생업](Characters-Factions-and-Professions.md) | 관계, 직위, 정통성과 성장 |
| [이동과 조우](Travel-and-Encounters.md) | 4방향 행동과 원정 위험 |
| [SRPG 전투](SRPG-Combat.md) | 동일 격자에서 진행되는 전술 규칙 |
| [전략·전투 왕복](Strategy-Battle-Roundtrip.md) | 불변 컨텍스트와 멱등 정산 |
| [캐릭터 미술](Character-Art-Direction.md) | 2.5등신, 도트 헤드, 메시 바디 |
| [자산 파이프라인](Asset-Pipeline.md) | ComfyUI, TRELLIS, Blender, Unity |
| [Unity 아키텍처](Unity-Architecture.md) | 엔진 독립 규칙과 표현 계층 |
| [저장과 결정론](Save-and-Determinism.md) | 재현 가능한 세계와 안전한 저장 |
| [개발 로드맵](Development-Roadmap.md) | 검증 게이트와 구현 순서 |

## 현재 구현 범위

현재 저장소에는 Unity 6.7 프로젝트, 장르 계약 JSON, 계약 EditMode 테스트와 문서 기반이 있습니다. 캠페인 시뮬레이션과 전술 전투는 이 문서에 정의된 검증 게이트를 따라 이후 구현합니다. 문서에 적힌 설계는 구현 완료를 의미하지 않습니다.

