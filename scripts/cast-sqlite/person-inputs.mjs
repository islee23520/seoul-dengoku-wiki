const paths = ['person-id-registry', 'cast-birthdays', 'cast-birth-cohorts'].map(name => `lore/name-pools/${name}.json`);
const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };

// This reader consumes typed authority, not import bytes or the generic JSON tree.
// The supplied connection is owned by the caller, like readDocument's connection.
export function readPersonBirthdayInputs(db) {
 const rows = (sql, ...bindings) => {
  try { return db.prepare(sql).all(...bindings); }
  catch (cause) {
   if (/no such (table|column)/u.test(cause.message)) fail('E_PERSON_INPUT_SCHEMA_GAP', cause.message);
   throw cause;
  }
 };
 const sources = paths.map(path => {
  const source = rows('SELECT source_id FROM source_file WHERE logical_path=?', path)[0];
  if (!source) fail('E_PERSON_INPUT_MISSING', path);
  return source.source_id;
 });
 const [registrySource, birthdaySource, cohortSource] = sources;
 const registry = rows('SELECT total_people,schema_name FROM identity_registry_provenance WHERE source_id=?', registrySource)[0];
 if (!registry || registry.schema_name !== 'wiki-person-id-registry.v1') fail('E_PERSON_INPUT_SCHEMA_GAP', 'registry provenance');
 const aliases = rows('SELECT person_id,alias FROM person_alias ORDER BY person_id,alias_ordinal');
 const birthdayRoster = rows('SELECT person_id AS id,name FROM person ORDER BY CAST(substr(person_id,2) AS INTEGER)').map(row => {
  const names = aliases.filter(alias => alias.person_id === row.id).map(alias => alias.alias);
  return { ...row, ...(names.length ? { aliases: names } : {}) };
 });
 if (registry.total_people !== 1022 || birthdayRoster.length !== registry.total_people
  || birthdayRoster.some(person => !/^K\d{3,4}$/u.test(person.id))) fail('E_PERSON_INPUT_COVERAGE', 'issued registry');
 const metadata = rows('SELECT field_name,value_kind,text_value,integer_value FROM family_source_metadata WHERE source_id=?', birthdaySource);
 const schema = metadata.find(row => row.field_name === 'schemaVersion');
 const reference = metadata.find(row => row.field_name === 'ageAsOf');
 if (schema?.value_kind !== 'number' || schema.integer_value !== 1 || reference?.value_kind !== 'string') fail('E_PERSON_INPUT_SCHEMA_GAP', 'birthday metadata');
 const date = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) fail('E_BIRTH_DATE', value);
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) fail('E_BIRTH_DATE', value);
  return year;
 };
 const ageAsOf = reference.text_value;
 const referenceYear = date(ageAsOf);
 const births = rows('SELECT person_id,birth_date,source_status FROM family_birthday WHERE source_id=? ORDER BY CAST(substr(json_pointer,9) AS INTEGER)', birthdaySource);
 const refs = rows('SELECT person_id,ordinal,source_ref FROM family_birthday_source WHERE source_id=? ORDER BY person_id,ordinal', birthdaySource);
 const cohorts = rows(`SELECT a.person_id,c.start_year,c.end_year FROM family_birth_cohort_assignment a
    JOIN family_birth_cohort c USING(cohort_id) WHERE a.source_id=? AND c.source_id=?`, cohortSource, cohortSource);
 if (births.length !== birthdayRoster.length || cohorts.length !== birthdayRoster.length) fail('E_PERSON_INPUT_COVERAGE', 'birthdays/cohorts');
 const ids = new Set(birthdayRoster.map(person => person.id));
 const birthdaysById = new Map();
 for (const row of births) {
  const year = date(row.birth_date);
  const cohort = cohorts.find(cohort => cohort.person_id === row.person_id);
  if (!ids.has(row.person_id) || birthdaysById.has(row.person_id)) fail('E_PERSON_INPUT_COVERAGE', row.person_id);
  if (row.birth_date > ageAsOf) fail('E_BIRTH_AFTER_REFERENCE', row.person_id);
  if (!cohort || year < cohort.start_year || year > cohort.end_year) fail('E_BIRTH_COHORT_RANGE', row.person_id);
  const sourceRefs = refs.filter(ref => ref.person_id === row.person_id);
  if (!sourceRefs.length || sourceRefs.some((ref, i) => ref.ordinal !== i || typeof ref.source_ref !== 'string' || !ref.source_ref.trim())) fail('E_BIRTH_SOURCE_REFS', row.person_id);
  if (!['owner-authored', 'existing-canon'].includes(row.source_status)) fail('E_BIRTH_SOURCE_STATUS', row.person_id);
  birthdaysById.set(row.person_id, {
   birthDate: row.birth_date, birthday: row.birth_date.slice(5),
   age: referenceYear - year - Number(ageAsOf.slice(5) < row.birth_date.slice(5)), ageAsOf,
   sourceStatus: row.source_status, sourceRefs: sourceRefs.map(ref => ref.source_ref)
  });
 }
 return { birthdayRoster, birthdaysById };
}

/** PostgreSQL twin; the sheet contains only this reader's exact bound SELECTs.
 * db-pg supplies safe JS numbers for bigint columns, including flags/ordinals. */
export async function readPersonBirthdayInputsAsync(tx) {
 try {
  const sheet = new Map();
  const load = async (sql, params = []) => {
   const result = await tx.all(sql.replace(/\b(FROM|JOIN)\s+([a-z_]+)/gu, '$1 wiki.$2'), params);
   sheet.set(sql + JSON.stringify(params), result);
   return result;
  };
  const sources = [];
  for (const path of paths) {
   const rows = await load('SELECT source_id FROM source_file WHERE logical_path=?', [path]);
   if (!rows[0]) fail('E_PERSON_INPUT_MISSING', path);
   sources.push(rows[0].source_id);
  }
  const [registry, birthday, cohort] = sources;
  await load('SELECT total_people,schema_name FROM identity_registry_provenance WHERE source_id=?', [registry]);
  await load('SELECT person_id,alias FROM person_alias ORDER BY person_id,alias_ordinal');
  await load('SELECT person_id AS id,name FROM person ORDER BY CAST(substr(person_id,2) AS INTEGER)');
  await load('SELECT field_name,value_kind,text_value,integer_value FROM family_source_metadata WHERE source_id=?', [birthday]);
  await load('SELECT person_id,birth_date,source_status FROM family_birthday WHERE source_id=? ORDER BY CAST(substr(json_pointer,9) AS INTEGER)', [birthday]);
  await load('SELECT person_id,ordinal,source_ref FROM family_birthday_source WHERE source_id=? ORDER BY person_id,ordinal', [birthday]);
  await load(`SELECT a.person_id,c.start_year,c.end_year FROM family_birth_cohort_assignment a
    JOIN family_birth_cohort c USING(cohort_id) WHERE a.source_id=? AND c.source_id=?`, [cohort, cohort]);
  return readPersonBirthdayInputs({
   prepare(sql) {
    return {
     all: (...params) => {
      const key = sql + JSON.stringify(params);
      if (!sheet.has(key)) fail('E_PERSON_INPUT_SCHEMA_GAP', `unmaterialized statement: ${sql}`);
      return sheet.get(key);
     }
    };
   }
  });
 } catch (error) {
  if (['42P01', '42703'].includes(error.code)) fail('E_PERSON_INPUT_SCHEMA_GAP', error.message);
  throw error;
 }
}
