# Citation verbatim check — clan harvest lanes (k01–k10)

Fetched 2026-09-15. Each row is one harvested record with a `quote` field. NOT_FOUND records (no quote) were skipped. A match is a case-sensitive substring of the fetched URL body (HTML source, visible text, or decoded MediaWiki API `wikitext`). MISMATCH is reported whenever the quote string is not present verbatim, including spacing-only differences; live text is then recorded.

Preferred every quote-bearing record that states 항렬자/세수 (im/han/oh/shin/hwang hangnyeol, hangryeol-wiki-ref, sim-hangryeol), then population/본관 quotes across remaining lanes. Lane k05-clan has only NOT_FOUND records with no `quote`/`url` and was not checked.

| record id | lane | url | result | actual text if MISMATCH |
|---|---|---|---|---|
| im-hangnyeol | k03-clan | https://ko.wikipedia.org/w/api.php?action=parse&page=%EB%82%98%EC%A3%BC%20%EC%9E%84%EC%94%A8&prop=wikitext&format=json | VERBATIM_OK |  |
| han-hangnyeol | k03-clan | https://ko.wikipedia.org/w/api.php?action=parse&page=%EC%B2%AD%EC%A3%BC%20%ED%95%9C%EC%94%A8&prop=wikitext&format=json | VERBATIM_OK |  |
| oh-hangnyeol | k03-clan | https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%B4%EC%A3%BC%20%EC%98%A4%EC%씨&prop=wikitext&format=json | URL_DEAD | MediaWiki API HTTP 200 missingtitle: The page you specified doesn't exist. Harvest URL truncates 해주 오씨 as %EC%씨 (not %EC%94%A8). |
| shin-hangnyeol | k04-clan | https://ko.wikipedia.org/w/index.php?title=평산_신씨 | MISMATCH | LIVE (HTML cell spacing): 항렬자 [ 편집 ] 대동항렬 (시조로 1세) 30세 31세 32세 33세 34세 35세 36세 37세 38세 39세 40세 41세 42세 43세 44세 45세 46세 47세 48세 49세 50세 51세 52세 53세 54세 55세 56세 57세 58세 59세 60세 61세 재(在) 口석 |
| hwang-hangnyeol | k04-clan | https://ko.wikipedia.org/w/index.php?title=창원_황씨 | MISMATCH | LIVE (HTML cell spacing): 항렬자 [ 편집 ] 공희공파(중시조로 1세) 18세 19세 20세 21세 22세 23세 24세 25세 26세 27세 28세 29세 30세 31세 32세 33세 34세 35세 36세 37세 한(漢) 口희(熙) 덕(德) 口주(周) 기(基) 口우(祐) 종(鍾) 口익(益) 인(寅) 口식(植) 용(容) 口환(煥) 교(敎) 口규(圭) 진( |
| hangryeol-wiki-ref | k07-clan | https://ko.wikipedia.org/wiki/항렬 | MISMATCH | 항렬(行列)은 같은 씨족 안에서 상하의 차례를 분명히 하기 위하여 만든 서열이다. 항렬은 아무나 마음대로 정하는 것이 아니고 문중에서 족보를 편찬할 때 일정한 대수의 항렬자(行列字)와 그 용법을 정해 놓아 후손들이 이에 따르도록 하는 것이 관례로 되어있다. |
| sim-hangryeol | k08-clan | https://womendiary.tistory.com/119 | VERBATIM_OK |  |
| k10-summary-note | k10-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | 2015년 대한민국 인구주택총조사 5,582개 한자 표기 가능 성씨 : 1,507개 한자 표기 불가 성씨 : 4,075개 대한민국의 성씨별 인구 다음 목록은 2015년 기준 5명 이상의 인구에 해당되는 한자 성씨 중 대한민국의 건국 시부터 존재했다고 확인되는 것만을 집계한 것이다. |
| kim-bon-gwan | k01-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | LIVE (table-cell spacing): 1 김 (金) 10,689,959 9,925,949 8,785,341 김해 (金海), 경주 (慶州), 광산 (光山), 상락 (上洛), 의성 (義城), 강릉 (江陵), 청풍 (淸風) |
| kim-anchor-population | k01-clan | https://ko.wikipedia.org/wiki/김해_김씨 | MISMATCH | LIVE (infobox spacing): 인구(2015년) 4,456,700명 (1위) 비고 김해김씨 |
| lee-bon-gwan | k01-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | LIVE (table-cell spacing): 2 이 (李) 7,307,068 6,794,637 5,985,056 전주 (全州), 경주 (慶州), 성주 (星州), 광주 (廣州), 연안 (延安), 전의 (全義), 한산 (韓山) |
| lee-anchor-population | k01-clan | https://ko.wikipedia.org/wiki/전주_이씨 | MISMATCH | LIVE (infobox spacing): 인구(2015년) 2,631,643명 (3위) |
| park-anchor-population | k01-clan | https://ko.wikipedia.org/wiki/밀양_박씨 | MISMATCH | LIVE (infobox spacing): 인구(2015년) 3,168,084명 (2위) |
| choi-anchor-population | k01-clan | https://ko.wikipedia.org/wiki/경주_최씨 | MISMATCH | LIVE (infobox spacing): 인구(2015년) 1,027,848명 (7위) |
| jeong-bongwan-largest | k02-clan | https://ko.wikipedia.org/wiki/동래_정씨 | VERBATIM_OK |  |
| jo-bongwan-largest | k02-clan | https://ko.wikipedia.org/wiki/한양_조씨 | VERBATIM_OK |  |
| jang-population | k03-clan | https://ko.wikipedia.org/w/api.php?action=parse&page=%EC%9D%B8%EB%8F%99%20%EC%9E%A5%EC%94%A8%20(%EC%83%81%EC%9E%A5%EA%B5%B0%EA%B3%84)&prop=wikitext&format=json | VERBATIM_OK |  |
| im-population | k03-clan | https://ko.wikipedia.org/w/api.php?action=parse&page=%EB%82%98%EC%A3%BC%20%EC%9E%84%EC%94%A8&prop=wikitext&format=json | VERBATIM_OK |  |
| han-population | k03-clan | https://ko.wikipedia.org/w/api.php?action=parse&page=%EC%B2%AD%EC%A3%BC%20%ED%95%9C%EC%94%A8&prop=wikitext&format=json | VERBATIM_OK |  |
| oh-population | k03-clan | https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%B4%EC%A3%BC%20%EC%98%A4%EC%94%A8&prop=wikitext&format=json | VERBATIM_OK |  |
| seo-bon-gwan-2015 | k04-clan | https://ko.wikipedia.org/w/index.php?title=달성_서씨 | VERBATIM_OK |  |
| shin-bon-gwan-2015 | k04-clan | https://ko.wikipedia.org/w/index.php?title=평산_신씨 | VERBATIM_OK |  |
| kwon-bon-gwan-2015 | k04-clan | https://ko.wikipedia.org/w/index.php?title=안동_권씨 | VERBATIM_OK |  |
| hwang-bon-gwan-2015 | k04-clan | https://ko.wikipedia.org/w/index.php?title=창원_황씨 | VERBATIM_OK |  |
| ko-g01-bongwan | k06-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | 22 고 (高) 471,396 435,839 384,061 제주 (濟州), 장흥 (長興), 개성 (開城), 횡성 (橫城) |
| bae-bongwan-main | k07-clan | https://ko.wikipedia.org/wiki/성주_배씨 | MISMATCH | 인구(2015년) 148,672명 성주 배씨 (星州裵氏)는 경상북도 성주군 을 본관으로 하는 한국의 성씨 이다. (no 약 157,000명; 시조 on page is 배위준(裵位俊)) |
| baek-bongwan-main | k07-clan | https://ko.wikipedia.org/wiki/수원_백씨 | MISMATCH | 인구(2015년) 354,428명 수원 백씨 (水原白氏)는 경기도 수원시 를 본관 으로 하는 한국의 성씨 이다. (no 약 120,000명) |
| heo-bongwan-main | k07-clan | https://ko.wikipedia.org/wiki/양천_허씨 | MISMATCH | 인구(2015년) 149,505명 비고 양천 허씨 대종회 양천 허씨 (陽川許氏)는 서울특별시 강서구 · 양천구 를 관향으로 하는 한국의 성씨 이다. (no 약 220,000명) |
| yu-bongwan-main | k07-clan | https://ko.wikipedia.org/wiki/기계_유씨 | MISMATCH | 인구(2015년) 139,073명 비고 기계유씨 대종회 기계 유씨 (杞溪兪氏)는 경상북도 포항시 북구 기계면 을 본관으로 하는 한국의 성씨 이다. Harvest used 機溪 and “수만 명”; live hanja is 杞溪 and a numeric 2015 count. |
| nam-bongwan-pop-2015 | k08-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | 31 남 (南) 275,648 257,178 222,269 의령 (宜寧), 영양 (英陽), 고성 (固城) — 222,269 is the 1985 column, not a 2015 figure; harvest omitted 2015/2000 columns and spaces inside 남 (南). |
| sim-bongwan-pop-2015 | k08-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | 32 심 (沈) 271,749 252,255 219,741 청송 (靑松), 삼척 (三陟), 풍산 (豊山), 부유 (富有) — no 240,768명. |
| no-bongwan-pop-2015 | k08-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | 33 노 (盧) 256,238 220,354 196,285 광주 (光州), 교하 (交河), 풍천 (豊川), 장연 (長淵) — harvest ellipsis “노(盧) ... 교하, 광주” is not page text. |
| ha-bongwan-pop-2015 | k08-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | 35 하 (河) 230,481 209,756 184,651 진주 (晉州) — harvest “하(河) 진주(晉州)” omits spaces and the three census counts; 진주 (晉州) also appears on the 정/강 rows. |
| k09-gwak-bongwan | k09-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | 36 곽 (郭) 203,188 187,322 163,433 현풍 (玄風), 청주 (淸州) — no string 현풍 곽씨 125,018. |
| k09-seong-bongwan | k09-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | 37 성 (成) 199,124 184,555 163,565 창녕 (昌寧) — no string 창녕 성씨 167,903. |
| k09-cha-bongwan | k09-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | 38 차 (車) 194,782 180,589 159,680 연안 (延安) — no string 연안 차씨 82,411. |
| k09-ju-bongwan | k09-clan | https://ko.wikipedia.org/wiki/한국의_성씨 | MISMATCH | 39 주 (朱) 194,766 176,232 153,508 신안 (新安), 능성 (綾城), 나주 (羅州) — no string 신안 주씨 65,308. |
| k10-woo-bongwan | k10-clan | https://ko.wikipedia.org/wiki/단양_우씨 | VERBATIM_OK |  |

TOTALS checked=38 verbatim_ok=14 mismatch=23 url_dead=1
