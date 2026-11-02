import { spawnSync } from 'node:child_process'
import { ledger } from '../../../WIKI/scripts/lore-json-validate-ledger.mjs'
import { PROJECTION_PATHS } from '../../../WIKI/scripts/world-atlas-schema.mjs'

const paths = [...new Set([...ledger, 'lore/World-Narrative-Atlas.json', ...PROJECTION_PATHS.map(projection => 'lore/' + projection)])]
const result = spawnSync(process.execPath, ['WIKI/scripts/lore-json-validate.mjs', ...paths.map(path => 'WIKI/' + path)], { stdio: 'inherit' })
if (result.error) console.error(result.error.message)
process.exitCode = result.status ?? 1
