# v3 바이블 날짜 맞춤·겨울 B안·용어 적용 기록 (과제 35·38, 01장과 03~10장)

상태: 과제 35(날짜)와 과제 38 3부(용어 적용) 가운데 바이블 장 부분의 작업 기록이다. 대상은 `docs/design/v3`의 01, 03~10장(한국어와 영어 미러)이다. 02장(도감 과제가 맡는다), 11장, 12a(2절 203번 행과 바꿀 말 수만 더함, 5.2절), README와 `docs/CANON-BIBLE.md`는 고치지 않았다. 브랜치 `task/v3-35a-bible-retime`, 먼저 `task/v3-38-terms`를 병합했다(빨리 감기).

근거: 11장 3.3절(바뀐 날짜 표), 11장 2.5절(겨울 수치 B안, 소유자 결정 2026-11-13), `12a-terms.md` 2절(바꾸는 말 207행)과 3절(뜻을 정해 두고 쓰는 말), 권위 순서 바이블 1~3절(ea06d2e12) → 11장 → 01~10장.

줄 번호는 이 커밋 뒤 파일의 줄이다. 모든 바꿈은 줄 안에서 이루어져 줄 수가 바뀌지 않았으므로 한국어와 영어 미러의 줄 번호는 그대로 맞물린다.

## 1. 겨울 B안과 그에서 나온 수치의 산식

| 식별 | 무엇 | 옛 값(A안) | 새 값(B안) | 산식 |
|---|---|---|---|---|
| B0 | 지상 기온 | 연평균 -18도, 긴 낮 철 -11도, 긴 밤 철 -25도, 눈보라 밤 -38도, "영하 3도를 넘은 날 없음" | 연평균 -9도, 낮이 긴 때 -6도, 밤이 긴 때 -13도, 8월 -4도, 1월 -22도, 눈보라 밤 -35도, 영상인 날은 한 해 열흘 안쪽 | 11장 2.5절 표 그대로 |
| B0 | 빛 | 대정전 전의 4분의 1 | 맑은 날 약 80%(곧장 오는 빛 약 60%), 회백색 하늘, 흐린 흰 해 | 11장 2.5절 표 그대로 |
| B0 | 눈(물로 친 양) | 한 해 200 mm(7분의 1) | 한 해 350 mm(4분의 1) | 11장 2.5절 표. 대정전 전 서울 강수 약 1,400 mm의 4분의 1 |
| B1 | 땅속 온도와 동결선 | 눈 밑 땅 표면 -10도, 동결선 35 m, 2036년 10 m, 2066년 22 m, 한 해 17 cm, 대합실 -10~-7, 승강장 -7~-4, 깊은 터널 -3~4 | 땅 표면 -8도, 동결선 33 m, 2056년 12 m, 2086년 23 m, 한 해 21 cm, 대합실 -7~-6, 승강장 -6~-2, 깊은 터널 -2~5 | 반무한 고체의 계단 냉각 T(z)=Ts+(T0-Ts)·erf(z/2√(κt)), T0=14도, Ts=-8도(14-22), κ=1×10⁻⁶ m²/s, t=80년=2.52×10⁹ s, 2√(κt)=100 m. z=3 m -7.3, 8 m -6.0, 10 m -5.5, 20 m -3.1, 25 m -2.0, 33 m -0.1, 40 m +1.4, 55 m +4.9(11장 2.5절 "10 m -6, 20 m -3, 40 m +2, 55 m +5, 경계 약 33 m"과 맞음). 동결선 깊이는 √t에 비례: 33×√(10/80)=11.7≈12 m(2056), 33×√(40/80)=23.3≈23 m(2086), 지금 속도 33/(2×80)=0.21 m/년. 11장 3.3절 7행의 35 m 기준 값(12 m, 25 m, 22 cm) 대신 B안 표의 33 m를 썼다(아래 4절) |
| B2 | 쌓인 눈 | 평지 6~8 m, 골 10 m 넘게, 2층까지 묻힘 | 평지 7~9 m, 골 12 m 넘게, 2~3층까지 묻힘 | 남는 몫 15%(85% 승화·날림은 그대로): 350×0.15=52.5 mm/년, ×80년=4.2 m(물). 다져진 눈 밀도 0.45~0.6 → 7.0~9.3 m. 밀도를 올린 까닭: A안 6~8 m는 3.0 m(물)÷6~8 m로 밀도 0.375~0.5를 뜻했다. B안은 해마다 남는 눈이 75% 많아(52.5 대 30 mm/년) 위에 실리는 무게가 커지고, 여든 해 동안 아래층이 만년설 전 단계(firn)의 0.45~0.6까지 다져진다고 본다. A안 밀도를 그대로 쓰면 평지 8.4~11.2 m, 골 14 m 넘게가 된다. 01-core 109줄(+.en)의 7~9 m, 12 m, 2~3층은 이 밀도를 따른다 |
| B3 | 1인당 바깥 열(수용력 열 계수) | 대합실 60 W, 승강장 40 W, 깊은 터널 10 W | 대합실 50 W, 승강장 36 W, 깊은 터널 9 W | 벽 손실 ∝ (안 온도 - 둘레 땅 온도). 대합실 안 3도: A 3-(-8.5)=11.5 → B 3-(-6.5)=9.5, 60×9.5/11.5=49.6≈50. 승강장 안 11도: A 16.5 → B 15, 40×15/16.5=36.4≈36. 깊은 터널 안 14도: A 13.5 → B 12.5, 10×12.5/13.5=9.3, 반올림해 9 W(다른 두 계수와 같은 반올림) |
| B4 | 눈 녹이는 열 | 1인당 45 W | 1인당 43 W | 하루 10 kg: 녹임 10×334 kJ=3,340 kJ, 눈 데우기 10×2.09×9=188 kJ(A안은 ×18=376), 물 0→5도 210 kJ, 합 3,738 kJ/86,400 s=43.3 W(A안 3,926 kJ → 45.4 W) |
| B5 | 역 계산 예(01-core 4.2절) | 서울역 4,200, 신도림 열 2,500·결과 2,000, 잠실 3,080→3,100, 충전 몫 돌리면 360명, 잠실 세례자 29% | 서울역 4,400, 신도림 열 2,780·결과 2,000, 잠실 3,420→3,400, 400명, 약 26% | 서울역: 깊은 층 1,000×9 W=9 kW, 남은 141 kW, 승강장 3,000×36=108 kW(물 4,000명 맞음), 남은 33 kW÷(36+43)=418 → 약 4,400. 신도림: 100 kW÷36=2,778, 공기 2,000이 그대로 막음. 잠실: 123 kW÷36=3,417 → 약 3,400(공간 3,750). 충전 7.2 kW를 열펌프로: 21.6-7.2=14.4 kW÷36=400. 900÷3,400=26.5% |
| B6 | 역 등급과 인구 총계 | 환승역 1,500~3,200명, 총계 약 30만 | 환승역 1,500~3,500명, 총계 약 30만(그대로) | 잠실 3,400이 들도록 환승역 위끝만 올림. 열이 막는 역만 약 10% 풀리고(40/36=1.11), 공기·공간·물이 막는 역(신도림)과 세력 한도인 섬유(5.3절)는 그대로라 30만, 16만·7만 5천·6만 5천은 두었다 |
| B7 | 서울 열 합계 | 바깥 열 12 MW, 열 합계 16 MW, 태우는 불 6 MW | 바깥 열 11 MW, 열 합계 15 MW, 태우는 불 5 MW | 평균 1인 바깥 열 40 W×30만=12 MW → 36 W×30만=10.8≈11 MW. 당화 탱크·부엌 4 MW 그대로. 03장: 전기에서 나는 열 10 MW는 그대로, 메탄·나무·고물 불이 6→5 MW |
| B8 | 온실(옛 빛밭) | 1인당 90 m², 서울 27 km²(4.5%), 1 m²당 한 해 1,250 kcal(옛 밭의 3분의 1), 모자라는 열 1 W/m² | 1인당 45 m², 서울 13.5 km²(2.2%), 1 m²당 한 해 2,500 kcal(옛 밭의 3분의 2), 모자라는 열 0.5 W/m² | 빛 0.25→0.8(3.2배)이지만 안 온도 0~8도의 찬 작물이라 수확은 2배로만 잡음(옛 밭 3,750 kcal의 3분의 2). 끼니 몫 12%(하루 약 310 kcal)는 그대로: 310×365÷2,500=45 m². 30만×45 m²=13.5 km², 서울 605 km²의 2.2%. 모자라는 열은 온도 차 비례(4-(-25)=29 → 4-(-13)=17, ×0.59)와 햇빛 증가로 약 0.5 W/m²: 45 m²×0.5=23 W < 1인 날숨 열 90 W. 11장 2.4절 T33-12(지상 불빛과 열은 신호)와 지붕감 부족 때문에 넓이를 늘리지 않고 끼니 몫을 그대로 둔다 |
| B9 | 전지(03장 2.3절) | "영하 18도의 지상에서 절반 남짓" | "1월 평균 영하 22도의 지상에서 절반 남짓(50~60%)" | 11장 4.1절: 리튬 전지 영하 20도에서 용량 약 50~60% |

## 2. 날짜 맞춤과 겨울 B안 바꿈 (파일:줄, 옛 값, 새 값, 까닭)

"까닭"의 `retime(#n)`은 11장 3.3절 표의 행 번호, `B안 파생 재계산(Bn)`은 1절의 산식이다. 11장 3.3절 표의 02장 행(16, 17)은 도감 과제가 맡으므로 하지 않았다. 바이블 행(1~4)은 이 과제의 범위(바이블 장) 밖이라 하지 않았다(4절).

| 파일:줄 | 옛 값 | 새 값 | 까닭 |
|---|---|---|---|
| docs/design/v3/01-core.md:76 | 1절 1행(2126년, 대정전 뒤 약 백 년) | 1절 1행(2126년, 대정전 약 2046년 뒤 약 여든 해) | retime(11장 3.3절 #5) |
| docs/design/v3/01-core.md:76 | 3절 "약 2026" 행. | 3절 "약 2046" 행. 수치는 11장 2.5절 B안(소유자 결정 2026-11-13)을 따른다. | retime(11장 3.3절 #5) + B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/01-core.en.md:76 | row 1 (2126, about a hundred years after the Great Blackout) | row 1 (2126, about eighty years after the Great Blackout of about 2046) | retime(11장 3.3절 #5) |
| docs/design/v3/01-core.en.md:76 | section 3 row "c. 2026". | section 3 row "c. 2046". The figures follow option B of chapter 11, 2.5 (owner decision 2026-11-13). | retime(11장 3.3절 #5) + B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/01-core.md:82 | 지상의 연평균 기온은 영하 18도다. 해가 긴 철에도 평균 영하 11도, 해가 짧은 철에는 평균 영하 25도이고, 눈보라 치는 밤에는 영하 38도까지 내려간다. 백 년 동안 지상 기온이 영하 3도를 넘은 날은 없다 | 지상의 연평균 기온은 영하 9도다. 낮이 긴 때에도 평균 영하 6도, 밤이 긴 때에는 평균 영하 13도다. 가장 따뜻한 8월이 평균 영하 4도, 가장 추운 1월이 평균 영하 22도이고, 눈보라 치는 밤에는 영하 35도까지 내려간다. 여든 해 동안 낮 기온이 영상으로 오른 날은 한 해 열흘 안쪽이고, 쌓인 눈은 녹지 않는다 | B안(11장 2.5절, 소유자 결정 2026-11-13) + retime(11장 3.3절 #6) + 용어 30 |
| docs/design/v3/01-core.en.md:82 | The surface annual mean is minus 18 °C. The long-light half averages minus 11 °C, the long-dark half minus 25 °C, and blizzard nights reach minus 38 °C. In a hundred years the surface air has never risen above minus 3 °C | The surface annual mean is minus 9 °C. The long-daylight half averages minus 6 °C and the short-daylight half minus 13 °C. The warmest month, August, averages minus 4 °C and the coldest, January, minus 22 °C, and blizzard nights reach minus 35 °C. In eighty years the daytime air has risen above zero on fewer than ten days a year, and the lying snow never melts | B안(11장 2.5절, 소유자 결정 2026-11-13) + retime(11장 3.3절 #6) + 용어 30 |
| docs/design/v3/01-core.md:84 | 땅 표면은 공기보다 따뜻한 영하 10도 안팎 | 땅 표면은 공기보다 따뜻한 영하 8도 안팎 | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.md:84 | 약 35미터 깊이까지 얼어 있고 | 약 33미터 깊이까지 얼어 있고 | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.md:84 | 동결선)는 2036년 약 10미터, 2066년 약 22미터였고, 지금은 한 해에 17센티미터쯤 | 동결선)는 2056년 약 12미터, 2086년 약 23미터였고, 지금은 한 해에 21센티미터쯤 | retime(11장 3.3절 #7) + B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.en.md:84 | ground surface at about minus 10 °C | ground surface at about minus 8 °C | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.en.md:84 | frozen to about 35 metres | frozen to about 33 metres | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.en.md:84 | about 10 metres in 2036 and about 22 metres in 2066, and now moves down about 17 centimetres | about 12 metres in 2056 and about 23 metres in 2086, and now moves down about 21 centimetres | retime(11장 3.3절 #7) + B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.md:90 | 연평균 -18도(긴 낮 철 -11도, 긴 밤 철 -25도, 눈보라 밤 -38도) | 연평균 -9도(낮이 긴 때 -6도, 밤이 긴 때 -13도, 1월 -22도, 눈보라 밤 -35도) | B안(11장 2.5절, 소유자 결정 2026-11-13) + 용어 30 |
| docs/design/v3/01-core.en.md:90 | annual mean -18 °C (long-light half -11 °C, long-dark half -25 °C, blizzard night -38 °C) | annual mean -9 °C (long-daylight half -6 °C, short-daylight half -13 °C, January -22 °C, blizzard night -35 °C) | B안(11장 2.5절, 소유자 결정 2026-11-13) + 용어 30 |
| docs/design/v3/01-core.md:91 | \| 지하 3~8 m \| -10~-7도 \| | \| 지하 3~8 m \| -7~-6도 \| | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.en.md:91 | \| 3-8 m below ground \| -10 to -7 °C \| | \| 3-8 m below ground \| -7 to -6 °C \| | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.md:92 | \| 지하 8~25 m \| -7~-4도 \| | \| 지하 8~25 m \| -6~-2도 \| | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.en.md:92 | \| 8-25 m below ground \| -7 to -4 °C \| | \| 8-25 m below ground \| -6 to -2 °C \| | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.md:93 | -3~4도(동결선 35 m 아래는 늘 영상) | -2~5도(동결선 33 m 아래는 늘 영상) | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.en.md:93 | -3 to 4 °C (always above zero below the 35 m frozen-ground line) | -2 to 5 °C (always above zero below the 33 m frozen-ground line) | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.md:101 | 해는 있다. 다만 하늘 높이 낀 엷은 막 때문에 지상에 닿는 빛은 대정전 전의 4분의 1쯤이다. 맑은 날 한낮이 옛날의 흐린 날만 하다. 해가 흰 원반으로 또렷이 보이는 날은 여드레에 하루꼴이고, 밤에는 별이 거의 보이지 않는다 | 해는 있다. 다만 하늘 높이 엷은 막이 끼어, 맑은 날 지상에 닿는 빛은 대정전 전의 약 80%다. 곧장 내리쬐는 빛은 약 60%로 줄고 나머지는 하늘에 흩어져 온다. 그래서 하늘은 늘 회백색이고, 해는 흐린 흰 원반으로 보이며, 그림자는 옅다. 밤에는 별이 거의 보이지 않는다 | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/01-core.en.md:101 | There is a sun. But a thin veil high in the sky lets only about a quarter of the pre-Blackout light reach the ground. A clear noon is like an overcast day of the old world. The sun shows as a clear white disc about one day in eight, and at night almost no stars are seen | There is a sun. But a thin veil sits high in the sky, so on a clear day the light reaching the ground is about 80% of the pre-Blackout light. Direct sunlight is cut to about 60% and the rest arrives scattered across the sky. So the sky is always a greyish white, the sun shows as a dim white disc, and shadows are faint. At night almost no stars are seen | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/01-core.md:103 | 따뜻해지는 철은 오지 않지만 빛의 철은 돌아온다. 사람들은 해가 긴 반년을 **긴 낮 철**, 짧은 반년을 **긴 밤 철**이라 부른다. | 따뜻해지는 때는 오지 않지만 빛의 길고 짧음은 돌아온다. 사람들은 해가 긴 반년을 **낮이 긴 때**, 짧은 반년을 **밤이 긴 때**라 부른다. | 용어 30 |
| docs/design/v3/01-core.en.md:103 | The warm season never comes back, but the season of light does. People call the half-year of long days the **long-light half** and the half-year of short days the **long-dark half**. | The warm season never comes back, but the cycle of light does. People call the half-year of long days the **long-daylight half** and the half-year of short days the **short-daylight half**. | 용어 30 |
| docs/design/v3/01-core.md:109 | 한 해 200밀리미터쯤으로, 대정전 전 강수량의 7분의 1이다 | 한 해 350밀리미터쯤으로, 대정전 전 강수량의 4분의 1이다 | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/01-core.md:109 | 남는 눈이 백 년 동안 다져져, 탁 트인 평지에는 6~8미터 두께의 | 남는 눈이 여든 해 동안 다져져, 탁 트인 평지에는 7~9미터 두께의 | retime(11장 3.3절 #8) + B안 파생 재계산(로그 2절 산식 B2) |
| docs/design/v3/01-core.md:109 | 10미터가 넘게 몰려 쌓였고 | 12미터가 넘게 몰려 쌓였고 | B안 파생 재계산(로그 2절 산식 B2) |
| docs/design/v3/01-core.md:109 | 대부분의 건물은 2층까지 묻혔다 | 대부분의 건물은 2~3층까지 묻혔다 | B안 파생 재계산(로그 2절 산식 B2) |
| docs/design/v3/01-core.en.md:109 | about 200 millimetres of water a year, one seventh of the pre-Blackout precipitation | about 350 millimetres of water a year, a quarter of the pre-Blackout precipitation | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/01-core.en.md:109 | packed down over a hundred years into a hard snow layer 6 to 8 metres thick | packed down over eighty years into a hard snow layer 7 to 9 metres thick | retime(11장 3.3절 #8) + B안 파생 재계산(로그 2절 산식 B2) |
| docs/design/v3/01-core.en.md:109 | drifted to more than 10 metres | drifted to more than 12 metres | B안 파생 재계산(로그 2절 산식 B2) |
| docs/design/v3/01-core.en.md:109 | buried up to the second floor | buried up to the second or third floor | B안 파생 재계산(로그 2절 산식 B2) |
| docs/design/v3/01-core.md:127 | 2032년 무렵 살아남은 사람 수가 역들의 수용력에 닿자 | 2052년 무렵 살아남은 사람 수가 역들의 수용력에 닿자 | retime(11장 3.3절 #9) |
| docs/design/v3/01-core.en.md:127 | Around 2032, when the number of survivors | Around 2052, when the number of survivors | retime(11장 3.3절 #9) |
| docs/design/v3/01-core.md:128 | 동결선이 백 년에 걸쳐 35미터까지 | 동결선이 여든 해에 걸쳐 33미터까지 | retime(11장 3.3절 #8) + B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.en.md:128 | came down to 35 metres over a century | came down to 33 metres over eighty years | retime(11장 3.3절 #8) + B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.md:131 | 식량은 2030년 무렵 바닥났다. 2030년대 초부터 | 식량은 2050년 무렵 바닥났다. 2049~2052년부터 | retime(11장 3.3절 #10) |
| docs/design/v3/01-core.en.md:131 | ran out around 2030. Mushroom cellars, fibre-sugar vats and light-fields went up from the early 2030s | ran out around 2050. Mushroom cellars, fibre-sugar vats and light-fields went up from 2049-2052 | retime(11장 3.3절 #10) |
| docs/design/v3/01-core.md:172 | 대합실 60 W, 승강장 40 W, 깊은 터널 10 W | 대합실 50 W, 승강장 36 W, 깊은 터널 9 W | B안 파생 재계산(로그 2절 산식 B3) |
| docs/design/v3/01-core.en.md:172 | concourse 60 W, platform 40 W, deep tunnel 10 W | concourse 50 W, platform 36 W, deep tunnel 9 W | B안 파생 재계산(로그 2절 산식 B3) |
| docs/design/v3/01-core.md:173 | 눈을 녹여 쓰면 1인당 45 W를 열에 더 얹는다 | 눈을 녹여 쓰면 1인당 43 W를 열에 더 얹는다 | B안 파생 재계산(로그 2절 산식 B4) |
| docs/design/v3/01-core.en.md:173 | Melting snow adds 45 W per person | Melting snow adds 43 W per person | B안 파생 재계산(로그 2절 산식 B4) |
| docs/design/v3/01-core.md:176 | (잠정 T02-24)  | (잠정 T02-24. 열 계수와 눈 녹이는 열은 11장 2.5절 B안의 기온과 땅속 온도로 다시 셈했다.)  | B안 파생 재계산(로그 2절 산식 B3, B4) |
| docs/design/v3/01-core.en.md:176 | (provisional T02-24)  | (provisional T02-24. The heat coefficients and the snow-melting heat were recomputed from the air and ground temperatures of option B, chapter 11, 2.5.)  | B안 파생 재계산(로그 2절 산식 B3, B4) |
| docs/design/v3/01-core.md:193 | 승강장 층에 3,000명을 들이면 120 kW가 들고 | 승강장 층에 3,000명을 들이면 108 kW가 들고 | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.md:194 | 승강장 열 40 W에 눈 녹이는 열 45 W, 모두 85 W가 든다. 남은 20 kW로 약 235명을 더 들인다. | 승강장 열 36 W에 눈 녹이는 열 43 W, 모두 79 W가 든다. 남은 33 kW로 약 418명을 더 들인다. | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.md:195 | - 결과: 약 **4,200명**. | - 결과: 약 **4,400명**. | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.en.md:193 | on the platform layer uses 120 kW | on the platform layer uses 108 kW | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.en.md:194 | needs 40 W of platform heat plus 45 W for melting snow, 85 W in all. The remaining 20 kW adds about 235 people. | needs 36 W of platform heat plus 43 W for melting snow, 79 W in all. The remaining 33 kW adds about 418 people. | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.en.md:195 | - Result: about **4,200 people**. | - Result: about **4,400 people**. | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.md:201 | - 계산: 공간 2,250명, 열 2,500명, | - 계산: 공간 2,250명, 열 2,780명, | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.en.md:201 | - Working: space 2,250 people, heat 2,500, | - Working: space 2,250 people, heat 2,780, | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.md:211 | 123 kW를 40 W로 나누면 약 3,080명이다. | 123 kW를 36 W로 나누면 약 3,420명이다. | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.md:212 | - 결과: 약 **3,100명**. | - 결과: 약 **3,400명**. | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.md:212 | 사람 한 명의 승강장 난방 몫(40 W)과 같다 | 사람 한 명의 승강장 난방 몫(36 W)과 거의 같다 | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.md:212 | 약 360명을 더 들일 수 있다 | 약 400명을 더 들일 수 있다 | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.en.md:211 | 123 kW divided by 40 W is about 3,080 people. | 123 kW divided by 36 W is about 3,420 people. | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.en.md:212 | - Result: about **3,100 people**. | - Result: about **3,400 people**. | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.en.md:212 | equals one person's platform heating share (40 W) | is about one person's platform heating share (36 W) | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.en.md:212 | about 360 more people | about 400 more people | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/01-core.md:219 | \| 환승역 \| 두 노선, 출구 5곳 이상 \| 1,500~3,200명 \| | \| 환승역 \| 두 노선, 출구 5곳 이상 \| 1,500~3,500명 \| | B안 파생 재계산(로그 2절 산식 B6) |
| docs/design/v3/01-core.en.md:219 | \| Interchange \| two lines, 5 or more exits \| 1,500-3,200 \| | \| Interchange \| two lines, 5 or more exits \| 1,500-3,500 \| | B안 파생 재계산(로그 2절 산식 B6) |
| docs/design/v3/01-core.md:224 | 서울 전체 약 30만으로 둔다. | 서울 전체 약 30만으로 둔다. B안에서 열이 막는 역의 한도는 약 10% 풀렸지만 많은 역은 공기·공간·물이 먼저 막고 먹을 것은 세력의 한도(5.3절)이므로 이 총계는 그대로 둔다. | B안 파생 재계산(로그 2절 산식 B6) |
| docs/design/v3/01-core.en.md:224 | about 300,000 for all of Seoul. | about 300,000 for all of Seoul. Under option B the limit of heat-bound stations eased by about 10%, but many stations are bound first by air, space or water, and food is a faction limit (5.3), so these totals stand. | B안 파생 재계산(로그 2절 산식 B6) |
| docs/design/v3/01-core.md:242 | \| 햇빛 \| 판은 눈에 묻히고 빛은 4분의 1이다 \| 거의 쓰지 않는다. 햇빛은 빛밭(5.3절)의 몫이다 \| 해당 없음 \| | \| 햇빛 \| 빛은 대정전 전의 약 80%지만, 판은 눈에 묻히고 여든 해 동안 출력의 3분의 1을 잃었으며 새 판은 만들지 못한다(11장 4.1절) \| 눈 위로 건져 세운 옛 판이 조금 있을 뿐이다(03장 2.1절 "그 밖"). 햇빛은 주로 온실(5.3절)의 몫이다 \| 눈과 서리가 덮고 틀이 부서진다 \| | B안(11장 2.5절, 소유자 결정 2026-11-13) + 용어 3 |
| docs/design/v3/01-core.en.md:242 | \| Sunlight \| Panels are buried in snow and the light is a quarter \| Hardly used. Sunlight belongs to the light-fields (5.3) \| Not applicable \| | \| Sunlight \| The light is about 80% of the pre-Blackout level, but panels are buried in snow, have lost a third of their output over eighty years, and no new ones can be made (chapter 11, 4.1) \| Only a few old panels dug out and set up on the snow (chapter 03, 2.1, "other"). Sunlight belongs mainly to the greenhouses (5.3) \| Snow and frost cover them; frames break \| | B안(11장 2.5절, 소유자 결정 2026-11-13) + 용어 3 |
| docs/design/v3/01-core.md:244 | 사는 곳을 데우는 바깥 열은 약 12 MW, | 사는 곳을 데우는 바깥 열은 약 11 MW, | B안 파생 재계산(로그 2절 산식 B7) |
| docs/design/v3/01-core.md:244 | 열은 합해 약 16 MW다. | 열은 합해 약 15 MW다. | B안 파생 재계산(로그 2절 산식 B7) |
| docs/design/v3/01-core.en.md:244 | with about 12 MW of outside heat | with about 11 MW of outside heat | B안 파생 재계산(로그 2절 산식 B7) |
| docs/design/v3/01-core.en.md:244 | about 16 MW of heat in all | about 15 MW of heat in all | B안 파생 재계산(로그 2절 산식 B7) |
| docs/design/v3/01-core.md:251 | 동결선(35 m) 아래 땅속 물 | 동결선(33 m) 아래 땅속 물 | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.en.md:251 | below the frozen-ground line (35 m) | below the frozen-ground line (33 m) | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/01-core.md:261 | 4분의 1밖에 안 되는 햇빛과 영하 18도의 지상에서는 온실을 넓게 데울 수도 없다. | 햇빛은 대정전 전의 약 80%이지만 지상은 연평균 영하 9도이고, 온실 지붕으로 쓸 투명한 판은 건져 온 것뿐이라 온실을 끝없이 넓힐 수도 없다. | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/01-core.en.md:261 | and with a quarter of the sunlight and minus 18 °C at the surface, greenhouses cannot be heated over wide areas either. | and although the sunlight is about 80% of the old level, the surface averages minus 9 °C and the only clear roofing is what can be salvaged, so greenhouses cannot be spread without limit either. | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/01-core.md:266 | 열량의 약 12%. 1인당 약 90 m² \| | 열량의 약 12%. 1인당 약 45 m² \| | B안 파생 재계산(로그 2절 산식 B8) |
| docs/design/v3/01-core.en.md:266 | About 12% of the calories. About 90 m² per person \| | About 12% of the calories. About 45 m² per person \| | B안 파생 재계산(로그 2절 산식 B8) |
| docs/design/v3/01-core.md:273 | 그래도 모자라는 몫(긴 밤 철 평균 1 m²당 약 1 W)은 역 사람들의 몸에서 나와 환기로 빠져나가는 열(1인당 약 90 W)을 빛밭으로 돌려 메운다. 사람 하나의 날숨 열이 빛밭 90 m²를 지키는 셈이라, 빛밭은 4.1절과 5.1절의 열 예산을 더 쓰지 않는다. 서울 전체로는 빛밭이 약 27 km², 서울 면적의 4.5%다. 수확은 옛 밭의 3분의 1쯤인 1 m²에 한 해 약 1,250 kcal다. 1인당 90 m²이면 하루 약 310 kcal, 열량의 약 12%다. | 그래도 모자라는 몫(밤이 긴 때 평균 1 m²당 약 0.5 W)은 역 사람들의 몸에서 나와 환기로 빠져나가는 열(1인당 약 90 W)을 빛밭으로 돌려 메운다. 사람 하나의 날숨 열이 빛밭 45 m²를 지키고도 남으므로, 빛밭은 4.1절과 5.1절의 열 예산을 더 쓰지 않는다. 서울 전체로는 빛밭이 약 13.5 km², 서울 면적의 2.2%다. 수확은 옛 밭의 3분의 2쯤인 1 m²에 한 해 약 2,500 kcal다. 1인당 45 m²이면 하루 약 310 kcal, 열량의 약 12%다. 빛이 넉넉해져 같은 넓이에서 더 거두지만 빛밭을 더 넓히지는 않는다. 지붕감이 모자라고, 지상에 불빛과 열을 드러내지 말라는 금기가 있기 때문이다. | B안 파생 재계산(로그 2절 산식 B8) + 용어 30 |
| docs/design/v3/01-core.en.md:273 | The remaining shortfall (about 1 W per m² on average in the long-dark half) is made up by turning into the light-fields the heat that leaves the station people's bodies with the ventilation air (about 90 W per person). One person's breath heat keeps 90 m² of light-field from freezing, so light-fields take nothing more from the heat budgets of 4.1 and 5.1. Across Seoul, light-fields cover about 27 km², 4.5% of Seoul's area. The harvest is about a third of an old field, about 1,250 kcal per m² a year. At 90 m² a person that is about 310 kcal a day, about 12% of the calories. | The remaining shortfall (about 0.5 W per m² on average in the short-daylight half) is made up by turning into the light-fields the heat that leaves the station people's bodies with the ventilation air (about 90 W per person). One person's breath heat keeps 45 m² of light-field from freezing with heat to spare, so light-fields take nothing more from the heat budgets of 4.1 and 5.1. Across Seoul, light-fields cover about 13.5 km², 2.2% of Seoul's area. The harvest is about two thirds of an old field, about 2,500 kcal per m² a year. At 45 m² a person that is about 310 kcal a day, about 12% of the calories. With more light the same area yields more, but the light-fields are not widened: roofing is short, and there is a taboo against showing light and heat on the surface. | B안 파생 재계산(로그 2절 산식 B8) + 용어 30 |
| docs/design/v3/01-core.md:271 | \| 고물 \| 대정전 전 식량은 2030년 무렵 바닥났다. | \| 고물 \| 대정전 전 식량은 2050년 무렵 바닥났다. | retime(11장 3.3절 #11) |
| docs/design/v3/01-core.en.md:271 | \| Salvage \| Pre-Blackout food ran out around 2030. | \| Salvage \| Pre-Blackout food ran out around 2050. | retime(11장 3.3절 #11) |
| docs/design/v3/01-core.md:483 | ## 9. 십 년 단위 연표 2026~2126 | ## 9. 십 년 단위 연표 2046~2126 | retime(11장 3.3절 #12) |
| docs/design/v3/01-core.en.md:483 | ## 9. Decade chronology 2026-2126 | ## 9. Decade chronology 2046-2126 | retime(11장 3.3절 #12) |
| docs/design/v3/01-core.md:491 | \| 약 2026 \| 대정전. 최초의 AI가 겨울을 내렸다("백 년쯤 전"). 정확한 날짜는 정하지 않았다(Q2). \| [승인] \| | \| 약 2046 \| 대정전. 최초의 AI가 겨울을 내렸다. 정확한 날짜는 정하지 않았다(Q2). 옛 값 "약 2026"("백 년쯤 전")은 2026-11-13 소유자 결정(바이블 9.4절)으로 대체됐다. \| [승인] \| | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.en.md:491 | \| c. 2026 \| The Great Blackout. The First AI brought down the winter ("about a hundred years ago"). The exact date is not set (Q2). \| [Approved] \| | \| c. 2046 \| The Great Blackout. The First AI brought down the winter. The exact date is not set (Q2). The old value "c. 2026" ("about a hundred years ago") was replaced by the owner decision of 2026-11-13 (Bible 9.4). \| [Approved] \| | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.md:492 | \| 2026~2035 \| 사람들이 역으로 내려간다. 첫 여섯 겨울 동안 해마다 더 추워진다. 얼어붙은 옛 창고의 식량은 2030년 무렵 바닥나고, 2030년대 초 첫 버섯 굴, 섬유당 통, 빛밭이 선다. 역마다 지도자를 손을 들어 뽑았고, 그 자리는 한 세대 안에 대물림이 됐다. 2032년 무렵 살아남은 사람 수가 역의 수용력에 닿고, 겨울이 더 심해지지 않는다 \| 잠정 T02-81 \| | \| 2046~2052 \| 사람들이 역으로 내려간다. 첫 여섯 겨울 동안 해마다 더 추워진다. 얼어붙은 옛 창고의 식량은 2050년 무렵 바닥나고, 2049~2052년에 첫 버섯 굴, 섬유당 통, 빛밭이 선다. 역마다 지도자를 손을 들어 뽑았다. 2052년 무렵 살아남은 사람 수가 역의 수용력에 닿고, 겨울이 더 심해지지 않는다. 서울 인구는 약 850만 명에서 약 35만 명으로 준다 \| 잠정 T02-81, T33-17 \| | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.en.md:492 | \| 2026-2035 \| People go down into the stations. Each of the first six winters is colder than the last. The food of the frozen old warehouses runs out around 2030, and the first mushroom cellars, fibre-sugar vats and light-fields go up in the early 2030s. Each station chose a leader by show of hands, and within a generation the post became hereditary. Around 2032 the number of survivors reaches station capacity and the winter gets no worse \| provisional T02-81 \| | \| 2046-2052 \| People go down into the stations. Each of the first six winters is colder than the last. The food of the frozen old warehouses runs out around 2050, and the first mushroom cellars, fibre-sugar vats and light-fields go up in 2049-2052. Each station chose a leader by show of hands. Around 2052 the number of survivors reaches station capacity and the winter gets no worse. Seoul's population falls from about 8.5 million to about 350,000 \| provisional T02-81, T33-17 \| | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.md:493 | \| 2036~2045 \| 강 북쪽 역들이 광화문 청사를 중심으로 장부를 하나로 묶는다. 의석을 구마다 하나로 줄이고, 구마다 국회의원이 공작령을 쥐며, 열네 국회의원이 첫 종신 대통령을 추대한다. 강 남쪽은 장부 밖이 된다 \| 잠정 T02-82 \| | \| 2053~2059 \| 강 북쪽 역들이 광화문 청사를 중심으로 장부를 하나로 묶는다. 의석을 구마다 하나로 줄이고, 구마다 국회의원이 공작령을 쥐며, 열네 국회의원이 첫 종신 대통령을 추대한다(2058년 무렵). 강 남쪽은 장부 밖이 된다. 지도자 자리가 대물림되기 시작한다 \| 잠정 T02-82, T33-18 \| | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.en.md:493 | \| 2036-2045 \| The stations north of the river bind their ledgers into one around the Gwanghwamun complex. Seats are cut to one per district, each district's Assembly Member holds its duchy, and the fourteen Assembly Members acclaim the first President for Life. The south of the river becomes off the ledger \| provisional T02-82 \| | \| 2053-2059 \| The stations north of the river bind their ledgers into one around the Gwanghwamun complex. Seats are cut to one per district, each district's Assembly Member holds its duchy, and the fourteen Assembly Members acclaim the first President for Life (around 2058). The south of the river becomes off the ledger. Leaders' posts begin to pass by inheritance \| provisional T02-82, T33-18 \| | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.md:494 | \| 2046~2055 \| 땔감의 시대가 가장 뜨겁다. 북한산, 도봉산, 관악산의 죽은 숲을 땔감과 섬유당 원료로 벤다. | \| 2053~2062 \| 땔감의 시대. 첫 겨울들에 죽은 북한산, 도봉산, 관악산의 숲을 땔감과 섬유당 원료로 벤다. | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.md:494 | 구마다 도시로 굳는다 \| 잠정 T02-83 \| | 구마다 도시로 굳는다 \| 잠정 T02-83, T33-19 \| | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.en.md:494 | \| 2046-2055 \| The age of firewood is at its height. The dead forests of Bukhansan | \| 2053-2062 \| The age of firewood. The forests of Bukhansan | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.en.md:494 | harden into one city per district \| provisional T02-83 \| | harden into one city per district (the forests died in the first winters) \| provisional T02-83, T33-19 \| | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.md:495 | \| 2056~2065 \| 2060년대에 가까운 산의 숲이 바닥난다. | \| 2060~2065 \| 가까운 산의 숲이 바닥난다. | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.md:495 | 관악의 우두머리 집안이 공작을 칭한다 \| 잠정 T02-84 \| | 관악의 우두머리 집안이 공작을 칭한다. 대정전 뒤에 태어난 첫 세대가 어른이 된다 \| 잠정 T02-84, T33-20 \| | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.en.md:495 | \| 2056-2065 \| In the 2060s the forests of the near mountains run out. | \| 2060-2065 \| The forests of the near mountains run out. | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.en.md:495 | Gwanak's leading house takes the title Duke \| provisional T02-84 \| | Gwanak's leading house takes the title Duke. The first generation born after the Great Blackout comes of age \| provisional T02-84, T33-20 \| | retime(11장 3.3절 #13) |
| docs/design/v3/01-core.md:534 | \| 약 2026년, 날짜 없음(바이블 3절, Q2) \| | \| 약 2046년, 날짜 없음(바이블 3절, Q2) \| | retime(11장 3.3절 #14) |
| docs/design/v3/01-core.en.md:534 | \| About 2026, no date (Bible section 3, Q2) \| | \| About 2046, no date (Bible section 3, Q2) \| | retime(11장 3.3절 #14) |
| docs/design/v3/03-technology.md:10 | 바깥 열 약 12 MW, 섬유당 통과 부엌 열 약 4 MW, 열 합계 약 16 MW(01-core 5.1절) | 바깥 열 약 11 MW, 섬유당 통과 부엌 열 약 4 MW, 열 합계 약 15 MW(01-core 5.1절, B안) | B안 파생 재계산(로그 2절 산식 B7) |
| docs/design/v3/03-technology.en.md:10 | outside heat of about 12 MW, about 4 MW of heat for fibre-sugar vats and kitchens, about 16 MW of heat in total (01-core 5.1) | outside heat of about 11 MW, about 4 MW of heat for fibre-sugar vats and kitchens, about 15 MW of heat in total (01-core 5.1, option B) | B안 파생 재계산(로그 2절 산식 B7) |
| docs/design/v3/03-technology.md:66 | 고물 태우기가 약 6 MW를 더해 약 16 MW가 된다. 01-core 5.1절의 바깥 열 약 12 MW와 | 고물 태우기가 약 5 MW를 더해 약 15 MW가 된다. 01-core 5.1절의 바깥 열 약 11 MW와 | B안 파생 재계산(로그 2절 산식 B7) |
| docs/design/v3/03-technology.en.md:66 | junk burning add about 6 MW, for about 16 MW. That equals the sum in 01-core 5.1 of about 12 MW | junk burning add about 5 MW, for about 15 MW. That equals the sum in 01-core 5.1 of about 11 MW | B안 파생 재계산(로그 2절 산식 B7) |
| docs/design/v3/03-technology.md:549 | (전기 5 MW, 열 16 MW) | (전기 5 MW, 열 15 MW) | B안 파생 재계산(로그 2절 산식 B7) |
| docs/design/v3/03-technology.en.md:548 | (5 MW of electricity, 16 MW of heat) | (5 MW of electricity, 15 MW of heat) | B안 파생 재계산(로그 2절 산식 B7) |
| docs/design/v3/03-technology.md:75 | 영하 18도의 지상에서 전지는 따뜻할 때 담은 힘의 절반 남짓만 내놓는다. | 1월 평균 영하 22도의 지상에서 전지는 따뜻할 때 담은 힘의 절반 남짓(50~60%)만 내놓는다. | B안(11장 2.5절, 소유자 결정 2026-11-13) + 11장 4.1절 전지 값 |
| docs/design/v3/03-technology.en.md:75 | At minus 18 degrees on the surface a battery gives back little more than half | At the January surface mean of minus 22 degrees a battery gives back little more than half (50-60%) | B안(11장 2.5절, 소유자 결정 2026-11-13) + 11장 4.1절 전지 값 |
| docs/design/v3/03-technology.md:245 | 01-core 3.1절(대합실 찬 창고 -10~-7도) | 01-core 3.1절(대합실 찬 창고 -7~-6도) | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/03-technology.en.md:245 | 01-core 3.1 (concourse cold store at -10 to -7 degrees) | 01-core 3.1 (concourse cold store at -7 to -6 degrees) | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/03-technology.md:269 | 대합실 층의 찬 창고(-10~-7도, 01-core 3.1절) | 대합실 층의 찬 창고(-7~-6도, 01-core 3.1절) | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/03-technology.en.md:269 | cold stores of the concourse layer (-10 to -7 degrees, 01-core 3.1) | cold stores of the concourse layer (-7 to -6 degrees, 01-core 3.1) | B안 파생 재계산(로그 2절 산식 B1) |
| docs/design/v3/03-technology.md:296 | 01-core 3.2절(빛 4분의 1) | 01-core 3.2절(빛 약 80%, 흐린 회백색 하늘) | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/03-technology.en.md:296 | 01-core 3.2 (a quarter of the light) | 01-core 3.2 (about 80% of the light, a dim greyish-white sky) | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/03-technology.md:96 | 기계의 수는 2040년의 약 15분의 1 | 기계의 수는 2046년의 약 9분의 1 | retime(11장 3.3절 #19) |
| docs/design/v3/03-technology.en.md:96 | about one fifteenth of the 2040 number | about one ninth of the 2046 number | retime(11장 3.3절 #19) |
| docs/design/v3/03-technology.md:254 | \| 약 2,200정 \| 2030~2040년대 강 남서쪽 | \| 약 2,200정 \| 2046~2060년대 강 남서쪽 | retime(11장 3.3절 #20) |
| docs/design/v3/03-technology.en.md:254 | police weapons south-west of the river in the 2030s and 2040s | police weapons south-west of the river from 2046 into the 2060s | retime(11장 3.3절 #20) |
| docs/design/v3/03-technology.md:340 | 추위가 상하는 것을 늦췄지만 2060년대에는 | 추위가 상하는 것을 늦췄지만 2070년대에는 | retime(11장 3.3절 #22) |
| docs/design/v3/03-technology.en.md:340 | by the 2060s most remaining fuel | by the 2070s most remaining fuel | retime(11장 3.3절 #22) |
| docs/design/v3/03-technology.md:340 | 6~8미터 눈 위에 | 7~9미터 눈 위에 | B안 파생 재계산(로그 2절 산식 B2) |
| docs/design/v3/03-technology.en.md:340 | 6 to 8 metres of snow | 7 to 9 metres of snow | B안 파생 재계산(로그 2절 산식 B2) |
| docs/design/v3/03-technology.md:201 | 역 인구 약 3,100명의 29%다 | 역 인구 약 3,400명의 약 26%다 | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/03-technology.en.md:201 | 29% of its roughly 3,100 people | about 26% of its roughly 3,400 people | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/03-technology.md:332 | 승강장 1인당 40 W | 승강장 1인당 36 W | B안 파생 재계산(로그 2절 산식 B3) |
| docs/design/v3/03-technology.en.md:332 | 40 W per person on the platform | 36 W per person on the platform | B안 파생 재계산(로그 2절 산식 B3) |
| docs/design/v3/03-technology.md:460 | 승강장 열 40 W | 승강장 열 36 W | B안 파생 재계산(로그 2절 산식 B3) |
| docs/design/v3/03-technology.en.md:460 | 40 W of platform heat | 36 W of platform heat | B안 파생 재계산(로그 2절 산식 B3) |
| docs/design/v3/03-technology.en.md:265 | century-old rounds | eighty-year-old rounds | retime(11장 3.3절 #21) |
| docs/design/v3/04-government.md:317 | 01-core 3.1절(지상 -18도, | 01-core 3.1절(지상 -9도, | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/04-government.en.md:317 | 01-core 3.1 (surface -18 °C, | 01-core 3.1 (surface -9 °C, | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/05-free-city.md:104 | 그래서 2040년대부터 기지장은 | 그래서 2050년대부터 기지장은 | retime(11장 3.3절 #24) |
| docs/design/v3/05-free-city.en.md:104 | So since the 2040s the Depot Master | So since the 2050s the Depot Master | retime(11장 3.3절 #24) |
| docs/design/v3/05-free-city.md:141 | 2056~2065년 무 | 2060~2065년 무 | retime(11장 3.3절 #25) |
| docs/design/v3/05-free-city.en.md:141 | Around 2056-2065, Gwanak | Around 2060-2065, Gwanak | retime(11장 3.3절 #25) |
| docs/design/v3/05-free-city.md:559 | \| 9절 2056~2065행 | \| 9절 2060~2065행 | retime(11장 3.3절 #26) |
| docs/design/v3/05-free-city.en.md:559 | \| 9, row 2056-2065, | \| 9, row 2060-2065, | retime(11장 3.3절 #26) |
| docs/design/v3/05-free-city.md:112 | 지상의 방은 영하 18도라 쓰지 않고 | 지상의 방은 연평균 영하 9도라 쓰지 않고 | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/05-free-city.en.md:112 | The surface rooms are at -18 °C and are not used | The surface rooms average -9 °C and are not used | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/05-free-city.md:354 | 지상 연평균 -18도, 승강장 8~14도 | 지상 연평균 -9도, 승강장 8~14도 | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/05-free-city.en.md:354 | surface annual mean -18 °C, platforms 8-14 °C | surface annual mean -9 °C, platforms 8-14 °C | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/05-free-city.md:366 | \| 지상(-18도, 눈보라 밤 -38도) \| | \| 지상(-9도, 1월 -22도, 눈보라 밤 -35도) \| | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/05-free-city.en.md:366 | \| Surface (-18 °C; -38 °C on blizzard nights) \| | \| Surface (-9 °C; -22 °C in January; -35 °C on blizzard nights) \| | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/05-free-city.md:366 | 엷은 막 때문에 빛은 약하지만 눈 위의 반사는 여전히 눈을 다치게 한다 | 엷은 막 때문에 하늘은 흐리지만 빛은 대정전 전의 약 80%라 눈 위의 반사가 눈을 다치게 한다 | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/05-free-city.en.md:366 | The haze makes the light weak, but the glare off snow still hurts the eyes | The haze dims the sky, but the light is about 80% of the pre-Blackout level, so the glare off snow hurts the eyes | B안(11장 2.5절, 소유자 결정 2026-11-13) |
| docs/design/v3/06-arc.md:32 | 약 3,100명의 역이고 | 약 3,400명의 역이고 | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/06-arc.en.md:32 | about 3,100 people computed in 01-core 4.2 | about 3,400 people computed in 01-core 4.2 | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/06-arc.md:194 | 잠실은 900명, 역 인구의 29%로 | 잠실은 900명, 역 인구의 약 26%로 | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/06-arc.en.md:194 | at 900 or 29% of the station | at 900 or about 26% of the station | B안 파생 재계산(로그 2절 산식 B5) |
| docs/design/v3/07-people-and-war.md:1085 | 하나는 2036~2045년 강 북쪽이 | 하나는 2053~2059년 강 북쪽이 | retime(11장 3.3절 #27) |
| docs/design/v3/07-people-and-war.en.md:1085 | One is 2036-2045, when the north | One is 2053-2059, when the north | retime(11장 3.3절 #27) |
| docs/design/v3/07-people-and-war.md:1213 | 2032년 무렵 멈춘 뒤로 | 2052년 무렵 멈춘 뒤로 | retime(11장 3.3절 #28) |
| docs/design/v3/07-people-and-war.en.md:1213 | since it stopped around 2032 | since it stopped around 2052 | retime(11장 3.3절 #28) |
| docs/design/v3/08-document-map.md:30 | 01 3절·6.1~6.2절·9절(2026년 행) | 01 3절·6.1~6.2절·9절(2046년 행) | retime(11장 3.3절 #29) |
| docs/design/v3/08-document-map.en.md:30 | 01 3, 6.1-6.2 and 9 (the 2026 rows) | 01 3, 6.1-6.2 and 9 (the 2046 rows) | retime(11장 3.3절 #29) |
| docs/design/v3/08-document-map.md:34 | \| 2026~2126 십 년 단위 연표. | \| 2046~2126 십 년 단위 연표. | retime(11장 3.3절 #30) |
| docs/design/v3/08-document-map.md:34 | \| 백 년 연표 2026~2126 / Century Annals 2026-2126 \| | \| 서울 연표 2046~2126 / Seoul Annals 2046-2126 \| | retime(11장 3.3절 #30) |
| docs/design/v3/08-document-map.en.md:34 | The decade chronology 2026-2126: | The decade chronology 2046-2126: | retime(11장 3.3절 #30) |
| docs/design/v3/08-document-map.en.md:34 | \| 백 년 연표 2026~2126 / Century Annals 2026-2126 \| | \| 서울 연표 2046~2126 / Seoul Annals 2046-2126 \| | retime(11장 3.3절 #30) |
| docs/design/v3/01-core.md:86 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/01-core.md:115 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/01-core.md:123 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/01-core.md:275 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/01-core.md:324 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/03-technology.md:31 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/03-technology.md:96 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/03-technology.md:249 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/03-technology.md:265 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/03-technology.md:269 | 백 년을 | 여든 해를 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/03-technology.md:269 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/03-technology.md:318 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/03-technology.md:340 | 백 년을 | 여든 해를 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/04-government.md:25 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/04-government.md:395 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/08-document-map.md:30 | 백 년 | 여든 해 | "백 년" → "여든 해"(11장 3.3절 머리말, #8·16·18·23 등) |
| docs/design/v3/01-core.en.md:86 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/01-core.en.md:115 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/01-core.en.md:123 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/01-core.en.md:275 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/01-core.en.md:324 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/03-technology.en.md:96 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/03-technology.en.md:249 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/03-technology.en.md:269 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/03-technology.en.md:269 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/03-technology.en.md:318 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/03-technology.en.md:340 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/04-government.en.md:25 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/04-government.en.md:395 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/08-document-map.en.md:30 | a hundred years | eighty years | "a hundred years" → "eighty years"(11장 3.3절 머리말) |
| docs/design/v3/03-technology.en.md:31 | In the hundred years since | In the eighty years since | retime(11장 3.3절 #18) |

## 3. 용어 바꿈 (파일:줄, 옛 말, 새 말, 까닭)

"까닭"의 숫자는 `12a-terms.md` 2절의 행 번호다. 한국어 장에서는 바뀐 낱말 뒤의 조사(이/가, 을/를, 은/는, 과/와, 으로/로, 이라/라)를 새 낱말의 받침에 맞춰 함께 고쳤고, 옛 값과 새 값 칸에 그 조사까지 적었다. 영어 미러의 한국어 괄호 표기(예: "(곁집)")도 같은 규칙으로 바꿨다. 영어는 2절 English 열의 오른쪽을 썼다. 영어 관사 a/an은 바뀐 낱말에 맞춰 고쳤다(an inner-circle house, an implant technician 등 약 15곳, 표에 따로 적지 않음).

| 파일:줄 | 옛 값 | 새 값 | 까닭 |
|---|---|---|---|
| docs/design/v3/03-technology.md:472 | 장터의 값표는 킬로와트시(kWh)로 쓰고, 사람들은 줄여 "킬로"라 부른다. | 장터의 값표는 킬로와트시(kWh)로 쓴다. | 용어 6 |
| docs/design/v3/03-technology.en.md:472 | Market price boards are written in kilowatt-hours (kWh), which people shorten to "kilo". | Market price boards are written in kilowatt-hours (kWh). | 용어 6 |
| docs/design/v3/01-core.md:86 | 그래서 살아 있는 역마다 둘레에 녹은 땅이 주머니처럼 남아 있다. 이것을 **녹은 주머니**라 부른다. | 그래서 살아 있는 역마다 둘레에 **녹은 땅**이 남아 있다(설계 문서에서는 비동결층). | 용어 29 |
| docs/design/v3/01-core.md:144 | v3는 이것을 **겨울의 톱니**라는 모형으로 쓴다 | v3는 이것을 **래칫**(한쪽으로만 도는 톱니바퀴)이라는 모형으로 쓴다 | 용어 31 |
| docs/design/v3/01-core.en.md:86 | so every living station sits in a pocket of thawed ground. This is called the **thaw pocket**. | so every living station is surrounded by **unfrozen ground** (in design terms, a talik). | 용어 29 |
| docs/design/v3/01-core.en.md:144 | v3 writes this as a model called **the winter ratchet** | v3 writes this as a model called **the ratchet** (a toothed wheel that turns one way only) | 용어 31 |
| docs/design/v3/05-free-city.md:64 | 이것을 "도장을 묶는다"고 한다. 묶은 도시는 | 이것을 세습 결의라 한다. 세습을 결의한 도시는 | 용어 102 |
| docs/design/v3/05-free-city.md:64 | 묶인 집안 안에서도 | 세습하는 집안 안에서도 | 용어 102 |
| docs/design/v3/05-free-city.md:64 | "도장 묶은 집" | "세습한 집" | 용어 102 |
| docs/design/v3/05-free-city.md:119 | 이것을 보증판이라 한다. | 작업장마다 새긴 이 수를 보증 건수라 한다. | 용어 13 |
| docs/design/v3/05-free-city.md:119 | 구로역의 대주회에 모여 보증판을 읽는다 | 구로역의 대주회에 모여 그 판을 읽는다 | 용어 13 |
| docs/design/v3/05-free-city.md:76 | 보증판에 새긴 수 | 판에 새긴 보증 건수 | 용어 13 |
| docs/design/v3/05-free-city.md:260 | 구로 보증판에 수가 많은 대의 표는 | 구로에서 보증 건수가 많은 작업장의 표는 | 용어 13 |
| docs/design/v3/05-free-city.md:43 | 강서는 와트를 채운 철을 | 강서는 와트를 채운 반년을 | 용어 30 |
| docs/design/v3/05-free-city.en.md:64 | This is called "binding the seal". A city that binds the seal | This is called the hereditary resolution. A city that makes that resolution | 용어 102 |
| docs/design/v3/05-free-city.en.md:64 | "the house that bound the seal" | "the house that made its seat hereditary" | 용어 102 |
| docs/design/v3/05-free-city.en.md:119 | This is the surety board. | The count carved there is the number of guarantees. | 용어 13 |
| docs/design/v3/05-free-city.en.md:119 | read the surety board | read the board | 용어 13 |
| docs/design/v3/05-free-city.en.md:33 | count on the surety board | number of guarantees | 용어 13 |
| docs/design/v3/05-free-city.en.md:260 | with a high count on Guro's surety board | with a high number of guarantees in Guro | 용어 13 |
| docs/design/v3/06-arc.md:370 | 아크 사람은 **바침**이라 부른다 | 아크 사람은 **헌납**이라 부른다 | 용어 18 |
| docs/design/v3/06-arc.en.md:370 | Arc people call it **the giving** (바침) | Arc people call it **the contribution** (헌납) | 용어 18 |
| docs/design/v3/01-core.md:42 | 구간, 손, 몫 | 구간, 숙련공, 몫 | 용어 109 |
| docs/design/v3/01-core.md:324 | 서울 둘레의 띠를 | 서울 둘레의 봉쇄 지대를 | 용어 38 |
| docs/design/v3/01-core.md:328 | 2~10 km의 띠 | 2~10 km의 봉쇄 지대 | 용어 38 |
| docs/design/v3/01-core.md:328 | 비탈이 띠에 걸친다 | 비탈이 봉쇄 지대에 걸친다 | 용어 38 |
| docs/design/v3/01-core.md:329 | 띠 안에서 | 봉쇄 지대 안에서 | 용어 38 |
| docs/design/v3/01-core.md:329 | 띠를 가로지르는 | 봉쇄 지대를 가로지르는 | 용어 38 |
| docs/design/v3/03-technology.md:415 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/03-technology.md:450 | 보증받은 손 | 보증받은 숙련공 | 용어 109 |
| docs/design/v3/03-technology.md:473 | 보증받은 손 | 보증받은 숙련공 | 용어 109 |
| docs/design/v3/03-technology.md:517 | 작업대의 손 | 작업대의 숙련공 | 용어 109 |
| docs/design/v3/03-technology.md:450 | 그 손을 **보증 | 그 숙련공을 **보증 | 용어 109 |
| docs/design/v3/03-technology.md:215 | 한 철의 상처 | 반년의 상처 | 용어 30 |
| docs/design/v3/03-technology.md:474 | 한 철 동안 | 반년 동안 | 용어 30 |
| docs/design/v3/03-technology.md:312 | 띠 안에서 | 봉쇄 지대 안에서 | 용어 38 |
| docs/design/v3/05-free-city.md:501 | 손 | 숙련공 | 용어 109 |
| docs/design/v3/05-free-city.md:524 | 손 | 숙련공 | 용어 109 |
| docs/design/v3/05-free-city.md:534 | 손 | 숙련공 | 용어 109 |
| docs/design/v3/05-free-city.md:195 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/05-free-city.md:222 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/05-free-city.md:242 | 보증받은 손 | 보증받은 숙련공 | 용어 109 |
| docs/design/v3/05-free-city.md:254 | 보통 손 한 | 보통 숙련공 한 | 용어 109 |
| docs/design/v3/05-free-city.md:60 | 손 다섯에 | 숙련공 다섯에 | 용어 109 |
| docs/design/v3/05-free-city.md:204 | 전선대의 손 | 전선대의 숙련공 | 용어 109 |
| docs/design/v3/05-free-city.md:441 | 대의 손 | 대의 숙련공 | 용어 109 |
| docs/design/v3/05-free-city.md:372 | 손이 되면 | 숙련공이 되면 | 용어 109 |
| docs/design/v3/05-free-city.md:195 | 손으로 인정 | 숙련공으로 인정 | 용어 109 |
| docs/design/v3/05-free-city.md:225 | 손도 손이고 | 숙련공도 숙련공이고 | 용어 109 |
| docs/design/v3/05-free-city.md:227 | 일손은 손이 | 일꾼은 숙련공이 | 용어 109·110 |
| docs/design/v3/05-free-city.md:231 | 보증, 손, 몫 | 보증, 숙련공, 몫 | 용어 109 |
| docs/design/v3/05-free-city.md:538 | 손은 열여섯 살부터 | 숙련공은 열여섯 살부터 | 용어 109 |
| docs/design/v3/05-free-city.md:223 | \| 일손 \| | \| 일꾼 \| | 용어 110 |
| docs/design/v3/05-free-city.md:501 | 일손·살림 | 일꾼·살림 | 용어 110 |
| docs/design/v3/05-free-city.md:527 | 일손·살림 | 일꾼·살림 | 용어 110 |
| docs/design/v3/05-free-city.md:527 | \| 일손, 정부 장부 | \| 일꾼, 정부 장부 | 용어 110 |
| docs/design/v3/05-free-city.md:227 | 다만 일손을 받아 | 다만 일꾼을 받아 | 용어 110 |
| docs/design/v3/05-free-city.md:227 | 일손이 느는 일 | 일꾼이 느는 일 | 용어 110 |
| docs/design/v3/05-free-city.md:534 | 견습, 지킴, 일손, 살림 | 견습, 경비원, 일꾼, 살림 | 용어 110·116 |
| docs/design/v3/05-free-city.md:501 | \| 지킴 \| | \| 경비원 \| | 용어 116 |
| docs/design/v3/05-free-city.md:526 | \| 지킴 \| | \| 경비원 \| | 용어 116 |
| docs/design/v3/05-free-city.md:194 | 그 대의 | 그 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:195 | 그 대의 | 그 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:195 | 그 대의 | 그 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:195 | 그 대의 | 그 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:227 | 그 대의 | 그 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:260 | 그 대의 | 그 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:372 | 그 대의 | 그 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:372 | 그 대의 | 그 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:221 | 대의 도장 | 작업장의 도장 | 용어 104 |
| docs/design/v3/05-free-city.md:260 | 대의 도장과 | 작업장의 도장과 | 용어 104 |
| docs/design/v3/05-free-city.md:416 | 대의 도장을 | 작업장의 도장을 | 용어 104 |
| docs/design/v3/05-free-city.md:372 | 대의 표지 | 작업장의 표지 | 용어 104 |
| docs/design/v3/05-free-city.md:204 | 맺은 대의 | 맺은 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:260 | 낸 대의 | 낸 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:260 | 없는 대의 | 없는 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:404 | 두 대의 | 두 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:531 | 큰 대의 | 큰 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:196 | 대에 붙는다 | 작업장에 붙는이다 | 용어 104 |
| docs/design/v3/05-free-city.md:222 | 대에 붙은 | 작업장에 붙은 | 용어 104 |
| docs/design/v3/05-free-city.md:527 | 대에 붙는다 | 작업장에 붙는이다 | 용어 104 |
| docs/design/v3/05-free-city.md:404 | 제 집의 대에 | 제 집의 작업장에 | 용어 104 |
| docs/design/v3/05-free-city.md:204 | 여러 대에서 | 여러 작업장에서 | 용어 104 |
| docs/design/v3/05-free-city.md:420 | 도시와 대와 집 | 도시와 작업장과 집 | 용어 104 |
| docs/design/v3/05-free-city.md:404 | 한 대를 함께 쥐고 | 한 작업장을 함께 쥐고 | 용어 104 |
| docs/design/v3/05-free-city.md:373 | 제 대의 | 제 작업장의 | 용어 104 |
| docs/design/v3/05-free-city.md:119 | 그의 대가 보증을 | 그의 작업장이 보증을 | 용어 104 |
| docs/design/v3/05-free-city.md:204 | 전선대 | 전선 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:244 | 한 철 동안 | 반년 동안 | 용어 30 |
| docs/design/v3/07-people-and-war.md:111 | 손 | 숙련공 | 용어 109 |
| docs/design/v3/07-people-and-war.md:189 | 손 | 숙련공 | 용어 109 |
| docs/design/v3/07-people-and-war.md:721 | 손 | 숙련공 | 용어 109 |
| docs/design/v3/07-people-and-war.md:721 | 손 | 숙련공 | 용어 109 |
| docs/design/v3/07-people-and-war.md:351 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/07-people-and-war.md:354 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/07-people-and-war.md:642 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/07-people-and-war.md:722 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/07-people-and-war.md:688 | → 손. | → 숙련공. | 용어 109 |
| docs/design/v3/07-people-and-war.md:718 | 후계 / 손 | 후계 / 숙련공 | 용어 109 |
| docs/design/v3/07-people-and-war.md:216 | 손 16, 일손 16 | 숙련공 16, 일꾼 16 | 용어 109·110 |
| docs/design/v3/07-people-and-war.md:673 | '손' | '숙련공' | 용어 109 |
| docs/design/v3/07-people-and-war.md:673 | '일손' | '일꾼' | 용어 110 |
| docs/design/v3/07-people-and-war.md:354 | 손(기록) | 숙련공(기록) | 용어 109 |
| docs/design/v3/07-people-and-war.md:643 | \| 일손 \| | \| 일꾼 \| | 용어 110 |
| docs/design/v3/07-people-and-war.md:725 | \| 일손 \| | \| 일꾼 \| | 용어 110 |
| docs/design/v3/07-people-and-war.md:111 | 일손·살림 | 일꾼·살림 | 용어 110 |
| docs/design/v3/07-people-and-war.md:688 | 일손·살림 | 일꾼·살림 | 용어 110 |
| docs/design/v3/07-people-and-war.md:725 | \| 일손, 정부 장부 | \| 일꾼, 정부 장부 | 용어 110 |
| docs/design/v3/07-people-and-war.md:688 | 지킴, 산지기 | 경비원, 산지기 | 용어 116 |
| docs/design/v3/07-people-and-war.md:720 | 그 대의 | 그 작업장의 | 용어 104 |
| docs/design/v3/07-people-and-war.md:200 | 큰 대의 | 큰 작업장의 | 용어 104 |
| docs/design/v3/07-people-and-war.md:1175 | **철.** | **때.** | 용어 30 |
| docs/design/v3/07-people-and-war.md:248 | 띠 안에서 | 봉쇄 지대 안에서 | 용어 38 |
| docs/design/v3/08-document-map.md:35 | 철(긴 | 때(긴 | 용어 30 |
| docs/design/v3/09-ck3-systems.md:516 | 손 다섯에 | 숙련공 다섯에 | 용어 109 |
| docs/design/v3/09-ck3-systems.md:520 | 그 대의 | 그 작업장의 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:291 | 철(긴 | 때(긴 | 용어 30 |
| docs/design/v3/09-ck3-systems.md:451 | 띠 안에서 | 봉쇄 지대 안에서 | 용어 38 |
| docs/design/v3/07-people-and-war.en.md:721 | 손 | 숙련공 | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:721 | 손 | 숙련공 | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:351 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:354 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:642 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:722 | \| 손 \| | \| 숙련공 \| | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:688 | → 손. | → 숙련공. | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:718 | 후계 / 손 | 후계 / 숙련공 | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:216 | 손 16, 일손 16 | 숙련공 16, 일꾼 16 | 용어 109·110 |
| docs/design/v3/07-people-and-war.en.md:673 | '손' | '숙련공' | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:673 | '일손' | '일꾼' | 용어 110 |
| docs/design/v3/07-people-and-war.en.md:643 | \| 일손 \| | \| 일꾼 \| | 용어 110 |
| docs/design/v3/07-people-and-war.en.md:725 | \| 일손 \| | \| 일꾼 \| | 용어 110 |
| docs/design/v3/01-core.md:131 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/01-core.md:244 | 섬유당 통과 | 당화 탱크와 | 용어 2 |
| docs/design/v3/01-core.md:281 | 섬유당 통은 | 당화 탱크는 | 용어 2 |
| docs/design/v3/01-core.md:300 | 섬유당 통과 | 당화 탱크와 | 용어 2 |
| docs/design/v3/01-core.md:492 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/01-core.md:552 | 섬유당 통과 | 당화 탱크와 | 용어 2 |
| docs/design/v3/01-core.md:265 | 섬유당과 효모 | 당화액과 효모 | 용어 1 |
| docs/design/v3/01-core.md:130 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/01-core.md:156 | 섬유당과 | 당화액과 | 용어 1 |
| docs/design/v3/01-core.md:261 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/01-core.md:267 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/01-core.md:494 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/01-core.md:552 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/01-core.md:53 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:90 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:90 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:131 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:156 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:266 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:270 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:273 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:273 | 빛밭은 | 온실은 | 용어 3 |
| docs/design/v3/01-core.md:273 | 빛밭으로 | 온실로 | 용어 3 |
| docs/design/v3/01-core.md:273 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:273 | 빛밭은 | 온실은 | 용어 3 |
| docs/design/v3/01-core.md:273 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:273 | 빛밭을 | 온실을 | 용어 3 |
| docs/design/v3/01-core.md:273 | 빛밭과 | 온실과 | 용어 3 |
| docs/design/v3/01-core.md:273 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:273 | 빛밭을 | 온실을 | 용어 3 |
| docs/design/v3/01-core.md:287 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:300 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:300 | 빛밭을 | 온실을 | 용어 3 |
| docs/design/v3/01-core.md:426 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:492 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:494 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/01-core.md:552 | 빛밭은 | 온실은 | 용어 3 |
| docs/design/v3/01-core.md:241 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/01-core.md:241 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/01-core.md:332 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/01-core.md:498 | 동력 덩이를 | 동력원을 | 용어 21 |
| docs/design/v3/01-core.md:459 | 바람틀 밭을 | 풍력 발전 단지를 | 용어 25 |
| docs/design/v3/01-core.md:90 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/01-core.md:156 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/01-core.md:156 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/01-core.md:200 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/01-core.md:236 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/01-core.md:236 | 바람틀을 | 풍력 발전기를 | 용어 24 |
| docs/design/v3/01-core.md:297 | 바람틀과 | 풍력 발전기와 | 용어 24 |
| docs/design/v3/01-core.md:376 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/01-core.md:495 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/01-core.md:200 | 땅속 열 펌프 | 지열 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:281 | 땅속 열 펌프 | 지열 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:495 | 땅속 열 펌프와 | 지열 열펌프와 | 용어 26 |
| docs/design/v3/01-core.md:178 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:178 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:178 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:209 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:212 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:212 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:238 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:255 | 열 펌프를 | 열펌프를 | 용어 26 |
| docs/design/v3/01-core.md:297 | 열 펌프를 | 열펌프를 | 용어 26 |
| docs/design/v3/01-core.md:376 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:543 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/01-core.md:287 | 메탄 통으로 | 혐기성 소화조로 | 용어 28 |
| docs/design/v3/01-core.md:86 | 녹은 주머니는 | 녹은 땅은 | 용어 29 |
| docs/design/v3/01-core.md:128 | 녹은 주머니 | 녹은 땅 | 용어 29 |
| docs/design/v3/01-core.md:251 | 녹은 주머니를 | 녹은 땅을 | 용어 29 |
| docs/design/v3/01-core.md:138 | 겨울의 톱니 | 겨울의 래칫 | 용어 31 |
| docs/design/v3/01-core.md:320 | 겨울의 톱니 | 겨울의 래칫 | 용어 31 |
| docs/design/v3/01-core.md:544 | 겨울의 톱니 | 겨울의 래칫 | 용어 31 |
| docs/design/v3/01-core.md:148 | 톱니는 | 래칫은 | 용어 31 |
| docs/design/v3/01-core.md:345 | 톱니가 | 래칫이 | 용어 31 |
| docs/design/v3/01-core.md:281 | 배기 굴 | 배기구 | 용어 34 |
| docs/design/v3/01-core.md:404 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/01-core.md:413 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/01-core.md:415 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/01-core.md:418 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/01-core.md:497 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/01-core.md:239 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/01-core.md:328 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/01-core.md:334 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/01-core.md:457 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/01-core.md:498 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/01-core.md:522 | 테두리다 | 봉쇄선이다 | 용어 37 |
| docs/design/v3/01-core.md:536 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/01-core.md:67 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/01-core.md:65 | 열네 도장 | 열네 명의 날인 | 용어 69 |
| docs/design/v3/01-core.md:66 | 대물림 의석 | 세습 의석 | 용어 70 |
| docs/design/v3/01-core.md:365 | 대물림 의석 | 세습 의석 | 용어 70 |
| docs/design/v3/01-core.md:519 | 대물림 의석 | 세습 의석 | 용어 70 |
| docs/design/v3/01-core.md:66 | 의석을 물린다 | 의석을 세습한다 | 용어 71 |
| docs/design/v3/01-core.md:69 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/01-core.md:255 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/01-core.md:382 | 계약회를 | 협의회를 | 용어 95 |
| docs/design/v3/01-core.md:382 | 계약회는 | 협의회는 | 용어 95 |
| docs/design/v3/01-core.md:382 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/01-core.md:448 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/01-core.md:448 | 계약회를 | 협의회를 | 용어 95 |
| docs/design/v3/01-core.md:455 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/01-core.md:480 | 계약회와 | 협의회와 | 용어 95 |
| docs/design/v3/01-core.md:527 | 계약회와 | 협의회와 | 용어 95 |
| docs/design/v3/01-core.md:546 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/01-core.md:448 | 자리주인을 | 주최자를 | 용어 96 |
| docs/design/v3/01-core.md:480 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/01-core.md:527 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/01-core.md:380 | 대주 | 대표 | 용어 97 |
| docs/design/v3/01-core.md:380 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/01-core.md:380 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/01-core.md:380 | 도장을 묶어 | 세습을 결의해 | 용어 102 |
| docs/design/v3/01-core.md:42 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/01-core.md:376 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/01-core.md:380 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/01-core.md:519 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/01-core.md:520 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/01-core.md:388 | 작업조가 | 작업반이 | 용어 107 |
| docs/design/v3/01-core.md:496 | 작업조가 | 작업반이 | 용어 107 |
| docs/design/v3/01-core.md:498 | 작업조 | 작업반 | 용어 107 |
| docs/design/v3/01-core.md:445 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/01-core.md:477 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/01-core.md:520 | 역반과 | 역 반과 | 용어 119 |
| docs/design/v3/01-core.md:459 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/01-core.md:479 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/01-core.md:457 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/01-core.md:479 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/01-core.md:455 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/01-core.md:479 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/01-core.md:468 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/01-core.md:480 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/01-core.md:467 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/01-core.md:468 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/01-core.md:479 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/01-core.md:526 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/01-core.md:529 | 곁집장과 | 가문 수장과 | 용어 153 |
| docs/design/v3/01-core.md:395 | 곁 섬김으로 | 오랜 보좌로 | 용어 157 |
| docs/design/v3/01-core.md:72 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/01-core.md:72 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/01-core.md:277 | 곁집과 | 측근 가문과 | 용어 152 |
| docs/design/v3/01-core.md:395 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/01-core.md:395 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/01-core.md:395 | 곁집을 | 측근 가문을 | 용어 152 |
| docs/design/v3/01-core.md:396 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/01-core.md:467 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/01-core.md:519 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/01-core.md:277 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/01-core.md:465 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/01-core.md:477 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/01-core.md:207 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/01-core.md:212 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/01-core.md:295 | 세례자는 | 세례 신도는 | 용어 160 |
| docs/design/v3/01-core.md:388 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:10 | 섬유당 통과 | 당화 탱크와 | 용어 2 |
| docs/design/v3/03-technology.md:22 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/03-technology.md:66 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/03-technology.md:213 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/03-technology.md:466 | 섬유당과 효모 | 당화액과 효모 | 용어 1 |
| docs/design/v3/03-technology.md:282 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/03-technology.md:308 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/03-technology.md:440 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/03-technology.md:466 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/03-technology.md:470 | 킬로와 | 킬로와트시와 | 용어 6 |
| docs/design/v3/03-technology.md:485 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/03-technology.md:541 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/03-technology.md:556 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/03-technology.md:470 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/03-technology.md:473 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/03-technology.md:473 | 손시간은 | 노동 시간은 | 용어 7 |
| docs/design/v3/03-technology.md:473 | 손시간은 | 노동 시간은 | 용어 7 |
| docs/design/v3/03-technology.md:492 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/03-technology.md:539 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/03-technology.md:485 | 1 사람날은 | 1인 1일분은 | 용어 8 |
| docs/design/v3/03-technology.md:489 | 1 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:490 | 1 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:491 | 67 사람날 | 67인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:491 | 1 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:492 | 33 사람날 | 33인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:493 | 13 사람날 | 13인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:494 | 3 사람날 | 3인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:509 | 1 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:531 | 1 사람날)을 | 1인 1일분)을 | 용어 8 |
| docs/design/v3/03-technology.md:531 | 330 사람날 | 330인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:483 | 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:485 | 사람날**을 | 1인 1일분**을 | 용어 8 |
| docs/design/v3/03-technology.md:485 | 사람날은 | 1인 1일분은 | 용어 8 |
| docs/design/v3/03-technology.md:487 | 사람날로 | 1인 1일분으로 | 용어 8 |
| docs/design/v3/03-technology.md:503 | 사람날로 | 1인 1일분으로 | 용어 8 |
| docs/design/v3/03-technology.md:505 | 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:556 | 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/03-technology.md:472 | 찬 꾸러미**와 | 충전된 전지 팩**과 | 용어 9 |
| docs/design/v3/03-technology.md:510 | 되살린 전지 꾸러미 | 재생 전지 팩 | 용어 10a |
| docs/design/v3/03-technology.md:76 | 되살린 꾸러미는 | 재생 전지 팩은 | 용어 10a |
| docs/design/v3/03-technology.md:170 | 되살린 꾸러미를 | 재생 전지 팩을 | 용어 10a |
| docs/design/v3/03-technology.md:170 | 전지 꾸러미 | 전지 팩 | 용어 10a |
| docs/design/v3/03-technology.md:472 | 전지 꾸러미와 | 전지 팩과 | 용어 10a |
| docs/design/v3/03-technology.md:24 | 꾸러미로 | 전지 팩으로 | 용어 10a |
| docs/design/v3/03-technology.md:203 | 꾸러미를 | 전지 팩을 | 용어 10a |
| docs/design/v3/03-technology.md:472 | 보증표**라 | 교환권**이라 | 용어 11 |
| docs/design/v3/03-technology.md:477 | 하루 충전과 | 하루 충전량과 | 용어 19 |
| docs/design/v3/03-technology.md:480 | 하루 충전**은 | 하루 충전량**은 | 용어 19 |
| docs/design/v3/03-technology.md:480 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/03-technology.md:485 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/03-technology.md:493 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/03-technology.md:539 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/03-technology.md:541 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/03-technology.md:556 | 하루 충전)과 | 하루 충전량)과 | 용어 19 |
| docs/design/v3/03-technology.md:172 | 정비 차례를 | 정비 순번을 | 용어 20 |
| docs/design/v3/03-technology.md:477 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/03-technology.md:481 | 정비 차례**는 | 정비 순번**은 | 용어 20 |
| docs/design/v3/03-technology.md:481 | 정비 차례를 | 정비 순번을 | 용어 20 |
| docs/design/v3/03-technology.md:494 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/03-technology.md:539 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/03-technology.md:44 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/03-technology.md:78 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/03-technology.md:93 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/03-technology.md:388 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/03-technology.md:409 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/03-technology.md:511 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/03-technology.md:558 | 동력 덩이가 | 동력원이 | 용어 21 |
| docs/design/v3/03-technology.md:429 | 바람틀공 | 풍력 발전기 정비공 | 용어 133 |
| docs/design/v3/03-technology.md:467 | 바람틀공과 | 풍력 발전기 정비공과 | 용어 133 |
| docs/design/v3/03-technology.md:475 | 바람틀 밭을 | 풍력 발전 단지를 | 용어 25 |
| docs/design/v3/03-technology.md:22 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/03-technology.md:43 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/03-technology.md:372 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/03-technology.md:429 | 바람틀을 | 풍력 발전기를 | 용어 24 |
| docs/design/v3/03-technology.md:448 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/03-technology.md:430 | 땅속 열 펌프 | 지열 열펌프 | 용어 26 |
| docs/design/v3/03-technology.md:23 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/03-technology.md:35 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/03-technology.md:54 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/03-technology.md:66 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/03-technology.md:68 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/03-technology.md:430 | 열펌프공 | 열펌프 정비공 | 용어 133 |
| docs/design/v3/03-technology.md:539 | 열펌프공 | 열펌프 정비공 | 용어 133 |
| docs/design/v3/03-technology.md:432 | 수차공 | 수차 정비공 | 용어 133 |
| docs/design/v3/03-technology.md:245 | 메탄 통 | 혐기성 소화조 | 용어 28 |
| docs/design/v3/03-technology.md:282 | 메탄 통 | 혐기성 소화조 | 용어 28 |
| docs/design/v3/03-technology.md:327 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/03-technology.md:468 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/03-technology.md:495 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/03-technology.md:93 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/03-technology.md:312 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/03-technology.md:312 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/03-technology.md:382 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/03-technology.md:409 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/03-technology.md:409 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/03-technology.md:467 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/03-technology.md:511 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/03-technology.md:321 | 말줄 | 유선 통신선 | 용어 45 |
| docs/design/v3/03-technology.md:323 | 말줄 | 유선 통신선 | 용어 45 |
| docs/design/v3/03-technology.md:325 | 말줄 | 유선 통신선 | 용어 45 |
| docs/design/v3/03-technology.md:326 | 말줄은 | 유선 통신선은 | 용어 45 |
| docs/design/v3/03-technology.md:326 | 말줄과 | 유선 통신선과 | 용어 45 |
| docs/design/v3/03-technology.md:326 | 말줄을 | 유선 통신선을 | 용어 45 |
| docs/design/v3/03-technology.md:327 | 말줄을 | 유선 통신선을 | 용어 45 |
| docs/design/v3/03-technology.md:327 | 말줄을 | 유선 통신선을 | 용어 45 |
| docs/design/v3/03-technology.md:433 | 말줄을 | 유선 통신선을 | 용어 45 |
| docs/design/v3/03-technology.md:127 | 깨끗한 방 | 클린 룸 | 용어 46 |
| docs/design/v3/03-technology.md:128 | 깨끗한 방 | 클린 룸 | 용어 46 |
| docs/design/v3/03-technology.md:144 | 깨끗한 방 | 클린 룸 | 용어 46 |
| docs/design/v3/03-technology.md:146 | 깨끗한 방 | 클린 룸 | 용어 46 |
| docs/design/v3/03-technology.md:146 | 깨끗한 방 | 클린 룸 | 용어 46 |
| docs/design/v3/03-technology.md:411 | 깨끗한 방 | 클린 룸 | 용어 46 |
| docs/design/v3/03-technology.md:417 | 깨끗한 방 | 클린 룸 | 용어 46 |
| docs/design/v3/03-technology.md:528 | 깨끗한 방 | 클린 룸 | 용어 46 |
| docs/design/v3/03-technology.md:528 | 깨끗한 방 | 클린 룸 | 용어 46 |
| docs/design/v3/03-technology.md:24 | 낱칸을 | 셀을 | 용어 47 |
| docs/design/v3/03-technology.md:25 | 낱칸 | 셀 | 용어 47 |
| docs/design/v3/03-technology.md:76 | 낱칸 | 셀 | 용어 47 |
| docs/design/v3/03-technology.md:76 | 낱칸을 | 셀을 | 용어 47 |
| docs/design/v3/03-technology.md:108 | 낱칸을 | 셀을 | 용어 47 |
| docs/design/v3/03-technology.md:436 | 낱칸을 | 셀을 | 용어 47 |
| docs/design/v3/03-technology.md:510 | 낱칸 | 셀 | 용어 47 |
| docs/design/v3/03-technology.md:24 | 회로판을 | 기판을 | 용어 48 |
| docs/design/v3/03-technology.md:25 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:29 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:91 | 회로판과 | 기판과 | 용어 48 |
| docs/design/v3/03-technology.md:96 | 회로판은 | 기판은 | 용어 48 |
| docs/design/v3/03-technology.md:96 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:108 | 회로판과 | 기판과 | 용어 48 |
| docs/design/v3/03-technology.md:124 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:134 | 회로판과 | 기판과 | 용어 48 |
| docs/design/v3/03-technology.md:146 | 회로판은 | 기판은 | 용어 48 |
| docs/design/v3/03-technology.md:146 | 회로판과 | 기판과 | 용어 48 |
| docs/design/v3/03-technology.md:169 | 회로판과 | 기판과 | 용어 48 |
| docs/design/v3/03-technology.md:172 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:300 | 회로판과 | 기판과 | 용어 48 |
| docs/design/v3/03-technology.md:300 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:310 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:312 | 회로판을 | 기판을 | 용어 48 |
| docs/design/v3/03-technology.md:328 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:407 | 회로판과 | 기판과 | 용어 48 |
| docs/design/v3/03-technology.md:437 | 회로판을 | 기판을 | 용어 48 |
| docs/design/v3/03-technology.md:519 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:520 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:522 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:523 | 회로판 | 기판 | 용어 48 |
| docs/design/v3/03-technology.md:267 | 검은약 탄 | 흑색 화약 탄 | 용어 49 |
| docs/design/v3/03-technology.md:278 | 검은약 탄 | 흑색 화약 탄 | 용어 49 |
| docs/design/v3/03-technology.md:290 | 검은약 탄은 | 흑색 화약 탄은 | 용어 49 |
| docs/design/v3/03-technology.md:515 | 검은약 | 흑색 화약 | 용어 49 |
| docs/design/v3/03-technology.md:22 | 검은 화약 | 흑색 화약 | 용어 49a |
| docs/design/v3/03-technology.md:267 | 검은 화약을 | 흑색 화약을 | 용어 49a |
| docs/design/v3/03-technology.md:277 | 검은 화약 | 흑색 화약 | 용어 49a |
| docs/design/v3/03-technology.md:282 | 검은 화약 | 흑색 화약 | 용어 49a |
| docs/design/v3/03-technology.md:282 | 검은 화약은 | 흑색 화약은 | 용어 49a |
| docs/design/v3/03-technology.md:318 | 줄 드론 | 유선 드론 | 용어 49b |
| docs/design/v3/03-technology.md:332 | 줄 드론과 | 유선 드론과 | 용어 49b |
| docs/design/v3/03-technology.md:466 | 배급 증표 | 배급표 | 용어 73 |
| docs/design/v3/03-technology.md:326 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/03-technology.md:450 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/03-technology.md:541 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/03-technology.md:22 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:103 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:103 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:103 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/03-technology.md:134 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:142 | 작업대와 | 작업장과 | 용어 104 |
| docs/design/v3/03-technology.md:165 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:238 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/03-technology.md:254 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:257 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/03-technology.md:266 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:278 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:286 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/03-technology.md:332 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/03-technology.md:404 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:421 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:444 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:450 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:450 | 작업대**다 | 작업장**이다 | 용어 104 |
| docs/design/v3/03-technology.md:450 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/03-technology.md:450 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/03-technology.md:450 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/03-technology.md:450 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:450 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/03-technology.md:472 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/03-technology.md:517 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/03-technology.md:531 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/03-technology.md:557 | 작업대와 | 작업장과 | 용어 104 |
| docs/design/v3/03-technology.md:432 | 작업조 | 작업반 | 용어 107 |
| docs/design/v3/03-technology.md:450 | 손 계약"을 | 도제 계약"을 | 용어 113 |
| docs/design/v3/03-technology.md:557 | 손 계약 | 도제 계약 | 용어 113 |
| docs/design/v3/03-technology.md:448 | 견습 | 수습 | 용어 114 |
| docs/design/v3/03-technology.md:450 | 견습 | 수습 | 용어 114 |
| docs/design/v3/03-technology.md:450 | 견습은 | 수습은 | 용어 114 |
| docs/design/v3/03-technology.md:372 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/03-technology.md:146 | 판공 | 기판 수리공 | 용어 133 |
| docs/design/v3/03-technology.md:146 | 판공 | 기판 수리공 | 용어 133 |
| docs/design/v3/03-technology.md:437 | 판공 | 기판 수리공 | 용어 133 |
| docs/design/v3/03-technology.md:452 | 판공 | 기판 수리공 | 용어 133 |
| docs/design/v3/03-technology.md:473 | 판공과 | 기판 수리공과 | 용어 133 |
| docs/design/v3/03-technology.md:510 | 판공 | 기판 수리공 | 용어 133 |
| docs/design/v3/03-technology.md:431 | 우물공 | 우물 기술자 | 용어 134 |
| docs/design/v3/03-technology.md:539 | 우물공과 | 우물 기술자와 | 용어 134 |
| docs/design/v3/03-technology.md:325 | 망공 | 선로공 | 용어 134 |
| docs/design/v3/03-technology.md:433 | 망공 | 선로공 | 용어 134 |
| docs/design/v3/03-technology.md:440 | 그물공 | 그물 제작공 | 용어 134 |
| docs/design/v3/03-technology.md:344 | 전지 수레는 | 전지 궤도차는 | 용어 147 |
| docs/design/v3/03-technology.md:349 | 전지 수레 | 전지 궤도차 | 용어 147 |
| docs/design/v3/03-technology.md:452 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/03-technology.md:479 | 곁집과 | 측근 가문과 | 용어 152 |
| docs/design/v3/03-technology.md:452 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/03-technology.md:10 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:10 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:104 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:114 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:114 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:176 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:178 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:194 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:199 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:199 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:201 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:201 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:201 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:223 | 세례자는 | 세례 신도는 | 용어 160 |
| docs/design/v3/03-technology.md:226 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:227 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:227 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:460 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:480 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/03-technology.md:441 | 맞춤이 | 이식 정비사 | 용어 175 |
| docs/design/v3/03-technology.md:444 | 맞춤이는 | 이식 정비사는 | 용어 175 |
| docs/design/v3/03-technology.md:452 | 맞춤이와 | 이식 정비사와 | 용어 175 |
| docs/design/v3/03-technology.md:473 | 맞춤이 | 이식 정비사 | 용어 175 |
| docs/design/v3/03-technology.md:527 | 맞춤이 | 이식 정비사 | 용어 175 |
| docs/design/v3/04-government.md:230 | 섬유당 통지기 | 당화 탱크 관리인 | 용어 166 |
| docs/design/v3/04-government.md:103 | 섬유당 통과 | 당화 탱크와 | 용어 2 |
| docs/design/v3/04-government.md:211 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/04-government.md:279 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/04-government.md:396 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/04-government.md:246 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/04-government.md:250 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/04-government.md:278 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/04-government.md:85 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/04-government.md:103 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/04-government.md:231 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/04-government.md:277 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/04-government.md:279 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/04-government.md:308 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/04-government.md:254 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/04-government.md:231 | 섬유 채집꾼 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/04-government.md:277 | 섬유 캐기 | 섬유 채집 | 용어 23 |
| docs/design/v3/04-government.md:100 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/04-government.md:426 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/04-government.md:230 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/04-government.md:426 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/04-government.md:303 | 메탄 통 | 혐기성 소화조 | 용어 28 |
| docs/design/v3/04-government.md:342 | 긴 낮 철 | 낮이 긴 때 | 용어 30 |
| docs/design/v3/04-government.md:351 | 긴 낮 철 | 낮이 긴 때 | 용어 30 |
| docs/design/v3/04-government.md:355 | 긴 낮 철 | 낮이 긴 때 | 용어 30 |
| docs/design/v3/04-government.md:240 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/04-government.md:342 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/04-government.md:351 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/04-government.md:355 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/04-government.md:575 | 톱니가 | 래칫이 | 용어 31 |
| docs/design/v3/04-government.md:201 | 출입구 굴 | 출입구 수직갱 | 용어 32 |
| docs/design/v3/04-government.md:277 | 출입구 굴 | 출입구 수직갱 | 용어 32 |
| docs/design/v3/04-government.md:362 | 출입구 굴 | 출입구 수직갱 | 용어 32 |
| docs/design/v3/04-government.md:68 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/04-government.md:75 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/04-government.md:76 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/04-government.md:77 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/04-government.md:385 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/04-government.md:400 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/04-government.md:409 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/04-government.md:413 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/04-government.md:435 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/04-government.md:81 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:82 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:83 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:84 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:85 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:95 | 테두리가 | 봉쇄선이 | 용어 37 |
| docs/design/v3/04-government.md:400 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:410 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:435 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/04-government.md:448 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:515 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:517 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:518 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:519 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:520 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:601 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/04-government.md:394 | 눈 묘역**이 | 공동묘지**가 | 용어 44 |
| docs/design/v3/04-government.md:591 | 눈 묘역 | 공동묘지 | 용어 44 |
| docs/design/v3/04-government.md:385 | 깨끗한 방 | 클린 룸 | 용어 46 |
| docs/design/v3/04-government.md:63 | 등재민은 | 등록 주민은 | 용어 67 |
| docs/design/v3/04-government.md:118 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/04-government.md:122 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/04-government.md:187 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/04-government.md:425 | 등재민은 | 등록 주민은 | 용어 67 |
| docs/design/v3/04-government.md:462 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/04-government.md:462 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/04-government.md:524 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/04-government.md:43 | 열네 도장 | 열네 명의 날인 | 용어 69 |
| docs/design/v3/04-government.md:47 | 열네 도장 | 열네 명의 날인 | 용어 69 |
| docs/design/v3/04-government.md:54 | 열네 도장 | 열네 명의 날인 | 용어 69 |
| docs/design/v3/04-government.md:177 | 열네 도장 | 열네 명의 날인 | 용어 69 |
| docs/design/v3/04-government.md:181 | 열네 도장 | 열네 명의 날인 | 용어 69 |
| docs/design/v3/04-government.md:468 | 열네 도장 | 열네 명의 날인 | 용어 69 |
| docs/design/v3/04-government.md:584 | 열네 도장 | 열네 명의 날인 | 용어 69 |
| docs/design/v3/04-government.md:37 | 대물림 의석 | 세습 의석 | 용어 70 |
| docs/design/v3/04-government.md:42 | 의석을 물린다 | 의석을 세습한다 | 용어 71 |
| docs/design/v3/04-government.md:135 | 등재 증표**로 | 주민등록증**으로 | 용어 72 |
| docs/design/v3/04-government.md:330 | 등재 증표 | 주민등록증 | 용어 72 |
| docs/design/v3/04-government.md:108 | 배급 증표를 | 배급표를 | 용어 73 |
| docs/design/v3/04-government.md:250 | 배급 증표 | 배급표 | 용어 73 |
| docs/design/v3/04-government.md:537 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/04-government.md:555 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/04-government.md:545 | 보건 일꾼 | 보건 요원 | 용어 79 |
| docs/design/v3/04-government.md:454 | 작업조로 | 작업반으로 | 용어 107 |
| docs/design/v3/05-free-city.md:186 | 섬유당 통을 | 당화 탱크를 | 용어 2 |
| docs/design/v3/05-free-city.md:358 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/05-free-city.md:400 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/05-free-city.md:140 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/05-free-city.md:400 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/05-free-city.md:30 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/05-free-city.md:96 | 빛밭을 | 온실을 | 용어 3 |
| docs/design/v3/05-free-city.md:96 | 빛밭은 | 온실은 | 용어 3 |
| docs/design/v3/05-free-city.md:186 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/05-free-city.md:211 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/05-free-city.md:318 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/05-free-city.md:400 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/05-free-city.md:54 | 화덕 킬로는 | 난방 기여분은 | 용어 5 |
| docs/design/v3/05-free-city.md:54 | 화덕 킬로를 | 난방 기여분을 | 용어 5 |
| docs/design/v3/05-free-city.md:54 | 화덕 킬로 | 난방 기여분 | 용어 5 |
| docs/design/v3/05-free-city.md:54 | 화덕 킬로 | 난방 기여분 | 용어 5 |
| docs/design/v3/05-free-city.md:55 | 화덕 킬로 | 난방 기여분 | 용어 5 |
| docs/design/v3/05-free-city.md:55 | 화덕 킬로는 | 난방 기여분은 | 용어 5 |
| docs/design/v3/05-free-city.md:71 | 화덕 킬로 | 난방 기여분 | 용어 5 |
| docs/design/v3/05-free-city.md:104 | 화덕 킬로는 | 난방 기여분은 | 용어 5 |
| docs/design/v3/05-free-city.md:111 | 화덕 킬로를 | 난방 기여분을 | 용어 5 |
| docs/design/v3/05-free-city.md:119 | 화덕 킬로를 | 난방 기여분을 | 용어 5 |
| docs/design/v3/05-free-city.md:553 | 화덕 킬로 | 난방 기여분 | 용어 5 |
| docs/design/v3/05-free-city.md:54 | 0 킬로 | 0 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:55 | 0 킬로 | 0 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:55 | 0 킬로 | 0 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:75 | 0 킬로 | 0 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:242 | 5 킬로 | 5 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:242 | 4 킬로 | 4 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:250 | 5 킬로 | 5 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:252 | 5 킬로 | 5 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:252 | 5 킬로 | 5 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:252 | 3 킬로 | 3 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:254 | 4 킬로 | 4 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:261 | 1 킬로를 | 1 킬로와트시를 | 용어 6 |
| docs/design/v3/05-free-city.md:43 | 킬로를 | 킬로와트시를 | 용어 6 |
| docs/design/v3/05-free-city.md:55 | 킬로를 | 킬로와트시를 | 용어 6 |
| docs/design/v3/05-free-city.md:55 | 킬로는 | 킬로와트시는 | 용어 6 |
| docs/design/v3/05-free-city.md:55 | 킬로는 | 킬로와트시는 | 용어 6 |
| docs/design/v3/05-free-city.md:111 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:111 | 킬로를 | 킬로와트시를 | 용어 6 |
| docs/design/v3/05-free-city.md:231 | 킬로와 | 킬로와트시와 | 용어 6 |
| docs/design/v3/05-free-city.md:241 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:254 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:254 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:260 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:429 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:556 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/05-free-city.md:231 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/05-free-city.md:242 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/05-free-city.md:242 | 손시간은 | 노동 시간은 | 용어 7 |
| docs/design/v3/05-free-city.md:252 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/05-free-city.md:260 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/05-free-city.md:416 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/05-free-city.md:556 | 손시간)와 | 노동 시간)과 | 용어 7 |
| docs/design/v3/05-free-city.md:252 | 2 사람날 | 2인 1일분 | 용어 8 |
| docs/design/v3/05-free-city.md:261 | 30 사람날로 | 30인 1일분으로 | 용어 8 |
| docs/design/v3/05-free-city.md:55 | 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/05-free-city.md:231 | 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/05-free-city.md:250 | 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/05-free-city.md:254 | 사람날 | 1인 1일분 | 용어 8 |
| docs/design/v3/05-free-city.md:55 | 찬 꾸러미 | 충전된 전지 팩 | 용어 9 |
| docs/design/v3/05-free-city.md:160 | 찬 꾸러미 | 충전된 전지 팩 | 용어 9 |
| docs/design/v3/05-free-city.md:256 | 찬 꾸러미 | 충전된 전지 팩 | 용어 9 |
| docs/design/v3/05-free-city.md:261 | 찬 꾸러미 | 충전된 전지 팩 | 용어 9 |
| docs/design/v3/05-free-city.md:261 | 찬 꾸러미로 | 충전된 전지 팩으로 | 용어 9 |
| docs/design/v3/05-free-city.md:556 | 찬 꾸러미와 | 충전된 전지 팩과 | 용어 9 |
| docs/design/v3/05-free-city.md:564 | 찬 꾸러미다 | 충전된 전지 팩이다 | 용어 9 |
| docs/design/v3/05-free-city.md:233 | 꾸러미 맞바꿈 | 전지 팩 교환 | 용어 10 |
| docs/design/v3/05-free-city.md:261 | 되살린 꾸러미 | 재생 전지 팩 | 용어 10a |
| docs/design/v3/05-free-city.md:261 | 전지 꾸러미다 | 전지 팩이다 | 용어 10a |
| docs/design/v3/05-free-city.md:564 | 전지 꾸러미"는 | 전지 팩"은 | 용어 10a |
| docs/design/v3/05-free-city.md:261 | 꾸러미는 | 전지 팩은 | 용어 10a |
| docs/design/v3/05-free-city.md:261 | 꾸러미를 | 전지 팩을 | 용어 10a |
| docs/design/v3/05-free-city.md:261 | 꾸러미 | 전지 팩 | 용어 10a |
| docs/design/v3/05-free-city.md:556 | 꾸러미 | 전지 팩 | 용어 10a |
| docs/design/v3/05-free-city.md:373 | 보증표 끈 | 교환권 끈 | 용어 12 |
| docs/design/v3/05-free-city.md:51 | 보증표를 | 교환권을 | 용어 11 |
| docs/design/v3/05-free-city.md:221 | 보증표를 | 교환권을 | 용어 11 |
| docs/design/v3/05-free-city.md:233 | 보증표 | 교환권 | 용어 11 |
| docs/design/v3/05-free-city.md:256 | 보증표와 | 교환권과 | 용어 11 |
| docs/design/v3/05-free-city.md:260 | 보증표 | 교환권 | 용어 11 |
| docs/design/v3/05-free-city.md:260 | 보증표라 | 교환권이라 | 용어 11 |
| docs/design/v3/05-free-city.md:260 | 보증표는 | 교환권은 | 용어 11 |
| docs/design/v3/05-free-city.md:260 | 보증표 | 교환권 | 용어 11 |
| docs/design/v3/05-free-city.md:261 | 보증표를 | 교환권을 | 용어 11 |
| docs/design/v3/05-free-city.md:326 | 보증표 | 교환권 | 용어 11 |
| docs/design/v3/05-free-city.md:373 | 보증표 | 교환권 | 용어 11 |
| docs/design/v3/05-free-city.md:400 | 보증표로 | 교환권으로 | 용어 11 |
| docs/design/v3/05-free-city.md:556 | 보증표 | 교환권 | 용어 11 |
| docs/design/v3/05-free-city.md:564 | 보증표와 | 교환권과 | 용어 11 |
| docs/design/v3/05-free-city.md:33 | 보증판의 수 | 보증 건수 | 용어 13 |
| docs/design/v3/05-free-city.md:43 | 보증판의 수를 | 보증 건수를 | 용어 13 |
| docs/design/v3/05-free-city.md:119 | 보증판의 수와 | 보증 건수와 | 용어 13 |
| docs/design/v3/05-free-city.md:525 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/05-free-city.md:531 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/05-free-city.md:111 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/05-free-city.md:233 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/05-free-city.md:248 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/05-free-city.md:250 | 셈판**이라 | 시세표**라 | 용어 14 |
| docs/design/v3/05-free-city.md:250 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/05-free-city.md:260 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/05-free-city.md:350 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/05-free-city.md:382 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/05-free-city.md:431 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/05-free-city.md:556 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/05-free-city.md:55 | 빈 통 | 구호 통 | 용어 17 |
| docs/design/v3/05-free-city.md:400 | 빈 통 | 구호 통 | 용어 17 |
| docs/design/v3/05-free-city.md:400 | 빈 통을 | 구호 통을 | 용어 17 |
| docs/design/v3/05-free-city.md:34 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/05-free-city.md:125 | 동력 덩이와 | 동력원과 | 용어 21 |
| docs/design/v3/05-free-city.md:283 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/05-free-city.md:321 | 동력 덩이와 | 동력원과 | 용어 21 |
| docs/design/v3/05-free-city.md:350 | 동력 덩이를 | 동력원을 | 용어 21 |
| docs/design/v3/05-free-city.md:96 | 바람틀 밭 | 풍력 발전 단지 | 용어 25 |
| docs/design/v3/05-free-city.md:254 | 바람틀 밭을 | 풍력 발전 단지를 | 용어 25 |
| docs/design/v3/05-free-city.md:30 | 바람밭 | 풍력 발전 단지 | 용어 25 |
| docs/design/v3/05-free-city.md:73 | 바람밭 | 풍력 발전 단지 | 용어 25 |
| docs/design/v3/05-free-city.md:73 | 바람밭이 | 풍력 발전 단지가 | 용어 25 |
| docs/design/v3/05-free-city.md:97 | 바람밭을 | 풍력 발전 단지를 | 용어 25 |
| docs/design/v3/05-free-city.md:97 | 바람밭이 | 풍력 발전 단지가 | 용어 25 |
| docs/design/v3/05-free-city.md:97 | 바람밭이 | 풍력 발전 단지가 | 용어 25 |
| docs/design/v3/05-free-city.md:97 | 바람밭 | 풍력 발전 단지 | 용어 25 |
| docs/design/v3/05-free-city.md:378 | 바람밭 | 풍력 발전 단지 | 용어 25 |
| docs/design/v3/05-free-city.md:30 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/05-free-city.md:96 | 바람틀을 | 풍력 발전기를 | 용어 24 |
| docs/design/v3/05-free-city.md:118 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/05-free-city.md:186 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/05-free-city.md:254 | 바람틀이 | 풍력 발전기가 | 용어 24 |
| docs/design/v3/05-free-city.md:281 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/05-free-city.md:320 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/05-free-city.md:378 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/05-free-city.md:396 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/05-free-city.md:118 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/05-free-city.md:392 | 녹은 주머니 | 녹은 땅 | 용어 29 |
| docs/design/v3/05-free-city.md:408 | 녹은 주머니가 | 녹은 땅이 | 용어 29 |
| docs/design/v3/05-free-city.md:392 | 긴 낮 철과 | 낮이 긴 때와 | 용어 30 |
| docs/design/v3/05-free-city.md:73 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/05-free-city.md:73 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/05-free-city.md:97 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/05-free-city.md:97 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/05-free-city.md:267 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/05-free-city.md:340 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/05-free-city.md:392 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/05-free-city.md:113 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/05-free-city.md:113 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/05-free-city.md:300 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/05-free-city.md:338 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/05-free-city.md:340 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/05-free-city.md:454 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/05-free-city.md:565 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/05-free-city.md:34 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:43 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/05-free-city.md:77 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:77 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:98 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:120 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:125 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:125 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:126 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:126 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:127 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:140 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/05-free-city.md:143 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:309 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/05-free-city.md:348 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/05-free-city.md:350 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/05-free-city.md:350 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/05-free-city.md:350 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:350 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:350 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:381 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/05-free-city.md:563 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/05-free-city.md:563 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/05-free-city.md:263 | 배급 증표는 | 배급표는 | 용어 73 |
| docs/design/v3/05-free-city.md:20 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:32 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:49 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:52 | 계약회와 | 협의회와 | 용어 95 |
| docs/design/v3/05-free-city.md:55 | 계약회는 | 협의회는 | 용어 95 |
| docs/design/v3/05-free-city.md:58 | 계약회를 | 협의회를 | 용어 95 |
| docs/design/v3/05-free-city.md:110 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:110 | 계약회는 | 협의회는 | 용어 95 |
| docs/design/v3/05-free-city.md:112 | 계약회를 | 협의회를 | 용어 95 |
| docs/design/v3/05-free-city.md:145 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:151 | 계약회는 | 협의회는 | 용어 95 |
| docs/design/v3/05-free-city.md:151 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:151 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:151 | 계약회는 | 협의회는 | 용어 95 |
| docs/design/v3/05-free-city.md:155 | 계약회를 | 협의회를 | 용어 95 |
| docs/design/v3/05-free-city.md:156 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:156 | 계약회는 | 협의회는 | 용어 95 |
| docs/design/v3/05-free-city.md:156 | 계약회는 | 협의회는 | 용어 95 |
| docs/design/v3/05-free-city.md:158 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:165 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:169 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:169 | 계약회는 | 협의회는 | 용어 95 |
| docs/design/v3/05-free-city.md:173 | 계약회는 | 협의회는 | 용어 95 |
| docs/design/v3/05-free-city.md:271 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:275 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:285 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:298 | 계약회를 | 협의회를 | 용어 95 |
| docs/design/v3/05-free-city.md:300 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:320 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:449 | 계약회를 | 협의회를 | 용어 95 |
| docs/design/v3/05-free-city.md:525 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:555 | 계약회와 | 협의회와 | 용어 95 |
| docs/design/v3/05-free-city.md:555 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/05-free-city.md:111 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/05-free-city.md:147 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/05-free-city.md:155 | 자리주인이 | 주최자가 | 용어 96 |
| docs/design/v3/05-free-city.md:156 | 자리주인은 | 주최자는 | 용어 96 |
| docs/design/v3/05-free-city.md:156 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/05-free-city.md:159 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/05-free-city.md:159 | 자리주인이 | 주최자가 | 용어 96 |
| docs/design/v3/05-free-city.md:160 | 자리주인은 | 주최자는 | 용어 96 |
| docs/design/v3/05-free-city.md:300 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/05-free-city.md:300 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/05-free-city.md:301 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/05-free-city.md:497 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/05-free-city.md:531 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/05-free-city.md:555 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/05-free-city.md:523 | 작업대주 | 작업장 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:30 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:32 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:35 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:36 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:52 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:52 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:53 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:53 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:55 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:55 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:55 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:55 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:59 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:59 | 대주회를 | 대표 회의를 | 용어 98 |
| docs/design/v3/05-free-city.md:59 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:63 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:64 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:64 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:65 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:83 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:83 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:97 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:97 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:104 | 대주회를 | 대표 회의를 | 용어 98 |
| docs/design/v3/05-free-city.md:111 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:111 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:111 | 대주회를 | 대표 회의를 | 용어 98 |
| docs/design/v3/05-free-city.md:111 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:119 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:119 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:126 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:134 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:134 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:141 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:141 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:141 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:141 | 대주회를 | 대표 회의를 | 용어 98 |
| docs/design/v3/05-free-city.md:141 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/05-free-city.md:141 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:225 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:300 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:553 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:559 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:567 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/05-free-city.md:33 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:52 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:53 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:54 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:55 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:56 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:56 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:59 | 대주는 | 대표는 | 용어 97 |
| docs/design/v3/05-free-city.md:91 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:97 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:97 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:111 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:119 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:126 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:134 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:188 | 대주를 | 대표를 | 용어 97 |
| docs/design/v3/05-free-city.md:194 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:195 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:195 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:195 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:200 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:200 | 대주는 | 대표는 | 용어 97 |
| docs/design/v3/05-free-city.md:204 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:210 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:213 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:221 | 대주와 | 대표와 | 용어 97 |
| docs/design/v3/05-free-city.md:222 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:227 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:227 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:227 | 대주는 | 대표는 | 용어 97 |
| docs/design/v3/05-free-city.md:373 | 대주는 | 대표는 | 용어 97 |
| docs/design/v3/05-free-city.md:373 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:501 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:514 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:514 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:523 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:531 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:538 | 대주와 | 대표와 | 용어 97 |
| docs/design/v3/05-free-city.md:567 | 대주 | 대표 | 용어 97 |
| docs/design/v3/05-free-city.md:30 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:31 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:32 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:33 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:34 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:35 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:51 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:51 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:51 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:51 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:52 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:56 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:59 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:59 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:59 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:59 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:61 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:61 | 도장 집안은 | 지분 가문은 | 용어 99 |
| docs/design/v3/05-free-city.md:64 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:71 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:83 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:83 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:91 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:91 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:97 | 도장 집안은 | 지분 가문은 | 용어 99 |
| docs/design/v3/05-free-city.md:104 | 도장 집안은 | 지분 가문은 | 용어 99 |
| docs/design/v3/05-free-city.md:104 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:111 | 도장 집안은 | 지분 가문은 | 용어 99 |
| docs/design/v3/05-free-city.md:119 | 도장 집안은 | 지분 가문은 | 용어 99 |
| docs/design/v3/05-free-city.md:126 | 도장 집안은 | 지분 가문은 | 용어 99 |
| docs/design/v3/05-free-city.md:134 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:141 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:141 | 도장 집안은 | 지분 가문은 | 용어 99 |
| docs/design/v3/05-free-city.md:225 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:225 | 도장 집안은 | 지분 가문은 | 용어 99 |
| docs/design/v3/05-free-city.md:225 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:225 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:514 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:514 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:553 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:567 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/05-free-city.md:30 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:31 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:32 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:34 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:35 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:43 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:53 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:53 | 이름값을 | 평판을 | 용어 100 |
| docs/design/v3/05-free-city.md:53 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:54 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:54 | 이름값은 | 평판은 | 용어 100 |
| docs/design/v3/05-free-city.md:64 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:65 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:97 | 이름값을 | 평판을 | 용어 100 |
| docs/design/v3/05-free-city.md:97 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:104 | 이름값은 | 평판은 | 용어 100 |
| docs/design/v3/05-free-city.md:111 | 이름값을 | 평판을 | 용어 100 |
| docs/design/v3/05-free-city.md:111 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:119 | 이름값은 | 평판은 | 용어 100 |
| docs/design/v3/05-free-city.md:134 | 이름값을 | 평판을 | 용어 100 |
| docs/design/v3/05-free-city.md:141 | 이름값을 | 평판을 | 용어 100 |
| docs/design/v3/05-free-city.md:260 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:300 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:553 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/05-free-city.md:58 | 바깥 자리는 | 외부 직책은 | 용어 101 |
| docs/design/v3/05-free-city.md:59 | 바깥 자리는 | 외부 직책은 | 용어 101 |
| docs/design/v3/05-free-city.md:60 | 바깥 자리 | 외부 직책 | 용어 101 |
| docs/design/v3/05-free-city.md:60 | 바깥 자리 | 외부 직책 | 용어 101 |
| docs/design/v3/05-free-city.md:60 | 바깥 자리는 | 외부 직책은 | 용어 101 |
| docs/design/v3/05-free-city.md:60 | 바깥 자리는 | 외부 직책은 | 용어 101 |
| docs/design/v3/05-free-city.md:61 | 바깥 자리를 | 외부 직책을 | 용어 101 |
| docs/design/v3/05-free-city.md:61 | 바깥 자리 | 외부 직책 | 용어 101 |
| docs/design/v3/05-free-city.md:61 | 바깥 자리가 | 외부 직책이 | 용어 101 |
| docs/design/v3/05-free-city.md:61 | 바깥 자리를 | 외부 직책을 | 용어 101 |
| docs/design/v3/05-free-city.md:61 | 바깥 자리를 | 외부 직책을 | 용어 101 |
| docs/design/v3/05-free-city.md:62 | 바깥 자리 | 외부 직책 | 용어 101 |
| docs/design/v3/05-free-city.md:553 | 바깥 자리 | 외부 직책 | 용어 101 |
| docs/design/v3/05-free-city.md:64 | 도장 묶기 | 세습 결의 | 용어 102 |
| docs/design/v3/05-free-city.md:553 | 도장 묶기)와 | 세습 결의)와 | 용어 102 |
| docs/design/v3/05-free-city.md:64 | 도장을 묶은 | 세습을 결의한 | 용어 102 |
| docs/design/v3/05-free-city.md:104 | 도장을 묶은 | 세습을 결의한 | 용어 102 |
| docs/design/v3/05-free-city.md:141 | 도장을 묶은 | 세습을 결의한 | 용어 102 |
| docs/design/v3/05-free-city.md:142 | 도장을 묶은 | 세습을 결의한 | 용어 102 |
| docs/design/v3/05-free-city.md:559 | 도장을 묶었다 | 세습을 결의했이다 | 용어 102 |
| docs/design/v3/05-free-city.md:36 | 도장을 묶어 | 세습을 결의해 | 용어 102 |
| docs/design/v3/05-free-city.md:83 | 도장을 묶어 | 세습을 결의해 | 용어 102 |
| docs/design/v3/05-free-city.md:79 | 도장을 묶 | 세습을 결의하 | 용어 102 |
| docs/design/v3/05-free-city.md:65 | 바람 몫 | 동점 결정 | 용어 103 |
| docs/design/v3/05-free-city.md:20 | 작업대와 | 작업장과 | 용어 104 |
| docs/design/v3/05-free-city.md:51 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:51 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:58 | 작업대와 | 작업장과 | 용어 104 |
| docs/design/v3/05-free-city.md:59 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:59 | 작업대를 | 작업장을 | 용어 104 |
| docs/design/v3/05-free-city.md:59 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/05-free-city.md:59 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:60 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/05-free-city.md:62 | 작업대를 | 작업장을 | 용어 104 |
| docs/design/v3/05-free-city.md:118 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/05-free-city.md:119 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/05-free-city.md:134 | 작업대다 | 작업장이다 | 용어 104 |
| docs/design/v3/05-free-city.md:180 | 작업대와 | 작업장과 | 용어 104 |
| docs/design/v3/05-free-city.md:182 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:182 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:182 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:184 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:186 | 작업대**다 | 작업장**이다 | 용어 104 |
| docs/design/v3/05-free-city.md:186 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/05-free-city.md:186 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/05-free-city.md:190 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:194 | 작업대를 | 작업장을 | 용어 104 |
| docs/design/v3/05-free-city.md:200 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:221 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:225 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:225 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:225 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:246 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:260 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/05-free-city.md:260 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/05-free-city.md:396 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/05-free-city.md:396 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:400 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:441 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/05-free-city.md:456 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/05-free-city.md:553 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/05-free-city.md:523 | 굴착 틀 대 | 굴착기 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:141 | 굴착대를 | 굴착기 작업장을 | 용어 105 |
| docs/design/v3/05-free-city.md:186 | 굴착대 | 굴착기 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:523 | 굴착대 | 굴착기 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:119 | 부품을 깎는 대와 | 부품 작업장과 | 용어 105 |
| docs/design/v3/05-free-city.md:523 | 부품을 깎는 대와 | 부품 작업장과 | 용어 105 |
| docs/design/v3/05-free-city.md:186 | 모터대 | 모터 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:188 | 모터대와 | 모터 작업장과 | 용어 105 |
| docs/design/v3/05-free-city.md:188 | 모터대는 | 모터 작업장은 | 용어 105 |
| docs/design/v3/05-free-city.md:204 | 모터대 | 모터 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:420 | 모터대 | 모터 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:523 | 모터대와 | 모터 작업장과 | 용어 105 |
| docs/design/v3/05-free-city.md:523 | 바람대 | 풍력 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:119 | 펌프대 | 펌프 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:186 | 펌프대 | 펌프 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:204 | 펌프대 | 펌프 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:523 | 펌프대 | 펌프 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:523 | 바퀴대 | 바퀴 작업장 | 용어 105 |
| docs/design/v3/05-free-city.md:204 | 작업조장은 | 작업반장은 | 용어 108 |
| docs/design/v3/05-free-city.md:445 | 작업조장은 | 작업반장은 | 용어 108 |
| docs/design/v3/05-free-city.md:501 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/05-free-city.md:514 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/05-free-city.md:523 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/05-free-city.md:523 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/05-free-city.md:532 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/05-free-city.md:538 | 작업조장과 | 작업반장과 | 용어 108 |
| docs/design/v3/05-free-city.md:20 | 작업조 | 작업반 | 용어 107 |
| docs/design/v3/05-free-city.md:128 | 작업조는 | 작업반은 | 용어 107 |
| docs/design/v3/05-free-city.md:180 | 작업조 | 작업반 | 용어 107 |
| docs/design/v3/05-free-city.md:202 | 작업조 | 작업반 | 용어 107 |
| docs/design/v3/05-free-city.md:204 | 작업조는 | 작업반은 | 용어 107 |
| docs/design/v3/05-free-city.md:204 | 작업조는 | 작업반은 | 용어 107 |
| docs/design/v3/05-free-city.md:204 | 작업조 | 작업반 | 용어 107 |
| docs/design/v3/05-free-city.md:284 | 작업조와 | 작업반과 | 용어 107 |
| docs/design/v3/05-free-city.md:293 | 작업조 | 작업반 | 용어 107 |
| docs/design/v3/05-free-city.md:326 | 작업조는 | 작업반은 | 용어 107 |
| docs/design/v3/05-free-city.md:533 | 이름난 손 | 이름난 숙련공 | 용어 111 |
| docs/design/v3/05-free-city.md:128 | 보증 잃은 손 | 보증을 잃은 사람 | 용어 112 |
| docs/design/v3/05-free-city.md:128 | 보증 잃은 손"을 | 보증을 잃은 사람"을 | 용어 112 |
| docs/design/v3/05-free-city.md:196 | 견습 | 수습 | 용어 114 |
| docs/design/v3/05-free-city.md:372 | 견습은 | 수습은 | 용어 114 |
| docs/design/v3/05-free-city.md:404 | 견습 | 수습 | 용어 114 |
| docs/design/v3/05-free-city.md:501 | 견습 | 수습 | 용어 114 |
| docs/design/v3/05-free-city.md:524 | 견습 | 수습 | 용어 114 |
| docs/design/v3/05-free-city.md:524 | 견습 | 수습 | 용어 114 |
| docs/design/v3/05-free-city.md:534 | 견습 | 수습 | 용어 114 |
| docs/design/v3/05-free-city.md:538 | 견습은 | 수습은 | 용어 114 |
| docs/design/v3/05-free-city.md:526 | 지킴 몫의 분대장 | 경비 분대장 | 용어 117 |
| docs/design/v3/05-free-city.md:441 | 지킴 몫**을 | 경비 분담**을 | 용어 115 |
| docs/design/v3/05-free-city.md:441 | 지킴 몫을 | 경비 분담을 | 용어 115 |
| docs/design/v3/05-free-city.md:126 | 경계조를 | 경비대를 | 용어 118 |
| docs/design/v3/05-free-city.md:126 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/05-free-city.md:126 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/05-free-city.md:128 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/05-free-city.md:350 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/05-free-city.md:350 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/05-free-city.md:381 | 경계조는 | 경비대는 | 용어 118 |
| docs/design/v3/05-free-city.md:526 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/05-free-city.md:526 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/05-free-city.md:60 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:61 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:63 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:63 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:210 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:213 | 역반장을 | 역 반장을 | 용어 119 |
| docs/design/v3/05-free-city.md:326 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:400 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:481 | 역반장을 | 역 반장을 | 용어 119 |
| docs/design/v3/05-free-city.md:501 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:522 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:522 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:522 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:532 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:533 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/05-free-city.md:538 | 역반장은 | 역 반장은 | 용어 119 |
| docs/design/v3/05-free-city.md:182 | 역반과 | 역 반과 | 용어 119 |
| docs/design/v3/05-free-city.md:30 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/05-free-city.md:93 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/05-free-city.md:97 | 바람지기가 | 발전소장이 | 용어 121 |
| docs/design/v3/05-free-city.md:97 | 바람지기가 | 발전소장이 | 용어 121 |
| docs/design/v3/05-free-city.md:97 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/05-free-city.md:497 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/05-free-city.md:34 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/05-free-city.md:122 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/05-free-city.md:126 | 경계장은 | 경비대장은 | 용어 122 |
| docs/design/v3/05-free-city.md:126 | 경계장은 | 경비대장은 | 용어 122 |
| docs/design/v3/05-free-city.md:126 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/05-free-city.md:126 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/05-free-city.md:126 | 경계장은 | 경비대장은 | 용어 122 |
| docs/design/v3/05-free-city.md:497 | 경계장)는 | 경비대장)은 | 용어 122 |
| docs/design/v3/05-free-city.md:32 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/05-free-city.md:107 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/05-free-city.md:111 | 장주가 | 상인회장이 | 용어 123 |
| docs/design/v3/05-free-city.md:111 | 장주가 | 상인회장이 | 용어 123 |
| docs/design/v3/05-free-city.md:111 | 장주를 | 상인회장을 | 용어 123 |
| docs/design/v3/05-free-city.md:111 | 장주는 | 상인회장은 | 용어 123 |
| docs/design/v3/05-free-city.md:111 | 장주는 | 상인회장은 | 용어 123 |
| docs/design/v3/05-free-city.md:111 | 장주는 | 상인회장은 | 용어 123 |
| docs/design/v3/05-free-city.md:300 | 장주가 | 상인회장이 | 용어 123 |
| docs/design/v3/05-free-city.md:300 | 장주는 | 상인회장은 | 용어 123 |
| docs/design/v3/05-free-city.md:382 | 장주는 | 상인회장은 | 용어 123 |
| docs/design/v3/05-free-city.md:497 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/05-free-city.md:104 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/05-free-city.md:104 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/05-free-city.md:104 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/05-free-city.md:104 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/05-free-city.md:104 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/05-free-city.md:520 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/05-free-city.md:75 | 장터 집안 | 상인 가문 | 용어 125 |
| docs/design/v3/05-free-city.md:111 | 장터 집안 | 상인 가문 | 용어 125 |
| docs/design/v3/05-free-city.md:382 | 장터 집안 | 상인 가문 | 용어 125 |
| docs/design/v3/05-free-city.md:525 | 장터 집안 | 상인 가문 | 용어 125 |
| docs/design/v3/05-free-city.md:533 | 장터 집안 | 상인 가문 | 용어 125 |
| docs/design/v3/05-free-city.md:200 | 이을 자식이 | 후계자가 | 용어 128 |
| docs/design/v3/05-free-city.md:408 | 이을 자식 | 후계자 | 용어 128 |
| docs/design/v3/05-free-city.md:514 | 이을 자식 | 후계자 | 용어 128 |
| docs/design/v3/05-free-city.md:520 | 이을 자식 | 후계자 | 용어 128 |
| docs/design/v3/05-free-city.md:531 | 이을 자식 | 후계자 | 용어 128 |
| docs/design/v3/05-free-city.md:525 | 짐꾼 무리의 우두머리 | 짐꾼 반장 | 용어 130 |
| docs/design/v3/05-free-city.md:525 | 환전꾼 | 환전상 | 용어 131 |
| docs/design/v3/05-free-city.md:242 | 판공과 | 기판 수리공과 | 용어 133 |
| docs/design/v3/05-free-city.md:254 | 판공 | 기판 수리공 | 용어 133 |
| docs/design/v3/05-free-city.md:141 | 나무조장 | 벌목 반장 | 용어 135 |
| docs/design/v3/05-free-city.md:523 | 나무조장과 | 벌목 반장과 | 용어 135 |
| docs/design/v3/05-free-city.md:140 | 나무조는 | 벌목조는 | 용어 135 |
| docs/design/v3/05-free-city.md:141 | 나무조를 | 벌목조를 | 용어 135 |
| docs/design/v3/05-free-city.md:31 | 궤도 수레 | 궤도차 | 용어 140 |
| docs/design/v3/05-free-city.md:103 | 궤도 수레를 | 궤도차를 | 용어 140 |
| docs/design/v3/05-free-city.md:103 | 궤도 수레 | 궤도차 | 용어 140 |
| docs/design/v3/05-free-city.md:280 | 궤도 수레 | 궤도차 | 용어 140 |
| docs/design/v3/05-free-city.md:313 | 궤도 수레 | 궤도차 | 용어 140 |
| docs/design/v3/05-free-city.md:318 | 궤도 수레와 | 궤도차와 | 용어 140 |
| docs/design/v3/05-free-city.md:564 | 궤도 수레 | 궤도차 | 용어 140 |
| docs/design/v3/05-free-city.md:242 | 맞춤이 | 이식 정비사 | 용어 175 |
| docs/design/v3/05-free-city.md:254 | 맞춤이 | 이식 정비사 | 용어 175 |
| docs/design/v3/06-arc.md:583 | 섬유당 통지기 | 당화 탱크 관리인 | 용어 166 |
| docs/design/v3/06-arc.md:377 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/06-arc.md:453 | 섬유당 통으로 | 당화 탱크로 | 용어 2 |
| docs/design/v3/06-arc.md:445 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/06-arc.md:463 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/06-arc.md:583 | 빛밭지기 | 온실 관리인 | 용어 170 |
| docs/design/v3/06-arc.md:406 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/06-arc.md:445 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/06-arc.md:463 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/06-arc.md:130 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:144 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:362 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:383 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:385 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:385 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:387 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:389 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:390 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:391 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:392 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:393 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:454 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:561 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:572 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:572 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:572 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:572 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:584 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:592 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.md:368 | 바침 | 헌납 | 용어 18 |
| docs/design/v3/06-arc.md:360 | 하루 충전과 | 하루 충전량과 | 용어 19 |
| docs/design/v3/06-arc.md:362 | 하루 충전**은 | 하루 충전량**은 | 용어 19 |
| docs/design/v3/06-arc.md:362 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/06-arc.md:362 | 하루 충전과 | 하루 충전량과 | 용어 19 |
| docs/design/v3/06-arc.md:390 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/06-arc.md:406 | 하루 충전과 | 하루 충전량과 | 용어 19 |
| docs/design/v3/06-arc.md:584 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/06-arc.md:190 | 정비 차례가 | 정비 순번이 | 용어 20 |
| docs/design/v3/06-arc.md:196 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/06-arc.md:351 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/06-arc.md:360 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/06-arc.md:362 | 정비 차례**는 | 정비 순번**은 | 용어 20 |
| docs/design/v3/06-arc.md:362 | 정비 차례로 | 정비 순번으로 | 용어 20 |
| docs/design/v3/06-arc.md:362 | 정비 차례를 | 정비 순번을 | 용어 20 |
| docs/design/v3/06-arc.md:390 | 정비 차례를 | 정비 순번을 | 용어 20 |
| docs/design/v3/06-arc.md:391 | 정비 차례를 | 정비 순번을 | 용어 20 |
| docs/design/v3/06-arc.md:392 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/06-arc.md:406 | 정비 차례를 | 정비 순번을 | 용어 20 |
| docs/design/v3/06-arc.md:470 | 정비 차례를 | 정비 순번을 | 용어 20 |
| docs/design/v3/06-arc.md:584 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/06-arc.md:585 | 동력 덩이 캐는 사람 | 동력원 회수 일꾼 | 용어 22 |
| docs/design/v3/06-arc.md:350 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/06-arc.md:358 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/06-arc.md:358 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/06-arc.md:393 | 동력 덩이를 | 동력원을 | 용어 21 |
| docs/design/v3/06-arc.md:404 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/06-arc.md:585 | 섬유 캐는 사람 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/06-arc.md:321 | 바람틀과 | 풍력 발전기와 | 용어 24 |
| docs/design/v3/06-arc.md:350 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/06-arc.md:358 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/06-arc.md:358 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/06-arc.md:401 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/06-arc.md:582 | 열 펌프지기 | 열펌프 정비공 | 용어 167 |
| docs/design/v3/06-arc.md:321 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/06-arc.md:401 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/06-arc.md:582 | 수차지기 | 수차 정비공 | 용어 169 |
| docs/design/v3/06-arc.md:445 | 긴 낮 철과 | 낮이 긴 때와 | 용어 30 |
| docs/design/v3/06-arc.md:118 | 긴 밤 철이 | 밤이 긴 때가 | 용어 30 |
| docs/design/v3/06-arc.md:249 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/06-arc.md:445 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/06-arc.md:640 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/06-arc.md:32 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/06-arc.md:137 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/06-arc.md:151 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/06-arc.md:337 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/06-arc.md:338 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/06-arc.md:392 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/06-arc.md:402 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/06-arc.md:507 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/06-arc.md:508 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/06-arc.md:130 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/06-arc.md:151 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/06-arc.md:404 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/06-arc.md:572 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/06-arc.md:585 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/06-arc.md:20 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:32 | 본역**은 | 거점 역**은 | 용어 43 |
| docs/design/v3/06-arc.md:32 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:51 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:55 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:128 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:135 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:142 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:149 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:200 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:249 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:366 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:516 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:516 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:579 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:628 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/06-arc.md:582 | 취수구지기 | 취수구 관리인 | 용어 75 |
| docs/design/v3/06-arc.md:585 | 고물꾼 | 넝마주이 | 용어 76 |
| docs/design/v3/06-arc.md:331 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/06-arc.md:331 | 자리주인을 | 주최자를 | 용어 96 |
| docs/design/v3/06-arc.md:143 | 작업조와 | 작업반과 | 용어 107 |
| docs/design/v3/06-arc.md:305 | 작업조가 | 작업반이 | 용어 107 |
| docs/design/v3/06-arc.md:49 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:51 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:67 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:93 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:99 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:116 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:118 | 네 곁집 자리는 | 가문 수장 회의는 | 용어 154 |
| docs/design/v3/06-arc.md:249 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:469 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:589 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:612 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:644 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/06-arc.md:32 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:67 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:93 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:93 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:93 | 곁집장은 | 가문 수장은 | 용어 153 |
| docs/design/v3/06-arc.md:99 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:109 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:114 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:118 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:118 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:154 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:158 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:165 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:167 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:331 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:435 | 곁집장과 | 가문 수장과 | 용어 153 |
| docs/design/v3/06-arc.md:488 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:488 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:555 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:578 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:578 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:578 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:578 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:578 | 곁집장은 | 가문 수장은 | 용어 153 |
| docs/design/v3/06-arc.md:589 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:606 | 곁집장"을 | 가문 수장"을 | 용어 153 |
| docs/design/v3/06-arc.md:606 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:614 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:614 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:614 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:656 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:656 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.md:578 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/06-arc.md:578 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/06-arc.md:578 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/06-arc.md:606 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/06-arc.md:606 | 곁집 어른"은 | 가문 원로"는 | 용어 155 |
| docs/design/v3/06-arc.md:76 | 곁 섬김**으로 | 오랜 보좌**로 | 용어 157 |
| docs/design/v3/06-arc.md:87 | 곁 섬김 | 오랜 보좌 | 용어 157 |
| docs/design/v3/06-arc.md:613 | 곁 섬김으로 | 오랜 보좌로 | 용어 157 |
| docs/design/v3/06-arc.md:425 | 곁집 띠 | 가문 완장 | 용어 158 |
| docs/design/v3/06-arc.md:18 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:20 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:22 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:23 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:24 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:25 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:55 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:55 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:55 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:65 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:67 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:67 | 곁집을 | 측근 가문을 | 용어 152 |
| docs/design/v3/06-arc.md:76 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/06-arc.md:76 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:79 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:81 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/06-arc.md:81 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:87 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:89 | 곁집을 | 측근 가문을 | 용어 152 |
| docs/design/v3/06-arc.md:89 | 곁집을 | 측근 가문을 | 용어 152 |
| docs/design/v3/06-arc.md:89 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/06-arc.md:91 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:93 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:93 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:114 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:118 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:120 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:124 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:126 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:129 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/06-arc.md:131 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/06-arc.md:131 | 곁집을 | 측근 가문을 | 용어 152 |
| docs/design/v3/06-arc.md:133 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:136 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/06-arc.md:140 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:144 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/06-arc.md:145 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:145 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/06-arc.md:145 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:147 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:152 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:165 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:167 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:194 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:208 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:305 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:306 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:342 | 곁집과 | 측근 가문과 | 용어 152 |
| docs/design/v3/06-arc.md:366 | 곁집과 | 측근 가문과 | 용어 152 |
| docs/design/v3/06-arc.md:370 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:379 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:385 | 곁집과 | 측근 가문과 | 용어 152 |
| docs/design/v3/06-arc.md:385 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:385 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:425 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:425 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:435 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:435 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:454 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:459 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:469 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:488 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:488 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:489 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:490 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:504 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:520 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:520 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:522 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:522 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:554 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:578 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:613 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/06-arc.md:628 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:636 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/06-arc.md:111 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:114 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:182 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:183 | 정비장과 | 정비 반장과 | 용어 159 |
| docs/design/v3/06-arc.md:194 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:200 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:222 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:244 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:342 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:351 | 정비장과 | 정비 반장과 | 용어 159 |
| docs/design/v3/06-arc.md:362 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:366 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:436 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:521 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:561 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:579 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:579 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:579 | 정비장과 | 정비 반장과 | 용어 159 |
| docs/design/v3/06-arc.md:579 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:589 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:636 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:636 | 정비장은 | 정비 반장은 | 용어 159 |
| docs/design/v3/06-arc.md:655 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:658 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.md:112 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:204 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:206 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:208 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:210 | 미세례자는 | 세례 전 신도는 | 용어 161 |
| docs/design/v3/06-arc.md:244 | 미세례자는 | 세례 전 신도는 | 용어 161 |
| docs/design/v3/06-arc.md:259 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:259 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:267 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:377 | 미세례자는 | 세례 전 신도는 | 용어 161 |
| docs/design/v3/06-arc.md:420 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:438 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:453 | 미세례자는 | 세례 전 신도는 | 용어 161 |
| docs/design/v3/06-arc.md:471 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:489 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.md:172 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:194 | 세례자는 | 세례 신도는 | 용어 160 |
| docs/design/v3/06-arc.md:194 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:194 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:196 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:196 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:200 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:214 | 세례자는 | 세례 신도는 | 용어 160 |
| docs/design/v3/06-arc.md:244 | 세례자는 | 세례 신도는 | 용어 160 |
| docs/design/v3/06-arc.md:267 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:306 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:350 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:362 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:378 | 세례자는 | 세례 신도는 | 용어 160 |
| docs/design/v3/06-arc.md:437 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:489 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:521 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:580 | 세례자를 | 세례 신도를 | 용어 160 |
| docs/design/v3/06-arc.md:604 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/06-arc.md:584 | 세례록 기록꾼 | 세례 명부 기록원 | 용어 163 |
| docs/design/v3/06-arc.md:200 | 세례록**이라 | 세례 명부**라 | 용어 162 |
| docs/design/v3/06-arc.md:202 | 세례록 | 세례 명부 | 용어 162 |
| docs/design/v3/06-arc.md:208 | 세례록 | 세례 명부 | 용어 162 |
| docs/design/v3/06-arc.md:244 | 세례록을 | 세례 명부를 | 용어 162 |
| docs/design/v3/06-arc.md:248 | 세례록 | 세례 명부 | 용어 162 |
| docs/design/v3/06-arc.md:615 | 세례록 | 세례 명부 | 용어 162 |
| docs/design/v3/06-arc.md:51 | 말지기**다 | 대변인**이다 | 용어 164 |
| docs/design/v3/06-arc.md:51 | 말지기는 | 대변인은 | 용어 164 |
| docs/design/v3/06-arc.md:51 | 말지기가 | 대변인이 | 용어 164 |
| docs/design/v3/06-arc.md:59 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/06-arc.md:584 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/06-arc.md:584 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/06-arc.md:584 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/06-arc.md:603 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/06-arc.md:385 | 셈꾼과 | 회계원과 | 용어 165 |
| docs/design/v3/06-arc.md:584 | 셈꾼 | 회계원 | 용어 165 |
| docs/design/v3/06-arc.md:592 | 셈꾼 | 회계원 | 용어 165 |
| docs/design/v3/06-arc.md:582 | 출입구지기 | 출입구 경비원 | 용어 168 |
| docs/design/v3/06-arc.md:583 | 버섯 굴지기 | 버섯 재배 일꾼 | 용어 171 |
| docs/design/v3/06-arc.md:59 | 돌봄이 | 간병인 | 용어 172 |
| docs/design/v3/06-arc.md:580 | 돌봄이 | 간병인 | 용어 172 |
| docs/design/v3/06-arc.md:59 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/06-arc.md:331 | 교섭인이 | 교섭 담당자가 | 용어 173 |
| docs/design/v3/06-arc.md:385 | 교섭인이 | 교섭 담당자가 | 용어 173 |
| docs/design/v3/06-arc.md:584 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/06-arc.md:584 | 교섭인과 | 교섭 담당자와 | 용어 173 |
| docs/design/v3/06-arc.md:584 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/06-arc.md:488 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/06-arc.md:581 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/06-arc.md:581 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/06-arc.md:581 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/06-arc.md:603 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/06-arc.md:222 | 다시 맞춤 | 재이식 | 용어 176 |
| docs/design/v3/06-arc.md:222 | 다시 맞춤을 | 재이식을 | 용어 176 |
| docs/design/v3/06-arc.md:322 | 다시 맞춤 | 재이식 | 용어 176 |
| docs/design/v3/06-arc.md:330 | 다시 맞춤은 | 재이식은 | 용어 176 |
| docs/design/v3/06-arc.md:424 | 부위 수 땀 | 부위 표시 땀 | 용어 177 |
| docs/design/v3/06-arc.md:437 | 부위 수 땀 | 부위 표시 땀 | 용어 177 |
| docs/design/v3/06-arc.md:418 | 정비 틈 | 트임 | 용어 178 |
| docs/design/v3/06-arc.md:420 | 정비 틈 | 트임 | 용어 178 |
| docs/design/v3/06-arc.md:435 | 정비 틈 | 트임 | 용어 178 |
| docs/design/v3/06-arc.md:437 | 정비 틈을 | 트임을 | 용어 178 |
| docs/design/v3/06-arc.md:247 | 한 솥 | 한솥밥 | 용어 180 |
| docs/design/v3/06-arc.md:465 | 한 솥 | 한솥밥 | 용어 180 |
| docs/design/v3/06-arc.md:465 | 한 솥 | 한솥밥 | 용어 180 |
| docs/design/v3/07-people-and-war.md:488 | 섬유당 통지기 | 당화 탱크 관리인 | 용어 166 |
| docs/design/v3/07-people-and-war.md:715 | 섬유당 통지기 | 당화 탱크 관리인 | 용어 166 |
| docs/design/v3/07-people-and-war.md:731 | 섬유당 통지기 | 당화 탱크 관리인 | 용어 166 |
| docs/design/v3/07-people-and-war.md:488 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/07-people-and-war.md:715 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/07-people-and-war.md:731 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/07-people-and-war.md:1056 | 섬유당 통과 | 당화 탱크와 | 용어 2 |
| docs/design/v3/07-people-and-war.md:557 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/07-people-and-war.md:489 | 빛밭 경작 | 온실 경작 | 용어 4 |
| docs/design/v3/07-people-and-war.md:715 | 빛밭 경작 | 온실 경작 | 용어 4 |
| docs/design/v3/07-people-and-war.md:731 | 빛밭 경작 | 온실 경작 | 용어 4 |
| docs/design/v3/07-people-and-war.md:489 | 빛밭지기 | 온실 관리인 | 용어 170 |
| docs/design/v3/07-people-and-war.md:731 | 빛밭지기 | 온실 관리인 | 용어 170 |
| docs/design/v3/07-people-and-war.md:489 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/07-people-and-war.md:557 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/07-people-and-war.md:715 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/07-people-and-war.md:1056 | 빛밭을 | 온실을 | 용어 3 |
| docs/design/v3/07-people-and-war.md:1211 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/07-people-and-war.md:286 | 화덕 킬로)을 | 난방 기여분)을 | 용어 5 |
| docs/design/v3/07-people-and-war.md:359 | 화덕 킬로로 | 난방 기여분으로 | 용어 5 |
| docs/design/v3/07-people-and-war.md:346 | 보증판의 수 | 보증 건수 | 용어 13 |
| docs/design/v3/07-people-and-war.md:59 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/07-people-and-war.md:160 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/07-people-and-war.md:200 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/07-people-and-war.md:351 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/07-people-and-war.md:540 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/07-people-and-war.md:722 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/07-people-and-war.md:351 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/07-people-and-war.md:540 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/07-people-and-war.md:563 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/07-people-and-war.md:722 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/07-people-and-war.md:732 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/07-people-and-war.md:430 | 바꿈터는 | 교환소는 | 용어 16 |
| docs/design/v3/07-people-and-war.md:533 | 동력 덩이 채집 | 동력원 회수 | 용어 22 |
| docs/design/v3/07-people-and-war.md:725 | 동력 덩이 채집 | 동력원 회수 | 용어 22 |
| docs/design/v3/07-people-and-war.md:733 | 동력 덩이 채집 | 동력원 회수 | 용어 22 |
| docs/design/v3/07-people-and-war.md:533 | 동력 덩이 캐는 사람 | 동력원 회수 일꾼 | 용어 22 |
| docs/design/v3/07-people-and-war.md:733 | 동력 덩이 캐는 사람 | 동력원 회수 일꾼 | 용어 22 |
| docs/design/v3/07-people-and-war.md:429 | 동력 덩이를 | 동력원을 | 용어 21 |
| docs/design/v3/07-people-and-war.md:429 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/07-people-and-war.md:430 | 동력 덩이를 | 동력원을 | 용어 21 |
| docs/design/v3/07-people-and-war.md:431 | 동력 덩이를 | 동력원을 | 용어 21 |
| docs/design/v3/07-people-and-war.md:1078 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/07-people-and-war.md:1078 | 동력 덩이는 | 동력원은 | 용어 21 |
| docs/design/v3/07-people-and-war.md:1132 | 동력 덩이 | 동력원 | 용어 21 |
| docs/design/v3/07-people-and-war.md:1138 | 동력 덩이를 | 동력원을 | 용어 21 |
| docs/design/v3/07-people-and-war.md:529 | 섬유 채집꾼 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/07-people-and-war.md:715 | 섬유 채집꾼 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/07-people-and-war.md:529 | 섬유 캐는 사람 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/07-people-and-war.md:733 | 섬유 캐는 사람 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/07-people-and-war.md:518 | 바람틀 정비공 | 풍력 발전기 정비공 | 용어 132 |
| docs/design/v3/07-people-and-war.md:349 | 바람밭 | 풍력 발전 단지 | 용어 25 |
| docs/design/v3/07-people-and-war.md:358 | 바람밭 | 풍력 발전 단지 | 용어 25 |
| docs/design/v3/07-people-and-war.md:518 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/07-people-and-war.md:1056 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/07-people-and-war.md:1151 | 바람틀이 | 풍력 발전기가 | 용어 24 |
| docs/design/v3/07-people-and-war.md:1211 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/07-people-and-war.md:519 | 열 펌프지기 | 열펌프 정비공 | 용어 167 |
| docs/design/v3/07-people-and-war.md:730 | 열 펌프지기 | 열펌프 정비공 | 용어 167 |
| docs/design/v3/07-people-and-war.md:519 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.md:519 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.md:715 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.md:715 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.md:730 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.md:1056 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.md:520 | 수차지기 | 수차 정비공 | 용어 169 |
| docs/design/v3/07-people-and-war.md:730 | 수차지기 | 수차 정비공 | 용어 169 |
| docs/design/v3/07-people-and-war.md:499 | 메탄 통 | 혐기성 소화조 | 용어 28 |
| docs/design/v3/07-people-and-war.md:499 | 메탄 통 | 혐기성 소화조 | 용어 28 |
| docs/design/v3/07-people-and-war.md:1040 | 긴 낮 철 | 낮이 긴 때 | 용어 30 |
| docs/design/v3/07-people-and-war.md:1175 | 긴 낮 철 | 낮이 긴 때 | 용어 30 |
| docs/design/v3/07-people-and-war.md:1204 | 긴 낮 철과 | 낮이 긴 때와 | 용어 30 |
| docs/design/v3/07-people-and-war.md:1208 | 긴 낮 철 | 낮이 긴 때 | 용어 30 |
| docs/design/v3/07-people-and-war.md:1211 | 긴 낮 철 | 낮이 긴 때 | 용어 30 |
| docs/design/v3/07-people-and-war.md:1041 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/07-people-and-war.md:1175 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/07-people-and-war.md:1204 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/07-people-and-war.md:1208 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/07-people-and-war.md:1211 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/07-people-and-war.md:16 | 겨울의 톱니 | 겨울의 래칫 | 용어 31 |
| docs/design/v3/07-people-and-war.md:24 | 겨울의 톱니 | 겨울의 래칫 | 용어 31 |
| docs/design/v3/07-people-and-war.md:1202 | 겨울의 톱니 | 겨울의 래칫 | 용어 31 |
| docs/design/v3/07-people-and-war.md:1204 | 겨울의 톱니 | 겨울의 래칫 | 용어 31 |
| docs/design/v3/07-people-and-war.md:1248 | 톱니 | 래칫 | 용어 31 |
| docs/design/v3/07-people-and-war.md:495 | 눈 굴 지기 | 출입구 경비 | 용어 33 |
| docs/design/v3/07-people-and-war.md:715 | 눈 굴 지기 | 출입구 경비 | 용어 33 |
| docs/design/v3/07-people-and-war.md:730 | 눈 굴 지기 | 출입구 경비 | 용어 33 |
| docs/design/v3/07-people-and-war.md:1172 | 출입구 굴 | 출입구 수직갱 | 용어 32 |
| docs/design/v3/07-people-and-war.md:558 | 눈 굴 | 출입구 수직갱 | 용어 32 |
| docs/design/v3/07-people-and-war.md:1031 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/07-people-and-war.md:1039 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/07-people-and-war.md:1141 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/07-people-and-war.md:1154 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/07-people-and-war.md:64 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/07-people-and-war.md:64 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/07-people-and-war.md:64 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:348 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/07-people-and-war.md:357 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/07-people-and-war.md:427 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/07-people-and-war.md:429 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/07-people-and-war.md:429 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:430 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:431 | 테두리는 | 봉쇄선은 | 용어 37 |
| docs/design/v3/07-people-and-war.md:530 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:530 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:530 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:724 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:733 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:733 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:1078 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:1136 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:1141 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.md:117 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/07-people-and-war.md:129 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/07-people-and-war.md:129 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/07-people-and-war.md:129 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/07-people-and-war.md:131 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/07-people-and-war.md:131 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/07-people-and-war.md:131 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/07-people-and-war.md:143 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/07-people-and-war.md:175 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/07-people-and-war.md:215 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:256 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:332 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:333 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:614 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:665 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:687 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:704 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:714 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:715 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:716 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:1044 | 등재민은 | 등록 주민은 | 용어 67 |
| docs/design/v3/07-people-and-war.md:1072 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:1072 | 등재민은 | 등록 주민은 | 용어 67 |
| docs/design/v3/07-people-and-war.md:1085 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:1092 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.md:260 | 대물림 의석 | 세습 의석 | 용어 70 |
| docs/design/v3/07-people-and-war.md:1045 | 초청 증표가 | 초청장이 | 용어 74 |
| docs/design/v3/07-people-and-war.md:1045 | 초청 증표 | 초청장 | 용어 74 |
| docs/design/v3/07-people-and-war.md:522 | 취수구지기 | 취수구 관리인 | 용어 75 |
| docs/design/v3/07-people-and-war.md:730 | 취수구지기 | 취수구 관리인 | 용어 75 |
| docs/design/v3/07-people-and-war.md:528 | 고물 채집꾼 | 넝마주이 | 용어 76 |
| docs/design/v3/07-people-and-war.md:528 | 고물꾼 | 넝마주이 | 용어 76 |
| docs/design/v3/07-people-and-war.md:733 | 고물꾼 | 넝마주이 | 용어 76 |
| docs/design/v3/07-people-and-war.md:108 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.md:160 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.md:322 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.md:536 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.md:536 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.md:537 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.md:711 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.md:711 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.md:66 | 교섭자 | 교섭 담당자 | 용어 78 |
| docs/design/v3/07-people-and-war.md:387 | 교섭자 | 교섭 담당자 | 용어 78 |
| docs/design/v3/07-people-and-war.md:687 | 보건 일꾼 | 보건 요원 | 용어 79 |
| docs/design/v3/07-people-and-war.md:712 | 보건 일꾼 | 보건 요원 | 용어 79 |
| docs/design/v3/07-people-and-war.md:1193 | 국회의원 근위청 | 국회의원 호위대 본부 | 용어 80 |
| docs/design/v3/07-people-and-war.md:1193 | 근위 수행대 | 호위 수행대 | 용어 81 |
| docs/design/v3/07-people-and-war.md:1132 | 차량고 | 차고 | 용어 92 |
| docs/design/v3/07-people-and-war.md:66 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/07-people-and-war.md:1089 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/07-people-and-war.md:1090 | 계약회를 | 협의회를 | 용어 95 |
| docs/design/v3/07-people-and-war.md:1090 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/07-people-and-war.md:200 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/07-people-and-war.md:344 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/07-people-and-war.md:1090 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/07-people-and-war.md:286 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/07-people-and-war.md:344 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/07-people-and-war.md:345 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/07-people-and-war.md:349 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/07-people-and-war.md:358 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/07-people-and-war.md:359 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/07-people-and-war.md:62 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:108 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:111 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:200 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:200 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:216 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:286 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:286 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:286 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:345 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:346 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:349 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:350 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:350 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:358 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:359 | 대주는 | 대표는 | 용어 97 |
| docs/design/v3/07-people-and-war.md:640 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:673 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:688 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:688 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:720 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:720 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:720 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:720 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.md:286 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/07-people-and-war.md:286 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/07-people-and-war.md:344 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/07-people-and-war.md:345 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/07-people-and-war.md:346 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/07-people-and-war.md:347 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/07-people-and-war.md:348 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/07-people-and-war.md:349 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/07-people-and-war.md:358 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/07-people-and-war.md:359 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/07-people-and-war.md:286 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/07-people-and-war.md:286 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/07-people-and-war.md:344 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/07-people-and-war.md:345 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/07-people-and-war.md:348 | 이름값을 | 평판을 | 용어 100 |
| docs/design/v3/07-people-and-war.md:349 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/07-people-and-war.md:358 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/07-people-and-war.md:359 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/07-people-and-war.md:359 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/07-people-and-war.md:359 | 이름값을 | 평판을 | 용어 100 |
| docs/design/v3/07-people-and-war.md:286 | 도장을 묶은 | 세습을 결의한 | 용어 102 |
| docs/design/v3/07-people-and-war.md:359 | 도장을 묶은 | 세습을 결의한 | 용어 102 |
| docs/design/v3/07-people-and-war.md:62 | 작업대를 | 작업장을 | 용어 104 |
| docs/design/v3/07-people-and-war.md:286 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/07-people-and-war.md:286 | 작업대와 | 작업장과 | 용어 104 |
| docs/design/v3/07-people-and-war.md:1077 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/07-people-and-war.md:1077 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/07-people-and-war.md:1125 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/07-people-and-war.md:1138 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/07-people-and-war.md:1152 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/07-people-and-war.md:62 | 통신대 | 통신 작업장 | 용어 105 |
| docs/design/v3/07-people-and-war.md:350 | 통신대 | 통신 작업장 | 용어 105 |
| docs/design/v3/07-people-and-war.md:720 | 통신대 | 통신 작업장 | 용어 105 |
| docs/design/v3/07-people-and-war.md:60 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:61 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:111 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:200 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:200 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:216 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:352 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:352 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:353 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:353 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:641 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:673 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:688 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:688 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:720 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:720 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:720 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:724 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.md:1089 | 작업조"로 | 작업반"으로 | 용어 107 |
| docs/design/v3/07-people-and-war.md:200 | 이름난 손 | 이름난 숙련공 | 용어 111 |
| docs/design/v3/07-people-and-war.md:111 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.md:189 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.md:216 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.md:245 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.md:644 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.md:673 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.md:688 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.md:688 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.md:721 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.md:721 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.md:688 | 지킴 몫의 분대장 | 경비 분대장 | 용어 117 |
| docs/design/v3/07-people-and-war.md:724 | 지킴 몫의 분대장 | 경비 분대장 | 용어 117 |
| docs/design/v3/07-people-and-war.md:480 | 지킴 몫 | 경비 분담 | 용어 115 |
| docs/design/v3/07-people-and-war.md:724 | 지킴 몫 | 경비 분담 | 용어 115 |
| docs/design/v3/07-people-and-war.md:1125 | 지킴 몫과 | 경비 분담과 | 용어 115 |
| docs/design/v3/07-people-and-war.md:1125 | 지킴 몫을 | 경비 분담을 | 용어 115 |
| docs/design/v3/07-people-and-war.md:1128 | 지킴 몫 | 경비 분담 | 용어 115 |
| docs/design/v3/07-people-and-war.md:1152 | 지킴 몫과 | 경비 분담과 | 용어 115 |
| docs/design/v3/07-people-and-war.md:1152 | 지킴 몫 | 경비 분담 | 용어 115 |
| docs/design/v3/07-people-and-war.md:480 | 지킴 손 | 경비원 | 용어 116 |
| docs/design/v3/07-people-and-war.md:724 | 지킴 손 | 경비원 | 용어 116 |
| docs/design/v3/07-people-and-war.md:480 | 경계조원 | 경비대원 | 용어 118 |
| docs/design/v3/07-people-and-war.md:64 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/07-people-and-war.md:688 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/07-people-and-war.md:724 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/07-people-and-war.md:724 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/07-people-and-war.md:110 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:158 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:200 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:200 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:216 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:286 | 역반장은 | 역 반장은 | 용어 119 |
| docs/design/v3/07-people-and-war.md:461 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:636 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:671 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:688 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:688 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:688 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:688 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:719 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.md:461 | 역반 운영 | 역 운영 | 용어 120 |
| docs/design/v3/07-people-and-war.md:719 | 역반 운영 | 역 운영 | 용어 120 |
| docs/design/v3/07-people-and-war.md:349 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/07-people-and-war.md:349 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/07-people-and-war.md:634 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/07-people-and-war.md:671 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/07-people-and-war.md:348 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/07-people-and-war.md:348 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/07-people-and-war.md:430 | 경계장을 | 경비대장을 | 용어 122 |
| docs/design/v3/07-people-and-war.md:632 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/07-people-and-war.md:670 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/07-people-and-war.md:96 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/07-people-and-war.md:344 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/07-people-and-war.md:344 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/07-people-and-war.md:344 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/07-people-and-war.md:356 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/07-people-and-war.md:630 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/07-people-and-war.md:669 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/07-people-and-war.md:1062 | 장주가 | 상인회장이 | 용어 123 |
| docs/design/v3/07-people-and-war.md:108 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.md:216 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.md:459 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.md:638 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.md:672 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.md:688 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.md:688 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.md:719 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.md:200 | 장터 집안 | 상인 가문 | 용어 125 |
| docs/design/v3/07-people-and-war.md:503 | 장터 집안 | 상인 가문 | 용어 125 |
| docs/design/v3/07-people-and-war.md:722 | 장터 집안 | 상인 가문 | 용어 125 |
| docs/design/v3/07-people-and-war.md:524 | 부품 가공공 | 부품 가공 기능공 | 용어 127 |
| docs/design/v3/07-people-and-war.md:108 | 이을 자식 | 후계자 | 용어 128 |
| docs/design/v3/07-people-and-war.md:200 | 이을 자식 | 후계자 | 용어 128 |
| docs/design/v3/07-people-and-war.md:279 | 이을 자식 | 후계자 | 용어 128 |
| docs/design/v3/07-people-and-war.md:688 | 이을 자식 | 후계자 | 용어 128 |
| docs/design/v3/07-people-and-war.md:718 | 이을 자식 | 후계자 | 용어 128 |
| docs/design/v3/07-people-and-war.md:507 | 급수 배분인 | 급수 관리인 | 용어 129 |
| docs/design/v3/07-people-and-war.md:722 | 짐꾼 무리의 우두머리 | 짐꾼 반장 | 용어 130 |
| docs/design/v3/07-people-and-war.md:508 | 환전꾼 | 환전상 | 용어 131 |
| docs/design/v3/07-people-and-war.md:722 | 환전꾼 | 환전상 | 용어 131 |
| docs/design/v3/07-people-and-war.md:497 | 나무조원 | 벌목꾼 | 용어 135 |
| docs/design/v3/07-people-and-war.md:1150 | 장갑 수레는 | 장갑 궤도차는 | 용어 147 |
| docs/design/v3/07-people-and-war.md:1149 | 궤도 수레 | 궤도차 | 용어 140 |
| docs/design/v3/07-people-and-war.md:1194 | 곁집 본청 | 가문 본가 | 용어 182 |
| docs/design/v3/07-people-and-war.md:1194 | 곁집장 호위대 | 가문 수장 호위대 | 용어 183 |
| docs/design/v3/07-people-and-war.md:107 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:113 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:154 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:154 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:154 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:217 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:269 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:287 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:287 | 곁집장은 | 가문 수장은 | 용어 153 |
| docs/design/v3/07-people-and-war.md:366 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:366 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:367 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:367 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:368 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:368 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:369 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:369 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:377 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:377 | 곁집장은 | 가문 수장은 | 용어 153 |
| docs/design/v3/07-people-and-war.md:377 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:463 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:646 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:674 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:689 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:689 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:689 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:692 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:692 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:726 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:827 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:1091 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:1158 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:1158 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:1166 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:1194 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:1236 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.md:1236 | 곁집장은 | 가문 수장은 | 용어 153 |
| docs/design/v3/07-people-and-war.md:108 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:217 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:371 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:374 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:463 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:647 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:674 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:689 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:689 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:689 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:692 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:727 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:727 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:727 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.md:217 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.md:370 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.md:372 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.md:373 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.md:652 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.md:676 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.md:689 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.md:689 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.md:727 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.md:95 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:260 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:268 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:269 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:287 | 곁집을 | 측근 가문을 | 용어 152 |
| docs/design/v3/07-people-and-war.md:287 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:366 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:367 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:368 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:369 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:370 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:371 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:371 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:372 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:373 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:374 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:377 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:378 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:463 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:726 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:727 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:727 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:827 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1040 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1042 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1084 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1084 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1091 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1091 | 곁집은 | 측근 가문은 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1114 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1126 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1126 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1158 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.md:1165 | 곁집과 | 측근 가문과 | 용어 152 |
| docs/design/v3/07-people-and-war.md:110 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:158 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:217 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:465 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:649 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:675 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:689 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:689 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:692 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:692 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:726 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.md:1047 | 정비장은 | 정비 반장은 | 용어 159 |
| docs/design/v3/07-people-and-war.md:217 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.md:375 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.md:655 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.md:676 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.md:689 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.md:689 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.md:692 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.md:728 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.md:1027 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.md:1084 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.md:217 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:484 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:654 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:676 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:689 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:689 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:692 | 세례자는 | 세례 신도는 | 용어 160 |
| docs/design/v3/07-people-and-war.md:692 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:728 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:729 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:1108 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:1126 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.md:541 | 세례록 기록꾼 | 세례 명부 기록원 | 용어 163 |
| docs/design/v3/07-people-and-war.md:732 | 세례록 기록꾼 | 세례 명부 기록원 | 용어 163 |
| docs/design/v3/07-people-and-war.md:64 | 세례록과 | 세례 명부와 | 용어 162 |
| docs/design/v3/07-people-and-war.md:541 | 세례록 | 세례 명부 | 용어 162 |
| docs/design/v3/07-people-and-war.md:732 | 세례록 | 세례 명부 | 용어 162 |
| docs/design/v3/07-people-and-war.md:108 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:160 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:217 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:516 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:651 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:676 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:689 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:689 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:692 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:732 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:732 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.md:540 | 셈꾼 | 회계원 | 용어 165 |
| docs/design/v3/07-people-and-war.md:732 | 셈꾼 | 회계원 | 용어 165 |
| docs/design/v3/07-people-and-war.md:495 | 출입구지기 | 출입구 경비원 | 용어 168 |
| docs/design/v3/07-people-and-war.md:730 | 출입구지기 | 출입구 경비원 | 용어 168 |
| docs/design/v3/07-people-and-war.md:490 | 버섯 굴지기 | 버섯 재배 일꾼 | 용어 171 |
| docs/design/v3/07-people-and-war.md:731 | 버섯 굴지기 | 버섯 재배 일꾼 | 용어 171 |
| docs/design/v3/07-people-and-war.md:484 | 돌봄이 | 간병인 | 용어 172 |
| docs/design/v3/07-people-and-war.md:729 | 돌봄이 | 간병인 | 용어 172 |
| docs/design/v3/07-people-and-war.md:108 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/07-people-and-war.md:220 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/07-people-and-war.md:505 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/07-people-and-war.md:689 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/07-people-and-war.md:692 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/07-people-and-war.md:732 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/07-people-and-war.md:1091 | 교섭인이 | 교섭 담당자가 | 용어 173 |
| docs/design/v3/07-people-and-war.md:108 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:160 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:217 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:466 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:650 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:675 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:689 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:689 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:692 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:728 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:728 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:1158 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:1166 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.md:21 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:41 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:185 | 품계가 | 직급이 | 용어 192 |
| docs/design/v3/07-people-and-war.md:188 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:190 | 품계는 | 직급은 | 용어 192 |
| docs/design/v3/07-people-and-war.md:191 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:191 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:209 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:211 | 품계를 | 직급을 | 용어 192 |
| docs/design/v3/07-people-and-war.md:213 | 품계와 | 직급과 | 용어 192 |
| docs/design/v3/07-people-and-war.md:220 | 품계와 | 직급과 | 용어 192 |
| docs/design/v3/07-people-and-war.md:224 | 품계는 | 직급은 | 용어 192 |
| docs/design/v3/07-people-and-war.md:224 | 품계가 | 직급이 | 용어 192 |
| docs/design/v3/07-people-and-war.md:256 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:256 | 품계가 | 직급이 | 용어 192 |
| docs/design/v3/07-people-and-war.md:256 | 품계로 | 직급으로 | 용어 192 |
| docs/design/v3/07-people-and-war.md:256 | 품계가 | 직급이 | 용어 192 |
| docs/design/v3/07-people-and-war.md:285 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:301 | 품계가 | 직급이 | 용어 192 |
| docs/design/v3/07-people-and-war.md:312 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:318 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:336 | 품계는 | 직급은 | 용어 192 |
| docs/design/v3/07-people-and-war.md:336 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:341 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:363 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:383 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:440 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:441 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:444 | 품계는 | 직급은 | 용어 192 |
| docs/design/v3/07-people-and-war.md:588 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:590 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:592 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:592 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:681 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:683 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:683 | 품계는 | 직급은 | 용어 192 |
| docs/design/v3/07-people-and-war.md:685 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:696 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:698 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:739 | 품계를 | 직급을 | 용어 192 |
| docs/design/v3/07-people-and-war.md:742 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:742 | 품계가 | 직급이 | 용어 192 |
| docs/design/v3/07-people-and-war.md:743 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:770 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:872 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:916 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:919 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:919 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:920 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:922 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:1181 | 품계를 | 직급을 | 용어 192 |
| docs/design/v3/07-people-and-war.md:1243 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.md:945 | 직속 주군 | 직속 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:279 | 주군은 | 상관은 | 용어 195a |
| docs/design/v3/07-people-and-war.md:279 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:279 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:279 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:774 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:827 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:827 | 주군은 | 상관은 | 용어 195a |
| docs/design/v3/07-people-and-war.md:827 | 주군은 | 상관은 | 용어 195a |
| docs/design/v3/07-people-and-war.md:827 | 주군은 | 상관은 | 용어 195a |
| docs/design/v3/07-people-and-war.md:827 | 주군은 | 상관은 | 용어 195a |
| docs/design/v3/07-people-and-war.md:827 | 주군을 | 상관을 | 용어 195a |
| docs/design/v3/07-people-and-war.md:828 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:829 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:829 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:829 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:829 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:831 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:942 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:944 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:945 | 주군 | 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.md:496 | 제설꾼 | 제설 인부 | 용어 196 |
| docs/design/v3/08-document-map.md:62 | 섬유당과 효모 | 당화액과 효모 | 용어 1 |
| docs/design/v3/08-document-map.md:75 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/08-document-map.md:53 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/08-document-map.md:62 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/08-document-map.md:77 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/08-document-map.md:29 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/08-document-map.md:29 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/08-document-map.md:46 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/08-document-map.md:55 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/08-document-map.md:29 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/08-document-map.md:29 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/08-document-map.md:54 | 동력 덩이를 | 동력원을 | 용어 21 |
| docs/design/v3/08-document-map.md:77 | 바람틀 밭 | 풍력 발전 단지 | 용어 25 |
| docs/design/v3/08-document-map.md:83 | 녹은 주머니 | 녹은 땅 | 용어 29 |
| docs/design/v3/08-document-map.md:35 | 긴 낮 철 | 낮이 긴 때 | 용어 30 |
| docs/design/v3/08-document-map.md:35 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/08-document-map.md:30 | 겨울의 톱니 | 겨울의 래칫 | 용어 31 |
| docs/design/v3/08-document-map.md:77 | 출입구 굴 | 출입구 수직갱 | 용어 32 |
| docs/design/v3/08-document-map.md:43 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/08-document-map.md:77 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/08-document-map.md:93 | 테두리꾼 | 월경자 | 용어 40 |
| docs/design/v3/08-document-map.md:33 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:54 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:54 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:77 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:105 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:106 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:107 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:108 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:109 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:110 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:111 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:112 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:114 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.md:54 | 띠 너머 | 봉쇄 지대 너머 | 용어 38 |
| docs/design/v3/08-document-map.md:105 | 외눈탑 | 감시탑 | 용어 51 |
| docs/design/v3/08-document-map.md:105 | 외눈탑 | 감시탑 | 용어 51 |
| docs/design/v3/08-document-map.md:109 | 땅두드리기 | 땅속 진동 감지기 | 용어 52 |
| docs/design/v3/08-document-map.md:112 | 되뇌미 | 확성기 | 용어 53 |
| docs/design/v3/08-document-map.md:107 | 그르렁이 | 귀환 무인 차량 | 용어 54 |
| docs/design/v3/08-document-map.md:107 | 그르렁이 | 귀환 무인 차량 | 용어 54 |
| docs/design/v3/08-document-map.md:111 | 우두커니 | 무인 경계 초소 | 용어 55 |
| docs/design/v3/08-document-map.md:111 | 우두커니 | 무인 경계 초소 | 용어 55 |
| docs/design/v3/08-document-map.md:106 | 굴막이 | 선로 무장 차량 | 용어 57 |
| docs/design/v3/08-document-map.md:106 | 불다리열차 | 선로 무장 차량 | 용어 57 |
| docs/design/v3/08-document-map.md:108 | 불가사리 | 수리 기계 | 용어 58 |
| docs/design/v3/08-document-map.md:114 | 철공룡 | 자율 건설 기계 | 용어 59 |
| docs/design/v3/08-document-map.md:114 | 철공룡 | 자율 건설 기계 | 용어 59 |
| docs/design/v3/08-document-map.md:96 | 집게팔 | 물류 로봇 팔 | 용어 60 |
| docs/design/v3/08-document-map.md:96 | 집게팔 | 물류 로봇 팔 | 용어 60 |
| docs/design/v3/08-document-map.md:102 | 빈수레 | 선로 점검 로봇 | 용어 61 |
| docs/design/v3/08-document-map.md:102 | 빈수레 | 선로 점검 로봇 | 용어 61 |
| docs/design/v3/08-document-map.md:103 | 돌봄바퀴 | 서비스 로봇 | 용어 62 |
| docs/design/v3/08-document-map.md:103 | 돌봄바퀴 | 서비스 로봇 | 용어 62 |
| docs/design/v3/08-document-map.md:104 | 철골거미 | 공사 로봇 | 용어 63 |
| docs/design/v3/08-document-map.md:104 | 철골거미 | 공사 로봇 | 용어 63 |
| docs/design/v3/08-document-map.md:113 | 등불개미 | 케이블 점검 로봇 | 용어 64 |
| docs/design/v3/08-document-map.md:113 | 등불개미 | 케이블 점검 로봇 | 용어 64 |
| docs/design/v3/08-document-map.md:91 | 증표꾼 | 증표 위조꾼 | 용어 66 |
| docs/design/v3/08-document-map.md:43 | 초청 증표 | 초청장 | 용어 74 |
| docs/design/v3/08-document-map.md:44 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/08-document-map.md:46 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/08-document-map.md:10 | 작업대와 | 작업장과 | 용어 104 |
| docs/design/v3/08-document-map.md:17 | 작업대는 | 작업장은 | 용어 104 |
| docs/design/v3/08-document-map.md:46 | 작업대와 | 작업장과 | 용어 104 |
| docs/design/v3/08-document-map.md:76 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/08-document-map.md:46 | 작업조 | 작업반 | 용어 107 |
| docs/design/v3/08-document-map.md:95 | 보증 잃은 손 | 보증을 잃은 사람 | 용어 112 |
| docs/design/v3/08-document-map.md:47 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/08-document-map.md:94 | 꺼진 사람 | 이탈자 | 용어 181 |
| docs/design/v3/09-ck3-systems.md:467 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/09-ck3-systems.md:467 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/09-ck3-systems.md:511 | 화덕 킬로를 | 난방 기여분을 | 용어 5 |
| docs/design/v3/09-ck3-systems.md:512 | 화덕 킬로 | 난방 기여분 | 용어 5 |
| docs/design/v3/09-ck3-systems.md:513 | 화덕 킬로 | 난방 기여분 | 용어 5 |
| docs/design/v3/09-ck3-systems.md:623 | 0 킬로 | 0 킬로와트시 | 용어 6 |
| docs/design/v3/09-ck3-systems.md:359 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/09-ck3-systems.md:466 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/09-ck3-systems.md:525 | 킬로와 | 킬로와트시와 | 용어 6 |
| docs/design/v3/09-ck3-systems.md:571 | 킬로 | 킬로와트시 | 용어 6 |
| docs/design/v3/09-ck3-systems.md:525 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/09-ck3-systems.md:571 | 손시간 | 노동 시간 | 용어 7 |
| docs/design/v3/09-ck3-systems.md:551 | 바침 | 헌납 | 용어 18 |
| docs/design/v3/09-ck3-systems.md:556 | 바침을 | 헌납을 | 용어 18 |
| docs/design/v3/09-ck3-systems.md:572 | 바침 | 헌납 | 용어 18 |
| docs/design/v3/09-ck3-systems.md:575 | 바침 | 헌납 | 용어 18 |
| docs/design/v3/09-ck3-systems.md:606 | 바침 | 헌납 | 용어 18 |
| docs/design/v3/09-ck3-systems.md:359 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/09-ck3-systems.md:466 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/09-ck3-systems.md:552 | 하루 충전과 | 하루 충전량과 | 용어 19 |
| docs/design/v3/09-ck3-systems.md:571 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/09-ck3-systems.md:549 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/09-ck3-systems.md:552 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/09-ck3-systems.md:571 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/09-ck3-systems.md:438 | 동력 덩이를 | 동력원을 | 용어 21 |
| docs/design/v3/09-ck3-systems.md:467 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/09-ck3-systems.md:392 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/09-ck3-systems.md:467 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/09-ck3-systems.md:263 | 긴 낮 철 | 낮이 긴 때 | 용어 30 |
| docs/design/v3/09-ck3-systems.md:291 | 긴 낮 철 | 낮이 긴 때 | 용어 30 |
| docs/design/v3/09-ck3-systems.md:465 | 긴 낮 철과 | 낮이 긴 때와 | 용어 30 |
| docs/design/v3/09-ck3-systems.md:263 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/09-ck3-systems.md:291 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/09-ck3-systems.md:457 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/09-ck3-systems.md:465 | 긴 밤 철 | 밤이 긴 때 | 용어 30 |
| docs/design/v3/09-ck3-systems.md:456 | 겨울의 톱니가 | 겨울의 래칫이 | 용어 31 |
| docs/design/v3/09-ck3-systems.md:295 | 출입구 굴 | 출입구 수직갱 | 용어 32 |
| docs/design/v3/09-ck3-systems.md:308 | 출입구 굴 | 출입구 수직갱 | 용어 32 |
| docs/design/v3/09-ck3-systems.md:391 | 출입구 굴과 | 출입구 수직갱과 | 용어 32 |
| docs/design/v3/09-ck3-systems.md:394 | 출입구 굴 | 출입구 수직갱 | 용어 32 |
| docs/design/v3/09-ck3-systems.md:291 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/09-ck3-systems.md:294 | 강 밑 터널을 | 하저 터널을 | 용어 35 |
| docs/design/v3/09-ck3-systems.md:305 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/09-ck3-systems.md:311 | 강 밑 터널을 | 하저 터널을 | 용어 35 |
| docs/design/v3/09-ck3-systems.md:503 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/09-ck3-systems.md:561 | 강 밑 터널 | 하저 터널 | 용어 35 |
| docs/design/v3/09-ck3-systems.md:438 | 테두리를 | 봉쇄선을 | 용어 37 |
| docs/design/v3/09-ck3-systems.md:372 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/09-ck3-systems.md:437 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/09-ck3-systems.md:560 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/09-ck3-systems.md:637 | 본역 | 거점 역 | 용어 43 |
| docs/design/v3/09-ck3-systems.md:354 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/09-ck3-systems.md:503 | 등재민을 | 등록 주민을 | 용어 67 |
| docs/design/v3/09-ck3-systems.md:568 | 열네 도장 | 열네 명의 날인 | 용어 69 |
| docs/design/v3/09-ck3-systems.md:486 | 의석을 물린다 | 의석을 세습한다 | 용어 71 |
| docs/design/v3/09-ck3-systems.md:567 | 의석을 물린다 | 의석을 세습한다 | 용어 71 |
| docs/design/v3/09-ck3-systems.md:385 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/09-ck3-systems.md:524 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/09-ck3-systems.md:527 | 계약회와 | 협의회와 | 용어 95 |
| docs/design/v3/09-ck3-systems.md:536 | 계약회와 | 협의회와 | 용어 95 |
| docs/design/v3/09-ck3-systems.md:573 | 계약회 | 협의회 | 용어 95 |
| docs/design/v3/09-ck3-systems.md:527 | 자리주인 | 주최자 | 용어 96 |
| docs/design/v3/09-ck3-systems.md:512 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/09-ck3-systems.md:513 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/09-ck3-systems.md:513 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/09-ck3-systems.md:517 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/09-ck3-systems.md:517 | 대주회는 | 대표 회의는 | 용어 98 |
| docs/design/v3/09-ck3-systems.md:527 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/09-ck3-systems.md:568 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/09-ck3-systems.md:573 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/09-ck3-systems.md:623 | 대주회 | 대표 회의 | 용어 98 |
| docs/design/v3/09-ck3-systems.md:520 | 대주 | 대표 | 용어 97 |
| docs/design/v3/09-ck3-systems.md:527 | 대주 | 대표 | 용어 97 |
| docs/design/v3/09-ck3-systems.md:511 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/09-ck3-systems.md:511 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/09-ck3-systems.md:514 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/09-ck3-systems.md:515 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/09-ck3-systems.md:516 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/09-ck3-systems.md:517 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/09-ck3-systems.md:527 | 도장 집안 | 지분 가문 | 용어 99 |
| docs/design/v3/09-ck3-systems.md:466 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/09-ck3-systems.md:512 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/09-ck3-systems.md:512 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/09-ck3-systems.md:518 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/09-ck3-systems.md:524 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/09-ck3-systems.md:547 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/09-ck3-systems.md:568 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/09-ck3-systems.md:570 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/09-ck3-systems.md:623 | 이름값 | 평판 | 용어 100 |
| docs/design/v3/09-ck3-systems.md:514 | 바깥 자리를 | 외부 직책을 | 용어 101 |
| docs/design/v3/09-ck3-systems.md:515 | 바깥 자리를 | 외부 직책을 | 용어 101 |
| docs/design/v3/09-ck3-systems.md:516 | 바깥 자리 | 외부 직책 | 용어 101 |
| docs/design/v3/09-ck3-systems.md:517 | 도장 묶기 | 세습 결의 | 용어 102 |
| docs/design/v3/09-ck3-systems.md:511 | 도장을 묶은 | 세습을 결의한 | 용어 102 |
| docs/design/v3/09-ck3-systems.md:511 | 도장을 묶었는 | 세습을 결의했은 | 용어 102 |
| docs/design/v3/09-ck3-systems.md:518 | 바람 몫 | 동점 결정 | 용어 103 |
| docs/design/v3/09-ck3-systems.md:354 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:360 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:454 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:458 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:515 | 작업대와 | 작업장과 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:515 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:516 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:520 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:528 | 작업대 | 작업장 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:530 | 작업대가 | 작업장이 | 용어 104 |
| docs/design/v3/09-ck3-systems.md:453 | 견습 | 수습 | 용어 114 |
| docs/design/v3/09-ck3-systems.md:454 | 견습 | 수습 | 용어 114 |
| docs/design/v3/09-ck3-systems.md:290 | 지킴 몫과 | 경비 분담과 | 용어 115 |
| docs/design/v3/09-ck3-systems.md:350 | 지킴 몫 | 경비 분담 | 용어 115 |
| docs/design/v3/09-ck3-systems.md:530 | 지킴 몫 | 경비 분담 | 용어 115 |
| docs/design/v3/09-ck3-systems.md:576 | 지킴 몫 | 경비 분담 | 용어 115 |
| docs/design/v3/09-ck3-systems.md:545 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/09-ck3-systems.md:553 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/09-ck3-systems.md:568 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/09-ck3-systems.md:573 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/09-ck3-systems.md:360 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/09-ck3-systems.md:544 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/09-ck3-systems.md:544 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/09-ck3-systems.md:544 | 곁집장은 | 가문 수장은 | 용어 153 |
| docs/design/v3/09-ck3-systems.md:545 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/09-ck3-systems.md:548 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/09-ck3-systems.md:559 | 곁집장과 | 가문 수장과 | 용어 153 |
| docs/design/v3/09-ck3-systems.md:547 | 곁 섬김 | 오랜 보좌 | 용어 157 |
| docs/design/v3/09-ck3-systems.md:354 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/09-ck3-systems.md:427 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/09-ck3-systems.md:544 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/09-ck3-systems.md:544 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/09-ck3-systems.md:546 | 곁집을 | 측근 가문을 | 용어 152 |
| docs/design/v3/09-ck3-systems.md:547 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/09-ck3-systems.md:555 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/09-ck3-systems.md:557 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/09-ck3-systems.md:558 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/09-ck3-systems.md:578 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/09-ck3-systems.md:548 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/09-ck3-systems.md:557 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/09-ck3-systems.md:559 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/09-ck3-systems.md:450 | 품계 | 직급 | 용어 192 |
| docs/design/v3/10-design-profile.md:25 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/01-core.en.md:67 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/01-core.en.md:445 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/01-core.en.md:459 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/01-core.en.md:457 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/01-core.en.md:455 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/01-core.en.md:468 | 네 곁집 자리 | 가문 수장 회의 | 용어 154 |
| docs/design/v3/01-core.en.md:467 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/01-core.en.md:72 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/01-core.en.md:465 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/03-technology.en.md:444 | 맞춤이 | 이식 정비사 | 용어 175 |
| docs/design/v3/06-arc.en.md:583 | 섬유당 통지기 | 당화 탱크 관리인 | 용어 166 |
| docs/design/v3/06-arc.en.md:583 | 빛밭지기 | 온실 관리인 | 용어 170 |
| docs/design/v3/06-arc.en.md:385 | 바꿈터 | 교환소 | 용어 16 |
| docs/design/v3/06-arc.en.md:362 | 하루 충전 | 하루 충전량 | 용어 19 |
| docs/design/v3/06-arc.en.md:362 | 정비 차례 | 정비 순번 | 용어 20 |
| docs/design/v3/06-arc.en.md:585 | 동력 덩이 캐는 사람 | 동력원 회수 일꾼 | 용어 22 |
| docs/design/v3/06-arc.en.md:585 | 섬유 캐는 사람 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/06-arc.en.md:582 | 열 펌프지기 | 열펌프 정비공 | 용어 167 |
| docs/design/v3/06-arc.en.md:582 | 수차지기 | 수차 정비공 | 용어 169 |
| docs/design/v3/06-arc.en.md:585 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/06-arc.en.md:582 | 취수구지기 | 취수구 관리인 | 용어 75 |
| docs/design/v3/06-arc.en.md:585 | 고물꾼 | 넝마주이 | 용어 76 |
| docs/design/v3/06-arc.en.md:578 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.en.md:606 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/06-arc.en.md:578 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/06-arc.en.md:606 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/06-arc.en.md:606 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/06-arc.en.md:579 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/06-arc.en.md:206 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/06-arc.en.md:584 | 세례록 기록꾼 | 세례 명부 기록원 | 용어 163 |
| docs/design/v3/06-arc.en.md:200 | 세례록 | 세례 명부 | 용어 162 |
| docs/design/v3/06-arc.en.md:51 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/06-arc.en.md:584 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/06-arc.en.md:584 | 셈꾼 | 회계원 | 용어 165 |
| docs/design/v3/06-arc.en.md:582 | 출입구지기 | 출입구 경비원 | 용어 168 |
| docs/design/v3/06-arc.en.md:583 | 버섯 굴지기 | 버섯 재배 일꾼 | 용어 171 |
| docs/design/v3/06-arc.en.md:580 | 돌봄이 | 간병인 | 용어 172 |
| docs/design/v3/06-arc.en.md:584 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/06-arc.en.md:488 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/06-arc.en.md:581 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/06-arc.en.md:222 | 다시 맞춤 | 재이식 | 용어 176 |
| docs/design/v3/06-arc.en.md:418 | 정비 틈 | 트임 | 용어 178 |
| docs/design/v3/07-people-and-war.en.md:488 | 섬유당 통지기 | 당화 탱크 관리인 | 용어 166 |
| docs/design/v3/07-people-and-war.en.md:715 | 섬유당 통지기 | 당화 탱크 관리인 | 용어 166 |
| docs/design/v3/07-people-and-war.en.md:731 | 섬유당 통지기 | 당화 탱크 관리인 | 용어 166 |
| docs/design/v3/07-people-and-war.en.md:488 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/07-people-and-war.en.md:715 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/07-people-and-war.en.md:731 | 섬유당 통 | 당화 탱크 | 용어 2 |
| docs/design/v3/07-people-and-war.en.md:557 | 섬유당 | 당화액 | 용어 1 |
| docs/design/v3/07-people-and-war.en.md:489 | 빛밭 경작 | 온실 경작 | 용어 4 |
| docs/design/v3/07-people-and-war.en.md:715 | 빛밭 경작 | 온실 경작 | 용어 4 |
| docs/design/v3/07-people-and-war.en.md:731 | 빛밭 경작 | 온실 경작 | 용어 4 |
| docs/design/v3/07-people-and-war.en.md:489 | 빛밭지기 | 온실 관리인 | 용어 170 |
| docs/design/v3/07-people-and-war.en.md:731 | 빛밭지기 | 온실 관리인 | 용어 170 |
| docs/design/v3/07-people-and-war.en.md:489 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/07-people-and-war.en.md:557 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/07-people-and-war.en.md:715 | 빛밭 | 온실 | 용어 3 |
| docs/design/v3/07-people-and-war.en.md:160 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/07-people-and-war.en.md:540 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/07-people-and-war.en.md:722 | 셈판 서기 | 시세표 서기 | 용어 126 |
| docs/design/v3/07-people-and-war.en.md:351 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/07-people-and-war.en.md:540 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/07-people-and-war.en.md:563 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/07-people-and-war.en.md:722 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/07-people-and-war.en.md:732 | 셈판 | 시세표 | 용어 14 |
| docs/design/v3/07-people-and-war.en.md:533 | 동력 덩이 채집 | 동력원 회수 | 용어 22 |
| docs/design/v3/07-people-and-war.en.md:725 | 동력 덩이 채집 | 동력원 회수 | 용어 22 |
| docs/design/v3/07-people-and-war.en.md:733 | 동력 덩이 채집 | 동력원 회수 | 용어 22 |
| docs/design/v3/07-people-and-war.en.md:533 | 동력 덩이 캐는 사람 | 동력원 회수 일꾼 | 용어 22 |
| docs/design/v3/07-people-and-war.en.md:733 | 동력 덩이 캐는 사람 | 동력원 회수 일꾼 | 용어 22 |
| docs/design/v3/07-people-and-war.en.md:529 | 섬유 채집꾼 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/07-people-and-war.en.md:715 | 섬유 채집꾼 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/07-people-and-war.en.md:529 | 섬유 캐는 사람 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/07-people-and-war.en.md:733 | 섬유 캐는 사람 | 섬유 채집 일꾼 | 용어 23 |
| docs/design/v3/07-people-and-war.en.md:518 | 바람틀 정비공 | 풍력 발전기 정비공 | 용어 132 |
| docs/design/v3/07-people-and-war.en.md:518 | 바람틀 | 풍력 발전기 | 용어 24 |
| docs/design/v3/07-people-and-war.en.md:519 | 열 펌프지기 | 열펌프 정비공 | 용어 167 |
| docs/design/v3/07-people-and-war.en.md:730 | 열 펌프지기 | 열펌프 정비공 | 용어 167 |
| docs/design/v3/07-people-and-war.en.md:519 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.en.md:519 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.en.md:715 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.en.md:715 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.en.md:730 | 열 펌프 | 열펌프 | 용어 26 |
| docs/design/v3/07-people-and-war.en.md:520 | 수차지기 | 수차 정비공 | 용어 169 |
| docs/design/v3/07-people-and-war.en.md:730 | 수차지기 | 수차 정비공 | 용어 169 |
| docs/design/v3/07-people-and-war.en.md:499 | 메탄 통 | 혐기성 소화조 | 용어 28 |
| docs/design/v3/07-people-and-war.en.md:499 | 메탄 통 | 혐기성 소화조 | 용어 28 |
| docs/design/v3/07-people-and-war.en.md:495 | 눈 굴 지기 | 출입구 경비 | 용어 33 |
| docs/design/v3/07-people-and-war.en.md:715 | 눈 굴 지기 | 출입구 경비 | 용어 33 |
| docs/design/v3/07-people-and-war.en.md:730 | 눈 굴 지기 | 출입구 경비 | 용어 33 |
| docs/design/v3/07-people-and-war.en.md:558 | 눈 굴 | 출입구 수직갱 | 용어 32 |
| docs/design/v3/07-people-and-war.en.md:530 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:530 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:530 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:724 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:733 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:733 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:215 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.en.md:332 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.en.md:333 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.en.md:614 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.en.md:665 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.en.md:687 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.en.md:704 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.en.md:714 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.en.md:715 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.en.md:716 | 등재민 | 등록 주민 | 용어 67 |
| docs/design/v3/07-people-and-war.en.md:522 | 취수구지기 | 취수구 관리인 | 용어 75 |
| docs/design/v3/07-people-and-war.en.md:730 | 취수구지기 | 취수구 관리인 | 용어 75 |
| docs/design/v3/07-people-and-war.en.md:528 | 고물 채집꾼 | 넝마주이 | 용어 76 |
| docs/design/v3/07-people-and-war.en.md:528 | 고물꾼 | 넝마주이 | 용어 76 |
| docs/design/v3/07-people-and-war.en.md:733 | 고물꾼 | 넝마주이 | 용어 76 |
| docs/design/v3/07-people-and-war.en.md:160 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.en.md:536 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.en.md:536 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.en.md:537 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.en.md:711 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.en.md:711 | 필사관 | 필경사 | 용어 77 |
| docs/design/v3/07-people-and-war.en.md:712 | 보건 일꾼 | 보건 요원 | 용어 79 |
| docs/design/v3/07-people-and-war.en.md:1193 | 국회의원 근위청 | 국회의원 호위대 본부 | 용어 80 |
| docs/design/v3/07-people-and-war.en.md:1193 | 근위 수행대 | 호위 수행대 | 용어 81 |
| docs/design/v3/07-people-and-war.en.md:216 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.en.md:350 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.en.md:640 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.en.md:673 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.en.md:688 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.en.md:720 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.en.md:720 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.en.md:720 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.en.md:720 | 대주 | 대표 | 용어 97 |
| docs/design/v3/07-people-and-war.en.md:720 | 통신대 | 통신 작업장 | 용어 105 |
| docs/design/v3/07-people-and-war.en.md:216 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:352 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:353 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:641 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:673 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:688 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:720 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:720 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:720 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:724 | 작업조장 | 작업반장 | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:216 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.en.md:644 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.en.md:673 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.en.md:688 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.en.md:721 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.en.md:721 | 견습 | 수습 | 용어 114 |
| docs/design/v3/07-people-and-war.en.md:724 | 지킴 몫의 분대장 | 경비 분대장 | 용어 117 |
| docs/design/v3/07-people-and-war.en.md:480 | 지킴 몫 | 경비 분담 | 용어 115 |
| docs/design/v3/07-people-and-war.en.md:724 | 지킴 몫 | 경비 분담 | 용어 115 |
| docs/design/v3/07-people-and-war.en.md:480 | 지킴 손 | 경비원 | 용어 116 |
| docs/design/v3/07-people-and-war.en.md:724 | 지킴 손 | 경비원 | 용어 116 |
| docs/design/v3/07-people-and-war.en.md:480 | 경계조원 | 경비대원 | 용어 118 |
| docs/design/v3/07-people-and-war.en.md:724 | 경계조 | 경비대 | 용어 118 |
| docs/design/v3/07-people-and-war.en.md:158 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.en.md:216 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.en.md:461 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.en.md:636 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.en.md:671 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.en.md:688 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.en.md:688 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.en.md:719 | 역반장 | 역 반장 | 용어 119 |
| docs/design/v3/07-people-and-war.en.md:461 | 역반 운영 | 역 운영 | 용어 120 |
| docs/design/v3/07-people-and-war.en.md:719 | 역반 운영 | 역 운영 | 용어 120 |
| docs/design/v3/07-people-and-war.en.md:349 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/07-people-and-war.en.md:634 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/07-people-and-war.en.md:671 | 바람지기 | 발전소장 | 용어 121 |
| docs/design/v3/07-people-and-war.en.md:348 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/07-people-and-war.en.md:632 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/07-people-and-war.en.md:670 | 경계장 | 경비대장 | 용어 122 |
| docs/design/v3/07-people-and-war.en.md:344 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/07-people-and-war.en.md:630 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/07-people-and-war.en.md:669 | 장주 | 상인회장 | 용어 123 |
| docs/design/v3/07-people-and-war.en.md:216 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.en.md:459 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.en.md:638 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.en.md:672 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.en.md:688 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.en.md:719 | 교대장 | 교대 조장 | 용어 124 |
| docs/design/v3/07-people-and-war.en.md:503 | 장터 집안 | 상인 가문 | 용어 125 |
| docs/design/v3/07-people-and-war.en.md:722 | 장터 집안 | 상인 가문 | 용어 125 |
| docs/design/v3/07-people-and-war.en.md:524 | 부품 가공공 | 부품 가공 기능공 | 용어 127 |
| docs/design/v3/07-people-and-war.en.md:718 | 이을 자식 | 후계자 | 용어 128 |
| docs/design/v3/07-people-and-war.en.md:507 | 급수 배분인 | 급수 관리인 | 용어 129 |
| docs/design/v3/07-people-and-war.en.md:722 | 짐꾼 무리의 우두머리 | 짐꾼 반장 | 용어 130 |
| docs/design/v3/07-people-and-war.en.md:508 | 환전꾼 | 환전상 | 용어 131 |
| docs/design/v3/07-people-and-war.en.md:722 | 환전꾼 | 환전상 | 용어 131 |
| docs/design/v3/07-people-and-war.en.md:497 | 나무조원 | 벌목꾼 | 용어 135 |
| docs/design/v3/07-people-and-war.en.md:1194 | 곁집 본청 | 가문 본가 | 용어 182 |
| docs/design/v3/07-people-and-war.en.md:1194 | 곁집장 호위대 | 가문 수장 호위대 | 용어 183 |
| docs/design/v3/07-people-and-war.en.md:154 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:154 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:217 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:366 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:367 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:368 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:369 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:463 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:646 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:674 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:689 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:726 | 곁집장 | 가문 수장 | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:217 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:371 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:374 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:463 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:647 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:674 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:689 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:689 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:727 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:727 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:727 | 곁집 어른 | 가문 원로 | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:217 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.en.md:370 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.en.md:372 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.en.md:373 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.en.md:652 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.en.md:676 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.en.md:689 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.en.md:689 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.en.md:727 | 곁집원 | 가문 구성원 | 용어 156 |
| docs/design/v3/07-people-and-war.en.md:366 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:367 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:368 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:369 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:371 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:463 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:726 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:727 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:727 | 곁집 | 측근 가문 | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:158 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:217 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:465 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:649 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:675 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:689 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:726 | 정비장 | 정비 반장 | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:217 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.en.md:375 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.en.md:655 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.en.md:676 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.en.md:689 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.en.md:689 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.en.md:728 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.en.md:1027 | 미세례자 | 세례 전 신도 | 용어 161 |
| docs/design/v3/07-people-and-war.en.md:217 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.en.md:484 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.en.md:654 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.en.md:676 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.en.md:689 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.en.md:689 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.en.md:728 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.en.md:729 | 세례자 | 세례 신도 | 용어 160 |
| docs/design/v3/07-people-and-war.en.md:541 | 세례록 기록꾼 | 세례 명부 기록원 | 용어 163 |
| docs/design/v3/07-people-and-war.en.md:732 | 세례록 기록꾼 | 세례 명부 기록원 | 용어 163 |
| docs/design/v3/07-people-and-war.en.md:541 | 세례록 | 세례 명부 | 용어 162 |
| docs/design/v3/07-people-and-war.en.md:732 | 세례록 | 세례 명부 | 용어 162 |
| docs/design/v3/07-people-and-war.en.md:160 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:217 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:516 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:651 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:676 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:689 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:732 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:732 | 말지기 | 대변인 | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:540 | 셈꾼 | 회계원 | 용어 165 |
| docs/design/v3/07-people-and-war.en.md:732 | 셈꾼 | 회계원 | 용어 165 |
| docs/design/v3/07-people-and-war.en.md:495 | 출입구지기 | 출입구 경비원 | 용어 168 |
| docs/design/v3/07-people-and-war.en.md:730 | 출입구지기 | 출입구 경비원 | 용어 168 |
| docs/design/v3/07-people-and-war.en.md:490 | 버섯 굴지기 | 버섯 재배 일꾼 | 용어 171 |
| docs/design/v3/07-people-and-war.en.md:731 | 버섯 굴지기 | 버섯 재배 일꾼 | 용어 171 |
| docs/design/v3/07-people-and-war.en.md:484 | 돌봄이 | 간병인 | 용어 172 |
| docs/design/v3/07-people-and-war.en.md:729 | 돌봄이 | 간병인 | 용어 172 |
| docs/design/v3/07-people-and-war.en.md:505 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/07-people-and-war.en.md:732 | 교섭인 | 교섭 담당자 | 용어 173 |
| docs/design/v3/07-people-and-war.en.md:160 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.en.md:217 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.en.md:466 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.en.md:650 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.en.md:675 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.en.md:689 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.en.md:728 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.en.md:728 | 호위장 | 호위대장 | 용어 174 |
| docs/design/v3/07-people-and-war.en.md:916 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.en.md:919 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.en.md:919 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.en.md:920 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.en.md:922 | 품계 | 직급 | 용어 192 |
| docs/design/v3/07-people-and-war.en.md:945 | 직속 주군 | 직속 상관 | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:496 | 제설꾼 | 제설 인부 | 용어 196 |
| docs/design/v3/08-document-map.en.md:93 | 테두리꾼 | 월경자 | 용어 40 |
| docs/design/v3/08-document-map.en.md:54 | 테두리 | 봉쇄선 | 용어 37 |
| docs/design/v3/08-document-map.en.md:105 | 외눈탑 | 감시탑 | 용어 51 |
| docs/design/v3/08-document-map.en.md:109 | 땅두드리기 | 땅속 진동 감지기 | 용어 52 |
| docs/design/v3/08-document-map.en.md:112 | 되뇌미 | 확성기 | 용어 53 |
| docs/design/v3/08-document-map.en.md:107 | 그르렁이 | 귀환 무인 차량 | 용어 54 |
| docs/design/v3/08-document-map.en.md:111 | 우두커니 | 무인 경계 초소 | 용어 55 |
| docs/design/v3/08-document-map.en.md:106 | 굴막이 | 선로 무장 차량 | 용어 57 |
| docs/design/v3/08-document-map.en.md:108 | 불가사리 | 수리 기계 | 용어 58 |
| docs/design/v3/08-document-map.en.md:114 | 철공룡 | 자율 건설 기계 | 용어 59 |
| docs/design/v3/08-document-map.en.md:96 | 집게팔 | 물류 로봇 팔 | 용어 60 |
| docs/design/v3/08-document-map.en.md:102 | 빈수레 | 선로 점검 로봇 | 용어 61 |
| docs/design/v3/08-document-map.en.md:103 | 돌봄바퀴 | 서비스 로봇 | 용어 62 |
| docs/design/v3/08-document-map.en.md:104 | 철골거미 | 공사 로봇 | 용어 63 |
| docs/design/v3/08-document-map.en.md:113 | 등불개미 | 케이블 점검 로봇 | 용어 64 |
| docs/design/v3/08-document-map.en.md:91 | 증표꾼 | 증표 위조꾼 | 용어 66 |
| docs/design/v3/08-document-map.en.md:95 | 보증 잃은 손 | 보증을 잃은 사람 | 용어 112 |
| docs/design/v3/08-document-map.en.md:94 | 꺼진 사람 | 이탈자 | 용어 181 |
| docs/design/v3/01-core.en.md:131 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/01-core.en.md:244 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/01-core.en.md:281 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/01-core.en.md:300 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/01-core.en.md:492 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/01-core.en.md:552 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/01-core.en.md:130 | fibre-sugar | cellulosic-sugar | 용어 1 |
| docs/design/v3/01-core.en.md:267 | fibre-sugar | cellulosic-sugar | 용어 1 |
| docs/design/v3/01-core.en.md:494 | fibre-sugar | cellulosic-sugar | 용어 1 |
| docs/design/v3/01-core.en.md:261 | fibre sugar | cellulosic sugar | 용어 1 |
| docs/design/v3/01-core.en.md:552 | fibre sugar | cellulosic sugar | 용어 1 |
| docs/design/v3/01-core.en.md:156 | Fibre sugar | Cellulosic sugar | 용어 1 |
| docs/design/v3/01-core.en.md:265 | Fibre sugar | Cellulosic sugar | 용어 1 |
| docs/design/v3/01-core.en.md:90 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:131 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:273 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:273 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:273 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:273 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:300 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:300 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:492 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:552 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:53 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:90 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:156 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:270 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:273 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:273 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:273 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:273 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:273 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:287 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:426 | light-field | greenhouse | 용어 3 |
| docs/design/v3/01-core.en.md:266 | Light-fields | Greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:273 | Light-fields | Greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:494 | Light-fields | Greenhouses | 용어 3 |
| docs/design/v3/01-core.en.md:241 | power cores | power sources | 용어 21 |
| docs/design/v3/01-core.en.md:241 | power cores | power sources | 용어 21 |
| docs/design/v3/01-core.en.md:332 | power cores | power sources | 용어 21 |
| docs/design/v3/01-core.en.md:498 | power cores | power sources | 용어 21 |
| docs/design/v3/01-core.en.md:459 | wind-machine fields | wind farms | 용어 25 |
| docs/design/v3/01-core.en.md:90 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/01-core.en.md:236 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/01-core.en.md:297 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/01-core.en.md:376 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/01-core.en.md:495 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/01-core.en.md:236 | Wind machines | Wind turbines | 용어 24 |
| docs/design/v3/01-core.en.md:156 | wind-machine | wind-turbine | 용어 24 |
| docs/design/v3/01-core.en.md:200 | wind-machine | wind-turbine | 용어 24 |
| docs/design/v3/01-core.en.md:200 | ground-heat pumps | ground-source heat pumps | 용어 26 |
| docs/design/v3/01-core.en.md:281 | ground-heat pumps | ground-source heat pumps | 용어 26 |
| docs/design/v3/01-core.en.md:495 | ground-heat pumps | ground-source heat pumps | 용어 26 |
| docs/design/v3/01-core.en.md:128 | thaw pockets | unfrozen ground | 용어 29 |
| docs/design/v3/01-core.en.md:251 | thaw pockets | unfrozen ground | 용어 29 |
| docs/design/v3/01-core.en.md:86 | thaw pocket | unfrozen ground | 용어 29 |
| docs/design/v3/01-core.en.md:281 | exhaust shafts | exhaust vents | 용어 34 |
| docs/design/v3/01-core.en.md:536 | Rim machines | Blockade-line machines | 용어 37 |
| docs/design/v3/01-core.en.md:334 | rim machines | blockade-line machines | 용어 37 |
| docs/design/v3/01-core.en.md:239 | perimeter | blockade line | 용어 37 |
| docs/design/v3/01-core.en.md:328 | perimeter | blockade line | 용어 37 |
| docs/design/v3/01-core.en.md:457 | perimeter | blockade line | 용어 37 |
| docs/design/v3/01-core.en.md:498 | perimeter | blockade line | 용어 37 |
| docs/design/v3/01-core.en.md:522 | perimeter | blockade line | 용어 37 |
| docs/design/v3/01-core.en.md:67 | the registered | registered residents | 용어 67 |
| docs/design/v3/01-core.en.md:65 | fourteen seals | fourteen seal impressions | 용어 69 |
| docs/design/v3/01-core.en.md:365 | handed-down seats | hereditary seats | 용어 70 |
| docs/design/v3/01-core.en.md:519 | handed-down seats | hereditary seats | 용어 70 |
| docs/design/v3/01-core.en.md:66 | handed-down seat | hereditary seat | 용어 70 |
| docs/design/v3/01-core.en.md:66 | hands down the seat | passes the seat by inheritance | 용어 71 |
| docs/design/v3/01-core.en.md:448 | contract meetings | councils | 용어 95 |
| docs/design/v3/01-core.en.md:455 | contract meetings | councils | 용어 95 |
| docs/design/v3/01-core.en.md:480 | contract meetings | councils | 용어 95 |
| docs/design/v3/01-core.en.md:546 | contract meetings | councils | 용어 95 |
| docs/design/v3/01-core.en.md:69 | contract meeting | council | 용어 95 |
| docs/design/v3/01-core.en.md:255 | contract meeting | council | 용어 95 |
| docs/design/v3/01-core.en.md:382 | contract meeting | council | 용어 95 |
| docs/design/v3/01-core.en.md:382 | contract meeting | council | 용어 95 |
| docs/design/v3/01-core.en.md:448 | contract meeting | council | 용어 95 |
| docs/design/v3/01-core.en.md:527 | Contract meetings | Councils | 용어 95 |
| docs/design/v3/01-core.en.md:448 | Host | host | 용어 96 |
| docs/design/v3/01-core.en.md:448 | Host | host | 용어 96 |
| docs/design/v3/01-core.en.md:480 | Host | host | 용어 96 |
| docs/design/v3/01-core.en.md:527 | Host | host | 용어 96 |
| docs/design/v3/01-core.en.md:380 | bench masters | representatives | 용어 97 |
| docs/design/v3/01-core.en.md:380 | seal house | shareholding house | 용어 99 |
| docs/design/v3/01-core.en.md:380 | name-worth | reputation | 용어 100 |
| docs/design/v3/01-core.en.md:380 | bound the seal | resolved to make the seat hereditary | 용어 102 |
| docs/design/v3/01-core.en.md:277 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/01-core.en.md:465 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/01-core.en.md:477 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/01-core.en.md:388 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/01-core.en.md:390 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/01-core.en.md:520 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/01-core.en.md:465 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/01-core.en.md:520 | station crews | station teams | 용어 119 |
| docs/design/v3/01-core.en.md:388 | City crews | City work teams | 용어 107 |
| docs/design/v3/01-core.en.md:496 | City crews | City work teams | 용어 107 |
| docs/design/v3/01-core.en.md:498 | City crews | City work teams | 용어 107 |
| docs/design/v3/01-core.en.md:457 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/01-core.en.md:479 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/01-core.en.md:459 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/01-core.en.md:479 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/01-core.en.md:455 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/01-core.en.md:479 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/01-core.en.md:456 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/01-core.en.md:479 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/01-core.en.md:49 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/01-core.en.md:458 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/01-core.en.md:479 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/01-core.en.md:468 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/01-core.en.md:480 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/01-core.en.md:467 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/01-core.en.md:479 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/01-core.en.md:526 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/01-core.en.md:529 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/01-core.en.md:468 | Near House heads | house heads | 용어 153 |
| docs/design/v3/01-core.en.md:72 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/01-core.en.md:72 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/01-core.en.md:277 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/01-core.en.md:395 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/01-core.en.md:395 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/01-core.en.md:519 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/01-core.en.md:395 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/01-core.en.md:396 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/01-core.en.md:467 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/03-technology.en.md:10 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/03-technology.en.md:22 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/03-technology.en.md:66 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/03-technology.en.md:213 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/03-technology.en.md:466 | fibre sugar | cellulosic sugar | 용어 1 |
| docs/design/v3/03-technology.en.md:308 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/03-technology.en.md:440 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/03-technology.en.md:282 | light-field | greenhouse | 용어 3 |
| docs/design/v3/03-technology.en.md:466 | light-field | greenhouse | 용어 3 |
| docs/design/v3/03-technology.en.md:470 | kilos | kWh | 용어 6 |
| docs/design/v3/03-technology.en.md:485 | kilos | kWh | 용어 6 |
| docs/design/v3/03-technology.en.md:541 | kilos | kWh | 용어 6 |
| docs/design/v3/03-technology.en.md:555 | kilos | kWh | 용어 6 |
| docs/design/v3/03-technology.en.md:470 | hand-hours | labour hours | 용어 7 |
| docs/design/v3/03-technology.en.md:473 | hand-hours | labour hours | 용어 7 |
| docs/design/v3/03-technology.en.md:494 | hand-hours | labour hours | 용어 7 |
| docs/design/v3/03-technology.en.md:473 | hand-hour | labour hour | 용어 7 |
| docs/design/v3/03-technology.en.md:473 | hand-hour | labour hour | 용어 7 |
| docs/design/v3/03-technology.en.md:492 | hand-hour | labour hour | 용어 7 |
| docs/design/v3/03-technology.en.md:539 | Hand-hours | Labour hours | 용어 7 |
| docs/design/v3/03-technology.en.md:472 | full packs | charged battery packs | 용어 9 |
| docs/design/v3/03-technology.en.md:472 | surety tags | vouchers | 용어 11 |
| docs/design/v3/03-technology.en.md:477 | day-charges | daily charge allowances | 용어 19 |
| docs/design/v3/03-technology.en.md:480 | day-charges | daily charge allowances | 용어 19 |
| docs/design/v3/03-technology.en.md:485 | day-charges | daily charge allowances | 용어 19 |
| docs/design/v3/03-technology.en.md:539 | day-charges | daily charge allowances | 용어 19 |
| docs/design/v3/03-technology.en.md:555 | day-charges | daily charge allowances | 용어 19 |
| docs/design/v3/03-technology.en.md:480 | day-charge | daily charge allowance | 용어 19 |
| docs/design/v3/03-technology.en.md:493 | day-charge | daily charge allowance | 용어 19 |
| docs/design/v3/03-technology.en.md:541 | day-charge | daily charge allowance | 용어 19 |
| docs/design/v3/03-technology.en.md:172 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/03-technology.en.md:477 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/03-technology.en.md:481 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/03-technology.en.md:539 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/03-technology.en.md:481 | maintenance turn | maintenance queue place | 용어 20 |
| docs/design/v3/03-technology.en.md:494 | maintenance turn | maintenance queue place | 용어 20 |
| docs/design/v3/03-technology.en.md:388 | power cores | power sources | 용어 21 |
| docs/design/v3/03-technology.en.md:511 | power core | power source | 용어 21 |
| docs/design/v3/03-technology.en.md:557 | power core | power source | 용어 21 |
| docs/design/v3/03-technology.en.md:44 | Power cores | Power sources | 용어 21 |
| docs/design/v3/03-technology.en.md:78 | Power cores | Power sources | 용어 21 |
| docs/design/v3/03-technology.en.md:93 | Power cores | Power sources | 용어 21 |
| docs/design/v3/03-technology.en.md:409 | Power cores | Power sources | 용어 21 |
| docs/design/v3/03-technology.en.md:475 | wind-machine fields | wind farms | 용어 25 |
| docs/design/v3/03-technology.en.md:429 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/03-technology.en.md:448 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/03-technology.en.md:43 | Wind machines | Wind turbines | 용어 24 |
| docs/design/v3/03-technology.en.md:22 | wind-machine | wind-turbine | 용어 24 |
| docs/design/v3/03-technology.en.md:372 | wind-machine | wind-turbine | 용어 24 |
| docs/design/v3/03-technology.en.md:467 | wind-machine | wind-turbine | 용어 24 |
| docs/design/v3/03-technology.en.md:430 | ground-heat pumps | ground-source heat pumps | 용어 26 |
| docs/design/v3/03-technology.en.md:245 | methane vats | anaerobic digesters | 용어 28 |
| docs/design/v3/03-technology.en.md:282 | methane vats | anaerobic digesters | 용어 28 |
| docs/design/v3/03-technology.en.md:382 | rim machines | blockade-line machines | 용어 37 |
| docs/design/v3/03-technology.en.md:312 | perimeter belt | blockade zone | 용어 38 |
| docs/design/v3/03-technology.en.md:93 | perimeter | blockade line | 용어 37 |
| docs/design/v3/03-technology.en.md:312 | perimeter | blockade line | 용어 37 |
| docs/design/v3/03-technology.en.md:409 | perimeter | blockade line | 용어 37 |
| docs/design/v3/03-technology.en.md:409 | perimeter | blockade line | 용어 37 |
| docs/design/v3/03-technology.en.md:511 | perimeter | blockade line | 용어 37 |
| docs/design/v3/03-technology.en.md:467 | rim | blockade line | 용어 37 |
| docs/design/v3/03-technology.en.md:327 | talk lines | wired communication lines | 용어 45 |
| docs/design/v3/03-technology.en.md:433 | talk lines | wired communication lines | 용어 45 |
| docs/design/v3/03-technology.en.md:321 | talk line | wired communication line | 용어 45 |
| docs/design/v3/03-technology.en.md:323 | talk line | wired communication line | 용어 45 |
| docs/design/v3/03-technology.en.md:325 | talk line | wired communication line | 용어 45 |
| docs/design/v3/03-technology.en.md:326 | talk line | wired communication line | 용어 45 |
| docs/design/v3/03-technology.en.md:326 | talk line | wired communication line | 용어 45 |
| docs/design/v3/03-technology.en.md:326 | talk line | wired communication line | 용어 45 |
| docs/design/v3/03-technology.en.md:327 | talk line | wired communication line | 용어 45 |
| docs/design/v3/03-technology.en.md:332 | line drones | tethered drones | 용어 49b |
| docs/design/v3/03-technology.en.md:318 | Line drones | Tethered drones | 용어 49b |
| docs/design/v3/03-technology.en.md:466 | ration token | ration coupon | 용어 73 |
| docs/design/v3/03-technology.en.md:326 | contract meetings | councils | 용어 95 |
| docs/design/v3/03-technology.en.md:450 | contract meeting | council | 용어 95 |
| docs/design/v3/03-technology.en.md:541 | contract meeting | council | 용어 95 |
| docs/design/v3/03-technology.en.md:452 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/03-technology.en.md:23 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:104 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:146 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:225 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:421 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:479 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:142 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:156 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:165 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:205 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:219 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:227 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:239 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:452 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:452 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:556 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/03-technology.en.md:432 | work crews | work teams | 용어 107 |
| docs/design/v3/03-technology.en.md:372 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/03-technology.en.md:336 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/03-technology.en.md:362 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/03-technology.en.md:336 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/03-technology.en.md:361 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/03-technology.en.md:452 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/03-technology.en.md:479 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/03-technology.en.md:201 | the baptised | baptised believers | 용어 160 |
| docs/design/v3/03-technology.en.md:226 | the baptised | baptised believers | 용어 160 |
| docs/design/v3/03-technology.en.md:134 | entrance keepers | entrance guards | 용어 168 |
| docs/design/v3/03-technology.en.md:432 | Water-wheel keeper | Turbine mechanic | 용어 169 |
| docs/design/v3/03-technology.en.md:473 | body fitter | implant technician | 용어 175 |
| docs/design/v3/03-technology.en.md:527 | body fitter | implant technician | 용어 175 |
| docs/design/v3/03-technology.en.md:441 | Body fitter | Implant technician | 용어 175 |
| docs/design/v3/03-technology.en.md:444 | Body fitter | Implant technician | 용어 175 |
| docs/design/v3/03-technology.en.md:217 | refitting | re-implantation | 용어 176 |
| docs/design/v3/03-technology.en.md:415 | \| Hands \| | \| Skilled workers \| | 용어 109 |
| docs/design/v3/04-government.en.md:230 | fibre-sugar vat keepers | saccharification tank keepers | 용어 166 |
| docs/design/v3/04-government.en.md:211 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/04-government.en.md:279 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/04-government.en.md:396 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/04-government.en.md:250 | fibre-sugar | cellulosic-sugar | 용어 1 |
| docs/design/v3/04-government.en.md:246 | fibre sugar | cellulosic sugar | 용어 1 |
| docs/design/v3/04-government.en.md:278 | fibre sugar | cellulosic sugar | 용어 1 |
| docs/design/v3/04-government.en.md:103 | Fibre-sugar | Cellulosic-sugar | 용어 1 |
| docs/design/v3/04-government.en.md:85 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/04-government.en.md:279 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/04-government.en.md:103 | light-field | greenhouse | 용어 3 |
| docs/design/v3/04-government.en.md:231 | light-field | greenhouse | 용어 3 |
| docs/design/v3/04-government.en.md:277 | light-field | greenhouse | 용어 3 |
| docs/design/v3/04-government.en.md:308 | Light-field | Greenhouse | 용어 3 |
| docs/design/v3/04-government.en.md:254 | power cores | power sources | 용어 21 |
| docs/design/v3/04-government.en.md:342 | long-light | long-daylight | 용어 30 |
| docs/design/v3/04-government.en.md:351 | long-light | long-daylight | 용어 30 |
| docs/design/v3/04-government.en.md:355 | long-light | long-daylight | 용어 30 |
| docs/design/v3/04-government.en.md:240 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/04-government.en.md:342 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/04-government.en.md:351 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/04-government.en.md:355 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/04-government.en.md:63 | the registered | registered residents | 용어 67 |
| docs/design/v3/04-government.en.md:118 | the registered | registered residents | 용어 67 |
| docs/design/v3/04-government.en.md:43 | fourteen seals | fourteen seal impressions | 용어 69 |
| docs/design/v3/04-government.en.md:47 | fourteen seals | fourteen seal impressions | 용어 69 |
| docs/design/v3/04-government.en.md:54 | fourteen seals | fourteen seal impressions | 용어 69 |
| docs/design/v3/04-government.en.md:177 | fourteen seals | fourteen seal impressions | 용어 69 |
| docs/design/v3/04-government.en.md:181 | fourteen seals | fourteen seal impressions | 용어 69 |
| docs/design/v3/04-government.en.md:468 | fourteen seals | fourteen seal impressions | 용어 69 |
| docs/design/v3/04-government.en.md:584 | fourteen seals | fourteen seal impressions | 용어 69 |
| docs/design/v3/04-government.en.md:584 | fourteen seals | fourteen seal impressions | 용어 69 |
| docs/design/v3/04-government.en.md:37 | handed-down seat | hereditary seat | 용어 70 |
| docs/design/v3/04-government.en.md:108 | ration tokens | ration coupons | 용어 73 |
| docs/design/v3/04-government.en.md:250 | ration token | ration coupon | 용어 73 |
| docs/design/v3/04-government.en.md:385 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/04-government.en.md:385 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/04-government.en.md:387 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/04-government.en.md:454 | work crews | work teams | 용어 107 |
| docs/design/v3/04-government.en.md:426 | pump crews | pump work teams | 용어 107 |
| docs/design/v3/04-government.en.md:230 | Pump crews | Pump work teams | 용어 107 |
| docs/design/v3/05-free-city.en.md:186 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/05-free-city.en.md:358 | fibre-sugar vat | saccharification tank | 용어 2 |
| docs/design/v3/05-free-city.en.md:400 | fibre-sugar vat | saccharification tank | 용어 2 |
| docs/design/v3/05-free-city.en.md:140 | fibre-sugar | cellulosic-sugar | 용어 1 |
| docs/design/v3/05-free-city.en.md:400 | fibre-sugar | cellulosic-sugar | 용어 1 |
| docs/design/v3/05-free-city.en.md:30 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/05-free-city.en.md:96 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/05-free-city.en.md:96 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/05-free-city.en.md:186 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/05-free-city.en.md:318 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/05-free-city.en.md:211 | light-field | greenhouse | 용어 3 |
| docs/design/v3/05-free-city.en.md:400 | light-field | greenhouse | 용어 3 |
| docs/design/v3/05-free-city.en.md:54 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:54 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:54 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:54 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:104 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:111 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:119 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:553 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:55 | Hearth kilos | Heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:55 | Hearth kilos | Heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:71 | Hearth kilos | Heating contribution | 용어 5 |
| docs/design/v3/05-free-city.en.md:43 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:54 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:55 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:55 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:55 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:75 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:111 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:111 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:231 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:242 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:250 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:252 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:252 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:254 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:260 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:429 | kilos | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:55 | kilo | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:242 | kilo | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:252 | kilo | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:254 | kilo | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:254 | kilo | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:261 | kilo | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:556 | kilo | kWh | 용어 6 |
| docs/design/v3/05-free-city.en.md:231 | hand-hours | labour hours | 용어 7 |
| docs/design/v3/05-free-city.en.md:260 | hand-hours | labour hours | 용어 7 |
| docs/design/v3/05-free-city.en.md:416 | hand-hours | labour hours | 용어 7 |
| docs/design/v3/05-free-city.en.md:242 | hand-hour | labour hour | 용어 7 |
| docs/design/v3/05-free-city.en.md:252 | hand-hour | labour hour | 용어 7 |
| docs/design/v3/05-free-city.en.md:556 | hand-hour | labour hour | 용어 7 |
| docs/design/v3/05-free-city.en.md:55 | full packs | charged battery packs | 용어 9 |
| docs/design/v3/05-free-city.en.md:160 | full packs | charged battery packs | 용어 9 |
| docs/design/v3/05-free-city.en.md:256 | full packs | charged battery packs | 용어 9 |
| docs/design/v3/05-free-city.en.md:261 | full packs | charged battery packs | 용어 9 |
| docs/design/v3/05-free-city.en.md:564 | full pack | charged battery pack | 용어 9 |
| docs/design/v3/05-free-city.en.md:51 | surety tags | vouchers | 용어 11 |
| docs/design/v3/05-free-city.en.md:221 | surety tags | vouchers | 용어 11 |
| docs/design/v3/05-free-city.en.md:233 | surety tags | vouchers | 용어 11 |
| docs/design/v3/05-free-city.en.md:326 | surety tags | vouchers | 용어 11 |
| docs/design/v3/05-free-city.en.md:400 | surety tags | vouchers | 용어 11 |
| docs/design/v3/05-free-city.en.md:556 | surety tags | vouchers | 용어 11 |
| docs/design/v3/05-free-city.en.md:260 | surety tag | voucher | 용어 11 |
| docs/design/v3/05-free-city.en.md:261 | surety tag | voucher | 용어 11 |
| docs/design/v3/05-free-city.en.md:373 | surety tag | voucher | 용어 11 |
| docs/design/v3/05-free-city.en.md:373 | surety tag | voucher | 용어 11 |
| docs/design/v3/05-free-city.en.md:564 | surety tag | voucher | 용어 11 |
| docs/design/v3/05-free-city.en.md:256 | Surety tags | Vouchers | 용어 11 |
| docs/design/v3/05-free-city.en.md:260 | Surety tags | Vouchers | 용어 11 |
| docs/design/v3/05-free-city.en.md:260 | Surety tags | Vouchers | 용어 11 |
| docs/design/v3/05-free-city.en.md:111 | rate board | price board | 용어 14 |
| docs/design/v3/05-free-city.en.md:233 | rate board | price board | 용어 14 |
| docs/design/v3/05-free-city.en.md:248 | rate board | price board | 용어 14 |
| docs/design/v3/05-free-city.en.md:250 | rate board | price board | 용어 14 |
| docs/design/v3/05-free-city.en.md:350 | rate board | price board | 용어 14 |
| docs/design/v3/05-free-city.en.md:382 | rate board | price board | 용어 14 |
| docs/design/v3/05-free-city.en.md:431 | rate board | price board | 용어 14 |
| docs/design/v3/05-free-city.en.md:525 | rate board | price board | 용어 14 |
| docs/design/v3/05-free-city.en.md:531 | rate board | price board | 용어 14 |
| docs/design/v3/05-free-city.en.md:556 | rate board | price board | 용어 14 |
| docs/design/v3/05-free-city.en.md:125 | power cores | power sources | 용어 21 |
| docs/design/v3/05-free-city.en.md:283 | power cores | power sources | 용어 21 |
| docs/design/v3/05-free-city.en.md:321 | power cores | power sources | 용어 21 |
| docs/design/v3/05-free-city.en.md:350 | power cores | power sources | 용어 21 |
| docs/design/v3/05-free-city.en.md:34 | Power cores | Power sources | 용어 21 |
| docs/design/v3/05-free-city.en.md:96 | wind-machine fields | wind farms | 용어 25 |
| docs/design/v3/05-free-city.en.md:73 | wind fields | wind farms | 용어 25 |
| docs/design/v3/05-free-city.en.md:97 | wind fields | wind farms | 용어 25 |
| docs/design/v3/05-free-city.en.md:97 | wind fields | wind farms | 용어 25 |
| docs/design/v3/05-free-city.en.md:254 | wind fields | wind farms | 용어 25 |
| docs/design/v3/05-free-city.en.md:97 | wind field | wind farm | 용어 25 |
| docs/design/v3/05-free-city.en.md:97 | wind field | wind farm | 용어 25 |
| docs/design/v3/05-free-city.en.md:96 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/05-free-city.en.md:118 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/05-free-city.en.md:254 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/05-free-city.en.md:281 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/05-free-city.en.md:320 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/05-free-city.en.md:378 | wind machine | wind turbine | 용어 24 |
| docs/design/v3/05-free-city.en.md:186 | wind-machine | wind-turbine | 용어 24 |
| docs/design/v3/05-free-city.en.md:392 | thaw pockets | unfrozen ground | 용어 29 |
| docs/design/v3/05-free-city.en.md:408 | thaw pocket | unfrozen ground | 용어 29 |
| docs/design/v3/05-free-city.en.md:73 | long-dark halves | short-daylight halves | 용어 30 |
| docs/design/v3/05-free-city.en.md:97 | long-dark halves | short-daylight halves | 용어 30 |
| docs/design/v3/05-free-city.en.md:267 | long-dark halves | short-daylight halves | 용어 30 |
| docs/design/v3/05-free-city.en.md:392 | long-light | long-daylight | 용어 30 |
| docs/design/v3/05-free-city.en.md:73 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/05-free-city.en.md:97 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/05-free-city.en.md:340 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/05-free-city.en.md:392 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/05-free-city.en.md:34 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:43 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:77 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:98 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:120 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:125 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:125 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:126 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:127 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:140 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:143 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:309 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:348 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:350 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:350 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:350 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:381 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:563 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:563 | perimeter | blockade line | 용어 37 |
| docs/design/v3/05-free-city.en.md:110 | contract meetings | councils | 용어 95 |
| docs/design/v3/05-free-city.en.md:112 | contract meetings | councils | 용어 95 |
| docs/design/v3/05-free-city.en.md:156 | contract meetings | councils | 용어 95 |
| docs/design/v3/05-free-city.en.md:20 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:32 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:49 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:52 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:55 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:58 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:110 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:145 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:151 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:151 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:151 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:155 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:156 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:158 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:169 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:271 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:275 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:285 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:298 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:320 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:449 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:525 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:555 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:555 | contract meeting | council | 용어 95 |
| docs/design/v3/05-free-city.en.md:169 | Contract meetings | Councils | 용어 95 |
| docs/design/v3/05-free-city.en.md:173 | Contract meetings | Councils | 용어 95 |
| docs/design/v3/05-free-city.en.md:111 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:155 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:156 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:156 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:159 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:159 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:160 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:160 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:300 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:300 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:301 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:497 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:531 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:555 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:147 | Host | host | 용어 96 |
| docs/design/v3/05-free-city.en.md:30 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:32 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:35 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:36 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:52 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:52 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:53 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:53 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:55 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:59 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:59 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:63 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:64 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:64 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:83 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:97 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:104 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:111 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:111 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:111 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:119 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:119 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:126 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:134 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:141 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:141 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:141 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:141 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:141 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:225 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:300 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:553 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:559 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:567 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/05-free-city.en.md:52 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:55 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:97 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:111 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:119 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:210 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:213 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:227 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:514 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:514 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:531 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:538 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:567 | bench masters | representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:33 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:54 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:56 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:56 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:59 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:91 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:97 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:126 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:134 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:188 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:195 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:195 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:195 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:200 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:200 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:204 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:204 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:222 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:227 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:227 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:373 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:373 | bench master | representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:221 | Bench masters | Representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:501 | Bench masters | Representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:523 | Bench masters | Representatives | 용어 97 |
| docs/design/v3/05-free-city.en.md:194 | Bench master | Representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:523 | Bench master | Representative | 용어 97 |
| docs/design/v3/05-free-city.en.md:53 | The masters stamp | The representatives stamp | 용어 97 |
| docs/design/v3/05-free-city.en.md:30 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:32 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:33 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:34 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:35 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:51 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:51 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:52 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:59 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:61 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:61 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:83 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:97 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:111 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:119 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:126 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:134 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:141 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:141 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:225 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:514 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:553 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:31 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:51 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:56 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:59 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:59 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:64 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:83 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:91 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:91 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:104 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:104 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:225 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:225 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:225 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:514 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:567 | seal house | shareholding house | 용어 99 |
| docs/design/v3/05-free-city.en.md:51 | Seal houses | Shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:71 | Seal houses | Shareholding houses | 용어 99 |
| docs/design/v3/05-free-city.en.md:30 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:31 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:32 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:34 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:35 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:43 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:53 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:53 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:54 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:64 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:65 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:97 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:97 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:111 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:111 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:119 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:134 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:141 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:300 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:553 | name-worth | reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:53 | Name-worth | Reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:54 | Name-worth | Reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:104 | Name-worth | Reputation | 용어 100 |
| docs/design/v3/05-free-city.en.md:58 | outside posts | external offices | 용어 101 |
| docs/design/v3/05-free-city.en.md:59 | outside posts | external offices | 용어 101 |
| docs/design/v3/05-free-city.en.md:61 | outside posts | external offices | 용어 101 |
| docs/design/v3/05-free-city.en.md:61 | outside posts | external offices | 용어 101 |
| docs/design/v3/05-free-city.en.md:62 | outside posts | external offices | 용어 101 |
| docs/design/v3/05-free-city.en.md:553 | outside posts | external offices | 용어 101 |
| docs/design/v3/05-free-city.en.md:60 | outside post | external office | 용어 101 |
| docs/design/v3/05-free-city.en.md:60 | outside post | external office | 용어 101 |
| docs/design/v3/05-free-city.en.md:60 | outside post | external office | 용어 101 |
| docs/design/v3/05-free-city.en.md:61 | outside post | external office | 용어 101 |
| docs/design/v3/05-free-city.en.md:64 | Binding the seal | The hereditary resolution | 용어 102 |
| docs/design/v3/05-free-city.en.md:553 | binding the seal | the hereditary resolution | 용어 102 |
| docs/design/v3/05-free-city.en.md:142 | binds the seal | resolves to make the seat hereditary | 용어 102 |
| docs/design/v3/05-free-city.en.md:36 | bound the seal | resolved to make the seat hereditary | 용어 102 |
| docs/design/v3/05-free-city.en.md:64 | bound the seal | resolved to make the seat hereditary | 용어 102 |
| docs/design/v3/05-free-city.en.md:83 | bound the seal | resolved to make the seat hereditary | 용어 102 |
| docs/design/v3/05-free-city.en.md:141 | bound the seal | resolved to make the seat hereditary | 용어 102 |
| docs/design/v3/05-free-city.en.md:559 | bound the seal | resolved to make the seat hereditary | 용어 102 |
| docs/design/v3/05-free-city.en.md:104 | bind the seal | resolve to make the seat hereditary | 용어 102 |
| docs/design/v3/05-free-city.en.md:65 | wind share | tie-break | 용어 103 |
| docs/design/v3/05-free-city.en.md:412 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/05-free-city.en.md:523 | drilling benches | drill-rig workshops | 용어 105 |
| docs/design/v3/05-free-city.en.md:141 | drilling bench | drill-rig workshop | 용어 105 |
| docs/design/v3/05-free-city.en.md:186 | drilling bench | drill-rig workshop | 용어 105 |
| docs/design/v3/05-free-city.en.md:119 | parts-machining benches | parts workshops | 용어 105 |
| docs/design/v3/05-free-city.en.md:140 | wood crews | logging crews | 용어 135 |
| docs/design/v3/05-free-city.en.md:141 | wood crews | logging crews | 용어 135 |
| docs/design/v3/05-free-city.en.md:141 | wood crew | logging crew | 용어 135 |
| docs/design/v3/05-free-city.en.md:523 | wood crew | logging crew | 용어 135 |
| docs/design/v3/05-free-city.en.md:126 | edge crews | guard units | 용어 118 |
| docs/design/v3/05-free-city.en.md:126 | edge crews | guard units | 용어 118 |
| docs/design/v3/05-free-city.en.md:126 | edge crews | guard units | 용어 118 |
| docs/design/v3/05-free-city.en.md:128 | edge crews | guard units | 용어 118 |
| docs/design/v3/05-free-city.en.md:350 | edge crews | guard units | 용어 118 |
| docs/design/v3/05-free-city.en.md:350 | edge crews | guard units | 용어 118 |
| docs/design/v3/05-free-city.en.md:526 | edge crews | guard units | 용어 118 |
| docs/design/v3/05-free-city.en.md:526 | edge crews | guard units | 용어 118 |
| docs/design/v3/05-free-city.en.md:381 | edge crew | guard unit | 용어 118 |
| docs/design/v3/05-free-city.en.md:20 | work crews | work teams | 용어 107 |
| docs/design/v3/05-free-city.en.md:128 | work crews | work teams | 용어 107 |
| docs/design/v3/05-free-city.en.md:180 | work crews | work teams | 용어 107 |
| docs/design/v3/05-free-city.en.md:293 | work crews | work teams | 용어 107 |
| docs/design/v3/05-free-city.en.md:202 | work crew | work team | 용어 107 |
| docs/design/v3/05-free-city.en.md:204 | work crew | work team | 용어 107 |
| docs/design/v3/05-free-city.en.md:204 | work crew | work team | 용어 107 |
| docs/design/v3/05-free-city.en.md:326 | work crew | work team | 용어 107 |
| docs/design/v3/05-free-city.en.md:182 | station crews | station teams | 용어 119 |
| docs/design/v3/05-free-city.en.md:125 | drilling crews | drilling work teams | 용어 107 |
| docs/design/v3/05-free-city.en.md:140 | drilling crews | drilling work teams | 용어 107 |
| docs/design/v3/05-free-city.en.md:302 | drilling crews | drilling work teams | 용어 107 |
| docs/design/v3/05-free-city.en.md:282 | Drilling crews | Drilling work teams | 용어 107 |
| docs/design/v3/05-free-city.en.md:34 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/05-free-city.en.md:122 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/05-free-city.en.md:126 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/05-free-city.en.md:126 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/05-free-city.en.md:126 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/05-free-city.en.md:126 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/05-free-city.en.md:126 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/05-free-city.en.md:497 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/05-free-city.en.md:30 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/05-free-city.en.md:93 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/05-free-city.en.md:97 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/05-free-city.en.md:97 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/05-free-city.en.md:97 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/05-free-city.en.md:97 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/05-free-city.en.md:97 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/05-free-city.en.md:497 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/05-free-city.en.md:32 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:107 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:111 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:111 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:111 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:111 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:111 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:111 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:300 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:300 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:382 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:497 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/05-free-city.en.md:104 | shift chiefs | shift leaders | 용어 124 |
| docs/design/v3/05-free-city.en.md:104 | shift chiefs | shift leaders | 용어 124 |
| docs/design/v3/05-free-city.en.md:104 | shift chief | shift leader | 용어 124 |
| docs/design/v3/05-free-city.en.md:104 | shift chief | shift leader | 용어 124 |
| docs/design/v3/05-free-city.en.md:104 | shift chief | shift leader | 용어 124 |
| docs/design/v3/05-free-city.en.md:520 | shift chief | shift leader | 용어 124 |
| docs/design/v3/05-free-city.en.md:75 | market houses | merchant houses | 용어 125 |
| docs/design/v3/05-free-city.en.md:111 | market houses | merchant houses | 용어 125 |
| docs/design/v3/05-free-city.en.md:533 | market house | merchant house | 용어 125 |
| docs/design/v3/05-free-city.en.md:33 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/05-free-city.en.md:115 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/05-free-city.en.md:119 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/05-free-city.en.md:497 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/05-free-city.en.md:31 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/05-free-city.en.md:100 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/05-free-city.en.md:104 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/05-free-city.en.md:104 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/05-free-city.en.md:104 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/05-free-city.en.md:497 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/05-free-city.en.md:514 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/05-free-city.en.md:242 | body fitter | implant technician | 용어 175 |
| docs/design/v3/05-free-city.en.md:254 | body fitter | implant technician | 용어 175 |
| docs/design/v3/05-free-city.en.md:527 | household keepers | household stewards | 용어 198 |
| docs/design/v3/05-free-city.en.md:222 | \| Hands \| | \| Skilled workers \| | 용어 109 |
| docs/design/v3/05-free-city.en.md:195 | \| Hand \| | \| Skilled worker \| | 용어 109 |
| docs/design/v3/05-free-city.en.md:534 | hands, apprentices | skilled workers, apprentices | 용어 109 |
| docs/design/v3/05-free-city.en.md:227 | day hands | labourers | 용어 110 |
| docs/design/v3/05-free-city.en.md:534 | day hands | labourers | 용어 110 |
| docs/design/v3/05-free-city.en.md:223 | Day hands | Labourers | 용어 110 |
| docs/design/v3/05-free-city.en.md:501 | Day hands | Labourers | 용어 110 |
| docs/design/v3/05-free-city.en.md:527 | Day hands | Labourers | 용어 110 |
| docs/design/v3/05-free-city.en.md:527 | Day hands | Labourers | 용어 110 |
| docs/design/v3/06-arc.en.md:583 | fibre-sugar vat keeper | saccharification tank keeper | 용어 166 |
| docs/design/v3/06-arc.en.md:377 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/06-arc.en.md:453 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/06-arc.en.md:463 | fibre-sugar | cellulosic-sugar | 용어 1 |
| docs/design/v3/06-arc.en.md:445 | fibre sugar | cellulosic sugar | 용어 1 |
| docs/design/v3/06-arc.en.md:583 | light-field keeper | greenhouse keeper | 용어 170 |
| docs/design/v3/06-arc.en.md:406 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/06-arc.en.md:445 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/06-arc.en.md:463 | Light-fields | Greenhouses | 용어 3 |
| docs/design/v3/06-arc.en.md:385 | tally keepers | accountants | 용어 165 |
| docs/design/v3/06-arc.en.md:584 | tally keeper | accountant | 용어 165 |
| docs/design/v3/06-arc.en.md:592 | tally keeper | accountant | 용어 165 |
| docs/design/v3/06-arc.en.md:144 | exchange posts | exchanges | 용어 16 |
| docs/design/v3/06-arc.en.md:362 | exchange posts | exchanges | 용어 16 |
| docs/design/v3/06-arc.en.md:383 | exchange posts | exchanges | 용어 16 |
| docs/design/v3/06-arc.en.md:385 | exchange posts | exchanges | 용어 16 |
| docs/design/v3/06-arc.en.md:572 | exchange posts | exchanges | 용어 16 |
| docs/design/v3/06-arc.en.md:130 | exchange post | exchange | 용어 16 |
| docs/design/v3/06-arc.en.md:389 | exchange post | exchange | 용어 16 |
| docs/design/v3/06-arc.en.md:390 | exchange post | exchange | 용어 16 |
| docs/design/v3/06-arc.en.md:391 | exchange post | exchange | 용어 16 |
| docs/design/v3/06-arc.en.md:392 | exchange post | exchange | 용어 16 |
| docs/design/v3/06-arc.en.md:393 | exchange post | exchange | 용어 16 |
| docs/design/v3/06-arc.en.md:454 | exchange post | exchange | 용어 16 |
| docs/design/v3/06-arc.en.md:572 | exchange post | exchange | 용어 16 |
| docs/design/v3/06-arc.en.md:592 | exchange post | exchange | 용어 16 |
| docs/design/v3/06-arc.en.md:584 | day-charge | daily charge allowance | 용어 19 |
| docs/design/v3/06-arc.en.md:360 | day charges | daily charge allowances | 용어 19 |
| docs/design/v3/06-arc.en.md:362 | day charges | daily charge allowances | 용어 19 |
| docs/design/v3/06-arc.en.md:362 | day charges | daily charge allowances | 용어 19 |
| docs/design/v3/06-arc.en.md:390 | day charges | daily charge allowances | 용어 19 |
| docs/design/v3/06-arc.en.md:406 | day charges | daily charge allowances | 용어 19 |
| docs/design/v3/06-arc.en.md:362 | day charge | daily charge allowance | 용어 19 |
| docs/design/v3/06-arc.en.md:190 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/06-arc.en.md:196 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/06-arc.en.md:360 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/06-arc.en.md:362 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/06-arc.en.md:362 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/06-arc.en.md:390 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/06-arc.en.md:391 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/06-arc.en.md:392 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/06-arc.en.md:406 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/06-arc.en.md:470 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/06-arc.en.md:362 | maintenance turn | maintenance queue place | 용어 20 |
| docs/design/v3/06-arc.en.md:350 | power cores | power sources | 용어 21 |
| docs/design/v3/06-arc.en.md:358 | power cores | power sources | 용어 21 |
| docs/design/v3/06-arc.en.md:358 | power cores | power sources | 용어 21 |
| docs/design/v3/06-arc.en.md:393 | power cores | power sources | 용어 21 |
| docs/design/v3/06-arc.en.md:404 | Power cores | Power sources | 용어 21 |
| docs/design/v3/06-arc.en.md:358 | wind machines | wind turbines | 용어 24 |
| docs/design/v3/06-arc.en.md:321 | wind-machine | wind-turbine | 용어 24 |
| docs/design/v3/06-arc.en.md:350 | wind-machine | wind-turbine | 용어 24 |
| docs/design/v3/06-arc.en.md:401 | wind-machine | wind-turbine | 용어 24 |
| docs/design/v3/06-arc.en.md:445 | long-light | long-daylight | 용어 30 |
| docs/design/v3/06-arc.en.md:118 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/06-arc.en.md:249 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/06-arc.en.md:445 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/06-arc.en.md:640 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/06-arc.en.md:585 | rim watcher | blockade lookout | 용어 39 |
| docs/design/v3/06-arc.en.md:130 | rim | blockade line | 용어 37 |
| docs/design/v3/06-arc.en.md:151 | rim | blockade line | 용어 37 |
| docs/design/v3/06-arc.en.md:404 | rim | blockade line | 용어 37 |
| docs/design/v3/06-arc.en.md:572 | rim | blockade line | 용어 37 |
| docs/design/v3/06-arc.en.md:582 | intake keeper | water intake keeper | 용어 75 |
| docs/design/v3/06-arc.en.md:331 | contract meeting | council | 용어 95 |
| docs/design/v3/06-arc.en.md:194 | Bench Keepers | Maintenance Foremen | 용어 159 |
| docs/design/v3/06-arc.en.md:222 | Bench Keepers | Maintenance Foremen | 용어 159 |
| docs/design/v3/06-arc.en.md:342 | Bench Keepers | Maintenance Foremen | 용어 159 |
| docs/design/v3/06-arc.en.md:351 | Bench Keepers | Maintenance Foremen | 용어 159 |
| docs/design/v3/06-arc.en.md:436 | Bench Keepers | Maintenance Foremen | 용어 159 |
| docs/design/v3/06-arc.en.md:561 | Bench Keepers | Maintenance Foremen | 용어 159 |
| docs/design/v3/06-arc.en.md:579 | Bench Keepers | Maintenance Foremen | 용어 159 |
| docs/design/v3/06-arc.en.md:579 | Bench Keepers | Maintenance Foremen | 용어 159 |
| docs/design/v3/06-arc.en.md:658 | Bench Keepers | Maintenance Foremen | 용어 159 |
| docs/design/v3/06-arc.en.md:111 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:114 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:182 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:183 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:200 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:244 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:362 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:366 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:521 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:579 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:579 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:589 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:636 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:636 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:655 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/06-arc.en.md:32 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/06-arc.en.md:57 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/06-arc.en.md:49 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/06-arc.en.md:55 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/06-arc.en.md:240 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/06-arc.en.md:143 | City crew | City work team | 용어 107 |
| docs/design/v3/06-arc.en.md:305 | City crew | City work team | 용어 107 |
| docs/design/v3/06-arc.en.md:49 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:51 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:67 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:93 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:99 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:116 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:249 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:469 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:589 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:612 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:644 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/06-arc.en.md:555 | Heads of the Near Houses | House Heads | 용어 153 |
| docs/design/v3/06-arc.en.md:656 | Heads of the Near Houses | House Heads | 용어 153 |
| docs/design/v3/06-arc.en.md:32 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/06-arc.en.md:67 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/06-arc.en.md:93 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/06-arc.en.md:109 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/06-arc.en.md:114 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/06-arc.en.md:154 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/06-arc.en.md:331 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/06-arc.en.md:578 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/06-arc.en.md:589 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/06-arc.en.md:614 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/06-arc.en.md:578 | Near House elders | house elders | 용어 155 |
| docs/design/v3/06-arc.en.md:578 | Near House elder | house elder | 용어 155 |
| docs/design/v3/06-arc.en.md:425 | Near House band | house armband | 용어 158 |
| docs/design/v3/06-arc.en.md:18 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:65 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:67 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:76 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:76 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:87 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:89 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:118 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:120 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:124 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:131 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:342 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:385 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:488 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:522 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:613 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/06-arc.en.md:20 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:22 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:23 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:24 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:25 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:55 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:55 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:55 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:67 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:79 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:81 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:89 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:91 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:114 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:126 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:129 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:133 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:136 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:140 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:144 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:147 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:165 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:167 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:194 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:208 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:305 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:306 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:366 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:370 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:379 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:385 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:385 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:425 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:435 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:454 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:459 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:469 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:488 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:489 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:490 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:504 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:520 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:520 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:522 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:554 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:578 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:614 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:628 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:636 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/06-arc.en.md:244 | the unbaptised | unbaptised believers | 용어 161 |
| docs/design/v3/06-arc.en.md:259 | the unbaptised | unbaptised believers | 용어 161 |
| docs/design/v3/06-arc.en.md:420 | the unbaptised | unbaptised believers | 용어 161 |
| docs/design/v3/06-arc.en.md:194 | the baptised | baptised believers | 용어 160 |
| docs/design/v3/06-arc.en.md:194 | the baptised | baptised believers | 용어 160 |
| docs/design/v3/06-arc.en.md:200 | the baptised | baptised believers | 용어 160 |
| docs/design/v3/06-arc.en.md:244 | the baptised | baptised believers | 용어 160 |
| docs/design/v3/06-arc.en.md:200 | Baptismal Roll | baptism register | 용어 162 |
| docs/design/v3/06-arc.en.md:202 | Baptismal Roll | baptism register | 용어 162 |
| docs/design/v3/06-arc.en.md:208 | Baptismal Roll | baptism register | 용어 162 |
| docs/design/v3/06-arc.en.md:244 | Baptismal Roll | baptism register | 용어 162 |
| docs/design/v3/06-arc.en.md:248 | Baptismal Roll | baptism register | 용어 162 |
| docs/design/v3/06-arc.en.md:615 | Baptismal Roll | baptism register | 용어 162 |
| docs/design/v3/06-arc.en.md:584 | roll keeper | register clerk | 용어 163 |
| docs/design/v3/06-arc.en.md:51 | Word Keepers | Spokespersons | 용어 164 |
| docs/design/v3/06-arc.en.md:51 | Word Keepers | Spokespersons | 용어 164 |
| docs/design/v3/06-arc.en.md:59 | Word Keepers | Spokespersons | 용어 164 |
| docs/design/v3/06-arc.en.md:584 | Word Keepers | Spokespersons | 용어 164 |
| docs/design/v3/06-arc.en.md:584 | Word Keeper | Spokesperson | 용어 164 |
| docs/design/v3/06-arc.en.md:584 | Word Keeper | Spokesperson | 용어 164 |
| docs/design/v3/06-arc.en.md:603 | Word Keeper | Spokesperson | 용어 164 |
| docs/design/v3/06-arc.en.md:582 | heat-pump keeper | heat-pump technician | 용어 167 |
| docs/design/v3/06-arc.en.md:582 | entrance keeper | entrance guard | 용어 168 |
| docs/design/v3/06-arc.en.md:582 | water-wheel keeper | turbine mechanic | 용어 169 |
| docs/design/v3/06-arc.en.md:583 | mushroom-cellar keeper | mushroom grower | 용어 171 |
| docs/design/v3/06-arc.en.md:59 | carer | caregiver | 용어 172 |
| docs/design/v3/06-arc.en.md:580 | carer | caregiver | 용어 172 |
| docs/design/v3/06-arc.en.md:222 | refitting | re-implantation | 용어 176 |
| docs/design/v3/06-arc.en.md:322 | refitting | re-implantation | 용어 176 |
| docs/design/v3/06-arc.en.md:330 | refitting | re-implantation | 용어 176 |
| docs/design/v3/06-arc.en.md:437 | part-count stitches | part-marking stitches | 용어 177 |
| docs/design/v3/06-arc.en.md:437 | fitting slits | slits | 용어 178 |
| docs/design/v3/06-arc.en.md:418 | fitting slit | slit | 용어 178 |
| docs/design/v3/06-arc.en.md:435 | fitting slit | slit | 용어 178 |
| docs/design/v3/07-people-and-war.en.md:1056 | fibre-sugar vats | saccharification tanks | 용어 2 |
| docs/design/v3/07-people-and-war.en.md:488 | Fibre-sugar | Cellulosic-sugar | 용어 1 |
| docs/design/v3/07-people-and-war.en.md:489 | Light-field | Greenhouse | 용어 3 |
| docs/design/v3/07-people-and-war.en.md:489 | Light-field | Greenhouse | 용어 3 |
| docs/design/v3/07-people-and-war.en.md:1211 | Light-field | Greenhouse | 용어 3 |
| docs/design/v3/07-people-and-war.en.md:286 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/07-people-and-war.en.md:359 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/07-people-and-war.en.md:540 | Tally-board | Price-board | 용어 14 |
| docs/design/v3/07-people-and-war.en.md:200 | tally clerk | price-board clerk | 용어 126 |
| docs/design/v3/07-people-and-war.en.md:351 | tally clerk | price-board clerk | 용어 126 |
| docs/design/v3/07-people-and-war.en.md:59 | Tally clerk | Price-board clerk | 용어 126 |
| docs/design/v3/07-people-and-war.en.md:540 | Tally clerk | Price-board clerk | 용어 126 |
| docs/design/v3/07-people-and-war.en.md:540 | Tally keeper | Accountant | 용어 165 |
| docs/design/v3/07-people-and-war.en.md:429 | power cores | power sources | 용어 21 |
| docs/design/v3/07-people-and-war.en.md:429 | power cores | power sources | 용어 21 |
| docs/design/v3/07-people-and-war.en.md:430 | power cores | power sources | 용어 21 |
| docs/design/v3/07-people-and-war.en.md:431 | power cores | power sources | 용어 21 |
| docs/design/v3/07-people-and-war.en.md:1132 | power cores | power sources | 용어 21 |
| docs/design/v3/07-people-and-war.en.md:1138 | power cores | power sources | 용어 21 |
| docs/design/v3/07-people-and-war.en.md:1078 | power core | power source | 용어 21 |
| docs/design/v3/07-people-and-war.en.md:1078 | Power cores | Power sources | 용어 21 |
| docs/design/v3/07-people-and-war.en.md:1040 | long-light | long-daylight | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:1175 | long-light | long-daylight | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:1204 | long-light | long-daylight | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:1208 | long-light | long-daylight | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:1211 | long-light | long-daylight | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:1041 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:1175 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:1204 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:1208 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:1211 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:530 | Rim watcher | Blockade lookout | 용어 39 |
| docs/design/v3/07-people-and-war.en.md:64 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:64 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:64 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:348 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:357 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:427 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:429 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:429 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:430 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:431 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:1078 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:1141 | rim | blockade line | 용어 37 |
| docs/design/v3/07-people-and-war.en.md:264 | home station | seat station | 용어 43 |
| docs/design/v3/07-people-and-war.en.md:260 | handed-down seats | hereditary seats | 용어 70 |
| docs/design/v3/07-people-and-war.en.md:522 | Intake keeper | Water intake keeper | 용어 75 |
| docs/design/v3/07-people-and-war.en.md:1193 | Assembly Member's Guard Hall | Assembly Member's Guard Headquarters | 용어 80 |
| docs/design/v3/07-people-and-war.en.md:66 | contract meeting | council | 용어 95 |
| docs/design/v3/07-people-and-war.en.md:1089 | contract meeting | council | 용어 95 |
| docs/design/v3/07-people-and-war.en.md:1090 | contract meeting | council | 용어 95 |
| docs/design/v3/07-people-and-war.en.md:1090 | contract meeting | council | 용어 95 |
| docs/design/v3/07-people-and-war.en.md:200 | Host | host | 용어 96 |
| docs/design/v3/07-people-and-war.en.md:344 | Host | host | 용어 96 |
| docs/design/v3/07-people-and-war.en.md:1090 | Host | host | 용어 96 |
| docs/design/v3/07-people-and-war.en.md:286 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/07-people-and-war.en.md:344 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/07-people-and-war.en.md:345 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/07-people-and-war.en.md:349 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/07-people-and-war.en.md:358 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/07-people-and-war.en.md:359 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/07-people-and-war.en.md:286 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/07-people-and-war.en.md:344 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/07-people-and-war.en.md:346 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/07-people-and-war.en.md:348 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/07-people-and-war.en.md:286 | seal house | shareholding house | 용어 99 |
| docs/design/v3/07-people-and-war.en.md:345 | seal house | shareholding house | 용어 99 |
| docs/design/v3/07-people-and-war.en.md:347 | seal house | shareholding house | 용어 99 |
| docs/design/v3/07-people-and-war.en.md:349 | seal house | shareholding house | 용어 99 |
| docs/design/v3/07-people-and-war.en.md:358 | seal house | shareholding house | 용어 99 |
| docs/design/v3/07-people-and-war.en.md:286 | name-worth | reputation | 용어 100 |
| docs/design/v3/07-people-and-war.en.md:286 | name-worth | reputation | 용어 100 |
| docs/design/v3/07-people-and-war.en.md:344 | name-worth | reputation | 용어 100 |
| docs/design/v3/07-people-and-war.en.md:345 | name-worth | reputation | 용어 100 |
| docs/design/v3/07-people-and-war.en.md:348 | name-worth | reputation | 용어 100 |
| docs/design/v3/07-people-and-war.en.md:349 | name-worth | reputation | 용어 100 |
| docs/design/v3/07-people-and-war.en.md:358 | name-worth | reputation | 용어 100 |
| docs/design/v3/07-people-and-war.en.md:359 | name-worth | reputation | 용어 100 |
| docs/design/v3/07-people-and-war.en.md:359 | name-worth | reputation | 용어 100 |
| docs/design/v3/07-people-and-war.en.md:359 | name-worth | reputation | 용어 100 |
| docs/design/v3/07-people-and-war.en.md:286 | bound the seal | resolved to make the seat hereditary | 용어 102 |
| docs/design/v3/07-people-and-war.en.md:359 | bound the seal | resolved to make the seat hereditary | 용어 102 |
| docs/design/v3/07-people-and-war.en.md:110 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:158 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:465 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:649 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:689 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:692 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:692 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:1047 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/07-people-and-war.en.md:641 | Crew Chief | Work Team Leader | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:111 | crew chiefs | work team leaders | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:200 | crew chiefs | work team leaders | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:352 | crew chief | work team leader | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:353 | crew chief | work team leader | 용어 108 |
| docs/design/v3/07-people-and-war.en.md:64 | edge crew | guard unit | 용어 118 |
| docs/design/v3/07-people-and-war.en.md:688 | edge crew | guard unit | 용어 118 |
| docs/design/v3/07-people-and-war.en.md:724 | edge crew | guard unit | 용어 118 |
| docs/design/v3/07-people-and-war.en.md:480 | Edge crew | Guard unit | 용어 118 |
| docs/design/v3/07-people-and-war.en.md:1089 | work crews | work teams | 용어 107 |
| docs/design/v3/07-people-and-war.en.md:461 | Station crew | Station team | 용어 119 |
| docs/design/v3/07-people-and-war.en.md:348 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/07-people-and-war.en.md:430 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/07-people-and-war.en.md:632 | Edge Warden | Guard Commander | 용어 122 |
| docs/design/v3/07-people-and-war.en.md:349 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/07-people-and-war.en.md:634 | Wind Keeper | Power Station Director | 용어 121 |
| docs/design/v3/07-people-and-war.en.md:96 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/07-people-and-war.en.md:344 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/07-people-and-war.en.md:344 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/07-people-and-war.en.md:356 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/07-people-and-war.en.md:630 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/07-people-and-war.en.md:1062 | Market Master | Head of the Merchants' Association | 용어 123 |
| docs/design/v3/07-people-and-war.en.md:108 | Shift Chiefs | Shift Leaders | 용어 124 |
| docs/design/v3/07-people-and-war.en.md:459 | Shift Chief | Shift Leader | 용어 124 |
| docs/design/v3/07-people-and-war.en.md:638 | Shift Chief | Shift Leader | 용어 124 |
| docs/design/v3/07-people-and-war.en.md:688 | Shift Chief | Shift Leader | 용어 124 |
| docs/design/v3/07-people-and-war.en.md:279 | heir child | heir | 용어 128 |
| docs/design/v3/07-people-and-war.en.md:97 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/07-people-and-war.en.md:346 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/07-people-and-war.en.md:631 | Works Master | Plant Manager | 용어 3절 공장장 |
| docs/design/v3/07-people-and-war.en.md:347 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/07-people-and-war.en.md:633 | Depot Master | Depot Chief | 용어 3절 기지장 |
| docs/design/v3/07-people-and-war.en.md:113 | Heads of the Near Houses | House Heads | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:1166 | Heads of the Near Houses | House Heads | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:107 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:154 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:287 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:377 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:463 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:646 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:689 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:692 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:692 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:827 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:1091 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:1158 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:1194 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/07-people-and-war.en.md:108 | Near House elders | house elders | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:692 | Near House elders | house elders | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:463 | Near House elder | house elder | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:647 | Near House elder | house elder | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:689 | Near House elder | house elder | 용어 155 |
| docs/design/v3/07-people-and-war.en.md:652 | Near House member | house member | 용어 156 |
| docs/design/v3/07-people-and-war.en.md:260 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:287 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1126 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1165 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:95 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:154 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:268 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:269 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:269 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:287 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:366 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:367 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:368 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:369 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:370 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:371 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:372 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:373 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:374 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:377 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:377 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:378 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:463 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:827 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1040 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1042 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1084 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1084 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1091 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1091 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1114 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1126 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1158 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1236 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1236 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/07-people-and-war.en.md:1084 | the unbaptised | unbaptised believers | 용어 161 |
| docs/design/v3/07-people-and-war.en.md:692 | the baptised | baptised believers | 용어 160 |
| docs/design/v3/07-people-and-war.en.md:541 | Roll keeper | Register clerk | 용어 163 |
| docs/design/v3/07-people-and-war.en.md:108 | Word Keepers | Spokespersons | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:692 | Word Keepers | Spokespersons | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:516 | Word Keeper | Spokesperson | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:651 | Word Keeper | Spokesperson | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:689 | Word Keeper | Spokesperson | 용어 164 |
| docs/design/v3/07-people-and-war.en.md:488 | Vat keeper | Saccharification tank keeper | 용어 166 |
| docs/design/v3/07-people-and-war.en.md:495 | Entrance keeper | Entrance guard | 용어 168 |
| docs/design/v3/07-people-and-war.en.md:520 | Water-wheel keeper | Turbine mechanic | 용어 169 |
| docs/design/v3/07-people-and-war.en.md:490 | Mushroom-cellar keeper | Mushroom grower | 용어 171 |
| docs/design/v3/07-people-and-war.en.md:484 | carer | caregiver | 용어 172 |
| docs/design/v3/07-people-and-war.en.md:945 | Direct liege | Direct superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:279 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:279 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:279 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:774 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:774 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:827 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:827 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:827 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:827 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:827 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:827 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:828 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:829 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:829 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:829 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:829 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:829 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:829 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:831 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:942 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:944 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:945 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:945 | liege | superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:827 | Liege | Superior | 용어 195a |
| docs/design/v3/07-people-and-war.en.md:501 | Household keeper | Household steward | 용어 198 |
| docs/design/v3/07-people-and-war.en.md:498 | Hearth keeper | Hearth attendant | 용어 201 |
| docs/design/v3/07-people-and-war.en.md:642 | \| Hand \| | \| Skilled worker \| | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:111 | hands, apprentices | skilled workers, apprentices | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:688 | Hands, trade | Skilled workers, trade | 용어 109 |
| docs/design/v3/07-people-and-war.en.md:354 | hand (records) | skilled worker (records) | 용어 109 |
| docs/design/v3/08-document-map.en.md:62 | fibre sugar | cellulosic sugar | 용어 1 |
| docs/design/v3/08-document-map.en.md:75 | fibre sugar | cellulosic sugar | 용어 1 |
| docs/design/v3/08-document-map.en.md:53 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/08-document-map.en.md:62 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/08-document-map.en.md:77 | light-fields | greenhouses | 용어 3 |
| docs/design/v3/08-document-map.en.md:29 | kilos | kWh | 용어 6 |
| docs/design/v3/08-document-map.en.md:29 | hand-hours | labour hours | 용어 7 |
| docs/design/v3/08-document-map.en.md:46 | rate board | price board | 용어 14 |
| docs/design/v3/08-document-map.en.md:55 | exchange posts | exchanges | 용어 16 |
| docs/design/v3/08-document-map.en.md:29 | day-charges | daily charge allowances | 용어 19 |
| docs/design/v3/08-document-map.en.md:29 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/08-document-map.en.md:54 | power cores | power sources | 용어 21 |
| docs/design/v3/08-document-map.en.md:77 | wind-machine fields | wind farms | 용어 25 |
| docs/design/v3/08-document-map.en.md:35 | long-light | long-daylight | 용어 30 |
| docs/design/v3/08-document-map.en.md:35 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/08-document-map.en.md:105 | Rim machines | Blockade-line machines | 용어 37 |
| docs/design/v3/08-document-map.en.md:106 | Rim machines | Blockade-line machines | 용어 37 |
| docs/design/v3/08-document-map.en.md:107 | Rim machines | Blockade-line machines | 용어 37 |
| docs/design/v3/08-document-map.en.md:108 | Rim machines | Blockade-line machines | 용어 37 |
| docs/design/v3/08-document-map.en.md:109 | Rim machines | Blockade-line machines | 용어 37 |
| docs/design/v3/08-document-map.en.md:110 | Rim machines | Blockade-line machines | 용어 37 |
| docs/design/v3/08-document-map.en.md:111 | Rim machines | Blockade-line machines | 용어 37 |
| docs/design/v3/08-document-map.en.md:112 | Rim machines | Blockade-line machines | 용어 37 |
| docs/design/v3/08-document-map.en.md:114 | Rim machines | Blockade-line machines | 용어 37 |
| docs/design/v3/08-document-map.en.md:33 | rim machines | blockade-line machines | 용어 37 |
| docs/design/v3/08-document-map.en.md:54 | Rim | Blockade line | 용어 37 |
| docs/design/v3/08-document-map.en.md:54 | rim | blockade line | 용어 37 |
| docs/design/v3/08-document-map.en.md:77 | rim | blockade line | 용어 37 |
| docs/design/v3/08-document-map.en.md:105 | One-Eye Towers | watchtowers | 용어 51 |
| docs/design/v3/08-document-map.en.md:105 | One-Eye Tower | watchtower | 용어 51 |
| docs/design/v3/08-document-map.en.md:107 | Growlers | returning unmanned ground vehicles | 용어 54 |
| docs/design/v3/08-document-map.en.md:108 | Bulgasari | repair machine | 용어 58 |
| docs/design/v3/08-document-map.en.md:114 | Iron Dinosaurs | autonomous construction machines | 용어 59 |
| docs/design/v3/08-document-map.en.md:114 | Iron Dinosaur | autonomous construction machine | 용어 59 |
| docs/design/v3/08-document-map.en.md:96 | Pincer Arm | logistics robot arm | 용어 60 |
| docs/design/v3/08-document-map.en.md:102 | Empty Carts | track inspection robots | 용어 61 |
| docs/design/v3/08-document-map.en.md:102 | Empty Cart | track inspection robot | 용어 61 |
| docs/design/v3/08-document-map.en.md:103 | Care Wheels | service robots | 용어 62 |
| docs/design/v3/08-document-map.en.md:103 | Care Wheel | service robot | 용어 62 |
| docs/design/v3/08-document-map.en.md:104 | Girder Spiders | construction robots | 용어 63 |
| docs/design/v3/08-document-map.en.md:104 | Girder Spider | construction robot | 용어 63 |
| docs/design/v3/08-document-map.en.md:113 | Lantern Ant | cable inspection robot | 용어 64 |
| docs/design/v3/08-document-map.en.md:44 | contract meeting | council | 용어 95 |
| docs/design/v3/08-document-map.en.md:46 | contract meeting | council | 용어 95 |
| docs/design/v3/08-document-map.en.md:10 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/08-document-map.en.md:46 | work crews | work teams | 용어 107 |
| docs/design/v3/08-document-map.en.md:47 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:467 | fibre sugar | cellulosic sugar | 용어 1 |
| docs/design/v3/09-ck3-systems.en.md:511 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/09-ck3-systems.en.md:512 | hearth kilos | heating contribution | 용어 5 |
| docs/design/v3/09-ck3-systems.en.md:513 | Hearth kilos | Heating contribution | 용어 5 |
| docs/design/v3/09-ck3-systems.en.md:359 | kilos | kWh | 용어 6 |
| docs/design/v3/09-ck3-systems.en.md:466 | kilos | kWh | 용어 6 |
| docs/design/v3/09-ck3-systems.en.md:623 | kilos | kWh | 용어 6 |
| docs/design/v3/09-ck3-systems.en.md:525 | hand-hours | labour hours | 용어 7 |
| docs/design/v3/09-ck3-systems.en.md:571 | hand-hours | labour hours | 용어 7 |
| docs/design/v3/09-ck3-systems.en.md:606 | the giving | the contribution | 용어 18 |
| docs/design/v3/09-ck3-systems.en.md:359 | day charges | daily charge allowances | 용어 19 |
| docs/design/v3/09-ck3-systems.en.md:466 | day charges | daily charge allowances | 용어 19 |
| docs/design/v3/09-ck3-systems.en.md:549 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/09-ck3-systems.en.md:552 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/09-ck3-systems.en.md:571 | maintenance turns | maintenance queue places | 용어 20 |
| docs/design/v3/09-ck3-systems.en.md:438 | power cores | power sources | 용어 21 |
| docs/design/v3/09-ck3-systems.en.md:467 | wind machine | wind turbine | 용어 24 |
| docs/design/v3/09-ck3-systems.en.md:263 | long-light season | long-daylight half | 용어 30 |
| docs/design/v3/09-ck3-systems.en.md:291 | long-light season | long-daylight half | 용어 30 |
| docs/design/v3/09-ck3-systems.en.md:263 | long-dark season | short-daylight half | 용어 30 |
| docs/design/v3/09-ck3-systems.en.md:291 | long-dark season | short-daylight half | 용어 30 |
| docs/design/v3/09-ck3-systems.en.md:457 | long-dark season | short-daylight half | 용어 30 |
| docs/design/v3/09-ck3-systems.en.md:465 | long-light | long-daylight | 용어 30 |
| docs/design/v3/09-ck3-systems.en.md:465 | long-dark | short-daylight | 용어 30 |
| docs/design/v3/09-ck3-systems.en.md:438 | perimeter | blockade line | 용어 37 |
| docs/design/v3/09-ck3-systems.en.md:568 | fourteen seals | fourteen seal impressions | 용어 69 |
| docs/design/v3/09-ck3-systems.en.md:573 | contract meetings | councils | 용어 95 |
| docs/design/v3/09-ck3-systems.en.md:385 | contract meeting | council | 용어 95 |
| docs/design/v3/09-ck3-systems.en.md:524 | contract meeting | council | 용어 95 |
| docs/design/v3/09-ck3-systems.en.md:527 | contract meeting | council | 용어 95 |
| docs/design/v3/09-ck3-systems.en.md:536 | contract meeting | council | 용어 95 |
| docs/design/v3/09-ck3-systems.en.md:527 | Host | host | 용어 96 |
| docs/design/v3/09-ck3-systems.en.md:512 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/09-ck3-systems.en.md:513 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/09-ck3-systems.en.md:517 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/09-ck3-systems.en.md:527 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/09-ck3-systems.en.md:568 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/09-ck3-systems.en.md:623 | masters' meeting | meeting of representatives | 용어 98 |
| docs/design/v3/09-ck3-systems.en.md:573 | Masters' meeting | Meeting of representatives | 용어 98 |
| docs/design/v3/09-ck3-systems.en.md:527 | bench masters | representatives | 용어 97 |
| docs/design/v3/09-ck3-systems.en.md:520 | bench master | representative | 용어 97 |
| docs/design/v3/09-ck3-systems.en.md:511 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/09-ck3-systems.en.md:517 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/09-ck3-systems.en.md:527 | seal houses | shareholding houses | 용어 99 |
| docs/design/v3/09-ck3-systems.en.md:511 | seal house | shareholding house | 용어 99 |
| docs/design/v3/09-ck3-systems.en.md:514 | seal house | shareholding house | 용어 99 |
| docs/design/v3/09-ck3-systems.en.md:515 | seal house | shareholding house | 용어 99 |
| docs/design/v3/09-ck3-systems.en.md:516 | Seal houses | Shareholding houses | 용어 99 |
| docs/design/v3/09-ck3-systems.en.md:512 | name-worth | reputation | 용어 100 |
| docs/design/v3/09-ck3-systems.en.md:518 | name-worth | reputation | 용어 100 |
| docs/design/v3/09-ck3-systems.en.md:623 | name-worth | reputation | 용어 100 |
| docs/design/v3/09-ck3-systems.en.md:512 | Name-worth | Reputation | 용어 100 |
| docs/design/v3/09-ck3-systems.en.md:568 | Name-worth | Reputation | 용어 100 |
| docs/design/v3/09-ck3-systems.en.md:515 | outside posts | external offices | 용어 101 |
| docs/design/v3/09-ck3-systems.en.md:514 | outside post | external office | 용어 101 |
| docs/design/v3/09-ck3-systems.en.md:517 | Binding the seal | The hereditary resolution | 용어 102 |
| docs/design/v3/09-ck3-systems.en.md:511 | bound the seal | resolved to make the seat hereditary | 용어 102 |
| docs/design/v3/09-ck3-systems.en.md:518 | wind share | tie-break | 용어 103 |
| docs/design/v3/09-ck3-systems.en.md:548 | Bench Keeper | Maintenance Foreman | 용어 159 |
| docs/design/v3/09-ck3-systems.en.md:554 | maintenance benches | maintenance units | 용어 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:454 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:458 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:467 | maintenance bench | maintenance unit | 용어 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:545 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/09-ck3-systems.en.md:553 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/09-ck3-systems.en.md:568 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/09-ck3-systems.en.md:573 | Seat of the Four Near Houses | Council of House Heads | 용어 154 |
| docs/design/v3/09-ck3-systems.en.md:559 | Heads of the Near Houses | House Heads | 용어 153 |
| docs/design/v3/09-ck3-systems.en.md:360 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/09-ck3-systems.en.md:544 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/09-ck3-systems.en.md:544 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/09-ck3-systems.en.md:548 | Head of the Near House | House Head | 용어 153 |
| docs/design/v3/09-ck3-systems.en.md:354 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:546 | Near Houses | inner-circle houses | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:427 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:544 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:544 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:547 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:555 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:557 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:558 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:578 | Near House | inner-circle house | 용어 152 |
| docs/design/v3/09-ck3-systems.en.md:354 | baptismal roll | baptism register | 용어 162 |
| docs/design/v3/09-ck3-systems.en.md:126 | liege | superior | 용어 195a |
| docs/design/v3/09-ck3-systems.en.md:147 | liege | superior | 용어 195a |
| docs/design/v3/01-core.en.md:42 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/01-core.en.md:376 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/01-core.en.md:380 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/01-core.en.md:519 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/01-core.en.md:520 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:22 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:103 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:103 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:103 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:134 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:142 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:165 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:237 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:238 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:254 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:257 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:266 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:278 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:286 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:304 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:332 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:404 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:421 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:444 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:450 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:450 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:450 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:450 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:450 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:450 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:452 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:452 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:452 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:452 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:472 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:481 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:503 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:517 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:531 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/03-technology.en.md:556 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:20 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:51 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:51 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:56 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:58 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:59 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:59 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:59 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:59 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:60 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:62 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:76 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:118 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:119 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:119 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:119 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:134 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:180 | Workbenches | Workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:182 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:182 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:182 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:184 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:186 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:186 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:186 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:186 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:186 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:186 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:186 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:186 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:188 | Benches | Workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:188 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:188 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:190 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:194 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:194 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:195 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:195 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:195 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:196 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:200 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:200 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:204 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:204 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:204 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:204 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:204 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:221 | Workbench | Workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:221 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:222 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:225 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:225 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:225 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:227 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:246 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:260 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:260 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:260 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:260 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:260 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:260 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:260 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:260 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:372 | Bench | Workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:372 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:372 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:372 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:373 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:396 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:396 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:400 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:404 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:404 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:404 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:404 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:408 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:416 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:420 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:420 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:441 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:456 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:523 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:523 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:523 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:523 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:527 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:531 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.en.md:553 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:87 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:136 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:143 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:182 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:183 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:186 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:200 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:216 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:222 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:245 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:247 | Bench | Workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:257 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:306 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:351 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:362 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:370 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:385 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:385 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:436 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:449 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:449 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:453 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:454 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:455 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:459 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:459 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:465 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:477 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:572 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/06-arc.en.md:580 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:62 | Bench | Workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:62 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:62 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:64 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:64 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:108 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:111 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:200 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:200 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:286 | Benches | Workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:286 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:286 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:286 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:286 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:345 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:346 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:349 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:350 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:350 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:358 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:359 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:465 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:485 | Bench | Workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:640 | Bench | Workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:688 | Bench | Workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:689 | Bench | Workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:720 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:720 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:1047 | bench | maintenance unit | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:1059 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:1073 | benches | maintenance units | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:1077 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:1077 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:1125 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:1138 | benches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/07-people-and-war.en.md:1152 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/08-document-map.en.md:10 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/08-document-map.en.md:17 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/08-document-map.en.md:46 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/08-document-map.en.md:76 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:354 | workbenches | workshops | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:360 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:454 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:458 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:515 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:515 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:516 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:520 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:520 | bench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:528 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/09-ck3-systems.en.md:530 | workbench | workshop | 용어 104 / 3절 정비대 |
| docs/design/v3/05-free-city.md:97 | 철마다 약속한 와트 | 반년마다 약속한 와트 | 용어 30 |
| docs/design/v3/05-free-city.en.md:97 | the watts it promised each season | the watts it promised each half-year | 용어 30 |
| docs/design/v3/05-free-city.en.md:43 | Gangseo counts seasons that met their watts | Gangseo counts half-years that met their watts | 용어 30 |
| docs/design/v3/03-technology.en.md:215 | a season's wound | a half-year's wound | 용어 30 |
| docs/design/v3/03-technology.en.md:474 | for a season" | for half a year" | 용어 30 |
| docs/design/v3/07-people-and-war.md:1169 | ### 12.6 싸움터와 철 | ### 12.6 싸움터와 낮의 길이 | 용어 30 |
| docs/design/v3/07-people-and-war.en.md:1169 | ### 12.6 Battlefields and seasons | ### 12.6 Battlefields and daylight | 용어 30 |
| docs/design/v3/09-ck3-systems.md:263 | 첫 턴에 철 사건을 더한다 | 첫 턴에 그 반년의 사건을 더한다 | 용어 30 |
| docs/design/v3/09-ck3-systems.en.md:263 | A season event is added on the first turn | An event for that half is added on the first turn | 용어 30 |
| docs/design/v3/09-ck3-systems.en.md:291 | the season (long-daylight half | the half of the year (long-daylight half | 용어 30 |
| docs/design/v3/09-ck3-systems.en.md:465 | long-daylight and short-daylight seasons | long-daylight and short-daylight halves | 용어 30 |
| docs/design/v3/04-government.md:135 | 대한민국의 주민등록증은 얇은 쇠판에 번호를 새긴 **주민등록증**으로 바뀌었다. | 대한민국의 주민등록증은 얇은 쇠판에 번호를 새긴 것으로 바뀌었고, 이름은 그대로 **주민등록증**이다. | 용어 72 |
| docs/design/v3/04-government.en.md:135 | The Republic of Korea's resident registration card became the **registration token**, a thin metal plate with the number cut into it. | The Republic of Korea's resident registration card became a thin metal plate with the number cut into it; it is still called the **resident registration card**. | 용어 72 |
| docs/design/v3/04-government.en.md:330 | beside the registration token | beside the resident registration card | 용어 72 |
| docs/design/v3/06-arc.md:247 | \| 정비 밥 \| 세례를 받은 뒤 앓는 동안 \| | \| 세례 뒤 앓는 사람에게 먹이는 밥 \| 세례를 받은 뒤 앓는 동안 \| | 용어 179 |
| docs/design/v3/06-arc.en.md:247 | \| Workshop meal \| while ailing after baptism \| | \| Food for the newly baptised \| while ailing after baptism \| | 용어 179 |
| docs/design/v3/06-arc.md:465 | 아크만의 풍습은 **정비 밥**이다. 갓 세례를 받아 앓는 사람에게 맞춰 준 정비공의 집안이 한솥밥에서 먼저 떠 먹인다. | 아크만의 풍습이 있다. 갓 세례를 받아 앓는 사람에게, 부위를 맞춰 준 정비공의 집안이 한솥밥에서 먼저 떠 먹인다. | 용어 179 |
| docs/design/v3/06-arc.en.md:465 | The Arc's own custom is the **workshop meal**: someone ailing | The Arc has a custom of its own: someone ailing | 용어 179 |
| docs/design/v3/01-core.md:529 | \| 봉인지기와 문(門) 체제 \| | \| 옛 설계의 봉인 관리 직책과 문(門) 체제 \| | 용어 195 |
| docs/design/v3/06-arc.md:11 | 그 문서의 봉인지기, 문(門), | 그 문서의 봉인 관리 직책, 문(門), | 용어 195 |
| docs/design/v3/03-technology.md:386 | 짐을 나르던 사람 꼴, 바퀴 꼴 기계 | 짐을 나르던 휴머노이드 로봇과 바퀴로 다니는 로봇 | 용어 50 |
| docs/design/v3/03-technology.md:392 | 사람 꼴 기계 한 대는 | 휴머노이드 로봇 한 대는 | 용어 50 |
| docs/design/v3/08-document-map.md:74 | 대정전 전에 만든 사람 꼴 기계가 | 대정전 전에 만든 휴머노이드 로봇이 | 용어 50 |
| docs/design/v3/03-technology.en.md:450 | under a "hand contract" | under an "apprenticeship contract" | 용어 113 |
| docs/design/v3/03-technology.en.md:556 | workshop and hand contracts | workshop and apprenticeship contracts | 용어 113 |
| docs/design/v3/09-ck3-systems.en.md:511 | whether the seal is bound | whether the seat is made hereditary | 용어 102 |
| docs/design/v3/05-free-city.md:135 | 지킴 일손을 가장 많이 둔다 | 경비 일손을 가장 많이 둔다 | 용어 116 |
| docs/design/v3/05-free-city.md:340 | 그 도시의 지킴이 선다 | 그 도시의 경비원이 선다 | 용어 116 |
| docs/design/v3/05-free-city.md:344 | 세 건널목에 지킴을 늘 세운다 | 세 건널목에 경비원을 늘 세운다 | 용어 116 |
| docs/design/v3/05-free-city.md:379 | 건널목 지킴은 흰 눈 덧옷을 | 건널목 경비원은 흰 눈 덧옷을 | 용어 116 |
| docs/design/v3/05-free-city.md:441 | 건널목의 지킴에 내는 것이다 | 건널목의 경비에 내는 것이다 | 용어 116 |
| docs/design/v3/05-free-city.md:514 | "지킴" 칸의 건널목장 | "경비원" 칸의 건널목장 | 용어 116 |
| docs/design/v3/05-free-city.md:565 | 다리 북쪽 끝의 지킴, | 다리 북쪽 끝의 경비, | 용어 116 |
| docs/design/v3/05-free-city.md:566 | 아크 쪽 지킴. | 아크 쪽 경비. | 용어 116 |
| docs/design/v3/07-people-and-war.md:111 | 장사·계약, 지킴, 일꾼·살림 | 장사·계약, 경비원, 일꾼·살림 | 용어 116 |
| docs/design/v3/09-ck3-systems.md:530 | 정한 날만큼 지킴에 낸다 | 정한 날만큼 경비에 낸다 | 용어 116 |
| docs/design/v3/05-free-city.md:246 | "손"은 셈 단위가 아니다. | "숙련공"은 셈 단위가 아니다. | 용어 109 |
| docs/design/v3/05-free-city.en.md:246 | "Hand" is not a unit of reckoning; | "Skilled worker" is not a unit of reckoning; | 용어 109 |
| docs/design/v3/05-free-city.en.md:128 | **Hands without surety.** | **People without a guarantor.** | 용어 112 |
| docs/design/v3/05-free-city.en.md:128 | "Geumcheon Hands Without Surety" | "Geumcheon People Without a Guarantor" | 용어 112 |
| docs/design/v3/05-free-city.en.md:242 | \| Hand-hour \| | \| Labour hour \| | 용어 7 |
| docs/design/v3/05-free-city.en.md:501 | Hands and apprentices | Skilled workers and apprentices | 용어 109 |
| docs/design/v3/05-free-city.en.md:524 | Hands and apprentices | Skilled workers and apprentices | 용어 109 |
| docs/design/v3/05-free-city.en.md:524 | Hand (in the city's work) | Skilled worker (in the city's work) | 용어 109 |
| docs/design/v3/05-free-city.en.md:141 | logging crew heads | logging foremen | 용어 135 |
| docs/design/v3/05-free-city.en.md:523 | logging crew heads | logging foremen | 용어 135 |
| docs/design/v3/05-free-city.en.md:501 | crew leads | work team leaders | 용어 108 |
| docs/design/v3/05-free-city.en.md:523 | crew leads | work team leaders | 용어 108 |
| docs/design/v3/05-free-city.en.md:532 | crew leads | work team leaders | 용어 108 |
| docs/design/v3/05-free-city.en.md:538 | crew leads | work team leaders | 용어 108 |
| docs/design/v3/05-free-city.en.md:204 | crew lead | work team leader | 용어 108 |
| docs/design/v3/05-free-city.en.md:445 | crew lead | work team leader | 용어 108 |
| docs/design/v3/05-free-city.en.md:523 | crew lead | work team leader | 용어 108 |
| docs/design/v3/05-free-city.en.md:514 | crew heads | work team leaders | 용어 108 |
| docs/design/v3/05-free-city.en.md:204 | the crew disperses | the work team disperses | 용어 107 |
| docs/design/v3/05-free-city.en.md:284 | for crews and freight | for work teams and freight | 용어 107 |
| docs/design/v3/07-people-and-war.en.md:200 | crew-chief cells | work-team-leader cells | 용어 108 |
| docs/design/v3/01-core.md:320 | 겨울의 래칫(3.7절)는 | 겨울의 래칫(3.7절)은 | 용어 조사(괄호 뒤) |
| docs/design/v3/01-core.md:544 | 겨울의 래칫(3.7절)를 | 겨울의 래칫(3.7절)을 | 용어 조사(괄호 뒤) |
| docs/design/v3/05-free-city.md:55 | 충전된 전지 팩(6.3절)로 | 충전된 전지 팩(6.3절)으로 | 용어 조사(괄호 뒤) |
| docs/design/v3/05-free-city.md:55 | 1인 1일분(6.2절)로 | 1인 1일분(6.2절)으로 | 용어 조사(괄호 뒤) |
| docs/design/v3/05-free-city.md:111 | 시세표(6.4절)을 | 시세표(6.4절)를 | 용어 조사(괄호 뒤) |
| docs/design/v3/05-free-city.md:350 | 봉쇄선(01-core 6.3절)를 | 봉쇄선(01-core 6.3절)을 | 용어 조사(괄호 뒤) |
| docs/design/v3/06-arc.md:130 | 봉쇄선(01-core 6.3절)를 | 봉쇄선(01-core 6.3절)을 | 용어 조사(괄호 뒤) |
| docs/design/v3/06-arc.md:392 | 정비 순번(7.5절)와 | 정비 순번(7.5절)과 | 용어 조사(괄호 뒤) |
| docs/design/v3/07-people-and-war.md:592 | 직급(`rank_ko`)는 | 직급(`rank_ko`)은 | 용어 조사(괄호 뒤) |
| docs/design/v3/09-ck3-systems.md:263 | 낮이 긴 때(4~9월 턴)과 | 낮이 긴 때(4~9월 턴)와 | 용어 조사(괄호 뒤) |
| docs/design/v3/01-core.md:130 | 땔감과 당화액 원료로 | 땔감과 당화 원료로 | 용어 1(원료를 가리킬 때는 당화 원료) |
| docs/design/v3/01-core.md:494 | 땔감과 당화액 원료로 | 땔감과 당화 원료로 | 용어 1(원료를 가리킬 때는 당화 원료) |
| docs/design/v3/03-technology.md:103 | 작업장 위에서 손에서 손으로 | 작업장 안에서 손에서 손으로 | 용어 104 뒤 문장 다듬기 |
| docs/design/v3/03-technology.en.md:103 | passes hand to hand on the workshop | passes hand to hand in the workshop | 용어 104 뒤 문장 다듬기 |
| docs/design/v3/03-technology.md:312 | 봉쇄선 봉쇄 지대 안에서 | 봉쇄 지대 안에서 | 용어 37·38 겹침 정리 |
| docs/design/v3/01-core.en.md:255 | a battery pack of separate contracts | a bundle of separate contracts | 일반 낱말 bundle 되돌림(전지가 아님) |
| docs/design/v3/03-technology.en.md:450 | the battery pack of tools | the bundle of tools | 일반 낱말 bundle 되돌림 |
| docs/design/v3/07-people-and-war.en.md:1040 | battery packs of fibre | bundles of fibre | 일반 낱말 bundle 되돌림 |
| docs/design/v3/09-ck3-systems.en.md:236 | a battery pack of damage | a bundle of damage | 일반 낱말 bundle 되돌림 |
| docs/design/v3/05-free-city.en.md:30 | wind-field | wind-farm | 용어 25 |
| docs/design/v3/01-core.md:53 | 새 이름은 장소가 아니라 시설이나 쓰임에만 붙인다(예: 온실). | 시설과 쓰임에도 새 말을 짓지 않고 표준국어대사전의 표제어나 지금 쓰는 기술어를 쓴다(예: 온실, 풍력 발전기. 판정은 `12a-terms.md`). | 소유자 지시(지은 말 금지)에 맞춰 이름 짓기 규칙 5항을 고침 |
| docs/design/v3/01-core.en.md:53 | New names are given only to facilities or uses, never to places (for example, greenhouse). | Facilities and uses get no coined words either: they take a headword of the Standard Korean Dictionary or a current technical term (for example, greenhouse, wind turbine; rulings in `12a-terms.md`). | 같은 까닭 |

## 4. 판단과 바꾸지 않은 것

- **동결선 33 m.** 11장 3.3절 7행은 35 m 기준으로 2056년 12 m, 2086년 25 m, 한 해 22 cm를 적었지만, 소유자가 고른 B안 표(11장 2.5절)는 언 땅의 경계를 약 33 m로 둔다. 권위가 같은 장 안에서 B안 표를 따랐고, 7행의 √t 비례를 33 m에 다시 적용했다(1절 B1). 02장의 35 m는 도감 과제가 고칠 몫이다.
- **인구 총계는 그대로.** B안으로 열 한도가 약 10% 풀리지만 세력 인구(30만, 16만·7만 5천·6만 5천)는 섬유가 정하는 세력 한도와 2052년의 역사에서 나온 값이고 인물 배치(07장)가 기대므로 바꾸지 않았다(1절 B6).
- **온실의 끼니 몫 12%는 그대로.** 11장 2.5절의 "빛이 늘면 온실의 몫이 커진다"는 넓이당 수확으로 반영했다. 넓이를 늘리면 지표 신호(11장 2.4절 T33-12)가 커지므로 넓이를 줄여 같은 몫을 낸다(1절 B8). 지붕감과 금기를 01-core 5.3절에 적었다.
- **"장부 밖"(용어 42).** 표가 입말은 둔다고 정했으므로 바꾸지 않았다. 공문 말투 자리에서 "미등록 지역"으로 바꿀 곳은 문서 원고 과제가 정한다.
- **"영주"(용어 195b).** 01, 05, 07, 08장의 "영주"는 모두 은퇴한 옛 설계의 계급을 가리키는 설계 문장("옛 영주", "서울 밖 영주 91명")이고, 09장의 "영주"는 CK3의 lord 번역이다. 표가 설계 문서에서 옛 설계를 가리키는 쓰임을 허용하므로 두었다.
- **"손", "일손"의 관용 쓰임.** 용어 109·110은 신분 이름으로 쓴 "손"과 "일손"만 바꾼다. "고치는 손이 모자라다", "손에서 손으로", "보증은 손으로 갚는다" 같은 관용 표현과 일반 명사 "일손"(정부의 일손, 계약 일꾼 무리)은 표준어 뜻 그대로라 두었다. 영어의 일반 "hands"도 두었다.
- **"지킴"(01-core 6.3절 "그 지킴이다")과 07장 5.3절 분류 키워드 목록의 "지킴".** 앞은 기계가 명령을 지키는 일을 가리키는 동사의 명사형, 뒤는 옛 직업 문구를 분류하는 검색어 목록이라 두었다.
- **"부착대"(03장 1절 표).** 용어 표에 없는 말이라 바꾸지 않았다. 영어 "Fitting bench"도 그대로 두었다. 다음 용어 검토에서 판정할 후보로 넘긴다.
- **영어의 "bench" 판정.** 같은 줄 번호의 한국어 줄에 "정비대"만 있으면 아크의 정비대(maintenance unit), "작업"이 있으면 자유도시의 작업장(workshop)으로 바꿨다. 둘이 함께 있던 네 곳은 손으로 보았다(06장 143·306·477줄은 maintenance unit, 03장 142줄은 그대로).
- **07장의 직업 이름 표와 적용기 코드 조각**(예: 07장 673줄의 `'숙련공': { learning: 1 }`)은 바이블 정본을 따라 새 말로 바꿨다. 인물 입력, 090 데이터, `scripts/pages/ck3-stats.mjs`의 실제 키는 인물 과제가 같은 말로 다시 적용해야 맞는다.
- **바이블 3.3절 표의 `docs/CANON-BIBLE.md` 행(3: 322줄 "대정전 약 백 년 전", 4: 399줄 Q2).** 이 과제의 범위가 바이블 장(01, 03~10)이라 고치지 않았다. 통합 과제(36)가 고친다.
- **11장 4.4절의 다른 고칠 것**(04~06장 생활 절의 지상 불빛 금기, 03장 8절의 휴머노이드 수 근거, 07장 12절과 130~132의 겉모습 문구)은 과제 38 2부의 몫이라 이 커밋에 넣지 않았다. 다만 01-core 5.3절 온실 문단에 금기를 한 문장 적었다.

- **도감 행 G22(08장 3.6절 새 제목 "도깨비불 / Dokkaebi Lights").** 2차 검토 막는 점 2로 G13~G26의 새 제목을 12a 한·영 짝으로 맞추면서, 한·영이 이미 서로 맞고 12a 56번이 입말 "도깨비불"을 허용하는 G22는 두었다. 문서 제목을 "군집 드론"으로 바꿀지는 도감 과제(34)가 정한다. 현재 제목 열(G13~G26)은 030 SQL 값이라 옛 이름을 그대로 둔다.
- **2차 검토의 영어 다시 훑기에 남은 세 곳.** 12a 2절의 옛 영어 186개를 한국어 장 열 개(01~10)에 대소문자 없이 훑어 남은 세 곳은 용어가 아니다. 01-core 54줄 "Lord, Baron"은 쓰지 말라는 규칙 문장, 07장 480줄 "Watch hand"는 경비원의 영어(12a 109번 신분 이름 "손"이 아님, .en과 같음), 07장 916줄 `Home Station`은 "잠자는 역" 키의 영어(12a 43번 "본역"이 아님, .en과 같음)다.
- **밭장의 목록 밖 두 곳.** 2차 검토 막는 점 6의 목록에 없던 05장 97줄(+.en "field head")과 07장 688줄(+.en "Gangseo Field Chief")도 같은 낱말이라 함께 바꿨다. 07장 672줄 코드 키가 바뀌었으므로 인물 자료(Pf), 090 데이터, `scripts/pages/ck3-stats.mjs`도 "발전 단지 반장"으로 따라야 한다.
- **06장 580줄 "maintenance-unit fitter".** .en의 "workshop fitter"와 다르지만 12a에 없는 말이고, 아크의 정비대는 maintenance unit이라는 이 기록의 bench 판정과 맞아 2차 검토에서 바꾸지 않았다.

- **잠정 항목 원장.** 이 과제가 값이나 날짜를 바꾼 잠정 항목(T02-10, T02-11, T02-15, T02-17, T02-24, T02-29, T02-31, T02-36, T02-81~T02-84, T04-8과 03장의 전지·열 행 등)의 지금 글은 원장 조각 `docs/drafts/reports/v3-ledger-parts/t35a.md`에 적었다. 과제 24가 원장을 합칠 때 같은 번호의 옛 글 대신 그 글을 쓴다.

합계: 날짜·겨울 188건, 용어 4173건.

## 5. 검토 막는 점 고침 (파일:줄, 옛 값, 새 값, 까닭)

과제 35a 검토에서 나온 막는 점 8개를 고쳤다. 1절 B3·B5와 2절 01-core 172·194줄 행의 새 값은 이 고침(깊은 터널 9 W)에 맞춰 바꿔 두었다. 이 고침도 줄 안에서만 이루어져 줄 번호는 그대로다.

| 파일:줄 | 옛 값 | 새 값 | 까닭 |
|---|---|---|---|
| docs/design/v3/05-free-city.md:79 | 셋, 세습을 결의하음 | 셋, 세습을 결의함 | 용어 102 기계 치환 뒤 어형 바로잡기(검토 막는 점 1) |
| docs/design/v3/05-free-city.md:559 | 세습을 결의했이다 | 세습을 결의했다 | 용어 102 기계 치환 뒤 어형 바로잡기(검토 막는 점 1) |
| docs/design/v3/05-free-city.md:141 | 다른 두 지분 가문은 묶인 도장을 잊지 않는다 | 다른 두 지분 가문은 세습 결의를 잊지 않는다 | 용어 102 변이형(검토 막는 점 2) |
| docs/design/v3/09-ck3-systems.md:568 | (관악은 묶인 도장) | (관악은 세습 결의) | 용어 102 변이형(검토 막는 점 2) |
| docs/design/v3/05-free-city.en.md:79 | three, seal bound | three, hereditary resolution | 용어 102 변이형(검토 막는 점 2) |
| docs/design/v3/05-free-city.en.md:141 | do not forget the bound seal | do not forget the hereditary resolution | 용어 102 변이형(검토 막는 점 2) |
| docs/design/v3/09-ck3-systems.en.md:568 | (Gwanak: the bound seal) | (Gwanak: hereditary resolution) | 용어 102 변이형(검토 막는 점 2) |
| docs/design/v3/07-people-and-war.md:498 | \| 화덕 지기 \| Hearth keeping \| 화덕 지기 / Hearth keeper \| | \| 화덕 관리 \| Hearth tending \| 화덕 관리인 / Hearth attendant \| | 용어 201(화덕 관리인) 띄어 쓴 꼴, -지기 금지(검토 막는 점 3) |
| docs/design/v3/07-people-and-war.en.md:498 | \| 화덕 지기 \| Hearth keeping \| 화덕 지기 / Hearth attendant \| | \| 화덕 관리 \| Hearth tending \| 화덕 관리인 / Hearth attendant \| | 용어 201(화덕 관리인) 띄어 쓴 꼴, -지기 금지(검토 막는 점 3) |
| docs/design/v3/07-people-and-war.md:499 | \| 혐기성 소화조 지기 \| Methane vat keeping \| 혐기성 소화조지기 / Methane keeper \| | \| 혐기성 소화조 관리 \| Anaerobic digester tending \| 혐기성 소화조 관리인 / Digester attendant \| | 용어 28 적용 뒤 생긴 -지기 조어 정리(검토 막는 점 3) |
| docs/design/v3/07-people-and-war.en.md:499 | \| 혐기성 소화조 지기 \| Methane vat keeping \| 혐기성 소화조지기 / Methane keeper \| | \| 혐기성 소화조 관리 \| Anaerobic digester tending \| 혐기성 소화조 관리인 / Digester attendant \| | 용어 28 적용 뒤 생긴 -지기 조어 정리(검토 막는 점 3) |
| docs/design/v3/03-technology.md:134 | 출입구 지기 | 출입구 경비원 | 용어 168(출입구 경비원) 띄어 쓴 꼴(검토 막는 점 3) |
| docs/design/v3/07-people-and-war.md:497 | 벌목꾼, 벌목꾼 / | 벌목꾼 / | 치환 뒤 겹친 말 하나로(검토 막는 점 4) |
| docs/design/v3/07-people-and-war.md:528 | 넝마주이, 넝마주이 / | 넝마주이 / | 치환 뒤 겹친 말 하나로(검토 막는 점 4) |
| docs/design/v3/07-people-and-war.en.md:497 | 벌목꾼, 벌목꾼 / | 벌목꾼 / | 치환 뒤 겹친 말 하나로(검토 막는 점 4) |
| docs/design/v3/07-people-and-war.en.md:528 | 넝마주이, 넝마주이 / | 넝마주이 / | 치환 뒤 겹친 말 하나로(검토 막는 점 4) |
| docs/design/v3/07-people-and-war.md:154 | `Head of the <District stem> Near House` | `Head of the <District stem> inner-circle house` | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:463 | Leading a Near House \| 가문 수장, 가문 원로 / Head of the Near House, Near House elder | Leading an inner-circle house \| 가문 수장, 가문 원로 / Head of the inner-circle house, inner-circle house elder | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:485 | Bench fitter | Maintenance-unit fitter | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:488 | Fibre-sugar vats \| 당화 탱크 관리인 / Vat keeper | Saccharification tanks \| 당화 탱크 관리인 / Saccharification tank keeper | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:489 | Light-field farming \| 온실 일꾼, 온실 관리인 / Light-field worker | Greenhouse farming \| 온실 일꾼, 온실 관리인 / Greenhouse worker | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:490 | Mushroom-cellar keeper | Mushroom grower | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:495 | Snow-shaft keeping | Entrance guard duty | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:495 | Entrance keeper | Entrance guard | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:641 | \| Crew Chief \| | \| Work Team Leader \| | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:646 | \| Head of the Near House \| | \| Head of the inner-circle house \| | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:647 | \| Near House elder \| | \| inner-circle house elder \| | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/07-people-and-war.md:652 | \| Near House member \| | \| inner-circle house member \| | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/06-arc.md:578 | 가문 수장 / Head of the Near House. | 가문 수장 / Head of the inner-circle house. | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/06-arc.md:578 | / Near House elder | / inner-circle house elder | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/06-arc.md:580 | / bench fitter. | / maintenance-unit fitter. | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/06-arc.md:582 | / water-wheel keeper. | / turbine mechanic. | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/06-arc.md:582 | / intake keeper. | / water intake keeper. | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/06-arc.md:582 | / heat-pump keeper. | / heat-pump technician. | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/06-arc.md:582 | / entrance keeper | / entrance guard | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/06-arc.md:583 | / fibre-sugar vat keeper. | / saccharification tank keeper. | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/06-arc.md:583 | / light-field keeper. | / greenhouse keeper. | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/06-arc.md:583 | / mushroom-cellar keeper. | / mushroom grower. | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/01-core.md:467 | \| Head of the Near House \| | \| Head of the inner-circle house \| | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/01-core.md:468 | \| the Seat of the Four Near Houses \| | \| the Council of House Heads \| | 한국어 파일의 영어 열을 12a 새 영어·영어 미러에 맞춤(검토 막는 점 5) |
| docs/design/v3/04-government.en.md:100 | the wind frames on the bridges | the wind turbines on the bridges | 용어 24 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/04-government.en.md:426 | bridge wind frames | bridge wind turbines | 용어 24 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/05-free-city.en.md:60 | **Outside posts.** | **External offices.** | 용어 101 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/09-ck3-systems.en.md:516 | **Outside posts.** | **External offices.** | 용어 101 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/05-free-city.en.md:261 | **Full packs.** | **Charged battery packs.** | 용어 9 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/05-free-city.en.md:378 | Wind field people | Wind farm people | 용어 25 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/05-free-city.en.md:382 | Market house people | Merchant house people | 용어 125 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/05-free-city.en.md:525 | Market house people | Merchant house people | 용어 125 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:351 | \| Maintenance turns \| | \| Maintenance queue places \| | 용어 20 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:424 | **Part-count stitches.** | **Part-marking stitches.** | 용어 177 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:247 | feeds the person first from one pot (10.3) | feeds the person first from its own pot and becomes their one-pot kin (10.3) | 용어 180 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:465 | is fed first from one pot by the household of the fitter who fitted them. From then on the two households call each other "one pot" | is fed first from the household pot of the fitter who fitted them. From then on the two households call each other "one-pot kin" | 용어 180 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:561 | \| Exchange posts, negotiation, records \| | \| Exchanges, negotiation, records \| | 용어 16 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:584 | \| Exchange posts, negotiation, records \| | \| Exchanges, negotiation, records \| | 용어 16 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:584 | maintenance-turn tallies | maintenance queue place tallies | 용어 20 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:112 | The unbaptised also eat | Unbaptised believers also eat | 용어 161 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:204 | ### 5.5 The unbaptised | ### 5.5 Unbaptised believers | 용어 161 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:206 | They are called the **unbaptised** (세례 전 신도) | They are called **unbaptised believers** (세례 전 신도) | 용어 161 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:208 | - The unbaptised are Arc people. | - Unbaptised believers are Arc people. | 용어 161 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:210 | The unbaptised are treated | Unbaptised believers are treated | 용어 161 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:259 | - The unbaptised are laid | - Unbaptised believers are laid | 용어 161 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:377 | - The unbaptised take | - Unbaptised believers take | 용어 161 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:438 | \| The unbaptised \| | \| Unbaptised believers \| | 용어 161 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/06-arc.en.md:453 | The unbaptised go to | Unbaptised believers go to | 용어 161 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/07-people-and-war.en.md:60 | Crew chief (wheels) | Work team leader (wheels) | 용어 108 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/07-people-and-war.en.md:61 | Crew chief (tool carrying) | Work team leader (tool carrying) | 용어 108 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/07-people-and-war.en.md:688 | Crew chief, squad leader | Work team leader, squad leader | 용어 108 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/07-people-and-war.en.md:495 | Snow-shaft keeping | Entrance guard duty | 용어 33 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/09-ck3-systems.en.md:552 | Day charges and maintenance queue places | Daily charge allowances and maintenance queue places | 하루 충전량 영어 미러를 daily charge allowance로 맞춤(검토 막는 점 6) |
| docs/design/v3/09-ck3-systems.en.md:571 | Day charges, maintenance queue places | Daily charge allowances, maintenance queue places | 하루 충전량 영어 미러를 daily charge allowance로 맞춤(검토 막는 점 6) |
| docs/design/v3/01-core.en.md:496 | build the under-ice water wheels at the Jamsil weir | build the under-ice small hydro turbines at the Jamsil weir | 용어 27 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/03-technology.en.md:432 | Keeps the under-ice water wheels and their channels | Keeps the under-ice small hydro turbines and their channels | 용어 27 영어 미러에 새 영어 적용(검토 막는 점 6) |
| docs/design/v3/01-core.md:172 | 깊은 터널 10 W | 깊은 터널 9 W | B안 파생 재계산(로그 1절 산식 B3·B5, 깊은 터널 9.3 → 9 W 반올림, 검토 막는 점 7) |
| docs/design/v3/01-core.en.md:172 | deep tunnel 10 W | deep tunnel 9 W | B안 파생 재계산(로그 1절 산식 B3·B5, 깊은 터널 9.3 → 9 W 반올림, 검토 막는 점 7) |
| docs/design/v3/01-core.md:191 | 1,000 × 10 W = 10 kW다 | 1,000 × 9 W = 9 kW다 | B안 파생 재계산(로그 1절 산식 B3·B5, 깊은 터널 9.3 → 9 W 반올림, 검토 막는 점 7) |
| docs/design/v3/01-core.en.md:191 | 1,000 × 10 W = 10 kW. | 1,000 × 9 W = 9 kW. | B안 파생 재계산(로그 1절 산식 B3·B5, 깊은 터널 9.3 → 9 W 반올림, 검토 막는 점 7) |
| docs/design/v3/01-core.md:193 | 남은 열 140 kW로 | 남은 열 141 kW로 | B안 파생 재계산(로그 1절 산식 B3·B5, 깊은 터널 9.3 → 9 W 반올림, 검토 막는 점 7) |
| docs/design/v3/01-core.en.md:193 | the remaining 140 kW | the remaining 141 kW | B안 파생 재계산(로그 1절 산식 B3·B5, 깊은 터널 9.3 → 9 W 반올림, 검토 막는 점 7) |
| docs/design/v3/01-core.md:194 | 남은 32 kW로 약 405명을 | 남은 33 kW로 약 418명을 | B안 파생 재계산(로그 1절 산식 B3·B5, 깊은 터널 9.3 → 9 W 반올림, 검토 막는 점 7) |
| docs/design/v3/01-core.en.md:194 | The remaining 32 kW adds about 405 people. | The remaining 33 kW adds about 418 people. | B안 파생 재계산(로그 1절 산식 B3·B5, 깊은 터널 9.3 → 9 W 반올림, 검토 막는 점 7) |
| docs/design/v3/01-core.md:273 | 빛이 넉넉해져 같은 넓이에서 더 거두지만 온실을 더 넓히지는 않는다. 지붕감이 모자라고, 지상에 불빛과 열을 드러내지 말라는 금기가 있기 때문이다. | 빛이 넉넉해져 같은 끼니 몫을 옛 넓이의 절반에서 거둔다(11장 2.5절의 "빛이 늘면 온실의 몫이 커진다"는 넓이당 수확이 커지는 것으로 반영한다. 잠정 T02-36). 지붕감이 모자라고 지상에 불빛과 열을 드러내지 말라는 금기가 있어, 남는 넓이로 온실을 늘리지 않고 오히려 줄였다. | 본문과 수치(1인당 90 → 45 m²) 맞춤, 11장 2.5절 "몫이 커진다"를 넓이당 수확으로 명시(검토 막는 점 8) |
| docs/design/v3/01-core.en.md:273 | With more light the same area yields more, but the greenhouses are not widened: roofing is short, and there is a taboo against showing light and heat on the surface. | With more light the same share of the diet is grown on half the old area (the "more light enlarges the greenhouse share" of chapter 11, 2.5 is realised as a larger yield per area; provisional T02-36). Roofing is short and there is a taboo against showing light and heat on the surface, so the spared area was not used to widen the greenhouses; they were made smaller instead. | 본문과 수치(1인당 90 → 45 m²) 맞춤, 11장 2.5절 "몫이 커진다"를 넓이당 수확으로 명시(검토 막는 점 8) |

합계: 검토 고침 82건.

### 5.2 2차 검토 막는 점 고침

과제 35a 2차 검토에서 나온 막는 점 7개를 고쳤다. 줄 안에서만 고쳐 줄 번호는 그대로다. 12a 2.8절에 203번(밭장)을 더하고 2절 바꿀 말 수를 207에서 208로 고쳤다. 영어 다시 훑기의 남은 세 곳은 4절에 적었다.

| 파일:줄 | 옛 값 | 새 값 | 까닭 |
|---|---|---|---|
| docs/design/v3/01-core.md:448 | none; host of a contract meeting: Host | none; host of a council: host | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 95·96) |
| docs/design/v3/01-core.md:455 | \| Market Master \| | \| Head of the Merchants' Association \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/01-core.md:456 | \| Works Master \| | \| Plant Manager \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/01-core.md:457 | \| Edge Warden \| | \| Guard Commander \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/01-core.md:458 | \| Depot Master \| | \| Depot Chief \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/01-core.md:459 | \| Wind Keeper \| | \| Power Station Director \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/01-core.md:465 | \| Bench Keeper \| | \| Maintenance Foreman \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 159) |
| docs/design/v3/06-arc.md:579 | 정비 반장 / Bench Keeper | 정비 반장 / Maintenance Foreman | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 159) |
| docs/design/v3/06-arc.md:580 | / recovery carer | / recovery caregiver | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 172) |
| docs/design/v3/06-arc.md:584 | / tally keeper | / accountant | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 165) |
| docs/design/v3/06-arc.md:584 | / roll keeper | / register clerk | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 163) |
| docs/design/v3/06-arc.md:584 | / Word Keeper | / Spokesperson | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 164) |
| docs/design/v3/06-arc.md:585 | / rim watcher | / blockade lookout | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 39) |
| docs/design/v3/07-people-and-war.md:158 | `Bench Keeper of <Station>` | `Maintenance Foreman of <Station>` | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 159) |
| docs/design/v3/07-people-and-war.md:459 | Shift Chief | Shift Leader | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:465 | Leading a bench | Leading a maintenance unit | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:465 | / Bench Keeper | / Maintenance Foreman | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 159) |
| docs/design/v3/07-people-and-war.md:480 | Edge crew | Guard unit | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:484 | Recovery carer | Recovery caregiver | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 172) |
| docs/design/v3/07-people-and-war.md:501 | Household keeper | Household steward | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 198) |
| docs/design/v3/07-people-and-war.md:516 | / Word Keeper | / Spokesperson | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 164) |
| docs/design/v3/07-people-and-war.md:520 | Water-wheel keeper | Turbine mechanic | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 169) |
| docs/design/v3/07-people-and-war.md:530 | Rim watcher | Blockade lookout | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 39) |
| docs/design/v3/07-people-and-war.md:540 | Tally-board keeping | Price-board keeping | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 15) |
| docs/design/v3/07-people-and-war.md:540 | Tally clerk, Tally keeper | Price-board clerk, Accountant | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 126·165) |
| docs/design/v3/07-people-and-war.md:541 | Roll keeper | Register clerk | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 163) |
| docs/design/v3/07-people-and-war.md:630 | \| Market Master \| | \| Head of the Merchants' Association \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:631 | \| Works Master \| | \| Plant Manager \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:632 | \| Edge Warden \| | \| Guard Commander \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:633 | \| Depot Master \| | \| Depot Chief \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:634 | \| Wind Keeper \| | \| Power Station Director \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:638 | \| Shift Chief \| | \| Shift Leader \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:640 | \| Bench Owner \| | \| Workshop Owner \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:642 | \| Hand \| | \| Skilled worker \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:646 | \| Head of the inner-circle house \| | \| House Head \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:647 | \| inner-circle house elder \| | \| house elder \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤 |
| docs/design/v3/07-people-and-war.md:649 | \| Bench Keeper \| | \| Maintenance Foreman \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 159) |
| docs/design/v3/07-people-and-war.md:651 | \| Word Keeper \| | \| Spokesperson \| | 검토 2차 막는 점 1: 한국어 파일 영어 열을 .en.md 같은 줄의 12a 새 영어로 맞춤(12a 164) |
| docs/design/v3/08-document-map.md:54 | 띠의 생김새 | 봉쇄 지대의 생김새 | 검토 2차 막는 점 3: 12a 38번 적용, ko/en 제목 맞춤 |
| docs/design/v3/08-document-map.md:54 | / Beyond Seoul: the Rim \| | / Beyond Seoul: the Blockade Line \| | 검토 2차 막는 점 3: 12a 38번 적용, ko/en 제목 맞춤 |
| docs/design/v3/08-document-map.en.md:54 | the shape of the band | the shape of the blockade zone | 검토 2차 막는 점 3: 12a 38번 적용, ko/en 제목 맞춤 |
| docs/design/v3/08-document-map.en.md:54 | / Beyond Seoul: the Blockade line \| | / Beyond Seoul: the Blockade Line \| | 검토 2차 막는 점 3: 12a 38번 적용, ko/en 제목 맞춤(ko와 대소문자 맞춤) |
| docs/design/v3/09-ck3-systems.md:511 | 세습을 결의했은지. | 세습을 결의했는지. | 검토 2차 막는 점 4: 용어 102 치환 뒤 어형, 영어 수 일치 |
| docs/design/v3/09-ck3-systems.en.md:511 | whether heating contribution count, | whether heating contribution counts, | 검토 2차 막는 점 4: 용어 102 치환 뒤 어형, 영어 수 일치 |
| docs/design/v3/07-people-and-war.md:945 | "Direct liege" | "Direct superior" | 검토 2차 막는 점 5: 12a 행 ko/en 일관 적용(195a) |
| docs/design/v3/07-people-and-war.md:945 | `direct-liege` | `direct-superior` | 검토 2차 막는 점 5: 12a 행 ko/en 일관 적용(195a) |
| docs/design/v3/07-people-and-war.md:1193 | (Assembly Member's Guard Hall) | (Assembly Member's Guard Headquarters) | 검토 2차 막는 점 5: 12a 행 ko/en 일관 적용(80) |
| docs/design/v3/07-people-and-war.md:1193 | (Assembly Member's Sworn Retinue) | (Assembly Member's Escort Detail) | 검토 2차 막는 점 5: 12a 행 ko/en 일관 적용(81) |
| docs/design/v3/07-people-and-war.en.md:1193 | (Assembly Member's Sworn Retinue) | (Assembly Member's Escort Detail) | 검토 2차 막는 점 5: 12a 행 ko/en 일관 적용(81) |
| docs/design/v3/07-people-and-war.md:496 | 제설 인부 / Snow clearer | 제설 인부 / Snow-clearing labourer | 검토 2차 막는 점 5: 12a 행 ko/en 일관 적용(196) |
| docs/design/v3/07-people-and-war.en.md:496 | 제설 인부 / Snow clearer | 제설 인부 / Snow-clearing labourer | 검토 2차 막는 점 5: 12a 행 ko/en 일관 적용(196) |
| docs/design/v3/05-free-city.md:97 | 밭장이 있다 | 발전 단지 반장이 있다 | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203). 목록 밖 같은 낱말 |
| docs/design/v3/05-free-city.en.md:97 | one field head per wind farm | one wind farm foreman per wind farm | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203). 목록 밖 같은 낱말 |
| docs/design/v3/05-free-city.md:522 | 밭장을 겸하는 | 발전 단지 반장을 겸하는 | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203) |
| docs/design/v3/05-free-city.en.md:522 | who are also field heads | who are also wind farm foremen | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203) |
| docs/design/v3/07-people-and-war.md:216 | 밭장 20 | 발전 단지 반장 20 | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203) |
| docs/design/v3/07-people-and-war.en.md:216 | 밭장 20 | 발전 단지 반장 20 | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203) |
| docs/design/v3/07-people-and-war.md:460 | 구간장, 밭장 / Section Chief, Field Chief | 구간장, 발전 단지 반장 / Section Chief, Wind Farm Foreman | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203) |
| docs/design/v3/07-people-and-war.en.md:460 | 구간장, 밭장 / Section Chief, Field Chief | 구간장, 발전 단지 반장 / Section Chief, Wind Farm Foreman | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203) |
| docs/design/v3/07-people-and-war.md:639 | \| 밭장 \| Field Chief \| | \| 발전 단지 반장 \| Wind Farm Foreman \| | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203) |
| docs/design/v3/07-people-and-war.en.md:639 | \| 밭장 \| Field Chief \| | \| 발전 단지 반장 \| Wind Farm Foreman \| | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203) |
| docs/design/v3/07-people-and-war.md:672 | '밭장': | '발전 단지 반장': | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203). 코드 키라 인물 자료와 scripts/pages/ck3-stats.mjs가 따라야 한다 |
| docs/design/v3/07-people-and-war.en.md:672 | '밭장': | '발전 단지 반장': | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203). 코드 키라 인물 자료와 scripts/pages/ck3-stats.mjs가 따라야 한다 |
| docs/design/v3/07-people-and-war.md:688 | 강서 밭장을 겸하는 | 강서 발전 단지 반장을 겸하는 | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203). 목록 밖 같은 낱말 |
| docs/design/v3/07-people-and-war.en.md:688 | Gangseo Field Chief | Gangseo Wind Farm Foreman | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203). 목록 밖 같은 낱말 |
| docs/design/v3/07-people-and-war.md:719 | 역 반장, 밭장, | 역 반장, 발전 단지 반장, | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203) |
| docs/design/v3/07-people-and-war.en.md:719 | 역 반장, 밭장, | 역 반장, 발전 단지 반장, | 검토 2차 막는 점 6: 조어 밭장 → 발전 단지 반장(12a 203) |
| docs/design/v3/08-document-map.md:96 | G13 · 물류 로봇 팔 | G13 · 집게팔 | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.md:96 | G13 · 물류 로봇 팔 / G13 · Claw Arms | G13 · 물류 로봇 팔 / G13 · logistics robot arms | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:102 | G14 · 선로 점검 로봇 | G14 · 빈수레 | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.md:102 | G14 · 선로 점검 로봇 / G14 · Empty Carts | G14 · 선로 점검 로봇 / G14 · track inspection robots | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:103 | G15 · 서비스 로봇 | G15 · 돌봄바퀴 | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.md:103 | G15 · 서비스 로봇 / G15 · Care Wheels | G15 · 서비스 로봇 / G15 · service robots | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:104 | G16 · 공사 로봇 | G16 · 철골거미 | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.md:104 | G16 · 공사 로봇 / G16 · Girder Spiders | G16 · 공사 로봇 / G16 · construction robots | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:105 | G17 · 감시탑 | G17 · 외눈탑 | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.md:105 | G17 · 감시탑 / G17 · One-Eye Towers | G17 · 감시탑 / G17 · watchtowers | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:106 | G18 · 선로 무장 차량 | G18 · 불다리열차 | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.md:106 | G18 · 선로 무장 차량 / G18 · Tunnel-Stoppers | G18 · 선로 무장 차량 / G18 · armed rail vehicles | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:107 | G19 · 귀환 무인 차량 | G19 · 그르렁이 | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.md:107 | G19 · 귀환 무인 차량 / G19 · Growlers | G19 · 귀환 무인 차량 / G19 · returning unmanned ground vehicles | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:108 | G20 · 수리 기계 / G20 · Bulgasari | G20 · 수리 기계 / G20 · repair machines | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:109 | G21 · 땅속 진동 감지기 / G21 · Ground-Knockers | G21 · 땅속 진동 감지기 / G21 · buried seismic sensors | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:111 | G23 · 무인 경계 초소 | G23 · 우두커니 | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.md:111 | G23 · 무인 경계 초소 / G23 · Udukeoni | G23 · 무인 경계 초소 / G23 · unmanned sentry posts | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:112 | G24 · 확성기 / G24 · Doenoemi | G24 · 확성기 / G24 · loudspeakers | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:113 | G25 · 케이블 점검 로봇 | G25 · 등불개미 | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.md:113 | G25 · 케이블 점검 로봇 / G25 · Lamp Ants | G25 · 케이블 점검 로봇 / G25 · cable inspection robots | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.md:114 | G26 · 자율 건설 기계 | G26 · 철공룡 | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.md:114 | G26 · 자율 건설 기계 / G26 · Iron Dinosaurs | G26 · 자율 건설 기계 / G26 · autonomous construction machines | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.en.md:96 | G13 · logistics robot arm | G13 · Pincer Arm | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.en.md:96 | G13 · 물류 로봇 팔 / G13 · Claw Arms | G13 · 물류 로봇 팔 / G13 · logistics robot arms | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.en.md:102 | G14 · track inspection robot | G14 · Empty Cart | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.en.md:103 | G15 · service robot | G15 · Care Wheel | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.en.md:104 | G16 · construction robot | G16 · Girder Spider | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.en.md:105 | G17 · watchtower | G17 · One-Eye Tower | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.en.md:106 | G18 · 선로 무장 차량 / G18 · Tunnel-Stoppers | G18 · 선로 무장 차량 / G18 · armed rail vehicles | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.en.md:108 | G20 · 수리 기계 / G20 · repair machine | G20 · 수리 기계 / G20 · repair machines | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.en.md:109 | G21 · 땅속 진동 감지기 / G21 · Ground-Knockers | G21 · 땅속 진동 감지기 / G21 · buried seismic sensors | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.en.md:111 | G23 · 무인 경계 초소 / G23 · Udukeoni | G23 · 무인 경계 초소 / G23 · unmanned sentry posts | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.en.md:112 | G24 · 확성기 / G24 · Doenoemi | G24 · 확성기 / G24 · loudspeakers | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.en.md:113 | G25 · cable inspection robot | G25 · Lantern Ant | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/08-document-map.en.md:113 | G25 · 케이블 점검 로봇 / G25 · Lamp Ants | G25 · 케이블 점검 로봇 / G25 · cable inspection robots | 검토 2차 막는 점 2: 새 제목 두 반쪽을 12a 한·영 짝으로 ko/en 같게 |
| docs/design/v3/08-document-map.en.md:114 | G26 · autonomous construction machine | G26 · Iron Dinosaur | 검토 2차 막는 점 2: 현재 제목 열을 a54452ac7 값(030 SQL 값)으로 되돌림 |
| docs/design/v3/07-people-and-war.md:522 | 취수구 관리인 / Intake keeper | 취수구 관리인 / Water intake keeper | 검토 2차 막는 점 1의 다시 훑기에서 찾음: .en.md 같은 줄의 12a 75 새 영어로 맞춤 |
| docs/design/v3/12a-terms.md:299 | (없음) | 203 \| 밭장 \| 05, 07 \| 조어(바람밭 + -장) \| 발전 단지 반장 \| Field Chief → Wind Farm Foreman | 검토 2차 막는 점 6 |
| docs/design/v3/12a-terms.md:49 | 바꿀 말 수: 207 | 바꿀 말 수: 208 | 203번 행을 더함 |
| docs/drafts/reports/v3-retime-terms-log.md 1절 B2 | 다져진 눈 밀도 0.45~0.6 → 7.0~9.3 m | (같은 값에 A안 밀도 0.375~0.5와 올린 까닭, A안 밀도의 결과 8.4~11.2 m를 덧붙임) | 검토 2차 막는 점 7: 01-core 109줄 7~9 m를 두고 산식의 밀도 근거를 밝힘 |

합계: 2차 검토 고침 108건.
