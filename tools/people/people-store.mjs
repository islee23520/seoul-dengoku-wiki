#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { parse } from '@babel/parser';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const defaultDatabase = fileURLToPath(new URL('../../../snapshots/people.sqlite', import.meta.url));
const sourcePage = 'https://seoul-dengoku.linalab.io/wiki/people';

function literal(node) {
  if (node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'BooleanLiteral') return node.value;
  if (node.type === 'NullLiteral') return null;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(property => {
    if (property.type !== 'ObjectProperty' || property.computed) throw new Error('catalog contains executable property');
    return [property.key.name ?? property.key.value, literal(property.value)];
  }));
  throw new Error(`catalog contains executable value: ${node.type}`);
}

export function parseCatalog(source, kind) {
  const ast = parse(source, { sourceType: 'module' });
  const declaration = ast.program.body.find(node => node.type === 'VariableDeclaration');
  const value = literal(declaration.declarations[0].init);
  if (kind === 'people' ? !Array.isArray(value) : !Array.isArray(value.entries)) throw new Error('invalid catalog');
  return value;
}

export function openPeopleStore(path = defaultDatabase) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version !== 0 && version !== 1) { db.close(); throw new Error('unsupported people database schema'); }
  if (version === 1) { db.exec('PRAGMA foreign_keys=ON'); return db; }
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS sources(url TEXT PRIMARY KEY, sha256 TEXT NOT NULL, body TEXT NOT NULL, fetched_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS people(person_id TEXT PRIMARY KEY, character_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      gender TEXT, state_id TEXT, birth_date TEXT, age INTEGER, detail_url TEXT NOT NULL REFERENCES sources(url),
      catalog_json TEXT NOT NULL, detail_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS portraits(person_id TEXT PRIMARY KEY REFERENCES people(person_id), image_url TEXT NOT NULL,
      image_sha256 TEXT NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, approval TEXT NOT NULL,
      token_url TEXT NOT NULL REFERENCES sources(url), token_json TEXT NOT NULL);
    PRAGMA user_version=1;`);
  return db;
}

export function importPeopleSnapshot(db, { people, portraits, sources }) {
  const sourceMap = new Map(sources.map(source => [source.url, source]));
  const ids = new Set();
  const characters = new Set();
  for (const person of people) {
    if (!/^person-\d+$/.test(person.catalog.id) || person.detail.id !== person.catalog.id || person.detail.name !== person.catalog.name || person.detail.detailRoute !== `/people/${person.catalog.id}`) throw new Error('person identity mismatch');
    const characterId = person.detail.familyTree?.personId ?? person.detail.gurps?.id;
    if (!characterId || ids.has(person.catalog.id) || characters.has(characterId)) throw new Error('duplicate or missing permanent identity');
    if (!sourceMap.has(person.url) || JSON.stringify(JSON.parse(sourceMap.get(person.url).body)) !== JSON.stringify(person.detail)) throw new Error('missing or changed person source');
    ids.add(person.catalog.id); characters.add(characterId);
  }
  for (const portrait of portraits) {
    const person = people.find(person => person.catalog.id === portrait.entry.personId);
    if (!person || portrait.token.personId !== person.catalog.id || portrait.token.name !== person.catalog.name || portrait.token.characterId !== (person.detail.familyTree?.personId ?? person.detail.gurps?.id) || portrait.token.image.sha256 !== portrait.entry.imageSha256 || portrait.actualImageSha256 !== portrait.entry.imageSha256 || !sourceMap.has(portrait.tokenUrl)) throw new Error('portrait identity or hash mismatch');
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    const putSource = db.prepare('INSERT INTO sources VALUES (?, ?, ?, ?) ON CONFLICT(url) DO UPDATE SET sha256=excluded.sha256, body=excluded.body, fetched_at=excluded.fetched_at');
    for (const source of sources) putSource.run(source.url, sha256(source.body), source.body, source.fetchedAt);
    db.exec('DELETE FROM portraits; DELETE FROM people');
    const putPerson = db.prepare('INSERT INTO people VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const { catalog, detail, url } of people) putPerson.run(catalog.id, detail.familyTree?.personId ?? detail.gurps.id, catalog.name, catalog.gender ?? null, catalog.state ?? null, detail.birthDate ?? null, detail.age ?? null, url, JSON.stringify(catalog), JSON.stringify(detail));
    const putPortrait = db.prepare('INSERT INTO portraits VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const { entry, token, tokenUrl, imageUrl } of portraits) putPortrait.run(entry.personId, imageUrl, entry.imageSha256, token.image.width, token.image.height, entry.approval, tokenUrl, JSON.stringify(token));
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return verifyPeopleStore(db);
}

export function verifyPeopleStore(db) {
  if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('database integrity failure');
  if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('database source binding failure');
  for (const source of db.prepare('SELECT * FROM sources').all()) if (sha256(source.body) !== source.sha256) throw new Error('source hash mismatch');
  for (const row of db.prepare('SELECT p.detail_json, s.body FROM people p JOIN sources s ON s.url=p.detail_url').all()) if (JSON.stringify(JSON.parse(row.body)) !== row.detail_json) throw new Error('person source binding mismatch');
  for (const row of db.prepare('SELECT p.token_json, s.body FROM portraits p JOIN sources s ON s.url=p.token_url').all()) if (JSON.stringify(JSON.parse(row.body)) !== row.token_json) throw new Error('portrait source binding mismatch');
  return { people: db.prepare('SELECT count(*) AS count FROM people').get().count, portraits: db.prepare('SELECT count(*) AS count FROM portraits').get().count, sources: db.prepare('SELECT count(*) AS count FROM sources').get().count };
}

export function getPerson(db, id) {
  const row = db.prepare('SELECT * FROM people WHERE person_id=? OR character_id=?').get(id, id);
  if (!row) throw new Error(`unknown person ID: ${id}`);
  return { ...row, catalog: JSON.parse(row.catalog_json), detail: JSON.parse(row.detail_json), portrait: db.prepare('SELECT * FROM portraits WHERE person_id=?').get(row.person_id) ?? null };
}

export async function collectPublishedPeople() {
  const sources = [];
  async function text(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    const body = await response.text();
    sources.push({ url, body, fetchedAt: new Date().toISOString() });
    return body;
  }
  const page = await text(sourcePage);
  const indexPath = page.match(/src="([^"]+\/index-[^"]+\.js)"/)?.[1];
  if (!indexPath) throw new Error('wiki application index missing');
  const index = await text(new URL(indexPath, sourcePage).href);
  const peoplePath = index.match(/assets\/peopleCatalog-[\w-]+\.js/)?.[0];
  const portraitPath = index.match(/assets\/portrait-catalog-[\w-]+\.js/)?.[0];
  if (!peoplePath || !portraitPath) throw new Error('published catalogs missing');
  const base = new URL('/wiki/', sourcePage);
  const catalog = parseCatalog(await text(new URL(peoplePath, base).href), 'people');
  const portraitCatalog = parseCatalog(await text(new URL(portraitPath, base).href), 'portraits');
  const people = new Array(catalog.length);
  let next = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (next < catalog.length) {
      const index = next++;
      const item = catalog[index];
      const url = new URL(`person-details/${item.id}.json`, base).href;
      people[index] = { catalog: item, detail: JSON.parse(await text(url)), url };
    }
  }));
  const portraits = [];
  for (const entry of portraitCatalog.entries) {
    const tokenUrl = new URL(`portrait-tokens/${entry.personId}.json`, base).href;
    const token = JSON.parse(await text(tokenUrl));
    const imageUrl = new URL(`portraits/${entry.personId}.png`, base).href;
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`image missing: ${imageUrl}`);
    portraits.push({ entry, token, tokenUrl, imageUrl, actualImageSha256: sha256(Buffer.from(await response.arrayBuffer())) });
  }
  return { people, portraits, sources };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command = 'verify', id] = process.argv.slice(2);
  const at = process.argv.indexOf('--db');
  const path = at >= 0 ? resolve(process.argv[at + 1]) : defaultDatabase;
  let db;
  try {
    if (command === 'collect') {
      const snapshot = await collectPublishedPeople();
      db = openPeopleStore(path);
      console.log(JSON.stringify(importPeopleSnapshot(db, snapshot), null, 2));
    } else {
      db = openPeopleStore(path);
      if (command === 'get') console.log(JSON.stringify(getPerson(db, id), null, 2));
      else if (command === 'list') console.log(JSON.stringify(db.prepare('SELECT person_id, character_id, name, gender, state_id FROM people ORDER BY person_id').all(), null, 2));
      else if (command === 'verify') console.log(JSON.stringify(verifyPeopleStore(db), null, 2));
      else throw new Error('usage: collect | verify | list | get <person-or-character-ID> [--db path]');
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { db?.close(); }
}
