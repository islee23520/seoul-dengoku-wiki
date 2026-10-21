-- Explicit v1 -> v2 private migration. Each revision owns named typed domain rows.
-- Revision zero preserves imported approval evidence; successors are always drafts.
CREATE TABLE soul_edit_revision (
  revision_id INTEGER PRIMARY KEY CHECK(revision_id>=0),
  parent_revision INTEGER REFERENCES soul_edit_revision(revision_id),
  source_sha256 TEXT NOT NULL,
  snapshot_sha256 TEXT NOT NULL,
  assignment_count INTEGER NOT NULL CHECK(assignment_count=1022),
  status TEXT NOT NULL CHECK(status IN ('imported','draft')),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  initialized_at TEXT NOT NULL,
  person_id TEXT REFERENCES soul_identity(person_id),
  CHECK((revision_id=0 AND parent_revision IS NULL AND status='imported' AND person_id IS NULL)
    OR (revision_id>0 AND parent_revision=revision_id-1 AND status='draft' AND person_id IS NOT NULL))
) STRICT;
CREATE TABLE soul_head (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  revision_id INTEGER NOT NULL REFERENCES soul_edit_revision(revision_id)
) STRICT;
CREATE TABLE soul_edit_initialization (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  actor TEXT NOT NULL,
  reason TEXT NOT NULL,
  initialized_at TEXT NOT NULL
) STRICT;
CREATE TRIGGER soul_edit_revision_no_update BEFORE UPDATE ON soul_edit_revision BEGIN SELECT RAISE(ABORT,'immutable soul revision'); END;
CREATE TRIGGER soul_edit_revision_no_delete BEFORE DELETE ON soul_edit_revision BEGIN SELECT RAISE(ABORT,'immutable soul revision'); END;
CREATE TRIGGER soul_edit_initialization_no_update BEFORE UPDATE ON soul_edit_initialization BEGIN SELECT RAISE(ABORT,'immutable soul initialization'); END;
CREATE TRIGGER soul_edit_initialization_no_delete BEFORE DELETE ON soul_edit_initialization BEGIN SELECT RAISE(ABORT,'immutable soul initialization'); END;
CREATE TRIGGER soul_revision_no_update BEFORE UPDATE ON soul_revision BEGIN SELECT RAISE(ABORT,'immutable soul import'); END;
CREATE TRIGGER soul_revision_no_delete BEFORE DELETE ON soul_revision BEGIN SELECT RAISE(ABORT,'immutable soul import'); END;
CREATE TRIGGER soul_identity_no_insert BEFORE INSERT ON soul_identity BEGIN SELECT RAISE(ABORT,'immutable soul identity'); END;
CREATE TRIGGER soul_identity_no_update BEFORE UPDATE ON soul_identity BEGIN SELECT RAISE(ABORT,'immutable soul identity'); END;
CREATE TRIGGER soul_identity_no_delete BEFORE DELETE ON soul_identity BEGIN SELECT RAISE(ABORT,'immutable soul identity'); END;
CREATE TRIGGER soul_head_no_delete BEFORE DELETE ON soul_head BEGIN SELECT RAISE(ABORT,'required soul head'); END;
CREATE TRIGGER soul_head_successor BEFORE UPDATE ON soul_head BEGIN
  SELECT CASE WHEN NEW.singleton<>OLD.singleton OR NEW.revision_id<>OLD.revision_id+1
    THEN RAISE(ABORT,'invalid soul successor') END;
END;
