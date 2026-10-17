const PROFILE_SOURCES = Object.freeze([
  ...Array.from({ length: 16 }, (_, index) => [`lore/characters/Cast-State-${String(index + 1).padStart(2, '0')}.json`, 'state']),
  ['lore/characters/Core-Characters.json', 'core'],
  ['lore/characters/Cast-Unaffiliated.json', 'unaffiliated'],
  ['lore/factions/Diaspora-Corridors.json', 'corridor'],
]);
const RELATION_PATH = 'lore/characters/Cast-Relations.json';
const RELATION_TYPES = new Set(['친족', '양자', '사제', '지휘', '계약', '빚', '맹세', '경쟁', '원한', '보호체류', '배신']);

function fail(code, detail) {
  throw Object.assign(new Error(`${code}:${detail}`), { code });
}

function sourceFile(bundle, path, duplicateCode) {
  const matches = bundle.files.filter((file) => file.logical_path === path);
  if (matches.length > 1) fail(duplicateCode, path);
  if (matches.length !== 1) fail('E_SOURCE_MISSING', path);
  const file = matches[0];
  if (!Array.isArray(file.document?.content)) fail('E_SOURCE_CONTENT', path);
  return file;
}

function textLeaf(value, code) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((run) => run && typeof run.text === 'string')) return value.map((run) => run.text).join('');
  fail(code, 'expected string or text runs');
}

function identityMaps(identity) {
  const byName = new Map();
  const byId = new Map();
  for (const person of identity.people) {
    if (byName.has(person.name) || byId.has(person.person_id)) fail('E_PROFILE_IDENTITY_DUPLICATE', person.name);
    byName.set(person.name, person);
    byId.set(person.person_id, person);
  }
  return { byName, byId };
}

function freezeRows(result) {
  return Object.freeze(Object.fromEntries(Object.entries(result).map(([key, rows]) => [key, Object.freeze(rows.map(Object.freeze))])));
}

function profileEnd(content, start) {
  const depth = content[start].depth;
  for (let index = start + 1; index < content.length; index += 1) {
    if (content[index].kind === 'heading' && content[index].depth <= depth) return index;
  }
  return content.length;
}

function corridorPerson(content, start, end, name, maps) {
  const names = [...maps.byName.values()].filter((person) => name === person.name || name.startsWith(`${person.name} (`));
  if (names.length > 1) fail('E_PROFILE_ID_CONFLICT', name);
  const ids = [];
  for (const node of content.slice(start + 1, end)) {
    if (node.kind === 'list') {
      for (const item of node.items) {
        const match = textLeaf(item.ko, 'E_PROFILE_TEXT').match(/^캐릭터 ID:\s*(\S+)\s*$/u);
        if (match) ids.push(match[1]);
      }
    }
    if (node.kind === 'table') {
      for (const row of node.rows) {
        if (textLeaf(row[0]?.ko, 'E_PROFILE_TEXT') === '캐릭터 ID') ids.push(textLeaf(row[1]?.ko, 'E_PROFILE_TEXT'));
      }
    }
  }
  if (new Set(ids).size > 1) fail('E_PROFILE_ID_CONFLICT', name);
  const person = ids.length ? maps.byId.get(ids[0]) : names[0];
  if (!person) fail('E_PROFILE_ORPHAN', `${name}:${ids.join(',')}`);
  if (names[0] && names[0].person_id !== person.person_id) fail('E_PROFILE_ID_CONFLICT', name);
  return person;
}

function profileAnchor(kind, name, heading) {
  if (kind === 'core') return name;
  if (kind !== 'corridor') return `인물-${name}`;
  return heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');
}

function splitFields(text, bullet) {
  const sections = [...text.matchAll(/\*\*([^*\n]+?)\.\*\*/gu)];
  const result = [];
  const lead = text.slice(0, sections[0]?.index ?? text.length).trim();
  if (lead) {
    const colon = bullet ? lead.indexOf(':') : -1;
    result.push(colon >= 0
      ? { kind: 'bullet', key: lead.slice(0, colon).trim(), value: lead.slice(colon + 1).trim() }
      : { kind: 'lead', key: null, value: lead });
  }
  for (let index = 0; index < sections.length; index += 1) {
    const match = sections[index];
    result.push({ kind: 'section', key: match[1].trim(), value: text.slice(match.index + match[0].length, sections[index + 1]?.index ?? text.length).trim() });
  }
  return result;
}

function collectFields({ file, profile, renderLoreMarkdown }) {
  const fields = [];
  const render = (text, locale) => {
    textLeaf(text[locale], 'E_PROFILE_TEXT');
    return renderLoreMarkdown({ ...file.document, content: [{ kind: 'paragraph', text }] }, locale).trim();
  };
  const emit = (jsonPointer, ko, en) => {
    fields.push({
      profile_id: profile.profile_id, field_ordinal: fields.length,
      field_kind: (ko ?? en).kind,
      key_ko: ko?.key ?? null, key_en: en?.key ?? null,
      value_ko: ko?.value ?? null, value_en: en?.value ?? null,
      source_id: file.source_id, json_pointer: jsonPointer,
    });
  };
  const collect = (text, jsonPointer, bullet = false) => {
    const ko = splitFields(render(text, 'ko'), bullet);
    const en = splitFields(render(text, 'en'), bullet);
    let korean = 0;
    let english = 0;
    while (korean < ko.length || english < en.length) {
      if (ko[korean] && en[english] && ko[korean].kind === en[english].kind) {
        emit(jsonPointer, ko[korean++], en[english++]);
      } else if (ko[korean]) {
        emit(jsonPointer, ko[korean++], null);
      } else {
        emit(jsonPointer, null, en[english++]);
      }
    }
  };
  for (let index = profile.node_start + 1; index < profile.node_end; index += 1) {
    const node = file.document.content[index];
    const pointer = `/content/${index}`;
    if (node.kind === 'paragraph' || node.kind === 'quote') collect(node.text, `${pointer}/text`);
    if (node.kind === 'list') node.items.forEach((item, ordinal) => collect(item, `${pointer}/items/${ordinal}`, true));
    if (node.kind === 'table') {
      node.rows.forEach((row, ordinal) => {
        if (row.length !== 2) return;
        emit(`${pointer}/rows/${ordinal}`, { kind: 'bullet', key: render(row[0], 'ko'), value: render(row[1], 'ko') }, { kind: 'bullet', key: render(row[0], 'en'), value: render(row[1], 'en') });
      });
    }
  }
  return fields;
}

/** Maps every authored card; node_start is inclusive and node_end exclusive. */
export function mapProfiles({ bundle, identity, renderLoreMarkdown }) {
  if (typeof renderLoreMarkdown !== 'function') fail('E_PROFILE_RENDERER', 'trusted renderer required');
  const maps = identityMaps(identity);
  const profiles = [];
  const profileNodes = [];
  const profileFields = [];
  const candidates = new Map();
  for (const [path, kind] of PROFILE_SOURCES) {
    const file = sourceFile(bundle, path, 'E_PROFILE_SOURCE_DUPLICATE');
    const content = file.document.content;
    let ordinal = 0;
    for (let start = 0; start < content.length; start += 1) {
      const node = content[start];
      if (node.kind !== 'heading' || node.depth !== (kind === 'core' ? 2 : 3)) continue;
      const headingKo = textLeaf(node.text.ko, 'E_PROFILE_TEXT');
      const name = kind === 'core' ? headingKo : headingKo.match(/^인물 (.+)$/u)?.[1];
      if (!name || (kind === 'core' && !maps.byName.has(name))) continue;
      const end = profileEnd(content, start);
      const person = kind === 'corridor' ? corridorPerson(content, start, end, name, maps) : maps.byName.get(name);
      if (!person) fail('E_PROFILE_ORPHAN', `${path}:${name}`);
      const profile = {
        profile_id: `profile-${String(profiles.length + 1).padStart(4, '0')}`,
        person_id: person.person_id, source_id: file.source_id,
        heading_pointer: `/content/${start}`, source_kind: kind, source_ordinal: ordinal++,
        heading_depth: node.depth, anchor: profileAnchor(kind, person.name, headingKo),
        heading_ko: headingKo, heading_en: textLeaf(node.text.en, 'E_PROFILE_TEXT'),
        node_start: start, node_end: end, is_primary: 0,
      };
      profiles.push(profile);
      for (let index = start; index < end; index += 1) {
        profileNodes.push({ profile_id: profile.profile_id, node_ordinal: index - start, source_id: file.source_id, json_pointer: `/content/${index}` });
      }
      profileFields.push(...collectFields({ file, profile, renderLoreMarkdown }));
      const body = renderLoreMarkdown({ ...file.document, content: content.slice(start + 1, end) }, 'ko').trim();
      const cards = candidates.get(person.person_id) ?? [];
      cards.push({ profile, length: body.length, explicit: file.document.data?.primary_detail_names?.includes(person.name) ?? false });
      candidates.set(person.person_id, cards);
    }
  }
  for (const person of identity.people) {
    const cards = candidates.get(person.person_id);
    if (!cards?.length) fail('E_PROFILE_COVERAGE', person.person_id);
    const primary = cards.find((card) => card.explicit) ?? cards.reduce((best, card) => card.length > best.length ? card : best);
    primary.profile.is_primary = 1;
  }
  return freezeRows({ profiles, profileNodes, profileFields });
}

/** Preserves one directed row per authored table row, including repeated edges. */
export function mapRelations({ bundle, identity }) {
  const file = sourceFile(bundle, RELATION_PATH, 'E_RELATION_ORDINAL_DUPLICATE');
  const maps = identityMaps(identity);
  const relations = [];
  const translations = new Map([...RELATION_TYPES].map((name) => [name, new Set()]));
  let sectionAnchor = null;
  file.document.content.forEach((node, nodeIndex) => {
    if (node.kind === 'heading') sectionAnchor = node.anchor ?? null;
    if (node.kind !== 'table') return;
    if (!Array.isArray(node.rows) || node.columns?.length !== 4) fail('E_RELATION_ROW', `/content/${nodeIndex}`);
    node.rows.forEach((cells, rowIndex) => {
      const jsonPointer = `/content/${nodeIndex}/rows/${rowIndex}`;
      if (!Array.isArray(cells) || cells.length !== 4) fail('E_RELATION_ROW', jsonPointer);
      const ko = cells.map((cell) => textLeaf(cell.ko, 'E_RELATION_TEXT'));
      const en = cells.map((cell) => textLeaf(cell.en, 'E_RELATION_TEXT'));
      const from = maps.byName.get(ko[0]);
      const to = maps.byName.get(ko[2]);
      if (!from || !to) fail('E_RELATION_ENDPOINT_ORPHAN', `${jsonPointer}:${ko[0]}:${ko[2]}`);
      if (!RELATION_TYPES.has(ko[1])) fail('E_RELATION_TYPE', ko[1]);
      translations.get(ko[1]).add(en[1]);
      const ordinal = relations.length;
      relations.push({
        relation_id: `relation-${String(ordinal + 1).padStart(4, '0')}`,
        source_id: file.source_id, row_ordinal: ordinal, section_anchor: sectionAnchor,
        from_person_id: from.person_id, to_person_id: to.person_id,
        type_ko: ko[1], type_en: en[1], grounds_ko: ko[3], grounds_en: en[3], json_pointer: jsonPointer,
      });
    });
  });
  const relationTypes = [...translations].map(([type_ko, observed], type_ordinal) => ({
    type_ko, type_en: observed.size === 1 ? [...observed][0] : null, type_ordinal,
  }));
  return freezeRows({ relationTypes, relations });
}
