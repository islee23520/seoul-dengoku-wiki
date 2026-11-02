import { constants } from 'node:fs';
import { copyFile, mkdir, writeFile, lstat, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { DatabaseSync, backup as sqliteBackup } from 'node:sqlite';
import { check, cli, destination, fileAt, fingerprint, integrity, loadProfile, same } from './backup-common.mjs';

export async function backup({ profile, output, config = process.env.LOCAL_AI_BACKUP_CONFIG }) {
	check(profile && output, '--profile and --output required');
	const ctx = await loadProfile(config, profile);
	for (const model of ctx.selected.models) {
		check(same(model, await fingerprint(await fileAt(ctx.roots[model.rootRef], model.path))), 'Immutable model missing or mismatched');
	}
	output = await destination(ctx, output, 'backupRoot');
	// Never reuse or overwrite a snapshot, including an earlier failed snapshot.
	await mkdir(output, { mode: 0o700 });
	const manifest = { version: 1, profile, complete: false, createdAt: new Date().toISOString(), files: [], models: ctx.selected.models.map(e => ({ rootRef: e.rootRef, path: e.path, sha256: e.sha256, bytes: e.bytes })) };
	for (const entry of ctx.selected.files) {
		const source = await fileAt(ctx.roots[entry.rootRef], entry.path);
		const path = `${entry.rootRef}/${entry.path}`;
		const target = join(output, 'files', path);
		await mkdir(dirname(target), { recursive: true, mode: 0o700 });
		let receipt;
		if (entry.kind === 'sqlite') {
			const db = new DatabaseSync(source, { readOnly: true });
			try { await sqliteBackup(db, target); } finally { db.close(); }
			// The online snapshot can inherit WAL mode. Make the isolated output
			// self-contained before hashing; never ship or restore WAL/SHM files.
			const snapshot = new DatabaseSync(target);
			try { snapshot.exec('PRAGMA journal_mode=DELETE'); } finally { snapshot.close(); }
			receipt = { method: 'sqlite-online-backup', metadata: integrity(target) };
		} else {
			const handle = await open(source, 'r');
			try {
				const header = Buffer.alloc(16);
				await handle.read(header, 0, 16, 0);
				check(entry.kind === 'prior-bkp' || header.toString() !== 'SQLite format 3\0', 'SQLite bytes require online backup');
			} finally { await handle.close(); }
			const beforeStat = await lstat(source, { bigint: true });
			const before = await fingerprint(source);
			await copyFile(source, target, constants.COPYFILE_EXCL);
			const copied = await fingerprint(target);
			await fileAt(ctx.roots[entry.rootRef], entry.path);
			const after = await fingerprint(source);
			const afterStat = await lstat(source, { bigint: true });
			check(same(before, copied) && same(before, after) && beforeStat.ino === afterStat.ino && beforeStat.mtimeNs === afterStat.mtimeNs && beforeStat.ctimeNs === afterStat.ctimeNs, 'Static source changed: incomplete snapshot');
			receipt = { method: 'stable-static', before, after, stableCutoff: true };
		}
		manifest.files.push({ path, kind: entry.kind, ...await fingerprint(target), ...receipt });
	}
	manifest.complete = true;
	// Publication is last: interrupted captures have no complete manifest.
	await writeFile(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
	return { complete: true, files: manifest.files.length, modelsReferenced: manifest.models.length };
}

await cli(import.meta.url, ['profile', 'output', 'config'], backup);
