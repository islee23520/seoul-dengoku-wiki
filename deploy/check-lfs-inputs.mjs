import { open, readFile } from 'node:fs/promises'

for (const [path, signature] of [
  ['public/portraits/person-1017.png', Buffer.from('89504e470d0a1a0a', 'hex')],
]) {
  let file
  try {
    file = await open(path, 'r')
    const header = Buffer.alloc(signature.length)
    const { bytesRead } = await file.read(header, 0, header.length, 0)
    if (bytesRead !== header.length || !header.equals(signature)) throw new Error('invalid header')
  } catch {
    console.error(path)
    process.exitCode = 1
  } finally {
    await file?.close()
  }
}

try {
  const metadata = JSON.parse(await readFile('scripts/postgres-migration/schema-pg/metadata.json', 'utf8'))
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)
    || typeof metadata.migration_id !== 'string' || !metadata.migration_id.trim()
    || typeof metadata.code_commit !== 'string' || !/^[0-9a-f]{40}$/.test(metadata.code_commit)
    || typeof metadata.source_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(metadata.source_sha256)
    || metadata.schema_version !== 5
    || typeof metadata.generated_at !== 'string' || !Number.isFinite(Date.parse(metadata.generated_at))) {
    throw new Error('invalid metadata')
  }
} catch {
  console.error('scripts/postgres-migration/schema-pg/metadata.json: invalid or missing migration metadata')
  process.exitCode = 1
}
