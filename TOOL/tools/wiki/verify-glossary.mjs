import fs from 'node:fs';
import path from 'node:path';

export function verifyGlossary(jsonPath, repoRoot) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const ids = new Set();
  const names = new Set();
  const errors = [];

  if (!Array.isArray(data)) {
    throw new Error('Glossary JSON must be an array');
  }

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    
    // JSON shape check
    const required = ['term_id', 'display_name_ko', 'reader_definition_ko', 'category', 'owner_path', 'allowed_context', 'aliases', 'status'];
    for (const req of required) {
      if (!(req in entry)) {
        errors.push(`Entry at index ${i} missing required field: ${req}`);
      }
    }

    if (ids.has(entry.term_id)) {
      errors.push(`Duplicate term_id: ${entry.term_id}`);
    }
    ids.add(entry.term_id);

    if (names.has(entry.display_name_ko)) {
      errors.push(`Duplicate display_name_ko: ${entry.display_name_ko}`);
    }
    names.add(entry.display_name_ko);

    // Existing owner path check
    if (entry.owner_path) {
      const fullPath = path.join(repoRoot, entry.owner_path);
      if (!fs.existsSync(fullPath)) {
        errors.push(`Owner path does not exist for term ${entry.term_id}: ${entry.owner_path}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Glossary validation failed:\n${errors.join('\n')}`);
  }

  return true;
}

// Allow running directly
if (process.argv[1] && process.argv[1].endsWith('verify-glossary.mjs')) {
  const repoRoot = path.resolve(process.argv[1], '../../../..');
  const jsonPath = path.join(repoRoot, 'LORE/glossary.json');
  try {
    verifyGlossary(jsonPath, repoRoot);
    console.log('Glossary validation passed.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
