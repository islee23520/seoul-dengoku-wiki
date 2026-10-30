// Bind each typed row to its original SQLite rowid before reproducing historical digests.
const primaryKeys = {
  context_rights_approval: ['approval_id'],
  context_rights_original_source: ['approval_id', 'role'],
  context_rights_transition: ['set_name', 'old_id'],
  context_feudal_binding: ['holding_id'],
  context_feudal_title: ['title_id'],
  context_feudal_jurisdiction: ['title_id', 'ordinal'],
  context_feudal_grant: ['grant_id'],
  context_feudal_grant_admin: ['grant_id', 'ordinal'],
  context_feudal_grant_component: ['grant_id', 'ordinal'],
  context_political_identity: ['identity_id'],
  context_political_identity_liege: ['identity_id', 'ordinal'],
};

export async function readLegacyRowOrder(tx, table) {
  const keys = primaryKeys[table];
  if (!keys) throw new Error(`unsupported legacy row order table: ${table}`);
  const key = keys.map(column => `source.${column}::text`).join(', ');
  const rows = await tx.all(`SELECT source.*, binding.ordinal AS __legacy_rowid
    FROM wiki.${table} AS source
    LEFT JOIN wiki.legacy_row_order AS binding
      ON binding.table_name = ? AND binding.key_json = jsonb_build_array(${key})
    ORDER BY binding.ordinal`, [table]);
  return rows.map(({ __legacy_rowid, ...row }) => {
    if (__legacy_rowid === null || __legacy_rowid === undefined) throw new Error(`${table}: missing legacy row order`);
    return row;
  });
}
