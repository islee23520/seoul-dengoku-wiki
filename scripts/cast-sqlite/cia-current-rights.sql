CREATE TABLE current_right_retirement (
  kind TEXT NOT NULL CHECK(kind IN ('title','grant')),
  right_id TEXT NOT NULL,
  decision_ref TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY(kind,right_id)
) STRICT;
CREATE TABLE current_region_disposition (
  region_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK(status='unassigned'),
  decision_ref TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TRIGGER current_right_retirement_no_update BEFORE UPDATE ON current_right_retirement BEGIN SELECT RAISE(ABORT,'immutable current rights decision'); END;
CREATE TRIGGER current_right_retirement_no_delete BEFORE DELETE ON current_right_retirement BEGIN SELECT RAISE(ABORT,'immutable current rights decision'); END;
CREATE TRIGGER current_region_disposition_no_update BEFORE UPDATE ON current_region_disposition BEGIN SELECT RAISE(ABORT,'immutable current territory decision'); END;
CREATE TRIGGER current_region_disposition_no_delete BEFORE DELETE ON current_region_disposition BEGIN SELECT RAISE(ABORT,'immutable current territory decision'); END;
