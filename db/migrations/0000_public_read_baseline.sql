-- Baseline: the public read contract of schema `wiki`.
-- Existing tables come from scripts/postgres-migration/schema-pg (loaded before
-- drizzle was adopted); this migration only fixes the access policy so that
-- every current and future wiki table is anonymously readable through
-- /wiki/api/tables, while wiki_private stays closed to the public reader.
GRANT USAGE ON SCHEMA wiki TO wiki_reader;
--> statement-breakpoint
GRANT SELECT ON ALL TABLES IN SCHEMA wiki TO wiki_reader;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA wiki GRANT SELECT ON TABLES TO wiki_reader;
--> statement-breakpoint
REVOKE ALL ON SCHEMA wiki_private FROM wiki_reader;
