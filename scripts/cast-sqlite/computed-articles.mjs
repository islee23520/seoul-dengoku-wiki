import { createHash } from 'node:crypto';
import { listDocuments, readDocument, listDocumentsAsync, readDocumentAsync } from './document-read.mjs';
import { listGlossaryEntries, readGlossaryHead, listGlossaryEntriesAsync, readGlossaryHeadAsync } from './glossary-store.mjs';
import { glossaryDocument } from '../glossary-document.mjs';
import { renderLoreMarkdown } from '../lore-json-render.mjs';

const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
const text = (leaf, locale) => typeof leaf?.[locale] === 'string' ? leaf[locale] : (leaf?.[locale] ?? []).map(run => run.text).join('');
const dependencies = ['lore/characters/Core-Characters.json', 'lore/factions/Sixteen-States.json', 'lore/chronology/Scenario-Timeline.json'];

// Called inside the request's read transaction. Paths are opaque stored identities,
// never filesystem locations. No body or admission result survives a request.
export function readComputedArticle(db, mapping, mappings, locale) {
  try {
    const metadata = JSON.parse(mapping.derivation_json);
    if (metadata.version !== 1 || metadata.review !== 'authenticated-current-reviewed' || metadata.materialized !== false
      || mapping.source_id !== null || !Array.isArray(metadata.sourceBindings)) return null;
    const bindings = metadata.sourceBindings;
    const link = (_domain, slug) => {
      const targets = mappings.filter(entry => entry.slug === slug || entry.route.split('/').at(-1) === slug);
      if (targets.length !== 1) throw new Error('E_COMPUTED_LINK');
      return `${locale === 'ko' ? '' : '/en'}${targets[0].route}`;
    };
    if (mapping.derivation === 'computed-glossary') {
      if (bindings.length !== 1 || bindings[0].sourcePath !== 'lore/glossary.json') return null;
      if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE name='glossary_head'").get()) return null;
      const archive = db.prepare('SELECT sha256 FROM glossary_archive WHERE singleton=1').get();
      const head = readGlossaryHead(db);
      if (archive?.sha256 !== bindings[0].sha256 || head.parentRevision !== null || head.sequence !== 0) return null;
      const entries = listGlossaryEntries(db, { visibility: 'internal' });
      if (digest(entries) !== head.contentSha256) return null;
      const document = glossaryDocument(entries.filter(entry => entry.status === 'fact-public'));
      return { title: document.locales[locale].title, markdown: renderLoreMarkdown(document, locale, link) };
    }
    if (mapping.derivation !== 'computed-index' || bindings.length !== dependencies.length
      || dependencies.some(path => bindings.filter(binding => binding.sourcePath === path).length !== 1)) return null;
    const identities = listDocuments(db, { corpusKind: 'current', visibility: 'internal' });
    const documents = dependencies.map(path => {
      const binding = bindings.find(entry => entry.sourcePath === path);
      const candidates = identities.filter(entry => entry.logical_path === path && entry.sha256 === binding.sha256);
      if (candidates.length !== 1) throw new Error('E_COMPUTED_DEPENDENCY');
      const identity = candidates[0];
      const document = readDocument(db, { corpusKind: 'current', domain: identity.domain, documentId: identity.document_id });
      if (!document) throw new Error('E_COMPUTED_DEPENDENCY');
      return document;
    });
    return worldIndex(documents, mappings, locale, link);
  } catch (error) {
    if (/^E_(COMPUTED|GLOSSARY|DOCUMENT)/u.test(error.code ?? error.message)
      || error instanceof SyntaxError || /no such (table|column)/u.test(error.message)) return null;
    throw error;
  }
}

// PostgreSQL counterpart; admission and derivation checks match the synchronous reader.
export async function readComputedArticleAsync(db, mapping, mappings, locale) {
  try {
    const metadata = JSON.parse(mapping.derivation_json);
    if (metadata.version !== 1 || metadata.review !== 'authenticated-current-reviewed' || metadata.materialized !== false
      || mapping.source_id !== null || !Array.isArray(metadata.sourceBindings)) return null;
    const bindings = metadata.sourceBindings;
    const link = (_domain, slug) => {
      const targets = mappings.filter(entry => entry.slug === slug || entry.route.split('/').at(-1) === slug);
      if (targets.length !== 1) throw new Error('E_COMPUTED_LINK');
      return `${locale === 'ko' ? '' : '/en'}${targets[0].route}`;
    };
    if (mapping.derivation === 'computed-glossary') {
      if (bindings.length !== 1 || bindings[0].sourcePath !== 'lore/glossary.json') return null;
      if (!(await db.query("SELECT 1 FROM information_schema.tables WHERE table_schema='wiki' AND table_name='glossary_head'")).rows.length) return null;
      const archive = (await db.query('SELECT sha256 FROM wiki.glossary_archive WHERE singleton=1')).rows[0];
      const head = await readGlossaryHeadAsync(db);
      if (archive?.sha256 !== bindings[0].sha256 || head.parentRevision !== null || head.sequence !== 0) return null;
      const entries = await listGlossaryEntriesAsync(db, { visibility: 'internal' });
      if (digest(entries) !== head.contentSha256) return null;
      const document = glossaryDocument(entries.filter(entry => entry.status === 'fact-public'));
      return { title: document.locales[locale].title, markdown: renderLoreMarkdown(document, locale, link) };
    }
    if (mapping.derivation !== 'computed-index' || bindings.length !== dependencies.length
      || dependencies.some(path => bindings.filter(binding => binding.sourcePath === path).length !== 1)) return null;
    const identities = await listDocumentsAsync(db, { corpusKind: 'current', visibility: 'internal' });
    const documents = await Promise.all(dependencies.map(async path => {
      const binding = bindings.find(entry => entry.sourcePath === path);
      const candidates = identities.filter(entry => entry.logical_path === path && entry.sha256 === binding.sha256);
      if (candidates.length !== 1) throw new Error('E_COMPUTED_DEPENDENCY');
      const identity = candidates[0];
      const document = await readDocumentAsync(db, { corpusKind: 'current', domain: identity.domain, documentId: identity.document_id });
      if (!document) throw new Error('E_COMPUTED_DEPENDENCY');
      return document;
    }));
    return worldIndex(documents, mappings, locale, link);
  } catch (error) {
    // A swallowed database error would leave the PostgreSQL transaction
    // aborted (25P02) while the caller believes the read simply declined:
    // rethrow DB/schema failures so the caller's savepoint can restore the
    // transaction. Only pure derivation rejections stay null here.
    if (/^E_COMPUTED/u.test(error.code ?? error.message) || error instanceof SyntaxError) return null;
    throw error;
  }
}

function worldIndex([core, sixteen, timeline], mappings, locale, link) {
  const table = sixteen.content.find(node => node.kind === 'table');
  if (!table) throw new Error('E_COMPUTED_TABLE');
  const columns = table.columns.map(leaf => text(leaf, 'ko'));
  const column = prefix => columns.findIndex(value => value.startsWith(prefix));
  const sections = [];
  for (const node of core.content) {
    if (node.kind === 'heading' && node.depth === 2) sections.push({ node, body: [] });
    else if (sections.length) sections.at(-1).body.push(node);
  }
  const states = table.rows.map(row => {
    const name = text(row[column('국명')], 'ko').replace(/\([^)]*\)/gu, '').trim();
    const ranked = sections.map(section => {
      const person = text(section.node.text, 'ko');
      const prose = section.body.filter(node => node.text).map(node => text(node.text, 'ko'));
      // A person's exact name in the admitted state row grounds renamed
      // organizations too, without importing an external alias ledger.
      const explicit = row.some(leaf => text(leaf, 'ko').includes(person));
      const intro = prose[0] ?? '';
      return { section, score: intro.startsWith(name) || intro.includes(`${name} `) ? 2 : prose.some(value => value.includes(name)) ? 1 : explicit ? 0.5 : 0 };
    }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score);
    if (!ranked.length) throw new Error('E_COMPUTED_LEADERS');
    const station = text(row[column('수도역') >= 0 ? column('수도역') : column('중심역')], locale).replace(/역$/u, '').trim();
    const government = text(row[column('정부') >= 0 ? column('정부') : column('형태')], locale).split(',')[0].trim();
    return `| [${text(row[column('국명')], locale)}](${link(sixteen.domain, sixteen.slug)}) | ${station || '-'} | ${government || '-'} | ${text(ranked[0].section.node.text, locale)} |`;
  });
  if (states.length !== 16) throw new Error('E_COMPUTED_STATES');
  let inFence = false;
  const events = [];
  const timelineMarkdown = renderLoreMarkdown(timeline, locale, (domain, slug) => `lore/${domain === 'root' ? '' : `${domain}/`}${slug}.md`)
    .replace(/\]\((?!\/|#|[a-z][a-z0-9+.-]*:)([^)#]+)\.md(#[^)]*)?\)/giu,
      (_match, path, anchor = '') => `](${link(null, path.split('/').at(-1))}${anchor})`);
  for (const line of timelineMarkdown.split('\n')) {
    if (line.trim().startsWith('```')) { inFence = !inFence; continue; }
    if (!inFence && (/^\s*[-|*]\s|^\|/u.test(line) || /^\d{3,4}년|^\*\*/u.test(line.trim()))) {
      const value = line.replace(/^\s*[-|*]\s*/u, '').replace(/^\|/u, '').trim();
      if (value.length > 8 && !/required_|immediate_|follow_up|player_entry/u.test(value)) events.push(value);
    }
  }
  if (!events.length) throw new Error('E_COMPUTED_EVENTS');
  const labels = locale === 'ko' ? ['세계관 색인', '16국', '최신 사건', '문서 판', '국명 | 중심역 | 형태 | 수장']
    : ['World index', 'Sixteen states', 'Latest events', 'Documents', 'State | Central station | Government | Leader'];
  const slugs = ['world-unbinding', 'people-and-machines', 'scenario-timeline', 'world-and-subway-layers', 'sixteen-states', 'offices-and-ranks', 'era-arms-and-tech-level', 'structures', 'lost-technology-lineage', 'ailments', 'faith-culture-schism', 'core-characters'];
  const pages = slugs.flatMap(slug => {
    const targets = mappings.filter(entry => entry.slug === slug);
    if (targets.length !== 1) return [];
    const target = targets[0];
    // The title and body are both public-admitted by the caller's mappings.
    return [`- [${target.titles?.[locale] ?? target.route.split('/').at(-1)}](${locale === 'ko' ? '' : '/en'}${target.route})`];
  });
  return { title: labels[0], markdown: `# ${labels[0]}\n\n## ${labels[1]}\n\n| ${labels[4]} |\n|---|---|---|---|\n${states.join('\n')}\n\n## ${labels[2]}\n\n${events.slice(-8).reverse().map(event => `- ${event}`).join('\n')}\n\n## ${labels[3]}\n\n${pages.join('\n')}\n` };
}
