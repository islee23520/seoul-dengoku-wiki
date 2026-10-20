import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, test } from 'vitest'
import { approvalPath, proposalPath } from './approved-organization-aliases.mjs'

const root = resolve(import.meta.dirname, '..')
const execute = promisify(execFile)

describe('standalone pure holdings snapshot inputs', () => {
  test('holdings context projection rejects undeclared snapshot reads', async () => {
    const manifest = JSON.parse(await readFile(resolve(root, 'snapshots/build-inputs/source-manifest.json'), 'utf8'))
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.files.map((file) => file.path).sort()).toEqual([
      'SeoulWorldGraph.json',
      'atlas-data.js',
      'creative-name-normalization.json',
    ])
    const graph = JSON.parse(await readFile(resolve(root, 'snapshots/build-inputs/SeoulWorldGraph.json'), 'utf8'))
    expect(graph.stations.length).toBeGreaterThan(0)
    const scratch = await mkdtemp(join(tmpdir(), 'wiki-standalone-snapshot-'))
    try {
      const manifestPath = join(scratch, 'source-manifest.json')
      await copyFile(resolve(root, 'snapshots/build-inputs/source-manifest.json'), manifestPath)
      const snapshotPaths = await Promise.all(manifest.files.map(async file => {
        const bytes = await readFile(resolve(root, 'snapshots/build-inputs', file.path))
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256)
        const path = join(scratch, file.path)
        await copyFile(resolve(root, 'snapshots/build-inputs', file.path), path)
        return path
      }))
      const undeclared = join(scratch, 'undeclared.json')
      const outside = join(scratch, 'outside-root.json')
      for (const path of [undeclared, outside]) await writeFile(path, '{"unexpected":true}')
      // Exercise the existing pure producer, not the publication CLI. Exact-file
      // permissions exclude undeclared siblings even though they really exist.
      const code = `
        import { readFile } from 'node:fs/promises';
        import { resolve } from 'node:path';
        import { loadPersonHoldingsContext, projectPersonStateInputs } from ${JSON.stringify(new URL('./person-detail-inputs.mjs', import.meta.url).href)};
        import { loadApprovedOrganizationAliases } from ${JSON.stringify(new URL('./approved-organization-aliases.mjs', import.meta.url).href)};
        import { loadDataset, validate } from ${JSON.stringify(new URL('../lore/relations/validate.mjs', import.meta.url).href)};
        import { renderLoreMarkdown } from ${JSON.stringify(new URL('./lore-json-render.mjs', import.meta.url).href)};
        const root = ${JSON.stringify(root)};
        const read = path => readFile(resolve(root, path));
        const json = async path => JSON.parse(await read(path));
        const courtDataset = loadDataset();
        const errors = validate(courtDataset);
        if (errors.length) throw new Error(errors.join('; '));
        // Holdings context consumes these fields; personal-tier authentication
        // belongs to full person-detail production, which this test never calls.
        const sources = {
          courtDataset, issuedById: new Map(courtDataset.people.map(person => [person.id, person])),
          peopleSource: (await json('lore/name-pools/values-cast.json')).people,
          originalHoldings: await json('lore/relations/personal-holdings.json'),
          openingAllocation: await json('lore/relations/opening-feudal-allocation.json'),
          stationInteriors: await json('lore/regions/station-interiors.json'),
        };
        const pages = new Map(await Promise.all([
          ['Sixteen-States', 'factions/Sixteen-States.json'],
          ['Offices-and-Ranks', 'offices/Offices-and-Ranks.json'],
          ['Core-Characters', 'characters/Core-Characters.json'],
        ].map(async ([slug, path]) => [slug, { value: await json('lore/' + path) }])));
        const rendered = new Map([...pages].map(([slug, page]) => [slug, renderLoreMarkdown(page.value, 'ko')]));
        const organizationAliases = await loadApprovedOrganizationAliases(root);
        sources.bytesFor = async path => {
          if (path.startsWith('snapshots/build-inputs/')) {
            if (process.argv[1] && path.endsWith('/SeoulWorldGraph.json')) await readFile(process.argv[1]);
            return readFile(resolve(${JSON.stringify(scratch)}, path.slice('snapshots/build-inputs/'.length)));
          }
          return read(path);
        };
        const context = await loadPersonHoldingsContext(sources, { repoRoot: root,
          ...projectPersonStateInputs(rendered, pages, { organizationAliases }) });
        console.log(JSON.stringify({ snapshots: context.snapshotManifest.files, holdings: context.personalHoldings.holdings.length }));
      `
      const allowed = [resolve(root, 'scripts'), resolve(root, 'lore'), resolve(root, 'vendor'),
        await realpath(resolve(root, 'node_modules')), resolve(root, 'package.json'),
        resolve(root, proposalPath), resolve(root, approvalPath),
        manifestPath, ...snapshotPaths]
      const args = ['--permission', ...allowed.map(path => '--allow-fs-read=' + path), '--input-type=module', '-e', code]
      const options = { cwd: root, encoding: 'utf8', timeout: 30000, killSignal: 'SIGKILL',
        env: { ...process.env, NODE_OPTIONS: undefined, SEOUL_KENSHI_ROOT: undefined, LORE_ROOT: undefined,
          WIKI_LORE_ROOT: undefined, WIKI_SNAPSHOT_ROOT: undefined, WIKI_REGION_ATLAS_PATH: undefined } }
      const { stdout } = await execute(process.execPath, args, options)
      const result = JSON.parse(stdout)
      expect(result.snapshots).toEqual(manifest.files)
      expect(result.holdings).toBeGreaterThan(0)
      process.stdout.write('HOLDINGS_BASELINE_SUCCESS ' + stdout + '\n')
      for (const path of [undeclared, outside]) {
        const failure = await execute(process.execPath, [...args, path], options).then(
          () => { throw new Error('Expected forbidden read to fail: ' + path) }, error => error)
        expect(failure).toMatchObject({
          code: 1, stderr: expect.stringContaining('ERR_ACCESS_DENIED'),
        })
        expect(failure.stderr).toContain(path)
        process.stdout.write('FORBIDDEN_READ_REJECTED ' + path + ' exit=' + failure.code + '\n' + failure.stderr)
      }
    } finally {
      await rm(scratch, { recursive: true, force: true })
      await expect(stat(scratch)).rejects.toMatchObject({ code: 'ENOENT' })
      process.stdout.write('TEMP_CLEANUP_READBACK=ENOENT ' + scratch + '\n')
    }
  }, 90000)
})
