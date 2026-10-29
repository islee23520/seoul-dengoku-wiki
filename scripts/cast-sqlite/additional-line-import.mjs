import { createHash } from 'node:crypto';
import { withTransaction } from './db.mjs';
import { ADDITIONAL_LINE_SOURCE_PATHS } from './additional-line-sources.mjs';
import { mapTextCorpusLines } from './text-corpus-lines.mjs';

// Caller supplies the source bytes; this module never opens a logical path.
// Run before line revision adoption. Existing archive coordinates are preserved.
export function importAdditionalLineSources(db, sources) {
  const entries = ADDITIONAL_LINE_SOURCE_PATHS;
  if (!(sources instanceof Map) || sources.size !== entries.length) throw new Error('E_ADDITIONAL_LINE_COVERAGE');
  return withTransaction(db, () => {
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='line_document_head'").get()) throw new Error('E_ADDITIONAL_LINE_INITIALIZED');
    let next = db.prepare('SELECT coalesce(max(source_id),0) AS n FROM source_file').get().n;
    const files = entries.map(logical_path => {
      const bytes = sources.get(logical_path);
      if (!(bytes instanceof Uint8Array)) throw new Error('E_ADDITIONAL_LINE_BYTES');
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      const raw_bytes = Buffer.from(bytes);
      const media_type = logical_path.endsWith('.mjs') ? 'text/javascript' : 'text/markdown';
      const prior = db.prepare('SELECT * FROM source_file WHERE logical_path=?').get(logical_path);
      if (prior && (prior.sha256 !== sha256 || prior.byte_length !== raw_bytes.length
        || ![media_type, ...(media_type === 'text/javascript' ? ['application/javascript'] : [])].includes(prior.media_type)
        || !raw_bytes.equals(prior.raw_bytes))) throw new Error('E_ADDITIONAL_LINE_ARCHIVE');
      const source_id = prior?.source_id ?? ++next;
      if (db.prepare('SELECT 1 FROM text_line_document WHERE source_id=?').get(source_id)) throw new Error('E_ADDITIONAL_LINE_DUPLICATE');
      if (!prior) db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)')
        .run(source_id, logical_path, media_type, sha256, raw_bytes.length, raw_bytes);
      return { source_id, media_type, raw_bytes };
    });
    const mapped = mapTextCorpusLines({ bundle: { files } });
    for (const row of mapped.text_line_document) db.prepare('INSERT INTO text_line_document VALUES (?,?,?,?,?)').run(...Object.values(row));
    for (const row of mapped.text_line) db.prepare('INSERT INTO text_line VALUES (?,?,?,?,?)').run(...Object.values(row));
    return files.map(row => row.source_id);
  });
}
