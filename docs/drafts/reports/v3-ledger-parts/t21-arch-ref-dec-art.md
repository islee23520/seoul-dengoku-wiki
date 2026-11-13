# 과제 21 배치 arch-ref-dec-art 잠정 원장 조각

이 배치는 새 설정을 짓지 않았다. 고친 일곱 문서(ADR-003, Character-Art-Direction, Unity-Architecture, Unity-System-Design, Unity-Architecture-Implementation-Plan, Ref-Mechanism-Index, Ref-Crusader-Kings-3)의 이름과 칭호, 옷 규칙, 전투 계약은 모두 기존 v3 장(01-core 2.3·6.3·7·8·10절, 04장 11절, 05장 9절, 06장 9절, 09장 3절)과 `data/sql/120-map-core.sql` map_station의 칭호 위계, 바이블 2.5절에서 그대로 가져왔다.

| # | Document | Location | Provisional item |
|---|---|---|---|
| - | - | - | 없음 (새로 지은 항목 없음) |

## 검토 후 보정 (2026-11-13)

- **Ref-Mechanism-Index**: 사용법 목록 뒤에 v3 경계 문단(캐논 블록 `v3.20261113.boundary`)을 넣었다. "잔선 채택"·"잔선" 항목과 "3역 범위"·"3역 각각"·"3역×B1/B2" 범위 문장은 옛 청사진의 문장이고, 전투는 바이블 2.5절 D3와 v3 09장 3절(지휘관 한 명이 모든 분대를 지휘하는 야전, 개인 판정은 결투·영웅의 싸움에만)이 대체한다고 적었다. 13절 [적용 제안]의 "기존 수동 SRPG·3역×B1/B2 계약…변경하지 않는다"를 옛 청사진 계약이 대체됐다는 문장으로 고쳐 썼고, 영어의 "3 roles"를 한국어 "3역"에 맞춰 "three stations"로 바로잡았다. 인물 입력과 v3 장에 없는 "서하늘 부상"/"Seo Haneul injured" 배지 예시는 "일행 한 명 부상"/"a party member injured"로 바꿨다. 새로 지은 설정은 없다.
- **Ref-Crusader-Kings-3**: 캐논 JSON의 "궁정 신도·주교"·"신도의 위조" 두 문자열을 HEAD의 "궁정 사제·주교"·"사제의 위조"로 되돌렸다(rendered.lock.json 항목도 HEAD 값 `e7e25f13…`로 복귀). CK3의 Court Chaplain은 성직 직위이므로 참조 정확성을 지킨다. 080 행은 이전 커밋 660820485가 이미 "신도"로 바꿔 둔 상태여서, 같은 두 곳을 한국어 "궁정 사제·주교"/"사제의 위조", 영어 "Court Chaplain/Bishop"/"chaplain forgery"로 맞춘 행을 `docs/drafts/gdd/arch-ref-dec-art.jsonl`에 넣었다. 이 낱말들은 CK3 직위명을 설명하는 레퍼런스 어휘이고 세계 어휘가 아니다(브리프가 CK3 어휘를 참조로만 허용).
