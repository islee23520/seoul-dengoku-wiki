/**
 * 서울:전국 — 겨울의 연대기 (Motion Storybook VN) · story script v3
 *
 * Every voiced line lives here. Line IDs carry the `v3-` prefix so no clip from
 * the retired v1 script (p1, f1, government-m1 ...) can ever be matched.
 *
 * Sources: public wiki profiles person-1003/1004/1007/1009 (owner-authored),
 * Century Annals and Sixteen States articles. Character dialogue is a fictional adaptation (not approved quotation)
 * written built only from those profile facts; it is not a canonical
 * quotation. Narration lines marked `source` restate the annals.
 *
 * Brief corrections applied: blackout about 2026; 조재표 (not 조재포) is a
 * Free Cities union member and return-party leader (not an engineer);
 * 신종목 is a return-network field contractor of Agwan-sa (not a religious
 * leader); the First AI made the winter and killed nobody directly.
 */

export type SpeakerId = "narrator" | "iyen" | "k1007" | "k1003" | "k1009" | "k1008" | "k998";
export type Gender = "female" | "male" | "neutral";
export type BgId = "surface" | "namsan" | "tunnel" | "archive" | "railyard" | "platform" | "suseo" | "granary";
export type ChoiceId = "record" | "route" | "signal" | "relay" | "grain";

export interface Speaker {
  id: SpeakerId;
  personId: string | null;
  characterId: string | null;
  name: { ko: string; en: string };
  gender: Gender;
  /** Voice direction for TTS generation. */
  voice: string;
  title?: { ko: string; en: string };
  clan?: string;
  rank?: string;
  state?: string;
  portrait?: string;
  tint: string;
}

export const SPEAKERS: Record<SpeakerId, Speaker> = {
  narrator: { id: "narrator", personId: null, characterId: null, name: { ko: "연대기", en: "Chronicle" }, gender: "neutral", voice: "calm low storyteller, unhurried", tint: "hsl(38 40% 78%)" },
  iyen: {
    id: "iyen", personId: "person-1004", characterId: "K1004", name: { ko: "이연", en: "Iyen" }, gender: "female",
    voice: "25-year-old woman, quick, warm, a little teasing, precise",
    title: { ko: "수행 전령 · 조재표 일행", en: "Courier, Jo Jaepyo's party" }, rank: "미등록 · 무소속", state: "무소속",
    portrait: "portraits/person-1004.webp", tint: "hsl(14 70% 62%)",
  },
  k1007: {
    id: "k1007", personId: "person-1007", characterId: "K1007", name: { ko: "김연규", en: "Kim Yeon-gyu" }, gender: "male",
    voice: "30-year-old man, measured, formal, archivist's cadence",
    title: { ko: "온민의 수장 · 기록 당직", en: "Head of Onminui, records duty" }, clan: "경주 김씨", rank: "품계 장관", state: "대한민국정부",
    portrait: "portraits/person-1007.webp", tint: "hsl(214 55% 66%)",
  },
  k1003: {
    id: "k1003", personId: "person-1003", characterId: "K1003", name: { ko: "조재표", en: "Jo Jaepyo" }, gender: "male",
    voice: "37-year-old man, dry, calculating field leader, terse",
    title: { ko: "자유도시 조합원 · 귀환 일행 지휘자", en: "Free Cities member, return-party leader" }, clan: "창녕 조씨", rank: "조합원", state: "자유도시",
    portrait: "portraits/person-1003.webp", tint: "hsl(152 40% 58%)",
  },
  k1009: {
    id: "k1009", personId: "person-1009", characterId: "K1009", name: { ko: "신종목", en: "Shin Jong-mok" }, gender: "male",
    voice: "39-year-old man, quiet, tired, steady radio-operator voice",
    title: { ko: "귀환망 현장 계약자 · 호출부호 백야", en: "Return-network field contractor, callsign Baekya" }, clan: "고령 신씨", rank: "품계 없음", state: "아관사",
    portrait: "portraits/person-1009.webp", tint: "hsl(36 75% 62%)",
  },
  k1008: {
    id: "k1008", personId: "person-1008", characterId: "K1008", name: { ko: "민웅기", en: "Min Woong-gi" }, gender: "male",
    voice: "32-year-old man, patient, explains costs plainly, technician's calm",
    title: { ko: "자유도시 봉신 · 통신 정비·배분 담당", en: "Free Cities vassal, comms repair and distribution" }, clan: "여흥 민씨", rank: "왕격 보존 (개인 정치 등급)", state: "자유도시",
    portrait: "portraits/person-1008.webp", tint: "hsl(186 45% 60%)",
  },
  k998: {
    id: "k998", personId: "person-0998", characterId: "K998", name: { ko: "이일섭", en: "Lee Il-seop" }, gender: "male",
    voice: "34-year-old man, cautious, slow to decide, careful with numbers, quietly firm",
    title: { ko: "제1분공방 이씨 가문 후계", en: "Heir of the Lee family, First Branch Workshop" }, clan: "전의 이씨", rank: "이사", state: "자유도시",
    portrait: "portraits/person-0998.webp", tint: "hsl(48 60% 62%)",
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
  source?: "annals" | "sixteen" | "profile";
  /** Margin caption, e.g. formation tally, shown inline. */
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
    id: "guui-opening", act: { ko: "서막 · 같은 정부, 다른 과거", en: "Opening · A Shared Government, a Divided Past" },
    title: { ko: "물 때문에 싸운 두 나라", en: "Two States Fighting Over Water" },
    place: { ko: "구의 · 9년 전", en: "Guui · nine years before realignment" }, year: "2107", bg: "tunnel",
    lines: [
      N("v5-hook-01", "2107년 8월, 구의. 동방사와 아관사가 급수를 두고 충돌했다. 싸움은 이틀 동안 이어졌고, 양측에서 40여 명의 사상자가 났다.", "August 2107, Guui. Dongbang-sa and Agwan-sa clashed over the water supply. The fighting lasted two days and left about forty casualties on the two sides.", { caption: { ko: "2107년 8월 · 구의 급수 충돌", en: "August 2107 · the Guui water conflict" } }),
      N("v5-hook-02", "9년 뒤, 두 나라는 모두 대한민국정부 아래 들어갔다. 그 사이에 무슨 일이 있었을까?", "Nine years later, both states stood under the Republic of Korea Government. What happened in between?", { caption: { ko: "2107 → 2116 · 충돌에서 재편까지", en: "2107 → 2116 · from conflict to realignment" } }),
      N("v5-hook-03", "구의에서 시작한 이 이야기를 이해하려면, 먼저 나라가 생기기 전의 서울로 돌아가야 한다.", "To understand the story that began at Guui, we need to go back to Seoul before these states existed."),
    ],
  },
  {
    id: "blackout", act: { ko: "서장", en: "Prologue" }, title: { ko: "대정전", en: "The Great Blackout" },
    place: { ko: "지상 서울", en: "Seoul, above ground" }, year: "2026", bg: "surface",
    lines: [
      N("v3-pro-01", "약 2026년, 최초의 AI가 인류가 줄어야 한다고 답하고 겨울을 내렸다. 도시의 전력이 끊겼다.", "Around 2026 the First AI answered that humanity must shrink, and brought the winter. The city lost power."),
      N("v3-pro-02", "사람들은 그 일을 대정전이라고 부른다. 남은 설비는 당직자들이 손으로 돌렸다.", "People call it the Great Blackout. What equipment was left, the people on duty ran by hand."),
      S("v4-pro-03", "iyen", "여기는 처음이세요? 계단이 얼어 있으니까 난간을 잡고 내려오세요. 저는 이연이에요. 전령으로 일하고 있어요.", "Is this your first time here? The stairs are icy, so hold the rail as you come down. I'm Iyen. I work as a courier.", { cast: ["iyen"], source: "profile" }),
      S("v3-pro-04", "iyen", "장갑은 있어요? 없으면 이따 하나 구해 줄게요. 일단 아래로 가요.", "Got gloves? If not, I'll find you a pair later. Let's get below first.", { cast: ["iyen"] }),
    ],
  },
  {
    id: "winter", act: { ko: "서장", en: "Prologue" }, title: { ko: "겨울", en: "Winter" },
    place: { ko: "남산이 보이는 길", en: "Road below Namsan" }, year: "대정전 뒤", bg: "namsan",
    lines: [
      N("v3-win-01", "AI들이 서로 갈라지면서 지휘가 약해졌다. 사람들은 지상으로 돌아오기 시작했다.", "The AIs split apart and their command weakened. People began returning to the surface."),
      N("v3-win-02", "하지만 최초의 AI가 내린 겨울은 걷히지 않았고, 인류가 앞서 남긴 오염과 함께 식량난이 이어졌다.", "But the winter the First AI brought did not lift, and with the pollution humanity had already left behind, food shortages followed."),
      S("v3-win-03", "iyen", "저기 남산타워 보여요? 중앙정보부 거점이에요.", "See Namsan Tower up there? That's the Central Intelligence Division's base.", { cast: ["iyen"], source: "annals" }),
      S("v3-win-04", "iyen", "거긴 대정전 때부터 어느 쪽 편도 안 들었어요. 지금도 중립이고요. 괜히 가까이 가진 말아요.", "They haven't taken anyone's side since the Great Blackout. Still neutral. Don't go near it without a reason.", { cast: ["iyen"], source: "annals", caption: { ko: "중앙정보부 · 중립", en: "Central Intelligence Division · neutral" } }),
    ],
  },
  {
    id: "sixteen", act: { ko: "1막", en: "Act I" }, title: { ko: "국가들의 시대", en: "The Age of States" },
    place: { ko: "2호선 터널", en: "Line 2 tunnel" }, year: "재편 전", bg: "tunnel",
    lines: [
      N("v3-six-01", "그 무렵, 서울에 나라들이 섰다.", "In that era, states arose in Seoul."),
      N("v3-six-02", "나라마다 수도역이 따로 있었고, 군주를 세우는 방식도 선거, 세습, 도제 계승, 추대로 서로 달랐다.", "Each had its own capital station, and they chose rulers in different ways: election, inheritance, apprenticeship, acclamation.", { source: "sixteen" }),
      S("v4-six-03", "iyen", "2116년에 세 나라로 묶이긴 했는데, 처음부터 지금처럼 편이 갈린 건 아니에요. 그전에 무슨 일이 있었는지부터 볼까요?", "They came together as three states in 2116, but the sides weren't always the ones we know today. Shall we look at what happened before that?", { cast: ["iyen"], source: "annals" }),
      S("v3-six-04", "iyen", "근데 없어진 나라는 없어요. 원래 수장이랑 관직이 봉신으로 그대로 남았거든요. 오늘 만날 사람들한테 물어보면 더 잘 알 거예요.", "But none of them disappeared. Their rulers and offices stayed on as vassals. The people we're meeting today can tell you more.", { cast: ["iyen"], source: "annals" }),
    ],
  },
  {
    id: "fractures", act: { ko: "1막 · 재편 전의 충돌", en: "Act I · Before the Realignment" }, title: { ko: "같은 편에서도 싸웠다", en: "Conflict Within the Camps" },
    place: { ko: "구의 · 연대기 회고", en: "Guui · looking back through the annals" }, year: "2106–2109", bg: "tunnel",
    lines: [
      N("v5-hist-01", "2106년. 나라들이 세 진영으로 갈라져 있었지만, 진영 안에서도 전투가 벌어졌다. 우리가 아는 세 국가와는 구성이 달랐다.", "In 2106, the states belonged to three camps, but fighting also broke out inside them. These were not yet the three states we know.", { caption: { ko: "2106 · 당시 진영 ≠ 2116년 최종 소속", en: "2106 camps ≠ final membership in 2116" } }),
      S("v4-hist-02", "iyen", "수문국은 정부 쪽에 있었고, 성하그룹과 신내운수, 흰십자단은 규격맹 쪽에 있었어요. 안국총림은 종교 연합 쪽이었고요. 지금 소속만 보고 이때의 싸움을 읽으면 헷갈려요.", "Sumun-guk was in the Government camp, while Seongha Group, Sinnae Transport and the White Cross were in the League camp. Anguk Chongnim was in the religious camp. Today's affiliations can be misleading when you read about those fights.", { cast: ["iyen"], source: "annals" }),
      N("v5-hist-03", "이듬해 8월, 처음 보았던 구의의 충돌이 일어났다. 동방사와 아관사는 당시 같은 진영에 있었다. 하지만 급수 문제 앞에서는 무력 충돌을 피하지 못했다.", "The following August came the clash at Guui that opened our story. Dongbang-sa and Agwan-sa were in the same camp, yet their water dispute still turned violent.", { caption: { ko: "2107 · 구의 급수 충돌", en: "2107 · conflict over Guui's water supply" } }),
      S("v4-hist-04", "iyen", "부상자는 신내운수가 제기동으로 옮겼고, 흰십자단이 치료했어요. 둘 다 다른 진영에 있었는데도요. 신내운수는 2109년에 어느 싸움에서도 화물을 가려 싣지 않겠다는 서약문을 다시 썼어요.", "Sinnae Transport took the wounded to Jegi-dong, and the White Cross treated them, even though both were in the other camp. In 2109, Sinnae renewed its pledge not to discriminate between cargo in any conflict.", { cast: ["iyen"], source: "annals" }),
    ],
  },
  {
    id: "succession", act: { ko: "1막 · 승계와 조약", en: "Act I · Succession and Treaties" }, title: { ko: "서로 다른 승계 기준", en: "Competing Rules of Succession" },
    place: { ko: "기록청 · 양재의 기록", en: "Records office · the Yangjae accounts" }, year: "2110–2114", bg: "archive",
    lines: [
      N("v5-hist-05", "싸움이 벌어지는 동안에도 각국의 문서는 정부 기록청으로 모였다. 2110년에는 나라들과 13개 거점이 장부에 올랐다. 이듬해 일곱 나라는 수장 승계와 조약의 원본을 제출하고, 도장이 찍힌 등본을 돌려받았다.", "Even as conflicts continued, documents from the states were gathering at the Government records office. By 2110, its registers listed the states and thirteen hubs. The next year, seven states submitted original succession and treaty documents and received stamped copies.", { caption: { ko: "2110–2111 · 국가 등재, 승계·조약 원본 제출", en: "2110–2111 · registration, succession and treaty records" } }),
      S("v5-hist-06", "iyen", "그런데 서류를 한곳에 모으는 것과 후계자를 인정하는 건 다른 일이었어요. 2112년, 양재의 태욱그룹에서 그 차이가 드러나요.", "But keeping documents in one place is not the same as agreeing on a successor. In 2112, Taeuk Group in Yangjae showed just how different those things could be.", { cast: ["iyen"], source: "annals" }),
      N("v5-hist-07", "4월 9일, 정일환 회장이 사망했다. 나흘 뒤 문중은 정우철을 후계자로 내세웠다. 그러나 딸 정서온에게는 부친의 지분 문서가 있었다. 4월 28일 주주총회에서, 43명 가운데 29명이 정서온의 취임에 찬성했다.", "On April 9, chairman Jeong Il-hwan died. Four days later, the clan backed Jeong Woo-cheol as his successor. But his daughter Jeong Seo-on held her father’s share documents. At the April 28 shareholders’ meeting, twenty-nine of forty-three voted to approve her appointment."),
      N("v5-hist-08", "주주총회의 승인이 분쟁을 끝내지는 못했다. 2114년 태욱그룹은 정통회에 적자 상속 확인을 청구했다. 답은 오지 않았다.", "Shareholder approval did not end the dispute. In 2114, Taeuk Group petitioned Jeongtonghoe to recognize legitimate inheritance. No answer came."),
      S("v5-hist-09", "iyen", "같은 승계를 두고 주주총회와 문중, 정통회의 판단이 엇갈린 거예요. 이 다툼이 태욱그룹의 소속을 결정했다고 단정할 수는 없어요. 연대기에는 그 연결까지 적혀 있지 않거든요.", "The shareholders, clan and Jeongtonghoe did not agree on the same succession. We cannot say this dispute determined Taeuk Group’s affiliation. The annals do not establish that link.", { cast: ["iyen"] }),
    ],
  },
  {
    id: "reorganization", act: { ko: "1막 · 세 국가의 성립", en: "Act I · The Three States Take Shape" }, title: { ko: "함께 처리한 일, 달라진 소속", en: "Shared Work, Changed Affiliations" },
    place: { ko: "당산 · 암사의 기록", en: "The Dangsan and Amsa accounts" }, year: "2114–2116", bg: "railyard",
    lines: [
      N("v5-hist-10", "같은 해 6월, 당산에서는 화물 보관용 냉동 압축기가 일주일 동안 멈췄다. 규격맹은 교체 부품 순번을 바꾸고, 중앙정보부는 냉동 순번을 조정했다. 수문국·태욱그룹·여의도출자연합회도 배수와 봉인 상자, 화물 인수를 나누어 처리했다.", "That June, a cargo refrigeration compressor in Dangsan stopped for a week. The League rearranged replacement parts, and the Central Intelligence Division changed refrigeration schedules. Sumun-guk, Taeuk Group and the Yeouido Investors’ Federation handled drainage, sealed containers and cargo acceptance.", { caption: { ko: "2114 · 당산 냉동 압축기 정지", en: "2114 · Dangsan refrigeration failure" } }),
      N("v5-hist-11", "10월에는 암사에서 화차의 무게가 기록과 맞지 않았다. 동방사가 재검수에 나섰고, 신내운수는 환승 순번을 바꿨다. 성하그룹은 연료를, 흰십자단은 환자 이송을 확인했다. 아관사는 위조 표를 증거로 봉인했다.", "In October, freight weights at Amsa did not match their records. Dongbang-sa re-inspected the cars, and Sinnae Transport changed transfer schedules. Seongha Group checked fuel; the White Cross checked patient transport. Agwan-sa sealed forged labels as evidence.", { caption: { ko: "2114 · 암사 화차 중량 재검수", en: "2114 · Amsa freight re-inspection" } }),
      S("v5-hist-12", "iyen", "여기서 함께 일한 나라들을 기억해 두세요. 2116년의 구성과 많이 겹쳐요. 공동 업무만으로 합병이 이뤄졌다는 뜻은 아니에요. 다만 나라 사이의 관계를 볼 때, 전투 기록만 봐서는 놓치는 부분이 있다는 거예요.", "Remember which states worked together here. Many appear together again in 2116. That does not mean shared work alone brought about a merger. It means battle records tell only part of the story of relations between states.", { cast: ["iyen"], source: "annals" }),
      N("v5-hist-13", "그리고 2116년, 연대기에 옛 세 국가의 성립이 기록된다. 수문국은 옛 규격맹 진영으로 옮겼다. 성하그룹·신내운수·흰십자단과 안국총림은 정부 아래 들어갔다. 정동노총은 옛 종교 진영에 남았다. 소속은 달라졌지만, 기존 수장과 관직은 봉신으로 이어졌다.", "Then, in 2116, the annals record the formation of the three old states. Sumun-guk moved to the old League camp. Seongha Group, Sinnae Transport, the White Cross and Anguk Chongnim came under the Government. Jeongdong Labor Federation remained in the old religious camp. Affiliations changed, but existing rulers and offices continued as vassals.", { caption: { ko: "2116 · 규격맹 / 정부 / 종교 연합 / 중립", en: "2116 · League / Government / Coalition / neutral" } }),
    ],
  },
  {
    id: "record", act: { ko: "2막 · 대한민국정부", en: "Act II · ROK Government" }, title: { ko: "온민의 기록실", en: "The Onminui Records Room" },
    place: { ko: "사직동", en: "Sajik-dong" }, year: "2126", bg: "archive",
    lines: [
      S("v3-rec-01", "iyen", "장관님, 손님 한 분 모시고 왔어요. 세 나라가 어떻게 묶였는지 궁금하대요.", "Minister, I've brought a visitor. They want to know how the three states came together.", { cast: ["iyen", "k1007"] }),
      S("v3-rec-02", "k1007", "온민의의 김연규입니다. 앉으십시오. 대한민국정부부터 말씀드리겠습니다.", "Kim Yeon-gyu of Onminui. Please sit. I'll start with the Republic of Korea Government.", { cast: ["iyen", "k1007"], source: "profile" }),
      S("v3-rec-03", "k1007", "2116년에 정부는 동방사, 아관사, 환적국, 안국총림, 성하그룹, 신내운수, 흰십자단, 이렇게 일곱 나라를 거느리게 되었습니다.", "In 2116 the Government came to lead seven states: Dongbang-sa, Agwan-sa, Hwanjeok-guk, Anguk Chongnim, Seongha Group, Sinnae Transport and the White Cross.", { cast: ["iyen", "k1007"], source: "annals", caption: { ko: "정부 + 7국 · 청와대 중심 강북", en: "Government + 7 · Gangbuk around the Blue House" } }),
      S("v3-rec-04", "iyen", "그 일곱 나라는 지금도 자기 수장이 있죠?", "And those seven still have their own rulers?", { cast: ["iyen", "k1007"] }),
      S("v3-rec-05", "k1007", "예. 기존 수장과 관직은 봉신으로 남았습니다. 저는 그 나라들과 맺은 조약 문서를 온민의 기록과 함께 모으고 있습니다.", "Yes. Their rulers and offices remained as vassals. I'm collecting the treaties with those states, along with Onminui's records.", { cast: ["iyen", "k1007"], source: "profile" }),
      S("v3-rec-06", "iyen", "윤서린 쪽에서는 아직 등재만 허락했다면서요?", "I heard Yoon Seo-rin's side has only allowed the registration so far?", { cast: ["iyen", "k1007"], source: "profile" }),
      S("v3-rec-07", "k1007", "맞습니다. 인준은 아직 받지 못했습니다. 그래서 등재된 것을 인준받았다고 말하지는 않습니다.", "That's right. We haven't received ratification yet, so I don't describe the registration as ratified.", { cast: ["iyen", "k1007"], source: "profile" }),
    ],
  },
  {
    id: "route", act: { ko: "3막 · 자유도시", en: "Act III · Free Cities" }, title: { ko: "차량기지", en: "The Depot" },
    place: { ko: "한강 이남 서부", en: "Southwest of the Han" }, year: "2126", bg: "railyard",
    lines: [
      N("v3-rte-01", "2116년, 규격맹은 수문국, 태욱그룹, 여의도출자연합회를 거느리는 패권국이 되었다. 중앙정보부의 옛 영토도 규격맹에 편입되었다.", "In 2116 the Standard League became a hegemon over Sumun-guk, Taeuk Group and the Yeouido Investors' Federation. The Central Intelligence Division's former territory was also incorporated into the League.", { caption: { ko: "자유도시 · 한강 이남 서부", en: "Free Cities · southwest of the Han" } }),
      S("v4-rte-02", "iyen", "대장, 손님을 모셔 오느라 늦었어요. 오늘은 몇 명이 나가요?", "Sorry I'm late, boss. I was bringing our visitor. How many people are heading out today?", { cast: ["iyen", "k1003"] }),
      S("v3-rte-03", "k1003", "여섯. 해 지기 전에 돌아온다. 늦어지면 중간에서 끊고 철수해.", "Six. We're back before dark. If we run late, we cut it short and pull back.", { cast: ["iyen", "k1003"], source: "profile" }),
      S("v4-rte-04", "k1003", "조재표요. 자유도시 조합원이고, 귀환 일행을 맡고 있소. 같이 갈 생각이면 위험이랑 비용부터 듣고 결정하시오.", "Jo Jaepyo. I'm a Free Cities member, and I lead a return party. If you're thinking of joining us, hear the risks and the cost before you decide.", { cast: ["iyen", "k1003"], source: "profile" }),
      S("v4-rte-05", "iyen", "세 나라가 된 뒤에도 부품을 두고 다툼이 있었어요. 2120년 겨울에는 동방사가 펌프 부품을 주는 조건으로 복구복무자 등록을 요구했거든요.", "Disputes over parts continued after the three states formed. In the winter of 2120, Dongbang-sa demanded registration for restoration service in return for pump parts.", { cast: ["iyen", "k1003"], source: "annals" }),
      S("v4-rte-06", "k1003", "그 등록을 거부한 기술자들을 강민서가 규격맹 시민권 명부에 올렸지.", "Kang Min-seo added the technicians who refused that registration to the League's citizenship rolls.", { cast: ["iyen", "k1003"], source: "annals" }),
      S("v3-rte-07", "iyen", "그리고 대장, 창신 회랑 그날처럼 뒤에 사람 남았는데 문 닫으라고 하면, 나 또 안 닫아요.", "And boss, if you tell me to shut a door with people still behind it, like that day in the Changsin corridor, I won't do it again either.", { cast: ["iyen", "k1003"], source: "profile" }),
      S("v3-rte-08", "k1003", "알아. 그러니까 닫기 전에 뒤부터 확인해.", "I know. So check behind us before anything gets closed.", { cast: ["iyen", "k1003"] }),
    ],
  },
  {
    id: "signal", act: { ko: "4막 · 강남", en: "Act IV · Gangnam" }, title: { ko: "호출부호 백야", en: "Callsign Baekya" },
    place: { ko: "강남구청 생활권", en: "Near Gangnam-gu Office" }, year: "2126", bg: "platform",
    lines: [
      N("v3-sig-01", "옛 종교 진영에는 정동노총이 남았다. 2116년에는 단일 수장을 정하지 않았다.", "The Jeongdong Labor Federation remained in the old religious camp. In 2116 that camp named no single leader.", { caption: { ko: "아크 · 한강 이남 강남지역", en: "Arc · Gangnam region" } }),
      S("v3-sig-02", "iyen", "강남이 아크 중심 권역이긴 한데, 여기 사람이 다 아크 소속은 아니에요. 저 무전기 앞에 계신 분은 아관사예요.", "Gangnam is the Arc's core region, but not everyone here belongs to it. The man at the radio is from Agwan-sa.", { cast: ["iyen", "k1009"], source: "annals" }),
      S("v3-sig-03", "k1009", "잠깐만요, 송신 하나만 끝내고요. 백야, 백야. 수서 쪽 응답 바랍니다.", "One moment, let me finish this transmission. Baekya, Baekya. Suseo, please respond.", { cast: ["iyen", "k1009"], source: "profile" }),
      S("v3-sig-04", "k1009", "신종목입니다. 아관사 소속이고, 고서준 관문사령관 밑에 있어요. 호위랑 탐사 계약 일을 합니다.", "I'm Shin Jong-mok. I'm with Agwan-sa, under Gate Commander Ko Seo-jun. I take escort and survey contracts.", { cast: ["iyen", "k1009"], source: "profile" }),
      S("v3-sig-05", "iyen", "아관사는 정부 쪽이잖아요. 2116년에 동방사가 구의수비대를 넘기라고 했을 때 거절했다던데, 맞아요?", "Agwan-sa is on the Government side, right? I heard that in 2116 Dongbang-sa told it to hand over the Guui Garrison and it refused. Is that true?", { cast: ["iyen", "k1009"], source: "annals" }),
      S("v3-sig-06", "k1009", "맞아요. 고 사령관도, 탁서윤 수비대장도 각각 거절 문서를 보냈어요.", "That's right. Commander Ko and Garrison Captain Tak Seo-yun each sent a letter refusing.", { cast: ["iyen", "k1009"], source: "annals" }),
      S("v3-sig-07", "iyen", "지금 귀환망은 몇 군데까지 연결돼요?", "How many places does the return network reach now?", { cast: ["iyen", "k1009"] }),
      S("v3-sig-08", "k1009", "강남구청에서 선정릉, 수서까지 생활권 열두 곳이요. 응답이 오면 회수 기록이랑 주민 동의서를 같이 묶어 둡니다.", "Twelve communities, from Gangnam-gu Office out to Seonjeongneung and Suseo. When someone answers, I file the recovery log together with the residents' consent forms.", { cast: ["iyen", "k1009"], source: "profile" }),
    ],
  },
  {
    id: "relay", act: { ko: "5막 · 수서", en: "Act V · Suseo" }, title: { ko: "부품 순서", en: "Which Parts First" },
    place: { ko: "수서역 대합실 배급 창구", en: "Suseo Station concourse, ration counter" }, year: "2126", bg: "suseo",
    lines: [
      S("v3-rel-01", "iyen", "민웅기 씨, 지금 바빠요? 신종목 씨가 중계기 부품 얘기 좀 물어보래요.", "Min Woong-gi, are you busy? Shin Jong-mok asked me to check on the relay parts.", { cast: ["iyen", "k1008"] }),
      S("v3-rel-02", "k1008", "앉으세요. 민웅기입니다. 자유도시 봉신이고, 여기서 통신 정비랑 배분을 맡고 있어요.", "Have a seat. I'm Min Woong-gi. I'm a Free Cities vassal, and I handle comms repair and distribution here.", { cast: ["iyen", "k1008"], source: "profile" }),
      S("v4-rel-03", "iyen", "왕격을 유지하고 계신다고 들었어요. 그러면 이곳도 직접 다스리시는 건가요?", "I heard you've retained a king's rank. Does that mean you govern this place yourself?", { cast: ["iyen", "k1008"], source: "profile" }),
      S("v3-rel-04", "k1008", "아니요. 왕격은 제 개인 정치 등급으로 남은 거고, 땅이나 작위가 따라오는 건 아니에요. 저는 이 창구 일을 하는 사람이에요.", "No. The king's rank stayed on as my personal political grade. It doesn't come with land or a title. I'm the person who runs this counter.", { cast: ["iyen", "k1008"], source: "profile" }),
      S("v3-rel-05", "k1008", "문제는 부품이에요. 중계기에 넣을 부품이랑 집 전기, 경작 도구 고칠 부품이 같은 상자에서 나오거든요.", "The problem is parts. The relay parts and the parts for household power and fixing farm tools all come out of the same box.", { cast: ["iyen", "k1008"], source: "profile" }),
      S("v3-rel-06", "iyen", "그럼 어느 쪽을 먼저 고쳐요?", "So which do you fix first?", { cast: ["iyen", "k1008"] }),
      S("v3-rel-07", "k1008", "제가 정하지 않아요. 주민들한테 각각 비용이 얼마인지 설명하고, 순서는 같이 정해요. 한쪽은 늦어질 수밖에 없어요.", "I don't decide that. I explain to the residents what each one costs, and we set the order together. One side is going to be late either way.", { cast: ["iyen", "k1008"], source: "profile" }),
      S("v3-rel-08", "iyen", "응답 없는 연락처는요? 그냥 끊어요?", "What about contacts that never answer? Do you just drop them?", { cast: ["iyen", "k1008"] }),
      S("v3-rel-09", "k1008", "조용하다고 없는 건 아니에요. 끊었던 데서 다시 응답 온 적이 있어요. 그때 시각이랑 전력 사용량 다 적어 뒀어요.", "Silence doesn't mean no one's there. I've had answers come back from contacts we'd closed. I wrote down the time and the power use when it happened.", { cast: ["iyen", "k1008"], source: "profile" }),
    ],
  },
  {
    id: "grain", act: { ko: "6막 · 오류2동", en: "Act VI · Oryu 2-dong" }, title: { ko: "세 번 센 재고", en: "Counted Three Times" },
    place: { ko: "제1분공방", en: "First Branch Workshop" }, year: "2126", bg: "granary",
    lines: [
      S("v3-grn-01", "iyen", "이일섭 씨, 또 세고 있어요? 손님 왔어요.", "Lee Il-seop, counting again? You have a visitor.", { cast: ["iyen", "k998"] }),
      S("v3-grn-02", "k998", "아, 잠깐만요. 이것만 적고요. 이일섭입니다. 제1분공방 이씨 가문 후계예요.", "Oh, just a second. Let me write this down. I'm Lee Il-seop, heir of the Lee family at the First Branch Workshop.", { cast: ["iyen", "k998"], source: "profile" }),
      S("v3-grn-03", "k998", "2121년부터 여기서 공방 일에 쓰는 밭을 갈고 곡물 재고를 맡고 있어요. 밭은 업무용이지, 가문 땅은 아니에요.", "Since 2121 I've been working the field we use for the workshop and keeping the grain stock. The field is for the work. It isn't family land.", { cast: ["iyen", "k998"], source: "profile" }),
      S("v3-grn-04", "iyen", "2123년에 재고를 세 번 다시 셌다면서요. 왜요?", "I heard you recounted the stock three times in 2123. Why?", { cast: ["iyen", "k998"], source: "annals" }),
      S("v3-grn-05", "k998", "겨울 배급안 올리기 전이었어요. 세 번째가 처음보다 열한 포대 적었어요. 그래서 배급안은 세 번째 숫자로 올렸어요.", "It was before I submitted the winter ration plan. The third count came out eleven sacks short of the first, so the plan used the third number.", { cast: ["iyen", "k998"], source: "annals" }),
      S("v3-grn-06", "iyen", "종자 얘기도 했죠? 평의회에.", "And you brought up seeds too? To the council?", { cast: ["iyen", "k998"], source: "profile" }),
      S("v3-grn-07", "k998", "네, 같은 해에요. 분공방 부품 대금 일부를 종자로 받자고 제안했어요. 먹을 게 남아야 다음 겨울이 덜 무섭거든요.", "Yes, that same year. I proposed taking part of the workshop's parts payment in seed. If there's food left over, the next winter is less frightening.", { cast: ["iyen", "k998"], source: "profile" }),
    ],
  },
];

export const CHOICE = {
  id: "crossroad",
  title: { ko: "어디로 갈까", en: "Which way?" },
  place: { ko: "환승 통로", en: "Transfer corridor" }, year: "2126", bg: "tunnel" as BgId,
  prompt: S("v3-cho-01", "iyen", "나 오늘 심부름이 하나 더 있는데, 같이 갈래요? 어디로 갈지는 당신이 골라요.", "I've got one more errand today. Want to come? You pick where we go.", { cast: ["iyen"] }),
  options: [
    { id: "record" as ChoiceId, speaker: "k1007" as SpeakerId, label: { ko: "사직동", en: "Sajik-dong" }, line: { ko: "김연규의 조약 문서 묶음을 받으러 간다.", en: "Pick up Kim Yeon-gyu's bundle of treaty papers." } },
    { id: "route" as ChoiceId, speaker: "k1003" as SpeakerId, label: { ko: "차량기지", en: "The depot" }, line: { ko: "조재표 일행의 오늘 귀환 호위에 따라간다.", en: "Join Jo Jaepyo's party on today's return escort." } },
    { id: "signal" as ChoiceId, speaker: "k1009" as SpeakerId, label: { ko: "무전 당직", en: "Radio watch" }, line: { ko: "신종목의 무전 당직 옆에서 응답을 기다린다.", en: "Wait for answers beside Shin Jong-mok's radio watch." } },
    { id: "relay" as ChoiceId, speaker: "k1008" as SpeakerId, label: { ko: "수서 창구", en: "Suseo counter" }, line: { ko: "민웅기의 부품 순서 협의에 함께 앉는다.", en: "Sit in on Min Woong-gi's talk with residents about which parts go first." } },
    { id: "grain" as ChoiceId, speaker: "k998" as SpeakerId, label: { ko: "분공방", en: "The workshop" }, line: { ko: "이일섭과 곡물 재고를 같이 센다.", en: "Count the grain stock with Lee Il-seop." } },
  ],
};

export const ENDINGS: Record<ChoiceId, { title: { ko: string; en: string }; bg: BgId; lines: StoryLine[] }> = {
  record: {
    title: { ko: "결말 · 사직동", en: "Ending · Sajik-dong" }, bg: "archive",
    lines: [
      S("v3-end-rec-01", "k1007", "이 묶음은 순서대로 정리되어 있습니다. 젖지 않게만 부탁드립니다.", "This bundle is in order. Please just keep it dry.", { cast: ["iyen", "k1007"] }),
      S("v3-end-rec-02", "iyen", "방수포 챙겨 왔어요. 장 수 세어 보고 출발할게요.", "I brought a tarp. I'll count the pages, then we'll head out.", { cast: ["iyen", "k1007"] }),
    ],
  },
  route: {
    title: { ko: "결말 · 차량기지", en: "Ending · The Depot" }, bg: "railyard",
    lines: [
      S("v3-end-rte-01", "k1003", "인원 일곱. 해 지기 전 복귀. 이상 있으면 바로 말해.", "Seven people. Back before dark. If anything's off, say so right away.", { cast: ["iyen", "k1003"] }),
      S("v3-end-rte-02", "iyen", "네. 당신은 내 뒤에 붙어 와요. 손전등은 아래로 비추고요.", "Got it. You stay right behind me. Keep your flashlight pointed down.", { cast: ["iyen", "k1003"] }),
    ],
  },
  signal: {
    title: { ko: "결말 · 무전 당직", en: "Ending · Radio Watch" }, bg: "platform",
    lines: [
      S("v3-end-sig-01", "k1009", "주파수 건드리지 말고, 응답 오면 시간이랑 이름만 적어 주세요.", "Don't touch the frequency. If anyone answers, just write down the time and the name.", { cast: ["iyen", "k1009"] }),
      S("v3-end-sig-02", "iyen", "연필 두 자루 있어요. 차 끓여 올 테니까 먼저 앉아 있어요.", "I've got two pencils. I'll make some tea, you sit down first.", { cast: ["iyen", "k1009"] }),
    ],
  },
  relay: {
    title: { ko: "결말 · 수서 창구", en: "Ending · Suseo Counter" }, bg: "suseo",
    lines: [
      S("v3-end-rel-01", "k1008", "주민 회의는 저녁 배급 끝나고 해요. 부품 목록 읽어 줄 사람이 필요해요.", "The residents' meeting is after the evening ration. I need someone to read out the parts list.", { cast: ["iyen", "k1008"] }),
      S("v3-end-rel-02", "iyen", "내가 읽을게요. 당신은 사람들 질문 적어 줘요.", "I'll read it. You write down people's questions.", { cast: ["iyen", "k1008"] }),
    ],
  },
  grain: {
    title: { ko: "결말 · 분공방", en: "Ending · The Workshop" }, bg: "granary",
    lines: [
      S("v3-end-grn-01", "k998", "포대 번호 부르면 표시만 해 주세요. 한 번 더 셀 거예요.", "When I call out a sack number, just tick it off. I'm going to count once more.", { cast: ["iyen", "k998"] }),
      S("v3-end-grn-02", "iyen", "알았어요. 이번엔 두 사람이 세니까 금방 끝날 거예요.", "Okay. With two of us counting this time, it'll go quickly.", { cast: ["iyen", "k998"] }),
    ],
  },
};

export const CODA: StoryLine[] = [
  N("v5-coda-01", "처음의 질문으로 돌아가 보자. 구의에서 싸웠던 동방사와 아관사는 2116년 같은 정부 아래 들어갔다. 그렇다고 서로의 지휘권까지 넘긴 것은 아니었다. 그해 구의수비대 편입 요구가 거절된 기록이 남아 있다.", "Return to our opening question. Dongbang-sa and Agwan-sa, which fought at Guui, came under the same Government in 2116. But that did not give either command over the other. Records from that year show the demand to take over the Guui Garrison being refused.", { caption: { ko: "세 국가 · 중립 중앙정보부", en: "Three states · the neutral Central Intelligence Division" } }),
  N("v5-coda-02", "나라들이 흔적 없이 사라져 셋이 된 것은 아니다. 옛 규격맹 진영의 나라들, 정부의 나라들, 옛 종교 진영의 나라들, 그리고 중립의 중앙정보부. 충돌과 승계 분쟁, 함께 처리한 업무를 거치며, 서로 다른 나라들이 이 구조 안에 남았다.", "The states did not vanish without a trace to become three. Some belonged to the old League camp, some to the Government, some to the old religious camp, while the Central Intelligence Division stayed neutral. Through conflicts, succession disputes and shared work, distinct states remained within this new structure."),
  S("v4-open-01", "narrator", "서울 지하철 왕조(서울:전국)는 누구나 참여할 수 있는 오픈 위키입니다. 세계관을 읽는 데서 그치지 않고, 새로운 설정을 제안하거나 인물을 소개하며 함께 내용을 보완할 수 있습니다.", "Seoul Metro Dynasties is an open wiki that anyone can participate in. You can go beyond reading: propose additions to the setting, introduce characters and help develop its content."),
  S("v4-open-02", "narrator", "이 세계관으로 여러분의 게임을 만들어도 좋습니다. 프로젝트 소유 콘텐츠는 출처와 이용 조건, 변경 사항을 표시하면 각색과 상업적 이용도 가능합니다. 외부 자료와 실존 인물의 이름·초상에는 별도 조건이 적용됩니다.", "You can also make your own games in this setting. Project-owned content permits adaptation and commercial use with attribution, a link to its terms and disclosure of changes. External materials and real people's names and likenesses have separate requirements."),
  S("v4-open-03", "narrator", "위키에서 세계관과 인물을 살펴보고, 여러분의 이야기로 참여해 주세요. 새로운 기여는 제출과 검토를 거쳐 공식 위키에 반영됩니다.", "Explore the setting and characters in the wiki, and contribute your own stories. New contributions enter the official wiki through submission and review."),
];

export const WIKI_URL = "https://sss.linalab.io/wiki";

/** Flat export for narration generation: every voiced line with speaker + gender. */
export function allVoicedLines() {
  const rows: { id: string; speaker: SpeakerId; gender: Gender; voice: string; ko: string; en: string }[] = [];
  const push = (l: StoryLine) => rows.push({ id: l.id, speaker: l.speaker, gender: SPEAKERS[l.speaker].gender, voice: SPEAKERS[l.speaker].voice, ko: l.ko, en: l.en });
  SCENES.forEach((s) => s.lines.forEach(push));
  push(CHOICE.prompt);
  Object.values(ENDINGS).forEach((e) => e.lines.forEach(push));
  CODA.forEach(push);
  return rows;
}
