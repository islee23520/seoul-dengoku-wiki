# Citation verbatim check — statistics / systems / edge-case lanes

Fetched 2026-09-15. Each row is one harvested record with a `quote` field. NOT_FOUND records (no quote) were skipped. A match is a case-sensitive substring of the fetched URL body (HTML source, visible text, or decoded MediaWiki API `wikitext`). MISMATCH is reported whenever the quote string is not present verbatim.

| record id | lane | url | result | actual text if MISMATCH |
|---|---|---|---|---|
| total-surnames-2015 | a1-census-totals | https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8&prop=wikitext&format=json | VERBATIM_OK |  |
| surnames-with-hanja-2015 | a1-census-totals | https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8&prop=wikitext&format=json | VERBATIM_OK |  |
| bon-gwan-2015 | a1-census-totals | https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8&prop=wikitext&format=json | VERBATIM_OK |  |
| survey-method-2015 | a1-census-totals | https://ko.wikipedia.org/w/api.php?action=parse&page=%EC%9D%B8%EA%B5%AC%EC%A3%BC%ED%83%9D%EC%B4%9D%EC%A1%B0%EC%82%AC&prop=wikitext&format=json | VERBATIM_OK |  |
| census-2015-context | a2-surname-population | https://namu.wiki/w/%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8 | MISMATCH | 2015년 인구주택총조사 전수부문에 따르면 5,582개의 성씨가 있는 것으로 조사되어 지난 통계에 비해 급증하였는데, 2000년 430개에 비해 12배나 증가했다. |
| national-share-kim | a2-surname-population | https://namu.wiki/w/%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8 | MISMATCH | 전국21.5114.708.434.704.332.372.122.052.001.66 |
| no-hanja-driver | a4-census-history | https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8&prop=wikitext&format=json | VERBATIM_OK |  |
| bon-gwan-data-caveat | a4-census-history | https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8&prop=wikitext&format=json | VERBATIM_OK |  |
| ohaeng-order | b1-ohaeng | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| element-in-radical | b1-ohaeng | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| worked-example-table | b1-ohaeng | https://ko.wikipedia.org/wiki/항렬 | MISMATCH | !세대(世代) !!32세 !!33세 !!34세 !!35세 !!36세 !!37세 !!38세 !!39세 !!40세 !!41세\n\|-\n!항렬(行列)\n\|(木)변\|\|(火)변\|\|(土)변\|\|(金)변\|\|(水)변\|\|(木)변\|\|(火)변\|\|(土)변\|\|(金)변\|\|(水)변 |
| sipgan-sequence | b2-sipgan | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| substitution-convention | b2-sipgan | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| sipiji-hangryeol-mapping | b3-sipiji | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| sipiji-to-char-1 | b3-sipiji | https://ko.wikipedia.org/wiki/항렬 | MISMATCH | \|○존(存)</br>○학(學)\|\|병(秉)○</br>용(庸)○\|\|연(演)○\|\|○경(卿)\|\|진(振)○\|\|○범(範)\|\|○년(年)\|\|○래(來)\|\|중(重)○\|\|유(楢)○\|\|○성(成)\|\|○원(遠)  then a separate row  !지지(地支) \|子\|\|丑\|\|寅\|\|…  (hangnyeol cell is not joined to 子 with a single \| ) |
| jiji-wiki-12branches | b3-sipiji | https://ko.wikipedia.org/wiki/지지_(역법) | MISMATCH | 지지(地支) 또는 십이지(十二支)는 천간과 함께 간지를 이루며, 자(子), 축(丑), 인(寅), 묘(卯), 진(辰), 사(巳), 오(午), 미(未), 신(申), 유(酉), 술(戌), 해(亥)를 말한다. |
| sug1 | b4-sugyo | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| sug2 | b4-sugyo | https://ko.wikipedia.org/wiki/항렬 | MISMATCH | \|병(丙)○\|\|중(重)○\|\|태(泰)○\|\|영(寧)○\|\|오(五)○\|\|혁(赫)○\|\|순(純)○\|\|용(容)○\|\|구(九)○\|\|승(升)○  then a separate row  !숫자(數字) \|一\|\|二\|\|三\|\|四\|\|五\|\|六\|\|七\|\|八\|\|九\|\|十  (no '\|\|...\|\|' ellipsis joining the two rows) |
| sug4 | b4-sugyo | https://encykorea.aks.ac.kr/Article/E0023741 | MISMATCH | Page title/og:title is 본관 (한국민족문화대백과사전 Article/E0023741). Body discusses 성(姓)의 출자지/시조의 거주지. The string 항렬 does not appear anywhere in the fetched HTML. |
| b5-jari-01 | b5-jari | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| b5-jari-02 | b5-jari | https://ko.wikipedia.org/wiki/항렬 | MISMATCH | 이름을 지을 때 항렬자의 위치는 문중(종친회)에서 정한 위치를 따라야 하는 것이 원칙이다. |
| hangnyeol-sejuse-definition | b6-sesu | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| se-vs-dae-difference | b6-sesu | https://ko.wikipedia.org/wiki/족보 | VERBATIM_OK |  |
| se-vs-dae-detailed | b6-sesu | https://ko.wikipedia.org/wiki/족보 | MISMATCH | 정확히 말하자면, 대는 나와 아버지의 “사이”가 1대이며, 아버지와 할아버지의 “사이”가 1대이고 |
| same-sesu-different-age | b6-sesu | https://ko.wikipedia.org/wiki/족보 | MISMATCH | 항렬은 장손 계통일수록 낮고 지손 계통일수록 높아서, 자기보다 나이가 적어도 할아버지뻘이 되는 경우도 있어 존댓말을 쓰는 경우도 있다. |
| q1-hangnyeol-issuer | b7-banpo | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| q3-bunpa-ohaeng | b7-banpo | https://ko.wikipedia.org/wiki/항렬 | MISMATCH | 예시 1 김해 김씨 삼현파\u00a0: 오행상생법(五行相生法)에 따라 목화토금수(木火土金水)의 순서대로 지음  (colon is preceded by NBSP U+00A0, not ASCII space) |
| genealogy-hangnyeol-001 | b8-women-modern | https://ko.wikipedia.org/wiki/족보 | VERBATIM_OK |  |
| hangnyeol-siblings-001 | b8-women-modern | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| hangyeol-substitute-1 | b9-substitute | https://ko.wikipedia.org/wiki/항렬 | VERBATIM_OK |  |
| hangyeol-substitute-2 | b9-substitute | https://ko.wikipedia.org/wiki/항렬 | MISMATCH | 안동 권씨의 36대손의 항렬은 ‘赫(혁)’이지만 예비 항렬자로 奇(기), 景(경), 英(영)을 두었다. |
| gaemyeong-legal-1 | b9-substitute | https://ko.wikipedia.org/wiki/개명 | VERBATIM_OK |  |
| gaemyeong-legal-2 | b9-substitute | https://ko.wikipedia.org/wiki/개명 | MISMATCH | 개명을 하기 위해서는 법적으로 구속력이 있는 장부인 가족관계등록부를 변경하는 절차가 필요하므로, 주민등록상 주소지를 관할하는 가정법원 또는 지법[1](가정법원이 없는 곳)의 허가를 받아야 하고 |
| gaemyeong-legal-3 | b9-substitute | https://ko.wikipedia.org/wiki/개명 | VERBATIM_OK |  |
| 남궁 | d1-boksung | https://ko.wikipedia.org/wiki/한국의_성씨 | VERBATIM_OK |  |
| 황보 | d1-boksung | https://ko.wikipedia.org/wiki/한국의_성씨 | VERBATIM_OK |  |
| hwasan-yi-clan-vietnam | d2-gwihwa | https://ko.wikipedia.org/wiki/화산_이씨 | VERBATIM_OK |  |
| hwasan-yi-population | d2-gwihwa | https://ko.wikipedia.org/wiki/화산_이씨 | MISMATCH | 인구(2000년)1,775명 |
| deoksu-jang-clan-uyghur | d2-gwihwa | https://ko.wikipedia.org/wiki/덕수_장씨 | MISMATCH | 덕수장씨(德水張氏)의 시조 장순룡(張舜龍)은 본래 위구르계 사람으로 충렬왕 때 고려에 귀화했다. 그는 원나라 세조 때 필도치(必闍赤)라는 벼슬을 지낸 장백창(張伯昌)의 아들이다. |
| deoksu-jang-population | d2-gwihwa | https://ko.wikipedia.org/wiki/덕수_장씨 | MISMATCH | 인구(2015년)24,185명 |
| cheonghae-yi-population | d2-gwihwa | https://ko.wikipedia.org/wiki/청해_이씨 | MISMATCH | 인구(2000년)12,002명 (329위) |
| yeonan-in-population | d2-gwihwa | https://ko.wikipedia.org/wiki/연안_인씨 | VERBATIM_OK |  |
| 2015-nonhanja-count | d3-nonhanja | https://ko.wikipedia.org/wiki/한국의_성씨 | VERBATIM_OK |  |
| examples-new-surnames | d3-nonhanja | https://ko.wikipedia.org/wiki/한국의_성씨 | VERBATIM_OK |  |
| examples-single-person-surnames | d3-nonhanja | https://ko.wikipedia.org/wiki/한국의_성씨 | VERBATIM_OK |  |
| dueum-mech-1 | d4-dueum | https://ko.wikipedia.org/wiki/두음_법칙 | VERBATIM_OK |  |
| dueum-surname-variants | d4-dueum | https://ko.wikipedia.org/wiki/두음_법칙 | VERBATIM_OK |  |
| repeal-1997-ccourt | d5-dongseong | https://ko.wikipedia.org/wiki/동성동본 | VERBATIM_OK |  |
| repeal-2005-civil-law | d5-dongseong | https://ko.wikipedia.org/wiki/동성동본 | VERBATIM_OK |  |
| replacement-blood-affinity | d5-dongseong | https://ko.wikipedia.org/wiki/동성동본 | VERBATIM_OK |  |

## Notes on mismatches

- **census-2015-context:** Harvest inserted a space: `5,582개 의`. Live namu.wiki has `5,582개의` (no space).
- **national-share-kim:** Harvest joined table cells with ASCII spaces. Live namu.wiki concatenates the cells: `전국21.5114.70…`.
- **worked-example-table:** Wikitext table is split across newlines (`\n|-\n`) so the single-line harvest string is not a substring of the HTML page.
- **sipiji-to-char-1:** Hangnyeol cells and 지지 labels are separate table rows; harvest glued `○존(存)</br>○학(學)|子`.
- **jiji-wiki-12branches:** Page lists the 12 branches as `자(子), 축(丑), …` not the compacted string `子丑寅卯辰巳午未申酉戌亥`.
- **sug2:** Harvest invented `||...||` between the 항렬 row and the 숫자 row.
- **sug4:** https://encykorea.aks.ac.kr/Article/E0023741 is the **본관** article, not 항렬. HTTP 200. String `항렬` absent.
- **b5-jari-02:** Typo `이름들을` vs live `이름을`.
- **se-vs-dae-detailed:** ASCII `"사이"` vs live curly quotes `“사이”`.
- **same-sesu-different-age:** Harvest truncated; live continues `경우도 있어 존댓말을 쓰는 경우도 있다.`
- **q3-bunpa-ohaeng:** ASCII space before `:` vs NBSP U+00A0 before `:`.
- **hangyeol-substitute-2:** ASCII `'赫(혁)'` vs live curly `‘赫(혁)’`.
- **gaemyeong-legal-2:** Live inserts footnote `[1](가정법원이 없는 곳)` after `지법`.
- **hwasan-yi-population / deoksu-jang-population / cheonghae-yi-population:** Infobox visible text has no space after the year label: `인구(2000년)1,775명` etc.
- **deoksu-jang-clan-uyghur:** Harvest `위구르 계`; live `위구르계`.

Lanes with only NOT_FOUND records and therefore not checked: a3-bongwan-population, a5-kostat-release.

TOTALS checked=50 verbatim_ok=33 mismatch=17 url_dead=0
