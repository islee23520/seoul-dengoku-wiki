# Century-Annals W2 초안 보고서 (row 10)

- 모델: gemini-4-argon-high (completion 'default' 티어). 'gemini-3-pro' 이름 지정 호출 15회는 하네스가 티어 이름만 받아 모두 해석 실패(응답 없음). 실제 생성 호출: ko 15회(절 단위 part-00~14), en 6회(ko 최종본 번역 part-00~05). 합계 성공 21회, 실패 15회, 상한 40 이내.
- 제목(title, title_ko)은 바꾸지 않았다(검증 3 기준 body 열만 변경). 제안: title "Seoul Annals, from the Great Blackout to 2126", title_ko "서울 연표, 대정전에서 2126년까지". 현재 제목의 "Subway States 2030"은 옛 정본이다.

## 앵커
- 다른 문서가 이 문서를 가리키는 프래그먼트 링크: 91개(고유 91). docs/.anchor-baseline 파일은 origin/feat/wiki-canon-rewrite에 없어서 030 SQL의 다른 58문서 ko/en 본문에서 'Century-Annals#' 링크를 직접 집계했다.
- 그 가운데 81개(연도 앵커 2030년~2126년)는 현재 본문 어디에도 없던 깨진 링크였다. 새 본문은 각 연도 제목 앞에 <a id="NNNN년"></a>를 넣어 81개를 모두 살렸다.
- 현재 ko 앵커 321개(고유 320, '2125년-Arc' 중복 원본 그대로) 가운데 320개 보존, 1개 제거. 새 본문 ko=en 동일 집합 400개(고유).
- 제거: '2073년-삼성역-교회'. 링크하는 문서 없음. id 자체가 금지어 church-ko에 걸려 scan-terms가 실패했기 때문(스캐너가 id 속성을 면제하지 않음). 절 내용은 '삼성역 명부 모임'으로 남았다.

### 외부 링크 대상 보존표 (91개 모두 보존)
| id | 링크 문서 |
|---|---|
| 2069년-xt01-임진-제방-임시-검역소 | External-Theaters:ko |
| 2104년-xt01-임진-제방-임시-검역소 | External-Theaters:ko |
| 2125년-xt01-광화문-정부서울청사 | External-Theaters:ko |
| 2079년-xt02-한강-하구-임시-부두 | External-Theaters:ko |
| 2114년-xt02-한강-하구-임시-부두 | External-Theaters:ko |
| 2079년-xt03-용산-환적창 | External-Theaters:ko |
| 2069년-xt04-암사-야적장 | External-Theaters:ko |
| 2114년-xt04-암사-야적장 | External-Theaters:ko |
| 2069년-xt05-여의도-회관 | External-Theaters:ko |
| 2122년-xt05-여의도-회관 | External-Theaters:ko |
| 2030년 | Scenario-Timeline:ko |
| 2031년 | Scenario-Timeline:ko |
| 2032년 | Scenario-Timeline:ko |
| 2033년 | Scenario-Timeline:ko |
| 2034년 | Scenario-Timeline:ko |
| 2035년 | Scenario-Timeline:ko |
| 2036년 | Scenario-Timeline:ko |
| 2037년 | Scenario-Timeline:ko |
| 2038년 | Scenario-Timeline:ko |
| 2039년 | Scenario-Timeline:ko |
| 2040년 | Scenario-Timeline:ko |
| 2041년 | Scenario-Timeline:ko |
| 2042년 | Scenario-Timeline:ko |
| 2043년 | Scenario-Timeline:ko |
| 2044년 | Scenario-Timeline:ko |
| 2046년 | Scenario-Timeline:ko |
| 2048년 | Scenario-Timeline:ko |
| 2049년 | Scenario-Timeline:ko |
| 2050년 | Scenario-Timeline:ko |
| 2051년 | Scenario-Timeline:ko |
| 2052년 | Scenario-Timeline:ko |
| 2053년 | Scenario-Timeline:ko |
| 2054년 | Scenario-Timeline:ko |
| 2055년 | Scenario-Timeline:ko |
| 2056년 | Scenario-Timeline:ko |
| 2057년 | Scenario-Timeline:ko |
| 2058년 | Scenario-Timeline:ko |
| 2059년 | Scenario-Timeline:ko |
| 2060년 | Scenario-Timeline:ko |
| 2061년 | Scenario-Timeline:ko |
| 2062년 | Scenario-Timeline:ko |
| 2063년 | Scenario-Timeline:ko |
| 2064년 | Scenario-Timeline:ko |
| 2066년 | Scenario-Timeline:ko |
| 2068년 | Scenario-Timeline:ko |
| 2069년 | Scenario-Timeline:ko |
| 2070년 | Scenario-Timeline:ko |
| 2071년 | Scenario-Timeline:ko |
| 2072년 | Scenario-Timeline:ko |
| 2073년 | Scenario-Timeline:ko |
| 2074년 | Scenario-Timeline:ko |
| 2075년 | Scenario-Timeline:ko |
| 2076년 | Scenario-Timeline:ko |
| 2077년 | Scenario-Timeline:ko |
| 2078년 | Scenario-Timeline:ko |
| 2079년 | Scenario-Timeline:ko |
| 2080년 | Scenario-Timeline:ko |
| 2082년 | Scenario-Timeline:ko |
| 2084년 | Scenario-Timeline:ko |
| 2085년 | Scenario-Timeline:ko |
| 2087년 | Scenario-Timeline:ko |
| 2088년 | Scenario-Timeline:ko |
| 2090년 | Scenario-Timeline:ko |
| 2095년 | Scenario-Timeline:ko |
| 2097년 | Scenario-Timeline:ko |
| 2098년 | Scenario-Timeline:ko |
| 2099년 | Scenario-Timeline:ko |
| 2100년 | Scenario-Timeline:ko |
| 2101년 | Scenario-Timeline:ko |
| 2102년 | Scenario-Timeline:ko |
| 2104년 | Scenario-Timeline:ko |
| 2106년 | Scenario-Timeline:ko |
| 2107년 | Scenario-Timeline:ko |
| 2109년 | Scenario-Timeline:ko |
| 2110년 | Scenario-Timeline:ko |
| 2111년 | Scenario-Timeline:ko |
| 2112년 | Scenario-Timeline:ko |
| 2113년 | Scenario-Timeline:ko |
| 2114년 | Scenario-Timeline:ko |
| 2115년 | Scenario-Timeline:ko |
| 2116년 | Scenario-Timeline:ko |
| 2117년 | Scenario-Timeline:ko |
| 2118년 | Scenario-Timeline:ko |
| 2119년 | Scenario-Timeline:ko |
| 2120년 | Scenario-Timeline:ko |
| 2121년 | Scenario-Timeline:ko |
| 2122년 | Scenario-Timeline:ko |
| 2123년 | Scenario-Timeline:ko |
| 2124년 | Scenario-Timeline:ko |
| 2125년 | Scenario-Timeline:ko |
| 2126년 | Scenario-Timeline:ko |

## 정본 처리 요지
- 대정전: 새 머리 절 '대정전 (약 2026년)'. 원문 2030년 10월 날짜는 "대정전 당일/이튿날/n일 뒤"로 바꿨다. 1시대 제목 연도(2030~2039)와 이후 연도는 원문 그대로 두었다(새 연도는 만들지 않음).
- AI 살육·드론 살해: 제거. 변전소 전격 사망은 "기체가 막아 세움"으로 바꿈.
- 십육국·국가 표현 삭제(2076 건국 문장 삭제, 2110 "16개 국가"를 "여러 조직·가문·회"로).
- 폐지 종교: 성전총회→삼성역 순찰회, 장경종/안국총림→안국역 필사 기록소, 정통회→용산 대장회. 당회장·장로 등 성직 어휘 0.
- 옛 'Arc'(2052 시청역 노동자 모임, 2119~2120 임하준·정유라 항목)는 '시청역 노동자 모임'으로, 2122 이후 항목만 '아크'로 썼다.
- 확정 연표 삽입: 2112(죽은 케이블, 지도에 없는 역, 매뉴얼 5년), 2117(첫 세례 12명), 2120(지연희 탄천 교섭, 경호원), 대통령 윤서린은 상원의원들이 뽑은 종신 대통령으로. 이일섭 관악 공작 한 문장.
- 2122 무렵 '강남 대피소들이 아크로 묶임'은 **본문에 아직 독립 문장으로 들어가지 않았다**. [제안] 2122년 절 머리에 한 문장 추가.

## 제안 (사실로 쓰지 않음)
- 대정전 이후 2112 이전 연도는 원문 것만 썼다. 새로 제안할 날짜는 없다. 다만 1시대 범위 표기 "2030~2039"는 약 2026 대정전과 맞지 않는다. [제안] "대정전 뒤 첫 십 년"으로 바꾸거나 소유자가 연도를 정함.
- 원문 연도 2031~2110 가운데 서울 밖 사건(대전, 강원, 부산, 대마도, 독도, 호남)은 "서울 밖은 전쟁 기계 땅"과 충돌할 수 있다. 본문은 유지하되 아래 표시로 남겼다.

## [확인 필요] 표시 (본문에서는 제거, 57건)
1. 대정전의 정확한 월일
2. 원문은 대정전을 2030년으로 적었으나 정본은 약 2026년, 월일 미정으로 둔다. 이 조각의 날짜는 대정전 당일을 기준으로 한 경과 일수로 옮겨 적었다.
3. 대정전 연도가 약 2026년으로 바뀐 데 따라 이 날짜를 조정할지 여부
4. 이 7개 가문과 이후 여의도출자연합회의 관계
5. 이 시기 휴머노이드 사용이 전면 금지되었다는 원문 서술의 정본 부합 여부
6. 중앙정보부의 소속과 성격, 조직을 이끈 주체가 AI였는지 여부, 아바타 오해린, 세종 대통령실 동면소에 잠든 인사들에 관한 원문 서술의 정본 부합 여부
7. 원문의 '다음 겨울부터' 표현은 겨울의 계절성과 관련되어 정본 확정 전까지 '이후'로 고쳐 둠
8. '봄' 표기는 겨울의 계절성이 정해지면 유지 여부 결정
9. 혹독한 겨울 아래에서 지상 경작이 가능했는지, 농번기 표현이 겨울의 계절성과 충돌하는지
10. 이 무렵 용산과 영등포 구간이 어느 세력의 관할이었는지, 정부와 자유도시의 구분이 이미 있었는지
11. 구간을 지키는 일이 가문 안에서 대물림되었는지, 나머지 6개 가문의 이름과 맡은 구간
12. 이 시기 서울 밖 지역과의 왕래가 실제로 어느 정도 가능했는지
13. 그 숫자에 이른 시점이 2040년 무렵인지
14. 이 수치의 출처와 범위
15. 이 계층의 칭호 체계
16. 연합회 명칭을 정한 날짜와 경위
17. 서울 밖 정착지와 연안 운항의 실재 여부
18. 이 선거와 뒷날 상원의원들이 상원의원 가운데 종신 대통령을 뽑는 방식 사이의 관계
19. 계약 회의의 첫 표결이 2056년으로 기록되어 있어 2046년 표결의 성격이 맞지 않음
20. 동해안 북부 정착지와 인계 경로의 실재 여부
21. 서울 안 지상에 순찰 기체가 돌아다녔다는 설정이 정본과 맞는지
22. 용산 선로 가문들이 상속과 혼인을 적는 용산 대장회를 결성한 경위와 시기
23. 2076년의 정치적 사건. 정부와 자유도시가 언제 지금의 모습을 갖추었는지는 정본에 정해지지 않았다
24. 2078년 용산 대장회의 기록
25. 해협 건너편과의 중계가 정본과 맞는지
26. 서울 밖 생산지와의 해상 교역이 서울 밖 전쟁 기계 설정과 맞는지
27. 이씨 가문의 후계가 관악 공작에 이르게 된 경위
28. 고양은 정부 14구 밖에 있으므로 경기도라는 이름이 정부의 소유를 뜻하였는지 여부
29. 장부에 오른 조직의 수와 명단
30. 기록청이 정부 소속인지, 어느 세력에도 속하지 않은 기록 기관인지
31. 이 항목의 원문 본문이 비어 있음
32. 이 항목의 원문 본문이 비어 있음. 분가의 방문 날짜와 내용
33. 첫 세례의 정확한 날짜와 장소
34. 서울 밖을 전쟁 기계가 돌아다니는 정본 아래에서 부산 일대 선주와 대마도 선원 집단이 존속하는지, 이 항목을 서울 연표에 남길지
35. 중앙정보부와 보존원이 같은 조직인지, 보존원이 중앙정보부 아래의 기록소인지
36. 서울 밖에 전쟁 기계가 돌아다니는 정본에서 이 원정의 출발지, 주관 조직, 규모
37. 이 자문 일이 탄천 쪽 대피소 교섭과 어떤 관계였는지, 언제까지 이어졌는지
38. 전령 등록과 교섭 자리의 선후, 정보 조직과의 빚이 어떻게 정리되었는지
39. 윤서린이 어느 구의 상원의원이었는지, 전임 대통령의 이름과 사망 경위
40. 원문에 본문이 없음. 도심 세 단체의 이름과 2121년의 활동
41. 피난 행렬 기록에 대한 기록소의 구체적 역할
42. 문서가 가리킨 '세 세력'의 범위
43. 2122년 여의도 회관 잔여 대역 추첨의 내용과 참여 조직
44. 약국들과 아크의 관계
45. 환적국과 정부의 관계, 회의에 참석한 가문의 수
46. 허가제가 정부 장부와 연동되었는지 여부
47. 아크로 묶인 뒤 양재 서고를 누가 관리하였는지
48. 이 해 흰십자단 비상배급의 시기, 대상, 분량에 관한 원문 기록이 없음
49. 서울 밖 고양의 명부가 청사까지 들어온 경위
50. 귀환망과 아크의 관계
51. 서울 밖 성남사업장 노동자들이 당시 어디에 머물렀는지, 가입에 세례가 따랐는지
52. 독도 초소의 실재 여부와 운영 주체
53. 열쇠와 유언을 접수한 기관의 이름
54. 뚝섬열원가와 이 유언이 아크 항목에 속하는 까닭과 정부 인준이 필요했던 근거
55. 요청한 세 조직의 이름
56. 이 투표가 정한 자리와 아크 안에서의 위치
57. 인준 주체와 오경재가 맡은 자리의 이름
