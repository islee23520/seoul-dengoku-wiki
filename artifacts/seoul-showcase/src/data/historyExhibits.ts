/**
 * Supplemental reference panels for the showcase script (v7, v3 bible).
 *
 * HONESTY RULE: the public wiki contains NO photographs of these events.
 * Every image here is either (a) a published wiki portrait of a person the
 * script names, or (b) one of the showcase's own scene illustrations. Each
 * panel carries kind "portrait" | "scene" and the UI labels it as not a
 * record of the event.
 *
 * Panels attach by line ID only; spoken text is untouched. Links point at the
 * v3 wiki pages (slug titles per docs/design/v3/08-document-map.md).
 */
import { wikiDoc, wikiPerson } from "@/data/storyScript";

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

const ANNALS = wikiDoc("Century-Annals");
const MACHINES = wikiDoc("Regional-Physical-AI-Arcs");
const RIM = wikiDoc("External-Theaters");
const POLITIES = wikiDoc("Sixteen-States");
const GOV = wikiDoc("Government-Society");
const FREECITY = wikiDoc("Free-City-Society");
const ARCSOC = wikiDoc("Arc-Society");

const scene = (src: string, ko: string, en: string, roleKo: string, roleEn: string, href: string): ExhibitImage => ({
  kind: "scene", src: `scenes/${src}.jpg`, ref: `scenes/${src}.jpg`, name: { ko, en }, role: { ko: roleKo, en: roleEn }, href,
});

const portrait = (id: string, characterId: string, ko: string, en: string, roleKo: string, roleEn: string): ExhibitImage => ({
  kind: "portrait", src: `portraits/${id}.webp`, ref: `${id} · ${characterId}`, name: { ko, en }, role: { ko: roleKo, en: roleEn }, href: wikiPerson(id),
});

const EX: Record<string, Exhibit> = {
  party: {
    id: "party", date: "2126",
    heading: { ko: "조재표 일행 · 동작역", en: "Jo Jaepyo's Party · Dongjak Station" },
    note: { ko: "어느 정체의 장부에도 이름이 없는 귀환 일행이다. 눈보라가 바깥 기계의 눈을 가리는 이삼일 사이에 테두리를 넘고, 가져온 동력 덩이와 부품은 값을 치르는 쪽에 판다. 일이 없을 때는 동작 나루지기와 맺은 계약으로 동작역에 머문다.", en: "A return crossing party whose name appears in no polity's ledger. They cross the rim in the two or three days a blizzard blinds the machines, and sell the power cores and parts they bring back to whoever pays. Between jobs they stay at Dongjak Station under a contract with the Dongjak Ferry Keeper." },
    images: [
      portrait("person-1003", "K1003", "조재표", "Jo Jaepyo", "귀환 일행 지휘자 · 미등록", "Leader of a return crossing party · unregistered"),
      portrait("person-1004", "K1004", "이연", "I Yeon", "수행 전령 · 미등록", "Attendant messenger · unregistered"),
    ],
    sources: [
      { label: { ko: "서울 밖과 테두리", en: "Beyond Seoul: the Rim" }, href: RIM },
      { label: { ko: "인물 기록 person-1003", en: "Person record person-1003" }, href: wikiPerson("person-1003") },
    ],
  },
  rim: {
    id: "rim", date: "대정전 무렵 → 2126",
    heading: { ko: "테두리와 수도 봉쇄", en: "The Rim and the Capital Blockade" },
    note: { ko: "서울 행정 경계 바깥 2~10킬로미터의 띠를 전쟁 기계들이 돈다. 사람이 내린 마지막 명령, 수도 봉쇄를 지키는 기계이며 최초의 AI의 부하가 아니다. 기계는 움직임과 열을 보고, 눈보라 동안만 그 눈이 가려진다.", en: "War machines circle a band two to ten kilometres outside Seoul's administrative boundary. They keep the last order people gave, the capital blockade; they are not the First AI's servants. They see movement and heat, and only a blizzard blinds them." },
    images: [scene("surface", "지상", "The surface", "테두리 쪽 지상 (장면 일러스트)", "The surface toward the rim (scene illustration)", RIM)],
    sources: [
      { label: { ko: "최초의 AI와 바깥 기계", en: "The First AI and the Machines Outside" }, href: MACHINES },
      { label: { ko: "서울 밖과 테두리", en: "Beyond Seoul: the Rim" }, href: RIM },
    ],
  },
  water: {
    id: "water", date: "2066 · 2096 · 2126",
    heading: { ko: "세 번의 급수계약", en: "Three Water Contracts" },
    note: { ko: "급수계약은 서른 해마다 맺는다. 큰 펌프와 수차를 통째로 고치는 주기가 대략 한 세대이기 때문이다. 첫째는 2066년, 둘째는 2096년, 셋째가 2126년 겨울이다. 세 번째 계약에는 잠실수중보의 전력과 암사 취수구를 가진 아크가 처음으로 앉는다.", en: "The water contract is renewed every thirty years, roughly one generation, the cycle on which the big pumps and water wheels are rebuilt whole. The first was in 2066, the second in 2096, and the third falls in the winter of 2126. At the third, the Arc, which holds the power of the Jamsil weir and the Amsa intake, takes a seat for the first time." },
    images: [scene("tunnel", "터널", "Tunnel", "역 사이의 터널 (장면 일러스트)", "A tunnel between stations (scene illustration)", ANNALS)],
    sources: [
      { label: { ko: "백 년 연표 2026~2126", en: "Century Annals 2026-2126" }, href: ANNALS },
      { label: { ko: "자유도시들의 사회 · 급수계약", en: "Free City Society · the water contract" }, href: FREECITY },
    ],
  },
  polities: {
    id: "polities", date: "2126",
    heading: { ko: "서울의 세 정체", en: "The Three Polities of Seoul" },
    note: { ko: "구 하나가 공작령 하나다. 정부가 한강 북쪽 열넷, 자유도시들이 남서쪽 일곱, 아크가 강남 넷을 쥔다. 그 밖의 나라는 없다.", en: "Each district is one duchy. The Government holds fourteen north of the Han, the Free Cities seven in the southwest, the Arc four in Gangnam. There are no other states." },
    images: [scene("railyard", "차량기지", "Depot", "역과 역을 잇는 선로 (장면 일러스트)", "The tracks that join station to station (scene illustration)", POLITIES)],
    sources: [{ label: { ko: "서울의 세 정체", en: "The Three Polities of Seoul" }, href: POLITIES }],
  },
  baptism: {
    id: "baptism", date: "2117 무렵 → 2126",
    heading: { ko: "세례와 부위 수", en: "Baptism and the Count of Parts" },
    note: { ko: "몸의 한 곳을 기계로 바꾸면 세례 하나다. 바꾼 곳의 수가 그 사람의 신앙의 수다. 오른쪽 깃에 부위 하나마다 실 한 줄을 박는다. 2126년 아크 사람 여섯 가운데 하나쯤이 세례자다.", en: "Each part of the body replaced with a machine is one baptism, and the number of parts is the measure of a person's faith. One line is stitched on the right collar for each part. In 2126 roughly one in six people of the Arc is baptised." },
    images: [scene("platform", "승강장", "Platform", "역의 정비대가 서는 승강장 (장면 일러스트)", "A platform where a station's bench stands (scene illustration)", ARCSOC)],
    sources: [
      { label: { ko: "아크 사회 · 세례", en: "Arc Society · baptism" }, href: ARCSOC },
      { label: { ko: "기계 몸과 결핍", en: "Machine Bodies and Scarcity" }, href: wikiDoc("Cyberware-and-Scarcity") },
    ],
  },
  deadCable: {
    id: "deadCable", date: "2112–2122",
    heading: { ko: "죽은 케이블이 이끈 곳", en: "Where the Dead Cable Led" },
    note: { ko: "고예진은 2112년 전력망을 고치다 죽은 케이블을 따라가 지도에 없는 역을 찾았고, 그곳에서 다섯 해 동안 매뉴얼을 읽었다. 2117년 무렵 첫 열두 명에게 세례를 주었고, 2122년 무렵 강남의 대피소들이 아크로 묶였다. 그 역의 실제 기록 이미지는 위키에 없다.", en: "In 2112, repairing the grid, Go Ye-jin followed a dead cable to a station on no map, and read the manuals there for five years. Around 2117 she baptised the first twelve, and around 2122 the shelters of Gangnam were bound together as the Arc. The wiki holds no record image of that station." },
    images: [scene("archive", "서고", "The archive", "2112–2117 · 매뉴얼의 방 (장면 일러스트)", "2112–2117 · the room of manuals (scene illustration)", ANNALS)],
    sources: [
      { label: { ko: "백 년 연표 · 2112~2122", en: "Century Annals · 2112-2122" }, href: ANNALS },
      { label: { ko: "아크 사회 · 교주와 메시아", en: "Arc Society · the Hierophant and the Messiah" }, href: ARCSOC },
    ],
  },
  mapo: {
    id: "mapo", date: "2126",
    heading: { ko: "마포 · 강 밑 터널의 장부 검문소", en: "Mapo · the Ledger Checkpoint of the Under-River Tunnel" },
    note: { ko: "정부는 강 밑 터널 북쪽 입구에 장부 검문소를 둔다. 마포–여의나루 터널과 합정·디지털미디어시티 다리의 북쪽 끝이 마포구에 있어, 세 번째 급수계약의 부속서에는 마포구 국회의원의 도장이 들어가야 한다.", en: "The Government keeps ledger checkpoints at the north entrances of the under-river tunnels. The Mapo–Yeouinaru tunnel and the northern ends of the Hapjeong and Digital Media City bridges lie in Mapo-gu, so the annexes of the third water contract must carry the stamp of the Member for Mapo-gu." },
    images: [portrait("person-1007", "K1007", "김연규", "Kim Yeongyu", "마포구 국회의원 · OMO당", "Member of the National Assembly for Mapo-gu · OMO Party")],
    sources: [
      { label: { ko: "정부 사회 · 세 번째 급수계약을 앞둔 정부", en: "Government Society · the Government before the third water contract" }, href: GOV },
      { label: { ko: "인물 기록 person-1007", en: "Person record person-1007" }, href: wikiPerson("person-1007") },
    ],
  },
  gwanak: {
    id: "gwanak", date: "2126",
    heading: { ko: "관악과 그 공작", en: "Gwanak and Its Duke" },
    note: { ko: "관악은 관악산의 땔감과 나무 섬유, 화강암을 뚫는 굴착으로 먹고산다. 관악의 대주회가 도장을 묶어 공작 자리는 이일섭의 집안 안에서 대물린다. 관악은 정부와 계약할 때 '공작령 대 공작령'으로 도장 찍기를 고집한다.", en: "Gwanak lives on the firewood and wood fibre of Gwanaksan and on drilling through its granite. Gwanak's masters' meeting bound the seal, so the dukedom passes within I Ilseop's house. In dealing with the Government, Gwanak insists on stamping duchy to duchy." },
    images: [portrait("person-0998", "K998", "이일섭", "I Ilseop", "관악 공작 · 제1분공방 이씨 가문 후계", "Duke of Gwanak · Heir of the I House of the First Branch Workshop")],
    sources: [
      { label: { ko: "자유도시들의 사회 · 관악", en: "Free City Society · Gwanak" }, href: FREECITY },
      { label: { ko: "인물 기록 person-0998", en: "Person record person-0998" }, href: wikiPerson("person-0998") },
    ],
  },
  baekya: {
    id: "baekya", date: "2126",
    heading: { ko: "백야 · 선정릉과 수서 사이의 무전", en: "Baekya · the Radio between Seonjeongneung and Suseo" },
    note: { ko: "신종목은 정부 장부에 파견 기재를 받은 등재민이지만 강남 논현2동에 산다. 귀환망 현장 계약자로서 테두리를 넘었다 돌아오는 사람을 무전과 피난처로 맞고, 선정릉과 수서 사이의 중계를 맡는다.", en: "Sin Jong-mok is a registered resident with a secondment entry in the Government ledger, but he lives in Nonhyeon 2-dong, Gangnam. As a Return Network field contractor he meets people coming back across the rim with radio and shelter, and keeps the relay between Seonjeongneung and Suseo." },
    images: [portrait("person-1009", "K1009", "신종목", "Sin Jong-mok", "귀환망 현장 계약자 · 호출부호 백야", "Return Network field contractor · callsign Baekya")],
    sources: [
      { label: { ko: "서울 밖과 테두리 · 귀환망", en: "Beyond Seoul: the Rim · the Return Network" }, href: RIM },
      { label: { ko: "인물 기록 person-1009", en: "Person record person-1009" }, href: wikiPerson("person-1009") },
    ],
  },
  suseo: {
    id: "suseo", date: "2126",
    heading: { ko: "수서 쇠 바꿈터", en: "The Suseo Metal Exchange" },
    note: { ko: "수서는 강남 곁집의 본역이고 옛 차량기지를 가졌다. 바꿈터에서는 테두리 너머에서 캐 온 동력 덩이 하나에 옛 차량기지 쇠붙이를 얼마나 내줄지 교섭인이 부른다. 세례와 다시 맞춤은 어떤 계약에도 넣지 않는다.", en: "Suseo is the home station of the Gangnam Near House and holds the old depot. At its exchange a negotiator calls how much old-depot iron to give for one power core dug up beyond the rim. Baptism and refitting are never put into any contract." },
    images: [scene("suseo", "수서", "Suseo", "수서 쪽 역 (장면 일러스트)", "Toward Suseo (scene illustration)", ARCSOC)],
    sources: [
      { label: { ko: "아크 사회 · 역의 바꿈터", en: "Arc Society · station exchanges" }, href: ARCSOC },
      { label: { ko: "인물 기록 person-0405", en: "Person record person-0405" }, href: wikiPerson("person-0405") },
    ],
  },
};

/** Line ID → panel. Only attaches; never alters spoken lines. */
export const EXHIBIT_BY_LINE: Record<string, Exhibit> = {
  "v7-open-03": EX.party,
  "v7-rim-02": EX.rim, "v7-rim-03": EX.rim,
  "v7-wat-03": EX.water, "v7-wat-04": EX.water,
  "v7-pol-02": EX.polities, "v7-pol-03": EX.polities,
  "v7-pol-04": EX.baptism, "v7-pol-05": EX.baptism,
  "v7-cbl-01": EX.deadCable, "v7-cbl-02": EX.deadCable,
  "v7-end-led-01": EX.mapo, "v7-end-led-02": EX.mapo,
  "v7-end-gwk-01": EX.gwanak, "v7-end-gwk-02": EX.gwanak,
  "v7-end-gng-01": EX.baekya,
  "v7-end-gng-02": EX.suseo, "v7-end-gng-03": EX.suseo,
};

export const KIND_LABEL: Record<ExhibitKind, { ko: string; en: string }> = {
  portrait: { ko: "관련 인물 초상 · 기록 사진 아님", en: "Related person's portrait · not a record image" },
  scene: { ko: "장면 일러스트 · 기록 사진 아님", en: "Scene illustration · not a record image" },
};
export const EXHIBIT_CREDIT = {
  ko: "이미지: 서울:전국 위키 공개 초상(art-proposal, 정본 승인 아님)과 쇼케이스 장면 일러스트. 이 사건들의 실제 기록 이미지는 위키에 없다.",
  en: "Images: published wiki portraits (art-proposal, not canon-approved) and the showcase's own scene illustrations. The wiki holds no actual record image of these events.",
};
