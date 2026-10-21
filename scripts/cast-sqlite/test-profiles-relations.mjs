import { readSourceArchive } from './source-archive.mjs';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { mapProfiles, mapRelations } from './profiles-relations.mjs';

const statePaths = Array.from({ length: 16 }, (_, i) => `lore/characters/Cast-State-${String(i + 1).padStart(2, '0')}.json`);
const profilePaths = [...statePaths, 'lore/characters/Core-Characters.json', 'lore/characters/Cast-Unaffiliated.json', 'lore/factions/Diaspora-Corridors.json'];
const relationPath = 'lore/characters/Cast-Relations.json';
const leaf = (ko, en = ko) => ({ ko, en });
const heading = (ko, depth = 3, anchor = ko.replaceAll(' ', '-')) => ({ kind: 'heading', depth, anchor, text: leaf(ko, `English ${ko}`) });
const paragraph = (ko, en = ko) => ({ kind: 'paragraph', text: leaf(ko, en) });
const rich = (...parts) => parts.flatMap((part, index) => index % 2 === 0 ? [{ text: part, strong: true }] : [{ text: part }]);
const people = [{ person_id: 'K001', name: '가람' }, { person_id: 'K002', name: '나래' }];
const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('');
const markdownLeaf = (value) => typeof value === 'string' ? value : value.map((run) => run.strong ? `**${run.text}**` : run.text).join('');
function renderFixture(document, locale) {
  return `${document.content.map((node) => {
    if (node.kind === 'heading') return `${'#'.repeat(node.depth)} ${markdownLeaf(node.text[locale])}`;
    if (node.kind === 'list') return node.items.map((item) => `- ${markdownLeaf(item[locale])}`).join('\n');
    if (node.kind === 'table') return [node.columns, ...node.rows].map((row) => `| ${row.map((cell) => markdownLeaf(cell[locale])).join(' | ')} |`).join('\n');
    if (node.kind === 'rule') return '---';
    return markdownLeaf(node.text[locale]);
  }).join('\n\n')}\n`;
}
function fixture() {
  const files = [...profilePaths, relationPath].map((logical_path, index) => ({ source_id: index + 1, logical_path, document: { domain: 'characters', content: [], data: {} } }));
  files[0].document.content = [heading('인물 가람'), paragraph('짧은 소개', 'Short lead.'), heading('인물 나래'), paragraph('나래 소개', 'Narae lead.')];
  const bundle = { files };
  const identity = { people: structuredClone(people), aliases: [] };
  return { bundle, identity, renderLoreMarkdown: renderFixture };
}
const file = (input, path) => input.bundle.files.find((row) => row.logical_path === path);
const pointer = (value, path) => path.split('/').slice(1).reduce((node, key) => node[key.replaceAll('~1', '/').replaceAll('~0', '~')], value);

test('profiles preserve variants, shallow boundaries, both locales, duplicate fields and immutable inputs', () => {
  const input = fixture();
  file(input, statePaths[0]).document.content = [
    heading('인물 가람'), paragraph('서문', 'Lead'),
    { kind: 'list', items: [leaf('직함: 첫째', 'Title: First'), leaf('직함: 둘째', 'Title: Second')] },
    paragraph(rich('생애.', ' 처음\n', '관직.', ' 나중'), rich('Life.', ' Before\n', 'Office.', ' After')),
    heading('하위 소제목', 4), paragraph('하위 내용', 'Nested body'),
    heading('다음 장', 2), paragraph('가람 카드 밖', 'Outside the profile'),
    heading('인물 나래'), paragraph('나래 소개', 'Narae lead.'),
  ];
  const core = file(input, profilePaths[16]).document;
  core.content = [heading('목록 안내', 2), paragraph('인물 카드가 아님'), heading('가람', 2), paragraph('더 긴 대표 인물 소개 문장입니다', 'Longer body')];
  const before = JSON.stringify(input);
  const output = mapProfiles(input);
  assert.equal(output.profiles.length, 3);
  const first = output.profiles[0];
  assert.deepEqual([first.person_id, first.source_kind, first.node_start, first.node_end], ['K001', 'state', 0, 6]);
  assert.equal(first.heading_ko, '인물 가람');
  assert.equal(first.heading_en, 'English 인물 가람');
  assert.deepEqual(output.profileNodes.filter((row) => row.profile_id === first.profile_id).map((row) => row.json_pointer), Array.from({ length: 6 }, (_, i) => `/content/${i}`));
  const fields = output.profileFields.filter((row) => row.profile_id === first.profile_id);
  assert.deepEqual(fields.map(({ field_kind, key_ko, key_en, value_ko, value_en }) => ({ field_kind, key_ko, key_en, value_ko, value_en })), [
    { field_kind: 'lead', key_ko: null, key_en: null, value_ko: '서문', value_en: 'Lead' },
    { field_kind: 'bullet', key_ko: '직함', key_en: 'Title', value_ko: '첫째', value_en: 'First' },
    { field_kind: 'bullet', key_ko: '직함', key_en: 'Title', value_ko: '둘째', value_en: 'Second' },
    { field_kind: 'section', key_ko: '생애', key_en: 'Life', value_ko: '처음', value_en: 'Before' },
    { field_kind: 'section', key_ko: '관직', key_en: 'Office', value_ko: '나중', value_en: 'After' },
    { field_kind: 'lead', key_ko: null, key_en: null, value_ko: '하위 내용', value_en: 'Nested body' },
  ]);
  assert.ok(fields.every((row, index) => row.field_ordinal === index));
  assert.equal(JSON.stringify(input), before);
  assert.ok(Object.isFrozen(output) && Object.isFrozen(output.profiles) && output.profiles.every(Object.isFrozen));
  assert.ok(Object.isFrozen(output.profileNodes) && output.profileNodes.every(Object.isFrozen));
  assert.ok(Object.isFrozen(output.profileFields) && output.profileFields.every(Object.isFrozen));
});

test('primary follows explicit names then first state card even when core is longer', () => {
  const input = fixture();
  file(input, statePaths[0]).document.content = [heading('인물 가람'), paragraph('same'), heading('인물 나래'), paragraph('n')];
  file(input, statePaths[1]).document.content = [heading('인물 가람'), paragraph('same')];
  const core = file(input, profilePaths[16]).document;
  core.content = [heading('가람', 2), paragraph('same')];
  input.bundle.files.reverse();
  let output = mapProfiles(input);
  assert.equal(output.profiles.find((row) => row.person_id === 'K001' && row.is_primary).source_id, 1);
  core.content[1] = paragraph('longest body');
  output = mapProfiles(input);
  assert.equal(output.profiles.find((row) => row.person_id === 'K001' && row.is_primary).source_id, 1);
  core.data.primary_detail_names = ['가람'];
  output = mapProfiles(input);
  assert.equal(output.profiles.find((row) => row.person_id === 'K001' && row.is_primary).source_kind, 'core');
  file(input, statePaths[1]).document.data.primary_detail_names = ['가람'];
  output = mapProfiles(input);
  assert.equal(output.profiles.find((row) => row.person_id === 'K001' && row.is_primary).source_id, 2);
});

test('without explicit or state cards primary uses longest rendered body and stable source insertion ties', () => {
  const input = fixture();
  file(input, statePaths[0]).document.content = [heading('인물 나래'), paragraph('n')];
  const core = file(input, profilePaths[16]).document;
  const unaffiliated = file(input, profilePaths[17]).document;
  core.content = [heading('가람', 2), paragraph('same')];
  unaffiliated.content = [heading('인물 가람'), paragraph('same')];
  input.bundle.files.reverse();
  let output = mapProfiles(input);
  assert.equal(output.profiles.find((row) => row.person_id === 'K001' && row.is_primary).source_kind, 'core');
  unaffiliated.content[1] = paragraph('longest body');
  output = mapProfiles(input);
  assert.equal(output.profiles.find((row) => row.person_id === 'K001' && row.is_primary).source_kind, 'unaffiliated');
});

test('corridor ID cells and exact parenthesized name aliases join without fuzzy matching', () => {
  const input = fixture();
  const corridor = file(input, profilePaths[18]).document;
  corridor.content = [heading('인물 가람 (별칭)'), { kind: 'list', items: [leaf('캐릭터 ID: K001', 'Character ID: K001')] }, heading('인물 나래 (別名)'), paragraph('회랑 원문')];
  let output = mapProfiles(input);
  assert.deepEqual(output.profiles.filter((row) => row.source_kind === 'corridor').map((row) => row.person_id), ['K001', 'K002']);
  corridor.content[0].text.ko = '인물 별칭으로만 기록';
  assert.equal(mapProfiles(input).profiles.filter((row) => row.source_kind === 'corridor')[0].person_id, 'K001');
  corridor.content[2].text.ko = '인물 나래아 (가짜 접두사)';
  assert.throws(() => mapProfiles(input), { code: 'E_PROFILE_ORPHAN' });
  corridor.content[2].text.ko = '인물 나래 (別名)';
  corridor.content[1].items[0].ko = '캐릭터 ID: K999';
  assert.throws(() => mapProfiles(input), { code: 'E_PROFILE_ORPHAN' });
});

test('profile errors expose unknown named cards, missing coverage, conflicting ID, and malformed text', () => {
  const input = fixture();
  file(input, statePaths[0]).document.content[0].text.ko = '인물 가라';
  assert.throws(() => mapProfiles(input), { code: 'E_PROFILE_ORPHAN' });
  file(input, statePaths[0]).document.content = [heading('인물 가람'), paragraph('body')];
  assert.throws(() => mapProfiles(input), { code: 'E_PROFILE_COVERAGE' });
  file(input, statePaths[0]).document.content.push(heading('인물 나래'), paragraph('n'));
  const corridor = file(input, profilePaths[18]).document;
  corridor.content = [heading('인물 가람'), { kind: 'list', items: [leaf('캐릭터 ID: K002', 'Character ID: K002')] }];
  assert.throws(() => mapProfiles(input), { code: 'E_PROFILE_ID_CONFLICT' });
  corridor.content = [];
  file(input, statePaths[0]).document.content[1].text.en = 42;
  assert.throws(() => mapProfiles(input), { code: 'E_PROFILE_TEXT' });
});

function relationsFixture() {
  const input = fixture();
  file(input, relationPath).document.content = [heading('첫 관계', 1, 'first'), {
    kind: 'table', columns: [leaf('인물'), leaf('유형'), leaf('대상'), leaf('근거')],
    rows: [[leaf('가람', 'Garam'), leaf('지휘', 'command'), leaf('나래', 'Narae'), leaf('', '')], [leaf('가람', 'Garam'), leaf('지휘', 'command'), leaf('나래', 'Narae'), leaf('같은 방향의 별도 근거', 'Separate ground')]],
  }, heading('둘째 관계', 2, 'second'), {
    kind: 'table', columns: [leaf('인물'), leaf('유형'), leaf('대상'), leaf('근거')],
    rows: [[leaf('나래'), leaf('맹세', 'oath'), leaf('가람'), leaf('서약', 'A vow')]],
  }];
  file(input, relationPath).document.data.relations = [{ from: '가짜', to: '예시' }];
  return input;
}

test('relations preserve exact row direction, duplicates, order, blank grounds and bilingual provenance', () => {
  const input = relationsFixture();
  const before = JSON.stringify(input);
  const output = mapRelations(input);
  assert.equal(output.relations.length, 3);
  assert.deepEqual(output.relations.map((row) => [row.relation_id, row.row_ordinal, row.from_person_id, row.to_person_id, row.section_anchor, row.grounds_ko, row.grounds_en, row.json_pointer]), [
    ['relation-0001', 0, 'K001', 'K002', 'first', '', '', '/content/1/rows/0'],
    ['relation-0002', 1, 'K001', 'K002', 'first', '같은 방향의 별도 근거', 'Separate ground', '/content/1/rows/1'],
    ['relation-0003', 2, 'K002', 'K001', 'second', '서약', 'A vow', '/content/3/rows/0'],
  ]);
  assert.equal(output.relationTypes.length, 11);
  assert.deepEqual(output.relationTypes.find((row) => row.type_ko === '지휘'), { type_ko: '지휘', type_en: 'command', type_ordinal: 3 });
  assert.deepEqual(output.relationTypes.find((row) => row.type_ko === '양자'), { type_ko: '양자', type_en: null, type_ordinal: 1 });
  assert.equal(JSON.stringify(input), before);
  assert.ok(Object.isFrozen(output) && Object.isFrozen(output.relations) && output.relations.every(Object.isFrozen));
});

test('relation English variants stay on each row and unused type translations remain unknown', () => {
  const input = relationsFixture();
  const source = file(input, relationPath);
  source.document.content[1].rows[0][1] = leaf('친족', 'kin');
  source.document.content[1].rows[1][1] = leaf('친족', 'kinship');
  const output = mapRelations(input);
  assert.deepEqual(output.relations.slice(0, 2).map((row) => row.type_en), ['kin', 'kinship']);
  assert.equal(output.relationTypes.find((row) => row.type_ko === '친족').type_en, null);
  assert.equal(output.relationTypes.find((row) => row.type_ko === '양자').type_en, null);
});

test('relation unknown endpoints, duplicate source ordinals and unsupported types fail closed', () => {
  const input = relationsFixture();
  const source = file(input, relationPath);
  source.document.content[1].rows[0][0].ko = '가람 ';
  assert.throws(() => mapRelations(input), { code: 'E_RELATION_ENDPOINT_ORPHAN' });
  source.document.content[1].rows[0][0].ko = '가람';
  input.bundle.files.push(structuredClone(source));
  assert.throws(() => mapRelations(input), { code: 'E_RELATION_ORDINAL_DUPLICATE' });
  input.bundle.files.pop();
  source.document.content[1].rows[0][1].ko = '친구';
  assert.throws(() => mapRelations(input), { code: 'E_RELATION_TYPE' });
});

if (process.env.CAST_SQLITE_SOURCE_ROOT) {
  test('actual corpus: all profiles, source routes, bilingual field values and all directed relations match source', async (t) => {
    const sourceRoot = resolve(process.env.CAST_SQLITE_SOURCE_ROOT);
    const paths = [...profilePaths, relationPath];
    const files = await Promise.all(paths.map(async (logical_path, index) => ({ source_id: index + 1, logical_path, document: JSON.parse(readSourceArchive(logical_path).toString('utf8')) })));
    const registry = JSON.parse(readSourceArchive('lore/name-pools/person-id-registry.json').toString('utf8'));
    const values = JSON.parse(readSourceArchive('lore/name-pools/values-cast.json').toString('utf8'));
    const names = new Map(registry.persons.map((person) => [person.name, person.id]));
    const identity = { people: values.people.map((person, index) => ({ person_id: names.get(person.name), name: person.name, public_key: `person-${String(index + 1).padStart(4, '0')}` })) };
    const { renderLoreMarkdown } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/lore-json-render.mjs')).href);
    const bundle = { files };
    const before = JSON.stringify(bundle);
    const output = mapProfiles({ bundle, identity, renderLoreMarkdown });
    assert.equal(output.profiles.length, 1038);
    assert.equal(new Set(output.profiles.map((row) => row.person_id)).size, 1022);
    assert.equal(output.profiles.filter((row) => row.is_primary).length, 1022);
    assert.deepEqual(['state', 'core', 'unaffiliated', 'corridor'].map((kind) => output.profiles.filter((row) => row.source_kind === kind).length), [1000, 23, 9, 6]);
    assert.deepEqual(output.profiles.filter((row) => row.source_kind === 'corridor').map((row) => row.person_id), ['K1011', 'K1012', 'K1013', 'K1014', 'K1015', 'K1016']);
    const fileById = new Map(files.map((row) => [row.source_id, row]));
    for (const profile of output.profiles) {
      const document = fileById.get(profile.source_id).document;
      const start = pointer(document, profile.heading_pointer);
      assert.equal(profile.heading_ko, plain(start.text.ko));
      assert.equal(profile.heading_en, plain(start.text.en));
      const next = document.content.findIndex((node, index) => index > profile.node_start && node.kind === 'heading' && node.depth <= start.depth);
      assert.equal(profile.node_end, next < 0 ? document.content.length : next);
      const nodes = output.profileNodes.filter((node) => node.profile_id === profile.profile_id);
      assert.equal(nodes.length, profile.node_end - profile.node_start);
      nodes.forEach((node, index) => { assert.equal(node.node_ordinal, index); assert.equal(pointer(document, node.json_pointer), document.content[profile.node_start + index]); });
    }
    for (const field of output.profileFields) {
      const document = fileById.get(field.source_id).document;
      const source = pointer(document, field.json_pointer);
      const text = source.text ?? source;
      for (const locale of ['ko', 'en']) {
        const value = field[`value_${locale}`];
        if (value === null) continue;
        const rendered = renderLoreMarkdown({ ...document, content: [{ kind: 'paragraph', text }] }, locale).trim();
        assert.ok(rendered.includes(value), `${field.profile_id}:${field.field_ordinal}:${locale}: value not in source`);
        if (field[`key_${locale}`] !== null) assert.ok(rendered.includes(field[`key_${locale}`]));
      }
    }
    let reconstructedLeaves = 0;
    for (const profile of output.profiles) {
      const document = fileById.get(profile.source_id).document;
      const fields = output.profileFields.filter((field) => field.profile_id === profile.profile_id);
      for (let index = profile.node_start + 1; index < profile.node_end; index += 1) {
        const node = document.content[index];
        const leaves = node.kind === 'paragraph' || node.kind === 'quote'
          ? [[`/content/${index}/text`, node.text]]
          : node.kind === 'list' ? node.items.map((item, ordinal) => [`/content/${index}/items/${ordinal}`, item]) : [];
        for (const [jsonPointer, text] of leaves) {
          const mapped = fields.filter((field) => field.json_pointer === jsonPointer);
          for (const locale of ['ko', 'en']) {
            const source = renderLoreMarkdown({ ...document, content: [{ kind: 'paragraph', text }] }, locale);
            const recovered = mapped.filter((field) => field[`value_${locale}`] !== null).map((field) => {
              const key = field[`key_${locale}`];
              const value = field[`value_${locale}`];
              return field.field_kind === 'lead' ? value : field.field_kind === 'bullet' ? `${key}: ${value}` : `**${key}.** ${value}`;
            }).join('\n');
            assert.equal(recovered.replace(/\s/gu, ''), source.replace(/\s/gu, ''), `${profile.profile_id}:${jsonPointer}:${locale}: complete leaf recovery`);
          }
          reconstructedLeaves += 1;
        }
      }
    }
    const cards = new Map();
    const add = (text, source, pattern, primaryNames = []) => {
      const headings = [...text.matchAll(pattern)];
      for (let i = 0; i < headings.length; i += 1) {
        const name = headings[i][1].trim();
        if (!names.has(name)) continue;
        const end = headings[i + 1]?.index ?? (source === 'Cast-Unaffiliated' ? text.indexOf('\n## ', headings[i].index + headings[i][0].length) : -1);
        const body = text.slice(headings[i].index + headings[i][0].length, end >= 0 ? end : text.length).trim();
        const list = cards.get(name) ?? [];
        list.push({ source, body, primary: primaryNames.includes(name), heading: name });
        cards.set(name, list);
      }
    };
    for (const source of files.slice(0, 18)) {
      const slug = basename(source.logical_path, '.json');
      add(renderLoreMarkdown(source.document, 'ko'), slug, slug === 'Core-Characters' ? /^## (?!인물 목록$)(.+)$/gm : /^### 인물 (.+)$/gm, source.document.data.primary_detail_names ?? []);
    }
    const corridor = files[18];
    const corridorText = renderLoreMarkdown(corridor.document, 'ko');
    const corridorHeadings = [...corridorText.matchAll(/^### 인물 (.+)$/gm)];
    for (let i = 0; i < corridorHeadings.length; i += 1) {
      const match = corridorHeadings[i];
      const person = identity.people.find((person) => match[1] === person.name || match[1].startsWith(`${person.name} (`));
      if (!person) continue;
      const list = cards.get(person.name) ?? [];
      list.push({ source: 'Diaspora-Corridors', heading: match[1], body: corridorText.slice(match.index + match[0].length, corridorHeadings[i + 1]?.index ?? corridorText.length).trim() });
      cards.set(person.name, list);
    }
    const generatedDirectory = resolve(sourceRoot, 'public/person-details');
    const generatedNames = await readdir(generatedDirectory).catch((error) => error.code === 'ENOENT' ? [] : Promise.reject(error));
    let generatedCompared = 0;
    for (const person of identity.people) {
      const candidates = cards.get(person.name);
      const selected = candidates.find((card) => card.primary)
        ?? candidates.find((card) => /^Cast-State-\d{2}$/u.test(card.source))
        ?? [...candidates].sort((a, b) => b.body.length - a.body.length)[0];
      const headingText = selected.source === 'Core-Characters' ? person.name : `인물-${selected.heading}`;
      const anchor = selected.source === 'Diaspora-Corridors' ? headingText.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-') : headingText;
      const expected = `/world/${selected.source}#${anchor}`;
      const primary = output.profiles.find((row) => row.person_id === person.person_id && row.is_primary);
      assert.equal(`/world/${basename(fileById.get(primary.source_id).logical_path, '.json')}#${primary.anchor}`, expected, person.name);
      if (generatedNames.length) {
        const detail = JSON.parse(await readFile(resolve(generatedDirectory, `${person.public_key}.json`), 'utf8'));
        assert.equal(detail.name, person.name);
        assert.equal(detail.sourceRoute, expected, person.name);
        generatedCompared += 1;
      }
    }
    assert.equal(cards.size, 1022);
    if (generatedNames.length) assert.equal(generatedCompared, 1022);
    const relationOutput = mapRelations({ bundle, identity });
    assert.equal(relationOutput.relations.length, 1388);
    assert.equal(relationOutput.relationTypes.length, 11);
    assert.equal(relationOutput.relations.filter((row) => row.grounds_ko === '').length, 40);
    assert.equal(new Set(relationOutput.relations.map((row) => row.row_ordinal)).size, 1388);
    const expectedRows = files.at(-1).document.content.flatMap((node) => node.kind === 'table' ? node.rows : []);
    relationOutput.relations.forEach((row, index) => {
      const source = expectedRows[index];
      assert.deepEqual([row.from_person_id, row.type_ko, row.to_person_id, row.grounds_ko, row.type_en, row.grounds_en], [names.get(plain(source[0].ko)), plain(source[1].ko), names.get(plain(source[2].ko)), plain(source[3].ko), plain(source[1].en), plain(source[3].en)]);
      assert.equal(pointer(files.at(-1).document, row.json_pointer), source);
    });
    assert.equal(JSON.stringify(bundle), before);
    t.diagnostic(JSON.stringify({ profiles: 1038, coverage: 1022, primary: 1022, oracleSourceRoutes: 1022, generatedCompared, profileNodes: output.profileNodes.length, profileFields: output.profileFields.length, reconstructedLeaves, relations: 1388, blankGrounds: 40, relationTypes: 11 }));
  });
}
