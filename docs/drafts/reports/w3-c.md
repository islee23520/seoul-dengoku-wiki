# W3 group C report

Written by hand with scripted string replacements. No completion() calls, so no model drafted anything (not Gemini). Station-Interior-Construction: forbidden-term and state-word regex found 0 hits, so it gets no draft.

Place check against 120-map-core.sql (map_station.district_ko / map_region):

| name | result |
|---|---|
| 영등포 | station: 영등포구 | region: 영등포본동/영등포구,영등포동/영등포구 |
| 신정 | station: 양천구 | region: 신정1동/양천구,신정2동/양천구,신정3동/양천구 |
| 방화 | station: 강서구 | region: 방화1동/강서구,방화2동/강서구,방화3동/강서구 |
| 창동 | station: 도봉구 | region: - |
| 노량진 | station: 동작구 | region: 노량진1동/동작구,노량진2동/동작구 |
| 제기동 | station: 동대문구 | region: 제기동/동대문구 |
| 양평 | station: 양천구 | region: 양평1동/영등포구,양평2동/영등포구 |
| 신도림 | station: 구로구 | region: 신도림동/구로구 |
| 구로 | station: 구로구 | region: 구로1동/구로구,구로2동/구로구,구로3동/구로구 |
| 천왕 | station: 구로구 | region: - |
| 군자 | station: 광진구 | region: 군자동/광진구 |
| 고덕 | station: 강동구 | region: 고덕1동/강동구,고덕2동/강동구 |
| 신내 | station: 중랑구 | region: 신내1동/중랑구,신내2동/중랑구 |
| 수서 | station: 강남구 | region: 수서동/강남구 |
| 여의도 | station: 영등포구 | region: - |
| 뚝섬 | station: 성동구 | region: - |
| 구의 | station: 광진구 | region: 구의1동/광진구,구의2동/광진구,구의3동/광진구 |
| 암사 | station: 강동구 | region: 암사1동/강동구,암사2동/강동구,암사3동/강동구 |
| 관악 | station: - | region: - |

All 25 gu in bible 2.4 appear in map_region.district_ko (0 missing). Yangpyeong station is listed under 양천구 in map_station, while the Yangpyeong-dong region is in 영등포구. That's an existing data oddity, and the sentence is unchanged.
