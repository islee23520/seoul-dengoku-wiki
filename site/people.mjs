// Static page generators for people, clans and family trees. All data comes from the SQL tables loaded by build.mjs.
// Pure functions: (rows, locale strings) -> Markdown / HTML text. No filesystem or network access here.

const AXIS = {
  values: {
    '권위': { icon: '👑', plus: ['Prefers authoritative order', '권위적 질서 선호'], minus: ['Prefers autonomy and equality', '자율·평등 선호'] },
    '개방': { icon: '🌊', plus: ['Accepts outsiders', '외부인 수용'], minus: ['In-group first', '내집단 우선'] },
    '무력': { icon: '⚔️', plus: ['Prefers force', '무력 해결 선호'], minus: ['Prefers negotiation', '협상·설득 선호'] },
    '물질': { icon: '💰', plus: ['Values practical gain', '실리·이익 중시'], minus: ['Values ideals and loyalty', '이념·신의 중시'] },
    '공동': { icon: '🤝', plus: ['Community first', '공동체 우선'], minus: ['Individual first', '개인 우선'] },
    '원칙': { icon: '📏', plus: ['Strict about rules', '규칙 엄수'], minus: ['Values flexibility', '융통성 중시'] },
    '공개': { icon: '📢', plus: ['Seeks transparency', '투명성 추구'], minus: ['Secretive', '비밀주의'] },
    '자격': { icon: '🎖️', plus: ['Backs qualification review', '자격심사 옹호'], minus: ['Egalitarian', '평등주의'] },
    '분산': { icon: '🌳', plus: ['Distributed decisions', '분산 의사결정'], minus: ['Centralised decisions', '집중 의사결정'] },
    '변혁': { icon: '🔄', plus: ['Seeks radical change', '급진적 변화 추구'], minus: ['Prefers the status quo', '현상 유지 선호'] },
  },
  desire: {
    '갈망': { icon: '🔥', plus: ['Strong appetite', '강한 욕구 추구'], minus: ['Restraint and abstinence', '절제·금욕'] },
    '독점': { icon: '🔒', plus: ['Seeks exclusivity', '독점·소유 추구'], minus: ['Sharing and openness', '공유·개방'] },
    '위험': { icon: '⚡', plus: ['Takes risks', '위험 감수'], minus: ['Seeks safety', '안전 추구'] },
    '과시': { icon: '✨', plus: ['Shows off', '과시·드러냄'], minus: ['Modest and hidden', '겸손·숨김'] },
    '지속': { icon: '🏔️', plus: ['Lasting relationships', '지속적 관계'], minus: ['Short-lived ties', '일회성 관계'] },
  },
};
// English labels for the axis names (the JSON keys are Korean in both locales; English output maps them here).
const AXIS_NAME_EN = { '권위': 'Authority', '개방': 'Openness', '무력': 'Force', '물질': 'Material', '공동': 'Community', '원칙': 'Principle', '공개': 'Disclosure', '자격': 'Qualification', '분산': 'Decentralisation', '변혁': 'Transformation', '갈망': 'Craving', '독점': 'Exclusivity', '위험': 'Risk', '과시': 'Display', '지속': 'Persistence' };
const ABILITY = { diplomacy: ['Diplomacy', '외교'], martial: ['Martial', '군사'], stewardship: ['Stewardship', '관리'], intrigue: ['Intrigue', '음모'], learning: ['Learning', '학식'], prowess: ['Prowess', '무용'] };
const BODY = { 'left-arm': ['Left arm', '왼팔'], 'right-arm': ['Right arm', '오른팔'], 'left-leg': ['Left leg', '왼다리'], 'right-leg': ['Right leg', '오른다리'], head: ['Head', '머리'], torso: ['Torso', '몸통'] };
const SECTION_ORDER_KO = ['생애', '관직', '훈련', '호위 대열', '일화', '가문', '관계', '야망', '공포', '개입'];
const SECTION_EN = { '생애': 'Life', '관직': 'Offices', '훈련': 'Training', '호위 대열': 'Guard Formation', '일화': 'Anecdote', '가문': 'Houses', '관계': 'Relationships', '야망': 'Ambition', '공포': 'Fear', '개입': 'Intervention' };
const FAITH = { unknown: ['Unknown', '미확인'], christian: ['Christian', '기독교'], 'non-christian': ['Non-Christian', '비기독교'] };

const STR = {
  en: {
    profile: 'Abilities and Traits', ability: 'Ability', base: 'Base', final: 'Final', skills: 'Skills', skill: 'Skill', level: 'Level', traits: 'Traits', behavior: 'Behavior', stress: 'Stress', relationship: 'Relationship', health: 'Physical condition', unassessed: 'Physical condition has not been assessed yet.', part: 'Part', severity: 'Severity',
    abilityNote: 'A base ability of 10 is a trained practitioner. The base cap is 20 and the final cap, with every effect applied, is 100.',
    basics: 'Basic Information', name: 'Name', state: 'Organization', stateId: 'State ID', faction: 'Faction', birth: 'Date of birth', age: 'Age', ageAsOf: 'Age as of', position: 'Position', tier: 'Common tier', rank: 'State rank', occupation: 'Occupation', gender: 'Gender', stage: 'Stage', generation: 'Generation',
    relations: 'Relationships and Ties', liege: 'Direct liege', contact: 'Work contact', courtVassal: 'Court vassal', canon: 'Canonical Detail', fullCard: 'Full canonical card text',
    values: 'Values', desire: 'Desire', orientation: 'Orientation', union: 'Union', household: 'Household and Faith', personFaith: 'Personal faith', houseFaith: 'House faith', humanoid: 'Humanoid admission to the household', humanoidExcluded: 'Excluded by the political power the person belongs to', humanoidReview: 'Reviewed individually',
    titles: 'Opening Territorial Titles and Superior Jurisdiction', holdings: 'Directly Held Domains and Facilities', subHoldings: 'Domains Held by Vassals of this Duchy', retinue: 'Retinue',
    clanLine: (n) => `${n} family tree`, noClan: 'No bongwan (clan seat)', family: 'Family tree', crest: 'crest',
    permissions: 'Name and Likeness Permission', nameUse: 'Name use', likenessUse: 'Likeness use', granted: 'Granted', recorded: 'Recorded on', yes: 'yes', none: 'none',
    clanIndex: 'Clan Index', clanLead: (c, n) => `${c} bongwan clans with ${n} recorded members. Each clan page lists its members and family tree.`, nonKorean: 'Families Without a Bongwan', nonKoreanLead: 'These families do not use a Korean clan seat or generation names.',
    members: (n) => `Family members (${n})`, branches: 'Re-agreed branches', treeTitle: 'Family tree', generation_n: (n) => `Generation ${n}`, unknownParent: 'Parent not recorded', person: 'Person', historical: 'Historical ancestor', preserved: 'preserved', authored: 'authored', bio: 'born', died: 'died', open: 'open page',
    peopleTitle: 'People', search: 'Search', searchPh: 'e.g. Yun Seorin, water supply, S04', filters: 'People filters', all: 'All', reset: 'Reset filters', resultCount: (n) => `${n} results`, sortHint: 'Sorted by name',
    f: { faction: 'Faction', state: 'Organization', tier: 'Rank (common tier)', occupation: 'Occupation', gender: 'Gender' }, cols: { name: 'Name', title: 'Title', state: 'Organization', occupation: 'Occupation', rank: 'Rank' },
    noscript: 'Filtering needs JavaScript; the full list is below.', unregistered: 'Unregistered',
  },
  ko: {
    profile: '역량과 특성', ability: '역량', base: '기본', final: '최종', skills: '행동 숙련', skill: '숙련', level: '수준', traits: '특성', behavior: '행동', stress: '스트레스', relationship: '관계', health: '신체 상태', unassessed: '신체 상태는 아직 평가되지 않았습니다.', part: '부위', severity: '손상 정도',
    abilityNote: '기본 역량 10은 해당 분야 숙련자 수준입니다. 기본 상한은 20, 모든 효과를 반영한 최종 상한은 100입니다.',
    basics: '기본 정보', name: '이름', state: '소속 단체', stateId: '국가 ID', faction: '세력', birth: '생년월일', age: '만 나이', ageAsOf: '나이 기준일', position: '직위', tier: '직급(공통 티어)', rank: '국가 품계', occupation: '직업', gender: '성별', stage: '단계', generation: '세대',
    relations: '관계와 접점', liege: '직속 주군', contact: '업무 접점', courtVassal: '궁정 가신', canon: '정본 상세', fullCard: '정본 카드 원문 전체',
    values: '가치관', desire: '욕망', orientation: '지향', union: '결합', household: '가정과 신앙', personFaith: '개인 신앙', houseFaith: '가문 신앙', humanoid: '휴머노이드 가정 반입', humanoidExcluded: '소속 정치 세력의 반입 배제', humanoidReview: '개별 심사',
    titles: '개막 영토 작위와 상위 관할', holdings: '직접 보유 영지와 시설', subHoldings: '공작령 내 봉신 보유 영지', retinue: '가신단',
    clanLine: (n) => `${n} 가계도`, noClan: '본관 없음', family: '가계도', crest: '문장',
    permissions: '이름·초상 사용 허가', nameUse: '이름 사용', likenessUse: '초상 사용', granted: '허가됨', recorded: '기록일', yes: '예', none: '없음',
    clanIndex: '본관 가문 색인', clanLead: (c, n) => `본관 가문 ${c}개, 등록 인물 ${n}명. 각 가문 페이지에서 구성원과 가계도를 볼 수 있습니다.`, nonKorean: '본관을 적용하지 않는 가계', nonKoreanLead: '한국 문중의 본관이나 항렬을 적용하지 않는 가계입니다.',
    members: (n) => `가문 인물 (${n}명)`, branches: '재합의한 가계', treeTitle: '가계도', generation_n: (n) => `${n}세대`, unknownParent: '부모 미기록', person: '인물', historical: '역사 속 선대', preserved: '보존', authored: '저작', bio: '출생', died: '사망', open: '페이지 열기',
    peopleTitle: '인물', search: '검색', searchPh: '예: 윤서린, 급수, S4', filters: '등장인물 필터', all: '전체', reset: '필터 초기화', resultCount: (n) => `검색 결과 ${n}명`, sortHint: '이름순',
    f: { faction: '세력', state: '소속 단체', tier: '직급(공통 티어)', occupation: '직업', gender: '성별' }, cols: { name: '이름', title: '직함', state: '소속 단체', occupation: '직업', rank: '직급' },
    noscript: '필터는 자바스크립트가 필요합니다. 전체 목록은 아래에 있습니다.', unregistered: '미등록',
  },
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cell = (s) => String(s ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ').replace(/</g, '&lt;');
const hasText = (v) => v !== null && v !== undefined && v !== '';

function axisRows(entries, meta, i, ko) {
  return entries.filter(([k, v]) => typeof v === 'number' && meta[k]).map(([k, v]) => {
    const m = meta[k]; const plus = v >= 0; const pct = Math.abs(v) / 100 * 50;
    const label = ko ? k : (AXIS_NAME_EN[k] ?? k);
    const desc = (plus ? m.plus : m.minus)[ko ? 1 : 0];
    return `<div class="axis-row" title="${esc(desc)}"><span class="axis-icon" aria-hidden="true">${m.icon}</span><span class="axis-name">${esc(label)}</span><span class="axis-bar" role="img" aria-label="${esc(label)} ${v}"><span class="axis-fill ${plus ? 'plus' : 'minus'}" style="width:${pct}%;margin-left:${plus ? 50 : 50 - pct}%"></span></span><span class="axis-value">${v > 0 ? `+${v}` : v}</span><span class="axis-desc">${esc(desc)}</span></div>`;
  }).join('');
}

/** One person page (Markdown with embedded HTML blocks). `d` is the parsed detail JSON for the locale; `p` the roster row. */
export function personPage({ p, d, dKo, ko, g, P, stateRow, factionName, clan }) {
  const S = ko ? STR.ko : STR.en;
  const L = (k) => (ko ? p[`${k}_ko`] : p[k]);
  const out = [];
  out.push(`# ${L('name')}\n`);
  if (clan) out.push(`<p class="person-clan-line"><img src="/clan-crests/${clan.id}.svg" alt="${esc(L('name'))} ${S.crest}" width="48" height="48" loading="lazy" onerror="this.remove()"> <a href="${P(`wiki/families/${clan.id}/`)}">${esc(S.clanLine(ko ? `${clan.bongwan_ko} ${clan.surname_ko}씨` : `${clan.bongwan} ${clan.surname}`))}</a></p>\n`);
  else if (d) out.push(`<p class="person-clan-line">${esc(S.noClan)}</p>\n`);
  const rows = [
    [S.name, L('name')], [S.state, stateRow ? cell(g(stateRow, 'name')) : cell(L('state_name'))], [S.stateId, p.state_id],
    [S.faction, `[${cell(factionName(p.faction_id))}](${P(`wiki/factions/${p.faction_id}/`)})`],
    ...(d?.birthDate ? [[S.birth, d.birthDate], [S.age, d.age], [S.ageAsOf, d.ageAsOf]] : []),
    [S.position, L('position')], [S.tier, p.tier], [S.rank, L('rank')], [S.occupation, L('occupation')], [S.gender, L('gender')], [S.stage, L('stage')],
    ...(d?.generation ? [[S.generation, d.generation]] : []),
    ...Object.entries(d?.fields ?? {}).filter(([k]) => !['가치관', '욕망', '직위', '소속', 'Values', 'Desire', 'Position', 'Affiliation'].includes(k)).map(([k, v]) => [k, v]),
  ].filter(([, v]) => hasText(v));
  out.push(`## ${S.basics}\n\n| ${ko ? '항목' : 'Field'} | ${ko ? '값' : 'Value'} |\n| --- | --- |\n${rows.map(([k, v]) => `| ${cell(k)} | ${/^\[.*\]\(.*\)$/.test(String(v)) ? v : cell(v)} |`).join('\n')}\n`);
  if (!d) return out.join('\n');

  const prof = d.characterProfile;
  if (prof) {
    out.push(`## ${S.profile}\n`);
    if (prof.narrative) out.push(`${cell(prof.narrative)}\n`);
    const abilityRows = Object.entries(ABILITY).filter(([k]) => prof.abilities?.[k]).map(([k, [en, kor]]) => `| ${ko ? kor : en} | ${prof.abilities[k].base} | ${prof.abilities[k].effective} |`);
    out.push(`| ${S.ability} | ${S.base} | ${S.final} |\n| --- | --- | --- |\n${abilityRows.join('\n')}\n\n${S.abilityNote}\n`);
    if (prof.skills?.length) out.push(`### ${S.skills}\n\n| ${S.skill} | ${S.level} |\n| --- | --- |\n${prof.skills.map((s) => `| ${cell(s.name)} | ${s.rating} |`).join('\n')}\n`);
    if (prof.traits?.length) out.push(`### ${S.traits}\n\n${prof.traits.map((t) => `#### ${t.name}\n\n${cell(t.description)}\n\n- **${S.behavior}:** ${cell(t.behavior)}\n- **${S.stress}:** ${cell(t.stress)}\n- **${S.relationship}:** ${cell(t.relationship)}\n`).join('\n')}`);
    if (prof.health) out.push(`<details><summary>${S.health}</summary>\n\n${prof.health.status === 'unassessed' ? S.unassessed : cell(prof.health.status)}\n\n</details>\n`);
  }
  const rel = [];
  if (d.directLiege) rel.push([`${S.liege} · ${d.directLiege.name}`, `2126 · ${d.directLiege.ownerTerm ?? d.directLiege.courtId ?? ''}`]);
  for (const c of d.proseContacts ?? []) rel.push([`${S.contact} · ${c.recipientName}`, c.basis]);
  for (const m of d.court?.members ?? []) rel.push([`${S.courtVassal} · ${m.name}`, `2126 · ${d.court.id}`]);
  for (const r of d.relations?.outgoing ?? []) rel.push([`→ ${r.to} · ${r.type}`, r.basis]);
  for (const r of d.relations?.incoming ?? []) rel.push([`← ${r.from} · ${r.type}`, r.basis]);
  if (rel.length) out.push(`## ${S.relations}\n\n| ${ko ? '항목' : 'Field'} | ${ko ? '내용' : 'Detail'} |\n| --- | --- |\n${rel.map(([k, v]) => `| ${cell(k)} | ${cell(v)} |`).join('\n')}\n`);

  const order = ko ? SECTION_ORDER_KO : SECTION_ORDER_KO.map((k) => SECTION_EN[k]);
  const sections = d.sections ?? {};
  const present = order.filter((k) => sections[k]);
  if (present.length) out.push(`## ${S.canon}\n\n${present.map((k) => `### ${k}\n\n${sections[k]}\n`).join('\n')}`);
  if (d.biography) out.push(`<details><summary>${S.fullCard}</summary>\n\n${d.biography}\n\n</details>\n`);

  if (d.household) {
    const f = (v) => (FAITH[v] ?? [v, v])[ko ? 1 : 0];
    out.push(`## ${S.household}\n\n| ${ko ? '항목' : 'Field'} | ${ko ? '값' : 'Value'} |\n| --- | --- |\n| ${S.personFaith} | ${f(d.household.personFaith)} |\n| ${S.houseFaith} | ${f(d.household.houseFaith)} |\n| ${S.humanoid} | ${d.household.humanoidAdmission === 'excluded' ? S.humanoidExcluded : S.humanoidReview} |\n`);
  }
  if (d.openingTitles?.length) out.push(`## ${S.titles}\n\n${d.openingTitles.map((t) => `- **${cell(t.name)}** (${cell(t.rank)})${t.basis ? ` — ${cell(t.basis)}` : ''}`).join('\n')}\n`);
  for (const grp of d.retinueGroups ?? []) out.push(`## ${cell(grp.name)}\n\n${grp.count} · ${(grp.duties ?? []).map(cell).join(' · ')}\n`);
  if (d.confirmedHoldings?.length) out.push(`## ${S.holdings}\n\n${d.confirmedHoldings.map((h) => `### ${cell(typeof h.name === 'object' ? (h.name[ko ? 'ko' : 'en'] ?? h.name.ko) : h.name)}\n\n${h.stationRef ? `${cell(h.stationRef.stationName)}\n\n` : ''}${(h.adminRefs ?? []).length ? `${h.adminRefs.map((r) => `- ${cell(r.name)}`).join('\n')}\n` : ''}${h.facilityRef ? `\n${cell(h.facilityRef.stationName)} · ${cell(h.facilityRef.layerName)}\n` : ''}`).join('\n')}`);
  if (d.subordinateHoldings?.length) out.push(`## ${S.subHoldings}\n\n${d.subordinateHoldings.map((h) => `### ${cell(h.name)}\n\n${cell(h.holderName ?? '')}\n`).join('\n')}`);
  const src = dKo ?? d;
  const vals = axisRows(Object.entries(src.values ?? {}), AXIS.values, 0, ko);
  const des = axisRows(Object.entries(src.desire ?? {}), AXIS.desire, 0, ko);
  if (vals || des) {
    const enDesire = d.desire ?? {};
    const orient = ko ? src.desire?.['지향'] : enDesire.Orientation;
    const union = ko ? src.desire?.['결합'] : enDesire.Union;
    const extra = [orient ? `${S.orientation}: ${orient}` : '', union ? `${S.union}: ${union}` : ''].filter(Boolean);
    out.push(`<section class="values-desire">${vals ? `<div class="values-block"><h2>${S.values}</h2>${vals}</div>` : ''}${des ? `<div class="desire-block"><h2>${S.desire}</h2>${des}${extra.length ? `<p class="desire-extras">${extra.map(esc).join(' · ')}</p>` : ''}</div>` : ''}</section>\n`);
  }
  const perm = d.rightsPermissions;
  if (perm) out.push(`## ${S.permissions}\n\n| ${ko ? '항목' : 'Field'} | ${ko ? '값' : 'Value'} |\n| --- | --- |\n| ${S.nameUse} | ${S.granted === perm.nameUse?.status ? S.granted : cell(perm.nameUse?.status)} · ${S.recorded} ${cell(perm.nameUse?.recordedOn)} |\n| ${S.likenessUse} | ${cell(perm.likenessUse?.status)} · ${S.recorded} ${cell(perm.likenessUse?.recordedOn)} |\n`);
  return out.join('\n');
}

/** Family tree as an inline SVG, laid out by generation exactly like the old FamilyTree component (rows of nodes, parent->child connectors). */
export function familyTreeSvg(tree, { ko, P, personIdByCharacter }) {
  const S = ko ? STR.ko : STR.en;
  const nodes = new Map(tree.nodes.map((n) => [n.id, n]));
  const parents = new Map(); // child -> [parent ids]
  for (const e of tree.edges) { if (!parents.has(e.to)) parents.set(e.to, []); parents.get(e.to).push(e.from); }
  const memo = new Map();
  const level = (id, seen = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (seen.has(id)) return 0;
    seen.add(id);
    const ps = parents.get(id) ?? [];
    const v = ps.length ? 1 + Math.max(...ps.map((x) => level(x, seen))) : 0;
    memo.set(id, v); return v;
  };
  // generation 0 is the oldest ancestor row
  const depthOf = new Map(); let maxD = 0;
  for (const n of tree.nodes) { const d = level(n.id); depthOf.set(n.id, d); maxD = Math.max(maxD, d); }
  const rows = new Map();
  for (const n of tree.nodes) { const d = depthOf.get(n.id); if (!rows.has(d)) rows.set(d, []); rows.get(d).push(n); }
  const W = 200, H = 84, GX = 24, GY = 76, PAD = 70;
  const widest = Math.max(...[...rows.values()].map((r) => r.length));
  const width = PAD + widest * (W + GX) + 20;
  const height = (maxD + 1) * (H + GY) + 20;
  const pos = new Map();
  for (const [d, list] of rows) {
    const total = list.length * (W + GX) - GX;
    const x0 = PAD + (width - PAD - 20 - total) / 2;
    list.forEach((n, i) => pos.set(n.id, { x: x0 + i * (W + GX), y: 10 + d * (H + GY) }));
  }
  const parts = [];
  for (const d of rows.keys()) parts.push(`<text x="6" y="${10 + d * (H + GY) + H / 2 + 4}" class="ft-gen">${esc(S.generation_n(d + 1))}</text>`);
  for (const e of tree.edges) {
    const a = pos.get(e.from), b = pos.get(e.to); if (!a || !b) continue;
    const ax = a.x + W / 2, ay = a.y + H, bx = b.x + W / 2, by = b.y, my = ay + GY / 2;
    parts.push(`<path d="M ${ax} ${ay} V ${my} H ${bx} V ${by}" class="ft-edge ${e.type}"/>`);
  }
  for (const n of tree.nodes) {
    const q = pos.get(n.id);
    const pid = personIdByCharacter.get(n.personId ?? n.id);
    const label = esc(n.name);
    const dates = `${n.birthDate ?? '?'}${n.deathDate ? ` – ${n.deathDate}` : ''}`;
    const aff = n.affiliation?.name ? esc(n.affiliation.name) : '';
    const body = `<rect x="${q.x}" y="${q.y}" width="${W}" height="${H}" rx="6" class="ft-node ${n.kind}"/><text x="${q.x + 10}" y="${q.y + 26}" class="ft-name">${label}</text><text x="${q.x + 10}" y="${q.y + 46}" class="ft-meta">${esc(dates)}</text>${aff ? `<text x="${q.x + 10}" y="${q.y + 66}" class="ft-meta">${aff}</text>` : `<text x="${q.x + 10}" y="${q.y + 66}" class="ft-meta">${esc(n.kind === 'historical' ? S.historical : S.person)}</text>`}`;
    parts.push(pid && n.kind === 'person' ? `<a href="${P(`wiki/people/${pid}/`)}" aria-label="${label}">${body}</a>` : `<g>${body}</g>`);
  }
  return `<div class="ft-wrap"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(S.treeTitle)}">${parts.join('')}</svg></div>`;
}

export { STR };
