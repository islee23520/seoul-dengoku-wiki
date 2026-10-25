import { createHash } from 'node:crypto';

export const EDITORIAL_EXAMPLE_SOURCE_HASH = '5954ee48e89fbe316cfae042a449afe33260fa41ba0cc26c7201d14bbc6ce477';
const documentHash = '8f3f7ca01b65e29fc207ee24a35d7f6b62d1a1011629ed38e0aa0f6bf1a91ef6';
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = () => { throw Error('E_EDITORIAL_EXAMPLE_DOCUMENT'); };

// A bounded authoring example, never a public article or an approved rule.
export function initializeEditorialExampleDocument(db, { sourceBytes, expectedSourceHash, actor, reason }) {
  if (db.isTransaction || expectedSourceHash !== EDITORIAL_EXAMPLE_SOURCE_HASH || !(sourceBytes instanceof Uint8Array)
    || hash(sourceBytes) !== expectedSourceHash || ![actor, reason].every(value => typeof value === 'string' && value.trim())) fail();
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  if (hash(JSON.stringify(document)) !== documentHash) fail();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE editorial_example_document (
      singleton INTEGER PRIMARY KEY CHECK(singleton=1), source_sha256 TEXT NOT NULL, version INTEGER NOT NULL,
      domain TEXT NOT NULL CHECK(domain='editorial'), document_id TEXT NOT NULL, slug TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status='draft'), tense_en TEXT NOT NULL, tense_ko TEXT NOT NULL,
      original_anchor TEXT NOT NULL, original_hash TEXT CHECK(original_hash IS NULL), source_kind TEXT NOT NULL,
      application TEXT NOT NULL, actor TEXT NOT NULL, reason TEXT NOT NULL) STRICT;
      CREATE TABLE editorial_example_locale (
        ordinal INTEGER PRIMARY KEY CHECK(ordinal BETWEEN 0 AND 1), locale TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL, summary TEXT NOT NULL, tense TEXT NOT NULL) STRICT;
      CREATE TABLE editorial_example_node (
        ordinal INTEGER PRIMARY KEY CHECK(ordinal BETWEEN 0 AND 1), kind TEXT NOT NULL,
        depth INTEGER, anchor TEXT NOT NULL, text_en TEXT NOT NULL, text_ko TEXT NOT NULL) STRICT;`);
    db.prepare('INSERT INTO editorial_example_document VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(expectedSourceHash,
      document.version, document.domain, document.id, document.slug, document.status, document.tense.en, document.tense.ko,
      document.provenance.original_anchor, document.provenance.original_hash, document.source.kind, document.data.application, actor, reason);
    Object.entries(document.locales).forEach(([locale, row], ordinal) => db.prepare('INSERT INTO editorial_example_locale VALUES (?,?,?,?,?)')
      .run(ordinal, locale, row.title, row.summary, row.tense));
    document.content.forEach((row, ordinal) => db.prepare('INSERT INTO editorial_example_node VALUES (?,?,?,?,?,?)')
      .run(ordinal, row.kind, row.depth ?? null, row.anchor, row.text.en, row.text.ko));
    if (JSON.stringify(readEditorialExampleDocument(db, { expectedSourceHash })) !== JSON.stringify(document)) fail();
    db.exec('COMMIT');
    return { documents: 1, locales: 2, nodes: 2 };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

export function readEditorialExampleDocument(db, { expectedSourceHash } = {}) {
  if (expectedSourceHash !== EDITORIAL_EXAMPLE_SOURCE_HASH) fail();
  const roots = db.prepare('SELECT * FROM editorial_example_document').all();
  const locales = db.prepare('SELECT * FROM editorial_example_locale ORDER BY ordinal').all();
  const nodes = db.prepare('SELECT * FROM editorial_example_node ORDER BY ordinal').all();
  if (roots.length !== 1 || roots[0].singleton !== 1 || roots[0].source_sha256 !== expectedSourceHash
    || locales.length !== 2 || nodes.length !== 2 || locales.some((row, i) => row.ordinal !== i)
    || nodes.some((row, i) => row.ordinal !== i)) fail();
  const row = roots[0];
  const document = { version: row.version, domain: row.domain, id: row.document_id, slug: row.slug, status: row.status,
    tense: { en: row.tense_en, ko: row.tense_ko },
    provenance: { original_anchor: row.original_anchor, original_hash: row.original_hash, history: [] },
    source: { kind: row.source_kind, refs: [] },
    locales: Object.fromEntries(locales.map(locale => [locale.locale, { title: locale.title, summary: locale.summary, tense: locale.tense }])),
    content: nodes.map(node => ({ kind: node.kind, ...(node.depth === null ? {} : { depth: node.depth }),
      anchor: node.anchor, text: { en: node.text_en, ko: node.text_ko } })), data: { application: row.application } };
  if (hash(JSON.stringify(document)) !== documentHash) fail();
  return document;
}
