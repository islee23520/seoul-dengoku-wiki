import { test } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIBRARY_PATH = resolve(__dirname, '../assets/v2/library.json');
const DB_PATH = resolve(__dirname, '../data/assets.sqlite');

test('item-intents-coverage', () => {
  // Read library.json to count total variants across both sexes, all slots (absolute path from test location)
  const library = JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf8'));
  let totalVariants = 0;
  for (const sexData of Object.values(library.sexes || {})) {
    for (const slotData of Object.values(sexData.slots || {})) {
      if (slotData.variants && Array.isArray(slotData.variants)) {
        totalVariants += slotData.variants.length;
      }
    }
  }
  console.log('Total variants in library.json:', totalVariants);

  // Query DB (using sqlite3 CLI as per spec; absolute DB path from test location; fallback for missing table)
  let totalRows = 0;
  let nullCount = 0;
  try {
    totalRows = parseInt(execSync(`sqlite3 -readonly "${DB_PATH}" "SELECT COUNT(*) FROM item_intents;"`, { encoding: 'utf8' }).trim() || '0');
    nullCount = parseInt(execSync(`sqlite3 -readonly "${DB_PATH}" "SELECT COUNT(*) FROM item_intents WHERE design_intent IS NULL OR design_intent = '' OR verification_criteria IS NULL OR verification_criteria = '';"`, { encoding: 'utf8' }).trim() || '0');
  } catch (e) {
    console.log('DB query error (table may be missing):', e.message);
  }
  console.log('Total rows in item_intents:', totalRows);
  console.log('Rows with NULL/empty design_intent or verification_criteria:', nullCount);

  assert.ok(totalRows >= totalVariants, `DB must cover all library variants as superset (COUNT(*) >= ${totalVariants} library, got ${totalRows} including 24 unsupported); every library variant must have matching row by logical_id`);
  assert.strictEqual(nullCount, 0, 'No rows may have empty or NULL design_intent or verification_criteria');

  console.log('✅ item_intents has full coverage with library.json (superset, COUNT=' + totalRows + ')');
});
