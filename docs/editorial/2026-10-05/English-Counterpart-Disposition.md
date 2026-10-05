# 직접 영어 대응문 공개 경계 처분

기준 a1ac2b7b의 독립 검토가 지적한 다섯 대응문만 수정한다. 아래 원문은 삭제 이력이며 공개 정본이 아니다. 새 번역이나 지리·무공 사실을 추가하지 않는다.

추가 소유자 지시는 같은 표 칸의 한국어 집필 제약도 공개에서 제외하도록 승인했다. `lore/structures/Structures.json`, `전투와의-관계-table5`, 행 2·열 4의 원문은 `총구와 봉의 면. 모델 수량은 적지 않는다`이다. `모델 수량은 적지 않는다`는 수량 사실이 아니라 작성 지시이므로 비공개 삭제 이력으로 보존한다. 공개 값은 `총구와 봉의 면`이며 실제 장비·수량 사실은 바꾸지 않는다. 최종 공개 변화는 영어 다섯 값과 이 한국어 한 값이다.

```json
{
  "base": "a1ac2b7b9cfc1572dffe9593b20c91acc1a52a6a",
  "selectors": [
    {
      "p": "lore/culture/Martial-Paths.json",
      "anchor": "손결-p1-label",
      "before": "A. Six Training Domains",
      "after": "A. Nine Training Domains",
      "originalSourceLine": "\"text\": \"A. Six Training Domains\",",
      "replacementSourceLine": "\"text\": \"A. Nine Training Domains\","
    },
    {
      "p": "lore/culture/Martial-Paths.json",
      "anchor": "유파와-나라-p6",
      "remove": " Suseo, Banghwa, Ttukseom, and Garak were not capitals either, and so were not written as school head temples.",
      "originalSourceLine": "\"en\": \"The Cold Current Art lived together at the lock-gate watches of Yeongdeungpo, Amsa, and Guui. The Water Compact did not monopolize the transmission. Even if the Iron Forging Art's oral record remembered the Changdong depot, that place was unclaimed-territory training, not a state seal. Suseo, Banghwa, Ttukseom, and Garak were not capitals either, and so were not written as school head temples.\",",
      "replacementSourceLine": "\"en\": \"The Cold Current Art lived together at the lock-gate watches of Yeongdeungpo, Amsa, and Guui. The Water Compact did not monopolize the transmission. Even if the Iron Forging Art's oral record remembered the Changdong depot, that place was unclaimed-territory training, not a state seal.\","
    },
    {
      "p": "lore/offices/Offices-and-Ranks.json",
      "anchor": "사제와-겸전과-형조-p2",
      "remove": " Where this chapter spoke of transmission, it wrote martial master.",
      "originalSourceLine": "\"en\": \"A master was one kind of relation in the ledger. Not the same title as the priests of a faith chapel. Where this chapter spoke of transmission, it wrote martial master.\",",
      "replacementSourceLine": "\"en\": \"A master was one kind of relation in the ledger. Not the same title as the priests of a faith chapel.\","
    },
    {
      "p": "lore/structures/Structures.json",
      "anchor": "유파-현장의-업무와-생업-table1",
      "remove": " Counts are not written",
      "originalSourceLine": "\"en\": \"Teachers and places: Only lines where the deserter and mobilization ledgers opened; Practice: Carries the issue firearm. Counts are not written; Burden and risk: When ammunition ran out, the weight of a trade tool; Response: When supply cut, this cell emptied and it returned to the staff; Unit command: Attack. Military-remnant layer; Battlefield archetype: Surface ruins, terminals; Related taboo: Opens no armory on civilian registers\"",
      "replacementSourceLine": "\"en\": \"Teachers and places: Only lines where the deserter and mobilization ledgers opened; Practice: Carries the issue firearm.; Burden and risk: When ammunition ran out, the weight of a trade tool; Response: When supply cut, this cell emptied and it returned to the staff; Unit command: Attack. Military-remnant layer; Battlefield archetype: Surface ruins, terminals; Related taboo: Opens no armory on civilian registers\""
    },
    {
      "p": "lore/structures/Structures.json",
      "anchor": "전투와의-관계-table5",
      "remove": ". Model counts are not written",
      "originalSourceLine": "\"en\": \"The face of muzzle and staff. Model counts are not written\",",
      "replacementSourceLine": "\"en\": \"The face of muzzle and staff\","
    }
  ]
}
```
