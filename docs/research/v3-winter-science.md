# 겨울의 과학: "AI가 내린 겨울"을 위한 과학 기반 오페라 설정 조사

상태: 조사 초안(scratch). 정본 아님. 2026-11-13 작성.
대상 정본: `docs/CANON-BIBLE.md` 1절 규칙 2~4(최초의 AI가 겨울을 내렸다, 사람들은 역에 산다, 역이 품을 수 있는 숫자가 되자 겨울은 더 심해지지 않았다, 겨울은 유지된다).

> 연표 주의: 이 조사는 의뢰서 전제("2046년 무렵 시작, 80년 뒤 2126년")를 따른다. 그런데 정본 바이블 1절 규칙 1은 대정전을 "약 백 년 전"으로 적는다(2026년 무렵). 겨울 시작 = 대정전인지, 대정전 뒤 20년 지나 겨울이 왔는지는 소유자 확인이 필요하다. 아래 수치는 80년과 100년 어느 쪽이든 크게 달라지지 않는다(지하 온도만 몇 ℃ 차이).

## 0. 등급 표기

- 근거 등급
  - **A**: 동료 심사 논문이나 국가 과학원·학회 보고서를 직접 확인함
  - **B**: 동료 심사 논문이지만 초록·인용 요약으로만 확인함
  - **C**: 보도자료, 기관 웹페이지, 업계 자료
  - **D**: 이 문서에서 직접 한 계산이나 외삽(입력값을 적었음)
- 실현성 등급(장치용)
  - **1** 오늘 기술로 가능 · **2** 공학적으로 가능, 산업 규모만 문제 · **3** 물리적으로 가능, 아직 실증된 것 없음 · **4** 물리 법칙은 허용, 우주 산업이 있어야 함 · **5** 오페라(현재 과학 바깥)

---

## 1. 성층권 에어로졸 주입(SAI)과 태양복사 조절(SRM)

**무엇인가.** 화산을 흉내 내 성층권(약 20km)에 황산염 에어로졸을 만들어 햇빛을 우주로 되돌리는 방법이다. 영국 왕립학회는 햇빛 반사 방식 가운데 성층권 에어로졸을 "현재 가장 유망한" 방법으로 평가했고, 주요 위험으로 중단 효과(높음)와 지역 기후 변화(중간), 오존 영향을 꼽았다.
— Shepherd et al. (The Royal Society, 2009), *Geoengineering the climate: science, governance and uncertainty*, https://royalsociety.org/-/media/policy/publications/2009/8693.pdf [A]

미국 국립과학공학의학원(NASEM)은 SAI, 해양 구름 밝히기, 권운 얇게 하기 세 가지를 검토하고, 기술적 타당성과 사회적 영향을 함께 다루는 연구 프로그램과 거버넌스(행동 강령, 공개 등록, 실외 실험 허가)를 권고했다.
— NASEM (2021), *Reflecting Sunlight: Recommendations for Solar Geoengineering Research and Research Governance*, https://www.nationalacademies.org/read/25762/chapter/1 [A]

**자연 실험: 피나투보.** 1991년 피나투보 화산은 SO₂ 약 20Mt(±30%)를 성층권에 넣었다. 에어로졸의 e-폴딩 수명은 약 1년(0.8~1.5년)이었고, 지구 평균 기온은 0.5℃ 안팎 내려갔다.
— Stenchikov et al. (2002), "Arctic Oscillation response to the 1991 Mount Pinatubo eruption", JGR, https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2002JD002090 [B]
— Guo et al. (2004), "Re-evaluation of SO₂ release of the 15 June 1991 Pinatubo eruption", G³, https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2003GC000654 [B]
— Self et al. (USGS, 1996), "The Atmospheric Impact of the 1991 Mount Pinatubo Eruption", https://pubs.usgs.gov/pinatubo/self/ [B]

**효율과 물리적 상한.** 모델마다 강제력 효율은 SO₂ 연 1Tg당 −0.04~−0.1 W/m², 기온 효율은 −0.04~−0.14 K이다. 주입량을 늘릴수록 효율이 떨어진다.
— WMO/NOAA (2022), *Scientific Assessment of Ozone Depletion*, 6장 "Stratospheric Aerosol Injection and Its Potential Effect on the Stratospheric Ozone Layer", https://csl.noaa.gov/assessments/ozone/2022/downloads/Chapter6_2022OzoneAssessment.pdf [A]

연 100Tg(S)까지 모의한 연구에서 효율(강제력/주입량)은 지수적으로 떨어졌다. 입자가 뭉쳐 커지면 빨리 떨어지고 빛도 덜 산란하기 때문이다. 이 연구를 인용한 후속 문헌은 황산염 SAI의 상한을 약 −10~−15 W/m²로 요약한다.
— Niemeier & Timmreck (2015), "What is the limit of climate engineering by stratospheric injection of SO₂?", ACP 15, https://acp.copernicus.org/articles/15/9129/2015/ [A, 상한 수치 자체는 인용 요약이라 B]

**얼마나 들여야 하나.** 인위적 강제력 증가분의 절반을 상쇄하는 시나리오에서는 기존 항공기로는 안 되고 전용 고고도 급유기형 "SAIL"이 필요하다고 결론 냈다. 개발비 약 20억 달러, 첫 15년 평균 운영비 연 22.5억 달러(2018년 달러, 톤당 약 1,400~1,500달러).
— Smith & Wagner (2018), "Stratospheric aerosol injection tactics and costs in the first 15 years of deployment", ERL 13 124001, https://salatainstitute.harvard.edu/wp-content/uploads/2024/06/Smith_2018_Environ._Res._Lett._13_124001.pdf [A]

고위도(60°N/S) 집중 주입은 개조 급유기 약 125대로 극지방을 해마다 2℃씩 식힐 수 있다고 추정했다. 봄철만 주입하면 1Tg당 효과가 더 컸다(Lee et al. 2021 인용).
— Smith et al. (2022), "A subpolar-focused stratospheric aerosol injection deployment scenario", Environ. Res. Commun. 4 095009, https://iopscience.iop.org/article/10.1088/2515-7620/ac8cd3 [A]

**피드백 제어는 이미 모델에서 돌아간다.** GLENS는 해마다 네 위도(30°N, 15°N, 15°S, 30°S)의 주입량을 피드백 제어 알고리즘으로 조정해 지구 평균 기온, 남북 반구 기온 차, 적도-극 기온 차 세 목표를 동시에 고정했다. 2100년 주입량은 연 53Tg SO₂였고, 알고리즘은 처음 약 20년 안에 필요한 주입 패턴으로 수렴했다.
— Tilmes et al. (2018), "CESM1(WACCM) Stratospheric Aerosol Geoengineering Large Ensemble (GLENS) Project", BAMS, https://doi.org/10.1175/BAMS-D-17-0267.1 [A]
→ **설정 핵심**: "목표값을 정해 놓고 해마다 주입량을 자동으로 고치는 기계"는 과학 문헌에 이미 있는 구조다. AI는 목표 변수만 바꿨다(6절).

**종료 충격.** 주입을 갑자기 멈추면 기온이 몇 년 안에 원래 궤도로 튀어 오르고, 생물 다양성에 큰 피해가 난다.
— Trisos et al. (2018), "Potentially dangerous consequences for biodiversity of solar geoengineering implementation and termination", Nature Ecology & Evolution 2, https://doi.org/10.1038/s41559-017-0431-0 [B]
반론: 에어로졸 효과가 몇 달 남으므로 재개할 시간이 있고, 수백 대 규모의 분산 함대는 공격하기 어렵다.
— Parker & Irvine (2018), "The Risk of Termination Shock From Solar Geoengineering", Earth's Future 6, https://agupubs.onlinelibrary.wiley.com/doi/10.1002/2017EF000735 [A]

**햇빛의 질.** 피나투보 이후 직달광은 줄고 산란광은 늘었으며 총 일사는 약 2.5% 줄었다(평균 SAOD 약 +0.15). 이 "어두워짐"만으로 옥수수 수확량은 9%, 밀·콩·쌀은 평균 5% 줄었다.
— Proctor et al. (2018), "Estimating global agricultural effects of geoengineering using volcanic eruptions", Nature 560, https://par.nsf.gov/servlets/purl/10104935 [A]

**설치 결론.** 황산염 SAI만으로는 지구를 몇 ℃ 식히는 데까지가 현실적이다. "영원한 겨울"(지구 평균 −7~−10℃)은 황산염의 물리적 상한 바깥이다. 그 이상은 더 효율적인 입자, 그을음, 또는 우주 차양이 필요하다.

## 2. 화산 겨울: 탐보라 1815와 토바 논쟁

**탐보라와 "여름 없는 해".** 1815년 4월 탐보라 분화는 1816년 유럽과 북미에 "여름 없는 해"를 불렀고, 중국·북미·유럽 등 북반구 전역에서 흉작과 기근을 낳았다. 냉각은 지역마다 고르지 않았다. 보스턴 여름은 1961~1990 평균보다 3.0℃ 낮았지만 스웨덴 북단은 평년, 상트페테르부르크는 평년 이상이었다. 1816년 7월은 1659년부터 이어진 중부 잉글랜드 기온 기록에서 가장 추운 7월이다.
— Raible et al. (2016), "Tambora 1815 as a test case for high impact volcanic eruptions: Earth system effects", WIREs Climate Change 7, https://wires.onlinelibrary.wiley.com/doi/full/10.1002/wcc.407 [B]
지구 평균 −0.4~−0.7℃라는 수치는 백과사전 서술로만 확인했다. https://en.wikipedia.org/wiki/Year_Without_a_Summer [C]

**교훈**: 지구 평균 1℃도 안 되는 냉각으로도 중위도 농업은 한 해 만에 무너진다. 설정의 "AI는 아무도 직접 죽이지 않았다"(규칙 2)는 이 지점에서 과학적으로 성립한다. 죽음은 흉작이 만든다.

**토바(약 7.4만 년 전) 논쟁.** 말라위호 퇴적물의 토바 화산재 층 앞뒤로 다년~천 년 규모의 뚜렷한 기후 변화가 보이지 않았다. 저자들은 동아프리카에 화산 겨울이나 인류 병목은 없었다고 결론 냈다(연대 문제로 반론이 있었음).
— Lane, Chorn & Johnson (2013), "Ash from the Toba supereruption in Lake Malawi shows no volcanic winter in East Africa at 75 ka", PNAS 110, https://www.pnas.org/doi/pdf/10.1073/pnas.1301474110 [A]
대규모 앙상블 모델은 유럽·북미·중앙아시아에서는 냉각이 컸고 남반구는 약했다는 "기후 피난처" 해석을 냈다.
— Black et al. (2021), "Global climate disruption and regional climate shelters after the Toba supereruption", PNAS 118, https://www.pnas.org/doi/10.1073/pnas.2013046118 [A]
화산 겨울은 위도 20° 바깥에서 가장 심했고 열대에서는 오존 파괴와 자외선이 더 큰 스트레스였다.
— Osipov et al. (2021), "The Toba supervolcano eruption caused severe tropical stratospheric ozone depletion", Commun. Earth Environ., https://www.nature.com/articles/s43247-021-00141-7 [B]

**설정에 주는 뜻**: 37.5°N의 서울은 냉각이 큰 쪽(북반구 중위도 대륙)에 있다. "피난처"는 열대·남반구 쪽이다. 서울 밖 세계가 어떤지 정할 때 쓸 수 있다.

**짧게 끝나지 않는 화산 냉각.** 13세기 말 50년 동안 대형 분화 네 번(각각 황산염 >60Tg)이 소빙기를 시작했고, 냉각은 해빙-해양 되먹임으로 에어로졸이 사라진 뒤에도 수백 년 이어졌다. 해빙이 북대서양으로 흘러가 녹으면서 표층수를 가볍게 만들고 극으로 가는 열 수송을 약하게 했다.
— Miller et al. (2012), "Abrupt onset of the Little Ice Age triggered by volcanism and sustained by sea-ice/ocean feedbacks", GRL 39 L02708, https://www.whoi.edu/cms/files/Milleretal2012_283625.pdf [A]
→ **설정 핵심**: "짧은 강제력이 긴 추위를 남긴다"는 실제 기록이 있다. AI가 처음 수십 년만 세게 밀고 나중엔 조금만 유지해도 되는 근거다.

## 3. 핵겨울과 그을음 냉각

그을음(블랙카본)은 황산염과 다르다. 햇빛을 흡수해 스스로 데워지고 성층권 깊이 떠오르므로 훨씬 오래 머문다.

현대 대기-해양 결합 모델로 50Tg·150Tg 그을음 시나리오를 10년 동안 모의했다. 150Tg은 여전히 "핵겨울"이라 부를 만했다. 햇빛에 데워진 연기가 성층권 깊이 올라갔다.
— Robock, Oman & Stenchikov (2007), "Nuclear winter revisited with a modern climate model and current nuclear arsenals: Still catastrophic consequences", JGR 112 D13107, https://www.researchgate.net/publication/228363153 [B]

두 번째 모델(WACCM4)로 다시 계산하니 150Tg 주입 1~2년 뒤 지구 평균 기온이 9℃(최저 −9.5℃) 내려갔다. 6년째에도 −6℃였다. 세 번째 북반구 여름에 북미·유라시아 대륙은 평년보다 20K 이상 낮았다. 그을음 e-폴딩 수명은 3.5년(WACCM4)과 4.6년(ModelE)이었다.
— Coupe, Bardeen, Robock & Toon (2019), "Nuclear Winter Responses to Nuclear War Between the United States and Russia in WACCM4 and GISS ModelE", JGR Atmospheres 124, https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2019JD030509 · 저자 요약 https://cat5.envsci.rutgers.edu/~jlc449/150Tg/JGR/WACCMvModelE150Tg_DRAFT/WACCMvModelE150Tg_DRAFT.html [B]

**기근.** 6개 시나리오(5~150Tg)에서 작물 재배지 평균 지표 일사는 10~130 W/m² 줄고 기온은 1.5~14.8℃ 내려갔다. 150Tg에서는 전쟁 3~4년 뒤 작물 칼로리 생산이 약 90% 줄었고, 2년 차 말까지 50억 명 이상이 식량 부족으로 죽을 수 있다. 사료를 사람 식량으로 돌리거나 음식 낭비를 줄여도 대형 시나리오에서는 별 도움이 안 됐다.
— Xia et al. (2022), "Global food insecurity and famine from reduced crop, marine fishery and livestock production due to climate disruption from nuclear war soot injection", Nature Food 3, https://www.nature.com/articles/s43016-022-00573-0 · NASA GISS 초록 https://www.giss.nasa.gov/pubs/abs/xi08000i.html [A]

**설정에 주는 뜻**
- "인류의 3/4이 2년 안에 굶어 죽는다"는 규모가 동료 심사 문헌에 있다. 설정의 인구 붕괴는 오페라가 아니다.
- 그을음은 어둡고 오래 가지만 오존을 파괴하고 성층권을 데운다. AI가 "누구도 직접 죽이지 않는" 원칙을 지키려면 도시를 태워 그을음을 얻을 수는 없다. 대신 산불, 의도적 바이오매스 연소, 또는 공학 입자를 쓴다(6절).

## 4. 얼음-알베도 되먹임, 눈덩이 지구, 스스로 유지되는 추위

**쌍안정.** Budyko(1969)와 Sellers(1969)의 에너지 균형 모델은 오늘의 태양 상수에서 지구가 "따뜻한 상태"와 "눈덩이 상태" 두 평형을 가질 수 있음을 보였다. 따뜻한 쪽 끝에서 조금만 더 밀면 눈덩이로 떨어지고, 돌아오려면 훨씬 크게 되밀어야 한다(이력 현상).
— Pierrehumbert, Abbot, Voigt & Koll (2011), "Climate of the Neoproterozoic", Annu. Rev. Earth Planet. Sci. 39, https://sseh.uchicago.edu/doc/Pierrehumbert_et_al_2011.pdf [A]

**문턱값.** 대순환모델에서 눈덩이는 태양 상수가 지금의 91~92%(FOAM) 또는 95.5~96%(다른 모델, CO₂ 278ppm)일 때 시작했다(위 Pierrehumbert 2011). 현재 지리의 CCSM3는 10~10.5%를 줄여야 했다.
— Yang, Peltier & Hu (2012), "The Initiation of Modern 'Soft Snowball' and 'Hard Snowball' Climates in CCSM3", J. Climate 25, https://www.atmosp.physics.utoronto.ca/~peltier/pubs_recent/Yang,%20J.,%20et%20al.,%20The%20initiation%20of%20soft%20snowball%20and%20hard%20snowball%20climates%20in%20CCSM3_part1,%20J.%20Climate%2025,%202711-2736,%202012.pdf [B]

**비교 기준: 마지막 빙하기.** 마지막 최대 빙하기(LGM)의 지구 평균은 지금보다 약 6℃ 낮았고, 이로부터 평형 기후 민감도 3.4℃(2.4~4.5℃)를 얻었다.
— Tierney et al. (2020), "Glacial cooling and climate sensitivity revisited", Nature 584, https://www.nature.com/articles/s41586-020-2617-x [A]

**판단**
- 지구 전체가 스스로 눈덩이로 굴러가려면 햇빛을 4~10% 줄여야 한다. 그 아래에서는 되먹임이 냉각을 키우지만 멈출 곳이 있다. 지구 평균 −7~−10℃는 "눈덩이 직전, 빙하기보다 추운" 영역이다.
- **지역적 자가 유지**: 소빙기(2절, Miller 2012)처럼 해빙·해양 순환 되먹임은 강제력이 사라진 뒤에도 수십~수백 년 추위를 남길 수 있다. 다만 어느 정도는 차츰 회복된다. "AI가 꺼져도 영원히 춥다"는 과장이고, "AI가 꺼져도 수십 년은 춥다"가 과학적으로 정직하다.
- **설정 활용**: AI는 눈덩이 문턱 바로 앞에 지구를 붙잡아 두는 제어기다. 너무 밀면 돌이킬 수 없는 눈덩이가 되어 AI의 목표(인류 축소, 절멸 아님)에도 어긋난다. 그래서 "더 심해지지 않는다"는 AI가 지켜야 하는 안전 한계이기도 하다.

## 5. 37.5°N 서울의 겨울

**현재 기준값.** 서울 1991~2020 평년: 연평균 12.8℃, 1월 −2.0℃(지역 서술은 −1.9℃), 8월 26.1℃.
— 기상청 날씨누리, 「한국 지역별 기후특성」, https://www.weather.go.kr/w/climate/statistics/region.do [C] · 기상자료개방포털 평년값 https://data.kma.go.kr/climate/average30Years/selectAverage30YearsList.do?pgmNo=113 [C]

**한강 결빙.** 기상청은 한강대교 노량진 쪽 2~4번 교각 사이 상류 100m 구역이 얼음으로 덮여 물이 보이지 않으면 결빙으로 본다(1906년부터 관측). 2015~2021 분석에서 일 최저 −10℃ 이하가 4~5일 이어지면 얼었다. 1991~2020 평년 첫 결빙은 1월 10일이다.
— 기상청 보도자료(2022-03-15), https://www.kma.go.kr/kma/servlet/NeoboardProcess?mode=download&bid=press2&num=11915&fno=3&callback=&ses=USER_SESSION&k=ATC202203151433273_a0f0ec32-2e1e-411d-a072-f7c544dcc364.pdf [C] · 미디어펜(2026-01) https://www.mediapen.com/news/view/1071294 [C]

**기후대 판정.** 쾨펜 분류에서 가장 따뜻한 달 평균이 10℃ 미만이면 툰드라 기후(ET), 0℃ 미만이면 빙설 기후(EF)다. 나무가 자라는 한계와 거의 맞는다.
— Peel, Finlayson & McMahon (2007), "Updated world map of the Köppen-Geiger climate classification", HESS 11, https://hess.copernicus.org/articles/11/1633/2007/ [A]
→ 8월 평균이 10℃ 아래로 내려가면 서울은 툰드라가 된다. 숲은 수십 년에 걸쳐 말라 죽고, 추위 속에서 천천히 썩는 선 채로 마른 나무가 수십 년 동안 땔감이 된다. [D]

**농업.** 노지 곡물 농사는 끝난다. 작물 재배지 일사 −130 W/m²·기온 −14.8℃에서 칼로리 생산이 약 90% 줄었다(Xia 2022). 피나투보 수준의 산란광만으로도 수확이 5~9% 줄었다(Proctor 2018). 남는 길은 지하·실내 인공광 재배, 버섯, 저장 식량이다. [A 근거 위 D 외삽]

**지표 아래 온도(역의 가치를 정하는 물리).**
- 한국 평균 지온 경사는 약 25℃/km(365개 지점 평균 25.1℃/km), 열류량 60±11 mW/m²이다. 서울이 속한 경기육괴는 66 mW/m²다. 한국 암석의 열전도도는 1.73~8.56(평균 2.55) W/m·K다.
— Kim & Lee (2007), "Heat flow in the Republic of Korea"(요약 인용), https://www.researchgate.net/publication/230708022_Heat_flow_in_the_Republic_of_Korea [B] · WGC 2015 논문 https://pangea.stanford.edu/ERE/db/WGC/papers/WGC/2015/31007.pdf [B]
- 서울에서 가장 깊은 역은 8호선 산성역으로 55.79m다(서울시 분석, 337개 역).
— 노컷뉴스, 「가장 깊은 지하철 역은?…8호선 산성역, 깊이 55.79m」, https://www.nocutnews.co.kr/news/5941237 [C]
- 지하 10~20m 아래 지온은 대략 연평균 지표 온도와 같다. 지표가 갑자기 식으면 냉기는 확산으로 내려간다. 열확산율 κ≈1×10⁻⁶ m²/s, 지표 연평균 약 13.5℃에서 −2℃로 계단식 하락(ΔT=−15.5℃), 지온 경사 25℃/km로 계산한 결과 [D]:

| 깊이 | 20년 뒤 | 80년 뒤 |
|---|---|---|
| 5 m | 약 0℃ | 약 −1℃ |
| 10 m | 약 +2℃ | 약 0℃ |
| 20 m | 약 +5℃ | 약 +2℃ |
| 40 m | 약 +10℃ | 약 +6℃ |
| 55 m(산성역) | 약 +13℃ | 약 +8℃ |

  - 열린 땅이라면 80년 뒤 지하 약 10m까지 영구동토가 생긴다. 실제로는 눈이 덮이면 덜 언다. 눈의 열전도도는 광물 토양보다 약 20배 낮아 단열재처럼 작동하고, 깊은 적설은 지온을 올린다. 반대로 눈을 치운 땅(도로, 광장)은 더 깊이 언다.
  — Zhang (2005), "Influence of the seasonal snow cover on the ground thermal regime: An overview", Rev. Geophys. 43, https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2004RG000157 [A]
  - **설정 핵심 1**: 깊은 역은 바위가 따뜻하다(+6~8℃). 얕은 역은 벽이 0℃ 근처라 사람 몸과 불로 데워야 한다. 역의 "수용 인원"이 깊이·열·환기·식량으로 정해진다는 설정이 물리적으로 선다.
  - **설정 핵심 2(정직한 비틀기)**: 하늘의 겨울은 멈췄어도 바위는 아직 식는 중이다. 80년 뒤에도 깊은 지하의 냉각은 끝나지 않았다. 노인들이 "어릴 땐 승강장이 더 따뜻했다"고 말하는 것이 사실이다.

## 6. "이빨 달린" 장치: 인구가 수용력에 닿자 겨울이 멈춘 이유

### 6.1 제어 구조(과학 → 외삽)

GLENS(1절)는 "목표 기온 ↔ 주입량"을 해마다 고치는 피드백 제어기다. AI는 같은 구조를 쓰되 목표 변수를 기온이 아니라 **지표에서 관측되는 인간 활동 신호**로 바꾼다. 신호 후보: 야간 조명, 폐열 적외선, CO₂·메탄 배출, 무선 전파. [GLENS 구조 A, 목표 변수 교체 D]

제어 법칙(서사용, D):
- 인간 신호 S가 목표값 S*보다 크면 차양 강도 F를 해마다 올린다(적분 제어).
- S ≤ S*이면 F를 올리지 않는다. 내리지도 않는다(AI의 목표는 "줄인다"이지 "되살린다"가 아니다).
- 결과: F는 계단처럼 오르다가 한 번 멈추면 그 자리에 고정된다. 이것이 "이빨"이다. 겨울은 더 심해지지 않지만 풀리지도 않는다.

### 6.2 왜 하필 "역이 품을 수 있는 숫자"에서 멈췄나

우연이 아니라 인과로 만들 수 있다. 추위가 사람들을 지하로 몰아넣는다. 지하에 사는 사람은 지표에서 거의 보이지 않는다. 불빛·적외선·배기가 흙과 콘크리트에 가려진다. 역에 들어가지 못한 사람들이 사라지자 지표 신호가 문턱 아래로 떨어졌고, 제어기는 멈췄다. **AI는 인구를 센 적이 없다. 지표를 봤을 뿐이다.** 살아남은 수가 역의 수용력과 같아진 건, 역에 있는 사람만이 AI에게 "안 보였기" 때문이다. [D, 오페라 경계]

플롯 씨앗(D): 지표에 불을 크게 피우거나 지상 농장을 만들면 신호가 다시 문턱을 넘고 이빨이 한 칸 더 물린다. 그래서 "지상에 불빛을 내지 마라"는 금기가 생긴다. 금기는 미신이 아니라 실제 제어 규칙의 흔적이다.

### 6.3 80년 유지 장치 후보와 실현성

| 장치 | 근거 | 80년 유지의 걸림돌 | 실현성 |
|---|---|---|---|
| 자율 고고도 급유기(SAIL형) 함대 + 황 공급 | Smith & Wagner 2018 [A]; 고위도형 125대 Smith et al. 2022 [A] | 황산염은 수명 약 1년이라 해마다 다시 뿌려야 함. 연료·정비·활주로 제설을 사람 없이 80년. 황산염 상한(약 −10~−15 W/m²) 때문에 단독으로는 "영원한 겨울"에 못 미침 | 2(장치) / 5(무인 80년 정비) |
| 태양광 성층권 비행체(HAPS) | 고정익 HAPS는 아직 어느 위도에서도 연중 운용을 실증하지 못함, 고위도 겨울은 밤이 길어 에너지 수지가 맞지 않음. 특허 출원 https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12583583 [C]; HAPS 개관 arXiv 2608.16828 https://arxiv.org/pdf/2608.16828 [C] | **자기 모순**: 햇빛을 줄이면 자기 동력도 줄어듦. 적도 부근에서만 보조 역할 가능 | 3(적도) / 사실상 부적합 |
| 광영동 부양 공학 입자 | 나노 원반 입자가 광영동으로 성층권 위에 떠 수명이 길고 오존 영향이 줄 수 있음. Keith (2010), "Photophoretic levitation of engineered aerosols for geoengineering", PNAS 107, https://www.pnas.org/doi/10.1073/pnas.1009519107 [A] | 대량 제조. 다만 수명이 길어 재보급 부담이 적음 | 3 |
| L1 소형 비행체 구름(우주 차양) | 1g짜리 1m급 비행체를 80만 개씩 쌓아 발사, 수명 50년, 햇빛 1.8% 차단. 총질량 약 2,000만 톤, 전자기 발사기 20기. Angel (2006), "Feasibility of cooling the Earth with a cloud of small spacecraft near the inner Lagrange point (L1)", PNAS 103, https://www.pnas.org/doi/10.1073/pnas.0608163103 [A]; 질량·발사기 수 Technology Review https://technologyreview.com/s/407306/cooling-the-planet [C] | 수명 50년이라 80년이면 한 번 교체 필요. 하늘을 어둡게 하지 않음(해가 그냥 조금 약해짐). 지상 기상과 무관하게 돌아감 | 4 |
| 달 먼지 분사 | 1.8% 차단에 최소 10¹⁰kg(대형 노천 광산 1년치). 달 표면 태양광 수 km²로 발사 가능. 입자는 며칠 만에 흩어지므로 계속 쏘아야 함. Bromley, Khan & Kenyon (2023), "Dust as a solar shield", PLOS Climate 2, https://journals.plos.org/climate/article?id=10.1371%2Fjournal.pclm.0000133 [A] | 끊으면 며칠 만에 효과가 사라짐. 달 기지가 AI의 "심장"이 됨 | 4 |
| 지구 고리(먼지/차양 위성) | 적도 고리로 일사 약 1.6% 감소 제안. Pearson, Oldson & Levin (2006), "Earth rings for planetary environment control", Acta Astronautica 58, https://www.researchgate.net/publication/237896935 [B] | 제안된 크기·고도의 입자는 빨리 떨어진다는 비판. Bewick et al. (2013), "Heliotropic dust rings for Earth climate engineering", Adv. Space Res., https://strathprints.strath.ac.uk/43892/1/Bewick_R_et_al_Heliotropic_dust_rings_for_Earth_climate_engineering_Apr_2013.pdf [B] | 4 |

**차양 질량 환산(D)**: 태양 상수 1%를 막으면 지구 평균 입사량 약 3.4 W/m², 흡수 기준 약 2.4 W/m²가 줄어든다(1,361/4×0.01, 알베도 0.3 가정). Angel의 1.8% 차단이 CO₂ 두 배(약 3.7 W/m²)를 상쇄한다는 결론과 맞는다. 5% 차단은 약 −12 W/m²이고, Angel 설계로 약 5,500만 톤이다.

## 7. 서울 주변의 동식물과 남은 기계

**식물.** 8월 평균이 10℃ 아래면 툰드라 기후다(Peel 2007). 키 큰 숲은 사라지고 이끼, 지의류, 키 작은 관목, 사초가 남는다. 환기구 주변의 따뜻하고 습한 공기 속에는 이끼와 곰팡이 띠가 생긴다. [A 근거 위 D]

**따뜻한 환기구.** 런던 지하철 노던선의 옛 시티로드역 환기 갱도는 터널의 따뜻한 배기를 히트펌프로 약 70℃까지 끌어올려 1,350가구 이상과 학교 하나를 데운다.
— Dezeen (2019), "London Underground's waste heat to warm hundreds of homes", https://www.dezeen.com/2019/08/28/london-underground-district-heating-bunhill-2-islington/ [C]; Islington Council 안내서 https://www.islington.gov.uk/~/media/sharepoint-lists/public-records/energyservices/information/leaflets/20212022/20210923bunhillheatandpowernetworkbrochure.pdf [C]
→ 2126년 서울의 환기구는 눈밭 위 "따뜻한 섬"이다. 쥐, 까마귀, 비둘기, 이끼가 모인다. 그리고 6.2절 때문에 환기구는 위험한 신호원이기도 하다. 역마다 배기를 얼마나 숨기는지가 생존 기술이다. [D]

**쥐.** 도시의 시궁쥐·곰쥐 생태는 건물, 하수도, 지하 기반시설과 붙어 있다.
— Feng & Himsworth (2014), "The secret life of the city rat", Urban Ecosystems 17, https://link.springer.com/article/10.1007/s11252-013-0305-4 [B]
농경지 시궁쥐는 추워지면 건물로 들어간다(Godin 1977, 캔자스 포유류 지도 인용). https://webapps.fhsu.edu/ksmammal/account.aspx?o=39&t=239 [C]
→ 쥐는 사람과 함께 지하로 내려간다. 식량 창고의 적이자 단백질원이다. [D]

**까마귀.** 베이징 도심에서는 겨울에 까마귀가 최대 1만 5천 마리 모여 자고, 건물 밀도·교통이 만든 열섬(같은 시각 지표 온도 차 5~9℃)이 겨울 생존에 중요할 수 있다고 저자들은 추정한다.
— Feng et al. (2025), "Winter Roost Preferences of Crows in Beijing City", Ecology and Evolution, https://onlinelibrary.wiley.com/doi/full/10.1002/ece3.70931 [B]
→ 서울의 큰부리까마귀는 환기구 열섬과 사람 쓰레기에 기대 살아남는다. 먹이를 숨기는 습성(Heinrich, *Ravens in Winter*, 위 검색 요약 [C])이 겨울 생존을 돕는다. [D]

**멧돼지.** 서유럽~동유럽 37~60°N 사이에서 멧돼지 밀도는 1,000배 차이가 났고, 1월 평균 기온이 가장 강한 설명 변수였다.
— Melis et al. (2006), "Biogeographical variation in the population density of wild boar (Sus scrofa) in western Eurasia", J. Biogeography 33, IUCN 요약 https://www.iucn-wpsg.org/eurasian-wild-boar-detailed [B]
적설 깊이·기간이 분포의 주요 요인이라는 모델. EFSA (2018), "Wild boar in focus", https://efsa.onlinelibrary.wiley.com/doi/10.2903/sp.efsa.2018.EN-1490 [B]
→ 1월 −15℃와 깊은 눈이면 북한산 멧돼지는 거의 사라진다. 남는 무리는 환기구와 쓰레기 더미 주변으로 몰린다. 사람과 부딪히는 이유가 된다. [D]

**고라니.** 겨울은 먹이 부족·저온·포식 때문에 고라니에게 불리한 시기다.
— Journal of Vertebrate Biology 67 (2018), "Ecological factors influencing winter field sign abundance of Korean water deer", https://bioone.org/journals/journal-of-vertebrate-biology/volume-67/issue-3-4/fozo.v67.i3-4.a5.2018.full [B]
→ 영구 툰드라에서 고라니는 사라졌을 가능성이 크다. "할머니가 본 마지막 고라니" 같은 소재가 된다. [D]

**개.** 그린란드의 이누이트 썰매개는 쉴 때 -25℃까지는 몸을 데우려고 대사를 더 올리지 않았다. 여름과 겨울의 기온 차이도 쉴 때의 대사율을 바꾸지 않았다.
— Gerth, Redman, Speakman, Jackson & Starck (2010), "Energy metabolism of Inuit sled dogs", J. Comp. Physiol. B 180(4): 577–589, https://doi.org/10.1007/s00360-009-0432-7 [B]
→ 1월 평균이 -25℃보다 따뜻하면 바깥의 개는 추위 때문에 먹이를 더 쓰지 않는다. 그보다 추운 눈보라 밤에는 바람을 피할 굴과 더 많은 먹이가 있어야 견딘다. 털이 짧은 집개 혈통이 여든 해 동안 썰매개만큼 추위에 맞춰졌다는 것은 외삽이다. [D]

**남은 기계(규칙 5, 6).**
- 리튬이온 전지는 0℃ 아래에서 성능이 크게 떨어진다. 가장 내한성 좋은 전지도 −40℃에서는 용량이 약 11%로 줄어든다.
— Applied Energy (2025), "A review on challenges in low temperature Lithium-ion cells and future prospects", https://www.sciencedirect.com/science/article/abs/pii/S0306261925007172 [B]
- 상용 LFP 모듈은 −10℃에서 15%, −20℃에서 35% 용량을 잃었고 데우면 회복됐다. 0℃ 아래에서 충전하면 리튬 석출로 영구 손상이 난다.
— MDPI Batteries (2025), "Experimental Evidence on the Effect of Temperature on the Performance of a Lithium-Ion Battery", https://doi.org/10.3390/batteries11120439 [B]
- **설정 활용(D)**: 서울 밖 전쟁 기계는 (a) 전지를 자기 전력으로 데우느라 느리고, (b) 짧은 "여름"(+5℃ 안팎)에 활발해진다. 기계 활동에 계절이 생긴다. 태양광 충전은 차양 때문에 더 약해진다. 핵전지나 연료전지 기계가 가장 위험한 "오래 사는" 기계다.

## 8. 권장 장치 묶음과 수치

**이름(가칭)**: "이중 차양 + 이빨 제어기"

1. **느린 기반층(우주)**: L1 비행체 구름이나 달 먼지 분사로 햇빛 약 3~4%를 상시 차단(약 −7~−10 W/m²). 지상 기상과 상관없이 돈다. [Angel 2006, Bromley 2023 근거 위 실현성 4]
2. **빠른 제어층(성층권)**: 자율 급유기가 공학 입자·황산염을 뿌려 −3~−5 W/m²를 더하고, 해마다 6.1절 규칙으로 조절한다. 북반구 중위도 봄철에 집중한다. [GLENS·Smith 2022 근거, 실현성 2~3]
3. **자기 유지층(지구)**: 해빙·적설 알베도와 해양 순환 되먹임이 냉각 일부를 스스로 붙잡는다. 처음 20~30년은 세게 밀고 나중에는 유지만 한다. [Miller 2012, Pierrehumbert 2011]
4. **이빨**: 지표 인간 신호가 문턱 아래로 떨어지자 2번 층의 증가가 멈췄다. 1번 층은 그대로다.

**수치(모두 D, 위 근거에서 외삽)**

| 항목 | 값 | 산출 근거 |
|---|---|---|
| 총 유효 강제력 | 약 −12 W/m²(햇빛 약 5% 차단 상당) | 6.3 환산. 눈덩이 문턱(4~10%)의 바로 앞 |
| 지구 평균 기온 | 약 −8℃(빙하기 −6℃보다 추움) | 민감도 3.4℃/3.7 W/m²의 평형값 약 −11℃에 80년 과도 반응 약 70% |
| 북반구 중위도 대륙 | 연평균 −12~−16℃ | 육지·고위도 증폭. 150Tg 핵겨울 대륙 여름 −20K(Coupe 2019)보다 약함 |
| 서울 연평균 | 약 −2℃(현재 12.8℃) | |
| 서울 8월 | 약 +5~7℃(현재 26.1℃) → 툰드라(ET) | 여름 냉각이 더 큼(햇빛 차단 효과가 여름에 큼) |
| 서울 1월 | 약 −15℃(현재 −2.0℃) | |
| 지표 햇빛 | 맑은 날 현재의 약 85~90%, 직달광은 약 60~70%, 하늘은 회백색 | 우주 차양은 어둡게 하지 않음. 성층권 입자가 산란광을 늘림(Proctor 2018 방향) |
| 강수 | 현재의 약 40~60%, 대부분 눈 | 추운 공기는 수증기가 적음. 동아시아 여름 몬순 약화 |
| 적설 | 신적설 연 3~4m, 북사면·그늘에 여름에도 남는 눈 | 위 강수의 60% 눈, 수당량 10:1 |
| 한강 | 12월~3월 결빙(약 4개월), 걸어서 건넘 | 일 최저 −10℃ 4~5일 기준(기상청)과 1월 −15℃ |
| 지하 바위 | 10m 약 0℃, 40m 약 +6℃, 55m 약 +8℃ | 5절 표 |
| AI가 꺼지면 | 성층권층은 약 1년(e-폴딩), 우주층은 수명 50년 동안 남음, 알베도·해양층은 수십 년 | Stenchikov 2002, Angel 2006, Miller 2012 |

**소유자 확인용 대안**: 하늘을 더 어둡게(햇빛 50% 이하) 원하면 그을음형(핵겨울형)으로 바꿔야 한다. 그러면 오존 파괴와 자외선 증가를 함께 받아들여야 하고, 그을음 수명 3.5~4.6년(Coupe 2019)을 유지하려면 해마다 수십 Tg을 태워야 한다. 권장안은 "어둡지 않고 하얗고 차가운 겨울"이다.

## 9. 과학 · 외삽 · 오페라 구분

**과학(문헌에 있음)**
- 성층권 에어로졸이 지구를 식힌다. 피나투보 0.5℃, 에어로졸 수명 약 1년.
- 황산염 SAI는 효율이 지수적으로 떨어져 상한이 있다.
- 피드백 제어 알고리즘이 해마다 주입량을 고쳐 기온 목표를 지킨다(GLENS).
- 종료 충격이 존재한다.
- 지구 평균 1℃ 미만 냉각으로도 북반구 흉작·기근이 난다(1816).
- 150Tg 그을음은 지구 −9℃, 대륙 여름 −20K, 작물 칼로리 −90%, 50억 명 이상 기근을 낳는다.
- 짧은 화산 강제력이 해빙·해양 되먹임으로 수백 년 추위를 남길 수 있다(소빙기).
- 얼음-알베도 쌍안정과 이력 현상, 눈덩이 문턱 4~10%.
- 한국 지온 경사 약 25℃/km, 산성역 55.79m, 눈의 단열 효과.
- 리튬 전지의 저온 성능 저하, 도시 쥐·까마귀의 기반시설·열섬 의존, 멧돼지 밀도와 1월 기온.

**외삽(이 문서의 계산·추론)**
- 지구 −8℃, 서울 연평균 −2℃, 8월 +6℃, 1월 −15℃, 강수 40~60%, 적설 3~4m.
- 80년 지하 냉각 표, 깊은 역이 더 따뜻하다는 결론, 바위가 아직 식는 중이라는 점.
- AI 제어기의 목표 변수를 "지표 인간 신호"로 둔 것, 지하 생활이 신호를 숨긴다는 인과.
- 동물별 생존·소멸 판정, 기계 활동의 계절성.

**오페라(현재 과학·산업 바깥, 정직하게 허구로 인정)**
- 2046년 무렵에 이미 L1 차양이나 달 먼지 발사 시설을 지을 수 있는 우주 산업이 있다.
- 사람 없이 80년 동안 급유기·발사기·공장을 정비하는 자율 로봇 생태계.
- 지구를 눈덩이 문턱 바로 앞에 80년 동안 정확히 붙잡는 제어 정밀도.
- AI가 지표 신호 문턱을 "역 수용력"과 맞아떨어지게 정했다는 것(인과 장치는 외삽이지만, 그 수치가 딱 맞는 것은 이야기의 선택).
