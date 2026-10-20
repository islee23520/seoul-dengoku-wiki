CREATE TABLE text_document (
  source_id INTEGER PRIMARY KEY REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL CHECK(json_pointer=''),
  corpus_kind TEXT NOT NULL CHECK(corpus_kind IN ('current','historical','example')),
  version INTEGER NOT NULL CHECK(version=1),
  domain TEXT NOT NULL,
  document_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft','approved','excluded')),
  tense_ko TEXT NOT NULL CHECK(tense_ko IN ('past','present')),
  tense_en TEXT NOT NULL CHECK(tense_en IN ('past','present')),
  source_kind TEXT NOT NULL CHECK(source_kind IN ('original-fiction','observed','computed','inference','source-fact')),
  source_hash TEXT,
  original_anchor TEXT NOT NULL,
  original_hash TEXT,
  data_pointer TEXT NOT NULL CHECK(data_pointer='/data'),
  UNIQUE(corpus_kind,domain,slug),
  UNIQUE(source_id,corpus_kind),
  FOREIGN KEY(source_id,data_pointer) REFERENCES source_record(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_locale (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('ko','en')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  tense TEXT NOT NULL CHECK(tense IN ('past','present')),
  PRIMARY KEY(source_id,locale),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_category (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  category TEXT NOT NULL,
  PRIMARY KEY(source_id,ordinal),
  UNIQUE(source_id,category),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_source_ref (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  reference TEXT NOT NULL,
  PRIMARY KEY(source_id,ordinal),
  UNIQUE(source_id,reference),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_history (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  entry TEXT NOT NULL,
  PRIMARY KEY(source_id,ordinal),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_node (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  kind TEXT NOT NULL CHECK(kind IN ('heading','paragraph','quote','rule','code','list','table')),
  anchor TEXT NOT NULL,
  depth INTEGER,
  ordered INTEGER CHECK(ordered=1),
  list_start INTEGER CHECK(list_start>=0),
  language TEXT,
  info TEXT,
  PRIMARY KEY(source_id,json_pointer),
  UNIQUE(source_id,ordinal),
  UNIQUE(source_id,anchor),
  CHECK((kind='heading' AND depth BETWEEN 1 AND 6 AND depth IS NOT NULL) OR (kind<>'heading' AND depth IS NULL)),
  CHECK(kind='list' OR (ordered IS NULL AND list_start IS NULL)),
  CHECK((kind='code' AND language IS NOT NULL) OR (kind<>'code' AND language IS NULL AND info IS NULL)),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_list_item (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  node_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY(source_id,json_pointer),
  UNIQUE(source_id,node_pointer,ordinal),
  FOREIGN KEY(source_id,node_pointer) REFERENCES text_document_node(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_table_row (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  node_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY(source_id,json_pointer),
  UNIQUE(source_id,node_pointer,ordinal),
  UNIQUE(source_id,json_pointer,node_pointer),
  FOREIGN KEY(source_id,node_pointer) REFERENCES text_document_node(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_table_cell (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  node_pointer TEXT NOT NULL,
  row_pointer TEXT,
  cell_kind TEXT NOT NULL CHECK(cell_kind IN ('column','body')),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY(source_id,json_pointer),
  CHECK((cell_kind='column' AND row_pointer IS NULL) OR (cell_kind='body' AND row_pointer IS NOT NULL)),
  FOREIGN KEY(source_id,node_pointer) REFERENCES text_document_node(source_id,json_pointer),
  FOREIGN KEY(source_id,row_pointer,node_pointer) REFERENCES text_document_table_row(source_id,json_pointer,node_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_slot (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  node_pointer TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('ko','en')),
  representation TEXT NOT NULL CHECK(representation IN ('string','runs')),
  text TEXT NOT NULL,
  PRIMARY KEY(source_id,json_pointer),
  UNIQUE(source_id,json_pointer,locale),
  FOREIGN KEY(source_id,node_pointer) REFERENCES text_document_node(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_run (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  slot_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  text TEXT NOT NULL,
  strong INTEGER CHECK(strong=1),
  link_domain TEXT,
  link_slug TEXT,
  link_anchor TEXT,
  href TEXT,
  PRIMARY KEY(source_id,json_pointer),
  UNIQUE(source_id,slot_pointer,ordinal),
  CHECK((link_domain IS NULL AND link_slug IS NULL AND link_anchor IS NULL) OR (link_domain IS NOT NULL AND link_slug IS NOT NULL AND href IS NULL)),
  FOREIGN KEY(source_id,slot_pointer) REFERENCES text_document_slot(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_anchor (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('ko','en')),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  node_pointer TEXT NOT NULL,
  anchor TEXT NOT NULL,
  anchor_kind TEXT NOT NULL CHECK(anchor_kind IN ('authored','public','natural','inline')),
  published INTEGER NOT NULL CHECK(published IN (0,1)),
  PRIMARY KEY(source_id,locale,ordinal),
  FOREIGN KEY(source_id,node_pointer) REFERENCES text_document_node(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;

CREATE TABLE text_document_link (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  corpus_kind TEXT NOT NULL CHECK(corpus_kind IN ('current','historical','example')),
  locale TEXT NOT NULL CHECK(locale IN ('ko','en')),
  resolution TEXT NOT NULL CHECK(resolution IN ('external','gdd','missing-target','document','anchor','ambiguous-anchor','missing-anchor')),
  target_source_id INTEGER,
  target_anchor_ordinal INTEGER,
  PRIMARY KEY(source_id,json_pointer),
  FOREIGN KEY(source_id,json_pointer) REFERENCES text_document_run(source_id,json_pointer),
  FOREIGN KEY(source_id,corpus_kind) REFERENCES text_document(source_id,corpus_kind),
  FOREIGN KEY(target_source_id,corpus_kind) REFERENCES text_document(source_id,corpus_kind),
  FOREIGN KEY(target_source_id,locale,target_anchor_ordinal) REFERENCES text_document_anchor(source_id,locale,ordinal),
  CHECK((resolution IN ('external','gdd','missing-target') AND target_source_id IS NULL AND target_anchor_ordinal IS NULL) OR (resolution IN ('document','missing-anchor','ambiguous-anchor') AND target_source_id IS NOT NULL AND target_anchor_ordinal IS NULL) OR (resolution='anchor' AND target_source_id IS NOT NULL AND target_anchor_ordinal IS NOT NULL)),
  FOREIGN KEY(source_id,json_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;
