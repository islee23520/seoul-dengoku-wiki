import { readFile, mkdir, writeFile, rename, rm, open } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

function validateCharacter(character) {
  if (!character || typeof character !== 'object' || Array.isArray(character) ||
      !['id', 'name'].every(key => typeof character[key] === 'string' && character[key].trim()) ||
      !['남', '여', '남성', '여성'].includes(character.gender)) throw new Error('stable cast id, name and authored gender required');
}

export const castStorePath = () => join(process.env.HOME || process.env.USERPROFILE || homedir(), '.seoul-cast', 'characters.json');
export async function readCastStore(path = castStorePath()) {
  let store;
  try { store = JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { characters: [] }; throw error; }
  if (!store || typeof store !== 'object' || Array.isArray(store) || !Array.isArray(store.characters)) throw new Error('invalid cast store shape');
  const ids = new Set();
  for (const character of store.characters) {
    validateCharacter(character);
    if (ids.has(character.id)) throw new Error('duplicate cast ID in store: ' + character.id);
    ids.add(character.id);
  }
  return store;
}
export async function getCast(id, path = castStorePath()) {
  const matches = (await readCastStore(path)).characters.filter(character => character.id === id);
  if (matches.length !== 1) throw new Error('cast ID must resolve exactly once: ' + id);
  const character = matches[0];
  if (!character.name || !['남', '여', '남성', '여성'].includes(character.gender)) throw new Error('cast name and authored gender required');
  return character;
}
export async function registerCast(character, path = castStorePath()) {
  validateCharacter(character);
  await mkdir(dirname(path), { recursive: true });
  const lockPath = path + '.lock';
  let lock;
  try { lock = await open(lockPath, 'wx'); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('cast store registration busy: ' + path); throw error; }
  const temporary = path + '.' + randomUUID() + '.tmp';
  try {
    const store = await readCastStore(path);
    if (store.characters.some(existing => existing.id === character.id)) throw new Error('cast ID already registered: ' + character.id);
    store.characters.push(character);
    await writeFile(temporary, JSON.stringify(store, null, 2) + '\n', { flag: 'wx' });
    await rename(temporary, path);
    return character;
  } finally {
    await rm(temporary, { force: true });
    await lock.close();
    await rm(lockPath);
  }
}
