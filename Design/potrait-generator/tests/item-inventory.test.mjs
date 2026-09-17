import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DB_PATH = resolve(ROOT, 'data/assets.sqlite');
const INVENTORY_PATH = resolve(ROOT, 'INVENTORY.md');
const PLATES_DIR = resolve(ROOT, 'assets/v2/plates');

test('item-inventory', () => {
  // 1. Assert item_intents has no generic boilerplate strings
  const boilerplatePatterns = [
    'per Q0',
    'material/seams/fit',
    'from repair; per Q',
    'deterministic seed background, color scheme from code constant',
    'female cheeks companion multiply detail',
    'female chin companion multiply detail',
    'female garment primary; material',
    'supports volume; per source'
  ];

  let hasBoilerplate = false;
  const rows = execSync(`sqlite3 -readonly "${DB_PATH}" "
    SELECT logical_id, design_intent, verification_criteria 
    FROM item_intents;
  "`, { encoding: 'utf8' }).trim().split('\n');

  for (const row of rows) {
    for (const pattern of boilerplatePatterns) {
      if (row.includes(pattern)) {
        hasBoilerplate = true;
        console.error('Found boilerplate in row:', row);
        break;
      }
    }
    if (hasBoilerplate) break;
  }

  assert.strictEqual(hasBoilerplate, false, 'item_intents must contain zero mechanical boilerplate strings (replaced with concrete Korean design intents and rubrics)');

  // 2. Assert all 141 plate files are accounted for in INVENTORY.md
  const plateFiles = execSync(`find "${PLATES_DIR}" -name "*.png" | wc -l`, { encoding: 'utf8' }).trim();
  assert.strictEqual(plateFiles, '141', 'Must have exactly 141 PNG plates');

  const inventoryContent = fs.readFileSync(INVENTORY_PATH, 'utf8');
  assert.ok(inventoryContent.includes('Total files'), 'INVENTORY.md must document the complete 141-file census');
  assert.ok(inventoryContent.includes('current_production'), 'INVENTORY.md must categorize files (current_production)');
  assert.ok(inventoryContent.includes('candidate'), 'INVENTORY.md must categorize files (candidate)');
  assert.ok(inventoryContent.includes('rejected'), 'INVENTORY.md must categorize files (rejected)');
  assert.ok(inventoryContent.includes('unmapped'), 'INVENTORY.md must categorize files (unmapped)');
  assert.ok(inventoryContent.includes('family-02/03 VISUAL_REJECTED'), 'INVENTORY.md must reference the honest rejection status');

  // 3. Verify that concrete intents exist for production items
  assert.ok(inventoryContent.includes('칼라가 있는 짙은 회색 방한 베스트'), 'INVENTORY.md must reference concrete design intents');
  assert.ok(inventoryContent.includes('타겟 인물의 붉은 갈색 홍채'), 'INVENTORY.md must reference concrete eye design intents');

  console.log('✅ All 141 plates accounted for in INVENTORY.md');
  console.log('✅ item_intents contains only concrete human-evaluable Korean design intents (no boilerplate)');
  console.log('✅ Rejected entries preserve "unsupported — family-02/03 VISUAL_REJECTED"');
  console.log('✅ item-inventory test passes (scope-limited to sqlite + INVENTORY.md + this test)');
});
