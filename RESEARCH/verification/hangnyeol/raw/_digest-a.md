# Digest A — 2015 census surname and 본관 statistics

Lanes digested: 5. Missing input files: 0.
Scope: only `/tmp/ulw-hangnyeol/raw/a1-census-totals.md` … `a5-kostat-release.md`. No new research. Every URL below is copied from those files.

## 1. Input inventory

| lane id | file | exists | total records | NOT_FOUND records |
| --- | --- | --- | ---: | ---: |
| a1 | a1-census-totals.md | yes | 7 | 1 |
| a2 | a2-surname-population.md | yes | 6 | 1 |
| a3 | a3-bongwan-population.md | yes | 6 | 6 |
| a4 | a4-census-history.md | yes | 7 | 2 |
| a5 | a5-kostat-release.md | yes | 2 | 2 |
| **total** | | **5 yes / 0 no** | **28** | **12** |

Record = one `###` heading in the source file. NOT_FOUND = a claim line that begins `NOT_FOUND`.

## 2. Consolidated facts

Facts below are only the found records. Source labels (`a1/…`) are the record ids from the input files. Accessed dates and URLs are copied verbatim.

### Surname counts (2015)

- **Total surnames, including naturalised:** 5,582.
  - a1/`total-surnames-2015` (위키백과가 인용한 통계청 자료): 2015년 인구주택총조사는 귀화로 생긴 성씨까지 합해 성씨 5,582개를 조사했다.
    url: `https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8&prop=wikitext&format=json`
    accessed: 2026-09-16
    quote: `2015년 [[대한민국 통계청]]의 [[인구주택총조사]] 결과 외국에서 [[귀화]]하여 생긴 성씨까지 합하면 5,582개의 성씨가 있는 것으로 조사되었다.`
  - a4/`surname-count-2015` (한국어 위키백과가 통계청 조사 결과로 서술한 내용): same 5,582 figure and same quote.
    url: `https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8&prop=wikitext&format=json`
    accessed: 2026-09-16
  - a2/`census-2015-context` (나무위키 aggregator wiki): 2015년 인구주택총조사 **전수부문**에서 5,582개의 성씨가 조사되었다.
    url: `https://namu.wiki/w/%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8`
    accessed: 2026-09-16
    quote: `2015년 인구주택총조사 전수부문에 따르면 5,582개 의 성씨가 있는 것으로 조사되어`

- **Hanja vs no-hanja split:** 한자 표기 가능 1,507개; 한자 없는 성씨 4,075개.
  - a1/`surnames-with-hanja-2015`, a1/`surnames-without-hanja-2015`
    url: `https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8&prop=wikitext&format=json`
    accessed: 2026-09-16
  - a4/`surname-hanja-2015`
    url: `https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8&prop=wikitext&format=json`
    accessed: 2026-09-16
    quote (both files): `이 중 [[한자]]로 표기할 수 있는 성씨는 1,507개이고, 한자가 없는 성씨는 4,075개로 조사되었다.`

### 본관 counts

- **본관별 성씨 수:** 2000년 4,179개 → 2015년 36,744개.
  - a1/`bon-gwan-2015`: 2015년 본관별 성씨의 본관 수는 36,744개.
    url: `https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8&prop=wikitext&format=json`
    accessed: 2026-09-16
  - a4/`bon-gwan-change`: same 4,179 → 36,744 change.
    url: `https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8&prop=wikitext&format=json`
    accessed: 2026-09-16
    quote (both files): `본관별 성씨는 2000년 4,179개에서 2015년 36,744개로 증가했다.`

No found record in these five files gives a 2015 population for any named 본관 (김해 김씨, 밀양 박씨, 전주 이씨, or a top-30 list). Those questions are in GAPS.

### National surname shares (2015, 나무위키 전국 표)

Source for all four share facts: a2, url `https://namu.wiki/w/%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8`, accessed 2026-09-16.
Shared quote: `전국 21.51 14.70 8.43 4.70 4.33 2.37 2.12 2.05 2.00 1.66`

- a2/`national-share-kim`: 김(金) 21.51% of national population.
- a2/`national-share-lee`: 이(李) 14.70%.
- a2/`national-share-park`: 박(朴) 8.43%.
- a2/`kim-lee-park-combined-share`: 나무위키 전국 표 수치로 계산하면 김·이·박 합계 44.64%.

The input files do not name the remaining seven percentages in that quote, and they do not give headcounts (명) for any surname. a2/`top-100-surname-populations` is NOT_FOUND (see GAPS).

### 2015 survey method

Both from 위키백과 인구주택총조사 연혁.
url: `https://ko.wikipedia.org/w/api.php?action=parse&page=%EC%9D%B8%EA%B5%AC%EC%A3%BC%ED%83%9D%EC%B4%9D%EC%A1%B0%EC%82%AC&prop=wikitext&format=json`
accessed: 2026-09-16

- a1/`survey-method-2015`: 2015년 전수 부문은 행정 자료를 활용한 등록센서스 방식.
  quote: `* 전수 부문은 행정 자료를 활용한 등록센서스 방식으로 실시`
- a1/`survey-method-2015-sample`: 2015년 표본 부문은 인터넷 조사와 방문 면접조사.
  quote: `* 표본 부문은 인터넷 조사와 방문 면접조사로 실시`

### Interpretation / caveats (위키백과)

Both a4 records use
url: `https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8&prop=wikitext&format=json`
accessed: 2026-09-16

- a4/`no-hanja-driver`: 한자가 없는 성씨가 크게 늘어난 배경으로, 귀화 외국인이 원래 사용하던 성씨를 그대로 유지한 점이 분석되었다 (위키백과가 경남일보 보도를 인용).
  quote: `이러한 소수 성씨의 대부분은 대한민국으로 귀화한 외국인이 원래 자신이 사용하던 성씨를 그대로 유지하고 있는 데 따라 발생하였다고 분석된다.`
- a4/`bon-gwan-data-caveat`: 2015년 통계청은 외국계 귀화인의 성씨 등 기타 신종 성씨를 성씨별 인구 통계에서 별도로 집계하지 않았다고 한국어 위키백과는 설명한다.
  quote: `통계청에서는 외국계 귀화인의 성씨 등 기타 신종 성씨는 별도로 집계하지 않고 있다.`

### What these files do not establish as found facts

a1, a4, and a5 do not contain a Statistics Korea (kostat) press-release title, date, or URL for the 2015 성씨·본관 results. a5 is entirely NOT_FOUND. Do not treat kostat/kosis URLs in failed_urls lists as retrieved sources.

## 3. CONTRADICTIONS

No two **found** records state incompatible numeric or categorical values.

Checked overlaps:

1. Surname total 5,582 appears in a1/`total-surnames-2015`, a2/`census-2015-context`, and a4/`surname-count-2015`. Same number. a1/a4 add “귀화 성씨 포함”; a2 adds “전수부문”. Those qualifiers are not mutually exclusive in the input text.
2. Hanja 1,507 and no-hanja 4,075 match across a1 and a4 (same quote). 1,507 + 4,075 = 5,582, which matches the total-surname figure in those same files.
3. 본관 36,744 (2015) and 4,179 (2000) match across a1/`bon-gwan-2015` and a4/`bon-gwan-change`.
4. 김 21.51 + 이 14.70 + 박 8.43 = 44.64, matching a2/`kim-lee-park-combined-share` as a calculation from the same 나무위키 row.

Non-contradictions (do not treat as value clashes):

- Wikipedia API `page=` encoding differs: a1 uses `%20` (`한국의 성씨`); a4 uses `_` (`한국의_성씨`). Same quotes; not two different counts.
- a1/a4 count 5,582 surnames including naturalised names, while a4/`bon-gwan-data-caveat` says 통계청 did not separately tally 외국계 귀화인 성씨 in **성씨별 인구 통계**. Different objects (surname inventory vs population-by-surname tables). The files do not give two competing population totals.

There is therefore no CONTRADICTIONS pair with two URLs and incompatible values.

## 4. GAPS

Every NOT_FOUND question across the five lanes, copied from the claim lines:

1. **a1/`publication-date`** — 2015년 성씨·본관 결과의 publication date.
   searched: `2015 인구주택총조사 성씨 본관 결과 발표일 | 통계청 2015 성씨 본관 보도자료 | KOSIS 2015 성씨 본관 발표`
   failed_urls: `https://kostat.go.kr`, `https://kosis.kr`

2. **a2/`top-100-surname-populations`** — 2015년 인구주택총조사에서 한국 상위 100개 성씨 각각의 인구와 해당 한자를 함께 보여 주는 검증 가능한 표.
   searched: `2015 인구주택총조사 성씨별 인구 상위 100 | KOSIS 성씨별 인구 2015 | 통계청 한국 성씨 100위 인구`
   failed_urls: `https://kosis.kr | https://kostat.go.kr | https://ko.wikipedia.org/wiki/%한국의_성씨`

3. **a3/`bongwan-top30-2015`** — 2015년 인구주택총조사에서 인구 기준 상위 30개 본관과 각 본관의 인구 수 표.
   searched: `2015년 본관별 인구 상위 30 | 2015 인구주택총조사 본관 인구 | KOSIS 본관별 성씨 인구`
   failed_urls: `https://ko.wikipedia.org/wiki/%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8`, `https://ko.wikipedia.org/wiki/%EB%B3%B8%EA%B4%80`, `https://kosis.kr`

4. **a3/`bongwan-largest-2015`** — 2015년 대한민국에서 인구가 가장 많은 단일 본관과 그 인구 수.
   searched: `2015년 가장 많은 본관 인구 | 김해 김씨 본관 2015 인구 | KOSIS 본관별 인구 2015`
   failed_urls: `https://ko.wikipedia.org/wiki/%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8`, `https://ko.wikipedia.org/wiki/%EB%B3%B8%EA%B4%80`, `https://kosis.kr`

5. **a3/`bongwan-gimhae-gim-2015`** — 2015년 김해 김씨 본관 인구.
   searched: `김해 김씨 2015 인구 | 김해김씨 본관 인구주택총조사 | KOSIS 김해 김씨`
   failed_urls: `https://ko.wikipedia.org/wiki/%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8`, `https://ko.wikipedia.org/wiki/%EB%B3%B8%EA%B4%80`

6. **a3/`bongwan-miryang-bak-2015`** — 2015년 밀양 박씨 본관 인구.
   searched: `밀양 박씨 2015 인구 | 밀양박씨 본관 인구주택총조사 | KOSIS 밀양 박씨`
   failed_urls: `https://ko.wikipedia.org/wiki/%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8`, `https://ko.wikipedia.org/wiki/%EB%B3%B8%EA%B4%80`

7. **a3/`bongwan-jeonju-i-2015`** — 2015년 전주 이씨 본관 인구.
   searched: `전주 이씨 2015 인구 | 전주이씨 본관 인구주택총조사 | KOSIS 전주 이씨`
   failed_urls: `https://ko.wikipedia.org/wiki/%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8`, `https://ko.wikipedia.org/wiki/%EB%B3%B8%EA%B4%80`

8. **a3/`bongwan-other-2015`** — 2015년 인구 기준 상위 30개 본관의 개별 명칭과 인구 수(공개 웹 출처에서 26개 항목).
   searched: `2015 본관 인구 순위 | 본관별 인구 통계 2015 상위 | 통계청 본관별 성씨`
   failed_urls: `https://ko.wikipedia.org/wiki/%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8`, `https://ko.wikipedia.org/wiki/%EB%B3%B8%EA%B4%80`, `https://kosis.kr`

9. **a4/`surname-count-1985-2000`** — 1985년과 2000년 인구주택총조사의 전체 성씨 수를 동일한 조사 기준으로 보여 주는 원문 수치.
   searched: `1985 2000 2015 성씨 본관 귀화 성씨 한자 통계청 | 2000년 성씨 본관 통계청 | KOSIS 성씨 본관 1985 2000`
   failed_urls: `https://kosis.kr | https://kostat.go.kr`

10. **a4/`naturalised-growth`** — 1985년·2000년 대비 2015년 귀화 성씨의 증가량을 직접 제시하는 원문 수치.
    searched: `귀화 성씨 증가량 1985 2000 2015 | 귀화하여 생긴 성씨 5582 | 통계청 귀화 성씨`
    failed_urls: `https://kosis.kr | https://kostat.go.kr`

11. **a5/`release-title-date-url`** — 2015년 성씨·본관 결과를 발표한 통계청 보도자료의 정확한 제목, 발표일 및 URL.
    searched: `통계청 보도자료 성씨 본관 2015 | 2015년 인구주택총조사 성씨 본관 통계청 2016 9 7 | site:kostat.go.kr "성씨·본관" "2015"`
    failed_urls: `https://kostat.go.kr/board.es?mid=a10301010000&bid=219`, `https://mods.go.kr/search.es?query=2015%20%EC%84%B1%EC%94%A8%20%EB%B3%B8%EA%B4%80`

12. **a5/`release-headline-figures`** — 해당 통계청 보도자료 원문에서 성씨 수, 본관 수 및 상위 성씨 headline figures.
    searched: `통계청 성씨 총인구 49,706천명 | 2015 성씨 본관 통계청 보도자료 제목 | KOSIS 성씨ㆍ본관별 인구 2015`
    failed_urls: `https://kostat.go.kr/board.es?mid=a10301010000&bid=219`, `https://kosis.kr/statHtml/statHtml.do?tblId=DT_1IN15SD&orgId=101`

Lane a3 contributes six of the twelve gaps (entire file). Lane a5 contributes two (entire file). No found Statistics Korea primary release is in this harvest.

## 5. URL check (report vs inputs)

Found-fact URLs in this digest (4 distinct):

- `https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8&prop=wikitext&format=json` — a1
- `https://ko.wikipedia.org/w/api.php?action=parse&page=%EC%9D%B8%EA%B5%AC%EC%A3%BC%ED%83%9D%EC%B4%9D%EC%A1%B0%EC%82%AC&prop=wikitext&format=json` — a1
- `https://namu.wiki/w/%ED%95%9C%EA%B5%AD%EC%9D%98%20%EC%84%B1%EC%94%A8` — a2
- `https://ko.wikipedia.org/w/api.php?action=parse&page=%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8&prop=wikitext&format=json` — a4

failed_urls also copied only from the input files (GAPS). No URL was introduced.

**Lanes digested: 5. Missing input files: 0.**
