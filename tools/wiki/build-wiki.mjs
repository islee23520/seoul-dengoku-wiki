import { copyFile, lstat, mkdir, readFile, readdir, realpath, rmdir, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodeHTML } from 'entities';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { parseFragment } from 'parse5';

const bannedPublicTerms = ['Kenshi', 'Underrail', 'Gunner', 'clone', '복제'];

// Written into every output root this generator owns. Cleanup refuses to delete
// anything from a root that does not carry it, so pointing the build at a human
// directory can never destroy work.
const GENERATED_SENTINEL = '.janseon-wiki-generated';
const SENTINEL_BODY = [
  '# janseon wiki generated output',
  '# Everything in this directory except .git is rebuilt by tools/wiki/build-wiki.mjs.',
  '# Deleting this file makes the next build refuse to clean the directory.',
  '',
].join('\n');
const VCS_DIRECTORY = '.git';
const PUBLISHED_ASSET_DIRECTORY = 'assets';
const REPOSITORY_ASSET_SEGMENTS = ['docs', 'assets', 'wiki'];

// Blocks are joined with a newline so a banned term can never be assembled
// across two separately rendered regions; everything inline is concatenated with
// no separator so comment- and zero-width-splitting is caught.
const BLOCK_CONTAINERS = new Set([
  'root',
  'blockquote',
  'list',
  'listItem',
  'table',
  'tableRow',
  'footnoteDefinition',
]);
const VISIBLE_HTML_ATTRIBUTES = new Set(['alt', 'title', 'aria-label', 'aria-description', 'label', 'placeholder']);
// An input renders its `value` as readable text (field contents, or the button
// label for submit/reset/button). Only these types never render it, so an
// unknown or absent type is treated as visible and fails closed.
const UNRENDERED_INPUT_VALUE_TYPES = new Set([
  'hidden',
  'password',
  'checkbox',
  'radio',
  'file',
  'image',
  'color',
  'range',
]);
// Format, surrogate and private-use code points plus variation selectors. These
// render as nothing, so an attacker can use them to split a banned term.
const INVISIBLE_CODE_POINTS = /[\p{Cf}\p{Cs}\p{Co}\u00AD\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu;

const normalizedBannedTerms = bannedPublicTerms.map((term) => ({
  term,
  needle: normalizeVisibleText(term),
}));

export async function buildWiki({ sourceDir, assetDir, outputDir, commitSha }) {
  if (!commitSha) throw new Error('commitSha is required');

  // Everything is validated and rendered in memory first, so an unsafe input can
  // never cause a destructive cleanup of the output root.
  const canonicalSource = await openRealDirectory(sourceDir, 'wiki source directory');
  const canonicalAssets = await openRealDirectory(assetDir, 'wiki asset directory');
  const resolvedOutput = assertSafeOutputRoot(outputDir);
  const outputStats = await lstatOrNull(resolvedOutput);
  if (outputStats && !outputStats.isSymbolicLink() && outputStats.isDirectory()) {
    const canonicalOutput = await realpath(resolvedOutput);
    if (canonicalOutput === canonicalSource || canonicalOutput === canonicalAssets) {
      throw new Error('refusing to use a source or asset directory as the wiki output root');
    }
  }
  const assetFiles = await collectAssetFiles(canonicalAssets);
  const assetNames = new Set([...assetFiles.keys()]);

  const pages = await readSourcePages(canonicalSource);
  const rendered = pages.map(({ page, markdown }) => {
    assertPublicTerms(markdown, page);
    const transformed = normalizeMarkdown(rewriteDestinations(markdown, { page, assetNames }));
    return {
      page,
      body: page === '_Sidebar.md'
        ? transformed
        : `${generationBanner(page, commitSha)}\n\n${transformed}`,
    };
  });

  const canonicalRoot = await claimOutputRoot(outputDir);
  const publishedAssetRoot = join(canonicalRoot, PUBLISHED_ASSET_DIRECTORY);
  await mkdir(publishedAssetRoot, { recursive: true });

  for (const [name, sourcePath] of assetFiles) {
    const destination = join(publishedAssetRoot, ...name.split('/'));
    assertContained(canonicalRoot, destination, `published asset ${name}`);
    await mkdir(join(destination, '..'), { recursive: true });
    await copyFile(sourcePath, destination);
  }

  for (const { page, body } of rendered) {
    const destination = join(canonicalRoot, page);
    assertContained(canonicalRoot, destination, `published page ${page}`);
    await writeFile(destination, body);
  }
}

// ---------------------------------------------------------------------------
// Filesystem boundary
// ---------------------------------------------------------------------------

/**
 * Path-shape guard for the output root. Pure and synchronous so it can be
 * exercised against dangerous paths without touching the filesystem.
 */
export function assertSafeOutputRoot(outputDir) {
  if (typeof outputDir !== 'string' || outputDir.trim() === '') {
    throw new Error('refusing an empty wiki output root');
  }
  const resolved = resolve(outputDir);
  const segments = resolved.split(sep).filter(Boolean);
  if (segments.length < 2) {
    throw new Error(`refusing ${resolved} as the wiki output root: dangerously close to the filesystem root`);
  }

  const home = resolve(homedir());
  if (resolved === home) {
    throw new Error(`refusing ${resolved} as the wiki output root: it is the home directory`);
  }
  if (!relative(resolved, home).startsWith('..') && relative(resolved, home) !== '') {
    throw new Error(`refusing ${resolved} as the wiki output root: it contains the home directory`);
  }

  const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
  if (resolved === repositoryRoot) {
    throw new Error(`refusing ${resolved} as the wiki output root: it is the repository root`);
  }
  return resolved;
}

function assertContained(root, candidate, what) {
  const rel = relative(root, candidate);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`refusing to touch ${what} outside ${root}: ${candidate}`);
  }
}

async function lstatOrNull(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

/**
 * Resolves a directory that must exist and must not itself be a symlink, and
 * returns its canonical path for later containment checks.
 */
async function openRealDirectory(dir, role) {
  if (typeof dir !== 'string' || dir.trim() === '') throw new Error(`${role} is required`);
  const resolved = resolve(dir);
  const stats = await lstatOrNull(resolved);
  if (!stats) throw new Error(`${role} does not exist: ${resolved}`);
  if (stats.isSymbolicLink()) {
    throw new Error(`refusing to follow a symlink as the ${role}: ${resolved}`);
  }
  if (!stats.isDirectory()) throw new Error(`${role} is not a directory: ${resolved}`);
  return realpath(resolved);
}

async function inspectSentinel(sentinelPath) {
  const stats = await lstatOrNull(sentinelPath);
  if (!stats) return false;
  if (stats.isSymbolicLink()) {
    throw new Error(`refusing to trust a symlinked ${GENERATED_SENTINEL} sentinel: ${sentinelPath}`);
  }
  if (!stats.isFile()) {
    throw new Error(`refusing to trust a ${GENERATED_SENTINEL} sentinel that is not a regular file: ${sentinelPath}`);
  }
  return true;
}

/**
 * Proves the output root is a directory this generator owns, claims it with the
 * sentinel, and removes stale artifacts without ever traversing a symlink.
 */
async function claimOutputRoot(outputDir) {
  const resolved = assertSafeOutputRoot(outputDir);

  const existing = await lstatOrNull(resolved);
  const created = !existing;
  if (existing) {
    if (existing.isSymbolicLink()) {
      throw new Error(`refusing to build the wiki into a symlinked output root: ${resolved}`);
    }
    if (!existing.isDirectory()) {
      throw new Error(`refusing to build the wiki into a non-directory output root: ${resolved}`);
    }
  } else {
    await mkdir(resolved, { recursive: true });
  }

  const canonicalRoot = await realpath(resolved);
  const sentinelPath = join(canonicalRoot, GENERATED_SENTINEL);
  const entries = await readdir(canonicalRoot);
  const stale = entries.filter((entry) => entry !== VCS_DIRECTORY && entry !== GENERATED_SENTINEL);
  const hasSentinel = await inspectSentinel(sentinelPath);
  const isFreshClone = entries.length === 1 && entries[0] === VCS_DIRECTORY;

  if (!hasSentinel && !created && !isFreshClone) {
    throw new Error(
      `refusing to clean ${canonicalRoot}: the ${GENERATED_SENTINEL} sentinel is missing, `
      + 'so this directory was not produced by build-wiki',
    );
  }

  await writeFile(sentinelPath, SENTINEL_BODY);

  for (const entry of stale) {
    // Revalidate immediately before every deletion: the authorisation must still
    // hold at the moment we destroy something.
    if (!(await inspectSentinel(sentinelPath))) {
      throw new Error(`aborting cleanup of ${canonicalRoot}: the ${GENERATED_SENTINEL} sentinel vanished`);
    }
    const target = join(canonicalRoot, entry);
    assertContained(canonicalRoot, target, `stale output entry ${entry}`);
    await removeTree(target);
  }

  return canonicalRoot;
}

/** Recursive removal that unlinks symlinks instead of descending through them. */
async function removeTree(path) {
  const stats = await lstatOrNull(path);
  if (!stats) return;
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    await unlink(path);
    return;
  }
  for (const entry of await readdir(path)) {
    await removeTree(join(path, entry));
  }
  await rmdir(path);
}

async function readSourcePages(canonicalSource) {
  const names = (await readdir(canonicalSource)).filter((name) => name.endsWith('.md')).sort();
  const pages = [];
  for (const page of names) {
    const path = join(canonicalSource, page);
    const stats = await lstat(path);
    if (stats.isSymbolicLink()) {
      throw new Error(`refusing to publish the symlinked source page ${page}: ${path}`);
    }
    if (!stats.isFile()) {
      throw new Error(`refusing to publish the non-file source page ${page}: ${path}`);
    }
    assertContained(canonicalSource, await realpath(path), `source page ${page}`);
    pages.push({ page, markdown: await readFile(path, 'utf8') });
  }
  return pages;
}

/** Enumerates publishable assets, refusing symlinks rather than copying them. */
async function collectAssetFiles(canonicalAssets, prefix = '') {
  const files = new Map();
  for (const entry of (await readdir(join(canonicalAssets, prefix))).sort()) {
    const name = prefix ? `${prefix}/${entry}` : entry;
    const path = join(canonicalAssets, prefix, entry);
    const stats = await lstat(path);
    if (stats.isSymbolicLink()) {
      throw new Error(`refusing to publish the symlinked asset ${name}: ${path}`);
    }
    if (stats.isDirectory()) {
      for (const [nested, nestedPath] of await collectAssetFiles(canonicalAssets, name)) {
        files.set(nested, nestedPath);
      }
      continue;
    }
    if (!stats.isFile()) {
      throw new Error(`refusing to publish the non-file asset ${name}: ${path}`);
    }
    assertContained(canonicalAssets, await realpath(path), `asset ${name}`);
    files.set(name, path);
  }
  return files;
}

// ---------------------------------------------------------------------------
// Visible-text policy
// ---------------------------------------------------------------------------

function assertPublicTerms(markdown, page) {
  const visible = normalizeVisibleText(decodeHTML(collectVisibleText(markdown)));
  const found = normalizedBannedTerms
    .filter(({ needle }) => needle !== '' && visible.includes(needle))
    .map(({ term }) => term);
  if (found.length > 0) {
    throw new Error(`${page} contains banned public terms: ${found.join(', ')}`);
  }
}

/**
 * Renders the reader-visible text of a document: comments dropped, character
 * references decoded by the parsers, and URL destinations excluded because a
 * destination is never read by a human.
 */
function collectVisibleText(markdown) {
  return visibleTextOf(fromMarkdown(markdown));
}

function visibleTextOf(node) {
  switch (node.type) {
    case 'text':
    case 'inlineCode':
    case 'code':
      return node.value ?? '';
    case 'html':
      return visibleHtmlText(node.value ?? '');
    case 'image':
    case 'imageReference':
      return joinVisible([node.alt ?? '', node.title ?? ''], '\n');
    case 'definition':
      // The label and title are rendered; the URL destination is exempt.
      return joinVisible([node.label ?? '', node.title ?? ''], '\n');
    case 'break':
    case 'thematicBreak':
      return '\n';
    default:
      break;
  }

  const children = node.children ?? [];
  const parts = children.map((child) => visibleTextOf(child));
  if (node.type === 'link' || node.type === 'linkReference') {
    // Label text is inline with its surroundings; the title is a separate region.
    return joinVisible([parts.join(''), node.title ?? ''], '\n');
  }
  return parts.join(BLOCK_CONTAINERS.has(node.type) ? '\n' : '');
}

function joinVisible(parts, separator) {
  return parts.filter((part) => part !== '').join(separator);
}

/** Extracts what an HTML fragment renders: text nodes and visible attributes, never comments. */
function visibleHtmlText(html) {
  const pieces = [];
  const visit = (node) => {
    const name = node.nodeName;
    if (name === '#comment' || name === '#documentType') return;
    if (name === '#text') {
      pieces.push(node.value ?? '');
      return;
    }
    for (const attribute of node.attrs ?? []) {
      if (VISIBLE_HTML_ATTRIBUTES.has(attribute.name) || rendersValueAttribute(node, attribute)) {
        pieces.push(`\n${attribute.value}\n`);
      }
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(parseFragment(html));
  return pieces.join('');
}

function rendersValueAttribute(node, attribute) {
  if (attribute.name !== 'value' || node.nodeName !== 'input') return false;
  const type = node.attrs?.find((candidate) => candidate.name === 'type')?.value ?? '';
  return !UNRENDERED_INPUT_VALUE_TYPES.has(type.trim().toLowerCase());
}

function normalizeVisibleText(text) {
  return text
    .replace(INVISIBLE_CODE_POINTS, '')
    .normalize('NFKC')
    .replace(INVISIBLE_CODE_POINTS, '')
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Destination rewriting and local asset publication
// ---------------------------------------------------------------------------

/**
 * Rewrites link and image destinations that the parser identified, splicing by
 * source offset so nothing else in the document is disturbed.
 */
function rewriteDestinations(markdown, { page, assetNames }) {
  const edits = [];
  collectDestinationEdits(fromMarkdown(markdown), markdown, { page, assetNames, edits });

  let output = markdown;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    output = `${output.slice(0, edit.start)}${edit.replacement}${output.slice(edit.end)}`;
  }
  return output;
}

function collectDestinationEdits(node, markdown, context) {
  if (node.type === 'image' || node.type === 'link' || node.type === 'definition') {
    const replacement = resolveDestination(node, context);
    if (replacement !== null) {
      const span = locateDestination(node, markdown);
      if (!span) {
        throw new Error(
          `${context.page}: cannot rewrite the destination of a ${node.type} at line ${node.position?.start?.line}`,
        );
      }
      if (span.raw !== replacement) {
        context.edits.push({ start: span.start, end: span.end, replacement });
      }
    }
  }
  for (const child of node.children ?? []) collectDestinationEdits(child, markdown, context);
}

function resolveDestination(node, { page, assetNames }) {
  const url = node.url ?? '';
  const assetName = repositoryAssetName(url) ?? relativeAssetName(url);
  if (assetName !== null) {
    if (!assetNames.has(assetName)) {
      throw new Error(
        `${page}: ${assetName} is published as a local wiki asset but docs/assets/wiki/${assetName} does not exist`,
      );
    }
    return `${PUBLISHED_ASSET_DIRECTORY}/${assetName}`;
  }
  if (node.type === 'image') return null;
  return internalWikiTarget(url);
}

const RELATIVE_ASSET_PREFIX = '../assets/wiki/';

/** Recognises the repository's own canonical image URLs via URL parsing, not pattern matching. */
function repositoryAssetName(url) {
  if (url.startsWith(RELATIVE_ASSET_PREFIX)) {
    return url.slice(RELATIVE_ASSET_PREFIX.length);
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  let segments;
  try {
    segments = parsed.pathname.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  let path;
  if (host === 'github.com' || host === 'www.github.com') {
    // <owner>/<repo>/(blob|raw)/<ref>/<path...>
    if (segments.length < 5 || (segments[2] !== 'blob' && segments[2] !== 'raw')) return null;
    path = segments.slice(4);
  } else if (host === 'raw.githubusercontent.com') {
    // <owner>/<repo>/<ref>/<path...>
    if (segments.length < 4) return null;
    path = segments.slice(3);
  } else {
    return null;
  }

  if (path.length !== REPOSITORY_ASSET_SEGMENTS.length + 1) return null;
  if (REPOSITORY_ASSET_SEGMENTS.some((expected, index) => path[index] !== expected)) return null;
  return path.at(-1);
}

function relativeAssetName(url) {
  if (hasScheme(url) || url.startsWith('//')) return null;
  const [path] = url.split(/[?#]/);
  const segments = path.split('/').filter((segment) => segment !== '' && segment !== '.');

  const wiki = segments.indexOf('wiki');
  if (wiki > 0 && segments[wiki - 1] === 'assets' && segments.length === wiki + 2) {
    return segments[wiki + 1];
  }
  if (segments.length === 2 && segments[0] === PUBLISHED_ASSET_DIRECTORY) return segments[1];
  return null;
}

function internalWikiTarget(url) {
  if (hasScheme(url) || url.startsWith('//') || url.startsWith('/') || url === '') return null;
  const hash = url.indexOf('#');
  const path = hash === -1 ? url : url.slice(0, hash);
  const anchor = hash === -1 ? '' : url.slice(hash);
  if (!path.toLowerCase().endsWith('.md')) return null;
  return `${path.slice(0, -'.md'.length)}${anchor}`;
}

function hasScheme(url) {
  return /^[a-z][a-z0-9+.-]*:/i.test(url);
}

/**
 * Finds the raw destination span inside a node the parser already delimited.
 * Returns null when the span cannot be identified unambiguously, so the caller
 * fails loudly instead of corrupting the document.
 */
function locateDestination(node, markdown) {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;
  if (typeof start !== 'number' || typeof end !== 'number') return null;
  const slice = markdown.slice(start, end);

  let regionStart;
  let regionEnd;
  if (node.type === 'definition') {
    const marker = slice.indexOf(']:');
    if (marker === -1) return null;
    regionStart = marker + 2;
    regionEnd = slice.length;
  } else {
    if (!slice.endsWith(')')) return null;
    const marker = slice.lastIndexOf('](');
    if (marker === -1) return null;
    regionStart = marker + 2;
    regionEnd = slice.length - 1;
  }

  const region = slice.slice(regionStart, regionEnd);
  let cursor = 0;
  while (cursor < region.length && /\s/.test(region[cursor])) cursor += 1;

  let destinationStart = cursor;
  let destinationEnd;
  if (region[cursor] === '<') {
    const close = region.indexOf('>', cursor);
    if (close === -1) return null;
    destinationStart = cursor + 1;
    destinationEnd = close;
  } else {
    let depth = 0;
    let index = cursor;
    for (; index < region.length; index += 1) {
      const character = region[index];
      if (character === '\\') {
        index += 1;
        continue;
      }
      if (character === '(') depth += 1;
      else if (character === ')') depth -= 1;
      else if (/\s/.test(character) && depth === 0) break;
    }
    destinationEnd = index;
  }

  const raw = region.slice(destinationStart, destinationEnd);
  if (raw === '') return null;
  // Only splice when the raw text is what the parser resolved; otherwise the
  // destination was escaped or percent-normalised and we must not guess.
  if (raw !== node.url && decodeHTML(raw) !== node.url) return null;

  return {
    raw,
    start: start + regionStart + destinationStart,
    end: start + regionStart + destinationEnd,
  };
}

// ---------------------------------------------------------------------------

function generationBanner(page, commitSha) {
  return [
    '> [!NOTE]',
    '> 자동 생성 문서입니다. GitHub Wiki에서 직접 수정하지 마세요.',
    `> 원본: \`docs/game-logic/${page}\` · 커밋: \`${commitSha}\``,
    '> <span class="janseon-unofficial-au">비공식·비상업 팬 AU</span> · [비공식 팬 AU 고지](Unofficial-Fan-AU-Notice)',
  ].join('\n');
}

function normalizeMarkdown(markdown) {
  return `${markdown.trimEnd()}\n`;
}

async function main() {
  const [sourceDir, assetDir, outputDir, commitSha] = process.argv.slice(2);
  if (!sourceDir || !assetDir || !outputDir || !commitSha) {
    throw new Error('usage: node build-wiki.mjs <sourceDir> <assetDir> <outputDir> <commitSha>');
  }
  await buildWiki({ sourceDir, assetDir, outputDir, commitSha });
  console.log(`built wiki: ${outputDir}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
