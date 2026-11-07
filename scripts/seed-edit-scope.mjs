import { isPublicTable } from '../server/wiki-table-allowlist.mjs'
import { isSeedTable } from './seed-scope.mjs'

export const SEED_EDIT_OPERATIONS = Object.freeze(Object.fromEntries([
  'state', 'state_label', 'clan_crest_motif', 'retirement_prose', 'relation_type',
  'geography_county', 'geography_edition', 'geography_map_title', 'geography_metadata', 'geography_title',
].map(name => [name, Object.freeze(['insert', 'update'])]).concat([
  ['current_region_disposition', Object.freeze(['insert'])],
  ['current_right_retirement', Object.freeze(['insert'])],
])))

export const isEditableSeedTable = name => Object.hasOwn(SEED_EDIT_OPERATIONS, name)

export function assertSeedEdit(table, operation) {
  if (!(isPublicTable(table) && isSeedTable(table) && isEditableSeedTable(table))) {
    throw new Error(`E_SYNC_OUT_OF_SCOPE: ${table}`)
  }
  if (!SEED_EDIT_OPERATIONS[table].includes(operation)) throw new Error(`E_SYNC_OPERATION: ${table}:${operation}`)
}
