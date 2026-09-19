import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { access, lstat, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as wiki from './build-wiki.mjs';

const { buildWiki } = wiki;

// Marker written by the generator into every output root it owns. Cleanup must
// refuse to delete anything from a root that does not carry it.
const SENTINEL = '.janseon-wiki-generated';
const REPO_IMAGE_BASE = 'https://github.com/islee23520/seoul-kenshi/blob/main/GAME-REFERENCE/assets/wiki';
const RAW_IMAGE_BASE = 'https://raw.githubusercontent.com/islee23520/seoul-kenshi/main/GAME-REFERENCE/assets/wiki';
const SECRET = 'TOPSECRET-DO-NOT-PUBLISH-8f2a1c';
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const root = await mkdtemp(join(tmpdir(), 'janseon-wiki-test-'));
const source = join(root, 'docs');
const assets = join(root, 'assets');
const output = join(root, 'wiki');
const secretFile = join(root, 'secret.txt');

await mkdir(source, { recursive: true });
await mkdir(assets, { recursive: true });
await writeFile(secretFile, `${SECRET}\n`);
await writeFile(join(assets, 'figure.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
await writeFile(join(assets, 'diagram.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');

const passed = [];
const failed = [];

async function testCase(name, run) {
  try {
    await run();
    passed.push(name);
  } catch (error) {
    failed.push({ name, error });
  }
}

async function sourceWith(label, files) {
  const dir = join(root, `src-${label}`);
  await mkdir(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    await writeFile(join(dir, name), body);
  }
  return dir;
}

async function generatedOutput(label) {
  const dir = join(root, `out-${label}`);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, SENTINEL), 'janseon wiki generated output\n');
  return dir;
}

async function buildPage(label, body, { assetDir = assets } = {}) {
  const sourceDir = await sourceWith(label, { 'Page.md': body });
  const outputDir = await generatedOutput(label);
  await buildWiki({ sourceDir, assetDir, outputDir, commitSha: 'abc1234' });
  return outputDir;
}

async function expectBannedVisibleText(label, body, why) {
  await assert.rejects(
    buildPage(label, body),
    /banned public terms/,
    `${label}: ${why}`,
  );
}

async function expectAcceptedVisibleText(label, body, why) {
  await buildPage(label, body).catch((error) => {
    assert.fail(`${label}: ${why} (threw ${error.message})`);
  });
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function assertNoLeak(dir, why) {
  if (!(await exists(dir))) return;
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const body = await readFile(join(entry.parentPath ?? entry.path, entry.name), 'utf8').catch(() => '');
    assert.ok(!body.includes(SECRET), `${why}: ${entry.name} leaked the secret payload`);
  }
}

// ---------------------------------------------------------------------------
// Pinned happy path (pre-existing contract)
// ---------------------------------------------------------------------------

await testCase('happy path: banner, link rewrite, asset copy, stale cleanup, .git preserved', async () => {
  await mkdir(join(output, '.git'), { recursive: true });
  await writeFile(join(output, '.git', 'HEAD'), 'ref: refs/heads/master\n');
  await writeFile(join(output, SENTINEL), 'janseon wiki generated output\n');
  await writeFile(join(output, 'stale.md'), 'stale');
  await writeFile(
    join(source, 'Home.md'),
    '# 홈\n\n![그림](../assets/wiki/figure.svg)\n\n[게임 설명](Game-Thesis.md)\n\n[외부 명세](https://example.com/spec.md#part)\n',
  );
  await writeFile(join(source, '_Sidebar.md'), '* [홈](Home)\n');

  await buildWiki({ sourceDir: source, assetDir: assets, outputDir: output, commitSha: 'abc1234' });

  const home = await readFile(join(output, 'Home.md'), 'utf8');
  const sidebar = await readFile(join(output, '_Sidebar.md'), 'utf8');
  const figure = await readFile(join(output, 'assets', 'figure.svg'), 'utf8');
  const gitHead = await readFile(join(output, '.git', 'HEAD'), 'utf8');

  assert.match(home, /janseon-unofficial-au/);
  assert.match(home, /원본: `Wikis\/game-logic\/Home\.md`/);
  assert.match(home, /커밋: `abc1234`/);
  assert.match(home, /\]\(assets\/figure\.svg\)/);
  assert.match(home, /\[게임 설명\]\(Game-Thesis\)/);
  assert.doesNotMatch(home, /Game-Thesis\.md/);
  assert.match(home, /\[외부 명세\]\(https:\/\/example\.com\/spec\.md#part\)/, 'external .md URL must not be rewritten');
  assert.equal(home.endsWith('\n\n'), false);
  assert.doesNotMatch(sidebar, /janseon-unofficial-au/);
  assert.doesNotMatch(sidebar, /원본:/);
  assert.equal(sidebar.endsWith('\n\n'), false);
  assert.match(figure, /<svg/);
  assert.equal(gitHead, 'ref: refs/heads/master\n');
  await assert.rejects(access(join(output, 'stale.md')));
});

await testCase('happy path: generator rewrites its own sentinel after cleanup', async () => {
  const stat = await lstat(join(output, SENTINEL));
  assert.ok(stat.isFile(), 'the sentinel must survive as a regular file so the next run may clean up');
});

await testCase('banned prose is rejected (Korean)', async () => {
  await expectBannedVisibleText('banned-ko', '# 나쁨\n\n복제 상태에서 반영합니다.\n', 'clone/복제 wording must be rejected');
});

await testCase('banned prose is rejected case-insensitively', async () => {
  await expectBannedVisibleText('banned-case', '# 나쁨\n\nClone this system.\n', 'the gate must be case-insensitive');
});

await testCase('banned clone wording still matches clones', async () => {
  await expectBannedVisibleText('banned-clones', '# 나쁨\n\nclones of this system.\n', 'clone must still match clones as a substring');
});

// Reference-derived tokens, assembled the same way as the gate so this file
// never carries the reference names as literals either.
const REF_ABBREV = 'ck' + '2';
const REF_ABBREV_LONG = 'ck' + 'ii';
const REF_STYLE_ALIAS = '만두' + '눈';
const SUCCESSOR_EN = ['Crus' + 'ader', 'Ki' + 'ngs', 'I' + 'II'].join(' ');
const SUCCESSOR_KO = ['크루세' + '이더', '킹' + '즈', '3'].join(' ');
const SUCCESSOR_TOKEN = 'CK' + '3';

await testCase('banned prose is rejected (reference abbreviation)', async () => {
  await expectBannedVisibleText('banned-ref-abbrev', `# 나쁨\n\n${REF_ABBREV.toUpperCase()} portraits.\n`, 'reference abbreviation wording must be rejected');
});

await testCase('banned prose is rejected (long reference abbreviation)', async () => {
  await expectBannedVisibleText('banned-ref-abbrev-long', `# 나쁨\n\n${REF_ABBREV_LONG.toUpperCase()} portraits.\n`, 'long reference abbreviation wording must be rejected');
});

await testCase('banned prose is rejected (reference style alias)', async () => {
  await expectBannedVisibleText('banned-ref-style-alias', `# 나쁨\n\n${REF_STYLE_ALIAS} 스타일입니다.\n`, 'reference style alias wording must be rejected');
});

await testCase('banned reference abbreviation is rejected case-insensitively', async () => {
  await expectBannedVisibleText('banned-ref-abbrev-case', `# 나쁨\n\n${REF_ABBREV} portraits.\n`, 'the reference abbreviation gate must be case-insensitive');
});

await testCase('malformed reference tokens are still inspected', async () => {
  await expectBannedVisibleText(
    'ref-abbrev-zero-width',
    `# 제목\n\n${REF_ABBREV.toUpperCase().slice(0, 1)}\u200B${REF_ABBREV.toUpperCase().slice(1)} portraits.\n`,
    'a zero-width space must not split the reference abbreviation',
  );
  await expectBannedVisibleText(
    'ref-style-alias-html',
    `# 제목\n\n<span>${REF_STYLE_ALIAS}</span>\n`,
    'the reference style alias inside raw HTML must be rejected',
  );
});

await testCase('successor-edition names and stat tables are not the reference abbreviation', async () => {
  await expectAcceptedVisibleText(
    'successor-korean',
    `# 제목\n\n${SUCCESSOR_KO} 참조.\n`,
    `the reference abbreviation must not match ${SUCCESSOR_KO}`,
  );
  await expectAcceptedVisibleText(
    'successor-english',
    `# 제목\n\n${SUCCESSOR_EN} reference.\n`,
    `the reference abbreviation must not match ${SUCCESSOR_EN}`,
  );
  await expectAcceptedVisibleText(
    'successor-token',
    `# 제목\n\n${SUCCESSOR_TOKEN} 인물 중심 대전략.\n`,
    `the reference abbreviation must not match ${SUCCESSOR_TOKEN}`,
  );
  await expectAcceptedVisibleText(
    'luck2-stat-table',
    '# 제목\n\n| Myrmidon / Swordmaster | Spd4·Luck2 / Spd5·Luck3 |\n',
    'the reference abbreviation must not match Luck2',
  );
});

// ---------------------------------------------------------------------------
// Filesystem boundary
// ---------------------------------------------------------------------------

await testCase('dangerous output roots are refused by a path guard without touching disk', async () => {
  assert.equal(typeof wiki.assertSafeOutputRoot, 'function', 'build-wiki.mjs must export assertSafeOutputRoot');
  for (const dangerous of ['/', homedir(), dirname(homedir()), '/tmp/..', resolve('/')]) {
    assert.throws(
      () => wiki.assertSafeOutputRoot(dangerous),
      /refus|danger|unsafe/i,
      `${dangerous} must be refused as an output root`,
    );
  }
  assert.throws(
    () => wiki.assertSafeOutputRoot(repositoryRoot),
    /repository|refus|unsafe/i,
    'the repository root must never be accepted as generated output',
  );
  const safe = join(root, 'out-guard-ok');
  assert.doesNotThrow(() => wiki.assertSafeOutputRoot(safe), 'a deep temp path must be accepted');
});

await testCase('source and asset roots can never be reused as the output root', async () => {
  const sourceDir = await sourceWith('same-source-output', {
    [SENTINEL]: 'janseon wiki generated output\n',
    'Page.md': '# source must survive\n',
  });
  await assert.rejects(
    buildWiki({ sourceDir, assetDir: assets, outputDir: sourceDir, commitSha: 'abc1234' }),
    /source|output root|same directory/i,
    'a sentinel must not make the source root eligible for cleanup',
  );
  assert.equal(await readFile(join(sourceDir, 'Page.md'), 'utf8'), '# source must survive\n');

  const assetDir = join(root, 'same-asset-output');
  await mkdir(assetDir, { recursive: true });
  await writeFile(join(assetDir, SENTINEL), 'janseon wiki generated output\n');
  await writeFile(join(assetDir, 'keep.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  await assert.rejects(
    buildWiki({ sourceDir: source, assetDir, outputDir: assetDir, commitSha: 'abc1234' }),
    /asset|output root|same directory/i,
    'a sentinel must not make the asset root eligible for cleanup',
  );
  assert.ok(await exists(join(assetDir, 'keep.svg')), 'the asset root must remain untouched');
});

await testCase('an existing empty output directory cannot bootstrap without a sentinel', async () => {
  const outputDir = join(root, 'out-existing-empty');
  await mkdir(outputDir, { recursive: true });
  await assert.rejects(
    buildWiki({ sourceDir: source, assetDir: assets, outputDir, commitSha: 'abc1234' }),
    /sentinel/i,
    'only a newly created output or a fresh clone containing only .git may bootstrap',
  );
});

await testCase('output root without the generated sentinel is refused before any deletion', async () => {
  const outputDir = join(root, 'out-no-sentinel');
  await mkdir(outputDir, { recursive: true });
  const precious = join(outputDir, 'precious.txt');
  await writeFile(precious, 'human authored\n');

  await assert.rejects(
    buildWiki({ sourceDir: source, assetDir: assets, outputDir, commitSha: 'abc1234' }),
    /sentinel/i,
    'a non-empty foreign directory must not be cleaned',
  );
  assert.equal(await readFile(precious, 'utf8'), 'human authored\n', 'the foreign file must be untouched');
});

await testCase('a fresh wiki clone containing only .git bootstraps the sentinel', async () => {
  const outputDir = join(root, 'out-fresh-clone');
  await mkdir(join(outputDir, '.git'), { recursive: true });
  await writeFile(join(outputDir, '.git', 'HEAD'), 'ref: refs/heads/master\n');

  await buildWiki({ sourceDir: source, assetDir: assets, outputDir, commitSha: 'abc1234' });
  assert.ok(await exists(join(outputDir, SENTINEL)), 'the generator must claim a fresh clone with its sentinel');
  assert.ok(await exists(join(outputDir, 'Home.md')));
});

await testCase('a symlinked output root is refused and its target survives', async () => {
  const real = join(root, 'out-root-real');
  await mkdir(real, { recursive: true });
  await writeFile(join(real, SENTINEL), 'janseon wiki generated output\n');
  await writeFile(join(real, 'keep.txt'), 'keep me\n');
  const link = join(root, 'out-root-link');
  await symlink(real, link, 'dir');

  await assert.rejects(
    buildWiki({ sourceDir: source, assetDir: assets, outputDir: link, commitSha: 'abc1234' }),
    /symlink/i,
    'a symlinked output root must be refused',
  );
  assert.equal(await readFile(join(real, 'keep.txt'), 'utf8'), 'keep me\n', 'the symlink target must be untouched');
});

await testCase('the sentinel itself must be a regular file, not a symlink', async () => {
  const outputDir = join(root, 'out-sentinel-symlink');
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, 'squatted.txt'), 'not generated\n');
  await symlink(secretFile, join(outputDir, SENTINEL), 'file');

  await assert.rejects(
    buildWiki({ sourceDir: source, assetDir: assets, outputDir, commitSha: 'abc1234' }),
    /sentinel/i,
    'a symlinked sentinel must not authorise cleanup',
  );
  assert.equal(await readFile(join(outputDir, 'squatted.txt'), 'utf8'), 'not generated\n');
});

await testCase('a symlink child inside the output root is unlinked without following it', async () => {
  const outsideDir = join(root, 'outside-payload');
  await mkdir(outsideDir, { recursive: true });
  const outsideFile = join(outsideDir, 'keep.txt');
  await writeFile(outsideFile, 'outside content\n');

  const outputDir = await generatedOutput('symlink-child');
  await symlink(outsideDir, join(outputDir, 'escape'), 'dir');
  await symlink(outsideFile, join(outputDir, 'escape.txt'), 'file');

  await buildWiki({ sourceDir: source, assetDir: assets, outputDir, commitSha: 'abc1234' });

  assert.equal(await readFile(outsideFile, 'utf8'), 'outside content\n', 'cleanup must never traverse a symlink');
  assert.ok(await exists(outsideDir), 'the outside directory must survive');
  assert.equal(await exists(join(outputDir, 'escape')), false, 'the symlink itself must be removed');
  assert.equal(await exists(join(outputDir, 'escape.txt')), false, 'the symlink itself must be removed');
});

await testCase('a symlinked source page (Leak.md) is refused and never published', async () => {
  const sourceDir = join(root, 'src-leak');
  await mkdir(sourceDir, { recursive: true });
  await writeFile(join(sourceDir, 'Home.md'), '# 홈\n');
  await symlink(secretFile, join(sourceDir, 'Leak.md'), 'file');
  const outputDir = await generatedOutput('leak-page');

  await assert.rejects(
    buildWiki({ sourceDir, assetDir: assets, outputDir, commitSha: 'abc1234' }),
    /symlink/i,
    'a symlinked source page must be refused',
  );
  await assertNoLeak(outputDir, 'symlinked source page');
});

await testCase('a symlinked asset is refused and never published', async () => {
  const assetDir = join(root, 'assets-leak');
  await mkdir(assetDir, { recursive: true });
  await writeFile(join(assetDir, 'figure.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  await symlink(secretFile, join(assetDir, 'leak.svg'), 'file');
  const outputDir = await generatedOutput('leak-asset');

  await assert.rejects(
    buildWiki({ sourceDir: source, assetDir, outputDir, commitSha: 'abc1234' }),
    /symlink/i,
    'a symlinked asset must be refused',
  );
  await assertNoLeak(outputDir, 'symlinked asset');
});

await testCase('a symlinked source or asset root is refused', async () => {
  await symlink(source, join(root, 'src-root-link'), 'dir');
  await symlink(assets, join(root, 'assets-root-link'), 'dir');

  await assert.rejects(
    buildWiki({
      sourceDir: join(root, 'src-root-link'),
      assetDir: assets,
      outputDir: await generatedOutput('src-root-link'),
      commitSha: 'abc1234',
    }),
    /symlink/i,
    'a symlinked source root must be refused',
  );
  await assert.rejects(
    buildWiki({
      sourceDir: source,
      assetDir: join(root, 'assets-root-link'),
      outputDir: await generatedOutput('asset-root-link'),
      commitSha: 'abc1234',
    }),
    /symlink/i,
    'a symlinked asset root must be refused',
  );
});

// ---------------------------------------------------------------------------
// Visible-text policy
// ---------------------------------------------------------------------------

await testCase('raw HTML element text is inspected', async () => {
  await expectBannedVisibleText(
    'html-label',
    '# 제목\n\n<span class="x">Kenshi</span>\n',
    'a banned term inside raw HTML must be rejected',
  );
});

await testCase('raw HTML attributes that render as visible text are inspected', async () => {
  await expectBannedVisibleText(
    'html-attr',
    '# 제목\n\n<img src="assets/figure.svg" alt="Kenshi like combat">\n',
    'a banned term in a visible HTML attribute must be rejected',
  );
});

await testCase('form-control values that render as visible text are inspected', async () => {
  await expectBannedVisibleText(
    'input-value-text',
    '# 제목\n\n<input type="text" value="Kenshi">\n',
    'a banned term in a rendered input value must be rejected',
  );
  await expectBannedVisibleText(
    'input-value-untyped',
    '# 제목\n\n<input value="Kenshi">\n',
    'an input without a type renders as text, so its value must be rejected',
  );
  await expectBannedVisibleText(
    'input-value-submit',
    '# 제목\n\n<input type="submit" value="Kenshi">\n',
    'a submit value is the button label and must be rejected',
  );
  await expectBannedVisibleText(
    'input-value-unknown-type',
    '# 제목\n\n<input type="totally-unknown" value="Kenshi">\n',
    'an unrecognised input type must fail closed and be rejected',
  );
});

await testCase('form-control values that never render are not visible text', async () => {
  await expectAcceptedVisibleText(
    'input-value-hidden',
    '# 제목\n\n<input type="hidden" value="Kenshi">\n\n본문입니다.\n',
    'a hidden input value is not rendered and must not trip the gate',
  );
  await expectAcceptedVisibleText(
    'input-value-checkbox',
    '# 제목\n\n<input type="checkbox" value="Kenshi">\n\n본문입니다.\n',
    'a checkbox value is not rendered as text and must not trip the gate',
  );
});

await testCase('HTML comments are removed so a comment-split term is caught', async () => {
  await expectBannedVisibleText(
    'comment-split',
    '# 제목\n\n이 문서는 Ken<!-- 주석 -->shi 이야기입니다.\n',
    'a comment must not split a banned term',
  );
});

await testCase('an HTML comment body alone is not visible text', async () => {
  await expectAcceptedVisibleText(
    'comment-only',
    '# 제목\n\n<!-- internal note: Kenshi comparison, do not publish -->\n\n본문입니다.\n',
    'comment bodies are not rendered and must not trip the gate',
  );
});

await testCase('character references are decoded before inspection', async () => {
  await expectBannedVisibleText(
    'entity-decimal',
    '# 제목\n\n&#75;enshi 방식입니다.\n',
    'a decimal character reference must be decoded',
  );
  await expectBannedVisibleText(
    'entity-hex',
    '# 제목\n\n&#x4B;enshi 방식입니다.\n',
    'a hex character reference must be decoded',
  );
  await expectBannedVisibleText(
    'entity-nested',
    '# 제목\n\n&amp;#75;enshi 방식입니다.\n',
    'a double-encoded character reference must be decoded',
  );
});

await testCase('NFKC normalization and case folding are applied', async () => {
  await expectBannedVisibleText(
    'nfkc-fullwidth',
    '# 제목\n\nＫｅｎｓｈｉ 방식입니다.\n',
    'fullwidth letters must normalize to ASCII',
  );
  await expectBannedVisibleText(
    'nfkc-kelvin',
    '# 제목\n\n\u212Aenshi 방식입니다.\n',
    'the Kelvin sign must normalize to K',
  );
  await expectBannedVisibleText(
    'case-fold-mixed',
    '# 제목\n\nkEnShI 방식입니다.\n',
    'mixed case must be folded',
  );
});

await testCase('zero-width and Unicode format characters are stripped before inspection', async () => {
  await expectBannedVisibleText(
    'zero-width-space',
    '# 제목\n\nKen\u200Bshi 방식입니다.\n',
    'a zero-width space must not split a banned term',
  );
  await expectBannedVisibleText(
    'soft-hyphen',
    '# 제목\n\nKen\u00ADshi 방식입니다.\n',
    'a soft hyphen must not split a banned term',
  );
  await expectBannedVisibleText(
    'zero-width-joiner',
    '# 제목\n\nGun\u200Dner 역할입니다.\n',
    'a zero-width joiner must not split a banned term',
  );
  await expectBannedVisibleText(
    'bidi-embedding',
    '# 제목\n\nUnder\u202Arail 방식입니다.\n',
    'a bidi format character must not split a banned term',
  );
});

await testCase('only URL destinations are exempt from the visible-text gate', async () => {
  await expectAcceptedVisibleText(
    'url-destination-exempt',
    `# 제목\n\n[저장소 문서](https://github.com/islee23520/seoul-kenshi/blob/main/README.md)\n`,
    'a banned substring inside a URL destination must be exempt',
  );
  await expectBannedVisibleText(
    'link-label-checked',
    '# 제목\n\n[Kenshi 스타일](https://example.com/)\n',
    'a banned term in a link label must be rejected',
  );
  await expectBannedVisibleText(
    'image-alt-checked',
    '# 제목\n\n![Kenshi 스타일](assets/figure.svg)\n',
    'a banned term in image alt text must be rejected',
  );
  await expectBannedVisibleText(
    'link-title-checked',
    '# 제목\n\n[문서](https://example.com/ "Kenshi 스타일")\n',
    'a banned term in a link title must be rejected',
  );
  await expectBannedVisibleText(
    'autolink-text-checked',
    '# 제목\n\n`Kenshi` 라는 코드 조각.\n',
    'a banned term inside inline code is still visible',
  );
});

// ---------------------------------------------------------------------------
// Local asset publication
// ---------------------------------------------------------------------------

await testCase('repository-hosted canonical image URLs are rewritten to local assets', async () => {
  const outputDir = await buildPage(
    'repo-image',
    `# 제목\n\n![그림](${REPO_IMAGE_BASE}/figure.svg?raw=true)\n\n![도해](${RAW_IMAGE_BASE}/diagram.svg)\n`,
  );
  const page = await readFile(join(outputDir, 'Page.md'), 'utf8');
  assert.match(page, /!\[그림\]\(assets\/figure\.svg\)/, 'blob?raw=true URLs must become local asset paths');
  assert.match(page, /!\[도해\]\(assets\/diagram\.svg\)/, 'raw.githubusercontent URLs must become local asset paths');
  assert.doesNotMatch(page, /github\.com/, 'no repository-hosted image URL may survive');
  assert.doesNotMatch(page, /githubusercontent\.com/, 'no repository-hosted image URL may survive');
  assert.ok(await exists(join(outputDir, 'assets', 'figure.svg')));
  assert.ok(await exists(join(outputDir, 'assets', 'diagram.svg')));
});

await testCase('a repository-hosted image without a local asset fails the build', async () => {
  await assert.rejects(
    buildPage('missing-asset', `# 제목\n\n![없음](${REPO_IMAGE_BASE}/absent.svg?raw=true)\n`),
    /absent\.svg/,
    'a missing local asset must fail the build loudly',
  );
});

await testCase('a relative asset link without a local asset fails the build', async () => {
  await assert.rejects(
    buildPage('missing-relative-asset', '# 제목\n\n![없음](../assets/wiki/absent.svg)\n'),
    /absent\.svg/,
    'a dangling relative asset link must fail the build',
  );
});

await testCase('unrelated external URLs are preserved', async () => {
  const outputDir = await buildPage(
    'external-urls',
    '# 제목\n\n![외부](https://example.com/diagram.svg)\n\n[명세](https://example.com/spec.md#part)\n',
  );
  const page = await readFile(join(outputDir, 'Page.md'), 'utf8');
  assert.match(page, /!\[외부\]\(https:\/\/example\.com\/diagram\.svg\)/, 'external images must be preserved verbatim');
  assert.match(page, /\[명세\]\(https:\/\/example\.com\/spec\.md#part\)/, 'external .md links must be preserved verbatim');
});

await testCase('every generated image path in the real repository wiki resolves on disk', async () => {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const outputDir = await generatedOutput('repo-full');
  await buildWiki({
    sourceDirs: [join(repositoryRoot, 'LORE'), join(repositoryRoot, 'GAME-LOGIC'), join(repositoryRoot, 'GDD')],
    assetDir: join(repositoryRoot, 'GAME-REFERENCE', 'assets', 'wiki'),
    outputDir,
    commitSha: 'assetcheck',
  });

  const pages = (await readdir(outputDir)).filter((name) => name.endsWith('.md'));
  let checked = 0;
  for (const page of pages) {
    const markdown = await readFile(join(outputDir, page), 'utf8');
    for (const [, target] of markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
      assert.doesNotMatch(target, /^https?:\/\/(?:www\.)?(?:github\.com|raw\.githubusercontent\.com)\//, `${page}: repository-hosted image URL survived (${target})`);
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      assert.ok(await exists(join(outputDir, target)), `${page}: generated image ${target} does not exist`);
      checked += 1;
    }
  }
  assert.ok(checked >= 10, `expected at least 10 local image references, got ${checked}`);
});

await testCase('project guidance files are excluded from public source pages', async () => {
  const sourceDir = await sourceWith('project-guidance', {
    'AGENTS.md': '# 내부 지침\n\n게시 대상이 아니다.\n',
    'Public.md': '# 공개 문서\n',
  });
  const outputDir = await generatedOutput('project-guidance');
  await buildWiki({ sourceDir, assetDir: assets, outputDir, commitSha: 'guidancecheck' });
  assert.equal(await exists(join(outputDir, 'AGENTS.md')), false, 'AGENTS.md must not be published');
  assert.equal(await exists(join(outputDir, 'Public.md')), true, 'ordinary Markdown must still publish');
});

// ---------------------------------------------------------------------------
// Malformed and hostile input must not crash the generator
// ---------------------------------------------------------------------------

await testCase('malformed markup is still inspected instead of crashing', async () => {
  await expectBannedVisibleText(
    'unclosed-html',
    '# 제목\n\n<span>Kenshi\n',
    'an unclosed HTML element must still be inspected',
  );
  await expectBannedVisibleText(
    'unterminated-fence',
    '# 제목\n\n```\nKenshi\n',
    'an unterminated fence must still be inspected',
  );
  await expectAcceptedVisibleText(
    'lone-replacement-chars',
    '# 제목\n\n\uFFFD\uFFFD 손상된 바이트가 있는 본문.\n\n<table><tr><td>정상</td>\n',
    'damaged bytes and unbalanced tables must not crash the generator',
  );
});

await testCase('commitSha remains mandatory', async () => {
  await assert.rejects(
    buildWiki({ sourceDir: source, assetDir: assets, outputDir: await generatedOutput('no-sha') }),
    /commitSha is required/,
  );
});

await testCase('the tools-only parser stack is exactly pinned and lockfile-consistent', async () => {
  const manifest = JSON.parse(await readFile(join(repositoryRoot, 'Tool', 'tools', 'package.json'), 'utf8'));
  const lock = JSON.parse(await readFile(join(repositoryRoot, 'Tool', 'tools', 'package-lock.json'), 'utf8'));
  const expected = {
    entities: '8.0.0',
    'mdast-util-from-markdown': '2.0.3',
    parse5: '8.0.1',
  };

  assert.deepEqual(manifest.dependencies, expected, 'parser dependencies must be exact tools-only versions');
  assert.deepEqual(lock.packages[''].dependencies, expected, 'lockfile root dependencies must match package.json');
  for (const [name, version] of Object.entries(expected)) {
    assert.equal(lock.packages[`node_modules/${name}`]?.version, version, `${name} lock entry must match the pin`);
  }
});

await testCase('the root parser stack is exactly pinned and lockfile-consistent', async () => {
  const manifest = JSON.parse(await readFile(join(repositoryRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(await readFile(join(repositoryRoot, 'package-lock.json'), 'utf8'));
  const expected = {
    entities: '8.0.0',
    'mdast-util-from-markdown': '2.0.3',
    parse5: '8.0.1',
  };

  assert.deepEqual(manifest.dependencies, expected, 'root parser dependencies must be exact versions');
  assert.equal(manifest.engines?.node, '>=22 <27', 'root engines.node must pin Node >=22 <27');
  assert.match(String(manifest.engines?.npm ?? ''), /12/, 'root engines.npm must pin npm 12');
  assert.match(String(manifest.packageManager ?? ''), /^npm@12\b/, 'packageManager must pin npm 12');
  assert.equal(lock.lockfileVersion, 3, 'package-lock must be npm 12 lockfileVersion 3');
  assert.deepEqual(lock.packages[''].dependencies, expected, 'root lockfile dependencies must match package.json');
  assert.equal(lock.packages[''].engines?.node, '>=22 <27', 'root lockfile engines.node must match package.json');
  for (const [name, version] of Object.entries(expected)) {
    assert.equal(lock.packages[`node_modules/${name}`]?.version, version, `root ${name} lock entry must match the pin`);
  }
});

await testCase('unpublished fragment pages listed in Cast-Index are not emitted', async () => {
  const sourceDir = await sourceWith('unpublished-fragments', {
    'Home.md': '# 홈\n',
    'Cast-State-01.md': '# 국가 01\n',
    'Cast-Index.md': [
      '# 인물 총람',
      '',
      '| 항목 | 게시 상태 | 기록된 경로 · SHA · 브랜치 | 조각 확인 / 남은 일 |',
      '| --- | --- | --- | --- |',
      '| B001 | 미게시·대기 | `docs/game-logic/Story-Batch-B001.md` @ `deadbeef` (`docs/cast-b001`) | 게시 미완 |',
      '| G01 | 미게시·대기 | `docs/game-logic/Hostile-Group-G01.md` @ `deadbeef` (`docs/cast-g01`) | 게시 미완 |',
      '',
    ].join('\n'),
    'Story-Batch-B001.md': '# B001\n조각',
    'Hostile-Group-G01.md': '# G01\n조각',
    'Monster-Batch-M001.md': '# M001\n조각',
  });
  const outputDir = await generatedOutput('unpublished-fragments');
  await buildWiki({ sourceDir, assetDir: assets, outputDir, commitSha: 'abc1234' });
  const names = await readdir(outputDir);
  assert.ok(names.includes('Home.md'), 'published Home stays');
  assert.ok(names.includes('Cast-Index.md'), 'published Cast-Index stays');
  assert.ok(names.includes('Cast-State-01.md'), 'published Cast-State stays');
  assert.ok(!names.includes('Story-Batch-B001.md'), 'unpublished story fragment must not emit');
  assert.ok(!names.includes('Hostile-Group-G01.md'), 'unpublished hostile fragment must not emit');
  assert.ok(!names.includes('Monster-Batch-M001.md'), 'unpublished monster fragment must not emit');
});

await testCase('Cast-Index 게시 rows still emit their fragment page', async () => {
  const sourceDir = await sourceWith('published-fragment', {
    'Cast-Index.md': [
      '# 인물 총람',
      '',
      '| 항목 | 게시 상태 | 기록된 경로 · SHA · 브랜치 | 조각 확인 / 남은 일 |',
      '| --- | --- | --- | --- |',
      '| B001 | 게시 | `docs/game-logic/Story-Batch-B001.md` @ `deadbeef` (`docs/cast-b001`) | 승인 |',
      '',
    ].join('\n'),
    'Story-Batch-B001.md': '# B001\n게시분',
  });
  const outputDir = await generatedOutput('published-fragment');
  await buildWiki({ sourceDir, assetDir: assets, outputDir, commitSha: 'abc1234' });
  const names = await readdir(outputDir);
  assert.ok(names.includes('Story-Batch-B001.md'), '게시 fragment must emit');
  assert.ok(names.includes('Cast-Index.md'));
});

// ---------------------------------------------------------------------------
// Repository documentation contract (pre-existing)
// ---------------------------------------------------------------------------

function corpusFile(name) {
  const roots = ['LORE', 'GAME-LOGIC', 'GDD'].map((dir) => join(repositoryRoot, dir));
  for (const root of roots) {
    const direct = join(root, name);
    if (existsSync(direct)) return direct;
  }
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      const st = statSync(path);
      if (st.isDirectory()) {
        const hit = walk(path);
        if (hit) return hit;
      } else if (entry === name) return path;
    }
    return undefined;
  };
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const hit = walk(root);
    if (hit) return hit;
  }
  return undefined;
}
const strategicPages = [
  'Strongholds-and-Territory.md',
  'Economy-and-Production.md',
  'Logistics-and-Infrastructure.md',
  'Factions-and-Diplomacy.md',
  'Warfare-and-Sieges.md',
  'Campaign-Progression.md',
];
const requiredSections = ['입력과 출력', '계산 규칙', '기본 수치', '경계 상황', '계산 예시'];
const requiredEdgeCasesByPage = {
  'Strongholds-and-Territory.md': ['식량', '전력', '고립', '과확장', '같은 날'],
  'Economy-and-Production.md': ['식량', '전력', '탄약', '인력', '고립', '과확장'],
  'Logistics-and-Infrastructure.md': ['고립', '봉쇄', '복구', '과확장', '전력'],
  'Factions-and-Diplomacy.md': ['고립', '봉쇄', '동시'],
  'Warfare-and-Sieges.md': ['보급', '고립', '퇴로', '봉쇄'],
  'Campaign-Progression.md': ['부족', '고립', '과확장', '같은 주'],
};
const sharedOverextensionPages = ['Strongholds-and-Territory.md', 'Campaign-Progression.md'];

function extractSection(markdown, heading, page) {
  const lines = markdown.split('\n');
  const start = lines.indexOf(`## ${heading}`);
  assert.notEqual(start, -1, `${page}: missing section ${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

function clamp(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

// Verifies every machine-checkable `expression = result` inside the worked-example
// section by recomputing it, instead of pinning the document's prose.
function verifyWorkedExamples(page, exampleSection) {
  const codeSpans = [...exampleSection.matchAll(/`([^`]+)`/g)].map((span) => span[1]);
  let verified = 0;
  for (const span of codeSpans) {
    const segments = span.split('=');
    if (segments.length < 2) continue;
    const expected = Number(segments.at(-1).trim());
    if (!Number.isFinite(expected)) continue;
    const expression = segments.at(-2).trim();
    const withoutFunctions = expression.replaceAll(/clamp|min|max|floor/g, '');
    if (!/^[0-9+\-*/(),.\s]*$/.test(withoutFunctions) || !/[0-9]/.test(withoutFunctions)) continue;
    const actual = new Function('clamp', 'min', 'max', 'floor', `'use strict'; return (${expression});`)(
      clamp,
      Math.min,
      Math.max,
      Math.floor,
    );
    assert.ok(
      Math.abs(actual - expected) < 0.005,
      `${page}: \`${span}\` computes ${actual} but the document claims ${expected}`,
    );
    verified += 1;
  }
  assert.ok(verified >= 1, `${page}: worked-example section has no machine-checkable calculation`);
  return verified;
}

await testCase('strategic pages keep their calculable contract', async () => {
  const repositorySidebar = await readFile(corpusFile('_Sidebar.md'), 'utf8');
  const repositoryHome = await readFile(corpusFile('Home.md'), 'utf8');

  let totalVerifiedCalculations = 0;
  for (const page of strategicPages) {
    const markdown = await readFile(corpusFile(page), 'utf8');
    for (const section of requiredSections) {
      assert.match(markdown, new RegExp(`^## ${section}$`, 'm'), `${page}: missing ${section}`);
    }
    assert.match(markdown, /^\|.+\|$/m, `${page}: missing table`);
    assert.match(markdown, /```mermaid\n/, `${page}: missing Mermaid diagram`);
    assert.match(markdown, /clamp\(/, `${page}: missing clamped formula`);
    assert.match(markdown, /기본값/, `${page}: missing default value`);
    assert.doesNotMatch(markdown, /복제|clone/i, `${page}: prohibited clone wording`);
    assert.doesNotMatch(markdown, /한 판(?![^\n]*전술|SRPG)/, `${page}: 한 판 prohibited outside tactical/SRPG (p1P)`);

    const edgeSection = extractSection(markdown, '경계 상황', page);
    for (const edgeCase of requiredEdgeCasesByPage[page]) {
      assert.match(edgeSection, new RegExp(edgeCase), `${page}: 경계 상황 missing ${edgeCase}`);
    }

    totalVerifiedCalculations += verifyWorkedExamples(page, extractSection(markdown, '계산 예시', page));
  }
  assert.ok(totalVerifiedCalculations >= 12, `expected at least 12 verified calculations, got ${totalVerifiedCalculations}`);

  for (const page of sharedOverextensionPages) {
    const markdown = await readFile(corpusFile(page), 'utf8');
    assert.match(markdown, /\| 과확장 `O` \| 0~2 \|/, `${page}: shared 과확장 must use the 0~2 scale`);
    assert.doesNotMatch(markdown, /과확장[^\n|]*\| 0~1 \|/, `${page}: stale 0~1 과확장 range`);
  }
  const logistics = await readFile(corpusFile('Logistics-and-Infrastructure.md'), 'utf8');
  assert.match(logistics, /\| 고립 단계 \|[^\n]*\| 0 \| 2 \|/, 'logistics must define the shared 고립 단계 0~2 scale');
  const warfare = await readFile(corpusFile('Warfare-and-Sieges.md'), 'utf8');
  assert.match(warfare, /고립 단계/, 'warfare must reference the logistics-defined 고립 단계');

  for (const page of strategicPages) {
    const wikiName = page.replace(/\.md$/, '');
    const rel = `(?:\\.\\./)*(?:LORE|GAME-LOGIC|GDD)/`;
    assert.match(repositorySidebar, new RegExp(`\\(${wikiName}(?:\\.md)?\\)`), `${page}: missing sidebar link`);
    assert.match(repositoryHome, new RegExp(`\\((?:(?:\\.\\./)*(?:LORE|GAME-LOGIC|GDD)/)?${page.replace('.', '\\.')}\\)`), `${page}: missing home link`);
  }
});

// ---------------------------------------------------------------------------

for (const name of passed) console.log(`PASS  ${name}`);
for (const { name, error } of failed) {
  console.error(`FAIL  ${name}`);
  console.error(`      ${(error.message ?? String(error)).split('\n').join('\n      ')}`);
}
console.log(`\n${passed.length} passed, ${failed.length} failed`);

if (failed.length > 0) {
  process.exitCode = 1;
  console.error(`fixtures kept for inspection: ${root}`);
} else {
  await rm(root, { recursive: true, force: true });
  console.log(`temp fixtures removed: ${root}`);
  console.log('wiki build contract passed');
}
