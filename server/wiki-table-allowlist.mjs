// Public read boundary for /wiki/api/tables (owner decision 2026-11-03):
// only published wiki content is anonymously readable. Secret, admin and
// internal reference tables — identity ledgers, permission/approval records,
// issued/preserved character sheets, census/population/administrative imports,
// naming research, rail/geometry source data, authoring inputs and operation
// metadata — stay closed even where the publication pipeline consults them.
//
// Extending exposure means adding a name here through a reviewed pull request.
// The typed document corpus (wiki content proper) is admitted by prefix:
//   document_revision_text_*  — typed revisions of every document
//   text_*                    — current typed document content
//   region_content_*          — typed region-content document tables
export const PUBLIC_TABLE_PREFIXES = [
  'document_revision_text_',
  'region_content_',
  'text_',
];

export const PUBLIC_TABLES = new Set([
  'article_route',
  'catalog_category',
  'catalog_category_required_kind',
  'catalog_metadata_document',
  'catalog_official_line',
  'catalog_official_station',
  'catalog_official_station_line',
  'clan_crest_motif',
  'current_region_disposition',
  'current_right_retirement',
  'desire_axis',
  'document_head',
  'document_key_order',
  'document_publication_admission',
  'document_revision',
  'document_revision_link_target',
  'document_revision_seal',
  'geography_county',
  'geography_edition',
  'geography_map_title',
  'geography_metadata',
  'geography_title',
  'glossary_alias',
  'glossary_archive',
  'glossary_context',
  'glossary_head',
  'glossary_locale',
  'glossary_revision',
  'glossary_revision_seal',
  'glossary_term',
  'person',
  'person_alias',
  'person_desire',
  'person_disposition',
  'person_gender',
  'person_lineage',
  'person_value',
  'profile',
  'public_map_block',
  'public_map_block_locale',
  'public_map_summary',
  'public_office_replacement',
  'public_projection_document',
  'relation',
  'relation_type',
  'retirement_prose',
  'state',
  'state_label',
  'value_axis',
]);

export const isPublicTable = (name) =>
  PUBLIC_TABLES.has(name) || PUBLIC_TABLE_PREFIXES.some((prefix) => name.startsWith(prefix));
