/**
 * Supplemental reference panels for the Go Ye-jin chronicle scenes (v6).
 *
 * HONESTY RULE: the public wiki contains NO photographs of these events.
 * Every image here is either (a) a published wiki portrait of a person the
 * script names, or (b) one of the showcase's own scene illustrations. Each
 * panel carries kind "portrait" | "scene" and the UI labels it as not a
 * record of the event.
 *
 * The retired v5 panels (old-state flags and old-state succession exhibits)
 * were removed with the 2026-11-12 canon rewrite: only the three factions
 * exist, so no abolished polity's flag appears.
 *
 * Panels attach by line ID only; spoken text is untouched.
 */
import { WIKI_URL } from "@/data/storyScript";

export type ExhibitKind = "portrait" | "scene";
export interface ExhibitImage {
  kind: ExhibitKind;
  src: string;
  /** Wiki person id, or the scene plate name */
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
const ARCS = `${WIKI_URL}/world/Regional-Physical-AI-Arcs`;
const GOV = `${WIKI_URL}/world/Government-Society`;
const FREECITY = `${WIKI_URL}/world/Free-City-Society`;
const ARCSOC = `${WIKI_URL}/world/Arc-Society`;
const person = (id: string) => `${WIKI_URL}/people/${id}`;

const scene = (src: string, ko: string, en: string, roleKo: string, roleEn: string): ExhibitImage => ({
  kind: "scene", src: `scenes/${src}.jpg`, ref: `scenes/${src}.jpg`, name: { ko, en }, role: { ko: roleKo, en: roleEn }, href: ANNALS,
});

const portrait = (src: string, ref: string, ko: string, en: string, roleKo: string, roleEn: string, href: string): ExhibitImage => ({
  kind: "portrait", src, ref, name: { ko, en }, role: { ko: roleKo, en: roleEn }, href,
});

const EX: Record<string, Exhibit> = {
  deadCable: {
    id: "deadCable", date: "2112",
    heading: { ko: "죽은 케이블이 이끈 곳", en: "Where the Dead Cable Led" },
    note: { ko: "고예진은 자유도시 전력망을 고치다 죽은 케이블을 따라가 지도에 없는 역을 찾았다. 그 안에는 버려진 데이터센터와 인쇄 매뉴얼이 있었다. 실제 현장의 기록 이미지는 위키에 없다.", en: "Repairing the Free City grid, Go Ye-jin followed a dead cable to a station on no map. Inside were an abandoned data centre and printed manuals. The wiki holds no record image of the place." },
    images: [scene("tunnel", "터널", "Tunnel", "2112 · 케이블이 지나간 터널 (장면 일러스트)", "2112 · the tunnel the cable ran through (scene illustration)")],
    sources: [{ label: { ko: "백년 연대기 · 2112 죽은 케이블", en: "Century Annals · 2112, the dead cable" }, href: ANNALS }],
  },
  manuals: {
    id: "manuals", date: "2112–2117",
    heading: { ko: "다섯 해의 매뉴얼", en: "Five Years of Manuals" },
    note: { ko: "고예진은 그 역에서 다섯 해 동안 매뉴얼을 읽었다. '대부분은 냉각에 대한 것이었다. 생각하다 스스로 부서지지 않을 만큼 차갑게 유지하는 법.' 그가 무엇을 다 배웠는지는 정본에도 남아 있지 않다.", en: "Go Ye-jin read the manuals there for five years. 'Most of it was about cooling. How to keep a thing thinking cold enough that it does not break itself.' What else he learned is not recorded anywhere public." },
    images: [scene("archive", "서고", "The archive", "2112–2117 · 매뉴얼의 방 (장면 일러스트)", "2112–2117 · the room of manuals (scene illustration)")],
    sources: [
      { label: { ko: "권역 연대기 · 버려진 역과 매뉴얼", en: "Regional chronicle · the abandoned station and the manuals" }, href: ARCS },
      { label: { ko: "백년 연대기 · 다섯 해의 매뉴얼", en: "Century Annals · five years of manuals" }, href: ANNALS },
    ],
  },
  baptism: {
    id: "baptism", date: "2117 무렵",
    heading: { ko: "첫 열둘의 세례", en: "The Baptism of the First Twelve" },
    note: { ko: "세례는 몸의 한 부위를 기계로 바꾸는 일이다. 첫 열둘은 대부분 추위나 사고나 전쟁 기계에 팔다리를 잃은 사람들이었다. 신앙은 이식한 부위 수로 센다.", en: "A baptism replaces one part of the body with a machine. Most of the first twelve had lost limbs to cold, accident or the war machines. Faith is counted in implanted parts." },
    images: [scene("platform", "승강장", "Platform", "2117 무렵 · 첫 세례 (장면 일러스트)", "Around 2117 · the first baptisms (scene illustration)")],
    sources: [
      { label: { ko: "백년 연대기 · 열두 번의 세례", en: "Century Annals · twelve baptisms" }, href: ANNALS },
      { label: { ko: "아크 사회 · 사이버웨어 접근", en: "Arc Society · cyberware access" }, href: ARCSOC },
    ],
  },
  registry: {
    id: "registry", date: "2126",
    heading: { ko: "명동 · 등록 사무소 거리", en: "Myeongdong · the Registry Quarter" },
    note: { ko: "명동은 강 북쪽 중구의 등록 사무소 거리다. 장부를 고치러 오는 사람들이 모이는 곳이지 장터가 아니다. 아크의 땅은 아니다.", en: "Myeongdong, in Jung-gu north of the river, is the Government's street of registry offices — where people come to correct their ledger entries, not a market. It is not Arc land." },
    images: [portrait("portraits/person-1007.webp", "person-1007 · K1007", "김연규", "Kim Yeon-gyu", "기록 당직 · 문서 등재 (공개 인물 기록)", "Records duty · document registration (published person record)", person("person-1007"))],
    sources: [
      { label: { ko: "정부 사회 · 역별 장터와 명동", en: "Government Society · markets and Myeongdong" }, href: GOV },
      { label: { ko: "인물 기록 person-1007", en: "Person record person-1007" }, href: person("person-1007") },
    ],
  },
  gwanak: {
    id: "gwanak", date: "2126",
    heading: { ko: "관악 폴리스와 그 아르콘", en: "The Polis of Gwanak and Its Archon" },
    note: { ko: "구 하나가 폴리스 하나다. 이일섭은 스물둘에 물 재활용기 시연으로 시민권을 얻고, 급수 집정관과 평의회를 거쳐 아르콘이 됐다. 아르콘은 시민회가 뽑는 자리다.", en: "Each district is one polis. I Ilseop earned citizenship at twenty-two by demonstrating a water recycler, served as water magistrate and on the council, and then became Archon. An Archon is elected by the citizens' assembly." },
    images: [portrait("portraits/person-0998.webp", "person-0998 · K998", "이일섭", "I Ilseop", "관악의 아르콘 · 제1분공방 이씨 가문", "Archon of Gwanak · I Clan, First Branch Workshop", person("person-0998"))],
    sources: [
      { label: { ko: "권역 연대기 · 이일섭은 어떻게 관악의 아르콘이 됐는가", en: "Regional chronicle · how I Ilseop became Archon of Gwanak" }, href: ARCS },
      { label: { ko: "자유도시 사회 · 폴리스의 제도", en: "Free City Society · institutions of a polis" }, href: FREECITY },
      { label: { ko: "인물 기록 person-0998", en: "Person record person-0998" }, href: person("person-0998") },
    ],
  },
  baekya: {
    id: "baekya", date: "2126",
    heading: { ko: "백야 · 논현2동의 무전", en: "Baekya · the Radio at Nonhyeon 2-dong" },
    note: { ko: "신종목은 강남 논현2동에 살고, 무전에서는 백야라는 호출부호로 답한다. 그의 신호는 선정릉과 수서 사이를 오간다. 강남에 산다고 아크 소속은 아니다.", en: "Sin Jong-mok lives in Nonhyeon 2-dong, Gangnam, and answers on the radio as Baekya. His signal moves between Seonjeongneung and Suseo. Living in Gangnam does not make him Arc." },
    images: [portrait("portraits/person-1009.webp", "person-1009 · K1009", "신종목", "Sin Jong-mok", "귀환망 현장 계약자 · 호출부호 백야", "Return-network contractor · callsign Baekya", person("person-1009"))],
    sources: [
      { label: { ko: "백년 연대기 · 개막 직전의 몇 해", en: "Century Annals · the last years before the opening" }, href: ANNALS },
      { label: { ko: "인물 기록 person-1009", en: "Person record person-1009" }, href: person("person-1009") },
    ],
  },
};

/** Line ID → panel. Only attaches; never alters spoken lines. */
export const EXHIBIT_BY_LINE: Record<string, Exhibit> = {
  "v6-cbl-01": EX.deadCable, "v6-cbl-03": EX.deadCable,
  "v6-man-01": EX.manuals, "v6-man-02": EX.manuals,
  "v6-bap-01": EX.baptism,
  "v6-gov-02": EX.registry, "v6-end-reg-01": EX.registry,
  "v6-fc-03": EX.gwanak, "v6-end-wks-01": EX.gwanak,
  "v6-end-wat-01": EX.baekya,
};

export const KIND_LABEL: Record<ExhibitKind, { ko: string; en: string }> = {
  portrait: { ko: "관련 인물 초상 · 기록 사진 아님", en: "Related person's portrait · not a record image" },
  scene: { ko: "장면 일러스트 · 기록 사진 아님", en: "Scene illustration · not a record image" },
};
export const EXHIBIT_CREDIT = {
  ko: "이미지: 서울:전국 위키 공개 초상(art-proposal, 정본 승인 아님)과 쇼케이스 장면 일러스트. 이 사건들의 실제 기록 이미지는 위키에 없다.",
  en: "Images: published wiki portraits (art-proposal, not canon-approved) and the showcase's own scene illustrations. The wiki holds no actual record image of these events.",
};
