// Token heritage uses only the existing authored family basis. No ethnicity is
// inferred here; retain the consumer's existing interpretation and evidence label.
export function readPortraitFamilyInputs(db) {
  const lineageSource = db.prepare("SELECT sha256 FROM source_file WHERE logical_path='lore/name-pools/cast-hangnyeol.json'").get();
  if (lineageSource?.sha256 !== 'a3adc3982ca14837d473cae4e88ad059dfd8c57247db4d8afb8228dd414aa3b4') {
    throw new Error('E_PORTRAIT_FAMILY_INPUT');
  }
  const rows = db.prepare(`SELECT p.public_key,l.clan_id,l.reason
    FROM person p JOIN person_lineage l USING(person_id)
    WHERE l.naming_convention='non-korean-lineage' ORDER BY p.publication_ordinal`).all();
  // Completeness is bounded to this independently compared source snapshot.
  if (rows.length !== 62 || new Set(rows.map(row => row.public_key)).size !== rows.length
    || rows.some(row => !/^person-\d{4}$/u.test(row.public_key) || !row.reason)) {
    throw new Error('E_PORTRAIT_FAMILY_INPUT');
  }
  return new Map(rows.map(row => [row.public_key, { basis: row.reason }]));
}
