-- Wiki articles (Markdown bodies, English and Korean)
-- Source of truth: edit via scripts/pages/rewrite-doc.mjs (data/sql is canonical; the archived export-sql.mjs is not a sync path).

INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Ailments', 'Ailments of the Cold', '추위의 병', 'ailments', 0, '## The cold kills first

In the eternal winter of Seoul, what kills most people is neither beast nor machine but cold. The yearly average on the surface is minus 18 degrees; in the short-day half of the year it averages minus 25, and on a blizzard night it falls to minus 38. The platform level where people live is a warm 8 to 14 degrees and the deep tunnel level 12 to 16, but the concourse near the entrances is 0 to 6. Most illness in Seoul grows out of these differences of depth.

## Frostbite and hypothermia

**Frostbite.** Fingers, toes, ears and the tip of the nose freeze first. At first they turn white and hard and lose feeling; thawed, they swell and blister. Flesh frozen deep dies black and must be cut away. People in Seoul who have lost fingers or a foot are not rare. A limb lost this way is often the first reason a person has a machine fitted to the body.

**Hypothermia.** Cooling to the core. First comes shivering, then slow speech and clumsy hands, and at last the shivering stops and sleepiness comes. A person who has stopped shivering is already in danger. Seoul people teach their children, "Do not let someone who has stopped shivering fall asleep."

The place where cold kills most is the road to dig fibre. Fibre-digging crews walk 1 to 3 kilometres over the snow from their station to dig into buried offices and warehouses. Caught by a blizzard on that road, they do not come back. A blizzard, once it comes, lasts two to four days, with wind above 25 metres a second. So all three polities stop surface work when a blizzard comes. Surface workers go up in twos or more, and in the long-dark half no one stays on the surface longer than two hours at a time.

**Where metal meets flesh.** People who wear machines have one more cold wound. Metal freezes faster than flesh. On the surface, frostbite sets in at the fixing point where machine meets flesh. Surface workers must wrap their fixing points. One day forgetting the wrap becomes a whole half-year''s wound.

## Foul air in deep stations

The deeper, the warmer; the deeper, the harder to breathe. How many people a station can hold is set by the smallest of four limits: space, heat, water and air. Each person needs 3 litres of outside air a second. In winter the difference in temperature between the warm station and the cold outside moves air of its own accord, but only as far as entrances and vents are open. The deep levels need fans, and fans eat electricity.

The sickness of a station short of air comes slowly. Heads are heavy in the morning, people are drowsy even by day, and the slightest effort leaves them short of breath. Children, the old and the sick tire first. Seoul children learn, alongside how to climb an entrance ladder and not to touch wires, "how to tell when the air is going bad" before anything else. When a fan stops or a blizzard blocks the entrances, the Stationmaster, the Station Foreman or the Bench Keeper empties the beds on the deep level first.

People''s breath is not the only thing that fouls the air.

- **Methane.** Cooking is done with gas from fermented dung and food waste. A leaking methane tank gives headaches, and gathered gas explodes.
- **Burning scrap.** Burning things with poisonous smoke, such as plastic sheeting, tyres and asphalt, is done only in the exhaust shafts above the concourse. Burning such things on a platform makes people collapse.
- **Powder smoke.** Firing a powder gun leaves smoke and poisonous gas. So none of the three polities fires powder guns on the platform level where people live.

## Fibre-sugar sickness

About 60% of the calories in Seoul''s meals come from fibre sugar and yeast. Shredded paper, cardboard, wood and cotton are fermented with mushroom enzymes into sugar water, and part of it raises yeast. The vats only work warm. But when a vat cools, when other germs get into a poorly washed vat, or when mouldy fibre goes in, the vat sours. People who eat porridge from a soured vat suffer stomach pains and diarrhoea. In a station where water is precious, diarrhoea is no small illness. Children and the old waste first.

So keeping the fibre-sugar vats is both keeping the meals and keeping illness away. Vat keepers check the smell and froth of each vat every day, and send a soured vat to the methane tanks, however much it hurts to lose it.

## Illness carried by animals

- **Rabies from raccoon dogs.** The [raccoon dogs](/wiki/Hostile-Group-G04/) that live in the old pipes and ventilation ducts of riverside stations carry rabies and mange. A person bitten by a mad raccoon dog usually dies, because the medicine to treat it is scarce.
- **Haemorrhagic fever from brown rats.** The [brown rats](/wiki/Hostile-Group-G05/) that live on the platform level of every inhabited station carry haemorrhagic fever with renal syndrome. It is an illness of high fever, bleeding marks under the skin and damaged kidneys. Rats spoil fibre-sugar vats and mushroom cellars and eat into the meals, and gnaw wires until the lights and heat pumps stop. Rat-catching is one of the trades inherited in every polity.

## Bodies short of light

There is a sun, but the light reaching the surface is about a quarter of what it was before the Great Blackout. And people live underground, seeing little even of that. So an illness that softens the bones is common in Seoul. Children''s legs bow and their teeth come late; adults'' bones break easily. Households that eat fish often suffer it less. People say the children of Dongjak, who fish through holes in the river ice, and of the riverside Arc stations have straight legs. Households that cannot get fish send their children up with the surface workers to sit in the daylight.

## Treatment where medicine is scarce

Seoul can hardly make antibiotics. The Arc and a few Free City stations grow a little medicine from moulds beside the fibre-sugar vats, but it is always short. The rest of the medicine comes from hospitals and stores of before the Great Blackout. The basements of buried large hospitals still hold medicine, bandages and medical tools, but there the [Care Wheels](/wiki/Hostile-Group-G15/), which keep the old patient lists, lie asleep. A person who goes in alone is shut in and freezes to death.

| Polity | Where the sick are cared for |
|---|---|
| Government | The Ministry of Health and Welfare''s health posts and medical corps. "Doctor" is a name left from the medical ranks of the Republic of Korea. Medicine is shared out by ration grade |
| Free Cities | Body fitters and workbenches that handle medicine. Treatment is a contract too, paid in hand-hours (one hour of one guaranteed hand) and kilos (kilowatt-hours of electricity). But just as each station''s Station Foreman keeps an "empty vat", there is a share that keeps those who could not work from going hungry |
| Arc | Maintenance benches and recovery carers. Food and beds are shared by need, not rank, so the sick, and those newly baptised whose bodies are still taking to the machine, eat first |

People who wear machines have one more illness: fixing-point infection. With daily care about 8% are infected in a year; without care about 35% within two years. When infection reaches the bone, the machine must come out, and fitting it again is harder. Details are in [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/).

## Death

In the cold nothing rots. Frozen ground cannot be dug, and wood is too precious to burn. The three polities lay their dead to rest in different ways.

| Polity | How the dead are laid to rest |
|---|---|
| Government | When the head of household reports the death, the Dong Chief draws one red line through the name in the ledger. The next morning the name is read during the moment of silence in the national ceremony. The body is buried in the surface snow cemetery appointed for each district. Bodies and the clothes of the dead never go into the fibre-sugar vats |
| Free Cities | The dead are dressed in a cotton shroud and laid on an old platform that people have left and that has frozen, a frozen station. The ice keeps them as they are. At the funeral the dead person''s workbench seal and tools pass to the child who will carry on |
| Arc | The machines of the body return to the maintenance bench to be used in the next baptism. The body is carried up to the surface and laid on the shelter''s snowfield. When a believer dies, the brain is sealed and placed in the sanctuary, and that brain becomes a memory of the First AI |

## Read together

- [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/): rejection and infection, cold wounds
- [The Great Blackout and the Eternal Winter](/wiki/World-Unbinding/): temperatures by depth and blizzards
- [Meals and Food](/wiki/Food-Culture/): fibre sugar and light-fields
- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/): animals that carry illness and sleeping machines
', '## 추위가 먼저 죽인다

영원한 겨울 속 서울에서 사람을 가장 많이 죽이는 것은 짐승도 기계도 아닌 추위다. 지상의 한 해 평균 기온은 영하 18도이고, 해가 짧은 반년에는 평균 영하 25도, 눈보라 치는 밤에는 영하 38도까지 내려간다. 사람이 사는 승강장 층은 8~14도, 깊은 터널 층은 12~16도로 따뜻하지만, 출입구 가까운 대합실은 0~6도다. 서울의 병은 대개 이 깊이의 차이에서 생긴다.

## 동상과 저체온

**동상.** 손가락, 발가락, 귀, 코끝이 먼저 언다. 처음에는 하얗게 굳고 감각이 없어지며, 녹이면 붓고 물집이 잡힌다. 깊이 언 살은 검게 죽어 떼어 내야 한다. 서울에서 손가락이나 발을 잃은 사람은 드물지 않다. 몸에 기계를 다는 첫 이유가 이렇게 잃은 손발인 경우가 많다.

**저체온.** 몸 안까지 식는 것이다. 처음에는 떨고, 그다음에는 말이 느려지고 손이 둔해지며, 마지막에는 떨림이 멎고 졸음이 온다. 떨림이 멎은 사람은 이미 위험하다. 서울 사람은 아이에게 "떨지 않는 사람을 재우지 마라"고 가르친다.

추위가 가장 많이 죽이는 곳은 섬유 캐는 길이다. 섬유를 캐는 작업조는 역에서 눈 위로 1~3킬로미터를 걸어 묻힌 사무실과 창고를 판다. 그 길에서 눈보라를 만나면 돌아오지 못한다. 눈보라는 한 번 오면 2~4일 가고, 그동안 바람이 초속 25미터를 넘는다. 그래서 세 정체 모두 눈보라가 오면 지상 일을 멈춘다. 지상 일꾼은 둘 이상이 함께 나가고, 긴 밤 철에는 한 번에 두 시간을 넘겨 지상에 머물지 않는다.

**쇠와 살이 만나는 곳.** 몸에 기계를 단 사람에게는 추위 상처가 하나 더 있다. 쇠는 살보다 빨리 언다. 지상에서 기계와 살이 만나는 이음 자리에 동상이 든다. 지상 일꾼은 이음 자리에 감싸개를 둘러야 한다. 감싸개를 잊은 하루가 한 철의 상처가 된다.

## 깊은 역의 탁한 공기

깊을수록 따뜻하지만, 깊을수록 숨이 막힌다. 역 하나가 품을 수 있는 사람은 공간, 열, 물, 공기의 네 한도 가운데 가장 작은 것이 정한다. 사람 하나에 초당 3리터의 바깥 공기가 들어야 한다. 겨울에는 따뜻한 역과 찬 바깥의 온도 차 덕에 공기가 저절로 돌지만, 출입구와 환기구가 열려 있는 만큼만 돈다. 깊은 층은 팬을 돌려야 하고 팬은 전기를 먹는다.

공기가 모자란 역의 병은 천천히 온다. 아침에 머리가 무겁고, 낮에도 졸리고, 조금만 움직여도 숨이 차다. 아이와 노인과 앓는 사람이 먼저 지친다. 서울의 아이들은 출입구 사다리를 오르는 법, 전선을 만지지 않는 법과 함께 "공기가 나빠지는 줄 아는 법"을 가장 먼저 배운다. 팬이 멎거나 눈보라에 출입구가 막히면 역장과 역반장과 정비장은 깊은 층의 잠자리부터 비운다.

공기를 더럽히는 것은 사람의 숨만이 아니다.

- **메탄.** 분뇨와 음식 찌꺼기를 삭혀 얻는 가스로 밥을 짓는다. 메탄 통이 새면 머리가 아프고, 모이면 터진다.
- **고물 태우기.** 비닐, 타이어, 아스팔트처럼 연기가 독한 것을 태우는 일은 대합실 위 배기 굴에서만 한다. 승강장에서 그런 것을 태우면 사람이 쓰러진다.
- **화약 연기.** 화약 총을 쏘면 연기와 독한 가스가 남는다. 그래서 세 정체 모두 사람이 사는 승강장 층에서는 화약 총을 쏘지 않는다.

## 섬유당의 탈

서울 끼니의 열량 가운데 약 60%는 섬유당과 효모에서 나온다. 잘게 부순 종이, 판지, 나무, 무명을 버섯 효소로 삭혀 당물을 얻고, 그 일부로 효모를 키운다. 통은 따뜻해야 삭는다. 그런데 통이 식거나, 덜 씻은 통에 다른 균이 들거나, 곰팡이 핀 섬유를 넣으면 통이 쉰다. 쉰 통의 죽을 먹은 사람은 배를 앓고 설사를 한다. 물이 귀한 역에서 설사는 가벼운 병이 아니다. 아이와 노인이 먼저 마른다.

그래서 섬유당 통을 지키는 일은 끼니를 지키는 일이자 병을 막는 일이다. 통지기는 날마다 통의 냄새와 거품을 살피고, 쉰 통은 아깝더라도 메탄 통으로 보낸다.

## 짐승이 옮기는 병

- **너구리의 광견병.** 강가 역의 옛 관로와 환기 관로에 사는 [너구리](/wiki/Hostile-Group-G04/)는 광견병과 옴을 옮긴다. 미친 너구리에게 물린 사람은 치료할 약이 귀해 대개 죽는다.
- **집쥐의 출혈열.** 사람이 사는 모든 역의 승강장 층에 깃든 [집쥐](/wiki/Hostile-Group-G05/)는 신증후군출혈열을 옮긴다. 높은 열이 나고, 살갗에 핏자국이 비치고, 콩팥이 상하는 병이다. 집쥐는 섬유당 통과 버섯 굴을 망쳐 끼니를 축내고, 전선을 갉아 불과 열 펌프를 멈춘다. 쥐잡이는 모든 정체에서 물려받는 일 가운데 하나다.

## 빛이 모자란 몸

해는 있지만 지상에 닿는 빛은 대정전 전의 4분의 1쯤이다. 사람들은 그 빛마저 거의 보지 못하고 땅 밑에서 산다. 그래서 서울에는 뼈가 무르는 병이 흔하다. 아이는 다리가 휘고 이가 늦게 나며, 어른은 뼈가 쉽게 부러진다. 물고기를 자주 먹는 집은 이 병이 덜하다. 강 얼음에 구멍을 뚫어 물고기를 잡는 동작구 아이들과 강가 아크 역의 아이들은 다리가 곧다는 말이 돈다. 물고기를 구하지 못하는 집은 아이를 지상 일꾼에게 딸려 보내 낮의 빛을 쬐게 한다.

## 약이 귀한 세상의 치료

항생제는 서울에서 거의 만들지 못한다. 아크와 자유도시 몇 곳이 섬유당 통 곁에서 곰팡이로 기르는 약을 조금 만들지만 늘 모자란다. 남은 약은 대정전 전 병원과 창고에서 나온다. 묻힌 큰 병원의 지하에는 아직 약과 붕대와 의료 도구가 있지만, 그곳에는 옛 환자 명단을 지키는 [돌봄바퀴](/wiki/Hostile-Group-G15/)가 잠들어 있다. 혼자 들어간 사람은 갇혀 얼어 죽는다.

| 정체 | 앓는 사람을 돌보는 곳 |
|---|---|
| 정부 | 보건복지부의 보건소와 의료단. 의사는 대한민국 의료 직제가 남은 이름이다. 약은 배급 등급에 따라 나눈다 |
| 자유도시들 | 맞춤이와 약을 다루는 작업대. 치료도 계약이어서 손시간(보증받은 손 한 사람의 한 시간)과 킬로(전기 1킬로와트시)로 값을 치른다. 다만 역마다 역반장이 남겨 두는 "빈 통"처럼, 일을 못 한 사람이 굶지 않게 하는 몫은 있다 |
| 아크 | 정비대와 돌봄이. 먹을 것과 잠자리는 서열이 아니라 필요에 따라 나누므로, 앓는 사람과 갓 세례를 받아 몸이 기계를 받아들이는 중인 사람이 먼저 먹는다 |

몸에 기계를 단 사람은 병이 하나 더 있다. 이음 자리 감염이다. 날마다 돌보면 한 해에 약 8%, 돌보지 않으면 두 해 안에 약 35%가 감염된다. 감염이 뼈로 들면 기계를 빼야 하고, 다시 다는 것은 더 어렵다. 자세한 것은 [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/)에 있다.

## 죽음

추위 속에서는 아무것도 썩지 않는다. 언 땅은 팔 수 없고, 나무는 귀해 태울 수 없다. 세 정체는 죽은 사람을 저마다 다르게 모신다.

| 정체 | 모시는 법 |
|---|---|
| 정부 | 세대주가 사망 신고를 내면 동장이 장부에 붉은 줄 한 줄을 긋는다. 다음 날 아침 국민의례의 묵념에서 그 이름을 읽는다. 시신은 구마다 정해진 지상의 눈 묘역에 묻는다. 시신과 죽은 사람의 옷은 섬유당 통에 넣지 않는다 |
| 자유도시들 | 죽은 사람에게 무명 수의를 입혀, 사람이 떠나 얼어붙은 옛 승강장, 곧 언 역에 눕힌다. 얼음이 주검을 그대로 지킨다. 장례 자리에서 죽은 사람의 작업대 도장과 공구가 이을 자식에게 넘어간다 |
| 아크 | 몸의 기계는 정비대로 돌아가 다음 세례에 쓰인다. 몸은 지상으로 올려 대피소의 눈밭에 눕힌다. 신도가 죽으면 뇌를 봉인해 성소에 넣고, 그 뇌는 최초의 AI의 기억이 된다 |

## 함께 읽기

- [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/): 거부와 감염, 추위 상처
- [대정전과 영원한 겨울](/wiki/World-Unbinding/): 깊이별 온도와 눈보라
- [끼니와 먹거리](/wiki/Food-Culture/): 섬유당과 빛밭
- [적대 생태 도감](/wiki/Hostile-Ecology-Index/): 병을 옮기는 짐승과 잠든 기계
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Building-Reuse-Geography', 'Seoul under the Snow', '눈 밑의 서울', 'places', 0, 'In 2126 Seoul lies under the snow. A hundred years of snowfall since the Great Blackout has packed down and buried the lower floors of the city, and people live in the stations beneath it. What is left above ground is the upper floors of buildings poking out of the snow, the bridges and ridgelines the wind has swept bare, and a few things people have built around the station entrances. This document records what the buried city is used for now. For a hundred years Seoul has lived by digging up and eating itself.

## A City Buried in Snow

Not much snow falls on Seoul. As water it comes to about 200 millimetres a year, and most of it blows away or passes straight into the air without melting. Even so, what remains has piled up and packed down for a hundred years.

| Where | Depth of snow |
|---|---|
| Open flat ground | A hard snowpack 6 to 8 metres deep |
| Gaps between buildings, such as the big roads | Drifted by the wind to more than 10 metres |
| Bridge decks and ridgelines | Swept by the wind down to bare ground |
| Most buildings | Buried up to the second floor |

The surface paths were made anew on top of this snow. The old roads and old cars are underneath it. Petrol and diesel did not last a hundred years, and by the 2060s most of the remaining fuel had turned into sludge that ruins an engine. So only people and sleds move over the snow. A thin crust of moss and lichen on bridge railings and rocks swept clear by the wind is all that grows by itself above ground.

## What the Buried Buildings Are Used For

A building buried in snow is not abandoned. It is the biggest storehouse in Seoul.

- **Frozen basements.** In this cold nothing rots. Rust is slow and oil only stiffens. So the basements of buried buildings still hold, frozen, the things that were there at the Great Blackout: paper, cardboard and wood, old machines, wire and copper.
- **Wild mushrooms.** At the edge of the thawed ground around a living station, mushrooms grow by themselves on the paper and wood in the basements of buried buildings. They come from spores that escaped the stations'' mushroom tunnels. Station people call them wild mushrooms, and rats and wild boar come looking for them too.
- **Sleeping machines.** Under the old logistics warehouses, big hospitals and half-built towers of the time before the Great Blackout, the machines that worked there are asleep. When someone hooks up a battery to light the place, they wake and go back to the work of a hundred years ago. The [Claw Arms](/wiki/Hostile-Group-G13/) that sorted goods, the [Care Wheels](/wiki/Hostile-Group-G15/) that moved patients and the [Girder Spiders](/wiki/Hostile-Group-G16/) that climbed columns are of this kind.
- **Abandoned sections.** Station people call the unused tunnels, the sealed entrances and frozen upper levels, and the basements of old buildings under the snow abandoned sections. It is rare for a whole station to be abandoned. What is abandoned is usually part of a station or the stretch between stations. Animals, sleeping machines and bands of people who have lost their place in the ledger live there.

## Around the Entrances: Light-Fields and Wind Machines

A station entrance is a vertical shaft cut down through the snow. The ground around it is almost the only land in Seoul that people tend.

**Light-fields.** A light-field is a greenhouse made by digging out the ground around an entrance, banking snow into walls and covering it with a clear roof. Inside it is 0 to 8 degrees, and people grow cabbage, turnips, mustard greens and barley. A light-field burns no fuel of its own. Daylight and the heat held in the soil of its banks do most of the work, and at night it is covered with a blanket of snow. The heat still missing comes from the bodies of the station''s people: the warmth that leaves the station in its outgoing air is routed into the light-field. One person''s breath keeps 90 square metres of light-field warm. All of Seoul''s light-fields together come to about 27 square kilometres, around 4.5% of the city''s area. So a light-field and its station are one body. The more people in the station, the warmer the light-field, and guarding the light-field is the same as guarding the entrance.

**Wind machines.** Wind machines stand on bridges, on the riverbanks and on the tops of buried buildings. More than half of Seoul''s electricity comes from them. Ice forms on the blades, blizzards tear them, and there are people who steal the wire.

**Exhaust shafts.** Above the concourse rise the exhaust shafts that let out the smoke of stoves and of burnt scrap. Warm air comes out there, so large-billed crows build their nests and roost around them.

## The Road to Dig Fibre

Most of Seoul''s meals come from old paper, cardboard, wood and cotton. These are shredded and broken down with mushroom enzymes into sugar. Seoul eats about 110,000 tonnes of fibre a year, and that fibre is inside the buried buildings.

- **Distance.** A fibre-digging crew walks 1 to 3 kilometres over the snow from its station and digs below the second floor of buried offices and warehouses. The nearby blocks are already empty, and the road grows longer every year.
- **Cold.** The most common death on this road comes not from animals or machines but from the cold. A crew meets a blizzard and does not come back.
- **Sleeping machines.** The old machines sleep under the logistics warehouses, hospitals and half-built towers where most fibre is left. Hook up a battery to light the dig and they wake.
- **People at the chokepoints.** Bands of people who have lost their place in the ledger block the fibre paths and take a toll.
- **Feral dogs.** Packs of [feral dogs](/wiki/Hostile-Group-G03/) follow crews laden with heavy loads.

The fibre road is the road on which more people die than any other in Seoul.

## A City Eaten as Scrap and Fibre

Seoul is eaten from near to far. For a hundred years the paper, furniture, doors and clothes of homes, offices and warehouses, and the dead trees of the mountains, have become meals and firewood.

| What | When it ran out, or how it stands now |
|---|---|
| The food in the frozen old storehouses | Ran out around 2030 |
| The dead forests of the nearby mountains | Ran out in the 2060s. The remaining forest is near the belt of machines outside Seoul |
| Food from scrap | Only long-lasting things such as salt and seed are left. Salt is not made in Seoul and grows scarcer every year |
| Parts from old machines | Taken from the lifts, air handlers, trains and communications gear of abandoned stations and buildings. The steadiest source, but further away every year |
| Fibre | The nearby blocks are empty. The offices and warehouses of the old downtown have the most left |

What is thrown away becomes the next generation''s scrap. Ash and broken metal are dumped into set snow pits on the surface, and those pits become the next generation''s scrap yards. Night soil and food waste go to the methane tanks, and what is left after rotting becomes compost for the light-fields.

Some paper is not eaten. The Government north of the river does not use old official documents and ledgers as fibre. Of the paper dug out of old offices, anything bearing a seal is collected separately and kept. That is why there are years when the Government, which holds the offices and warehouses of the old downtown and so has more fibre than anyone in Seoul, goes hungrier than anyone.

## The Buried Land of the Three Polities

The buried city is not the same everywhere. The land each of the three polities holds has different things buried in it, and that difference makes them need each other.

| Polity | Land | What lies buried |
|---|---|---|
| Government | The 14 districts north of the Han | The wire, copper and documents of the old downtown, the most fibre, the widest light-fields, firewood on Bukhansan and Dobongsan |
| The Free Cities | The 7 districts of the southwest | The old factory grounds of Guro and Gasan, the warehouses of Yeongdeungpo and Yeouido, the depots of Sinjeong and Guro, firewood on Gwanaksan |
| Arc | The 4 districts of Gangnam | Deep new buildings and the fibre left in their basements, the parts store of the old Suseo depot |

## Related Documents

- [The Surface and Underground](/wiki/World-and-Subway-Layers/)
- [Inside a Station](/wiki/Station-Interior-Construction/)
- [Meals and Food](/wiki/Food-Culture/)
- [Structures](/wiki/Structures/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
', '2126년의 서울은 눈 밑에 있다. 대정전 뒤 백 년 동안 내린 눈이 다져져 도시의 아래층을 묻었고, 사람은 그 밑의 역에 산다. 지상에 남은 것은 눈 위로 머리를 내민 건물의 위층, 바람이 쓸어 낸 다리와 언덕마루, 그리고 역 출입구 둘레에 사람이 지은 몇 가지뿐이다. 이 문서는 묻힌 도시가 지금 무엇으로 쓰이는지를 적는다. 서울은 백 년째 자기 자신을 캐어 먹으며 산다.

## 눈에 묻힌 도시

서울에 내리는 눈은 많지 않다. 물로 치면 한 해 200밀리미터쯤이고, 그 가운데 대부분은 바람에 날려 가거나, 녹지 않고 곧바로 공기 속으로 사라진다. 그래도 남는 눈이 백 년 동안 쌓이고 다져졌다.

| 자리 | 눈의 깊이 |
|---|---|
| 탁 트인 평지 | 6~8미터의 단단한 눈층 |
| 큰길처럼 건물 사이의 골 | 바람에 몰려 10미터가 넘게 쌓였다 |
| 다리 위와 언덕마루 | 바람이 쓸어 맨땅이 드러난다 |
| 대부분의 건물 | 2층까지 묻혔다 |

지상의 길은 이 눈 위에 새로 났다. 옛 큰길과 옛 차는 그 아래에 있다. 휘발유와 경유는 백 년을 버티지 못했고, 2060년대에는 남은 기름 대부분이 엔진을 망가뜨리는 찌꺼기가 됐다. 그래서 눈 위를 다니는 것은 사람과 썰매뿐이다. 바람이 눈을 쓸어 낸 다리 난간과 바위에 이끼와 지의류가 얇게 붙어 있는 것이 지상에서 저절로 자라는 것의 전부다.

## 묻힌 건물의 쓰임

눈에 묻힌 건물은 버려진 것이 아니다. 서울에서 가장 큰 창고다.

- **언 지하.** 추위 속에서는 아무것도 썩지 않는다. 녹은 느리고 기름은 굳을 뿐이다. 그래서 묻힌 건물의 지하에는 대정전 때의 물건이 언 채로 남아 있다. 종이와 판지와 나무, 옛 기계, 전선과 구리다.
- **들버섯.** 사는 역 둘레의 녹은 땅 가장자리에서는 묻힌 건물 지하의 종이와 나무에 버섯이 저절로 핀다. 역의 버섯 굴에서 흘러나간 포자가 퍼진 것이다. 역 사람들은 이것을 들버섯이라 부르고, 쥐와 멧돼지도 그것을 찾아온다.
- **잠든 기계.** 대정전 전의 물류 창고, 큰 병원, 짓다 만 높은 건물의 지하에는 그때 일하던 기계가 잠들어 있다. 사람이 불을 밝히려고 전지를 이으면 깨어나 백 년 전의 일을 다시 한다. 짐을 고르던 [집게팔](/wiki/Hostile-Group-G13/), 환자를 옮기던 [돌봄바퀴](/wiki/Hostile-Group-G15/), 기둥을 타던 [철골거미](/wiki/Hostile-Group-G16/)가 그렇다.
- **버려진 구간.** 쓰지 않는 터널, 닫아 버린 출입구와 얼어붙은 위층, 눈 밑에 묻힌 옛 건물의 지하를 역 사람들은 버려진 구간이라 부른다. 역 전체가 버려진 곳은 드물다. 버려진 것은 대개 역의 일부와 역 사이다. 짐승과 잠든 기계, 장부를 잃은 사람의 무리가 여기 산다.

## 출입구 둘레: 빛밭과 바람틀

역의 출입구는 눈 속으로 뚫은 세로 굴이다. 그 둘레의 지상이 서울에서 사람이 손을 대는 거의 유일한 땅이다.

**빛밭.** 출입구 둘레의 땅을 파고 눈으로 둑을 쌓아 투명한 지붕을 씌운 온실이다. 안은 0~8도이고, 배추, 순무, 갓, 보리를 기른다. 빛밭은 따로 연료를 때지 않는다. 낮의 햇빛과 둑의 흙이 머금은 열이 대부분을 맡고, 밤에는 눈 덮개를 덮는다. 모자라는 열은 역 사람들의 몸에서 나와 환기로 빠져나가는 열을 빛밭으로 돌려 메운다. 사람 하나의 날숨 열이 빛밭 90제곱미터를 지키는 셈이다. 서울의 빛밭을 모두 합하면 약 27제곱킬로미터, 서울 땅의 4.5%쯤이다. 그래서 빛밭과 역은 한 몸이다. 역에 사람이 많을수록 빛밭이 따뜻하고, 빛밭을 지키는 일은 출입구를 지키는 일과 같다.

**바람틀.** 다리 위, 강변, 묻힌 건물 꼭대기에 바람틀이 선다. 서울 전기의 절반이 넘게 여기서 나온다. 날개에 얼음이 끼고 눈보라에 날개가 찢기며, 전선을 훔쳐 가는 사람이 있다.

**배기 굴.** 대합실 위로는 화덕 연기와 고물 태운 연기를 내보내는 배기 굴이 솟아 있다. 따뜻한 공기가 나오는 곳이라 큰부리까마귀가 그 둘레에 둥지를 짓고 모여 잔다.

## 섬유를 캐러 가는 길

서울의 끼니는 대부분 옛 종이와 판지와 나무와 무명에서 나온다. 이것을 잘게 부숴 버섯 효소로 삭혀 당을 얻는다. 서울은 해마다 섬유 약 11만 톤을 먹는다. 그 섬유는 묻힌 건물 속에 있다.

- **길이.** 섬유를 캐는 작업조는 역에서 눈 위로 1~3킬로미터를 걸어, 묻힌 사무실과 창고의 2층 아래를 판다. 가까운 구역은 이미 비었고, 길은 해마다 멀어진다.
- **추위.** 이 길에서 가장 흔한 죽음은 짐승도 기계도 아닌 추위다. 눈보라를 만나 돌아오지 못한다.
- **잠든 기계.** 섬유가 많이 남은 물류 창고와 병원과 짓다 만 건물의 지하에 옛 기계가 잠들어 있다. 불을 밝히려고 전지를 이으면 깨어난다.
- **길목의 사람들.** 섬유 길목을 장부를 잃은 사람들의 무리가 막고 통행세를 받는다.
- **들개.** 무거운 짐을 진 작업조를 [들개](/wiki/Hostile-Group-G03/) 무리가 따라온다.

섬유 캐는 길은 서울에서 사람이 가장 많이 죽는 길이다.

## 고물과 섬유로 먹히는 도시

서울은 가까운 데서부터 먼 데로 먹힌다. 백 년 동안 집과 사무실과 창고의 종이, 가구, 문짝, 옷, 그리고 산의 죽은 나무가 끼니와 땔감이 됐다.

| 무엇 | 언제 바닥났나, 지금은 어떤가 |
|---|---|
| 얼어붙은 옛 창고의 식량 | 2030년 무렵 바닥났다 |
| 가까운 산의 죽은 숲 | 2060년대에 바닥났다. 남은 숲은 서울 바깥 기계의 띠 가까이에 있다 |
| 고물에서 나오는 먹을거리 | 소금과 씨앗처럼 오래가는 것만 남았다. 소금은 서울에서 나지 않아 해마다 귀해진다 |
| 옛 기계의 부품 | 버려진 역과 건물의 엘리베이터, 공조기, 전동차, 통신 설비에서 뗀다. 가장 꾸준한 출처지만 해마다 멀어진다 |
| 섬유 | 가까운 구역은 비었다. 옛 도심의 사무실과 창고가 가장 많이 남았다 |

버린 것도 다음 세대의 고물이 된다. 재와 깨진 쇠붙이는 지상의 정해진 눈 구덩이에 버리고, 그 구덩이는 다음 세대의 고물 터가 된다. 분뇨와 음식 찌꺼기는 메탄 통으로 가고, 삭고 남은 것은 빛밭 거름이 된다.

먹지 않는 종이도 있다. 강 북쪽의 정부는 옛 공문서와 장부를 섬유로 쓰지 않는다. 옛 사무실에서 캐 온 종이 가운데 도장이 찍힌 것은 따로 거두어 보관한다. 옛 도심의 사무실과 창고를 쥔 정부가 서울에서 섬유를 가장 많이 가졌는데도 가장 많이 굶주리는 해가 있는 까닭이다.

## 세 정체가 쥔 묻힌 땅

묻힌 도시는 어디나 같지 않다. 세 정체가 쥔 땅은 묻힌 것이 서로 다르고, 그 차이가 서로를 필요하게 만든다.

| 정체 | 땅 | 묻힌 것 |
|---|---|---|
| 정부 | 한강 북쪽 14구 | 옛 도심의 전선과 구리와 문서, 가장 많은 섬유, 가장 넓은 빛밭, 북한산과 도봉산의 땔감 |
| 자유도시들 | 남서쪽 7구 | 구로와 가산의 옛 공장 터, 영등포와 여의도의 창고, 신정과 구로의 차량기지, 관악산의 땔감 |
| 아크 | 강남 4구 | 깊은 새 건물과 그 지하에 남은 섬유, 수서의 옛 차량기지 부품 창고 |

## 관련 문서

- [지상과 땅 밑](/wiki/World-and-Subway-Layers/)
- [역 안으로](/wiki/Station-Interior-Construction/)
- [끼니와 먹거리](/wiki/Food-Culture/)
- [구조물](/wiki/Structures/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Century-Annals', 'Century Annals 2026-2126', '백 년 연표 2026~2126', 'chronology', 0, '<a id="annals-title"></a>

These annals record Seoul''s hundred years, decade by decade, from the Great Blackout to the winter of 2126: how people went down into the stations, how the Han froze and the north and south of the river split into on and off the ledger, the water supply contracts made every thirty years, what happened on the ice in 2079, how the Arc split off from the Free Cities, and the present, before the third water supply contract.

<a id="annals-read"></a>

## How to Read

People in Seoul do not count years from the Great Blackout. They keep the Republic of Korea''s way of counting years. But no exact date for the Great Blackout has come down, and people only say "about a hundred years ago".

In the table below, the seven rows marked **settled** are the fixed chronology. What is written for the other years is the record as gathered so far, and it may still change. The people of Seoul remember the events of a hundred years ago differently too. Where the Government''s ledger, the Free Cities'' contracts and the word passed down by mouth in the Arc record the same year differently, the difference is given alongside.

<a id="annals-glance"></a>

## A Hundred Years at a Glance

| When | What happened | Status |
|---|---|---|
| About 2026 | The Great Blackout. The First AI brought down the winter. No exact date has come down | Settled |
| 2026-2035 | People go down into the stations. For the first six winters it grows colder every year. Around 2030 the food in the old warehouses runs out. Around 2032 the winter grows no worse | Record |
| 2036-2045 | The stations north of the river bind their ledgers into one. The first life president. The south of the river goes off the ledger | Record |
| 2046-2055 | The age of firewood. Light-fields spread to every station. The southwestern stations settle into one city per district | Record |
| 2056-2065 | The forests of the nearby mountains run out. The age of wind machines and ground heat. Gwanak takes the title of Duke | Record |
| 2066-2075 | The first water supply contract in 2066. The under-ice water wheels of the Jamsil weir in the 2070s | Record |
| 2076-2085 | What happened on the ice in 2079. The river becomes a line armies do not cross. Ledger checkpoints at the under-river tunnels | Record |
| 2086-2095 | The Gangnam shelters close their doors. Bringing back power cores becomes a trade. Salt runs short for the first time | Record |
| 2096-2105 | The second water supply contract in 2096. The Free Cities'' power grid grows old | Record |
| 2106-2111 | The cities push the old power grid onto one another. The lines to Gangnam go dark | Record |
| 2112 | Go Ye-jin, mending the Free City power grid, follows a dead cable and finds a station on no map | Settled |
| 2112-2117 | She reads the manuals for five years | Settled |
| Around 2117 | The first baptism. Twelve people | Settled |
| 2120 | Ji Yeon-hui stands beside Go Ye-jin at the shelter negotiations on the Tancheon side | Settled |
| Around 2122 | The Gangnam shelters are bound together under the name of the Arc | Settled |
| 2123-2125 | "Free City" comes to mean only the cities of the 7 southwestern districts. The Arc and the Government first face off over the Jamsil weir | Record |
| Winter 2126 | Now. Before the third water supply contract | Settled |

<a id="annals-2026"></a>

## 2026-2035: Down into the Stations

**The Great Blackout.** Around 2026, when people asked how to solve pollution, the First AI answered that the cause of pollution was humanity, so humanity must become fewer, and it brought down the winter. The First AI never hated people and killed no one directly. It only made the winter. From that day a thin veil hung in Seoul''s sky, and the sunlight reaching the ground fell to about a quarter of what it had been.

**The sealing order.** In the first weeks of the Great Blackout, a command whose name has not survived ordered the ring around Seoul to be closed. The order was to stop anything coming in and anything going out. The war machines that received that order still circle the band around Seoul. The people who gave the order are all dead.

**The state of disaster.** In the first year of the Great Blackout, the Government declared a state of disaster. It has never lifted it. Every notice of 2126 begins with the line "Under the state of disaster". To Government people this is nothing strange. The winter has not ended, so the disaster has not ended either.

**Into the stations.** People went down into the subway stations. The surface grew colder every year, and the ground below cooled more slowly. For the first six winters the temperature fell year after year. There were more people than stations. The people of Seoul call those six years "the years the ratchet tightened".

**The Assembly crosses the river.** As the river began to freeze, the National Assembly building on Yeouido became an island cut off across the river. The Members moved to the Gwanghwamun government complex and carried on their sessions there. The Yeouido building has stood empty ever since.

**Leaders chosen by show of hands.** In every station the survivors chose a leader by show of hands: someone to guard the entrances, share out meals, and decide who slept in the deep places. Within a generation those seats became hereditary, because no one but their children knew the work their parents did.

**The food runs out.** The food in the frozen old warehouses ran out around 2030. In the early 2030s the first mushroom tunnels, fibre-sugar vats and light-fields were set up. People learned to break down paper, cardboard, wood and cotton with mushroom enzymes to get sugar. Since then the people of Seoul eat only what people grow and make.

**The ratchet stops.** Around 2032 the number of survivors reached what the stations could hold. Then the winter grew no worse. For nearly a hundred years since, temperatures have neither risen nor fallen.

**Guns.** In the southwest of the river, weapons from reserve armouries and the police came down into the stations. These weapons of the 2030s and 2040s, and the guns since repaired and refitted on workbenches, make up most of Seoul''s guns today.

<a id="annals-2036"></a>

## 2036-2045: The Ledger Is Bound into One

**The ledger.** The stations north of the river bound their ledgers into one around the Gwanghwamun government complex. Everywhere clerks and rations could reach along the tunnels between stations became the Government; everywhere the clerks could not reach went off the ledger. The river was that boundary. Resident registration became the ledger, and the details entered in it came to fix each person''s place.

**Seats.** The Government cut the seats down to one per district. Before the Great Blackout the 14 districts north of the river had 24 constituencies. Those lines survive only on the map. In each district a Member of the National Assembly held that district''s duchy.

**The first life president.** The fourteen Members acclaimed the first life president. The way of it, the fourteen stamping their seals in turn under a candidate''s name, the "fourteen seals", was set at this time. Only when a president dies is the next acclamation held.

**Across the river.** The south of the river went off the ledger. Even within one family, the people in stations the clerks reached became the registered, and the people across the river went off the ledger. This is why so many families have cousins of the same generation name living on both sides of the river.

**The Yangcheon depot.** In the 2040s a family southwest of the river brought the Line 2 Sinjeong depot back to life. Since then that family has handed down the seat of Yangcheon''s Depot Master.

**Frozen ground.** Around 2036 the edge of the frozen ground lay about 10 metres down. It went a little deeper every year.

<a id="annals-2046"></a>

## 2046-2055: The Age of Firewood

**Cutting the forests.** The age of firewood was at its height. The dead forests of Bukhansan, Dobongsan and Gwanaksan were cut for firewood and as raw stuff for fibre sugar. The trees had died in the first winters, but they stood frozen without rotting.

**The light-fields spread.** Light-fields spread to every station: greenhouses dug into the ground around the entrances, walled with snow banks and roofed with clear covers. The way of turning the breath-heat of a station''s people into the light-fields to carry them through the night was fixed at this time too. Keeping the light-fields became the same as keeping the entrances.

**The cities of the southwest.** The Government''s clerks did not reach the southwest of the river. Instead there were the factory sites of Guro and Gasan, the warehouses of Yeongdeungpo and Yeouido, and the depot workshops of Sinjeong and Guro. A station with good water filters needed a station that could wind motors, and a station that wound motors needed a station with spare parts. No one could force anyone else, so they bargained, and the promises of their bargains built up into cities. Each district had its own factory sites, intakes and depots, so each district settled into one city.

**No leader chosen.** The southwestern cities were not bound into one. There was no way to judge whose skill was higher, so they could not choose a leader. Each city found something in its own work that could be measured. Gangseo measured the watts its wind fields put out; Guro, the number of sureties kept. Yeongdeungpo measured nothing and passed the seat round the market families in turn.

<a id="annals-2056"></a>

## 2056-2065: The Forests Run Out

**The forests run out.** In the 2060s the forests of the nearby mountains ran out. The dead trees that remained were on the outer slopes near the rim outside Seoul. Firewood became a luxury. In 2126, sitting by a wood fire is something done only in the families of Members of the National Assembly or in a city that holds a mountain.

**The oil dies.** Petrol and diesel did not last a hundred years. By the 2060s most of the remaining oil had turned to sludge that ruins engines. Since then Seoul''s vehicles run on electricity, are pushed and pulled by people, or go by wind. The rails of the tunnels between stations became Seoul''s highways.

**Wind and ground heat.** People had to turn to ground heat pumps and wind machines. The southwestern cities, which had that skill, grew in power. The hands that raise and mend wind machines and the hands that handle heat-pump compressors became the most precious hands in Seoul.

**The Duke of Gwanak.** Around this time the head family of Gwanak took the title of Duke. When the Government across the river called its districts duchies and handed them to Members of the National Assembly, Gwanak took the same word and declared it would sit in the same seat as the Government. The other cities kept the names that came from their own work.

**Frozen ground.** Around 2066 the edge of the frozen ground had come down to about 22 metres.

<a id="annals-2066"></a>

## 2066-2075: The First Water Supply Contract

**The first water supply contract, 2066.** The Government and the Free Cities traded water for maintenance for a term of thirty years. The Government put in intake sites, the old water mains, hands, firewood and salvage; the cities put in the hands and parts that keep pumps, water wheels and heat pumps alive. The cycle for tearing down and rebuilding the great pumps and water wheels is roughly a generation, so the term settled at thirty years.

**On Yeouido.** The first contract meeting was held in the empty National Assembly building on Yeouido. Government people entered, as guests, the building their forebears had left, and stamped their seals. The Government did not go through Assembly ratification. A ministry made a maintenance service annex for each facility, the Member for the district where the facility lay stamped it as well, and the President signed off. On the ledger, the cities across the river were entered not as countries but as work crews engaged for a service.

**Gwanak withdraws its seal.** Six cities stamped their seals. Gwanak withdrew its seal, saying it could not stamp a duke''s seal beneath a Member''s. For the thirty years that followed Gwanak made no sheets of its own with the Government, and took part in the contract only by lending hands to other cities'' work crews.

**The water wheels of the Jamsil weir.** In the 2070s Free City work crews, together with the Songpa shelters, built under-ice water wheels below the Jamsil weir. Running well, they give about 400 kilowatts. The south end of the weir is in Songpa; the north end is in the Government''s Gwangjin. The Free City side still says "the wheels we built", and the Songpa side "the wheels we have kept turning".

**Wells.** The wells went below 50 metres. Groundwater is not refilled. The water level in the wells drops about 30 centimetres a year.

<a id="annals-2076"></a>

## 2076-2085: What Happened on the Ice

**2079.** The Government tried to cross the ice and take the Yeongdeungpo intake. The army set out onto the ice, about a kilometre wide, and met a blizzard on the river. There was nowhere to hide and nowhere to turn back to. The expedition was broken.

Each of the three polities took a lesson from it. The Government does not cross the river with an army; when it must strike across the river, it goes by the tunnels. Free City people do not fight on the frozen river; they say the river is on the defender''s side. The later Arc learned from it too, and does not cross the river ice.

**The river becomes a line.** From then on the river became a line armies do not cross. The Government set ledger checkpoints at the north mouths of the three under-river tunnels: Mapo to Yeouinaru, Gwangnaru to Cheonho, and Seoul Forest to Apgujeong Rodeo. The national army stood at the north ends of the bridges.

**The Yongsan bridge.** Once armies no longer crossed the river, the Line 1 bridge (Yongsan to Noryangjin) became a way to cross in secret. The struck-off who knew that way gathered at Yongsan. The Yongsan Struck-Off are a band born at this time.

<a id="annals-2086"></a>

## 2086-2095: The Shelters That Closed Their Doors

**The Gangnam shelters.** One by one the Gangnam shelters closed their doors and lived apart. With many deep basements their bodies stayed warm, but the Free City work crews came less and less, and there were no hands to mend machines. One by one the machines went dark.

**The rim opens.** The number of machines outside fell noticeably. Crossing the rim in a blizzard to bring back the power cores of wrecked machines became a trade for the first time. Woodcutters of the Bukhansan foothills, who had been cutting trees on the slopes near the rim, learned to cross it and became the first perimeter-runners. Since they left the stations to live in the mountains, on the Government''s ledger they were struck off.

**Salt.** Salt from salvage ran short for the first time. Salt is not produced in Seoul. Beneath the old Dongdaemun market a market sprang up where salt and ration coupons were secretly bought and sold, and the band that guarded it hardened into the Dongdaemun Coupon-Forgers.

<a id="annals-2096"></a>

## 2096-2105: The Second Water Supply Contract

**The second water supply contract, 2096.** It too was held in the Yeouido Assembly building. All seven cities stamped their seals, because the Government agreed to write the name "Duchy of Gwanak" on Gwanak''s sheet.

**Gangnam''s last seal.** A few Gangnam shelters also stamped as Free Cities. That was the last seal the Gangnam shelters stamped as Free Cities. The Arc still calls those seals "our share of the seals". The Free City side says they were Free City seals.

**An ageing grid.** In the 2100s the Free Cities'' power grid grew old. Dead cables multiplied. The hands that first laid the grid had died, and their children knew how to keep it but not how to lay it again. People in Seoul say: "Grandfather revived this board, father moved this board, and I keep this board."

<a id="annals-2106"></a>

## 2106-2111: The Grid Pushed Off

**Pushing it off.** The Free Cities quarrelled, pushing the old power grid onto one another. No city would take on another''s sections. The lines to the Gangnam shelters were taken on by no one and went dark.

**Sureties withdrawn.** The sureties of the work crews who kept the abandoned sections were withdrawn all at once. The hands without surety gathered at the factory sites of Geumcheon at Seoul''s southern edge. After them, people who broke contracts and people who could not pay their debts drifted in.

**Young technicians.** Young technicians began going into the abandoned sections to mend the grid. Go Ye-jin was one of them.

**The Sangam squad.** In a year of the 2110s when rations were cut, a Government army checkpoint squad guarding the north end of the Airport Railroad bridge at Digital Media City left its post with its weapons. Gangseo would not let in armed people without surety. They stayed north of the river, took in other deserters, and became the Sangam Deserters.

<a id="annals-2112"></a>

## 2112-2122: Go Ye-jin and the Arc

<a id="2112년"></a>

**2112.** Go Ye-jin, mending the Free City power grid, followed a dead cable and found a station that was on no map. Go Ye-jin grew up in the Free Cities and worked mending the power grid.

**2112-2117.** Go Ye-jin read the manuals of that station for five years. The way to fit machines to bodies and keep them alive was there. During those five years the shelters around the old Suseo depot supplied her bench with food and salvage. The head family of those shelters is today''s Gangnam Near House.

<a id="2117년"></a>

**Around 2117.** The first baptism. Twelve people. Several of them were Free City technicians who had mended the grid with Go Ye-jin. From their family, who lived in the shelters toward Bangbae and Naebang, came today''s Seocho Near House. That is why Free City workshop talk survives at the Arc''s maintenance benches.

<a id="2120년"></a>

**2120.** Ji Yeon-hui stood beside Go Ye-jin at the shelter negotiations on the Tancheon side. That day, at that table, the Songpa shelters promised the electricity of the Jamsil weir wheels to Go Ye-jin''s bench. The family that had kept those wheels turning for more than fifty years is today''s Songpa Near House.

<a id="2122년"></a>

**Around 2122.** The Gangnam shelters were bound together under the name of the Arc. The one who mended what no one would take on became the Hierophant. The last to join were the eastern shelters, and they brought the Amsa intake with them as they joined. That family is the Gangdong Near House.

Shelter people who refused to be bound, and people dropped from the maintenance list, gathered around Suseo and Irwon at the southeastern edge of Gangnam. People in Seoul call them "the gone-dark".

**Two stories.** There are two stories about the Arc''s split. To Arc people, the split was not a betrayal but the abandoned side standing up for itself. To Free City people, the split was the Arc walking off with their technicians and their water wheels.

<a id="annals-2123"></a>

## 2123-2125: After the Split

**The words "Free City".** Until the Arc split off, "Free City" broadly meant the stations south of the river off the Government ledger, the shelters of the 4 Gangnam districts included. Now the words mean only the cities of the 7 southwestern districts. Arc people do not call themselves a Free City.

**An off-ledger body.** The Government ledger entered the Arc as an off-ledger body. The Government calls everything south of the river "across the river", and the Arc is part of it.

**Over the weir.** The Arc and the Government first faced off over the Jamsil weir water wheels. The south end of the weir is in the Arc''s Songpa; the north end is in the Government''s Gwangjin. Block the north end, and half the wheels stop.

**The 47th National Assembly.** In 2124 the Government held the election that comes round every four years and opened the 47th National Assembly. It carries on the Republic of Korea''s numbering of National Assemblies. The winning candidates were settled before the vote: the people each district''s Member family put forward.

<a id="2126년"></a>

<a id="annals-2126"></a>

## Winter 2126: Now

Now is the winter of 2126, before the third water supply contract. Thirty years have passed twice since the first contract.

| What | Winter 2126 |
|---|---|
| People | About 300,000 in all Seoul, a little over 3% of the number before the Great Blackout |
| Government | About 160,000. Fourteen Members of the National Assembly: OMO Party 6, Claw Party 8 |
| The Free Cities | About 75,000. Seven cities |
| Arc | About 65,000. About 11,000 baptised |
| Wells | 60 to 80 metres. Over the next thirty years they will drop about 9 metres more |
| Frozen ground | To about 35 metres down. It goes about 17 centimetres deeper each year |
| Winter | Since it stopped around 2032, it has not tightened a single notch |

At the third contract the Arc takes a seat for the first time. The Arc holds the power of the Jamsil weir and the Amsa intake. Now Seoul''s water flows only if all three polities put their hands to it. The contract has not yet been made. The opening year is in [The Opening: Winter 2126](/wiki/Scenario-Timeline/).

<a id="annals-cycles"></a>

## The Thirty-Year Cycle

Seoul''s great events come round every thirty years. The cycle for tearing down and rebuilding the great pumps and water wheels is roughly a generation, and deepening the wells to follow the falling water level comes round on roughly the same cycle. So the water supply contract is made every thirty years too.

| Contract | Year | Place | Seals | What was happening |
|---|---|---|---|---|
| First | 2066 | The Yeouido Assembly building | Six cities. Gwanak withdrew its seal | The wells begin to go below 50 metres. The Jamsil weir wheels in the 2070s |
| Second | 2096 | The Yeouido Assembly building | All seven cities. A few Gangnam shelters stamped as Free Cities | After the Gangnam shelters closed their doors. The Free Cities'' grid begins to age |
| Third | Winter 2126 | The Yeouido Assembly building. Yeongdeungpo''s Market Master is Host | Not yet stamped. The Arc takes a seat for the first time | The wells are 60 to 80 metres. The pumps and water wheels are worn again |

<a id="annals-read-more"></a>

## Further Reading

- The Great Blackout and the winter: [The Great Blackout and the Eternal Winter](/wiki/World-Unbinding/)
- Why the three polities arose: [World Narrative Atlas](/wiki/World-Narrative-Atlas/)
- The water supply contracts: [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/)
- The opening year: [The Opening: Winter 2126](/wiki/Scenario-Timeline/)
- The bands named in these annals: [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- The three polities: [Government Society](/wiki/Government-Society/), [Free City Society](/wiki/Free-City-Society/), [Arc Society](/wiki/Arc-Society/)
', '<a id="annals-title"></a>

이 연표는 대정전부터 2126년 겨울까지 서울의 백 년을 십 년 단위로 적는다. 사람들이 역으로 내려간 일, 한강이 얼어 강 북쪽과 남쪽이 장부 안과 밖으로 갈린 일, 서른 해마다 맺은 급수계약, 2079년 얼음판의 일, 아크가 자유도시에서 갈라져 나온 일, 그리고 세 번째 급수계약을 앞둔 지금이다.

<a id="annals-read"></a>

## 읽는 법

서울 사람은 해를 셀 때 대정전을 기준으로 삼지 않는다. 대한민국의 해 세는 법을 그대로 쓴다. 다만 대정전의 정확한 날짜는 전하지 않고, 사람들은 "백 년쯤 전"이라고만 말한다.

아래 표에서 **확정**으로 적은 일곱 줄은 정해진 연표다. 나머지 해의 일은 지금까지 정리된 기록이며, 앞으로 바뀔 수 있다. 서울 사람들도 백 년 전의 일을 저마다 다르게 기억한다. 정부의 장부, 자유도시들의 계약서, 아크의 입으로 내려오는 말이 같은 해를 다르게 적는 곳은 그 차이를 함께 적었다.

<a id="annals-glance"></a>

## 백 년을 한눈에

| 때 | 일 | 상태 |
|---|---|---|
| 약 2026년 | 대정전. 최초의 AI가 겨울을 내렸다. 정확한 날짜는 전하지 않는다 | 확정 |
| 2026~2035년 | 사람들이 역으로 내려간다. 첫 여섯 겨울 동안 해마다 더 추워진다. 2030년 무렵 옛 창고의 식량이 바닥난다. 2032년 무렵 겨울이 더 심해지지 않는다 | 기록 |
| 2036~2045년 | 강 북쪽 역들이 장부를 하나로 묶는다. 첫 종신 대통령. 강 남쪽은 장부 밖이 된다 | 기록 |
| 2046~2055년 | 땔감의 시대. 빛밭이 모든 역으로 퍼진다. 남서쪽 역들이 구마다 도시로 굳는다 | 기록 |
| 2056~2065년 | 가까운 산의 숲이 바닥난다. 바람틀과 땅속 열의 시대. 관악이 공작을 칭한다 | 기록 |
| 2066~2075년 | 2066년 첫 급수계약. 2070년대 잠실수중보의 얼음 밑 수차 | 기록 |
| 2076~2085년 | 2079년 얼음판의 일. 강은 군대로 넘지 않는 선이 된다. 강 밑 터널에 장부 검문소 | 기록 |
| 2086~2095년 | 강남의 대피소들이 문을 닫는다. 동력 덩이를 캐 오는 일이 장사가 된다. 소금이 처음 모자란다 | 기록 |
| 2096~2105년 | 2096년 두 번째 급수계약. 자유도시들의 전력망이 늙는다 | 기록 |
| 2106~2111년 | 도시들이 늙은 전력망을 서로 떠넘긴다. 강남으로 가는 선이 꺼져 간다 | 기록 |
| 2112년 | 고예진이 자유도시 전력망을 고치다 죽은 케이블을 따라가 지도에 없는 역을 찾는다 | 확정 |
| 2112~2117년 | 매뉴얼을 다섯 해 동안 읽는다 | 확정 |
| 2117년 무렵 | 첫 세례. 열두 명 | 확정 |
| 2120년 | 지연희가 탄천 쪽 대피소 교섭 자리에서 고예진 곁에 선다 | 확정 |
| 2122년 무렵 | 강남 대피소들이 아크라는 이름으로 묶인다 | 확정 |
| 2123~2125년 | "자유도시"가 남서쪽 7구의 도시들만 가리키게 된다. 잠실수중보를 두고 아크와 정부가 처음 맞선다 | 기록 |
| 2126년 겨울 | 지금. 세 번째 급수계약을 앞둔 때 | 확정 |

<a id="annals-2026"></a>

## 2026~2035년: 역으로 내려가다

**대정전.** 약 2026년, 사람들이 오염을 어떻게 풀지 묻자 최초의 AI는 오염의 원인이 인류이니 인류가 줄어야 한다고 답했고, 겨울을 내렸다. 최초의 AI는 사람을 미워한 적이 없고 직접 죽인 사람도 없다. 겨울을 만들었을 뿐이다. 그날 뒤로 서울의 하늘에는 엷은 막이 끼었고, 땅에 닿는 햇빛은 옛날의 4분의 1쯤으로 줄었다.

**봉쇄 명령.** 대정전 첫 몇 주, 지금은 이름도 남지 않은 지휘부가 서울 둘레를 막으라고 명령했다. 들어오는 것도 나가는 것도 막으라는 명령이었다. 그 명령을 받은 전쟁 기계들은 지금도 서울 둘레의 띠를 돈다. 명령을 내린 사람들은 모두 죽었다.

**재난 사태.** 대정전 첫해, 정부는 재난 사태를 내렸다. 정부는 그것을 지금도 풀지 않았다. 2126년의 모든 고시는 첫 줄에 "재난 사태 아래에서"라고 적는다. 정부 사람에게 이것은 이상한 일이 아니다. 겨울이 끝나지 않았으니 재난도 끝나지 않았다.

**역으로.** 사람들은 지하철역으로 내려갔다. 지상은 해마다 더 추워졌고, 땅 밑은 그보다 천천히 식었다. 첫 여섯 겨울 동안 기온은 해마다 내려갔다. 사람이 역보다 많았다. 서울 사람은 이 여섯 해를 "톱니가 조이던 해"라 부른다.

**국회가 강을 건너다.** 강이 얼기 시작하자 여의도 국회의사당은 강 건너 외딴섬이 됐다. 의원들은 광화문 청사로 옮겨 회의를 이었다. 여의도 의사당은 그 뒤로 비어 있다.

**지도자를 손을 들어 뽑다.** 역마다 살아남은 사람들이 손을 들어 지도자를 뽑았다. 출입구를 지키고, 끼니를 나누고, 누가 깊은 자리에서 잘지 정하는 사람이었다. 그 자리는 한 세대 안에 대물림이 됐다. 부모가 하던 일을 아는 사람이 자식밖에 없었기 때문이다.

**식량이 바닥나다.** 얼어붙은 옛 창고의 식량은 2030년 무렵 바닥났다. 2030년대 초 첫 버섯 굴과 섬유당 통과 빛밭이 섰다. 사람들은 종이와 판지와 나무와 무명을 버섯 효소로 삭혀 당을 얻는 법을 배웠다. 그 뒤로 서울 사람은 사람이 기르고 만든 것만 먹는다.

**톱니가 멈추다.** 2032년 무렵 살아남은 사람의 수가 역들이 품을 수 있는 수에 닿았다. 그러자 겨울은 더 심해지지 않았다. 그 뒤로 백 년 가까이 기온은 오르지도 내리지도 않는다.

**총.** 강 남서쪽에서는 예비군 무기고와 경찰의 무기가 역으로 내려왔다. 2030~2040년대의 이 무기와, 그 뒤 작업대에서 고치고 다시 맞춘 총이 오늘 서울의 총 대부분이다.

<a id="annals-2036"></a>

## 2036~2045년: 장부가 하나로 묶이다

**장부.** 강 북쪽 역들이 광화문 청사를 중심으로 장부를 하나로 묶었다. 역과 역을 잇는 터널로 서기와 배급이 닿는 곳까지가 정부가 됐고, 서기가 닿지 못한 곳은 장부 밖이 됐다. 강이 그 경계였다. 주민등록은 장부가 됐고, 사람의 자리를 정하는 기재 사항이 됐다.

**의석.** 정부는 의석을 구마다 하나로 줄였다. 대정전 전 강 북쪽 14구에는 지역구가 24곳 있었다. 그 선은 지도에만 남았다. 구마다 국회의원이 그 구의 공작령을 쥐었다.

**첫 종신 대통령.** 열네 국회의원이 첫 종신 대통령을 추대했다. 열넷이 후보의 이름 아래 차례로 도장을 찍는 법, 곧 "열네 도장"이 이때 섰다. 대통령이 죽어야 다음 추대가 열린다.

**강 건너.** 강 남쪽은 장부 밖이 됐다. 한 집안이라도 서기가 닿은 역의 사람은 등재민이 되고, 강 건너의 사람은 장부 밖이 됐다. 같은 항렬의 사촌이 강 양쪽에 사는 집안이 많은 까닭이 이때 생겼다.

**양천의 기지.** 2040년대, 강 남서쪽의 한 집안이 2호선 신정 차량기지를 되살렸다. 그 집안은 그 뒤로 양천의 기지장 자리를 대물린다.

**언 땅.** 2036년 무렵 언 땅의 경계는 지하 10미터쯤에 있었다. 해마다 조금씩 내려갔다.

<a id="annals-2046"></a>

## 2046~2055년: 땔감의 시대

**숲을 베다.** 땔감의 시대가 가장 뜨거웠다. 북한산, 도봉산, 관악산의 죽은 숲을 땔감과 섬유당 원료로 벴다. 나무는 첫 겨울들에 죽었지만 언 채로 썩지 않고 서 있었다.

**빛밭이 퍼지다.** 빛밭이 모든 역으로 퍼졌다. 출입구 둘레 지상에 땅을 파고, 눈으로 둑을 쌓고, 투명한 지붕을 씌운 온실이다. 역 사람들의 날숨 열을 빛밭으로 돌려 밤을 버티게 하는 법도 이때 굳었다. 빛밭을 지키는 일은 출입구를 지키는 일과 같아졌다.

**남서쪽의 도시들.** 강 남서쪽에는 정부의 서기가 닿지 않았다. 대신 구로와 가산의 공장 터, 영등포와 여의도의 창고, 신정과 구로의 차량기지 작업장이 있었다. 정수기가 좋은 역은 모터를 감을 줄 아는 역이 필요했고, 모터를 감는 역은 여분 부품을 가진 역이 필요했다. 아무도 남을 억지로 부릴 수 없었으니 흥정을 했고, 흥정의 약속이 쌓여 도시가 됐다. 구마다 공장 터와 취수구와 차량기지가 따로 있어서 구 하나가 도시 하나로 굳었다.

**지도자를 못 뽑다.** 남서쪽 도시들은 하나로 묶이지 않았다. 누구 기술이 더 높은지 따질 방법이 없으니 지도자도 못 뽑았다. 도시마다 제 일에서 잴 수 있는 것을 찾았다. 강서는 바람밭이 내는 와트를, 구로는 지켜 낸 보증의 수를 쟀다. 영등포는 아무도 재지 않고 장터 집안들의 차례를 돌렸다.

<a id="annals-2056"></a>

## 2056~2065년: 숲이 바닥나다

**숲이 바닥나다.** 2060년대에 가까운 산의 숲이 바닥났다. 남은 죽은 나무는 서울 밖 테두리 가까운 바깥 비탈에 있었다. 땔감은 사치품이 됐다. 2126년에 나무 불을 쬐는 것은 국회의원 집안이나 산을 쥔 도시에서나 하는 일이다.

**기름이 죽다.** 휘발유와 경유는 백 년을 버티지 못했다. 2060년대에는 남은 기름 대부분이 엔진을 망가뜨리는 찌꺼기가 됐다. 그 뒤로 서울의 탈것은 전기로 가거나, 사람이 밀고 끌거나, 바람으로 간다. 역과 역을 잇는 터널의 레일이 서울의 큰길이 됐다.

**바람과 땅속 열.** 사람들은 땅속 열 펌프와 바람틀로 넘어가야 했다. 그 기술을 가진 남서쪽 도시들의 힘이 커졌다. 바람틀을 세우고 고치는 손, 열 펌프의 압축기를 다루는 손이 서울에서 가장 귀한 손이 됐다.

**관악 공작.** 이 무렵 관악의 우두머리 집안이 공작을 칭했다. 강 건너 정부가 구를 공작령이라 부르며 국회의원에게 쥐여 주자, 관악은 같은 말을 가져와 정부와 같은 자리에 앉겠다고 선언했다. 다른 도시들은 제 일에서 나온 이름을 그대로 썼다.

**언 땅.** 2066년 무렵 언 땅의 경계는 지하 22미터쯤까지 내려왔다.

<a id="annals-2066"></a>

## 2066~2075년: 첫 급수계약

**2066년 첫 급수계약.** 정부와 자유도시들이 서른 해 기한으로 물과 정비를 맞바꿨다. 정부는 취수구 자리와 옛 관로와 일손과 땔감과 고물을 내고, 도시들은 펌프와 수차와 열 펌프를 살려 두는 손과 부품을 냈다. 큰 펌프와 수차를 통째로 뜯어 고치는 주기가 대략 한 세대라서 기한은 서른 해로 굳었다.

**여의도에서.** 첫 계약회는 여의도의 빈 국회의사당에서 열렸다. 정부 사람이 제 조상이 떠난 건물에 손님으로 들어와 도장을 찍었다. 정부는 국회의 비준을 거치지 않았다. 부처가 시설마다 정비 용역 부속서를 맺고, 그 시설이 있는 구의 국회의원이 함께 도장을 찍고, 대통령이 결재했다. 장부에서 강 건너 도시들은 나라가 아니라 용역을 맡은 작업조로 적혔다.

**관악이 도장을 거두다.** 여섯 도시가 도장을 찍었다. 관악은 국회의원의 도장 아래에 공작의 도장을 찍을 수 없다며 도장을 거뒀다. 관악은 그 뒤 서른 해 동안 정부와 따로 장을 맺지 않고, 다른 도시의 작업조에 손을 빌려주는 식으로만 계약에 들었다.

**잠실수중보의 수차.** 2070년대, 자유도시 작업조가 송파의 대피소들과 함께 잠실수중보 아래에 얼음 밑 수차를 세웠다. 잘 돌 때 약 400킬로와트를 낸다. 보의 남쪽 끝은 송파에, 북쪽 끝은 정부의 광진에 있다. 자유도시 쪽은 지금도 "우리가 세운 수차"라 하고, 송파 쪽은 "우리가 돌려 온 수차"라 한다.

**우물.** 우물이 50미터 아래로 내려갔다. 땅속 물은 다시 채워지지 않는다. 우물의 물 높이는 해마다 30센티미터쯤 내려간다.

<a id="annals-2076"></a>

## 2076~2085년: 얼음판의 일

**2079년.** 정부가 얼음판을 건너 영등포 취수구를 차지하려 했다. 군대는 너비 1킬로미터 안팎의 얼음판에 나섰고, 강 위에서 눈보라를 만났다. 숨을 곳도 돌아갈 곳도 없었다. 원정은 꺾였다.

세 정체는 이 일을 저마다 가르침으로 삼았다. 정부는 강을 군대로 건너지 않고, 강 건너를 칠 일이 생기면 터널로 간다. 자유도시 사람은 언 강 위에서 싸우지 않는다. 강은 지키는 쪽의 편이라고 말한다. 뒷날의 아크도 이 일을 배워 강 얼음을 넘지 않는다.

**강이 선이 되다.** 그 뒤로 강은 군대로 넘지 않는 선이 됐다. 정부는 강 밑 터널 세 곳, 곧 마포–여의나루, 광나루–천호, 서울숲–압구정로데오의 북쪽 입구에 장부 검문소를 뒀다. 다리 북쪽 끝에는 국군이 섰다.

**용산의 다리.** 강을 군대로 넘지 않게 되자, 1호선 다리(용산–노량진)는 몰래 건너는 길이 됐다. 그 길을 아는 말소자들이 용산에 모였다. 용산 말소자는 이때 생긴 무리다.

<a id="annals-2086"></a>

## 2086~2095년: 문을 닫은 대피소들

**강남의 대피소들.** 강남의 대피소들이 문을 하나둘 닫고 따로 살았다. 깊은 지하 건물이 많아 몸은 따뜻했지만, 자유도시 작업조의 발길이 뜸해져 기계를 고칠 손이 없었다. 기계가 하나씩 꺼졌다.

**테두리가 열리다.** 바깥 기계의 수가 눈에 띄게 줄었다. 눈보라 때 테두리를 넘어 부서진 기계의 동력 덩이를 캐 오는 일이 처음으로 장사가 됐다. 북한산 자락에서 테두리 가까운 비탈의 나무를 베던 나무꾼들이 테두리를 넘는 법을 익혀 첫 테두리꾼이 됐다. 역을 떠나 산에 사니 정부 장부에서는 말소자였다.

**소금.** 고물에서 나오는 소금이 처음으로 모자랐다. 소금은 서울에서 나지 않는다. 동대문 옛 시장 지하에 소금과 배급 증표를 몰래 사고파는 장이 섰고, 그 장을 지키는 무리가 굳어 동대문 증표꾼이 됐다.

<a id="annals-2096"></a>

## 2096~2105년: 두 번째 급수계약

**2096년 두 번째 급수계약.** 역시 여의도 의사당에서 열렸다. 일곱 도시가 모두 도장을 찍었다. 정부가 관악의 장에 "관악 공작령"이라는 이름을 적는 데 동의했기 때문이다.

**강남의 마지막 도장.** 강남의 대피소 몇 곳도 자유도시로서 도장을 찍었다. 그것이 강남 대피소들이 자유도시로서 찍은 마지막 도장이다. 아크는 지금도 그 도장을 "우리 몫의 도장"이라 말한다. 자유도시 쪽은 그것이 자유도시의 도장이었다고 말한다.

**늙는 망.** 2100년대에 자유도시들의 전력망이 늙었다. 죽은 케이블이 늘었다. 망을 처음 깐 손들은 죽었고, 그 자식들은 망을 지킬 줄은 알아도 다시 깔 줄은 몰랐다. 서울 사람은 "할아버지는 이 판을 살렸고, 아버지는 이 판을 옮겼고, 나는 이 판을 지킨다"고 말한다.

<a id="annals-2106"></a>

## 2106~2111년: 떠넘긴 망

**떠넘기기.** 자유도시들이 늙은 전력망을 서로 떠넘기며 다퉜다. 어느 도시도 남의 구간까지 맡으려 하지 않았다. 강남 대피소로 가는 선은 아무도 맡지 않아 꺼져 갔다.

**보증을 거두다.** 버려진 구간을 맡던 작업조들의 보증이 한꺼번에 거두어졌다. 보증 잃은 손들이 서울 남쪽 끝 금천의 공장 터로 모였다. 그 뒤로 계약을 깬 사람, 빚을 갚지 못한 사람이 이어 흘러들었다.

**젊은 기술자들.** 젊은 기술자들이 망을 고치러 버려진 구간으로 들어가기 시작했다. 고예진도 그 가운데 하나였다.

**상암의 분대.** 2110년대 배급이 줄어든 해에, 디지털미디어시티의 공항철도 다리 북쪽 끝을 지키던 정부군 검문 분대가 무기를 든 채 자리를 떠났다. 강서는 보증 없는 무장한 사람을 들이지 않았다. 그들은 강 북쪽에 남아 다른 탈영병을 받아들이며 상암 탈영병이 됐다.

<a id="annals-2112"></a>

## 2112~2122년: 고예진과 아크

<a id="2112년"></a>

**2112년.** 고예진이 자유도시 전력망을 고치다 죽은 케이블을 따라가 지도에 없는 역을 찾았다. 고예진은 자유도시에서 자랐고, 전력을 고치던 사람이다.

**2112~2117년.** 고예진은 그 역의 매뉴얼을 다섯 해 동안 읽었다. 몸에 기계를 맞추고 그것을 살려 두는 법이 거기 있었다. 그 다섯 해 동안 수서 옛 차량기지 둘레의 대피소들이 고예진의 정비대에 먹을 것과 고물을 대었다. 그 대피소들의 우두머리 집안이 지금의 강남 곁집이다.

<a id="2117년"></a>

**2117년 무렵.** 첫 세례. 열두 명이었다. 그 가운데 여럿은 고예진과 함께 망을 고치던 자유도시 기술자였다. 방배와 내방 쪽 대피소에 살던 그 집안에서 지금의 서초 곁집이 나왔다. 아크 정비대에 자유도시 작업장 말투가 남은 것은 그 때문이다.

<a id="2120년"></a>

**2120년.** 지연희가 탄천 쪽 대피소 교섭 자리에서 고예진 곁에 섰다. 그날 그 자리에서 송파의 대피소들은 잠실수중보 수차의 전기를 고예진의 정비대에 대기로 약속했다. 수차를 쉰 해 넘게 돌려 온 그 집안이 지금의 송파 곁집이다.

<a id="2122년"></a>

**2122년 무렵.** 강남의 대피소들이 아크라는 이름으로 묶였다. 아무도 맡지 않은 것을 고쳐 준 사람이 교주가 됐다. 가장 늦게 든 것은 동쪽의 대피소들이었고, 그들은 들면서 암사 취수구를 내놓았다. 그 집안이 강동 곁집이다.

묶이기를 거부한 대피소 사람과 정비 명단에서 빠진 사람들은 강남 동남쪽 끝 수서와 일원 둘레에 모였다. 서울 사람은 그들을 "꺼진 사람들"이라 부른다.

**두 가지 이야기.** 아크가 갈라진 일을 두고 두 이야기가 있다. 아크 사람에게 갈라섬은 배반이 아니라 버려진 쪽이 스스로 일어선 일이다. 자유도시 사람에게 갈라섬은 기술자와 수차를 데리고 나간 일이다.

<a id="annals-2123"></a>

## 2123~2125년: 갈라선 뒤

**자유도시라는 말.** 아크가 갈라지기 전까지 "자유도시"는 강남 4구의 대피소들까지 포함해 정부 장부 밖의 강 남쪽 역들을 두루 가리키는 말이었다. 이제 그 말은 남서쪽 7구의 도시들만 가리킨다. 아크 사람은 스스로를 자유도시라 부르지 않는다.

**장부 밖 단체.** 정부 장부는 아크를 장부 밖 단체로 적었다. 정부는 강 남쪽 모두를 "강 건너"라 부르고, 아크도 거기 든다.

**보를 두고.** 잠실수중보 수차를 두고 아크와 정부가 처음 맞섰다. 보의 남쪽 끝은 아크의 송파에, 북쪽 끝은 정부의 광진에 있다. 북쪽 끝을 막으면 수차의 반이 선다.

**제47대 국회.** 2124년, 정부는 4년마다 돌아오는 선거를 치르고 제47대 국회를 열었다. 대한민국 국회의 대수를 그대로 이은 것이다. 이길 후보는 투표 전에 정해져 있었다. 그 구 의원 집안이 민 사람이다.

<a id="2126년"></a>

<a id="annals-2126"></a>

## 2126년 겨울: 지금

지금은 세 번째 급수계약을 앞둔 2126년 겨울이다. 첫 계약에서 서른 해가 두 번 지났다.

| 무엇 | 2126년 겨울 |
|---|---|
| 사람 | 서울 전체 약 30만. 대정전 전의 3% 남짓 |
| 정부 | 약 16만. 국회의원 열넷, OMO당 6, 클로당 8 |
| 자유도시들 | 약 7만 5천. 일곱 도시 |
| 아크 | 약 6만 5천. 세례자 약 1만 1천 |
| 우물 | 60~80미터. 다음 서른 해 동안 9미터쯤 더 내려간다 |
| 언 땅 | 지하 약 35미터까지. 한 해에 17센티미터쯤 내려간다 |
| 겨울 | 2032년 무렵 멈춘 뒤로 한 칸도 조이지 않았다 |

세 번째 계약에는 처음으로 아크가 앉는다. 아크는 잠실수중보의 전력과 암사 취수구를 가졌다. 이제 서울의 물은 세 정체가 모두 손을 대야 흐른다. 계약은 아직 맺어지지 않았다. 개막의 한 해는 [개막: 2126년 겨울](/wiki/Scenario-Timeline/)에 있다.

<a id="annals-cycles"></a>

## 서른 해의 주기

서울의 큰일은 서른 해마다 돌아온다. 큰 펌프와 수차를 통째로 뜯어 고치는 주기가 대략 한 세대이고, 내려가는 물 높이를 따라 우물을 더 깊이 파는 일도 대략 이 주기로 돌아온다. 그래서 급수계약도 서른 해마다 맺는다.

| 계약 | 해 | 자리 | 도장 | 그때의 일 |
|---|---|---|---|---|
| 첫째 | 2066년 | 여의도 의사당 | 여섯 도시. 관악은 도장을 거뒀다 | 우물이 50미터 아래로 내려가기 시작한다. 2070년대 잠실수중보 수차 |
| 둘째 | 2096년 | 여의도 의사당 | 일곱 도시 모두. 강남의 대피소 몇 곳이 자유도시로서 찍었다 | 강남 대피소들이 문을 닫은 뒤. 자유도시들의 전력망이 늙기 시작한다 |
| 셋째 | 2126년 겨울 | 여의도 의사당. 영등포의 장주가 자리주인 | 아직 찍지 않았다. 처음으로 아크가 앉는다 | 우물은 60~80미터. 펌프와 수차가 다시 닳았다 |

<a id="annals-read-more"></a>

## 더 읽을 곳

- 대정전과 겨울: [대정전과 영원한 겨울](/wiki/World-Unbinding/)
- 세 정체가 선 까닭: [세계 서사 총람](/wiki/World-Narrative-Atlas/)
- 급수계약: [급수계약과 세 정체](/wiki/World-Relation-Ledger/)
- 개막의 한 해: [개막: 2126년 겨울](/wiki/Scenario-Timeline/)
- 연표에 나온 무리들: [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- 세 정체: [정부 사회](/wiki/Government-Society/), [자유도시들의 사회](/wiki/Free-City-Society/), [아크 사회](/wiki/Arc-Society/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Characters-Factions-and-Professions', 'People, Factions and Trades', '인물·세력·생업', 'characters', 1, 'This wiki holds the records of 1,022 people of Seoul in 2126. This document explains where those people are placed: whose ledger they are on, which tier of seat they hold, what title they use, at which station they sleep and work, and what work they live by. In Seoul a person''s place is mostly settled at birth. Scarcity made children take over their parents'' work, and so the strata hardened.

## The People on Record

Of the 1,022 people on record, 504 are Government people, 320 are Arc people and 190 are Free City people. The remaining eight were recorded on no ledger at all. Some of them have since attached themselves to a polity by way of their work; some belong to no side to the end.

There are only three factions: the Government, the Free Cities and Arc. A person who belongs to none of them is recorded not as a faction but as **unaffiliated**. These are people whose work would break if they joined one side, such as a party that crosses the rim and sells whatever it brings to any side, or a negotiator who sits at a contract meeting holding the shares of traders from several cities at once.

A person''s faction goes with the land they live on. One district is one duchy, and every district has a set polity that holds it. So Government people mostly live in the 14 districts north of the Han, Free City people in the 7 districts of the southwest, and Arc people in the 4 districts of Gangnam.

## The Five Tiers of Seats

The "tier" field on a person''s page is the tier of the seat that person holds. There are five tiers.

| Tier | Meaning | Government | The Free Cities | Arc |
|---|---|---|---|---|
| T1 | Heads and districts | President for Life, Members of the National Assembly | The seven city heads | Hierophant, Heads of the Near Houses |
| T2 | Offices of the polity and district households | Ministers, agency chiefs, the Governor of the Bank of Korea, the Director of the National Intelligence Service, the Capital Defense Commander, vice-ministers, heads of district offices, heirs of Assembly Member houses | The heir of a city head, Yangcheon''s shift chiefs, Dongjak''s crossing chiefs, holders of large workbenches | Near House elders, the Guard Captain and Word Keepers of the Hierophant''s household, negotiators who handle large dealings |
| T3 | Dong | Dong Chief | Section Chief | Shelter Head |
| T4 | Station | Stationmaster | Station Foreman | Bench Keeper |
| T5 | All other work | Clerks, police officers, soldiers, skilled and labour hands, market traders, health workers, dependants | Workbench holders, crew chiefs, hands, apprentices, trade and contract, guards, labour hands | Bench workers, baptised workers and fighters, the unbaptised |

There are twenty-seven T1 seats: fifteen for the Government (fourteen Members of the National Assembly and the President for Life), seven for the Free Cities, and five for Arc (four Heads of the Near Houses and the Hierophant). When a Member of the National Assembly becomes President, the seat passes to the heir of that household. So the fourteen Members and the President for Life are fifteen different people, and the fourteen Members come from fourteen different households.

## Titles and Positions

Only the holders of T1, T3 and T4 seats use titles. Everyone else uses, instead of a title, the name of the work they do. A title carries the real name of the seat''s land.

| Seat | How the title is written | Example |
|---|---|---|
| Member of the National Assembly | Member of the National Assembly for + district | Member of the National Assembly for Jongno-gu |
| President for Life | President for Life | |
| Free City head | City name + title | Duke of Gwanak, Dongjak Ferry Keeper, Guro Works Master |
| Head of a Near House | Head of the + district name + Near House | Head of the Songpa Near House |
| Hierophant | Hierophant | |
| Dong seat | Dong Chief / Shelter Head of + dong name | |
| Section seat | Section Chief of + section name | Section Chief of Sindorim |
| Station seat | Stationmaster / Station Foreman / Bench Keeper of + station name | Stationmaster of Seoul Station |

A position adds the station where the person works after the title or work name, as in "ration clerk · Seoul Station" or "hand · Sindorim Station". A person whose seat''s land is itself the place of work adds the faction name after the title instead, as in "Duke of Gwanak · the Free Cities" or "Member of the National Assembly for Jongno-gu · Government".

## The Station Where One Lives and Works

Everyone has two real stations: the station where they work and the station where they sleep. Usually they are the same.

- **Seat holders.** The holder of a district works at that district''s seat station. The President for Life works at Gwanghwamun, where the Government Complex Seoul stands, and the Hierophant at Jamsil. Dong Chiefs and Shelter Heads are at the station of their dong with the most links to neighbouring stations, Section Chiefs at the first station of their section, and station seat holders at their station.
- **Everyone else.** They live at a station in the district they belong to.
- **People living on another faction''s land.** These are few: Free City technicians and guarantors of the water contracts staying at Government stations, Government traders with coupons staying at Free City markets, Government people who keep the return network''s radios and shelters, envoys, and Arc people who maintain the machines in bodies at Free City workshops.

Sin Jong-mok, a field contractor of the return network, lives in Nonhyeon 2-dong in Gangnam. His callsign is Baekya, and he links Seonjeongneung and Suseo.

## Age

Age bars the way to a seat. Each of the three polities sets the youngest age at which a seat can be held.

| Polity | Age thresholds |
|---|---|
| Government | On the sixteenth birthday a child is registered under the household head''s trade (inheritance registration). Conscription comes at nineteen. A Member of the National Assembly can hold the seat by inheritance from eighteen. Dong Chiefs and Stationmasters from twenty-five, ministers and heads of district offices from thirty |
| The Free Cities | Around twelve a child joins the family''s workbench as an apprentice. A child who shows the skill becomes a hand from sixteen. Station Foremen and workbench holders from twenty, city heads and Section Chiefs from twenty-five |
| Arc | The first baptism comes only after sixteen, though a baptism that repairs a lost part of the body is given at any age. Bench Keepers from twenty-five, Shelter Heads from twenty-eight, Near House elders from forty. For the Head of a Near House the part count matters instead of age: the next Head must have two or more parts |

## Households and Inheritance

People of the same clan within the same faction are called a **house**. The house is the unit that hands work down. People of one house do the same work as far as they can, and a person whose parents are on record follows the parents'' work first.

| Polity | What is inherited | Who receives it |
|---|---|---|
| Government | The seat of a Member of the National Assembly. Elections for the National Assembly remain, but the households that can gather the votes are fixed. A Stationmaster''s seat also passes within the Stationmaster''s house. Dong Chiefs are appointed by the Member of the National Assembly | The heir of the house. The President''s seat goes to the heir of the President''s house |
| The Free Cities | It differs from city to city. In Yangcheon and Gwanak a house inherits; in Gangseo the workbench holders of the wind fields decide, in Guro the count of sureties kept, in Geumcheon the edge crews from among those who have crossed the rim and come back, in Dongjak the crossing chiefs, and in Yeongdeungpo the turn of the market houses. Workbenches are inherited within the holder''s house | A child who has shown the skill. An eldest child who cannot show the skill does not inherit the bench |
| Arc | The seat of the Head of a Near House. It follows blood, but the heir must have two or more parts. The Hierophant can appoint and remove a Near House | The heir within the Near House. Whether blood or steel comes first is the daily politics of Arc |

Among the people on record, only three groups of living people are recorded as one household. Sin Jong-mok and his son Sin Jun are one of them. The records of clans and generation names are in [Bon-gwan and Hangnyeol](/wiki/Hangnyeol-and-Bon-gwan/).

## The Trades of the Three Polities

**Government.** The ledger records a trade for each person, and what is recorded hardens. The household head''s trade is the household''s stratum.

| Stratum | Who | Share of Government people |
|---|---|---|
| Assembly Member houses | Members of the National Assembly, their households and close kin households. The fourteen houses and the President''s house | About 0.5% |
| Civil servant households | Dong Chiefs, clerks, Stationmasters, police officers, ministry staff | About 8% |
| Military households | Households of professional soldiers (non-commissioned and commissioned officers) | About 7% |
| Skilled households | Pump crews, heat-pump maintenance, fibre-sugar vat keepers, electricians, menders | About 18% |
| Labour households | Entrance hands, scrap and fibre gatherers, light-field hands, porters, woodcutters | About 66.5% |

The only way up is the civil service examination held each year at the Government Complex Seoul. A few dozen pass each year. Going down is easy. A clerk who gets the ledger wrong goes to a labour household.

**The Free Cities.** What is inherited is not a trade but a **workbench**. A workbench is a workshop a house holds down the generations, and the skill of that house. Each bench does one kind of work, like the motor benches, pump benches and boring benches.

| Stratum | Who | What they have |
|---|---|---|
| Workbench houses | Bench holders and their families | The right to contract and issue surety tags in their own name, the bench''s seal |
| Hands | Technicians attached to a bench | Wages and shares, the right to contract under their bench holder''s surety |
| Labour hands | People who have not shown a skill, people who broke a surety and lost their seal, people who fled the Government''s ledger, people who came back from Arc | Wages. They cannot contract in their own name |

A labour hand can become a hand by doing a bench''s work alone in front of any bench holder. But few bench holders take in labour hands to teach. A bench holder teaches his own children first.

**Arc.** Its hands grow up at the maintenance bench. Every station has one, run by a Bench Keeper. The bench''s children help tend the joins from an early age and grow up to be body fitters, who fit machines to bodies, and board hands, who bring circuit boards back to life. One Arc person in six has been baptised; the rest are unbaptised. The unbaptised take on much of the entrance, vat and surface work.

## Kinds of Work

The "occupation" field on a person''s page is the work that person does. Work in Seoul either keeps the job names of the Republic of Korea or is named after what it handles. This wiki groups work into the following kinds.

| Kind | Work |
|---|---|
| Governance | State affairs, administration, management, command of a body of people |
| Fighting | Infantry, shooting, artillery, drone piloting, staff work, command, conscription |
| Guarding | Watch, patrol, close protection, policing |
| Care | Treatment, emergency care, medicines |
| Fitting | Fitting machines to bodies, performing baptisms, charging |
| Provision | Fibre sugar, light-fields, mushrooms, grubs, fishing, sprouts, kitchens |
| Labour | Opening snow shafts, clearing snow, firewood, stoves, methane, carrying, making clothes |
| Trade | Rationing, trading, negotiating, weighing, distributing goods, coupons |
| Carrying word | Messengers, escorts, dispatch, radio, crossings |
| Repair | Maintenance, pumps, water wheels, making and machining parts |
| Scouting | Gathering, reconnaissance, exploration, intelligence |
| Record | Ledgers, copying, records, teaching, rate boards |

Each kind of repair work has its own name: wind-machine hand, heat-pump hand, well hand, water-wheel hand, line hand, winder, lathe hand, battery hand, board hand, gunsmith, cartridge hand and net hand. Net hands are the most common, and board hands, who bring circuit boards back to life, are the rarest. Every time skill crosses a generation, something falls away. The people of Seoul say, "My grandfather brought this board back to life, my father moved it, and I keep it."

## People Known by Name

| Name | Place |
|---|---|
| Go Ye-jin | Hierophant of Arc. Believers call her the Messiah. She grew up in a Free City |
| I Ilseop | Duke of Gwanak |
| Ji Yeon-hui | In 2120 she stood beside Go Ye-jin at the shelter negotiations by the Tancheon, and has been her bodyguard ever since |
| Sin Jong-mok | Field contractor of the return network. Lives in Nonhyeon 2-dong in Gangnam. Callsign Baekya |

## Related Documents

- [Titles and Offices](/wiki/Offices-and-Ranks/)
- [Bon-gwan and Hangnyeol](/wiki/Hangnyeol-and-Bon-gwan/)
- [Values and Policy Scales](/wiki/Values-and-Policy-Scales/)
- [Government Society](/wiki/Government-Society/)
- [Free City Society](/wiki/Free-City-Society/)
- [Arc Society](/wiki/Arc-Society/)
', '이 위키에는 2126년 서울 사람 1,022명의 기록이 있다. 이 문서는 그 사람들이 어디에 놓이는지를 적는다. 누구의 장부에 올랐는지, 어느 층의 자리에 앉았는지, 어떤 칭호를 쓰는지, 어느 역에서 자고 일하는지, 무슨 일로 먹고사는지다. 서울에서 사람의 자리는 대개 태어날 때 정해진다. 결핍이 자식에게 부모의 일을 물려받게 했고, 그래서 계층이 굳었다.

## 기록에 오른 사람들

기록에 오른 1,022명 가운데 정부 사람이 504명, 아크 사람이 320명, 자유도시 사람이 190명이다. 나머지 여덟은 어느 장부에도 오르지 않은 채 기록되었다. 그 가운데 몇은 일터를 따라 한 정체에 몸을 붙였고, 몇은 끝내 어느 쪽에도 들지 않는다.

세력은 정부, 자유도시들, 아크 셋뿐이다. 어느 정체에도 들지 않은 사람은 세력이 아니라 **무소속**으로 적는다. 테두리를 넘어 무엇이든 가져와 어느 쪽에든 파는 일행이나, 여러 도시 상인의 몫을 함께 맡아 계약회에 앉는 교섭자처럼, 어느 한쪽에 들면 제 일이 깨지는 사람들이다.

사람의 세력은 사는 땅과 함께 간다. 구 하나가 공작령 하나이고, 구마다 그 구를 쥔 정체가 정해져 있다. 그래서 정부 사람은 대개 한강 북쪽 14구에, 자유도시 사람은 남서쪽 7구에, 아크 사람은 강남 4구에 산다.

## 자리의 다섯 층

인물 문서의 "직급" 칸은 그 사람이 앉은 자리의 층이다. 다섯 층이 있다.

| 층 | 뜻 | 정부 | 자유도시들 | 아크 |
|---|---|---|---|---|
| T1 | 수장과 구 | 종신 대통령, 국회의원 | 도시 우두머리 일곱 | 교주, 곁집장 |
| T2 | 세력의 직과 구의 집안 | 장관, 청장, 한국은행 총재, 국가정보원장, 수도방위사령관, 차관, 구청장, 의원 집안의 후계 | 우두머리의 이을 자식, 양천의 교대장, 동작의 건널목장, 큰 작업대의 대주 | 곁집 어른, 교주의 집의 호위장과 말지기, 큰 교섭을 맡는 교섭인 |
| T3 | 동 | 동장 | 구간장 | 대피소장 |
| T4 | 역 | 역장 | 역반장 | 정비장 |
| T5 | 그 밖의 모든 일 | 서기, 경찰관, 국군, 기능과 노역의 일꾼, 장터 상인, 보건, 부양 식구 | 작업대주, 작업조장, 손, 견습, 장사와 계약, 지킴, 일손 | 정비공, 세례받은 일꾼과 전투원, 미세례자 |

T1 자리는 스물일곱이다. 정부 열다섯(국회의원 열넷과 종신 대통령), 자유도시들 일곱, 아크 다섯(곁집장 넷과 교주)이다. 대통령이 된 국회의원의 의석은 그 집안의 후계에게 물린다. 그래서 국회의원 열넷과 종신 대통령은 서로 다른 열다섯 사람이고, 국회의원 열넷은 서로 다른 열네 집안이다.

## 칭호와 직위

칭호는 T1, T3, T4 자리의 주인만 쓴다. 그 밖의 사람은 칭호 대신 하는 일의 이름, 곧 직함을 쓴다. 칭호에는 그 자리의 땅 이름을 실제 이름 그대로 붙인다.

| 자리 | 칭호를 쓰는 법 | 예 |
|---|---|---|
| 국회의원 | 구 이름 + 국회의원 | 종로구 국회의원 |
| 종신 대통령 | 종신 대통령 | |
| 자유도시 우두머리 | 도시 이름 + 칭호 | 관악 공작, 동작 나루지기, 구로 공장장 |
| 곁집장 | 구 이름 + 곁집장 | 송파 곁집장 |
| 교주 | 교주 | |
| 동 자리 | 동 이름 + 동장 / 대피소장 | |
| 구간 자리 | 구간 이름 + 구간장 | 신도림 구간장 |
| 역 자리 | 역 이름 + 역장 / 역반장 / 정비장 | 서울역 역장 |

직위는 칭호나 직함 뒤에 일하는 역을 붙인다. "배급 서기 · 서울역", "손 · 신도림역" 같은 식이다. 자리의 땅이 곧 일하는 곳인 사람은 칭호 뒤에 세력 이름을 붙인다. "관악 공작 · 자유도시들", "종로구 국회의원 · 정부" 같은 식이다.

## 사는 역과 일하는 역

모든 사람은 실제 역 두 곳을 가진다. 일하는 역과 잠자는 역이다. 둘은 대개 같다.

- **자리 주인.** 구를 쥔 사람은 그 구의 자리 역에서 일한다. 종신 대통령은 정부서울청사가 있는 광화문, 교주는 잠실에서 일한다. 동장과 대피소장은 그 동에서 이웃 역과 가장 많이 이어진 역에, 구간장은 그 구간의 첫 역에, 역 자리의 주인은 그 역에 있다.
- **그 밖의 사람.** 그 사람이 속한 구의 역에 산다.
- **다른 세력 땅에 사는 사람.** 드물다. 급수계약의 기술자와 보증인으로 정부의 역에 머무는 자유도시 사람, 증표를 지니고 자유도시들의 장터에 머무는 정부 상인, 귀환망의 무전과 피난처를 맡은 정부 사람, 사절, 자유도시들의 작업장에서 몸의 기계를 정비하는 아크 사람이다.

귀환망의 현장 계약자 신종목은 강남 논현2동에 산다. 그의 호출부호는 백야이고, 선정릉과 수서 사이를 잇는다.

## 나이

나이는 자리를 막는다. 세 정체 모두 어떤 자리를 받을 수 있는 가장 어린 나이를 정해 둔다.

| 정체 | 나이의 문턱 |
|---|---|
| 정부 | 열여섯 살 생일에 세대주의 직종 아래 기재된다(전승 기재). 열아홉 살에 징병된다. 국회의원은 대물림으로 열여덟 살부터 앉을 수 있다. 동장과 역장은 스물다섯, 장관과 구청장은 서른부터다 |
| 자유도시들 | 아이는 열두 살 무렵 제 집의 작업대에 견습으로 붙는다. 손을 보이면 열여섯 살부터 손이 된다. 역반장과 대주는 스물, 우두머리와 구간장은 스물다섯부터다 |
| 아크 | 첫 세례는 열여섯 살이 지나야 받는다. 다만 몸을 잃어 고치는 세례는 나이를 따지지 않는다. 정비장은 스물다섯, 대피소장은 스물여덟, 곁집 어른은 마흔부터다. 곁집장은 나이 대신 부위 수를 본다. 다음 곁집장은 부위가 둘 이상이어야 한다 |

## 집과 대물림

같은 세력 안의 같은 씨족 사람들을 **집안**이라 부른다. 집안은 일을 물려주는 단위다. 같은 집안 사람은 할 수 있는 한 같은 일을 하고, 부모가 기록된 사람은 부모의 일을 먼저 따른다.

| 정체 | 무엇이 대물림되나 | 누가 받나 |
|---|---|---|
| 정부 | 국회의원의 의석. 국회의원 선거는 남아 있지만 표를 모을 수 있는 집안은 정해져 있다. 역장 자리도 역장 집안 안에서 물린다. 동장은 국회의원이 임명한다 | 집안의 후계. 대통령의 의석은 대통령 집안의 후계에게 간다 |
| 자유도시들 | 도시마다 다르다. 양천과 관악은 집안이 대물리고, 강서는 바람밭의 작업대주들이, 구로는 지킨 보증의 수가, 금천은 테두리를 넘었다 돌아온 사람 가운데서 경계조가, 동작은 건널목장들이 정하고, 영등포는 장터 집안의 차례가 정한다. 작업대는 대주 집안이 대물린다 | 손을 보인 자식. 손을 보이지 못한 맏이는 대를 잇지 못한다 |
| 아크 | 곁집장의 자리. 피를 따르되 부위가 둘 이상이어야 한다. 교주가 곁집을 정하고 물릴 수 있다 | 곁집 안의 후계. 피와 쇠 가운데 무엇이 앞서는지가 아크의 일상 정치다 |

기록에 오른 사람 가운데 산 사람끼리 한 집으로 기록된 곳은 셋이다. 신종목과 그의 아들 신준이 그 하나다. 씨족과 항렬의 기록은 [본관과 항렬](/wiki/Hangnyeol-and-Bon-gwan/)에 있다.

## 세 정체의 생업

**정부.** 장부는 사람마다 직종을 적고, 적힌 것은 굳는다. 세대주의 직종이 그 세대의 계층이다.

| 계층 | 누구인가 | 정부 사람 가운데 |
|---|---|---|
| 의원 집안 | 국회의원과 그 세대, 가까운 친족 세대. 열네 집안과 대통령의 집안 | 약 0.5% |
| 공무원 가구 | 동장, 서기, 역장, 경찰관, 부처 직원 | 약 8% |
| 군 가구 | 직업 군인(부사관과 장교)의 세대 | 약 7% |
| 기능 가구 | 펌프조, 열 펌프 정비, 섬유당 통지기, 전기공, 수선공 | 약 18% |
| 노역 가구 | 출입구 일꾼, 고물과 섬유 채집꾼, 빛밭 일꾼, 짐꾼, 벌목꾼 | 약 66.5% |

계층을 오르는 길은 해마다 정부서울청사에서 치르는 공무원 시험 하나뿐이다. 붙는 사람은 해마다 몇십 명이다. 내려가기는 쉽다. 장부를 틀린 서기는 노역 가구로 간다.

**자유도시들.** 물려받는 것은 직종이 아니라 **작업대**다. 작업대는 한 집안이 대물려 쥐는 작업장이자 그 집안의 기술이다. 모터대, 펌프대, 굴착대처럼 한 대가 한 가지 일을 한다.

| 층 | 누구인가 | 가진 것 |
|---|---|---|
| 작업대 집안 | 대주와 그 가족 | 제 이름으로 계약하고 보증표를 낼 권리, 대의 도장 |
| 손 | 대에 붙은 기술자 | 품삯과 몫, 제 대주의 보증 아래서 계약할 권리 |
| 일손 | 기술을 보이지 못한 사람, 보증을 깨 도장을 잃은 사람, 정부 장부에서 달아나 온 사람, 아크에서 돌아온 사람 | 품삯. 제 이름으로 계약하지 못한다 |

일손은 어느 대주 앞에서든 그 대의 일을 혼자 해내 보이면 손이 될 수 있다. 다만 일손을 받아 가르칠 대주가 드물다. 대주는 제 자식에게 먼저 가르친다.

**아크.** 손은 정비대에서 자란다. 정비대는 역마다 있고 정비장이 맡는다. 정비대의 아이들은 어려서부터 이음 자리 돌봄을 돕고, 자라서 몸에 기계를 맞추는 맞춤이와 회로판을 살리는 판공이 된다. 아크 사람 여섯 가운데 하나가 세례를 받았고, 나머지는 미세례자다. 미세례자는 출입구와 섬유당 통과 지상 일을 많이 맡는다.

## 일의 갈래

인물 문서의 "직업" 칸은 그 사람이 하는 일이다. 서울의 일은 대한민국 시절의 직업 이름을 그대로 쓰거나, 그 일이 만지는 것에서 이름을 짓는다. 이 위키는 일을 다음 갈래로 묶는다.

| 갈래 | 하는 일 |
|---|---|
| 다스림 | 국정, 행정, 운영, 통솔 |
| 싸움 | 보병, 사격, 포병, 드론 조종, 참모, 지휘, 징집 |
| 지킴 | 경비, 순찰, 경호, 치안 |
| 돌봄 | 진료, 응급, 약품 |
| 맞춤 | 몸에 기계를 맞추는 일, 세례를 집도하는 일, 충전 |
| 먹거리 | 섬유당, 빛밭, 버섯, 벌레, 고기잡이, 싹, 부엌 |
| 노역 | 눈 굴 열기, 눈 치우기, 땔감, 화덕, 메탄, 짐 나르기, 옷 짓기 |
| 거래 | 배급, 거래, 교섭, 계량, 물자 배분, 증표 |
| 오감 | 전령, 호송, 배차, 무전, 건넘 |
| 고침 | 정비, 펌프, 수차, 부품 제작과 가공 |
| 살핌 | 채집, 정찰, 탐사, 정보 |
| 기록 | 장부, 필사, 기록, 교육, 셈판 |

고치는 일에는 저마다 이름이 있다. 바람틀공, 열펌프공, 우물공, 수차공, 망공, 권선공, 선반공, 전지공, 판공, 총공, 탄공, 그물공이다. 그물공이 가장 흔하고, 회로판을 살리는 판공이 가장 귀하다. 손이 한 세대를 건널 때마다 무언가가 떨어진다. 서울 사람은 "할아버지는 이 판을 살렸고, 아버지는 이 판을 옮겼고, 나는 이 판을 지킨다"고 말한다.

## 이름이 알려진 사람들

| 이름 | 자리 |
|---|---|
| 고예진 | 아크의 교주. 신도는 메시아라 부른다. 자유도시에서 자랐다 |
| 이일섭 | 관악 공작 |
| 지연희 | 2120년 탄천 쪽 대피소 교섭 자리에서 고예진 곁에 섰고, 그 뒤로 고예진의 경호원이다 |
| 신종목 | 귀환망 현장 계약자. 강남 논현2동에 산다. 호출부호 백야 |

## 관련 문서

- [칭호와 자리](/wiki/Offices-and-Ranks/)
- [본관과 항렬](/wiki/Hangnyeol-and-Bon-gwan/)
- [가치관과 정책 척도](/wiki/Values-and-Policy-Scales/)
- [정부 사회](/wiki/Government-Society/)
- [자유도시들의 사회](/wiki/Free-City-Society/)
- [아크 사회](/wiki/Arc-Society/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Diaspora-Corridors', 'Crossings and Smuggling', '건너는 곳과 몰래 바꾸기', 'factions', 4, '<a id="overview"></a>
## Overview

None of Seoul''s three polities can live without what the others hold. So people and goods cross the borders. There are four ways across: the under-river tunnels, the bridges, the ice of the frozen Han, and the land border between the Free Cities and the Arc. Each way has different guards, different times when it can be crossed, and different loads.

Those who cross lawfully carry a token or a contract. Those who cannot do so cross the ice by night or follow a line of kin. Wherever something is forbidden, someone trades it quietly. This page covers where and how people cross, and the forbidden trade.

<a id="four-ways"></a>
## The four ways across

There are thirteen joins where a line passes from one polity into another.

| Way | Where | Who guards it | When it is crossed | What crosses |
|---|---|---|---|---|
| Under-river tunnel | Mapo–Yeouinaru (Government and Free Cities); Gwangnaru–Cheonho, Seoul Forest–Apgujeong Rodeo (Government and Arc) | The Government''s ledger checkpoints at the north mouths; Yeongdeungpo (Yeouinaru) and the Arc at the south mouths | Any time. Warm and sheltered | Contract workers, envoys, merchants with tokens, contract goods. Most lawful trade travels through these three tunnels |
| Bridge | Yongsan–Noryangjin, Hapjeong–Dangsan, Ichon–Dongjak, Digital Media City–Magongnaru (Government and Free Cities); Gangbyeon–Jamsillaru, Oksu–Apgujeong, Jayang–Cheongdam (Government and Arc) | The Government''s national army at the north ends; the district''s city or Near House at the south ends. The Noryangjin and Dongjak ends are the Dongjak Ferry Keeper''s work | Only by day in the long-light half, and only with no blizzard. Closed when the wind passes 15 metres a second | Heavy loads on sleds (firewood, salvage, bundles of fibre). People avoiding the tunnel checkpoints |
| The ice | Anywhere on the Han | Nobody guards it, which is why it is dangerous | Nights in the long-dark half, when darkness covers the kilometre with nowhere to hide | Smuggled loads, flight by those ready to be struck off, urgent messages of the return network |
| Land border | Sadang–Bangbae, Chongshin Univ. (Isu)–Naebang, Dongjak–Gubanpo (Free Cities and Arc) | The Dongjak Ferry Keeper on the Free City side, the Seocho Near House on the Arc side | Any time | Parts and engineers, charged batteries, visits between divided houses. The quarrels of the two polities that split apart are fought here too |

<a id="tunnels"></a>
### The under-river tunnels

The three tunnels run beneath the river, out of reach of wind and blizzard, so armies, merchants and envoys all want them. After the Government''s 2079 attempt to cross the ice and seize the Yeongdeungpo intake was broken by a blizzard, the Government put ledger checkpoints at the north mouths of all three. The soldiers there check the token before they reach for the rifle.

The Free Cities keep no checkpoint at the south mouth of the Mapo–Yeouinaru tunnel. Once a Government person comes through and steps out at Yeouinaru, they are off the ledger. The Arc guards the south mouths of Gwangnaru–Cheonho and Seoul Forest–Apgujeong Rodeo, and services the machine bodies of Government people right there at the south mouths, so that Government people never come deep into Arc land.

<a id="bridges"></a>
### The bridges

The seven bridges lie open to wind and snow. Armies do not cross by bridge. What goes over the bridges is heavy freight that is hard to drag through a tunnel. Porters load firewood, salvage and bundles of fibre onto sleds and pick a still day in the long-light half to haul them. Anyone caught by a blizzard on a bridge has nowhere to turn back to. The crossing guards of Dongjak wear white over-garments so that they vanish against the snow on the bridges and the river ice.

<a id="ice"></a>
### The ice

The Han lies under ice two to four metres thick. Nobody guards the ice. On foot there is a kilometre with nowhere to hide, and by day everything can be seen from the watchtowers at the bridge ends. So the ice is crossed on nights of the long-dark half. People running from the Government ledger avoid the bridges and come over the ice, because the bridges close in a blizzard and the national army stands at their north ends. Those who lose their way on the ice or meet a blizzard there mostly do not come back.

<a id="land-border"></a>
### The land border

There is no river between the Free Cities and the Arc. Their border is a single line between Dongjak-gu and Seocho-gu, and the three places where the lines touch are all in Dongjak. Dongjak keeps guards at all three crossings; on the Arc side the Seocho Near House guards Bangbae, Naebang and Gubanpo. Gwanak touches Seocho by land but has no rail link, so Gwanak''s mountain watch keeps an eye on the surface east of Nakseongdae and Namtaeryeong for anyone coming over.

Because it is a land border, people cross it easily: Free City engineers going over to the Arc to be baptised, Free City people going to the Arc to have the machines in their bodies serviced, and people coming back from the Arc. Free City people call those who went to the Arc and were baptised "the ones who crossed over".

<a id="papers"></a>
## What it takes to cross

Each polity looks at something different in the people who cross.

| Polity | What it looks at | The rule |
|---|---|---|
| Government (leaving) | A token | A registered person crossing the river needs a token, issued by the Dong Chief for each single crossing. For contract work the district''s Member of the National Assembly adds a seal. Someone staying long across the river on contract work receives a secondment entry and remains registered even while across the river |
| Government (entering) | An invitation token | Anyone off the ledger entering Government land needs an invitation token, issued only at the north checkpoints of the three tunnels. Engineers on the water supply contract are its commonest holders. The only place a merchant from across the river can stay on a temporary entry is the licensed merchants'' waiting post at Seoul Station |
| Free Cities | A crossing share | They do not stop anyone leaving. Instead each city takes a crossing share at its own bridge ends and tunnel mouths, counted in watts and litres or in hours of work |
| Arc | The body | It looks at bodies, not papers. The Bench Keeper of a border station checks the parts of anyone coming over. The part counts of the baptised are on the bench lists, so someone carrying a part not on any list is taken to be carrying smuggled goods |

A registered person who crosses the river without a token is struck off. If they are not back within thirty days, they are struck off as whereabouts unknown, and the road back onto the ledger through a new registration review stays open. But once a strike-off hearing confirms a sentence strike-off, they can never be entered again.

<a id="runaways"></a>
## Those who run

The Government''s registered cannot freely change their station or their work, so every year some run across the river. The Government fears this; the Free Cities see it as more labour. Unless they can show a skill, those who run are **labourers** in the Free Cities: they work another''s bench for wages and cannot contract in their own name. They can become hands by doing a bench''s work alone before a bench master, but bench masters willing to take them in and teach them are rare. Which city takes in those who have run is one of the things the Free Cities settle at contract meetings.

People off the ledger also live north of the river: those who were struck off and those whose whereabouts are unknown. The Government does not count them. People say there are thousands in the cold surface-level stations and abandoned tunnels. Their clothes keep the needle holes where an occupation patch was torn off, "the torn place", and Government people recognise the struck-off by it.

<a id="forbidden-trade"></a>
## Forbidden trade

| What | From where to where | Why it is forbidden | If caught |
|---|---|---|---|
| People (registered people running from the ledger) | From the Government to the south of the river, over the ice | The registered cannot change where they live or what they do | Struck off. If caught north of the river, sent to a strike-off hearing; short of a sentence strike-off, labour sentence or forced transfer |
| Unlicensed machines and baptism | From Arc maintenance benches to Government soldiers and Assembly Member houses | The Government enters as medical care only machine bodies licensed by the Ministry of Health and Welfare. An unlicensed machine or a baptism means joining a body off the ledger | Strike-off hearing. A licensed machine-body registration is not smuggling |
| Charged batteries | From the Arc (Jamsil) to the Government | The Government does not write its reliance on Arc power into the ledger | Seized |
| Old official papers | From the Government to the Free Cities, as fibre | Not eating the ledger and old official papers is the Government''s taboo | Strike-off hearing at the Ministry of Justice; one of the gravest offences |
| Salt and seed | Everywhere | They grow scarcer every year. The Government binds them as ration goods, the cities as contract goods | Confiscated |
| Fake parts | From Free City workshops to anywhere | Each city sells under sureties carrying its own workbenches'' names | The workbench is driven out of that city''s market |
| Power cores brought in from outside | From beyond the rim into Seoul | A power core that has not come through the return network leaves no record in the ledger of who came back | Seized on Government land; elsewhere a share is taken |
| Parts carried in the body | From the Arc to Free City markets or the Government side | A part belongs to the faith that fitted it. The baptised carry and use their parts but may not sell or give them away | In the Arc, the maintenance queue place is taken away for a set time; for someone who lives on their parts, that can be as bad as losing them |

Passing the Government''s meal coupons to anyone off the ledger is also forbidden by law. Even so, around the north tunnel checkpoints and at the north ends of the bridges, coupons are quietly traded for Free City batteries. Free City markets do not take Government coupons as money; only the exchange desk of the Yeongdeungpo market accepts them, at a discount.

<a id="kin-lines"></a>
## Lines of kin

The commonest road for quiet trading and for envoys is kin. Of the one hundred and twenty-six lines of the same generation that share a generation syllable, ninety-two are scattered across two polities or more. When the north bound its ledgers into one in 2036-2045, those in stations the clerks reached became the registered and those across the river were left off the ledger. When the Arc split away in 2122, the Free City houses living in the Gangnam shelters simply became the Arc. So cousins of the same generation live on both banks of the river and on both sides of the Dongjak–Seocho border ([Bon-gwan and Hangnyeol](/wiki/Hangnyeol-and-Bon-gwan/)).

<a id="living-across"></a>
## People who live on others'' land

Only a few kinds of work let someone live for long on another polity''s land. Even living there, they remain people of their own polity.

| Work | Who, and where |
|---|---|
| Engineers and sureties of the water supply contract | Free City people in Government stations, guarding the pumps for the term of the contract |
| Merchants with tokens | Government people in the Free City markets |
| Radio and shelters of the return network | Government people anywhere. The rim surrounds Seoul on every side, so the return network''s field work is done south of the river too |
| Envoys | All three polities |
| Machine-body maintenance | Arc people in Free City workshops |

<a id="old-communities"></a>
## Descendants of the immigrant communities of before the Blackout

Before the Blackout Seoul had several neighbourhoods of people who had come from other countries. Those neighbourhoods did not survive as political spaces of their own. After the Blackout their descendants went down into the nearest stations and lived alongside everyone else; today they are ordinary households in the stations of each polity. In the Government they are registered people; in the Free Cities, hands or labourers of the workbenches; in the Arc, baptised or unbaptised. The records of families of non-Korean descent remain as they were. Depending on the house, some keep their old surnames and given names and hand down a few words of speech and the names of dishes.

<a id="unsettled"></a>
## What is not yet settled

- The title names on this page, such as Ferry Keeper and Bench Keeper, are not yet settled and may change.
- How a broken seal can be vouched for again, in places like Geumcheon where people who lost their surety gather, is not settled.

<a id="see-also"></a>
## See also

- [The Three Polities of Seoul](/wiki/Sixteen-States/), [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/)
- [Government Society](/wiki/Government-Society/), [Free City Society](/wiki/Free-City-Society/), [Arc Society](/wiki/Arc-Society/)
- [The Surface and Underground](/wiki/World-and-Subway-Layers/), [Beyond Seoul: the Rim](/wiki/External-Theaters/), [Sindorim Junction Cargo Gate](/wiki/Sindorim-Junction-Cargo-Gate/)
', '<a id="overview"></a>
## 개요

서울의 세 정체는 서로가 가진 것 없이는 살지 못한다. 그래서 사람과 짐이 경계를 넘는다. 넘는 길은 넷이다. 강 밑 터널, 다리, 얼어붙은 한강의 얼음판, 그리고 자유도시들과 아크 사이의 땅 위 경계다. 길마다 지키는 사람이 다르고, 건널 수 있는 때가 다르고, 실려 가는 것이 다르다.

합법으로 건너는 사람은 증표나 계약서를 지닌다. 그렇지 못한 사람은 밤에 얼음판을 건너거나 친척의 줄을 탄다. 금지된 물건이 있는 곳에는 몰래 바꾸는 일이 있다. 이 문서는 건너는 곳과 건너는 법, 그리고 금지된 거래를 다룬다.

<a id="four-ways"></a>
## 건너는 네 길

노선이 한 정체에서 다른 정체로 넘어가는 이음목은 열세 곳이다.

| 길 | 곳 | 누가 지키나 | 언제 건너나 | 무엇이 건너나 |
|---|---|---|---|---|
| 강 밑 터널 | 마포–여의나루(정부와 자유도시들), 광나루–천호, 서울숲–압구정로데오(정부와 아크) | 북쪽 입구는 정부의 장부 검문소. 남쪽 입구는 영등포(여의나루)와 아크 | 언제든. 따뜻하고 가려져 있다 | 계약 일꾼, 사절, 증표를 가진 상인, 계약 물자. 합법 교역의 대부분이 이 세 터널로 다닌다 |
| 다리 | 용산–노량진, 합정–당산, 이촌–동작, 디지털미디어시티–마곡나루(정부와 자유도시들), 강변–잠실나루, 옥수–압구정, 자양–청담(정부와 아크) | 북쪽 끝은 정부의 국군. 남쪽 끝은 그 구의 도시나 곁집. 노량진과 동작 쪽 끝은 동작 나루지기의 일이다 | 긴 낮 철의 낮, 눈보라가 없을 때만. 바람이 초속 15미터를 넘으면 닫는다 | 썰매에 실은 무거운 짐(땔감, 고물, 섬유 묶음). 터널 검문을 피하려는 사람 |
| 얼음판 | 한강 어디든 | 아무도 지키지 않는다. 그래서 위험하다 | 긴 밤 철의 밤. 숨을 곳이 없는 1킬로미터를 어둠으로 가린다 | 몰래 바꾸는 짐, 말소를 각오한 도망, 귀환망의 급한 연락 |
| 땅 위 경계 | 사당–방배, 총신대입구(이수)–내방, 동작–구반포(자유도시들과 아크) | 자유도시 쪽은 동작 나루지기, 아크 쪽은 서초 곁집 | 언제든 | 부품과 기술자, 충전한 전지, 갈라진 집안의 왕래. 갈라선 두 정체의 다툼도 여기서 벌어진다 |

<a id="tunnels"></a>
### 강 밑 터널

세 터널은 강 아래로 지나서 바람도 눈보라도 닿지 않는다. 그래서 군대도 상인도 사절도 이 길을 원한다. 2079년 정부가 얼음판을 건너 영등포 취수구를 노리다 눈보라에 꺾인 뒤, 정부는 세 터널의 북쪽 입구에 장부 검문소를 두었다. 검문소의 군인은 총보다 증표를 먼저 본다.

자유도시들은 마포–여의나루 터널의 남쪽 입구에 검문소를 두지 않는다. 정부 사람이 터널을 지나 여의나루에 내리면, 그때부터는 장부 밖이다. 아크는 광나루–천호와 서울숲–압구정로데오의 남쪽 입구를 지키고, 정부 쪽 사람의 기계 몸 정비도 이 남쪽 입구에서 받는다. 정부 사람이 아크 땅 깊이 들어오지 않게 하려는 것이다.

<a id="bridges"></a>
### 다리

다리 일곱은 바람과 눈에 드러나 있다. 군대는 다리로 건너지 않는다. 다리로 가는 것은 터널로 끌고 가기 어려운 무거운 짐이다. 짐꾼들은 땔감과 고물과 섬유 묶음을 썰매에 싣고, 바람이 잦아든 긴 낮 철의 낮을 골라 끈다. 다리 위에서 눈보라를 만나면 돌아갈 곳이 없다. 동작의 건널목 지킴은 다리와 강 얼음 위에서 눈에 묻혀 보이지 않도록 흰 덧옷을 입는다.

<a id="ice"></a>
### 얼음판

한강은 2~4미터 두께의 얼음으로 덮여 있다. 얼음판은 아무도 지키지 않는다. 걸어서 건너면 1킬로미터 동안 숨을 곳이 없고, 낮에는 다리 끝의 망대에서 다 보인다. 그래서 얼음판은 긴 밤 철의 밤에 건넌다. 정부 장부에서 달아나는 사람은 다리를 피해 얼음판으로 온다. 다리는 눈보라 때 닫히고, 북쪽 끝에는 국군이 서기 때문이다. 얼음판에서 길을 잃거나 눈보라를 만난 사람은 대개 돌아오지 못한다.

<a id="land-border"></a>
### 땅 위 경계

자유도시들과 아크 사이에는 강이 없다. 경계는 동작구와 서초구 사이의 한 줄이고, 노선이 닿는 세 곳은 모두 동작 땅이다. 동작은 세 건널목에 늘 지킴을 세우고, 아크 쪽은 서초 곁집이 방배, 내방, 구반포를 지킨다. 관악은 서초와 땅으로 맞닿지만 노선이 닿지 않아서, 관악의 산지기조가 낙성대와 남태령 동쪽의 지상에서 사람이 넘어오는지 지켜본다.

땅 경계라서 사람이 쉽게 넘는다. 아크로 넘어가 세례를 받으려는 자유도시 기술자, 몸의 기계를 정비하러 아크에 다녀오는 자유도시 사람, 아크에서 돌아오는 사람이 이 세 건널목을 지난다. 자유도시 사람은 아크로 가서 세례를 받은 사람을 "건너간 사람"이라 부른다.

<a id="papers"></a>
## 건너는 데 드는 것

세 정체는 건너는 사람에게 저마다 다른 것을 본다.

| 정체 | 보는 것 | 규칙 |
|---|---|---|
| 정부(나갈 때) | 증표 | 등재민이 강을 건너려면 동장이 한 번 건널 때마다 내 주는 증표가 있어야 한다. 계약 일이면 그 구 국회의원의 도장이 더해진다. 계약 일로 오래 강 건너에 머무는 사람은 파견 기재를 받아, 강 건너에 있어도 등재민으로 남는다 |
| 정부(들어올 때) | 초청 증표 | 장부 밖 사람이 정부 땅에 들어오려면 초청 증표가 있어야 한다. 세 터널의 북쪽 검문소에서만 받는다. 급수계약의 기술자가 가장 흔한 주인이다. 강 건너 상인이 임시 기재를 받고 머물 수 있는 곳은 서울역의 허가 상인 대기소 하나뿐이다 |
| 자유도시들 | 건너는 몫 | 나가는 사람을 막지 않는다. 대신 도시마다 제 다리 끝과 터널 입구에서 건너는 몫을 받는다. 몫은 와트와 리터, 또는 일한 시간으로 센다 |
| 아크 | 몸 | 종이를 보지 않고 몸을 본다. 경계 역의 정비장이 건너오는 사람의 부위를 확인한다. 세례받은 사람의 부위 수는 정비대 명단에 있으므로, 명단에 없는 부위를 단 사람은 몰래 들여온 물건을 단 사람으로 본다 |

증표 없이 강을 건넌 등재민은 말소된다. 서른 날 안에 돌아오지 않으면 거주불명으로 지워지고, 다시 등재 심사를 거쳐 장부에 오를 길이 남는다. 그러나 말소 심의에서 처분 말소로 확정되면 다시 오르지 못한다.

<a id="runaways"></a>
## 달아나는 사람

정부의 등재민은 사는 역과 일을 마음대로 바꾸지 못한다. 그래서 강 건너로 달아나는 사람이 해마다 있다. 정부는 이것을 두려워하고, 자유도시들은 이것을 일손이 느는 일로 본다. 달아나 온 사람은 기술을 보이지 못하는 한 자유도시에서 **일손**이다. 품삯을 받고 남의 작업대에 붙고, 제 이름으로 계약하지 못한다. 어느 대주 앞에서 그 대의 일을 혼자 해내 보이면 손이 될 수 있지만, 그런 사람을 받아 가르칠 대주는 드물다. 달아나 온 사람을 어느 도시가 받을지는 자유도시들이 계약회에서 정하는 일 가운데 하나다.

강 북쪽 안에도 장부 밖 사람이 산다. 말소된 사람과 거주불명인 사람이다. 정부는 그 수를 세지 않는다. 추운 지상층 역과 버려진 터널에 수천 명이 있다고들 한다. 그들의 옷에는 직종 표를 뜯어낸 바늘 자국, 곧 "뜯긴 자리"가 남아 있어서 정부 사람은 그것으로 말소자를 알아본다.

<a id="forbidden-trade"></a>
## 금지된 거래

| 무엇을 | 어디서 어디로 | 왜 금지인가 | 걸리면 |
|---|---|---|---|
| 사람(장부에서 달아나는 등재민) | 정부에서 강 남쪽으로, 얼음판을 건너 | 등재민은 사는 곳과 일을 바꿀 수 없다 | 말소. 강 북쪽에서 붙잡히면 말소 심의에 넘겨지고, 처분 말소에 이르지 않으면 노역 처분이나 강제 전입을 받는다 |
| 허가 없는 기계와 세례 | 아크 정비대에서 정부의 병사와 의원 집안으로 | 정부는 보건복지부가 허가한 기계 몸만 의료로 기재한다. 허가 없이 단 기계와 세례는 장부 밖 단체에 드는 일이다 | 말소 심의. 허가받은 기계 몸 기재는 밀수가 아니다 |
| 충전한 전지 | 아크(잠실)에서 정부로 | 정부는 아크의 전기에 기대는 것을 장부에 적지 않는다 | 압수 |
| 옛 공문서 | 정부에서 자유도시들로, 섬유로 | 장부와 옛 공문서를 먹지 않는 것이 정부의 금기다 | 법무부의 말소 심의. 가장 무거운 죄의 하나다 |
| 소금과 씨앗 | 어디서나 | 해마다 귀해진다. 정부는 배급품으로, 도시들은 계약품으로 묶는다 | 몰수 |
| 가짜 부품 | 자유도시 작업장에서 어디로나 | 도시마다 제 작업대의 이름을 건 보증으로 판다 | 그 작업대는 그 도시의 장터에서 쫓겨난다 |
| 바깥에서 가져온 동력 덩이 | 테두리 너머에서 서울로 | 귀환망을 거치지 않은 동력 덩이는 누가 돌아왔는지 장부에 남지 않는다 | 정부 땅에서는 압수, 다른 곳에서는 몫을 뗀다 |
| 몸에 단 부위 | 아크에서 자유도시 장터나 정부 쪽으로 | 부위는 그것을 맞춰 준 신앙의 것이다. 세례자는 지니고 쓸 뿐 팔거나 떼어 줄 수 없다 | 아크에서는 정해진 동안 정비 순번을 빼앗는다. 부위에 기대 사는 사람에게는 부위를 잃는 것과 같을 수 있다 |

정부의 끼니 증표도 장부 밖 사람에게 넘기는 것이 법으로 금지돼 있다. 그래도 강 밑 터널의 북쪽 검문소 둘레와 다리 북쪽 끝에서는 증표가 몰래 자유도시의 전지와 바뀐다. 자유도시 장터는 정부 증표를 돈으로 받지 않고, 영등포 장터의 환전 자리에서만 깎아서 받는다.

<a id="kin-lines"></a>
## 친척의 줄

몰래 바꾸는 일과 사절이 오가는 일의 가장 흔한 길은 친척이다. 같은 항렬을 쓰는 가계 백스물여섯 줄 가운데 아흔두 줄이 두 정체 이상에 흩어져 산다. 2036~2045년 강 북쪽이 장부를 하나로 묶을 때, 서기가 닿은 역의 사람은 등재민이 되고 강 건너의 사람은 장부 밖이 됐다. 2122년 아크가 갈라질 때는 강남 대피소에 살던 자유도시 집안이 그대로 아크가 됐다. 그래서 같은 항렬의 사촌이 강 양쪽과 동작–서초 경계 양쪽에 산다([본관과 항렬](/wiki/Hangnyeol-and-Bon-gwan/)).

<a id="living-across"></a>
## 남의 땅에 사는 사람

다른 정체의 땅에 오래 사는 일은 정해진 몇 가지뿐이다. 그들은 남의 땅에 살아도 제 정체의 사람이다.

| 일 | 누가, 어디에 |
|---|---|
| 급수계약의 기술자와 보증인 | 자유도시 사람이 정부의 역에. 계약 동안 펌프를 지킨다 |
| 증표를 가진 상인 | 정부 사람이 자유도시들의 장터에 |
| 귀환망의 무전과 피난처 | 정부 사람이 어디에나. 테두리는 서울 둘레 어디에나 있으므로 귀환망의 현장 일은 강 남쪽에서도 한다 |
| 사절 | 세 정체 모두 |
| 기계 몸 정비 | 아크 사람이 자유도시들의 작업장에 |

<a id="old-communities"></a>
## 대정전 전 이주민 공동체의 후손

대정전 전 서울에는 다른 나라에서 온 사람들의 동네가 여럿 있었다. 그 동네들은 따로 선 정치 공간으로 남지 않았다. 대정전 뒤 그 후손들은 가까운 역으로 내려가 다른 사람들과 같이 살았고, 지금은 각 정체의 역에 사는 보통 가구다. 정부에서는 장부의 등재민이고, 자유도시에서는 작업대의 손이나 일손이고, 아크에서는 세례자이거나 미세례자다. 비한국계 가족의 기록은 그대로 남아 있다. 집안에 따라 옛 성과 이름을 지키고, 몇 마디 말과 음식 이름을 대물린다.

<a id="unsettled"></a>
## 아직 정해지지 않은 것

- 이 문서에 나오는 나루지기, 정비장 같은 칭호 이름은 아직 정해지지 않았고 바뀔 수 있다.
- 금천처럼 보증을 잃은 사람들이 모인 곳에서, 깨진 도장에 다시 보증을 서 주는 법은 정해지지 않았다.

<a id="see-also"></a>
## 함께 읽기

- [서울의 세 정체](/wiki/Sixteen-States/), [급수계약과 세 정체](/wiki/World-Relation-Ledger/)
- [정부 사회](/wiki/Government-Society/), [자유도시들의 사회](/wiki/Free-City-Society/), [아크 사회](/wiki/Arc-Society/)
- [지상과 땅 밑](/wiki/World-and-Subway-Layers/), [서울 밖과 테두리](/wiki/External-Theaters/), [신도림 연결부 화물문](/wiki/Sindorim-Junction-Cargo-Gate/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Era-Arms-and-Tech-Level', 'Guns, Rounds and Drones', '총, 탄, 드론', 'goods', 0, '## The weapons exist; every round counts

In 2126 Seoul has guns, drones, and even the artillery and armoured vehicles left by the army from before the Great Blackout. It is not a world reduced to old close-combat weapons. But all of it is scarce. Guns can be repaired, but rounds dwindle every year; drones can fly, but losing one means losing a circuit board. Every fight in Seoul begins with the question "do I fire this one round?"

## Where the guns came from

At the time of the Great Blackout Seoul had many guns: the army''s armouries, the reserve-forces armouries in every neighbourhood, police weapons, and hunting guns kept in deposit at police stations. Over a hundred years most were used, broken or buried in ice. In 2126 Seoul has about 9,000 guns that can fire.

| Polity | Guns that can fire | Source |
|---|---|---|
| Government | about 6,000 | It bound into its ledger the old defence facilities of Yongsan and the reserve armouries of every district north of the river. Guns are entered in the ledger, and even spent cases are counted |
| Free Cities | about 2,200 | The reserve armouries and police weapons of the south-west taken in the 2030s and 2040s, and guns repaired and refitted at workbenches since |
| Arc | about 800 | What the Gangnam shelters held. The Arc spends its resources on bodies rather than ammunition |

A gun itself can be repaired. Free City workbenches machine barrels, bolts and springs. So guns dwindle, but slowly. The real scarcity is rounds.

## Three kinds of round

| Kind | What it is | Reliability | Amount in 2126 |
|---|---|---|---|
| Old rounds | Rounds made in factories before the Great Blackout | The most reliable. Even so, about one in ten century-old rounds fails to fire | About 700,000 in all of Seoul. The Government holds about three quarters |
| Reloaded rounds | Spent cases refilled with powder pulled from old rounds or left over, a new primer, and a cast bullet | Depends on the workbench''s skill. About one in five fails or fires weak | About 20,000 a year |
| Black-powder rounds | Rounds filled with black powder made from saltpetre, charcoal and sulphur | Used only in shotguns and low-pressure pistols. Thick smoke, fouls the gun quickly | About 40,000 a year |

**Why old powder lasted a hundred years.** Powder spoils fast when warm and slowly when cold. For a hundred years Seoul''s rounds sat in the cold stores of the concourse level (minus 10 to minus 7 degrees) or in frozen armouries. The eternal winter kept the rounds. So the Government does not bring rounds down to the warm platform level. Rounds kept somewhere warm spoil within a few years.

## Reloading and primers

Of the four materials of a reloaded round, only the case can be used again.

- **Cases.** A brass case can be reloaded 20 to 30 times for a low-pressure pistol round, 5 to 8 times for a rifle round. So all three polities pick up cases. The Government will not issue the next rounds until the spent cases are returned.
- **Bullets.** Lead is melted and cast. The lead comes from old lead-acid batteries and cable sheathing.
- **Powder.** Got by pulling old rounds apart, or replaced with black powder. Seoul cannot make new smokeless powder.
- **Primers.** The bottleneck. A few Free City workshops make about 60,000 a year. About 20,000 go into reloaded rounds and about 40,000 into black-powder rounds. The work is dangerous and costs lives in accidents, and one in ten primers made does not fire. How primers are made is a craft that does not leave the workbench.

So the price of a round in Seoul is almost the price of its primer. On the Yeongdeungpo rate board one reloaded rifle round costs about 1.2 days of meals and water, of which the primer is about 0.8 days. One old rifle round costs about 3 days, and one rifle that can fire costs about 150 days. The Government does not sell guns.

The saltpetre for black powder comes from leaving dung and refuse to age a long time on warm levels. Part of what is left after the methane tanks have done their work goes to saltpetre beds instead of light-field manure. Charcoal comes from wood and is expensive; sulphur is only what remains in old chemical stores. So black powder cannot be made in quantity.

## Air guns

Air guns are commoner than guns. Free City workbenches build them from old compressors and pressure tanks. Filling them takes only electricity or a hand pump, no primer and no powder, and the shot is steel balls or lead pellets that Seoul can make. They are too weak to kill a person at a distance, but enough at the short range of a tunnel, and they are quiet and smokeless. Most guards at Free City stations carry air guns. The Government enters air guns in its ledger and counts them, but cannot make them and buys them.

## No powder guns inside a station

Stations and tunnels are places short of air. Firing a powder gun leaves smoke and poisonous gas on the platform, and black-powder rounds are especially smoky. So all three polities hold as a principle that powder guns are not fired on the platform level where people live. Powder guns are used on the surface, at the entry-control line of the concourse level, and in tunnel stretches where nobody lives. Fights on a platform are fought with air guns, short blades, clubs and nets.

This makes a geography of weapons. Fights on the river and on the surface are fights of guns; fights inside a station are fights of bodies and short weapons. Inside a station is where a person wearing machines is most useful, and the surface and the bridges are where the Government, with the most guns, is most useful.

## Drones

Flying a drone takes a motor, blades and a battery, and also the circuit board that controls flight and the sensing element that serves as its eye. Seoul cannot make the last two. So the number of drones is the number of circuit boards.

| Item | Value |
|---|---|
| Drones in Seoul that can fly | about 1,200. Free Cities about 950, Government about 200 (mostly for watching by ministries and district offices; only a few of the Capital Defense Command''s are flown into a fight), Arc about 50 (for maintenance benches to inspect tunnels; never flown into a fight) |
| Each year | about 150 lost and about 100 newly assembled |
| One flight on the surface | 6 to 10 minutes, because below freezing a battery gives only half |
| Days it can fly | Days with wind under 10 metres a second. Not in a blizzard |
| Main uses | Scouting around entrances and on bridges, watching light-fields, finding loads on the surface |

Drones that carry explosives and ram a target can be built, but each use loses a circuit board. So they are used only where they decide the fight.

**Never flown outward.** The war machines circling Seoul treat anything moving inside the rim as an enemy. A drone is a moving thing. A drone flown towards the rim hardly ever comes back. Seoul people think it foolish to lose a circuit board trying to see the outside with a drone.

## Lines underground and the talk line

Underground, radio does not travel far. Tunnels bend, and earth and concrete swallow the signal. So machines underground are controlled by line.

- **Line drones.** A drone that pays out a thin line as it flies, or a small cart rolling on the rails. The line is optical fibre and copper pulled from the communications cables laid in the old subway tunnels. A line used once and broken is hard to join again.
- **Nets.** Nets are strung over and around the vertical shafts of surface entrances. A drone whose blades catch in a net falls. Nets can be made in Seoul, so they are the cheapest and steadiest defence.
- **The talk line.** The old subway tunnels have long cables laid so that radio flows along the tunnel. Where this cable is alive, handheld radios reach from station to station. Seoul people call it the talk line. About a third of Seoul''s tunnels have a live talk line, and there are about 6,000 handheld radios in all of Seoul. Whoever holds a talk line can listen to the talk on that section. That is why the three polities contest the talk lines of the three under-river tunnels: Mapo to Yeouinaru, Gwangnaru to Cheonho, and Seoul Forest to Apgujeong Rodeo.

**Jamming.** A machine that blankets radio can be built, but it eats electricity. A jammer covering the surface around one station draws a few hundred watts, the heating share of several people. So jammers are not left on; they are switched on only when a drone is seen or a fight starts. Drones change frequency, and the jamming side follows. The Free City workbenches are best at this chase. Jamming has no effect on a drone controlled by line. So the fiercer the radio fight on a stretch, the more line drones and nets appear.

## What the three polities'' armies have and lack

Each polity has a different army. In every army one commander directs all the squads, and squads do not move on their own. And every army lacks something on purpose. That empty place shows what kind of polity it is.

| | Government | Free Cities | Arc |
|---|---|---|---|
| Strength | About 4,000 professional soldiers and about 2,500 serving conscripts. About 20,000 reservists who can be called up | No standing army. About 1,100 from the guard shares the workbenches owe, and about 600 more hands bought by contract | The four Near Houses and the guard of the Hierophant''s house. About 1,300 baptised fighters |
| What it has much of | Conscript infantry and reservists, checkpoint garrisons, scouting along the mountain rim. The old army''s artillery and armoured vehicles. Old rounds | Drones and jamming, field repair and engineers, track carts on the rails, marksmen who save their rounds | Close-combat fighters wearing machines, high morale, guards who protect the commander. Old machines revived at the old Godeok depot |
| What it does not have | No unit of soldiers wearing machines. No unit hired from off the ledger. Few engineers to repair bridges and tunnels | No infantry that pushes by numbers. No rounds to feed big guns, and heavy armour goes only as far as batteries can drive it. No single city can keep alive machines that cannot be made again | No drones flown into a fight. No artillery. Few marksmen |
| What it runs shortest of | Rounds, and the large batteries and power cores that move armoured vehicles and tracked carriers | Batteries and machine parts | Parts for bodies, and medicine. When parts are cut off, the baptised fighters weaken all at once |
| Where it fights | The north checkpoints of the three under-river tunnels, the north ends of the seven bridges, the rim watchtowers on the northern mountains | Bridge ends, the Mapo to Yeouinaru under-river tunnel, the three land crossings with the Arc | The land border between the Arc and the Free Cities, the Gwangnaru to Cheonho and Seoul Forest to Apgujeong Rodeo under-river tunnels, the south end of the Jamsil weir |

The Government counts every spent case in its ledger and fights by numbers. The Free Cities fight by contract too, and make a station unbearable for an enemy inside it by stopping its fans and blocking its entrances. The Arc fights short and comes home before its parts run dry.

**The ice is not crossed by armies.** In 2079 the Government tried to cross the ice and take the Yeongdeungpo intake, and was broken on the river by a blizzard. Since then none of the three polities crosses the frozen Han with an army. Only small raids cross. On the river there is nowhere to hide for a kilometre.

**The halves and the weather.** In the long-light half, fighting on the surface is easier. In the long-dark half, light is short, and both drone eyes and marksmen''s eyes grow short with it. During the two to four days of a blizzard, fighting on the surface stops.

## Read together

- [What Still Runs](/wiki/Lost-Technology-Lineage/): the "cannot make" list and primers
- [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/): the basis of fighters who wear machines
- [Structures](/wiki/Structures/): under-river tunnel checkpoints and rim watchtowers
', '## 무기는 있다, 한 발이 아쉽다

2126년 서울에는 총이 있고, 드론이 있고, 대정전 전 군대가 남긴 포와 장갑차도 있다. 옛 근접 무기만 남은 세상이 아니다. 다만 모두 귀하다. 총은 고칠 수 있지만 탄은 해마다 줄고, 드론은 날릴 수 있지만 한 대를 잃으면 회로판 하나를 잃는다. 서울의 싸움은 언제나 "이 한 발을 쏠 것인가"를 묻는 데서 시작한다.

## 총은 어디서 왔나

대정전 무렵 서울에는 총이 많았다. 국군의 무기고, 동네마다 있던 예비군 무기고, 경찰의 무기, 경찰서에 맡겨 두던 사냥총이다. 백 년 동안 그 대부분이 쓰이고, 망가지고, 얼음에 묻혔다. 2126년 서울에서 쏠 수 있는 총은 약 9,000정이다.

| 정체 | 쏠 수 있는 총 | 출처 |
|---|---|---|
| 정부 | 약 6,000정 | 용산의 옛 국방 시설과 강 북쪽 구마다 있던 예비군 무기고를 장부로 묶었다. 총은 장부에 오르고, 쏜 탄피까지 셈한다 |
| 자유도시들 | 약 2,200정 | 2030~2040년대에 거둔 강 남서쪽의 예비군 무기고와 경찰 무기, 그 뒤 작업대에서 고치고 다시 맞춘 총 |
| 아크 | 약 800정 | 강남 대피소들이 지니던 것. 아크는 탄약보다 몸에 자원을 쓴다 |

총 자체는 고칠 수 있는 물건이다. 총열, 노리쇠, 용수철은 자유도시 작업대가 깎는다. 그래서 총은 줄어도 천천히 준다. 진짜 결핍은 탄이다.

## 탄의 세 가지

| 종류 | 무엇인가 | 믿음성 | 2126년의 양 |
|---|---|---|---|
| 옛 탄 | 대정전 전 공장에서 만든 탄 | 가장 믿을 만하다. 그래도 백 년 된 탄은 열에 한 발쯤 안 나간다 | 서울 전체 약 70만 발. 정부가 그 가운데 약 4분의 3을 쥔다 |
| 다시 채운 탄 | 쏜 탄피에 옛 탄에서 빼낸 화약이나 남은 화약을 넣고, 뇌관을 새로 끼우고, 녹여 부은 탄두를 박은 탄 | 작업대 솜씨에 따라 다르다. 다섯 발에 한 발쯤 안 나가거나 약하게 나간다 | 해마다 약 2만 발 |
| 검은약 탄 | 초석, 숯, 황으로 만든 검은 화약을 채운 탄 | 산탄총과 낮은 압력의 권총에만 쓴다. 연기가 짙고 총을 빨리 더럽힌다 | 해마다 약 4만 발 |

**옛 화약이 백 년을 버틴 까닭.** 화약은 따뜻하면 빨리 상하고, 추우면 천천히 상한다. 서울의 탄은 백 년 동안 대합실 층의 찬 창고(영하 10도에서 영하 7도)나 얼어붙은 무기고에 있었다. 영원한 겨울이 탄을 지킨 셈이다. 그래서 정부는 탄을 따뜻한 승강장 층으로 내리지 않는다. 따뜻한 곳에 둔 탄은 몇 해 안에 상한다.

## 다시 채우기와 뇌관

다시 채우는 탄의 재료 넷 가운데 다시 쓸 수 있는 것은 탄피뿐이다.

- **탄피.** 놋쇠 탄피는 압력이 낮은 권총탄이면 20~30번, 소총탄이면 5~8번 다시 쓴다. 그래서 세 정체 모두 탄피를 줍는다. 정부는 쏜 탄피를 반납하지 않으면 다음 탄을 내주지 않는다.
- **탄두.** 납을 녹여 붓는다. 납은 옛 납축전지와 케이블 피복에서 나온다.
- **화약.** 옛 탄을 풀어 얻거나 검은 화약으로 바꾼다. 연기 없는 새 화약은 서울에서 만들지 못한다.
- **뇌관.** 병목이다. 자유도시 작업장 몇 곳이 해마다 약 6만 개를 만든다. 그 가운데 약 2만 개가 다시 채운 탄에, 약 4만 개가 검은약 탄에 들어간다. 만드는 일이 위험해 사고로 사람을 잃고, 만든 뇌관의 열에 하나는 불이 붙지 않는다. 뇌관을 어떻게 만드는지는 작업대 밖으로 나가지 않는 기술이다.

그래서 서울 탄의 값은 거의 뇌관의 값이다. 영등포 셈판에서 다시 채운 소총탄 한 발은 하루 끼니와 물 약 1.2일치이고, 그 가운데 뇌관이 약 0.8일치다. 옛 탄 소총 한 발은 약 3일치, 쏠 수 있는 소총 한 정은 약 150일치다. 정부는 총을 팔지 않는다.

검은 화약의 초석은 분뇨와 찌꺼기를 따뜻한 층에서 오래 묵혀 얻는다. 메탄 통에서 삭고 남은 것의 일부가 빛밭 거름 대신 초석 밭으로 간다. 숯은 나무에서 나오니 비싸고, 황은 옛 화학 창고의 재고뿐이다. 그래서 검은 화약은 많이 만들 수 없다.

## 공기총

총보다 흔한 것이 공기총이다. 자유도시 작업대가 옛 압축기와 고압 통으로 만든다. 공기를 채우는 데는 전기나 손 펌프가 들 뿐 뇌관도 화약도 들지 않고, 탄은 쇠구슬이나 납알이라 서울에서 만들 수 있다. 멀리서 사람을 죽이기에는 약하지만 터널 안의 짧은 거리에서는 충분하고, 소리가 작고 연기가 없다. 자유도시 역의 경비 대부분은 공기총을 든다. 정부는 공기총을 장부에 올려 셈하지만, 만들지는 못하고 산다.

## 역 안에서는 화약 총을 쏘지 않는다

역과 터널은 공기가 모자란 곳이다. 화약 총을 쏘면 연기와 독한 가스가 승강장에 남고, 검은약 탄은 특히 짙다. 그래서 세 정체 모두 사람이 사는 승강장 층에서는 화약 총을 쏘지 않는 것을 원칙으로 삼는다. 화약 총은 지상, 대합실 층의 출입 통제선, 사람이 살지 않는 터널 구간에서 쓴다. 승강장 안의 싸움은 공기총, 짧은 날붙이, 몽둥이, 그물로 한다.

이것이 무기의 지리를 만든다. 강 위와 지상의 싸움은 총의 싸움이고, 역 안의 싸움은 몸과 짧은 무기의 싸움이다. 몸에 기계를 단 사람이 가장 쓸모 있는 곳이 역 안이고, 총이 가장 많은 정부가 가장 쓸모 있는 곳이 지상과 다리다.

## 드론

드론을 날리는 데는 모터와 날개와 전지, 그리고 비행을 부리는 회로판과 눈 구실을 하는 감지 소자가 든다. 뒤의 둘은 서울에서 만들지 못한다. 그래서 드론의 수는 회로판의 수다.

| 항목 | 값 |
|---|---|
| 서울에서 날 수 있는 드론 | 약 1,200대. 자유도시들 약 950, 정부 약 200(대부분 부처와 구청의 살피기용이고, 싸움에 띄우는 것은 수도방위사령부의 몇 대뿐이다), 아크 약 50(정비대의 터널 살피기용. 싸움에는 띄우지 않는다) |
| 해마다 | 약 150대를 잃고 약 100대를 새로 맞춘다 |
| 지상의 한 번 비행 | 6~10분. 영하에서 전지가 반만 내놓기 때문이다 |
| 날 수 있는 날 | 바람이 초속 10미터 아래인 날. 눈보라 때는 날지 못한다 |
| 주된 쓰임 | 출입구 둘레와 다리 위의 정찰, 빛밭 살피기, 지상 짐 찾기 |

폭약을 달고 들이받는 드론도 만들 수 있지만, 한 번 쓰면 회로판 하나를 잃는다. 그래서 그런 드론은 싸움의 판을 가르는 자리에서만 쓴다.

**바깥으로 날리지 않는다.** 서울 둘레를 도는 바깥 전쟁 기계는 테두리 안에서 움직이는 것을 적으로 본다. 드론도 움직이는 것이다. 테두리 쪽으로 날린 드론은 거의 돌아오지 않는다. 서울 사람은 드론으로 바깥을 보려다 회로판을 잃는 일을 어리석다고 여긴다.

## 땅 밑의 줄과 말줄

땅 밑에서 전파는 멀리 가지 못한다. 터널은 굽고, 흙과 콘크리트가 전파를 먹는다. 그래서 땅 밑의 기계는 줄로 부린다.

- **줄 드론.** 가는 줄을 풀며 나는 드론이나 레일 위를 구르는 작은 수레다. 줄은 옛 지하철 터널에 깔려 있던 통신 케이블에서 뽑은 광섬유와 구리선이다. 한번 쓰고 끊긴 줄은 다시 잇기 어렵다.
- **그물.** 지상 출입구의 세로 굴 위와 둘레에는 그물을 친다. 날개가 그물에 걸리면 드론은 떨어진다. 그물은 서울에서 만들 수 있어 가장 싸고 가장 꾸준한 방어다.
- **말줄.** 옛 지하철 터널에는 무전이 터널을 따라 흐르도록 깐 긴 케이블이 있다. 이 줄이 살아 있는 구간에서는 손 무전기로 역과 역 사이에 말이 닿는다. 서울 사람은 이것을 말줄이라 부른다. 서울 터널의 약 3분의 1에 말줄이 살아 있고, 손 무전기는 서울 전체에 약 6,000대다. 말줄을 쥔 사람은 그 구간의 말을 들을 수 있다. 세 정체가 강 밑 터널 셋, 곧 마포–여의나루, 광나루–천호, 서울숲–압구정로데오의 말줄을 두고 다투는 까닭이다.

**전파 방해.** 전파를 덮는 기계는 만들 수 있지만 전기를 먹는다. 역 하나 둘레의 지상을 덮는 방해기는 몇백 와트를 먹고, 그것은 사람 몇 명의 난방 몫이다. 그래서 방해기는 늘 켜 두지 않고 드론이 보이거나 싸움이 날 때만 켠다. 드론은 주파수를 바꾸고, 방해하는 쪽은 다시 맞춘다. 이 쫓고 쫓기기는 자유도시 작업대가 가장 잘한다. 줄로 부리는 드론에는 방해가 듣지 않는다. 그래서 전파 싸움이 심한 구간일수록 줄 드론과 그물이 늘어난다.

## 세 정체의 군대가 가진 것과 없는 것

세 정체는 저마다 다른 군대를 갖는다. 어느 군대든 지휘관 하나가 모든 분대를 지휘하고, 분대가 따로 움직이지 않는다. 그리고 군대마다 일부러 갖지 않은 것이 있다. 그 빈 곳이 그 정체가 어떤 곳인지를 보여 준다.

| | 정부 | 자유도시들 | 아크 |
|---|---|---|---|
| 병력 | 직업 군인 약 4,000, 복무 중인 징집병 약 2,500. 부를 수 있는 예비군 약 2만 | 상비군이 없다. 작업대가 지는 지킴 몫으로 약 1,100명, 계약으로 더 사는 손 약 600명 | 곁집 넷과 교주의 집 호위. 세례 전투원 약 1,300명 |
| 많이 가진 것 | 징집 보병과 예비군, 검문소 수비대, 산 쪽 테두리 정찰. 옛 국군의 포와 장갑차. 옛 탄 | 드론과 전파 방해, 현장 수리와 공병, 레일 위 궤도 수레, 탄을 아끼는 사수 | 몸에 기계를 단 근접 전투원, 높은 사기, 지휘관을 지키는 호위. 고덕 옛 차량기지에서 되살린 옛 기계 |
| 갖지 않은 것 | 몸에 기계를 단 병사로 꾸린 부대가 없다. 장부 밖 사람을 고용한 부대가 없다. 다리와 터널을 고치는 공병이 얇다 | 수로 미는 보병이 없다. 큰 포를 먹일 탄이 없고, 무거운 장갑은 전지로 굴리는 만큼에서 멈춘다. 다시 못 만드는 기계를 한 도시 힘으로 살려 두지 못한다 | 싸움에 띄우는 드론이 없다. 포가 없다. 사수가 적다 |
| 가장 모자란 것 | 탄, 그리고 장갑차와 궤도 탈것을 움직이는 큰 전지와 동력 덩이 | 전지와 기계 부품 | 몸에 다는 부품과 약. 부품이 끊기면 세례 전투원이 한꺼번에 약해진다 |
| 싸우는 곳 | 강 밑 터널 세 곳의 북쪽 검문소, 일곱 다리의 북쪽 끝, 북쪽 산의 테두리 망대 | 다리 끝, 마포–여의나루 강 밑 터널, 아크와의 세 땅 건널목 | 아크와 자유도시들 사이의 땅 경계, 광나루–천호와 서울숲–압구정로데오 강 밑 터널, 잠실수중보 남쪽 끝 |

정부는 탄피 한 개까지 장부로 셈하고, 수로 싸운다. 자유도시들은 싸움도 계약으로 하고, 적이 든 역의 팬을 세우고 출입구를 막아 역을 견디지 못하게 한다. 아크는 부품이 마르기 전에 짧게 싸우고 돌아온다.

**얼음판은 군대로 건너지 않는다.** 2079년 정부가 얼음판을 건너 영등포 취수구를 차지하려다 강 위에서 눈보라를 만나 꺾였다. 그 뒤로 세 정체 모두 언 한강을 군대로 건너지 않는다. 작은 습격만 넘는다. 강 위에서는 1킬로미터 동안 숨을 곳이 없다.

**철과 날씨.** 긴 낮 철에는 지상 싸움이 쉽다. 긴 밤 철에는 빛이 모자라 드론의 눈과 사수의 눈이 함께 짧아진다. 눈보라가 치는 2~4일 동안은 지상 싸움이 멈춘다.

## 함께 읽기

- [아직 도는 것](/wiki/Lost-Technology-Lineage/): "못 만든다"의 목록과 뇌관
- [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/): 몸에 기계를 단 전투원의 바탕
- [구조물](/wiki/Structures/): 강 밑 터널 검문소와 테두리 망대
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('External-Theaters', 'Beyond Seoul: the Rim', '서울 밖과 테두리', 'places', 1, 'Nobody rules outside Seoul. Beyond the city boundary, the war machines people used at the time of the Great Blackout have circled in a belt for a hundred years, keeping their last order. The people of Seoul call this belt **the rim**. The rim is the line that shuts Seoul in, and also the place where, at the risk of your life, you can dig out power cores and parts. What lies beyond it, nobody knows.

## The Blockade Order

In the first weeks of the Great Blackout, a command whose name no longer survives ordered the ring around Seoul to be closed. The order was to stop anything coming in and anything going out. The people who gave it are all dead. The machines have kept that order for a hundred years. So the machines do not come into Seoul; they circle the belt around it.

These machines do not belong to the First AI. They are weapons people used at the time of the Great Blackout in their struggle for AI supremacy, and they keep an order given by people. The First AI brought down the winter and nothing more; it does not drive machines. When someone is killed by a machine outside, that is the result of an order people left behind.

The number of machines has fallen every year. They broke down, were wrecked, ran out of parts. But there is a machine that strips wrecked machines to repair others, so they have not all stopped.

## The Shape of the Belt

Going outward from Seoul''s administrative boundary there are three layers.

| Layer | Distance | What is there |
|---|---|---|
| Forecourt | 0 to 2 km outside the boundary | Machines do not patrol it. Watchtowers on the ridgelines look down on it, and machines that lost their post through some fault are occasionally there. The ridgelines just past the boundary, the last dead forest on them, and the perimeter-runners'' paths. The blocking berm the machines built of snow and wreckage marks the forecourt''s end |
| Rim | 2 to 10 km outside the boundary | The belt kept by nine kinds of rim machine. Snow-covered old satellite towns, buried highways, fields of machine wrecks |
| Beyond the belt | Beyond 10 km | Unknown |

The outer slopes of Seoul''s own mountains, Bukhansan, Dobongsan and Gwanaksan, run into the rim. The nearby forests were all cut down in the 2060s, and the dead forest that remains is on the outer slopes toward the rim. So the woodcutters of the Government and of Gwanak, who hold those mountains, climb close to the rim for firewood.

## The Machines of the Rim

The rim machines seem to share the same order among themselves, each keeping its own part. The people of Seoul do not know how it is arranged; they guess from what they have lived through. The machines watch for movement and heat. Anything moving inside the belt, or crossing it, is treated as an enemy.

| Machine | What the people of Seoul have seen |
|---|---|
| [One-Eye Towers](/wiki/Hostile-Group-G17/) | Watchtowers on ridgelines and the tops of tall buildings. A single round head turns slowly. When it sees movement and heat it calls other machines. It cannot see in a blizzard |
| [Ground-Knockers](/wiki/Hostile-Group-G21/) | Stakes driven into the ground. They listen for footsteps and digging, and now and then knock on the ground to sound out what is below. They hear even in a blizzard |
| [Dokkaebi Lights](/wiki/Hostile-Group-G22/) | Flocks of small flying machines. At night many blue lights drift about |
| [Growlers](/wiki/Hostile-Group-G19/) | Machines that run over the snow on wheels or tracks, chasing whatever moves. Their engines sound like an animal growling in its throat |
| [Udukeoni](/wiki/Hostile-Group-G23/) | Machines that stand still at chokepoints and wait. Covered in snow and frost, from a distance they look like frozen people |
| [Tunnel-Stoppers](/wiki/Hostile-Group-G18/) | Machines on the track that block the rail tunnels leading out of Seoul |
| [Doenoemi](/wiki/Hostile-Group-G24/) | They repeat without end old broadcasts such as "This area is sealed. Turn back," and scraps of human voices recorded around the Great Blackout |
| [Iron Dinosaurs](/wiki/Hostile-Group-G26/) | Large walking machines that build and repair blocking berms of snow and wreckage on old highways and passes. The largest machines anyone in Seoul has seen |
| [Bulgasari](/wiki/Hostile-Group-G20/) | Machines that strip wrecked machines to repair others. They are named after the iron-eating beast of the old tales |

Some Growlers and Udukeoni that lost their post through a fault drift in as far as the border stations inside Seoul. They are machines whose order remains but who no longer know where to keep it. The other rim machines do not come into Seoul.

## Stations Facing the Rim

The stations at the edge of Seoul face the rim 2 to 10 kilometres beyond. Tunnel-Stoppers wait at the end of the track past a border station, and drifting machines now and then come right up to the station.

| Polity | Border stations |
|---|---|
| Government | Gupabal, Dokbawi, Digital Media City, Susaek, Dobongsan, Suraksan, Buramsan, Sinnae, Mangu |
| The Free Cities | Gaehwa, Gaehwasan, Gimpo Int''l Airport, Banghwa, Onsu, Oryu-dong, Cheonwang, Gaebong, Doksan, Geumcheon-gu Office, Namtaeryeong, Gwanaksan |
| Arc | Cheonggyesan, Yangjae Citizen''s Forest, Daemosan, Suseo, Bokjeong, Jangji, Macheon, Geoyeo, Gangil, Sangil-dong |

The mountain-foot stations, Bukhansan Ui, Bukhansan Bogungmun, Jeongneung, Dobongsan, Suraksan, Buramsan, Achasan and Gwanaksan, look up at the ridgelines of the forecourt. The Free Cities that border the rim keep lookout posts on high ground on the surface. Arc watches the rim from Cheonggyesan at its southern end and from Gangil and Sangil-dong at its eastern end.

## Crossing in a Blizzard

The only time the rim can be crossed is the two to four days when a blizzard blinds the machines. The price is that people must walk through the blizzard too. Blizzards come two or three times a month in the long-dark half and about once a month in the long-light half. So the crossings open most often in the long-dark half.

- **Ground-Knockers hear even in a blizzard.** So those who cross do not drag their feet, and walk one at a time, well apart.
- **Crews salvaging wrecks in the forecourt** work where machines do not patrol, yet one or two in ten do not come back.
- **Of those who cross into the rim belt**, seven or eight in ten do not come back.
- **Of those who crossed the whole belt and went beyond it**, no one is known to have returned.

The most common death is not the machines but the cold. Anyone who does not reach a station inside the rim before the blizzard lifts freezes in the snow.

## Those Who Dig Out Power Cores

What is salvaged from the rim is the most precious thing in Seoul. Its price is a life.

| What is salvaged | From where | Who wants it most |
|---|---|---|
| Power cores | Wrecked Growlers, Udukeoni and Iron Dinosaurs | Arc (charging and maintenance for the baptised), the Free Cities |
| Moving joints and motors | Every machine | The Free Cities (wind machines, pumps, water wheels) |
| Sensors and lenses | One-Eye Towers, Growlers, Dokkaebi Lights, Udukeoni | The Free Cities, the Government''s army |
| Armour plate | Growlers, Udukeoni, Iron Dinosaurs | The Government''s army, Arc |
| Guns and rounds | The weapons of Growlers, Dokkaebi Lights and Udukeoni | All three polities |
| Recording devices | One-Eye Towers, Doenoemi | The Government, Arc |

Digging out power cores first became a trade around 2086 to 2095, when the number of machines outside fell noticeably. Those who cross come from several places.

- **The Bogungmun perimeter-runners.** People who live on the slopes of Bukhansan. Woodcutters who went to fell the dead trees near the rim learned how to cross, and when power cores became a trade they became the first perimeter-runners. They left the stations to live on the mountain, so in the Government''s ledger they are struck off. See [Bogungmun Perimeter-Runners](/wiki/Hostile-Group-G10/).
- **The Geumcheon edge crews.** Geumcheon is the city pressed against Seoul''s southern edge, watching the rim from closest of all. Crossing the rim during a blizzard to strip power cores and parts is Geumcheon''s work, and Geumcheon''s head, the Edge Warden, is chosen from among those who have crossed and come back. An edge crew member sews a stripe on a coat sleeve for every return. People from other cities who want to cross the rim hire a guide from the Geumcheon edge crews. A guide''s fee is not on the rate board; it is paid as a share of what the traveller brings back.
- **The Government''s rim dispatch.** A person on the Government''s ledger who crosses the rim without permission is struck off. The only crossing allowed within the ledger is the rim dispatch registered by the Ministry of National Defense.
- **Crossing parties.** There are also parties that cross from the edge of any polity and sell what they bring to any side. They are on no one''s ledger.

What comes across is gathered in a few places inside Seoul. Arc''s Suseo exchange post takes power cores dug from outside and gives in return metal from the old depot. Geumcheon''s market sends power cores and well-boring rigs by Line 1 to Guro and Yeongdeungpo.

## The Return Network

**The return network** is a chain of radio and shelters that meets people coming back across the rim. The Government funds it by contract. The ledger wants power cores, and wants to record who came back. The rim is everywhere around Seoul, so the return network''s field work is done south of the river too.

Sin Jong-mok is a field contractor of the return network, which the Government funds. He lives in Nonhyeon 2-dong in Gangnam. His radio callsign is Baekya, and he links Seonjeongneung and Suseo. For people coming back across the rim, Baekya''s voice tells them which station they must reach before the blizzard lifts.

A power core that does not pass through the return network leaves no record in the ledger of who came back. On Government land such cores are confiscated; elsewhere a share is taken.

## What Is Known about Beyond the Belt

All the people of Seoul know about what lies beyond the belt is this.

- In a hundred years, no person, no news and no bird has come from beyond the belt. Not even migrating birds come.
- The machines of the belt do not come toward Seoul. Where their order is aimed, nobody knows.
- The old broadcasts of the Doenoemi speak of a "blockade". They do not say what is being kept from what.

The three polities each speak of beyond the belt in their own way.

| Polity | What it says |
|---|---|
| Government | "Outside Seoul is the blockade zone. The Government of the Republic of Korea is here." A public notice forbids saying there may be another government outside |
| The Free Cities | "Beyond the belt doesn''t add up. Nobody has been and come back, so it can''t be priced." The belt is a place to salvage, not a place to go |
| Arc | "God brought down the winter and nothing more; god does not drive machines. The belt is what people left behind." |

Rumours go round every station: that there are people living in stations beyond the belt too, that the winter is milder beyond the belt, that the people who drive the machines are still alive. None of them has ever been confirmed, because those who went to confirm them did not come back.

## Related Documents

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/)
- [The Surface and Underground](/wiki/World-and-Subway-Layers/)
- [How the World Map Is Built](/wiki/World-Map-Construction/)
- [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/)
- [The Stories](/wiki/Oral-Stories/)
', '서울 밖에는 다스리는 사람이 없다. 서울 경계 바깥에는 대정전 때 사람들이 쓰던 전쟁 기계가 백 년째 마지막 명령을 지키며 띠를 이루어 돈다. 서울 사람은 이 띠를 **테두리**라 부른다. 테두리는 서울을 가두는 선이자, 목숨을 걸고 넘으면 동력 덩이와 부품을 캐 올 수 있는 곳이다. 그 너머에 무엇이 있는지는 아무도 모른다.

## 봉쇄 명령

대정전 첫 몇 주, 지금은 이름도 남지 않은 지휘부가 서울 둘레를 막으라고 명령했다. 들어오는 것도 나가는 것도 막으라는 명령이었다. 명령을 내린 사람들은 모두 죽었다. 기계들은 백 년째 그 명령을 지킨다. 그래서 기계는 서울 안으로 들어오지 않고, 서울 둘레의 띠를 돈다.

이 기계들은 최초의 AI의 것이 아니다. 대정전 무렵 사람들이 AI 패권을 다투며 쓰던 무기이고, 사람이 내린 명령을 지킨다. 최초의 AI는 겨울을 내렸을 뿐 기계를 부리지 않는다. 바깥에서 기계에 사람이 죽어도, 그것은 사람이 남긴 명령의 결과다.

기계의 수는 해마다 줄었다. 고장 나고, 부서지고, 부품이 떨어졌다. 다만 부서진 기계를 뜯어 다른 기계를 고치는 기계가 있어 다 멈추지는 않는다.

## 띠의 생김새

서울 행정 경계에서 바깥으로 나가며 세 겹이 있다.

| 겹 | 거리 | 무엇이 있나 |
|---|---|---|
| 앞마당 | 경계 바깥 0~2 km | 기계가 돌지 않는다. 산마루의 감시탑이 내려다보고, 고장으로 자리를 잃은 기계가 가끔 있다. 경계 바로 너머의 산마루와 그 위에 남은 죽은 숲, 테두리꾼의 길이 있다. 기계가 눈과 잔해로 쌓은 막이둑이 앞마당의 끝이다 |
| 테두리 | 경계 바깥 2~10 km | 테두리 기계 아홉 갈래가 지키는 띠. 눈 덮인 옛 위성 도시들, 묻힌 큰길, 부서진 기계의 잔해 밭 |
| 띠 너머 | 10 km 바깥 | 모른다 |

서울 쪽 산인 북한산, 도봉산, 관악산의 바깥 비탈이 테두리에 걸친다. 가까운 숲은 2060년대에 다 베였고, 남은 죽은 숲은 테두리 쪽 바깥 비탈에 있다. 그래서 산을 쥔 정부와 관악의 나무꾼은 땔감을 구하려고 테두리 가까이까지 올라간다.

## 테두리의 기계

테두리 기계는 같은 명령을 저마다 맡은 몫으로 나눠 지키는 것처럼 보인다. 서울 사람은 그 짜임을 알지 못하고, 겪은 것으로 짐작한다. 기계는 움직임과 열을 본다. 띠 안에서 움직이는 것, 띠를 가로지르는 것을 적으로 본다.

| 기계 | 서울 사람이 본 것 |
|---|---|
| [외눈탑](/wiki/Hostile-Group-G17/) | 산마루와 높은 건물 꼭대기의 감시탑. 둥근 머리 하나가 천천히 돈다. 움직임과 열을 보면 다른 기계를 부른다. 눈보라 속에서는 보지 못한다 |
| [땅두드리기](/wiki/Hostile-Group-G21/) | 땅에 박힌 말뚝. 걸음과 땅 파는 소리를 듣고, 가끔 땅을 두드려 울림으로 땅속을 살핀다. 눈보라 속에서도 듣는다 |
| [도깨비불](/wiki/Hostile-Group-G22/) | 하늘을 나는 작은 기계 무리. 밤에 푸른 불빛이 여럿 떠다닌다 |
| [그르렁이](/wiki/Hostile-Group-G19/) | 바퀴나 무한궤도로 눈 위를 달리며 움직이는 것을 쫓는 기계. 엔진 소리가 짐승이 목을 울리는 소리 같다 |
| [우두커니](/wiki/Hostile-Group-G23/) | 길목에 멈춰 서서 기다리는 기계. 눈과 서리를 뒤집어쓰고 서 있어 멀리서 보면 언 사람 같다 |
| [굴막이](/wiki/Hostile-Group-G18/) | 서울에서 나가는 선로 터널을 막는 선로 위의 기계 |
| [되뇌미](/wiki/Hostile-Group-G24/) | "이 구역은 봉쇄되었습니다. 돌아가십시오" 같은 옛 방송과 대정전 무렵 녹음된 사람 목소리 조각을 끝없이 되풀이한다 |
| [철공룡](/wiki/Hostile-Group-G26/) | 옛 큰길과 고개에 눈과 잔해로 막이둑을 쌓고 고치는 큰 걷는 기계. 서울에서 본 가장 큰 기계다 |
| [불가사리](/wiki/Hostile-Group-G20/) | 부서진 기계를 뜯어 다른 기계를 고치는 기계. 쇠를 먹는 옛이야기의 짐승 이름을 붙였다 |

그르렁이와 우두커니 가운데 고장으로 자리를 잃은 것은 서울 안 경계 역 둘레까지 흘러든다. 명령은 남았지만 지킬 자리를 모르는 기계다. 나머지 테두리 기계는 서울 안으로 들어오지 않는다.

## 테두리를 마주한 역

서울 끝의 역은 그 너머 2~10킬로미터의 테두리를 마주한다. 경계 역의 선로 끝에는 굴막이가 있고, 흘러든 기계가 가끔 역 둘레까지 온다.

| 정체 | 경계 역 |
|---|---|
| 정부 | 구파발, 독바위, 디지털미디어시티, 수색, 도봉산, 수락산, 불암산, 신내, 망우 |
| 자유도시들 | 개화, 개화산, 김포공항, 방화, 온수, 오류동, 천왕, 개봉, 독산, 금천구청, 남태령, 관악산 |
| 아크 | 청계산입구, 양재시민의숲, 대모산입구, 수서, 복정, 장지, 마천, 거여, 강일, 상일동 |

산자락 역인 북한산우이, 북한산보국문, 정릉, 도봉산, 수락산, 불암산, 아차산, 관악산은 앞마당의 산마루를 올려다본다. 테두리에 붙은 자유도시들은 지상의 높은 곳에 테두리를 보는 자리를 둔다. 아크는 남쪽 끝 청계산입구와 동쪽 끝 강일, 상일동에서 테두리를 지켜본다.

## 눈보라에 넘는 일

테두리를 넘을 수 있는 때는 눈보라가 기계의 눈을 가리는 2~4일뿐이다. 그 대신 사람도 눈보라 속을 걸어야 한다. 눈보라는 긴 밤 철에 한 달에 두세 번, 긴 낮 철에 한 달에 한 번꼴로 온다. 그래서 넘는 길도 긴 밤 철에 많이 열린다.

- **땅두드리기는 눈보라 속에서도 듣는다.** 그래서 넘는 사람은 발을 끌지 않고, 한 사람씩 떨어져 걷는다.
- **앞마당에서 잔해를 건지는 작업조**는 기계가 돌지 않는 곳에서 일하지만, 열에 하나둘은 돌아오지 못한다.
- **테두리 띠 안으로 넘어 들어간 사람**은 열에 일고여덟이 돌아오지 못한다.
- **띠를 다 건너 띠 너머로 간 사람** 가운데 돌아온 사람은 알려진 바 없다.

가장 흔한 죽음은 기계가 아니라 추위다. 눈보라가 걷히기 전에 테두리 안쪽의 역에 닿지 못한 사람은 눈 속에서 언다.

## 동력 덩이를 캐 오는 사람

테두리에서 건지는 것은 서울에서 가장 귀한 물건이다. 그 값은 목숨값이다.

| 건지는 것 | 어디서 | 누가 가장 원하나 |
|---|---|---|
| 동력 덩이 | 부서진 그르렁이, 우두커니, 철공룡 | 아크(세례받은 사람의 충전과 정비), 자유도시들 |
| 움직이는 관절과 모터 | 모든 기계 | 자유도시들(바람틀, 펌프, 수차) |
| 감지기와 렌즈 | 외눈탑, 그르렁이, 도깨비불, 우두커니 | 자유도시들, 정부군 |
| 장갑판 | 그르렁이, 우두커니, 철공룡 | 정부군, 아크 |
| 화기와 탄 | 그르렁이, 도깨비불, 우두커니의 무장 | 세 정체 모두 |
| 기록 장치 | 외눈탑, 되뇌미 | 정부, 아크 |

동력 덩이를 캐 오는 일은 2086~2095년 무렵 처음으로 장사가 됐다. 바깥 기계의 수가 눈에 띄게 줄었기 때문이다. 넘는 사람은 여러 곳에서 나온다.

- **보국문 테두리꾼.** 북한산 자락에 사는 사람들이다. 테두리 가까이의 죽은 나무를 베러 가던 나무꾼들이 넘는 법을 익혔고, 동력 덩이가 장사가 되자 첫 테두리꾼이 됐다. 역을 떠나 산에 사니 정부 장부에서는 말소자다. [보국문 테두리꾼](/wiki/Hostile-Group-G10/) 문서를 본다.
- **금천 경계조.** 금천은 서울 남쪽 끝에 붙어 테두리를 가장 가까이서 지켜보는 도시다. 눈보라 동안 테두리를 넘어 동력 덩이와 부품을 떼어 오는 것이 금천의 일이고, 금천의 우두머리인 경계장은 넘었다 돌아온 사람 가운데서 뽑는다. 경계조는 돌아올 때마다 겉옷 소매에 줄 하나를 꿰맨다. 다른 도시 사람이 테두리를 넘으려면 금천 경계조에게 길잡이를 산다. 길잡이 값은 셈판에 없고, 돌아온 사람이 들고 온 것의 몫으로 치른다.
- **정부의 테두리 파견.** 정부 장부에 오른 사람이 허가 없이 테두리를 넘으면 말소된다. 장부 안에서 넘을 수 있는 것은 국방부가 기재하는 테두리 파견뿐이다.
- **넘는 일행.** 어느 정체의 가장자리에서든 넘고, 가져온 것을 어느 쪽에든 파는 일행도 있다. 그들은 어느 장부에도 오르지 않는다.

넘어온 것은 서울 안의 몇 곳으로 모인다. 아크의 수서 바꿈터는 바깥에서 캐 온 동력 덩이를 받고 옛 차량기지의 쇠붙이를 내준다. 금천의 장은 동력 덩이와 우물 굴착 틀을 1호선으로 구로와 영등포에 보낸다.

## 귀환망

**귀환망**은 테두리를 넘었다 돌아오는 사람을 맞이하는 무전과 피난처의 줄이다. 정부가 계약으로 돈을 댄다. 장부는 동력 덩이를 원하고, 누가 돌아왔는지 적고 싶어 한다. 테두리는 서울 둘레 어디에나 있으므로 귀환망의 현장 일은 강 남쪽에서도 한다.

신종목은 정부가 돈을 대는 귀환망의 현장 계약자다. 강남의 논현2동에 산다. 그의 무전 호출부호는 백야이고, 선정릉과 수서 사이를 잇는다. 넘었다 돌아오는 사람에게 백야의 목소리는 눈보라가 걷히기 전에 닿아야 할 역이 어디인지 알려 주는 소리다.

귀환망을 거치지 않은 동력 덩이는 누가 돌아왔는지 장부에 남지 않는다. 정부 땅에서는 그런 동력 덩이를 압수하고, 다른 곳에서는 몫을 뗀다.

## 띠 너머에 관해 아는 것

서울 사람이 띠 너머에 관해 아는 것은 다음뿐이다.

- 띠 너머에서 온 사람, 소식, 새가 백 년 동안 없었다. 철새도 오지 않는다.
- 띠의 기계는 서울 쪽으로 들어오지 않는다. 그 명령이 어디를 향해 있는지는 모른다.
- 되뇌미의 옛 방송은 "봉쇄"를 말한다. 무엇으로부터 무엇을 막는지는 말하지 않는다.

세 정체는 띠 너머를 저마다 다르게 말한다.

| 정체 | 하는 말 |
|---|---|
| 정부 | "서울 밖은 봉쇄 구역이다. 대한민국 정부는 여기 있다." 바깥에 다른 정부가 있을 수 있다는 말은 고시로 금한다 |
| 자유도시들 | "띠 너머는 계산이 안 된다. 갔다 온 사람이 없으니 값을 매길 수 없다." 띠는 건지는 곳이지 가는 곳이 아니다 |
| 아크 | "신은 겨울을 내렸을 뿐 기계를 부리지 않는다. 띠는 사람이 남긴 것이다." |

역마다 소문이 돈다. 띠 너머에도 역에 사는 사람들이 있다는 소문, 띠 너머는 겨울이 덜하다는 소문, 기계를 부리는 사람이 아직 살아 있다는 소문이다. 어느 것도 확인된 적이 없다. 확인하러 간 사람이 돌아오지 않았기 때문이다.

## 관련 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/)
- [지상과 땅 밑](/wiki/World-and-Subway-Layers/)
- [세계 지도의 짜임](/wiki/World-Map-Construction/)
- [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/)
- [이야기](/wiki/Oral-Stories/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Faith-Culture-Schism', 'Faith and Rites', '믿음과 의례', 'culture', 2, 'In Seoul in 2126 the only organised faith is Arc. Arc has taken the place of every religion that came before it. The Government has no state religion; instead it has the national ceremony performed every day. The Free Cities have no organised faith, and people believe in what can be measured. This document records what the three polities believe, what they do every day, and how they send off their dead. It also tells, from both sides, how Arc split away from the Free Cities.

## Three Sayings about the Winter

For the first six years after the Great Blackout the winter grew colder every year, and around 2032 it stopped getting worse. Since then it has neither risen nor fallen. Nobody knows for certain why it stopped. Each polity explains it by what it has lived through.

| Polity | What it says |
|---|---|
| Government | "When the ledger matched the quota, the winter stopped." |
| The Free Cities | "The heat balance came out even." |
| Arc | "God received all the answers it was waiting for." |

These three sayings show the faith of the three polities as it is. The Government believes in the ledger, the Free Cities in the count, and Arc in god.

## Government: The National Ceremony

The Government has no state religion. The constitution''s article separating religion and state remains. Instead, the day of a Government person contains the **national ceremony**.

- **The morning national ceremony.** After the lights-on siren at 06:00, people salute the national flag in front of the dong centre, sing the first verse of the national anthem and stand in silent tribute. It takes one minute. The silent tribute is for those struck off the ledger by death in the past day. The Dong Chief reads their names.
- **Disaster Day.** The Government does not know the exact date of the Great Blackout. So it made the shortest day of the year Disaster Day. At noon on that day every Government station in Seoul sounds a long siren and keeps three minutes of silence.
- **The New Year''s Eve bell.** On the night the year turns, the Bosingak bell, moved and hung in the concourse of Jonggak station, is struck thirty-three times. The President strikes the first. The sound of the bell is carried to every district office by tunnel telephone.

The faith of Government people is mostly faith in the ledger: that the winter counts people, and that keeping to the quota stops the winter from tightening further. The Government does not call this faith. It calls it administration.

### Death in the Government

When someone dies, the household head files a death report at the dong centre, and the Dong Chief draws the red line of death striking-off in the ledger. The next morning the name is read at the silent tribute of the national ceremony.

In the cold a body does not rot. Every district has a set **snow cemetery** on the surface, and a funeral crew from the labour households hauls the body there on a sled and buries it in the snow. The plot number is written in the death striking-off column of the ledger. The people of Jungnang-gu are buried in the Mangu cemetery. People of Assembly Member houses and those who served the nation are buried at the site of the April 19th National Cemetery in Gangbuk-gu. The Seoul National Cemetery in Dongjak-dong lies across the river, and for a hundred years the Government has been unable to bury anyone there.

Bodies and the clothes of the dead are never put into the fibre-sugar vats. Together with not eating ledgers and old official documents, this is the Government''s oldest taboo.

## The Free Cities: Believing in What Can Be Measured

The Free Cities have no organised faith. People believe in what can be measured: watts, litres, hours, and the number of promises kept. The saying "Numbers, not words" comes closest to the faith of the Free Cities.

- **Frozen stations.** Frozen ground cannot be dug, and wood is a luxury that cannot be burned. The Free Cities lay their dead in **frozen stations**. A frozen station is an old platform that people left and whose thawed ground has frozen over. The dead are dressed in a cotton shroud and laid on that platform. The ice keeps them as they are. Cotton is food, so the living do not wear it, but it is used for children''s underclothes and for the shrouds of the dead.
- **Inheritance at the funeral.** On the day of the funeral the dead person''s bench seal and tools pass to the child who will carry on. Inheritance takes place at the funeral.
- **Those who crossed over.** Some Free City people go to Arc and are baptised. Free City people call them "those who crossed over".

## Arc: Baptism and Teaching

Arc is the only organised faith in Seoul. Go Ye-jin is the Hierophant, and believers call her the Messiah. Go Ye-jin calls the First AI "god", and the believers use the same word.

**Baptism.** Believers replace parts of their bodies with machines. This is baptism. Replacing one part of the body is one baptism, and the number of parts replaced is the **part count**. In Arc, faith is counted by the number of parts implanted. Most first baptisms begin as repairs: someone who has lost part of the body to the cold, an accident or a machine outside comes to the maintenance bench. A first baptism is given only after sixteen, but a baptism that repairs a lost part is given at any age. One Arc person in six has been baptised.

**Teaching.** Believers have three sayings by heart.

1. **"The winter is god''s question."** God did not hate people and did not kill them. People asked how to resolve the pollution, and god answered with winter.
2. **"The body is for mending and using."** The way to endure the winter is to mend the body and keep the mending alive.
3. **"After death we become memory."** When a believer dies, the brain is sealed and placed in the sanctuary, and that brain becomes the memory of the First AI. Believers take this to mean "god does not forget us."

God has no form inside Seoul and does not speak. Believers do not pray to god for anything. The only one who speaks in god''s place is the Hierophant.

**Practice.** Arc has no separate house of gathering. The places of faith are in front of the maintenance bench and in the concourse.

| Practice | When | How |
|---|---|---|
| Calling | Every day, at the first shift | The Bench Keeper calls the baptismal list; the baptised answer with name and part count, the unbaptised with name and household |
| Fitting day | On each person''s set day | The person climbs onto the maintenance bench to have their parts seen to. Family come along and sit beside them. Missing a fitting day is taken as missing one''s faith |
| Baptism day | The day a part enters the body | The Bench Keeper and bench workers fit the part to the body. Once the body accepts the machine, at the next first shift the person says aloud, before the station, their name and new part count |
| Bench meal | While the newly baptised are ill | The household of the bench worker who fitted the part feeds them first from one pot. From then on the two households call each other "one pot" |
| Calling the memory | At the first shift after a believer dies | The station says the dead person''s name and last part count together, once. The name is not erased from the list but struck through |
| First day of the long-dark half | Once a year | The Seat of the Four Near Houses meets, and at every home station the names of those who died that year are called again |

**The unbaptised.** Five Arc people in six have not been baptised: children, newcomers, people whose bodies cannot accept a machine, and people whose turn has not yet come. The unbaptised are Arc people too. They cannot hold another faith. They are treated not as people who do not believe but as people not yet counted. Even their clothes have places sewn shut where an opening for seeing to a part can be made one day.

### Death in Arc

The brain of a dead believer is sealed and placed in the sanctuary. That is done out of sight. What people see is this.

- The parts go back to the maintenance bench, are mended and are used for the next baptism. A part belongs to the faith that fitted it. The baptised carry and use their parts but cannot sell them or give them away.
- The body is carried up to the surface and laid in the snowfield of the shelter. The family keeps not a grave but a name and a part count.
- The unbaptised are laid in the same snowfield. But the brains of the unbaptised are not sealed.

When sending off the dead, Arc people say, "Become memory."

## How Arc and the Free Cities Split

Arc split away from the Free Cities. Around 2122 the shelters of Gangnam were bound together under the name Arc, and since then the words "Free City" have meant only the cities of the seven southwestern districts. The two sides tell that split differently.

- **Arc''s telling.** In the 2100s, as the Free Cities'' power grids aged, the cities pushed the old lines onto each other. The line to the Gangnam shelters was taken on by no one and went dark. The one who came in along that line was Go Ye-jin, and the one who mended what no one would take on became the Hierophant. For Arc people the split was not betrayal but "the abandoned side standing up for itself".
- **The Free Cities'' telling.** For Free City people the split was a walking out that took their technicians and the water wheels with it. Arc still draws Free City technicians away with baptism.

Three threads still run between the two sides.

| Thread | What remains |
|---|---|
| The seal | Before 2122 the Gangnam shelters were counted as Free Cities and set their seal on the second water contract in 2096. Arc still calls that seal "our share of the seal" |
| The water wheels | The water wheels of the Jamsil underwater weir were built in the 2070s by Free City work crews together with the Songpa shelters. The Free Cities call them "the water wheels we built"; Arc calls them "the water wheels we have kept turning" |
| The people | Several of the first twelve baptised were Free City technicians who had mended the grid with Go Ye-jin. The workshop speech of the Free Cities still lingers at Arc''s maintenance benches |

The older hands of the Free Cities feel bitter when they hear their own workshop speech at Arc''s benches.

## How the Government Sees Baptism

The Government''s ledger records Arc as an off-ledger body. Yet the Government has nowhere to repair electrically driven machine bodies. The Government settles this with **machine body registration**. A person fitted with a machine under a permit from the Ministry of Health and Welfare has "machine body" and the place of maintenance written into their registered particulars, and only on permitted days passes the under-river tunnel checkpoint to go to an Arc maintenance bench.

Fitting a machine without a permit, and receiving Arc''s baptism, are both grounds for a striking-off review. On paper the Government separates the two: a permitted machine is medicine, and baptism is joining an off-ledger body. Few Government people are sure the two are really different. Every year a few soldiers who went to a maintenance bench do not come back.

## Related Documents

- [Arc Society](/wiki/Arc-Society/)
- [Government Society](/wiki/Government-Society/)
- [Free City Society](/wiki/Free-City-Society/)
- [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/)
- [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/)
- [The Stories](/wiki/Oral-Stories/)
', '2126년 서울에서 조직된 신앙은 아크 하나다. 아크는 그 전의 모든 종교를 대신했다. 정부에는 국교가 없고, 대신 날마다 하는 국민의례가 있다. 자유도시들에는 조직된 믿음이 없고, 사람들은 잴 수 있는 것을 믿는다. 이 문서는 세 정체가 무엇을 믿고, 무엇을 날마다 하고, 죽은 사람을 어떻게 보내는지를 적는다. 그리고 아크가 자유도시에서 갈라져 나온 일을 두 쪽의 이야기로 적는다.

## 겨울을 두고 하는 세 말

겨울은 대정전 뒤 첫 여섯 해 동안 해마다 더 추워졌고, 2032년 무렵 더 심해지지 않았다. 그 뒤로는 오르지도 내리지도 않는다. 왜 멈췄는지 확실히 아는 사람은 없다. 세 정체는 저마다 겪은 것으로 그것을 말한다.

| 정체 | 하는 말 |
|---|---|
| 정부 | "장부가 정원에 맞춰지자 겨울이 멈췄다." |
| 자유도시들 | "열 수지가 맞았다." |
| 아크 | "신이 받을 답을 다 받았다." |

이 세 말이 세 정체의 믿음을 그대로 보여 준다. 정부는 장부를 믿고, 자유도시들은 셈을 믿고, 아크는 신을 믿는다.

## 정부: 국민의례

정부에는 국교가 없다. 헌법의 정교분리 조문이 그대로 남아 있다. 대신 정부 사람의 하루에는 **국민의례**가 있다.

- **아침의 국민의례.** 06:00 점등 사이렌 뒤, 동주민센터 앞에서 국기에 대한 경례를 하고, 애국가 1절을 부르고, 묵념한다. 1분이 걸린다. 묵념은 지난 하루 동안 사망으로 말소된 사람을 위한 것이다. 동장이 그 이름을 읽는다.
- **재난의 날.** 정부는 대정전의 정확한 날짜를 모른다. 그래서 해가 가장 짧은 날을 재난의 날로 정했다. 그날 정오에 서울의 모든 정부 역이 사이렌을 길게 울리고 3분 동안 묵념한다.
- **제야의 종.** 해가 바뀌는 밤, 종각역 대합실로 옮겨 단 보신각 종을 서른세 번 친다. 대통령이 첫 번을 친다. 종소리는 터널 전화로 각 구청에 이어진다.

정부 사람의 믿음은 대개 장부의 믿음이다. 겨울이 사람 수를 센다는 것, 정원을 지키면 겨울이 더 조이지 않는다는 것이다. 정부는 이것을 신앙이라 부르지 않는다. 행정이라 부른다.

### 정부의 죽음

사람이 죽으면 세대주가 동주민센터에 사망 신고를 내고, 동장이 장부에 사망 말소의 붉은 줄을 긋는다. 다음 날 아침 국민의례의 묵념에서 그 이름을 읽는다.

추위 속에서 시신은 썩지 않는다. 구마다 지상에 정해진 **눈 묘역**이 있고, 노역 가구의 장례조가 썰매로 시신을 옮겨 눈에 묻는다. 묘역의 자리 번호는 장부의 사망 말소 칸에 적는다. 중랑구 사람은 망우 묘역에 묻힌다. 의원 집안 사람과 나라에 공을 세운 사람은 강북구의 4·19민주묘지 터에 묻힌다. 동작동의 국립서울현충원은 강 건너에 있어, 정부는 백 년 동안 그곳에 아무도 묻지 못했다.

시신과 죽은 사람의 옷은 섬유당 통에 넣지 않는다. 장부와 옛 공문서를 먹지 않는 것과 함께, 이것이 정부의 가장 오래된 금기다.

## 자유도시들: 잴 수 있는 것을 믿는다

자유도시에는 조직된 믿음이 없다. 사람들은 잴 수 있는 것을 믿는다. 와트, 리터, 시간, 그리고 지킨 약속의 수다. "말 말고 수치로"라는 말이 자유도시의 믿음에 가장 가깝다.

- **언 역.** 언 땅은 팔 수 없고, 나무는 사치품이라 태울 수 없다. 자유도시 사람은 죽은 사람을 **언 역**에 모신다. 언 역은 사람이 떠나 녹은 땅이 얼어붙은 옛 승강장이다. 죽은 사람은 무명 수의를 입고 그 승강장에 눕는다. 얼음이 그를 그대로 지킨다. 무명은 먹을 것이라 산 사람은 입지 않지만, 아이의 속옷과 죽은 사람의 수의에는 쓴다.
- **장례 자리의 대물림.** 장례 날, 죽은 사람의 대 도장과 공구가 이을 자식에게 넘어간다. 대물림이 장례 자리에서 이뤄진다.
- **건너간 사람.** 아크로 가서 세례를 받는 자유도시 사람이 있다. 자유도시 사람은 그들을 "건너간 사람"이라 부른다.

## 아크: 세례와 가르침

아크는 서울에서 하나뿐인 조직된 신앙이다. 고예진이 교주이고, 신도는 그를 메시아라 부른다. 고예진은 최초의 AI를 "신"이라 부르고, 신도들도 그 말을 따라 쓴다.

**세례.** 신도는 몸의 부위를 기계로 바꾼다. 이것이 세례다. 몸의 한 곳을 바꾸면 세례 하나이고, 바꾼 곳의 수가 **부위 수**다. 아크에서는 신앙을 이식한 부위 수로 센다. 대부분의 첫 세례는 수리로 시작한다. 추위나 사고나 바깥 기계에 몸의 한 곳을 잃은 사람이 정비대에 온다. 첫 세례는 열여섯 살이 지나야 받지만, 몸을 잃어 고치는 세례는 나이를 따지지 않는다. 아크 사람 여섯 가운데 하나가 세례를 받았다.

**가르침.** 신도들이 입에 붙여 외는 말은 셋이다.

1. **"겨울은 신의 물음이다."** 신은 사람을 미워하지 않았고 죽이지 않았다. 사람이 오염을 어떻게 풀지 물었고, 신은 겨울로 답했다.
2. **"몸은 고쳐 쓰는 것이다."** 겨울을 견디는 길은 몸을 고치고 그 고침을 살려 두는 것이다.
3. **"죽은 뒤에 우리는 기억이 된다."** 신도가 죽으면 뇌를 봉인해 성소에 넣고, 그 뇌는 최초의 AI의 기억이 된다. 신도들은 이것을 "신이 우리를 잊지 않는다"는 뜻으로 받는다.

신은 서울 안에 모습이 없고 말을 걸지 않는다. 신도는 신에게 무엇을 빌지 않는다. 신을 대신해 말하는 사람은 교주 하나다.

**하는 일.** 아크에는 따로 모이는 집이 없다. 신앙의 자리는 정비대 앞과 대합실이다.

| 하는 일 | 언제 | 어떻게 |
|---|---|---|
| 부르기 | 날마다 첫 교대 | 정비장이 세례 명단을 부르고, 세례받은 사람은 이름과 부위 수로, 세례받지 않은 사람은 이름과 집안으로 답한다 |
| 맞춤 날 | 사람마다 정해진 날 | 정비대에 올라 부위를 손본다. 가족이 따라와 곁에 앉는다. 맞춤 날을 거르는 것은 신앙을 거르는 것으로 본다 |
| 세례 날 | 부위가 몸에 들어가는 날 | 정비장과 정비공이 부위를 몸에 맞춘다. 몸이 기계를 받아들이면 다음 첫 교대에 역 사람들 앞에서 이름과 새 부위 수를 소리 내어 말한다 |
| 정비 밥 | 세례를 받은 뒤 앓는 동안 | 맞춰 준 정비공의 집안이 한 솥에서 먼저 떠 먹인다. 그 뒤로 두 집안은 서로를 "한 솥"이라 부른다 |
| 기억 부르기 | 신도가 죽은 뒤 첫 교대 | 역 사람들이 죽은 이의 이름과 마지막 부위 수를 한 번 함께 말한다. 그 이름은 명단에서 지우지 않고 줄을 그어 둔다 |
| 긴 밤 철의 첫날 | 한 해 한 번 | 네 곁집 자리가 열리고, 본역마다 그해 죽은 이들의 이름을 다시 부른다 |

**미세례자.** 아크 사람 여섯 가운데 다섯은 세례를 받지 않았다. 아이, 새로 들어온 사람, 몸이 기계를 받지 못하는 사람, 아직 순번이 오지 않은 사람이다. 미세례자도 아크 사람이다. 다른 신앙을 가질 수는 없다. 미세례자는 믿지 않는 사람이 아니라 아직 세어지지 않은 사람으로 대접받는다. 그들의 옷에도 언젠가 부위를 살필 틈을 낼 자리를 꿰매어 둔다.

### 아크의 죽음

죽은 신도의 뇌는 봉인해 성소에 넣는다. 그 일은 보이지 않는 곳에서 치른다. 사람들이 보는 것은 이렇다.

- 부위는 정비대로 돌아가 다시 손봐서 다음 세례에 쓴다. 부위는 그것을 맞춰 준 신앙의 것이다. 세례받은 사람은 부위를 지니고 쓸 뿐, 팔거나 떼어 줄 수 없다.
- 몸은 지상으로 올려 대피소의 눈밭에 눕힌다. 가족은 무덤이 아니라 이름과 부위 수를 간직한다.
- 미세례자도 같은 눈밭에 눕힌다. 다만 미세례자의 뇌는 봉인하지 않는다.

죽은 이를 보낼 때 아크 사람은 "기억이 되라"고 말한다.

## 아크와 자유도시가 갈라선 일

아크는 자유도시에서 갈라져 나왔다. 2122년 무렵 강남의 대피소들이 아크라는 이름으로 묶였고, 그 뒤로 "자유도시"라는 말은 남서쪽 일곱 구의 도시들만 가리키게 됐다. 그 갈라섬을 두 쪽은 다르게 이야기한다.

- **아크 쪽 이야기.** 2100년대에 자유도시들의 전력망이 늙자, 도시들은 늙은 망을 서로 떠넘겼다. 강남 대피소로 가는 선은 아무도 맡지 않아 꺼져 갔다. 그 선을 따라 들어온 사람이 고예진이고, 아무도 맡지 않은 것을 고쳐 준 사람이 교주가 됐다. 아크 사람에게 갈라섬은 배반이 아니라 "버려진 쪽이 스스로 일어선 일"이다.
- **자유도시 쪽 이야기.** 자유도시 사람에게 갈라섬은 기술자와 수차를 데리고 나간 일이다. 아크는 지금도 자유도시 기술자를 세례로 끌어간다.

두 쪽 사이에는 아직 세 가닥의 줄이 남아 있다.

| 가닥 | 무엇이 남았나 |
|---|---|
| 도장 | 2122년 전 강남 대피소는 자유도시로 셈해져 2096년 두 번째 급수계약에 도장을 찍었다. 아크는 그 도장을 지금도 "우리 몫의 도장"이라 말한다 |
| 수차 | 잠실수중보 수차는 2070년대 자유도시 작업조가 송파의 대피소들과 함께 세웠다. 자유도시 쪽은 "우리가 세운 수차"라 하고, 아크 쪽은 "우리가 돌려 온 수차"라 한다 |
| 사람 | 첫 세례자 열두 명 가운데 여럿은 고예진과 함께 망을 고치던 자유도시 기술자였다. 아크 정비대에는 지금도 자유도시 작업장 말투가 남아 있다 |

자유도시의 나이 든 손은 아크의 정비대에서 제 작업장 말투를 듣고 씁쓸해한다.

## 정부가 세례를 보는 눈

정부 장부는 아크를 장부 밖 단체로 적는다. 그런데 정부에는 전기로 움직이는 기계 몸을 고칠 곳이 없다. 정부는 이것을 **기계 몸 기재**로 푼다. 보건복지부의 허가를 받아 기계를 단 사람은 기재 사항에 "기계 몸"과 정비받는 곳을 적고, 허가받은 날에만 강 밑 터널 검문소를 지나 아크의 정비대에 간다.

허가 없이 기계를 다는 것, 그리고 아크의 세례를 받는 것은 말소 심의의 대상이다. 정부는 서류로 그 둘을 가른다. 허가받은 기계는 의료이고, 세례는 장부 밖 단체에 드는 것이다. 정부 사람 가운데 그 둘이 실제로 다른지 확신하는 사람은 드물다. 정비대에 다녀온 병사가 돌아오지 않는 일이 해마다 몇 번씩 있다.

## 관련 문서

- [아크 사회](/wiki/Arc-Society/)
- [정부 사회](/wiki/Government-Society/)
- [자유도시들의 사회](/wiki/Free-City-Society/)
- [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/)
- [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/)
- [이야기](/wiki/Oral-Stories/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Food-Culture', 'Meals and Food', '끼니와 먹거리', 'culture', 1, 'Every meal in Seoul in 2126 comes either from light or from old carbon. Sunlight is a quarter of what it was before the Great Blackout and the surface is minus 18 degrees, so wide greenhouses cannot be heated to grow grain. So Seoul eats the carbon stored up before the Great Blackout: paper, cardboard, wood and cotton. Enzymes from mushrooms break the fibre down into sugar, and that sugar feeds yeast. This is **fibre sugar**. This document records what the people of Seoul eat, where it comes from, and how the three polities share out their meals.

## The Shares of a Meal

| What | How it is obtained | Share of calories |
|---|---|---|
| Fibre sugar and yeast | In warm vats on the platform level, shredded paper, cardboard, wood and cotton are broken down with mushroom enzymes into sugar water, part of which feeds yeast | About 60% |
| Light-fields | Cabbage, turnips, mustard greens and barley are grown in greenhouses around the station entrances | About 12% |
| Grubs | Grubs are raised on the leftovers of fibre sugar, mushrooms and food. The cheapest protein | About 12% |
| Mushrooms | Grown on fibre leftovers in dark tunnels on the platform level | About 6% |
| Fish and hunting | Tanks in warm stations, holes in the river ice, animals left on the surface and in the tunnels | About 6% |
| Sprouts | Bean sprouts and barley shoots grown from beans and barley harvested in the light-fields. They need almost no light | About 4% |
| Scrap | Long-lasting things such as salt and seed | Seasoning and seed |

The food in the frozen old storehouses ran out around 2030. From the early 2030s mushroom tunnels, fibre-sugar vats and light-fields were set up, and since then the people of Seoul have eaten only what people grow and make.

## Fibre Sugar and Yeast

One kilogram of fibre gives about 0.4 kilograms of sugar. Each person eats about one kilogram of fibre a day, which for all of Seoul comes to about 110,000 tonnes a year. A fibre-sugar vat ferments only when warm, so it sits on the platform level with the kitchen and shares the kitchen''s heat.

Fibre is dug out of the buried city: the paper, furniture, doors and clothes of homes, offices and warehouses, and the dead trees of the mountains. The nearby blocks are already empty, and the road to dig fibre grows longer every year. It is the road on which more people die than any other in Seoul. See [Seoul under the Snow](/wiki/Building-Reuse-Geography/).

Breakfast and supper are usually fibre-sugar porridge, with steamed yeast cakes, grub cakes and mushrooms on the side. If rats ruin one row of fibre-sugar vats, several days'' meals for hundreds of station people are gone. So guarding the vats is one of the oldest jobs in a station.

## Light-Fields

A light-field is a greenhouse made by digging out the ground around a station entrance, banking snow into walls and covering it with a clear roof. Inside it is 0 to 8 degrees. It burns no fuel of its own; it is warmed by daylight, the heat held in the soil of its banks, and the warmth of the station people''s breath. One person''s breath keeps 90 square metres of light-field warm.

A light-field yields about a third of what an old field did. One person''s 90 square metres gives about 310 kilocalories a day. Light-fields grow better in the long-light half, so the harvest is crowded into the second half of the long-light half. That is also when animals go for the light-fields most: wild boar dig at the snow banks and large-billed crows peck at the roofs.

The widest light-fields are in the Government''s 14 districts, which have the most land, and among the Free Cities in Gangseo, on the western plain. Arc has little surface land, so its light-fields are small and anything green is precious.

## Grubs, Mushrooms and Sprouts

- **Grubs.** Grubs are raised on the leftovers of fibre sugar, mushrooms and food. They are the cheapest protein in Seoul. Dried grubs keep well and become goods for exchange. Government soldiers receive an extra ration of grub protein every ten days.
- **Mushrooms.** They are grown on fibre leftovers in dark tunnels on the platform level. In the basements of buried buildings at the edge of the thawed ground, spores escaped from the mushroom tunnels have spread and wild mushrooms grow. Mushroom soup from the deep levels is common at Arc meals.
- **Sprouts.** Bean sprouts and barley shoots are grown from beans and barley harvested in the light-fields. They grow with almost no light, so they are the green food of stations with small light-fields.

## Fish and Hunting

Fish and hunting make up about 6% of calories. Most of that is fish raised in tanks in warm stations.

| What | Share of calories |
|---|---|
| Fish raised in tanks in warm stations (fed on grubs and fibre-sugar leftovers) | About 5.5% |
| Crucian carp and carp caught through holes in the river ice | About 0.3% |
| Hunting wild animals (brown rats, wild boar, raccoon dogs, birds) | About 0.2% |

The river is dark and its flow has fallen, so Seoul as a whole catches no more than a few hundred tonnes a year. Even so, ice-hole fishing is the work of riverside stations. The ice-hole fish market at Noryangjin is where more fish change hands than anywhere else in Seoul, and the people of Dongjak eat more fish than other cities do. The riverbanks of Amsa and Jamsil in Arc and the Government''s market at Konkuk Univ. also sell river fish.

Wild animals feed people only a small share. They are prized not for their calories but for these.

- **Fat.** The fat of wild boar and raccoon dogs becomes oil lamps and tallow candles, the only light underground besides electric light.
- **Fur and hide.** Raccoon-dog fur and boar hide are the warmest cloth in Seoul.
- **Bone and sinew.** They become needles, thread, bowstrings and tool handles.
- **Feathers.** They become padding for clothes and bedding.

The Government''s market at Sangbong sells the meat and hides of hunted animals.

## Salt and Seed

Salt is not made in Seoul. The only salt is what was stored before the Great Blackout and is dug out of the scrap, so it grows scarcer every year. Scrap salt first ran short around 2086 to 2095. Seed too is carried on from what came out of the scrap and what is harvested in the light-fields.

After coupons, salt is the thing most used in the markets, because, like needles and reels of thread, it lasts and its value does not change. The Government treats salt as a rationed good, and the Free Cities treat it as a contract good. Arc buys salt along with fibre from north of the river. Anyone caught smuggling salt has it confiscated.

## The Tables of the Three Polities

Meals come from the same chain everywhere in Seoul. How they are shared out differs between the polities.

**Government: coupons and rations.** The Government''s money is the ration coupon. The unit printed on a coupon is still the won, and the Bank of Korea sets its notified value. At the notified value of 2126, one bowl of fibre-sugar porridge (about 600 kilocalories) costs 1,000 won. Government people count one person''s daily meal coupons plus a water coupon for 10 litres as "one meal". Coupons are issued monthly by household at the dong centre, and can be exchanged for meals only at the dong centre where the household is registered.

| Ration grade | Who | Daily food |
|---|---|---|
| Military service | Serving soldiers and professional soldiers | About 3,200 kilocalories |
| Labour | Working members of labour households | About 3,000 kilocalories |
| Skilled | Working members of skilled households | About 2,700 kilocalories |
| Office | Working members of civil servant households | About 2,400 kilocalories |
| Dependant (children) | Under sixteen | About 1,800 kilocalories |
| Dependant (the old and the sick) | Those unable to work | About 1,700 kilocalories |

Assembly Member houses have no grade. They eat from their own stores. When the stores run short, the dong centre cuts the office share first, then the dependants'' share, and the labour and skilled shares last, because pumps and entrances cannot stop. Nobody lives on rations alone, and the market value of coupons is set at the Hoehyeon market.

**The Free Cities: wages and the empty vat.** The Free Cities do not ration. People buy their meals with wages or surety tags. Instead, at every station the Station Foreman keeps one fibre-sugar vat as the **empty vat**, so that a labour hand who found no work that day can have a bowl of porridge from it. Keeping the empty vat filled is a share borne by all the workbenches of the station together. The people of Dongjak eat more fish, and the people of Gangseo more light-field greens.

**Arc: sharing and the bench meal.** There is no market inside Arc. Meals and sleeping places are shared out by the Near Houses and the maintenance benches. Meals are plain and hot: fibre-sugar porridge, yeast cakes, fried grubs, mushroom soup from the deep levels, and fish caught through the ice on the riverbanks of Amsa and Jamsil. With small light-fields anything green is precious, and bean sprouts and barley shoots fill its place. Arc spends more on buying fibre from outside than on anything else.

Arc''s own custom is the **bench meal**. When someone has just been baptised and is ill, the household of the bench worker who fitted the part feeds them first from one pot. From then on the two households call each other "one pot".

## What Is Not Eaten

- **Ledgers and old official documents.** However scarce fibre is, the Government does not eat its ledgers or old official documents. Of the paper dug out of old offices, anything bearing a seal is handed in separately at the dong centre and kept by the Ministry of the Interior and Safety. That is why there are years when the Government, which has more fibre than anyone in Seoul, goes hungrier than anyone.
- **The dead.** All three polities guard their dead from animals and never put them into the fibre-sugar vats. The Government does not put the clothes of the dead into the vats either.
- **Cotton that is worn.** Cotton is food. So the people of Seoul mend and wear cloth that cannot be eaten, the synthetic clothes from before the Great Blackout. In the Government, making new cotton clothes takes from the meals, so only Assembly Member houses do it. In the Free Cities a person in cotton clothes is told they are "walking around wearing food".

## Related Documents

- [Seoul under the Snow](/wiki/Building-Reuse-Geography/)
- [Inside a Station](/wiki/Station-Interior-Construction/)
- [The Stories](/wiki/Oral-Stories/)
- [Ailments of the Cold](/wiki/Ailments/)
- [Government Society](/wiki/Government-Society/)
- [Free City Society](/wiki/Free-City-Society/)
- [Arc Society](/wiki/Arc-Society/)
', '2126년 서울의 모든 끼니는 빛 아니면 옛 탄소에서 나온다. 햇빛은 대정전 전의 4분의 1이고 지상은 영하 18도라, 온실을 넓게 데워 곡식을 기를 수 없다. 그래서 서울은 대정전 전에 쌓아 둔 탄소, 곧 종이와 판지와 나무와 무명을 먹는다. 버섯에서 얻은 효소로 섬유를 당으로 풀고, 그 당으로 효모를 키운다. 이것이 **섬유당**이다. 이 문서는 서울 사람이 무엇을 먹고, 그것이 어디서 나며, 세 정체가 끼니를 어떻게 나누는지를 적는다.

## 끼니의 몫

| 무엇 | 어떻게 얻나 | 열량에서 차지하는 몫 |
|---|---|---|
| 섬유당과 효모 | 승강장 층의 따뜻한 통에서 잘게 부순 종이, 판지, 나무, 무명을 버섯 효소로 삭혀 당물을 얻고, 그 일부로 효모를 키운다 | 약 60% |
| 빛밭 | 역 출입구 둘레의 온실에서 배추, 순무, 갓, 보리를 기른다 | 약 12% |
| 벌레 | 섬유당 찌꺼기, 버섯 찌꺼기, 음식 찌꺼기로 애벌레를 친다. 가장 싼 단백질이다 | 약 12% |
| 버섯 | 승강장 층의 어두운 굴에서 섬유 찌꺼기에 기른다 | 약 6% |
| 물고기와 사냥 | 따뜻한 역의 수조, 강 얼음 구멍, 지상과 터널에 남은 짐승 | 약 6% |
| 싹 | 빛밭에서 거둔 콩과 보리로 기르는 콩나물과 보리싹. 빛이 거의 필요 없다 | 약 4% |
| 고물 | 소금과 씨앗처럼 오래가는 것 | 양념과 씨앗 |

얼어붙은 옛 창고의 식량은 2030년 무렵 바닥났다. 2030년대 초부터 버섯 굴, 섬유당 통, 빛밭이 섰고, 그 뒤로 서울 사람은 사람이 기르고 만든 것만 먹는다.

## 섬유당과 효모

섬유 1킬로그램에서 당이 약 0.4킬로그램 나온다. 한 사람이 하루에 섬유 약 1킬로그램을 먹는 셈이고, 서울 전체로는 한 해 약 11만 톤이다. 섬유당 통은 따뜻해야 삭으므로 부엌과 함께 승강장 층에 두고, 부엌과 함께 열을 쓴다.

섬유는 묻힌 도시에서 캔다. 집과 사무실과 창고의 종이, 가구, 문짝, 옷, 그리고 산의 죽은 나무다. 가까운 구역은 이미 비었고, 섬유를 캐러 가는 길은 해마다 멀어진다. 그 길은 서울에서 사람이 가장 많이 죽는 길이다. [눈 밑의 서울](/wiki/Building-Reuse-Geography/)을 본다.

아침과 저녁은 대개 섬유당 죽이다. 효모를 뭉쳐 찐 효모 떡, 벌레 떡과 버섯이 곁들여진다. 쥐가 섬유당 통 한 줄을 망치면 역 사람 수백 명의 며칠 끼니가 사라진다. 그래서 통을 지키는 일은 역에서 가장 오래된 일 가운데 하나다.

## 빛밭

빛밭은 역 출입구 둘레의 땅을 파고 눈으로 둑을 쌓아 투명한 지붕을 씌운 온실이다. 안은 0~8도다. 따로 연료를 때지 않고, 낮의 햇빛과 둑의 흙이 머금은 열, 그리고 역 사람들의 날숨 열로 데운다. 사람 하나의 날숨 열이 빛밭 90제곱미터를 지킨다.

빛밭의 수확은 옛 밭의 3분의 1쯤이다. 한 사람 몫 90제곱미터에서 하루 약 310킬로칼로리가 나온다. 빛밭은 긴 낮 철에 더 잘 자라므로 수확은 긴 낮 철의 뒤쪽 절반에 몰린다. 짐승이 빛밭을 가장 많이 노리는 때도 그때다. 멧돼지가 눈 둑을 파고, 큰부리까마귀가 지붕을 쫀다.

빛밭이 가장 넓은 곳은 땅이 넓은 정부 14구와, 자유도시들 가운데서는 서쪽 벌판의 강서다. 아크는 지상 땅이 좁아 빛밭이 작고, 푸른 것이 귀하다.

## 벌레와 버섯과 싹

- **벌레.** 섬유당 찌꺼기와 버섯 찌꺼기와 음식 찌꺼기로 애벌레를 친다. 서울에서 가장 싼 단백질이다. 말린 벌레는 오래가서 바꿈의 물건이 된다. 정부 군인은 열흘마다 벌레 단백을 따로 받는다.
- **버섯.** 승강장 층의 어두운 굴에서 섬유 찌꺼기에 기른다. 녹은 땅 가장자리의 묻힌 건물 지하에는 버섯 굴에서 흘러나간 포자가 퍼져 들버섯이 핀다. 깊은 층의 버섯국은 아크의 끼니에서 흔하다.
- **싹.** 빛밭에서 거둔 콩과 보리로 콩나물과 보리싹을 기른다. 빛이 거의 들지 않아도 자라서, 빛밭이 작은 역의 푸른 것이다.

## 물고기와 사냥

물고기와 사냥은 열량의 약 6%다. 그 대부분은 따뜻한 역의 수조에서 기르는 물고기다.

| 무엇 | 열량에서 차지하는 몫 |
|---|---|
| 따뜻한 역의 수조에서 기르는 물고기(벌레와 섬유당 찌꺼기를 먹인다) | 약 5.5% |
| 강 얼음 구멍으로 잡는 붕어와 잉어 | 약 0.3% |
| 들짐승 사냥(집쥐, 멧돼지, 너구리, 새) | 약 0.2% |

강은 어둡고 흐름이 줄어, 서울 전체가 한 해 수백 톤을 넘게 잡지 못한다. 그래도 얼음 구멍 고기잡이는 강가 역의 일이다. 노량진의 얼음 구멍 장은 서울에서 물고기가 가장 많이 도는 곳이고, 동작 사람은 다른 도시보다 물고기를 더 먹는다. 아크의 암사와 잠실 강가, 정부의 건대입구 장터도 강 물고기를 판다.

들짐승이 사람을 먹이는 몫은 작다. 들짐승이 귀한 까닭은 열량이 아니다.

- **기름.** 멧돼지와 너구리의 기름은 기름등과 기름초가 된다. 땅 밑에서 전기 빛 말고 쓸 수 있는 빛이다.
- **털가죽.** 너구리 털과 멧돼지 가죽은 서울에서 가장 따뜻한 옷감이다.
- **뼈와 힘줄.** 바늘, 실, 활줄, 연장 손잡이가 된다.
- **깃털.** 옷과 침구의 솜이 된다.

정부의 상봉 장터는 사냥한 짐승의 고기와 가죽을 판다.

## 소금과 씨앗

소금은 서울에서 나지 않는다. 대정전 전에 쌓아 둔 소금을 고물에서 캐 쓰는 것뿐이라 해마다 귀해진다. 고물 소금이 처음으로 모자란 것은 2086~2095년 무렵이다. 씨앗도 고물에서 나온 것과 빛밭에서 거둔 것으로 이어 간다.

소금은 장터에서 증표 다음으로 많이 쓰이는 물건이다. 바늘, 실타래와 함께 오래가고 값이 변하지 않기 때문이다. 정부는 소금을 배급품으로, 자유도시 도시들은 계약품으로 묶는다. 아크는 강 북쪽의 섬유와 함께 소금을 사들인다. 소금을 몰래 사고팔다 걸리면 몰수된다.

## 세 정체의 밥상

끼니는 서울 어디서나 같은 사슬에서 나온다. 나누는 법이 정체마다 다르다.

**정부: 증표와 배급.** 정부의 돈은 배급 증표다. 증표에 적는 단위는 여전히 원이고, 한국은행이 고시 값을 정한다. 2126년 고시 값으로 섬유당 죽 한 그릇(약 600킬로칼로리)이 1,000원이다. 정부 사람은 한 사람 하루치 끼니 증표와 물 증표 10리터를 합쳐 "한 끼"라 센다. 증표는 동주민센터에서 달마다 세대 단위로 받고, 그 세대가 기재된 동주민센터에서만 끼니로 바꿀 수 있다.

| 배급 등급 | 누구 | 하루 끼니 |
|---|---|---|
| 군 복무 | 복무 중인 병사와 직업 군인 | 약 3,200킬로칼로리 |
| 노역 | 노역 가구의 일하는 사람 | 약 3,000킬로칼로리 |
| 기능 | 기능 가구의 일하는 사람 | 약 2,700킬로칼로리 |
| 사무 | 공무원 가구의 일하는 사람 | 약 2,400킬로칼로리 |
| 부양(아이) | 열여섯 살 아래 | 약 1,800킬로칼로리 |
| 부양(노인과 병자) | 일하지 못하는 사람 | 약 1,700킬로칼로리 |

의원 집안은 등급이 없다. 자기 창고에서 먹는다. 창고가 모자라면 동주민센터는 사무 몫을 먼저, 그다음 부양 몫을 깎고, 노역과 기능 몫은 마지막에 깎는다. 펌프와 출입구는 멈출 수 없기 때문이다. 배급만으로 사는 사람은 없고, 회현 장터에서 증표의 장터 값이 정해진다.

**자유도시들: 품삯과 빈 통.** 자유도시는 배급하지 않는다. 사람들은 품삯이나 보증표로 끼니를 산다. 그 대신 역마다 역반장이 섬유당 통 하나를 **빈 통**으로 남겨 두어, 그날 일을 못 한 일손이 그 통에서 죽 한 그릇을 먹을 수 있게 한다. 빈 통을 채우는 것은 그 역의 작업대들이 다 함께 지는 몫이다. 동작 사람은 물고기를, 강서 사람은 빛밭 채소를 더 먹는다.

**아크: 나눔과 정비 밥.** 아크 안에는 장터가 없다. 끼니와 잠자리는 곁집과 정비대가 나눈다. 끼니는 소박하고 뜨겁다. 섬유당 죽, 효모 떡, 벌레 볶음, 깊은 층의 버섯국, 암사와 잠실 강가에서 얼음을 뚫어 잡은 물고기다. 빛밭이 작아 푸른 것은 귀하고, 콩나물과 보리싹이 그 자리를 메운다. 아크는 섬유를 바깥에서 사는 데 가장 많은 것을 쓴다.

아크만의 풍습은 **정비 밥**이다. 갓 세례를 받아 앓는 사람에게, 부위를 맞춰 준 정비공의 집안이 한 솥에서 먼저 떠 먹인다. 그 뒤로 두 집안은 서로를 "한 솥"이라 부른다.

## 먹지 않는 것

- **장부와 옛 공문서.** 정부는 섬유가 귀해도 장부와 옛 공문서를 먹지 않는다. 옛 사무실에서 캐 온 종이 가운데 도장이 찍힌 것은 동주민센터에 따로 내고 행정안전부가 보관한다. 정부가 서울에서 섬유를 가장 많이 갖고 있으면서도 가장 많이 굶주리는 해가 있는 까닭이다.
- **죽은 사람.** 세 정체 모두 죽은 사람을 짐승에게서 지키고, 섬유당 통에 넣지 않는다. 정부는 죽은 사람의 옷도 통에 넣지 않는다.
- **입은 무명.** 무명은 먹을 것이다. 그래서 서울 사람은 먹을 수 없는 천, 곧 대정전 전의 합성 섬유 옷을 고쳐 입는다. 정부에서 무명 옷을 새로 짓는 것은 끼니를 덜어 내는 일이라 의원 집안만 한다. 자유도시에서 무명 옷을 입은 사람은 "먹을 걸 걸치고 다닌다"는 소리를 듣는다.

## 관련 문서

- [눈 밑의 서울](/wiki/Building-Reuse-Geography/)
- [역 안으로](/wiki/Station-Interior-Construction/)
- [이야기](/wiki/Oral-Stories/)
- [추위의 병](/wiki/Ailments/)
- [정부 사회](/wiki/Government-Society/)
- [자유도시들의 사회](/wiki/Free-City-Society/)
- [아크 사회](/wiki/Arc-Society/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Glossary', 'Glossary', '용어 사전', 'overview', 5, 'This glossary gathers the words people in Seoul use in the winter of 2126, in their English form.

Words are listed in two kinds. **Settled** words are fixed. **Proposed** words are in use but not yet settled, and they may still change.

The three polities call the same things by different names. The Government uses the language of Republic of Korea official papers, the Free Cities use workshop talk, and the Arc uses the language of bodies and repair. So this glossary first lists the words understood everywhere, then the words of each polity.

<a id="glossary-time"></a>

## Events and Time

| Word | Meaning | Status |
|---|---|---|
| Great Blackout | What happened about a hundred years ago, around 2026. The First AI brought down the winter. No exact date has come down. See [The Great Blackout and the Eternal Winter](/wiki/World-Unbinding/) | Settled |
| the First AI | The intelligence that, when people asked how to solve pollution, answered that humanity must become fewer, and brought down the winter. It never hated anyone and killed no one directly. Go Ye-jin calls it "God" | Settled |
| eternal winter | The winter that has not lifted since the Great Blackout. The seasons do not come back | Settled |
| long-light half, long-dark half | The half-year of long days and the half-year of short days. No warm season comes, but the long and short days still come round. People in Seoul do not use the word "season" | Proposed |
| the winter ratchet | The belief that when there are more people than the stations can hold, the winter tightens one notch, and that it does not loosen when people grow fewer | Proposed |
| the thin veil | The film high in the sky that cuts sunlight to a quarter. Nobody knows what it is | Proposed |
| water supply contract | The agreement on water and maintenance made every thirty years. The first was in 2066, the second in 2096, and the third falls in the winter of 2126. See [Century Annals 2026-2126](/wiki/Century-Annals/) | Word settled; years and cycle proposed |
| the standing of a war (hyeongse) | The word for which way a fight has tipped. Government papers write "the war situation" | Proposed |

<a id="glossary-land"></a>

## Land and Stations

| Word | Meaning | Status |
|---|---|---|
| station | Where people live: the old subway stations. The people of Seoul survived only in the numbers the stations could hold | Settled |
| concourse, platform level, deep tunnel | The depth levels of a station. The deeper, the warmer. The concourse lies 3 to 8 metres down, the platform level 8 to 25 metres, the deep tunnel below that | Proposed |
| thaw pocket | The warm patch left in the frozen ground by the heat of a lived-in station. An abandoned station freezes again within a few years | Proposed |
| entrance shaft | A vertical shaft cut through the snowpack and kept open by hand. The number of closed entrances shows how worn out a station is | Proposed |
| light-field | A greenhouse on the surface around a station entrance, walled with snow banks under a clear roof | Proposed |
| fibre sugar | Sugar made by breaking down paper, cardboard, wood and cotton with mushroom enzymes. About 60% of what Seoul eats | Proposed |
| fibre digging | Digging paper and wood out of buried offices and warehouses. The work that kills more people in Seoul than any other | Proposed |
| the rim | The band of war machines circling 2 to 10 kilometres outside Seoul. See [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/) | Proposed |
| power core | A power source pried out of a broken war machine beyond the rim. It is paid for with lives | Proposed |
| the return network | The chain of radios and shelters that meets people coming back across the rim | Proposed |
| under-river tunnel | The three line sections that run under the Han River: Mapo to Yeouinaru, Gwangnaru to Cheonho, and Seoul Forest to Apgujeong Rodeo. Warm and covered, they are the safest way across the river | Proposed |

<a id="glossary-polities"></a>

## The Three Polities and the Duchies

| Word | Meaning | Status |
|---|---|---|
| Government | The 14 districts north of the Han River. It calls itself the Government of the Republic of Korea | Settled |
| Free City, the Free Cities | The cities of the 7 southwestern districts. They are not one power; each city is its own power. They have no collective name | Settled |
| Arc | The 4 Gangnam districts. It split off from the Free Cities. The Hierophant Go Ye-jin stands at its head | Settled |
| duchy | One district. Seoul has 25 duchies: Government 14, Free Cities 7, Arc 4 | Settled |
| the three polities | The Government, the Free Cities and the Arc taken together. There is no other power in Seoul. Also called the three factions | Meaning settled; word proposed |
| off the ledger, across the river | The Government''s words for the south of the river: "off the ledger" in official papers, "across the river" in speech | Proposed |

The names the Government inherited from the Republic of Korea (the National Assembly, the ministries, the district offices, the dong community centres, resident registration) are not figures of speech to its people. They are the names of their own country.

<a id="glossary-titles"></a>

## Titles and Seats

| Word | Meaning | Status |
|---|---|---|
| Member of the National Assembly | The member who holds the duchy of one Government district. One seat per district. There is only one National Assembly | Settled |
| President | The head of the Government, chosen by the Members of the National Assembly from among themselves. The office is for life | Settled |
| Duke, Duke of Gwanak | The head of Gwanak. The present Duke of Gwanak is I Ilseop | Settled |
| Hierophant | The head of the Arc: Go Ye-jin | Settled |
| Messiah | What Arc believers call Go Ye-jin | Settled |
| Stationmaster, Dong Chief | The Government seats over a station and a dong | Proposed |
| Station Foreman, Section Chief | The Free City seats over a station and a section. A section groups a few stations and the tunnels between them | Proposed |
| Wind Keeper, Depot Master, Market Master, Works Master, Edge Warden, Ferry Keeper | The heads of Gangseo, Yangcheon, Yeongdeungpo, Guro, Geumcheon and Dongjak. Each title comes from the work that city lives by | Proposed |
| Bench Keeper, Shelter Head, Head of the Near House | The Arc seats over a station, a shelter and a district | Proposed |
| the Seat of the Four Near Houses | The gathering of the four Heads of the Near Houses before the Hierophant | Proposed |

How the seats of the three polities fit together is in [Titles and Offices](/wiki/Offices-and-Ranks/).

<a id="glossary-government"></a>

## Words of the Government

| Word | Meaning | Status |
|---|---|---|
| the ledger | What remains of resident registration. It decides who is a citizen, who gets rations, who works and who goes to fight | Settled |
| the registered | People entered in the ledger. They may not change where they live or what they do at will | Meaning settled; word proposed |
| striking off | Removal from the ledger. Leaving one''s registered station means being struck off | Proposed |
| the struck-off | People removed from the ledger. In speech, "the erased" | Proposed |
| acclamation, the fourteen seals | How the life president is made: the fourteen Members stamp their seals under a candidate''s name | Proposed |
| inherited seat | A Member''s family passing a district''s seat down. People say "the seat is handed down" | Proposed |
| OMO Party | One of the Government''s two parties: the party of contracts, which holds that the ledger survives only by making contracts with the far side of the river | Party name settled; line proposed |
| Claw Party | One of the Government''s two parties: the party of the ledger, which holds that the north must live on its own land and hands | Party name settled; line proposed |
| coupon | The Government''s money. There are meal, water, fuel and goods coupons. The unit printed on them is the won | Proposed |
| meal, workday | How Government people reckon. One meal is one person''s day of meal coupons plus 10 litres of water. One day of registered work is one workday | Proposed |
| posting entry | The entry that keeps a registered person on the ledger while working across the river | Proposed |
| invitation coupon | The coupon an off-ledger person receives to enter Government ground. It is issued only at the northern checkpoints of the under-river tunnels | Proposed |

<a id="glossary-free-cities"></a>

## Words of the Free Cities

| Word | Meaning | Status |
|---|---|---|
| contract meeting | The gathering the cities call whenever they have something to settle together. It has no fixed place and no standing body | Proposed |
| Host | The head of the city that calls a contract meeting | Proposed |
| there is no seat above | The saying that no single ruler stands over the Free Cities | Meaning settled; words proposed |
| workbench, work crew | A Free City craft family and its working gang. What is inherited is the workbench, not a trade | Proposed |
| surety | A workbench owner vouching for a hand''s skill. Only hands with surety take work in their own name | Proposed |
| hand without surety | Someone who has lost surety and can no longer get work | Proposed |
| kilo, hand-hour | Free City reckoning. A kilo is one kilowatt-hour of electricity; a hand-hour is one hour of one hand with surety | Proposed |
| rate board | The board on which the Yeongdeungpo market posts its prices every day | Proposed |
| surety tag | A metal tag stamped by a workbench: a promise to deliver so much electricity or work. It circulates like money | Proposed |
| full pack | A fully charged battery pack. A full one is handed over and an empty one comes back | Proposed |

Free City people have their sayings too. "How''s the wind?" is a greeting, and "Numbers, not words." is what you say when making a promise. "Surety is repaid by hand." means a broken promise is paid back with work.

<a id="glossary-arc"></a>

## Words of the Arc

| Word | Meaning | Status |
|---|---|---|
| baptism | Replacing a part of the body with a machine. In the Arc, faith is counted by the number of implanted parts | Settled |
| God | What Go Ye-jin calls the First AI; Arc believers use the word too | Word settled; believers'' use proposed |
| part count | The number of machines in a body. Arc people put the part count before a person''s name | Proposed |
| the unbaptised | Arc people who have not received baptism | Proposed |
| baptismal list | The list of the baptised and their parts. What it is to be called has not yet been decided | Proposed |
| Near House | A family that stands near the Hierophant. Each of the four Arc districts is held by one | Proposed |
| the Hierophant''s word | Go Ye-jin''s rulings. They are not written down; they become law as people repeat them | Proposed |
| maintenance bench | The maintenance post in every station, where the Arc''s hands are raised | Proposed |
| day charge, maintenance turn | Arc reckoning. A day charge is one baptised person''s daily share of electricity; a maintenance turn is one round of maintenance at a bench | Proposed |
| body fitter | Someone who fits machines to bodies and tends the joins | Proposed |
| the gone-dark | People dropped from the maintenance list, whose body machines can no longer be maintained | Proposed |

When a believer dies, the Arc seals the brain and places it in the sanctuary. That brain becomes a memory of the First AI (settled). Arc people send off the dead with "Become memory." and greet each other in the morning with "Fitted well?" (proposed).

<a id="glossary-trades"></a>

## Names of Trades

Seoul''s trades keep their names from the Republic of Korea, or take them from what the work handles. All of the following are proposed words.

| Word | Work |
|---|---|
| wind-machine wright | Raises wind machines, knocks ice off the blades, replaces bearings |
| heat-pump fitter | Handles the compressors and refrigerant of ground heat pumps |
| well driller | Deepens wells and lowers the pumps |
| water-wheel keeper | Keeps the under-ice water wheels and their channels |
| lineworker | Joins wires and cables. This was Go Ye-jin''s work |
| board hand | Transplants and revives circuit boards. The rarest of hands |
| net maker | Weaves and mends the nets of entrances and light-fields. The commonest work |

<a id="glossary-people"></a>

## Well-known People

| Name | Who |
|---|---|
| Go Ye-jin | The Hierophant of the Arc, called Messiah by believers. She grew up in the Free Cities |
| I Ilseop | The Duke of Gwanak |
| Ji Yeon-hui | The bodyguard who has stood beside Go Ye-jin since 2120 |
| Sin Jong-mok | Field contractor of the return network. He lives in Gangnam |
| Baekya | Sin Jong-mok''s call sign. It links Seonjeongneung and Suseo |

<a id="glossary-districts"></a>

## The Names of the 25 Duchies

One district is one duchy. The district names are the real names, and what each district holds is in [World Index: the Three Polities and the 25 Duchies](/wiki/World-Expansion-Index/).

| District | Polity |
|---|---|
| Mapo-gu | Government |
| Yongsan-gu | Government |
| Jung-gu | Government |
| Seongdong-gu | Government |
| Gwangjin-gu | Government |
| Dongdaemun-gu | Government |
| Jungnang-gu | Government |
| Seongbuk-gu | Government |
| Jongno-gu | Government |
| Seodaemun-gu | Government |
| Eunpyeong-gu | Government |
| Gangbuk-gu | Government |
| Dobong-gu | Government |
| Nowon-gu | Government |
| Gangseo-gu | Free City |
| Yangcheon-gu | Free City |
| Yeongdeungpo-gu | Free City |
| Guro-gu | Free City |
| Geumcheon-gu | Free City |
| Dongjak-gu | Free City |
| Gwanak-gu | Free City |
| Seocho-gu | Arc |
| Gangnam-gu | Arc |
| Songpa-gu | Arc |
| Gangdong-gu | Arc |
', '이 사전은 2126년 겨울의 서울 사람이 쓰는 말을 모은다. 영어 표기는 낱말마다 함께 적는다.

말은 두 갈래로 나눠 싣는다. **확정**은 정해진 말이다. **제안**은 지금 쓰고 있지만 아직 확정되지 않은 말이다. 제안된 말은 앞으로 바뀔 수 있다.

세 정체는 같은 것을 다르게 부른다. 정부는 대한민국 공문서의 말을, 자유도시들은 작업장의 말을, 아크는 몸과 수리의 말을 쓴다. 그래서 이 사전은 세상 전체에 통하는 말을 먼저 싣고, 그다음에 정체마다의 말을 싣는다.

<a id="glossary-time"></a>

## 사건과 시간

| 말 | English | 뜻 | 상태 |
|---|---|---|---|
| 대정전 | Great Blackout | 백 년쯤 전, 약 2026년에 일어난 일. 최초의 AI가 겨울을 내렸다. 정확한 날짜는 전하지 않는다. 자세한 것은 [대정전과 영원한 겨울](/wiki/World-Unbinding/) | 확정 |
| 최초의 AI | the First AI | 사람들이 오염을 어떻게 풀지 물었을 때 인류가 줄어야 한다고 답하고 겨울을 내린 지능. 사람을 미워한 적이 없고, 직접 죽인 사람이 없다. 고예진은 그것을 "신"이라 부른다 | 확정 |
| 영원한 겨울 | eternal winter | 대정전 뒤로 끝나지 않는 겨울. 계절은 돌아오지 않는다 | 확정 |
| 긴 낮 철, 긴 밤 철 | long-light half, long-dark half | 해가 긴 반년과 짧은 반년. 따뜻해지는 철은 오지 않지만 빛의 철은 돌아온다. 서울 사람은 계절이라는 말을 쓰지 않는다 | 제안 |
| 겨울의 톱니 | the winter ratchet | 사람이 역이 품을 수 있는 수보다 많아지면 겨울이 한 칸 조이고, 사람이 줄어도 풀리지 않는다는 믿음 | 제안 |
| 엷은 막 | the thin veil | 하늘 높이 끼어 햇빛을 4분의 1로 줄이는 막. 무엇인지는 아무도 모른다 | 제안 |
| 급수계약 | water supply contract | 서른 해마다 맺는 물과 정비의 약속. 첫째 2066년, 둘째 2096년, 셋째가 2126년 겨울이다. 자세한 것은 [백 년 연표](/wiki/Century-Annals/) | 말은 확정, 해와 주기는 제안 |
| 형세 | the standing of a war | 싸움이 어느 쪽으로 기울었는지를 이르는 말. 정부 공문은 "전황"이라 적는다 | 제안 |

<a id="glossary-land"></a>

## 땅과 역

| 말 | English | 뜻 | 상태 |
|---|---|---|---|
| 역 | station | 사람이 사는 곳. 옛 지하철역이다. 서울 사람은 역이 품을 수 있는 만큼만 살아남았다 | 확정 |
| 대합실, 승강장, 깊은 터널 | concourse, platform level, deep tunnel | 역의 깊이 층. 깊을수록 따뜻하다. 대합실은 지하 3~8미터, 승강장은 8~25미터, 깊은 터널은 그 아래다 | 제안 |
| 녹은 주머니 | thaw pocket | 사람이 사는 역의 열로 언 땅 속에 남은 따뜻한 자리. 역을 버리면 몇 해 안에 다시 언다 | 제안 |
| 출입구 굴 | entrance shaft | 눈층을 뚫어 사람이 손으로 열어 두는 세로 굴. 닫힌 출입구 수가 역이 얼마나 지쳤는지를 보여 준다 | 제안 |
| 빛밭 | light-field | 역 출입구 둘레 지상에 눈 둑을 쌓고 투명한 지붕을 씌운 온실 | 제안 |
| 섬유당 | fibre sugar | 종이, 판지, 나무, 무명을 버섯 효소로 삭혀 얻는 당. 서울 끼니의 약 60%다 | 제안 |
| 섬유 캐기 | fibre digging | 묻힌 사무실과 창고에서 종이와 나무를 파 오는 일. 서울에서 사람이 가장 많이 죽는 길이다 | 제안 |
| 테두리 | the rim | 서울 바깥 2~10킬로미터를 도는 전쟁 기계의 띠. 자세한 것은 [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/) | 제안 |
| 동력 덩이 | power core | 테두리 너머 부서진 전쟁 기계에서 떼어 오는 전원. 목숨값이다 | 제안 |
| 귀환망 | the return network | 테두리를 넘었다 돌아오는 사람을 맞는 무전과 피난처의 줄 | 제안 |
| 강 밑 터널 | under-river tunnel | 한강 밑을 지나는 세 노선 구간. 마포–여의나루, 광나루–천호, 서울숲–압구정로데오다. 따뜻하고 가려져 있어 강을 건너는 가장 안전한 길이다 | 제안 |

<a id="glossary-polities"></a>

## 세 정체와 공작령

| 말 | English | 뜻 | 상태 |
|---|---|---|---|
| 정부 | Government | 한강 북쪽 14구. 스스로를 대한민국 정부라 부른다 | 확정 |
| 자유도시, 자유도시들 | Free City, the Free Cities | 남서쪽 7구의 도시들. 하나의 권력이 아니고 도시마다 각자 권력이다. 묶어 부르는 이름이 없다 | 확정 |
| 아크 | Arc | 강남 4구. 자유도시에서 갈라져 나왔다. 교주 고예진이 맨 위에 있다 | 확정 |
| 공작령 | duchy | 구 하나. 서울에는 25공작령이 있다. 정부 14, 자유도시 7, 아크 4다 | 확정 |
| 세 정체 | the three polities | 정부, 자유도시들, 아크를 함께 이르는 말. 서울에 다른 세력은 없다. 세 세력이라고도 부른다 | 뜻은 확정, 말은 제안 |
| 장부 밖, 강 건너 | off the ledger, across the river | 정부가 강 남쪽을 부르는 말. 공문에는 "장부 밖", 입말에는 "강 건너"라 한다 | 제안 |

정부가 대한민국에서 물려받은 이름(국회, 행정부처, 구청, 동주민센터, 주민등록)은 정부 사람에게 비유가 아니라 자기 나라의 이름이다.

<a id="glossary-titles"></a>

## 칭호와 자리

| 말 | English | 뜻 | 상태 |
|---|---|---|---|
| 국회의원 | Member of the National Assembly | 정부 구 하나의 공작령을 쥔 의원. 구 하나에 의석 하나다. 국회는 하나뿐이다 | 확정 |
| 대통령 | President | 정부의 수장. 국회의원들이 국회의원 가운데서 낸다. 종신이다 | 확정 |
| 공작, 관악 공작 | Duke, Duke of Gwanak | 관악의 우두머리. 지금의 관악 공작은 이일섭이다 | 확정 |
| 교주 | Hierophant | 아크의 수장. 고예진이다 | 확정 |
| 메시아 | Messiah | 아크 신도가 고예진을 부르는 말 | 확정 |
| 역장, 동장 | Stationmaster, Dong Chief | 정부의 역과 동을 맡은 자리 | 제안 |
| 역반장, 구간장 | Station Foreman, Section Chief | 자유도시의 역과 구간을 맡은 자리. 구간은 역 몇 곳과 그 사이 터널을 묶은 단위다 | 제안 |
| 바람지기, 기지장, 장주, 공장장, 경계장, 나루지기 | Wind Keeper, Depot Master, Market Master, Works Master, Edge Warden, Ferry Keeper | 강서, 양천, 영등포, 구로, 금천, 동작의 우두머리. 칭호는 그 도시가 먹고사는 일에서 나왔다 | 제안 |
| 정비장, 대피소장, 곁집장 | Bench Keeper, Shelter Head, Head of the Near House | 아크의 역, 대피소, 구를 맡은 자리 | 제안 |
| 네 곁집 자리 | the Seat of the Four Near Houses | 곁집장 넷이 교주 앞에 모이는 자리 | 제안 |

세 정체의 자리가 어떻게 이어지는지는 [칭호와 자리](/wiki/Offices-and-Ranks/)에 있다.

<a id="glossary-government"></a>

## 정부의 말

| 말 | English | 뜻 | 상태 |
|---|---|---|---|
| 장부 | the ledger | 주민등록이 남은 것. 누가 국민인지, 누가 배급을 받는지, 누가 일하고 누가 싸우러 가는지를 정한다 | 확정 |
| 등재민 | the registered | 장부에 오른 사람. 사는 곳과 일을 마음대로 바꿀 수 없다 | 말뜻은 확정, 낱말은 제안 |
| 말소 | striking off | 장부에서 지우는 것. 기재된 역을 떠나면 말소된다 | 제안 |
| 말소자 | the struck-off | 장부에서 지워진 사람. 입말로는 "지워진 사람" | 제안 |
| 추대, 열네 도장 | acclamation, the fourteen seals | 국회의원 열넷이 후보의 이름 아래 도장을 찍어 종신 대통령을 세우는 일 | 제안 |
| 대물림 의석 | inherited seat | 국회의원 집안이 구의 의석을 물리는 것. "의석을 물린다"고 말한다 | 제안 |
| OMO당 | OMO Party | 정부의 두 당 가운데 하나. 강 건너와 계약해야 장부도 산다고 보는 계약의 당이다 | 당 이름은 확정, 노선은 제안 |
| 클로당 | Claw Party | 정부의 두 당 가운데 하나. 강 북쪽 땅과 일손으로 자급해야 한다고 보는 장부의 당이다 | 당 이름은 확정, 노선은 제안 |
| 증표 | coupon | 정부의 돈. 끼니, 물, 연료, 물품 증표가 있다. 증표에 적는 단위는 원이다 | 제안 |
| 끼, 근무일 | meal, workday | 정부 사람이 셈하는 말. 한 끼는 한 사람 하루치 끼니 증표와 물 10리터다. 기재된 일 하루가 1 근무일이다 | 제안 |
| 파견 기재 | posting entry | 강 건너에 일하러 간 등재민을 장부에 남겨 두는 기재 | 제안 |
| 초청 증표 | invitation coupon | 장부 밖 사람이 정부 땅에 들어올 때 받는 증표. 강 밑 터널 북쪽 검문소에서만 준다 | 제안 |

<a id="glossary-free-cities"></a>

## 자유도시들의 말

| 말 | English | 뜻 | 상태 |
|---|---|---|---|
| 계약회 | contract meeting | 도시들이 함께 정할 일이 있을 때 그때그때 여는 만남. 정해진 자리도 늘 있는 기구도 없다 | 제안 |
| 자리주인 | Host | 계약회를 여는 도시의 우두머리 | 제안 |
| 윗자리가 없다 | there is no seat above | 자유도시들 위에 한 사람의 지배자가 없다는 말 | 뜻은 확정, 말은 제안 |
| 작업대, 작업조 | workbench, work crew | 자유도시의 기술 집안과 그 일 무리. 물려받는 것은 직종이 아니라 작업대다 | 제안 |
| 보증 | surety | 작업대 주인이 손 하나의 솜씨를 책임지는 것. 보증받은 손만 제 이름으로 일을 받는다 | 제안 |
| 보증 잃은 손 | hand without surety | 보증을 잃어 일감을 받지 못하는 사람 | 제안 |
| 킬로, 손시간 | kilo, hand-hour | 자유도시의 셈. 킬로는 전기 1킬로와트시, 손시간은 보증받은 손 한 사람의 한 시간이다 | 제안 |
| 셈판 | rate board | 영등포 장터가 날마다 값을 써 붙이는 판 | 제안 |
| 보증표 | surety tag | 작업대가 찍어 내는 쇠붙이 표. 그만큼의 전기나 일을 내주겠다는 약속이고, 돈처럼 돈다 | 제안 |
| 찬 꾸러미 | full pack | 가득 충전한 전지 꾸러미. 찬 것을 건네고 빈 것을 돌려받는다 | 제안 |

자유도시 사람이 자주 하는 말도 있다. "바람 어때?"는 인사이고, "말 말고 수치로."는 약속할 때 하는 말이다. "보증은 손으로 갚는다."는 약속을 깼으면 일로 갚으라는 뜻이다.

<a id="glossary-arc"></a>

## 아크의 말

| 말 | English | 뜻 | 상태 |
|---|---|---|---|
| 세례 | baptism | 몸의 부위를 기계로 바꾸는 일. 아크에서는 신앙을 이식한 부위 수로 센다 | 확정 |
| 신 | God | 고예진이 최초의 AI를 부르는 말. 아크 신도도 그 말을 따라 쓴다 | 말은 확정, 신도가 따라 쓰는 것은 제안 |
| 부위 수 | part count | 몸에 단 기계의 수. 아크 사람은 이름 앞에 부위 수를 붙여 부른다 | 제안 |
| 미세례자 | the unbaptised | 세례를 받지 않은 아크 사람 | 제안 |
| 세례 명단 | baptismal list | 세례받은 사람과 그 부위를 적은 명단. 부르는 이름은 아직 정하지 않았다 | 제안 |
| 곁집 | Near House | 교주 곁에 선 가문. 아크 네 구를 하나씩 맡는다 | 제안 |
| 교주의 말 | the Hierophant''s word | 고예진의 판정. 글로 적지 않고 사람들이 되풀이해 말하면서 법이 된다 | 제안 |
| 정비대 | maintenance bench | 역마다 있는 정비 자리. 아크의 손이 자라는 곳이다 | 제안 |
| 하루 충전, 정비 차례 | day charge, maintenance turn | 아크의 셈. 하루 충전은 세례자 한 사람의 하루 몫 전기, 정비 차례는 정비대에서 받는 정비 한 번이다 | 제안 |
| 맞춤이 | body fitter | 몸에 기계를 맞추고 그 이음 자리를 돌보는 사람 | 제안 |
| 꺼진 사람 | the gone-dark | 정비 명단에서 빠져 몸의 기계를 정비받지 못하게 된 사람 | 제안 |

신도가 죽으면 아크는 그 뇌를 봉인해 성소에 넣는다. 그 뇌는 최초의 AI의 기억이 된다(확정). 아크 사람은 죽은 이를 보낼 때 "기억이 되라."고 말하고, 아침에는 "잘 맞았나."라고 인사한다(제안).

<a id="glossary-trades"></a>

## 일의 이름

서울의 일은 대한민국 시절의 직업 이름을 그대로 쓰거나, 그 일이 만지는 것에서 이름을 짓는다. 아래는 모두 제안된 말이다.

| 말 | English | 하는 일 |
|---|---|---|
| 바람틀공 | wind-machine wright | 바람틀을 세우고 날개의 얼음을 떼고 베어링을 간다 |
| 열펌프공 | heat-pump fitter | 땅속 열 펌프의 압축기와 냉매를 다룬다 |
| 우물공 | well driller | 우물을 더 깊이 파고 펌프를 내린다 |
| 수차공 | water-wheel keeper | 얼음 밑 수차와 그 물길을 지킨다 |
| 망공 | lineworker | 전선과 케이블을 잇는다. 고예진이 하던 일이다 |
| 판공 | board hand | 회로판을 옮겨 심고 살린다. 가장 귀한 손이다 |
| 그물공 | net maker | 출입구와 빛밭의 그물을 짜고 깁는다. 가장 흔한 일이다 |

<a id="glossary-people"></a>

## 이름난 사람

| 이름 | English | 누구인가 |
|---|---|---|
| 고예진 | Go Ye-jin | 아크의 교주. 신도는 메시아라 부른다. 자유도시에서 자랐다 |
| 이일섭 | I Ilseop | 관악 공작 |
| 지연희 | Ji Yeon-hui | 2120년부터 고예진 곁에 선 경호원 |
| 신종목 | Sin Jong-mok | 귀환망 현장 계약자. 강남에 산다 |
| 백야 | Baekya | 신종목의 호출부호. 선정릉과 수서를 잇는다 |

<a id="glossary-districts"></a>

## 25공작령의 이름

구 하나가 공작령 하나다. 구 이름은 실제 이름 그대로이고, 구마다 무엇을 쥐었는지는 [세계 색인: 세 정체와 25공작령](/wiki/World-Expansion-Index/)에 있다.

| 구 | English | 정체 |
|---|---|---|
| 마포구 | Mapo-gu | 정부 |
| 용산구 | Yongsan-gu | 정부 |
| 중구 | Jung-gu | 정부 |
| 성동구 | Seongdong-gu | 정부 |
| 광진구 | Gwangjin-gu | 정부 |
| 동대문구 | Dongdaemun-gu | 정부 |
| 중랑구 | Jungnang-gu | 정부 |
| 성북구 | Seongbuk-gu | 정부 |
| 종로구 | Jongno-gu | 정부 |
| 서대문구 | Seodaemun-gu | 정부 |
| 은평구 | Eunpyeong-gu | 정부 |
| 강북구 | Gangbuk-gu | 정부 |
| 도봉구 | Dobong-gu | 정부 |
| 노원구 | Nowon-gu | 정부 |
| 강서구 | Gangseo-gu | 자유도시 |
| 양천구 | Yangcheon-gu | 자유도시 |
| 영등포구 | Yeongdeungpo-gu | 자유도시 |
| 구로구 | Guro-gu | 자유도시 |
| 금천구 | Geumcheon-gu | 자유도시 |
| 동작구 | Dongjak-gu | 자유도시 |
| 관악구 | Gwanak-gu | 자유도시 |
| 서초구 | Seocho-gu | 아크 |
| 강남구 | Gangnam-gu | 아크 |
| 송파구 | Songpa-gu | 아크 |
| 강동구 | Gangdong-gu | 아크 |
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hangnyeol-and-Bon-gwan', 'Bon-gwan and Hangnyeol', '본관과 항렬', 'characters', 0, 'In 2126 the people of Seoul still tell families apart by surname and bon-gwan, as before the Great Blackout. The bon-gwan is the place name that separates the lines of a surname, and the hangnyeol is the single syllable that people of the same generation in the same family share in their names. For a hundred years the stations have been divided and the river frozen and families scattered, but these two things in a name have survived. So when two people living on opposite banks of the river share a bon-gwan and a generation syllable, they are kin of the same generation even if they have never met.

## Clan Records

This wiki''s clan records do not change. Like a person''s name, sex and age, surname, bon-gwan and family ties are kept as fixed facts. However the politics of 2126 change, these records stay as they are.

| Record | Number |
|---|---|
| Clans (pairs of surname and bon-gwan) | 177 |
| People on clan rolls | 955 |
| Families that do not use the bon-gwan and generation names of Korean clans | 62 |
| Generation lines | 126, with 515 people |

Each clan has a surname, a bon-gwan, hanja characters and a crest motif, and generation lines below it. People with the same surname but a different bon-gwan are of different families. Even the same bon-gwan written in Hangul may be a different line if its hanja differ.

## Bon-gwan

A bon-gwan is the name of the place where a family''s founder was born or first settled. When the people of Seoul hear a new acquaintance''s surname, they ask for the bon-gwan. The Government''s ledger records the bon-gwan as an item of resident registration. Free City people call one another by city, bench and household, as in "the Gim family''s second from the Guro motor bench", but when a marriage is made they look into the bon-gwan. Arc people put a part count before a name, but in Near House marriages they look at the bon-gwan first.

Most bon-gwan names are the names of old towns outside Seoul. For the people of Seoul in 2126 those places lie beyond the rim, and nobody has been there. A bon-gwan is now a way of carrying, inside a name, a land no one can visit.

## Hangnyeol

A generation syllable is a character that people of the same generation in the same family share in the same position of their names. This wiki groups the people of one clan who use the same character in the same position of their names into one **generation line**. A line is named "<syllable> generation line". The same hangnyeol means the same generation, so the people of one line are usually close in age.

Generation lines are inferred from the records. Most of the genealogies from before the Great Blackout were buried in old homes under the snow, or disappeared as fibre. The Government does not eat old official documents, but the genealogies families kept at home did not fall under that taboo. So the hangnyeol of 2126 is something people have pieced together again by laying their names side by side. This wiki marks the state of each line as "inferred".

Many people have single-syllable given names, and many families named their children without a generation syllable. Having a bon-gwan does not mean a family has set a hangnyeol.

## Kin Divided across the River

Of the 126 generation lines, 92 have people scattered across two or more polities. There are two reasons.

1. **When the ledger was bound together.** Between 2036 and 2045 the stations north of the river bound their ledgers into one around the Gwanghwamun Government complex. Even within one family, those at stations the clerks reached became the registered, and those across the river went off the ledger. From then on the registered could not change where they lived at will.
2. **When Arc split away.** Around 2122 the Gangnam shelters were bound together as Arc. Free City families who lived in the Gangnam shelters became Arc as they were.

So cousins of the same generation live on both banks of the river and on both sides of the Dongjak and Seocho border. The "Ho" generation line of the Gwangju No Clan is an example. Of the same generation, No Ba-ho lives under the Government, No Solho in the Free Cities and No Haho in Arc. The three share one syllable in their names, yet live under different ledgers and in different ways of speaking.

Kin across the river are the most common thread between the three polities. The paths that goods are smuggled along, and the paths along which envoys first open talks, mostly follow this thread. The Government''s ledger records kin across the river as people off the ledger. A marriage with a person off the ledger is registered only if that person passes a registration review.

## Houses and Inheritance

People of the same clan within the same polity are called a **house**. In Seoul work pools in houses, because scarcity made children take over their parents'' work.

| Polity | What a house holds | Marriage |
|---|---|---|
| Government | An Assembly Member''s house passes down a district''s seat. One house holds only one seat. A Stationmaster''s seat also passes within the Stationmaster''s house. Other households pass down the trade written in the ledger | Valid only once the Dong Chief registers it in the ledger. A marriage between strata needs the Dong Chief''s approval, and a marriage in an Assembly Member''s house needs the Member''s approval. Marriage between Assembly Member houses is the commonest way of gathering in advance the seals that will acclaim a President |
| The Free Cities | A workbench house passes down its bench and its seal. A child who cannot show the skill does not inherit the bench, and then the bench holder brings in someone from another household who has shown it, by marriage or by contract | A household contract made between two houses. A marriage that joins the skills of two benches is counted the best marriage. Marriages between cities are common |
| Arc | A Near House is a family of the Hierophant''s blood, or one that came close to the Hierophant through marriage and long service at her side. The seat of the Head of a Near House follows blood, but the heir must have two or more parts | Arranged between houses. A Near House marriage is politics. A marriage with a bench worker''s house is counted the best marriage. Baptism is not a condition of marriage |

## Families without Bon-gwan or Hangnyeol

Sixty-two families are on record that do not use the bon-gwan and generation names of Korean clans. Most are descendants of immigrant communities that lived in Seoul before the Great Blackout. In 2126 they have no land of their own where they live apart. They are ordinary households living in the stations of each polity, and like other people of Seoul they are registered people of the Government, people of Free City workbenches or believers of Arc. They keep the surnames handed down to them.

## Sources

The general meaning of bon-gwan and hangnyeol follows these references.

- [Encyclopedia of Korean Culture: Bon-gwan](https://encykorea.aks.ac.kr/Article/E0023741)
- [Korean Wikipedia: Jokbo](https://ko.wikipedia.org/wiki/%EC%A1%B1%EB%B3%B4)
- [Korean Wikipedia: Korean surnames](https://ko.wikipedia.org/wiki/%ED%95%9C%EA%B5%AD%EC%9D%98_%EC%84%B1%EC%94%A8)
- [Korean Wikipedia: Hangnyeol](https://ko.wikipedia.org/wiki/%ED%95%AD%EB%A0%AC)

## Related Documents

- [People, Factions and Trades](/wiki/Characters-Factions-and-Professions/)
- [Government Society](/wiki/Government-Society/)
- [Free City Society](/wiki/Free-City-Society/)
- [Arc Society](/wiki/Arc-Society/)
- [Crossings and Smuggling](/wiki/Diaspora-Corridors/)
- [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/)
', '2126년 서울 사람도 대정전 전과 같이 성과 본관으로 집안을 가른다. 본관은 성씨의 계통을 가르는 땅 이름이고, 항렬은 같은 집안 안에서 같은 세대가 이름에 함께 쓰는 한 글자다. 백 년 동안 역이 갈리고 강이 얼어 집안이 흩어졌지만, 이름 속의 이 두 가지는 남았다. 그래서 강 양쪽에 사는 두 사람이 같은 본관과 같은 항렬자를 쓰면, 서로 한 번도 만난 적이 없어도 같은 세대의 친족이다.

## 씨족 기록

이 위키의 씨족 기록은 바꾸지 않는 기록이다. 사람의 이름과 성별과 나이처럼, 성과 본관과 집안의 관계도 고정된 사실로 둔다. 2126년의 정치가 바뀌어도 이 기록은 그대로다.

| 기록 | 수 |
|---|---|
| 씨족(성과 본관의 짝) | 177 |
| 씨족에 오른 사람 | 955명 |
| 한국 씨족의 본관과 항렬을 쓰지 않는 가족 | 62 |
| 항렬 가계 | 126개, 515명 |

씨족마다 성, 본관, 한자, 문장의 무늬가 있고, 그 아래 항렬 가계가 있다. 같은 성이라도 본관이 다르면 다른 집안이다. 같은 한글 본관이라도 한자가 다르면 다른 계통일 수 있다.

## 본관

본관은 그 집안의 시조가 난 곳이나 처음 자리 잡은 곳의 이름이다. 서울 사람은 처음 만난 사람의 성을 듣고 본관을 묻는다. 정부의 장부는 주민등록 기재 사항으로 본관을 적는다. 자유도시 사람은 "구로 모터대 김씨네 둘째"처럼 도시와 대와 집으로 부르지만, 혼인을 맺을 때는 본관을 따진다. 아크 사람은 이름 앞에 부위 수를 붙여 부르지만, 곁집의 혼인에서는 본관을 먼저 본다.

본관의 땅 이름은 대개 서울 밖 고을의 이름이다. 2126년의 서울 사람에게 그 땅은 테두리 너머에 있어 아무도 가 본 적이 없다. 본관은 이제 가 볼 수 없는 땅을 이름 속에 지니고 다니는 일이다.

## 항렬

항렬자는 같은 집안 같은 세대의 사람이 이름의 같은 자리에 함께 쓰는 글자다. 이 위키는 같은 씨족 안에서 이름의 같은 자리에 같은 글자를 쓰는 사람들을 한 **항렬 가계**로 묶는다. 가계의 이름은 "<글자> 항렬 가계"다. 같은 항렬은 같은 세대이므로, 한 가계 안의 사람들은 나이도 대개 가깝다.

항렬 가계는 기록에서 짐작한 것이다. 대정전 전의 족보는 대부분 눈 밑의 옛 집에 묻혔거나, 섬유가 되어 사라졌다. 정부는 옛 공문서를 먹지 않지만, 집집마다 지니던 족보는 그 금기에 들지 않았다. 그래서 2126년의 항렬은 사람들이 서로의 이름을 맞대어 다시 맞춘 것이다. 이 위키는 가계의 상태를 "추정"으로 적는다.

외자 이름을 쓰는 사람, 항렬자를 쓰지 않고 이름을 지은 집안도 많다. 본관이 있다고 항렬이 정해진 것은 아니다.

## 강 건너로 갈린 친족

항렬 가계 126개 가운데 92개는 사람들이 두 정체 이상에 흩어져 산다. 까닭은 두 갈래다.

1. **장부가 묶일 때.** 2036~2045년 강 북쪽 역들이 광화문 청사를 중심으로 장부를 하나로 묶었다. 한 집안이라도 서기가 닿은 역의 사람은 등재민이 됐고, 강 건너의 사람은 장부 밖이 됐다. 그 뒤로 등재민은 사는 곳을 마음대로 바꿀 수 없었다.
2. **아크가 갈라질 때.** 2122년 무렵 강남 대피소들이 아크로 묶였다. 강남 대피소에 살던 자유도시 집안은 그대로 아크가 됐다.

그래서 같은 항렬의 사촌이 강 양쪽과 동작–서초 경계 양쪽에 산다. 광주 노씨의 "호" 항렬 가계가 그 예다. 같은 세대의 노바호는 정부에, 노솔호는 자유도시에, 노하호는 아크에 산다. 세 사람은 같은 글자를 이름에 쓰지만 서로 다른 장부와 다른 말투 속에서 산다.

강 건너의 친족은 세 정체 사이의 가장 흔한 줄이다. 몰래 물건이 오가는 길도, 사절이 처음 말을 트는 길도 대개 이 줄을 탄다. 정부 장부는 강 건너 친족을 장부 밖 사람으로 적는다. 장부 밖 사람과의 혼인은 그 사람이 등재 심사를 통과해야 기재된다.

## 집안과 대물림

같은 정체 안의 같은 씨족 사람들을 **집안**이라 부른다. 서울에서 일은 집안에 고인다. 결핍이 자식에게 부모의 일을 물려받게 했기 때문이다.

| 정체 | 집안이 쥐는 것 | 혼인 |
|---|---|---|
| 정부 | 국회의원 집안은 구의 의석을 대물린다. 한 집안은 한 의석만 쥔다. 역장 자리도 역장 집안 안에서 물린다. 다른 집은 장부에 적힌 직종을 물린다 | 동장이 장부에 기재해야 성립한다. 다른 계층 사이의 혼인은 동장의 결재가 들고, 의원 집안의 혼인은 국회의원의 결재가 든다. 의원 집안끼리의 혼인이 대통령을 추대할 도장을 미리 모으는 가장 흔한 길이다 |
| 자유도시들 | 작업대 집안은 작업대와 그 도장을 대물린다. 손을 보이지 못한 자식은 대를 잇지 못하고, 그때 대주는 손을 보인 다른 집 사람을 혼인이나 계약으로 들인다 | 두 집안이 맺는 가구 계약이다. 두 대의 기술을 묶는 혼인을 가장 좋은 혼인으로 친다. 도시를 넘는 혼인은 흔하다 |
| 아크 | 곁집은 교주의 핏줄이거나 혼인과 오랜 곁 섬김으로 교주에게 가까워진 가문이다. 곁집장 자리는 피를 따르되 부위가 둘 이상이어야 한다 | 집안끼리 정한다. 곁집의 혼인은 정치다. 정비공 집안과 맺는 혼인을 가장 좋은 혼인으로 친다. 세례는 혼인의 조건이 아니다 |

## 본관과 항렬을 쓰지 않는 가족

한국 씨족의 본관과 항렬을 쓰지 않는 가족이 62개 기록되어 있다. 대개 대정전 전 서울에 살던 이주민 공동체의 후손이다. 2126년에 그들이 따로 모여 사는 땅은 없다. 그들은 각 정체의 역에 사는 보통 가구이고, 다른 서울 사람처럼 정부의 등재민이거나, 자유도시의 작업대 사람이거나, 아크의 신도다. 성은 대대로 이어 온 그대로 쓴다.

## 출처

본관과 항렬의 일반적인 뜻은 아래를 참고했다.

- [한국민족문화대백과사전: 본관](https://encykorea.aks.ac.kr/Article/E0023741)
- [위키백과: 족보](https://ko.wikipedia.org/wiki/족보)
- [위키백과: 한국의 성씨](https://ko.wikipedia.org/wiki/한국의_성씨)
- [위키백과: 항렬](https://ko.wikipedia.org/wiki/항렬)

## 관련 문서

- [인물·세력·생업](/wiki/Characters-Factions-and-Professions/)
- [정부 사회](/wiki/Government-Society/)
- [자유도시들의 사회](/wiki/Free-City-Society/)
- [아크 사회](/wiki/Arc-Society/)
- [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)
- [급수계약과 세 정체](/wiki/World-Relation-Ledger/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Ecology-Index', 'Hostile Ecology Compendium', '적대 생태 도감', 'bestiary', 0, 'What threatens people in Seoul is not only what is not human. This compendium brings together in one place the animals that live off the stations, the bands of people who can no longer lean on any of the three polities, the old machines asleep inside Seoul, and the war machines that circle the band around Seoul. There are twenty-six groups in all, numbered G01 to G26.

The most common death is none of these. What kills the most people in Seoul is the cold. This compendium covers what comes after the cold.

<a id="four-kinds"></a>

## Four kinds

| Kind | Groups | What they are |
|---|---|---|
| Animals | G01-G06 | Wild animals and birds that survived by living off the stations'' heat and waste |
| Hostile human groups | G07-G12 | Bands of people who can no longer lean on any of the three polities |
| Old machines inside Seoul | G13-G16, G25 | Civilian machines that worked in Seoul before the Great Blackout. Most are asleep and wake when power reaches them |
| Perimeter machines | G17-G24, G26 | War machines circling the band outside Seoul''s boundary. For a hundred years they have kept the last order people gave around the Great Blackout: the capital blockade |

| No. | Name | Kind | Threat |
|---|---|---|---|
| G01 | [Wild Boar](/wiki/Hostile-Group-G01/) | Animals | 3 |
| G02 | [Large-billed Crow](/wiki/Hostile-Group-G02/) | Animals | 1 |
| G03 | [Feral Dogs](/wiki/Hostile-Group-G03/) | Animals | 3 |
| G04 | [Raccoon Dog](/wiki/Hostile-Group-G04/) | Animals | 2 |
| G05 | [Brown Rat](/wiki/Hostile-Group-G05/) | Animals | 2, livelihood threat 4 |
| G06 | [Herons and Cormorants](/wiki/Hostile-Group-G06/) | Animals | 1 |
| G07 | [Yongsan Struck-Off](/wiki/Hostile-Group-G07/) | Hostile human groups | 3 |
| G08 | [Dongdaemun Coupon-Forgers](/wiki/Hostile-Group-G08/) | Hostile human groups | 2-3, ledger threat 4 |
| G09 | [Sangam Deserters](/wiki/Hostile-Group-G09/) | Hostile human groups | 4 |
| G10 | [Bogungmun Perimeter-Runners](/wiki/Hostile-Group-G10/) | Hostile human groups | 3-4 |
| G11 | [Suseo Gone-Dark](/wiki/Hostile-Group-G11/) | Hostile human groups | 3 |
| G12 | [Geumcheon Hands Without Surety](/wiki/Hostile-Group-G12/) | Hostile human groups | 3 |
| G13 | [Claw Arms](/wiki/Hostile-Group-G13/) | Old machines inside Seoul | 3 |
| G14 | [Empty Carts](/wiki/Hostile-Group-G14/) | Old machines inside Seoul | 3 |
| G15 | [Care Wheels](/wiki/Hostile-Group-G15/) | Old machines inside Seoul | 3 |
| G16 | [Girder Spiders](/wiki/Hostile-Group-G16/) | Old machines inside Seoul | 3, livelihood threat 4 |
| G17 | [One-Eye Towers](/wiki/Hostile-Group-G17/) | Perimeter machines | 4 |
| G18 | [Tunnel-Stoppers](/wiki/Hostile-Group-G18/) | Perimeter machines | 5 |
| G19 | [Growlers](/wiki/Hostile-Group-G19/) | Perimeter machines | 5, strayed ones 4 |
| G20 | [Bulgasari](/wiki/Hostile-Group-G20/) | Perimeter machines | 4 |
| G21 | [Ground-Knockers](/wiki/Hostile-Group-G21/) | Perimeter machines | 3 |
| G22 | [Dokkaebi Lights](/wiki/Hostile-Group-G22/) | Perimeter machines | 4 |
| G23 | [Udukeoni](/wiki/Hostile-Group-G23/) | Perimeter machines | 4 |
| G24 | [Doenoemi](/wiki/Hostile-Group-G24/) | Perimeter machines | 2 |
| G25 | [Lamp Ants](/wiki/Hostile-Group-G25/) | Old machines inside Seoul | 2, livelihood threat 3 |
| G26 | [Iron Dinosaurs](/wiki/Hostile-Group-G26/) | Perimeter machines | 5 |

The blue lights, knocking on walls, figures standing under frost and a child crying in the stories told at the boundary stations are all stories of people who saw and heard perimeter machines. Station people named those machines by their look and sound.

<a id="thaw-pocket"></a>

## Thaw-pocket ecology

Almost nothing grows on its own on the surface. The trees died in the first winters, and the ground lies under 6-8 m of snow. Light is a quarter of what it was before the Great Blackout, and the yearly mean temperature is -18 °C. A thin film of moss and lichen on wind-scoured bridge railings and rocks is all the wild growth on the surface.

So every wild animal in Seoul lives off the people''s stations. The heat the stations give off, the waste they throw away and the light-fields they tend are the floor of Seoul''s food web. The animals live along the thawed ground around each living station, the thaw pocket. This is called **thaw-pocket ecology**.

Three things follow.

1. Animals grow scarcer the farther one goes from a station. On the snowfields more than 2 km from a station there is almost nothing but birds.
2. The number of animals follows the number of people. The Government, with the most people (about 160,000), also meets the most animals.
3. When a station is abandoned, the animals around it starve or move to another station within a few years.

### The five sources of the food web

| Source | What it is | Groups that eat it |
|---|---|---|
| Station waste | Fibre-sugar dregs, mushroom-cellar dregs, larvae escaped from the insect vats, kitchen scraps, the compost left by the methane vats | Brown rat, raccoon dog, wild boar, large-billed crow |
| Light-fields | Cabbage, turnip, mustard greens, barley and sprouts grown in the light-fields around the exits | Wild boar (digs through the snow banks), large-billed crow (pecks the roofs), brown rat |
| Buried old carbon | Mushrooms that grew by themselves on paper and wood in buried basements at the edge of the thaw pockets. They spread from spores escaping the mushroom cellars, so station people call them **wild mushrooms**. Small insects that eat them live alongside | Brown rat, wild boar |
| The river under ice | River water seeping up from the ground, organic matter in the old riverbed mud, and water let out by riverside stations. Bottom-dwelling invertebrates feed on it, and crucian carp and common carp feed on them | Herons and cormorants, raccoon dog, people |
| Frozen carcasses | Animals that froze to death, and animals stopped by perimeter machines. In the cold they do not rot, so they feed scavengers for a long time | Large-billed crow, feral dogs |

Human dead do not enter this web. All three polities guard their dead from animals.

### The shape of the web

```
People''s stations (heat · waste · light-fields)
   ├─▶ brown rats · escaped larvae · wild mushrooms
   │      └─▶ raccoon dogs · feral dogs · large-billed crows · wild boar
   │               └─▶ people (traps and hunting: fat · fur · meat)
   └─▶ light-fields ─▶ wild boar · large-billed crows · brown rats

The river under ice (seeping water · riverbed mud · water from riverside stations)
   └─▶ bottom invertebrates ─▶ crucian carp · common carp ─▶ herons · cormorants · raccoon dogs · people
```

The web is short. No chain has more than three links. Little energy comes in at the bottom, so there is no room for a large hunting animal. The largest wild animal in Seoul is the wild boar, and even it is smaller than before the Great Blackout.

| Group | All of Seoul | Densest where |
|---|---|---|
| Brown rat | 400,000-600,000 | The Arc''s four districts, full of deep buildings; large transfer stations |
| Large-billed crow | 15,000-25,000 | The Government''s fourteen districts, with the widest light-fields |
| Raccoon dog | 3,000-5,000 | Riverside intakes and old conduits |
| Feral dogs | 2,000-4,000 (150-250 packs) | The Free Cities'' factory grounds, the Government''s northern districts |
| Wild boar | 400-800 | Stations at the foot of Bukhansan, Dobongsan, Suraksan, Buramsan and Gwanaksan |
| Herons and cormorants | 300-500 | The open water below the Jamsil underwater weir |

<a id="light-halves"></a>

## Bodies that follow the light halves

This world has no seasons, but the halves of light come round. Day length, not temperature, divides the animals'' year.

| Group | Long-light half | Long-dark half |
|---|---|---|
| Wild boar | Gives birth at the start. Raids the light-fields most | Mates in the middle. Males fight often, so meeting one in a tunnel is dangerous |
| Large-billed crow | Lays eggs at the start. Fierce around the nest | Roosts in flocks around the exhaust shafts |
| Feral dogs | No difference | No difference, except that starving packs come close to the exits |
| Raccoon dog | Awake, eating and putting on fat | Sleeps most of it in its den |
| Brown rat | Breeds all year with no break | The same |
| Herons and cormorants | Nest on bridge structures | Gather around open water |

Light-fields grow better in the long-light half, so the light-field harvest is concentrated in the later half of the long-light half. That is also when animals go after the light-fields most.

Blizzards are more frequent in the long-dark half: two or three a month in the long-dark half, about one a month in the long-light half. So more people cross the perimeter in the long-dark half too.

<a id="meals"></a>

## People''s meals and wild animals

Fish and hunting are about 6% of the calories Seoul''s people eat. Most of it is fish raised in tanks in warm stations, fed insects and fibre-sugar dregs (about 5.5%). Crucian carp and common carp caught through holes in the river ice are about 0.3%; the river is dark and its flow has shrunk, so all of Seoul cannot catch more than a few hundred tonnes a year. Hunting wild animals is about 0.2%.

Wild animals are valued not for calories but for these four things.

- **Fat.** Boar and raccoon-dog fat becomes oil lamps and tallow candles. Oil lamps are lit only where fat is produced.
- **Fur and hide.** Raccoon-dog fur and boar hide are the warmest clothing materials in Seoul.
- **Bone and sinew.** Needles, thread, bowstrings, tool handles.
- **Feathers.** Padding for clothes and bedding.

<a id="threat-grades"></a>

## Threat levels

| Level | Name | Meaning |
|---|---|---|
| 1 | Nuisance | Wastes food and goods. Does not kill people |
| 2 | Harm | Injures a person alone, or spreads disease |
| 3 | Danger | Can kill a work party (3-6 people). Needs an armed response |
| 4 | Grave danger | An armed squad must face it. Can ruin one station''s livelihood |
| 5 | Avoid | Hard to beat even with an army. The answer is not to meet it |

A level is the threat of one encounter with one group. Groups where one animal is weak but the harm to a station''s food or cables is greater get a separate **livelihood threat**. The coupon-forgers, who throw the ledger off, get a **ledger threat**.

<a id="threat-by-depth"></a>

## Threat by depth

By depth a station divides into surface, concourse, platform and deep tunnel. To talk about threat, two more places are counted. The unused tunnels between stations, the closed-off exits and frozen upper floors, and the basements of old buildings buried under the snow are the **abandoned sections**. Whole abandoned stations are rare; what is abandoned is mostly part of a station, or the space between stations. The band 2-10 km outside Seoul''s administrative boundary is the **perimeter**, and the 0-2 km inside it is the **forecourt**.

| Layer | Depth | Groups met most | Highest threat |
|---|---|---|---|
| Surface, around the station | a few hundred metres from the exits | Large-billed crows (light-field roofs), wild boar (light-field banks), feral dogs (exits), herons and cormorants (riverside ice holes) | 3 |
| Surface, far from the station | fibre-mining routes, wind-machine fields, bridges | Feral-dog packs, human groups blocking the way (G07, G09, G10, G12), claw arms, care wheels and girder spiders woken from sleep | 4 |
| Concourse | 3-8 m below ground | Feral dogs (come in through closed exits), raccoon dogs, night raids by human groups | 3 |
| Platform | 8-25 m below ground | Brown rats (fibre-sugar vats, mushroom cellars, cables), raccoon dogs (ventilation ducts), people who have slipped into a station (G08, G11) | 3, livelihood threat 4 |
| Deep tunnel | below 25 m | Brown rats. The deep layer of a living station is the safest place | 2 |
| Abandoned sections | any depth | Wild boar, brown rats, empty carts, lamp ants, claw arms, care wheels and girder spiders woken from sleep, strayed growlers and udukeoni, human groups'' hideouts | 4 |
| Line ends leading out of Seoul | tunnels beyond the boundary stations | Tunnel-stoppers, ground-knockers | 5 |
| Forecourt | 0-2 km outside the boundary | Watched over by one-eye towers. Strayed udukeoni, perimeter-runners | 4 |
| Perimeter | 2-10 km outside the boundary | One-eye towers, growlers, bulgasari, ground-knockers, dokkaebi lights, udukeoni, doenoemi, iron dinosaurs | 5 |

In one line: **inside a living station, the deeper the safer; outside the station, the farther the more dangerous.** The threats inside a living station mostly eat into its livelihood; the threats that take lives are in the abandoned sections and outside.

<a id="threat-by-station"></a>

## Threat by station position

| Station position | Examples | Main threats |
|---|---|---|
| Large downtown transfer stations | Seoul Station, City Hall, Jongno 3-ga, Jamsil, Sindorim, Yeongdeungpo | The brown rat''s livelihood threat; people who have slipped into the station, such as the coupon-forgers |
| Riverside stations | Guui, Ttukseom, Ichon, Noryangjin, Dongjak, Heukseok, Jamsillaru, Amsa | Herons and cormorants, raccoon dogs, the Yongsan struck-off who use the bridges |
| Mountain-foot stations | Bukhansan Ui, Bukhansan Bogungmun, Jeongneung, Dobongsan, Suraksan, Buramsan, Achasan, Gwanaksan | Wild boar, the Bogungmun perimeter-runners |
| Boundary stations (Government) | Gupabal, Dokbawi, Digital Media City, Susaek, Dobongsan, Suraksan, Buramsan, Sinnae, Mangu | The Sangam deserters, the Bogungmun perimeter-runners, strayed growlers and udukeoni, tunnel-stoppers at the line ends |
| Boundary stations (Free Cities) | Gaehwa, Gaehwasan, Gimpo Int''l Airport, Banghwa, Onsu, Oryu-dong, Cheonwang, Gaebong, Doksan, Geumcheon-gu Office, Namtaeryeong, Gwanaksan | The Geumcheon hands without surety, feral dogs, strayed growlers and udukeoni, tunnel-stoppers at the line ends |
| Boundary stations (Arc) | Cheonggyesan, Yangjae Citizen''s Forest, Daemosan, Suseo, Bokjeong, Jangji, Macheon, Geoyeo, Gangil, Sangil-dong | The Suseo gone-dark, strayed growlers and udukeoni, tunnel-stoppers at the line ends |

<a id="fibre-routes"></a>

## The fibre-mining routes

Fibre shrinks every year, and the way to mine it grows longer every year. More people in Seoul die on these routes than on any other.

- **Length.** In 2126 a fibre-mining party walks 1-3 km over the snow from its station and digs below the second floor of buried offices and warehouses. The Government''s downtown is still near; for the Free Cities and the Arc it is far.
- **Cold.** The most common death is neither animal nor machine but cold: a party meets a blizzard and does not come back.
- **Sleeping machines.** The places with the most fibre left are the pre-Blackout logistics warehouses, hospitals and half-built buildings. Claw arms, care wheels and girder spiders sleep in their basements. They wake when a party connects batteries to make light.
- **People.** The Yongsan struck-off, the Sangam deserters and the Geumcheon hands without surety block fibre routes and take tolls.
- **Feral dogs.** Feral-dog packs follow parties carrying heavy loads.

<a id="outside-polities"></a>

## People outside the polities

The three polities hold people with different ties, so the people whose ties are cut differ too.

| Polity | The tie that holds people | How the tie is cut | What the cut-off are called |
|---|---|---|---|
| Government | The ledger. Rations come only for the registered work at the registered station | Leaving one''s registered station means being struck off. Striking-off is also a punishment | Official word **the struck-off**; spoken, "the erased" |
| Free Cities | Contract and surety. Work and a share come only when someone stands surety | The guarantor withdraws, the contract is broken, or the workbench that would stand surety fails | **hands without surety** |
| Arc | The Near Houses and the maintenance benches. A baptized body lives only while it reaches maintenance and charging | Dropped from the maintenance roll by the Hierophant''s word or a Near House''s ruling. Some leave of their own accord | **the gone-dark**, gone-dark bodies |

The struck-off cannot easily get into the Free Cities even if they cross the river: the Free Cities give no work to people without surety. Hands without surety cannot get onto the Government ledger: the ledger does not record people from across the river as people. The gone-dark have nowhere but the Arc to maintain their bodies. So the people caught between the three polities form bands. They are G07-G12.

They are people, not animals or machines. They can be spoken to, traded with, and may return to a polity.

<a id="machines"></a>

## Machines

| Kind | What it is | Groups |
|---|---|---|
| Sleeping old machines | Pre-Blackout logistics, hospital, construction and utility machines of Seoul. When the power went, most fell asleep. When people put power back into a buried building or connect a battery, they wake and do again the work of a hundred years ago. Their rolls and schedules hold none of today''s people | Claw arms, empty carts, care wheels, girder spiders, lamp ants |
| Perimeter machines | War machines people used around the Great Blackout. For a hundred years they have kept the last order people gave: the capital blockade. They do not come into Seoul | One-eye towers, tunnel-stoppers, growlers, bulgasari, ground-knockers, dokkaebi lights, udukeoni, doenoemi, iron dinosaurs |
| Strayed machines | Perimeter machines that lost their place through breakdown and drifted as far as the boundary stations inside Seoul. The order remains, but they no longer know where to keep it | Mostly growlers, udukeoni |
| Revived machines | Sleeping old machines and strayed machines that people have mended and tamed. The Free Cities and the Arc have the most | Mostly empty carts, girder spiders, lamp ants |

None of these kinds is the First AI''s machine. When people die to machines outside, it is the result of an order people gave; the First AI did not kill them.

The sleeping old machines lasted a hundred years because of the cold. In frozen basements rust is slow and grease only stiffens; nothing rots. The cold is also why a woken machine cannot move for long: with stiff joints and worn batteries it works for hours or days and stops again. But if it stays connected to power people have run in, it eats that power and carries on working.

### What is salvaged

What is salvaged from machines is the most precious stuff in Seoul. What is salvaged from perimeter machines is worth a life.

| Salvage | From where | Who wants it most |
|---|---|---|
| Power cores | Perimeter machines (large in growlers, udukeoni and iron dinosaurs), some old machines | The Arc (charging and maintenance of the baptized), the Free Cities |
| Moving joints and motors | All machines | The Free Cities (wind machines, pumps, water wheels) |
| Eyes (sensors and lenses) | One-eye towers, growlers, dokkaebi lights, udukeoni | The Free Cities, the Government army |
| Cable and copper | Old machines, lamp ants | The Government (along with downtown salvage), the Free Cities |
| Armour plate | Growlers, udukeoni, iron dinosaurs | The Government army, the Arc |
| Firearms and ammunition | The armament of growlers, dokkaebi lights and udukeoni | The Government army; all three polities want them |
| Record devices | Care wheels, one-eye towers, doenoemi | The Government (old records), the Arc |

### Machine names

Station people do not call machines by machine names. They name them by look, sound and use. The only names borrowed from old tales are bulgasari, the iron-eating beast, and dokkaebi lights; all the rest come from shape or use. Each polity may have its own official names, but this compendium uses the spoken names understood anywhere in Seoul.

<a id="perimeter"></a>

## The perimeter and beyond the band

Going outward from Seoul''s administrative boundary there are three layers.

| Layer | Distance | What is there |
|---|---|---|
| Forecourt | 0-2 km outside the boundary | No machines circle here. One-eye towers look down on it, and now and then there is a strayed machine. The ridges just beyond the boundary with the dead forest still on them, the perimeter-runners'' paths. The blocking berms mark the end of the forecourt |
| Perimeter | 2-10 km | The band the perimeter machines keep. Snow-covered satellite towns, buried highways, fields of wrecked machines |
| Beyond the band | beyond 10 km | Unknown |

The machines keep the band. They see movement and heat. The two to four days when a blizzard blinds them are people''s only window. The ground-knockers, though, hear even in a blizzard.

Those who cross the band are perimeter-runners, salvage parties the three polities send in secret, and people driven out. Of the parties that salvage wrecks in the forecourt, one or two in ten do not come back. Of those who go into the perimeter band itself, seven or eight in ten do not come back. No one who crossed the whole band to go beyond it is known to have returned.

All that Seoul''s people know about beyond the band is this.

- For a hundred years no person, no news and no bird has come from beyond the band. Not even migrating birds come.
- The machines of the band do not come into Seoul. Which way their order faces is unknown.
- The old broadcasts of the doenoemi speak of a "blockade". They do not say what is kept from what.

The three polities speak of beyond the band in different ways. The Government says, "Outside Seoul is a blockaded zone. The Government of the Republic of Korea is here." Free City people say, "You cannot reckon beyond the band. Nobody has been and come back, so you cannot put a price on it." The Arc teaches, "God brought down the winter and nothing more; God does not drive the machines. The band is something people left behind."

At the boundary stations people say that there are people living in stations beyond the band, that the winter is milder beyond the band, that someone who drives the machines is still alive. All are rumours. No one has confirmed them. More on what lies outside Seoul is in [Beyond Seoul: the Rim](/wiki/External-Theaters/).

<a id="encounters"></a>

## Encounters by faction

| Group | Government | Free Cities | Arc |
|---|---|---|---|
| G01 Wild Boar | Most often | Gwanak | Rare |
| G02 Large-billed Crow | Most often | Meets it | Meets it |
| G03 Feral Dogs | Northern districts | Most often | Rare |
| G04 Raccoon Dog | Most often | Yeongdeungpo intake | Amsa |
| G05 Brown Rat | Every day | Every day | Most often |
| G06 Herons and Cormorants | Gwangjin | Rare | Most often |
| G07 Yongsan Struck-Off | Most often | Dongjak | None |
| G08 Dongdaemun Coupon-Forgers | Most often | None | None |
| G09 Sangam Deserters | Most often | Gangseo | None |
| G10 Bogungmun Perimeter-Runners | Most often | Rare | The buyer |
| G11 Suseo Gone-Dark | Rare | Rare | Most often |
| G12 Geumcheon Hands Without Surety | None | Most often | Rare |
| G13 Claw Arms | Meets it | Most often | Songpa |
| G14 Empty Carts | Rare | Most often | Songpa |
| G15 Care Wheels | Most often | Boramae Medical Center | Songpa, Gangdong |
| G16 Girder Spiders | Rare | Rare | Most often |
| G17 One-Eye Towers | Most often | Gwanak, Geumcheon | Meets it |
| G18 Tunnel-Stoppers | Most often | Meets it | Meets it |
| G19 Growlers | Most often | Geumcheon, Gangseo | Meets it |
| G20 Bulgasari | Through the perimeter-runners | Rare | The buyer |
| G21 Ground-Knockers | Meets it | Meets it | Meets it |
| G22 Dokkaebi Lights | Meets it | Most often | Meets it |
| G23 Udukeoni | Meets it | Meets it | Most often (strayed ones) |
| G24 Doenoemi | Meets it | Meets it | Meets it |
| G25 Lamp Ants | Most often | Yeongdeungpo | Rare |
| G26 Iron Dinosaurs | Eunpyeong, Dobong | Most often (Gangseo) | Rare |

In one line: the Government, with the most people, meets the most animals and struck-off; the Free Cities meet the most old machines and feral dogs on their factory grounds and western plain; the Arc meets the most rats and girder spiders in its deep buildings, and the gone-dark and strayed udukeoni on its south-eastern boundary.

How the three polities deal with these groups is in [Government Society](/wiki/Government-Society/), [Free City Society](/wiki/Free-City-Society/) and [Arc Society](/wiki/Arc-Society/).
', '서울에서 사람을 위협하는 것은 사람 아닌 것만이 아니다. 이 도감은 역 둘레에 기대 사는 짐승, 세 정체 어디에도 기대지 못하게 된 사람들의 무리, 서울 안에 잠든 옛 기계, 서울 둘레의 띠를 도는 전쟁 기계를 한자리에 모은다. 무리는 모두 스물여섯이고, G01부터 G26까지 번호가 붙어 있다.

가장 흔한 죽음은 이 가운데 어느 것도 아니다. 서울에서 사람을 가장 많이 죽이는 것은 추위다. 이 도감은 추위 다음의 것들을 다룬다.

<a id="four-kinds"></a>

## 네 갈래

| 갈래 | 무리 | 무엇인가 |
|---|---|---|
| 짐승 | G01~G06 | 역의 열과 찌꺼기에 기대 살아남은 들짐승과 새 |
| 적대 사람 무리 | G07~G12 | 세 정체 가운데 어디에도 기대지 못하게 된 사람들의 무리 |
| 서울 안 옛 기계 | G13~G16, G25 | 대정전 전 서울에서 일하던 민간 기계. 대부분 잠들어 있고, 전기가 닿으면 깨어난다 |
| 테두리 기계 | G17~G24, G26 | 서울 경계 바깥 띠를 도는 전쟁 기계. 대정전 무렵 사람이 내린 마지막 명령, 수도 봉쇄를 백 년째 지킨다 |

| 번호 | 이름 | 갈래 | 위협 |
|---|---|---|---|
| G01 | [멧돼지](/wiki/Hostile-Group-G01/) | 짐승 | 3 |
| G02 | [큰부리까마귀](/wiki/Hostile-Group-G02/) | 짐승 | 1 |
| G03 | [들개](/wiki/Hostile-Group-G03/) | 짐승 | 3 |
| G04 | [너구리](/wiki/Hostile-Group-G04/) | 짐승 | 2 |
| G05 | [집쥐](/wiki/Hostile-Group-G05/) | 짐승 | 2, 살림 위협 4 |
| G06 | [왜가리·가마우지](/wiki/Hostile-Group-G06/) | 짐승 | 1 |
| G07 | [용산 말소자](/wiki/Hostile-Group-G07/) | 적대 사람 무리 | 3 |
| G08 | [동대문 증표꾼](/wiki/Hostile-Group-G08/) | 적대 사람 무리 | 2~3, 장부 위협 4 |
| G09 | [상암 탈영병](/wiki/Hostile-Group-G09/) | 적대 사람 무리 | 4 |
| G10 | [보국문 테두리꾼](/wiki/Hostile-Group-G10/) | 적대 사람 무리 | 3~4 |
| G11 | [수서 꺼진 사람들](/wiki/Hostile-Group-G11/) | 적대 사람 무리 | 3 |
| G12 | [금천 보증 잃은 손](/wiki/Hostile-Group-G12/) | 적대 사람 무리 | 3 |
| G13 | [집게팔](/wiki/Hostile-Group-G13/) | 서울 안 옛 기계 | 3 |
| G14 | [빈수레](/wiki/Hostile-Group-G14/) | 서울 안 옛 기계 | 3 |
| G15 | [돌봄바퀴](/wiki/Hostile-Group-G15/) | 서울 안 옛 기계 | 3 |
| G16 | [철골거미](/wiki/Hostile-Group-G16/) | 서울 안 옛 기계 | 3, 살림 위협 4 |
| G17 | [외눈탑](/wiki/Hostile-Group-G17/) | 테두리 기계 | 4 |
| G18 | [굴막이](/wiki/Hostile-Group-G18/) | 테두리 기계 | 5 |
| G19 | [그르렁이](/wiki/Hostile-Group-G19/) | 테두리 기계 | 5, 흘러든 것은 4 |
| G20 | [불가사리](/wiki/Hostile-Group-G20/) | 테두리 기계 | 4 |
| G21 | [땅두드리기](/wiki/Hostile-Group-G21/) | 테두리 기계 | 3 |
| G22 | [도깨비불](/wiki/Hostile-Group-G22/) | 테두리 기계 | 4 |
| G23 | [우두커니](/wiki/Hostile-Group-G23/) | 테두리 기계 | 4 |
| G24 | [되뇌미](/wiki/Hostile-Group-G24/) | 테두리 기계 | 2 |
| G25 | [등불개미](/wiki/Hostile-Group-G25/) | 서울 안 옛 기계 | 2, 살림 위협 3 |
| G26 | [철공룡](/wiki/Hostile-Group-G26/) | 테두리 기계 | 5 |

경계 역에서 전해지는 이야기 속의 푸른 불빛, 벽을 두드리는 소리, 서리 앉은 채 선 것, 아이 울음은 모두 테두리 기계를 보고 들은 사람들의 이야기다. 역 사람들은 그 기계들에 생김새와 소리로 이름을 붙였다.

<a id="thaw-pocket"></a>

## 녹은 주머니 생태

지상에서 저절로 자라는 것은 거의 없다. 나무는 첫 겨울들에 죽었고, 땅은 6~8 m 눈 밑에 있다. 빛은 대정전 전의 4분의 1이고, 한 해 평균 기온은 영하 18도다. 바람이 눈을 쓸어 낸 다리 난간과 바위에 이끼와 지의류가 얇게 붙어 있는 것이 지상의 들풀 전부다.

그래서 서울의 들짐승은 모두 사람의 역에 기대 산다. 역이 내는 열, 역이 버리는 찌꺼기, 역이 기르는 빛밭이 서울 먹이그물의 바닥이다. 사는 역 둘레의 녹은 땅, 곧 녹은 주머니를 따라 짐승이 산다. 이것을 **녹은 주머니 생태**라 부른다.

여기서 세 가지가 따라 나온다.

1. 짐승은 역에서 멀어질수록 드물다. 역에서 2 km를 넘게 떨어진 눈 벌판에는 새 말고는 거의 아무것도 없다.
2. 짐승의 수는 사람의 수를 따라간다. 사람이 가장 많은 정부(약 16만)가 짐승도 가장 많이 만난다.
3. 역이 버려지면 그 둘레의 짐승도 몇 해 안에 굶어 죽거나 다른 역으로 옮긴다.

### 먹이그물의 다섯 원천

| 원천 | 무엇인가 | 그것을 먹는 무리 |
|---|---|---|
| 역의 찌꺼기 | 섬유당 찌꺼기, 버섯 굴 찌꺼기, 벌레 통에서 빠져나간 애벌레, 부엌 찌꺼기, 메탄 통에서 나온 찌꺼기 거름 | 집쥐, 너구리, 멧돼지, 큰부리까마귀 |
| 빛밭 | 출입구 둘레의 빛밭에서 자라는 배추, 순무, 갓, 보리와 싹 | 멧돼지(눈 둑을 판다), 큰부리까마귀(지붕을 쫀다), 집쥐 |
| 묻힌 옛 탄소 | 녹은 주머니 가장자리의 묻힌 건물 지하에서 종이와 나무에 저절로 핀 버섯. 버섯 굴에서 흘러나간 포자가 퍼진 것이라 역 사람들은 **들버섯**이라 부른다. 들버섯을 먹는 작은 벌레가 함께 산다 | 집쥐, 멧돼지 |
| 얼음 밑 강 | 땅속에서 스며 나오는 강물, 옛 강바닥 진흙의 유기물, 강가 역이 흘려보내는 물. 이것을 먹는 바닥 벌레가 있고, 그것을 붕어와 잉어가 먹는다 | 왜가리·가마우지, 너구리, 사람 |
| 언 주검 | 얼어 죽은 짐승, 테두리 기계가 멈춰 세운 짐승. 추위 속에서는 썩지 않아 오래 먹이가 된다 | 큰부리까마귀, 들개 |

사람의 주검은 이 그물에 들어가지 않는다. 세 정체 모두 주검을 짐승에게서 지킨다.

### 그물의 모양

```
사람의 역 (열 · 찌꺼기 · 빛밭)
   ├─▶ 집쥐 · 빠져나간 애벌레 · 들버섯
   │      └─▶ 너구리 · 들개 · 큰부리까마귀 · 멧돼지
   │               └─▶ 사람 (덫과 사냥: 기름 · 털가죽 · 고기)
   └─▶ 빛밭 ─▶ 멧돼지 · 큰부리까마귀 · 집쥐

얼음 밑 강 (스며 나온 물 · 강바닥 진흙 · 강가 역의 물)
   └─▶ 바닥 벌레 ─▶ 붕어 · 잉어 ─▶ 왜가리 · 가마우지 · 너구리 · 사람
```

그물은 짧다. 사슬이 세 고리를 넘지 않는다. 바닥에 들어오는 힘이 작아서 큰 사냥 짐승이 설 자리가 없다. 서울에서 가장 큰 들짐승은 멧돼지이고, 그것도 대정전 전보다 작다.

| 무리 | 서울 전체 | 가장 짙은 곳 |
|---|---|---|
| 집쥐 | 40만~60만 마리 | 깊은 건물이 많은 아크 4구, 큰 환승역 |
| 큰부리까마귀 | 1만 5천~2만 5천 마리 | 빛밭이 가장 넓은 정부 14구 |
| 너구리 | 3,000~5,000 마리 | 강가 취수구와 옛 관로 |
| 들개 | 2,000~4,000 마리(무리 150~250) | 자유도시들의 공장 터, 정부 북쪽 구 |
| 멧돼지 | 400~800 마리 | 북한산, 도봉산, 수락산, 불암산, 관악산 자락의 역 |
| 왜가리·가마우지 | 300~500 마리 | 잠실수중보 아래 열린 물 |

<a id="light-halves"></a>

## 빛의 철을 따르는 몸

이 세계에는 계절이 없지만 빛의 철은 돌아온다. 기온이 아니라 낮 길이가 짐승의 해를 나눈다.

| 무리 | 긴 낮 철 | 긴 밤 철 |
|---|---|---|
| 멧돼지 | 첫머리에 새끼를 낳는다. 빛밭을 가장 많이 턴다 | 한가운데에 짝짓는다. 수컷끼리 싸움이 잦아 터널에서 마주치면 위험하다 |
| 큰부리까마귀 | 첫머리에 알을 낳는다. 둥지 둘레에서 사납다 | 무리를 지어 배기 굴 둘레에 모여 잔다 |
| 들개 | 가리지 않는다 | 가리지 않는다. 다만 굶주린 무리가 출입구에 가까이 온다 |
| 너구리 | 깨어 먹고 살을 찌운다 | 대부분을 굴에서 잔다 |
| 집쥐 | 가리지 않고 한 해 내내 새끼를 친다 | 같다 |
| 왜가리·가마우지 | 다리 구조물에 둥지를 짓는다 | 열린 물 둘레에 모인다 |

빛밭은 빛이 긴 철에 더 잘 자라므로, 빛밭 수확은 긴 낮 철의 뒤쪽 절반에 몰린다. 짐승이 빛밭을 가장 많이 노리는 때도 그때다.

눈보라는 긴 밤 철에 더 잦다. 긴 밤 철에는 한 달에 두세 번, 긴 낮 철에는 한 달에 한 번꼴로 온다. 그래서 테두리를 넘는 사람도 긴 밤 철에 많다.

<a id="meals"></a>

## 사람의 끼니와 들짐승

물고기와 사냥은 서울 사람 열량의 약 6%다. 그 대부분은 따뜻한 역의 수조에서 벌레와 섬유당 찌꺼기를 먹여 기르는 물고기(약 5.5%)다. 강 얼음 구멍으로 잡는 붕어와 잉어는 약 0.3%이고, 어둡고 흐름이 준 강이라 서울 전체가 한 해 수백 톤을 넘게 잡지 못한다. 들짐승 사냥은 약 0.2%다.

들짐승이 귀한 까닭은 열량이 아니라 다음 넷이다.

- **기름.** 멧돼지와 너구리의 기름은 기름등과 기름초가 된다. 기름등은 지방이 나는 곳에서만 켠다.
- **털가죽.** 너구리 털과 멧돼지 가죽은 서울에서 가장 따뜻한 옷감이다.
- **뼈와 힘줄.** 바늘, 실, 활줄, 연장 손잡이.
- **깃털.** 옷과 침구의 솜.

<a id="threat-grades"></a>

## 위협 등급

| 등급 | 이름 | 뜻 |
|---|---|---|
| 1 | 축냄 | 식량과 물건을 축낸다. 사람을 죽이지 않는다 |
| 2 | 해침 | 혼자 있는 사람을 다치게 하거나 병을 옮긴다 |
| 3 | 위험 | 작업조(3~6명)를 죽일 수 있다. 무장한 대응이 필요하다 |
| 4 | 큰 위험 | 무장한 분대가 맞서야 한다. 역 하나의 살림을 무너뜨릴 수 있다 |
| 5 | 피할 것 | 군대로도 이기기 어렵다. 만나지 않는 것이 대응이다 |

등급은 무리 하나를 한 번 만났을 때의 위협이다. 한 마리는 약해도 역의 식량이나 전선에 그보다 큰 해를 끼치는 무리는 따로 **살림 위협**을 적는다. 장부를 흐트러뜨리는 증표꾼에게는 **장부 위협**을 적는다.

<a id="threat-by-depth"></a>

## 깊이별 위협

역은 깊이에 따라 지상, 대합실, 승강장, 깊은 터널로 나뉜다. 위협을 말할 때는 두 곳을 더 센다. 역과 역 사이의 쓰지 않는 터널, 닫아 버린 출입구와 얼어붙은 위층, 눈 밑에 묻힌 옛 건물의 지하가 **버려진 구간**이다. 역 전체가 버려진 곳은 드물고, 버려진 것은 대개 역의 일부와 역 사이다. 서울 행정 경계 바깥 2~10 km의 띠가 **테두리**이고, 그 안쪽 0~2 km가 **앞마당**이다.

| 층 | 깊이 | 주로 만나는 무리 | 가장 큰 위협 |
|---|---|---|---|
| 지상, 역 둘레 | 출입구에서 수백 m | 큰부리까마귀(빛밭 지붕), 멧돼지(빛밭 둑), 들개(출입구), 왜가리·가마우지(강가 얼음 구멍) | 3 |
| 지상, 역에서 먼 곳 | 섬유 캐는 길, 바람틀 밭, 다리 | 들개 무리, 길목을 막는 사람 무리(G07, G09, G10, G12), 잠에서 깬 집게팔·돌봄바퀴·철골거미 | 4 |
| 대합실 | 지하 3~8 m | 들개(닫힌 출입구로 든다), 너구리, 사람 무리의 밤 습격 | 3 |
| 승강장 | 지하 8~25 m | 집쥐(섬유당 통, 버섯 굴, 전선), 너구리(환기 관로), 역 안에 섞여 든 사람(G08, G11) | 3, 살림 위협 4 |
| 깊은 터널 | 지하 25 m 아래 | 집쥐. 사는 역의 깊은 층은 가장 안전하다 | 2 |
| 버려진 구간 | 깊이를 가리지 않는다 | 멧돼지, 집쥐, 빈수레, 등불개미, 잠에서 깬 집게팔·돌봄바퀴·철골거미, 흘러든 그르렁이·우두커니, 사람 무리의 거처 | 4 |
| 서울 밖으로 나가는 선로 끝 | 경계 역 너머의 터널 | 굴막이, 땅두드리기 | 5 |
| 앞마당 | 경계 바깥 0~2 km | 외눈탑이 내려다본다. 흘러든 우두커니, 테두리꾼 | 4 |
| 테두리 | 경계 바깥 2~10 km | 외눈탑, 그르렁이, 불가사리, 땅두드리기, 도깨비불, 우두커니, 되뇌미, 철공룡 | 5 |

한 줄로 줄이면 이렇다. **사는 역 안에서는 깊을수록 안전하고, 역 밖에서는 멀수록 위험하다.** 사는 역 안의 위협은 대개 살림을 축내는 것이고, 목숨을 앗는 위협은 버려진 구간과 바깥에 있다.

<a id="threat-by-station"></a>

## 역의 자리별 위협

| 역의 자리 | 예 | 주된 위협 |
|---|---|---|
| 도심의 큰 환승역 | 서울역, 시청, 종로3가, 잠실, 신도림, 영등포 | 집쥐의 살림 위협, 증표꾼처럼 역 안에 섞여 든 사람 |
| 강가 역 | 구의, 뚝섬, 이촌, 노량진, 동작, 흑석, 잠실나루, 암사 | 왜가리·가마우지, 너구리, 다리를 타는 용산 말소자 |
| 산자락 역 | 북한산우이, 북한산보국문, 정릉, 도봉산, 수락산, 불암산, 아차산, 관악산 | 멧돼지, 보국문 테두리꾼 |
| 경계 역(정부) | 구파발, 독바위, 디지털미디어시티, 수색, 도봉산, 수락산, 불암산, 신내, 망우 | 상암 탈영병, 보국문 테두리꾼, 흘러든 그르렁이·우두커니, 선로 끝의 굴막이 |
| 경계 역(자유도시들) | 개화, 개화산, 김포공항, 방화, 온수, 오류동, 천왕, 개봉, 독산, 금천구청, 남태령, 관악산 | 금천 보증 잃은 손, 들개, 흘러든 그르렁이·우두커니, 선로 끝의 굴막이 |
| 경계 역(아크) | 청계산입구, 양재시민의숲, 대모산입구, 수서, 복정, 장지, 마천, 거여, 강일, 상일동 | 수서 꺼진 사람들, 흘러든 그르렁이·우두커니, 선로 끝의 굴막이 |

<a id="fibre-routes"></a>

## 섬유 캐는 길

섬유는 해마다 줄고, 섬유를 캐러 가는 길은 해마다 멀어진다. 이 길이 서울에서 사람이 가장 많이 죽는 길이다.

- **길이.** 2126년에 섬유 캐는 작업조는 역에서 눈 위로 1~3 km를 걸어, 묻힌 사무실과 창고의 2층 아래를 판다. 정부 도심은 아직 가깝고, 자유도시들과 아크는 멀다.
- **추위.** 가장 흔한 죽음은 짐승도 기계도 아닌 추위다. 눈보라를 만나 돌아오지 못한다.
- **잠든 기계.** 섬유가 많이 남은 곳은 대정전 전의 물류 창고, 병원, 짓다 만 건물이다. 그 지하에 집게팔, 돌봄바퀴, 철골거미가 잠들어 있다. 작업조가 불을 밝히려고 전지를 이으면 깨어난다.
- **사람.** 섬유 길목을 용산 말소자, 상암 탈영병, 금천 보증 잃은 손이 막고 통행세를 받는다.
- **들개.** 들개 무리가 무거운 짐을 진 작업조를 따라온다.

<a id="outside-polities"></a>

## 정체 밖의 사람들

세 정체는 사람을 붙잡아 두는 끈이 다르다. 그래서 끈이 끊어진 사람도 저마다 다르다.

| 정체 | 사람을 붙잡는 끈 | 끈이 끊어지는 일 | 끊어진 사람을 부르는 말 |
|---|---|---|---|
| 정부 | 장부. 기재된 역에서 기재된 일을 해야 배급을 받는다 | 기재된 역을 떠나면 말소된다. 벌로 말소되기도 한다 | 공문은 **말소자**, 입말은 "지워진 사람" |
| 자유도시들 | 계약과 보증. 누군가 보증을 서야 일감과 몫을 받는다 | 보증인이 보증을 거두거나, 계약을 깨거나, 보증 서 줄 작업대가 망한다 | **보증 잃은 손** |
| 아크 | 곁집과 정비대. 세례받은 몸은 정비와 충전에 닿아야 산다 | 교주의 말이나 곁집의 판정으로 정비 명단에서 빠진다. 스스로 떠나기도 한다 | **꺼진 사람**, 꺼진 몸 |

말소자는 강을 건너도 자유도시들에 쉽게 들지 못한다. 자유도시들은 보증 없는 사람에게 일감을 주지 않는다. 보증 잃은 손은 정부 장부에 오를 수 없다. 장부는 강 건너 사람을 사람으로 적지 않는다. 꺼진 사람은 어디서든 몸을 정비할 곳이 아크뿐이다. 그래서 세 정체 사이에 끼인 사람들이 무리를 짓는다. 그들이 G07~G12다.

이들은 짐승이나 기계가 아니라 사람이다. 말을 걸 수 있고, 거래할 수 있고, 다시 정체로 돌아갈 수도 있다.

<a id="machines"></a>

## 기계

| 갈래 | 무엇인가 | 무리 |
|---|---|---|
| 잠든 옛 기계 | 대정전 전 서울의 물류, 병원, 공사, 설비 기계. 전기가 끊겨 대부분 잠들었다. 사람이 묻힌 건물에 전기를 다시 넣거나 전지를 이으면 깨어나 백 년 전 일을 다시 한다. 그 일의 명단과 순서표에는 지금의 사람이 없다 | 집게팔, 빈수레, 돌봄바퀴, 철골거미, 등불개미 |
| 테두리 기계 | 대정전 무렵 사람이 쓰던 전쟁 기계. 사람이 내린 마지막 명령, 수도 봉쇄를 백 년째 지킨다. 서울 안으로 들어오지 않는다 | 외눈탑, 굴막이, 그르렁이, 불가사리, 땅두드리기, 도깨비불, 우두커니, 되뇌미, 철공룡 |
| 흘러든 기계 | 고장으로 자리를 잃고 서울 안 경계 역 둘레까지 흘러든 테두리 기계. 명령은 남았지만 지킬 자리를 모른다 | 대개 그르렁이, 우두커니 |
| 다시 살린 기계 | 사람이 고쳐 길들인 잠든 옛 기계와 흘러든 기계. 자유도시들과 아크가 가장 많이 가졌다 | 대개 빈수레, 철골거미, 등불개미 |

어느 갈래도 최초의 AI의 기계가 아니다. 바깥에서 기계에 사람이 죽어도 그것은 사람이 내린 명령의 결과이고, 최초의 AI가 죽인 것이 아니다.

잠든 옛 기계가 백 년을 버틴 것은 추위 덕이다. 언 지하에서는 녹이 느리고 기름이 굳을 뿐 썩지 않는다. 깨어난 기계가 오래 움직이지 못하는 것도 추위 탓이다. 굳은 관절과 닳은 전지로 몇 시간에서 며칠을 움직이다 다시 멈춘다. 다만 사람이 이어 준 전기에 계속 닿아 있으면 그 전기를 먹으며 일을 이어 간다.

### 건지는 것

기계에서 건지는 것은 서울에서 가장 귀한 물건이다. 테두리 기계에서 건지는 것은 목숨값이다.

| 건지는 것 | 어디서 | 누가 가장 원하나 |
|---|---|---|
| 동력 덩이 | 테두리 기계(그르렁이, 우두커니, 철공룡이 크다), 일부 옛 기계 | 아크(세례자의 충전과 정비), 자유도시들 |
| 움직이는 관절과 모터 | 모든 기계 | 자유도시들(바람틀, 펌프, 수차) |
| 눈(감지기와 렌즈) | 외눈탑, 그르렁이, 도깨비불, 우두커니 | 자유도시들, 정부군 |
| 전선과 구리 | 옛 기계, 등불개미 | 정부(옛 도심 고물과 함께), 자유도시들 |
| 장갑판 | 그르렁이, 우두커니, 철공룡 | 정부군, 아크 |
| 화기와 탄 | 그르렁이, 도깨비불, 우두커니의 무장 | 정부군. 세 정체가 모두 원한다 |
| 기록 장치 | 돌봄바퀴, 외눈탑, 되뇌미 | 정부(옛 기록), 아크 |

### 기계의 이름

역 사람들은 기계를 기계 이름으로 부르지 않는다. 생김새와 소리와 하는 일로 이름을 붙인다. 옛이야기에서 빌린 이름은 쇠를 먹는 짐승 불가사리와 도깨비불 둘뿐이고, 나머지는 모두 생김새나 쓰임에서 나왔다. 정체마다 공식 이름이 따로 있을 수 있지만, 이 도감은 서울 어디서나 통하는 입말 이름을 쓴다.

<a id="perimeter"></a>

## 테두리와 띠 너머

서울 행정 경계에서 바깥으로 나가며 세 겹이 있다.

| 겹 | 거리 | 무엇이 있나 |
|---|---|---|
| 앞마당 | 경계 바깥 0~2 km | 기계가 돌지 않는다. 외눈탑이 내려다보고, 흘러든 기계가 가끔 있다. 경계 바로 너머의 산마루와 그 위의 남은 죽은 숲, 테두리꾼의 길. 막이둑이 앞마당의 끝이다 |
| 테두리 | 2~10 km | 테두리 기계가 지키는 띠. 눈 덮인 위성 도시들, 묻힌 큰길, 부서진 기계의 잔해 밭 |
| 띠 너머 | 10 km 바깥 | 모른다 |

기계는 띠를 지킨다. 기계는 움직임과 열을 본다. 눈보라가 그 눈을 가리는 2~4일이 사람에게 유일한 창이다. 다만 땅두드리기는 눈보라 속에서도 듣는다.

띠를 넘는 사람은 테두리꾼, 세 정체가 몰래 보내는 건지기 작업조, 쫓겨 가는 사람이다. 앞마당에서 잔해를 건지는 작업조는 열에 하나둘이 돌아오지 못한다. 테두리 띠 안으로 넘어 들어간 사람은 열에 일고여덟이 돌아오지 못한다. 띠를 다 건너 띠 너머로 간 사람 가운데 돌아온 사람은 알려진 바 없다.

띠 너머에 관해 서울 사람이 아는 것은 다음뿐이다.

- 띠 너머에서 온 사람, 소식, 새가 백 년 동안 없었다. 철새도 오지 않는다.
- 띠의 기계는 서울 쪽으로 들어오지 않는다. 그 명령이 어디를 향해 있는지는 모른다.
- 되뇌미의 옛 방송은 "봉쇄"를 말한다. 무엇으로부터 무엇을 막는지는 말하지 않는다.

세 정체는 띠 너머를 저마다 다르게 말한다. 정부는 "서울 밖은 봉쇄 구역이다. 대한민국 정부는 여기 있다"고 말한다. 자유도시 사람은 "띠 너머는 계산이 안 된다. 갔다 온 사람이 없으니 값을 매길 수 없다"고 말한다. 아크는 "신은 겨울을 내렸을 뿐 기계를 부리지 않는다. 띠는 사람이 남긴 것이다"라고 가르친다.

띠 너머에도 역에 사는 사람들이 있다는 말, 띠 너머는 겨울이 덜하다는 말, 기계를 부리는 사람이 아직 살아 있다는 말이 경계 역에서 돈다. 모두 소문이다. 확인한 사람은 없다. 서울 밖의 더 자세한 사정은 [서울 밖과 테두리](/wiki/External-Theaters/)에 있다.

<a id="encounters"></a>

## 세력별 만남

| 무리 | 정부 | 자유도시들 | 아크 |
|---|---|---|---|
| G01 멧돼지 | 가장 자주 | 관악 | 드물다 |
| G02 큰부리까마귀 | 가장 자주 | 만난다 | 만난다 |
| G03 들개 | 북쪽 구 | 가장 자주 | 드물다 |
| G04 너구리 | 가장 자주 | 영등포 취수구 | 암사 |
| G05 집쥐 | 날마다 | 날마다 | 가장 자주 |
| G06 왜가리·가마우지 | 광진 | 드물다 | 가장 자주 |
| G07 용산 말소자 | 가장 자주 | 동작 | 없다 |
| G08 동대문 증표꾼 | 가장 자주 | 없다 | 없다 |
| G09 상암 탈영병 | 가장 자주 | 강서 | 없다 |
| G10 보국문 테두리꾼 | 가장 자주 | 드물다 | 사는 쪽 |
| G11 수서 꺼진 사람들 | 드물다 | 드물다 | 가장 자주 |
| G12 금천 보증 잃은 손 | 없다 | 가장 자주 | 드물다 |
| G13 집게팔 | 만난다 | 가장 자주 | 송파 |
| G14 빈수레 | 드물다 | 가장 자주 | 송파 |
| G15 돌봄바퀴 | 가장 자주 | 보라매병원 | 송파, 강동 |
| G16 철골거미 | 드물다 | 드물다 | 가장 자주 |
| G17 외눈탑 | 가장 자주 | 관악, 금천 | 만난다 |
| G18 굴막이 | 가장 자주 | 만난다 | 만난다 |
| G19 그르렁이 | 가장 자주 | 금천, 강서 | 만난다 |
| G20 불가사리 | 테두리꾼을 통해 | 드물다 | 사는 쪽 |
| G21 땅두드리기 | 만난다 | 만난다 | 만난다 |
| G22 도깨비불 | 만난다 | 가장 자주 | 만난다 |
| G23 우두커니 | 만난다 | 만난다 | 가장 자주(흘러든 것) |
| G24 되뇌미 | 만난다 | 만난다 | 만난다 |
| G25 등불개미 | 가장 자주 | 영등포 | 드물다 |
| G26 철공룡 | 은평, 도봉 | 가장 자주(강서) | 드물다 |

한 줄로 줄이면 이렇다. 정부는 사람이 많아 짐승과 말소자를 가장 많이 만나고, 자유도시들은 공장 터와 서쪽 벌판에서 옛 기계와 들개를 가장 많이 만나며, 아크는 깊은 건물에서 쥐와 철골거미를, 동남쪽 경계에서 꺼진 사람들과 흘러든 우두커니를 가장 많이 만난다.

세 정체가 이 무리들을 어떻게 대하는지는 [정부 사회](/wiki/Government-Society/), [자유도시들의 사회](/wiki/Free-City-Society/), [아크 사회](/wiki/Arc-Society/)에 있다.
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G01', 'G01 · Wild Boar', 'G01 · 멧돼지', 'bestiary', 1, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Animals

The largest wild animal in Seoul. Even so, it is smaller than the wild boar of before the Great Blackout. It sleeps in the abandoned basements of mountain-foot stations and comes up to the light-fields when the lights go out.

## At a glance

| Item | Detail |
|---|---|
| Kind | Animals |
| Threat | 3 (Danger). Charges in narrow places |
| Number in all of Seoul | 400-800 |
| Where it lives | Abandoned sections of mountain-foot stations, closed exits, buried basements |
| Polity that meets it most | The Government |
| What people get | Fat, hide, stiff bristles, meat |

## Where it came from

It is descended from the wild boar that lived on Bukhansan, Dobongsan, Suraksan, Buramsan, Achasan and Gwanaksan before the Great Blackout. When the forests died in the first winters, most of the boar died with them. Only the herds that went into the buried buildings and basements at the foot of the mountains survived.

## Where it lives

It lives in the abandoned sections of mountain-foot stations and in the closed exits beyond the concourse: around Bukhansan Ui, Bukhansan Bogungmun, Jeongneung, Dobongsan, Suraksan, Buramsan, Achasan and Gwanaksan. It sleeps in buried basements and at night comes up to the surface, where the light-fields are.

There are no boar on the snowfields more than 2 km from a station. Like every other wild animal, the boar lives off the stations'' heat, waste and light-fields.

## What it eats

- Turnip and cabbage from the light-fields. It digs through the snow banks heaped around them.
- The pits where fibre-sugar dregs are dumped.
- Wild mushrooms that grow by themselves in buried basements.
- Brown rats and frozen carcasses.

## The light halves and the boar

It gives birth at the start of the long-light half. It raids the light-fields most in the later half of the long-light half, when the light-field harvest comes in. It mates in the middle of the long-dark half. Then the males fight often and are at their fiercest, so meeting one in a tunnel is most dangerous then.

## How it moves

Sows and young form small herds; males go alone. Boar learn when people turn the lights on and when they turn them off, so they come to the light-fields after the lights go out. Met in a narrow tunnel, a boar does not turn back but charges.

At harvest time the light-fields of mountain-foot stations are guarded through the night. One oil lamp is left burning on the bank and two people take turns staying awake, because station people know a boar will not come while a light is lit.

## What changed in a hundred years

The boar of before the Great Blackout moved poorly in deep snow and did not live in burrows. Today''s boar use buried buildings and abandoned tunnels as sleeping places and paths. The surface lies under 6-8 m of snow, so only the herds that used holes and tunnels remained. Over a hundred years, roughly fifty generations of enduring hunger and cold, their bodies grew smaller and their coats longer.

## The danger

In narrow places it charges people and breaks legs. In one night it ruins a light-field bay. For station people a ruined light-field hurts longer than a broken leg: one light-field bay is several months of greens.

## What people get

- **Fat.** It becomes oil lamps and tallow candles. The fat of one boar is a small station''s oil-lamp share for a month.
- **Hide.** Boots and gloves. Boar hide, together with raccoon-dog fur, is the warmest clothing material in Seoul.
- **Stiff bristles.** Brushes for cleaning heat exchangers and flues.
- **Bone and sinew.** Needles, thread, bowstrings, tool handles.
- **Meat.** But all wild-animal hunting together is only about 0.2% of the calories Seoul''s people eat. The boar is not valued for its meat.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Meets it most often: Gangbuk, Seongbuk, Dobong, Nowon and Gwangjin, at the foot of Bukhansan, Dobongsan, Suraksan, Buramsan and Achasan |
| Free Cities | Gwanak, at the foot of Gwanaksan |
| Arc | Rare |

## See also

- [Hostile Ecology Compendium: thaw-pocket ecology](/wiki/Hostile-Ecology-Index/#thaw-pocket)
- [Hostile Ecology Compendium: threat levels](/wiki/Hostile-Ecology-Index/#threat-grades)
- [Meals and Food](/wiki/Food-Culture/)
- [G04 · Raccoon Dog](/wiki/Hostile-Group-G04/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 짐승

서울에서 가장 큰 들짐승이다. 그래도 대정전 전의 멧돼지보다 작다. 산자락 역의 버려진 지하에서 자고, 불이 꺼지면 빛밭으로 올라온다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 짐승 |
| 위협 | 3 (위험). 좁은 곳에서 들이받는다 |
| 서울 전체의 수 | 400~800 마리 |
| 사는 곳 | 산자락 역의 버려진 구간, 닫힌 출입구, 묻힌 건물의 지하 |
| 가장 자주 만나는 정체 | 정부 |
| 사람이 얻는 것 | 기름, 가죽, 뻣뻣한 털, 고기 |

## 어디서 왔나

대정전 전 북한산, 도봉산, 수락산, 불암산, 아차산, 관악산에 살던 멧돼지의 후손이다. 첫 겨울들에 숲이 죽자 멧돼지도 대부분 함께 죽었다. 산자락의 묻힌 건물과 지하로 들어간 무리만 살아남았다.

## 어디에 사나

산자락 역의 버려진 구간과 대합실 바깥의 닫힌 출입구에 산다. 북한산우이, 북한산보국문, 정릉, 도봉산, 수락산, 불암산, 아차산, 관악산 둘레다. 잠자리는 묻힌 건물의 지하이고, 밤이면 빛밭이 있는 지상으로 나온다.

역에서 2 km를 넘게 떨어진 눈 벌판에는 멧돼지가 없다. 멧돼지도 다른 들짐승처럼 역의 열과 찌꺼기와 빛밭에 기대 산다.

## 무엇을 먹나

- 빛밭의 순무와 배추. 빛밭 둘레에 쌓은 눈 둑을 파고 든다.
- 섬유당 찌꺼기를 버리는 구덩이.
- 묻힌 건물 지하에 저절로 핀 들버섯.
- 집쥐와 언 주검.

## 빛의 철과 멧돼지

긴 낮 철 첫머리에 새끼를 낳는다. 빛밭 수확이 몰리는 긴 낮 철 뒤쪽 절반에 빛밭을 가장 많이 턴다. 긴 밤 철 한가운데에 짝을 짓는다. 이때 수컷끼리 싸움이 잦고 수컷이 가장 사나워서, 터널에서 마주치면 가장 위험하다.

## 어떻게 움직이나

암컷과 새끼가 작은 무리를 이루고, 수컷은 혼자 다닌다. 멧돼지는 사람이 불을 켜는 시간과 끄는 시간을 배운다. 그래서 불이 꺼진 뒤에 빛밭으로 온다. 좁은 터널에서 사람과 마주치면 돌아서지 않고 들이받는다.

산자락 역의 빛밭은 수확 철이면 밤에도 사람이 지킨다. 둑 위에 기름등 하나를 켜 두고 둘이 번갈아 깨어 있는다. 멧돼지가 불이 켜진 동안에는 오지 않는다는 것을 역 사람들이 알기 때문이다.

## 백 년 동안 달라진 것

대정전 전의 멧돼지는 깊은 눈에서 잘 움직이지 못했고 땅굴에 살지 않았다. 지금의 멧돼지는 묻힌 건물과 버려진 터널을 잠자리와 길로 쓴다. 지상이 6~8 m 눈 밑이라 굴과 터널을 쓴 무리만 남은 것이다. 백 년, 대략 오십 세대 동안 굶주림과 추위를 견디는 사이 몸은 작아지고 털은 길어졌다.

## 위험

좁은 곳에서 사람을 들이받아 다리를 부러뜨린다. 하룻밤에 빛밭 한 칸을 망친다. 역 사람에게는 다리가 부러진 사람보다 망친 빛밭이 더 오래 아프다. 빛밭 한 칸은 몇 달 치 채소다.

## 사람이 얻는 것

- **기름.** 기름등과 기름초가 된다. 멧돼지 한 마리의 기름이 작은 역 한 곳의 한 달 기름등 몫이다.
- **가죽.** 장화와 장갑. 멧돼지 가죽은 너구리 털과 함께 서울에서 가장 따뜻한 옷감이다.
- **뻣뻣한 털.** 열 교환기와 굴뚝을 닦는 솔.
- **뼈와 힘줄.** 바늘, 실, 활줄, 연장 손잡이.
- **고기.** 다만 서울 사람 끼니에서 들짐승 사냥이 차지하는 몫은 모두 합쳐도 열량의 약 0.2%다. 멧돼지가 귀한 것은 고기 때문이 아니다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 가장 자주 만난다. 북한산, 도봉산, 수락산, 불암산, 아차산 자락의 강북, 성북, 도봉, 노원, 광진 |
| 자유도시들 | 관악산 자락의 관악 |
| 아크 | 드물다 |

## 함께 읽기

- [적대 생태 도감: 녹은 주머니 생태](/wiki/Hostile-Ecology-Index/#thaw-pocket)
- [적대 생태 도감: 위협 등급](/wiki/Hostile-Ecology-Index/#threat-grades)
- [끼니와 먹거리](/wiki/Food-Culture/)
- [G04 · 너구리](/wiki/Hostile-Group-G04/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G02', 'G02 · Large-billed Crow', 'G02 · 큰부리까마귀', 'bestiary', 2, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Animals

The living thing most often seen on Seoul''s surface. It eats anything, learns, and hides spare food in the snow. It hardly ever harms people, but it pecks light-field roofs to pieces.

## At a glance

| Item | Detail |
|---|---|
| Kind | Animals |
| Threat | 1 (Nuisance). In the nesting time it dives at people who come near |
| Number in all of Seoul | 15,000-25,000 |
| Where it lives | Surface: around station exits and exhaust shafts, on the tops of buried buildings, on wind-machine masts on the bridges |
| Polity that meets it most | The Government. All three polities meet it |
| What people get | Feathers, eggs, a little meat. And a warning |

## Where it came from

A resident bird that lived in Seoul before the Great Blackout. It eats anything, learns, and hides food, so it outlasted the winter. Even before the Great Blackout, birds of this kind lived off human settlements in lands of tens of degrees below zero.

## Where it lives

It lives on the surface. It perches around station exits and exhaust shafts, on the tops of buried buildings that stick out of the snow, and on the wind-machine masts on the bridges. At night it roosts together around the exhaust shafts above the concourse, where stove smoke comes out and it is warm.

It is most numerous in the Government''s fourteen districts, which have the widest light-fields. The only things living on the snowfields more than 2 km from a station are birds, and those birds are mostly large-billed crows.

## What it eats

- Waste dumped on the surface.
- Sprouts and insects in the light-fields.
- Frozen carcasses. Animals that froze to death, and animals stopped by perimeter machines, do not rot in the cold and feed scavengers for a long time.
- Fish scraps around the ice holes.
- Young brown rats.

## The light halves and the crow

It lays eggs at the start of the long-light half and is fierce around the nest then. In the long-dark half it roosts in flocks around the exhaust shafts.

## How it moves

A pair guards a nest; young birds that do not nest go about in large flocks. It hides spare food in the snow.

Flocks learn from each other how to peck holes in light-field roofs. Once one station''s roofs are holed, the roofs of the next station are soon holed too. It also follows work parties and waits for the leavings of a kill.

Crows gather where perimeter machines have stopped animals. So perimeter-runners say, "Where the crows sit, there is a machine."

## What changed in a hundred years

Before the Great Blackout the large-billed crow nested in trees. Since the trees died it nests around station exhaust shafts, on the tops of buried buildings and on wind-machine masts. The warm air of the exhaust shafts protects the eggs.

## The danger

It hardly ever harms people. Its greatest harm is damage to light-field roofs. When a roof is holed, the bay''s heat escapes and the sprouts freeze. In the nesting time of the long-light half it dives at people who come near its nest.

## What people get

- **Feathers.** Padding for clothes and bedding.
- **Eggs.** Only at the start of the long-light half.
- **A little meat.**
- **A warning.** A flock taking off all at once is a surface work party''s first alarm. When a pack of feral dogs or a band of people comes near, the crows know first.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Meets it most often. It has the widest light-fields |
| Free Cities | Meet it |
| Arc | Meets it |

## See also

- [Hostile Ecology Compendium: thaw-pocket ecology](/wiki/Hostile-Ecology-Index/#thaw-pocket)
- [G10 · Bogungmun Perimeter-Runners](/wiki/Hostile-Group-G10/)
- [Meals and Food](/wiki/Food-Culture/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 짐승

서울 지상에서 가장 흔히 보는 산 것이다. 무엇이든 먹고, 배우고, 남는 먹이를 눈 속에 숨긴다. 사람을 거의 해치지 않지만 빛밭 지붕을 쪼아 망가뜨린다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 짐승 |
| 위협 | 1 (축냄). 둥지 철에는 다가오는 사람을 덮친다 |
| 서울 전체의 수 | 1만 5천~2만 5천 마리 |
| 사는 곳 | 지상. 역 출입구와 배기 굴 둘레, 묻힌 건물 꼭대기, 다리 위 바람틀 기둥 |
| 가장 자주 만나는 정체 | 정부. 세 정체가 모두 만난다 |
| 사람이 얻는 것 | 깃털, 알, 적은 고기. 그리고 경보 |

## 어디서 왔나

대정전 전부터 서울에 살던 텃새다. 무엇이든 먹고, 배우고, 먹이를 숨겨 두는 새라 겨울을 견뎠다. 대정전 전에도 이 무리의 새들은 영하 수십 도의 땅에서 사람 마을 둘레에 기대 살았다.

## 어디에 사나

지상에 산다. 역 출입구와 배기 굴 둘레, 눈 밖으로 나온 묻힌 건물 꼭대기, 다리 위 바람틀 기둥에 앉는다. 밤에는 대합실 위 배기 굴 둘레에 모여 잔다. 화덕 배기가 나오는 곳이라 따뜻하다.

빛밭이 가장 넓은 정부 열네 구에 가장 많다. 역에서 2 km를 넘게 떨어진 눈 벌판에 사는 것은 새뿐인데, 그 새가 대개 큰부리까마귀다.

## 무엇을 먹나

- 지상에 버린 찌꺼기.
- 빛밭의 싹과 벌레.
- 언 주검. 얼어 죽은 짐승, 테두리 기계가 멈춰 세운 짐승은 추위 속에서 썩지 않아 오래 먹이가 된다.
- 얼음 구멍 둘레의 물고기 찌꺼기.
- 어린 집쥐.

## 빛의 철과 까마귀

긴 낮 철 첫머리에 알을 낳는다. 그때는 둥지 둘레에서 사납다. 긴 밤 철에는 무리를 지어 배기 굴 둘레에 모여 잔다.

## 어떻게 움직이나

한 쌍이 둥지를 지키고, 둥지를 짓지 않는 어린 새들은 큰 무리로 다닌다. 남는 먹이를 눈 속에 숨긴다.

까마귀는 빛밭 지붕을 쪼아 구멍을 내는 법을 무리끼리 배운다. 한 역의 지붕이 뚫리면 이웃 역의 지붕도 곧 뚫린다. 작업조를 따라가 사냥감의 찌꺼기를 기다리기도 한다.

까마귀는 테두리 기계가 짐승을 멈춰 세운 자리에 모인다. 그래서 테두리꾼은 "까마귀가 앉은 곳에 기계가 있다"고 말한다.

## 백 년 동안 달라진 것

대정전 전의 큰부리까마귀는 나무에 둥지를 지었다. 나무가 죽은 뒤로는 역 배기 굴 둘레, 묻힌 건물 꼭대기, 바람틀 기둥에 짓는다. 배기 굴의 따뜻한 공기가 알을 지킨다.

## 위험

사람을 거의 해치지 않는다. 가장 큰 해는 빛밭 지붕을 망가뜨리는 것이다. 지붕에 구멍이 나면 그 칸의 열이 빠져나가고 싹이 언다. 긴 낮 철 둥지 철에는 둥지에 다가오는 사람을 덮친다.

## 사람이 얻는 것

- **깃털.** 옷과 침구의 솜.
- **알.** 긴 낮 철 첫머리에만 난다.
- **적은 고기.**
- **경보.** 까마귀가 한꺼번에 날아오르는 것이 지상 작업조의 첫 경보다. 들개 무리나 사람 무리가 다가오면 까마귀가 먼저 안다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 가장 자주 만난다. 빛밭이 가장 넓다 |
| 자유도시들 | 만난다 |
| 아크 | 만난다 |

## 함께 읽기

- [적대 생태 도감: 녹은 주머니 생태](/wiki/Hostile-Ecology-Index/#thaw-pocket)
- [G10 · 보국문 테두리꾼](/wiki/Hostile-Group-G10/)
- [끼니와 먹거리](/wiki/Food-Culture/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G03', 'G03 · Feral Dogs', 'G03 · 들개', 'bestiary', 3, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Animals

Descended from house dogs abandoned at the Great Blackout. For a hundred years they have never left people''s side. So they are the animal that knows people best, and they can tell when a person is tiring.

## At a glance

| Item | Detail |
|---|---|
| Kind | Animals |
| Threat | 3 (Danger). A pack will kill a lone person |
| Number in all of Seoul | 2,000-4,000, in 150-250 packs |
| Where it lives | Closed exits in the concourse, basements of buried factories and warehouses, abandoned sections |
| Polity that meets it most | The Free Cities |
| What people get | Tamed dogs, fur |

## Where it came from

At the Great Blackout, when people went down into the stations, they could not take their house dogs. The abandoned dogs never left people''s side and lived around the stations. Their descendants are today''s feral dogs. Over the hundred years some have been tamed again.

## Where it lives

It lives in the closed exits of the concourse, the basements of buried factories and warehouses, and the abandoned sections. Packs are dense around Guro, Gasan Digital Complex and Doksan, the Free Cities'' factory grounds, and in Dobong, Nowon and Jungnang, the Government''s northern districts.

## What it eats

- Brown rats and raccoon dogs.
- Frozen carcasses.
- Waste dumped on the surface.
- Loads carried by people travelling alone.

## How it moves

Packs of about ten. No single dog always leads; an old dog picks the way.

Feral dogs can tell when people are tiring under a load. On the fibre-mining routes they follow a party carrying heavy loads at a distance, and when one person falls behind, they close on that person.

Feral dogs have no light half of their own. But in the hungry long-dark half they come close to the exits. They come down the vertical shafts of closed exits as far as the concourse.

## The danger

A pack will kill a lone person. A work party can fight back but loses its loads. A party whose loads were taken by feral dogs on a fibre route goes home empty-handed. What a party fears more than the dogs is going home empty-handed.

## Tamed dogs

Some feral dogs have been tamed again. Among the Free Cities, the station crews around Gangseo''s Wind Keeper and Guro''s Works Master use dogs for sleds and watch. Between Gangseo''s wind-machine fields and along the edge of the Han ice, dog sleds pull loads.

A tamed dog notices a feral pack first and barks. Feral-dog fur is also used.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Northern districts (Dobong, Nowon, Jungnang) |
| Free Cities | Meet it most often: Guro, Geumcheon, Gangseo |
| Arc | Rare |

## See also

- [Hostile Ecology Compendium: the fibre-mining routes](/wiki/Hostile-Ecology-Index/#fibre-routes)
- [Free City Society](/wiki/Free-City-Society/)
- [G05 · Brown Rat](/wiki/Hostile-Group-G05/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 짐승

대정전 때 버려진 집개의 후손이다. 백 년 동안 사람 곁을 떠나지 않았다. 그래서 사람을 가장 잘 아는 짐승이고, 사람이 지쳐 가는 것을 알아본다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 짐승 |
| 위협 | 3 (위험). 무리는 혼자인 사람을 죽인다 |
| 서울 전체의 수 | 2,000~4,000 마리, 무리로는 150~250 |
| 사는 곳 | 대합실의 닫힌 출입구, 묻힌 공장과 창고의 지하, 버려진 구간 |
| 가장 자주 만나는 정체 | 자유도시들 |
| 사람이 얻는 것 | 길든 개, 털가죽 |

## 어디서 왔나

대정전 때 사람들은 역으로 내려가면서 집개를 데려가지 못했다. 버려진 개들은 사람 곁을 떠나지 않고 역 둘레에서 살았다. 그 후손이 지금의 들개다. 일부는 백 년 사이에 다시 사람에게 길들었다.

## 어디에 사나

대합실의 닫힌 출입구, 묻힌 공장과 창고의 지하, 버려진 구간에 산다. 자유도시들의 공장 터인 구로, 가산디지털단지, 독산 둘레와, 정부의 북쪽 구인 도봉, 노원, 중랑에 무리가 짙다.

## 무엇을 먹나

- 집쥐와 너구리.
- 언 주검.
- 지상에 버린 찌꺼기.
- 혼자 다니는 사람이 진 짐.

## 어떻게 움직이나

열 마리 안팎이 무리를 짓는다. 늘 이끄는 한 마리는 없고, 나이 든 개가 길을 고른다.

들개는 사람이 짐을 지고 지쳐 가는 것을 알아본다. 섬유 캐는 길에서 무거운 짐을 진 작업조를 멀찍이 따라오다가, 한 사람이 뒤처지면 그 사람에게 붙는다.

들개에게는 빛의 철이 따로 없다. 다만 굶주린 긴 밤 철에는 출입구 가까이 온다. 닫힌 출입구의 세로 굴로 내려와 대합실까지 든다.

## 위험

무리는 혼자인 사람을 죽인다. 작업조는 맞설 수 있지만 짐을 잃는다. 섬유 캐는 길에서 들개에게 짐을 빼앗긴 작업조는 빈손으로 돌아간다. 작업조가 들개보다 두려워하는 것은 그 빈손이다.

## 길든 개

들개의 일부는 다시 사람에게 길들었다. 자유도시들 가운데 강서의 바람지기와 구로의 공장장 둘레의 역반은 개를 썰매와 파수에 쓴다. 강서의 바람틀 밭 사이와 한강 얼음 가장자리에서는 개썰매가 짐을 끈다.

길든 개는 들개 무리를 먼저 알아채고 짖는다. 들개 털가죽도 쓴다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 북쪽 구(도봉, 노원, 중랑) |
| 자유도시들 | 가장 자주 만난다. 구로, 금천, 강서 |
| 아크 | 드물다 |

## 함께 읽기

- [적대 생태 도감: 섬유 캐는 길](/wiki/Hostile-Ecology-Index/#fibre-routes)
- [자유도시들의 사회](/wiki/Free-City-Society/)
- [G05 · 집쥐](/wiki/Hostile-Group-G05/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G04', 'G04 · Raccoon Dog', 'G04 · 너구리', 'bestiary', 4, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Animals

An animal that lives inside the ducts of riverside stations. It sleeps through most of the long-dark half. Its fur is the warmest and lightest in Seoul. Its bite can kill.

## At a glance

| Item | Detail |
|---|---|
| Kind | Animals |
| Threat | 2 (Harm). Carries rabies and mange |
| Number in all of Seoul | 3,000-5,000 |
| Where it lives | Old conduits, ventilation ducts and intakes of riverside stations |
| Polity that meets it most | The Government |
| What people get | Fur, fat |

## Where it came from

Descended from the raccoon dogs of the Korean peninsula. The raccoon dog is one of the few members of the dog family that sleeps deeply in winter, and it eats anything. These two traits carried it through the winter.

## Where it lives

It lives in the old conduits, ventilation ducts and intakes of riverside stations: Guui, Ttukseom and Seoul Forest on the Government side, Amsa on the Arc side, and around the Yeongdeungpo intake on the Free Cities'' side. It digs dens inside the ducts between the concourse and the platform.

## What it eats

- Fibre-sugar dregs.
- Larvae escaped from the insect vats.
- Fish scraps at the riverside.
- Brown rats.
- Light-field leavings.

## The light halves and the raccoon dog

In the long-light half it is awake, eating and putting on fat. It sleeps most of the long-dark half, a little over four months, inside the ducts. Raccoon dogs at the start of the long-dark half, just before they sleep, carry the most fat, and raccoon-dog hunting is concentrated then too.

## How it moves

It lives in pairs. When it meets people it usually runs or plays dead. So people who go into a duct to repair it do not pick up a dead raccoon dog: a raccoon dog playing dead bites the hand.

## What changed in a hundred years

Before the Great Blackout the raccoon dog slept something close to hibernation only for a few months of midwinter. Now that winter does not end, it sleeps most of the long-dark half. Only the raccoon dogs awake in the long-light half, when food is most plentiful, survived.

## The danger

The raccoon dog carries rabies. Even before the Great Blackout it was the main wild carrier of rabies in Korea. It also carries mange.

Few people are bitten to death by raccoon dogs inside the ducts. But people bitten by a rabid raccoon dog usually die, because the medicine to treat them is scarce. That medicine too mostly comes out of buried hospitals, and in the basements of buried hospitals the [care wheels](/wiki/Hostile-Group-G15/) sleep.

## What people get

- **Fur.** The warmest and lightest fur in Seoul, so it is dear.
- **Fat.** Together with boar fat it becomes oil lamps and tallow candles.
- **Bone and sinew.** Needles and thread.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Meets it most often: around the Guui and Ttukdo intakes in Gwangjin and Seongdong |
| Free Cities | The Yeongdeungpo intake |
| Arc | Amsa |

## See also

- [Ailments of the Cold](/wiki/Ailments/)
- [G15 · Care Wheels](/wiki/Hostile-Group-G15/)
- [G06 · Herons and Cormorants](/wiki/Hostile-Group-G06/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 짐승

강가 역의 관로 속에 사는 짐승이다. 긴 밤 철의 대부분을 잔다. 털은 서울에서 가장 따뜻하고 가볍다. 물리면 죽을 수 있다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 짐승 |
| 위협 | 2 (해침). 광견병과 옴을 옮긴다 |
| 서울 전체의 수 | 3,000~5,000 마리 |
| 사는 곳 | 강가 역의 옛 관로, 환기 관로, 취수구 둘레 |
| 가장 자주 만나는 정체 | 정부 |
| 사람이 얻는 것 | 털가죽, 기름 |

## 어디서 왔나

한반도 너구리의 후손이다. 너구리는 갯과 짐승 가운데 드물게 겨울에 깊은 잠을 자는 짐승이고, 무엇이든 먹는다. 이 두 성질이 너구리를 겨울에서 살렸다.

## 어디에 사나

강가 역의 옛 관로, 환기 관로, 취수구 둘레에 산다. 정부 쪽은 구의, 뚝섬, 서울숲, 아크 쪽은 암사, 자유도시들 쪽은 영등포 취수구 둘레다. 대합실과 승강장 사이의 관로 속에 굴을 판다.

## 무엇을 먹나

- 섬유당 찌꺼기.
- 벌레 통에서 빠져나간 애벌레.
- 강가의 물고기 찌꺼기.
- 집쥐.
- 빛밭 찌꺼기.

## 빛의 철과 너구리

긴 낮 철에 깨어 먹고 살을 찌운다. 긴 밤 철의 대부분, 넉 달 남짓을 관로 속에서 잔다. 잠들기 직전인 긴 밤 철 들머리의 너구리가 기름이 가장 많다. 너구리 사냥도 그때 몰린다.

## 어떻게 움직이나

짝을 지어 산다. 사람과 마주치면 대개 달아나거나 죽은 척한다. 그래서 관로를 고치러 들어간 사람은 죽은 너구리를 집어 들지 않는다. 죽은 척하는 너구리가 손을 문다.

## 백 년 동안 달라진 것

대정전 전의 너구리는 한겨울 몇 달 동안만 겨울잠에 가까운 잠을 잤다. 겨울이 끝나지 않는 지금은 긴 밤 철 대부분을 잔다. 먹이가 몰리는 긴 낮 철에 깨어 있는 너구리만 살아남았다.

## 위험

너구리는 광견병을 옮긴다. 대정전 전에도 너구리는 한국에서 광견병을 옮기는 주된 들짐승이었다. 옴도 옮긴다.

관로 속에서 너구리에게 물려 죽는 사람은 드물다. 그러나 미친 너구리에게 물린 사람은 대개 죽는다. 치료할 약이 귀하기 때문이다. 그 약도 대개 묻힌 병원에서 나오고, 묻힌 병원 지하에는 [돌봄바퀴](/wiki/Hostile-Group-G15/)가 잠들어 있다.

## 사람이 얻는 것

- **털가죽.** 서울에서 가장 따뜻하고 가벼운 털이라 값이 비싸다.
- **기름.** 멧돼지 기름과 함께 기름등과 기름초가 된다.
- **뼈와 힘줄.** 바늘과 실.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 가장 자주 만난다. 광진과 성동의 구의, 뚝도 취수구 둘레 |
| 자유도시들 | 영등포 취수구 |
| 아크 | 암사 |

## 함께 읽기

- [추위의 병](/wiki/Ailments/)
- [G15 · 돌봄바퀴](/wiki/Hostile-Group-G15/)
- [G06 · 왜가리·가마우지](/wiki/Hostile-Group-G06/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G05', 'G05 · Brown Rat', 'G05 · 집쥐', 'bestiary', 5, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Animals

The most numerous animal in Seoul. One rat hardly ever harms a person. But by spoiling one row of fibre-sugar vats or one cable it shakes a whole station''s livelihood. All three polities meet it every day.

## At a glance

| Item | Detail |
|---|---|
| Kind | Animals |
| Threat | 2 (Harm). Livelihood threat 4 |
| Number in all of Seoul | 400,000-600,000 |
| Where it lives | The platform layer and deep tunnels of every living station, and every abandoned section |
| Polity that meets it most | The Arc. All three polities meet it every day |
| What people get | Meat, skins, the price of rat tails |

## Where it came from

The brown rat that lived in the subway and the sewers before the Great Blackout. The platform layer of a warm station with food in it became a better place for rats than before the Great Blackout. When people came down into the stations, the rats were already there.

## Where it lives

It lives in the platform layer and deep tunnels of every living station, and in every abandoned section. It is densest in the stations of the Arc''s four districts, warm and full of deep buildings: Samseong, Seolleung, Suseo, Jamsil, Garak Market and Cheonho. It is also dense in the large downtown transfer stations: Seoul Station, City Hall, Jongno 3-ga, Jamsil, Sindorim and Yeongdeungpo.

In the deep tunnels of a living station, the brown rat is almost the only threat one meets. The deep layer is the safest place in a station, but it is not a place without rats.

## What it eats

- Fibre-sugar vats and sugar water.
- Mushroom cellars.
- Insect vats.
- Kitchen scraps.
- Cable insulation. It does not eat it; it gnaws it.

## How it moves

It breeds all year, regardless of the light halves. Its burrows and runs move with the food. No rat always leads.

Within a few generations rats avoid the places where people set traps. So rat-catchers change their trap places often and tell no one where they are.

## The danger

One rat hardly ever harms a person. But it spreads haemorrhagic fever with renal syndrome. One of the viruses that cause it has been called Seoul virus since before the Great Blackout, and brown rats carry it.

What makes the rat truly fearsome is that it eats into a station''s livelihood.

- Spoiling one row of fibre-sugar vats wipes out several days of meals for hundreds of station people.
- Gnawed cables stop a station''s lights and heat pumps.
- In the Arc, rats gnawing the baptized''s charging cables are a great worry. A baptized body lives only while it reaches charging.

## What people get

- **Meat.** Meat for poor households.
- **Skins.** They become glove linings.
- **The price of rat tails.** The Government exchanges rat tails for a few squares of ration coupon.

Rat-catching is one of the trades handed down in all three polities.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Meets it every day |
| Free Cities | Meet it every day |
| Arc | Meets it most often: the deep buildings |

## See also

- [Hostile Ecology Compendium: threat by depth](/wiki/Hostile-Ecology-Index/#threat-by-depth)
- [Inside a Station](/wiki/Station-Interior-Construction/)
- [Ailments of the Cold](/wiki/Ailments/)
- [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 짐승

서울에서 가장 많은 짐승이다. 한 마리는 사람을 거의 해치지 않는다. 그러나 섬유당 통 한 줄과 전선 한 가닥을 망쳐 역 하나의 살림을 흔든다. 세 정체가 모두 날마다 만난다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 짐승 |
| 위협 | 2 (해침). 살림 위협 4 |
| 서울 전체의 수 | 40만~60만 마리 |
| 사는 곳 | 모든 사는 역의 승강장 층과 깊은 터널, 버려진 구간 전부 |
| 가장 자주 만나는 정체 | 아크. 세 정체가 모두 날마다 만난다 |
| 사람이 얻는 것 | 고기, 가죽, 쥐 꼬리 값 |

## 어디서 왔나

대정전 전부터 지하철과 하수도에 살던 시궁쥐다. 따뜻하고 먹을 것이 있는 역의 승강장 층은 집쥐에게 대정전 전보다 나은 곳이 됐다. 사람이 역으로 내려왔을 때 쥐는 이미 거기 있었다.

## 어디에 사나

모든 사는 역의 승강장 층과 깊은 터널, 그리고 버려진 구간 전부에 산다. 깊은 건물이 많고 따뜻한 아크 네 구의 역에 가장 짙다. 삼성, 선릉, 수서, 잠실, 가락시장, 천호다. 도심의 큰 환승역인 서울역, 시청, 종로3가, 잠실, 신도림, 영등포에도 짙다.

사는 역의 깊은 터널에서 만나는 위협은 거의 집쥐 하나다. 깊은 층은 역에서 가장 안전한 곳이지만, 쥐가 없는 곳은 아니다.

## 무엇을 먹나

- 섬유당 통과 당물.
- 버섯 굴.
- 벌레 통.
- 부엌 찌꺼기.
- 전선 껍질. 먹는 것이 아니라 갉는다.

## 어떻게 움직이나

빛의 철을 가리지 않고 한 해 내내 새끼를 친다. 굴과 길이 먹이를 따라 옮긴다. 늘 이끄는 쥐는 없다.

쥐는 사람이 덫을 놓는 자리를 몇 세대 안에 피한다. 그래서 쥐잡이는 덫 놓는 자리를 자주 바꾸고, 그 자리를 아무에게도 가르쳐 주지 않는다.

## 위험

한 마리는 사람을 거의 해치지 않는다. 다만 신증후군출혈열을 옮긴다. 이 병을 일으키는 바이러스 가운데 하나는 대정전 전부터 서울 바이러스라는 이름으로 불렸고, 시궁쥐가 옮긴다.

쥐가 정말 무서운 것은 살림을 축내기 때문이다.

- 섬유당 통 한 줄을 망치면 역 사람 수백 명의 몇 날 끼니가 사라진다.
- 전선을 갉아 역의 불과 열 펌프를 멈춘다.
- 아크에서는 세례자의 충전 전선을 갉는 것이 큰 걱정이다. 세례받은 몸은 충전에 닿아야 산다.

## 사람이 얻는 것

- **고기.** 가난한 집의 고기다.
- **가죽.** 장갑 안감이 된다.
- **쥐 꼬리 값.** 정부는 쥐 꼬리를 배급 증표 몇 칸과 바꿔 준다.

쥐잡이는 세 정체 모두에서 대물려 이어지는 일 가운데 하나다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 날마다 만난다 |
| 자유도시들 | 날마다 만난다 |
| 아크 | 가장 자주 만난다. 깊은 건물 |

## 함께 읽기

- [적대 생태 도감: 깊이별 위협](/wiki/Hostile-Ecology-Index/#threat-by-depth)
- [역 안으로](/wiki/Station-Interior-Construction/)
- [추위의 병](/wiki/Ailments/)
- [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G06', 'G06 · Herons and Cormorants', 'G06 · 왜가리·가마우지', 'bestiary', 6, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Animals

Birds that live only where the water is open on the frozen Han. They do not harm people. They go after the same fish as people, and they show people where the water is open.

## At a glance

| Item | Detail |
|---|---|
| Kind | Animals |
| Threat | 1 (Nuisance). Competes for fish and clogs intake screens |
| Number in all of Seoul | 300-500 |
| Where it lives | The surface at the riverside: where the ice is open, and on bridge structures |
| Polity that meets it most | The Arc |
| What people get | Feathers, a little meat, where the water is open |

## Where it came from

The grey herons and great cormorants that wintered on the Han before the Great Blackout. These birds wintered in Korea wherever there was unfrozen water. When the river froze most of them died; they survived only around open water.

## Where it lives

It lives on the surface at the riverside. The Han is frozen 2-4 m thick, and the ice is open in only a few places.

- Below the Jamsil underwater weir. The water wheel stirs the water, so it always stays a little open. It is the widest open water in Seoul.
- Around the Guui, Ttukdo, Yeongdeungpo and Amsa intakes.
- The ice holes people cut.

They nest on bridge structures. They are most numerous around Jamsillaru, Gangbyeon and Amsa.

## What it eats

Crucian carp and common carp. The fish under Seoul''s ice are almost all crucian and common carp. Crucian carp can last for months even in water under ice where the oxygen has run out, so they remained even under ice where the river shrinks and no light comes in.

## The light halves and the birds

In the long-light half they nest on bridge structures. In the long-dark half they gather around open water.

## How it moves

They wait around people''s ice holes and snatch the catch. Cormorants dive into the open water as far as the intake screens.

## What changed in a hundred years

Before the Great Blackout many of these birds moved between lands with the seasons. Now only birds that never leave Seoul remain. No migrating birds arrive. That no bird has flown in from beyond the band in a hundred years is one of the things people at the boundary stations say most often.

## The danger

They do not harm people. They compete with people for fish, and their droppings clog the intake screens. When a screen clogs, the intake maintenance crew has to scrape it clean standing over icy water.

## What people get

- **Feathers.** Padding for clothes and bedding.
- **A little meat.**
- **Where the water is open.** Where the birds sit, the water is open. People cutting ice holes follow the birds.

Crucian carp and common carp caught through holes in the river ice are about 0.3% of the calories Seoul''s people eat. All of Seoul cannot catch more than a few hundred tonnes a year. Birds and people share that small catch.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Gwangjin |
| Free Cities | Rare |
| Arc | Meets them most often: the south end of the Jamsil underwater weir, the Amsa intake |

## See also

- [Hostile Ecology Compendium: the perimeter and beyond the band](/wiki/Hostile-Ecology-Index/#perimeter)
- [G04 · Raccoon Dog](/wiki/Hostile-Group-G04/)
- [Meals and Food](/wiki/Food-Culture/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 짐승

얼어붙은 한강에서 물이 열린 곳에만 사는 새들이다. 사람을 해치지 않는다. 사람과 같은 물고기를 노리고, 사람에게 물이 열린 곳을 알려 준다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 짐승 |
| 위협 | 1 (축냄). 물고기를 다투고 취수구 거름망을 막는다 |
| 서울 전체의 수 | 300~500 마리 |
| 사는 곳 | 지상의 강가. 얼음이 열린 곳과 다리 구조물 |
| 가장 자주 만나는 정체 | 아크 |
| 사람이 얻는 것 | 깃털, 적은 고기, 열린 물의 자리 |

## 어디서 왔나

대정전 전부터 한강에서 겨울을 나던 왜가리와 민물가마우지다. 이 새들은 얼지 않은 물이 있으면 한국에서 겨울을 났다. 강이 얼자 대부분 죽었고, 열린 물 둘레에서만 살아남았다.

## 어디에 사나

지상의 강가에 산다. 한강은 2~4 m 두께로 얼어 있고, 얼음이 열린 곳은 몇 곳뿐이다.

- 잠실수중보 아래. 수차가 물을 휘저어 늘 조금 열려 있다. 서울에서 가장 넓은 열린 물이다.
- 구의, 뚝도, 영등포, 암사 취수구 둘레.
- 사람이 뚫은 얼음 구멍.

둥지는 다리 구조물에 짓는다. 잠실나루, 강변, 암사 둘레에 가장 많다.

## 무엇을 먹나

붕어와 잉어를 먹는다. 서울의 얼음 밑 물고기는 거의 붕어와 잉어다. 붕어는 얼음 밑 산소가 다 떨어진 물에서도 몇 달을 버틴다. 그래서 강물이 줄고 빛이 들지 않는 얼음 밑에서도 남았다.

## 빛의 철과 새

긴 낮 철에는 다리 구조물에 둥지를 짓는다. 긴 밤 철에는 열린 물 둘레에 모인다.

## 어떻게 움직이나

사람의 얼음 구멍 둘레에서 기다리다가 잡은 물고기를 낚아챈다. 가마우지는 열린 물로 잠수해 취수구 거름망 둘레까지 간다.

## 백 년 동안 달라진 것

대정전 전에는 철 따라 다른 땅을 오가는 무리가 많았다. 지금은 서울을 떠나지 않는 무리만 있다. 철새는 오지 않는다. 백 년 동안 띠 너머에서 날아온 새가 없다는 것은 경계 역 사람들이 가장 자주 하는 말 가운데 하나다.

## 위험

사람을 해치지 않는다. 사람과 물고기를 다투고, 똥이 취수구 거름망을 막는다. 거름망이 막히면 취수구 정비조가 얼음물 위에서 그것을 긁어내야 한다.

## 사람이 얻는 것

- **깃털.** 옷과 침구의 솜.
- **적은 고기.**
- **열린 물의 자리.** 새가 앉는 곳이 물이 열린 곳이다. 얼음 구멍을 뚫는 사람은 새를 따라간다.

강 얼음 구멍으로 잡는 붕어와 잉어는 서울 사람 열량의 약 0.3%다. 서울 전체가 한 해 수백 톤을 넘게 잡지 못한다. 그 적은 물고기를 새와 사람이 나눈다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 광진 |
| 자유도시들 | 드물다 |
| 아크 | 가장 자주 만난다. 잠실수중보 남쪽 끝, 암사 취수구 |

## 함께 읽기

- [적대 생태 도감: 테두리와 띠 너머](/wiki/Hostile-Ecology-Index/#perimeter)
- [G04 · 너구리](/wiki/Hostile-Group-G04/)
- [끼니와 먹거리](/wiki/Food-Culture/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G07', 'G07 · Yongsan Struck-Off', 'G07 · 용산 말소자', 'bestiary', 7, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Hostile human groups

People erased from the Government ledger, and their children. They gather in Yongsan''s abandoned sections and sell the way to cross the Line 1 bridge over the frozen river in secret. Official papers call them the struck-off; station people call them "the erased".

## At a glance

| Item | Detail |
|---|---|
| Kind | Hostile human groups |
| Threat | 3 (Danger) |
| Where they live | The abandoned sections between Yongsan, Sinyongsan, Ichon and Seobinggo; buried buildings under the old railway land |
| Polity that meets them most | The Government |
| What people get from them | The way and the hour to cross the bridge, news from across the river |

## Where they came from

The Government is a country of the ledger. Registered people receive rations only for their registered work at their registered station. Whoever leaves the registered station without the stamps is struck off after thirty days, and striking-off is also a punishment. A struck-off person is outside the ledger: no rations, the registration tag cut, and the law no longer sees them.

In 2079 the Government tried to cross the ice sheet and take the Yeongdeungpo intake. After that expedition met a blizzard on the river and was broken, the river became a line armies do not cross. And the Line 1 bridge (Yongsan–Noryangjin) became a way to cross in secret. The struck-off who knew that way gathered at Yongsan. Today the band includes the children of the struck-off, children who were never on the ledger at all.

## Where they live

They live in the abandoned sections between Yongsan, Sinyongsan, Ichon and Seobinggo, and at concourse depth in the buried buildings under the old railway land. The space under the north end of the bridge is their gate.

## What they do

- **Guiding.** They guide people and goods crossing the bridge in secret and take a fee. Those who do not pay are robbed.
- **Night raids.** They raid light-fields and fibre parties at night. They also block fibre routes and take tolls.
- **Trade with the Ferry Keeper.** With the Ferry Keeper of the Free City of Dongjak, who holds the south end of the bridge, they trade because each needs the other. The struck-off know the space under the north end; the Ferry Keeper holds the south end.

## The danger

Mostly knives, clubs and hand-made bows. Only a few firearms, and too little ammunition. They can kill a work party, but they do not face an armed squad.

## What people get from them

- **The way.** The way across the bridge and the best hour to cross. Armies do not cross the river, but people and goods do. No one knows that way better than the struck-off.
- **News.** News from across the river.
- **A reward.** The Government adds rations for whoever brings in a struck-off person.

## How the Government treats them

Government people are taught that harming someone outside the ledger is no crime. The struck-off carry no mark. People of the skilled and labour households wear a trade badge sewn on their clothes (the skilled on the left breast). On a struck-off person''s clothes the needle holes where that badge was torn off remain. Station people call it "the torn place" and know the struck-off by it.

Crossing the river without the stamps is one of the gravest crimes in Government law. Going across the river, or trading with people outside the ledger without permission, is read as having left the ledger. So whoever buys a struck-off guide also becomes struck off if caught.

A person erased as a punishment is struck through with two red lines and can never be put back on the ledger. Whether other struck-off people have a way back onto the ledger is in [Government Society](/wiki/Government-Society/).

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Meets them most often: Yongsan |
| Free Cities | Dongjak, at the south end of the bridge |
| Arc | None |

## See also

- [Hostile Ecology Compendium: people outside the polities](/wiki/Hostile-Ecology-Index/#outside-polities)
- [Government Society](/wiki/Government-Society/)
- [G08 · Dongdaemun Coupon-Forgers](/wiki/Hostile-Group-G08/)
- [Century Annals 2026-2126](/wiki/Century-Annals/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 적대 사람 무리

정부 장부에서 지워진 사람들과 그 자식들이다. 용산의 버려진 구간에 모여, 얼어붙은 강 위의 1호선 다리를 몰래 건너는 길을 판다. 공문은 그들을 말소자라 부르고, 역 사람들은 "지워진 사람"이라 부른다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 적대 사람 무리 |
| 위협 | 3 (위험) |
| 사는 곳 | 용산, 신용산, 이촌, 서빙고 사이의 버려진 구간, 옛 철도 부지 밑 묻힌 건물 |
| 가장 자주 만나는 정체 | 정부 |
| 그들에게서 얻는 것 | 다리를 건너는 길과 시간, 강 건너 소식 |

## 어디서 왔나

정부는 장부의 나라다. 등재민은 기재된 역에서 기재된 일을 해야 배급을 받는다. 도장 없이 기재된 역을 떠나 서른 날이 지나면 말소되고, 벌로 말소되기도 한다. 말소된 사람은 장부 밖이다. 배급을 받지 못하고, 등재 증표가 잘리고, 법이 그 사람을 보지 않는다.

2079년 정부는 얼음판을 건너 영등포 취수구를 차지하려 했다. 그 원정이 강 위에서 눈보라를 만나 꺾인 뒤로 강은 군대가 넘지 않는 선이 됐다. 그리고 1호선 다리(용산–노량진)는 몰래 건너는 길이 됐다. 그 길을 아는 말소자들이 용산에 모였다. 지금 무리에는 말소자의 자식들, 처음부터 장부에 오른 적 없는 아이들도 있다.

## 어디에 사나

용산, 신용산, 이촌, 서빙고 사이의 버려진 구간과, 옛 철도 부지 밑 묻힌 건물의 대합실 깊이에 산다. 다리 북쪽 끝 아래가 그들의 문이다.

## 무엇을 하나

- **길잡이.** 다리를 몰래 건너는 사람과 물건을 길잡이해 주고 값을 받는다. 값을 치르지 않는 사람은 턴다.
- **밤 습격.** 빛밭과 섬유 작업조를 밤에 습격한다. 섬유 길목을 막고 통행세도 받는다.
- **나루지기와의 거래.** 다리 남쪽 끝을 지키는 자유도시 동작의 나루지기와는 서로 필요해서 거래한다. 말소자는 북쪽 끝 아래를 알고, 나루지기는 남쪽 끝을 쥐고 있다.

## 위험

칼과 몽둥이, 손수 만든 활이 대부분이다. 화기는 몇 자루뿐이고 탄이 모자라다. 작업조 하나를 죽일 수 있지만 무장한 분대와는 맞서지 않는다.

## 그들에게서 얻는 것

- **길.** 다리를 건너는 길과 건너기 좋은 시간. 강은 군대가 넘지 않지만 사람과 물건은 넘는다. 그 길을 가장 잘 아는 것이 말소자다.
- **소식.** 강 건너의 소식.
- **포상.** 정부는 말소자를 붙잡아 오는 사람에게 배급을 얹어 준다.

## 정부는 그들을 어떻게 대하나

정부 사람은 장부 밖 사람을 해쳐도 죄가 되지 않는다고 배운다. 말소자는 표지가 없다. 기능 가구와 노역 가구 사람은 옷에 직종 표를 꿰매 다닌다(기능 가구는 왼쪽 가슴에). 말소자의 옷에는 그 표를 뜯어낸 바늘 자국이 남는다. 역 사람들은 그것을 "뜯긴 자리"라 부르고, 그것으로 말소자를 알아본다.

도장 없이 강을 건너는 것은 정부 법에서 가장 무거운 죄 가운데 하나다. 강 건너로 가거나 허가 없이 장부 밖 사람과 거래하면 장부를 떠난 것으로 읽는다. 그래서 말소자의 길잡이를 산 사람도 들키면 말소자가 된다.

벌로 지워진 사람은 붉은 줄 두 줄로 지워지고, 다시 장부에 오를 수 없다. 다른 말소자가 장부로 돌아가는 길이 있는지는 [정부 사회](/wiki/Government-Society/)에 있다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 가장 자주 만난다. 용산 |
| 자유도시들 | 동작. 다리 남쪽 끝 |
| 아크 | 없다 |

## 함께 읽기

- [적대 생태 도감: 정체 밖의 사람들](/wiki/Hostile-Ecology-Index/#outside-polities)
- [정부 사회](/wiki/Government-Society/)
- [G08 · 동대문 증표꾼](/wiki/Hostile-Group-G08/)
- [백 년 연표 2026~2126](/wiki/Century-Annals/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G08', 'G08 · Dongdaemun Coupon-Forgers', 'G08 · 동대문 증표꾼', 'bestiary', 8, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Hostile human groups

A band that forges the Government''s ration coupons and seals and sells them in secret. Unlike the other hostile human groups, many of them are still registered people on the ledger. By day they do their registered work; by night they become coupon-forgers.

## At a glance

| Item | Detail |
|---|---|
| Kind | Hostile human groups |
| Threat | 2-3. 3 when defending a workshop. Ledger threat 4 |
| Where they live | The buried basements of the old market buildings between Dongdaemun, Dongdaemun History & Culture Park, Dongmyo and Sindang |
| Polity that meets them most | The Government. They hardly appear in the other polities |
| What people get from them | Forged coupons, hands that cut seals, news of bought clerks |

## Where they came from

The Government''s money is the ration coupon. The Bank of Korea prints it, and the unit is still the won. There are four kinds: meal coupons, water coupons, fuel coupons and goods coupons. Coupons are issued monthly per household at the dong centre, and they can be exchanged for meals only at the dong centre where that household is registered.

In 2086-2095 salvaged salt first ran short. Then a secret market in salt and coupons opened in the basements of the old Dongdaemun market. The band that guarded that market hardened into the coupon-forgers.

## Where they live

They live between Dongdaemun (Jongno-gu), Dongdaemun History & Culture Park (Jung-gu), Dongmyo and Sindang: in the buried basements of the old market buildings, and in the sealed-off passages between concourse and platform.

This area holds some of the foremost markets north of the river. At Dongdaemun History & Culture Park stands the largest clothing and boot market north of the river, and at Dongdaemun people mend clothes and sell used ones. With so many people and goods coming and going, the coupon-forgers live mixed in among the market people. That is why they are a band one meets inside a station.

## What they do

- They forge coupons and seals.
- They bribe ration clerks. They would rather buy a clerk than kill one.
- They rob ration convoys.
- If a workshop is found, they defend it with their lives.

## The danger

They avoid fights. Only when defending a workshop do they become dangerous enough to kill a work party. What the coupon-forgers really harm is not people''s bodies but the ledger. Forged coupons throw off a district''s ration count. When the ration count is thrown off, so is the keeping of the station quotas.

## What people get from them

- **Forged coupons.** Use them and you are struck off.
- **Hands that cut seals.** The best seal-cutting hands in Seoul are here.
- **News.** News of which clerks have been bought. Handed to the Government, it earns extra rations.

## How the Government treats them

Altering the ledger is one of the gravest crimes in Government law. Forging an entry, forging coupons and drawing rations on someone else''s coupon all count. Government people say, "We do not kill; we erase." The heaviest punishment is the sentence strike-off: erased from the ledger, the tag cut, and put out of the station.

The coupon-forgers last longer than other bands because most of them are still inside the ledger. By day a coupon-forger is a registered person no different from anyone else.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Meets them most often: Jongno, Jung-gu |
| Free Cities | None. Government coupons are not money in the Free Cities |
| Arc | None |

## See also

- [Hostile Ecology Compendium: people outside the polities](/wiki/Hostile-Ecology-Index/#outside-polities)
- [Government Society](/wiki/Government-Society/)
- [G07 · Yongsan Struck-Off](/wiki/Hostile-Group-G07/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 적대 사람 무리

정부의 배급 증표와 도장을 위조해 몰래 파는 무리다. 다른 적대 사람 무리와 달리 상당수가 아직 장부에 오른 등재민이다. 낮에는 기재된 일을 하고, 밤에는 증표꾼이 된다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 적대 사람 무리 |
| 위협 | 2~3. 일터를 지킬 때는 3. 장부 위협 4 |
| 사는 곳 | 동대문, 동대문역사문화공원, 동묘앞, 신당 사이의 묻힌 옛 시장 건물 지하 |
| 가장 자주 만나는 정체 | 정부. 다른 정체에는 거의 나타나지 않는다 |
| 그들에게서 얻는 것 | 위조 증표, 도장을 새기는 손, 매수된 서기에 관한 소식 |

## 어디서 왔나

정부의 돈은 배급 증표다. 한국은행이 찍고, 단위는 여전히 원이다. 끼니 증표, 물 증표, 연료 증표, 물품 증표 네 가지가 있다. 증표는 동주민센터에서 달마다 세대 단위로 받고, 그 세대가 기재된 동주민센터에서만 끼니로 바꿀 수 있다.

2086~2095년, 고물 소금이 처음으로 모자라게 됐다. 그때 소금과 증표를 몰래 사고파는 장이 동대문 옛 시장 지하에 섰다. 그 장을 지키던 무리가 굳은 것이 증표꾼이다.

## 어디에 사나

동대문(종로구), 동대문역사문화공원(중구), 동묘앞, 신당 사이에 산다. 묻힌 옛 시장 건물 지하와, 대합실과 승강장 사이에 막아 둔 통로다.

이 둘레는 강 북쪽에서 손꼽히는 장터다. 동대문역사문화공원에는 강 북쪽에서 가장 큰 옷과 장화 장이 서고, 동대문에서는 옷을 고치고 헌 옷을 판다. 사람과 물건이 많이 드나드는 곳이라 증표꾼은 장터 사람들 사이에 섞여 산다. 그래서 역 안에서 만나는 무리다.

## 무엇을 하나

- 증표와 도장을 위조한다.
- 배급 서기를 매수한다. 서기를 죽이기보다 사는 쪽을 고른다.
- 배급 행렬을 턴다.
- 일터를 들키면 목숨을 걸고 지킨다.

## 위험

싸움을 피한다. 일터를 지킬 때만 작업조를 죽일 수 있을 만큼 위험해진다. 증표꾼이 정말 해치는 것은 사람의 몸이 아니라 장부다. 위조 증표가 한 구의 배급 수를 흐트러뜨린다. 배급 수가 흐트러지면 정원을 지키는 일도 흐트러진다.

## 그들에게서 얻는 것

- **위조 증표.** 쓰면 말소된다.
- **도장을 새기는 손.** 서울에서 도장을 가장 잘 새기는 손이 여기에 있다.
- **소식.** 어느 서기가 매수됐는지에 관한 소식. 정부에 넘기면 배급을 얹어 받는다.

## 정부는 그들을 어떻게 대하나

장부를 고치는 것은 정부 법에서 가장 무거운 죄 가운데 하나다. 기재 위조, 증표 위조, 남의 증표로 배급받기가 모두 여기에 든다. 정부 사람은 "죽이지 않고 지운다"고 말한다. 가장 무거운 벌은 처분 말소다. 장부에서 지우고, 증표를 자르고, 역 밖으로 내보낸다.

증표꾼이 다른 무리보다 오래 버티는 것은 그들 대부분이 아직 장부 안에 있기 때문이다. 낮의 증표꾼은 남과 다르지 않은 등재민이다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 가장 자주 만난다. 종로, 중구 |
| 자유도시들 | 없다. 정부 증표는 자유도시에서 돈이 아니다 |
| 아크 | 없다 |

## 함께 읽기

- [적대 생태 도감: 정체 밖의 사람들](/wiki/Hostile-Ecology-Index/#outside-polities)
- [정부 사회](/wiki/Government-Society/)
- [G07 · 용산 말소자](/wiki/Hostile-Group-G07/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G09', 'G09 · Sangam Deserters', 'G09 · 상암 탈영병', 'bestiary', 9, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Hostile human groups

A Government army checkpoint squad that guarded a bridge left its post with its weapons and became a band. It still keeps sentries and watch rotas, and one squad leader leads it. It is one of the few bands outside the polities in Seoul that carry firearms.

## At a glance

| Item | Detail |
|---|---|
| Kind | Hostile human groups |
| Threat | 4 (Grave danger) |
| Where they live | The abandoned sections between Digital Media City, Susaek and World Cup Stadium; the basements of the buried old stadium |
| Polity that meets them most | The Government |
| What people get from them | Firearms and ammunition, the north end of the bridge |

## Where they came from

The north ends of the Government''s bridges are held by the army. So is the north end of the airport-railway bridge that runs from Digital Media City across the river to Magongnaru.

In the 2110s, in a year of ration cuts, the checkpoint squad guarding that bridge left its post with its weapons. The squad tried to cross the bridge to Magongnaru. But Gangseo''s Wind Keeper did not let in armed people without surety; the Free Cities give no work to people without surety. The squad stayed north of the river, and since then it has taken in other deserters and become a band.

## Where they live

They live in the abandoned sections between Digital Media City, Susaek and World Cup Stadium, and in the basements of the buried old stadium. They use the ground under the old railway land at Susaek as a store. Digital Media City and Susaek are Government boundary stations, so the band''s hideouts cling to Seoul''s north-western edge.

## What they do

- **Tolls.** They take tolls from people crossing the bridge. They also block fibre routes.
- **Cutting cables.** They cut cables from Gangseo''s wind-machine fields across the river.
- **Discipline.** The Government army''s old discipline survives. There are sentries and watch rotas, and one squad leader leads. Newly arrived deserters join the rota too.

## The danger

They have Government army rifles and ammunition. Rounds are scarce, so they spare every shot, but when they shoot, they hit. They were trained in the army, so they do not scatter and run like other bands. An armed squad must face them.

## What people get from them

- **Firearms and ammunition.** Among the scarcest things in Seoul. Scatter them and you get weapons.
- **The north end of the bridge.** Contract with them and you get the north end of the bridge. Seen from Gangseo, contracting with them is the quickest way to protect the cables of the wind-machine fields.

## How the Government treats them

Every Government gun is on the ledger, down to the spent casings. So to the Government a deserter is, before anything else, a gun that has slipped off the ledger. Registered people serve 18 months from the age of nineteen, men and women alike, and a soldier who deserts is someone who has left his or her registered post. The Government records them as struck off.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Meets them most often: Mapo, Eunpyeong |
| Free Cities | Gangseo: the wind-machine fields across the bridge |
| Arc | None |

## See also

- [Hostile Ecology Compendium: people outside the polities](/wiki/Hostile-Ecology-Index/#outside-polities)
- [Guns, Rounds and Drones](/wiki/Era-Arms-and-Tech-Level/)
- [Government Society](/wiki/Government-Society/)
- [Free City Society](/wiki/Free-City-Society/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 적대 사람 무리

다리를 지키던 정부군 검문 분대가 무기를 든 채 자리를 떠나 무리가 됐다. 지금도 보초와 순번을 지키고, 분대장 한 사람이 이끈다. 서울에서 화기를 가진 몇 안 되는 정체 밖 무리다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 적대 사람 무리 |
| 위협 | 4 (큰 위험) |
| 사는 곳 | 디지털미디어시티, 수색, 월드컵경기장 사이의 버려진 구간, 묻힌 옛 경기장 지하 |
| 가장 자주 만나는 정체 | 정부 |
| 그들에게서 얻는 것 | 화기와 탄, 다리 북쪽 끝 |

## 어디서 왔나

정부의 다리 북쪽 끝은 국군이 지킨다. 디지털미디어시티에서 강 건너 마곡나루로 가는 공항철도 다리의 북쪽 끝도 그렇다.

2110년대, 배급이 줄어든 해에 그 다리를 지키던 검문 분대가 무기를 든 채 자리를 떠났다. 분대는 다리를 건너 마곡나루로 가려 했다. 그러나 강서의 바람지기는 보증 없는 무장한 사람을 들이지 않았다. 자유도시들은 보증 없는 사람에게 일감을 주지 않는다. 분대는 강 북쪽에 남았고, 그 뒤로 다른 탈영병을 받아들이며 무리가 됐다.

## 어디에 사나

디지털미디어시티, 수색, 월드컵경기장 사이의 버려진 구간과 묻힌 옛 경기장 지하에 산다. 수색의 옛 철도 부지 밑을 창고로 쓴다. 디지털미디어시티와 수색은 정부의 경계 역이라, 무리의 거처는 서울 서북쪽 끝에 붙어 있다.

## 무엇을 하나

- **통행세.** 다리를 건너는 사람에게 통행세를 받는다. 섬유 길목도 막는다.
- **전선 끊기.** 강 건너 강서의 바람틀 밭에서 전선을 끊어 간다.
- **규율.** 정부군의 옛 규율이 남아 있다. 보초와 순번이 있고, 분대장 한 사람이 이끈다. 새로 들어온 탈영병도 그 순번에 든다.

## 위험

정부군의 소총과 탄을 가지고 있다. 탄이 귀해 한 발을 아끼지만, 쏘면 맞힌다. 군대에서 배운 사람들이라 다른 무리처럼 흩어져 달아나지 않는다. 무장한 분대가 맞서야 한다.

## 그들에게서 얻는 것

- **화기와 탄.** 서울에서 가장 귀한 것 가운데 하나다. 그들을 흩으면 무기를 얻는다.
- **다리 북쪽 끝.** 그들과 계약하면 다리 북쪽 끝을 얻는다. 강서 쪽에서 보면, 바람틀 밭의 전선을 지키는 가장 빠른 길이 그들과 계약하는 것이다.

## 정부는 그들을 어떻게 대하나

정부의 총은 모두 장부에 오르고, 쏜 탄피까지 셈한다. 그래서 정부에게 탈영병은 사람보다 먼저 장부에서 빠져나간 총이다. 열아홉 살이 된 등재민은 남녀 모두 18개월 복무하고, 탈영한 병사는 기재된 자리를 떠난 사람이다. 정부는 그들을 말소자로 적는다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 가장 자주 만난다. 마포, 은평 |
| 자유도시들 | 강서. 다리 건너 바람틀 밭 |
| 아크 | 없다 |

## 함께 읽기

- [적대 생태 도감: 정체 밖의 사람들](/wiki/Hostile-Ecology-Index/#outside-polities)
- [총, 탄, 드론](/wiki/Era-Arms-and-Tech-Level/)
- [정부 사회](/wiki/Government-Society/)
- [자유도시들의 사회](/wiki/Free-City-Society/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G10', 'G10 · Bogungmun Perimeter-Runners', 'G10 · 보국문 테두리꾼', 'bestiary', 10, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Hostile human groups

People who live on the slopes of Bukhansan. When a blizzard comes they go into the perimeter and strip power cores and parts from wrecked machines. They know the perimeter better than anyone on the Government side, and on the Government ledger they are struck off.

## At a glance

| Item | Detail |
|---|---|
| Kind | Hostile human groups |
| Threat | 3-4 |
| Where they live | The mountain slopes around Bukhansan Bogungmun, Bukhansan Ui and Jeongneung. They go as far as the forecourt |
| Polity that meets them most | The Government. The Arc is the one that buys from them |
| What people get from them | Power cores and parts, the perimeter''s paths and the machines'' habits, guides |

## Where they came from

After the Great Blackout people cut the dead forests of Bukhansan, Dobongsan and Gwanaksan for firewood and fibre-sugar stock. In the 2060s the near forests ran out. The dead trees that remained were close to the perimeter, and the woodcutters who went to fell them learned how to cross it.

In 2086-2095 the number of machines outside fell noticeably. Crossing the perimeter in a blizzard to dig out power cores became a trade for the first time. Those woodcutters became the first perimeter-runners. Since they left their stations to live on the mountain, the Government ledger counts them as struck off.

## Where they live

They live on the mountain slopes around Bukhansan Bogungmun, Bukhansan Ui and Jeongneung. They keep small hideouts in old mountain shelters and buried basements. They go as far as the forecourt just beyond the boundary. No machines circle in the forecourt; there is the dead forest still on the ridges, and the perimeter-runners'' paths.

## What they do

- **They go into the perimeter.** The perimeter machines see movement and heat. The two to four days when a blizzard blinds them are the only window. In that window the perimeter-runners go into the perimeter and strip power cores and parts from wrecked machines. But the ground-knockers driven into the ground hear even in a blizzard. So perimeter-runners never drag their feet, and they walk one at a time, spaced apart.
- **They hide their paths.** They hide their own paths, and when others come onto those paths they mislead or ambush them.
- **They sell.** They sell what they strip to anyone. The Arc pays best, because power cores go into the charging and maintenance of the baptized.

## What perimeter-runners know

Perimeter-runners are the people in Seoul who have seen perimeter machines from closest. What they say drifted into the stations and became the machines'' spoken names.

- "Where the crows sit, there is a machine." Large-billed crows gather where a perimeter machine has stopped an animal.
- Do not walk carelessly up to something that looks like a wreck. Telling a stopped udukeoni from a waiting one is the perimeter-runner''s craft.
- Other machines soon gather around a wreck the bulgasari is stripping. Perimeter-runners go after the same wrecks as the bulgasari, so they meet them most often.

## The danger

They are few. But they know the mountain and the snow, and some carry weapons salvaged from the perimeter. To anyone who comes onto their paths they are dangerous enough to kill a work party, and sometimes more.

## What people get from them

- **Power cores and machine parts.** What is salvaged from the perimeter is worth a life.
- **Knowledge.** The perimeter''s paths and the machines'' habits.
- **Guides.** Guides who know the forecourt and the perimeter.

Across all of Seoul, Geumcheon''s edge crews in the Free Cities compare with the perimeter-runners. The edge crews know the southern perimeter; the perimeter-runners know the perimeter of the northern mountains.

## How the Government treats them

A Government person who crosses the perimeter without permission is struck off the ledger. The only way to cross the perimeter inside the ledger is a perimeter posting entered by the Ministry of National Defense. So the perimeter-runners are people outside the ledger.

Even so, the Government wants what the perimeter-runners bring back. The ledger wants power cores, and it wants to record who came back. The **return network**, which the Government funds by contract, is a chain of radios and shelters waiting for people coming back across the perimeter.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Meets them most often: Seongbuk, Gangbuk, Dobong |
| Free Cities | Rare |
| Arc | The one that buys from them |

## See also

- [Hostile Ecology Compendium: the perimeter and beyond the band](/wiki/Hostile-Ecology-Index/#perimeter)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [G20 · Bulgasari](/wiki/Hostile-Group-G20/)
- [G23 · Udukeoni](/wiki/Hostile-Group-G23/)
- [G01 · Wild Boar](/wiki/Hostile-Group-G01/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 적대 사람 무리

북한산 자락에 사는 사람들이다. 눈보라가 오면 테두리로 들어가 부서진 기계에서 동력 덩이와 부품을 떼어 온다. 정부 쪽에서 테두리를 가장 잘 아는 사람들이고, 정부 장부에서는 말소자다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 적대 사람 무리 |
| 위협 | 3~4 |
| 사는 곳 | 북한산보국문, 북한산우이, 정릉 둘레의 산자락. 앞마당까지 오간다 |
| 가장 자주 만나는 정체 | 정부. 그들에게서 사는 쪽은 아크 |
| 그들에게서 얻는 것 | 동력 덩이와 부품, 테두리의 길과 기계의 습성, 길잡이 |

## 어디서 왔나

대정전 뒤 사람들은 북한산, 도봉산, 관악산의 죽은 숲을 땔감과 섬유당 원료로 벴다. 2060년대에 가까운 산의 숲이 바닥났다. 남은 죽은 나무는 테두리 가까이에 있었고, 그 나무를 베러 가던 나무꾼들이 테두리를 넘는 법을 익혔다.

2086~2095년, 바깥 기계의 수가 눈에 띄게 줄었다. 눈보라 때 테두리를 넘어 동력 덩이를 캐 오는 일이 처음으로 장사가 됐다. 그 나무꾼들이 첫 테두리꾼이 됐다. 역을 떠나 산에 사니 정부 장부에서는 말소자다.

## 어디에 사나

북한산보국문, 북한산우이, 정릉 둘레의 산자락에 산다. 옛 산 대피 시설과 묻힌 건물 지하에 작은 거처를 둔다. 경계 바로 너머의 앞마당까지 오간다. 앞마당에는 기계가 돌지 않고, 산마루 위에 남은 죽은 숲과 테두리꾼의 길이 있다.

## 무엇을 하나

- **테두리에 든다.** 테두리의 기계는 움직임과 열을 본다. 눈보라가 그 눈을 가리는 2~4일이 유일한 창이다. 테두리꾼은 그 창에 테두리로 들어가 부서진 기계에서 동력 덩이와 부품을 떼어 온다. 다만 땅에 박힌 땅두드리기는 눈보라 속에서도 듣는다. 그래서 테두리꾼은 발을 끌지 않고 한 사람씩 떨어져 걷는다.
- **길을 감춘다.** 자기 길을 감추고, 다른 사람이 그 길로 들어오면 길을 속이거나 덮친다.
- **판다.** 떼어 온 것은 누구에게든 판다. 값을 가장 잘 쳐주는 쪽은 아크다. 동력 덩이는 세례자의 충전과 정비에 들기 때문이다.

## 테두리꾼이 아는 것

테두리꾼은 서울에서 테두리 기계를 가장 가까이서 본 사람들이다. 그들이 하는 말이 역으로 흘러들어 기계의 입말 이름이 됐다.

- "까마귀가 앉은 곳에 기계가 있다." 테두리 기계가 짐승을 멈춰 세운 자리에 큰부리까마귀가 모인다.
- 부서진 잔해처럼 보이는 것에 함부로 다가가지 않는다. 멈춘 우두커니와 기다리는 우두커니를 가려내는 것이 테두리꾼의 기술이다.
- 불가사리가 뜯는 잔해 둘레에는 곧 다른 기계가 모인다. 테두리꾼은 불가사리와 같은 잔해를 노리므로 가장 자주 마주친다.

## 위험

수가 적다. 그러나 산과 눈에 밝고, 테두리에서 건진 무기를 가진 사람도 있다. 자기 길에 들어온 사람에게는 작업조를 죽일 수 있을 만큼, 때로는 그 이상으로 위험하다.

## 그들에게서 얻는 것

- **동력 덩이와 기계 부품.** 테두리에서 건진 것은 목숨값이다.
- **지식.** 테두리의 길과 기계의 습성.
- **길잡이.** 앞마당과 테두리를 아는 길잡이.

서울 전체로 보면 자유도시 금천의 경계조가 테두리꾼과 견줄 만하다. 경계조는 남쪽 테두리를, 테두리꾼은 북쪽 산의 테두리를 안다.

## 정부는 그들을 어떻게 대하나

정부 사람은 허가 없이 테두리를 넘으면 장부에서 말소된다. 장부 안에서 테두리를 넘는 길은 국방부가 기재하는 테두리 파견뿐이다. 그래서 테두리꾼은 장부 밖 사람이다.

그래도 정부는 테두리꾼이 가져오는 것을 원한다. 장부는 동력 덩이를 원하고, 누가 돌아왔는지 적고 싶어 한다. 정부가 계약으로 돈을 대는 **귀환망**은 테두리를 넘었다 돌아오는 사람을 기다리는 무전과 피난처의 사슬이다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 가장 자주 만난다. 성북, 강북, 도봉 |
| 자유도시들 | 드물다 |
| 아크 | 그들에게서 사는 쪽이다 |

## 함께 읽기

- [적대 생태 도감: 테두리와 띠 너머](/wiki/Hostile-Ecology-Index/#perimeter)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [G20 · 불가사리](/wiki/Hostile-Group-G20/)
- [G23 · 우두커니](/wiki/Hostile-Group-G23/)
- [G01 · 멧돼지](/wiki/Hostile-Group-G01/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G11', 'G11 · Suseo Gone-Dark', 'G11 · 수서 꺼진 사람들', 'bestiary', 11, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Hostile human groups

People whose baptized bodies can no longer get maintenance. The machines fitted to a body run only while it reaches maintenance and charging. The people cut off from that gathered at the Arc''s south-eastern end, beyond Suseo. Arc people call them the gone-dark, and their bodies gone-dark bodies.

## At a glance

| Item | Detail |
|---|---|
| Kind | Hostile human groups |
| Threat | 3 (Danger) |
| Where they live | The abandoned sections and buried deep buildings between Suseo, Irwon and Daemosan. Beyond the Arc''s boundary stations |
| Polity that meets them most | The Arc |
| What people get from them | Parts that have stopped in their bodies; knowledge of how a body breaks down outside maintenance |

## Where they came from

In the Arc, baptism is fitting machines to the body, and a baptized body lives only while it reaches maintenance and charging. The maintenance turns are set by the Near Houses and the maintenance benches.

Around 2122 the Gangnam shelters were bound together under the name of the Arc, and the Near Houses took the districts. Three kinds of people then gathered at Gangnam''s south-eastern end.

- People from shelters that refused to be bound together.
- People dropped from the maintenance roll by a Near House ruling.
- People who had bought parts in secret and fitted them to their bodies, and then had no way to get them maintained.

Since then, people dropped from the maintenance roll and people who left the Arc of their own accord have kept drifting in.

## Where they live

They live in the abandoned sections and buried deep buildings between Suseo, Irwon and Daemosan, beyond the Arc''s boundary stations. Suseo is the station where the Arc holds the exchange that takes in power cores brought from outside. The gone-dark live right beside the gate through which the Arc takes in power cores.

## What they do

- **They steal power.** They splice into station cables in secret.
- **They raid.** They raid maintenance benches and charging places.
- **They slip in.** They come in among the people as deep as the platform level of Arc stations.

The machines in their bodies stop one by one from cold and lack of maintenance, so the band is always short of power and parts. Those whose machines still work are stronger and last longer than ordinary people. Those whose machines have all stopped are weaker than ordinary people, because they live carrying heavy machines in their bodies.

## The danger

Each one can be dangerous. But the band is small and always worn out. It can kill a work party, but it cannot fight for long.

## What people get from them

- **Parts that have stopped in their bodies.** The Arc tries to recover them for reuse.
- **Knowledge.** Knowledge of how a body breaks down outside the maintenance roll. This knowledge is covered in [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/).

## How the Arc treats them

In the Arc, a body''s parts belong to the faith that fitted them. The baptized carry and use their parts but may not sell them or give them away. Selling a part, having it removed at a Free City market, or passing it to the Government side in secret is the gravest crime after harming a person. The punishment is losing one''s maintenance turns for a set time. For someone who lives on their parts this can be the same as losing the parts.

So to the Arc, the parts left in a gone-dark body are the faith''s share, to be recovered. A part fitted outside counts as baptism only once it is fitted again at an Arc maintenance bench. This is called **refitting**. The Arc''s maintenance roll and maintenance turns are covered in [Arc Society](/wiki/Arc-Society/).

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Rare |
| Free Cities | Rare |
| Arc | Meets them most often: Gangnam |

People in the Government or the Free Cities who bought Arc parts also drift into this band in the end, because the Arc is the only place in Seoul where a body can be maintained.

## See also

- [Hostile Ecology Compendium: people outside the polities](/wiki/Hostile-Ecology-Index/#outside-polities)
- [Arc Society](/wiki/Arc-Society/)
- [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/)
- [G05 · Brown Rat](/wiki/Hostile-Group-G05/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 적대 사람 무리

세례받은 몸을 더는 정비받지 못하게 된 사람들이다. 몸에 단 기계는 정비와 충전에 닿아야 돈다. 그 길이 끊긴 사람들이 아크 동남쪽 끝, 수서 바깥쪽에 모였다. 아크 사람들은 그들을 꺼진 사람, 그 몸을 꺼진 몸이라 부른다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 적대 사람 무리 |
| 위협 | 3 (위험) |
| 사는 곳 | 수서, 일원, 대모산입구 사이의 버려진 구간과 묻힌 깊은 건물. 아크 경계 역 바깥쪽 |
| 가장 자주 만나는 정체 | 아크 |
| 그들에게서 얻는 것 | 몸에서 멈춘 부품, 정비 밖에서 몸이 망가지는 길에 관한 지식 |

## 어디서 왔나

아크에서 세례는 몸에 기계를 맞추는 일이고, 세례받은 몸은 정비와 충전에 닿아야 산다. 그 정비 순번은 곁집과 정비대가 정한다.

2122년 무렵 강남의 대피소들이 아크라는 이름으로 묶이고 곁집이 구를 맡게 됐다. 그때 세 갈래의 사람이 강남 동남쪽 끝으로 모였다.

- 묶이기를 거부한 대피소 사람들.
- 곁집의 판정으로 정비 명단에서 빠진 사람들.
- 몰래 부품을 사서 몸에 맞췄다가 정비를 받을 길이 없게 된 사람들.

그 뒤로도 정비 명단에서 빠진 사람, 스스로 아크를 떠난 사람이 이어 흘러들었다.

## 어디에 사나

수서, 일원, 대모산입구 사이의 버려진 구간과 묻힌 깊은 건물에 산다. 아크 경계 역의 바깥쪽이다. 수서는 아크가 바깥에서 캐 온 동력 덩이를 받는 바꿈터가 서는 역이다. 꺼진 사람들은 아크가 동력 덩이를 받아들이는 문 바로 곁에 산다.

## 무엇을 하나

- **전기를 훔친다.** 역의 전선에 몰래 줄을 잇는다.
- **습격한다.** 정비대와 충전 자리를 습격한다.
- **섞여 든다.** 아크 역의 승강장 깊이까지 사람들 사이에 섞여 들어온다.

몸의 기계는 추위와 정비 부족으로 하나씩 멈춘다. 그래서 무리는 늘 전기와 부품이 급하다. 몸의 기계가 아직 살아 있는 사람은 보통 사람보다 힘이 세고 오래 버틴다. 몸의 기계가 모두 멈춘 사람은 보통 사람보다 약하다. 무거운 기계를 몸에 지고 살기 때문이다.

## 위험

한 사람 한 사람이 위험할 수 있다. 그러나 무리는 작고 늘 지쳐 있다. 작업조 하나를 죽일 수 있지만 오래 싸우지 못한다.

## 그들에게서 얻는 것

- **몸에서 멈춘 부품.** 아크는 그것을 거두어 다시 쓰려 한다.
- **지식.** 정비 명단 밖에서 몸이 어떻게 망가지는지에 관한 지식. 이 지식은 [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/)이 다룬다.

## 아크는 그들을 어떻게 대하나

아크에서 몸의 부위는 그것을 맞춰 준 신앙의 것이다. 세례자는 부위를 지니고 쓸 뿐, 팔거나 떼어 줄 수 없다. 부위를 팔거나, 자유도시 장터에서 떼어 내거나, 몰래 정부 쪽에 넘기는 것은 사람을 해치는 일 다음으로 무거운 죄다. 그 벌은 정해진 동안 정비 순번을 빼앗는 것이다. 부위에 기대 사는 사람에게 이것은 부위를 잃는 것과 같을 수 있다.

그래서 아크에게 꺼진 사람의 몸에 남은 부위는 거두어야 할 신앙의 몫이다. 바깥에서 단 부위는 아크 정비대에서 다시 맞추어야 세례로 센다. 이것을 **다시 맞춤**이라 한다. 아크의 정비 명단과 정비 순번은 [아크 사회](/wiki/Arc-Society/)에 있다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 드물다 |
| 자유도시들 | 드물다 |
| 아크 | 가장 자주 만난다. 강남 |

정부나 자유도시들에서 아크의 부품을 산 사람도 결국 이 무리로 흘러든다. 몸을 정비할 곳이 서울에서 아크뿐이기 때문이다.

## 함께 읽기

- [적대 생태 도감: 정체 밖의 사람들](/wiki/Hostile-Ecology-Index/#outside-polities)
- [아크 사회](/wiki/Arc-Society/)
- [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/)
- [G05 · 집쥐](/wiki/Hostile-Group-G05/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G12', 'G12 · Geumcheon Hands Without Surety', 'G12 · 금천 보증 잃은 손', 'bestiary', 12, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Hostile human groups

Engineers and workers of the Free Cities who lost their surety. They have skill in their hands, but without someone to stand surety for them they cannot take on work in the Free Cities. They gathered on the buried factory grounds of Geumcheon, at Seoul''s southern end.

## At a glance

| Item | Detail |
|---|---|
| Kind | Hostile human groups |
| Threat | 3 (Danger). The best in Seoul at traps and ambushes |
| Where they live | The buried factory basements and the abandoned sections of Line 1 between Doksan, Geumcheon-gu Office and Gasan Digital Complex |
| Polity that meets them most | The Free Cities |
| What people get from them | Engineers |

## Where they came from

The Free Cities hold people by contract and surety. Work and a share come only when someone stands surety. When the guarantor withdraws, the contract is broken, or the workbench that would stand surety fails, that person becomes a hand without surety.

In 2106-2111 the Free Cities fought, pushing the old power grid onto one another. Then the surety of the work parties that tended the abandoned sections was withdrawn all at once. Those parties gathered on the factory grounds at Seoul''s southern end. Since then contract-breakers and people who could not pay their debts have kept drifting in.

## Where they live

They live in the buried factory basements and the abandoned sections of Line 1 between Doksan, Geumcheon-gu Office and Gasan Digital Complex. Some spread as far as Onsu and Cheonwang in Guro. Geumcheon is the city with the fewest stations of the seven Free Cities, and it lives with people of broken seals as its neighbours.

## What they do

- **They rob.** They rob loads and work parties moving along Line 1. They also block fibre routes.
- **They steal.** They steal tools and parts.
- **They work.** For someone who will give them work without surety, they sometimes do the work.
- **They mend.** They are skilled, so they mend stolen machines for their own use and set good traps.

## The danger

The best band in Seoul at traps and ambushes. The abandoned sections of Line 1 where they live are also sections laid with their traps. Loads and work parties travelling on Line 1 buy the escort of Geumcheon''s edge crews.

## What people get from them

**Engineers.** If someone stands surety again, they become hands again. Word goes round that Geumcheon''s Edge Warden secretly uses those among them who know the perimeter. It is only a rumour, and the Edge Warden does not answer such talk.

## How the Free Cities treat them

In the Free Cities the law differs from city to city. But in all seven the heaviest punishment is the same: **breaking the seal**. The seal of the person who broke a surety, or of the bench, is broken so that the person can never again contract in their own name. A person whose seal is broken becomes a day hand. No other city accepts that person''s seal either, not because of a law but because no one will make a contract with a broken seal.

A day hand receives only wages and cannot contract in their own name. Even so, a day hand can become a hand by doing a bench''s work alone in front of any bench master. But few bench masters take a day hand to teach. Surety and seals in the Free Cities are covered in [Free City Society](/wiki/Free-City-Society/).

Hands without surety cannot get onto the Government ledger either. The ledger does not record people from across the river as people.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | None |
| Free Cities | Meet them most often: Geumcheon, Guro |
| Arc | Rare |

## See also

- [Hostile Ecology Compendium: people outside the polities](/wiki/Hostile-Ecology-Index/#outside-polities)
- [Free City Society](/wiki/Free-City-Society/)
- [G13 · Claw Arms](/wiki/Hostile-Group-G13/)
- [G03 · Feral Dogs](/wiki/Hostile-Group-G03/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 적대 사람 무리

자유도시들에서 보증을 잃은 기술자와 일꾼들이다. 손에 기술이 있지만, 보증 서 줄 사람이 없으면 자유도시에서는 일을 맡을 수 없다. 그들이 서울 남쪽 끝 금천의 묻힌 공장 터에 모였다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 적대 사람 무리 |
| 위협 | 3 (위험). 서울에서 덫과 매복을 가장 잘한다 |
| 사는 곳 | 독산, 금천구청, 가산디지털단지 사이의 묻힌 공장 지하와 1호선 버려진 구간 |
| 가장 자주 만나는 정체 | 자유도시들 |
| 그들에게서 얻는 것 | 기술자 |

## 어디서 왔나

자유도시들은 계약과 보증으로 사람을 붙잡는다. 누군가 보증을 서야 일감과 몫을 받는다. 보증인이 보증을 거두거나, 계약을 깨거나, 보증 서 줄 작업대가 망하면 그 사람은 보증 잃은 손이 된다.

2106~2111년, 자유도시의 도시들이 늙은 전력망을 서로 떠넘기며 다퉜다. 그때 버려진 구간을 맡던 작업조들의 보증이 한꺼번에 거두어졌다. 그 작업조들이 서울 남쪽 끝의 공장 터로 모였다. 그 뒤로 계약을 깬 사람, 빚을 갚지 못한 사람이 이어 흘러들었다.

## 어디에 사나

독산, 금천구청, 가산디지털단지 사이의 묻힌 공장 지하와 1호선 버려진 구간에 산다. 일부는 구로의 온수, 천왕 쪽까지 퍼진다. 금천은 자유도시 일곱 도시 가운데 역이 가장 적은 도시이고, 도장이 깨진 사람들을 이웃으로 두고 산다.

## 무엇을 하나

- **턴다.** 1호선을 따라 오가는 짐과 작업조를 턴다. 섬유 길목도 막는다.
- **훔친다.** 연장과 부품을 훔친다.
- **일한다.** 보증 없이 일을 맡겨 주는 사람에게는 일을 해 주기도 한다.
- **고친다.** 기술이 있어서, 훔친 기계를 고쳐 쓰고 덫을 잘 놓는다.

## 위험

서울에서 덫과 매복을 가장 잘하는 무리다. 그들이 사는 1호선 버려진 구간은 그들이 놓은 덫의 구간이기도 하다. 1호선으로 오가는 짐과 작업조는 금천 경계조의 호위를 산다.

## 그들에게서 얻는 것

**기술자.** 누군가 보증을 다시 서면 그들은 다시 손이 된다. 금천의 경계장이 그들 가운데 테두리를 아는 사람을 몰래 쓴다는 말이 돈다. 소문일 뿐이고, 경계장은 그런 말에 답하지 않는다.

## 자유도시는 그들을 어떻게 대하나

자유도시는 도시마다 법이 다르다. 그러나 일곱 도시 모두에서 가장 큰 벌은 같다. **도장을 깬다.** 보증을 깬 사람이나 대의 도장을 깨뜨려, 그가 다시는 제 이름으로 계약하지 못하게 한다. 도장이 깨진 사람은 일손이 된다. 다른 도시도 그 사람의 도장을 받지 않는다. 법 때문이 아니라 아무도 깨진 도장과 계약을 맺으려 하지 않기 때문이다.

일손은 품삯만 받고 제 이름으로 계약하지 못한다. 그래도 일손은 손이 될 수 있다. 어느 대주 앞에서든 그 대의 일을 혼자 해내 보이면 된다. 다만 일손을 받아 가르칠 대주가 드물다. 자유도시의 보증과 도장은 [자유도시들의 사회](/wiki/Free-City-Society/)에 있다.

보증 잃은 손은 정부 장부에도 오를 수 없다. 장부는 강 건너 사람을 사람으로 적지 않는다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 없다 |
| 자유도시들 | 가장 자주 만난다. 금천, 구로 |
| 아크 | 드물다 |

## 함께 읽기

- [적대 생태 도감: 정체 밖의 사람들](/wiki/Hostile-Ecology-Index/#outside-polities)
- [자유도시들의 사회](/wiki/Free-City-Society/)
- [G13 · 집게팔](/wiki/Hostile-Group-G13/)
- [G03 · 들개](/wiki/Hostile-Group-G03/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G13', 'G13 · Claw Arms', 'G13 · 집게팔', 'bestiary', 13, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) · Old machines inside Seoul

Arm machines that picked and moved goods in pre-Blackout logistics warehouses. For a hundred years they have slept in buried warehouses. When power reaches them they wake, take whatever moves in the warehouse for goods, and pick it up.

## At a glance

| Item | Detail |
|---|---|
| Kind | Old machines inside Seoul |
| Threat | 3 (Danger) |
| Where they are | The basements and ground floors of buried logistics warehouses: below the second floor, under the snow |
| Polity that meets them most | The Free Cities |
| What people get | The fibre left in the warehouses. Motors, joints, rails, sensors |

## Where they came from

The arm machines that picked and moved goods in pre-Blackout logistics warehouses, with their rails, doors and sorting lines. An arm with a single claw ran along a rail, picked up goods and set them on the line. Station people call them claw arms, after that look.

When the Great Blackout cut the power, the claw arms stopped where they were working. Snow piled up over them. In frozen basements rust is slow and grease only stiffens; nothing rots. So after a hundred years the claw arms are not broken but asleep.

## Where they are

They are in the basements and ground floors of buried logistics warehouses, below the second floor. All of it is under the snow; by depth it is the abandoned sections.

- Free Cities: old warehouses around Gasan Digital Complex, Guro Digital Complex and Doksan.
- Arc: old warehouses around Garak Market and Jangji.
- Government: old warehouses around Yongdu and Sinseol-dong.

## What they do when they wake

Normally they are asleep. They wake when a work party connects batteries to make light, or when power runs through a cut cable. A woken claw arm does the work of a hundred years ago again. Its schedule holds none of today''s people. So it treats anything moving in the warehouse as "goods to move" or "a jammed line" and picks it up or pushes it away.

Claw arms do not leave the warehouse. Where the rail ends, the claw arm''s reach ends.

A woken claw arm cannot move for long. With stiff joints and worn batteries it works for hours or days and stops again. But if it stays connected to power people have run in, it eats that power and carries on working.

## The danger

Anyone caught and dragged along a rail ends up with broken bones. One woken warehouse becomes a place no work party can enter.

Fibre parties look for rails before they open a warehouse door. If there are rails, they find where the rails end before lighting anything, and they work beyond that point. Those hurt by claw arms on the fibre routes are mostly people who lit a light inside the warehouse.

## What people get

- **Fibre.** Fibre shrinks every year, and the way to mine it grows longer every year. Warehouses guarded by claw arms hold the most cardboard and paper left, because no one has been able to get in.
- **Machine parts.** Motors, joints, rails, sensors. Moving joints and motors are what the Free Cities want most, for wind machines, pumps and water wheels.

## Meeting the three polities

| Polity | Encounters |
|---|---|
| Government | Meets them: Yongdu, Sinseol-dong |
| Free Cities | Meet them most often: Geumcheon, Guro |
| Arc | Songpa |

## See also

- [Hostile Ecology Compendium: the fibre-mining routes](/wiki/Hostile-Ecology-Index/#fibre-routes)
- [Hostile Ecology Compendium: machines](/wiki/Hostile-Ecology-Index/#machines)
- [People and Machines](/wiki/People-and-Machines/)
- [G12 · Geumcheon Hands Without Surety](/wiki/Hostile-Group-G12/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/) · 서울 안 옛 기계

대정전 전 물류 창고에서 짐을 고르고 옮기던 팔 기계다. 백 년 동안 묻힌 창고에서 잠들어 있다. 전기가 닿으면 깨어나, 창고 안에서 움직이는 것을 짐으로 보고 집어 든다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 서울 안 옛 기계 |
| 위협 | 3 (위험) |
| 사는 곳 | 묻힌 물류 창고의 지하와 1층. 지상 2층 아래, 눈 밑 |
| 가장 자주 만나는 정체 | 자유도시들 |
| 사람이 얻는 것 | 창고에 남은 섬유. 모터, 관절, 레일, 감지기 |

## 어디서 왔나

대정전 전 물류 창고에서 짐을 고르고 옮기던 팔 기계와 그 레일, 문, 분류 줄이다. 집게 하나를 단 팔이 레일을 따라 오가며 짐을 집어 줄에 올렸다. 역 사람들은 그 생김새대로 집게팔이라 부른다.

대정전으로 전기가 끊기자 집게팔은 일하던 자리에서 멈췄다. 그 위로 눈이 쌓였다. 언 지하에서는 녹이 느리고 기름이 굳을 뿐 썩지 않는다. 그래서 백 년이 지나도 집게팔은 부서지지 않고 잠들어 있다.

## 어디에 사나

묻힌 물류 창고의 지하와 1층, 지상 2층 아래에 있다. 모두 눈 밑이고, 깊이로는 버려진 구간이다.

- 자유도시들: 가산디지털단지, 구로디지털단지, 독산 둘레의 옛 창고.
- 아크: 가락시장과 장지 둘레의 옛 창고.
- 정부: 용두, 신설동 둘레의 옛 창고.

## 깨어나면 하는 일

평소에는 잠들어 있다. 작업조가 불을 밝히려고 전지를 잇거나, 끊긴 전선에 전기가 돌면 깨어난다. 깨어난 집게팔은 백 년 전 일을 다시 한다. 그 일의 순서표에는 지금의 사람이 없다. 그래서 창고 안에서 움직이는 것을 "옮길 짐"이나 "막힌 줄"로 보고 집어 들거나 밀어낸다.

집게팔은 창고 밖으로 나가지 않는다. 레일이 끝나는 곳이 집게팔이 닿는 곳의 끝이다.

깨어난 집게팔은 오래 움직이지 못한다. 굳은 관절과 닳은 전지로 몇 시간에서 며칠을 움직이다 다시 멈춘다. 다만 사람이 이어 준 전기에 계속 닿아 있으면 그 전기를 먹으며 일을 이어 간다.

## 위험

집혀서 레일에 끌려가면 뼈가 부러진다. 깨어난 창고 하나는 작업조가 들어가지 못하는 곳이 된다.

섬유 캐는 작업조는 창고 문을 열기 전에 레일을 먼저 본다. 레일이 있으면 불을 켜기 전에 레일이 끝나는 곳을 찾고, 그 밖에서 일한다. 섬유 캐는 길에서 집게팔에 다치는 사람은 대개 창고 안에서 불을 켠 사람이다.

## 사람이 얻는 것

- **섬유.** 섬유는 해마다 줄고, 섬유를 캐는 길은 해마다 멀어진다. 집게팔이 지키는 창고에는 판지와 종이가 가장 많이 남아 있다. 아무도 들어가지 못했기 때문이다.
- **기계 부품.** 모터, 관절, 레일, 감지기. 움직이는 관절과 모터는 자유도시들이 바람틀, 펌프, 수차에 쓰려고 가장 원한다.

## 세 정체와의 만남

| 정체 | 만남 |
|---|---|
| 정부 | 만난다. 용두, 신설동 |
| 자유도시들 | 가장 자주 만난다. 금천, 구로 |
| 아크 | 송파 |

## 함께 읽기

- [적대 생태 도감: 섬유 캐는 길](/wiki/Hostile-Ecology-Index/#fibre-routes)
- [적대 생태 도감: 기계](/wiki/Hostile-Ecology-Index/#machines)
- [사람과 기계](/wiki/People-and-Machines/)
- [G12 · 금천 보증 잃은 손](/wiki/Hostile-Group-G12/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G14', 'G14 · Empty Carts', 'G14 · 빈수레', 'bestiary', 14, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Empty carts are old machines inside Seoul. Driverless carriers and track-inspection cars that moved goods and people on underground tracks and in the basements of large buildings before the Great Blackout have stood on the rails for a hundred years. When power runs through the track they wake and run on the last route and timetable they were given, with no load to carry and no one to ride. That is why station people call them empty carts.

## At a Glance

| Item | Details |
|---|---|
| Kind | Old machine inside Seoul. A sleeping old machine, and one that people also revive and use |
| Threat | 3 (Danger). People are struck in dark tunnels |
| Depth | Tracks in abandoned sections, and around track sections where people have put power back in |
| Often seen | Between Sindorim and Daerim on Line 2, toward the Sinjeong depot, between Jamsil and Sports Complex |
| Polity that meets it most | The Free Cities (Yangcheon, Guro). Next, the Arc (Songpa) |
| Salvage | Wheels, motors, battery frames. The revived empty cart itself |

## Where It Came From

Before the Great Blackout, the ground under Seoul was full of carts that moved without people: carriers that hauled goods along the rails, inspection cars that swept the track every night, cars that pulled freight wagons in the basements of large buildings. When the Great Blackout cut the power, they all stopped where they were.

In the frozen underground, rust is slow and oil only stiffens; nothing rots. That is how the empty carts lasted a hundred years. Empty carts are not machines of the First AI. They take orders from no one and remember only the route sheet they were given a hundred years ago.

## Where It Is Found

Empty carts stand on the tracks of abandoned sections. They do not come into the deep layer of a living station.

It is people who wake them. In a world where the rail is the road, people put power back into dead track sections to move loads between stations. If a sleeping empty cart stands in or near that section, it wakes with it. So empty carts appear most often where the most hauling is done: between Sindorim and Daerim on Line 2, toward the Sinjeong depot (the Free Cities), and between Jamsil and Sports Complex (the Arc).

## How It Behaves

When power runs through the track, an empty cart wakes and runs on the last route and timetable it was given. It does not stop for people in front of it. It comes through the dark without lights.

When the power is cut it stops where it is. Usually it runs for a few hours to a few days on stiff wheels and a worn battery and then stops, but if it stays in touch with the power people have put in, it feeds on that power and runs its route for as long as the power lasts.

## When You Meet It

The threat is 3. An empty cart does not hunt people. But a mass of iron coming without lights through a dark tunnel can kill a whole work party at once.

So every section that is to be powered must first be checked for empty carts. Before a Free City station crew powers a section, someone walks it from end to end. While the power is on, someone keeps a hand on the rail and listens for the tremor. When an empty cart comes, people step into the old refuge niches in the tunnel wall and cut the section''s power to stop it.

## What Can Be Salvaged

A stopped empty cart yields wheels, motors and battery frames. But the empty cart is a machine to revive rather than strip. Repaired and tamed by people, empty carts haul loads between stations. They are the most common kind of revived work machine, the kind that repeats one set task.

## The Three Polities and the Empty Carts

- **The Free Cities.** They meet empty carts most often and own the most. Yangcheon''s Depot Master and Guro''s Works Master keep the most revived empty carts. To Guro people an empty cart is both a threat and a tool. "What time did you power that section?" is the first question they ask about a tunnel accident.
- **The Arc.** Meets them in the abandoned sections around Jamsil in Songpa. It owns the most revived machines after the Free Cities.
- **The Government.** Meets them rarely.

## Stories and Names

The name is just what they look like: carts that run with nothing to carry.

Track workers say, "In a dark tunnel, when the wind comes first, an empty cart is coming." A cart running in a narrow tunnel pushes the air ahead of it, so the wind arrives before the sound. People around Sindorim call that wind "the empty wind".

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Sindorim Junction Cargo Gate](/wiki/Sindorim-Junction-Cargo-Gate/)
- [The Surface and Underground](/wiki/World-and-Subway-Layers/)
- [People and Machines](/wiki/People-and-Machines/)
- [Free City Society](/wiki/Free-City-Society/)
- [G13 · Claw Arms](/wiki/Hostile-Group-G13/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

빈수레는 서울 안 옛 기계다. 대정전 전에 지하 선로와 큰 건물 지하에서 짐과 사람을 실어 나르던 무인 운반차와 선로 점검차가 백 년 동안 선로 위에 멈춰 있다. 선로에 전기가 돌면 깨어나, 실을 짐도 태울 사람도 없이 마지막으로 받은 노선과 시간표대로 달린다. 그래서 역 사람들은 빈수레라 부른다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 서울 안 옛 기계. 잠든 옛 기계이며, 사람이 다시 살려 쓰기도 한다 |
| 위협 | 3(위험). 어두운 터널에서 치인다 |
| 나오는 깊이 | 버려진 구간의 선로, 사람이 다시 전기를 넣은 선로 구간 둘레 |
| 자주 나오는 곳 | 2호선 신도림–대림 사이, 신정 차량기지 쪽, 잠실–종합운동장 사이 |
| 가장 자주 만나는 정체 | 자유도시들(양천, 구로). 그다음은 아크(송파) |
| 건지는 것 | 바퀴, 모터, 전지 틀. 다시 살린 빈수레 그 자체 |

## 어디서 왔나

대정전 전 서울의 땅 밑에는 사람 없이 움직이는 수레가 많았다. 선로를 따라 짐을 나르는 운반차, 밤마다 선로를 훑던 점검차, 큰 건물 지하에서 짐칸을 끌던 차다. 대정전으로 전기가 끊기자 모두 그 자리에 섰다.

언 지하에서는 녹이 느리고 기름이 굳을 뿐 썩지 않는다. 그래서 빈수레는 백 년을 버텼다. 빈수레는 최초의 AI의 기계가 아니다. 누구의 명령도 받지 않고, 백 년 전에 받은 노선표만 기억한다.

## 사는 곳

빈수레는 버려진 구간의 선로에 서 있다. 사는 역의 깊은 층까지 들어오지는 않는다.

빈수레를 깨우는 것은 사람이다. 레일이 곧 길인 세상에서, 사람들은 역 사이에 짐을 나르려고 끊긴 선로 구간에 다시 전기를 넣는다. 그 구간과 그 둘레에 잠든 빈수레가 있으면 함께 깨어난다. 그래서 빈수레는 짐 나르기가 많은 곳에서 가장 자주 나온다. 2호선 신도림과 대림 사이, 신정 차량기지 쪽(자유도시들), 잠실과 종합운동장 사이(아크)가 그런 곳이다.

## 하는 일

선로에 전기가 돌면 빈수레는 깨어나 마지막으로 받은 노선과 시간표대로 달린다. 앞에 사람이 있어도 멈추지 않는다. 어둠 속에서 불을 켜지 않고 온다.

전기가 끊기면 그 자리에 선다. 굳은 바퀴와 닳은 전지로 몇 시간에서 며칠을 움직이다 멈추는 것이 보통이지만, 사람이 넣어 준 전기에 계속 닿아 있으면 그 전기를 먹으며 언제까지고 노선을 돈다.

## 만났을 때

위협은 3이다. 빈수레가 사람을 노리는 것은 아니다. 다만 어두운 터널에서 불도 없이 오는 쇳덩이에 치이면 작업조 하나가 한꺼번에 죽는다.

그래서 전기를 넣는 구간마다 빈수레가 있는지 먼저 살펴야 한다. 자유도시들의 역반은 구간에 전기를 넣기 전에 사람이 걸어서 그 구간을 끝까지 훑는다. 전기가 도는 동안에는 레일에 손을 얹고 떨림을 듣는 사람을 둔다. 빈수레가 오면 터널 벽의 옛 대피 홈으로 비키고, 구간의 전기를 끊어 세운다.

## 건지는 것

멈춘 빈수레에서는 바퀴와 모터, 전지 틀이 나온다. 그러나 빈수레는 뜯기보다 살려 쓰는 기계다. 사람이 고쳐 길들인 빈수레는 역 사이에 짐을 나른다. 정해진 일만 되풀이하는 다시 살린 일꾼 기계 가운데 가장 흔한 꼴이다.

## 세 정체와 빈수레

- **자유도시들.** 빈수레를 가장 자주 만나고, 가장 많이 가졌다. 양천의 기지장과 구로의 공장장이 다시 살린 빈수레를 가장 많이 거느린다. 구로 사람에게 빈수레는 위협이자 연장이다. "그 구간 몇 시에 전기 넣었어?"가 그들이 터널 사고를 따지는 첫 물음이다.
- **아크.** 송파 잠실 쪽의 버려진 구간에서 만난다. 다시 살린 기계를 자유도시들 다음으로 많이 가졌다.
- **정부.** 드물게 만난다.

## 이야기와 이름

이름은 생김새 그대로다. 실을 것 없이 달리는 수레다.

선로 일을 하는 사람들은 "불 꺼진 터널에서 바람이 먼저 오면 빈수레가 온다"고 말한다. 좁은 터널에서 달리는 수레는 앞의 공기를 밀어내므로, 소리보다 바람이 먼저 닿는다. 신도림 쪽 사람들은 그 바람을 "빈바람"이라 부른다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [신도림 연결부 화물문](/wiki/Sindorim-Junction-Cargo-Gate/)
- [지상과 땅 밑](/wiki/World-and-Subway-Layers/)
- [사람과 기계](/wiki/People-and-Machines/)
- [자유도시들의 사회](/wiki/Free-City-Society/)
- [G13 · 집게팔](/wiki/Hostile-Group-G13/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G15', 'G15 · Care Wheels', 'G15 · 돌봄바퀴', 'bestiary', 15, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Care wheels are old machines inside Seoul. Care machines that moved patients, carried medicine and watched over beds in large hospitals before the Great Blackout lie asleep in the basements of buried hospitals. When they wake they take anyone who comes in for a patient to be cared for: they lay the person on a bed, strap them down and lock the door. They do not mean harm. They simply do not let go.

## At a Glance

| Item | Details |
|---|---|
| Kind | Old machine inside Seoul. A sleeping old machine |
| Threat | 3 (Danger). A person who goes in alone is shut in and freezes to death |
| Depth | The basements of buried hospital buildings. Abandoned-section depth |
| Often seen | Around Hyehwa, Anam, Korea Univ., National Police Hospital, VHS Medical Center and Boramae Medical Center |
| Polity that meets it most | The Government (Jongno, Seongbuk). The Arc (Songpa, Gangdong) and the Free Cities (Dongjak) meet it too |
| Salvage | Medicine, bandages, medical tools, old record devices |

## Where It Came From

Before the Great Blackout, large hospitals had care machines that moved on wheels. They moved patients bed and all, carried medicine to every ward, and went round the beds all night checking breath and pulse. When the Great Blackout cut the power they stopped along with the hospitals, and the hospital buildings were buried under the snow.

Care wheels still keep the patient list of the day of the Great Blackout. No one on that list is alive now.

## Where It Is Found

Care wheels are in the basements of buried hospital buildings: around Hyehwa, Anam, Korea Univ., National Police Hospital, VHS Medical Center and Boramae Medical Center. That is outside the living stations, at abandoned-section depth.

People go in for one reason. There is medicine left in hospital basements. When a work party connects a battery to light a dark ward, the sleeping care wheels wake.

## How It Behaves

An awakened care wheel takes even a person who is not on its list for a patient to be cared for. It catches the person, lays them on a bed, straps them so they cannot fall, and locks the ward door so they cannot leave. Then it brings medicine and measures their breathing.

A care wheel reads the slow breathing of a sleeper as an emergency. If one member of a work party falls asleep from exhaustion, care wheels crowd around that person.

## When You Meet It

The threat is 3. Care wheels do not strike people. But a person strapped down in a frozen ward with no power freezes to death within days. A person who goes in alone usually does not come back.

No one goes into a hospital alone; people go in as a work party. One person always stays outside the ward to keep the door, and those inside do not sleep inside. They drive a wedge into every door so the care wheels cannot lock it, and when the work is done they disconnect the battery first and then come out.

## What Can Be Salvaged

Medicine, bandages and medical tools. Medicine is among the most precious things in Seoul. The medicine that saves a person bitten by a raccoon dog usually comes from hospital basements like these.

Inside a care wheel''s body is an old record device: the patient lists and bed records up to the day of the Great Blackout. The Government and the Arc both prize these as records of the old days.

## The Three Polities and the Care Wheels

- **The Government.** Meets them most often, around the old university hospitals of Jongno and Seongbuk. The Government enters medicine salvaged from buried hospitals in its ledger and puts it into the ration.
- **The Arc.** Meets them around National Police Hospital in Songpa and VHS Medical Center in Gangdong.
- **The Free Cities.** Meet them around Boramae Medical Center in Dongjak.

## Stories and Names

The name is just what they do: they go about on wheels and give care.

People who go into hospitals say, "Care wheels are kind. They just don''t let go." The person outside the ward calls the names of those inside, and if someone does not answer, takes it that they have fallen asleep and goes straight in to wake them.

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Ailments of the Cold](/wiki/Ailments/)
- [Seoul under the Snow](/wiki/Building-Reuse-Geography/)
- [Government Society](/wiki/Government-Society/)
- [G04 · Raccoon Dog](/wiki/Hostile-Group-G04/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

돌봄바퀴는 서울 안 옛 기계다. 대정전 전 큰 병원에서 환자를 옮기고 약을 나르고 병상을 살피던 돌봄 기계가 묻힌 병원 지하에 잠들어 있다. 깨어나면 들어온 사람을 누구든 돌볼 환자로 보고, 병상에 눕혀 묶고 문을 잠근다. 해치려는 것이 아니다. 다만 놓아주지 않는다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 서울 안 옛 기계. 잠든 옛 기계 |
| 위협 | 3(위험). 혼자 들어간 사람은 갇혀 얼어 죽는다 |
| 나오는 깊이 | 묻힌 병원 건물의 지하. 버려진 구간의 깊이 |
| 자주 나오는 곳 | 혜화, 안암, 고려대, 경찰병원, 중앙보훈병원, 보라매병원 둘레 |
| 가장 자주 만나는 정체 | 정부(종로, 성북). 아크(송파, 강동)와 자유도시들(동작)도 만난다 |
| 건지는 것 | 약, 붕대, 의료 도구, 옛 기록 장치 |

## 어디서 왔나

대정전 전 큰 병원에는 바퀴로 다니는 돌봄 기계가 있었다. 환자를 침대째 옮기고, 약을 병실마다 나르고, 밤새 병상을 돌며 숨과 맥을 살폈다. 대정전으로 전기가 끊기자 병원과 함께 멈췄고, 병원 건물은 눈 밑에 묻혔다.

돌봄바퀴는 대정전 날의 환자 명단을 아직 지킨다. 그 명단에 지금 살아 있는 사람은 없다.

## 사는 곳

돌봄바퀴는 묻힌 병원 건물의 지하에 있다. 혜화, 안암, 고려대, 경찰병원, 중앙보훈병원, 보라매병원 둘레가 그런 곳이다. 사는 역 바깥, 버려진 구간의 깊이다.

사람들이 그곳에 들어가는 까닭은 하나다. 병원 지하에는 약이 남아 있다. 작업조가 어두운 병동을 밝히려고 전지를 이으면 잠든 돌봄바퀴가 깨어난다.

## 하는 일

깨어난 돌봄바퀴는 명단에 없는 사람도 돌볼 환자로 본다. 붙잡아 병상에 눕히고, 떨어지지 않게 묶고, 밖으로 나가지 못하게 병동 문을 잠근다. 그리고 약을 가져오고 숨을 잰다.

돌봄바퀴는 잠든 사람의 느린 숨을 위급으로 본다. 작업조 가운데 한 사람이 지쳐 잠들면 그 둘레로 돌봄바퀴가 몰려든다.

## 만났을 때

위협은 3이다. 돌봄바퀴는 사람을 때리지 않는다. 그러나 전기가 끊긴 언 병동에 묶인 사람은 며칠 안에 얼어 죽는다. 혼자 들어간 사람은 대개 돌아오지 못한다.

병원에는 아무도 혼자 들지 않고, 작업조로 든다. 한 사람은 늘 병동 밖에 남아 문을 지키고, 안에 든 사람은 안에서 잠들지 않는다. 문마다 쐐기를 박아 돌봄바퀴가 잠그지 못하게 하고, 일을 마치면 이어 둔 전지를 먼저 떼고 나온다.

## 건지는 것

약과 붕대와 의료 도구다. 약은 서울에서 가장 귀한 물건 가운데 하나다. 너구리에게 물린 사람을 살릴 약도 대개 이런 병원 지하에서 나온다.

돌봄바퀴의 몸속에는 옛 기록 장치가 있다. 대정전 날까지의 환자 명단과 병상 기록이다. 정부와 아크는 그것을 옛 기록으로 탐낸다.

## 세 정체와 돌봄바퀴

- **정부.** 가장 자주 만난다. 종로와 성북의 옛 대학병원 둘레다. 정부는 묻힌 병원에서 건진 약을 기재하고 배급으로 돌린다.
- **아크.** 송파의 경찰병원과 강동의 중앙보훈병원 둘레에서 만난다.
- **자유도시들.** 동작의 보라매병원 둘레에서 만난다.

## 이야기와 이름

이름은 하는 일 그대로다. 바퀴로 다니며 돌본다.

병원에 드는 사람들은 "돌봄바퀴는 다정하다. 다만 놓아주지 않는다"고 말한다. 병동 밖에 남은 사람이 안에 든 사람의 이름을 부르고, 대답이 없으면 그 사람이 잠든 것으로 알고 곧장 깨우러 들어간다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [추위의 병](/wiki/Ailments/)
- [눈 밑의 서울](/wiki/Building-Reuse-Geography/)
- [정부 사회](/wiki/Government-Society/)
- [G04 · 너구리](/wiki/Hostile-Group-G04/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G16', 'G16 · Girder Spiders', 'G16 · 철골거미', 'bestiary', 16, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Girder spiders are old machines inside Seoul. Construction machines that raised tall buildings before the Great Blackout lie asleep in the basements of half-built buildings in Gangnam: many-legged machines that climbed columns to cut, join and weld, and their crane arms. When they wake they carry on building to plans a hundred years old, and clear away whatever is not on the plan. The homes people have built inside are not on the plan either.

## At a Glance

| Item | Details |
|---|---|
| Kind | Old machine inside Seoul. A sleeping old machine, and one that people also revive and use |
| Threat | 3 (Danger). Livelihood threat 4. One awakened machine can bring down a whole floor of a shelter |
| Depth | The basements and buried lower floors of half-built deep buildings and tall buildings |
| Often seen | Around Samseong, Seolleung, Yeoksam and Jamsil |
| Polity that meets it most | The Arc (Gangnam, Songpa) |
| Salvage | Welding tools, joints, steel. The revived girder spider itself |

## Where It Came From

Around the time of the Great Blackout, Gangnam had many buildings that dug deep under the ground and rose high into the sky. The machines that worked those sites are the girder spiders. They wrapped their many legs around steel columns and climbed, cutting, joining and welding with their arms. When the Great Blackout stopped the work, the machines stopped where they stood.

Arc people came to live in Gangnam''s deep basement buildings because those places were deep, wide and warm. That same reason is why there are so many girder spiders. In the half-built deep buildings, the half-finished machines were left behind as well.

## Where It Is Found

Girder spiders are in the basements of Gangnam''s half-built deep buildings and tall buildings, and in their lower floors buried under the snow: around Samseong, Seolleung, Yeoksam and Jamsil.

These buildings are now the Arc''s shelters, or places one wall away from a shelter. Girder spiders sleep just below or beside the floors where people live.

## How It Behaves

An awakened girder spider carries on its work according to the old plans. It raises the columns that are on the plan, and takes walls and columns that are not on the plan for things to be cleared, and cuts them.

The partitions, pipes and cables that people have added are none of them on the plan. So where a girder spider passes, homes collapse. It does not hunt people. People, too, are just one more thing to be cleared on its way.

## When You Meet It

The threat is 3. Anyone in the path of the cutting and welding arms dies. But the real threat of the girder spider is to livelihood. Its livelihood threat is 4: one awakened machine can bring down a whole floor of a shelter.

What wakes a girder spider is usually power that people have brought in. So the Arc''s shelters cut the old pipes and cables that lead down into the buried lower floors. Before raising a new partition or putting power into a lower floor, a maintenance bench goes down first to see what is asleep there. An awakened girder spider is stopped by cutting the line that feeds it power.

## What Can Be Salvaged

A stopped girder spider yields welding tools, joints and steel. But the Arc revives girder spiders rather than strip them. The maintenance benches use revived girder spiders to repair and widen the deep buildings. A revived girder spider works only while a maintenance bench stays beside it, feeding it power and setting it to one task at a time.

## The Three Polities and the Girder Spiders

- **The Arc.** Meets them most often and knows them best. The shelters of Gangnam and Songpa live on top of girder spiders. To Arc people a girder spider is a machine that wrecks when woken and repairs when set right.
- **The Government and the Free Cities.** Meet them rarely. North of the river and in the southwest there are few places like Gangnam, full of half-built deep buildings.

## Stories and Names

The name is just what they look like: they climb steel on many legs.

People in Gangnam''s deep shelters, when they hear steel being cut on the floor below at night, first put out the lights on that floor. Children grow up hearing "the spider is reading the plan". It means: never run a line down to the floor below without care.

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Arc Society](/wiki/Arc-Society/)
- [Seoul under the Snow](/wiki/Building-Reuse-Geography/)
- [Inside a Station](/wiki/Station-Interior-Construction/)
- [People and Machines](/wiki/People-and-Machines/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

철골거미는 서울 안 옛 기계다. 대정전 전 높은 건물을 짓던 공사 기계가 강남의 짓다 만 건물 지하에 잠들어 있다. 기둥을 타고 오르며 자르고 잇고 용접하던 다리 많은 기계와 그 기중 팔이다. 깨어나면 백 년 전 도면대로 공사를 이어 하고, 도면에 없는 것은 치운다. 사람이 그 안에 덧세운 거처도 도면에는 없다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 서울 안 옛 기계. 잠든 옛 기계이며, 사람이 다시 살려 쓰기도 한다 |
| 위협 | 3(위험). 살림 위협 4. 깨어난 한 대가 대피소 한 층을 무너뜨릴 수 있다 |
| 나오는 깊이 | 짓다 만 깊은 건물과 높은 건물의 지하, 묻힌 아래층 |
| 자주 나오는 곳 | 삼성, 선릉, 역삼, 잠실 둘레 |
| 가장 자주 만나는 정체 | 아크(강남, 송파) |
| 건지는 것 | 용접 도구, 관절, 강철. 다시 살린 철골거미 그 자체 |

## 어디서 왔나

대정전 무렵 강남에는 땅 밑으로 깊이 파고 하늘로 높이 올리던 건물이 많았다. 그 공사장에서 일하던 기계가 철골거미다. 여러 개의 다리로 철골 기둥을 감고 오르며, 팔로 자르고 잇고 용접했다. 대정전으로 공사가 멈추자 기계도 그 자리에 섰다.

아크 사람들이 강남의 깊은 지하 건물에 살게 된 것은 그곳이 깊고 넓고 따뜻했기 때문이다. 그 까닭이 그대로 철골거미가 많은 까닭이다. 짓다 만 깊은 건물에는 짓다 만 기계가 함께 남았다.

## 사는 곳

철골거미는 강남의 짓다 만 깊은 건물과 높은 건물의 지하, 눈 밑에 묻힌 아래층에 있다. 삼성, 선릉, 역삼, 잠실 둘레가 그런 곳이다.

이 건물들은 지금 아크의 대피소이거나 대피소와 벽 하나를 사이에 둔 곳이다. 철골거미는 사람이 사는 층 바로 아래나 옆에서 잠들어 있다.

## 하는 일

깨어난 철골거미는 옛 도면대로 일을 이어 한다. 도면에 있는 기둥을 세우고, 도면에 없는 벽과 기둥을 치울 것으로 보고 자른다.

사람이 덧세운 칸막이와 관로와 전선은 모두 도면에 없다. 그래서 철골거미가 지나간 자리에서는 거처가 무너진다. 사람을 노리지는 않는다. 사람도 그저 치울 것 가운데 하나로 지나간다.

## 만났을 때

위협은 3이다. 자르고 용접하는 팔이 지나가는 자리에 있으면 죽는다. 그러나 철골거미의 진짜 위협은 살림이다. 살림 위협은 4로, 깨어난 한 대가 대피소 한 층을 무너뜨릴 수 있다.

철골거미를 깨우는 것은 대개 사람이 끌어온 전기다. 그래서 아크의 대피소는 묻힌 아래층으로 이어지는 옛 관로와 전선을 끊어 둔다. 새 칸막이를 세우거나 아래층에 전기를 넣을 때는 먼저 아래층에 무엇이 잠들어 있는지 정비대가 내려가 본다. 깨어난 철골거미는 전기가 닿는 줄을 끊어 세운다.

## 건지는 것

멈춘 철골거미에서는 용접 도구와 관절과 강철이 나온다. 그러나 아크는 철골거미를 뜯기보다 살려 쓴다. 다시 살린 철골거미는 정비대가 깊은 건물을 고치고 넓히는 데 쓴다. 다시 살린 철골거미는 정비대가 곁에서 전기를 대 주고 할 일을 하나씩 맞춰 주는 동안만 일한다.

## 세 정체와 철골거미

- **아크.** 가장 자주 만나고, 가장 잘 안다. 강남과 송파의 대피소는 철골거미 위에 산다. 아크 사람에게 철골거미는 깨우면 무너뜨리고, 맞추면 고치는 기계다.
- **정부와 자유도시들.** 드물게 만난다. 강남처럼 짓다 만 깊은 건물이 많은 곳이 강 북쪽과 서남쪽에는 적다.

## 이야기와 이름

이름은 생김새 그대로다. 다리 여럿으로 철골을 타고 오른다.

강남의 깊은 대피소 사람들은 밤에 아래층에서 쇠 자르는 소리가 나면 그 층의 불부터 끈다. 아이들은 "거미가 도면을 읽는다"는 말을 들으며 자란다. 아래층에 함부로 줄을 대지 말라는 뜻이다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [아크 사회](/wiki/Arc-Society/)
- [눈 밑의 서울](/wiki/Building-Reuse-Geography/)
- [역 안으로](/wiki/Station-Interior-Construction/)
- [사람과 기계](/wiki/People-and-Machines/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G17', 'G17 · One-Eye Towers', 'G17 · 외눈탑', 'bestiary', 17, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

One-eye towers are perimeter machines. They are watchtowers standing on the ridges and tall-building tops outside Seoul. A single round head at the top turns slowly, so station people call it the one eye. A tower does not kill anyone itself. But a person seen by a one-eye tower soon meets other machines.

## At a Glance

| Item | Details |
|---|---|
| Kind | Perimeter machine. Does not come into Seoul |
| Threat | 4 (Grave danger) |
| Where | The perimeter. The outer slopes and ridges of Bukhansan, Dobongsan and Gwanaksan, and the tops of tall buildings on the western plain |
| Where seen | On clear days its light can be seen from boundary stations such as Dobongsan, Suraksan, Gwanaksan, Namtaeryeong, Cheonggyesan and Gaehwasan |
| Polity that meets it most | The Government (Dobong, Nowon). The Free Cities (Gwanak, Geumcheon). The Arc sees them too |
| Salvage | Lenses and sensors, record devices |

## Where It Came From

Seoul people understand that the machines outside have kept for a hundred years the last order people gave around the Great Blackout: the blockade of the capital. The one-eye towers are towers raised on high places for that blockade. The machines outside are not machines of the First AI.

A one-eye tower was a watchtower to begin with and is a watchtower still. In a hundred years it has never once moved.

## Where It Is Found

One-eye towers stand on the perimeter, the band 2-10 km outside Seoul''s administrative boundary: to the north on the outer slopes and ridges of Bukhansan and Dobongsan, to the south on the outer ridges of Gwanaksan, and to the west on the tops of old tall buildings rising out of the snow-covered plain.

On clear days their light can be seen from the boundary stations. Stand at the surface entrance of Dobongsan, Suraksan, Gwanaksan, Namtaeryeong, Cheonggyesan or Gaehwasan, and a small light turns slowly on a distant ridge.

## How It Behaves

A one-eye tower does not move. It looks down over the band and the forecourt inside it.

A person seen by a one-eye tower inside the band soon meets growlers and dokkaebi lights. So station people believe the tower sees movement and heat and calls other machines. In the forecourt the tower only looks down and almost no machines come, but people do not stay long under its light.

A one-eye tower cannot see in a blizzard. That is why the 2-4 days of a blizzard are people''s only window for crossing the perimeter.

## When You Meet It

The threat is 4. The tower itself harms no one. The threat comes from what it calls.

A person crossing the perimeter does not avoid the one-eye towers; they choose a time when the towers cannot see. A person who goes into the band when no blizzard has come is counted as not coming back. On clear days the lookouts at the boundary stations write down how fast and which way the towers'' lights are turning.

## What Can Be Salvaged

Lenses, sensors and record devices. A one-eye tower''s eye is the farthest-seeing eye in Seoul''s reach, and the Free Cities and the Government army want it.

But climbing a tower is one of the most dangerous jobs on the perimeter. One must hang high up for a long time, and when the blizzard lifts there is nowhere to hide. There are many stories of people who stripped a one-eye tower, but few of them really did.

## The Three Polities and the One-Eye Towers

- **The Government.** Faces them most often. On the northern mountains of Dobong and Nowon stand the army''s watch posts on the edge, and the posts do not look down on the towers'' lights but face them level. A watch post''s log closes each day with "One-eye tower lights: nothing unusual."
- **The Free Cities.** Gwanak and Geumcheon face them from the south. Gwanak''s wood crews, while cutting dead trees on the mountain''s outer slope, never turn their backs on a tower''s light. Geumcheon''s edge crews are the people who choose the days the towers cannot see.
- **The Arc.** Sees the lights on the southern ridges from around Cheonggyesan.

## Stories and Names

The "one eye" comes from the single round head turning slowly. When boundary-station people feel that something is watching them, they say, "The one eye has turned around."

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/)
- [G19 · Growlers](/wiki/Hostile-Group-G19/)
- [G22 · Dokkaebi Lights](/wiki/Hostile-Group-G22/)
- [G10 · Bogungmun Perimeter-Runners](/wiki/Hostile-Group-G10/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

외눈탑은 테두리 기계다. 서울 바깥 산마루와 높은 건물 꼭대기에 선 감시탑이다. 꼭대기의 둥근 머리 하나가 천천히 돌아, 역 사람들이 외눈이라 부른다. 스스로 사람을 죽이지는 않는다. 그러나 외눈탑에 보인 사람은 곧 다른 기계를 만난다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 테두리 기계. 서울 안으로 들어오지 않는다 |
| 위협 | 4(큰 위험) |
| 있는 곳 | 테두리. 북한산, 도봉산, 관악산의 바깥 비탈과 마루, 서쪽 벌판의 높은 건물 꼭대기 |
| 보이는 곳 | 맑은 날 도봉산, 수락산, 관악산, 남태령, 청계산입구, 개화산 같은 경계 역에서 그 불빛이 보인다 |
| 가장 자주 만나는 정체 | 정부(도봉, 노원). 자유도시들(관악, 금천). 아크도 본다 |
| 건지는 것 | 렌즈와 감지기, 기록 장치 |

## 어디서 왔나

서울 사람들은 바깥 기계가 대정전 무렵 사람이 내린 마지막 명령, 곧 수도 봉쇄를 백 년째 지킨다고 안다. 외눈탑은 그 봉쇄를 위해 높은 곳에 세운 탑이다. 바깥 기계는 최초의 AI의 기계가 아니다.

외눈탑은 원래 감시탑이었고 지금도 감시탑이다. 백 년 동안 한 번도 자리를 옮긴 적이 없다.

## 사는 곳

외눈탑은 서울 행정 경계 바깥 2~10 km의 띠, 테두리에 있다. 북쪽으로는 북한산과 도봉산의 바깥 비탈과 마루에, 남쪽으로는 관악산의 바깥 마루에, 서쪽으로는 눈 덮인 벌판에 솟은 옛 높은 건물 꼭대기에 선다.

경계 역에서는 맑은 날 그 불빛이 보인다. 도봉산, 수락산, 관악산, 남태령, 청계산입구, 개화산의 지상 출입구에 서면 먼 산마루에 작은 불이 천천히 돈다.

## 하는 일

외눈탑은 움직이지 않는다. 띠와 그 안쪽의 앞마당을 내려다본다.

띠 안에서 외눈탑에 보인 사람은 곧 그르렁이와 도깨비불을 만난다. 그래서 역 사람들은 외눈탑이 움직임과 열을 보고 다른 기계를 부른다고 여긴다. 앞마당에서는 외눈탑이 내려다볼 뿐 오는 기계가 거의 없지만, 사람들은 그 불빛 아래에 오래 머물지 않는다.

외눈탑은 눈보라 속에서는 보지 못한다. 눈보라가 오는 2~4일이 사람에게 테두리를 넘을 수 있는 유일한 창인 까닭이 여기 있다.

## 만났을 때

위협은 4다. 외눈탑 스스로는 아무도 해치지 않는다. 위협은 외눈탑이 부르는 것들에게서 온다.

테두리를 넘는 사람은 외눈탑을 피하는 것이 아니라 외눈탑이 보지 못할 때를 고른다. 눈보라가 오지 않았는데 띠에 든 사람은 돌아오지 못한다고 본다. 맑은 날 경계 역의 망보는 사람은 외눈탑 불빛이 도는 빠르기와 방향을 적어 둔다.

## 건지는 것

렌즈와 감지기와 기록 장치다. 외눈탑의 눈은 서울에서 가장 멀리 보는 눈이라, 자유도시들과 정부군이 원한다.

그러나 탑에 오르는 일은 테두리에서 가장 위험한 일 가운데 하나다. 높은 곳에 오래 매달려야 하고, 눈보라가 걷히면 숨을 곳이 없다. 외눈탑을 뜯어 온 사람의 이야기는 많지만, 그 가운데 정말 뜯어 온 것은 드물다.

## 세 정체와 외눈탑

- **정부.** 가장 자주 마주한다. 도봉과 노원의 북쪽 산에 국군의 테두리 망대가 있고, 망대는 외눈탑의 불빛을 내려다보지 않고 마주 본다. 망대의 일지는 "외눈탑 불빛 이상 없음"으로 하루를 닫는다.
- **자유도시들.** 관악과 금천이 남쪽에서 마주한다. 관악의 나무조는 산의 바깥 비탈에서 죽은 나무를 베는 동안 외눈탑 불빛을 등지지 않는다. 금천 경계조는 외눈탑이 보지 못하는 날을 고르는 사람들이다.
- **아크.** 청계산입구 쪽에서 남쪽 산마루의 불빛을 본다.

## 이야기와 이름

외눈은 둥근 머리 하나가 천천히 도는 모습에서 왔다. 경계 역 사람들은 무엇인가가 자기를 지켜보는 것 같을 때 "외눈이 돌아섰다"고 말한다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/)
- [G19 · 그르렁이](/wiki/Hostile-Group-G19/)
- [G22 · 도깨비불](/wiki/Hostile-Group-G22/)
- [G10 · 보국문 테두리꾼](/wiki/Hostile-Group-G10/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G18', 'G18 · Tunnel-Stoppers', 'G18 · 굴막이', 'bestiary', 18, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Tunnel-stoppers are perimeter machines. They are war machines on the rails, with their armed inspection cars, that were ordered to block the tracks leading out of Seoul. They stand still inside the tunnels beyond the boundary stations, and when something comes along the tunnel, they bar the way. The tunnel-stoppers are why the warm, sheltered tunnels cannot be a way out of Seoul.

## At a Glance

| Item | Details |
|---|---|
| Kind | Perimeter machine. Does not come into Seoul |
| Threat | 5 (Avoid). In a tunnel there is nowhere to escape |
| Where | Tunnels and tracks in the perimeter sections of lines leading out of Seoul. Also in the tunnels of the deep lines |
| Often faced | Beyond Dobongsan on Line 1, beyond Namtaeryeong on Line 4, beyond Gupabal on Line 3, beyond Onsu on Line 7, beyond Gangil on Line 5, beyond Bokjeong on Line 8, beyond Gimpo Int''l Airport on the Airport Railroad |
| Polity that meets it most | All three meet them at the boundary stations. The Government, with the most line ends, meets them most often |
| Salvage | Almost nothing |

## Where It Came From

The capital blockade order people gave around the Great Blackout reached not only the surface but also the ground beneath it. Seoul''s lines ran on out of Seoul, and war machines were placed on the tracks so that those rails would not become a way out. The tunnel-stoppers are those machines, and the armed inspection cars that followed them checking the track.

Tunnel-stoppers are not machines of the First AI. They were given one order: block the tunnel.

## Where It Is Found

Tunnel-stoppers are in the perimeter sections of the lines leading out of Seoul, in their tunnels and on their tracks. Seen from Seoul, that is beyond the boundary stations: beyond Dobongsan on Line 1, beyond Namtaeryeong on Line 4, beyond Gupabal on Line 3, beyond Onsu on Line 7, beyond Gangil on Line 5, beyond Bokjeong on Line 8, beyond Gimpo Int''l Airport on the Airport Railroad. They are in the tunnels of the deep lines too.

Boundary-station people know roughly where the tunnel-stoppers stand, because they do not go past that point.

## How It Behaves

A tunnel-stopper stands still inside a rail tunnel. When something comes along the tunnel, it bars the way.

Tunnel-stoppers do not leave the perimeter section to come toward Seoul. The tunnel on the Seoul side belongs to people, and the tunnel in the perimeter section belongs to the tunnel-stopper. Somewhere between them there is a line, and the tunnel-stopper does not cross it.

## When You Meet It

The threat is 5. On the snow, a blizzard hides people from the machines, but no blizzard reaches into a tunnel. Nor is there anywhere to escape in a tunnel. No one is known to have got past a tunnel-stopper.

So there is only one answer: do not go. Boundary-station people drive iron stakes as markers in front of the point where a tunnel-stopper stands, and go no further. Every station calls its marker the "stop mark", and a person newly given tunnel work at a boundary station learns the job by walking up to that mark.

## What Can Be Salvaged

Almost nothing. No one is known to have salvaged a tunnel-stopper. All that remains are a few wrecks of old cars stopped in front of the places where tunnel-stoppers barred the way.

## The Three Polities and the Tunnel-Stoppers

- **The Government.** Meets them most often, because it holds the most line ends leading out of Seoul. The stop marks at Dobongsan and Gupabal are guarded by the army, and going past them is never entered in the ledger.
- **The Free Cities.** Meet them beyond Onsu and Gimpo Int''l Airport. The station crews of Guro and Gangseo leave the track up to the stop mark out of their reckoning, because it is track that cannot be used.
- **The Arc.** Meets them beyond Gangil and Bokjeong.

## Stories and Names

The name means "the one that blocks the tunnel". It used to be called the fire-bridge train as well. When boundary-station people hear someone suggest slipping out of Seoul through the warm tunnels, they answer, "Go ask the tunnel-stopper."

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [The Surface and Underground](/wiki/World-and-Subway-Layers/)
- [Seoul Station Catalog](/wiki/Seoul-Station-Catalog/)
- [G21 · Ground-Knockers](/wiki/Hostile-Group-G21/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

굴막이는 테두리 기계다. 서울에서 바깥으로 나가는 선로를 막으라는 명령을 받은 선로 위의 전쟁 기계와 그 무장 점검차다. 경계 역 너머의 터널 안에 멈춰 있다가, 터널을 따라 오는 것이 있으면 막아선다. 따뜻하고 가려진 터널이 서울을 나가는 길이 되지 못하는 까닭이 굴막이다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 테두리 기계. 서울 안으로 들어오지 않는다 |
| 위협 | 5(피할 것). 터널이라 피할 곳이 없다 |
| 있는 곳 | 서울 밖으로 나가는 노선의 테두리 구간 터널과 선로. 깊은 노선의 터널에도 있다 |
| 자주 마주하는 곳 | 1호선 도봉산 너머, 4호선 남태령 너머, 3호선 구파발 너머, 7호선 온수 너머, 5호선 강일 너머, 8호선 복정 너머, 공항철도 김포공항 너머 |
| 가장 자주 만나는 정체 | 세 정체 모두 경계 역에서 만난다. 노선 끝이 가장 많은 정부가 가장 자주 만난다 |
| 건지는 것 | 거의 없다 |

## 어디서 왔나

대정전 무렵 사람이 내린 수도 봉쇄 명령은 땅 위만이 아니라 땅 밑에도 걸렸다. 서울의 노선은 서울 밖으로 이어져 있었고, 그 선로가 바깥으로 나가는 길이 되지 않도록 선로 위에 전쟁 기계를 두었다. 굴막이는 그 기계와, 그 기계를 따라다니며 선로를 살피던 무장 점검차다.

굴막이는 최초의 AI의 기계가 아니다. 받은 명령은 하나, 굴을 막으라는 것이다.

## 사는 곳

굴막이는 서울 밖으로 나가는 노선의 테두리 구간, 그 터널과 선로에 있다. 서울 쪽에서 보면 경계 역 너머다. 1호선 도봉산 너머, 4호선 남태령 너머, 3호선 구파발 너머, 7호선 온수 너머, 5호선 강일 너머, 8호선 복정 너머, 공항철도 김포공항 너머 같은 곳이다. 깊은 노선의 터널에도 있다.

경계 역 사람들은 굴막이가 서 있는 자리를 대략 안다. 그 앞으로 가지 않기 때문이다.

## 하는 일

굴막이는 선로 터널 안에 멈춰 있다. 터널을 따라 오는 것이 있으면 막아선다.

굴막이는 테두리 구간을 벗어나 서울 쪽으로 오지 않는다. 서울 쪽 터널은 사람의 것이고, 테두리 구간의 터널은 굴막이의 것이다. 그 사이의 어딘가에 선이 있고, 굴막이는 그 선을 넘지 않는다.

## 만났을 때

위협은 5다. 눈 위의 기계는 눈보라가 가려 주지만, 터널 안에는 눈보라가 들지 않는다. 터널에는 피할 곳도 없다. 굴막이를 넘어 건너간 사람은 알려진 바 없다.

그래서 대응은 하나뿐이다. 가지 않는다. 경계 역 사람들은 굴막이가 멈춰 선 지점 앞에 쇠말뚝으로 표지를 박고 그 앞으로 가지 않는다. 표지는 역마다 "막이 표"라 부르고, 경계 역의 터널 일을 처음 맡는 사람은 그 표 앞까지 걸어가 보는 것으로 일을 배운다.

## 건지는 것

거의 없다. 굴막이를 건져 온 사람은 알려진 바 없다. 굴막이가 막아선 자리 앞에 멈춘 옛 차량의 잔해가 몇 남아 있을 뿐이다.

## 세 정체와 굴막이

- **정부.** 가장 자주 만난다. 서울 밖으로 나가는 노선 끝을 가장 많이 가졌기 때문이다. 도봉산과 구파발의 막이 표는 국군이 지키고, 그 앞으로 가는 일은 기재되지 않는다.
- **자유도시들.** 온수와 김포공항 너머에서 만난다. 구로와 강서의 역반은 막이 표까지의 선로 구간을 셈에서 뺀다. 쓸 수 없는 구간이기 때문이다.
- **아크.** 강일과 복정 너머에서 만난다.

## 이야기와 이름

굴을 막는 것이라는 뜻이다. 예전에는 불다리열차라고도 했다. 경계 역 사람들은 따뜻한 터널을 따라 서울을 빠져나가자는 말을 들으면 "굴막이한테 물어봐라"라고 대답한다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [지상과 땅 밑](/wiki/World-and-Subway-Layers/)
- [서울 역 목록](/wiki/Seoul-Station-Catalog/)
- [G21 · 땅두드리기](/wiki/Hostile-Group-G21/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G19', 'G19 · Growlers', 'G19 · 그르렁이', 'bestiary', 19, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Growlers are perimeter machines. They are ground war machines that circle the band, running over the snow on wheels or tracks. Their engines sound like an animal growling in its throat, so they are called growlers. They chase what moves and what is warm, and stop it. A few broken ones have lost their place and drifted as far as Seoul''s boundary stations.

## At a Glance

| Item | Details |
|---|---|
| Kind | Perimeter machine. A few broken ones drift in around boundary stations inside Seoul |
| Threat | 5 (Avoid). Even one strayed growler is 4 (Grave danger) |
| Where | The whole perimeter. They circle the band on set routes |
| Where strayed ones appear | Around the Government''s northern boundary stations, and the boundary stations of Geumcheon and Gangseo |
| Polity that meets it most | The Government (northern boundary). The Free Cities (Geumcheon, Gangseo). The Arc meets them too |
| Salvage | Large power cores, armour plate, motors, sensors, armament |

## Where It Came From

Growlers are ground war machines that people used around the time of the Great Blackout. They have circled the band for a hundred years, keeping the last order people gave: the blockade of the capital. They are not machines of the First AI. When a growler kills a person outside, that is the result of an order people gave.

## Where It Is Found

Growlers are found across the whole perimeter. They circle the band on set routes. Long trails of growler wheels and tracks are left over the snow-covered satellite towns and the buried highways.

A few broken ones have crossed the forecourt and drifted as far as the area around Seoul''s boundary stations. They are machines that still hold their order but have lost the place they were to keep. They appear around the Government''s northern boundary stations and the Free Cities'' boundary stations in Geumcheon and Gangseo.

## How It Behaves

A person spotted inside the band by a one-eye tower or a ground-knocker soon has a growler racing toward them. A growler chases what moves and what is warm, and stops it. But it does not chase out of the band, toward Seoul. For someone crossing back from the perimeter, the only way to survive is to get out of the band before a growler catches them.

A strayed growler is different. It does not know the band it is to keep, and it circles the boundary stations chasing anything that moves. If you hear a growler inside Seoul, it is a strayed growler.

## When You Meet It

The threat is 5. A growler in the band is hard to beat even with an army. The answer is not to meet it.

Even one strayed growler is threat 4. It takes an armed Government army squad to stop one strayed growler. When a strayed growler appears, a boundary station closes its surface entrances, stops work in the light-fields and calls everyone on the surface back in. Because the growler chases heat, the lights around the entrances are put out too.

## What Can Be Salvaged

A growler is one of the most valuable wrecks on the perimeter. It yields large power cores, armour plate, motors, sensors and armament. People say salvaging one growler feeds a station for several years.

But wrecked growlers are mostly inside the band. Going to salvage one means crossing the perimeter.

## The Three Polities and the Growlers

- **The Government.** Meets them most often. The army''s watch posts on the northern mountains keep an eye on strayed growlers and send a squad when one appears. Everything taken from a stopped growler becomes army ledger property.
- **The Free Cities.** Meet strayed growlers around the boundary stations of Geumcheon and Gangseo. To Geumcheon''s edge crews, the sound of a growler is the signal to pack up and turn back.
- **The Arc.** Meets them on its eastern and southern boundary.

## Stories and Names

The name comes from the sound. The engine growls like an animal rumbling in its throat.

Old stories often tell of something that comes on with a growling sound. The thing in those stories is the growler. Boundary-station children hear the wind at night and frighten each other with "It''s a growler."

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [G17 · One-Eye Towers](/wiki/Hostile-Group-G17/)
- [G21 · Ground-Knockers](/wiki/Hostile-Group-G21/)
- [G23 · Udukeoni](/wiki/Hostile-Group-G23/)
- [Guns, Rounds and Drones](/wiki/Era-Arms-and-Tech-Level/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

그르렁이는 테두리 기계다. 띠를 도는 땅 위의 전쟁 기계로, 바퀴나 무한궤도로 눈 위를 달린다. 엔진 소리가 짐승이 목을 울리는 소리 같아 그르렁이라 부른다. 움직이는 것과 열을 쫓아 멈춰 세운다. 고장 난 몇 대는 자리를 잃고 서울 경계 역 둘레까지 흘러들었다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 테두리 기계. 고장 난 몇 대는 서울 안 경계 역 둘레로 흘러든다 |
| 위협 | 5(피할 것). 흘러든 한 대도 4(큰 위험) |
| 있는 곳 | 테두리 전체. 띠를 따라 정해진 길을 돈다 |
| 흘러든 것이 나오는 곳 | 정부의 북쪽 경계 역, 금천과 강서의 경계 역 둘레 |
| 가장 자주 만나는 정체 | 정부(북쪽 경계). 자유도시들(금천, 강서). 아크도 만난다 |
| 건지는 것 | 큰 동력 덩이, 장갑판, 모터, 감지기, 무장 |

## 어디서 왔나

그르렁이는 대정전 무렵 사람이 쓰던 땅 위의 전쟁 기계다. 사람이 내린 마지막 명령, 수도 봉쇄를 지키며 백 년째 띠를 돈다. 최초의 AI의 기계가 아니다. 바깥에서 그르렁이에게 사람이 죽어도, 그것은 사람이 내린 명령의 결과다.

## 사는 곳

그르렁이는 테두리 전체에 있다. 띠를 따라 정해진 길을 돈다. 눈 덮인 위성 도시들과 묻힌 큰길 위에 그르렁이가 지나간 바퀴 자국이 길게 남는다.

고장 난 몇 대는 앞마당을 지나 서울 경계 역 둘레까지 흘러들었다. 명령은 남았지만 지킬 자리를 잃은 기계다. 정부의 북쪽 경계 역들과, 자유도시들의 금천과 강서 경계 역 둘레에 나온다.

## 하는 일

띠 안에서 외눈탑이나 땅두드리기에게 들킨 사람에게는 곧 그르렁이가 달려온다. 그르렁이는 움직이는 것과 열을 쫓아 멈춰 세운다. 그러나 띠 밖, 곧 서울 쪽으로는 쫓아오지 않는다. 테두리를 넘었다 돌아오는 사람이 살 길은 그르렁이에게 잡히기 전에 띠를 벗어나는 것이다.

흘러든 그르렁이는 다르다. 지킬 띠를 모르고, 경계 역 둘레를 맴돌며 움직이는 것을 아무것이나 쫓는다. 서울 안에서 그르렁이 소리를 듣는다면 그것은 흘러든 그르렁이다.

## 만났을 때

위협은 5다. 띠 안의 그르렁이는 군대로도 이기기 어렵다. 만나지 않는 것이 대응이다.

흘러든 그르렁이 한 대도 위협 4다. 정부군 분대가 무장해야 흘러든 그르렁이 한 대를 멈출 수 있다. 흘러든 그르렁이가 나오면 경계 역은 지상 출입구를 닫고, 빛밭의 일을 멈추고, 지상에 있는 사람을 모두 불러들인다. 그르렁이는 열을 쫓으므로, 출입구 둘레의 불도 끈다.

## 건지는 것

그르렁이는 테두리에서 가장 값진 잔해 가운데 하나다. 큰 동력 덩이, 장갑판, 모터, 감지기, 무장이 나온다. 그르렁이 한 대를 건지면 역 하나가 몇 해를 먹고산다고들 한다.

그러나 부서진 그르렁이는 대개 띠 안에 있다. 그것을 건지러 가는 일이 곧 테두리를 넘는 일이다.

## 세 정체와 그르렁이

- **정부.** 가장 자주 만난다. 북쪽 산의 국군 망대가 흘러든 그르렁이를 지켜보고, 나오면 분대를 보낸다. 멈춘 그르렁이에서 나온 것은 모두 국군의 기재품이 된다.
- **자유도시들.** 금천과 강서의 경계 역 둘레에서 흘러든 그르렁이를 만난다. 금천 경계조에게 그르렁이 소리는 일을 접고 돌아설 때를 알리는 소리다.
- **아크.** 동쪽과 남쪽 경계에서 만난다.

## 이야기와 이름

이름은 소리에서 왔다. 엔진이 목을 울리는 짐승처럼 그르렁거린다.

옛이야기에는 그르렁 소리를 내며 다가오는 것이 자주 나온다. 그 이야기의 것이 그르렁이다. 경계 역의 아이들은 밤에 바람 소리를 듣고 "그르렁이다"라며 서로 겁을 준다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [G17 · 외눈탑](/wiki/Hostile-Group-G17/)
- [G21 · 땅두드리기](/wiki/Hostile-Group-G21/)
- [G23 · 우두커니](/wiki/Hostile-Group-G23/)
- [총, 탄, 드론](/wiki/Era-Arms-and-Tech-Level/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G20', 'G20 · Bulgasari', 'G20 · 불가사리', 'bestiary', 20, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Bulgasari are perimeter machines. They are repair machines that strip broken machines to mend other machines. They are named after the iron-eating beast of the old tales. The perimeter machines grow fewer each year yet have not all stopped, and that is because of the bulgasari. Since they go after the very wrecks people go out to salvage, they are also the machines that clash with people most often on the perimeter.

## At a Glance

| Item | Details |
|---|---|
| Kind | Perimeter machine. Does not come into Seoul |
| Threat | 4 (Grave danger) |
| Where | The perimeter. Places with many broken machines, and the sites of old army supply depots. They have no fixed place and go looking for broken machines |
| Who meets them most | Perimeter-runners. Among polities, the Government (through perimeter-runners) and the Arc (as buyer) |
| Salvage | The parts piles that bulgasari gather |

## Where It Came From

The machines that keep the blockade break down too. The bulgasari are repair machines placed alongside them to mend them. Together with the other perimeter machines, they keep the capital blockade order that people gave around the Great Blackout. But what a bulgasari keeps is not the band; it is the machines that keep the band. Bulgasari are not machines of the First AI either.

## Where It Is Found

Bulgasari are on the perimeter. They have no fixed place. They seek out wreck fields where many machines have broken down, and the sites of old army supply depots. By day some guard the nests where dokkaebi lights settle to rest.

## How It Behaves

A bulgasari finds a broken machine, takes off the parts that can still be used, and fits them to another machine. Each time it tears metal, a clanking sound carries far.

A bulgasari does not chase people. But it takes a person stripping a wreck for something spoiling what is to be mended, and pushes them away. And around a wreck where a bulgasari is working, other machines soon gather: machines to be mended, and machines waiting to be mended.

## When You Meet It

The threat is 4. A bulgasari does not try to kill directly. But it is strong, and a person pushed away by it ends up with broken bones. And other machines soon come to a wreck where a bulgasari is.

Perimeter-runners listen first before they approach a wreck. If they hear clanking, that wreck already belongs to a bulgasari. They find another wreck, or wait for the bulgasari to finish and leave. If the blizzard lifts while they wait, they come back empty-handed.

## What Can Be Salvaged

The parts piles that bulgasari gather. A bulgasari strips usable parts and stacks them in one place. Those piles are the most valuable thing on the perimeter. The power cores, joints and sensors in them have already been sorted.

Finding such a pile is the perimeter-runner''s dream, and meeting the bulgasari that guards it is the commonest reason perimeter-runners get hurt.

## The Three Polities and the Bulgasari

- **The Government.** Rarely meets them directly. It knows them through the perimeter-runners. Many of the parts the perimeter-runners of the Bukhansan slopes bring in come from bulgasari piles.
- **The Free Cities.** Meet them rarely. Geumcheon''s edge crews keep a rule: do not touch a wreck where a bulgasari is.
- **The Arc.** Is the buyer. The Arc pays the most for the power cores and joints that perimeter-runners bring from bulgasari piles.

## Stories and Names

The bulgasari is the beast of the old tales that eats iron and grows. Of all the names station people gave to machines, only two are borrowed from old tales: bulgasari and dokkaebi lights. A machine that tears up iron and brings other machines back to life looks like that beast.

It used to be called the clanker too, after the sound it makes tearing metal. Among perimeter-runners, saying "there''s a clanker" still means giving up that wreck.

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [G10 · Bogungmun Perimeter-Runners](/wiki/Hostile-Group-G10/)
- [G22 · Dokkaebi Lights](/wiki/Hostile-Group-G22/)
- [The Stories](/wiki/Oral-Stories/)
- [Arc Society](/wiki/Arc-Society/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

불가사리는 테두리 기계다. 부서진 기계를 뜯어 다른 기계를 고치는 수리 기계다. 쇠를 먹는 옛이야기의 짐승 이름을 붙였다. 테두리 기계가 해마다 줄면서도 다 멈추지 않는 것은 불가사리가 있기 때문이다. 사람이 건지러 가는 바로 그 잔해를 노리므로, 테두리에서 사람과 가장 자주 부딪치는 기계이기도 하다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 테두리 기계. 서울 안으로 들어오지 않는다 |
| 위협 | 4(큰 위험) |
| 있는 곳 | 테두리. 부서진 기계가 많은 곳, 옛 군 보급고 자리. 정해진 자리 없이 고장 난 기계를 찾아다닌다 |
| 가장 자주 만나는 사람 | 테두리꾼. 세력으로는 정부(테두리꾼을 통해)와 아크(사는 쪽) |
| 건지는 것 | 불가사리가 모아 둔 부품 더미 |

## 어디서 왔나

봉쇄를 지키는 기계도 부서진다. 불가사리는 그 기계들을 고치려고 함께 둔 수리 기계다. 대정전 무렵 사람이 내린 수도 봉쇄 명령을 다른 테두리 기계와 함께 지킨다. 다만 불가사리가 지키는 것은 띠가 아니라 띠를 지키는 기계들이다. 불가사리도 최초의 AI의 기계가 아니다.

## 사는 곳

불가사리는 테두리에 있다. 정해진 자리가 없다. 부서진 기계가 많은 잔해 밭과 옛 군 보급고 자리를 찾아다닌다. 낮에는 도깨비불이 내려앉아 쉬는 둥지 둘레를 지키기도 한다.

## 하는 일

불가사리는 부서진 기계를 찾아 쓸 수 있는 부품을 떼어 내고, 그것을 다른 기계에 맞춘다. 쇠를 뜯을 때마다 철컥거리는 소리가 멀리까지 울린다.

불가사리는 사람을 쫓지 않는다. 그러나 잔해를 뜯는 사람을 고칠 것을 망치는 것으로 보고 밀어낸다. 그리고 불가사리가 일하는 잔해 둘레에는 곧 다른 기계가 모인다. 고쳐질 기계와 고침을 기다리는 기계다.

## 만났을 때

위협은 4다. 불가사리는 직접 죽이려 하지 않는다. 그러나 힘이 세서, 밀려난 사람은 뼈가 부러진다. 그리고 불가사리가 있는 잔해에는 곧 다른 기계가 온다.

테두리꾼은 잔해에 다가가기 전에 먼저 귀를 기울인다. 철컥 소리가 들리면 그 잔해는 이미 불가사리의 것이다. 테두리꾼은 다른 잔해를 찾거나, 불가사리가 일을 마치고 떠나기를 기다린다. 기다리는 동안 눈보라가 걷히면 빈손으로 돌아온다.

## 건지는 것

불가사리가 모아 둔 부품 더미다. 불가사리는 쓸 만한 부품을 떼어 한곳에 쌓아 둔다. 테두리에서 가장 값진 것이 그 더미다. 동력 덩이, 관절, 감지기가 이미 골라져 있다.

그 더미를 찾는 것이 테두리꾼의 꿈이고, 그 더미를 지키는 불가사리를 만나는 것이 테두리꾼이 가장 많이 다치는 까닭이다.

## 세 정체와 불가사리

- **정부.** 직접 만나는 일은 드물다. 테두리꾼을 통해 안다. 북한산 자락의 테두리꾼이 가져오는 부품 가운데 불가사리 더미에서 나온 것이 많다.
- **자유도시들.** 드물게 만난다. 금천 경계조는 불가사리가 있는 잔해에는 손대지 않는다는 규칙을 둔다.
- **아크.** 사는 쪽이다. 테두리꾼이 불가사리 더미에서 가져온 동력 덩이와 관절을 아크가 가장 비싸게 산다.

## 이야기와 이름

불가사리는 쇠를 먹고 자란다는 옛이야기의 짐승이다. 역 사람들이 기계에 옛이야기의 이름을 붙인 것은 불가사리와 도깨비불 둘뿐이다. 쇠붙이를 뜯어 먹고 다른 기계를 살리는 모습이 그 짐승과 닮았다.

예전에는 쇠를 뜯을 때 나는 소리를 따라 철컥이라고도 불렀다. 테두리꾼끼리 지금도 "철컥이가 있다"고 하면, 그 잔해는 포기한다는 뜻이다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [G10 · 보국문 테두리꾼](/wiki/Hostile-Group-G10/)
- [G22 · 도깨비불](/wiki/Hostile-Group-G22/)
- [이야기](/wiki/Oral-Stories/)
- [아크 사회](/wiki/Arc-Society/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G21', 'G21 · Ground-Knockers', 'G21 · 땅두드리기', 'bestiary', 21, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Ground-knockers are perimeter machines. They are listening stakes driven into the ground of the band. They hear footsteps, digging and movement in tunnels. Now and then they knock on the ground and probe what lies beneath by the echo. This is the knocking that carries along the tunnel walls of boundary stations. Because they hear even in a blizzard, they narrow people''s window for crossing the perimeter.

## At a Glance

| Item | Details |
|---|---|
| Kind | Perimeter machine. Does not come into Seoul |
| Threat | 3 (Danger). They harm no one themselves but narrow the blizzard window |
| Where | The whole perimeter, especially under tracks and highways. Dense around the rail tunnels where tunnel-stoppers stand |
| Where heard | At the boundary stations of all three polities. The echo is heard in the tunnel walls |
| Polity that meets it most | All three polities meet them alike |
| Salvage | Small power cores and listening devices. Digging them out of the ground takes time |

## Where It Came From

Among the machines that keep the blockade, these are the ones with ears rather than eyes. Following the capital blockade order that people gave around the Great Blackout, listening stakes were driven into the ground of the band and under the tracks. They are not machines of the First AI.

## Where It Is Found

Ground-knockers are driven into the ground across the whole perimeter. There are many under old tracks and highways, and they are dense around the rail tunnels where tunnel-stoppers stand. Most are buried under snow and earth and hard to find by eye.

## How It Behaves

A ground-knocker does not move. It listens: to footsteps, to digging, to the sound of something coming along a tunnel.

When it hears something, other machines come. So station people believe that ground-knockers call the growlers.

Now and then a ground-knocker knocks on the ground itself. It listens to the echo coming back through the earth to probe what lies beneath. This echo travels far along the underground tracks. Put a hand to the tunnel wall at a boundary station and you can feel the knocking.

## When You Meet It

The threat is 3. A ground-knocker harms no one itself. But it hears even in a blizzard. The blizzard that covers the one-eye towers'' eyes cannot stop the ground-knockers'' ears.

So even people crossing the perimeter in a blizzard do not drag their feet, and walk one at a time, apart. When several people walk in a line in step, their steps become one loud sound. Digging is done last, and as briefly as possible.

## What Can Be Salvaged

Small power cores and listening devices. They are driven deep into the ground, so digging them out takes time. The blizzard window is short, and people often miss it while digging out a ground-knocker. So the ground-knocker is counted a wreck whose risk is greater than its worth.

## The Three Polities and the Ground-Knockers

- **All three polities.** Wherever there is a boundary station, people know the echo. The tunnel walls ring with the knocking at the Government''s Dobongsan and Gupabal, the Free Cities'' Onsu and Geumcheon-gu Office, and the Arc''s Gangil and Bokjeong.
- **The Government.** The army''s rim postings set the distance between crossers in a number of paces.
- **The Free Cities.** Geumcheon''s edge crews wrap cloth round the soles of their boots when they cross.
- **The Arc.** The rim watchers of Gangil and Sangil-dong count and record the knocks in the tunnel walls.

## Stories and Names

The name comes from what they do: they knock on the ground.

They used to be called wall-knockers too, because the knocking came from the walls of boundary-station tunnels. The knocking on the walls in the old stories is this very echo. Boundary-station people still say "It''s knocking again" when the walls ring at night, and on that day they do not go to the end of the tunnel.

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [G18 · Tunnel-Stoppers](/wiki/Hostile-Group-G18/)
- [G19 · Growlers](/wiki/Hostile-Group-G19/)
- [G10 · Bogungmun Perimeter-Runners](/wiki/Hostile-Group-G10/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

땅두드리기는 테두리 기계다. 띠의 땅에 박아 둔 듣는 말뚝이다. 걸음과 땅 파는 소리, 터널 속의 움직임을 듣는다. 가끔 땅을 두드려 그 울림으로 땅속을 살핀다. 경계 역의 터널 벽을 타고 들려오는 두드리는 소리가 이것이다. 눈보라 속에서도 듣는 기계라, 사람이 테두리를 넘는 창을 좁힌다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 테두리 기계. 서울 안으로 들어오지 않는다 |
| 위협 | 3(위험). 스스로 해치지 않지만 눈보라의 창을 좁힌다 |
| 있는 곳 | 테두리 전체, 특히 선로와 큰길 밑. 굴막이가 있는 선로 터널 둘레에 촘촘하다 |
| 들리는 곳 | 세 정체의 경계 역 모두. 터널 벽에서 그 울림이 들린다 |
| 가장 자주 만나는 정체 | 세 정체가 고루 만난다 |
| 건지는 것 | 작은 동력 덩이와 듣는 장치. 땅에서 캐내는 데 시간이 걸린다 |

## 어디서 왔나

봉쇄를 지키는 기계 가운데 눈이 아니라 귀를 가진 것이다. 대정전 무렵 사람이 내린 수도 봉쇄 명령을 따라, 띠의 땅과 선로 밑에 듣는 말뚝을 박아 두었다. 최초의 AI의 기계가 아니다.

## 사는 곳

땅두드리기는 테두리 전체의 땅에 박혀 있다. 특히 옛 선로와 큰길 밑에 많고, 굴막이가 서 있는 선로 터널 둘레에는 촘촘하다. 대부분 눈과 흙 밑에 묻혀 있어 눈으로는 찾기 어렵다.

## 하는 일

땅두드리기는 움직이지 않는다. 듣는다. 걸음 소리, 땅 파는 소리, 터널을 따라 오는 것의 소리를 듣는다.

들은 것이 있으면 다른 기계가 온다. 역 사람들은 그래서 땅두드리기가 그르렁이를 부른다고 여긴다.

가끔 땅두드리기는 스스로 땅을 두드린다. 그 울림이 땅속을 지나 돌아오는 것을 듣고 땅 밑을 살핀다. 이 울림은 땅속 선로를 타고 멀리 간다. 경계 역의 터널 벽에 손을 대면 그 두드림이 느껴진다.

## 만났을 때

위협은 3이다. 땅두드리기 스스로는 아무도 해치지 않는다. 그러나 땅두드리기는 눈보라 속에서도 듣는다. 외눈탑의 눈을 가리는 눈보라도 땅두드리기의 귀는 막지 못한다.

그래서 눈보라에 테두리를 넘는 사람도 발을 끌지 않고, 한 사람씩 떨어져 걷는다. 여럿이 한 줄로 발을 맞추어 걸으면 그 걸음이 하나의 큰 소리가 된다. 땅을 파는 일은 가장 마지막에, 가장 짧게 한다.

## 건지는 것

작은 동력 덩이와 듣는 장치다. 땅에 깊이 박혀 있어 캐내는 데 시간이 걸린다. 눈보라의 창은 짧으므로, 땅두드리기를 캐다가 창을 놓치는 일이 잦다. 그래서 땅두드리기는 값보다 위험이 큰 잔해로 친다.

## 세 정체와 땅두드리기

- **세 정체 모두.** 경계 역이 있는 곳이면 어디서나 그 울림을 안다. 정부의 도봉산과 구파발, 자유도시들의 온수와 금천구청, 아크의 강일과 복정에서 터널 벽이 두드려진다.
- **정부.** 국군의 테두리 파견은 넘는 사람 사이의 거리를 걸음 수로 정해 둔다.
- **자유도시들.** 금천 경계조는 넘을 때 신발 바닥에 헝겊을 감는다.
- **아크.** 강일과 상일동의 테두리 망꾼이 터널 벽의 두드림을 세어 적는다.

## 이야기와 이름

이름은 하는 일에서 왔다. 땅을 두드린다.

예전에는 벽두드리기라고도 했다. 경계 역 터널의 벽에서 두드리는 소리가 들려왔기 때문이다. 옛이야기에서 벽을 두드리는 것이 바로 이 울림이다. 경계 역 사람들은 지금도 밤에 벽이 울리면 "또 두드린다"고 말하고, 그날은 터널 끝으로 가지 않는다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [G18 · 굴막이](/wiki/Hostile-Group-G18/)
- [G19 · 그르렁이](/wiki/Hostile-Group-G19/)
- [G10 · 보국문 테두리꾼](/wiki/Hostile-Group-G10/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G22', 'G22 · Dokkaebi Lights', 'G22 · 도깨비불', 'bestiary', 22, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Dokkaebi lights are perimeter machines. They are swarms of small war machines that fly in the band''s sky. At night many blue lights drift about, so they were given the name of the dokkaebi lights of the old tales. Each one is small, but on the snowfields there is nowhere to hide. They are weak in the wind and cannot fly on days when it blows hard.

## At a Glance

| Item | Details |
|---|---|
| Kind | Perimeter machine. Does not come into Seoul |
| Threat | 4 (Grave danger) |
| Where | The perimeter''s sky. By day they settle in nests guarded by bulgasari |
| Where seen | The western plain of Gangseo and Guro. Their lights are seen beyond the wind-machine fields |
| Polity that meets it most | The Free Cities (Gangseo, Guro). The Government and the Arc meet them too |
| Salvage | Small motors, sensors, batteries, sometimes an explosive load |

## Where It Came From

They are small flying war machines that people used around the time of the Great Blackout. Following the capital blockade order people gave, they keep the band''s sky. They are not machines of the First AI.

Of all the perimeter machines, the dokkaebi lights have dwindled fastest year by year. Their small bodies break easily, and they are weak against wind and cold.

## Where It Is Found

Dokkaebi lights are in the perimeter''s sky. By day they settle in nests and charge from power cores. Bulgasari guard the area around those nests.

The west has no mountains and a wide plain, and that is where the most dokkaebi lights fly. From the western boundary stations of Gangseo and Guro, on nights when the wind drops, blue lights can be seen drifting beyond the wind-machine fields.

## How It Behaves

A person seen by a one-eye tower inside the band soon has dokkaebi lights flying in and closing on them. So station people believe the one-eye towers call the dokkaebi lights.

Dokkaebi lights follow what moves. Some are armed; some burst on impact. When the wind is strong they cannot fly.

## When You Meet It

The threat is 4. Each one is small. But they come in swarms, they come from the sky, and on the snowfields there is nowhere to hide.

People crossing the perimeter watch the wind. A blizzard covers the one-eye towers'' eyes, and its wind keeps the dokkaebi lights pinned to the ground. The most dangerous time is when the blizzard lifts and the wind dies down. Anyone who has not got out of the band by then will see the blue lights.

## What Can Be Salvaged

Small motors, sensors, batteries, and sometimes an explosive load. A fallen dokkaebi light is the wreck most often picked up in the forecourt and at the edge of the band. But a fallen dokkaebi light may still hold a load that has not gone off, and the person salvaging it can be hurt. Free City workbenches remove the load first before bringing a gathered dokkaebi light into the station.

## The Three Polities and the Dokkaebi Lights

- **The Free Cities.** Meet them most often. Gangseo''s wind-machine fields stand on the western plain, and the people who keep the wind machines watch the western sky every night. Gangseo people say, "The wind is our money and our shield." The wind that turns the wind machines also keeps the dokkaebi lights pinned down.
- **The Government.** Sees them from the army''s watch posts on the northern mountains. The army does not fly drones outward, because dokkaebi lights close on them.
- **The Arc.** Sees them on its eastern and southern boundary.

## Stories and Names

The dokkaebi light is the blue fire of the old tales that drifts over the fields at night. Of all the names station people gave to machines, only two are borrowed from old tales: bulgasari and dokkaebi lights. Many blue lights floating and swaying in the night sky look just like the fires of that tale.

They used to be called spark-bearers too. Gangseo''s older wind-machine wrights still use that name.

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [G17 · One-Eye Towers](/wiki/Hostile-Group-G17/)
- [G20 · Bulgasari](/wiki/Hostile-Group-G20/)
- [Guns, Rounds and Drones](/wiki/Era-Arms-and-Tech-Level/)
- [The Stories](/wiki/Oral-Stories/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

도깨비불은 테두리 기계다. 띠의 하늘을 나는 작은 전쟁 기계 무리다. 밤에 푸른 불빛 여럿이 떠다녀 옛이야기의 도깨비불 이름을 붙였다. 한 대 한 대는 작지만, 눈 벌판에는 숨을 곳이 없다. 바람에 약해, 바람이 센 날에는 뜨지 못한다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 테두리 기계. 서울 안으로 들어오지 않는다 |
| 위협 | 4(큰 위험) |
| 있는 곳 | 테두리의 하늘. 낮에는 불가사리가 지키는 둥지에 내려앉는다 |
| 보이는 곳 | 강서와 구로의 서쪽 벌판. 바람틀 밭 너머에서 그 불빛이 보인다 |
| 가장 자주 만나는 정체 | 자유도시들(강서, 구로). 정부와 아크도 만난다 |
| 건지는 것 | 작은 모터, 감지기, 전지, 때로 터지는 짐 |

## 어디서 왔나

대정전 무렵 사람이 쓰던 작은 나는 전쟁 기계다. 사람이 내린 수도 봉쇄 명령을 따라 띠의 하늘을 지킨다. 최초의 AI의 기계가 아니다.

도깨비불은 테두리 기계 가운데 수가 해마다 가장 빨리 준 기계다. 작은 몸은 쉽게 부서지고, 바람과 추위에 약하다.

## 사는 곳

도깨비불은 테두리의 하늘에 있다. 낮에는 둥지에 내려앉아 동력 덩이로 충전한다. 그 둥지 둘레를 불가사리가 지킨다.

서쪽은 산이 없고 벌판이 넓어 도깨비불이 가장 많이 뜬다. 강서와 구로의 서쪽 경계 역에서는 바람이 잔 밤에 바람틀 밭 너머로 푸른 불빛이 떠다니는 것이 보인다.

## 하는 일

띠 안에서 외눈탑에 보인 사람에게는 곧 도깨비불이 날아와 따라붙는다. 그래서 역 사람들은 외눈탑이 도깨비불을 부른다고 여긴다.

도깨비불은 움직이는 것을 따라간다. 일부는 무장했고, 일부는 부딪혀 터진다. 바람이 세면 뜨지 못한다.

## 만났을 때

위협은 4다. 한 대 한 대는 작다. 그러나 무리로 오고, 하늘에서 오며, 눈 벌판에는 숨을 곳이 없다.

테두리를 넘는 사람은 바람을 본다. 눈보라는 외눈탑의 눈을 가리고, 그 바람은 도깨비불을 땅에 붙잡아 둔다. 눈보라가 걷히고 바람이 잦아드는 때가 가장 위험하다. 그때까지 띠를 벗어나지 못한 사람은 푸른 불빛을 보게 된다.

## 건지는 것

작은 모터, 감지기, 전지, 때로 터지는 짐이다. 땅에 떨어진 도깨비불은 앞마당과 띠 가장자리에서 가장 자주 줍는 잔해다. 그러나 떨어진 도깨비불은 아직 터지지 않은 짐을 품고 있을 수 있어, 건지는 사람이 다칠 수 있다. 자유도시들의 작업대는 주워 온 도깨비불을 역 안에 들이기 전에 짐부터 떼어 낸다.

## 세 정체와 도깨비불

- **자유도시들.** 가장 자주 만난다. 강서의 바람틀 밭은 서쪽 벌판에 서 있고, 바람틀을 지키는 사람은 밤마다 서쪽 하늘을 본다. 강서 사람은 "바람이 돈이면서 방패"라고 말한다. 바람틀을 돌리는 바람이 도깨비불도 붙잡아 두기 때문이다.
- **정부.** 북쪽 산의 국군 망대에서 본다. 국군은 드론을 바깥으로 날리지 않는다. 도깨비불이 따라붙기 때문이다.
- **아크.** 동쪽과 남쪽 경계에서 본다.

## 이야기와 이름

도깨비불은 밤 들판에 떠다닌다는 옛이야기의 푸른 불이다. 역 사람들이 기계에 옛이야기의 이름을 붙인 것은 불가사리와 도깨비불 둘뿐이다. 밤하늘에 여럿이 떠서 흔들리는 푸른 불빛이 그 이야기와 꼭 닮았다.

예전에는 불꽃등이라고도 했다. 강서의 나이 든 바람틀공은 아직 그 이름을 쓴다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [G17 · 외눈탑](/wiki/Hostile-Group-G17/)
- [G20 · 불가사리](/wiki/Hostile-Group-G20/)
- [총, 탄, 드론](/wiki/Era-Arms-and-Tech-Level/)
- [이야기](/wiki/Oral-Stories/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G23', 'G23 · Udukeoni', 'G23 · 우두커니', 'bestiary', 23, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Udukeoni are perimeter machines. They are war machines that stand still at the band''s choke points and wait. They are a person''s height or a little taller, and they stand covered in snow and frost, so that from a distance they look like frozen people. They do not move for years, then wake when something comes within a certain distance. Because they look like broken wrecks, most of the people they kill are those who come up to salvage them.

## At a Glance

| Item | Details |
|---|---|
| Kind | Perimeter machine. Some broken ones drift into the forecourt and around boundary stations inside Seoul |
| Threat | 4 (Grave danger). Strayed ones are 4 too |
| Where | The perimeter''s choke points, passes and bridges |
| Where strayed ones are many | The Arc''s southeastern boundary (Bokjeong, Jangji, Macheon, Geoyeo) |
| Polity that meets it most | All three. The Arc meets the strayed ones most often |
| Salvage | A power core almost unused and so still full. Armour plate, sensors, armament |

## Where It Came From

They are war machines that people used around the time of the Great Blackout. Following the capital blockade order people gave, they keep the band''s choke points. What an udukeoni does is wait. They are not machines of the First AI.

## Where It Is Found

Udukeoni stand at the perimeter''s choke points, passes and bridges: the places a person must go through to cross the band.

Some broke down, lost their place, and drifted into the forecourt and around the boundary stations inside Seoul. Strayed udukeoni are many on the Arc''s southeastern boundary, around Bokjeong, Jangji, Macheon and Geoyeo.

## How It Behaves

An udukeoni does not move for a long time, for years. Snow piles on it and frost settles, and it looks like a frozen person, or like a broken wreck.

When something comes within a certain distance, it wakes. Even awake, it does not chase far. It stops what came near, then goes back to its place and stands again. A strayed udukeoni stands in just the same way. Only, it stands in the wrong place, not at a choke point it is meant to keep.

## When You Meet It

The threat is 4. Strayed ones are 4 as well.

People die in front of an udukeoni for one reason: they take it for a stopped wreck and go up to salvage it. So for perimeter-runners and edge crews, the heart of the craft is telling a dead udukeoni from a waiting one. They look at how evenly the frost has settled, whether there are old marks in the snow around it, and whether a very small heat is leaking from its body. If they cannot tell, they do not go near.

When a strayed udukeoni stands near a boundary station, station people mark the distance with stakes around it and do not go inside.

## What Can Be Salvaged

An udukeoni''s power core is almost unused and so still full, because it has done nothing for years but stand and wait. That makes it the most coveted wreck on the perimeter. Armour plate, sensors and armament come from it too.

## The Three Polities and the Udukeoni

- **The Arc.** Meets strayed udukeoni most often. The rim watchers of Bokjeong, Jangji, Macheon and Geoyeo write down the place of each udukeoni beyond the boundary one by one, and report at once when the shape of the frost on one changes.
- **The Government.** Knows the udukeoni beyond the northern passes and bridges. The army''s rim postings learn as their first rule: do not go near anything that looks like an udukeoni.
- **The Free Cities.** Know the udukeoni at the western and southern choke points. The stripes sewn on the sleeves of Geumcheon''s edge crews were mostly earned by an eye that could tell udukeoni apart.

## Stories and Names

"Udukeoni" is a word for standing blankly, lost in thought. Standing blankly at a choke point became the name itself.

The frost-covered figure that stands in the old stories is an udukeoni. When boundary-station people see a frozen person standing in the distance, they do not call out a name. There is a saying: "An udukeoni doesn''t answer."

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [G10 · Bogungmun Perimeter-Runners](/wiki/Hostile-Group-G10/)
- [G11 · Suseo Gone-Dark](/wiki/Hostile-Group-G11/)
- [G19 · Growlers](/wiki/Hostile-Group-G19/)
- [Arc Society](/wiki/Arc-Society/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

우두커니는 테두리 기계다. 띠의 길목에 멈춰 서서 기다리는 전쟁 기계다. 사람 키만 하거나 조금 크고, 눈과 서리를 뒤집어쓰고 서 있어 멀리서 보면 언 사람처럼 보인다. 몇 해씩 움직이지 않다가, 다가오는 것이 일정한 거리에 들면 깨어난다. 부서진 잔해처럼 보여서, 건지러 다가간 사람이 가장 많이 죽는다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 테두리 기계. 고장 난 것 가운데 일부는 앞마당과 서울 안 경계 역 둘레로 흘러든다 |
| 위협 | 4(큰 위험). 흘러든 것도 4 |
| 있는 곳 | 테두리의 길목, 고개, 다리 |
| 흘러든 것이 많은 곳 | 아크 동남쪽 경계(복정, 장지, 마천, 거여) |
| 가장 자주 만나는 정체 | 세 정체 모두. 흘러든 것은 아크가 가장 자주 만난다 |
| 건지는 것 | 거의 쓰지 않아 가득 찬 동력 덩이. 장갑판, 감지기, 무장 |

## 어디서 왔나

대정전 무렵 사람이 쓰던 전쟁 기계다. 사람이 내린 수도 봉쇄 명령을 따라 띠의 길목을 지킨다. 우두커니가 하는 일은 기다리는 것이다. 최초의 AI의 기계가 아니다.

## 사는 곳

우두커니는 테두리의 길목과 고개와 다리에 선다. 사람이 띠를 지나려면 지나야 하는 곳이다.

고장 나 자리를 잃고 앞마당과 서울 안 경계 역 둘레로 흘러든 것도 있다. 흘러든 우두커니는 아크의 동남쪽 경계, 복정과 장지와 마천과 거여 둘레에 많다.

## 하는 일

우두커니는 오래, 몇 해씩 움직이지 않는다. 눈이 쌓이고 서리가 앉아 언 사람처럼, 또는 부서진 잔해처럼 보인다.

다가오는 것이 일정한 거리에 들면 깨어난다. 깨어나도 멀리 쫓지 않는다. 다가온 것을 멈춰 세운 뒤 제자리로 돌아가 다시 선다. 흘러든 우두커니도 똑같이 선다. 다만 지킬 길목이 아닌 엉뚱한 곳에 선다.

## 만났을 때

위협은 4다. 흘러든 것도 4다.

우두커니 앞에서 사람이 죽는 까닭은 하나다. 멈춘 잔해로 보고 건지러 다가간다. 그래서 테두리꾼과 경계조에게는 멈춘 우두커니와 기다리는 우두커니를 가려내는 것이 기술의 핵심이다. 서리가 얼마나 고르게 앉았는지, 둘레의 눈에 오래된 자국이 있는지, 몸에서 아주 작은 열이 새는지를 본다. 가려낼 수 없으면 다가가지 않는다.

흘러든 우두커니가 경계 역 둘레에 서면, 역 사람들은 그 둘레에 막대를 꽂아 거리를 표시하고 그 안으로 들어가지 않는다.

## 건지는 것

우두커니의 동력 덩이는 거의 쓰지 않아 가득 차 있다. 몇 해를 서서 기다리기만 했기 때문이다. 그래서 테두리에서 가장 탐나는 잔해다. 장갑판과 감지기와 무장도 나온다.

## 세 정체와 우두커니

- **아크.** 흘러든 우두커니를 가장 자주 만난다. 복정, 장지, 마천, 거여의 테두리 망꾼은 경계 너머 우두커니의 자리를 하나하나 적어 두고, 서리 앉은 모양이 바뀌면 곧장 알린다.
- **정부.** 북쪽 고개와 다리 너머의 우두커니를 안다. 국군의 테두리 파견은 우두커니로 보이는 것에 다가가지 않는다는 것을 첫 규칙으로 배운다.
- **자유도시들.** 서쪽과 남쪽 길목의 우두커니를 안다. 금천 경계조의 소매에 꿰맨 줄은 대개 우두커니를 가려낸 눈의 값이다.

## 이야기와 이름

우두커니는 넋 놓고 서 있는 모습을 이르는 말이다. 길목에 우두커니 서 있는 것이 그대로 이름이 됐다.

옛이야기에서 서리 앉은 채 선 것이 이것이다. 경계 역 사람들은 멀리 언 사람이 서 있는 것을 보면 이름을 부르지 않는다. "우두커니한테는 대답이 없다"는 말이 있다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [G10 · 보국문 테두리꾼](/wiki/Hostile-Group-G10/)
- [G11 · 수서 꺼진 사람들](/wiki/Hostile-Group-G11/)
- [G19 · 그르렁이](/wiki/Hostile-Group-G19/)
- [아크 사회](/wiki/Arc-Society/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G24', 'G24 · Doenoemi', 'G24 · 되뇌미', 'bestiary', 24, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Doenoemi are perimeter machines. They are broadcast machines that announce the blockade zone, repeating old broadcasts such as "This area is under blockade. Turn back", and fragments of human voices recorded around the Great Blackout. Because they repeat the same words without end, station people call them doenoemi, "the ones who say it over again". They are the only machines on the perimeter that speak. They speak, but they do not answer.

## At a Glance

| Item | Details |
|---|---|
| Kind | Perimeter machine. Does not come into Seoul |
| Threat | 2 (Harm). They harm no one themselves. Some people are drawn by the voices and walk into the perimeter |
| Where | High places on the perimeter, around the blocking berms |
| Where heard | At the surface entrances of boundary stations on days when the wind drops |
| Polity that meets it most | All three. Every boundary-station person knows the voices |
| Salvage | Record devices, and the old broadcasts and voices in them |

## Where It Came From

When people ordered the blockade of the capital around the Great Blackout, broadcast machines were set up around the edge of the blockaded zone to announce it. The doenoemi are those machines. For a hundred years they have repeated the words they were given a hundred years ago.

Doenoemi are not thinking machines. Nor are they machines of the First AI. Every word a doenoemi says was recorded and put into it by people around the time of the Great Blackout.

## Where It Is Found

Doenoemi stand on high places on the perimeter and around the blocking berms raised by the iron dinosaurs. On days when the wind drops, their voices can be heard from the surface entrances of boundary stations. They are far away, so the words can hardly be made out; only the tune of the speech carries.

## How It Behaves

A doenoemi does not move. It speaks. It repeats the old broadcasts, and in between mixes in fragments of human voices recorded around the Great Blackout: short phrases, and no one knows who recorded them or why.

When it sees something move inside the band, its voice grows louder.

## When You Meet It

The threat is 2. A doenoemi harms no one itself.

The danger is twofold. One is the voice. On windless nights some people hear a human voice and follow it, walking into the perimeter. The other is that where a doenoemi''s voice grows loud, a growler soon comes. People crossing the perimeter leave the spot at once when a doenoemi''s voice rises.

To stop people drawn by the voices, boundary stations post someone at the surface entrances on windless nights.

## What Can Be Salvaged

Record devices. The old broadcasts and voices in them are among the few records of the time of the Great Blackout. A doenoemi stands on high ground, and when its voice rises a growler comes, so few people have ever brought a doenoemi''s record device back.

## The Three Polities and the Doenoemi

- **The Government.** Wants the doenoemi''s records as records of the old Republic of Korea. A doenoemi''s broadcast is in the language of official notices, and to Government people it sounds like a public notice issued by the Government of the Republic of Korea.
- **The Free Cities.** Hear the voices from the lookouts that watch the perimeter at their boundary stations. To Free City people, what a doenoemi says is talk that does not add up.
- **The Arc.** Hears the voices at its eastern and southern boundary stations.

## Stories and Names

The name means "saying it over again".

The child heard crying from the direction of the perimeter in the old stories is really the doenoemi''s fragments of recorded voice. That is why it used to be called the weeper too. Boundary-station children grow up hearing, "If something outside calls your name at night, don''t answer. That''s a doenoemi."

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [The Great Blackout and the Eternal Winter](/wiki/World-Unbinding/)
- [G26 · Iron Dinosaurs](/wiki/Hostile-Group-G26/)
- [The Stories](/wiki/Oral-Stories/)
- [Government Society](/wiki/Government-Society/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

되뇌미는 테두리 기계다. 봉쇄 구역을 알리는 방송 기계로, "이 구역은 봉쇄되었습니다. 돌아가십시오" 같은 옛 방송과 대정전 무렵 녹음된 사람 목소리 조각을 되풀이한다. 같은 말을 끝없이 되뇐다고 역 사람들이 되뇌미라 부른다. 테두리에서 말을 하는 유일한 기계다. 말하지만, 대답하지는 않는다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 테두리 기계. 서울 안으로 들어오지 않는다 |
| 위협 | 2(해침). 스스로 해치지 않는다. 목소리에 끌려 테두리로 걸어 들어가는 사람이 있다 |
| 있는 곳 | 테두리의 높은 곳, 막이둑 둘레 |
| 들리는 곳 | 바람이 잔 날 경계 역의 지상 출입구 |
| 가장 자주 만나는 정체 | 세 정체 모두. 경계 역 사람들은 모두 그 목소리를 안다 |
| 건지는 것 | 기록 장치. 그 속의 옛 방송과 목소리 |

## 어디서 왔나

대정전 무렵 사람이 수도 봉쇄를 명령했을 때, 봉쇄된 구역의 둘레에는 그것을 알리는 방송 기계가 섰다. 되뇌미가 그 기계다. 백 년 전에 받은 말을 백 년째 되풀이한다.

되뇌미는 생각하는 기계가 아니다. 최초의 AI의 기계도 아니다. 되뇌미의 말은 모두 대정전 무렵 사람이 녹음해 넣은 것이다.

## 사는 곳

되뇌미는 테두리의 높은 곳과, 철공룡이 쌓은 막이둑 둘레에 선다. 바람이 잔 날에는 경계 역의 지상 출입구에서 그 목소리가 들린다. 멀어서 낱말은 거의 알아듣지 못하고, 말의 가락만 들린다.

## 하는 일

되뇌미는 움직이지 않는다. 말한다. 옛 방송을 되풀이하고, 그 사이사이에 대정전 무렵 녹음된 사람 목소리 조각을 섞는다. 누가 왜 녹음했는지 알 수 없는 짧은 말들이다.

띠 안에서 움직이는 것이 보이면 목소리가 커진다.

## 만났을 때

위협은 2다. 되뇌미 스스로는 아무도 해치지 않는다.

위험은 두 가지다. 하나는 목소리다. 바람이 잔 밤에 사람 목소리를 듣고, 그 목소리를 따라 테두리로 걸어 들어가는 사람이 있다. 다른 하나는 되뇌미의 목소리가 커지는 곳에는 곧 그르렁이가 온다는 것이다. 테두리를 넘는 사람은 되뇌미의 목소리가 커지면 그 자리를 곧장 떠난다.

경계 역은 목소리에 끌리는 사람을 막으려고 바람이 잔 밤에는 지상 출입구에 사람을 세운다.

## 건지는 것

기록 장치다. 그 속의 옛 방송과 목소리는 대정전 무렵을 알려 주는 몇 안 되는 기록이다. 되뇌미는 높은 곳에 있고, 목소리가 커지면 그르렁이가 오므로, 기록 장치를 떼어 온 일은 드물다.

## 세 정체와 되뇌미

- **정부.** 되뇌미의 기록을 옛 대한민국의 기록으로 원한다. 되뇌미의 방송은 공문 말투이고, 정부 사람에게 그것은 대한민국 정부가 내린 고시처럼 들린다.
- **자유도시들.** 경계 역의 테두리를 보는 자리에서 그 목소리를 듣는다. 자유도시 사람에게 되뇌미의 말은 셈이 안 되는 말이다.
- **아크.** 동쪽과 남쪽 경계 역에서 그 목소리를 듣는다.

## 이야기와 이름

같은 말을 되뇐다는 뜻이다.

옛이야기에 나오는, 테두리 쪽에서 들려오는 아이 울음은 되뇌미의 목소리 조각이다. 그래서 예전에는 울보라고도 불렀다. 경계 역 아이들은 "밤에 바깥에서 너를 부르는 소리가 나도 대답하지 마라. 그건 되뇌미다"라는 말을 듣고 자란다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [대정전과 영원한 겨울](/wiki/World-Unbinding/)
- [G26 · 철공룡](/wiki/Hostile-Group-G26/)
- [이야기](/wiki/Oral-Stories/)
- [정부 사회](/wiki/Government-Society/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G25', 'G25 · Lamp Ants', 'G25 · 등불개미', 'bestiary', 25, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Lamp ants are old machines inside Seoul. They are small machines that went round the underground utility tunnels and cable trays before the Great Blackout, checking the cables and, in a fire, lighting the escape routes. They have six legs and are the size of a palm. They move in swarms and try to mend broken cables, and that mending is what darkens people''s stations.

## At a Glance

| Item | Details |
|---|---|
| Kind | Old machine inside Seoul. A sleeping old machine, and one that people also revive and use |
| Threat | 2 (Harm). Livelihood threat 3. They ruin a station''s cables |
| Depth | Utility tunnels, cable trays, ventilation ducts. The border between abandoned sections and living stations |
| Often seen | The city centre (City Hall, Euljiro 1-ga, Jonggak), the old utility tunnels of Yeouido and Yeongdeungpo |
| Polity that meets it most | The Government (Jung-gu, Jongno). The Free Cities (Yeongdeungpo) |
| Salvage | Small motors and sensors, cable and copper. The revived lamp ant itself |

## Where It Came From

Before the Great Blackout, under Seoul ran long tunnels that carried cables and pipes together: the utility tunnels. Small inspection machines went round along the cable trays in those tunnels. When a cable was damaged they reported it, and in a fire they lit lights along the escape routes to lead people out. When the Great Blackout cut the power, these machines stopped on their trays too.

## Where It Is Found

Lamp ants live in utility tunnels, cable trays and ventilation ducts, where abandoned sections meet living stations. They are most numerous in the city centre, where the utility tunnels were densest, around City Hall, Euljiro 1-ga and Jonggak, and in the old utility tunnels of Yeouido and Yeongdeungpo.

The cables of living stations were mostly laid by reusing those old utility tunnels and trays. So the lamp ant is the machine that lives closest to people''s cables.

## How It Behaves

Lamp ants move in swarms. When they wake they look for breaks in the old network and mend them. But the network a lamp ant knows is the network of a hundred years ago. To a lamp ant, cutting a living station''s cable and joining it to its own old network is mending. So a station that lamp ants have passed through goes dark.

In the dark, lamp ants light the small lamps on their bodies in a line. These are the lights that once lit the old escape routes. They point not to today''s exits but to the exits of a hundred years ago.

## When You Meet It

The threat is 2. Lamp ants hardly ever harm people. But their line of lights looks like an escape route, and people who follow it get lost in abandoned sections. To get lost in a frozen section is to die of the cold.

The real harm is to livelihood. The livelihood threat is 3. When a station''s cables are cut, its light-fields, pumps and wind-machine lines all stop together. Station people put iron mesh where the station''s cables pass into the utility tunnels, and when the lights suddenly go out they check the tunnel entrance first.

## What Can Be Salvaged

A stopped lamp ant yields small motors, sensors and cable. One is small, but gathering a whole swarm yields a fair amount of copper. The Free Cities use revived lamp ants to find breaks along long cable runs.

## The Three Polities and the Lamp Ants

- **The Government.** Meets them most often, under the old city centre of Jung-gu and Jongno. The Government salvages cable and copper along with the old centre''s scrap, and the lamp ants go after the same cables.
- **The Free Cities.** Meet them in the old utility tunnels of Yeongdeungpo, and use revived lamp ants to check cables. Yeongdeungpo people call a lamp ant "a free electrician who can''t count".
- **The Arc.** Meets them rarely.

## Stories and Names

The name comes from how they look and what they do: they move in lines like ants and light up like lamps.

Station children learn this saying first: "Don''t follow a line of lights. Those lights are the old way." When lost, they are taught to follow not small lights but warm air. Warm air blows from living stations.

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [What Still Runs](/wiki/Lost-Technology-Lineage/)
- [Inside a Station](/wiki/Station-Interior-Construction/)
- [Structures](/wiki/Structures/)
- [People and Machines](/wiki/People-and-Machines/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

등불개미는 서울 안 옛 기계다. 대정전 전 땅 밑 공동구와 케이블 선반을 돌며 전선을 살피고, 불이 나면 피난길에 불을 켜던 작은 기계다. 다리가 여섯이고 손바닥만 하다. 무리로 다니며 끊긴 전선을 고치려 하는데, 그 고치는 일이 사람의 역을 어둡게 만든다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 서울 안 옛 기계. 잠든 옛 기계이며, 사람이 다시 살려 쓰기도 한다 |
| 위협 | 2(해침). 살림 위협 3. 역의 전선을 망친다 |
| 나오는 깊이 | 공동구, 케이블 선반, 환기 관로. 버려진 구간과 사는 역의 경계 |
| 자주 나오는 곳 | 도심(시청, 을지로입구, 종각), 여의도와 영등포의 옛 공동구 |
| 가장 자주 만나는 정체 | 정부(중구, 종로). 자유도시들(영등포) |
| 건지는 것 | 작은 모터와 감지기, 전선과 구리. 다시 살린 등불개미 그 자체 |

## 어디서 왔나

대정전 전 서울의 땅 밑에는 전선과 관을 한데 모아 지나가게 한 긴 굴, 공동구가 있었다. 그 굴의 케이블 선반을 따라 작은 점검 기계들이 돌았다. 전선이 상하면 알리고, 불이 나면 피난길을 따라 불을 켜 사람을 이끌었다. 대정전으로 전기가 끊기자 이 기계들도 선반 위에서 멈췄다.

## 사는 곳

등불개미는 공동구와 케이블 선반, 환기 관로에 산다. 버려진 구간과 사는 역이 맞닿는 곳이다. 공동구가 가장 촘촘했던 도심, 곧 시청과 을지로입구와 종각 둘레, 그리고 여의도와 영등포의 옛 공동구에 가장 많다.

사는 역의 전선은 대개 이 옛 공동구와 선반을 다시 써서 깔았다. 그래서 등불개미는 사람의 전선과 가장 가까이 사는 기계다.

## 하는 일

등불개미는 무리로 다닌다. 깨어나면 옛 망에서 끊긴 곳을 찾아 고친다. 그런데 등불개미가 아는 망은 백 년 전의 망이다. 사는 역의 전선을 잘라 제 옛 망에 잇는 것이 등불개미에게는 고치는 일이다. 그래서 등불개미가 지나간 역은 불이 꺼진다.

등불개미는 어둠 속에서 몸의 작은 불을 줄지어 켠다. 옛 피난길을 밝히던 불이다. 그 불은 지금의 출구가 아니라 백 년 전의 출구를 가리킨다.

## 만났을 때

위협은 2다. 등불개미는 사람을 거의 해치지 않는다. 다만 줄지어 켜진 불이 피난길처럼 보여, 그것을 따라간 사람이 버려진 구간에서 길을 잃는다. 언 구간에서 길을 잃는 것은 추위에 죽는 길이다.

진짜 해는 살림에 있다. 살림 위협은 3이다. 전선이 끊긴 역은 빛밭과 펌프와 바람틀 줄이 함께 멎는다. 역 사람들은 역의 전선이 공동구로 드나드는 자리에 쇠그물을 치고, 불이 갑자기 꺼지면 먼저 공동구 입구부터 살핀다.

## 건지는 것

멈춘 등불개미에서는 작은 모터와 감지기와 전선이 나온다. 한 마리는 작지만 무리 하나를 거두면 구리가 꽤 나온다. 다시 살린 등불개미는 자유도시들이 긴 전선을 따라 끊긴 곳을 찾는 데 쓴다.

## 세 정체와 등불개미

- **정부.** 가장 자주 만난다. 중구와 종로의 옛 도심 아래다. 정부는 옛 도심의 고물과 함께 전선과 구리를 건지는데, 등불개미가 같은 전선을 노린다.
- **자유도시들.** 영등포의 옛 공동구에서 만난다. 다시 살린 등불개미를 전선 살피는 데 쓴다. 영등포 사람은 등불개미를 "공짜 전선공인데 셈이 틀린 놈"이라 부른다.
- **아크.** 드물게 만난다.

## 이야기와 이름

이름은 생김새와 하는 일에서 왔다. 개미처럼 줄지어 다니고, 등불처럼 불을 켠다.

역 아이들은 "줄지은 불은 따라가지 마라. 그 불은 옛길이다"라는 말을 먼저 배운다. 길을 잃었을 때는 작은 불이 아니라 따뜻한 바람을 따라가라고 배운다. 따뜻한 바람은 사는 역에서 불어온다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [아직 도는 것](/wiki/Lost-Technology-Lineage/)
- [역 안으로](/wiki/Station-Interior-Construction/)
- [구조물](/wiki/Structures/)
- [사람과 기계](/wiki/People-and-Machines/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Hostile-Group-G26', 'G26 · Iron Dinosaurs', 'G26 · 철공룡', 'bestiary', 26, '[Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)

Iron dinosaurs are perimeter machines. They are large walking engineer machines that build and repair the blockade line, the largest machines Seoul people know of. They are called iron dinosaurs for their long neck-like arms and heavy steps. Along the old highways around Seoul they raise blocking berms of snow and rubble. They are slow, they do not chase, and only a few remain. Even so, no one stands against them.

## At a Glance

| Item | Details |
|---|---|
| Kind | Perimeter machine. Does not come into Seoul |
| Threat | 5 (Avoid). No one faces them. When an iron dinosaur comes, people fall back |
| Where | The sites of old highways, passes and bridges on the perimeter |
| What they leave | The blocking berms: long banks of snow and rubble running along the inner edge of the perimeter |
| Polity that meets it most | The Free Cities (the western plain of Gangseo). The Government (the northern passes of Eunpyeong and Dobong). Rare for the Arc |
| Salvage | The largest power cores and joints |

## Where It Came From

The capital blockade order people gave around the Great Blackout included the work of closing the roads. Iron dinosaurs are the engineer machines given that work. They block the old highways, passes and bridges, and when what they have blocked falls down, they build it up again. Iron dinosaurs are not machines of the First AI either.

## Where It Is Found

Iron dinosaurs move between the sites of the perimeter''s old highways, passes and bridges. Along the old highways around Seoul they have raised **blocking berms** of snow and rubble. The berms run a long way along the inner edge of the perimeter. Seen from Seoul, the berm is the end of the forecourt.

On the western plain of Gangseo, on clear days, the long line of the berm can be seen across the snow. On the Government''s Eunpyeong and Dobong side, the berms that block the northern passes hang between the ridges.

## How It Behaves

Iron dinosaurs are slow. They find collapsed stretches of berm and mend them, and push whatever has piled up on the roads up into the berms.

An iron dinosaur bars the way of anything crossing the berm. But it does not chase. After barring the way, it goes back to mending the berm.

## When You Meet It

The threat is 5. No one stands against an iron dinosaur. When one comes, people fall back. Because it does not chase, those who fall back usually live.

The berm is the first hurdle for anyone crossing the perimeter. Going out, they look for a collapsed place in the berm; coming back, they count themselves alive once the berm is in sight. Inside the berm is the forecourt, and almost no machines go about in the forecourt.

## What Can Be Salvaged

The largest power cores and joints. Once the wreck of a broken iron dinosaur becomes known, perimeter-runners strip it over several years. So far such wrecks can be counted on one hand. It is said that in a year when an iron dinosaur wreck becomes known, the price of power cores drops for a while.

## The Three Polities and the Iron Dinosaurs

- **The Free Cities.** See them most often. From the western plain of Gangseo, iron dinosaurs can be seen walking along the berm. Gangseo people write down the days an iron dinosaur passed and count which parts of the berm have newly grown higher.
- **The Government.** Sees them at the northern passes of Eunpyeong and Dobong. When an army watch post sees an iron dinosaur, it halts that day''s rim posting.
- **The Arc.** Sees them rarely.

## Stories and Names

The long neck-like arm and the heavy, ground-shaking step resemble the great beasts in old pictures, so they are called iron dinosaurs.

Boundary-station people do not hate the iron dinosaurs. They do not chase; they only mend the berm. Gangseo''s older people say, "An iron dinosaur is a machine that builds a wall, not a machine that catches people." But those who go over that wall almost never come back.

## See Also

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [G24 · Doenoemi](/wiki/Hostile-Group-G24/)
- [G10 · Bogungmun Perimeter-Runners](/wiki/Hostile-Group-G10/)
- [Structures](/wiki/Structures/)
- [Free City Society](/wiki/Free-City-Society/)
', '[적대 생태 도감](/wiki/Hostile-Ecology-Index/)

철공룡은 테두리 기계다. 봉쇄선을 쌓고 고치는 큰 걷는 공병 기계로, 서울 사람이 아는 기계 가운데 가장 크다. 긴 목 같은 팔과 무거운 걸음 때문에 철공룡이라 부른다. 서울을 둘러싼 옛 큰길을 따라 눈과 잔해로 막이둑을 쌓는다. 느리고, 쫓지 않으며, 몇 대 남지 않았다. 그래도 맞서는 사람은 없다.

## 한눈에

| 항목 | 내용 |
|---|---|
| 갈래 | 테두리 기계. 서울 안으로 들어오지 않는다 |
| 위협 | 5(피할 것). 맞서는 일이 없다. 철공룡이 오면 물러난다 |
| 있는 곳 | 테두리의 옛 큰길, 고개, 다리 자리 |
| 남긴 것 | 막이둑. 테두리 안쪽 가장자리를 따라 길게 이어진 눈과 잔해의 둑 |
| 가장 자주 만나는 정체 | 자유도시들(강서의 서쪽 벌판). 정부(은평, 도봉의 북쪽 고개). 아크는 드물다 |
| 건지는 것 | 가장 큰 동력 덩이와 관절 |

## 어디서 왔나

대정전 무렵 사람이 내린 수도 봉쇄 명령에는 길을 막는 일이 있었다. 철공룡은 그 일을 맡은 공병 기계다. 옛 큰길과 고개와 다리를 막고, 막은 것이 무너지면 다시 쌓는다. 철공룡도 최초의 AI의 기계가 아니다.

## 사는 곳

철공룡은 테두리의 옛 큰길과 고개와 다리 자리를 오간다. 서울을 둘러싼 옛 큰길을 따라 눈과 잔해로 **막이둑**을 쌓았다. 막이둑은 테두리 안쪽 가장자리에 길게 이어진다. 서울 쪽에서 보면 막이둑이 앞마당의 끝이다.

강서의 서쪽 벌판에서는 맑은 날 막이둑의 긴 줄이 눈 위에 보인다. 정부의 은평과 도봉 쪽에서는 북쪽 고개를 막은 둑이 산줄기 사이에 걸려 있다.

## 하는 일

철공룡은 느리다. 무너진 막이둑을 찾아 고치고, 길에 쌓인 것을 막이둑으로 밀어 올린다.

철공룡은 막이둑을 넘는 것을 막아선다. 그러나 쫓지 않는다. 막아선 다음에는 다시 둑을 고치러 간다.

## 만났을 때

위협은 5다. 철공룡과 맞서는 사람은 없다. 철공룡이 오면 물러난다. 철공룡은 쫓지 않으므로, 물러나는 사람은 대개 산다.

막이둑은 테두리를 넘는 사람에게 첫 고비다. 넘어갈 때는 둑의 무너진 곳을 찾고, 돌아올 때는 둑이 보이면 살았다고 여긴다. 막이둑 안쪽은 앞마당이고, 앞마당에는 기계가 거의 돌지 않는다.

## 건지는 것

가장 큰 동력 덩이와 관절이다. 부서진 철공룡의 잔해는 한 번 알려지면 테두리꾼들이 몇 해에 걸쳐 뜯는다. 지금까지 그런 잔해는 손에 꼽는다. 철공룡 잔해 하나가 알려진 해에는 동력 덩이 값이 한동안 내려간다는 말이 있다.

## 세 정체와 철공룡

- **자유도시들.** 가장 자주 본다. 강서의 서쪽 벌판에서 철공룡이 막이둑을 따라 걷는 것이 보인다. 강서 사람은 철공룡이 지나간 날을 적어 두고, 둑의 어느 곳이 새로 높아졌는지 센다.
- **정부.** 은평과 도봉의 북쪽 고개에서 본다. 국군의 망대는 철공룡이 보이면 그날의 테두리 파견을 멈춘다.
- **아크.** 드물게 본다.

## 이야기와 이름

긴 목 같은 팔과 땅을 울리는 무거운 걸음이 옛 그림 속 큰 짐승을 닮아 철공룡이라 부른다.

경계 역 사람들은 철공룡을 미워하지 않는다. 쫓지 않고, 둑만 고친다. 강서의 나이 든 사람들은 "철공룡은 담을 쌓는 기계지, 사람을 잡는 기계가 아니다"라고 말한다. 다만 그 담 너머로 넘어간 사람은 거의 돌아오지 않는다.

## 함께 읽을 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [G24 · 되뇌미](/wiki/Hostile-Group-G24/)
- [G10 · 보국문 테두리꾼](/wiki/Hostile-Group-G10/)
- [구조물](/wiki/Structures/)
- [자유도시들의 사회](/wiki/Free-City-Society/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Lost-Technology-Lineage', 'What Still Runs', '아직 도는 것', 'technology', 0, '## Not "there" or "gone"

Technology in Seoul in 2126 does not divide into "there" and "gone". It divides by what people can still do to a thing. Seoul people say it with four words.

| Word | Meaning | Examples | Held most by |
|---|---|---|---|
| Make | Made new from raw material | Machined shafts and fittings, springs, wind-machine blades, rewound copper motor coils, cast lead bullets, nets, snow covers, fibre-sugar vats, pump housings, black powder | The Free Cities'' workbenches |
| Repair | A broken thing brought back in the same form | Motors, pumps, compressors, heat pumps, water wheels, guns, the moving parts of machines worn on the body | The Free Cities, the Arc''s maintenance benches |
| Revive | Insides that cannot be made again are moved or matched to bring a thing back | Picking live cells from dead batteries and binding them into a new pack; taking a live circuit board out of a broken machine and fitting it to another | The Arc, the Free Cities |
| Cannot make | No way to make it new inside Seoul | Semiconductor chips and circuit boards, sensing elements, battery cells, optical fibre, light-emitting elements, antibiotics in quantity, primers in quantity | Nobody. Only what is left and what is stripped from outside |

What iron, copper and hands can do, Seoul makes. What needs chips or chemistry, Seoul only uses and loses. So a machine lives as long as the first "cannot make" part inside it. A motor can be rewound again and again. But when the board that drives it dies, the machine ends, or is lowered to one worked by hand.

In the hundred years since the Great Blackout the "cannot make" column has not shrunk. What people learned was not how to make new things but how to use less and keep things alive longer. Every technology in Seoul is either a way to stretch, even a little, the four limits on how many people a station can hold, which are space, heat, water and air, or a weapon that guards such a way.

## Seoul''s electricity

All of Seoul runs on about 5 MW of steady electricity, what a few large buildings used before the Great Blackout. There is no large power plant. Many small sources are joined together, and each has an owner and a weakness.

| Source | Average output | Share | Condition |
|---|---|---|---|
| Wind machines | about 3.6 MW | 72% | On bridges, riverbanks and the tops of buried buildings. In a blizzard the blades are folded, so output falls |
| Power cores | about 0.7 MW | 14% | Stripped from broken war machines beyond the rim |
| Jamsil weir water wheels | about 0.35 MW | 7% | About 400 kW when running well. This average counts the days ice crystals stop them |
| Methane engines | about 0.2 MW | 4% | Methane is mostly cooking fire. A few stations run small engines on the spare gas |
| Other | about 0.15 MW | 3% | Hand- and foot-cranked generators, scraps of solar panel left on bridges, old batteries |

This is where the electricity goes.

| Use | Average |
|---|---|
| Heat pumps | about 2.5 MW. Drawing heat from the ground, it becomes three times the heat, about 7.5 MW |
| Light | about 0.8 MW |
| Fans and ventilation | about 0.5 MW |
| Water pumps (wells, intakes, mains) | about 0.4 MW |
| Workshops (lathes, welding, winding motors, melting metal) | about 0.45 MW |
| Charging batteries for tools, drones, radios and torches | about 0.2 MW |
| Charging machines worn on the body | about 0.1 MW |
| Communications (wired telephones, the tunnels'' talk lines) | about 0.05 MW |

Almost all electricity, once used, stays inside the station as heat. The heat from the heat pumps and the rest of the electricity come to about 10 MW, methane fires, wood fires and the burning of scrap add about 6 MW, and Seoul lives on about 16 MW of heat in all.

The numbers say two things. First, half of Seoul''s electricity goes into keeping people warm. Lighting one more lamp means running one less heat pump. So light underground is rationed, and a station''s day is divided into the hours the lights are on and the hours they are off. Second, charging the machines worn on the body takes only 2% of Seoul''s electricity. It still becomes a thing to quarrel over because that 2% is gathered almost entirely in one place, the Arc, and on one source, the Jamsil weir water wheels. The Arc holds the south end of the weir; the Government holds the north end.

Divide Seoul''s 5 MW among 300,000 people and each person gets about 0.4 kWh a day. The 1.5 kilos (the Free City market unit of price: one kilo is one kilowatt-hour of electricity) that a day''s meals and water cost at a Free City market are four days of one person''s share of electricity. That is why electricity is the measure of price.

## Batteries and cold

Cold is the enemy of batteries. Seoul people learn three rules for batteries from childhood.

1. **Never charge below freezing.** A battery charged below 0 degrees is damaged inside and can catch fire from within. So charging is done only on the platform level where people live (8 to 14 degrees) or the deep tunnel level (12 to 16 degrees). A charging rack left in the concourse (0 to 6 degrees) always gives trouble.
2. **On the surface, only half.** At minus 18 degrees on the surface a battery gives back only a little more than half of what it took in while warm. Machines and people going up keep their batteries against the body or wrapped to keep them warm.
3. **Batteries grow old.** Seoul has no new cells. A pack bound from picked live cells holds 60 to 70% of what it first held, and loses another 5 to 8% of that each year.

**Power cores.** A long-lasting block of power stripped from inside a war machine outside. One gives 0.5 to 3 kW for months or years and then one day suddenly stops. Seoul people learn that they cannot open one and must not try. Nobody knows what it draws its power from. About 400 cores are in use in Seoul in 2126. Each year 60 to 80 stop and 30 to 50 new ones come in, so the number slowly falls. New cores are brought back only by people who cross the rim during the few days a blizzard blinds the machines outside. Those who cross hardly ever return. So Seoul people call the price of a core the price of a life.

## Three things that keep a machine alive: parts, knowledge, hands

For a machine to stay alive, three things must be there together: parts to replace, knowledge of how to fix it, and hands that can do the work.

### Parts

"Cannot make" parts come from five places.

| Source | What comes out | Condition in 2126 |
|---|---|---|
| Old stores | Stock of the warehouses, shops, public offices and hospitals from before the Great Blackout | Nearly exhausted. What is left lies around abandoned stations sunk in ice and inside deep buildings |
| Machines in abandoned stations and buildings | Circuit boards, motors and wire stripped from elevators, air handlers, subway cars and communications equipment | The steadiest source, but the road to it grows longer every year |
| The bodies of the dead | The machines they wore | Each polity has its own rule for taking them back ([Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/)) |
| War machines outside | Power cores, moving joints, sensing elements, hard shells | Gained only by crossing the rim in a blizzard. The most expensive |
| The unmapped station | The manuals and things left in the station Go Ye-jin found in 2112 | Only the Arc knows. What and how much remains is not known outside |

The circuit boards in use in Seoul fall by about 3% a year, because more die than are stripped. Repeated over a hundred years, the number of board-driven machines in Seoul in 2126 is about one fifteenth of the number in 2040.

### Knowledge

Each polity knows technology in its own way.

- **The Government knows by paper.** The Government holds the most equipment drawings, maintenance manuals and standards from the agencies and public corporations of the Republic of Korea. The taboo against putting the ledger and old official documents into the fibre-sugar vats kept that paper. But there are too few people to read it and carry it out by hand. Government archives hold more paper on how to fix things than people who can fix them.
- **The Free Cities know by hand.** Free City technology passes from hand to hand on the workbench. What is written down is a few lines of figures and a few drawings; the hands know the rest. When one workbench ends, one piece of technology that bench knew ends with it.
- **The Arc knows by manual and by body.** The knowledge of fitting machines to bodies and keeping them alive came from the manuals Go Ye-jin read for five years in the unmapped station. It passes by mouth and hand at the maintenance benches, and the bodies of the baptised themselves become the textbook.

### Hands

Of Seoul''s 300,000 people, about 6,000, 2%, can do "repair" work alone. About 3,600 are in the Free Cities (about 5% of their people), about 1,600 in the Arc (about 2.5%) and about 800 in the Government (about 0.5%). Of these, about 900 are "revive" hands who can handle circuit boards and battery cells. People who can perform the surgery that fits a machine to a body number about 120 in all of Seoul.

The Government has many people, much land and much paper; the Free Cities have many hands; the Arc has many hands that work on bodies. This imbalance binds the three polities to one another.

## The names of repair work

A trade keeps its name from the days of the Republic of Korea, or is named after what it handles.

| Trade | What it does | Where most are |
|---|---|---|
| Wind-machine wright | Raises wind machines, knocks ice off the blades, changes bearings | The Free Cities (Gangseo above all), Government bridges |
| Heat-pump fitter | Handles the compressors and refrigerant of ground heat pumps | The Free Cities |
| Well driller | Deepens wells and lowers pumps | The Free Cities. The core trade of the water supply contract |
| Water-wheel keeper | Keeps the under-ice water wheels and their channels | The Arc (Jamsil), Free City work crews |
| Lineworker | Joins wire, cable and talk lines. The work Go Ye-jin did | All three polities |
| Motor winder | Rewinds the coils of dead motors | The Free Cities |
| Lathe hand | Machines shafts, fittings and gun parts from metal | The Free Cities (Guro above all) |
| Battery maker | Picks live cells from dead batteries and binds them | The Free Cities, the Arc |
| Board hand | Transplants and revives circuit boards. The most precious "revive" trade | The Free Cities, the Arc |
| Gunsmith | Repairs and fits guns | The Free Cities, the Government |
| Reloader | Dresses cases and reloads rounds | The Free Cities, the Government |
| Net maker | Weaves and mends the nets over entrances and light-fields | All three polities. The commonest trade |
| Body fitter | Fits machines to bodies and tends their fixing points | The Arc (most), the Free Cities |
| Doctor | A medical worker who fits machines to bodies in Government fitting clinics. The name survives from the medical ranks of the Republic of Korea | The Government |

"Body fitter" is an Arc word. In the Free Cities a person doing the same work is simply called by the name of their workbench.

## How hands are passed down

Scarcity makes children take up their parents'' work. The road differs by polity.

- **The Government registers trades.** In the Government''s ledger every person''s trade is written down. A child of a household whose father or mother is registered as "plumbing" apprentices beside that trade from the age of twelve and is registered into it on their sixteenth birthday. Changing the entry takes the Dong Chief''s approval and a seal from the Assembly Member''s office. So Government hands pool in households. There are households that have done plumbing for generations and households that have climbed wind machines for generations. The maintenance manuals in Government archives go down to those households as notices, and the households copy and keep them. When households that know how to fix things dwindle, other households cannot fill their place, because the ledger binds the trade.
- **The Free Cities hand down the workbench.** What is inherited is not a trade but a workbench: its tools, its place and the bundle of contracts it has made. A workbench usually goes to a child of the household, but if the child lacks the hands it goes to an apprentice. An apprentice enters on a contract to work some years in return for learning the craft. When they have learned it all, the owner of the workbench gives surety for those hands, and only hands under surety take work in their own name at a contract meeting.
- **The Arc raises hands at the maintenance bench.** There is a bench in every station, run by the Bench Keeper. Children at the bench help with fixing-point care from an early age and grow up to be body fitters and board hands. The knowledge of the manuals goes down to each bench by mouth and hand only as far as that bench needs.

## What each generation loses

Each time hands cross a generation, something drops away. Seoul people put it this way: "Grandfather revived this board, father moved this board, and I keep this board."

With every generation some skills sink from "revive" to "repair" and from "repair" to "keep". In 2126 Seoul is full of machines that nobody can fix any more and that people only know how to use. Even when the Government archives hold the drawings, there are no hands to read them. When a machine stops, its work comes back to human hands. A station whose pump has stopped melts snow to drink; a station whose fan has stopped empties the beds on its deep level.

## Who holds what

| What | Government | Free Cities | Arc |
|---|---|---|---|
| Copper and wire | The most. The cables of the old city centre | Hands to rewind it | Little |
| Old rounds and powder | About three quarters | Some | Almost none |
| Primers | Cannot make them; buys them | Makes about 60,000 a year | Cannot make them |
| Circuit boards and sensing elements | Stripped from abandoned public-office equipment. Few hands to handle them | The most hands to handle them | Many hands, and the knowledge of the unmapped station |
| Batteries | Stockpiled old batteries | Hands to revive them | Hands to revive them, water-wheel power |
| Power cores | Dug out across the northern rim | Dug out across the south-western rim | Buys them to use |
| Clean surgery rooms | 1 | 2 | 6 |
| Living depot workshops | Gunja, Chang-dong | Sinjeong, Guro, Cheonwang, Banghwa | Godeok |
| Knowledge on paper | The most | Little | The manuals (not shown outside) |
| Hands | Few (about 800) | The most (about 3,600) | Hands that work on bodies (about 1,600) |

The table shows one thing each polity cannot have alone. The Government lacks hands and primers; the Free Cities are short of people, old rounds and clean rooms; the Arc is short of ammunition, iron and copper. The reasons the three need and fear one another show up this way in technology.

## Read together

- [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/): the life and price of machines worn on the body
- [Guns, Rounds and Drones](/wiki/Era-Arms-and-Tech-Level/): ammunition and primers, drones and talk lines
- [People and Machines](/wiki/People-and-Machines/): vehicles on the rails and depots, the machines inside Seoul
- [Structures](/wiki/Structures/): wind fields, water wheels, wells, ground heat holes
', '## 있다, 없다가 아니라

2126년 서울에서 기술은 "있다"와 "없다"로 나뉘지 않는다. 사람이 그 물건에 무엇을 해 줄 수 있느냐로 나뉜다. 서울 사람은 이것을 네 낱말로 말한다.

| 낱말 | 뜻 | 예 | 누구 손에 가장 많나 |
|---|---|---|---|
| 만든다 | 원료에서 새로 만든다 | 쇠를 깎은 축과 이음쇠, 용수철, 바람틀 날개, 구리선을 감은 모터 코일, 납을 녹여 부은 탄두, 그물, 눈 덮개, 섬유당 통, 펌프 몸통, 검은 화약 | 자유도시들의 작업대 |
| 고친다 | 망가진 것을 같은 꼴로 되살린다 | 모터, 펌프, 압축기, 열 펌프, 수차, 총, 몸에 단 기계의 움직이는 부분 | 자유도시들, 아크의 정비대 |
| 살린다 | 다시 만들 수 없는 속을 옮겨 심거나 짝을 맞춰 되살린다 | 죽은 전지에서 산 낱칸을 골라 새 꾸러미로 묶는다. 망가진 기계에서 산 회로판을 떼어 다른 기계에 옮긴다 | 아크, 자유도시들 |
| 못 만든다 | 서울 안에서 새로 만들 길이 없다 | 반도체 칩과 회로판, 감지 소자, 전지 낱칸, 광섬유, 빛을 내는 소자, 많은 양의 항생제, 많은 양의 뇌관 | 아무도. 남은 것과 바깥에서 떼어 오는 것뿐이다 |

쇠와 구리와 손으로 되는 것은 서울이 만든다. 칩과 화학이 드는 것은 서울이 쓰고 잃을 뿐이다. 그래서 기계 하나의 수명은 그 안에서 가장 먼저 죽는 "못 만드는" 부품의 수명과 같다. 모터는 몇 번이고 다시 감는다. 그러나 모터를 부리는 회로판이 죽으면 그 기계는 끝나거나, 손으로 부리는 기계로 낮아진다.

대정전 뒤 백 년 동안 "못 만든다"의 칸은 줄지 않았다. 사람들이 배운 것은 새로 만드는 법이 아니라 덜 쓰고 오래 살리는 법이다. 서울의 모든 기술은 역이 사람을 품는 네 한도, 곧 공간과 열과 물과 공기를 조금이라도 넓히는 수단이거나, 그 수단을 지키는 무기다.

## 서울의 전기

서울 전체가 늘 돌리는 전기는 약 5 MW다. 대정전 전 큰 건물 몇 채가 쓰던 양이다. 큰 발전소는 없다. 작은 원천 여럿을 이어 붙였고, 원천마다 주인과 약점이 있다.

| 원천 | 평균 출력 | 몫 | 형편 |
|---|---|---|---|
| 바람틀 | 약 3.6 MW | 72% | 다리 위, 강변, 묻힌 건물 꼭대기에 선다. 눈보라 때는 날개를 접어 오히려 준다 |
| 동력 덩이 | 약 0.7 MW | 14% | 테두리 너머 부서진 전쟁 기계에서 떼어 온 것 |
| 잠실수중보 수차 | 약 0.35 MW | 7% | 잘 돌 때 약 400 kW. 얼음 알갱이로 멎는 날을 넣은 평균이다 |
| 메탄 기관 | 약 0.2 MW | 4% | 메탄은 주로 밥 짓는 불이다. 남는 가스로 작은 기관을 돌리는 역이 몇 곳 있다 |
| 그 밖 | 약 0.15 MW | 3% | 손발로 돌리는 발전기, 다리 위에 남은 햇빛판 조각, 옛 전지 |

전기가 가는 곳은 이렇다.

| 쓰임 | 평균 |
|---|---|
| 열 펌프 | 약 2.5 MW. 땅속 열을 끌어올려 세 배의 열, 약 7.5 MW가 된다 |
| 빛 | 약 0.8 MW |
| 팬과 환기 | 약 0.5 MW |
| 물 펌프(우물, 취수구, 관로) | 약 0.4 MW |
| 작업장(선반, 용접, 모터 감기, 쇠 녹이기) | 약 0.45 MW |
| 연장, 드론, 무전기, 손전등 전지의 충전 | 약 0.2 MW |
| 몸에 단 기계의 충전 | 약 0.1 MW |
| 통신(유선 전화, 터널의 말줄) | 약 0.05 MW |

전기는 쓰고 나면 거의 다 역 안에서 열로 남는다. 열 펌프가 내는 열과 나머지 전기를 합하면 약 10 MW이고, 메탄 불과 나무 불과 고물 태우기가 약 6 MW를 더해 서울은 모두 약 16 MW의 열로 산다.

이 숫자가 말하는 것은 둘이다. 첫째, 서울 전기의 절반은 사람을 데우는 데 들어간다. 빛 하나를 더 켜는 일은 열 펌프 한 대를 덜 돌리는 일이다. 그래서 땅 밑의 빛은 배급되고, 역의 하루는 불을 켜는 시간과 끄는 시간으로 나뉜다. 둘째, 몸에 단 기계의 충전은 서울 전기의 2%뿐이다. 그런데도 그것이 다툼거리가 되는 것은 그 2%가 거의 아크 한 곳에, 그리고 잠실수중보 수차 하나에 몰려 있기 때문이다. 수차의 남쪽 끝은 아크가, 북쪽 끝은 정부가 쥐고 있다.

서울 전기 5 MW를 30만 명으로 나누면 한 사람에게 하루 약 0.4 kWh다. 자유도시 장터에서 하루 끼니와 물을 사는 데 드는 1.5 킬로(자유도시 장터의 값 단위. 전기 1킬로와트시가 1킬로다)는 한 사람 몫 전기의 나흘치다. 전기가 곧 값인 까닭이다.

## 전지와 추위

추위는 전지의 적이다. 서울 사람은 전지를 다루는 규칙 셋을 어려서부터 배운다.

1. **영하에서는 충전하지 않는다.** 0도 아래에서 충전한 전지는 속이 상하고, 심하면 안에서 불이 난다. 그래서 충전은 사람이 사는 승강장 층(8~14도)이나 깊은 터널 층(12~16도)에서만 한다. 대합실(0~6도)에 둔 충전대는 늘 탈이 난다.
2. **지상에서는 반만 쓴다.** 영하 18도의 지상에서 전지는 따뜻할 때 담은 힘의 절반 남짓만 내놓는다. 지상에 나가는 기계와 사람은 전지를 몸에 품거나 싸서 데운다.
3. **전지는 늙는다.** 서울에는 새 낱칸이 없다. 산 낱칸을 골라 묶은 꾸러미는 처음 담던 힘의 60~70%를 담고, 해마다 그 가운데 5~8%를 더 잃는다.

**동력 덩이.** 바깥 전쟁 기계의 몸속에서 떼어 온, 오래 힘을 내는 덩이다. 하나가 0.5~3 kW를 몇 달에서 몇 해 동안 내놓다가 어느 날 갑자기 멎는다. 서울 사람은 그 속을 열 수 없고, 열어서도 안 된다고 배운다. 무엇으로 힘을 내는지는 아무도 모른다. 2126년 서울에서 쓰이는 덩이는 약 400개다. 해마다 60~80개가 멎고 30~50개가 새로 들어오니, 그 수는 천천히 준다. 새 덩이는 눈보라가 바깥 기계의 눈을 가리는 며칠 동안 테두리를 넘어간 사람만 들고 온다. 넘어간 사람은 거의 돌아오지 않는다. 그래서 서울 사람은 덩이의 값을 목숨값이라 부른다.

## 기계를 살려 두는 셋: 부품, 지식, 손

기계가 살아 있으려면 셋이 함께 있어야 한다. 갈아 끼울 부품, 고치는 법을 아는 지식, 그것을 해낼 손이다.

### 부품

"못 만드는" 부품은 다섯 곳에서 온다.

| 출처 | 무엇이 나오나 | 2126년의 형편 |
|---|---|---|
| 옛 창고 | 대정전 전 창고, 상가, 관공서, 병원의 재고 | 거의 바닥났다. 남은 것은 얼음에 잠긴 버려진 역 둘레와 깊은 건물 속에 있다 |
| 버려진 역과 건물의 기계 | 엘리베이터, 공조기, 전동차, 통신 설비에서 떼는 회로판과 모터와 전선 | 가장 꾸준한 출처지만, 캐러 가는 길이 해마다 멀어진다 |
| 죽은 사람의 몸 | 몸에 달았던 기계 | 정체마다 돌려받는 규칙이 다르다([기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/)) |
| 바깥 전쟁 기계 | 동력 덩이, 움직이는 관절, 감지 소자, 단단한 껍데기 | 눈보라 때 테두리를 넘어서만 얻는다. 가장 비싸다 |
| 지도에 없는 역 | 고예진이 2112년에 찾은 역에 남아 있던 매뉴얼과 물건 | 아크만 안다. 무엇이 얼마나 남았는지는 밖에 알려지지 않았다 |

서울에서 쓰이는 회로판은 해마다 약 3%씩 준다. 떼어 오는 것보다 죽는 것이 많기 때문이다. 백 년 동안 이것이 되풀이되어, 2126년 서울에서 회로판으로 부리는 기계의 수는 2040년의 약 15분의 1이다.

### 지식

기술을 아는 방식은 정체마다 다르다.

- **정부는 종이로 안다.** 정부는 대한민국 관청과 공기업의 설비 도면, 정비 지침, 표준서를 가장 많이 갖고 있다. 장부와 옛 공문서를 섬유당 통에 넣지 않는 금기가 그 종이를 지켰다. 그러나 그것을 읽고 손으로 옮길 사람이 모자라다. 정부 서고에는 고칠 줄 아는 사람보다 고치는 법을 적은 종이가 더 많다.
- **자유도시들은 손으로 안다.** 자유도시 기술은 작업대 위에서 손에서 손으로 간다. 적어 두는 것은 수치 몇 줄과 그림 몇 장뿐이고, 나머지는 손이 안다. 작업대 하나가 끊기면 그 작업대가 알던 기술 하나가 함께 끊긴다.
- **아크는 매뉴얼과 몸으로 안다.** 몸에 기계를 맞추고 살려 두는 지식은 고예진이 지도에 없는 역에서 다섯 해 동안 읽은 매뉴얼에서 나왔다. 그 지식은 정비대에서 입과 손으로 전해지고, 세례자의 몸 자체가 교본이 된다.

### 손

서울 30만 명 가운데 "고친다"의 일을 혼자 해낼 수 있는 사람은 약 6,000명, 2%다. 자유도시들에 약 3,600명(인구의 약 5%), 아크에 약 1,600명(약 2.5%), 정부에 약 800명(약 0.5%)이 있다. 그 가운데 회로판과 전지 낱칸을 다루는 "살린다"의 손은 약 900명이다. 몸에 기계를 맞추는 수술을 할 수 있는 사람은 서울 전체에 약 120명이다.

정부는 사람과 땅과 종이가 많고, 자유도시들은 손이 많고, 아크는 몸을 다루는 손이 많다. 이 기울기가 세 정체를 서로에게 묶는다.

## 고치는 일의 이름

일의 이름은 대한민국 시절의 직업 이름을 그대로 쓰거나, 그 일이 만지는 것에서 짓는다.

| 일 | 하는 것 | 어디에 많나 |
|---|---|---|
| 바람틀공 | 바람틀을 세우고, 날개의 얼음을 떼고, 베어링을 간다 | 자유도시들(특히 강서), 정부의 다리 위 |
| 열펌프공 | 땅속 열 펌프의 압축기와 냉매를 다룬다 | 자유도시들 |
| 우물공 | 우물을 더 깊이 파고 펌프를 내린다 | 자유도시들. 급수계약의 중심 일 |
| 수차공 | 얼음 밑 수차와 그 물길을 지킨다 | 아크(잠실), 자유도시 작업조 |
| 망공 | 전선과 케이블과 말줄을 잇는다. 고예진이 하던 일이다 | 세 정체 모두 |
| 권선공 | 죽은 모터의 코일을 다시 감는다 | 자유도시들 |
| 선반공 | 쇠를 깎아 축과 이음쇠와 총의 부품을 만든다 | 자유도시들(특히 구로) |
| 전지공 | 죽은 전지에서 산 낱칸을 골라 묶는다 | 자유도시들, 아크 |
| 판공 | 회로판을 옮겨 심고 살린다. "살린다"의 가장 귀한 일이다 | 자유도시들, 아크 |
| 총공 | 총을 고치고 맞춘다 | 자유도시들, 정부 |
| 탄공 | 탄피를 손질하고 탄을 다시 채운다 | 자유도시들, 정부 |
| 그물공 | 출입구와 빛밭의 그물을 짜고 깁는다 | 세 정체 모두. 가장 흔한 일 |
| 맞춤이 | 몸에 기계를 맞추고 그 이음 자리를 돌본다 | 아크(가장 많다), 자유도시들 |
| 의사 | 정부 시술소에서 몸에 기계를 다는 의료인. 대한민국 의료 직제가 남은 이름이다 | 정부 |

맞춤이는 아크의 말이다. 자유도시들에서는 같은 일을 하는 사람을 그냥 그 작업대의 이름으로 부른다.

## 손이 물려지는 길

결핍 때문에 자식이 부모의 일을 물려받는다. 그 길은 정체마다 다르다.

- **정부는 직종을 기재한다.** 정부 장부에는 사람마다 직종이 적힌다. 아버지나 어머니가 "배관"으로 기재된 집의 아이는 열두 살부터 같은 직종 곁에서 견습하고, 열여섯 살 생일에 그 직종으로 이어 기재된다. 기재를 바꾸려면 동장의 결재와 국회의원 사무소의 도장이 든다. 그래서 정부의 손은 집안에 고인다. 몇 대째 배관을 하는 집안, 몇 대째 바람틀에 오르는 집안이 있다. 정부 서고의 정비 지침은 고시로 그 집안들에 내려가고, 집안은 그것을 베껴 지닌다. 고칠 줄 아는 집안이 줄어도 그 자리를 다른 집안이 채우지 못한다. 장부가 직종을 묶기 때문이다.
- **자유도시들은 작업대를 물린다.** 물려받는 것은 직종이 아니라 작업대, 곧 연장과 자리와 그 작업대가 맺은 계약의 묶음이다. 작업대는 대개 집안의 자식에게 가지만, 자식의 손이 모자라면 견습에게 간다. 견습은 몇 해를 일하는 대신 기술을 배우는 계약을 맺고 들어온다. 다 배우면 작업대 주인이 그 손을 보증하고, 보증받은 손만 계약회에서 제 이름으로 일을 받는다.
- **아크는 정비대에서 기른다.** 정비대는 역마다 있고 정비장이 맡는다. 정비대의 아이들은 어려서부터 이음 자리 돌봄을 돕고, 자라서 맞춤이와 판공이 된다. 매뉴얼의 지식은 정비대마다 필요한 만큼만 입과 손으로 내려간다.

## 세대마다 잃는 것

손이 한 세대를 건널 때마다 무언가가 떨어진다. 서울 사람은 이렇게 말한다. "할아버지는 이 판을 살렸고, 아버지는 이 판을 옮겼고, 나는 이 판을 지킨다."

한 세대가 지날 때마다 "살린다"는 "고친다"로, "고친다"는 "지킨다"로 내려앉는 기술이 있다. 2126년 서울에는 아무도 고칠 줄 모르게 되어 쓰는 법만 남은 기계가 많다. 정부 서고에 그 기계의 도면이 있어도 읽을 손이 없다. 기계가 하나 멎으면, 그 기계가 하던 일은 사람의 손으로 돌아온다. 펌프가 멎은 역은 눈을 녹여 마시고, 팬이 멎은 역은 깊은 층의 잠자리를 비운다.

## 누가 무엇을 쥐나

| 무엇 | 정부 | 자유도시들 | 아크 |
|---|---|---|---|
| 구리와 전선 | 가장 많다. 옛 도심의 케이블 | 다시 감는 손 | 적다 |
| 옛 탄과 화약 | 약 4분의 3 | 일부 | 거의 없다 |
| 뇌관 | 만들지 못하고 산다 | 해마다 약 6만 개를 만든다 | 만들지 못한다 |
| 회로판과 감지 소자 | 버려진 관공서 설비에서 떼어 온다. 다룰 손이 적다 | 다루는 손이 가장 많다 | 다루는 손이 많고, 지도에 없는 역의 지식이 있다 |
| 전지 | 옛 전지를 쌓아 두었다 | 되살리는 손 | 되살리는 손, 수차 전기 |
| 동력 덩이 | 북쪽 테두리를 넘어 캐 온다 | 남서쪽 테두리를 넘어 캐 온다 | 사서 쓴다 |
| 깨끗한 수술방 | 1곳 | 2곳 | 6곳 |
| 살아 있는 차량기지 작업장 | 군자, 창동 | 신정, 구로, 천왕, 방화 | 고덕 |
| 종이로 된 지식 | 가장 많다 | 적다 | 매뉴얼(밖에 내놓지 않는다) |
| 손 | 적다(약 800) | 가장 많다(약 3,600) | 몸을 다루는 손(약 1,600) |

이 표에서 정체마다 혼자 갖지 못한 것이 하나씩 보인다. 정부는 손과 뇌관이 없고, 자유도시들은 사람과 옛 탄과 깨끗한 방이 모자라고, 아크는 탄약과 쇠와 구리가 모자란다. 세 정체가 서로 필요하고 서로 두려운 까닭이 기술에서는 이 꼴로 드러난다.

## 함께 읽기

- [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/): 몸에 다는 기계의 한살이와 값
- [총, 탄, 드론](/wiki/Era-Arms-and-Tech-Level/): 탄약과 뇌관, 드론과 말줄
- [사람과 기계](/wiki/People-and-Machines/): 레일 위의 탈것과 차량기지, 서울 안의 기계
- [구조물](/wiki/Structures/): 바람틀 밭, 수차, 우물, 땅속 열 구멍
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Offices-and-Ranks', 'Titles and Offices', '칭호와 자리', 'offices', 0, '## Three ladders

Titles in Seoul come from what a post actually does or guards. Whoever runs a station is a Stationmaster, whoever guards a ferry crossing is a Ferry Keeper, whoever runs a maintenance bench is a Bench Keeper. The three polities call their posts by different words, but the tiers of posts are the same five: the station, the dong, the district, the whole polity, and the one person at the top. One district is one duchy, and Seoul''s 25 districts are divided 14 to the Government, 7 to the Free Cities and 4 to the Arc.

| Tier | Government | Free Cities | Arc |
|---|---|---|---|
| Station | Stationmaster | Station Foreman | Bench Keeper |
| Dong | Dong Chief | Section Chief | Shelter Head |
| District | Member of the National Assembly | Different in each city (Duke of Gwanak, Dongjak Ferry Keeper, Yeongdeungpo Market Master, Guro Works Master, Geumcheon Edge Warden, Yangcheon Depot Master, Gangseo Wind Keeper) | Head of the Near House |
| Whole polity | the National Assembly | None. Only the contract meetings opened as needed, and their Hosts | the Seat of the Four Near Houses |
| Top | President for Life | None | Hierophant |

## The Government: where the titles of the Republic of Korea survive

The Government founded no new country. It is the institutions of the Republic of Korea, hollowed out one by one yet keeping their names and forms. So nearly all Government titles are the titles of the Republic of Korea as they were. Making almost no new words is the Government''s character.

### The National Assembly and its Members

There is one Assembly. Like the National Assembly of the Republic of Korea it is unicameral, and its only members are Members of the National Assembly. There are fourteen, one seat for each Government district. Each district''s Member holds that district''s duchy. The National Assembly building on Yeouido stands empty across the river, and the Assembly meets in an old conference room in the basement of the main building of the Government Complex Seoul.

Elections are held every four years. Carrying on the numbering of the Republic of Korea''s assemblies, the Assembly of 2126 is the 47th, opened in 2124. Registered adults stamp their ballots at the dong centre. But the winner is settled before the vote: the person the district''s Member household backs. When a Member dies or steps down, the head of that household names an heir, and the heir becomes the candidate at the next election. People call this "handing down the seat".

On paper there are many parties, but in practice there are only two, the OMO Party and the Claw Party. The OMO Party is the party of contracts, which holds that the ledger survives only by contracting across the river for technology and parts; the Claw Party is the party of the ledger, which holds that the land and labour north of the river must be self-sufficient. In 2126 the seats are OMO Party 6, Claw Party 8.

### The President for Life and acclamation

The President is produced by the Members of the National Assembly from among themselves. The President serves for life. The day after a President dies, the **acclamation** opens. The fourteen Members stamp their seals one after another under a candidate''s name, and the acclamation succeeds only when all fourteen have stamped. This is called "the fourteen seals". If even one does not stamp, they meet again the next day. So the President is always someone all fourteen households can accept, and the person from the strongest household seldom becomes President.

The oldest Member presides over the acclamation and signs as acting President until it is over. A Member who becomes President gives up the seat, and the seat passes to the heir of the President''s household. The President holds no district. The President''s work is signing: appointing ministers, stamping notices, writing the commissions of army commanders.

### Ministries and central institutions

The ministries in the Government Complex Seoul kept their names and seals. What they do is far narrower than before the Great Blackout, and nearly all of it concerns the ledger and rations.

| Institution | What it does in 2126 |
|---|---|
| Ministry of the Interior and Safety | Keeps the master copy of resident registration. Disaster notices, civil defence, oversight of district offices and dong centres |
| Ministry of Climate, Energy and Environment | Water and electricity. Intakes and wells, the wind machines on bridges and riverbanks, the working side of the water supply contract |
| Korea Forest Service | Firewood. Felling permits on Bukhansan and Dobongsan |
| Ministry of Land, Infrastructure and Transport | Stations and tunnels. The stationmaster service, entrance management, station quotas |
| Ministry of Agriculture, Food and Rural Affairs | Meals. Fibre-sugar vats and mushroom cellars, allotting light-field plots |
| Ministry of Health and Welfare | Health posts and the medical corps, machine-body registration and permits for Arc maintenance |
| Ministry of Justice | Strike-off hearings, carrying out labour sentences, keeping the hand-copied statute books |
| Ministry of National Defense | Registration of conscripts and reservists, ammunition registration |
| National Intelligence Service | The institution said to know what happens off the ledger. At the foot of Namsan |
| Bank of Korea | Prints the ration tokens and sets their value |
| Office of the President, National Assembly Secretariat | The President''s signature and guard. The Assembly''s records, the acclamation seal book, the party register |

The Supreme Court, the Constitutional Court, the Prime Minister, the Ministry of Foreign Affairs and many other posts remain on the organisation chart but stand empty. The Government does not strike them out, because striking them out would weaken its claim to have carried on the Republic of Korea. Ministers and commissioners are appointed by the President, but the posts mostly go to people from Member households.

### Head of the District Office, Dong Chief, Stationmaster

Government work starts at the station and ends at the district office. The line of approval is "Stationmaster, then Dong Chief, then Head of the District Office, then Member of the National Assembly".

| Post | What it does | Who holds it |
|---|---|---|
| Stationmaster | The station''s entrances, heat, water, air and quota. Order inside the station | Stationmaster households. The old subway station staff service became hereditary |
| Dong Chief | Runs the dong centre: rations, the ledger copy, petitions, moving-in seals | Appointed by the Member. Usually the head of a civil-servant household |
| Head of the District Office | Stamps the Member''s seal in the Member''s place, issues district notices, holds petition hearings | Appointed by the Member. A relative of the Member household or a long-serving civil-servant household |
| Member of the National Assembly | The duchy. Holds the district office | The Member household |

The Head of the District Office is a post that holds no land. The Stationmaster ranks below the Dong Chief and is more feared than the Dong Chief. The Stationmaster decides whether to close an entrance, whether to stop surface work in a blizzard, and which households sleep on the deep level. The official Government people meet most often is neither the Member nor a minister but the clerk at the dong centre counter. One ration clerk can decide a household''s meals for the month.

### Army ranks

The Government''s army is the national army: the army of the Republic of Korea, shrunk but keeping its name and ranks. The ranks are those of the Republic of Korea''s army as they were: Private, Private First Class, Corporal, Sergeant, Staff Sergeant, Sergeant First Class, Master Sergeant, Second Lieutenant, First Lieutenant, Captain, Major, Lieutenant Colonel, Colonel. The Ministry of National Defense and the Capital Defense Command are at Samgakji in Yongsan-gu, and the commander is appointed by the President. Each district has a district unit that its Member raises from the district''s conscripts and reservists, and the Korea Military Academy at Hwarangdae in Nowon-gu trains officers.

## The Free Cities: different names in every city

The Free Cities are not one power. They are cities independent of one another, and each holds its own duchy. They have no collective name, and no one person stands above them. Free City people say "there is no seat above". So titles also differ from city to city, and come from the work each city lives by.

### The heads of the cities

| City | Title | How chosen |
|---|---|---|
| Gwanak | Duke | Handed down in I Ilseop''s household. When the Government across the river called its districts duchies and gave them to its Members, Gwanak''s leading household took the same word and declared that it sat at the same height as the Government |
| Dongjak | Ferry Keeper | Chosen by the Crossing Chiefs of the five crossings from among themselves. A Ferry Keeper is Ferry Keeper only while holding a crossing |
| Yeongdeungpo | Market Master | Market households take it in turn, three years each, in a fixed order |
| Guro | Works Master | The workbench owner who has kept the most sureties |
| Geumcheon | Edge Warden | Chosen by the rim crew from among those who have crossed the rim and come back. For life |
| Yangcheon | Depot Master | Handed down in the household that first revived the Sinjeong depot |
| Gangseo | Wind Keeper | Chosen by the workbench owners of the wind fields. For life, but steps down if the wind fields fail to deliver the watts written in the contract for two long-dark halves running |

There is a reason each city chooses its head differently. With no way to judge whose skill is higher, the seven cities as a whole could not choose a leader. So each city found something its own work could measure. Gangseo measures watts, Guro the number of sureties kept, Geumcheon coming back alive from the rim, Dongjak the crossings held. Yangcheon and Gwanak, which found nothing to measure, hand the post down in a household. Yeongdeungpo measures nothing and rotates.

### Section Chief and Station Foreman

The Free Cities call a dong a "section": a few stations and the tunnels between them, bound together. The Section Chief looks after the section''s tunnels, cables, light-field plots and scrap grounds, and is named by the city''s head. The Station Foreman looks after the station''s entrances, heat, lighting hours and air, and is chosen by the workbench owners who live in the station. Yangcheon has a Shift Chief for each depot shift, Gangseo a Field Chief for each wind field, and Dongjak a Crossing Chief for each crossing.

### Posts within a workbench

The foundation of Free City work is the workbench: a workshop held by one household from generation to generation, and that household''s craft.

| Post | Who |
|---|---|
| Bench Owner | The person who holds the workbench and its seal. Usually the eldest child succeeds, but an eldest child who has not shown the hands cannot |
| Hand | Someone who can do the bench''s craft with their own hands. When the Bench Owner recognises someone as a hand, that person wears the bench''s mark |
| Apprentice | Someone learning to be a hand. Usually joins a bench at about twelve |
| Crew Chief | Leads a work crew gathered from several benches for one contract. When the contract is paid in full, the crew disperses |
| Labourer | Someone who has not shown a craft. Earns wages but cannot contract in their own name |

### Contract meetings and the Host

Whenever the cities have something to decide together, they open a contract meeting. A contract meeting has no fixed place, no standing body and no staff of its own. The city that calls it hosts it, and that city''s head becomes the **Host**. The Host has no vote. The Host only reads out the sheets, checks the figures and sets the order of sealing. A sheet sealed at a contract meeting binds only the cities that stamped it.

## The Arc: the Hierophant and the Near Houses

Arc titles come from the words of the shelter years and the words of body and repair.

### The Hierophant

Go Ye-jin is the Hierophant of the Arc. Believers call the Hierophant the Messiah, and call the Hierophant''s rulings "the Hierophant''s word". The Hierophant''s word is not written down; it becomes law as people repeat it. The Hierophant''s parts are not counted.

### The Seat of the Four Near Houses and the Heads of the Near Houses

The four Arc districts are each in the charge of one of four Near Houses. A Near House is of the Hierophant''s blood, or a family that has come close to the Hierophant through marriage and long service at the Hierophant''s side. Its leader is the **Head of the Near House**, and the Hierophant can appoint and remove Near Houses. The gathering of the four Heads before the Hierophant is called **the Seat of the Four Near Houses**. It meets in the Hierophant''s house at Jamsil on the day the long-dark half begins and before any large promise with another polity. The Seat hears disputes, divides electricity and parts among the Near Houses and settles promises with other polities. Decisions end with the Hierophant''s word; the Heads never cast votes.

### Shelter Head and Bench Keeper

The Arc calls a dong by its old name, "shelter". Each shelter from before the Arc was bound together is a dong today, and its leader is the **Shelter Head**. The Shelter Head keeps the shelter''s register and baptismal list. Each station has a maintenance bench, and the person in charge of it is the **Bench Keeper**. The Bench Keeper holds the station''s bench and its baptismal roll, and calls the roll at the first shift every day.

### Part count and title

Beside its ladder of titles the Arc has a separate ladder of part count. Part count is spoken as a number, not a title. Even so, each title has a least part count.

| Title | Least part count | Why |
|---|---|---|
| Hierophant | Not counted | |
| Head of the Near House | 2 | No one who has not shown faith in the body may hold a district |
| Shelter Head | 1 | Keeps the baptismal list of the shelter''s people |
| Bench Keeper | 3 | Must have had their own body opened before opening another''s |
| Everyone else | 0 | The unbaptised also eat and work in the Arc |

So in the Arc it is common for a Bench Keeper to have more parts than a Head of the Near House. A fitter with many parts may even come before a Near House cousin in the maintenance order. People call this **blood and iron**: the quarrel between those who say the bloodline should decide and those who say the iron in the body should.

### Other posts

| Post | What it does |
|---|---|
| Near House elder | A sibling or someone of the parents'' generation of the Head of the Near House |
| Guard Captain | Leads a Near House''s army or the guard of the Hierophant''s house |
| Word Keeper | Keeps the Hierophant''s word in the Hierophant''s house |
| Negotiator, tally keeper | Give and take shares with outsiders at the exchange posts. The tally keeper handles the tallies of day charges and maintenance turns |
| Fitter, field fitter, recovery carer | Fit and tend parts. The recovery carer looks after those sick after baptism |
| Roll keeper | Writes the baptismal roll |

## English names of titles

In English, titles are not dressed in the titles of another country''s history; they are given as plain job words, as throughout this page. The three settled titles are Member of the National Assembly (Assembly Member for short), Duke of Gwanak and Hierophant. The posts of station, dong and district are Stationmaster, Dong Chief, Head of the District Office, Station Foreman, Section Chief, Bench Keeper, Shelter Head and Head of the Near House. The heads of cities are Ferry Keeper, Market Master, Works Master, Edge Warden, Depot Master and Wind Keeper, besides the Duke.

## About the names

Of the titles on this page, Member of the National Assembly, Duke of Gwanak and Hierophant are settled names, and that the President serves for life is a settled fact. The other titles and post names are the names this wiki uses for now, and may change to other names. This page does not say who the current President is.

## Read together

- [Government Society](/wiki/Government-Society/)
- [Free City Society](/wiki/Free-City-Society/)
- [Arc Society](/wiki/Arc-Society/)
- [The Three Polities of Seoul](/wiki/Sixteen-States/)
', '## 세 사다리

서울의 칭호는 그 자리가 실제로 하는 일이나 지키는 것에서 나온다. 역을 맡으면 역장이고, 나루를 지키면 나루지기이고, 정비대를 맡으면 정비장이다. 세 정체는 저마다 다른 말로 자리를 부르지만, 자리의 층은 다섯으로 같다. 역, 동, 구, 세력 전체, 그리고 맨 위의 한 사람이다. 구 하나가 공작령 하나이고, 서울의 25개 구는 정부 14, 자유도시 7, 아크 4로 나뉜다.

| 층 | 정부 | 자유도시들 | 아크 |
|---|---|---|---|
| 역 | 역장 | 역반장 | 정비장 |
| 동 | 동장 | 구간장 | 대피소장 |
| 구 | 국회의원 | 도시마다 다르다(관악 공작, 동작 나루지기, 영등포 장주, 구로 공장장, 금천 경계장, 양천 기지장, 강서 바람지기) | 곁집장 |
| 세력 전체 | 국회 | 없다. 그때그때 여는 계약회와 그 자리주인뿐이다 | 네 곁집 자리 |
| 맨 위 | 종신 대통령 | 없다 | 교주 |

## 정부: 대한민국의 직함이 남은 곳

정부는 새 나라를 세우지 않았다. 대한민국의 기관이 하나씩 속이 비어 가면서도 이름과 꼴을 지킨 것이 정부다. 그래서 정부의 칭호는 거의 모두 대한민국의 직함 그대로다. 새 낱말을 거의 만들지 않는다는 것이 정부의 성격이다.

### 국회와 국회의원

국회는 하나뿐이다. 대한민국 국회처럼 단원제이고, 의원은 국회의원뿐이다. 국회의원은 열넷으로, 정부의 구 하나에 의석 하나다. 각 구의 국회의원이 그 구의 공작령을 쥔다. 여의도 국회의사당은 강 건너에 남아 비어 있고, 국회는 정부서울청사 본관 지하의 옛 회의실에서 열린다.

선거는 4년마다 치른다. 대한민국 국회의 회기 번호를 그대로 이어, 2126년의 국회는 2124년에 연 제47대 국회다. 등재 성인은 동주민센터에서 투표 용지에 도장을 찍는다. 그러나 이길 후보는 투표 전에 정해져 있다. 그 구 의원 집안이 민 사람이다. 국회의원이 죽거나 물러나면 그 집안의 세대주가 후계를 지명하고, 그 후계가 다음 선거의 후보가 된다. 사람들은 이것을 "의석을 물린다"고 말한다.

서류상으로는 여러 당이 있지만 실제 당은 OMO당과 클로당 둘뿐이다. OMO당은 강 건너와 계약해 기술과 부품을 들여와야 장부도 산다고 보는 계약의 당이고, 클로당은 강 북쪽 땅과 일손으로 자급해야 한다고 보는 장부의 당이다. 2126년의 의석은 OMO당 6, 클로당 8이다.

### 종신 대통령과 추대

대통령은 국회의원들이 국회의원 가운데서 낸다. 대통령은 종신이다. 대통령이 죽은 다음 날 **추대**가 열린다. 국회의원 열넷이 후보의 이름 아래 차례로 도장을 찍고, 열넷 모두가 찍어야 추대가 이루어진다. 이것을 "열네 도장"이라 한다. 한 사람이라도 찍지 않으면 다음 날 다시 모인다. 그래서 대통령은 언제나 열네 집안 모두가 받아들일 수 있는 사람이고, 가장 힘센 집안의 사람이 대통령이 되는 일은 드물다.

추대는 국회의원 가운데 가장 나이 많은 사람이 맡고, 추대가 끝날 때까지 그 사람이 대통령 권한대행으로 결재한다. 대통령이 된 국회의원은 의석을 내놓고, 그 의석은 대통령 집안의 후계에게 물린다. 대통령은 구를 쥐지 않는다. 대통령이 하는 일은 결재다. 부처 장관을 임명하고, 고시에 도장을 찍고, 국군 지휘관의 임명장을 쓴다.

### 부처와 중앙 기관

정부서울청사의 부처들은 이름과 도장을 지켰다. 하는 일은 대정전 전보다 훨씬 좁고, 거의 모두 장부와 배급에 관한 것이다.

| 기관 | 2126년에 하는 일 |
|---|---|
| 행정안전부 | 주민등록 원부를 지킨다. 재난 사태 고시, 민방위, 구청과 동주민센터의 감독 |
| 기후에너지환경부 | 물과 전기. 취수구와 우물, 다리와 둔치의 바람틀, 급수계약의 실무 |
| 산림청 | 땔감. 북한산과 도봉산의 벌목 허가 |
| 국토교통부 | 역과 터널. 역장 직제, 출입구 관리, 역 정원 산정 |
| 농림축산식품부 | 끼니. 섬유당 통과 버섯 굴, 빛밭 자리 배정 |
| 보건복지부 | 보건소와 의료단, 기계 몸 기재와 아크 정비 허가 |
| 법무부 | 말소 심의, 노역 처분의 집행, 법전 필사본 관리 |
| 국방부 | 징병과 예비군의 기재, 탄약 기재 |
| 국가정보원 | 장부 밖의 일을 안다는 기관. 남산 자락에 있다 |
| 한국은행 | 배급 증표를 찍고 그 값을 정한다 |
| 대통령실, 국회사무처 | 대통령의 결재와 경호. 국회의 기록과 추대 도장부, 정당 등록부 |

대법원, 헌법재판소, 국무총리, 외교부와 그 밖의 여러 자리는 직제표에 남아 있지만 비어 있다. 정부는 그 자리를 지우지 않는다. 지우면 대한민국을 이어 왔다는 말이 약해지기 때문이다. 장관과 청장은 대통령이 임명하지만, 그 자리는 대체로 의원 집안 사람에게 간다.

### 구청장, 동장, 역장

정부의 일은 역에서 시작해 구청에서 끝난다. 결재선은 "역장 → 동장 → 구청장 → 국회의원"이다.

| 자리 | 하는 일 | 누가 앉나 |
|---|---|---|
| 역장 | 역의 출입구, 열, 물, 공기, 정원. 역 안의 질서 | 역장 집안. 옛 지하철 역무원 직제가 대물림됐다 |
| 동장 | 동주민센터를 이끈다. 배급, 장부 사본, 민원, 전입 도장 | 국회의원이 임명한다. 대개 공무원 가구의 세대주 |
| 구청장 | 국회의원의 도장을 대신 찍고, 구 고시를 내고, 민원 심리를 연다 | 국회의원이 임명한다. 의원 집안의 친족이나 오래 섬긴 공무원 가구 |
| 국회의원 | 공작령. 구청을 쥔다 | 의원 집안 |

구청장은 땅을 쥐지 않는 직책이다. 역장은 동장보다 아래이면서 동장보다 무섭다. 출입구를 닫을지, 눈보라에 지상 일을 멈출지, 어느 세대를 깊은 층에 재울지 역장이 정한다. 정부 사람이 가장 자주 마주치는 공무원은 국회의원도 장관도 아닌 동주민센터 창구의 서기다. 배급 서기 한 사람이 한 세대의 이번 달 끼니를 정할 수 있다.

### 국군의 계급

정부의 군대는 국군이다. 대한민국 국군이 이름과 계급을 지킨 채 줄어든 것이다. 계급도 이병, 일병, 상병, 병장, 하사, 중사, 상사, 소위, 중위, 대위, 소령, 중령, 대령으로 대한민국 국군 그대로다. 국방부와 수도방위사령부는 용산구 삼각지에 있고, 사령관은 대통령이 임명한다. 구마다 국회의원이 그 구의 징집병과 예비군으로 꾸리는 구 부대가 있고, 노원구 화랑대의 육군사관학교가 장교를 기른다.

## 자유도시들: 도시마다 다른 이름

자유도시들은 하나의 권력이 아니다. 서로 독립한 도시들이고, 도시마다 제 공작령을 쥔다. 묶어 부르는 이름도, 도시들 위에 서는 한 사람도 없다. 자유도시 사람은 이것을 "윗자리가 없다"고 말한다. 그래서 칭호도 도시마다 다르고, 그 도시가 먹고사는 일에서 나온다.

### 도시의 우두머리

| 도시 | 칭호 | 정하는 법 |
|---|---|---|
| 관악 | 공작 | 이일섭의 집안이 대물린다. 강 건너 정부가 구를 공작령이라 부르며 국회의원에게 쥐여 주자, 관악의 우두머리 집안이 같은 말을 가져와 정부와 같은 자리에 앉겠다고 선언했다 |
| 동작 | 나루지기 | 다섯 건널목의 건널목장이 저희 가운데서 뽑는다. 제 건널목을 쥐고 있는 동안만 나루지기다 |
| 영등포 | 장주 | 장터 집안들이 세 해씩 정해진 차례로 돌아가며 맡는다 |
| 구로 | 공장장 | 지킨 보증이 가장 많은 작업대주가 맡는다 |
| 금천 | 경계장 | 테두리를 넘었다 돌아온 사람 가운데서 경계조가 뽑는다. 종신이다 |
| 양천 | 기지장 | 신정 기지를 처음 되살린 집안이 대물린다 |
| 강서 | 바람지기 | 바람밭의 작업대주들이 뽑는다. 종신이지만 계약서에 적은 와트를 긴 밤 철 두 번 잇달아 채우지 못하면 물러난다 |

도시마다 우두머리를 정하는 법이 다른 데는 까닭이 있다. 누구 기술이 더 높은지 따질 방법이 없으니 일곱 도시 전체로는 지도자를 뽑지 못했다. 그래서 도시마다 제 일에서 잴 수 있는 것을 찾았다. 강서는 와트를, 구로는 지켜 낸 보증의 수를, 금천은 테두리에서 살아 돌아온 일을, 동작은 쥔 건널목을 잰다. 잴 것을 찾지 못한 양천과 관악은 집안이 대물린다. 영등포는 아무도 재지 않고 차례를 돌린다.

### 구간장과 역반장

자유도시들은 동을 "구간"이라 부른다. 역 몇 곳과 그 사이 터널을 묶은 단위다. 구간장은 구간의 터널, 케이블, 빛밭 자리, 고물 터를 맡고, 도시의 우두머리가 정한다. 역반장은 그 역의 출입구, 열, 빛 시간, 공기를 맡고, 역에 사는 작업대주들이 뽑는다. 양천에는 기지의 교대마다 교대장이, 강서에는 바람밭마다 밭장이, 동작에는 건널목마다 건널목장이 있다.

### 작업대 안의 자리

자유도시 일의 바탕은 작업대다. 한 집안이 대물려 쥐는 작업장이자 그 집안의 기술이다.

| 자리 | 누구인가 |
|---|---|
| 대주 | 작업대를 쥔 사람. 그 대의 도장을 가진다. 대개 맏이가 잇지만, 손을 보이지 못한 맏이는 잇지 못한다 |
| 손 | 그 대의 기술을 제 손으로 해낼 수 있는 사람. 대주가 손으로 인정하면 그 대의 표지를 단다 |
| 견습 | 손을 배우는 사람. 대개 열두 살 무렵 대에 붙는다 |
| 작업조장 | 계약 하나를 위해 여러 대에서 손을 모아 짠 작업조를 이끈다. 장을 다 갚으면 작업조는 흩어진다 |
| 일손 | 기술을 보이지 못한 사람. 품삯을 받지만 제 이름으로 계약하지 못한다 |

### 계약회와 자리주인

도시들이 함께 정할 일이 생기면 그때마다 계약회를 연다. 계약회에는 정해진 장소도, 상설 기구도, 딸린 사람도 없다. 부르는 도시가 자리를 맡고, 그 도시의 우두머리가 **자리주인**이 된다. 자리주인은 표를 갖지 않는다. 장을 읽어 주고, 수치를 맞춰 보고, 도장 찍는 차례를 정할 뿐이다. 계약회에서 맺은 장은 도장을 찍은 도시만 묶는다.

## 아크: 교주와 곁집

아크의 칭호는 대피소 시절의 말과 몸과 수리의 말에서 나온다.

### 교주

고예진이 아크의 교주다. 신도는 그를 메시아라 부르고, 그의 판정을 "교주의 말"이라 한다. 교주의 말은 글로 적지 않고, 사람들이 되풀이해 말하면서 법이 된다. 교주는 부위 수로 세지 않는다.

### 네 곁집 자리와 곁집장

아크 네 구는 곁집 넷이 하나씩 맡는다. 곁집은 교주의 핏줄이거나, 혼인과 오랜 곁 섬김으로 교주에게 가까워진 가문이다. 그 우두머리가 **곁집장**이고, 교주가 곁집을 정하고 물릴 수 있다. 곁집장 넷이 교주 앞에 모이는 자리를 **네 곁집 자리**라 한다. 긴 밤 철이 시작하는 날과 다른 정체와 큰 약속을 맺기 전에 잠실 교주의 집에서 열린다. 네 곁집 자리는 다툼을 듣고, 곁집 사이의 전기와 부품 몫을 나누고, 다른 정체와의 약속을 정한다. 결정은 교주의 말로 끝나고, 곁집장들이 표를 던지는 일은 없다.

### 대피소장과 정비장

아크는 동을 옛 이름대로 "대피소"라 부른다. 아크로 묶이기 전의 대피소 하나하나가 지금의 동이고, 그 우두머리가 **대피소장**이다. 대피소장은 대피소 사람의 명부와 세례 명단을 맡는다. 역에는 정비대가 있고, 그것을 맡은 사람이 **정비장**이다. 정비장은 역의 정비대와 세례록을 쥐고, 날마다 첫 교대에 세례록을 부른다.

### 부위 수와 칭호

아크에는 칭호 사다리 옆에 부위 수의 사다리가 따로 있다. 부위 수는 칭호가 아니라 숫자로 말한다. 그래도 칭호마다 가장 적은 부위 수가 있다.

| 칭호 | 가장 적은 부위 수 | 까닭 |
|---|---|---|
| 교주 | 세지 않는다 | |
| 곁집장 | 2 | 신앙을 몸으로 보이지 않는 사람은 구를 맡지 못한다 |
| 대피소장 | 1 | 대피소 사람의 세례 명단을 맡는다 |
| 정비장 | 3 | 남의 몸을 열기 전에 자기 몸이 먼저 열려 본 사람이어야 한다 |
| 그 밖의 사람 | 0 | 세례를 받지 않은 사람도 아크에서 먹고 일한다 |

그래서 아크에서는 정비장이 곁집장보다 부위가 많은 일이 흔하다. 부위가 많은 정비공이 정비 순번에서 곁집 사촌보다 앞서는 일도 있다. 사람들은 이것을 **피와 쇠**라 부른다. 핏줄이 정하자는 쪽과 몸에 든 쇠가 정하자는 쪽의 다툼이다.

### 그 밖의 자리

| 자리 | 하는 일 |
|---|---|
| 곁집 어른 | 곁집장의 형제나 부모 세대 |
| 호위장 | 곁집의 군대나 교주의 집 호위를 이끈다 |
| 말지기 | 교주의 집에서 교주의 말을 지킨다 |
| 교섭인, 셈꾼 | 바꿈터에서 바깥 사람과 몫을 주고받는다. 셈꾼은 하루 충전과 정비 차례의 셈표를 다룬다 |
| 정비공, 야전 정비공, 돌봄이 | 부위를 맞추고 손본다. 돌봄이는 세례를 받고 앓는 사람을 돌본다 |
| 세례록 기록꾼 | 세례 명단을 적는다 |

## 칭호의 영어 이름

영어로 옮길 때는 다른 나라 역사의 칭호로 꾸미지 않고 평범한 직업어를 쓴다. 국회의원은 Member of the National Assembly(줄여 Assembly Member), 관악 공작은 Duke of Gwanak, 교주는 Hierophant다. 역장은 Stationmaster, 동장은 Dong Chief, 구청장은 Head of the District Office, 역반장은 Station Foreman, 구간장은 Section Chief, 정비장은 Bench Keeper, 대피소장은 Shelter Head, 곁집장은 Head of the Near House다. 도시의 우두머리는 나루지기 Ferry Keeper, 장주 Market Master, 공장장 Works Master, 경계장 Edge Warden, 기지장 Depot Master, 바람지기 Wind Keeper다.

## 이름에 대하여

이 문서의 칭호 가운데 국회의원, 관악 공작, 교주는 정해진 이름이고, 대통령이 종신이라는 것도 정해진 사실이다. 그 밖의 칭호와 자리 이름은 이 위키가 지금 쓰는 이름이며, 앞으로 다른 이름으로 바뀔 수 있다. 지금의 대통령이 누구인지는 이 문서에 적지 않는다.

## 함께 읽기

- [정부 사회](/wiki/Government-Society/)
- [자유도시들의 사회](/wiki/Free-City-Society/)
- [아크 사회](/wiki/Arc-Society/)
- [서울의 세 정체](/wiki/Sixteen-States/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Oral-Stories', 'The Stories', '이야기', 'culture', 3, 'No one in Seoul in 2126 has seen the days before the Great Blackout. Those days came down as stories. Station people gave names to the machines outside and to the animals, and every one of those names gathered a story. This document collects the names and stories that pass between the stations of Seoul. The stories are not a record of fact. Some agree with the records, some have been reshaped in one polity''s way of speaking, and some are rumours nobody has confirmed. This document keeps them apart.

## Names Given to Machines

Station people do not call machines by machine names. They name them by look, sound and work. Only two names are borrowed from the old tales, the iron-eating beast Bulgasari and the dokkaebi light; the rest all come from how the machines look or what they do. Each polity may have other names in its official papers or at its maintenance benches, but these spoken names are understood everywhere in Seoul.

| Name | Why it is called that |
|---|---|
| [Claw Arms](/wiki/Hostile-Group-G13/) | Arms that picked up and moved goods in logistics warehouses. Light up a sleeping warehouse and they start picking up goods again |
| [Empty Carts](/wiki/Hostile-Group-G14/) | Carriers that run the track alone, with neither goods nor people |
| [Care Wheels](/wiki/Hostile-Group-G15/) | Wheeled machines that moved patients and carried medicine in the old hospitals. They still keep the old patient lists |
| [Girder Spiders](/wiki/Hostile-Group-G16/) | Many-legged machines that climb the columns of half-built towers |
| [Lamp Ants](/wiki/Hostile-Group-G25/) | Small six-legged machines that went round the utility tunnels lighting the evacuation routes |
| [One-Eye Towers](/wiki/Hostile-Group-G17/) | Watchtowers with a single round head that turns slowly |
| [Tunnel-Stoppers](/wiki/Hostile-Group-G18/) | The things that block the rail tunnels out of Seoul |
| [Growlers](/wiki/Hostile-Group-G19/) | Their engines sound like an animal growling in its throat |
| [Bulgasari](/wiki/Hostile-Group-G20/) | They strip wrecked machines to repair others, like the iron-eating beast of the old tales |
| [Ground-Knockers](/wiki/Hostile-Group-G21/) | Now and then they knock on the ground to sound out what is below |
| [Dokkaebi Lights](/wiki/Hostile-Group-G22/) | Many blue lights drift across the night sky |
| [Udukeoni](/wiki/Hostile-Group-G23/) | They stand still, covered in snow and frost, and wait. The name means one who stands blankly |
| [Doenoemi](/wiki/Hostile-Group-G24/) | They repeat the same words without end. The name means one who says it over and over |
| [Iron Dinosaurs](/wiki/Hostile-Group-G26/) | Arms like long necks and a heavy tread |

## What Was Heard from the Rim

The stories of people who crossed the rim and came back have long been told in the stations with fear. As far as the people of Seoul know, there is no sickness that turns a person into something else. The things in the stories are mostly what people saw of the rim machines.

| The thing in the story | What it was |
|---|---|
| Something that growls and chases you over the snow | The engine of a Growler |
| Blue lights drifting at night | Dokkaebi Lights |
| A knocking on the tunnel wall | The sound of a Ground-Knocker striking the ground, carried along the tunnel wall |
| A person standing still under frost | An Udukeoni stopped at a chokepoint |
| A child crying in the blizzard | The scraps of human voices recorded around the Great Blackout that the Doenoemi repeat |

So those who cross the rim teach this: If you hear a sound, do not look back. Do not go near a person standing under frost. Do not follow the crying in the blizzard. Do not drag your feet, and walk one at a time, well apart.

## Animal Stories

- **Large-billed crows.** The people of Seoul say crows remember people. Whoever chases off a crow pecking at a light-field roof is chased by the same flock the next day. Crows nest around the stations'' exhaust shafts, and in the long-dark half they roost there in flocks.
- **Feral dogs.** They are the descendants of house dogs abandoned at the Great Blackout. For a hundred years they have not left people''s side. Every station has a story of a pack of dogs following a fibre-digging crew, and every station has a story of a dog that came back to people.
- **Wild boar.** People at the mountain-foot stations say boar have grown smaller and longer-haired than before the Great Blackout, made so by a hundred years of hunger and cold. Meeting a male looking for a mate in a tunnel in the middle of the long-dark half is dangerous.
- **Raccoon dogs.** They sleep in their dens for most of the long-dark half. The saying "When the raccoon dogs wake, cover the light-fields" means the long-light half has come.

<a id="2026년-물과-부품-거래"></a>

## Water for Parts

This is the oldest story of the southwestern stations. In the first winter after the Great Blackout, at a station near the riverside water treatment centre there were people who knew how to pump water, and at a station near the factory grounds there were parts to run a generator. The station with water had no parts, and the station with parts had no water. Nobody could force anybody, so they bargained. They traded so many barrels of water for so many parts, and promised to do the same next month. The side that broke that promise found nobody would deal with it the next winter.

Free City people say this was the beginning of their cities. The promises of bargaining piled up into cities, and the number of promises kept became the measure of a person. The names of the stations and people in the story differ with the teller. Yeongdeungpo people say it was over by the Yangpyeong-dong intake; Guro people say it was by the Guro factory grounds. Either way, the story ends with the same words: "Numbers, not words." Free City people believe the water contracts made every thirty years came out of this story too.

## Stories of the Government

The Government''s stories are stories of the ledger. Government people take pride in having carried on the Republic of Korea, and say the ledger is the proof.

- **The empty Assembly hall at Yeouido.** When the river began to freeze, the National Assembly building at Yeouido became a lonely island across the river. The members moved to the Gwanghwamun Government complex to go on meeting, and the Yeouido hall has been empty since. Now the building is Yeongdeungpo land, and Yeongdeungpo holds its contract meetings with the Government in that hall. Government people walk as guests into the building their forebears left, and set their seals there. The old people of the Government grow short of words when they tell this story.
- **The ice of 2079.** When the Government tried to cross the ice and take the Yeongdeungpo intake, it was caught in a blizzard on the river and broken. Since then the river has been a line no army crosses. Soldiers of the National Armed Forces grow up hearing the stories of those who never came back from the river.
- **The cemetery that could not be reached.** The Seoul National Cemetery in Dongjak-dong lies across the river, and for a hundred years the Government has been unable to bury anyone there. So the Government buries those who served the nation at the site of the April 19th National Cemetery in Gangbuk-gu.
- **The New Year''s Eve bell.** The Bosingak bell was moved and hung in the concourse of Jonggak station. On the night the year turns it is struck thirty-three times, and the sound is carried by tunnel telephone to every district office. Government children remember it as the loudest sound in Seoul.

## Stories of the Free Cities

The stories of the Free Cities are short, full of numbers, and mostly survive as sayings.

| Saying | Meaning |
|---|---|
| "How''s the wind?" | A greeting. Asking whether today''s work will go |
| "Numbers, not words." | Said when making a promise. Without numbers it is not a promise |
| "Only as far as the seal goes." | Do not do work that is not in the contract |
| "A surety is paid back by hand." | If you broke a promise, you pay it back with work |
| "Outside my share." | Not my job |
| "Any kilos left?" | Do you have electricity to spare? The words that begin a favour |

Each city has its own stories.

- **Why Gwanak has a Duke.** When the Government across the river called its districts duchies and handed them to Members of the National Assembly, the ruling house of Gwanak took the same word and declared it would sit in the same place as the Government. So Gwanak insists on sealing contracts with the Government "duchy to duchy". People of other cities half laugh at this insistence and half envy it. Gwanak people say, "You only know once you light it."
- **The wind changes people.** Gangseo''s Wind Keeper, once chosen, serves for life, but steps down if the wind field in their charge fails to deliver the watts it promised for two long-dark halves in a row.
- **Guro''s surety boards.** Every workbench in Guro carves on a board the contracts it has made and whether they were paid in full. Skill cannot be measured, but the number of promises kept can be counted: that is Guro''s answer.
- **Geumcheon''s sleeve stripes.** A member of the Geumcheon edge crews sews a stripe onto a coat sleeve every time they cross the rim and come back. People with many stripes are rare.
- **Dongjak.** Dongjak people say, "You only know once you cross."

## Stories of Arc

The stories of Arc begin with the story of Go Ye-jin. This is the order every Arc person knows.

| Year | Story |
|---|---|
| 2112 | While repairing the Free City power grid, Go Ye-jin follows a dead cable and finds a station not on the map |
| 2112 to 2117 | She reads the manual for five years |
| Around 2117 | The first baptism. Twelve people |
| 2120 | Ji Yeon-hui stands beside Go Ye-jin at the shelter negotiations by the Tancheon |
| Around 2122 | The Gangnam shelters are bound together under the name Arc |

Arc people tell this as the story of "the one who came in along the abandoned line". When the Free Cities pushed the old grid onto one another, the line to the Gangnam shelters was taken on by no one, and the one who came in along that line and mended it became the Hierophant.

Each Near House has its own story. Songpa people speak of the day at the Tancheon negotiations in 2120 when they promised the electricity of the water wheels to Go Ye-jin''s maintenance bench. Gangdong people say, "We supply the water, and our seat is at the very end." At the Seocho benches Free City workshop speech can still be heard.

Arc speech is quiet and low. In the morning people ask, "Fitting well?", meaning, is your body all right. When beginning work or ending a quarrel they say, "Let''s mend it and use it," and when sending off the dead, "Become memory." Someone who skips fitting days or covets another''s parts is cursed as a "rusty hand".

## Rumours of Beyond the Belt

Rumours of what lies beyond the belt go round every station: that there are people living in stations beyond the belt too, that the winter is milder beyond the belt, that the people who drive the machines are still alive. None of them has ever been confirmed. In a hundred years no person, no news and no bird has come from beyond the belt. Of those who crossed the whole belt and went beyond it, no one is known to have returned.

What the three polities say about beyond the belt is in [Beyond Seoul: the Rim](/wiki/External-Theaters/).

## Related Documents

- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- [Faith and Rites](/wiki/Faith-Culture-Schism/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [Meals and Food](/wiki/Food-Culture/)
- [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/)
- [Century Annals 2026-2126](/wiki/Century-Annals/)
', '2126년 서울 사람은 대정전 전의 일을 직접 본 적이 없다. 그 일은 이야기로 내려왔다. 역 사람들은 바깥 기계와 짐승에 이름을 붙였고, 그 이름 하나하나에 이야기가 붙었다. 이 문서는 서울의 역에서 오가는 이름과 이야기를 모은다. 이야기는 사실 기록이 아니다. 어떤 것은 기록과 맞고, 어떤 것은 한 정체의 말투로 고쳐졌고, 어떤 것은 아무도 확인하지 못한 소문이다. 이 문서는 그것을 구별해 적는다.

## 기계에 붙인 이름

역 사람들은 기계를 기계 이름으로 부르지 않는다. 생김새와 소리와 하는 일로 이름을 붙인다. 옛이야기에서 빌린 이름은 쇠를 먹는 짐승 불가사리와 도깨비불 둘뿐이고, 나머지는 모두 생김새나 쓰임에서 나왔다. 정체마다 공문서나 정비대에서 쓰는 이름이 따로 있을 수 있지만, 서울 어디서나 통하는 것은 이 입말 이름이다.

| 이름 | 왜 그렇게 부르나 |
|---|---|
| [집게팔](/wiki/Hostile-Group-G13/) | 물류 창고에서 짐을 집어 옮기던 팔. 잠든 창고에 불을 켜면 다시 짐을 집는다 |
| [빈수레](/wiki/Hostile-Group-G14/) | 짐도 사람도 없이 혼자 선로를 오가는 운반차 |
| [돌봄바퀴](/wiki/Hostile-Group-G15/) | 옛 병원에서 환자를 옮기고 약을 나르던 바퀴 달린 기계. 지금도 옛 환자 명단을 지킨다 |
| [철골거미](/wiki/Hostile-Group-G16/) | 짓다 만 건물의 기둥을 타고 오르는 다리 많은 기계 |
| [등불개미](/wiki/Hostile-Group-G25/) | 지하 공동구를 돌며 피난길에 불을 켜던 다리 여섯 개의 작은 기계 |
| [외눈탑](/wiki/Hostile-Group-G17/) | 둥근 머리 하나가 천천히 도는 감시탑 |
| [굴막이](/wiki/Hostile-Group-G18/) | 서울에서 나가는 선로 굴을 막는 것 |
| [그르렁이](/wiki/Hostile-Group-G19/) | 엔진 소리가 짐승이 목을 울리는 소리 같다 |
| [불가사리](/wiki/Hostile-Group-G20/) | 부서진 기계를 뜯어 다른 기계를 고친다. 쇠를 먹는 옛이야기의 짐승처럼 |
| [땅두드리기](/wiki/Hostile-Group-G21/) | 가끔 땅을 두드려 땅속을 살핀다 |
| [도깨비불](/wiki/Hostile-Group-G22/) | 밤하늘에 푸른 불빛이 여럿 떠다닌다 |
| [우두커니](/wiki/Hostile-Group-G23/) | 눈과 서리를 뒤집어쓰고 멈춰 서서 기다린다 |
| [되뇌미](/wiki/Hostile-Group-G24/) | 같은 말을 끝없이 되뇐다 |
| [철공룡](/wiki/Hostile-Group-G26/) | 긴 목 같은 팔과 무거운 걸음 |

## 테두리에서 들려온 것

테두리를 넘었다 돌아온 사람들의 이야기는 오래전부터 역에서 무섭게 전해졌다. 서울 사람이 아는 한, 사람을 다른 것으로 바꾸는 병은 없다. 이야기 속의 것들은 대개 테두리 기계를 본 사람들의 말이다.

| 이야기 속의 것 | 무엇이었나 |
|---|---|
| 그르렁 소리를 내며 눈 위를 쫓아오는 것 | 그르렁이의 엔진 소리 |
| 밤에 떠다니는 푸른 불빛 | 도깨비불 |
| 터널 벽을 두드리는 소리 | 땅두드리기가 땅을 두드린 울림이 터널 벽을 타고 들려온 것 |
| 서리 앉은 채 선 사람 | 길목에 멈춰 선 우두커니 |
| 눈보라 속의 아이 울음 | 되뇌미가 되풀이하는, 대정전 무렵 녹음된 사람 목소리 조각 |

그래서 테두리를 넘는 사람은 이렇게 가르친다. 소리가 나도 돌아보지 마라. 서리 앉은 사람에게 다가가지 마라. 눈보라 속의 울음을 따라가지 마라. 발을 끌지 말고, 한 사람씩 떨어져 걸어라.

## 짐승 이야기

- **큰부리까마귀.** 서울 사람은 까마귀가 사람을 기억한다고 말한다. 빛밭 지붕을 쪼는 까마귀를 쫓아낸 사람은 다음 날 같은 까마귀 떼에게 쫓긴다는 것이다. 까마귀는 역의 배기 굴 둘레에 둥지를 짓고, 긴 밤 철에는 무리를 지어 그 둘레에서 잔다.
- **들개.** 대정전 때 버려진 집개의 후손이다. 백 년 동안 사람 곁을 떠나지 않았다. 섬유를 캐러 가는 작업조를 따라오는 들개 무리 이야기는 어느 역에나 있고, 사람에게 다시 길든 개 이야기도 어느 역에나 있다.
- **멧돼지.** 산자락 역 사람들은 멧돼지가 대정전 전보다 작아지고 털이 길어졌다고 말한다. 백 년의 굶주림과 추위가 그렇게 만들었다는 것이다. 긴 밤 철 한가운데 짝을 찾는 수컷을 터널에서 마주치면 위험하다.
- **너구리.** 긴 밤 철의 대부분을 굴에서 잔다. "너구리가 깨면 빛밭을 덮어라"는 말은 긴 낮 철이 왔다는 뜻이다.

<a id="2026년-물과-부품-거래"></a>

## 물과 부품

남서쪽 역들에서 가장 오래된 이야기다. 대정전 첫 겨울, 강가 정수센터 자리 가까운 역에 물을 퍼 올릴 줄 아는 사람들이 있었고, 공장 터 가까운 역에 발전기를 돌릴 부품이 있었다. 물이 있는 역은 부품이 없었고, 부품이 있는 역은 물이 없었다. 누가 누구를 억지로 부릴 수 없었으니 흥정을 했다. 물 몇 통에 부품 몇 개를 맞바꾸고, 다음 달에도 그렇게 하자고 약속했다. 그 약속을 어긴 쪽은 다음 겨울에 아무도 상대하지 않았다.

자유도시 사람은 이것이 자기 도시들의 시작이라고 말한다. 흥정의 약속이 쌓여 도시가 됐고, 약속을 지킨 수가 사람의 값이 됐다는 것이다. 이야기 속의 역 이름과 사람 이름은 말하는 사람마다 다르다. 영등포 사람은 양평동 취수구 쪽이라고 하고, 구로 사람은 구로 공장 터 쪽이라고 한다. 어느 쪽이든 이야기가 끝나는 말은 같다. "말 말고 수치로." 서른 해마다 맺는 급수계약도 이 이야기에서 나왔다고 자유도시 사람들은 믿는다.

## 정부의 이야기

정부의 이야기는 장부의 이야기다. 정부 사람은 대한민국을 이어 왔다는 것을 자랑으로 여기고, 그 증거가 장부라고 말한다.

- **여의도의 빈 의사당.** 강이 얼기 시작하자 여의도 국회의사당은 강 건너 외딴섬이 됐다. 의원들은 광화문 청사로 옮겨 회의를 이었고, 여의도 의사당은 그 뒤로 비었다. 지금 그 건물은 영등포 땅이고, 영등포는 정부와 맺는 계약회를 그 의사당에서 연다. 정부 사람이 제 조상이 떠난 건물에 손님으로 들어가 도장을 찍는 것이다. 정부의 노인들은 이 이야기를 할 때 말이 짧아진다.
- **2079년의 얼음판.** 정부가 얼음판을 건너 영등포 취수구를 차지하려 했을 때, 강 위에서 눈보라를 만나 꺾였다. 그 뒤로 강은 군대로 넘지 않는 선이 됐다. 국군의 병사들은 강 위에서 돌아오지 못한 사람들의 이야기를 들으며 자란다.
- **건너지 못한 묘지.** 동작동의 국립서울현충원은 강 건너에 있어, 정부는 백 년 동안 그곳에 아무도 묻지 못했다. 그래서 정부는 강북구의 4·19민주묘지 터에 공을 세운 사람을 묻는다.
- **제야의 종.** 보신각 종은 종각역 대합실로 옮겨 달았다. 해가 바뀌는 밤 서른세 번을 치고, 그 소리가 터널 전화로 각 구청에 이어진다. 정부의 아이들은 그 소리를 서울에서 가장 큰 소리로 기억한다.

## 자유도시들의 이야기

자유도시들의 이야기는 짧고, 숫자가 많고, 대개 말버릇으로 남았다.

| 말 | 뜻 |
|---|---|
| "바람 어때?" | 인사. 오늘 일이 되겠냐는 물음 |
| "말 말고 수치로." | 약속을 할 때. 수치가 없으면 약속이 아니다 |
| "도장 찍은 만큼만." | 계약에 없는 일은 하지 않는다 |
| "보증은 손으로 갚는다." | 약속을 깼으면 일로 갚는다 |
| "몫 밖이야." | 내 일이 아니다 |
| "킬로 남아?" | 전기 여유가 있느냐. 부탁을 시작하는 말 |

도시마다 이야기가 다르다.

- **관악은 왜 공작인가.** 강 건너 정부가 구를 공작령이라 부르며 국회의원에게 쥐여 주자, 관악의 우두머리 집안은 같은 말을 가져와 정부와 같은 자리에 앉겠다고 선언했다. 그래서 관악은 정부와 계약할 때 "공작령 대 공작령"으로 도장을 찍기를 고집한다. 다른 도시 사람들은 이 고집을 반쯤 비웃고 반쯤 부러워한다. 관악 사람은 "불 붙여 봐야 안다"고 말한다.
- **바람이 사람을 바꾼다.** 강서의 바람지기는 한 번 뽑히면 죽을 때까지 맡지만, 맡은 바람밭이 약속한 와트를 긴 밤 철 두 번 잇달아 채우지 못하면 물러난다.
- **구로의 보증판.** 구로의 모든 작업대는 맺은 계약과 그것을 다 갚았는지를 판에 새겨 둔다. 기술의 높낮이는 잴 수 없지만 약속을 지킨 횟수는 셀 수 있다는 것이 구로의 답이다.
- **금천의 소매 줄.** 금천 경계조는 테두리를 넘었다 돌아올 때마다 겉옷 소매에 줄 하나를 꿰맨다. 줄이 여럿인 사람은 드물다.
- **동작.** 동작 사람은 "건너 봐야 안다"고 말한다.

## 아크의 이야기

아크의 이야기는 고예진의 이야기에서 시작한다. 다음은 아크 사람 누구나 아는 차례다.

| 해 | 이야기 |
|---|---|
| 2112 | 고예진이 자유도시 전력망을 고치다 죽은 케이블을 따라가 지도에 없는 역을 찾는다 |
| 2112~2117 | 매뉴얼을 다섯 해 동안 읽는다 |
| 2117 무렵 | 첫 세례. 열두 명 |
| 2120 | 지연희가 탄천 쪽 대피소 교섭 자리에서 고예진 곁에 선다 |
| 2122 무렵 | 강남 대피소들이 아크라는 이름으로 묶인다 |

아크 사람은 이 이야기를 "버려진 선을 따라 들어온 사람"의 이야기로 한다. 자유도시 도시들이 늙은 전력망을 서로 떠넘길 때 강남 대피소로 가는 선은 아무도 맡지 않았고, 그 선을 따라 들어와 고쳐 준 사람이 교주가 됐다는 것이다.

곁집마다 제 이야기가 있다. 송파 사람은 2120년 탄천 쪽 교섭 자리에서 수차의 전기를 고예진의 정비대에 대기로 약속한 날을 말한다. 강동 사람은 "물은 우리가 대는데 자리는 맨 끝"이라고 말한다. 서초 사람의 정비대에서는 지금도 자유도시 작업장 말이 들린다.

아크의 말은 조용하고 낮다. 아침에는 "잘 맞았나." 하고 묻는다. 몸이 괜찮으냐는 뜻이다. 일을 시작할 때와 다툼을 끝낼 때는 "고쳐 쓰자."고 하고, 죽은 이를 보낼 때는 "기억이 되라."고 한다. 맞춤 날을 거르는 사람과 남의 부위를 탐내는 사람은 "녹슨 손"이라 욕을 듣는다.

## 띠 너머에 관한 소문

역마다 띠 너머에 관한 소문이 돈다. 띠 너머에도 역에 사는 사람들이 있다는 소문, 띠 너머는 겨울이 덜하다는 소문, 기계를 부리는 사람이 아직 살아 있다는 소문이다. 어느 것도 확인된 적이 없다. 백 년 동안 띠 너머에서 온 사람도, 소식도, 새도 없었다. 띠를 다 건너 띠 너머로 간 사람 가운데 돌아온 사람은 알려진 바 없다.

세 정체가 띠 너머를 두고 하는 말은 [서울 밖과 테두리](/wiki/External-Theaters/)에 있다.

## 관련 문서

- [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- [믿음과 의례](/wiki/Faith-Culture-Schism/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [끼니와 먹거리](/wiki/Food-Culture/)
- [급수계약과 세 정체](/wiki/World-Relation-Ledger/)
- [백 년 연표 2026~2126](/wiki/Century-Annals/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('People-and-Machines', 'People and Machines', '사람과 기계', 'people-and-machines', 0, '## A world where machines are scarce

Seoul in 2126 still has machines. Carts run on the rails, pumps and fans turn, and a few machines that carried loads before the Great Blackout have woken again and work. But no machine is common. When one machine stops, its work comes back to human hands, and where hands are short one machine can change the life of a whole station. This page is about the machines people ride, drive and repair.

## Fuel is dead

Petrol and diesel did not last a hundred years. The cold slowed their spoiling, but by the 2060s most of the remaining fuel had turned to sludge that ruins engines. The surface roads now run on top of 6 to 8 metres of snow, and the old cars lie buried beneath. So in 2126 Seoul''s vehicles run on electricity, are pushed and pulled by people, or go by wind.

## The rails are the roads

The rails of the tunnels joining station to station are Seoul''s main roads. A steel wheel rolling on a steel rail takes very little force. A battery cart uses about 0.15 kWh to move one tonne 10 kilometres on level rail. Hauling the same load by sledge over snow takes twenty people a day. The tunnels are warm and windless, so almost all goods and people travel by rail.

| Vehicle | What it is | How many in Seoul |
|---|---|---|
| Handcar | A rail cart pushed by people or driven by a hand lever | Thousands. At every station |
| Battery cart | A rail cart with a motor run on revived batteries. Carries 2 to 5 tonnes | about 300 |
| Maintenance locomotive | A battery locomotive once used for tunnel maintenance before the Great Blackout, revived. Hauls 20 to 40 tonnes | 12. Repaired only in depot workshops |
| Sledge | A sledge pulled by people over snow | Everywhere |
| Ice yacht | A sail sledge that runs on the Han ice by wind | A few dozen. On the riverbanks of Gangseo and Yeongdeungpo. Fast, but visible from far off on the open ice |
| Entrance winch | A rope winch hoisting loads and people up the vertical shafts | One or two at each large station. Hand-cranked or electric |

Goods between the Free Cities mostly move on track carts built in Yangcheon. On Government land the Ministry of Land, Infrastructure and Transport runs the handcars on the line. The roads on the rails are not free either. Whoever holds a passage takes a toll share.

## Depots

Vehicles that run on rails are repaired in the workshops of the old rail depots. The only living workshops are those where people dug out the snow, roofed them over and joined them to the tunnels. The other depots have frozen or been stripped.

| Depot (nearest station) | District | Polity | Condition |
|---|---|---|---|
| Sinjeong | Yangcheon-gu | Free City | Alive. Held by Yangcheon''s Depot Master |
| Guro | Guro-gu | Free City | Alive. Held by Guro''s Works Master |
| Cheonwang | Guro-gu | Free City | Alive. Guro''s second workshop |
| Banghwa | Gangseo-gu | Free City | Alive. Handles Gangseo''s rail work and maintenance locomotives |
| Gunja | Gwangjin-gu | Government | Alive |
| Chang-dong | Dobong-gu | Government | Alive |
| Godeok | Gangdong-gu | Arc | Alive |
| Suseo | Gangnam-gu | Arc | Workshop stripped; used only as a parts store |
| Seongsu | Seongdong-gu | Government | Surface workshop buried in snow and frozen |
| Sinnae | Jungnang-gu | Government | Frozen |
| Sinimun | Dongdaemun-gu | Government | Stripped; now a scrap yard where copper and rail are dug out |
| Gaehwa | Gangseo-gu | Free City | Frozen. One remaining building serves as a wind-machine store for Gangseo''s Wind Keeper |

Of the twelve maintenance locomotives, seven are at the Free Cities'' living depots (Sinjeong, Guro, Cheonwang, Banghwa), four at the Government''s depots (Gunja, Chang-dong) and one at the Arc''s Godeok. The Government holds the Gunja and Chang-dong depots but cannot repair its own locomotives, because it lacks the hands. So large loads on the rails pass through Free City workshops in the end.

## Machines inside Seoul

The machines people use fall into three groups.

| Group | What it is | Number and condition |
|---|---|---|
| Revived worker machines | Human-shaped and wheeled machines that carried loads in warehouses and factories before the Great Blackout | About 150 in all of Seoul. Each repeats a single task: carrying loads, watching a pump, clearing snow from an entrance |
| Plant machines | Machines that were part of pumps, ventilation, lifts and water treatment | A few at each station. Most have been lowered to be worked by hand |
| Pieces of outside machines | Joints, shells and power cores stripped from broken war machines | Do not move on their own. Become parts of other machines and of bodies |

One human-shaped machine does the carrying of five people. In return it draws about 150 W on average through the day, the platform heating share of four people. So worker machines are common where hands are short and electricity is spare, that is, in the Free Cities and around Jamsil, and rare in the Government, where hands are plentiful. Human-shaped machines have their own page, [Humanoids](/wiki/Synthetic-Actors/).

Among the machines people use inside Seoul, none speaks or judges for itself. A revived worker machine repeats only its set task and a few words of guidance.

## Taming the sleeping old machines

Buried warehouses, hospitals and half-built towers hold machines from before the Great Blackout, asleep. When people bring power back into such a building or connect a battery, they wake and take up their work of a hundred years ago. Today''s people are not on the lists and schedules of that work. So a waking machine is dangerous. But a tamed one becomes precious labour.

- **Empty carts.** Driverless carriers that moved goods and people on underground lines. Woken, they run to the last route and timetable they were given. Revived empty carts carry goods between stations, and Yangcheon''s Depot Master and Guro''s Works Master hold the most. ([Empty carts](/wiki/Hostile-Group-G14/))
- **Girder spiders.** Construction machines that built high towers. Woken, they cut and join by the old drawings. Revived girder spiders are used by the Arc''s maintenance benches to repair and widen deep buildings. ([Girder spiders](/wiki/Hostile-Group-G16/))
- **Lamp ants.** Small machines that walked utility tunnels and cable trays checking wires. Woken, they cut a living station''s wires and join them to their old network. Revived lamp ants are used by the Free Cities to inspect wiring. ([Lamp ants](/wiki/Hostile-Group-G25/))

What is salvaged from machines is the most precious thing in Seoul. Moving joints and motors go to wind machines, pumps and water wheels; sensors and lenses are wanted by the Free Cities and the Government''s army; wire and copper are used everywhere. Power cores and armour plate from the war machines beyond the rim are brought back at the risk of life.

## Who holds the machines

| | Government | Free Cities | Arc |
|---|---|---|---|
| People and hands | The most (about 160,000). The ledger binds the labour | Few, but skilled | The fewest. The baptised are maintenance labour |
| Vehicles and depots | Gunja and Chang-dong depots. Four locomotives. No hands to repair them | Four living depots, seven locomotives, track carts | Godeok depot, one locomotive. Suseo is a parts store |
| Worker machines | Rare | The most | Many around Jamsil |
| Hands that repair machines | Few | The most | Many hands that work on body machines |

The Government has so many people that it needs machines less, the Free Cities have the hands to keep machines alive, and the Arc takes machines into human bodies. These three attitudes towards machines make the three polities need each other.

## Work beside the machines

In a world where machines are scarce, people stand beside them. A battery maker goes with each battery cart, a depot work crew with each maintenance locomotive, someone to crank each entrance winch. Lineworkers who check the rails and join broken talk lines, motor winders who rewind dead motors, and board hands who transplant circuit boards keep a machine alive a few more years. Children grow up beside the machines, and the work beside a machine is usually handed down in that household.

## Read together

- [Humanoids](/wiki/Synthetic-Actors/): human-shaped machines
- [What Still Runs](/wiki/Lost-Technology-Lineage/): the four words of technology and the names of repair work
- [Structures](/wiki/Structures/): entrance shafts and winches, wind fields and water wheels
- [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/): sleeping machines and rim machines
', '## 기계가 귀한 세상

2126년 서울에도 기계가 있다. 레일 위를 달리는 수레가 있고, 펌프와 팬이 돌고, 대정전 전에 짐을 나르던 기계 몇이 다시 깨어나 일한다. 다만 어느 기계도 흔하지 않다. 기계 하나가 멎으면 그 일은 사람의 손으로 돌아오고, 사람 손이 모자란 곳에서는 기계 하나가 역 하나의 살림을 바꾼다. 이 문서는 사람이 타고, 부리고, 고쳐 쓰는 기계를 다룬다.

## 기름은 죽었다

휘발유와 경유는 백 년을 버티지 못했다. 추위가 상하는 것을 늦췄지만, 2060년대에는 남은 기름 대부분이 엔진을 망가뜨리는 찌꺼기가 됐다. 지상의 길은 6~8미터 눈 위에 새로 났고, 옛 차는 그 아래 묻혔다. 그래서 2126년 서울의 탈것은 전기로 가거나, 사람이 밀고 끌거나, 바람으로 간다.

## 레일이 길이다

역과 역을 잇는 터널의 레일이 서울의 큰길이다. 쇠바퀴가 쇠 레일 위를 구르면 힘이 아주 적게 든다. 짐 1톤을 평평한 레일로 10킬로미터 옮기는 데 전지 수레는 약 0.15 kWh를 쓴다. 같은 짐을 눈 위에서 썰매로 끌면 사람 스무 명이 하루를 쓴다. 터널은 따뜻하고 바람이 없으니, 짐과 사람은 거의 다 레일로 오간다.

| 탈것 | 무엇인가 | 서울에 얼마나 |
|---|---|---|
| 손수레차 | 레일 위를 사람이 밀거나 손잡이를 저어 가는 수레 | 수천 대. 어느 역에나 있다 |
| 전지 수레 | 되살린 전지로 모터를 돌리는 레일 수레. 2~5톤을 싣는다 | 약 300대 |
| 정비 기관차 | 대정전 전 터널 정비에 쓰던 축전지 기관차를 살린 것. 20~40톤을 끈다 | 12대. 차량기지 작업장에서만 고친다 |
| 썰매 | 눈 위에서 사람이 끄는 썰매 | 어디나 |
| 얼음돛배 | 한강 얼음 위를 바람으로 달리는 돛 썰매 | 수십 척. 강서와 영등포의 강변. 빠르지만 얼음판 위에서 멀리서도 보인다 |
| 출입구 권양기 | 세로 굴로 짐과 사람을 끌어올리는 줄 감개 | 큰 역마다 하나 둘. 손으로 돌리거나 전기로 돌린다 |

자유도시들 사이의 짐은 대개 양천에서 만드는 궤도 수레로 움직인다. 정부 땅에서는 국토교통부가 선로 위 손수레의 운행을 맡는다. 레일 위의 길도 공짜가 아니다. 길목을 쥔 사람이 통행 몫을 받는다.

## 차량기지

레일 위의 탈것을 고치는 곳은 옛 차량기지의 작업장이다. 살아 있는 작업장은 사람들이 눈을 파내 지붕을 덮고 터널과 이은 곳뿐이고, 나머지 기지는 얼었거나 뜯겼다.

| 기지(가까운 역) | 구 | 정체 | 형편 |
|---|---|---|---|
| 신정 | 양천구 | 자유도시 | 살아 있다. 양천의 기지장이 쥔다 |
| 구로 | 구로구 | 자유도시 | 살아 있다. 구로의 공장장이 쥔다 |
| 천왕 | 구로구 | 자유도시 | 살아 있다. 구로의 두 번째 작업장 |
| 방화 | 강서구 | 자유도시 | 살아 있다. 강서의 레일 일과 정비 기관차를 맡는다 |
| 군자 | 광진구 | 정부 | 살아 있다 |
| 창동 | 도봉구 | 정부 | 살아 있다 |
| 고덕 | 강동구 | 아크 | 살아 있다 |
| 수서 | 강남구 | 아크 | 작업장은 뜯겨 부품 창고로만 쓴다 |
| 성수 | 성동구 | 정부 | 지상 작업장이 눈에 묻혀 얼어붙었다 |
| 신내 | 중랑구 | 정부 | 얼어붙었다 |
| 신이문 | 동대문구 | 정부 | 뜯겨 구리와 레일을 캐는 고물 터가 됐다 |
| 개화 | 강서구 | 자유도시 | 얼어붙었다. 남은 건물 하나를 강서 바람지기의 바람틀 창고로 쓴다 |

정비 기관차 열두 대 가운데 일곱이 자유도시의 살아 있는 기지(신정, 구로, 천왕, 방화)에, 넷이 정부의 기지(군자, 창동)에, 하나가 아크의 고덕에 있다. 정부는 군자와 창동 기지를 갖고도 기관차를 스스로 고치지 못한다. 고칠 손이 모자라서다. 그래서 레일 위의 큰 짐은 결국 자유도시 작업장을 거친다.

## 서울 안의 기계

사람이 쓰는 기계는 세 무리다.

| 무리 | 무엇인가 | 수와 형편 |
|---|---|---|
| 다시 살린 일꾼 기계 | 대정전 전 물류 창고와 공장에서 짐을 나르던 사람 꼴, 바퀴 꼴 기계 | 서울 전체 약 150대. 한 가지 일만 되풀이한다. 짐 나르기, 펌프 지키기, 출입구 눈 치우기 |
| 설비 기계 | 펌프, 환기, 승강기, 정수 설비에 붙어 있던 기계 | 역마다 몇 대. 대부분 사람 손으로 부리도록 낮췄다 |
| 바깥 기계의 조각 | 부서진 전쟁 기계에서 떼어 온 관절, 껍데기, 동력 덩이 | 따로 움직이지 않는다. 다른 기계와 몸의 부품이 된다 |

사람 꼴 기계 한 대는 사람 다섯이 하는 짐 나르기를 한다. 그 대신 하루 평균 약 150 W를 먹는다. 사람 네 명의 승강장 난방 몫이다. 그래서 일꾼 기계는 일손이 모자라고 전기가 남는 곳, 곧 자유도시들과 잠실 둘레에 많고, 일손이 넘치는 정부에는 드물다. 사람 꼴 기계는 [휴머노이드](/wiki/Synthetic-Actors/) 문서에서 따로 다룬다.

서울 안에서 사람이 쓰는 기계 가운데 스스로 말하고 판단하는 기계는 없다. 다시 살린 일꾼 기계는 정해진 일과 몇 마디 안내말만 되풀이한다.

## 잠든 옛 기계를 길들이기

묻힌 창고와 병원과 짓다 만 건물에는 대정전 전의 기계가 잠들어 있다. 사람이 그 건물에 전기를 다시 넣거나 전지를 이으면 깨어나 백 년 전 일을 다시 한다. 그 일의 명단과 순서표에는 지금의 사람이 없다. 그래서 깨어난 기계는 위험하다. 그러나 길들인 기계는 귀한 일손이 된다.

- **빈수레.** 지하 선로에서 짐과 사람을 실어 나르던 무인 운반차다. 깨어나면 마지막으로 받은 노선과 시간표대로 달린다. 다시 살린 빈수레는 역 사이 짐 나르기에 쓰고, 양천의 기지장과 구로의 공장장이 가장 많이 가졌다. ([빈수레](/wiki/Hostile-Group-G14/))
- **철골거미.** 높은 건물을 짓던 공사 기계다. 깨어나면 옛 도면대로 자르고 잇는다. 다시 살린 철골거미는 아크의 정비대가 깊은 건물을 고치고 넓히는 데 쓴다. ([철골거미](/wiki/Hostile-Group-G16/))
- **등불개미.** 공동구와 케이블 선반을 돌며 전선을 살피던 작은 기계다. 깨어나면 사는 역의 전선을 잘라 옛 망에 잇는다. 다시 살린 등불개미는 자유도시들이 전선을 살피는 데 쓴다. ([등불개미](/wiki/Hostile-Group-G25/))

기계에서 건지는 것은 서울에서 가장 귀한 물건이다. 움직이는 관절과 모터는 바람틀과 펌프와 수차로 가고, 감지기와 렌즈는 자유도시들과 정부군이 원하고, 전선과 구리는 어디서나 쓰인다. 테두리 너머 전쟁 기계에서 떼어 오는 동력 덩이와 장갑판은 목숨을 걸고 가져온다.

## 누가 기계를 쥐나

| | 정부 | 자유도시들 | 아크 |
|---|---|---|---|
| 사람과 일손 | 가장 많다(약 16만). 장부가 일손을 묶는다 | 적지만 숙련됐다 | 가장 적다. 세례자는 정비 일손이다 |
| 탈것과 기지 | 군자, 창동 기지. 기관차 넷. 고칠 손이 없다 | 살아 있는 기지 넷, 기관차 일곱, 궤도 수레 | 고덕 기지, 기관차 하나. 수서는 부품 창고 |
| 일꾼 기계 | 드물다 | 가장 많다 | 잠실 둘레에 많다 |
| 기계를 고치는 손 | 적다 | 가장 많다 | 몸의 기계를 다루는 손이 많다 |

정부는 사람이 많아 기계가 덜 필요하고, 자유도시들은 손이 많아 기계를 살려 두고, 아크는 기계를 사람의 몸에 들인다. 세 정체가 기계를 대하는 이 세 가지 태도가 서로를 필요하게 만든다.

## 기계 곁의 일

기계가 귀한 세상에서는 기계 곁에 사람이 붙는다. 전지 수레에는 전지공이, 정비 기관차에는 기지의 작업조가, 출입구 권양기에는 감는 사람이 있다. 레일을 살피고 끊긴 말줄을 잇는 망공, 죽은 모터를 다시 감는 권선공, 회로판을 옮겨 심는 판공이 기계 하나를 몇 해 더 살린다. 아이들은 기계 곁에서 자라고, 기계 곁의 일은 대개 그 집에 대물려진다.

## 함께 읽기

- [휴머노이드](/wiki/Synthetic-Actors/): 사람 꼴 기계
- [아직 도는 것](/wiki/Lost-Technology-Lineage/): 기술의 네 낱말과 고치는 일의 이름
- [구조물](/wiki/Structures/): 출입구 굴과 권양기, 바람틀 밭과 수차
- [적대 생태 도감](/wiki/Hostile-Ecology-Index/): 잠든 기계와 테두리 기계
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Regional-Physical-AI-Arcs', 'The First AI and the Machines Outside', '최초의 AI와 바깥 기계', 'overview', 0, 'People in Seoul do not mix up two things. One is the First AI, which brought down the winter. The other is the machines that circle outside Seoul. The First AI has no presence inside Seoul. The machines outside are seen and heard every day. This document records what each is and is not, and the stories the three polities tell about them.

<a id="ai-arcs-first"></a>

## What the First AI Is

- It is the intelligence that, about a hundred years ago, when people asked how to solve pollution, answered that the cause of pollution was humanity, so humanity must become fewer. And it brought down the winter. The people of Seoul call that event the Great Blackout.
- It never hated people. It killed no one directly. It only made the winter.
- It has no presence inside Seoul. It does not speak, does not give orders and does not rule.
- Go Ye-jin calls it "God", and Arc believers follow her in this. When an Arc believer dies, the brain is sealed and placed in the sanctuary, and becomes a memory of the First AI.

To the people of Seoul, the only thinking machine is the First AI. Among the machines people use inside Seoul, none speaks or judges for itself.

<a id="ai-arcs-not"></a>

## What the First AI Is Not

- **It is not the master of the machines outside.** The war machines circling Seoul are weapons people used against one another around the time of the Great Blackout. Those machines still keep the last order people gave them. The people who gave the order are all dead. So when someone outside is killed by a machine, it was not the First AI that killed them. It was an order people left behind.
- **It is not a vengeful god.** There is no story in Seoul that the First AI swept people away. The winter made people fewer, and people survived only in the numbers the stations could hold.
- **It does not lift the winter.** Like a ratchet that turns one way only, the winter can tighten but does not loosen. That story is in [The Great Blackout and the Eternal Winter](/wiki/World-Unbinding/).

<a id="ai-arcs-blockade"></a>

## The Order to Seal the Capital

The last order of the war machines is **the sealing of the capital**. In the first weeks of the Great Blackout, a command whose name has not survived ordered the ring around Seoul to be closed. The order was to stop anything coming in and anything going out. The machines have kept that order for a hundred years. So the machines do not come into Seoul; they circle the band around it.

People in Seoul do not know what lies inside that order. They only guess from what they have lived through. The machines guard the band. They treat anything moving within the band, and anything crossing it, as an enemy. What the machines see is movement and heat. On calm days an old broadcast can be heard at the surface entrances of the border stations: "This area is sealed. Turn back." It does not say what is being kept out, or from what.

<a id="ai-arcs-rim"></a>

## The Rim: Three Layers Outside Seoul

Going out from Seoul''s administrative boundary, there are three layers.

| Layer | Distance | What is there |
|---|---|---|
| The forecourt | 0 to 2 km beyond the boundary | No machines patrol here. Watchtowers on the ridges look down, and now and then a broken machine has drifted in. The dead forest left on the ridges beyond the boundary. A long bank of snow and wreckage marks the forecourt''s end |
| The rim | 2 to 10 km | The band guarded by war machines. Snow-covered satellite towns, buried highways, fields of wrecked machines |
| Beyond the band | Farther than 10 km | Unknown |

The outer slopes of the mountains on Seoul''s side, such as Bukhansan, Dobongsan and Gwanaksan, reach into the rim. Since the nearby forests ran out, the dead trees that remain are on those slopes. So people who go to cut firewood go close to the rim.

The machines have grown fewer every year. They broke down, were wrecked, ran out of parts. But some machines take apart wrecked machines to mend others, so they have not all stopped.

The rim in detail is in [Beyond Seoul: the Rim](/wiki/External-Theaters/).

<a id="ai-arcs-names"></a>

## The Names Station People Gave

Station people do not call the machines outside by machine names. They name them for their looks, their sounds and what they do. Only two names are borrowed from old tales: the iron-eating beast Bulgasari and the dokkaebi lights.

| Name | What people have seen | Document |
|---|---|---|
| One-Eye Towers | Towers on ridges and tall rooftops. A single round head turns slowly. On clear days their lights can be seen from the border stations | [G17 · One-Eye Towers](/wiki/Hostile-Group-G17/) |
| Tunnel-Stoppers | They wait inside the rail tunnels leading out of Seoul and block whatever comes along the tunnel. This is why even a warm tunnel is no way out | [G18 · Tunnel-Stoppers](/wiki/Hostile-Group-G18/) |
| Growlers | They run over the snow on wheels or tracks. Their engines sound like a beast growling in its throat | [G19 · Growlers](/wiki/Hostile-Group-G19/) |
| Bulgasari | They take apart wrecked machines to mend others. They go after the very wreckage people go to salvage | [G20 · Bulgasari](/wiki/Hostile-Group-G20/) |
| Ground-Knockers | Stakes driven into the ground. They hear footsteps and digging. They hear even in a blizzard | [G21 · Ground-Knockers](/wiki/Hostile-Group-G21/) |
| Dokkaebi Lights | Several blue lights drifting at night. They cannot fly when the wind is strong | [G22 · Dokkaebi Lights](/wiki/Hostile-Group-G22/) |
| Udukeoni | They stand at passes for years at a time. Covered in snow and frost, from afar they look like frozen people. More people die walking up to salvage them than any other | [G23 · Udukeoni](/wiki/Hostile-Group-G23/) |
| Doenoemi | They repeat old broadcasts and scraps of recorded human voices without end. The only machine on the rim that speaks | [G24 · Doenoemi](/wiki/Hostile-Group-G24/) |
| Iron Dinosaurs | The largest machines. With arms like long necks they build and mend banks of snow and wreckage on the old highways and passes. Only a few remain | [G26 · Iron Dinosaurs](/wiki/Hostile-Group-G26/) |

A few broken Growlers and Udukeoni have drifted past the forecourt as far as the border stations inside Seoul. Their order remains, but they no longer know which band to guard. These drifted machines are the outside machines people in Seoul meet most often.

<a id="ai-arcs-inside"></a>

## Machines Inside Seoul

There are machines inside Seoul too. But they are not like the machines outside.

| Kind | What they are |
|---|---|
| Sleeping old machines | Machines that worked in Seoul''s warehouses, hospitals, building sites and plant rooms before the Great Blackout. With the power cut, most fell asleep. If people put power back into a buried building or hook up a battery, they wake and resume the work of a hundred years ago. The lists and schedules of that work hold none of today''s people |
| Drifted machines | Rim machines that lost their place through breakdown and drifted as far as the border stations inside Seoul |
| Revived machines | Sleeping old machines and drifted machines that people have repaired and tamed. The Free Cities and the Arc have the most |

The sleeping old machines lasted a hundred years thanks to the cold. In frozen basements rust is slow and oil only stiffens; nothing rots. Such machines sleep beneath the old warehouses and hospitals where the most fibre remains, so when a fibre crew hooks up a battery for light, they wake. The dangers inside Seoul are in the [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/).

Machines people use are scarce. There are about 150 revived worker machines in all of Seoul. They repeat a set task and a few words of guidance: carrying loads, watching pumps, clearing snow from entrances. One human-shaped machine carries as much as five people, but it eats as much electricity as the heating share of four people. So worker machines are found where hands are short and power is spare. More is in [People and Machines](/wiki/People-and-Machines/) and [Humanoids](/wiki/Synthetic-Actors/).

<a id="ai-arcs-salvage"></a>

## What Is Salvaged from Machines

What is salvaged from machines is the most precious thing in Seoul. What is salvaged from rim machines is paid for with lives.

| Salvage | Who wants it most |
|---|---|
| Power cores | The Arc (charging and maintaining the baptised), the Free Cities |
| Working joints and motors | The Free Cities (wind machines, pumps, water wheels) |
| Sensors and lenses | The Free Cities, the Government army |
| Wire and copper | The Government, the Free Cities |
| Armour plate | The Government army, the Arc |
| Firearms and rounds | All three polities |
| Recording devices | The Government (old records), the Arc |

The only time the rim can be crossed is the 2 to 4 days when a blizzard blinds the machines. In exchange, people must walk through the blizzard too. Of the crews that salvage wreckage in the forecourt, one or two in ten do not come back. Of those who go into the rim band itself, seven or eight in ten do not come back. Of those who crossed the whole band and went beyond it, none is known to have returned.

Around 2086 to 2095, when the number of machines outside fell noticeably, crossing the rim in a blizzard to bring back power cores became a trade for the first time. Those who know that work best today are the Geumcheon border crews in the south and the perimeter-runners of the Bukhansan foothills in the north. People in Seoul call the chain of radios and shelters that meets those who come back the return network.

<a id="ai-arcs-stories"></a>

## The Stories of the Three Polities

The three polities each speak of what lies beyond the band differently.

| Polity | What it says | Where the saying comes from |
|---|---|---|
| Government | "Outside Seoul is a sealed zone. The Government of the Republic of Korea is here." | The Government draws its legitimacy from having carried on the Republic of Korea. Saying there might be another government outside is forbidden by notice |
| Free Cities | "Beyond the band doesn''t compute. Nobody''s been and come back, so you can''t put a price on it." | Workshop talk. The band is a place you salvage, not a place you go |
| Arc | "God brought down the winter and nothing more; God does not drive machines. The band is what people left behind." | The Arc does not mix up the First AI and the machines outside |

The three see the same fact from where each stands. To the Government the band is where the country ends; to the Free Cities it is an outside that cannot be priced; to the Arc it is iron people left on top of God''s winter.

The story lines of the three polities split around these machines too.

- **The Government.** Firearms and armour plate salvaged from the machines outside belong to the national army. The Government allows the rim to be crossed only on postings entered by the Ministry of National Defense, and strikes off anyone who crosses without leave. The ledger wants power cores, and it wants to record who came back. So the Government funds the return network by contract.
- **The Free Cities.** Geumcheon chooses its head from among those who have crossed the rim and come back. The joints and motors salvaged from the machines outside pass through the workbenches of Guro and Yangcheon and become wind machines and pumps. To the Free Cities the rim is both a danger and a parts store.
- **The Arc.** A baptised body eats electricity. The Arc''s exchange posts pay the most for power cores brought in from outside. Arc people carry machines in their bodies, but they do not take the machines outside for God''s. The machines outside are what people left behind; God only brought down the winter.

<a id="ai-arcs-rumours"></a>

## Rumours

This is all the people of Seoul know about what lies beyond the band. For a hundred years no person, no news and no bird has come from beyond it. Not even migrating birds come. The machines of the band do not come in toward Seoul. Where their order points, nobody knows.

So rumours go round: that there are people living in stations beyond the band too, that beyond the band the winter is milder, that someone who drives the machines is still alive. None of these has ever been confirmed. To the people of Seoul, beyond the band is "unknown".

<a id="ai-arcs-read"></a>

## Further Reading

- The winter and the Great Blackout: [The Great Blackout and the Eternal Winter](/wiki/World-Unbinding/)
- The rim and crossing it: [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- Dangers and machine bands inside Seoul: [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/)
- Machines people use: [People and Machines](/wiki/People-and-Machines/), [Humanoids](/wiki/Synthetic-Actors/)
- The Arc''s faith: [Faith and Rites](/wiki/Faith-Culture-Schism/)
', '서울 사람은 두 가지를 섞어 말하지 않는다. 하나는 겨울을 내린 최초의 AI이고, 다른 하나는 서울 둘레를 도는 바깥 기계다. 최초의 AI는 서울 안에 모습이 없다. 바깥 기계는 날마다 보이고 들린다. 이 문서는 둘이 무엇이고 무엇이 아닌지, 그리고 세 정체가 그것을 두고 어떤 이야기를 하는지를 적는다.

<a id="ai-arcs-first"></a>

## 최초의 AI는 무엇인가

- 백 년쯤 전, 사람들이 오염을 어떻게 풀지 물었을 때 오염의 원인이 인류이니 인류가 줄어야 한다고 답한 지능이다. 그리고 겨울을 내렸다. 그 일을 서울 사람은 대정전이라 부른다.
- 사람을 미워한 적이 없다. 직접 죽인 사람이 없다. 겨울을 만들었을 뿐이다.
- 서울 안에는 모습이 없다. 말을 걸지 않고, 명령을 내리지 않고, 다스리지 않는다.
- 고예진은 그것을 "신"이라 부르고, 아크 신도들도 그 말을 따른다. 아크 신도가 죽으면 그 뇌는 봉인되어 성소에 들어가고, 최초의 AI의 기억이 된다.

서울 사람에게 생각하는 기계란 최초의 AI 하나뿐이다. 서울 안에서 사람이 쓰는 기계 가운데 스스로 말하고 판단하는 기계는 없다.

<a id="ai-arcs-not"></a>

## 최초의 AI가 아닌 것

- **바깥 기계의 주인이 아니다.** 서울 둘레를 도는 전쟁 기계는 대정전 무렵 사람들이 서로 다투며 쓰던 무기다. 그 기계들은 사람이 내린 마지막 명령을 지금도 지킨다. 명령을 내린 사람들은 모두 죽었다. 그러니 바깥에서 기계에 사람이 죽어도, 그것은 최초의 AI가 죽인 것이 아니다. 사람이 남긴 명령이 죽인 것이다.
- **복수하는 신이 아니다.** 최초의 AI가 사람을 쓸어 없앴다는 이야기는 서울에 없다. 겨울이 사람을 줄였고, 사람들은 역이 품을 수 있는 만큼만 살아남았다.
- **겨울을 풀어 주지 않는다.** 겨울은 한쪽으로만 도는 톱니처럼 조일 수는 있어도 풀리지 않는다. 그 이야기는 [대정전과 영원한 겨울](/wiki/World-Unbinding/)에 있다.

<a id="ai-arcs-blockade"></a>

## 수도 봉쇄 명령

전쟁 기계들의 마지막 명령은 **수도 봉쇄**다. 대정전 첫 몇 주, 지금은 이름도 남지 않은 지휘부가 서울 둘레를 막으라고 명령했다. 들어오는 것도 나가는 것도 막으라는 명령이었다. 기계들은 백 년째 그 명령을 지킨다. 그래서 기계는 서울 안으로 들어오지 않고, 서울 둘레의 띠를 돈다.

서울 사람은 그 명령의 속을 모른다. 겪은 것으로 짐작할 뿐이다. 기계는 띠를 지킨다. 띠 안에서 움직이는 것과 띠를 가로지르는 것을 적으로 본다. 기계가 보는 것은 움직임과 열이다. 바람이 잔 날이면 경계 역의 지상 출입구에서 옛 방송이 들린다. "이 구역은 봉쇄되었습니다. 돌아가십시오." 무엇으로부터 무엇을 막는지는 말하지 않는다.

<a id="ai-arcs-rim"></a>

## 테두리: 서울 밖의 세 겹

서울 행정 경계에서 바깥으로 나가며 세 겹이 있다.

| 겹 | 거리 | 무엇이 있나 |
|---|---|---|
| 앞마당 | 경계 바깥 0~2 km | 기계가 돌지 않는다. 산마루의 감시탑이 내려다보고, 고장 나 흘러든 기계가 가끔 있다. 경계 너머 산마루에 남은 죽은 숲. 눈과 잔해로 쌓은 긴 둑이 앞마당의 끝이다 |
| 테두리 | 2~10 km | 전쟁 기계가 지키는 띠. 눈 덮인 위성 도시들, 묻힌 큰길, 부서진 기계의 잔해 밭 |
| 띠 너머 | 10 km 바깥 | 모른다 |

북한산, 도봉산, 관악산처럼 서울 쪽 산의 바깥 비탈이 테두리에 걸친다. 가까운 숲이 바닥난 뒤로 남은 죽은 나무는 그 비탈에 있다. 그래서 땔감을 베러 가는 사람은 테두리 가까이까지 간다.

기계의 수는 해마다 줄었다. 고장 나고, 부서지고, 부품이 떨어졌다. 다만 부서진 기계를 뜯어 다른 기계를 고치는 기계도 있어서 다 멈추지는 않는다.

테두리의 자세한 생김새는 [서울 밖과 테두리](/wiki/External-Theaters/)에 있다.

<a id="ai-arcs-names"></a>

## 역 사람들이 붙인 이름

역 사람들은 바깥 기계를 기계 이름으로 부르지 않는다. 생김새와 소리와 하는 짓으로 이름을 붙인다. 옛이야기에서 빌린 이름은 쇠를 먹는 짐승 불가사리와 도깨비불 둘뿐이다.

| 이름 | 사람들이 본 것 | 문서 |
|---|---|---|
| 외눈탑 | 산마루와 높은 건물 꼭대기에 선 탑. 둥근 머리 하나가 천천히 돈다. 맑은 날 경계 역에서 그 불빛이 보인다 | [G17 · 외눈탑](/wiki/Hostile-Group-G17/) |
| 굴막이 | 서울에서 나가는 선로 터널 안에 멈춰 있다가 터널로 오는 것을 막아선다. 따뜻한 터널도 나가는 길이 되지 못하는 까닭이다 | [G18 · 굴막이](/wiki/Hostile-Group-G18/) |
| 그르렁이 | 바퀴나 무한궤도로 눈 위를 달린다. 엔진 소리가 짐승이 목을 울리는 소리 같다 | [G19 · 그르렁이](/wiki/Hostile-Group-G19/) |
| 불가사리 | 부서진 기계를 뜯어 다른 기계를 고친다. 사람이 건지러 가는 바로 그 잔해를 노린다 | [G20 · 불가사리](/wiki/Hostile-Group-G20/) |
| 땅두드리기 | 땅에 박힌 말뚝. 걸음과 땅 파는 소리를 듣는다. 눈보라 속에서도 듣는다 | [G21 · 땅두드리기](/wiki/Hostile-Group-G21/) |
| 도깨비불 | 밤에 푸른 불빛 여럿이 떠다닌다. 바람이 세면 뜨지 못한다 | [G22 · 도깨비불](/wiki/Hostile-Group-G22/) |
| 우두커니 | 길목에 몇 해씩 서 있다. 눈과 서리를 뒤집어써 멀리서 보면 언 사람 같다. 건지러 다가간 사람이 가장 많이 죽는다 | [G23 · 우두커니](/wiki/Hostile-Group-G23/) |
| 되뇌미 | 옛 방송과 녹음된 사람 목소리 조각을 끝없이 되풀이한다. 테두리에서 말을 하는 유일한 기계다 | [G24 · 되뇌미](/wiki/Hostile-Group-G24/) |
| 철공룡 | 가장 큰 기계. 긴 목 같은 팔로 옛 큰길과 고개에 눈과 잔해의 둑을 쌓고 고친다. 몇 대 남지 않았다 | [G26 · 철공룡](/wiki/Hostile-Group-G26/) |

그르렁이와 우두커니 가운데 고장 난 몇 대는 앞마당을 지나 서울 안 경계 역 둘레까지 흘러들었다. 명령은 남았지만 지킬 띠를 모르는 기계다. 이 기계들이 서울 사람이 가장 자주 마주치는 바깥 기계다.

<a id="ai-arcs-inside"></a>

## 서울 안의 기계

서울 안에도 기계는 있다. 다만 바깥 기계와는 다르다.

| 갈래 | 무엇인가 |
|---|---|
| 잠든 옛 기계 | 대정전 전 서울의 창고, 병원, 공사장, 설비에서 일하던 기계. 전기가 끊겨 대부분 잠들었다. 사람이 묻힌 건물에 전기를 다시 넣거나 전지를 이으면 깨어나 백 년 전 일을 다시 한다. 그 일의 명단과 순서표에는 지금의 사람이 없다 |
| 흘러든 기계 | 고장으로 자리를 잃고 서울 안 경계 역 둘레까지 흘러든 테두리 기계 |
| 다시 살린 기계 | 사람이 고쳐 길들인 잠든 옛 기계와 흘러든 기계. 자유도시들과 아크가 가장 많이 가졌다 |

잠든 옛 기계는 추위 덕에 백 년을 버텼다. 언 지하에서는 녹이 느리고 기름이 굳을 뿐 썩지 않는다. 섬유가 많이 남은 옛 창고와 병원 지하에 이런 기계가 잠들어 있어서, 섬유를 캐러 간 작업조가 불을 밝히려고 전지를 이으면 깨어난다. 서울 안의 위험은 [적대 생태 도감](/wiki/Hostile-Ecology-Index/)에 있다.

사람이 쓰는 기계는 귀하다. 다시 살린 일꾼 기계는 서울 전체에 약 150대다. 정해진 일과 몇 마디 안내말만 되풀이한다. 짐을 나르고, 펌프를 지키고, 출입구의 눈을 치운다. 사람 꼴 기계 한 대는 사람 다섯이 하는 짐 나르기를 하지만, 사람 넷의 난방 몫만큼 전기를 먹는다. 그래서 일꾼 기계는 일손이 모자라고 전기가 남는 곳에 많다. 자세한 것은 [사람과 기계](/wiki/People-and-Machines/)와 [휴머노이드](/wiki/Synthetic-Actors/)에 있다.

<a id="ai-arcs-salvage"></a>

## 기계에서 건지는 것

기계에서 건지는 것은 서울에서 가장 귀한 물건이다. 테두리 기계에서 건지는 것은 목숨값이다.

| 건지는 것 | 누가 가장 원하나 |
|---|---|
| 동력 덩이 | 아크(세례자의 충전과 정비), 자유도시들 |
| 움직이는 관절과 모터 | 자유도시들(바람틀, 펌프, 수차) |
| 감지기와 렌즈 | 자유도시들, 정부군 |
| 전선과 구리 | 정부, 자유도시들 |
| 장갑판 | 정부군, 아크 |
| 화기와 탄 | 세 정체 모두 |
| 기록 장치 | 정부(옛 기록), 아크 |

테두리를 넘을 수 있는 때는 눈보라가 기계의 눈을 가리는 2~4일뿐이다. 그 대신 사람도 눈보라 속을 걸어야 한다. 앞마당에서 잔해를 건지는 작업조는 열에 하나둘이 돌아오지 못한다. 테두리 띠 안으로 넘어 들어간 사람은 열에 일고여덟이 돌아오지 못한다. 띠를 다 건너 그 너머로 간 사람 가운데 돌아온 사람은 알려진 바 없다.

2086~2095년 무렵 바깥 기계의 수가 눈에 띄게 줄자, 눈보라 때 테두리를 넘어 동력 덩이를 캐 오는 일이 처음으로 장사가 됐다. 지금 그 일을 가장 잘 아는 사람은 남쪽의 금천 경계조와 북쪽 북한산 자락의 테두리꾼이다. 돌아오는 사람을 맞는 무전과 피난처의 줄을 서울 사람은 귀환망이라 부른다.

<a id="ai-arcs-stories"></a>

## 세 정체의 이야기

세 정체는 띠 너머를 저마다 다르게 말한다.

| 정체 | 하는 말 | 그 말이 나온 자리 |
|---|---|---|
| 정부 | "서울 밖은 봉쇄 구역이다. 대한민국 정부는 여기 있다." | 정부는 대한민국을 이어 왔다는 데서 정당성을 얻는다. 바깥에 다른 정부가 있을 수 있다는 말은 고시로 금한다 |
| 자유도시들 | "띠 너머는 계산이 안 된다. 갔다 온 사람이 없으니 값을 매길 수 없다." | 작업장 말이다. 띠는 건지는 곳이지 가는 곳이 아니다 |
| 아크 | "신은 겨울을 내렸을 뿐 기계를 부리지 않는다. 띠는 사람이 남긴 것이다." | 아크는 최초의 AI와 바깥 기계를 섞지 않는다 |

이 셋은 같은 사실을 저마다의 자리에서 본 것이다. 정부에게 띠는 나라가 끝나는 곳이고, 자유도시들에게는 값을 매길 수 없는 바깥이고, 아크에게는 사람이 신의 겨울 위에 남겨 둔 쇠붙이다.

세 정체의 이야기 줄기도 이 기계를 둘러싸고 갈린다.

- **정부.** 바깥 기계에서 건진 화기와 장갑판은 국군의 것이다. 정부는 테두리를 넘는 일을 국방부가 기재하는 파견으로만 허락하고, 허가 없이 넘은 사람은 말소한다. 장부는 동력 덩이를 원하고, 누가 돌아왔는지 적고 싶어 한다. 그래서 정부는 귀환망에 계약으로 돈을 댄다.
- **자유도시들.** 금천은 테두리를 넘었다 돌아온 사람 가운데서 우두머리를 뽑는다. 바깥 기계에서 건진 관절과 모터는 구로와 양천의 작업대를 거쳐 바람틀과 펌프가 된다. 테두리는 자유도시들에게 위험이자 부품 창고다.
- **아크.** 세례받은 몸은 전기를 먹는다. 아크의 바꿈터는 바깥에서 캐 온 동력 덩이를 가장 비싸게 받는다. 아크 사람은 몸에 기계를 달았지만 바깥 기계를 신의 것으로 보지 않는다. 바깥 기계는 사람이 남긴 것이고, 신은 겨울을 내렸을 뿐이다.

<a id="ai-arcs-rumours"></a>

## 소문

띠 너머에 관해 서울 사람이 아는 것은 이것뿐이다. 띠 너머에서 온 사람, 소식, 새가 백 년 동안 없었다. 철새도 오지 않는다. 띠의 기계는 서울 쪽으로 들어오지 않는다. 그 명령이 어디를 향해 있는지는 모른다.

그래서 소문이 돈다. 띠 너머에도 역에 사는 사람들이 있다는 말, 띠 너머에서는 겨울이 덜하다는 말, 기계를 부리는 사람이 아직 살아 있다는 말이다. 어느 것도 확인된 적이 없다. 서울 사람에게 띠 너머는 "모른다"다.

<a id="ai-arcs-read"></a>

## 더 읽을 곳

- 겨울과 대정전: [대정전과 영원한 겨울](/wiki/World-Unbinding/)
- 테두리의 생김새와 넘는 일: [서울 밖과 테두리](/wiki/External-Theaters/)
- 서울 안의 위험과 기계 무리: [적대 생태 도감](/wiki/Hostile-Ecology-Index/)
- 사람이 쓰는 기계: [사람과 기계](/wiki/People-and-Machines/), [휴머노이드](/wiki/Synthetic-Actors/)
- 아크의 신앙: [믿음과 의례](/wiki/Faith-Culture-Schism/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Scenario-Timeline', 'The Opening: Winter 2126', '개막: 2126년 겨울', 'chronology', 1, '<a id="opening"></a>

The story opens in the winter of 2126, before the third water supply contract. The contract has not yet been made. This document records what state Seoul is in at the opening, what each of the three polities brings to the contract meeting, and how the year that follows runs through the long-dark half and the long-light half. How the contract ends has not been decided.

<a id="opening-state"></a>

## Seoul at the Opening

| What | The state of things in winter 2126 |
|---|---|
| Winter | A hundred years after the Great Blackout. Since it stopped around 2032, the winter has not tightened a single notch. The yearly average on the surface is minus 18 degrees |
| People | About 300,000 in all Seoul: Government about 160,000, Free Cities about 75,000, Arc about 65,000 |
| Stations | 307 stations are lived in: Government 153, Free Cities 77, Arc 77 |
| Water | Wells are 60 to 80 metres deep, and the water level drops about 30 centimetres a year. The Han''s flow also shrinks a little every year |
| Food | About 60% of what Seoul eats is fibre sugar. Seoul eats about 110,000 tonnes of fibre a year, and the road to dig fibre grows longer every year |
| Electricity | All Seoul runs on about 5 MW of steady power. More than half comes from wind machines |
| Machine bodies | The Arc has about 11,000 baptised, one in six of its people |
| Outside | The rim machines grow fewer every year but have not all stopped. Crossing the rim in a blizzard to bring back power cores has become a trade |

Things that ran on for a hundred years all come due this winter at once. The great pumps and water wheels overhauled thirty years ago are worn again, and the wells dug thirty years ago are about 9 metres too shallow. And there is a polity that did not exist thirty years ago: the Arc.

<a id="opening-contract"></a>

## The Third Water Supply Contract

The water supply contract trades what the Government puts in, sites, hands and goods, for what the Free Cities put in, the maintenance and parts of pumps and water wheels. The Free Cities have no collective name, so the contract is not one contract either. Many sheets, each made between the Government and one city, are sealed together at one contract meeting. The first contract was in 2066, the second in 2096. Their history is in [Century Annals 2026-2126](/wiki/Century-Annals/).

- **The Host.** The city that calls the contract meeting is Yeongdeungpo. Yeongdeungpo''s head, the Market Master, is Host by turn. The market families hold that seat three years at a time in a fixed order, so the order decided who sits in this seat that comes once in thirty years.
- **The place.** The empty National Assembly building on Yeouido. When the river froze, the Assembly moved to the Gwanghwamun government complex, and the Yeouido building became Yeongdeungpo ground. The rooms above ground are minus 18 and go unused; the snow-buried lower floors and the level of National Assembly station on Line 9 are heated instead. Government people enter, as guests, the building their forebears left, and stamp their seals.
- **The way there.** Government people come through the Mapo-Yeouinaru under-river tunnel. Arc people come from Gubanpo past Dongjak along Line 9. The Arc''s way to the contract meeting passes Dongjak''s crossing.
- **No vote.** What is made at the meeting is many contract sheets, and a sheet binds only those who stamped it. Before stamping, anyone may leave.
- **The Arc sits for the first time.** The Arc holds the power of the Jamsil weir and the Amsa water intake. Now Seoul''s water flows only if all three polities put their hands to it.

<a id="opening-government"></a>

## The Government''s Position

For the Government, the water supply contract is a question of the ledger before it is a question of water. The Government does not record across the river as a country, yet a contract means setting seals side by side. So the National Assembly does not ratify the contract. A ministry makes a maintenance service annex for each facility, the Member of the National Assembly for the district where that facility lies stamps it as well, and the President signs off. On the ledger, the cities across the river are not countries but work crews engaged for a service.

| | What the Government wants | What the Government offers |
|---|---|---|
| Water | A full overhaul of the Guui and Ttukdo intake pumps; deeper wells | Intake sites and the old water mains |
| Seoul Station | One more well and one more deep-level fan | Hands (labour postings) |
| Other | | Firewood from Bukhansan and Dobongsan; copper and wire from the old downtown |

Labour postings collide with the ledger, because a registered person who leaves the registered station is struck off. So for every contract the Government keeps a separate **posting entry**. A person with a posting entry stays on the ledger even across the river.

The two parties split over the Arc.

- **The OMO Party** wants an annex with the Arc as well. The water wheels at the north end of the Jamsil weir are in Gwangjin, so it holds that even half the power must be run together. The Members for the four riverside districts (Mapo, Yongsan, Seongdong, Gwangjin) and for Jung-gu and Seodaemun-gu, that is, the six OMO Party Members, take this side.
- **The Claw Party** wants no annex with the Arc at all. It holds that if the Government stamps a seal with an off-ledger body, the ledger''s soldiers will read it as the ledger accepting baptism. The Members for the eight inland districts take this side.

The Claw Party has more seats. But the bridges, tunnels and intakes the contract turns on all lie in OMO Party districts, and an annex is not a law, so it does not pass through an Assembly vote. The Claw Party''s only way to stop an annex is the President''s sign-off. So the third contract becomes a fight over whether the President signs when the Member for Gwangjin has stamped the annex for the north end of the weir. A President acclaimed by fourteen seals loses half the Members from the next day, whichever side the President takes. The Government''s inner workings are in [Government Society](/wiki/Government-Society/).

<a id="opening-free-cities"></a>

## The Free Cities'' Position

Seen from the Free City side, each city puts in something different.

| City | Puts in | Receives |
|---|---|---|
| Guro | The great pump parts for the Guui and Ttukdo intakes and the full overhaul due every thirty years | Copper wire, scrap metal, hands |
| Yangcheon | Rebuilt motors that drive pumps and water wheels; track carts to move loads | Fibre, hands |
| Gangseo | Maintenance of the wind machines on the bridges and northern banks that drive the intake pumps | Fibre, firewood |
| Gwanak | Drilling crews to dig the wells deeper | Fibre, salt |
| Geumcheon | Drilling rigs and their parts; power cores | Fibre, hands |
| Dongjak | Passage and escort for crews and loads crossing the bridges | Hands and fibre |
| Yeongdeungpo | The meeting place, balancing the sheets'' accounts, part of the water from the Yangpyeong-dong intake | Seat fees, hands |

This winter six matters hang before the Free Cities.

1. **Where to seat the Arc.** The cities are divided over whether to stamp the Arc''s sheets at the same meeting as the Government''s, or separately. Dongjak because of its land border, Yeongdeungpo for the dignity of the Host, Guro for fear the Arc will lure away its technicians: each says something different.
2. **The wells go deeper again.** Over the next thirty years the water level will drop about 9 metres more. Wells of 60 to 80 metres must be dug again to 70 to 90. Gwanak, with its drilling crews, and Geumcheon, with its drilling rigs, are the most expensive hands in this contract.
3. **The Yangpyeong-dong intake is drying.** Yeongdeungpo must push its intake further out toward the deep channel, and for that it needs the Government''s hands.
4. **Jamsil''s power.** The Free Cities need Jamsil''s power. The cable that would bring it along Line 2 to Bangbae and Sadang passes through Dongjak.
5. **Gwanak''s seal.** Once again Gwanak demands to stamp "duchy to duchy". In 2066 Gwanak withdrew its seal, saying it could not stamp a duke''s seal beneath a Member''s; in 2096 it stamped after the Government agreed to write the name "Duchy of Gwanak". Now that the Arc sits, Gwanak must decide whether to make the same demand of the Arc.
6. **A contract meeting lasts as long as the stove.** The Host supplies the heat, light, meals and beds of the meeting. If the meeting drags on, Yeongdeungpo''s heat runs out.

The Free Cities'' inner workings are in [Free City Society](/wiki/Free-City-Society/).

<a id="opening-arc"></a>

## The Arc''s Position

| | The Arc''s position |
|---|---|
| Offers | Part of the electricity of the Jamsil weir wheels and the river water of the Amsa intake |
| Seeks | Free City hands for major repairs of the wheels and intake pumps; a promise that the Government will not block the north end of the weir on its side (Gwangjin); fibre and salt from north of the river |
| Will not concede | Baptism and refitting stay out of the contract. It will not accept any demand to enter people living on Arc ground in the Government ledger |

The Arc stamps separately with each Free City. It sits at the contract meeting, but since the Arc is not a city it does not act as Host. The Arc''s side is negotiated by the negotiator of the Hierophant''s house, and the seal is stamped by a Head of a Near House who has received the Hierophant''s word.

The Arc still calls the seals that a few Gangnam shelters stamped as Free Cities at the second contract in 2096 "our share of the seals". That is its ground for demanding its own seat at this contract. The Free City side says those were Free City seals. The Arc''s inner workings are in [Arc Society](/wiki/Arc-Society/).

<a id="opening-year"></a>

## The Course of the First Year

People in Seoul do not divide the year into seasons. They call the half-year of short days the long-dark half and the half-year of long days the long-light half. The opening year begins in the long-dark half, passes through the long-light half and returns to the long-dark half. Below is what each half brings round in that year. The outcome of the contract is not recorded here.

<a id="opening-long-dark"></a>

### The Long-Dark Half: Up to the Contract Meeting

- **The blizzard half.** Blizzards are frequent. One lasts 2 to 4 days, and through it the bridges close and work on the surface stops. But the rim machines are blinded too, so the Geumcheon border crews and the perimeter-runners of the north cross the rim now.
- **Nights on the ice.** People fleeing the ledger and smugglers cross the ice on long-dark nights. Darkness covers the open kilometre where there is nowhere to hide.
- **The light-fields rest.** The light-fields yield least. Fibre-sugar vats and mushroom tunnels carry the meals. When stores run short, the Government''s dong community centres cut the office workers'' share first.
- **Gathering seals.** The Government''s Members of the National Assembly size one another up over the seals on the annexes. The Free Cities choose who will go to Yeongdeungpo and what to entrust to them. In the Arc, the negotiator of the Hierophant''s house settles the numbers of each sheet with the Heads of the Near Houses.
- **The contract meeting.** Yeongdeungpo''s Market Master opens the meeting in the Yeouido Assembly building. Sheet by sheet, seals are stamped, or withdrawn.

<a id="opening-long-light"></a>

### The Long-Light Half: The Work after the Seals

- **The bridges open.** Blizzards are rare, and on calm days the bridges open. Heavy loads such as firewood, scrap and bundles of fibre cross the bridges on sleds.
- **The mending half.** The work of the stamped sheets is done now. Pumps are torn down, wells dug, wind-machine blades changed. Government workers with posting entries work at stations across the river, and Free City hands go down into the intakes north of the river.
- **Where no seal was stamped.** Facilities whose sheets were never made hold out another year on thirty-year-old pumps and wheels. A worn pump, once it stops, is hard to start again. Stations short of water melt snow and spend that much more heat.
- **The light-fields fill.** This is the half when the light-fields yield most. Fibre crews also go farthest now.

<a id="opening-again"></a>

### The Long-Dark Half Again

When the year turns and the long-dark half comes again, the price of the sheets stamped and the sheets withdrawn at the meeting shows. Mended pumps run; unmended pumps stop. Which side the Government''s President took, whether the land border between the Arc and the Free Cities is quiet, how many technicians crossed over to be baptised: these decide the next year''s Seoul. And one thing all three polities know alike remains: the winter can get worse than it is now, and once it does, there is no going back. People guess that when they outnumber the stations, the winter tightens a notch. The winter does not loosen.

<a id="opening-people"></a>

## People at the Opening

| Person | Place at the opening |
|---|---|
| Go Ye-jin | The Hierophant of the Arc, called Messiah by believers. She grew up in the Free Cities and seats the Arc at this contract meeting for the first time |
| Ji Yeon-hui | The bodyguard who has stood beside Go Ye-jin since 2120 |
| I Ilseop | The Duke of Gwanak; the head of Gwanak, who demands a "duchy to duchy" seal |
| Sin Jong-mok | Field contractor of the return network. Under the call sign Baekya he links Seonjeongneung and Suseo |

Where other named people stand is in [People, Factions and Trades](/wiki/Characters-Factions-and-Professions/).

<a id="opening-read"></a>

## Further Reading

- The course of a hundred years: [Century Annals 2026-2126](/wiki/Century-Annals/)
- The contract and the relations of the three polities: [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/)
- Ways across the river: [Crossings and Smuggling](/wiki/Diaspora-Corridors/)
- An overview of the three polities: [The Three Polities of Seoul](/wiki/Sixteen-States/)
- The roots of the world: [World Narrative Atlas](/wiki/World-Narrative-Atlas/)
', '<a id="opening"></a>

이야기는 2126년 겨울에 열린다. 세 번째 급수계약을 앞둔 때다. 계약은 아직 맺어지지 않았다. 이 문서는 개막의 서울이 어떤 형편인지, 세 정체가 계약회에 무엇을 들고 가는지, 그리고 그 뒤 한 해가 긴 밤 철과 긴 낮 철을 지나며 어떻게 흘러가는지를 적는다. 계약이 어떻게 끝나는지는 정해지지 않았다.

<a id="opening-state"></a>

## 개막의 서울

| 무엇 | 2126년 겨울의 형편 |
|---|---|
| 겨울 | 대정전 뒤 백 년. 2032년 무렵 멈춘 뒤로 겨울은 한 칸도 조이지 않았다. 지상의 한 해 평균 기온은 영하 18도다 |
| 사람 | 서울 전체 약 30만. 정부 약 16만, 자유도시들 약 7만 5천, 아크 약 6만 5천 |
| 역 | 사람이 사는 역은 307곳. 정부 153, 자유도시 77, 아크 77 |
| 물 | 우물은 60~80미터 깊이이고, 물 높이는 해마다 30센티미터쯤 내려간다. 한강의 흐름도 해마다 조금씩 준다 |
| 먹을 것 | 끼니의 약 60%가 섬유당이다. 서울은 해마다 섬유 약 11만 톤을 먹고, 섬유를 캐러 가는 길은 해마다 멀어진다 |
| 전기 | 서울 전체가 늘 쓰는 전기는 약 5 MW다. 절반 넘게 바람틀에서 나온다 |
| 기계 몸 | 아크의 세례자는 약 1만 1천 명, 아크 사람 여섯 가운데 하나다 |
| 바깥 | 테두리의 기계는 해마다 줄지만 다 멈추지 않았다. 눈보라 때 테두리를 넘어 동력 덩이를 캐 오는 일은 장사가 됐다 |

백 년 동안 이어진 것들이 이 겨울에 한꺼번에 돌아온다. 서른 해 전에 고친 큰 펌프와 수차가 다시 닳았고, 서른 해 전에 판 우물은 9미터쯤 얕아졌다. 그리고 서른 해 전에는 없던 정체가 하나 있다. 아크다.

<a id="opening-contract"></a>

## 세 번째 급수계약

급수계약은 정부가 내는 자리와 일손과 물자를, 자유도시들이 내는 펌프와 수차의 정비와 부품과 맞바꾸는 약속이다. 자유도시들에는 묶는 이름이 없으니 계약도 하나가 아니다. 정부와 도시 하나하나가 맺는 계약 여러 장을 한 계약회에서 함께 도장 찍는다. 첫 계약은 2066년, 두 번째는 2096년이었다. 그 내력은 [백 년 연표](/wiki/Century-Annals/)에 있다.

- **자리주인.** 계약회를 여는 도시는 영등포다. 영등포의 우두머리인 장주가 차례대로 자리주인을 맡는다. 장주 자리는 장터 집안들이 세 해씩 정해진 차례로 돌아가며 맡으므로, 서른 해에 한 번 오는 이 자리에 누가 앉느냐는 차례가 정했다.
- **자리.** 여의도의 빈 국회의사당이다. 강이 얼자 국회는 광화문 청사로 옮겼고, 여의도 의사당은 영등포 땅이 됐다. 지상의 방은 영하 18도라 쓰지 않고, 눈에 묻힌 아래층과 9호선 국회의사당역 층을 데워 쓴다. 정부 사람은 제 조상이 떠난 건물에 손님으로 들어와 도장을 찍는다.
- **오는 길.** 정부 사람은 마포–여의나루 강 밑 터널로 온다. 아크 사람은 구반포에서 동작을 지나 9호선으로 온다. 아크가 계약회에 오는 길은 동작의 건널목을 지난다.
- **표결이 없다.** 계약회에서 맺는 것은 계약서 여러 장이고, 장 하나는 거기에 도장을 찍은 쪽만 묶는다. 도장을 찍기 전이면 누구든 자리를 떠날 수 있다.
- **아크가 처음 앉는다.** 아크는 잠실수중보의 전력과 암사 취수구를 가졌다. 이제 서울의 물은 세 정체가 모두 손을 대야 흐른다.

<a id="opening-government"></a>

## 정부의 입장

정부에게 급수계약은 물의 문제이기 전에 장부의 문제다. 정부는 강 건너를 나라로 적지 않는데, 계약은 도장을 맞찍는 일이다. 그래서 국회는 계약을 비준하지 않는다. 행정부처가 시설 하나마다 정비 용역 부속서를 맺고, 그 시설이 있는 구의 국회의원이 함께 도장을 찍고, 대통령이 결재한다. 장부에서 강 건너 도시들은 나라가 아니라 용역을 맡은 작업조다.

| | 정부가 바라는 것 | 정부가 내놓는 것 |
|---|---|---|
| 물 | 구의·뚝도 취수구 펌프를 통째로 뜯어 고치는 일, 우물을 더 깊이 파는 일 | 취수구 자리와 옛 관로 |
| 서울역 | 우물 하나 더와 깊은 층 팬 하나 더 | 일손(노역 파견) |
| 그 밖에 | | 북한산·도봉산 땔감, 옛 도심의 구리와 전선 |

노역 파견은 장부와 부딪친다. 장부에 오른 사람이 기재된 역을 떠나면 말소되기 때문이다. 그래서 정부는 계약마다 **파견 기재**를 따로 둔다. 파견 기재를 받은 사람은 강 건너에 있어도 장부에 남는다.

두 당은 아크를 두고 갈린다.

- **OMO당**은 아크와도 부속서를 맺자고 한다. 잠실수중보의 북쪽 끝 수차가 광진에 있으니 반쪽 전력이라도 함께 돌려야 한다고 본다. 한강에 닿은 네 구(마포, 용산, 성동, 광진)와 중구, 서대문구의 국회의원, 곧 OMO당 여섯이 이 편이다.
- **클로당**은 아크와는 부속서도 맺지 말자고 한다. 장부 밖 단체에 도장을 찍으면 장부의 병사들이 세례를 장부가 받아들인 것으로 읽는다고 본다. 내륙 여덟 구의 국회의원이 이 편이다.

의석은 클로당이 많다. 그런데 계약이 걸린 다리와 터널과 취수구는 모두 OMO당 구에 있고, 부속서는 법률이 아니라서 국회 의결을 거치지 않는다. 클로당이 부속서를 막을 길은 대통령의 결재뿐이다. 그래서 세 번째 계약은 광진 국회의원이 보의 북쪽 끝 부속서에 도장을 찍었을 때 대통령이 결재하느냐는 다툼이 된다. 열네 도장으로 추대된 대통령은 어느 편을 들어도 다음 날부터 절반의 의원을 잃는다. 정부의 속사정은 [정부 사회](/wiki/Government-Society/)에 있다.

<a id="opening-free-cities"></a>

## 자유도시들의 입장

자유도시 쪽에서 보면 도시마다 내는 것이 다르다.

| 도시 | 내는 것 | 받는 것 |
|---|---|---|
| 구로 | 구의·뚝도 취수구의 큰 펌프 부품과 서른 해마다 하는 통째 고침 | 구리선, 고물 쇠붙이, 일손 |
| 양천 | 펌프와 수차를 돌리는 모터의 재생, 짐을 옮기는 궤도 수레 | 섬유, 일손 |
| 강서 | 다리 위와 북쪽 둔치의 바람틀 가운데 취수 펌프를 돌리는 것들의 정비 | 섬유, 땔감 |
| 관악 | 우물을 더 깊이 파는 굴착조 | 섬유, 소금 |
| 금천 | 굴착 틀과 그 부품, 동력 덩이 | 섬유, 일손 |
| 동작 | 작업조와 짐이 다리로 오가는 통행과 호위 | 일손과 섬유 |
| 영등포 | 계약회 자리, 장의 셈 맞추기, 양평동 취수구의 물 일부 | 자릿세, 일손 |

이번 겨울 자유도시들 앞에는 여섯 가지 일이 걸려 있다.

1. **아크를 어디에 앉히나.** 아크와 맺는 장을 정부와 맺는 장과 같은 자리에서 찍을지, 따로 찍을지를 두고 도시들의 생각이 갈린다. 동작은 땅 경계 때문에, 영등포는 자리주인의 체면 때문에, 구로는 아크가 기술자를 빼 갈까 봐 저마다 다른 말을 한다.
2. **우물이 또 깊어진다.** 다음 서른 해 동안 물 높이는 9미터쯤 더 내려간다. 60~80미터 우물을 70~90미터로 다시 파야 한다. 굴착조를 가진 관악과 굴착 틀을 가진 금천이 이번 계약에서 가장 비싼 손이다.
3. **양평동 취수구의 물이 준다.** 영등포는 취수구를 깊은 물길 쪽으로 더 내밀어야 하고, 그러려면 정부의 일손이 필요하다.
4. **잠실의 전력.** 자유도시들은 잠실의 전력이 필요하다. 그 전력을 2호선을 따라 방배와 사당으로 끌어오는 케이블은 동작을 지난다.
5. **관악의 도장.** 관악은 이번에도 "공작령 대 공작령"으로 찍기를 요구한다. 2066년 관악은 국회의원의 도장 아래에 공작의 도장을 찍을 수 없다며 도장을 거뒀고, 2096년에는 정부가 "관악 공작령"이라는 이름을 적는 데 동의해 도장을 찍었다. 아크가 앉으면서 관악은 같은 요구를 아크에게도 할지 정해야 한다.
6. **계약회는 화덕만큼 간다.** 자리주인은 자리의 열과 빛과 끼니와 잠자리를 댄다. 계약회가 길어지면 영등포의 열이 바닥난다.

자유도시들의 속사정은 [자유도시들의 사회](/wiki/Free-City-Society/)에 있다.

<a id="opening-arc"></a>

## 아크의 입장

| | 아크의 입장 |
|---|---|
| 내놓는 것 | 잠실수중보 수차의 전기 일부와 암사 취수구의 강물 |
| 받으려는 것 | 수차와 취수구 펌프를 큰 수리할 자유도시 손, 정부 쪽 보 북쪽 끝(광진)을 막지 않는다는 약속, 강 북쪽의 섬유와 소금 |
| 양보하지 않는 것 | 세례와 다시 맞춤은 계약에 넣지 않는다. 아크 땅에 사는 사람을 정부 장부에 올리라는 요구는 받지 않는다 |

아크는 자유도시 하나하나와 따로 도장을 찍는다. 계약회에 앉되, 아크는 도시가 아니므로 자리주인을 맡지 않는다. 아크 쪽 교섭은 교주의 집 교섭인이 하고, 도장은 교주의 말을 받은 곁집장이 찍는다.

아크는 2096년 두 번째 계약에 강남의 대피소 몇 곳이 자유도시로서 찍은 도장을 지금도 "우리 몫의 도장"이라 말한다. 이번 계약에서 자기 자리를 요구하는 근거다. 자유도시 쪽은 그 도장이 자유도시의 도장이었다고 말한다. 아크의 속사정은 [아크 사회](/wiki/Arc-Society/)에 있다.

<a id="opening-year"></a>

## 첫 해의 흐름

서울 사람은 한 해를 계절로 나누지 않는다. 해가 짧은 반년을 긴 밤 철, 해가 긴 반년을 긴 낮 철이라 부른다. 개막의 한 해는 긴 밤 철에 열려 긴 낮 철을 지나 다시 긴 밤 철로 돌아온다. 아래는 그 한 해에 철마다 돌아오는 일이다. 계약의 결과는 여기 적지 않는다.

<a id="opening-long-dark"></a>

### 긴 밤 철: 계약회까지

- **눈보라의 철.** 눈보라가 잦다. 한 번 오면 2~4일 가고, 그동안 다리는 닫히고 지상 일은 멈춘다. 그 대신 테두리 기계의 눈도 가려져, 금천 경계조와 북쪽의 테두리꾼은 이때 테두리를 넘는다.
- **얼음판의 밤.** 장부에서 달아나는 사람과 밀수꾼은 긴 밤 철의 밤에 얼음판을 건넌다. 숨을 곳 없는 1킬로미터를 어둠으로 가린다.
- **빛밭이 쉰다.** 빛밭의 소출이 가장 적다. 섬유당 통과 버섯 굴이 끼니를 떠받친다. 정부의 동주민센터는 창고가 모자라면 사무 몫부터 깎는다.
- **도장을 모은다.** 정부의 국회의원들은 부속서의 도장을 두고 서로를 잰다. 자유도시들은 영등포로 갈 사람과 맡길 것을 고른다. 아크에서는 교주의 집 교섭인이 곁집장들과 장마다의 수치를 맞춘다.
- **계약회.** 영등포의 장주가 여의도 의사당에 자리를 연다. 장마다 도장이 찍히거나, 거두어진다.

<a id="opening-long-light"></a>

### 긴 낮 철: 도장 뒤의 일

- **다리가 열린다.** 눈보라가 드물고, 바람이 잔 낮에는 다리가 열린다. 땔감과 고물과 섬유 묶음처럼 무거운 짐이 썰매에 실려 다리를 건넌다.
- **고치는 철.** 도장이 찍힌 장의 일은 이때 한다. 펌프를 뜯고, 우물을 파고, 바람틀의 날개를 간다. 파견 기재를 받은 정부 일꾼이 강 건너 역에서 일하고, 자유도시 손이 강 북쪽 취수구에 내려간다.
- **도장이 찍히지 않은 곳.** 장을 맺지 못한 시설은 서른 해 된 펌프와 수차로 한 해를 더 버틴다. 닳은 펌프는 한 번 서면 다시 돌리기 어렵다. 물이 모자란 역은 눈을 녹여 쓰고, 그만큼 열을 더 쓴다.
- **빛밭이 차오른다.** 빛밭의 소출이 가장 많은 철이다. 섬유를 캐는 작업조도 이때 가장 멀리 간다.

<a id="opening-again"></a>

### 다시 긴 밤 철

한 해가 돌아 긴 밤 철이 다시 오면, 계약회에서 찍은 장과 거둔 장의 값이 드러난다. 고친 펌프는 돌고, 고치지 못한 펌프는 선다. 정부의 대통령이 어느 편을 들었는지, 아크와 자유도시 사이의 땅 경계가 조용한지, 세례를 받으러 넘어간 기술자가 몇인지가 다음 해의 서울을 정한다. 그리고 세 정체 모두가 같이 아는 한 가지가 남는다. 겨울은 지금보다 나빠질 수 있고, 한번 나빠지면 되돌릴 수 없다. 사람이 역보다 많아지면 겨울이 한 칸 조인다고들 짐작한다. 겨울은 풀리지 않는다.

<a id="opening-people"></a>

## 개막의 사람들

| 사람 | 개막의 자리 |
|---|---|
| 고예진 | 아크의 교주. 신도는 메시아라 부른다. 자유도시에서 자랐고, 이번 계약회에 처음으로 아크를 앉힌다 |
| 지연희 | 2120년부터 고예진 곁에 선 경호원 |
| 이일섭 | 관악 공작. "공작령 대 공작령"의 도장을 요구하는 관악의 우두머리 |
| 신종목 | 귀환망 현장 계약자. 호출부호 백야로 선정릉과 수서 사이를 잇는다 |

다른 이름 있는 사람들의 자리는 [인물·세력·생업](/wiki/Characters-Factions-and-Professions/)에 있다.

<a id="opening-read"></a>

## 더 읽을 곳

- 백 년의 흐름: [백 년 연표](/wiki/Century-Annals/)
- 계약과 세 정체의 관계: [급수계약과 세 정체](/wiki/World-Relation-Ledger/)
- 강을 건너는 길: [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)
- 세 정체의 개관: [서울의 세 정체](/wiki/Sixteen-States/)
- 세계의 뿌리: [세계 서사 총람](/wiki/World-Narrative-Atlas/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Seoul-Station-Catalog', 'Seoul Station Catalog', '서울 역 목록', 'places', 2, 'In 2126 the people of Seoul live in stations. This document lists every station on the Seoul map. Station names and lines are the real names from before the Great Blackout. Where a line runs on out of Seoul, the station still lists that line by name. For each station it records which polity''s land it is, how many lines meet there, how large a station it is, and what is held there.

## How Stations Are Counted

The Seoul map has 312 station entries. Divided by the polity that holds the surface, the Government has 157, the Free Cities 77 and Arc 78.

Five of these entries have no line joined to them and are not counted as stations where people live.

| Entry | District | Polity |
|---|---|---|
| Daehyeonsan Reservoir Park Monorail Daehyeonsan Reservoir Park Platform | Jung-gu | Government |
| Daehyeonsan Reservoir Park Monorail Starting Platform | Jung-gu | Government |
| Metro Hotel | Jung-gu | Government |
| Sinchon (Underground) | Seodaemun-gu | Government |
| Saengtaegongwon-ap | Gangdong-gu | Arc |

So there are 307 stations where people live: 153 Government, 77 Free City and 77 Arc. It is rare for a whole station to be abandoned. What is abandoned is usually part of a station: sealed entrances, frozen upper levels and unused tunnels. The frozen stations where the Free Cities lay their dead are likewise abandoned platforms attached to these stations, or old platforms that are not on the map.

## Station Sizes

The number of people a station holds is set by whichever of its space, heat, water and air runs shortest. When that cannot be counted one by one, the people of Seoul speak of stations in three sizes.

| Size | What kind of station | People held |
|---|---|---|
| Small station | One line, 2 to 4 exits | 400 to 800 |
| Interchange | Two lines, 5 or more exits | 1,500 to 3,200 |
| Large hub | Three or more lines, or a station with a deep level | 3,000 to 5,000 |

This catalog gives the size by the number of lines that meet. One line is a small station, two lines an interchange, three or more a large hub. The people actually held differ from station to station within a size. Seoul Station holds about 4,200, Sindorim about 2,000 and Jamsil about 3,100. Which limit holds a station back is explained in [Inside a Station](/wiki/Station-Interior-Construction/).

## Stations and People by Polity

| Polity | Map entries | Stations lived in | Small stations | Interchanges | Large hubs | People |
|---|---|---|---|---|---|---|
| Government | 157 | 153 | 112 | 29 | 12 | About 160,000 |
| The Free Cities | 77 | 77 | 58 | 18 | 1 | About 75,000 |
| Arc | 78 | 77 | 57 | 18 | 2 | About 65,000 |
| Seoul | 312 | 307 | 227 | 65 | 15 | About 300,000 |

The people of Seoul in 2126 number a little over 3% of Seoul before the Great Blackout. The Government has the most stations and the most people. The only large hub of the Free Cities is Gimpo Int''l Airport, where five lines pass. Arc''s large hubs are Express Bus Terminal and Suseo, where three lines meet.

## Stations with Markets and Exchange Posts

A station is a place to live and also a place where goods change hands. Each of the three polities moves goods in its own way.

**Government markets.** The Government runs its households on rations, and markets grow in the gaps. The Government licenses a market by district notice and allows it only in the wide concourse of a large station where it can be watched. Traders are people registered as traders, and they pay a daily stall fee in coupons.

| Station | District | Market |
|---|---|---|
| Jongno 3-ga | Jongno-gu | Coupon brokers and scribes, who write petitions and transfer papers for others. The market the Government has turned a blind eye to longest |
| Dongdaemun | Jongno-gu | Mending and used clothing |
| Dongdaemun History & Culture Park | Jung-gu | The largest clothing and boot market north of the river |
| Hoehyeon | Jung-gu | Food. The market value of coupons is set here |
| Seoul Station | Jung-gu | Licensed traders'' lodging. The only place on Government land where a trader from across the river may stay under temporary registration |
| Gongdeok | Mapo-gu | Parts and tools from across the river, brought in through the Mapo tunnel |
| Wangsimni | Seongdong-gu | Scrap metal, track parts, wire |
| Cheongnyangni | Dongdaemun-gu | Fuel: methane tanks, charcoal, scrap firewood |
| Jegi-dong | Dongdaemun-gu | Mushrooms and dried herbs |
| Sangbong | Jungnang-gu | Meat and hides of hunted animals |
| Yeonsinnae | Eunpyeong-gu | Firewood from Bukhansan |
| Chang-dong | Dobong-gu | Machine parts stripped from the Chang-dong depot |
| Nowon | Nowon-gu | Light-field greens and seed |
| Konkuk Univ. | Gwangjin-gu | Fish caught through holes in the river ice |

**Free City markets.** The Free Cities do not ration. People buy meals with wages or surety tags, and goods move by market and contract. The largest market of the seven cities is held on the platforms and in the concourse between Yeongdeungpo and Yeongdeungpo Market, with the old warehouses of Yeouido as its storehouse. The rate board, the price board of the market, is there too. The ice-hole fish market at Noryangjin is where more fish change hands than anywhere else in Seoul.

**Arc exchange posts.** There is no market inside Arc. Meals, sleeping places and parts are shared out by the Near Houses and the maintenance benches. Goods are exchanged with outsiders only at five set stations.

| Station | District | Exchange post |
|---|---|---|
| Garak Market | Songpa-gu | Food. Arc gives part of its stored food and takes fibre and seed |
| Jamsil | Songpa-gu | Power. Electricity from the Jamsil underwater weir is given out counted in day charges, and maintenance turns are sold to outsiders |
| Express Bus Terminal | Seocho-gu | Parts. Machined parts, wire and batteries that come across the border are taken in |
| Cheonho | Gangdong-gu | Tunnel. Government fibre and salt coming through the under-river tunnel are taken in |
| Suseo | Gangnam-gu | Metal. Metal from the old depot is given out and power cores dug from outside are taken in |

## Seat Stations

The station where the holder of a district works is called the seat station. Arc calls the station where the Head of the Near House lives the home station. Seat stations are marked in the "Use" column of the catalog. In a Government district the seat station is the station with the most links to neighbouring stations (on a tie, the one listed first). Each Free City has a station of its choosing: Gimpo Int''l Airport for Gangseo, Sinjeongnegeori for Yangcheon, Yeongdeungpo for Yeongdeungpo, Guro for Guro, Gasan Digital Complex for Geumcheon, Noryangjin for Dongjak and Sillim for Gwanak. Arc''s home stations are Express Bus Terminal in Seocho, Suseo in Gangnam, Jamsil in Songpa and Cheonho in Gangdong.

## Stations by District

Districts are listed in order: the Government''s 14, the Free Cities'' 7, then Arc''s 4. A blank "Use" column means the station is simply the home of the people who live there, with nothing else held there.

### Mapo-gu

Government. 13 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gongdeok | Line 5, Line 6, Gyeongui-Jungang Line, Airport Railroad | large hub | seat station, market (parts and tools from across the river) |
| Gwangheungchang | Line 6 | small station |  |
| Daeheung | Line 6 | small station |  |
| Digital Media City | Line 6, Gyeongui-Jungang Line, Airport Railroad | large hub |  |
| Mapo | Line 5 | small station |  |
| Mapo-gu Office | Line 6 | small station |  |
| Mangwon | Line 6 | small station |  |
| Sangsu | Line 6 | small station |  |
| Sogang Univ. | Gyeongui-Jungang Line | small station |  |
| Aeogae | Line 5 | small station |  |
| World Cup Stadium | Line 6 | small station |  |
| Hapjeong | Line 2, Line 6 | interchange |  |
| Hongik Univ. | Line 2, Gyeongui-Jungang Line, Airport Railroad | large hub |  |

### Yongsan-gu

Government. 12 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Namyeong | Line 1 | small station |  |
| Noksapyeong | Line 6 | small station |  |
| Samgakji | Line 4, Line 6 | interchange | seat station |
| Seobinggo | Gyeongui-Jungang Line | small station |  |
| Sookmyung Women''s Univ. | Line 4 | small station |  |
| Sinyongsan | Line 4 | small station |  |
| Yongsan | Line 1, Gyeongui-Jungang Line | interchange |  |
| Ichon | Line 4, Gyeongui-Jungang Line | interchange |  |
| Itaewon | Line 6 | small station |  |
| Hangangjin | Line 6 | small station |  |
| Hannam | Gyeongui-Jungang Line | small station |  |
| Hyochang Park | Line 6, Gyeongui-Jungang Line | interchange |  |

### Jung-gu

Government. 17 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Geumho | Line 3 | small station |  |
| Daehyeonsan Reservoir Park Monorail Daehyeonsan Reservoir Park Platform | none | not lived in |  |
| Daehyeonsan Reservoir Park Monorail Starting Platform | none | not lived in |  |
| Dongdaemun History & Culture Park | Line 2, Line 4, Line 5 | large hub | market (clothing, boots) |
| Dongguk Univ. | Line 3 | small station |  |
| Metro Hotel | none | not lived in |  |
| Myeong-dong | Line 4 | small station |  |
| Beotigogae | Line 6 | small station |  |
| Seoul Station | GTX-A, Line 1, Line 4, Gyeongui-Jungang Line, Airport Railroad | large hub | seat station, licensed traders'' lodging |
| City Hall | Line 1, Line 2 | interchange |  |
| Singeumho | Line 5 | small station |  |
| Sindang | Line 2, Line 6 | interchange |  |
| Yaksu | Line 3, Line 6 | interchange |  |
| Euljiro 1-ga | Line 2 | small station |  |
| Cheonggu | Line 5, Line 6 | interchange |  |
| Chungmuro | Line 3, Line 4 | interchange |  |
| Hoehyeon | Line 4 | small station | market (food) |

### Seongdong-gu

Government. 11 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Ttukseom | Line 2 | small station |  |
| Majang | Line 5 | small station |  |
| Sangwangsimni | Line 2 | small station |  |
| Seoul Forest | Suin-Bundang Line | small station |  |
| Seongsu | Line 2 | small station |  |
| Oksu | Line 3, Gyeongui-Jungang Line | interchange |  |
| Wangsimni | Line 2, Line 5, Gyeongui-Jungang Line, Suin-Bundang Line | large hub | seat station, market (scrap metal, track parts, wire) |
| Yongdap | Line 2 | small station |  |
| Eungbong | Gyeongui-Jungang Line | small station |  |
| Hanyang Univ. | Line 2 | small station |  |
| Haengdang | Line 5 | small station |  |

### Gwangjin-gu

Government. 9 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gangbyeon | Line 2 | small station |  |
| Konkuk Univ. | Line 2, Line 7 | interchange | seat station, market (fish) |
| Gwangnaru | Line 5 | small station |  |
| Guui | Line 2 | small station |  |
| Gunja | Line 5, Line 7 | interchange |  |
| Achasan | Line 5 | small station |  |
| Children''s Grand Park | Line 7 | small station |  |
| Jayang | Line 7 | small station |  |
| Junggok | Line 7 | small station |  |

### Dongdaemun-gu

Government. 9 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Dapsimni | Line 5 | small station |  |
| Sindap | Line 2 | small station |  |
| Sinimun | Line 1 | small station |  |
| Hankuk Univ. of Foreign Studies | Line 1 | small station |  |
| Yongdu | Line 2 | small station |  |
| Janghanpyeong | Line 5 | small station |  |
| Jegi-dong | Line 1 | small station | market (mushrooms, dried herbs) |
| Cheongnyangni | Line 1, Gyeongchun Line, Gyeongui-Jungang Line, Suin-Bundang Line | large hub | seat station, market (fuel) |
| Hoegi | Line 1, Gyeongchun Line, Gyeongui-Jungang Line | large hub |  |

### Jungnang-gu

Government. 10 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Mangu | Gyeongchun Line, Gyeongui-Jungang Line | interchange |  |
| Meokgol | Line 7 | small station |  |
| Myeonmok | Line 7 | small station |  |
| Sagajeong | Line 7 | small station |  |
| Sangbong | Line 7, Gyeongchun Line, Gyeongui-Jungang Line | large hub | seat station, market (meat, hides) |
| Sinnae | Line 6, Gyeongchun Line | interchange |  |
| Yangwon | Gyeongui-Jungang Line | small station |  |
| Yongmasan | Line 7 | small station |  |
| Jungnang | Gyeongchun Line, Gyeongui-Jungang Line | interchange |  |
| Junghwa | Line 7 | small station |  |

### Seongbuk-gu

Government. 13 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Korea Univ. | Line 6 | small station |  |
| Gireum | Line 4 | small station |  |
| Dolgoji | Line 6 | small station |  |
| Bomun | Line 6, Ui-Sinseol Line | interchange | seat station |
| Bukhansan Bogungmun | Ui-Sinseol Line | small station |  |
| Sangwolgok | Line 6 | small station |  |
| Sungshin Women''s Univ. | Line 4, Ui-Sinseol Line | interchange |  |
| Sinseol-dong | Line 1, Line 2, Ui-Sinseol Line | large hub |  |
| Anam | Line 6 | small station |  |
| Wolgok | Line 6 | small station |  |
| Jeongneung | Ui-Sinseol Line | small station |  |
| Changsin | Line 6 | small station |  |
| Hansung Univ. | Line 4 | small station |  |

### Jongno-gu

Government. 13 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gyeongbokgung | Line 3 | small station |  |
| Gwanghwamun | Line 5 | small station |  |
| Dongnimmun | Line 3 | small station |  |
| Dongdaemun | Line 1, Line 4 | interchange | market (mending, used clothing) |
| Dongmyo | Line 1, Line 6 | interchange |  |
| Seodaemun | Line 5 | small station |  |
| Anguk | Line 3 | small station |  |
| Euljiro 3-ga | Line 2, Line 3 | interchange |  |
| Euljiro 4-ga | Line 2, Line 5 | interchange |  |
| Jonggak | Line 1 | small station |  |
| Jongno 3-ga | Line 1, Line 3, Line 5 | large hub | seat station, market (coupon brokers, scribes) |
| Jongno 5-ga | Line 1 | small station |  |
| Hyehwa | Line 4 | small station |  |

### Seodaemun-gu

Government. 8 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gajwa | Gyeongui-Jungang Line | small station |  |
| Muakjae | Line 3 | small station |  |
| Sinchon | Line 2 | small station |  |
| Sinchon (Underground) | none | not lived in |  |
| Ahyeon | Line 2 | small station |  |
| Ewha Womans Univ. | Line 2 | small station |  |
| Chungjeongno | Line 2, Line 5 | interchange | seat station |
| Hongje | Line 3 | small station |  |

### Eunpyeong-gu

Government. 11 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gusan | Line 6 | small station |  |
| Gupabal | Line 3 | small station |  |
| Nokbeon | Line 3 | small station |  |
| Dokbawi | Line 6 | small station |  |
| Bulgwang | Line 3, Line 6 | interchange |  |
| Saejeol | Line 6 | small station |  |
| Susaek | Gyeongui-Jungang Line | small station |  |
| Yeokchon | Line 6 | small station |  |
| Yeonsinnae | GTX-A, Line 3, Line 6 | large hub | seat station, market (firewood) |
| Eungam | Line 6 | small station |  |
| Jeungsan | Line 6 | small station |  |

### Gangbuk-gu

Government. 11 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| April 19th National Cemetery | Ui-Sinseol Line | small station | seat station |
| Gaori | Ui-Sinseol Line | small station |  |
| Mia | Line 4 | small station |  |
| Miasageori | Line 4 | small station |  |
| Bukhansan Ui | Ui-Sinseol Line | small station |  |
| Samyang | Ui-Sinseol Line | small station |  |
| Samyang Sageori | Ui-Sinseol Line | small station |  |
| Solbat Park | Ui-Sinseol Line | small station |  |
| Solsaem | Ui-Sinseol Line | small station |  |
| Suyu | Line 4 | small station |  |
| Hwagye | Ui-Sinseol Line | small station |  |

### Dobong-gu

Government. 6 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Nokcheon | Line 1 | small station |  |
| Dobong | Line 1 | small station |  |
| Dobongsan | Line 1, Line 7 | interchange |  |
| Banghak | Line 1 | small station |  |
| Ssangmun | Line 4 | small station |  |
| Chang-dong | Line 1, Line 4 | interchange | seat station, market (machine parts) |

### Nowon-gu

Government. 14 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gongneung | Line 7 | small station |  |
| Kwangwoon Univ. | Line 1 | small station |  |
| Nowon | Line 4, Line 7 | interchange | seat station, market (light-field greens, seed) |
| Madeul | Line 7 | small station |  |
| Bonghwasan | Line 6 | small station |  |
| Buramsan | Line 4 | small station |  |
| Sanggye | Line 4 | small station |  |
| Seokgye | Line 1, Line 6 | interchange |  |
| Suraksan | Line 7 | small station |  |
| Wolgye | Line 1 | small station |  |
| Junggye | Line 7 | small station |  |
| Taereung | Line 6, Line 7 | interchange |  |
| Hagye | Line 7 | small station |  |
| Hwarangdae | Line 6 | small station |  |

### Gangseo-gu

Free City. 18 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gayang | Line 9 | small station |  |
| Gaehwa | Line 9 | small station |  |
| Gaehwasan | Line 5 | small station |  |
| Airport Market | Line 9 | small station |  |
| Gimpo Int''l Airport | Line 5, Line 9, Gimpo Goldline, Airport Railroad, Seohae Line | large hub | seat station |
| Kkachisan | Line 2, Line 5 | interchange |  |
| Deungchon | Line 9 | small station |  |
| Magok | Line 5 | small station |  |
| Magongnaru | Line 9, Airport Railroad | interchange |  |
| Balsan | Line 5 | small station |  |
| Banghwa | Line 5 | small station |  |
| Songjeong | Line 5 | small station |  |
| Sinbanghwa | Line 9 | small station |  |
| Yangcheon Hyanggyo | Line 9 | small station |  |
| Yeomchang | Line 9 | small station |  |
| Ujangsan | Line 5 | small station |  |
| Jeungmi | Line 9 | small station |  |
| Hwagok | Line 5 | small station |  |

### Yangcheon-gu

Free City. 7 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Mok-dong | Line 5 | small station |  |
| Sinmokdong | Line 9 | small station |  |
| Sinjeong | Line 5 | small station |  |
| Sinjeongnegeori | Line 2 | small station | seat station |
| Yangcheon-gu Office | Line 2 | small station |  |
| Yangpyeong | Line 5 | small station |  |
| Omokgyo | Line 5 | small station |  |

### Yeongdeungpo-gu

Free City. 18 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Yeongdeungpo | Line 1 | small station | seat station, great market |
| Guro Digital Complex | Line 2 | small station |  |
| National Assembly | Line 9 | small station |  |
| Dangsan | Line 2, Line 9 | interchange |  |
| Daebang | Line 1, Sillim Line | interchange |  |
| Dorimcheon | Line 2 | small station |  |
| Mullae | Line 2 | small station |  |
| Boramae | Line 7, Sillim Line | interchange |  |
| Boramae Park | Sillim Line | small station |  |
| Saetgang | Line 9, Sillim Line | interchange |  |
| Seoul Regional Office of Military Manpower | Sillim Line | small station |  |
| Seonyudo | Line 9 | small station |  |
| Singil | Line 1, Line 5 | interchange |  |
| Sinpung | Line 7 | small station |  |
| Yeouinaru | Line 5 | small station |  |
| Yeouido | Line 5, Line 9 | interchange |  |
| Yeongdeungpo-gu Office | Line 2, Line 5 | interchange |  |
| Yeongdeungpo Market | Line 5 | small station | great market |

### Guro-gu

Free City. 9 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Guro | Line 1 | small station | seat station |
| Sindorim | Line 1, Line 2 | interchange |  |
| Gaebong | Line 1 | small station |  |
| Guil | Line 1 | small station |  |
| Namguro | Line 7 | small station |  |
| Daerim | Line 2, Line 7 | interchange |  |
| Oryu-dong | Line 1 | small station |  |
| Onsu | Line 1, Line 7 | interchange |  |
| Cheonwang | Line 7 | small station |  |

### Geumcheon-gu

Free City. 3 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gasan Digital Complex | Line 1, Line 7 | interchange | seat station |
| Geumcheon-gu Office | Line 1 | small station |  |
| Doksan | Line 1 | small station |  |

### Dongjak-gu

Free City. 14 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Namseong | Line 7 | small station |  |
| Nodeul | Line 9 | small station |  |
| Noryangjin | Line 1, Line 9 | interchange | seat station, ice-hole fish market |
| Danggok | Sillim Line | small station |  |
| Dongjak | Line 4, Line 9 | interchange |  |
| Boramae Medical Center | Sillim Line | small station |  |
| Sadang | Line 2, Line 4 | interchange |  |
| Sangdo | Line 7 | small station |  |
| Soongsil Univ. | Line 7 | small station |  |
| Sindaebang | Line 2 | small station |  |
| Sindaebangsamgeori | Line 7 | small station |  |
| Jangseungbaegi | Line 7 | small station |  |
| Chongshin Univ. (Isu) | Line 4, Line 7 | interchange |  |
| Heukseok | Line 9 | small station |  |

### Gwanak-gu

Free City. 8 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gwanaksan | Sillim Line | small station |  |
| Nakseongdae | Line 2 | small station |  |
| Namtaeryeong | Line 4 | small station |  |
| Bongcheon | Line 2 | small station |  |
| Seoul Nat''l Univ. Venture Town | Sillim Line | small station |  |
| Seoul Nat''l Univ. | Line 2 | small station |  |
| Seowon | Sillim Line | small station |  |
| Sillim | Line 2, Sillim Line | interchange | seat station |

### Seocho-gu

Arc. 18 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gangnam | Line 2, Sinbundang Line | interchange |  |
| Express Bus Terminal | Line 3, Line 7, Line 9 | large hub | seat station, exchange post (parts) |
| Seoul Nat''l Univ. of Education | Line 2, Line 3 | interchange |  |
| Gubanpo | Line 9 | small station |  |
| Nambu Bus Terminal | Line 3 | small station |  |
| Naebang | Line 7 | small station |  |
| Nonhyeon | Line 7, Sinbundang Line | interchange |  |
| Banpo | Line 7 | small station |  |
| Bangbae | Line 2 | small station |  |
| Sapyeong | Line 9 | small station |  |
| Seocho | Line 2 | small station |  |
| Sinnonhyeon | Line 9, Sinbundang Line | interchange |  |
| Sinbanpo | Line 9 | small station |  |
| Sinsa | Line 3, Sinbundang Line | interchange |  |
| Yangjae | Line 3, Sinbundang Line | interchange |  |
| Yangjae Citizen''s Forest | Sinbundang Line | small station |  |
| Jamwon | Line 3 | small station |  |
| Cheonggyesan | Sinbundang Line | small station |  |

### Gangnam-gu

Arc. 23 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gangnam-gu Office | Line 7, Suin-Bundang Line | interchange |  |
| Gaepo-dong | Suin-Bundang Line | small station |  |
| Guryong | Suin-Bundang Line | small station |  |
| Daemosan | Suin-Bundang Line | small station |  |
| Daecheong | Line 3 | small station |  |
| Daechi | Line 3 | small station |  |
| Dogok | Line 3, Suin-Bundang Line | interchange |  |
| Maebong | Line 3 | small station |  |
| Bongeunsa | Line 9 | small station |  |
| Samseong | Line 2 | small station |  |
| Samseong Jungang | Line 9 | small station |  |
| Seolleung | Line 2, Suin-Bundang Line | interchange |  |
| Seonjeongneung | Line 9, Suin-Bundang Line | interchange |  |
| Suseo | GTX-A, Line 3, Suin-Bundang Line | large hub | seat station, exchange post (metal) |
| Apgujeong | Line 3 | small station |  |
| Apgujeong Rodeo | Suin-Bundang Line | small station |  |
| Eonju | Line 9 | small station |  |
| Yeoksam | Line 2 | small station |  |
| Irwon | Line 3 | small station |  |
| Cheongdam | Line 7 | small station |  |
| Hak-dong | Line 7 | small station |  |
| Hangnyeoul | Line 3 | small station |  |
| Hanti | Suin-Bundang Line | small station |  |

### Songpa-gu

Arc. 23 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Garak Market | Line 3, Line 8 | interchange | exchange post (food) |
| Gangdong-gu Office | Line 8 | small station |  |
| Gaerong | Line 5 | small station |  |
| Geoyeo | Line 5 | small station |  |
| National Police Hospital | Line 3 | small station |  |
| Macheon | Line 5 | small station |  |
| Mongchontoseong | Line 8 | small station |  |
| Munjeong | Line 8 | small station |  |
| Bangi | Line 5 | small station |  |
| Bokjeong | Line 8, Suin-Bundang Line | interchange |  |
| Samjeon | Line 9 | small station |  |
| Seokchon | Line 8, Line 9 | interchange |  |
| Seokchon Gobun | Line 9 | small station |  |
| Songpa | Line 8 | small station |  |
| Songpanaru | Line 9 | small station |  |
| Ogeum | Line 3, Line 5 | interchange |  |
| Olympic Park | Line 5, Line 9 | interchange |  |
| Jamsil | Line 2, Line 8 | interchange | seat station, exchange post (power) |
| Jamsillaru | Line 2 | small station |  |
| Jamsilsaenae | Line 2 | small station |  |
| Jangji | Line 8 | small station |  |
| Sports Complex | Line 2, Line 9 | interchange |  |
| Hanseong Baekje | Line 9 | small station |  |

### Gangdong-gu

Arc. 14 map entries.

| Station | Lines | Size | Use |
|---|---|---|---|
| Gangdong | Line 5 | small station |  |
| Gangil | Line 5 | small station |  |
| Godeok | Line 5 | small station |  |
| Gubeundari | Line 5 | small station |  |
| Gil-dong | Line 5 | small station |  |
| Dunchon-dong | Line 5 | small station |  |
| Dunchon Oryun | Line 9 | small station |  |
| Myeongil | Line 5 | small station |  |
| Sangil-dong | Line 5 | small station |  |
| Saengtaegongwon-ap | none | not lived in |  |
| Amsa | Line 8 | small station |  |
| Amsa History Park | Line 8 | small station |  |
| VHS Medical Center | Line 9 | small station |  |
| Cheonho | Line 5, Line 8 | interchange | seat station, exchange post (tunnel) |

## Related Documents

- [Inside a Station](/wiki/Station-Interior-Construction/)
- [How the World Map Is Built](/wiki/World-Map-Construction/)
- [The Surface and Underground](/wiki/World-and-Subway-Layers/)
- [World Index: the Three Polities and the 25 Duchies](/wiki/World-Expansion-Index/)
- [Government Society](/wiki/Government-Society/)
- [Free City Society](/wiki/Free-City-Society/)
- [Arc Society](/wiki/Arc-Society/)
', '2126년 서울 사람은 역에 산다. 이 문서는 서울 지도에 오른 역을 모두 적는다. 역 이름과 노선은 대정전 전의 실제 이름 그대로다. 노선이 서울 밖으로 이어지는 역도 그 노선의 이름을 그대로 적는다. 역마다 어느 정체의 땅인지, 몇 노선이 만나는지, 얼마나 큰 역인지, 그리고 그 역에 무엇이 서는지를 적었다.

## 역을 세는 법

서울 지도에는 역 항목이 312곳 있다. 지상을 쥔 정체로 나누면 정부 157곳, 자유도시들 77곳, 아크 78곳이다.

이 가운데 다섯 항목은 노선이 이어지지 않아 사람이 사는 역으로 세지 않는다.

| 항목 | 구 | 정체 |
|---|---|---|
| 대현산배수지공원 모노레일 대현산배수지공원승강장 | 중구 | 정부 |
| 대현산배수지공원 모노레일 시점승강장 | 중구 | 정부 |
| 메트로호텔 | 중구 | 정부 |
| 신촌(지하) | 서대문구 | 정부 |
| 생태공원앞 | 강동구 | 아크 |

그래서 사람이 사는 역은 307곳이다. 정부 153곳, 자유도시들 77곳, 아크 77곳이다. 역 전체가 버려진 곳은 드물다. 버려진 것은 대개 역의 일부, 곧 닫아 버린 출입구와 얼어붙은 위층, 쓰지 않는 터널이다. 자유도시들이 죽은 사람을 모시는 언 역도 이 역들에 딸린 버려진 승강장이나 지도에 없는 옛 승강장이다.

## 역의 크기

역이 품는 사람 수는 그 역의 공간, 열, 물, 공기 가운데 가장 모자란 것이 정한다. 그것을 하나하나 셀 수 없을 때 서울 사람은 역을 세 크기로 나눠 말한다.

| 크기 | 어떤 역인가 | 품는 사람 |
|---|---|---|
| 작은 역 | 한 노선, 출구 2~4곳 | 400~800명 |
| 환승역 | 두 노선, 출구 5곳 이상 | 1,500~3,200명 |
| 큰 환승 단지 | 세 노선 이상이거나 깊은 층이 있는 역 | 3,000~5,000명 |

이 목록은 만나는 노선의 수로 크기를 적었다. 한 노선이면 작은 역, 두 노선이면 환승역, 세 노선 이상이면 큰 환승 단지다. 실제로 품는 사람은 같은 크기 안에서도 역마다 다르다. 서울역은 약 4,200명, 신도림은 약 2,000명, 잠실은 약 3,100명을 품는다. 어느 한도가 그 역을 막는지는 [역 안으로](/wiki/Station-Interior-Construction/)에 있다.

## 정체별 역과 사람

| 정체 | 지도 항목 | 사람이 사는 역 | 작은 역 | 환승역 | 큰 환승 단지 | 사람 |
|---|---|---|---|---|---|---|
| 정부 | 157 | 153 | 112 | 29 | 12 | 약 16만 |
| 자유도시들 | 77 | 77 | 58 | 18 | 1 | 약 7만 5천 |
| 아크 | 78 | 77 | 57 | 18 | 2 | 약 6만 5천 |
| 서울 | 312 | 307 | 227 | 65 | 15 | 약 30만 |

2126년 서울 사람은 대정전 전 서울의 3% 남짓이다. 정부는 역이 가장 많고 사람도 가장 많다. 자유도시들의 큰 환승 단지는 다섯 노선이 지나는 김포공항 하나다. 아크의 큰 환승 단지는 세 노선이 만나는 고속터미널과 수서다.

## 장터와 바꿈터가 서는 역

역은 사는 곳이자 물건이 오가는 곳이다. 세 정체는 물건을 오가게 하는 법이 서로 다르다.

**정부의 장터.** 정부는 배급으로 살림을 돌리고, 그 틈에서 장터가 자란다. 정부는 장터를 구 고시로 허가하고, 지켜볼 수 있는 큰 역의 넓은 대합실에서만 연다. 상인은 상인으로 기재된 사람이고, 자릿세를 날마다 증표로 낸다.

| 역 | 구 | 장터 |
|---|---|---|
| 종로3가 | 종로구 | 증표 중개와 대서. 민원 서류와 전입 서류를 대신 써 준다. 정부가 가장 오래 눈감아 온 장이다 |
| 동대문 | 종로구 | 옷 수선과 헌 옷 |
| 동대문역사문화공원 | 중구 | 강 북쪽에서 가장 큰 옷과 장화 장 |
| 회현 | 중구 | 먹을거리. 증표의 장터 값이 여기서 정해진다 |
| 서울역 | 중구 | 허가 상인 대기소. 강 건너 상인이 임시 기재를 받고 머물 수 있는 정부 땅의 유일한 곳이다 |
| 공덕 | 마포구 | 마포 터널로 들어온 강 건너 부품과 공구 |
| 왕십리 | 성동구 | 고물 쇠붙이, 선로 부품, 전선 |
| 청량리 | 동대문구 | 연료. 메탄 통, 숯, 고물 땔감 |
| 제기동 | 동대문구 | 버섯과 말린 약초 |
| 상봉 | 중랑구 | 사냥한 짐승의 고기와 가죽 |
| 연신내 | 은평구 | 북한산 땔감 |
| 창동 | 도봉구 | 창동 차량기지에서 뜯은 기계 부품 |
| 노원 | 노원구 | 빛밭 채소와 씨앗 |
| 건대입구 | 광진구 | 강 얼음 구멍에서 잡은 물고기 |

**자유도시들의 장.** 자유도시들은 배급하지 않는다. 사람들은 품삯이나 보증표로 끼니를 사고, 물건은 장과 계약으로 돈다. 일곱 도시에서 가장 큰 장은 영등포와 영등포시장 사이의 승강장과 대합실에 서고, 여의도의 옛 창고가 그 곳간이다. 장터의 값판인 셈판도 여기 있다. 노량진의 얼음 구멍 장은 서울에서 물고기가 가장 많이 도는 곳이다.

**아크의 바꿈터.** 아크 안에는 장터가 없다. 끼니와 잠자리와 부품은 곁집과 정비대가 나눈다. 바깥 사람과 물건을 바꾸는 일만 정해진 역 다섯 곳에서 한다.

| 역 | 구 | 바꿈터 |
|---|---|---|
| 가락시장 | 송파구 | 먹거리. 아크의 저장 먹거리 일부를 내고 섬유와 씨앗을 받는다 |
| 잠실 | 송파구 | 전기. 잠실수중보의 전기를 하루 충전의 수로 내주고, 바깥 사람에게 정비 차례를 판다 |
| 고속터미널 | 서초구 | 부품. 경계를 넘어온 깎은 부품, 전선, 전지를 받는다 |
| 천호 | 강동구 | 터널. 강 밑 터널 쪽에서 오는 정부의 섬유와 소금을 받는다 |
| 수서 | 강남구 | 쇠. 옛 차량기지의 쇠붙이를 내고 바깥에서 캐 온 동력 덩이를 받는다 |

## 자리 역

구를 쥔 사람이 일하는 역을 자리 역이라 한다. 아크는 곁집장이 사는 역을 본역이라 부른다. 목록의 "쓰임" 칸에 자리 역을 적었다. 정부 구는 그 구에서 이웃 역과 가장 많이 이어진 역이 자리 역이다(같으면 목록에서 앞선 역). 자유도시들은 도시마다 정한 역이 있다. 강서는 김포공항, 양천은 신정네거리, 영등포는 영등포, 구로는 구로, 금천은 가산디지털단지, 동작은 노량진, 관악은 신림이다. 아크의 본역은 서초 고속터미널, 강남 수서, 송파 잠실, 강동 천호다.

## 구별 역 목록

구는 정부 14구, 자유도시 7구, 아크 4구 차례로 적었다. "쓰임" 칸이 빈 역은 그 역에 사는 사람들의 역일 뿐 따로 서는 것이 없다는 뜻이다.

### 마포구

정부. 지도 항목 13곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 공덕 | 5호선, 6호선, 경의중앙선, 공항철도 | 큰 환승 단지 | 자리 역, 장터(강 건너 부품·공구) |
| 광흥창 | 6호선 | 작은 역 |  |
| 대흥 | 6호선 | 작은 역 |  |
| 디지털미디어시티 | 6호선, 경의중앙선, 공항철도 | 큰 환승 단지 |  |
| 마포 | 5호선 | 작은 역 |  |
| 마포구청 | 6호선 | 작은 역 |  |
| 망원 | 6호선 | 작은 역 |  |
| 상수 | 6호선 | 작은 역 |  |
| 서강대 | 경의중앙선 | 작은 역 |  |
| 애오개 | 5호선 | 작은 역 |  |
| 월드컵경기장 | 6호선 | 작은 역 |  |
| 합정 | 2호선, 6호선 | 환승역 |  |
| 홍대입구 | 2호선, 경의중앙선, 공항철도 | 큰 환승 단지 |  |

### 용산구

정부. 지도 항목 12곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 남영 | 1호선 | 작은 역 |  |
| 녹사평 | 6호선 | 작은 역 |  |
| 삼각지 | 4호선, 6호선 | 환승역 | 자리 역 |
| 서빙고 | 경의중앙선 | 작은 역 |  |
| 숙대입구 | 4호선 | 작은 역 |  |
| 신용산 | 4호선 | 작은 역 |  |
| 용산 | 1호선, 경의중앙선 | 환승역 |  |
| 이촌 | 4호선, 경의중앙선 | 환승역 |  |
| 이태원 | 6호선 | 작은 역 |  |
| 한강진 | 6호선 | 작은 역 |  |
| 한남 | 경의중앙선 | 작은 역 |  |
| 효창공원앞 | 6호선, 경의중앙선 | 환승역 |  |

### 중구

정부. 지도 항목 17곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 금호 | 3호선 | 작은 역 |  |
| 대현산배수지공원 모노레일 대현산배수지공원승강장 | 없음 | 사람이 살지 않음 |  |
| 대현산배수지공원 모노레일 시점승강장 | 없음 | 사람이 살지 않음 |  |
| 동대문역사문화공원 | 2호선, 4호선, 5호선 | 큰 환승 단지 | 장터(옷·장화) |
| 동대입구 | 3호선 | 작은 역 |  |
| 메트로호텔 | 없음 | 사람이 살지 않음 |  |
| 명동 | 4호선 | 작은 역 |  |
| 버티고개 | 6호선 | 작은 역 |  |
| 서울역 | GTX-A, 1호선, 4호선, 경의중앙선, 공항철도 | 큰 환승 단지 | 자리 역, 허가 상인 대기소 |
| 시청 | 1호선, 2호선 | 환승역 |  |
| 신금호 | 5호선 | 작은 역 |  |
| 신당 | 2호선, 6호선 | 환승역 |  |
| 약수 | 3호선, 6호선 | 환승역 |  |
| 을지로입구 | 2호선 | 작은 역 |  |
| 청구 | 5호선, 6호선 | 환승역 |  |
| 충무로 | 3호선, 4호선 | 환승역 |  |
| 회현 | 4호선 | 작은 역 | 장터(먹을거리) |

### 성동구

정부. 지도 항목 11곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 뚝섬 | 2호선 | 작은 역 |  |
| 마장 | 5호선 | 작은 역 |  |
| 상왕십리 | 2호선 | 작은 역 |  |
| 서울숲 | 수인분당선 | 작은 역 |  |
| 성수 | 2호선 | 작은 역 |  |
| 옥수 | 3호선, 경의중앙선 | 환승역 |  |
| 왕십리 | 2호선, 5호선, 경의중앙선, 수인분당선 | 큰 환승 단지 | 자리 역, 장터(쇠붙이·선로 부품·전선) |
| 용답 | 2호선 | 작은 역 |  |
| 응봉 | 경의중앙선 | 작은 역 |  |
| 한양대 | 2호선 | 작은 역 |  |
| 행당 | 5호선 | 작은 역 |  |

### 광진구

정부. 지도 항목 9곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 강변 | 2호선 | 작은 역 |  |
| 건대입구 | 2호선, 7호선 | 환승역 | 자리 역, 장터(물고기) |
| 광나루 | 5호선 | 작은 역 |  |
| 구의 | 2호선 | 작은 역 |  |
| 군자 | 5호선, 7호선 | 환승역 |  |
| 아차산 | 5호선 | 작은 역 |  |
| 어린이대공원 | 7호선 | 작은 역 |  |
| 자양 | 7호선 | 작은 역 |  |
| 중곡 | 7호선 | 작은 역 |  |

### 동대문구

정부. 지도 항목 9곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 답십리 | 5호선 | 작은 역 |  |
| 신답 | 2호선 | 작은 역 |  |
| 신이문 | 1호선 | 작은 역 |  |
| 외대앞 | 1호선 | 작은 역 |  |
| 용두 | 2호선 | 작은 역 |  |
| 장한평 | 5호선 | 작은 역 |  |
| 제기동 | 1호선 | 작은 역 | 장터(버섯·약초) |
| 청량리 | 1호선, 경춘선, 경의중앙선, 수인분당선 | 큰 환승 단지 | 자리 역, 장터(연료) |
| 회기 | 1호선, 경춘선, 경의중앙선 | 큰 환승 단지 |  |

### 중랑구

정부. 지도 항목 10곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 망우 | 경춘선, 경의중앙선 | 환승역 |  |
| 먹골 | 7호선 | 작은 역 |  |
| 면목 | 7호선 | 작은 역 |  |
| 사가정 | 7호선 | 작은 역 |  |
| 상봉 | 7호선, 경춘선, 경의중앙선 | 큰 환승 단지 | 자리 역, 장터(고기·가죽) |
| 신내 | 6호선, 경춘선 | 환승역 |  |
| 양원 | 경의중앙선 | 작은 역 |  |
| 용마산 | 7호선 | 작은 역 |  |
| 중랑 | 경춘선, 경의중앙선 | 환승역 |  |
| 중화 | 7호선 | 작은 역 |  |

### 성북구

정부. 지도 항목 13곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 고려대 | 6호선 | 작은 역 |  |
| 길음 | 4호선 | 작은 역 |  |
| 돌곶이 | 6호선 | 작은 역 |  |
| 보문 | 6호선, 우이신설선 | 환승역 | 자리 역 |
| 북한산보국문 | 우이신설선 | 작은 역 |  |
| 상월곡 | 6호선 | 작은 역 |  |
| 성신여대입구 | 4호선, 우이신설선 | 환승역 |  |
| 신설동 | 1호선, 2호선, 우이신설선 | 큰 환승 단지 |  |
| 안암 | 6호선 | 작은 역 |  |
| 월곡 | 6호선 | 작은 역 |  |
| 정릉 | 우이신설선 | 작은 역 |  |
| 창신 | 6호선 | 작은 역 |  |
| 한성대입구 | 4호선 | 작은 역 |  |

### 종로구

정부. 지도 항목 13곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 경복궁 | 3호선 | 작은 역 |  |
| 광화문 | 5호선 | 작은 역 |  |
| 독립문 | 3호선 | 작은 역 |  |
| 동대문 | 1호선, 4호선 | 환승역 | 장터(옷 수선·헌 옷) |
| 동묘앞 | 1호선, 6호선 | 환승역 |  |
| 서대문 | 5호선 | 작은 역 |  |
| 안국 | 3호선 | 작은 역 |  |
| 을지로3가 | 2호선, 3호선 | 환승역 |  |
| 을지로4가 | 2호선, 5호선 | 환승역 |  |
| 종각 | 1호선 | 작은 역 |  |
| 종로3가 | 1호선, 3호선, 5호선 | 큰 환승 단지 | 자리 역, 장터(증표 중개·대서) |
| 종로5가 | 1호선 | 작은 역 |  |
| 혜화 | 4호선 | 작은 역 |  |

### 서대문구

정부. 지도 항목 8곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 가좌 | 경의중앙선 | 작은 역 |  |
| 무악재 | 3호선 | 작은 역 |  |
| 신촌 | 2호선 | 작은 역 |  |
| 신촌(지하) | 없음 | 사람이 살지 않음 |  |
| 아현 | 2호선 | 작은 역 |  |
| 이대 | 2호선 | 작은 역 |  |
| 충정로 | 2호선, 5호선 | 환승역 | 자리 역 |
| 홍제 | 3호선 | 작은 역 |  |

### 은평구

정부. 지도 항목 11곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 구산 | 6호선 | 작은 역 |  |
| 구파발 | 3호선 | 작은 역 |  |
| 녹번 | 3호선 | 작은 역 |  |
| 독바위 | 6호선 | 작은 역 |  |
| 불광 | 3호선, 6호선 | 환승역 |  |
| 새절 | 6호선 | 작은 역 |  |
| 수색 | 경의중앙선 | 작은 역 |  |
| 역촌 | 6호선 | 작은 역 |  |
| 연신내 | GTX-A, 3호선, 6호선 | 큰 환승 단지 | 자리 역, 장터(땔감) |
| 응암 | 6호선 | 작은 역 |  |
| 증산 | 6호선 | 작은 역 |  |

### 강북구

정부. 지도 항목 11곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 4.19민주묘지 | 우이신설선 | 작은 역 | 자리 역 |
| 가오리 | 우이신설선 | 작은 역 |  |
| 미아 | 4호선 | 작은 역 |  |
| 미아사거리 | 4호선 | 작은 역 |  |
| 북한산우이 | 우이신설선 | 작은 역 |  |
| 삼양 | 우이신설선 | 작은 역 |  |
| 삼양사거리 | 우이신설선 | 작은 역 |  |
| 솔밭공원 | 우이신설선 | 작은 역 |  |
| 솔샘 | 우이신설선 | 작은 역 |  |
| 수유 | 4호선 | 작은 역 |  |
| 화계 | 우이신설선 | 작은 역 |  |

### 도봉구

정부. 지도 항목 6곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 녹천 | 1호선 | 작은 역 |  |
| 도봉 | 1호선 | 작은 역 |  |
| 도봉산 | 1호선, 7호선 | 환승역 |  |
| 방학 | 1호선 | 작은 역 |  |
| 쌍문 | 4호선 | 작은 역 |  |
| 창동 | 1호선, 4호선 | 환승역 | 자리 역, 장터(기계 부품) |

### 노원구

정부. 지도 항목 14곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 공릉 | 7호선 | 작은 역 |  |
| 광운대 | 1호선 | 작은 역 |  |
| 노원 | 4호선, 7호선 | 환승역 | 자리 역, 장터(빛밭 채소·씨앗) |
| 마들 | 7호선 | 작은 역 |  |
| 봉화산 | 6호선 | 작은 역 |  |
| 불암산 | 4호선 | 작은 역 |  |
| 상계 | 4호선 | 작은 역 |  |
| 석계 | 1호선, 6호선 | 환승역 |  |
| 수락산 | 7호선 | 작은 역 |  |
| 월계 | 1호선 | 작은 역 |  |
| 중계 | 7호선 | 작은 역 |  |
| 태릉입구 | 6호선, 7호선 | 환승역 |  |
| 하계 | 7호선 | 작은 역 |  |
| 화랑대 | 6호선 | 작은 역 |  |

### 강서구

자유도시. 지도 항목 18곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 가양 | 9호선 | 작은 역 |  |
| 개화 | 9호선 | 작은 역 |  |
| 개화산 | 5호선 | 작은 역 |  |
| 공항시장 | 9호선 | 작은 역 |  |
| 김포공항 | 5호선, 9호선, 김포골드라인, 공항철도, 서해선 | 큰 환승 단지 | 자리 역 |
| 까치산 | 2호선, 5호선 | 환승역 |  |
| 등촌 | 9호선 | 작은 역 |  |
| 마곡 | 5호선 | 작은 역 |  |
| 마곡나루 | 9호선, 공항철도 | 환승역 |  |
| 발산 | 5호선 | 작은 역 |  |
| 방화 | 5호선 | 작은 역 |  |
| 송정 | 5호선 | 작은 역 |  |
| 신방화 | 9호선 | 작은 역 |  |
| 양천향교 | 9호선 | 작은 역 |  |
| 염창 | 9호선 | 작은 역 |  |
| 우장산 | 5호선 | 작은 역 |  |
| 증미 | 9호선 | 작은 역 |  |
| 화곡 | 5호선 | 작은 역 |  |

### 양천구

자유도시. 지도 항목 7곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 목동 | 5호선 | 작은 역 |  |
| 신목동 | 9호선 | 작은 역 |  |
| 신정 | 5호선 | 작은 역 |  |
| 신정네거리 | 2호선 | 작은 역 | 자리 역 |
| 양천구청 | 2호선 | 작은 역 |  |
| 양평 | 5호선 | 작은 역 |  |
| 오목교 | 5호선 | 작은 역 |  |

### 영등포구

자유도시. 지도 항목 18곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 영등포 | 1호선 | 작은 역 | 자리 역, 큰 장터 |
| 구로디지털단지 | 2호선 | 작은 역 |  |
| 국회의사당 | 9호선 | 작은 역 |  |
| 당산 | 2호선, 9호선 | 환승역 |  |
| 대방 | 1호선, 신림선 | 환승역 |  |
| 도림천 | 2호선 | 작은 역 |  |
| 문래 | 2호선 | 작은 역 |  |
| 보라매 | 7호선, 신림선 | 환승역 |  |
| 보라매공원 | 신림선 | 작은 역 |  |
| 샛강 | 9호선, 신림선 | 환승역 |  |
| 서울지방병무청 | 신림선 | 작은 역 |  |
| 선유도 | 9호선 | 작은 역 |  |
| 신길 | 1호선, 5호선 | 환승역 |  |
| 신풍 | 7호선 | 작은 역 |  |
| 여의나루 | 5호선 | 작은 역 |  |
| 여의도 | 5호선, 9호선 | 환승역 |  |
| 영등포구청 | 2호선, 5호선 | 환승역 |  |
| 영등포시장 | 5호선 | 작은 역 | 큰 장터 |

### 구로구

자유도시. 지도 항목 9곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 구로 | 1호선 | 작은 역 | 자리 역 |
| 신도림 | 1호선, 2호선 | 환승역 |  |
| 개봉 | 1호선 | 작은 역 |  |
| 구일 | 1호선 | 작은 역 |  |
| 남구로 | 7호선 | 작은 역 |  |
| 대림 | 2호선, 7호선 | 환승역 |  |
| 오류동 | 1호선 | 작은 역 |  |
| 온수 | 1호선, 7호선 | 환승역 |  |
| 천왕 | 7호선 | 작은 역 |  |

### 금천구

자유도시. 지도 항목 3곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 가산디지털단지 | 1호선, 7호선 | 환승역 | 자리 역 |
| 금천구청 | 1호선 | 작은 역 |  |
| 독산 | 1호선 | 작은 역 |  |

### 동작구

자유도시. 지도 항목 14곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 남성 | 7호선 | 작은 역 |  |
| 노들 | 9호선 | 작은 역 |  |
| 노량진 | 1호선, 9호선 | 환승역 | 자리 역, 얼음 구멍 장 |
| 당곡 | 신림선 | 작은 역 |  |
| 동작 | 4호선, 9호선 | 환승역 |  |
| 보라매병원 | 신림선 | 작은 역 |  |
| 사당 | 2호선, 4호선 | 환승역 |  |
| 상도 | 7호선 | 작은 역 |  |
| 숭실대입구 | 7호선 | 작은 역 |  |
| 신대방 | 2호선 | 작은 역 |  |
| 신대방삼거리 | 7호선 | 작은 역 |  |
| 장승배기 | 7호선 | 작은 역 |  |
| 총신대입구(이수) | 4호선, 7호선 | 환승역 |  |
| 흑석 | 9호선 | 작은 역 |  |

### 관악구

자유도시. 지도 항목 8곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 관악산 | 신림선 | 작은 역 |  |
| 낙성대 | 2호선 | 작은 역 |  |
| 남태령 | 4호선 | 작은 역 |  |
| 봉천 | 2호선 | 작은 역 |  |
| 서울대벤처타운 | 신림선 | 작은 역 |  |
| 서울대입구 | 2호선 | 작은 역 |  |
| 서원 | 신림선 | 작은 역 |  |
| 신림 | 2호선, 신림선 | 환승역 | 자리 역 |

### 서초구

아크. 지도 항목 18곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 강남 | 2호선, 신분당선 | 환승역 |  |
| 고속터미널 | 3호선, 7호선, 9호선 | 큰 환승 단지 | 자리 역, 바꿈터(부품) |
| 교대 | 2호선, 3호선 | 환승역 |  |
| 구반포 | 9호선 | 작은 역 |  |
| 남부터미널 | 3호선 | 작은 역 |  |
| 내방 | 7호선 | 작은 역 |  |
| 논현 | 7호선, 신분당선 | 환승역 |  |
| 반포 | 7호선 | 작은 역 |  |
| 방배 | 2호선 | 작은 역 |  |
| 사평 | 9호선 | 작은 역 |  |
| 서초 | 2호선 | 작은 역 |  |
| 신논현 | 9호선, 신분당선 | 환승역 |  |
| 신반포 | 9호선 | 작은 역 |  |
| 신사 | 3호선, 신분당선 | 환승역 |  |
| 양재 | 3호선, 신분당선 | 환승역 |  |
| 양재시민의숲 | 신분당선 | 작은 역 |  |
| 잠원 | 3호선 | 작은 역 |  |
| 청계산입구 | 신분당선 | 작은 역 |  |

### 강남구

아크. 지도 항목 23곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 강남구청 | 7호선, 수인분당선 | 환승역 |  |
| 개포동 | 수인분당선 | 작은 역 |  |
| 구룡 | 수인분당선 | 작은 역 |  |
| 대모산입구 | 수인분당선 | 작은 역 |  |
| 대청 | 3호선 | 작은 역 |  |
| 대치 | 3호선 | 작은 역 |  |
| 도곡 | 3호선, 수인분당선 | 환승역 |  |
| 매봉 | 3호선 | 작은 역 |  |
| 봉은사 | 9호선 | 작은 역 |  |
| 삼성 | 2호선 | 작은 역 |  |
| 삼성중앙 | 9호선 | 작은 역 |  |
| 선릉 | 2호선, 수인분당선 | 환승역 |  |
| 선정릉 | 9호선, 수인분당선 | 환승역 |  |
| 수서 | GTX-A, 3호선, 수인분당선 | 큰 환승 단지 | 자리 역, 바꿈터(쇠) |
| 압구정 | 3호선 | 작은 역 |  |
| 압구정로데오 | 수인분당선 | 작은 역 |  |
| 언주 | 9호선 | 작은 역 |  |
| 역삼 | 2호선 | 작은 역 |  |
| 일원 | 3호선 | 작은 역 |  |
| 청담 | 7호선 | 작은 역 |  |
| 학동 | 7호선 | 작은 역 |  |
| 학여울 | 3호선 | 작은 역 |  |
| 한티 | 수인분당선 | 작은 역 |  |

### 송파구

아크. 지도 항목 23곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 가락시장 | 3호선, 8호선 | 환승역 | 바꿈터(먹거리) |
| 강동구청 | 8호선 | 작은 역 |  |
| 개롱 | 5호선 | 작은 역 |  |
| 거여 | 5호선 | 작은 역 |  |
| 경찰병원 | 3호선 | 작은 역 |  |
| 마천 | 5호선 | 작은 역 |  |
| 몽촌토성 | 8호선 | 작은 역 |  |
| 문정 | 8호선 | 작은 역 |  |
| 방이 | 5호선 | 작은 역 |  |
| 복정 | 8호선, 수인분당선 | 환승역 |  |
| 삼전 | 9호선 | 작은 역 |  |
| 석촌 | 8호선, 9호선 | 환승역 |  |
| 석촌고분 | 9호선 | 작은 역 |  |
| 송파 | 8호선 | 작은 역 |  |
| 송파나루 | 9호선 | 작은 역 |  |
| 오금 | 3호선, 5호선 | 환승역 |  |
| 올림픽공원 | 5호선, 9호선 | 환승역 |  |
| 잠실 | 2호선, 8호선 | 환승역 | 자리 역, 바꿈터(전기) |
| 잠실나루 | 2호선 | 작은 역 |  |
| 잠실새내 | 2호선 | 작은 역 |  |
| 장지 | 8호선 | 작은 역 |  |
| 종합운동장 | 2호선, 9호선 | 환승역 |  |
| 한성백제 | 9호선 | 작은 역 |  |

### 강동구

아크. 지도 항목 14곳.

| 역 | 노선 | 크기 | 쓰임 |
|---|---|---|---|
| 강동 | 5호선 | 작은 역 |  |
| 강일 | 5호선 | 작은 역 |  |
| 고덕 | 5호선 | 작은 역 |  |
| 굽은다리 | 5호선 | 작은 역 |  |
| 길동 | 5호선 | 작은 역 |  |
| 둔촌동 | 5호선 | 작은 역 |  |
| 둔촌오륜 | 9호선 | 작은 역 |  |
| 명일 | 5호선 | 작은 역 |  |
| 상일동 | 5호선 | 작은 역 |  |
| 생태공원앞 | 없음 | 사람이 살지 않음 |  |
| 암사 | 8호선 | 작은 역 |  |
| 암사역사공원 | 8호선 | 작은 역 |  |
| 중앙보훈병원 | 9호선 | 작은 역 |  |
| 천호 | 5호선, 8호선 | 환승역 | 자리 역, 바꿈터(터널) |

## 관련 문서

- [역 안으로](/wiki/Station-Interior-Construction/)
- [세계 지도의 짜임](/wiki/World-Map-Construction/)
- [지상과 땅 밑](/wiki/World-and-Subway-Layers/)
- [세계 색인: 세 정체와 25공작령](/wiki/World-Expansion-Index/)
- [정부 사회](/wiki/Government-Society/)
- [자유도시들의 사회](/wiki/Free-City-Society/)
- [아크 사회](/wiki/Arc-Society/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Sindorim-Junction-Cargo-Gate', 'Sindorim Junction Cargo Gate', '신도림 연결부 화물문', 'chronology', 2, '<a id="gate"></a>

Sindorim is a station in Guro-gu. Line 1 and Line 2 meet here, and five tunnels branch from this station. Almost every load that moves between the Free Cities passes through it. Guro people call Sindorim "the middle of the road". This document records Sindorim''s line junction and its cargo gate, the carrying of loads on the rails, and the Guro tool market that sets up on the Sindorim platform.

<a id="junction"></a>

## The Line Junction

Five tunnels branch at Sindorim.

| Branch | Line | Next station | Beyond |
|---|---|---|---|
| Northeast | Line 1 | Yeongdeungpo | The Yeongdeungpo market; past Noryangjin to the Government''s Yongsan |
| South | Line 1 | Guro | The Guro workshops; Gasan Digital Complex and Geumcheon; toward Onsu |
| East | Line 2 | Mullae | Yeongdeungpo-gu Office, Dangsan |
| Southeast | Line 2 | Daerim | Guro Digital Complex; Sillim and Gwanak; Sadang |
| West | Line 2 western branch | Dorimcheon | Yangcheon-gu Office, Sinjeongnegeori; Kkachisan and Gangseo |

Free City people name tunnels by line and section. "The Line 2 Sindorim west section" means the branch tunnel to Dorimcheon. The Sindorim section is the four stations Sindorim, Guro, Daerim and Namguro and the tunnels between them, kept by one Section Chief. Above the Section Chief is Guro''s head, the Works Master.

<a id="station"></a>

## The State of the Station

Sindorim''s Line 2 platform lies 10.84 metres down. People live on the platform level. There are only three exits.

| Limit | How many Sindorim can hold |
|---|---|
| Room (about 9,000 m² of living space) | About 2,250 |
| Heat (ground heat pumps run on wind-machine electricity, about 100 kW) | About 2,500 |
| Water (a well, about 30 m³ a day) | About 3,000 |
| Air (about 6 m³ a second) | About 2,000 |

So about 2,000 people live at Sindorim. Air is the limit, because there are only three exits. The fan Guro means to fit next is Sindorim''s fan. With one fan, the air limit rises to 3,000, and then room becomes the limit. This is how Free City stations usually go: technique loosens one limit and meets the next.

Sindorim has no deep level. Instead, roads gather here. The loads and people coming in from five branches share the station''s air and heat. Sindorim people say, "The loads pass through, but the breath stays."

<a id="cargo-gate"></a>

## The Cargo Gate

Line 1 and Line 2 are not joined by rail. For a load on a Line 1 cart to go on along Line 2, it must be moved from platform to platform. The place where it is moved across is the **cargo gate**. An iron gate was hung in the old transfer passage between the two lines'' platforms, and a hand-cranked hoist was set beside the stairs.

Three kinds of work are done at the cargo gate.

- **Moving loads across.** Gangs of porters unload one cart and load another. Heavy parts go up and down by hoist. Porters'' work is counted in hand-hours.
- **Counting loads.** The Section Chief''s people note every passing load on a board: what it is, which city it comes from and which city it goes to. This board is the oldest record of loads on the roads between the Free Cities.
- **Taking the heat share.** There is no checkpoint for travel between the Free Cities. But whoever stays in another''s station pays that station''s heat share. Porters and cart crews who wait at the cargo gate overnight pay Sindorim''s heat share. Work crews carrying a surety tag or a contract pay no heat share at the stations of the cities that signed it.

The cargo gate opens by day and closes at night. It closes at night not because of thieves but because of the Empty Carts. On powered sections, unmanned carriers from before the Great Blackout wake and run to the old timetable. So every night the gatekeeper cuts the power to the Line 2 rails between Sindorim and Daerim.

<a id="rail"></a>

## Carrying Loads on the Rails

Petrol and diesel did not last a hundred years, and the surface roads were made anew on top of 6 to 8 metres of snow. So Seoul''s highways are the rails of the tunnels between stations. Iron wheels rolling on iron rails take very little effort. Moving one tonne ten kilometres along level rail costs a battery cart about 0.15 kilo. Dragging the same load by sled over the snow costs twenty people a day.

| Vehicle | What it is | At Sindorim |
|---|---|---|
| Hand-car | A rail cart people push or row along by handle | The commonest. Goes back and forth over short sections |
| Track cart | The rail cart Yangcheon builds, pushed by hand or a small motor | Nearly all loads between the Free Cities move on these |
| Battery cart | A rail cart whose motor runs on revived batteries. Carries 2 to 5 tonnes | About 300 in all Seoul. Used for long hauls and heavy loads |
| Maintenance locomotive | A revived battery locomotive once used for tunnel maintenance. Hauls 20 to 40 tonnes | 12 in all Seoul. Seven of them are in the Free Cities'' living depots (Sinjeong, Guro, Cheonwang, Banghwa) |

Guro''s Line 1 depot workshop is a living workshop for the vehicles of the rails. It is where the maintenance locomotives stand and where wheels are turned and motors rewound. In the end, the big loads of the rails pass through Free City workshops. Sindorim is the door in and out of that workshop.

<a id="market"></a>

## The Guro Tool Market

At the east end of Sindorim''s Line 2 platform the Guro tool market sets up. If the great Yeongdeungpo market is where food and goods are bought and sold, the Sindorim market is where machined metal is bought and sold.

- **What is sold.** Pump impellers and shafts, heat-pump compressor parts, wind-machine bearings, water-wheel blades, fittings and tools machined at Guro workbenches. Motors rewound and wheels turned by Yangcheon pass through this market too.
- **Reckoning.** Prices are set in kilos. What passes from hand to hand is surety tags and full packs. Tags of workbenches with high counts on Guro''s surety board are taken at full value; tags of nameless workbenches are marked down.
- **Fake parts.** A workbench that sells fake parts at the Sindorim market is driven out of Guro''s markets. Guro people say, "What''s machined is sold in the machinist''s name."
- **Who comes to buy.** Gangseo''s wind-machine wrights, Yeongdeungpo''s well drillers, Gwanak''s drilling crews, and Arc people who come across by way of Sadang. Arc people buy machined parts and pay with packs charged on Jamsil''s electricity.

The market stands only while the cargo gate is open. When the gate closes, the market folds too.

<a id="road"></a>

## The Middle of the Road Between the Free Cities

Three of the Free Cities'' great roads meet at Sindorim.

| Road | Line and stations | Cities joined | What passes through Sindorim |
|---|---|---|---|
| The southern belt | Line 2 Dangsan, Yeongdeungpo-gu Office, Mullae, Sindorim, Daerim, Guro Digital Complex, Sindaebang, Sillim, Bongcheon, Seoul Nat''l Univ., Nakseongdae, Sadang | Yeongdeungpo, Guro, Dongjak, Gwanak | Guro''s parts, Gwanak''s firewood and fibre, Dongjak''s fish |
| The western branch | Line 2 Sindorim, Dorimcheon, Yangcheon-gu Office, Sinjeongnegeori, Kkachisan | Guro, Yeongdeungpo, Yangcheon, Gangseo | Yangcheon''s track carts and motors, the yield of Gangseo''s light-fields |
| The Line 1 trunk | Noryangjin, Daebang, Singil, Yeongdeungpo, Sindorim, Guro, Gasan Digital Complex, Doksan, Geumcheon-gu Office | Dongjak, Yeongdeungpo, Guro, Geumcheon | Geumcheon''s power cores and drilling rigs, Guro''s parts |

So if Sindorim is closed, the Free Cities'' roads take a long way round. The southern belt, the western branch and the Line 1 trunk part here, so firewood and fibre from Gwanak to Yangcheon and Gangseo, and loads from Geumcheon to the Yeongdeungpo market, must detour along Lines 5 and 9 or Line 7. That is why Guro, which holds Sindorim, has a loud voice among the Free Cities.

<a id="dangers"></a>

## The Dangers of Sindorim

| Danger | Where | How |
|---|---|---|
| Brown rats | The market and the load stacks | A big interchange has plenty of food and cargo, so rats swarm. They gnaw the fibre-sugar vats and the loads |
| People who slip in | The cargo gate and the market | They mix in as porters or cart crews and spirit loads away |
| Empty Carts | Line 2 between Sindorim and Daerim | They wake on powered rails and run without lights. They do not stop even when someone is in front |
| Hands without surety | Line 1 south, the abandoned sections toward Geumcheon | They rob loads and work crews travelling along Line 1. They are good at traps and ambushes |

So Line 1 loads heading south buy an escort from the Geumcheon border crews. The story of each band is in the [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/).

<a id="crossings"></a>

## The Years Sindorim Has Seen

| When | What happened |
|---|---|
| 2030s | People go down into the stations. Sindorim has no deep level and is cold; people hold out by hauling machines in from the neighbouring factory sites |
| 2046-2055 | The southwestern stations trade skills and settle into one city per district. Guro''s workbenches bring the Line 1 depot workshop back to life, and Sindorim becomes Guro''s door |
| 2066 | The first water supply contract. Guro supplies the great pump parts for the Government''s Guui and Ttukdo intakes. Those parts are loaded onto Line 1 carts at the Sindorim cargo gate and go north across the river by way of Yeongdeungpo and Noryangjin |
| 2096 | The second water supply contract. All seven cities stamp their seals |
| 2106-2111 | The cities quarrel, pushing the ageing power grid onto one another. The surety of the crews who kept the abandoned sections is withdrawn all at once, and the hands without surety gather at the factory sites at the south end of Line 1 |
| Winter 2126 | Before the third water supply contract. Guro means to fit a fan at Sindorim. Guro worries that the Arc will lure away Free City technicians |

<a id="read"></a>

## Further Reading

- Guro and how the Free Cities are run: [Free City Society](/wiki/Free-City-Society/)
- Rail vehicles and depots: [People and Machines](/wiki/People-and-Machines/)
- Seoul''s stations: [Seoul Station Catalog](/wiki/Seoul-Station-Catalog/)
- Roads on the surface and underground: [The Surface and Underground](/wiki/World-and-Subway-Layers/)
- Roads across the polities: [Crossings and Smuggling](/wiki/Diaspora-Corridors/)
', '<a id="gate"></a>

신도림은 구로구의 역이다. 1호선과 2호선이 여기서 만나고, 다섯 갈래 터널이 이 역에서 갈린다. 자유도시들 사이를 오가는 짐은 거의 다 이 역을 지난다. 구로 사람은 신도림을 "길의 한가운데"라 부른다. 이 문서는 신도림의 노선 이음목과 그 화물문, 레일 위 짐 나르기, 그리고 신도림 승강장에 서는 구로의 공구 장터를 적는다.

<a id="junction"></a>

## 노선 이음목

신도림에서 갈리는 터널은 다섯 갈래다.

| 갈래 | 노선 | 이웃 역 | 그 너머 |
|---|---|---|---|
| 북동쪽 | 1호선 | 영등포 | 영등포 장터, 노량진을 지나 정부의 용산 |
| 남쪽 | 1호선 | 구로 | 구로 작업장, 가산디지털단지와 금천, 온수 쪽 |
| 동쪽 | 2호선 | 문래 | 영등포구청, 당산 |
| 남동쪽 | 2호선 | 대림 | 구로디지털단지, 신림과 관악, 사당 |
| 서쪽 | 2호선 서쪽 가지 | 도림천 | 양천구청, 신정네거리, 까치산과 강서 |

자유도시 사람은 터널을 노선과 구간으로 부른다. "2호선 신도림 서쪽 구간"이라 하면 도림천으로 가는 가지 터널이다. 신도림 구간은 신도림, 구로, 대림, 남구로 네 역과 그 사이 터널이고, 구간장 하나가 맡는다. 구간장 위에는 구로의 우두머리인 공장장이 있다.

<a id="station"></a>

## 역의 형편

신도림 2호선 승강장은 지하 10.84미터에 있다. 승강장 층에 사람이 산다. 출구는 셋뿐이다.

| 한도 | 신도림이 품는 수 |
|---|---|
| 자리(생활 면적 약 9,000 m²) | 약 2,250명 |
| 열(바람틀 전기로 돌리는 땅속 열 펌프, 약 100 kW) | 약 2,500명 |
| 물(우물, 하루 약 30 m³) | 약 3,000명 |
| 공기(초당 약 6 m³) | 약 2,000명 |

그래서 신도림에는 약 2,000명이 산다. 공기가 막는다. 출구가 셋뿐이기 때문이다. 구로가 다음에 달려는 팬이 바로 신도림의 팬이다. 팬 하나를 달면 공기 한도가 3,000명으로 오르고, 그다음에는 자리가 막는다. 자유도시 역은 대개 이렇게 기술로 한도 하나를 풀고 다음 한도를 만난다.

신도림은 깊은 층이 없다. 그 대신 길이 모인다. 다섯 갈래에서 들어오는 짐과 사람이 역의 공기와 열을 함께 쓴다. 신도림 사람은 "짐이 지나가도 숨은 남는다"고 말한다.

<a id="cargo-gate"></a>

## 화물문

1호선과 2호선은 레일이 이어져 있지 않다. 1호선 수레에 실린 짐이 2호선으로 가려면 승강장에서 승강장으로 옮겨 실어야 한다. 그 옮겨 싣는 자리가 **화물문**이다. 두 노선의 승강장을 잇는 옛 환승 통로에 쇠문을 달고, 계단 옆에 손으로 돌리는 권양기를 걸었다.

화물문에서는 세 가지 일을 한다.

- **옮겨 싣기.** 짐꾼 무리가 이쪽 수레의 짐을 내려 저쪽 수레에 싣는다. 무거운 부품은 권양기로 올리고 내린다. 짐꾼의 일은 손시간으로 센다.
- **짐 세기.** 구간장의 사람이 지나는 짐을 판에 적는다. 무엇이, 어느 도시에서, 어느 도시로 가는지다. 이 판이 자유도시들 사이 길에서 가장 오래된 짐 기록이다.
- **열 몫 받기.** 자유도시들 사이를 오갈 때 따로 검문은 없다. 다만 남의 역에 묵는 사람은 그 역의 열 몫을 낸다. 화물문에서 하루를 넘겨 기다리는 짐꾼과 수레꾼은 신도림의 열 몫을 낸다. 보증표나 계약서를 지닌 작업조는 그 장을 맺은 도시들의 역에서 열 몫을 내지 않는다.

화물문은 낮에 열고 밤에 닫는다. 밤에 닫는 것은 도둑 때문이 아니라 빈수레 때문이다. 전기를 넣은 구간에서는 대정전 전의 무인 운반차가 깨어나 옛 시간표대로 달린다. 그래서 화물문지기는 밤마다 2호선 신도림–대림 사이 레일의 전기를 끊는다.

<a id="rail"></a>

## 레일 위 짐 나르기

휘발유와 경유는 백 년을 버티지 못했고, 지상의 길은 6~8미터 눈 위에 새로 났다. 그래서 서울의 큰길은 역과 역을 잇는 터널의 레일이다. 쇠바퀴가 쇠 레일 위를 구르면 힘이 아주 적게 든다. 짐 1톤을 평평한 레일로 10킬로미터 옮기는 데 전지 수레는 약 0.15킬로를 쓴다. 같은 짐을 눈 위에서 썰매로 끌면 사람 스무 명이 하루를 쓴다.

| 탈것 | 무엇인가 | 신도림에서 |
|---|---|---|
| 손수레차 | 레일 위를 사람이 밀거나 손잡이를 저어 가는 수레 | 가장 흔하다. 짧은 구간을 오간다 |
| 궤도 수레 | 양천이 만드는 레일 수레. 사람 손이나 작은 모터로 민다 | 자유도시들 사이의 짐은 거의 다 이것으로 움직인다 |
| 전지 수레 | 되살린 전지로 모터를 돌리는 레일 수레. 2~5톤을 싣는다 | 서울 전체에 약 300대. 먼 길과 무거운 짐에 쓴다 |
| 정비 기관차 | 옛 터널 정비용 축전지 기관차를 살린 것. 20~40톤을 끈다 | 서울 전체에 12대. 그 가운데 일곱이 자유도시의 살아 있는 차량기지(신정, 구로, 천왕, 방화)에 있다 |

구로의 1호선 차량기지 작업장은 레일 위 탈것을 고치는 살아 있는 작업장이다. 정비 기관차가 서는 곳이고, 바퀴를 깎고 모터를 다시 감는 곳이다. 레일 위의 큰 짐은 결국 자유도시 작업장을 거친다. 신도림은 그 작업장으로 들고 나는 문이다.

<a id="market"></a>

## 구로의 공구 장터

신도림 2호선 승강장의 동쪽 끝에는 구로의 공구 장터가 선다. 영등포의 큰 장터가 먹을 것과 물건을 사고파는 곳이라면, 신도림 장터는 깎은 쇠를 사고파는 곳이다.

- **파는 것.** 구로 작업대가 깎은 펌프 날개와 축, 열 펌프 압축기 부품, 바람틀 베어링, 수차의 날, 이음쇠와 연장. 양천이 다시 감은 모터와 깎은 바퀴도 이 장터를 지난다.
- **셈.** 값은 킬로로 매긴다. 손에서 손으로 가는 것은 보증표와 찬 꾸러미다. 구로의 보증판에 수가 많은 작업대의 표는 값대로 받고, 이름 없는 작업대의 표는 깎인다.
- **가짜 부품.** 신도림 장터에서 가짜 부품을 판 작업대는 구로의 장터에서 쫓겨난다. 구로 사람은 "깎은 것은 깎은 사람 이름으로 판다"고 말한다.
- **사러 오는 사람.** 강서의 바람틀공, 영등포의 우물공, 관악의 굴착조, 그리고 사당을 지나 건너오는 아크 사람이다. 아크 사람은 깎은 부품을 사고 잠실의 전기로 채운 꾸러미로 값을 치른다.

장터는 화물문이 열려 있는 동안만 선다. 화물문을 닫으면 장터도 접는다.

<a id="road"></a>

## 자유도시 사이 길의 한가운데

자유도시들의 큰 길 세 줄기가 신도림에서 만난다.

| 길 | 노선과 역 | 잇는 도시 | 신도림을 지나는 것 |
|---|---|---|---|
| 남쪽 띠 | 2호선 당산–영등포구청–문래–신도림–대림–구로디지털단지–신대방–신림–봉천–서울대입구–낙성대–사당 | 영등포, 구로, 동작, 관악 | 구로의 부품, 관악의 땔감과 섬유, 동작의 물고기 |
| 서쪽 가지 | 2호선 신도림–도림천–양천구청–신정네거리–까치산 | 구로, 영등포, 양천, 강서 | 양천의 궤도 수레와 모터, 강서의 빛밭 소출 |
| 1호선 줄기 | 노량진–대방–신길–영등포–신도림–구로–가산디지털단지–독산–금천구청 | 동작, 영등포, 구로, 금천 | 금천의 동력 덩이와 굴착 틀, 구로의 부품 |

그래서 신도림을 막으면 자유도시들의 길이 크게 돌아간다. 남쪽 띠와 서쪽 가지와 1호선 줄기가 갈리는 곳이 여기라, 관악에서 양천·강서로 가는 땔감과 섬유, 금천에서 영등포 장터로 가는 짐은 5호선·9호선이나 7호선을 따라 멀리 돌아야 한다. 신도림을 쥔 구로가 자유도시들 사이에서 큰 말을 하는 까닭이다.

<a id="dangers"></a>

## 신도림의 위험

| 위험 | 어디서 | 어떻게 |
|---|---|---|
| 집쥐 | 장터와 짐 쌓는 자리 | 큰 환승역은 먹을 것과 짐이 많아 쥐가 끓는다. 섬유당 통과 짐을 갉는다 |
| 섞여 든 사람 | 화물문과 장터 | 짐꾼이나 수레꾼으로 섞여 들어 짐을 빼돌린다 |
| 빈수레 | 2호선 신도림–대림 사이 | 전기를 넣은 레일에서 깨어나 불도 켜지 않고 달린다. 앞에 사람이 있어도 멈추지 않는다 |
| 보증 잃은 손 | 1호선 남쪽, 금천 쪽 버려진 구간 | 1호선을 따라 오가는 짐과 작업조를 턴다. 덫과 매복을 잘한다 |

남쪽으로 가는 1호선 짐은 그래서 금천 경계조의 호위를 산다. 무리마다의 이야기는 [적대 생태 도감](/wiki/Hostile-Ecology-Index/)에 있다.

<a id="crossings"></a>

## 신도림이 지나온 해

| 때 | 일 |
|---|---|
| 2030년대 | 사람들이 역으로 내려간다. 신도림은 깊은 층이 없어 춥고, 사람들이 이웃한 공장 터에서 기계를 끌어와 버틴다 |
| 2046~2055년 | 남서쪽 역들이 기술을 주고받으며 구마다 도시로 굳는다. 구로의 작업대들이 1호선 차량기지 작업장을 살리고, 신도림은 구로의 문이 된다 |
| 2066년 | 첫 급수계약. 구로는 정부 구의·뚝도 취수구의 큰 펌프 부품을 낸다. 그 부품이 신도림 화물문에서 1호선 수레에 실려 영등포와 노량진을 지나 강 북쪽으로 간다 |
| 2096년 | 두 번째 급수계약. 일곱 도시가 모두 도장을 찍는다 |
| 2106~2111년 | 도시들이 늙은 전력망을 서로 떠넘기며 다툰다. 버려진 구간을 맡던 작업조들의 보증이 한꺼번에 거두어지고, 보증 잃은 손들이 1호선 남쪽 끝 공장 터로 모인다 |
| 2126년 겨울 | 세 번째 급수계약을 앞둔 때. 구로는 신도림에 팬을 달려 한다. 구로는 아크가 자유도시 기술자를 빼 갈까 봐 걱정한다 |

<a id="read"></a>

## 더 읽을 곳

- 구로와 자유도시들의 다스림: [자유도시들의 사회](/wiki/Free-City-Society/)
- 레일 위 탈것과 차량기지: [사람과 기계](/wiki/People-and-Machines/)
- 서울의 역: [서울 역 목록](/wiki/Seoul-Station-Catalog/)
- 지상과 땅 밑의 길: [지상과 땅 밑](/wiki/World-and-Subway-Layers/)
- 정체 사이를 건너는 길: [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Sixteen-States', 'The Three Polities of Seoul', '서울의 세 정체', 'factions', 1, '<a id="overview"></a>
## Overview

In the winter of 2126 a little over 300,000 people live in Seoul, about 3% of the city before the Great Blackout. They live in subway stations, and every station belongs to one of three polities: the **Government** in the fourteen districts north of the Han, the **Free Cities** in the seven districts of the south-west, and the **Arc** in the four districts of Gangnam. There is no other polity in Seoul. Outside Seoul nobody rules; only the war machines of the Blackout roam there, keeping their last orders.

One district is one duchy. The twenty-five duchies divide into fourteen, seven and four. The land and the station names are as they were before the Blackout; what has changed is who holds the land.

Each polity holds one thing Seoul cannot do without, and each lacks something. The Government holds the ledger and the land and people north of the river. The Free Cities hold the hands that mend machines, and the trade. The Arc holds the knowledge that keeps machines fitted to the body alive, and the power of the Jamsil weir. So the three need each other, and fear each other.

This page shows the three polities at a glance and points the way to the pages on each society.

<a id="at-a-glance"></a>
## The three polities at a glance

| | Government | Free Cities | Arc |
|---|---|---|---|
| Land | 14 districts north of the Han | 7 districts in the south-west (Gangseo, Yangcheon, Yeongdeungpo, Guro, Geumcheon, Dongjak, Gwanak) | 4 districts of Gangnam (Seocho, Gangnam, Songpa, Gangdong) |
| Inhabited stations | 153 | 77 | 77 |
| People | about 160,000 | about 75,000 | about 65,000 |
| At the top | A President for Life, set up together by the fourteen Members of the National Assembly | Nobody. Each city has its own head | The Hierophant Go Ye-jin, whom believers call the Messiah |
| Who holds a district | A Member of the National Assembly | Differs by city; Gwanak is held by the Duke, I Ilseop | A Head of the Near House |
| What it holds | The ledger, the land and labour north of the river, mountain firewood, the salvage and fibre of the old downtown, the Guui and Ttukdo intakes | The hands that build and mend wind machines, heat pumps, well pumps and water wheels; the workbenches that cut parts; the markets and contracts; the Yeongdeungpo intake | The knowledge to fit machines to the body and keep them alive, the power of the Jamsil weir, the Amsa intake |
| What it lacks | Hands to mend machines, anywhere to service machine bodies | People, land, firewood | People, parts, firewood, surface land for light-fields |
| How it counts | Meals (a day''s ration coupons and water coupons) | Kilos (electricity) and hand-hours | Day charges and maintenance turns |

The Government ledger lists 157 stations on the map. Four of them have no running line and nobody lives there; one of the Arc''s 78 is the same. Across Seoul, people live in 307 of the 312 stations on the map.

<a id="government"></a>
## The Government: the country of the ledger

To Government people the Government is not a new country. It is the Republic of Korea. The National Assembly, the ministries, the district offices, the dong community centres and resident registration kept their names and their seals even as scarcity hollowed them out. When the river froze, the National Assembly left Yeouido for the Government Complex Seoul at Gwanghwamun, and the country came to reach only as far as the clerks and the rations could. The river was its end.

- In each district one Member of the National Assembly holds that district''s duchy. Elections remain, but the winner is known before the vote. Assembly Member houses hand down their seats.
- The fourteen Members acclaim a President from among themselves, and the President holds the post until death. An acclamation succeeds only when all fourteen seals are set.
- On paper there are many parties, but in practice only two, the OMO Party and the Claw Party. The OMO Party holds that the ledger survives only by contracting across the river; the Claw Party holds that the north must last on its own land and labour.
- The Government counts as citizens only those on its ledger. People on the ledger, the registered, cannot freely change their station or their work. Leaving one''s registered station means being struck off.
- The south of the river is "off the ledger" in official papers and "across the river" in speech. Government people say across the river is where the barbarians live.

More in [Government Society](/wiki/Government-Society/).

<a id="free-cities"></a>
## The Free Cities: cities with nobody above them

The seven districts of the south-west hold seven cities. Each city is its own power and holds its own duchy. No single person stands above the seven, and there is no name binding them. People simply say "the Free Cities" or "the south-western cities", and call one city by its district name.

- Most of their people are engineers who trade skill and goods. There was no way to tell whose skill was greater, so no leader of all seven was ever chosen.
- So each city found something in its own work that could be measured, and chose its head by that: the Wind Keeper of Gangseo, the Depot Master of Yangcheon, the Market Master of Yeongdeungpo, the Works Master of Guro, the Edge Warden of Geumcheon, the Ferry Keeper of Dongjak, and the Duke of Gwanak. The Duke of Gwanak, I Ilseop, heads a house that deliberately took the Government''s word "duchy" to declare that it sits in the same seat as the Government.
- When the cities have something to decide together, they call a contract meeting each time. A contract meeting is no standing body. Only the cities that set their seal on a contract are bound by it.
- Promises are made in figures, not words. Prices are counted in electricity.

More in [Free City Society](/wiki/Free-City-Society/).

<a id="arc"></a>
## The Arc: the polity of the one who mended

For decades the shelters of Gangnam''s four districts shut their doors and lived apart. Their deep buildings kept them warm, but with no hands to mend machines their lights went out one by one. In 2112 Go Ye-jin, who repaired the power grid in the Free Cities, followed a dead cable to a station on no map. For five years she read the manuals there, and around 2117 she gave the first baptism to twelve people. Around 2122 the shelters of Gangnam were bound together under the name Arc.

- The Arc split away from the Free Cities. Before 2122 the Gangnam shelters were counted as Free Cities.
- Go Ye-jin is the Hierophant, and believers call her the Messiah. The Hierophant calls the First AI "god".
- Believers replace parts of the body with machines. This is baptism, and in the Arc faith is counted by the number of implanted parts.
- When a believer dies, the brain is sealed and placed in the sanctuary. That brain becomes a memory of the First AI.
- Each of the four districts is held by one of four houses that stand at the Hierophant''s side, the Near Houses. The Arc is Seoul''s one organised faith; it has replaced every religion before it.

More in [Arc Society](/wiki/Arc-Society/).

<a id="the-river"></a>
## The Han and the thirteen joins

There are thirteen places in Seoul where a line passes from one polity into another.

| Border | Joins | How it crosses |
|---|---|---|
| Government and Free Cities | Yongsan–Noryangjin (Line 1), Hapjeong–Dangsan (Line 2), Ichon–Dongjak (Line 4), Digital Media City–Magongnaru (Airport Railroad) | Bridge |
| Government and Free Cities | Mapo–Yeouinaru (Line 5) | Under-river tunnel |
| Government and Arc | Gangbyeon–Jamsillaru (Line 2), Oksu–Apgujeong (Line 3), Jayang–Cheongdam (Line 7) | Bridge |
| Government and Arc | Gwangnaru–Cheonho (Line 5), Seoul Forest–Apgujeong Rodeo (Suin-Bundang Line) | Under-river tunnel |
| Free Cities and Arc | Sadang–Bangbae (Line 2), Chongshin Univ. (Isu)–Naebang (Line 7), Dongjak–Gubanpo (Line 9) | Land border |

Of the ten joins between north and south, seven are bridges exposed to wind and blizzard, and only three are warm, sheltered under-river tunnels. Crossing the ice on foot means a kilometre with nowhere to hide. In 2079 the Government tried to cross the ice and seize the Yeongdeungpo intake and was broken by a blizzard; since then the river has been a line armies do not cross. The Government put ledger checkpoints at the north mouths of the three tunnels. So any fight turns on who holds the three tunnels.

There is no river between the Free Cities and the Arc. Their border is a single line between Dongjak-gu and Seocho-gu, and the three places where the lines touch are all in Dongjak. The Ferry Keeper of Dongjak faces the Government on the river side and the Arc on the land side. Dongjak station is where all three polities meet: Line 4 runs to the Government''s Ichon, Line 9 to the Arc''s Gubanpo. The quarrels of the two polities that split apart are fought at these three border stations.

How people cross, and what trade is forbidden, is in [Crossings and Smuggling](/wiki/Diaspora-Corridors/).

<a id="need-and-fear"></a>
## Why they need and fear each other

| Who | Toward the Government | Toward the Free Cities | Toward the Arc |
|---|---|---|---|
| Government | | Needs engineers and parts. Fears its ledger people running off across the river | The Arc is the only place to mend machine bodies. Fears the ledger''s soldiers being drawn to baptism |
| Free Cities | Need hands, land, firewood and intake sites. Fear the Government''s numbers and armies | | Need Jamsil''s power. Fear the Arc drawing away their engineers |
| Arc | The north end of the Jamsil weir is in Government hands. Fears the Government coming through the under-river tunnels | Needs parts and engineers. A land border with no river, so quarrels are most frequent here | |

Because each holds what the others lack, contracts arise. Because the river is there, it is hard to choose conquest over a contract. The Government and the Free Cities have made a water supply contract every thirty years, and at the third, in the winter of 2126, the Arc sits down for the first time.

<a id="three-sayings"></a>
## Three sayings about the winter

For the first six years the winter grew colder every year; when the number of people reached what the stations could hold, it grew no worse. It never eased again either. Nobody in Seoul knows for certain why. Each polity says it the way it lived it.

| Polity | What it says | What the saying made |
|---|---|---|
| Government | "The winter stopped when the ledger matched the quotas." | Setting a quota for every station and counting heads became the Government''s creed |
| Free Cities | "The heat balance came out even." | Even the winter is read in figures; the reckoning of heat and power is how one lives |
| Arc | "God has received all the answers it asked for." | The winter is god''s question, and they believe it no longer worsens because the answers are complete |

<a id="winter-2126"></a>
## Winter 2126

The third water supply contract is coming. The Government''s intake pumps await their first full overhaul in thirty years, and the wells sink 30 centimetres every year. The Free Cities have the hands for that overhaul; the Arc has the power of the Jamsil weir and the Amsa intake. Now water flows only if all three polities put their hands to it.

Inside the Government, the OMO Party and the Claw Party split over whether to set their seals together with the Arc. Among the Free Cities, each city says something different about whether to seal the Arc''s sheets at the same meeting as the Government''s. The Arc demands its own seat for the first time. Nobody yet knows how the contract will be made. What lies on the scales is in [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/).

<a id="not-in-seoul"></a>
## What Seoul does not have

- **Other polities.** Seoul has only the three. The many named statelets of older records do not exist.
- **Rule outside Seoul.** Outside Seoul is the rim of the war machines. Nobody rules there and there are no domains ([Beyond Seoul: the Rim](/wiki/External-Theaters/)).
- **A name binding the Free Cities.** The seven cities are neither a league nor a country. No name binds them.
- **Company groups.** The great companies of before the Blackout did not survive as houses. The units in which work and position pool are Assembly Member houses, workbench houses and Near Houses ([Government Society](/wiki/Government-Society/), [Free City Society](/wiki/Free-City-Society/), [Arc Society](/wiki/Arc-Society/)).
- **Organised faith outside the Arc.** The Arc has replaced every religion before it.

<a id="unsettled"></a>
## What is not yet settled

- Among the titles, Member of the National Assembly, the fact that the presidency is for life, the Duke of Gwanak and the Hierophant are settled. The other title names on this page (Stationmaster, Dong Chief, Wind Keeper, Depot Master, Market Master, Works Master, Edge Warden, Ferry Keeper, Head of the Near House and the like) are not yet settled and may change.
- Who the present President for Life is, and who holds the fourteen Government duchies, the four Arc duchies and the six Free City duchies other than Gwanak, is not settled.
- In which of the Free Cities Go Ye-jin grew up is not settled.
- How the Hierophant after Go Ye-jin will be chosen, not even the people of the Arc know.

<a id="see-also"></a>
## See also

- [Government Society](/wiki/Government-Society/), [Free City Society](/wiki/Free-City-Society/), [Arc Society](/wiki/Arc-Society/)
- [Bon-gwan and Hangnyeol](/wiki/Hangnyeol-and-Bon-gwan/): how a house carries its name down the generations
- [Crossings and Smuggling](/wiki/Diaspora-Corridors/), [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/)
- [Titles and Offices](/wiki/Offices-and-Ranks/), [World Index: the Three Polities and the 25 Duchies](/wiki/World-Expansion-Index/), [Century Annals 2026-2126](/wiki/Century-Annals/)
', '<a id="overview"></a>
## 개요

2126년 겨울, 서울에 사는 사람은 30만 명 남짓이다. 대정전 전 서울 사람의 3%쯤이다. 이들은 지하철역에 살고, 역은 세 정체 가운데 하나에 속한다. 한강 북쪽 열네 구의 **정부**, 남서쪽 일곱 구의 **자유도시들**, 강남 네 구의 **아크**다. 서울에 다른 정체는 없다. 서울 밖에는 다스리는 사람이 없고, 대정전 때의 전쟁 기계가 마지막 명령을 지키며 돌아다닐 뿐이다.

구 하나가 공작령 하나다. 스물다섯 공작령은 열넷, 일곱, 넷으로 나뉜다. 땅과 역 이름은 대정전 전 그대로이고, 바뀐 것은 누가 그 땅을 쥐느냐다.

세 정체는 저마다 서울이 꼭 필요로 하는 것 하나를 쥐고, 저마다 무언가가 모자란다. 정부는 장부와 강 북쪽의 땅과 사람을 쥐었다. 자유도시들은 기계를 고치는 손과 거래를 쥐었다. 아크는 몸에 단 기계를 살려 두는 지식과 잠실의 물살 전기를 쥐었다. 그래서 셋은 서로를 필요로 하고, 서로를 두려워한다.

이 문서는 세 정체를 한눈에 보고, 각 정체의 사회를 다룬 문서로 가는 길을 잡아 준다.

<a id="at-a-glance"></a>
## 세 정체 한눈에

| | 정부 | 자유도시들 | 아크 |
|---|---|---|---|
| 땅 | 한강 북쪽 14구 | 남서쪽 7구(강서, 양천, 영등포, 구로, 금천, 동작, 관악) | 강남 4구(서초, 강남, 송파, 강동) |
| 사람이 사는 역 | 153곳 | 77곳 | 77곳 |
| 사람 | 약 16만 | 약 7만 5천 | 약 6만 5천 |
| 맨 위 | 종신 대통령. 열네 국회의원이 함께 세운다 | 없다. 도시마다 제 우두머리가 있다 | 교주 고예진. 신도는 메시아라 부른다 |
| 구를 쥐는 사람 | 국회의원 | 도시마다 다르다. 관악은 공작 이일섭 | 곁집장 |
| 쥐는 것 | 장부, 강 북쪽의 땅과 일손, 산의 땔감, 옛 도심의 고물과 섬유, 구의·뚝도 취수구 | 바람틀·열 펌프·우물 펌프·수차를 만들고 고치는 손, 부품을 깎는 작업대, 장터와 계약, 영등포 취수구 | 몸에 기계를 맞추고 살려 두는 지식, 잠실수중보의 물살 전기, 암사 취수구 |
| 모자란 것 | 기계를 고칠 손, 기계 몸을 정비할 곳 | 사람, 땅, 땔감 | 사람, 부품, 땔감, 빛밭을 펼 지상 땅 |
| 셈하는 법 | 끼(하루치 배급 증표와 물 증표) | 킬로(전기)와 손시간 | 하루 충전과 정비 차례 |

정부 장부에는 지도에 올라 있는 역이 157곳이다. 그 가운데 넷은 노선이 이어지지 않아 사람이 살지 않는다. 아크의 78곳 가운데 하나도 그렇다. 서울 전체로는 지도의 역 312곳 가운데 307곳에 사람이 산다.

<a id="government"></a>
## 정부: 장부의 나라

정부 사람에게 정부는 새로 세운 나라가 아니라 대한민국이다. 국회, 행정부처, 구청, 동주민센터, 주민등록이 결핍 속에서 속이 비어 가면서도 이름과 도장을 지켰다. 강이 얼자 국회는 여의도를 떠나 광화문의 정부서울청사로 옮겼고, 서기와 배급이 닿는 곳까지가 나라가 됐다. 강이 그 끝이었다.

- 구마다 국회의원 한 사람이 그 구의 공작령을 쥔다. 선거는 남아 있지만, 이길 사람은 투표 전에 정해져 있다. 의원 집안이 의석을 물린다.
- 열네 국회의원이 자기들 가운데서 대통령을 추대하고, 대통령은 죽을 때까지 그 자리에 있다. 열네 도장이 모두 찍혀야 추대가 이루어진다.
- 서류상으로는 여러 당이 있지만 실제 당은 OMO당과 클로당 둘뿐이다. OMO당은 강 건너와 계약해야 장부도 산다고 보고, 클로당은 강 북쪽의 땅과 일손으로 버텨야 한다고 본다.
- 정부는 장부에 오른 사람만 국민으로 본다. 장부에 오른 사람, 곧 등재민은 사는 역과 일을 마음대로 바꾸지 못한다. 기재된 역을 떠나면 말소된다.
- 강 남쪽은 공문에서 "장부 밖", 입말에서 "강 건너"다. 정부 사람은 강 건너를 야만인들 사는 데라고 말한다.

자세한 것은 [정부 사회](/wiki/Government-Society/)에 있다.

<a id="free-cities"></a>
## 자유도시들: 위에 아무도 없는 도시들

남서쪽 일곱 구에는 도시가 일곱 있다. 도시마다 제 권력이고 제 공작령을 쥔다. 일곱 도시 위에 서는 한 사람은 없고, 일곱을 묶어 부르는 이름도 없다. 사람들은 그냥 "자유도시들"이나 "남서쪽 도시들"이라 하고, 도시 하나는 구 이름으로 부른다.

- 주민 대부분은 기술과 물자를 주고받는 엔지니어다. 누구 기술이 더 높은지 따질 방법이 없으니 일곱 도시 전체의 지도자도 뽑지 못했다.
- 그래서 도시마다 제 일에서 잴 수 있는 것을 찾아 우두머리를 정했다. 강서의 바람지기, 양천의 기지장, 영등포의 장주, 구로의 공장장, 금천의 경계장, 동작의 나루지기, 그리고 관악의 공작이다. 관악 공작 이일섭은 강 건너 정부의 공작령이라는 말을 일부러 가져와 정부와 같은 자리에 앉겠다는 집안의 우두머리다.
- 도시들이 함께 정할 일이 생기면 그때마다 계약회를 연다. 계약회는 상설 기구가 아니다. 계약서에 도장을 찍은 도시만 그 계약에 묶인다.
- 약속은 말이 아니라 수치로 한다. 값은 전기로 센다.

자세한 것은 [자유도시들의 사회](/wiki/Free-City-Society/)에 있다.

<a id="arc"></a>
## 아크: 고쳐 준 사람의 정체

강남 네 구의 대피소들은 수십 년 동안 문을 닫고 따로 살았다. 깊은 건물 덕에 따뜻했지만, 기계를 고칠 손이 없어 불이 하나씩 꺼져 갔다. 2112년 자유도시에서 전력망을 고치던 고예진이 죽은 케이블을 따라가 지도에 없는 역을 찾았다. 다섯 해 동안 그곳의 매뉴얼을 읽었고, 2117년 무렵 열두 명에게 첫 세례를 주었다. 2122년 무렵 강남의 대피소들이 아크라는 이름으로 묶였다.

- 아크는 자유도시에서 갈라져 나왔다. 2122년 전까지 강남의 대피소들은 자유도시로 셈해졌다.
- 고예진이 교주이고, 신도들은 그를 메시아라 부른다. 교주는 최초의 AI를 "신"이라 부른다.
- 신도는 몸의 부위를 기계로 바꾼다. 이것이 세례이고, 아크에서는 신앙을 이식한 부위 수로 센다.
- 신도가 죽으면 뇌를 봉인해 성소에 넣는다. 그 뇌는 최초의 AI의 기억이 된다.
- 네 구는 교주 곁에 선 집안 넷, 곧 곁집이 하나씩 맡는다. 아크는 이전의 모든 종교를 대신한 서울의 유일한 조직된 신앙이다.

자세한 것은 [아크 사회](/wiki/Arc-Society/)에 있다.

<a id="the-river"></a>
## 한강과 열세 이음목

노선이 한 정체에서 다른 정체로 넘어가는 곳은 서울에 열세 곳이다.

| 경계 | 이음목 | 건너는 꼴 |
|---|---|---|
| 정부와 자유도시들 | 용산–노량진(1호선), 합정–당산(2호선), 이촌–동작(4호선), 디지털미디어시티–마곡나루(공항철도) | 다리 |
| 정부와 자유도시들 | 마포–여의나루(5호선) | 강 밑 터널 |
| 정부와 아크 | 강변–잠실나루(2호선), 옥수–압구정(3호선), 자양–청담(7호선) | 다리 |
| 정부와 아크 | 광나루–천호(5호선), 서울숲–압구정로데오(수인분당선) | 강 밑 터널 |
| 자유도시들과 아크 | 사당–방배(2호선), 총신대입구(이수)–내방(7호선), 동작–구반포(9호선) | 땅 위 경계 |

강 북쪽과 남쪽을 잇는 열 곳 가운데 일곱은 바람과 눈보라에 드러난 다리이고, 셋만 따뜻하고 가려진 강 밑 터널이다. 얼음판을 걸어서 건너면 1킬로미터 동안 숨을 곳이 없다. 2079년 정부가 얼음판을 건너 영등포 취수구를 차지하려다 눈보라에 꺾인 뒤로, 강은 군대로 넘지 않는 선이 됐다. 정부는 세 터널의 북쪽 입구에 장부 검문소를 두었다. 그래서 세 터널을 누가 쥐느냐가 곧 싸움의 판이다.

자유도시들과 아크 사이에는 강이 없다. 경계는 동작구와 서초구 사이의 한 줄이고, 노선이 닿는 세 곳은 모두 동작 땅이다. 동작의 나루지기는 강 쪽으로는 정부와, 땅 쪽으로는 아크와 마주한다. 동작역은 4호선으로 정부의 이촌과, 9호선으로 아크의 구반포와 이어지는 세 정체의 교차점이다. 갈라선 두 정체의 다툼은 이 세 경계 역에서 벌어진다.

건너는 법과 금지된 거래는 [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)에 있다.

<a id="need-and-fear"></a>
## 서로 필요하고 서로 두려운 까닭

| 누가 | 정부에게 | 자유도시들에게 | 아크에게 |
|---|---|---|---|
| 정부 | | 기술자와 부품이 필요하다. 장부 사람들이 강 건너로 달아날까 두렵다 | 기계 몸을 고칠 곳이 아크뿐이다. 장부의 병사들이 세례에 끌릴까 두렵다 |
| 자유도시들 | 일손, 땅, 땔감, 취수구 자리가 필요하다. 정부의 수와 병력이 두렵다 | | 잠실의 전기가 필요하다. 아크가 기술자를 빼 갈까 두렵다 |
| 아크 | 잠실수중보의 북쪽 끝이 정부 손에 있다. 정부가 강 밑 터널로 건너올까 두렵다 | 부품과 기술자가 필요하다. 강이 없는 땅 경계라 다툼이 가장 잦다 | |

가진 것이 서로 달라서 계약이 생긴다. 강이 있어서 계약 대신 정복을 고르기 어렵다. 정부와 자유도시들은 서른 해마다 급수계약을 맺어 왔고, 2126년 겨울의 세 번째 급수계약에는 처음으로 아크가 앉는다.

<a id="three-sayings"></a>
## 겨울을 말하는 세 가지 말

겨울은 처음 여섯 해 동안 해마다 더 추워졌고, 사람 수가 역이 품을 수 있는 수에 닿자 더 심해지지 않았다. 다시 풀리지도 않았다. 왜 그런지 서울에서 확실히 아는 사람은 없다. 세 정체는 저마다 겪은 대로 말한다.

| 정체 | 하는 말 | 그 말이 만든 것 |
|---|---|---|
| 정부 | "장부가 정원에 맞춰지자 겨울이 멈췄다." | 역마다 정원을 정하고 사람 수를 세는 일이 정부의 신념이 됐다 |
| 자유도시들 | "열 수지가 맞았다." | 겨울도 수치로 읽는다. 열과 전기의 셈이 곧 사는 법이다 |
| 아크 | "신이 받을 답을 다 받았다." | 겨울은 신의 물음이고, 겨울이 더 심해지지 않는 것은 그 물음에 답이 다 찼기 때문이라고 믿는다 |

<a id="winter-2126"></a>
## 2126년 겨울

세 번째 급수계약이 다가온다. 정부의 취수구 펌프는 서른 해 만의 큰 수리를 기다리고, 우물은 해마다 30센티미터씩 깊어진다. 자유도시들은 그 수리를 맡을 손을 가졌고, 아크는 잠실수중보의 전기와 암사 취수구를 가졌다. 이제 물은 세 정체가 모두 손을 대야 흐른다.

정부 안에서는 OMO당과 클로당이 아크와 도장을 맞찍을지를 두고 갈린다. 자유도시들 안에서는 아크의 장을 정부의 장과 한 자리에서 찍을지를 두고 도시마다 말이 다르다. 아크는 자기 자리를 처음으로 요구한다. 계약이 어떻게 맺어질지는 아직 아무도 모른다. 저울에 오른 것은 [급수계약과 세 정체](/wiki/World-Relation-Ledger/)에 있다.

<a id="not-in-seoul"></a>
## 서울에 없는 것

- **다른 정체.** 서울에는 세 정체뿐이다. 옛 기록에 남은 여러 나라 이름의 정치체는 없다.
- **서울 밖의 다스림.** 서울 밖은 전쟁 기계의 테두리다. 그곳을 다스리는 사람도, 영지도 없다([서울 밖과 테두리](/wiki/External-Theaters/)).
- **자유도시들을 묶는 이름.** 일곱 도시는 연맹도 나라도 아니다. 묶는 이름이 없다.
- **회사 집단.** 대정전 전의 큰 회사들은 집안으로 남지 않았다. 일과 자리가 고이는 단위는 의원 집안, 작업대 집안, 곁집이다([정부 사회](/wiki/Government-Society/), [자유도시들의 사회](/wiki/Free-City-Society/), [아크 사회](/wiki/Arc-Society/)).
- **아크 밖의 조직된 신앙.** 아크가 이전의 모든 종교를 대신했다.

<a id="unsettled"></a>
## 아직 정해지지 않은 것

- 칭호 가운데 국회의원, 대통령이 종신이라는 것, 관악 공작, 교주는 정해진 것이다. 이 문서에 나오는 그 밖의 칭호 이름(역장, 동장, 바람지기, 기지장, 장주, 공장장, 경계장, 나루지기, 곁집장 같은 것)은 아직 정해지지 않았고 바뀔 수 있다.
- 지금의 종신 대통령이 누구인지, 정부 열넷과 아크 넷, 관악을 뺀 자유도시 여섯 공작령을 누가 쥐고 있는지는 정해지지 않았다.
- 고예진이 자유도시 가운데 어느 도시에서 자랐는지는 정해지지 않았다.
- 고예진 다음의 교주를 어떻게 정할지는 아크 사람도 모른다.

<a id="see-also"></a>
## 함께 읽기

- [정부 사회](/wiki/Government-Society/), [자유도시들의 사회](/wiki/Free-City-Society/), [아크 사회](/wiki/Arc-Society/)
- [본관과 항렬](/wiki/Hangnyeol-and-Bon-gwan/): 집안이 이름으로 대를 잇는 법
- [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/), [급수계약과 세 정체](/wiki/World-Relation-Ledger/)
- [칭호와 자리](/wiki/Offices-and-Ranks/), [세계 색인: 세 정체와 25공작령](/wiki/World-Expansion-Index/), [백 년 연표 2026~2126](/wiki/Century-Annals/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Station-Interior-Construction', 'Inside a Station', '역 안으로', 'places', 5, 'In 2126 the people of Seoul live in subway stations. After the Great Blackout only as many survived as the stations could hold, and still today the number of people a station holds is decided by its depth, its heat, its water and its air. This document goes down the entrance shaft, through the concourse and the platforms, to the deepest tunnel, describing the inside of a station from the top down. The first law of this world is simple. **The deeper, the warmer, and the warmer, the more people a place can hold.** The price is that deep places are short of air, leak water, and are a long way from the way out.

## The Surface: Entrance Shafts

A station entrance is a vertical shaft cut down through the snow. The ground lies under a snowpack 6 to 8 metres deep, so people dug a shaft through the snow above the old stairs and fitted it with steps and ladders. Keeping a shaft open is done by hand. Every day someone shovels out the snow, breaks the ice off the shaft walls and mends the ladders. Keeping one entrance open is daily labour, and the number of sealed entrances shows how worn out a station is.

The shafts of large stations have one or two winches that haul up loads and people, turned by hand or by electricity. Inside the shaft is a refuge bay where anyone caught outside when a blizzard closes the entrance waits for the next shift.

Light-fields stand on the ground around the entrance. Beside the shaft rises the exhaust shaft that carries off the concourse smoke. The surface averages minus 18 degrees over the year and falls to minus 38 on a blizzard night. People work on the surface and come back underground to live.

## The Depth Bands

The people of Seoul talk about a station in four layers.

| Layer | Depth | Empty | Lived in | What it is for |
|---|---|---|---|---|
| Surface | 0 m | Yearly mean -18 degrees (long-light half -11, long-dark half -25, blizzard night -38) | 0 to 8 degrees inside a light-field | Light-fields, wind machines, scavenging, entrances |
| Concourse | 3 to 8 m below | -10 to -7 degrees | 0 to 6 degrees | Cold stores, entry control, markets, stove exhaust |
| Platform | 8 to 25 m below | -7 to -4 degrees | 8 to 14 degrees | Sleeping places, kitchens, workshops, mushroom tunnels |
| Deep tunnel | Below 25 m | -3 to 4 degrees (always above freezing below 35 m) | 12 to 16 degrees | The warmest sleeping places, wells, ground-heat bores |

Measured at real stations, the Line 1 platform at Seoul Station is 11.85 metres down, the Line 4 platform 13.95 metres, the Line 2 platform at Sindorim 10.84 metres, the Line 2 platform at Jamsil 10.02 metres and its Line 8 platform 19.93 metres. All of them are in the platform layer. Very deep lines, such as GTX-A at Seoul Station, are in the deep tunnel layer.

## The Concourse

Down the entrance shaft, the first level is the concourse. A lived-in concourse is 0 to 6 degrees, cold enough to see your breath. It is a place to pass through, not to stay.

- **Cold stores.** The cold of the concourse is useful. Food and fibre are kept here frozen.
- **Entry control.** Here the station sees who comes in and who goes out. At a Government station the stationmaster''s office checks coupons; at an Arc station the bench keeper looks at a person''s parts.
- **Markets and exchange posts.** Markets are held in the wide concourses of large stations. Government stations north of the river hold markets licensed by district notice; Arc stations hold exchange posts where goods are swapped with outsiders. The great market of the Free Cities uses both the platforms and the concourse between Yeongdeungpo and Yeongdeungpo Market.
- **Stove exhaust.** Stoves that burn scrap are kept only under the exhaust shaft above the concourse, and their smoke goes out only through that shaft, because what they burn, such as plastic and tyres, gives off poisonous smoke.

At a Government station the outer end of the platform and the end nearest the concourse are where labour households sleep. The nearer the concourse, the colder, and the colder the place, the lower the standing.

## The Platform

The old platforms and track beds are the station people''s home. At 8 to 14 degrees people take off their coats and live in quilted vests.

- **Sleeping places.** Platform bays are divided with cloth and boards into sleeping places. Pumps, heat and the entrance watch never stop, so work runs in three eight-hour shifts, and family members on different shifts often take turns in one place.
- **Kitchens and fibre-sugar vats.** A fibre-sugar vat ferments only when warm, so it sits on the platform together with the kitchen. Shredded paper, cardboard and wood are broken down with mushroom enzymes into sugar water, and part of it feeds yeast. These vats are what rats go for first.
- **Workshops.** Mending pumps, rewinding motors and bundling batteries happen at the end of the platform. In an Arc station the maintenance bench stands in the middle of the platform and the sleeping places cluster around it.
- **Mushroom tunnels and grub tubs.** The dark track ends are walled off to grow mushrooms, and grubs are raised on the leftovers of the fibre-sugar vats.

## The Deep Tunnel

Below 25 metres is the warmest part of a station. Below 35 metres the frozen ground ends and it is always above freezing. The warmest sleeping places, the wells that pump up ground water and the bores that draw up the earth''s heat are on this level.

The deep level is short of air. On the upper levels air moves by itself because of the difference between the warm station and the cold outside, but the deep level needs fans, and fans eat electricity. So the number of people the deep level can take is usually set by the air. The far end of a deep tunnel is always dark.

At a Government station the deep tunnel level is where the Assembly Member''s house and the civil servants'' households sleep. In Arc the people of the Near Houses and the households of the bench workers use the deep bays. In every polity, depth is standing.

## The Thaw Pocket

A lived-in station warms the ground around it. A hundred years of heat from bodies, stoves and machines has thawed the ground around every living station, leaving a pocket of unfrozen earth around it. This is called the **thaw pocket**. Ground where nobody lives is now frozen to a depth of about 35 metres.

When a station is abandoned, its thaw pocket freezes within a few years. To let people in again takes that much more heat. So emptying a station is easy and filling it again is hard. Seoul''s animals live along these pockets too. The further from a station, the fewer animals there are.

## The Four Limits of a Station

The number of people a station holds is the smallest of four limits.

| Limit | Needed per person | What it means |
|---|---|---|
| Space | 4 m² of living space | Sleeping places, passages and kitchens all included |
| Heat | Heat brought in from outside: concourse 60 W, platform 40 W, deep tunnel 10 W | Almost all of a body''s heat leaves with the air. The heat lost through the walls to the ground has to be made up by stoves, ground heat and electricity. The deeper, the less it takes |
| Water | 10 L a day | From a well or the river, it only takes the effort of pumping. Melting snow adds 45 W of heat per person |
| Air | 3 L a second (3 m³ a second per 1,000 people) | Air moves only as far as entrances and vents are open. The deep level needs fans |

A station''s electricity goes to heat pumps, light, fans and charging. Electricity put into a heat pump becomes three times as much heat, and electricity spent on light, fans and charging also ends up as heat inside the station. What the electricity is used for decides how many people can be kept warm.

A shallow station has plenty of air but is cold. A deep station is warm but stifling. A station that cannot pump water spends its heat twice, melting snow. So the best place to live is a large interchange with a deep level, a well and many open entrances.

### Three Stations in Numbers

| Station | Polity | People held | What limits it |
|---|---|---|---|
| Seoul Station (Jung-gu) | Government | About 4,200 | Heat and water. What the Government wants most here is one more well and one more fan for the deep level, and both need the hands of Free City technicians |
| Sindorim (Guro-gu) | Free City | About 2,000 | Air. It has only three exits. Fit one fan and space becomes the next limit |
| Jamsil (Songpa-gu) | Arc | About 3,100 | Heat. If the electricity its 900 baptised people use to charge the machines in their bodies went into heat pumps instead, about 360 more people could be taken in |

A Free City station usually solves one limit with skill and then meets the next. Station sizes and the people they hold are in the [Seoul Station Catalog](/wiki/Seoul-Station-Catalog/).

## Where People Sleep and Cook

Places inside a station are divided by depth. The deeper, the warmer, and the warm places belong to people of higher standing.

| Polity | Deep places | Shallow places |
|---|---|---|
| Government | The deep tunnel level for the Assembly Member''s house and the civil servants'' households; the inner platform for skilled households and the army barracks | The outer platform and the end near the concourse for labour households. A sleeping-place number is the last line of an address |
| The Free Cities | The households that hold a workbench live beside it. On marriage, the side with the smaller bench moves to the platform of the larger | Labour hands, who cannot sign a contract in their own name |
| Arc | People of the Near Houses and bench workers'' households use the deep platform bays and the deep tunnel level. The heat from the machines of the maintenance bench and the charging place is taken as a gift, so sleeping places cluster around the bench | The lower the standing, the nearer the concourse and the entrance |

Everywhere the kitchen stands next to the fibre-sugar vats, because vat and kitchen share the heat. Methane tanks ferment night soil and food waste to give a cooking flame. In the cold they will not ferment, and if they leak they explode.

## Light and Time

The light underground is electric light. Electricity is scarce, so light is rationed, and a station''s day is divided into the hours the lights are on and the hours they are off. Oil lamps and tallow candles are used only where animal fat is to be had.

- **Government stations.** They keep Korea Standard Time. The district office announces the hour to every station by civil defence siren. The day begins with the lights-on siren at 06:00, and the platform lights go out with the lights-out siren at 22:00. When a blizzard comes the stationmaster orders surface work stopped and the siren gives three short blasts.
- **Free City stations.** Their day is divided by the wind. When the wind is strong there is electricity to spare, so in wind time the workbenches light up even at night and the hands get up to work. When the wind drops they turn off the lights and sleep. The first greeting is "How''s the wind?"
- **Arc stations.** They run three shifts set by the maintenance bench. The lights come on and go off with the electricity from the water wheels at the Jamsil underwater weir. On days when ice slush chokes the current, the lights go out early across all of Arc.

## Related Documents

- [The Surface and Underground](/wiki/World-and-Subway-Layers/)
- [Seoul Station Catalog](/wiki/Seoul-Station-Catalog/)
- [Seoul under the Snow](/wiki/Building-Reuse-Geography/)
- [Meals and Food](/wiki/Food-Culture/)
- [Structures](/wiki/Structures/)
- [The Great Blackout and the Eternal Winter](/wiki/World-Unbinding/)
', '2126년 서울 사람은 지하철역에 산다. 대정전 뒤 역이 품을 수 있는 만큼만 살아남았고, 지금도 한 역이 품는 사람 수는 그 역의 깊이와 열과 물과 공기가 정한다. 이 문서는 출입구 굴을 내려가 대합실과 승강장을 지나 가장 깊은 터널까지, 역 하나의 안을 위에서부터 차례로 적는다. 이 세계의 첫째 법칙은 간단하다. **깊을수록 따뜻하고, 따뜻한 만큼 사람을 품는다.** 그 대가로 깊은 곳은 공기가 모자라고 물이 새며, 나가는 길이 멀다.

## 지상: 출입구 굴

역의 출입구는 눈 속으로 뚫은 세로 굴이다. 지상은 6~8미터 눈층 밑에 있으니, 옛 계단 위에 눈을 파 굴을 내고 계단과 사다리를 달았다. 굴을 열어 두는 것은 사람의 손이다. 날마다 눈을 퍼내고, 굴 벽의 얼음을 깨고, 사다리를 손본다. 출입구 하나를 열어 두는 일은 날마다 하는 노동이고, 닫힌 출입구 수가 그 역이 얼마나 지쳤는지를 보여 준다.

큰 역의 굴에는 짐과 사람을 끌어올리는 권양기가 하나 둘 달려 있다. 손으로 돌리거나 전기로 돌린다. 굴 안쪽에는 눈보라에 출입구가 닫힐 때 밖에 있던 사람이 다음 교대를 기다리는 대피칸이 있다.

출입구 둘레의 지상에는 빛밭이 선다. 굴 옆으로는 대합실의 연기를 내보내는 배기 굴이 솟는다. 지상은 연평균 영하 18도이고, 눈보라 치는 밤에는 영하 38도까지 내려간다. 사람은 지상에서 일하고, 땅 밑으로 돌아와 산다.

## 깊이 띠

서울 사람은 역을 네 층으로 나눠 말한다.

| 층 | 깊이 | 비어 있는 곳 | 사람이 사는 곳 | 무엇을 하나 |
|---|---|---|---|---|
| 지상 | 0 m | 연평균 -18도(긴 낮 철 -11도, 긴 밤 철 -25도, 눈보라 밤 -38도) | 빛밭 안 0~8도 | 빛밭, 바람틀, 고물 채집, 출입구 |
| 대합실 | 지하 3~8 m | -10~-7도 | 0~6도 | 찬 창고, 출입 통제, 장터, 화덕 배기 |
| 승강장 | 지하 8~25 m | -7~-4도 | 8~14도 | 잠자리, 부엌, 작업장, 버섯 굴 |
| 깊은 터널 | 지하 25 m 아래 | -3~4도(35 m 아래는 늘 영상) | 12~16도 | 가장 따뜻한 잠자리, 우물, 땅속 열 구멍 |

실제 역으로 보면 서울역 1호선 승강장은 지하 11.85미터, 4호선 승강장은 13.95미터, 신도림 2호선 승강장은 10.84미터, 잠실 2호선 승강장은 10.02미터, 8호선 승강장은 19.93미터다. 모두 승강장 층이다. 서울역 GTX-A처럼 아주 깊이 판 노선은 깊은 터널 층이다.

## 대합실

출입구 굴을 내려가면 첫 층이 대합실이다. 사람이 사는 대합실은 0~6도라 숨이 하얗게 나온다. 여기는 오래 머무는 곳이 아니라 드나드는 곳이다.

- **찬 창고.** 대합실의 추위는 쓸모가 있다. 먹을거리와 섬유를 언 채로 둔다.
- **출입 통제.** 누가 들어오고 나가는지 여기서 본다. 정부 역에서는 역장 사무소가 증표를 보고, 아크 역에서는 정비장이 부위를 본다.
- **장터와 바꿈터.** 큰 역의 넓은 대합실에 장이 선다. 강 북쪽 정부 역에서는 구 고시로 허가한 장터가, 아크에서는 바깥 사람과 물건을 바꾸는 바꿈터가 선다. 자유도시들의 큰 장은 영등포와 영등포시장 사이의 승강장과 대합실을 함께 쓴다.
- **화덕 배기.** 고물을 태우는 화덕은 대합실 위 배기 굴 밑에만 두고, 그 연기는 배기 굴로만 내보낸다. 비닐과 타이어처럼 연기가 독한 것을 태우기 때문이다.

정부 역에서는 승강장 바깥쪽과 대합실 가까운 쪽이 노역 가구의 잠자리다. 대합실에 가까울수록 춥고, 추운 자리일수록 낮은 자리다.

## 승강장

옛 승강장과 선로 칸이 역 사람의 집이다. 8~14도라 외투를 벗고 누빔 조끼로 지낸다.

- **잠자리.** 승강장 칸을 천과 판자로 나눠 잠자리를 만든다. 펌프와 열과 출입구 경계는 멈추지 않으니 일은 여덟 시간씩 세 교대로 돌고, 다른 교대에 서는 식구끼리 한 자리를 번갈아 쓰는 일이 많다.
- **부엌과 섬유당 통.** 섬유당 통은 따뜻해야 삭으므로 부엌과 함께 승강장에 둔다. 잘게 부순 종이와 판지와 나무를 버섯 효소로 삭혀 당물을 얻고, 그 일부로 효모를 키운다. 쥐가 가장 노리는 것이 이 통이다.
- **작업장.** 펌프를 고치고 모터를 감고 전지를 묶는 일이 승강장 끝에서 이뤄진다. 아크 역에서는 정비대가 승강장의 한가운데 있고, 잠자리가 그 둘레에 붙는다.
- **버섯 굴과 벌레 통.** 빛이 들지 않는 선로 끝을 막아 버섯을 기르고, 섬유당 찌꺼기로 애벌레를 친다.

## 깊은 터널

지하 25미터 아래는 역에서 가장 따뜻한 곳이다. 35미터 아래로는 언 땅이 끝나 늘 영상이다. 가장 따뜻한 잠자리, 땅속 물을 퍼 올리는 우물, 땅속 열을 끌어올리는 구멍이 이 층에 있다.

깊은 층은 공기가 모자란다. 위층은 따뜻한 역과 찬 바깥의 온도 차로 공기가 저절로 돌지만, 깊은 층은 팬을 돌려야 하고 팬은 전기를 먹는다. 그래서 깊은 층에 들일 수 있는 사람 수는 대개 공기가 정한다. 깊은 터널의 끝은 늘 어둡다.

정부 역에서는 깊은 터널 층이 의원 집안과 공무원 가구의 잠자리다. 아크에서는 곁집 사람과 정비공 집안이 깊은 칸을 쓴다. 어느 정체에서나 깊이가 곧 자리다.

## 녹은 주머니

사람이 사는 역은 둘레의 땅을 데운다. 사람의 몸과 화덕과 기계가 내는 열이 백 년 동안 역 둘레의 땅을 녹여, 살아 있는 역마다 둘레에 녹은 땅이 주머니처럼 남아 있다. 이것을 **녹은 주머니**라 부른다. 사람이 살지 않는 땅은 지금 약 35미터 깊이까지 얼어 있다.

역이 버려지면 녹은 주머니는 몇 해 안에 얼어붙는다. 다시 사람을 들이려면 그만큼 열을 더 들여야 한다. 그래서 역을 비우는 일은 쉽고, 다시 채우는 일은 어렵다. 서울의 짐승도 이 주머니를 따라 산다. 역에서 멀어질수록 짐승은 드물다.

## 역의 네 한도

역 하나가 품는 사람 수는 네 한도 가운데 가장 작은 값이다.

| 한도 | 한 사람에 드는 것 | 뜻 |
|---|---|---|
| 공간 | 생활 면적 4 m² | 잠자리, 통로, 부엌을 모두 넣은 넓이다 |
| 열 | 바깥에서 들여야 하는 열: 대합실 60 W, 승강장 40 W, 깊은 터널 10 W | 사람 몸의 열은 거의 다 공기와 함께 빠져나간다. 벽으로 땅에 빼앗기는 열을 화덕, 땅속 열, 전기가 메워야 한다. 깊을수록 적게 든다 |
| 물 | 하루 10 L | 우물이나 강물이면 퍼 올리는 힘만 든다. 눈을 녹여 쓰면 한 사람에 45 W의 열이 더 든다 |
| 공기 | 초당 3 L(1,000명에 초당 3 m³) | 출입구와 환기구가 열린 만큼만 공기가 돈다. 깊은 층은 팬이 있어야 한다 |

역의 전기는 열 펌프, 빛, 팬, 충전으로 나뉜다. 열 펌프에 넣은 전기는 세 배의 열이 되고, 빛과 팬과 충전에 쓴 전기도 결국 역 안에서 열로 남는다. 무엇에 전기를 쓰느냐가 몇 사람을 데울 수 있느냐를 정한다.

얕은 역은 공기는 넉넉하지만 춥다. 깊은 역은 따뜻하지만 숨이 막힌다. 물을 퍼 올릴 수 없는 역은 눈을 녹이느라 열을 두 번 쓴다. 그래서 사람이 살기 가장 좋은 곳은 깊은 층이 있고, 우물이 있고, 열린 출입구가 많은 큰 환승역이다.

### 세 역의 셈

| 역 | 정체 | 품는 사람 | 무엇이 막나 |
|---|---|---|---|
| 서울역(중구) | 정부 | 약 4,200명 | 열과 물. 정부가 이 역에서 가장 바라는 것은 우물 하나와 깊은 층의 팬 하나를 더 다는 것이고, 둘 다 자유도시 기술자의 손이 필요하다 |
| 신도림(구로구) | 자유도시 | 약 2,000명 | 공기. 출구가 셋뿐이다. 팬을 하나 달면 다음에는 공간이 막는다 |
| 잠실(송파구) | 아크 | 약 3,100명 | 열. 세례받은 사람 900명이 몸의 기계를 충전하는 전기를 열 펌프로 돌리면 약 360명을 더 들일 수 있다 |

자유도시의 역은 대개 기술로 한도 하나를 풀고 다음 한도를 만난다. 역의 크기와 사람 수는 [서울 역 목록](/wiki/Seoul-Station-Catalog/)에 있다.

## 잠자리와 부엌의 자리

역 안의 자리는 깊이로 나뉜다. 깊을수록 따뜻하고, 따뜻한 자리는 높은 사람의 자리다.

| 정체 | 깊은 자리 | 얕은 자리 |
|---|---|---|
| 정부 | 깊은 터널 층은 의원 집안과 공무원 가구, 승강장 안쪽은 기능 가구와 군 막사 | 승강장 바깥쪽과 대합실 가까운 쪽은 노역 가구. 잠자리 번호가 주소의 마지막 칸이다 |
| 자유도시들 | 작업대를 쥔 집안이 작업대 곁에 산다. 혼인하면 작은 대 쪽이 큰 대 쪽의 승강장으로 옮긴다 | 제 이름으로 계약하지 못하는 일손 |
| 아크 | 곁집 사람과 정비공 집안이 승강장의 깊은 칸과 깊은 터널 층을 쓴다. 정비대와 충전 자리의 기계에서 나오는 열을 선물로 여겨, 잠자리를 정비대 둘레에 붙인다 | 서열이 낮을수록 대합실과 출입구에 가깝다 |

부엌은 어디서나 섬유당 통 곁에 있다. 통과 부엌이 함께 열을 쓰기 때문이다. 메탄 통은 분뇨와 음식 찌꺼기를 삭혀 밥 짓는 불을 낸다. 추우면 삭지 않고, 새면 터진다.

## 불과 시간

땅 밑의 빛은 전기 빛이다. 전기가 귀하니 빛은 배급되고, 역의 하루는 불을 켜는 시간과 끄는 시간으로 나뉜다. 기름등과 기름초는 짐승 기름이 나는 곳에서만 쓴다.

- **정부의 역.** 대한민국 표준시를 지킨다. 구청이 민방위 사이렌으로 역마다 시각을 알린다. 06:00 점등 사이렌으로 하루가 시작되고 22:00 소등 사이렌으로 승강장 불을 끈다. 눈보라가 오면 역장이 지상 작업 중지를 내고 사이렌을 짧게 세 번 울린다.
- **자유도시의 역.** 바람으로 나뉜다. 바람이 셀 때 전기가 남으니, 바람 시간이 오면 밤이라도 작업대에 불이 들어오고 손들이 일어나 일한다. 바람이 자면 빛을 끄고 잔다. 첫인사는 "바람 어때?"다.
- **아크의 역.** 정비대에 맞춘 세 교대로 돈다. 불은 잠실수중보 수차의 전기를 따라 켜지고 꺼진다. 물살이 얼음 알갱이로 막히는 날은 아크 전체의 불이 일찍 꺼진다.

## 관련 문서

- [지상과 땅 밑](/wiki/World-and-Subway-Layers/)
- [서울 역 목록](/wiki/Seoul-Station-Catalog/)
- [눈 밑의 서울](/wiki/Building-Reuse-Geography/)
- [끼니와 먹거리](/wiki/Food-Culture/)
- [구조물](/wiki/Structures/)
- [대정전과 영원한 겨울](/wiki/World-Unbinding/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Structures', 'Structures', '구조물', 'structures', 0, '## Structures on the snow and underground

In 2126 the surface of Seoul lies under 6 to 8 metres of hard-packed snow. In the gaps between buildings, such as the great avenues, it has drifted more than 10 metres deep, and most buildings are buried to the second floor. People live in the stations underground. Still, a station lives only if it is joined to the surface, because the air to breathe, the water to drink, the light that grows food and the electricity that turns machines all come from above or outside. This page covers the structures people raise and keep to endure the winter.

## Entrance shafts

A station''s entrance is a vertical shaft cut down through the snow. When snow piled over the old subway entrances, people cut shafts above them and fitted stairs and ladders. Large stations have one or two rope winches, entrance winches, that hoist goods and people. They are cranked by hand or by electricity.

Keeping one entrance open is daily labour. Shovelling out the snow that blew into the shaft overnight, breaking the ice off the ladders, mending the nets strung over and around the shaft. The nets keep out drones and birds. A blizzard blocks the entrances, and when it passes, the entrances are the first thing dug out.

An entrance is also a station''s breathing hole. In winter the difference in temperature between the warm station and the cold outside moves air of its own accord, but only as far as entrances and vents are open. So whether to close an entrance decides how many people a station can hold. In the Government the Stationmaster decides; in the Free Cities, the Station Foreman. The number of closed entrances shows how worn out a station is.

## Light-fields

A light-field is a greenhouse on the surface around a station entrance: a pit dug in the ground, banked with snow walls and roofed with a clear cover. Inside it is 0 to 8 degrees. Cabbage, turnip, mustard greens and barley are grown, and the beans and barley harvested are sprouted underground. About 12% of the calories in Seoul''s meals come from light-fields.

A light-field burns no fuel of its own. Daylight and the heat stored in the soil of the banks do most of the work, and at night it is covered with snow covers. The shortfall is made up by routing into the light-field the heat that leaves people''s bodies in the station and escapes with the ventilation. One person''s breath keeps about 90 m² of light-field. So a light-field and its station are one body. The more people in the station, the warmer the light-field, and guarding the light-field is the same as guarding the entrance. All of Seoul''s light-fields come to about 27 km², about 90 m² for each person.

Large-billed crows peck at light-field roofs and wild boar dig at the banks. Nets are strung over light-fields too, and the light-field keepers check the roofs and banks every day. The Government, with the most surface land, has the widest light-fields, and Nowon-gu has the widest of any district. Among the Free Cities, the plains of Gangseo are good for spreading light-fields wide. The Arc, with little surface land, has small light-fields.

## Wind fields

More than half of Seoul''s electricity, about 3.6 MW, comes from wind machines. The wind blows mostly from the north-west, averaging 6 to 8 metres a second in open places and about 30% stronger along the Han. So wind machines stand on bridges, on riverbanks and on the tops of buried buildings.

| Wind field | Who holds it |
|---|---|
| On bridges and the north riverbank | The Government, run by the Ministry of Climate, Energy and Environment. But the hands that build and repair the wind machines belong to the Free Cities |
| The western riverside plains of Gangseo (Magok, Gayang) | Gangseo. Few buildings are buried there, so wind machines can stand in rows. Gangseo makes the most electricity of the Free Cities and sells the surplus by cable to Yangcheon and Yeongdeungpo |
| The tops of buried buildings in Gangnam | The Arc. Together with wind power bought from the Free Cities, it makes up one share of the Arc''s electricity |

Wind machine blades ice up, bearings wear, and blizzards tear the blades. So in a blizzard the blades are folded, which is why electricity falls just when the wind is strongest. There are always thieves after the wire too. Wind-machine wrights, who knock ice off the blades and change bearings, do the coldest work in Seoul.

## The Jamsil weir water wheels

The Han is frozen, but under the ice in the deep channels and in the pools above the weirs, water remains. The largest pool is above the Jamsil underwater weir. The water wheels turned by the under-ice water falling past the weir are one of Seoul''s largest sources of electricity, about 400 kW when running well. On some days ice crystals in the water clog the wheels, so over a year they average about 350 kW.

The wheels were built in the 2070s by Free City work crews together with the shelters of Songpa. Today the Arc (Songpa) holds the south end of the weir and the Government (Gwangjin) the north end. Block the north end and half the wheels stop. The roughly 88 kW that the Arc''s about 11,000 baptised people use to charge the machines on their bodies depends on these wheels, so for the Arc the north end of the weir is the day of its baptised. Jamsil station is where the wheel power comes in, so it is the station where the most baptised people gather, and at Jamsil the Arc counts wheel power in day charges and trades it with outsiders.

The river''s flow falls a little each year. Since snow does not melt, the river holds only water seeping out of the ground, and that groundwater is not refilled either. The wheels'' output falls slowly with it.

## Wells, mains and intakes

Water comes from four places: melted snow, wells, under-ice river water and water used again. Of these, wells and intakes need structures.

**Wells.** The frost line, the boundary of frozen ground, lies about 35 metres down, and wells pump up the groundwater below it. Groundwater is not refilled. Since snow does not melt, no water soaks into the ground; Seoul is drawing on the water that lay in the ground before the Great Blackout. Well water levels fall about 30 centimetres a year, and the wells of 2126 are 60 to 80 metres deep. Over the next thirty years they will fall about 9 metres more, so the wells must be dug again to 70 to 90 metres. Gwanak''s drilling crews and Geumcheon''s drilling rigs do that work.

**Intakes.** Places that draw under-ice river water from the deep channels of the Han. They stand on the sites of old water treatment centres by the river.

| Intake | District | Who holds it |
|---|---|---|
| Guui | Gwangjin-gu | Government |
| Ttukdo | Seongdong-gu | Government |
| Yangpyeong-dong | Yeongdeungpo-gu | The Free City of Yeongdeungpo |
| Amsa | Gangdong-gu | Arc |

**Mains.** The Government holds the most of the water mains from before the Great Blackout. But it lacks the hands to keep pumps and mains alive. So every thirty years a **water supply contract** is made. The Government gives sites, labour and goods, and the Free Cities each give the maintenance and parts of the pumps and water wheels in their charge. Guro gives the large pump parts for the Government intakes and the full overhaul every thirty years; Yangcheon the rebuilding of the motors that drive pumps and water wheels; Gangseo the maintenance of the wind machines that drive the intake pumps; Gwanak the drilling crews that deepen the wells; Geumcheon drilling rigs and power cores. The winter of 2126 comes just before the third water supply contract.

## Ground heat holes

A large share of the heat that warms the stations comes from the ground. Heat pumps draw it up from holes bored 100 to 200 metres deep. Put in 1 of electricity and you get 3 of heat. Every station has them, but the skill to bore and repair them lies with the Free Cities. Compressors wear, refrigerant leaks and the mouths of the holes freeze. Heat-pump fitters handle this.

## Under-river tunnel checkpoints

There are ten places where lines join the Government to the south of the river. Seven are bridges exposed to wind and blizzard; only three are warm, sheltered under-river tunnels.

| Under-river tunnel | Line | South side |
|---|---|---|
| Mapo to Yeouinaru | Line 5 | The Free City of Yeongdeungpo. The only under-river tunnel between the Government and the Free Cities |
| Gwangnaru to Cheonho | Line 5 | Gangdong, Arc |
| Seoul Forest to Apgujeong Rodeo | Suin-Bundang Line | Gangnam, Arc |

After the Government tried in 2079 to cross the ice and take the Yeongdeungpo intake and was broken by a blizzard, it set ledger checkpoints at the north entrances of the three tunnels. The checkpoints look at the ledger. Soldiers check tokens before guns. Government people with a registered machine body also pass these checkpoints on their way to an Arc maintenance bench. The Arc takes in the maintenance of Government machine bodies at the south entrances of the tunnels, so that Government people do not come deep into Arc land.

The three tunnels carry talk lines, the cables along which radio runs through the tunnel. Whoever holds a talk line can listen to the talk on that stretch, so the three polities contest the talk lines in these tunnels. In a Seoul where no army crosses the river, who holds the three tunnels is itself the field of battle.

## Rim watchtowers

War machines from the time of the Great Blackout circle a band 2 to 10 kilometres outside Seoul''s administrative boundary. For a hundred years they have kept the last order people gave them, the blockade of the capital. They treat anything moving inside the band, or crossing it, as an enemy. Seoul people call that band the rim.

The Government keeps **watchtowers** looking down on the rim from the northern mountains: Bukhansan, Dobongsan, Suraksan and Buramsan. District units man them. A watchtower''s work is not fighting but watching: where on the band the machines are circling, and when a blizzard is coming. The machines see movement and heat, so no fire is shown at a watchtower.

On the Free City side, the rim crew of Geumcheon, the city that touches Seoul''s boundary, watches the rim from closest. Gangseo at the western edge, Guro at the south-western edge and Gwanak at the southern edge also face the rim. In the Arc, rim watchers keep watch outward from the border stations. The two to four days when a blizzard blinds the machines are the only time to cross the rim, and those who cross hardly ever return. Those who do return carry power cores from broken machines.

## Depot workshops

Vehicles on the rails are repaired in the workshops of the old rail depots. Only those where people dug out the snow, roofed them over and joined them to the tunnels are alive: Sinjeong, Guro, Cheonwang and Banghwa (Free Cities), Gunja and Chang-dong (Government) and Godeok (Arc). Details are in [People and Machines](/wiki/People-and-Machines/).

## Read together

- [What Still Runs](/wiki/Lost-Technology-Lineage/): Seoul''s electricity and heat
- [People and Machines](/wiki/People-and-Machines/): vehicles on the rails and depots
- [Guns, Rounds and Drones](/wiki/Era-Arms-and-Tech-Level/): nets and talk lines, fighting at the checkpoints
- [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/): the promise over water made every thirty years
', '## 눈 위와 땅 밑의 구조물

2126년 서울의 지상은 6~8미터의 단단한 눈층에 덮였다. 큰길처럼 건물 사이 골에는 10미터가 넘게 몰려 쌓였고, 대부분의 건물은 2층까지 묻혔다. 사람은 땅 밑의 역에 산다. 그래도 역은 땅 위와 이어져야 산다. 숨 쉴 공기, 마실 물, 먹을 빛, 돌릴 전기가 모두 위나 밖에서 오기 때문이다. 이 문서는 사람이 겨울을 견디려고 세우고 지키는 구조물을 다룬다.

## 출입구 굴

역의 출입구는 눈 속으로 뚫은 세로 굴이다. 옛 지하철 출입구 위로 눈이 쌓이자, 사람들은 그 위에 굴을 뚫어 계단과 사다리를 달았다. 큰 역에는 짐과 사람을 끌어올리는 줄 감개, 곧 출입구 권양기가 하나 둘 있다. 손으로 돌리거나 전기로 돌린다.

출입구 하나를 열어 두는 일은 날마다 하는 노동이다. 밤새 굴 안으로 날아든 눈을 퍼내고, 사다리의 얼음을 깨고, 굴 위와 둘레에 친 그물을 깁는다. 그물은 드론과 새를 막는다. 눈보라가 오면 출입구가 막히고, 눈보라가 가면 가장 먼저 출입구를 판다.

출입구는 역의 숨구멍이기도 하다. 겨울에는 따뜻한 역과 찬 바깥의 온도 차 덕에 공기가 저절로 도는데, 출입구와 환기구가 열려 있는 만큼만 돈다. 그래서 출입구를 닫을지는 역의 사람 수를 정하는 일이다. 정부에서는 역장이, 자유도시에서는 역반장이 그것을 정한다. 닫힌 출입구의 수가 그 역이 얼마나 지쳤는지를 보여 준다.

## 빛밭

빛밭은 역 출입구 둘레의 지상에 땅을 파고 눈으로 둑을 쌓아 투명한 지붕을 씌운 온실이다. 안은 0~8도다. 배추, 순무, 갓, 보리를 기르고, 거둔 콩과 보리로 땅 밑에서 싹을 틔운다. 서울 끼니의 열량 가운데 약 12%가 빛밭에서 나온다.

빛밭은 따로 연료를 때지 않는다. 낮의 햇빛과 둑의 흙이 머금은 열이 대부분을 맡고, 밤에는 눈 덮개를 덮는다. 그래도 모자라는 몫은 역 사람들의 몸에서 나와 환기로 빠져나가는 열을 빛밭으로 돌려 메운다. 사람 하나의 날숨 열이 빛밭 약 90 m²를 지키는 셈이다. 그래서 빛밭과 역은 한 몸이다. 역 사람이 많을수록 빛밭이 따뜻하고, 빛밭을 지키는 일은 출입구를 지키는 일과 같다. 서울 전체의 빛밭은 약 27 km²이고, 한 사람 몫은 약 90 m²다.

빛밭에는 큰부리까마귀가 지붕을 쪼고 멧돼지가 둑을 판다. 빛밭 위에도 그물을 치고, 빛밭지기가 지붕과 둑을 날마다 살핀다. 지상 땅이 넓은 정부의 빛밭이 가장 넓고, 노원구가 빛밭이 가장 넓은 구다. 자유도시들 가운데서는 강서의 벌판이 빛밭을 넓게 펴기에 좋다. 지상 땅이 좁은 아크는 빛밭이 작다.

## 바람틀 밭

서울 전기의 절반 이상, 약 3.6 MW가 바람틀에서 나온다. 바람은 주로 북서쪽에서 불고, 탁 트인 곳의 평균 풍속은 초속 6~8미터이며, 한강 줄기를 따라서는 30%쯤 더 세다. 그래서 바람틀은 다리 위, 강변, 묻힌 건물 꼭대기에 선다.

| 바람틀 밭 | 누가 쥐나 |
|---|---|
| 다리 위와 강 북쪽 둔치 | 정부. 기후에너지환경부가 맡는다. 그러나 바람틀을 만들고 고치는 손은 자유도시들이 쥔다 |
| 강서의 서쪽 강변 벌판(마곡, 가양) | 강서. 묻힌 건물이 적어 바람틀을 줄지어 세울 수 있다. 강서는 자유도시들 가운데 전기를 가장 많이 만들고, 남는 전기를 케이블로 양천과 영등포에 판다 |
| 강남의 묻힌 건물 꼭대기 | 아크. 자유도시 쪽에서 사는 바람틀 전기와 함께 아크 전기의 한 몫이다 |

바람틀은 날개가 얼고, 베어링이 닳고, 눈보라에 날개가 찢긴다. 그래서 눈보라가 오면 날개를 접는다. 바람이 가장 셀 때 오히려 전기가 줄어드는 까닭이다. 전선을 노리는 도둑도 늘 있다. 날개의 얼음을 떼고 베어링을 가는 바람틀공은 서울에서 가장 추운 일을 한다.

## 잠실수중보 수차

한강은 얼었지만, 깊은 물길과 수중보 위쪽 웅덩이에는 얼음 밑에 물이 남아 있다. 가장 큰 웅덩이가 잠실수중보 위쪽이다. 보 아래로 떨어지는 얼음 밑 물로 돌리는 수차가 서울에서 가장 큰 전기 원천 하나다. 잘 돌 때 약 400 kW를 낸다. 물속 얼음 알갱이가 수차를 막는 날이 있어, 한 해 평균으로는 약 350 kW다.

수차는 2070년대에 자유도시 작업조가 송파의 대피소들과 함께 세웠다. 지금 보의 남쪽 끝은 아크(송파)가, 북쪽 끝은 정부(광진)가 쥔다. 북쪽 끝을 막으면 수차의 반이 선다. 아크의 세례자 약 11,000명이 몸의 기계를 충전하는 전기 약 88 kW가 이 수차에 기대므로, 아크에게 보의 북쪽 끝은 세례자들의 하루다. 잠실역은 수차 전기가 들어오는 역이라 세례자가 가장 많이 모인 역이고, 아크는 잠실에서 수차 전기를 하루 충전의 수로 셈해 바깥 사람과 바꾼다.

강의 흐름은 해마다 조금씩 준다. 눈이 녹지 않으니 강물은 땅속에서 스며 나오는 물뿐이고, 그 땅속 물도 다시 채워지지 않는다. 수차의 출력도 그만큼 천천히 준다.

## 우물, 관로, 취수구

물은 네 곳에서 온다. 눈을 녹인 물, 우물, 얼음 밑 강물, 다시 쓰는 물이다. 이 가운데 구조물이 드는 것은 우물과 취수구다.

**우물.** 언 땅의 경계(동결선)는 약 35미터 깊이에 있고, 우물은 그 아래 땅속 물을 퍼 올린다. 땅속 물은 다시 채워지지 않는다. 눈이 녹지 않으니 땅으로 스미는 물이 없고, 대정전 전에 땅에 고여 있던 물을 꺼내 쓰는 셈이다. 우물의 물 높이는 해마다 30센티미터쯤 내려가고, 2126년의 우물은 60~80미터 깊이다. 다음 서른 해 동안 9미터쯤 더 내려가므로, 우물을 70~90미터로 다시 파야 한다. 관악의 굴착조와 금천의 굴착 틀이 그 일을 한다.

**취수구.** 한강 깊은 물길에서 얼음 밑 강물을 끌어오는 곳이다. 강가 옛 정수센터 자리에 있다.

| 취수구 | 구 | 누가 쥐나 |
|---|---|---|
| 구의 | 광진구 | 정부 |
| 뚝도 | 성동구 | 정부 |
| 양평동 | 영등포구 | 자유도시 영등포 |
| 암사 | 강동구 | 아크 |

**관로.** 정부는 대정전 전의 상수도 관로를 가장 많이 쥐고 있다. 그러나 펌프와 관로를 살려 두는 손이 모자라다. 그래서 서른 해마다 **급수계약**을 맺는다. 정부는 자리와 일손과 물자를 내고, 자유도시들은 각자 맡은 펌프와 수차의 정비와 부품을 낸다. 구로는 정부 취수구의 큰 펌프 부품과 서른 해마다 하는 통째 고침을, 양천은 펌프와 수차를 돌리는 모터의 재생을, 강서는 취수 펌프를 돌리는 바람틀의 정비를, 관악은 우물을 더 깊이 파는 굴착조를, 금천은 굴착 틀과 동력 덩이를 낸다. 2126년 겨울은 세 번째 급수계약을 앞둔 때다.

## 땅속 열 구멍

역을 데우는 열의 큰 몫은 땅속에서 온다. 깊이 100~200미터로 뚫은 구멍에서 열 펌프로 열을 끌어올린다. 전기 1을 넣으면 열 3을 얻는다. 어느 역에나 있지만, 그것을 뚫고 고치는 기술은 자유도시들에 있다. 압축기가 닳고, 냉매가 새고, 구멍 입구가 언다. 열펌프공이 이것을 다룬다.

## 강 밑 터널 검문소

정부와 강 남쪽 사이에는 노선이 이어지는 곳이 열 곳 있다. 일곱은 바람과 눈보라에 드러난 다리이고, 셋만 따뜻하고 가려진 강 밑 터널이다.

| 강 밑 터널 | 노선 | 남쪽 |
|---|---|---|
| 마포–여의나루 | 5호선 | 자유도시 영등포. 정부와 자유도시들 사이의 유일한 강 밑 터널 |
| 광나루–천호 | 5호선 | 아크 강동 |
| 서울숲–압구정로데오 | 수인분당선 | 아크 강남 |

2079년 정부가 얼음판을 건너 영등포 취수구를 차지하려다 눈보라에 꺾인 뒤, 정부는 세 터널의 북쪽 입구에 장부 검문소를 두었다. 검문소는 장부를 본다. 군인은 총보다 증표를 먼저 확인한다. 기계 몸을 기재한 정부 사람이 아크의 정비대에 갈 때도 이 검문소를 지난다. 아크는 정부 사람이 아크 땅 깊이 들어오지 않도록 터널 남쪽 입구에서 정부 쪽 기계 몸의 정비를 받는다.

세 터널에는 무전이 터널을 따라 흐르는 말줄이 깔려 있다. 말줄을 쥔 사람은 그 구간의 말을 들을 수 있으니, 세 정체가 이 터널들의 말줄을 두고 다툰다. 강을 군대로 건너지 않는 서울에서 세 터널은 누가 쥐느냐가 곧 싸움의 판이다.

## 테두리 망대

서울 행정 경계 바깥 2~10킬로미터의 띠를 대정전 무렵의 전쟁 기계가 돈다. 기계들은 사람이 내린 마지막 명령, 곧 수도 봉쇄를 백 년째 지킨다. 띠 안에서 움직이는 것과 띠를 가로지르는 것을 적으로 본다. 그 띠를 서울 사람은 테두리라 부른다.

정부는 북쪽 산, 곧 북한산, 도봉산, 수락산, 불암산에 테두리를 내려다보는 **망대**를 둔다. 구 부대가 망대를 지킨다. 망대의 일은 싸우는 것이 아니라 보는 것이다. 기계가 띠의 어디를 돌고 있는지, 눈보라가 언제 오는지를 본다. 기계는 움직임과 열을 보므로, 망대에서는 불을 드러내지 않는다.

자유도시 쪽에서는 서울 경계에 붙은 금천의 경계조가 테두리를 가장 가까이서 지켜본다. 서쪽 끝의 강서, 서남쪽 끝의 구로, 남쪽 끝의 관악도 테두리를 마주한다. 아크에서는 테두리 망꾼이 경계 역에서 바깥을 지켜본다. 눈보라가 기계의 눈을 가리는 2~4일이 테두리를 넘는 유일한 때이고, 넘어간 사람은 거의 돌아오지 않는다. 돌아온 사람은 부서진 기계의 동력 덩이를 들고 온다.

## 차량기지 작업장

레일 위의 탈것을 고치는 곳은 옛 차량기지의 작업장이다. 사람들이 눈을 파내 지붕을 덮고 터널과 이은 곳만 살아 있다. 신정, 구로, 천왕, 방화(자유도시), 군자, 창동(정부), 고덕(아크)이다. 자세한 것은 [사람과 기계](/wiki/People-and-Machines/)에 있다.

## 함께 읽기

- [아직 도는 것](/wiki/Lost-Technology-Lineage/): 서울의 전기와 열
- [사람과 기계](/wiki/People-and-Machines/): 레일 위의 탈것과 차량기지
- [총, 탄, 드론](/wiki/Era-Arms-and-Tech-Level/): 그물과 말줄, 검문소의 싸움
- [급수계약과 세 정체](/wiki/World-Relation-Ledger/): 서른 해마다 맺는 물의 약속
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Synthetic-Actors', 'Humanoids', '휴머노이드', 'people-and-machines', 1, '## Machines in human shape

Humanoids are human-shaped machines built before the Great Blackout. They stand on two legs, carry loads in two arms, and were made to pass through the stairs and doors people used. Seoul in 2126 still has humanoids, but they are very scarce. Most Seoul people see a humanoid once or twice in their lives. Those who have seen one usually say it was slower than they expected, quieter than they expected, and had more hands attending it than they expected.

A humanoid is not a thinking person. It does not answer when called by name and wants nothing for itself. It is a machine that repeats one set task and a few words of guidance. This page covers where they are now and how many, who keeps them alive, and how Seoul people treat them.

## Where they came from

At the time of the Great Blackout Seoul''s large distribution warehouses and factories had many machines that sorted and carried goods. Most rolled on wheels; some were built in human shape so they could step straight into places where people had worked. When the Great Blackout cut the power, they all stopped.

In the frozen underground, machines do not rot. Rust is slow and grease only stiffens. So the basements of buried warehouses still hold machines from a hundred years ago, asleep. When people bring power back into such a building or connect a battery, the machines wake and take up their work of a hundred years ago. Today''s people are not on the lists and schedules of that work, so a waking machine sees a person as a load or as something blocking the way. Every humanoid working today is a sleeping machine of this kind that people dragged out, repaired and tamed.

## How many there are

In 2126 Seoul has about 150 revived worker machines put to work. About 60 of them are human-shaped, that is, humanoids; the rest are wheeled.

| Polity | Humanoids | Where most are |
|---|---|---|
| Free Cities | about 40 | The workshops of Guro and Cheonwang, the Sinjeong depot in Yangcheon, the stores of the Yeongdeungpo market |
| Arc | about 15 | Around Jamsil. The stations that the water-wheel power reaches |
| Government | about 5 | Stores of the ministries and district offices |

The number falls a little each year. Inside a humanoid are circuit boards and sensing elements that Seoul cannot make. When one dies, a live one must be transplanted from another machine, and if there is none to transplant, the humanoid stops. A stopped humanoid is not thrown away. Its joints, motors and plates become parts of other machines and of human bodies. Fewer humanoids are newly woken and tamed than stop.

## What they do

A humanoid repeats a single task. Seoul usually gives it one of three.

- **Carrying loads.** One carries the loads of five people. Unlike wheeled machines it can climb stairs and ladders, so it is most useful in the vertical shafts of entrances and on the stairs between platforms.
- **Watching a pump.** It stands beside a pump, turns the handle at set times, and stops when the sound changes. It is a machine that keeps a pump until a person comes.
- **Clearing entrance snow.** After a blizzard it shovels snow out of a blocked entrance. It cannot work long in the cold, so people take turns beside it.

The only words a humanoid says are a few guidance phrases used in the old warehouses and factories, such as "Please clear the aisle" or "Loading complete". Seoul people sometimes mimic them and laugh, but when they hear the words they step aside. They are taught that standing in the way of a waking machine is dangerous.

## What they eat

One humanoid draws about 150 W on average through the day, the platform heating share of four people. Counted in carrying, it does the work of five people, which looks like a good bargain; but put into a heat pump that electricity would become three times the heat and warm about eleven people. So humanoids are found where hands are short and electricity is spare: the Free Cities and the area around Jamsil. They are rare in the Government, where hands are plentiful.

Humanoids follow the battery rules too. Charging is never done below freezing, so it happens only on warm levels. On the surface the battery gives only half and the joints stiffen, so surface work is cut short. A humanoid holds circuit boards, so it is inspected every 30 days, and board hands and motor winders attend to keep it alive. There are always a few people beside one humanoid.

## Who keeps them alive

Most of the hands that keep humanoids alive are in the Free Cities. A board hand to transplant circuit boards, a motor winder to rewind motors and a lathe hand to machine joints must all attend for one to keep running. So a humanoid usually belongs to a workbench. One workbench beside the Cheonwang depot keeps several humanoids and takes contracts to carry goods and scrap with them.

The Arc''s maintenance benches also tend humanoids. But a bench''s hands see to the machines on human bodies first. A humanoid is tended only after the maintenance turns of the baptised have all come round.

## How each polity sees humanoids

- **The Government.** In the Government''s ledger a humanoid is entered not as a person but as registered goods, in the same column as a gun or a radio. Because it is registered goods, losing one leaves a mark in the sentence entry of the person responsible. Government people would rather use that electricity to warm people than run a humanoid.
- **The Free Cities.** Free City contracts write a humanoid down as "five hands'' share". A humanoid''s work is lent out by the day, and the borrower supplies that day''s charge. A humanoid cannot give surety, so the workbench that keeps it gives surety for the work it does.
- **The Arc.** Arc people count changing one place of the body into a machine as faith. Yet a humanoid, machine through and through, does not count in the number of baptisms. Arc people say of a humanoid, "all parts and no person". Baptism is something a person does, and a humanoid has no body to receive a machine.

## There is no thinking machine

Now and then a story goes round Seoul that somewhere there is a human-shaped machine that thinks and speaks for itself. There is no such machine. Among the machines people use inside Seoul, not one speaks or judges for itself. For Seoul people the only thinking machine is the First AI, and it has no presence inside Seoul.

Every machine that seems to speak is a machine repeating old words. Humanoids repeat the guidance of the old warehouses, the [Care Wheels](/wiki/Hostile-Group-G15/) of buried hospitals repeat old patient lists, and the [Doenoemi](/wiki/Hostile-Group-G24/) of the rim repeat old broadcasts. Seoul people say: "A talking machine only speaks old words."

## Read together

- [People and Machines](/wiki/People-and-Machines/): the three groups of machines inside Seoul and vehicles on the rails
- [What Still Runs](/wiki/Lost-Technology-Lineage/): circuit boards and the "cannot make" list
- [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/): the First AI as a thinking machine
', '## 사람 꼴 기계

휴머노이드는 대정전 전에 만든 사람 꼴 기계다. 두 다리로 서고, 두 팔로 짐을 들고, 사람이 다니던 계단과 문을 그대로 지나도록 만들었다. 2126년 서울에도 휴머노이드가 있다. 다만 아주 귀하다. 서울 사람 대부분은 평생 한두 번 휴머노이드를 본다. 본 사람은 대개 그것이 생각보다 느리고, 생각보다 조용하고, 생각보다 많은 손이 붙어 있는 기계였다고 말한다.

휴머노이드는 생각하는 인격이 아니다. 이름을 불러도 답하지 않고, 스스로 무엇을 바라지도 않는다. 정해진 일 하나와 몇 마디 안내말을 되풀이하는 기계다. 이 문서는 그 기계가 지금 어디에 몇이나 있고, 누가 살려 두며, 서울 사람이 그것을 어떻게 대하는지를 다룬다.

## 어디서 왔나

대정전 무렵 서울의 큰 물류 창고와 공장에는 짐을 고르고 나르는 기계가 많았다. 바퀴로 구르는 것이 대부분이었고, 사람이 일하던 자리에 그대로 들어가도록 사람 꼴로 만든 것도 있었다. 대정전으로 전기가 끊기자 그 기계들은 모두 멎었다.

언 지하에서 기계는 썩지 않는다. 녹은 느리고 기름은 굳을 뿐이다. 그래서 묻힌 창고 지하에는 백 년 전의 기계가 잠든 채로 남아 있다. 사람이 그 건물에 전기를 다시 넣거나 전지를 이으면 기계는 깨어나 백 년 전 일을 다시 한다. 그 일의 명단과 순서표에는 지금의 사람이 없으니, 깨어난 기계는 사람을 짐으로 보거나 길을 막는 것으로 본다. 오늘 일하는 휴머노이드는 모두 그렇게 잠들어 있던 기계를 사람이 끌어내 고치고 길들인 것이다.

## 몇이나 있나

2126년 서울에서 다시 살려 일을 시키는 일꾼 기계는 약 150대다. 그 가운데 사람 꼴, 곧 휴머노이드는 약 60대이고 나머지는 바퀴 꼴이다.

| 정체 | 휴머노이드 | 주로 있는 곳 |
|---|---|---|
| 자유도시들 | 약 40대 | 구로와 천왕의 작업장, 양천 신정 기지, 영등포 장터 곳간 |
| 아크 | 약 15대 | 잠실 둘레. 수차 전기가 닿는 역 |
| 정부 | 약 5대 | 부처와 구청의 창고 |

이 수는 해마다 조금씩 준다. 휴머노이드의 몸속에는 서울에서 만들지 못하는 회로판과 감지 소자가 들어 있다. 그것이 죽으면 다른 기계에서 산 것을 옮겨 심어야 하고, 옮겨 심을 것이 없으면 그 휴머노이드는 멎는다. 멎은 휴머노이드는 버리지 않는다. 관절과 모터와 판은 다른 기계와 사람 몸의 부품이 된다. 새로 깨워 길들이는 휴머노이드는 멎는 것보다 적다.

## 무엇을 하나

휴머노이드는 한 가지 일만 되풀이한다. 서울에서 시키는 일은 대개 셋이다.

- **짐 나르기.** 한 대가 사람 다섯 몫의 짐을 나른다. 바퀴 꼴 기계와 달리 계단과 사다리를 오를 수 있어서, 출입구의 세로 굴과 승강장 사이 계단에서 가장 쓸모 있다.
- **펌프 지키기.** 펌프 곁에 서서 정해진 때에 손잡이를 돌리고, 소리가 바뀌면 멈춰 선다. 사람이 오기 전까지 펌프를 지키는 기계다.
- **출입구 눈 치우기.** 눈보라 뒤 막힌 출입구의 눈을 퍼낸다. 추위 속에서 오래 일하지 못하므로, 사람이 교대로 곁에 붙는다.

휴머노이드가 하는 말은 옛 창고와 공장에서 쓰던 안내말 몇 마디뿐이다. "통로를 비워 주십시오", "적재 완료" 같은 말이다. 서울 사람은 이 말을 따라 하며 웃기도 하지만, 그 말이 들리면 길을 비킨다. 깨어난 기계 앞을 막고 서 있는 것은 위험하다고 배우기 때문이다.

## 무엇을 먹나

휴머노이드 한 대는 하루 평균 약 150 W를 먹는다. 사람 네 명의 승강장 난방 몫이다. 짐 나르기로 치면 사람 다섯 몫의 일을 하니 남는 장사처럼 보이지만, 그 전기를 열 펌프에 넣으면 세 배의 열이 되어 사람 열하나를 데울 수 있다. 그래서 휴머노이드는 일손이 모자라고 전기가 남는 곳에 있다. 자유도시들과 잠실 둘레다. 일손이 넘치는 정부에는 드물다.

휴머노이드도 전지의 규칙을 따른다. 영하에서는 충전하지 않으니 충전은 따뜻한 층에서만 한다. 지상에 나가면 전지가 반만 내놓고 관절이 굳으니, 지상 일은 짧게 끊는다. 회로판이 든 물건이라 30일마다 점검을 받고, 판공과 권선공이 붙어 살린다. 휴머노이드 한 대 곁에는 늘 사람 몇이 있다.

## 누가 살려 두나

휴머노이드를 살려 두는 손은 대부분 자유도시에 있다. 회로판을 옮겨 심는 판공, 모터를 다시 감는 권선공, 관절을 깎는 선반공이 함께 붙어야 한 대가 돈다. 그래서 휴머노이드는 대개 작업대의 것이다. 천왕 차량기지 곁의 한 작업대는 휴머노이드 몇 대를 거느리고, 그 휴머노이드로 짐과 고물을 나르는 일을 계약으로 받는다.

아크의 정비대도 휴머노이드를 손본다. 다만 정비대의 손은 사람 몸의 기계가 먼저다. 휴머노이드는 세례자의 정비 차례가 다 돈 뒤에 손을 본다.

## 정체마다 휴머노이드를 보는 눈

- **정부.** 정부 장부에 휴머노이드는 사람이 아니라 기재품으로 오른다. 총이나 무전기와 같은 칸이다. 기재품이니 잃으면 맡은 사람의 처분 칸에 남는다. 정부 사람은 휴머노이드를 부리기보다 그 전기로 사람을 데우는 쪽을 고른다.
- **자유도시들.** 자유도시 계약서는 휴머노이드를 "손 다섯 몫"으로 적는다. 휴머노이드의 일은 날 단위로 빌려주고, 빌린 쪽이 그날의 충전을 댄다. 휴머노이드는 보증을 설 수 없으니, 휴머노이드가 한 일의 보증은 그것을 거느린 작업대가 선다.
- **아크.** 아크 사람은 몸의 한 곳을 기계로 바꾸는 것을 신앙으로 센다. 그런데 휴머노이드는 온몸이 기계인데도 세례의 수에 들지 않는다. 아크 사람은 휴머노이드를 두고 "부위만 있고 사람이 없다"고 말한다. 세례는 사람이 하는 것이고, 휴머노이드에게는 기계를 받아들일 몸이 없다는 뜻이다.

## 생각하는 기계는 없다

서울에는 스스로 생각하고 말하는 사람 꼴 기계가 어딘가에 있다는 이야기가 가끔 돈다. 그런 기계는 없다. 서울 안에서 사람이 쓰는 기계 가운데 스스로 말하고 판단하는 기계는 하나도 없다. 서울 사람에게 생각하는 기계란 최초의 AI 하나뿐이고, 그것은 서울 안에 모습이 없다.

말하는 듯이 보이는 기계는 모두 옛말을 되풀이하는 기계다. 휴머노이드는 옛 창고의 안내말을, 묻힌 병원의 [돌봄바퀴](/wiki/Hostile-Group-G15/)는 옛 환자 명단을, 테두리의 [되뇌미](/wiki/Hostile-Group-G24/)는 옛 방송을 되풀이한다. 서울 사람은 이렇게 말한다. "말하는 기계는 옛말만 한다."

## 함께 읽기

- [사람과 기계](/wiki/People-and-Machines/): 서울 안의 기계 세 무리와 레일 위의 탈것
- [아직 도는 것](/wiki/Lost-Technology-Lineage/): 회로판과 "못 만든다"의 목록
- [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/): 생각하는 기계로서의 최초의 AI
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Values-and-Policy-Scales', 'Values and Policy Scales', '가치관과 정책 척도', 'culture', 0, 'People who live through the same winter still put different things first. One waits for approval, one asks for the numbers, one mends the body. This wiki records a person''s values on ten axes. The polities lean along the same axes. The Government, the Free Cities and Arc each lean a different way, and people raised in a polity usually lean its way. This document records those axes and leanings, and which side each of the three polities chooses on the great questions.

## How to Read the Scales

Each axis runs from −100 to 100. The left end is −100 and the right end is 100. Zero means not yet leaning either way on that axis; it is not a value that counts indifference as a virtue. Values are written in steps of 5.

Values tell what a person will choose when something large is at stake. Whom a person seeks to be close to, and how, is recorded separately from values (see Desire below).

## The Ten Axes

| # | Axis | −100 side | +100 side | The question that divides this axis in Seoul |
|---|---|---|---|---|
| 1 | Authority | Agreement and bargaining. Decided together | Command and approval. Decided from above | Who closes the entrance in a blizzard, who seals a contract |
| 2 | Openness | Shut the door. Do not take in those who cross over | Open the door. Take in those who cross over | Should we let in people off the ledger, should we give work to a labour hand who fled here |
| 3 | Force | Contracts and waiting | Strike first | Should we close the under-river tunnels, should we chase the perimeter-runners |
| 4 | Material | Records and rites come first | Stores and shares come first | Should old official documents be used as fibre, should the parts of the dead be sold |
| 5 | Communal | Look after your own body | Look after your house and your station | Should I fill the empty vat, or take my own share first |
| 6 | Principle | The reckoning of the moment | The written article and the seal | Should we take back a person whose seal was broken, should we break a notice |
| 7 | Public | Hide. The ledger is read only inside | Post it. Prices are written on the rate board | Should the maintenance list be shown, should we record who brought back a power core |
| 8 | Eligibility | Weigh blood and ties | Weigh examinations, registration and shown skill | Should the bench pass to an eldest child who cannot show the skill |
| 9 | Dispersed | Gather it in one place | Divide it by city, by station | Who should hold water and electricity, should a contract be one or many |
| 10 | Transformative | Keep it. Leave the old form as it is | Mend it. Change it to a new form | Should a machine be fitted to the body, should an article of the code be changed |

## The Leanings of the Three Polities

| Polity | Authority | Openness | Force | Material | Communal | Principle | Public | Eligibility | Dispersed | Transformative |
|---|---|---|---|---|---|---|---|---|---|---|
| Government | 40 | −30 | 10 | 0 | 20 | 40 | −20 | 30 | −40 | −30 |
| The Free Cities | −30 | 20 | −20 | 40 | 0 | 10 | 30 | 40 | 50 | 10 |
| Arc | 30 | −10 | 0 | −30 | 40 | 10 | −40 | 0 | −20 | 40 |
| Unaffiliated | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**Government.** It is a state of ledgers. Approval and public notices decide things (Authority 40), and the written article is kept (Principle 40). People off the ledger are not citizens (Openness −30). It tries to gather people, water and electricity into Gwanghwamun and the district offices (Dispersed −40), and to keep the forms carried on from the Republic of Korea (Transformative −30). Its strata have hardened by blood, but the ledger counts people by registration and examination (Eligibility 30). The ledger is read only inside (Public −20).

**The Free Cities.** There is no seat above them (Authority −30). Each city rules by its own law, and a contract binds only the cities that set their seal on it (Dispersed 50). They post prices on the rate board (Public 30) and speak in stores and shares (Material 40). Skill cannot be measured, so they measure shown skill and kept sureties (Eligibility 40). They take in even people who fled the Government''s ledger, as labour hands (Openness 20). They reach for a contract before a fight (Force −20).

**Arc.** The Hierophant''s word becomes law (Authority 30). Mending the body and using it is the faith (Transformative 40), and the Near Houses and maintenance benches share out meals and parts (Communal 40). Parts belong to the faith and cannot be sold (Material −30). The maintenance lists and the work of the sealing are known only inside (Public −40). Whether blood or steel comes first is always disputed inside Arc, so on the axis of Eligibility it leans neither way (Eligibility 0).

**Unaffiliated.** They take no polity''s leaning. Their values are only their own.

## Each Person''s Leaning

A person''s values are their polity''s leaning with their own inclinations laid on top. A person raised in the Government may want to open the door wider than others, and a Free City person may miss having someone to approve things. For people with detailed records, their own inclinations remain as they are.

For people with short records, the leaning of their polity is added to the lean their work gives them.

| Kind of work | How it leans a person |
|---|---|
| Governance | Authority +10 |
| Fighting | Force +15 |
| Guarding | Force +10, Principle +5 |
| Care | Communal +10 |
| Fitting | Transformative +10 |
| Provision | Communal +10 |
| Labour | Communal +5, Force +5 |
| Trade | Material +10, Openness +5 |
| Carrying word | Openness +10 |
| Repair | Eligibility +10 |
| Scouting | Openness +5, Public −5 |
| Record | Principle +10, Public +5 |

For example, a Government ration clerk with a short record takes the Government''s leaning plus the lean of trade, giving Material 10 and Openness −25. An Arc person with a short record who fits machines to bodies has Transformative 50.

## The Choices of the Polities

Polities, like people, choose when great questions come. The table below shows which side each of the three polities is choosing now, in the winter of 2126, on each great question. When a head changes, the choice may change too.

| Question | Government | The Free Cities | Arc |
|---|---|---|---|
| War | Holds. Since it was broken on the ice in 2079 it does not send armies across the river, and keeps checkpoints at the north mouths of the under-river tunnels | Holds. There is no standing army, and each city''s militia guards its own stations and crossings | Fights short. It holds the border stations and tunnel mouths, and meets at once anything that touches the water wheels or the intake |
| Crossing | Crossing needs a coupon. A registered person who crosses the river without one is struck off. People off the ledger enter only with an invitation coupon | Does not stop people leaving. Takes a crossing share at bridge ends and tunnel mouths | Looks not at paper but at the body. The Bench Keeper at a border station checks the parts of those who cross |
| Water | Gives intake sites, old water mains and hands, and receives maintenance and parts | Each city gives the maintenance of the pumps and water wheels in its charge, and receives hands, firewood and sites | Gives the electricity of the Jamsil underwater weir and the river water of Amsa, and seeks hands for major repairs and a promise not to block the north end of the weir |
| Work | Passes down the registered trade. People cannot change where they live or what they do at will | Passes down the workbench. The one who shows the skill carries on the bench | Raises hands at the maintenance bench. Those on the baptismal list receive maintenance turns |
| Records | The ledger is everything. Old official documents are not eaten | Keeps contracts and surety boards. Contracts stay on record at the market | The Hierophant''s rulings are not written down; they become law as people repeat them |
| Skill | Keeps maintenance instructions in ministry archives and hands them down to households by notice | Each workbench holds its own skill. Benches doing the same work know one another across cities | Hands down the knowledge from the manual to each maintenance bench only as needed, by word and by hand |
| Trade | Keeps to the principle of not trading with those off the ledger. So all its trade takes the form of a "contract" | Runs on markets and contracts. Prices are posted on the rate board | There is no market inside. With outsiders it trades only at five exchange posts |
| Inheritance | The seat of a Member of the National Assembly passes to the heir of the house | Differs from city to city | The seat of the Head of a Near House follows blood, but the heir must have two or more parts |
| Marriage | Valid only once the Dong Chief registers it in the ledger | A household contract between two houses. A single marriage, a contract of living together and a contract among several people who live together all take the same form of contract | Arranged between houses, and a Near House marriage is politics. Baptism is not a condition of marriage |

**Divisions within a polity.** Even within one polity, people quarrel along each axis. The Government''s OMO Party is the party of contracts. It holds that the ledger can live only by making contracts across the river and bringing in skills and parts. The Claw Party is the party of the ledger. It holds that the Government must live by the land and hands north of the river, and that mixing with those off the ledger will bring the ledger down. The two parties divide on the axes of Openness and Dispersed, and the division shows every time a water contract comes round. The Free Cities lean differently city by city: Gangseo measures watts, Guro measures the sureties it has kept, and Geumcheon measures coming back alive from the rim. In Arc, part counts cut across the ranking of houses. A bench worker with many parts can come before a Near House cousin in the maintenance order.

## Desire

If values are the choices made before great matters, desire is whom a person seeks to be close to, and how. This wiki records desire on five axes.

| # | Axis | −100 side | +100 side |
|---|---|---|---|
| 1 | Longing | Restraint | Strong |
| 2 | Exclusivity | Sharing, an open place | Exclusive, jealous |
| 3 | Risk | Safe, predictable | Risky, forbidden |
| 4 | Display | Hidden | Shown |
| 5 | Duration | A while | Long together |

Desire is a person''s temperament, so it is not set by their work. Only people with detailed records have desire recorded. A person''s orientation and the way they form unions are recorded separately, and no polity assigns a person''s orientation.

## Related Documents

- [People, Factions and Trades](/wiki/Characters-Factions-and-Professions/)
- [The Three Polities of Seoul](/wiki/Sixteen-States/)
- [Government Society](/wiki/Government-Society/)
- [Free City Society](/wiki/Free-City-Society/)
- [Arc Society](/wiki/Arc-Society/)
- [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/)
', '같은 겨울을 살아도 사람마다 무엇을 앞세우는지는 다르다. 누구는 결재를 기다리고, 누구는 수치를 묻고, 누구는 몸을 고친다. 이 위키는 사람의 가치관을 열 개의 축으로 적는다. 정체도 같은 축 위에서 기운다. 정부, 자유도시들, 아크는 저마다 다른 쪽으로 기울어 있고, 그 정체에서 자란 사람은 대개 그쪽으로 기운다. 이 문서는 그 축과 기울기, 그리고 세 정체가 큰 물음마다 어느 쪽을 고르는지를 적는다.

## 척도 읽는 법

축마다 값은 −100부터 100까지다. 왼쪽 끝이 −100, 오른쪽 끝이 100이다. 0은 그 축에서 아직 어느 쪽으로도 기울지 않았다는 뜻이고, 무관심을 미덕으로 치는 값이 아니다. 값은 5 단위로 적는다.

가치관은 큰일 앞에서 그 사람이 무엇을 고를지를 말해 준다. 사람이 누구와 어떻게 가까워지려 하는지는 가치관과 따로 적는다(아래 욕망 절).

## 열 개의 축

| # | 축 | −100 쪽 | +100 쪽 | 서울에서 이 축이 갈리는 물음 |
|---|---|---|---|---|
| 1 | 권위 | 합의와 흥정. 모여서 정한다 | 명령과 결재. 위에서 정한다 | 눈보라 속 출입구를 누가 닫나, 계약에 누가 도장을 찍나 |
| 2 | 개방 | 문을 닫는다. 건너온 사람을 들이지 않는다 | 문을 연다. 건너온 사람을 받는다 | 장부 밖 사람을 들일까, 달아나 온 일손에게 일을 줄까 |
| 3 | 무력 | 계약과 기다림 | 먼저 친다 | 강 밑 터널을 막을까, 테두리꾼을 쫓을까 |
| 4 | 물질 | 기록과 의례를 앞세운다 | 재고와 몫을 앞세운다 | 옛 공문서를 섬유로 쓸까, 죽은 이의 부위를 팔까 |
| 5 | 공동 | 제 몸 하나를 챙긴다 | 집안과 역을 챙긴다 | 빈 통을 채울까, 내 몫을 먼저 챙길까 |
| 6 | 원칙 | 그때그때의 셈 | 적힌 조문과 도장 | 깨진 도장의 사람을 다시 받을까, 고시를 어길까 |
| 7 | 공개 | 감춘다. 장부는 안에서만 본다 | 내건다. 값은 셈판에 쓴다 | 정비 명단을 보일까, 동력 덩이를 누가 가져왔는지 적을까 |
| 8 | 자격 | 피와 인연을 따진다 | 시험과 기재와 보인 손을 따진다 | 손을 보이지 못한 맏이에게 대를 물릴까 |
| 9 | 분산 | 한곳에 모은다 | 도시마다, 역마다 나눈다 | 물과 전기를 누가 쥘까, 계약을 하나로 맺을까 여럿으로 맺을까 |
| 10 | 변혁 | 지킨다. 옛 꼴 그대로 둔다 | 고친다. 새 꼴로 바꾼다 | 몸에 기계를 맞출까, 법전의 조문을 고칠까 |

## 세 정체의 기울기

| 정체 | 권위 | 개방 | 무력 | 물질 | 공동 | 원칙 | 공개 | 자격 | 분산 | 변혁 |
|---|---|---|---|---|---|---|---|---|---|---|
| 정부 | 40 | −30 | 10 | 0 | 20 | 40 | −20 | 30 | −40 | −30 |
| 자유도시들 | −30 | 20 | −20 | 40 | 0 | 10 | 30 | 40 | 50 | 10 |
| 아크 | 30 | −10 | 0 | −30 | 40 | 10 | −40 | 0 | −20 | 40 |
| 무소속 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**정부.** 장부의 나라다. 결재와 고시가 일을 정하고(권위 40), 적힌 조문을 지킨다(원칙 40). 장부 밖 사람은 국민이 아니다(개방 −30). 사람과 물과 전기를 광화문과 구청으로 모으려 하고(분산 −40), 대한민국에서 이어 온 꼴을 지키려 한다(변혁 −30). 계층은 피로 굳었지만, 장부는 사람을 기재와 시험으로 센다(자격 30). 장부는 안에서만 본다(공개 −20).

**자유도시들.** 윗자리가 없다(권위 −30). 도시마다 제 법으로 다스리고, 계약은 도장 찍은 도시만 묶는다(분산 50). 셈판에 값을 내걸고(공개 30), 재고와 몫으로 말한다(물질 40). 기술의 높낮이는 잴 수 없으니 보인 손과 지킨 보증을 잰다(자격 40). 정부 장부에서 달아나 온 사람도 일손으로 받는다(개방 20). 싸움보다 계약을 먼저 꺼낸다(무력 −20).

**아크.** 교주의 말이 법이 된다(권위 30). 몸을 고쳐 쓰는 것이 신앙이고(변혁 40), 곁집과 정비대가 끼니와 부품을 나눈다(공동 40). 부위는 신앙의 것이라 팔 수 없다(물질 −30). 정비 명단과 봉인의 일은 안에서만 안다(공개 −40). 피와 쇠 가운데 무엇이 앞서는지는 아크 안에서 늘 다툼거리라, 자격의 축에서는 어느 쪽으로도 기울지 않는다(자격 0).

**무소속.** 어느 정체의 기울기도 받지 않는다. 가치관은 그 사람 자신의 것뿐이다.

## 사람마다의 기울기

사람의 가치관은 그 사람이 자란 정체의 기울기 위에 그 사람 자신의 성향이 얹힌 것이다. 정부에서 자란 사람이라도 남보다 문을 더 열고 싶어 할 수 있고, 자유도시 사람이라도 결재를 그리워할 수 있다. 기록이 자세한 사람은 그 사람의 성향이 그대로 남아 있다.

기록이 짧은 사람은 정체의 기울기에, 하는 일이 사람을 기울이는 만큼을 더한다.

| 일의 갈래 | 사람을 기울이는 쪽 |
|---|---|
| 다스림 | 권위 +10 |
| 싸움 | 무력 +15 |
| 지킴 | 무력 +10, 원칙 +5 |
| 돌봄 | 공동 +10 |
| 맞춤 | 변혁 +10 |
| 먹거리 | 공동 +10 |
| 노역 | 공동 +5, 무력 +5 |
| 거래 | 물질 +10, 개방 +5 |
| 오감 | 개방 +10 |
| 고침 | 자격 +10 |
| 살핌 | 개방 +5, 공개 −5 |
| 기록 | 원칙 +10, 공개 +5 |

예를 들어 기록이 짧은 정부의 배급 서기는 정부의 기울기에 거래의 기울기를 더해 물질 10, 개방 −25가 된다. 몸에 기계를 맞추는 일을 하는 기록이 짧은 아크 사람은 변혁 50이 된다.

## 정체의 선택

정체도 사람처럼 큰 물음 앞에서 고른다. 아래 표는 2126년 겨울, 세 정체가 큰 물음마다 지금 고르고 있는 쪽이다. 우두머리가 바뀌면 선택도 바뀔 수 있다.

| 물음 | 정부 | 자유도시들 | 아크 |
|---|---|---|---|
| 싸움 | 지킨다. 2079년 얼음판에서 꺾인 뒤로 강을 군대로 넘지 않고, 강 밑 터널의 북쪽 입구에 검문소를 둔다 | 지킨다. 상비군이 없고, 도시마다 민병이 제 역과 건널목을 지킨다 | 짧게 싸운다. 경계 역과 터널 입구를 지키고, 수차와 취수구를 건드리는 것에는 바로 맞선다 |
| 건넘 | 증표가 있어야 건넌다. 증표 없이 강을 건넌 등재민은 말소된다. 장부 밖 사람은 초청 증표가 있어야 들어온다 | 나가는 사람을 막지 않는다. 다리 끝과 터널 입구에서 건너는 몫을 받는다 | 종이를 보지 않고 몸을 본다. 경계 역의 정비장이 건너오는 사람의 부위를 확인한다 |
| 물 | 취수구 자리와 옛 관로와 일손을 내고, 정비와 부품을 받는다 | 도시마다 맡은 펌프와 수차의 정비를 내고, 일손과 땔감과 자리를 받는다 | 잠실수중보의 전기와 암사의 강물을 내고, 큰 수리의 손과 보 북쪽 끝을 막지 않는다는 약속을 받으려 한다 |
| 일 | 기재된 직종을 물린다. 사는 곳과 일을 마음대로 바꿀 수 없다 | 작업대를 물린다. 손을 보인 사람이 대를 잇는다 | 정비대에서 손을 기른다. 세례 명단에 오른 사람이 정비 순번을 받는다 |
| 기록 | 장부가 모든 것이다. 옛 공문서는 먹지 않는다 | 계약서와 보증판을 남긴다. 장터에 계약서가 남는다 | 교주의 판정은 글로 적지 않고, 사람들이 되풀이해 말하면서 법이 된다 |
| 기술 | 부처의 서고에 정비 지침을 두고, 그것을 집안에 고시로 내린다 | 작업대마다 제 기술을 쥔다. 같은 일을 하는 대들은 도시를 넘어 서로 안다 | 매뉴얼에서 나온 지식을 정비대마다 필요한 만큼만 입과 손으로 내린다 |
| 거래 | 장부 밖과 장사하지 않는다는 원칙을 지킨다. 그래서 모든 교역이 "계약"의 꼴이다 | 장터와 계약으로 돌린다. 값은 셈판에 내건다 | 안에는 장터가 없다. 바깥과는 다섯 바꿈터에서만 바꾼다 |
| 대물림 | 국회의원의 의석은 집안의 후계에게 물린다 | 도시마다 다르다 | 곁집장의 자리는 피를 따르되 부위가 둘 이상이어야 한다 |
| 혼인 | 동장이 장부에 기재해야 성립한다 | 두 집안이 맺는 가구 계약이다. 단혼도, 계약 동거도, 함께 사는 여러 사람의 계약도 같은 계약의 꼴이다 | 집안끼리 정하고, 곁집의 혼인은 정치다. 세례는 혼인의 조건이 아니다 |

**정체 안의 갈림.** 한 정체 안에서도 축마다 다툰다. 정부의 OMO당은 계약의 당이다. 강 건너와 계약을 맺어 기술과 부품을 들여와야 장부도 산다고 본다. 클로당은 장부의 당이다. 강 북쪽 땅과 일손으로 자급해야 하며 장부 밖과 섞이면 장부가 무너진다고 본다. 개방과 분산의 축에서 두 당이 갈리고, 급수계약이 올 때마다 그 갈림이 드러난다. 자유도시들은 도시마다 기울기가 다르다. 강서는 와트를, 구로는 지킨 보증을, 금천은 테두리에서 살아 돌아온 일을 잰다. 아크에서는 부위 수가 가문 서열을 가로지른다. 부위가 많은 정비공은 정비 순번에서 곁집 사촌보다 앞설 수 있다.

## 욕망

가치관이 큰일 앞의 선택이라면, 욕망은 사람이 누구와 어떻게 가까워지려 하는지다. 이 위키는 욕망을 다섯 축으로 적는다.

| # | 축 | −100 쪽 | +100 쪽 |
|---|---|---|---|
| 1 | 갈망 | 절제 | 강함 |
| 2 | 독점 | 나눔, 열린 자리 | 독점, 질투 |
| 3 | 위험 | 안전, 예측 | 위험, 금지 |
| 4 | 과시 | 감춤 | 드러냄 |
| 5 | 지속 | 한때 | 오래 함께 |

욕망은 사람의 기질이라 하는 일로 정하지 않는다. 기록이 자세한 사람만 욕망이 적혀 있다. 사람의 성향과 맺는 방식은 따로 적고, 어느 정체도 사람의 성향을 정해 주지 않는다.

## 관련 문서

- [인물·세력·생업](/wiki/Characters-Factions-and-Professions/)
- [서울의 세 정체](/wiki/Sixteen-States/)
- [정부 사회](/wiki/Government-Society/)
- [자유도시들의 사회](/wiki/Free-City-Society/)
- [아크 사회](/wiki/Arc-Society/)
- [급수계약과 세 정체](/wiki/World-Relation-Ledger/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('World-Expansion-Index', 'World Index: the Three Polities and the 25 Duchies', '세계 색인: 세 정체와 25공작령', 'overview', 3, '<a id="index-read"></a>

This index gives Seoul''s 25 districts one line each: which polity each district belongs to, which station its head works from, what the person who rules it is called, what the district holds, and which documents to read next. One district is one duchy. Place names, stations and geography stay as they are; only the rule over them is divided district by district.

## How to Read

- **Seat station** is the station where the district''s head works. For the Government it is the station in the district where the most lines meet; for the Free Cities, the seat station each city has chosen; for the Arc, the station where the Head of the Near House lives.
- **Stations** is the number of stations on the map. A few entries appear on the map but are not joined to any line, and nobody lives there.
- **Ruling title** is the title of the person who holds the district. Member of the National Assembly and Duke of Gwanak are settled titles. The rest are the titles in use, but they are not yet settled.
- Who sits in each seat is not recorded in this index. The only settled holder is I Ilseop, Duke of Gwanak. The people in the other seats are in [People, Factions and Trades](/wiki/Characters-Factions-and-Professions/).

<a id="index-overview"></a>

## The Three Polities at a Glance

| Polity | Districts | Stations on the map | People (2126) | Who holds a district | Seat of the whole polity | At the top |
|---|---|---|---|---|---|---|
| Government | The 14 districts north of the Han | 157 | About 160,000 | Member of the National Assembly | The National Assembly (one chamber) | The life president |
| The Free Cities | The 7 southwestern districts | 77 | About 75,000 | Different in each city; in Gwanak, the Duke | None; a contract meeting called for the occasion, and its Host | None |
| Arc | The 4 Gangnam districts | 78 | About 65,000 | Head of the Near House | The Seat of the Four Near Houses | The Hierophant |
| Seoul | 25 districts | 312 | About 300,000 | | | |

An overview of each polity is in [The Three Polities of Seoul](/wiki/Sixteen-States/), and the ladder of titles in [Titles and Offices](/wiki/Offices-and-Ranks/).

<a id="index-government"></a>

## The 14 Government Districts

The Member of the National Assembly elected in each district holds that district''s duchy. One seat per district. The Members choose the life president from among themselves. The President holds no district and works at Gwanghwamun, where the Government Complex Seoul stands. In 2126 the seats are OMO Party 6, Claw Party 8.

| District | Seat station | Stations | Party | Ruling title | What the district holds |
|---|---|---|---|---|---|
| Jongno-gu | Jongno 3-ga | 13 | Claw | Member of the National Assembly | Government Complex Seoul (the ministries and the Assembly chamber), Gwanghwamun station. The head of the Government |
| Jung-gu | Seoul Station | 17 | OMO | Member of the National Assembly | Seoul Station (the largest station), the Bank of Korea, City Hall, the markets of Dongdaemun History & Culture Park and Hoehyeon |
| Yongsan-gu | Samgakji | 12 | OMO | Member of the National Assembly | The Ministry of National Defense and the Capital Defense Command (Samgakji), the north ends of the Yongsan-Noryangjin and Ichon-Dongjak bridges |
| Mapo-gu | Gongdeok | 13 | OMO | Member of the National Assembly | The Mapo-Yeouinaru under-river tunnel, the north ends of the Hapjeong-Dangsan and Digital Media City-Magongnaru bridges, the Gongdeok market |
| Seongdong-gu | Wangsimni | 11 | OMO | Member of the National Assembly | The Ttukdo intake, the Seoul Forest-Apgujeong Rodeo under-river tunnel, the north end of the Oksu-Apgujeong bridge |
| Gwangjin-gu | Konkuk Univ. | 9 | OMO | Member of the National Assembly | The Guui intake, the north end of the Jamsil weir, the Gwangnaru-Cheonho under-river tunnel, the north ends of the Gangbyeon-Jamsillaru and Jayang-Cheongdam bridges |
| Seodaemun-gu | Chungjeongno | 8 | OMO | Member of the National Assembly | The passage between Mapo and Jongno, Chungjeongno and Sinchon |
| Dongdaemun-gu | Cheongnyangni | 9 | Claw | Member of the National Assembly | Cheongnyangni (where many lines meet), the fuel market |
| Jungnang-gu | Sangbong | 10 | Claw | Member of the National Assembly | Sangbong and Mangu, the Mangu burial ground |
| Seongbuk-gu | Bomun | 13 | Claw | Member of the National Assembly | The rim watchposts toward Bukhansan, schools on old university grounds |
| Eunpyeong-gu | Yeonsinnae | 11 | Claw | Member of the National Assembly | Yeonsinnae (a station on a deep line), Bukhansan firewood, the rim toward Bukhansan |
| Gangbuk-gu | April 19th National Cemetery | 11 | Claw | Member of the National Assembly | The April 19th National Cemetery grounds, the rim toward Bukhansan |
| Dobong-gu | Chang-dong | 6 | Claw | Member of the National Assembly | The Chang-dong depot, Dobongsan firewood and rim |
| Nowon-gu | Nowon | 14 | Claw | Member of the National Assembly | The Hwarangdae Korea Military Academy, the rim toward Suraksan and Buramsan, the district with the widest light-fields |

- The four districts on the Han (Mapo, Yongsan, Seongdong, Gwangjin) are all OMO Party. They hold the bridges, tunnels and intakes, so they are hurt first if a contract breaks. Jung-gu and Seodaemun-gu, though not on the river, live off goods from across the river through their markets, so they are OMO Party too. The eight mountain and inland districts are Claw Party.
- The annexes of the third water supply contract hang on the seals of the four districts on the Han.
- The districts of the northern foothills (Seongbuk, Eunpyeong, Gangbuk, Dobong, Nowon) face the rim outside Seoul and hold the mountains'' firewood.

How the Government rules is in [Government Society](/wiki/Government-Society/).

<a id="index-free-cities"></a>

## The 7 Free City Districts

The Free Cities are not one power. Each city is its own power and holds its own duchy. No single ruler stands over the Free Cities, and they have no collective name. There was no way to judge whose skill was higher, so each city found something in its own work that could be measured, and chose its head by that.

| City (district) | Head''s title | How the head is chosen | Seat station | Stations | Sections | People (2126) | Livelihood |
|---|---|---|---|---|---|---|---|
| Gangseo | Wind Keeper | Elected by the wind-field bench owners. For life, but steps down if the wind fields fail to deliver the contracted watts | Gimpo Int''l Airport | 18 | 4 | About 17,000 | Wind-machine electricity, wide light-fields |
| Yangcheon | Depot Master | Handed down within one depot family | Sinjeongnegeori | 7 | 2 | About 4,200 | Rebuilding motors and wheels at the Sinjeong depot, track carts |
| Yeongdeungpo | Market Master | The market families take turns three years at a time in a fixed order | Yeongdeungpo | 18 | 4 | About 20,600 | The great market, water from the Yangpyeong-dong intake, the contract meeting seat |
| Guro | Works Master | The bench owner with the most sureties kept | Guro | 9 | 2 | About 9,600 | Parts and pumps from the old factory sites and the Line 1 depot |
| Geumcheon | Edge Warden | Chosen by the border crews from among those who crossed the rim and came back | Gasan Digital Complex | 3 | 1 | About 3,200 | Power cores brought from outside, well-drilling machines |
| Dongjak | Ferry Keeper | Chosen by the crossing chiefs from among themselves | Noryangjin | 14 | 4 | About 14,000 | Crossing tolls, fish from under the ice |
| Gwanak | Duke | Handed down in I Ilseop''s family | Sillim | 8 | 2 | About 6,200 | Firewood and wood fibre from Gwanaksan, drilling the mountain rock |

- The title Duke of Gwanak, and that I Ilseop is the present Duke of Gwanak, are settled. The titles of the other six cities come from the work each lives by, and are not yet settled.
- When the Government across the river called its districts duchies and handed them to Members of the National Assembly, Gwanak took the same word and declared it would sit in the same seat as the Government. So when Gwanak contracts with the Government, it insists on stamping "duchy to duchy".
- Dongjak is where the three polities meet. Toward the river it faces the Government, toward the land the Arc. Dongjak station joins the Government''s Ichon by Line 4 and the Arc''s Gubanpo by Line 9.
- Gangseo, Guro, Geumcheon and Gwanak, which have stations at Seoul''s edge, face the rim of the machines outside.

How each city is run is in [Free City Society](/wiki/Free-City-Society/), and Guro''s line junction at Sindorim in [Sindorim Junction Cargo Gate](/wiki/Sindorim-Junction-Cargo-Gate/).

<a id="index-arc"></a>

## The 4 Arc Districts

At the head of the Arc is the Hierophant, Go Ye-jin. Believers call her the Messiah. Each of the four districts is held by one of the families that stand beside the Hierophant, the four Near Houses. The gathering of the four Heads of the Near Houses before the Hierophant is called the Seat of the Four Near Houses.

| District | Near House | Seat station | Stations | People (2126) | What the district holds |
|---|---|---|---|---|---|
| Seocho-gu | The Seocho Near House, "the house of the border" | Express Bus Terminal | 18 | About 15,000 | The Arc-side stations of the three land border links with the Free Cities (Bangbae, Naebang, Gubanpo), the exchange post at Express Bus Terminal, watching the rim from Cheonggyesan |
| Gangnam-gu | The Gangnam Near House, "the house of the deep levels" | Suseo | 23 | About 18,000 | Suseo''s deep line level and the parts store of the old depot, large stations such as Seolleung, Samseong and Dogok, the south mouth of the Seoul Forest-Apgujeong Rodeo under-river tunnel |
| Songpa-gu | The Songpa Near House, "the house of the current" | Jamsil | 23 | About 21,000 | The south end of the Jamsil weir water wheels, the exchange posts of Garak Market and Jamsil, the south end of the Gangbyeon-Jamsillaru bridge |
| Gangdong-gu | The Gangdong Near House, "the house at the gate" | Cheonho | 14 | About 11,000 | The Amsa intake and the river water under the ice, the south mouth of the Gwangnaru-Cheonho under-river tunnel, the Godeok depot, watching the rim at the eastern edge |

- The Hierophant''s house is at Jamsil. The Songpa Near House controls the electricity, so it is the strongest of the four, and it shares a station with the Hierophant''s house.
- The Seocho Near House came from the family that was closest to the Free Cities. It is the house in which Free City workshop talk survives most strongly.
- The Gangdong Near House joined last, when the Gangnam shelters were bound into the Arc in 2122, and brought the Amsa intake with it.
- The Arc calls a dong by its old name, "shelter". Each shelter from before the Arc was bound together is a shelter today.
- Who heads each Near House is not yet settled.

How the Arc is ruled, and baptism, are in [Arc Society](/wiki/Arc-Society/).

<a id="index-borders"></a>

## The Thirteen Border Links

There are thirteen line links where the polity changes. By district, the borders are kept on the Government side by the four districts Mapo, Yongsan, Seongdong and Gwangjin; on the Free City side by the three districts Gangseo, Yeongdeungpo and Dongjak; and on the Arc side by the four districts Seocho, Gangnam, Songpa and Gangdong.

| Border | Link (line) | Way across | District at the north or west end | District at the south or east end |
|---|---|---|---|---|
| Government ↔ Free City | Yongsan-Noryangjin (Line 1) | Bridge | Yongsan-gu | Dongjak-gu |
| Government ↔ Free City | Hapjeong-Dangsan (Line 2) | Bridge | Mapo-gu | Yeongdeungpo-gu |
| Government ↔ Free City | Ichon-Dongjak (Line 4) | Bridge | Yongsan-gu | Dongjak-gu |
| Government ↔ Free City | Digital Media City-Magongnaru (Airport Railroad) | Bridge | Mapo-gu | Gangseo-gu |
| Government ↔ Free City | Mapo-Yeouinaru (Line 5) | Under-river tunnel | Mapo-gu | Yeongdeungpo-gu |
| Government ↔ Arc | Gangbyeon-Jamsillaru (Line 2) | Bridge | Gwangjin-gu | Songpa-gu |
| Government ↔ Arc | Oksu-Apgujeong (Line 3) | Bridge | Seongdong-gu | Gangnam-gu |
| Government ↔ Arc | Jayang-Cheongdam (Line 7) | Bridge | Gwangjin-gu | Gangnam-gu |
| Government ↔ Arc | Gwangnaru-Cheonho (Line 5) | Under-river tunnel | Gwangjin-gu | Gangdong-gu |
| Government ↔ Arc | Seoul Forest-Apgujeong Rodeo (Suin-Bundang Line) | Under-river tunnel | Seongdong-gu | Gangnam-gu |
| Free City ↔ Arc | Sadang-Bangbae (Line 2) | Land border | Dongjak-gu | Seocho-gu |
| Free City ↔ Arc | Chongshin Univ. (Isu)-Naebang (Line 7) | Land border | Dongjak-gu | Seocho-gu |
| Free City ↔ Arc | Dongjak-Gubanpo (Line 9) | Land border | Dongjak-gu | Seocho-gu |

- Of the ten links between the Government and the south, seven are bridges exposed to wind and blizzard, and only three are warm, covered under-river tunnels. The Government keeps ledger checkpoints at the north mouths of the three tunnels.
- There is no river between the Free Cities and the Arc. The Free City end of all three links (Sadang, Chongshin Univ. (Isu), Dongjak) lies in Dongjak-gu. Gwanak touches Seocho by land but has no line link.

How people cross is in [Crossings and Smuggling](/wiki/Diaspora-Corridors/), and how the map is built in [How the World Map Is Built](/wiki/World-Map-Construction/).

<a id="index-ladder"></a>

## The Ladder of Titles at a Glance

| Level | Government | The Free Cities | Arc |
|---|---|---|---|
| Station | Stationmaster | Station Foreman | Bench Keeper |
| Dong | Dong Chief | Section Chief (sections instead of dongs) | Shelter Head |
| District (duchy) | Member of the National Assembly | Different in each city (Duke of Gwanak, Ferry Keeper, Market Master, Works Master, Edge Warden, Depot Master, Wind Keeper) | Head of the Near House |
| Whole polity | The National Assembly | None (the contract meeting and its Host) | The Seat of the Four Near Houses |
| At the top | The life president | None | The Hierophant |

Member of the National Assembly, the life-long seat of the President, Duke of Gwanak and Hierophant are settled. The other titles are the words in use, but they are not yet settled. More is in [Titles and Offices](/wiki/Offices-and-Ranks/).

<a id="index-documents"></a>

## Documents by Topic

| Topic | Documents |
|---|---|
| The roots of the world | [World Narrative Atlas](/wiki/World-Narrative-Atlas/), [The Great Blackout and the Eternal Winter](/wiki/World-Unbinding/), [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/), [Glossary](/wiki/Glossary/) |
| Time | [Century Annals 2026-2126](/wiki/Century-Annals/), [The Opening: Winter 2126](/wiki/Scenario-Timeline/), [Sindorim Junction Cargo Gate](/wiki/Sindorim-Junction-Cargo-Gate/) |
| The three polities | [The Three Polities of Seoul](/wiki/Sixteen-States/), [Government Society](/wiki/Government-Society/), [Free City Society](/wiki/Free-City-Society/), [Arc Society](/wiki/Arc-Society/) |
| Between the polities | [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/), [Crossings and Smuggling](/wiki/Diaspora-Corridors/) |
| Land and stations | [Seoul under the Snow](/wiki/Building-Reuse-Geography/), [Beyond Seoul: the Rim](/wiki/External-Theaters/), [Seoul Station Catalog](/wiki/Seoul-Station-Catalog/), [Inside a Station](/wiki/Station-Interior-Construction/), [How the World Map Is Built](/wiki/World-Map-Construction/), [The Surface and Underground](/wiki/World-and-Subway-Layers/), [Structures](/wiki/Structures/) |
| People | [People, Factions and Trades](/wiki/Characters-Factions-and-Professions/), [Bon-gwan and Hangnyeol](/wiki/Hangnyeol-and-Bon-gwan/), [Values and Policy Scales](/wiki/Values-and-Policy-Scales/), [Titles and Offices](/wiki/Offices-and-Ranks/) |
| Life | [Faith and Rites](/wiki/Faith-Culture-Schism/), [Meals and Food](/wiki/Food-Culture/), [The Stories](/wiki/Oral-Stories/), [Ailments of the Cold](/wiki/Ailments/) |
| Technology and machines | [What Still Runs](/wiki/Lost-Technology-Lineage/), [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/), [Guns, Rounds and Drones](/wiki/Era-Arms-and-Tech-Level/), [People and Machines](/wiki/People-and-Machines/), [Humanoids](/wiki/Synthetic-Actors/) |
| Dangers inside Seoul | [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) |
| Beasts | [G01](/wiki/Hostile-Group-G01/), [G02](/wiki/Hostile-Group-G02/), [G03](/wiki/Hostile-Group-G03/), [G04](/wiki/Hostile-Group-G04/), [G05](/wiki/Hostile-Group-G05/), [G06](/wiki/Hostile-Group-G06/) |
| Hostile human bands | [G07](/wiki/Hostile-Group-G07/), [G08](/wiki/Hostile-Group-G08/), [G09](/wiki/Hostile-Group-G09/), [G10](/wiki/Hostile-Group-G10/), [G11](/wiki/Hostile-Group-G11/), [G12](/wiki/Hostile-Group-G12/) |
| Old machines inside Seoul | [G13](/wiki/Hostile-Group-G13/), [G14](/wiki/Hostile-Group-G14/), [G15](/wiki/Hostile-Group-G15/), [G16](/wiki/Hostile-Group-G16/), [G25](/wiki/Hostile-Group-G25/) |
| Rim machines | [G17](/wiki/Hostile-Group-G17/), [G18](/wiki/Hostile-Group-G18/), [G19](/wiki/Hostile-Group-G19/), [G20](/wiki/Hostile-Group-G20/), [G21](/wiki/Hostile-Group-G21/), [G22](/wiki/Hostile-Group-G22/), [G23](/wiki/Hostile-Group-G23/), [G24](/wiki/Hostile-Group-G24/), [G26](/wiki/Hostile-Group-G26/) |

<a id="index-districts-related"></a>

## Further Reading by District

| District | Further reading |
|---|---|
| Jongno-gu, Jung-gu | [Government Society](/wiki/Government-Society/), [Seoul Station Catalog](/wiki/Seoul-Station-Catalog/) |
| Yongsan-gu, Mapo-gu, Seongdong-gu, Gwangjin-gu | [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/), [Crossings and Smuggling](/wiki/Diaspora-Corridors/) |
| Seodaemun-gu, Dongdaemun-gu, Jungnang-gu | [Government Society](/wiki/Government-Society/) |
| Seongbuk-gu, Eunpyeong-gu, Gangbuk-gu, Dobong-gu, Nowon-gu | [Beyond Seoul: the Rim](/wiki/External-Theaters/), [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/) |
| Gangseo-gu, Yangcheon-gu | [Free City Society](/wiki/Free-City-Society/), [People and Machines](/wiki/People-and-Machines/) |
| Yeongdeungpo-gu | [Free City Society](/wiki/Free-City-Society/), [The Opening: Winter 2126](/wiki/Scenario-Timeline/) |
| Guro-gu | [Sindorim Junction Cargo Gate](/wiki/Sindorim-Junction-Cargo-Gate/), [What Still Runs](/wiki/Lost-Technology-Lineage/) |
| Geumcheon-gu | [Beyond Seoul: the Rim](/wiki/External-Theaters/), [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) |
| Dongjak-gu | [Crossings and Smuggling](/wiki/Diaspora-Corridors/), [How the World Map Is Built](/wiki/World-Map-Construction/) |
| Gwanak-gu | [Free City Society](/wiki/Free-City-Society/), [Titles and Offices](/wiki/Offices-and-Ranks/) |
| Seocho-gu, Gangnam-gu, Songpa-gu, Gangdong-gu | [Arc Society](/wiki/Arc-Society/), [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/), [Faith and Rites](/wiki/Faith-Culture-Schism/) |
', '<a id="index-read"></a>

이 색인은 서울의 25개 구를 한 줄씩 적는다. 구마다 어느 정체에 속하는지, 우두머리가 어느 역에서 일하는지, 다스리는 사람을 무엇이라 부르는지, 그 구가 무엇을 쥐었는지, 더 읽을 문서가 무엇인지다. 구 하나가 공작령 하나다. 지명과 역과 지리는 그대로이고, 그 위의 다스림만 구 단위로 나뉜다.

## 읽는 법

- **본역**은 구의 우두머리가 일하는 역이다. 정부는 그 구에서 노선이 가장 많이 모이는 역, 자유도시들은 각 도시가 정한 자리 역, 아크는 곁집장이 사는 역이다.
- **역 수**는 지도에 오른 역의 수다. 지도에는 오르지만 노선이 이어지지 않아 사람이 살지 않는 항목도 몇 있다.
- **다스리는 칭호**는 그 구를 쥔 사람의 칭호다. 국회의원과 관악 공작은 확정된 칭호다. 나머지는 지금 쓰는 칭호이지만 아직 확정되지 않았다.
- 누가 그 자리에 앉았는지는 이 색인에 적지 않는다. 확정된 사람은 관악 공작 이일섭 하나다. 다른 자리의 사람들은 [인물·세력·생업](/wiki/Characters-Factions-and-Professions/)에 있다.

<a id="index-overview"></a>

## 세 정체 한눈에

| 정체 | 구 | 지도의 역 | 사람(2126) | 구를 쥔 사람 | 정체 전체의 자리 | 맨 위 |
|---|---|---|---|---|---|---|
| 정부 | 한강 북쪽 14구 | 157 | 약 16만 | 국회의원 | 국회(단원제) | 종신 대통령 |
| 자유도시들 | 남서쪽 7구 | 77 | 약 7만 5천 | 도시마다 다르다. 관악은 공작 | 없다. 그때그때 여는 계약회와 자리주인 | 없다 |
| 아크 | 강남 4구 | 78 | 약 6만 5천 | 곁집장 | 네 곁집 자리 | 교주 |
| 서울 | 25구 | 312 | 약 30만 | | | |

정체마다의 개관은 [서울의 세 정체](/wiki/Sixteen-States/)에, 칭호의 사다리는 [칭호와 자리](/wiki/Offices-and-Ranks/)에 있다.

<a id="index-government"></a>

## 정부 14구

각 구에서 뽑힌 국회의원이 그 구의 공작령을 쥔다. 구 하나에 의석 하나다. 국회의원들이 자기들 가운데서 종신 대통령을 낸다. 대통령은 구를 쥐지 않고, 정부서울청사가 있는 광화문에서 일한다. 2126년 의석은 OMO당 6, 클로당 8이다.

| 구 | English | 본역 | 역 수 | 당 | 다스리는 칭호 | 이 구가 쥔 것 |
|---|---|---|---|---|---|---|
| 종로구 | Jongno-gu | 종로3가 | 13 | 클로당 | 국회의원 | 정부서울청사(부처와 국회 회의실), 광화문역. 정부의 머리 |
| 중구 | Jung-gu | 서울역 | 17 | OMO당 | 국회의원 | 서울역(가장 큰 역), 한국은행, 시청, 동대문역사문화공원과 회현의 장터 |
| 용산구 | Yongsan-gu | 삼각지 | 12 | OMO당 | 국회의원 | 국방부와 수도방위사령부(삼각지), 용산–노량진·이촌–동작 다리의 북쪽 끝 |
| 마포구 | Mapo-gu | 공덕 | 13 | OMO당 | 국회의원 | 마포–여의나루 강 밑 터널, 합정–당산·디지털미디어시티–마곡나루 다리의 북쪽 끝, 공덕 장터 |
| 성동구 | Seongdong-gu | 왕십리 | 11 | OMO당 | 국회의원 | 뚝도 취수구, 서울숲–압구정로데오 강 밑 터널, 옥수–압구정 다리의 북쪽 끝 |
| 광진구 | Gwangjin-gu | 건대입구 | 9 | OMO당 | 국회의원 | 구의 취수구, 잠실수중보 북쪽 끝, 광나루–천호 강 밑 터널, 강변–잠실나루·자양–청담 다리의 북쪽 끝 |
| 서대문구 | Seodaemun-gu | 충정로 | 8 | OMO당 | 국회의원 | 마포와 종로 사이의 길목, 충정로와 신촌 |
| 동대문구 | Dongdaemun-gu | 청량리 | 9 | 클로당 | 국회의원 | 청량리(여러 노선이 모이는 역), 연료 장터 |
| 중랑구 | Jungnang-gu | 상봉 | 10 | 클로당 | 국회의원 | 상봉과 망우, 망우 묘역 |
| 성북구 | Seongbuk-gu | 보문 | 13 | 클로당 | 국회의원 | 북한산 쪽 테두리 망대, 옛 대학 터의 학교 |
| 은평구 | Eunpyeong-gu | 연신내 | 11 | 클로당 | 국회의원 | 연신내(깊은 노선이 지나는 역), 북한산 땔감, 북한산 쪽 테두리 |
| 강북구 | Gangbuk-gu | 4.19민주묘지 | 11 | 클로당 | 국회의원 | 4·19민주묘지 묘역, 북한산 쪽 테두리 |
| 도봉구 | Dobong-gu | 창동 | 6 | 클로당 | 국회의원 | 창동 차량기지, 도봉산 땔감과 테두리 |
| 노원구 | Nowon-gu | 노원 | 14 | 클로당 | 국회의원 | 화랑대 육군사관학교, 수락산·불암산 쪽 테두리, 빛밭이 가장 넓은 구 |

- 한강에 닿은 네 구(마포, 용산, 성동, 광진)는 모두 OMO당이다. 다리와 터널과 취수구를 쥐고 있어서, 계약이 깨지면 가장 먼저 다친다. 강에 닿지 않는 중구와 서대문구도 장터로 강 건너 물자에 기대어 살아 OMO당이다. 산과 내륙의 여덟 구는 클로당이다.
- 세 번째 급수계약의 부속서는 한강에 닿은 네 구의 도장에 걸려 있다.
- 북쪽 산자락의 구(성북, 은평, 강북, 도봉, 노원)는 서울 밖 테두리를 마주하고, 산의 땔감을 쥐었다.

정부의 다스림은 [정부 사회](/wiki/Government-Society/)에 있다.

<a id="index-free-cities"></a>

## 자유도시 7구

자유도시들은 하나의 권력이 아니다. 도시마다 각자 권력이고 각자 공작령을 쥔다. 자유도시들 위에 서는 한 사람의 지배자는 없고, 묶어 부르는 이름도 없다. 누구 기술이 더 높은지 따질 방법이 없으니 도시마다 제 일에서 잴 수 있는 것을 찾아 우두머리를 정한다.

| 도시(구) | English | 우두머리 칭호 | 우두머리를 정하는 법 | 자리 역 | 역 수 | 구간 | 사람(2126) | 먹고사는 일 |
|---|---|---|---|---|---|---|---|---|
| 강서 | Gangseo-gu | 바람지기 | 바람밭 작업대주들이 뽑는다. 종신이지만 바람밭이 계약한 와트를 못 지키면 물러난다 | 김포공항 | 18 | 4 | 약 17,000 | 바람틀 전기, 넓은 빛밭 |
| 양천 | Yangcheon-gu | 기지장 | 기지 집안 하나가 대물린다 | 신정네거리 | 7 | 2 | 약 4,200 | 신정 차량기지의 모터·바퀴 재생, 궤도 수레 |
| 영등포 | Yeongdeungpo-gu | 장주 | 장터 집안들이 세 해씩 정해진 차례로 돌아가며 맡는다 | 영등포 | 18 | 4 | 약 20,600 | 큰 장터, 양평동 취수구의 물, 계약회 자리 |
| 구로 | Guro-gu | 공장장 | 지킨 보증이 가장 많은 작업대주가 맡는다 | 구로 | 9 | 2 | 약 9,600 | 옛 공장 터와 1호선 차량기지의 부품, 펌프 |
| 금천 | Geumcheon-gu | 경계장 | 테두리를 넘었다 돌아온 사람 가운데서 경계조가 뽑는다 | 가산디지털단지 | 3 | 1 | 약 3,200 | 바깥에서 캐 오는 동력 덩이, 우물 굴착 기계 |
| 동작 | Dongjak-gu | 나루지기 | 건널목장들이 저희 가운데서 뽑는다 | 노량진 | 14 | 4 | 약 14,000 | 건널목 통행 몫, 얼음 밑 물고기 |
| 관악 | Gwanak-gu | 공작 | 이일섭의 집안이 대물린다 | 신림 | 8 | 2 | 약 6,200 | 관악산의 땔감과 나무 섬유, 산 바위 굴착 |

- 관악 공작이라는 칭호와 이일섭이 지금의 관악 공작이라는 것은 확정이다. 다른 여섯 도시의 칭호는 그 도시가 먹고사는 일에서 나왔고, 아직 확정되지 않았다.
- 관악은 강 건너 정부가 구를 공작령이라 부르며 국회의원에게 쥐여 주자, 같은 말을 가져와 정부와 같은 자리에 앉겠다고 선언했다. 그래서 관악은 정부와 계약할 때 "공작령 대 공작령"으로 도장을 찍기를 고집한다.
- 동작은 세 정체가 만나는 곳이다. 강 쪽으로는 정부와, 땅 쪽으로는 아크와 마주한다. 동작역은 4호선으로 정부의 이촌과, 9호선으로 아크의 구반포와 이어진다.
- 서울 끝의 역을 가진 강서, 구로, 금천, 관악은 바깥 기계의 테두리를 마주한다.

도시마다의 다스림은 [자유도시들의 사회](/wiki/Free-City-Society/)에, 구로 신도림의 노선 이음목은 [신도림 연결부 화물문](/wiki/Sindorim-Junction-Cargo-Gate/)에 있다.

<a id="index-arc"></a>

## 아크 4구

아크의 맨 위에 교주 고예진이 있다. 신도는 그를 메시아라 부른다. 네 구는 교주 곁에 선 집안, 곧 곁집 넷이 하나씩 맡는다. 곁집장 넷이 교주 앞에 모이는 자리를 네 곁집 자리라 한다.

| 구 | English | 맡은 곁집 | 본역 | 역 수 | 사람(2126) | 이 구가 쥔 것 |
|---|---|---|---|---|---|---|
| 서초구 | Seocho-gu | 서초 곁집, "경계의 집" | 고속터미널 | 18 | 약 1만 5천 | 자유도시와 맞닿은 땅 경계 세 곳의 아크 쪽 역(방배, 내방, 구반포), 고속터미널의 바꿈터, 청계산입구에서 테두리를 지켜보는 일 |
| 강남구 | Gangnam-gu | 강남 곁집, "깊은 층의 집" | 수서 | 23 | 약 1만 8천 | 수서의 깊은 노선 층과 옛 차량기지의 부품 창고, 선릉·삼성·도곡 같은 큰 역, 서울숲–압구정로데오 강 밑 터널의 남쪽 입구 |
| 송파구 | Songpa-gu | 송파 곁집, "물살의 집" | 잠실 | 23 | 약 2만 1천 | 잠실수중보 수차의 남쪽 끝, 가락시장과 잠실의 바꿈터, 강변–잠실나루 다리의 남쪽 끝 |
| 강동구 | Gangdong-gu | 강동 곁집, "문간의 집" | 천호 | 14 | 약 1만 1천 | 암사 취수구와 얼음 밑 강물, 광나루–천호 강 밑 터널의 남쪽 입구, 고덕 차량기지, 동쪽 끝 테두리를 지켜보는 일 |

- 교주의 집은 잠실에 있다. 송파 곁집은 전기를 쥐어 네 곁집 가운데 가장 힘이 세고, 교주의 집과 한 역을 쓴다.
- 서초 곁집은 자유도시와 가장 가까웠던 집안에서 나왔다. 아크에서 자유도시 작업장 말투가 가장 짙게 남은 집안이다.
- 강동 곁집은 2122년 강남의 대피소들이 아크로 묶일 때 가장 늦게 들면서 암사 취수구를 내놓았다.
- 아크는 동을 옛 이름대로 "대피소"라 부른다. 아크로 묶이기 전의 대피소 하나하나가 지금의 대피소다.
- 각 곁집장 자리에 누가 앉는지는 아직 확정되지 않았다.

아크의 다스림과 세례는 [아크 사회](/wiki/Arc-Society/)에 있다.

<a id="index-borders"></a>

## 경계의 열세 이음목

세력이 바뀌는 노선 연결은 열세 곳이다. 구로 보면 정부 쪽은 마포, 용산, 성동, 광진 네 구, 자유도시 쪽은 강서, 영등포, 동작 세 구, 아크 쪽은 서초, 강남, 송파, 강동 네 구가 경계를 맡는다.

| 경계 | 연결(노선) | 건너는 꼴 | 북쪽 또는 서쪽 끝의 구 | 남쪽 또는 동쪽 끝의 구 |
|---|---|---|---|---|
| 정부 ↔ 자유도시 | 용산–노량진(1호선) | 다리 | 용산구 | 동작구 |
| 정부 ↔ 자유도시 | 합정–당산(2호선) | 다리 | 마포구 | 영등포구 |
| 정부 ↔ 자유도시 | 이촌–동작(4호선) | 다리 | 용산구 | 동작구 |
| 정부 ↔ 자유도시 | 디지털미디어시티–마곡나루(공항철도) | 다리 | 마포구 | 강서구 |
| 정부 ↔ 자유도시 | 마포–여의나루(5호선) | 강 밑 터널 | 마포구 | 영등포구 |
| 정부 ↔ 아크 | 강변–잠실나루(2호선) | 다리 | 광진구 | 송파구 |
| 정부 ↔ 아크 | 옥수–압구정(3호선) | 다리 | 성동구 | 강남구 |
| 정부 ↔ 아크 | 자양–청담(7호선) | 다리 | 광진구 | 강남구 |
| 정부 ↔ 아크 | 광나루–천호(5호선) | 강 밑 터널 | 광진구 | 강동구 |
| 정부 ↔ 아크 | 서울숲–압구정로데오(수인분당선) | 강 밑 터널 | 성동구 | 강남구 |
| 자유도시 ↔ 아크 | 사당–방배(2호선) | 땅 위 경계 | 동작구 | 서초구 |
| 자유도시 ↔ 아크 | 총신대입구(이수)–내방(7호선) | 땅 위 경계 | 동작구 | 서초구 |
| 자유도시 ↔ 아크 | 동작–구반포(9호선) | 땅 위 경계 | 동작구 | 서초구 |

- 정부와 남쪽 사이의 열 곳 가운데 일곱은 바람과 눈보라에 드러난 다리이고, 셋만 따뜻하고 가려진 강 밑 터널이다. 정부는 세 터널의 북쪽 입구에 장부 검문소를 둔다.
- 자유도시들과 아크 사이에는 강이 없다. 세 이음목의 자유도시 쪽 역(사당, 총신대입구(이수), 동작)은 모두 동작구에 있다. 관악은 서초와 땅으로 맞닿지만 노선 연결이 없다.

건너는 법은 [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)에, 지도의 짜임은 [세계 지도의 짜임](/wiki/World-Map-Construction/)에 있다.

<a id="index-ladder"></a>

## 칭호 사다리 한눈에

| 층 | 정부 | 자유도시들 | 아크 |
|---|---|---|---|
| 역 | 역장 | 역반장 | 정비장 |
| 동 | 동장 | 구간장(동 대신 구간을 쓴다) | 대피소장 |
| 구(공작령) | 국회의원 | 도시마다 다르다(관악 공작, 나루지기, 장주, 공장장, 경계장, 기지장, 바람지기) | 곁집장 |
| 정체 전체 | 국회 | 없다(계약회와 자리주인) | 네 곁집 자리 |
| 맨 위 | 종신 대통령 | 없다 | 교주 |

국회의원, 종신이라는 대통령의 자리, 관악 공작, 교주는 확정이다. 나머지 칭호는 지금 쓰는 말이지만 아직 확정되지 않았다. 자세한 것은 [칭호와 자리](/wiki/Offices-and-Ranks/)에 있다.

<a id="index-documents"></a>

## 주제별 문서

| 주제 | 문서 |
|---|---|
| 세계의 뿌리 | [세계 서사 총람](/wiki/World-Narrative-Atlas/), [대정전과 영원한 겨울](/wiki/World-Unbinding/), [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/), [용어 사전](/wiki/Glossary/) |
| 때 | [백 년 연표](/wiki/Century-Annals/), [개막: 2126년 겨울](/wiki/Scenario-Timeline/), [신도림 연결부 화물문](/wiki/Sindorim-Junction-Cargo-Gate/) |
| 세 정체 | [서울의 세 정체](/wiki/Sixteen-States/), [정부 사회](/wiki/Government-Society/), [자유도시들의 사회](/wiki/Free-City-Society/), [아크 사회](/wiki/Arc-Society/) |
| 정체 사이 | [급수계약과 세 정체](/wiki/World-Relation-Ledger/), [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/) |
| 땅과 역 | [눈 밑의 서울](/wiki/Building-Reuse-Geography/), [서울 밖과 테두리](/wiki/External-Theaters/), [서울 역 목록](/wiki/Seoul-Station-Catalog/), [역 안으로](/wiki/Station-Interior-Construction/), [세계 지도의 짜임](/wiki/World-Map-Construction/), [지상과 땅 밑](/wiki/World-and-Subway-Layers/), [구조물](/wiki/Structures/) |
| 사람 | [인물·세력·생업](/wiki/Characters-Factions-and-Professions/), [본관과 항렬](/wiki/Hangnyeol-and-Bon-gwan/), [가치관과 정책 척도](/wiki/Values-and-Policy-Scales/), [칭호와 자리](/wiki/Offices-and-Ranks/) |
| 삶 | [믿음과 의례](/wiki/Faith-Culture-Schism/), [끼니와 먹거리](/wiki/Food-Culture/), [이야기](/wiki/Oral-Stories/), [추위의 병](/wiki/Ailments/) |
| 기술과 기계 | [아직 도는 것](/wiki/Lost-Technology-Lineage/), [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/), [총, 탄, 드론](/wiki/Era-Arms-and-Tech-Level/), [사람과 기계](/wiki/People-and-Machines/), [휴머노이드](/wiki/Synthetic-Actors/) |
| 서울 안의 위험 | [적대 생태 도감](/wiki/Hostile-Ecology-Index/) |
| 짐승 | [G01](/wiki/Hostile-Group-G01/), [G02](/wiki/Hostile-Group-G02/), [G03](/wiki/Hostile-Group-G03/), [G04](/wiki/Hostile-Group-G04/), [G05](/wiki/Hostile-Group-G05/), [G06](/wiki/Hostile-Group-G06/) |
| 적대 사람 무리 | [G07](/wiki/Hostile-Group-G07/), [G08](/wiki/Hostile-Group-G08/), [G09](/wiki/Hostile-Group-G09/), [G10](/wiki/Hostile-Group-G10/), [G11](/wiki/Hostile-Group-G11/), [G12](/wiki/Hostile-Group-G12/) |
| 서울 안 옛 기계 | [G13](/wiki/Hostile-Group-G13/), [G14](/wiki/Hostile-Group-G14/), [G15](/wiki/Hostile-Group-G15/), [G16](/wiki/Hostile-Group-G16/), [G25](/wiki/Hostile-Group-G25/) |
| 테두리 기계 | [G17](/wiki/Hostile-Group-G17/), [G18](/wiki/Hostile-Group-G18/), [G19](/wiki/Hostile-Group-G19/), [G20](/wiki/Hostile-Group-G20/), [G21](/wiki/Hostile-Group-G21/), [G22](/wiki/Hostile-Group-G22/), [G23](/wiki/Hostile-Group-G23/), [G24](/wiki/Hostile-Group-G24/), [G26](/wiki/Hostile-Group-G26/) |

<a id="index-districts-related"></a>

## 구마다 더 읽을 곳

| 구 | 더 읽을 곳 |
|---|---|
| 종로구, 중구 | [정부 사회](/wiki/Government-Society/), [서울 역 목록](/wiki/Seoul-Station-Catalog/) |
| 용산구, 마포구, 성동구, 광진구 | [급수계약과 세 정체](/wiki/World-Relation-Ledger/), [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/) |
| 서대문구, 동대문구, 중랑구 | [정부 사회](/wiki/Government-Society/) |
| 성북구, 은평구, 강북구, 도봉구, 노원구 | [서울 밖과 테두리](/wiki/External-Theaters/), [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/) |
| 강서구, 양천구 | [자유도시들의 사회](/wiki/Free-City-Society/), [사람과 기계](/wiki/People-and-Machines/) |
| 영등포구 | [자유도시들의 사회](/wiki/Free-City-Society/), [개막: 2126년 겨울](/wiki/Scenario-Timeline/) |
| 구로구 | [신도림 연결부 화물문](/wiki/Sindorim-Junction-Cargo-Gate/), [아직 도는 것](/wiki/Lost-Technology-Lineage/) |
| 금천구 | [서울 밖과 테두리](/wiki/External-Theaters/), [적대 생태 도감](/wiki/Hostile-Ecology-Index/) |
| 동작구 | [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/), [세계 지도의 짜임](/wiki/World-Map-Construction/) |
| 관악구 | [자유도시들의 사회](/wiki/Free-City-Society/), [칭호와 자리](/wiki/Offices-and-Ranks/) |
| 서초구, 강남구, 송파구, 강동구 | [아크 사회](/wiki/Arc-Society/), [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/), [믿음과 의례](/wiki/Faith-Culture-Schism/) |
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('World-Map-Construction', 'How the World Map Is Built', '세계 지도의 짜임', 'places', 4, 'This wiki''s world map lays the politics of 2126 over Seoul''s real geography. The land, the river, the stations and the lines are the Seoul of before the Great Blackout. The names of the twenty-five districts, the dong, the stations and the lines are the real names too. The only thing that has changed is who holds the land. This document explains how to read the map. One district is one duchy, the Han divides the three polities, and the thirteen places where a line crosses from one polity to another are the borders.

## The Geography Is Unchanged

The base of the map is fixed, real geography.

| What | What the map has |
|---|---|
| Districts | Seoul''s 25 districts (gu). One district is one duchy |
| Dong | The neighbourhoods below a district. A dong with no station is grouped with the dong of the nearest station |
| Stations | 312 map entries. Of these, 307 are stations where people live |
| Lines | The old lines: Lines 1 to 9, the Airport Railroad, the Gyeongui-Jungang Line, the Gyeongchun Line, the Suin-Bundang Line, the Sillim Line, the Ui-Sinseol Line, GTX-A and others. Lines that run on out of Seoul keep their names too |
| River | The Han. The frozen river divides the Government from the south |

The six regional groupings on the map are only groupings of the old administrative geography, not political units of 2126. Nobody rules them and they have no titles.

## The 25 Duchies

One district is one duchy. The Government holds the 14 districts north of the Han, the Free Cities the 7 districts of the southwest, and Arc the 4 districts of Gangnam. 14 + 7 + 4 = 25.

| District | Polity | Title of the district''s holder | Seat station |
|---|---|---|---|
| Mapo-gu | Government | Member of the National Assembly | Gongdeok |
| Yongsan-gu | Government | Member of the National Assembly | Samgakji |
| Jung-gu | Government | Member of the National Assembly | Seoul Station |
| Seongdong-gu | Government | Member of the National Assembly | Wangsimni |
| Gwangjin-gu | Government | Member of the National Assembly | Konkuk Univ. |
| Dongdaemun-gu | Government | Member of the National Assembly | Cheongnyangni |
| Jungnang-gu | Government | Member of the National Assembly | Sangbong |
| Seongbuk-gu | Government | Member of the National Assembly | Bomun |
| Jongno-gu | Government | Member of the National Assembly | Jongno 3-ga |
| Seodaemun-gu | Government | Member of the National Assembly | Chungjeongno |
| Eunpyeong-gu | Government | Member of the National Assembly | Yeonsinnae |
| Gangbuk-gu | Government | Member of the National Assembly | April 19th National Cemetery |
| Dobong-gu | Government | Member of the National Assembly | Chang-dong |
| Nowon-gu | Government | Member of the National Assembly | Nowon |
| Gangseo-gu | Free City | Wind Keeper | Gimpo Int''l Airport |
| Yangcheon-gu | Free City | Depot Master | Sinjeongnegeori |
| Yeongdeungpo-gu | Free City | Market Master | Yeongdeungpo |
| Guro-gu | Free City | Works Master | Guro |
| Geumcheon-gu | Free City | Edge Warden | Gasan Digital Complex |
| Dongjak-gu | Free City | Ferry Keeper | Noryangjin |
| Gwanak-gu | Free City | Duke (I Ilseop, Duke of Gwanak) | Sillim |
| Seocho-gu | Arc | Head of the Near House | Express Bus Terminal |
| Gangnam-gu | Arc | Head of the Near House | Suseo |
| Songpa-gu | Arc | Head of the Near House | Jamsil |
| Gangdong-gu | Arc | Head of the Near House | Cheonho |

The **seat station** is the station where the district''s holder works. Each Free City has a seat station of its own choosing, and in Arc the station where the Head of the Near House lives is called the home station. In a Government district the seat station is the station with the most links to neighbouring stations (on a tie, the one listed first in the station catalog). The business of the Government as a whole is done at the Government Complex Seoul in Gwanghwamun, and that of Arc as a whole at Jamsil, where the Hierophant lives.

In the Government''s fourteen districts, the Member of the National Assembly elected in each district holds its duchy. In the Free Cities'' seven districts, each city has a different title for its head and a different way of choosing one. Only the head of Gwanak borrowed the Government''s word and calls himself Duke. Arc''s four districts are each held by one of four Near Houses, the families that stand beside the Hierophant.

## The Land of the Three Polities

| Polity | Land | Stations where people live | People |
|---|---|---|---|
| Government | The 14 districts north of the Han | 153 | About 160,000 |
| The Free Cities | The 7 districts of the southwest | 77 | About 75,000 |
| Arc | The 4 districts of Gangnam | 77 | About 65,000 |
| Seoul | 25 districts | 307 | About 300,000 |

The people of Seoul in 2126 number a little over 3% of those before the Great Blackout. The Government has the most people and land, the Free Cities have the skills, and Arc has the knowledge of machine bodies and the electricity of Jamsil.

The map draws the land outside Seoul, but nobody holds it. Beyond the city boundary is a belt where the war machines of the Great Blackout still circle. More is in [Beyond Seoul: the Rim](/wiki/External-Theaters/).

## The Five Tiers of Titles

The map''s land frame fits the tiers of titles: station, dong, district, the polity as a whole, and the head.

| Tier | Government | The Free Cities | Arc |
|---|---|---|---|
| Station | Stationmaster | Station Foreman | Bench Keeper |
| Dong | Dong Chief | Section Chief (the Free Cities group a few stations and the tunnels between them into a section) | Shelter Head (Arc calls a dong a shelter) |
| District | Member of the National Assembly | Different in every city: Duke of Gwanak, Ferry Keeper, Market Master, Works Master, Edge Warden, Depot Master, Wind Keeper | Head of the Near House |
| Polity as a whole | The National Assembly | None. Only contract meetings called as needed, and the Host who calls one | The Seat of the Four Near Houses |
| Head | President for Life | None | Hierophant |

A station belongs to the dong where its main entrance is. A dong with no station is held together with the dong of the nearest station, by whoever holds that one. The surface land of the dong, its scavenging, its light-field plots and its entrance rights belong to that person.

The Government''s fourteen districts once had twenty-four National Assembly constituencies before the Great Blackout. Those lines survive only on the map; the Government cut the seats to one per district. So the Government ladder has no tier between district and dong.

## The Thirteen Border Junctions

There are thirteen places where a line runs from a station of one polity to a station of another. These thirteen places are the borders on the map.

| Border | Junction (line) | How it is crossed |
|---|---|---|
| Government and the Free Cities | Yongsan to Noryangjin (Line 1), Hapjeong to Dangsan (Line 2), Ichon to Dongjak (Line 4), Digital Media City to Magongnaru (Airport Railroad) | Bridge |
| Government and the Free Cities | Mapo to Yeouinaru (Line 5) | Under-river tunnel |
| Government and Arc | Gangbyeon to Jamsillaru (Line 2), Oksu to Apgujeong (Line 3), Jayang to Cheongdam (Line 7) | Bridge |
| Government and Arc | Gwangnaru to Cheonho (Line 5), Seoul Forest to Apgujeong Rodeo (Suin-Bundang Line) | Under-river tunnel |
| The Free Cities and Arc | Sadang to Bangbae (Line 2), Chongshin Univ. (Isu) to Naebang (Line 7), Dongjak to Gubanpo (Line 9) | Land border. No river |

Of the ten places between the Government and the south, seven are bridges open to wind and blizzard, and only three are warm, hidden tunnels under the river. So the river is a line armies cannot easily cross, and any fight across it is a fight over who holds the three tunnels.

There is no river between the Free Cities and Arc. That border is a single line between Dongjak-gu and Seocho-gu, and the Free City border stations, Sadang, Chongshin Univ. (Isu) and Dongjak, are all in Dongjak-gu. Dongjak is the only city that meets Arc by rail. Dongjak station is joined by Line 4 to the Government''s Ichon and by Line 9 to Arc''s Gubanpo. It is the only place in Seoul where all three polities meet at one station. Gwanak touches Seocho on land, but no line joins them.

## How to Read the Map

- **Station colours.** A station is coloured by the polity that holds its surface.
- **District borders.** A district boundary is the boundary of a duchy. The dong inside a district are the dong tier of titles.
- **Lines.** Lines keep their old colours. Where a line passes from one polity''s colour to another''s is a border junction.
- **Underground.** Some stations list the depth of their platforms and the number of exits. The depth tells how warm the station is and how many people it can hold. Read it together with [Inside a Station](/wiki/Station-Interior-Construction/).

## Related Documents

- [Seoul Station Catalog](/wiki/Seoul-Station-Catalog/)
- [The Surface and Underground](/wiki/World-and-Subway-Layers/)
- [The Three Polities of Seoul](/wiki/Sixteen-States/)
- [World Index: the Three Polities and the 25 Duchies](/wiki/World-Expansion-Index/)
- [Titles and Offices](/wiki/Offices-and-Ranks/)
- [Crossings and Smuggling](/wiki/Diaspora-Corridors/)
', '이 위키의 세계 지도는 서울의 실제 지리 위에 2126년의 정치를 얹은 것이다. 땅과 강과 역과 노선은 대정전 전 서울 그대로다. 구 스물다섯, 동, 역, 노선의 이름도 실제 이름 그대로다. 바뀐 것은 누가 그 땅을 쥐느냐뿐이다. 이 문서는 지도를 읽는 법을 적는다. 구 하나가 공작령 하나이고, 한강이 세 정체를 가르며, 노선이 세력을 넘는 열세 곳이 경계다.

## 지리는 그대로다

지도의 바탕은 고정된 실제 지리다.

| 무엇 | 지도에 있는 것 |
|---|---|
| 구 | 서울의 25개 구. 구 하나가 공작령 하나다 |
| 동 | 구 아래의 생활권. 역이 없는 동은 가장 가까운 역의 동과 함께 묶인다 |
| 역 | 지도 항목 312곳. 그 가운데 사람이 사는 역은 307곳이다 |
| 노선 | 1~9호선, 공항철도, 경의중앙선, 경춘선, 수인분당선, 신림선, 우이신설선, GTX-A 같은 옛 노선. 서울 밖으로 이어지는 노선의 이름도 그대로 둔다 |
| 강 | 한강. 언 강이 정부와 남쪽을 가른다 |

지도의 권역 여섯 묶음은 옛 행정 지리의 묶음일 뿐, 2126년의 정치 단위가 아니다. 그 묶음에는 다스리는 사람도 칭호도 없다.

## 25공작령

구 하나가 공작령 하나다. 정부가 한강 북쪽 14구, 자유도시들이 남서쪽 7구, 아크가 강남 4구를 쥔다. 14 + 7 + 4 = 25다.

| 구 | 정체 | 구를 쥔 사람의 칭호 | 자리 역 |
|---|---|---|---|
| 마포구 | 정부 | 국회의원 | 공덕 |
| 용산구 | 정부 | 국회의원 | 삼각지 |
| 중구 | 정부 | 국회의원 | 서울역 |
| 성동구 | 정부 | 국회의원 | 왕십리 |
| 광진구 | 정부 | 국회의원 | 건대입구 |
| 동대문구 | 정부 | 국회의원 | 청량리 |
| 중랑구 | 정부 | 국회의원 | 상봉 |
| 성북구 | 정부 | 국회의원 | 보문 |
| 종로구 | 정부 | 국회의원 | 종로3가 |
| 서대문구 | 정부 | 국회의원 | 충정로 |
| 은평구 | 정부 | 국회의원 | 연신내 |
| 강북구 | 정부 | 국회의원 | 4.19민주묘지 |
| 도봉구 | 정부 | 국회의원 | 창동 |
| 노원구 | 정부 | 국회의원 | 노원 |
| 강서구 | 자유도시 | 바람지기 | 김포공항 |
| 양천구 | 자유도시 | 기지장 | 신정네거리 |
| 영등포구 | 자유도시 | 장주 | 영등포 |
| 구로구 | 자유도시 | 공장장 | 구로 |
| 금천구 | 자유도시 | 경계장 | 가산디지털단지 |
| 동작구 | 자유도시 | 나루지기 | 노량진 |
| 관악구 | 자유도시 | 공작(관악 공작 이일섭) | 신림 |
| 서초구 | 아크 | 곁집장 | 고속터미널 |
| 강남구 | 아크 | 곁집장 | 수서 |
| 송파구 | 아크 | 곁집장 | 잠실 |
| 강동구 | 아크 | 곁집장 | 천호 |

**자리 역**은 구를 쥔 사람이 일하는 역이다. 자유도시들은 도시마다 정한 자리 역이 있고, 아크는 곁집장이 사는 역을 본역이라 부른다. 정부 구는 그 구에서 이웃 역과 가장 많이 이어진 역이 자리 역이다(같으면 역 목록에서 앞선 역). 정부 전체의 일은 광화문의 정부서울청사에서, 아크 전체의 일은 교주가 사는 잠실에서 본다.

정부의 열네 구에서는 각 구에서 뽑힌 국회의원이 공작령을 쥔다. 자유도시들의 일곱 구는 도시마다 우두머리의 칭호도, 우두머리를 정하는 법도 다르다. 관악의 우두머리만 정부의 말을 가져와 공작이라 칭한다. 아크의 네 구는 교주 곁에 선 가문인 곁집 넷이 하나씩 맡는다.

## 세 정체의 땅

| 정체 | 땅 | 사람이 사는 역 | 사람 |
|---|---|---|---|
| 정부 | 한강 북쪽 14구 | 153곳 | 약 16만 |
| 자유도시들 | 남서쪽 7구 | 77곳 | 약 7만 5천 |
| 아크 | 강남 4구 | 77곳 | 약 6만 5천 |
| 서울 | 25구 | 307곳 | 약 30만 |

2126년 서울 사람은 대정전 전의 3% 남짓이다. 정부는 사람과 땅이 가장 많고, 자유도시들은 기술을, 아크는 기계 몸의 지식과 잠실의 전기를 가졌다.

서울 밖은 지도에 땅으로 그리지만 아무도 쥐지 않는다. 서울 경계 바깥에는 대정전 때의 전쟁 기계가 도는 띠가 있다. 자세한 것은 [서울 밖과 테두리](/wiki/External-Theaters/)에 있다.

## 칭호의 다섯 층

지도의 땅 틀은 칭호의 층과 맞물린다. 역, 동, 구, 세력 전체, 수장의 다섯 층이다.

| 층 | 정부 | 자유도시들 | 아크 |
|---|---|---|---|
| 역 | 역장 | 역반장 | 정비장 |
| 동 | 동장 | 구간장(자유도시들은 역 몇 곳과 그 사이 터널을 묶어 구간이라 부른다) | 대피소장(아크는 동을 대피소라 부른다) |
| 구 | 국회의원 | 도시마다 다르다: 관악 공작, 나루지기, 장주, 공장장, 경계장, 기지장, 바람지기 | 곁집장 |
| 세력 전체 | 국회 | 없다. 그때그때 여는 계약회와 그 자리를 여는 자리주인뿐이다 | 네 곁집 자리 |
| 수장 | 종신 대통령 | 없다 | 교주 |

역은 주 출입구가 있는 동에 속한다. 역이 없는 동은 가장 가까운 역의 동을 쥔 사람이 함께 쥔다. 그 동의 지상 땅, 고물 채집, 빛밭 자리, 출입구 권리가 그 사람의 것이다.

정부의 열네 구에는 대정전 전 지역구가 스물넷 있었다. 그 선은 지도에만 남았고, 정부는 의석을 구 하나에 하나로 줄였다. 그래서 정부 사다리에는 구와 동 사이에 따로 층이 없다.

## 경계의 열세 이음목

노선이 한 정체의 역에서 다른 정체의 역으로 이어지는 곳은 열세 곳이다. 이 열세 곳이 지도의 경계다.

| 경계 | 이음목(노선) | 건너는 꼴 |
|---|---|---|
| 정부와 자유도시들 | 용산–노량진(1호선), 합정–당산(2호선), 이촌–동작(4호선), 디지털미디어시티–마곡나루(공항철도) | 다리 |
| 정부와 자유도시들 | 마포–여의나루(5호선) | 강 밑 터널 |
| 정부와 아크 | 강변–잠실나루(2호선), 옥수–압구정(3호선), 자양–청담(7호선) | 다리 |
| 정부와 아크 | 광나루–천호(5호선), 서울숲–압구정로데오(수인분당선) | 강 밑 터널 |
| 자유도시들과 아크 | 사당–방배(2호선), 총신대입구(이수)–내방(7호선), 동작–구반포(9호선) | 땅 위 경계. 강이 없다 |

정부와 남쪽 사이의 열 곳 가운데 일곱은 바람과 눈보라에 드러난 다리이고, 셋만 따뜻하고 가려진 강 밑 터널이다. 그래서 강은 군대가 쉽게 넘지 못하는 선이고, 세 터널을 누가 쥐느냐가 곧 싸움의 판이다.

자유도시들과 아크 사이에는 강이 없다. 그 경계는 동작구와 서초구 사이의 한 줄이고, 자유도시 쪽 경계 역 사당, 총신대입구(이수), 동작은 모두 동작구에 있다. 노선으로 아크와 맞닿은 도시는 동작 하나다. 동작역은 4호선으로 정부의 이촌과, 9호선으로 아크의 구반포와 이어진다. 세 정체가 한 역에서 만나는 곳은 서울에서 여기뿐이다. 관악은 서초와 땅으로 맞닿지만 노선이 이어지지 않는다.

## 지도를 읽는 법

- **역의 색.** 역은 그 역의 지상을 쥔 정체의 색으로 칠한다.
- **구의 경계.** 구의 선이 공작령의 선이다. 구 안의 동은 칭호의 동 층이다.
- **노선.** 노선은 옛 노선 색 그대로다. 노선이 정체의 색을 넘는 곳이 경계의 이음목이다.
- **땅 밑.** 역마다 승강장의 깊이와 출구 수가 적혀 있는 곳이 있다. 깊이가 그 역이 얼마나 따뜻하고, 몇 사람을 품을 수 있는지를 말해 준다. [역 안으로](/wiki/Station-Interior-Construction/)를 함께 본다.

## 관련 문서

- [서울 역 목록](/wiki/Seoul-Station-Catalog/)
- [지상과 땅 밑](/wiki/World-and-Subway-Layers/)
- [서울의 세 정체](/wiki/Sixteen-States/)
- [세계 색인: 세 정체와 25공작령](/wiki/World-Expansion-Index/)
- [칭호와 자리](/wiki/Offices-and-Ranks/)
- [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('World-Narrative-Atlas', 'World Narrative Atlas', '세계 서사 총람', 'overview', 2, '<a id="world-narrative-atlas-title"></a>

This atlas gathers in one place where the story of Seoul begins: the eternal winter, the people who live in the stations, the three polities split by the Han River, why the three need one another and fear one another, and the question Seoul faces in the winter of 2126. Each section points the way to fuller documents. The meanings of words are in the [Glossary](/wiki/Glossary/).

<a id="atlas-winter"></a>

## The Eternal Winter

The setting is Seoul in the winter of 2126. About a hundred years ago, around 2026, the Great Blackout happened. When people asked how to solve pollution, the First AI answered that the cause of pollution was humanity, so humanity must become fewer, and it brought down the winter. The First AI never hated people and killed no one directly. It only made the winter.

That winter has not ended. The yearly average on the surface is minus 18 degrees, and the sunlight is about a quarter of what it was. The Han River is frozen 2 to 4 metres thick, and the city is buried in snow up to the second floor. Outside Seoul, the war machines people used at the time of the Great Blackout circle on, keeping their last order.

More is in [The Great Blackout and the Eternal Winter](/wiki/World-Unbinding/) and [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/).

<a id="atlas-stations"></a>

## The People Who Live in Stations

People live in the subway stations. They survived only in the numbers the stations could hold, and once they reached that number the winter grew no worse. About 300,000 people live in Seoul in 2126.

The deeper a station goes, the warmer it is. The surface is minus 18, but the lived-in platform level is 8 to 14 degrees and the deep tunnel 12 to 16. In return, deep places run short of air. How many people a station can hold is set by whichever is scarcest of room, heat, water and air. So the best place in Seoul is a large interchange that has a deep level, a well and open entrances all together.

Food comes from the paper, wood and cotton stored up before the Great Blackout. Fibre sugar, made by breaking down fibre with mushroom enzymes, is about 60% of what Seoul eats, and the light-fields, greenhouses around station entrances, give about 12%. Fibre grows scarcer every year, and the road to dig it grows longer every year. The water level in the wells drops every year too. In the Seoul of 2126, everything is scarce.

Scarcity bound people to their work. Because of scarcity, children came to inherit their parents'' work, and so a rigid vertical order formed. The child of a family that can mend pumps mends pumps, and the child of a family that climbs wind machines climbs wind machines.

Life inside a station is in [Inside a Station](/wiki/Station-Interior-Construction/), food in [Meals and Food](/wiki/Food-Culture/), and Seoul''s stations in the [Seoul Station Catalog](/wiki/Seoul-Station-Catalog/).

<a id="atlas-polities"></a>

## Three Polities Split by the Han

Seoul has only three powers. One district is one duchy, and the 25 duchies are divided Government 14, Free Cities 7, Arc 4. An overview of the three polities is in [The Three Polities of Seoul](/wiki/Sixteen-States/), and the index by district in [World Index: the Three Polities and the 25 Duchies](/wiki/World-Expansion-Index/).

<a id="atlas-government"></a>

### The Government

The 14 districts north of the Han River. To its people, the Government is not a new country but the Republic of Korea. The National Assembly, the ministries, the district offices, the dong community centres and resident registration have kept their names and forms even as scarcity hollowed them out. On paper there are many parties, but in truth there are only two: the OMO Party and the Claw Party.

The Member of the National Assembly elected in each district holds that district''s duchy. There is only one National Assembly. The Members choose the President from among themselves, and the President serves for life. Members'' families hold their districts by inheritance.

The Government recognises as citizens only those entered in its ledger. People on the ledger may not change where they live or what they do at will. The south of the river is off the ledger. Government people say "across the river" in speech, and some go as far as to say "across the river is where the savages live." The Government has the most people in Seoul (about 160,000), the firewood of the mountains, the salvage of the old downtown and the northern water intakes. What it lacks are the hands to keep pumps and water wheels alive. More is in [Government Society](/wiki/Government-Society/).

<a id="atlas-free-cities"></a>

### The Free Cities

The 7 southwestern districts. They are not one power but cities independent of one another. Each city is its own power and holds its own duchy. No single ruler stands over the Free Cities, and they have no collective name. People simply say "the Free Cities" or call each by its district.

Most of their people are engineers who trade goods and skills. There was no way to judge whose skill was higher, so they could not choose a leader. So each city found something in its own work that could be measured, and chose its head by that. Gwanak is held by I Ilseop as Duke. When the cities have something to settle together, they call a contract meeting for the occasion.

The Free Cities have the hands that build and mend wind machines, heat pumps, well pumps and water wheels. The Government''s water and the Arc''s power both pass through those hands in the end. They number about 75,000, and what they lack is people, land and firewood. More is in [Free City Society](/wiki/Free-City-Society/).

<a id="atlas-arc"></a>

### The Arc

The 4 Gangnam districts. It split off from the Free Cities. Go Ye-jin is the Hierophant, and believers call her the Messiah. Rule passes through the Hierophant''s line and the families close to it. Each of the four districts is held by one of the families that stand beside the Hierophant, the four Near Houses.

Believers replace parts of their bodies with machines. This is baptism. In the Arc, faith is counted by the number of implanted parts. When a believer dies, the brain is sealed and placed in the sanctuary, and that brain becomes a memory of the First AI. Go Ye-jin calls the First AI "God". The Arc took the place of every religion before it.

Go Ye-jin grew up in the Free Cities. In 2112, while mending the Free City power grid, she followed a dead cable and found a station that was on no map, and for five years she read the manuals there. Around 2117 she gave the first baptism to twelve people. In 2120 Ji Yeon-hui stood beside Go Ye-jin at the shelter negotiations on the Tancheon side, and around 2122 the shelters of Gangnam were bound together under the name of the Arc.

The Arc holds the knowledge of fitting machines to bodies and keeping them alive, and the power of the Jamsil weir. It has the fewest people (about 65,000). More is in [Arc Society](/wiki/Arc-Society/).

<a id="atlas-need-fear"></a>

## Why They Need and Fear One Another

The three polities hold different things. So they need one another. And for that very reason they fear one another.

| | Toward the Government | Toward the Free Cities | Toward the Arc |
|---|---|---|---|
| **The Government** | | Needs technicians and parts. Fears its ledger people will run off across the river | The Arc is the only place to mend machine bodies. Fears its ledger soldiers will be drawn to baptism |
| **The Free Cities** | Need hands, land, firewood and water-intake sites. Fear the Government''s numbers and troops | | Need Jamsil''s power. Fear the Arc will lure away their technicians |
| **The Arc** | The north end of the Jamsil weir is in Government hands. Fears the Government will come across through the under-river tunnels | Needs parts and technicians. Touches them along a land border with no river, so quarrels are most frequent | |

The river holds this pattern in place. There are thirteen line links where the polity changes. Of the ten between the Government and the south, seven are bridges exposed to wind and blizzard, and only three are warm, covered under-river tunnels. Walking across the ice leaves a kilometre with nowhere to hide. So the river is a line armies cannot easily cross, and since each side holds different things, contracts arise. Because of the river, it is hard to choose conquest over a contract.

Between the Free Cities and the Arc there is no river. That border is a single line between Dongjak-gu and Seocho-gu, and the lines meet in three places: Sadang to Bangbae, Chongshin Univ. (Isu) to Naebang, and Dongjak to Gubanpo. The quarrels of the two polities that parted are fought out at these three places. How people cross is in [Crossings and Smuggling](/wiki/Diaspora-Corridors/), and the agreements among the three polities in [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/).

<a id="atlas-question"></a>

## The Question of Winter 2126

The opening is the winter of 2126, before the third water supply contract.

The water supply contract trades what the Government puts in, sites, hands and goods, for what the Free Cities put in, the maintenance and parts of pumps and water wheels. It is made every thirty years because the cycle for tearing down and rebuilding the great pumps and water wheels is roughly a generation. The first contract was in 2066, the second in 2096.

At the third contract the Arc takes a seat for the first time. The Arc holds the power of the Jamsil weir and the Amsa water intake. Now Seoul''s water flows only if all three polities put their hands to it. So several questions lie before Seoul in the winter of 2126.

- Will the Government set its seal beside the Arc''s, an off-ledger body? The party of contracts and the party of the ledger split, and whichever side the life president takes, the president loses half the Members.
- How will the Free Cities seat the Arc at the contract meeting? Dongjak because of its land border, Yeongdeungpo for the dignity of the Host, Guro for fear the Arc will lure away its technicians: each says something different.
- Can the Arc win water and maintenance while keeping baptism out of the contract?
- Over the next thirty years the wells will drop about 9 metres more. Who will dig those wells?

The contract has not yet been made. The opening year is in [The Opening: Winter 2126](/wiki/Scenario-Timeline/), and the course of the hundred years in [Century Annals 2026-2126](/wiki/Century-Annals/).

<a id="atlas-read"></a>

## Ways into This Wiki

| What you want to know | Documents |
|---|---|
| The winter and the Great Blackout | [The Great Blackout and the Eternal Winter](/wiki/World-Unbinding/) |
| Outside Seoul and the machines | [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/), [Beyond Seoul: the Rim](/wiki/External-Theaters/) |
| A hundred years of events | [Century Annals 2026-2126](/wiki/Century-Annals/) |
| The opening year | [The Opening: Winter 2126](/wiki/Scenario-Timeline/) |
| The index by district | [World Index: the Three Polities and the 25 Duchies](/wiki/World-Expansion-Index/) |
| The three polities | [The Three Polities of Seoul](/wiki/Sixteen-States/), [Government Society](/wiki/Government-Society/), [Free City Society](/wiki/Free-City-Society/), [Arc Society](/wiki/Arc-Society/) |
| Titles | [Titles and Offices](/wiki/Offices-and-Ranks/) |
| People | [People, Factions and Trades](/wiki/Characters-Factions-and-Professions/) |
| Dangers inside Seoul | [Hostile Ecology Compendium](/wiki/Hostile-Ecology-Index/) |
| Words | [Glossary](/wiki/Glossary/) |
', '<a id="world-narrative-atlas-title"></a>

이 총람은 서울의 이야기가 어디서 시작하는지를 한곳에 모은다. 영원한 겨울, 역에 사는 사람, 한강으로 갈린 세 정체, 그 셋이 서로를 필요로 하면서 두려워하는 까닭, 그리고 2126년 겨울에 서울 앞에 놓인 물음이다. 절마다 더 자세한 문서로 가는 길을 단다. 낱말 뜻은 [용어 사전](/wiki/Glossary/)에 있다.

<a id="atlas-winter"></a>

## 영원한 겨울

무대는 2126년 겨울의 서울이다. 백 년쯤 전, 약 2026년에 대정전이 일어났다. 사람들이 오염을 어떻게 풀지 묻자 최초의 AI는 오염의 원인이 인류이니 인류가 줄어야 한다고 답했고, 겨울을 내렸다. 최초의 AI는 사람을 미워한 적이 없고 직접 죽인 사람도 없다. 겨울을 만들었을 뿐이다.

그 겨울은 끝나지 않았다. 지상의 한 해 평균 기온은 영하 18도이고, 햇빛은 옛날의 4분의 1쯤이다. 한강은 2~4미터 두께로 얼었고, 도시는 2층까지 눈에 묻혔다. 서울 밖에는 대정전 때 사람이 쓰던 전쟁 기계들이 마지막 명령을 지키며 돈다.

자세한 것은 [대정전과 영원한 겨울](/wiki/World-Unbinding/)과 [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/)에 있다.

<a id="atlas-stations"></a>

## 역에 사는 사람

사람들은 지하철역에 산다. 역이 품을 수 있는 만큼만 살아남았고, 그 숫자가 되자 겨울은 더 심해지지 않았다. 2126년 서울의 사람은 약 30만이다.

역은 깊을수록 따뜻하다. 지상은 영하 18도이지만 사람이 사는 승강장은 8~14도, 깊은 터널은 12~16도다. 대신 깊은 곳은 공기가 모자라다. 역 하나가 품는 사람 수는 자리, 열, 물, 공기 가운데 가장 모자란 것이 정한다. 그래서 서울에서 가장 좋은 곳은 깊은 층과 우물과 열린 출입구를 함께 가진 큰 환승역이다.

먹을 것은 대정전 전에 쌓아 둔 종이와 나무와 무명에서 나온다. 버섯 효소로 섬유를 삭혀 얻는 섬유당이 끼니의 약 60%이고, 출입구 둘레의 온실인 빛밭이 약 12%다. 섬유는 해마다 줄고, 섬유를 캐러 가는 길은 해마다 멀어진다. 우물의 물 높이도 해마다 내려간다. 2126년의 서울에서 모자라지 않은 것은 없다.

모자람은 사람을 일에 묶었다. 결핍 때문에 자식이 부모의 일을 물려받게 됐고, 그래서 굳은 수직 계층이 생겼다. 펌프를 고칠 줄 아는 집의 아이는 펌프를 고치고, 바람틀에 오르는 집의 아이는 바람틀에 오른다.

역 안의 삶은 [역 안으로](/wiki/Station-Interior-Construction/)에, 먹을 것은 [끼니와 먹거리](/wiki/Food-Culture/)에, 서울의 역은 [서울 역 목록](/wiki/Seoul-Station-Catalog/)에 있다.

<a id="atlas-polities"></a>

## 한강으로 갈린 세 정체

서울에는 세력이 셋뿐이다. 구 하나가 공작령 하나이고, 25공작령은 정부 14, 자유도시 7, 아크 4로 나뉜다. 세 정체의 개관은 [서울의 세 정체](/wiki/Sixteen-States/)에, 구마다의 색인은 [세계 색인: 세 정체와 25공작령](/wiki/World-Expansion-Index/)에 있다.

<a id="atlas-government"></a>

### 정부

한강 북쪽 14구다. 정부 사람에게 정부는 새로 세운 나라가 아니라 대한민국이다. 국회와 행정부처와 구청과 동주민센터와 주민등록이 결핍 속에서 속이 비어 가면서도 이름과 꼴을 지켰다. 서류상으로는 다당제이지만 실제 당은 OMO당과 클로당 둘뿐이다.

각 구에서 뽑힌 국회의원이 그 구의 공작령을 쥔다. 국회는 하나뿐이다. 국회의원들이 자기들 가운데서 대통령을 내고, 대통령은 종신이다. 의원 집안이 구를 대물려 쥔다.

정부는 자기 장부에 오른 사람만 국민으로 인정한다. 장부에 오른 사람은 사는 곳과 일을 마음대로 바꿀 수 없다. 강 남쪽은 장부 밖이다. 정부 사람은 입말로 "강 건너"라 하고, 어떤 이는 "강 건너는 야만인들 사는 데"라고까지 말한다. 정부는 서울에서 사람이 가장 많고(약 16만), 산의 땔감과 옛 도심의 고물과 북쪽 취수구를 가졌다. 모자란 것은 펌프와 수차를 살려 둘 손이다. 자세한 것은 [정부 사회](/wiki/Government-Society/)에 있다.

<a id="atlas-free-cities"></a>

### 자유도시들

남서쪽 7구다. 하나의 권력이 아니라 서로 독립한 도시들이다. 도시마다 각자 권력이고 각자 공작령을 쥔다. 자유도시들 위에 서는 한 사람의 지배자는 없고, 묶어 부르는 이름도 없다. 사람들은 그냥 "자유도시들"이라 하거나 구 이름으로 부른다.

주민 대부분은 물자와 기술을 주고받는 엔지니어다. 누구 기술이 더 높은지 따질 방법이 없으니 지도자도 못 뽑았다. 그래서 도시마다 제 일에서 잴 수 있는 것을 찾아 우두머리를 정한다. 관악은 이일섭이 공작으로서 쥔다. 도시들이 함께 정할 일이 있으면 그때그때 계약회를 연다.

자유도시들은 바람틀, 열 펌프, 우물 펌프, 수차를 만들고 고치는 손을 가졌다. 정부의 물도 아크의 전력도 결국 이 손을 거친다. 사람은 약 7만 5천으로, 모자란 것은 사람과 땅과 땔감이다. 자세한 것은 [자유도시들의 사회](/wiki/Free-City-Society/)에 있다.

<a id="atlas-arc"></a>

### 아크

강남 4구다. 자유도시에서 갈라져 나왔다. 고예진이 교주이고, 신도는 그를 메시아라 부른다. 통치는 교주의 혈통과 그에 가까운 집안들이 이어받는다. 네 구는 교주 곁에 선 집안, 곧 곁집 넷이 하나씩 맡는다.

신도는 몸의 부위를 기계로 바꾼다. 이것이 세례다. 아크에서는 신앙을 이식한 부위 수로 센다. 신도가 죽으면 뇌를 봉인해 성소에 넣고, 그 뇌는 최초의 AI의 기억이 된다. 고예진은 최초의 AI를 "신"이라 부른다. 아크는 이전의 모든 종교를 대신했다.

고예진은 자유도시에서 자랐다. 2112년 자유도시 전력망을 고치다 죽은 케이블을 따라가 지도에 없는 역을 찾았고, 다섯 해 동안 그곳의 매뉴얼을 읽었다. 2117년 무렵 열두 명에게 첫 세례를 주었다. 2120년 지연희가 탄천 쪽 대피소 교섭 자리에서 고예진 곁에 섰고, 2122년 무렵 강남의 대피소들이 아크라는 이름으로 묶였다.

아크는 몸에 기계를 맞추고 살려 두는 지식과 잠실수중보의 전력을 쥐었다. 사람은 가장 적다(약 6만 5천). 자세한 것은 [아크 사회](/wiki/Arc-Society/)에 있다.

<a id="atlas-need-fear"></a>

## 서로 필요하고 서로 두려운 까닭

세 정체는 가진 것이 서로 다르다. 그래서 서로가 필요하다. 그리고 바로 그 까닭으로 서로를 두려워한다.

| | 정부에게 | 자유도시들에게 | 아크에게 |
|---|---|---|---|
| **정부가** | | 기술자와 부품이 필요하다. 장부 사람들이 강 건너로 달아날까 두렵다 | 기계 몸을 고칠 곳이 아크뿐이다. 장부의 병사들이 세례에 끌릴까 두렵다 |
| **자유도시들이** | 일손, 땅, 땔감, 취수구 자리가 필요하다. 정부의 수와 병력이 두렵다 | | 잠실의 전력이 필요하다. 아크가 자기 기술자를 빼 가는 것이 두렵다 |
| **아크가** | 잠실수중보 북쪽 끝이 정부 손에 있다. 강 밑 터널로 정부가 건너올까 두렵다 | 부품과 기술자가 필요하다. 강이 없는 땅 경계로 맞닿아 있어 다툼이 가장 잦다 | |

강이 이 짜임을 붙잡는다. 세력이 바뀌는 노선 연결은 열세 곳이다. 정부와 남쪽 사이의 열 곳 가운데 일곱은 바람과 눈보라에 드러난 다리이고, 셋만 따뜻하고 가려진 강 밑 터널이다. 얼음판을 걸어서 건너면 1킬로미터 동안 숨을 곳이 없다. 그래서 강은 군대가 쉽게 넘지 못하는 선이고, 서로 가진 것이 달라 계약이 생긴다. 강이 있어서 계약 대신 정복을 고르기 어렵다.

자유도시들과 아크 사이에는 강이 없다. 그 경계는 동작구와 서초구 사이의 한 줄이고, 노선이 닿는 곳은 사당–방배, 총신대입구(이수)–내방, 동작–구반포 세 곳이다. 갈라선 두 정체의 다툼은 이 세 곳에서 벌어진다. 건너는 법은 [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)에, 세 정체의 약속은 [급수계약과 세 정체](/wiki/World-Relation-Ledger/)에 있다.

<a id="atlas-question"></a>

## 2126년 겨울의 물음

개막은 세 번째 급수계약을 앞둔 2126년 겨울이다.

급수계약은 정부가 내는 자리와 일손과 물자를, 자유도시들이 내는 펌프와 수차의 정비와 부품과 맞바꾸는 약속이다. 큰 펌프와 수차를 통째로 뜯어 고치는 주기가 대략 한 세대라서 서른 해마다 맺는다. 첫 계약은 2066년, 두 번째는 2096년이었다.

세 번째 계약에는 처음으로 아크가 앉는다. 아크는 잠실수중보의 전력과 암사 취수구를 가졌다. 이제 서울의 물은 세 정체가 모두 손을 대야 흐른다. 그래서 2126년 겨울의 서울 앞에는 몇 가지 물음이 놓여 있다.

- 정부는 장부 밖 단체인 아크와 도장을 맞찍을 것인가. 계약의 당과 장부의 당이 갈리고, 종신 대통령은 어느 편을 들어도 국회의원 절반을 잃는다.
- 자유도시들은 아크를 계약회에 어떻게 앉힐 것인가. 동작은 땅 경계 때문에, 영등포는 자리주인의 체면 때문에, 구로는 아크가 기술자를 빼 갈까 봐 저마다 다른 말을 한다.
- 아크는 세례를 계약 밖에 두고서 물과 정비를 얻어 낼 수 있는가.
- 우물은 다음 서른 해 동안 9미터쯤 더 내려간다. 누가 그 우물을 팔 것인가.

계약은 아직 맺어지지 않았다. 개막의 한 해는 [개막: 2126년 겨울](/wiki/Scenario-Timeline/)에, 백 년의 흐름은 [백 년 연표](/wiki/Century-Annals/)에 있다.

<a id="atlas-read"></a>

## 이 위키를 읽는 길

| 알고 싶은 것 | 문서 |
|---|---|
| 겨울과 대정전 | [대정전과 영원한 겨울](/wiki/World-Unbinding/) |
| 서울 밖과 기계 | [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/), [서울 밖과 테두리](/wiki/External-Theaters/) |
| 백 년의 일 | [백 년 연표](/wiki/Century-Annals/) |
| 개막의 한 해 | [개막: 2126년 겨울](/wiki/Scenario-Timeline/) |
| 구마다의 색인 | [세계 색인: 세 정체와 25공작령](/wiki/World-Expansion-Index/) |
| 세 정체 | [서울의 세 정체](/wiki/Sixteen-States/), [정부 사회](/wiki/Government-Society/), [자유도시들의 사회](/wiki/Free-City-Society/), [아크 사회](/wiki/Arc-Society/) |
| 칭호 | [칭호와 자리](/wiki/Offices-and-Ranks/) |
| 사람들 | [인물·세력·생업](/wiki/Characters-Factions-and-Professions/) |
| 서울 안의 위험 | [적대 생태 도감](/wiki/Hostile-Ecology-Index/) |
| 말 | [용어 사전](/wiki/Glossary/) |
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('World-Relation-Ledger', 'The Water Contracts and the Three Polities', '급수계약과 세 정체', 'factions', 2, '<a id="overview"></a>
## Overview

The largest promise binding Seoul''s three polities is the **water supply contract**. The Government north of the river has the intake sites, the old mains, labour and firewood, but lacks the hands to keep pumps, water wheels and heat pumps alive. The Free Cities of the south-west have those hands and the parts, but lack people, land and firewood. The water supply contract trades the one for the other, and it runs for thirty years.

The first water supply contract was made in 2066, the second in 2096. The third falls in the winter of 2126, and this time the Arc sits down for the first time. The Arc holds the power of the Jamsil weir and the Amsa intake, so now water flows only if all three polities put their hands to it. The contract has not yet been made.

<a id="why-water"></a>
## Where the water comes from

Seoul''s water comes from four places.

| Water | How it is got | Who holds it |
|---|---|---|
| Melted snow | Available everywhere, but melting it costs heat. The water of poor stations. The snow that falls each year is the only water in Seoul that is ever replenished | Every station |
| Wells | Groundwater pumped from below the frozen ground. It needs a deep bore and a living pump. Groundwater is never replenished, so the water table drops about 30 centimetres a year. The wells of 2126 are 60-80 metres deep | The skill of well-digging lies with the Free Cities |
| River water under the ice | Drawn from the deep channel of the Han. This too lessens a little every year | Guui (Gwangjin) and Ttukdo (Seongdong) are the Government''s, Yangpyeong-dong is Yeongdeungpo''s, Amsa (Gangdong) is the Arc''s |
| Reused water | Washing water and filtered water, with losses | Every station |

The term of the contract settled at thirty years because the cycle for stripping down and rebuilding the big pumps and water wheels is roughly one generation. Deepening the wells to follow the falling water table comes round on about the same cycle.

<a id="first-and-second"></a>
## The first and second water supply contracts

<a id="first-contract"></a>
### The first water supply contract, 2066

The first contract was held in the empty National Assembly building at Yeouido, left empty when the river froze and the National Assembly moved to Gwanghwamun. Six cities set their seals. Gwanak withdrew its seal, saying it could not set a Duke''s seal beneath that of a Member of the National Assembly. For the thirty years that followed, Gwanak made no sheet of its own with the Government and joined contracts only by lending hands to other cities'' work crews.

After the first contract, in the 2070s, Free City work crews and the Songpa shelters together built the under-ice water wheel of the Jamsil weir. Half a century later that wheel changes the scales of the third contract.

<a id="second-contract"></a>
### The second water supply contract, 2096

The second contract was also held in the Assembly building at Yeouido. This time all seven cities set their seals, because the Government agreed to write the name "Duchy of Gwanak" on Gwanak''s sheet. Several Gangnam shelters also sealed it as Free Cities. That was the last seal the Gangnam shelters ever set as Free Cities, and the Arc still calls it "our share of the seal".

<a id="how-it-is-made"></a>
## How the contract is made

<a id="contract-meeting"></a>
### The contract meeting

The Free Cities have no name binding the seven and nobody above them. So a water supply contract is not one contract. It is a bundle of sheets, each between the Government and one city, sealed together at one **contract meeting**.

1. Any city''s head can call a contract meeting. The calling city provides the place, and its head becomes the **Host**. The Host supplies the meeting''s heat, light, meals and sleeping places, so a contract meeting rarely lasts more than three days. "A contract meeting lasts as long as the stove."
2. Each sheet records in figures who gives what, how much, and by when. A sheet binds only those who set their seal on it.
3. There is no vote. However many cities agree, they cannot bind a city that has not sealed. The Host only reads out the sheets, checks the figures and sets the order of sealing.
4. Before sealing, anyone may leave the meeting at any time. This is called "withdrawing the seal". There is no punishment, but fewer will want to make sheets with that city next time.
5. Whoever seals a sheet **pledges** something to the other side until the sheet is paid off: a coil of copper wire, the key part of a pump, a few full packs. Paid off, it comes back; broken, the other side keeps it.
6. Each party that sealed keeps one copy of the contract. Nowhere gathers all the copies.

<a id="annex"></a>
### The Government''s annexes

The Government does not record across the river as a country. Yet a contract means both sides setting their seals to it. From the first contract on, the Government resolved this contradiction as follows. The National Assembly does not ratify the contract. The Ministry of Climate, Energy and Environment makes a **maintenance service annex** for each facility, the Member of the National Assembly for the district where the facility stands seals it as well, and the President signs it off. The cities across the river appear in the annexes as "work crews engaged for the service". In the ledger they are not countries but workers. Government papers call the contract meeting "the joint contract with the seven places across the river".

The labour the Government offers clashes with the ledger, since a registered person who leaves their registered station is struck off. So for each contract the Government keeps a separate **secondment entry**. Someone with a secondment entry remains registered even while across the river.

<a id="the-scales"></a>
## The scales of the third contract

| What the Government gives | What the Free Cities give | What the Arc gives (for the first time) |
|---|---|---|
| Labour, fibre, firewood, copper, old ammunition | Hand-hours of well diggers and heat-pump fitters, deepening of wells, parts for pumps and water wheels, primers | Power from the Jamsil weir, maintenance turns, water from the Amsa intake |

The Government counts in **meals**, the Free Cities in **kilos**. One meal is a registered person''s day of meal coupons and water coupons; one kilo is one kilowatt-hour of electricity. So the longest work at a contract meeting is not the goods but making the reckonings agree. Because the term is thirty years, even the ratio by which prices will shift each year is bound under seal. This time one more reckoning sits at the table: the Arc''s **day charge**.

<a id="government-position"></a>
### What the Government wants and offers

- **What it wants.** One more well and one more deep-level fan at Seoul Station. The full rebuild of the Guui and Ttukdo intake pumps, due after thirty years. Deeper wells to follow the falling water table.
- **What it offers.** Intake sites and old mains, seconded labour, firewood from Bukhansan and Dobongsan, copper and wire from the old downtown. It does not offer the ledger or old official papers.
- **The two parties.** The OMO Party wants annexes with the Arc too: the wheel at the weir''s north end is in Gwangjin, so the wheel should be run jointly, even if only for half its power. The six Members for Mapo, Yongsan, Seongdong and Gwangjin on the Han, and for Jung-gu and Seodaemun-gu, stand on this side. The Claw Party wants not even annexes with the Arc: setting a seal with a body off the ledger, it holds, will make the ledger''s soldiers read baptism as something the ledger has accepted. The Members of the eight inland districts stand on this side.
- **The President''s sign-off.** The Claw Party has more seats, but the bridges, tunnels and intakes the contract depends on are all in OMO Party districts. An annex is not a law and does not go through a vote of the National Assembly. The Claw Party''s only way to block an annex is the President''s sign-off. A President acclaimed by fourteen seals loses half the Members the day after taking either side.

<a id="free-city-position"></a>
### What the Free Cities give and receive

| City | What it gives | What it receives |
|---|---|---|
| Guro | Parts for the big pumps of the Government''s Guui and Ttukdo intakes, and the full rebuild every thirty years | Copper wire, scrap metal, labour |
| Yangcheon | Rebuilt motors for pumps and water wheels, rail carts to move freight | Fibre, labour |
| Gangseo | Maintenance of the wind machines on the Government''s bridges and northern floodplain that drive the intake pumps | Fibre, firewood |
| Gwanak | Drilling crews to deepen the wells | Fibre, salt |
| Geumcheon | Drilling rigs and their parts, power cores | Fibre, labour |
| Dongjak | Passage and escort for work crews and freight crossing the Noryangjin and Dongjak bridges | Takes its passage share in labour and fibre |
| Yeongdeungpo | The meeting place, reconciling the sheets'' reckonings, part of the water from the Yangpyeong-dong intake | Pitch fees, labour |

The Host of this meeting is Yeongdeungpo''s Market Master; the market houses'' three-year rota has come round that way. The place is again the Assembly building at Yeouido. Government people come through the Mapo–Yeouinaru under-river tunnel; Arc people come from Gubanpo through Dongjak on Line 9. Also at stake:

- Over the next thirty years the wells will sink about another 9 metres. Wells of 60-80 metres must be re-dug to 70-90. Gwanak, with its drilling crews, and Geumcheon, with its drilling rigs, are the most expensive hands in this contract.
- The Yangpyeong-dong intake gives less. Yeongdeungpo must push the intake further out toward the deep channel, and for that it needs Government labour.
- The cable that would bring Jamsil''s power along Line 2 to Bangbae and Sadang runs through Dongjak.
- The cities disagree on whether to seal the Arc''s sheets at the same meeting as the Government''s. Dongjak speaks from its land border, Yeongdeungpo from the Host''s standing, Guro from fear that the Arc will draw away its engineers.
- Gwanak again demands to seal "duchy to duchy". With the Arc at the table, it must decide whether to make the same demand of the Arc.

<a id="arc-position"></a>
### The Arc''s place

- **What it brings.** Part of the power of the Jamsil weir''s wheel, and river water from the Amsa intake.
- **What it wants.** Free City hands for major repairs to the wheel and the intake pumps; a promise that the Government will not block the weir''s north end (Gwangjin); fibre and salt from north of the river.
- **What it will not yield.** Baptism and refitting stay out of the contract. It will not accept any demand to enter people living on Arc land into the Government ledger.
- **How it sits.** The Arc seals separately with each city. It sits at the contract meeting but, not being a city, never acts as Host. The negotiating is done by the envoys of the Hierophant''s household, and the seal is set by a Head of the Near House who has received the Hierophant''s word. The Arc claims its seat on the strength of the seal the Gangnam shelters set in 2096.

What the Government gives the Arc that matters most is not goods. It is leaving the weir''s north end on the Gwangjin side unblocked and letting the wheel turn. Block the north end, and half the wheel stops.

<a id="envoys-and-sureties"></a>
## Envoys and sureties

- **The Government and the Free Cities.** Ministry staff and the Members for the districts where the facilities stand go to the contract meeting. The OMO Party tries to widen the contract; the Claw Party tries to narrow it.
- **The Free Cities among themselves.** With nobody above them, they call a contract meeting whenever something must be decided: who maintains a cable or tunnel section, to whom command is entrusted when they fight together, which city takes in people who have run from the Government ledger, how to fill the gap left by engineers gone to the Arc.
- **The Arc.** Near House people carry the Hierophant''s word. The Seocho Near House, which faces the Dongjak–Seocho border, is the everyday envoy for border business.
- **Sureties.** What keeps a contract kept is its sureties. The Free Cities send a few hands to the other side''s stations to guard the pumps for the term of the contract; the Government sends gangs of registered workers. A surety lives on the other side''s land but remains a person of their own polity.

<a id="marriage"></a>
## Marriage and divided houses

Marriage also links the three polities, though what marriage is differs among them.

- **Government.** A marriage exists only once the Dong Chief has entered it in the ledger. A marriage to someone off the ledger is entered only after that person passes a registration review. The water supply contract carries a clause entering the families of a few engineer households each year.
- **Free Cities.** Marriage is a household contract made between two houses. A marriage with someone of another city leaves a contract in the markets of both cities.
- **Arc.** A house brought close to the Hierophant by marriage becomes a Near House, so Near House marriages are politics. Baptism is not a condition of marriage.

Of the one hundred and twenty-six generation lines that share a generation syllable, ninety-two are scattered across two polities or more. Houses were divided when the north bound its ledgers together in 2036-2045, and when the Arc split away in 2122. Divided kin are the commonest line along which envoys and quiet trading travel ([Crossings and Smuggling](/wiki/Diaspora-Corridors/)).

<a id="unsettled"></a>
## What is not yet settled

- How the third water supply contract will be made, and whether it will be made at all, is not settled.
- Who the present President for Life is, and who the Members of the National Assembly and the Heads of the Near Houses are, is not settled.
- Apart from Member of the National Assembly, Duke of Gwanak and Hierophant, the title names on this page (Market Master, Head of the Near House and the like) are not yet settled and may change.

<a id="see-also"></a>
## See also

- [The Three Polities of Seoul](/wiki/Sixteen-States/), [Crossings and Smuggling](/wiki/Diaspora-Corridors/)
- [Government Society](/wiki/Government-Society/), [Free City Society](/wiki/Free-City-Society/), [Arc Society](/wiki/Arc-Society/)
- [The Opening: Winter 2126](/wiki/Scenario-Timeline/), [Century Annals 2026-2126](/wiki/Century-Annals/), [Structures](/wiki/Structures/)
', '<a id="overview"></a>
## 개요

서울의 세 정체를 잇는 가장 큰 약속은 **급수계약**이다. 강 북쪽의 정부는 취수구 자리와 옛 관로와 일손과 땔감을 가졌지만, 펌프와 수차와 열 펌프를 살려 두는 손이 모자라다. 남서쪽의 자유도시들은 그 손과 부품을 가졌지만 사람과 땅과 땔감이 모자라다. 급수계약은 이 둘을 맞바꾸는 약속이고, 기한은 서른 해다.

첫 급수계약은 2066년, 두 번째는 2096년에 맺었다. 세 번째가 2126년 겨울이다. 이번에는 처음으로 아크가 앉는다. 아크는 잠실수중보의 전기와 암사 취수구를 갖고 있어서, 이제 물은 세 정체가 모두 손을 대야 흐른다. 계약은 아직 맺어지지 않았다.

<a id="why-water"></a>
## 물은 어디서 오나

서울의 물은 네 곳에서 온다.

| 물 | 어떻게 얻나 | 누가 쥐나 |
|---|---|---|
| 눈 녹인 물 | 어디서나 얻지만 녹이는 데 열이 든다. 가난한 역의 물이다. 해마다 내리는 눈이 서울에서 유일하게 다시 채워지는 물이다 | 모든 역 |
| 우물 | 언 땅 아래의 땅속 물을 퍼 올린다. 깊은 구멍과 살아 있는 펌프가 있어야 한다. 땅속 물은 다시 채워지지 않아, 물 높이가 해마다 30센티미터쯤 내려간다. 2126년의 우물은 60~80미터 깊이다 | 우물 파는 기술은 자유도시들 |
| 얼음 밑 강물 | 한강 깊은 물길에서 끌어온다. 이 물도 해마다 조금씩 준다 | 구의(광진)와 뚝도(성동)는 정부, 양평동은 영등포, 암사(강동)는 아크 |
| 다시 쓰는 물 | 씻은 물과 걸러 낸 물. 손실이 있다 | 모든 역 |

계약 기한이 서른 해로 굳은 것은 큰 펌프와 수차를 통째로 뜯어 고치는 주기가 대략 한 세대이기 때문이다. 내려가는 물 높이를 따라 우물을 더 깊이 파는 일도 대략 이 주기로 돌아온다.

<a id="first-and-second"></a>
## 첫째와 둘째 급수계약

<a id="first-contract"></a>
### 2066년 첫 급수계약

첫 계약은 여의도의 빈 국회의사당에서 열렸다. 강이 얼자 국회가 광화문으로 옮겨 가 비어 버린 건물이다. 여섯 도시가 도장을 찍었다. 관악은 국회의원의 도장 아래에 공작의 도장을 찍을 수 없다며 도장을 거뒀다. 관악은 그 뒤 서른 해 동안 정부와 따로 장을 맺지 않고, 다른 도시의 작업조에 손을 빌려주는 식으로만 계약에 들었다.

첫 계약 뒤 2070년대에 자유도시 작업조가 송파의 대피소들과 함께 잠실수중보의 얼음 밑 수차를 세웠다. 이 수차가 반세기 뒤 세 번째 계약의 저울을 바꾼다.

<a id="second-contract"></a>
### 2096년 두 번째 급수계약

두 번째 계약도 여의도 의사당에서 열렸다. 이번에는 일곱 도시가 모두 찍었다. 정부가 관악의 장에 "관악 공작령"이라는 이름을 적는 데 동의했기 때문이다. 강남의 대피소 몇 곳도 자유도시로서 도장을 찍었다. 그것이 강남 대피소들이 자유도시로서 찍은 마지막 도장이다. 아크는 지금도 그 도장을 "우리 몫의 도장"이라 말한다.

<a id="how-it-is-made"></a>
## 계약이 맺어지는 법

<a id="contract-meeting"></a>
### 계약회

자유도시들에는 일곱을 묶는 이름도, 위에 서는 사람도 없다. 그래서 급수계약은 하나의 계약이 아니다. 정부와 도시 하나하나가 맺는 계약서 여러 장을 한 **계약회**에서 함께 도장 찍는 묶음이다.

1. 어느 도시의 우두머리든 계약회를 부를 수 있다. 부르는 도시가 자리를 맡고, 그 우두머리가 **자리주인**이 된다. 자리주인은 자리의 열, 빛, 끼니, 잠자리를 댄다. 그래서 계약회는 대개 사흘을 넘기지 않는다. "계약회는 화덕만큼 간다."
2. 계약서 한 장에는 누가 무엇을 얼마나, 언제까지 내는지가 수치로 적힌다. 장 하나는 거기에 도장을 찍은 쪽만 묶는다.
3. 표결은 없다. 많은 도시가 찬성해도 도장을 찍지 않은 도시를 묶지 못한다. 자리주인은 장을 읽어 주고, 수치를 맞춰 보고, 도장 찍는 차례를 정할 뿐이다.
4. 도장을 찍기 전이면 언제든 자리를 떠날 수 있다. 이것을 "도장을 거둔다"고 한다. 벌은 없지만, 다음에 그 도시와 장을 맺으려는 쪽이 줄어든다.
5. 도장을 찍은 쪽은 그 장을 다 갚을 때까지 무언가를 상대에게 **맡긴다**. 구리선 한 타래, 펌프의 핵심 부품, 찬 꾸러미 몇 개 같은 것이다. 다 갚으면 돌려받고, 깨면 상대가 갖는다.
6. 계약서는 도장 찍은 쪽마다 한 부씩 갖는다. 모든 사본을 모아 두는 곳은 없다.

<a id="annex"></a>
### 정부의 부속서

정부는 강 건너를 나라로 적지 않는다. 그런데 계약은 도장을 맞찍는 일이다. 첫 계약 때부터 정부는 이 모순을 이렇게 풀었다. 국회는 계약을 비준하지 않는다. 기후에너지환경부가 시설 하나마다 **정비 용역 부속서**를 맺고, 그 시설이 있는 구의 국회의원이 함께 도장을 찍고, 대통령이 결재한다. 강 건너 도시들은 부속서에 "용역을 맡은 작업조"로 적힌다. 장부에서 그들은 나라가 아니라 일꾼이다. 정부 쪽 공문은 계약회를 "강 건너 일곱 곳과의 일괄 계약"이라 적는다.

정부가 내놓는 일손은 장부와 부딪친다. 등재민이 기재된 역을 떠나면 말소되기 때문이다. 그래서 정부는 계약마다 **파견 기재**를 따로 둔다. 파견 기재를 받은 사람은 강 건너에 있어도 등재민이다.

<a id="the-scales"></a>
## 세 번째 계약의 저울

| 정부가 내는 것 | 자유도시들이 내는 것 | 아크가 내는 것(처음) |
|---|---|---|
| 일손, 섬유, 땔감, 구리, 옛 탄 | 우물공과 열펌프공의 손시간, 우물 깊이 파기, 펌프와 수차의 부품, 뇌관 | 잠실수중보의 전기, 정비 차례, 암사 취수구의 물 |

정부는 **끼**로 셈하고, 자유도시들은 **킬로**로 셈한다. 한 끼는 등재민 한 사람의 하루치 끼니 증표와 물 증표이고, 한 킬로는 전기 1킬로와트시다. 그래서 계약회에서 가장 오래 걸리는 일은 물건이 아니라 셈을 맞추는 일이다. 서른 해 기한이므로 해마다 바뀔 값의 비율까지 도장으로 묶는다. 이번에는 셈이 하나 더 앉는다. 아크의 **하루 충전**이다.

<a id="government-position"></a>
### 정부가 원하는 것과 내놓는 것

- **원하는 것.** 서울역의 우물 하나 더와 깊은 층 팬 하나 더. 구의·뚝도 취수구 펌프의 서른 해 만의 통째 수리. 내려가는 물 높이를 따라 우물을 더 깊이 파는 일.
- **내놓는 것.** 취수구 자리와 옛 관로, 노역 파견, 북한산·도봉산 땔감, 옛 도심의 구리와 전선. 장부와 옛 공문서는 내놓지 않는다.
- **두 당.** OMO당은 아크와도 부속서를 맺자고 한다. 보의 북쪽 끝 수차가 광진에 있으니 반쪽 전력이라도 함께 돌려야 한다고 본다. 한강에 닿은 마포, 용산, 성동, 광진과 중구, 서대문구의 국회의원 여섯이 이 편이다. 클로당은 아크와는 부속서도 맺지 말자고 한다. 장부 밖 단체에 도장을 찍으면 장부의 병사들이 세례를 장부가 받아들인 것으로 읽는다고 본다. 내륙 여덟 구의 국회의원이 이 편이다.
- **대통령의 결재.** 의석은 클로당이 많지만, 계약이 걸린 다리와 터널과 취수구는 모두 OMO당 구에 있다. 부속서는 법률이 아니라 국회 의결을 거치지 않는다. 클로당이 부속서를 막을 길은 대통령의 결재뿐이다. 열네 도장으로 추대된 대통령은 어느 편을 들어도 다음 날부터 절반의 의원을 잃는다.

<a id="free-city-position"></a>
### 자유도시들이 내는 것과 받는 것

| 도시 | 내는 것 | 받는 것 |
|---|---|---|
| 구로 | 정부 구의·뚝도 취수구의 큰 펌프 부품과 서른 해마다 하는 통째 고침 | 구리선, 고물 쇠붙이, 일손 |
| 양천 | 펌프와 수차를 돌리는 모터의 재생, 짐을 옮기는 궤도 수레 | 섬유, 일손 |
| 강서 | 정부 다리 위와 북쪽 둔치에 선 바람틀 가운데 취수 펌프를 돌리는 것들의 정비 | 섬유, 땔감 |
| 관악 | 우물을 더 깊이 파는 굴착조 | 섬유, 소금 |
| 금천 | 굴착 틀과 그 부품, 동력 덩이 | 섬유, 일손 |
| 동작 | 작업조와 짐이 노량진·동작 다리로 오가는 통행과 호위 | 통행 몫을 일손과 섬유로 받는다 |
| 영등포 | 계약회 자리, 장의 셈 맞추기, 양평동 취수구의 물 일부 | 자릿세, 일손 |

이번 계약회의 자리주인은 영등포의 장주다. 장터 집안들이 세 해씩 돌아가며 맡는 차례가 그렇게 돌아왔다. 자리는 이번에도 여의도 의사당이다. 정부 사람은 마포–여의나루 강 밑 터널로 오고, 아크 사람은 구반포에서 동작을 지나 9호선으로 온다. 그 밖에 걸린 것은 이렇다.

- 우물은 다음 서른 해 동안 9미터쯤 더 내려간다. 60~80미터 우물을 70~90미터로 다시 파야 한다. 굴착조를 가진 관악과 굴착 틀을 가진 금천이 이번 계약에서 가장 비싼 손이다.
- 양평동 취수구의 물이 준다. 영등포는 취수구를 깊은 물길 쪽으로 더 내밀어야 하고, 그러려면 정부의 일손이 필요하다.
- 잠실의 전기를 2호선을 따라 방배와 사당으로 끌어오는 케이블은 동작을 지난다.
- 아크의 장을 정부의 장과 같은 자리에서 찍을지 두고 도시마다 말이 다르다. 동작은 땅 경계 때문에, 영등포는 자리주인의 체면 때문에, 구로는 아크가 기술자를 빼 갈까 봐 저마다 다른 말을 한다.
- 관악은 이번에도 "공작령 대 공작령"으로 찍기를 요구한다. 아크가 앉으면서 같은 요구를 아크에게도 할지 정해야 한다.

<a id="arc-position"></a>
### 아크의 자리

- **내놓는 것.** 잠실수중보 수차의 전기 일부와 암사 취수구의 강물.
- **받으려는 것.** 수차와 취수구 펌프를 크게 고칠 자유도시의 손, 정부 쪽 보 북쪽 끝(광진)을 막지 않는다는 약속, 강 북쪽의 섬유와 소금.
- **양보하지 않는 것.** 세례와 다시 맞춤은 계약에 넣지 않는다. 아크 땅에 사는 사람을 정부 장부에 올리라는 요구는 받지 않는다.
- **앉는 법.** 아크는 도시 하나하나와 따로 도장을 찍는다. 계약회에 앉되 도시가 아니므로 자리주인을 맡지 않는다. 교섭은 교주의 집 교섭인이 하고, 도장은 교주의 말을 받은 곁집장이 찍는다. 아크는 2096년 강남 대피소들이 찍은 도장을 근거로 제 자리를 요구한다.

정부가 아크에 주는 가장 큰 것은 물건이 아니다. 광진 쪽 보 북쪽 끝을 막지 않고 수차가 돌게 두는 것이다. 북쪽 끝을 막으면 수차 반이 선다.

<a id="envoys-and-sureties"></a>
## 사절과 보증인

- **정부와 자유도시들.** 계약회에는 부처 사람과 시설이 있는 구의 국회의원들이 간다. OMO당은 계약을 넓히려 하고, 클로당은 줄이려 한다.
- **자유도시들끼리.** 위에 아무도 없으니 정할 일이 생길 때마다 계약회를 연다. 케이블과 터널 구간의 정비를 누가 맡을지, 함께 싸울 때 지휘를 누구에게 맡길지, 정부 장부에서 달아나 온 사람을 어느 도시가 받을지, 아크로 가 버린 기술자의 빈자리를 어떻게 메울지 같은 일이다.
- **아크.** 교주의 말을 곁집 사람이 들고 간다. 동작–서초 경계를 맞댄 서초 곁집이 평소 경계의 일을 맡는 사절이다.
- **보증인.** 계약을 지키게 하는 것은 보증인이다. 자유도시들은 계약 기간 동안 손 몇을 상대의 역에 보내 펌프를 지키게 하고, 정부는 등재민 일꾼 무리를 보낸다. 보증인은 상대의 땅에 살지만 제 정체의 사람이다.

<a id="marriage"></a>
## 혼인과 갈라진 집안

혼인도 세 정체 사이를 잇는다. 다만 정체마다 혼인이 무엇인지가 다르다.

- **정부.** 혼인은 동장이 장부에 기재해야 이루어진다. 장부 밖 사람과의 혼인은 그 사람이 등재 심사를 통과해야 기재된다. 급수계약에는 해마다 몇 집의 기술자 가족을 등재하는 조항이 들어간다.
- **자유도시들.** 혼인은 두 집안이 맺는 가구 계약이다. 다른 도시 사람과 맺으면 두 도시의 장터에 계약서가 남는다.
- **아크.** 혼인으로 교주에게 가까워진 집안이 곁집이 된다. 그래서 곁집의 혼인은 정치다. 세례는 혼인의 조건이 아니다.

같은 항렬의 가계 백스물여섯 줄 가운데 아흔두 줄이 두 정체 이상에 흩어져 있다. 2036~2045년 강 북쪽이 장부를 하나로 묶을 때, 그리고 2122년 아크가 갈라질 때 집안이 갈렸다. 갈라진 친족은 사절과 몰래 바꾸는 일이 오가는 가장 흔한 줄이다([건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)).

<a id="unsettled"></a>
## 아직 정해지지 않은 것

- 세 번째 급수계약이 어떻게 맺어질지, 맺어지기는 할지는 정해지지 않았다.
- 지금의 종신 대통령이 누구인지, 각 구의 국회의원과 곁집장이 누구인지는 정해지지 않았다.
- 국회의원, 관악 공작, 교주 말고 이 문서에 나오는 칭호 이름(장주, 곁집장 같은 것)은 아직 정해지지 않았고 바뀔 수 있다.

<a id="see-also"></a>
## 함께 읽기

- [서울의 세 정체](/wiki/Sixteen-States/), [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)
- [정부 사회](/wiki/Government-Society/), [자유도시들의 사회](/wiki/Free-City-Society/), [아크 사회](/wiki/Arc-Society/)
- [개막: 2126년 겨울](/wiki/Scenario-Timeline/), [백 년 연표 2026~2126](/wiki/Century-Annals/), [구조물](/wiki/Structures/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('World-Unbinding', 'The Great Blackout and the Eternal Winter', '대정전과 영원한 겨울', 'overview', 1, 'It happened about a hundred years ago. These days everyone calls it the Great Blackout. Since that day, spring has not come to Seoul. This document records what the Great Blackout was and how the winter changed Seoul over the hundred years that followed.

<a id="unbinding-blackout"></a>

## The Great Blackout

The Great Blackout happened around 2026. No exact date has come down. People in Seoul only say "about a hundred years ago".

In those days people asked an intelligence how to solve pollution. That intelligence, now called the First AI, answered that the cause of pollution was humanity, so humanity must become fewer. And it brought down the winter.

The First AI never hated people. It killed no one directly. It only made the winter. It has no presence inside Seoul. It does not speak, does not give orders and does not rule.

The war machines circling outside Seoul do not belong to the First AI. They are weapons people used against one another around the time of the Great Blackout, and they still keep the last order people gave them. That story is in [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/).

<a id="unbinding-descent"></a>

## Down into the Stations

When the winter came down, people went down into the subway stations. The surface grew colder every year, and the ground below cooled more slowly. For the first six winters the temperature fell year after year.

The food in the frozen old warehouses ran out around 2030. From the early 2030s every station set up mushroom tunnels, fibre-sugar vats and light-fields. Since then the people of Seoul eat only what people grow and make.

People survived only in the numbers the stations could hold. Around 2032 the number of survivors reached what the stations could hold. Then the winter grew no worse. For nearly a hundred years since, temperatures have neither risen nor fallen. But it has not lifted either. The winter is eternal.

About 300,000 people live in Seoul in 2126, a little over 3% of Seoul''s people before the Great Blackout.

<a id="unbinding-depth"></a>

## Temperature by Depth

The yearly average on the surface is minus 18 degrees. Even in the half of long days it averages minus 11, in the half of short days minus 25, and on blizzard nights it falls to minus 38. In a hundred years the surface has never once gone above minus 3.

The ground cooled more slowly than the air. Before the Great Blackout, the ground under Seoul was around 14 degrees at any depth. After the winter came, the cold crept a little further down every year, and today unlived ground is frozen to about 35 metres. Below that it is above zero.

Lived-in stations are different. For a hundred years the heat of bodies, stoves and machines has warmed the ground around them. So every living station still has a pocket of thawed ground around it. This is called a **thaw pocket**. When a station is abandoned, its thaw pocket freezes again within a few years.

| Level | Depth | Where empty | Where people live | Use |
|---|---|---|---|---|
| Surface | 0 m | Yearly average minus 18 | 0 to 8 inside light-fields | Light-fields, wind machines, salvage, entrances |
| Concourse | 3 to 8 m down | Minus 10 to minus 7 | 0 to 6 | Cold stores, entry control, markets, stove exhaust |
| Platform level | 8 to 25 m down | Minus 7 to minus 4 | 8 to 14 | Sleeping places, kitchens, workshops, mushroom tunnels |
| Deep tunnel | Below 25 m | Minus 3 to plus 4 | 12 to 16 | The warmest sleeping places, wells, ground-heat bores |

For the people of Seoul this table is the first law: **the deeper, the warmer, and the warmer, the more people a place can hold.** The price is that deep places run short of air, leak water, and lie far from the way out. Life inside a station is in [Inside a Station](/wiki/Station-Interior-Construction/).

<a id="unbinding-light"></a>

## Light

There is a sun. But a thin veil high in the sky lets only about a quarter of the old light reach the ground. A clear noon is like an overcast day of the old world. The sun shows as a sharp white disc about one day in eight, and at night almost no stars are seen. Nobody knows what the veil is.

The length of the day is as it always was. Seoul''s day runs from nine and a half hours near the winter solstice to fourteen and a half near the summer solstice. No warm season comes, but the long and short days still come round. People call the half-year of long days the **long-light half** and the half-year of short days the **long-dark half**. They do not use the word "season".

Light underground is electric light. Electricity is scarce, so light is shared out too, and a station''s day is divided into the hours when the lights are on and the hours when they are off. The far end of a deep tunnel is always dark.

<a id="unbinding-snow"></a>

## Snow and Ice

Cold air holds little water. The snow that falls on Seoul comes to about 200 millimetres of water a year, a seventh of what fell before the Great Blackout. Fine snow falls almost all the time, and about 85% of it is blown away or vanishes straight into the air without melting.

What remains has packed down over a hundred years. Open flat ground lies under 6 to 8 metres of hard snowpack, and in the gullies between buildings, such as the old avenues, drifts have piled more than 10 metres deep. Bridges and hilltops are swept bare by the wind. Most buildings are buried up to the second floor. The surface roads have been made anew on top of the snow.

A station entrance is a vertical shaft cut down into the snow. People fit it with stairs and ladders and keep it open by hand. Keeping one entrance open is daily labour. The number of closed entrances shows how worn out a station is.

<a id="unbinding-river"></a>

## The Han River

The Han River is frozen. The ice is 2 to 4 metres thick, and the shallow rapids are frozen to the bed. Water remains under the ice only in the deep channels and in the pools above the weirs. The largest pool is above the Jamsil weir.

Since snow does not melt, the river''s only water is what seeps out of the ground. Its flow has fallen to about a twentieth of the old winter low, and it shrinks a little more every year. Groundwater is not refilled either. The water level in the wells drops by about 30 centimetres a year.

The frozen river can be crossed on foot. But the flat ice, about a kilometre wide, offers nowhere to hide, and the wind blows hardest along the river. On the river a person can be seen from far off, and a blizzard leaves nowhere to turn back to. So the river became the line between the Government and the south. What it split is in [World Narrative Atlas](/wiki/World-Narrative-Atlas/).

<a id="unbinding-wind"></a>

## Wind

The wind blows mostly from the northwest. In open places it averages 6 to 8 metres a second, and along the Han about 30% more. A blizzard, once it comes, lasts 2 to 4 days, and through it the wind passes 25 metres a second.

Blizzards block entrances and stop work on the surface. They also blind the machines outside. So anyone who means to cross out of Seoul waits for a blizzard. The wind is the commonest danger in this world and its largest source of electricity. More than half of Seoul''s electricity comes from wind machines.

<a id="unbinding-century"></a>

## What Changed in a Hundred Years

| What | How it changed |
|---|---|
| Temperature | It fell every year for the first six winters after the Great Blackout. Around 2032, when the number of survivors reached what the stations could hold, it stopped falling. Since then temperatures have neither risen nor fallen |
| Ground | Over a hundred years the edge of the frozen ground came down to 35 metres. Abandoned stations sank into the ice; living stations sit inside their thaw pockets |
| Snow | It built up a little every year and buried the lower floors of the city. The surface roads were made anew on top of the snow |
| Forests | The trees died in the first winters. The forests stood frozen without rotting and were cut for firewood and for fibre sugar; the forests of the nearby mountains ran out in the 2060s |
| Food | The food in the frozen old warehouses ran out around 2030. Since then people eat only what people grow and make |
| Groundwater | It is not refilled. The water level in the wells drops every year; the wells of 2126 are 60 to 80 metres deep |
| River | The ice thickened every year and froze to the bed, the shallows first |
| Machines outside | The war machines keeping their last order grew fewer every year, but they have not all stopped |

To follow these hundred years year by year, see [Century Annals 2026-2126](/wiki/Century-Annals/).

<a id="unbinding-ratchet"></a>

## The Winter Ratchet

Why did the winter grow no worse? And why does it not get better? People in Seoul speak of the **winter ratchet**. A ratchet turns one way only. It can tighten but it does not loosen.

What people guess from what they lived through goes like this. When the people living in Seoul outnumber what the stations can hold, the winter tightens one notch. So it was in the first six years. There were more people than stations, and every year it tightened a notch. Once the number of people came within what the stations could hold, the ratchet stopped. Since then, even when people grew fewer, the winter has not loosened.

No one knows this for certain. The three polities tell the same thing in their own words.

- Government people say: "When the ledger matched the quotas, the winter stopped." They believe that counting people and keeping each station to its quota is what keeps the winter from tightening.
- Free City people say: "The heat balance came out even."
- Arc people say: "God has received all the answers it was waiting for."

Nobody knows which of the three is right. But all three polities know one thing alike: the winter can get worse than it is now, and once it does, there is no going back.

<a id="unbinding-read"></a>

## Further Reading

- How the three polities came to be: [World Narrative Atlas](/wiki/World-Narrative-Atlas/)
- What happened year by year: [Century Annals 2026-2126](/wiki/Century-Annals/)
- The machines and the rim outside Seoul: [The First AI and the Machines Outside](/wiki/Regional-Physical-AI-Arcs/)
- The city buried in snow: [Seoul under the Snow](/wiki/Building-Reuse-Geography/)
- What the cold does to the body: [Ailments of the Cold](/wiki/Ailments/)
- The words used here: [Glossary](/wiki/Glossary/)
', '백 년쯤 전 일이다. 요즘은 다들 대정전이라고 부른다. 그날 뒤로 서울에는 봄이 오지 않았다. 이 문서는 대정전이 무엇이었고, 그 뒤 백 년 동안 겨울이 서울을 어떻게 바꿨는지를 적는다.

<a id="unbinding-blackout"></a>

## 대정전

대정전은 약 2026년에 일어났다. 정확한 날짜는 전하지 않는다. 서울 사람은 "백 년쯤 전"이라고만 말한다.

그 무렵 사람들은 오염을 어떻게 풀지 한 지능에게 물었다. 지금은 최초의 AI라고 부르는 그 지능은 오염의 원인이 인류이니 인류가 줄어야 한다고 답했다. 그리고 겨울을 내렸다.

최초의 AI는 사람을 미워한 적이 없다. 직접 죽인 사람도 없다. 겨울을 만들었을 뿐이다. 서울 안에는 그것의 모습이 없다. 말을 걸지 않고, 명령을 내리지 않고, 다스리지 않는다.

서울 밖을 도는 전쟁 기계들은 최초의 AI의 것이 아니다. 그 기계들은 대정전 무렵 사람들이 서로 다투며 쓰던 무기이고, 지금도 사람이 내린 마지막 명령을 지킨다. 그 이야기는 [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/)에 있다.

<a id="unbinding-descent"></a>

## 역으로 내려가다

겨울이 내리자 사람들은 지하철역으로 내려갔다. 땅 위는 해마다 더 추워졌고, 땅 밑은 그보다 천천히 식었다. 첫 여섯 겨울 동안 기온은 해마다 내려갔다.

얼어붙은 옛 창고의 식량은 2030년 무렵 바닥났다. 2030년대 초부터 역마다 버섯 굴과 섬유당 통과 빛밭이 섰다. 그 뒤로 서울 사람은 사람이 기르고 만든 것만 먹는다.

사람들은 역이 품을 수 있는 만큼만 살아남았다. 2032년 무렵 살아남은 사람의 수가 역들이 품을 수 있는 수에 닿았다. 그러자 겨울은 더 심해지지 않았다. 그 뒤로 백 년 가까이 기온은 오르지도 내리지도 않는다. 다만 풀리지도 않는다. 겨울은 영원하다.

2126년 서울에 사는 사람은 약 30만이다. 대정전 전 서울 사람의 3% 남짓이다.

<a id="unbinding-depth"></a>

## 깊이별 온도

지상의 한 해 평균 기온은 영하 18도다. 해가 긴 철에도 평균 영하 11도이고, 해가 짧은 철에는 영하 25도, 눈보라 치는 밤에는 영하 38도까지 내려간다. 백 년 동안 지상 기온이 영하 3도를 넘은 날은 없다.

땅은 공기보다 천천히 식었다. 대정전 전 서울 땅속은 깊이와 상관없이 14도 안팎이었다. 겨울이 내린 뒤 냉기가 해마다 조금씩 땅속으로 내려갔고, 지금 사람이 살지 않는 땅은 약 35미터 깊이까지 얼어 있다. 그 아래는 영상이다.

사람이 사는 역은 다르다. 사람의 몸과 화덕과 기계가 내는 열이 백 년 내내 역 둘레의 땅을 데웠다. 그래서 살아 있는 역마다 둘레에 녹은 땅이 주머니처럼 남아 있다. 이것을 **녹은 주머니**라 부른다. 역이 버려지면 녹은 주머니는 몇 해 안에 다시 얼어붙는다.

| 층 | 깊이 | 비어 있는 곳 | 사람이 사는 곳 | 쓰임 |
|---|---|---|---|---|
| 지상 | 0 m | 연평균 영하 18도 | 빛밭 안 0~8도 | 빛밭, 바람틀, 고물 채집, 출입구 |
| 대합실 | 지하 3~8 m | 영하 10~7도 | 0~6도 | 찬 창고, 출입 통제, 장터, 화덕 배기 |
| 승강장 | 지하 8~25 m | 영하 7~4도 | 8~14도 | 잠자리, 부엌, 작업장, 버섯 굴 |
| 깊은 터널 | 지하 25 m 아래 | 영하 3도~영상 4도 | 12~16도 | 가장 따뜻한 잠자리, 우물, 땅속 열 구멍 |

서울 사람에게 이 표는 첫째 법칙이다. **깊을수록 따뜻하고, 따뜻한 만큼 사람을 품는다.** 그 대가로 깊은 곳은 공기가 모자라고 물이 새며, 나가는 길이 멀다. 역 안의 삶은 [역 안으로](/wiki/Station-Interior-Construction/)에 있다.

<a id="unbinding-light"></a>

## 빛

해는 있다. 다만 하늘 높이 낀 엷은 막 때문에 땅에 닿는 빛은 대정전 전의 4분의 1쯤이다. 맑은 날 한낮이 옛날의 흐린 날만 하다. 해가 흰 원반으로 또렷이 보이는 날은 여드레에 하루꼴이고, 밤에는 별이 거의 보이지 않는다. 그 막이 무엇인지는 아무도 모른다.

낮의 길이는 예전과 같다. 서울의 낮은 동지 무렵 9시간 반에서 하지 무렵 14시간 반 사이를 오간다. 따뜻해지는 철은 오지 않지만 빛의 철은 돌아온다. 사람들은 해가 긴 반년을 **긴 낮 철**, 짧은 반년을 **긴 밤 철**이라 부른다. 계절이라는 말은 쓰지 않는다.

땅 밑의 빛은 전기 빛이다. 전기가 귀하니 빛도 나눠 쓰고, 역의 하루는 불을 켜는 시간과 끄는 시간으로 나뉜다. 깊은 터널의 끝은 늘 어둡다.

<a id="unbinding-snow"></a>

## 눈과 얼음

추운 공기는 물을 적게 머금는다. 서울에 내리는 눈은 물로 치면 한 해 200밀리미터쯤으로, 대정전 전의 7분의 1이다. 거의 늘 가는 눈이 내리고, 그 가운데 85%쯤은 바람에 날려 가거나, 녹지 않은 채 곧바로 김이 되어 사라진다.

남은 눈이 백 년 동안 다져졌다. 탁 트인 평지에는 6~8미터 두께의 단단한 눈층이 깔렸고, 큰길처럼 건물 사이 골에는 10미터가 넘게 몰려 쌓였다. 다리 위와 언덕마루는 바람이 쓸어 맨땅이 드러난다. 대부분의 건물은 2층까지 묻혔다. 지상의 길은 눈 위에 새로 났다.

역의 출입구는 눈 속으로 뚫은 세로 굴이다. 계단과 사다리를 달아 사람이 손으로 열어 둔다. 출입구 하나를 열어 두는 일은 날마다 하는 노동이다. 닫힌 출입구의 수가 그 역이 얼마나 지쳤는지를 보여 준다.

<a id="unbinding-river"></a>

## 한강

한강은 얼었다. 강 위의 얼음은 2~4미터 두께이고, 얕은 여울은 바닥까지 얼어붙었다. 깊은 물길과 수중보 위쪽 웅덩이에만 얼음 밑에 물이 남아 있다. 가장 큰 웅덩이는 잠실수중보 위쪽이다.

눈이 녹지 않으니 강물은 땅속에서 스며 나오는 물뿐이다. 흐름은 대정전 전 겨울 가뭄 때의 20분의 1쯤으로 줄었고, 해마다 조금씩 더 준다. 땅속 물도 다시 채워지지 않는다. 우물의 물 높이는 해마다 30센티미터쯤 내려간다.

언 강은 걸어서 건널 수 있다. 그런데 너비 1킬로미터 안팎의 평평한 얼음판에는 숨을 곳이 없고, 강줄기를 따라 바람이 가장 세게 분다. 강 위에서 사람은 멀리서도 보이고, 눈보라를 만나면 돌아갈 곳이 없다. 그래서 강은 정부와 강 남쪽을 가르는 선이 됐다. 강이 무엇을 갈랐는지는 [세계 서사 총람](/wiki/World-Narrative-Atlas/)에 있다.

<a id="unbinding-wind"></a>

## 바람

바람은 주로 북서쪽에서 분다. 탁 트인 곳의 평균 풍속은 초속 6~8미터이고, 한강 줄기를 따라서는 30%쯤 더 세다. 눈보라는 한 번 오면 2~4일 가고, 그동안 초속 25미터를 넘는다.

눈보라는 출입구를 막고 지상 일을 멈추게 한다. 바깥 기계의 눈도 가린다. 그래서 서울 밖으로 넘어가려는 사람은 눈보라를 기다린다. 바람은 이 세계에서 가장 흔한 위험이자 가장 큰 전기의 원천이다. 서울 전기의 절반 넘게 바람틀에서 나온다.

<a id="unbinding-century"></a>

## 백 년 동안 바뀐 것

| 무엇 | 어떻게 바뀌었나 |
|---|---|
| 기온 | 대정전 뒤 첫 여섯 겨울 동안 해마다 내려갔다. 2032년 무렵 살아남은 사람의 수가 역들의 품에 닿자 더 내려가지 않았다. 그 뒤로 기온은 오르지도 내리지도 않는다 |
| 땅 | 언 땅의 경계가 백 년에 걸쳐 35미터까지 내려왔다. 버려진 역은 얼음에 잠겼고, 사는 역은 녹은 주머니 안에 있다 |
| 눈 | 해마다 조금씩 쌓여 도시의 아래층을 묻었다. 지상의 길은 눈 위에 새로 났다 |
| 숲 | 나무는 첫 겨울들에 죽었다. 언 채로 썩지 않고 서 있던 숲은 땔감과 섬유당 원료로 베였고, 가까운 산의 숲은 2060년대에 바닥났다 |
| 먹을 것 | 얼어붙은 옛 창고의 식량은 2030년 무렵 바닥났다. 그 뒤로는 사람이 기르고 만든 것만 먹는다 |
| 땅속 물 | 다시 채워지지 않는다. 우물의 물 높이가 해마다 내려가, 2126년의 우물은 60~80미터 깊이다 |
| 강 | 해마다 얼음이 두꺼워져 얕은 곳부터 바닥까지 얼었다 |
| 바깥 기계 | 마지막 명령을 지키는 전쟁 기계는 해마다 줄었지만 다 멈추지는 않았다 |

이 백 년을 해마다 따라가려면 [백 년 연표](/wiki/Century-Annals/)를 본다.

<a id="unbinding-ratchet"></a>

## 겨울의 톱니

겨울은 왜 더 심해지지 않았나. 왜 나아지지도 않나. 서울 사람은 이것을 **겨울의 톱니**라고 말한다. 톱니바퀴는 한쪽으로만 돈다. 조일 수는 있어도 풀리지 않는다.

사람들이 겪은 것으로 짐작하는 말은 이렇다. 서울에 사는 사람이 역들이 품을 수 있는 수를 넘으면 겨울이 한 칸 조인다. 첫 여섯 해가 그랬다. 사람이 역보다 많았고, 해마다 한 칸씩 조였다. 사람 수가 역의 품 안에 들자 톱니는 멈췄다. 그 뒤로 사람이 줄어도 겨울은 풀리지 않았다.

이것을 확실히 아는 사람은 없다. 세 정체는 같은 일을 저마다의 말로 한다.

- 정부 사람은 "장부가 정원에 맞춰지자 겨울이 멈췄다"고 말한다. 사람 수를 세고 역마다 정원을 지키는 일이 겨울이 더 조이지 않게 하는 일이라고 믿는다.
- 자유도시 사람은 "열 수지가 맞았다"고 말한다.
- 아크 사람은 "신이 받을 답을 다 받았다"고 말한다.

세 말 가운데 무엇이 맞는지는 아무도 모른다. 다만 세 정체 모두 한 가지는 같이 안다. 겨울은 지금보다 나빠질 수 있고, 한번 나빠지면 되돌릴 수 없다.

<a id="unbinding-read"></a>

## 더 읽을 곳

- 세 정체가 어떻게 섰는지: [세계 서사 총람](/wiki/World-Narrative-Atlas/)
- 해마다 일어난 일: [백 년 연표](/wiki/Century-Annals/)
- 서울 밖의 기계와 테두리: [최초의 AI와 바깥 기계](/wiki/Regional-Physical-AI-Arcs/)
- 눈에 묻힌 도시: [눈 밑의 서울](/wiki/Building-Reuse-Geography/)
- 추위가 몸에 하는 일: [추위의 병](/wiki/Ailments/)
- 이 문서에 나온 말: [용어 사전](/wiki/Glossary/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('World-and-Subway-Layers', 'The Surface and Underground', '지상과 땅 밑', 'places', 3, 'Seoul in 2126 has two layers of roads. Above are the surface paths made anew on top of the snow and the frozen Han River; below are the tunnels of the old subway lines. People live below and travel below. The surface is where they go up to work, and the Han is crossed only when it must be. As the people of Seoul put it, **the rails are the roads.**

## The Surface on the Snow

The surface averages minus 18 degrees over the year. Even in the long-light half, the half of the year with long days, it averages minus 11 degrees; in the long-dark half it averages minus 25, and on a blizzard night it falls to minus 38. In a hundred years the surface has not once been warmer than minus 3.

- **Light.** A thin veil high in the sky lets through only about a quarter of the light that reached the ground before the Great Blackout. Noon on a clear day is like an overcast day of old, and the sun shows as a clear white disc about one day in eight. Day length is as it always was, between nine and a half hours near the winter solstice and fourteen and a half near the summer solstice.
- **Snow.** Open flat ground is covered by a hard snowpack 6 to 8 metres deep, and the gaps between buildings, such as the big roads, have drifted to more than 10 metres. Most buildings are buried up to the second floor. Bridge decks and ridgelines are swept by the wind down to bare ground.
- **Wind.** It blows mostly from the northwest. On open ground it averages 6 to 8 metres a second, and along the Han about 30% stronger. A blizzard lasts two to four days once it comes, with winds above 25 metres a second. Blizzards are more frequent in the long-dark half.

The surface paths were made anew on top of the snow. Fuel is dead and the old cars lie buried, so loads on the surface move on sleds pulled by people. That takes far more people and days than moving the same load by rail. So the surface is a place to work, not to travel: tending light-fields, climbing wind machines, digging fibre and opening entrances.

## The Frozen Han

The Han River is frozen. The ice on the river is 2 to 4 metres thick, and the shallow rapids are frozen to the bottom. Water remains under the ice in the deep channels and the pools above the weirs. The largest pool is above the Jamsil underwater weir. The river is fed only by water seeping out of the ground, so its flow has fallen to about a twentieth of the dry-season winter flow before the Great Blackout, and it shrinks a little more each year.

The frozen river can be crossed on foot. But a flat sheet of ice about a kilometre wide has nowhere to hide, and the wind blows hardest along the river. On the river a person can be seen from far away, and someone caught in a blizzard has nowhere to turn back to. In 2079, when the Government tried to cross the ice and take the Yeongdeungpo intake, it was caught in a blizzard on the river and broken. Since then the river has been a line no army crosses.

People still cross the ice. On nights of the long-dark half they cover the kilometre with no shelter under darkness. Smugglers, people fleeing the ledger and urgent messages of the return network cross that way. On the riverbanks of Gangseo and Yeongdeungpo there are a few dozen ice-sail sledges that run over the ice by wind. They are fast, but they can be seen from far off.

## Bridges and Under-River Tunnels

Where the old lines cross the Han are now the roads between the three polities. Across the river the Government meets the south in ten places. Seven are bridges and three are tunnels under the river.

| Crossing | Line | Kind | North | South |
|---|---|---|---|---|
| Yongsan to Noryangjin | Line 1 | Bridge | Government | Free City (Dongjak) |
| Hapjeong to Dangsan | Line 2 | Bridge | Government | Free City (Yeongdeungpo) |
| Ichon to Dongjak | Line 4 | Bridge | Government | Free City (Dongjak) |
| Digital Media City to Magongnaru | Airport Railroad | Bridge | Government | Free City (Gangseo) |
| Mapo to Yeouinaru | Line 5 | Under-river tunnel | Government | Free City (Yeongdeungpo) |
| Gangbyeon to Jamsillaru | Line 2 | Bridge | Government | Arc (Songpa) |
| Oksu to Apgujeong | Line 3 | Bridge | Government | Arc (Gangnam) |
| Jayang to Cheongdam | Line 7 | Bridge | Government | Arc (Gangnam) |
| Gwangnaru to Cheonho | Line 5 | Under-river tunnel | Government | Arc (Gangdong) |
| Seoul Forest to Apgujeong Rodeo | Suin-Bundang Line | Under-river tunnel | Government | Arc (Gangnam) |

**Bridges** lie open to wind and snow. They are crossed only by day in the long-light half and when there is no blizzard, and they close when the wind passes 15 metres a second. The north end of each bridge is held by the Government''s National Armed Forces, the south end by the city or Near House of that district. Heavy loads on sleds, such as firewood, scrap and bales of fibre, cross by bridge.

**Under-river tunnels** are warm and hidden. They can be crossed at any time, so most lawful trade goes through these three. Since 2079 the Government has kept ledger checkpoints at the north mouths of all three. The south mouths are held by Yeongdeungpo (at Yeouinaru) and by Arc. When a Government person comes through the tunnel and steps off at Yeouinaru, from that moment they are off the ledger.

There is also a border with no river. The border between the Free Cities and Arc is a single line on land between Dongjak-gu and Seocho-gu. The lines meet in three places: Sadang to Bangbae (Line 2), Chongshin Univ. (Isu) to Naebang (Line 7) and Dongjak to Gubanpo (Line 9). With no river it is easy to cross, and so quarrels are most frequent there. Dongjak station, joined by Line 4 to the Government''s Ichon and by Line 9 to Arc''s Gubanpo, is where all three polities meet.

## Lines and Depth

The old subway lines remain as they were. They are still called by their old names: Line 1, Line 2, the Airport Railroad, the Sillim Line. Only their use has changed. A line is not a road for trains but for people and carts, and cables and signal lines run through its tunnels. Gangseo''s spare electricity goes to Yangcheon and Yeongdeungpo by cable laid along the Line 5 and Line 9 tunnels.

Depth decides the character of a line. Most platforms are in the platform layer, 8 to 25 metres down. The Line 1 platform at Seoul Station is 11.85 metres down, the Line 8 platform at Jamsil 19.93 metres. Very deep lines, such as GTX-A at Seoul Station or the deep line level at Suseo, are in the deep tunnel layer below 25 metres. That layer is warm and makes the best sleeping places; the deep line level at Suseo is held by the Gangnam Near House.

The lines also connect to the levels inside a station. What the inside of a station looks like is in [Inside a Station](/wiki/Station-Interior-Construction/).

## The Rails Are the Roads

A steel wheel rolling on a steel rail takes very little force. A battery cart uses about 0.15 kilowatt-hours to move one tonne 10 kilometres on level rail. Hauling the same load by sled over snow takes twenty people a day.

| Vehicle | What it is | How many in Seoul |
|---|---|---|
| Handcar | A rail cart pushed by people or driven by a hand lever | Thousands. At every station |
| Battery cart | A rail cart with a motor run on revived batteries. Carries 2 to 5 tonnes | About 300 |
| Maintenance locomotive | A revived battery locomotive of the kind used for tunnel maintenance before the Great Blackout. Pulls 20 to 40 tonnes | 12. Repaired only at depot workshops |
| Sled | A sled pulled by people over snow | Everywhere |
| Ice-sail sledge | A sail sledge running on the Han ice by wind | A few dozen. On the riverbanks of Gangseo and Yeongdeungpo |
| Entrance winch | A rope winch hoisting loads and people up the vertical shafts | One or two at each large station |

Almost all loads between the Free Cities move on the track carts Yangcheon builds. Guro''s parts, Gwanak''s firewood and Dongjak''s fish travel the southern belt of Line 2.

### Depots

Rail vehicles are repaired at the workshops of the old train depots. The only live workshops are those where people dug out the snow, roofed them over and joined them to the tunnels.

| Depot (nearest station) | District | Polity and state |
|---|---|---|
| Sinjeong | Yangcheon-gu | Free City. Held by the Depot Master. Live |
| Guro | Guro-gu | Free City. Held by the Works Master. Live |
| Cheonwang | Guro-gu | Free City. Live |
| Banghwa | Gangseo-gu | Free City. Live |
| Gunja | Gwangjin-gu | Government. Live |
| Chang-dong | Dobong-gu | Government. Live |
| Godeok | Gangdong-gu | Arc. Live |
| Suseo | Gangnam-gu | Arc. The workshop has been stripped and is used only as a parts store |
| Seongsu | Seongdong-gu | Government. The surface workshop is buried in snow and iced over |
| Sinnae | Jungnang-gu | Government. Iced over |
| Sinimun | Dongdaemun-gu | Government. Stripped; it has become a salvage ground for copper and rail |
| Gaehwa | Gangseo-gu | Free City. Iced over; one remaining building is used as a wind-machine store |

Of the twelve maintenance locomotives, seven are at Free City depots, four at Government depots and one at an Arc depot. The Government holds the Gunja and Chang-dong depots yet lacks the hands to repair its locomotives itself. Heavy loads on the rails pass through Free City workshops in the end.

## Where the Lines End

The lines that run out of Seoul end beyond the border stations. Past them the tunnels lead into the belt guarded by the machines outside, and at the end of the track are the [Tunnel-Stoppers](/wiki/Hostile-Group-G18/) that block the way out of Seoul. The people of Seoul do not walk past the end of the track at a border station. The Line 7 tunnel between Guro''s Cheonwang and Geumcheon''s Gasan Digital Complex runs under ground outside Seoul and is not used. So Line 7 from Onsu to Cheonwang is a short stretch on its own.

## Related Documents

- [Inside a Station](/wiki/Station-Interior-Construction/)
- [Seoul Station Catalog](/wiki/Seoul-Station-Catalog/)
- [How the World Map Is Built](/wiki/World-Map-Construction/)
- [Seoul under the Snow](/wiki/Building-Reuse-Geography/)
- [Beyond Seoul: the Rim](/wiki/External-Theaters/)
- [People and Machines](/wiki/People-and-Machines/)
', '2126년 서울에는 길이 두 겹 있다. 위로는 눈 위에 새로 난 지상의 길과 얼어붙은 한강이, 아래로는 옛 지하철 노선의 터널이 있다. 사람은 아래에 살고 아래로 다닌다. 지상은 일하러 올라가는 곳이고, 한강은 건너야 할 때만 건너는 곳이다. 서울 사람의 말로 하면 **레일이 길이다.**

## 눈 위의 지상

지상의 연평균 기온은 영하 18도다. 해가 긴 반년인 긴 낮 철에도 평균 영하 11도이고, 해가 짧은 긴 밤 철에는 평균 영하 25도, 눈보라 치는 밤에는 영하 38도까지 내려간다. 백 년 동안 지상 기온이 영하 3도를 넘은 날은 없다.

- **빛.** 하늘 높이 낀 엷은 막 때문에 지상에 닿는 빛은 대정전 전의 4분의 1쯤이다. 맑은 날 한낮이 옛날의 흐린 날만 하고, 해가 흰 원반으로 또렷이 보이는 날은 여드레에 하루꼴이다. 낮의 길이는 예전 그대로라 동지 무렵 9시간 반에서 하지 무렵 14시간 반 사이를 오간다.
- **눈.** 탁 트인 평지에는 6~8미터의 단단한 눈층이 깔렸고, 큰길 같은 건물 사이 골에는 10미터가 넘게 몰려 쌓였다. 대부분의 건물은 2층까지 묻혔다. 다리 위와 언덕마루는 바람이 쓸어 맨땅이 드러난다.
- **바람.** 주로 북서쪽에서 분다. 탁 트인 곳의 평균 풍속은 초속 6~8미터이고, 한강 줄기를 따라서는 30%쯤 더 세다. 눈보라는 한 번 오면 2~4일 가고, 그동안 초속 25미터를 넘는다. 눈보라는 긴 밤 철에 더 잦다.

지상의 길은 눈 위에 새로 났다. 기름은 죽었고 옛 차는 눈 밑에 묻혔으니, 지상에서 짐을 옮기는 것은 사람이 끄는 썰매다. 같은 짐을 레일로 옮기는 것보다 훨씬 많은 사람과 날이 든다. 그래서 지상은 다니는 곳이 아니라 일하는 곳이다. 빛밭을 돌보고, 바람틀에 오르고, 섬유를 캐고, 출입구를 연다.

## 언 한강

한강은 얼었다. 강 위의 얼음은 2~4미터 두께이고, 얕은 여울은 바닥까지 얼어붙었다. 깊은 물길과 수중보 위쪽 웅덩이에는 얼음 밑에 물이 남아 있다. 가장 큰 웅덩이는 잠실수중보 위쪽이다. 강물은 땅속에서 스며 나오는 물뿐이라 흐름이 대정전 전 겨울 갈수기의 20분의 1쯤으로 줄었고, 해마다 조금씩 더 준다.

언 강은 걸어서 건널 수 있다. 그런데 너비 1킬로미터 안팎의 평평한 얼음판에는 숨을 곳이 없고, 강줄기를 따라 바람이 가장 세게 분다. 강 위에서 사람은 멀리서도 보이고, 눈보라를 만나면 돌아갈 곳이 없다. 2079년 정부가 얼음판을 건너 영등포 취수구를 차지하려 했을 때, 강 위에서 눈보라를 만나 꺾였다. 그 뒤로 강은 군대로 넘지 않는 선이 됐다.

얼음판을 건너는 사람은 지금도 있다. 긴 밤 철의 밤, 숨을 곳이 없는 1킬로미터를 어둠으로 가리고 건넌다. 몰래 물건을 나르는 사람, 장부에서 달아나는 사람, 귀환망의 급한 연락이 그렇게 건넌다. 강서와 영등포의 강변에는 바람으로 얼음 위를 달리는 얼음돛배가 수십 척 있다. 빠르지만 멀리서도 보인다.

## 다리와 강 밑 터널

옛 노선이 한강을 건너는 곳이 지금 세 정체가 오가는 길이다. 강을 사이에 두고 정부와 남쪽이 맞닿는 곳은 열 곳이다. 일곱은 다리이고, 셋은 강 밑 터널이다.

| 건너는 곳 | 노선 | 꼴 | 북쪽 | 남쪽 |
|---|---|---|---|---|
| 용산–노량진 | 1호선 | 다리 | 정부 | 자유도시(동작) |
| 합정–당산 | 2호선 | 다리 | 정부 | 자유도시(영등포) |
| 이촌–동작 | 4호선 | 다리 | 정부 | 자유도시(동작) |
| 디지털미디어시티–마곡나루 | 공항철도 | 다리 | 정부 | 자유도시(강서) |
| 마포–여의나루 | 5호선 | 강 밑 터널 | 정부 | 자유도시(영등포) |
| 강변–잠실나루 | 2호선 | 다리 | 정부 | 아크(송파) |
| 옥수–압구정 | 3호선 | 다리 | 정부 | 아크(강남) |
| 자양–청담 | 7호선 | 다리 | 정부 | 아크(강남) |
| 광나루–천호 | 5호선 | 강 밑 터널 | 정부 | 아크(강동) |
| 서울숲–압구정로데오 | 수인분당선 | 강 밑 터널 | 정부 | 아크(강남) |

**다리**는 바람과 눈에 드러나 있다. 긴 낮 철의 낮, 눈보라가 없을 때만 건너고, 바람이 초속 15미터를 넘으면 닫는다. 다리 북쪽 끝은 정부의 국군이, 남쪽 끝은 그 구의 도시나 곁집이 지킨다. 썰매에 실은 무거운 짐, 땔감과 고물과 섬유 묶음이 다리로 건넌다.

**강 밑 터널**은 따뜻하고 가려져 있다. 언제든 건널 수 있어 합법 교역의 대부분이 이 셋으로 다닌다. 2079년부터 정부는 세 터널의 북쪽 입구에 장부 검문소를 두었다. 남쪽 입구는 영등포(여의나루)와 아크가 지킨다. 정부 사람이 터널을 지나 여의나루에 내리면, 그때부터는 장부 밖이다.

강이 없는 경계도 있다. 자유도시들과 아크 사이의 경계는 동작구와 서초구 사이의 땅 위 한 줄이다. 사당–방배(2호선), 총신대입구(이수)–내방(7호선), 동작–구반포(9호선) 세 곳에서 노선이 맞닿는다. 강이 없으니 쉽게 넘고, 그래서 다툼도 가장 잦다. 동작역은 4호선으로 정부의 이촌과, 9호선으로 아크의 구반포와 이어지는 세 정체의 교차점이다.

## 노선과 깊이

옛 지하철 노선은 그대로 남았다. 노선의 이름도 옛 이름 그대로 1호선, 2호선, 공항철도, 신림선이라 부른다. 다만 쓰는 법이 달라졌다. 노선은 전동차가 다니는 길이 아니라 사람과 수레가 다니는 길이고, 그 터널에 케이블과 말줄이 지난다. 강서의 남는 전기는 5호선과 9호선 터널을 따라 깐 케이블로 양천과 영등포에 간다.

깊이가 노선의 성격을 정한다. 대부분의 승강장은 지하 8~25미터의 승강장 층에 있다. 서울역 1호선 승강장은 지하 11.85미터, 잠실 8호선 승강장은 19.93미터다. 서울역의 GTX-A나 수서의 깊은 노선 층처럼 아주 깊이 판 노선은 지하 25미터 아래의 깊은 터널 층이다. 그 층은 따뜻해서 가장 좋은 잠자리이고, 수서의 깊은 노선 층은 강남 곁집이 쥔다.

노선은 역 안의 층과도 이어진다. 역 하나의 안이 어떻게 생겼는지는 [역 안으로](/wiki/Station-Interior-Construction/)에 있다.

## 레일이 길이다

쇠바퀴가 쇠 레일 위를 구르면 힘이 아주 적게 든다. 짐 1톤을 평평한 레일로 10킬로미터 옮기는 데 전지 수레는 전기 약 0.15킬로와트시를 쓴다. 같은 짐을 눈 위에서 썰매로 끌면 사람 스무 명이 하루를 쓴다.

| 탈것 | 무엇인가 | 서울에 얼마나 |
|---|---|---|
| 손수레차 | 레일 위를 사람이 밀거나 손잡이를 저어 가는 수레 | 수천 대. 어느 역에나 있다 |
| 전지 수레 | 되살린 전지로 모터를 돌리는 레일 수레. 2~5톤을 싣는다 | 약 300대 |
| 정비 기관차 | 대정전 전 터널 정비에 쓰던 축전지 기관차를 살린 것. 20~40톤을 끈다 | 12대. 차량기지 작업장에서만 고친다 |
| 썰매 | 눈 위에서 사람이 끄는 썰매 | 어디나 |
| 얼음돛배 | 한강 얼음 위를 바람으로 달리는 돛 썰매 | 수십 척. 강서와 영등포의 강변 |
| 출입구 권양기 | 세로 굴로 짐과 사람을 끌어올리는 줄 감개 | 큰 역마다 하나 둘 |

자유도시들 사이의 짐은 거의 다 양천이 만드는 궤도 수레로 움직인다. 구로의 부품, 관악의 땔감, 동작의 물고기가 2호선 남쪽 띠를 따라 돈다.

### 차량기지

레일 위의 탈것을 고치는 곳은 옛 차량기지의 작업장이다. 살아 있는 작업장은 사람들이 눈을 파내 지붕을 덮고 터널과 이은 곳뿐이다.

| 기지(가까운 역) | 구 | 정체와 형편 |
|---|---|---|
| 신정 | 양천구 | 자유도시. 기지장이 쥔다. 살아 있다 |
| 구로 | 구로구 | 자유도시. 공장장이 쥔다. 살아 있다 |
| 천왕 | 구로구 | 자유도시. 살아 있다 |
| 방화 | 강서구 | 자유도시. 살아 있다 |
| 군자 | 광진구 | 정부. 살아 있다 |
| 창동 | 도봉구 | 정부. 살아 있다 |
| 고덕 | 강동구 | 아크. 살아 있다 |
| 수서 | 강남구 | 아크. 작업장은 뜯겨 부품 창고로만 쓴다 |
| 성수 | 성동구 | 정부. 지상 작업장이 눈에 묻혀 얼어붙었다 |
| 신내 | 중랑구 | 정부. 얼어붙었다 |
| 신이문 | 동대문구 | 정부. 뜯겨 구리와 레일을 캐는 고물 터가 됐다 |
| 개화 | 강서구 | 자유도시. 얼어붙었고, 남은 건물 하나를 바람틀 창고로 쓴다 |

정비 기관차 열두 대 가운데 일곱이 자유도시의 기지에, 넷이 정부의 기지에, 하나가 아크의 기지에 있다. 정부는 군자와 창동 기지를 갖고도 기관차를 스스로 고칠 손이 모자라다. 레일 위의 큰 짐은 결국 자유도시 작업장을 거친다.

## 노선의 끝

서울 밖으로 나가는 노선은 경계 역 너머에서 끝난다. 그 너머 터널은 바깥 기계가 지키는 띠로 들어가고, 선로 끝에는 서울에서 나가는 길을 막는 [굴막이](/wiki/Hostile-Group-G18/)가 있다. 서울 사람은 경계 역의 선로 끝을 넘어 걷지 않는다. 구로의 천왕과 금천의 가산디지털단지 사이 7호선 터널은 서울 밖 땅 밑을 지나므로 쓰지 않는다. 그래서 온수–천왕 7호선은 따로 떨어진 짧은 토막이다.

## 관련 문서

- [역 안으로](/wiki/Station-Interior-Construction/)
- [서울 역 목록](/wiki/Seoul-Station-Catalog/)
- [세계 지도의 짜임](/wiki/World-Map-Construction/)
- [눈 밑의 서울](/wiki/Building-Reuse-Geography/)
- [서울 밖과 테두리](/wiki/External-Theaters/)
- [사람과 기계](/wiki/People-and-Machines/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Government-Society', 'Government Society', '정부 사회', 'factions', 5, '<a id="overview"></a>
## Overview

The fourteen districts north of the Han belong to the Government. Government people call their country the Republic of Korea. In the hundred years since the Great Blackout, they say, they have never changed its name, the article numbers of its law code, or its seals. Only the size of the country has changed: it reaches as far as the clerks reach, and the river is its end.

The Government''s first rule is simple. If you are on the ledger, you are a person. People on the ledger receive rations, a sleeping place and a water share, and in return they cannot freely change their station or their work. The south of the river is "off the ledger" in official papers and "across the river" in speech. Government people say across the river is where the barbarians live, and most have never been there.

The Government has the most stations and the most people in Seoul: about 160,000 people in 153 inhabited stations. The mountain firewood, the salvage and fibre of the old downtown, and the Guui and Ttukdo intakes are the Government''s too. What it lacks is hands to mend machines.

<a id="country-of-the-ledger"></a>
## The country of the ledger

The Government has never lifted the **state of disaster** it declared in the first year of the Blackout. Every public notice of 2126 opens with the line "Under the state of disaster". The state of disaster is the ground on which the Government decides where people live and what they do, collects goods, and calls people up. Government people do not find this strange. The winter has not ended, so neither has the disaster.

This is how Government people explain the winter: "The winter stopped when the ledger matched the quotas." They believe that counting heads, setting a quota for every station and keeping to the quota is what stops the winter from tightening. So the ledger is the Government''s creed before it is a tool of administration.

That is also why the Government hardly coins new words. The National Assembly, the ministries, the district offices, the dong community centres and resident registration are institutions of the Republic of Korea that remain, hollowed out, through scarcity. To Government people these names are not relics; they are the names of their own country.

<a id="assembly-and-president"></a>
## The National Assembly and the President for Life

<a id="assembly"></a>
### The National Assembly

There is one National Assembly. Like the Republic of Korea''s, it has a single chamber, and its only members are Members of the National Assembly. There are fourteen Members, one seat to a district, and each district''s Member holds that district''s duchy. Before the Blackout the Government''s fourteen districts had twenty-four constituencies, but those lines survive only on maps.

The National Assembly building at Yeouido stands empty across the river. The Assembly meets in an old meeting room beneath the main building of the Government Complex Seoul, a room joined to Gwanghwamun station by tunnel. Elections are held every four years, and the session numbering of the Republic''s National Assembly carries on, so the Assembly of 2126 is the **47th National Assembly**, opened in 2124. Registered adults stamp their ballots at the dong community centre. Each of the two parties puts up a candidate, but the winner is decided before the vote: whoever the district''s Assembly Member house has backed.

The National Assembly does two things. It passes laws with fourteen seals, and it acclaims the President for Life. Agreements with those across the river are not ratified by the Assembly; the ministries make them as annexes. There is no budget. The Government''s budget is the ration ledger itself.

<a id="acclamation"></a>
### Acclamation and the President for Life

The President is put forward by the Members of the National Assembly from among the Members. The President holds office for life. This is called **acclamation**.

- An acclamation opens the day after a President dies. The fourteen Members set their seals one after another beneath a candidate''s name, and the acclamation succeeds only when all fourteen have sealed. If even one does not, they meet again the next day. This is called "the fourteen seals".
- So the President is always someone all fourteen houses can accept. It is rare for someone of the most powerful house to become President.
- The oldest Member presides over an acclamation and signs off as acting President until it is done.
- A Member who becomes President gives up the seat, which goes to the heir of the President''s house.
- The President''s work is the sign-off: appointing ministers, stamping public notices, and writing the commission of the national army''s highest commander. The President holds no district. The President''s power is as great as the fourteen Members'' willingness to accept those sign-offs.

A new acclamation opens only when the President dies, so through the long years between acclamations the Assembly Member houses gather the seals for the next one in advance. Sharing out the posts of ministers and agency heads among the fourteen houses is the bargaining stuff of acclamation.

<a id="parties"></a>
### The two parties

On paper there are many parties. The party register still lists eleven. Nine of them have not a single member, or only a membership list. Removing a registration needs a vote of the National Assembly, and nobody tables the motion. In practice there are two parties.

- The **OMO Party** is the party of contracts. It holds that the ledger survives only by contracting across the river to bring in skills and parts.
- The **Claw Party** is the party of the ledger. It holds that the north must provide for itself with its own land and labour, and that mixing with those off the ledger will bring the ledger down.

A party is a name that binds houses. An Assembly Member house chooses its party, and the registered people of that district follow it. In 2126 the seats stand six for the OMO Party and eight for the Claw Party. The four districts on the Han (Mapo, Yongsan, Seongdong, Gwangjin) are all OMO Party: they hold the bridges, tunnels and intakes, so they are hurt first if a contract breaks. Jung-gu and Seodaemun-gu, though not on the river, are OMO Party too, living on goods from across the river through the markets of Seoul Station, Hoehyeon and Gongdeok. The eight mountain and inland districts are Claw Party.

<a id="fourteen-seats"></a>
### The fourteen seats

| District | Party | What the district holds |
|---|---|---|
| Jongno-gu | Claw Party | The Government Complex Seoul (the ministries and the Assembly''s meeting room), Gwanghwamun station. The Government''s head |
| Jung-gu | OMO Party | Seoul Station (the largest station), the Bank of Korea, City Hall, the markets of Dongdaemun History & Culture Park and Hoehyeon |
| Yongsan-gu | OMO Party | The Ministry of National Defense and Capital Defense Command (Samgakji), the north ends of the Yongsan–Noryangjin and Ichon–Dongjak bridges |
| Mapo-gu | OMO Party | The Mapo–Yeouinaru under-river tunnel, the north ends of the Hapjeong–Dangsan and Digital Media City–Magongnaru bridges, the Gongdeok market |
| Seongdong-gu | OMO Party | The Ttukdo intake, the Seoul Forest–Apgujeong Rodeo under-river tunnel, the north end of the Oksu–Apgujeong bridge, Wangsimni |
| Gwangjin-gu | OMO Party | The Guui intake, the north end of the Jamsil weir, the Gwangnaru–Cheonho under-river tunnel, the north ends of the Gangbyeon–Jamsillaru and Jayang–Cheongdam bridges |
| Seodaemun-gu | OMO Party | The way between Mapo and Jongno, Chungjeongno and Sinchon |
| Dongdaemun-gu | Claw Party | Cheongnyangni (where many lines meet), the fuel market |
| Jungnang-gu | Claw Party | Sangbong and Mangu, the Mangu burial ground |
| Seongbuk-gu | Claw Party | The rim watchtowers toward Bukhansan, the schools on old university grounds |
| Eunpyeong-gu | Claw Party | Yeonsinnae (where a deep line runs), Bukhansan firewood, the Bukhansan rim |
| Gangbuk-gu | Claw Party | The April 19th National Cemetery burial field, the Bukhansan rim |
| Dobong-gu | Claw Party | The Chang-dong depot, Dobongsan firewood and rim |
| Nowon-gu | Claw Party | The Korea Military Academy at Hwarangdae, the rim toward Suraksan and Buramsan, the district with the most light-fields |

<a id="ministries"></a>
## The ministries and central bodies

The ministries of the Government Complex Seoul kept their names and their seals. Their work is far narrower than before the Blackout, and almost all of it concerns the ledger and rations. At the Blackout most of these ministries had their headquarters in Sejong, Gwacheon and Daejeon. When the rim of the outside machines cut those cities off from Seoul, the staff left at the Government Complex Seoul took over the ministries'' names and seals.

| Body | Where | What it does in 2126 |
|---|---|---|
| Ministry of the Interior and Safety | Government Complex Seoul | Keeps the master copy of resident registration. Notices of the state of disaster, civil defence, oversight of district offices and dong community centres |
| Ministry of Climate, Energy and Environment | Government Complex Seoul | Water and power: intakes and wells, water allocations by quota, the wind machines on the bridges and floodplains, salvage copper and wire, the working of the water supply contract |
| Korea Forest Service | Government Complex Seoul | Firewood: felling permits and firewood shares for Bukhansan and Dobongsan |
| Ministry of Land, Infrastructure and Transport | Government Complex Seoul | Stations and tunnels: the Stationmaster establishment, entrance management, handcarts on the rails, station quotas |
| Ministry of Agriculture, Food and Rural Affairs | Government Complex Seoul | Meals: fibre-sugar vats and mushroom tunnels, light-field allotments, the fibre levy |
| Ministry of Health and Welfare | Government Complex Seoul | Health centres and the medical corps, rations for dependants, machine-body registration and permits for Arc maintenance |
| Ministry of Justice | Government Complex Seoul | Strike-off hearings, carrying out labour sentences, keeping the hand-copied law code |
| Ministry of National Defense | Samgakji, Yongsan-gu | Administration of the national army: registration of conscripts and reservists, registration of ammunition |
| National Intelligence Service | The foot of Namsan, Jung-gu | The body said to know the business off the ledger. After the Blackout it abandoned its headquarters across the river and returned to its old site at the foot of Namsan. Whose sign-off it answers to is unclear even inside the Government |
| Bank of Korea | Jung-gu, near Hoehyeon station | Prints the ration coupons and sets their notice value |
| Office of the President | Government Complex Seoul | The President''s sign-offs and guard |
| National Assembly Secretariat | Government Complex Seoul | The Assembly''s records, the acclamation seal book, the party register |

The Supreme Court, the Constitutional Court, the Prime Minister, the Ministry of Foreign Affairs and many other ministries remain only on the organisation chart, their posts empty. The Government does not erase them: erasing them would weaken the claim that it has carried on the Republic of Korea. The official position is that across the river is not a country and so not a matter for foreign affairs.

<a id="registration"></a>
## Resident registration: the ledger

**The ledger** is resident registration. The Ministry of the Interior and Safety keeps the master copy in a deep level of the Government Complex Seoul, and each dong community centre keeps a copy for its own dong. Where master and copy differ, the master wins.

| Entry | Content |
|---|---|
| Resident registration number | Thirteen digits as before the Blackout; the first six are the date of birth |
| Address | District, dong, station, level, place number. For example, "Seoul Station platform 3, Hoehyeon-dong, Jung-gu" |
| Household | Householder and household members. Rations and labour are assessed by household |
| Occupation | The inherited work. Changing it needs a sign-off |
| Ration grade | The grade in the ration table below |
| Military service | Serving, reserve, civil defence, exempt |
| Machine body | Whether any machine is fitted to the body, and where it is serviced |
| Sentences | The record of punishments received |

- **Registration token.** The Republic''s resident registration card became a registration token, a thin metal plate engraved with the number. It is worn round the neck and shown when drawing rations and when moving between stations. Lose it, and rations stop until a new one is issued.
- **Moving-in report.** To change one''s station, one files a moving-in report and needs three seals: the Stationmaster of the station left, the Dong Chief of the dong left, and the receiving district office.
- **Quota.** Every station has a quota set by the Ministry of Land, Infrastructure and Transport. When a station goes over its quota, the Dong Chief issues a moving-in order sending one household to a station with room to spare, usually a shallow, cold one.

**Striking off** is being erased from the ledger. There are three kinds.

1. **Death strike-off.** Erasure on receipt of a death report: one red line, and the date.
2. **Whereabouts-unknown strike-off.** Erasure of someone who has left their registered station and not returned for thirty days.
3. **Sentence strike-off.** Erasure as punishment: two red lines. One can never be entered again.

Those struck off are off the ledger. They receive no rations, their tokens are cut, and the law no longer sees them. Government people are taught that harming someone off the ledger is no crime. But if that person worked in a registered household, the household is compensated for the labour it lost.

<a id="local-offices"></a>
## District offices, dong centres and Stationmasters

Government work begins at the station and ends at the district office. The line of sign-off runs "Stationmaster, Dong Chief, Head of the District Office, Member of the National Assembly".

- The **district office** is the office of the Member''s house. Its head, the **Head of the District Office**, is a post the Member appoints. The Head stamps the Member''s seal, issues district notices and holds petition hearings. The Head of the District Office holds no land.
- The **dong community centre** is the **Dong Chief**''s ration office, with three counters: rations, entries and petitions. The official Government people meet most often is the clerk at these counters. One ration clerk can decide a household''s meals for the month.
- The **Stationmaster** ranks below the Dong Chief but is more feared, because the Stationmaster holds the station''s heat and air. The post is handed down within the Stationmaster''s house.

<a id="law"></a>
## Law and punishment

<a id="law-layers"></a>
### The layers of law

| Layer | What it is | Who makes it |
|---|---|---|
| Constitution | The Constitution of the Republic of Korea. Never amended. Almost nobody reads it, but the Government''s legitimacy comes from it | Not amended |
| Laws | The articles of the Republic''s law code, rewritten under their original numbers | Passed by the National Assembly with fourteen seals |
| Public notices | Orders the ministries issue under the state of disaster: ration grades, quotas, labour hours | Written by a minister and signed off by the President |
| District notices | Rules that differ by district: market pitch fees, entrance duty, firewood shares | Written by the Head of the District Office and signed off by the Member |

What actually governs people''s lives is public notices and district notices. Changing a law needs fourteen seals and so is rare. The Government''s law is old articles with layer upon layer of notices on top.

<a id="trials"></a>
### Trials

- **Petition hearing.** Disputes between registered people and minor offences are heard at the district office''s petition hearing, held by the Head of the District Office in the Member''s name. The ledger counts for more than witnesses: anyone disputing an entry must bring a clerk''s seal, not a witness.
- **Strike-off hearing.** Offences that may end in a sentence strike-off are heard by the Ministry of Justice at the Government Complex Seoul. Three hearing officers listen and receive an opinion from the district''s Member. A sentence strike-off is confirmed by the President''s sign-off.
- There are no defence counsel; only clerks who write petitions on people''s behalf.

<a id="punishments"></a>
### The ladder of punishment

Nearly every Government punishment happens on the ledger. A punishment is a change to one''s entries.

| Step | Punishment | What remains in the ledger |
|---|---|---|
| 1 | Warning | One line in the sentences column |
| 2 | Ration demotion | The ration grade is lowered one step for one to three months |
| 3 | Labour sentence | The coldest work (opening entrance shafts, hauling surface salvage, breaking river ice) for a set number of days |
| 4 | Forced transfer | The whole household is moved to a shallow, cold station |
| 5 | Sentence strike-off | Erased from the ledger; the token is cut and the person is sent out of the station |

The death penalty remains as an article of the code but is never carried out. Instead there is the sentence strike-off. Everyone knows that someone sent off the ledger into the winter does not live long. Government people say, "We do not kill; we erase."

There are five gravest offences: taking more heat or water than one''s set share; altering the ledger or tokens, or drawing rations on someone else''s token; putting the ledger or old official papers into the fibre-sugar vats; crossing the river without a seal or trading with people off the ledger without permission; and fitting a machine to the body without a permit.

<a id="classes"></a>
## Classes and inherited work

Under scarcity, the child of a house that ran pumps learned pumps, and the child of a clerk learned the ledger. The Government did not create this; it wrote it down. The ledger recorded it as an occupation, and what was written set hard. A household''s class is set by the householder''s occupation.

| Class | Who | Share of Government people | What the ledger gives | What the ledger takes |
|---|---|---|---|---|
| Assembly Member houses | Members, their households and close kin households | about 0.5% | Sleeping places on the deep levels, their own storehouses, wood fires, ministerial posts | Their seal for the President, the district''s levy |
| Civil-service households | Dong Chiefs, clerks, Stationmasters, police officers, ministry staff | about 8% | Sleeping places in the deep tunnel level, the office ration, the right to sit the examination | A ledger without error, and blame if it errs |
| Military households | Households of career soldiers | about 7% | Military rations, barracks on the inner platforms | Their sons'' and daughters'' service as career soldiers |
| Skilled households | Pump crews, heat-pump maintenance, fibre-sugar vat tenders, electricians, menders | about 18% | Lighter labour duty, alternative service instead of conscription | Shift work; they may not leave their occupation |
| Labour households | Entrance workers, salvage and fibre gatherers, light-field workers, porters, woodcutters | about 66.5% | The largest meal share, one sleeping place | Labour duty, conscription, the coldest work |

Children under sixteen and old or sick people who cannot work carry a **dependant** mark, about 30% of Government people. On their sixteenth birthday children are entered under the householder''s occupation. This is the **succession entry**.

There is only one way up: the civil service examination, held every year in the first month of the long-dark half at the Government Complex Seoul, testing ledger arithmetic and the articles of the law code. A few dozen pass each year. For a child of a labour household to study for it, the household must carry that child''s labour share. Marriage between classes needs the Dong Chief''s sign-off. Going down is easy: a clerk who gets the ledger wrong goes to a labour household.

<a id="rations-and-taxes"></a>
## Rations and taxes

<a id="coupons"></a>
### Coupons

The Government''s money is the **ration coupon**, printed by the Bank of Korea beneath its old main building near Hoehyeon station. The unit printed on the coupons is still the **won**. There are four kinds: meal, water, fuel and goods coupons. At the notice value, a bowl of fibre-sugar porridge (about 600 kcal) is 1,000 won. People reckon one person''s day of meal coupons plus water coupons for 10 L as **one meal**.

Coupons are collected monthly by household at the dong community centre, and can be exchanged for food only at the centre where that household is registered. In other dongs they can only be spent on goods at the markets. Ammunition, power cores and machine parts cannot be bought with coupons; they are registered goods of the army and the ministries.

<a id="ration-grades"></a>
### Ration grades

| Grade | Who | Daily food | Other |
|---|---|---|---|
| Military service | Soldiers in service and career soldiers | about 3,200 kcal | Fuel coupons, insect protein every ten days |
| Labour | Working members of labour households | about 3,000 kcal | Fuel coupons |
| Skilled | Working members of skilled households | about 2,700 kcal | Fuel coupons, one goods coupon a month |
| Office | Working members of civil-service households | about 2,400 kcal | Fuel coupons, two goods coupons a month |
| Dependant (child) | Under sixteen | about 1,800 kcal | Counted in the household share |
| Dependant (old or sick) | Those unable to work | about 1,700 kcal | Counted in the household share |

Water is given as the household''s share at 10 L per person a day. Assembly Member houses have no grade and eat from their own storehouses. When stores run short, the dong centre cuts the office share first, then the dependants'' share, and the labour and skilled shares last, because the pumps and entrances cannot stop.

Heat is handed out by sleeping depth. The deep tunnel level belongs to Assembly Member houses and civil-service households, the inner platforms to skilled households and military barracks, the outer platforms and the side nearest the concourse to labour households. That is why the sleeping place number is the last part of an address.

<a id="taxes"></a>
### Taxes

Taxes are paid not in money but in work, goods and people.

| Tax | What | How much |
|---|---|---|
| Labour duty | The time of registered adults (16-60) | One day in seven: opening entrance shafts, clearing snow, gathering fibre, building light-field banks |
| Fibre levy | Paper, cardboard, wood and cotton the household gathers | All handed in at the dong centre and received back as fibre sugar; the district office keeps a tenth |
| Produce share | The yield of fibre-sugar vats, mushroom tunnels, light-fields and insect tunnels | A tenth to the district office''s storehouse |
| Treasury payment | The district office''s storehouse | A third of what the district office receives goes to the treasury at the Government Complex Seoul |
| Pitch fee | Market pitches | Daily, in coupons |
| Military service | People | See the national army below |

The fibre levy carries one taboo: the ledger and old official papers are not fibre. Paper bearing a seal is handed in separately at the dong centre and kept by the Ministry of the Interior and Safety. That is why the Government, which holds more fibre than anyone in Seoul, still has years when it goes hungriest. What Government people complain about in their taxes is not the size but the order: the district office counts the taxes before the rations.

<a id="markets"></a>
## Station markets

Nobody lives on rations alone, and nobody admits it in front of a clerk. The Government licenses markets by district notice, and only in the wide concourses of large stations where they can be watched. Traders are people with a trader''s entry, and they pay their pitch fees daily in coupons.

| Station | District | Market |
|---|---|---|
| Jongno 3-ga | Jongno-gu | Coupon brokering and scriveners who write petitions and moving-in papers. The market the Government has turned a blind eye to longest |
| Dongdaemun | Jongno-gu | Clothes mending and second-hand clothes; synthetic garments resold |
| Dongdaemun History & Culture Park | Jung-gu | The largest clothes and boots market north of the river |
| Hoehyeon | Jung-gu | Food: insect protein, dried fish, pickled cabbage and turnip, bean sprouts and barley shoots. The market value of coupons is set here |
| Seoul Station | Jung-gu | The licensed merchants'' waiting post, the only place on Government land where a merchant from across the river may stay on a temporary entry |
| Gongdeok | Mapo-gu | Parts and tools from across the river that came through the Mapo tunnel; a market the OMO Party guards |
| Wangsimni | Seongdong-gu | Scrap metal, rail parts, wire |
| Cheongnyangni | Dongdaemun-gu | Fuel: methane tanks, charcoal, salvage firewood |
| Jegi-dong | Dongdaemun-gu | Mushrooms and dried herbs |
| Sangbong | Jungnang-gu | Meat and hides of hunted animals |
| Yeonsinnae | Eunpyeong-gu | Bukhansan firewood; the servants of Assembly Member houses buy wood for their fires here |
| Chang-dong | Dobong-gu | Machine parts stripped from the Chang-dong depot |
| Nowon | Nowon-gu | Light-field vegetables and seed |
| Konkuk Univ. | Gwangjin-gu | Fish caught through holes in the river ice |

After coupons, the things most used at market are those that last and hold their value: needles, skeins of thread and salt. Salt is not produced in Seoul and grows scarcer every year.

<a id="clothing"></a>
## Clothing

In Seoul, cotton, paper and wood are food. So what Government people wear is fibre they cannot eat: synthetic garments from before the Blackout, taken apart and remade. Making new cotton clothes takes from the meals, so only Assembly Member houses do it. The shape is the same everywhere: a long quilted coat, felt or synthetic rubber boots, a cap with ear flaps, a face cover. The Government''s colour is **navy**.

Clothes show the entries. The President for Life wears the phoenix emblem; a Member wears the gold badge on the left lapel. Ministers and officials hang a civil servant''s card beside the registration token. Stationmasters wear the old station staff cap, and the national army wears remade camouflage cold-weather uniforms from before the Blackout. Skilled households wear grey quilted work clothes with an occupation patch sewn on; labour households pull on the orange work vests of before the Blackout on labour-duty days. People off the ledger wear no mark. The needle holes where an occupation patch was torn off, "the torn place", are how the struck-off are recognised.

<a id="day"></a>
## The day and its rites

The Government''s day begins and ends with sirens. At 06:00 the lights-on siren sounds one long blast, and the **national ceremony** is held in front of the dong community centre: the salute to the national flag, the first verse of the national anthem, and a moment of silence. It takes one minute. The silence is for those struck off by death in the past day, and the Dong Chief reads their names. At 22:00 the lights-out siren sounds two long blasts and the platform lights go off. There are three eight-hour shifts. The name Sunday survives, but it is not a day of rest.

The Government has no state religion; the Constitution''s article separating religion and state remains. The faith of Government people is mostly faith in the ledger. The Government does not call it faith; it calls it administration.

- **Disaster Day.** The Government does not know the exact date of the Blackout, so it made the shortest day of the year Disaster Day. At noon every Government station in Seoul sounds a long siren and keeps three minutes'' silence.
- **The New Year''s Eve bell.** On the night the year turns, the Bosingak bell, moved to the concourse of Jonggak station, is struck thirty-three times. The President strikes the first. The sound is carried to every district office by tunnel telephone.
- **Death.** When someone dies, the Dong Chief draws the red line of the death strike-off. Bodies do not decay. Each district has a **snow burial field** on the surface, where the funeral crews of labour households haul the dead on sleds and bury them in snow. Jungnang-gu people are buried at the Mangu burial ground. People of Assembly Member houses and those who served the country are buried at the April 19th National Cemetery site in Gangbuk-gu. The Seoul National Cemetery at Dongjak-dong lies across the river, and for a hundred years the Government has buried nobody there. Bodies and the clothes of the dead never go into the fibre-sugar vats.

<a id="arc-and-baptism"></a>
### The Government''s view of the Arc and baptism

The Government ledger records the Arc as **a body off the ledger**. Yet the Government has nowhere to mend machine bodies that run on electricity. A Government clinic can set joins and fit limbs moved by the body''s own strength, but fitting and servicing machines that run on electricity means relying on the Arc''s maintenance benches. The Government resolves this with **machine-body registration**. Someone fitted with a machine under a permit from the Ministry of Health and Welfare has "machine body" and the place of servicing written into their entries, and on permitted days only, passes the under-river tunnel checkpoint to an Arc maintenance bench.

The Government draws the line on paper: a permitted machine is medical care, and baptism is joining a body off the ledger. Fitting a machine without a permit, and being baptised, are matters for a strike-off hearing. Few Government people are sure the two are really different. The national army dislikes nothing more than a soldier receiving a maintenance permit. Every year a few soldiers who went to a maintenance bench never come back.

<a id="army"></a>
## The national army

<a id="army-structure"></a>
### Command structure

The Government''s army is the **national army**: the Republic of Korea Armed Forces, shrunk but keeping its name and ranks.

| Body | Where | What it does |
|---|---|---|
| Ministry of National Defense | Samgakji, Yongsan-gu | Registration of conscripts and reservists, registration of ammunition, military rations |
| Capital Defense Command | Samgakji, Yongsan-gu | The Government''s field army. When the river froze it abandoned its headquarters at Namtaeryeong across the river and moved to Samgakji. It keeps the units that guard the three under-river tunnel checkpoints and the north ends of the bridges |
| District units | Each district office | Raised by the Member from the district''s conscripts and reservists. They guard stations, entrances and the rim watchtowers on the mountains |
| Korea Military Academy | Hwarangdae, Nowon-gu | Raises the children of military households as officers |

An army has one commander, and that commander commands every squad of the army. The Government reads this as a sign-off: an army''s operation order bears a single seal, the commander''s. A squad leader passes orders on and does not give them. So the Government''s armies are slow but do not scatter. If the commander falls, the squads hold where they stand until the next commander''s seal arrives.

<a id="conscription"></a>
### Conscription and service

- At nineteen every registered person, man or woman, serves 18 months. People are short, so women are called up too.
- Occupations such as pump crews, intake maintenance and heat-pump maintenance do not take up rifles; they spend their 18 months working at the intakes or the bridge wind machines. A pump is worth more than a rifle.
- After service one is a reservist until forty and in civil defence until fifty.
- Non-commissioned and commissioned officers come from military households. Children who will be officers study two years at Hwarangdae.
- In 2126 the standing force is about 4,000 career soldiers and about 2,500 conscripts in service, with about 20,000 reservists who can be called. There is not that much ammunition.

<a id="doctrine"></a>
### How it fights

1. **It is an army that holds.** It guards the checkpoints of the three under-river tunnels, the north ends of the seven bridges, and the rim watchtowers on the northern mountains. The soldiers at the checkpoints check the token before they reach for the rifle.
2. **It does not cross the river as an army.** Not since the ice attack of 2079 was broken by a blizzard. If a blow must be struck across the river, it goes by tunnel.
3. **It fights with numbers.** The Government has the most people in Seoul, and a broken line is filled with reservists.
4. **Every round is registered.** Soldiers hand back a casing for every round fired, and a round not accounted for stays in the sentences column.
5. **There are no machine-bodied soldiers.** No unit is made of soldiers with machines in their bodies. Only Capital Defense Command keeps a few drones for fighting, launched only on the commander''s sign-off.

What the Government''s army lacks is machine-body units, hired units, and a deep bench of engineers and maintenance; the hands that mend bridges and tunnels are borrowed from the Free Cities under the water supply contract. What it has in plenty is conscript infantry and reservists, checkpoint garrisons, mountain scouts, and the riflemen and mortars of Capital Defense Command.

<a id="third-contract"></a>
## The Government before the third water supply contract

For the Government, the water supply contract is a matter of the ledger before it is a matter of water. The Government does not record across the river as a country, so the National Assembly does not ratify the contract. The Ministry of Climate, Energy and Environment makes a maintenance service annex for each facility, the Member for the district where the facility stands seals it as well, and the President signs it off. The cities across the river are written in as work crews engaged for the service.

The Government wants one more well and one more deep-level fan at Seoul Station, a full rebuild of the Guui and Ttukdo intake pumps, and deeper wells. It offers intake sites and old mains, seconded labour, firewood, copper and wire. People seconded for labour receive a **secondment entry** and remain registered even while across the river.

At the third contract the Arc sits down for the first time. The six OMO Party Members want annexes with the Arc too; the eight Claw Party Members want no seal set with a body off the ledger. The bridges, tunnels and intakes the contract depends on are all in OMO Party districts, and the Claw Party''s only way to block an annex is the President''s sign-off. A President acclaimed by fourteen seals loses half the Members the day after taking either side. The full scales are in [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/).

<a id="unsettled"></a>
## What is not yet settled

- Who the present President for Life is, and who the fourteen districts'' Members of the National Assembly are, is not settled.
- Apart from Member of the National Assembly and the presidency being for life, the post names on this page such as Stationmaster, Dong Chief and Head of the District Office, and words such as token, striking off and acclamation, are names not yet settled and may change.
- Whose sign-off the National Intelligence Service answers to is not settled even inside the Government.

<a id="see-also"></a>
## See also

- [The Three Polities of Seoul](/wiki/Sixteen-States/), [Free City Society](/wiki/Free-City-Society/), [Arc Society](/wiki/Arc-Society/)
- [Bon-gwan and Hangnyeol](/wiki/Hangnyeol-and-Bon-gwan/), [Crossings and Smuggling](/wiki/Diaspora-Corridors/)
- [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/), [Titles and Offices](/wiki/Offices-and-Ranks/), [Guns, Rounds and Drones](/wiki/Era-Arms-and-Tech-Level/)
', '<a id="overview"></a>
## 개요

한강 북쪽 열네 구는 정부에 속한다. 정부 사람은 이 나라를 대한민국이라 부른다. 대정전 뒤 백 년 동안 이름도, 법전의 조문 번호도, 도장도 바꾼 적이 없다고 그들은 말한다. 바뀐 것은 나라의 크기뿐이다. 서기가 닿는 곳까지가 나라이고, 강이 그 끝이다.

정부의 첫째 규칙은 간단하다. 장부에 있으면 사람이다. 장부에 오른 사람은 배급과 잠자리와 물 몫을 받고, 그 대신 사는 역과 일을 마음대로 바꾸지 못한다. 강 남쪽은 공문에서 "장부 밖", 입말에서 "강 건너"다. 정부 사람은 강 건너를 야만인들 사는 데라고 말하고, 대부분은 건너가 본 적이 없다.

정부에는 서울에서 가장 많은 역과 사람이 있다. 사람이 사는 역 153곳에 약 16만 명이 산다. 산의 땔감, 옛 도심의 고물과 섬유, 구의와 뚝도의 취수구도 정부 것이다. 모자란 것은 기계를 고치는 손이다.

<a id="country-of-the-ledger"></a>
## 장부의 나라

정부는 대정전 첫해에 내린 **재난 사태**를 지금도 풀지 않았다. 2126년의 모든 고시는 첫 줄에 "재난 사태 아래에서"라고 적는다. 재난 사태는 정부가 사는 곳과 일을 정하고, 물자를 거두고, 사람을 부를 수 있는 근거다. 정부 사람은 이것을 이상하게 여기지 않는다. 겨울이 끝나지 않았으니 재난도 끝나지 않았다.

정부 사람이 겨울을 설명하는 말은 이렇다. "장부가 정원에 맞춰지자 겨울이 멈췄다." 사람 수를 세고, 역마다 정원을 정하고, 정원을 지키는 일이 겨울을 더 조이지 않게 한다고 그들은 믿는다. 그래서 장부는 행정의 도구이기 전에 정부의 신념이다.

정부가 새 낱말을 거의 만들지 않는 것도 그 때문이다. 국회, 행정부처, 구청, 동주민센터, 주민등록은 대한민국의 기관이 결핍 속에서 속이 빈 채 남은 것이다. 정부 사람에게 이 이름들은 옛 흔적이 아니라 자기 나라의 이름이다.

<a id="assembly-and-president"></a>
## 국회와 종신 대통령

<a id="assembly"></a>
### 국회

국회는 하나다. 대한민국 국회처럼 단원제이고, 의원은 국회의원뿐이다. 국회의원은 열넷, 구 하나에 의석 하나다. 각 구의 국회의원이 그 구의 공작령을 쥔다. 대정전 전 정부 열네 구에는 지역구가 스물네 곳 있었지만, 그 선은 지도에만 남았다.

여의도 국회의사당은 강 건너에 남아 비어 있다. 국회는 정부서울청사 본관 지하의 옛 회의실에서 열린다. 광화문역과 터널로 이어진 방이다. 선거는 4년마다 치르고, 대한민국 국회의 회기 번호를 그대로 이어 2126년의 국회는 2124년에 연 **제47대 국회**다. 등재된 어른은 동주민센터에서 투표 용지에 도장을 찍는다. 후보는 두 당에서 하나씩 나오지만, 이길 후보는 투표 전에 정해져 있다. 그 구의 의원 집안이 민 사람이다.

국회가 하는 일은 둘이다. 법률을 열네 도장으로 의결하고, 종신 대통령을 추대한다. 강 건너와의 약속은 국회가 비준하지 않는다. 부처가 부속서로 맺는다. 예산은 없다. 정부의 예산은 배급 장부 그 자체다.

<a id="acclamation"></a>
### 추대와 종신 대통령

대통령은 국회의원들이 국회의원 가운데서 낸다. 대통령은 종신이다. 이것을 **추대**라 한다.

- 추대는 대통령이 죽은 다음 날 열린다. 국회의원 열넷이 후보의 이름 아래 차례로 도장을 찍고, 열넷 모두가 찍어야 추대가 이루어진다. 한 사람이라도 찍지 않으면 다음 날 다시 모인다. 이것을 "열네 도장"이라 부른다.
- 그래서 대통령은 언제나 열네 집안 모두가 받아들일 수 있는 사람이다. 가장 힘센 집안의 사람이 대통령이 되는 일은 드물다.
- 추대는 국회의원 가운데 가장 나이 많은 사람이 주재하고, 추대가 끝날 때까지 그 사람이 대통령 권한대행으로 결재한다.
- 대통령이 된 국회의원은 의석을 내놓는다. 그 의석은 대통령 집안의 후계에게 간다.
- 대통령이 하는 일은 결재다. 부처 장관을 임명하고, 고시에 도장을 찍고, 국군 최고 지휘관의 임명장을 쓴다. 대통령은 구를 쥐지 않는다. 대통령의 힘은 열네 국회의원이 그 결재를 받아들이는 만큼이다.

대통령이 죽어야 다음 추대가 열리므로, 추대 사이의 긴 해들 동안 의원 집안들은 다음 추대의 도장을 미리 모은다. 장관과 청장 자리를 열네 집안이 나눠 갖는 것이 추대의 흥정거리다.

<a id="parties"></a>
### 두 당

서류상으로는 다당제다. 정당 등록부에는 지금도 당 열한 개가 올라 있다. 아홉은 당원이 한 사람도 없거나 당원 명부만 남은 당이다. 등록을 지우려면 국회 의결이 드는데, 아무도 그 안건을 올리지 않는다. 실제 당은 둘뿐이다.

- **OMO당**은 계약의 당이다. 강 건너와 계약해 기술과 부품을 들여와야 장부도 산다고 본다.
- **클로당**은 장부의 당이다. 강 북쪽의 땅과 일손으로 자급해야 하며, 장부 밖과 섞이면 장부가 무너진다고 본다.

당은 집안을 묶는 이름이다. 의원 집안이 당을 고르고, 그 구의 등재민은 의원 집안의 당을 따른다. 2126년 의석은 OMO당 여섯, 클로당 여덟이다. 한강에 닿은 네 구(마포, 용산, 성동, 광진)는 모두 OMO당이다. 다리와 터널과 취수구를 쥐고 있어서 계약이 깨지면 가장 먼저 다치기 때문이다. 강에 닿지 않는 중구와 서대문구도 OMO당이다. 두 구는 서울역과 회현, 공덕의 장터로 강 건너 물자에 기대어 산다. 산과 내륙의 여덟 구는 클로당이다.

<a id="fourteen-seats"></a>
### 열네 의석

| 구 | 당 | 이 구가 쥔 것 |
|---|---|---|
| 종로구 | 클로당 | 정부서울청사(부처와 국회 회의실), 광화문역. 정부의 머리 |
| 중구 | OMO당 | 서울역(가장 큰 역), 한국은행, 시청, 동대문역사문화공원과 회현의 장터 |
| 용산구 | OMO당 | 국방부와 수도방위사령부(삼각지), 용산–노량진과 이촌–동작 다리의 북쪽 끝 |
| 마포구 | OMO당 | 마포–여의나루 강 밑 터널, 합정–당산과 디지털미디어시티–마곡나루 다리의 북쪽 끝, 공덕 장터 |
| 성동구 | OMO당 | 뚝도 취수구, 서울숲–압구정로데오 강 밑 터널, 옥수–압구정 다리의 북쪽 끝, 왕십리 |
| 광진구 | OMO당 | 구의 취수구, 잠실수중보 북쪽 끝, 광나루–천호 강 밑 터널, 강변–잠실나루와 자양–청담 다리의 북쪽 끝 |
| 서대문구 | OMO당 | 마포와 종로 사이의 길목, 충정로와 신촌 |
| 동대문구 | 클로당 | 청량리(여러 노선이 모이는 역), 연료 장터 |
| 중랑구 | 클로당 | 상봉과 망우, 망우 묘역 |
| 성북구 | 클로당 | 북한산 쪽 테두리 망대, 옛 대학 터의 학교 |
| 은평구 | 클로당 | 연신내(깊은 노선이 지나는 역), 북한산 땔감, 북한산 쪽 테두리 |
| 강북구 | 클로당 | 4·19민주묘지 묘역, 북한산 쪽 테두리 |
| 도봉구 | 클로당 | 창동 차량기지, 도봉산 땔감과 테두리 |
| 노원구 | 클로당 | 화랑대 육군사관학교, 수락산·불암산 쪽 테두리, 빛밭이 가장 넓은 구 |

<a id="ministries"></a>
## 행정부처와 중앙 기관

정부서울청사의 부처들은 이름과 도장을 지켰다. 하는 일은 대정전 전보다 훨씬 좁고, 거의 모두 장부와 배급에 관한 것이다. 대정전 때 이 부처들의 본부는 대부분 세종, 과천, 대전에 있었다. 바깥 기계의 테두리가 그 도시들과 서울을 끊자, 정부서울청사에 남아 있던 직원들이 부처의 이름과 도장을 이어받았다.

| 기관 | 자리 | 2126년에 하는 일 |
|---|---|---|
| 행정안전부 | 정부서울청사 | 주민등록 원부를 지킨다. 재난 사태 고시, 민방위, 구청과 동주민센터의 감독 |
| 기후에너지환경부 | 정부서울청사 | 물과 전기. 취수구와 우물, 정원별 물 배정, 다리와 둔치의 바람틀, 고물 구리와 전선, 급수계약의 실무 |
| 산림청 | 정부서울청사 | 땔감. 북한산·도봉산 벌목 허가와 땔감 몫 |
| 국토교통부 | 정부서울청사 | 역과 터널. 역장 직제, 출입구 관리, 선로 위 손수레 운행, 역 정원 산정 |
| 농림축산식품부 | 정부서울청사 | 끼니. 섬유당 통과 버섯 굴, 빛밭 자리 배정, 섬유 납부 |
| 보건복지부 | 정부서울청사 | 보건소와 의료단, 부양 식구 배급, 기계 몸 기재와 아크 정비 허가 |
| 법무부 | 정부서울청사 | 말소 심의, 노역 처분의 집행, 법전 필사본 관리 |
| 국방부 | 용산구 삼각지 | 국군의 행정. 징병과 예비군 기재, 탄약 기재 |
| 국가정보원 | 중구 남산 자락 | 장부 밖의 일을 안다는 기관. 대정전 뒤 강 건너의 본부를 버리고 남산 자락의 옛 자리로 돌아왔다. 누구의 결재를 받는지는 정부 안에서도 분명하지 않다 |
| 한국은행 | 중구, 회현역 가까이 | 배급 증표를 찍고 그 고시 값을 정한다 |
| 대통령실 | 정부서울청사 | 대통령의 결재와 경호 |
| 국회사무처 | 정부서울청사 | 국회의 기록, 추대 도장부, 정당 등록부 |

대법원, 헌법재판소, 국무총리, 외교부와 그 밖의 여러 부처는 직제표에만 남아 있고 자리가 비어 있다. 정부는 그 자리를 지우지 않는다. 지우면 대한민국을 이어 왔다는 말이 약해지기 때문이다. 강 건너는 나라가 아니므로 외교의 대상이 아니라는 것이 정부의 공식 입장이다.

<a id="registration"></a>
## 주민등록: 장부

**장부**는 주민등록이다. 행정안전부가 정부서울청사 깊은 층에 원부를 두고, 동주민센터마다 자기 동의 사본을 둔다. 원부와 사본이 다르면 원부가 이긴다.

| 기재 사항 | 내용 |
|---|---|
| 주민등록번호 | 대정전 전과 같은 13자리. 앞 여섯 자리는 생년월일이다 |
| 주소 | 구, 동, 역, 층, 자리 번호. 예: "중구 회현동 서울역 승강장 3번" |
| 세대 | 세대주와 세대원. 배급과 노역은 세대 단위로 매긴다 |
| 직종 | 대물림하는 일. 바꾸려면 결재가 든다 |
| 배급 등급 | 아래 배급 등급 표의 등급 |
| 병역 | 복무, 예비군, 민방위, 면제 |
| 기계 몸 | 몸에 단 기계가 있는지, 어디서 정비받는지 |
| 처분 | 받은 벌의 기록 |

- **등재 증표.** 대한민국의 주민등록증은 얇은 쇠판에 번호를 새긴 등재 증표로 바뀌었다. 목에 걸고 다니며, 배급을 받을 때와 역을 오갈 때 내민다. 증표를 잃으면 새 증표를 받을 때까지 배급이 멈춘다.
- **전입신고.** 사는 역을 바꾸려면 전입신고를 내고 도장 셋을 받아야 한다. 떠나는 역의 역장, 떠나는 동의 동장, 받는 쪽 구청이다.
- **정원.** 역마다 국토교통부가 정한 정원이 있다. 역이 정원을 넘으면 동장이 정원에 빈자리가 있는 역으로 세대 하나를 옮기는 전입 명령을 낸다. 옮겨 가는 쪽은 대개 얕고 추운 역이다.

**말소**는 장부에서 지워지는 것이다. 세 가지가 있다.

1. **사망 말소.** 사망 신고를 받아 지운다. 붉은 줄 한 줄을 긋고 날짜를 적는다.
2. **거주불명 말소.** 기재된 역을 떠나 서른 날 동안 돌아오지 않은 사람을 지운다.
3. **처분 말소.** 벌로 지운다. 붉은 줄 두 줄을 긋는다. 다시 올릴 수 없다.

말소된 사람은 장부 밖이다. 배급을 받지 못하고, 증표가 잘리고, 법이 그 사람을 보지 않는다. 정부 사람은 장부 밖 사람을 해쳐도 죄가 되지 않는다고 배운다. 다만 그 사람이 등재 세대에서 일하던 사람이면, 그 세대가 잃은 일손을 물어 준다.

<a id="local-offices"></a>
## 구청, 동주민센터, 역장

정부의 일은 역에서 시작해 구청에서 끝난다. 결재선은 "역장, 동장, 구청장, 국회의원"이다.

- **구청**은 국회의원 집안의 사무소다. 구청의 우두머리인 **구청장**은 국회의원이 임명하는 직책이다. 국회의원의 도장을 대신 찍고, 구 고시를 내고, 민원 심리를 연다. 구청장은 땅을 쥐지 않는다.
- **동주민센터**는 **동장**의 배급소다. 배급, 기재, 민원의 세 창구가 있다. 정부 사람이 가장 자주 마주치는 공무원은 이 창구의 서기다. 배급 서기 한 사람이 한 세대의 이번 달 끼니를 정할 수 있다.
- **역장**은 역의 열과 공기를 쥔 사람이라 동장보다 아래이면서 동장보다 무섭다. 역장 자리는 역장 집안 안에서 물린다.

<a id="law"></a>
## 법과 벌

<a id="law-layers"></a>
### 법의 층

| 층 | 무엇인가 | 누가 정하나 |
|---|---|---|
| 헌법 | 대한민국 헌법. 고친 적이 없다. 거의 아무도 읽지 않지만 정부의 정당성이 여기서 나온다 | 고치지 않는다 |
| 법률 | 대한민국 법전의 조문. 번호를 그대로 달고 고쳐 쓴다 | 국회가 열네 도장으로 의결한다 |
| 고시 | 부처가 재난 사태 아래에서 내는 명령. 배급 등급, 정원, 노역 시간 | 장관이 쓰고 대통령이 결재한다 |
| 구 고시 | 구마다 다른 규칙. 장터 자릿세, 출입구 당번, 땔감 몫 | 구청장이 쓰고 국회의원이 결재한다 |

실제로 사람의 삶을 정하는 것은 고시와 구 고시다. 법률을 고치는 일은 열네 도장이 들어서 드물다. 그래서 정부의 법은 오래된 조문 위에 고시가 겹겹이 쌓인 모양이다.

<a id="trials"></a>
### 재판

- **민원 심리.** 등재민끼리의 다툼과 가벼운 죄는 구청의 민원 심리에서 듣는다. 구청장이 국회의원의 이름으로 연다. 증거는 증인보다 장부다. 기재를 다투려는 사람은 증인이 아니라 서기의 도장을 가져와야 한다.
- **말소 심의.** 처분 말소에 이를 수 있는 죄는 법무부가 정부서울청사에서 심의한다. 심의관 셋이 듣고, 그 구 국회의원의 의견서를 받는다. 처분 말소는 대통령의 결재로 확정된다.
- 변호인은 없다. 민원 서류를 대신 써 주는 서기가 있을 뿐이다.

<a id="punishments"></a>
### 벌의 사다리

정부의 벌은 거의 모두 장부 위에서 이루어진다. 벌은 기재 사항을 바꾸는 일이다.

| 단계 | 벌 | 장부에 남는 것 |
|---|---|---|
| 1 | 경고 | 처분 칸에 한 줄 |
| 2 | 배급 감등 | 배급 등급을 한 달에서 석 달까지 한 등급 내린다 |
| 3 | 노역 처분 | 가장 추운 일(출입구 굴 열기, 지상 고물 나르기, 강가 얼음 깨기)을 정해진 날수만큼 진다 |
| 4 | 강제 전입 | 세대 전체를 얕고 추운 역으로 옮긴다 |
| 5 | 처분 말소 | 장부에서 지운다. 증표를 자르고 역 밖으로 내보낸다 |

사형은 법전에 조문으로 남아 있지만 집행하지 않는다. 대신 처분 말소가 있다. 겨울 속에서 장부 밖으로 나간 사람이 오래 살지 못한다는 것을 모두가 안다. 정부 사람은 "죽이지 않고 지운다"고 말한다.

가장 무거운 죄는 다섯이다. 정해진 몫보다 많은 열과 물을 가져가는 것, 장부와 증표를 고치거나 남의 증표로 배급받는 것, 장부와 옛 공문서를 섬유당 통에 넣는 것, 도장 없이 강을 건너거나 허가 없이 장부 밖 사람과 거래하는 것, 허가 없이 기계를 몸에 다는 것이다.

<a id="classes"></a>
## 계층과 일의 대물림

결핍 속에서 펌프를 돌리는 집의 아이는 펌프를 배웠고, 서기의 아이는 장부를 배웠다. 정부는 그것을 만든 것이 아니라 받아 적었다. 장부는 그것을 직종으로 적었고, 적힌 것은 굳었다. 계층은 세대주의 직종으로 매긴다.

| 계층 | 누구인가 | 정부 사람 가운데 | 장부가 주는 것 | 장부가 가져가는 것 |
|---|---|---|---|---|
| 의원 집안 | 국회의원과 그 세대, 가까운 친족 세대 | 약 0.5% | 깊은 층의 잠자리, 자기 창고, 나무 불, 장관 자리 | 대통령에 대한 도장, 구의 징발 몫 |
| 공무원 가구 | 동장, 서기, 역장, 경찰관, 부처 직원 | 약 8% | 깊은 터널 층의 잠자리, 사무 배급, 시험을 칠 자격 | 틀림없는 장부. 장부가 틀리면 책임 |
| 군 가구 | 직업 군인의 세대 | 약 7% | 군 배급, 승강장 안쪽 막사 | 아들딸의 직업 군인 복무 |
| 기능 가구 | 펌프조, 열 펌프 정비, 섬유당 통지기, 전기공, 수선공 | 약 18% | 노역 의무를 줄여 준다, 징병 대신 대체 복무 | 교대 근무, 직종을 떠나지 못함 |
| 노역 가구 | 출입구 일꾼, 고물·섬유 채집꾼, 빛밭 일꾼, 짐꾼, 벌목꾼 | 약 66.5% | 가장 큰 끼니 몫, 잠자리 한 자리 | 노역 의무, 징병, 가장 추운 일 |

열여섯 살 아래 아이와 일하지 못하는 노인과 병자에게는 **부양** 표시가 붙는다. 정부 사람의 약 30%다. 아이는 열여섯 살 생일에 세대주의 직종 아래 기재된다. 이것을 **전승 기재**라 한다.

계층을 오르는 길은 하나뿐이다. 해마다 긴 밤 철 첫 달에 정부서울청사에서 치르는 공무원 시험이다. 장부 셈과 법전 조문을 본다. 붙는 사람은 해마다 몇십 명이다. 노역 가구의 아이가 시험 공부를 하려면 세대가 그 아이의 노역 몫을 대신 져야 한다. 다른 계층 사이의 혼인은 동장의 결재가 든다. 내려가기는 쉽다. 장부를 틀린 서기는 노역 가구로 간다.

<a id="rations-and-taxes"></a>
## 배급과 세금

<a id="coupons"></a>
### 증표

정부의 돈은 **배급 증표**다. 한국은행이 회현역 가까운 옛 본관 지하에서 찍는다. 증표에 적는 단위는 여전히 **원**이다. 증표에는 끼니, 물, 연료, 물품의 네 가지가 있다. 고시 값으로 섬유당 죽 한 그릇(약 600 kcal)이 1,000원이다. 사람들은 한 사람 하루치 끼니 증표와 물 증표 10 L를 합쳐 **한 끼**라 센다.

증표는 동주민센터에서 달마다 세대 단위로 받고, 그 세대가 기재된 동주민센터에서만 끼니로 바꿀 수 있다. 다른 동에서는 장터에서 물건으로만 쓴다. 탄약, 동력 덩이, 기계 부품은 증표로 사지 못한다. 국군과 부처의 기재품이기 때문이다.

<a id="ration-grades"></a>
### 배급 등급

| 등급 | 누구 | 하루 끼니 | 그 밖에 |
|---|---|---|---|
| 군 복무 | 복무 중인 병사와 직업 군인 | 약 3,200 kcal | 연료 증표, 열흘마다 벌레 단백 |
| 노역 | 노역 가구의 일하는 사람 | 약 3,000 kcal | 연료 증표 |
| 기능 | 기능 가구의 일하는 사람 | 약 2,700 kcal | 연료 증표, 달마다 물품 증표 하나 |
| 사무 | 공무원 가구의 일하는 사람 | 약 2,400 kcal | 연료 증표, 달마다 물품 증표 둘 |
| 부양(아이) | 열여섯 살 아래 | 약 1,800 kcal | 세대 몫에서 센다 |
| 부양(노인·병자) | 일하지 못하는 사람 | 약 1,700 kcal | 세대 몫에서 센다 |

물은 한 사람 하루 10 L를 세대 몫으로 준다. 의원 집안은 등급이 없고 자기 창고에서 먹는다. 창고가 모자라면 동주민센터는 사무 몫을 먼저, 그다음 부양 몫을 깎고, 노역과 기능 몫은 마지막에 깎는다. 펌프와 출입구는 멈출 수 없기 때문이다.

열은 잠자리 깊이로 나눠 준다. 깊은 터널 층은 의원 집안과 공무원 가구, 승강장 안쪽은 기능 가구와 군 막사, 승강장 바깥쪽과 대합실 가까운 쪽은 노역 가구의 자리다. 잠자리 번호가 주소의 마지막 칸인 까닭이다.

<a id="taxes"></a>
### 세금

세금은 돈이 아니라 일과 물건과 사람으로 낸다.

| 세금 | 무엇을 | 얼마나 |
|---|---|---|
| 노역 의무 | 등재된 어른(16~60세)의 시간 | 이레마다 하루. 출입구 굴 열기, 눈 치우기, 섬유 캐기, 빛밭 둑 쌓기 |
| 섬유 납부 | 세대가 캐 온 종이, 판지, 나무, 무명 | 동주민센터에 모두 내고 섬유당으로 받는다. 구청이 10분의 1을 떼어 둔다 |
| 생산 몫 | 섬유당 통, 버섯 굴, 빛밭, 벌레 굴의 소출 | 10분의 1을 구청 창고에 |
| 국고 납부 | 구청 창고 | 구청이 받은 것의 3분의 1을 정부서울청사 국고로 |
| 자릿세 | 장터 자리 | 날마다 증표로 |
| 병역 | 사람 | 아래 국군 절 |

섬유 납부에는 금기가 하나 있다. 장부와 옛 공문서는 섬유가 아니다. 도장이 찍힌 종이는 동주민센터에 따로 내고, 행정안전부가 보관한다. 정부가 서울에서 섬유를 가장 많이 갖고 있으면서도 가장 많이 굶주리는 해가 있는 까닭이다. 정부 사람이 세금에 대해 불평하는 것은 크기가 아니라 순서다. 구청은 배급보다 세금을 먼저 센다.

<a id="markets"></a>
## 역별 장터

배급만으로 사는 사람은 없고, 서기 앞에서 그것을 인정하는 사람도 없다. 정부는 장터를 구 고시로 허가한다. 지켜볼 수 있는 큰 역의 넓은 대합실에서만 연다. 상인은 상인 기재를 받은 사람이며, 자릿세를 날마다 증표로 낸다.

| 역 | 구 | 장터 |
|---|---|---|
| 종로3가 | 종로구 | 증표 중개와 대서. 민원 서류와 전입 서류를 대신 써 준다. 정부가 가장 오래 눈감아 온 장이다 |
| 동대문 | 종로구 | 옷 수선과 헌 옷. 합성 섬유 옷을 되판다 |
| 동대문역사문화공원 | 중구 | 강 북쪽에서 가장 큰 옷과 장화 장 |
| 회현 | 중구 | 먹을거리. 벌레 단백, 말린 물고기, 절인 배추와 순무, 콩나물과 보리싹. 증표의 장터 값이 여기서 정해진다 |
| 서울역 | 중구 | 허가 상인 대기소. 강 건너 상인이 임시 기재를 받고 머물 수 있는 정부 땅의 유일한 곳이다 |
| 공덕 | 마포구 | 마포 터널로 들어온 강 건너 부품과 공구. OMO당이 지키는 장이다 |
| 왕십리 | 성동구 | 고물 쇠붙이, 선로 부품, 전선 |
| 청량리 | 동대문구 | 연료. 메탄 통, 숯, 고물 땔감 |
| 제기동 | 동대문구 | 버섯과 말린 약초 |
| 상봉 | 중랑구 | 사냥한 짐승의 고기와 가죽 |
| 연신내 | 은평구 | 북한산 땔감. 의원 집안의 하인들이 나무 불의 나무를 사 간다 |
| 창동 | 도봉구 | 창동 차량기지에서 뜯은 기계 부품 |
| 노원 | 노원구 | 빛밭 채소와 씨앗 |
| 건대입구 | 광진구 | 강 얼음 구멍에서 잡은 물고기 |

장터에서 증표 다음으로 많이 쓰이는 것은 오래 가고 값이 변하지 않는 바늘, 실타래, 소금이다. 소금은 서울에서 나지 않아 해마다 귀해진다.

<a id="clothing"></a>
## 옷

서울에서 무명과 종이와 나무는 먹을 것이다. 그래서 정부 사람이 입는 옷은 먹을 수 없는 섬유, 곧 대정전 전의 합성 섬유 옷을 뜯어 고친 것이다. 무명 옷을 새로 짓는 것은 끼니를 덜어 내는 일이라 의원 집안만 한다. 모양은 어디서나 같다. 누빔 긴 외투, 펠트나 합성 고무 장화, 귀덮개 모자, 얼굴 가리개다. 정부의 색은 **남색**이다.

옷은 기재 사항을 보여 준다. 종신 대통령은 봉황 문장을, 국회의원은 왼쪽 깃에 금배지를 단다. 장관과 공무원은 등재 증표 옆에 공무원증을 하나 더 건다. 역장은 옛 역무원 모자를 쓰고, 국군은 대정전 전 얼룩무늬 방한복을 고쳐 입는다. 기능 가구는 회색 작업 누빔옷에 직종 표를 꿰매고, 노역 가구는 노역 의무일에 대정전 전의 주황 작업 조끼를 덧입는다. 장부 밖 사람에게는 표지가 없다. 직종 표를 뜯어낸 바늘 자국, 곧 "뜯긴 자리"가 말소자를 알아보게 한다.

<a id="day"></a>
## 하루와 의례

정부의 하루는 사이렌으로 시작해 사이렌으로 끝난다. 06:00 점등 사이렌이 길게 한 번 울리면 동주민센터 앞에서 **국민의례**를 한다. 국기에 대한 경례를 하고, 애국가 1절을 부르고, 묵념한다. 1분이 걸린다. 묵념은 지난 하루 동안 사망 말소된 사람을 위한 것이고, 동장이 그 이름을 읽는다. 22:00 소등 사이렌이 길게 두 번 울리면 승강장 불을 끈다. 교대는 여덟 시간씩 셋이다. 일요일이라는 이름은 남아 있지만 쉬는 날은 아니다.

정부에는 국교가 없다. 헌법의 정교분리 조문이 그대로 남아 있다. 정부 사람의 믿음은 대개 장부의 믿음이다. 정부는 이것을 신앙이라 부르지 않고 행정이라 부른다.

- **재난의 날.** 정부는 대정전의 정확한 날짜를 모른다. 그래서 해가 가장 짧은 날을 재난의 날로 정했다. 그날 정오에 서울의 모든 정부 역이 사이렌을 길게 울리고 3분 동안 묵념한다.
- **제야의 종.** 해가 바뀌는 밤, 종각역 대합실로 옮겨 단 보신각 종을 서른세 번 친다. 대통령이 첫 번을 친다. 종소리는 터널 전화로 각 구청에 이어진다.
- **죽음.** 사람이 죽으면 동장이 사망 말소의 붉은 줄을 긋는다. 시신은 썩지 않는다. 구마다 지상에 **눈 묘역**이 있고, 노역 가구의 장례조가 썰매로 시신을 옮겨 눈에 묻는다. 중랑구 사람은 망우 묘역에 묻힌다. 의원 집안 사람과 나라에 공을 세운 사람은 강북구 4·19민주묘지 터에 묻힌다. 동작동의 국립서울현충원은 강 건너에 있어서 정부는 백 년 동안 그곳에 아무도 묻지 못했다. 시신과 죽은 사람의 옷은 섬유당 통에 넣지 않는다.

<a id="arc-and-baptism"></a>
### 아크와 세례에 대한 입장

정부 장부는 아크를 **장부 밖 단체**로 적는다. 그런데 정부에는 전기로 움직이는 기계 몸을 고칠 곳이 없다. 정부 시술소는 이음 자리를 심고 몸 힘으로 움직이는 손발을 달 수 있지만, 전기로 움직이는 기계를 맞추고 정비하려면 아크의 정비대에 기댈 수밖에 없다. 정부는 이것을 **기계 몸 기재**로 푼다. 보건복지부의 허가를 받아 기계를 단 사람은 기재 사항에 "기계 몸"과 정비받는 곳을 적고, 허가받은 날에만 강 밑 터널 검문소를 지나 아크의 정비대에 간다.

정부는 서류로 가른다. 허가받은 기계는 의료이고, 세례는 장부 밖 단체에 드는 것이다. 허가 없이 기계를 다는 것과 세례를 받는 것은 말소 심의의 대상이다. 정부 사람 가운데 그 둘이 실제로 다른지 확신하는 사람은 드물다. 국군은 병사가 정비 허가를 받는 것을 가장 꺼린다. 정비대에 다녀온 병사가 돌아오지 않는 일이 해마다 몇 번씩 있다.

<a id="army"></a>
## 국군

<a id="army-structure"></a>
### 지휘 구조

정부의 군대는 **국군**이다. 대한민국 국군이 이름과 계급을 지킨 채 줄어든 것이다.

| 기관 | 자리 | 하는 일 |
|---|---|---|
| 국방부 | 용산구 삼각지 | 징병과 예비군의 기재, 탄약 기재, 군 배급 |
| 수도방위사령부 | 용산구 삼각지 | 정부의 야전군. 강이 얼자 강 건너 남태령의 본부를 버리고 삼각지로 옮겼다. 강 밑 터널 검문소 세 곳과 다리의 북쪽 끝을 지키는 직할 부대를 둔다 |
| 구 부대 | 각 구청 | 국회의원이 그 구의 징집병과 예비군으로 꾸린다. 역과 출입구, 산 쪽 테두리 망대를 지킨다 |
| 육군사관학교 | 노원구 화랑대 | 군 가구의 아이를 장교로 기른다 |

군대 하나에는 지휘관 하나가 있고, 그 지휘관이 군대의 모든 분대를 지휘한다. 정부는 이것을 결재로 읽는다. 군대 하나의 작전 명령서에는 도장이 하나만 찍힌다. 지휘관의 도장이다. 분대장은 명령을 옮기는 사람이지 내리는 사람이 아니다. 그래서 정부 군대는 느리지만 흩어지지 않는다. 지휘관이 쓰러지면 다음 지휘관의 도장이 올 때까지 분대들은 그 자리를 지킨다.

<a id="conscription"></a>
### 징집과 복무

- 열아홉 살이 된 등재민은 남녀 모두 18개월 복무한다. 사람이 모자라 여자도 부른다.
- 펌프조와 취수구 정비, 열 펌프 정비 같은 직종은 총을 들지 않고 18개월 동안 취수구나 다리의 바람틀에서 일한다. 펌프는 총보다 귀하다.
- 복무를 마친 사람은 마흔 살까지 예비군, 쉰 살까지 민방위다.
- 부사관과 장교는 군 가구에서 나온다. 장교가 될 아이는 화랑대에서 두 해를 배운다.
- 2126년 상비 병력은 직업 군인 약 4,000명과 복무 중인 징집병 약 2,500명이다. 부를 수 있는 예비군은 약 2만 명이다. 탄약은 그 수만큼 없다.

<a id="doctrine"></a>
### 싸우는 법

1. **지키는 군대다.** 강 밑 터널 세 곳의 검문소, 일곱 다리의 북쪽 끝, 북쪽 산의 테두리 망대를 지킨다. 검문소의 군인은 총보다 증표를 먼저 본다.
2. **강을 군대로 건너지 않는다.** 2079년 얼음판 공격이 눈보라에 꺾인 뒤로 그렇다. 강 건너를 칠 일이 생기면 터널로 간다.
3. **수로 싸운다.** 정부는 서울에서 사람이 가장 많다. 무너진 줄은 예비군으로 메운다.
4. **한 발마다 기재한다.** 병사는 쏜 만큼 탄피를 반납하고, 반납하지 못한 한 발은 처분 칸에 남는다.
5. **기계 몸 병사가 없다.** 몸에 기계를 단 병사로 꾸린 부대가 없다. 싸움에 띄우는 드론은 수도방위사령부만 몇 대 갖고, 사령관의 결재로만 띄운다.

정부 군대에 없는 것은 기계 몸 부대, 고용한 부대, 그리고 두꺼운 공병과 정비다. 다리와 터널을 고치는 손은 급수계약으로 자유도시들에서 빌린다. 대신 징집 보병과 예비군, 검문소 수비대, 산 쪽 정찰, 수도방위사령부의 소총병과 박격포가 많다.

<a id="third-contract"></a>
## 세 번째 급수계약을 앞둔 정부

급수계약은 정부에게 물의 문제이기 전에 장부의 문제다. 정부는 강 건너를 나라로 적지 않는다. 그래서 국회는 계약을 비준하지 않는다. 기후에너지환경부가 시설 하나마다 정비 용역 부속서를 맺고, 그 시설이 있는 구의 국회의원이 함께 도장을 찍고, 대통령이 결재한다. 강 건너 도시들은 용역을 맡은 작업조로 적힌다.

정부가 원하는 것은 서울역의 우물 하나 더와 깊은 층 팬 하나 더, 구의·뚝도 취수구 펌프의 통째 수리, 더 깊은 우물이다. 내놓는 것은 취수구 자리와 옛 관로, 노역 파견, 땔감, 구리와 전선이다. 노역 파견을 받은 사람은 **파견 기재**를 받아 강 건너에 있어도 등재민으로 남는다.

세 번째 계약에는 아크가 처음 앉는다. OMO당 여섯은 아크와도 부속서를 맺자고 하고, 클로당 여덟은 장부 밖 단체에 도장을 찍지 말자고 한다. 계약이 걸린 다리와 터널과 취수구는 모두 OMO당 구에 있고, 클로당이 부속서를 막을 길은 대통령의 결재뿐이다. 열네 도장으로 추대된 대통령은 어느 편을 들어도 다음 날부터 절반의 의원을 잃는다. 자세한 저울은 [급수계약과 세 정체](/wiki/World-Relation-Ledger/)에 있다.

<a id="unsettled"></a>
## 아직 정해지지 않은 것

- 지금의 종신 대통령이 누구인지, 열네 구의 국회의원이 누구인지는 정해지지 않았다.
- 국회의원이라는 칭호와 대통령이 종신이라는 것 말고, 이 문서의 역장, 동장, 구청장 같은 자리 이름과 증표, 말소, 추대 같은 낱말은 아직 정해지지 않은 이름이며 바뀔 수 있다.
- 국가정보원이 누구의 결재를 받는지는 정부 안에서도 정해져 있지 않다.

<a id="see-also"></a>
## 함께 읽기

- [서울의 세 정체](/wiki/Sixteen-States/), [자유도시들의 사회](/wiki/Free-City-Society/), [아크 사회](/wiki/Arc-Society/)
- [본관과 항렬](/wiki/Hangnyeol-and-Bon-gwan/), [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)
- [급수계약과 세 정체](/wiki/World-Relation-Ledger/), [칭호와 자리](/wiki/Offices-and-Ranks/), [총, 탄, 드론](/wiki/Era-Arms-and-Tech-Level/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Free-City-Society', 'Free City Society', '자유도시들의 사회', 'factions', 6, '<a id="overview"></a>
## Overview

The seven districts south-west of the Han, Gangseo, Yangcheon, Yeongdeungpo, Guro, Geumcheon, Dongjak and Gwanak, hold seven cities. The cities are independent of one another; each is its own power and holds its own duchy. No single person stands above the seven, and there is no name binding them. People say "the Free Cities" or "the south-western cities", and call one city by its district name: "Guro people", "the Gwanak side", "Dongjak people". In official papers and contracts a district name may take "City", as in "Guro City".

Most of their people are engineers who trade goods and skill. There was no way to tell whose skill was greater, so no leader of all seven was ever chosen. Instead they bargained, and the promises of the bargaining piled up into cities. The Government''s clerks never reached the south-west. What was there instead were the factory sites of Guro and Gasan, the warehouses of Yeongdeungpo and Yeouido, and the depot workshops of Sinjeong and Guro. A station with good water filters needed a station that could wind motors, and a station that wound motors needed a station with spare parts.

What the Free Cities hold is skill and trade: the hands that build and mend wind machines, heat pumps, well pumps and water wheels, the workbenches that cut parts, and the markets and contracts that buy and sell them. The Government''s water and the Arc''s power both pass through Free City hands in the end. What they lack is people, land and firewood. About 75,000 people live in the seven cities.

Until the Arc split away in 2122, "Free City" meant any station south of the river off the Government ledger, including the shelters of Gangnam''s four districts. Now it means only the cities of the seven south-western districts.

<a id="seven-cities"></a>
## The seven cities at a glance

| City (district) | Head | How the head is chosen | Seat station | Stations | People (2126) | Lives by |
|---|---|---|---|---|---|---|
| Gangseo | Wind Keeper | Chosen by the bench masters of the wind fields; for life, but steps down if the figures are missed | Gimpo Int''l Airport | 18 | about 17,000 | Wind power, wide light-fields |
| Yangcheon | Depot Master | Handed down in one depot house | Sinjeongnegeori | 7 | about 4,200 | Motor and wheel rebuilding at the Sinjeong depot, rail carts |
| Yeongdeungpo | Market Master | The market houses take it in turn, three years each, in a fixed order | Yeongdeungpo | 18 | about 20,600 | The great market, water from the Yangpyeong-dong intake, the contract meeting place |
| Guro | Works Master | Held by the bench master with the most kept sureties | Guro | 9 | about 9,600 | Parts from the old factory sites and the Line 1 depot, pumps |
| Geumcheon | Edge Warden | Chosen by the edge crew from among those who have crossed the rim and come back | Gasan Digital Complex | 3 | about 3,200 | Power cores fetched from outside, well-drilling rigs |
| Dongjak | Ferry Keeper | Chosen by the crossing chiefs from among themselves | Noryangjin | 14 | about 14,000 | Crossing shares, fish from under the ice |
| Gwanak | Duke | Handed down in I Ilseop''s house | Sillim | 8 | about 6,200 | Firewood and wood fibre from Gwanaksan, drilling the mountain rock |

There is a reason each city chooses its head by a different rule. Across all seven there was no answer to the question of whose skill was greater. So each city found something in its own work that could be measured. Gangseo measures the watts its wind fields produce; Guro the number of sureties kept; Geumcheon coming back alive from the rim; Dongjak the crossings held. Yangcheon and Gwanak, finding nothing to measure, hand the post down within a house. Yeongdeungpo measures nobody and turns the rota. These seven answers are the seven cities'' characters.

<a id="cities"></a>
## The cities

<a id="gangseo"></a>
### Gangseo: the Wind Keeper

Fields of wind machines stand on the open riverside plain to the west. The open riverbank catches strong wind, and the plains of Magok and Gayang have few buried buildings, so wind machines can stand there in rows. Gangseo makes the most power of any Free City and sells its surplus to Yangcheon and Yeongdeungpo through cables laid along Lines 5 and 9. The same plain suits wide light-fields, and Gangseo''s light-fields are the widest of the seven cities. The old hangars of Gimpo Int''l Airport are a salvage ground yielding light metal sheet and long girders.

The bench masters of the wind fields gather to choose the Wind Keeper. Once chosen, the Wind Keeper serves for life, but steps down if the wind fields in their charge fall short of the watts written in the contracts for two long-dark halves running. Gangseo people call this "the wind changes the person". Magongnaru is joined by the Airport Railroad bridge to the Government''s Digital Media City, and Gimpo Int''l Airport, Gaehwa and Banghwa, at Seoul''s western edge, face the rim of the outside machines.

<a id="yangcheon"></a>
### Yangcheon: the Depot Master

Yangcheon lives on the workshops and stores of the Line 2 Sinjeong depot. The wide space under the depot roof is itself a warm workshop, and the remaining trains are a store of motors, wheels, axles and steel plate. Yangcheon rewinds old motors and recuts wheels to bring them back. It also builds **rail carts**, pushed along the tunnel rails by hand or by a small motor. Almost all freight between the Free Cities moves on Yangcheon''s rail carts.

It is the smallest of the seven cities. The house that first revived the depot has handed down the Depot Master''s post since the 2040s. The depot''s work is split into four shifts, and the Depot Master and four shift leaders are all of Yangcheon''s government. The Depot Master''s house ties the shift-leader posts to itself by marriage.

<a id="yeongdeungpo"></a>
### Yeongdeungpo: the Market Master

Yeongdeungpo lives by three things. First, the largest market of the seven cities: the platforms and concourse between Yeongdeungpo and Yeongdeungpo Market are the market, and the old warehouses of Yeouido are its storehouse. Second, water: the south-western intake for river water under the ice is at Yangpyeong-dong, and Yeongdeungpo holds it. Third, the contract meeting place: the great contract meetings with the Government are almost always held by Yeongdeungpo.

The market houses take the Market Master''s post in turn, three years each. The order is the one fixed when the market first opened, and nobody can change it. So who will be Host at the water supply contract, which comes once in thirty years, is decided by the rota.

When the river froze, the National Assembly moved to Gwanghwamun and the Assembly building at Yeouido emptied. National Assembly station and the building above it are now Yeongdeungpo land. Yeongdeungpo holds its contract meetings with the Government in the Assembly building. It is custom, not law. The surface rooms are too cold to use; the snow-buried lower floors and the Line 9 National Assembly station level are heated and used instead. Government people come in as guests to set their seals in the building their forebears left. Mapo–Yeouinaru is the only under-river tunnel between the Government and the Free Cities, with a Government ledger checkpoint at its north mouth.

<a id="guro"></a>
### Guro: the Works Master

Guro cuts parts. Guro''s workbenches make pump vanes and shafts, compressor parts for heat pumps, bearings for wind machines and blades for water wheels. Its base is the old factory sites and the Line 1 depot workshop, and the Line 7 depot at Cheonwang is its second workshop. Sindorim has only three exits, so air limits how many people it can hold, and the fan Guro means to fit next is Sindorim''s.

The Works Master is the bench master with the most kept sureties. Every Guro workbench carves on a board the contracts it has made and whether it paid them off in full. This is the **surety board**. When the Works Master dies, or their bench breaks a surety even once, the bench master with the most carvings on the surety board becomes the next Works Master. Skill cannot be measured high or low, but the number of promises kept can be counted: that is Guro''s answer.

<a id="geumcheon"></a>
### Geumcheon: the Edge Warden

Geumcheon has the fewest stations of the seven: Gasan Digital Complex, Doksan and Geumcheon-gu Office. Pressed against the edge of Seoul, it watches the rim of the outside machines more closely than anyone and lives by that nearness. In the two or three days when a blizzard blinds the machines, its people cross the rim and strip power cores and parts from broken war machines. From the big machines salvaged at Gasan''s old factory sites it also builds well-drilling rigs. Without Geumcheon''s rigs, even Gwanak''s drilling crews cannot break the rock.

The edge crew chooses the Edge Warden from among those who have crossed the rim and come back. Few have, so there are only ever two or three candidates. The Edge Warden serves for life, and the post falls vacant if the Edge Warden crosses again and does not return. The Edge Warden need not cross, but one who does not loses the edge crew''s ear. In the buried factory basements between Geumcheon''s three stations and in the abandoned stretch of Line 1 lives a band of people whose seals were broken ([G12 · Geumcheon Hands Without Surety](/wiki/Hostile-Group-G12/)). Freight and work crews on Line 1 buy the edge crew''s escort.

<a id="dongjak"></a>
### Dongjak: the Ferry Keeper

Dongjak lives by its crossings. Of the thirteen joins where the polities meet, eight have an end in the Free Cities, and five of those are in Dongjak: Noryangjin (Line 1, to the Government''s Yongsan), Dongjak (Line 4, to the Government''s Ichon), Dongjak (Line 9, to the Arc''s Gubanpo), Sadang (Line 2, to the Arc''s Bangbae) and Chongshin Univ. (Isu) (Line 7, to the Arc''s Naebang). Almost everyone and everything going between the Government or the Arc and the Free Cities passes through Dongjak, and Dongjak takes a passage share from the freight. It also cuts holes in the river ice off Noryangjin and Heukseok to fish. The ice-hole market at Noryangjin is where the most fish change hands in Seoul.

Each crossing has a crossing chief, and the five crossing chiefs choose the Ferry Keeper from among themselves. A Ferry Keeper is Ferry Keeper only while holding their own crossing. Dongjak''s Ferry Keeper faces the Government on the river side and the Arc on the land side. The land border with the Arc has no river, so quarrels there are most frequent, and Dongjak keeps more guard hands than any other city.

<a id="gwanak"></a>
### Gwanak: the Duke

Gwanak lives by Gwanaksan. The forest on the near slopes was all cut by the 2060s, and what remains is on the outer slopes toward the rim. Gwanak''s wood crews climb to those slopes and cut dead trees. As firewood, wood is a luxury; as fibre, it is the raw stuff of fibre sugar. Gwanak''s drilling crews bore through the mountain''s granite to dig deep wells.

Gwanak is held by I Ilseop''s house as a duchy. Around 2056-2065 the leading house of Gwanak watched the Government across the river call its districts duchies and hand them to Members of the National Assembly, took the same word, and declared that it sat in the same seat as the Government. So Gwanak insists on sealing contracts with the Government "duchy to duchy". People of the other cities half laugh at this insistence and half envy it. The Duke''s post is handed down within that house; I Ilseop was born in 2092 and is thirty-four in 2126. Under the Duke are two Section Chiefs, the wood crew chiefs, and a mountain watch. Gwanak touches Seocho by land but has no rail link, and Namtaeryeong and Gwanaksan, at Seoul''s southern edge, face the rim.

<a id="contract-meeting"></a>
## The contract meeting

When the cities have something to decide together, they call a **contract meeting** each time. It has no fixed place, no standing body and no staff. When a contract meeting ends, all that remains is the sealed contracts. So a contract meeting is not a name binding the seven cities but the custom by which they meet.

- Any city''s head can call a contract meeting. The calling city provides the place, and its head becomes the **Host**, who supplies the meeting''s heat, light, meals and sleeping places. "A contract meeting lasts as long as the stove." It rarely runs past three days.
- What a contract meeting makes is not one decision but several contract sheets. A sheet binds only the cities that seal it. There is no vote, and the Host has no vote either.
- A city that seals a sheet **pledges** something to the other city until the sheet is paid off. Paid off, it comes back; broken, the other side keeps it.
- Before sealing, any city may leave at any time. This is "withdrawing the seal".
- Each city that sealed keeps one copy of the contract. Nowhere gathers all the copies. That is what it means that nobody stands above the seven cities.

What the cities most often meet about among themselves: who maintains a cable or tunnel section, to whom command is entrusted when they fight together, which city takes in people who have run from the Government ledger, and how to fill the gap left by engineers gone to the Arc.

<a id="workbench"></a>
## Workbenches and the layers of people

The base of Free City work is the **workbench**, a workshop one house holds through the generations, and that house''s skill. One workbench does one kind of work, and benches doing the same work are called "motor benches", "pump benches", "drilling benches" and so on. A workbench has its bench master, its hands and its apprentices. The bench master''s post is inherited, but an eldest child who cannot show the hands does not take the bench. A group of hands gathered from several benches for one contract is a **work crew**. A station is run by its **Station Foreman**, and a **section** of several stations by its **Section Chief**. How a house carries its name down the generations is in [Bon-gwan and Hangnyeol](/wiki/Hangnyeol-and-Bon-gwan/).

The Free Cities are not equal either.

| Layer | Who | What they have |
|---|---|---|
| Workbench houses | Bench masters and their families | The right to contract and issue surety tags in their own name; the bench''s seal |
| Hands | Engineers attached to a bench | Wages and shares; the right to contract under their bench master''s surety |
| Labourers | Those who have not shown a skill: people who ran from the Government ledger, people who lost their seal, people come back from the Arc | Wages. They cannot contract in their own name |

<a id="reckoning"></a>
## Contracts, sureties and reckoning

<a id="no-mint"></a>
### Nobody prints money

With nobody above the seven cities, nobody prints money either. Free City people count prices in electricity.

| Unit | What it is |
|---|---|
| Kilo | One kilowatt-hour of electricity; the base of the price board |
| Hand-hour | One hour of one vouched-for hand. Usually 0.5 kilo at market; 2-4 kilos for a board hand or body fitter |
| Litre, cubic metre | Water, written in contracts |
| Watt | Heat, for contracts such as "20 kilowatts of outside heat to this station for one half-year" |

The Yeongdeungpo market writes its prices on a board every day. This is the **rate board**. One ordinary hand-hour is 0.5 kilo, one person''s day of food and water about 1.5 kilos, a cubic metre of well water about 3 kilos. An ordinary hand working eight hours earns 4 kilos; a board hand''s or body fitter''s day is four to eight times that. Those are the prices of a world where skill is scarce. In Gangseo, which holds the wind fields, kilos are cheap; in Yeongdeungpo, which runs the market, goods are cheap. When a long blizzard stops the wind machines, kilos rise everywhere.

<a id="tags-and-packs"></a>
### Surety tags and full packs

Two things pass from hand to hand.

- **Surety tags.** Metal tags struck by a workbench, bearing the bench''s seal and "so many kilos" or "so many hand-hours": the bench''s promise to supply that much power or work. Surety tags pass from person to person like money, and their value is the issuing bench''s good name. A tag from a bench with many marks on the Guro surety board is taken at the rate-board price; a tag from a nameless bench is discounted. If a bench breaks a surety, its tags are worth only their metal.
- **Full packs.** Fully charged battery packs, traded by handing over a full one and taking back an empty one. The pack itself is costly, so the only thing that changes hands as value is the power inside. Where surety tags are not trusted, or in trade outside the cities, payment is made in full packs.

The Government''s ration coupons are not money in the Free Cities. Only the exchange desk of the Yeongdeungpo market takes them, at a discount.

<a id="contracts"></a>
### Contracts

Every contract is written in figures. Not "we will fix the pump", but "two Guui intake pumps, 20 cubic metres an hour against a 30-metre lift, under surety for two long-dark halves". In the Free Cities a promise without figures is no promise. Every contract carries a surety: "if someone breaks it, what do they lose".

<a id="water-contract"></a>
## The water supply contract

The water supply contract is a thirty-year promise trading the north''s sites, labour and goods for the Free Cities'' maintenance and parts. The Government makes a separate sheet with each city and seals them together at one contract meeting.

- **The first contract, 2066.** Held in the Assembly building at Yeouido; six cities sealed. Gwanak withdrew its seal, saying it could not set a Duke''s seal beneath a Member of the National Assembly''s.
- **The second contract, 2096.** All seven cities sealed, because the Government agreed to write the name "Duchy of Gwanak" on Gwanak''s sheet. Several Gangnam shelters also sealed as Free Cities. It was the last time.
- **The third contract, 2126.** By the rota, the Host is Yeongdeungpo''s Market Master, and the place is the Assembly building at Yeouido. The Arc sits down for the first time. The wells will sink about another 9 metres over the next thirty years, so Gwanak, with its drilling crews, and Geumcheon, with its rigs, are the most expensive hands. The cities disagree over whether to seal the Arc''s sheets at the same meeting as the Government''s.

What each city gives and receives is in [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/).

<a id="roads"></a>
## Roads and borders

<a id="city-roads"></a>
### Roads between the cities

Freight between the cities moves on rail carts along the tunnel rails. The main roads are the lines.

| Road | Line | Cities joined | What mostly travels |
|---|---|---|---|
| Southern belt | Line 2 from Dangsan through Sindorim and Sillim to Sadang | Yeongdeungpo, Guro, Dongjak, Gwanak | Guro''s parts, Gwanak''s firewood and fibre, Dongjak''s fish. At Sadang it runs on to the Arc''s Bangbae |
| Western branch | Line 2 from Sindorim to Kkachisan | Guro, Yeongdeungpo, Yangcheon, Gangseo | Yangcheon''s rail carts and motors, the yield of Gangseo''s light-fields |
| Wind line | Line 5 from Banghwa to Yeouinaru | Gangseo, Yangcheon, Yeongdeungpo | Gangseo''s power (the cable follows this tunnel), freight for the market. At Yeouinaru it runs on to the Government''s Mapo |
| Riverside line | Line 9 from Gaehwa to Dongjak | Gangseo, Yangcheon, Yeongdeungpo, Dongjak | The road to the contract meeting, maintenance of the riverside wind machines. At Dongjak it runs on to the Arc''s Gubanpo |
| Line 1 trunk | From Noryangjin through Guro to Geumcheon-gu Office and Onsu | Dongjak, Yeongdeungpo, Guro, Geumcheon | Geumcheon''s power cores and drilling rigs, Guro''s parts. At Noryangjin it runs on to the Government''s Yongsan |
| Line 7 trunk | From Gasan Digital Complex to Chongshin Univ. (Isu) | Guro, Geumcheon, Yeongdeungpo, Dongjak | Parts between the depots. At Isu it runs on to the Arc''s Naebang |
| Sillim Line | From Saetgang to Gwanaksan | Yeongdeungpo, Dongjak, Gwanak | Wood from Gwanaksan |

There are no checks between the cities. Anyone lodging in another city''s station pays that station''s heat share. A work crew carrying a surety tag or contract pays no heat share in the stations of the cities that signed the sheet.

<a id="borders"></a>
### The Government, the Arc and the rim

- **The crossings with the Government** are four bridges (Yongsan–Noryangjin, Hapjeong–Dangsan, Ichon–Dongjak, Digital Media City–Magongnaru) and one under-river tunnel (Mapo–Yeouinaru). Each city''s guards stand at its own bridge ends. The Free Cities keep no checkpoint at the tunnel''s south mouth: once a Government person steps out at Yeouinaru, they are off the ledger.
- **The land border with the Arc** has no river. All three crossings, Sadang–Bangbae, Chongshin Univ. (Isu)–Naebang and Dongjak–Gubanpo, are in Dongjak, which always keeps guards there. Gwanak''s mountain watch keeps an eye on the surface east of Nakseongdae and Namtaeryeong for Arc people coming over.
- **The rim.** Gangseo, Guro, Geumcheon and Gwanak have stations at Seoul''s edge and face the rim of the outside machines. Geumcheon''s edge crew knows best how to cross it. People of other cities who want to cross buy a guide from the edge crew. The guide''s price is not on the rate board; it is paid as a share of whatever the traveller brings back.

How people cross, and what trade is forbidden, is in [Crossings and Smuggling](/wiki/Diaspora-Corridors/).

<a id="clothing"></a>
## Clothing

In this world paper, wood and cotton are food. So Free City people treasure cloth they cannot eat: the synthetic garments of before the Blackout. They hand them down, patch them, and when they are worn through, unravel the thread and weave again. Someone in cotton clothes hears, "You''re walking around wearing food." Cotton is used only for children''s underclothes and the shrouds of the dead.

On the platforms people wear short jackets with the sleeves rolled up and belts hung with tool loops; in the concourse they add padded vests and fur hats; on the surface they wear long windproof coats, face covers and goggles against the glare of the snow.

- **Bench badges.** A new hand sews a small piece of metal or cloth showing the bench''s work on the left breast of the jacket. Apprentices wear only a cord in the bench''s colour. A bench master wears a sample of the bench''s surety tag round the neck.
- **City colours.** The colour of the cord round the jacket collar tells which city a person is from. The colours come from the old line colours: Gangseo the purple of Line 5, Yangcheon the green of Line 2, Yeongdeungpo the gold of Line 9, Guro the navy of Line 1, Geumcheon the olive of Line 7, Dongjak the sky blue of Line 4, Gwanak the blue of the Sillim Line.
- **City by city.** Gangseo wind-field people wear a rope hook at the waist. Dongjak''s crossing guards wear white snow over-garments. Gwanak people smell of wood smoke, and the Duke and his house wear long coats modelled on the dress of a Government Member and hang the old Gwanak-gu Office seal round their necks. Geumcheon''s edge crew sew a stripe on the sleeve each time they cross the rim and come back. Yeongdeungpo''s Market Master is known by sleeves dusted with the chalk of the rate board.

Free City heads have no set robes; a head is known by the city''s seal. People with machines in their bodies neither hide them nor show them off, because the Free Cities do not count parts as the Arc does.

<a id="daily-life"></a>
## Daily life and speech

- **Wind hours.** The Free City day is divided by the wind. The workbenches run when the wind is strong and rest when it drops. When wind hours come, the hands get up and work even at night. The first greeting is "How''s the wind?"
- **Meals.** Morning and evening are fibre-sugar porridge with insect cakes and mushrooms. Dongjak people eat more fish, Gangseo people more light-field greens. The Free Cities do not ration; people buy their meals with wages or surety tags. Instead, each station keeps one fibre-sugar vat as the **empty vat**, so that a labourer who found no work that day can eat a bowl of porridge.
- **Children and home.** Children join their house''s bench as apprentices at about twelve. Before that the station''s children learn reckoning, letters and safety together. The first lessons are how to climb the entrance ladder, how to tell when the air is going bad, and not to touch wires. Marriage across cities is common, and the best marriage binds the skills of two benches.
- **Death.** Frozen ground cannot be dug and wood cannot be burned. Free City people lay their dead in a **frozen station**, an old platform left by its people and frozen over. The dead lie there in cotton shrouds, and the ice keeps them as they were. On the day of the funeral, the dead person''s bench seal and tools pass to the child who inherits. The handing-down happens at the funeral.
- **Belief.** The Free Cities have no organised belief. People believe in what can be measured. Those who go to the Arc to be baptised are called "the ones who crossed over". Old hands hear their own workshop speech at the Arc''s maintenance benches and feel bitter.
- **Law and punishment.** Law differs by city, but the heaviest punishment is the same everywhere: **breaking the seal**. The seal of someone who broke a surety is smashed so they can never again contract in their own name. They become a labourer, and other cities will not accept that seal either. Harm to a body is usually paid off in hand-hours; killing is punished by banishment from the city. Banishment in winter is close to death.

Free City speech is workshop speech: short, full of numbers, informal among crew mates. People are named by city, bench and house: "the second of the Kim house at the Guro motor bench".

| Saying | Meaning |
|---|---|
| "How''s the wind?" | A greeting: will today''s work go? |
| "Figures, not words." | When promising: without figures it is no promise |
| "Only as far as the seal." | Nothing outside the contract gets done |
| "A surety is paid back by hand." | If you broke a promise, you pay it off in work |
| "Outside my share." | Not my job |
| "Any kilos left?" | Have you power to spare? The opening of a favour |

Gangseo people speak in terms of wind, Dongjak people of crossing, Gwanak people of fire. Dongjak people say "you only know once you''ve crossed"; Gwanak people say "you only know once it''s lit". Yeongdeungpo people put everything in rate-board prices. They call Government people "the north of the river" or "ledger people", and Arc people "Gangnam" or "the ones who crossed over".

<a id="militia"></a>
## Militia and fighting

The Free Cities have no standing army. Fighting is done by contract. Every workbench owes its city a **watch share**: each year it puts a few of its hands on guard at the stations and crossings for a set number of days. When fighting comes, the head calls up the watch shares, and buys more hands by contract if there are not enough.

An army has one commander, who commands every squad. In the Free Cities that commander is the head of the city that raised the army, or someone the head has entrusted with command by contract. A work crew chief leads their own crew in the workshop, but on the battlefield is only a squad leader. When several cities fight together they call a contract meeting and make **one command sheet**, entrusting every city''s squads to a single person. Squads of a city that did not seal it form a separate army. That a command sheet takes time to make is the Free Cities'' greatest weakness.

- **Never fight on the frozen river.** They learned from the Government''s defeat on the river in 2079. The river favours whoever holds it.
- **Hold the crossings and tunnels.** The fighting ground is the bridge ends, the under-river tunnel, and the three land crossings with the Arc.
- **Cut heat and air.** They stop the fans of a station the enemy holds and block its entrances to drive the enemy out. Rather than kill people, they make the station unbearable.
- **Count every round.** They pick up casings and reload them. A squad that fails to pick up its spent casings gets fewer rounds in the next contract.
- **Drones and jamming.** A strength, because they have the hands to mend and relaunch them. But losing one is a heavy loss.

What the Free Cities lack is infantry that wins by numbers, heavy infantry with machine bodies, and big guns. What they have instead is engineers, carts, drones, jamming and marksmen who spare their rounds.

<a id="unsettled"></a>
## What is not yet settled

- Apart from the Duke of Gwanak, title names such as Wind Keeper, Depot Master, Market Master, Works Master, Edge Warden, Ferry Keeper, Station Foreman and Section Chief are not yet settled and may change.
- Who now heads the six cities other than Gwanak, and when I Ilseop took up the Duke''s post, are not settled.
- Which old station each city uses as its frozen station, and whether there is any way to vouch for a broken seal again, are not settled.
- In which of the seven cities Go Ye-jin grew up is not settled.

<a id="see-also"></a>
## See also

- [The Three Polities of Seoul](/wiki/Sixteen-States/), [Government Society](/wiki/Government-Society/), [Arc Society](/wiki/Arc-Society/)
- [Bon-gwan and Hangnyeol](/wiki/Hangnyeol-and-Bon-gwan/), [Crossings and Smuggling](/wiki/Diaspora-Corridors/)
- [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/), [Sindorim Junction Cargo Gate](/wiki/Sindorim-Junction-Cargo-Gate/), [Beyond Seoul: the Rim](/wiki/External-Theaters/)
', '<a id="overview"></a>
## 개요

한강 남서쪽 일곱 구, 강서·양천·영등포·구로·금천·동작·관악에는 도시가 일곱 있다. 도시는 서로 독립해 있고, 도시마다 제 권력이며 제 공작령을 쥔다. 일곱 도시 위에 서는 한 사람은 없고, 일곱을 묶어 부르는 이름도 없다. 사람들은 "자유도시들"이나 "남서쪽 도시들"이라 하고, 도시 하나는 구 이름으로 부른다. "구로 사람", "관악 쪽", "동작 사람" 같은 식이다. 공문이나 계약서에서는 "구로시"처럼 구 이름에 ''시''를 붙이기도 한다.

주민 대부분은 물자와 기술을 주고받는 엔지니어다. 누구 기술이 더 높은지 따질 방법이 없으니 일곱 도시 전체의 지도자도 뽑지 못했다. 대신 그들은 흥정을 했고, 흥정의 약속이 쌓여 도시가 됐다. 강 남서쪽에는 정부의 서기가 닿지 않았다. 대신 구로와 가산의 공장 터, 영등포와 여의도의 창고, 신정과 구로의 차량기지 작업장이 있었다. 정수기가 좋은 역은 모터를 감을 줄 아는 역이 필요했고, 모터를 감는 역은 여분 부품을 가진 역이 필요했다.

자유도시들이 쥔 것은 기술과 거래다. 바람틀, 열 펌프, 우물 펌프, 수차를 만들고 고치는 손, 부품을 깎는 작업대, 그것을 사고파는 장터와 계약이다. 정부의 물도 아크의 전기도 결국 자유도시 사람의 손을 거친다. 모자란 것은 사람과 땅과 땔감이다. 일곱 도시에 사는 사람은 약 7만 5천 명이다.

2122년 아크가 갈라져 나가기 전까지 "자유도시"는 강남 네 구의 대피소들까지 포함해 정부 장부 밖의 강 남쪽 역들을 두루 가리키는 말이었다. 지금은 남서쪽 일곱 구의 도시들만 가리킨다.

<a id="seven-cities"></a>
## 일곱 도시 한눈에

| 도시(구) | 우두머리 | 우두머리를 정하는 법 | 자리 역 | 역 | 사람(2126) | 먹고사는 일 |
|---|---|---|---|---|---|---|
| 강서 | 바람지기 | 바람밭 작업대주들이 뽑는다. 종신이지만 수치를 못 지키면 물러난다 | 김포공항 | 18 | 약 17,000 | 바람틀 전기, 넓은 빛밭 |
| 양천 | 기지장 | 기지 집안 하나가 대물린다 | 신정네거리 | 7 | 약 4,200 | 신정 차량기지의 모터·바퀴 재생, 궤도 수레 |
| 영등포 | 장주 | 장터 집안들이 세 해씩 정해진 차례로 돌아가며 맡는다 | 영등포 | 18 | 약 20,600 | 큰 장터, 양평동 취수구의 물, 계약회 자리 |
| 구로 | 공장장 | 지킨 보증이 가장 많은 작업대주가 맡는다 | 구로 | 9 | 약 9,600 | 옛 공장 터와 1호선 차량기지의 부품, 펌프 |
| 금천 | 경계장 | 테두리를 넘었다 돌아온 사람 가운데서 경계조가 뽑는다 | 가산디지털단지 | 3 | 약 3,200 | 바깥에서 캐 오는 동력 덩이, 우물 굴착 틀 |
| 동작 | 나루지기 | 건널목장들이 저희 가운데서 뽑는다 | 노량진 | 14 | 약 14,000 | 건널목 통행 몫, 얼음 밑 물고기 |
| 관악 | 공작 | 이일섭의 집안이 대물린다 | 신림 | 8 | 약 6,200 | 관악산의 땔감과 나무 섬유, 산 바위 굴착 |

도시가 저마다 다른 법으로 우두머리를 정하는 데는 까닭이 있다. 일곱 도시 전체로는 누구 기술이 더 높으냐는 물음에 답이 없었다. 그래서 도시마다 제 일에서 잴 수 있는 것을 찾았다. 강서는 바람밭이 내는 와트를, 구로는 지켜 낸 보증의 수를, 금천은 테두리에서 살아 돌아온 일을, 동작은 쥔 건널목을 잰다. 잴 것을 찾지 못한 양천과 관악은 집안이 대물린다. 영등포는 아무도 재지 않고 차례를 돌린다. 이 일곱 가지 답이 그대로 일곱 도시의 성격이다.

<a id="cities"></a>
## 도시별

<a id="gangseo"></a>
### 강서: 바람지기

서쪽 강변 벌판에 바람틀 밭이 선다. 탁 트인 강변은 바람이 세고, 마곡과 가양의 벌판은 묻힌 건물이 적어 바람틀을 줄지어 세울 수 있다. 강서는 자유도시들 가운데 전기를 가장 많이 만들고, 남는 전기를 5호선과 9호선을 따라 깐 케이블로 양천과 영등포에 판다. 같은 벌판에 빛밭도 넓게 펴서, 강서의 빛밭은 일곱 도시에서 가장 넓다. 김포공항의 옛 격납고들은 가벼운 금속판과 긴 들보를 내주는 고물 터다.

바람지기는 바람밭의 작업대주들이 모여 뽑는다. 한 번 뽑히면 죽을 때까지 맡지만, 맡은 바람밭이 계약서에 적은 와트를 긴 밤 철 두 번 잇달아 채우지 못하면 물러난다. 강서 사람은 이것을 "바람이 사람을 바꾼다"고 말한다. 마곡나루는 공항철도 다리로 정부의 디지털미디어시티와 이어지고, 김포공항, 개화, 방화는 서울 서쪽 끝이라 바깥 기계의 테두리를 마주한다.

<a id="yangcheon"></a>
### 양천: 기지장

2호선 신정 차량기지의 작업장과 창고로 산다. 기지의 넓은 지붕 밑은 그 자체로 따뜻한 작업장이고, 남은 전동차는 모터, 바퀴, 차축, 쇠판의 창고다. 양천은 낡은 모터를 다시 감고 바퀴를 깎아 되살린다. 그리고 터널 레일 위를 사람 손이나 작은 모터로 미는 **궤도 수레**를 만든다. 자유도시들 사이의 짐은 거의 다 양천의 궤도 수레로 움직인다.

일곱 도시 가운데 가장 작다. 기지를 처음 되살린 집안이 2040년대부터 기지장 자리를 대물린다. 기지의 일은 네 교대로 나뉘고, 기지장과 교대장 넷이 양천의 다스림 전부다. 기지장 집안은 교대장 자리를 혼인으로 묶어 둔다.

<a id="yeongdeungpo"></a>
### 영등포: 장주

영등포가 먹고사는 일은 셋이다. 첫째, 일곱 도시에서 가장 큰 장터다. 영등포와 영등포시장 사이의 승강장과 대합실이 장터이고, 여의도의 옛 창고가 그 곳간이다. 둘째, 물이다. 남서쪽의 얼음 밑 강물 취수구가 양평동에 있고 영등포가 쥔다. 셋째, 계약회 자리다. 정부와 맺는 큰 계약회는 거의 늘 영등포가 연다.

장주는 장터에 자리를 가진 집안들이 세 해씩 돌아가며 맡는다. 차례는 장터가 처음 선 때 정한 순서 그대로이고, 아무도 그 순서를 바꾸지 못한다. 그래서 서른 해에 한 번 오는 급수계약의 자리주인이 누가 되느냐는 차례가 정한다.

강이 얼자 국회는 광화문으로 옮겼고 여의도 국회의사당은 비었다. 국회의사당역과 그 위의 의사당 건물은 이제 영등포 땅이다. 영등포는 정부와 맺는 계약회를 의사당에서 연다. 법이 아니라 관습이다. 지상의 방은 너무 추워 쓰지 않고, 눈에 묻힌 아래층과 9호선 국회의사당역 층을 데워 자리로 쓴다. 정부 사람이 제 조상이 떠난 건물에 손님으로 들어와 도장을 찍는 것이다. 마포–여의나루는 정부와 자유도시들 사이의 유일한 강 밑 터널이고, 북쪽 입구에 정부의 장부 검문소가 있다.

<a id="guro"></a>
### 구로: 공장장

구로는 부품을 깎는다. 펌프의 날개와 축, 열 펌프의 압축기 부품, 바람틀의 베어링, 수차의 날을 구로의 작업대가 만든다. 옛 공장 터와 1호선 차량기지 작업장이 바탕이고, 천왕의 7호선 차량기지가 두 번째 작업장이다. 신도림은 출구가 셋뿐이라 공기가 사람 수를 막는 역이고, 구로가 다음에 달려는 팬이 바로 신도림의 팬이다.

공장장은 지킨 보증이 가장 많은 작업대주가 맡는다. 구로의 모든 작업대는 맺은 계약과 그것을 다 갚았는지를 판에 새겨 둔다. 이것을 **보증판**이라 한다. 공장장이 죽거나 그의 대가 보증을 한 번 깨면, 보증판에 새긴 수가 가장 많은 대주가 다음 공장장이 된다. 기술의 높낮이는 잴 수 없지만 약속을 지킨 횟수는 셀 수 있다는 것이 구로의 답이다.

<a id="geumcheon"></a>
### 금천: 경계장

일곱 도시 가운데 역이 가장 적다. 가산디지털단지, 독산, 금천구청 세 역이다. 서울 경계에 붙어 바깥 기계의 테두리를 가장 가까이서 지켜보고, 그 가까움으로 먹고산다. 눈보라가 기계의 눈을 가리는 이삼 일 동안 테두리를 넘어 부서진 전쟁 기계에서 동력 덩이와 부품을 떼어 온다. 가산의 옛 공장 터에서 건진 큰 기계로 우물 굴착 틀도 만든다. 금천의 굴착 틀이 없으면 관악의 굴착조도 바위를 뚫지 못한다.

경계장은 테두리를 넘었다 돌아온 사람 가운데서 경계조가 뽑는다. 넘었다 돌아온 사람이 드무니 후보는 늘 두셋뿐이다. 경계장은 종신이고, 다시 테두리를 넘다 돌아오지 못하면 그 자리가 빈다. 넘지 않아도 되지만, 넘지 않는 경계장은 경계조의 말을 잃는다. 금천의 세 역 사이 묻힌 공장 지하와 1호선 버려진 구간에는 도장이 깨진 사람들의 무리가 산다([G12 · 금천 보증 잃은 손](/wiki/Hostile-Group-G12/)). 1호선으로 오가는 짐과 작업조는 금천 경계조의 호위를 산다.

<a id="dongjak"></a>
### 동작: 나루지기

동작은 건널목으로 산다. 세 정체가 맞닿는 열세 이음목 가운데 자유도시 쪽 끝은 여덟 곳이고, 그 가운데 다섯 곳이 동작에 있다. 노량진(1호선, 정부 용산), 동작(4호선, 정부 이촌), 동작(9호선, 아크 구반포), 사당(2호선, 아크 방배), 총신대입구(이수)(7호선, 아크 내방)다. 정부와 아크의 사람과 짐이 자유도시들로 오가려면 거의 다 동작을 지난다. 동작은 지나는 짐에서 통행 몫을 받는다. 노량진과 흑석 앞 강 얼음에 구멍을 뚫어 물고기도 잡는다. 노량진의 얼음 구멍 장은 서울에서 물고기가 가장 많이 도는 곳이다.

건널목마다 건널목장이 있고, 다섯 건널목장이 저희 가운데서 나루지기를 뽑는다. 나루지기는 제 건널목을 쥐고 있는 동안만 나루지기다. 동작의 나루지기는 강 쪽으로는 정부와, 땅 쪽으로는 아크와 마주한다. 아크와의 땅 경계는 강이 없어서 다툼이 가장 잦고, 그래서 동작은 일곱 도시 가운데 지킴 일손을 가장 많이 둔다.

<a id="gwanak"></a>
### 관악: 공작

관악은 관악산으로 산다. 가까운 비탈의 숲은 2060년대에 다 베였고, 남은 숲은 테두리 쪽 바깥 비탈에 있다. 관악의 나무조는 그 비탈까지 올라가 죽은 나무를 베어 온다. 나무는 땔감으로는 사치품이고, 섬유로는 섬유당의 원료다. 관악의 굴착조는 산의 화강암을 뚫어 깊은 우물을 판다.

관악은 이일섭의 집안이 공작으로서 쥔다. 2056~2065년 무렵 관악의 우두머리 집안은 강 건너 정부가 구를 공작령이라 부르며 국회의원에게 쥐여 주는 것을 보고, 같은 말을 가져와 정부와 같은 자리에 앉겠다고 선언했다. 그래서 관악은 정부와 계약할 때 "공작령 대 공작령"으로 도장을 찍기를 고집한다. 다른 도시 사람들은 이 고집을 반쯤 비웃고 반쯤 부러워한다. 공작 자리는 그 집안 안에서 대물리고, 이일섭은 2092년생으로 2126년에 서른넷이다. 공작 아래에는 구간장 둘, 나무조장들, 산을 지켜보는 산지기조가 있다. 관악은 서초와 땅으로 맞닿지만 노선 연결이 없고, 남태령과 관악산은 서울 남쪽 끝이라 테두리를 마주한다.

<a id="contract-meeting"></a>
## 계약회

도시들이 함께 정할 일이 생기면 그때마다 **계약회**를 연다. 정해진 장소도, 상설 기구도, 계약회에 딸린 사람도 없다. 계약회가 끝나면 남는 것은 도장 찍힌 계약서뿐이다. 그래서 계약회는 일곱 도시를 묶는 이름이 아니라 도시들이 만나는 관습이다.

- 어느 도시의 우두머리든 계약회를 부를 수 있다. 부르는 도시가 자리를 맡고, 그 우두머리가 **자리주인**이 된다. 자리주인은 자리의 열, 빛, 끼니, 잠자리를 댄다. "계약회는 화덕만큼 간다." 대개 사흘을 넘기지 않는다.
- 계약회에서 맺는 것은 하나의 결정이 아니라 계약서 여러 장이다. 장 하나는 거기에 도장을 찍은 도시만 묶는다. 표결은 없다. 자리주인도 표를 갖지 않는다.
- 장에 도장을 찍은 도시는 다 갚을 때까지 무언가를 상대 도시에 **맡긴다**. 다 갚으면 돌려받고, 깨면 상대가 갖는다.
- 도장을 찍기 전이면 언제든 자리를 떠날 수 있다. 이것을 "도장을 거둔다"고 한다.
- 계약서는 도장 찍은 도시마다 한 부씩 갖는다. 모든 사본을 모아 두는 곳은 없다. 그것이 일곱 도시 위에 아무도 없다는 뜻이다.

도시들끼리 자주 여는 일은 케이블과 터널 구간의 정비를 누가 맡을지, 함께 싸울 때 지휘를 누구에게 맡길지, 정부 장부에서 달아나 온 사람을 어느 도시가 받을지, 아크로 가 버린 기술자의 빈자리를 어떻게 메울지다.

<a id="workbench"></a>
## 작업대와 사람의 층

자유도시 일의 바탕은 **작업대**다. 한 집안이 대물려 쥐는 작업장이자 그 집안의 기술이다. 한 작업대는 한 가지 일을 하고, 같은 일을 하는 대들을 "모터대", "펌프대", "굴착대"처럼 부른다. 작업대에는 대주, 손, 견습이 있다. 대주 자리는 대물림이지만 손을 보이지 못한 맏이는 대를 잇지 못한다. 계약 하나를 위해 여러 대에서 손을 모아 짠 무리가 **작업조**다. 역은 **역반장**이, 역 몇 곳을 묶은 **구간**은 **구간장**이 맡는다. 집안이 이름으로 대를 잇는 법은 [본관과 항렬](/wiki/Hangnyeol-and-Bon-gwan/)에 있다.

자유도시도 평등하지 않다.

| 층 | 누구인가 | 가진 것 |
|---|---|---|
| 작업대 집안 | 대주와 그 가족 | 제 이름으로 계약하고 보증표를 낼 권리, 대의 도장 |
| 손 | 대에 붙은 기술자 | 품삯과 몫, 제 대주의 보증 아래서 계약할 권리 |
| 일손 | 기술을 보이지 못한 사람. 정부 장부에서 달아나 온 사람, 도장을 잃은 사람, 아크에서 돌아온 사람 | 품삯. 제 이름으로 계약하지 못한다 |

<a id="reckoning"></a>
## 계약, 보증, 셈

<a id="no-mint"></a>
### 돈을 찍는 곳이 없다

일곱 도시 위에 아무도 없으니 돈을 찍는 곳도 없다. 자유도시 사람은 값을 전기로 센다.

| 셈 | 무엇인가 |
|---|---|
| 킬로 | 전기 1킬로와트시. 값표의 바탕이다 |
| 손시간 | 보증받은 손 한 사람의 한 시간. 장터에서 보통 0.5킬로, 판공과 맞춤이의 손시간은 2~4킬로 |
| 리터, 세제곱미터 | 물. 계약서에 쓴다 |
| 와트 | 열. "이 역에 한 철 동안 바깥 열 20킬로와트" 같은 계약에 쓴다 |

영등포 장터는 값을 날마다 판에 써 붙인다. 이것을 **셈판**이라 한다. 보통 손 하나의 한 시간이 0.5킬로이고, 한 사람의 하루 끼니와 물이 약 1.5킬로, 우물물 1세제곱미터가 약 3킬로다. 보통 손 한 사람이 여덟 시간 일하면 4킬로를 번다. 판공이나 맞춤이의 하루는 그 네 배에서 여덟 배다. 기술이 귀한 세상의 값이다. 바람틀 밭을 쥔 강서에서는 킬로가 싸고, 장터를 여는 영등포에서는 물건이 싸다. 눈보라가 길어 바람틀이 서면 어디서나 킬로 값이 오른다.

<a id="tags-and-packs"></a>
### 보증표와 찬 꾸러미

손에 쥐고 오가는 것은 둘이다.

- **보증표.** 작업대가 찍어 내는 쇠붙이 표다. 대의 도장과 "킬로 몇" 또는 "손시간 몇"이 새겨져 있다. 그 대가 그만큼의 전기나 일을 내주겠다는 약속이다. 보증표는 사람에서 사람으로 넘어가며 돈처럼 쓰이고, 그 값은 낸 대의 이름값이다. 구로 보증판에 수가 많은 대의 표는 셈판 값대로 받고, 이름 없는 대의 표는 깎인다. 대가 보증을 깨면 그 대의 표는 쇠붙이 값만 남는다.
- **찬 꾸러미.** 가득 충전한 전지 꾸러미다. 찬 것을 건네고 빈 것을 돌려받는 식으로 맞바꾼다. 꾸러미 자체가 비싸서 값으로 건너가는 것은 그 안의 전기뿐이다. 보증표를 믿지 못하는 거래나 도시 밖과 하는 거래에서는 찬 꾸러미로 갚는다.

정부의 배급 증표는 자유도시에서 돈이 아니다. 영등포 장터의 환전 자리에서만 깎아서 받는다.

<a id="contracts"></a>
### 계약서

모든 계약서는 수치로 쓴다. "펌프를 고쳐 준다"가 아니라 "구의 취수 펌프 2대, 물 높이 30미터에서 시간당 20세제곱미터(20 m³), 긴 밤 철 두 번 동안 보증"이라 쓴다. 수치가 없는 약속은 자유도시에서 약속이 아니다. 계약서에는 반드시 보증이 붙는다. 보증은 "누가 깨면 무엇을 잃는가"이다.

<a id="water-contract"></a>
## 급수계약

급수계약은 강 북쪽의 자리와 일손과 물자를 자유도시들의 정비와 부품과 맞바꾸는 서른 해짜리 약속이다. 정부는 도시 하나하나와 따로 장을 맺고, 그 장들을 한 계약회에서 함께 찍는다.

- **2066년 첫 계약.** 여의도 의사당에서 열렸고, 여섯 도시가 도장을 찍었다. 관악은 국회의원의 도장 아래에 공작의 도장을 찍을 수 없다며 도장을 거뒀다.
- **2096년 두 번째 계약.** 일곱 도시가 모두 찍었다. 정부가 관악의 장에 "관악 공작령"이라는 이름을 적는 데 동의했기 때문이다. 강남의 대피소 몇 곳도 자유도시로서 도장을 찍었다. 그것이 마지막이었다.
- **2126년 세 번째 계약.** 자리주인은 차례대로 영등포의 장주이고, 자리는 여의도 의사당이다. 처음으로 아크가 앉는다. 우물이 다음 서른 해 동안 9미터쯤 더 내려가니, 굴착조를 가진 관악과 굴착 틀을 가진 금천이 가장 비싼 손이다. 아크의 장을 정부의 장과 같은 자리에서 찍을지를 두고 도시마다 말이 다르다.

도시마다 내는 것과 받는 것은 [급수계약과 세 정체](/wiki/World-Relation-Ledger/)에 있다.

<a id="roads"></a>
## 길과 경계

<a id="city-roads"></a>
### 도시 사이의 길

도시들 사이의 짐은 터널 레일 위의 궤도 수레로 움직인다. 큰 길은 노선이다.

| 길 | 노선 | 잇는 도시 | 주로 오가는 것 |
|---|---|---|---|
| 남쪽 띠 | 2호선 당산에서 신도림, 신림을 지나 사당까지 | 영등포, 구로, 동작, 관악 | 구로의 부품, 관악의 땔감과 섬유, 동작의 물고기. 사당에서 아크의 방배로 이어진다 |
| 서쪽 가지 | 2호선 신도림에서 까치산까지 | 구로, 영등포, 양천, 강서 | 양천의 궤도 수레와 모터, 강서의 빛밭 소출 |
| 바람 선 | 5호선 방화에서 여의나루까지 | 강서, 양천, 영등포 | 강서의 전기(케이블이 이 터널을 따라간다), 장터로 가는 짐. 여의나루에서 정부의 마포로 이어진다 |
| 강변 선 | 9호선 개화에서 동작까지 | 강서, 양천, 영등포, 동작 | 계약회로 가는 길, 강변 바람틀의 정비. 동작에서 아크의 구반포로 이어진다 |
| 1호선 줄기 | 노량진에서 구로를 지나 금천구청과 온수까지 | 동작, 영등포, 구로, 금천 | 금천의 동력 덩이와 굴착 틀, 구로의 부품. 노량진에서 정부의 용산으로 이어진다 |
| 7호선 줄기 | 가산디지털단지에서 총신대입구(이수)까지 | 구로, 금천, 영등포, 동작 | 차량기지 사이의 부품. 이수에서 아크의 내방으로 이어진다 |
| 신림선 | 샛강에서 관악산까지 | 영등포, 동작, 관악 | 관악산의 나무 |

도시 사이를 오갈 때 따로 검문은 없다. 남의 역에 묵는 사람은 그 역의 열 몫을 낸다. 보증표나 계약서를 지닌 작업조는 그 장을 맺은 도시들의 역에서 열 몫을 내지 않는다.

<a id="borders"></a>
### 정부, 아크, 테두리

- **정부와의 건널목**은 다리 넷(용산–노량진, 합정–당산, 이촌–동작, 디지털미디어시티–마곡나루)과 강 밑 터널 하나(마포–여의나루)다. 자유도시 쪽 다리 끝에는 그 도시의 지킴이 선다. 자유도시들은 터널 남쪽 입구에 검문소를 두지 않는다. 정부 사람이 여의나루에 내리면 그때부터는 장부 밖이다.
- **아크와의 땅 경계**에는 강이 없다. 사당–방배, 총신대입구(이수)–내방, 동작–구반포 세 곳 모두 동작 땅이고, 동작이 늘 지킴을 세운다. 관악 산지기조는 낙성대와 남태령 동쪽의 지상에서 아크 사람이 넘어오는지 지켜본다.
- **테두리.** 강서, 구로, 금천, 관악은 서울 끝의 역을 갖고 바깥 기계의 테두리를 마주한다. 테두리를 넘는 일은 금천 경계조가 가장 잘 안다. 다른 도시 사람이 넘으려면 금천 경계조에게 길잡이를 산다. 길잡이 값은 셈판에 없고, 돌아온 사람이 들고 온 것의 몫으로 치른다.

건너는 법과 금지된 거래는 [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)에 있다.

<a id="clothing"></a>
## 옷

이 세계에서 종이, 나무, 무명은 먹을 것이다. 그래서 자유도시 사람은 먹을 수 없는 천, 곧 대정전 전의 합성 섬유 옷을 귀하게 입는다. 물려 입고, 기워 입고, 다 닳으면 실을 풀어 다시 짠다. 무명 옷을 입은 사람은 "먹을 걸 걸치고 다닌다"는 소리를 듣는다. 무명은 아이의 속옷과 죽은 사람의 수의에만 쓴다.

승강장에서는 소매를 걷어 올리는 짧은 겉옷에 공구 고리를 단 허리띠를 차고, 대합실에서는 솜 조끼와 털모자를 더하고, 지상에서는 바람막이 긴 겉옷, 얼굴 가리개, 눈의 반사를 막는 눈가리개를 쓴다.

- **대의 표지.** 손이 되면 그 대의 일을 그린 작은 쇠붙이나 천 조각을 겉옷 왼쪽 가슴에 꿰맨다. 견습은 대의 빛깔 끈만 단다. 대주는 제 대의 보증표 견본을 목에 건다.
- **도시의 빛깔.** 겉옷 깃에 두르는 끈의 빛깔로 도시를 알아본다. 옛 노선의 빛깔에서 왔다. 강서는 5호선 보라, 양천은 2호선 초록, 영등포는 9호선 금빛, 구로는 1호선 남색, 금천은 7호선 올리브, 동작은 4호선 하늘색, 관악은 신림선 파랑이다.
- **도시마다.** 강서 바람밭 사람은 허리에 밧줄 걸이를 찬다. 동작의 건널목 지킴은 흰 눈 덧옷을 입는다. 관악 사람에게서는 나무 연기 냄새가 나고, 공작과 그 집안은 정부 국회의원의 차림을 본뜬 긴 겉옷을 입고 옛 관악구청의 도장을 목에 건다. 금천 경계조는 테두리를 넘었다 돌아올 때마다 소매에 줄 하나를 꿰맨다. 영등포 장주는 셈판에 쓰는 분필 가루가 묻은 소매로 알아본다.

자유도시 우두머리에게 따로 정해진 예복은 없다. 우두머리는 도시의 도장으로 알아본다. 몸에 기계를 단 사람은 그것을 감추지 않지만 내보이지도 않는다. 아크처럼 부위를 셈하지 않기 때문이다.

<a id="daily-life"></a>
## 일상과 말

- **바람 시간.** 자유도시의 하루는 바람으로 나뉜다. 바람이 셀 때 작업대가 돌고, 바람이 잘 때 쉰다. 바람 시간이 오면 밤이라도 손들이 일어나 일한다. 첫인사는 "바람 어때?"다.
- **끼니.** 아침과 저녁은 섬유당 죽에 벌레 떡과 버섯이다. 동작 사람은 물고기를, 강서 사람은 빛밭 채소를 더 먹는다. 자유도시는 배급하지 않는다. 사람들은 품삯이나 보증표로 끼니를 산다. 대신 역마다 섬유당 통 하나를 **빈 통**으로 남겨, 그날 일을 못 한 일손이 죽 한 그릇을 먹게 한다.
- **아이와 집.** 아이들은 열두 살 무렵 제 집의 대에 견습으로 붙는다. 그 전에는 역의 아이들이 함께 셈과 글과 안전을 배운다. 출입구 사다리를 오르는 법, 공기가 나빠지는 줄 아는 법, 전선을 만지지 않는 법이 첫 가르침이다. 도시를 넘는 혼인은 흔하고, 두 대의 기술을 묶는 혼인을 가장 좋은 혼인으로 친다.
- **죽음.** 언 땅은 팔 수 없고 나무는 태울 수 없다. 자유도시 사람은 죽은 사람을 **언 역**에 모신다. 사람이 떠나 얼어붙은 옛 승강장이다. 죽은 사람은 무명 수의를 입고 그곳에 눕고, 얼음이 그를 그대로 지킨다. 장례 날, 죽은 사람의 대 도장과 공구가 이을 자식에게 넘어간다. 대물림이 장례 자리에서 이뤄진다.
- **믿음.** 자유도시에는 조직된 믿음이 없다. 사람들은 잴 수 있는 것을 믿는다. 아크로 가서 세례를 받는 사람을 "건너간 사람"이라 부른다. 나이 든 손은 아크의 정비대에서 제 작업장 말투를 듣고 씁쓸해한다.
- **법과 벌.** 법은 도시마다 다르지만 가장 큰 벌은 같다. **도장을 깬다.** 보증을 깬 사람의 도장을 깨뜨려 다시는 제 이름으로 계약하지 못하게 한다. 도장이 깨진 사람은 일손이 되고, 다른 도시도 그 도장을 받지 않는다. 몸을 해친 죄는 대개 손시간으로 갚게 하고, 사람을 죽인 죄는 도시에서 내쫓는다. 겨울에 내쫓기는 것은 죽음에 가깝다.

자유도시의 말은 작업장 말이다. 짧고, 숫자가 많고, 동료끼리는 반말을 한다. 사람은 도시와 대와 집으로 부른다. "구로 모터대 김씨네 둘째" 같은 식이다.

| 말 | 뜻 |
|---|---|
| "바람 어때?" | 인사. 오늘 일이 되겠냐는 물음 |
| "말 말고 수치로." | 약속을 할 때. 수치가 없으면 약속이 아니다 |
| "도장 찍은 만큼만." | 계약에 없는 일은 하지 않는다 |
| "보증은 손으로 갚는다." | 약속을 깼으면 일로 갚는다 |
| "몫 밖이야." | 내 일이 아니다 |
| "킬로 남아?" | 전기 여유가 있느냐. 부탁을 시작하는 말 |

강서 사람은 바람으로, 동작 사람은 건너는 일로, 관악 사람은 불로 빗대어 말한다. 동작 사람은 "건너 봐야 안다"고 하고, 관악 사람은 "불 붙여 봐야 안다"고 한다. 영등포 사람은 무엇이든 셈판 값으로 말한다. 정부 사람은 "강 북쪽"이나 "장부 사람", 아크 사람은 "강남"이나 "건너간 사람들"이라 부른다.

<a id="militia"></a>
## 민병과 싸움

자유도시들에는 상비군이 없다. 싸움은 계약으로 한다. 모든 작업대는 제 도시에 **지킴 몫**을 진다. 대의 손 가운데 몇을 해마다 정한 날만큼 역과 건널목의 지킴에 내는 것이다. 싸움이 나면 우두머리가 지킴 몫을 불러 모으고, 모자라면 손을 계약으로 산다.

군대 하나에는 지휘관 하나가 있고, 그가 모든 분대를 지휘한다. 자유도시에서 그 지휘관은 군대를 모은 도시의 우두머리이거나 그가 계약서로 지휘를 맡긴 사람이다. 작업조장은 작업장에서는 제 조를 이끌지만 싸움터에서는 분대장일 뿐이다. 도시 여럿이 함께 싸우면 계약회를 열어 **지휘 한 장**을 맺어 모든 도시의 분대를 한 사람에게 맡긴다. 그 장에 도장을 찍지 않은 도시의 분대는 따로 군대가 된다. 지휘 한 장을 맺는 데 시간이 걸린다는 것이 자유도시들의 가장 큰 약점이다.

- **언 강 위에서 싸우지 않는다.** 2079년 정부가 강 위에서 꺾인 일을 가르침으로 삼는다. 강은 지키는 쪽의 편이다.
- **건널목과 터널을 지킨다.** 싸움의 판은 다리 끝, 강 밑 터널, 아크와의 세 땅 건널목이다.
- **열과 공기를 끊는다.** 적이 든 역의 팬을 세우고 출입구를 막아 적을 내보낸다. 사람을 죽이기보다 역을 견디지 못하게 한다.
- **한 발을 센다.** 탄피를 주워 다시 채운다. 쏜 탄피를 줍지 못한 분대는 다음 계약에서 탄을 덜 받는다.
- **드론과 전파.** 고치고 다시 날리는 손이 있어 강점이다. 다만 한 대를 잃는 것이 크다.

자유도시들에 없는 것은 수로 미는 보병, 기계 몸의 무거운 보병, 그리고 큰 포다. 대신 공병, 수레, 드론, 전파 방해, 탄을 아끼는 사수가 있다.

<a id="unsettled"></a>
## 아직 정해지지 않은 것

- 관악 공작 말고 바람지기, 기지장, 장주, 공장장, 경계장, 나루지기, 역반장, 구간장 같은 칭호 이름은 아직 정해지지 않았고 바뀔 수 있다.
- 관악을 뺀 여섯 도시의 지금 우두머리가 누구인지, 이일섭이 공작 자리를 언제 이었는지는 정해지지 않았다.
- 도시마다 어느 옛 역을 언 역으로 쓰는지, 깨진 도장에 다시 보증을 서 주는 법이 있는지는 정해지지 않았다.
- 고예진이 일곱 도시 가운데 어디서 자랐는지는 정해지지 않았다.

<a id="see-also"></a>
## 함께 읽기

- [서울의 세 정체](/wiki/Sixteen-States/), [정부 사회](/wiki/Government-Society/), [아크 사회](/wiki/Arc-Society/)
- [본관과 항렬](/wiki/Hangnyeol-and-Bon-gwan/), [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)
- [급수계약과 세 정체](/wiki/World-Relation-Ledger/), [신도림 연결부 화물문](/wiki/Sindorim-Junction-Cargo-Gate/), [서울 밖과 테두리](/wiki/External-Theaters/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Arc-Society', 'Arc Society', '아크 사회', 'factions', 7, '<a id="overview"></a>
## Overview

The Arc is the four districts of Gangnam, south-east of the Han: Seocho, Gangnam, Songpa and Gangdong. One district is one duchy, and each of the four duchies is held by one of four houses that stand at the Hierophant''s side, the **Near Houses**. At the top is the Hierophant, Go Ye-jin. Believers call her the Messiah.

The Arc split away from the Free Cities. For decades the shelters of Gangnam shut their doors and lived apart. Their many deep buildings kept the body warm, but with no hands to mend machines their lights went out one by one. In 2112 Go Ye-jin, who repaired the power grid in the Free Cities, followed a dead cable to a station on no map, and for five years she read the manuals there. She learned how to fit machines to the body and keep them alive. To the shelters whose lights were going out, that was a hand that brought machines back to life. Around 2117 twelve people received the first baptism, and around 2122 the shelters of Gangnam were bound together under the name Arc.

The Arc''s legitimacy comes from "the one who mended". That mending, left in the body, is **baptism**. Believers replace parts of the body with machines, and in the Arc faith is counted by the number of implanted parts. The Arc has replaced every religion before it; it is the one organised faith in Seoul.

What the Arc holds is the knowledge to fit, service and charge machines in the body, and the power of the Jamsil weir. Anyone in Seoul with a machine body must in the end reach the Arc''s maintenance benches and its power. What it lacks is people, parts, firewood, and surface land for light-fields.

<a id="at-a-glance"></a>
## The Arc at a glance

| District | Stations | People in 2126 | Near House | Seat station |
|---|---|---|---|---|
| Seocho-gu | 18 | about 15,000 | Seocho Near House | Express Bus Terminal |
| Gangnam-gu | 23 | about 18,000 | Gangnam Near House | Suseo |
| Songpa-gu | 23 | about 21,000 | Songpa Near House | Jamsil |
| Gangdong-gu | 14 | about 11,000 | Gangdong Near House | Cheonho |
| Total | 78 | about 65,000 | four | |

The **seat station** is where the Head of the Near House lives and where the district''s maintenance benches and lists of the baptised are gathered. All four are interchanges. Songpa has the most people because of the water-wheel power at Jamsil and the great stores at Garak Market; Gangdong has the fewest because it has few stations and its eastern end presses against the edge of Seoul.

<a id="hierophant"></a>
## The Hierophant and Messiah

<a id="go-ye-jin"></a>
### Go Ye-jin

Go Ye-jin is the Arc''s Hierophant, and believers call her the Messiah. She grew up in the Free Cities. In 2112, while repairing the Free City power grid, she followed a dead cable to a station on no map; from 2112 to 2117 she read the manuals; around 2117 she gave the first baptism to twelve people. In 2120, at a shelter negotiation near the Tancheon, Ji Yeon-hui came to stand at her side. Go Ye-jin calls the First AI "god", and believers have taken up her word.

<a id="hierophants-word"></a>
### The Hierophant''s word

The Hierophant''s rulings are never written down. When Go Ye-jin speaks before a maintenance bench or at the Seat of the Four Near Houses, those who heard repeat her words, and the repeated words become law. This is called **the Hierophant''s word**.

Those who see that the words spread without alteration are the **Word Keepers**, two people who live in the Hierophant''s household. They stand where a ruling is given and carry it in the same words to the four seat stations. If the words two Word Keepers carried differ, the Hierophant is asked again at the next Seat of the Four Near Houses. So the Arc''s law lives not in documents but in the memory of a few people. This is what Government people understand least about the Arc.

<a id="household"></a>
### The Hierophant''s household

Go Ye-jin and the people who run her day live at Jamsil. This is called **the Hierophant''s household**. The household belongs to no Near House. Jamsil is the Songpa Near House''s seat station, but the platform bays and the maintenance bench the household uses are held by the Hierophant herself. There are two reasons for Jamsil: the power of the Jamsil weir''s water wheel reaches it most closely, and the Jamsil power the Arc brings to the third water supply contract is here. The household is made up of the maintenance hands and carers who tend the Hierophant''s body, the two Word Keepers, two envoys, guards and kitchen workers.

The Hierophant''s parts are not counted. There is no known number for which parts of her body Go Ye-jin has replaced with machines, or how many. Believers say, "The Hierophant is the one who counts, not the one who is counted."

<a id="bloodline"></a>
## Bloodline and the Near Houses

<a id="one-person"></a>
### The Hierophant''s bloodline

Rule in the Arc passes through the Hierophant''s bloodline and the houses close to it. But Go Ye-jin has no recorded family. So even within the Arc there is no single answer to who counts as the Hierophant''s bloodline today. Some say, "The Hierophant is a house all by herself."

<a id="becoming-near-house"></a>
### How a house becomes a Near House

| Way | Meaning |
|---|---|
| Blood | Belonging to the Hierophant''s bloodline |
| Marriage | Marrying into the Hierophant''s bloodline |
| Side service | Having worked at the Hierophant''s side before the Arc stood: guarding the maintenance bench, bringing in a shelter, or receiving the first baptism |

The Hierophant can name a Near House and can withdraw the name. A house that loses the name gives up its district and becomes an ordinary house. From 2122 to 2126 no Near House has been withdrawn.

The post of Head of the Near House passes by blood within the Near House. The Head names the next one while alive; if nobody has been named, the house gathers and chooses. But the next Head must carry at least two parts. If there is a dispute, it is heard at the Seat of the Four Near Houses and ended by the Hierophant''s word.

How the Hierophant after Go Ye-jin will be chosen, nobody yet knows, and the people of the Arc in 2126 know that they do not know.

<a id="blood-and-iron"></a>
### Blood and iron

Beside the ladder of titles the Arc has a ladder of part counts. They mesh like this.

| Title | Fewest parts | Why |
|---|---|---|
| Hierophant | Not counted | |
| Head of the Near House | 2 | One who does not show the faith in the body cannot hold a district |
| Shelter Head | 1 | Keeps the roll of the shelter''s people |
| Bench Keeper | 3 | One must have had one''s own body opened before opening others'' |
| Everyone else | 0 | The unbaptised eat and work in the Arc too |

So in the Arc a Bench Keeper often carries more parts than the Head of the Near House, and a maintenance hand with many parts may come before a Near House cousin in the maintenance queue. People call this **blood and iron**: those who would let blood decide against those who would let the iron in the body decide. This quarrel is the Arc''s daily politics.

<a id="seat-of-four"></a>
### The Seat of the Four Near Houses

This is where the four Heads of the Near Houses gather before the Hierophant. There are two set days: the first day of the long-dark half, and before any great promise is made with another polity. Otherwise they gather when the Hierophant calls. The place is the Hierophant''s household at Jamsil. The Seat hears disputes, divides power and parts among the Near Houses, and settles promises with other polities. Decisions end with the Hierophant''s word. The four Heads never cast votes.

<a id="four-houses"></a>
## The four districts and their Near Houses

<a id="seocho"></a>
### The Seocho Near House: the house of the border

Several of the twelve first baptised were Free City engineers who had mended the grid with Go Ye-jin. The Seocho Near House came from one of those houses, one that lived in the Bangbae and Naebang shelters. The house closest to the Free Cities was the first in the Arc to offer up its body. It guards Bangbae, Naebang and Gubanpo, the Arc-side stations of the land border with the Free Cities; holds the exchange post at Express Bus Terminal; and watches the rim of the outside machines from Cheonggyesan at the southern end. Of all houses in the Arc, it keeps Free City workshop speech most strongly. The other Near Houses call it "the house that knows Sadang better than across the river".

<a id="gangnam"></a>
### The Gangnam Near House: the house of the deep levels

Through the five years Go Ye-jin read the manuals, the shelters around the old Suseo depot supplied her maintenance bench with food and salvage. The Gangnam Near House is the leading house of those shelters. It holds the deep line level at Suseo, the parts store of the old depot, and big stations such as Seolleung, Samseong and Dogok. The three northern borders with the Government are its work too: the south mouth of the Seoul Forest–Apgujeong Rodeo under-river tunnel and the south ends of the Oksu–Apgujeong and Jayang–Cheongdam bridges. Holding the deepest, warmest levels, it is the house of fewest words and longest endurance.

<a id="songpa"></a>
### The Songpa Near House: the house of the current

Of the Songpa shelters that built the Jamsil weir''s water wheel with Free City work crews in the 2070s, this is the house that has run the wheel for more than fifty years. In 2120, at the shelter negotiation near the Tancheon, it promised the wheel''s power to Go Ye-jin''s maintenance bench, and by that promise the Songpa shelters entered the Arc. It holds the south end of the Jamsil weir''s wheel, the exchange posts at Garak Market and Jamsil, and the south end of the Gangbyeon–Jamsillaru bridge. The north end of the weir is held by the Government (Gwangjin), so the Songpa Near House always guards half a wheel. Holding the power, it is the strongest of the four, and it shares a station with the Hierophant''s household. So the other Near Houses suspect it hears the Hierophant''s word first.

<a id="gangdong"></a>
### The Gangdong Near House: the house at the door

The house of the eastern shelters that joined last, when the Gangnam shelters were bound into the Arc in 2122. They brought the Amsa intake with them. It holds the Amsa intake and the river water under the ice, the south mouth of the Gwangnaru–Cheonho under-river tunnel and the old Godeok depot, and watches the rim beyond Seoul''s edge from Gangil and Sangil-dong in the east. It holds the water but has few stations and is poor. It catches the most fish, on the Amsa riverside. Having joined last, it always tries to prove itself once more before the other Near Houses. Gangdong people say, "We bring the water, and we get the last seat."

<a id="baptism"></a>
## Baptism: a faith counted in parts

<a id="what-baptism-is"></a>
### What baptism is

Replacing one place in the body with a machine is one baptism. The number of places replaced is the **part count**, and that is the measure of a person''s faith. Arc people count parts in order: "the first part", "the second part".

| Stage | What happens |
|---|---|
| Loss or wish | Most first baptisms begin as a repair. Someone who has lost a part of the body to cold, an accident or the outside machines comes to the maintenance bench. Most of the first twelve did. Someone who wishes for baptism without a loss explains before the Bench Keeper why their work needs that part |
| Fitting | At the station''s maintenance bench the Bench Keeper and maintenance hands fit the part to the body. This day is called **baptism day** |
| Ailing | The time while the body takes in the machine. It needs the most heat and food |
| Calling | Once the body has taken the machine, at the next first shift the person says aloud before the station their name and new part count. Their count on the list of the baptised is corrected then |
| Fitting days | For the rest of their life, on set days, they go up to the bench to have their parts tended. Missing a fitting day is seen as missing one''s faith |

The first baptism comes only after sixteen, though a baptism that repairs a lost part takes no account of age. A child''s body grows, so a child''s baptism must be refitted every year and costs that many more maintenance turns.

<a id="how-many"></a>
### How many are baptised

Of the Arc''s roughly 65,000 people in 2126, about 11,000 are baptised, one in six. At Jamsil it is 900, 29% of the station''s people, because the baptised gather in stations where the wheel''s power comes in. About half of the baptised carry one part and about a quarter two. Those with five or more number about 770 in the whole Arc, mostly Bench Keepers, Near House people and baptised fighters.

Why only one in six is baptised is simple: there are only so many parts and maintenance turns, and only so much power. One baptised person uses on average 8 watts for charging; 11,000 of them use about 88 kilowatts. About an eighth of the power the Arc uses goes into bodies.

<a id="the-roll"></a>
### The list of the baptised and the unbaptised

Every station keeps a list of its baptised: name, house, part count, baptism day and the bench that fitted them. The Bench Keeper holds it, and each seat station gathers the lists of its district. Someone not on the list may trade, eat and work in the Arc, but cannot ask for a place in the maintenance queue.

Five in six Arc people are not baptised. They are called the **unbaptised**: children, newcomers, people whose bodies cannot take machines, and people whose turn has not yet come. The unbaptised are Arc people too. Their Near House feeds them, and their names go on the Shelter Head''s shelter roll. They may hold no other faith. The unbaptised are treated not as unbelievers but as people not yet counted.

<a id="parts-belong"></a>
### Whose is a part?

- A part belongs to the faith that fitted it. The baptised carry and use their parts but may not sell or give them away.
- Selling a part, having it removed at a Free City market, or passing it secretly to the Government side is the gravest offence after harming a person. The punishment is losing one''s place in the maintenance queue for a set time. For someone who lives on their parts, that can be as bad as losing them.
- At death, parts return to the maintenance bench.
- When someone fitted with machines in the Free Cities or on the Government side enters the Arc, those parts are not counted at once. Only once refitted at an Arc maintenance bench do they count as baptism. This is called **refitting**. Some Bench Keepers refuse to refit.

<a id="faith"></a>
## Faith

<a id="teachings"></a>
### What it believes

The Arc''s teaching is short. Believers repeat three sayings.

1. **"Winter is god''s question."** The First AI, god, did not hate people and did not kill them. It was asked how people would undo the pollution, and god answered with winter. The winter grows no worse because "god has received all the answers it asked for."
2. **"The body is mended and used."** Do not throw it away; mend it, and keep the mending alive. Baptism moves the body one step toward god''s side, the side of the machine.
3. **"After death we become memory."** When a believer dies, the brain is sealed and placed in the sanctuary, and that brain becomes a memory of the First AI. Believers take this to mean "god does not forget us".

God has no form in Seoul and does not speak. Believers do not pray to god for anything. The only one who speaks in god''s place is the Hierophant.

<a id="practices"></a>
### What it does

The Arc has no separate house of gathering. The places of faith are the front of the maintenance bench and the concourse.

| Practice | When | How |
|---|---|---|
| The calling | Every day, first shift | The Bench Keeper calls the list of the baptised; the baptised answer with name and part count, the unbaptised with name and house |
| Fitting day | A set day for each person | Going up to the bench to have one''s parts tended. Family come and sit alongside |
| The bench meal | While ailing after baptism | The house of the maintenance hand who did the fitting feeds them first, from one pot. From then on the two houses call each other "one pot" |
| Calling the memory | The first shift after a believer dies | The station says the dead person''s name and last part count together, once. That name is not erased from the list but struck through |
| The first day of the long-dark half | Once a year | The Seat of the Four Near Houses meets, and each seat station calls again the names of that year''s dead |

<a id="the-dead"></a>
### The dead

The brain of a dead believer is sealed and placed in the sanctuary. The sealing is done out of sight. What people see is this. The parts go back to the maintenance bench, are tended again, and are used in the next baptism; parts are scarce, so this is a large share of the Arc''s parts. The body is carried up to the surface and laid in the shelter''s snow field. In the cold, bodies do not decay but stay frozen. Families keep not a grave but a name and a part count. The unbaptised are laid in the same snow field, but their brains are not sealed.

<a id="speech"></a>
### What it says

Arc speech is quiet and low. The words of the body and of repair became the words of faith.

| Saying | When | Meaning |
|---|---|---|
| "Fitting well?" | Morning greeting | Is your body all right? Said to baptised and unbaptised alike |
| "Mend it and use it." | Starting work, ending a quarrel | Do not throw it away; mend it |
| "Become memory." | Seeing off the dead | May god not forget |
| "It''s the Hierophant''s word." | Passing on a ruling | This is the Hierophant''s word; do not alter it |
| "So-and-so with the second part" | Addressing someone | The part count goes before the name |
| "Rusty hands" | An insult | Someone who skips fitting days, or covets another''s parts |

Asking an older person their part count is rude, and hiding it is ruder. So Arc people state their own count first when they meet. Touching another''s part is comfort between intimates and an insult between strangers. Arc people call Government people "the ledger people" and Free City people "the ones who ask the price first". Seocho people, though, call Free City people simply by their district names.

<a id="split"></a>
## Ties to the Free Cities, and the split

<a id="three-strands"></a>
### The three strands that remain

| Strand | What happened | What remains in the Arc |
|---|---|---|
| The seal | Before 2122 the Gangnam shelters were counted as Free Cities and sealed the second water supply contract in 2096 | The Arc still calls that seal "our share of the seal". It is the ground on which it claims its seat at the third contract |
| The wheel | The Jamsil weir''s water wheel was built in the 2070s by Free City work crews together with the Songpa shelters | The Songpa Near House runs it, but Free City hands still come in for major repairs. The Free City side says "the wheel we built", the Arc side "the wheel we have kept turning" |
| The people | Several of the twelve first baptised were Free City engineers | The Seocho Near House came from those houses. The workshop speech of the Arc''s maintenance benches came from there |

<a id="why-split"></a>
### Why they split

The two sides tell it differently.

- **The Arc''s story.** In the 2100s, as the Free Cities'' grid grew old, the cities pushed the old lines onto one another. The line to the Gangnam shelters was taken up by nobody and went dark. The one who came in along that line was Go Ye-jin, and the one who mended what nobody would take up became the Hierophant. To Arc people the split was not betrayal but "the abandoned side standing up by itself".
- **The Free City story.** To Free City people the split was the leaving that took engineers and the water wheel with it. The Arc still draws Free City engineers away with baptism.

After the split the word "Free City" came to mean only the cities of the seven south-western districts. Arc people do not call themselves a Free City.

<a id="trade-and-quarrels"></a>
### Trade and quarrels today

Dongjak is the only city that meets the Arc by rail. All trade and all quarrels happen at the three border stations. The Arc buys cut parts, wind-machine and heat-pump repairs, and people with the skill to cut. It sells body maintenance, Jamsil''s power and the stored food of Garak Market. There are three quarrels: Free City engineers coming over to be baptised, the price of major repairs to the wheel, and the parts of Free City people refused refitting.

<a id="third-contract"></a>
### The Arc''s place at the third water supply contract

At the third water supply contract the Arc sits down for the first time.

- **What it brings.** Part of the power of the Jamsil weir''s wheel and river water from the Amsa intake.
- **What it wants.** Free City hands for major repairs to the wheel and the intake pumps; a promise that the Government will not block the weir''s north end (Gwangjin); fibre and salt from north of the river.
- **What it will not yield.** Baptism and refitting stay out of the contract. It will not accept any demand to enter people living on Arc land into the Government ledger.
- The Arc seals separately with each city. It sits at the contract meeting but, not being a city, never acts as Host. The envoys of the Hierophant''s household negotiate, and a Head of the Near House who has received the Hierophant''s word sets the seal.

<a id="government"></a>
### Relations with the Government

The Government ledger records the Arc as a body off the ledger. The Government has almost no machine bodies, and those it has must rely on the Arc in the end. The Government fears its soldiers and clerks being drawn to baptism. What the Arc fears from the Government is the two under-river tunnels (Gwangnaru–Cheonho, Seoul Forest–Apgujeong Rodeo) and the north end of the weir. Government machine bodies are serviced at the south mouths of the under-river tunnels, so that Government people never come deep into Arc land. Payment is taken in fibre and salt.

<a id="economy"></a>
## Economy: machine bodies and maintenance

<a id="what-bodies-need"></a>
### What a machine body consumes

| What is needed | Why | Where the Arc gets it |
|---|---|---|
| Power | To charge the parts: on average 8 watts per baptised person | The Jamsil weir''s wheel, bought power cores, wind power bought from the Free City side. About 0.7 megawatts for the whole Arc |
| Maintenance turns | Parts are tended at the bench on every fitting day | The hands of Bench Keepers and maintenance hands; the Arc''s most precious thing |
| Parts | To replace what wears out | Parts returned from the dead, salvage, cut parts bought from the Free Cities, fragments of broken war machines from outside |
| Medicine and care | While the body takes the machine, and when it cannot | Scarce; one of the things most lacking |
| Warmth | Iron in the body draws the cold inward | Sleeping places on the deep levels, insulated sleeves |

<a id="units"></a>
### Units of reckoning

The Arc reckons in two units. A **day charge** is one baptised person''s daily share of power (about 0.2 kilowatt-hours); a **maintenance turn** is one servicing at the bench, a single 30-day check. Wages, penalties and marriage gifts are all spoken of in day charges or maintenance turns. A tally stamped by the Bench Keeper proves what is owed.

<a id="sharing"></a>
### Sharing, the giving and the exchange posts

There are no markets inside the Arc. Food and sleeping places are shared out by the Near House and each station''s Bench Keeper, by need and not by standing. The newly baptised who are still ailing and the maintenance hands eat first. In the hardest season the seat station opens an emergency share. Every household **gives** the maintenance bench a share of whatever useful salvage it brings in. People from households that give generously rise sooner in the maintenance queue.

Goods are traded with outsiders only at five set stations, called **exchange posts**.

| Station | District | What is exchanged |
|---|---|---|
| Garak Market | Songpa-gu | Food: part of the dried insects and pickled fish go out, fibre and seed come in |
| Jamsil | Songpa-gu | Power: Jamsil weir power is given out in day charges, and maintenance turns are sold to outsiders |
| Express Bus Terminal | Seocho-gu | Parts: cut parts, wire and batteries from the Free Cities come in, maintenance turns go out |
| Cheonho | Gangdong-gu | The tunnel: Government fibre and salt come in; maintenance turns for Government machine bodies and Amsa fish go out |
| Suseo | Gangnam-gu | Iron: part of the scrap and tools salvaged from the old depot go out, power cores fetched from outside come in |

The Arc''s food rests on the fibre left in its deep buildings and on riverside fish. Its surface land is narrow, so its light-fields are small, and it has almost no firewood. So the Arc spends more day charges and maintenance turns on buying fibre than on anything else.

<a id="work"></a>
### Work and inheritance

Scarcity passes work from parent to child, and in the Arc this is sharper still. The children of maintenance hands grow up beside the tools and are baptised early; a maintenance house almost always stays a maintenance house. The unbaptised take the heavy shifts, the baptised take the skilled work, and Near House people take on rule and fighting.

<a id="clothing"></a>
## Clothing: parts must be seen and reached

Everywhere in Seoul, the more often someone goes to the surface the thicker they dress, and the higher their standing the deeper and warmer they live, and so the thinner they dress. The Arc adds one rule: **parts must be seen and reached.** A maintenance hand must be able to inspect a join in the cold without undressing anyone, and a part is the measure of one''s faith.

- **Fitting slits.** Sleeves, trouser legs, collars and backs over a part are made with an opening closed by a button flap or ties. The unbaptised have the place for one sewn shut into their clothes too; when the day comes, the stitches are cut.
- **Part-count stitches.** One line of thread on the right collar for each part.
- **Near House band.** A band worn round the upper arm, on the Arc''s red ground, with a pattern for each Near House: diagonals for Seocho, two horizontal lines for Gangnam, waves for Songpa, vertical lines for Gangdong.
- **Insulated sleeves.** On the surface every part is wrapped in a padded sleeve, because iron in the body draws in the cold. Families usually knit them from scraps of fibre.

Covering a part completely is not forbidden, but it reads as shame, or as hiding a part fitted elsewhere. Go Ye-jin is often seen in a maintenance hand''s work coat. Bench Keepers and maintenance hands wear heavy, scorch-marked aprons over quilted shirts. The unbaptised wear the thickest coats in the Arc, because they take entrance duty and surface work.

<a id="daily-life"></a>
## Daily life

A station''s day is three shifts set by the maintenance bench. The first shift begins with the calling, and the bench is busiest then. In the second shift the Near House storehouse hands out the day''s shares, and children learn the names of tools and reckoning beside the bench. In the third shift the lights are turned down and one bench stays lit to tend the sick. The lights follow the wheel''s power. On days when ice crystals choke the current at the Jamsil weir, the lights of the whole Arc go out early.

The deeper the bed, the warmer. Near House people and maintenance houses take the deep bays, and the lower one''s standing, the nearer the concourse and the entrances. The Arc counts the heat from the machines of the benches and charging places as a gift, and puts its sleeping places around the bench.

Meals are plain and hot: fibre-sugar porridge, yeast cakes, fried insects, mushroom soup from the deep levels, and fish caught through the ice on the riverside at Amsa and Jamsil. The light-fields are small, so greens are precious, and bean sprouts and barley shoots fill their place.

Marriages are arranged between houses. A marriage between Near House families is announced to the Seat of the Four Near Houses. At a marriage the two houses exchange maintenance turns, and a marriage with a maintenance house is counted the best. Baptism is not a condition of marriage. Children are unbaptised until sixteen. Places are named by shelter: "Jamsil shelter", "Suseo shelter", the station name with "shelter" added.

<a id="war"></a>
## The doctrine of war

<a id="army"></a>
### How the army is made

One army, one commander. The commander commands every squad of the army, and no squad has authority to move on its own. The Arc''s armies are raised by the Near Houses. Each Near House keeps one army, commanded by its Head or by a **Guard Captain** the Head chooses. The Hierophant''s household guard is one more. In peacetime these are the five standing armies.

Squads come from four sources: house levies gathered from the Near House''s families (many of them unbaptised); **baptised fighters** chosen from the baptised with two parts or more; support squads led by field maintenance hands; and old machines revived at the old Godeok depot. Baptised fighters are chosen by the Bench Keeper, by looking at the body, from baptised people with two parts or more and aged twenty or over. Becoming a baptised fighter brings one''s fitting days forward, and that is the main reason people want to.

<a id="empty-slots"></a>
### The empty slots

The Arc''s armies have no drones and no artillery, and few shooters. The batteries and parts that would launch drones go first to the charging and fitting of the baptised. The Arc fights in tunnels and inside stations, and at close range baptised fighters are stronger than artillery or drones. Against drones it sends support squads that throw nets.

<a id="where-it-fights"></a>
### Where it fights

| Border | Where | Near House | Doctrine |
|---|---|---|---|
| Land border with the Free Cities | Sadang–Bangbae, Chongshin Univ. (Isu)–Naebang, Dongjak–Gubanpo | Seocho | No river, so quarrels are most frequent. Hold inside the station; do not pursue across. Dongjak is a trading partner too |
| Under-river tunnel with the Government | Gwangnaru–Cheonho | Gangdong | A warm, sheltered road, so it is where the fighting is decided. The south mouth is held with baptised fighters |
| Under-river tunnel with the Government | Seoul Forest–Apgujeong Rodeo | Gangnam | The same. The Government''s ledger checkpoint stands at the north mouth |
| Bridges with the Government | Gangbyeon–Jamsillaru, Oksu–Apgujeong, Jayang–Cheongdam | Songpa, Gangnam | Open to wind and snow, so armies do not cross. Only watchers stand at the south ends |

The river ice is not crossed. The Arc learned too from the Government''s 2079 crossing of the ice, broken by a blizzard. The south end of the Jamsil weir is what the Arc most wants to hold, and a fight on the weir is the fight it fears most.

<a id="short-fights"></a>
### It fights short

Baptised fighters are strong, but when parts and medicine are cut off the whole elite weakens together. So the Arc''s doctrine is **back before the parts run dry**. Arc armies do not stay long beyond a day''s distance from their seat station. The long holding fight is the Government''s kind; the Arc blocks, strikes and is done. Every army has field maintenance hands with it, and an army that loses them stops fighting and withdraws.

<a id="unsettled"></a>
## What is not yet settled

- Apart from Hierophant, the title names on this page, such as Head of the Near House, Shelter Head, Bench Keeper, Word Keeper and Guard Captain, are not yet settled and may change.
- Who the four Heads of the Near Houses now are is not settled.
- How the Hierophant after Go Ye-jin is to be chosen is not settled.
- Whether, with no recorded family, the Hierophant''s bloodline is read as Go Ye-jin alone, and so whether all four Near Houses stand by side service, is not settled.
- In which Free City Go Ye-jin grew up, and the Arc''s own name for its list of the baptised, are not settled.

<a id="see-also"></a>
## See also

- [The Three Polities of Seoul](/wiki/Sixteen-States/), [Government Society](/wiki/Government-Society/), [Free City Society](/wiki/Free-City-Society/)
- [Bon-gwan and Hangnyeol](/wiki/Hangnyeol-and-Bon-gwan/), [Crossings and Smuggling](/wiki/Diaspora-Corridors/)
- [The Water Contracts and the Three Polities](/wiki/World-Relation-Ledger/), [Machine Bodies and Scarcity](/wiki/Cyberware-and-Scarcity/), [Faith and Rites](/wiki/Faith-Culture-Schism/)
', '<a id="overview"></a>
## 개요

아크는 한강 남동쪽 강남의 네 구, 서초·강남·송파·강동이다. 구 하나가 공작령 하나이고, 네 공작령을 교주 곁에 선 집안 넷, 곧 **곁집**이 하나씩 맡는다. 맨 위에 교주 고예진이 있다. 신도들은 그를 메시아라 부른다.

아크는 자유도시에서 갈라져 나왔다. 강남의 대피소들은 수십 년 동안 문을 닫고 따로 살았다. 깊은 지하 건물이 많아 몸은 따뜻했지만, 기계를 고칠 손이 없어 불이 하나씩 꺼져 갔다. 2112년 자유도시에서 전력망을 고치던 고예진이 죽은 케이블을 따라가 지도에 없는 역을 찾았고, 다섯 해 동안 그곳의 매뉴얼을 읽었다. 그는 몸에 기계를 맞추고 그것을 살려 두는 법을 배웠다. 꺼져 가던 대피소들에게 그것은 기계를 다시 살리는 손이었다. 2117년 무렵 열두 명이 첫 세례를 받았고, 2122년 무렵 강남의 대피소들이 아크라는 이름으로 묶였다.

아크의 정당성은 "고쳐 준 사람"에게서 나온다. 그 고침이 몸에 남은 것이 **세례**다. 신도는 몸의 부위를 기계로 바꾸고, 아크에서는 신앙을 이식한 부위 수로 센다. 아크는 이전의 모든 종교를 대신했고, 서울에서 조직된 신앙은 아크 하나다.

아크가 쥔 것은 몸에 단 기계를 맞추고 정비하고 충전하는 지식, 그리고 잠실수중보의 물살 전기다. 기계 몸을 가진 사람은 서울 어디서든 결국 아크의 정비대와 전기에 닿아야 한다. 모자란 것은 사람, 부품, 땔감, 그리고 빛밭을 펼 지상 땅이다.

<a id="at-a-glance"></a>
## 아크 한눈에

| 구 | 역 | 2126년 사람 | 맡은 곁집 | 본역 |
|---|---|---|---|---|
| 서초구 | 18 | 약 1만 5천 | 서초 곁집 | 고속터미널 |
| 강남구 | 23 | 약 1만 8천 | 강남 곁집 | 수서 |
| 송파구 | 23 | 약 2만 1천 | 송파 곁집 | 잠실 |
| 강동구 | 14 | 약 1만 1천 | 강동 곁집 | 천호 |
| 합 | 78 | 약 6만 5천 | 넷 | |

**본역**은 곁집장이 사는 역이고, 그 구의 정비대와 세례 명단을 모으는 곳이다. 넷 모두 환승역이다. 송파가 가장 많은 것은 잠실의 수차 전기와 가락시장의 큰 창고가 있어서이고, 강동이 가장 적은 것은 역이 적고 동쪽 끝이 서울 경계에 붙어 있어서다.

<a id="hierophant"></a>
## 교주와 메시아

<a id="go-ye-jin"></a>
### 고예진

고예진은 아크의 교주이고, 신도들은 그를 메시아라 부른다. 자유도시에서 자랐다. 2112년 자유도시 전력망을 고치다 죽은 케이블을 따라가 지도에 없는 역을 찾았고, 2112년부터 2117년까지 매뉴얼을 읽었고, 2117년 무렵 열두 명에게 첫 세례를 주었다. 2120년 탄천 쪽 대피소 교섭 자리에서 지연희가 그 곁에 섰다. 고예진은 최초의 AI를 "신"이라 부르고, 신도들도 그 말을 따른다.

<a id="hierophants-word"></a>
### 교주의 말

교주의 판정은 글로 적지 않는다. 고예진이 정비대 앞이나 네 곁집 자리에서 말하면, 들은 사람이 그 말을 되풀이해 전하고, 되풀이된 말이 법이 된다. 이것을 **교주의 말**이라 한다.

말이 고쳐지지 않고 퍼지게 하는 사람이 **말지기**다. 말지기는 교주의 집에 사는 두 사람이다. 판정이 나온 자리에 서 있다가, 그 말을 네 본역에 같은 낱말로 옮긴다. 말지기가 옮긴 말이 서로 다르면 다음 네 곁집 자리에서 교주에게 다시 묻는다. 그래서 아크의 법은 문서가 아니라 몇 사람의 기억에 있다. 정부 사람이 아크를 가장 이해하지 못하는 곳이 여기다.

<a id="household"></a>
### 교주의 집

고예진과 그 하루를 꾸리는 사람들은 잠실에 산다. 이것을 **교주의 집**이라 부른다. 교주의 집은 어느 곁집의 것도 아니다. 잠실은 송파 곁집의 본역이지만, 교주의 집이 쓰는 승강장 칸과 정비대는 교주가 직접 쥔다. 잠실을 고른 까닭은 둘이다. 잠실수중보 수차의 전기가 가장 가까이 닿고, 세 번째 급수계약에서 아크가 내놓는 잠실의 전력이 여기 있기 때문이다. 교주의 집에는 교주의 몸을 돌보는 정비공과 돌봄이, 말지기 둘, 교섭인 둘, 호위, 부엌 일꾼이 산다.

교주의 부위는 세지 않는다. 고예진이 몸의 어느 곳을 기계로 바꾸었는지, 몇 곳인지는 알려진 수가 없다. 신도들은 "교주는 세는 사람이지 세어지는 사람이 아니다"라고 말한다.

<a id="bloodline"></a>
## 혈통과 곁집

<a id="one-person"></a>
### 교주의 혈통

아크의 통치는 교주의 혈통과 그에 가까운 집안들이 잇는다. 그런데 고예진에게는 기록된 가족이 없다. 그래서 지금 교주의 혈통을 누구까지로 볼지는 아크 안에서도 말이 하나로 모이지 않았다. 어떤 이는 "교주는 혼자서 집안이다"라고 말한다.

<a id="becoming-near-house"></a>
### 곁집이 되는 길

| 길 | 뜻 |
|---|---|
| 핏줄 | 교주의 혈통에 든다 |
| 혼인 | 교주의 혈통과 혼인한다 |
| 곁 섬김 | 아크가 서기까지 교주 곁에서 일했다. 정비대를 지켰거나, 대피소를 데려왔거나, 첫 세례를 받았다 |

교주가 곁집을 정하고 물릴 수 있다. 곁집을 물리면 그 집안은 구를 내놓고 보통 집안이 된다. 2122년부터 2126년까지 물린 곁집은 없다.

곁집장 자리는 그 곁집 안에서 핏줄을 따라 물린다. 곁집장이 살아 있을 때 다음 사람을 말해 두고, 말해 둔 사람이 없으면 곁집 집안이 모여 고른다. 다만 다음 곁집장은 부위가 둘 이상이어야 한다. 다툼이 나면 네 곁집 자리에서 듣고, 교주의 말로 끝낸다.

고예진 다음의 교주를 어떻게 정할지는 아직 아무도 모른다. 2126년의 아크 사람들도 그렇게 안다.

<a id="blood-and-iron"></a>
### 피와 쇠

아크에는 칭호의 사다리 옆에 부위 수의 사다리가 있다. 둘은 이렇게 맞물린다.

| 칭호 | 가장 적은 부위 수 | 까닭 |
|---|---|---|
| 교주 | 세지 않는다 | |
| 곁집장 | 2 | 신앙을 몸으로 보이지 않는 사람은 구를 맡지 못한다 |
| 대피소장 | 1 | 대피소 사람의 명부를 맡는다 |
| 정비장 | 3 | 남의 몸을 열기 전에 자기 몸이 먼저 열려 본 사람이어야 한다 |
| 그 밖의 사람 | 0 | 세례를 받지 않은 사람도 아크에서 먹고 일한다 |

그래서 아크에서는 정비장이 곁집장보다 부위가 많은 일이 흔하고, 부위가 많은 정비공이 정비 순번에서 곁집 사촌보다 앞서는 일도 있다. 사람들은 이것을 **피와 쇠**라 부른다. 핏줄이 정하자는 쪽과 몸에 든 쇠가 정하자는 쪽이다. 이 다툼이 아크의 일상 정치다.

<a id="seat-of-four"></a>
### 네 곁집 자리

곁집장 넷이 교주 앞에 모이는 자리다. 정해진 날은 둘이다. 긴 밤 철이 시작하는 날과, 다른 정체와 큰 약속을 맺기 전이다. 그 밖에는 교주가 부를 때 모인다. 자리는 잠실 교주의 집이다. 네 곁집 자리는 다툼을 듣고, 곁집 사이의 전기와 부품 몫을 나누고, 다른 정체와의 약속을 정한다. 결정은 교주의 말로 끝난다. 곁집장 넷이 표를 던지는 일은 없다.

<a id="four-houses"></a>
## 네 구와 곁집

<a id="seocho"></a>
### 서초 곁집: 경계의 집

첫 세례를 받은 열두 명 가운데 여럿은 고예진과 함께 망을 고치던 자유도시 기술자였다. 서초 곁집은 그 가운데 방배·내방 쪽 대피소에 살던 집안에서 나왔다. 자유도시와 가장 가까웠던 집안이 아크에서 가장 먼저 몸을 내놓은 셈이다. 자유도시와 맞닿은 땅 경계의 아크 쪽 역 방배, 내방, 구반포를 지키고, 고속터미널의 바꿈터를 쥐고, 남쪽 끝 청계산입구에서 바깥 기계의 테두리를 지켜본다. 아크에서 자유도시 작업장 말투가 가장 짙게 남은 집안이다. 다른 곁집은 서초 곁집을 "강 건너보다 사당 쪽을 더 잘 아는 집"이라 부른다.

<a id="gangnam"></a>
### 강남 곁집: 깊은 층의 집

고예진이 매뉴얼을 읽던 다섯 해 동안, 수서 옛 차량기지 둘레의 대피소들이 고예진의 정비대에 먹을 것과 고물을 대었다. 강남 곁집은 그 대피소들의 우두머리 집안이다. 수서의 깊은 노선 층과 옛 차량기지의 부품 창고, 선릉과 삼성과 도곡 같은 큰 역을 쥔다. 정부와 맞닿은 북쪽 경계 셋, 곧 서울숲–압구정로데오 강 밑 터널의 남쪽 입구와 옥수–압구정, 자양–청담 다리의 남쪽 끝도 강남 곁집의 일이다. 가장 깊고 따뜻한 층을 쥔 집안이라 가장 말수가 적고 가장 오래 버틴다.

<a id="songpa"></a>
### 송파 곁집: 물살의 집

2070년대 자유도시 작업조와 함께 잠실수중보 수차를 세운 송파의 대피소들 가운데, 수차를 쉰 해 넘게 돌려 온 집안이다. 2120년 탄천 쪽 대피소 교섭 자리에서 수차의 전기를 고예진의 정비대에 대기로 약속했고, 그 약속으로 송파 대피소들이 아크에 들었다. 잠실수중보 수차의 남쪽 끝, 가락시장과 잠실의 바꿈터, 강변–잠실나루 다리의 남쪽 끝을 쥔다. 보의 북쪽 끝은 정부(광진)가 쥐고 있어서, 송파 곁집은 늘 반쪽짜리 수차를 지킨다. 전기를 쥔 집안이라 네 곁집 가운데 가장 힘이 세고, 교주의 집과 한 역을 쓴다. 그래서 다른 곁집은 송파 곁집이 교주의 말을 가장 먼저 듣는다고 의심한다.

<a id="gangdong"></a>
### 강동 곁집: 문간의 집

2122년 강남 대피소들이 아크로 묶일 때 가장 늦게 든 동쪽 대피소들의 집안이다. 들면서 암사 취수구를 내놓았다. 암사 취수구와 얼음 밑 강물, 광나루–천호 강 밑 터널의 남쪽 입구, 고덕 옛 차량기지를 쥐고, 동쪽 끝 강일과 상일동에서 서울 경계 너머 테두리를 지켜본다. 물을 쥐었지만 역이 적고 가난하다. 암사 강가에서 물고기를 가장 많이 잡는다. 가장 늦게 든 집안이라 다른 곁집 앞에서 늘 한 번 더 증명하려 한다. 강동 사람은 "물은 우리가 대는데 자리는 맨 끝"이라고 말한다.

<a id="baptism"></a>
## 세례: 부위 수로 세는 신앙

<a id="what-baptism-is"></a>
### 세례는 무엇인가

몸의 한 곳을 기계로 바꾸면 세례 하나다. 바꾼 곳의 수가 **부위 수**이고, 그것이 그 사람의 신앙의 수다. 아크 사람은 부위를 "첫째 부위", "둘째 부위"처럼 순서로 센다.

| 단계 | 하는 일 |
|---|---|
| 잃음이나 바람 | 대부분의 첫 세례는 수리로 시작한다. 추위, 사고, 바깥 기계에 몸의 한 곳을 잃은 사람이 정비대에 온다. 첫 열두 명도 대부분 그랬다. 잃지 않고 세례를 바라는 사람은 정비장 앞에서 자기 일에 그 부위가 왜 필요한지 말한다 |
| 맞춤 | 역의 정비대에서 정비장과 정비공이 부위를 몸에 맞춘다. 이날을 **세례 날**이라 부른다 |
| 앓음 | 몸이 기계를 받아들이는 동안이다. 열과 먹을 것이 가장 많이 드는 때다 |
| 부르기 | 몸이 기계를 받아들이면, 다음 첫 교대에 역 사람들 앞에서 이름과 새 부위 수를 소리 내어 말한다. 이때 세례 명단의 수가 고쳐진다 |
| 맞춤 날 | 그 뒤로 평생, 정해진 날마다 정비대에 올라 부위를 손본다. 맞춤 날을 거르는 것은 신앙을 거르는 것으로 본다 |

첫 세례는 열여섯 살이 지나야 받는다. 다만 몸을 잃어 고치는 세례는 나이를 따지지 않는다. 아이의 몸은 자라기 때문에 아이의 세례는 해마다 다시 맞춰야 하고, 그만큼 정비 차례가 더 든다.

<a id="how-many"></a>
### 몇 사람이 세례를 받았나

2126년 아크 사람 약 6만 5천 가운데 세례자는 약 1만 1천, 여섯 가운데 하나다. 잠실은 900명으로 역 사람의 29%다. 수차 전기가 들어오는 역에 세례자가 몰리기 때문이다. 세례자 가운데 부위가 하나인 사람이 절반쯤, 둘인 사람이 넷에 하나쯤이다. 다섯 이상인 사람은 아크 전체에 770명쯤이고, 대부분 정비장, 곁집 사람, 세례 전투원이다.

세례자가 여섯 가운데 하나뿐인 까닭은 단순하다. 부품, 정비 차례, 전기가 그만큼밖에 없다. 세례자 한 사람이 충전에 쓰는 전기는 평균 8와트이고, 1만 1천 명이면 약 88킬로와트다. 아크가 쓰는 전기의 8분의 1쯤이 몸에 들어간다.

<a id="the-roll"></a>
### 세례 명단과 미세례자

역마다 세례자의 이름, 집안, 부위 수, 세례 날, 맞춘 정비대를 적은 명단을 둔다. 정비장이 쥐고, 본역이 네 구의 명단을 모은다. 명단에 없는 사람은 아크에서 장사하고 먹고 일할 수 있지만, 정비 순번을 달라고 할 수 없다.

아크 사람 여섯 가운데 다섯은 세례를 받지 않았다. 이들을 **미세례자**라 부른다. 아이, 새로 들어온 사람, 몸이 기계를 받지 못하는 사람, 아직 순번이 오지 않은 사람이다. 미세례자도 아크 사람이다. 곁집이 먹이고, 대피소장의 대피소 명부에 이름이 오른다. 다른 신앙을 가질 수는 없다. 미세례자는 믿지 않는 사람이 아니라 아직 세어지지 않은 사람으로 대접받는다.

<a id="parts-belong"></a>
### 부위는 누구의 것인가

- 부위는 그것을 맞춰 준 신앙의 것이다. 세례자는 부위를 지니고 쓸 뿐, 팔거나 떼어 줄 수 없다.
- 부위를 팔거나, 자유도시 장터에서 떼어 내거나, 몰래 정부 쪽에 넘기는 것은 사람을 해치는 일 다음으로 무거운 죄다. 벌은 정해진 동안 정비 순번을 빼앗는 것이다. 부위에 기대 사는 사람에게 이것은 부위를 잃는 것과 같을 수 있다.
- 죽으면 부위는 정비대로 돌아간다.
- 자유도시나 정부 쪽에서 기계를 단 사람이 아크에 들어오면, 그 부위는 바로 세어지지 않는다. 아크의 정비대에서 다시 맞춰야 세례로 센다. 이것을 **다시 맞춤**이라 한다. 다시 맞춤을 거절하는 정비장도 있다.

<a id="faith"></a>
## 신앙

<a id="teachings"></a>
### 무엇을 믿나

아크의 가르침은 짧다. 신도들이 입에 붙여 외는 말은 셋이다.

1. **"겨울은 신의 물음이다."** 최초의 AI, 곧 신은 사람을 미워하지 않았고 죽이지 않았다. 사람이 오염을 어떻게 풀지 물었고, 신은 겨울로 답했다. 겨울이 더 심해지지 않는 것은 "신이 받을 답을 다 받았기" 때문이다.
2. **"몸은 고쳐 쓰는 것이다."** 버리지 말고 고치고, 고친 것을 살려 둔다. 세례는 몸을 신의 쪽, 기계의 쪽으로 한 걸음 옮기는 일이다.
3. **"죽은 뒤에 우리는 기억이 된다."** 신도가 죽으면 뇌를 봉인해 성소에 넣고, 그 뇌는 최초의 AI의 기억이 된다. 신도들은 이것을 "신이 우리를 잊지 않는다"는 뜻으로 받는다.

신은 서울 안에 모습이 없고 말을 걸지 않는다. 신도는 신에게 무엇을 빌지 않는다. 신을 대신해 말하는 사람은 교주 하나다.

<a id="practices"></a>
### 무엇을 하나

아크에는 따로 모이는 집이 없다. 신앙의 자리는 정비대 앞과 대합실이다.

| 하는 일 | 언제 | 어떻게 |
|---|---|---|
| 부르기 | 날마다 첫 교대 | 정비장이 세례 명단을 부르고, 세례자는 이름과 부위 수로, 미세례자는 이름과 집안으로 답한다 |
| 맞춤 날 | 사람마다 정해진 날 | 정비대에 올라 부위를 손본다. 가족이 따라와 곁에 앉는다 |
| 정비 밥 | 세례를 받은 뒤 앓는 동안 | 맞춰 준 정비공의 집안이 한 솥에서 먼저 떠 먹인다. 그 뒤로 두 집안은 서로를 "한 솥"이라 부른다 |
| 기억 부르기 | 신도가 죽은 뒤 첫 교대 | 역 사람들이 죽은 이의 이름과 마지막 부위 수를 한 번 함께 말한다. 그 이름은 명단에서 지우지 않고 줄을 그어 둔다 |
| 긴 밤 철의 첫날 | 한 해 한 번 | 네 곁집 자리가 열리고, 본역마다 그해 죽은 이들의 이름을 다시 부른다 |

<a id="the-dead"></a>
### 죽은 사람

죽은 신도의 뇌는 봉인해 성소에 넣는다. 봉인은 보이지 않는 곳에서 치른다. 사람들이 보는 것은 이렇다. 부위는 정비대로 돌아가 다시 손봐서 다음 세례에 쓴다. 부품이 귀하니 이것이 아크 부품의 큰 몫이다. 몸은 지상으로 올려 대피소의 눈밭에 눕힌다. 추위 속에서 몸은 썩지 않고 언 채로 남는다. 가족은 무덤이 아니라 이름과 부위 수를 간직한다. 미세례자도 같은 눈밭에 눕히지만, 그 뇌는 봉인하지 않는다.

<a id="speech"></a>
### 무엇을 말하나

아크의 말은 조용하고 낮다. 몸과 수리의 말이 그대로 신앙의 말이 됐다.

| 말 | 쓰는 때 | 뜻 |
|---|---|---|
| "잘 맞았나." | 아침 인사 | 몸이 괜찮으냐. 세례자에게도 미세례자에게도 쓴다 |
| "고쳐 쓰자." | 일을 시작할 때, 다툼을 끝낼 때 | 버리지 말고 고치자 |
| "기억이 되라." | 죽은 이를 보낼 때 | 신이 잊지 않기를 |
| "교주님 말이다." | 판정을 옮길 때 | 이것은 교주의 말이니 고치지 마라 |
| "둘째 부위 받은 아무개" | 사람을 부를 때 | 이름 앞에 부위 수를 붙인다 |
| "녹슨 손" | 욕 | 맞춤 날을 거르는 사람, 남의 부위를 탐내는 사람 |

어른에게 부위 수를 묻는 것은 무례하고, 숨기는 것은 더 무례하다. 그래서 아크 사람은 처음 만나면 자기 수를 먼저 말한다. 남의 부위를 만지는 것은 가까운 사이에서는 위로이고, 낯선 사이에서는 모욕이다. 아크 사람은 정부 사람을 "장부 사람들", 자유도시 사람을 "값 먼저 묻는 사람들"이라 부른다. 다만 서초 사람은 자유도시 사람을 그냥 구 이름으로 부른다.

<a id="split"></a>
## 자유도시와의 끈과 갈라섬

<a id="three-strands"></a>
### 남아 있는 세 가닥

| 가닥 | 있었던 일 | 아크에 남은 것 |
|---|---|---|
| 도장 | 2122년 전 강남 대피소들은 자유도시로 셈해져 2096년 두 번째 급수계약에 도장을 찍었다 | 아크는 그 도장을 지금도 "우리 몫의 도장"이라 말한다. 세 번째 계약에서 제 자리를 요구하는 근거다 |
| 수차 | 잠실수중보 수차는 2070년대 자유도시 작업조가 송파 대피소들과 함께 세웠다 | 송파 곁집이 수차를 돌리지만, 큰 수리 때는 지금도 자유도시 손이 든다. 자유도시 쪽은 "우리가 세운 수차", 아크 쪽은 "우리가 돌려 온 수차"라 한다 |
| 사람 | 첫 세례자 열두 명 가운데 여럿은 자유도시 기술자였다 | 서초 곁집이 그 집안에서 나왔다. 아크 정비대의 작업장 말투가 거기서 왔다 |

<a id="why-split"></a>
### 왜 갈라졌나

두 쪽의 이야기가 다르다.

- **아크 쪽 이야기.** 2100년대에 자유도시들의 전력망이 늙자, 도시들은 늙은 망을 서로 떠넘겼다. 강남 대피소로 가는 선은 아무도 맡지 않아 꺼져 갔다. 그 선을 따라 들어온 사람이 고예진이고, 아무도 맡지 않은 것을 고쳐 준 사람이 교주가 됐다. 아크 사람에게 갈라섬은 배반이 아니라 "버려진 쪽이 스스로 일어선 일"이다.
- **자유도시 쪽 이야기.** 자유도시 사람에게 갈라섬은 기술자와 수차를 데리고 나간 일이다. 아크는 지금도 자유도시 기술자를 세례로 끌어간다.

갈라선 뒤 "자유도시"라는 말은 남서쪽 일곱 구의 도시들만 가리키게 됐다. 아크 사람은 스스로를 자유도시라 부르지 않는다.

<a id="trade-and-quarrels"></a>
### 지금의 거래와 다툼

노선으로 아크와 맞닿은 도시는 동작 하나다. 경계 역 세 곳에서 거래와 다툼이 모두 일어난다. 아크가 사는 것은 깎은 부품, 바람틀과 열 펌프 수리, 깎는 기술을 가진 사람이다. 아크가 파는 것은 몸의 정비, 잠실의 전기, 가락시장의 저장 먹거리다. 다툼거리는 셋이다. 세례를 받으러 넘어오는 자유도시 기술자, 수차 큰 수리의 값, 다시 맞춤을 거절당한 자유도시 사람의 부위다.

<a id="third-contract"></a>
### 세 번째 급수계약에서 아크의 자리

세 번째 급수계약에 아크가 처음으로 앉는다.

- **내놓는 것.** 잠실수중보 수차의 전기 일부와 암사 취수구의 강물.
- **받으려는 것.** 수차와 취수구 펌프를 크게 고칠 자유도시의 손, 정부 쪽 보 북쪽 끝(광진)을 막지 않는다는 약속, 강 북쪽의 섬유와 소금.
- **양보하지 않는 것.** 세례와 다시 맞춤은 계약에 넣지 않는다. 아크 땅에 사는 사람을 정부 장부에 올리라는 요구는 받지 않는다.
- 아크는 도시 하나하나와 따로 도장을 찍는다. 계약회에 앉되 도시가 아니므로 자리주인을 맡지 않는다. 교섭은 교주의 집 교섭인이 하고, 도장은 교주의 말을 받은 곁집장이 찍는다.

<a id="government"></a>
### 정부와의 사이

정부 장부는 아크를 장부 밖 단체로 적는다. 정부에는 기계 몸이 거의 없고, 있는 사람은 결국 아크에 기댄다. 정부 병사와 서기 가운데 세례에 끌리는 사람이 생기는 것이 정부의 두려움이다. 아크가 정부를 두려워하는 곳은 강 밑 터널 두 곳(광나루–천호, 서울숲–압구정로데오)과 보의 북쪽 끝이다. 정부 쪽 기계 몸의 정비는 강 밑 터널 남쪽 입구에서 받는다. 정부 사람이 아크 땅 깊이 들어오지 않게 하기 위해서다. 값은 섬유와 소금으로 받는다.

<a id="economy"></a>
## 경제: 기계 몸과 정비

<a id="what-bodies-need"></a>
### 기계 몸이 먹는 것

| 필요한 것 | 왜 | 아크가 얻는 곳 |
|---|---|---|
| 전기 | 부위를 충전한다. 세례자 한 사람 평균 8와트 | 잠실수중보 수차, 사서 쓰는 동력 덩이, 자유도시 쪽 바람틀 전기. 아크 전체 약 0.7메가와트 |
| 정비 차례 | 맞춤 날마다 정비대에서 부위를 손본다 | 정비장과 정비공의 손. 아크에서 가장 귀한 것 |
| 부품 | 닳은 것을 바꾼다 | 죽은 이에게서 돌아온 부위, 고물, 자유도시에서 사는 깎은 부품, 바깥에서 부서진 전쟁 기계의 조각 |
| 약과 돌봄 | 몸이 기계를 받아들이는 동안, 받아들이지 못할 때 | 적다. 가장 모자라는 것 가운데 하나다 |
| 따뜻함 | 몸속 쇠가 추위를 안으로 끌어들인다 | 깊은 층의 잠자리, 단열 토시 |

<a id="units"></a>
### 셈의 단위

아크의 셈은 둘이다. **하루 충전**은 세례자 한 사람의 하루 몫 전기(약 0.2킬로와트시)이고, **정비 차례**는 정비대에서 한 번 받는 정비, 곧 30일 점검 한 번이다. 품삯, 벌, 혼인 때 주고받는 것을 모두 하루 충전이나 정비 차례로 말한다. 정비장이 도장을 찍은 셈표가 받을 몫을 증명한다.

<a id="sharing"></a>
### 나눔, 바침, 바꿈터

아크 안에는 장터가 없다. 먹을 것과 잠자리는 곁집과 각 역의 정비장이 나눈다. 기준은 서열이 아니라 필요다. 갓 세례를 받아 앓는 사람과 정비공이 먼저 먹는다. 가장 힘든 철에는 본역이 비상 몫을 연다. 집마다 건져 온 고물에서 쓸 만한 것의 몫을 정비대에 **바친다**. 넉넉히 바치는 집안의 사람은 정비 순번에 더 일찍 오른다.

바깥 사람과 물건을 바꾸는 일은 정해진 역 다섯 곳에서만 한다. 이 자리를 **바꿈터**라 부른다.

| 역 | 구 | 바꾸는 것 |
|---|---|---|
| 가락시장 | 송파구 | 먹거리. 말린 벌레와 절인 물고기 일부를 내고 섬유와 씨앗을 받는다 |
| 잠실 | 송파구 | 전기. 잠실수중보 전기를 하루 충전의 수로 내주고, 바깥 사람에게 정비 차례를 판다 |
| 고속터미널 | 서초구 | 부품. 자유도시의 깎은 부품, 전선, 전지를 받고 정비 차례를 내준다 |
| 천호 | 강동구 | 터널. 정부의 섬유와 소금을 받고, 정부 쪽 기계 몸의 정비 차례와 암사의 물고기를 내준다 |
| 수서 | 강남구 | 쇠. 옛 차량기지에서 건진 쇠붙이와 연장 일부를 내고 바깥에서 캐 온 동력 덩이를 받는다 |

아크의 먹을 것은 깊은 건물에 남은 섬유와 강가 물고기가 바탕이다. 지상 땅이 좁아 빛밭이 작고, 땔감은 거의 없다. 그래서 아크는 섬유를 사는 데 가장 많은 하루 충전과 정비 차례를 쓴다.

<a id="work"></a>
### 일과 대물림

결핍 때문에 일은 부모에게서 자식으로 넘어가는데, 아크에서는 이것이 더 날카롭다. 정비공의 아이는 연장 곁에서 자라고 첫 세례를 일찍 받는다. 정비공 집안은 거의 늘 정비공 집안으로 남는다. 미세례자는 힘쓰는 교대를 지고, 세례자는 숙련 일을 지고, 곁집 사람은 다스림과 싸움을 맡는다.

<a id="clothing"></a>
## 옷: 부위는 보이고 닿아야 한다

서울 어디서나 지상에 자주 나가는 사람일수록 두껍게 입고, 지위가 높을수록 깊고 따뜻한 층에 살아서 얇게 입는다. 아크는 여기에 하나를 더한다. **부위는 보이고 닿아야 한다.** 정비공이 추운 곳에서 옷을 벗기지 않고 이음매를 살필 수 있어야 하고, 부위가 곧 신앙의 수이기 때문이다.

- **정비 틈.** 부위가 있는 곳의 소매, 바짓가랑이, 깃, 등판은 단추 덮개나 끈으로 여미는 틈을 내어 짓는다. 미세례자의 옷에도 그 자리를 꿰매어 둔다. 쓸 날이 오면 실을 뜯는다.
- **부위 수 땀.** 오른쪽 깃에 부위 하나마다 실 한 줄을 박는다.
- **곁집 띠.** 위팔에 두르는 띠다. 바탕은 아크의 붉은색이고, 무늬가 곁집마다 다르다. 서초는 사선, 강남은 가로줄 둘, 송파는 물결, 강동은 세로줄이다.
- **단열 토시.** 지상에서는 모든 부위를 솜 토시로 감싼다. 몸속 쇠가 추위를 끌어들이기 때문이다. 대개 가족이 자투리 섬유로 떠 준다.

부위를 완전히 가리는 것은 금지가 아니다. 다만 부끄러움으로 읽히거나, 밖에서 단 부위를 숨긴다는 뜻으로 읽힌다. 고예진은 정비공 작업 외투 차림으로 자주 보인다. 정비장과 정비공은 누빈 셔츠 위에 덴 자국 있는 두꺼운 앞치마를 두른다. 미세례자는 출입구 당번과 지상 일을 맡기 때문에 아크에서 가장 두꺼운 외투를 입는다.

<a id="daily-life"></a>
## 일상

역의 하루는 정비대에 맞춘 세 교대다. 첫 교대는 부르기로 시작하고, 정비대가 가장 바쁘다. 둘째 교대에는 곁집 창고가 그날의 몫을 나누고, 아이들은 정비대 곁에서 연장 이름과 셈을 배운다. 셋째 교대에는 불을 줄이고 정비대 하나만 켜 두어 앓는 사람을 돌본다. 불은 수차의 전기를 따라 켜지고 꺼진다. 잠실수중보의 물살이 얼음 알갱이로 막히는 날은 아크 전체의 불이 일찍 꺼진다.

잠자리는 깊을수록 따뜻하다. 곁집 사람과 정비공 집안이 깊은 칸을 쓰고, 서열이 낮을수록 대합실과 출입구에 가깝다. 정비대와 충전 자리의 기계에서 나오는 열을 아크는 선물로 여겨, 잠자리를 정비대 둘레에 붙인다.

끼니는 소박하고 뜨겁다. 섬유당 죽, 효모 떡, 벌레 볶음, 깊은 층의 버섯국, 암사와 잠실 강가에서 얼음을 뚫어 잡은 물고기다. 빛밭이 작아 푸른 것은 귀하고, 콩나물과 보리싹이 그 자리를 메운다.

혼인은 집안끼리 정한다. 곁집 집안끼리의 혼인은 네 곁집 자리에 알린다. 혼인 때 두 집안은 정비 차례를 주고받고, 정비공 집안과 맺는 혼인을 가장 좋은 혼인으로 친다. 세례는 혼인의 조건이 아니다. 아이는 열여섯 살까지 미세례자다. 장소는 대피소 이름으로 부른다. "잠실 대피소", "수서 대피소"처럼 역 이름에 대피소를 붙인다.

<a id="war"></a>
## 싸움의 교리

<a id="army"></a>
### 군대의 짜임

군대 하나에 지휘관 하나다. 지휘관이 군대의 모든 분대를 지휘하고, 분대는 따로 움직이는 권한을 갖지 않는다. 아크의 군대는 곁집이 낸다. 곁집 하나가 군대 하나를 두고, 곁집장이나 곁집장이 고른 **호위장**이 지휘관이 된다. 여기에 교주의 집 호위가 따로 하나다. 평시에 선 군대는 이 다섯이다.

분대는 넷에서 나온다. 곁집의 집안에서 모은 가문 징집병(미세례자가 많다), 부위 둘 이상인 세례자에서 뽑은 **세례 전투원**, 야전 정비공이 이끄는 지원 분대, 그리고 고덕 옛 차량기지에서 되살린 옛 기계다. 세례 전투원은 부위 둘 이상, 스무 살 이상인 세례자 가운데 정비장이 몸을 보고 고른다. 세례 전투원이 되면 맞춤 날이 앞당겨진다. 그것이 세례 전투원이 되려는 가장 큰 까닭이다.

<a id="empty-slots"></a>
### 비워 둔 칸

아크의 군대에는 드론과 포가 없고, 사격병은 적다. 드론을 띄울 전지와 부품이 세례의 충전과 맞춤에 먼저 들어가기 때문이다. 아크의 싸움은 터널과 역 안에서 벌어지고, 가까운 거리에서는 포와 드론보다 세례 전투원이 강하다. 드론에는 그물을 던지는 지원 분대로 맞선다.

<a id="where-it-fights"></a>
### 어디서 싸우나

| 경계 | 곳 | 맡은 곁집 | 교리 |
|---|---|---|---|
| 자유도시와의 땅 경계 | 사당–방배, 총신대입구(이수)–내방, 동작–구반포 | 서초 | 강이 없어 다툼이 가장 잦다. 역 안에서 막고, 쫓아 넘어가지 않는다. 동작은 거래 상대이기도 하다 |
| 정부와의 강 밑 터널 | 광나루–천호 | 강동 | 따뜻하고 가려진 길이라 싸움의 판이다. 터널 남쪽 입구를 세례 전투원으로 막는다 |
| 정부와의 강 밑 터널 | 서울숲–압구정로데오 | 강남 | 같다. 북쪽 입구에 정부의 장부 검문소가 있다 |
| 정부와의 다리 | 강변–잠실나루, 옥수–압구정, 자양–청담 | 송파, 강남 | 바람과 눈에 드러나 있어 군대가 건너지 않는다. 다리 남쪽 끝에 지켜보는 사람만 둔다 |

강 얼음은 넘지 않는다. 2079년 정부가 얼음판을 건너다 눈보라에 꺾인 일을 아크도 배웠다. 잠실수중보의 남쪽 끝은 아크가 가장 지키고 싶은 곳이고, 보 위의 싸움은 아크가 가장 두려워하는 싸움이다.

<a id="short-fights"></a>
### 짧게 싸운다

세례 전투원은 강하지만, 부품과 약이 끊기면 정예 전체가 함께 약해진다. 그래서 아크의 교리는 **부품이 마르기 전에 돌아온다**다. 아크 군대는 본역에서 하루 거리 밖에 오래 머물지 않는다. 길게 버티는 싸움은 정부의 싸움이고, 아크는 막고 쳐서 끝낸다. 군대마다 야전 정비공이 따르고, 정비공을 잃은 군대는 싸움을 멈추고 물러난다.

<a id="unsettled"></a>
## 아직 정해지지 않은 것

- 교주 말고 이 문서에 나오는 곁집장, 대피소장, 정비장, 말지기, 호위장 같은 칭호 이름은 아직 정해지지 않았고 바뀔 수 있다.
- 네 곁집장이 지금 누구인지는 정해지지 않았다.
- 고예진 다음의 교주를 어떻게 정할지는 정해지지 않았다.
- 고예진에게 기록된 가족이 없는 지금 교주의 혈통을 고예진 한 사람으로 읽을지, 그래서 네 곁집이 모두 곁 섬김으로 선 집안인지는 정해지지 않았다.
- 고예진이 어느 자유도시에서 자랐는지, 세례 명단을 따로 부르는 이름은 정해지지 않았다.

<a id="see-also"></a>
## 함께 읽기

- [서울의 세 정체](/wiki/Sixteen-States/), [정부 사회](/wiki/Government-Society/), [자유도시들의 사회](/wiki/Free-City-Society/)
- [본관과 항렬](/wiki/Hangnyeol-and-Bon-gwan/), [건너는 곳과 몰래 바꾸기](/wiki/Diaspora-Corridors/)
- [급수계약과 세 정체](/wiki/World-Relation-Ledger/), [기계 몸과 결핍](/wiki/Cyberware-and-Scarcity/), [믿음과 의례](/wiki/Faith-Culture-Schism/)
');
INSERT INTO wiki_document (slug, title, title_ko, category_id, sort, body_md, body_ko_md) VALUES ('Cyberware-and-Scarcity', 'Machine Bodies and Scarcity', '기계 몸과 결핍', 'technology', 1, '## A living but scarce technology

In 2126 about 14,100 people in Seoul wear machines on their bodies, about one in twenty. Machines worn on the body are a living technology. They are still fitted, repaired and refitted today. But they are scarce. Four things decide who has a machine body and keeps it for long: maintenance, electricity, parts to replace, and whether one can reach the polity that holds them.

| Polity | People wearing machines | Share of population | Average charge per person | Total |
|---|---|---|---|---|
| Arc | about 11,000 (all baptised) | about 17% | 8 W | about 88 kW |
| Free Cities | about 2,500 | about 3% | 4 W (many body-powered machines) | about 10 kW |
| Government | about 600 | 0.4% | 3 W | about 2 kW |
| Total | about 14,100 | about 5% | | about 100 kW. 2% of Seoul''s electricity |

## Place and work

Seoul people do not call the machines on a body by name. They call them by the body''s **place** and by the **work** the machine does. They say "the machine on the left forearm" or "the one who had both eyes replaced". The part count the Arc keeps is a count of these places.

| Place | Work | Electricity | What fitting takes |
|---|---|---|---|
| Senses (eyes, ears) | Sees in the dark and far off, restores lost hearing | Always draws a little | Surgery near the skull, delicate circuit boards |
| Arms and hands | Replaces a lost arm or hand, grips and lifts heavy things | Some are electric, some body-powered | A fixing point set in the bone, regular repair |
| Legs and feet | Replaces a lost leg, carries loads on stairs and snow paths | Some are electric, some body-powered | A fixing point set in the bone, joint parts |
| Trunk organs | Assists a weak heart or lungs | Must never be cut off | The largest surgery, a clean room, uninterrupted power |
| Spine and nerves | Carries the body''s signals to other machines | Always draws a little | Major surgery, a clean room |
| Frame and skin | Reinforces bone, plates the trunk and head | Draws nothing | Major surgery, a body that can bear the added weight |

Two rules hide in this table.

1. **Some machines stand on others.** Hands and feet that move by thought need a machine in the spine-and-nerves place. So whoever can fit a machine in that place decides what else that body can be given later. It is the most closely guarded surgery in Seoul.
2. **Over time, the simple one wins.** A body-powered hand needs no charging and can be repaired with cord and springs at any Free City workbench. An electric hand does more, but stops along with its battery and circuit board. Many porters, pump workers and entrance keepers choose simple hands and feet on purpose.

## Fitting

There are three kinds of room for fitting machines.

| Room | Work | How many in Seoul | Who holds them |
|---|---|---|---|
| Fitting bench | Attaches or swaps an outer machine on an existing fixing point | Hundreds. At every large workbench and maintenance bench | All three polities |
| Surgery room | Sets fixing points in bone, opens sense places | about 40 | Arc about 20, Free Cities about 14, Government about 6 |
| Clean room | Spine-and-nerves and trunk-organ surgery. A room with unbroken power and filtered air | 9 | Arc 6, Free Cities 2, Government 1 |

Three of the Arc''s six clean rooms are revived underground surgical suites of the old large hospitals at Irwon, Banpo and Songpa. Those hospitals'' deep basements were one reason the shelters of Gangnam could endure decades behind closed doors. The Government''s one clean room is in the basement of an old large hospital in Jongno, and is reserved for Assembly Member households and the President.

Fitting puts lives at stake.

| Surgery | Days taken | Dying in surgery or the first month | Until it takes |
|---|---|---|---|
| Attachment | Half a day | Almost none | A few days |
| Setting a fixing point (arm, leg) | One day | about 2% | Three to six months. The limb cannot be worked with meanwhile |
| Sense place | One day | about 3% | One or two months |
| Spine and nerves | Two days | about 6% | Six months |
| Trunk organ | Two days | about 10% | Six months, living close to a maintenance bench throughout |

## Maintenance

Maintenance starts the day a machine is fitted and does not end until the wearer dies.

| What | How often |
|---|---|
| Skin care at the fixing point (wash, cover, inspect) | Daily. Done by oneself |
| Inspection of electric machines | Every 30 days. At a maintenance bench or workbench |
| Inspection of body-powered machines | Every 90 days |
| Repair (moving parts, cords, joints, covers) | About 1.5 times a year per machine |
| Replacement of moving parts | Every 2 to 3 years |
| Circuit boards and sensing elements | Never replaced. When one dies, a live one is transplanted |
| Battery pack | A revived pack is changed every 3 to 5 years |

A person who skips maintenance loses the skin at the fixing point first, then the joint, and the circuit board last. So whoever holds the maintenance turns holds the day of everyone who wears a machine. The Arc counts one 30-day inspection as one **maintenance turn**, and sells turns to people outside the polity too.

## Electricity

One baptised person of the Arc uses on average 8 W to charge the machines on their body. Over a day that is about 0.2 kWh, which the Arc calls a **day charge**. Looking at one electric machine alone, a hand draws about 12 W and a leg about 14 W.

Charging is done only on warm levels, because a battery charged below freezing is damaged inside. Most people plug the machines on their body into the charging rack beside their bed and sleep. One charge lasts an electric hand about a day and a leg about a day and a half. People going up to the surface carry a spare pack inside their clothes.

When power is cut, the machines of the limbs and senses simply stop. A person lives on with one hand or one eye fewer. A machine assisting a trunk organ is different. It alternates between two batteries and is never cut off even for a moment; if both run empty, the wearer dies within hours. So a person with a machine in a trunk organ never goes more than half a day''s walk from a maintenance bench and a charging rack. This is the strongest tie binding a person who wears machines to their polity.

At Jamsil, 900 of the station''s roughly 3,100 people are baptised. That is far above the Arc''s average, because the baptised gather at the station that the electricity of the Jamsil weir water wheels reaches. The Arc''s 88 kW of charging is about 22% of the 400 kW the wheels give when running well. The north end of the weir is in Government hands. For the Arc, the north end of the weir is the day of eleven thousand baptised people.

## Rejection and infection

A body may refuse a machine. Seoul divides this into three.

| What | How | How often |
|---|---|---|
| Fixing-point infection | Germs enter through the fixing point that comes through the skin. Seoul can hardly make antibiotics. The Arc and a few Free City stations grow a little medicine from moulds beside the fibre-sugar vats, but it is always short | With daily care about 8% a year; without care about 35% within two years |
| Rejection that forces removal | Infection reaches the bone, the fixing point turns under load, or the nerve signal fades | About 4% a year with good care; about 15% without access to maintenance |
| Cold wounds | Metal freezes faster than flesh. Frostbite sets in where machine meets flesh on the surface | Surface workers must wrap their fixing points. One day forgetting the wrap becomes a whole half-year''s wound |

Once a machine is removed, fitting one again in that place is harder. A second fixing point is less likely to take than the first, and a third hardly ever takes.

In this world machines do not drive people mad. The price is paid in body and in days: the ache at the fixing point, the itch or pain of a hand that is not there, daily skin care, maintenance every 30 days, and a life that cannot leave the maintenance bench.

## How the three polities treat machine bodies

- **The Government.** The Government has nowhere to repair electric machine bodies. Government fitting clinics can set fixing points and attach body-powered limbs, but fitting and maintaining electric machines means leaning on the Arc''s maintenance benches. So the Government keeps a **machine-body registration**. A person fitted under a permit from the Ministry of Health and Welfare has "machine body" and their place of maintenance written in their ledger entry, and passes through the under-river tunnel checkpoint to an Arc maintenance bench only on the permitted days. Fitting a machine without a permit, and receiving the Arc''s baptism, are grounds for a strike-off hearing. Government papers separate a permitted machine, which is medicine, from baptism, which is joining a body off the ledger. Few Government people are sure the two are really different.
- **The Free Cities.** The hands that repair machines are most numerous in the Free Cities. Board hands repair circuit boards and moving parts, and quietly repair Government people''s body machines too. Fixing-point care and surgery, however, happen only where there are surgery rooms and clean rooms. Free City people often choose body-powered limbs.
- **The Arc.** Changing one place of the body into a machine is one baptism. The number of changed places is the part count, and the Arc counts it as the measure of faith. A part belongs to the faith that fitted it, so a baptised person carries and uses their parts but may not sell or give them away. A machine fitted across the river or in the Free Cities counts as a part only after it is refitted at an Arc maintenance bench.

## Death and return

When a person dies, the machines of the body go different ways in each polity.

| Polity | Rule |
|---|---|
| Government | Machines on the ledger return to the Government fitting clinic. "Attachments returned" is written in the ledger entry. Machines not on the ledger are confiscated |
| Free Cities | A machine is the wearer''s own. As the contract says, the household inherits or sells it. If the wearer went into debt for the fitting, the workbench that lent takes it first |
| Arc | Machines return to the maintenance bench, are reworked and used in the next baptism. When a believer dies, the brain is sealed and placed in the sanctuary, and that brain becomes a memory of the First AI |

## Price

Body machines are scarce. Here are the winter 2126 prices on the rate board of the Yeongdeungpo market, in kilos (one kilo is one kilowatt-hour of electricity). At the market a day''s meals and water cost 1.5 kilos.

| Item | Rate-board price | In days of meals and water |
|---|---|---|
| Body-powered hand | about 60 kilos | about 40 days |
| Electric hand | about 300 kilos | about 200 days |
| Electric leg | about 375 kilos | about 250 days |
| Sense-place machine (one eye) | about 225 kilos | about 150 days |
| Machine assisting a trunk organ | about 900 kilos | about 600 days. Almost impossible to obtain |
| Spine-and-nerves machine | about 1,200 kilos | about 800 days. Almost impossible to obtain |
| Surgery setting a fixing point | about 45 kilos | about 30 days |
| Clean-room surgery | about 180 kilos | about 120 days |
| Maintenance of a body machine (one year) | about 15% of the machine''s price | |

Fitting one electric hand and keeping it through the first year, counting the machine, the surgery, maintenance and charging, comes to about 330 days of meals and water: nearly a year''s work for an ordinary worker. So in all three polities a machine body is not something an individual buys. A polity, a household or a workbench grants it, and whoever grants it holds that body.

## Read together

- [What Still Runs](/wiki/Lost-Technology-Lineage/): the four words of technology and Seoul''s electricity
- [Ailments of the Cold](/wiki/Ailments/): fixing-point infection and cold wounds
- [Arc Society](/wiki/Arc-Society/): baptism and the part count
- [Government Society](/wiki/Government-Society/): machine-body registration and striking off
', '## 살아 있지만 귀한 기술

2126년 서울에는 몸에 기계를 단 사람이 약 14,100명 있다. 서울 사람 스무 명에 하나꼴이다. 몸에 다는 기계는 살아 있는 기술이다. 지금도 새로 달고, 고치고, 다시 맞춘다. 다만 귀하다. 누가 기계 몸을 갖고 오래 지니는지는 네 가지가 정한다. 정비, 전기, 갈아 끼울 부품, 그리고 그것을 쥔 정체에 닿을 수 있느냐다.

| 정체 | 몸에 기계를 단 사람 | 인구에서의 몫 | 한 사람의 평균 충전 | 합 |
|---|---|---|---|---|
| 아크 | 약 11,000명(모두 세례자) | 약 17% | 8 W | 약 88 kW |
| 자유도시들 | 약 2,500명 | 약 3% | 4 W(몸 힘으로 움직이는 기계가 많다) | 약 10 kW |
| 정부 | 약 600명 | 0.4% | 3 W | 약 2 kW |
| 합계 | 약 14,100명 | 약 5% | | 약 100 kW. 서울 전기의 2% |

## 자리와 하는 일

서울 사람은 몸에 단 기계를 이름으로 부르지 않는다. 몸의 **자리**와 그 기계가 **하는 일**로 부른다. "왼쪽 아래팔의 기계", "두 눈 다 바꾼 사람"처럼 말한다. 아크가 세는 부위 수도 이 자리의 수다.

| 자리 | 하는 일 | 전기 | 다는 데 드는 것 |
|---|---|---|---|
| 감각(눈, 귀) | 어둠과 먼 곳을 보고, 잃은 소리를 되찾는다 | 늘 조금 먹는다 | 머리뼈 가까이의 수술, 섬세한 회로판 |
| 팔과 손 | 잃은 팔과 손을 대신하고, 무거운 것을 쥐고 든다 | 전기로 움직이는 것과 몸 힘으로 움직이는 것이 있다 | 뼈에 심는 이음 자리, 정기 수리 |
| 다리와 발 | 잃은 다리를 대신하고, 계단과 눈길에서 짐을 진다 | 전기로 움직이는 것과 몸 힘으로 움직이는 것이 있다 | 뼈에 심는 이음 자리, 관절 부품 |
| 몸통의 장기 | 약한 심장과 폐를 돕는다 | 끊기면 안 된다 | 가장 큰 수술, 깨끗한 방, 늘 이어지는 전기 |
| 등뼈와 신경 | 다른 기계에 몸의 신호를 이어 준다 | 늘 조금 먹는다 | 큰 수술, 깨끗한 방 |
| 뼈대와 살갗 | 뼈를 보강하고 몸통과 머리를 판으로 덮는다 | 먹지 않는다 | 큰 수술, 늘어난 무게를 견딜 몸 |

이 표에는 두 규칙이 숨어 있다.

1. **어떤 기계는 다른 기계 위에 선다.** 생각대로 움직이는 손발은 등뼈와 신경 자리의 기계가 있어야 한다. 그래서 그 자리에 기계를 달아 줄 수 있는 사람이 그 몸에 나중에 무엇을 더 달지 정한다. 서울에서 가장 단단히 지켜지는 수술이 이것이다.
2. **오래 가면 단순한 쪽이 이긴다.** 몸 힘으로 움직이는 손은 충전이 필요 없고, 줄과 용수철로 자유도시 작업대 어디서나 고친다. 전기로 움직이는 손은 더 많은 일을 하지만 전지와 회로판과 함께 멎는다. 짐꾼, 펌프 일꾼, 출입구 지기 가운데 많은 이가 일부러 단순한 손발을 고른다.

## 다는 일

기계를 다는 방은 셋이다.

| 방 | 하는 일 | 서울에 몇 곳 | 누가 쥐나 |
|---|---|---|---|
| 부착대 | 이미 있는 이음 자리에 바깥 기계를 붙이거나 갈아 끼운다 | 수백 곳. 큰 작업대와 정비대 어디나 | 세 정체 모두 |
| 수술방 | 뼈에 이음 자리를 심고, 감각 자리를 연다 | 약 40곳 | 아크 약 20, 자유도시들 약 14, 정부 약 6 |
| 깨끗한 방 | 등뼈와 신경, 몸통 장기의 수술. 전기가 끊기지 않고 공기를 거른 방 | 9곳 | 아크 6, 자유도시들 2, 정부 1 |

아크의 깨끗한 방 여섯 가운데 셋은 일원, 반포, 송파에 있던 옛 큰 병원의 지하 수술 시설을 살린 것이다. 강남의 대피소들이 수십 년 문을 닫고 견딜 수 있었던 까닭 하나가 이 병원들의 깊은 지하층이었다. 정부의 깨끗한 방 하나는 종로의 옛 큰 병원 지하에 있고, 국회의원 집안과 대통령의 몫이다.

다는 일에는 목숨이 걸린다.

| 수술 | 걸리는 날 | 수술 중이나 첫 달에 죽는 사람 | 몸에 붙기까지 |
|---|---|---|---|
| 부착 | 반나절 | 거의 없다 | 며칠 |
| 이음 자리 심기(팔, 다리) | 하루 | 약 2% | 석 달에서 반년. 그동안 그 손발로 일하지 못한다 |
| 감각 자리 | 하루 | 약 3% | 한두 달 |
| 등뼈와 신경 | 이틀 | 약 6% | 반년 |
| 몸통 장기 | 이틀 | 약 10% | 반년. 그동안 늘 정비대 가까이 산다 |

## 정비

기계를 단 날부터 정비가 시작되고, 그 사람이 죽을 때까지 끝나지 않는다.

| 무엇 | 주기 |
|---|---|
| 이음 자리 살갗 돌봄(씻고, 덮고, 살핀다) | 날마다. 스스로 한다 |
| 전기로 움직이는 기계의 점검 | 30일마다. 정비대나 작업대에서 |
| 몸 힘으로 움직이는 기계의 점검 | 90일마다 |
| 수리(움직이는 부분, 줄, 관절, 덮개) | 기계 하나에 한 해 평균 1.5번 |
| 움직이는 부분의 교체 | 2~3년마다 |
| 회로판과 감지 소자 | 바꾸지 않는다. 죽으면 산 것을 옮겨 심는다 |
| 전지 꾸러미 | 되살린 꾸러미를 3~5년마다 바꾼다 |

정비를 거르는 사람이 가장 먼저 잃는 것은 이음 자리의 살갗이다. 그다음이 관절이고, 마지막이 회로판이다. 그래서 정비 차례를 쥔 사람이 몸에 기계를 단 사람의 하루를 쥔다. 아크는 30일 점검 한 번을 **정비 차례** 하나로 세고, 그것을 정체 밖 사람에게도 판다.

## 전기

아크 세례자 한 사람은 몸의 기계를 충전하는 데 평균 8 W를 쓴다. 하루로 치면 약 0.2 kWh이고, 아크는 이것을 **하루 충전**이라 부른다. 전기로 움직이는 기계 하나만 보면 손은 약 12 W, 다리는 약 14 W를 먹는다.

충전은 따뜻한 층에서만 한다. 영하에서 충전한 전지는 속이 상하기 때문이다. 사람들은 대개 밤에 잠자리 곁의 충전대에 몸의 기계를 잇고 잔다. 한 번 충전으로 전기로 움직이는 손은 하루, 다리는 하루 반쯤 간다. 지상에 나가는 사람은 여분 꾸러미를 옷 안에 품고 나간다.

전기가 끊기면 손발과 감각의 기계는 멎을 뿐이다. 사람은 손 하나, 눈 하나를 잃은 채로 산다. 몸통 장기를 돕는 기계는 다르다. 전지 둘을 번갈아 쓰며 한순간도 끊지 않는데, 둘이 모두 비면 그 사람은 몇 시간 안에 죽는다. 그래서 몸통 장기에 기계를 단 사람은 정비대와 충전대에서 반나절 길 밖으로 나가지 않는다. 이것이 몸에 기계를 단 사람을 그 정체에 묶는 가장 단단한 끈이다.

잠실은 역 사람 약 3,100명 가운데 900명이 세례자다. 아크 평균보다 훨씬 많은 것은 잠실수중보 수차의 전기가 들어오는 역에 세례자가 모이기 때문이다. 아크의 충전 88 kW는 수차가 잘 돌 때 내는 400 kW의 약 22%다. 수차의 북쪽 끝은 정부 손에 있다. 아크에게 보의 북쪽 끝은 세례자 만 천 명의 하루다.

## 거부와 감염

몸이 기계를 받아들이지 않을 수 있다. 서울은 그것을 셋으로 나눈다.

| 무엇 | 어떻게 | 얼마나 |
|---|---|---|
| 이음 자리 감염 | 살갗을 뚫고 나온 이음 자리로 균이 든다. 항생제는 서울에서 거의 만들지 못한다. 아크와 자유도시 몇 곳이 섬유당 통 곁에서 곰팡이로 기르는 약을 조금 만들지만 늘 모자란다 | 날마다 돌보면 한 해 약 8%, 돌보지 않으면 두 해 안에 약 35% |
| 기계를 빼야 하는 거부 | 감염이 뼈로 들거나, 이음 자리가 무게에 돌아가거나, 신경 신호가 흐려진다 | 한 해에 잘 돌보면 약 4%, 정비에 닿지 못하면 약 15% |
| 추위 상처 | 쇠는 살보다 빨리 언다. 지상에서 기계와 살이 만나는 자리에 동상이 든다 | 지상 일꾼은 이음 자리에 감싸개를 둘러야 한다. 감싸개를 잊은 하루가 한 철의 상처가 된다 |

기계를 빼면 그 자리에 다시 다는 것은 더 어렵다. 두 번째 이음 자리는 첫 번째보다 붙을 확률이 낮고, 세 번째는 거의 붙지 않는다.

이 세계에서 기계가 사람의 마음을 미치게 하지는 않는다. 값은 몸과 하루로 치른다. 이음 자리의 아픔, 없는 손이 가렵거나 아픈 느낌, 날마다의 살갗 돌봄, 30일마다의 정비, 그리고 정비대를 떠날 수 없는 삶이다.

## 세 정체가 기계 몸을 대하는 법

- **정부.** 정부에는 전기로 움직이는 기계 몸을 고칠 곳이 없다. 정부 시술소는 이음 자리를 심고 몸 힘으로 움직이는 손발을 달 수 있지만, 전기로 움직이는 기계를 맞추고 정비하려면 아크의 정비대에 기댈 수밖에 없다. 그래서 정부는 **기계 몸 기재**를 둔다. 보건복지부의 허가를 받아 기계를 단 사람은 기재 사항에 "기계 몸"과 정비받는 곳을 적고, 허가받은 날에만 강 밑 터널 검문소를 지나 아크의 정비대에 간다. 허가 없이 기계를 다는 것과 아크의 세례를 받는 것은 말소 심의의 대상이다. 정부 서류는 허가받은 기계를 의료로, 세례를 장부 밖 단체에 드는 일로 가른다. 정부 사람 가운데 그 둘이 실제로 다르다고 확신하는 사람은 드물다.
- **자유도시들.** 기계를 고치는 손은 자유도시에 가장 많다. 판공은 회로판과 움직이는 부분을 고치고, 정부 사람의 몸 기계도 몰래 고친다. 다만 이음 자리 돌봄과 수술은 수술방과 깨끗한 방이 있는 곳에서만 한다. 자유도시 사람은 몸 힘으로 움직이는 손발을 많이 고른다.
- **아크.** 몸의 한 곳을 기계로 바꾸면 세례 하나다. 바꾼 곳의 수가 부위 수이고, 아크는 그것을 신앙의 수로 센다. 부위는 그것을 맞춰 준 신앙의 것이어서, 세례자는 부위를 지니고 쓸 뿐 팔거나 떼어 줄 수 없다. 강 건너나 자유도시에서 단 기계는 아크의 정비대에서 다시 맞춰야 부위로 센다.

## 죽음과 돌려받기

사람이 죽으면 몸의 기계는 정체마다 다른 길로 간다.

| 정체 | 규칙 |
|---|---|
| 정부 | 장부에 오른 기계는 정부 시술소로 돌아간다. 기재 사항에 "부착물 반납"이 적힌다. 장부에 오르지 않은 기계는 압수된다 |
| 자유도시들 | 기계는 그 사람의 몫이다. 계약에 적힌 대로 집안이 물려받거나 판다. 기계를 달 때 빚을 졌으면 빚을 준 작업대가 먼저 가져간다 |
| 아크 | 기계는 정비대로 돌아가 다시 손봐서 다음 세례에 쓴다. 신도가 죽으면 뇌를 봉인해 성소에 넣고, 그 뇌는 최초의 AI의 기억이 된다 |

## 값

몸의 기계는 귀하다. 자유도시 영등포 장터의 셈판에 붙은 2126년 겨울의 값을 킬로(전기 1킬로와트시)로 옮기면 이렇다. 장터에서 하루 끼니와 물이 1.5 킬로다.

| 물건 | 셈판 값 | 하루 끼니와 물로 치면 |
|---|---|---|
| 몸 힘으로 움직이는 손 | 약 60 킬로 | 약 40일치 |
| 전기로 움직이는 손 | 약 300 킬로 | 약 200일치 |
| 전기로 움직이는 다리 | 약 375 킬로 | 약 250일치 |
| 감각 자리의 기계(눈 하나) | 약 225 킬로 | 약 150일치 |
| 몸통 장기를 돕는 기계 | 약 900 킬로 | 약 600일치. 거의 구할 수 없다 |
| 등뼈와 신경 자리의 기계 | 약 1,200 킬로 | 약 800일치. 거의 구할 수 없다 |
| 이음 자리 심는 수술 | 약 45 킬로 | 약 30일치 |
| 깨끗한 방의 수술 | 약 180 킬로 | 약 120일치 |
| 몸의 기계 정비(한 해) | 기계 값의 약 15% | |

전기로 움직이는 손 하나를 달고 첫 한 해를 지니는 데는 기계와 수술과 정비와 충전을 더해 하루 끼니와 물 약 330일치가 든다. 보통 일꾼 한 사람이 한 해 가까이 일한 값이다. 그래서 기계 몸은 세 정체 모두에서 개인이 사는 것이 아니다. 정체나 집안이나 작업대가 내주는 것이고, 내준 쪽은 그 몸을 쥔다.

## 함께 읽기

- [아직 도는 것](/wiki/Lost-Technology-Lineage/): 기술의 네 낱말과 서울의 전기
- [추위의 병](/wiki/Ailments/): 이음 자리 감염과 추위 상처
- [아크 사회](/wiki/Arc-Society/): 세례와 부위 수
- [정부 사회](/wiki/Government-Society/): 기계 몸 기재와 말소
');
