import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { allowedPath, check, cli, fileAt, fingerprint, integrity, noLinks, portable, same } from './backup-common.mjs';

export async function verifyBackup({ backup }) {
	check(backup, '--backup required');
	backup = resolve(await noLinks(backup));
	const manifest = JSON.parse(await readFile(await fileAt(backup, 'manifest.json'), 'utf8'));
	check(manifest.version === 1 && manifest.complete === true && typeof manifest.profile === 'string' && Array.isArray(manifest.files) && manifest.files.length && Array.isArray(manifest.models), 'Invalid/incomplete manifest');
	const expected = new Set(['manifest.json']);
	const folded = new Set();
	for (const entry of manifest.files) {
		allowedPath(entry.path);
		check(!folded.has(entry.path.toLowerCase()), 'Duplicate backup path');
		folded.add(entry.path.toLowerCase());
		check(/^[a-f0-9]{64}$/.test(entry.sha256) && Number.isSafeInteger(entry.bytes) && entry.bytes >= 0, 'Invalid full hash/size');
		check(['static', 'sqlite', 'prior-bkp', 'local-model'].includes(entry.kind), 'Invalid kind');
		check(!/\.bkp$/i.test(entry.path) || entry.kind === 'prior-bkp', 'Original bkp identity lost');
		const path = await fileAt(backup, `files/${entry.path}`);
		check(same(entry, await fingerprint(path)), 'Backup hash/size mismatch');
		if (entry.kind === 'sqlite') {
			check(entry.method === 'sqlite-online-backup', 'Invalid SQLite method');
			check(JSON.stringify(integrity(path)) === JSON.stringify(entry.metadata), 'SQLite metadata mismatch');
		} else {
			check(entry.method === 'stable-static' && entry.stableCutoff === true && same(entry, entry.before ?? {}) && same(entry, entry.after ?? {}), 'Invalid static capture receipt');
		}
		expected.add(`files/${entry.path}`);
	}
	for (const model of manifest.models) {
		portable(model.rootRef);
		allowedPath(model.path);
		check(/\.models$/.test(model.rootRef) && /^[a-f0-9]{64}$/.test(model.sha256) && Number.isSafeInteger(model.bytes) && model.bytes >= 0, 'Invalid model reference');
	}
	async function walk(path = '') {
		for (const entry of await readdir(join(backup, path), { withFileTypes: true })) {
			const name = path ? `${path}/${entry.name}` : entry.name;
			check(!entry.isSymbolicLink(), 'Backup symlink forbidden');
			if (entry.isDirectory()) { check([...expected].some(p => p.startsWith(`${name}/`)), 'Unexpected backup directory'); await walk(name); }
			else { check(entry.isFile() && expected.has(name), 'Unexpected backup file'); }
		}
	}
	await walk();
	return manifest;
}

await cli(import.meta.url, ['backup'], async args => {
	const manifest = await verifyBackup(args);
	return { verified: true, files: manifest.files.length, modelsReferenced: manifest.models.length };
});
