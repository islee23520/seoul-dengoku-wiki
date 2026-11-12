#!/usr/bin/env node
// v3 fixed-facts freeze (plan .omo/plans/wiki-lore-rebuild-v3.md task 1).
// The v3 lore rebuild rewrites everything except these facts: person name, sex, recorded age/birth,
// family and clan membership, portrait images, Seoul geography and station names, the opening underground map.
// This tool extracts exactly those fields from data/sql (+ image hashes) so every v3 task can prove it kept them.
//   node scripts/pages/v3-fixed-facts.mjs --write   # (task 1 only) write docs/design/v3/fixed-facts.snapshot.json
//   node scripts/pages/v3-fixed-facts.mjs --check   # compare the current tree with the snapshot; exit 1 on any difference
// Env: SITE_SQL_DIR (default data/sql) to check a scratch copy.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SQL_DIR = path.resolve(process.env.SITE_SQL_DIR ?? path.join(REPO, 'data/sql'));
const SNAP = path.join(REPO, 'docs/design/v3/fixed-facts.snapshot.json');
const IMAGE_DIRS = ['public/portraits', 'artifacts/seoul-showcase/public/portraits', 'artifacts/seoul-showcase/public/history/portraits'];

function extract() {
  const db = new DatabaseSync(':memory:');
  for (const f of fs.readdirSync(SQL_DIR).filter((x) => x.endsWith('.sql')).sort()) db.exec(fs.readFileSync(path.join(SQL_DIR, f), 'utf8'));
  const all = (sql) => db.prepare(sql).all().map((r) => ({ ...r }));
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o && o[k] !== undefined).map((k) => [k, o[k]]));
  const kin = (j) => ['outgoing', 'incoming'].flatMap((d) => (j.relations?.[d] ?? []).filter((r) => r.type === 'Kinship').map((r) => ({ d, from: r.from, type: r.type, to: r.to })));
  // Kinship: who is kin to whom is fixed; the `basis` sentence is lore and is rewritten.
  const AGE = ['name', 'gender', 'birthDate', 'birthday', 'age', 'ageAsOf', 'generation', 'clan', 'characterId'];
  const details = new Map(all('SELECT * FROM person_detail').map((r) => [r.person_id, r]));
  const people = all('SELECT id, name, name_ko, gender, gender_ko FROM wiki_person ORDER BY id').map((p) => {
    const d = details.get(p.id);
    const en = d ? JSON.parse(d.json) : {};
    const ko = d ? JSON.parse(d.json_ko) : {};
    return { ...p, clan_id: d?.clan_id ?? null, en: { ...pick(en, AGE), kin: kin(en) }, ko: { ...pick(ko, AGE), kin: kin(ko) } };
  });
  const branchIds = (raw) => JSON.parse(raw).map((b) => ({ id: b.id, members: b.members ?? [] }));
  const clans = all('SELECT id, surname, surname_ko, bongwan, bongwan_ko, hanja, crest_motif, branches, branches_ko FROM clan ORDER BY id').map((c) => ({
    ...c, branches: branchIds(c.branches), branches_ko: branchIds(c.branches_ko),
  }));
  const NODE = ['id', 'personId', 'kind', 'name', 'nameEn', 'birthDate', 'deathDate'];
  const EDGE = ['id', 'from', 'to', 'type', 'parentRole'];
  const treeFacts = (raw) => { const j = JSON.parse(raw); return { nodes: (j.nodes ?? []).map((n) => pick(n, NODE)), edges: (j.edges ?? []).map((e) => pick(e, EDGE)) }; };
  const trees = all('SELECT clan_id, json, json_ko FROM family_tree ORDER BY clan_id').map((t) => ({ clan_id: t.clan_id, ...treeFacts(t.json), ko: treeFacts(t.json_ko) }));
  const images = {};
  for (const dir of IMAGE_DIRS) {
    const abs = path.join(REPO, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).sort()) images[`${dir}/${f}`] = crypto.createHash('sha256').update(fs.readFileSync(path.join(abs, f))).digest('hex');
  }
  // Portrait face: the face description that the portrait images were made from (the outfit and role are lore).
  const faces = {};
  const tokDir = path.join(REPO, 'public/portrait-tokens');
  if (fs.existsSync(tokDir)) for (const f of fs.readdirSync(tokDir).filter((x) => x.endsWith('.json')).sort()) {
    const t = JSON.parse(fs.readFileSync(path.join(tokDir, f), 'utf8'));
    faces[f] = { personId: t.personId, name: t.name, face: t.artProposal?.face ?? null, slotFace: t.slots?.face ?? null, image: t.image?.sha256 ?? null,
      identity: pick(t.identity ?? {}, ['name', 'gender', 'ethnicity', 'age', 'ageAsOf']) };
  }
  return {
    schema: 'v3-fixed-facts.4',
    faces,
    people,
    clans,
    clanMembers: all('SELECT clan_id, person_id, branch_id FROM clan_member ORDER BY clan_id, person_id'),
    nonKorean: all('SELECT id, surname, surname_ko, members FROM nonkorean_family ORDER BY id'),
    trees,
    images,
    geography: {
      regions: all('SELECT id, name, name_ko, district, district_ko, path, station_count, area_m2 FROM map_region ORDER BY id'),
      stations: all('SELECT id, name, name_ko, district, district_ko, x, y, degree, line_ids FROM map_station ORDER BY id'),
      edges: all('SELECT id, a, b, line_ids FROM map_edge ORDER BY id'),
      lines: all('SELECT id, name, name_ko, color FROM map_line ORDER BY id'),
      landmarks: all('SELECT id, region_id, x, y FROM map_landmark ORDER BY id'),
      titles: all('SELECT id, rank, name, name_ko, parent_id, county_ids, path FROM map_title ORDER BY id'),
      states: all('SELECT state_id, label_x, label_y, exclusive_districts FROM map_state ORDER BY state_id'),
      meta: all("SELECT key, value FROM map_meta WHERE key IN ('width','height','projection','attribution','attribution_ko','major_station_ids') ORDER BY key"),
      rail: crypto.createHash('sha256').update(JSON.stringify(all('SELECT * FROM map_rail ORDER BY id'))).digest('hex'),
      underground: crypto.createHash('sha256').update(JSON.stringify(all('SELECT * FROM map_underground ORDER BY station_id'))).digest('hex'),
    },
  };
}

// Ages may be ADDED for the 511 people who had none (plan task 8 rule); a recorded age may never change or disappear.
const ADDABLE = /^\$\.people\.\d+\.(en|ko)\.(birthDate|birthday|age|ageAsOf)$/;
function diff(a, b, at, out) {
  if (out.length >= 50) return;
  if (a === undefined && ADDABLE.test(at)) return;
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], `${at}.${k}`, out);
    return;
  }
  out.push(`${at}: ${JSON.stringify(a)?.slice(0, 80)} -> ${JSON.stringify(b)?.slice(0, 80)}`);
}

const mode = process.argv[2];
const now = extract();
// An added age must be the same in en and ko.
const ageMismatch = now.people.filter((p) => ['birthDate', 'birthday', 'age', 'ageAsOf'].some((k) => JSON.stringify(p.en[k]) !== JSON.stringify(p.ko[k]))).map((p) => p.id);
if (mode === '--write') {
  if (fs.existsSync(SNAP) && !process.argv.includes('--force')) throw new Error(`E_SNAPSHOT_EXISTS: ${SNAP} is frozen; it is written once (task 1)`);
  fs.mkdirSync(path.dirname(SNAP), { recursive: true });
  fs.writeFileSync(SNAP, `${JSON.stringify(now)}\n`);
  console.log(`wrote ${path.relative(REPO, SNAP)}: people ${now.people.length}, clans ${now.clans.length}, clanMembers ${now.clanMembers.length}, nonKorean ${now.nonKorean.length}, trees ${now.trees.length} (nodes ${now.trees.reduce((s, t) => s + t.nodes.length, 0)}, edges ${now.trees.reduce((s, t) => s + t.edges.length, 0)}), images ${Object.keys(now.images).length}, stations ${now.geography.stations.length}`);
} else if (mode === '--check') {
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  const out = [];
  diff(snap, now, '$', out);
  if (ageMismatch.length) out.push(...ageMismatch.slice(0, 20).map((id) => `${id}: age fields differ between en and ko`));
  if (out.length) { console.error(`E_FIXED_FACT_CHANGED (${out.length}${out.length >= 50 ? '+' : ''}):\n${out.join('\n')}`); process.exit(1); }
  console.log('fixed facts unchanged');
} else {
  console.error('usage: v3-fixed-facts.mjs --write | --check');
  process.exit(2);
}
