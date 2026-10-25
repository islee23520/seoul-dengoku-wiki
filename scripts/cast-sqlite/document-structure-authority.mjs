/** Preserve typed column/check constraints while making local relations revision-scoped.
 * Only cross-document target identities remain outside the document revision. */
export function revisionTableDefinition(definition, table, tables) {
  let sql = definition.replace(new RegExp(`CREATE TABLE ${table}\\s*\\(`, 'u'),
    `CREATE TABLE document_revision_${table} (revision_id TEXT NOT NULL REFERENCES document_revision(revision_id),`);
  const sourcePrimary = /source_id INTEGER PRIMARY KEY REFERENCES/u.test(sql);
  sql = sql.replace(/source_id INTEGER PRIMARY KEY REFERENCES/u, 'source_id INTEGER NOT NULL REFERENCES');
  sql = sql.replace(/(PRIMARY KEY|UNIQUE)\(/gu, '$1(revision_id,');
  if (sourcePrimary) sql = sql.replace(/\) STRICT;?$/u, ', PRIMARY KEY(revision_id,source_id)) STRICT');
  sql = sql.replace(/\bsource_id INTEGER NOT NULL REFERENCES (text_\w+)\(source_id\)/gu,
    (match, target) => tables.includes(target) ? 'source_id INTEGER NOT NULL' : match);
  const inline = definition.match(/\bsource_id INTEGER (?:PRIMARY KEY|NOT NULL) REFERENCES (text_\w+)\(source_id\)/u);
  if (inline && tables.includes(inline[1])) sql = sql.replace(/\) STRICT;?$/u,
    `, FOREIGN KEY(revision_id,source_id) REFERENCES document_revision_${inline[1]}(revision_id,source_id)) STRICT`);
  return sql.replace(/FOREIGN KEY\(([^)]+)\) REFERENCES (text_\w+)\(([^)]+)\)/gu, (match, local, target, remote) => {
    if (!tables.includes(target) || local.startsWith('target_source_id') && target !== 'text_document_anchor') return match;
    const name = local.startsWith('target_source_id') ? 'document_revision_link_target' : `document_revision_${target}`;
    return `FOREIGN KEY(revision_id,${local}) REFERENCES ${name}(revision_id,${remote})`;
  });
}

export function sealHistoryTable(db, table) {
  for (const operation of ['UPDATE', 'DELETE']) db.exec(`CREATE TRIGGER immutable_${table}_${operation}
    BEFORE ${operation} ON document_revision_${table} BEGIN SELECT RAISE(ABORT,'immutable typed history'); END`);
  db.exec(`CREATE TRIGGER immutable_${table}_INSERT BEFORE INSERT ON document_revision_${table}
    WHEN EXISTS(SELECT 1 FROM document_revision_seal WHERE revision_id=NEW.revision_id)
    BEGIN SELECT RAISE(ABORT,'immutable committed typed history'); END`);
}

/** Atomic v1 -> v2 constraint migration, inside the successful CAS edit transaction.
 * Replacement typed tables are filled and compared before old storage is released.
 * Every revision ID, seal and normalized history row survives; no source is reconstructed.
 * Foreign keys stay enabled, including throughout the table replacement. */
export function upgradeStructuralAuthority(db, tables, authoritySql) {
  if (db.prepare('SELECT version FROM document_authority').get().version === 2) return;
  const targetSql = authoritySql.slice(authoritySql.indexOf('CREATE TABLE document_revision_link_target'),
    authoritySql.indexOf('CREATE TRIGGER document_revision_seal_no_update'));
  // Install the insertion seal after copying already-sealed historical target proofs.
  db.exec(targetSql.slice(0, targetSql.indexOf('CREATE TRIGGER')));
  db.prepare(`INSERT INTO document_revision_link_target
    SELECT DISTINCT l.revision_id,a.source_id,a.locale,a.ordinal,n.anchor,a.anchor
    FROM document_revision_text_document_link l
    JOIN text_document_anchor a ON a.source_id=l.target_source_id AND a.locale=l.locale AND a.ordinal=l.target_anchor_ordinal
    JOIN text_document_node n ON n.source_id=a.source_id AND n.json_pointer=a.node_pointer`).run();
  db.exec(targetSql.slice(targetSql.indexOf('CREATE TRIGGER')));
  const replacement = (sql) => sql.replace(/\bdocument_revision_(text_\w+)\b/gu, '$&_structural');
  for (const table of tables) {
    const definition = db.prepare("SELECT sql FROM sqlite_schema WHERE name=? AND type='table'").get(table).sql;
    db.exec(replacement(revisionTableDefinition(definition, table, tables)));
  }
  for (const table of tables) {
    const old = `document_revision_${table}`; const next = `${old}_structural`;
    db.exec(`INSERT INTO ${next} SELECT * FROM ${old}`);
    if (db.prepare(`SELECT * FROM ${old} EXCEPT SELECT * FROM ${next}`).get()
      || db.prepare(`SELECT * FROM ${next} EXCEPT SELECT * FROM ${old}`).get()) throw new Error('E_DOCUMENT_INTEGRITY: history migration differs');
  }
  for (const table of tables) db.exec(`DROP TABLE document_revision_${table}`);
  for (const table of tables) db.exec(`ALTER TABLE document_revision_${table}_structural RENAME TO document_revision_${table}`);
  for (const table of tables) sealHistoryTable(db, table);
  const identity = authoritySql.slice(authoritySql.indexOf('CREATE TABLE document_node_identity'), authoritySql.indexOf('CREATE TRIGGER document_revision_no_update'));
  db.exec(identity.replace('CREATE TABLE document_node_identity', 'CREATE TABLE document_node_identity_structural'));
  db.exec(`INSERT INTO document_node_identity_structural SELECT * FROM document_node_identity;
    DROP TABLE document_node_identity;
    ALTER TABLE document_node_identity_structural RENAME TO document_node_identity`);
  const identityTriggers = authoritySql.slice(authoritySql.indexOf('CREATE TRIGGER document_node_identity_no_update'), authoritySql.indexOf('CREATE TRIGGER document_archive_no_update'));
  db.exec(identityTriggers);
  db.exec(`CREATE TABLE document_authority_structural (
    singleton INTEGER PRIMARY KEY CHECK(singleton=1), version INTEGER NOT NULL CHECK(version=2),
    sequence INTEGER NOT NULL CHECK(sequence>=0)) STRICT;
    INSERT INTO document_authority_structural SELECT singleton,2,sequence FROM document_authority;
    DROP TABLE document_authority;
    ALTER TABLE document_authority_structural RENAME TO document_authority`);
}
