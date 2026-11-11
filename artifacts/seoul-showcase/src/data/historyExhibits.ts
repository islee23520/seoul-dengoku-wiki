/**
 * Supplemental image panels for the history scenes (fractures / succession /
 * reorganization) and the later lines that cite 2116–2120 annals events.
 *
 * HONESTY RULE: the public wiki contains NO photographs or depictions of these
 * events. Every image here is either (a) a published wiki portrait of a person
 * the Century Annals names as a participant, or (b) a published state flag.
 * Each panel therefore carries kind "portrait" | "flag" and the UI always shows
 * "관련 인물 초상 · 사건 현장 사진 아님" / "국가 깃발 · 사건 현장 사진 아님".
 *
 * Files are local re-encodes (webp, 720px) of artifacts/seoul-wiki/public
 * portraits/*.png and straight copies of state-flags/*.webp. Portraits are
 * art-proposal status (portrait-reviews: canonPromotion false).
 *
 * Spoken text and line IDs are untouched; panels attach by line ID only.
 */
import { WIKI_URL } from "@/data/storyScript";

export type ExhibitKind = "portrait" | "flag";
export interface ExhibitImage {
  kind: ExhibitKind;
  src: string;
  /** Wiki person / state id */
  ref: string;
  name: { ko: string; en: string };
  /** Role as recorded, with date evidence */
  role: { ko: string; en: string };
  /** Public wiki page for the image subject */
  href: string;
}
export interface Exhibit {
  id: string;
  date: string;
  heading: { ko: string; en: string };
  note: { ko: string; en: string };
  images: ExhibitImage[];
  /** Evidence: source anchors (route + description) */
  sources: { label: { ko: string; en: string }; href: string }[];
}

const ANNALS = `${WIKI_URL}/world/Century-Annals`;
const SIXTEEN = `${WIKI_URL}/world/Sixteen-States`;
const person = (id: string) => `${WIKI_URL}/people/${id}`;

const flag = (id: string, ko: string, en: string, roleKo: string, roleEn: string): ExhibitImage => ({
  kind: "flag", src: `history/flags/${id}.webp`, ref: id, name: { ko, en }, role: { ko: roleKo, en: roleEn }, href: SIXTEEN,
});

const EX: Record<string, Exhibit> = {
  camps: {
    id: "camps", date: "2106",
    heading: { ko: "2106년의 진영과 2116년의 소속", en: "Camps of 2106 vs. affiliations of 2116" },
    note: { ko: "같은 깃발이 10년 사이 다른 진영에 서 있었다. 깃발은 국가 식별용 위키 도안이다.", en: "The same flags stood in different camps a decade apart. Flags are wiki designs used for identification." },
    images: [
      flag("S12", "신내운수", "Sinnae Transport", "2106 규격맹 쪽 → 2116 정부", "League camp in 2106 → Government in 2116"),
      flag("S13", "흰십자단", "White Cross", "2106 규격맹 쪽 → 2116 정부", "League camp in 2106 → Government in 2116"),
    ],
    sources: [{ label: { ko: "백년 연대기 · 2106 진영 구성", en: "Century Annals · 2106 camps" }, href: ANNALS }],
  },
  guui: {
    id: "guui", date: "2107.08",
    heading: { ko: "구의 급수 충돌의 두 당사국", en: "The two parties at Guui" },
    note: { ko: "연대기는 이 충돌에 관여한 개인의 이름을 적지 않았다. 그래서 인물 대신 당사국 깃발만 둔다. 동방사 배우진은 2118년에야 사령관이 되었으므로 이 사건의 인물로 쓰지 않았다.", en: "The annals name no individuals in this clash, so only the parties' flags are shown. Dongbang-sa's Bae Woo-jin became commander only in 2118 and is deliberately not used here." },
    images: [
      flag("S05", "동방사", "Dongbang-sa", "충돌 당사국 · 2107년 8월", "Party to the clash · Aug 2107"),
      flag("S14", "아관사", "Agwan-sa", "충돌 당사국 · 2107년 8월", "Party to the clash · Aug 2107"),
    ],
    sources: [{ label: { ko: "백년 연대기 · 2107 가. 구의 충돌", en: "Century Annals · 2107 Guui clash" }, href: ANNALS }],
  },
  neutralAid: {
    id: "neutralAid", date: "2107 · 2109",
    heading: { ko: "부상자를 옮기고 치료한 쪽", en: "Who carried and treated the wounded" },
    note: { ko: "신내운수 대차 6대가 양측 부상자를 제기동으로 옮겼고 흰십자단이 치료했다. 2109년 2월 신내운수 사장 가문이 서약문을 다시 썼다.", en: "Six Sinnae carts moved the wounded of both sides to Jegi-dong; the White Cross treated them. In Feb 2109 Sinnae's ruling family renewed its pledge." },
    images: [
      flag("S12", "신내운수", "Sinnae Transport", "부상자 이송 · 2109 서약문", "Moved the wounded · 2109 pledge"),
      flag("S13", "흰십자단", "White Cross", "부상자 치료 · 2107", "Treated the wounded · 2107"),
    ],
    sources: [{ label: { ko: "백년 연대기 · 2107 구의 충돌, 2109 서약문", en: "Century Annals · 2107 clash, 2109 pledge" }, href: ANNALS }],
  },
  seoon: {
    id: "seoon", date: "2112.04 – 2114.05",
    heading: { ko: "정서온 · 태욱그룹 승계 분쟁의 당사자", en: "Jeong Seo-on · party to the Taeuk succession dispute" },
    note: { ko: "2112.4.9 부친 정일환 사망 · 4.13 문중 9명 회의, 정우철 추대 결의(7명 서명) · 4.15 정서온 취임 공표(지분 51%) · 4.28 주주 43명 중 29명 찬성 · 2114.2 정통회 인준 청구, 무응답. 정우철·정일환의 공개 초상은 없다.", en: "9 Apr 2112 father Jeong Il-hwan dies · 13 Apr clan of nine backs Jeong Woo-cheol (7 sign) · 15 Apr Seo-on announces succession (51% stake) · 28 Apr 29 of 43 shareholders approve · Feb 2114 petition to Jeongtonghoe, no reply. No public portraits exist for Woo-cheol or Il-hwan." },
    images: [{
      kind: "portrait", src: "history/portraits/person-1005.webp", ref: "person-1005 · K1005",
      name: { ko: "정서온", en: "Jeong Seo-on" },
      role: { ko: "태욱그룹 회장 · 2112년 취임 공표 당사자", en: "Chair, Taeuk Group · announced her succession in 2112" },
      href: person("person-1005"),
    }, flag("S03", "태욱그룹", "Taeuk Group", "승계 분쟁이 일어난 나라", "State where the dispute occurred")],
    sources: [
      { label: { ko: "백년 연대기 · 2112 태욱그룹 회장 승계", en: "Century Annals · 2112 Taeuk succession" }, href: ANNALS },
      { label: { ko: "인물 기록 person-1005", en: "Person record person-1005" }, href: person("person-1005") },
    ],
  },
  registry: {
    id: "registry", date: "2110 – 2111",
    heading: { ko: "기록청에 원본을 낸 나라들 중 둘", en: "Two of the states that filed originals" },
    note: { ko: "제출국은 수문국·동방사·아관사·환적국·신내운수·규격맹·흰십자단. 기록청은 정부 소관이다.", en: "Filers: Sumun-guk, Dongbang-sa, Agwan-sa, Hwanjeok-guk, Sinnae, the League and the White Cross. The records office belonged to the Government." },
    images: [
      flag("S06", "대한민국정부", "ROK Government", "기록청 소관국 · 2110 등재", "Ran the records office · 2110"),
      flag("S02", "규격맹", "Standard League", "2111 원본 제출국", "Filed originals in 2111"),
    ],
    sources: [{ label: { ko: "백년 연대기 · 2110 등재, 2111 원본 제출", en: "Century Annals · 2110–2111 registry" }, href: ANNALS }],
  },
  dangsan: {
    id: "dangsan", date: "2114",
    heading: { ko: "당산 냉동 압축기 정지 · 조정에 참여한 나라", en: "Dangsan refrigeration failure · coordinating states" },
    note: { ko: "이 다섯 나라 중 셋(규격맹·수문국·태욱그룹)이 2116년 규격맹 진영이 된다. 공동 작업은 합병이 아니다.", en: "Three of these five became the 2116 League bloc. Shared work was not a merger." },
    images: [
      flag("S02", "규격맹", "Standard League", "부품·순번 조정 · 2114", "Parts and schedules · 2114"),
      flag("S03", "태욱그룹", "Taeuk Group", "조정 참여 · 2114", "Coordination · 2114"),
    ],
    sources: [{ label: { ko: "백년 연대기 · 2114 당산", en: "Century Annals · 2114 Dangsan" }, href: ANNALS }],
  },
  amsa: {
    id: "amsa", date: "2114",
    heading: { ko: "암사 화차 재검수", en: "Amsa freight re-inspection" },
    note: { ko: "동방사가 재검수했고 신내운수·성하그룹·흰십자단·아관사가 환승, 연료, 환자 이송, 증빙을 나눠 맡았다.", en: "Dongbang-sa re-inspected; Sinnae, Seongha, the White Cross and Agwan-sa split transfers, fuel, patients and evidence." },
    images: [
      flag("S05", "동방사", "Dongbang-sa", "재검수 · 2114", "Re-inspection · 2114"),
      flag("S14", "아관사", "Agwan-sa", "증빙 처리 참여 · 2114", "Evidence handling · 2114"),
    ],
    sources: [{ label: { ko: "백년 연대기 · 2114 암사", en: "Century Annals · 2114 Amsa" }, href: ANNALS }],
  },
  three: {
    id: "three", date: "2116",
    heading: { ko: "옛 세 국가의 패권국과 종교 연합", en: "The three old blocs of 2116" },
    note: { ko: "옛 규격맹 · 정부 · 옛 종교 진영, 그리고 중립의 중앙정보부. 기존 수장과 관직은 봉신으로 존속했다.", en: "The old League, the Government and the old religious camp, with the Central Intelligence Division neutral. Existing rulers and offices remained as vassals." },
    images: [
      flag("S02", "규격맹", "Standard League", "패권국 · 2116", "Hegemon · 2116"),
      flag("S06", "대한민국정부", "ROK Government", "패권국 · 2116", "Hegemon · 2116"),
    ],
    sources: [
      { label: { ko: "백년 연대기 · 2116 세 국가 성립", en: "Century Annals · 2116 formation" }, href: ANNALS },
      { label: { ko: "세 세력", en: "The Three Factions" }, href: SIXTEEN },
    ],
  },
  koSeojun: {
    id: "koSeojun", date: "2115 – 2116.07",
    heading: { ko: "고서준 · 구의수비대 이관 거절", en: "Ko Seo-jun · refused to hand over the Guui Garrison" },
    note: { ko: "2115년 아관사 관문사령관 선출 · 2116년 7월 동방사의 이관 문서에 거절 문서 발송. 함께 거절한 구의수비대장 탁서윤(person-1006)은 공개 초상이 없다.", en: "Elected Agwan-sa gate commander in 2115 · refused Dongbang-sa's transfer order in Jul 2116. Garrison Captain Tak Seo-yun (person-1006), who also refused, has no public portrait." },
    images: [{
      kind: "portrait", src: "history/portraits/person-0349.webp", ref: "person-0349 · K348",
      name: { ko: "고서준", en: "Ko Seo-jun" },
      role: { ko: "아관사 관문사령관 · 2116년 거절 문서 발신", en: "Gate Commander, Agwan-sa · sent refusal in 2116" },
      href: person("person-0349"),
    }, flag("S05", "동방사", "Dongbang-sa", "이관 요구국 · 2116.07", "Demanded the transfer · Jul 2116")],
    sources: [
      { label: { ko: "백년 연대기 · 2115 편입 요구", en: "Century Annals · 2115–2116 transfer demand" }, href: ANNALS },
      { label: { ko: "인물 기록 person-0349", en: "Person record person-0349" }, href: person("person-0349") },
    ],
  },
  kangMinseo: {
    id: "kangMinseo", date: "2120 겨울",
    heading: { ko: "강민서 · 복구복무자 등록 거부 기술자 시민권 등재", en: "Kang Min-seo · enrolled the refusing technicians" },
    note: { ko: "2120년 겨울 동방사의 등록 요구 → 강민서가 거부 기술자를 규격맹 시민권 명부에 올림 · 2121년 평의회가 위원장으로 선출.", en: "Winter 2120: Dongbang-sa's demand → Kang put refusing technicians on the League's citizenship rolls · elected council chair in 2121." },
    images: [{
      kind: "portrait", src: "history/portraits/person-0029.webp", ref: "person-0029 · K029",
      name: { ko: "강민서", en: "Kang Min-seo" },
      role: { ko: "규격맹 · 2120년 명부 등재 당사자, 2121년 위원장", en: "Standard League · acted in 2120, chair from 2121" },
      href: person("person-0029"),
    }],
    sources: [
      { label: { ko: "백년 연대기 · 2120 등록 요구", en: "Century Annals · 2120 registration demand" }, href: ANNALS },
      { label: { ko: "인물 기록 person-0029", en: "Person record person-0029" }, href: person("person-0029") },
    ],
  },
};

/** Line ID → panel. Only attaches; never alters spoken lines. */
export const EXHIBIT_BY_LINE: Record<string, Exhibit> = {
  "v5-hook-01": EX.guui, "v5-hook-02": EX.three,
  "v5-hist-01": EX.camps, "v4-hist-02": EX.camps,
  "v5-hist-03": EX.guui, "v4-hist-04": EX.neutralAid,
  "v5-hist-05": EX.registry,
  "v5-hist-06": EX.seoon, "v5-hist-07": EX.seoon, "v5-hist-08": EX.seoon, "v5-hist-09": EX.seoon,
  "v5-hist-10": EX.dangsan, "v5-hist-11": EX.amsa, "v5-hist-12": EX.three, "v5-hist-13": EX.three,
  "v3-sig-05": EX.koSeojun, "v3-sig-06": EX.koSeojun,
  "v4-rte-05": EX.kangMinseo, "v4-rte-06": EX.kangMinseo,
};

export const KIND_LABEL: Record<ExhibitKind, { ko: string; en: string }> = {
  portrait: { ko: "관련 인물 초상 · 사건 현장 사진 아님", en: "Related person's portrait · not an image of the event" },
  flag: { ko: "국가 깃발 · 사건 현장 사진 아님", en: "State flag · not an image of the event" },
};
export const EXHIBIT_CREDIT = {
  ko: "이미지: 서울:전국 위키 공개 초상(art-proposal, 정본 승인 아님)과 국가 깃발. 이 사건들의 실제 현장 이미지는 위키에 없다.",
  en: "Images: published wiki portraits (art-proposal, not canon-approved) and state flags. The wiki holds no actual depiction of these events.",
};
