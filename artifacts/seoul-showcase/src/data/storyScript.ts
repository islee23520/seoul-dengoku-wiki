/**
 * 서울:전국 — 겨울의 연대기 (Motion Storybook VN) · story script v6 (v4 canon)
 *
 * Every story line lives here. Lines written for v6 carry the `v6-` prefix. A few
 * prologue lines keep their older ids (v3-pro-01, v3-pro-02, v4-pro-03, v3-pro-04)
 * and the closing open-wiki lines keep their `v4-open-` ids.
 *
 * Premise (docs/CANON-BIBLE.md v4): 2126 winter, about a century after the Great
 * Blackout. The First AI answered that humanity must shrink and brought the winter;
 * it killed nobody directly. People live in subway stations and only as many
 * survived as a station could hold. Three factions (Government, Free Cities, Arc)
 * each hold something the others lack. Depth of residence shows class.
 *
 * Character dialogue is a fictional adaptation (not approved quotation) written
 * only from the public profile facts and canon; it is not a canonical quotation.
 * Point of view (CANON-BIBLE 2.0.1, owner 2026-11-18): the main story is told from three
 * protagonists' points of view: Kim Yeongyu (Government), I Ilseop (Free Cities) and
 * Go Ye-jin (Arc). Iyen is the courier who carries one message to each of them; acts II-IV
 * are seen from the receiving leader's side, act I and the interlude are chronicle narration
 * outside any POV, the choice picks whose eyes to follow, and each ending belongs to that leader.
 *
 * Open items (why doctors and officers sit on one side only, whether winter is
 * permanent, who holds the upper ranks) are deliberately left unanswered.
 */

export type SpeakerId = "narrator" | "iyen" | "k1007" | "k1003" | "k1009" | "k1008" | "k998" | "k1018";
export type BgId = "surface" | "namsan" | "tunnel" | "archive" | "railyard" | "platform" | "suseo" | "granary";
export type ChoiceId = "government" | "free" | "arc";

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
    title: { ko: "수행 전령 · 조재표 일행", en: "Attendant courier, Jo Jaepyo's party" }, rank: "미등록", state: "무소속",
    portrait: "portraits/person-1004.webp", tint: "hsl(14 70% 62%)",
  },
  k1007: {
    id: "k1007", personId: "person-1007", characterId: "K1007", name: { ko: "김연규", en: "Kim Yeongyu" },
    title: { ko: "정부 대통령", en: "President of the Government" }, clan: "경주 김씨", rank: "대통령", state: "정부",
    portrait: "portraits/person-1007.webp", tint: "hsl(214 55% 66%)",
  },
  k1003: {
    id: "k1003", personId: "person-1003", characterId: "K1003", name: { ko: "조재표", en: "Jo Jaepyo" },
    title: { ko: "귀환 일행 지휘자", en: "Leader of the return party" }, clan: "창녕 조씨", rank: "일반 시민", state: "무소속",
    portrait: "portraits/person-1003.webp", tint: "hsl(152 40% 58%)",
  },
  k1009: {
    id: "k1009", personId: "person-1009", characterId: "K1009", name: { ko: "신종목", en: "Shin Jong-mok" },
    title: { ko: "귀환망 현장 계약자 · 호출부호 백야", en: "Return-network field contractor, callsign Baekya" }, clan: "고령 신씨", rank: "품계 없음", state: "정부",
    portrait: "portraits/person-1009.webp", tint: "hsl(36 75% 62%)",
  },
  k1008: {
    id: "k1008", personId: "person-1008", characterId: "K1008", name: { ko: "민웅기", en: "Min Woong-gi" },
    title: { ko: "이일섭의 측근 · 통신 정비·배분 담당", en: "Aide to I Ilseop, comms repair and distribution" }, clan: "여흥 민씨", rank: "측근", state: "자유도시",
    portrait: "portraits/person-1008.webp", tint: "hsl(186 45% 60%)",
  },
  k998: {
    id: "k998", personId: "person-0998", characterId: "K998", name: { ko: "이일섭", en: "I Ilseop" },
    title: { ko: "자유도시 이사회장 · 신경 연결 의술 가문 후계", en: "Chair of the Board of the Free Cities, heir of a neural-link medical house" }, clan: "전의 이씨", rank: "이사회장", state: "자유도시",
    portrait: "portraits/person-0998.webp", tint: "hsl(48 60% 62%)",
  },
  k1018: {
    id: "k1018", personId: "person-1018", characterId: "K1018", name: { ko: "고예진", en: "Go Ye-jin" },
    title: { ko: "아크 교주 · 엔지니어 출신", en: "Hierophant of the Arc, former engineer" }, rank: "교주", state: "아크",
    tint: "hsl(280 40% 70%)",
  },
};

export const PORTRAIT_CREDIT = {
  ko: "초상: 서울:전국 위키 공개 초상 (person-0998·1003·1004·1007·1008·1009) · art-proposal 상태, 정본 승인 아님",
  en: "Portraits: published wiki portraits (person-0998, 1003, 1004, 1007, 1008, 1009) · art-proposal status, not canon-approved",
};

export interface StoryLine {
  id: string;
  speaker: SpeakerId;
  ko: string;
  en: string;
  /** Characters on stage; the speaker is lit, the rest dim. */
  cast?: SpeakerId[];
  source?: "annals" | "faction" | "profile";
  /** Margin caption, shown inline. */
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
    id: "blackout", act: { ko: "서장", en: "Prologue" }, title: { ko: "대정전", en: "The Great Blackout" },
    place: { ko: "지상 서울", en: "Seoul, above ground" }, year: "약 2026", bg: "surface",
    lines: [
      N("v3-pro-01", "약 2026년, 최초의 AI가 인류가 줄어야 한다고 답하고 겨울을 내렸다. 도시의 전력이 끊겼다.", "Around 2026 the First AI answered that humanity must shrink, and brought the winter. The city lost power."),
      N("v3-pro-02", "사람들은 그 일을 대정전이라고 부른다. 남은 설비는 당직자들이 손으로 돌렸다.", "People call it the Great Blackout. What equipment was left, the people on duty ran by hand."),
      N("v6-pro-03", "최초의 AI는 아무도 직접 죽이지 않았다. 겨울을 만들었을 뿐이다.", "The First AI killed no one directly. It only made the winter."),
      N("v6-pro-04", "겨울이 오자 사람들은 지하철역으로 내려갔다. 역이 품을 수 있는 만큼만 살아남았다.", "When the winter came, people went down into the subway stations. Only as many survived as a station could hold.", { caption: { ko: "역이 품을 수 있는 만큼", en: "As many as a station could hold" } }),
    ],
  },
  {
    id: "stairs", act: { ko: "서장", en: "Prologue" }, title: { ko: "계단 아래", en: "Down the Stairs" },
    place: { ko: "역 계단", en: "Station stairs" }, year: "2126 겨울", bg: "tunnel",
    lines: [
      N("v6-pro-05", "그리고 백 년이 지났다. 2126년 겨울, 서울 사람들은 아직 역 안에서 산다.", "A hundred years have passed. In the winter of 2126, Seoul's people still live inside its stations."),
      N("v6-pro-07", "이 겨울의 이야기는 세 사람의 눈으로 이어진다. 정부의 대통령 김연규, 자유도시들의 이사회장 이일섭, 아크의 교주 고예진이다.", "This winter's story is told through three pairs of eyes: Kim Yeongyu, President of the Government; I Ilseop, Chair of the Board of the Free Cities; and Go Ye-jin, Hierophant of the Arc.", { caption: { ko: "세 주인공 · 세 시점", en: "Three protagonists, three points of view" } }),
      S("v4-pro-03", "iyen", "저는 이연이에요. 전령으로 일해요. 오늘 제 가방에는 전갈이 세 통 들었어요.", "I'm Iyen. I work as a courier. Today there are three messages in my bag.", { cast: ["iyen"], source: "profile" }),
      S("v6-pro-06", "iyen", "대통령, 이사회장, 교주에게 한 통씩이에요. 조재표 대장 일행이 바깥에서 돌아오기 전에 다 전해야 해요.", "One each for the President, the Chair and the Hierophant. I have to deliver them all before Captain Jo Jaepyo's party gets back from outside.", { cast: ["iyen"], source: "profile" }),
      S("v3-pro-04", "iyen", "장갑부터 끼자. 계단이 얼었어. 일단 아래로.", "Gloves first. The stairs are icy. Down we go.", { cast: ["iyen"] }),
    ],
  },
  {
    id: "depth", act: { ko: "1막 · 깊이가 계급", en: "Act I · Depth Is Class" }, title: { ko: "지하 3층과 지상 1층", en: "Third Basement and Ground Floor" },
    place: { ko: "역 안", en: "Inside the station" }, year: "2126 겨울", bg: "tunnel",
    lines: [
      N("v6-a1-01", "지하 3층은 셔터 안쪽이라 따뜻하다. 땅속 열도 올라온다.", "The third basement level is warm, inside the shutter, and heat rises from the ground.", { source: "faction", caption: { ko: "지하는 깊을수록 상류 · 지상은 높을수록 하층", en: "Deeper underground is higher; higher above ground is lower" } }),
      N("v6-a1-02", "위로 올라갈수록 춥고 바람이 세며, 드론에도 드러난다. 위에 사는 사람일수록 가진 것이 적다.", "The higher you go, the colder and windier it gets, and the more exposed to drones. The higher up someone lives, the less they own.", { source: "faction" }),
      N("v6-a1-03", "셔터를 내리면 밖에서 들어오지 못하고, 출구를 지키기도 쉽다. 그래서 먼저 세력을 세운 사람들이 깊은 자리를 먼저 차지했다.", "Once the shutter is down nobody gets in from outside, and the exits are easy to guard. So the people who founded each faction took the deep places first.", { source: "faction" }),
      N("v6-a1-04", "역을 통째로 가진 사람이 역장이다. 역장 여럿을 거느리면 본부장이고, 그 위로도 이어진다. 역이 없는 사람은 모두 일반 시민이다.", "Whoever owns a whole station is a Stationmaster. Holding several makes a Division Chief, and the ranks go on above that. People with no station are all ordinary citizens.", { source: "faction", caption: { ko: "역을 가진 사람 = 역장", en: "Owning a station makes a Stationmaster" } }),
      N("v6-a1-05", "서울에서 가장 작은 영토 단위는 구가 아니라 역이다. 역은 지하철역과 그 위의 지상 성채 영역을 함께 이른다.", "The smallest territory in Seoul is not a district but a station: the subway station together with the surface stronghold above it.", { source: "faction" }),
    ],
  },
  {
    id: "government", act: { ko: "2막 · 정부 · 김연규의 시점", en: "Act II · The Government · Kim Yeongyu's POV" }, title: { ko: "전차는 있고 의사는 없다", en: "Tanks, but No Doctors" },
    place: { ko: "청와대 쪽 · 한강 북쪽", en: "Near the Blue House · north of the Han" }, year: "2126 겨울", bg: "archive",
    lines: [
      N("v6-a2-01", "한강 북쪽 14구는 정부의 땅이다. 대통령은 김연규이고, 그 자리는 종신이다. 그 아래로 청장, 국장, 본부장, 역장이 이어진다.", "The fourteen districts north of the Han are the Government's land. The President is Kim Yeongyu, and the office is held for life. Below him run Commissioners, Bureau Chiefs, Division Chiefs and Stationmasters.", { source: "faction", caption: { ko: "정부 · 한강 북쪽 14구", en: "Government · fourteen districts north of the Han" } }),
      S("v6-a2-02", "iyen", "대통령님, 전갈이에요. 강 건너에서 온 거예요.", "Mr. President, a message for you. It came from across the river.", { cast: ["iyen", "k1007"] }),
      S("v6-a2-03", "k1007", "앉으세요. 정부는 장부에 기록된 사람만 국민으로 인정합니다. 보낸 사람이 우리 장부에 있는지부터 보겠습니다.", "Sit down. The Government recognizes as citizens only those written in its ledger. First I'll see whether the sender is in our ledger.", { cast: ["iyen", "k1007"], source: "profile" }),
      S("v6-a2-04", "k1007", "전차는 우리에게 있습니다. 장교도, 중화기도 있습니다. 정면으로 맞붙는 싸움이라면 우리가 강합니다.", "We have the tanks. We have the officers and the heavy weapons. In a head-on fight, we are the strong ones.", { cast: ["iyen", "k1007"], source: "faction" }),
      S("v6-a2-05", "k1007", "의사는 없습니다. 대학병원 건물은 여럿 쥐고 있지만, 응급 처치까지가 우리 한계입니다. 그래서 이긴 싸움에서도 사람이 돌아오지 않습니다.", "We have no doctors. We hold several university hospital buildings, but emergency first aid is our limit. So even after the battles we win, people don't come back.", { cast: ["iyen", "k1007"], source: "faction", caption: { ko: "중상자는 돌아오지 못한다", en: "The badly wounded do not come back" } }),
      S("v6-a2-06", "iyen", "그러면 크게 다친 사람은 못 돌아오는 거네요.", "So the badly wounded just don't return.", { cast: ["iyen", "k1007"] }),
      S("v6-a2-07", "k1007", "흰십자단이 응급 처치를 하고 환자를 옮깁니다. 거기까지입니다.", "The White Cross gives first aid and carries the patients. That is as far as it goes.", { cast: ["iyen", "k1007"], source: "faction" }),
      S("v6-a2-08", "iyen", "이 전갈, 강 건너 의사들 쪽에서 왔어요.", "This message comes from the doctors' side, across the river.", { cast: ["iyen", "k1007"] }),
      S("v6-a2-09", "k1007", "강 건너는 우리 장부 밖입니다. 그래도 읽겠습니다. 의사가 없는 쪽은 우리니까요.", "Across the river is outside our ledger. Still, I'll read it. We are the side without doctors.", { cast: ["iyen", "k1007"], source: "faction" }),
    ],
  },
  {
    id: "free-cities", act: { ko: "3막 · 자유도시들 · 이일섭의 시점", en: "Act III · The Free Cities · I Ilseop's POV" }, title: { ko: "의사는 있고 장교는 없다", en: "Doctors, but No Officers" },
    place: { ko: "관악 · 남태령 너머", en: "Gwanak · beyond Namtaeryeong" }, year: "2126 겨울", bg: "granary",
    lines: [
      N("v6-a3-01", "한강 남서쪽 7구는 자유도시들의 땅이다. 각자 선 독립 도시들이고, 묶어 부르는 이름은 없다. 그들은 지배를 거부하는 것이 자유라고 말한다.", "The seven districts southwest of the Han belong to the Free Cities. They are independent cities, each on its own, and there is no name that binds them. They say that refusing to be ruled is what freedom means.", { source: "faction", caption: { ko: "자유도시들 · 한강 남서쪽 7구", en: "Free Cities · seven districts southwest of the Han" } }),
      S("v6-a3-02", "iyen", "이사회장님, 전갈이요. 바쁘세요?", "Chair, a message for you. Are you busy?", { cast: ["iyen", "k998"] }),
      S("v6-a3-03", "k998", "고마워요, 이연. 다들 저를 이사회장이라고 부르지만, 저는 신경 연결 의술을 잇는 집안의 후계일 뿐이에요. 밭과 공방은 집안 부업이고요.", "Thank you, Iyen. Everyone calls me Chair of the Board, but I'm only the heir of a family that carries on neural-link medicine. The field and the workshop are our family's side work.", { cast: ["iyen", "k998"], source: "profile" }),
      S("v6-a3-04", "k998", "자유도시에는 의사가 있습니다. 서울의 의사와 신경 연결 시술자는 거의 다 이곳에 있어요. 사람과 식량이 있어서 오래 버팁니다.", "The Free Cities have doctors. Nearly all of Seoul's doctors and neural-link practitioners are here. We have people and food, so we can hold out for a long time.", { cast: ["iyen", "k998"], source: "faction" }),
      S("v6-a3-05", "k998", "하지만 장교는 없습니다. 징병제로 받은 기초 훈련 덕에 소총을 들고 정비도 하지만, 전차와 중화기를 지휘할 사람이 없어요.", "But we have no officers. Conscript basic training lets us carry rifles and keep them maintained, but there is nobody to command tanks and heavy weapons.", { cast: ["iyen", "k998"], source: "faction", caption: { ko: "의사는 있고 장교는 없다", en: "Doctors, but no officers" } }),
      S("v6-a3-06", "iyen", "아무도 지배하지 않는 게 자유도시잖아요. 그런데 왜 이사회장이 계세요?", "Free Cities don't let anyone rule, right? So why is there a Chair?", { cast: ["iyen", "k998"] }),
      S("v6-a3-07", "k998", "저희 집안은 계급으로는 다른 이사와 같은 이사예요. 그런데 사람들은 우리가 이끌어 주길 바랍니다. 지배받기는 싫다면서 이끌어 달라고 하죠. 그래서 대대로 이사회장입니다.", "By rank, my family is a Director like any other. Yet people want us to lead. They refuse to be ruled, and still ask us to lead. That is why we have been Chair for generations.", { cast: ["iyen", "k998"], source: "faction", caption: { ko: "자유도시의 모순", en: "The contradiction of the Free Cities" } }),
      S("v6-a3-08", "k1008", "이사회장님, 부품이 또 모자랍니다. 다들 지배는 싫다면서, 이럴 땐 누군가 결정해 달라고 하네요.", "Chair, we're short of parts again. Everyone says they don't want to be ruled, yet at times like this they want somebody to decide.", { cast: ["k998", "k1008"], source: "profile" }),
    ],
  },
  {
    id: "arc", act: { ko: "4막 · 아크 · 고예진의 시점", en: "Act IV · The Arc · Go Ye-jin's POV" }, title: { ko: "호출부호 백야", en: "Callsign Baekya" },
    place: { ko: "강남 · 선정릉에서 수서까지", en: "Gangnam · from Seonjeongneung to Suseo" }, year: "2126 겨울", bg: "suseo",
    lines: [
      N("v6-a4-01", "한강 남쪽 강남 4구는 아크의 땅이다. 아크는 자유도시에서 갈라져 나왔고, 이전의 모든 종교를 대신한다. 최상단은 교주 고예진이다.", "The four Gangnam districts south of the Han belong to the Arc. It split off from the Free Cities and replaced every earlier religion. Its head is the Hierophant, Go Ye-jin.", { source: "faction", caption: { ko: "아크 · 강남 4구", en: "Arc · four Gangnam districts" } }),
      N("v6-a4-02", "신도는 몸의 한 부분을 기계로 바꾼다. 그것을 세례라고 부른다. 아크는 고대 데이터센터 소프트웨어를 쥐고 있다.", "Believers replace a part of their body with a machine. This is called baptism. The Arc holds ancient data-center software.", { source: "faction" }),
      S("v6-a4-10", "iyen", "교주님, 전갈이에요. 선정릉 쪽 무전도 같이 들어오고 있어요.", "Hierophant, a message for you. The radio from Seonjeongneung is coming in too.", { cast: ["iyen", "k1018"] }),
      S("v6-a4-11", "k1018", "말하는 사람의 목소리와 내용이 맞는지부터 듣겠습니다. 손해와 이익은 그다음에 따지죠.", "First I'll listen for whether the voice matches the words. Gains and losses come after that.", { cast: ["iyen", "k1018"], source: "profile" }),
      S("v6-a4-04", "k1009", "백야, 백야. 선정릉에서 수서. 응답 바랍니다.", "Baekya, Baekya. Seonjeongneung calling Suseo. Please respond.", { cast: ["k1018", "k1009"], source: "profile" }),
      S("v6-a4-05", "k1009", "교주님, 신종목입니다. 호출부호는 백야고요. 호위와 탐사 계약 일을 하면서 이 구간 무전을 잡고 있습니다.", "Hierophant, this is Shin Jong-mok, callsign Baekya. I take escort and survey contracts, and I'm handling the radio on this stretch.", { cast: ["k1018", "k1009"], source: "profile" }),
      S("v6-a4-06", "iyen", "아크 신도는 세례를 받으면 몸 한 부분이 기계가 된다던데, 맞아요?", "I heard that when Arc believers are baptized, part of their body becomes a machine. Is that right?", { cast: ["iyen", "k1009"] }),
      S("v6-a4-07", "k1009", "맞아요. 신도들은 고예진 교주를 메시아라고 불러요. 다만 아크가 붙이는 기계 몸은 단순한 명령만 받아요.", "That's right. The believers call the Hierophant, Go Ye-jin, the Messiah. But the machine bodies the Arc fits take only simple commands.", { cast: ["iyen", "k1009"], source: "faction" }),
      S("v6-a4-08", "iyen", "아크 소프트웨어는 남의 기계도 켜고 끈다면서요?", "I heard the Arc's software can switch other people's machines on and off.", { cast: ["iyen", "k1009"] }),
      S("v6-a4-09", "k1009", "정부의 드론이나 자유도시의 의료 로봇은 그게 있어야 제대로 돌아요. 그래서 아크가 그 힘을 쓸 때마다 다들 의심해요. 백도어가 있는 건 아닌가 하고요.", "The Government's drones and the Free Cities' medical robots need it to run properly. So every time the Arc uses that power, everyone gets suspicious. They wonder whether there's a backdoor.", { cast: ["iyen", "k1009"], source: "faction", caption: { ko: "켜고 끄는 힘 · 백도어 불신", en: "The power to switch on and off · distrust of a backdoor" } }),
      S("v6-a4-12", "k1018", "저는 전력망과 설비를 고치던 엔지니어였습니다. 지금도 무엇이 멈추면 원인부터 찾습니다.", "I was an engineer who repaired power grids and equipment. Even now, when something stops, I look for the cause first.", { cast: ["iyen", "k1018"], source: "profile" }),
    ],
  },
  {
    id: "outside", act: { ko: "막간 · 바깥 기계", en: "Interlude · The Machines Outside" }, title: { ko: "불 꺼", en: "Lights Off" },
    place: { ko: "서울 경계 · 차량기지 입구", en: "Seoul's edge · the depot entrance" }, year: "2126 겨울", bg: "railyard",
    lines: [
      N("v6-a5-01", "서울 밖에는 대정전 때 쓰던 기계들이 마지막 명령을 되풀이하며 돌아다닌다. 그것들을 만든 사람은 없고, 남은 것은 명령뿐이다.", "Outside Seoul, machines from the Great Blackout still roam, repeating their last orders. No one who built them remains. Only the orders are left.", { source: "faction" }),
      S("v6-a5-02", "iyen", "대장! 돌아오셨네요. 바깥 길은 어땠어요?", "Captain! You're back. How was the road outside?", { cast: ["iyen", "k1003"] }),
      S("v6-a5-03", "k1003", "조재표다. 귀환 일행을 이끌고 방금 들어왔다. 길 위에서 기계를 봤다. 같은 길을 돌면서 마지막 명령만 되풀이하는 것들이다.", "Jo Jaepyo. I lead the return party, and we've just come in. We saw machines on the road. They circle the same path and repeat nothing but their last order.", { cast: ["iyen", "k1003"], source: "profile" }),
      S("v6-a5-04", "iyen", "손전등 켤까요? 너무 어두워서요.", "Should I switch on the flashlight? It's too dark.", { cast: ["iyen", "k1003"] }),
      S("v6-a5-05", "k1003", "불 꺼. 저것들은 빛을 따라온다.", "Lights off. Those things follow light.", { cast: ["iyen", "k1003"], caption: { ko: "빛과 열에 끌려온다", en: "Drawn to light and heat" } }),
      S("v6-a5-06", "k1003", "열도 마찬가지다. 난로는 덮어 두고, 숨 낮추고 내 뒤로 붙어.", "Heat does the same. Cover the stove, keep your breath low, and stay behind me.", { cast: ["iyen", "k1003"] }),
      S("v6-a5-07", "iyen", "알겠어요. 불 끄고 대장 뒤에 바짝 붙을게요.", "Got it. Lights off, and I'll stay right behind you, Captain.", { cast: ["iyen", "k1003"] }),
    ],
  },
];

export const CHOICE = {
  id: "crossroad",
  title: { ko: "누구의 눈으로 볼까", en: "Whose Eyes?" },
  place: { ko: "환승 통로", en: "Transfer corridor" }, year: "2126 겨울", bg: "tunnel" as BgId,
  prompt: S("v6-cho-01", "iyen", "전갈은 다 전했어요. 정부, 자유도시들, 아크. 이 겨울을 누구의 눈으로 따라갈지 골라요. 대통령, 이사회장, 교주 가운데 한 사람이에요.", "All three messages are delivered. The Government, the Free Cities, the Arc: choose whose eyes you'll follow through this winter. The President, the Chair or the Hierophant.", { cast: ["iyen"] }),
  options: [
    { id: "government" as ChoiceId, speaker: "k1007" as SpeakerId, label: { ko: "정부", en: "Government" }, line: { ko: "대통령 김연규의 눈으로, 전차와 장교를 가진 정부를 따라간다.", en: "Follow the Government, which has the tanks and officers, through President Kim Yeongyu's eyes." } },
    { id: "free" as ChoiceId, speaker: "k998" as SpeakerId, label: { ko: "자유도시들", en: "Free Cities" }, line: { ko: "이사회장 이일섭의 눈으로, 의사를 가진 자유도시들을 따라간다.", en: "Follow the Free Cities, which have the doctors, through Chair I Ilseop's eyes." } },
    { id: "arc" as ChoiceId, speaker: "k1018" as SpeakerId, label: { ko: "아크", en: "Arc" }, line: { ko: "교주 고예진의 눈으로, 남의 기계를 켜고 끄는 아크를 따라간다.", en: "Follow the Arc, which can switch other people's machines on and off, through Hierophant Go Ye-jin's eyes." } },
  ],
};

export const ENDINGS: Record<ChoiceId, { title: { ko: string; en: string }; bg: BgId; lines: StoryLine[] }> = {
  government: {
    title: { ko: "결말 · 정부", en: "Ending · Government" }, bg: "archive",
    lines: [
      S("v6-end-gov-01", "k1007", "한강 건너에서 연락이 왔습니다. 우리 장교 한 명이 붙잡혀 있고, 몸값을 협상하자고 합니다. 이연, 답신을 들고 협상 자리까지 같이 갑시다.", "A message came from across the Han. One of our officers is being held, and they want to negotiate a ransom. Iyen, bring the reply and come with me to the table.", { cast: ["iyen", "k1007"] }),
      S("v6-end-gov-02", "iyen", "몸값 협상은 서두르면 지는 거예요. 값이 얼마인지부터 들어 봐요.", "You lose a ransom talk by rushing. Let's hear the price first.", { cast: ["iyen", "k1007"] }),
    ],
  },
  free: {
    title: { ko: "결말 · 자유도시들", en: "Ending · Free Cities" }, bg: "granary",
    lines: [
      S("v6-end-free-01", "k998", "의사 한 사람이 어제 돌아오지 않았습니다. 납치일 수 있습니다. 어느 쪽 짓인지는 아직 모릅니다.", "One of our doctors didn't come back yesterday. It may be an abduction. We don't yet know whose doing it is.", { cast: ["iyen", "k998"] }),
      S("v6-end-free-02", "iyen", "그러면 찾으러 가요. 지휘하는 사람은 없어도, 같이 걸어 줄 사람은 있잖아요.", "Then let's go find them. We may have no one to command us, but we have people who'll walk with us.", { cast: ["iyen", "k998"] }),
    ],
  },
  arc: {
    title: { ko: "결말 · 아크", en: "Ending · Arc" }, bg: "platform",
    lines: [
      S("v6-end-arc-01", "k1018", "수서에서 보고가 올라왔습니다. 자유도시에서 넘어온 시술자의 손이 느려졌다고 합니다. 가족이 아직 자유도시에 있다더군요. 태업인지는 아직 판단하지 않겠습니다.", "A report came up from Suseo. The practitioner who crossed over from the Free Cities has slowed down. I'm told his family is still in the Free Cities. I won't decide yet whether it's a slowdown.", { cast: ["iyen", "k1018"] }),
      S("v6-end-arc-02", "iyen", "다그치지 말고 사정부터 들어 봐요. 사람 손이 느려진 데는 이유가 있어요.", "Don't push him. Hear him out first. A person's hands don't slow down for no reason.", { cast: ["iyen", "k1018"] }),
    ],
  },
};

export const CODA: StoryLine[] = [
  N("v6-coda-01", "세 세력은 가진 것이 서로 다르다. 정부에는 장교와 전차가 있고, 자유도시에는 의사가 있고, 아크에는 남의 기계를 켜고 끄는 소프트웨어가 있다.", "The three factions hold different things. The Government has officers and tanks, the Free Cities have doctors, and the Arc has software that switches other people's machines on and off.", { source: "faction", caption: { ko: "세 세력 · 서로 다른 것을 쥔다", en: "Three factions, each holding something different" } }),
  N("v6-coda-02", "어느 쪽도 혼자서는 가진 것을 다 쓰지 못한다. 그래서 사람이 붙잡히고, 몸값이 오가고, 되찾아진다. 2126년 서울의 겨울은 그렇게 흘러간다.", "None of them can use what it holds on its own. So people are taken, ransoms are traded, and some are won back. That is how the winter of 2126 passes in Seoul.", { source: "faction" }),
  S("v4-open-01", "narrator", "서울 지하철 왕조(서울:전국)는 누구나 참여할 수 있는 오픈 위키입니다. 세계관을 읽는 데서 그치지 않고, 새로운 설정을 제안하거나 인물을 소개하며 함께 내용을 보완할 수 있습니다.", "Seoul Metro Dynasties is an open wiki that anyone can participate in. You can go beyond reading: propose additions to the setting, introduce characters and help develop its content."),
  S("v4-open-02", "narrator", "이 세계관으로 여러분의 게임을 만들어도 좋습니다. 프로젝트 소유 콘텐츠는 출처와 이용 조건, 변경 사항을 표시하면 각색과 상업적 이용도 가능합니다. 외부 자료와 실존 인물의 이름·초상에는 별도 조건이 적용됩니다.", "You can also make your own games in this setting. Project-owned content permits adaptation and commercial use with attribution, a link to its terms and disclosure of changes. External materials and real people's names and likenesses have separate requirements."),
  S("v4-open-03", "narrator", "위키에서 세계관과 인물을 살펴보고, 여러분의 이야기로 참여해 주세요. 새로운 기여는 제출과 검토를 거쳐 공식 위키에 반영됩니다.", "Explore the setting and characters in the wiki, and contribute your own stories. New contributions enter the official wiki through submission and review."),
];

export const WIKI_URL = "https://sss.linalab.io/wiki";
