import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const wikiRoot = fileURLToPath(new URL('../', import.meta.url));
const evidenceRoot = process.argv[2];
if (!evidenceRoot) throw new Error('usage: node scripts/import-portrait-candidates.mjs <evidence-root>');
const bHash = 'd928237c6dc0a5c9a64bc22d1fe38b71366fbdae5faa7eddaa9a747fde0d1526';
const genders = JSON.parse(await readFile(join(wikiRoot, 'lore/name-pools/gender-cast.json'), 'utf8')).people;
const properties = JSON.parse(await readFile(join(wikiRoot, 'portrait-properties.json'), 'utf8')).entries;
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const entries = [];
const destImages = join(wikiRoot, 'public/portraits');
const destTokens = join(wikiRoot, 'public/portrait-tokens');
await mkdir(destImages, { recursive: true });
await mkdir(destTokens, { recursive: true });

for (const group of ['recommended', 'rulers']) {
  const manifest = JSON.parse(await readFile(join(evidenceRoot, group, 'manifest.json'), 'utf8'));
  for (const row of manifest.entries) {
    const image = join(evidenceRoot, group, basename(row.portraitPath));
    const bytes = await readFile(image);
    if (sha(bytes) !== row.imageSha256 || row.styleReferenceSha256 !== bHash || row.approval !== 'art-proposal' || !row.qaVerdict.startsWith('PASS')) throw new Error(`portrait candidate not verified: ${row.personId}`);
    const source = JSON.parse(await readFile(join(evidenceRoot, group, basename(row.tokenPath)), 'utf8'));
    if (source.personId !== row.personId || source.characterId !== row.characterId || source.name !== row.name) throw new Error(`portrait identity mismatch: ${row.personId}`);
    const facts = group === 'recommended' ? source.sourceFacts : source.canonicalFacts;
    const proposal = group === 'recommended' ? { ...source.artProposal, upper: source.artProposal.outfit } : { ...source.artProposal, ...properties[row.personId] };
    if (!proposal.face || !proposal.hair || !proposal.upper) throw new Error(`incomplete art proposal: ${row.personId}`);
    proposal.lower ??= null;
    proposal.footwear ??= null;
    const gender = genders.find((entry) => entry.name === row.name);
    if (!gender || gender.gender !== facts.gender) throw new Error(`gender ledger mismatch: ${row.personId}`);
    if (group === 'recommended' && gender.user_locked !== facts.genderUserLocked) throw new Error(`gender lock mismatch: ${row.personId}`);
    const token = {
      schemaVersion: 1, personId: row.personId, characterId: row.characterId, name: row.name,
      stateId: row.stateId ?? null, approval: 'art-proposal',
      facts: { gender: facts.gender, genderUserLocked: gender.user_locked, role: facts.openingRole ?? facts.role },
      artProposal: proposal,
      style: { styleId: row.styleId, referenceSha256: bHash, portraitShotId: 'medium-close-up-119', crop: 'head, both shoulders and upper chest' },
      image: { path: `/portraits/${row.personId}.png`, sha256: row.imageSha256, width: row.pngDimensions?.width ?? source.generation?.dimensions?.[0], height: row.pngDimensions?.height ?? source.generation?.dimensions?.[1] }
    };
    if (JSON.stringify(token).includes('/Users/') || JSON.stringify(token).includes('apiKey') || JSON.stringify(token).includes('Authorization')) throw new Error(`private data in token: ${row.personId}`);
    await copyFile(image, join(destImages, `${row.personId}.png`));
    await writeFile(join(destTokens, `${row.personId}.json`), `${JSON.stringify(token, null, 2)}\n`);
    entries.push({ personId: row.personId, characterId: row.characterId, name: row.name, stateId: row.stateId ?? null, approval: token.approval, imageSha256: row.imageSha256 });
  }
}
if (entries.length !== 21 || new Set(entries.map(x => x.personId)).size !== 21) throw new Error(`expected 21 distinct people, got ${entries.length}`);
await writeFile(join(wikiRoot, 'portrait-catalog.json'), `${JSON.stringify({ schemaVersion: 1, status: 'reviewed-art-proposals', styleId: 'wingzero-119-b-ink-flat-medium-close-up', entries }, null, 2)}\n`);
console.log(`IMPORTED ${entries.length} candidates`);
