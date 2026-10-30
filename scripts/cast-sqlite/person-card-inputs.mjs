import { resolve } from 'node:path';
import { readCatalogPages, readCatalogPagesAsync } from './catalog-pages.mjs';
import { renderLoreMarkdown } from '../lore-json-render.mjs';

/** Internal production inputs reconstructed only from authenticated typed pages.
 * repoRoot supplies path metadata, never a filesystem source or fallback.
 */
export function readPersonCardInputs(db, { repoRoot } = {}) {
 const root = resolve(repoRoot);
 return personCardInputs(readCatalogPages(db), root);
}

/** PostgreSQL twin; page authentication and key order use the async catalog reader. */
export async function readPersonCardInputsAsync(tx, { repoRoot } = {}) {
 const root = resolve(repoRoot);
 return personCardInputs(await readCatalogPagesAsync(tx), root);
}

function personCardInputs(pages, root) {
 const pagesBySlug = new Map();
 const renderedBySlug = new Map();
 // Match the legacy directory walk rather than the catalog's domain ordering.
 pages.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
 for (const { path, value, slug } of pages) {
  if (!value || typeof value.domain !== 'string' || !Array.isArray(value.content)) continue;
  pagesBySlug.set(slug, { path: resolve(root, path), value, slug });
  renderedBySlug.set(slug, renderLoreMarkdown(value, 'ko', (_domain, target) => `${target}.md`));
 }
 const personCards = new Map();
 const addPersonCards = (text, file, pattern) => {
  const headings = [...text.matchAll(pattern)].map(heading => ({
   heading,
   start: text.slice(0, heading.index).match(/(?:\n<a id="[\p{L}\p{N}_-]+"><\/a>\n*)+$/u)?.index ?? heading.index,
  }));
  for (let index = 0; index < headings.length; index += 1) {
   const { heading } = headings[index];
   const name = heading[1].trim();
   if (name === '부록 — 가치관 숫자' || name === '인물 카드') continue;
   const nextPerson = headings[index + 1]?.start ?? -1;
   const nextSection = file === 'Cast-Unaffiliated.md' ? text.indexOf('\n## ', heading.index + heading[0].length) : -1;
   const boundaries = [nextPerson, nextSection].filter(position => position >= 0);
   const nextHeading = boundaries.length ? Math.min(...boundaries) : -1;
   const body = text.slice(heading.index + heading[0].length, nextHeading >= 0 ? nextHeading : text.length).trim();
   const cards = personCards.get(name) ?? [];
   const slug = file.replace('.md', '');
   cards.push({ file: slug, body, primary: pagesBySlug.get(slug)?.value.data?.primary_detail_names?.includes(name) ?? false });
   personCards.set(name, cards);
  }
 };
 for (let index = 1; index <= 16; index += 1) {
  const slug = `Cast-State-${String(index).padStart(2, '0')}`;
  const text = renderedBySlug.get(slug);
  if (!text) throw new Error(`E_CAST_PAGE_MISSING:${slug}.md`);
  addPersonCards(text, `${slug}.md`, /^### 인물 (.+)$/gm);
 }
 for (const [file, pattern] of [['Core-Characters.md', /^## (?!인물 목록$)(.+)$/gm], ['Cast-Unaffiliated.md', /^### 인물 (.+)$/gm]]) {
  const text = renderedBySlug.get(file.replace('.md', ''));
  if (!text) throw new Error(`E_CAST_PAGE_MISSING:${file}`);
  addPersonCards(text, file, pattern);
 }
 const corridorText = renderedBySlug.get('Diaspora-Corridors');
 if (!corridorText) throw new Error('E_CORRIDOR_PAGE_MISSING');
 const corridorNames = ['린샤오메이', '팜반득', '아미라 카심', '조엘 박', '나르기즈 유수포바', '최일석'];
 const corridorHeadings = [...corridorText.matchAll(/^### 인물 (.+)$/gm)];
 for (const [index, heading] of corridorHeadings.entries()) {
  const name = corridorNames.find(candidate => heading[1] === candidate || heading[1].startsWith(`${candidate} (`));
  if (!name) continue;
  const end = corridorHeadings[index + 1]?.index ?? corridorText.length;
  const body = corridorText.slice(heading.index + heading[0].length, end).trim();
  const cards = personCards.get(name) ?? [];
  cards.push({ file: 'Diaspora-Corridors', body, heading: heading[1] });
  personCards.set(name, cards);
 }
 const relationText = renderedBySlug.get('Cast-Relations');
 if (!relationText) throw new Error('E_CAST_RELATIONS_MISSING');
 const relations = [...relationText.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .map(match => ({ from: match[1].trim(), type: match[2].trim(), to: match[3].trim(), basis: match[4].trim() }))
  .filter(relation => relation.from !== '인물' && !relation.from.startsWith('---'));
 return { personCards, pagesBySlug, renderedBySlug, relations };
}
