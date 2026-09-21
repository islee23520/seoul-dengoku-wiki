import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_PUBLIC_TERMS = ['수문호흡법', '차륜강체공', '강단호명법', '호위철벽진', '기록단절법', '죽검연환법', '연각권법', '공탄총검법', '감응조준법', '프롤로그', '부평역평의회'];

export const REQUIRED_TERM_CONTRACTS = {
  '감응조준법': { category: 'martial_school', owner_path: 'LORE/culture', aliases: ['렌즈숨'] },
};

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

  for (const term of REQUIRED_PUBLIC_TERMS) {
    if (!names.has(term)) errors.push(`Missing required public term: ${term}`);
  }

  for (const [term, expected] of Object.entries(REQUIRED_TERM_CONTRACTS)) {
    const entry = data.find((e) => e.display_name_ko === term);
    if (!entry) continue;
    if (entry.category !== expected.category) {
      errors.push(`Term ${term} category must be ${expected.category}, got ${entry.category}`);
    }
    if (entry.owner_path !== expected.owner_path) {
      errors.push(`Term ${term} owner_path must be ${expected.owner_path}, got ${entry.owner_path}`);
    }
    if (JSON.stringify(entry.aliases) !== JSON.stringify(expected.aliases)) {
      errors.push(`Term ${term} aliases must be exactly ${JSON.stringify(expected.aliases)}, got ${JSON.stringify(entry.aliases)}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Glossary validation failed:\n${errors.join('\n')}`);
  }

  return true;
}

// Allow running directly
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
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
