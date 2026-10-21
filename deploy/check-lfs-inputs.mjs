import { open } from 'node:fs/promises'

for (const [path, signature] of [
  ['data/canonical/wiki-cast.sqlite', Buffer.from('SQLite format 3\0')],
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
