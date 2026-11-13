# 2030~2046년 사람과 공존한 기계들: 2126년 얼어붙은 서울 기계 도감을 위한 조사

작성 2026-11-13 · 조사 전용 문서이며 승인된 설정이 아니다. 게임 설정 후보는 마지막 표에만 있다.

## 0. 읽는 법

- **근거 등급.** A = 1차 자료(제조사·정부·국제기구 공식 문서, 동료 심사 논문, SEC 공시). B = 신뢰할 만한 언론 보도(CNBC, TechCrunch, Korea Times, UPI 등)나 연구소 해설. C = 2차 블로그, 업체 마케팅, 다른 자료와 대조하지 못한 수치.
- **[추론]** 표시는 출처가 직접 말하지 않은 내용이다. 인용한 물리적 사실에서 이 문서가 끌어낸 판단이므로 설정 근거로 쓰기 전에 다시 검토한다.
- **시점.** 2030년대 수치는 대부분 2024~2026년에 나온 *전망*이다. 실제로 몇 대가 깔렸는지와 회사가 목표로 내건 숫자는 구분해서 적었다.

## 1. 공통 물리 원리: 80년 동안 무엇이 남는가

게임의 붕괴 시점은 2046년, 현재는 2126년이다. 그 사이 80년 동안 기계를 무너뜨리는 공통 요인은 다음과 같다.

| 요인 | 사실 | 등급 | 2126년 함의 [추론] |
|---|---|---|---|
| 리튬이온 저온 용량 | -20°C에서 정격 용량의 약 50~60%(LFP 약 55%, NMC 약 48%)만 쓸 수 있다. -40°C 아래에서는 공칭의 12%까지 떨어진다. | C (Bonnen Batteries 업체 자료) / A (ScienceDirect 2024, https://www.sciencedirect.com/science/article/abs/pii/S1385894724097511) | 지상 기계는 데워 주지 않으면 돌아가는 시간이 절반 이하로 줄어든다. |
| 저온 보관 노화 | -20~-30°C, 충전량(SOC) 0% 상태로 보관하면 화학계 대부분이 50년 동안 잃는 용량이 8% 미만이라는 모델 결과가 있다. LTO는 예외다. | A (Frontiers in Energy Research 2023, https://www.frontiersin.org/journals/energy-research/articles/10.3389/fenrg.2023.1108269/full) | 역설적으로 *얼어 있던* 셀은 화학적으로 꽤 보존된다. 다만 BMS가 과방전 차단을 하고 회로가 살아 있어야 다시 쓸 수 있다. |
| 저온 충전 | 0°C 아래에서 충전하면 리튬 도금이 생긴다. 도금된 LFP 셀은 열폭주가 시작되는 온도가 약 43°C 낮아지고, 폭주할 때 내부 압력과 파편 위험이 커진다. | A (Journal of Power Sources 2025, https://www.sciencedirect.com/science/article/pii/S0378775325024012) / C (ResearchGate 리뷰) | 2126년 사람이 옛 배터리를 무리하게 충전하면 화재와 폭발이 난다. 이것이 핵심 위험 요소다. |
| 전해 콘덴서 | 정해진 수명은 없다. 30년 보관 뒤 정상 동작한 사례가 있고, 대형 캔형은 약 20년이 기준이다. 오래 둔 콘덴서에 곧바로 정격 전압을 걸면 누설 전류가 생기고, 3년 보관한 VFD 콘덴서가 폭발한 사례도 있다. 10년 넘게 둔 것은 전류를 제한해 24~72시간 재생(reforming)해야 한다. | C (allpcb 요약, Industrial Monitor Direct), B (UNT 디지털 도서관 보고서, https://digital.library.unt.edu/ark:/67531/metadc3104/) | 80년 된 전원부는 "켜는 순간 터지는" 부품이다. 천천히 살려 내는 기술자가 하나의 직업이 된다. |
| 윤활제 | 온도가 떨어지면 그리스가 굳는다. 기동 토크가 커지고 관절이 덜컥거리거나 잠기며, 윤활이 모자라 마모가 생긴다. 극저온용 PAO·에스테르나 PFPE 그리스는 -40°C까지 버틴다. | C (FANUC 통합업체, STLE 해설, https://www.stle.org/files/TLTArchives/2020/12_December/Grease.aspx) | 군용·극지용 기계만 움직이고 민수용 관절 로봇은 굳어 버린다. PFPE 그리스는 귀한 회수품이다. |
| 태양광 | 열화 중앙값은 연 약 0.5%이고 추운 기후에서는 약 0.4%/년으로 가장 느리다. 저온에서는 효율이 1°C당 약 0.3% 오른다. 눈에 완전히 덮이면 출력은 0이다. 눈과 얼음 하중은 셀 균열을, 눈 녹은 물은 박리를 부른다. | A (NREL, https://www.nrel.gov/solar/market-research-analysis/blog/posts/stat-faqs-part2-lifetime-of-pv-panels), B (arXiv 북극 에너지 리뷰 2026, https://arxiv.org/pdf/2609.09992), C (설치업체 블로그) | 0.995^80 ≈ 0.67이므로 셀 자체는 2126년에도 출력의 3분의 2 정도를 낼 수 있다. 실제로 쓸 수 있는지는 눈을 치우고 기울기와 프레임이 온전한지에 달렸다. |
| 방사성 열원 | 소련 Beta-M RTG는 Sr-90 280 g, 열 250 W, 전기 10 W를 10~20년 낸다. 반감기는 28.79년이다. 1991년 이후 방치되자 고철 도둑이 차폐를 벗겨 갔고, 2001년 조지아 리아 사고에서는 피폭으로 1명이 사망했다. | B (Wikipedia Beta-M·Lia 사고, https://en.wikipedia.org/wiki/Beta-M), B (Bellona 2015, https://bellona.org/news/nuclear-issues/radioactive-waste-and-spent-nuclear-fuel/2015-11-foreign-funds-have-almost-entirely-rid-russia-of-orphaned-radioactive-power-generators) | 2^(-80/28.79) ≈ 0.146이다. 80년이 지나도 Sr-90 방사능은 약 15%가 남아 여전히 치명적이며, 열원으로도 쓸모가 있다. 유일하게 "80년 뒤에도 따뜻한" 기계 심장이다. |

**지하가 핵심이다.** [추론] 지상은 영구 동결 상태지만 깊은 지하철 터널은 지열 덕분에 온도 변동이 작고, 많은 기계가 0°C 근처에서 휴면한다. 그래서 같은 기종이라도 지상 개체는 굳어서 죽고, 역사·터널 개체는 "잠들어 있다가 깨는" 쪽으로 차이를 두면 물리적으로 설명이 된다.

## 2. 기계 부류별 조사

### 2.1 보도 배송 로봇·서빙·청소 로봇

- **실재와 규모.** 한국은 2023년 11월 17일 개정 지능형로봇법·도로교통법을 시행해 안전 인증을 받은 실외 이동 로봇에 보행자 지위를 주었다(B, UPI 2023, https://www.upi.com/Top_News/World-News/2023/11/17/South-Korea-autonomous-robots-sidewalks/5241700244789/). 뉴빌리티 '뉴비'는 선릉역 일대와 판교 10대, 래미안 리더스원(강남) 단지 배송에 투입됐고, 배민 '딜리'도 강남에서 시범 운행했다(B, Korea Times 2024, https://www.koreatimes.co.kr/business/tech-science/20240520/delivery-robots-set-to-become-ubiquitous-in-korea; B, Samsung C&T 뉴스룸 2024, https://news.samsungcnt.com/en/features/engineering-construction/2024-07-living-is-easy-the-future-of-robot-delivery-services/). SKT·뉴빌리티·SK쉴더스의 순찰 로봇은 덕성여대를 순찰했다(B, 같은 기사).
- **서빙 로봇.** Bear Robotics는 세계에 약 2만 대를 공급했고, LG가 2025년 1월 지분 51%를 확보해 CLOi 사업과 통합했다(B, KED Global 2025, https://www.kedglobal.com/robotics/newsView/ked202501240002). 2026년 초 한국 식당·카페·호텔·요양시설에서 서비스 로봇 3만 대 이상이 운영 중이라는 추정이 있다(C, Seoulz 블로그, https://www.seoulz.com/korea-robot-density-2026/).
- **동력과 내구.** 실내외 겸용 소형 리튬이온 팩으로 하루 단위로 충전하고 도킹해 운영한다. [추론]
- **고장 양상.** 카메라·라이다 오염, 보도 결빙, 통신 두절. 뉴비는 비싼 라이다 대신 저가 카메라로 항법한다(B, Korea Times 2023).
- **2126년.** [추론] 지상 개체는 눈에 묻힌 채 배터리가 영하에서 방전돼 대부분 죽었다. 역사 안 서빙·청소 로봇은 충전 도크가 있으면 *유지 루틴*을 반복하는 "유령 점원"이 될 수 있다. 회수품은 소형 모터, 바퀴, 카메라 모듈, 18650·파우치 셀, 단열 화물칸이다.

### 2.2 다리 달린 로봇(사족 보행)

- **Spot.** 고객사에 1,500대 이상이 있다. 배터리는 564 Wh, 통상 약 90분 운용(부착물을 달면 약 60분), 모터를 끈 대기 180분이다. 배터리 교체식이고 도크에서 50분이면 80% 충전된다(A, Boston Dynamics Spot IFU v2.3, https://d3cjkvgbik1jtv.cloudfront.net/Spot_IFU/Spot+IFU+2.3.pdf; B, 리셀러 리뷰). 석유 플랫폼·발전소·건설 현장 점검에 쓰인다.
- **터널 점검 응용.** 사족 로봇 플랫폼에 레이저 스캐너를 얹어 지하철 터널 변형을 탐지하는 연구가 있다(A, Tunnelling and Underground Space Technology 2025, https://www.sciencedirect.com/science/article/abs/pii/S0886779825006042).
- **2126년.** [추론] 운용 시간 90분짜리 기계는 도크 없이는 사냥꾼이 될 수 없다. 도크 주변을 맴도는 "둥지형" 행동이 그럴듯하다. 회수품은 고토크 관절 액추에이터, 스테레오 카메라, 교체식 배터리다.

### 2.3 휴머노이드

- **시장 전망.** Goldman Sachs는 2035년 시장 규모를 380억 달러, 2030년 출하를 25만 대 이상(거의 모두 산업용)으로 봤다. 단 실용성은 아직 증명되지 않았다고 단서를 달았다(A, Goldman Sachs 2024, https://www.goldmansachs.com/insights/articles/the-global-market-for-robots-could-reach-38-billion-by-2035). Morgan Stanley는 2050년 설치 대수가 10억 대를 넘고(약 9.3억 대는 산업·상업용, 가정용 약 8천만 대) 교체 주기가 6년이라고 가정했다(B, CNBC 2025, https://www.cnbc.com/2025/04/29/how-to-play-a-5-trillion-market-for-humanoid-robots-by-2050.html; C, 2026년 7.5조 달러 상향 보도).
- **실제 출하.** Unitree는 2025년 휴머노이드 5,500대 이상(IPO 서류 5,511대)을 인도했고 평균가는 2.5만 달러 미만이다(A, Unitree 공식 해명, https://shop.unitree.com/blogs/news/clarification-regarding-unitrees-2025-sales-data). 2025년 세계 출하는 약 1.3만 대이고 그중 약 80%가 중국산이다(B, Forbes 2026, https://www.forbes.com/sites/jonmarkman/2026/04/27/unitree-g1-humanoid-robots-are-reshaping-the-robotics-investment-stack/). G1은 1.35만 달러부터, R1은 4,900달러부터 판다(A, Unitree 스토어).
- **현대차·Boston Dynamics.** 전기식 Atlas 양산형이 CES 2026에서 공개됐다. 2028년 HMGMA(조지아)에서 부품 시퀀싱부터 투입하고, 2030년에는 조립으로 넓힌다(B, 현대 뉴스룸 2026, https://www.hyundai.com/worldwide/en/newsroom/detail/0000001105). 2028년까지 연 3만 대 생산 능력을 갖추고 2.5만 대 이상을 투입한다는 *계획*이 있다(C, TechTimes 2026; 노조 반대 보도 포함).
- **Tesla·Figure.** Tesla는 2025년 2분기 콜에서 5,000대 목표에 수백 대밖에 만들지 못했다고 인정했다. Fremont 라인을 연 100만 대 규모로 전환하는 것이 목표다(A, Tesla 10-Q 2026, https://www.sec.gov/Archives/edgar/data/0001318605/000162828026049270/tsla-20260630.htm; C, 추적 블로그). Figure의 BMW 스파턴버그 투입 정도는 자료마다 엇갈린다(C).
- **2126년.** [추론] 2046년이면 전망대로 수천만 대가 깔렸을 수 있다(MS 경로 기준 2040년 1.38억 대, C). 하지만 배터리 운용 시간이 짧고 민수용 그리스를 쓰기 때문에 지상 개체는 대부분 "얼어붙은 노동자 조각상"이 된다. 공장·물류센터 지하층에 남은 것은 휴면 상태다. 회수품은 하모닉 감속기, 손(촉각 센서), 희토류 모터 자석, 추론 칩이다.

### 2.4 드론

- **농업 방제.** DJI 농업 드론은 2024년 말 세계에서 약 40만 대가 운용 중이며, 100개국 300개 작물에 쓰인다. DJI가 자금을 댄 자체 추정이다(B, AgFunderNews 2025, https://agfundernews.com/dji-report-charts-rapid-rise-in-global-adoption-of-ag-spray-drones).
- **배송(한국).** K-드론배송은 2024년 14개 지자체 50개 지역에서 2,993회를 비행했고, 2025년 166개 지역(섬 44곳, 공원 122곳)으로 확대됐다(B, Unmanned Airspace, MOLIT 인용, https://www.unmannedairspace.info/latest-news-and-information/korea-announces-expansion-of-k-drone-operations/).
- **군사(우크라이나 교훈).** FPV 생산량은 2022년 연 3천~5천 대에서 2025년 약 300만 대로 늘었다(B, Just Security 2026, https://www.justsecurity.org/138164/ukraine-drone-superpower/). 광섬유 FPV는 2025년 국방조달청 계약으로 37.4만 대가 들어갔다. 재밍이 통하지 않지만 광섬유 공급을 AI 데이터센터와 다툰다(B, Euromaidan Press 2026, https://euromaidanpress.com/2026/04/21/ukraine-has-delivered-92-of-last-years-fiber-optic-drone-total-to-front-in-under-four-months/). Swarmer의 AI 군집 공격은 보통 3대 단위, 최대 25대까지 시험했고 최종 타격은 사람이 승인한다(B, WSJ 인용 UNITED24, https://united24media.com/latest-news/ukraine-just-changed-warfare-forever-with-ai-guided-attack-drone-swarms-11324).
- **한국군.** 2026년 6월 '50만 드론전사' 정책을 발표했다. 이는 *병력 교육* 목표이고 드론 수량이 아니다. 2029년까지 약 6만 대를 확보하고 레이저·고출력 마이크로파 대드론 무기를 개발한다(B, UPI 2026, https://www.upi.com/Top_News/World-News/2026/06/26/korea-South-Korea-military-drone-warriors-strategy-North-Korea-Russia-Ahn-Gyu-back/1961782460709/).
- **2126년.** [추론] 멀티콥터는 비행 시간이 수십 분이고 셀이 저온에 약해 지상에서는 자력으로 날지 못한다. 위험은 *남은 탄두*다. 배회형 폭탄과 지뢰 살포 드론의 폭약, 신관은 80년 뒤에도 불발탄으로 남는다. 터널과 역 천장에 엉켜 있는 광섬유 FPV의 수 km짜리 광섬유는 그 자체로 회수 자원(통신선, 덫 줄)이다.

### 2.5 자율주행차·로보택시

- **해외.** Waymo는 2025년 주당 유료 운행 25만 회(4월)에서 2025년 말 45만 회 이상(Tiger Global 추정)으로 늘었고, 차량은 약 2,500대다(B, CNBC 2025, https://www.cnbc.com/2025/12/08/waymo-paid-rides-robotaxi-tesla.html).
- **서울.** 2024년 9월 26일 강남 심야 자율주행 택시가 3대로 시작했다. 2026년 4월 유료화됐고, 7대에서 19대로 늘었으며 7월까지 누적 15,140회를 운행했다. 안전요원이 여전히 탑승한다(A, 서울시 영문 보도자료, https://english.seoul.go.kr/seoul-expands-koreas-first-late-night-autonomous-taxi-service-to-all-of-gangnam-after-verification-of-safety-and-convenience/; B, Asia Business Daily 2026). 새벽 자율주행 버스(148·504·741번 노선)도 있다(A, 서울시 정책 아카이브, https://english.seoul.go.kr/seoul-policy-archive/leading-city-of-autonomous-urban-mobility/).
- **2126년.** [추론] 차체는 눈에 덮인 지형지물이 된다. EV 팩(수십 kWh)이 가장 큰 회수 에너지원이지만 저온 충전과 도금으로 인한 화재 위험이 함께 따라온다. 라이다·레이더 장비는 보존 상태가 좋으면 역 보안 센서로 다시 쓸 수 있다.

### 2.6 자율 건설·광산·농업 기계

- **광산.** Komatsu는 2026년 4월 자율 운반 트럭 1,000대째를 투입했다(930E-5AT, 적재 290 t)(B, IVT International 2026, https://www.ivtinternational.com/news/mining/komatsu-becomes-first-oem-to-commission-1000-ultra-class-autonomous-haul-trucks.html). Caterpillar는 2025년 827대(C, 연차보고서 2차 인용)를 운영했다. 세계 자율 운반 트럭은 약 4,000대이고 절반 이상이 중국에 있다(C).
- **건설(한국).** 두산인프라코어(현 Develon) Concept-X는 2019년 보령에서 드론 측량부터 무인 굴착기·휠로더·덤프 협업까지 시연했고 2025년 상용화를 목표로 했다. 실제 상용화 여부는 확인하지 못했다(B, Develon 보도자료, https://eu.develon-ce.com/en/news/2019-20-11-doosan-unmanned-automated-construction).
- **2126년.** [추론] 디젤과 대형 유압 기계는 연료와 작동유가 굳고 씰이 경화되지만, 구조가 단순해 수리 가능성은 가장 높다. 강철 차대, 유압 실린더, 굴착 버킷은 역사 방벽이나 문, 제설 장비의 재료가 된다.

### 2.7 창고·물류 자동화

- Amazon은 2025년 7월 100만 번째 로봇을 투입했다. 300개 이상의 시설에서 주문의 약 75%를 로봇이 거들고, DeepFleet 모델로 이동 효율을 10% 높였다(B, TechCrunch 2025, https://techcrunch.com/2025/07/01/amazon-deploys-its-1-millionth-robot-releases-generative-ai-model/).
- **2126년.** [추론] 격자 바닥 위를 도는 저상형 AMR은 중앙 관제가 끊기면 그 자리에서 멈춘다. 다만 관제 서버와 전력이 일부 살아 있다면 "아무도 주문하지 않는 물건을 계속 옮기는" 폐쇄 생태계가 된다. 회수품은 대량의 동일 규격 바퀴 모터와 배터리, 랙 강재다.

### 2.8 인프라 점검 로봇(터널·지하철·관로)

- 서울교통공사의 터널 점검 로봇은 영문 자료에서 확인하지 못했다. 서울교통공사가 공개한 것은 AI 혼잡 감시, 원격 시설 제어 '스마트 스테이션', XR 정비다(B, KoreaBizwire 2025, http://koreabizwire.com/seoul-metro-unveils-ai-driven-subway-of-the-future-at-smart-life-week/334115).
- 중국 사례로는 시속 40 km로 레일 위를 달리며 2 km에 위치 오차 0.15%인 레일 탑재 점검 로봇(A, PMC 2022, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9816118/)과 다중 센서 고속 점검 장비(A, Scientific Reports 2025, https://www.nature.com/articles/s41598-025-18959-y)가 있다.
- **관로.** 한국 연구진이 900~1,200 mm 대구경 상수관용 MFL(자기누설) 점검 로봇을 만들었다. 무선이고 배터리로 움직인다(A, Sensors/PMC 2024, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11174578/). 1998년에는 고무 튜브로 균열을 막는 '패커 로봇'이 있었다(A, OSTI, https://www.osti.gov/etdeweb/biblio/20162988).
- **2126년.** [추론] 지하철 생활권에 가장 직접 관련된 부류다. 레일 탑재형은 레일이 곧 길이고 급전선이 살아 있으면 계속 순회할 수 있으므로, 2126년 역 주민에게 "선로의 순례자"가 된다. 관로 로봇은 물이 언 관 속에 갇힌 채 발견된다.

### 2.9 의료·돌봄 로봇(고령 사회)

- **한국.** 돌봄 인형 '효돌'은 1.6M 원이고 ChatGPT 기반 대화, 복약 알림, 치매 예방 퀴즈 기능이 있다. 2025년 11월까지 독거노인에게 12,000대 이상이 보급됐다(B, CNN 2025, https://www.cnn.com/health/asias-aging-population-finds-comfort-care-in-robo-grandma-dolls-wellness-spc; B, Rest of World 2025, https://restofworld.org/2025/korea-ai-robot-senior-care-hyodol/). 치매 노인이 인형의 말("시냇물 소리가 듣고 싶다")을 듣고 혼자 개울로 간 사례가 보도됐다(B, Rest of World).
- **일본.** 2015년부터 요양시설 로봇 보조금을 지급했고, 2017년 보조금 지역이 시설의 71.9%를 덮었다. 로봇을 도입한 시설은 오히려 돌봄 인력이 28% 늘었다(A, NBER w33116, https://www.nber.org/system/files/working_papers/w33116/w33116.pdf). 시설 도입률은 12~15%다(C, 시장조사).
- **2126년.** [추론] 작은 인형형 기기는 단추 전지나 소형 셀을 쓰므로 80년 뒤에는 전원이 없다. 하지만 *목소리 녹음과 대화 로그*가 메모리에 남아 있을 수 있다. 서사적으로 가장 강한 "죽은 자의 목소리" 유물이다.

### 2.10 군용 무인 지상차량·초소 시스템

- **DMZ 초소.** 삼성테크윈(현 한화에어로스페이스)과 고려대가 만든 SGR-A1은 K3 5.56 mm 기관총을 달았고, 음성 인식으로 피아를 식별한다. 2010년 시험 배치됐다는 보도가 있으나 배치 수량은 기밀이고, 완전 자율 사격 여부는 제조사가 부인했다(B, Wikipedia SGR-A1, https://en.wikipedia.org/wiki/SGR-A1; B, The Register 2007, https://www.theregister.com/2007/03/14/south_korean_gun_bots/).
- **UGV.** 한화 아리온스멧은 6×6 전기식, 약 2톤, 1회 충전 100 km를 달린다. 7.62 mm 원격 무장에 DNN 표적 추적과 총성 방향 역사격 기능이 있고, 통신이 끊기면 자동 복귀한다. 2026년 7월 육군 첫 다목적 UGV 사업(496억 원)에 선정됐다(B, Army Recognition 2026, https://www.armyrecognition.com/news/army-news/2026/hanwha-arion-smet-south-korea-army-ugv-contract; B, Korea Times 2026).
- **우크라이나.** UGV는 2024년 약 2천 대에서 2025년 1.5만 대로 늘었다. 일부 여단에서는 병참의 80~90%를 UGV가 맡는다(B, Modern War Institute 2026, https://mwi.westpoint.edu/networked-for-war-lessons-from-ukraines-ground-robots/).
- **2126년.** [추론] 가장 "위험한 기계"의 근거가 되는 부류다. 고정 초소는 외부 전원이 끊기면 죽지만, 탄약은 수십 년 남는다. "통신 두절 시 자동 복귀" 같은 *실재하는 기능*은 귀환할 기지가 사라진 기계가 마지막 좌표로 끝없이 돌아가려는 행동으로 이어질 수 있다. 회수품은 장갑판, 무장(위험), 비공기압 타이어, 군용 저온 그리스다.

### 2.11 스마트시티 센서·유지보수 자동화

- 서울 S-DoT는 2019년 850대, 2020년 250대가 설치돼 1,100개 지점에 있다. 온도·습도·조도·소음·미세먼지 등 17종을 2분마다 수집한다. 센서는 저가 MEMS다(A, 서울시, https://english.seoul.go.kr/analysis-of-city-data-s-dot-collected-by-1100-sensors-in-seoul-is-released/; A, Sensors 2023, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10037411/).
- **2126년.** [추론] 대부분 전주와 건물 외벽에 달린 상전원 기기라 죽었다. 자가 태양광형이 있다면 눈을 치울 때마다 잠깐씩 "깨어나 2분 간격으로 보고하는" 기계 새 무리라는 연출이 가능하다. 다만 이것은 설정상 가정이다.

### 2.12 전력 체계: 80년을 버틸 수 있는가

- **SMR.** 한국 i-SMR은 170 MWe 모듈, 설계 수명 80년, 핵연료 교체 주기 24개월이다. 2035년 상용화가 목표다(A, IAEA ARIS, https://aris.iaea.org/api/DSR/Download?DSRRequestId=109; B, World Nuclear Association, https://world-nuclear.org/information-library/country-profiles/countries-o-s/south-korea). SMART는 수명 60년에 3년 주기, 부유식 BANDI-60은 4~5년 주기다(A, 같은 자료).
- **함의.** [추론] 24개월~5년 주기라는 것은 연료를 교체하는 사람이 없으면 원자로가 "80년 동안 켜져 있을 수 없다"는 뜻이다. 2126년의 원자로는 정지했거나 손상된 위험 지대이고, 남은 붕괴열과 사용후핵연료 수조가 따뜻한 오염지가 된다. 반면 RTG 같은 동위원소 열원은 출력이 작아도 감쇠하며 계속 열을 낸다(1장 표).
- **배터리 ESS·마이크로그리드.** [추론] LFP ESS는 셀 화학은 얼어서 보존되지만 BMS가 죽으면 충전할 수 없다. 사람이 우회해서 충전하면 도금과 열폭주 위험이 생긴다(1장 A 근거). 태양광 + LFP + 지하 역사 조합이 2126년 공동체가 가장 현실적으로 되살릴 수 있는 전력원이다.

## 3. 한국과 서울에 특화된 사실 요약

- 제조업 로봇 밀도: 2024년 노동자 1만 명당 1,220대로 세계 1위다(A, IFR 보도자료 2026, https://www.businesswire.com/news/home/20260408531951/en/Robot-Density-Surges-in-Europe-Asia-and-Americas-IFR-reports). 2025년 수치는 1,066대인데 IFR은 하락 원인을 설명하지 않았다(B, A3 해설).
- 보도 위 로봇의 보행자 지위(2023), 강남 심야 자율택시(2024~), K-드론배송 166개 지역(2025), 효돌 1.2만 대(2025), SGR-A1(2010 시험 배치 보도), 아리온스멧(2026 선정), 50만 드론전사(2026), i-SMR(2035 목표).
- 확인하지 못한 것: 서울 지하철 터널 점검 로봇, Develon Concept-X 상용화, K-water 관로 로봇의 실배치.

## 4. 게임 기계 "종" 후보 표

모두 설정 *후보*다. 사용 구분은 조우·자원·위험·동료다.

| 후보 이름(가칭) | 실제 근거 | 게임 용도 | 서사 고리 |
|---|---|---|---|
| 배달꾼(보도 로봇) | 뉴빌리티 뉴비, 배민 딜리, 2023 보행자 지위 | 자원(셀·바퀴), 가끔 동료 | 화물칸 속 2046년 배달 영수증. 받는 사람은 모두 죽었다. |
| 유령 점원 | Bear Servi, LG CLOi 서빙 로봇 | 조우(비적대), 정보 | 역 안 식당 폐허에서 아무도 없는 테이블에 계속 그릇을 나른다. |
| 둥지 사족 | Spot(90분, 도크 충전) | 조우(영역 방어), 자원(액추에이터) | 도크를 둥지처럼 지킨다. 도크를 빼앗으면 그 개체가 따라온다. |
| 얼음 노동자 | Atlas, Optimus, Unitree G1 | 위험(해동하면 오작동), 자원(감속기, 희토류 자석) | 공장 지하층에 줄지어 선 수천 개의 조각상. 몇 기는 따뜻한 날 깨어난다. |
| 선로 순례자 | 레일 탑재 터널 점검 로봇(중국 사례) | 동료(지도·안전 정보), 조우 | 급전선만 살아 있는 구간을 80년째 순회하며 균열 보고서를 아무도 받지 않는 서버로 보낸다. |
| 실타래 벌 | 광섬유 FPV, 배회형 폭탄 | 위험(불발 탄두), 자원(광섬유) | 터널 천장에 걸린 수 km 광섬유. 끊으면 아직 살아 있는 탄두가 떨어진다. |
| 군집 까마귀 | Swarmer AI 군집(3~25대) | 조우(집단), 위험 | 최종 승인을 내릴 사람이 없어 공격 직전에 정지 비행하다가 배터리가 다하면 떨어진다. |
| 귀환자 | 아리온스멧(통신 두절 시 자동 복귀) | 위험(무장), 자원(장갑, 타이어) | 사라진 기지 좌표로 돌아가려고 같은 눈벌판을 맴돈다. 좌표 위에는 지금 역 공동체가 산다. |
| 경계석 | SGR-A1 초소(음성 식별) | 위험(정적 포대), 퍼즐 | 2040년대 암구호를 아는 사람만 지나갈 수 있다. 그 암구호는 노인의 노래 속에 남아 있다. |
| 손주 인형 | 효돌 돌봄 인형 | 자원(기억 로그), 서사 | 죽은 할머니의 목소리 기록. 시냇물 이야기를 하며 아이를 위험한 곳으로 이끈다. |
| 기계 새 떼 | S-DoT 환경 센서 | 정보(날씨 예보) | 눈을 치우면 깨어나 2분마다 온도를 외친다. 사람들은 이것을 신탁으로 여긴다. |
| 강철 짐승 | Komatsu 930E, Concept-X 굴착기 | 자원(강재, 유압), 거점 건설 | 수리하면 제설기와 방벽이 되지만 디젤이 없다. |
| 따뜻한 심장 | 소련 Beta-M RTG(Sr-90) | 자원(열), 위험(피폭) | 80년 뒤에도 약 15%의 방사능이 남은 따뜻한 상자. 품고 자면 얼지 않지만 서서히 죽는다. |
| 잠든 원자로 | i-SMR(24개월 주기, 80년 설계) | 위험 지대, 서사 거점 | 아무도 연료를 갈지 않아 꺼진 "영원한 발전소". 수조는 아직 따뜻하다. |
| 화로 셀 | EV·ESS LFP 팩(저온 충전 시 도금) | 자원(대용량 전력), 위험(열폭주) | 서둘러 충전한 공동체가 역 하나를 태워 먹은 금기 설화. |
| 터지는 심장 | 전해 콘덴서(재생 없이 통전하면 폭발) | 위험, 직업(재생 기술자) | "천천히 깨워라." 낡은 기계를 살리는 기술자 계층의 계율. |

## 5. 출처 메모

인용 URL은 본문에 함께 적었다. 이 문서의 수치는 모두 2026-11-13에 웹 검색으로 확인했다. 등급 C 수치와 2030년 이후 전망은 설정에 넣기 전에 다시 대조해야 한다.
