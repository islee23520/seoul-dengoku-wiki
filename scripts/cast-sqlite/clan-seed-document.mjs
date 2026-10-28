import { createHash } from 'node:crypto';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_CLAN_SEED_DOCUMENT: ${detail}`), { code: 'E_CLAN_SEED_DOCUMENT' }); };
const fields = ['id','status','approvalStatus','note','position','clans'];
const text = value => typeof value === 'string' && value.length > 0;
function keys(value, expected) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || JSON.stringify(Object.keys(value)) !== JSON.stringify(expected)) fail('unknown, missing, or unordered fields');
}
function shape(document) {
  keys(document,fields);
  if (!fields.slice(0,-1).every(k => text(document[k])) || !Array.isArray(document.clans)) fail('document shape');
  for (const clan of document.clans) {
    keys(clan,['surname','bongwan','hangnyeol','keepRate']);
    if (!text(clan.surname) || !text(clan.bongwan) || !Array.isArray(clan.hangnyeol) || clan.hangnyeol.length !== 4
      || clan.hangnyeol.some(v => !text(v) || [...v].length !== 1)
      || typeof clan.keepRate !== 'number' || ![0.45,0.4,0.35,0.3,0.25].includes(clan.keepRate)) fail('clan shape');
  }
}
const receipt = (sourceHash,documentHash,actor,reason) => hash(JSON.stringify([sourceHash,documentHash,actor,reason]));

/** Import only the exact existing draft; normalization grants no approval. */
export function initializeClanSeedDocument(db, { schemaSql, sourceBytes, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql,actor,reason].every(v => typeof v === 'string' && v.trim())
    || !(sourceBytes instanceof Uint8Array)) fail('input');
  const document = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(sourceBytes));
  shape(document);
  const sourceHash = hash(sourceBytes);
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO clan_seed_document VALUES (1,?,?,?,?,?,?,?,?,?)')
      .run(sourceHash,document.id,document.status,document.approvalStatus,document.note,document.position,actor,reason,receipt(sourceHash,hash(JSON.stringify(document)),actor,reason));
    document.clans.forEach((clan,i) => {
      db.prepare('INSERT INTO clan_seed_clan VALUES (?,1,?,?,?)').run(i,clan.surname,clan.bongwan,String(clan.keepRate));
      clan.hangnyeol.forEach((syllable,j) => db.prepare('INSERT INTO clan_seed_syllable VALUES (?,?,?)').run(i,j,syllable));
    });
    readClanSeedDocument(db);
    db.exec('COMMIT');
    return { documents:1, clans:10, syllables:40, totalRows:51 };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

/** SELECT-only reconstruction: no source I/O, archive decoding, or JSON parsing. */
export function readClanSeedDocument(db) {
  const rows = db.prepare('SELECT * FROM clan_seed_document').all();
  if (rows.length !== 1) fail('document count');
  const row = rows[0];
  if (row.document_id !== 1 || !text(row.actor) || !row.actor.trim()
    || !text(row.reason) || !row.reason.trim()) fail('provenance');
  const clans = db.prepare('SELECT * FROM clan_seed_clan ORDER BY ordinal').all();
  const syllables = db.prepare('SELECT * FROM clan_seed_syllable ORDER BY clan_ordinal,ordinal').all();
  if (clans.some((c,i) => c.ordinal !== i || c.document_id !== 1)
    || syllables.length !== clans.length * 4 || syllables.some((s,i) => s.clan_ordinal !== Math.floor(i/4) || s.ordinal !== i%4)) fail('ordered coverage');
  const document = {
    id:row.id,status:row.status,approvalStatus:row.approval_status,note:row.note,position:row.position,
    clans:clans.map((c,i) => {
      const keepRate = Number(c.keep_rate_decimal);
      if (typeof c.keep_rate_decimal !== 'string' || String(keepRate) !== c.keep_rate_decimal) fail('decimal representation');
      return { surname:c.surname,bongwan:c.bongwan,hangnyeol:syllables.slice(i*4,i*4+4).map(s => s.syllable),keepRate };
    }),
  };
  shape(document);
  return document;
}
