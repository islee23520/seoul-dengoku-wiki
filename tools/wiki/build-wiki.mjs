import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bannedPublicTerms = ['Kenshi', 'Underrail', 'Gunner'];

export async function buildWiki({ sourceDir, assetDir, outputDir, commitSha }) {
  if (!commitSha) throw new Error('commitSha is required');

  await clearOutputDirectory(outputDir);
  await mkdir(join(outputDir, 'assets'), { recursive: true });

  const pages = (await readdir(sourceDir)).filter((name) => name.endsWith('.md')).sort();
  for (const page of pages) {
    const source = await readFile(join(sourceDir, page), 'utf8');
    assertPublicTerms(source, page);

    const transformed = normalizeMarkdown(rewriteAssetLinks(source));
    const output = page === '_Sidebar.md'
      ? transformed
      : `${generationBanner(page, commitSha)}\n\n${transformed}`;
    await writeFile(join(outputDir, page), output);
  }

  await cp(assetDir, join(outputDir, 'assets'), { recursive: true });
}

async function clearOutputDirectory(outputDir) {
  await mkdir(outputDir, { recursive: true });
  const entries = await readdir(outputDir);
  await Promise.all(entries
    .filter((entry) => entry !== '.git')
    .map((entry) => rm(join(outputDir, entry), { recursive: true, force: true })));
}

function generationBanner(page, commitSha) {
  return [
    '> [!NOTE]',
    '> 자동 생성 문서입니다. GitHub Wiki에서 직접 수정하지 마세요.',
    `> 원본: \`docs/game-logic/${page}\` · 커밋: \`${commitSha}\``,
  ].join('\n');
}

function rewriteAssetLinks(markdown) {
  return markdown.replaceAll('../assets/wiki/', 'assets/');
}

function normalizeMarkdown(markdown) {
  return `${markdown.trimEnd()}\n`;
}

function assertPublicTerms(markdown, page) {
  const found = bannedPublicTerms.filter((term) => markdown.includes(term));
  if (found.length > 0) {
    throw new Error(`${page} contains banned public terms: ${found.join(', ')}`);
  }
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
