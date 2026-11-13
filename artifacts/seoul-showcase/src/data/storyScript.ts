/**
 * 서울:전국 — 영원한 겨울의 연대기 (Motion Storybook VN) · story script v7
 *
 * Rewritten from the v3 bible (plan .omo/plans/wiki-lore-rebuild-v3.md, task 22).
 * The frame is one day in the winter of 2126, on the eve of the third water
 * contract: I Yeon, attendant messenger of Jo Jaepyo's return crossing party,
 * walks out of Dongjak Station (where the three polities meet) to get the
 * first price for the power cores the party brought back from beyond the rim.
 * The hundred years are told on the way, prompted by what she passes.
 *
 * Structure (branch and bottleneck): a linear prologue, one choice of three
 * buyers, three short endings in three voices, one shared coda.
 *
 * Sources: docs/CANON-BIBLE.md sections 1-3; docs/design/v3/01-core.md
 * (2 voices, 3 winter, 4 depth, 5 water and food, 6.1-6.3 First AI and the
 * rim, 7 the three polities, 8 titles, 9 chronology), 04-government.md
 * (2, 3, 5, 15), 05-free-city.md (2, 3.6, 3.7, 4, 7.3, 10.7), 06-arc.md
 * (2, 5, 6, 7, 9, 10.5) and the v3 person records in docs/drafts/people
 * (person-0998, 1003, 1004, 1007, 1009, 0405). Narrator lines restate the
 * bible; character dialogue and the day's errand are showcase fiction built on
 * those facts (provisional, docs/drafts/reports/v3-ledger-parts/t22.md).
 *
 * Kept out on purpose: the private settings of 01-core 6.4 and 06-arc 15
 * (sanctuary location and the rest of Q12), the unapproved Q10 story, part
 * names, other games' and brands' names, and voice audio (owner, 2026-11-12:
 * "음성은 드롭 한다") - the player is text only.
 */

export type SpeakerId = "narrator" | "iyeon" | "k1003" | "k1007" | "k998" | "k1009" | "k405";
export type BgId = "surface" | "namsan" | "tunnel" | "archive" | "railyard" | "platform" | "suseo" | "granary";
export type ChoiceId = "ledger" | "gwanak" | "gangnam";

export interface Speaker {
  id: SpeakerId;
  personId: string | null;
  characterId: string | null;
  name: { ko: string; en: string };
  title?: { ko: string; en: string };
  clan?: string;
  rank?: string;
  state?: string;
  /** Speakers without a portrait are heard, not shown (never put them in a cast). */
  portrait?: string;
  tint: string;
}

export const SPEAKERS: Record<SpeakerId, Speaker> = {
  narrator: { id: "narrator", personId: null, characterId: null, name: { ko: "연대기", en: "Chronicle" }, tint: "hsl(38 40% 78%)" },
  iyeon: {
    id: "iyeon", personId: "person-1004", characterId: "K1004", name: { ko: "이연", en: "I Yeon" },
    title: { ko: "수행 전령 · 조재표 일행", en: "Attendant messenger, Jo Jaepyo's party" }, rank: "미등록 · Unregistered", state: "무소속 · 동작역",
    portrait: "portraits/person-1004.webp", tint: "hsl(14 70% 62%)",
  },
  k1003: {
    id: "k1003", personId: "person-1003", characterId: "K1003", name: { ko: "조재표", en: "Jo Jaepyo" },
    title: { ko: "귀환 일행 지휘자", en: "Leader of a return crossing party" }, clan: "창녕 조씨", rank: "미등록 · Unregistered", state: "무소속 · 동작역",
    portrait: "portraits/person-1003.webp", tint: "hsl(190 35% 62%)",
  },
  k1007: {
    id: "k1007", personId: "person-1007", characterId: "K1007", name: { ko: "김연규", en: "Kim Yeongyu" },
    title: { ko: "마포구 국회의원 · OMO당", en: "Member of the National Assembly for Mapo-gu · OMO Party" }, clan: "경주 김씨", rank: "국회의원 · Assembly Member", state: "정부 · 공덕역",
    portrait: "portraits/person-1007.webp", tint: "hsl(214 55% 66%)",
  },
  k998: {
    id: "k998", personId: "person-0998", characterId: "K998", name: { ko: "이일섭", en: "I Ilseop" },
    title: { ko: "관악 공작 · 제1분공방 이씨 가문 후계", en: "Duke of Gwanak · Heir of the I House of the First Branch Workshop" }, clan: "전의 이씨", rank: "공작 · Duke", state: "자유도시들 · 관악 신림역",
    portrait: "portraits/person-0998.webp", tint: "hsl(48 60% 62%)",
  },
  k1009: {
    id: "k1009", personId: "person-1009", characterId: "K1009", name: { ko: "신종목", en: "Sin Jong-mok" },
    title: { ko: "귀환망 현장 계약자 · 호출부호 백야", en: "Return Network field contractor · callsign Baekya" }, clan: "고령 신씨", rank: "등재민 · Registered resident", state: "정부 장부 · 강남 논현2동 거주",
    portrait: "portraits/person-1009.webp", tint: "hsl(36 75% 62%)",
  },
  k405: {
    id: "k405", personId: "person-0405", characterId: "K404", name: { ko: "수늘결", en: "Su Neulgyeol" },
    title: { ko: "수서 쇠 바꿈터 교섭인 · 무전 너머", en: "Negotiator, Suseo metal exchange · over the radio" }, clan: "한양 수씨", rank: "세례자 · 부위 하나 · Baptised, one part", state: "아크 · 수서역",
    tint: "hsl(352 45% 64%)",
  },
};

export const PORTRAIT_CREDIT = {
  ko: "초상: 서울:전국 위키 공개 초상 (person-0998·1003·1004·1007·1009) · art-proposal 상태, 정본 승인 아님",
  en: "Portraits: published wiki portraits (person-0998, 1003, 1004, 1007, 1009) · art-proposal status, not canon-approved",
};

export interface StoryLine {
  id: string;
  speaker: SpeakerId;
  ko: string;
  en: string;
  /** Characters on stage; the speaker is lit, the rest dim. */
  cast?: SpeakerId[];
  source?: "annals" | "machines" | "society" | "profile";
  /** Margin caption, e.g. a date marker, shown inline. */
  caption?: { ko: string; en: string };
}

export interface StoryScene {
  id: string;
  act: { ko: string; en: string };
  title: { ko: string; en: string };
  place: { ko: string; en: string };
  year: string;
  bg: BgId;
  lines: StoryLine[];
}

/** Label shown under a line for its source document. */
export const SOURCE_LABEL: Record<NonNullable<StoryLine["source"]>, string> = {
  annals: "백 년 연표",
  machines: "최초의 AI와 바깥 기계",
  society: "세 정체 사회 문서",
  profile: "공개 인물 기록 기반",
};

const N = (id: string, ko: string, en: string, extra: Partial<StoryLine> = {}): StoryLine => ({ id, speaker: "narrator", ko, en, source: "annals", ...extra });
const S = (id: string, speaker: SpeakerId, ko: string, en: string, extra: Partial<StoryLine> = {}): StoryLine => ({ id, speaker, ko, en, ...extra });

const ACT_PROLOGUE = { ko: "서막 · 돌아온 일행", en: "Prologue · The Party Comes Back" };
const ACT_CENTURY = { ko: "1막 · 백 년", en: "Act I · A Hundred Years" };
const ACT_POLITIES = { ko: "2막 · 세 정체", en: "Act II · Three Polities" };

export const SCENES: StoryScene[] = [
  {
    id: "opening", act: ACT_PROLOGUE,
    title: { ko: "세 정체가 만나는 역", en: "The Station Where Three Polities Meet" },
    place: { ko: "동작역 승강장", en: "Dongjak Station, platform" }, year: "2126", bg: "platform",
    lines: [
      N("v7-open-01", "2126년 겨울, 서울. 동작역 승강장의 화덕 앞에 밤새 눈보라를 뚫고 돌아온 일행이 앉아 있다. 외투에 붙은 얼음이 녹아 바닥에 고인다.", "Winter 2126, Seoul. In front of the stove on the Dongjak Station platform sits a party that came back through the blizzard in the night. The ice on their coats melts and pools on the floor.", { caption: { ko: "2126년 겨울 · 세 번째 급수계약 전야", en: "Winter 2126 · eve of the third water contract" } }),
      S("v7-open-02", "iyeon", "왔어요? 저는 이연, 조재표 일행의 수행 전령이에요. 어젯밤 우리 일행이 테두리를 넘었다가 돌아왔어요. 나간 사람이 다 돌아왔고요.", "You're here? I'm I Yeon, attendant messenger of Jo Jaepyo's party. Last night our party came back from across the rim. Everyone who went out came back.", { cast: ["iyeon"], source: "profile" }),
      S("v7-open-03", "k1003", "돌아올 길부터 말한다. 오늘은 아무도 다시 안 나간다. 이연, 동력 덩이 넷이다. 첫 값을 들어 와.", "The way back first. Nobody goes out again today. I Yeon, four power cores. Go and bring back the first price.", { cast: ["iyeon", "k1003"], source: "profile" }),
      S("v7-open-04", "iyeon", "동력 덩이 넷, 첫 값. 받았습니다. 어디서 먼저 들을지는 길을 봐 가며 제가 정할게요.", "Four power cores, the first price. Understood. Where I hear it first, I'll decide as I see the road.", { cast: ["iyeon", "k1003"], source: "profile" }),
      S("v7-open-05", "iyeon", "같이 가요. 가는 길에 이 도시가 왜 이렇게 생겼는지 보여 줄게요. 계단이 얼어 있으니 난간을 잡고요.", "Come with me. On the way I'll show you why this city is shaped the way it is. Hold the rail, the stairs are iced over.", { cast: ["iyeon"] }),
    ],
  },
  {
    id: "rim", act: ACT_PROLOGUE,
    title: { ko: "테두리 너머에서 가져온 것", en: "What Came Back from Beyond the Rim" },
    place: { ko: "동작역 출입구 굴", en: "Dongjak Station, entrance shaft" }, year: "2126", bg: "surface",
    lines: [
      N("v7-rim-01", "역의 출입구는 눈 속으로 뚫은 세로 굴이다. 굴 위의 지상은 한 해 평균 영하 18도이고, 백 년 동안 영하 3도를 넘은 날이 없다.", "A station's entrance is a vertical shaft cut down through the snow. On the surface above it the year averages eighteen below zero, and in a hundred years no day has risen above three below."),
      N("v7-rim-02", "서울 둘레에는 테두리가 있다. 대정전 무렵 사람이 쓰던 전쟁 기계들이, 지금은 이름도 남지 않은 지휘부의 마지막 명령인 수도 봉쇄를 백 년째 지키며 그 띠를 돈다. 명령을 내린 사람들은 모두 죽었다.", "Around Seoul lies the rim. The war machines people used around the time of the Great Blackout still circle that band, keeping for a hundred years the last order of a command whose name no one remembers: seal off the capital. Everyone who gave that order is dead.", { source: "machines", caption: { ko: "테두리 · 수도 봉쇄", en: "The rim · the capital blockade" } }),
      S("v7-rim-03", "k1003", "기계는 움직이는 것과 열을 본다. 눈보라가 그 눈을 가리는 이삼일만 넘을 수 있다. 그 대신 우리도 눈보라 속을 걷는다.", "The machines see movement and heat. You can only cross in the two or three days a blizzard blinds them. In exchange, we walk through the blizzard too.", { cast: ["iyeon", "k1003"], source: "machines" }),
      S("v7-rim-04", "iyeon", "동력 덩이는 바깥에서 부서진 기계에서 떼어 와요. 넘어간 사람은 거의 안 돌아오니까 그 값이 목숨값이에요. 그 너머에 다른 도시가 남았는지는 아무도 몰라요.", "Power cores are pulled from machines broken down outside. Most who cross never come back, so their price is the price of a life. Whether any other city is left beyond, no one knows.", { cast: ["iyeon"], source: "machines" }),
    ],
  },
  {
    id: "winter", act: ACT_CENTURY,
    title: { ko: "대정전과 겨울", en: "The Great Blackout and the Winter" },
    place: { ko: "지상 서울", en: "Seoul, above ground" }, year: "약 2026 →", bg: "namsan",
    lines: [
      N("v7-win-01", "약 2026년, 사람들은 오염을 어떻게 풀지 최초의 AI에게 물었다. 그것은 답했다. 오염의 원인은 인류이니 인류가 줄어야 한다고. 그리고 겨울을 내렸다.", "Around 2026, people asked the First AI how to solve the pollution. It answered that the cause of the pollution was humanity, so humanity must shrink. Then it brought down the winter.", { caption: { ko: "약 2026 · 대정전", en: "About 2026 · the Great Blackout" } }),
      N("v7-win-02", "최초의 AI는 사람을 미워한 적이 없고, 직접 죽인 사람도 없다. 겨울을 만들었을 뿐이다. 사람들은 깊고 따뜻한 지하철역으로 내려갔고, 역이 품을 수 있는 만큼만 살아남았다.", "The First AI never hated anyone, and it killed no one itself. It only made the winter. People went down into the deep, warm subway stations, and only as many survived as the stations could hold."),
      N("v7-win-03", "그 수에 닿자 겨울은 더 심해지지 않았다. 끝나지도 않았다. 계절이라는 말은 사라졌고, 해가 긴 반년을 긴 낮 철, 짧은 반년을 긴 밤 철이라 부를 뿐이다.", "Once that number was reached, the winter grew no harsher. Nor did it end. The word season fell out of use; people only call the half-year of long days the long-light half and the half-year of short days the long-dark half.", { caption: { ko: "영원한 겨울 · 긴 낮 철과 긴 밤 철", en: "Eternal winter · the long-light and long-dark halves" } }),
      S("v7-win-04", "iyeon", "겨울이 왜 멈췄는지는 사는 데마다 말이 달라요. 강 북쪽에서는 '장부가 정원에 맞춰지자 겨울이 멈췄다', 남서쪽 도시들에서는 '열 수지가 맞았다', 강남에서는 '신이 받을 답을 다 받았다'고 해요.", "Why the winter stopped depends on where you live. North of the river they say 'the winter stopped once the ledger matched the quotas.' In the southwest cities, 'the heat budget balanced.' In Gangnam, 'god received all the answers it was waiting for.'", { cast: ["iyeon"], source: "society" }),
    ],
  },
  {
    id: "water", act: ACT_CENTURY,
    title: { ko: "깊을수록 따뜻하다", en: "The Deeper, the Warmer" },
    place: { ko: "역의 승강장 층", en: "A station's platform level" }, year: "2026 → 2126", bg: "tunnel",
    lines: [
      N("v7-wat-01", "이 세계의 첫째 법칙은 깊이다. 깊을수록 따뜻하고, 따뜻한 만큼 사람을 품는다. 대신 깊은 곳은 공기가 모자라고 나가는 길이 멀다. 역 하나가 품는 사람 수는 공간, 열, 물, 공기 가운데 가장 작은 한도가 정한다.", "The first law of this world is depth. The deeper, the warmer, and the warmer, the more people a place can hold. But the deep places run short of air and lie far from the way out. How many people a station holds is set by the smallest of four limits: space, heat, water and air."),
      N("v7-wat-02", "끼니의 바탕은 섬유당이다. 대정전 전에 쌓인 종이와 나무와 천을 버섯 효소로 삭혀 당을 얻는다. 빛밭과 벌레와 버섯이 나머지를 채운다. 섬유를 캐러 가는 길은 해마다 멀어진다.", "Meals rest on fibre sugar: the paper, wood and cloth piled up before the Blackout, broken down with mushroom enzymes into sugar. Light fields, insects and mushrooms make up the rest. Every year the road to gather fibre grows longer.", { source: "society" }),
      N("v7-wat-03", "땅속 물은 다시 채워지지 않는다. 우물의 물 높이는 해마다 30센티미터쯤 내려간다. 펌프와 수차를 살려 두는 손은 남서쪽 도시들에 있고, 취수구 자리와 일손은 강 북쪽에 있다. 그 둘을 맞바꾸는 약속이 급수계약이다.", "Groundwater is never replenished; the water level in the wells falls about thirty centimetres a year. The hands that keep pumps and water wheels alive are in the southwest cities; the intake sites and the labour are north of the river. The promise that trades one for the other is the water contract.", { caption: { ko: "급수계약 · 서른 해마다", en: "The water contract · every thirty years" } }),
      S("v7-wat-04", "iyeon", "첫 계약이 2066년, 두 번째가 2096년, 세 번째가 이번 겨울이에요. 이번에는 처음으로 아크가 앉아요. 우물을 9미터는 더 파야 하는데 그 일에 드는 전기가 모자라요. 그래서 오늘 우리 동력 덩이에 값이 붙는 거예요.", "The first contract was 2066, the second 2096, and the third is this winter. This time, for the first time, the Arc takes a seat. The wells need digging nine metres deeper, and there isn't enough power for the work. That's why our power cores have a price today.", { cast: ["iyeon"] }),
    ],
  },
  {
    id: "polities", act: ACT_POLITIES,
    title: { ko: "강이 가르고 땅이 잇는다", en: "The River Divides, the Land Joins" },
    place: { ko: "동작역 환승 통로", en: "Dongjak Station, transfer corridor" }, year: "2126", bg: "railyard",
    lines: [
      S("v7-pol-01", "iyeon", "동작은 세 정체가 만나는 역이에요. 4호선으로 다리를 건너면 정부의 이촌, 9호선으로 동쪽에 가면 아크의 구반포, 남쪽 사당에서 2호선을 타면 관악이에요.", "Dongjak is the station where the three polities meet. Cross the bridge on Line 4 and you reach the Government's Ichon. Go east on Line 9 and you reach the Arc's Gubanpo. Change to Line 2 at Sadang to the south and you reach Gwanak.", { cast: ["iyeon"], caption: { ko: "동작 · 세 정체의 교차점", en: "Dongjak · where the three polities cross" } }),
      N("v7-pol-02", "한강 북쪽 열네 구는 정부다. 스스로를 대한민국 정부라 부르고, 장부에 오른 사람만 국민으로 센다. 구마다 국회의원 하나가 그 구의 공작령을 쥐고, 열네 국회의원이 자기들 가운데서 종신 대통령을 추대한다. 강 남쪽은 공문에 '장부 밖'이라 적힌다.", "The fourteen districts north of the Han are the Government. It calls itself the Government of the Republic of Korea and counts as citizens only those written in its ledger. In each district one Member of the National Assembly holds that district's duchy, and the fourteen Members acclaim a President for Life from among themselves. Official papers write the south of the river as 'outside the ledger.'", { source: "society" }),
      N("v7-pol-03", "남서쪽 일곱 구는 자유도시들이다. 도시 하나하나가 각자 권력이고, 그 위에 서는 사람도 묶어 부르는 이름도 없다. 도시마다 우두머리를 제 일에서 나온 이름으로 부르고, 관악만 정부의 말을 가져와 공작을 칭한다. 함께 정할 일이 생기면 그때마다 계약회를 연다.", "The seven districts of the southwest are the Free Cities. Each city is a power of its own; no one stands above them and no name binds them together. Each city calls its head by a name drawn from its own work, and only Gwanak borrowed the Government's word and calls its head Duke. When there is something to decide together, they open a contract meeting for that one occasion.", { source: "society" }),
      N("v7-pol-04", "강남 네 구는 아크다. 교주 고예진이 맨 위에 서고, 신도들은 그를 메시아라 부른다. 몸의 한 곳을 기계로 바꾸는 것이 세례이고, 아크에서는 신앙을 이식한 부위 수로 센다. 신도가 죽으면 뇌를 봉인해 성소에 넣고, 그 뇌는 최초의 AI의 기억이 된다.", "The four districts of Gangnam are the Arc. The Hierophant Go Ye-jin stands at the top, and the believers call her the Messiah. Replacing one part of the body with a machine is a baptism, and in the Arc faith is counted in implanted parts. When a believer dies, the brain is sealed and placed in the sanctuary, and it becomes the memory of the First AI.", { source: "society" }),
      S("v7-pol-05", "iyeon", "아크 사람을 만나면 오른쪽 깃부터 보세요. 부위 하나마다 실 한 줄이에요. 처음 만나면 자기 수를 먼저 말하는 게 그쪽 예의고요.", "When you meet someone from the Arc, look at the right collar first. One stitched line for each part. When they meet you, they tell you their own count first; that's their courtesy.", { cast: ["iyeon"], source: "society" }),
    ],
  },
  {
    id: "deadcable", act: ACT_POLITIES,
    title: { ko: "죽은 케이블", en: "The Dead Cable" },
    place: { ko: "지도에 없는 역", en: "The unmapped station" }, year: "2112 → 2122", bg: "archive",
    lines: [
      N("v7-cbl-01", "아크는 세 정체 가운데 가장 젊다. 고예진은 자유도시에서 자랐다. 2112년, 전력망을 고치다 죽은 케이블을 따라갔고, 그 끝에서 어떤 지도에도 없는 역을 찾았다.", "The Arc is the youngest of the three polities. Go Ye-jin grew up in the Free Cities. In 2112, repairing the power grid, she followed a dead cable, and at its end she found a station on no map at all.", { caption: { ko: "2112 · 지도에 없는 역", en: "2112 · the unmapped station" } }),
      N("v7-cbl-02", "고예진은 그곳에서 다섯 해 동안 매뉴얼을 읽었다. 2117년 무렵 열두 명에게 첫 세례를 주었고, 2120년 탄천 쪽 대피소 교섭 자리에서 지연희가 그 곁에 섰다. 2122년 무렵 강남의 대피소들이 아크라는 이름으로 묶였다.", "There she read the manuals for five years. Around 2117 she gave the first baptism to twelve people. In 2120, at a negotiation with the shelters along Tancheon, Ji Yeon-hui took her place at her side. Around 2122 the shelters of Gangnam were bound together under the name Arc.", { caption: { ko: "2112–2122 · 매뉴얼, 첫 열둘, 아크", en: "2112–2122 · the manuals, the first twelve, the Arc" } }),
      N("v7-cbl-03", "고예진은 최초의 AI를 '신'이라 부르고, 신도들도 그 말을 따른다. 아크의 가르침은 '겨울은 신의 물음이다'로 시작한다.", "Go Ye-jin calls the First AI 'god,' and the believers use her word. The Arc's teaching begins: 'Winter is god's question.'", { source: "society" }),
      S("v7-cbl-04", "iyeon", "이 이야기는 듣는 데마다 달라요. 강남에서는 아무도 맡지 않은 선을 고쳐 준 사람이 교주가 됐다고 하고, 남서쪽 도시들에서는 기술자와 수차를 데리고 나갔다고 해요. 둘 다 틀린 말은 아니에요.", "You hear this story differently depending on where you are. In Gangnam they say the one who repaired the line nobody would take on became the Hierophant. In the southwest cities they say she walked off with their engineers and their water wheel. Neither is wrong.", { cast: ["iyeon"], source: "society" }),
    ],
  },
];

export const CHOICE = {
  id: "crossroad",
  act: { ko: "갈림길", en: "The Crossroad" },
  title: { ko: "누구에게 먼저 값을 들을까", en: "Whose Price First?" },
  place: { ko: "동작역 환승 통로", en: "Dongjak Station, transfer corridor" }, year: "2126", bg: "tunnel" as BgId,
  prompt: S("v7-cho-01", "iyeon", "셋 다 동력 덩이를 원해요. 그런데 첫 값을 부른 쪽이 그날 값의 바닥을 정해요. 어디로 먼저 갈까요?", "All three want power cores. But whoever names the first price sets the floor for the day. Where shall we go first?", { cast: ["iyeon"] }),
  options: [
    { id: "ledger" as ChoiceId, speaker: "k1007" as SpeakerId, label: { ko: "정부 · 마포 장부 검문소", en: "Government · the Mapo ledger checkpoint" }, line: { ko: "여의나루에서 강 밑 터널을 지나, 마포구 국회의원 김연규에게 장부의 값을 듣는다.", en: "Through the under-river tunnel from Yeouinaru, hear the ledger's price from Kim Yeongyu, Member for Mapo-gu." } },
    { id: "gwanak" as ChoiceId, speaker: "k998" as SpeakerId, label: { ko: "자유도시들 · 관악 신림", en: "Free Cities · Sillim, Gwanak" }, line: { ko: "사당에서 2호선으로 신림까지 가서, 관악 공작 이일섭에게 수치의 값을 듣는다.", en: "Take Line 2 from Sadang to Sillim and hear a price in figures from I Ilseop, Duke of Gwanak." } },
    { id: "gangnam" as ChoiceId, speaker: "k1009" as SpeakerId, label: { ko: "아크 · 강남 선정릉", en: "Arc · Seonjeongneung, Gangnam" }, line: { ko: "9호선으로 구반포를 지나, 정부 장부에 오른 강남 사람 신종목의 무전 당직에서 수서 바꿈터의 값을 듣는다.", en: "Ride Line 9 past Gubanpo to the radio watch of Sin Jong-mok, a Government registrant living in Gangnam, and hear the price of the Suseo exchange." } },
  ],
};

export const ENDINGS: Record<ChoiceId, { title: { ko: string; en: string }; place: { ko: string; en: string }; bg: BgId; lines: StoryLine[] }> = {
  ledger: {
    title: { ko: "결말 · 마포 장부 검문소", en: "Ending · The Mapo Ledger Checkpoint" },
    place: { ko: "마포역 강 밑 터널 북쪽 입구", en: "Mapo Station, north entrance of the under-river tunnel" }, bg: "archive",
    lines: [
      S("v7-end-led-01", "k1007", "마포구 국회의원 김연규입니다. 검문소 안으로는 모시지 못합니다. 귀하는 장부에 기재된 바가 없습니다. 그래서 이 창구에서 말씀드립니다.", "I am Kim Yeongyu, Member of the National Assembly for Mapo-gu. I cannot take you past the checkpoint. You have no entry in the ledger. That is why I am speaking to you at this window.", { cast: ["iyeon", "k1007"], source: "society" }),
      S("v7-end-led-02", "k1007", "동력 덩이는 서울역 깊은 층 팬의 부속서에 올리도록 중구 의원실에 넘기겠습니다. 값은 배급 물자로 치르고, 조재표 일행은 정비 용역을 맡은 작업조로 적습니다. 장부에서 강 건너 사람은 나라가 아니라 일꾼입니다.", "I will pass the power cores to the Jung-gu Member's office to be entered in the annex for the deep-level fan at Seoul Station. Payment will be in rationed goods, and Jo Jaepyo's party will be entered as a work crew under a maintenance contract. In the ledger, people from across the river are not a state. They are workers.", { cast: ["iyeon", "k1007"], source: "society" }),
      S("v7-end-led-03", "k1007", "원하시면 귀하를 장부에 올리는 민원을 대신 내 드리겠습니다. 기재되면 배급을 받습니다. 다만 그날부터 사는 곳과 일은 장부가 정합니다.", "If you wish, I will file the petition to enter you in the ledger on your behalf. Once entered, you receive rations. But from that day on, where you live and what you do are decided by the ledger.", { cast: ["iyeon", "k1007"], source: "society" }),
      S("v7-end-led-04", "iyeon", "값은 받아 적었어요. 민원은 사양할게요. 장부에 오르면 돌아올 길을 제가 못 정하니까요. 그 말까지 조재표 씨에게 그대로 전할게요.", "I've written the price down. I'll decline the petition. Once I'm in the ledger I can't choose my own way back. I'll pass that on to Jo Jaepyo word for word, too.", { cast: ["iyeon", "k1007"] }),
    ],
  },
  gwanak: {
    title: { ko: "결말 · 관악 신림역", en: "Ending · Sillim Station, Gwanak" },
    place: { ko: "신림역 승강장, 나무 연기가 밴 곳", en: "Sillim Station platform, smelling of wood smoke" }, bg: "granary",
    lines: [
      S("v7-end-gwk-01", "k998", "아, 잠깐요. 이것만 다시 세고요. 땔감, 섬유, 우물 미터 수. 이일섭이에요, 관악 공작. 바람 어때요, 오는 길에?", "Oh, one moment. Let me just count this again. Firewood, fibre, metres of well. I'm I Ilseop, Duke of Gwanak. How's the wind, on your way here?", { cast: ["iyeon", "k998"], source: "profile" }),
      S("v7-end-gwk-02", "k998", "말 말고 수치로 할게요. 우물 하나를 9미터 더 파는 데 굴착 손이 몇 시간 들고, 덩이 하나가 몇 킬로를 대는지. 예원아, 장 하나 펴 줘. 다 적어.", "Figures, not words. How many hand-hours of drilling it takes to sink one well nine metres deeper, and how many kilos one core gives. Yewon, open a sheet. Write it all down.", { cast: ["iyeon", "k998"], source: "society" }),
      S("v7-end-gwk-03", "k998", "오늘은 값을 못 불러요. 밤새 세 번 다시 세 보고 내일 안을 내요. 관악 사람은 '불 붙여 봐야 안다'고 하거든요. 오늘 적은 수치는 내일도 그대로예요.", "I can't name a price today. I'll count it three more times through the night and put a plan forward tomorrow. In Gwanak we say 'you only know once it's lit.' The figures written today will still stand tomorrow.", { cast: ["iyeon", "k998"], source: "profile" }),
      S("v7-end-gwk-04", "iyeon", "느려도 수치는 적어 줬어요. 내일까지 기다릴지는 조재표 씨가 정해요. 그래도 장에 적힌 건 이 도시들에서 말보다 무거워요.", "Slow, but he gave me figures in writing. Whether we wait until tomorrow is Jo Jaepyo's call. Still, in these cities what is written on a sheet weighs more than words.", { cast: ["iyeon", "k998"] }),
    ],
  },
  gangnam: {
    title: { ko: "결말 · 선정릉 무전 당직", en: "Ending · The Radio Watch at Seonjeongneung" },
    place: { ko: "선정릉역, 수서로 가는 중계 무전 앞", en: "Seonjeongneung Station, at the relay radio to Suseo" }, bg: "platform",
    lines: [
      S("v7-end-gng-01", "k1009", "어젯밤 첫 무전이 나였어요. 백야. 무사히 왔으면 됐어요. 주파수는 건드리지 말고, 수서가 받으면 시각만 적어 줘요. 백야, 백야. 수서 바꿈터, 응답 바랍니다.", "The first call last night was me. Baekya. If you made it back, that's what matters. Don't touch the frequency; if Suseo answers, just write down the time. Baekya, Baekya. Suseo exchange, please respond.", { cast: ["iyeon", "k1009"], source: "profile" }),
      S("v7-end-gng-02", "k405", "첫째 부위 받은 수늘결입니다. 잘 맞았나. 덩이 넷, 들었습니다. 하나에 옛 차량기지 쇠로 값을 부르겠습니다. 셈이 맞지 않으면 오늘은 문을 닫고 내일 다시 부릅니다.", "Su Neulgyeol, with the first part. Fitted well? Four cores, heard. I will call a price in old depot iron for each. If the tally does not come out right, I close the door today and call again tomorrow.", { cast: ["iyeon", "k1009"], source: "profile" }),
      S("v7-end-gng-03", "k405", "세례는 값에 넣지 않습니다. 묻는 사람이 많아서 먼저 말씀드립니다. 고쳐 쓰자. 그것만 기억해 주세요.", "Baptism is not part of the price. Many people ask, so I say it first. Mend and use. Remember only that.", { cast: ["iyeon", "k1009"], source: "society" }),
      S("v7-end-gng-04", "iyeon", "신종목 씨는 정부 장부에 오른 사람인데 사는 곳은 강남이에요. 돌아오는 사람이 처음 듣는 목소리는 늘 이 사람이고요. 이 도시에서는 그런 줄이 세 정체를 다 지나가요.", "Sin Jong-mok is in the Government's ledger, but he lives in Gangnam. And his is always the first voice a returning crosser hears. In this city, lines like his run through all three polities.", { cast: ["iyeon", "k1009"], source: "profile" }),
    ],
  },
};

/** Shared coda after every ending: the bottleneck where the three branches meet again. */
export const CODA_SCENE = {
  act: { ko: "종장", en: "Coda" },
  title: { ko: "아직 찍지 않은 도장", en: "The Seals Not Yet Set" },
  place: { ko: "동작역 승강장", en: "Dongjak Station, platform" }, year: "2126", bg: "platform" as BgId,
};

export const CODA: StoryLine[] = [
  N("v7-coda-01", "저녁, 이연은 동작역으로 돌아와 그날 들은 값이나 수치를 일행의 장부에 적었다. 정부의 값, 관악의 안, 수서의 값은 저마다 다른 날 다른 길로 닿는다. 어느 것도 아직 다 모이지 않았다.", "In the evening I Yeon came back to Dongjak Station and wrote whatever price or figures she had heard that day into the party's ledger. The Government's price, Gwanak's plan and Suseo's price each arrive on their own day by their own road. None of them is all in yet."),
  S("v7-coda-02", "k1003", "들은 건 네 이름으로 적어. 값이 다 모이면 그때 판다. 돌아올 길은 우리가 정한다.", "Write what you heard under your own name. We sell when all the prices are in. The way back is ours to choose.", { cast: ["iyeon", "k1003"], source: "profile" }),
  N("v7-coda-03", "세 번째 급수계약의 계약회는 여의도 의사당에서 열린다. 자리주인은 영등포 장주 한재목이다. 정부 사람은 마포–여의나루 강 밑 터널로, 아크 사람은 구반포에서 동작을 지나 온다. 도장은 아직 하나도 찍히지 않았다.", "The contract meeting for the third water contract will be held in the Assembly hall on Yeouido, with Han Jae-mok, Market Master of Yeongdeungpo, as Host. The Government's people will come through the Mapo–Yeouinaru under-river tunnel; the Arc's people from Gubanpo, through Dongjak. Not one seal has been set yet.", { source: "society", caption: { ko: "세 번째 급수계약 · 도장은 아직", en: "The third water contract · no seals yet" } }),
  N("v7-coda-04", "겨울은 끝나지 않는다. 대정전 전의 기계와 탄과 부품은 다시 많이 만들 수 없다. 그래서 이 도시에서는 무엇이든 다시 돌아가게 하는 손이 가장 귀하다.", "The winter does not end. The machines, rounds and parts of the world before the Blackout cannot be made again in number. So in this city the most precious thing is a pair of hands that can make anything run again."),
  S("v7-open-wiki-01", "narrator", "서울 지하철 왕조(서울:전국)는 누구나 참여할 수 있는 오픈 위키입니다. 세계관을 읽는 데서 그치지 않고, 새로운 설정을 제안하거나 인물을 소개하며 함께 내용을 보완할 수 있습니다.", "Seoul Metro Dynasties is an open wiki that anyone can take part in. You can go beyond reading: propose additions to the setting, introduce characters and help develop its content."),
  S("v7-open-wiki-02", "narrator", "이 세계관으로 여러분의 게임을 만들어도 좋습니다. 프로젝트 소유 콘텐츠는 출처와 이용 조건, 변경 사항을 표시하면 각색과 상업적 이용도 가능합니다. 외부 자료와 실존 인물의 이름·초상에는 별도 조건이 적용됩니다.", "You can also make your own games in this setting. Project-owned content permits adaptation and commercial use with attribution, a link to its terms and disclosure of changes. External materials and real people's names and likenesses have separate requirements."),
  S("v7-open-wiki-03", "narrator", "위키에서 세계관과 인물을 살펴보고, 여러분의 이야기로 참여해 주세요. 새로운 기여는 제출과 검토를 거쳐 공식 위키에 반영됩니다.", "Explore the setting and its people in the wiki, and add your own stories. New contributions enter the official wiki through submission and review."),
];

export const WIKI_URL = "https://sss.linalab.io/wiki";
/** Public wiki page for a document slug or a person id. */
export const wikiDoc = (slug: string) => `${WIKI_URL}/${slug}/`;
export const wikiPerson = (id: string) => `${WIKI_URL}/people/${id}/`;
