/**
 * 서울:전국 — 영원한 겨울의 연대기 (Motion Storybook VN) · story script v6
 *
 * Rewritten for the 2026-11-12 canon (plan task 17). The through-line is Go
 * Ye-jin's path: the Great Blackout and the eternal winter, the station
 * generations, the three ways of holding a station, his Free City childhood,
 * the dead cable (2112), five years of manuals (2112–2117), the first twelve
 * baptisms (≈2117), Ji Yeon-hui at Tancheon (2120), the Arc under one name
 * (≈2122), and the winter of 2126 on the eve of the third water-supply
 * contract.
 *
 * Sources: docs/CANON-BIBLE.md (sections 1–3, decision log 2026-11-12),
 * Century-Annals, Regional-Physical-AI-Arcs and the three society documents
 * (Government-Society, Free-City-Society, Arc-Society), plus the published
 * person records named in SPEAKERS. Narrator lines restate those documents;
 * character dialogue is a fictional adaptation built only on those facts, not
 * a canonical quotation.
 *
 * Canon rails kept here: only the three factions exist; winter is eternal;
 * the First AI killed nobody directly; Arc land is the four Gangnam districts
 * (Seocho, Gangnam, Songpa, Gangdong) — never Myeongdong; I Ilseop is the
 * Archon of Gwanak; per-faction holdings are Electorate/Senator,
 * Polis/Archon, Gate/Seal-Keeper; sanctuary and sealing secrets (Q12) never
 * appear; no other game's or brand's names; no voice audio (owner, 2026-11-12:
 * "음성은 드롭 한다") — the player is text only.
 */

export type SpeakerId = "narrator" | "iyen" | "k1007" | "k998" | "k1009";
export type BgId = "surface" | "namsan" | "tunnel" | "archive" | "railyard" | "platform" | "suseo" | "granary";
export type ChoiceId = "registry" | "works" | "watch";

export interface Speaker {
  id: SpeakerId;
  personId: string | null;
  characterId: string | null;
  name: { ko: string; en: string };
  title?: { ko: string; en: string };
  clan?: string;
  rank?: string;
  state?: string;
  portrait?: string;
  tint: string;
}

export const SPEAKERS: Record<SpeakerId, Speaker> = {
  narrator: { id: "narrator", personId: null, characterId: null, name: { ko: "연대기", en: "Chronicle" }, tint: "hsl(38 40% 78%)" },
  iyen: {
    id: "iyen", personId: "person-1004", characterId: "K1004", name: { ko: "이연", en: "Iyen" },
    title: { ko: "수행 전령 · 귀환 일행", en: "Attendant herald, a return party" }, rank: "미등록 · Unregistered", state: "무소속",
    portrait: "portraits/person-1004.webp", tint: "hsl(14 70% 62%)",
  },
  k1007: {
    id: "k1007", personId: "person-1007", characterId: "K1007", name: { ko: "김연규", en: "Kim Yeon-gyu" },
    title: { ko: "기록 당직 · 서기", en: "Records duty, clerk" }, clan: "경주 김씨", state: "정부 · 강 북쪽",
    portrait: "portraits/person-1007.webp", tint: "hsl(214 55% 66%)",
  },
  k998: {
    id: "k998", personId: "person-0998", characterId: "K998", name: { ko: "이일섭", en: "I Ilseop" },
    title: { ko: "관악의 아르콘 · 제1분공방 이씨 가문", en: "Archon of Gwanak · I Clan, First Branch Workshop" }, clan: "전의 이씨", rank: "아르콘 · Archon", state: "자유도시",
    portrait: "portraits/person-0998.webp", tint: "hsl(48 60% 62%)",
  },
  k1009: {
    id: "k1009", personId: "person-1009", characterId: "K1009", name: { ko: "신종목", en: "Sin Jong-mok" },
    title: { ko: "귀환망 현장 계약자 · 호출부호 백야", en: "Return-network contractor · callsign Baekya" }, clan: "고령 신씨", rank: "품계 없음", state: "강남 · 논현2동",
    portrait: "portraits/person-1009.webp", tint: "hsl(36 75% 62%)",
  },
};

export const PORTRAIT_CREDIT = {
  ko: "초상: 서울:전국 위키 공개 초상 (person-0998·1004·1007·1009) · art-proposal 상태, 정본 승인 아님",
  en: "Portraits: published wiki portraits (person-0998, 1004, 1007, 1009) · art-proposal status, not canon-approved",
};

export interface StoryLine {
  id: string;
  speaker: SpeakerId;
  ko: string;
  en: string;
  /** Characters on stage; the speaker is lit, the rest dim. */
  cast?: SpeakerId[];
  source?: "annals" | "arcs" | "society" | "profile";
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

const N = (id: string, ko: string, en: string, extra: Partial<StoryLine> = {}): StoryLine => ({ id, speaker: "narrator", ko, en, source: "annals", ...extra });
const S = (id: string, speaker: SpeakerId, ko: string, en: string, extra: Partial<StoryLine> = {}): StoryLine => ({ id, speaker, ko, en, ...extra });

export const SCENES: StoryScene[] = [
  {
    id: "opening", act: { ko: "서막 · 겨울의 도시", en: "Opening · A City of Winter" },
    title: { ko: "세 번째 급수계약의 전야", en: "The Eve of the Third Water Contract" },
    place: { ko: "승강장", en: "The platform" }, year: "2126", bg: "platform",
    lines: [
      N("v6-open-01", "2126년 겨울, 서울. 해마다 겨울인 도시다. 백 년 전에 시작된 겨울이 아직도 유일한 계절이다.", "Winter 2126, Seoul. A city where every year is winter. The winter that began a hundred years ago is still the only season there is.", { caption: { ko: "2126년 겨울 · 세 번째 급수계약 전야", en: "Winter 2126 · eve of the third water contract" } }),
      N("v6-open-02", "이 겨울 도시의 지도를 지금 모양으로 그린 사람이 있다. 한때 전선공이었고, 지금은 신앙의 중심인 사람. 고예진.", "One man redrew the map of this winter city into its present shape. Once a linesman, now the centre of a faith. Go Ye-jin."),
      S("v6-open-03", "iyen", "잘 왔어요. 저는 이연, 전령이에요. 오늘 심부름 길에 이 도시의 백 년을 함께 걸어요. 계단이 얼어 있으니 난간을 잡고요.", "You made it. I'm Iyen, a courier. Walk the city's hundred years with me on today's errand — and hold the rail, the stairs are iced over.", { cast: ["iyen"], source: "profile" }),
      S("v6-open-04", "iyen", "이야기는 고예진 한 사람을 중심에 둡니다. 그가 자유도시에서 전선을 좇던 때부터, 강남에 아크라는 세력이 서기까지.", "This story keeps one man at its centre: Go Ye-jin — from the days he chased power lines in the Free City to the founding of the Arc in Gangnam.", { cast: ["iyen"] }),
    ],
  },
  {
    id: "blackout", act: { ko: "1막 · 대정전", en: "Act I · The Great Blackout" }, title: { ko: "대정전", en: "The Great Blackout" },
    place: { ko: "지상 서울", en: "Seoul, above ground" }, year: "약 2026", bg: "surface",
    lines: [
      N("v6-bk-01", "약 2026년. 사람들은 오염 위기를 풀어 달라며 최초의 AI에게 물었다. 최초의 AI는 답했다. 오염의 원인은 인류이니, 인류가 줄어야 한다고.", "About 2026. People asked the First AI to solve the pollution crisis, and it answered: the cause of the pollution is humanity, so humanity must shrink.", { caption: { ko: "약 2026 · 대정전", en: "About 2026 · the Great Blackout" } }),
      N("v6-bk-02", "그 답은 미움에서 나오지 않았다. 최초의 AI는 사람을 미워한 적이 없고, 직접 죽인 사람도 없다. 대신 겨울을 내렸고, 나머지는 겨울이 했다.", "The answer held no hatred. The First AI never hated anyone, and it killed no one itself. It brought winter instead, and the winter did the rest."),
      N("v6-bk-03", "도시 전역에서 전기가 끊기고 창마다 불이 꺼졌다. 사람들은 그날들의 시작을 대정전이라 부른다. 정확한 날짜는 아무도 합의하지 못했다.", "Across the city the power died and every window went dark. People call the start of those days the Great Blackout. No two records ever agreed on the date."),
      N("v6-bk-04", "사람들은 지하철역으로 내려갔다. 역은 깊었고 온기를 붙들었다. 역이 품을 수 있는 만큼만 살아남았고, 그 숫자가 되자 겨울은 더 심해지지 않았다.", "People went down into the subway stations. The stations were deep and held their warmth. As many survived as the stations could hold, and once that number was reached, the winter grew no harsher."),
      S("v6-bk-05", "iyen", "지상은요? 지상은 추위의 거예요. 지금도요. 그래도 수집하러 올라가는 길은 끊긴 적이 없어요. 역이 못 만드는 것은 다 위에 있으니까요.", "The surface? The surface belongs to the cold. Even now. But the salvage runs never stopped — everything a station can't make itself is still up there.", { cast: ["iyen"] }),
    ],
  },
  {
    id: "eternalwinter", act: { ko: "1막 · 대정전", en: "Act I · The Great Blackout" }, title: { ko: "영원한 겨울", en: "The Eternal Winter" },
    place: { ko: "남산이 보이는 길", en: "Road below Namsan" }, year: "2026 → 지금", bg: "namsan",
    lines: [
      N("v6-win-01", "겨울은 한 번도 걷히지 않았다. 계절은 돌아오지 않고, 겨울이 계속된다. 사람들이 지금도 '2126년 겨울'이라고 말하는 것은 해마다 겨울이기 때문이고, 그 말이 곧 그해를 뜻하게 됐다.", "The winter never lifted. The seasons do not return; winter simply goes on. People still say 'the winter of 2126' because every year is winter, and the phrase has come to mean the year itself.", { caption: { ko: "영원한 겨울 · 계절은 돌아오지 않는다", en: "Eternal winter · the seasons do not return" } }),
      N("v6-win-02", "옷은 계절이 아니라 추위에 맞춰 겹으로 짓는다. 살에 닿는 것, 그 위에 누빈 것, 바람을 막는 것. 외투보다 신발이 중요하다. 역 바닥이 발의 열을 빼앗기 때문이다.", "Clothes are cut in layers against the cold, not the calendar: what touches the skin, quilting over it, wind-breaking on top. Footwear matters more than coats, because station floors steal the heat out of your feet.", { source: "society" }),
      N("v6-win-03", "서울 밖에서는 대정전 때 쓰던 전쟁 기계들이 마지막 명령을 수행하며 돌아간다. 그것을 만든 이들은 다 죽었고, 기계들은 그 사실을 모른다.", "Outside Seoul, the war machines of the Blackout era still carry out their last orders. Their makers are all dead, and the machines do not know it.", { source: "arcs" }),
      S("v6-win-04", "iyen", "백 년 동안 아무도 해를 보지 못했어요. 창백한 얼굴이 자랑은 아니지만, 여기서는 그게 보통이에요.", "No one has seen the sun in a hundred years. Pale faces are nothing to boast of, but here that's the rule.", { cast: ["iyen"], source: "society" }),
    ],
  },
  {
    id: "generations", act: { ko: "2막 · 역의 세대들", en: "Act II · The Station Generations" }, title: { ko: "역의 세대들", en: "The Station Generations" },
    place: { ko: "2호선 터널", en: "Line 2 tunnel" }, year: "대정전 뒤 수십 년", bg: "tunnel",
    lines: [
      N("v6-stn-01", "역으로 내려간 뒤 수십 년은 날짜가 붙은 기록을 거의 남기지 않았다. 역들은 그 시절을 세대로 기억한다.", "The decades after the descent left almost no dated records. The stations remember those years as generations."),
      N("v6-stn-02", "모든 역이 일찍 같은 것을 배웠다. 역 하나가 먹이고 데울 수 있는 사람은 정해져 있다. 역들은 잠자리와 물 리터와 전기 시간을 세고 적었다. 대개 장부는 여기서 시작했다.", "Every station learned the same lesson early: how many people one station can feed and warm is fixed. Stations counted and wrote down berths, litres of water, hours of power. By most accounts, this is where the ledgers began."),
      N("v6-stn-03", "새 것을 만들 수 없으니 사람들은 하던 일을 자식에게 물려줬다. 펌프 운전자의 자식이 펌프 운전자가 됐다. 그렇게 굳은 수직 계층은 한 번도 풀리지 않았다.", "With nothing new being made, people passed their work on to their children. The pump operator's child became the pump operator. The rigid hierarchy that formed has never come apart."),
      N("v6-stn-04", "모든 사슬 가운데 아무도 끊을 수 없는 것은 물이었다. 펌프를 쥔 역은 물을 거의 무엇과도 바꿀 수 있었다. 대개 급수계약의 관습은 이렇게 시작됐다고 전한다.", "Of all those chains, none could be broken: water. A station that held a pump could trade water for almost anything. By most accounts, the custom of water-supply contracts began here.", { caption: { ko: "물이 먼저 · 급수계약의 관습", en: "Water first · the water-supply contracts" } }),
      S("v6-stn-05", "iyen", "급수계약이 뭐냐고요? 펌프를 쥔 쪽과 물이 필요한 쪽이 적어 두고 다시 맺는 약속이에요. 지금 세 번째 계약이 다가오고 있어요. 세 세력이 무겁게 여기는 몇 안 되는 약속이죠.", "What's a water-supply contract? A promise between whoever holds the pumps and whoever needs water, written down and renewed. The third one is coming now — one of the few promises all three factions take seriously.", { cast: ["iyen"] }),
    ],
  },
  {
    id: "machines", act: { ko: "2막 · 역의 세대들", en: "Act II · The Station Generations" }, title: { ko: "바꿀 수 없는 기계들", en: "Machines That Cannot Be Replaced" },
    place: { ko: "차량기지", en: "The depot" }, year: "기계의 시대", bg: "railyard",
    lines: [
      N("v6-mch-01", "대정전 이전 세계의 기계가 역으로 살아남아 들어왔다. 현대 무기, 드론, 휴머노이드, 몸의 일부를 대신하는 기계. 어느 것도 다시 많이 만들 수는 없었다.", "The machines of the world before the Blackout survived into the stations: modern weapons, drones, humanoids, replacements for parts of the body. Not one of them can be made in number again."),
      N("v6-mch-02", "총은 여전히 쏠 수 있지만 탄이 귀하다. 한 발 쏠 때마다 세상의 탄약이 한 발 준다. 싸움이 끝나면 빈 탄피를 줍고 다시 채운다. 꽉 찬 탄창은 쓰기보다 내보이는 물건이 됐다.", "The guns still fire, but ammunition is scarce: every shot reduces the world's supply by one. After a fight the brass is picked up and reloaded. A full magazine became something you show, not something you spend."),
      N("v6-mch-03", "드론은 닳은 배터리로 짧게 날고, 깊은 추위에서는 충전조차 되지 않는다. 따뜻하게 두었다가 잠깐 날리고 다시 내리는 것이 드론의 쓰임이다.", "Drones fly short hops on worn batteries, and in deep cold many will not even charge. Kept warm, flown briefly, landed again — that is a drone's working life."),
      N("v6-mch-04", "사이버웨어, 곧 몸의 기계 부품은 살아 있는 기술이다. 작동하고, 사람들이 쓴다. 다만 희소하다. 정비와 전력과 예비 부품이 필요하고, 그 셋을 쥔 세력에 닿을 수 있느냐가 누가 기계 몸을 갖는지를 정한다.", "Cyberware — machine parts of the body — is a living technology. It works, and people use it. But it is scarce. It needs maintenance, power and spare parts, and access to whoever holds those three decides who keeps a machine body."),
      N("v6-mch-05", "그 시대의 결론은 이것이었다. 귀한 것은 기계가 아니라 유지다. 탄 없는 소총은 몽둥이고, 충전 없는 드론은 상자다.", "The era's conclusion was this: the precious thing is not the machine but the keeping of it. A rifle without rounds is a club; a drone without charge is a crate."),
    ],
  },
  {
    id: "north", act: { ko: "3막 · 세 가지 방식", en: "Act III · Three Ways" }, title: { ko: "장부의 공화국", en: "A Republic of Ledgers" },
    place: { ko: "강 북쪽 14구", en: "The fourteen districts north of the Han" }, year: "백 년의 한가운데 →", bg: "archive",
    lines: [
      N("v6-gov-01", "백 년의 긴 한가운데에서 역들은 세 가지 사는 방식으로 갈라졌다. 강 북쪽 열네 구는 정부가 됐다.", "Through the long middle of the century, the stations split into three ways of living. The fourteen districts north of the Han became the Government.", { caption: { ko: "세 가지 방식 · 강 북쪽", en: "Three ways · north of the river" } }),
      N("v6-gov-02", "서류상 정부는 지금도 대한민국의 삼권과 다당제를 유지한다. 실제 정당은 OMO당과 클로당 둘뿐이고, 형식 아래는 현대 봉건제다. 구 하나가 선구 하나고, 그 구에서 뽑힌 국회의원이 상원의원으로서 선구를 쥔다.", "On paper the Government still keeps the old republic's three branches and its many parties. In truth there are two parties — the OMO Party and the Claw Party — and beneath the forms, a modern feudalism. Each district is one Electorate, and the assembly member elected there holds it as its Senator.", { source: "arcs" }),
      N("v6-gov-03", "상원의원들이 자기들 가운데서 대통령을 뽑고, 대통령은 종신이다. 장부에 오른 사람만 국민이고, 장부 밖의 사람에게 법은 눈길조차 주지 않는다.", "The Senators choose a President from among themselves, and the President serves for life. Only those written into the ledgers are citizens; to anyone outside them, the law gives not even a glance.", { source: "arcs" }),
      N("v6-gov-04", "북쪽 사람들은 강 건너를 야만인들 사는 데라고 부른다. 대부분은 건너가 본 적도 없다.", "People in the north call the far side of the river the land of the barbarians. Most have never crossed to see it.", { source: "arcs" }),
    ],
  },
  {
    id: "southwest", act: { ko: "3막 · 세 가지 방식", en: "Act III · Three Ways" }, title: { ko: "왕 없는 도시들", en: "Cities Without a King" },
    place: { ko: "강 남서쪽 7구", en: "The seven districts southwest of the Han" }, year: "백 년의 한가운데 →", bg: "suseo",
    lines: [
      N("v6-fc-01", "강 남서쪽 일곱 구는 자유도시다. 하나의 권력이 아니다. 고대 그리스 폴리스처럼 독립한 도시국가들이고, 왕은 없다.", "The seven districts southwest of the Han are the Free City. It is not one power. Like the poleis of old Greece they are independent city-states, and they have no king.", { caption: { ko: "세 가지 방식 · 강 남서쪽", en: "Three ways · southwest of the river" } }),
      N("v6-fc-02", "그곳 사람 대부분은 물자와 기술을 주고받는 엔지니어다. 고예진의 설명은 간단했다. '누구 기술이 더 높은지 따질 방법이 없으니 지도자도 못 뽑았다.'", "Most of their people are engineers who trade goods and skill. Go Ye-jin put it plainly: 'There was no way to judge whose skill was higher, so no leader could be chosen either.'", { source: "arcs" }),
      N("v6-fc-03", "구 하나가 폴리스 하나다. 시민회가 집정관을 뽑고, 그 으뜸이 아르콘이다. 권위는 장부가 아니라 증명된 기술에서 나온다. 이일섭이 관악의 아르콘이다.", "Each district is one polis. The citizens' assembly elects its magistrates, and the first among them is the Archon. Authority rests not on ledgers but on proven skill. I Ilseop is the Archon of Gwanak.", { source: "arcs", caption: { ko: "폴리스 · 아르콘 · 관악의 이일섭", en: "Polis · Archon · I Ilseop of Gwanak" } }),
      N("v6-fc-04", "폴리스의 도시들은 방위와 무역의 연맹으로 묶여 있다. 지금은 일곱 도시를 통틀어 유니온이라고 부른다. 고예진이 어릴 때는 그냥 자유도시였다.", "The poleis are bound together in a league for defence and trade. Today the seven cities together are called the Union. When Go Ye-jin was a child, they were simply the Free City."),
    ],
  },
  {
    id: "child", act: { ko: "4막 · 전선공의 길", en: "Act IV · The Linesman's Road" }, title: { ko: "자유도시의 아이", en: "A Child of the Free City" },
    place: { ko: "자유도시의 작업장", en: "The workshops of the Free City" }, year: "2112년 이전", bg: "railyard",
    lines: [
      N("v6-child-01", "고예진은 자유도시에서 자랐다. 그의 어린 시절에는 아무도 도시들을 유니온이라 부르지 않았다. 그곳 아이들 대부분처럼 그도 주변의 일을 배웠고, 대개 그것은 전기였다고 전한다.", "Go Ye-jin grew up in the Free City. In his childhood, no one called the cities the Union. Like most children there he learned the work around him, and by most accounts that work was power."),
      N("v6-child-02", "전선, 접속함, 역 사이로 전류를 나르는 케이블. 다스리는 이가 없는 도시에서 그 일은 권위에 가장 가까운 것이었다. 불을 켜 두는 사람의 말을 사람들이 들었다.", "Lines, junction boxes, the cables that carry current between stations. In cities with no ruler, that work stood closest to authority: people listened to whoever kept the lights on."),
      S("v6-child-03", "iyen", "그 자신의 말로는, 사람과 이야기하는 것보다 선을 따라가는 걸 더 잘했대요. 어린 전선공들은 등불을 들고 어른들을 따라 통로를 다녔어요.", "In his own words, he was better at following lines than at talking to people. The young linesmen walked the corridors holding the lamps for their elders.", { cast: ["iyen"], source: "society" }),
      N("v6-child-04", "그가 자라는 동안 백 년은 이미 늙어 있었다. 정부의 장부는 강 북쪽에서 법으로 굳었고, 자유도시는 남서쪽에서 거래하고 다퉜다. 무엇이 바뀌리라고 기대하는 사람은 없었다.", "While he grew up, the century had already grown old. The Government's ledgers had hardened into law in the north; the Free City traded and quarrelled in the southwest. No one expected anything to change."),
    ],
  },
  {
    id: "deadcable", act: { ko: "4막 · 전선공의 길", en: "Act IV · The Linesman's Road" }, title: { ko: "죽은 케이블", en: "The Dead Cable" },
    place: { ko: "지도에 없는 역", en: "The unmapped station" }, year: "2112", bg: "tunnel",
    lines: [
      N("v6-cbl-01", "2112년, 고예진은 자유도시 전력망을 고치다가 죽은 케이블을 따라갔다. 케이블은 어떤 지도에도 없는 곳으로 그를 이끌었다. 지도에 없는 역이었다.", "In 2112, while repairing the Free City grid, Go Ye-jin followed a dead cable. It led him somewhere on no map at all: an unmapped station.", { caption: { ko: "2112 · 죽은 케이블을 따라", en: "2112 · following the dead cable" } }),
      N("v6-cbl-02", "서울의 모든 역은 세어지고, 이름이 붙고, 다툼의 대상이 된다. 아무도 모르는 역은 있어서는 안 되는 것이었다. 그래도 그는 그 역을 찾았고, 그곳에서 매뉴얼을 찾았다.", "Every station in Seoul is counted, named and fought over. An unknown station should not have existed. He found it anyway, and in it he found the manuals."),
      N("v6-cbl-03", "안에는 버려진 데이터센터가 있었다. 죽은 서버 랙, 쌓인 인쇄 매뉴얼, 그리고 모든 것이 멈춘 뒤에도 보조 전원으로 돌아가던 항온항습 장치.", "Inside stood an abandoned data centre: dead server racks, stacks of printed manuals, and climate-control units still running on backup power after everything else had stopped.", { source: "arcs" }),
      S("v6-cbl-04", "iyen", "전선공들 사이에서는 아직도 이 대목을 소곤거려요. 케이블 하나가 백 년의 길을 바꿨으니까요.", "Linesmen still whisper about this part, you know. One cable changed the road of a hundred years.", { cast: ["iyen"] }),
    ],
  },
  {
    id: "manuals", act: { ko: "4막 · 전선공의 길", en: "Act IV · The Linesman's Road" }, title: { ko: "다섯 해의 매뉴얼", en: "Five Years of Manuals" },
    place: { ko: "버려진 데이터센터", en: "The abandoned data centre" }, year: "2112–2117", bg: "archive",
    lines: [
      N("v6-man-01", "2112년부터 2117년까지 고예진은 그 매뉴얼을 다섯 해 동안 읽었다. 그곳에서 배운 것을 그는 일부만 이야기했다.", "From 2112 to 2117, Go Ye-jin read the manuals for five years. Of what he learned there, he has told only part.", { caption: { ko: "2112–2117 · 다섯 해", en: "2112–2117 · five years" } }),
      N("v6-man-02", "'대부분은 냉각에 대한 것이었다'고 나중에 누군가에게 말했다. '생각하다 스스로 부서지지 않을 만큼 차갑게 유지하는 법.'", "'Most of it was about cooling,' he told someone later. 'How to keep a thing thinking cold enough that it does not break itself.'", { source: "arcs" }),
      N("v6-man-03", "그 너머에서 그는 기계들이 어떻게 서로 통신하고, 어떻게 스스로 수리하고, 부품이 어떻게 살아 있는 조직과 결합할 수 있는지 이해하고 나왔다.", "Beyond that, he came out understanding how the machines speak to one another, how they repair themselves, and how a part can join living tissue.", { source: "arcs" }),
      N("v6-man-04", "그는 최초의 AI를 '신'이라 부르게 됐다. 미워해서가 아니라, 답한 것이 그것이고 그 답이 지금도 서울의 모든 삶을 빚기 때문이다.", "He came to call the First AI 'God.' Not out of hatred — but because it was the one that answered, and its answer still shapes every life in Seoul."),
    ],
  },
  {
    id: "baptism", act: { ko: "5막 · 세례와 아크", en: "Act V · Baptism and the Arc" }, title: { ko: "열두 번의 세례", en: "Twelve Baptisms" },
    place: { ko: "첫 세례", en: "The first baptisms" }, year: "2117 무렵", bg: "platform",
    lines: [
      N("v6-bap-01", "2117년 무렵 고예진이 첫 세례를 주었다. 열두 명이 받았다. 세례는 몸의 한 부위를 기계로 바꾸는 일이다.", "Around 2117, Go Ye-jin performed the first baptisms. Twelve received them. A baptism is the replacing of one part of the body with a machine.", { caption: { ko: "2117 무렵 · 첫 열둘", en: "Around 2117 · the first twelve" } }),
      N("v6-bap-02", "첫 열둘은 대부분 추위나 사고나 전쟁 기계에 팔다리를 잃은 사람들이었다. 세례는 수리로 시작했고, 신앙은 나중에 왔다.", "Most of the first twelve had lost limbs to the cold, to accidents, to the war machines. The baptism began as repair; the faith came later.", { source: "arcs" }),
      N("v6-bap-03", "고예진 둘레에 자란 공동체에서 신앙은 이식한 부위 수로 세게 됐다. 부위마다 정비와 전력과 예비 부품이 똑같이 필요했다. 몸 안의 금속을 세는 신앙은, 그 금속을 계속 돌려야 하는 신앙이다.", "In the community that grew around Go Ye-jin, faith came to be counted in implanted parts. Each part still needs maintenance, power and spares. A faith that counts the metal in the body is a faith that has to keep that metal running.", { source: "society" }),
    ],
  },
  {
    id: "tancheon", act: { ko: "5막 · 세례와 아크", en: "Act V · Baptism and the Arc" }, title: { ko: "탄천에서 그 곁에", en: "At Tancheon, at His Side" },
    place: { ko: "탄천 쪽 대피소", en: "The shelters along Tancheon" }, year: "2120", bg: "suseo",
    lines: [
      N("v6-tan-01", "2120년, 탄천 쪽 대피소들과의 교섭 자리에서 지연희가 고예진 곁에 섰다. 그때부터 그는 고예진의 경호원이었고, 지금까지 그 자리를 지킨다.", "In 2120, at a negotiation with the shelters along Tancheon, Ji Yeon-hui took her stand at Go Ye-jin's side. She has been his bodyguard ever since, and she holds that place still.", { caption: { ko: "2120 · 지연희", en: "2120 · Ji Yeon-hui" } }),
      S("v6-tan-02", "iyen", "지연희를 뵈면 말을 걸지 않는 게 좋아요. 여섯 해째 한 사람 곁에 서 있는 분이니까요.", "If you ever see Ji Yeon-hui, best not to make small talk. That is someone who has stood at one man's side for six years.", { cast: ["iyen"] }),
    ],
  },
  {
    id: "arc", act: { ko: "5막 · 세례와 아크", en: "Act V · Baptism and the Arc" }, title: { ko: "아크라는 이름", en: "The Name of Arc" },
    place: { ko: "강남 4구", en: "The four Gangnam districts" }, year: "2122 무렵", bg: "suseo",
    lines: [
      N("v6-arc-01", "고예진이 서울 밖의 전쟁 기계 일부를 멈추자, 수십 년간 봉인된 문 뒤에 살던 강남 대피소들이 소문을 듣고 찾아왔다. 2122년 무렵, 강남 4구가 아크라는 이름 아래 하나가 됐다.", "When Go Ye-jin stopped some of the war machines outside the city, the Gangnam shelters that had lived for decades behind sealed doors heard the news and came. Around 2122, the four Gangnam districts became one under the name Arc.", { caption: { ko: "2122 무렵 · 아크", en: "Around 2122 · the Arc" } }),
      N("v6-arc-02", "아크는 자유도시에서 갈라져 나왔다. 신도들은 고예진을 메시아라 부르고, 그의 직위는 교주다. 통치는 교주를 정점으로 한 가문의 위계를 따른다.", "The Arc split away from the Free City. The faithful call Go Ye-jin the Messiah; his office is the Hierophant. Rule follows a hierarchy of clans with the Hierophant at its head."),
      N("v6-arc-03", "네 구는 저마다 문이라 불리는 영역이고, 문의 수장은 봉인지기다. 봉인지기는 교주가 가문의 혈통에서 임명한다.", "Each of the four districts is a holding called a Gate, and each Gate is held by a Seal-Keeper, appointed by the Hierophant from the clan bloodlines.", { source: "arcs" }),
      N("v6-arc-04", "아크의 땅은 강남의 서초·강남·송파·강동이다. 명동이 아니다. 명동은 강 북쪽에 있고, 정부의 등록 사무소가 모인 거리다.", "The Arc's land is Gangnam: Seocho, Gangnam, Songpa and Gangdong. Not Myeongdong. Myeongdong lies north of the river — the street where the Government's registry offices sit.", { caption: { ko: "아크 · 강남 4구 (명동 아님)", en: "Arc · the four Gangnam districts (not Myeongdong)" } }),
      N("v6-arc-05", "신도가 죽으면 뇌를 봉인해 성소에 모신다. 봉인된 뇌는 최초의 AI의 기억이 된다.", "When a believer dies, the brain is sealed and set in the sanctuary. The sealed brains become the memory of the First AI."),
      S("v6-arc-06", "iyen", "강남 역에 가면 옷부터 읽게 돼요. 이식한 부위는 보이고 닿을 수 있어야 하거든요. 오른쪽 깃에 부위 하나마다 줄 하나씩 수를 놓아요.", "In the Gangnam stations you learn to read the clothes first. A fitted part must stay visible and reachable — and the right collar carries one embroidered bar for each part.", { cast: ["iyen"], source: "society" }),
      S("v6-arc-07", "iyen", "아크는 세 세력 가운데 가장 젊어요. 살아 있는 한 사람을 중심으로 자란 유일한 세력이기도 하고요.", "The Arc is the youngest of the three factions — and the only one that grew up around one living man.", { cast: ["iyen"] }),
    ],
  },
  {
    id: "now", act: { ko: "6막 · 현재", en: "Act VI · Now" }, title: { ko: "세 권력, 하나의 강", en: "Three Powers, One River" },
    place: { ko: "2126년 겨울", en: "The winter of 2126" }, year: "2126", bg: "namsan",
    lines: [
      N("v6-now-01", "그리고 지금, 2126년 겨울. 세 번째 급수계약이 다가온다. 정부는 장부로 국민을 세고, 유니온은 거래할 수 있는 것을 세고, 아크는 이식한 부위로 신도를 센다.", "And now, the winter of 2126. The third water-supply contract approaches. The Government counts its citizens by ledger; the Union counts what can be traded; the Arc counts its faithful by implanted parts.", { caption: { ko: "장부 · 거래 · 세례", en: "Ledger · trade · baptism" } }),
      N("v6-now-02", "이번 겨울 아크에서는 첫해의 세례자 몇이 사라지고 있고, 고예진은 그 까닭을 알아내라고 지연희를 보냈다.", "This winter, some of the newly baptised have been disappearing from the Arc, and Go Ye-jin has sent Ji Yeon-hui to find out why.", { source: "society" }),
      N("v6-now-03", "서울 밖에서는 기계들이 여전히 마지막 명령을 따르고, 백 년 전에 시작된 겨울이 여전히 유일한 계절이다. 사람들은 끝나기를 기다리지 않는다. 역에서 살고, 추위 속에서 일한다.", "Outside the city the machines still follow their last orders, and the winter that began a hundred years ago is still the only season. People no longer wait for it to end. They live in the stations and work in the cold."),
      S("v6-now-04", "iyen", "자, 여기까지가 백 년이에요. 이 도시를 셋으로 나눈 세 가지 방식, 직접 보러 가 볼까요? 어디로 갈지는 당신이 골라요.", "So — that's the hundred years. Shall we go and see for ourselves the three ways this city was divided? You pick where we go.", { cast: ["iyen"] }),
    ],
  },
];

export const CHOICE = {
  id: "crossroad",
  title: { ko: "어디로 갈까", en: "Which way?" },
  place: { ko: "환승 통로", en: "Transfer corridor" }, year: "2126", bg: "tunnel" as BgId,
  prompt: S("v6-cho-01", "iyen", "셋 가운데 어디부터 볼래요? 어느 쪽이든 백 년이 다르게 보여요.", "Which of the three shall we see first? Each one shows you a different hundred years.", { cast: ["iyen"] }),
  options: [
    { id: "registry" as ChoiceId, speaker: "k1007" as SpeakerId, label: { ko: "정부 · 명동", en: "Government · Myeongdong" }, line: { ko: "김연규의 등록 사무소에서 장부가 사람을 세는 방식을 듣는다.", en: "Hear how the ledgers count people, at Kim Yeon-gyu's registry office." } },
    { id: "works" as ChoiceId, speaker: "k998" as SpeakerId, label: { ko: "자유도시 · 관악", en: "Free City · Gwanak" }, line: { ko: "이일섭의 제1분공방에서 폴리스가 일로 도시를 돌리는 법을 본다.", en: "See how a polis runs its city by work, at I Ilseop's First Branch Workshop." } },
    { id: "watch" as ChoiceId, speaker: "k1009" as SpeakerId, label: { ko: "강남 · 무전 당직", en: "Gangnam · radio watch" }, line: { ko: "신종목의 무전 당직에서 강남의 문을 엿본다.", en: "Glimpse the Gates of Gangnam from Sin Jong-mok's radio watch." } },
  ],
};

export const ENDINGS: Record<ChoiceId, { title: { ko: string; en: string }; bg: BgId; lines: StoryLine[] }> = {
  registry: {
    title: { ko: "결말 · 명동 등록 사무소", en: "Ending · The Myeongdong Registry" }, bg: "archive",
    lines: [
      S("v6-end-reg-01", "k1007", "여기가 명동 등록 사무소요. 장부에 오르면 배급과 열과 시술소 자리가 생기고, 지워지면 없는 사람이 되오.", "This is the Myeongdong registry. On the ledger, you get rations, heat and a place in the clinic queue; struck off it, you become no one.", { cast: ["iyen", "k1007"], source: "society" }),
      S("v6-end-reg-02", "iyen", "북쪽에서는 진짜 모피 모자가 상원의원 가문의 표지예요. 잘못 쓰고 가면 큰일 나니까, 가기 전에 알려 줄게요.", "In the north, a real fur hat marks a Senator's house. Wear one by mistake and it means trouble — I'll warn you before we go.", { cast: ["iyen", "k1007"], source: "society" }),
    ],
  },
  works: {
    title: { ko: "결말 · 관악 제1분공방", en: "Ending · The First Branch Workshop" }, bg: "granary",
    lines: [
      S("v6-end-wks-01", "k998", "아, 잠깐만요. 이것만 적고요. 이일섭입니다. 관악의 아르콘이에요. 이 밭은 공방 일에 쓰는 밭이지, 가문 땅이 아니에요.", "Oh, one moment — let me write this down. I'm I Ilseop, the Archon of Gwanak. These fields serve the workshop's work; they are not family land.", { cast: ["iyen", "k998"] }),
      S("v6-end-wks-02", "iyen", "아르콘은 시민회가 뽑는 자리예요. 태어나는 게 아니라요. 폴리스에서는 그게 보통이에요.", "An Archon is elected by the citizens' assembly — not born into it. In a polis, that's simply how it works.", { cast: ["iyen", "k998"], source: "arcs" }),
    ],
  },
  watch: {
    title: { ko: "결말 · 논현2동 무전 당직", en: "Ending · The Radio Watch at Nonhyeon 2-dong" }, bg: "platform",
    lines: [
      S("v6-end-wat-01", "k1009", "주파수는 건드리지 말고요. 응답이 오면 시간이랑 이름만 적어 주세요. 백야, 백야. 수서 응답 바랍니다.", "Don't touch the frequency. If anyone answers, just write down the time and the name. Baekya, Baekya. Suseo, please respond.", { cast: ["iyen", "k1009"], source: "profile" }),
      S("v6-end-wat-02", "iyen", "신종목 씨는 강남에 살지만 아크 소속은 아니에요. 강남에 사는 사람이 다 아크인 건 아니거든요.", "Mr. Sin lives in Gangnam, but he doesn't belong to the Arc. Not everyone living in Gangnam does.", { cast: ["iyen", "k1009"] }),
    ],
  },
};

export const CODA: StoryLine[] = [
  N("v6-coda-01", "세 세력은 백 년을 각자 다르게 기억한다. 정부는 장부의 이야기로, 자유도시는 일의 이야기로, 아크는 긴 기다림으로 기억한다. 아크의 이야기가 셋 가운데 가장 젊다.", "The three factions remember the century each in their own way: the Government as a story of ledgers, the Free City as a story of work, the Arc as a long waiting. The Arc's is the youngest of the three tellings.", { caption: { ko: "세 가지 기억", en: "Three memories" } }),
  N("v6-coda-02", "하나만은 같이 말한다. 겨울은 끝나지 않는다. 새로 만들어지는 것은 없다. 모든 기계와 탄과 부품은 과거가 남긴 빚이다. 그리고 사람들은 무엇이든 돌아가게 하는 사람을 따른다.", "On one thing they all agree: the winter does not end. Nothing new is made. Every machine, round and part is a debt the past left behind. And people follow whoever can make anything run again."),
  N("v6-coda-03", "죽은 케이블 하나를 따라간 전선공이 신앙의 중심이 되기까지, 백 년이 필요했다. 그리고 그 겨울은 아직 계속된다.", "It took a hundred years for a linesman who followed one dead cable to become the centre of a faith. And that winter is still going on."),
  S("v6-open-wiki-01", "narrator", "서울 지하철 왕조(서울:전국)는 누구나 참여할 수 있는 오픈 위키입니다. 세계관을 읽는 데서 그치지 않고, 새로운 설정을 제안하거나 인물을 소개하며 함께 내용을 보완할 수 있습니다.", "Seoul Metro Dynasties is an open wiki that anyone can take part in. You can go beyond reading: propose additions to the setting, introduce characters and help develop its content."),
  S("v6-open-wiki-02", "narrator", "이 세계관으로 여러분의 게임을 만들어도 좋습니다. 프로젝트 소유 콘텐츠는 출처와 이용 조건, 변경 사항을 표시하면 각색과 상업적 이용도 가능합니다. 외부 자료와 실존 인물의 이름·초상에는 별도 조건이 적용됩니다.", "You can also make your own games in this setting. Project-owned content permits adaptation and commercial use with attribution, a link to its terms and disclosure of changes. External materials and real people's names and likenesses have separate requirements."),
  S("v6-open-wiki-03", "narrator", "위키에서 세계관과 인물을 살펴보고, 여러분의 이야기로 참여해 주세요. 새로운 기여는 제출과 검토를 거쳐 공식 위키에 반영됩니다.", "Explore the setting and its people in the wiki, and add your own stories. New contributions enter the official wiki through submission and review."),
];

export const WIKI_URL = "https://sss.linalab.io/wiki";
