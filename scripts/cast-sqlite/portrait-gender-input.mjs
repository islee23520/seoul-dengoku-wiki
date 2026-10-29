// Token generation consumes only the authored gender lock, not the rest of the ledger.
export function readPortraitGenderInputs(db) {
  const rows = db.prepare(`SELECT p.person_id,p.name,g.gender,g.user_locked
    FROM person p JOIN person_gender g USING(person_id) ORDER BY p.publication_ordinal`).all();
  if (rows.length !== 1022 || new Set(rows.map(row => row.name)).size !== 1022
    || rows.some(row => !['여성', '남성'].includes(row.gender)
      || ![null, 0, 1].includes(row.user_locked))) throw new Error('E_PORTRAIT_GENDER_INPUT');
  return new Map(rows.map(row => [row.name, { gender: row.gender, user_locked: row.user_locked === 1 }]));
}

export async function readPortraitGenderInputsAsync(db) {
  const rows = await db.all(`SELECT p.person_id,p.name,g.gender,g.user_locked
    FROM wiki.person p JOIN wiki.person_gender g USING(person_id) ORDER BY p.publication_ordinal`);
  if (rows.length !== 1022 || new Set(rows.map(row => row.name)).size !== 1022
    || rows.some(row => !['여성', '남성'].includes(row.gender)
      || ![null, 0, 1].includes(row.user_locked))) throw new Error('E_PORTRAIT_GENDER_INPUT');
  return new Map(rows.map(row => [row.name, { gender: row.gender, user_locked: row.user_locked === 1 }]));
}

export async function readPortraitGenderInputsAsync(db) {
  const rows = await db.all(`SELECT p.person_id,p.name,g.gender,g.user_locked
    FROM wiki.person p JOIN wiki.person_gender g USING(person_id) ORDER BY p.publication_ordinal`);
  if (rows.length !== 1022 || new Set(rows.map(row => row.name)).size !== 1022
    || rows.some(row => !['여성', '남성'].includes(row.gender)
      || ![null, 0, 1].includes(row.user_locked))) throw new Error('E_PORTRAIT_GENDER_INPUT');
  return new Map(rows.map(row => [row.name, { gender: row.gender, user_locked: row.user_locked === 1 }]));
}
