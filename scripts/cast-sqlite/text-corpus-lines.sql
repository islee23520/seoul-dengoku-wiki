CREATE TABLE text_line_document (
  source_id INTEGER PRIMARY KEY REFERENCES source_file(source_id),
  media_kind TEXT NOT NULL CHECK(media_kind IN ('markdown','csv','javascript-data')),
  line_count INTEGER NOT NULL CHECK(line_count >= 0),
  ends_with_newline INTEGER NOT NULL CHECK(ends_with_newline IN (0,1)),
  line_ending TEXT NOT NULL CHECK(line_ending IN ('lf','crlf','mixed','none')),
  CHECK(line_count > 0 OR (ends_with_newline = 0 AND line_ending = 'none')),
  CHECK(line_ending <> 'none' OR ends_with_newline = 0),
  CHECK(line_count <> 1 OR ends_with_newline = 1 OR line_ending = 'none')
) STRICT;

CREATE TABLE text_line (
  source_id INTEGER NOT NULL REFERENCES text_line_document(source_id),
  line_ordinal INTEGER NOT NULL CHECK(line_ordinal >= 0),
  text TEXT NOT NULL CHECK(instr(text, char(10)) = 0),
  line_kind TEXT NOT NULL CHECK(line_kind IN ('blank','heading','list','table','fence','quote','other')),
  heading_depth INTEGER,
  PRIMARY KEY(source_id,line_ordinal),
  CHECK((line_kind = 'heading' AND heading_depth IS NOT NULL AND heading_depth BETWEEN 1 AND 6)
    OR (line_kind <> 'heading' AND heading_depth IS NULL))
) STRICT;
