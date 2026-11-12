# v3 Bible Chapter 4. Government Society

Status: draft. Plan `.omo/plans/wiki-lore-rebuild-v3.md`, task 5. English mirror of `04-government.md` (Korean primary); section numbers and figures are the same.

How to read:

- **[Approved]** marks text carried over unchanged from the `docs/CANON-BIBLE.md` skeleton (section 1, sections 2.1-2.5, the [승인] rows of section 3, section 4, section 9.4).
- **(provisional T05-n)** marks something invented in this chapter. Every such item has a row with the same number in `docs/drafts/reports/v3-ledger-parts/t05.md`. It is not approved canon until the owner answers.
- What chapter 1 (`01-core.md`) decided (figures, title ladder, chronology, voice) is used as is and not decided again. "Basis: 01-core 7.1" means section 7.1 of chapter 1. The places where this chapter extends chapter 1 are collected in section 18.
- The old document `docs/drafts/Government-Society.ko.md` was read as reference only. Its old titles and old electoral-district concept are retired (01-core section 10). This chapter does not carry them over.
- Every station and district name is a value of `map_station` / `map_region` in `data/sql/120-map-core.sql`. Station lines are read from the line_ids of the same file.

## 1. What this chapter covers

Basis: Bible 2.1; Bible 1, rows 3 and 12; 01-core 7.1, 8.1, and items 5, 6, 7 and 10 of section 11.

This chapter decides how the Government of the 14 districts north of the Han works: the National Assembly and the President for Life, the two parties, the ministries, the ledger that is resident registration, district offices and dong centres, law and punishment, inherited work and the strata, taxes and rations, markets by station, clothing, the daily clock, rites, and the national army. Last, it sets a quota table of how many of the 504 Government people sit in which roles in each district (section 16). Task 17 places the people with that table.

Government speech follows 01-core 2.2: official-document speech gone rigid under scarcity, naming people by their registration entries before their names. Quotations in this chapter are written in that voice.

## 2. The ledger state: how the Government sees itself

Basis: Bible 2.1 (Republic of Korea institutions surviving under scarcity; only people recorded in its ledger are citizens); 01-core 7.1 "Founding logic" and "What continues from the Republic of Korea"; 3.7.

To Government people the Government is not a newly founded state. It is the Republic of Korea. In a hundred years since the Great Blackout, they say, it has not changed its name, the article numbers of its statute book, or its seals. Only the size of the country changed. The country reaches as far as a clerk can reach, and the river is its end.

The Government has never lifted the **state of disaster** it declared in the first year after the Great Blackout. Every notice of 2126 opens with the line "Under the state of disaster". The state of disaster is the ground on which the Government decides where people live and what they do, takes in goods, and calls people up. Government people do not find this strange. The winter has not ended, so the disaster has not ended (provisional T05-1).

The Government explains the winter in the words of 01-core 3.7: "The winter stopped when the ledger was brought within quota." The Government takes this sentence as its reason to exist. It believes that counting people, setting a quota for each station and keeping to it is what keeps the winter from tightening. So the ledger is the Government's conviction before it is a tool of administration (section 13).

South of the river is **off the ledger**: "off the ledger" in official writing, "across the river" in speech. The canon chapter 1 sentence "they think across the river is where savages live" is used only as the spoken words of Government people (01-core 2.4).

## 3. The National Assembly and the President for Life

### 3.1 The National Assembly

Basis: Bible 2.1 (an Assembly Member for each district, single chamber); 01-core 7.1; 8.1 (one seat per district, T02-67); 2.4 (handed-down seat, T02-3).

- **[Approved]** There is one National Assembly. Like the National Assembly of the Republic of Korea it is single-chamber; the only members are Assembly Members. Each district's Assembly Member holds that district's duchy.
- There are fourteen Assembly Members, one seat per district (01-core 8.1). The National Assembly Building on Yeouido stands empty across the river, and the Assembly sits in an old meeting room below the main building of the Government Complex Seoul, a room joined by tunnel to Gwanghwamun station (provisional T05-2).
- Elections are held every four years. Carrying on the Republic of Korea's numbering of Assemblies, the Assembly of 2126 is the **47th National Assembly**, opened in 2124. Registered adults stamp a ballot at the dong centre. Each of the two parties puts up one candidate, but the winner is known before the vote: the person the district's Member house backed (provisional T05-3).
- A seat is handed down like this. When an Assembly Member dies or steps down, the head of household of that house names an heir, and the heir becomes the candidate at the next election. People call this "handing down the seat" (01-core T02-3). Until the election the heir uses the district office's seal as "acting Member" (provisional T05-4).
- The Assembly does two things. It passes statutes with fourteen seals (7.1), and it acclaims the President for Life (3.2). Promises made across the river, such as the water supply contract, are not ratified by the Assembly; a ministry makes them as annexes (section 15). There is no budget. The Government's budget is the ration ledger itself (section 9).

### 3.2 Acclamation and the President for Life

Basis: Bible 2.1 (the Assembly Members gather candidates from among themselves and produce a President; life tenure); 01-core 2.4 (acclamation, fourteen seals, T02-2); 7.1 "Structure of power" (the next acclamation opens only when the President dies); 8.1 (President for Life, T02-66).

- **[Approved]** The President is produced by the Assembly Members from among the Assembly Members. The President serves for life.
- Acclamation opens the day after the President dies. The fourteen Assembly Members stamp their seals one after another under a candidate's name, and the acclamation succeeds only when all fourteen have stamped. If even one does not, they meet again the next day. So the President is always someone all fourteen houses can accept. The person from the strongest house rarely becomes President (provisional T05-5).
- The oldest Assembly Member presides over the acclamation. It is the Republic of Korea National Assembly's practice of a senior member chairing when there is no speaker, set hard into an order of age. Until the acclamation is over, that person signs as acting President (provisional T05-6).
- An Assembly Member who becomes President gives up the seat. The seat is handed down to the heir of the President's house. So the President's house holds the presidency and a seat at once (provisional T05-7).
- What the President does is sign. The President appoints ministers, stamps notices, and writes the appointment of the army's top commander (section 14). The President does not hold a district. The President's power reaches as far as the fourteen Assembly Members accept the President's signature.
- Who the sitting President is waits on the owner's answer (Bible section 9, Q28). Yun Seo-rin (person-0145) in the data is 27. If the Q28 default (sitting President for Life) is accepted, a young President is read as the result of the all-fourteen rule above: while the strong houses blocked one another, the fourteen seals gathered on a young Member who had not yet taken any side (provisional T05-8).

### 3.3 The two parties

Basis: Bible 2.1 (a multi-party system on paper; in fact the OMO Party and the Claw Party); 01-core 7.1 (the OMO Party is the party of contracts, the Claw Party the party of the ledger, T02-50).

- **[Approved]** On paper it is a multi-party system. In fact there are only two parties, the OMO Party and the Claw Party.
- The lines of 01-core are used as they are. The **OMO Party** is the party of contracts: the ledger itself survives only by contracting across the river for skills and parts. The **Claw Party** is the party of the ledger: the north must feed itself from its own land and hands, and mixing with what is off the ledger will bring the ledger down.
- The party register still lists eleven parties. Nine have no members or only a membership roll left. Striking them off needs an Assembly vote, and nobody puts the motion (provisional T05-9).
- A party is a name that binds houses. A Member house chooses a party, and the registered of that district follow the Member house's party. The party leader is one of that party's Assembly Members; the party's working business is run by a party secretary general who is not an Assembly Member (provisional T05-10).
- The seats in 2126 are OMO Party 6, Claw Party 8. The four districts that touch the Han (Mapo, Yongsan, Seongdong, Gwangjin) are all OMO Party: they hold the bridges, tunnels and intakes, so they are hurt first when a contract breaks. Jung-gu and Seodaemun-gu, which do not touch the river, are OMO Party too: Jung-gu lives off the Seoul Station licensed traders' post and the Hoehyeon market, Seodaemun-gu off goods from across the river that come through the Gongdeok market in Mapo. The eight mountain and inland districts are Claw Party (provisional T05-11).

### 3.4 The fourteen seats

Basis: Bible 2.4 (14 Government districts; duchy holder title Assembly Member); 01-core 5.2 (Guui and Ttukdo intakes), 5.6, 7.4 (border links), section 9 row 2076-2085 (under-river tunnel checkpoints).

| District | Party | Quota-table stage | What this district holds |
|---|---|---|---|
| Jongno-gu | Claw Party | S1 | Government Complex Seoul (the ministries and the Assembly meeting room), Gwanghwamun station. The head of the Government |
| Jung-gu | OMO Party | S1 | Seoul Station (the largest station), the Bank of Korea, City Hall, the markets at Dongdaemun History & Culture Park and Hoehyeon |
| Yongsan-gu | OMO Party | Key | Ministry of National Defense and Capital Defense Command (Samgakji), the north ends of the Yongsan-Noryangjin and Ichon-Dongjak bridges |
| Mapo-gu | OMO Party | Key | the Mapo-Yeouinaru under-river tunnel, the north ends of the Hapjeong-Dangsan and Digital Media City-Magoknaru bridges, the Gongdeok market |
| Seongdong-gu | OMO Party | Key | the Ttukdo intake, the Seoul Forest-Apgujeong Rodeo under-river tunnel, the north end of the Oksu-Apgujeong bridge, Wangsimni |
| Gwangjin-gu | OMO Party | Key | the Guui intake, the north end of the Jamsil weir, the Gwangnaru-Cheonho under-river tunnel, the north ends of the Gangbyeon-Jamsillaru and Jayang-Cheongdam bridges |
| Seodaemun-gu | OMO Party | S1 | the passage between Mapo and Jongno, Chungjeongno and Sinchon |
| Dongdaemun-gu | Claw Party | S1 | Cheongnyangni (a station where many lines meet), the fuel market |
| Jungnang-gu | Claw Party | S1 | Sangbong and Mangu, the Mangu burial field |
| Seongbuk-gu | Claw Party | S1 | watch posts toward the Bukhansan edge, the school on the old university grounds |
| Eunpyeong-gu | Claw Party | S1 | Yeonsinnae (a station on a deep line), Bukhansan firewood, the Bukhansan edge |
| Gangbuk-gu | Claw Party | S1 | the April 19th National Cemetery burial field, the Bukhansan edge |
| Dobong-gu | Claw Party | S1 | the Chang-dong depot, Dobongsan firewood and edge |
| Nowon-gu | Claw Party | S1 | the Korea Military Academy at Hwarangdae, the edge toward Suraksan and Buramsan, the district with the most light-fields |

(provisional T05-11, T05-12)

The quota-table stage is the person stage used in section 16. The Assembly Members of the four districts that touch the Han (Mapo, Yongsan, Seongdong, Gwangjin) are Key because the annexes of the third water supply contract hang on the seals of these four seats (section 15): the bridges, tunnels and intakes are all in these four districts. The Assembly Members of Jongno and Jung are S1; the Key slots of those two districts are used by people of the national institutions (16.3) (provisional T05-12).

## 4. Ministries and national institutions

Basis: Bible 2.1 (ministries of the three branches on paper; Republic of Korea ministries); 01-core 7.1 "What continues from the Republic of Korea" (the ministries at the Gwanghwamun complex became offices for rationing and requisition); 5.6.

The ministries of the Government Complex Seoul kept their names and seals. What they do is far narrower than before the Great Blackout, and almost all of it concerns the ledger and rations. The places that actually work are six ministries and the Korea Forest Service at the Government Complex Seoul, plus five other national institutions. The ministry names are those of the Republic of Korea at the time of the Great Blackout. At the Great Blackout most of these ministries had their headquarters outside Seoul: the Ministry of the Interior and Safety, the Ministry of Land, Infrastructure and Transport, the Ministry of Agriculture, Food and Rural Affairs, the Ministry of Health and Welfare and the Ministry of Climate, Energy and Environment in Sejong, the Ministry of Justice in Gwacheon, the Korea Forest Service in Daejeon. When the edge of the outside machines cut those cities off from Seoul, the staff left at the Government Complex Seoul inherited those ministries' names and seals (provisional T05-13).

| Institution | Seat | What it does in 2126 |
|---|---|---|
| Ministry of the Interior and Safety | Government Complex Seoul | Keeps the master copy of resident registration (section 5). The state-of-disaster notices, civil defence, supervision of district offices and dong centres |
| Ministry of Climate, Energy and Environment | Government Complex Seoul | Water and electricity. The Guui and Ttukdo intakes and the wells, water allocation by quota, the wind frames on the bridges and riverbanks, salvaged copper and cable, the working business of the water supply contract |
| Korea Forest Service | Government Complex Seoul | Firewood. Felling permits and firewood shares on Bukhansan and Dobongsan |
| Ministry of Land, Infrastructure and Transport | Government Complex Seoul | Stations and tunnels. The stationmaster service, entrance management, handcar running on the tracks, setting station quotas |
| Ministry of Agriculture, Food and Rural Affairs | Government Complex Seoul | Meals. Fibre-sugar vats and mushroom tunnels, light-field allocation, the fibre levy (9.3) |
| Ministry of Health and Welfare | Government Complex Seoul | Health posts and the medical corps, dependants' rations, machine-body registration and Arc maintenance permits (13.3) |
| Ministry of Justice | Government Complex Seoul | Strike-off hearings (7.3), carrying out labour sentences, keeping the hand-copied statute book |
| Ministry of National Defense | Samgakji, Yongsan-gu | Administration of the army. Registration of conscripts and reservists, ammunition registration (section 14) |
| National Intelligence Service | the foot of Namsan, Jung-gu | The institution said to know what happens off the ledger. After the Great Blackout it abandoned its headquarters at Naegok-dong across the river and returned to its old site at the foot of Namsan. Its Director is meant to be appointed by the President, but whose signature the Service answers to is unclear even inside the Government. Section 17 does not decide why either |
| Bank of Korea | Jung-gu, near Hoehyeon station | Prints the ration tokens (9.1). Sets the notice value of the tokens |
| Office of the President | Government Complex Seoul | The President's signature and guard |
| National Assembly Secretariat | Government Complex Seoul | The Assembly's records, the acclamation seal book, the party register |

**Institutions that exist only on paper.** The Supreme Court, the Constitutional Court, the Prime Minister, the Ministry of Foreign Affairs and many other ministries remain on the organisation chart with their posts empty. The Government does not strike them out, because striking them out would weaken the claim that it has carried the Republic of Korea on. The Supreme Court's work is split between the Ministry of Justice and the district offices (7.2). What is left of the Ministry of Foreign Affairs' work, the promises made across the river, is made by the Ministry of Climate, Energy and Environment as annexes (section 15). The Government's official position is that across the river is not a country and so not a subject of foreign affairs (provisional T05-14).

Ministers and the Forest Service head are appointed by the President, but those posts mostly go to people of Member houses. Sharing the seven minister and head posts at the complex and the defence minister's post among the fourteen houses is what an acclamation is bargained over (provisional T05-15).

## 5. Resident registration: the ledger

Basis: Bible 2.1 (only people recorded in its ledger are citizens; they cannot change where they live or what they do); 01-core 2.2 (entry, registration, strike-off); 2.4 (the registered, strike-off, T02-4); 7.1 (resident registration became the ledger).

**The ledger** is resident registration. The Ministry of the Interior and Safety keeps the master copy in a deep level of the Government Complex Seoul, and each dong centre keeps a copy for its dong. When the master and a copy differ, the master wins.

The entries for one registered person are these (provisional T05-16).

| Entry | Content |
|---|---|
| Resident registration number | The same 13 digits as before the Great Blackout. The first six are the date of birth |
| Address | District, dong, station, level, place number. Example: "Jung-gu Hoehyeon-dong Seoul Station platform No. 3" |
| Household | Head of household and members. Rations and labour are assessed by household |
| Occupation | The inherited work (section 8). Changing it needs a signature |
| Ration grade | The grade in the 9.2 table |
| Military service | Serving, reserve, civil defence, exempt |
| Machine body | Whether the body carries machines, and where they are maintained (13.3) |
| Sentence | The record of punishments received (7.3) |

**The token.** The Republic of Korea's resident registration card became the **registration token**, a thin metal plate with the number cut into it. It is worn round the neck and shown when collecting rations and when passing between stations. Whoever loses it gets no rations until a new token is issued (provisional T05-17).

**Moving-in report.** To change one's station one files a moving-in report and needs three seals: the stationmaster of the station left, the Dong Chief of the dong left, and the receiving district office. Leaving one's registered station without the seals makes a person whereabouts-unknown, and after thirty days they are struck off (01-core T02-4) (provisional T05-18).

**Birth reports and quotas.** Every station has a **quota** set by the Ministry of Land, Infrastructure and Transport: the capacity of 01-core section 4 copied by the Government into the ledger. A child is entered as a household member by a birth report. When a station goes over quota, the Dong Chief issues a moving-in order that moves one household to a station with room under quota. The station moved to is usually shallow and cold. The Government believes keeping to quota is what keeps the winter from tightening (section 2) (provisional T05-19).

**Strike-off.** Being erased from the ledger. There are three kinds (provisional T05-20).

1. **Death strike-off.** Erased on a death report. One red line is drawn and the date written (13.4).
2. **Whereabouts-unknown strike-off.** Erasing a person who left their registered station and did not return for thirty days.
3. **Sentence strike-off.** Erasing as punishment (7.3). Two red lines are drawn. It cannot be reversed.

A struck-off person is off the ledger. They get no rations, their token is cut, and the law does not see them. Government people are taught that harming someone off the ledger is no crime. But if that person worked for a registered household, the household is repaid for the hands it lost.

## 6. District offices, dong centres, stationmasters

Basis: 01-core 7.1 (the district office became the office of the Assembly Member's house, the dong centre the Dong Chief's ration post, the stationmaster a surviving post of the old subway stationmaster service); 8.1 (Stationmaster, Dong Chief, Assembly Member; no separate tier between district and dong); the dong-tier rule of section 8 (T02-61).

The Government's work starts at the station and ends at the district office. Signatures go up from below.

| Post | Title | What it does | Who sits there |
|---|---|---|---|
| Station | Stationmaster (01-core T02-62) | The station's entrances, heat, water, air and quota; order inside the station | Stationmaster houses. The old subway station staff service was handed down |
| Dong | Dong Chief (01-core T02-63) | Runs the dong centre: rations, the ledger copy, petitions, moving-in seals | Appointed by the Assembly Member; usually the head of a civil-servant household |
| District | Assembly Member [Approved] | The duchy. Holds the district office | The Member house |

- The **district office** is the office of the Assembly Member's house (01-core 7.1). Its head is the **Head of the District Office**. The Head of the District Office is not a tier of the title ladder but a post appointed by the Assembly Member. The chief stamps the Member's seal on the Member's behalf, issues district notices (7.1) and holds petition hearings (7.2). Chiefs usually come from the Member house's kin or from a civil-servant household that has served long. The 01-core 8.1 rule "no separate tier between district and dong" stands: the Head of the District Office holds no land (provisional T05-21).
- The **dong centre** is the Dong Chief's ration post. It has three windows: rations, registration and petitions. One ration clerk can decide what a household eats this month (01-core 7.1). The official Government people meet most often is not an Assembly Member or a minister but the clerk at that window (provisional T05-22).
- The **stationmaster** holds the station's heat and air, so ranks below the Dong Chief and is feared more than the Dong Chief. The stationmaster decides whether to close an entrance, whether to stop surface work in a blizzard, which household sleeps on a deep level. The stationmaster's office follows the service rules of the Ministry of Land, Infrastructure and Transport, but the post is handed down inside the stationmaster house, not by the Assembly Member. It is the post the Assembly Member's hand reaches least (provisional T05-23).
- The signing line is "Stationmaster -> Dong Chief -> Head of the District Office -> Assembly Member". A stationmaster's report reaches the district office only through the Dong Chief. Only sentence strike-offs, marriages in the Member house, and bridge and tunnel matters go all the way to the Assembly Member (provisional T05-24).

## 7. Law and punishment

### 7.1 The layers of law

Basis: 01-core 7.1 (the law keeps the article numbers of the Republic of Korea statute book and is rewritten by notice); Bible 2.1 (three branches on paper).

Government law has four layers (provisional T05-25).

| Layer | What it is | Who makes it |
|---|---|---|
| Constitution | The Constitution of the Republic of Korea. Never amended. Almost nobody reads it, but the Government's legitimacy comes from it | Not amended |
| Statute | Articles of the Republic of Korea statute book, rewritten under their old numbers | The Assembly passes them with fourteen seals |
| Notice | Orders a ministry issues under the state of disaster: ration grades, quotas, labour hours | The minister writes, the President signs |
| District notice | Rules that differ by district: market pitch fees, entrance duty, firewood shares | The Head of the District Office writes, the Assembly Member signs |

What actually decides people's lives is notices and district notices. Changing a statute needs fourteen seals and is rare. So Government law looks like layer upon layer of notices over old articles. Clerks who know the law are scarce, and households pay them in meal tokens to write their petitions.

### 7.2 Hearings

Basis: 01-core 7.1; Bible 2.1.

- **Petition hearing.** Disputes between registered people and light offences are heard at the district office's petition hearing, held by the Head of the District Office in the Assembly Member's name. The evidence is the ledger, not witnesses. Whoever wants to dispute an entry must bring a clerk's seal, not a witness (provisional T05-26).
- **Strike-off hearing.** Offences that can lead to a sentence strike-off are heard by the Ministry of Justice at the Government Complex Seoul. Three hearing officers listen and take a written opinion from the district's Assembly Member. A sentence strike-off is confirmed by the President's signature (provisional T05-27).
- There are no defence counsel, only clerks who write petitions for others.

### 7.3 The ladder of punishment

Basis: Bible 2.1 (people on the ledger cannot freely change where they live or what they do); 01-core 2.4 (strike-off, T02-4).

Almost every Government punishment is carried out on the ledger. A punishment is a change of entries (provisional T05-28).

| Step | Punishment | What stays in the ledger |
|---|---|---|
| 1 | Warning | One line in the sentence entry |
| 2 | Ration demotion | The ration grade is lowered one grade for one to three months |
| 3 | Labour sentence | The coldest work (opening entrance shafts, hauling salvage on the surface, breaking riverside ice) for a set number of days |
| 4 | Forced move | The whole household is moved to a shallow, cold station |
| 5 | Sentence strike-off | Erased from the ledger. The token is cut and the person put out of the station |

The death penalty remains as an article in the statute book. But the Government, following the practice from before the Great Blackout, does not carry out executions. There is the sentence strike-off instead. Everyone knows that a person put off the ledger into the winter does not live long. Government people say "we do not kill; we erase" (provisional T05-29).

**The gravest offences** (provisional T05-30).

- Stealing heat and water. Taking more fuel or water than one's share counts as taking the lives of those whose share it was.
- Altering the ledger: forging entries, forging tokens, drawing rations on someone else's token.
- Using official documents as fibre: putting the ledger or old official papers into the fibre-sugar vats. The 01-core 5.3 taboo became law.
- Crossing the river without a seal. Going across the river or trading with people off the ledger without a permit is read as leaving the ledger.
- Fitting a machine to one's body without a permit. See 13.3.

## 8. Strata and inherited work

Basis: Bible 1, row 12 (scarcity made children take over their parents' work, which produced hardened vertical strata); 2.1; 01-core 5.6 (people and hands); 4.3 (Government about 160,000).

The Government did not make work hereditary; it wrote it down. Under scarcity the child of a pump household learned the pump and the child of a clerk learned the ledger. The ledger recorded that as **occupation**, and what was recorded hardened.

### 8.1 Five strata

Strata are assessed by household. The occupation of the head of household is the household's stratum. Shares are of the Government's population of about 160,000 (01-core 4.3) (provisional T05-31).

| Stratum | Who | Share of population | What the ledger gives | What the ledger takes |
|---|---|---|---|---|
| Member houses | Assembly Members and their households, close kin households; the fourteen houses and the President's house | about 0.5% | Sleeping places on deep levels, their own stores outside the ration grades, wood fires, ministers' posts | Their seals for the President, the district's requisition share |
| Civil-servant households | Dong Chiefs, clerks, stationmasters, police officers, ministry staff | about 8% | Sleeping places on the deep-tunnel level, office rations, the right to sit the examination | An accurate ledger; responsibility when the ledger is wrong |
| Army households | Households of career soldiers (NCOs and officers) | about 7% | Army rations, barracks on the inner platform | Their sons' and daughters' career service |
| Skilled households | Pump crews, heat-pump maintenance, fibre-sugar vat keepers, electricians, menders | about 18% | Reduced labour duty, alternative service instead of conscription | Shift work; they cannot leave their occupation |
| Labour households | Entrance workers, salvage and fibre gatherers, light-field workers, porters, fellers | about 66.5% | The largest meal share, one sleeping place | Labour duty, conscription, the coldest work |

People off the ledger are not in this table. Struck-off and whereabouts-unknown people live north of the river too. The Government does not count them. People say there are several thousand in cold surface-level stations and abandoned tunnels (provisional T05-32).

Individuals carry a separate **dependant** mark: children under sixteen, and old and sick people who cannot work. Dependants follow their household's stratum but draw the dependant ration grade (9.2). They are about 30% of the Government's population (provisional T05-33).

### 8.2 Inheritance, rising and falling

- **Succession entry.** On their sixteenth birthday a child is entered under the head of household's occupation. This is called the succession entry. That day the child gets a new token, and the ration grade changes from dependant to the grade of that occupation (provisional T05-34).
- **Civil service examination.** There is only one way up the strata: the civil service examination held by the Ministry of the Interior and Safety every year in the first month of the long-dark half at the Government Complex Seoul. It tests ledger arithmetic and statute articles. Whoever passes has their occupation changed to civil servant, and the household rises to a civil-servant household. A few dozen pass each year. For a labour-household child to study for it, the household must carry that child's labour share (provisional T05-35).
- **Marriage.** Marriage between strata needs the Dong Chief's signature, and the wife or husband moves to the stratum of the head of household. Marriage in a Member house needs the Assembly Member's signature. Marriage between Member houses is the most common way of gathering seals for the next acclamation in advance (01-core 7.1) (provisional T05-36).
- **Falling is easy.** A clerk who gets the ledger wrong goes to a labour household. A forced move (7.3) keeps the stratum and lowers only the sleeping place. A sentence strike-off drops a person out of the strata.

## 9. Taxes and rations

Basis: 01-core 5.3 (Government rationing by ledger tokens, T02-37; fibre sugar about 60%, about 1 kg of fibre per person per day; the taboo on eating official papers); 4.1 (10 L of water per person per day); 3.1 (temperature by depth); 5.6.

### 9.1 Tokens

The Government's money is the **ration token**. The Bank of Korea prints it below its old main building near Hoehyeon station. The unit written on the token is still the **won**. There are four kinds: meal tokens, water tokens, fuel tokens and goods tokens. The Bank of Korea sets the token value as the **notice value**. At the 2126 notice value, a bowl of fibre-sugar porridge (about 600 kcal) is 1,000 won (provisional T05-37). The counting word "meal" (끼) of chapter 03 section 11.1 is one person's day of meal tokens together with a water token for 10 L. At an average of about 2,600 kcal a day (9.2), a meal's meal tokens come to about 4,300 won at the notice value (provisional T09-3).

Tokens are collected monthly by household at the dong centre. They can be exchanged for meals only at the dong centre where the household is registered. In other dongs they can be used only for goods at a market. At market the token's value is always below its notice value (section 10).

Ammunition, power cores and machine parts cannot be bought with tokens, because they are registered goods of the army and the ministries. Chapter 03 sets their price.

### 9.2 Ration grades

| Grade | Who | Daily meal | Water | Other |
|---|---|---|---|---|
| Military service | Serving soldiers and career soldiers | about 3,200 kcal | Apart from the household share, in barracks | Fuel tokens, insect protein every ten days |
| Labour | Working members of labour households | about 3,000 kcal | 10 L per person as part of the household share | Fuel tokens |
| Skilled | Working members of skilled households | about 2,700 kcal | Same | Fuel tokens, one goods token a month |
| Office | Working members of civil-servant households | about 2,400 kcal | Same | Fuel tokens, two goods tokens a month |
| Dependant (child) | Under sixteen | about 1,800 kcal | Same | Counted from the household share |
| Dependant (old, sick) | People who cannot work | about 1,700 kcal | Same | Counted from the household share |

Member houses have no grade; they eat from their own stores. Across the Government's whole population the daily average is about 2,600 kcal per person, which matches the 1 kg of fibre (60% of calories) in 01-core 5.3. When the stores run short the dong centre cuts the office share first, then the dependant share, and the labour and skilled shares last, because the pumps and entrances cannot stop (provisional T05-38).

**Heat is handed out by sleeping depth.** The temperatures by depth in 01-core 3.1 are the heat ration. The deep-tunnel level is for Member houses and civil-servant households, the inner platform for skilled households and army barracks, the outer platform and the side near the concourse for labour households. This is why the place number is the last part of an address (section 5) (provisional T05-39).

### 9.3 Taxes

Taxes are paid not in money but in work, goods and people (provisional T05-40).

| Tax | What | How much |
|---|---|---|
| Labour duty | The time of registered adults (16-60) | One day in seven: opening entrance shafts, clearing snow, gathering fibre, building light-field banks |
| Fibre levy | Paper, cardboard, wood and cotton a household gathers | All delivered to the dong centre and taken back as fibre sugar; the district office sets aside one tenth |
| Produce share | The yield of fibre-sugar vats, mushroom tunnels, light-fields and insect tunnels | One tenth to the district office store |
| Treasury payment | The district office store | One third of what the district office took, to the treasury at the Government Complex Seoul |
| Pitch fee | Market pitches | Daily, in tokens (section 10) |
| Military service | People | Section 14 |

The fibre levy has one taboo. The ledger and old official papers are not fibre. Among papers gathered from old offices, anything bearing a seal is delivered separately to the dong centre and kept by the Ministry of the Interior and Safety. That is why there are years when the Government, which holds the most fibre in Seoul (01-core 5.3), also goes hungriest (provisional T05-41).

What Government people complain about in taxes is not the size but the order. The district office counts taxes before rations. A bad month always falls on the household, never on the store.

## 10. Markets by station

Basis: 01-core 2.2 (Government voice), 5.1 (firewood, salvage), 5.3 (food chain), 5.6, 7.4 (border links). Station names and lines are `map_station` values in `120-map-core.sql`.

The Government runs a ration economy, and markets grow in its gaps. Nobody lives on rations alone, and nobody admits that in front of a clerk. The Government permits markets by district notice, only in the wide concourses of large stations where they can be watched. A trader is a person with a trader entry and pays a pitch fee in tokens every day (provisional T05-42).

| Station | District | Lines | Market |
|---|---|---|---|
| Jongno 3-ga | Jongno-gu | Lines 1, 3, 5 | Token brokers and scriveners who write petitions and moving-in papers for others. The market the Government has looked away from longest |
| Dongdaemun | Jongno-gu | Lines 1, 4 | Clothes mending and used clothes; synthetic-fibre clothes resold (section 11) |
| Dongdaemun History & Culture Park | Jung-gu | Lines 2, 4, 5 | The largest clothes and boots market north of the river, sold by stall households that have kept their pitches for generations |
| Hoehyeon | Jung-gu | Line 4 | Food: insect protein, dried fish, pickled cabbage and turnip, bean sprouts and barley shoots. With the Bank of Korea right above, the market value of the token is set here |
| Seoul Station | Jung-gu | Lines 1, 4, Airport Railroad, Gyeongui-Jungang, GTX-A | The licensed traders' waiting post: the only place on Government land where a trader from across the river may stay under a temporary entry. Salvaged parts and tools change hands |
| Gongdeok | Mapo-gu | Lines 5, 6, Airport Railroad, Gyeongui-Jungang | Parts and tools from across the river that came in through the Mapo tunnel. A market the OMO Party protects |
| Wangsimni | Seongdong-gu | Lines 2, 5, Gyeongui-Jungang, Suin-Bundang | Salvaged metal, track parts, cable |
| Cheongnyangni | Dongdaemun-gu | Line 1, Gyeongui-Jungang, Gyeongchun, Suin-Bundang | Fuel: methane tanks, charcoal, salvage firewood. A shallow, cold concourse, so trade is quick and loud |
| Jegi-dong | Dongdaemun-gu | Line 1 | Mushrooms and dried herbs |
| Sangbong | Jungnang-gu | Line 7, Gyeongui-Jungang, Gyeongchun | Meat and hides of hunted animals (which animals, chapter 02) |
| Yeonsinnae | Eunpyeong-gu | Lines 3, 6, GTX-A | Bukhansan firewood. Servants of Member houses buy the wood for wood fires here |
| Chang-dong | Dobong-gu | Lines 1, 4 | Machine parts stripped from the Chang-dong depot |
| Nowon | Nowon-gu | Lines 4, 7 | Light-field vegetables and seed |
| Konkuk Univ. | Gwangjin-gu | Lines 2, 7 | Fish caught through holes in the river ice |

(provisional T05-42)

After tokens, the things most used at market are goods that last and keep their value: needles, thread and salt. Salt is not produced in Seoul and grows scarcer every year (01-core 5.3). The Government tries to tie market prices to the notice value, but cannot stop the Hoehyeon market's value from sinking below it (provisional T05-43).

## 11. Clothing

Basis: 01-core 3.1 (surface -18 °C, platform 8-14 °C), 5.3 (fibre is food), 7.1; Bible 2.1.

**Fibre to wear and fibre to eat.** In Seoul cotton, paper and wood are food (01-core 5.3). So the clothes Government people wear are made of inedible fibre: pre-Blackout synthetic-fibre clothes taken apart and remade. Making new cotton clothes takes from the meals, so only Member houses do it. Clothes are handed down inside the household, and worn-out synthetics become the wadding of quilted clothes (provisional T05-44).

**Shape.** The same everywhere: a long quilted coat, felt or synthetic-rubber boots, a cap with ear flaps, a face cover. Inside the platform people take off the coat and live in a quilted vest. The Government's colour is **navy**. Official clothes are dyed navy or carry a navy band (provisional T05-45).

**Clothes show the entries.** The marks worn by stratum and title are set by notice (provisional T05-46).

| Post | Clothes | Mark |
|---|---|---|
| President for Life | Long navy coat, cotton lining | The phoenix emblem; the emblem of the President of the Republic of Korea survived |
| Assembly Member | Dark navy coat, animal-fur collar | The gold badge on the left lapel; the Assembly Member's badge survived |
| Member house | Cotton lining, fur collar, leather boots. Light-coloured clothes mean one rarely goes to the surface | Buttons cut with the house seal |
| Minister, ministry civil servant | Navy quilted coat | The civil-servant ID worn round the neck, one more beside the registration token |
| Dong Chief, dong centre clerk | Quilted coat with a navy band | Civil-servant ID and a seal pouch |
| Stationmaster | Navy coat and the old subway station staff cap | The station-name band on the cap |
| Police officer | Navy coat with reflective bands | Police rank insignia |
| Army | Pre-Blackout camouflage winter uniform, remade | Army rank insignia (private to general); service-number token |
| Skilled household | Grey quilted work clothes | Occupation patch sewn on the left breast |
| Labour household | Wadded quilted jacket, wadded trousers | Occupation patch; on labour-duty days the pre-Blackout orange work vest worn over it |
| Dependant | Clothes handed down in the household | Children wear a cloth name tag with their name and the head of household's number |
| Off the ledger | Whatever can be found | No mark. The needle holes where an occupation patch was torn off, "the torn place", let people recognise the struck-off |

## 12. The daily clock

Basis: 01-core 3.2 (the long-light half and long-dark half; underground light is rationed and a station's day divides into lights-on and lights-off), 3.3 (entrances), 3.5 (blizzards).

The Government keeps Korea Standard Time. The reference clock at the Government Complex Seoul sends the time to each district office by tunnel telephone twice a day, and the district offices announce it to every station with the civil-defence siren. The Government's day begins and ends with a siren (provisional T05-47).

| Time | What happens |
|---|---|
| 05:30 | First shift rises. Platform lights come on at half |
| 06:00 | Lights-on siren (one long blast). National ceremony in front of the dong centre (13.1). First shift begins |
| 07:00 | Morning ration |
| 08:00 | In the long-dark half the entrances open now; in the long-light half they open at 06:30 |
| 09:00-17:00 | Dong centre petition windows. Civil servants work days only |
| 12:00 | Noon siren (two short blasts) |
| 14:00 | Second shift begins |
| 16:00 | In the long-dark half surface work ends and the entrances close; in the long-light half at 19:00 |
| 17:00 | Evening ration |
| 22:00 | Lights-out siren (two long blasts). Platform lights go off. Third shift begins; only pumps, heat and entrance watch run |

(provisional T05-47)

- Pumps, heat and watch never stop, so there are three shifts of eight hours. Members of labour and skilled households often stand different shifts and take turns on one sleeping place.
- When a blizzard comes the stationmaster issues "surface work stopped", sounded as three short blasts. That day's surface labour becomes indoor labour. Anyone outside when the entrance closes waits for the next shift in the shelter niche inside the entrance shaft (provisional T05-48).
- One day in seven is a labour-duty day (9.3). The name Sunday survives, but it is not a day off. Each dong has a different duty day, so all dongs are never empty at once (provisional T05-49).

## 13. Faith and rites

### 13.1 The national ceremony

Basis: Bible 1, row 9 (the Arc replaces every earlier religion); 2.1; 01-core 3.7 (how Government people explain the winter).

The Government has no state religion; the Constitution's separation of religion and state stands. In its place, Government people's day has the **national ceremony**. After the morning lights-on siren, in front of the dong centre, people salute the national flag, sing the first verse of the national anthem and hold a moment of silence. It takes a minute. The silence is for the people given a death strike-off in the past day; the Dong Chief reads their names (provisional T05-50).

Government people's belief is mostly a belief in the ledger: that the winter counts people, and that keeping to quota keeps it from tightening further (section 2). The Government does not call this faith. It calls it administration.

### 13.2 Yearly rites

- **Disaster Day.** The Government does not know the exact date of the Great Blackout (Bible section 3, Q2). So it made the shortest day of the year Disaster Day. At noon that day every Government station in Seoul sounds a long siren and holds three minutes of silence (provisional T05-51).
- **The New Year's Eve bell.** On the night the year turns, the Bosingak bell, moved down and hung in the concourse of Jonggak station, is struck thirty-three times. The President strikes the first. The sound is carried to each district office by tunnel telephone (provisional T05-52).

### 13.3 The Government's position on the Arc and baptism

Basis: Bible 2.3 (baptism is replacing parts of the body with machines); Bible 1, row 14 (cyberware is kept alive only with access to maintenance and power); 01-core 5.6 (the Government has almost no machine bodies and relies on the Arc); 7.4 (fear that ledger soldiers are drawn to baptism).

- The Government ledger records the Arc as an **off-the-ledger body** (01-core section 9, row 2123-2125). Joining the Arc is joining an off-the-ledger body.
- Yet the Government has nowhere to mend electrically driven machine bodies. Government fitting clinics (about six surgery rooms and one clean room, chapter 03 section 4.2) can set fixing points and fit body-powered hands and feet, but to fit and maintain an electrically driven machine there is no choice but to rely on the Arc's maintenance benches. The Government solves this with **machine-body registration**. Someone fitted with a machine under a Ministry of Health and Welfare permit has "machine body" and the place of maintenance written in their entries, and on permitted days only they pass the under-river tunnel checkpoint to the Arc's maintenance bench (provisional T05-53).
- Fitting a machine without a permit, and receiving the Arc's baptism (receiving it as faith, as Arc people do), are matters for a strike-off hearing. The Government separates fitting a machine from being baptised on paper: a permitted machine is medicine; baptism is joining an off-the-ledger body. Few Government people are sure the two are really different (provisional T05-54).
- So the army dislikes nothing more than a soldier getting a maintenance permit. Several times a year a soldier who went to a maintenance bench does not come back.

### 13.4 Death

Basis: 01-core 5.5 (nothing rots in the cold; funerals differ by faction and are decided by chapters 04-06), 5.3 (the fibre taboo).

- When a person dies, the head of household files a death report at the dong centre and the Dong Chief draws the red line of the death strike-off. At the next morning's national ceremony the name is read in the silence.
- Bodies do not rot. Every district has a designated **snow burial field** on the surface, and a labour-household burial crew carries the body there by sled and buries it in the snow. The place number in the burial field is written in the death strike-off entry. Jungnang-gu people are buried in the Mangu burial field (provisional T05-55).
- People of Member houses and people who did service to the state are buried at the site of the April 19th National Cemetery in Gangbuk-gu, the national cemetery of the Republic of Korea that remains north of the river. The Seoul National Cemetery at Dongjak-dong lies across the river, and for a hundred years the Government has buried nobody there (provisional T05-56).
- Bodies and the clothes of the dead are not put into fibre-sugar vats. With the taboo on official papers, this is the Government's oldest taboo (provisional T05-57).

## 14. The national army: doctrine and conscription

Basis: Bible 2.5 (D3: one army, one commander, who commands every squad; a separate roster per faction, with deliberate gaps as identity; figures only in SQL); Bible 1, rows 5 and 15 (weapons exist but are scarce); 01-core 6.3 (the edge of the outside machines), 7.4 (why the river divides), section 9 row 2076-2085 (the failed 2079 attack over the ice and the under-river tunnel checkpoints).

### 14.1 Command structure

The Government's army is the **national army**: the Republic of Korea Armed Forces shrunk, keeping their name and ranks (provisional T05-58).

| Body | Seat | What it does |
|---|---|---|
| Ministry of National Defense | Samgakji, Yongsan-gu | Registration of conscripts and reservists, ammunition registration, army rations. The minister is appointed by the President |
| Capital Defense Command | Samgakji, Yongsan-gu, in the same building as the Ministry | The Government's field army. Its headquarters at the Great Blackout was at Namtaeryeong across the river; when the river froze it moved to the Ministry building at Samgakji. Has direct units guarding the three under-river tunnel checkpoints and the north ends of the bridges. The commander is appointed by the President |
| District units | Each district office | Raised by the Assembly Member from the district's conscripts and reservists. The commander is recommended by the Assembly Member and appointed by the Ministry. Guard stations, entrances and watch posts on the mountain edge |
| Korea Military Academy | Hwarangdae, Nowon-gu | Trains army-household children as officers |

In the quota table (16.2), the Capital Defense Command's direct troops who guard the under-river tunnel checkpoints and the bridge ends are counted in the "army (...)" entry of the district where the facility stands. The "Ministry of National Defense and Capital Defense Command" entry in the Yongsan-gu row is the people at the Samgakji building (provisional T05-58).

### 14.2 Signed command: one commander holds every squad

**[Approved]** One army has one commander, and that commander commands every squad in the army. No squad has the authority to move on its own (Bible 2.5, D3).

The Government reads this principle as signing. An army's **operation order** carries a single seal: the commander's. A squad leader carries the order to the squad; a squad leader does not give orders. A squad leader who moves on their own judgement has done something not in the order, and that is a matter for army discipline, not a petition hearing. So Government armies are slow but do not scatter. When a commander falls, the squads hold where they are until the next commander's seal arrives (provisional T05-59). On the battlefield the temporary squad leader of `roster-framework.md` section 10.5 takes over, but in a Government army that leader cannot give move orders and can only order "hold where you are" (chapter 09 section 7, item 6, provisional T09-1).

Individually resolved combat (duels and fights between heroes) stays separate from this principle (Bible 2.5).

### 14.3 Conscription and service

- **Conscription.** Registered people who turn nineteen, men and women alike, serve eighteen months. The pre-Blackout Republic of Korea conscripted only men; the Government, short of people, calls up women too. The Ministry of National Defense registers conscription, and service is mostly in the conscript's own district unit (provisional T05-60).
- **Alternative service.** Core occupations of skilled households (pump crews, intake maintenance, heat-pump maintenance) do not carry rifles; they work eighteen months at the intakes or the bridge wind frames. A pump is worth more than a rifle (provisional T05-61).
- **Reserve and civil defence.** After service people are reservists until forty. In a crisis the district unit calls up its reservists. From forty to fifty they are civil defence, which clears entrance snow and handles sirens and shelter (provisional T05-62).
- **Career soldiers.** NCOs and officers come from army households. An army-household child is entered in an army occupation by succession entry at sixteen, and a child who will be an officer studies two years at the Korea Military Academy at Hwarangdae (provisional T05-63).
- **Size.** In 2126 the Government's standing force is about 4,000 career soldiers and about 2,500 serving conscripts. About 20,000 reservists can be called up. There is not that much ammunition (provisional T05-64).

### 14.4 Doctrine

How Government armies fight comes down to five lines (provisional T05-65).

1. **It is an army that holds.** Most of what Government armies do is hold: the checkpoints of the three under-river tunnels (Mapo-Yeouinaru, Gwangnaru-Cheonho, Seoul Forest-Apgujeong Rodeo), the north ends of the seven bridges, and watch posts on the northern mountains (Bukhansan, Dobongsan, Suraksan, Buramsan) looking over the edge of the outside machines. A checkpoint looks at the ledger. A soldier checks a token before a rifle.
2. **It does not cross the river as an army.** Not since the attack over the ice was broken by a blizzard in 2079 (01-core section 9). When there is cause to strike across the river, it goes by tunnel. That is why the three tunnels are the board of the Government's wars (01-core 7.4).
3. **It fights with numbers.** The Government has the most people in Seoul. Its lines of riflemen are thick, and a broken line is refilled with reservists.
4. **Every round is registered.** Ammunition is a registered good of the Ministry of National Defense. A soldier returns a casing for every round fired, and a round not returned stays in the sentence entry. The pre-Blackout army's casing return became law under scarcity.
5. **There are no machine-bodied soldiers.** Government armies have no unit made of soldiers fitted with machines, because the only place to maintain electrically driven machines is the Arc (13.3). Only the Capital Defense Command has a few drones that fly in battle, flown only on the commander's signature. The Government's other drones are watching drones used by ministries and district offices (chapter 03 section 6.1).

### 14.5 Gaps to hand to the roster

Bible 2.5 decided that the deliberately empty slots of each faction's roster are its identity. The Government roster's gaps are these. Task 20 rewrites the unit names and figures in one place, `data/sql/130-units-government.sql`; this chapter writes no figures (provisional T05-66).

- No machine-body unit (14.4, item 5).
- No hired unit. The Government does not take people off the ledger into the army.
- Thin engineering and maintenance. The hands that mend bridges and tunnels are borrowed from the Free Cities through the water supply contract (01-core 5.2).
- Plenty instead: conscript infantry and reservists, checkpoint garrisons, mountain-edge scouts, and the Capital Defense Command's direct riflemen and mortars.

## 15. The Government before the third water supply contract

Basis: Bible 1, row 11 (winter 2126, before the third water supply contract); 01-core 5.2 (the water supply contract, a thirty-year term, the Arc sits for the first time at the third, T02-33 and T02-34), 7.1 (the two parties split at every water supply contract), 7.4; item 5 of section 11 (chapter 04 writes the Government's negotiating position).

To the Government the water supply contract is a question of the ledger before it is a question of water. The Government does not record across the river as a country. Yet a contract is the exchange of seals. Since the first contract the Government has resolved this contradiction this way: the Assembly does not ratify the contract. The Ministry of Climate, Energy and Environment makes a "maintenance service annex" for each facility, the Assembly Member of the district where the facility stands stamps it too, and the President signs. The cities across the river are recorded as work crews contracted for the service. In the ledger they are not countries but workers (provisional T05-67).

**What the Government wants** (provisional T05-68).

- One more well and one more deep-level fan at Seoul Station (01-core 4.2).
- A full overhaul of the Guui and Ttukdo intake pumps. The thirty-year cycle has come round.
- Deeper wells. The groundwater level falls every year (01-core 5.2).

**What the Government offers.** The intake sites and old mains, hands (labour secondment), Bukhansan and Dobongsan firewood, copper and cable from the old city centre. Labour secondment collides with the ledger, because a registered person who leaves their registered station is struck off. So for each contract the Government keeps a separate **secondment entry**. A person with a secondment entry is still registered while across the river (provisional T05-69).

**The Arc sits for the first time.** At the third contract the Arc, which holds the Jamsil weir power and the Amsa intake, takes a seat (01-core 5.2). The two parties split here (provisional T05-70).

- The **OMO Party** wants an annex with the Arc too. The north-end turbines of the weir are in Gwangjin, so even half the power has to be run together. The Assembly Members of the four districts that touch the Han and of Jung-gu and Seodaemun-gu, that is the six OMO Party Members, are on this side. Seodaemun-gu does not touch the river, but it is the first district to go hungry if goods from across the river stop coming through the Gongdeok market, so it stands here.
- The **Claw Party** wants not even an annex with the Arc. If the ledger stamps a seal for an off-the-ledger body, ledger soldiers will read it as the ledger accepting baptism. The Assembly Members of the eight inland districts are on this side.
- The Claw Party has more seats, but the bridges, tunnels and intakes the contract rests on are all in OMO Party districts. An annex is not a statute, so it does not go through an Assembly vote. The Claw Party's only way to block an annex is the President's signature. So the third contract turns into a fight over whether the President signs once the Gwangjin Assembly Member has stamped the weir's north-end annex. A President acclaimed by fourteen seals loses half the Members the next day whichever side the President takes.

## 16. Where the 504 sit: role-quota table by district

Basis: Bible 2.1, 2.4 (14 Government districts), section 6 (named-person exceptions), section 9 Q7, Q26, Q27, Q28, Q29, Q30; 01-core 4.3 (station classes and population), 8.1 (title ladder), items 7 and 10 of section 11. Plan task 8 description ("faction_id keeps the base value ... government 504").

### 16.1 How this table was made

- The Government's people are the 504 with faction_id government in `050-wiki-people.sql`. Their current stage distribution is Key 9, S1 44, S2 105, S3 54, S4 292. This table keeps those stage totals, so that task 17 can give everyone a place without changing anyone's stage (provisional T05-71).
- The current data carries almost no usable district. Fewer than ten of the 504 have a district recorded; the rest carry retired old-polity numbers or just "government". So the district counts are not old places moved over; they were built anew. All roles were built anew too.
- The district counts were built from three parts. (1) A base of fourteen per district (Assembly Member, Member house, district office, Dong Chief, Stationmaster, dong centre, police, army, skilled work and labour, market, health, dependants). (2) A share proportional to district population. District population is the 153 stations in map_station with Government surface control and a line, each multiplied by the midpoint of its 01-core 4.3 station-class range (small station 400-800: 600; interchange 1,500-3,200: 2,350; large interchange complex 3,000-5,000: 4,000), scaled to the Government's 160,000. One-line stations were counted as small stations, two-line stations as interchanges, stations with three or more lines as large complexes. (3) Additions for the national institutions (Jongno, Jung, Yongsan) and the river border units (Mapo, Seongdong, Gwangjin). District population is the ground the table was built on; the counts are not exactly proportional to it (provisional T05-72).
- map_station has 157 entries under Government surface control; that is the "157 Government stations" of 01-core 4.3. Of these, four entries with no lines (two monorail platforms, one hotel-named entry, and Sinchon (underground)) were not counted as stations people live in. So this table has 153 stations.

| District | Stations (with lines) | Estimated population |
|---|---|---|
| Jongno-gu | 13 | about 15,900 |
| Jung-gu | 14 | about 20,900 |
| Yongsan-gu | 12 | about 12,400 |
| Mapo-gu | 13 | about 17,200 |
| Seongdong-gu | 11 | about 10,300 |
| Gwangjin-gu | 9 | about 7,800 |
| Dongdaemun-gu | 9 | about 10,600 |
| Jungnang-gu | 10 | about 12,800 |
| Seongbuk-gu | 13 | about 12,800 |
| Seodaemun-gu | 7 | about 5,200 |
| Eunpyeong-gu | 11 | about 10,200 |
| Gangbuk-gu | 11 | about 5,800 |
| Dobong-gu | 6 | about 6,200 |
| Nowon-gu | 14 | about 11,900 |
| **Total** | **153** | **about 160,000** |

(provisional T05-72)

### 16.2 The quota table

People is the number of persons living (registered) in the district. The stage columns are that district's count per stage. The numbers in "Title and occupation mix" add up to the row's people (provisional T05-73).

| District | People | Key | S1 | S2 | S3 | S4 | Title and occupation mix |
|---|---|---|---|---|---|---|---|
| Jongno-gu | 67 | 3 | 13 | 15 | 8 | 28 | Office of the President (President for Life, chief of staff, secretaries, guards) 7; National Assembly (Secretary General of the Assembly, the two party secretaries general, Assembly clerks) 6; six ministries and the Korea Forest Service at the Government Complex Seoul (ministers, the Forest Service head, vice-ministers, ministry clerks) 18; Assembly Member 1; Member's house 3; district office 3; Dong Chief 2; Stationmaster 3; dong centre clerk 4; police officer 2; army 5; skilled work and labour 6; market trader 5; health 1; dependant 1 |
| Jung-gu | 57 | 1 | 4 | 12 | 7 | 33 | National Intelligence Service (Director, staff) 5; Bank of Korea (Governor, token printers) 6; Seoul Station stationmaster's office 4; Assembly Member 1; Member's house 3; district office 3; Dong Chief 2; Stationmaster 3; dong centre clerk 5; police officer 2; army 6; skilled work and labour 9; market trader 6; health 1; dependant 1 |
| Yongsan-gu | 41 | 2 | 3 | 9 | 4 | 23 | Ministry of National Defense and Capital Defense Command (minister, commander, staff, direct troops) 9; Assembly Member 1; Member's house 3; district office 2; Dong Chief 1; Stationmaster 2; dong centre clerk 2; police officer 1; army (Ichon and Yongsan bridge ends) 10; skilled work and labour 6; market trader 2; health 1; dependant 1 |
| Mapo-gu | 45 | 1 | 2 | 9 | 5 | 28 | Assembly Member 1; Member's house 3; district office 3; Dong Chief 2; Stationmaster 2; dong centre clerk 3; police officer 2; army (Mapo tunnel checkpoint, Hapjeong and Digital Media City bridge ends) 11; skilled work and labour 9; market trader 5; health 2; dependant 2 |
| Seongdong-gu | 33 | 1 | 2 | 6 | 4 | 20 | Assembly Member 1; Member's house 3; district office 2; Dong Chief 1; Stationmaster 2; dong centre clerk 2; police officer 1; army (Seoul Forest tunnel checkpoint, Oksu bridge end) 6; skilled work and labour (Ttukdo intake) 8; market trader 4; health 1; dependant 2 |
| Gwangjin-gu | 29 | 1 | 2 | 6 | 4 | 16 | Assembly Member 1; Member's house 3; district office 2; Dong Chief 1; Stationmaster 1; dong centre clerk 2; police officer 1; army (Gwangnaru tunnel checkpoint, Gangbyeon and Jayang bridge ends, north end of the weir) 9; skilled work and labour (Guui intake, north-end turbines of the weir) 6; market trader 2; dependant 1 |
| Dongdaemun-gu | 31 | 0 | 2 | 6 | 3 | 20 | Assembly Member 1; Member's house 3; district office 2; Dong Chief 1; Stationmaster 2; dong centre clerk 3; police officer 1; army 4; skilled work and labour 7; market trader (Cheongnyangni, Jegi-dong) 5; health 1; dependant 1 |
| Jungnang-gu | 33 | 0 | 2 | 7 | 3 | 21 | Assembly Member 1; Member's house 3; district office 2; Dong Chief 2; Stationmaster 2; dong centre clerk 3; police officer 1; army 5; skilled work and labour (incl. the Mangu burial field) 8; market trader 3; health 1; dependant 2 |
| Seongbuk-gu | 34 | 0 | 2 | 7 | 3 | 22 | Assembly Member 1; Member's house 3; district office 2; Dong Chief 2; Stationmaster 2; dong centre clerk 3; police officer 1; army (watch posts toward the Bukhansan edge) 6; skilled work and labour 7; market trader 2; health and school 3; dependant 2 |
| Seodaemun-gu | 22 | 0 | 2 | 5 | 2 | 13 | Assembly Member 1; Member's house 3; district office 2; Dong Chief 1; Stationmaster 1; dong centre clerk 2; police officer 1; army 4; skilled work and labour 5; market trader 1; dependant 1 |
| Eunpyeong-gu | 30 | 0 | 2 | 6 | 3 | 19 | Assembly Member 1; Member's house 3; district office 2; Dong Chief 1; Stationmaster 2; dong centre clerk 2; police officer 1; army (watch posts toward the Bukhansan edge) 6; skilled work and labour (Bukhansan firewood) 8; market trader (Yeonsinnae) 2; health 1; dependant 1 |
| Gangbuk-gu | 23 | 0 | 2 | 5 | 2 | 14 | Assembly Member 1; Member's house 2; district office 2; Dong Chief 1; Stationmaster 2; dong centre clerk 2; police officer 1; army (watch posts toward the Bukhansan edge) 5; skilled work and labour (incl. the April 19th National Cemetery burial field) 5; market trader 1; dependant 1 |
| Dobong-gu | 24 | 0 | 2 | 5 | 3 | 14 | Assembly Member 1; Member's house 2; district office 2; Dong Chief 1; Stationmaster 2; dong centre clerk 2; police officer 1; army (watch posts toward the Dobongsan edge) 5; skilled work and labour (Chang-dong depot, Dobongsan firewood) 6; market trader 1; dependant 1 |
| Nowon-gu | 33 | 0 | 2 | 7 | 3 | 21 | Assembly Member 1; Member's house 3; district office 2; Dong Chief 1; Stationmaster 2; dong centre clerk 2; police officer 1; army (Korea Military Academy at Hwarangdae, edge toward Suraksan and Buramsan) 9; skilled work and labour 7; market trader (Nowon) 2; health 1; dependant 2 |
| Gangnam-gu (registered people living outside the ledger land) | 2 | 0 | 2 | 0 | 0 | 0 | registered household living in Nonhyeon 2-dong (bible section 6, Q30) 2 |
| **Total** | **504** | **9** | **44** | **105** | **54** | **292** | |

The Gangnam-gu row is not Government land. Bible section 6 keeps Sin Jong-mok's (person-1009) Gangnam residence and Nonhyeon 2-dong, and the Q30 default keeps his faction as Government. Sin Jun (person-1010) is taken as the same household. In the Government ledger the two are registered people with a secondment entry (section 15). If the Q30 answer changes, this row moves to the Arc quota table (provisional T05-74).

The assignment of chapter 07 section 3.2 adds no one to the Government. The three who stay unaffiliated (Jo Jaepyo, I Yeon, Cha Yu-seon) are written into task 17's input file but belong neither to these 504 nor to the quota tables of the other two factions. The three factions and the unaffiliated add up to 504 + 194 + 321 + 3 = 1,022 (basis: chapter 07 section 3.3).

### 16.3 Roles and stages

How each role of the quota table splits into stages is as follows. Task 17 splits a row's per-role counts into stages by this rule (provisional T05-75).

| Role | Stage |
|---|---|
| President for Life | Key |
| Assembly Member | Key in the four districts that touch the Han (Mapo, Yongsan, Seongdong, Gwangjin); S1 in the other ten districts |
| Commander of the Capital Defense Command (Yongsan), Director of the National Intelligence Service (Jung) | Key |
| Copyist of the master resident register at the Ministry of the Interior and Safety, head of the medical corps of the Ministry of Health and Welfare (both Jongno, in the Government Complex Seoul ministries slot) | Key |
| Ministers (the six ministries at the complex and National Defense), Korea Forest Service head, Governor of the Bank of Korea, presidential chief of staff, Secretary General of the Assembly, the two party secretaries general, Seoul Station stationmaster | S1 |
| Member house | One heir S1. One spouse or kin S2 (none in Gangbuk and Dobong). One house child S4 |
| District office | One Head of the District Office: S1 in the four districts whose Assembly Member is Key, S2 elsewhere. District office clerks S3 or S4 |
| Dong Chief, Stationmaster | S2 |
| Vice-ministers, ministry directors, senior staff of the Intelligence Service and the Bank of Korea, presidential secretaries | S2 |
| District unit commanders, Capital Defense Command staff | S2 |
| Squad leaders, senior clerks, skilled crew leaders, head market traders, health post heads, school teachers | S3 |
| Soldiers, clerks, police officers, workers, traders, health workers, guards, token printers, dependants | S4 |

### 16.4 Default places for named people

People waiting on the owner's answer are placed at that question's default. If the answer differs, task 17 follows it.

| Person | Default place | Question |
|---|---|---|
| Yun Seo-rin (person-0145) | Jongno-gu, President for Life (Key) | Q28, default yes |
| Oh Hae-rin (person-0195) | Jung-gu, Director of the National Intelligence Service (Key); title "원장" kept | Q7, default yes |
| Baek On (person-0246) | Jongno-gu, copyist of the master resident register at the Ministry of the Interior and Safety (Key); the old religious post is removed | Q26 |
| Ryu Eunbi (person-0323) | Jongno-gu, head of the medical corps of the Ministry of Health and Welfare (Key) | Q27 |
| Go Seojun (person-0349) | Candidate holder of the duchy of his base district, that is, candidate for that district's Assembly seat; if that district's Assembly Member is Key, he uses the Key slot | Q29 |
| Sin Jong-mok (person-1009), Sin Jun (person-1010) | The Gangnam-gu row (16.2) | Q30, Q8 |

(provisional T05-76)

### 16.5 Rules for using the table

- The stage totals (Key 9, S1 44, S2 105, S3 54, S4 292) and the total of 504 do not change.
- To gather family and clan (fixed facts) into one household, task 17 may raise or lower one district's count by up to 2. It then takes or adds the same number of the same stage in another district to keep the totals, and writes it in the ledger (provisional T05-77).
- If chapter 07 puts any of the 8 independents into the Government, that person is added on top of this table, written as "added" in the row of the district they live in (plan task 8 description).
- Age must fit role. Minimum ages by role are set by chapter 07. This chapter only sets Assembly Members and ministers at eighteen or older (provisional T05-78).
- Roles with many people (ministers, Assembly Members, Member houses) are far thicker than their real population share (8.1). The table picks the people of the story; it is not the population scaled down.

## 17. Private setting

> **Private.** This subsection is for design. Do not carry it into the public wiki, public in-game text or the showcase.

- **What the National Intelligence Service is.** The old data's description of Oh Hae-rin contains material about the National Intelligence Service and an AI. Whether it stays (Q7) and how an intelligence-service AI relates to the First AI (Q15) wait on the owner's answer; this chapter does not decide them. Public text goes only as far as the sentence in section 4 ("whose signature the Service answers to is unclear even inside the Government").
- **Quota and the winter.** Seen through "what the ratchet measures" in 01-core 6.4 (the heat of inhabited places), the Government's belief in quotas (sections 2 and 5) is half right. The Government does not know this and believes that counting people stops the winter. Public text writes it only as the belief of Government people (provisional T05-79).
- Q12 matters (the sanctuary's location, who selects brains, the first brain, who reads the output) are not handled in this chapter.

## 18. Where this chapter extends 01-core

This chapter changed no 01-core decision. The following are places where it decided something 01-core left open, or added detail to a 01-core term. All are provisional.

| 01-core | What this chapter adds | Ledger |
|---|---|---|
| 2.4 "fourteen seals" (T02-2) | Acclamation succeeds only with all fourteen seals (unanimity). The oldest Assembly Member presides and is acting President | T05-5, T05-6 |
| 7.1 "the next acclamation opens only when the President dies" | The seat of an Assembly Member who becomes President is handed down to that house's heir | T05-7 |
| 8.1 ladder (Stationmaster, Dong Chief, Assembly Member, National Assembly, President for Life) | Posts outside the ladder: Head of the District Office, minister, Secretary General of the Assembly, party secretary general. They hold no land, so "no separate tier between district and dong" (T02-67) stands | T05-10, T05-15, T05-21 |
| 7.1 "the district office is the office of the Assembly Member's house" | The Head of the District Office's post and the signing line | T05-21, T05-24 |
| 3.7 "the winter stopped when the ledger was brought within quota" | Station quotas, birth reports, and moving-in orders when a station is over quota | T05-19 |
| 2.4 "leaving one's registered station means being struck off" (T02-4) | A thirty-day grace (whereabouts unknown), and the moving-in report with three seals as the lawful way to move | T05-18, T05-20 |
| 5.3 "the ledger and old official papers are not eaten" | The taboo became law (a gravest offence). Sealed papers are delivered separately. Bodies and the clothes of the dead are not eaten either | T05-30, T05-41, T05-57 |
| 5.5 "funerals are decided by chapters 04-06" | The Government's death strike-off, snow burial fields, the April 19th National Cemetery site | T05-55, T05-56 |
| 7.1 OMO Party and Claw Party lines (T02-50) | Seats 6:8 and their assignment by district; the two parties' positions at the third contract | T05-11, T05-70 |
| 7.1 "the two parties split at every water supply contract" | The Assembly does not ratify water supply contracts: a ministry annex per facility, the seal of that district's Assembly Member, the President's signature | T05-67 |

## 19. What is handed to later chapters

1. Chapter 07 (task 8) puts the per-role stage rule of 16.3 and the table rules of 16.5 into the people-placement rules. Chapter 07 may raise the minimum age of eighteen for Assembly Members and ministers.
2. Task 17 places the 504 by the 16.2 quota table. Role names use the Government titles (01-core 8.1) and the post names of this chapter.
3. Task 20 rebuilds the Government roster from the gaps of 14.5 and the doctrine of 14.4. The current `130-units-government.sql` uses pre-v3 names and is rewritten in full.
4. Chapters 05 and 06 match the Government's position in section 15 (the annex method, secondment entries, the split between the two parties) against their own sides.
5. Chapter 02 decides the animals of the Sangbong market and the threats on the northern mountain edge; chapter 03 decides the prices of ammunition and parts and the reality of machine-body maintenance. This chapter does not write those values.
6. Task 9 gathers this chapter's provisional items (T05-1 to T05-79) into the ledger.
