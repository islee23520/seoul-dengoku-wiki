// drizzle-kit configuration for reviewed SQL migrations of the wiki schema.
// Create a migration:  npx drizzle-kit generate --custom --name <change>
// then write its SQL, open a pull request, and let the host applier run
// scripts/db-migrate.mjs after the merge. Never apply table changes by hand.
export default {
  dialect: 'postgresql',
  schema: './db/schema.mjs',
  out: './db/migrations',
  migrations: { schema: 'wiki_migrations', table: '__drizzle_migrations' },
};
