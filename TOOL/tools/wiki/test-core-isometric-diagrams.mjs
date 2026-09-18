import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

<<<<<<<< HEAD:TOOL/wiki/test-core-isometric-diagrams.mjs
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const gameLogicDir = join(repositoryRoot, 'Wikis', 'game-logic');
const assetDir = join(repositoryRoot, 'Reference', 'assets', 'wiki');
const manifestPath = join(repositoryRoot, 'Tool', 'wiki', 'core-isometric-diagrams.json');
========
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const corpusFile = (name) =>
  ['LORE', 'GAME-LOGIC', 'GDD']
    .map((dir) => join(repositoryRoot, dir, name))
    .find((candidate) => existsSync(candidate));
const assetDir = join(repositoryRoot, 'GAME-REFERENCE', 'assets', 'wiki');
const manifestPath = join(repositoryRoot, 'Tool', 'tools', 'wiki', 'core-isometric-diagrams.json');
>>>>>>>> main:TOOL/tools/wiki/test-core-isometric-diagrams.mjs

const requiredPages = [
  'Home.md',
  'Game-Thesis.md',
  'Campaign-Loop.md',
  'World-and-Subway-Layers.md',
  'Travel-and-Encounters.md',
  'Realtime-Formation-Card-Battle.md',
  'Strategy-Battle-Roundtrip.md',
  'Strongholds-and-Territory.md',
  'Economy-and-Production.md',
  'Logistics-and-Infrastructure.md',
  'Factions-and-Diplomacy.md',
  'Warfare-and-Sieges.md',
  'Campaign-Progression.md',
];

const requiredFont =
  'Pretendard, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif';

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
assert.deepEqual(
  manifest.map((entry) => entry.page),
  requiredPages,
  '13개 핵심 페이지가 고정 순서로 모두 등록되어야 한다',
);

const assets = new Set();
const alts = new Set();
const svgs = [];

for (const entry of manifest) {
  assert.equal(typeof entry.asset, 'string', `${entry.page}: asset이 필요하다`);
  assert.ok(entry.asset.endsWith('.svg'), `${entry.page}: SVG 도표여야 한다`);
  assert.equal(assets.has(entry.asset), false, `${entry.page}: 다른 페이지와 도표 파일을 공유할 수 없다`);
  assets.add(entry.asset);

  assert.equal(typeof entry.alt, 'string', `${entry.page}: 한국어 alt가 필요하다`);
  assert.match(entry.alt, /[가-힣]/, `${entry.page}: alt에 한국어가 필요하다`);
  assert.equal(alts.has(entry.alt), false, `${entry.page}: 다른 페이지와 alt를 공유할 수 없다`);
  alts.add(entry.alt);

  assert.deepEqual(
    entry.required_labels,
    ['칸에 누가 서 있나', '어느 쪽을 보나', '시야'],
    `${entry.page}: 세 아이소 문법 라벨이 필요하다`,
  );

  const markdown = await readFile(corpusFile(entry.page), 'utf8');
  assert.match(
    markdown,
    new RegExp(`!\\[${escapeRegex(entry.alt)}\\]\\([^)]*${escapeRegex(entry.asset)}(?:\\?[^)]*)?\\)`),
    `${entry.page}: manifest의 도표와 alt를 본문에서 연결해야 한다`,
  );

  const svg = await readFile(join(assetDir, entry.asset), 'utf8');
  svgs.push(svg);
  assert.match(svg, /<svg\b[^>]*\bviewBox=/, `${entry.asset}: viewBox가 필요하다`);
  assert.match(svg, /<title>[^<]*[가-힣][^<]*<\/title>/, `${entry.asset}: 한국어 title이 필요하다`);
  assert.match(svg, /<desc>[^<]*[가-힣][^<]*<\/desc>/, `${entry.asset}: 한국어 desc가 필요하다`);
  assert.match(svg, /font-family="[^"]*(?:sans-serif|Noto Sans KR|Apple SD Gothic Neo)/, `${entry.asset}: 한글 fallback 글꼴이 필요하다`);
  for (const label of entry.required_labels) {
    assert.match(svg, new RegExp(`>${escapeRegex(label)}<`), `${entry.asset}: 가시 라벨 '${label}'이 필요하다`);
  }
}

const uniqueStructures = new Set(svgs.map(normalizeSvgStructure));
assert.ok(
  uniqueStructures.size >= 8,
  `normalized structure groups must be at least 8, got ${uniqueStructures.size}`,
);

for (const [index, entry] of manifest.entries()) {
  const svg = svgs[index];
  const asset = entry.asset;
  assert.match(svg, /viewBox="0 0 1280 720"/, `${asset}: viewBox="0 0 1280 720"가 필요하다`);
  assert.match(svg, /\brole="img"/, `${asset}: role=img가 필요하다`);
  assert.match(svg, /\baria-labelledby="/, `${asset}: aria-labelledby가 필요하다`);
  assert.match(
    svg,
    new RegExp(`font-family="${escapeRegex(requiredFont)}"`),
    `${asset}: font-family에 ${requiredFont}가 필요하다`,
  );

  const visible = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((match) => match[1]);
  const koreanVisible = visible.filter((text) => /[가-힣]/.test(text));
  assert.ok(
    koreanVisible.length >= 6,
    `${asset}: 한국어 가시 라벨이 6개 이상 필요하다, got ${koreanVisible.length}`,
  );

  const resourceMarkup = svg.replace(/\sxmlns="https?:\/\/www\.w3\.org\/2000\/svg"/, '');
  assert.equal(/https?:\/\//.test(resourceMarkup), false, `${asset}: 외부 리소스를 참조하면 안 된다`);
  assert.equal(/url\((?!#)/.test(svg), false, `${asset}: 외부 url()을 참조하면 안 된다`);
  assert.equal(/<image\b/.test(svg), false, `${asset}: 외부 image를 참조하면 안 된다`);

// Battle terminology contract (fail-closed) — 2026-09-07 real-time formation/card direction (Intent.md decision 3)
const srpgMarkdown = await readFile(corpusFile("Realtime-Formation-Card-Battle.md"), "utf8");
assert.match(srpgMarkdown, /한 판은 확정된 전투 컨텍스트로 시작해 ResultId 하나로 끝나는 실시간 진형·카드 전투 세션 한 번을 뜻합니다/, "Realtime-Formation-Card-Battle.md must contain the exact contract");
assert.match(srpgMarkdown, /진형·사기·카드 타이밍이 실시간 전술의 핵심 축이며, 위치·방향·시야는 진형 규칙으로 이어집니다/, "Realtime-Formation-Card-Battle.md must mention formation/morale/card timing and position/facing/vision");

const allMarkdown = {};
for (const page of requiredPages) {
  allMarkdown[page] = await readFile(corpusFile(page), "utf8");
}

const standaloneHanpanCount = Object.entries(allMarkdown).filter(([page, md]) =>
  page !== "Realtime-Formation-Card-Battle.md" && /\b한 판\b(?!의|은|은\s|을|을\s|의\s|안에서|내에서)/.test(md)
).length;
assert.equal(standaloneHanpanCount, 0, "standalone \"한 판\" must appear ONLY in Realtime-Formation-Card-Battle.md among the 13 pages");

assert.match(allMarkdown["Campaign-Loop.md"], /출격하고 돌아오는 흐름/, "Campaign-Loop.md must use \"출격하고 돌아오는 흐름\"");
assert.equal(/\b한 판\b/.test(allMarkdown["Campaign-Loop.md"]), false, "Campaign-Loop.md must not call the campaign loop \"한 판\"");
}

console.log(`13 core isometric diagram contracts passed (${uniqueStructures.size} normalized structure groups)`);

function normalizeSvgStructure(svg) {
  return svg
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '<title/>')
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/gi, '<desc/>')
    .replace(/>([^<]*)</g, '><')
    .replace(/hsl\([^)]*\)/gi, 'hsl()')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
