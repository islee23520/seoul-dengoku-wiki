CREATE TABLE excluded_source (
  logical_path TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL CHECK(length(sha256)=64 AND sha256 NOT GLOB '*[^0-9a-f]*'),
  byte_length INTEGER NOT NULL CHECK(byte_length>=0),
  exclusion_reason TEXT NOT NULL CHECK(exclusion_reason IN (
    'private-character-system-contract',
    'private-editorial-sample',
    'private-editorial-scope-review',
    'private-editorial-owner-approval-pending',
    'private-soul-historical-motif'
  ))
) STRICT;
