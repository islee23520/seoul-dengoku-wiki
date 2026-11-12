# v3 task 28: correcting translation errors in the fixed facts

Owner instruction (2026-11-13): "번역오류는 전부 수정해야하는것". Every correction below is listed in `docs/design/v3/fixed-facts.corrections.json` with `at` paths covering every occurrence in the frozen snapshot, so `node scripts/pages/v3-fixed-facts.mjs --check` passes. The output reads "fixed facts unchanged (with 100 listed corrections applied)". The same values were also corrected in the data (`data/sql/030,050,090,100,110,120,121,123`). Every other mention of the same entity changed with them so links stay consistent: lore text, relation `from`/`to`, tree `lineage.surname/bongwan` and map holdings. No portrait token held a corrected value; their names are Korean.

## Convention found in the data (kept, not normalized)

- **Korean person names** are Revised Romanization: the surname, a space, then the given name. Given-name hyphenation is mixed, about 50/50 ("Han Jae-mok" next to "Yu Sejin"), and was left as is. Within given names the data romanizes by pronunciation, with liaison and assimilation: Byeoryun 별윤, Bungmin 북민, Geumnin 금린, Darwon 달원, Bichun 빛훈. Corrections follow that pattern.
- **Surnames** are mostly strict RR (I, Gim, Bak, Choe, Gang, O, No). Accepted variants also occur (Kim 17 vs Gim 2 for persons, Yi, Lee, Oh, Kang, Noh, Park, and Park/Yi in tree ancestors). These are legitimate surname spellings and were **not** changed. Clan **labels** (`$.clan.name`) must agree with their own clan table row, so those were corrected.
- **Clan labels** use the form "<Bongwan> <Surname> Clan" or "<Surname> Clan of <Bongwan>". Both forms are kept.
- **Stations** follow the official Seoul Metro English name in 247 of 312 cases. The project's own `Seoul-Station-Catalog` document (030, column 영문) was used as the official reference. **Gu and dong names** use the administrative "-gu" / "-dong" romanization.
- **Non-Korean persons** must use the surname spelling of their `nonkorean_family` row. The data otherwise keeps diacritics (Müller, Wiśniewska, Zielińska, Léa, Tomáš).

## Corrections (45 values, 100 snapshot occurrences)

| Field | Old | New | Occ. | Reason |
| --- | --- | --- | --- | --- |
| people.en.clan.name | Hansan Yi Clan | Hansan I Clan | 1 | 090 $.clan.name 한산 이씨: the surname disagrees with the clan table row (surname "I") and with the other four 이씨 clan labels ("... I Clan"). The member's own name is "I Seo-dam". |
| people.en.clan.name | Pungi Jin Clan | Punggi Jin Clan | 4 | 090 $.clan.name 풍기 진씨: 풍기 is "Punggi" (the clan table bongwan already reads Punggi). |
| people.en.clan.name | Choe clan of Suseong | Choe Clan of Suseong | 1 | 090 $.clan.name 수성 최씨: lowercase typo "clan". Every other label capitalizes Clan. |
| people.en.clan.name | Heo of Yangcheon | Heo Clan of Yangcheon | 1 | 090 $.clan.name 양천 허씨: the word "Clan" is missing (every other Korean clan label has it). |
| people.en.clan.name | Yeon of Goksan | Yeon Clan of Goksan | 3 | 090 $.clan.name 곡산 연씨: the word "Clan" is missing (every other Korean clan label has it). |
| people.name, people.en.name | Martin Horak | Martin Horák | 2 | person-0188: the surname differs from the family record DIV-K187 "Horák". The data keeps diacritics elsewhere (Müller, Wiśniewska, Zielińska). |
| people.name, people.en.name | Ana Hierophantscu | Ana Popescu | 2 | person-0190 아나 포페스쿠: a global Pope->Hierophant rename corrupted the surname Popescu. |
| people.name, people.en.name, trees.nodes.name | Su Choreong | Su Chorong | 3 | Wrong romanization of the Korean name; 수초롱: 롱 is "rong" (Chorong), not "reong". |
| people.en.clan.name | Yeong Clan by Birth | Seoncheon Yeong Clan | 2 | 090 $.clan.name 선천 영씨: the bongwan 선천 (Seoncheon) was translated as "by birth". Corrected to the "<Bongwan> <Surname> Clan" pattern. |
| people.name, people.en.name | Jang Dowon | Jang Dorwon | 2 | Wrong romanization of the Korean name; 장돌원: the ㄹ of 돌 was dropped ("Dowon" reads as 도원). The data's own liaison pattern for 달원 is "Darwon" (Bae Darwon, Jo Darwon), so 돌원 -> Dorwon. |
| people.name, people.en.name | Pavel Nemets | Pavel Němec | 2 | person-0526: Russian-style spelling of a Czech surname. The family record DIV-K526 reads "Němec" (Korean 네메츠). |
| people.name, people.en.name | Millicent Mensa | Millicent Mensah | 2 | person-0558: the surname must match her family record, nonkorean_family DIV-K558 "Mensah" (the Ghanaian surname; Korean 멘사). "Mensa" is a typo. |
| people.name, people.en.name | Simon Kaminski | Simon Kamiński | 2 | person-0606: the surname differs from the family record DIV-K606 "Kamiński". |
| people.name, people.en.name | Zofia Dobrowska | Zofia Dąbrowska | 2 | person-0638: misspelled. The family record DIV-K638 reads "Dąbrowska". |
| people.name, people.en.name | Ryu Bipyeon | Ryu Bichyeon | 2 | Wrong romanization of the Korean name; 류빛현: there is no p sound in 빛현. The data's own pattern for 빛+ㅎ is "Bichun" (최빛훈 Choe Bichun), so 빛현 -> Bichyeon. |
| people.name, people.en.name | Viktor Stanescu | Viktor Stănescu | 2 | person-0862: the surname differs from the family record DIV-K862 "Stănescu". |
| people.en.clan.name | Sangnak Kim Clan | Sangnak Gim Clan | 1 | 090 $.clan.name 상락 김씨: the surname disagrees with the clan table row (surname "Gim") and with every other 김씨 clan label ("Gyeongju Gim Clan", "Gwangsan Gim Clan", ...). |
| people.name, people.en.name | Barbora Prohaskova | Barbora Procházková | 2 | person-0958: misspelled (missing the c of "ch"). The family record DIV-K958 reads "Procházková" (Korean 프로하스코바). |
| people.name, people.en.name | Isabel Garcia | Isabel García | 2 | person-0990: the surname differs from the family record DIV-K990 "García". |
| people.en.clan.name | Jeonui Lee | Jeonui I Clan | 1 | 090 $.clan.name 전의 이씨: "Clan" is missing and the surname disagrees with the clan table (surname "I"; the other 이씨 clans are "Yeonan I Clan", "Gyeongju I Clan", "Gwangju I Clan", "Seongju I Clan"). |
| clans.surname | State | Guk | 1 | clan 담양 국씨: the surname 국 (Guk) was translated as the word "state". The person clan label already reads "Damyang Guk Clan". |
| clans.bongwan | Gang Eum | Gangeum | 1 | clan 강음 단씨: the bongwan 강음 was split into two words. Every other bongwan is one word, and the person clan label already reads "Gangeum Dan Clan". |
| clans.bongwan | Culture | Munhwa | 1 | clan 문화 류씨: the bongwan place name 문화 (文化, Munhwa) was translated as the word "culture". The person clan label already reads "Munhwa Ryu Clan". |
| clans.bongwan | By Birth | Seoncheon | 1 | clan 선천 영씨: the bongwan place name 선천 (Seoncheon) was translated as the word 先天 "by birth". |
| clans.bongwan | Elderly | Goryeong | 1 | clan 고령 신씨: the bongwan place name 고령 (Goryeong) was translated as the word "elderly". The person clan label already reads "Goryeong Sin Clan". |
| nonKorean.surname | Hierophantscu | Popescu | 1 | nonkorean_family 포페스쿠: a global Pope->Hierophant rename corrupted the Romanian surname Popescu (Korean 포페스쿠 = Popescu). |
| trees.nodes.name | Gim Mimi | Gim Minmi | 1 | Wrong romanization of the Korean name; family_tree historical node 김민미: the syllable 민 was dropped (Minmi). |
| trees.nodes.name | O Doug | O Douk | 1 | Wrong romanization of the Korean name; family_tree historical node 오도욱: 도욱 was replaced by the English name "Doug". RR is Douk. |
| trees.nodes.name | Bak Doug | Bak Douk | 1 | Wrong romanization of the Korean name; family_tree historical node 박도욱: 도욱 was replaced by the English name "Doug". RR is Douk. |
| trees.nodes.name | Bak Dohyeon | Bak Doheon | 1 | Wrong romanization of the Korean name; family_tree historical node 박도헌 (K169 line): 헌 is "heon"; "Dohyeon" would be 도현. The node's own nameEn already reads "Park Doheon". |
| trees.nodes.name | Yun Hyeonggyeong | Yun Hyeongyeong | 1 | Wrong romanization of the Korean name; family_tree historical node 윤현경: "Hyeonggyeong" would be 형경. RR is Hyeongyeong. |
| trees.nodes.name | Gwak Hyeonggyeong | Gwak Hyeongyeong | 1 | Wrong romanization of the Korean name; family_tree historical node 곽현경: "Hyeonggyeong" would be 형경. RR is Hyeongyeong. |
| trees.nodes.name | Yun Mingwei | Yun Mingyu | 1 | family_tree historical node 윤밍위 (K1011 Lin family): the given name disagrees with the Korean 밍위 and with the node's own nameEn "Yin Mingyu". "Mingwei" would be 밍웨이. Corrected to Mingyu; the surname Yun follows the node name convention. |
| trees.nodes.name | Yun Chunzhi | Yun Chunji | 1 | family_tree historical node 윤춘지 (K1011 Lin family): the given name disagrees with the Korean 춘지 and with the node's own nameEn "Yin Chunji". "Chunzhi" would be 춘즈. Corrected to Chunji. |
| trees.nodes.name | Song Jaeseob | Song Jaeseop | 1 | Wrong romanization of the Korean name; family_tree historical node 송재섭: a final ㅂ is "p" in RR (cf. surname Seop, 섭). Jaeseop. |
| regions.district, stations.district, titles.name | Yeongdeungpo District | Yeongdeungpo-gu | 37 | 영등포구 is the only one of the 25 gu rendered "District"; the other 24 use the administrative romanization "-gu" (map_region.district, map_station.district, duchy map_title). Official Yeongdeungpo-gu. |
| regions.name | Olyun-dong | Oryun-dong | 1 | map_region 오륜동: 륜 is "ryun" in RR. The data itself writes Dunchon Oryun station and Oryun elsewhere. Official Oryun-dong. |
| stations.name | Geumcheon District Office | Geumcheon-gu Office | 1 | map_station 금천구청: "District" breaks the X-gu Office pattern of the other gu-office stations. Official Geumcheon-gu Office (Seoul-Station-Catalog). |
| stations.name | Male | Namseong | 1 | map_station 남성 (Line 7 Namseong): the place name was machine-translated as the word 남성 "male" instead of romanized. Official station name Namseong (Seoul-Station-Catalog 영문 column; the station control deltaId already reads S08-TRANSFER-2126-Namseong). |
| stations.name | Magoknaru | Magongnaru | 1 | map_station 마곡나루: nasal assimilation is missing (곡+나 is pronounced [공나]). The rest of the data applies it. Official Magongnaru (Seoul-Station-Catalog). |
| stations.name | Mapogucheong | Mapo-gu Office | 1 | map_station 마포구청: untranslated, unlike the other gu-office stations (Gangnam-gu Office, Gangdong-gu Office, Yangcheon-gu Office, Yeongdeungpo-gu Office). Official Mapo-gu Office (Seoul-Station-Catalog; the lore already says "Mapo-gu Office Station"). |
| stations.name | Ollimpikgongwon | Olympic Park | 1 | map_station 올림픽공원: the English loanword "Olympic" was romanized back from its Hangul spelling. Official Olympic Park (Seoul-Station-Catalog; the station summary already says "Olympic Park Station"). |
| stations.name | Yong Du | Yongdu | 1 | map_station 용두 (Line 2 branch): a one-word place name split as if it were a surname and a given name. Official Yongdu (Seoul-Station-Catalog). The person 용두 (person-0263, surname 용 + given name 두) stays "Yong Du". |
| stations.name | Woldeukeopgyeonggijang | World Cup Stadium | 1 | map_station 월드컵경기장: the English loanword "World Cup" was romanized back from Hangul. Official World Cup Stadium (Seoul-Station-Catalog; the lore already says "World Cup Stadium Station"). |
| stations.name | Hakyeoul | Hangnyeoul | 1 | map_station 학여울: letter-by-letter transliteration. The data elsewhere applies RR sound changes (Gongneung, Dongnimmun, Seolleung). Official Hangnyeoul (Seoul-Station-Catalog). |

## Suspicious values deliberately NOT changed

| Value | Why it was kept |
| --- | --- |
| person-1015 "Nargiza Yusupova" / 나르기즈, tree nameEn "Nargiz Yusupova" | The lore says outright: "Full name: Nargiza Yusupova. Known as Nargiz". The Korean and nameEn use the known-as form on purpose. |
| tree nameEn "Park Taegyeom", "Park Doheon", "Park Seoyun", "Lee Jeonghui", "Kim ..." vs name "Bak ..." / "I ..." | `nameEn` is the person's own Latin spelling (diaspora family K169/K1014), and `name` is the project RR. Two fields by design. |
| tree K1013 "Yusuf Kasim"/"Yusuf Qasim", "Layla Hadad"/"Haddad", "Maryam"/"Mariam", "Hasan"/"Hassan"; K169 "Bridget"/"Brigid", "Brona"/"Bróna"; K1011 "Lin Min'an"/"Minan" | These are variant spellings of the same name across `name` and `nameEn` (self-spelling). The Korean (카심, 하다드, 브리짓) fits both. They are not different people. |
| Kim/Gim, Yi/I/Lee, Oh/O, Kang/Gang, Noh/No, Park/Bak in person and ancestor names | Accepted spellings of the surname. Normalizing them would rename about 25 people and 70+ ancestors without a translation error. |
| Liaison or assimilation given names (Byeoryun, Bungmin, Seogyun, Dahin, Hyeollan, Seungni, Sumnin, Supyeon, Bugwon ...) | A consistent pronunciation-based pattern in the data. |
| Ranseon 란세온, Yongdubong 용두봉 | Single-word names that match their Korean. |
| Zofia Dąbrowska / 도브로프스카 | The NIKL transcription would be 동브로프스카. The Korean is a transcription variant, not a translation error, and was left. |
| Pham Van Duc (person) vs "Phạm Văn ..." (ancestors) | Diacritics differ, but it is the same Vietnamese name. |
| Station names that romanize instead of using the official English: Sicheong (City Hall), Gyeongchalbyeongwon (National Police Hospital), Gonghang Sijang (Airport Market), Jonghap Undongjang (Sports Complex), Jungang Bohun Byeongwon (VHS Medical Center), Boramaebyeongwon (Boramae Medical Center), Boramaegongwon (Boramae Park), Solbatgongwon (Solbat Park), Hyochanggongwonap (Hyochang Park), Seoulsup (Seoul-forest), Seokchongobun (Seokchon Gobun), Seouljibangbyeongmucheong (Seoul Regional Office of Military Manpower), Gosok Terminal (Express Bus Terminal), Nambu Terminal (Nambu Bus Terminal), Gimpo Airport (Gimpo Int'l Airport) | These are correct RR of the Korean name (untranslated rather than mistranslated). The owner can switch them to the catalog's official English with one corrections entry each. |
| University and "-ipgu" stations: Goryeodae, Gwangundae, Gyodae, Seogangdae, Idae, Hanyangdae, Geondae-ipgu, Dongdaeipgu, Hongdaeipgu, Sukdaeipgu, Sungsildaeipgu, Seongsinyeodaeipgu, Hansungdaeipgu, Chongsindae-ipgu (Isu), Oedaeap, Dongmyoap, Taereung-ipgu, Cheonggyesan-ipgu, Daemosanipgu, Euljiro-ipgu | RR of the colloquial Korean name; the official English uses the university's own name (Korea Univ., Hongik Univ., ...). Same as above. |
| 4.19 Democratic Cemetery, National Assembly Building, Amsa Historic Park, Seoul National University Entrance/Venture Town, Sinchon (Underground), Dongdaemun History & Culture Park, Metro Hotel | Acceptable English translations. They differ from the catalog only in wording or subtitle. |
| Mokdong, Changdong, Hakdong, Euljiro 3-ga, Jongno 3-ga ... | Differ from the catalog only by hyphenation or a numeral reading. |
| Station Irwon (catalog "Ilwon"), Dapsimni (catalog "Dapsipri") | The data uses correct RR. The catalog column itself disagrees with RR, so neither was changed. |
| Region names Ilwon 1-dong, Ilwonbon-dong (RR Irwon), Bukahyeon-dong (RR Bugahyeon), Hangang-ro-dong (RR Hangangno) | Letter-by-letter rather than pronunciation RR, and inconsistent with station "Irwon". The official administrative forms could not be verified here, so they were left. Candidates for a follow-up correction. |
| Station or region districts that look geographically off (구로디지털단지 in 영등포구, 강동구청 in 송파구, 신설동/창신 in 성북구) | Polygon-derived geography, identical in en and ko. Not a translation issue. |
| person-1014 "Joel Park" / 조엘 박 | Diaspora self-spelling; matches the Korean. |

## Verification

- `node scripts/pages/v3-fixed-facts.mjs --check` exits 0: "fixed facts unchanged (with 100 listed corrections applied)".
- `node site/build.mjs && node site/check-site.mjs`: in this Windows worktree the unmodified base commit already fails `site/build.mjs`, with 354 `UNRESOLVED_IMPORT` errors for `<img src="/seoul-dengoku-wiki/clan-crests/*.svg">`. Vite checks public files without stripping `base`. The failure is not caused by this change. With a local, uncommitted patch (`src="${BASE}clan-crests/` -> `src="/clan-crests/` in site/build.mjs:434) both commands exit 0 on this branch: check-site reports "Fragments checked 33072 links, known-broken 0, new-broken 0", "EN 1435 + KO 1435 + showcase 1", "OK".
