const fail = () => { throw new Error('E_FAMILY_KEY_ORDER'); };

export function initializeFamilyKeyOrder(db, bytes) {
  if (!(bytes instanceof Uint8Array) || db.isTransaction) fail();
  const source = JSON.parse(Buffer.from(bytes).toString());
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE family_input_key_order (
      node_id TEXT NOT NULL, object_path TEXT NOT NULL, ordinal INTEGER NOT NULL,
      key TEXT NOT NULL, PRIMARY KEY(node_id,object_path,ordinal), UNIQUE(node_id,object_path,key)) STRICT;`);
    const insert = db.prepare('INSERT INTO family_input_key_order VALUES(?,?,?,?)');
    const visit = (id, value, path) => {
      if (Array.isArray(value)) value.forEach((child, i) => visit(id, child, `${path}/${i}`));
      else if (value && typeof value === 'object') Object.entries(value).forEach(([key, child], ordinal) => {
        insert.run(id, path, ordinal, key); visit(id, child, `${path}/${key}`);
      });
    };
    for (const node of source.nodes) visit(node.id, node, '');
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function orderFamilyNodes(db, nodes) {
  const groups = new Map();
  for (const row of db.prepare('SELECT * FROM family_input_key_order ORDER BY node_id,object_path,ordinal').all()) {
    const key = `${row.node_id}:${row.object_path}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const visit = (id, value, path) => {
    if (Array.isArray(value)) return value.map((child, i) => visit(id, child, `${path}/${i}`));
    if (!value || typeof value !== 'object') return value;
    const key = `${id}:${path}`, rows = groups.get(key);
    if (!rows || rows.length !== Object.keys(value).length || rows.some((r, i) => r.ordinal !== i || !Object.hasOwn(value, r.key))) fail();
    groups.delete(key);
    return Object.fromEntries(rows.map(row => [row.key, visit(id, value[row.key], `${path}/${row.key}`)]));
  };
  const result = nodes.map(node => visit(node.id, node, ''));
  if (groups.size) fail();
  return result;
}
