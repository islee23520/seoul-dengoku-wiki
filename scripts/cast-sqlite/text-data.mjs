import { isDeepStrictEqual } from 'node:util';
import { SIMPLE_TABLE_COLUMNS, mapSimpleData, reconstructSimpleData } from './text-data-simple.mjs';
import { ATLAS_TABLE_COLUMNS, mapAtlasData, reconstructAtlasData } from './text-data-atlas.mjs';
import { BESTIARY_TABLE_COLUMNS, mapBestiaryData, reconstructBestiaryData } from './text-data-bestiary.mjs';
import { GEOGRAPHY_TABLE_COLUMNS, mapGeographyData, reconstructGeographyData } from './text-data-geography.mjs';
import { CHARACTER_EXAMPLE_TABLE_COLUMNS, mapCharacterExampleData, reconstructCharacterExampleData } from './text-data-character-example.mjs';

export const TEXT_DATA_TABLE_COLUMNS = Object.freeze({ ...SIMPLE_TABLE_COLUMNS, ...ATLAS_TABLE_COLUMNS,
  ...BESTIARY_TABLE_COLUMNS, ...GEOGRAPHY_TABLE_COLUMNS, ...CHARACTER_EXAMPLE_TABLE_COLUMNS });
export function mapTextData({ files, bundle }) {
  return Object.freeze({ ...mapSimpleData({ files, bundle }), ...mapAtlasData({ files, bundle }),
    ...mapBestiaryData({ files, bundle }), ...mapGeographyData({ files, bundle }), ...mapCharacterExampleData({ files, bundle }) });
}
export function reconstructTextData({ tables, source_id }) {
  return { ...reconstructSimpleData({ tables, source_id }), ...reconstructAtlasData({ tables, source_id }),
    ...reconstructBestiaryData({ tables, source_id }), ...reconstructGeographyData({ tables, source_id }),
    ...reconstructCharacterExampleData({ tables, source_id }) };
}
export function auditTextData({ files, tables }) {
  const gaps = files.filter((file) => !isDeepStrictEqual(file.document.data, reconstructTextData({ tables, source_id: file.source_id })));
  return { domain_sidecar_normalization: gaps.length ? 'incomplete' : 'complete',
    domain_sidecar_document_count: files.filter((file) => Object.keys(file.document.data).length).length,
    domain_sidecar_gap_paths: gaps.map((file) => file.logical_path) };
}
