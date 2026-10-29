// Token heritage uses only the existing authored family basis. No ethnicity is
// inferred here; retain the consumer's existing interpretation and evidence label.
export function readPortraitFamilyInputs(db) {
  const rows = db.prepare(`SELECT p.public_key,l.clan_id,l.reason
    FROM person p JOIN person_lineage l USING(person_id)
    WHERE l.naming_convention='non-korean-lineage' ORDER BY p.publication_ordinal`).all();
  if (new Set(rows.map(row => row.public_key)).size !== rows.length
    || rows.some(row => !/^person-\d{4}$/u.test(row.public_key) || !row.reason)) {
    throw new Error('E_PORTRAIT_FAMILY_INPUT');
  }
  return new Map(rows.map(row => [row.public_key, { basis: row.reason }]));
}

export async function readPortraitFamilyInputsAsync(db) {
  const rows = await db.all(`SELECT p.public_key,l.clan_id,l.reason
    FROM wiki.person p JOIN wiki.person_lineage l USING(person_id)
    WHERE l.naming_convention='non-korean-lineage' ORDER BY p.publication_ordinal`);
  if (new Set(rows.map(row => row.public_key)).size !== rows.length
    || rows.some(row => !/^person-\d{4}$/u.test(row.public_key) || !row.reason)) {
    throw new Error('E_PORTRAIT_FAMILY_INPUT');
  }
  return new Map(rows.map(row => [row.public_key, { basis: row.reason }]));
}
