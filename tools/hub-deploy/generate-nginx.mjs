import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const source = resolve(process.argv[2])
const output = resolve(process.argv[3])
const nginx = await readFile(source, 'utf8')
const marker = '    location = /system-design/regions {'
const avatarModules = `    location ~ ^/avatar/.*\\.mjs$ {
        default_type application/javascript;
        try_files $uri =404;
    }

`

if (!nginx.includes(marker)) throw new Error('NGINX_AVATAR_INSERTION_MARKER_MISSING')
await writeFile(output, nginx.replace(marker, `${avatarModules}${marker}`))
